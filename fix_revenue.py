import re

with open('src/components/RevenueView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

import_stmt = "import { getTodayDateStr } from '../utils/dateUtils';\n"
if "getTodayDateStr" not in content:
    content = content.replace("import React,", import_stmt + "import React,")

content = content.replace("new Date().toISOString().split('T')[0]", "getTodayDateStr()")

with open('src/components/RevenueView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
