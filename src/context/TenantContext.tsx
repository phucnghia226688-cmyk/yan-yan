import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { TenantAccount } from '../types';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const secondaryApp = initializeApp(firebaseConfig, "Secondary");
const secondaryAuth = getAuth(secondaryApp);


interface TenantContextType {
  currentUser: TenantAccount | null;
  activeTenantId: string;
  setActiveTenantId: (id: string) => void;
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

  const [activeTenantId, setActiveTenantIdState] = useState<string>(() => {
    return currentUser?.tenantId || 'default';
  });

  const setActiveTenantId = (id: string) => {
    if (isMasterAdmin) {
      setActiveTenantIdState(id);
    } else if (currentUser) {
      setActiveTenantIdState(currentUser.tenantId);
    }
  };

  // Synchronize session state to localStorage
  useEffect(() => {
    if (currentUser) {
      if (!isMasterAdmin) {
        setActiveTenantIdState(currentUser.tenantId);
      }
      localStorage.setItem(STORAGE_USER_SESSION_KEY, JSON.stringify(currentUser));
      localStorage.setItem('nb_gym_auth', 'true');
      localStorage.setItem('nb_gym_user', currentUser.username);
      localStorage.removeItem('nb_gym_explicit_logout');
    }
  }, [currentUser, isMasterAdmin]);

  // Validate session against cloud on mount
  useEffect(() => {
    if (!db) return;
    let unsubSnapshot: (() => void) | undefined;
    const unsubAuth = auth.onAuthStateChanged(async user => {
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

          if (isAdmin) {
            unsubSnapshot = onSnapshot(collection(db, 'tenant_accounts'), (snapshot) => {
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
                setCurrentUser(prev => prev || defaultAdmin);
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
                  } else {
                    // Initialize self if not previously loaded
                    const self = list.find(t => t.role === 'admin' || t.username?.toLowerCase() === 'admin');
                    return self || null;
                  }
                });
              }
            }, (err) => {
              console.warn("Tenant onSnapshot error, falling back to local cache:", err);
            });
          } else if (tenantId !== 'default') {
            unsubSnapshot = onSnapshot(doc(db, 'tenant_accounts', tenantId), (docSnap) => {
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
                    return t;
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
        if (unsubSnapshot) unsubSnapshot();
      }
    });

    return () => {
      unsubAuth();
      if (unsubSnapshot) unsubSnapshot();
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
      
    // 1. Try to authenticate with Firebase Auth
    try {
      await setPersistence(auth, browserSessionPersistence);
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
    setActiveTenantIdState(account.tenantId);

    return { success: true, user: account };
  };

  const logout = async () => {
    try { await signOut(auth); } catch (e) {}
    localStorage.clear();
    sessionStorage.clear();
    setCurrentUser(null);
    setActiveTenantIdState('default');
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
