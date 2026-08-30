import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, X, Check, DollarSign, AlertCircle } from 'lucide-react';
import { PaymentRecord } from '../types';
import { useGym } from '../context/GymContext';
import { useTenant } from '../context/TenantContext';
import { formatDate } from '../utils/dateUtils';

interface EditPaymentAmountModalProps {
  isOpen: boolean;
  payment: PaymentRecord | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const EditPaymentAmountModal: React.FC<EditPaymentAmountModalProps> = ({
  isOpen,
  payment,
  onClose,
  onSuccess
}) => {
  const { updatePayment } = useGym();
  const { currentUser } = useTenant();

  const [amountStr, setAmountStr] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (isOpen && payment) {
      setAmountStr(payment.amountVnd ? payment.amountVnd.toString() : '0');
      setPassword('');
      setShowPassword(false);
      setError(null);
      setNotes(payment.notes || '');
    }
  }, [isOpen, payment]);

  if (!isOpen || !payment) return null;

  const currentAmount = parseInt(amountStr.replace(/\D/g, ''), 10) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const enteredPass = password.trim();
    if (!enteredPass) {
      setError('Vui lòng nhập mật khẩu quản lý để xác nhận sửa số tiền.');
      return;
    }

    const validAdminPass = currentUser?.password;
    const isMatch = enteredPass === validAdminPass || enteredPass === localStorage.getItem('nb_gym_admin_password');

    if (!isMatch) {
      setError('Mật khẩu quản lý không chính xác! Vui lòng kiểm tra lại.');
      return;
    }

    if (currentAmount < 0) {
      setError('Số tiền không được âm.');
      return;
    }

    const now = new Date();
    const formattedTimestamp = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Perform update
    updatePayment(payment.id, {
      amountVnd: currentAmount,
      isEdited: true,
      editedAt: formattedTimestamp,
      notes: notes.trim() || payment.notes
    });

    if (onSuccess) {
      onSuccess();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-slate-200 text-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-indigo-100/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Chỉnh Sửa Số Tiền Thu</h3>
              <p className="text-xs text-slate-500 font-medium">Bắt buộc xác thực mật khẩu quản lý</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Payment Info Card */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-semibold">Học viên:</span>
              <span className="font-extrabold text-slate-900">{payment.clientName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-semibold">Gói tập:</span>
              <span className="font-bold text-indigo-700">{payment.packageName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-semibold">Ngày thanh toán:</span>
              <span className="font-medium text-slate-700">{formatDate(payment.paymentDate)}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-200">
              <span className="text-slate-500 font-semibold">Số tiền ban đầu:</span>
              <span className="font-black text-slate-700">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(payment.amountVnd)}
              </span>
            </div>
          </div>

          {/* Amount input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Số Tiền Mới (VNĐ) *
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                required
                value={amountStr ? new Intl.NumberFormat('vi-VN').format(currentAmount) : ''}
                onChange={(e) => {
                  const digitsOnly = e.target.value.replace(/\D/g, '');
                  setAmountStr(digitsOnly);
                  setError(null);
                }}
                placeholder="Nhập số tiền..."
                className="w-full bg-slate-50 text-[#FF4E00] border border-slate-300 rounded-xl p-2.5 text-base font-black focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white"
                autoFocus
              />
            </div>
            <p className="text-xs font-extrabold text-indigo-700 mt-1">
              {currentAmount > 0
                ? `= ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(currentAmount)}`
                : '0 đ'}
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Ghi chú chỉnh sửa (Tùy chọn)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Điều chỉnh chiết khấu cho học viên..."
              className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white"
            />
          </div>

          {/* Password confirmation */}
          <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-2">
            <label className="block text-xs font-bold text-rose-900 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-rose-600" />
              Nhập mật khẩu quản lý để xác nhận *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="Mật khẩu tài khoản quản lý..."
                className="w-full bg-white text-slate-900 border border-rose-300 rounded-xl py-2 pl-3 pr-10 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-500 italic bg-amber-50/60 p-2 rounded-xl border border-amber-200/60">
            💡 Sau khi lưu, giao dịch sẽ được đánh dấu ghi chú <strong className="text-amber-700">* đã chỉnh sửa</strong> và ghi lại nhật ký thao tác.
          </div>

          {/* Action buttons */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-full text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-full text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Lưu Số Tiền Đã Sửa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
