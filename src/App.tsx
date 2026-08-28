import { getTodayDateStr } from './utils/dateUtils';
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './lib/firebase';
import { auth } from './lib/firebase';

import { TenantProvider, useTenant } from './context/TenantContext';
import { GymProvider } from './context/GymContext';
import { Navbar } from './components/Navbar';
import { QuickCheckInModal } from './components/QuickCheckInModal';
import { SettingsModal } from './components/SettingsModal';
import { DashboardView } from './components/DashboardView';
import { ClientManagementView } from './components/ClientManagementView';
import { AppointmentsView } from './components/AppointmentsView';
import { WorkoutProgramView } from './components/WorkoutProgramView';
import { RevenueView } from './components/RevenueView';
import { ExpensesView } from './components/ExpensesView';
import { FinanceView } from './components/FinanceView';
import { ReportsView } from './components/ReportsView';
import { AuditLogView } from './components/AuditLogView';
import { LoginView } from './components/LoginView';
import { AdminTenantsView } from './components/AdminTenantsView';
import { AccountExpiredSuspendedView } from './components/AccountExpiredSuspendedView';
import { Client } from './types';

interface AppContentProps {
  onLogout: () => void;
}

const AppContent: React.FC<AppContentProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isQuickCheckInOpen, setIsQuickCheckInOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [selectedClientForCheckIn, setSelectedClientForCheckIn] = useState<Client | null>(null);
  const [selectedClientForDetail, setSelectedClientForDetail] = useState<Client | null>(null);
  const [programTargetClientId, setProgramTargetClientId] = useState<string | null>(null);

  const handleOpenQuickCheckIn = (client?: Client) => {
    setSelectedClientForCheckIn(client || null);
    setIsQuickCheckInOpen(true);
  };

  const handleSelectClientFromSearch = (client: Client) => {
    setSelectedClientForDetail(client);
    setActiveTab('clients');
  };

  const handleGoToProgram = (clientId: string) => {
    setProgramTargetClientId(clientId);
    setActiveTab('program');
  };

  const { isMasterAdmin, currentUser, logout } = useTenant();

  // Tab Access Control Guard for PT accounts
  useEffect(() => {
    const adminOnlyTabs = ['admin_tenants'];
    if (!isMasterAdmin && adminOnlyTabs.includes(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [activeTab, isMasterAdmin]);

  const handleTabChange = (tab: string) => {
    const adminOnlyTabs = ['admin_tenants'];
    if (!isMasterAdmin && adminOnlyTabs.includes(tab)) {
      setActiveTab('dashboard');
      return;
    }
    if (tab === 'settings') {
      setIsSettingsOpen(true);
    } else {
      setActiveTab(tab);
    }
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#F8FAFC] text-slate-800 font-sans antialiased selection:bg-[#4F46E5] selection:text-white">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onOpenQuickCheckIn={handleOpenQuickCheckIn}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSelectClient={handleSelectClientFromSearch}
        onLogout={onLogout}
      />

      {/* Main View Container */}
      <main className="w-full max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 overflow-x-hidden">
        {isMasterAdmin && activeTab === 'admin_tenants' && (
          <AdminTenantsView />
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            onOpenQuickCheckIn={handleOpenQuickCheckIn}
            onSelectClientDetail={handleSelectClientFromSearch}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'clients' && (
          <ClientManagementView
            onOpenQuickCheckIn={handleOpenQuickCheckIn}
            onGoToProgram={handleGoToProgram}
            selectedClientFromNav={selectedClientForDetail}
            onGoToAudit={() => setActiveTab('audit')}
          />
        )}

        {(activeTab === 'checkin' || activeTab === 'appointments') && (
          <AppointmentsView
            onOpenQuickCheckIn={handleOpenQuickCheckIn}
            onGoToProgram={handleGoToProgram}
            onSelectClientDetail={handleSelectClientFromSearch}
          />
        )}

        {(activeTab === 'program' || activeTab === 'programs') && (
          <WorkoutProgramView
            initialClientId={programTargetClientId}
          />
        )}

        {(activeTab === 'finance' || activeTab === 'revenue' || activeTab === 'expenses') && (
          <FinanceView initialTab={activeTab === 'expenses' ? 'expenses' : 'revenue'} />
        )}

        {(activeTab === 'reports' || activeTab === 'audit') && (
          <ReportsView 
            activeSubTab={activeTab as 'reports' | 'audit'} 
            onSubTabChange={(sub) => setActiveTab(sub)} 
          />
        )}
      </main>

      {/* Global Quick Check-In Modal (3-touch workflow) */}
      <QuickCheckInModal
        isOpen={isQuickCheckInOpen}
        onClose={() => setIsQuickCheckInOpen(false)}
        preselectedClient={selectedClientForCheckIn}
        onGoToProgram={handleGoToProgram}
      />

      {/* Settings & Data Backup Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 shadow-sm">
        <p>© 2026 App quản lý nội bộ của PT phiên bản 1.0 • Tối ưu quản lý học viên, doanh thu &amp; giáo án</p>
      </footer>

    </div>
  );
};

const MainWrapper: React.FC = () => {
  const { currentUser, isMasterAdmin, logout } = useTenant();
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        if (currentUser) {
          alert("Phiên đăng nhập đã hết hạn do không có hoạt động trong 10 phút. Vui lòng đăng nhập lại.");
          await logout();
          window.location.reload();
        }
      }, 10 * 60 * 1000); // 10 minutes
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart', 'touchmove', 'touchend'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [currentUser, logout]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  if (!authReady) {
    return <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium">Đang kết nối hệ thống an mật...</p>
      </div>
    </div>;
  }

  if (!currentUser) {
    return <LoginView onLoginSuccess={() => {}} />;
  }

  const todayStr = getTodayDateStr();
  const isSuspended = currentUser.status === 'suspended';
  const isExpired = !isMasterAdmin && currentUser.role !== 'admin' && currentUser.expireDate && currentUser.expireDate < todayStr;

  if (!isMasterAdmin && (isSuspended || isExpired || currentUser.status === 'expired')) {
    return <AccountExpiredSuspendedView />;
  }

  return (
    <GymProvider>
      <AppContent onLogout={logout} />
    </GymProvider>
  );
};

export default function App() {
  return (
    <TenantProvider>
      <MainWrapper />
    </TenantProvider>
  );
}
