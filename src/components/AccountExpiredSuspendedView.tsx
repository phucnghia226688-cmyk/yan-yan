import { getTodayDateStr } from '../utils/dateUtils';
import React from 'react';
import { useTenant } from '../context/TenantContext';
import { 
  ShieldAlert, 
  Lock, 
  Clock, 
  Phone, 
  MessageCircle, 
  LogOut, 
  Building2, 
  Calendar, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';

export const AccountExpiredSuspendedView: React.FC = () => {
  const { currentUser, logout } = useTenant();

  const todayStr = getTodayDateStr();
  const isSuspended = currentUser?.status === 'suspended';
  const isExpired = currentUser?.expireDate ? currentUser.expireDate < todayStr : false;

  const adminPhone = '0935244966';
  const adminZaloUrl = 'https://zalo.me/0935244966';

  const formattedExpireDate = currentUser?.expireDate 
    ? currentUser.expireDate.split('-').reverse().join('/') 
    : 'Chưa xác định';

  return (
    <div className="min-h-screen w-full bg-slate-900 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Ambient Blur Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-lg w-full bg-slate-800/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl space-y-6">
        
        {/* Top Header & Icon */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mb-1 animate-pulse">
            {isSuspended ? (
              <Lock className="w-10 h-10" />
            ) : (
              <Clock className="w-10 h-10 text-amber-400" />
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {isSuspended ? 'Tài Khoản Đang Bị Tạm Khóa' : 'Tài Khoản Đã Hết Hạn Sử Dụng'}
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed font-medium">
            Tài khoản của bạn đã {isSuspended ? 'bị tạm khóa bởi Quản trị viên' : `hết hạn dịch vụ vào ngày ${formattedExpireDate}`}. Vui lòng liên hệ Admin để gia hạn và khôi phục quyền truy cập.
          </p>
        </div>

        {/* Tenant Account Details Box */}
        <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-700/60 space-y-3 text-xs sm:text-sm">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
            <span className="text-slate-400 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-400" />
              Tên phòng Gym / PT:
            </span>
            <span className="font-bold text-white text-right">{currentUser?.gymName || 'N/A'}</span>
          </div>

          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
            <span className="text-slate-400 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Tên đăng nhập:
            </span>
            <span className="font-mono font-bold text-indigo-300">@{currentUser?.username || 'N/A'}</span>
          </div>

          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
            <span className="text-slate-400 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-rose-400" />
              Hạn dùng hợp đồng:
            </span>
            <span className={`font-bold ${isExpired ? 'text-rose-400' : 'text-emerald-400'}`}>
              {formattedExpireDate}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-sky-400" />
              Trạng thái hệ thống:
            </span>
            <span className={`font-extrabold px-2.5 py-0.5 rounded-full text-xs ${
              isSuspended 
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}>
              {isSuspended ? '🔴 Bị tạm khóa' : '⚠️ Đã hết hạn'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {/* Zalo Contact Button */}
          <a
            href={adminZaloUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2.5 transition transform active:scale-98 text-sm cursor-pointer"
          >
            <MessageCircle className="w-5 h-5 fill-current" />
            <span>Liên hệ Zalo Admin để Gia Hạn (0935.244.966)</span>
            <ExternalLink className="w-4 h-4 opacity-80" />
          </a>

          {/* Direct Phone Call */}
          <a
            href={`tel:${adminPhone}`}
            className="w-full py-3 px-4 bg-slate-700/80 hover:bg-slate-700 text-slate-200 font-semibold rounded-2xl border border-slate-600 flex items-center justify-center gap-2 transition text-xs sm:text-sm cursor-pointer"
          >
            <Phone className="w-4 h-4 text-emerald-400" />
            <span>Gọi điện trực tiếp: {adminPhone}</span>
          </a>

          {/* Logout */}
          <button
            type="button"
            onClick={logout}
            className="w-full py-2.5 px-4 text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-2xl font-semibold transition text-xs flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất / Dùng tài khoản khác
          </button>
        </div>

        {/* Footer info */}
        <div className="text-center pt-2 text-[11px] text-slate-500 border-t border-slate-800">
          NBFit SaaS Management • Hỗ trợ kỹ thuật 24/7
        </div>

      </div>
    </div>
  );
};
