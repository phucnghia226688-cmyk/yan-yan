import re

with open('src/components/ClientManagementView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_code = """      )}

    </div>
  );
};"""

new_code = """      )}

      {/* RENEWAL RECEIPT MODAL */}
      <RenewalReceiptModal 
        isOpen={!!renewalReceiptData}
        onClose={() => setRenewalReceiptData(null)}
        receiptData={renewalReceiptData}
      />

    </div>
  );
};"""

content = content.replace(old_code, new_code)

with open('src/components/ClientManagementView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
