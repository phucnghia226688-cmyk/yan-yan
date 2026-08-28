import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, AlertCircle, X, Check } from 'lucide-react';
import { useTenant } from '../context/TenantContext';

interface ConfirmPasswordModalProps {
  isOpen: boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export const ConfirmPasswordModal: React.FC<ConfirmPasswordModalProps> = ({
  isOpen,
  title = 'Xác nhận mật khẩu quản lý',
  description = 'Vui lòng nhập mật khẩu quản lý để hoàn tất thao tác này.',
  confirmLabel = 'Xác nhận thực hiện',
  onClose,
  onConfirm
}) => {
  const { currentUser } = useTenant();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(null);
      setShowPassword(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validAdminPass = currentUser?.password;
    const enteredPass = password.trim();

    if (!enteredPass) {
      setError('Vui lòng nhập mật khẩu.');
      return;
    }

    const isMatch = enteredPass === validAdminPass || enteredPass === localStorage.getItem('nb_gym_admin_password');

    if (!isMatch) {
      setError('Mật khẩu không chính xác! Vui lòng kiểm tra lại.');
      return;
    }

    setError(null);
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-100 border border-rose-200 text-rose-600 rounded-2xl shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg leading-snug">{title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Mật khẩu quản trị (Admin Password):
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="Nhập mật khẩu..."
                autoFocus
                className={`w-full pl-3.5 pr-10 py-2.5 text-sm bg-slate-50 border rounded-2xl font-medium text-slate-900 focus:outline-none focus:bg-white transition-all ${
                  error ? 'border-rose-500 ring-2 ring-rose-100' : 'border-slate-200 focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <p className="text-xs font-bold text-rose-600 flex items-center gap-1 mt-2 animate-in fade-in">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
              </p>
            )}

            <p className="text-[11px] text-slate-400 mt-2 italic">

            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl transition-colors shadow-sm flex items-center gap-1.5 active:scale-95"
            >
              <Check className="w-4 h-4" /> {confirmLabel}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
