import { removeAccents } from '../utils/textUtils';
import { getTodayDateStr, getVNDate, getVNDayOfWeek, getVNDateStr, formatDateTime } from '../utils/dateUtils';

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
  Camera,
  Utensils,
  Layers,
  Sparkles,
  ShoppingBag,
  AlertTriangle,
  RefreshCw,
  Phone,
  X
} from 'lucide-react';
import { useGym } from '../context/GymContext';
import { Client, CheckInLog } from '../types';
import { SessionBadge } from './SessionBadge';
import { CheckInReceiptModal, CheckInReceiptData } from './CheckInReceiptModal';
import { ServiceCheckInModal } from './ServiceCheckInModal';
import { RenewExtraServiceModal } from './RenewExtraServiceModal';
import { ServiceReceiptModal, ServiceReceiptData } from './ServiceReceiptModal';
import { ConfirmPasswordModal } from './ConfirmPasswordModal';

interface CheckInViewProps {
  onOpenQuickCheckIn: (client?: Client) => void;
  onGoToProgram: (clientId: string) => void;
  onSelectClientDetail?: (client: Client) => void;
  activeMainTab?: 'training' | 'service';
  onTabChange?: (tab: 'training' | 'service') => void;
  hideNavigationTabs?: boolean;
}

export const CheckInView: React.FC<CheckInViewProps> = ({
  onOpenQuickCheckIn,
  onGoToProgram,
  onSelectClientDetail,
  activeMainTab: propActiveMainTab,
  onTabChange,
  hideNavigationTabs = false
}) => {
  const { clients, checkIns, cancelCheckIn, appointments } = useGym();
  
  // Main Tab: 'training' (Check-in Học Viên) | 'service' (Checkin Dịch Vụ)
  const [internalActiveMainTab, setInternalActiveMainTab] = useState<'training' | 'service'>('training');
  const activeMainTab = propActiveMainTab ?? internalActiveMainTab;

  const setActiveMainTab = (tab: 'training' | 'service') => {
    setInternalActiveMainTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // State for password protected cancel checkin (Training)
  const [cancelTarget, setCancelTarget] = useState<{ logId: string; clientName: string } | null>(null);

  // State for past check-in receipt image modal (Training)
  const [receiptModalData, setReceiptModalData] = useState<CheckInReceiptData | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);

  // State for Add-on Service Features
  const [serviceSearch, setServiceSearch] = useState('');
  const [serviceStatusFilter, setServiceStatusFilter] = useState<'all' | 'active' | 'expiring' | 'expired'>('all');
  const [selectedServiceClient, setSelectedServiceClient] = useState<Client | null>(null);
  const [isServiceCheckInOpen, setIsServiceCheckInOpen] = useState(false);
  const [renewServiceClient, setRenewServiceClient] = useState<Client | null>(null);
  const [isRenewServiceOpen, setIsRenewServiceOpen] = useState(false);
  const [serviceReceiptData, setServiceReceiptData] = useState<ServiceReceiptData | null>(null);
  const [isServiceReceiptOpen, setIsServiceReceiptOpen] = useState(false);
  const [serviceCancelTarget, setServiceCancelTarget] = useState<{ logId: string; clientName: string; serviceName?: string } | null>(null);
  const [serviceLogSearch, setServiceLogSearch] = useState('');
  const [serviceLogPage, setServiceLogPage] = useState<number>(1);
  const SERVICE_LOGS_PER_PAGE = 10;

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

  const handleShowServiceReceiptForLog = (log: CheckInLog) => {
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

    const remCount = log.extraServicesRemainingAfter !== undefined
      ? log.extraServicesRemainingAfter
      : (client?.remainingExtraServices ?? log.sessionsRemainingAfter);

    setServiceReceiptData({
      clientName: log.clientName,
      avatarUrl: client?.avatarUrl,
      serviceName: log.dayPlanName || client?.extraServiceName || 'Dịch vụ thêm',
      checkInDateStr,
      checkInTimeStr,
      notes: log.notes,
      remainingCount: remCount,
      totalCount: client?.totalExtraServices || Math.max(remCount, 1)
    });
    setIsServiceReceiptOpen(true);
  };

  const handleServiceCheckInSuccess = (log: CheckInLog, updatedClient: Client) => {
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

    const remCount = log.extraServicesRemainingAfter !== undefined
      ? log.extraServicesRemainingAfter
      : (updatedClient.remainingExtraServices ?? log.sessionsRemainingAfter);

    setServiceReceiptData({
      clientName: log.clientName,
      avatarUrl: updatedClient.avatarUrl,
      serviceName: updatedClient.extraServiceName || 'Dịch vụ thêm',
      checkInDateStr,
      checkInTimeStr,
      notes: log.notes,
      remainingCount: remCount,
      totalCount: updatedClient.totalExtraServices || Math.max(remCount, 1)
    });
    setIsServiceReceiptOpen(true);
    triggerToast(`✅ Điểm danh ${updatedClient.extraServiceName} cho ${updatedClient.name} thành công!`);
  };

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

  // Date filter state (Defaults to today's date)
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>(getTodayIsoStr());

  // Time sort order: 'newest' | 'oldest' (Default to 'oldest')
  const [timeSortOrder, setTimeSortOrder] = useState<'newest' | 'oldest'>('oldest');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCancelCheckIn = (logId: string, clientName: string) => {
    cancelCheckIn(logId);
    triggerToast(`✅ Đã hủy lượt check-in của ${clientName}! Hoàn lại +1 buổi tập cho học viên.`);
  };

  const handleCancelServiceCheckIn = (logId: string, clientName: string) => {
    cancelCheckIn(logId);
    triggerToast(`✅ Đã hủy lượt check-in dịch vụ của ${clientName}! Hoàn lại +1 suất dịch vụ.`);
  };

  // Filter Check-in Logs (Exclude extra_service for Training Tab)
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const yearlyCheckIns = checkIns.filter(ci => {
    const logDate = new Date(ci.timestamp);
    return logDate >= oneYearAgo;
  });

  const trainingCheckIns = yearlyCheckIns.filter(ci => ci.type !== 'extra_service');
  const serviceCheckIns = yearlyCheckIns.filter(ci => ci.type === 'extra_service');

  const filteredCheckIns = trainingCheckIns
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

  const filteredServiceLogs = serviceCheckIns
    .filter(ci => {
      if (!serviceLogSearch) return true;
      const searchNorm = removeAccents(serviceLogSearch.trim().toLowerCase());
      const nameNorm = removeAccents(ci.clientName.toLowerCase());
      const planNorm = removeAccents((ci.dayPlanName || '').toLowerCase());
      const notesNorm = ci.notes ? removeAccents(ci.notes.toLowerCase()) : '';
      return nameNorm.includes(searchNorm) || planNorm.includes(searchNorm) || notesNorm.includes(searchNorm);
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedClientFilter, selectedDateFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredCheckIns.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCheckIns = filteredCheckIns.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const totalServiceLogPages = Math.max(1, Math.ceil(filteredServiceLogs.length / SERVICE_LOGS_PER_PAGE));
  const startServiceLogIndex = (serviceLogPage - 1) * SERVICE_LOGS_PER_PAGE;
  const paginatedServiceLogs = filteredServiceLogs.slice(startServiceLogIndex, startServiceLogIndex + SERVICE_LOGS_PER_PAGE);

  // Clients with Extra Services
  const allServiceClients = clients.filter(c => c.hasExtraService);

  const filteredServiceClients = allServiceClients.filter(c => {
    const remaining = c.remainingExtraServices ?? c.totalExtraServices ?? 0;
    
    // Status Filter
    if (serviceStatusFilter === 'active' && remaining <= 3) return false;
    if (serviceStatusFilter === 'expiring' && (remaining <= 0 || remaining > 3)) return false;
    if (serviceStatusFilter === 'expired' && remaining > 0) return false;

    // Search Filter
    if (serviceSearch.trim()) {
      const q = removeAccents(serviceSearch.trim().toLowerCase());
      const nameNorm = removeAccents(c.name.toLowerCase());
      const phoneNorm = (c.phone || '').toLowerCase();
      const srvNorm = removeAccents((c.extraServiceName || '').toLowerCase());
      return nameNorm.includes(q) || phoneNorm.includes(q) || srvNorm.includes(q);
    }
    return true;
  });

  // Metrics for Service Clients
  const activeServiceClientsCount = allServiceClients.filter(c => (c.remainingExtraServices ?? c.totalExtraServices ?? 0) > 3).length;
  const expiringServiceClientsCount = allServiceClients.filter(c => {
    const r = c.remainingExtraServices ?? c.totalExtraServices ?? 0;
    return r > 0 && r <= 3;
  }).length;
  const expiredServiceClientsCount = allServiceClients.filter(c => (c.remainingExtraServices ?? c.totalExtraServices ?? 0) <= 0).length;

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white font-bold px-6 py-3.5 rounded-2xl shadow-2xl border border-emerald-500/50 flex items-center gap-3 animate-bounce">
          <RotateCcw className="w-5 h-5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP NAVIGATION TABS: Check-in Học Viên vs Checkin Dịch Vụ (Shown only if not hidden by parent) */}
      {!hideNavigationTabs && (
        <div className="bg-slate-900/90 backdrop-blur-md p-2 rounded-3xl border border-slate-800 shadow-xl flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveMainTab('training')}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl font-extrabold text-sm transition-all cursor-pointer ${
              activeMainTab === 'training'
                ? 'bg-gradient-to-r from-[#4F46E5] to-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Dumbbell className="w-4 h-4" />
            <span>🏋️ Check-in Học Viên</span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-black ${
              activeMainTab === 'training' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              {trainingCheckIns.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('service')}
            className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl font-extrabold text-sm transition-all cursor-pointer ${
              activeMainTab === 'service'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>🍽️ Checkin Dịch Vụ</span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-black ${
              activeMainTab === 'service' ? 'bg-slate-950/30 text-slate-950' : 'bg-amber-400/20 text-amber-300'
            }`}>
              {allServiceClients.length} học viên
            </span>
            {expiringServiceClientsCount > 0 && (
              <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.2 rounded-full font-black animate-pulse" title="Học viên sắp hết suất">
                !
              </span>
            )}
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: CHECK-IN HỌC VIÊN (TRAINING) */}
      {/* ========================================================================= */}
      {activeMainTab === 'training' && (
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
                  <thead className="bg-slate-800 text-slate-200 font-bold border-b border-slate-700">
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
                            {formatDateTime(log.timestamp)}
                          </td>
                          <td className="p-3 font-bold text-white">
                            <div 
                              className="flex items-center gap-2 cursor-pointer hover:text-indigo-400 transition-colors"
                              onClick={() => client && onSelectClientDetail && onSelectClientDetail(client)}
                              title="Bấm để xem hồ sơ học viên"
                            >
                              {client && <img src={client.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover shadow-sm shrink-0" />}
                              <span className="whitespace-normal break-words leading-snug">{log.clientName}</span>
                            </div>
                          </td>
                          <td className="p-3 font-medium text-amber-300">
                            {log.dayPlanName}
                          </td>
                          <td className="p-3 text-slate-300 italic">
                            {log.notes || '-'}
                          </td>
                          <td className="p-3">
                            <SessionBadge
                              remainingSessions={log.sessionsRemainingAfter}
                              clientType={client?.clientType}
                              size="sm"
                            />
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
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CHECKIN DỊCH VỤ (EXTRA SERVICES) */}
      {/* ========================================================================= */}
      {activeMainTab === 'service' && (
        <div className="space-y-6">
          {/* Top Service Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 dark:bg-amber-400/10 border border-amber-400/40 flex items-center justify-center text-amber-900 dark:text-amber-300 shrink-0">
                <Utensils className="w-5 h-5 text-amber-900 dark:text-amber-300" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-black text-amber-950 dark:text-amber-100 block">
                  Quản Lý & Điểm Danh Dịch Vụ Thêm (Nước uống, Meal prep, Khăn, Spa...)
                </span>
                <span className="text-[11px] font-medium text-amber-900/80 dark:text-amber-200/80">
                  Theo dõi số suất đã sử dụng, cảnh báo sắp hết và xuất thẻ ảnh Zalo
                </span>
              </div>
            </div>
            {!hideNavigationTabs && (
              <button
                type="button"
                onClick={() => setActiveMainTab('training')}
                className="text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-300 px-4 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-95 shrink-0 self-start sm:self-auto"
              >
                <X className="w-4 h-4" />
                <span>Đóng Tab / Về Check-in Học Viên</span>
              </button>
            )}
          </div>

          {/* Service Header & Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Metric 1: Total Service Clients */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center gap-3 shadow-xs hover:shadow-sm transition-all">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-400 shrink-0">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-bold">Tổng học viên DV</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{allServiceClients.length}</p>
              </div>
            </div>

            {/* Metric 2: Active Service */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center gap-3 shadow-xs hover:shadow-sm transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-bold">Đang hoạt động</p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{activeServiceClientsCount}</p>
              </div>
            </div>

            {/* Metric 3: Expiring Soon */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center gap-3 shadow-xs hover:shadow-sm transition-all">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-bold">Sắp hết (≤ 3 suất)</p>
                <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{expiringServiceClientsCount}</p>
              </div>
            </div>

            {/* Metric 4: Expired */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center gap-3 shadow-xs hover:shadow-sm transition-all">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-bold">Đã hết suất</p>
                <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5">{expiredServiceClientsCount}</p>
              </div>
            </div>
          </div>

          {/* Service Search & Status Filters */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mr-1">
                <Filter className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Bộ lọc:
              </span>
              {(['all', 'active', 'expiring', 'expired'] as const).map(tabKey => {
                const labels: Record<string, string> = {
                  all: `Tất cả (${allServiceClients.length})`,
                  active: `🟢 Đang dùng (${activeServiceClientsCount})`,
                  expiring: `⚠️ Sắp hết (${expiringServiceClientsCount})`,
                  expired: `⛔ Đã hết (${expiredServiceClientsCount})`
                };
                const isActive = serviceStatusFilter === tabKey;
                return (
                  <button
                    key={tabKey}
                    type="button"
                    onClick={() => setServiceStatusFilter(tabKey)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      isActive
                        ? 'bg-amber-400 text-slate-950 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {labels[tabKey]}
                  </button>
                );
              })}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm tên học viên, SĐT, dịch vụ..."
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500 font-medium"
              />
            </div>
          </div>

          {/* Cards Grid: Clients with Extra Services */}
          {filteredServiceClients.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-3 shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 flex items-center justify-center mx-auto">
                <Utensils className="w-8 h-8" />
              </div>
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white">Chưa tìm thấy học viên dịch vụ thêm</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Bạn có thể kích hoạt dịch vụ thêm (Meal Plan, Đồ uống, Khăn tập...) cho học viên bất kỳ tại mục 
                <span className="text-amber-800 dark:text-amber-400 font-bold"> "Quản lý học viên" ➔ Thêm mới hoặc Chỉnh sửa hồ sơ</span>.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredServiceClients.map(client => {
                const serviceName = client.extraServiceName || 'Dịch vụ thêm';
                const remaining = client.remainingExtraServices ?? client.totalExtraServices ?? 0;
                const total = client.totalExtraServices ?? 0;
                const used = Math.max(0, total - remaining);
                const percent = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
                const isOutOfService = remaining <= 0;
                const isExpiringSoon = remaining > 0 && remaining <= 3;

                // Color themes based on state
                let cardBorder = "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900";
                let badgeBg = "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 text-emerald-900 dark:text-emerald-200";
                let progressColor = "bg-emerald-500";
                let statusText = `✅ Đang hoạt động (${remaining} suất)`;

                if (isOutOfService) {
                  cardBorder = "border-rose-300 dark:border-rose-700/60 bg-rose-50/50 dark:bg-rose-950/20";
                  badgeBg = "bg-rose-100/80 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-700/60 text-rose-950 dark:text-rose-200";
                  progressColor = "bg-rose-500";
                  statusText = "⛔ ĐÃ HẾT DỊCH VỤ";
                } else if (isExpiringSoon) {
                  cardBorder = "border-amber-300 dark:border-amber-700/60 bg-amber-50/50 dark:bg-amber-950/20";
                  badgeBg = "bg-amber-100/80 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700/60 text-amber-950 dark:text-amber-200";
                  progressColor = "bg-amber-500";
                  statusText = `⚠️ Sắp hết ${serviceName} (Còn ${remaining} suất)`;
                }

                return (
                  <div
                    key={client.id}
                    className={`rounded-3xl border p-5 transition-all flex flex-col justify-between gap-4 shadow-xs hover:shadow-md ${cardBorder}`}
                  >
                    {/* Top Row: Avatar, Name, Status */}
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <img
                            src={client.avatarUrl}
                            alt={client.name}
                            className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <h4 
                              onClick={() => onSelectClientDetail && onSelectClientDetail(client)}
                              className="font-black text-slate-900 dark:text-white text-base hover:text-amber-600 transition-colors cursor-pointer whitespace-normal break-words leading-snug"
                            >
                              {client.name}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 font-medium">
                              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {client.phone}
                            </p>
                          </div>
                        </div>

                        <span className="text-xs font-black px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 shrink-0">
                          ⭐ {serviceName}
                        </span>
                      </div>

                      {/* Status Tag / Warning Box */}
                      <div>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1.5 rounded-xl ${badgeBg}`}>
                          {statusText}
                        </span>
                      </div>

                      {/* Usage Progress Bar & Detail Stats */}
                      <div className="space-y-2 pt-1 bg-slate-50/80 dark:bg-slate-950/40 p-3 rounded-2xl border border-slate-200/70 dark:border-slate-800">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-700 dark:text-slate-300 font-bold">Tiến độ sử dụng:</span>
                          <span className="text-slate-700 dark:text-slate-300 font-bold">
                            Còn <span className={`text-sm font-black ${isOutOfService ? 'text-rose-600 dark:text-rose-400' : isExpiringSoon ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>{remaining}</span>/{total} suất
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-300/80 dark:border-slate-700">
                          <div
                            className={`h-full transition-all rounded-full ${progressColor}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-800 dark:text-slate-200 font-semibold pt-0.5">
                          <span>Đã dùng: <strong className="text-slate-900 dark:text-white font-bold">{used}</strong> suất ({percent}%)</span>
                          {client.extraServicePrice ? (
                            <span className="text-emerald-700 dark:text-emerald-400 font-black">
                              Đã thu: {client.extraServicePrice.toLocaleString('vi-VN')} đ
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        disabled={isOutOfService}
                        onClick={() => {
                          setSelectedServiceClient(client);
                          setIsServiceCheckInOpen(true);
                        }}
                        className={`py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer ${
                          isOutOfService
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-700 cursor-not-allowed'
                            : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-sm'
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        {isOutOfService ? 'Đã hết suất' : 'Check-in Dịch vụ'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setRenewServiceClient(client);
                          setIsRenewServiceOpen(true);
                        }}
                        className="py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 active:scale-95 cursor-pointer shadow-2xs"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        Gia hạn thêm
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Service Check-in History Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <h3 className="font-black text-slate-900 dark:text-white text-lg">Nhật ký check-in dịch vụ thêm</h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  Lưu vết từng lần giao nhận bữa ăn / nước uống / khăn tập & xuất thẻ ảnh Zalo
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm lịch sử dịch vụ..."
                  value={serviceLogSearch}
                  onChange={(e) => {
                    setServiceLogSearch(e.target.value);
                    setServiceLogPage(1);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {filteredServiceLogs.length === 0 ? (
              <div className="py-10 text-center text-slate-500 text-sm bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                Chưa có lịch sử check-in dịch vụ thêm nào.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-black border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-3">Thời gian</th>
                        <th className="p-3">Học viên</th>
                        <th className="p-3">Dịch vụ</th>
                        <th className="p-3">Take Note / Ghi chú</th>
                        <th className="p-3 text-center">Suất còn lại</th>
                        <th className="p-3 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                      {paginatedServiceLogs.map(log => {
                        const client = clients.find(c => c.id === log.clientId);
                        const remCount = log.extraServicesRemainingAfter !== undefined
                          ? log.extraServicesRemainingAfter
                          : log.sessionsRemainingAfter;
                        return (
                          <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="p-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap font-medium">
                              {formatDateTime(log.timestamp)}
                            </td>
                            <td className="p-3 font-black text-slate-900 dark:text-white">
                              <div 
                                className="flex items-center gap-2 cursor-pointer hover:text-amber-600 transition-colors"
                                onClick={() => client && onSelectClientDetail && onSelectClientDetail(client)}
                              >
                                {client && <img src={client.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover shadow-sm border border-slate-200 dark:border-slate-700 shrink-0" />}
                                <span className="whitespace-normal break-words leading-snug">{log.clientName}</span>
                              </div>
                            </td>
                            <td className="p-3 font-black text-amber-900 dark:text-amber-300">
                              <span className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 rounded-md inline-block">
                                ⭐ {log.dayPlanName}
                              </span>
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-400 italic">
                              {log.notes || '-'}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2.5 py-1 rounded-full font-black text-xs inline-flex items-center gap-1 ${
                                remCount <= 0
                                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                  : remCount <= 3
                                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              }`}>
                                Còn {remCount} suất
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleShowServiceReceiptForLog(log)}
                                  className="text-xs text-amber-900 dark:text-amber-300 hover:text-slate-950 bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-800/50 border border-amber-300 dark:border-amber-700 px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all shadow-2xs cursor-pointer active:scale-95"
                                  title="Xuất thẻ ảnh điểm danh dịch vụ gửi Zalo"
                                >
                                  <Camera className="w-3.5 h-3.5" /> Thẻ check-in
                                </button>
                                <button
                                  onClick={() => setServiceCancelTarget({
                                    logId: log.id,
                                    clientName: log.clientName,
                                    serviceName: log.dayPlanName
                                  })}
                                  className="text-xs text-rose-700 dark:text-rose-400 hover:text-rose-800 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 border border-rose-200 dark:border-rose-800 px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all cursor-pointer"
                                  title="Hủy lượt check-in & hoàn lại +1 suất dịch vụ"
                                >
                                  <RotateCcw className="w-3.5 h-3.5 text-rose-600" /> Hủy (+1 Suất)
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Service History Pagination */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 font-medium">
                  <div>
                    Hiển thị <span className="font-bold text-slate-900 dark:text-white">{startServiceLogIndex + 1}</span> - <span className="font-bold text-slate-900 dark:text-white">{Math.min(startServiceLogIndex + SERVICE_LOGS_PER_PAGE, filteredServiceLogs.length)}</span> trên tổng số <span className="font-bold text-amber-700 dark:text-amber-400">{filteredServiceLogs.length}</span> lượt dịch vụ
                  </div>

                  <div className="flex items-center gap-1.5 self-center sm:self-auto">
                    <button
                      disabled={serviceLogPage === 1}
                      onClick={() => setServiceLogPage(prev => Math.max(1, prev - 1))}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 ${
                        serviceLogPage === 1
                          ? 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white hover:bg-slate-50'
                      }`}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Trang trước
                    </button>

                    <div className="flex items-center gap-1 px-2 font-bold text-slate-700 dark:text-slate-300">
                      Trang <span className="text-amber-700 dark:text-amber-400 font-black">{serviceLogPage}</span> / {totalServiceLogPages}
                    </div>

                    <button
                      disabled={serviceLogPage === totalServiceLogPages}
                      onClick={() => setServiceLogPage(prev => Math.min(totalServiceLogPages, prev + 1))}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 ${
                        serviceLogPage === totalServiceLogPages
                          ? 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white hover:bg-slate-50'
                      }`}
                    >
                      Trang sau <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      )}

      {/* Check-In Receipt Image Modal for Past Workout Session */}
      <CheckInReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        data={receiptModalData}
      />

      {/* Password Confirmation Modal for Cancel Workout Check-in */}
      <ConfirmPasswordModal
        isOpen={!!cancelTarget}
        title="Xác nhận mật khẩu hủy check-in buổi tập"
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

      {/* MODAL 1: Service Check-In Modal */}
      <ServiceCheckInModal
        isOpen={isServiceCheckInOpen}
        client={selectedServiceClient}
        onClose={() => {
          setIsServiceCheckInOpen(false);
          setSelectedServiceClient(null);
        }}
        onSuccess={(log, updatedClient) => {
          handleServiceCheckInSuccess(log, updatedClient);
        }}
        onOpenRenew={(c) => {
          setIsServiceCheckInOpen(false);
          setRenewServiceClient(c);
          setIsRenewServiceOpen(true);
        }}
      />

      {/* MODAL 2: Renew Extra Service Modal */}
      <RenewExtraServiceModal
        isOpen={isRenewServiceOpen}
        client={renewServiceClient}
        onClose={() => {
          setIsRenewServiceOpen(false);
          setRenewServiceClient(null);
        }}
        onSuccess={() => {
          setIsRenewServiceOpen(false);
          setRenewServiceClient(null);
          triggerToast(`✅ Đã gia hạn thành công dịch vụ thêm!`);
        }}
      />

      {/* MODAL 3: Service Receipt Zalo Ticket Modal */}
      <ServiceReceiptModal
        isOpen={isServiceReceiptOpen}
        onClose={() => {
          setIsServiceReceiptOpen(false);
          setServiceReceiptData(null);
        }}
        data={serviceReceiptData}
      />

      {/* MODAL 4: Password Protected Cancel Service Check-in */}
      <ConfirmPasswordModal
        isOpen={!!serviceCancelTarget}
        title="Xác nhận mật khẩu hủy check-in dịch vụ"
        description={serviceCancelTarget ? `Bạn đang yêu cầu HỦY lượt điểm danh ${serviceCancelTarget.serviceName || 'dịch vụ'} của ${serviceCancelTarget.clientName}. Thao tác này sẽ cộng lại +1 suất dịch vụ cho học viên.` : ''}
        confirmLabel="Xác nhận hủy & hoàn +1 suất"
        onClose={() => setServiceCancelTarget(null)}
        onConfirm={() => {
          if (serviceCancelTarget) {
            handleCancelServiceCheckIn(serviceCancelTarget.logId, serviceCancelTarget.clientName);
            setServiceCancelTarget(null);
          }
        }}
      />

    </div>
  );
};
