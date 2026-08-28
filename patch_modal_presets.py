import re

with open('src/components/QuickCheckInModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove currentProgram
content = re.sub(
    r"\s*const currentProgram = activeClient\s*\? programs\.find\(p => p\.clientId === activeClient\.id \|\| p\.id === activeClient\.workoutProgramId\)\s*: null;",
    "",
    content
)

old_day_plan = """                  {/* Day Plan Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      3. Bài tập / Lịch tập ngày check-in
                    </label>
                    
                    {currentProgram ? (
                      <select
                        value={dayPlanName}
                        onChange={(e) => setDayPlanName(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                      >
                        {currentProgram.days.map(d => (
                          <option key={d.id} value={d.dayName}>
                            {d.dayName} ({d.exercises.length} bài)
                          </option>
                        ))}
                        <option value="Buổi tập bổ trợ / Khác">Buổi tập bổ trợ / Khác</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={dayPlanName}
                        onChange={(e) => setDayPlanName(e.target.value)}
                        placeholder="Nhập tên buổi tập (Ví dụ: Day 1 - Leg Day)"
                        className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                      />
                    )}
                  </div>"""

new_day_plan = """                  {/* Day Plan Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                      <Dumbbell className="w-3.5 h-3.5 text-indigo-600" />
                      3. Bài tập / Lịch tập ngày check-in
                    </label>
                    
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {['Ngực - Tay Sau', 'Lưng - Tay Trước', 'Chân - Mông', 'Vai - Bụng', 'Cardio', 'Tập Toàn Thân'].map(preset => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setDayPlanName(preset)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                            dayPlanName === preset
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      value={dayPlanName}
                      onChange={(e) => setDayPlanName(e.target.value)}
                      placeholder="Hoặc nhập tên bài tập (Ví dụ: Leg Day...)"
                      className="w-full bg-white border border-slate-200 text-slate-800 text-sm rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                    />
                  </div>"""

content = content.replace(old_day_plan, new_day_plan)

with open('src/components/QuickCheckInModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
