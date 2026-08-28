import re

with open('src/components/RevenueView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("import { PaymentRecord } from '../types';", 
"import { PaymentRecord } from '../types';\nimport { RenewalReceiptModal, RenewalReceiptData } from './RenewalReceiptModal';\nimport { ImageIcon } from 'lucide-react';")

with open('src/components/RevenueView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
