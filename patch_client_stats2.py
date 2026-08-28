import re

with open('src/components/ClientManagementView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(r'<div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">.*?</p>\s*</div>\s*</div>', re.DOTALL)

new_stats = """<div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                      <div className="p-3 bg-white border border-slate-200/80 rounded-xl shadow-xs relative group hover:border-indigo-300 transition-all flex flex-col justify-center">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gói & Số Buổi</p>
                          <button
                            onClick={() => openEditModal(selectedClient)}
                            className="p-0.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all cursor-pointer"
                            title="Chỉnh sửa gói tập & số buổi"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-slate-500 hover:text-indigo-600" />
                          </button>
                        </div>
                        <p className="text-[13px] font-extrabold text-indigo-900 line-clamp-1" title={selectedClient.packageName || (selectedClient.clientType === 'monthly' ? 'Gói Khách Tháng' : 'Gói PT')}>
                          {selectedClient.packageName || (selectedClient.clientType === 'monthly' ? 'Gói Khách Tháng' : 'Gói PT')}
                        </p>
                        {selectedClient.clientType === 'monthly' ? (
                          <p className="text-xs font-black text-amber-700 mt-0.5">
                            Thẻ Tháng (Đến {selectedClient.endDate || '---'})
                          </p>
                        ) : (
                          <p className="text-base font-black text-emerald-600 leading-tight mt-0.5">
                            {selectedClient.remainingSessions} <span className="text-[11px] text-slate-400 font-bold">/ {selectedClient.totalSessions} buổi</span>
                          </p>
                        )}
                      </div>
                      
                      <div className="p-3 bg-white border border-slate-200/80 rounded-xl shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-center">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Check-in Gần Nhất</p>
                        <p className="text-sm font-black text-indigo-600 mt-auto">
                          {clientCheckIns.length > 0
                            ? new Date(clientCheckIns[0].timestamp).toLocaleString('vi-VN', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : 'Chưa check-in'}
                        </p>
                      </div>

                      <div className="p-3 bg-white border border-slate-200/80 rounded-xl shadow-xs relative group hover:border-indigo-300 transition-all flex flex-col justify-center">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bắt Đầu - Hạn HĐ</p>
                          <button
                            onClick={() => openEditModal(selectedClient)}
                            className="p-0.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all cursor-pointer"
                            title="Chỉnh sửa thời hạn hợp đồng"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-slate-500 hover:text-indigo-600" />
                          </button>
                        </div>
                        <p className="text-[13px] font-bold text-slate-900 flex flex-wrap items-center gap-1 mt-auto">
                          <span>{selectedClient.startDate}</span>
                          <span className="text-slate-400 text-[10px]">→</span>
                          <span className="text-amber-700 font-extrabold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 text-[11px]">
                            {selectedClient.endDate}
                          </span>
                        </p>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col justify-center">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Trạng Thái HĐ</p>
                          <button
                            onClick={() => openEditModal(selectedClient)}
                            className="p-0.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all cursor-pointer"
                            title="Chỉnh sửa trạng thái hợp đồng"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-slate-500 hover:text-indigo-600" />
                          </button>
                        </div>
                        <p className="text-[13px] font-black text-[#FF4E00] uppercase mt-auto">
                          {selectedClient.status === 'active' ? 'ĐANG TẬP' : selectedClient.status === 'expiring' ? 'SẮP HẾT HẠN' : selectedClient.status === 'expired' ? 'ĐÃ HẾT HẠN' : selectedClient.status === 'paused' ? 'BẢO LƯU' : selectedClient.status}
                        </p>
                      </div>
                    </div>"""

content = pattern.sub(new_stats, content, count=1)

with open('src/components/ClientManagementView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
