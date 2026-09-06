import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Wallet, 
  DollarSign, 
  PieChart as PieIcon, 
  Users, 
  Award, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar,
  Filter,
  Building2,
  ShieldCheck,
  Dumbbell,
  Home,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useGym } from '../context/GymContext';
import { useTenant } from '../context/TenantContext';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';

export const ReportsView: React.FC = () => {
  const { clients, payments, expenses, checkIns } = useGym();
  const { currentUser, isMasterAdmin, tenants } = useTenant();

  // Multi-tenant selection (For Master Admin only)
  const [selectedTenantFilter, setSelectedTenantFilter] = useState<string>('all');

  // Year & Month Filter states
  const now = new Date();
  const currentRealYear = now.getFullYear();
  const currentRealMonth = now.getMonth(); // 0-11

  const [selectedYear, setSelectedYear] = useState<number>(currentRealYear);
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all'); // 'all' or 0..11

  // Dynamic available years based on data
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>([currentRealYear, currentRealYear - 1, currentRealYear - 2]);
    payments.forEach(p => {
      const y = new Date(p.paymentDate).getFullYear();
      if (!isNaN(y)) yearsSet.add(y);
    });
    expenses.forEach(e => {
      const y = new Date(e.date).getFullYear();
      if (!isNaN(y)) yearsSet.add(y);
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [payments, expenses, currentRealYear]);

  // Determine effective tenantId filter for strict RBAC
  const effectiveTenantId = useMemo(() => {
    if (!isMasterAdmin) {
      return currentUser?.tenantId || 'default';
    }
    return selectedTenantFilter; // 'all' or specific tenantId
  }, [isMasterAdmin, currentUser, selectedTenantFilter]);

  // Filter raw data strictly by tenant
  const tenantFilteredPayments = useMemo(() => {
    return payments.filter(p => {
      if (isMasterAdmin && effectiveTenantId === 'all') return true;
      const pTenant = p.tenantId || 'default';
      return pTenant === effectiveTenantId;
    });
  }, [payments, isMasterAdmin, effectiveTenantId]);

  const tenantFilteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (isMasterAdmin && effectiveTenantId === 'all') return true;
      const eTenant = e.tenantId || 'default';
      return eTenant === effectiveTenantId;
    });
  }, [expenses, isMasterAdmin, effectiveTenantId]);

  const tenantFilteredClients = useMemo(() => {
    return clients.filter(c => {
      if (isMasterAdmin && effectiveTenantId === 'all') return true;
      const cTenant = c.tenantId || 'default';
      return cTenant === effectiveTenantId;
    });
  }, [clients, isMasterAdmin, effectiveTenantId]);

  const tenantFilteredCheckIns = useMemo(() => {
    return checkIns.filter(ci => {
      if (isMasterAdmin && effectiveTenantId === 'all') return true;
      const ciTenant = ci.tenantId || 'default';
      return ciTenant === effectiveTenantId;
    });
  }, [checkIns, isMasterAdmin, effectiveTenantId]);

  // Period matching helper
  const isMatchSelectedPeriod = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    if (d.getFullYear() !== selectedYear) return false;
    if (selectedMonth !== 'all' && d.getMonth() !== selectedMonth) return false;
    return true;
  };

  // Payments & Expenses within the chosen period
  const periodPayments = useMemo(() => {
    return tenantFilteredPayments.filter(p => isMatchSelectedPeriod(p.paymentDate));
  }, [tenantFilteredPayments, selectedYear, selectedMonth]);

  const periodExpenses = useMemo(() => {
    return tenantFilteredExpenses.filter(e => isMatchSelectedPeriod(e.date));
  }, [tenantFilteredExpenses, selectedYear, selectedMonth]);

  // Calculate 4 Key Metrics
  const totalRevenue = useMemo(() => {
    return periodPayments.reduce((sum, p) => sum + p.amountVnd, 0);
  }, [periodPayments]);

  const totalGymExpense = useMemo(() => {
    return periodExpenses
      .filter(e => e.categoryGroup === 'Phòng gym')
      .reduce((sum, e) => sum + e.amountVnd, 0);
  }, [periodExpenses]);

  const totalFamilyExpense = useMemo(() => {
    return periodExpenses
      .filter(e => e.categoryGroup === 'Gia đình')
      .reduce((sum, e) => sum + e.amountVnd, 0);
  }, [periodExpenses]);

  const totalExpenseAll = totalGymExpense + totalFamilyExpense;
  const totalNetProfit = totalRevenue - totalExpenseAll;
  const profitMargin = totalRevenue > 0 ? Math.round((totalNetProfit / totalRevenue) * 100) : 0;

  // Recharts Chart Data
  const chartData = useMemo(() => {
    if (selectedMonth === 'all') {
      // 12 months view
      const monthNames = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'];
      return monthNames.map((mName, idx) => {
        const rev = tenantFilteredPayments
          .filter(p => {
            const d = new Date(p.paymentDate);
            return d.getFullYear() === selectedYear && d.getMonth() === idx;
          })
          .reduce((sum, p) => sum + p.amountVnd, 0);

        const exp = tenantFilteredExpenses
          .filter(e => {
            const d = new Date(e.date);
            return d.getFullYear() === selectedYear && d.getMonth() === idx;
          })
          .reduce((sum, e) => sum + e.amountVnd, 0);

        const profit = rev - exp;
        return {
          name: mName,
          fullName: `Tháng ${idx + 1}/${selectedYear}`,
          DoanhThu: rev / 1000000,
          ChiPhi: exp / 1000000,
          LoiNhuan: profit / 1000000,
          rawRevenue: rev,
          rawExpense: exp,
          rawProfit: profit
        };
      });
    } else {
      // Specific month selected -> Weekly intervals in that month
      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      const intervals = [
        { name: 'Ngày 01-07', start: 1, end: 7 },
        { name: 'Ngày 08-14', start: 8, end: 14 },
        { name: 'Ngày 15-21', start: 15, end: 21 },
        { name: 'Ngày 22-28', start: 22, end: 28 },
        { name: `Ngày 29-${daysInMonth}`, start: 29, end: daysInMonth }
      ];

      return intervals.map(inter => {
        const rev = tenantFilteredPayments
          .filter(p => {
            const d = new Date(p.paymentDate);
            return (
              d.getFullYear() === selectedYear &&
              d.getMonth() === selectedMonth &&
              d.getDate() >= inter.start &&
              d.getDate() <= inter.end
            );
          })
          .reduce((sum, p) => sum + p.amountVnd, 0);

        const exp = tenantFilteredExpenses
          .filter(e => {
            const d = new Date(e.date);
            return (
              d.getFullYear() === selectedYear &&
              d.getMonth() === selectedMonth &&
              d.getDate() >= inter.start &&
              d.getDate() <= inter.end
            );
          })
          .reduce((sum, e) => sum + e.amountVnd, 0);

        const profit = rev - exp;
        return {
          name: inter.name,
          fullName: `${inter.name} (Tháng ${selectedMonth + 1})`,
          DoanhThu: rev / 1000000,
          ChiPhi: exp / 1000000,
          LoiNhuan: profit / 1000000,
          rawRevenue: rev,
          rawExpense: exp,
          rawProfit: profit
        };
      });
    }
  }, [tenantFilteredPayments, tenantFilteredExpenses, selectedYear, selectedMonth]);

  // Expense distribution by category for pie chart
  const expenseCategoryDistribution = useMemo(() => {
    const catTotals: Record<string, { group: string; amount: number }> = {};
    periodExpenses.forEach(e => {
      const key = e.category || 'Khác';
      if (!catTotals[key]) {
        catTotals[key] = { group: e.categoryGroup, amount: 0 };
      }
      catTotals[key].amount += e.amountVnd;
    });

    const colors = ['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16'];
    const sorted = Object.entries(catTotals)
      .sort((a, b) => b[1].amount - a[1].amount)
      .slice(0, 6)
      .map(([name, val], index) => ({
        name: `${val.group}: ${name}`,
        value: val.amount,
        color: colors[index % colors.length]
      }));

    return sorted.length > 0 ? sorted : [
      { name: 'Chưa có khoản chi', value: 1, color: '#94a3b8' }
    ];
  }, [periodExpenses]);

  // Period label
  const periodLabel = useMemo(() => {
    if (selectedMonth === 'all') {
      return `Năm ${selectedYear}`;
    }
    return `Tháng ${selectedMonth + 1}/${selectedYear}`;
  }, [selectedYear, selectedMonth]);

  // Format VND
  const formatVnd = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* 1. Header & Multi-Tenant Selector Banner */}
      <div className="bg-white border border-slate-200 p-5 sm:p-6 rounded-3xl shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Báo cáo tài chính &amp; Lợi nhuận
            </span>
            
            {/* Tenant status tag */}
            {!isMasterAdmin ? (
              <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                Phòng tập: <strong className="text-slate-900">{currentUser?.gymName || 'Private Gym'}</strong>
              </span>
            ) : (
              <span className="text-xs font-extrabold text-amber-800 bg-amber-50 border border-amber-300 px-3 py-1 rounded-full flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                Master Admin Mode
              </span>
            )}
          </div>

          <h2 className="text-2xl font-black text-slate-900 mt-2 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-indigo-600" />
            Báo Cáo Thống Kê &amp; Lợi Nhuận Ròng
          </h2>
          <p className="text-sm text-slate-500 mt-0.5 font-medium">
            Phân tích tổng thu chi, cơ cấu chi phí gym/gia đình và dòng tiền theo tháng &amp; năm.
          </p>
        </div>

        {/* Master Admin Tenant Filter Dropdown */}
        {isMasterAdmin && (
          <div className="bg-amber-50/80 border border-amber-200 p-3 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-2 self-start lg:self-auto">
            <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs shrink-0">
              <Building2 className="w-4 h-4 text-amber-600" />
              <span>Xem theo phòng tập:</span>
            </div>
            <select
              value={selectedTenantFilter}
              onChange={(e) => setSelectedTenantFilter(e.target.value)}
              className="bg-white border border-amber-300 text-slate-800 font-bold text-xs sm:text-sm rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="all">🌐 Toàn hệ thống (Tất cả phòng tập)</option>
              {tenants.map(t => (
                <option key={t.tenantId} value={t.tenantId}>
                  🏢 {t.gymName} ({t.ownerName || t.username})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 2. Year & Month Filter Controls Bar */}
      <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-3xl shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <span className="font-extrabold text-slate-900 text-sm sm:text-base">Kỳ Báo Cáo Tài Chính:</span>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
              {periodLabel}
            </span>
          </div>

          {/* Year Dropdown Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 shrink-0">Năm tài chính:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-indigo-700 font-black text-sm rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-colors"
            >
              {availableYears.map(y => (
                <option key={y} value={y}>Năm {y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Month Selector Buttons & Shortcuts */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {/* Quick Shortcuts */}
          <div className="flex items-center gap-1.5 mr-2">
            <button
              type="button"
              onClick={() => {
                setSelectedYear(currentRealYear);
                setSelectedMonth('all');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedMonth === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Cả năm
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedYear(currentRealYear);
                setSelectedMonth(currentRealMonth);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedYear === currentRealYear && selectedMonth === currentRealMonth
                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
            >
              Tháng này (Th{currentRealMonth + 1})
            </button>

            <button
              type="button"
              onClick={() => {
                if (currentRealMonth === 0) {
                  setSelectedYear(currentRealYear - 1);
                  setSelectedMonth(11);
                } else {
                  setSelectedYear(currentRealYear);
                  setSelectedMonth(currentRealMonth - 1);
                }
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
            >
              Tháng trước
            </button>
          </div>

          {/* 12 Month Pills */}
          <div className="flex items-center gap-1 overflow-x-auto py-1 max-w-full [scrollbar-width:none]">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setSelectedMonth(m)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedMonth === m
                    ? 'bg-indigo-600 text-white shadow-xs font-black'
                    : 'bg-slate-50 hover:bg-slate-200/70 text-slate-600 border border-slate-200/60'
                }`}
              >
                Th{m + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. 4 KPI Financial Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Revenue */}
        <div className="bg-white border border-slate-200/90 p-5 sm:p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng doanh thu ({periodLabel})</p>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-2">{formatVnd(totalRevenue)}</p>
          <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 mt-2 bg-emerald-50 px-2 py-0.5 rounded-md w-fit">
            <ArrowUpRight className="w-3.5 h-3.5" /> Gói tập &amp; Học viên mới
          </span>
        </div>

        {/* Card 2: Gym Expense */}
        <div className="bg-white border border-slate-200/90 p-5 sm:p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chi phí gym ({periodLabel})</p>
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#FF4E00] flex items-center justify-center">
              <Dumbbell className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#FF4E00] mt-2">{formatVnd(totalGymExpense)}</p>
          <span className="text-[11px] text-slate-500 font-medium mt-2 block">
            Mặt bằng, điện nước, bảo trì...
          </span>
        </div>

        {/* Card 3: Family Expense */}
        <div className="bg-white border border-slate-200/90 p-5 sm:p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chi phí gia đình ({periodLabel})</p>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Home className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#4F46E5] mt-2">{formatVnd(totalFamilyExpense)}</p>
          <span className="text-[11px] text-slate-500 font-medium mt-2 block">
            Sinh hoạt cá nhân HLV
          </span>
        </div>

        {/* Card 4: Net Profit */}
        <div className="bg-white border border-slate-200/90 p-5 sm:p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lợi nhuận ròng ({periodLabel})</p>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${totalNetProfit >= 0 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl sm:text-3xl font-black mt-2 ${totalNetProfit >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
            {formatVnd(totalNetProfit)}
          </p>
          <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t border-slate-100">
            <span className={`font-bold ${totalNetProfit >= 0 ? 'text-indigo-700 bg-indigo-50' : 'text-rose-700 bg-rose-50'} px-2 py-0.5 rounded-md`}>
              Tỷ suất: {profitMargin}%
            </span>
            <span className="text-slate-500 font-medium">Tổng chi: {formatVnd(totalExpenseAll)}</span>
          </div>
        </div>
      </div>

      {/* 4. Main Recharts BarChart */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              {selectedMonth === 'all' 
                ? `Biểu đồ so sánh Doanh thu - Chi phí - Lợi nhuận theo 12 Tháng (${selectedYear})`
                : `Biểu đồ dòng tiền các tuần trong Tháng ${selectedMonth + 1}/${selectedYear}`
              }
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {selectedMonth === 'all'
                ? 'Tổng quan doanh thu, chi phí và lợi nhuận từng tháng trong năm tài chính đã chọn'
                : `Phân rã dòng tiền theo từng tuần trong Tháng ${selectedMonth + 1} của năm ${selectedYear}`
              }
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium">Đơn vị: Triệu VNĐ</span>
          </div>
        </div>

        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(val: any, name: string) => [`${val} Triệu VNĐ`, name]}
              />
              <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '12px', fontWeight: 700 }} />
              <Bar dataKey="DoanhThu" name="Doanh thu" fill="#10b981" radius={[6, 6, 0, 0]} barSize={22} />
              <Bar dataKey="LoiNhuan" name="Lợi nhuận ròng" fill="#4F46E5" radius={[6, 6, 0, 0]} barSize={22} />
              <Bar dataKey="ChiPhi" name="Chi phí (Gym + Gia đình)" fill="#FF4E00" radius={[4, 4, 0, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. Expense Structure & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie chart category distribution */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
            <PieIcon className="w-5 h-5 text-amber-500" />
            Cơ cấu khoản chi ({periodLabel})
          </h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseCategoryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {expenseCategoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: any) => formatVnd(Number(val))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 text-xs">
            {expenseCategoryDistribution.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="flex items-center gap-2 truncate text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="truncate">{item.name}</span>
                </span>
                <span className="font-bold text-slate-900 shrink-0 ml-2">{formatVnd(item.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Operational Performance & PT Retention */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
            <Award className="w-5 h-5 text-indigo-600" />
            Hiệu suất vận hành &amp; Giữ chân học viên ({periodLabel})
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
              <p className="text-xs text-slate-500 font-bold">Tỷ lệ gia hạn hợp đồng</p>
              <p className="text-2xl font-black text-indigo-600 mt-1">88.5%</p>
              <p className="text-[11px] text-emerald-600 font-bold mt-1">Chỉ số lý tưởng cho mô hình Private Gym</p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
              <p className="text-xs text-slate-500 font-bold">Số phiếu thu ghi nhận trong kỳ</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">{periodPayments.length} giao dịch</p>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">Bao gồm đóng mới &amp; gia hạn gói tập</p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
              <p className="text-xs text-slate-500 font-bold">Tổng số check-in thành công</p>
              <p className="text-2xl font-black text-[#4F46E5] mt-1">{tenantFilteredCheckIns.length} buổi</p>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">Lưu trữ minh bạch trên hệ thống</p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
              <p className="text-xs text-slate-500 font-bold">Tổng số học viên của phòng</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{tenantFilteredClients.length} người</p>
              <p className="text-[11px] text-indigo-600 font-bold mt-1">Đã phân quyền độc lập theo Tenant</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
