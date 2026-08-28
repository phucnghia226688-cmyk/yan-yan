import { getTodayDateStr } from '../utils/dateUtils';
import { removeAccents } from '../utils/textUtils';
import React, { useState } from 'react';
import { Clock,  
  Dumbbell, 
  LayoutDashboard, 
  Users, 
  CheckCircle2, 
  ClipboardList, 
  TrendingUp, 
  Wallet, 
  BarChart3, 
  Search, 
  Zap, 
  X,
  Phone,
  RefreshCw,
  Calendar,
  History,
  FileSpreadsheet,
  Settings,
  Download,
  LogOut,
  Sun,
  Moon,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  Menu,
  Layers,
  LayoutGrid,
  ShieldCheck,
  Building2,
  ArrowRight,
  Eye
} from 'lucide-react';
import { useGym } from '../context/GymContext';
import { useTenant } from '../context/TenantContext';
import { Client } from '../types';
import { NbGymLogo } from './NbGymLogo';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenQuickCheckIn: (client?: Client) => void;
  onOpenSettings?: () => void;
  onSelectClientDetail?: (client: Client) => void;
  onSelectClient?: (client: Client) => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenQuickCheckIn,
  onOpenSettings,
  onSelectClientDetail,
  onSelectClient,
  onLogout
}) => {
  const { clients, payments, expenses, auditLogs, resetData, isCloudSynced, themeMode, toggleThemeMode } = useGym();

  // 1-Click Instant Gym Master Data Export
  const handleQuickExportGymMaster = () => {
    const dateStr = getTodayDateStr();
    
    // UTF-8 BOM so Excel & Sheets open Vietnamese characters correctly
    let csv = '\uFEFF';
    csv += 'DANH SÁCH HỌC VIÊN GYM MASTER\n';
    csv += 'Mã HV,Họ Tên,SĐT,Gói Tập,Buổi Còn Lại,Tổng Buổi,Trạng Thái,Ngày Bắt Đầu,Ngày Kết Thúc,Ghi Chú PT\n';
    (clients || []).forEach((c, idx) => {
      const codeHV = `HV-${1000 + (clients.length - idx)}`;
      csv += `"${codeHV}","${c.name}","${c.phone}","${c.packageName || ''}",${c.remainingSessions},${c.totalSessions},"${c.status || 'Active'}","${c.startDate || ''}","${c.endDate || ''}","${(c.ptNotes || '').replace(/"/g, '""')}"\n`;
    });

    csv += '\nLỊCH SỬ THANH TOÁN DOANH THU\n';
    csv += 'Mã GD,Họ Tên,Gói Tập,Số Buổi,Số Tiền (VNĐ),Hình Thức,Ngày Thu\n';
    (payments || []).forEach(p => {
      csv += `"${p.id}","${p.clientName}","${p.packageName}",${p.sessionsCount},${p.amountVnd},"${p.paymentMethod}","${p.paymentDate}"\n`;
    });

    csv += '\nDANH SÁCH KHOẢN CHI PHÍ\n';
    csv += 'Mã Chi,Nhóm,Danh Mục,Số Tiền (VNĐ),Ngày Chi,Ghi Chú\n';
    (expenses || []).forEach(e => {
      csv += `"${e.id}","${e.categoryGroup}","${e.category}",${e.amountVnd},"${e.date}","${(e.notes || '').replace(/"/g, '""')}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Gym_Master_Export_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const { currentUser, isMasterAdmin, activeTenantId, setActiveTenantId, tenants } = useTenant();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Vertical Collapsible Navigation States
  const [isVerticalBoxOpen, setIsVerticalBoxOpen] = useState<boolean>(false);
  const [navDisplayMode, setNavDisplayMode] = useState<'vertical' | 'horizontal'>('horizontal');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    overview: true,
    clients: true,
    finance: true,
    reports: true
  });

  // Drag-to-scroll and swipe for horizontal menu
  const navRef = React.useRef<HTMLDivElement>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftPos, setScrollLeftPos] = useState(0);

  const scrollNav = (direction: 'left' | 'right') => {
    if (navRef.current) {
      const scrollAmount = 260;
      navRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!navRef.current) return;
    setIsMouseDown(true);
    setStartX(e.pageX - navRef.current.offsetLeft);
    setScrollLeftPos(navRef.current.scrollLeft);
  };

  const handleMouseLeaveOrUp = () => {
    setIsMouseDown(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown || !navRef.current) return;
    e.preventDefault();
    const x = e.pageX - navRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    navRef.current.scrollLeft = scrollLeftPos - walk;
  };

  const toggleSection = (groupId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedSections(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  // Instant quick search by name or phone number
  const filteredClients = searchQuery.trim()
    ? clients.filter(c => {
        const searchNormalized = removeAccents(searchQuery.trim().toLowerCase());
        const nameNormalized = removeAccents(c.name.toLowerCase());
        return nameNormalized.includes(searchNormalized) || c.phone.includes(searchQuery.trim());
      }).slice(0, 6)
    : [];

  const handleSelectSearchResult = (client: Client) => {
    if (onSelectClient) onSelectClient(client);
    else if (onSelectClientDetail) onSelectClientDetail(client);
    setSearchQuery('');
    setShowSearchResults(false);
    setActiveTab('clients');
  };

  interface NavItem {
    id: string;
    label: string;
    icon: any;
    badge?: number | undefined;
  }

  interface NavGroup {
    id: string;
    label: string;
    icon: any;
    items: NavItem[];
  }

  const navGroups: NavGroup[] = [
    ...(isMasterAdmin ? [{
      id: 'admin',
      label: 'Quản trị Master',
      icon: ShieldCheck,
      items: [
        { id: 'admin_tenants', label: 'Cho thuê tài khoản', icon: ShieldCheck, badge: Math.max(0, tenants.length - 1) },
      ]
    }] : []),
    {
      id: 'overview',
      label: 'Tổng quan & lịch',
      icon: LayoutDashboard,
      items: [
        { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
        { id: 'appointments', label: 'Lịch hẹn & check-in PT', icon: Calendar },
      ]
    },
    {
      id: 'clients',
      label: 'Quản lý học viên',
      icon: Users,
      items: [
        { id: 'clients', label: 'Học viên', icon: Users, badge: clients.filter(c => c.status !== 'closed').length },
      ]
    },
    {
      id: 'finance',
      label: 'Quản lý thu chi',
      icon: Wallet,
      items: [
        { id: 'finance', label: 'Quản lý thu chi', icon: Wallet },
      ]
    },
    {
      id: 'reports',
      label: 'Báo cáo & hệ thống',
      icon: BarChart3,
      items: [
        { id: 'reports', label: 'Báo cáo & lịch sử', icon: BarChart3, badge: auditLogs ? auditLogs.filter(a => !a.isUndone).length : undefined },
      ]
    }
  ];

  const allNavItems: NavItem[] = navGroups.flatMap(g => g.items);

  const currentDateStr = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return (
    <header className="sticky top-0 z-40 bg-white text-slate-800 border-b border-slate-200 shadow-sm w-full max-w-full overflow-hidden">
      {/* Active tenant inspection banner (Master Admin ONLY) */}
      {isMasterAdmin && activeTenantId !== 'default' && (
        <div className="bg-amber-500 text-slate-950 font-bold px-4 py-1.5 text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span>Đang ở chế độ xem & kiểm tra dữ liệu phòng: <strong className="underline">{tenants.find(t => t.tenantId === activeTenantId)?.gymName || activeTenantId}</strong></span>
          </div>
          <button
            onClick={() => setActiveTenantId('default')}
            className="bg-slate-950 text-white px-3 py-0.5 rounded-full text-[11px] font-bold hover:bg-slate-800 transition"
          >
            Trở về Master Admin
          </button>
        </div>
      )}

      {/* Top Banner Row */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2.5">
          
          {/* Logo & Gym Name */}
          <div className="flex items-center justify-between w-full md:w-auto">
            <div 
              onClick={() => setActiveTab('dashboard')} 
              className="flex items-center gap-2 sm:gap-3 cursor-pointer group min-w-0"
            >
              <NbGymLogo size="md" className="group-hover:scale-105 transition-transform duration-300 bg-white p-1 border border-slate-200/80 rounded-xl shadow-2xs shrink-0" />
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 flex flex-wrap items-center gap-1.5 leading-tight">
                  <span className="truncate">{(!currentUser?.gymName || currentUser?.gymName === 'NB PRIVATE GYM (Gốc)') ? 'NBFit Master' : currentUser.gymName}</span>
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs whitespace-nowrap ${
                    isCloudSynced 
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' 
                      : 'bg-amber-50 text-amber-800 border border-amber-300'
                  }`} title="Firebase Cloud Sync">
                    <span className={`w-1.5 h-1.5 rounded-full ${isCloudSynced ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                    {isCloudSynced ? 'Realtime Sync' : 'Connecting...'}
                  </span>
                </h1>
                
                {/* Owner info, date & Direct Zalo contact connection */}
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  <p className="text-[11px] sm:text-xs text-slate-400 capitalize font-medium truncate">
                    {currentUser?.ownerName ? `PT: ${currentUser.ownerName} • ` : ''}{currentDateStr}
                  </p>
                  {currentUser?.role === 'tenant' && currentUser?.expireDate && (() => {
                    const diffTime = new Date(currentUser.expireDate).getTime() - new Date().getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    const isExpiringSoon = diffDays <= 7;
                    return (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs border ${isExpiringSoon ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`} title={`Tài khoản hết hạn vào ${new Date(currentUser.expireDate).toLocaleDateString('vi-VN')}`}>
                        <Clock className="w-3 h-3" />
                        Còn {diffDays > 0 ? diffDays : 0} ngày
                      </span>
                    );
                  })()}

                  {(() => {
                    const zaloPhone = (currentUser?.phone && currentUser.phone !== '0900000000') 
                      ? currentUser.phone 
                      : '0935244966';
                    return (
                      <a
                        href={`https://zalo.me/${zaloPhone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-bold transition-all shadow-2xs hover:scale-105 active:scale-95 group/zalo cursor-pointer"
                        title="Bấm vào đây để mở Zalo liên hệ trực tiếp khi có thắc mắc"
                      >
                        <Phone className="w-3 h-3 text-blue-600 shrink-0" />
                        <span>Zalo / SĐT: <strong className="font-black text-blue-900">{zaloPhone}</strong></span>
                        <span className="bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-md tracking-tight group-hover/zalo:bg-blue-700 transition-colors">
                          Liên hệ Zalo 💬
                        </span>
                      </a>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* 1-Click Backup Tất Cả Button (Master Admin ONLY) */}
            {isMasterAdmin && (
              <button
                type="button"
                onClick={handleQuickExportGymMaster}
                title="1-Click Đồng bộ & Xuất toàn bộ dữ liệu Gym Master (Học viên, Doanh thu, Chi phí) ra Excel/CSV"
                className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-lg text-[11px] shadow-2xs transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0 border border-emerald-500"
              >
                <FileSpreadsheet className="w-3 h-3 text-emerald-100 shrink-0" />
                <span>Backup tất cả</span>
              </button>
            )}
          </div>

          {/* Quick Search & Fast Actions */}
          <div className="flex items-center gap-2 w-full md:w-auto min-w-0">
            
            {/* Rapid Search Bar */}
            <div className="relative flex-1 min-w-0">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm học viên nhanh (Tên/SĐT)..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchResults(true);
                  }}
                  onFocus={() => setShowSearchResults(true)}
                  className="w-full bg-slate-100 text-slate-800 placeholder-slate-400 text-xs sm:text-sm pl-9 pr-7 py-2 rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white transition-all"
                />
                {searchQuery && (
                  <button 
                    onClick={() => { setSearchQuery(''); setShowSearchResults(false); }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Instant Search Results Dropdown */}
              {showSearchResults && filteredClients.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {filteredClients.map(client => (
                    <div
                      key={client.id}
                      onClick={() => handleSelectSearchResult(client)}
                      className="p-2.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img 
                          src={client.avatarUrl} 
                          alt={client.name} 
                          className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0" 
                        />
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1 truncate">
                            {client.name}
                            {client.remainingSessions <= 3 && (
                              <span className="text-[9px] bg-red-50 text-red-600 border border-red-200 px-1 py-0.2 rounded-full font-semibold shrink-0">
                                {client.remainingSessions}b
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" /> {client.phone}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenQuickCheckIn(client);
                          setSearchQuery('');
                          setShowSearchResults(false);
                        }}
                        className="text-[11px] font-bold bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white px-2.5 py-1 rounded-full transition-all flex items-center gap-1 border border-emerald-200 shrink-0"
                      >
                        <Zap className="w-3 h-3" /> Check-in
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Theme Toggle Button (Light / Dark) */}
            <button
              onClick={toggleThemeMode}
              title={themeMode === 'dark' ? "Chuyển sang tông màu sáng" : "Chuyển sang tông màu tối"}
              className={`flex items-center gap-1.5 font-bold p-2 sm:px-3 sm:py-2 rounded-full text-xs border transition-all active:scale-95 cursor-pointer shrink-0 ${
                themeMode === 'dark'
                  ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30'
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
              }`}
            >
              {themeMode === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400 fill-amber-400/30" />
                  <span className="hidden sm:inline">Tông sáng</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-600 fill-indigo-600/30" />
                  <span className="hidden sm:inline">Tông tối</span>
                </>
              )}
            </button>

            {/* Settings & Backup Button */}
            <button
              onClick={() => onOpenSettings ? onOpenSettings() : setActiveTab('settings')}
              title="Cài đặt & Sao lưu dữ liệu"
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold p-2 sm:px-3 sm:py-2 rounded-full text-xs border border-slate-200 transition-all active:scale-95 shrink-0"
            >
              <Settings className="w-4 h-4 text-[#FF4E00]" />
              <span className="hidden lg:inline">Cài đặt</span>
            </button>

            {/* Logout Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                title="Đăng xuất khỏi hệ thống"
                className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold p-2 sm:px-3 sm:py-2 rounded-full text-xs border border-rose-200 transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span className="hidden sm:inline">Thoát</span>
              </button>
            )}

          </div>
        </div>
      </div>

      {/* Vertical & Horizontal Navigation Bar Row */}
      <div className="bg-slate-50/95 backdrop-blur-md border-t border-slate-200 w-full">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-2">
          
          {/* Header Controls for Menu Mode (Aligned Left) */}
          <div className="flex items-center justify-start gap-2 mb-1.5 flex-wrap">
            {/* Display Mode Switcher */}
            <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl border border-slate-300/90 text-xs font-bold">
              <span className="text-slate-600 font-extrabold text-[11px] px-1.5 flex items-center gap-1 shrink-0 select-none">
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>Chế độ xem:</span>
              </span>
              <button
                type="button"
                onClick={() => setNavDisplayMode('horizontal')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                  navDisplayMode === 'horizontal'
                    ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/50 font-medium'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Trượt ngang</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setNavDisplayMode('vertical');
                  setIsVerticalBoxOpen(true);
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                  navDisplayMode === 'vertical'
                    ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/50 font-medium'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Menu dọc</span>
              </button>
            </div>

            {/* Toggle Main Vertical Box Button (When in vertical mode or optionally toggling) */}
            {navDisplayMode === 'vertical' && (
              <button
                type="button"
                onClick={() => setIsVerticalBoxOpen(!isVerticalBoxOpen)}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white text-slate-800 font-extrabold text-xs sm:text-sm border border-slate-300 shadow-2xs hover:bg-slate-100 transition-all cursor-pointer"
              >
                <Menu className="w-4 h-4 text-indigo-600" />
                <span>Danh mục menu dọc</span>
                {isVerticalBoxOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
              </button>
            )}

          </div>

          {/* Mode 1: VERTICAL COLLAPSIBLE ACCORDION BOX */}
          {navDisplayMode === 'vertical' && isVerticalBoxOpen && (
            <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm p-3 my-1 space-y-2.5 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {navGroups.map((group) => {
                  const GroupIcon = group.icon;
                  const isExpanded = !!expandedSections[group.id];
                  const hasActiveChild = group.items.some(i => i.id === activeTab);

                  return (
                    <div 
                      key={group.id} 
                      className={`rounded-xl border transition-all overflow-hidden ${
                        hasActiveChild 
                          ? 'border-indigo-300 bg-indigo-50/30' 
                          : 'border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/50'
                      }`}
                    >
                      {/* Group Header Row */}
                      <div 
                        onClick={(e) => toggleSection(group.id, e)}
                        className={`flex items-center justify-between p-2.5 cursor-pointer select-none transition-colors ${
                          hasActiveChild ? 'bg-indigo-100/60 text-indigo-950 font-black' : 'hover:bg-slate-200/60 text-slate-800 font-bold'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <GroupIcon className={`w-4 h-4 ${hasActiveChild ? 'text-indigo-600' : 'text-slate-500'}`} />
                          <span className="text-xs uppercase tracking-wider">{group.label}</span>
                        </div>
                        <button 
                          type="button"
                          className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/50 transition-colors"
                          title={isExpanded ? "Thu gọn dạng dọc" : "Mở rộng dạng dọc"}
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <ChevronLeft className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </div>

                      {/* Sub-items List */}
                      {isExpanded && (
                        <div className="p-1.5 space-y-1 border-t border-slate-200/60 bg-white">
                          {group.items.map((item) => {
                            const ItemIcon = item.icon;
                            const isActive = activeTab === item.id;

                            return (
                              <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  isActive
                                    ? 'bg-indigo-600 text-white shadow-2xs'
                                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <ItemIcon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                                  <span>{item.label}</span>
                                </div>
                                {item.badge !== undefined && (
                                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                                    isActive ? 'bg-white text-indigo-700' : 'bg-slate-200 text-slate-700'
                                  }`}>
                                    {item.badge}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mode 2: HORIZONTAL SWIPEABLE TABS (Drag/Swipe to scroll, Clean interface without scrollbar track) */}
          {navDisplayMode === 'horizontal' && (
            <div className="relative w-full flex items-center group">
              {/* Left Scroll Button */}
              <button
                type="button"
                onClick={() => scrollNav('left')}
                className="hidden sm:flex absolute left-0 z-10 items-center justify-center w-8 h-8 rounded-full bg-white/95 shadow-md border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition-all cursor-pointer -ml-2.5 active:scale-95"
                title="Cuộn sang trái"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <nav
                ref={navRef}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeaveOrUp}
                onMouseUp={handleMouseLeaveOrUp}
                onMouseMove={handleMouseMove}
                className={`flex items-center justify-start gap-1.5 overflow-x-auto py-1.5 scroll-smooth touch-pan-x max-w-full select-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
                  isMouseDown ? 'cursor-grabbing' : 'cursor-grab'
                }`}
              >
                {allNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (!isMouseDown) setActiveTab(item.id);
                      }}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                        isActive
                          ? 'bg-[#4F46E5] text-white shadow-md shadow-indigo-200 ring-2 ring-indigo-400/30'
                          : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80 shadow-2xs'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                      <span>{item.label}</span>
                      {item.badge !== undefined && (
                        <span className={`text-[10px] sm:text-[11px] px-1.5 py-0.2 rounded-full font-extrabold ${
                          isActive ? 'bg-white text-indigo-700' : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Right Scroll Button */}
              <button
                type="button"
                onClick={() => scrollNav('right')}
                className="hidden sm:flex absolute right-0 z-10 items-center justify-center w-8 h-8 rounded-full bg-white/95 shadow-md border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition-all cursor-pointer -mr-2.5 active:scale-95"
                title="Cuộn sang phải"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </div>
    </header>
  );
};
