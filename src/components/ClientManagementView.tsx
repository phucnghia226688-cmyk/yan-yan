import { removeAccents } from '../utils/textUtils';
import { getTodayDateStr, getVNDate, parseDateLocal } from '../utils/dateUtils';


import React, { useState, useEffect } from 'react';
import { ConfirmPasswordModal } from './ConfirmPasswordModal';
import { PrintContractModal, ContractData } from './PrintContractModal';
import { 
  Users, 
  User,
  Search, 
  UserPlus, 
  Filter, 
  Phone, 
  Calendar, 
  Target, 
  FileText, 
  Activity, 
  TrendingDown, 
  TrendingUp, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Check, 
  CheckCircle2,
  Zap, 
  ClipboardList, 
  Clock, 
  Heart,
  ChevronRight,
  ExternalLink,
  RotateCcw,
  History,
  ArrowUpDown,
  Lock,
  Settings,
  Sliders,
  CalendarDays,
  AlertTriangle,
  Table,
  LayoutGrid,
  Eye,
  Download,
  Printer,
  Camera,
  Archive
} from 'lucide-react';
import { useGym } from '../context/GymContext';
import { useTenant } from '../context/TenantContext';
import { Client, BodyMetricEntry, EditHistoryEntry, CheckInLog, PaymentRecord, DEFAULT_AVATAR_URL } from '../types';
import { CheckInReceiptModal, CheckInReceiptData } from './CheckInReceiptModal';
import { RenewalReceiptModal, RenewalReceiptData } from './RenewalReceiptModal';
import { EditPaymentAmountModal } from './EditPaymentAmountModal';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface ClientManagementViewProps {
  onOpenQuickCheckIn: (client?: Client) => void;
  onGoToProgram: (clientId: string) => void;
  selectedClientFromNav?: Client | null;
  onGoToAudit?: () => void;
}

const FLEXIBLE_TIME_SLOTS = [
  '05:00 - 06:00',
  '05:30 - 06:30',
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

const calculateDaysDifference = (startStr: string, endStr: string): number | null => {
  if (!startStr || !endStr) return null;
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 ? diffDays : null;
};

const addDaysToDate = (startStr: string, daysToAdd: number): string => {
  const base = startStr ? new Date(startStr) : new Date();
  if (isNaN(base.getTime())) return '';
  const result = new Date(base);
  result.setDate(result.getDate() + daysToAdd);
  const yyyy = result.getFullYear();
  const mm = String(result.getMonth() + 1).padStart(2, '0');
  const dd = String(result.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const addMonthsToDate = (startStr: string, monthsToAdd: number): string => {
  const baseStr = startStr || getTodayDateStr();
  const parts = baseStr.split('-');
  const yyyy = parseInt(parts[0], 10) || new Date().getFullYear();
  const mm = (parseInt(parts[1], 10) || 1) - 1;
  const dd = parseInt(parts[2], 10) || 1;
  const result = new Date(yyyy, mm + monthsToAdd, dd);
  const rY = result.getFullYear();
  const rM = String(result.getMonth() + 1).padStart(2, '0');
  const rD = String(result.getDate()).padStart(2, '0');
  return `${rY}-${rM}-${rD}`;
};

interface QuickDaysBoxProps {
  startDate: string;
  endDate: string;
  onUpdateEndDate: (newEndDate: string) => void;
  label?: string;
  bgStyle?: string;
}

const QuickDaysBox: React.FC<QuickDaysBoxProps> = ({
  startDate,
  endDate,
  onUpdateEndDate,
  label = 'Bảng tính nhanh số ngày hạn sử dụng',
  bgStyle = 'bg-amber-50/80 border-amber-200/80'
}) => {
  const currentDays = calculateDaysDifference(
    startDate || getTodayDateStr(),
    endDate
  );

  const [customDays, setCustomDays] = useState<string>(currentDays !== null ? String(currentDays) : '');

  useEffect(() => {
    if (currentDays !== null) {
      setCustomDays(String(currentDays));
    } else {
      setCustomDays('');
    }
  }, [startDate, endDate]);

  const handleApplyDays = (days: number) => {
    const base = startDate || getTodayDateStr();
    const newEnd = addDaysToDate(base, days);
    onUpdateEndDate(newEnd);
  };

  const handleApplyMonths = (months: number) => {
    const base = startDate || getTodayDateStr();
    const newEnd = addMonthsToDate(base, months);
    onUpdateEndDate(newEnd);
  };

  const handleCustomDaysChange = (val: string) => {
    setCustomDays(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > 0) {
      const base = startDate || getTodayDateStr();
      const newEnd = addDaysToDate(base, num);
      onUpdateEndDate(newEnd);
    }
  };

  const baseDate = startDate || getTodayDateStr();

  const presets: Array<{ type: 'days' | 'months'; val: number; label: string }> = [
    { type: 'days', val: 14, label: '14 ngày (Trải nghiệm)' },
    { type: 'months', val: 1, label: '1 tháng' },
    { type: 'months', val: 2, label: '2 tháng' },
    { type: 'months', val: 3, label: '3 tháng' },
    { type: 'months', val: 6, label: '6 tháng' }
  ];

  return (
    <div className={`p-3 rounded-2xl border ${bgStyle} space-y-2`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
        <label className="text-xs font-black text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
          <CalendarDays className="w-4 h-4 text-amber-600 shrink-0" />
          {label}
        </label>
        {currentDays !== null && (
          <span className="text-[11px] font-extrabold text-amber-900 bg-white/90 border border-amber-300 px-2.5 py-0.5 rounded-full self-start sm:self-auto shadow-2xs">
            ⏱️ Đang chọn: <strong className="text-indigo-600 font-black">{currentDays} ngày</strong> {currentDays >= 15 && `(~ ${(currentDays / 30).toFixed(1)} tháng)`}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
        <div className="sm:col-span-1">
          <div className="relative">
            <input
              type="number"
              min="1"
              max="3650"
              placeholder="Nhập số ngày..."
              value={customDays}
              onChange={(e) => handleCustomDaysChange(e.target.value)}
              className="w-full bg-white text-slate-900 font-extrabold border border-amber-300 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none">
              ngày
            </span>
          </div>
        </div>

        <div className="sm:col-span-2 flex flex-wrap gap-1.5">
          {presets.map((item, idx) => {
            const expectedEnd = item.type === 'days'
              ? addDaysToDate(baseDate, item.val)
              : addMonthsToDate(baseDate, item.val);
            const isSelected = endDate === expectedEnd;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => item.type === 'days' ? handleApplyDays(item.val) : handleApplyMonths(item.val)}
                className={`px-2.5 py-1 text-xs font-extrabold rounded-xl transition-all shadow-2xs hover:scale-105 active:scale-95 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 border border-amber-600 font-black ring-1 ring-amber-400'
                    : 'bg-white hover:bg-amber-100 text-amber-950 border border-amber-300'
                }`}
              >
                +{item.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const ClientManagementView: React.FC<ClientManagementViewProps> = ({
  onOpenQuickCheckIn,
  onGoToProgram,
  selectedClientFromNav,
  onGoToAudit
}) => {
  const { clients, addClient, updateClient, deleteClient, addBodyMetric, addPayment, updatePayment, deletePayment, checkIns, cancelCheckIn, updateCheckIn, programs, payments } = useGym();
  const { currentUser, activeTenantId, tenants } = useTenant();

  const activeTenant = tenants.find(t => t.tenantId === activeTenantId || t.id === activeTenantId);
  const rawGymName = activeTenant?.gymName || (currentUser?.tenantId === activeTenantId ? currentUser?.gymName : null) || currentUser?.gymName || 'PT Private Gym';
  const displayGymName = rawGymName.replace(/\s*\(Gốc\)/i, '').trim();
  const displayPtName = activeTenant?.ownerName || currentUser?.ownerName || 'HLV Trưởng';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expiring' | 'expired' | 'closed'>('all');
  const [sortOption, setSortOption] = useState<'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'sessions_asc' | 'sessions_desc'>('newest');
  const [selectedClient, setSelectedClient] = useState<Client | null>(selectedClientFromNav || clients[0] || null);
  const [activeDetailTab, setActiveDetailTab] = useState<'info' | 'metrics' | 'photos' | 'history' | 'program'>('info');

  useEffect(() => {
    if (selectedClientFromNav) {
      setSelectedClient(selectedClientFromNav);
      setIsDetailModalOpen(true);
    }
  }, [selectedClientFromNav]);

  const [clientToClose, setClientToClose] = useState<Client | null>(null);

  const handleReopenContract = (clientObj: Client) => {
    const nowStr = getVNDate().toLocaleString('vi-VN', { hour12: false });
    const newHistory: EditHistoryEntry = {
      id: Date.now().toString(),
      timestamp: nowStr,
      summary: `🔓 Mở lại hợp đồng học viên từ trạng thái Đã Đóng.`,
      actionType: 'status'
    };
    const updated: Client = {
      ...clientObj,
      status: clientObj.remainingSessions > 0 ? 'active' : 'expired',
      editHistory: [newHistory, ...(clientObj.editHistory || [])]
    };
    updateClient(clientObj.id, updated);
    if (selectedClient?.id === clientObj.id) {
      setSelectedClient(updated);
    }
  };

  // View Mode: 'horizontal' (Horizontal Table like image 2) or 'split' (2 Columns - Default)
  const [viewMode, setViewMode] = useState<'horizontal' | 'split'>(() => {
    return (localStorage.getItem('nb_gym_client_view_mode') as 'horizontal' | 'split') || 'split';
  });
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [addPaymentData, setAddPaymentData] = useState({
    amountVnd: 0,
    paymentMethod: 'Chuyển khoản' as 'Tiền mặt' | 'Chuyển khoản' | 'Thẻ',
    paymentDate: getTodayDateStr(),
    notes: 'Bổ sung tiền gói tập do tạo hồ sơ quên nhập'
  });
  const [addPaymentConfirmTarget, setAddPaymentConfirmTarget] = useState<Client | null>(null);

  const getClientTotalPaid = (clientId: string) => {
    return payments.filter(p => p.clientId === clientId && !p.isCancelled).reduce((sum, p) => sum + p.amountVnd, 0);
  };

  const [isMetricModalOpen, setIsMetricModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);

  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editPaymentAmount, setEditPaymentAmount] = useState<number>(0);
  const [editPaymentSessions, setEditPaymentSessions] = useState<number>(0);
  const [editPaymentEndDate, setEditPaymentEndDate] = useState<string>('');
  const [cancelingPaymentId, setCancelingPaymentId] = useState<string | null>(null);
  const [cancelPaymentPassword, setCancelPaymentPassword] = useState('');
  const [editPaymentPassword, setEditPaymentPassword] = useState('');
  const [editPaymentError, setEditPaymentError] = useState('');
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printContractData, setPrintContractData] = useState<ContractData | null>(null);

  const handleOpenPrintContract = (clientObj?: Client) => {
    if (clientObj) {
      setPrintContractData({
        clientName: clientObj.name,
        phone: clientObj.phone,
        gender: clientObj.gender,
        dob: clientObj.dob,
        packageName: clientObj.packageName || 'Gói PT 12 buổi',
        totalSessions: clientObj.totalSessions || 12,
        amountVnd: (clientObj as any).initialAmountVnd || 0,
        paymentMethod: (clientObj as any).paymentMethod || 'Chuyển khoản',
        startDate: clientObj.startDate || getTodayDateStr(),
        endDate: clientObj.endDate || '',
        trainingType: clientObj.trainingType,
        goals: clientObj.goals,
        healthNotes: clientObj.healthNotes,
        preferredDays: clientObj.preferredDays,
        preferredTime: clientObj.preferredTime,
        ptName: displayPtName,
        tenantName: displayGymName
      });
    } else {
      setPrintContractData({
        clientName: formData.name || 'Nguyễn Văn A',
        phone: formData.phone || '0900000000',
        gender: formData.gender,
        dob: formData.dob,
        packageName: formData.packageName || 'Gói PT 12 buổi',
        totalSessions: formData.totalSessions || 12,
        amountVnd: formData.amountVnd || 0,
        paymentMethod: formData.paymentMethod || 'Chuyển khoản',
        startDate: formData.startDate || getTodayDateStr(),
        endDate: formData.endDate || '',
        trainingType: formData.trainingType,
        goals: formData.goals,
        healthNotes: formData.healthNotes,
        preferredDays: formData.preferredDays,
        preferredTime: formData.preferredTime,
        ptName: displayPtName,
        tenantName: displayGymName
      });
    }
    setIsPrintModalOpen(true);
  };

  const [contractClient, setContractClient] = useState<Client | null>(null);
  const [contractFormData, setContractFormData] = useState({
    packageName: '',
    startDate: '',
    endDate: '',
    totalSessions: 0,
    remainingSessions: 0,
    status: 'active' as 'active' | 'expiring' | 'expired' | 'paused' | 'closed',
    notes: ''
  });

  // Automatically keep selectedClient synchronized with the clients state in GymContext
  useEffect(() => {
    if (selectedClient) {
      const updated = clients.find(c => c.id === selectedClient.id);
      if (updated) {
        setSelectedClient(updated);
      }
    } else if (clients.length > 0) {
      setSelectedClient(clients[0]);
    }
  }, [clients]);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletePasswordError, setDeletePasswordError] = useState(false);
  const [deleteSuccessToast, setDeleteSuccessToast] = useState<string | null>(null);
  const [cancelCheckInTarget, setCancelCheckInTarget] = useState<{ id: string; clientName: string } | null>(null);
  const [editCheckInTarget, setEditCheckInTarget] = useState<any | null>(null);
  const [editCheckInPlanName, setEditCheckInPlanName] = useState('');
  const [editingPaymentAmount, setEditingPaymentAmount] = useState<PaymentRecord | null>(null);

  // Past Check-in Receipt Modal State
  const [pastReceiptModalData, setPastReceiptModalData] = useState<CheckInReceiptData | null>(null);
  const [isPastReceiptModalOpen, setIsPastReceiptModalOpen] = useState<boolean>(false);

  const handleShowReceiptForLog = (log: CheckInLog) => {
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
    const clientTotal = selectedClient?.totalSessions || 0;
    const total = Math.max(1, clientTotal, remaining);
    const completed = Math.max(0, total - remaining);

    setPastReceiptModalData({
      clientName: log.clientName || selectedClient?.name || 'Học viên',
      avatarUrl: selectedClient?.avatarUrl,
      packageName: selectedClient?.packageName || 'Gói PT 1:1',
      totalSessions: total,
      completedSessions: completed,
      remainingSessions: remaining,
      checkInDateStr,
      checkInTimeStr,
      dayPlanName: log.dayPlanName,
      notes: log.notes
    });
    setIsPastReceiptModalOpen(true);
  };

  // Renewal form state
  const [renewClient, setRenewClient] = useState<Client | null>(null);
  const [renewalReceiptData, setRenewalReceiptData] = useState<RenewalReceiptData | null>(null);
  const [renewFormData, setRenewFormData] = useState({
    packageName: 'Gói 24 buổi',
    additionalSessions: 24,
    amountVnd: 12000000,
    paymentMethod: 'Chuyển khoản' as 'Chuyển khoản' | 'Tiền mặt' | 'Thẻ',
    paymentDate: getTodayDateStr(),
    newEndDate: '',
    notes: ''
  });

  // Form states for Add / Edit
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    gender: 'Nam' as 'Nam' | 'Nữ',
    dob: '1995-01-01',
    occupation: '',
    goals: '',
    clientType: 'session' as 'session' | 'monthly',
    packageName: 'Gói 12 buổi',
    totalSessions: 12,
    remainingSessions: 12,
    amountVnd: 0,
    paymentMethod: 'Chuyển khoản' as 'Chuyển khoản' | 'Tiền mặt' | 'Thẻ',
    startDate: getTodayDateStr(),
    endDate: '2026-10-01',
    avatarUrl: DEFAULT_AVATAR_URL,
    healthNotes: '',
    ptNotes: '',
    preferredDays: [1, 3, 5] as number[], // T2, T4, T6
    preferredTime: '08:00 - 09:00',
    dayTimes: {} as Record<number, string>,
    trainingType: '1/1' as '1/1' | 'ca_nhom',
    status: 'active' as 'active' | 'expiring' | 'expired' | 'paused' | 'closed'
  });

  // Metric form state
  const [metricData, setMetricData] = useState({
    date: getTodayDateStr(),
    weightKg: 65,
    bodyFatPercent: 20,
    waistCm: 75,
    hipsCm: 90,
    notes: ''
  });

  // Calculate warning badge logic
  const getWarningBadge = (client: Client) => {
    if (client.status === 'closed') {
      return (
        <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1">
          🔒 HĐ đã đóng
        </span>
      );
    }

    const today = getVNDate();
    today.setHours(0,0,0,0);
    
    let daysRemaining = 999;
    if (client.endDate) {
      const endParts = client.endDate.split('-');
      if (endParts.length === 3) {
        const endD = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]));
        daysRemaining = Math.ceil((endD.getTime() - today.getTime()) / (1000 * 3600 * 24));
      }
    }

    if (client.clientType === 'monthly') {
      if (daysRemaining < 0) {
        return (
          <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-300 flex items-center gap-1">
            🔴 Khách tháng - Hết hạn HĐ
          </span>
        );
      }
      if (daysRemaining <= 7) {
        return (
          <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 animate-pulse flex items-center gap-1">
            🟡 Khách tháng - Hết hạn sau {daysRemaining} ngày
          </span>
        );
      }
      return (
        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1">
          📅 Khách tháng ({daysRemaining} ngày)
        </span>
      );
    }

    if (daysRemaining <= 5 && daysRemaining >= 0) {
      return (
        <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-300 animate-pulse flex items-center gap-1">
          🔴 Hết hạn HĐ sau {daysRemaining} ngày
        </span>
      );
    }

    if (daysRemaining < 0) {
      return (
        <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-red-200 text-red-800 border border-red-300 flex items-center gap-1">
          🔴 HĐ đã hết hạn
        </span>
      );
    }

    if (client.remainingSessions <= 1) {
      return (
        <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-300 animate-pulse flex items-center gap-1">
          🔴 Còn {client.remainingSessions} buổi
        </span>
      );
    }

    if (client.remainingSessions <= 3) {
      return (
        <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
          🟡 Còn {client.remainingSessions} buổi
        </span>
      );
    }

    return (
      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
        🟢 Còn {client.remainingSessions} buổi
      </span>
    );
  };

  // Filter & sort clients
  const filteredClients = clients
    .filter(c => {
      const searchNormalized = removeAccents(searchQuery.trim().toLowerCase());
      const nameNormalized = removeAccents(c.name.toLowerCase());
      const matchesSearch = nameNormalized.includes(searchNormalized) || c.phone.includes(searchQuery.trim());
      if (statusFilter === 'all') return matchesSearch && c.status !== 'closed';
      return matchesSearch && c.status === statusFilter;
    })
    .sort((a, b) => {
      if (sortOption === 'name_asc') {
        return a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' });
      }
      if (sortOption === 'name_desc') {
        return b.name.localeCompare(a.name, 'vi', { sensitivity: 'base' });
      }
      if (sortOption === 'sessions_asc') {
        return a.remainingSessions - b.remainingSessions;
      }
      if (sortOption === 'sessions_desc') {
        return b.remainingSessions - a.remainingSessions;
      }
      if (sortOption === 'oldest') {
        return (a.startDate || a.id).localeCompare(b.startDate || b.id);
      }
      // 'newest' default
      return (b.startDate || b.id).localeCompare(a.startDate || a.id);
    });

  const handleExportExcel = () => {
    const headers = ['STT', 'Mã HV', 'Tên Học Viên', 'SĐT', 'Giới Tính', 'Gói Tập', 'Buổi Còn Lại', 'Tổng Buổi', 'Ngày Đăng Ký', 'Hạn HĐ', 'Trạng Thái'];
    const rows = filteredClients.map((c, i) => [
      i + 1,
      `HV-${1000 + (clients.length - i)}`,
      c.name,
      c.phone,
      c.gender || 'Nam',
      c.packageName || 'Gói PT',
      c.remainingSessions,
      c.totalSessions,
      c.startDate || '',
      c.endDate || '',
      c.status === 'active' ? 'Đang tập' : c.status === 'expiring' ? 'Sắp hết buổi' : 'Đã hết hạn'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].map(e => e.map(val => `"${val}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `danh_sach_hoc_vien_${getTodayDateStr()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    const isMonthly = formData.clientType === 'monthly';
    const totalSess = isMonthly ? 0 : formData.totalSessions;
    const remSess = isMonthly ? 0 : formData.totalSessions;

    const newClientPayload = {
      ...formData,
      totalSessions: totalSess,
      remainingSessions: remSess,
      initialAmountVnd: formData.amountVnd,
      paymentMethod: formData.paymentMethod
    };
    addClient(newClientPayload);
    setIsAddModalOpen(false);
    // Reset form
    setFormData({
      name: '',
      phone: '',
      gender: 'Nam',
      dob: '1995-01-01',
      occupation: '',
      goals: '',
      clientType: 'session',
      packageName: 'Gói 12 buổi',
      totalSessions: 12,
      remainingSessions: 12,
      amountVnd: 0,
      paymentMethod: 'Chuyển khoản',
      startDate: getTodayDateStr(),
      endDate: '2026-10-01',
      avatarUrl: DEFAULT_AVATAR_URL,
      healthNotes: '',
      ptNotes: '',
      preferredDays: [1, 3, 5],
      preferredTime: '08:00 - 09:00',
      dayTimes: {},
      trainingType: '1/1',
      status: 'active'
    });
  };

  
  const handleExecuteAddPayment = (client: Client) => {
    if (addPaymentData.amountVnd <= 0) return;
    
    addPayment({
      clientId: client.id,
      clientName: client.name,
      packageName: client.packageName,
      sessionsCount: 0,
      amountVnd: addPaymentData.amountVnd,
      paymentMethod: addPaymentData.paymentMethod,
      paymentDate: addPaymentData.paymentDate,
      notes: addPaymentData.notes,
      skipSessionUpdate: true // Don't add sessions
    });

    const nowStr = getVNDate().toLocaleString('vi-VN', { hour12: false });
    updateClient(client.id, {
      actionSummary: `Bổ sung thanh toán ${addPaymentData.amountVnd.toLocaleString('vi-VN')}đ`,
      actionType: 'edit'
    });

    setIsAddPaymentModalOpen(false);
    setAddPaymentConfirmTarget(null);
  };

  const handleUpdateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    const isMonthly = formData.clientType === 'monthly';
    const finalTotal = isMonthly ? 0 : (formData.totalSessions || 0);
    const finalRem = isMonthly ? 0 : (formData.remainingSessions || 0);
    const updatedPayload = {
      ...formData,
      totalSessions: finalTotal,
      remainingSessions: finalRem
    };
    updateClient(selectedClient.id, updatedPayload);
    setSelectedClient(prev => prev ? { ...prev, ...updatedPayload } : null);
    setIsEditModalOpen(false);
  };

  const handleSaveMetric = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    addBodyMetric(selectedClient.id, metricData);
    setIsMetricModalOpen(false);
  };

  const handleSavePaymentEdit = (paymentId: string) => {
    if (!currentUser || editPaymentPassword !== currentUser.password) {
      setEditPaymentError('Mật khẩu không đúng!');
      return;
    }
    updatePayment(paymentId, { 
      amountVnd: editPaymentAmount,
      sessionsCount: editPaymentSessions,
      newEndDate: editPaymentEndDate || undefined,
      isEdited: true,
      editedAt: new Date().toISOString()
    });
    setEditingPaymentId(null);
    setEditPaymentPassword('');
    setEditPaymentError('');
  };

  const handleCancelPayment = (paymentId: string) => {
    if (!currentUser || cancelPaymentPassword !== currentUser.password) {
      setEditPaymentError('Mật khẩu không đúng!');
      return;
    }
    deletePayment(paymentId);
    setCancelingPaymentId(null);
    setCancelPaymentPassword('');
    setEditPaymentError('');
  };

  const openEditModal = (client: Client) => {
    setSelectedClient(client);
    setFormData({
      name: client.name,
      phone: client.phone,
      gender: (client.gender as 'Nam' | 'Nữ') || 'Nam',
      dob: client.dob,
      occupation: client.occupation,
      goals: client.goals,
      clientType: client.clientType || 'session',
      packageName: client.packageName,
      totalSessions: client.totalSessions,
      remainingSessions: client.remainingSessions,
      amountVnd: 0,
      paymentMethod: 'Chuyển khoản',
      startDate: client.startDate,
      endDate: client.endDate,
      avatarUrl: DEFAULT_AVATAR_URL,
      healthNotes: client.healthNotes,
      ptNotes: client.ptNotes,
      preferredDays: client.preferredDays || [1, 3, 5],
      preferredTime: client.preferredTime || '08:00 - 09:00',
      dayTimes: client.dayTimes || {},
      trainingType: client.trainingType || '1/1',
      status: client.status || 'active'
    });
    setIsEditModalOpen(true);
  };

  const openRenewModal = (client: Client) => {
    setRenewClient(client);
    const today = getVNDate();
    let baseDate = new Date();
    if (client.endDate) {
      const parts = client.endDate.split('-');
      if (parts.length === 3) {
        const parsed = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        if (parsed > today) baseDate = parsed;
      }
    }
    const future3m = new Date(baseDate);
    future3m.setMonth(future3m.getMonth() + 3);
    const future3mStr = `${future3m.getFullYear()}-${String(future3m.getMonth() + 1).padStart(2, '0')}-${String(future3m.getDate()).padStart(2, '0')}`;

    setRenewFormData({
      packageName: client.packageName ? `${client.packageName}` : 'Gói PT 24 buổi',
      additionalSessions: 24,
      amountVnd: 12000000,
      paymentMethod: 'Chuyển khoản',
      paymentDate: getTodayDateStr(),
      newEndDate: future3mStr,
      notes: `Gia hạn gói tập mới cho ${client.name}`
    });
    setIsRenewModalOpen(true);
  };

  const handleApplyPresetDuration = (months: number) => {
    let baseDate = new Date();
    if (renewClient && renewClient.endDate) {
      const parts = renewClient.endDate.split('-');
      if (parts.length === 3) {
        const parsed = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        if (parsed > new Date()) baseDate = parsed;
      }
    }
    const newDate = new Date(baseDate);
    newDate.setMonth(newDate.getMonth() + months);
    const dateStr = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}-${String(newDate.getDate()).padStart(2, '0')}`;
    setRenewFormData(prev => ({ ...prev, newEndDate: dateStr }));
  };

  const handleSaveRenewPackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewClient) return;

    const addSessions = Number(renewFormData.additionalSessions) || 0;
    const payAmount = Number(renewFormData.amountVnd) || 0;

    // 1. Record payment transaction into context (automatically updates revenue & profit for paymentDate month)
    addPayment({
      clientId: renewClient.id,
      clientName: renewClient.name,
      packageName: renewFormData.packageName,
      sessionsCount: addSessions,
      amountVnd: payAmount,
      paymentMethod: renewFormData.paymentMethod,
      paymentDate: renewFormData.paymentDate,
      notes: renewFormData.notes,
      skipSessionUpdate: true,
      newEndDate: renewFormData.newEndDate,
      previousState: {
        remainingSessions: renewClient.remainingSessions || 0,
        totalSessions: renewClient.totalSessions || 0,
        endDate: renewClient.endDate || '',
        status: renewClient.status
      }
    });

    // 2. Update client sessions & end date & status
    const isMonthly = renewClient.clientType === 'monthly';
    const newRemaining = isMonthly ? 0 : (renewClient.remainingSessions || 0) + addSessions;
    const newTotal = isMonthly ? 0 : (addSessions > 0 ? addSessions : (renewClient.totalSessions || 0));

    const formattedPay = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(payAmount);

    updateClient(renewClient.id, {
      packageName: renewFormData.packageName,
      remainingSessions: newRemaining,
      totalSessions: newTotal,
      endDate: renewFormData.newEndDate,
      status: 'active',
      actionType: 'renew',
      actionSummary: isMonthly
        ? `🔄 Gia hạn Khách Tháng: ${renewFormData.packageName} - Hạn HĐ mới: ${renewFormData.newEndDate} - TT: ${formattedPay}`
        : `🔄 Gia hạn HĐ: ${renewFormData.packageName} (+${addSessions} buổi, còn ${newRemaining}/${newTotal}b) - Hạn HĐ mới: ${renewFormData.newEndDate} - TT: ${formattedPay}`
    });

    if (selectedClient && selectedClient.id === renewClient.id) {
      setSelectedClient({
        ...selectedClient,
        packageName: renewFormData.packageName,
        remainingSessions: newRemaining,
        totalSessions: newTotal,
        endDate: renewFormData.newEndDate,
        status: 'active'
      });
    }

    const payDateFormatted = new Date(renewFormData.paymentDate).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
    const nowTime = new Date().toLocaleTimeString('vi-VN', {
      hour: '2-digit', minute: '2-digit'
    });

    setRenewalReceiptData({
      clientName: renewClient.name,
      packageName: renewFormData.packageName,
      amountPaid: payAmount,
      addedSessions: addSessions,
      totalRemainingSessions: newRemaining,
      newExpirationDate: renewFormData.newEndDate ? new Date(renewFormData.newEndDate).toLocaleDateString('vi-VN') : '',
      createdAt: `${payDateFormatted} ${nowTime}`
    });

    setIsRenewModalOpen(false);
  };

  const openContractModal = (client: Client) => {
    setContractClient(client);
    setContractFormData({
      packageName: client.packageName || 'Gói 16 buổi',
      startDate: client.startDate || getTodayDateStr(),
      endDate: client.endDate || '',
      totalSessions: client.totalSessions || 0,
      remainingSessions: client.remainingSessions || 0,
      status: client.status || 'active',
      notes: ''
    });
    setIsContractModalOpen(true);
  };

  const handleQuickAddDuration = (months: number, days: number = 0) => {
    const baseDateStr = contractFormData.endDate || contractFormData.startDate || getTodayDateStr();
    const baseDate = new Date(baseDateStr);
    if (isNaN(baseDate.getTime())) return;
    
    if (months > 0) {
      baseDate.setMonth(baseDate.getMonth() + months);
    }
    if (days > 0) {
      baseDate.setDate(baseDate.getDate() + days);
    }

    const newEndStr = baseDate.toISOString().split('T')[0];
    setContractFormData(prev => ({
      ...prev,
      endDate: newEndStr
    }));
  };

  const handleSaveContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractClient) return;

    const actionSummary = `⚙️ Điều chỉnh HĐ (${contractFormData.packageName}): BD: ${contractFormData.startDate} -> KT: ${contractFormData.endDate} (Còn ${contractFormData.remainingSessions}/${contractFormData.totalSessions}b) - TT: ${contractFormData.status.toUpperCase()}${contractFormData.notes ? ` [${contractFormData.notes}]` : ''}`;

    updateClient(contractClient.id, {
      packageName: contractFormData.packageName,
      startDate: contractFormData.startDate,
      endDate: contractFormData.endDate,
      totalSessions: Number(contractFormData.totalSessions),
      remainingSessions: Number(contractFormData.remainingSessions),
      status: contractFormData.status,
      actionType: 'edit',
      actionSummary
    });

    if (selectedClient && selectedClient.id === contractClient.id) {
      setSelectedClient({
        ...selectedClient,
        packageName: contractFormData.packageName,
        startDate: contractFormData.startDate,
        endDate: contractFormData.endDate,
        totalSessions: Number(contractFormData.totalSessions),
        remainingSessions: Number(contractFormData.remainingSessions),
        status: contractFormData.status
      });
    }

    setIsContractModalOpen(false);
  };

  const renderHistoryEntry = (item: EditHistoryEntry) => {
    let badgeStyle = "bg-slate-50 border-slate-200 text-slate-800";
    let typeLabel = "Cập nhật";
    let icon = "✏️";

    if (item.actionType === 'renew' || item.summary.includes('Gia hạn')) {
      badgeStyle = "bg-indigo-50 border-indigo-200 text-indigo-950";
      typeLabel = "Gia Hạn HĐ";
      icon = "🔄";
    } else if (item.actionType === 'cancel' || item.summary.includes('Hủy') || item.summary.includes('Tạm ngưng') || item.summary.includes('Bảo lưu')) {
      badgeStyle = "bg-rose-50 border-rose-200 text-rose-950";
      typeLabel = "Hủy / Bảo lưu";
      icon = "⛔";
    } else if (item.actionType === 'create' || item.summary.includes('Tạo mới')) {
      badgeStyle = "bg-emerald-50 border-emerald-200 text-emerald-950";
      typeLabel = "Tạo mới";
      icon = "✨";
    } else if (item.actionType === 'status') {
      badgeStyle = "bg-amber-50 border-amber-200 text-amber-950";
      typeLabel = "Trạng thái";
      icon = "⚡";
    }

    const cleanSummary = item.summary.replace(/^(✏️|🔄|⛔|✨|⚡)\s*/, '');

    return (
      <div key={item.id} className={`p-2.5 rounded-2xl text-xs flex flex-col sm:flex-row sm:items-center justify-between border shadow-2xs gap-1.5 transition-all ${badgeStyle}`}>
        <div className="flex items-start gap-2 leading-relaxed flex-1">
          <span className="text-sm select-none mt-0.5">{icon}</span>
          <div className="flex-1">
            <span className="font-extrabold text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-white border border-slate-200 mr-1.5 inline-block text-slate-700 shadow-2xs">
              {typeLabel}
            </span>
            <span className="font-semibold text-slate-900">{cleanSummary}</span>
          </div>
        </div>
        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50/80 px-2.5 py-1 rounded-lg border border-indigo-100 whitespace-nowrap self-end sm:self-auto flex items-center gap-1 shadow-2xs">
          🕒 {item.timestamp}
        </span>
      </div>
    );
  };

  const clientCheckIns = selectedClient
    ? checkIns.filter(ci => ci.clientId === selectedClient.id)
    : [];

  const clientProgram = selectedClient
    ? programs.find(p => p.clientId === selectedClient.id || p.id === selectedClient.workoutProgramId)
    : null;


  const renderClientDetailContent = () => {
    if (!selectedClient) return null;
    return (
            <>
              {/* Detail Header */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50/90 via-slate-50 to-white border border-indigo-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img 
                    src={selectedClient.avatarUrl} 
                    alt={selectedClient.name} 
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-[#4F46E5] shadow-md"
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-2xl font-black text-slate-900">{selectedClient.name}</h3>
                      {selectedClient.trainingType === 'ca_nhom' ? (
                        <span className="font-extrabold text-xs text-purple-900 bg-purple-100 px-2.5 py-1 rounded-lg border border-purple-300 shadow-2xs flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-purple-600 fill-purple-200" /> Ca Nhóm
                        </span>
                      ) : (
                        <span className="font-extrabold text-xs text-sky-900 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-sky-600" /> 1/1
                        </span>
                      )}
                      {selectedClient.clientType === 'monthly' ? (
                        <span className="font-extrabold text-xs text-amber-950 bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-300 shadow-2xs flex items-center gap-1">
                          📅 {selectedClient.packageName || 'Khách Tháng'} (Thẻ Khách Tháng)
                        </span>
                      ) : (
                        <span className="font-extrabold text-xs text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 shadow-2xs flex items-center gap-1">
                          📦 {selectedClient.packageName || 'Gói PT'} ({selectedClient.remainingSessions}/{selectedClient.totalSessions} buổi)
                        </span>
                      )}
                      {getWarningBadge(selectedClient)}
                      {getClientTotalPaid(selectedClient.id) === 0 && (
                        <button
                          onClick={() => {
                            setAddPaymentData(prev => ({...prev, amountVnd: 0, paymentDate: getTodayDateStr()}));
                            setIsAddPaymentModalOpen(true);
                          }}
                          className="font-extrabold text-xs text-rose-700 bg-rose-50 hover:bg-rose-600 hover:text-white px-2.5 py-1 rounded-lg border border-rose-200 shadow-2xs flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                          Bổ sung thanh toán
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-3 flex-wrap">
                      <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        {selectedClient.gender === 'Nữ' ? '👩 Nữ' : '👨 Nam'}
                      </span>
                      <span><Phone className="w-3 h-3 inline mr-1 text-slate-400" />{selectedClient.phone}</span>
                      <span>🎂 {selectedClient.dob}</span>
                      <span>💼 {selectedClient.occupation}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">

                  <button
                    onClick={() => openRenewModal(selectedClient)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-3.5 py-2 rounded-full text-xs flex items-center gap-1.5 shadow-md shadow-indigo-100 transition-all active:scale-95 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Gia Hạn Gói
                  </button>
                  <button
                    onClick={() => handleOpenPrintContract(selectedClient)}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-2 rounded-full transition-colors flex items-center gap-1.5 text-xs font-extrabold cursor-pointer active:scale-95 shadow-2xs"
                    title="Xem & in hợp đồng PT online (Khổ A4/PDF)"
                  >
                    <Printer className="w-3.5 h-3.5 text-indigo-600" />
                    In HĐ
                  </button>
                  <button
                    onClick={() => onOpenQuickCheckIn(selectedClient)}
                    className="bg-[#84cc16] hover:bg-[#65a30d] text-white font-extrabold px-4 py-2 rounded-full text-xs flex items-center gap-1.5 shadow-md shadow-lime-200 transition-all active:scale-95 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 fill-white" />
                    Check-in 1-Chạm
                  </button>
                  <button
                    onClick={() => openEditModal(selectedClient)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-full border border-slate-200 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                    title="Chỉnh sửa hồ sơ"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Sửa
                  </button>
                </div>
              </div>

              {/* Sub Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-100 py-3 overflow-x-auto scrollbar-none">
                <button
                  onClick={() => setActiveDetailTab('info')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    activeDetailTab === 'info' ? 'bg-[#4F46E5] text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  1. Thông tin & Ghi chú
                </button>
                <button
                  onClick={() => setActiveDetailTab('metrics')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    activeDetailTab === 'metrics' ? 'bg-[#4F46E5] text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  2. Chỉ số cơ thể ({(selectedClient.bodyMetrics || []).length})
                </button>
                <button
                  onClick={() => setActiveDetailTab('photos')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    activeDetailTab === 'photos' ? 'bg-[#4F46E5] text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  3. Ảnh Before / After
                </button>
                <button
                  onClick={() => setActiveDetailTab('history')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    activeDetailTab === 'history' ? 'bg-[#4F46E5] text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  4. Lịch sử tập ({clientCheckIns.length})
                </button>
              </div>

              {/* Tab Content Area */}
              <div className="flex-1 overflow-y-auto pt-4 space-y-4">
                
                {/* TAB 1: INFO & NOTES */}
                {activeDetailTab === 'info' && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-lg group hover:border-indigo-300 transition-all shadow-xs">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gói:</span>
                        {selectedClient.clientType === 'monthly' ? (
                          <span className="text-[11px] font-black text-amber-700">Thẻ Tháng (Đến {selectedClient.endDate || '---'})</span>
                        ) : (
                          <span className="text-[11px] font-black text-emerald-600">{selectedClient.remainingSessions} / {selectedClient.totalSessions} buổi</span>
                        )}
                        <button onClick={() => openEditModal(selectedClient)} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"><Edit3 className="w-3 h-3 text-slate-400 hover:text-indigo-600" /></button>
                      </div>

                      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-lg group hover:border-indigo-300 transition-all shadow-xs">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Check-in:</span>
                        <span className="text-[11px] font-black text-indigo-600">
                          {clientCheckIns.length > 0
                            ? new Date(clientCheckIns[0].timestamp).toLocaleString('vi-VN', {
                                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                              })
                            : 'Chưa có'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-lg group hover:border-indigo-300 transition-all shadow-xs">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">HĐ:</span>
                        <span className="text-[11px] font-black text-slate-700 flex items-center gap-1">
                          {selectedClient.startDate} <span className="text-slate-400 text-[9px]">→</span> <span className="text-amber-700 bg-amber-50 px-1 py-0.5 rounded">{selectedClient.endDate}</span>
                        </span>
                        <button onClick={() => openEditModal(selectedClient)} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"><Edit3 className="w-3 h-3 text-slate-400 hover:text-indigo-600" /></button>
                      </div>

                      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-lg group hover:border-indigo-300 transition-all shadow-xs">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">TT:</span>
                        <span className="text-[11px] font-black text-[#FF4E00] uppercase">
                          {selectedClient.status === 'active' ? 'ĐANG TẬP' : selectedClient.status === 'expiring' ? 'SẮP HẾT HẠN' : selectedClient.status === 'expired' ? 'ĐÃ HẾT HẠN' : selectedClient.status === 'paused' ? 'BẢO LƯU' : selectedClient.status}
                        </span>
                        <button onClick={() => openEditModal(selectedClient)} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"><Edit3 className="w-3 h-3 text-slate-400 hover:text-indigo-600" /></button>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-4">
                      <div className="pt-3 border-t border-slate-200">
                        <h5 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-indigo-600" /> Lịch Tập Cố Định / Linh Hoạt ({(selectedClient.preferredDays || []).length} buổi/tuần)
                        </h5>
                        {(selectedClient.preferredDays || []).length === 0 ? (
                          <p className="text-xs text-slate-500 italic">Chưa cài đặt lịch tập.</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {(selectedClient.preferredDays || []).map(d => {
                              const dayNames: Record<number, string> = { 1: 'Thứ 2', 2: 'Thứ 3', 3: 'Thứ 4', 4: 'Thứ 5', 5: 'Thứ 6', 6: 'Thứ 7', 0: 'Chủ Nhật' };
                              const timeVal = (selectedClient.dayTimes && selectedClient.dayTimes[d]) || selectedClient.preferredTime || '08:00 - 09:00';
                              return (
                                <div key={d} className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200/90 px-3 py-1.5 rounded-xl text-xs font-black text-indigo-950 shadow-2xs">
                                  <span className="text-indigo-700 font-extrabold">{dayNames[d]}:</span>
                                  <span className="text-emerald-800 bg-white px-2 py-0.5 rounded-md border border-indigo-150 font-bold">{timeVal}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                                            <div className="pt-3 border-t border-slate-200">
                        <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Zap className="w-4 h-4 text-[#FF4E00]" /> Lịch Sử Đóng Tiền & Doanh Thu
                        </h5>
                        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                                <th className="p-2 border-b border-slate-200/80 pl-3">Ngày đóng</th>
                                <th className="p-2 border-b border-slate-200/80">Gói tập</th>
                                <th className="p-2 border-b border-slate-200/80 text-right">Số tiền</th>
                                <th className="p-2 border-b border-slate-200/80 pr-3 text-center">Biên Lai Zalo</th>
                              </tr>
                            </thead>
                            <tbody className="text-[11px]">
                              {payments.filter(p => p.clientId === selectedClient.id).length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="p-3 text-center text-slate-400 italic">Chưa có dữ liệu đóng tiền</td>
                                </tr>
                              ) : (
                                payments.filter(p => p.clientId === selectedClient.id).sort((a,b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()).map(p => (
                                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                    <td className="p-2 pl-3 text-slate-700 font-bold whitespace-nowrap">{parseDateLocal(p.paymentDate).toLocaleDateString('vi-VN')}</td>
                                    <td className="p-2 text-slate-600 max-w-[120px] truncate" title={p.packageName}>{p.packageName}</td>
                                    <td className="p-2 text-right font-black text-emerald-600">
                                      <div className="flex items-center justify-end gap-1.5">
                                        <div className="text-right">
                                          <div>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.amountVnd)}</div>
                                          {p.isEdited && (
                                            <span className="inline-block text-[9px] text-amber-600 font-bold italic bg-amber-50 px-1 py-0.2 rounded border border-amber-200/60 mt-0.5 leading-none">
                                              * đã chỉnh sửa
                                            </span>
                                          )}
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => setEditingPaymentAmount(p)}
                                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                                          title="Chỉnh sửa lại số tiền (Yêu cầu mật khẩu)"
                                        >
                                          <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                    <td className="p-2 pr-3 text-center">
                                      <button
                                        onClick={() => {
                                          setRenewalReceiptData({
                                            clientName: selectedClient.name,
                                            packageName: p.packageName,
                                            amountPaid: p.amountVnd,
                                            addedSessions: p.sessionsCount,
                                            totalRemainingSessions: selectedClient.remainingSessions,
                                            newExpirationDate: p.newEndDate || selectedClient.endDate || '',
                                            createdAt: `${parseDateLocal(p.paymentDate).toLocaleDateString('vi-VN')} 12:00`
                                          });
                                        }}
                                        className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-[10px] font-extrabold hover:bg-blue-100 transition-all border border-blue-200 shadow-xs active:scale-95"
                                        title="Gửi ảnh biên lai đóng tiền qua Zalo"
                                      >
                                        <ImageIcon className="w-3 h-3" /> Gửi
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-slate-200">
                        <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-indigo-600" /> Chi Tiết Lịch Sử Chỉnh Sửa, Gia Hạn & Thay Đổi Hồ Sơ ({(selectedClient.editHistory || []).length})
                        </h5>
                        {(selectedClient.editHistory || []).length === 0 ? (
                          <p className="text-xs text-slate-400 font-medium italic">Chưa có lịch sử thay đổi.</p>
                        ) : (
                          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                            {selectedClient.editHistory?.map(item => renderHistoryEntry(item))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: BODY METRICS & PROGRESS CHART */}
                {activeDetailTab === 'metrics' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-slate-900 text-base">Lịch Sử Cân Nặng & Chỉ Số Cơ Thể</h4>
                      <button
                        onClick={() => setIsMetricModalOpen(true)}
                        className="bg-[#FF4E00] hover:bg-orange-600 text-white font-bold px-4 py-1.5 rounded-full text-xs flex items-center gap-1 shadow-xs"
                      >
                        <Plus className="w-4 h-4" /> Đo Chỉ Số Mới
                      </button>
                    </div>

                    {(selectedClient.bodyMetrics || []).length === 0 ? (
                      <p className="text-xs text-slate-500 py-6 text-center border border-dashed border-slate-200 rounded-2xl">
                        Chưa có dữ liệu đo chỉ số. Hãy bấm "+ Đo Chỉ Số Mới" để bắt đầu theo dõi.
                      </p>
                    ) : (
                      <>
                        {/* Progress Chart */}
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl h-56">
                          <p className="text-xs font-bold text-slate-600 mb-2">Biểu đồ biến thiên Cân nặng (kg)</p>
                          <ResponsiveContainer width="100%" height="80%">
                            <LineChart data={selectedClient.bodyMetrics || []}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                              <XAxis dataKey="date" stroke="#64748B" fontSize={11} />
                              <YAxis stroke="#64748B" fontSize={11} domain={['dataMin - 2', 'dataMax + 2']} />
                              <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', borderRadius: '12px', color: '#0F172A' }} />
                              <Line type="monotone" dataKey="weightKg" name="Cân nặng (kg)" stroke="#4F46E5" strokeWidth={3} dot={{ r: 5, fill: '#4F46E5' }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Metric History Table */}
                        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                          <table className="w-full text-left text-xs text-slate-700">
                            <thead className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200">
                              <tr>
                                <th className="p-3">Ngày đo</th>
                                <th className="p-3">Cân nặng (kg)</th>
                                <th className="p-3">% Mỡ</th>
                                <th className="p-3">Vòng eo (cm)</th>
                                <th className="p-3">Vòng mông (cm)</th>
                                <th className="p-3">Ghi chú</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {(selectedClient.bodyMetrics || []).map(m => (
                                <tr key={m.id} className="hover:bg-slate-50">
                                  <td className="p-3 font-bold text-slate-900">{m.date}</td>
                                  <td className="p-3 text-[#4F46E5] font-black">{m.weightKg} kg</td>
                                  <td className="p-3">{m.bodyFatPercent ? `${m.bodyFatPercent}%` : '-'}</td>
                                  <td className="p-3">{m.waistCm ? `${m.waistCm} cm` : '-'}</td>
                                  <td className="p-3">{m.hipsCm ? `${m.hipsCm} cm` : '-'}</td>
                                  <td className="p-3 text-slate-500">{m.notes || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* TAB 3: BEFORE / AFTER PHOTOS */}
                {activeDetailTab === 'photos' && (
                  <div className="space-y-4">
                    <h4 className="font-extrabold text-slate-900 text-base">Hình Ảnh So Sánh Vóc Dáng (Before / After)</h4>

                    {selectedClient.beforeAfterPhotos?.beforeUrl ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center space-y-2">
                          <span className="text-xs font-bold bg-white text-slate-700 px-3 py-1 rounded-full border border-slate-200 shadow-xs">
                            BEFORE ({selectedClient.beforeAfterPhotos.beforeDate || 'Đầu khóa'})
                          </span>
                          <img 
                            src={selectedClient.beforeAfterPhotos.beforeUrl} 
                            alt="Before" 
                            className="w-full h-64 object-cover rounded-xl border border-slate-200"
                          />
                        </div>

                        <div className="bg-indigo-50/50 p-3.5 rounded-2xl border border-indigo-200 text-center space-y-2">
                          <span className="text-xs font-bold bg-[#4F46E5] text-white px-3 py-1 rounded-full shadow-xs">
                            AFTER ({selectedClient.beforeAfterPhotos.afterDate || 'Hiện tại'})
                          </span>
                          <img 
                            src={selectedClient.beforeAfterPhotos.afterUrl || selectedClient.beforeAfterPhotos.beforeUrl} 
                            alt="After" 
                            className="w-full h-64 object-cover rounded-xl border border-indigo-200"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-3">
                        <ImageIcon className="w-10 h-10 text-slate-400 mx-auto" />
                        <p className="text-sm text-slate-500 font-medium">Chưa có ảnh Before / After cho học viên này.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: CHECK-IN HISTORY */}
                {activeDetailTab === 'history' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-slate-900 text-base">Lịch Sử Buổi Tập Đã Đi</h4>
                      <span className="text-xs text-slate-500 font-semibold">Tổng cộng {clientCheckIns.length} lần check-in</span>
                    </div>

                    {clientCheckIns.length === 0 ? (
                      <p className="text-xs text-slate-500 py-6 text-center border border-dashed border-slate-200 rounded-2xl">
                        Chưa có lịch sử tập luyện.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {clientCheckIns.map(ci => (
                          <div key={ci.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                            <div>
                              <p className="text-sm font-bold text-slate-900">{ci.dayPlanName}</p>
                              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                                🕒 {new Date(ci.timestamp).toLocaleString('vi-VN')}
                              </p>
                              {ci.notes && <p className="text-xs text-indigo-600 font-medium italic mt-1">"{ci.notes}"</p>}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-3 py-1 rounded-full border border-emerald-200">
                                Trừ 1 buổi (còn {ci.sessionsRemainingAfter})
                              </span>
                              <button
                                onClick={() => {
                                  setEditCheckInTarget(ci);
                                  setEditCheckInPlanName(ci.dayPlanName || '');
                                }}
                                className="text-xs text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-1 rounded-full font-bold flex items-center transition-colors shadow-xs cursor-pointer"
                                title="Sửa tên bài tập"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setCancelCheckInTarget({ id: ci.id, clientName: selectedClient?.name || '' })}
                                className="text-xs text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1 rounded-full font-bold flex items-center gap-1 transition-colors shadow-xs cursor-pointer"
                                title="Hủy lượt check-in này"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-rose-600" /> Hủy Check-in (+1 Buổi)
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 5: WORKOUT PROGRAM LINK */}
                {activeDetailTab === 'program' && (
                  <div className="space-y-4">
                    {clientProgram ? (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-extrabold text-[#4F46E5] text-lg">{clientProgram.title}</h4>
                          <button
                            onClick={() => onGoToProgram(selectedClient.id)}
                            className="bg-[#4F46E5] hover:bg-indigo-700 text-white font-bold px-3.5 py-1.5 rounded-full text-xs flex items-center gap-1 shadow-xs"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Mở Chi Tiết Giáo Án
                          </button>
                        </div>

                        <p className="text-xs text-slate-500 font-medium">Bao gồm {clientProgram.days.length} buổi tập tiêu chuẩn:</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {clientProgram.days.map(d => (
                            <div key={d.id} className="p-3 bg-white border border-slate-200 rounded-xl">
                              <h5 className="font-bold text-slate-900 text-sm">{d.dayName}</h5>
                              <p className="text-xs text-slate-500 mt-1">{d.exercises.length} bài tập (Set, Rep, Kg, RPE)</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-3">
                        <ClipboardList className="w-10 h-10 text-slate-600 mx-auto" />
                        <p className="text-sm text-slate-400">Học viên này chưa có giáo án riêng.</p>
                        <button
                          onClick={() => onGoToProgram(selectedClient.id)}
                          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs"
                        >
                          + Tạo Giáo Án Ngay
                        </button>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </>
    );
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-zinc-900 text-white border border-slate-800 p-6 rounded-3xl shadow-md">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-[#FF4E00]" />
            Quản lý học viên ({clients.filter(c => c.status !== 'closed').length})
          </h2>
          <p className="text-sm text-slate-300 font-medium mt-0.5">Danh sách đầy đủ hồ sơ, chỉ số cơ thể & lịch sử tập luyện</p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          {/* Single View Mode Toggle Button */}
          <button
            type="button"
            onClick={() => {
              const nextMode = viewMode === 'horizontal' ? 'split' : 'horizontal';
              setViewMode(nextMode);
              localStorage.setItem('nb_gym_client_view_mode', nextMode);
            }}
            className="bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white px-3 py-2 rounded-2xl text-xs border border-slate-700/80 font-extrabold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
            title="Nhấp để chuyển đổi giữa Dạng Bảng Ngang và Dạng Cột Đôi"
          >
            {viewMode === 'horizontal' ? (
              <>
                <Table className="w-3.5 h-3.5 text-[#FF4E00]" />
                <span>Dạng Bảng ngang</span>
              </>
            ) : (
              <>
                <LayoutGrid className="w-3.5 h-3.5 text-[#FF4E00]" />
                <span>Dạng Cột đôi</span>
              </>
            )}
          </button>

          {onGoToAudit && (
            <button
              onClick={onGoToAudit}
              className="bg-white/10 hover:bg-white/20 text-white font-extrabold px-3.5 py-2 rounded-2xl text-xs border border-white/20 transition-all flex items-center gap-1.5 active:scale-95 backdrop-blur-xs cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-orange-400" />
              Lịch sử & hoàn tác
            </button>
          )}

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#FF4E00] hover:bg-orange-600 text-white font-extrabold px-4 py-2 rounded-2xl text-xs shadow-lg transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            + Thêm học viên
          </button>
        </div>
      </div>

      {/* VIEW MODE CONDITIONAL RENDER: HORIZONTAL TABLE VS SPLIT GRID */}
      {viewMode === 'horizontal' ? (
        /* HORIZONTAL TABLE VIEW (Image 2 Style - Compact & Clean) */
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm space-y-4 animate-fade-in">
          {/* Top Control Filter Bar */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-slate-50/90 p-3.5 rounded-2xl border border-slate-200/80">
            {/* Search & Status Filters */}
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative min-w-[240px] flex-1 sm:flex-none">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Nhập tên học viên, SĐT..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white text-slate-800 text-xs font-semibold pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] shadow-2xs"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                    statusFilter === 'all' ? 'bg-[#4F46E5] text-white shadow-2xs' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Tất cả ({clients.filter(c => c.status !== 'closed').length})
                </button>
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                    statusFilter === 'active' ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Đang tập ({clients.filter(c => c.status === 'active').length})
                </button>
                <button
                  onClick={() => setStatusFilter('expiring')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                    statusFilter === 'expiring' ? 'bg-red-500 text-white shadow-2xs' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  🔴 Sắp hết buổi ({clients.filter(c => c.status === 'expiring').length})
                </button>
                <button
                  onClick={() => setStatusFilter('expired')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                    statusFilter === 'expired' ? 'bg-slate-800 text-white shadow-2xs' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Hết hạn ({clients.filter(c => c.status === 'expired').length})
                </button>
                <button
                  onClick={() => setStatusFilter('closed')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                    statusFilter === 'closed' ? 'bg-amber-800 text-white shadow-2xs' : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  📁 Hợp đồng đã đóng ({clients.filter(c => c.status === 'closed').length})
                </button>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2 self-end lg:self-auto flex-wrap">
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as any)}
                className="bg-white text-slate-800 text-xs font-bold py-2.5 px-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] cursor-pointer shadow-2xs"
              >
                <option value="newest">🆕 Mới nhất</option>
                <option value="oldest">⏳ Cũ nhất</option>
                <option value="name_asc">🔤 Tên A → Z</option>
                <option value="name_desc">🔤 Tên Z → A</option>
                <option value="sessions_asc">⚠️ Sắp hết buổi</option>
                <option value="sessions_desc">💪 Buổi nhiều nhất</option>
              </select>

              <button
                onClick={handleExportExcel}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold px-3.5 py-2.5 rounded-xl text-xs border border-emerald-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Xuất bản tính Excel / CSV"
              >
                <Download className="w-3.5 h-3.5 text-emerald-700" />
                <span>Xuất Excel</span>
              </button>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-[#FF4E00] hover:bg-orange-600 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Thêm Học Viên</span>
              </button>
            </div>
          </div>

          {/* Mobile Card List (Dành riêng cho màn hình điện thoại/nhỏ) */}
          <div className="block md:hidden space-y-3">
            {filteredClients.length === 0 ? (
              <div className="p-6 text-center text-slate-400 font-semibold bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                Không tìm thấy học viên nào phù hợp với bộ lọc.
              </div>
            ) : (
              filteredClients.map((client, idx) => {
                const isSelected = selectedClient?.id === client.id;
                const originalIdx = clients.findIndex(c => c.id === client.id);
                const codeHV = `HV-${1000 + (clients.length - (originalIdx !== -1 ? originalIdx : idx))}`;
                return (
                  <div
                    key={client.id}
                    onClick={() => { setSelectedClient(client); setIsDetailModalOpen(true); }}
                    
                    title="Click để mở chi tiết"
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-br from-indigo-50/95 via-indigo-50/70 to-slate-50 border-indigo-500 ring-2 ring-indigo-500/30 shadow-md'
                        : 'bg-gradient-to-br from-slate-50/90 via-slate-100/60 to-slate-50 border-slate-300 hover:border-indigo-400 hover:bg-white shadow-sm hover:shadow-md'
                    }`}
                  >
                    {/* Top Row: Avatar + Name + Badges + Status */}
                    <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-200/80">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={client.avatarUrl}
                          alt={client.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-indigo-200 shrink-0 shadow-2xs"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-black text-slate-900 text-sm truncate">{client.name}</span>
                            {client.trainingType === 'ca_nhom' ? (
                              <span className="text-[10px] bg-purple-100 text-purple-900 border border-purple-300 font-extrabold px-1.5 py-0.2 rounded-full flex items-center gap-0.5 shrink-0">
                                <Users className="w-2.5 h-2.5 text-purple-600 fill-purple-200" /> Ca Nhóm
                              </span>
                            ) : (
                              <span className="text-[10px] bg-sky-50 text-sky-800 border border-sky-200 font-bold px-1.5 py-0.2 rounded-full flex items-center gap-0.5 shrink-0">
                                <User className="w-2.5 h-2.5 text-sky-600" /> 1/1
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-semibold flex-wrap">
                            <span className="font-mono text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100 text-[10px]">
                              {codeHV}
                            </span>
                            <span className="flex items-center gap-1 text-[11px]">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{client.phone}</span>
                            </span>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200 font-medium">
                              {client.gender}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        {getWarningBadge(client)}
                      </div>
                    </div>

                    {/* Details Grid (2 Cols) */}
                    <div className="grid grid-cols-2 gap-2 my-2.5 text-xs bg-white/90 p-2.5 rounded-xl border border-slate-200/90 shadow-2xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block font-semibold uppercase tracking-wider">Gói tập</span>
                        <span className="font-bold text-slate-800 text-xs">{client.packageName || 'Gói PT'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block font-semibold uppercase tracking-wider">
                          {client.clientType === 'monthly' ? 'Loại thẻ' : 'Số buổi (Còn/Tổng)'}
                        </span>
                        {client.clientType === 'monthly' ? (
                          <span className="font-black text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded-md border border-amber-300 inline-block text-xs mt-0.5">
                            📅 Khách Tháng
                          </span>
                        ) : (
                          <span className="font-black text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-200 inline-block text-xs mt-0.5">
                            {client.remainingSessions} / {client.totalSessions}b
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block font-semibold uppercase tracking-wider">Đăng ký</span>
                        <span className="font-mono text-slate-700 text-xs font-semibold">{client.startDate || '---'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block font-semibold uppercase tracking-wider">Hạn hợp đồng</span>
                        <span className="font-mono text-slate-900 text-xs font-bold">{client.endDate || '---'}</span>
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="flex items-center justify-end gap-1.5 pt-1 flex-wrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenQuickCheckIn(client);
                        }}
                        className="flex-1 min-w-[90px] py-1.5 bg-lime-500 hover:bg-lime-600 text-white text-xs font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <Zap className="w-3.5 h-3.5 fill-white" />
                        <span>Điểm danh</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openRenewModal(client);
                        }}
                        className="flex-1 min-w-[80px] py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Gia hạn</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(client);
                        }}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl transition-all active:scale-95 cursor-pointer"
                        title="Sửa thông tin"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Clean Desktop Table View (Dành cho máy tính / máy tính bảng) */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200/90 shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/90 text-slate-700 font-extrabold border-b border-slate-200 uppercase tracking-wider text-[11px] whitespace-nowrap">
                  <th className="py-3 px-3 text-center border-r border-slate-200 w-12">#</th>
                  <th className="py-3 px-3 border-r border-slate-200">Mã HV</th>
                  <th className="py-3 px-3 border-r border-slate-200 min-w-[200px]">Học Viên (Tên & SĐT)</th>
                  <th className="py-3 px-3 border-r border-slate-200">Gói Tập</th>
                  <th className="py-3 px-3 border-r border-slate-200 text-center">Số Buổi (Còn/Tổng)</th>
                  <th className="py-3 px-3 border-r border-slate-200 text-center">Ngày Đăng Ký</th>
                  <th className="py-3 px-3 border-r border-slate-200 text-center">Hạn Hợp Đồng</th>
                  <th className="py-3 px-3 border-r border-slate-200 text-center">Tình Trạng</th>
                  <th className="py-3 px-3 text-center min-w-[220px]">Thao Tác Nhanh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 font-semibold">
                      Không tìm thấy học viên nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client, idx) => {
                    const isSelected = selectedClient?.id === client.id;
                    const originalIdx = clients.findIndex(c => c.id === client.id);
                const codeHV = `HV-${1000 + (clients.length - (originalIdx !== -1 ? originalIdx : idx))}`;
                    return (
                      <tr 
                        key={client.id}
                        onClick={() => { setSelectedClient(client); setIsDetailModalOpen(true); }}
                        
                        title="Click để mở chi tiết"
                        className={`hover:bg-indigo-50/50 transition-colors cursor-pointer ${
                          isSelected ? 'bg-indigo-50/80 font-medium' : ''
                        }`}
                      >
                        <td className="py-3 px-3 text-center font-bold text-slate-500 border-r border-slate-200">{idx + 1}</td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-600 border-r border-slate-200 whitespace-nowrap">{codeHV}</td>
                        <td className="py-3 px-3 border-r border-slate-200">
                          <div className="flex items-center gap-2.5">
                            <img src={client.avatarUrl} alt={client.name} className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0" />
                            <div className="min-w-0">
                              <span className="font-black text-indigo-950 hover:text-indigo-600 text-sm flex items-center gap-1.5 flex-wrap leading-tight">
                                <span>{client.name}</span>
                                {client.trainingType === 'ca_nhom' ? (
                                  <span className="text-[10px] bg-purple-100 text-purple-900 border border-purple-300 font-extrabold px-1.5 py-0.2 rounded-full flex items-center gap-0.5 shrink-0 shadow-2xs">
                                    <Users className="w-2.5 h-2.5 text-purple-600 fill-purple-200" /> Ca Nhóm
                                  </span>
                                ) : (
                                  <span className="text-[10px] bg-sky-50 text-sky-800 border border-sky-200 font-bold px-1.5 py-0.2 rounded-full flex items-center gap-0.5 shrink-0">
                                    <User className="w-2.5 h-2.5 text-sky-600" /> 1/1
                                  </span>
                                )}
                              </span>
                              <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                                <Phone className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                <span>{client.phone}</span>
                                <span className="text-[9px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded border border-slate-200">
                                  {client.gender}
                                </span>
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800 border-r border-slate-200">{client.packageName || 'Gói PT'}</td>
                        <td className="py-3 px-3 text-center border-r border-slate-200 whitespace-nowrap">
                          {client.clientType === 'monthly' ? (
                            <span className="font-black text-amber-900 bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-300 inline-block shadow-2xs">
                              📅 Khách Tháng
                            </span>
                          ) : (
                            <span className="font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-block">
                              {client.remainingSessions} / {client.totalSessions}b
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-600 font-mono text-[11px] border-r border-slate-200 whitespace-nowrap">{client.startDate || '---'}</td>
                        <td className="py-3 px-3 text-center text-slate-700 font-mono text-[11px] font-bold border-r border-slate-200 whitespace-nowrap">{client.endDate || '---'}</td>
                        <td className="py-3 px-3 text-center border-r border-slate-200 whitespace-nowrap">
                          {getWarningBadge(client)}
                          {getClientTotalPaid(client.id) === 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedClient(client);
                                setAddPaymentData(prev => ({...prev, amountVnd: 0, paymentDate: getTodayDateStr()}));
                                setIsAddPaymentModalOpen(true);
                              }}
                              className="block mx-auto mt-1 px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-bold rounded border border-rose-200 transition-colors"
                            >
                              Thu tiền
                            </button>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenQuickCheckIn(client);
                              }}
                              className="p-1.5 bg-lime-500 hover:bg-lime-600 text-white rounded-lg transition-all active:scale-95 shadow-2xs cursor-pointer"
                              title="Check-in điểm danh"
                            >
                              <Zap className="w-3.5 h-3.5 fill-white" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openRenewModal(client);
                              }}
                              className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all active:scale-95 shadow-2xs cursor-pointer"
                              title="Gia hạn gói tập"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(client);
                              }}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg transition-all active:scale-95 cursor-pointer"
                              title="Sửa thông tin hồ sơ & hợp đồng"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Main Grid: Left Client List, Right Client Detail */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Search, Filter, Client List (4 Cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-4 shadow-sm flex flex-col lg:h-[750px] min-h-[380px] max-h-[750px]">
          
          {/* Search Bar & Sort Selection */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm tên hoặc SĐT..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 text-slate-800 placeholder-slate-400 text-sm pl-10 pr-3 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white"
              />
            </div>

            <div className="relative w-full sm:w-auto">
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as any)}
                className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2.5 pl-8 pr-7 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white appearance-none cursor-pointer transition-colors shadow-2xs"
                title="Sắp xếp danh sách học viên"
              >
                <option value="newest">🆕 Sắp xếp: Mới nhất → Cũ nhất</option>
                <option value="oldest">⏳ Sắp xếp: Cũ nhất → Mới nhất</option>
                <option value="name_asc">🔤 Sắp xếp: Tên từ A → Z</option>
                <option value="name_desc">🔤 Sắp xếp: Tên từ Z → A</option>
                <option value="sessions_asc">⚠️ Buổi ít nhất (Sắp hết)</option>
                <option value="sessions_desc">💪 Buổi còn lại nhiều nhất</option>
              </select>
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-3 scrollbar-none border-b border-slate-100">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === 'all' ? 'bg-[#4F46E5] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả ({clients.filter(c => c.status !== 'closed').length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === 'active' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Đang tập ({clients.filter(c => c.status === 'active').length})
            </button>
            <button
              onClick={() => setStatusFilter('expiring')}
              className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === 'expiring' ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🔴 Sắp hết ({clients.filter(c => c.status === 'expiring').length})
            </button>
            <button
              onClick={() => setStatusFilter('expired')}
              className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === 'expired' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Hết hạn ({clients.filter(c => c.status === 'expired').length})
            </button>
            <button
              onClick={() => setStatusFilter('closed')}
              className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === 'closed' ? 'bg-amber-800 text-white' : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              📁 Đã đóng ({clients.filter(c => c.status === 'closed').length})
            </button>
          </div>

          {/* Client Items List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredClients.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-sm font-medium">
                Không tìm thấy học viên phù hợp.
              </div>
            ) : (
              filteredClients.map(client => {
                const isSelected = selectedClient?.id === client.id;
                return (
                  <div
                    key={client.id}
                    onClick={() => { setSelectedClient(client); setIsDetailModalOpen(true); }}
                    
                    title="Click để mở chi tiết"
                    className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                      isSelected 
                        ? 'bg-gradient-to-r from-indigo-100/90 via-indigo-50 to-slate-50 border-indigo-600 shadow-md ring-2 ring-indigo-400/30' 
                        : 'bg-slate-100/80 border-slate-300 hover:bg-white hover:border-indigo-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img 
                        src={client.avatarUrl} 
                        alt={client.name} 
                        className="w-10 h-10 rounded-full object-cover border-2 border-indigo-200 shrink-0 shadow-2xs" 
                      />
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 flex-wrap">
                          {client.name}
                          {client.trainingType === 'ca_nhom' ? (
                            <span className="text-[10px] bg-purple-100 text-purple-900 border border-purple-300 font-extrabold px-1.5 py-0.2 rounded-full flex items-center gap-0.5 shrink-0 shadow-2xs">
                              <Users className="w-2.5 h-2.5 text-purple-600 fill-purple-200" /> Ca Nhóm
                            </span>
                          ) : (
                            <span className="text-[10px] bg-sky-50 text-sky-800 border border-sky-200 font-bold px-1.5 py-0.2 rounded-full flex items-center gap-0.5 shrink-0">
                              <User className="w-2.5 h-2.5 text-sky-600" /> 1/1
                            </span>
                          )}
                          <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                            {client.gender === 'Nữ' ? 'Nữ' : 'Nam'}
                          </span>
                        </h4>
                        <p className="text-xs text-slate-500">{client.packageName}</p>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end gap-1">
                      {getWarningBadge(client)}
                      {getClientTotalPaid(client.id) === 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedClient(client);
                            setAddPaymentData(prev => ({...prev, amountVnd: 0, paymentDate: getTodayDateStr()}));
                            setIsAddPaymentModalOpen(true);
                          }}
                          className="text-[10px] bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 font-bold px-2 py-0.5 rounded-full border border-rose-200 transition-colors flex items-center gap-0.5 cursor-pointer"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                          Thu tiền
                        </button>
                      )}
                      <div className="flex items-center gap-1 flex-wrap justify-end">

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openRenewModal(client);
                          }}
                          className="text-[10px] bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-200 transition-colors flex items-center gap-0.5 cursor-pointer"
                          title="Gia hạn gói tập mới"
                        >
                          <RotateCcw className="w-2.5 h-2.5" /> Gia hạn
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenQuickCheckIn(client);
                          }}
                          className="text-[10px] bg-white hover:bg-[#84cc16] hover:text-white text-emerald-700 font-bold px-2.5 py-0.5 rounded-full border border-slate-200 shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Zap className="w-2.5 h-2.5" /> Check-in
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected Client Full Detail Panel (8 Cols) */}
        <div className="lg:col-span-8 bg-slate-50/70 border-2 border-slate-200 rounded-3xl p-4 sm:p-6 shadow-sm lg:h-[750px] min-h-[420px] flex flex-col overflow-hidden">
          {selectedClient ? renderClientDetailContent() : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
              <Users className="w-12 h-12 mb-2 stroke-1" />
              <p className="text-sm">Chọn một học viên bên trái để xem chi tiết hồ sơ.</p>
            </div>
          )}
        </div>
      </div>
    )}




      {/* DETAIL MODAL (Dành cho Cửa Sổ Chi Tiết Lớn) */}
      {isDetailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsDetailModalOpen(false)}>
          <div className="bg-white border-2 border-indigo-200 rounded-3xl w-full max-w-[1200px] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] relative" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setIsDetailModalOpen(false)} 
              className="absolute top-4 right-4 z-10 p-2 text-slate-500 hover:text-slate-800 bg-white/90 backdrop-blur-md hover:bg-slate-200 rounded-full transition-colors shadow-md border border-slate-200"
              title="Đóng (Esc)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <div className="flex-1 flex flex-col p-4 sm:p-6 bg-slate-50/70 overflow-hidden">
              {renderClientDetailContent()}
            </div>
          </div>
        </div>
      )}
      
      {/* ADD PAYMENT MODAL */}
      {isAddPaymentModalOpen && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 text-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <h3 className="font-extrabold text-lg text-slate-900">Bổ sung thanh toán</h3>
              <button onClick={() => setIsAddPaymentModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200/60 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const clientIdParts = selectedClient.id.split('-');
              const createdAt = clientIdParts.length > 1 ? parseInt(clientIdParts[1]) : 0;
              const isOlderThan24h = (Date.now() - createdAt) > 24 * 60 * 60 * 1000;
              
              if (isOlderThan24h) {
                setAddPaymentConfirmTarget(selectedClient);
              } else {
                handleExecuteAddPayment(selectedClient);
              }
            }} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Học viên</label>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700">
                  {selectedClient.name} - {selectedClient.packageName}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Số tiền thực thu (VNĐ)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={addPaymentData.amountVnd || ''}
                  onChange={(e) => setAddPaymentData({ ...addPaymentData, amountVnd: Number(e.target.value) })}
                  className="w-full bg-slate-100 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                />
                <div className="text-xs text-indigo-600 font-semibold mt-1">
                  {addPaymentData.amountVnd > 0 ? `= ${addPaymentData.amountVnd.toLocaleString('vi-VN')} VNĐ` : ''}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Phương thức thanh toán</label>
                <select
                  value={addPaymentData.paymentMethod}
                  onChange={(e) => setAddPaymentData({ ...addPaymentData, paymentMethod: e.target.value as any })}
                  className="w-full bg-slate-100 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                >
                  <option value="Chuyển khoản">Chuyển khoản</option>
                  <option value="Tiền mặt">Tiền mặt</option>
                  <option value="Thẻ">Quẹt thẻ (Máy POS)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Ngày thu tiền</label>
                <input
                  type="date"
                  required
                  value={addPaymentData.paymentDate}
                  onChange={(e) => setAddPaymentData({ ...addPaymentData, paymentDate: e.target.value })}
                  className="w-full bg-slate-100 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Ghi chú (Tùy chọn)</label>
                <input
                  type="text"
                  value={addPaymentData.notes}
                  onChange={(e) => setAddPaymentData({ ...addPaymentData, notes: e.target.value })}
                  className="w-full bg-slate-100 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddPaymentModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-full text-sm font-bold hover:bg-slate-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-full text-sm shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD CLIENT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 text-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <h3 className="font-extrabold text-lg text-slate-900">+ Thêm học viên mới</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200/60 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Họ và Tên *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nguyễn Văn A"
                    className="w-full bg-slate-100 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Số điện thoại *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0901234567"
                    className="w-full bg-slate-100 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Giới tính *</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 h-[42px] items-center">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, gender: 'Nam' })}
                      className={`h-full rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        formData.gender === 'Nam'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      👨 Nam
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, gender: 'Nữ' })}
                      className={`h-full rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        formData.gender === 'Nữ'
                          ? 'bg-rose-500 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      👩 Nữ
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Hình thức tập *</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 h-[42px] items-center">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, trainingType: '1/1' })}
                      className={`h-full rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        formData.trainingType === '1/1' || !formData.trainingType
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <User className="w-3.5 h-3.5" /> 1/1 (Cá Nhân)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, trainingType: 'ca_nhom' })}
                      className={`h-full rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        formData.trainingType === 'ca_nhom'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" /> Ca Nhóm
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Ngày sinh</label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full bg-slate-100 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Nghề nghiệp</label>
                  <input
                    type="text"
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    placeholder="Kỹ sư, Văn phòng..."
                    className="w-full bg-slate-100 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white"
                  />
                </div>

                {/* Contract Type Selection */}
                <div className="sm:col-span-2 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-3.5 space-y-2">
                  <label className="block text-xs font-black text-indigo-950 uppercase tracking-wide">
                    🏷️ Loại Hình Đăng Ký Học Viên
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          clientType: 'session',
                          packageName: formData.packageName.includes('Khách Tháng') ? 'Gói 12 buổi' : formData.packageName,
                          totalSessions: formData.totalSessions || 12,
                          remainingSessions: formData.totalSessions || 12
                        });
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-center ${
                        formData.clientType !== 'monthly'
                          ? 'bg-white border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs text-indigo-950 font-extrabold'
                          : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white font-medium'
                      }`}
                    >
                      <span className="text-xs font-black text-indigo-700">🏋️ Gói Tập Theo Buổi (PT 1:1)</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">Trừ dần 1 buổi mỗi lần check-in.</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const todayStr = formData.startDate || getTodayDateStr();
                        const todayDate = new Date(todayStr);
                        todayDate.setMonth(todayDate.getMonth() + 1);
                        const endStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;
                        setFormData({
                          ...formData,
                          clientType: 'monthly',
                          packageName: 'Khách Tháng (1 Tháng)',
                          totalSessions: 0,
                          remainingSessions: 0,
                          endDate: endStr
                        });
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-center ${
                        formData.clientType === 'monthly'
                          ? 'bg-amber-500 border-amber-600 text-white shadow-md ring-2 ring-amber-400/30 font-extrabold'
                          : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white font-medium'
                      }`}
                    >
                      <span className="text-xs font-black text-amber-950">📅 Khách Tháng (Không Tính Buổi)</span>
                      <span className={`text-[10px] mt-0.5 ${formData.clientType === 'monthly' ? 'text-amber-100' : 'text-slate-500'}`}>
                        Quản lý hoàn toàn theo ngày bắt đầu & kết thúc.
                      </span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Gói tập (Tự điền tay tên gói/số buổi) *</label>
                  <input
                    type="text"
                    required
                    value={formData.packageName}
                    onChange={(e) => {
                      const val = e.target.value;
                      const match = val.match(/\d+/);
                      const sessions = match ? parseInt(match[0]) : formData.totalSessions;
                      setFormData({
                        ...formData,
                        packageName: val,
                        ...(match && formData.clientType !== 'monthly' ? { totalSessions: sessions, remainingSessions: sessions } : {})
                      });
                    }}
                    placeholder={formData.clientType === 'monthly' ? 'VD: Khách Tháng (1 Tháng), Thẻ Tập 3 Tháng...' : 'VD: Gói 12 buổi, Gói 20 buổi...'}
                    className="w-full bg-slate-100 text-slate-900 border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white font-extrabold"
                  />
                  {formData.clientType !== 'monthly' ? (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="text-[10px] text-slate-400 self-center font-bold mr-0.5">Mẫu nhanh:</span>
                      {[12, 16, 20, 24, 30, 36, 48, 72, 100].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => {
                            const pkgName = `Gói ${num} buổi`;
                            setFormData({
                              ...formData,
                              packageName: pkgName,
                              totalSessions: num,
                              remainingSessions: num
                            });
                          }}
                          className={`px-2 py-0.5 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                            formData.packageName === `Gói ${num} buổi`
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-slate-200/80 hover:bg-slate-300 text-slate-700'
                          }`}
                        >
                          {num}b
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="text-[10px] text-slate-400 self-center font-bold mr-0.5">Mẫu nhanh:</span>
                      {[
                        { label: '1 Tháng', m: 1 },
                        { label: '3 Tháng', m: 3 },
                        { label: '6 Tháng', m: 6 },
                        { label: '12 Tháng', m: 12 }
                      ].map((item) => (
                        <button
                          key={item.m}
                          type="button"
                          onClick={() => {
                            const todayStr = formData.startDate || getTodayDateStr();
                            const dt = new Date(todayStr);
                            dt.setMonth(dt.getMonth() + item.m);
                            const endStr = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
                            setFormData({
                              ...formData,
                              packageName: `Khách Tháng (${item.label})`,
                              endDate: endStr
                            });
                          }}
                          className="px-2 py-0.5 text-[11px] font-bold rounded-lg bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 transition-colors cursor-pointer"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    {formData.clientType === 'monthly' ? 'Số buổi (Thẻ Khách Tháng)' : 'Số buổi đăng ký (Số buổi còn lại ban đầu) *'}
                  </label>
                  {formData.clientType === 'monthly' ? (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <span>📅 Không tính buổi (Học viên tập tự do theo ngày hạn hợp đồng)</span>
                    </div>
                  ) : (
                    <>
                      <input
                        type="number"
                        min="1"
                        required
                        value={formData.totalSessions}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value) || 0);
                          setFormData({ ...formData, totalSessions: val, remainingSessions: val });
                        }}
                        className="w-full bg-slate-100 text-[#4F46E5] font-extrabold border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white"
                      />
                      <span className="text-[11px] text-indigo-600 font-semibold mt-1 block">
                        ⚡ Học viên sẽ khởi tạo ngay với {formData.totalSessions} buổi còn lại.
                      </span>
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Ngày bắt đầu</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full bg-slate-100 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Ngày kết thúc hợp đồng</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full bg-slate-100 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white"
                  />
                </div>

                {/* Bảng ghi số ngày (hạn sử dụng) cho nhanh */}
                <div className="sm:col-span-2">
                  <QuickDaysBox
                    startDate={formData.startDate}
                    endDate={formData.endDate}
                    onUpdateEndDate={(newEnd) => setFormData(prev => ({ ...prev, endDate: newEnd }))}
                    label="Bảng tính & chọn nhanh số ngày hạn sử dụng"
                  />
                </div>
              </div>

              {/* Payment / Tuition Section */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
                <label className="text-xs font-black text-emerald-950 uppercase tracking-wide flex items-center gap-1.5">
                  💵 Số Tiền Học Phí & Khởi Tạo Thu Chi
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-emerald-900 mb-1">
                      Số tiền thu / Học phí gói tập (VNĐ) *
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      value={formData.amountVnd ? new Intl.NumberFormat('vi-VN').format(formData.amountVnd) : ''}
                      onChange={(e) => {
                        const digitsOnly = e.target.value.replace(/\D/g, '');
                        setFormData({
                          ...formData,
                          amountVnd: digitsOnly ? parseInt(digitsOnly, 10) : 0
                        });
                      }}
                      placeholder="0"
                      className="w-full bg-white text-emerald-950 font-black border border-emerald-300 rounded-xl p-2.5 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                    />
                    <span className="text-[11px] font-bold text-emerald-700 mt-1 block">
                      {formData.amountVnd > 0 ? `= ${formData.amountVnd.toLocaleString('vi-VN')} VNĐ` : 'Nhập 0 nếu chưa thu tiền'}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-emerald-900 mb-1">
                      Hình thức thanh toán
                    </label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                      className="w-full bg-white text-slate-900 font-bold border border-emerald-300 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Chuyển khoản">💳 Chuyển khoản ngân hàng</option>
                      <option value="Tiền mặt">💵 Tiền mặt</option>
                      <option value="Thẻ">💳 Quẹt thẻ (POS)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Schedule / PT Appointment Auto-Generation Section */}
              <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-indigo-950 uppercase tracking-wide flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#4F46E5]" />
                    Lịch tập cố định (tự động tạo lịch hẹn PT)
                  </label>
                  <span className="text-[11px] font-bold text-indigo-600 bg-white px-2 py-0.5 rounded-md border border-indigo-200">
                    {formData.preferredDays.length} buổi/tuần
                  </span>
                </div>

                {/* Day selector */}
                <div>
                  <span className="block text-[11px] font-bold text-slate-600 mb-1">Chọn thứ tập trong tuần:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { label: 'T2', val: 1 },
                      { label: 'T3', val: 2 },
                      { label: 'T4', val: 3 },
                      { label: 'T5', val: 4 },
                      { label: 'T6', val: 5 },
                      { label: 'T7', val: 6 },
                      { label: 'CN', val: 0 },
                    ].map(d => {
                      const isChecked = formData.preferredDays.includes(d.val);
                      return (
                        <button
                          key={d.val}
                          type="button"
                          onClick={() => {
                            const newDays = isChecked
                              ? formData.preferredDays.filter(day => day !== d.val)
                              : [...formData.preferredDays, d.val];
                            setFormData({ ...formData, preferredDays: newDays });
                          }}
                          className={`text-xs font-extrabold px-3 py-1.5 rounded-xl border transition-all ${
                            isChecked
                              ? 'bg-[#4F46E5] text-white border-[#4F46E5] shadow-xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Preferred time slot */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Khung giờ tập cố định (có thể tự nhập bằng số):</label>
                  <input
                    type="text"
                    list="time-slots-add"
                    value={formData.preferredTime}
                    onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                    placeholder="VD: 05:15 - 06:15"
                    className="w-full bg-white text-slate-900 border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  />
                  <datalist id="time-slots-add">
                    {FLEXIBLE_TIME_SLOTS.map(ts => (
                      <option key={ts} value={ts} />
                    ))}
                  </datalist>
                </div>

                {/* Flexible Schedule per day */}
                {formData.preferredDays.length > 0 && (
                  <div className="pt-3 border-t border-indigo-200/70 mt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-extrabold text-indigo-950 uppercase tracking-wide flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        Lịch tập linh hoạt (Chọn giờ riêng cho từng thứ):
                      </label>
                      <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-100/70 px-2 py-0.5 rounded-md">
                        Mặc định: {formData.preferredTime}
                      </span>
                    </div>

                    <div className="space-y-2 bg-white p-2.5 rounded-xl border border-indigo-150 shadow-2xs">
                      {[
                        { label: 'Thứ 2', val: 1 },
                        { label: 'Thứ 3', val: 2 },
                        { label: 'Thứ 4', val: 3 },
                        { label: 'Thứ 5', val: 4 },
                        { label: 'Thứ 6', val: 5 },
                        { label: 'Thứ 7', val: 6 },
                        { label: 'Chủ Nhật', val: 0 },
                      ]
                        .filter(d => formData.preferredDays.includes(d.val))
                        .map(d => {
                          const rawVal = formData.dayTimes ? formData.dayTimes[d.val] : undefined;
                          const currentTime = rawVal !== undefined ? rawVal : formData.preferredTime;
                          const isCustom = rawVal !== undefined ? !FLEXIBLE_TIME_SLOTS.includes(rawVal) : !FLEXIBLE_TIME_SLOTS.includes(currentTime);
                          return (
                            <div key={d.val} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2 bg-slate-50/80 rounded-xl border border-slate-200">
                              <span className="text-xs font-black text-indigo-950 shrink-0 flex items-center gap-1">
                                📅 {d.label}:
                              </span>
                              <div className="flex items-center gap-1.5 w-full sm:w-auto flex-1">
                                <select
                                  value={isCustom ? 'CUSTOM' : currentTime}
                                  onChange={(e) => {
                                    const selected = e.target.value;
                                    if (selected === 'CUSTOM') {
                                      setFormData({
                                        ...formData,
                                        dayTimes: {
                                          ...(formData.dayTimes || {}),
                                          [d.val]: ''
                                        }
                                      });
                                    } else {
                                      setFormData({
                                        ...formData,
                                        dayTimes: {
                                          ...(formData.dayTimes || {}),
                                          [d.val]: selected
                                        }
                                      });
                                    }
                                  }}
                                  className="bg-white text-slate-900 border border-slate-300 rounded-lg py-1.5 px-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs flex-1"
                                >
                                  {FLEXIBLE_TIME_SLOTS.map(ts => (
                                    <option key={ts} value={ts}>{ts}</option>
                                  ))}
                                  <option value="CUSTOM">Khác (Tự nhập văn bản)</option>
                                </select>

                                {isCustom && (
                                  <input
                                    type="text"
                                    value={currentTime}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setFormData({
                                        ...formData,
                                        dayTimes: {
                                          ...(formData.dayTimes || {}),
                                          [d.val]: val
                                        }
                                      });
                                    }}
                                    placeholder="Nhập giờ: VD 05:30"
                                    className="w-36 bg-white text-slate-900 border border-indigo-400 rounded-lg py-1.5 px-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                                    title="Gõ trực tiếp giờ linh hoạt"
                                    autoFocus
                                  />
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Mục tiêu tập luyện</label>
                <input
                  type="text"
                  value={formData.goals}
                  onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                  placeholder="Giảm 5kg, độ mông đùi..."
                  className="w-full bg-slate-100 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Ghi chú sức khỏe (nếu có)</label>
                <input
                  type="text"
                  value={formData.healthNotes}
                  onChange={(e) => setFormData({ ...formData, healthNotes: e.target.value })}
                  placeholder="Đau lưng nhẹ, huyết áp..."
                  className="w-full bg-slate-100 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenPrintContract()}
                  className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-full text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-2xs hover:scale-105 active:scale-95 cursor-pointer"
                  title="In bản xem trước hợp đồng dịch vụ PT dựa trên thông tin đã nhập"
                >
                  <Printer className="w-4 h-4 text-indigo-600" />
                  In hợp đồng online
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-full text-sm font-bold hover:bg-slate-200 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#FF4E00] hover:bg-orange-600 text-white font-extrabold rounded-full text-sm shadow-md transition-all active:scale-95"
                  >
                    Lưu học viên
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CLIENT MODAL */}
      {isEditModalOpen && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 text-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <h3 className="font-extrabold text-lg text-slate-900">Chỉnh Sửa Hồ Sơ: {selectedClient.name}</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200/60 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateClient} className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Họ và Tên</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-100 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Giới tính *</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 h-[42px] items-center">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, gender: 'Nam' })}
                      className={`h-full rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        formData.gender === 'Nam'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      👨 Nam
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, gender: 'Nữ' })}
                      className={`h-full rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        formData.gender === 'Nữ'
                          ? 'bg-rose-500 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      👩 Nữ
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Hình thức tập *</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 h-[42px] items-center">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, trainingType: '1/1' })}
                      className={`h-full rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        formData.trainingType === '1/1' || !formData.trainingType
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <User className="w-3.5 h-3.5" /> 1/1 (Cá Nhân)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, trainingType: 'ca_nhom' })}
                      className={`h-full rounded-lg text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        formData.trainingType === 'ca_nhom'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" /> Ca Nhóm
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-100 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white"
                  />
                </div>

                {/* Contract Type Selection */}
                <div className="sm:col-span-2 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-3 space-y-2">
                  <label className="block text-xs font-black text-indigo-950 uppercase tracking-wide">
                    🏷️ Loại Hình Đăng Ký Học Viên
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          clientType: 'session',
                          packageName: formData.packageName.includes('Khách Tháng') ? 'Gói 12 buổi' : formData.packageName
                        });
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-center ${
                        formData.clientType !== 'monthly'
                          ? 'bg-white border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs text-indigo-950 font-extrabold'
                          : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white font-medium'
                      }`}
                    >
                      <span className="text-xs font-black text-indigo-700">🏋️ Gói Tập Theo Buổi (PT 1:1)</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">Trừ buổi theo lần điểm danh.</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          clientType: 'monthly',
                          packageName: formData.packageName || 'Khách Tháng (1 Tháng)',
                          totalSessions: 0,
                          remainingSessions: 0
                        });
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-center ${
                        formData.clientType === 'monthly'
                          ? 'bg-amber-500 border-amber-600 text-white shadow-md ring-2 ring-amber-400/30 font-extrabold'
                          : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white font-medium'
                      }`}
                    >
                      <span className="text-xs font-black text-amber-950">📅 Khách Tháng (Không Tính Buổi)</span>
                      <span className={`text-[10px] mt-0.5 ${formData.clientType === 'monthly' ? 'text-amber-100' : 'text-slate-500'}`}>
                        Tập tự do theo ngày bắt đầu & kết thúc.
                      </span>
                    </button>
                  </div>
                </div>

                {formData.clientType !== 'monthly' ? (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-600">Số buổi còn lại</label>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={formData.remainingSessions}
                        onChange={(e) => {
                          const rem = parseInt(e.target.value) || 0;
                          setFormData({ 
                            ...formData, 
                            remainingSessions: rem
                          });
                        }}
                        className="w-full bg-slate-100 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white font-extrabold text-[#4F46E5]"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-600">Tổng số buổi gói tập</label>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, totalSessions: formData.remainingSessions })}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                        >
                          Đặt = {formData.remainingSessions} buổi
                        </button>
                      </div>
                      <input
                        type="number"
                        min="1"
                        value={formData.totalSessions}
                        onChange={(e) => setFormData({ ...formData, totalSessions: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-100 text-slate-900 border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white font-extrabold"
                      />
                    </div>
                  </>
                ) : (
                  <div className="sm:col-span-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-900">
                    📅 Thẻ Khách Tháng: Không tính số buổi. Trạng thái hoạt động dựa hoàn toàn vào Ngày Bắt Đầu & Hạn Hợp Đồng bên dưới.
                  </div>
                )}

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Tên Gói Tập (Tùy chỉnh điền tay)</label>
                  <input
                    type="text"
                    value={formData.packageName}
                    onChange={(e) => setFormData({ ...formData, packageName: e.target.value })}
                    placeholder="VD: Gói 12 buổi, Gói 20 buổi, Gói PT 24 buổi..."
                    className="w-full bg-slate-100 text-slate-900 border border-slate-200 rounded-xl p-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Ngày bắt đầu HĐ</label>
                  <input
                    type="date"
                    value={formData.startDate || ''}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full bg-slate-100 text-slate-900 border border-slate-200 rounded-xl p-2.5 text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Hạn hợp đồng (Hết hạn)</label>
                  <input
                    type="date"
                    value={formData.endDate || ''}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full bg-slate-100 text-slate-900 border border-slate-200 rounded-xl p-2.5 text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white"
                  />
                </div>

                {/* Bảng ghi số ngày (hạn sử dụng) cho nhanh */}
                <div className="sm:col-span-2">
                  <QuickDaysBox
                    startDate={formData.startDate || getTodayDateStr()}
                    endDate={formData.endDate || ''}
                    onUpdateEndDate={(newEnd) => setFormData(prev => ({ ...prev, endDate: newEnd }))}
                    label="Bảng tính & chọn nhanh số ngày hạn sử dụng"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Trạng thái Hợp Đồng / Hồ Sơ</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-slate-100 text-slate-900 border border-slate-200 rounded-xl p-2.5 text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white"
                  >
                    <option value="active">🟢 Đang tập (Đang hoạt động)</option>
                    <option value="expiring">🟡 Sắp hết hạn HĐ / Còn ít buổi</option>
                    <option value="paused">⏸️ Tạm ngưng / Bảo lưu hợp đồng</option>
                    <option value="expired">⛔ Hủy hợp đồng / Đã chấm dứt</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Mục tiêu</label>
                <input
                  type="text"
                  value={formData.goals}
                  onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                  className="w-full bg-slate-100 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white"
                />
              </div>

              {/* Schedule / PT Appointment Auto-Update Section */}
              <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-indigo-950 uppercase tracking-wide flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#4F46E5]" />
                    Lịch tập cố định (cập nhật lịch hẹn PT)
                  </label>
                  <span className="text-[11px] font-bold text-indigo-600 bg-white px-2 py-0.5 rounded-md border border-indigo-200">
                    {formData.preferredDays.length} buổi/tuần
                  </span>
                </div>

                {/* Day selector */}
                <div>
                  <span className="block text-[11px] font-bold text-slate-600 mb-1">Thứ tập trong tuần:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { label: 'T2', val: 1 },
                      { label: 'T3', val: 2 },
                      { label: 'T4', val: 3 },
                      { label: 'T5', val: 4 },
                      { label: 'T6', val: 5 },
                      { label: 'T7', val: 6 },
                      { label: 'CN', val: 0 },
                    ].map(d => {
                      const isChecked = formData.preferredDays.includes(d.val);
                      return (
                        <button
                          key={d.val}
                          type="button"
                          onClick={() => {
                            const newDays = isChecked
                              ? formData.preferredDays.filter(day => day !== d.val)
                              : [...formData.preferredDays, d.val];
                            setFormData({ ...formData, preferredDays: newDays });
                          }}
                          className={`text-xs font-extrabold px-3 py-1.5 rounded-xl border transition-all ${
                            isChecked
                              ? 'bg-[#4F46E5] text-white border-[#4F46E5] shadow-xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Preferred time slot */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Khung giờ tập cố định (có thể tự nhập bằng số):</label>
                  <input
                    type="text"
                    list="time-slots-edit"
                    value={formData.preferredTime}
                    onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                    placeholder="VD: 05:15 - 06:15"
                    className="w-full bg-white text-slate-900 border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                  />
                  <datalist id="time-slots-edit">
                    {FLEXIBLE_TIME_SLOTS.map(ts => (
                      <option key={ts} value={ts} />
                    ))}
                  </datalist>
                </div>

                {/* Flexible Schedule per day */}
                {formData.preferredDays.length > 0 && (
                  <div className="pt-3 border-t border-indigo-200/70 mt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-extrabold text-indigo-950 uppercase tracking-wide flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        Lịch tập linh hoạt (Chọn giờ riêng cho từng thứ):
                      </label>
                      <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-100/70 px-2 py-0.5 rounded-md">
                        Mặc định: {formData.preferredTime}
                      </span>
                    </div>

                    <div className="space-y-2 bg-white p-2.5 rounded-xl border border-indigo-150 shadow-2xs">
                      {[
                        { label: 'Thứ 2', val: 1 },
                        { label: 'Thứ 3', val: 2 },
                        { label: 'Thứ 4', val: 3 },
                        { label: 'Thứ 5', val: 4 },
                        { label: 'Thứ 6', val: 5 },
                        { label: 'Thứ 7', val: 6 },
                        { label: 'Chủ Nhật', val: 0 },
                      ]
                        .filter(d => formData.preferredDays.includes(d.val))
                        .map(d => {
                          const rawVal = formData.dayTimes ? formData.dayTimes[d.val] : undefined;
                          const currentTime = rawVal !== undefined ? rawVal : formData.preferredTime;
                          const isCustom = rawVal !== undefined ? !FLEXIBLE_TIME_SLOTS.includes(rawVal) : !FLEXIBLE_TIME_SLOTS.includes(currentTime);
                          return (
                            <div key={d.val} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2 bg-slate-50/80 rounded-xl border border-slate-200">
                              <span className="text-xs font-black text-indigo-950 shrink-0 flex items-center gap-1">
                                📅 {d.label}:
                              </span>
                              <div className="flex items-center gap-1.5 w-full sm:w-auto flex-1">
                                <select
                                  value={isCustom ? 'CUSTOM' : currentTime}
                                  onChange={(e) => {
                                    const selected = e.target.value;
                                    if (selected === 'CUSTOM') {
                                      setFormData({
                                        ...formData,
                                        dayTimes: {
                                          ...(formData.dayTimes || {}),
                                          [d.val]: ''
                                        }
                                      });
                                    } else {
                                      setFormData({
                                        ...formData,
                                        dayTimes: {
                                          ...(formData.dayTimes || {}),
                                          [d.val]: selected
                                        }
                                      });
                                    }
                                  }}
                                  className="bg-white text-slate-900 border border-slate-300 rounded-lg py-1.5 px-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs flex-1"
                                >
                                  {FLEXIBLE_TIME_SLOTS.map(ts => (
                                    <option key={ts} value={ts}>{ts}</option>
                                  ))}
                                  <option value="CUSTOM">Khác (Tự nhập văn bản)</option>
                                </select>

                                {isCustom && (
                                  <input
                                    type="text"
                                    value={currentTime}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setFormData({
                                        ...formData,
                                        dayTimes: {
                                          ...(formData.dayTimes || {}),
                                          [d.val]: val
                                        }
                                      });
                                    }}
                                    placeholder="Nhập giờ: VD 05:30"
                                    className="w-36 bg-white text-slate-900 border border-indigo-400 rounded-lg py-1.5 px-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                                    title="Gõ trực tiếp giờ linh hoạt"
                                    autoFocus
                                  />
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>

              {/* Payment History Table */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-600 mb-2">Lịch sử đóng tiền & Doanh thu</label>
                <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 text-[10px] uppercase font-bold tracking-wider">
                        <th className="p-2 border-b border-slate-200 pl-3">Ngày đóng</th>
                        <th className="p-2 border-b border-slate-200">Gói tập</th>
                        <th className="p-2 border-b border-slate-200 pr-3 text-right">Số tiền</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      {payments.filter(p => p.clientId === selectedClient.id).length === 0 ? (
                        <tr>
                          <td colSpan={3} className="p-3 text-center text-slate-500 italic">Chưa có dữ liệu đóng tiền</td>
                        </tr>
                      ) : (
                        payments.filter(p => p.clientId === selectedClient.id).sort((a,b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()).map(p => (
                          <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                            <td className="p-2 pl-3 text-slate-700 whitespace-nowrap">{parseDateLocal(p.paymentDate).toLocaleDateString('vi-VN')}</td>
                            <td className="p-2 text-slate-700 max-w-[120px] truncate" title={p.packageName}>{p.packageName}</td>
                            <td className="p-2 pr-3 text-right align-top">
                              {editingPaymentId === p.id ? (
                                <div className="flex flex-col items-end gap-1.5 p-2 bg-white border border-indigo-200 rounded-lg shadow-sm w-full min-w-[200px] float-right relative z-10">
                                  <input 
                                    type="number"
                                    value={editPaymentAmount}
                                    onChange={(e) => setEditPaymentAmount(Number(e.target.value))}
                                    className="w-full text-xs p-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none font-bold"
                                    placeholder="Số tiền mới..."
                                  />
                                  <div className="w-full flex items-center gap-2">
                                    <span className="text-[10px] text-slate-500 whitespace-nowrap w-16">Số buổi:</span>
                                    <input
                                      type="number"
                                      value={editPaymentSessions}
                                      onChange={(e) => setEditPaymentSessions(Number(e.target.value))}
                                      className="w-full text-xs p-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none font-bold"
                                      placeholder="Số buổi mới..."
                                    />
                                  </div>
                                  <div className="w-full flex items-center gap-2">
                                    <span className="text-[10px] text-slate-500 whitespace-nowrap w-16">Hạn HĐ:</span>
                                    <input
                                      type="date"
                                      value={editPaymentEndDate}
                                      onChange={(e) => setEditPaymentEndDate(e.target.value)}
                                      className="w-full text-xs p-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none font-bold"
                                      title="Ngày hết hạn mới"
                                    />
                                  </div>
                                  <input
                                    type="password"
                                    value={editPaymentPassword}
                                    onChange={(e) => setEditPaymentPassword(e.target.value)}
                                    className="w-full text-xs p-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                                    placeholder="Mật khẩu chủ TK..."
                                  />
                                  {editPaymentError && <span className="text-[10px] text-red-500 text-right w-full">{editPaymentError}</span>}
                                  <div className="flex gap-1 justify-end w-full mt-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingPaymentId(null);
                                        setEditPaymentPassword('');
                                        setEditPaymentError('');
                                      }}
                                      className="px-2.5 py-1.5 bg-slate-200 text-slate-700 rounded text-[10px] font-bold hover:bg-slate-300 transition-colors"
                                    >Hủy bỏ</button>
                                    <button
                                      type="button"
                                      onClick={() => handleSavePaymentEdit(p.id)}
                                      className="px-2.5 py-1.5 bg-indigo-600 text-white rounded text-[10px] font-bold hover:bg-indigo-700 transition-colors"
                                    >Lưu & Cập nhật</button>
                                  </div>
                                </div>
                              ) : cancelingPaymentId === p.id ? (
                                <div className="flex flex-col items-end gap-1.5 p-2 bg-white border border-red-200 rounded-lg shadow-sm w-full min-w-[200px] float-right relative z-10">
                                  <span className="text-[10px] font-bold text-red-600">Xác nhận hủy giao dịch?</span>
                                  <input
                                    type="password"
                                    value={cancelPaymentPassword}
                                    onChange={(e) => setCancelPaymentPassword(e.target.value)}
                                    className="w-full text-xs p-1.5 border border-red-300 rounded focus:ring-1 focus:ring-red-500 outline-none"
                                    placeholder="Mật khẩu chủ TK..."
                                  />
                                  {editPaymentError && <span className="text-[10px] text-red-500 text-right w-full">{editPaymentError}</span>}
                                  <div className="flex gap-1 justify-end w-full mt-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCancelingPaymentId(null);
                                        setCancelPaymentPassword('');
                                        setEditPaymentError('');
                                      }}
                                      className="px-2.5 py-1.5 bg-slate-200 text-slate-700 rounded text-[10px] font-bold hover:bg-slate-300 transition-colors"
                                    >Quay lại</button>
                                    <button
                                      type="button"
                                      onClick={() => handleCancelPayment(p.id)}
                                      className="px-2.5 py-1.5 bg-red-600 text-white rounded text-[10px] font-bold hover:bg-red-700 transition-colors"
                                    >Xác nhận hủy</button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col items-end">
                                  <div className="flex items-center justify-end gap-2">
                                    <span className="font-bold text-emerald-600">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.amountVnd)}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingPaymentId(p.id);
                                        setEditPaymentAmount(p.amountVnd);
                                        setEditPaymentSessions(p.sessionsCount);
                                        setEditPaymentEndDate(p.newEndDate || selectedClient.endDate || '');
                                        setCancelingPaymentId(null);
                                        setEditPaymentPassword('');
                                        setEditPaymentError('');
                                      }}
                                      className="text-slate-400 hover:text-indigo-600 p-1 rounded hover:bg-indigo-50"
                                      title="Sửa giao dịch (Cần mật khẩu)"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCancelingPaymentId(p.id);
                                        setEditingPaymentId(null);
                                        setCancelPaymentPassword('');
                                        setEditPaymentError('');
                                      }}
                                      className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50"
                                      title="Hủy giao dịch (Cần mật khẩu)"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  {p.isEdited && (
                                    <span className="text-[9px] text-amber-500 font-medium italic mt-0.5">
                                      * đã chỉnh sửa
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Ghi chú riêng của PT</label>
                <textarea
                  rows={3}
                  value={formData.ptNotes}
                  onChange={(e) => setFormData({ ...formData, ptNotes: e.target.value })}
                  className="w-full bg-slate-100 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white"
                />
              </div>

              {selectedClient.editHistory && selectedClient.editHistory.length > 0 && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    Lịch sử chi tiết thay đổi, gia hạn & bảo lưu ({selectedClient.editHistory.length})
                  </label>
                  <div className="space-y-2 max-h-44 overflow-y-auto">
                    {selectedClient.editHistory.map(item => renderHistoryEntry(item))}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedClient.status === 'closed' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditModalOpen(false);
                        handleReopenContract(selectedClient);
                      }}
                      className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-800 border border-emerald-300 rounded-full text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Mở lại hợp đồng học viên này"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Mở Lại HĐ
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditModalOpen(false);
                        setClientToClose(selectedClient);
                      }}
                      className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="Đóng hợp đồng (ẩn khỏi danh sách chính nhưng bảo lưu 100% doanh thu)"
                    >
                      <Archive className="w-3.5 h-3.5 text-amber-700" />
                      Đóng HĐ
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (selectedClient) {
                        setClientToDelete(selectedClient);
                      }
                    }}
                    className="px-3.5 py-2 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 border border-red-200 rounded-full text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Xóa
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-full text-sm font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#FF4E00] hover:bg-orange-600 text-white font-extrabold rounded-full text-sm shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    Cập nhật
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD METRIC MODAL */}
      {isMetricModalOpen && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 text-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">Đo Chỉ Số Cơ Thể: {selectedClient.name}</h3>
              <button onClick={() => setIsMetricModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200/60 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMetric} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Ngày đo</label>
                <input
                  type="date"
                  value={metricData.date}
                  onChange={(e) => setMetricData({ ...metricData, date: e.target.value })}
                  className="w-full bg-slate-100 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Cân nặng (kg) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={metricData.weightKg}
                    onChange={(e) => setMetricData({ ...metricData, weightKg: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-100 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-sm font-black text-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">% Mỡ (Body Fat)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={metricData.bodyFatPercent}
                    onChange={(e) => setMetricData({ ...metricData, bodyFatPercent: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-100 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Vòng eo (cm)</label>
                  <input
                    type="number"
                    value={metricData.waistCm}
                    onChange={(e) => setMetricData({ ...metricData, waistCm: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-100 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Vòng mông (cm)</label>
                  <input
                    type="number"
                    value={metricData.hipsCm}
                    onChange={(e) => setMetricData({ ...metricData, hipsCm: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-100 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Ghi chú đợt đo</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Giữa khóa 12 buổi..."
                  value={metricData.notes}
                  onChange={(e) => setMetricData({ ...metricData, notes: e.target.value })}
                  className="w-full bg-slate-100 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMetricModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-full text-xs font-bold hover:bg-slate-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#FF4E00] hover:bg-orange-600 text-white font-extrabold rounded-full text-xs shadow-md transition-all active:scale-95"
                >
                  Lưu Chỉ Số
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RENEW PACKAGE MODAL */}
      {isRenewModalOpen && renewClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 text-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-[#FF4E00]" />
                  Gia hạn gói tập: {renewClient.name}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Thêm số buổi, ghi nhận doanh thu & điều chỉnh thời hạn hợp đồng</p>
              </div>
              <button 
                onClick={() => setIsRenewModalOpen(false)} 
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Info Notice Banner */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 font-medium">
              <span className="text-base leading-none">💡</span>
              <div>
                <p className="font-bold">Doanh thu & lợi nhuận tự động cập nhật</p>
                <p className="text-amber-700 text-[11px] mt-0.5">
                  Số tiền thanh toán sẽ tự động cộng vào Doanh thu & Lợi nhuận phòng gym thuộc <span className="font-extrabold underline">Tháng được chọn</span> bên dưới.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveRenewPackage} className="space-y-4">
              
              {/* Package Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên Gói Tập Mới *</label>
                <input
                  type="text"
                  required
                  value={renewFormData.packageName}
                  onChange={(e) => setRenewFormData({ ...renewFormData, packageName: e.target.value })}
                  placeholder="e.g. Gói PT 24 buổi - Tăng Cường"
                  className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-xl p-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white"
                />
              </div>

              {/* Number of sessions & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Thêm Số Buổi (+Buổi) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={renewFormData.additionalSessions}
                    onChange={(e) => setRenewFormData({ ...renewFormData, additionalSessions: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 text-emerald-700 border border-slate-200 rounded-xl p-2.5 text-sm font-black focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white"
                  />
                  <p className="text-[10px] text-slate-500 font-medium mt-1">
                    Số buổi mới sau gia hạn: <span className="font-extrabold text-emerald-600">{(renewClient.remainingSessions || 0) + Number(renewFormData.additionalSessions)} / {Number(renewFormData.additionalSessions) || renewClient.totalSessions} buổi</span>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số Tiền Thanh Toán (VND) *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={renewFormData.amountVnd ? new Intl.NumberFormat('vi-VN').format(renewFormData.amountVnd) : ''}
                    onChange={(e) => {
                      const digitsOnly = e.target.value.replace(/\D/g, '');
                      setRenewFormData({
                        ...renewFormData,
                        amountVnd: digitsOnly ? parseInt(digitsOnly, 10) : 0
                      });
                    }}
                    placeholder="0"
                    className="w-full bg-slate-50 text-[#FF4E00] border border-slate-200 rounded-xl p-2.5 text-sm font-black focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white"
                  />
                  <p className="text-[10px] font-bold text-slate-600 mt-1">
                    {renewFormData.amountVnd > 0 ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(renewFormData.amountVnd) : '0 đ'}
                  </p>
                </div>
              </div>

              {/* Payment Date & Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tháng / ngày ghi nhận doanh thu *</label>
                  <input
                    type="date"
                    required
                    value={renewFormData.paymentDate}
                    onChange={(e) => setRenewFormData({ ...renewFormData, paymentDate: e.target.value })}
                    className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white"
                  />
                  <p className="text-[10px] text-indigo-600 font-bold mt-1">
                    📅 Cập nhật vào báo cáo Tháng {new Date(renewFormData.paymentDate || new Date()).getMonth() + 1}/{new Date(renewFormData.paymentDate || new Date()).getFullYear()}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hình Thức Thanh Toán</label>
                  <select
                    value={renewFormData.paymentMethod}
                    onChange={(e) => setRenewFormData({ ...renewFormData, paymentMethod: e.target.value as any })}
                    className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white"
                  >
                    <option value="Chuyển khoản">Chuyển khoản (NH)</option>
                    <option value="Tiền mặt">Tiền mặt</option>
                    <option value="Thẻ">Thẻ Quẹt POS</option>
                  </select>
                </div>
              </div>

              {/* New Expiry Date (Hạn HD) with QuickDaysBox */}
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-indigo-950">Thời Hạn Hợp Đồng Mới (Hạn HĐ) *</label>
                  <span className="text-[10px] font-bold text-indigo-600 bg-white px-2 py-0.5 rounded-md border border-indigo-200">Tùy chỉnh chọn</span>
                </div>

                <input
                  type="date"
                  required
                  value={renewFormData.newEndDate}
                  onChange={(e) => setRenewFormData({ ...renewFormData, newEndDate: e.target.value })}
                  className="w-full bg-white text-slate-900 border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                />

                <QuickDaysBox
                  startDate={renewFormData.paymentDate || getTodayDateStr()}
                  endDate={renewFormData.newEndDate}
                  onUpdateEndDate={(newEnd) => setRenewFormData(prev => ({ ...prev, newEndDate: newEnd }))}
                  label="Bảng tính & chọn nhanh số ngày gia hạn sử dụng"
                  bgStyle="bg-white/90 border-indigo-200"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ghi chú đợt gia hạn</label>
                <textarea
                  rows={2}
                  value={renewFormData.notes}
                  onChange={(e) => setRenewFormData({ ...renewFormData, notes: e.target.value })}
                  placeholder="Ghi chú thêm về đợt đóng tiền gia hạn này..."
                  className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRenewModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-full text-xs font-bold hover:bg-slate-200 transition-colors"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#FF4E00] hover:bg-orange-600 text-white font-extrabold rounded-full text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Xác nhận gia hạn & cập nhật doanh thu
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* CONTRACT CUSTOMIZATION MODAL (BÁNH RĂNG TÙY CHỈNH HỢP ĐỒNG) */}
      {isContractModalOpen && contractClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-black">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base tracking-wide flex items-center gap-2">
                    TÙY CHỈNH THỜI HẠN & HỢP ĐỒNG
                  </h3>
                  <p className="text-xs text-amber-100 font-medium">
                    Học viên: <span className="font-bold text-white underline">{contractClient.name}</span> • Gói: {contractClient.packageName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsContractModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveContract} className="p-6 space-y-5">
              
              {/* Quick Preset Extension Buttons */}
              <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-2xl space-y-2">
                <p className="text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-amber-600" />
                  Gia hạn nhanh thời hạn hết hạn HĐ:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleQuickAddDuration(1)}
                    className="px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-all shadow-2xs hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    +1 Tháng
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddDuration(3)}
                    className="px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-all shadow-2xs hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    +3 Tháng
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddDuration(6)}
                    className="px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-all shadow-2xs hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    +6 Tháng
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddDuration(12)}
                    className="px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-all shadow-2xs hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    +12 Tháng (1 Năm)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddDuration(0, 15)}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-xl text-xs font-bold transition-all shadow-2xs hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    🛡️ +15 Ngày (Bảo lưu)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickAddDuration(0, 30)}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-xl text-xs font-bold transition-all shadow-2xs hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    🛡️ +30 Ngày (Bảo lưu)
                  </button>
                </div>
              </div>

              {/* Package Name & Quick Select */}
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl space-y-2">
                <label className="block text-xs font-extrabold text-indigo-950 uppercase tracking-wide">
                  📦 Tên Gói Tập Hợp Đồng:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    value={contractFormData.packageName}
                    onChange={(e) => setContractFormData({ ...contractFormData, packageName: e.target.value })}
                    placeholder="e.g. Gói 16 buổi"
                    className="sm:col-span-2 px-3.5 py-2.5 bg-white border border-indigo-200 rounded-xl text-xs font-black text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                  />
                  <select
                    value={contractFormData.packageName}
                    onChange={(e) => {
                      if (!e.target.value) return;
                      const pkg = e.target.value;
                      let num = 16;
                      if (pkg.includes('12')) num = 12;
                      else if (pkg.includes('16')) num = 16;
                      else if (pkg.includes('24')) num = 24;
                      else if (pkg.includes('36')) num = 36;
                      else if (pkg.includes('72')) num = 72;
                      else if (pkg.includes('100')) num = 100;
                      setContractFormData({
                        ...contractFormData,
                        packageName: pkg,
                        totalSessions: num
                      });
                    }}
                    className="px-3.5 py-2.5 bg-white border border-indigo-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                  >
                    <option value="Gói 12 buổi">Gói 12 buổi (12b)</option>
                    <option value="Gói 16 buổi">Gói 16 buổi (16b)</option>
                    <option value="Gói 24 buổi">Gói 24 buổi (24b)</option>
                    <option value="Gói 36 buổi">Gói 36 buổi (36b)</option>
                    <option value="Gói 72 buổi">Gói 72 buổi (72b)</option>
                    <option value="Gói 100 buổi">Gói 100 buổi (100b)</option>
                  </select>
                </div>
              </div>

              {/* Date Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ngày bắt đầu HĐ:
                  </label>
                  <input
                    type="date"
                    required
                    value={contractFormData.startDate}
                    onChange={(e) => setContractFormData({ ...contractFormData, startDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-900 mb-1 flex items-center justify-between">
                    <span>Thời hạn hết hạn HĐ (*):</span>
                    <span className="text-[10px] text-amber-600 font-normal">(Chỉnh sửa trực tiếp)</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={contractFormData.endDate}
                    onChange={(e) => setContractFormData({ ...contractFormData, endDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-amber-50/50 border-2 border-amber-400 rounded-xl text-xs font-extrabold text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <QuickDaysBox
                    startDate={contractFormData.startDate || getTodayDateStr()}
                    endDate={contractFormData.endDate}
                    onUpdateEndDate={(newEnd) => setContractFormData(prev => ({ ...prev, endDate: newEnd }))}
                    label="Bảng tính & chọn nhanh số ngày hạn hợp đồng"
                    bgStyle="bg-amber-50/80 border-amber-200/80"
                  />
                </div>
              </div>

              {/* Sessions Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tổng số buổi hợp đồng:
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={contractFormData.totalSessions}
                    onChange={(e) => setContractFormData({ ...contractFormData, totalSessions: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số buổi còn lại hiện tại:
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={contractFormData.remainingSessions}
                    onChange={(e) => setContractFormData({ ...contractFormData, remainingSessions: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Contract Status Select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Trạng thái hợp đồng:
                </label>
                <select
                  value={contractFormData.status}
                  onChange={(e) => setContractFormData({ ...contractFormData, status: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="active">🟢 Hoạt động (Đang tập)</option>
                  <option value="expiring">🟡 Sắp hết hạn</option>
                  <option value="expired">🔴 Đã hết hạn</option>
                  <option value="paused">⏸️ Bảo lưu / Tạm ngưng</option>
                  <option value="closed">📁 Đóng hợp đồng (bảo lưu 100% doanh thu)</option>
                </select>
              </div>

              {/* Adjustment Note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ghi chú điều chỉnh HĐ (Tùy chọn):
                </label>
                <input
                  type="text"
                  value={contractFormData.notes}
                  onChange={(e) => setContractFormData({ ...contractFormData, notes: e.target.value })}
                  placeholder="Ví dụ: Bảo lưu 1 tháng do nghỉ Tết, gia hạn theo thỏa thuận..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => contractClient && handleOpenPrintContract(contractClient)}
                    className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-full text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Printer className="w-3.5 h-3.5 text-indigo-600" />
                    In HĐ
                  </button>

                  {contractClient && contractClient.status === 'closed' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsContractModalOpen(false);
                        handleReopenContract(contractClient);
                      }}
                      className="px-3 py-2 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-800 border border-emerald-300 rounded-full text-xs font-extrabold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Mở lại HĐ
                    </button>
                  ) : (
                    contractClient && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsContractModalOpen(false);
                          setClientToClose(contractClient);
                        }}
                        className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-xs font-extrabold transition-all flex items-center gap-1 cursor-pointer"
                        title="Đóng hợp đồng (ẩn khỏi danh sách nhưng bảo lưu 100% doanh thu)"
                      >
                        <Archive className="w-3.5 h-3.5 text-amber-700" /> Đóng HĐ
                      </button>
                    )
                  )}

                  {contractClient && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsContractModalOpen(false);
                        setClientToDelete(contractClient);
                      }}
                      className="px-3 py-2 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 border border-red-200 rounded-full text-xs font-extrabold transition-all flex items-center gap-1 cursor-pointer"
                      title="Xóa hội viên"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Xóa
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsContractModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-full text-xs transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-full text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    Lưu thay đổi hợp đồng
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {clientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Xác nhận xóa hội viên</h3>
                <p className="text-xs text-slate-500 font-medium">Lưu vào lịch sử thao tác (có thể khôi phục)</p>
              </div>
            </div>

            <div className="p-4 bg-red-50/80 border border-red-100 rounded-2xl space-y-2">
              <p className="text-sm font-bold text-slate-800">
                Bạn có chắc chắn muốn xóa hội viên <span className="text-red-600 font-black">"{clientToDelete.name}"</span>?
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                🔒 <strong>Yêu cầu xác thực:</strong> Để thực hiện xóa hội viên, vui lòng nhập mật khẩu xác nhận. Dữ liệu sau khi xóa có thể hoàn tác trong Lịch sử thao tác.
              </p>
            </div>

            {/* Password Verification Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-red-600" />
                Mật Khẩu Phê Duyệt Kích Hoạt Xóa
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => {
                  setDeletePassword(e.target.value);
                  setDeletePasswordError(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const validAdminPass = currentUser?.password;
                    const enteredPass = deletePassword.trim();
                    if (enteredPass !== validAdminPass && enteredPass !== localStorage.getItem('nb_gym_admin_password')) {
                      setDeletePasswordError(true);
                      return;
                    }
                    const targetName = clientToDelete.name;
                    const targetId = clientToDelete.id;
                    deleteClient(targetId);
                    if (selectedClient?.id === targetId) {
                      setSelectedClient(null);
                    }
                    setIsEditModalOpen(false);
                    setClientToDelete(null);
                    setDeletePassword('');
                    setDeletePasswordError(false);
                    setDeleteSuccessToast(`Đã xóa hội viên "${targetName}". Dữ liệu đã được lưu trong Lịch sử thao tác.`);
                    setTimeout(() => setDeleteSuccessToast(null), 6000);
                  }
                }}
                placeholder="Nhập mật khẩu xác nhận"
                className={`w-full bg-slate-50 text-slate-900 border ${
                  deletePasswordError ? 'border-red-500 ring-2 ring-red-200' : 'border-slate-200'
                } rounded-xl p-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all`}
                autoFocus
              />
              {deletePasswordError && (
                <p className="text-xs text-red-600 font-bold flex items-center gap-1 mt-1">
                  ⚠️ Mật khẩu không chính xác! Vui lòng kiểm tra lại.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setClientToDelete(null);
                  setDeletePassword('');
                  setDeletePasswordError(false);
                }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-bold transition-colors"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  const validAdminPass = currentUser?.password;
                  const enteredPass = deletePassword.trim();
                  if (enteredPass !== validAdminPass && enteredPass !== localStorage.getItem('nb_gym_admin_password')) {
                    setDeletePasswordError(true);
                    return;
                  }
                  const targetName = clientToDelete.name;
                  const targetId = clientToDelete.id;
                  deleteClient(targetId);
                  if (selectedClient?.id === targetId) {
                    setSelectedClient(null);
                  }
                  setIsEditModalOpen(false);
                  setClientToDelete(null);
                  setDeletePassword('');
                  setDeletePasswordError(false);
                  setDeleteSuccessToast(`Đã xóa hội viên "${targetName}". Dữ liệu đã được lưu trong Lịch sử thao tác.`);
                  setTimeout(() => setDeleteSuccessToast(null), 6000);
                }}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-extrabold shadow-md shadow-red-200 transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION FOR DELETE */}
      {deleteSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold border border-slate-700">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span>{deleteSuccessToast}</span>
          {onGoToAudit && (
            <button
              onClick={() => {
                setDeleteSuccessToast(null);
                onGoToAudit();
              }}
              className="ml-2 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-full text-[11px] font-black transition-colors"
            >
              Xem & Khôi Phục
            </button>
          )}
        </div>
      )}

      {/* Sửa Tên Buổi Tập Check-in Modal */}
      {editCheckInTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white border border-slate-200 text-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-600" /> Sửa tên buổi tập
              </h3>
              <button onClick={() => setEditCheckInTarget(null)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200/60 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Tên buổi tập / Giáo trình</label>
                <input
                  type="text"
                  value={editCheckInPlanName}
                  onChange={(e) => setEditCheckInPlanName(e.target.value)}
                  placeholder="Nhập tên bài tập..."
                  className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-semibold"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">Gợi ý nhanh (chọn để điền):</label>
                <div className="flex flex-wrap gap-2">
                  {['Upper Body', 'Lower Body', 'Push', 'Pull', 'Legs', 'Cardio / Abs', 'Full Body'].map(suggestion => (
                    <button
                      key={suggestion}
                      onClick={() => setEditCheckInPlanName(suggestion)}
                      className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 text-slate-600 hover:bg-indigo-100 hover:text-indigo-700 rounded-lg border border-slate-200 hover:border-indigo-200 transition-colors cursor-pointer"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditCheckInTarget(null)}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Update context directly
                    if (editCheckInTarget && editCheckInPlanName.trim()) {
                      // Note: We're adding updateCheckIn to context destructured variables below
                      updateCheckIn(editCheckInTarget.id, { dayPlanName: editCheckInPlanName.trim() });
                      setEditCheckInTarget(null);
                    }
                  }}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Confirmation Modal for Cancel Check-in */}
      <ConfirmPasswordModal
        isOpen={!!cancelCheckInTarget}
        title="Xác Nhận Mật Khẩu Hủy Check-in"
        description={cancelCheckInTarget ? `Bạn đang yêu cầu HỦY lượt check-in của ${cancelCheckInTarget.clientName || 'học viên'}. Thao tác này sẽ cộng lại +1 buổi tập cho học viên.` : ''}
        confirmLabel="Xác Nhận Hủy Check-in"
        onClose={() => setCancelCheckInTarget(null)}
        onConfirm={() => {
          if (cancelCheckInTarget) {
            cancelCheckIn(cancelCheckInTarget.id);
            setCancelCheckInTarget(null);
          }
        }}
      />

      {/* PRINT CONTRACT MODAL */}
      {isPrintModalOpen && printContractData && (
        <PrintContractModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          data={printContractData}
        />
      )}

      {/* PAST CHECK-IN RECEIPT IMAGE MODAL */}
      <CheckInReceiptModal
        isOpen={isPastReceiptModalOpen}
        onClose={() => setIsPastReceiptModalOpen(false)}
        data={pastReceiptModalData}
      />

      {/* CONFIRM CLOSE CONTRACT WARNING MODAL */}
      {clientToClose && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4 mx-auto border border-amber-300">
              <Archive className="w-6 h-6 text-amber-700" />
            </div>

            <h3 className="text-xl font-extrabold text-slate-900 text-center mb-2">
              🔒 Xác Nhận Đóng Hợp Đồng?
            </h3>

            <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 text-xs text-slate-700 space-y-2.5 mb-5">
              <p className="font-bold text-amber-950 text-sm">
                Hội viên: <span className="underline">{clientToClose.name}</span> ({clientToClose.phone})
              </p>
              <p className="text-slate-700">
                ⚠️ Đóng hợp đồng sẽ ẩn học viên này khỏi danh sách tập luyện chính và chuyển sang mục <strong className="text-amber-900">"📁 Hợp đồng đã đóng"</strong>.
              </p>
              <div className="bg-white/90 p-3 rounded-xl border border-amber-200 font-medium space-y-1.5 shadow-2xs">
                <p className="font-extrabold text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Bảo lưu doanh thu &amp; lịch sử 100%:
                </p>
                <p className="text-[11px] text-slate-600 pl-4 leading-relaxed">
                  • Tất cả khoản thu, hóa đơn đóng tiền và lịch sử điểm danh của học viên này <strong>vẫn được giữ nguyên 100%</strong> trong báo cáo doanh số và lợi nhuận.
                </p>
                <p className="text-[11px] text-slate-600 pl-4 leading-relaxed">
                  • Bạn có thể xem lại thông tin hoặc <strong>Mở lại hợp đồng</strong> bất kỳ lúc nào tại tab <em>"Hợp đồng đã đóng"</em>.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setClientToClose(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  const nowStr = getVNDate().toLocaleString('vi-VN', { hour12: false });
                  const newHistory: EditHistoryEntry = {
                    id: Date.now().toString(),
                    timestamp: nowStr,
                    summary: `🔒 Đóng hợp đồng học viên. Toàn bộ doanh số & lịch sử được bảo lưu.`,
                    actionType: 'status'
                  };
                  const updated: Client = {
                    ...clientToClose,
                    status: 'closed',
                    editHistory: [newHistory, ...(clientToClose.editHistory || [])]
                  };
                  updateClient(clientToClose.id, updated);
                  if (selectedClient?.id === clientToClose.id) {
                    setSelectedClient(updated);
                  }
                  setClientToClose(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-md shadow-amber-200 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Archive className="w-4 h-4" />
                Xác Nhận Đóng HĐ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RENEWAL RECEIPT MODAL */}
      <RenewalReceiptModal 
        isOpen={!!renewalReceiptData}
        onClose={() => setRenewalReceiptData(null)}
        receiptData={renewalReceiptData}
      />

      {/* EDIT PAYMENT AMOUNT MODAL */}
      <EditPaymentAmountModal
        isOpen={!!editingPaymentAmount}
        payment={editingPaymentAmount}
        onClose={() => setEditingPaymentAmount(null)}
      />

    </div>
  );
};
