import { removeAccents } from '../utils/textUtils';
import { getTodayDateStr, getVNDate, getVNDayOfWeek, getVNDateStr } from '../utils/dateUtils';

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Zap, 
  Search, 
  Clock, 
  Calendar, 
  UserCheck, 
  Dumbbell, 
  AlertCircle, 
  Filter,
  FileSpreadsheet,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Camera
} from 'lucide-react';
import { useGym } from '../context/GymContext';
import { Client, CheckInLog } from '../types';
import { CheckInReceiptModal, CheckInReceiptData } from './CheckInReceiptModal';

interface CheckInViewProps {
  onOpenQuickCheckIn: (client?: Client) => void;
  onGoToProgram: (clientId: string) => void;
  onSelectClientDetail?: (client: Client) => void;
}

import { ConfirmPasswordModal } from './ConfirmPasswordModal';

export const CheckInView: React.FC<CheckInViewProps> = ({
  onOpenQuickCheckIn,
  onGoToProgram,
  onSelectClientDetail
}) => {
  const { clients, checkIns, cancelCheckIn, appointments } = useGym();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // State for password protected cancel checkin
  const [cancelTarget, setCancelTarget] = useState<{ logId: string; clientName: string } | null>(null);

  // State for past check-in receipt image modal
  const [receiptModalData, setReceiptModalData] = useState<CheckInReceiptData | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);

  const handleShowReceiptForLog = (log: CheckInLog) => {
    const client = clients.find(c => c.id === log.clientId);
    const logDate = new Date(log.timestamp);
    const checkInDateStr = logDate.toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const checkInTimeStr = logDate.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const remaining = Math.max(0, log.sessionsRemainingAfter);
    const clientTotal = client?.totalSessions || 0;
    const total = Math.max(1, clientTotal, remaining);
    const completed = Math.max(0, total - remaining);

    setReceiptModalData({
      clientName: log.clientName,
      avatarUrl: client?.avatarUrl,
      packageName: client?.packageName || 'Gói PT 1:1',
      totalSessions: total,
      completedSessions: completed,
      remainingSessions: remaining,
      checkInDateStr,
      checkInTimeStr,
      dayPlanName: log.dayPlanName,
      notes: log.notes
    });
    setIsReceiptModalOpen(true);
  };

  // Mode for Quick Access Client Selection: 'today' (Lịch hôm nay) or 'all' (Tất cả học viên)
  const [quickClientMode, setQuickClientMode] = useState<'today' | 'all'>('today');

  // Pagination for Check-in history
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 10;

  const getLocalDateIsoStr = (dateVal: Date | string) => {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getTodayIsoStr = () => getLocalDateIsoStr(new Date());

  const getYesterdayIsoStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return getLocalDateIsoStr(d);
  };

  // Date filter state (Defaults to today's date)
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>(getTodayIsoStr());

  // Time sort order: 'newest' | 'oldest' (Default to 'oldest' / earliest check-in time first)
  const [timeSortOrder, setTimeSortOrder] = useState<'newest' | 'oldest'>('oldest');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCancelCheckIn = (logId: string, clientName: string) => {
    cancelCheckIn(logId);
    triggerToast(`✅ Đã hủy lượt check-in của ${clientName}! Hoàn lại +1 buổi tập cho học viên.`);
  };

  // 1. Filter clients for Today vs All
  const todayDayOfWeek = getVNDayOfWeek(); // 0 = Sunday, 1 = Monday, ...
  const todayDateIso = getTodayDateStr();

  const todayClients = clients.filter(c => {
    const hasDay = c.preferredDays && c.preferredDays.includes(todayDayOfWeek);
    const hasAppt = appointments && appointments.some(a => a.clientId === c.id && a.date === todayDateIso);
    return hasDay || hasAppt;
  });

  const displayedQuickClients = quickClientMode === 'today' ? todayClients : clients;

  const todayStrDate = getVNDate().toDateString();
  const isClientCheckedInToday = (clientId: string) => {
    return checkIns.some(ci => ci.clientId === clientId && getVNDate(ci.timestamp).toDateString() === todayStrDate);
  };

  // 2. Filter check-in logs (Maximum 1 year storage limit)
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const yearlyCheckIns = checkIns.filter(ci => {
    const logDate = new Date(ci.timestamp);
    return logDate >= oneYearAgo;
  });

  const filteredCheckIns = yearlyCheckIns
    .filter(ci => {
      const searchNormalized = removeAccents(searchQuery.trim().toLowerCase());
      const nameNormalized = removeAccents(ci.clientName.toLowerCase());
      const planNormalized = removeAccents(ci.dayPlanName.toLowerCase());
      const notesNormalized = ci.notes ? removeAccents(ci.notes.toLowerCase()) : '';
      const matchesSearch = nameNormalized.includes(searchNormalized) || 
                            planNormalized.includes(searchNormalized) ||
                            notesNormalized.includes(searchNormalized);
      const matchesClient = selectedClientFilter === 'all' || ci.clientId === selectedClientFilter;
      const matchesDate = !selectedDateFilter || getLocalDateIsoStr(ci.timestamp) === selectedDateFilter;
      return matchesSearch && matchesClient && matchesDate;
    })
    .sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeSortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });

  // Count check-ins for the currently selected date filter (if set)
  const selectedDateCount = selectedDateFilter
    ? yearlyCheckIns.filter(ci => getLocalDateIsoStr(ci.timestamp) === selectedDateFilter).length
    : 0;

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedClientFilter, selectedDateFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredCheckIns.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCheckIns = filteredCheckIns.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const todayStr = getVNDate().toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const todayCount = checkIns.filter(ci => {
    const d = new Date(ci.timestamp);
    const now = new Date();
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white font-bold px-6 py-3.5 rounded-2xl shadow-2xl border border-emerald-500/50 flex items-center gap-3 animate-bounce">
          <RotateCcw className="w-5 h-5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
      
      {/* Full Check-In History Log */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white text-lg">Nhật ký check-in & lịch sử tập luyện</h3>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Tự động lưu giữ vết lịch sử tối đa 1 năm (12 tháng)</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Time Sort Order Toggle */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setTimeSortOrder('newest')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  timeSortOrder === 'newest'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Sắp xếp thời gian check-in mới nhất trước"
              >
                <ArrowUpDown className="w-3 h-3" /> Mới nhất
              </button>
              <button
                type="button"
                onClick={() => setTimeSortOrder('oldest')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  timeSortOrder === 'oldest'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Sắp xếp thời gian check-in sớm nhất trước"
              >
                Sớm nhất
              </button>
            </div>

            {/* Filter by Date */}
            <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <input
                type="date"
                value={selectedDateFilter}
                onChange={(e) => setSelectedDateFilter(e.target.value)}
                className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer"
                title="Lọc theo ngày"
              />
              {selectedDateFilter && (
                <button
                  onClick={() => setSelectedDateFilter('')}
                  className="text-slate-400 hover:text-white text-xs font-bold px-1"
                  title="Xóa bộ lọc ngày"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter by client */}
            <select
              value={selectedClientFilter}
              onChange={(e) => setSelectedClientFilter(e.target.value)}
              className="bg-slate-800 text-white text-xs border border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
            >
              <option value="all">Tất cả học viên ({clients.filter(c => c.status !== 'closed').length})</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm nhật ký..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-800 text-white text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-500 w-44"
              />
            </div>
          </div>
        </div>

        {filteredCheckIns.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
            Chưa tìm thấy lịch sử check-in phù hợp.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800 text-slate-200 uppercase font-bold border-b border-slate-700">
                  <tr>
                    <th className="p-3">Thời gian</th>
                    <th className="p-3">Học viên</th>
                    <th className="p-3">Bài / Buổi tập</th>
                    <th className="p-3">Ghi chú của PT</th>
                    <th className="p-3">Số buổi còn lại</th>
                    <th className="p-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-950/40">
                  {paginatedCheckIns.map(log => {
                    const client = clients.find(c => c.id === log.clientId);
                    return (
                      <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 font-mono text-slate-400 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString('vi-VN')}
                        </td>
                        <td className="p-3 font-bold text-white">
                          <div 
                            className="flex items-center gap-2 cursor-pointer hover:text-indigo-400 transition-colors"
                            onClick={() => client && onSelectClientDetail(client)}
                            title="Bấm để xem hồ sơ học viên"
                          >
                            {client && <img src={client.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover shadow-sm" />}
                            {log.clientName}
                          </div>
                        </td>
                        <td className="p-3 font-medium text-amber-300">
                          {log.dayPlanName}
                        </td>
                        <td className="p-3 text-slate-300 italic">
                          {log.notes || '-'}
                        </td>
                        <td className="p-3">
                          <span className="bg-emerald-500/20 text-emerald-400 font-extrabold px-2.5 py-1 rounded">
                            Còn {log.sessionsRemainingAfter} b
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleShowReceiptForLog(log)}
                              className="text-xs text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-all shadow-2xs cursor-pointer active:scale-95"
                              title="Tạo & gửi ảnh thẻ điểm danh buổi này"
                            >
                              <Camera className="w-3.5 h-3.5 text-indigo-600" /> Thẻ check-in
                            </button>
                            <button
                              onClick={() => onGoToProgram(log.clientId)}
                              className="text-xs text-amber-500 hover:text-amber-600 font-bold flex items-center gap-1 hover:underline"
                            >
                              <Dumbbell className="w-3.5 h-3.5" /> Giáo án
                            </button>
                            <button
                              onClick={() => setCancelTarget({ logId: log.id, clientName: log.clientName })}
                              className="text-xs text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                              title="Hủy lượt check-in & hoàn lại +1 buổi"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-rose-600" /> Hủy Check-in (+1 Buổi)
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs text-slate-400 font-medium">
              <div>
                Hiển thị <span className="font-bold text-white">{startIndex + 1}</span> - <span className="font-bold text-white">{Math.min(startIndex + ITEMS_PER_PAGE, filteredCheckIns.length)}</span> trên tổng số <span className="font-bold text-amber-400">{filteredCheckIns.length}</span> lượt (Lưu 1 năm)
              </div>

              <div className="flex items-center gap-1.5 self-center sm:self-auto">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1 ${
                    currentPage === 1
                      ? 'bg-slate-950 border-slate-800 text-slate-600 cursor-not-allowed'
                      : 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
                  }`}
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Trang trước
                </button>

                <div className="flex items-center gap-1 px-2 font-bold text-slate-300">
                  Trang <span className="text-emerald-400 font-black">{currentPage}</span> / {totalPages}
                </div>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1 ${
                    currentPage === totalPages
                      ? 'bg-slate-950 border-slate-800 text-slate-600 cursor-not-allowed'
                      : 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
                  }`}
                >
                  Trang sau <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Check-In Receipt Image Modal for Past Session */}
      <CheckInReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        data={receiptModalData}
      />

      {/* Password Confirmation Modal for Cancel Check-in */}
      <ConfirmPasswordModal
        isOpen={!!cancelTarget}
        title="Xác nhận mật khẩu hủy check-in"
        description={cancelTarget ? `Bạn đang yêu cầu HỦY lượt check-in của ${cancelTarget.clientName}. Thao tác này sẽ cộng lại +1 buổi tập cho học viên.` : ''}
        confirmLabel="Xác nhận hủy check-in"
        onClose={() => setCancelTarget(null)}
        onConfirm={() => {
          if (cancelTarget) {
            handleCancelCheckIn(cancelTarget.logId, cancelTarget.clientName);
            setCancelTarget(null);
          }
        }}
      />

    </div>
  );
};
