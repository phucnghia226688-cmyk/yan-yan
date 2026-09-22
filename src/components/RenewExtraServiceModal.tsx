import React, { useState, useEffect } from 'react';
import { X, RefreshCw, DollarSign, Utensils, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Client } from '../types';
import { useGym } from '../context/GymContext';
import { getTodayDateStr } from '../utils/dateUtils';

interface RenewExtraServiceModalProps {
  isOpen: boolean;
  client: Client | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RenewExtraServiceModal: React.FC<RenewExtraServiceModalProps> = ({
  isOpen,
  client,
  onClose,
  onSuccess
}) => {
  const { renewExtraService } = useGym();
  const [additionalCount, setAdditionalCount] = useState<number>(30);
  const [priceVnd, setPriceVnd] = useState<number>(1500000);
  const [paymentMethod, setPaymentMethod] = useState<'Tiền mặt' | 'Chuyển khoản' | 'Thẻ'>('Chuyển khoản');
  const [paymentDate, setPaymentDate] = useState<string>(getTodayDateStr());
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && client) {
      const defaultCount = 30;
      setAdditionalCount(defaultCount);
      setPriceVnd(client.extraServicePrice || 1500000);
      setPaymentMethod('Chuyển khoản');
      setPaymentDate(getTodayDateStr());
      setNotes('');
      setIsSubmitting(false);
    }
  }, [isOpen, client]);

  if (!isOpen || !client) return null;

  const currentServiceName = client.extraServiceName || 'Dịch vụ thêm';
  const currentRemaining = client.remainingExtraServices ?? client.totalExtraServices ?? 0;
  const newExpectedRemaining = currentRemaining + (additionalCount || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (additionalCount <= 0) return;

    setIsSubmitting(true);
    try {
      renewExtraService(
        client.id,
        additionalCount,
        priceVnd,
        paymentMethod,
        paymentDate,
        notes || `Gia hạn dịch vụ thêm: ${currentServiceName} (+${additionalCount} suất) cho ${client.name}`
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Error renewing extra service:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">Gia Hạn / Thêm Suất Dịch Vụ</h3>
              <p className="text-xs text-slate-400">Tự động ghi nhận phiếu thu lợi nhuận</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {/* Current client info */}
          <div className="p-3.5 bg-slate-800/60 border border-slate-700/60 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400">Học viên</p>
              <h4 className="text-sm font-black text-white">{client.name}</h4>
              <p className="text-xs text-amber-300 font-bold mt-0.5 flex items-center gap-1">
                <Utensils className="w-3.5 h-3.5" /> {currentServiceName}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400">Hiện còn</p>
              <p className={`text-base font-black ${currentRemaining <= 0 ? 'text-rose-400' : 'text-amber-400'}`}>
                {currentRemaining} suất
              </p>
              <p className="text-[10px] font-bold text-emerald-400">
                → Mới: {newExpectedRemaining} suất
              </p>
            </div>
          </div>

          {/* Quick preset for count */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Số lượng / Suất đăng ký thêm *
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {[10, 20, 30, 60].map(cnt => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setAdditionalCount(cnt)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-black border transition-all ${
                    additionalCount === cnt
                      ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-sm'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  +{cnt} suất
                </button>
              ))}
            </div>
            <input
              type="number"
              min="1"
              required
              value={additionalCount}
              onChange={(e) => setAdditionalCount(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-slate-800 border border-slate-700 text-white font-black rounded-xl p-2.5 text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Fee collection */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              Số tiền thu thêm (VNĐ) *
            </label>
            <input
              type="text"
              inputMode="numeric"
              required
              value={priceVnd ? new Intl.NumberFormat('vi-VN').format(priceVnd) : ''}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '');
                setPriceVnd(digits ? parseInt(digits, 10) : 0);
              }}
              placeholder="0"
              className="w-full bg-slate-800 border border-slate-700 text-emerald-400 font-black rounded-xl p-2.5 text-base focus:outline-none focus:border-emerald-500"
            />
            <span className="text-[11px] font-bold text-emerald-400 mt-1 block">
              = {priceVnd.toLocaleString('vi-VN')} VNĐ (Tự động hạch toán doanh thu)
            </span>
          </div>

          {/* Payment Method & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Hình thức</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 text-white font-bold rounded-xl p-2 text-xs focus:outline-none focus:border-amber-500"
              >
                <option value="Chuyển khoản">💳 Chuyển khoản</option>
                <option value="Tiền mặt">💵 Tiền mặt</option>
                <option value="Thẻ">💳 Thẻ POS</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Ngày thu</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white font-bold rounded-xl p-2 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Ghi chú (Tùy chọn)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Gia hạn combo Meal Plan tháng mới..."
              className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl p-2.5 focus:outline-none focus:border-amber-500 placeholder:text-slate-500"
            />
          </div>

          {/* Submit buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 px-3 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 font-bold text-xs transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || additionalCount <= 0}
              className="w-2/3 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>XÁC NHẬN GIA HẠN (+{additionalCount} SUẤT)</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
