import re

with open('src/components/ClientManagementView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

import_stmt = "import { getTodayDateStr, getVNDate, parseDateLocal } from '../utils/dateUtils';\n"
if "parseDateLocal" not in content:
    content = content.replace("import { getTodayDateStr, getVNDate } from '../utils/dateUtils';", import_stmt)

# new Date(p.paymentDate).toLocaleDateString('vi-VN') -> parseDateLocal(p.paymentDate).toLocaleDateString('vi-VN')
content = content.replace("new Date(p.paymentDate).toLocaleDateString('vi-VN')", "parseDateLocal(p.paymentDate).toLocaleDateString('vi-VN')")

with open('src/components/ClientManagementView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
