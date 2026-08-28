import re

with open('src/components/RevenueView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_state = "const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);"
new_state = """const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [renewalReceiptData, setRenewalReceiptData] = useState<RenewalReceiptData | null>(null);

  const handleOpenReceipt = (payment: PaymentRecord) => {
    const payDateFormatted = new Date(payment.paymentDate).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
    setRenewalReceiptData({
      clientName: payment.clientName,
      packageName: payment.packageName,
      amountPaid: payment.amountVnd,
      addedSessions: payment.sessionsCount,
      totalRemainingSessions: (payment.previousState?.remainingSessions || 0) + payment.sessionsCount,
      newExpirationDate: payment.newEndDate ? new Date(payment.newEndDate).toLocaleDateString('vi-VN') : '',
      createdAt: payDateFormatted
    });
  };"""

content = content.replace(old_state, new_state)

with open('src/components/RevenueView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
