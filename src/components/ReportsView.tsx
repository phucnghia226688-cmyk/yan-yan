import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Wallet, 
  DollarSign, 
  PieChart as PieIcon, 
  Users, 
  Award, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownRight,
  History
} from 'lucide-react';
import { useGym } from '../context/GymContext';
import { AuditLogView } from './AuditLogView';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';

interface ReportsViewProps {
  activeSubTab?: 'reports' | 'audit';
  onSubTabChange?: (tab: 'reports' | 'audit') => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  activeSubTab = 'reports',
  onSubTabChange
}) => {
  const { clients, payments, expenses, checkIns, auditLogs } = useGym();

  const [currentSubTab, setCurrentSubTab] = useState<'reports' | 'audit'>(
    activeSubTab === 'audit' ? 'audit' : 'reports'
  );

  useEffect(() => {
    if (activeSubTab) {
      setCurrentSubTab(activeSubTab === 'audit' ? 'audit' : 'reports');
    }
  }, [activeSubTab]);

  const handleSubTabClick = (tab: 'reports' | 'audit') => {
    setCurrentSubTab(tab);
    if (onSubTabChange) {
      onSubTabChange(tab);
    }
  };

  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Prepare monthly revenue & expense comparison data for charts
  const monthNames = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'];

  const monthlyFinancialData = monthNames.map((monthName, idx) => {
    const rev = payments
      .filter(p => {
        const d = new Date(p.paymentDate);
        return d.getMonth() === idx && d.getFullYear() === selectedYear;
      })
      .reduce((sum, p) => sum + p.amountVnd, 0);

    const gymExp = expenses
      .filter(e => {
        const d = new Date(e.date);
        return e.categoryGroup === 'Phòng gym' && d.getMonth() === idx && d.getFullYear() === selectedYear;
      })
      .reduce((sum, e) => sum + e.amountVnd, 0);

    const familyExp = expenses
      .filter(e => {
        const d = new Date(e.date);
        return e.categoryGroup === 'Gia đình' && d.getMonth() === idx && d.getFullYear() === selectedYear;
      })
      .reduce((sum, e) => sum + e.amountVnd, 0);

    const totalExp = gymExp + familyExp;
    const profit = rev - totalExp;

    return {
      name: monthName,
      DoanhThu: rev / 1000000, // in Millions
      ChiPhi: totalExp / 1000000,
      ChiPhiGym: gymExp / 1000000,
      ChiPhiGiaDinh: familyExp / 1000000,
      LoiNhuan: profit / 1000000
    };
  });

  // Calculate year totals
  const totalYearRevenue = payments
    .filter(p => new Date(p.paymentDate).getFullYear() === selectedYear)
    .reduce((sum, p) => sum + p.amountVnd, 0);

  const totalYearGymExpense = expenses
    .filter(e => e.categoryGroup === 'Phòng gym' && new Date(e.date).getFullYear() === selectedYear)
    .reduce((sum, e) => sum + e.amountVnd, 0);

  const totalYearFamilyExpense = expenses
    .filter(e => e.categoryGroup === 'Gia đình' && new Date(e.date).getFullYear() === selectedYear)
    .reduce((sum, e) => sum + e.amountVnd, 0);

  const totalYearNetProfit = totalYearRevenue - totalYearGymExpense - totalYearFamilyExpense;

  // Pie chart expense category distribution
  const gymExpenseCategoriesData = [
    { name: 'Thuê mặt bằng', value: 15000000, color: '#f59e0b' },
    { name: 'Điện nước', value: 4800000, color: '#3b82f6' },
    { name: 'Internet & Phần mềm', value: 800000, color: '#10b981' },
    { name: 'Marketing', value: 3000000, color: '#ec4899' },
    { name: 'Bảo trì & Khác', value: 2000000, color: '#8b5cf6' }
  ];

  const formatVnd = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Consolidated Sub-Navigation Header Bar (Combines Reports, Audit Logs) */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto p-0.5">
          <button
            type="button"
            onClick={() => handleSubTabClick('reports')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              currentSubTab === 'reports'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Báo cáo thống kê</span>
          </button>

          <button
            type="button"
            onClick={() => handleSubTabClick('audit')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              currentSubTab === 'audit'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4 text-amber-500" />
            <span>Lịch sử thao tác</span>
            {auditLogs && auditLogs.filter(a => !a.isUndone).length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                currentSubTab === 'audit' ? 'bg-white text-indigo-700' : 'bg-amber-100 text-amber-800'
              }`}>
                {auditLogs.filter(a => !a.isUndone).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {currentSubTab === 'audit' && <AuditLogView />}

      {currentSubTab === 'reports' && (
        <>
          {/* Header */}
      <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#FF4E00] bg-orange-50 border border-orange-200 px-3 py-1 rounded-full uppercase tracking-wider">
            Báo cáo tài chính & hiệu suất
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-2 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#FF4E00]" />
            Báo cáo tổng quan Private Gym
          </h2>
          <p className="text-sm text-slate-500 mt-0.5 font-medium">
            Biểu đồ so sánh doanh thu, chi phí, lợi nhuận ròng và chỉ số tăng trưởng phòng gym.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-600">Năm báo cáo:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="bg-slate-100 border border-slate-200 text-[#FF4E00] font-black text-sm rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF4E00]"
          >
            <option value={2026}>Năm 2026</option>
            <option value={2025}>Năm 2025</option>
          </select>
        </div>
      </div>

      {/* 4 Financial Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng doanh thu ({selectedYear})</p>
          <p className="text-2xl font-black text-emerald-600 mt-2">{formatVnd(totalYearRevenue)}</p>
          <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> Gói tập + Học viên mới
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chi phí gym ({selectedYear})</p>
          <p className="text-2xl font-black text-[#FF4E00] mt-2">{formatVnd(totalYearGymExpense)}</p>
          <span className="text-[11px] text-slate-500 font-medium mt-1 block">Chi phí vận hành cố định</span>
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chi phí gia đình ({selectedYear})</p>
          <p className="text-2xl font-black text-[#4F46E5] mt-2">{formatVnd(totalYearFamilyExpense)}</p>
          <span className="text-[11px] text-slate-500 font-medium mt-1 block">Sinh hoạt gia đình PT</span>
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lợi nhuận ròng ({selectedYear})</p>
          <p className={`text-2xl font-black mt-2 ${totalYearNetProfit >= 0 ? 'text-[#FF4E00]' : 'text-rose-600'}`}>
            {formatVnd(totalYearNetProfit)}
          </p>
          <span className="text-[11px] text-[#FF4E00] font-bold block mt-1">
            Tỷ suất LN: {totalYearRevenue > 0 ? Math.round((totalYearNetProfit / totalYearRevenue) * 100) : 0}%
          </span>
        </div>

      </div>

      {/* Main Combined Bar Chart: Revenue & Profit with Small Expense Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#FF4E00]" />
              Biểu đồ doanh thu - lợi nhuận & chi phí theo tháng
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              So sánh doanh thu & lợi nhuận ròng qua các tháng, kèm cột chi phí nhỏ bên cạnh
            </p>
          </div>
          <span className="text-xs text-slate-500 font-medium">Đơn vị: Triệu VNĐ</span>
        </div>

        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyFinancialData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(val: any, name: string) => [`${val} Triệu VNĐ`, name]}
              />
              <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '12px', fontWeight: 700 }} />
              <Bar dataKey="DoanhThu" name="Doanh thu" fill="#10b981" radius={[6, 6, 0, 0]} barSize={22} />
              <Bar dataKey="LoiNhuan" name="Lợi nhuận ròng" fill="#4F46E5" radius={[6, 6, 0, 0]} barSize={22} />
              <Bar dataKey="ChiPhi" name="Chi phí (cột nhỏ)" fill="#FF4E00" radius={[4, 4, 0, 0]} barSize={10} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Section: PT Performance & Retention */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
          <Award className="w-5 h-5 text-[#FF4E00]" />
          Hiệu suất huấn luyện & giữ chân học viên
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <p className="text-xs text-slate-500 font-bold">Tỷ lệ gia hạn hợp đồng</p>
            <p className="text-2xl font-black text-[#FF4E00] mt-1">88.5%</p>
            <p className="text-[11px] text-emerald-600 font-bold mt-1">Rất tốt cho Private Gym</p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <p className="text-xs text-slate-500 font-bold">Trung bình lượt tập / ngày</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">6.2 lượt</p>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Không bị quá tải khung giờ</p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <p className="text-xs text-slate-500 font-bold">Tổng số check-in thành công</p>
            <p className="text-2xl font-black text-[#4F46E5] mt-1">{checkIns.length} buổi</p>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Đã lưu đầy đủ vết</p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <p className="text-xs text-slate-500 font-bold">Tổng số học viên active</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{clients.length} người</p>
            <p className="text-[11px] text-[#FF4E00] font-bold mt-1">Mô hình &gt; 30 học viên</p>
          </div>
        </div>
      </div>
        </>
      )}

    </div>
  );
};
