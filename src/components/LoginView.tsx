import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  User, 
  ShieldCheck, 
  KeyRound, 
  AlertCircle, 
  Sparkles, 
  LogIn, 
  Eye, 
  EyeOff, 
  Phone, 
  Megaphone, 
  Edit3, 
  X, 
  CheckCircle2, 
  Save, 
  ShieldAlert 
} from 'lucide-react';
import { NbGymLogo } from './NbGymLogo';
import { useTenant } from '../context/TenantContext';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

const DEFAULT_RELEASE_NOTE = `📢 Cập nhật 02/10/2026: Tối ưu đồng bộ realtime đa thiết bị, chuẩn hóa phiếu xác nhận gia hạn Zalo và nâng cấp bộ lọc kỳ doanh thu theo tháng/năm!`;

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const { login } = useTenant();

  // 1. Initial State from localStorage for Tenant-safe persistence
  const [rememberMe, setRememberMe] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('nbfit_tenant_remember_me');
      return saved !== null ? saved === 'true' : true; // Default is checked (true)
    } catch {
      return true;
    }
  });

  const [username, setUsername] = useState<string>(() => {
    try {
      const isRemembered = localStorage.getItem('nbfit_tenant_remember_me');
      if (isRemembered !== 'false') {
        return localStorage.getItem('nbfit_tenant_saved_username') || '';
      }
      return '';
    } catch {
      return '';
    }
  });

  const [password, setPassword] = useState<string>(() => {
    try {
      const isRemembered = localStorage.getItem('nbfit_tenant_remember_me');
      if (isRemembered !== 'false') {
        return localStorage.getItem('nbfit_tenant_saved_password') || '';
      }
      return '';
    } catch {
      return '';
    }
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // System Release Note State
  const [releaseNote, setReleaseNote] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('system_release_note');
      return saved ? saved : DEFAULT_RELEASE_NOTE;
    } catch {
      return DEFAULT_RELEASE_NOTE;
    }
  });

  // Modal editing state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [editNoteContent, setEditNoteContent] = useState('');
  const [modalError, setModalError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Auto-fill on mount / page refresh if rememberMe was previously active
  // Also load persisted release note from Firestore if available
  useEffect(() => {
    try {
      const savedRemember = localStorage.getItem('nbfit_tenant_remember_me');
      if (savedRemember === null || savedRemember === 'true') {
        const savedUser = localStorage.getItem('nbfit_tenant_saved_username');
        const savedPass = localStorage.getItem('nbfit_tenant_saved_password');
        if (savedUser) setUsername(savedUser);
        if (savedPass) setPassword(savedPass);
        setRememberMe(true);
      }
    } catch (e) {
      console.warn("Lỗi kiểm tra thông tin ghi nhớ đăng nhập:", e);
    }

    // Try loading release note from Firestore
    const syncRemoteReleaseNote = async () => {
      try {
        if (db) {
          const docSnap = await getDoc(doc(db, 'registered_emails', 'system_release_note')).catch(() => null);
          if (docSnap && docSnap.exists() && docSnap.data()?.content) {
            setReleaseNote(docSnap.data().content);
            localStorage.setItem('system_release_note', docSnap.data().content);
          }
        }
      } catch (err) {
        // Fallback to localStorage without throwing
      }
    };
    syncRemoteReleaseNote();
  }, []);

  // Handle toggling rememberMe checkbox
  const handleRememberMeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setRememberMe(isChecked);
    if (!isChecked) {
      try {
        localStorage.removeItem('nbfit_tenant_saved_username');
        localStorage.removeItem('nbfit_tenant_saved_password');
        localStorage.removeItem('nbfit_tenant_remember_me');
      } catch (err) {
        console.warn("Lỗi dọn sạch thông tin ghi nhớ:", err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await login(username, password);
      if (res.success) {
        try {
          if (rememberMe) {
            localStorage.setItem('nbfit_tenant_saved_username', username.trim());
            localStorage.setItem('nbfit_tenant_saved_password', password);
            localStorage.setItem('nbfit_tenant_remember_me', 'true');
          } else {
            localStorage.removeItem('nbfit_tenant_saved_username');
            localStorage.removeItem('nbfit_tenant_saved_password');
            localStorage.removeItem('nbfit_tenant_remember_me');
          }
        } catch (storageErr) {
          console.warn("Lỗi lưu trữ thông tin đăng nhập:", storageErr);
        }

        onLoginSuccess();
      } else {
        setError(res.message || 'Tài khoản hoặc mật khẩu không chính xác!');
      }
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi, vui lòng thử lại!');
    } finally {
      setIsLoading(false);
    }
  };

  // Open Edit Release Note Modal
  const handleOpenEditModal = () => {
    setEditNoteContent(releaseNote);
    setAdminPasswordInput('');
    setModalError('');
    setIsEditModalOpen(true);
  };

  // Close Edit Release Note Modal
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setAdminPasswordInput('');
    setModalError('');
  };

  // Save updated release note
  const handleSaveReleaseNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    // Master Admin Password Validation: ONLY '966966966' is valid
    const cleanPass = adminPasswordInput.trim();
    if (cleanPass !== '966966966') {
      setModalError('Mật khẩu Master Admin không chính xác. Vui lòng kiểm tra lại!');
      return;
    }

    if (!editNoteContent.trim()) {
      setModalError('Nội dung bản tin cập nhật không được để trống!');
      return;
    }

    setIsSavingNote(true);
    const updatedText = editNoteContent.trim();

    try {
      // 1. Save to localStorage
      localStorage.setItem('system_release_note', updatedText);
      setReleaseNote(updatedText);

      // 2. Attempt sync to Firestore
      if (db) {
        await setDoc(doc(db, 'registered_emails', 'system_release_note'), {
          content: updatedText,
          updatedAt: new Date().toISOString()
        }, { merge: true }).catch((err) => {
          console.warn("Firestore sync optional warning:", err);
        });
      }

      // 3. Show success toast and close modal
      setIsEditModalOpen(false);
      setToastMessage('Đã cập nhật bản tin hệ thống thành công!');
      setTimeout(() => setToastMessage(''), 4000);
    } catch (err: any) {
      setModalError('Lỗi khi lưu thông tin: ' + (err.message || 'Vui lòng thử lại'));
    } finally {
      setIsSavingNote(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-rose-500 selection:text-white">
      {/* Background Decorative Blobs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-10 right-1/3 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Floating Success Toast */}
      {toastMessage && (
        <div className="fixed top-5 z-50 animate-bounce flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-500/30 border border-emerald-400">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-slate-800/90 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-8 shadow-2xl relative z-10">
        
        {/* Top Header Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-5 relative group">
            {/* Ambient Halo Glow */}
            <div className="absolute -inset-3 bg-gradient-to-r from-red-600/30 via-orange-500/30 to-amber-400/30 rounded-full blur-xl opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 pointer-events-none" />
            <NbGymLogo 
              size="xl" 
              className="relative z-10 drop-shadow-[0_12px_24px_rgba(255,69,0,0.45)] group-hover:drop-shadow-[0_18px_32px_rgba(255,100,0,0.65)] transform transition-all duration-300 group-hover:scale-105 group-hover:-translate-y-1 cursor-pointer" 
            />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Đăng nhập quản lý</h1>
          <p className="text-xs text-slate-400 mt-1">
            Vui lòng nhập tài khoản Admin để truy cập trang quản trị
          </p>
          <div className="mt-2 inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/80 border border-slate-700/60 text-xs text-slate-300">
            <Phone className="w-3.5 h-3.5 text-rose-400" />
            <span>Liên hệ Zalo / Hotline:</span>
            <a 
              href="https://zalo.me/0935244966" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="font-bold text-rose-400 hover:text-rose-300 transition underline underline-offset-2"
            >
              0935.244.966
            </a>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 animate-shake">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs font-bold text-rose-300 leading-relaxed">
              {error}
            </div>
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} method="post" action="#" className="space-y-4">
          {/* ID Username Input */}
          <div>
            <label htmlFor="username" className="block text-xs font-bold text-slate-300 mb-1.5">
              Tài khoản (ID):
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                id="username"
                name="username"
                autoComplete="username"
                type="text"
                required
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Nhập ID tài khoản quản lý"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="w-full pl-10 pr-4 py-3 bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all"
                autoFocus
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-xs font-bold text-slate-300 mb-1.5">
              Mật khẩu (Password):
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                id="password"
                name="password"
                autoComplete="current-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Nhập mật khẩu truy cập"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="w-full pl-10 pr-10 py-3 bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center justify-between pt-1 pb-1">
            <label 
              htmlFor="rememberMe" 
              className="inline-flex items-center gap-2.5 cursor-pointer select-none group"
            >
              <input
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                checked={rememberMe}
                onChange={handleRememberMeChange}
                className="w-4 h-4 rounded border-slate-600 bg-slate-900/90 text-rose-500 focus:ring-rose-500/40 focus:ring-offset-0 focus:ring-2 cursor-pointer transition-all accent-rose-500"
              />
              <span className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors">
                Ghi nhớ đăng nhập trên thiết bị này
              </span>
            </label>
            {rememberMe && (
              <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 hidden sm:inline-block">
                Tự động điền
              </span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-rose-500 via-pink-600 to-purple-600 text-white font-extrabold text-sm shadow-lg shadow-rose-600/30 hover:shadow-rose-600/50 hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Đăng nhập hệ thống
              </>
            )}
          </button>
        </form>

        {/* KHỐI THÔNG BÁO CẬP NHẬT HỆ THỐNG (SYSTEM RELEASE NOTE / CHANGELOG BANNER) */}
        <div className="mt-5 rounded-2xl border border-indigo-500/30 bg-indigo-950/40 p-3.5 shadow-sm backdrop-blur-sm hover:border-indigo-500/50 transition-all">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-indigo-400 animate-pulse shrink-0" />
              <span className="text-[11px] font-extrabold tracking-wider text-indigo-300 uppercase">
                BẢN TIN CẬP NHẬT HỆ THỐNG
              </span>
            </div>
            <button
              type="button"
              onClick={handleOpenEditModal}
              title="Chỉnh sửa bản tin (Dành cho Master Admin)"
              className="p-1 rounded-lg text-indigo-400 hover:text-indigo-200 hover:bg-indigo-900/60 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-xs text-indigo-100/90 leading-relaxed font-medium whitespace-pre-line">
            {releaseNote}
          </div>
        </div>

        {/* Info Box / Security Note */}
        <div className="mt-6 pt-5 border-t border-slate-700/60 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-1.5">
          <div className="flex items-center gap-1.5 text-slate-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Hệ thống bảo mật đa thuê bao (Multi-tenant)</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Phiên bản v2.6.0 - Cập nhật 02/10/2026</span>
          </div>
        </div>
      </div>

      {/* MODAL CHỈNH SỬA BẢN TIN HỆ THỐNG (MASTER ADMIN ONLY) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl relative text-left">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Chỉnh sửa Bản Tin Hệ Thống</h3>
                  <p className="text-xs text-slate-400">Dành riêng cho Master Admin quản trị</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseEditModal}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error in Modal */}
            {modalError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300 font-semibold">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveReleaseNote} className="mt-4 space-y-4">
              {/* Field 1: Master Admin Password */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Mật khẩu Master Admin xác thực: <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showAdminPass ? "text" : "password"}
                    required
                    value={adminPasswordInput}
                    onChange={(e) => {
                      setAdminPasswordInput(e.target.value);
                      if (modalError) setModalError('');
                    }}
                    placeholder="Nhập mật khẩu Master Admin (966966966)..."
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-950/80 border border-slate-700 text-white placeholder-slate-500 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPass(!showAdminPass)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                  >
                    {showAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Field 2: Release Note Content */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Nội dung thông báo cập nhật hệ thống: <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={editNoteContent}
                  onChange={(e) => setEditNoteContent(e.target.value)}
                  placeholder="Nhập nội dung cập nhật hiển thị tại màn hình đăng nhập..."
                  className="w-full p-3 bg-slate-950/80 border border-slate-700 text-white placeholder-slate-500 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-none"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Nội dung sẽ được cập nhật tức thì trên màn hình đăng nhập của mọi người dùng.
                </p>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold transition-all"
                >
                  Đóng / Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingNote}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSavingNote ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Lưu cập nhật
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

