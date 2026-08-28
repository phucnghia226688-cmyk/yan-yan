import re

with open('src/components/ClientManagementView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

import_stmt = "import { getTodayDateStr } from '../utils/dateUtils';\n"
if "getTodayDateStr" not in content:
    content = content.replace("import React,", import_stmt + "import React,")

# also need to replace `today.toISOString().split('T')[0]`
content = content.replace("new Date().toISOString().split('T')[0]", "getTodayDateStr()")
content = content.replace("today.toISOString().split('T')[0]", "getTodayDateStr()")

with open('src/components/ClientManagementView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
