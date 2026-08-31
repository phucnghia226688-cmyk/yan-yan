import React from 'react';
import { Client } from '../types';
import { getVNDate } from '../utils/dateUtils';

interface SessionBadgeProps {
  client?: Client;
  remainingSessions?: number;
  totalSessions?: number;
  clientType?: 'session' | 'monthly';
  endDate?: string;
  status?: string;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
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
  className = ''
}) => {
  const isClientPassed = !!client;
  const isClosed = (client?.status || propStatus) === 'closed';
  const clientType = client?.clientType || propClientType || 'session';
  const remaining = client ? client.remainingSessions : (propRemaining !== undefined ? propRemaining : 0);
  const total = client ? client.totalSessions : (propTotal !== undefined ? propTotal : 0);
  const endDate = client ? client.endDate : propEndDate;

  // Size styling classes
  const sizeClasses = {
    sm: 'text-[11px] px-2.5 py-0.5 font-bold tracking-tight',
    md: 'text-xs px-3 py-1 font-black tracking-tight',
    lg: 'text-sm px-4 py-1.5 font-black tracking-wide'
  }[size];

  if (isClosed) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-slate-200 text-slate-800 border-2 border-slate-400 shadow-2xs font-extrabold ${sizeClasses} ${className}`}>
        🔒 HĐ đã đóng
      </span>
    );
  }

  // Monthly client handling
  if (clientType === 'monthly') {
    let daysRemaining = 999;
    if (endDate) {
      const today = getVNDate();
      today.setHours(0, 0, 0, 0);
      const endParts = endDate.split('-');
      if (endParts.length === 3) {
        const endD = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]));
        daysRemaining = Math.ceil((endD.getTime() - today.getTime()) / (1000 * 3600 * 24));
      }
    }

    if (daysRemaining < 0) {
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-red-600 text-white border-2 border-red-700 shadow-xs font-black uppercase ${sizeClasses} ${className}`}>
          <span>🔴 KHÁCH THÁNG (HẾT HẠN)</span>
        </span>
      );
    }

    if (daysRemaining <= 7) {
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-amber-400 text-slate-950 border-2 border-amber-500 shadow-xs font-black animate-pulse ${sizeClasses} ${className}`}>
          <span>🟡 Khách Tháng (Còn {daysRemaining} ngày)</span>
        </span>
      );
    }

    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-amber-400 text-slate-950 border-2 border-amber-500 shadow-xs font-black ${sizeClasses} ${className}`}>
        <span>📅 Khách Tháng</span>
        {showDetails && daysRemaining < 900 && (
          <span className="text-[10px] bg-slate-950/15 px-1.5 py-0.2 rounded-md font-extrabold ml-0.5">
            {daysRemaining} ngày
          </span>
        )}
      </span>
    );
  }

  // Check expiration of contract date for session client if applicable
  if (endDate) {
    const today = getVNDate();
    today.setHours(0, 0, 0, 0);
    const endParts = endDate.split('-');
    if (endParts.length === 3) {
      const endD = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]));
      const daysRemaining = Math.ceil((endD.getTime() - today.getTime()) / (1000 * 3600 * 24));
      if (daysRemaining < 0) {
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full bg-red-600 text-white border-2 border-red-700 shadow-xs font-black uppercase ${sizeClasses} ${className}`}>
            <span>🔴 HẾT HẠN HỢP ĐỒNG</span>
          </span>
        );
      }
    }
  }

  // Tier 1: 0 - 1 sessions (Red Alert)
  if (remaining <= 1) {
    const textLabel = remaining === 0 ? '🔴 HẾT BUỔI (NẠP GẤP)' : `🔴 CÒN 1 BUỔI (GIA HẠN)`;
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-red-600 text-white border-2 border-red-700 shadow-xs font-black uppercase animate-pulse ${sizeClasses} ${className}`}>
        <span>{textLabel}</span>
        {showDetails && total > 0 && (
          <span className="text-[10px] bg-black/25 px-1.5 py-0.2 rounded font-mono font-black ml-0.5">
            {remaining}/{total}b
          </span>
        )}
      </span>
    );
  }

  // Tier 2: 2 - 3 sessions (Amber Warning)
  if (remaining <= 3) {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-amber-400 text-slate-950 border-2 border-amber-500 shadow-xs font-black ${sizeClasses} ${className}`}>
        <span>🟡 Còn {remaining} buổi</span>
        {showDetails && total > 0 && (
          <span className="text-[10px] bg-slate-950/15 px-1.5 py-0.2 rounded font-mono font-black ml-0.5">
            {remaining}/{total}b
          </span>
        )}
      </span>
    );
  }

  // Tier 3: > 3 sessions (Emerald Healthy)
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-600 text-white border-2 border-emerald-700 shadow-xs font-black ${sizeClasses} ${className}`}>
      <span>🟢 Còn {remaining} buổi</span>
      {showDetails && total > 0 && (
        <span className="text-[10px] bg-black/20 px-1.5 py-0.2 rounded font-mono font-bold ml-0.5">
          {remaining}/{total}b
        </span>
      )}
    </span>
  );
};
