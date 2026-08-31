import React, { useState, useEffect } from 'react';
import { Zap, X, Calendar, Dumbbell, UserCheck, FileText } from 'lucide-react';
import { DEFAULT_AVATAR_URL } from '../types';
import { SessionBadge } from './SessionBadge';

interface ConfirmCheckInModalProps {
  isOpen: boolean;
  clientName: string;
  avatarUrl?: string;
  packageName?: string;
  remainingSessions?: number;
  clientType?: 'session' | 'monthly';
  dayPlanName?: string;
  checkInDateStr?: string;
  initialNotes?: string;
  onClose: () => void;
  onConfirm: (dayPlanName?: string, notes?: string, customDateStr?: string) => void;
}

export const ConfirmCheckInModal: React.FC<ConfirmCheckInModalProps> = ({
  isOpen,
  clientName,
  avatarUrl,
  packageName,
  remainingSessions,
  clientType,
  dayPlanName,
  checkInDateStr,
  initialNotes,
  onClose,
  onConfirm
}) => {
  const [editedDayPlan, setEditedDayPlan] = useState<string>('');
  const [editedNotes, setEditedNotes] = useState<string>('');
  const [editedDateStr, setEditedDateStr] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setEditedDayPlan(dayPlanName || 'Buổi tập toàn thân (Full Body)');
      setEditedNotes(initialNotes || '');

      // Format current action time (thời gian bấm thao tác)
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const period = hours >= 12 ? 'CH' : 'SA';
      const hours12 = String(hours % 12 === 0 ? 12 : hours % 12).padStart(2, '0');
      const currentActionTime = `${day}/${month}/${year} ${hours12}:${minutes} ${period}`;

      // Use checkInDateStr if custom backdated check-in, otherwise default to current action time
      if (checkInDateStr && !checkInDateStr.includes('lúc')) {
        setEditedDateStr(checkInDateStr);
      } else {
        setEditedDateStr(currentActionTime);
      }
    }
  }, [isOpen, dayPlanName, initialNotes, checkInDateStr]);

  if (!isOpen) return null;

  const isMonthly = clientType === 'monthly';

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold shrink-0">
              <Zap className="w-5 h-5 fill-white text-white" />
            </div>
            <div>
              <h3 className="font-black text-white text-base">Xác nhận check-in điểm danh</h3>
              <p className="text-[11px] text-amber-100 font-medium">
                {isMonthly ? 'Ghi nhận bài tập (Gói Khách Tháng - Không trừ buổi)' : 'Ghi nhận bài tập & trừ 1 buổi tập'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Client Info Summary Banner */}
          <div className="bg-gradient-to-br from-indigo-50/80 via-purple-50/50 to-slate-50 border border-indigo-100 rounded-2xl p-4 flex items-center gap-3.5 shadow-2xs">
            <img
              src={avatarUrl || DEFAULT_AVATAR_URL}
              alt={clientName}
              className="w-14 h-14 rounded-full object-cover border-2 border-indigo-200 shadow-sm shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Đã chọn học viên:</span>
                <SessionBadge remainingSessions={remainingSessions} clientType={clientType} size="sm" />
              </div>
              <h4 className="text-lg font-black text-slate-900 truncate mt-0.5">{clientName}</h4>
              {packageName && (
                <p className="text-xs font-semibold text-slate-600 flex items-center gap-1 mt-0.5">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span className="truncate">{packageName}</span>
                </p>
              )}
            </div>
          </div>

          {/* Form Fields - Styled exactly like 1-touch check-in */}
          <div className="space-y-3.5 pt-1">
            {/* 2. Ngày & Giờ điểm danh */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                2. Ngày & giờ điểm danh
              </label>
              <input
                type="text"
                value={editedDateStr}
                onChange={(e) => setEditedDateStr(e.target.value)}
                placeholder="Ví dụ: 27/07/2026 19:00"
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white transition-all"
              />
            </div>

            {/* 3. Bài tập / Lịch tập ngày check-in */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Dumbbell className="w-3.5 h-3.5 text-indigo-600" />
                3. Bài tập / lịch tập ngày check-in
              </label>
              <input
                type="text"
                value={editedDayPlan}
                onChange={(e) => setEditedDayPlan(e.target.value)}
                placeholder="Nhập tên bài tập hôm đó (Ví dụ: Leg Day, Full Body...)"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white transition-all shadow-2xs"
              />
              {/* Quick Preset Buttons for Day Plan */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[
                  'Buổi tập toàn thân (Full Body)',
                  'Leg Day (Tập Chân)',
                  'Chest & Triceps (Ngực/Tay sau)',
                  'Back & Biceps (Lưng/Tay trước)',
                  'Shoulders & Abs (Vai/Bụng)'
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setEditedDayPlan(preset)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      editedDayPlan === preset
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Ghi chú buổi tập (Không bắt buộc) */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                4. Ghi chú buổi tập (không bắt buộc)
              </label>
              <input
                type="text"
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                placeholder="Ví dụ: Đẩy Bench tăng 5kg, thể lực tốt..."
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-amber-700 font-bold flex items-center gap-1">
            <span>{isMonthly ? '⚠️ Khách Tháng: Điểm danh lưu lịch sử bài tập, không trừ số buổi.' : '⚠️ Hệ thống sẽ tự động trừ 1 buổi tập sau khi xác nhận.'}</span>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-200/80 transition-all cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={() => onConfirm(editedDayPlan, editedNotes, editedDateStr)}
            className="px-5 py-2.5 rounded-xl bg-[#84cc16] hover:bg-[#65a30d] text-white font-extrabold text-xs shadow-md shadow-lime-200 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-white" />
            HOÀN THÀNH CHECK-IN
          </button>
        </div>
      </div>
    </div>
  );
};
