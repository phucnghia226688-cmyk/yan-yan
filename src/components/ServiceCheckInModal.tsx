import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Zap, Clock, Calendar, AlertCircle, Utensils, MessageSquare, AlertTriangle } from 'lucide-react';
import { Client, CheckInLog } from '../types';
import { useGym } from '../context/GymContext';

interface ServiceCheckInModalProps {
  isOpen: boolean;
  client: Client | null;
  onClose: () => void;
  onSuccess: (log: CheckInLog, client: Client) => void;
  onOpenRenew?: (client: Client) => void;
}

const getLocalDateTimeString = (daysAgo = 0) => {
  const d = new Date();
  if (daysAgo > 0) {
    d.setDate(d.getDate() - daysAgo);
  }
  const yyyy = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${month}-${day}T${hh}:${mm}`;
};

export const ServiceCheckInModal: React.FC<ServiceCheckInModalProps> = ({
  isOpen,
  client,
  onClose,
  onSuccess,
  onOpenRenew
}) => {
  const { checkInExtraService } = useGym();
  const [checkInDateTime, setCheckInDateTime] = useState<string>(getLocalDateTimeString(0));
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCheckInDateTime(getLocalDateTimeString(0));
      setNotes('');
      setErrorMsg(null);
      setIsSubmitting(false);
    }
  }, [isOpen, client]);

  if (!isOpen || !client) return null;

  const serviceName = client.extraServiceName || 'Dịch vụ thêm';
  const remaining = client.remainingExtraServices ?? client.totalExtraServices ?? 0;
  const total = client.totalExtraServices ?? 0;
  const isOutOfService = remaining <= 0;
  const isExpiringSoon = remaining > 0 && remaining <= 3;

  const handleApplyQuickDate = (daysAgo: number) => {
    setCheckInDateTime(getLocalDateTimeString(daysAgo));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isOutOfService) {
      setErrorMsg('Học viên đã hết suất dịch vụ! Vui lòng gia hạn thêm trước khi check-in.');
      return;
    }

    setIsSubmitting(true);
    try {
      const log = checkInExtraService(client.id, checkInDateTime, notes);
      if (log) {
        const updatedClient: Client = {
          ...client,
          remainingExtraServices: Math.max(0, remaining - 1)
        };
        onSuccess(log, updatedClient);
        onClose();
      } else {
        setErrorMsg('Không thể thực hiện check-in dịch vụ.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Có lỗi xảy ra khi check-in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Zap className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base sm:text-lg">Check-in Dịch Vụ Thêm</h3>
              <p className="text-xs text-slate-400">Điểm danh & trừ suất dịch vụ học viên</p>
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
          
          {/* Client & Service Badge Info */}
          <div className={`p-4 rounded-2xl border ${
            isOutOfService 
              ? 'bg-rose-950/30 border-rose-500/50' 
              : isExpiringSoon 
              ? 'bg-amber-950/30 border-amber-500/50' 
              : 'bg-slate-800/60 border-slate-700/60'
          }`}>
            <div className="flex items-center gap-3">
              {client.avatarUrl ? (
                <img
                  src={client.avatarUrl}
                  alt={client.name}
                  className="w-12 h-12 rounded-2xl object-cover border border-slate-700 shadow-md"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-slate-700 text-white flex items-center justify-center font-bold text-lg">
                  {client.name.charAt(0)}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-black text-white">{client.name}</h4>
                  <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                    isOutOfService
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : isExpiringSoon
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    {remaining} / {total} suất
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-400">Dịch vụ:</span>
                  <span className="text-xs font-bold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20 flex items-center gap-1">
                    <Utensils className="w-3 h-3" /> {serviceName}
                  </span>
                </div>
              </div>
            </div>

            {/* Warning banners */}
            {isOutOfService && (
              <div className="mt-3 pt-3 border-t border-rose-500/30 flex items-center justify-between gap-2 text-xs font-bold text-rose-400">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Đã hết suất dịch vụ! Không thể trừ thêm.</span>
                </div>
                {onOpenRenew && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenRenew(client);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-rose-500 hover:bg-rose-400 text-white text-[11px] font-black transition-colors"
                  >
                    Gia hạn ngay
                  </button>
                )}
              </div>
            )}

            {isExpiringSoon && (
              <div className="mt-3 pt-3 border-t border-amber-500/30 flex items-center gap-1.5 text-xs font-bold text-amber-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>⚠️ Sắp hết suất dịch vụ (Còn {remaining} suất)! Nhắc học viên gia hạn sớm.</span>
              </div>
            )}
          </div>

          {/* Date & Time Picker */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                Ngày & Giờ check-in:
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleApplyQuickDate(0)}
                  className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
                >
                  ⚡ Hôm nay
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyQuickDate(1)}
                  className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
                >
                  🕒 Hôm qua
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyQuickDate(2)}
                  className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
                >
                  -2 ngày
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyQuickDate(3)}
                  className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
                >
                  -3 ngày
                </button>
              </div>
            </div>
            <input
              type="datetime-local"
              required
              value={checkInDateTime}
              onChange={(e) => setCheckInDateTime(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white font-mono font-bold rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Take Note / Ghi chú */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              Ghi chú thực hiện / Take note (Không bắt buộc):
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Đã giao suất ăn trưa ức gà + khoai lang, Giao combo nước BCAA..."
              className="w-full bg-slate-800 border border-slate-700 text-white text-xs sm:text-sm rounded-xl p-2.5 focus:outline-none focus:border-amber-500 placeholder:text-slate-500"
            />
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {[
                'Đã giao suất ăn dinh dưỡng',
                'Đã cung cấp Meal Plan tuần mới',
                'Giao combo nước uống & BCAA',
                'Đã phát khăn tập & tủ đồ VIP',
                'Học viên đã nhận tại quầy lễ tân'
              ].map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setNotes(suggestion)}
                  className="text-[10px] font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded-lg border border-slate-700/60 transition-colors"
                >
                  + {suggestion}
                </button>
              ))}
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-3 px-4 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isOutOfService}
              className="w-2/3 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>⚡ HOÀN THÀNH CHECK-IN (-1 Suất)</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
