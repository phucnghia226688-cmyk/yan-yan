import React, { useState } from 'react';
import { useGym } from '../context/GymContext';
import { useTenant } from '../context/TenantContext';
import { SystemAuditLog, AuditActionType, Client } from '../types';
import { formatDate } from '../utils/dateUtils';
import { 
  History, 
  RotateCcw, 
  Trash2, 
  Edit3, 
  UserPlus, 
  CheckCircle2, 
  Search, 
  Filter, 
  AlertCircle,
  RefreshCw,
  DollarSign,
  Calendar,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  Tag,
  Info
} from 'lucide-react';

export const AuditLogView: React.FC = () => {
  const { auditLogs, undoAuditAction, clearAuditLogs } = useGym();
  const { currentUser } = useTenant();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | 'DELETE' | 'EDIT' | 'CHECKIN' | 'EXPENSE'>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>(''); // YYYY-MM-DD
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  // Undo Confirmation with Password Modal State
  const [confirmUndoLog, setConfirmUndoLog] = useState<SystemAuditLog | null>(null);
  const [undoPassword, setUndoPassword] = useState('');
  const [undoPasswordError, setUndoPasswordError] = useState(false);
  const [showUndoPassword, setShowUndoPassword] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const ITEMS_PER_PAGE = 20;

  const getTodayStr = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getYesterdayStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Helper function to extract field differences between previous state and updated state
  const getClientFieldDiffs = (prev?: Client, next?: Client) => {
    if (!prev || !next) return [];
    const diffs: { field: string; oldVal: string; newVal: string }[] = [];

    const check = (field: string, oldVal?: any, newVal?: any, formatFn?: (v: any) => string) => {
      const oStr = formatFn ? formatFn(oldVal) : String(oldVal ?? '');
      const nStr = formatFn ? formatFn(newVal) : String(newVal ?? '');
      if (oStr !== nStr && (oStr !== 'Trống' || nStr !== 'Trống')) {
        diffs.push({ field, oldVal: oStr || 'Trống', newVal: nStr || 'Trống' });
      }
    };

    check('Họ và tên', prev.name, next.name);
    check('Số điện thoại', prev.phone, next.phone);
    check('Gói tập', prev.packageName, next.packageName);
    check('Số buổi còn lại', prev.remainingSessions, next.remainingSessions, v => (v !== undefined && v !== null) ? `${v} buổi` : '');
    check('Tổng số buổi', prev.totalSessions, next.totalSessions, v => (v !== undefined && v !== null) ? `${v} buổi` : '');
    check('Hạn hợp đồng', prev.endDate, next.endDate, v => v ? String(v).split('-').reverse().join('/') : 'Chưa có');
    check('Ngày bắt đầu', prev.startDate, next.startDate, v => v ? String(v).split('-').reverse().join('/') : 'Chưa có');
    check('Khung giờ tập', prev.preferredTime, next.preferredTime);
    check('Lịch thứ tập', prev.preferredDays, next.preferredDays, days => {
      if (!Array.isArray(days) || days.length === 0) return 'Chưa xếp lịch';
      return days.map(d => (d === 0 ? 'Chủ Nhật' : `Thứ ${d + 1}`)).join(', ');
    });
    check('Trạng thái', prev.status, next.status, s => {
      const map: Record<string, string> = { active: 'Đang tập', expiring: 'Sắp hết', expired: 'Hết hạn', paused: 'Tạm ngưng' };
      return map[s] || s || '';
    });
    check('Nghề nghiệp', prev.occupation, next.occupation);
    check('Mục tiêu', prev.goals, next.goals);
    check('Ghi chú sức khỏe', prev.healthNotes, next.healthNotes);
    check('Ghi chú HLV', prev.ptNotes, next.ptNotes);

    return diffs;
  };

  // Filter logs
  const filteredLogs = auditLogs.filter(log => {
    // Search
    const matchSearch = 
      log.targetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchSearch) return false;

    // Category
    if (selectedCategory === 'DELETE') {
      if (!(log.actionType === 'DELETE_CLIENT' || log.actionType === 'DELETE_EXPENSE' || log.actionType === 'DELETE_APPOINTMENT')) return false;
    }
    if (selectedCategory === 'EDIT') {
      if (!(log.actionType === 'UPDATE_CLIENT' || log.actionType === 'RENEW_CLIENT' || log.actionType === 'ADD_CLIENT')) return false;
    }
    if (selectedCategory === 'CHECKIN') {
      if (!(log.actionType === 'CHECK_IN' || log.actionType === 'CANCEL_CHECK_IN')) return false;
    }
    if (selectedCategory === 'EXPENSE') {
      if (!(log.actionType === 'DELETE_EXPENSE' || log.actionType === 'ADD_EXPENSE')) return false;
    }

    // Date Filter
    if (selectedDate) {
      try {
        const d = new Date(log.timestamp);
        if (!isNaN(d.getTime())) {
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const logDateStr = `${year}-${month}-${day}`;
          if (logDateStr !== selectedDate) {
            return false;
          }
        }
      } catch {
        // ignore invalid dates
      }
    }

    return true;
  });

  // Sort: latest first
  const sortedLogs = [...filteredLogs].sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
  });

  // Pagination logic: If a specific date is selected, show FULL items for that entire day
  const isDateFiltered = Boolean(selectedDate);
  const totalItems = sortedLogs.length;
  const totalPages = isDateFiltered ? 1 : (Math.ceil(totalItems / ITEMS_PER_PAGE) || 1);
  const activePage = isDateFiltered ? 1 : Math.min(currentPage, totalPages);
  
  const paginatedLogs = isDateFiltered
    ? sortedLogs // FULL entries for selected day
    : sortedLogs.slice((activePage - 1) * ITEMS_PER_PAGE, activePage * ITEMS_PER_PAGE);

  // Validate Password & Execute Undo
  const handleVerifyAndExecuteUndo = () => {
    if (!confirmUndoLog) return;
    const validAdminPass = currentUser?.password;
    const enteredPass = undoPassword.trim();

    if (enteredPass !== validAdminPass && enteredPass !== localStorage.getItem('nb_gym_admin_password')) {
      setUndoPasswordError(true);
      return;
    }

    undoAuditAction(confirmUndoLog.id);
    showToast(`🎉 Đã khôi phục/hoàn tác thành công: ${confirmUndoLog.targetName}`);
    setConfirmUndoLog(null);
    setUndoPassword('');
    setUndoPasswordError(false);
  };

  // Helper for action badge style & icon
  const getActionBadge = (actionType: AuditActionType) => {
    switch (actionType) {
      case 'DELETE_CLIENT':
        return {
          bg: 'bg-red-50 text-red-700 border-red-200',
          icon: <Trash2 className="w-4 h-4 text-red-600" />,
          label: 'Xóa học viên'
        };
      case 'ADD_CLIENT':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: <UserPlus className="w-4 h-4 text-emerald-600" />,
          label: 'Tạo học viên'
        };
      case 'RENEW_CLIENT':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: <RefreshCw className="w-4 h-4 text-blue-600" />,
          label: 'Gia hạn gói'
        };
      case 'UPDATE_CLIENT':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          icon: <Edit3 className="w-4 h-4 text-amber-600" />,
          label: 'Sửa hồ sơ'
        };
      case 'CHECK_IN':
        return {
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          icon: <CheckCircle2 className="w-4 h-4 text-indigo-600" />,
          label: 'Check-in'
        };
      case 'CANCEL_CHECK_IN':
        return {
          bg: 'bg-orange-50 text-orange-700 border-orange-200',
          icon: <ShieldAlert className="w-4 h-4 text-orange-600" />,
          label: 'Hủy Check-in'
        };
      case 'DELETE_EXPENSE':
      case 'ADD_EXPENSE':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: <DollarSign className="w-4 h-4 text-rose-600" />,
          label: 'Chi phí'
        };
      case 'DELETE_APPOINTMENT':
      case 'ADD_APPOINTMENT':
        return {
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: <Calendar className="w-4 h-4 text-purple-600" />,
          label: 'Lịch tập'
        };
      case 'RESTORE_DATA':
        return {
          bg: 'bg-teal-50 text-teal-700 border-teal-200',
          icon: <RotateCcw className="w-4 h-4 text-teal-600" />,
          label: 'Khôi phục'
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          icon: <History className="w-4 h-4 text-slate-600" />,
          label: 'Thao tác'
        };
    }
  };

  const formatTimestampDisplay = (ts: string) => {
    try {
      const date = new Date(ts);
      if (isNaN(date.getTime())) return ts;

      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      
      if (isToday) {
        return `Hôm nay, ${timeStr}`;
      }
      
      const dateStr = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
      return `${dateStr} lúc ${timeStr}`;
    } catch {
      return ts;
    }
  };

  const totalCount = auditLogs.length;
  const undoneCount = auditLogs.filter(l => l.isUndone).length;
  const deleteCount = auditLogs.filter(l => l.actionType === 'DELETE_CLIENT').length;

  // Render Log Details & Field Differences
  const renderLogDetails = (log: SystemAuditLog) => {
    const isUpdate = log.actionType === 'UPDATE_CLIENT' || log.actionType === 'RENEW_CLIENT';
    const prevClient = log.snapshot?.previousClientState;
    const nextClient = log.snapshot?.updatedClientState;
    const diffs = (isUpdate && prevClient && nextClient) ? getClientFieldDiffs(prevClient, nextClient) : [];

    return (
      <div className="space-y-2 mt-2">
        {/* 1. Field diffs for edits/updates */}
        {diffs.length > 0 ? (
          <div className="p-3 bg-slate-50/90 border border-slate-200/90 rounded-xl space-y-2 text-xs">
            <div className="font-black text-slate-800 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
              <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Chi tiết thông tin đã thay đổi ({diffs.length} mục):</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {diffs.map((d, i) => (
                <div key={i} className="p-2 bg-white border border-slate-200/80 rounded-lg flex flex-col gap-1 shadow-2xs">
                  <span className="font-extrabold text-slate-800 text-[11px]">{d.field}</span>
                  <div className="flex items-center gap-1.5 text-xs flex-wrap">
                    <span className="line-through text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-medium">{d.oldVal}</span>
                    <ArrowRight className="w-3 h-3 text-indigo-500 shrink-0" />
                    <span className="text-indigo-700 font-bold bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">{d.newVal}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : log.details ? (
          <p className="text-xs text-slate-600 font-medium bg-slate-50/80 border border-slate-200/60 p-2.5 rounded-xl">
            {log.details}
          </p>
        ) : null}

        {/* 2. Snapshot Info Preview for Deleted Client */}
        {log.actionType === 'DELETE_CLIENT' && log.snapshot?.client && !log.isUndone && (
          <div className="p-3 bg-red-50/80 border border-red-200/80 rounded-xl text-xs text-red-900 flex items-center space-x-3">
            {log.snapshot.client.avatarUrl ? (
              <img 
                src={log.snapshot.client.avatarUrl} 
                alt={log.snapshot.client.name} 
                className="w-9 h-9 rounded-full object-cover border border-red-300 shrink-0" 
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-red-200 text-red-800 font-bold flex items-center justify-center shrink-0">
                {log.snapshot.client.name.charAt(0)}
              </div>
            )}
            <div>
              <div className="font-black text-sm">{log.snapshot.client.name} - {log.snapshot.client.phone || 'Không có SĐT'}</div>
              <div className="text-[11px] text-red-700 font-semibold mt-0.5">
                Gói tập: {log.snapshot.client.packageName} • Còn {log.snapshot.client.remainingSessions} buổi • Hạn HĐ: {formatDate(log.snapshot.client.endDate)}
              </div>
            </div>
          </div>
        )}

        {/* 3. Snapshot Info Preview for Expense */}
        {(log.actionType === 'ADD_EXPENSE' || log.actionType === 'DELETE_EXPENSE') && log.snapshot?.expense && (
          <div className="p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-center justify-between gap-2">
            <div>
              <span className="font-bold">{log.snapshot.expense.categoryGroup}:</span> {log.snapshot.expense.category}
              {log.snapshot.expense.notes && <span className="text-amber-700 italic ml-1">({log.snapshot.expense.notes})</span>}
            </div>
            <div className="font-black text-amber-800 text-sm whitespace-nowrap">
              {log.snapshot.expense.amountVnd.toLocaleString('vi-VN')} VNĐ
            </div>
          </div>
        )}

        {/* 4. Snapshot Info Preview for Payment */}
        {(log.actionType === 'ADD_PAYMENT' || log.actionType === 'DELETE_PAYMENT') && log.snapshot?.payment && (
          <div className="p-2.5 bg-emerald-50/80 border border-emerald-200/80 rounded-xl text-xs text-emerald-900 flex items-center justify-between gap-2">
            <div>
              <span className="font-bold">{log.snapshot.payment.clientName}</span> - Gói {log.snapshot.payment.packageName} (+{log.snapshot.payment.sessionsCount} buổi)
              {log.snapshot.payment.paymentMethod && <span className="ml-1 text-[11px] bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold px-1.5 py-0.5 rounded">{log.snapshot.payment.paymentMethod}</span>}
            </div>
            <div className="font-black text-emerald-800 text-sm whitespace-nowrap">
              {log.snapshot.payment.amountVnd.toLocaleString('vi-VN')} VNĐ
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center space-x-3 border border-slate-700 animate-bounce">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2.5 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-500/30">
                <History className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Lịch sử thao tác & hoàn tác</h1>
            </div>
            <p className="text-slate-300 text-sm max-w-2xl">
              Ghi lại chi tiết toàn bộ nội dung đã sửa, thêm, xóa học viên, check-in, chi phí.
              Yêu cầu <strong>nhập mật khẩu quản trị</strong> để thực hiện <strong>hoàn tác (khôi phục)</strong> dữ liệu.
            </p>
          </div>

          <div className="flex items-center space-x-3 self-start md:self-auto">
            {totalCount > 0 && (
              <button
                onClick={() => {
                  if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử thao tác không?')) {
                    clearAuditLogs();
                  }
                }}
                className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition border border-slate-700 cursor-pointer"
              >
                Xóa lịch sử
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-800/60 backdrop-blur-sm p-3.5 rounded-xl border border-slate-700/50">
            <div className="text-xs text-slate-400 font-medium mb-1">Tổng lượt thao tác</div>
            <div className="text-xl font-bold text-white">{totalCount}</div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-sm p-3.5 rounded-xl border border-slate-700/50">
            <div className="text-xs text-slate-400 font-medium mb-1">Thao tác đã xóa học viên</div>
            <div className="text-xl font-bold text-red-400">{deleteCount}</div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-sm p-3.5 rounded-xl border border-slate-700/50">
            <div className="text-xs text-slate-400 font-medium mb-1">Đã hoàn tác (Khôi phục)</div>
            <div className="text-xl font-bold text-emerald-400">{undoneCount}</div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-sm p-3.5 rounded-xl border border-slate-700/50">
            <div className="text-xs text-slate-400 font-medium mb-1">Thao tác đang hiệu lực</div>
            <div className="text-xl font-bold text-indigo-300">{totalCount - undoneCount}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Left: Search Box + Date Picker */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            {/* Search Box */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Tìm theo tên học viên, ghi chú, nội dung..."
                className="w-full pl-10 pr-8 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
              {searchTerm && (
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setCurrentPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 bg-slate-200 rounded-full w-4 h-4 flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Date Filter Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex items-center flex-1 sm:flex-initial">
                <Calendar className="w-4 h-4 absolute left-3 text-indigo-500 pointer-events-none" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full sm:w-auto pl-9 pr-3 py-2 text-xs font-bold bg-indigo-50/50 border border-indigo-200 rounded-xl text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                  title="Lọc chọn ngày xem lại lịch sử thao tác"
                />
              </div>

              {/* Quick Date Shortcuts */}
              <button
                type="button"
                onClick={() => {
                  setSelectedDate(getTodayStr());
                  setCurrentPage(1);
                }}
                className={`text-xs font-extrabold px-2.5 py-2 rounded-xl border transition shrink-0 cursor-pointer ${
                  selectedDate === getTodayStr()
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : 'bg-indigo-50/80 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                }`}
              >
                Hôm nay
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedDate(getYesterdayStr());
                  setCurrentPage(1);
                }}
                className={`text-xs font-extrabold px-2.5 py-2 rounded-xl border transition shrink-0 cursor-pointer ${
                  selectedDate === getYesterdayStr()
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                Hôm qua
              </button>

              {selectedDate && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDate('');
                    setCurrentPage(1);
                  }}
                  className="text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2.5 py-2 rounded-xl border border-rose-200 transition shrink-0 cursor-pointer"
                >
                  Tất cả ngày
                </button>
              )}
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none shrink-0">
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'DELETE', label: '🗑️ Xóa' },
              { id: 'EDIT', label: '✏️ Sửa & Gia hạn' },
              { id: 'CHECKIN', label: '⚡ Check-in' },
              { id: 'EXPENSE', label: '💸 Chi phí' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedCategory(tab.id as any);
                  setCurrentPage(1);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === tab.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Audit Log List */}
      {paginatedLogs.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <History className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">Chưa có lịch sử thao tác nào</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            {searchTerm || selectedCategory !== 'ALL' || selectedDate
              ? 'Không tìm thấy ghi nhận thao tác phù hợp với bộ lọc tìm kiếm hoặc ngày đã chọn.'
              : 'Mọi hành động thêm, sửa, xóa học viên hoặc check-in sẽ tự động ghi lại tại đây.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedLogs.map(log => {
            const badge = getActionBadge(log.actionType);
            const isDeleteClient = log.actionType === 'DELETE_CLIENT';
            const canUndo = !log.isUndone && log.actionType !== 'RESTORE_DATA';

            return (
              <div 
                key={log.id} 
                className={`bg-white rounded-2xl p-4 md:p-5 border shadow-sm transition hover:shadow-md ${
                  log.isUndone 
                    ? 'border-slate-200 opacity-75 bg-slate-50/50' 
                    : isDeleteClient 
                    ? 'border-red-200/80 bg-red-50/10' 
                    : 'border-slate-200/90'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  {/* Left Column: Icon + Description + Field Diffs */}
                  <div className="flex items-start space-x-3.5 flex-1">
                    <div className={`p-2.5 rounded-xl border mt-0.5 shrink-0 ${badge.bg}`}>
                      {badge.icon}
                    </div>

                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${badge.bg}`}>
                          {badge.label}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          {formatTimestampDisplay(log.timestamp)}
                        </span>
                        {log.isUndone && (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center space-x-1">
                            <Check className="w-3 h-3" />
                            <span>Đã hoàn tác</span>
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-black text-slate-900 leading-snug">
                        {log.summary}
                      </h4>

                      {/* Detailed Changes / Field Diff View */}
                      {renderLogDetails(log)}
                    </div>
                  </div>

                  {/* Right Column: Action Button */}
                  <div className="sm:text-right shrink-0 self-end sm:self-start pt-1">
                    {log.isUndone ? (
                      <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 inline-flex items-center space-x-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Đã khôi phục</span>
                      </div>
                    ) : canUndo ? (
                      <button
                        onClick={() => {
                          setConfirmUndoLog(log);
                          setUndoPassword('');
                          setUndoPasswordError(false);
                        }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center space-x-1.5 shadow-sm cursor-pointer ${
                          isDeleteClient
                            ? 'bg-red-600 text-white hover:bg-red-700 shadow-red-600/20'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/20'
                        }`}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Hoàn tác</span>
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Day Indicator Banner */}
      {isDateFiltered && totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-indigo-50/80 p-3.5 rounded-2xl border border-indigo-200/90 text-xs font-bold text-indigo-900 mt-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              Đang hiển thị đầy đủ toàn bộ <strong className="text-indigo-950 font-black text-sm">{totalItems}</strong> thao tác trong ngày <strong className="text-indigo-950 font-black text-sm">{selectedDate.split('-').reverse().join('/')}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedDate('')}
            className="text-[11px] font-extrabold text-indigo-700 hover:text-indigo-900 bg-white px-3 py-1.5 rounded-xl border border-indigo-200 shadow-2xs transition cursor-pointer shrink-0"
          >
            Xem tất cả các ngày
          </button>
        </div>
      )}

      {/* Pagination Controls for Multi-day View */}
      {!isDateFiltered && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm mt-4">
          <div className="text-xs text-slate-500 font-medium">
            Hiển thị <strong className="text-slate-900 font-extrabold">{(activePage - 1) * ITEMS_PER_PAGE + 1}</strong> - <strong className="text-slate-900 font-extrabold">{Math.min(activePage * ITEMS_PER_PAGE, totalItems)}</strong> trên tổng số <strong className="text-indigo-600 font-extrabold">{totalItems}</strong> thao tác
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={activePage === 1}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition text-xs font-bold flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Trang trước</span>
            </button>

            {/* Page Numbers */}
            <div className="flex items-center space-x-1 px-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - activePage) <= 2)
                .reduce<(number | string)[]>((acc, page, idx, arr) => {
                  if (idx > 0 && (page as number) - (arr[idx - 1] as number) > 1) {
                    acc.push('...');
                  }
                  acc.push(page);
                  return acc;
                }, [])
                .map((item, idx) => {
                  if (item === '...') {
                    return <span key={`dots-${idx}`} className="px-1.5 text-xs text-slate-400 font-bold">...</span>;
                  }
                  const p = item as number;
                  return (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`w-8 h-8 rounded-xl text-xs font-black transition cursor-pointer ${
                        p === activePage
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={activePage === totalPages}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition text-xs font-bold flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
            >
              <span className="hidden sm:inline">Trang sau</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Undo Password Protection Modal */}
      {confirmUndoLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center space-x-3 text-indigo-600">
              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                <Lock className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Xác Nhận Mật Khẩu Hoàn Tác</h3>
                <p className="text-xs text-slate-500 font-medium">Vui lòng nhập mật khẩu quản trị để thực hiện</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
              <div className="font-extrabold text-slate-900">{confirmUndoLog.summary}</div>
              <div className="text-slate-600">Đối tượng: <span className="font-bold">{confirmUndoLog.targetName}</span></div>
              <div className="text-slate-400 text-[11px]">{formatTimestampDisplay(confirmUndoLog.timestamp)}</div>
            </div>

            {/* Password Input Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                Mật khẩu phê duyệt hoàn tác:
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                <input
                  type={showUndoPassword ? 'text' : 'password'}
                  value={undoPassword}
                  onChange={(e) => {
                    setUndoPassword(e.target.value);
                    setUndoPasswordError(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleVerifyAndExecuteUndo();
                    }
                  }}
                  placeholder="Nhập mật khẩu phê duyệt hoàn tác"
                  className={`w-full bg-slate-50 text-slate-900 border ${
                    undoPasswordError ? 'border-red-500 ring-2 ring-red-200' : 'border-slate-300'
                  } rounded-xl pl-9 pr-10 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all`}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowUndoPassword(!showUndoPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  {showUndoPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {undoPasswordError && (
                <p className="text-xs text-red-600 font-bold flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  Mật khẩu không chính xác! Vui lòng kiểm tra lại.
                </p>
              )}
            </div>

            <p className="text-[11px] text-slate-400 italic">
              💡 Mật khẩu xác nhận là mật khẩu quản trị do bạn thiết lập trong phần Cài Đặt.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setConfirmUndoLog(null);
                  setUndoPassword('');
                  setUndoPasswordError(false);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleVerifyAndExecuteUndo}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center space-x-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Xác nhận & hoàn tác</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
