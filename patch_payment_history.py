import re

with open('src/components/ClientManagementView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

payment_history_html = """                      <div className="pt-3 border-t border-slate-200">
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
                                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.amountVnd)}
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
                          <Clock className="w-4 h-4 text-indigo-600" /> Chi Tiết Lịch Sử Chỉnh Sửa, Gia Hạn & Thay Đổi Hồ Sơ"""

pattern = r'<div className="pt-3 border-t border-slate-200">\s*<h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">\s*<Clock className="w-4 h-4 text-indigo-600" /> Chi Tiết Lịch Sử Chỉnh Sửa, Gia Hạn & Thay Đổi Hồ Sơ'

content = re.sub(pattern, payment_history_html, content, count=1)

with open('src/components/ClientManagementView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
