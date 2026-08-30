import { getTodayDateStr, formatDate } from '../utils/dateUtils';
import React, { useState, useEffect } from 'react';
import { useTenant } from '../context/TenantContext';
import { 
  UserMinus,
  Building2, 
  UserPlus, 
  Key, 
  Calendar, 
  Phone, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Eye, 
  RefreshCw, 
  Trash2, 
  Lock, 
  Unlock, 
  Search, 
  Sparkles,
  ShieldCheck,
  DollarSign,
  Users,
  Clock,
  ArrowRight,
  ExternalLink,
  Edit2,
  ArrowUpDown,
  Filter,
  X
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { TenantAccount } from '../types';

const calculateDaysDifference = (startStr: string, endStr: string): number | null => {
  if (!startStr || !endStr) return null;
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 ? diffDays : null;
};


// const isTenantOnline removed



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

interface TenantQuickDurationBoxProps {
  startDate: string;
  endDate: string;
  onUpdateEndDate: (newEndDate: string) => void;
}

const TenantQuickDurationBox: React.FC<TenantQuickDurationBoxProps> = ({
  startDate,
  endDate,
  onUpdateEndDate,
}) => {
  const baseDate = startDate || getTodayDateStr();
  const currentDays = calculateDaysDifference(baseDate, endDate);
  const [customDays, setCustomDays] = useState<string>(currentDays !== null ? String(currentDays) : '');

  useEffect(() => {
    if (currentDays !== null) {
      setCustomDays(String(currentDays));
    } else {
      setCustomDays('');
    }
  }, [baseDate, endDate]);

  const handleApplyDays = (days: number) => {
    const newEnd = addDaysToDate(baseDate, days);
    onUpdateEndDate(newEnd);
  };

  const handleApplyMonths = (months: number) => {
    const newEnd = addMonthsToDate(baseDate, months);
    onUpdateEndDate(newEnd);
  };

  const handleCustomDaysChange = (val: string) => {
    setCustomDays(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > 0) {
      const newEnd = addDaysToDate(baseDate, num);
      onUpdateEndDate(newEnd);
    }
  };

  const presets: Array<{ type: 'days' | 'months'; val: number; label: string }> = [
    { type: 'days', val: 14, label: '14 ngày (Trải nghiệm)' },
    { type: 'months', val: 1, label: '1 tháng' },
    { type: 'months', val: 2, label: '2 tháng' },
    { type: 'months', val: 3, label: '3 tháng' },
    { type: 'months', val: 6, label: '6 tháng' }
  ];

  return (
    <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-2xl space-y-2.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
        <label className="text-xs font-black text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
          Bảng chọn & nhập nhanh hạn dùng tài khoản
        </label>
        {currentDays !== null && (
          <span className="text-[11px] font-extrabold text-amber-900 bg-white/90 border border-amber-300 px-2.5 py-0.5 rounded-full shadow-2xs">
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

export const AdminTenantsView: React.FC = () => {
  const { 
    tenants, 
    createTenant, 
    updateTenant, 
    extendTenant, 
    deleteTenant, 
    activeTenantId, 
    setActiveTenantId,
    currentUser
  } = useTenant();

  const [searchTerm, setSearchTerm] = useState('');
  // Trạng thái online bị bỏ
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expiring' | 'expired' | 'suspended'>('all');
  const [sortBy, setSortBy] = useState<'expire_asc' | 'expire_desc' | 'gym_asc' | 'gym_desc' | 'newest' | 'oldest'>('expire_asc');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<TenantAccount | null>(null);

  // Form State for creating/editing
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [gymName, setGymName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [expireMonths, setExpireMonths] = useState<number>(1);
  const [customExpireDate, setCustomExpireDate] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute stats and counts
  const nonAdminTenants = tenants.filter(t => t.username !== 'admin');
  const totalTenants = nonAdminTenants.length;
  
  const todayStr = getTodayDateStr();

  const getDaysLeft = (expireDateStr: string) => {
    if (!expireDateStr) return 0;
    const expireTime = new Date(expireDateStr).getTime();
    const nowTime = new Date().getTime();
    return Math.ceil((expireTime - nowTime) / (1000 * 3600 * 24));
  };

  const countActive = nonAdminTenants.filter(t => {
    const daysLeft = getDaysLeft(t.expireDate);
    return t.status === 'active' && daysLeft >= 0;
  }).length;

  const countExpiring = nonAdminTenants.filter(t => {
    if (t.status === 'suspended') return false;
    const daysLeft = getDaysLeft(t.expireDate);
    return daysLeft >= 0 && daysLeft <= 14;
  }).length;

  const countExpired = nonAdminTenants.filter(t => {
    const daysLeft = getDaysLeft(t.expireDate);
    return t.status === 'expired' || daysLeft < 0;
  }).length;

  const countSuspended = nonAdminTenants.filter(t => t.status === 'suspended').length;
  const expiringSoonCount = countExpiring;
  const activeTenants = countActive;
  const suspendedTenants = countSuspended;

  const filteredTenants = nonAdminTenants
    .filter(t => {
      const query = searchTerm.trim().toLowerCase();
      const matchesSearch = !query || 
        t.username?.toLowerCase().includes(query) ||
        t.gymName?.toLowerCase().includes(query) ||
        t.ownerName?.toLowerCase().includes(query) ||
        t.phone.includes(query);

      if (!matchesSearch) return false;

      const daysLeft = getDaysLeft(t.expireDate);
      const isExpired = t.status === 'expired' || daysLeft < 0;

      if (statusFilter === 'all') return true;
      if (statusFilter === 'active') return t.status === 'active' && !isExpired;
      if (statusFilter === 'expiring') return t.status !== 'suspended' && daysLeft >= 0 && daysLeft <= 14;
      if (statusFilter === 'expired') return isExpired;
      if (statusFilter === 'suspended') return t.status === 'suspended';
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'gym_asc') {
        return (a.gymName || a.username).localeCompare(b.gymName || b.username, 'vi', { sensitivity: 'base' });
      }
      if (sortBy === 'gym_desc') {
        return (b.gymName || b.username).localeCompare(a.gymName || a.username, 'vi', { sensitivity: 'base' });
      }
      if (sortBy === 'expire_asc') {
        return new Date(a.expireDate).getTime() - new Date(b.expireDate).getTime();
      }
      if (sortBy === 'expire_desc') {
        return new Date(b.expireDate).getTime() - new Date(a.expireDate).getTime();
      }
      if (sortBy === 'oldest') {
        return (a.createdAt || a.id).localeCompare(b.createdAt || b.id);
      }
      // 'newest' default
      return (b.createdAt || b.id).localeCompare(a.createdAt || a.id);
    });

  const handleOpenCreateModal = () => {
    setEditingTenant(null);
    setUsername('');
    setPassword(Math.random().toString().slice(-6)); // auto 6-digit pass
    setGymName('');
    setOwnerName('');
    setPhone('');
    setExpireMonths(1);
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    setCustomExpireDate(d.toISOString().split('T')[0]);
    setNotes('');
    setFormError('');
    setFormSuccess('');
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (tenant: TenantAccount) => {
    setEditingTenant(tenant);
    setUsername(tenant.username);
    setPassword(tenant.password);
    setGymName(tenant.gymName);
    setOwnerName(tenant.ownerName);
    setPhone(tenant.phone);
    setCustomExpireDate(tenant.expireDate);
    setNotes(tenant.notes || '');
    setFormError('');
    setFormSuccess('');
    setIsCreateModalOpen(true);
  };

  const handleSaveTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!username.trim() || !password.trim()) {
      setFormError('Vui lòng nhập Tên đăng nhập và Mật khẩu!');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingTenant) {
        await updateTenant(editingTenant.id, {
          username: username.trim().toLowerCase(),
          password: password.trim(),
          gymName: gymName.trim() || 'Phòng Tập PT',
          ownerName: ownerName.trim() || 'PT Cá Nhân',
          phone: phone.trim(),
          expireDate: customExpireDate,
          notes: notes.trim()
        });
        setFormSuccess('Cập nhật tài khoản thành công!');
        setTimeout(() => setIsCreateModalOpen(false), 1000);
      } else {
        const res = await createTenant({
          username,
          password,
          gymName,
          ownerName,
          phone,
          expireDate: customExpireDate,
          notes
        });
        if (res.success) {
          setFormSuccess(res.message);
          setTimeout(() => setIsCreateModalOpen(false), 1200);
        } else {
          setFormError(res.message);
        }
      }
    } catch (err) {
      setFormError('Đã có lỗi xảy ra. Vui lòng thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExtend = async (id: string, months: number) => {
    const target = tenants.find(t => t.id === id);
    if (!target) return;
    if (confirm(`Xác nhận gia hạn thêm ${months} tháng cho tài khoản [${target.username}] (${target.gymName})?`)) {
      await extendTenant(id, months);
    }
  };


  const handleToggleStatus = async (tenant: TenantAccount) => {
    const newStatus = tenant.status === 'active' ? 'suspended' : 'active';
    const actionLabel = newStatus === 'suspended' ? 'TẠM KHÓA' : 'MỞ KHÓA';
    if (confirm(`Bạn có chắc chắn muốn ${actionLabel} tài khoản [${tenant.username}]?`)) {
      await updateTenant(tenant.id, { status: newStatus });
    }
  };

  const handleForceSuspend = async (tenant: TenantAccount) => {
    if (confirm(`🚨 BÁO ĐỘNG: ĐÁ VĂNG TÀI KHOẢN [${tenant.username}]\n\nHành động này sẽ:\n- Khóa tài khoản PT ngay lập tức.\n- Đăng xuất họ khỏi tất cả các thiết bị ngay tức thì.\n\nBạn có chắc chắn?`)) {
      // 1. Cập nhật status thành suspended
      await updateTenant(tenant.id, { status: 'suspended' });
      
      // 2. Thu hồi toàn bộ session đang active
      try {
        const q = query(collection(db, 'user_sessions'), where('user_id', '==', tenant.id), where('is_active', '==', true));
        const snapshot = await getDocs(q);
        const updatePromises = snapshot.docs.map(sessionDoc => 
          updateDoc(doc(db, 'user_sessions', sessionDoc.id), { is_active: false }).catch(e => console.warn('Revoke session quota error:', e))
        );
        await Promise.all(updatePromises);
        alert(`Đã khóa và đá văng tài khoản [${tenant.username}] thành công!`);
      } catch (err) {
        console.error("Error revoking sessions:", err);
        alert("Đã khóa tài khoản nhưng có lỗi khi thu hồi session.");
      }
    }
  };

  const handleDelete = async (tenant: TenantAccount) => {
    if (confirm(`⚠️ XÁC NHẬN XÓA TÀI KHOẢN [${tenant.username}]?\n\nHành động này sẽ xóa vĩnh viễn tài khoản phòng gym này khỏi hệ thống.`)) {
      await deleteTenant(tenant.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Admin Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-700/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-indigo-500/20 backdrop-blur-md rounded-xl border border-indigo-400/30">
              <ShieldCheck className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Trang Quản Trị Hệ Thống Cho Thuê Phần Mềm (Master Admin)</h1>
                <span className="bg-amber-400 text-indigo-950 font-bold text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow">Master Admin</span>
              </div>
              <p className="text-indigo-200 text-sm mt-1">
                Tạo tài khoản cho các PT / Chủ phòng Gym khác thuê hàng tháng, cấp quyền và theo dõi gia hạn sử dụng.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {activeTenantId !== 'default' && (
              <button
                onClick={() => setActiveTenantId('default')}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-xl transition shadow-md"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                Về Phòng Của Tôi (Gốc)
              </button>
            )}

            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-xl transition shadow-lg shadow-indigo-500/30"
            >
              <UserPlus className="w-5 h-5" />
              Tạo account mới
            </button>
          </div>
        </div>

        {/* Currently viewing another tenant indicator */}
        {activeTenantId !== 'default' && (
          <div className="mt-4 p-3 bg-amber-500/10 border border-amber-400/30 rounded-xl text-amber-200 text-sm flex items-center justify-between">
            <span>
              🔍 Bạn đang xem & kiểm tra dữ liệu của phòng ID: <strong className="text-amber-300">{activeTenantId}</strong>
            </span>
            <button 
              onClick={() => setActiveTenantId('default')}
              className="underline text-amber-300 hover:text-white font-semibold"
            >
              Quay lại chế độ Master
            </button>
          </div>
        )}
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng Account Đang Cho Thuê</p>
            <p className="text-2xl font-bold text-slate-800">{totalTenants}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tài Khoản Hoạt Động</p>
            <p className="text-2xl font-bold text-emerald-600">{activeTenants}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sắp Hết Hạn (&lt;7 Ngày)</p>
            <p className="text-2xl font-bold text-amber-600">{expiringSoonCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tài Khoản Khóa / Tạm Dừng</p>
            <p className="text-2xl font-bold text-rose-600">{suspendedTenants}</p>
          </div>
        </div>
      </div>

      {/* Filter, Search and Sorting Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
          {/* Search Box */}
          <div className="relative w-full md:w-80 lg:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo username, tên phòng, tên PT, SĐT..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <label className="text-xs font-bold text-slate-600 whitespace-nowrap flex items-center gap-1.5 shrink-0">
              <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600" />
              Sắp xếp:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full md:w-auto bg-slate-50 text-slate-800 font-extrabold text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition cursor-pointer"
            >
              <option value="expire_asc">⏱️ Hạn dùng: Sắp hết hạn trước</option>
              <option value="expire_desc">⏳ Hạn dùng: Còn hạn dài nhất</option>
              <option value="newest">🕒 Mới đăng ký / Cập nhật gần đây</option>
              <option value="gym_asc">🔤 Tên phòng / PT (A ➔ Z)</option>
              <option value="gym_desc">🔤 Tên phòng / PT (Z ➔ A)</option>
              <option value="oldest">📅 Đăng ký lâu nhất</option>
            </select>
          </div>
        </div>

        {/* Status Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-indigo-500" />
            Lọc:
          </span>

          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-extrabold rounded-xl transition whitespace-nowrap cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-600'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Tất cả ({totalTenants})
          </button>

          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 text-xs font-extrabold rounded-xl transition whitespace-nowrap cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-600'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200/60 hover:bg-emerald-100'
            }`}
          >
            🟢 Hoạt động ({countActive})
          </button>

          <button
            onClick={() => setStatusFilter('expiring')}
            className={`px-3 py-1.5 text-xs font-extrabold rounded-xl transition whitespace-nowrap cursor-pointer ${
              statusFilter === 'expiring'
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm ring-1 ring-amber-500'
                : 'bg-amber-50 text-amber-900 border border-amber-200/60 hover:bg-amber-100'
            }`}
          >
            ⏳ Sắp hết hạn ({countExpiring})
          </button>

          <button
            onClick={() => setStatusFilter('expired')}
            className={`px-3 py-1.5 text-xs font-extrabold rounded-xl transition whitespace-nowrap cursor-pointer ${
              statusFilter === 'expired'
                ? 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-600'
                : 'bg-rose-50 text-rose-800 border border-rose-200/60 hover:bg-rose-100'
            }`}
          >
            ⚠️ Đã hết hạn ({countExpired})
          </button>

          <button
            onClick={() => setStatusFilter('suspended')}
            className={`px-3 py-1.5 text-xs font-extrabold rounded-xl transition whitespace-nowrap cursor-pointer ${
              statusFilter === 'suspended'
                ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-800'
                : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
            }`}
          >
            🔴 Tạm khóa ({countSuspended})
          </button>
        </div>
      </div>

      {/* Tenant Accounts List Table / Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            Danh Sách Các Phòng Gym / PT Thuê Phần Mềm ({filteredTenants.length})
          </h2>
        </div>

        {filteredTenants.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Building2 className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="font-medium text-slate-700">Chưa tìm thấy tài khoản thuê nào!</p>
            <p className="text-xs text-slate-400 mt-1">Bấm "Tạo Account Mới" ở trên để bắt đầu thêm tài khoản cho PT/Chủ phòng khác.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTenants.map((tenant) => {
              const isExpired = tenant.expireDate < todayStr;
              const isCurrentActiveTenant = activeTenantId === tenant.tenantId;

              return (
                <div 
                  key={tenant.id} 
                  className={`p-5 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                    isCurrentActiveTenant ? 'bg-indigo-50/50 border-l-4 border-l-indigo-600' : 'hover:bg-slate-50'
                  }`}
                >
                  {/* Left info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 text-base">{tenant.gymName}</span>
                      <span className="text-slate-400 font-mono text-xs">(@{tenant.username})</span>
                      {/* Presence Indicator */}
                      {/* Presence Indicator Removed */}

                      {tenant.status === 'active' && !isExpired && (
                        <span className="bg-emerald-100 text-emerald-800 font-semibold text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Đang hoạt động
                        </span>
                      )}

                      {tenant.status === 'suspended' && (
                        <span className="bg-rose-100 text-rose-800 font-semibold text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Tạm khóa
                        </span>
                      )}

                      {isExpired && (
                        <span className="bg-amber-100 text-amber-800 font-semibold text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Hết hạn ngày {formatDate(tenant.expireDate)}
                        </span>
                      )}

                      {isCurrentActiveTenant && (
                        <span className="bg-indigo-600 text-white font-bold text-xs px-2 py-0.5 rounded-full">
                          Đang chọn xem
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 pt-1">
                      <div>
                        👤 PT/Chủ phòng: <strong className="text-slate-800">{tenant.ownerName}</strong>
                      </div>
                      <div>
                        📞 SĐT/Zalo: <a href={`tel:${tenant.phone}`} className="text-indigo-600 hover:underline font-semibold">{tenant.phone || 'Chưa cập nhật'}</a>
                      </div>
                      <div>
                        🔑 Mật khẩu: <code className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-mono text-slate-800">{tenant.password}</code>
                      </div>
                      <div>
                        📅 Ngày tạo: <span>{formatDate(tenant.createdAt)}</span>
                      </div>
                      <div>
                        ⏳ Hạn dùng đến: <strong className={isExpired ? 'text-rose-600' : 'text-emerald-700'}>{formatDate(tenant.expireDate)}</strong>
                      </div>
                      {tenant.notes && (
                        <div className="sm:col-span-3 text-slate-500 italic">
                          📝 Ghi chú: {tenant.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    {/* View tenant data */}
                    <button
                      onClick={() => setActiveTenantId(tenant.tenantId)}
                      className="px-3 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition flex items-center gap-1.5"
                      title="Chuyển sang xem dữ liệu học viên, doanh thu của phòng này"
                    >
                      <Eye className="w-3.5 h-3.5" /> Xem Dữ Liệu
                    </button>

                    {/* Quick Extend Buttons */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                      <span className="text-[10px] font-bold text-slate-500 px-1">+Gia hạn:</span>
                      {[1, 2, 3, 6].map((m) => (
                        <button
                          key={m}
                          onClick={() => handleExtend(tenant.id, m)}
                          className="px-2 py-0.5 text-xs font-semibold bg-white hover:bg-emerald-600 hover:text-white text-slate-700 rounded transition shadow-2xs cursor-pointer"
                          title={`Gia hạn +${m} Tháng`}
                        >
                          +{m}T
                        </button>
                      ))}
                    </div>

                    
                    {/* Kick & Suspend */}
                    <button
                      onClick={() => handleForceSuspend(tenant)}
                      className="px-2.5 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1 bg-red-100 text-red-700 hover:bg-red-200"
                      title="Đá văng tất cả thiết bị và khóa tài khoản"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                      Đá văng
                    </button>
                    {/* Lock / Unlock */}

                    <button
                      onClick={() => handleToggleStatus(tenant)}
                      className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1 ${
                        tenant.status === 'active'
                          ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {tenant.status === 'active' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      {tenant.status === 'active' ? 'Khóa' : 'Mở Khóa'}
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => handleOpenEditModal(tenant)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                      title="Chỉnh sửa thông tin"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(tenant)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Xóa tài khoản"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Create or Edit Tenant Account */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                {editingTenant ? `Chỉnh Sửa Tài Khoản: ${editingTenant.username}` : 'Tạo Account Thuê Mới Cho PT / Phòng Gym'}
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveTenant} className="space-y-4 pt-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Tên đăng nhập (Username) *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingTenant}
                    placeholder="ví dụ: pthung, gymspace"
                    value={username}
                    onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Mật khẩu đăng nhập *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Mật khẩu"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-indigo-600 font-bold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Tên phòng gym / thương hiệu
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Hùng PT Studio, Flex Gym"
                    value={gymName}
                    onChange={e => setGymName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Tên chủ phòng / PT
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Nguyễn Văn Hùng"
                    value={ownerName}
                    onChange={e => setOwnerName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Số điện thoại / Zalo
                  </label>
                  <input
                    type="tel"
                    placeholder="0901234567"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Ngày hết hạn sử dụng
                  </label>
                  <input
                    type="date"
                    value={customExpireDate}
                    onChange={e => setCustomExpireDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Bảng nhập & chọn nhanh số ngày/tháng hạn dùng tài khoản thuê */}
              <div>
                <TenantQuickDurationBox
                  startDate={todayStr}
                  endDate={customExpireDate}
                  onUpdateEndDate={(newEnd) => setCustomExpireDate(newEnd)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Ghi chú hợp đồng / giá thuê (chỉ Admin thấy)
                </label>
                <textarea
                  rows={2}
                  placeholder="VD: Thuê 500k/tháng, đóng tiền qua Vietcombank..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Đang lưu...' : (editingTenant ? 'Cập nhật' : 'Tạo tài khoản')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
