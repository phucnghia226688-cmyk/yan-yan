import React, { useState, useEffect } from 'react';
import { Lock, User, ShieldCheck, KeyRound, AlertCircle, Sparkles, LogIn, Eye, EyeOff, Phone, CheckSquare } from 'lucide-react';
import { NbGymLogo } from './NbGymLogo';
import { useTenant } from '../context/TenantContext';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

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

  // Auto-fill on mount / page refresh if rememberMe was previously active
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
  }, []);

  // Handle toggling rememberMe checkbox
  const handleRememberMeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setRememberMe(isChecked);
    if (!isChecked) {
      // Prompt requirement: If unchecked, immediately clean up saved keys from localStorage
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
        // Persist or clean up based on "Ghi nhớ" state
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

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-rose-500 selection:text-white">
      {/* Background Decorative Blobs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-10 right-1/3 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

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

        {/* Info Box / Security Note */}
        <div className="mt-8 pt-6 border-t border-slate-700/60 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Bản cập nhật 23/09/2029</span>
        </div>
      </div>
    </div>
  );
};
