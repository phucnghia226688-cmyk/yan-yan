import React, { useState, useRef, useEffect } from 'react';
import { useGym } from '../context/GymContext';
import { useTenant } from '../context/TenantContext';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { UserSession } from '../types';


import { 
  Settings, 
  Download, 
  Upload, 
  Database, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  FileSpreadsheet, 
  FileCode, 
  ShieldCheck, 
  X,
  HardDrive,
  CloudCheck,
  Lock,
  KeyRound,
  User,
  Eye,
  EyeOff,
  Save,
  Smartphone,
  Monitor,
  LogOut,
  History,
  Laptop,
  Copy,
  Check
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { 
    isCloudSynced, 
    exportBackupJson, 
    exportClientsCsv, 
    importBackupJson, 
    syncAllToCloud,
    resetData,
    clearAllData,
    clients,
    checkIns,
    payments,
    expenses
  } = useGym();

  const { currentUser, isMasterAdmin, activeTenantId, updateTenant, logout } = useTenant();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [isImporting, setIsImporting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Change Password State
  const [adminUsername, setAdminUsername] = useState<string>(() => currentUser?.username || localStorage.getItem('nb_gym_admin_username') || '');
  const [showAdminUsername, setShowAdminUsername] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [pwdStatus, setPwdStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  // Cloud Shadow Backup states
  const [cloudBackupTime, setCloudBackupTime] = useState<string | null>(null);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [restorePassword, setRestorePassword] = useState('');
  const [restoreError, setRestoreError] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);

  const [userSessions, setUserSessions] = useState<UserSession[]>([]);

  useEffect(() => {
    if (isOpen && currentUser && db) {
      const tId = activeTenantId || currentUser?.tenantId || 'default';
      getDoc(doc(db, 'shadow_backups', tId))
        .then(docSnap => {
          if (!docSnap.exists()) {
            return getDoc(doc(db, 'cloud_backups', tId));
          }
          return docSnap;
        })
        .then(docSnap => {
          if (docSnap && docSnap.exists()) {
            setCloudBackupTime(docSnap.data().timestamp);
          }
        })
        .catch(err => console.warn("Error fetching cloud backup time", err));
    }
  }, [isOpen, currentUser, activeTenantId, db]);

  useEffect(() => {
    if (!isOpen || !currentUser || !db) return;
    const q = isMasterAdmin ? query(collection(db, 'user_sessions'), where('user_id', '==', currentUser.id), where('is_active', '==', true)) : query(collection(db, 'user_sessions'), where('tenantId', '==', currentUser.tenantId), where('user_id', '==', currentUser.id), where('is_active', '==', true));
    const unsub = onSnapshot(q, (snap) => {
      setUserSessions(snap.docs.map(d => d.data() as UserSession));
    }, (err) => {
      console.warn("User sessions snapshot error:", err);
    });
    return () => unsub();
  }, [isOpen, currentUser, isMasterAdmin, db]);

  if (!isOpen) return null;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdStatus({ type: null, message: '' });

    if (!currentPassword) {
      setPwdStatus({ type: 'error', message: 'Vui lòng nhập mật khẩu hiện tại.' });
      return;
    }

    const enteredCurrentPass = currentPassword.trim();
    const expectedUserPass = currentUser?.password;
    const fallbackLocalPass = localStorage.getItem('nb_gym_admin_password');
    const isCurrentValid = 
      (expectedUserPass && enteredCurrentPass === expectedUserPass) ||
      (fallbackLocalPass && enteredCurrentPass === fallbackLocalPass);

    if (!isCurrentValid) {
      setPwdStatus({ type: 'error', message: 'Mật khẩu hiện tại không chính xác! Vui lòng kiểm tra lại.' });
      return;
    }

    if (!newPassword || newPassword.length < 4) {
      setPwdStatus({ type: 'error', message: 'Mật khẩu mới phải có ít nhất 4 ký tự.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdStatus({ type: 'error', message: 'Xác nhận mật khẩu mới không trùng khớp!' });
      return;
    }

    // Save new password to Tenant system (Master Admin & Child accounts)
    if (currentUser) {
      if (auth.currentUser) {
        try {
          await updatePassword(auth.currentUser, newPassword.trim());
        } catch (e: any) {
          console.warn("Update firebase password failed, falling back to local update:", e);
        }
      }
      await updateTenant(currentUser.id, { password: newPassword.trim() });
    }

    if (isMasterAdmin && adminUsername.trim()) {
      localStorage.setItem('nb_gym_admin_username', adminUsername.trim());
    }
    localStorage.setItem('nb_gym_admin_password', newPassword.trim());

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPwdStatus({
      type: 'success',
      message: 'Thay đổi mật khẩu thành công! Mật khẩu mới có hiệu lực ngay lập tức và đã cập nhật hệ thống.'
    });
  };

  const handleForceSync = async () => {
    setIsSyncing(true);
    await syncAllToCloud();
    setIsSyncing(false);
    setImportStatus({
      type: 'success',
      message: 'Đã đẩy đồng bộ toàn bộ dữ liệu hiện tại lên Cloud Firebase thành công! Mọi thiết bị kết nối sẽ nhận được ngay.'
    });
  };


  const handleRevokeSession = async (sessionId: string) => {
    const isCurrent = sessionId === localStorage.getItem('nb_gym_session_id');
    if (isCurrent) {
      logout();
      onClose();
      return;
    }
    if (!db) return;
    try {
      await updateDoc(doc(db, 'user_sessions', sessionId), { is_active: false });
    } catch (e) {
      console.warn('Revoke session quota error:', e);
    }
  };

  const handleCloudRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !currentUser || currentUser.role !== 'admin' || !db) return;
    
    setRestoreError('');
    setIsRestoring(true);

    try {
      const credential = EmailAuthProvider.credential(currentUser.username + (currentUser.username.includes('@') ? '' : '@nbgym.com'), restorePassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      const tId = activeTenantId || currentUser.tenantId || 'default';
      let backupSnap = await getDoc(doc(db, 'shadow_backups', tId));
      if (!backupSnap.exists()) {
        backupSnap = await getDoc(doc(db, 'cloud_backups', tId));
      }

      if (backupSnap.exists() && backupSnap.data()?.data) {
        const snapData = backupSnap.data();
        
        // Strict Tenant Guard Verification
        if (snapData.tenantId && snapData.tenantId !== tId && tId !== 'master-admin') {
          throw new Error(`Dữ liệu bản sao lưu không khớp với tenantId (${tId}) của phòng tập hiện tại!`);
        }

        const parsed = JSON.parse(snapData.data);
        const result = importBackupJson(parsed, tId);
        
        setIsRestoreModalOpen(false);
        setRestorePassword('');
        setImportStatus({
          type: 'success',
          message: `Khôi phục Cloud Shadow thành công! Đã khôi phục an toàn ${result.clientsCount} hội viên cho phòng tập (${tId}).`
        });
        
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setRestoreError(`Không tìm thấy bản sao lưu Cloud Shadow nào phù hợp cho phòng tập (Tenant: ${tId}).`);
      }
    } catch (err: any) {
      console.error(err);
      setRestoreError(err.message || 'Mật khẩu không chính xác hoặc không thể tải dữ liệu từ Cloud Shadow.');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportStatus({ type: null, message: '' });

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        
        const result = importBackupJson(parsed);
        const details = [
          `${result.clientsCount} hội viên`,
          result.checkInsCount ? `${result.checkInsCount} điểm danh` : null,
          result.paymentsCount ? `${result.paymentsCount} thanh toán` : null,
          result.appointmentsCount ? `${result.appointmentsCount} lịch hẹn` : null,
          result.programsCount ? `${result.programsCount} giáo án` : null
        ].filter(Boolean).join(', ');

        setImportStatus({
          type: 'success',
          message: `Khôi phục dữ liệu thành công! Đã nạp ${details}.`
        });
      } catch (err: any) {
        setImportStatus({
          type: 'error',
          message: `Lỗi khi đọc file JSON: ${err.message || 'Cấu trúc file không đúng định dạng.'}`
        });
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.onerror = () => {
      setImportStatus({ type: 'error', message: 'Không thể đọc file đã chọn.' });
      setIsImporting(false);
    };

    reader.readAsText(file);
  };

  const handleClearAll = async () => {
    if (!isMasterAdmin) {
      alert('⛔ QUYỀN TRUY CẬP BỊ HẠN CHẾ:\n\nTài khoản con / tài khoản thuê không có quyền dọn sạch dữ liệu hệ thống. Vui lòng liên hệ Admin Quản lý (Master Admin) nếu cần hỗ trợ.');
      return;
    }

    const confirmMessage = 
      '🚨 CẢNH BÁO QUAN TRỌNG VỀ DỮ LIỆU 🚨\n\n' +
      'Bạn đang yêu cầu XÓA TOÀN BỘ dữ liệu (Hội viên, Điểm danh, Doanh thu, Chi phí, Lịch hẹn) trên CẢ THIẾT BỊ NÀY LẪN CLOUD FIREBASE.\n\n' +
      '• Mọi thiết bị khác (iPhone, Android, Máy tính khác) cũng sẽ cập nhật trạng thái trống.\n' +
      '• Hành động này KHÔNG THỂ HOÀN TÁC nếu không có file sao lưu JSON.\n\n' +
      'Bạn có thực sự muốn tiếp tục?';

    if (window.confirm(confirmMessage)) {
      // Step 2: Double check with typed confirmation or backup offer
      const secondConfirm = window.confirm(
        '⚠️ TỰ ĐỘNG SAO LƯU TRƯỚC KHI XÓA:\n\n' +
        'Hệ thống khuyên bạn nên xuất 1 bản sao lưu JSON để đề phòng.\n' +
        'Nhấn OK để hệ thống TỰ ĐỘNG TẢI FILE SAO LƯU JSON VỀ MÁY trước khi xóa.\n' +
        'Nhấn CANCEL nếu bạn muốn tiến hành xóa ngay lập tức.'
      );

      if (secondConfirm) {
        exportBackupJson();
      }

      await clearAllData();
      setImportStatus({
        type: 'success',
        message: 'Đã xóa sạch dữ liệu hệ thống thành công! Hệ thống hiện đang ở trạng thái trống an toàn, sẵn sàng cho bạn nhập dữ liệu thực tế.'
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between relative overflow-hidden">
          <div className="flex items-center gap-3 z-10">
            <div className="w-11 h-11 rounded-2xl bg-pink-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                Cài đặt & sao lưu dữ liệu
              </h2>
              <p className="text-xs text-slate-400">
                Quản lý lưu trữ, xuất nhập dữ liệu tự động & đồng bộ Cloud
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors z-10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto">

          {/* Realtime Sync Status Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-emerald-900">
                  Tự động đồng bộ liên tục
                </h3>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                  {isCloudSynced ? 'Đã kết nối Cloud' : 'Đang đồng bộ...'}
                </span>
              </div>
              <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                Mọi thao tác điểm danh, tạo học viên, thu tiền hay ghi nhận chi phí đều được <b>tự động lưu ngay tức thì</b> lên hệ thống Cloud Firebase và bộ nhớ trình duyệt máy tính & điện thoại của bạn.
              </p>
              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-emerald-200/60 pt-2.5">
                <div className="flex items-center gap-3 text-[11px] font-semibold text-emerald-800">
                  <span>• Hội viên: {clients.length}</span>
                  <span>• Check-in: {checkIns.length}</span>
                  <span>• Thanh toán: {payments.length}</span>
                  <span>• Khoản chi: {expenses.length}</span>
                </div>
                <button
                  onClick={handleForceSync}
                  disabled={isSyncing}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Đang đồng bộ...' : 'Đẩy toàn bộ dữ liệu lên Cloud'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Multi-device Concurrent Access Card */}
          <div className="bg-indigo-50/80 border border-indigo-200/90 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wide flex items-center gap-2">
                    📱 Truy cập đa thiết bị cùng lúc (Multi-device access)
                  </h3>
                  <p className="text-[11px] text-indigo-800 font-medium mt-0.5">
                    Cho phép nhiều điện thoại, máy tính & máy tính bảng đăng nhập và sử dụng song song cùng thời điểm.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-indigo-150 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
              <div className="text-xs text-slate-700 space-y-1">
                <p className="font-bold text-indigo-950 flex items-center gap-1.5">
                  <Laptop className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Đồng bộ 2 chiều tức thì (Realtime WebSockets):</span>
                </p>
                <p className="text-[11px] text-slate-600 leading-snug">
                  PT hoặc Quản lý check-in trên điện thoại thì máy tính phòng gym sẽ tự nhảy cập nhật ngay lập tức không cần bấm F5.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 3000);
                }}
                className="w-full sm:w-auto px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-extrabold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Đã sao chép link!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép link mở trên thiết bị khác</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Section: Change Password */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-rose-600" />
                  Đổi mật khẩu tài khoản
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cập nhật mật khẩu truy cập hệ thống của bạn
                </p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Username / ID (Only visible for Master Admin) */}
                {isMasterAdmin && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tài khoản (ID) Admin:</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                      <input
                        type={showAdminUsername ? 'text' : 'password'}
                        required
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                        placeholder="Tên tài khoản admin"
                        className="w-full pl-9 pr-9 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminUsername(!showAdminUsername)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        title={showAdminUsername ? "Ẩn ID tài khoản" : "Hiện ID tài khoản"}
                      >
                        {showAdminUsername ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Current Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu hiện tại:</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type={showCurrentPwd ? 'text' : 'password'}
                      required
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value);
                        if (pwdStatus.type) setPwdStatus({ type: null, message: '' });
                      }}
                      placeholder="Nhập mật khẩu hiện tại"
                      className="w-full pl-9 pr-9 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      title={showCurrentPwd ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      {showCurrentPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu mới:</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type={showNewPwd ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (pwdStatus.type) setPwdStatus({ type: null, message: '' });
                      }}
                      placeholder="Nhập mật khẩu mới (min 4 ký tự)"
                      className="w-full pl-9 pr-9 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPwd(!showNewPwd)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      title={showNewPwd ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Xác nhận mật khẩu mới:</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type={showNewPwd ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (pwdStatus.type) setPwdStatus({ type: null, message: '' });
                      }}
                      placeholder="Nhập lại mật khẩu mới"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>
              </div>

              {/* Password Status Feedback */}
              {pwdStatus.type && (
                <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  pwdStatus.type === 'success'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}>
                  {pwdStatus.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{pwdStatus.message}</span>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Cập nhật mật khẩu</span>
                </button>
              </div>
            </form>
          </div>

          {/* Section Active Sessions */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  Quản lý thiết bị đăng nhập
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Danh sách các thiết bị đang đăng nhập tài khoản của bạn.
                </p>
              </div>
            </div>
            {userSessions.length === 0 ? (
              <div className="text-center py-4 bg-white border border-slate-200 rounded-xl">
                <p className="text-xs text-slate-500 font-medium">Chưa có dữ liệu thiết bị</p>
              </div>
            ) : (
              <div className="space-y-2">
                {userSessions.map((session) => {
                  const isCurrent = session.session_id === localStorage.getItem('nb_gym_session_id');
                  return (
                    <div key={session.session_id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 p-3 rounded-xl">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg shrink-0 ${isCurrent ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                          {isCurrent ? <Smartphone className="w-5 h-5 text-emerald-600" /> : <Monitor className="w-5 h-5 text-slate-500" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            {session.user_agent.slice(0, 40)}{session.user_agent.length > 40 ? '...' : ''}
                            {isCurrent && (
                              <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                Đang dùng
                              </span>
                            )}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[11px] text-slate-500 flex items-center gap-1">
                              <History className="w-3.5 h-3.5" />
                              {new Date(session.created_at).toLocaleString('vi-VN')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRevokeSession(session.session_id)}
                        className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                          isCurrent 
                            ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' 
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        {isCurrent ? 'Đăng xuất máy này' : 'Đăng xuất từ xa'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 1: Backup / Export */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Download className="w-4 h-4 text-[#FF4E00]" />
                  Sao lưu dữ liệu (xuất file)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tải bản sao lưu toàn bộ dữ liệu về máy tính/điện thoại cá nhân để cất giữ an toàn.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Export JSON button */}
              <button
                onClick={exportBackupJson}
                className="flex items-center justify-center gap-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold p-3.5 rounded-xl text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <FileCode className="w-4 h-4 text-emerald-400" />
                <span>Sao lưu dữ liệu (xuất file JSON)</span>
              </button>

              {/* Export Excel / CSV button */}
              <button
                onClick={exportClientsCsv}
                className="flex items-center justify-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-3.5 rounded-xl text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-white" />
                <span>Xuất danh sách hội viên (Excel/CSV)</span>
              </button>
            </div>
          </div>

          {/* Section 2: Restore / Import */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#4F46E5]" />
                Khôi phục dữ liệu (nhập từ file)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Chọn file sao lưu JSON đã tải về trước đó để khôi phục lại toàn bộ dữ liệu.
              </p>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
              {isMasterAdmin && (
                <button
                  onClick={() => setIsRestoreModalOpen(true)}
                  disabled={isRestoring || !cloudBackupTime}
                  className="w-full sm:w-auto flex-1 flex flex-col items-center justify-center gap-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 px-3.5 rounded-xl text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <div className="flex items-center gap-2">
                    <CloudCheck className="w-4 h-4" />
                    <span>Khôi phục từ Cloud (Shadow)</span>
                  </div>
                  <span className="text-[10px] font-medium opacity-90">
                    {cloudBackupTime ? `Bản lưu lúc: ${new Date(cloudBackupTime).toLocaleString('vi-VN')}` : 'Chưa có bản sao lưu nào'}
                  </span>
                </button>
              )}

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold p-3.5 rounded-xl text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span>{isImporting ? 'Đang xử lý khôi phục...' : 'Khôi phục dữ liệu (nhập file JSON)'}</span>
              </button>
            </div>

            {/* Status Feedback */}
            {importStatus.type && (
              <div className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2.5 ${
                importStatus.type === 'success'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}>
                {importStatus.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{importStatus.message}</span>
              </div>
            )}
          </div>

          {/* Section 3: Clean All Sample Data for Production */}
          {isMasterAdmin ? (
            <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-black text-rose-900 flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-rose-600" />
                  Dọn sạch dữ liệu mẫu (sẵn sàng vận hành thực tế)
                </h4>
                <p className="text-[11px] text-rose-700 mt-0.5">
                  Xóa toàn bộ học viên mẫu, lịch sử check-in, doanh thu & chi phí mẫu để bạn bắt đầu nhập dữ liệu thật của phòng Gym.
                </p>
              </div>
              <button
                onClick={handleClearAll}
                className="px-4 py-2.5 text-xs font-black bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-all shrink-0 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>🧹 Xóa sạch dữ liệu mẫu</span>
              </button>
            </div>
          ) : (
            <div className="bg-slate-100/90 border border-slate-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-500">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-200/80 flex items-center justify-center text-slate-500 shrink-0">
                  <Lock className="w-4 h-4 text-slate-600" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    Dọn sạch dữ liệu hệ thống
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                    Tính năng xóa dữ liệu đã bị khóa ở tài khoản con / tài khoản thuê để đảm bảo an toàn dữ liệu.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold px-3 py-1.5 bg-slate-200 text-slate-600 rounded-xl shrink-0 text-center">
                🔒 Chỉ dành cho Master Admin
              </span>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
