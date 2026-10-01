import { getTodayDateStr, formatDate } from '../utils/dateUtils';
import { removeAccents } from '../utils/textUtils';
import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  PlusCircle, 
  Search, 
  CreditCard, 
  Calendar, 
  ArrowUpRight, 
  Filter, 
  X,
  FileSpreadsheet,
  CheckCircle2,
  Trash2,
  Edit3,
  ImageIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useGym } from '../context/GymContext';
import { useTenant } from '../context/TenantContext';
import { PaymentRecord } from '../types';
import { RenewalReceiptModal, RenewalReceiptData } from './RenewalReceiptModal';
import { EditPaymentAmountModal } from './EditPaymentAmountModal';

// Safe date parser to extract month (0-11) and full year
const getMonthYearFromDate = (dateVal?: string | Date | number | null): { month: number; year: number } | null => {
  if (!dateVal && dateVal !== 0) return null;
  if (typeof dateVal === 'number') {
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? null : { month: d.getMonth(), year: d.getFullYear() };
  }
  if (dateVal instanceof Date) {
    return isNaN(dateVal.getTime()) ? null : { month: dateVal.getMonth(), year: dateVal.getFullYear() };
  }
  const str = String(dateVal).trim();
  if (!str) return null;

  // DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const [d, m, y] = str.split('/');
    return { month: Number(m) - 1, year: Number(y) };
  }

  // YYYY-MM-DD
  const ymdMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (ymdMatch) {
    return { month: Number(ymdMatch[2]) - 1, year: Number(ymdMatch[1]) };
  }

  // Fallback to Date parse
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return { month: d.getMonth(), year: d.getFullYear() };
  }

  return null;
};

export const RevenueView: React.FC = () => {
  const { payments, clients, addPayment, deletePayment, cleanupOrphanedRecords } = useGym();
  const { currentUser, isMasterAdmin, viewingTenantId } = useTenant();

  // Strict tenant resolution:
  // - Master in viewing mode -> viewingTenantId
  // - Master default -> 'master-admin'
  // - Regular tenant -> currentUser.tenantId
  const currentTenant = (isMasterAdmin && viewingTenantId)
    ? viewingTenantId
    : (currentUser?.tenantId || (isMasterAdmin ? 'master-admin' : 'default'));

  // Auto trigger orphan record cleanup when revenue view loads
  useEffect(() => {
    cleanupOrphanedRecords();
  }, [currentTenant]);

  const [searchQuery, setSearchQuery] = useState('');
  
  // Real current month & year
  const now = new Date();
  const currentRealMonth = now.getMonth(); // 0-indexed (0 = Th1, 9 = Th10)
  const currentRealYear = now.getFullYear();

  // Period filter states: strictly default to current month and year
  const [filterPeriod, setFilterPeriod] = useState<'month' | 'year' | 'all'>('month');
  const [selectedMonth, setSelectedMonth] = useState<number>(currentRealMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentRealYear);

  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [renewalReceiptData, setRenewalReceiptData] = useState<RenewalReceiptData | null>(null);
  const [editingPaymentAmount, setEditingPaymentAmount] = useState<PaymentRecord | null>(null);

  const validClientIds = useMemo(() => new Set((clients || []).map(c => c.id)), [clients]);

  // Tenant-scoped payments with orphan client validation
  const tenantScopedPayments = useMemo(() => {
    return (payments || []).filter(p => {
      const pTenant = p.tenantId || 'master-admin';
      const targetTenant = currentTenant || 'master-admin';
      if (pTenant !== targetTenant) return false;

      if (p.clientId && p.clientId.trim() !== '') {
        if (clients.length > 0 && !validClientIds.has(p.clientId)) return false;
      }
      return true;
    });
  }, [payments, clients, currentTenant, validClientIds]);

  // Dynamically compute list of available years from data + adjacent years
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    yearsSet.add(currentRealYear);
    yearsSet.add(currentRealYear - 1);
    yearsSet.add(currentRealYear + 1);
    (tenantScopedPayments || []).forEach(p => {
      const my = getMonthYearFromDate(p.paymentDate);
      if (my) yearsSet.add(my.year);
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [tenantScopedPayments, currentRealYear]);

  // Payments matching the selected period
  const periodPayments = useMemo(() => {
    return tenantScopedPayments.filter(p => {
      const my = getMonthYearFromDate(p.paymentDate);
      if (!my) return false;
      if (filterPeriod === 'month') {
        return my.month === selectedMonth && my.year === selectedYear;
      }
      if (filterPeriod === 'year') {
        return my.year === selectedYear;
      }
      return true; // 'all'
    });
  }, [tenantScopedPayments, filterPeriod, selectedMonth, selectedYear]);

  // Payments in selectedYear (for Card 2)
  const yearPayments = useMemo(() => {
    return tenantScopedPayments.filter(p => {
      const my = getMonthYearFromDate(p.paymentDate);
      return my && my.year === selectedYear;
    });
  }, [tenantScopedPayments, selectedYear]);

  // Financial calculations
  const totalRevenuePeriod = useMemo(() => {
    return periodPayments.reduce((sum, p) => sum + (p.amountVnd || 0), 0);
  }, [periodPayments]);

  const totalRevenueYear = useMemo(() => {
    return yearPayments.reduce((sum, p) => sum + (p.amountVnd || 0), 0);
  }, [yearPayments]);

  const totalRevenueAll = useMemo(() => {
    return tenantScopedPayments.reduce((sum, p) => sum + (p.amountVnd || 0), 0);
  }, [tenantScopedPayments]);

  // Filtered payments by search query within the selected period
  const filteredPayments = useMemo(() => {
    return periodPayments.filter(p => {
      if (!searchQuery.trim()) return true;
      const searchNormalized = removeAccents(searchQuery.trim().toLowerCase());
      const nameNormalized = removeAccents((p.clientName || '').toLowerCase());
      const packageNormalized = removeAccents((p.packageName || '').toLowerCase());
      const notesNormalized = removeAccents((p.notes || '').toLowerCase());
      return (
        nameNormalized.includes(searchNormalized) ||
        packageNormalized.includes(searchNormalized) ||
        notesNormalized.includes(searchNormalized)
      );
    });
  }, [periodPayments, searchQuery]);

  // Month navigation helpers
  const handlePrevMonth = () => {
    setFilterPeriod('month');
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    setFilterPeriod('month');
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  // Helper strings for period labels
  const padMonth = String(selectedMonth + 1).padStart(2, '0');
  const periodDisplayLabel = filterPeriod === 'month'
    ? `Tháng ${padMonth}/${selectedYear}`
    : filterPeriod === 'year'
    ? `Cả năm ${selectedYear}`
    : 'Tất cả thời gian';

  const isCurrentRealPeriod = (filterPeriod === 'month' && selectedMonth === currentRealMonth && selectedYear === currentRealYear) ||
    (filterPeriod === 'year' && selectedYear === currentRealYear);

  // Quick filter shortcuts
  const prevMonthNum = currentRealMonth === 0 ? 11 : currentRealMonth - 1;
  const prevMonthYear = currentRealMonth === 0 ? currentRealYear - 1 : currentRealYear;
  const prevMonthDisplay = currentRealMonth === 0 ? 12 : currentRealMonth;

  const isThisMonthActive = filterPeriod === 'month' && selectedMonth === currentRealMonth && selectedYear === currentRealYear;
  const isPrevMonthActive = filterPeriod === 'month' && selectedMonth === prevMonthNum && selectedYear === prevMonthYear;
  const isYearActive = filterPeriod === 'year';
  const isAllActive = filterPeriod === 'all';

  const handleOpenReceipt = (payment: PaymentRecord) => {
    const payDateFormatted = formatDate(payment.paymentDate);
    setRenewalReceiptData({
      clientName: payment.clientName,
      packageName: payment.packageName,
      amountPaid: payment.amountVnd,
      addedSessions: payment.sessionsCount,
      totalRemainingSessions: (payment.previousState?.remainingSessions || 0) + payment.sessionsCount,
      newExpirationDate: payment.newEndDate ? formatDate(payment.newEndDate) : '',
      createdAt: payDateFormatted
    });
  };

  // New Payment Form
  const [paymentForm, setPaymentForm] = useState({
    clientId: clients.length > 0 ? clients[0].id : '',
    packageName: 'Gói 12 buổi',
    sessionsCount: 12,
    amountVnd: 6000000,
    paymentMethod: 'Chuyển khoản' as PaymentRecord['paymentMethod'],
    paymentDate: getTodayDateStr(),
    notes: ''
  });

  const handleSelectClientInForm = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    setPaymentForm(prev => ({
      ...prev,
      clientId,
      packageName: client?.packageName || 'Gói 12 buổi'
    }));
  };

  const handlePackageChange = (pkgName: string) => {
    let sessions = 12;
    let price = 6000000;
    if (pkgName.includes('16')) {
      sessions = 16;
      price = 8000000;
    } else if (pkgName.includes('36')) {
      sessions = 36;
      price = 18000000;
    } else if (pkgName.includes('72')) {
      sessions = 72;
      price = 36000000;
    } else if (pkgName.includes('100')) {
      sessions = 100;
      price = 50000000;
    } else if (pkgName.includes('12')) {
      sessions = 12;
      price = 6000000;
    }

    setPaymentForm(prev => ({
      ...prev,
      packageName: pkgName,
      sessionsCount: sessions,
      amountVnd: price
    }));
  };

  const handleCreatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find(c => c.id === paymentForm.clientId);
    if (!client) return;

    addPayment({
      clientId: client.id,
      clientName: client.name,
      packageName: paymentForm.packageName,
      sessionsCount: paymentForm.sessionsCount,
      amountVnd: paymentForm.amountVnd,
      paymentMethod: paymentForm.paymentMethod,
      paymentDate: paymentForm.paymentDate,
      notes: paymentForm.notes,
      tenantId: currentTenant
    } as any);

    setIsAddPaymentModalOpen(false);
  };

  const formatVnd = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  const card1Title = filterPeriod === 'month'
    ? `Doanh thu tháng (${padMonth}/${selectedYear})`
    : filterPeriod === 'year'
    ? `Doanh thu cả năm ${selectedYear}`
    : 'Doanh thu tích lũy toàn bộ';

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* 1. Header */}
      <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            Quản lý doanh thu
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-2 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
            Doanh thu & đóng tiền gói tập
          </h2>
          <p className="text-sm text-slate-500 mt-0.5 font-medium">
            Tự động ghi nhận giao dịch, gói tập, số buổi và hình thức thanh toán.
          </p>
        </div>

        <button
          onClick={() => setIsAddPaymentModalOpen(true)}
          className="bg-[#FF4E00] hover:bg-orange-600 text-white font-extrabold px-5 py-2.5 rounded-full text-sm shadow-md transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 fill-white text-[#FF4E00]" />
          + Ghi nhận đóng tiền mới
        </button>
      </div>

      {/* 2. THANH CÔNG CỤ BỘ LỌC KỲ HIỂN THỊ (FILTER TOOLBAR) */}
      <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-3xl shadow-sm space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          {/* Bên trái: Nhãn kỳ hiển thị & Huy hiệu Hiện tại */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-slate-800 font-extrabold text-sm sm:text-base">
              <span className="text-base">🍸</span>
              <span>Kỳ hiển thị:</span>
            </div>
            <span className="text-xs sm:text-sm font-black text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-3 py-1 rounded-full shadow-xs">
              {periodDisplayLabel}
            </span>
            {isCurrentRealPeriod && (
              <span className="text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs animate-pulse">
                ⚡ Hiện tại
              </span>
            )}
          </div>

          {/* Bên phải: Cụm điều hướng mũi tên và Dropdown chọn thời gian */}
          <div className="flex items-center gap-1.5 self-start lg:self-auto flex-wrap">
            {/* Nút lùi tháng (<) */}
            <button
              type="button"
              onClick={handlePrevMonth}
              title="Lùi 1 tháng"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Dropdown chọn Tháng */}
            <select
              value={filterPeriod === 'all' ? 'all_time' : filterPeriod === 'year' ? 'all_year' : String(selectedMonth)}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'all_time') {
                  setFilterPeriod('all');
                } else if (val === 'all_year') {
                  setFilterPeriod('year');
                } else {
                  setFilterPeriod('month');
                  setSelectedMonth(Number(val));
                }
              }}
              className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold text-xs sm:text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all_time">Tất cả các kỳ</option>
              <option value="all_year">Cả năm ({selectedYear})</option>
              {Array.from({ length: 12 }, (_, i) => {
                const isThisCurrent = i === currentRealMonth && selectedYear === currentRealYear;
                const mPad = String(i + 1).padStart(2, '0');
                return (
                  <option key={i} value={i}>
                    Tháng {mPad} {isThisCurrent ? '(Hiện tại)' : ''}
                  </option>
                );
              })}
            </select>

            {/* Dropdown chọn Năm */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-black text-xs sm:text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {availableYears.map(y => (
                <option key={y} value={y}>
                  Năm {y} {y === currentRealYear ? '(Hiện tại)' : ''}
                </option>
              ))}
            </select>

            {/* Nút tiến tháng (>) */}
            <button
              type="button"
              onClick={handleNextMonth}
              title="Tiến 1 tháng"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer active:scale-95"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dãy nút chuyển nhanh (Quick filter pills) */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-500 mr-1">Chọn nhanh:</span>

          {/* "🟢 Tháng này (Th[X])" */}
          <button
            type="button"
            onClick={() => {
              setFilterPeriod('month');
              setSelectedMonth(currentRealMonth);
              setSelectedYear(currentRealYear);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              isThisMonthActive
                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300 font-black'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}
          >
            <span>🟢</span>
            <span>Tháng này (Th{currentRealMonth + 1})</span>
          </button>

          {/* "Tháng trước (Th[X-1])" */}
          <button
            type="button"
            onClick={() => {
              setFilterPeriod('month');
              setSelectedMonth(prevMonthNum);
              setSelectedYear(prevMonthYear);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              isPrevMonthActive
                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300 font-black'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80'
            }`}
          >
            <span>Tháng trước (Th{prevMonthDisplay})</span>
          </button>

          {/* "📅 Cả năm [YYYY]" */}
          <button
            type="button"
            onClick={() => {
              setFilterPeriod('year');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              isYearActive
                ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300 font-black'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
            }`}
          >
            <span>📅</span>
            <span>Cả năm {selectedYear}</span>
          </button>

          {/* "Tất cả thời gian" */}
          <button
            type="button"
            onClick={() => {
              setFilterPeriod('all');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isAllActive
                ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-400 font-black'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80'
            }`}
          >
            Tất cả thời gian
          </button>
        </div>
      </div>

      {/* 3. Revenue Totals Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Doanh thu tháng/kỳ đã chọn */}
        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm relative overflow-hidden group hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-slate-500 font-extrabold uppercase tracking-wide">
              {card1Title}
            </p>
            <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
              {periodPayments.length} GD
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-2">
            {formatVnd(totalRevenuePeriod)}
          </p>
          <div className="mt-2 text-[11px] text-slate-400 font-medium flex items-center gap-1">
            <span>Kỳ:</span>
            <span className="font-bold text-slate-600">{periodDisplayLabel}</span>
          </div>
        </div>

        {/* Card 2: Doanh thu cả năm */}
        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm relative overflow-hidden group hover:border-orange-300 transition-colors">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-slate-500 font-extrabold uppercase tracking-wide">
              Doanh thu cả năm {selectedYear}
            </p>
            <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-orange-50 text-[#FF4E00] border border-orange-200 shrink-0">
              {yearPayments.length} GD
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#FF4E00] mt-2">
            {formatVnd(totalRevenueYear)}
          </p>
          <div className="mt-2 text-[11px] text-slate-400 font-medium flex items-center gap-1">
            <span>Toàn bộ 12 tháng năm</span>
            <span className="font-bold text-slate-600">{selectedYear}</span>
          </div>
        </div>

        {/* Card 3: Tích lũy toàn bộ */}
        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-colors">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-slate-500 font-extrabold uppercase tracking-wide">
              Tích lũy toàn bộ
            </p>
            <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-indigo-50 text-[#4F46E5] border border-indigo-200 shrink-0">
              {tenantScopedPayments.length} GD
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#4F46E5] mt-2">
            {formatVnd(totalRevenueAll)}
          </p>
          <div className="mt-2 text-[11px] text-slate-400 font-medium flex items-center gap-1">
            <span>Từ trước đến nay</span>
          </div>
        </div>
      </div>

      {/* 4. Payments Table & Filter */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2 flex-wrap">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <h3 className="font-extrabold text-slate-900 text-lg">Danh sách giao dịch thanh toán</h3>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
              {filteredPayments.length} giao dịch
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200 hidden md:inline-block">
              Đang xem: <strong className="text-indigo-600">{periodDisplayLabel}</strong>
            </span>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm tên khách, gói..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-100 text-slate-800 text-xs pl-8 pr-3 py-2 rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white w-40 sm:w-48 transition-all"
              />
            </div>
          </div>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm bg-slate-50 rounded-2xl border border-dashed border-slate-200 font-medium">
            Không có dữ liệu giao dịch phù hợp cho {periodDisplayLabel}.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Ngày thanh toán</th>
                  <th className="p-3">Học viên</th>
                  <th className="p-3">Gói tập</th>
                  <th className="p-3 text-center">Số buổi</th>
                  <th className="p-3 text-right">Số tiền (VNĐ)</th>
                  <th className="p-3">Hình thức</th>
                  <th className="p-3">Ghi chú</th>
                  <th className="p-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredPayments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono text-slate-500 whitespace-nowrap font-medium">{formatDate(p.paymentDate)}</td>
                    <td className="p-3 font-extrabold text-slate-900 whitespace-normal break-words leading-snug">{p.clientName}</td>
                    <td className="p-3 font-bold text-[#4F46E5]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>{p.packageName}</span>
                        {p.category === 'extra_service' && (
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                            ⭐ Dịch vụ
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-center font-bold text-slate-700">
                      {p.category === 'extra_service' ? `${p.sessionsCount} suất` : `${p.sessionsCount} buổi`}
                    </td>
                    <td className="p-3 text-right font-black text-emerald-600 text-sm">
                      <div className="flex items-center justify-end gap-1.5">
                        <div className="text-right">
                          <div>{formatVnd(p.amountVnd)}</div>
                          {p.isEdited && (
                            <span className="inline-block text-[10px] text-amber-600 font-bold italic bg-amber-50 px-1 py-0.2 rounded border border-amber-200/60 mt-0.5 leading-none">
                              * đã chỉnh sửa
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingPaymentAmount(p)}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                          title="Chỉnh sửa lại số tiền (Yêu cầu mật khẩu)"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-full text-[11px] font-bold">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 italic">{p.notes || '-'}</td>
                    <td className="p-3 text-center flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleOpenReceipt(p)}
                        className="text-[#4F46E5] hover:text-indigo-700 p-1.5 rounded-lg hover:bg-indigo-50 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Xuất bill ảnh"
                      >
                        <ImageIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deletePayment(p.id)}
                        className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Xóa giao dịch thanh toán"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD PAYMENT MODAL */}
      {isAddPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 text-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-lg text-slate-900">+ Ghi Nhận Đóng Tiền Gói Tập</h3>
              <button onClick={() => setIsAddPaymentModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePayment} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Chọn học viên *</label>
                <select
                  value={paymentForm.clientId}
                  onChange={(e) => handleSelectClientInForm(e.target.value)}
                  className="w-full bg-slate-100 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Chọn gói tập</label>
                <select
                  value={paymentForm.packageName}
                  onChange={(e) => handlePackageChange(e.target.value)}
                  className="w-full bg-slate-100 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white"
                >
                  <option value="Gói 12 buổi">Gói 12 buổi (12 buổi)</option>
                  <option value="Gói 16 buổi">Gói 16 buổi (16 buổi)</option>
                  <option value="Gói 36 buổi">Gói 36 buổi (36 buổi)</option>
                  <option value="Gói 72 buổi">Gói 72 buổi (72 buổi)</option>
                  <option value="Gói 100 buổi">Gói 100 buổi (100 buổi)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Số buổi cộng thêm</label>
                  <input
                    type="number"
                    value={paymentForm.sessionsCount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, sessionsCount: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-100 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-sm font-extrabold text-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Số tiền (VNĐ) *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={paymentForm.amountVnd ? new Intl.NumberFormat('vi-VN').format(paymentForm.amountVnd) : ''}
                    onChange={(e) => {
                      const digitsOnly = e.target.value.replace(/\D/g, '');
                      setPaymentForm({
                        ...paymentForm,
                        amountVnd: digitsOnly ? parseInt(digitsOnly, 10) : 0
                      });
                    }}
                    placeholder="0"
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-sm text-emerald-600 font-black focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                  {paymentForm.amountVnd > 0 && (
                    <p className="text-[11px] font-extrabold text-emerald-600 mt-1">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(paymentForm.amountVnd)}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Hình thức thanh toán</label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as any })}
                    className="w-full bg-slate-100 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white"
                  >
                    <option value="Chuyển khoản">Chuyển khoản</option>
                    <option value="Tiền mặt">Tiền mặt</option>
                    <option value="Thẻ">Thẻ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Ngày thanh toán</label>
                  <input
                    type="date"
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                    className="w-full bg-slate-100 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Ghi chú</label>
                <input
                  type="text"
                  placeholder="Ghi chú đợt thanh toán..."
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="w-full bg-slate-100 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddPaymentModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-full text-sm font-bold hover:bg-slate-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#FF4E00] hover:bg-orange-600 text-white font-extrabold rounded-full text-sm shadow-md transition-all active:scale-95"
                >
                  Xác nhận đóng tiền
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RENEWAL RECEIPT MODAL */}
      <RenewalReceiptModal 
        isOpen={!!renewalReceiptData}
        onClose={() => setRenewalReceiptData(null)}
        receiptData={renewalReceiptData}
      />

      {/* EDIT PAYMENT AMOUNT MODAL */}
      <EditPaymentAmountModal
        isOpen={!!editingPaymentAmount}
        payment={editingPaymentAmount}
        onClose={() => setEditingPaymentAmount(null)}
      />

    </div>
  );
};

