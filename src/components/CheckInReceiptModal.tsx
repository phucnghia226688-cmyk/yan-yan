import React, { useState, useRef } from 'react';
import {
  CheckCircle2,
  X,
  Copy,
  Check,
  Calendar,
  Clock,
  Dumbbell,
  User,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Camera,
  Image as ImageIcon,
  Download,
  Loader2
} from 'lucide-react';
import { toBlob, toPng } from 'html-to-image';
import { DEFAULT_AVATAR_URL } from '../types';
import { useTenant } from '../context/TenantContext';
import { formatDate } from '../utils/dateUtils';

export interface CheckInReceiptData {
  clientName: string;
  avatarUrl?: string;
  packageName?: string;
  totalSessions: number;
  completedSessions: number;
  remainingSessions: number;
  checkInDateStr: string; // e.g. "Chủ Nhật, 26/07/2026"
  checkInTimeStr?: string; // e.g. "19:30"
  dayPlanName?: string;
  notes?: string;
  clientType?: 'session' | 'monthly';
  endDate?: string;
}

interface CheckInReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: CheckInReceiptData | null;
  onUndoCheckIn?: () => void;
}

export const CheckInReceiptModal: React.FC<CheckInReceiptModalProps> = ({
  isOpen,
  onClose,
  data,
  onUndoCheckIn
}) => {
  const { currentUser, activeTenantId, tenants } = useTenant();
  const [copiedText, setCopiedText] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !data) return null;

  const activeTenant = tenants.find(t => t.tenantId === activeTenantId || t.id === activeTenantId);
  const rawGymName = activeTenant?.gymName || (currentUser?.tenantId === activeTenantId ? currentUser?.gymName : null) || currentUser?.gymName || currentUser?.ownerName || 'Private Gym PT';
  const displayGymName = rawGymName.replace(/\s*\(Gốc\)/i, '').trim();

  const getInitials = (str: string) => {
    const parts = str.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return str.slice(0, 2).toUpperCase();
  };
  const initials = getInitials(displayGymName);

  const remaining = Math.max(0, data.remainingSessions);
  const total = Math.max(1, data.totalSessions || 1, remaining);
  const rawCompleted = typeof data.completedSessions === 'number' && data.completedSessions >= 0
    ? data.completedSessions
    : (total - remaining);
  const completed = Math.max(0, Math.min(total, rawCompleted));
  const progressPercent = Math.min(100, Math.max(0, Math.round((completed / total) * 100)));

  const handleCopyZaloText = () => {
    const textToCopy = `🏋️‍♂️ ${displayGymName.toUpperCase()} - XÁC NHẬN ĐIỂM DANH\n---------------------------------\n👤 Học viên: ${data.clientName}\n📦 Gói tập: ${data.packageName || 'Gói PT'}\n📅 Ngày điểm danh: ${data.checkInDateStr}${data.checkInTimeStr ? ` (${data.checkInTimeStr})` : ''}\n💪 Bài tập: ${data.dayPlanName || 'Buổi tập định kỳ'}\n📊 Đã tập: ${completed}/${total} buổi (${progressPercent}%)\n⚡ SỐ BUỔI CÒN LẠI: ${remaining} BUỔI\n---------------------------------\nCảm ơn bạn đã chăm chỉ tập luyện hôm nay! 💪🔥`;

    navigator.clipboard.writeText(textToCopy);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleCopyImage = async () => {
    if (!cardRef.current) return;
    setIsGeneratingImage(true);

    try {
      // Generate PNG blob from the card DOM element
      const blob = await toBlob(cardRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        cacheBust: true,
      });

      if (!blob) {
        throw new Error('Could not create image blob');
      }

      // Copy directly to clipboard
      if (navigator.clipboard && window.ClipboardItem) {
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        setCopiedImage(true);
        setTimeout(() => setCopiedImage(false), 3500);
      } else {
        alert('Trình duyệt hiện tại chưa hỗ trợ copy hình ảnh trực tiếp. Vui lòng chụp màn hình lại thẻ điểm danh nhé!');
      }
    } catch (error) {
      console.error('Error copying receipt image:', error);
      alert('Không thể tự động copy hình ảnh. Vui lòng chụp màn hình lại thẻ điểm danh nhé!');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#FF4E00] flex items-center justify-center font-black text-xs text-white shadow-sm shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-sm text-white tracking-wide uppercase truncate max-w-[240px]">{displayGymName}</h3>
              <p className="text-[10px] text-slate-300 font-medium">Xác Nhận & Thẻ Điểm Danh Buổi Tập</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Screenshot-Ready Receipt Card */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 bg-slate-50">
          
          {/* SCREENSHOT CARD CONTAINER */}
          <div ref={cardRef} className="bg-white border-2 border-indigo-100 rounded-2xl p-5 shadow-lg space-y-4 relative overflow-hidden">
            {/* Top decorative badge */}
            <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl flex items-center gap-1 shadow-xs">
              <CheckCircle2 className="w-3 h-3 text-white" /> Đã điểm danh
            </div>

            {/* Gym Sub-Header */}
            <div className="text-center pt-1 pb-3 border-b border-slate-100">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200/60 rounded-full text-indigo-700 text-xs font-black uppercase tracking-wider mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#4F46E5]" />
                Thẻ Điểm Danh Tập Luyện
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Hệ thống ghi nhận tự động - {displayGymName}</p>
            </div>

            {/* Client Info Header */}
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <img
                src={data.avatarUrl || DEFAULT_AVATAR_URL}
                alt={data.clientName}
                className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500 ring-2 ring-indigo-100 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Học viên</span>
                <h4 className="font-black text-slate-900 text-base leading-tight truncate">{data.clientName}</h4>
                <p className="text-xs text-indigo-600 font-extrabold truncate mt-0.5">
                  {data.packageName || 'Gói PT 1:1'}
                </p>
              </div>
            </div>

            {/* Check-in Details */}
            <div className="space-y-2 text-xs font-semibold text-slate-700 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Ngày điểm danh:
                </span>
                <span className="font-extrabold text-slate-900">{data.checkInDateStr}</span>
              </div>

              {data.checkInTimeStr && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" /> Giờ tập:
                  </span>
                  <span className="font-extrabold text-slate-900">{data.checkInTimeStr}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Dumbbell className="w-3.5 h-3.5 text-indigo-500" /> Nội dung tập:
                </span>
                <span className="font-black text-indigo-700">{data.dayPlanName || 'Buổi tập định kỳ'}</span>
              </div>

              {data.notes && (
                <div className="pt-1.5 border-t border-slate-200/60 text-[11px]">
                  <span className="text-slate-400">Ghi chú: </span>
                  <span className="italic text-slate-700 font-medium">"{data.notes}"</span>
                </div>
              )}
            </div>

            {/* REMAINING SESSIONS OR MONTHLY CONTRACT PROMINENT BOX */}
            {data.clientType === 'monthly' ? (
              <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-slate-950 rounded-2xl p-4 shadow-md text-center space-y-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 transform translate-x-3 -translate-y-3 w-16 h-16 bg-white/20 rounded-full blur-xs pointer-events-none" />
                
                <span className="inline-block text-[11px] font-black uppercase tracking-wider text-slate-950 bg-white/30 px-3 py-0.5 rounded-full border border-white/40">
                  📅 GÓI KHÁCH THÁNG (THEO HẠN HỢP ĐỒNG)
                </span>

                <div className="py-1">
                  <p className="text-xs font-bold text-amber-950">Hạn sử dụng đến ngày:</p>
                  <p className="text-2xl font-black tracking-tight text-white drop-shadow-xs">{data.endDate ? formatDate(data.endDate) : 'Chưa cập nhật'}</p>
                </div>

                <div className="pt-1 border-t border-white/20 text-[11px] font-bold text-amber-950">
                  ⚡ Không giới hạn số buổi tập trong thời hạn hợp đồng.
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl p-4 shadow-md text-center space-y-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 transform translate-x-3 -translate-y-3 w-16 h-16 bg-white/10 rounded-full blur-xs pointer-events-none" />
                
                <span className="inline-block text-[11px] font-black uppercase tracking-wider text-emerald-100 bg-black/20 px-3 py-0.5 rounded-full">
                  ⚡ SỐ BUỔI CÒN LẠI TRONG GÓI
                </span>

                <div className="flex items-baseline justify-center gap-1.5 py-1">
                  <span className="text-4xl font-black tracking-tight text-white">{remaining}</span>
                  <span className="text-sm font-bold text-emerald-100">/ {total} buổi</span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="w-full bg-black/20 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-white h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-extrabold text-emerald-100">
                    <span>Đã hoàn thành: {completed} buổi ({progressPercent}%)</span>
                    <span>Còn lại: {remaining} buổi</span>
                  </div>
                </div>
              </div>
            )}

            {/* Camera hint notice */}
            <div className="text-center pt-1">
              <p className="text-[11px] text-slate-500 font-bold flex items-center justify-center gap-1">
                <Camera className="w-3.5 h-3.5 text-indigo-600" />
                Chụp màn hình thẻ này để gửi cho học viên
              </p>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            {/* Quick Copy Image Button */}
            <button
              onClick={handleCopyImage}
              disabled={isGeneratingImage}
              className={`w-full py-3 px-4 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-98 ${
                copiedImage
                  ? 'bg-emerald-600 text-white shadow-emerald-200'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-teal-200'
              }`}
            >
              {isGeneratingImage ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  Đang tạo hình ảnh thẻ...
                </>
              ) : copiedImage ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  Đã copy ảnh thẻ! (Bấm Ctrl+V hoặc dán vào Zalo)
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4" />
                  📸 Copy hình ảnh thẻ nhanh (gửi Zalo)
                </>
              )}
            </button>

            {/* Quick Copy Text Button */}
            <button
              onClick={handleCopyZaloText}
              className={`w-full py-2.5 px-4 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 border cursor-pointer active:scale-98 ${
                copiedText
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-indigo-50 hover:bg-indigo-100 text-[#4F46E5] border-indigo-200'
              }`}
            >
              {copiedText ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Đã sao chép nội dung chữ!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#4F46E5]" />
                  Sao chép nội dung chữ (gửi Zalo)
                </>
              )}
            </button>

            {onUndoCheckIn && (
              <button
                onClick={() => {
                  onUndoCheckIn();
                  onClose();
                }}
                className="w-full py-2.5 px-4 rounded-2xl font-bold text-xs bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                Hoàn check-in / Hủy (Nếu lỡ bấm nhầm)
              </button>
            )}

            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-2xl font-bold text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
            >
              Đóng / Hoàn tất
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
