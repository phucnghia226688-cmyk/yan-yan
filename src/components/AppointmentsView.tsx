import { getTodayDateStr, getVNDateStr, parseDateLocal, getVNDate } from '../utils/dateUtils';
import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  User, 
  Users,
  CheckCircle2, 
  XCircle, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Zap, 
  Filter,
  Check,
  Dumbbell,
  AlertCircle,
  Edit3,
  LayoutGrid,
  SlidersHorizontal,
  CalendarDays,
  RotateCcw,
  ArrowUpDown,
  Copy,
  BarChart3,
  TrendingUp,
  Activity
} from 'lucide-react';
import { useGym } from '../context/GymContext';
import { Appointment, Client, DEFAULT_AVATAR_URL } from '../types';
import { SessionBadge } from './SessionBadge';
import { CheckInReceiptModal, CheckInReceiptData } from './CheckInReceiptModal';
import { ConfirmCheckInModal } from './ConfirmCheckInModal';
import { ConfirmAppointmentActionModal, AppointmentActionType } from './ConfirmAppointmentActionModal';
import { CheckInView } from './CheckInView';

interface AppointmentsViewProps {
  onOpenQuickCheckIn: (client?: any) => void;
  onGoToProgram: (clientId: string) => void;
  onSelectClientDetail?: (client: Client) => void;
}

export const AppointmentsView: React.FC<AppointmentsViewProps> = ({
  onSelectClientDetail,
  onOpenQuickCheckIn,
  onGoToProgram,
}) => {
  const { 
    clients, 
    appointments, 
    addAppointment, 
    updateAppointment, 
    updateAppointmentStatus, 
    deleteAppointment, 
    checkInClient,
    checkIns,
    cancelCheckIn
  } = useGym();

  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateStr());
  const [showQuickStats, setShowQuickStats] = useState<boolean>(true);

  // Quick report statistics calculations
  const todayStr = getTodayDateStr();
  const todayAppointments = appointments.filter(a => a.date === todayStr);
  const todayCompleted = todayAppointments.filter(a => a.status === 'Completed').length;
  const todayPending = todayAppointments.filter(a => a.status === 'Scheduled').length;
  const todayCheckIns = checkIns.filter(c => c.timestamp && c.timestamp.startsWith(todayStr));
  const activeClientsCount = clients.filter(c => c.remainingSessions > 0).length;
  const totalCompletedApts = appointments.filter(a => a.status === 'Completed').length;
  const completionRate = appointments.length > 0 
    ? Math.round((totalCompletedApts / appointments.length) * 100)
    : 0;
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<'All' | 'Scheduled' | 'Completed' | 'Cancelled'>('All');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  
  // Main view mode: 'day' | 'week' | 'month' (Default to 'day')
  const [mainViewMode, setMainViewMode] = useState<'day' | 'week' | 'month'>('day');
  
  // Time sorting order: 'newest' | 'oldest' (Default to 'oldest' / earliest time first)
  const [timeSortOrder, setTimeSortOrder] = useState<'newest' | 'oldest'>('oldest');

  // Detail section layout mode: 'grid' | 'horizontal' (Default to horizontal view)
  const [detailLayout, setDetailLayout] = useState<'grid' | 'horizontal'>('horizontal');

  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());

  // New appointment form state
  const [newClientId, setNewClientId] = useState<string>(clients.length > 0 ? clients[0].id : '');
  const [newTime, setNewTime] = useState<string>('08:00 - 09:00');
  const [newDate, setNewDate] = useState<string>(selectedDate);
  const [newDayPlan, setNewDayPlan] = useState<string>('Buổi tập định kỳ');

  // Edit appointment state
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [editDate, setEditDate] = useState<string>('');
  const [editTime, setEditTime] = useState<string>('');
  const [editDayPlan, setEditDayPlan] = useState<string>('');

  const handleOpenEditModal = (apt: Appointment) => {
    setEditingAppointment(apt);
    setEditDate(apt.date);
    setEditTime(apt.time);
    setEditDayPlan(apt.dayPlan || '');
  };

  const handleSaveEditAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAppointment) return;

    updateAppointment(editingAppointment.id, {
      date: editDate,
      time: editTime,
      dayPlan: editDayPlan
    });

    showToast(`✅ Đã đổi lịch hẹn cho ${editingAppointment.clientName} sang ${editTime} ngày ${editDate}`);
    setEditingAppointment(null);
  };

  // Time slot options (30-minute start interval, 60-minute duration)
  const timeSlots = [
    '06:00 - 07:00',
    '06:30 - 07:30',
    '07:00 - 08:00',
    '07:30 - 08:30',
    '08:00 - 09:00',
    '08:30 - 09:30',
    '09:00 - 10:00',
    '09:30 - 10:30',
    '10:00 - 11:00',
    '10:30 - 11:30',
    '11:00 - 12:00',
    '11:30 - 12:30',
    '12:00 - 13:00',
    '12:30 - 13:30',
    '13:00 - 14:00',
    '13:30 - 14:30',
    '14:00 - 15:00',
    '14:30 - 15:30',
    '15:00 - 16:00',
    '15:30 - 16:30',
    '16:00 - 17:00',
    '16:30 - 17:30',
    '17:00 - 18:00',
    '17:30 - 18:30',
    '18:00 - 19:00',
    '18:30 - 19:30',
    '19:00 - 20:00',
    '19:30 - 20:30',
    '20:00 - 21:00',
    '20:30 - 21:30',
    '21:00 - 22:00',
    '21:30 - 22:30',
    '22:00 - 23:00'
  ];

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Date helper
  const handleDateChange = (offsetDays: number) => {
    const current = parseDateLocal(selectedDate);
    current.setDate(current.getDate() + offsetDays);
    setSelectedDate(getVNDateStr(current));
  };

  const handleMonthChange = (offsetMonths: number) => {
    const newM = new Date(currentMonthDate);
    newM.setMonth(newM.getMonth() + offsetMonths);
    setCurrentMonthDate(newM);
  };

  // Month helper functions
  const getDaysInMonthGrid = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days = [];
    let startDayOfWeek = firstDay.getDay() - 1; // 0 = Mon
    if (startDayOfWeek === -1) startDayOfWeek = 6; // Sunday

    for (let i = 0; i < startDayOfWeek; i++) {
      const prevD = new Date(year, month, -startDayOfWeek + i + 1);
      const yyyy = prevD.getFullYear();
      const mm = String(prevD.getMonth() + 1).padStart(2, '0');
      const dd = String(prevD.getDate()).padStart(2, '0');
      days.push({ dateStr: `${yyyy}-${mm}-${dd}`, dayNum: prevD.getDate(), isCurrentMonth: false });
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const curD = new Date(year, month, d);
      const yyyy = curD.getFullYear();
      const mm = String(curD.getMonth() + 1).padStart(2, '0');
      const dd = String(curD.getDate()).padStart(2, '0');
      days.push({ dateStr: `${yyyy}-${mm}-${dd}`, dayNum: d, isCurrentMonth: true });
    }

    const totalSlots = Math.ceil(days.length / 7) * 7;
    const remaining = totalSlots - days.length;
    for (let i = 1; i <= remaining; i++) {
      const nextD = new Date(year, month + 1, i);
      const yyyy = nextD.getFullYear();
      const mm = String(nextD.getMonth() + 1).padStart(2, '0');
      const dd = String(nextD.getDate()).padStart(2, '0');
      days.push({ dateStr: `${yyyy}-${mm}-${dd}`, dayNum: i, isCurrentMonth: false });
    }

    return days;
  };

  // Week helper function: returns 7 days of the week containing dateStr
  const getWeekDays = (dateStr: string) => {
    const date = parseDateLocal(dateStr);
    const day = date.getDay(); // 0 = Sun, 1 = Mon...
    const diffToMon = date.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(date);
    mon.setDate(diffToMon);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(mon);
      d.setDate(mon.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const formattedStr = `${yyyy}-${mm}-${dd}`;
      days.push({
        dateStr: formattedStr,
        dayNum: d.getDate(),
        monthNum: d.getMonth() + 1,
        dayName: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'][i],
        fullDayName: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'][i],
        isToday: formattedStr === getTodayDateStr()
      });
    }
    return days;
  };

  // Handle Week Navigation
  const handleWeekChange = (offset: number) => {
    const curr = parseDateLocal(selectedDate);
    curr.setDate(curr.getDate() + offset * 7);
    setSelectedDate(getVNDateStr(curr));
  };

  const isToday = selectedDate === getTodayDateStr();

  // Helper to convert time string e.g. "08:00 - 09:00" to total minutes for chronological sorting
  const getTimeInMinutes = (timeStr: string) => {
    if (!timeStr) return 0;
    const startTime = timeStr.split('-')[0].trim();
    const parts = startTime.split(':');
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    return hours * 60 + minutes;
  };

  // Filter & sort appointments for selected date (deduplicated by ID or clientId+date+time+status)
  const seenDateAptKeys = new Set<string>();
  const dateAppointments = appointments
    .filter(a => {
      if (!a || a.date !== selectedDate) return false;
      if (filterStatus !== 'All' && a.status !== filterStatus) return false;
      const key = a.id || `${a.clientId}_${a.date}_${a.time}_${a.status}`;
      if (seenDateAptKeys.has(key)) return false;
      seenDateAptKeys.add(key);
      return true;
    })
    .sort((a, b) => {
      const getStatusRank = (status: string) => {
        if (status === 'Scheduled') return 1;
        if (status === 'Completed') return 2;
        if (status === 'Cancelled') return 3;
        return 1;
      };
      const rankA = getStatusRank(a.status);
      const rankB = getStatusRank(b.status);
      if (rankA !== rankB) return rankA - rankB;
      const timeA = getTimeInMinutes(a.time);
      const timeB = getTimeInMinutes(b.time);
      return timeSortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });

  // Handle Quick Add
  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find(c => c.id === newClientId);
    if (!client) return;

    addAppointment({
      clientId: client.id,
      clientName: client.name,
      clientAvatar: client.avatarUrl,
      time: newTime,
      date: newDate,
      status: 'Scheduled',
      dayPlan: newDayPlan
    });

    showToast(`✅ Đã đặt lịch hẹn cho ${client.name} lúc ${newTime} ngày ${newDate}`);
    setShowAddModal(false);
  };

  // Check-In Receipt Card Modal state
  const [receiptData, setReceiptData] = useState<CheckInReceiptData | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [lastReceiptAppointment, setLastReceiptAppointment] = useState<Appointment | null>(null);
  const [confirmingAptCheckIn, setConfirmingAptCheckIn] = useState<Appointment | null>(null);

  // State for confirm Delete / Cancel / Undo Appointment Modal
  const [pendingActionModal, setPendingActionModal] = useState<{
    actionType: AppointmentActionType;
    appointment: Appointment;
  } | null>(null);

  // Handle direct check-in from appointment card
  const handleCheckInFromAppointment = (
    apt: Appointment,
    customDayPlan?: string,
    customNotes?: string,
    customDateStr?: string
  ) => {
    const client = clients.find(c => c.id === apt.clientId);
    if (!client) {
      showToast('❌ Không tìm thấy thông tin học viên');
      return;
    }

    const dayPlanToUse = customDayPlan || apt.dayPlan || 'Buổi tập toàn thân (Full Body)';
    const notesToUse = customNotes !== undefined ? customNotes : `Check-in từ Lịch hẹn ${apt.time}`;

    const log = checkInClient(client.id, dayPlanToUse, notesToUse, apt.date);
    if (log) {
      updateAppointmentStatus(apt.id, 'Completed');
      showToast(`🎉 Check-in thành công cho ${client.name}! Trừ 1 buổi (Còn ${log.sessionsRemainingAfter} buổi)`);

      const totalSess = client.totalSessions || 20;
      const remSess = log.sessionsRemainingAfter;
      const compSess = Math.max(0, totalSess - remSess);

      // Format date display
      const dateParts = apt.date.split('-');
      let dateFormatted = customDateStr || apt.date;
      if (!customDateStr && dateParts.length === 3) {
        const dObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
        dateFormatted = dObj.toLocaleDateString('vi-VN', {
          weekday: 'long',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      }

      setReceiptData({
        clientName: client.name,
        avatarUrl: client.avatarUrl,
        packageName: client.packageName,
        totalSessions: totalSess,
        completedSessions: compSess,
        remainingSessions: remSess,
        checkInDateStr: dateFormatted,
        checkInTimeStr: apt.time,
        dayPlanName: dayPlanToUse,
        notes: notesToUse
      });
      setLastReceiptAppointment(apt);
      setShowReceiptModal(true);
    }
  };

  // Handle undo/revert check-in from completed appointment
  const handleUndoCheckIn = (apt: Appointment) => {
    const client = clients.find(c => c.id === apt.clientId);
    const clientName = client ? client.name : 'học viên';

    // Find matching check-in log for this client on this date
    const matchingLog = checkIns
      .filter(ci => ci.clientId === apt.clientId)
      .find(ci => (ci.timestamp && ci.timestamp.startsWith(apt.date)) || (ci.notes && ci.notes.includes(apt.time)))
      || checkIns.find(ci => ci.clientId === apt.clientId);

    if (matchingLog) {
      cancelCheckIn(matchingLog.id);
    }

    // Always revert appointment status back to 'Scheduled'
    updateAppointmentStatus(apt.id, 'Scheduled');

    showToast(`🔄 Đã hoàn check-in cho ${clientName}! Đã hoàn lại 1 buổi tập và chuyển về "Chờ tập"`);
  };

  // Open receipt card modal for an already completed appointment
  const handleViewReceiptForCompleted = (apt: Appointment) => {
    const client = clients.find(c => c.id === apt.clientId);
    if (!client) {
      showToast('❌ Không tìm thấy thông tin học viên');
      return;
    }
    const totalSess = client.totalSessions || 20;
    const remSess = client.remainingSessions;
    const compSess = Math.max(0, totalSess - remSess);

    const dateParts = apt.date.split('-');
    let dateFormatted = apt.date;
    if (dateParts.length === 3) {
      const dObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
      dateFormatted = dObj.toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }

    setReceiptData({
      clientName: client.name,
      avatarUrl: client.avatarUrl,
      packageName: client.packageName,
      totalSessions: totalSess,
      completedSessions: compSess,
      remainingSessions: remSess,
      checkInDateStr: dateFormatted,
      checkInTimeStr: apt.time,
      dayPlanName: apt.dayPlan,
      notes: undefined
    });
    setLastReceiptAppointment(apt);
    setShowReceiptModal(true);
  };

  const formatDateDisplay = (dateStr: string) => {
    const d = parseDateLocal(dateStr);
    const dayName = d.toLocaleDateString('vi-VN', { weekday: 'long' });
    const dayFormatted = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${dayName}, ${dayFormatted}`;
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white font-bold px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-bounce">
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Quick Report Statistics Panel */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 sm:p-5 rounded-3xl shadow-lg animate-fade-in text-white space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider">
              Báo Cáo Thống Kê Nhanh Trong Ngày & Tổng Quan
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-medium bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
            Cập nhật thời gian thực
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Today Appointments */}
          <div className="bg-slate-800/80 border border-slate-700/70 p-3.5 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Lịch hẹn hôm nay</span>
              <div className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-400">
                <CalendarIcon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-white">{todayAppointments.length}</span>
              <span className="text-xs text-slate-400 ml-1">buổi</span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400 border-t border-slate-700/50 pt-1.5">
              <span className="text-emerald-400 font-bold">✓ {todayCompleted} xong</span>
              <span>•</span>
              <span className="text-amber-400 font-bold">⏳ {todayPending} chờ</span>
            </div>
          </div>

          {/* Today Check-ins */}
          <div className="bg-slate-800/80 border border-slate-700/70 p-3.5 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Check-in hôm nay</span>
              <div className="p-1.5 rounded-xl bg-lime-500/20 text-lime-400">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-lime-400">{todayCheckIns.length}</span>
              <span className="text-xs text-slate-400 ml-1">lượt</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-400 border-t border-slate-700/50 pt-1.5 truncate">
              <span>Nhật ký điểm danh trừ buổi</span>
            </div>
          </div>

          {/* Active Clients */}
          <div className="bg-slate-800/80 border border-slate-700/70 p-3.5 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Học viên đang tập</span>
              <div className="p-1.5 rounded-xl bg-blue-500/20 text-blue-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-blue-400">{activeClientsCount}</span>
              <span className="text-xs text-slate-400 ml-1">/ {clients.filter(c => c.status !== 'closed').length} HV</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-400 border-t border-slate-700/50 pt-1.5 truncate">
              <span>Còn buổi tập hoạt động</span>
            </div>
          </div>

          {/* Completion Rate */}
          <div className="bg-slate-800/80 border border-slate-700/70 p-3.5 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Tỷ lệ hoàn thành</span>
              <div className="p-1.5 rounded-xl bg-purple-500/20 text-purple-400">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-purple-400">{completionRate}%</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-400 border-t border-slate-700/50 pt-1.5 truncate">
              <span>{totalCompletedApts} buổi đã hoàn tất</span>
            </div>
          </div>
        </div>
      </div>


      {/* Header */}
      <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#4F46E5] bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full uppercase tracking-wider">
            Lịch Hẹn Huấn Luyện PT
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-2 flex items-center gap-2">
            <CalendarIcon className="w-7 h-7 text-[#4F46E5]" />
            Lịch tập học viên chi tiết
          </h2>
          <p className="text-sm text-slate-500 mt-0.5 font-medium">
            Quản lý giờ tập cá nhân theo từng khung giờ - Không lo trùng ca hay quên lịch học viên!
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
          <div className="bg-slate-100 p-1 rounded-2xl border border-slate-200 flex items-center gap-0.5 sm:gap-1">
            <button
              onClick={() => setMainViewMode('day')}
              className={`px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${
                mainViewMode === 'day' ? 'bg-[#4F46E5] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" /> Theo Ngày
            </button>
            <button
              onClick={() => setMainViewMode('week')}
              className={`px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${
                mainViewMode === 'week' ? 'bg-[#4F46E5] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" /> Theo Tuần
            </button>
            <button
              onClick={() => setMainViewMode('month')}
              className={`px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${
                mainViewMode === 'month' ? 'bg-[#4F46E5] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" /> Theo Tháng
            </button>
          </div>

          <button
            onClick={() => onOpenQuickCheckIn()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-2xl sm:rounded-full text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5 active:scale-95 shrink-0 cursor-pointer"
          >
            <Zap className="w-4 h-4 shrink-0 fill-white" />
            <span>Chèn khách</span>
          </button>
          <button
            onClick={() => {
              setNewDate(selectedDate);
              setShowAddModal(true);
            }}
            className="bg-[#FF4E00] hover:bg-orange-600 text-white font-extrabold px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-2xl sm:rounded-full text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5 active:scale-95 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Đặt Lịch Mới</span>
          </button>
        </div>
      </div>

      {/* Date Navigation & Filter Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-3xl shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
        
        {/* Date Controls */}
        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-start">
          <button
            onClick={() => handleDateChange(-1)}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700 transition-colors"
            title="Ngày trước"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-900 font-bold rounded-2xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
            />
            <span className="text-sm font-bold text-slate-700 capitalize hidden sm:inline">
              ({formatDateDisplay(selectedDate)})
            </span>
          </div>

          <button
            onClick={() => handleDateChange(1)}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700 transition-colors"
            title="Ngày sau"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {!isToday && (
            <button
              onClick={() => setSelectedDate(getTodayDateStr())}
              className="bg-indigo-50 hover:bg-indigo-100 text-[#4F46E5] font-bold text-xs px-3.5 py-2 rounded-full border border-indigo-200 transition-colors"
            >
              Hôm nay
            </button>
          )}
        </div>

        {/* Quick Date Chips (Hôm nay, Mồng x...) */}
        <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto py-1 scrollbar-none">
          <span className="text-xs font-bold text-slate-400 shrink-0">Lọc trạng thái:</span>
          {(['All', 'Scheduled', 'Completed', 'Cancelled'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`text-xs font-black px-3.5 py-1.5 rounded-full border transition-all whitespace-nowrap cursor-pointer shadow-2xs ${
                filterStatus === st
                  ? st === 'Completed'
                    ? 'bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-400/40 shadow-xs'
                    : st === 'Cancelled'
                    ? 'bg-rose-600 text-white border-rose-700 ring-2 ring-rose-400/40 shadow-xs'
                    : st === 'Scheduled'
                    ? 'bg-amber-500 text-white border-amber-600 ring-2 ring-amber-400/40 shadow-xs'
                    : 'bg-slate-900 text-white border-slate-900 ring-2 ring-slate-400/40'
                  : st === 'Completed'
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200'
                  : st === 'Cancelled'
                  ? 'bg-rose-100 text-rose-900 border-rose-300 hover:bg-rose-200'
                  : st === 'Scheduled'
                  ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                  : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
              }`}
            >
              {st === 'All' && 'Tất cả'}
              {st === 'Scheduled' && '🟡 Đang chờ'}
              {st === 'Completed' && '🟢 Đã tập (Check-in)'}
              {st === 'Cancelled' && '🔴 Đã hủy'}
            </button>
          ))}
        </div>

      </div>



      {/* 2. WEEK VIEW MODE */}
      {mainViewMode === 'week' && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleWeekChange(-1)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition-colors"
                title="Tuần trước"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chế độ xem Tuần</span>
                <h3 className="font-black text-slate-900 text-lg">
                  Tuần: {getWeekDays(selectedDate)[0].dayNum}/{getWeekDays(selectedDate)[0].monthNum} - {getWeekDays(selectedDate)[6].dayNum}/{getWeekDays(selectedDate)[6].monthNum}
                </h3>
              </div>
              <button
                onClick={() => handleWeekChange(1)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition-colors"
                title="Tuần sau"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={() => setSelectedDate(getTodayDateStr())}
              className="text-xs font-bold text-[#4F46E5] bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3.5 py-1.5 rounded-full transition-colors"
            >
              Tuần hiện tại
            </button>
          </div>

          {/* 7 Days Columns for Week View */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-2">
            {getWeekDays(selectedDate).map((dayObj) => {
              const dayApts = appointments.filter(a => {
                if (a.date !== dayObj.dateStr) return false;
                if (filterStatus !== 'All' && a.status !== filterStatus) return false;
                return true;
              });
              const isSelected = selectedDate === dayObj.dateStr;

              return (
                <div
                  key={dayObj.dateStr}
                  onClick={() => setSelectedDate(dayObj.dateStr)}
                  className={`min-h-[140px] p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-2 border-[#4F46E5] bg-indigo-50/50 shadow-xs'
                      : dayObj.isToday
                      ? 'border-2 border-[#FF4E00] bg-orange-50/30'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                      <div>
                        <span className="text-[10px] font-black text-slate-400 block uppercase">{dayObj.dayName}</span>
                        <span className={`text-sm font-black ${
                          dayObj.isToday ? 'text-[#FF4E00]' : isSelected ? 'text-[#4F46E5]' : 'text-slate-800'
                        }`}>
                          {dayObj.dayNum}/{dayObj.monthNum}
                        </span>
                      </div>
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-slate-900 text-white">
                        {dayApts.length}
                      </span>
                    </div>

                    {/* Preview list */}
                    <div className="space-y-1 mt-2">
                      {dayApts.slice(0, 3).map((a) => {
                        const startHour = a.time.split(' - ')[0] || a.time;
                        const hourShort = startHour.replace(':00', 'h');
                        return (
                          <div
                            key={a.id}
                            className={`text-[10px] font-bold p-1 rounded-md truncate ${
                              a.status === 'Completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : a.status === 'Cancelled'
                                ? 'bg-rose-100 text-rose-800 line-through'
                                : 'bg-indigo-100 text-indigo-900'
                            }`}
                          >
                            <span className="font-extrabold">{hourShort}</span> {a.clientName.split(' ').pop()}
                          </div>
                        );
                      })}
                      {dayApts.length > 3 && (
                        <p className="text-[9px] font-bold text-slate-500 text-center">+ {dayApts.length - 3} ca</p>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <div className="mt-2 text-center text-[9px] font-extrabold text-[#4F46E5] bg-indigo-100/80 py-0.5 rounded-md">
                      Đang chọn
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. MONTHLY CALENDAR VIEW MODE */}
      {mainViewMode === 'month' && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleMonthChange(-1)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition-colors"
                title="Tháng trước"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="font-black text-slate-900 text-lg">
                Tháng {currentMonthDate.getMonth() + 1} / {currentMonthDate.getFullYear()}
              </h3>
              <button
                onClick={() => handleMonthChange(1)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition-colors"
                title="Tháng sau"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={() => setCurrentMonthDate(new Date())}
              className="text-xs font-bold text-[#4F46E5] bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3.5 py-1.5 rounded-full transition-colors"
            >
              Tháng hiện tại
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-black text-slate-500 uppercase tracking-wider py-1">
            <div className="py-1 bg-slate-50 rounded-lg">T2</div>
            <div className="py-1 bg-slate-50 rounded-lg">T3</div>
            <div className="py-1 bg-slate-50 rounded-lg">T4</div>
            <div className="py-1 bg-slate-50 rounded-lg">T5</div>
            <div className="py-1 bg-slate-50 rounded-lg">T6</div>
            <div className="py-1 bg-slate-50 rounded-lg">T7</div>
            <div className="py-1 bg-rose-50 text-rose-600 rounded-lg">CN</div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {getDaysInMonthGrid(currentMonthDate).map((dayObj, idx) => {
              const dayApts = appointments.filter(a => {
                if (a.date !== dayObj.dateStr) return false;
                if (filterStatus !== 'All' && a.status !== filterStatus) return false;
                return true;
              });
              const isSelected = selectedDate === dayObj.dateStr;
              const isTodayCell = dayObj.dateStr === getTodayDateStr();

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDate(dayObj.dateStr)}
                  className={`min-h-[90px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-2 border-[#4F46E5] bg-indigo-50/40 shadow-xs'
                      : isTodayCell
                      ? 'border-2 border-[#FF4E00] bg-orange-50/30'
                      : dayObj.isCurrentMonth
                      ? 'bg-white border-slate-200 hover:border-slate-300'
                      : 'bg-slate-50/50 border-slate-100 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-black ${
                      isTodayCell
                        ? 'bg-[#FF4E00] text-white px-2 py-0.5 rounded-full'
                        : isSelected
                        ? 'bg-[#4F46E5] text-white px-2 py-0.5 rounded-full'
                        : dayObj.isCurrentMonth
                        ? 'text-slate-800'
                        : 'text-slate-400'
                    }`}>
                      {dayObj.dayNum}
                    </span>
                    {dayApts.length > 0 && (
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-slate-900 text-white">
                        {dayApts.length}
                      </span>
                    )}
                  </div>

                  {/* Appointments Preview inside cell */}
                  <div className="space-y-1 mt-1 overflow-hidden">
                    {dayApts.slice(0, 3).map(a => {
                      const startHour = a.time.split(' - ')[0] || a.time;
                      const hourShort = startHour.replace(':00', 'h');
                      const aptClient = clients.find(c => c.id === a.clientId);
                      const isGroup = aptClient?.trainingType === 'ca_nhom';
                      return (
                        <div
                          key={a.id}
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md truncate flex items-center justify-between ${
                            a.status === 'Completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : a.status === 'Cancelled'
                              ? 'bg-rose-100 text-rose-800 line-through'
                              : isGroup
                              ? 'bg-purple-100 text-purple-900 border border-purple-200'
                              : 'bg-indigo-100 text-indigo-900'
                          }`}
                          title={`${a.time}: ${a.clientName}${isGroup ? ' (Ca nhóm)' : ' (1/1)'}`}
                        >
                          <span className="truncate">{hourShort} {a.clientName.split(' ').pop()} {isGroup ? '👥' : ''}</span>
                        </div>
                      );
                    })}
                    {dayApts.length > 3 && (
                      <p className="text-[9px] font-bold text-slate-500 text-center">+ {dayApts.length - 3} lịch khác</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. UNIFIED DAY VIEW & APPOINTMENTS LIST SECTION */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 space-y-6">
        
        {/* Header Bar */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Lịch Tập Ngày
            </span>
            <h3 className="font-black text-slate-900 text-xl flex items-center gap-2 mt-0.5">
              <Clock className="w-5 h-5 text-[#4F46E5]" />
              {formatDateDisplay(selectedDate)}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Hiển thị {dateAppointments.length} ca tập trong ngày đã chọn
            </p>
          </div>

          {/* Controls: Date Prev/Next/Today + Time Sort + Layout Toggle */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-between lg:justify-end">
            
            {/* Date Navigation */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                onClick={() => handleDateChange(-1)}
                className="p-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1 shadow-2xs"
                title="Ngày trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedDate(getTodayDateStr())}
                className={`px-3 py-1.5 font-bold text-xs rounded-xl border transition-all ${
                  isToday
                    ? 'bg-[#FF4E00] text-white border-[#FF4E00] shadow-xs'
                    : 'bg-white text-[#4F46E5] border-slate-200 hover:bg-indigo-50'
                }`}
              >
                Hôm nay
              </button>
              <button
                onClick={() => handleDateChange(1)}
                className="p-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1 shadow-2xs"
                title="Ngày sau"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Time Sort Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                onClick={() => setTimeSortOrder('newest')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  timeSortOrder === 'newest'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Sắp xếp thời gian từ mới nhất đến sớm nhất"
              >
                <ArrowUpDown className="w-3.5 h-3.5" /> Mới nhất
              </button>
              <button
                onClick={() => setTimeSortOrder('oldest')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  timeSortOrder === 'oldest'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Sắp xếp thời gian từ sớm nhất đến muộn nhất"
              >
                Sớm nhất
              </button>
            </div>

            {/* Layout Toggle */}
            <div className="bg-slate-100 p-1 rounded-2xl border border-slate-200 flex items-center gap-1">
              <button
                onClick={() => setDetailLayout('grid')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  detailLayout === 'grid'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Hiển thị dạng thẻ Lưới"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-[#4F46E5]" /> Lưới
              </button>
              <button
                onClick={() => setDetailLayout('horizontal')}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  detailLayout === 'horizontal'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Hiển thị dạng Dòng Ngang"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#FF4E00]" /> Ngang
              </button>
            </div>

          </div>
        </div>

        {/* Quick Summary Cards for Selected Day */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-indigo-50/80 border border-indigo-200 p-3.5 rounded-2xl shadow-2xs">
            <p className="text-[11px] font-extrabold text-indigo-700 uppercase tracking-wider">Tổng Lịch Hẹn</p>
            <p className="text-2xl font-black text-indigo-900 mt-1">{dateAppointments.length} <span className="text-xs font-bold">ca</span></p>
          </div>
          <div className="bg-amber-50/90 border border-amber-200 p-3.5 rounded-2xl shadow-2xs">
            <p className="text-[11px] font-extrabold text-amber-800 uppercase tracking-wider">Chờ Tập</p>
            <p className="text-2xl font-black text-amber-950 mt-1">
              {dateAppointments.filter(a => a.status === 'Scheduled').length} <span className="text-xs font-bold">ca</span>
            </p>
          </div>
          <div className="bg-emerald-100/80 border-2 border-emerald-300 p-3.5 rounded-2xl shadow-2xs">
            <p className="text-[11px] font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1">
              <span>🟢 Đã Tập (Check-in)</span>
            </p>
            <p className="text-2xl font-black text-emerald-950 mt-1">
              {dateAppointments.filter(a => a.status === 'Completed').length} <span className="text-xs font-bold">ca</span>
            </p>
          </div>
          <div className="bg-rose-100/80 border-2 border-rose-300 p-3.5 rounded-2xl shadow-2xs">
            <p className="text-[11px] font-black text-rose-900 uppercase tracking-wider flex items-center gap-1">
              <span>🔴 Đã Hủy</span>
            </p>
            <p className="text-2xl font-black text-rose-950 mt-1">
              {dateAppointments.filter(a => a.status === 'Cancelled').length} <span className="text-xs font-bold">ca</span>
            </p>
          </div>
        </div>

        {dateAppointments.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-bold text-slate-700 text-base">Chưa có lịch hẹn nào trong ngày này</p>
            <p className="text-xs text-slate-500 mt-1">Bấm nút "Đặt Lịch Hẹn Mới" để lên lịch tập cho học viên</p>
            <button
              onClick={() => {
                setNewDate(selectedDate);
                setShowAddModal(true);
              }}
              className="mt-4 bg-[#4F46E5] hover:bg-indigo-600 text-white font-bold text-xs px-5 py-2.5 rounded-full transition-all shadow"
            >
              + Lên Lịch Tập Ngay
            </button>
          </div>
        ) : detailLayout === 'grid' ? (
          /* GRID LAYOUT */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dateAppointments.map((apt) => {
              const client = clients.find(c => c.id === apt.clientId);
              const remaining = client ? client.remainingSessions : 0;

              return (
                <div
                  key={apt.id}
                  className={`p-5 rounded-2xl transition-all flex flex-col justify-between space-y-4 shadow-2xs ${
                    apt.status === 'Completed'
                      ? 'bg-emerald-50/90 border-2 border-emerald-300/90 shadow-xs'
                      : apt.status === 'Cancelled'
                      ? 'bg-rose-50/90 border-2 border-rose-300/90 shadow-xs opacity-85'
                      : 'bg-white border border-slate-200/90 hover:border-[#4F46E5]'
                  }`}
                >
                  {/* Top info */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-black text-slate-800 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#4F46E5]" /> {apt.time}
                      </span>

                      <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border shadow-2xs ${
                        apt.status === 'Scheduled'
                          ? 'bg-amber-500 text-white border-amber-600'
                          : apt.status === 'Completed'
                          ? 'bg-emerald-600 text-white border-emerald-700'
                          : 'bg-rose-600 text-white border-rose-700'
                      }`}>
                        {apt.status === 'Scheduled' && '🟡 Chờ tập'}
                        {apt.status === 'Completed' && '🟢 Đã tập'}
                        {apt.status === 'Cancelled' && '🔴 Hủy lịch'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => client && onSelectClientDetail(client)} title="Bấm để xem hồ sơ học viên">
                      <img
                        src={apt.clientAvatar || client?.avatarUrl || DEFAULT_AVATAR_URL}
                        alt={apt.clientName}
                        className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-xs"
                      />
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-base leading-tight flex items-center gap-1.5 flex-wrap">
                          {apt.clientName}
                          {client?.trainingType === 'ca_nhom' ? (
                            <span className="text-[10px] font-extrabold bg-purple-100 text-purple-900 border border-purple-300 px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-2xs">
                              <Users className="w-2.5 h-2.5 text-purple-600 fill-purple-200" /> Ca Nhóm
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                              <User className="w-2.5 h-2.5 text-sky-600" /> 1/1
                            </span>
                          )}
                        </h4>
                        
                        {/* Warning session badges */}
                        {client && (
                          <div className="mt-1">
                            <SessionBadge client={client} size="sm" />
                          </div>
                        )}
                      </div>
                    </div>

                    {apt.dayPlan && (
                      <div className="mt-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <Dumbbell className="w-3.5 h-3.5 text-[#FF4E00]" />
                        <span>Giáo án: {apt.dayPlan}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    {apt.status === 'Scheduled' && (
                      <button
                        onClick={() => setConfirmingAptCheckIn(apt)}
                        className="flex-1 bg-[#84cc16] hover:bg-[#65a30d] text-white font-extrabold text-xs py-2 px-3 rounded-xl transition-all shadow flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5 fill-white" /> Check-in Ngay
                      </button>
                    )}

                    {apt.status === 'Completed' && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Đã tập
                        </span>
                        <button
                          onClick={() => handleViewReceiptForCompleted(apt)}
                          className="bg-indigo-50 hover:bg-indigo-100 text-[#4F46E5] font-bold text-xs py-1 px-2.5 rounded-xl border border-indigo-200 transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                          title="Xem thẻ xác nhận điểm danh & sao chép nhắn Zalo"
                        >
                          <Copy className="w-3 h-3 text-[#4F46E5]" /> Thẻ Zalo
                        </button>
                        <button
                          onClick={() => setPendingActionModal({ actionType: 'undo_checkin', appointment: apt })}
                          className="bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs py-1 px-2.5 rounded-xl border border-amber-200 transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                          title="Hoàn check-in (cộng lại 1 buổi tập cho học viên)"
                        >
                          <RotateCcw className="w-3 h-3 text-amber-600" /> Hoàn check-in
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(apt)}
                        className="p-1.5 text-slate-400 hover:text-[#4F46E5] hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        title="Tùy chỉnh / Đổi lịch tập"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {apt.status === 'Scheduled' && (
                        <button
                          onClick={() => setPendingActionModal({ actionType: 'cancel', appointment: apt })}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hủy ca tập này"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => setPendingActionModal({ actionType: 'delete', appointment: apt })}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Xóa lịch hẹn"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          /* HORIZONTAL ROW LAYOUT */
          <div className="flex flex-col gap-3.5">
            {dateAppointments.map((apt) => {
              const client = clients.find(c => c.id === apt.clientId);
              const remaining = client ? client.remainingSessions : 0;

              return (
                <div
                  key={apt.id}
                  className={`p-4 rounded-2xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs ${
                    apt.status === 'Completed'
                      ? 'bg-emerald-50/90 border-2 border-emerald-300/90 shadow-xs'
                      : apt.status === 'Cancelled'
                      ? 'bg-rose-50/90 border-2 border-rose-300/90 shadow-xs opacity-85'
                      : 'bg-white border border-slate-200/90 hover:border-[#4F46E5]'
                  }`}
                >
                  {/* Left block: Time, Client info, Plan */}
                  <div className="flex flex-wrap items-center gap-4 flex-1">
                    {/* Time & Status Badge */}
                    <div className="flex flex-col items-center justify-center bg-slate-100/90 border border-slate-200 px-3.5 py-2 rounded-2xl shrink-0 min-w-[100px]">
                      <span className="text-xs font-black text-slate-900 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#4F46E5]" /> {apt.time}
                      </span>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border mt-1 shadow-2xs ${
                        apt.status === 'Scheduled'
                          ? 'bg-amber-500 text-white border-amber-600'
                          : apt.status === 'Completed'
                          ? 'bg-emerald-600 text-white border-emerald-700'
                          : 'bg-rose-600 text-white border-rose-700'
                      }`}>
                        {apt.status === 'Scheduled' && '🟡 Chờ tập'}
                        {apt.status === 'Completed' && '🟢 Đã tập'}
                        {apt.status === 'Cancelled' && '🔴 Hủy lịch'}
                      </span>
                    </div>

                    {/* Avatar & Name */}
                    <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => client && onSelectClientDetail(client)} title="Bấm để xem hồ sơ học viên">
                      <img
                        src={apt.clientAvatar || client?.avatarUrl || DEFAULT_AVATAR_URL}
                        alt={apt.clientName}
                        className="w-11 h-11 rounded-2xl object-cover border border-slate-200"
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-slate-900 text-base">{apt.clientName}</h4>
                          {client?.trainingType === 'ca_nhom' ? (
                            <span className="text-[10px] font-extrabold bg-purple-100 text-purple-900 border border-purple-300 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                              <Users className="w-2.5 h-2.5 text-purple-600" /> Ca Nhóm
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                              <User className="w-2.5 h-2.5 text-sky-600" /> 1/1
                            </span>
                          )}
                        </div>

                        {/* Additional info tags */}
                        <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-slate-500">
                          {apt.dayPlan && (
                            <span className="font-semibold text-slate-700 flex items-center gap-1 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                              <Dumbbell className="w-3 h-3 text-[#FF4E00]" /> {apt.dayPlan}
                            </span>
                          )}
                          {client && (
                            <SessionBadge client={client} size="sm" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right block: Action Buttons */}
                  <div className="flex items-center justify-between md:justify-end gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                    {apt.status === 'Scheduled' && (
                      <button
                        onClick={() => setConfirmingAptCheckIn(apt)}
                        className="bg-[#84cc16] hover:bg-[#65a30d] text-white font-extrabold text-xs py-2 px-4 rounded-xl transition-all shadow flex items-center gap-1.5 active:scale-95 cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5 fill-white" /> Check-in Ngay
                      </button>
                    )}

                    {apt.status === 'Completed' && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 bg-emerald-100/60 px-2.5 py-1 rounded-xl border border-emerald-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Đã hoàn thành
                        </span>
                        <button
                          onClick={() => handleViewReceiptForCompleted(apt)}
                          className="bg-indigo-50 hover:bg-indigo-100 text-[#4F46E5] font-bold text-xs py-1.5 px-3 rounded-xl border border-indigo-200 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                          title="Xem thẻ xác nhận điểm danh & sao chép nhắn Zalo"
                        >
                          <Copy className="w-3.5 h-3.5 text-[#4F46E5]" /> Thẻ Zalo
                        </button>
                        <button
                          onClick={() => setPendingActionModal({ actionType: 'undo_checkin', appointment: apt })}
                          className="bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs py-1.5 px-3 rounded-xl border border-amber-200 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                          title="Hoàn check-in (cộng lại 1 buổi tập cho học viên)"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-amber-600" /> Hoàn check-in
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-1 border-l pl-2 border-slate-200">
                      <button
                        onClick={() => handleOpenEditModal(apt)}
                        className="p-2 text-slate-400 hover:text-[#4F46E5] hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        title="Tùy chỉnh / Đổi lịch tập"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {apt.status === 'Scheduled' && (
                        <button
                          onClick={() => setPendingActionModal({ actionType: 'cancel', appointment: apt })}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hủy ca tập này"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => setPendingActionModal({ actionType: 'delete', appointment: apt })}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Xóa lịch hẹn"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Integrated Check-In History Log Component */}
      <div className="mt-8 pt-8 border-t-2 border-slate-200/80">
        <CheckInView
          onOpenQuickCheckIn={onOpenQuickCheckIn}
          onGoToProgram={onGoToProgram}
          onSelectClientDetail={onSelectClientDetail}
        />
      </div>

      {/* Add Appointment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-scale-up">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-[#4F46E5]" />
                Đặt Lịch Hẹn Tập Mới
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-4 mt-4">
              
              {/* Select Client */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Chọn học viên</label>
                <select
                  value={newClientId}
                  onChange={(e) => setNewClientId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Còn {c.remainingSessions} buổi)
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Ngày Tập</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                />
              </div>

              {/* Time Slot */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Khung Giờ Tập</label>
                <select
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                >
                  {timeSlots.map(ts => (
                    <option key={ts} value={ts}>{ts}</option>
                  ))}
                </select>
              </div>

              {/* Day Plan */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Nội dung / Giáo án (Tùy chọn)</label>
                <input
                  type="text"
                  value={newDayPlan}
                  onChange={(e) => setNewDayPlan(e.target.value)}
                  placeholder="e.g. Day 1 - Ngực & Tay sau"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                />
              </div>

              {/* Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-full"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="bg-[#4F46E5] hover:bg-indigo-600 text-white font-extrabold px-6 py-2.5 rounded-full text-xs shadow-md transition-all"
                >
                  Xác nhận đặt lịch
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* EDIT / RESCHEDULE APPOINTMENT MODAL */}
      {editingAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-scale-up">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-[#4F46E5]" />
                  Đổi Lịch Tập: {editingAppointment.clientName}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Tùy chỉnh ngày, giờ hoặc giáo án buổi tập</p>
              </div>
              <button
                onClick={() => setEditingAppointment(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditAppointment} className="space-y-4 mt-4">
              
              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Ngày Tập Mới</label>
                <input
                  type="date"
                  required
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                />
              </div>

              {/* Time Slot */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Khung Giờ Mới</label>
                <select
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                >
                  {timeSlots.map(ts => (
                    <option key={ts} value={ts}>{ts}</option>
                  ))}
                </select>
              </div>

              {/* Day Plan */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Nội dung / Giáo án</label>
                <input
                  type="text"
                  value={editDayPlan}
                  onChange={(e) => setEditDayPlan(e.target.value)}
                  placeholder="e.g. Day 1 - Ngực & Tay sau"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                />
              </div>

              {/* Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingAppointment(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-full"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="bg-[#FF4E00] hover:bg-orange-600 text-white font-extrabold px-6 py-2.5 rounded-full text-xs shadow-md transition-all active:scale-95"
                >
                  Lưu Thay Đổi
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Check-In Confirmation & Receipt Card Modal */}
      <CheckInReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        data={receiptData}
        onUndoCheckIn={
          lastReceiptAppointment
            ? () => handleUndoCheckIn(lastReceiptAppointment)
            : undefined
        }
      />

      {/* Confirmation Modal before executing check-in */}
      {(() => {
        const clientForConfirm = confirmingAptCheckIn ? clients.find(c => c.id === confirmingAptCheckIn.clientId) : null;
        return (
          <ConfirmCheckInModal
            isOpen={!!confirmingAptCheckIn && !!clientForConfirm}
            clientName={clientForConfirm?.name || ''}
            avatarUrl={clientForConfirm?.avatarUrl}
            packageName={clientForConfirm?.packageName}
            remainingSessions={clientForConfirm?.remainingSessions}
            clientType={clientForConfirm?.clientType}
            dayPlanName={confirmingAptCheckIn?.dayPlan}
            onClose={() => setConfirmingAptCheckIn(null)}
            onConfirm={(editedPlan, editedNotes, editedDateStr) => {
              if (confirmingAptCheckIn) {
                const aptToProcess = confirmingAptCheckIn;
                setConfirmingAptCheckIn(null);
                handleCheckInFromAppointment(aptToProcess, editedPlan, editedNotes, editedDateStr);
              }
            }}
          />
        );
      })()}

      {/* Confirmation Modal before executing Delete / Cancel / Undo Appointment */}
      {(() => {
        if (!pendingActionModal) return null;
        const apt = pendingActionModal.appointment;
        const client = clients.find(c => c.id === apt.clientId);

        return (
          <ConfirmAppointmentActionModal
            isOpen={!!pendingActionModal}
            actionType={pendingActionModal.actionType}
            clientName={apt.clientName || client?.name || 'Học viên'}
            avatarUrl={apt.clientAvatar || client?.avatarUrl}
            packageName={client?.packageName}
            remainingSessions={client?.remainingSessions}
            dayPlanName={apt.dayPlan}
            dateStr={apt.date}
            timeStr={apt.time}
            onClose={() => setPendingActionModal(null)}
            onConfirm={() => {
              const { actionType, appointment } = pendingActionModal;
              setPendingActionModal(null);
              if (actionType === 'cancel') {
                updateAppointmentStatus(appointment.id, 'Cancelled');
                showToast(`🔴 Đã chuyển trạng thái sang "Hủy lịch" cho ${appointment.clientName}`);
              } else if (actionType === 'delete') {
                deleteAppointment(appointment.id);
                showToast(`🗑️ Đã xóa lịch hẹn của ${appointment.clientName}`);
              } else if (actionType === 'undo_checkin') {
                handleUndoCheckIn(appointment);
              }
            }}
          />
        );
      })()}


    </div>
  );
};
