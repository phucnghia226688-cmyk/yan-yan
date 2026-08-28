import re

with open('src/components/ExpensesView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add timeFilter state
content = content.replace("const [activeTab, setActiveTab] = useState<'all' | 'gym' | 'family'>('all');", "const [activeTab, setActiveTab] = useState<'all' | 'gym' | 'family'>('all');\n  const [timeFilter, setTimeFilter] = useState<'month' | 'year' | 'all'>('month');")

# Update filtering logic
old_filter = """  // Filter expenses
  const filteredExpenses = expenses.filter(e => {
    const matchesGroup = activeTab === 'all' 
      ? true 
      : activeTab === 'gym' ? e.categoryGroup === 'Phòng gym' : e.categoryGroup === 'Gia đình';

    const searchNormalized = removeAccents(searchQuery.trim().toLowerCase());
    const categoryNormalized = removeAccents(e.category.toLowerCase());
    const notesNormalized = e.notes ? removeAccents(e.notes.toLowerCase()) : '';
    const matchesSearch = categoryNormalized.includes(searchNormalized) || notesNormalized.includes(searchNormalized);

    return matchesGroup && matchesSearch;
  });"""

new_filter = """  // Filter expenses
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
      matchesTime = d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    } else if (timeFilter === 'year') {
      matchesTime = d.getFullYear() === currentYear;
    }

    return matchesGroup && matchesSearch && matchesTime;
  });"""

content = content.replace(old_filter, new_filter)

# Update totals
old_totals = """  // Calculate totals
  const gymExpensesTotalMonth = expenses
    .filter(e => {
      const d = new Date(e.date);
      return e.categoryGroup === 'Phòng gym' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, e) => sum + e.amountVnd, 0);

  const familyExpensesTotalMonth = expenses
    .filter(e => {
      const d = new Date(e.date);
      return e.categoryGroup === 'Gia đình' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, e) => sum + e.amountVnd, 0);

  const grandTotalMonth = gymExpensesTotalMonth + familyExpensesTotalMonth;"""

new_totals = """  // Calculate totals (Gym)
  const gymTotalMonth = expenses.filter(e => e.categoryGroup === 'Phòng gym' && new Date(e.date).getMonth() === currentMonth && new Date(e.date).getFullYear() === currentYear).reduce((sum, e) => sum + e.amountVnd, 0);
  const gymTotalYear = expenses.filter(e => e.categoryGroup === 'Phòng gym' && new Date(e.date).getFullYear() === currentYear).reduce((sum, e) => sum + e.amountVnd, 0);
  const gymTotalAll = expenses.filter(e => e.categoryGroup === 'Phòng gym').reduce((sum, e) => sum + e.amountVnd, 0);

  // Calculate totals (Family)
  const familyTotalMonth = expenses.filter(e => e.categoryGroup === 'Gia đình' && new Date(e.date).getMonth() === currentMonth && new Date(e.date).getFullYear() === currentYear).reduce((sum, e) => sum + e.amountVnd, 0);
  const familyTotalYear = expenses.filter(e => e.categoryGroup === 'Gia đình' && new Date(e.date).getFullYear() === currentYear).reduce((sum, e) => sum + e.amountVnd, 0);
  const familyTotalAll = expenses.filter(e => e.categoryGroup === 'Gia đình').reduce((sum, e) => sum + e.amountVnd, 0);

  const grandTotalMonth = gymTotalMonth + familyTotalMonth;
  const grandTotalYear = gymTotalYear + familyTotalYear;
  const grandTotalAll = gymTotalAll + familyTotalAll;"""

content = content.replace(old_totals, new_totals)


# Update cards
old_cards = """      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Gym Expenses */}
        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-2 text-[#FF4E00] text-xs font-extrabold uppercase tracking-wider">
            <Dumbbell className="w-4 h-4" /> Chi Phí Phòng Gym (Tháng {currentMonth + 1})
          </div>
          <p className="text-2xl font-black text-[#FF4E00] mt-2">{formatVnd(gymExpensesTotalMonth)}</p>
          <p className="text-xs text-slate-500 mt-1 font-medium">Mặt bằng, điện nước, marketing, dụng cụ</p>
        </div>

        {/* Family Expenses */}
        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-2 text-[#4F46E5] text-xs font-extrabold uppercase tracking-wider">
            <Home className="w-4 h-4" /> Chi Phí Gia Đình (Tháng {currentMonth + 1})
          </div>
          <p className="text-2xl font-black text-[#4F46E5] mt-2">{formatVnd(familyExpensesTotalMonth)}</p>
          <p className="text-xs text-slate-500 mt-1 font-medium">Ăn uống, học phí, mua sắm, xăng xe</p>
        </div>

        {/* Total Expenses */}
        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-2 text-rose-600 text-xs font-extrabold uppercase tracking-wider">
            <Wallet className="w-4 h-4" /> Tổng Chi Ra Tháng {currentMonth + 1}
          </div>
          <p className="text-2xl font-black text-rose-600 mt-2">{formatVnd(grandTotalMonth)}</p>
          <p className="text-xs text-slate-500 mt-1 font-medium">Tổng cộng cả Gym + Gia đình</p>
        </div>

      </div>"""

new_cards = """      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
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

      </div>"""

content = content.replace(old_cards, new_cards)

# Add time filter to the tabs section
old_tabs_section = """        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          
          {/* Group Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-slate-200 text-xs">
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
              <Dumbbell className="w-3.5 h-3.5" /> Gym
            </button>
            <button
              onClick={() => setActiveTab('family')}
              className={`px-3 py-1.5 rounded-full font-extrabold transition-all flex items-center gap-1.5 ${
                activeTab === 'family' ? 'bg-[#4F46E5] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Home className="w-3.5 h-3.5" /> Gia đình
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm hạng mục, ghi chú..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF4E00] focus:bg-white transition-all"
            />
          </div>

        </div>"""

new_tabs_section = """        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Time Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-slate-200 text-xs shrink-0">
              <button
                onClick={() => setTimeFilter('month')}
                className={`px-3 py-1.5 rounded-full font-extrabold transition-all ${
                  timeFilter === 'month' ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tháng này
              </button>
              <button
                onClick={() => setTimeFilter('year')}
                className={`px-3 py-1.5 rounded-full font-extrabold transition-all ${
                  timeFilter === 'year' ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Năm nay
              </button>
              <button
                onClick={() => setTimeFilter('all')}
                className={`px-3 py-1.5 rounded-full font-extrabold transition-all ${
                  timeFilter === 'all' ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tất cả
              </button>
            </div>

            {/* Group Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-slate-200 text-xs shrink-0">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-full font-extrabold transition-all ${
                  activeTab === 'all' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tất cả nhóm
              </button>
              <button
                onClick={() => setActiveTab('gym')}
                className={`px-3 py-1.5 rounded-full font-extrabold transition-all flex items-center gap-1.5 ${
                  activeTab === 'gym' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Dumbbell className="w-3.5 h-3.5" /> Gym
              </button>
              <button
                onClick={() => setActiveTab('family')}
                className={`px-3 py-1.5 rounded-full font-extrabold transition-all flex items-center gap-1.5 ${
                  activeTab === 'family' ? 'bg-[#4F46E5] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Home className="w-3.5 h-3.5" /> Gia đình
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-64 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm hạng mục, ghi chú..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
            />
          </div>

        </div>"""

content = content.replace(old_tabs_section, new_tabs_section)

with open('src/components/ExpensesView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
