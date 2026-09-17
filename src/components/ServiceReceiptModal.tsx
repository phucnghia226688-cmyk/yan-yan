import React, { useRef, useState } from 'react';
import { X, Copy, Check, Download, Loader2, Sparkles, Utensils, Award, ShieldCheck } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useTenant } from '../context/TenantContext';
import { NbGymLogo } from './NbGymLogo';

export interface ServiceReceiptData {
  clientName: string;
  avatarUrl?: string;
  serviceName: string;
  checkInDateStr: string;
  checkInTimeStr: string;
  notes?: string;
  remainingCount: number;
  totalCount: number;
}

interface ServiceReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ServiceReceiptData | null;
}

export const ServiceReceiptModal: React.FC<ServiceReceiptModalProps> = ({
  isOpen,
  onClose,
  data
}) => {
  const { currentUser, activeTenantId, tenants } = useTenant();
  const cardRef = useRef<HTMLDivElement>(null);
  const [copiedImage, setCopiedImage] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  if (!isOpen || !data) return null;

  const activeTenant = tenants.find(t => t.tenantId === activeTenantId || t.id === activeTenantId);
  const rawGymName = activeTenant?.gymName || (currentUser?.tenantId === activeTenantId ? currentUser?.gymName : null) || currentUser?.gymName || currentUser?.ownerName || 'NBFit Private Gym';
  const displayGymName = rawGymName.replace(/\s*\(Gốc\)/i, '').trim();
  const ptName = activeTenant?.ownerName || currentUser?.ownerName || 'HLV Cá Nhân';

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const generateCanvas = async (): Promise<HTMLCanvasElement | null> => {
    if (!cardRef.current) return null;
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#090d16',
        logging: false
      });
      return canvas;
    } catch (err) {
      console.error('html2canvas error:', err);
      return null;
    }
  };

  const handleCopyImage = async () => {
    setIsGenerating(true);
    try {
      const canvas = await generateCanvas();
      if (!canvas) throw new Error('Không tạo được canvas');

      canvas.toBlob(async (blob) => {
        if (!blob) {
          showToast('❌ Không thể tạo định dạng ảnh');
          setIsGenerating(false);
          return;
        }

        try {
          if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            setCopiedImage(true);
            showToast('✅ Đã sao chép thẻ ảnh! Hãy mở Zalo và ấn Ctrl+V để dán.');
            setTimeout(() => setCopiedImage(false), 3000);
          } else {
            // Fallback download
            handleDownloadImage();
            showToast('📥 Đã tải ảnh về máy do trình duyệt giới hạn Clipboard.');
          }
        } catch (clipErr) {
          console.warn('Clipboard write failed, triggering download fallback:', clipErr);
          handleDownloadImage();
          showToast('📥 Đã tải thẻ ảnh PNG về thiết bị của bạn.');
        } finally {
          setIsGenerating(false);
        }
      }, 'image/png');
    } catch (err) {
      console.error('Copy image error:', err);
      setIsGenerating(false);
      showToast('❌ Có lỗi khi tạo thẻ ảnh.');
    }
  };

  const handleDownloadImage = async () => {
    setIsGenerating(true);
    try {
      const canvas = await generateCanvas();
      if (!canvas) throw new Error('Không tạo được canvas');

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const cleanClientName = data.clientName.replace(/\s+/g, '_').toLowerCase();
      link.download = `the_dich_vu_${cleanClientName}_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      showToast('✅ Đã tải ảnh PNG thành công!');
    } catch (err) {
      console.error('Download error:', err);
      showToast('❌ Có lỗi khi tải ảnh.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyTextZalo = () => {
    const textMsg = `🎫 PHIẾU XÁC NHẬN DỊCH VỤ - ${displayGymName.toUpperCase()}\n` +
      `👤 Học viên: ${data.clientName}\n` +
      `📋 Dịch vụ: ${data.serviceName}\n` +
      `⏰ Thời gian: ${data.checkInTimeStr} - ${data.checkInDateStr}\n` +
      `${data.notes ? `📝 Ghi chú: ${data.notes}\n` : ''}` +
      `📊 SỐ SUẤT CÒN LẠI: ${data.remainingCount}/${data.totalCount} suất\n` +
      `---------------------------\n` +
      `Cảm ơn bạn đã luôn đồng hành cùng ${displayGymName}! Chúc bạn ngày mới nhiều năng lượng. 💪`;

    navigator.clipboard.writeText(textMsg);
    setCopiedText(true);
    showToast('✅ Đã sao chép nội dung tin nhắn Zalo!');
    setTimeout(() => setCopiedText(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-6">
        
        {/* Toast inside modal */}
        {toastMsg && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-amber-400 text-slate-950 font-black text-xs px-4 py-2 rounded-full shadow-lg border border-amber-500 animate-bounce whitespace-nowrap">
            {toastMsg}
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-white text-base">Thẻ Check-in Dịch Vụ (Gửi Zalo)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card Render Container (Source for html2canvas) */}
        <div className="p-4 flex justify-center bg-slate-950">
          <div
            ref={cardRef}
            className="w-[340px] bg-gradient-to-b from-slate-900 via-[#0B132B] to-slate-950 border-2 border-amber-400/40 rounded-3xl p-5 text-white shadow-2xl relative overflow-hidden font-sans"
          >
            {/* Subtle background glow ornaments */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />

            {/* Gym Brand Header */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <NbGymLogo size="sm" className="drop-shadow-[0_4px_10px_rgba(255,100,0,0.4)]" />
                <div>
                  <h4 className="font-black text-sm tracking-wide text-amber-400 uppercase">
                    {displayGymName}
                  </h4>
                  <p className="text-[10px] font-bold text-slate-400 tracking-wider">
                    DỊCH VỤ CHĂM SÓC HỌC VIÊN
                  </p>
                </div>
              </div>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/30">
                Xác Thực
              </span>
            </div>

            {/* Ticket Title */}
            <div className="text-center mb-4">
              <span className="text-[11px] font-black tracking-widest text-slate-400 uppercase">
                PHIẾU CHECK-IN DỊCH VỤ
              </span>
              <div className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-400/15 border border-amber-400/30 text-amber-300">
                <Utensils className="w-4 h-4 text-amber-400" />
                <span className="font-black text-sm">{data.serviceName}</span>
              </div>
            </div>

            {/* Client Info Card */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 mb-4">
              <div className="flex items-center gap-3">
                {data.avatarUrl ? (
                  <img
                    src={data.avatarUrl}
                    alt={data.clientName}
                    crossOrigin="anonymous"
                    className="w-12 h-12 rounded-2xl object-cover border-2 border-amber-400/50 shadow-md"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-amber-400 flex items-center justify-center font-black text-lg border border-amber-400/40">
                    {data.clientName.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Học viên</p>
                  <h5 className="text-base font-black text-white leading-tight">
                    {data.clientName}
                  </h5>
                  <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                    HLV phụ trách: <span className="text-amber-300 font-bold">{ptName}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Details Table */}
            <div className="space-y-2.5 text-xs bg-slate-900/80 rounded-2xl p-3 border border-slate-800/80 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">Thời gian điểm danh:</span>
                <span className="font-bold text-white text-right font-mono">
                  {data.checkInTimeStr} • {data.checkInDateStr}
                </span>
              </div>

              {data.notes && (
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-slate-400 font-semibold block mb-1">Ghi chú thực hiện:</span>
                  <p className="text-slate-200 font-medium bg-slate-950/70 p-2 rounded-xl border border-slate-800 text-[11px] italic">
                    "{data.notes}"
                  </p>
                </div>
              )}
            </div>

            {/* Remaining Count Highlight Box */}
            <div className={`p-4 rounded-2xl text-center border-2 shadow-inner mb-3 transition-colors ${
              data.remainingCount <= 0
                ? 'bg-rose-950/40 border-rose-500/70'
                : data.remainingCount <= 3
                ? 'bg-amber-950/40 border-amber-500/70'
                : 'bg-emerald-950/30 border-emerald-500/50'
            }`}>
              <p className="text-[11px] font-black uppercase tracking-wider text-slate-300">
                SỐ SUẤT DỊCH VỤ CÒN LẠI
              </p>
              <div className="flex items-baseline justify-center gap-1.5 mt-1">
                <span className={`text-3xl font-black ${
                  data.remainingCount <= 0 ? 'text-rose-400' : data.remainingCount <= 3 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {data.remainingCount}
                </span>
                <span className="text-sm font-bold text-slate-400">
                  / {data.totalCount} suất
                </span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 mt-1">
                {data.remainingCount <= 0
                  ? '⛔ Đã hết suất dịch vụ • Vui lòng gia hạn thêm'
                  : data.remainingCount <= 3
                  ? '⚠️ Sắp hết suất dịch vụ • Nhắc học viên gia hạn'
                  : '✅ Đang hoạt động ổn định'}
              </p>
            </div>

            {/* Footer Watermark */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[9px] text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> Hệ thống NB-FIT SaaS
              </span>
              <span>Mã thẻ: SV-{Date.now().toString().slice(-6)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handleCopyImage}
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-3 px-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 cursor-pointer disabled:opacity-50 text-xs sm:text-sm"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : copiedImage ? (
                <Check className="w-4 h-4 text-slate-950" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              <span>{copiedImage ? 'Đã Sao Chép Ảnh!' : '📋 Sao Chép Thẻ Ảnh'}</span>
            </button>

            <button
              onClick={handleDownloadImage}
              disabled={isGenerating}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-3 px-3 rounded-2xl flex items-center justify-center gap-2 border border-slate-700 transition-all active:scale-95 cursor-pointer disabled:opacity-50 text-xs sm:text-sm"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>📥 Tải Ảnh PNG</span>
            </button>
          </div>

          <button
            onClick={handleCopyTextZalo}
            className="w-full bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white font-bold py-2.5 px-3 rounded-xl border border-slate-800 flex items-center justify-center gap-1.5 text-xs transition-colors cursor-pointer"
          >
            {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copiedText ? 'Đã sao chép text Zalo!' : '📋 Sao chép nội dung tin nhắn Zalo (Dạng văn bản)'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
