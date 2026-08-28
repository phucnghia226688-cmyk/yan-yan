import { getTodayDateStr, getVNDate } from '../utils/dateUtils';

import React, { useState } from 'react';
import { 
  Users, 
  TrendingUp, 
  Wallet, 
  DollarSign, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  Cake, 
  Zap, 
  PlusCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  ChevronRight,
  Phone,
  MessageCircle,
  CheckCircle2,
  Dumbbell,
  History,
  X,
  Search,
  Check,
  Plus,
  UserCheck
} from 'lucide-react';
import { useGym } from '../context/GymContext';
import { useTenant } from '../context/TenantContext';
import { Client, DEFAULT_AVATAR_URL } from '../types';

interface DashboardViewProps {
  onOpenQuickCheckIn: (client?: Client) => void;
  onSelectClientDetail: (client: Client) => void;
  setActiveTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenQuickCheckIn,
  onSelectClientDetail,
  setActiveTab
}) => {
  const { clients, payments, expenses, appointments, updateAppointmentStatus, addAppointment } = useGym();
  const { isMasterAdmin } = useTenant();

  // Toast notification state
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Emergency Appointment Modal States
  const [showEmergencyModal, setShowEmergencyModal] = useState<boolean>(false);
  const [emergencyClientId, setEmergencyClientId] = useState<string>('');
  const [emergencyClientSearch, setEmergencyClientSearch] = useState<string>('');
  const [emergencyTime, setEmergencyTime] = useState<string>('09:00 - 10:00');
  const [emergencyDayPlan, setEmergencyDayPlan] = useState<string>('Lịch hẹn đột xuất / Chèn lịch');
  const [emergencyDate, setEmergencyDate] = useState<string>(getTodayDateStr());

  // Current month filtering (e.g. July 2026)
  const today = getVNDate();
  const currentMonth = today.getMonth(); // 0-11
  const currentYear = today.getFullYear();
  const todayStr = getTodayDateStr();

  // Helper for setting initial time slot when opening modal
  const handleOpenEmergencyModal = (preselectedClient?: Client) => {
    const now = getVNDate();
    const curHour = now.getHours();
    const nextHour = (curHour + 1) % 24;
    const formatH = (h: number) => String(h).padStart(2, '0');
    setEmergencyTime(`${formatH(curHour)}:00 - ${formatH(nextHour)}:00`);
    setEmergencyDate(todayStr);
    setEmergencyDayPlan('Lịch hẹn đột xuất / Chèn lịch');
    if (preselectedClient) {
      setEmergencyClientId(preselectedClient.id);
    } else if (clients.length > 0) {
      setEmergencyClientId(clients[0].id);
    }
    setEmergencyClientSearch('');
    setShowEmergencyModal(true);
  };

  const handleCreateEmergencyAppointment = (andCheckIn: boolean = false) => {
    const client = clients.find(c => c.id === emergencyClientId);
    if (!client) {
      showToast('❌ Vui lòng chọn học viên');
      return;
    }

    addAppointment({
      clientId: client.id,
      clientName: client.name,
      clientAvatar: client.avatarUrl,
      time: emergencyTime,
      date: emergencyDate,
      status: andCheckIn ? 'Completed' : 'Scheduled',
      dayPlan: emergencyDayPlan
    });

    if (andCheckIn) {
      showToast(`⚡ Đã tạo lịch hẹn đột xuất & Check-in ngay cho ${client.name}!`);
      onOpenQuickCheckIn(client);
    } else {
      showToast(`✅ Đã thêm lịch hẹn đột xuất cho ${client.name} lúc ${emergencyTime}`);
    }

    setShowEmergencyModal(false);
  };

  // 1. Total active clients
  const activeClients = clients.filter(c => c.status === 'active' || c.status === 'expiring');

  // 2. Monthly Revenue
  const monthlyRevenue = payments
    .filter(p => {
      const pDate = new Date(p.paymentDate);
      return pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;
    })
    .reduce((sum, p) => sum + p.amountVnd, 0);

  // 3. Monthly Expenses
  const monthlyExpenses = expenses
    .filter(e => {
      const eDate = new Date(e.date);
      return eDate.getMonth() === currentMonth && eDate.getFullYear() === currentYear;
    })
    .reduce((sum, e) => sum + e.amountVnd, 0);

  // 4. Monthly Profit
  const monthlyProfit = monthlyRevenue - monthlyExpenses;

  // 5. Today's appointments (deduplicated)
  const seenTodayKeys = new Set<string>();
  const todaysAppointments = appointments.filter(a => {
    if (!a || a.date !== todayStr) return false;
    const key = a.id || `${a.clientId}_${a.date}_${a.time}_${a.status}`;
    if (seenTodayKeys.has(key)) return false;
    seenTodayKeys.add(key);
    return true;
  });

  // 6. Clients running low on sessions (<= 3 sessions)
  const lowSessionClients = clients.filter(c => c.remainingSessions > 0 && c.remainingSessions <= 3);

  // 7. Clients with upcoming contract expiration (<= 7 days or endDate <= 7 days from today)
  const expiringContractClients = clients.filter(c => {
    if (!c.endDate) return false;
    const end = new Date(c.endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  });

  // 8. Birthdays today / this week
  const birthdayClients = clients.filter(c => {
    if (!c.dob) return false;
    const dob = new Date(c.dob);
    // compare month and day
    return dob.getMonth() === currentMonth && Math.abs(dob.getDate() - today.getDate()) <= 3;
  });

  const formatVnd = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in relative">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2 animate-bounce">
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Banner Greeting & Quick Actions */}
      <div className="bg-gradient-to-r from-rose-500 via-pink-600 to-purple-600 border border-rose-500/30 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-white bg-white/20 border border-white/30 px-3 py-1 rounded-full">
              Quản lý của PT
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-3">
              Xin chào PT, Chúc bạn một ngày huấn luyện năng lượng! 🏋️
            </h2>
            <p className="text-pink-100 text-sm mt-1.5 font-medium">
              Đang quản lý <span className="text-amber-300 font-extrabold underline">{clients.filter(c => c.status !== 'closed').length} học viên</span>. Hoàn thành 1 buổi tập chỉ với 3 lần chạm.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onOpenQuickCheckIn()}
              className="flex items-center gap-1.5 bg-[#84cc16] hover:bg-[#65a30d] text-white font-extrabold px-4 py-2.5 rounded-full text-sm shadow-lg shadow-lime-900/30 transition-all hover:scale-105 active:scale-95"
            >
              <Zap className="w-4 h-4 fill-white" />
              CHECK-IN NHANH
            </button>

            <button
              onClick={() => setActiveTab('checkin_history')}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2.5 rounded-full text-sm border border-white/20 transition-all backdrop-blur-sm"
              title="Nhật ký check-in & lịch sử tập luyện"
            >
              <History className="w-4 h-4 text-pink-300" />
              Nhật ký tập
            </button>

            <button
              onClick={() => setActiveTab('clients')}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2.5 rounded-full text-sm border border-white/20 transition-all backdrop-blur-sm"
            >
              <PlusCircle className="w-4 h-4 text-amber-300" />
              Thêm học viên
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className="flex items-center gap-1.5 bg-slate-900/40 hover:bg-slate-900/70 text-white font-bold px-4 py-2.5 rounded-full text-sm border border-white/20 transition-all backdrop-blur-sm"
            >
              <CheckCircle2 className="w-4 h-4 text-indigo-300" />
              Lịch sử
            </button>
          </div>
        </div>
      </div>

      {/* 4 Main Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Card 1: Active Clients */}
        <div 
          onClick={() => setActiveTab('clients')}
          className="bg-white border border-slate-200/80 hover:border-indigo-300 p-5 rounded-3xl shadow-sm hover:shadow-md cursor-pointer transition-all hover:-translate-y-1 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Học viên đang tập</span>
            <div className="w-10 h-10 rounded-2xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900">{activeClients.length}</span>
            <span className="text-xs font-semibold text-slate-500">/ tổng {clients.filter(c => c.status !== 'closed').length} khách</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>🔴 Khách sắp hết buổi: <strong className="text-red-600 font-extrabold">{lowSessionClients.length}</strong></span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#4F46E5] transition-colors" />
          </div>
        </div>

        {/* Card 2: Monthly Revenue */}
        <div 
          onClick={() => setActiveTab('revenue')}
          className="bg-white border border-slate-200/80 hover:border-emerald-300 p-5 rounded-3xl shadow-sm hover:shadow-md cursor-pointer transition-all hover:-translate-y-1 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Doanh thu tháng {currentMonth + 1}</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600">{formatVnd(monthlyRevenue)}</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="text-emerald-600 flex items-center gap-1 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg">
              <ArrowUpRight className="w-3.5 h-3.5" /> Ghi nhận tự động
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
          </div>
        </div>

        {/* Card 3: Monthly Expenses */}
        <div 
          onClick={() => setActiveTab('expenses')}
          className="bg-white border border-slate-200/80 hover:border-rose-300 p-5 rounded-3xl shadow-sm hover:shadow-md cursor-pointer transition-all hover:-translate-y-1 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chi phí tháng {currentMonth + 1}</span>
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-rose-600">{formatVnd(monthlyExpenses)}</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-600">Gym + Gia đình</span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 transition-colors" />
          </div>
        </div>

        {/* Card 4: Monthly Net Profit */}
        <div 
          onClick={() => setActiveTab('reports')}
          className="bg-white border border-slate-200/80 hover:border-amber-300 p-5 rounded-3xl shadow-sm hover:shadow-md cursor-pointer transition-all hover:-translate-y-1 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lợi Nhuận Tháng {currentMonth + 1}</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className={`text-2xl sm:text-3xl font-black ${monthlyProfit >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>
              {formatVnd(monthlyProfit)}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">Tỷ suất LN ~ {monthlyRevenue > 0 ? Math.round((monthlyProfit / monthlyRevenue) * 100) : 0}%</span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </div>
        </div>

      </div>

      {/* Middle Grid: Today's Appointments & Renewal Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Today's Appointments */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#4F46E5] flex items-center justify-center font-bold">
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="font-black text-slate-900 text-lg">Lịch Hẹn Hôm Nay ({todaysAppointments.length})</h3>
            </div>
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={() => handleOpenEmergencyModal()}
                className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-[#4F46E5] font-extrabold text-xs border border-indigo-200 transition-all flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Đặt Lịch Đột Xuất</span>
              </button>
              <button 
                onClick={() => setActiveTab('clients')}
                className="text-xs text-slate-500 hover:text-[#4F46E5] hover:underline flex items-center gap-1 font-bold hidden sm:flex"
              >
                Tất cả học viên <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {todaysAppointments.length === 0 ? (
            <div className="py-10 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200 px-4">
              <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold">Hôm nay chưa có lịch hẹn đặt trước.</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Khi có khách hàng chèn lịch tập đột ngột hoặc đến tập ngẫu nhiên, bạn có thể tạo lịch hẹn khẩn cấp ngay tại đây.
              </p>
              <button 
                type="button"
                onClick={() => handleOpenEmergencyModal()}
                className="mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border border-indigo-500/30 px-5 py-2.5 rounded-full text-xs font-black shadow-md shadow-indigo-200 transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5 mx-auto"
              >
                <PlusCircle className="w-4 h-4 text-amber-300" />
                + Đặt Lịch Hẹn Đột Xuất (Cho khách chèn lịch)
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {todaysAppointments.map(apt => {
                const client = clients.find(c => c.id === apt.clientId);
                return (
                  <div 
                    key={apt.id}
                    className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-indigo-50/40 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <img 
                        src={apt.clientAvatar || client?.avatarUrl || DEFAULT_AVATAR_URL} 
                        alt={apt.clientName}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => client && onSelectClientDetail(client)}
                        title="Bấm để xem hồ sơ học viên"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 
                            onClick={() => client && onSelectClientDetail(client)}
                            className="font-bold text-slate-900 hover:text-[#4F46E5] cursor-pointer"
                          >
                            {apt.clientName}
                          </h4>
                          <span className="text-xs bg-slate-200 text-slate-700 font-bold px-2.5 py-0.5 rounded-full font-mono">
                            {apt.time}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
                          <Dumbbell className="w-3.5 h-3.5 text-[#4F46E5]" />
                          {apt.dayPlan}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {apt.status === 'Completed' ? (
                        <span className="text-xs bg-emerald-600 text-white font-black border border-emerald-700 px-3.5 py-1.5 rounded-full flex items-center gap-1 shadow-2xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-100" /> ĐÃ CHECK-IN
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            if (client) onOpenQuickCheckIn(client);
                            else updateAppointmentStatus(apt.id, 'Completed');
                          }}
                          className="bg-[#84cc16] hover:bg-[#65a30d] text-white font-extrabold px-4 py-2 rounded-full text-xs flex items-center gap-1.5 shadow-md shadow-lime-200 transition-all active:scale-95"
                        >
                          <Zap className="w-3.5 h-3.5 fill-white" /> Check-in Ngay
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Col: Renewals & Birthday Alerts */}
        <div className="space-y-6">
          
          {/* Low Sessions & Renewals Alert (Feature 1) */}
          <div className="bg-white border border-slate-200/80 border-l-4 border-l-red-500 rounded-3xl p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h3 className="font-extrabold text-slate-900 text-base uppercase">Cần gia hạn ({lowSessionClients.length})</h3>
              </div>
            </div>

            {lowSessionClients.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center font-medium">Tất cả học viên đều còn đủ số buổi tập! 👍</p>
            ) : (
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {lowSessionClients.map(client => (
                  <div 
                    key={client.id}
                    className="p-3 bg-red-50/80 border border-red-100 rounded-2xl flex items-center justify-between"
                  >
                    <div 
                      className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" 
                      onClick={() => onSelectClientDetail(client)}
                      title="Bấm để xem hồ sơ học viên"
                    >
                      <img src={client.avatarUrl} alt={client.name} className="w-9 h-9 rounded-full object-cover border border-red-200" />
                      <div>
                        <p 
                          onClick={() => onSelectClientDetail(client)}
                          className="text-xs font-bold text-slate-900 hover:text-red-600 cursor-pointer"
                        >
                          {client.name}
                        </p>
                        <p className="text-[11px] text-red-600 font-extrabold">
                          🔴 Còn {client.remainingSessions} buổi
                        </p>
                      </div>
                    </div>

                    <a 
                      href={`https://zalo.me/${client.phone.replace(/^0/, '84')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] bg-red-500 hover:bg-red-600 text-white font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 shadow-xs"
                    >
                      <MessageCircle className="w-3 h-3" /> Zalo
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Birthday Notification */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Cake className="w-5 h-5 text-amber-500" />
              <h3 className="font-extrabold text-slate-900 text-base">Sinh nhật trong tuần ({birthdayClients.length})</h3>
            </div>

            {birthdayClients.length === 0 ? (
              <p className="text-xs text-slate-500 py-2 text-center font-medium">Không có sinh nhật khách hàng trong tuần này.</p>
            ) : (
              <div className="space-y-2">
                {birthdayClients.map(client => (
                  <div key={client.id} className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100">
                    <div 
                      className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => onSelectClientDetail(client)}
                      title="Bấm để xem hồ sơ học viên"
                    >
                      <img src={client.avatarUrl} alt={client.name} className="w-9 h-9 rounded-full object-cover" />
                      <div>
                        <p className="text-xs font-bold text-slate-900 hover:text-[#4F46E5]">{client.name}</p>
                        <p className="text-[11px] text-amber-600 font-semibold">🎂 Ngày sinh: {client.dob}</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => onSelectClientDetail(client)}
                      className="text-[11px] bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold px-3 py-1 rounded-full shadow-xs"
                    >
                      Hồ sơ
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Modal Đặt Lịch Hẹn Đột Xuất (Dành cho khách chèn lịch đột ngột) */}
      {showEmergencyModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div 
            className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center font-bold">
                  <Calendar className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">Đặt lịch hẹn đột xuất</h3>
                  <p className="text-xs text-indigo-100 font-medium">Dành cho học viên chèn lịch tập đột ngột / khẩn cấp</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEmergencyModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Select Client */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-600" /> Chọn học viên:
                </label>
                
                {/* Search Client Input */}
                <div className="relative mb-2">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Tìm tên hoặc số điện thoại..."
                    value={emergencyClientSearch}
                    onChange={(e) => setEmergencyClientSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 border border-slate-200 rounded-2xl p-2 bg-slate-50/50">
                  {clients
                    .filter(c => c.name.toLowerCase().includes(emergencyClientSearch.toLowerCase()) || c.phone.includes(emergencyClientSearch))
                    .map(c => {
                      const isSelected = c.id === emergencyClientId;
                      return (
                        <div
                          key={c.id}
                          onClick={() => setEmergencyClientId(c.id)}
                          className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-xs font-bold'
                              : 'bg-white hover:bg-slate-100 border border-slate-100 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <img src={c.avatarUrl || DEFAULT_AVATAR_URL} alt={c.name} className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0" />
                            <div>
                              <p className="text-xs font-bold leading-tight">{c.name}</p>
                              <p className={`text-[10px] ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                                Còn {c.remainingSessions} buổi • {c.packageName || 'Gói PT'}
                              </p>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-amber-300 shrink-0" />}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Time Slot & Quick Time Presets */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" /> Khung Giờ Tập:
                </label>
                <input
                  type="text"
                  value={emergencyTime}
                  onChange={(e) => setEmergencyTime(e.target.value)}
                  placeholder="e.g. 09:00 - 10:00"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                
                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['08:00 - 09:00', '09:00 - 10:00', '15:00 - 16:00', '17:00 - 18:00', '18:00 - 19:00', '19:00 - 20:00'].map(slot => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setEmergencyTime(slot)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        emergencyTime === slot
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Day Plan / Workout Subject */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Dumbbell className="w-3.5 h-3.5 text-indigo-600" /> Nội Dung / Bài Tập:
                </label>
                <input
                  type="text"
                  value={emergencyDayPlan}
                  onChange={(e) => setEmergencyDayPlan(e.target.value)}
                  placeholder="Lịch hẹn đột xuất / Chèn lịch..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['Lịch hẹn đột xuất / Chèn lịch', 'Leg Day (Tập Chân)', 'Chest & Triceps (Ngực/Tay sau)', 'Back & Biceps (Lưng/Tay trước)', 'Shoulders & Abs (Vai/Bụng)'].map(plan => (
                    <button
                      key={plan}
                      type="button"
                      onClick={() => setEmergencyDayPlan(plan)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                        emergencyDayPlan === plan
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {plan}
                    </button>
                  ))}
                </div>
              </div>

              {/* Appointment Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Ngày Tập:
                </label>
                <input
                  type="date"
                  value={emergencyDate}
                  onChange={(e) => setEmergencyDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Modal Footer Buttons */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowEmergencyModal(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-200/80 transition-all cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={() => handleCreateEmergencyAppointment(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" /> Lưu Lịch Hẹn
              </button>
              <button
                type="button"
                onClick={() => handleCreateEmergencyAppointment(true)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#84cc16] hover:bg-[#65a30d] text-white font-extrabold text-xs shadow-md shadow-lime-200 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Zap className="w-4 h-4 fill-white" /> Lưu & Check-in Ngay
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
