import React, { useRef, useState } from 'react';
import { X, Copy, Download, CheckCircle2, Loader2 } from 'lucide-react';
import { toBlob, toPng } from 'html-to-image';
import html2canvas from 'html2canvas';
import { useTenant } from '../context/TenantContext';
import { NbGymLogo } from './NbGymLogo';

export interface ReceiptData {
  clientName: string;            // Tên khách hàng / học viên
  packageName: string;           // Tên gói tập / dịch vụ gia hạn
  amountPaid: number;            // Số tiền thanh toán (VNĐ)
  addedSessions: number;         // Số buổi / thời lượng cộng thêm
  totalRemainingSessions: number;// Tổng số buổi / thời lượng còn lại
  newExpirationDate: string;     // Hạn hợp đồng / hạn sử dụng mới (DD/MM/YYYY)
  createdAt: string;             // Ngày giờ giao dịch (DD/MM/YYYY HH:mm)
}

// Type alias for backwards compatibility
export type RenewalReceiptData = ReceiptData;

export interface RenewalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: ReceiptData | null;
  brandName?: string;            // Tên thương hiệu (mặc định: NB Fit Private hoặc tên phòng tập)
}

export const RenewalReceiptModal: React.FC<RenewalReceiptModalProps> = ({
  isOpen,
  onClose,
  receiptData,
  brandName
}) => {
  // All hooks declared at top before any conditional return
  const { currentUser, tenants, activeTenantId } = useTenant();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !receiptData) return null;

  // Resolve brand name
  const activeTenant = tenants.find(t => t.tenantId === activeTenantId || t.id === activeTenantId);
  const rawGymName = brandName || activeTenant?.gymName || (currentUser?.tenantId === activeTenantId ? currentUser?.gymName : null) || currentUser?.gymName || currentUser?.ownerName || 'NB Fit Private';
  const finalBrandName = rawGymName.replace(/\s*\(Gốc\)/i, '').trim() || 'NB Fit Private';

  // Helper to generate PNG Blob with fallback
  const generateBlob = async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    await new Promise(r => setTimeout(r, 10));

    // Try html-to-image toBlob first (~20ms)
    try {
      const blob = await toBlob(cardRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#111111'
      });
      if (blob) return blob;
    } catch (err) {
      console.warn('html-to-image toBlob failed, using html2canvas fallback...', err);
    }

    // Fallback to html2canvas
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: '#111111',
        useCORS: true,
        logging: false
      });
      return await new Promise<Blob | null>(resolve => {
        canvas.toBlob(blob => resolve(blob), 'image/png', 0.95);
      });
    } catch (err) {
      console.error('html2canvas fallback failed', err);
      return null;
    }
  };

  // 1. Handle Download PNG
  const handleDownload = async () => {
    if (!receiptData || isGenerating) return;
    setIsGenerating(true);
    try {
      await new Promise(r => setTimeout(r, 10));
      let dataUrl: string | null = null;
      if (cardRef.current) {
        try {
          dataUrl = await toPng(cardRef.current, {
            quality: 0.95,
            pixelRatio: 2,
            cacheBust: true,
            backgroundColor: '#111111'
          });
        } catch {
          const blob = await generateBlob();
          if (blob) {
            dataUrl = URL.createObjectURL(blob);
          }
        }
      }

      if (dataUrl) {
        const link = document.createElement('a');
        const safeName = receiptData.clientName.replace(/\s+/g, '_');
        const dStr = receiptData.createdAt.split(' ')[0].replace(/[\/:]/g, '-');
        link.download = `Bill_GiaHan_${safeName}_${dStr}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setSuccessMsg('Đã tải ảnh về máy!');
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err) {
      console.error('Failed to download receipt', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. Handle Fast Copy for Zalo with Clipboard & Download Fallbacks
  const handleCopy = async () => {
    if (!receiptData || isGenerating) return;
    setIsGenerating(true);
    try {
      await new Promise(r => setTimeout(r, 10));
      const blob = await generateBlob();
      let copiedImageSuccess = false;

      // Attempt direct image clipboard write
      if (blob && navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          copiedImageSuccess = true;
          setSuccessMsg('Đã sao chép ảnh!');
          setTimeout(() => setSuccessMsg(null), 3000);
        } catch (clipErr) {
          console.warn('Direct image clipboard write rejected, triggering fallback download & text copy...', clipErr);
        }
      }

      // If clipboard was blocked by browser permissions or sandbox iframe:
      if (!copiedImageSuccess) {
        // Trigger auto image download
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          const safeName = receiptData.clientName.replace(/\s+/g, '_');
          const dStr = receiptData.createdAt.split(' ')[0].replace(/[\/:]/g, '-');
          link.download = `Bill_GiaHan_${safeName}_${dStr}.png`;
          link.href = url;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(url), 5000);
        }

        // Auto copy formatted Zalo text message to clipboard
        const formattedAmount = new Intl.NumberFormat('vi-VN').format(receiptData.amountPaid || 0);
        const textMessage = 
`🏋️ ${finalBrandName} - XÁC NHẬN GIA HẠN GÓI TẬP
━━━━━━━━━━━━━━━━━━━
👤 Học viên: ${receiptData.clientName}
📦 Gói tập: ${receiptData.packageName}
💰 Số tiền: ${formattedAmount} VNĐ
⚡ Gia hạn thêm: +${receiptData.addedSessions} buổi
🎯 Tổng buổi còn lại: ${receiptData.totalRemainingSessions} buổi
${receiptData.newExpirationDate ? `📅 Thời hạn hợp đồng: ${receiptData.newExpirationDate}\n` : ''}⏰ Ngày giao dịch: ${receiptData.createdAt}
━━━━━━━━━━━━━━━━━━━
Cảm ơn Quý khách đã luôn đồng hành cùng ${finalBrandName}! ❤️`;

        try {
          await navigator.clipboard.writeText(textMessage);
        } catch (textErr) {
          console.warn('Could not copy text to clipboard', textErr);
        }

        setSuccessMsg('Đã tải ảnh & copy tin Zalo!');
        setTimeout(() => setSuccessMsg(null), 3500);
      }
    } catch (err) {
      console.error('Failed to copy receipt', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-[360px] flex flex-col items-center max-h-[95vh] overflow-y-auto pr-1">
        
        {/* Top Dismiss Button */}
        <div className="w-[320px] flex justify-end pb-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================= */}
        {/* THE RECEIPT CARD TO CAPTURE (Dark Mode Luxury Card: 320px) */}
        {/* ========================================================= */}
        <div
          ref={cardRef}
          className="w-[320px] rounded-3xl bg-[#111111] text-[#f1f5f9] shadow-2xl overflow-hidden flex flex-col relative border border-white/10 shrink-0"
          style={{
            width: '320px',
            backgroundImage: 'radial-gradient(circle at top right, rgba(255, 98, 0, 0.22), transparent 60%), radial-gradient(circle at bottom left, rgba(217, 4, 41, 0.15), transparent 50%)'
          }}
        >
          {/* Header */}
          <div className="p-6 pb-2 text-center relative z-10">
            <div className="relative inline-block mx-auto mb-2">
              <div className="absolute inset-0 bg-gradient-to-r from-[#FF5E00] to-[#FFB703] blur-md opacity-75 rounded-full scale-110"></div>
              <NbGymLogo size="md" className="relative z-10" />
            </div>
            <h2 className="text-xl font-black text-white tracking-tight uppercase">
              {finalBrandName}
            </h2>
            <p className="text-amber-400 text-[11px] font-bold tracking-widest uppercase mt-0.5">
              XÁC NHẬN GIA HẠN
            </p>
          </div>

          {/* Customer Info */}
          <div className="px-6 text-center space-y-0.5 relative z-10">
            <p className="text-[11px] text-[#94a3b8] font-medium uppercase tracking-wider">
              Học viên / Khách hàng
            </p>
            <p className="text-lg font-bold text-white uppercase whitespace-normal break-words leading-snug">
              {receiptData.clientName}
            </p>
          </div>

          {/* Transaction Details Table */}
          <div className="px-5 py-3 relative z-10">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-3.5 space-y-2.5 text-xs">
              {/* Gói dịch vụ */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#94a3b8]">Gói dịch vụ</span>
                <span className="text-white font-bold text-right truncate max-w-[170px]" title={receiptData.packageName}>
                  {receiptData.packageName}
                </span>
              </div>

              {/* Tiền thanh toán */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
                <span className="text-[#94a3b8]">Tiền thanh toán</span>
                <span className="text-[#34d399] font-bold text-base">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(receiptData.amountPaid || 0)}
                </span>
              </div>

              {/* Ngày giao dịch */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
                <span className="text-[#94a3b8]">Ngày giao dịch</span>
                <span className="text-white font-semibold">
                  {receiptData.createdAt}
                </span>
              </div>

              {/* Số buổi gia hạn */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
                <span className="text-[#94a3b8]">Số buổi gia hạn</span>
                <span className="text-[#f472b6] font-bold text-sm">
                  +{receiptData.addedSessions} buổi
                </span>
              </div>

              {/* Tổng buổi còn lại */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
                <span className="text-[#94a3b8]">Tổng buổi còn lại</span>
                <span className="text-white font-black text-base">
                  {receiptData.totalRemainingSessions} buổi
                </span>
              </div>

              {/* Thời hạn hợp đồng */}
              {receiptData.newExpirationDate && (
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
                  <span className="text-[#94a3b8]">Thời hạn hợp đồng</span>
                  <span className="text-[#fbbf24] font-bold text-sm">
                    {receiptData.newExpirationDate}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Footer of the Bill */}
          <div className="bg-black/40 py-3 px-4 text-center border-t border-white/5 flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-400 relative z-10 mt-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Giao dịch thành công</span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* ACTION BUTTONS (Below the Bill) */}
        {/* ========================================================= */}
        <div className="w-[320px] mt-4 space-y-2.5 shrink-0">
          <div className="flex items-center gap-2 w-full">
            {/* Nút "Tải về" (1/3 chiều rộng) */}
            <button
              type="button"
              onClick={handleDownload}
              disabled={isGenerating}
              className="w-1/3 bg-white/10 hover:bg-white/20 text-white font-bold text-sm py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              title="Tải ảnh bill PNG chất lượng cao về máy"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>Tải về</span>
            </button>

            {/* Nút chính "Copy nhanh gửi Zalo" (2/3 chiều rộng) */}
            <button
              type="button"
              onClick={handleCopy}
              disabled={isGenerating}
              className="w-2/3 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold text-sm py-3 rounded-xl shadow-lg shadow-rose-600/20 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>Đang xử lý...</span>
                </>
              ) : successMsg ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span className="truncate">{successMsg}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 shrink-0" />
                  <span>Copy nhanh gửi Zalo</span>
                </>
              )}
            </button>
          </div>

          {/* Nút Đóng cửa sổ */}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer py-1"
            >
              Đóng cửa sổ
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
