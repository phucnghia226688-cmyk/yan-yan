import sys
import re

with open('src/components/ClientManagementView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add state variables for Add Payment modal
state_vars = """
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [addPaymentData, setAddPaymentData] = useState({
    amountVnd: 0,
    paymentMethod: 'Chuyển khoản' as 'Tiền mặt' | 'Chuyển khoản' | 'Thẻ',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: 'Bổ sung tiền gói tập do tạo hồ sơ quên nhập'
  });
  const [addPaymentConfirmTarget, setAddPaymentConfirmTarget] = useState<Client | null>(null);

  const getClientTotalPaid = (clientId: string) => {
    return payments.filter(p => p.clientId === clientId && !p.isCancelled).reduce((sum, p) => sum + p.amountVnd, 0);
  };
"""

content = content.replace("const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);", "const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);\n" + state_vars)

# 2. Add the modal rendering inside the file (before the last closing div or inside return)
# We can find `      {/* ADD CLIENT MODAL */}` and insert before it
add_payment_modal_jsx = """
      {/* ADD PAYMENT MODAL */}
      {isAddPaymentModalOpen && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 text-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <h3 className="font-extrabold text-lg text-slate-900">Bổ sung thanh toán</h3>
              <button onClick={() => setIsAddPaymentModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200/60 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const clientIdParts = selectedClient.id.split('-');
              const createdAt = clientIdParts.length > 1 ? parseInt(clientIdParts[1]) : 0;
              const isOlderThan24h = (Date.now() - createdAt) > 24 * 60 * 60 * 1000;
              
              if (isOlderThan24h) {
                setAddPaymentConfirmTarget(selectedClient);
              } else {
                handleExecuteAddPayment(selectedClient);
              }
            }} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Học viên</label>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700">
                  {selectedClient.name} - {selectedClient.packageName}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Số tiền thực thu (VNĐ)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={addPaymentData.amountVnd || ''}
                  onChange={(e) => setAddPaymentData({ ...addPaymentData, amountVnd: Number(e.target.value) })}
                  className="w-full bg-slate-100 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                />
                <div className="text-xs text-indigo-600 font-semibold mt-1">
                  {addPaymentData.amountVnd > 0 ? `= ${addPaymentData.amountVnd.toLocaleString('vi-VN')} VNĐ` : ''}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Phương thức thanh toán</label>
                <select
                  value={addPaymentData.paymentMethod}
                  onChange={(e) => setAddPaymentData({ ...addPaymentData, paymentMethod: e.target.value as any })}
                  className="w-full bg-slate-100 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                >
                  <option value="Chuyển khoản">Chuyển khoản</option>
                  <option value="Tiền mặt">Tiền mặt</option>
                  <option value="Thẻ">Quẹt thẻ (Máy POS)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Ngày thu tiền</label>
                <input
                  type="date"
                  required
                  value={addPaymentData.paymentDate}
                  onChange={(e) => setAddPaymentData({ ...addPaymentData, paymentDate: e.target.value })}
                  className="w-full bg-slate-100 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Ghi chú (Tùy chọn)</label>
                <input
                  type="text"
                  value={addPaymentData.notes}
                  onChange={(e) => setAddPaymentData({ ...addPaymentData, notes: e.target.value })}
                  className="w-full bg-slate-100 text-slate-800 border border-slate-200 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddPaymentModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-full text-sm font-bold hover:bg-slate-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-full text-sm shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
"""

content = content.replace("{/* ADD CLIENT MODAL */}", add_payment_modal_jsx + "\n      {/* ADD CLIENT MODAL */}")

# 3. Add handleExecuteAddPayment function
handle_fn = """
  const handleExecuteAddPayment = (client: Client) => {
    if (addPaymentData.amountVnd <= 0) return;
    
    addPayment({
      clientId: client.id,
      clientName: client.name,
      packageName: client.packageName,
      sessionsCount: 0,
      amountVnd: addPaymentData.amountVnd,
      paymentMethod: addPaymentData.paymentMethod,
      paymentDate: addPaymentData.paymentDate,
      notes: addPaymentData.notes,
      skipSessionUpdate: true // Don't add sessions
    });

    const nowStr = new Date().toLocaleString('vi-VN', { hour12: false });
    updateClient(client.id, {
      actionSummary: `Bổ sung thanh toán ${addPaymentData.amountVnd.toLocaleString('vi-VN')}đ`,
      actionType: 'edit'
    });

    setIsAddPaymentModalOpen(false);
    setAddPaymentConfirmTarget(null);
  };
"""
# insert before `const handleUpdateClient = `
content = content.replace("const handleUpdateClient = ", handle_fn + "\n  const handleUpdateClient = ")

# 4. Add ConfirmPasswordModal usage for addPayment
password_modal_jsx = """
      <ConfirmPasswordModal
        isOpen={!!addPaymentConfirmTarget}
        title="Xác Nhận Mật Khẩu Admin"
        description="Hồ sơ học viên này đã được tạo quá 24h. Vui lòng nhập mật khẩu admin để bổ sung thanh toán."
        confirmLabel="Xác nhận bổ sung"
        onClose={() => setAddPaymentConfirmTarget(null)}
        onConfirm={() => {
          if (addPaymentConfirmTarget) {
            handleExecuteAddPayment(addPaymentConfirmTarget);
          }
        }}
      />
"""
content = content.replace("</ConfirmPasswordModal>", "</ConfirmPasswordModal>\n" + password_modal_jsx)

# 5. UI elements: Add the button to update payment in Client List (Horizontal table and Split Grid) and in Detail Header
# For Horizontal Table
table_row_old = """<td className="py-3 px-3 text-center border-r border-slate-200 whitespace-nowrap">
                          {getWarningBadge(client)}
                        </td>"""
table_row_new = """<td className="py-3 px-3 text-center border-r border-slate-200 whitespace-nowrap">
                          {getWarningBadge(client)}
                          {getClientTotalPaid(client.id) === 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedClient(client);
                                setAddPaymentData(prev => ({...prev, amountVnd: 0, paymentDate: new Date().toISOString().split('T')[0]}));
                                setIsAddPaymentModalOpen(true);
                              }}
                              className="block mx-auto mt-1 px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-bold rounded border border-rose-200 transition-colors"
                            >
                              Thu tiền
                            </button>
                          )}
                        </td>"""
content = content.replace(table_row_old, table_row_new)

# For Split Grid (Mobile friendly cards)
card_old = """                      {getWarningBadge(client)}
                      <div className="flex items-center gap-1 flex-wrap justify-end">"""
card_new = """                      {getWarningBadge(client)}
                      {getClientTotalPaid(client.id) === 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedClient(client);
                            setAddPaymentData(prev => ({...prev, amountVnd: 0, paymentDate: new Date().toISOString().split('T')[0]}));
                            setIsAddPaymentModalOpen(true);
                          }}
                          className="text-[10px] bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 font-bold px-2 py-0.5 rounded-full border border-rose-200 transition-colors flex items-center gap-0.5 cursor-pointer"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                          Thu tiền
                        </button>
                      )}
                      <div className="flex items-center gap-1 flex-wrap justify-end">"""
content = content.replace(card_old, card_new)

with open('src/components/ClientManagementView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated successfully")
