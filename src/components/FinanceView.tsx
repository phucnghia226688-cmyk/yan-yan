import React, { useState, useEffect } from 'react';
import { TrendingUp, Wallet, ArrowDownRight, ArrowUpRight, DollarSign, BarChart3 } from 'lucide-react';
import { RevenueView } from './RevenueView';
import { ExpensesView } from './ExpensesView';
import { ReportsView } from './ReportsView';
import { useGym } from '../context/GymContext';
import { useTenant } from '../context/TenantContext';

interface FinanceViewProps {
  initialTab?: 'revenue' | 'expenses' | 'reports';
}

export const FinanceView: React.FC<FinanceViewProps> = ({ initialTab = 'revenue' }) => {
  const [financeTab, setFinanceTab] = useState<'revenue' | 'expenses' | 'reports'>(
    initialTab === 'expenses' ? 'expenses' : initialTab === 'reports' ? 'reports' : 'revenue'
  );
  const { payments, expenses } = useGym();
  const { currentUser, isMasterAdmin } = useTenant();

  useEffect(() => {
    if (initialTab) {
      setFinanceTab(initialTab === 'expenses' ? 'expenses' : initialTab === 'reports' ? 'reports' : 'revenue');
    }
  }, [initialTab]);

  // Tenant-aware top calculations
  const tenantScopedPayments = (payments || []).filter(p => {
    if (isMasterAdmin) return true;
    const pTenant = p.tenantId || 'default';
    return pTenant === (currentUser?.tenantId || 'default');
  });

  const tenantScopedExpenses = (expenses || []).filter(e => {
    if (isMasterAdmin) return true;
    const eTenant = e.tenantId || 'default';
    return eTenant === (currentUser?.tenantId || 'default');
  });

  // Summary Calculations
  const totalRevenue = tenantScopedPayments.reduce((sum, p) => sum + p.amountVnd, 0);
  const totalExpenses = tenantScopedExpenses.reduce((sum, e) => sum + e.amountVnd, 0);
  const netProfit = totalRevenue - totalExpenses;

  return (
    <div className="space-y-6">
      {/* Overview Finance Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full uppercase tracking-wider">
                Quản Lý Tài Chính &amp; Thống Kê
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-2 flex items-center gap-2">
              <Wallet className="w-8 h-8 text-emerald-400" />
              Quản Lý Thu Chi &amp; Báo Cáo
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Theo dõi chi tiết Doanh Thu thu vào, Khoản Chi ra, Báo Cáo Thống Kê và Lợi Nhuận Ròng.
            </p>
          </div>

          {/* Combined Top Stats Cards */}
          <div className="grid grid-cols-3 gap-3 shrink-0">
            <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-2xl text-center">
              <p className="text-[11px] text-slate-400 font-semibold flex items-center justify-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" /> Tổng Thu
              </p>
              <p className="text-sm sm:text-base font-extrabold text-emerald-400 mt-1">
                {totalRevenue.toLocaleString('vi-VN')}đ
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-2xl text-center">
              <p className="text-[11px] text-slate-400 font-semibold flex items-center justify-center gap-1">
                <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" /> Tổng Chi
              </p>
              <p className="text-sm sm:text-base font-extrabold text-rose-400 mt-1">
                {totalExpenses.toLocaleString('vi-VN')}đ
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-2xl text-center">
              <p className="text-[11px] text-slate-400 font-semibold flex items-center justify-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-amber-400" /> Lợi Nhuận
              </p>
              <p className={`text-sm sm:text-base font-extrabold mt-1 ${netProfit >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                {netProfit.toLocaleString('vi-VN')}đ
              </p>
            </div>
          </div>
        </div>

        {/* 3 Sub-tab Navigation Bar */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800 flex-wrap">
          <button
            type="button"
            onClick={() => setFinanceTab('revenue')}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all cursor-pointer ${
              financeTab === 'revenue'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 scale-102'
                : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>1. Quản Lý Doanh Thu (Thu Vào)</span>
          </button>

          <button
            type="button"
            onClick={() => setFinanceTab('expenses')}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all cursor-pointer ${
              financeTab === 'expenses'
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20 scale-102'
                : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>2. Quản Lý Chi Phí (Chi Ra)</span>
          </button>

          <button
            type="button"
            onClick={() => setFinanceTab('reports')}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all cursor-pointer ${
              financeTab === 'reports'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 scale-102'
                : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>3. Báo Cáo Thống Kê &amp; Lợi Nhuận</span>
          </button>
        </div>
      </div>

      {/* Main Tab View Content */}
      <div className="transition-all duration-200">
        {financeTab === 'revenue' && <RevenueView />}
        {financeTab === 'expenses' && <ExpensesView />}
        {financeTab === 'reports' && <ReportsView />}
      </div>
    </div>
  );
};
