import { getTodayDateStr } from '../utils/dateUtils';
import { removeAccents } from '../utils/textUtils';
import React, { useState, useEffect, useRef } from 'react';
import { X, Search, CheckCircle2, Zap, AlertCircle, Dumbbell, ArrowRight, RotateCcw, Calendar, Clock, History, Copy, Check, Camera, ShieldCheck, Image as ImageIcon, Loader2, Download } from 'lucide-react';
import { toBlob, toPng } from 'html-to-image';
import { useGym } from '../context/GymContext';
import { useTenant } from '../context/TenantContext';
import { Client } from '../types';
import { SessionBadge } from './SessionBadge';
import { ConfirmPasswordModal } from './ConfirmPasswordModal';
import { ConfirmCheckInModal } from './ConfirmCheckInModal';

interface QuickCheckInModalProps {
  isOpen: boolean;
  initialClient?: Client | null;
  preselectedClient?: Client | null;
  onClose: () => void;
  onGoToProgram?: (clientId: string) => void;
}

const getClientRegisteredTimeForDate = (client: Client | null, dateObj: Date) => {
  if (!client) return null;
  const dayOfWeek = dateObj.getDay(); // 0=Sun, 1=Mon, ...
  const dayTimes = client.dayTimes;
  const slotStr = (dayTimes && dayTimes[dayOfWeek]) ? dayTimes[dayOfWeek] : client.preferredTime;
  return slotStr || null;
};

const getLocalDateTimeString = (daysAgo = 0, client?: Client | null, baseDate?: Date) => {
  const d = baseDate ? new Date(baseDate) : new Date();
  if (daysAgo > 0) {
    d.setDate(d.getDate() - daysAgo);
  }

  let timeStr = '';
  const slotStr = getClientRegisteredTimeForDate(client || null, d);
  if (slotStr) {
    const match = slotStr.match(/(\d{1,2}):(\d{2})/);
    if (match) {
      const hh = match[1].padStart(2, '0');
      const mm = match[2].padStart(2, '0');
      timeStr = `${hh}:${mm}`;
    }
  }

  if (!timeStr) {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    timeStr = `${hh}:${mm}`;
  }

  const yyyy = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${month}-${day}T${timeStr}`;
};

export const QuickCheckInModal: React.FC<QuickCheckInModalProps> = ({
  isOpen,
  initialClient,
  preselectedClient,
  onClose,
  onGoToProgram
}) => {
  const { clients, programs, checkInClient, cancelCheckIn, checkIns } = useGym();
  const { currentUser, activeTenantId, tenants } = useTenant();

  const activeTenant = tenants.find(t => t.tenantId === activeTenantId || t.id === activeTenantId);
  const rawGymName = activeTenant?.gymName || (currentUser?.tenantId === activeTenantId ? currentUser?.gymName : null) || currentUser?.gymName || currentUser?.ownerName || 'Private Gym PT';
  const displayGymName = rawGymName.replace(/\s*\(Gốc\)/i, '').trim();
  
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dayPlanName, setDayPlanName] = useState('');
  const [notes, setNotes] = useState('');
  const [checkInDateTime, setCheckInDateTime] = useState<string>(getLocalDateTimeString(0));
  const [showConfirmCheckInModal, setShowConfirmCheckInModal] = useState<boolean>(false);
  const [lastCheckInId, setLastCheckInId] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    clientName: string;
    avatarUrl?: string;
    packageName?: string;
    totalSessions: number;
    completedSessions: number;
    remaining: number;
    checkInDateStr: string;
    checkInTimeStr: string;
    dayPlanName?: string;
    notes?: string;
  } | null>(null);
  const [copiedZalo, setCopiedZalo] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showCancelPasswordModal, setShowCancelPasswordModal] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleCopyImage = async () => {
    if (!cardRef.current) return;
    setIsGeneratingImage(true);

    try {
      const blob = await toBlob(cardRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        cacheBust: true,
      });

      if (!blob) {
        throw new Error('Could not create image blob');
      }

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

  const handleDownloadImage = async () => {
    if (!cardRef.current || !successResult) return;
    setIsGeneratingImage(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        cacheBust: true,
      });
      const link = document.createElement('a');
      link.download = `Thẻ_Điểm_Danh_${successResult.clientName.replace(/\s+/g, '_')}_${getTodayDateStr()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('Có lỗi khi tải ảnh. Vui lòng thử lại!');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Always resolve the active client from live clients array in GymContext to avoid stale session counts
  const activeClient = selectedClient
    ? (clients.find(c => c.id === selectedClient.id) || selectedClient)
    : null;

  useEffect(() => {
    const target = preselectedClient || initialClient;
    let chosen: Client | null = null;
    if (target) {
      chosen = clients.find(c => c.id === target.id) || target;
      setSelectedClient(chosen);
    } else if (clients.length > 0) {
      chosen = clients[0];
      setSelectedClient(chosen);
    }
    setCheckInDateTime(getLocalDateTimeString(0, chosen));
    setSuccessResult(null);
  }, [initialClient, preselectedClient, isOpen]);

  // Set default day plan name when selected client changes
  useEffect(() => {
    if (activeClient) {
      const clientProgram = programs.find(p => p.clientId === activeClient.id || p.id === activeClient.workoutProgramId);
      if (clientProgram && clientProgram.days.length > 0) {
        setDayPlanName(clientProgram.days[0].dayName);
      } else {
        setDayPlanName('Buổi tập toàn thân (Full Body)');
      }
    }
  }, [activeClient, programs]);

  const [modalFilterMode, setModalFilterMode] = useState<'today' | 'all'>('today');

  if (!isOpen) return null;

  const todayDayOfWeek = new Date().getDay();
  const todayDateIso = getTodayDateStr();

  const filteredClients = clients.filter(c => {
    const searchNormalized = removeAccents(searchQuery.trim().toLowerCase());
    const nameNormalized = removeAccents(c.name.toLowerCase());
    const matchesSearch = nameNormalized.includes(searchNormalized) || c.phone.includes(searchQuery.trim());
    if (!matchesSearch) return false;
    if (modalFilterMode === 'today') {
      const hasDay = c.preferredDays && c.preferredDays.includes(todayDayOfWeek);
      return hasDay;
    }
    return true;
  });

  const handleExecuteCheckIn = (overridePlan?: string, overrideNotes?: string) => {
    if (!activeClient) return;

    const finalPlan = overridePlan !== undefined ? overridePlan : dayPlanName;
    const finalNotes = overrideNotes !== undefined ? overrideNotes : notes;

    const log = checkInClient(activeClient.id, finalPlan, finalNotes, checkInDateTime);
    if (log) {
      setLastCheckInId(log.id);
      const dt = new Date(log.timestamp);
      // Update local state with latest sessions count
      const freshClient = clients.find(c => c.id === activeClient.id);
      if (freshClient) {
        setSelectedClient(freshClient);
      }

      const remSess = Math.max(0, log.sessionsRemainingAfter);
      const clientTotal = activeClient.totalSessions || 0;
      const totalSess = Math.max(1, clientTotal, remSess);
      const compSess = Math.max(0, totalSess - remSess);

      const dateStrFormatted = dt.toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      const timeStrFormatted = dt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

      setSuccessResult({
        clientName: activeClient.name,
        avatarUrl: activeClient.avatarUrl,
        packageName: activeClient.packageName,
        totalSessions: totalSess,
        completedSessions: compSess,
        remaining: remSess,
        checkInDateStr: dateStrFormatted,
        checkInTimeStr: timeStrFormatted,
        dayPlanName: dayPlanName || 'Buổi tập định kỳ',
        notes: notes
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-slate-200 text-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#84cc16] text-white flex items-center justify-center shadow-md shadow-lime-200">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-900">Check-in 1-Chạm Nhanh</h3>
              <p className="text-xs text-slate-500 font-medium">Trừ 1 buổi & lưu lịch sử tập luyện tự động</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {successResult ? (
            /* Screenshot-Ready Success Receipt Card */
            <div className="space-y-4">
              
              {/* Card Container for Screenshot */}
              <div ref={cardRef} className="bg-white border-2 border-indigo-100 rounded-2xl p-4 shadow-lg space-y-3 relative overflow-hidden text-left">
                {/* Badge */}
                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-bl-xl flex items-center gap-1 shadow-xs">
                  <CheckCircle2 className="w-3 h-3 text-white" /> Đã check-in
                </div>

                {/* Gym Header */}
                <div className="text-center pt-1 pb-2 border-b border-slate-100">
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-indigo-50 border border-indigo-200/60 rounded-full text-indigo-700 text-[11px] font-black uppercase tracking-wider mb-0.5">
                    <ShieldCheck className="w-3 h-3 text-[#4F46E5]" />
                    {displayGymName.toUpperCase()} • THẺ ĐIỂM DANH
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">Hệ thống ghi nhận điểm danh tự động - {displayGymName}</p>
                </div>

                {/* Client Info */}
                <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <img
                    src={successResult.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                    alt={successResult.clientName}
                    className="w-11 h-11 rounded-full object-cover border-2 border-indigo-500 ring-2 ring-indigo-100 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Học viên</span>
                    <h4 className="font-black text-slate-900 text-base leading-tight truncate">{successResult.clientName}</h4>
                    <p className="text-xs text-indigo-600 font-extrabold truncate mt-0.5">
                      {successResult.packageName || 'Gói PT 1:1'}
                    </p>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-xs font-semibold text-slate-700 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Ngày & giờ điểm danh:
                    </span>
                    <span className="font-extrabold text-slate-900">{successResult.checkInDateStr} {successResult.checkInTimeStr ? `(${successResult.checkInTimeStr})` : ''}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Dumbbell className="w-3.5 h-3.5 text-indigo-500" /> Nội dung tập:
                    </span>
                    <span className="font-black text-indigo-700">{successResult.dayPlanName || 'Buổi tập định kỳ'}</span>
                  </div>

                  {successResult.notes && (
                    <div className="pt-1 border-t border-slate-200/60 text-[11px]">
                      <span className="text-slate-400">Ghi chú: </span>
                      <span className="italic text-slate-700 font-medium">"{successResult.notes}"</span>
                    </div>
                  )}
                </div>

                {/* PROMINENT REMAINING SESSIONS OR MONTHLY DISPLAY */}
                {activeClient?.clientType === 'monthly' ? (
                  <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-slate-950 rounded-2xl p-3.5 shadow-md text-center space-y-1.5 relative overflow-hidden">
                    <span className="inline-block text-[10px] font-black uppercase tracking-wider text-slate-950 bg-white/30 border border-white/40 px-2.5 py-0.5 rounded-full">
                      📅 THẺ THÁNG (THEO HẠN HỢP ĐỒNG)
                    </span>
                    <div className="py-1">
                      <p className="text-xs font-bold text-amber-950">Hạn sử dụng hợp đồng đến ngày:</p>
                      <p className="text-xl font-black text-white drop-shadow-xs">{activeClient.endDate || 'Chưa cập nhật'}</p>
                    </div>
                    <div className="pt-1 border-t border-white/20 text-[10px] font-bold text-amber-950">
                      ⚡ Không giới hạn số buổi tập trong thời hạn HĐ.
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl p-3.5 shadow-md text-center space-y-1.5 relative overflow-hidden">
                    <span className="inline-block text-[10px] font-black uppercase tracking-wider text-emerald-100 bg-black/20 px-2.5 py-0.5 rounded-full">
                      ⚡ SỐ BUỔI CÒN LẠI TRONG GÓI
                    </span>

                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-3xl font-black tracking-tight text-white">{successResult.remaining}</span>
                      <span className="text-xs font-bold text-emerald-100">/ {successResult.totalSessions} buổi</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-white h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.round((successResult.completedSessions / Math.max(1, successResult.totalSessions)) * 100))}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-extrabold text-emerald-100">
                        <span>Đã tập: {successResult.completedSessions}/{successResult.totalSessions} buổi</span>
                        <span>Còn lại: {successResult.remaining} buổi</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Camera hint notice */}
                <div className="text-center pt-0.5">
                  <p className="text-[11px] text-slate-500 font-bold flex items-center justify-center gap-1">
                    <Camera className="w-3.5 h-3.5 text-indigo-600" />
                    Chụp màn hình thẻ này để gửi trực tiếp cho khách hàng
                  </p>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                {/* Quick Copy Image Button */}
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyImage}
                    disabled={isGeneratingImage}
                    className={`flex-1 py-3 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer active:scale-98 ${
                      copiedImage
                        ? 'bg-emerald-600 text-white shadow-emerald-200'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-teal-200'
                    }`}
                  >
                    {isGeneratingImage ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        Đang tạo ảnh...
                      </>
                    ) : copiedImage ? (
                      <>
                        <Check className="w-4 h-4 text-white" />
                        Đã copy ảnh thẻ! (Dán Zalo)
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-4 h-4" />
                        📸 Copy ảnh thẻ nhanh
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDownloadImage}
                    disabled={isGeneratingImage}
                    title="Tải ảnh thẻ điểm danh về máy"
                    className="py-3 px-3.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0 shadow-2xs"
                  >
                    <Download className="w-4 h-4 text-teal-700" />
                    Tải ảnh
                  </button>
                </div>

                {/* Quick Copy Text Button */}
                <button
                  onClick={() => {
                    const pct = Math.min(100, Math.max(0, Math.round((successResult.completedSessions / Math.max(1, successResult.totalSessions)) * 100)));
                    const textToCopy = `🏋️‍♂️ ${displayGymName.toUpperCase()} - XÁC NHẬN ĐIỂM DANH\n---------------------------------\n👤 Học viên: ${successResult.clientName}\n📦 Gói tập: ${successResult.packageName || 'Gói PT'}\n📅 Ngày điểm danh: ${successResult.checkInDateStr} (${successResult.checkInTimeStr})\n💪 Bài tập: ${successResult.dayPlanName || 'Buổi tập định kỳ'}\n📊 Đã tập: ${successResult.completedSessions}/${successResult.totalSessions} buổi (${pct}%)\n⚡ SỐ BUỔI CÒN LẠI: ${successResult.remaining} BUỔI\n---------------------------------\nCảm ơn bạn đã chăm chỉ tập luyện hôm nay! 💪🔥`;
                    navigator.clipboard.writeText(textToCopy);
                    setCopiedZalo(true);
                    setTimeout(() => setCopiedZalo(false), 2500);
                  }}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                    copiedZalo
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-indigo-50 hover:bg-indigo-100 text-[#4F46E5] border-indigo-200'
                  }`}
                >
                  {copiedZalo ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      Đã sao chép tin nhắn Zalo!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-[#4F46E5]" />
                      Sao chép tin nhắn chữ (gửi Zalo)
                    </>
                  )}
                </button>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  {activeClient && (
                    <button
                      onClick={() => setSuccessResult(null)}
                      className="flex-1 min-w-[140px] flex items-center justify-center gap-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-3 py-2 rounded-xl text-xs transition-all shadow-sm"
                    >
                      <Zap className="w-3.5 h-3.5 fill-slate-950" />
                      Check-in bù buổi khác
                    </button>
                  )}
                  {activeClient && onGoToProgram && (
                    <button
                      onClick={() => {
                        onGoToProgram(activeClient.id);
                        onClose();
                      }}
                      className="flex-1 min-w-[120px] flex items-center justify-center gap-1 bg-[#4F46E5] hover:bg-indigo-700 text-white font-extrabold px-3 py-2 rounded-xl text-xs transition-all shadow-sm"
                    >
                      <Dumbbell className="w-3.5 h-3.5" />
                      Xem giáo án
                    </button>
                  )}
                  <button
                    onClick={() => setSuccessResult(null)}
                    className="flex-1 min-w-[120px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-2 rounded-xl text-xs transition-all border border-slate-200"
                  >
                    Chọn khách khác
                  </button>
                </div>

                {lastCheckInId && (
                  <div className="pt-1 text-center">
                    <button
                      onClick={() => setShowCancelPasswordModal(true)}
                      className="text-xs text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-rose-600" /> Hủy lượt check-in này (+1 buổi)
                    </button>
                  </div>
                )}
              </div>

            </div>
          ) : (
            /* Main Check-In Form */
            <>
              {/* Step 1: Select Client */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                    1. Chọn học viên ({filteredClients.length} khách)
                  </label>

                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px]">
                    <button
                      type="button"
                      onClick={() => setModalFilterMode('today')}
                      className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                        modalFilterMode === 'today'
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Lịch hôm nay
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalFilterMode('all')}
                      className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                        modalFilterMode === 'all'
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Tất cả (ALL)
                    </button>
                  </div>
                </div>
                
                <div className="relative mb-2">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Lọc tên hoặc SĐT..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-100 text-slate-800 text-sm pl-10 pr-3 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white"
                  />
                </div>

                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100 bg-slate-50/50">
                  {filteredClients.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500 italic">
                      {modalFilterMode === 'today' 
                        ? 'Không có học viên theo lịch tập hôm nay. Bấm "Tất Cả (ALL)" để tìm khách khác.' 
                        : 'Không tìm thấy học viên nào.'}
                    </div>
                  ) : (
                    filteredClients.map(client => {
                      const isSelected = selectedClient?.id === client.id;
                      const todayStrDate = new Date().toDateString();
                      const isCheckedIn = checkIns && checkIns.some(ci => ci.clientId === client.id && new Date(ci.timestamp).toDateString() === todayStrDate);

                      return (
                        <div
                          key={client.id}
                          onClick={() => {
                            setSelectedClient(client);
                            setCheckInDateTime(getLocalDateTimeString(0, client));
                          }}
                          className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected 
                              ? 'bg-[#EEF2FF] border-l-4 border-l-[#4F46E5]' 
                              : isCheckedIn
                              ? 'bg-emerald-50/80 hover:bg-emerald-100/80 border-l-4 border-l-emerald-500'
                              : 'hover:bg-slate-100/60'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <img 
                              src={client.avatarUrl} 
                              alt={client.name} 
                              className={`w-8 h-8 rounded-full object-cover border ${
                                isCheckedIn ? 'border-emerald-400 ring-2 ring-emerald-200' : 'border-slate-200'
                              }`} 
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-bold text-slate-900">{client.name}</p>
                                {isCheckedIn && (
                                  <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.2 rounded-full shadow-2xs">
                                    ✓ Đã check
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 font-medium">{client.packageName}</p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <SessionBadge client={client} size="sm" />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Step 2: Selected Client Info & Day Plan */}
              {activeClient && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 gap-2 flex-wrap sm:flex-nowrap">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase">Đã chọn:</span>
                      <h4 className="font-extrabold text-slate-900 text-base">{activeClient.name}</h4>
                    </div>
                    <div className="text-right shrink-0">
                      <SessionBadge client={activeClient} size="md" showDetails={true} />
                    </div>
                  </div>

                  {activeClient.clientType !== 'monthly' && activeClient.remainingSessions <= 2 && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-xl text-xs font-medium">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                      <span>Cảnh báo: Khách hàng chỉ còn <b>{activeClient.remainingSessions} buổi</b>. Hãy nhắc tư vấn gia hạn!</span>
                    </div>
                  )}

                  {activeClient.clientType === 'monthly' && activeClient.endDate && activeClient.endDate < getTodayDateStr() && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-xl text-xs font-medium">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                      <span>Cảnh báo: Hợp đồng tháng đã hết hạn vào ngày <b>{activeClient.endDate}</b>. Vui lòng nhắc gia hạn!</span>
                    </div>
                  )}

                  {/* Date & Time Selection (supports backdating for missed check-ins) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                        2. Ngày & Giờ điểm danh (Hỗ trợ điểm danh bù)
                      </label>
                      <span className="text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full font-bold">
                        Chọn ngày đã qua nếu quên
                      </span>
                    </div>

                    {/* Quick date shortcuts */}
                    <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-1">
                      <button
                        type="button"
                        onClick={() => setCheckInDateTime(getLocalDateTimeString(0, activeClient))}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                          checkInDateTime.startsWith(getLocalDateTimeString(0, activeClient).slice(0, 10))
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Zap className="w-3 h-3 fill-current text-amber-300" /> Hôm nay
                      </button>

                      <button
                        type="button"
                        onClick={() => setCheckInDateTime(getLocalDateTimeString(1, activeClient))}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                          checkInDateTime.startsWith(getLocalDateTimeString(1, activeClient).slice(0, 10))
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <History className="w-3 h-3" /> Hôm qua
                      </button>

                      <button
                        type="button"
                        onClick={() => setCheckInDateTime(getLocalDateTimeString(2, activeClient))}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                          checkInDateTime.startsWith(getLocalDateTimeString(2, activeClient).slice(0, 10))
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Clock className="w-3 h-3" /> 2 ngày trước
                      </button>

                      <button
                        type="button"
                        onClick={() => setCheckInDateTime(getLocalDateTimeString(3, activeClient))}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                          checkInDateTime.startsWith(getLocalDateTimeString(3, activeClient).slice(0, 10))
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        3 ngày trước
                      </button>
                    </div>

                    {/* Custom datetime picker input */}
                    <input
                      type="datetime-local"
                      value={checkInDateTime}
                      onChange={(e) => setCheckInDateTime(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-xl p-2.5 font-bold focus:outline-none focus:ring-2 focus:ring-[#4F46E5] transition-all"
                    />

                    {/* Registered Schedule Auto-Fill Badge */}
                    {activeClient && (
                      <div className="mt-2 text-[11px] font-bold text-indigo-950 bg-indigo-50/90 border border-indigo-200/80 p-2.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 shadow-2xs">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>
                            Lịch đăng ký: <strong className="text-indigo-950 font-black">{getClientRegisteredTimeForDate(activeClient, new Date(checkInDateTime)) || activeClient.preferredTime || 'Không cố định'}</strong>
                          </span>
                        </div>
                        <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300/80 px-2 py-0.5 rounded-md self-start sm:self-auto shrink-0">
                          ✓ Mặc định theo lịch
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Day Plan Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                      <Dumbbell className="w-3.5 h-3.5 text-indigo-600" />
                      3. Bài tập / Lịch tập ngày check-in
                    </label>
                    
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {['Ngực - Tay Sau', 'Lưng - Tay Trước', 'Chân - Mông', 'Vai - Bụng', 'Cardio', 'Tập Toàn Thân'].map(preset => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setDayPlanName(preset)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                            dayPlanName === preset
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      value={dayPlanName}
                      onChange={(e) => setDayPlanName(e.target.value)}
                      placeholder="Hoặc nhập tên bài tập (Ví dụ: Leg Day...)"
                      className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      4. Ghi chú buổi tập (Không bắt buộc)
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Đẩy Bench tăng 5kg, thể lực tốt..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!successResult && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-full text-slate-500 hover:text-slate-800 text-sm font-bold transition-colors"
            >
              Hủy
            </button>
            
            <button
              disabled={!activeClient || (activeClient.clientType !== 'monthly' && activeClient.remainingSessions <= 0)}
              onClick={() => setShowConfirmCheckInModal(true)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-extrabold text-sm shadow-lg transition-all ${
                !activeClient || (activeClient.clientType !== 'monthly' && activeClient.remainingSessions <= 0)
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-[#84cc16] hover:bg-[#65a30d] text-white active:scale-95 shadow-lime-200 cursor-pointer'
              }`}
            >
              <Zap className="w-4 h-4 fill-white" />
              HOÀN THÀNH CHECK-IN
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modal before executing check-in */}
      {activeClient && (
        <ConfirmCheckInModal
          isOpen={showConfirmCheckInModal}
          clientName={activeClient.name}
          avatarUrl={activeClient.avatarUrl}
          packageName={activeClient.packageName}
          remainingSessions={activeClient.remainingSessions}
          clientType={activeClient.clientType}
          dayPlanName={dayPlanName || 'Buổi tập định kỳ'}
          checkInDateStr={checkInDateTime ? new Date(checkInDateTime).toLocaleString('vi-VN', {
            weekday: 'long',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }) : undefined}
          onClose={() => setShowConfirmCheckInModal(false)}
          onConfirm={(editedPlan, editedNotes) => {
            setShowConfirmCheckInModal(false);
            handleExecuteCheckIn(editedPlan, editedNotes);
          }}
        />
      )}

      {/* Password Confirmation Modal for Cancel Check-in */}
      <ConfirmPasswordModal
        isOpen={showCancelPasswordModal}
        title="Xác Nhận Mật Khẩu Hủy Check-in"
        description="Bạn đang yêu cầu HỦY lượt check-in vừa thực hiện. Thao tác này sẽ cộng lại +1 buổi tập cho học viên."
        confirmLabel="Xác Nhận Hủy Check-in"
        onClose={() => setShowCancelPasswordModal(false)}
        onConfirm={() => {
          if (lastCheckInId) {
            cancelCheckIn(lastCheckInId);
            setSuccessResult(null);
            setLastCheckInId(null);
          }
          setShowCancelPasswordModal(false);
        }}
      />
    </div>
  );
};
