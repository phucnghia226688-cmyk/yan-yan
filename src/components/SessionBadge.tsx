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
      label = compact ? '🔴 Hết hạn' : '🔴 Khách tháng (hết hạn)';
    } else if (remaining <= 0) {
      label = compact ? '🔴 Hết buổi' : '🔴 Hết buổi (gia hạn)';
    } else if (diffDays !== null && diffDays < 0) {
      label = compact ? '🔴 Hết hạn HĐ' : '🔴 Hết hạn hợp đồng';
    }

    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-rose-600 text-white border border-rose-700 shadow-xs font-bold whitespace-nowrap animate-pulse ${sizeClasses} ${className}`}>
        <span>{label}</span>
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
    } else if (remaining > 0 && remaining < 2) {
      label = compact ? `🔴 Còn ${remaining} buổi` : `🔴 Còn ${remaining} buổi (sắp hết)`;
    } else if (remaining >= 2 && remaining < 5) {
      label = compact ? `🟠 Còn ${remaining} buổi` : `🟠 Còn ${remaining} buổi (sắp hết)`;
    }

    const badgeBg = remaining > 0 && remaining < 2 
      ? 'bg-rose-600 text-white border-rose-700'
      : 'bg-amber-400 text-slate-950 border-amber-500';

    return (
      <span className={`inline-flex items-center gap-1 rounded-full ${badgeBg} border shadow-xs font-bold whitespace-nowrap animate-pulse ${sizeClasses} ${className}`}>
        <span>{label}</span>
      </span>
    );
  }

  // 🟢 ĐANG TẬP (ACTIVE - CÒN HẠN: diffDays > 5 VÀ (monthly HOẶC remaining > 2))
  let activeLabel = '🟢 Đang tập';
  let activeBg = 'bg-emerald-600 text-white border-emerald-700';

  if (clientType === 'monthly') {
    activeLabel = compact ? '🟢 Đang tập' : '🟢 Khách tháng (đang tập)';
  } else {
    if (remaining < 2) {
      activeLabel = compact ? `🔴 Còn ${remaining} buổi` : `🔴 Còn ${remaining} buổi`;
      activeBg = 'bg-rose-600 text-white border-rose-700';
    } else if (remaining < 5) {
      activeLabel = compact ? `🟠 Còn ${remaining} buổi` : `🟠 Còn ${remaining} buổi`;
      activeBg = 'bg-amber-500 text-slate-950 border-amber-600';
    } else {
      activeLabel = compact ? `🟢 Còn ${remaining} buổi` : `🟢 Còn ${remaining} buổi`;
      activeBg = 'bg-emerald-600 text-white border-emerald-700';
    }
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full ${activeBg} border shadow-xs font-bold whitespace-nowrap ${sizeClasses} ${className}`}>
      <span>{activeLabel}</span>
    </span>
  );
};
