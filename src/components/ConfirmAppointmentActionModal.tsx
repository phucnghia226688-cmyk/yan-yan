import React from 'react';
import { X, Trash2, XCircle, RotateCcw, AlertTriangle, Calendar, Dumbbell, UserCheck } from 'lucide-react';
import { DEFAULT_AVATAR_URL } from '../types';

export type AppointmentActionType = 'cancel' | 'delete' | 'undo_checkin';

interface ConfirmAppointmentActionModalProps {
  isOpen: boolean;
  actionType: AppointmentActionType;
  clientName: string;
  avatarUrl?: string;
  packageName?: string;
  remainingSessions?: number;
  dayPlanName?: string;
  dateStr?: string;
  timeStr?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export const ConfirmAppointmentActionModal: React.FC<ConfirmAppointmentActionModalProps> = ({
  isOpen,
  actionType,
  clientName,
  avatarUrl,
  packageName,
  remainingSessions,
  dayPlanName,
  dateStr,
  timeStr,
  onClose,
  onConfirm
}) => {
  if (!isOpen) return null;

  // Config based on action type
  const getConfig = () => {
    switch (actionType) {
      case 'cancel':
        return {
          headerBg: 'bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700',
          icon: <XCircle className="w-5 h-5 text-white" />,
          title: 'Xác nhận hủy lịch hẹn',
          subtitle: 'Tránh thao tác nhầm lẫn làm chuyển trạng thái lịch',
          promptText: 'BẠN CÓ CHẮC CHẮN MUỐN HỦY LỊCH HẸN CỦA',
          alertBg: 'bg-rose-50 border-rose-200 text-rose-800',
          alertText: '⚠️ Trạng thái lịch hẹn sẽ được chuyển sang "🔴 Hủy lịch". Bạn có thể xếp lại lịch sau nếu cần.',
          confirmBtnBg: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200',
          confirmBtnIcon: <XCircle className="w-4 h-4 text-white" />,
          confirmBtnText: 'ĐỒNG Ý HỦY LỊCH'
        };
      case 'delete':
        return {
          headerBg: 'bg-gradient-to-r from-red-600 via-red-700 to-rose-800',
          icon: <Trash2 className="w-5 h-5 text-white" />,
          title: 'Xác nhận xóa lịch hẹn',
          subtitle: 'Cảnh báo: Thao tác sẽ xóa hẳn khỏi hệ thống',
          promptText: 'BẠN CÓ CHẮC CHẮN MUỐN XÓA HẲN LỊCH HẸN CỦA',
          alertBg: 'bg-red-50 border-red-200 text-red-900',
          alertText: '⛔ Lịch hẹn này sẽ bị XÓA HOÀN TOÀN khỏi danh sách và không thể khôi phục lại được!',
          confirmBtnBg: 'bg-red-600 hover:bg-red-700 text-white shadow-red-200',
          confirmBtnIcon: <Trash2 className="w-4 h-4 text-white" />,
          confirmBtnText: 'ĐỒNG Ý XÓA LỊCH'
        };
      case 'undo_checkin':
        return {
          headerBg: 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700',
          icon: <RotateCcw className="w-5 h-5 text-white" />,
          title: 'Xác nhận hoàn check-in',
          subtitle: 'Hoàn lại +1 buổi tập cho học viên',
          promptText: 'BẠN CÓ CHẮC CHẮN MUỐN HOÀN CHECK-IN CHO',
          alertBg: 'bg-amber-50 border-amber-200 text-amber-900',
          alertText: '🔄 Hệ thống sẽ HOÀN LẠI +1 buổi tập cho học viên và chuyển lịch về trạng thái "Chờ tập".',
          confirmBtnBg: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200',
          confirmBtnIcon: <RotateCcw className="w-4 h-4 text-white" />,
          confirmBtnText: 'XÁC NHẬN HOÀN CHECK-IN'
        };
    }
  };

  const config = getConfig();

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div 
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className={`${config.headerBg} px-6 py-4 text-white flex items-center justify-between`}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold shrink-0">
              {config.icon}
            </div>
            <div>
              <h3 className="font-black text-white text-base leading-tight">{config.title}</h3>
              <p className="text-[11px] text-white/80 font-medium">{config.subtitle}</p>
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
        <div className="p-5 sm:p-6 space-y-4 text-center">
          {/* Avatar and Name */}
          <div className="flex flex-col items-center justify-center">
            <img
              src={avatarUrl || DEFAULT_AVATAR_URL}
              alt={clientName}
              className="w-16 h-16 rounded-full object-cover border-4 border-slate-200 shadow-md mb-2"
            />
            <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              {config.promptText}
            </p>
            <div className="text-lg sm:text-xl font-black text-slate-900 bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl my-2 text-center w-full shadow-2xs truncate">
              "{clientName}"
            </div>
            <p className="text-xs font-semibold text-slate-600">
              không?
            </p>
          </div>

          {/* Detailed Info Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-left text-xs space-y-2">
            {packageName && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-500" /> Gói tập:
                </span>
                <span className="font-bold text-slate-800">{packageName}</span>
              </div>
            )}

            {remainingSessions !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Số buổi còn lại:</span>
                <span className="font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                  {remainingSessions} buổi
                </span>
              </div>
            )}

            {dayPlanName && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Dumbbell className="w-3.5 h-3.5 text-emerald-500" /> Lịch tập:
                </span>
                <span className="font-bold text-slate-800 truncate max-w-[200px]">{dayPlanName}</span>
              </div>
            )}

            {(dateStr || timeStr) && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" /> Ngày & giờ:
                </span>
                <span className="font-bold text-slate-800">
                  {dateStr}{timeStr ? ` lúc ${timeStr}` : ''}
                </span>
              </div>
            )}
          </div>

          {/* Alert box */}
          <div className={`p-3 rounded-2xl border text-xs text-left font-semibold flex items-start gap-2 ${config.alertBg}`}>
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-snug">{config.alertText}</p>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-200/80 transition-all cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl font-extrabold text-xs shadow-md flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${config.confirmBtnBg}`}
          >
            {config.confirmBtnIcon}
            {config.confirmBtnText}
          </button>
        </div>
      </div>
    </div>
  );
};
