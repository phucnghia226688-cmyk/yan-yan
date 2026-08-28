import re

with open('src/components/ClientManagementView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add state variables near `const [cancelCheckInTarget, setCancelCheckInTarget] = useState...`
state_vars = """  const [cancelCheckInTarget, setCancelCheckInTarget] = useState<{id: string, clientName: string} | null>(null);
  const [editCheckInTarget, setEditCheckInTarget] = useState<any | null>(null);
  const [editCheckInPlanName, setEditCheckInPlanName] = useState('');"""

content = content.replace("const [cancelCheckInTarget, setCancelCheckInTarget] = useState<{id: string, clientName: string} | null>(null);", state_vars)

# Add Edit button in the card
card_old = """                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-3 py-1 rounded-full border border-emerald-200">
                                Trừ 1 buổi (còn {ci.sessionsRemainingAfter})
                              </span>
                              <button
                                onClick={() => setCancelCheckInTarget({ id: ci.id, clientName: selectedClient?.name || '' })}"""

card_new = """                            <div className="flex items-center gap-2">
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
                                onClick={() => setCancelCheckInTarget({ id: ci.id, clientName: selectedClient?.name || '' })}"""

content = content.replace(card_old, card_new)


# Add Modal HTML near `cancelCheckInTarget` modal
modal_old = """      {/* Password Confirmation Modal for Cancel Check-in */}"""
modal_new = """      {/* Sửa Tên Buổi Tập Check-in Modal */}
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

      {/* Password Confirmation Modal for Cancel Check-in */}"""

content = content.replace(modal_old, modal_new)

# Add updateCheckIn to destructured useGym
use_gym_old = "const { clients, addClient, updateClient, deleteClient, addBodyMetric, addPayment, updatePayment, deletePayment, checkIns, cancelCheckIn, programs, payments } = useGym();"
use_gym_new = "const { clients, addClient, updateClient, deleteClient, addBodyMetric, addPayment, updatePayment, deletePayment, checkIns, cancelCheckIn, updateCheckIn, programs, payments } = useGym();"
content = content.replace(use_gym_old, use_gym_new)

with open('src/components/ClientManagementView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

