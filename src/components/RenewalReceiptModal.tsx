import React, { useRef, useState } from 'react';
import { X, Copy, Download, Zap, CheckCircle2, Loader2, Image as ImageIcon, ShieldCheck } from 'lucide-react';
import { toBlob, toPng } from 'html-to-image';
import { useTenant } from '../context/TenantContext';

export interface RenewalReceiptData {
  clientName: string;
  packageName: string;
  amountPaid: number;
  addedSessions: number;
  totalRemainingSessions: number;
  newExpirationDate: string;
  createdAt: string;
}

interface RenewalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: RenewalReceiptData | null;
}

export const RenewalReceiptModal: React.FC<RenewalReceiptModalProps> = ({
  isOpen,
  onClose,
  receiptData,
}) => {
  const { currentUser, tenants, activeTenantId } = useTenant();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);

  if (!isOpen || !receiptData) return null;

  const activeTenant = tenants.find(t => t.tenantId === activeTenantId || t.id === activeTenantId);
  const rawGymName = activeTenant?.gymName || (currentUser?.tenantId === activeTenantId ? currentUser?.gymName : null) || currentUser?.gymName || currentUser?.ownerName || 'NB Fit';
  const displayGymName = rawGymName.replace(/\s*\(Gốc\)/i, '').trim();

  const handleCopyImage = async () => {
    if (!cardRef.current) return;
    setIsGeneratingImage(true);
    try {
      const blob = await toBlob(cardRef.current, {
        quality: 1,
        pixelRatio: 3,
        backgroundColor: '#ffffff'
      });
      if (blob) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setCopiedImage(true);
        setTimeout(() => setCopiedImage(false), 3000);
      }
    } catch (err) {
      console.error('Failed to copy image', err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    setIsGeneratingImage(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 3,
        backgroundColor: '#ffffff'
      });
      const link = document.createElement('a');
      const safeName = receiptData.clientName.replace(/\s+/g, '_');
      const dStr = receiptData.createdAt.split(' ')[0].replace(/\//g, '');
      link.download = `PhieuGiaHan_${safeName}_${dStr}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download image', err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 shrink-0">
          <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-[#FF4E00]" />
            Thẻ Xác Nhận Gia Hạn
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto bg-slate-100 flex-1 flex justify-center items-start">
          
          {/* THE RECEIPT CARD TO CAPTURE */}
          <div 
            ref={cardRef} 
            className="w-full bg-slate-900 rounded-3xl shadow-xl overflow-hidden flex flex-col relative"
            style={{ width: '320px' }}
          >
            {/* Top decorative shape */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#FF4E00]/20 to-transparent pointer-events-none"></div>

            {/* Brand Logo Header */}
            <div className="p-6 pb-2 text-center relative z-10">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                <ShieldCheck className="w-6 h-6 text-[#FF4E00]" />
              </div>
              <h2 className="font-black text-xl text-white tracking-tight">{displayGymName}</h2>
              <p className="text-[#FF4E00] text-xs font-bold uppercase tracking-wider mt-1">Xác nhận thanh toán</p>
            </div>

            {/* Content Details */}
            <div className="p-6 space-y-4 relative z-10">
              {/* Divider */}
              <div className="flex items-center justify-center gap-1 opacity-20">
                <div className="w-full h-px bg-white"></div>
                <Zap className="w-4 h-4 text-white shrink-0" />
                <div className="w-full h-px bg-white"></div>
              </div>

              {/* Client & Package */}
              <div className="text-center space-y-1">
                <p className="text-slate-400 text-xs font-medium">Học viên</p>
                <p className="text-white text-lg font-black uppercase tracking-wide">{receiptData.clientName}</p>
                <div className="inline-block mt-2 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                  <p className="text-white text-xs font-bold">{receiptData.packageName}</p>
                </div>
              </div>

              {/* Amount */}
              <div className="bg-[#FF4E00]/10 rounded-2xl p-4 text-center border border-[#FF4E00]/20 mt-4">
                <p className="text-[#FF4E00] text-xs font-bold mb-1">Số tiền thanh toán</p>
                <p className="text-3xl font-black text-white">{formatVND(receiptData.amountPaid)}</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                  <p className="text-slate-400 text-[10px] font-medium uppercase mb-1">Cộng thêm</p>
                  <p className="text-emerald-400 text-base font-black">+{receiptData.addedSessions} buổi</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                  <p className="text-slate-400 text-[10px] font-medium uppercase mb-1">Tổng còn lại</p>
                  <p className="text-white text-base font-black">{receiptData.totalRemainingSessions} buổi</p>
                </div>
              </div>

              {/* Expiration Date */}
              {receiptData.newExpirationDate && (
                <div className="bg-white/5 rounded-xl p-3 border border-white/5 text-center mt-3">
                  <p className="text-slate-400 text-[10px] font-medium uppercase mb-1">Thời hạn hợp đồng</p>
                  <p className="text-white text-sm font-bold">{receiptData.newExpirationDate}</p>
                </div>
              )}

              {/* Footer text */}
              <div className="pt-4 text-center">
                <p className="text-slate-500 text-[10px]">{receiptData.createdAt}</p>
                <p className="text-slate-500 text-[10px] mt-1 font-bold">Cảm ơn bạn đã đồng hành cùng {displayGymName}</p>
              </div>
            </div>
            
            {/* Bottom decorative shape */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none"></div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center gap-2 shrink-0">
          <button
            onClick={handleDownloadImage}
            disabled={isGeneratingImage}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 rounded-2xl text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Tải ảnh PNG
          </button>
          
          <button
            onClick={handleCopyImage}
            disabled={isGeneratingImage}
            className={`flex-[1.5] font-bold py-2.5 rounded-2xl text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-md ${
              copiedImage 
                ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
                : 'bg-[#FF4E00] hover:bg-orange-600 text-white shadow-orange-500/20'
            }`}
          >
            {isGeneratingImage ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : copiedImage ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            {copiedImage ? 'Đã sao chép!' : 'Copy ảnh Zalo'}
          </button>
        </div>

      </div>
    </div>
  );
};
