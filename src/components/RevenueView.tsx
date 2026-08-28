import { getTodayDateStr } from '../utils/dateUtils';
import { removeAccents } from '../utils/textUtils';
import React, { useState } from 'react';
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
  Trash2
} from 'lucide-react';
import { useGym } from '../context/GymContext';
import { PaymentRecord } from '../types';
import { RenewalReceiptModal, RenewalReceiptData } from './RenewalReceiptModal';
import { ImageIcon } from 'lucide-react';

export const RevenueView: React.FC = () => {
  const { payments, clients, addPayment, deletePayment } = useGym();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<'month' | 'year' | 'all'>('month');
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [renewalReceiptData, setRenewalReceiptData] = useState<RenewalReceiptData | null>(null);

  const handleOpenReceipt = (payment: PaymentRecord) => {
    const payDateFormatted = new Date(payment.paymentDate).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
    setRenewalReceiptData({
      clientName: payment.clientName,
      packageName: payment.packageName,
      amountPaid: payment.amountVnd,
      addedSessions: payment.sessionsCount,
      totalRemainingSessions: (payment.previousState?.remainingSessions || 0) + payment.sessionsCount,
      newExpirationDate: payment.newEndDate ? new Date(payment.newEndDate).toLocaleDateString('vi-VN') : '',
      createdAt: payDateFormatted
    });
  };

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

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
      notes: paymentForm.notes
    });

    setIsAddPaymentModalOpen(false);
  };

  // Filter payments
  const filteredPayments = payments.filter(p => {
    const searchNormalized = removeAccents(searchQuery.trim().toLowerCase());
    const nameNormalized = removeAccents(p.clientName.toLowerCase());
    const packageNormalized = removeAccents(p.packageName.toLowerCase());
    const matchesSearch = nameNormalized.includes(searchNormalized) || packageNormalized.includes(searchNormalized);
    
    if (filterPeriod === 'all') return matchesSearch;
    
    const pDate = new Date(p.paymentDate);
    if (filterPeriod === 'month') {
      return matchesSearch && pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;
    }
    if (filterPeriod === 'year') {
      return matchesSearch && pDate.getFullYear() === currentYear;
    }
    return matchesSearch;
  });

  // Totals
  const totalRevenueMonth = payments
    .filter(p => {
      const d = new Date(p.paymentDate);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, p) => sum + p.amountVnd, 0);

  const totalRevenueYear = payments
    .filter(p => new Date(p.paymentDate).getFullYear() === currentYear)
    .reduce((sum, p) => sum + p.amountVnd, 0);

  const totalRevenueAll = payments.reduce((sum, p) => sum + p.amountVnd, 0);

  const formatVnd = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-wider">
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
          className="bg-[#FF4E00] hover:bg-orange-600 text-white font-extrabold px-5 py-2.5 rounded-full text-sm shadow-md transition-all flex items-center gap-2 active:scale-95"
        >
          <PlusCircle className="w-4 h-4 fill-white text-[#FF4E00]" />
          + Ghi nhận đóng tiền mới
        </button>
      </div>

      {/* Revenue Totals Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Doanh thu tháng ({currentMonth + 1}/{currentYear})</p>
          <p className="text-2xl font-black text-emerald-600 mt-2">{formatVnd(totalRevenueMonth)}</p>
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Doanh thu năm {currentYear}</p>
          <p className="text-2xl font-black text-[#FF4E00] mt-2">{formatVnd(totalRevenueYear)}</p>
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Tích lũy toàn bộ</p>
          <p className="text-2xl font-black text-[#4F46E5] mt-2">{formatVnd(totalRevenueAll)}</p>
        </div>
      </div>

      {/* Payments Table & Filter */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <h3 className="font-extrabold text-slate-900 text-lg">Danh sách giao dịch thanh toán</h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Period filter */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-slate-200 text-xs">
              <button
                onClick={() => setFilterPeriod('month')}
                className={`px-3 py-1 rounded-full font-extrabold transition-all ${
                  filterPeriod === 'month' ? 'bg-[#FF4E00] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tháng này
              </button>
              <button
                onClick={() => setFilterPeriod('year')}
                className={`px-3 py-1 rounded-full font-extrabold transition-all ${
                  filterPeriod === 'year' ? 'bg-[#FF4E00] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Năm nay
              </button>
              <button
                onClick={() => setFilterPeriod('all')}
                className={`px-3 py-1 rounded-full font-extrabold transition-all ${
                  filterPeriod === 'all' ? 'bg-[#FF4E00] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tất cả
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm tên khách..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-100 text-slate-800 text-xs pl-8 pr-3 py-2 rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white w-36 transition-all"
              />
            </div>
          </div>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm bg-slate-50 rounded-2xl border border-dashed border-slate-200 font-medium">
            Không có dữ liệu giao dịch phù hợp.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200">
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
                    <td className="p-3 font-mono text-slate-500 whitespace-nowrap font-medium">{p.paymentDate}</td>
                    <td className="p-3 font-extrabold text-slate-900">{p.clientName}</td>
                    <td className="p-3 font-bold text-[#4F46E5]">{p.packageName}</td>
                    <td className="p-3 text-center font-bold text-slate-700">{p.sessionsCount} buổi</td>
                    <td className="p-3 text-right font-black text-emerald-600 text-sm">
                      {formatVnd(p.amountVnd)}
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
                        className="text-[#4F46E5] hover:text-indigo-700 p-1.5 rounded-lg hover:bg-indigo-50 transition-colors flex items-center gap-1"
                        title="Xuất bill ảnh"
                      >
                        <ImageIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deletePayment(p.id)}
                        className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
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

    </div>
  );
};
