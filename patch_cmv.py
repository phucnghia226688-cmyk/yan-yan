import re

with open('src/components/ClientManagementView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

import_stmt = "import { getTodayDateStr, getVNDate } from '../utils/dateUtils';\n"
if "getVNDate" not in content:
    content = content.replace("import { getTodayDateStr } from '../utils/dateUtils';", import_stmt)

content = content.replace("new Date().toLocaleString", "getVNDate().toLocaleString")

# and there might be `const today = new Date();`
content = content.replace("const today = new Date();", "const today = getVNDate();")

with open('src/components/ClientManagementView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
