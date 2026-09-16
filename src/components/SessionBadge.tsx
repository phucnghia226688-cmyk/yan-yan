import React from 'react';
import { Client } from '../types';
import { getClientContractStatus } from '../utils/dateUtils';

interface SessionBadgeProps {
  client?: Client;
  remainingSessions?: number;
  totalSessions?: number;
  clientType?: 'session' | 'monthly';
  endDate?: string;
  status?: string;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  compact?: boolean;
  className?: string;
}

export const SessionBadge: React.FC<SessionBadgeProps> = ({
  client,
  remainingSessions: propRemaining,
  totalSessions: propTotal,
  clientType: propClientType,
  endDate: propEndDate,
  status: propStatus,
  size = 'md',
  showDetails = false,
  compact = false,
  className = ''
}) => {
  const clientData = client || {
    status: propStatus as any,
    clientType: propClientType,
    remainingSessions: propRemaining,
    totalSessions: propTotal,
    endDate: propEndDate
  };

  const statusInfo = getClientContractStatus(clientData);
  const clientType = clientData.clientType || 'session';
  const remaining = clientData.remainingSessions ?? 0;
  const total = clientData.totalSessions ?? 0;
  const diffDays = statusInfo.diffDays;

  // Size styling classes
  const sizeClasses = compact
    ? 'text-[11px] px-2 py-0.5 font-bold tracking-tight'
    : {
        sm: 'text-[11px] px-2.5 py-0.5 font-bold tracking-tight',
        md: 'text-xs px-3 py-1 font-black tracking-tight',
        lg: 'text-sm px-4 py-1.5 font-black tracking-wide'
      }[size];

  if (statusInfo.status === 'closed') {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-slate-200 text-slate-800 border border-slate-400 shadow-2xs font-bold whitespace-nowrap ${sizeClasses} ${className}`}>
        🔒 {compact ? 'Đã đóng' : 'HĐ đã đóng'}
      </span>
    );
  }

  if (statusInfo.status === 'paused') {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-slate-200 text-slate-800 border border-slate-400 shadow-2xs font-bold whitespace-nowrap ${sizeClasses} ${className}`}>
        ⏸️ {compact ? 'Bảo lưu' : 'Tạm ngưng / Bảo lưu'}
      </span>
    );
  }

  // 🔴 QUÁ HẠN / HẾT HẠN HỢP ĐỒNG (diffDays < 0 HOẶC remaining <= 0)
  if (statusInfo.status === 'expired') {
    let label = '🔴 Quá hạn';
    if (clientType === 'monthly') {
      label = compact ? '🔴 Hết hạn' : '🔴 KHÁCH THÁNG (HẾT HẠN)';
    } else if (remaining <= 0) {
      label = compact ? '🔴 Hết buổi' : '🔴 HẾT BUỔI (GIA HẠN)';
    } else if (diffDays !== null && diffDays < 0) {
      label = compact ? '🔴 Hết hạn HĐ' : '🔴 HẾT HẠN HỢP ĐỒNG';
    }

    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-rose-600 text-white border border-rose-700 shadow-xs font-bold whitespace-nowrap animate-pulse ${sizeClasses} ${className}`}>
        <span>{label}</span>
        {!compact && showDetails && total > 0 && clientType !== 'monthly' && (
          <span className="text-[10px] bg-black/25 px-1.5 py-0.2 rounded font-mono font-black ml-0.5">
            {remaining}/{total}b
          </span>
        )}
      </span>
    );
  }

  // 🟡 SẮP HẾT HẠN / SẮP HẾT BUỔI ((0 <= diffDays <= 5) HOẶC (0 < remaining <= 2))
  if (statusInfo.status === 'expiring') {
    let label = '🟡 Sắp hết hạn';
    if (diffDays !== null && diffDays >= 0 && diffDays <= 5 && (clientType === 'monthly' || remaining > 2)) {
      label = diffDays === 0
        ? (compact ? '🟡 Hết hôm nay' : '🟡 Hết hạn hôm nay')
        : (compact ? `🟡 Hạn: ${diffDays}n` : `🟡 Còn ${diffDays} ngày`);
    } else if (remaining > 0 && remaining <= 2) {
      label = compact ? `🟡 Còn ${remaining} buổi` : `🟡 Còn ${remaining} buổi (Sắp hết)`;
    }

    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-amber-400 text-slate-950 border border-amber-500 shadow-xs font-bold whitespace-nowrap animate-pulse ${sizeClasses} ${className}`}>
        <span>{label}</span>
        {!compact && showDetails && total > 0 && clientType !== 'monthly' && (
          <span className="text-[10px] bg-slate-950/15 px-1.5 py-0.2 rounded font-mono font-black ml-0.5">
            {remaining}/{total}b
          </span>
        )}
      </span>
    );
  }

  // 🟢 ĐANG TẬP (ACTIVE - CÒN HẠN: diffDays > 5 VÀ (monthly HOẶC remaining > 2))
  let activeLabel = '🟢 Đang tập';
  if (clientType === 'monthly') {
    activeLabel = compact ? '🟢 Đang tập' : '🟢 Khách Tháng (Đang tập)';
  } else {
    activeLabel = compact ? `🟢 Còn ${remaining}b` : `🟢 Đang tập (${remaining} buổi)`;
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-emerald-600 text-white border border-emerald-700 shadow-xs font-bold whitespace-nowrap ${sizeClasses} ${className}`}>
      <span>{activeLabel}</span>
      {!compact && showDetails && total > 0 && clientType !== 'monthly' && (
        <span className="text-[10px] bg-black/20 px-1.5 py-0.2 rounded font-mono font-bold ml-0.5">
          {remaining}/{total}b
        </span>
      )}
    </span>
  );
};
