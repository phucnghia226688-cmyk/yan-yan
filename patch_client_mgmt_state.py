import re

with open('src/components/ClientManagementView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("const [renewClient, setRenewClient] = useState<Client | null>(null);", 
"const [renewClient, setRenewClient] = useState<Client | null>(null);\n  const [renewalReceiptData, setRenewalReceiptData] = useState<RenewalReceiptData | null>(null);")

with open('src/components/ClientManagementView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
