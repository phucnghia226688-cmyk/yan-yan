import { getTodayDateStr, parseDateLocal, getVNDate } from '../utils/dateUtils';


import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

import { useTenant } from './TenantContext';
import { 
  Client, 
  WorkoutProgram, 
  CheckInLog, 
  PaymentRecord, 
  ExpenseRecord, 
  Appointment, 
  BodyMetricEntry,
  EditHistoryEntry,
  SystemAuditLog,
  AuditActionType,
  PdfDocument,
  DEFAULT_AVATAR_URL
} from '../types';
import { 
  INITIAL_CLIENTS, 
  INITIAL_PROGRAMS, 
  INITIAL_CHECKINS, 
  INITIAL_PAYMENTS, 
  INITIAL_EXPENSES, 
  INITIAL_APPOINTMENTS 
} from '../data/mockData';

interface GymContextType {
  isCloudSynced: boolean;
  themeMode: 'light' | 'dark';
  toggleThemeMode: () => void;
  setThemeMode: (mode: 'light' | 'dark') => void;
  clients: Client[];
  programs: WorkoutProgram[];
  checkIns: CheckInLog[];
  payments: PaymentRecord[];
  expenses: ExpenseRecord[];
  appointments: Appointment[];
  auditLogs: SystemAuditLog[];
  pdfDocuments: PdfDocument[];
  
  // Actions
  checkInClient: (clientId: string, dayPlanName?: string, notes?: string, customDate?: string) => CheckInLog | null;
  cancelCheckIn: (checkInId: string) => void;
  updateCheckIn: (id: string, updates: Partial<CheckInLog>) => void;
  addClient: (client: Omit<Client, 'id' | 'status' | 'bodyMetrics'> & { initialAmountVnd?: number; paymentMethod?: 'Tiền mặt' | 'Chuyển khoản' | 'Thẻ' }) => void;
  updateClient: (id: string, updates: Partial<Client> & { actionSummary?: string; actionType?: 'edit' | 'renew' | 'cancel' | 'status' | 'create' }) => void;
  deleteClient: (id: string) => void;
  addBodyMetric: (clientId: string, metric: Omit<BodyMetricEntry, 'id'>) => void;
  
  saveProgram: (program: WorkoutProgram) => void;
  deleteProgram: (id: string) => void;

  addPdfDocument: (doc: Omit<PdfDocument, 'id' | 'uploadedAt'>) => void;
  deletePdfDocument: (id: string) => void;
  
  addPayment: (payment: Omit<PaymentRecord, 'id'>) => void;
  updatePayment: (id: string, updates: Partial<PaymentRecord>) => void;
  deletePayment: (id: string) => void;
  addExpense: (expense: Omit<ExpenseRecord, 'id'>) => void;
  updateExpense: (id: string, updates: Partial<ExpenseRecord>) => void;
  deleteExpense: (id: string) => void;
  
  addAppointment: (appointment: Omit<Appointment, 'id'>) => void;
  updateAppointment: (id: string, updates: Partial<Appointment>) => void;
  updateAppointmentStatus: (id: string, status: 'Scheduled' | 'Completed' | 'Cancelled') => void;
  deleteAppointment: (id: string) => void;
  
  undoAuditAction: (logId: string) => void;
  clearAuditLogs: () => void;
  resetData: () => void;
  clearAllData: () => Promise<void>;
  exportBackupJson: () => void;
  exportClientsCsv: () => void;
  importBackupJson: (parsedData: any, targetTenantId?: string) => { 
    clientsCount: number; 
    paymentsCount: number; 
    checkInsCount: number; 
    programsCount?: number; 
    expensesCount?: number; 
    appointmentsCount?: number; 
    auditLogsCount?: number; 
    pdfDocumentsCount?: number 
  };
  syncAllToCloud: () => Promise<void>;
}

const STORAGE_KEYS = {
  CLIENTS: 'nb_gym_clients_v1',
  PROGRAMS: 'nb_gym_programs_v1',
  CHECKINS: 'nb_gym_checkins_v1',
  PAYMENTS: 'nb_gym_payments_v1',
  EXPENSES: 'nb_gym_expenses_v1',
  APPOINTMENTS: 'nb_gym_appointments_v1',
  AUDIT_LOGS: 'nb_gym_audit_logs_v1',
  PDF_DOCS: 'nb_gym_pdf_docs_v1',
};

const INITIAL_PDF_DOCS: PdfDocument[] = [];
const INITIAL_AUDIT_LOGS: SystemAuditLog[] = [];

const GymContext = createContext<GymContextType | undefined>(undefined);

let isFirestoreQuotaExceeded = false;

export const GymProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeTenantId, currentUser, isMasterAdmin, logout } = useTenant();
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);

  // Helper to safely load stored local data or auto-backup snapshot scoped by tenant
  const loadStoredData = <T extends { tenantId?: string }>(storageKey: string, colName: string, fallback: T[]): T[] => {
    const targetTenant = (currentUser && currentUser.role !== 'admin' && currentUser.username.toLowerCase() !== 'admin')
      ? (currentUser.tenantId || 'default')
      : (activeTenantId || 'default');

    const matchesTenant = (itemT?: string) => {
      const it = itemT || 'default';
      if (targetTenant === 'master-admin' || targetTenant === 'default') {
        return it === 'master-admin' || it === 'default';
      }
      return it === targetTenant;
    };

    try {
      const tenantScopedKey = `${storageKey}_${targetTenant}`;
      const saved = localStorage.getItem(tenantScopedKey) || localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const tenantFiltered = parsed.filter(item => matchesTenant(item.tenantId));
          if (tenantFiltered.length > 0) return tenantFiltered;
        }
      }
      const autoBackup = localStorage.getItem('nb_gym_auto_backup_latest');
      if (autoBackup) {
        const parsedBackup = JSON.parse(autoBackup);
        if (parsedBackup && Array.isArray(parsedBackup[colName]) && parsedBackup[colName].length > 0) {
          const tenantFiltered = parsedBackup[colName].filter((item: any) => matchesTenant(item.tenantId));
          if (tenantFiltered.length > 0) return tenantFiltered;
        }
      }
    } catch (e) {
      console.warn(`Error reading local storage for ${colName}:`, e);
    }
    // Only use initial fallback if targetTenant is default (master admin)
    if (targetTenant === 'default' || targetTenant === 'master-admin') {
      return fallback;
    }
    return [];
  };

  const [clients, setClients] = useState<Client[]>(() => loadStoredData(STORAGE_KEYS.CLIENTS, 'clients', INITIAL_CLIENTS));
  const [programs, setPrograms] = useState<WorkoutProgram[]>(() => loadStoredData(STORAGE_KEYS.PROGRAMS, 'programs', INITIAL_PROGRAMS));
  const [checkIns, setCheckIns] = useState<CheckInLog[]>(() => loadStoredData(STORAGE_KEYS.CHECKINS, 'checkIns', INITIAL_CHECKINS));
  const [payments, setPayments] = useState<PaymentRecord[]>(() => loadStoredData(STORAGE_KEYS.PAYMENTS, 'payments', INITIAL_PAYMENTS));
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => loadStoredData(STORAGE_KEYS.EXPENSES, 'expenses', INITIAL_EXPENSES));
  const [appointments, setAppointments] = useState<Appointment[]>(() => loadStoredData(STORAGE_KEYS.APPOINTMENTS, 'appointments', INITIAL_APPOINTMENTS));
  const [auditLogs, setAuditLogs] = useState<SystemAuditLog[]>(() => loadStoredData(STORAGE_KEYS.AUDIT_LOGS, 'auditLogs', INITIAL_AUDIT_LOGS));
  const [pdfDocuments, setPdfDocuments] = useState<PdfDocument[]>(() => loadStoredData(STORAGE_KEYS.PDF_DOCS, 'pdfDocuments', INITIAL_PDF_DOCS));

  // Theme mode (Light / Dark - default to 'light')
  const [themeMode, setThemeModeState] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('gym_theme_mode');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'light';
  });

  useEffect(() => {
    localStorage.setItem('gym_theme_mode', themeMode);
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [themeMode]);

  const toggleThemeMode = () => {
    setThemeModeState(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const setThemeMode = (mode: 'light' | 'dark') => {
    setThemeModeState(mode);
  };

  // Ensure currentTenant never resolves to 'tenant_unknown' for default tenant setups
  const currentTenant = (currentUser && !isMasterAdmin)
    ? (currentUser.tenantId || 'default')
    : (activeTenantId || 'default');

  // Cloud persistence helpers
  const saveToCloud = async (colName: string, item: any) => {
    if (isFirestoreQuotaExceeded) return;

    try {
      if (db && item && item.id) {
        let itemWithTenant = {
          ...item,
          tenantId: item.tenantId || currentTenant
        };

        // If storing pdfDocuments and fileDataUrl is large (>500KB), store base64 in local storage
        // and keep Firestore doc metadata clean to avoid 1MB document limit failure!
        if (colName === 'pdfDocuments' && itemWithTenant.fileDataUrl && itemWithTenant.fileDataUrl.length > 500000) {
          try {
            localStorage.setItem(`pdf_blob_${item.id}`, itemWithTenant.fileDataUrl);
          } catch (e) {
            console.warn('LocalStorage error saving PDF blob:', e);
          }
          itemWithTenant = {
            ...itemWithTenant,
            fileDataUrl: '', // Keep firestore document under 1MB
            storedLocally: true
          };
        }

        await setDoc(doc(db, colName, item.id), itemWithTenant);
      }
    } catch (e: any) {
      if (e?.code === 'resource-exhausted' || e?.message?.includes('Quota')) {
        isFirestoreQuotaExceeded = true;
        console.warn(`Firestore Quota Exceeded on ${colName}. Continuing locally.`);
      } else {
        console.warn(`Firestore write error on ${colName}:`, e);
      }
    }
  };

  const removeFromCloud = async (colName: string, id: string) => {
    try {
      if (db && id) {
        await deleteDoc(doc(db, colName, id));
      }
    } catch (e) {
      console.warn(`Firestore delete error on ${colName}:`, e);
    }
  };

  // Real-time sync with Firestore filtered by currentTenant
  useEffect(() => {
    if (!db) return;

    let unsubscribers: (() => void)[] = [];

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user && !user.isAnonymous && currentTenant) {

        setIsCloudSynced(true);
        // Clear previous subscriptions before re-attaching
        unsubscribers.forEach(unsub => unsub());
        unsubscribers = [];

        const attachSync = <T extends { id: string; tenantId?: string }>(
          colName: string,
          storageKey: string,
          setter: React.Dispatch<React.SetStateAction<T[]>>,
          retryCount = 0
        ) => {
          let hasAttemptedInitialPush = false;
          try {
            const q = (isMasterAdmin && currentTenant === 'master-admin') 
              ? collection(db, colName) 
              : query(collection(db, colName), where('tenantId', '==', currentTenant));

            const unsub = onSnapshot(
              q,
              (snapshot) => {
                setIsCloudSynced(true);
                let items = snapshot.docs.map(d => ({ ...(d.data() as T), id: d.id }));

                // Filter by tenantId
                if (!isMasterAdmin || currentTenant !== 'master-admin') {
                  items = items.filter(item => {
                    const itemTenant = item.tenantId || 'default';
                    return itemTenant === currentTenant;
                  });
                }

                if (items.length === 0) {
                  // If Firestore is empty for this collection & tenant, upload any unsynced local data to Cloud
                  if (!hasAttemptedInitialPush) {
                    hasAttemptedInitialPush = true;
                    try {
                      const tenantScopedKey = `${storageKey}_${currentTenant}`;
                      const savedLocal = localStorage.getItem(tenantScopedKey) || localStorage.getItem(storageKey);
                      if (savedLocal) {
                        const parsedLocal = JSON.parse(savedLocal);
                        if (Array.isArray(parsedLocal) && parsedLocal.length > 0) {
                          const localFiltered = parsedLocal.filter(item => (item.tenantId || 'default') === currentTenant);
                          if (localFiltered.length > 0) {
                            console.log(`Pushing ${localFiltered.length} local ${colName} items to Firestore Cloud...`);
                            localFiltered.forEach(localItem => {
                              saveToCloud(colName, localItem);
                            });
                            setter(localFiltered);
                            return;
                          }
                        }
                      }
                    } catch (e) {
                      console.warn(`Error attempting initial push for ${colName}:`, e);
                    }
                  }
                  setter([]);
                  const tenantScopedKey = `${storageKey}_${currentTenant}`;
                  localStorage.setItem(tenantScopedKey, '[]');
                } else {
                  if (colName === 'clients') {
                    items = items.map((c: any) => ({
                      ...c,
                      avatarUrl: c.avatarUrl || DEFAULT_AVATAR_URL,
                      gender: c.gender || 'Nam'
                    }));
                  }
                  if (colName === 'pdfDocuments') {
                    items = items.map((d: any) => {
                      if (!d.fileDataUrl || d.storedLocally) {
                        try {
                          const localBlob = localStorage.getItem(`pdf_blob_${d.id}`);
                          if (localBlob) {
                            return { ...d, fileDataUrl: localBlob, storedLocally: true };
                          }
                        } catch (e) {}
                      }
                      return d;
                    });
                  }

                  // Update state immediately with fresh Cloud data
                  setter(items);

                  // Update local cache immediately to prevent stale offline data drift
                  const tenantScopedKey = `${storageKey}_${currentTenant}`;
                  localStorage.setItem(tenantScopedKey, JSON.stringify(items));
                  localStorage.setItem(storageKey, JSON.stringify(items));
                }
              },
              (err: any) => {
                const isQuota = err?.code === 'resource-exhausted' || err?.message?.includes('Quota') || err?.message?.includes('resource-exhausted');
                const isPermissionDenied = err?.code === 'permission-denied' || err?.message?.includes('Missing or insufficient permissions');

                if (isQuota) {
                  isFirestoreQuotaExceeded = true;
                  console.warn(`Firestore quota limit reached for ${colName}. Switching to local storage cache.`);
                } else if (isPermissionDenied) {
                  console.error(`Permission denied for ${colName}, forcing logout to refresh token`);
                  localStorage.clear();
                  logout();
                  window.location.href = '/';
                  return;
                } else {
                  console.warn(`Firestore sync warning for ${colName}:`, err);
                  if (!isFirestoreQuotaExceeded && retryCount < 3) {
                    setTimeout(() => {
                      if (!isFirestoreQuotaExceeded) {
                        attachSync(colName, storageKey, setter, retryCount + 1);
                      }
                    }, Math.min(30000, 3000 * Math.pow(2, retryCount)));
                  }
                }
                setIsCloudSynced(false);

                try {
                  const tenantScopedKey = `${storageKey}_${currentTenant}`;
                  const savedLocal = localStorage.getItem(tenantScopedKey) || localStorage.getItem(storageKey);
                  if (savedLocal) {
                    const parsedLocal = JSON.parse(savedLocal);
                    if (Array.isArray(parsedLocal) && parsedLocal.length > 0) {
                      const filtered = parsedLocal.filter(item => (item.tenantId || 'default') === currentTenant);
                      if (filtered.length > 0) {
                        setter(filtered);
                      }
                    }
                  }
                } catch (e) {
                  console.warn(`Error restoring local data on sync failure for ${colName}:`, e);
                }
              }
            );
            unsubscribers.push(unsub);
          } catch (e: any) {
            console.warn(`Firestore attachSync error for ${colName}:`, e);
          }
        };

        attachSync('clients', STORAGE_KEYS.CLIENTS, setClients);
        attachSync('programs', STORAGE_KEYS.PROGRAMS, setPrograms);
        attachSync('checkIns', STORAGE_KEYS.CHECKINS, setCheckIns);
        attachSync('payments', STORAGE_KEYS.PAYMENTS, setPayments);
        attachSync('expenses', STORAGE_KEYS.EXPENSES, setExpenses);
        attachSync('appointments', STORAGE_KEYS.APPOINTMENTS, setAppointments);
        attachSync('auditLogs', STORAGE_KEYS.AUDIT_LOGS, setAuditLogs);
        attachSync('pdfDocuments', STORAGE_KEYS.PDF_DOCS, setPdfDocuments);
      } else {
        setIsCloudSynced(false);
      }
    });

    const handleOnline = () => {
      setIsCloudSynced(true);
    };
    const handleOffline = () => {
      setIsCloudSynced(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubAuth();
      unsubscribers.forEach(unsub => unsub());
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [currentTenant, isMasterAdmin, currentUser?.username, currentUser?.password]);

  // Continuous Automatic Local Backup Snapshot whenever data is modified
  useEffect(() => {
    if (clients.length > 0 || payments.length > 0 || checkIns.length > 0) {
      const backupSnapshot = {
        updatedAt: new Date().toISOString(),
        clients,
        programs,
        checkIns,
        payments,
        expenses,
        appointments,
        auditLogs,
        pdfDocuments
      };
      localStorage.setItem('nb_gym_auto_backup_latest', JSON.stringify(backupSnapshot));
    }
  }, [clients, programs, checkIns, payments, expenses, appointments, auditLogs, pdfDocuments]);

  // Local backup persistence scoped per tenant
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEYS.CLIENTS}_${currentTenant}`, JSON.stringify(clients));
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
  }, [clients, currentTenant]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEYS.PROGRAMS}_${currentTenant}`, JSON.stringify(programs));
    localStorage.setItem(STORAGE_KEYS.PROGRAMS, JSON.stringify(programs));
  }, [programs, currentTenant]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEYS.CHECKINS}_${currentTenant}`, JSON.stringify(checkIns));
    localStorage.setItem(STORAGE_KEYS.CHECKINS, JSON.stringify(checkIns));
  }, [checkIns, currentTenant]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEYS.PAYMENTS}_${currentTenant}`, JSON.stringify(payments));
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
  }, [payments, currentTenant]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEYS.EXPENSES}_${currentTenant}`, JSON.stringify(expenses));
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  }, [expenses, currentTenant]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEYS.APPOINTMENTS}_${currentTenant}`, JSON.stringify(appointments));
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
  }, [appointments, currentTenant]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEYS.AUDIT_LOGS}_${currentTenant}`, JSON.stringify(auditLogs));
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs));
  }, [auditLogs, currentTenant]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEYS.PDF_DOCS}_${currentTenant}`, JSON.stringify(pdfDocuments));
    localStorage.setItem(STORAGE_KEYS.PDF_DOCS, JSON.stringify(pdfDocuments));
  }, [pdfDocuments, currentTenant]);

  const addAuditLog = (
    actionType: AuditActionType,
    targetName: string,
    summary: string,
    details?: string,
    snapshot?: SystemAuditLog['snapshot']
  ) => {
    const newLog: SystemAuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      actionType,
      targetName,
      summary,
      details,
      isUndone: false,
      snapshot
    };
    setAuditLogs(prev => [newLog, ...prev]);
    saveToCloud('auditLogs', newLog);
  };

  const clearAuditLogs = () => {
    auditLogs.forEach(l => removeFromCloud('auditLogs', l.id));
    setAuditLogs([]);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
  };

  // Check-in action (Module 2 requirement)
  const checkInClient = (clientId: string, dayPlanName = 'Buổi tập định kỳ', notes = '', customDate?: string): CheckInLog | null => {
    const targetClient = clients.find(c => c.id === clientId);
    if (!targetClient) return null;

    const isMonthly = targetClient.clientType === 'monthly';
    const newRemaining = isMonthly ? targetClient.remainingSessions : Math.max(0, targetClient.remainingSessions - 1);
    
    let newStatus = targetClient.status;
    if (isMonthly) {
      if (targetClient.status !== 'paused' && targetClient.status !== 'closed') {
        const todayStr = getTodayDateStr();
        if (targetClient.endDate && targetClient.endDate < todayStr) {
          newStatus = 'expired';
        } else if (targetClient.endDate) {
          const endMs = new Date(targetClient.endDate).getTime();
          const nowMs = new Date().getTime();
          const daysLeft = Math.ceil((endMs - nowMs) / (1000 * 3600 * 24));
          if (daysLeft <= 7) newStatus = 'expiring';
          else newStatus = 'active';
        }
      }
    } else {
      if (newRemaining === 0) {
        newStatus = 'expired';
      } else if (newRemaining <= 3) {
        newStatus = 'expiring';
      }
    }

    const updatedClient = {
      ...targetClient,
      remainingSessions: newRemaining,
      status: newStatus
    };

    // Update client remaining sessions & status
    setClients(prev => prev.map(c => c.id === clientId ? updatedClient : c));
    saveToCloud('clients', updatedClient);

    // Use custom check-in timestamp if provided (for past check-ins), or current ISO time
    let checkInTimestamp = new Date().toISOString();
    if (customDate) {
      // If YYYY-MM-DD string format (10 chars), append local midday time to prevent UTC timezone date shift
      const dateStringToParse = customDate.length === 10 ? `${customDate}T12:00:00` : customDate;
      const parsedDate = new Date(dateStringToParse);
      if (!isNaN(parsedDate.getTime())) {
        checkInTimestamp = parsedDate.toISOString();
      }
    }

    // Create CheckInLog
    const newCheckIn: CheckInLog = {
      id: `chk-${Date.now()}`,
      clientId: targetClient.id,
      clientName: targetClient.name,
      timestamp: checkInTimestamp,
      dayPlanName,
      sessionsRemainingAfter: newRemaining,
      notes
    };

    setCheckIns(prev => [newCheckIn, ...prev].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    saveToCloud('checkIns', newCheckIn);

    // Record audit log
    addAuditLog(
      'CHECK_IN',
      targetClient.name,
      `Check-in ${customDate ? 'bù ngày cũ' : 'thành công'}: ${targetClient.name} (${dayPlanName}) - Trừ 1 buổi (còn ${newRemaining}/${targetClient.totalSessions} buổi)`,
      notes,
      { client: updatedClient, checkInLog: newCheckIn }
    );

    // Also mark appointment as completed if any match target date
    const targetDateStr = checkInTimestamp.split('T')[0];
    setAppointments(prev => prev.map(a => {
      if (a.clientId === clientId && a.date === targetDateStr && a.status === 'Scheduled') {
        const updatedApt: Appointment = { ...a, status: 'Completed' };
        saveToCloud('appointments', updatedApt);
        return updatedApt;
      }
      return a;
    }));

    return newCheckIn;
  };

  const updateCheckIn = (id: string, updates: Partial<CheckInLog>) => {
    setCheckIns(prev => {
      const updated = prev.map(ci => ci.id === id ? { ...ci, ...updates } : ci);
      const target = updated.find(ci => ci.id === id);
      if (target) {
        saveToCloud('checkIns', target);
      }
      return updated;
    });
  };

  const cancelCheckIn = (checkInId: string) => {
    const targetLog = checkIns.find(ci => ci.id === checkInId);
    if (!targetLog) return;

    // Refund 1 session to client if not monthly client
    setClients(prev => prev.map(c => {
      if (c.id === targetLog.clientId) {
        const isMonthly = c.clientType === 'monthly';
        const newRemaining = isMonthly ? c.remainingSessions : c.remainingSessions + 1;
        let newStatus = c.status;
        if (!isMonthly) {
          if (newRemaining > 3) newStatus = 'active';
          else if (newRemaining > 0) newStatus = 'expiring';
        }
        const updated = {
          ...c,
          remainingSessions: newRemaining,
          status: newStatus
        };
        saveToCloud('clients', updated);
        return updated;
      }
      return c;
    }));

    // Remove from checkIns log
    setCheckIns(prev => prev.filter(ci => ci.id !== checkInId));
    removeFromCloud('checkIns', checkInId);
  };

  const addClient = (newClientData: Omit<Client, 'id' | 'status' | 'bodyMetrics'> & { initialAmountVnd?: number; paymentMethod?: 'Tiền mặt' | 'Chuyển khoản' | 'Thẻ' }) => {
    const id = `cli-${Date.now()}`;
    const isMonthly = newClientData.clientType === 'monthly';
    const remaining = isMonthly
      ? 0
      : (newClientData.remainingSessions !== undefined ? newClientData.remainingSessions : newClientData.totalSessions);
    
    let status: Client['status'] = 'active';
    if (isMonthly) {
      const todayStr = getTodayDateStr();
      if (newClientData.endDate && newClientData.endDate < todayStr) {
        status = 'expired';
      } else if (newClientData.endDate) {
        const endMs = new Date(newClientData.endDate).getTime();
        const nowMs = new Date().getTime();
        const daysLeft = Math.ceil((endMs - nowMs) / (1000 * 3600 * 24));
        if (daysLeft <= 7) status = 'expiring';
      }
    } else {
      if (remaining <= 0) {
        status = 'expired';
      } else if (remaining <= 3) {
        status = 'expiring';
      }
    }

    const now = new Date();
    const formattedTimestamp = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newClient: Client = {
      ...newClientData,
      avatarUrl: DEFAULT_AVATAR_URL,
      gender: newClientData.gender || 'Nam',
      remainingSessions: remaining,
      id,
      status,
      bodyMetrics: [],
      editHistory: [{
        id: `hist-${Date.now()}-init`,
        timestamp: formattedTimestamp,
        summary: isMonthly
          ? `✨ Tạo mới hồ sơ: ${newClientData.name} (${newClientData.packageName || 'Khách Tháng'} - Hạn HĐ: ${newClientData.endDate})`
          : `✨ Tạo mới hồ sơ: ${newClientData.name} (${newClientData.packageName || 'Gói PT'} - ${remaining} buổi)`,
        actionType: 'create'
      }]
    };

    setClients(prev => [newClient, ...prev]);
    saveToCloud('clients', newClient);

    addAuditLog(
      'ADD_CLIENT',
      newClientData.name,
      `✨ Tạo mới hồ sơ học viên: ${newClientData.name} (${newClientData.packageName || 'Gói PT'} - ${remaining} buổi)`,
      `SĐT: ${newClientData.phone} • Hạn HĐ: ${newClientData.endDate || 'Chưa có'}`,
      { client: newClient }
    );

    // Automatically record payment if initial amount specified or totalSessions > 0
    const finalAmount = newClientData.initialAmountVnd !== undefined 
      ? newClientData.initialAmountVnd 
      : (newClientData.totalSessions * 500000);

    if (finalAmount > 0) {
      addPayment({
        clientId: id,
        clientName: newClientData.name,
        packageName: newClientData.packageName,
        sessionsCount: newClientData.totalSessions,
        amountVnd: finalAmount,
        paymentMethod: newClientData.paymentMethod || 'Chuyển khoản',
        paymentDate: newClientData.startDate || getTodayDateStr(),
        notes: 'Thanh toán khởi tạo học viên mới',
        skipSessionUpdate: true
      });
    }

    // Automatically generate recurring appointments for PT Schedule if preferredDays and preferredTime are set
    if (newClientData.preferredDays && newClientData.preferredDays.length > 0 && newClientData.preferredTime) {
      const generatedApts: Appointment[] = [];
      const totalToSchedule = newClientData.totalSessions || 12;
      const timeSlot = newClientData.preferredTime;
      const startD = newClientData.startDate ? parseDateLocal(newClientData.startDate) : getVNDate();
      startD.setHours(0,0,0,0);

      let curr = new Date(startD);
      let scheduledCount = 0;
      let safetyLoop = 0;

      while (scheduledCount < totalToSchedule && safetyLoop < 180) {
        safetyLoop++;
        const dayOfWeek = curr.getDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
        if (newClientData.preferredDays.includes(dayOfWeek)) {
          const yyyy = curr.getFullYear();
          const mm = String(curr.getMonth() + 1).padStart(2, '0');
          const dd = String(curr.getDate()).padStart(2, '0');
          const dateStr = `${yyyy}-${mm}-${dd}`;

          const dayTimes = newClientData.dayTimes || {};
          const aptTime = (dayTimes && dayTimes[dayOfWeek]) ? dayTimes[dayOfWeek] : timeSlot;

          scheduledCount++;
          const sanitizedTime = aptTime.replace(/[^a-zA-Z0-9]/g, '');
          const aptId = `apt-${id}-${dateStr}-${sanitizedTime}`;
          const apt: Appointment = {
            id: aptId,
            clientId: id,
            clientName: newClientData.name,
            clientAvatar: newClientData.avatarUrl,
            time: aptTime,
            date: dateStr,
            status: 'Scheduled',
            dayPlan: `Buổi ${scheduledCount}/${totalToSchedule} - Tập định kỳ`
          };
          generatedApts.push(apt);
          saveToCloud('appointments', apt);
        }
        curr.setDate(curr.getDate() + 1);
      }

      if (generatedApts.length > 0) {
        setAppointments(prev => {
          const genIds = new Set(generatedApts.map(a => a.id));
          const filtered = prev.filter(a => !genIds.has(a.id));
          return [...generatedApts, ...filtered];
        });
      }
    }
  };

  const updateClient = (id: string, updates: Partial<Client> & { actionSummary?: string; actionType?: 'edit' | 'renew' | 'cancel' | 'status' | 'create' }) => {
    const existingClient = clients.find(c => c.id === id);
    const now = new Date();
    const formattedTimestamp = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    let updatedResultClient: Client | null = null;
    let computedSummaryStr: string | undefined = updates.actionSummary;

    setClients(prev => prev.map(c => {
      if (c.id === id) {
        let summaryStr = updates.actionSummary;
        let actionType = updates.actionType || 'edit';

        if (!summaryStr) {
          const changes: string[] = [];
          if (updates.name && updates.name !== c.name) changes.push(`Tên (${c.name} → ${updates.name})`);
          if (updates.phone && updates.phone !== c.phone) changes.push(`SĐT (${c.phone} → ${updates.phone})`);
          if (updates.packageName && updates.packageName !== c.packageName) changes.push(`Gói tập (${c.packageName} → ${updates.packageName})`);
          if (updates.remainingSessions !== undefined && updates.remainingSessions !== c.remainingSessions) {
            changes.push(`Số buổi (${c.remainingSessions} → ${updates.remainingSessions})`);
          }
          if (updates.totalSessions !== undefined && updates.totalSessions !== c.totalSessions) {
            changes.push(`Tổng buổi (${c.totalSessions} → ${updates.totalSessions})`);
          }
          if (updates.endDate && updates.endDate !== c.endDate) {
            changes.push(`Hạn HĐ (${c.endDate || 'Chưa có'} → ${updates.endDate})`);
          }
          if (updates.preferredTime && updates.preferredTime !== c.preferredTime) {
            changes.push(`Giờ tập (${c.preferredTime || 'Chưa có'} → ${updates.preferredTime})`);
          }
          if (updates.preferredDays && JSON.stringify(updates.preferredDays) !== JSON.stringify(c.preferredDays)) {
            const oldDays = (c.preferredDays || []).map(d => d === 0 ? 'CN' : `T${d + 1}`).join(',');
            const newDays = updates.preferredDays.map(d => d === 0 ? 'CN' : `T${d + 1}`).join(',');
            changes.push(`Lịch thứ ([${oldDays}] → [${newDays}])`);
          }
          if (updates.status && updates.status !== c.status) {
            const statusLabel = { active: 'Đang tập', expiring: 'Sắp hết', expired: 'Hết hạn/Hủy', paused: 'Tạm ngưng' };
            changes.push(`Trạng thái (${statusLabel[c.status] || c.status} → ${statusLabel[updates.status] || updates.status})`);
            if (updates.status === 'paused' || updates.status === 'expired') {
              actionType = 'cancel';
            } else {
              actionType = 'status';
            }
          }
          if (updates.goals && updates.goals !== c.goals) changes.push(`Mục tiêu tập`);
          if (updates.healthNotes && updates.healthNotes !== c.healthNotes) changes.push(`Ghi chú SK`);
          if (updates.ptNotes && updates.ptNotes !== c.ptNotes) changes.push(`Ghi chú PT`);
          if (updates.occupation && updates.occupation !== c.occupation) changes.push(`Nghề nghiệp`);

          if (changes.length > 0) {
            summaryStr = `✏️ Đã sửa: ${changes.join('; ')}`;
          } else {
            summaryStr = `✏️ Cập nhật thông tin hồ sơ`;
          }
        }

        computedSummaryStr = summaryStr;

        const historyEntry: EditHistoryEntry = {
          id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          timestamp: formattedTimestamp,
          summary: summaryStr,
          actionType: actionType
        };

        const { actionSummary, actionType: _at, ...cleanUpdates } = updates;
        const updatedHistory = [historyEntry, ...(c.editHistory || [])];

        const updated = { ...c, ...cleanUpdates, editHistory: updatedHistory };
        if (updated.clientType === 'monthly') {
          if (updated.status !== 'paused' && updated.status !== 'closed') {
            const todayStr = getTodayDateStr();
            if (updated.endDate && updated.endDate < todayStr) {
              updated.status = 'expired';
            } else if (updated.endDate) {
              const endMs = new Date(updated.endDate).getTime();
              const nowMs = new Date().getTime();
              const daysLeft = Math.ceil((endMs - nowMs) / (1000 * 3600 * 24));
              if (daysLeft <= 7) updated.status = 'expiring';
              else updated.status = 'active';
            } else {
              updated.status = 'active';
            }
          }
        } else {
          if (updated.remainingSessions <= 0 && updated.status !== 'paused' && updated.status !== 'closed') updated.status = 'expired';
          else if (updated.remainingSessions <= 3 && updated.status !== 'paused' && updated.status !== 'closed') updated.status = 'expiring';
          else if (updated.remainingSessions > 3 && updated.status !== 'paused' && updated.status !== 'expired' && updated.status !== 'closed') updated.status = 'active';
        }

        updatedResultClient = updated;
        saveToCloud('clients', updated);
        return updated;
      }
      return c;
    }));

    if (existingClient && updatedResultClient) {
      addAuditLog(
        updates.actionType === 'renew' ? 'RENEW_CLIENT' : 'UPDATE_CLIENT',
        updates.name || existingClient.name,
        updates.actionSummary || computedSummaryStr || `✏️ Cập nhật thông tin học viên ${existingClient.name}`,
        `SĐT: ${updates.phone || existingClient.phone} • Gói tập: ${updates.packageName || existingClient.packageName}`,
        {
          previousClientState: existingClient,
          updatedClientState: updatedResultClient
        }
      );
    }

    // Automatically update or reschedule appointments if preferredDays or preferredTime or name changes
    setAppointments(prev => {
      const clientBefore = existingClient;
      if (!clientBefore) return prev;

      const newName = updates.name ?? clientBefore.name;
      const newAvatar = updates.avatarUrl ?? clientBefore.avatarUrl;
      const newDays = updates.preferredDays ?? clientBefore.preferredDays ?? [];
      const newTime = updates.preferredTime ?? clientBefore.preferredTime ?? '08:00 - 09:00';
      const newDayTimes = updates.dayTimes ?? clientBefore.dayTimes ?? {};

      const daysChanged = updates.preferredDays !== undefined && JSON.stringify(updates.preferredDays) !== JSON.stringify(clientBefore.preferredDays || []);
      const timeChanged = updates.preferredTime !== undefined && updates.preferredTime !== clientBefore.preferredTime;
      const dayTimesChanged = updates.dayTimes !== undefined && JSON.stringify(updates.dayTimes) !== JSON.stringify(clientBefore.dayTimes || {});

      const scheduleChanged = daysChanged || timeChanged || dayTimesChanged;

      if (!scheduleChanged) {
        // Just update client name & avatar in existing appointments
        return prev.map(a => {
          if (a.clientId === id) {
            const updatedApt = { ...a, clientName: newName, clientAvatar: newAvatar };
            saveToCloud('appointments', updatedApt);
            return updatedApt;
          }
          return a;
        });
      }

      // Schedule changed! Keep completed & cancelled appointments, replace future 'Scheduled' ones
      const scheduledToRemove = prev.filter(a => a.clientId === id && a.status === 'Scheduled');
      scheduledToRemove.forEach(a => removeFromCloud('appointments', a.id));

      const keptApts = prev.filter(a => !(a.clientId === id && a.status === 'Scheduled'));
      const completedCount = prev.filter(a => a.clientId === id && a.status === 'Completed').length;

      const remainingToSchedule = Math.max(0, (updates.remainingSessions ?? clientBefore.remainingSessions ?? 12));

      if (newDays.length > 0 && remainingToSchedule > 0) {
        const generated: Appointment[] = [];
        const startD = getVNDate();
        startD.setHours(0,0,0,0);

        let curr = new Date(startD);
        let count = 0;
        let safety = 0;

        while (count < remainingToSchedule && safety < 180) {
          safety++;
          const dayOfWeek = curr.getDay();
          if (newDays.includes(dayOfWeek)) {
            const yyyy = curr.getFullYear();
            const mm = String(curr.getMonth() + 1).padStart(2, '0');
            const dd = String(curr.getDate()).padStart(2, '0');
            const dateStr = `${yyyy}-${mm}-${dd}`;

            const aptTime = (newDayTimes && newDayTimes[dayOfWeek]) ? newDayTimes[dayOfWeek] : newTime;
            count++;
            const sanitizedTime = aptTime.replace(/[^a-zA-Z0-9]/g, '');
            const aptId = `apt-${id}-${dateStr}-${sanitizedTime}`;
            const apt: Appointment = {
              id: aptId,
              clientId: id,
              clientName: newName,
              clientAvatar: newAvatar,
              time: aptTime,
              date: dateStr,
              status: 'Scheduled',
              dayPlan: `Buổi ${completedCount + count} - Tập định kỳ`
            };
            generated.push(apt);
            saveToCloud('appointments', apt);
          }
          curr.setDate(curr.getDate() + 1);
        }
        return [...generated, ...keptApts];
      }

      return keptApts.map(a => {
        if (a.clientId === id) {
          const updatedApt = { ...a, clientName: newName, clientAvatar: newAvatar };
          saveToCloud('appointments', updatedApt);
          return updatedApt;
        }
        return a;
      });
    });
  };

  const deleteClient = (id: string) => {
    const targetClient = clients.find(c => c.id === id);
    if (!targetClient) return;

    const targetAppointments = appointments.filter(a => a.clientId === id);
    const targetProgram = programs.find(p => p.clientId === id);
    const targetPayments = payments.filter(p => p.clientId === id);
    const targetCheckIns = checkIns.filter(ci => ci.clientId === id);

    // Delete client from clients
    setClients(prev => prev.filter(c => c.id !== id));
    removeFromCloud('clients', id);

    // Delete associated appointments
    targetAppointments.forEach(a => removeFromCloud('appointments', a.id));
    setAppointments(prev => prev.filter(a => a.clientId !== id));

    // Delete associated payments
    targetPayments.forEach(p => removeFromCloud('payments', p.id));
    setPayments(prev => prev.filter(p => p.clientId !== id));

    // Delete associated checkIns
    targetCheckIns.forEach(ci => removeFromCloud('checkIns', ci.id));
    setCheckIns(prev => prev.filter(ci => ci.clientId !== id));

    // Delete associated program
    if (targetProgram) {
      deleteProgram(targetProgram.id);
    }

    addAuditLog(
      'DELETE_CLIENT',
      targetClient.name,
      `🗑️ Đã xóa học viên: ${targetClient.name} (${targetClient.packageName || 'Gói PT'} - còn ${targetClient.remainingSessions} buổi)`,
      `SĐT: ${targetClient.phone} • Hạn HĐ: ${targetClient.endDate || 'Chưa có'}`,
      {
        client: targetClient,
        appointmentsList: targetAppointments,
        program: targetProgram
      }
    );
  };

  const addBodyMetric = (clientId: string, metric: Omit<BodyMetricEntry, 'id'>) => {
    const newMetric: BodyMetricEntry = {
      ...metric,
      id: `m-${Date.now()}`
    };

    setClients(prev => prev.map(c => {
      if (c.id === clientId) {
        const updated = {
          ...c,
          bodyMetrics: [...c.bodyMetrics, newMetric]
        };
        saveToCloud('clients', updated);
        return updated;
      }
      return c;
    }));
  };

  const saveProgram = (program: WorkoutProgram) => {
    setPrograms(prev => {
      const exists = prev.some(p => p.id === program.id);
      if (exists) {
        return prev.map(p => p.id === program.id ? program : p);
      }
      return [...prev, program];
    });
    saveToCloud('programs', program);

    // Update client link if needed
    setClients(prev => prev.map(c => {
      if (c.id === program.clientId) {
        const updated = { ...c, workoutProgramId: program.id };
        saveToCloud('clients', updated);
        return updated;
      }
      return c;
    }));
  };

  const deleteProgram = (id: string) => {
    setPrograms(prev => prev.filter(p => p.id !== id));
    removeFromCloud('programs', id);
  };

  const addPdfDocument = (docData: Omit<PdfDocument, 'id' | 'uploadedAt'>) => {
    const id = `pdf-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newDoc: PdfDocument = {
      ...docData,
      id,
      uploadedAt: `${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
    };

    if (newDoc.fileDataUrl) {
      try {
        localStorage.setItem(`pdf_blob_${id}`, newDoc.fileDataUrl);
      } catch (e) {
        console.warn('LocalStorage save pdf blob error:', e);
      }
    }

    setPdfDocuments(prev => [newDoc, ...prev]);
    saveToCloud('pdfDocuments', newDoc);
  };

  const deletePdfDocument = (id: string) => {
    setPdfDocuments(prev => prev.filter(d => d.id !== id));
    try {
      localStorage.removeItem(`pdf_blob_${id}`);
    } catch (e) {}
    removeFromCloud('pdfDocuments', id);
  };

  const addPayment = (paymentData: Omit<PaymentRecord, 'id'>) => {
    const newPayment: PaymentRecord = {
      ...paymentData,
      id: `pay-${Date.now()}`
    };
    setPayments(prev => [newPayment, ...prev]);
    saveToCloud('payments', newPayment);

    // If payment adds sessions, update client's remaining and total sessions!
    if (paymentData.clientId && paymentData.sessionsCount > 0 && !paymentData.skipSessionUpdate) {
      setClients(prev => prev.map(c => {
        if (c.id === paymentData.clientId) {
          const newRemaining = c.remainingSessions + paymentData.sessionsCount;
          const newTotal = paymentData.sessionsCount;
          let newStatus = c.status;
          if (newRemaining > 3) newStatus = 'active';
          const updated = {
            ...c,
            packageName: paymentData.packageName || c.packageName,
            totalSessions: newTotal,
            remainingSessions: newRemaining,
            status: newStatus
          };
          saveToCloud('clients', updated);
          return updated;
        }
        return c;
      }));
    }
  };

  const updatePayment = (id: string, updates: Partial<PaymentRecord>) => {
    let originalPayment: PaymentRecord | undefined;
    let updatedPayment: PaymentRecord | undefined;
    
    setPayments(prev => {
      const newPayments = prev.map(p => {
        if (p.id === id) {
          originalPayment = p;
          const updated = { ...p, ...updates };
          
          // Apply differences to client if sessions count changed or newEndDate changed
          const sessionsChanged = updates.sessionsCount !== undefined && updates.sessionsCount !== p.sessionsCount;
          const endDateChanged = updates.newEndDate !== undefined && updates.newEndDate !== p.newEndDate;
          
          if (sessionsChanged || endDateChanged) {
            setClients(clientList => clientList.map(c => {
              if (c.id === p.clientId) {
                const updatedClient = { ...c };
                if (sessionsChanged && updatedClient.clientType !== 'monthly') {
                  const diff = updates.sessionsCount! - p.sessionsCount;
                  updatedClient.remainingSessions = Math.max(0, updatedClient.remainingSessions + diff);
                  updatedClient.totalSessions = Math.max(0, updatedClient.totalSessions + diff);
                  if (updatedClient.remainingSessions > 0) updatedClient.status = 'active';
                  else if (updatedClient.remainingSessions === 0) updatedClient.status = 'expired';
                }
                if (endDateChanged && updates.newEndDate) {
                   updatedClient.endDate = updates.newEndDate;
                   const endD = new Date(updates.newEndDate);
                   if (endD > new Date() && updatedClient.status === 'expired') {
                     updatedClient.status = 'active';
                   }
                }
                saveToCloud('clients', updatedClient);
                return updatedClient;
              }
              return c;
            }));
          }
          
          saveToCloud('payments', updated);
          updatedPayment = updated;
          return updated;
        }
        return p;
      });
      return newPayments;
    });

    if (originalPayment && updatedPayment) {
      addAuditLog(
        'UPDATE_PAYMENT',
        originalPayment.clientName,
        `Đã sửa giao dịch thanh toán: Số tiền ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(originalPayment.amountVnd)} -> ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(updatedPayment.amountVnd)}`,
        `Gói tập: ${originalPayment.packageName}. Số buổi: ${originalPayment.sessionsCount} -> ${updatedPayment.sessionsCount}`,
        { payment: updatedPayment }
      );
    }
  };

  const deletePayment = (id: string) => {
    const target = payments.find(p => p.id === id);
    if (!target) return;
    
    // Perform rollback on client if this payment updated sessions
    if (!target.skipSessionUpdate || target.previousState) {
      setClients(prev => prev.map(c => {
        if (c.id === target.clientId) {
          let updated = { ...c };
          if (target.previousState) {
            // Full rollback based on saved state
            updated.remainingSessions = target.previousState.remainingSessions;
            updated.totalSessions = target.previousState.totalSessions;
            updated.endDate = target.previousState.endDate;
            updated.status = target.previousState.status;
          } else {
            // Partial rollback if no saved state
            updated.remainingSessions = Math.max(0, c.remainingSessions - target.sessionsCount);
            updated.totalSessions = Math.max(0, c.totalSessions - target.sessionsCount);
            if (updated.remainingSessions === 0 && c.clientType !== 'monthly') {
              updated.status = 'expired';
            }
          }
          saveToCloud('clients', updated);
          return updated;
        }
        return c;
      }));
    }

    setPayments(prev => prev.filter(p => p.id !== id));
    removeFromCloud('payments', id);
    addAuditLog(
      'DELETE_PAYMENT',
      target.clientName,
      `💸 Đã hủy/xóa giao dịch: ${target.clientName} (${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(target.amountVnd)})`,
      `Ghi chú: ${target.notes || 'Không có'} - Đã hoàn tác dữ liệu học viên.`,
      { payment: target }
    );
  };

  const addExpense = (expenseData: Omit<ExpenseRecord, 'id'>) => {
    const newExpense: ExpenseRecord = {
      ...expenseData,
      id: `exp-${Date.now()}`
    };
    setExpenses(prev => [newExpense, ...prev]);
    saveToCloud('expenses', newExpense);
    addAuditLog(
      'ADD_EXPENSE',
      newExpense.category,
      `💸 Thêm khoản chi mới: ${newExpense.category} (${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(newExpense.amountVnd)})`,
      `Nhóm: ${newExpense.categoryGroup} • Ngày: ${newExpense.date} • Ghi chú: ${newExpense.notes || 'Không có'}`,
      { expense: newExpense }
    );
  };

  const updateExpense = (id: string, updates: Partial<ExpenseRecord>) => {
    let originalExpense: ExpenseRecord | undefined;
    let updatedExpense: ExpenseRecord | undefined;

    setExpenses(prev => {
      return prev.map(e => {
        if (e.id === id) {
          originalExpense = e;
          const updated = { ...e, ...updates };
          updatedExpense = updated;
          saveToCloud('expenses', updated);
          return updated;
        }
        return e;
      });
    });

    if (originalExpense && updatedExpense) {
      addAuditLog(
        'UPDATE_EXPENSE',
        (updatedExpense as ExpenseRecord).category,
        `✏️ Cập nhật khoản chi: ${(updatedExpense as ExpenseRecord).category} (${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format((updatedExpense as ExpenseRecord).amountVnd)})`,
        `Nhóm: ${(updatedExpense as ExpenseRecord).categoryGroup} • Ngày: ${(updatedExpense as ExpenseRecord).date} • Ghi chú: ${(updatedExpense as ExpenseRecord).notes || 'Không có'}`,
        { expense: updatedExpense }
      );
    }
  };

  const deleteExpense = (id: string) => {
    const target = expenses.find(e => e.id === id);
    setExpenses(prev => prev.filter(e => e.id !== id));
    removeFromCloud('expenses', id);
    if (target) {
      addAuditLog(
        'DELETE_EXPENSE',
        target.category,
        `💸 Đã xóa khoản chi phí: ${target.category} (${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(target.amountVnd)})`,
        `Ghi chú: ${target.notes || 'Không có'}`,
        { expense: target }
      );
    }
  };

  const addAppointment = (aptData: Omit<Appointment, 'id'>) => {
    const newApt: Appointment = {
      ...aptData,
      id: `apt-${Date.now()}`
    };
    setAppointments(prev => [...prev, newApt]);
    saveToCloud('appointments', newApt);
  };

  const updateAppointment = (id: string, updates: Partial<Appointment>) => {
    setAppointments(prev => prev.map(a => {
      if (a.id === id) {
        const updated = { ...a, ...updates };
        saveToCloud('appointments', updated);
        return updated;
      }
      return a;
    }));
  };

  const updateAppointmentStatus = (id: string, status: 'Scheduled' | 'Completed' | 'Cancelled') => {
    setAppointments(prev => prev.map(a => {
      if (a.id === id) {
        const updated = { ...a, status };
        saveToCloud('appointments', updated);
        return updated;
      }
      return a;
    }));
  };

  const deleteAppointment = (id: string) => {
    const target = appointments.find(a => a.id === id);
    setAppointments(prev => prev.filter(a => a.id !== id));
    removeFromCloud('appointments', id);
    if (target) {
      addAuditLog(
        'DELETE_APPOINTMENT',
        target.clientName,
        `📅 Đã xóa lịch hẹn tập với ${target.clientName}`,
        `Thời gian: ${target.date} ${target.time} • Nội dung: ${target.dayPlan || 'Tập định kỳ'}`,
        { appointment: target }
      );
    }
  };

  const undoAuditAction = (logId: string) => {
    const targetLog = auditLogs.find(l => l.id === logId);
    if (!targetLog || targetLog.isUndone) return;

    const { actionType, snapshot, targetName } = targetLog;

    if (actionType === 'DELETE_CLIENT' && snapshot?.client) {
      setClients(prev => {
        const exists = prev.some(c => c.id === snapshot.client!.id);
        if (exists) return prev;
        saveToCloud('clients', snapshot.client!);
        return [snapshot.client!, ...prev];
      });
      if (snapshot.appointmentsList && snapshot.appointmentsList.length > 0) {
        setAppointments(prev => {
          const existingIds = new Set(prev.map(a => a.id));
          const toAdd = snapshot.appointmentsList!.filter(a => !existingIds.has(a.id));
          toAdd.forEach(a => saveToCloud('appointments', a));
          return [...toAdd, ...prev];
        });
      }
      if (snapshot.program) {
        setPrograms(prev => {
          const exists = prev.some(p => p.id === snapshot.program!.id);
          if (exists) return prev;
          saveToCloud('programs', snapshot.program!);
          return [...prev, snapshot.program!];
        });
      }
    } else if (actionType === 'ADD_CLIENT' && snapshot?.client) {
      setClients(prev => prev.filter(c => c.id !== snapshot.client!.id));
      removeFromCloud('clients', snapshot.client!.id);
      setAppointments(prev => prev.filter(a => a.clientId !== snapshot.client!.id));
    } else if ((actionType === 'UPDATE_CLIENT' || actionType === 'RENEW_CLIENT') && snapshot?.previousClientState) {
      setClients(prev => prev.map(c => {
        if (c.id === snapshot.previousClientState!.id) {
          saveToCloud('clients', snapshot.previousClientState!);
          return snapshot.previousClientState!;
        }
        return c;
      }));
    } else if (actionType === 'CHECK_IN' && snapshot?.checkInLog) {
      cancelCheckIn(snapshot.checkInLog.id);
    } else if (actionType === 'CANCEL_CHECK_IN' && snapshot?.checkInLog) {
      setCheckIns(prev => [snapshot.checkInLog!, ...prev]);
      saveToCloud('checkIns', snapshot.checkInLog!);
      setClients(prev => prev.map(c => {
        if (c.id === snapshot.checkInLog!.clientId) {
          const rem = Math.max(0, c.remainingSessions - 1);
          const updated = { ...c, remainingSessions: rem };
          saveToCloud('clients', updated);
          return updated;
        }
        return c;
      }));
    } else if (actionType === 'DELETE_EXPENSE' && snapshot?.expense) {
      setExpenses(prev => [snapshot.expense!, ...prev]);
      saveToCloud('expenses', snapshot.expense!);
    } else if (actionType === 'ADD_EXPENSE' && snapshot?.expense) {
      setExpenses(prev => prev.filter(e => e.id !== snapshot.expense!.id));
      removeFromCloud('expenses', snapshot.expense!.id);
    } else if (actionType === 'DELETE_PAYMENT' && snapshot?.payment) {
      setPayments(prev => [snapshot.payment!, ...prev]);
      saveToCloud('payments', snapshot.payment!);
    } else if (actionType === 'ADD_PAYMENT' && snapshot?.payment) {
      setPayments(prev => prev.filter(p => p.id !== snapshot.payment!.id));
      removeFromCloud('payments', snapshot.payment!.id);
    } else if (actionType === 'DELETE_APPOINTMENT' && snapshot?.appointment) {
      setAppointments(prev => [snapshot.appointment!, ...prev]);
      saveToCloud('appointments', snapshot.appointment!);
    }

    setAuditLogs(prev => prev.map(l => {
      if (l.id === logId) {
        const updated = {
          ...l,
          isUndone: true,
          undoneAt: new Date().toISOString()
        };
        saveToCloud('auditLogs', updated);
        return updated;
      }
      return l;
    }));

    addAuditLog(
      'RESTORE_DATA',
      targetName,
      `🔄 Hoàn tác khôi phục thành công: ${targetLog.summary}`,
      `Thời gian khôi phục: ${new Date().toLocaleTimeString('vi-VN')} ${new Date().toLocaleDateString('vi-VN')}`
    );
  };

  const exportBackupJson = () => {
    const data = {
      appName: 'NB Private Gym Management',
      version: '1.0',
      exportDate: new Date().toISOString(),
      clients,
      programs,
      checkIns,
      payments,
      expenses,
      appointments,
      auditLogs,
      pdfDocuments
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    const dateStr = getTodayDateStr();
    downloadAnchor.setAttribute('download', `NB_Gym_Backup_${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    addAuditLog('EXPORT_BACKUP', 'Sao lưu dữ liệu JSON', 'Đã xuất dữ liệu sao lưu toàn hệ thống ra file JSON.');
  };

  const exportClientsCsv = () => {
    const headers = ['Mã ID', 'Họ tên', 'SĐT', 'Gói tập', 'Buổi còn', 'Tổng buổi', 'Trạng thái', 'Ngày bắt đầu', 'Ngày hết hạn', 'Lịch tập'];
    const rows = clients.map(c => [
      c.id,
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${c.phone || ''}"`,
      `"${(c.packageName || '').replace(/"/g, '""')}"`,
      c.remainingSessions ?? 0,
      c.totalSessions ?? 0,
      c.status || '',
      c.startDate || '',
      c.endDate || '',
      `"${((c.preferredDays || []).map(d => d === 0 ? 'Chủ Nhật' : `Thứ ${d + 1}`)).join(', ')}"`
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const dateStr = getTodayDateStr();
    link.setAttribute('download', `NB_Gym_DanhSachHocVien_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();

    addAuditLog('EXPORT_BACKUP', 'Xuất danh sách hội viên Excel/CSV', 'Đã xuất file Excel/CSV danh sách hội viên.');
  };

  const importBackupJson = (parsedData: any, targetTenantId?: string) => {
    let rawObj = parsedData;
    if (typeof rawObj === 'string') {
      try {
        rawObj = JSON.parse(rawObj);
      } catch (e) {
        throw new Error('Dữ liệu sao lưu không đúng định dạng JSON.');
      }
    }

    if (!rawObj || typeof rawObj !== 'object') {
      throw new Error('File JSON không hợp lệ.');
    }

    // Handle nested data wrappers (e.g. from cloud backup or stringified payload)
    if (rawObj.data && typeof rawObj.data === 'string') {
      try {
        const unwrapped = JSON.parse(rawObj.data);
        rawObj = { ...rawObj, ...unwrapped };
      } catch (e) {}
    } else if (rawObj.data && typeof rawObj.data === 'object' && !Array.isArray(rawObj.data)) {
      rawObj = { ...rawObj, ...rawObj.data };
    } else if (rawObj.backupData && typeof rawObj.backupData === 'object') {
      rawObj = { ...rawObj, ...rawObj.backupData };
    }

    // Handle if rawObj is an array of clients directly
    if (Array.isArray(rawObj)) {
      rawObj = { clients: rawObj };
    }

    const tId = targetTenantId || currentTenant || 'master-admin';

    const sanitizeTenantItems = (items: any[], colType: string) => {
      if (!Array.isArray(items)) return [];
      return items.map((item, idx) => {
        if (!item || typeof item !== 'object') return null;
        const safeId = item.id ? String(item.id) : `${colType.slice(0, 3)}-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`;
        return {
          ...item,
          id: safeId,
          tenantId: tId // Always adopt and assign target tenant so data seamlessly displays in current app
        };
      }).filter(Boolean);
    };

    // Extract with fallback aliases
    const rawClients = rawObj.clients || rawObj.members || rawObj.hocVien || rawObj.clientList || [];
    const rawPrograms = rawObj.programs || rawObj.workoutPrograms || rawObj.giaoAn || [];
    const rawCheckIns = rawObj.checkIns || rawObj.checkins || rawObj.checkInLogs || rawObj.checkin_logs || rawObj.diemDanh || [];
    const rawPayments = rawObj.payments || rawObj.paymentRecords || rawObj.revenue || rawObj.revenues || rawObj.thu || [];
    const rawExpenses = rawObj.expenses || rawObj.expenseRecords || rawObj.chi || [];
    const rawAppointments = rawObj.appointments || rawObj.schedules || rawObj.lichTap || rawObj.lichHen || [];
    const rawAuditLogs = rawObj.auditLogs || rawObj.audit_logs || rawObj.logs || rawObj.nhatKy || [];
    const rawPdfDocs = rawObj.pdfDocuments || rawObj.documents || rawObj.pdfs || rawObj.taiLieu || [];

    const newClients = sanitizeTenantItems(rawClients, 'clients').map((c: any) => ({
      ...c,
      avatarUrl: c.avatarUrl || DEFAULT_AVATAR_URL,
      gender: c.gender || 'Nam',
      status: c.status || 'active',
      clientType: c.clientType || 'sessions',
      remainingSessions: typeof c.remainingSessions === 'number' ? c.remainingSessions : (Number(c.remainingSessions) || 0),
      totalSessions: typeof c.totalSessions === 'number' ? c.totalSessions : (Number(c.totalSessions) || 0),
      bodyMetrics: Array.isArray(c.bodyMetrics) ? c.bodyMetrics : [],
      editHistory: Array.isArray(c.editHistory) ? c.editHistory : [],
      preferredDays: Array.isArray(c.preferredDays) ? c.preferredDays : []
    }));

    const newPrograms = sanitizeTenantItems(rawPrograms, 'programs');
    const newCheckIns = sanitizeTenantItems(rawCheckIns, 'checkIns');
    const newPayments = sanitizeTenantItems(rawPayments, 'payments');
    const newExpenses = sanitizeTenantItems(rawExpenses, 'expenses');
    const newAppointments = sanitizeTenantItems(rawAppointments, 'appointments');
    const newAuditLogs = sanitizeTenantItems(rawAuditLogs, 'auditLogs');
    const newPdfDocs = sanitizeTenantItems(rawPdfDocs, 'pdfDocuments');

    // Immediate state update
    setClients(prev => [...prev.filter(c => (c.tenantId || 'default') !== tId && (c.tenantId || 'default') !== (tId === 'master-admin' ? 'default' : tId)), ...newClients]);
    setPrograms(prev => [...prev.filter(p => (p.tenantId || 'default') !== tId), ...newPrograms]);
    setCheckIns(prev => [...prev.filter(ci => (ci.tenantId || 'default') !== tId), ...newCheckIns]);
    setPayments(prev => [...prev.filter(p => (p.tenantId || 'default') !== tId), ...newPayments]);
    setExpenses(prev => [...prev.filter(e => (e.tenantId || 'default') !== tId), ...newExpenses]);
    setAppointments(prev => [...prev.filter(a => (a.tenantId || 'default') !== tId), ...newAppointments]);
    setAuditLogs(prev => [...prev.filter(al => (al.tenantId || 'default') !== tId), ...newAuditLogs]);
    setPdfDocuments(prev => [...prev.filter(d => (d.tenantId || 'default') !== tId), ...newPdfDocs]);

    // Save to LocalStorage immediately so even if offline or reload, data persists
    try {
      localStorage.setItem(`${STORAGE_KEYS.CLIENTS}_${tId}`, JSON.stringify(newClients));
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(newClients));
      localStorage.setItem(`${STORAGE_KEYS.PROGRAMS}_${tId}`, JSON.stringify(newPrograms));
      localStorage.setItem(STORAGE_KEYS.PROGRAMS, JSON.stringify(newPrograms));
      localStorage.setItem(`${STORAGE_KEYS.CHECKINS}_${tId}`, JSON.stringify(newCheckIns));
      localStorage.setItem(STORAGE_KEYS.CHECKINS, JSON.stringify(newCheckIns));
      localStorage.setItem(`${STORAGE_KEYS.PAYMENTS}_${tId}`, JSON.stringify(newPayments));
      localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(newPayments));
      localStorage.setItem(`${STORAGE_KEYS.EXPENSES}_${tId}`, JSON.stringify(newExpenses));
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(newExpenses));
      localStorage.setItem(`${STORAGE_KEYS.APPOINTMENTS}_${tId}`, JSON.stringify(newAppointments));
      localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(newAppointments));
      localStorage.setItem(`${STORAGE_KEYS.AUDIT_LOGS}_${tId}`, JSON.stringify(newAuditLogs));
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(newAuditLogs));
      localStorage.setItem(`${STORAGE_KEYS.PDF_DOCS}_${tId}`, JSON.stringify(newPdfDocs));
      localStorage.setItem(STORAGE_KEYS.PDF_DOCS, JSON.stringify(newPdfDocs));
    } catch (e) {
      console.warn('LocalStorage error during import:', e);
    }

    // Sync individual items to Cloud under target tenant
    newClients.forEach((item: any) => saveToCloud('clients', item));
    newPrograms.forEach((item: any) => saveToCloud('programs', item));
    newCheckIns.forEach((item: any) => saveToCloud('checkIns', item));
    newPayments.forEach((item: any) => saveToCloud('payments', item));
    newExpenses.forEach((item: any) => saveToCloud('expenses', item));
    newAppointments.forEach((item: any) => saveToCloud('appointments', item));
    newAuditLogs.forEach((item: any) => saveToCloud('auditLogs', item));
    newPdfDocs.forEach((item: any) => saveToCloud('pdfDocuments', item));

    // Save Cloud Shadow Backup document strictly bound to tId
    if (db && !isFirestoreQuotaExceeded) {
      const shadowData = {
        tenantId: tId,
        timestamp: new Date().toISOString(),
        data: JSON.stringify({
          clients: newClients,
          programs: newPrograms,
          checkIns: newCheckIns,
          payments: newPayments,
          expenses: newExpenses,
          appointments: newAppointments,
          auditLogs: newAuditLogs,
          pdfDocuments: newPdfDocs
        })
      };
      setDoc(doc(db, 'shadow_backups', tId), shadowData).catch(e => console.warn('Shadow backup setDoc error:', e));
      setDoc(doc(db, 'cloud_backups', tId), shadowData).catch(e => console.warn('Cloud backup setDoc error:', e));
    }

    addAuditLog('IMPORT_BACKUP', 'Khôi phục dữ liệu hệ thống (JSON)', `Đã nhập thành công ${newClients.length} hội viên, ${newPayments.length} thanh toán, ${newCheckIns.length} lượt điểm danh cho phòng tập (${tId}).`);

    return {
      clientsCount: newClients.length,
      programsCount: newPrograms.length,
      checkInsCount: newCheckIns.length,
      paymentsCount: newPayments.length,
      expensesCount: newExpenses.length,
      appointmentsCount: newAppointments.length,
      auditLogsCount: newAuditLogs.length,
      pdfDocumentsCount: newPdfDocs.length
    };
  };

  const syncAllToCloud = async () => {
    try {
      const tId = currentTenant;
      const tenantClients = clients.filter(c => (c.tenantId || 'default') === tId);
      const tenantPrograms = programs.filter(p => (p.tenantId || 'default') === tId);
      const tenantCheckIns = checkIns.filter(ci => (ci.tenantId || 'default') === tId);
      const tenantPayments = payments.filter(p => (p.tenantId || 'default') === tId);
      const tenantExpenses = expenses.filter(e => (e.tenantId || 'default') === tId);
      const tenantAppointments = appointments.filter(a => (a.tenantId || 'default') === tId);
      const tenantAuditLogs = auditLogs.filter(al => (al.tenantId || 'default') === tId);
      const tenantPdfDocs = pdfDocuments.filter(d => (d.tenantId || 'default') === tId);

      tenantClients.forEach(c => saveToCloud('clients', c));
      tenantPrograms.forEach(p => saveToCloud('programs', p));
      tenantCheckIns.forEach(ci => saveToCloud('checkIns', ci));
      tenantPayments.forEach(p => saveToCloud('payments', p));
      tenantExpenses.forEach(e => saveToCloud('expenses', e));
      tenantAppointments.forEach(a => saveToCloud('appointments', a));
      tenantAuditLogs.forEach(al => saveToCloud('auditLogs', al));
      tenantPdfDocs.forEach(d => saveToCloud('pdfDocuments', d));

      // Push Cloud Shadow Backup doc scoped by tenantId
      if (db && !isFirestoreQuotaExceeded) {
        const shadowData = {
          tenantId: tId,
          timestamp: new Date().toISOString(),
          data: JSON.stringify({
            clients: tenantClients,
            programs: tenantPrograms,
            checkIns: tenantCheckIns,
            payments: tenantPayments,
            expenses: tenantExpenses,
            appointments: tenantAppointments,
            auditLogs: tenantAuditLogs,
            pdfDocuments: tenantPdfDocs
          })
        };
        await setDoc(doc(db, 'shadow_backups', tId), shadowData).catch(e => console.warn('Shadow backup setDoc error:', e));
        await setDoc(doc(db, 'cloud_backups', tId), shadowData).catch(e => console.warn('Cloud backup setDoc error:', e));
      }

      setIsCloudSynced(true);
    } catch (err) {
      console.error('Failed to force sync all to cloud:', err);
    }
  };

  const purgeAllFirestoreCollections = async () => {
    const colNames = ['clients', 'programs', 'checkIns', 'payments', 'expenses', 'appointments', 'auditLogs', 'pdfDocuments'];
    for (const colName of colNames) {
      try {
        if (db) {
          const snap = await getDocs(collection(db, colName));
          const deletePromises = snap.docs
            .filter(d => {
              const itemTenant = d.data().tenantId || 'default';
              return itemTenant === currentTenant;
            })
            .map(d => deleteDoc(doc(db, colName, d.id)).catch(e => console.warn('Purge quota error:', e)));
          await Promise.all(deletePromises);
        }
      } catch (err) {
        console.warn(`Error purging collection ${colName}:`, err);
      }
    }
  };

  const clearAllData = async () => {
    // 1. Delete all items from Firestore collections directly
    await purgeAllFirestoreCollections();

    // 2. Clear LocalStorage and set to empty arrays
    localStorage.setItem(STORAGE_KEYS.CLIENTS, '[]');
    localStorage.setItem(STORAGE_KEYS.PROGRAMS, '[]');
    localStorage.setItem(STORAGE_KEYS.CHECKINS, '[]');
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, '[]');
    localStorage.setItem(STORAGE_KEYS.EXPENSES, '[]');
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, '[]');
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, '[]');
    localStorage.setItem(STORAGE_KEYS.PDF_DOCS, '[]');

    // 3. Reset React States to empty arrays
    setClients([]);
    setPrograms([]);
    setCheckIns([]);
    setPayments([]);
    setExpenses([]);
    setAppointments([]);
    setAuditLogs([]);
    setPdfDocuments([]);
  };

  const resetData = () => {
    clearAllData();
  };

  return (
    <GymContext.Provider value={{
      isCloudSynced,
      themeMode,
      toggleThemeMode,
      setThemeMode,
      clients,
      programs,
      checkIns,
      payments,
      expenses,
      appointments,
      auditLogs,
      pdfDocuments,
      checkInClient,
      cancelCheckIn,
      updateCheckIn,
      addClient,
      updateClient,
      deleteClient,
      addBodyMetric,
      saveProgram,
      deleteProgram,
      addPdfDocument,
      deletePdfDocument,
      addPayment,
      updatePayment,
      deletePayment,
      addExpense,
      updateExpense,
      deleteExpense,
      addAppointment,
      updateAppointment,
      updateAppointmentStatus,
      deleteAppointment,
      undoAuditAction,
      clearAuditLogs,
      resetData,
      clearAllData,
      exportBackupJson,
      exportClientsCsv,
      importBackupJson,
      syncAllToCloud
    }}>
      {children}
    </GymContext.Provider>
  );
};

export const useGym = () => {
  const context = useContext(GymContext);
  if (!context) {
    throw new Error('useGym must be used within a GymProvider');
  }
  return context;
};
