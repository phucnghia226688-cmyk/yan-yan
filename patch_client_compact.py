import re

with open('src/components/ClientManagementView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Regex to remove the Gia Hạn Banner entirely
banner_pattern = r'\{\/\*\s*Gia Hạn Banner\s*\*\/\}.*?<div className="grid grid-cols-2 lg:grid-cols-4 gap-2">'
# Just replace it up to the start of the grid
content = re.sub(
    r'\{\/\*\s*Gia Hạn Banner\s*\*\/\}.*?(<div className="grid grid-cols-2 lg:grid-cols-4 gap-2">)',
    r'\1',
    content,
    flags=re.DOTALL
)

# 2. Regex to replace the 4 stat cards grid with the compact flex pills
grid_pattern = r'<div className="grid grid-cols-2 lg:grid-cols-4 gap-2">.*?</p>\s*</div>\s*</div>'
compact_html = """<div className="flex flex-wrap items-center gap-2">
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
                    </div>"""
content = re.sub(grid_pattern, compact_html, content, flags=re.DOTALL)

with open('src/components/ClientManagementView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
