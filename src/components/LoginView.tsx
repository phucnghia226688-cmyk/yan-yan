import React, { useState } from 'react';
import { Lock, User, ShieldCheck, KeyRound, AlertCircle, Sparkles, LogIn, Eye, EyeOff, Phone } from 'lucide-react';
import { NbGymLogo } from './NbGymLogo';
import { useTenant } from '../context/TenantContext';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const { login } = useTenant();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await login(username, password);
      if (res.success) {
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
          <div className="flex justify-center mb-4">
            <NbGymLogo size="lg" className="bg-white p-2 rounded-2xl shadow-lg border border-slate-700/50" />
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
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* ID Username Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Tài khoản (ID):
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
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
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Mật khẩu (Password):
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
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
          <span>Hệ thống bảo mật được nâng cấp</span>
        </div>
      </div>
    </div>
  );
};
