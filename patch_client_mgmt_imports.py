import re

with open('src/components/ClientManagementView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("import { CheckInReceiptModal, CheckInReceiptData } from './CheckInReceiptModal';", 
"import { CheckInReceiptModal, CheckInReceiptData } from './CheckInReceiptModal';\nimport { RenewalReceiptModal, RenewalReceiptData } from './RenewalReceiptModal';")

with open('src/components/ClientManagementView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
