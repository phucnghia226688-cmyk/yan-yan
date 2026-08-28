import sys

with open('src/components/ClientManagementView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_detail_badge = "{getWarningBadge(selectedClient)}"
new_detail_badge = """{getWarningBadge(selectedClient)}
                      {getClientTotalPaid(selectedClient.id) === 0 && (
                        <button
                          onClick={() => {
                            setAddPaymentData(prev => ({...prev, amountVnd: 0, paymentDate: new Date().toISOString().split('T')[0]}));
                            setIsAddPaymentModalOpen(true);
                          }}
                          className="font-extrabold text-xs text-rose-700 bg-rose-50 hover:bg-rose-600 hover:text-white px-2.5 py-1 rounded-lg border border-rose-200 shadow-2xs flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                          Bổ sung thanh toán
                        </button>
                      )}"""

content = content.replace(old_detail_badge, new_detail_badge)

with open('src/components/ClientManagementView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated detail header")
