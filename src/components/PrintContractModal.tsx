import React, { useState, useEffect } from 'react';
import { Printer, Copy, Check, X, Building2, User, Edit3, Save, ShieldCheck, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

export interface ContractData {
  clientName: string;
  phone: string;
  gender?: string;
  dob?: string;
  packageName: string;
  totalSessions: number;
  amountVnd: number;
  paymentMethod: string;
  startDate: string;
  endDate: string;
  trainingType?: string;
  goals?: string;
  healthNotes?: string;
  preferredDays?: number[];
  preferredTime?: string;
  ptName?: string;
  tenantName?: string;
  customNotes?: string;
}

interface PrintContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ContractData;
}

const DAY_LABELS: Record<number, string> = {
  1: 'Thứ 2',
  2: 'Thứ 3',
  3: 'Thứ 4',
  4: 'Thứ 5',
  5: 'Thứ 6',
  6: 'Thứ 7',
  0: 'Chủ Nhật'
};

const DEFAULT_PARTY_A = {
  centerName: 'NB PRIVATE GYM & PERSONAL TRAINING',
  representative: 'Nguyễn Bỉnh (HLV Trưởng)',
  centerHotline: '0901 234 567',
  centerAddress: 'Số 188 Nguyễn Văn Cừ, Quận 5, TP. Hồ Chí Minh'
};

export const PrintContractModal: React.FC<PrintContractModalProps> = ({
  isOpen,
  onClose,
  data
}) => {
  const [copied, setCopied] = useState(false);
  const [editableNotes, setEditableNotes] = useState(data.customNotes || '');
  const [isEditingPartyA, setIsEditingPartyA] = useState(false);
  const [savePartyASuccess, setSavePartyASuccess] = useState(false);

  // Load persistent Party A configuration
  const [centerName, setCenterName] = useState(DEFAULT_PARTY_A.centerName);
  const [representative, setRepresentative] = useState(DEFAULT_PARTY_A.representative);
  const [centerHotline, setCenterHotline] = useState(DEFAULT_PARTY_A.centerHotline);
  const [centerAddress, setCenterAddress] = useState(DEFAULT_PARTY_A.centerAddress);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('contract_party_a_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.centerName) setCenterName(parsed.centerName);
        if (parsed.representative) setRepresentative(parsed.representative);
        if (parsed.centerHotline) setCenterHotline(parsed.centerHotline);
        if (parsed.centerAddress) setCenterAddress(parsed.centerAddress);
      } else {
        if (data.tenantName) setCenterName(data.tenantName);
        if (data.ptName) setRepresentative(data.ptName);
      }
    } catch (e) {
      console.warn('Error loading party A config:', e);
    }
  }, [data]);

  if (!isOpen) return null;

  const handleSavePartyA = () => {
    try {
      const config = {
        centerName: centerName.trim() || DEFAULT_PARTY_A.centerName,
        representative: representative.trim() || DEFAULT_PARTY_A.representative,
        centerHotline: centerHotline.trim() || DEFAULT_PARTY_A.centerHotline,
        centerAddress: centerAddress.trim() || DEFAULT_PARTY_A.centerAddress
      };
      localStorage.setItem('contract_party_a_config', JSON.stringify(config));
      setSavePartyASuccess(true);
      setTimeout(() => setSavePartyASuccess(false), 3000);
      setIsEditingPartyA(false);
    } catch (e) {
      alert('Không thể lưu cấu hình Bên A vào trình duyệt!');
    }
  };

  const formattedAmount = data.amountVnd
    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(data.amountVnd)
    : '0 VNĐ';

  const scheduleDaysStr = data.preferredDays && data.preferredDays.length > 0
    ? data.preferredDays.map(d => DAY_LABELS[d] || `T${d}`).join(', ')
    : 'Thứ 2, Thứ 4, Thứ 6';

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const text = `
CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
-----------------------------------
HỢP ĐỒNG DỊCH VỤ HUẤN LUYỆN CÁ NHÂN (PERSONAL TRAINING CONTRACT)

BÊN A (TRUNG TÂM GYM / PT CENTER):
- Đơn vị: ${centerName}
- Đại diện: ${representative}
- Hotline: ${centerHotline}
- Địa chỉ: ${centerAddress}

BÊN B (KHÁCH HÀNG / HỌC VIÊN):
- Họ và tên: ${data.clientName}
- Số điện thoại: ${data.phone}
- Giới tính: ${data.gender || 'Nam/Nữ'}
- Ngày sinh: ${data.dob || 'Chưa cập nhật'}
- Mục tiêu tập luyện: ${data.goals || 'Cải thiện thể lực & vóc dáng'}

NỘI DUNG HỢP ĐỒNG:
- Gói tập đăng ký: ${data.packageName} (${data.trainingType === 'ca_nhom' ? 'Ca nhóm' : 'Huấn luyện 1 kèm 1'})
- Tổng số buổi: ${data.totalSessions} buổi
- Tổng học phí: ${formattedAmount}
- Hình thức thanh toán: ${data.paymentMethod}
- Thời hạn hợp đồng: Từ ${data.startDate} đến ${data.endDate}
- Lịch tập cố định: ${scheduleDaysStr} | Khung giờ: ${data.preferredTime || 'Linh hoạt'}

ĐẠI DIỆN BÊN A                               ĐẠI DIỆN BÊN B
(Ký và ghi rõ họ tên)                       (Ký và ghi rõ họ tên)
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      
      {/* PRINT CSS STYLING FOR PAPER PRINTER / PDF EXPORT */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-contract-document, #printable-contract-document * {
            visibility: visible !important;
          }
          #printable-contract-document {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: black !important;
            font-size: 13px !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Top Control Bar (Hidden in Print) */}
        <div className="no-print bg-slate-900 text-white p-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/80 flex items-center justify-center text-white">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                HỢP ĐỒNG PT ONLINE & MẪU IN CHUẨN
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  Sẵn Sàng In A4
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Tự động điền dữ liệu học viên <span className="text-indigo-300 font-bold">{data.clientName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditingPartyA(!isEditingPartyA)}
              className="px-3.5 py-2 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200 border border-indigo-700/60 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
              Sửa Thông Tin Bên A
              {isEditingPartyA ? <ChevronUp className="w-3.5 h-3.5 ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={handleCopyText}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Đã Chép Văn Bản' : 'Sao Chép Văn Bản'}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              In Hợp Đồng / Xuất PDF
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Editable Party A Configuration Panel (Hidden in Print) */}
        {isEditingPartyA && (
          <div className="no-print bg-indigo-950 text-indigo-100 p-4 border-b border-indigo-800/80 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <h4 className="font-extrabold text-xs uppercase tracking-wide text-white">
                  Cấu Hình Thông Tin Bên A (Đơn Vị Cung Cấp Dịch Vụ Gym/PT)
                </h4>
              </div>
              <span className="text-[11px] text-indigo-300 italic">
                * Khi bấm "Lưu Làm Mặc Định", thông tin này sẽ áp dụng cho tất cả hợp đồng in sau này.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-indigo-300 mb-1">
                  1. Tên Đơn Vị / Phòng Gym (Bên A)
                </label>
                <input
                  type="text"
                  value={centerName}
                  onChange={(e) => setCenterName(e.target.value)}
                  placeholder="VD: NB PRIVATE GYM & PERSONAL TRAINING"
                  className="w-full bg-indigo-900/90 text-white border border-indigo-700/80 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-indigo-300 mb-1">
                  2. Đại Diện Ký Tên / HLV Trưởng
                </label>
                <input
                  type="text"
                  value={representative}
                  onChange={(e) => setRepresentative(e.target.value)}
                  placeholder="VD: Nguyễn Bỉnh (HLV Trưởng)"
                  className="w-full bg-indigo-900/90 text-white border border-indigo-700/80 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-indigo-300 mb-1">
                  3. Số Điện Thoại / Hotline Đơn Vị
                </label>
                <input
                  type="text"
                  value={centerHotline}
                  onChange={(e) => setCenterHotline(e.target.value)}
                  placeholder="VD: 0901 234 567"
                  className="w-full bg-indigo-900/90 text-white border border-indigo-700/80 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-indigo-300 mb-1">
                  4. Địa Chỉ Trụ Sở / Phòng Tập
                </label>
                <input
                  type="text"
                  value={centerAddress}
                  onChange={(e) => setCenterAddress(e.target.value)}
                  placeholder="VD: Số 188 Nguyễn Văn Cừ, Quận 5, TP. Hồ Chí Minh"
                  className="w-full bg-indigo-900/90 text-white border border-indigo-700/80 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium"
                />
              </div>
            </div>

            <div className="mt-3.5 flex items-center justify-end gap-2 pt-2 border-t border-indigo-900">
              <button
                type="button"
                onClick={() => setIsEditingPartyA(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-indigo-300 hover:bg-indigo-900 transition-colors cursor-pointer"
              >
                Hủy Chỉnh Sửa
              </button>
              <button
                type="button"
                onClick={handleSavePartyA}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-5 py-1.5 rounded-lg text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                Lưu Làm Mặc Định Cho Mọi Hợp Đồng Sau
              </button>
            </div>
          </div>
        )}

        {/* Success Toast Banner */}
        {savePartyASuccess && (
          <div className="no-print bg-emerald-50 text-emerald-800 p-2.5 px-4 text-xs font-bold flex items-center justify-between border-b border-emerald-200">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              Đã lưu thành công thông tin Bên A! Mọi hợp đồng in tiếp theo sẽ tự động áp dụng thông tin mới này.
            </span>
          </div>
        )}

        {/* Contract Preview & Print Content Area */}
        <div className="p-4 sm:p-8 overflow-y-auto bg-slate-100 flex-1 flex justify-center">
          
          <div 
            id="printable-contract-document"
            className="bg-white text-slate-900 w-full max-w-[800px] p-6 sm:p-10 rounded-2xl shadow-lg border border-slate-200 font-sans text-xs leading-relaxed space-y-6"
          >
            {/* Header / Quốc hiệu & Tiêu ngữ */}
            <div className="text-center space-y-1 pb-4 border-b border-slate-300">
              <h4 className="font-black text-xs uppercase tracking-widest text-slate-800">
                CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
              </h4>
              <p className="font-extrabold text-xs text-slate-700 underline decoration-slate-400 underline-offset-4">
                Độc lập - Tự do - Hạnh phúc
              </p>
              <div className="pt-4">
                <h2 className="font-black text-lg sm:text-xl text-slate-900 tracking-wide uppercase">
                  HỢP ĐỒNG DỊCH VỤ HUẤN LUYỆN CÁ NHÂN
                </h2>
                <p className="text-[11px] font-bold text-slate-500 italic mt-0.5">
                  (PERSONAL TRAINING SERVICE AGREEMENT) • Số: HĐPT-{data.phone ? data.phone.slice(-4) : '001'}
                </p>
              </div>
            </div>

            {/* General Info Clause */}
            <p className="italic text-slate-600 text-center text-[11px]">
              Hôm nay, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}, tại {centerName}, chúng tôi gồm có:
            </p>

            {/* Party A (Gym Center / Freelance PT) */}
            <div className="space-y-2 p-3.5 bg-slate-50 border border-slate-200 rounded-xl relative group">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <h3 className="font-extrabold text-xs text-indigo-950 uppercase flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo-600 no-print" />
                  BÊN A: BÊN CUNG CẤP DỊCH VỤ (HLV CÁ NHÂN / FREELANCER PT)
                </h3>
                {!isEditingPartyA && (
                  <button
                    type="button"
                    onClick={() => setIsEditingPartyA(true)}
                    className="no-print text-[11px] font-extrabold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-0.5 rounded-full border border-indigo-200 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    Chỉnh sửa Bên A
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-slate-800">
                <p><span className="font-bold">Tên đơn vị:</span> {centerName}</p>
                <p><span className="font-bold">Đại diện:</span> {representative}</p>
                <p><span className="font-bold">Hotline:</span> {centerHotline}</p>
                <p className="sm:col-span-2"><span className="font-bold">Địa chỉ:</span> {centerAddress}</p>
              </div>
            </div>

            {/* Party B (Client) */}
            <div className="space-y-2 p-3.5 bg-indigo-50/50 border border-indigo-150 rounded-xl">
              <h3 className="font-extrabold text-xs text-indigo-950 uppercase flex items-center gap-1.5 border-b border-indigo-200 pb-1.5">
                <User className="w-4 h-4 text-indigo-600 no-print" />
                BÊN B: KHÁCH HÀNG / HỌC VIÊN DÙNG DỊCH VỤ
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-slate-800">
                <p><span className="font-bold">Họ và tên:</span> <span className="font-black text-indigo-900 text-sm">{data.clientName || '................................'}</span></p>
                <p><span className="font-bold">Số điện thoại:</span> {data.phone || '................................'}</p>
                <p><span className="font-bold">Giới tính:</span> {data.gender || 'Nam'}</p>
                <p><span className="font-bold">Ngày sinh:</span> {data.dob || 'Chưa cập nhật'}</p>
                <p className="sm:col-span-2"><span className="font-bold">Mục tiêu tập luyện:</span> {data.goals || 'Tăng cơ, giảm mỡ, cải thiện thể lực và sức khỏe tổng thể'}</p>
                {data.healthNotes && (
                  <p className="sm:col-span-2 text-rose-700 font-medium">
                    <span className="font-bold">Ghi chú sức khỏe:</span> {data.healthNotes}
                  </p>
                )}
              </div>
            </div>

            {/* Article 1: Package & Fees */}
            <div className="space-y-2">
              <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wide border-l-4 border-indigo-600 pl-2.5">
                ĐIỀU 1: GÓI TẬP & CHI PHÍ DỊCH VỤ
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-[11px]">
                  <tbody>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-700 w-1/3 border-r border-slate-200">Gói Dịch Vụ Đăng Ký:</td>
                      <td className="p-2.5 font-black text-indigo-900">{data.packageName} ({data.trainingType === 'ca_nhom' ? 'Ca nhóm' : 'Kèm 1-1 Cá Nhân'})</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="p-2.5 font-bold text-slate-700 border-r border-slate-200">Số Buổi Đăng Ký:</td>
                      <td className="p-2.5 font-extrabold">{data.totalSessions} buổi tập chính thức với HLV</td>
                    </tr>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-700 border-r border-slate-200">Tổng Chi Phí Hợp Đồng:</td>
                      <td className="p-2.5 font-black text-emerald-700 text-sm">{formattedAmount}</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="p-2.5 font-bold text-slate-700 border-r border-slate-200">Hình Thức Thanh Toán:</td>
                      <td className="p-2.5 font-bold text-slate-800">{data.paymentMethod}</td>
                    </tr>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-700 border-r border-slate-200">Thời Gian Hiệu Lực HĐ:</td>
                      <td className="p-2.5 font-extrabold">Từ ngày <span className="underline">{data.startDate}</span> đến hết ngày <span className="underline">{data.endDate}</span></td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-700 border-r border-slate-200">Lịch Tập Dự Kiến:</td>
                      <td className="p-2.5 font-bold">{scheduleDaysStr} | Khung giờ: {data.preferredTime || 'Linh hoạt thỏa thuận'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Article 2: Rights & Obligations of Party B */}
            <div className="space-y-1.5">
              <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wide border-l-4 border-indigo-600 pl-2.5">
                ĐIỀU 2: QUYỀN VÀ TRÁCH NHIỆM CỦA BÊN B (KHÁCH HÀNG)
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-slate-700 text-[11px] leading-relaxed">
                <li>Đến tập đúng giờ theo khung giờ đã thống nhất với HLV.</li>
                <li><strong>Chính sách hoãn / báo nghỉ buổi tập:</strong> Khi có việc bận đột xuất, Bên B có trách nhiệm thông báo cho HLV trước tối thiểu <strong>02 - 04 tiếng</strong>. Nếu nghỉ không báo trước, buổi tập đó sẽ tính là 01 lượt sử dụng.</li>
                <li>Khai báo trung thực về tình trạng sức khỏe, tiền sử bệnh lý và thực hiện đúng các bài tập, hướng dẫn an toàn từ HLV.</li>
                <li>Mặc trang phục thể thao phù hợp, giữ gìn vệ sinh chung và tôn trọng nội quy phòng tập.</li>
              </ul>
            </div>

            {/* Article 3: Rights & Obligations of Party A (Freelance PT) */}
            <div className="space-y-1.5">
              <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wide border-l-4 border-indigo-600 pl-2.5">
                ĐIỀU 3: QUYỀN VÀ TRÁCH NHIỆM CỦA BÊN A (HLV FREELANCER)
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-slate-700 text-[11px] leading-relaxed">
                <li><strong>Trực tiếp huấn luyện & Giáo án:</strong> Trực tiếp xây dựng chương trình tập luyện cá nhân hóa, tư vấn định hướng dinh dưỡng và trực tiếp hướng dẫn Bên B trong từng buổi tập.</li>
                <li><strong>Theo dõi & Tối ưu kết quả:</strong> Đo lường các chỉ số cơ thể định kỳ (2 - 4 tuần/lần) để đánh giá tiến độ và điều chỉnh giáo án phù hợp với thể trạng thực tế.</li>
                <li><strong>Linh hoạt địa điểm & Lịch trình:</strong> Hỗ trợ thỏa thuận địa điểm tập luyện (phòng gym đối tác, private studio, hoặc tại nhà) và sắp xếp khung giờ tập linh hoạt cho Bên B.</li>
                <li><strong>Đồng hành & Bảo mật:</strong> Tích cực đồng hành, đôn đốc Bên B đạt mục tiêu; cam kết bảo mật thông tin cá nhân và hình ảnh tập luyện của Bên B trừ khi được cho phép.</li>
              </ul>
            </div>

            {/* Article 4: Terms & Conditions (Freelance Policy) */}
            <div className="space-y-1.5">
              <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wide border-l-4 border-indigo-600 pl-2.5">
                ĐIỀU 4: ĐIỀU KHỎAN CHUNG & CHÍNH SÁCH DỊCH VỤ FREELANCE
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-slate-700 text-[11px] leading-relaxed">
                <li><strong>Hiệu lực & Học phí:</strong> Hợp đồng có hiệu lực kể từ ngày ký và Bên B hoàn tất thanh toán. Học phí không hoàn lại sau khi hợp đồng đã kích hoạt buổi tập đầu tiên.</li>
                <li><strong>Chính sách bảo lưu & Chuyển nhượng:</strong> Bên B được bảo lưu thời hạn gói tập (tối đa 30 - 60 ngày) khi có lý do chính đáng (ốm đau, tác nghiệp, du lịch...). Được quyền chuyển nhượng số buổi chưa tập cho người thân/bạn bè sau khi thống nhất với HLV.</li>
                <li><strong>Quy định địa điểm tập:</strong> Bên A đóng vai trò là HLV tự do hướng dẫn chuyên môn. Bên B có trách nhiệm tuân thủ các quy định và phí vào cổng (nếu có) tại địa điểm phòng tập lựa chọn.</li>
              </ul>
            </div>

            {/* Custom Notes Section */}
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
              <p className="font-extrabold text-[11px] text-amber-900">THỎA THUẬN BỔ SUNG / GHI CHÚ ĐẶC BIỆT:</p>
              <textarea
                rows={2}
                value={editableNotes}
                onChange={(e) => setEditableNotes(e.target.value)}
                placeholder="Gõ điều khoản bổ sung hoặc thỏa thuận riêng tại đây (nếu có)..."
                className="w-full bg-white text-slate-900 border border-amber-300 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
              />
            </div>

            {/* Signatures */}
            <div className="pt-6 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="space-y-16">
                <div>
                  <p className="font-black text-slate-900 uppercase">ĐẠI DIỆN BÊN A (PHÒNG GYM / PT)</p>
                  <p className="text-[10px] text-slate-500 italic">(Ký, đóng dấu và ghi rõ họ tên)</p>
                </div>
                <div className="pt-4">
                  <p className="font-bold text-slate-900">{representative}</p>
                  <p className="text-[10px] text-slate-500">{centerName}</p>
                </div>
              </div>

              <div className="space-y-16">
                <div>
                  <p className="font-black text-slate-900 uppercase">ĐẠI DIỆN BÊN B (KHÁCH HÀNG)</p>
                  <p className="text-[10px] text-slate-500 italic">(Ký và ghi rõ họ tên)</p>
                </div>
                <div className="pt-4">
                  <p className="font-bold text-slate-900">{data.clientName || '................................'}</p>
                  <p className="text-[10px] text-slate-500">Khách hàng / Học viên</p>
                </div>
              </div>
            </div>

            <div className="pt-8 text-center border-t border-slate-200">
              <p className="text-[10px] text-slate-400 font-medium italic">
                Hợp đồng dịch vụ PT điện tử được tạo bởi Hệ thống Quản lý {centerName || 'Phòng Gym & HLV'}.
              </p>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

