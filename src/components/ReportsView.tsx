import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Wallet, 
  DollarSign, 
  PieChart as PieIcon, 
  Award, 
  Calendar,
  Building2,
  ShieldCheck,
  Dumbbell,
  Home,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Download,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Receipt,
  Eye
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

interface ReportsViewProps {
  onNavigateTab?: (tab: 'revenue' | 'expenses') => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ onNavigateTab }) => {
  const { clients, payments, expenses } = useGym();
  const { currentUser, isMasterAdmin, tenants } = useTenant();

  // Multi-tenant selection (Master Admin only)
  const [selectedTenantFilter, setSelectedTenantFilter] = useState<string>('all');

  // Year & Month Filter states
  const now = new Date();
  const currentRealYear = now.getFullYear();
  const currentRealMonth = now.getMonth(); // 0-11

  const [selectedYear, setSelectedYear] = useState<number>(currentRealYear);
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all'); // 'all' or 0..11

  // Detail modal state for drill-down by month
  const [drilldownMonth, setDrilldownMonth] = useState<number | null>(null);

  // Dynamic available years based on data
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>([currentRealYear, currentRealYear - 1, currentRealYear - 2]);
    (payments || []).forEach(p => {
      const y = new Date(p.paymentDate).getFullYear();
      if (!isNaN(y)) yearsSet.add(y);
    });
    (expenses || []).forEach(e => {
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
    return (payments || []).filter(p => {
      if (isMasterAdmin && effectiveTenantId === 'all') return true;
      const pTenant = p.tenantId || 'default';
      return pTenant === effectiveTenantId;
    });
  }, [payments, isMasterAdmin, effectiveTenantId]);

  const tenantFilteredExpenses = useMemo(() => {
    return (expenses || []).filter(e => {
      if (isMasterAdmin && effectiveTenantId === 'all') return true;
      const eTenant = e.tenantId || 'default';
      return eTenant === effectiveTenantId;
    });
  }, [expenses, isMasterAdmin, effectiveTenantId]);

  // Period matching helper
  const isMatchPeriod = (dateStr: string, year: number, month: number | 'all') => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    if (d.getFullYear() !== year) return false;
    if (month !== 'all' && d.getMonth() !== month) return false;
    return true;
  };

  // Payments & Expenses within the current selected period
  const periodPayments = useMemo(() => {
    return tenantFilteredPayments.filter(p => isMatchPeriod(p.paymentDate, selectedYear, selectedMonth));
  }, [tenantFilteredPayments, selectedYear, selectedMonth]);

  const periodExpenses = useMemo(() => {
    return tenantFilteredExpenses.filter(e => isMatchPeriod(e.date, selectedYear, selectedMonth));
  }, [tenantFilteredExpenses, selectedYear, selectedMonth]);

  // 1. KPI 1: Total Revenue
  const totalRevenue = useMemo(() => {
    return periodPayments.reduce((sum, p) => sum + p.amountVnd, 0);
  }, [periodPayments]);

  // 2. KPI 2: Total Expenses (Gym & Family breakdown)
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

  const totalExpenses = totalGymExpense + totalFamilyExpense;

  // 3. KPI 3: Net Profit
  const netProfit = totalRevenue - totalExpenses;
  const profitAfterGymOnly = totalRevenue - totalGymExpense;

  // 4. KPI 4: Profit Margin & Evaluation
  const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;
  const profitEvaluation = useMemo(() => {
    if (totalRevenue === 0 && totalExpenses === 0) return 'Chưa phát sinh dữ liệu';
    if (profitMargin >= 50) return 'Hiệu suất xuất sắc';
    if (profitMargin >= 30) return 'Tỷ suất tối ưu';
    if (profitMargin > 0) return 'Hiệu quả ổn định';
    return 'Cần tối ưu chi phí';
  }, [profitMargin, totalRevenue, totalExpenses]);

  // Recharts 12-Month Bar Chart Data
  const chart12MonthsData = useMemo(() => {
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
  }, [tenantFilteredPayments, tenantFilteredExpenses, selectedYear]);

  // Detailed 12 Months Table Data
  const table12MonthsData = useMemo(() => {
    return Array.from({ length: 12 }, (_, idx) => {
      const monthPayments = tenantFilteredPayments.filter(p => {
        const d = new Date(p.paymentDate);
        return d.getFullYear() === selectedYear && d.getMonth() === idx;
      });

      const monthExpenses = tenantFilteredExpenses.filter(e => {
        const d = new Date(e.date);
        return d.getFullYear() === selectedYear && d.getMonth() === idx;
      });

      const rev = monthPayments.reduce((sum, p) => sum + p.amountVnd, 0);
      const gymExp = monthExpenses
        .filter(e => e.categoryGroup === 'Phòng gym')
        .reduce((sum, e) => sum + e.amountVnd, 0);
      const famExp = monthExpenses
        .filter(e => e.categoryGroup === 'Gia đình')
        .reduce((sum, e) => sum + e.amountVnd, 0);
      const totalExp = gymExp + famExp;
      const profit = rev - totalExp;
      const margin = rev > 0 ? Math.round((profit / rev) * 100) : 0;
      const isCurrentMonth = selectedYear === currentRealYear && idx === currentRealMonth;

      return {
        monthIndex: idx,
        monthName: `Tháng ${idx + 1}`,
        isCurrentMonth,
        paymentCount: monthPayments.length,
        revenue: rev,
        gymExpense: gymExp,
        familyExpense: famExp,
        totalExpense: totalExp,
        netProfit: profit,
        margin,
        payments: monthPayments,
        expenses: monthExpenses
      };
    });
  }, [tenantFilteredPayments, tenantFilteredExpenses, selectedYear, currentRealYear, currentRealMonth]);

  // Year Totals for Table Footer
  const yearTableTotals = useMemo(() => {
    const totalPaymentsCount = table12MonthsData.reduce((sum, r) => sum + r.paymentCount, 0);
    const totalRev = table12MonthsData.reduce((sum, r) => sum + r.revenue, 0);
    const totalGym = table12MonthsData.reduce((sum, r) => sum + r.gymExpense, 0);
    const totalFam = table12MonthsData.reduce((sum, r) => sum + r.familyExpense, 0);
    const totalExp = totalGym + totalFam;
    const totalProfit = totalRev - totalExp;
    const avgMargin = totalRev > 0 ? Math.round((totalProfit / totalRev) * 100) : 0;

    return {
      paymentCount: totalPaymentsCount,
      revenue: totalRev,
      gymExpense: totalGym,
      familyExpense: totalFam,
      totalExpense: totalExp,
      netProfit: totalProfit,
      margin: avgMargin
    };
  }, [table12MonthsData]);

  // Expense Donut Distribution
  const expenseCategoryDistribution = useMemo(() => {
    const catTotals: Record<string, { group: string; amount: number }> = {};
    periodExpenses.forEach(e => {
      const key = e.category || 'Chi phí khác';
      if (!catTotals[key]) {
        catTotals[key] = { group: e.categoryGroup, amount: 0 };
      }
      catTotals[key].amount += e.amountVnd;
    });

    const colors = [
      '#FF4E00', // vibrant orange (gym rent/space)
      '#3B82F6', // blue (utilities)
      '#10B981', // emerald
      '#6366F1', // indigo (family)
      '#EC4899', // pink
      '#8B5CF6', // purple
      '#F59E0B', // amber
      '#64748B'  // slate (others)
    ];

    const sorted = Object.entries(catTotals)
      .sort((a, b) => b[1].amount - a[1].amount)
      .map(([name, val], index) => ({
        name: val.group === 'Gia đình' ? `[GĐ] ${name}` : name,
        pureName: name,
        group: val.group,
        value: val.amount,
        color: colors[index % colors.length]
      }));

    return sorted.length > 0 ? sorted : [
      { name: 'Chưa có khoản chi', pureName: 'Chưa có khoản chi', group: 'Chung', value: 1, color: '#94A3B8' }
    ];
  }, [periodExpenses]);

  // Navigation handlers
  const handlePrevPeriod = () => {
    if (selectedMonth === 'all') {
      setSelectedYear(prev => prev - 1);
    } else {
      if (selectedMonth === 0) {
        setSelectedYear(prev => prev - 1);
        setSelectedMonth(11);
      } else {
        setSelectedMonth(prev => (prev as number) - 1);
      }
    }
  };

  const handleNextPeriod = () => {
    if (selectedMonth === 'all') {
      setSelectedYear(prev => prev + 1);
    } else {
      if (selectedMonth === 11) {
        setSelectedYear(prev => prev + 1);
        setSelectedMonth(0);
      } else {
        setSelectedMonth(prev => (prev as number) + 1);
      }
    }
  };

  // Export CSV Report with UTF-8 BOM
  const handleExportCSV = () => {
    const periodString = selectedMonth === 'all' ? `Ca_Nam_${selectedYear}` : `Thang_${selectedMonth + 1}_${selectedYear}`;
    const gymNameStr = currentUser?.gymName ? currentUser.gymName.replace(/[^a-zA-Z0-9]/g, '_') : 'Gym';
    const filename = `Bao_Cao_Tai_Chinh_${gymNameStr}_${periodString}.csv`;

    const headers = [
      'Tháng',
      'Số GD Thu',
      'Doanh Thu (VNĐ)',
      'Chi Phí Gym (VNĐ)',
      'Chi Phí Gia Đình (VNĐ)',
      'Tổng Chi Phí (VNĐ)',
      'Lợi Nhuận Ròng (VNĐ)',
      'Tỷ Suất Lợi Nhuận (%)'
    ];

    const rows = table12MonthsData.map(r => [
      `"${r.monthName}"`,
      r.paymentCount,
      r.revenue,
      r.gymExpense,
      r.familyExpense,
      r.totalExpense,
      r.netProfit,
      `${r.margin}%`
    ]);

    // Footer summary row
    rows.push([
      `"TỔNG CỘNG NĂM ${selectedYear}"`,
      yearTableTotals.paymentCount,
      yearTableTotals.revenue,
      yearTableTotals.gymExpense,
      yearTableTotals.familyExpense,
      yearTableTotals.totalExpense,
      yearTableTotals.netProfit,
      `${yearTableTotals.margin}%`
    ]);

    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Format currency VNĐ
  const formatVnd = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const periodLabel = selectedMonth === 'all' 
    ? `Cả năm ${selectedYear}` 
    : `Tháng ${selectedMonth + 1}/${selectedYear}`;

  const activeDrilldownData = drilldownMonth !== null ? table12MonthsData[drilldownMonth] : null;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* 1. Header & Multi-Tenant Selector Banner */}
      <div className="bg-white border border-slate-200 p-5 sm:p-6 rounded-3xl shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              BÁO CÁO &amp; PHÂN TÍCH LỢI NHUẬN
            </span>
            
            {/* Multi-tenant identifier badge */}
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
            Báo Cáo Thống Kê &amp; Lợi Nhuận Thu Chi
          </h2>
          <p className="text-sm text-slate-500 mt-0.5 font-medium">
            Phân tích tổng hợp doanh thu nộp gói, cơ cấu chi phí vận hành gym/gia đình và biên lợi nhuận ròng.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Master Admin Tenant Filter Dropdown */}
          {isMasterAdmin && (
            <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-2xl flex items-center gap-2">
              <div className="flex items-center gap-1 text-amber-900 font-bold text-xs shrink-0">
                <Building2 className="w-3.5 h-3.5 text-amber-600" />
                <span>Khách thuê:</span>
              </div>
              <select
                value={selectedTenantFilter}
                onChange={(e) => setSelectedTenantFilter(e.target.value)}
                className="bg-white border border-amber-300 text-slate-800 font-bold text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                <option value="all">🌐 Toàn hệ thống (Tất cả phòng)</option>
                {(tenants || []).map(t => (
                  <option key={t.tenantId} value={t.tenantId}>
                    🏢 {t.gymName} ({t.ownerName || t.username})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Export CSV / Excel Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Xuất Báo Cáo Excel/CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Controls & Period Selection Bar */}
      <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-3xl shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <span className="font-extrabold text-slate-900 text-sm sm:text-base">Kỳ hiển thị:</span>
            <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
              Kỳ hiển thị: {periodLabel}
            </span>
          </div>

          {/* Controls: Prev, Month Select, Year Select, Next */}
          <div className="flex items-center gap-1.5 self-start md:self-auto">
            {/* Prev Button */}
            <button
              type="button"
              onClick={handlePrevPeriod}
              title="Kỳ trước"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Month Dropdown */}
            <select
              value={selectedMonth === 'all' ? 'all' : selectedMonth}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedMonth(val === 'all' ? 'all' : parseInt(val));
              }}
              className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold text-xs sm:text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">Cả năm {selectedYear}</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>Tháng {i + 1}</option>
              ))}
            </select>

            {/* Year Dropdown */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-black text-xs sm:text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {availableYears.map(y => (
                <option key={y} value={y}>Năm {y}</option>
              ))}
            </select>

            {/* Next Button */}
            <button
              type="button"
              onClick={handleNextPeriod}
              title="Kỳ sau"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Shortcut Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-bold text-slate-500 mr-1">Chọn nhanh:</span>
          
          <button
            type="button"
            onClick={() => {
              setSelectedYear(currentRealYear);
              setSelectedMonth(currentRealMonth);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedYear === currentRealYear && selectedMonth === currentRealMonth
                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300 font-black'
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
            Tháng trước (Th{currentRealMonth === 0 ? 12 : currentRealMonth})
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedMonth('all');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedMonth === 'all'
                ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300 font-black'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
            }`}
          >
            Cả năm {selectedYear}
          </button>
        </div>
      </div>

      {/* 3. 4 KPI Financial Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Revenue */}
        <div className="bg-white border border-slate-200 p-5 sm:p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              TỔNG DOANH THU ({periodLabel})
            </p>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-2">
            {formatVnd(totalRevenue)}
          </p>
          <div className="flex items-center gap-1.5 mt-2.5">
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              {periodPayments.length} giao dịch nộp gói
            </span>
          </div>
        </div>

        {/* Card 2: Expenses */}
        <div className="bg-white border border-slate-200 p-5 sm:p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              TỔNG CHI PHÍ ({periodLabel})
            </p>
            <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-rose-600 mt-2">
            {formatVnd(totalExpenses)}
          </p>
          <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
            <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
              <Dumbbell className="w-3 h-3 text-amber-600" />
              Gym: {formatVnd(totalGymExpense)}
            </span>
            <span className="text-[11px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md flex items-center gap-1">
              <Home className="w-3 h-3 text-indigo-600" />
              GĐ: {formatVnd(totalFamilyExpense)}
            </span>
          </div>
        </div>

        {/* Card 3: Net Profit */}
        <div className="bg-white border border-slate-200 p-5 sm:p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              LỢI NHUẬN RÒNG ({periodLabel})
            </p>
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center ${netProfit >= 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}>
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className={`text-2xl sm:text-3xl font-black mt-2 ${netProfit >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
            {formatVnd(netProfit)}
          </p>
          <div className="text-[11px] text-slate-600 font-semibold mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>LN sau chi Gym:</span>
            <strong className="text-slate-900">{formatVnd(profitAfterGymOnly)}</strong>
          </div>
        </div>

        {/* Card 4: Profit Margin */}
        <div className="bg-white border border-slate-200 p-5 sm:p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              TỶ SUẤT LỢI NHUẬN
            </p>
            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-500 mt-2">
            {profitMargin}%
          </p>
          <div className="flex items-center gap-1.5 mt-2.5">
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
              profitMargin >= 30 ? 'text-emerald-700 bg-emerald-50' : profitMargin > 0 ? 'text-amber-700 bg-amber-50' : 'text-rose-700 bg-rose-50'
            }`}>
              {profitEvaluation}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Visual Charts System (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: 12-Month Bar Chart (2 columns on lg) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                Biểu Đồ Doanh Thu &amp; Lợi Nhuận 12 Tháng Năm {selectedYear}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                So sánh đồng thời 3 chỉ số: Doanh thu nộp gói, Chi phí vận hành &amp; Lợi nhuận ròng
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg self-start sm:self-auto">
              Đơn vị: Triệu VNĐ
            </span>
          </div>

          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart12MonthsData} barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(val: any, name: string) => [`${val} Triệu VNĐ`, name]}
                />
                <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '12px', fontWeight: 700 }} />
                <Bar dataKey="DoanhThu" name="Doanh Thu" fill="#10B981" radius={[4, 4, 0, 0]} barSize={18} />
                <Bar dataKey="LoiNhuan" name="Lợi Nhuận Ròng" fill="#6366F1" radius={[4, 4, 0, 0]} barSize={18} />
                <Bar dataKey="ChiPhi" name="Tổng Chi Phí" fill="#F97316" radius={[4, 4, 0, 0]} barSize={10} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Donut Chart - Expense Breakdown (1 column on lg) */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-amber-500" />
              Phân Bổ Cơ Cấu Chi Phí
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Chi tiết theo từng danh mục trong {periodLabel}
            </p>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseCategoryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
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

          {/* Detailed Category Legend Breakdown */}
          <div className="space-y-2 text-xs max-h-48 overflow-y-auto pr-1">
            {expenseCategoryDistribution.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-1.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="flex items-center gap-2 truncate text-slate-700">
                  <span className="w-3 h-3 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: item.color }} />
                  <span className="truncate font-semibold">{item.name}</span>
                </span>
                <span className="font-extrabold text-slate-900 shrink-0 ml-2">
                  {formatVnd(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 5. Monthly Breakdown Table (12 Tháng Báo Cáo) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
              Bảng Thống Kê Chi Tiết 12 Tháng Năm {selectedYear}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Đối soát doanh thu, chi phí phân loại và hiệu quả sinh lời từng tháng
            </p>
          </div>
          <span className="text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full w-fit">
            12 Tháng Báo Cáo
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-black text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-3 rounded-l-xl">THÁNG</th>
                <th className="py-3 px-3 text-center">SỐ GD THU</th>
                <th className="py-3 px-3 text-right">DOANH THU</th>
                <th className="py-3 px-3 text-right">CHI PHÍ GYM</th>
                <th className="py-3 px-3 text-right">CHI PHÍ GIA ĐÌNH</th>
                <th className="py-3 px-3 text-right">TỔNG CHI PHÍ</th>
                <th className="py-3 px-3 text-right">LỢI NHUẬN RÒNG</th>
                <th className="py-3 px-3 text-center">TỶ SUẤT</th>
                <th className="py-3 px-3 text-center rounded-r-xl">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {table12MonthsData.map((row) => (
                <tr key={row.monthIndex} className="hover:bg-slate-50/80 transition-colors">
                  {/* Month */}
                  <td className="py-3 px-3 font-extrabold text-slate-900 flex items-center gap-2">
                    <span>{row.monthName}</span>
                    {row.isCurrentMonth && (
                      <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                        Hiện tại
                      </span>
                    )}
                  </td>

                  {/* Payment Count */}
                  <td className="py-3 px-3 text-center">
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-lg font-black text-[11px]">
                      {row.paymentCount} GD
                    </span>
                  </td>

                  {/* Revenue */}
                  <td className="py-3 px-3 text-right font-black text-emerald-600">
                    {formatVnd(row.revenue)}
                  </td>

                  {/* Gym Expense */}
                  <td className="py-3 px-3 text-right font-bold text-amber-700">
                    {formatVnd(row.gymExpense)}
                  </td>

                  {/* Family Expense */}
                  <td className="py-3 px-3 text-right font-bold text-indigo-700">
                    {formatVnd(row.familyExpense)}
                  </td>

                  {/* Total Expense */}
                  <td className="py-3 px-3 text-right font-black text-rose-600">
                    {formatVnd(row.totalExpense)}
                  </td>

                  {/* Net Profit */}
                  <td className={`py-3 px-3 text-right font-black ${row.netProfit >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                    {formatVnd(row.netProfit)}
                  </td>

                  {/* Profit Margin */}
                  <td className="py-3 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded-md font-extrabold text-[11px] ${
                      row.margin >= 30 ? 'bg-emerald-50 text-emerald-700' : row.margin > 0 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {row.margin}%
                    </span>
                  </td>

                  {/* Action */}
                  <td className="py-3 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => setDrilldownMonth(row.monthIndex)}
                      className="text-xs font-extrabold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1"
                    >
                      <span>Xem chi tiết</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

            {/* High-Contrast Dark Footer Summary Row */}
            <tfoot>
              <tr className="bg-slate-900 text-white font-extrabold text-xs">
                <td className="py-3.5 px-3 rounded-l-2xl uppercase tracking-wider text-amber-400">
                  TỔNG CỘNG NĂM {selectedYear}
                </td>
                <td className="py-3.5 px-3 text-center text-emerald-400">
                  {yearTableTotals.paymentCount} GD
                </td>
                <td className="py-3.5 px-3 text-right text-emerald-400 font-black">
                  {formatVnd(yearTableTotals.revenue)}
                </td>
                <td className="py-3.5 px-3 text-right text-amber-300">
                  {formatVnd(yearTableTotals.gymExpense)}
                </td>
                <td className="py-3.5 px-3 text-right text-indigo-300">
                  {formatVnd(yearTableTotals.familyExpense)}
                </td>
                <td className="py-3.5 px-3 text-right text-rose-400 font-black">
                  {formatVnd(yearTableTotals.totalExpense)}
                </td>
                <td className="py-3.5 px-3 text-right font-black text-amber-400">
                  {formatVnd(yearTableTotals.netProfit)}
                </td>
                <td className="py-3.5 px-3 text-center text-amber-400 font-black">
                  {yearTableTotals.margin}%
                </td>
                <td className="py-3.5 px-3 rounded-r-2xl text-center text-slate-400">
                  -
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 6. Drilldown Month Details Modal */}
      {drilldownMonth !== null && activeDrilldownData && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scale-up border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-600" />
                <div>
                  <h4 className="font-black text-slate-900 text-base">
                    Chi Tiết Thu Chi: {activeDrilldownData.monthName} Năm {selectedYear}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    {activeDrilldownData.paymentCount} phiếu thu &bull; {activeDrilldownData.expenses.length} khoản chi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDrilldownMonth(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Quick Summary Grid */}
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase">Thu vào</span>
                  <p className="text-sm font-black text-emerald-600 mt-0.5">{formatVnd(activeDrilldownData.revenue)}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                  <span className="text-[10px] font-bold text-rose-700 uppercase">Chi ra</span>
                  <p className="text-sm font-black text-rose-600 mt-0.5">{formatVnd(activeDrilldownData.totalExpense)}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200">
                  <span className="text-[10px] font-bold text-indigo-700 uppercase">Lợi nhuận ròng</span>
                  <p className="text-sm font-black text-indigo-600 mt-0.5">{formatVnd(activeDrilldownData.netProfit)}</p>
                </div>
              </div>

              {/* Transactions Tab or Lists */}
              <div className="space-y-3 pt-2">
                <h5 className="font-black text-slate-900 flex items-center justify-between">
                  <span>Khoản Thu Trong Tháng ({activeDrilldownData.payments.length})</span>
                  <span className="text-emerald-600 font-black">{formatVnd(activeDrilldownData.revenue)}</span>
                </h5>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {activeDrilldownData.payments.length === 0 ? (
                    <p className="text-slate-400 italic py-2 text-center">Không có khoản thu nào trong tháng này.</p>
                  ) : (
                    activeDrilldownData.payments.map((p) => (
                      <div key={p.id} className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900">{p.clientName}</p>
                          <p className="text-[10px] text-slate-500">{p.packageName} &bull; {p.paymentDate}</p>
                        </div>
                        <span className="font-black text-emerald-600">+{formatVnd(p.amountVnd)}</span>
                      </div>
                    ))
                  )}
                </div>

                <h5 className="font-black text-slate-900 flex items-center justify-between pt-2 border-t border-slate-100">
                  <span>Khoản Chi Trong Tháng ({activeDrilldownData.expenses.length})</span>
                  <span className="text-rose-600 font-black">-{formatVnd(activeDrilldownData.totalExpense)}</span>
                </h5>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {activeDrilldownData.expenses.length === 0 ? (
                    <p className="text-slate-400 italic py-2 text-center">Không có khoản chi nào trong tháng này.</p>
                  ) : (
                    activeDrilldownData.expenses.map((e) => (
                      <div key={e.id} className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900">{e.notes || e.category}</p>
                          <p className="text-[10px] text-slate-500">[{e.categoryGroup}] {e.category} &bull; {e.date}</p>
                        </div>
                        <span className="font-black text-rose-600">-{formatVnd(e.amountVnd)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setSelectedMonth(drilldownMonth);
                  setDrilldownMonth(null);
                }}
                className="text-xs font-black text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Đặt bộ lọc theo tháng này</span>
              </button>

              <button
                type="button"
                onClick={() => setDrilldownMonth(null)}
                className="text-xs font-bold text-slate-700 hover:bg-slate-200 bg-slate-100 px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
