import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { TenantAccount } from '../types';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const secondaryApp = initializeApp(firebaseConfig, "Secondary");
const secondaryAuth = getAuth(secondaryApp);


interface TenantContextType {
  currentUser: TenantAccount | null;
  activeTenantId: string;
  setActiveTenantId: (id: string | null) => void;
  viewingTenantId: string | null;
  setViewingTenantId: (id: string | null) => void;
  viewTenant: (tenantId: string) => void;
  returnToMasterAdmin: () => void;
  tenants: TenantAccount[];
  login: (username: string, pass: string) => Promise<{ success: boolean; message?: string; user?: TenantAccount }>;
  logout: () => void;
  createTenant: (data: {
    username: string;
    password: string;
    gymName: string;
    ownerName: string;
    phone: string;
    expireDate: string;
    notes?: string;
    maxClients?: number;
  }) => Promise<{ success: boolean; message: string }>;
  updateTenant: (id: string, updates: Partial<TenantAccount>) => Promise<void>;
  extendTenant: (id: string, monthsToAdd: number) => Promise<void>;
  deleteTenant: (id: string) => Promise<void>;
  isMasterAdmin: boolean;
}

const STORAGE_TENANT_KEY = 'nb_gym_tenant_accounts_v1';
const STORAGE_USER_SESSION_KEY = 'nb_gym_current_user_session';

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<TenantAccount | null>(() => {
    try {
      const explicitLogout = localStorage.getItem('nb_gym_explicit_logout');
      if (explicitLogout === 'true') {
        return null;
      }
      const saved = localStorage.getItem(STORAGE_USER_SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [tenants, setTenants] = useState<TenantAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_TENANT_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const isMasterAdmin = currentUser?.role === 'admin' || currentUser?.username?.toLowerCase() === 'admin' || currentUser?.tenantId === 'master-admin';

  // viewingTenantId is strictly null by default (Root Master mode or normal tenant)
  // NEVER restore or persist viewingTenantId in localStorage so that F5/login always starts at root
  const [viewingTenantId, setViewingTenantId] = useState<string | null>(null);

  const rootTenantId = currentUser?.tenantId || (isMasterAdmin ? 'master-admin' : 'default');
  const activeTenantId = (isMasterAdmin && viewingTenantId) ? viewingTenantId : rootTenantId;

  const isAutoReauthingRef = useRef<boolean>(false);
  const unsubSnapshotRef = useRef<(() => void) | null>(null);

  const setActiveTenantId = (id: string | null) => {
    if (isMasterAdmin) {
      if (!id || id === 'default' || id === 'master-admin' || id === currentUser?.tenantId) {
        setViewingTenantId(null);
      } else {
        setViewingTenantId(id);
      }
    } else {
      setViewingTenantId(null);
    }
  };

  const viewTenant = (tenantId: string) => {
    if (isMasterAdmin) {
      if (!tenantId || tenantId === 'default' || tenantId === 'master-admin' || tenantId === currentUser?.tenantId) {
        setViewingTenantId(null);
      } else {
        setViewingTenantId(tenantId);
      }
    }
  };

  const returnToMasterAdmin = () => {
    setViewingTenantId(null);
  };

  // Synchronize session state to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_USER_SESSION_KEY, JSON.stringify(currentUser));
      localStorage.setItem('nb_gym_auth', 'true');
      localStorage.setItem('nb_gym_user', currentUser.username);
      localStorage.removeItem('nb_gym_explicit_logout');
    }
  }, [currentUser, isMasterAdmin]);

  // Validate session against cloud on mount & auto-reconnect Firebase Auth across devices
  useEffect(() => {
    if (!db) return;
    
    const unsubAuth = auth.onAuthStateChanged(async user => {
      const explicitLogout = localStorage.getItem('nb_gym_explicit_logout') === 'true';
      const hasSavedSession = Boolean(localStorage.getItem(STORAGE_USER_SESSION_KEY));

      if (explicitLogout || !hasSavedSession) {
        if (unsubSnapshotRef.current) {
          unsubSnapshotRef.current();
          unsubSnapshotRef.current = null;
        }
        if (user) {
          auth.signOut().catch(() => {});
        }
        return;
      }

      if (user) {
        try {
          const email = user.email || '';
          let tenantId = 'default';
          if (email === 'admin@nbgym.com') {
            tenantId = 'master-admin';
          } else if (email) {
            const emailDoc = await getDoc(doc(db, 'registered_emails', email)).catch(() => null);
            if (emailDoc && emailDoc.exists()) {
               tenantId = emailDoc.data().tenantId;
            }
          }
          
          let isAdmin = false;
          if (tenantId === 'master-admin' || email === 'admin@nbgym.com') {
             isAdmin = true;
          } else if (tenantId !== 'default') {
             const accDoc = await getDoc(doc(db, 'tenant_accounts', tenantId)).catch(() => null);
             if (accDoc && accDoc.exists() && accDoc.data().role === 'admin') {
                isAdmin = true;
             }
          }

          if (unsubSnapshotRef.current) {
            unsubSnapshotRef.current();
            unsubSnapshotRef.current = null;
          }

          if (isAdmin) {
            unsubSnapshotRef.current = onSnapshot(collection(db, 'tenant_accounts'), (snapshot) => {
              if (snapshot.empty) {
                // If master admin collection empty, ensure master admin exists
                const defaultAdmin: TenantAccount = {
                  id: 'master-admin',
                  tenantId: 'master-admin',
                  username: 'admin',
                  password: '966966966',
                  gymName: 'NBFit Master',
                  ownerName: 'Admin Chủ Phòng',
                  phone: '0935244966',
                  role: 'admin',
                  status: 'active',
                  createdAt: '2026-01-01',
                  expireDate: '2099-12-31',
                  notes: 'Tài khoản Quản trị viên Master'
                };
                setTenants([defaultAdmin]);
              } else {
                const list = snapshot.docs.map(d => d.data() as TenantAccount);
                setTenants(list);
                localStorage.setItem(STORAGE_TENANT_KEY, JSON.stringify(list));

                setCurrentUser(prev => {
                  if (prev) {
                    const updatedSelf = list.find(t => t.username?.toLowerCase() === prev.username.toLowerCase() || t.id === prev.id);
                    if (updatedSelf) {
                      if (updatedSelf.password !== prev.password) {
                        auth.signOut().catch(() => {});
                        localStorage.removeItem('nb_gym_session_id');
                        return null;
                      }
                      return updatedSelf;
                    }
                    return prev;
                  }
                  return null;
                });
              }
            }, (err) => {
              console.warn("Tenant onSnapshot error, falling back to local cache:", err);
            });
          } else if (tenantId !== 'default') {
            unsubSnapshotRef.current = onSnapshot(doc(db, 'tenant_accounts', tenantId), (docSnap) => {
               if (docSnap.exists()) {
                  const t = docSnap.data() as TenantAccount;
                  setTenants([t]);
                  localStorage.setItem(STORAGE_TENANT_KEY, JSON.stringify([t]));
                  
                  setCurrentUser(prev => {
                    if (prev) {
                      if (t.password !== prev.password) {
                        auth.signOut().catch(() => {});
                        localStorage.removeItem('nb_gym_session_id');
                        return null;
                      }
                      return t;
                    }
                    return null;
                  });
               }
            }, (err) => {
              console.warn("Tenant onSnapshot error:", err);
            });
          }
        } catch (e: any) {
          console.error("Tenant sync init error:", e);
        }
      } else {
        if (unsubSnapshotRef.current) {
          unsubSnapshotRef.current();
          unsubSnapshotRef.current = null;
        }

        // If auth user is null but we have active currentUser in storage (e.g. reopened phone browser)
        const explicitLogout = localStorage.getItem('nb_gym_explicit_logout') === 'true';
        const savedSession = localStorage.getItem(STORAGE_USER_SESSION_KEY);
        if (!explicitLogout && savedSession && !isAutoReauthingRef.current) {
          try {
            const parsed = JSON.parse(savedSession) as TenantAccount;
            if (parsed?.username && parsed?.password) {
              isAutoReauthingRef.current = true;
              console.log("Auto-reauthenticating Firebase Auth across devices for:", parsed.username);
              const userEmail = parsed.username.includes('@') ? parsed.username.toLowerCase() : `${parsed.username.toLowerCase()}@nbgym.com`;
              setPersistence(auth, browserLocalPersistence).then(() => {
                return signInWithEmailAndPassword(auth, userEmail, parsed.password);
              }).then(() => {
                isAutoReauthingRef.current = false;
              }).catch((err: any) => {
                isAutoReauthingRef.current = false;
                console.warn("Auto-reauth failed:", err?.code, err?.message);
                if (err?.code === 'auth/wrong-password' || err?.code === 'auth/user-not-found' || err?.code === 'auth/invalid-credential') {
                  logout();
                }
              });
            }
          } catch (e) {
            isAutoReauthingRef.current = false;
          }
        }
      }
    });

    return () => {
      unsubAuth();
      if (unsubSnapshotRef.current) {
        unsubSnapshotRef.current();
        unsubSnapshotRef.current = null;
      }
    };
  }, []);

  // Login handler
  const login = async (inputUser: string, inputPass: string) => {
    const cleanUser = inputUser.trim().toLowerCase();
    const cleanPass = inputPass.trim();

    if (!cleanUser || !cleanPass) {
      return { success: false, message: 'Vui lòng nhập đầy đủ tài khoản và mật khẩu!' };
    }

    const userEmail = cleanUser.includes('@') ? cleanUser : cleanUser + '@nbgym.com';
      
    // 1. Try to authenticate with Firebase Auth using persistent local cache (IndexedDB/LocalStorage)
    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithEmailAndPassword(auth, userEmail, cleanPass);
    } catch (e: any) {
      console.warn("Firebase auth login failed:", e.code, e.message);
      
      // Auto-bootstrap master admin if first time logging in with admin credentials
      if ((cleanUser === 'admin' || userEmail === 'admin@nbgym.com') && cleanPass === '966966966') {
        try {
          await createUserWithEmailAndPassword(auth, 'admin@nbgym.com', '966966966');
        } catch (createErr: any) {
          if (createErr.code === 'auth/email-already-in-use') {
            return { success: false, message: 'Sai mật khẩu tài khoản Admin. Mật khẩu mặc định là 966966966' };
          }
        }
      } else {
        if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential' || e.code === 'auth/wrong-password') {
          return { success: false, message: 'Tài khoản hoặc mật khẩu không chính xác! Vui lòng kiểm tra lại.' };
        } else if (e.code === 'auth/too-many-requests') {
          return { success: false, message: 'Đăng nhập thất bại quá nhiều lần. Vui lòng thử lại sau ít phút!' };
        }
        return { success: false, message: 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản và mật khẩu!' };
      }
    }

    // 2. After auth succeeds, fetch account from Firestore
    let account: TenantAccount | null = null;
    try {
      const emailDoc = await getDoc(doc(db, 'registered_emails', userEmail));
      if (emailDoc.exists()) {
        const tId = emailDoc.data().tenantId;
        const accDoc = await getDoc(doc(db, 'tenant_accounts', tId));
        if (accDoc.exists()) {
          account = accDoc.data() as TenantAccount;
        }
      }
    } catch (e: any) {
      console.warn("Error fetching account after login:", e);
    }

    // If master admin, auto-create/ensure account doc exists
    if (!account && (cleanUser === 'admin' || userEmail === 'admin@nbgym.com')) {
      account = {
        id: 'master-admin',
        tenantId: 'master-admin',
        username: 'admin',
        password: cleanPass,
        gymName: 'NBFit Master',
        ownerName: 'Admin Chủ Phòng',
        phone: '0935244966',
        role: 'admin',
        status: 'active',
        createdAt: '2026-01-01',
        expireDate: '2099-12-31',
        notes: 'Tài khoản Quản trị viên Master'
      };
      // Persist to Firestore
      try {
        await setDoc(doc(db, 'registered_emails', 'admin@nbgym.com'), { email: 'admin@nbgym.com', tenantId: 'master-admin' }, { merge: true });
        await setDoc(doc(db, 'tenant_accounts', 'master-admin'), account, { merge: true });
      } catch (err) {
        console.warn("Failed saving default admin doc:", err);
      }
    }

    if (!account) {
       return { success: false, message: 'Đăng nhập thành công nhưng chưa có dữ liệu tài khoản trên hệ thống!' };
    }

    // Local active session key
    const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);

    localStorage.setItem('nb_gym_session_id', sessionId);
    localStorage.setItem(STORAGE_USER_SESSION_KEY, JSON.stringify(account));
    localStorage.setItem('nb_gym_auth', 'true');
    localStorage.setItem('nb_gym_user', account.username);
    localStorage.removeItem('nb_gym_explicit_logout');

    setCurrentUser(account);
    setViewingTenantId(null);

    return { success: true, user: account };
  };

  const logout = async () => {
    // 1. Immediately detach any active tenant snapshots
    if (unsubSnapshotRef.current) {
      unsubSnapshotRef.current();
      unsubSnapshotRef.current = null;
    }

    // 2. Set explicit logout flag so onAuthStateChanged will never auto-login
    localStorage.setItem('nb_gym_explicit_logout', 'true');
    localStorage.removeItem(STORAGE_USER_SESSION_KEY);
    localStorage.removeItem('nb_gym_auth');
    localStorage.removeItem('nb_gym_user');
    localStorage.removeItem('nb_gym_session_id');
    localStorage.removeItem('nb_gym_auth_timestamp');
    sessionStorage.clear();

    // 3. Preserve Remember Me credentials if active
    const savedUser = localStorage.getItem('nbfit_tenant_saved_username');
    const savedPass = localStorage.getItem('nbfit_tenant_saved_password');
    const rememberMe = localStorage.getItem('nbfit_tenant_remember_me');

    if (rememberMe === 'true') {
      if (savedUser) localStorage.setItem('nbfit_tenant_saved_username', savedUser);
      if (savedPass) localStorage.setItem('nbfit_tenant_saved_password', savedPass);
      localStorage.setItem('nbfit_tenant_remember_me', 'true');
    }

    // 4. Reset React state immediately so Login screen appears
    setCurrentUser(null);
    setViewingTenantId(null);

    // 5. Sign out of Firebase Auth asynchronously
    try { 
      await signOut(auth); 
    } catch (e) {
      console.warn("SignOut error:", e);
    }
  };

  const createTenant = async (data: {
    username: string;
    password: string;
    gymName: string;
    ownerName: string;
    phone: string;
    expireDate: string;
    notes?: string;
    maxClients?: number;
  }) => {
    const cleanUser = data.username.trim().toLowerCase();
    if (tenants.some(t => t.username?.toLowerCase() === cleanUser)) {
      return { success: false, message: 'Tên đăng nhập này đã tồn tại! Vui lòng chọn tên khác.' };
    }

    try {
      await createUserWithEmailAndPassword(secondaryAuth, cleanUser + '@nbgym.com', data.password.trim());
      await signOut(secondaryAuth);
    } catch (e: any) {
      console.warn("Firebase auth create user failed:", e.code);
      if (e.code === 'auth/email-already-in-use') {
         // ignore if they already exist in auth but not in firestore
      } else {
         return { success: false, message: 'Lỗi tạo tài khoản bảo mật: ' + e.message };
      }
    }

    const tenantId = `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newAccount: TenantAccount = {
      id: tenantId,
      tenantId,
      username: cleanUser,
      password: data.password.trim(),
      gymName: data.gymName.trim() || 'Phòng Tập PT',
      ownerName: data.ownerName.trim() || 'PT Cá Nhân',
      phone: data.phone.trim(),
      role: 'tenant',
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      expireDate: data.expireDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      notes: data.notes || '',
      maxClients: data.maxClients || 100
    };

    setTenants(prev => [...prev, newAccount]);
    if (db) {
      try {
        await setDoc(doc(db, 'tenant_accounts', newAccount.id), newAccount);
        await setDoc(doc(db, 'registered_emails', cleanUser + '@nbgym.com'), { valid: true, tenantId: newAccount.id });
      } catch (e) {
        console.warn('Tenant creation setDoc quota warning:', e);
      }
    }
    return { success: true, message: `Tạo tài khoản thuê [${cleanUser}] thành công!` };
  };

  const updateTenant = async (id: string, updates: Partial<TenantAccount>) => {
    setTenants(prev => prev.map(t => {
      if (t.id === id || t.tenantId === id) {
        const updated = { ...t, ...updates };
        if (db) setDoc(doc(db, 'tenant_accounts', t.id), updated).catch(e => console.warn('Update tenant setDoc error:', e));
        return updated;
      }
      return t;
    }));

    if (currentUser && (currentUser.id === id || currentUser.tenantId === id)) {
      const updatedUser = { ...currentUser, ...updates };
      setCurrentUser(updatedUser);
      localStorage.setItem(STORAGE_USER_SESSION_KEY, JSON.stringify(updatedUser));
    }
  };

  const extendTenant = async (id: string, monthsToAdd: number) => {
    const target = tenants.find(t => t.id === id);
    if (!target) return;

    let baseDate = new Date();
    // If current expireDate is in the future, extend from that date
    if (target.expireDate && target.expireDate > baseDate.toISOString().split('T')[0]) {
      baseDate = new Date(target.expireDate);
    }

    baseDate.setMonth(baseDate.getMonth() + monthsToAdd);
    const newExpireStr = baseDate.toISOString().split('T')[0];

    await updateTenant(id, {
      expireDate: newExpireStr,
      status: 'active'
    });
  };

  const deleteTenant = async (id: string) => {
    setTenants(prev => prev.filter(t => t.id !== id));
    if (db) {
      try {
        await deleteDoc(doc(db, 'tenant_accounts', id));
      } catch (e) {
        console.warn('Delete tenant error:', e);
      }
    }
  };

  return (
    <TenantContext.Provider value={{
      currentUser,
      activeTenantId,
      setActiveTenantId,
      viewingTenantId,
      setViewingTenantId,
      viewTenant,
      returnToMasterAdmin,
      tenants,
      login,
      logout,
      createTenant,
      updateTenant,
      extendTenant,
      deleteTenant,
      isMasterAdmin
    }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
