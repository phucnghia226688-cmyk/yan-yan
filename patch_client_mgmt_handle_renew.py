import re

with open('src/components/ClientManagementView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_code = """    if (selectedClient && selectedClient.id === renewClient.id) {
      setSelectedClient({
        ...selectedClient,
        packageName: renewFormData.packageName,
        remainingSessions: newRemaining,
        totalSessions: newTotal,
        endDate: renewFormData.newEndDate,
        status: 'active'
      });
    }

    setIsRenewModalOpen(false);
  };"""

new_code = """    if (selectedClient && selectedClient.id === renewClient.id) {
      setSelectedClient({
        ...selectedClient,
        packageName: renewFormData.packageName,
        remainingSessions: newRemaining,
        totalSessions: newTotal,
        endDate: renewFormData.newEndDate,
        status: 'active'
      });
    }

    const payDateFormatted = new Date(renewFormData.paymentDate).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
    const nowTime = new Date().toLocaleTimeString('vi-VN', {
      hour: '2-digit', minute: '2-digit'
    });

    setRenewalReceiptData({
      clientName: renewClient.name,
      packageName: renewFormData.packageName,
      amountPaid: payAmount,
      addedSessions: addSessions,
      totalRemainingSessions: newRemaining,
      newExpirationDate: renewFormData.newEndDate ? new Date(renewFormData.newEndDate).toLocaleDateString('vi-VN') : '',
      createdAt: `${payDateFormatted} ${nowTime}`
    });

    setIsRenewModalOpen(false);
  };"""

content = content.replace(old_code, new_code)

with open('src/components/ClientManagementView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
