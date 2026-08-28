import re

with open('src/components/DashboardView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

import_stmt = "import { getTodayDateStr, getVNDate } from '../utils/dateUtils';\n"
if "getVNDate" not in content:
    content = content.replace("import { getTodayDateStr } from '../utils/dateUtils';", import_stmt)

content = content.replace("const today = new Date();", "const today = getVNDate();")
content = content.replace("const now = new Date();", "const now = getVNDate();")

with open('src/components/DashboardView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
