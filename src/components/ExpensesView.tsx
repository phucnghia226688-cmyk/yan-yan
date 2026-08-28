import { getTodayDateStr } from '../utils/dateUtils';
import { removeAccents } from '../utils/textUtils';
import React, { useState } from 'react';
import { 
  Wallet, 
  Dumbbell, 
  Home, 
  PlusCircle, 
  Search, 
  Trash2, 
  Pencil,
  X, 
  PieChart, 
  FileSpreadsheet,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useGym } from '../context/GymContext';
import { ExpenseRecord, GymExpenseCategory, FamilyExpenseCategory } from '../types';

export const ExpensesView: React.FC = () => {
  const { expenses, addExpense, updateExpense, deleteExpense } = useGym();

  const [activeTab, setActiveTab] = useState<'all' | 'gym' | 'family'>('all');
  const [timeFilter, setTimeFilter] = useState<'month' | 'year' | 'all'>('month');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // New Expense Form
  const [expenseForm, setExpenseForm] = useState({
    categoryGroup: 'Phòng gym' as ExpenseRecord['categoryGroup'],
    category: 'Thuê mặt bằng' as string,
    amountVnd: 1000000,
    date: getTodayDateStr(),
    notes: ''
  });

  // Edit Expense Form
  const [editForm, setEditForm] = useState({
    categoryGroup: 'Phòng gym' as ExpenseRecord['categoryGroup'],
    category: 'Thuê mặt bằng' as string,
    amountVnd: 1000000,
    date: getTodayDateStr(),
    notes: ''
  });

  const gymCategories: GymExpenseCategory[] = [
    'Thuê mặt bằng', 'Điện', 'Nước', 'Internet', 'Marketing', 'Bảo trì thiết bị', 'Dụng cụ tiêu hao', 'Khác'
  ];

  const familyCategories: FamilyExpenseCategory[] = [
    'Ăn uống', 'Học phí con', 'Điện nước gia đình', 'Internet', 'Xăng xe', 'Mua sắm', 'Du lịch', 'Khác'
  ];

  const handleGroupChange = (group: 'Phòng gym' | 'Gia đình') => {
    setExpenseForm({
      ...expenseForm,
      categoryGroup: group,
      category: group === 'Phòng gym' ? gymCategories[0] : familyCategories[0]
    });
  };

  const handleEditGroupChange = (group: 'Phòng gym' | 'Gia đình') => {
    setEditForm({
      ...editForm,
      categoryGroup: group,
      category: group === 'Phòng gym' ? gymCategories[0] : familyCategories[0]
    });
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    addExpense(expenseForm);
    setIsAddModalOpen(false);
  };

  const handleOpenEditModal = (expense: ExpenseRecord) => {
    setEditingExpense(expense);
    setEditForm({
      categoryGroup: expense.categoryGroup,
      category: expense.category,
      amountVnd: expense.amountVnd,
      date: expense.date,
      notes: expense.notes || ''
    });
  };

  const handleUpdateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;
    updateExpense(editingExpense.id, editForm);
    setEditingExpense(null);
  };

  // Filter expenses
  const filteredExpenses = expenses.filter(e => {
    const matchesGroup = activeTab === 'all' 
      ? true 
      : activeTab === 'gym' ? e.categoryGroup === 'Phòng gym' : e.categoryGroup === 'Gia đình';

    const searchNormalized = removeAccents(searchQuery.trim().toLowerCase());
    const categoryNormalized = removeAccents(e.category.toLowerCase());
    const notesNormalized = e.notes ? removeAccents(e.notes.toLowerCase()) : '';
    const matchesSearch = categoryNormalized.includes(searchNormalized) || notesNormalized.includes(searchNormalized);

    const d = new Date(e.date);
    let matchesTime = true;
    if (timeFilter === 'month') {
      matchesTime = d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    } else if (timeFilter === 'year') {
      matchesTime = d.getFullYear() === selectedYear;
    }

    return matchesGroup && matchesSearch && matchesTime;
  });

  const filteredTotalAmount = filteredExpenses.reduce((sum, e) => sum + e.amountVnd, 0);

  // Calculate totals (Gym)
  const gymTotalMonth = expenses.filter(e => e.categoryGroup === 'Phòng gym' && new Date(e.date).getMonth() === currentMonth && new Date(e.date).getFullYear() === currentYear).reduce((sum, e) => sum + e.amountVnd, 0);
  const gymTotalYear = expenses.filter(e => e.categoryGroup === 'Phòng gym' && new Date(e.date).getFullYear() === currentYear).reduce((sum, e) => sum + e.amountVnd, 0);
  const gymTotalAll = expenses.filter(e => e.categoryGroup === 'Phòng gym').reduce((sum, e) => sum + e.amountVnd, 0);

  // Calculate totals (Family)
  const familyTotalMonth = expenses.filter(e => e.categoryGroup === 'Gia đình' && new Date(e.date).getMonth() === currentMonth && new Date(e.date).getFullYear() === currentYear).reduce((sum, e) => sum + e.amountVnd, 0);
  const familyTotalYear = expenses.filter(e => e.categoryGroup === 'Gia đình' && new Date(e.date).getFullYear() === currentYear).reduce((sum, e) => sum + e.amountVnd, 0);
  const familyTotalAll = expenses.filter(e => e.categoryGroup === 'Gia đình').reduce((sum, e) => sum + e.amountVnd, 0);

  const grandTotalMonth = gymTotalMonth + familyTotalMonth;
  const grandTotalYear = gymTotalYear + familyTotalYear;
  const grandTotalAll = gymTotalAll + familyTotalAll;

  const formatVnd = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full uppercase tracking-wider">
            Quản Lý Chi Phí Gym & Gia Đình
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-2 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-rose-600" />
            Tổng Dòng Tiền Chi Ra
          </h2>
          <p className="text-sm text-slate-500 mt-0.5 font-medium">
            Theo dõi song song chi phí vận hành phòng gym và sinh hoạt gia đình để quản lý tài chính toàn diện.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-[#FF4E00] hover:bg-orange-600 text-white font-extrabold px-5 py-2.5 rounded-full text-sm shadow-md transition-all flex items-center gap-2 active:scale-95"
        >
          <PlusCircle className="w-4 h-4 fill-white text-[#FF4E00]" />
          + Thêm Khoản Chi Mới
        </button>
      </div>

      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Chi phí tháng này */}
        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm relative overflow-hidden group hover:border-rose-300 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div className="flex items-center gap-2 text-rose-600 text-[11px] font-black uppercase tracking-widest mb-2 relative z-10">
            <Wallet className="w-4 h-4" /> Chi Phí Tháng Này ({currentMonth + 1}/{currentYear})
          </div>
          <p className="text-2xl font-black text-slate-900 relative z-10">{formatVnd(grandTotalMonth)}</p>
          <div className="mt-3 flex items-center gap-3 relative z-10">
            <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg border border-amber-200">
              <Dumbbell className="w-3.5 h-3.5" />
              <span className="text-[11px] font-extrabold">{formatVnd(gymTotalMonth)}</span>
            </div>
            <div className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-200">
              <Home className="w-3.5 h-3.5" />
              <span className="text-[11px] font-extrabold">{formatVnd(familyTotalMonth)}</span>
            </div>
          </div>
        </div>

        {/* Chi phí năm nay */}
        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm relative overflow-hidden group hover:border-rose-300 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div className="flex items-center gap-2 text-amber-600 text-[11px] font-black uppercase tracking-widest mb-2 relative z-10">
            <PieChart className="w-4 h-4" /> Chi Phí Năm Nay ({currentYear})
          </div>
          <p className="text-2xl font-black text-slate-900 relative z-10">{formatVnd(grandTotalYear)}</p>
          <div className="mt-3 flex items-center gap-3 relative z-10">
            <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg border border-amber-200">
              <Dumbbell className="w-3.5 h-3.5" />
              <span className="text-[11px] font-extrabold">{formatVnd(gymTotalYear)}</span>
            </div>
            <div className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-200">
              <Home className="w-3.5 h-3.5" />
              <span className="text-[11px] font-extrabold">{formatVnd(familyTotalYear)}</span>
            </div>
          </div>
        </div>

        {/* Tổng lũy kế */}
        <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm relative overflow-hidden group hover:border-rose-300 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div className="flex items-center gap-2 text-[#4F46E5] text-[11px] font-black uppercase tracking-widest mb-2 relative z-10">
            <FileSpreadsheet className="w-4 h-4" /> Tích Lũy Toàn Bộ Chi
          </div>
          <p className="text-2xl font-black text-slate-900 relative z-10">{formatVnd(grandTotalAll)}</p>
          <div className="mt-3 flex items-center gap-3 relative z-10">
            <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg border border-amber-200">
              <Dumbbell className="w-3.5 h-3.5" />
              <span className="text-[11px] font-extrabold">{formatVnd(gymTotalAll)}</span>
            </div>
            <div className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-200">
              <Home className="w-3.5 h-3.5" />
              <span className="text-[11px] font-extrabold">{formatVnd(familyTotalAll)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Expenses Table & Filter Tabs */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          
          {/* Left: Group Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-2xl sm:rounded-full border border-slate-200 text-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-full font-extrabold transition-all ${
                activeTab === 'all' ? 'bg-[#FF4E00] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả chi phí ({expenses.length})
            </button>
            <button
              onClick={() => setActiveTab('gym')}
              className={`px-3 py-1.5 rounded-full font-extrabold transition-all flex items-center gap-1.5 ${
                activeTab === 'gym' ? 'bg-[#FF4E00] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Dumbbell className="w-3.5 h-3.5" /> Phòng Gym ({expenses.filter(e => e.categoryGroup === 'Phòng gym').length})
            </button>
            <button
              onClick={() => setActiveTab('family')}
              className={`px-3 py-1.5 rounded-full font-extrabold transition-all flex items-center gap-1.5 ${
                activeTab === 'family' ? 'bg-[#FF4E00] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Home className="w-3.5 h-3.5" /> Gia Đình ({expenses.filter(e => e.categoryGroup === 'Gia đình').length})
            </button>
          </div>

          {/* Right: Time Filter & Search Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Period filter */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-slate-200 text-xs">
              <button
                onClick={() => {
                  setTimeFilter('month');
                  setSelectedMonth(currentMonth);
                  setSelectedYear(currentYear);
                }}
                className={`px-3 py-1 rounded-full font-extrabold transition-all flex items-center gap-1 ${
                  timeFilter === 'month' ? 'bg-[#FF4E00] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3 h-3" />
                Tháng {selectedMonth + 1}/{selectedYear}
              </button>
              <button
                onClick={() => {
                  setTimeFilter('year');
                  setSelectedYear(currentYear);
                }}
                className={`px-3 py-1 rounded-full font-extrabold transition-all ${
                  timeFilter === 'year' ? 'bg-[#FF4E00] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Năm {selectedYear}
              </button>
              <button
                onClick={() => setTimeFilter('all')}
                className={`px-3 py-1 rounded-full font-extrabold transition-all ${
                  timeFilter === 'all' ? 'bg-[#FF4E00] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tất cả
              </button>
            </div>

            {/* Custom Month/Year selectors when in month/year mode */}
            {timeFilter === 'month' && (
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-full text-xs">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer pr-1"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={i}>
                      Tháng {i + 1}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
                >
                  {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {timeFilter === 'year' && (
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-full text-xs">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
                >
                  {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map((y) => (
                    <option key={y} value={y}>
                      Năm {y}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Search Bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm hạng mục chi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-100 text-slate-800 text-xs pl-8 pr-3 py-1.5 rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white w-36 sm:w-44 transition-all"
              />
            </div>
          </div>

        </div>

        {/* Filter Summary Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <span>
              Đang hiển thị: <strong className="text-slate-800">{filteredExpenses.length}</strong> khoản chi
            </span>
            <span>•</span>
            <span>
              Bộ lọc: <strong className="text-slate-800">
                {timeFilter === 'month' ? `Tháng ${selectedMonth + 1}/${selectedYear}` : timeFilter === 'year' ? `Năm ${selectedYear}` : 'Toàn bộ thời gian'}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 text-rose-700 px-3 py-1 rounded-full font-bold">
            <span>Tổng chi theo bộ lọc:</span>
            <span className="font-black text-rose-600 text-sm">{formatVnd(filteredTotalAmount)}</span>
          </div>
        </div>

        {/* Table */}
        {filteredExpenses.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm bg-slate-50 rounded-2xl border border-dashed border-slate-200 font-medium">
            Không tìm thấy khoản chi nào phù hợp.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Ngày chi</th>
                  <th className="p-3">Phân loại</th>
                  <th className="p-3">Hạng mục chi</th>
                  <th className="p-3 text-right">Số tiền (VNĐ)</th>
                  <th className="p-3">Ghi chú chi tiết</th>
                  <th className="p-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredExpenses.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono text-slate-500 whitespace-nowrap font-medium">{e.date}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                        e.categoryGroup === 'Phòng gym' ? 'bg-orange-100 text-[#FF4E00]' : 'bg-indigo-100 text-[#4F46E5]'
                      }`}>
                        {e.categoryGroup}
                      </span>
                    </td>
                    <td className="p-3 font-extrabold text-slate-900">{e.category}</td>
                    <td className="p-3 text-right font-black text-rose-600 text-sm">
                      {formatVnd(e.amountVnd)}
                    </td>
                    <td className="p-3 text-slate-500 italic">{e.notes || '-'}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(e)}
                          className="text-indigo-600 hover:text-indigo-800 p-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                          title="Chỉnh sửa khoản chi"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteExpense(e.id)}
                          className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Xóa khoản chi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* ADD EXPENSE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 text-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-lg text-slate-900">+ Thêm Khoản Chi Mới</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Nhóm chi phí *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleGroupChange('Phòng gym')}
                    className={`p-2.5 rounded-2xl font-extrabold text-xs border transition-all flex items-center justify-center gap-2 ${
                      expenseForm.categoryGroup === 'Phòng gym'
                        ? 'bg-[#FF4E00] text-white border-[#FF4E00] shadow-sm'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    <Dumbbell className="w-4 h-4" /> Phòng Gym
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGroupChange('Gia đình')}
                    className={`p-2.5 rounded-2xl font-extrabold text-xs border transition-all flex items-center justify-center gap-2 ${
                      expenseForm.categoryGroup === 'Gia đình'
                        ? 'bg-[#4F46E5] text-white border-[#4F46E5] shadow-sm'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    <Home className="w-4 h-4" /> Gia Đình
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Hạng mục chi *</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="w-full bg-slate-100 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white"
                >
                  {expenseForm.categoryGroup === 'Phòng gym'
                    ? gymCategories.map(c => <option key={c} value={c}>{c}</option>)
                    : familyCategories.map(c => <option key={c} value={c}>{c}</option>)
                  }
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Số tiền (VNĐ) *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={expenseForm.amountVnd ? new Intl.NumberFormat('vi-VN').format(expenseForm.amountVnd) : ''}
                    onChange={(e) => {
                      const digitsOnly = e.target.value.replace(/\D/g, '');
                      setExpenseForm({
                        ...expenseForm,
                        amountVnd: digitsOnly ? parseInt(digitsOnly, 10) : 0
                      });
                    }}
                    placeholder="0"
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-sm text-rose-600 font-black focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                  />
                  {expenseForm.amountVnd > 0 && (
                    <p className="text-[11px] font-extrabold text-rose-500 mt-1">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(expenseForm.amountVnd)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Ngày chi</label>
                  <input
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    className="w-full bg-slate-100 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Ghi chú chi tiết</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Tiền mua thảm tập, tiền điện..."
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  className="w-full bg-slate-100 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
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
                  Lưu Khoản Chi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT EXPENSE MODAL */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 text-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-lg text-slate-900">✏️ Chỉnh Sửa Khoản Chi</h3>
              <button onClick={() => setEditingExpense(null)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateExpense} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Nhóm chi phí *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleEditGroupChange('Phòng gym')}
                    className={`p-2.5 rounded-2xl font-extrabold text-xs border transition-all flex items-center justify-center gap-2 ${
                      editForm.categoryGroup === 'Phòng gym'
                        ? 'bg-[#FF4E00] text-white border-[#FF4E00] shadow-sm'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    <Dumbbell className="w-4 h-4" /> Phòng Gym
                  </button>

                  <button
                    type="button"
                    onClick={() => handleEditGroupChange('Gia đình')}
                    className={`p-2.5 rounded-2xl font-extrabold text-xs border transition-all flex items-center justify-center gap-2 ${
                      editForm.categoryGroup === 'Gia đình'
                        ? 'bg-[#4F46E5] text-white border-[#4F46E5] shadow-sm'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    <Home className="w-4 h-4" /> Gia Đình
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Hạng mục chi *</label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full bg-slate-100 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white"
                >
                  {editForm.categoryGroup === 'Phòng gym'
                    ? gymCategories.map(c => <option key={c} value={c}>{c}</option>)
                    : familyCategories.map(c => <option key={c} value={c}>{c}</option>)
                  }
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Số tiền (VNĐ) *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={editForm.amountVnd ? new Intl.NumberFormat('vi-VN').format(editForm.amountVnd) : ''}
                    onChange={(e) => {
                      const digitsOnly = e.target.value.replace(/\D/g, '');
                      setEditForm({
                        ...editForm,
                        amountVnd: digitsOnly ? parseInt(digitsOnly, 10) : 0
                      });
                    }}
                    placeholder="0"
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-sm text-rose-600 font-black focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                  />
                  {editForm.amountVnd > 0 && (
                    <p className="text-[11px] font-extrabold text-rose-500 mt-1">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(editForm.amountVnd)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Ngày chi</label>
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    className="w-full bg-slate-100 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Ghi chú chi tiết</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Tiền mua thảm tập, tiền điện..."
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full bg-slate-100 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:bg-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-full text-sm font-bold hover:bg-slate-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-full text-sm shadow-md transition-all active:scale-95"
                >
                  Cập Nhật Khoản Chi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
