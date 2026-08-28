import re

with open('src/context/GymContext.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

import_stmt = "import { getTodayDateStr, parseDateLocal } from '../utils/dateUtils';\n"
if "parseDateLocal" not in content:
    content = content.replace("import { getTodayDateStr } from '../utils/dateUtils';", import_stmt)

old_start1 = "const startD = newClientData.startDate ? new Date(newClientData.startDate) : new Date();"
new_start1 = "const startD = newClientData.startDate ? parseDateLocal(newClientData.startDate) : new Date();"
content = content.replace(old_start1, new_start1)

old_start2 = "const startD = newClientData.startDate ? new Date(newClientData.startDate) : new Date();"
new_start2 = "const startD = newClientData.startDate ? parseDateLocal(newClientData.startDate) : new Date();"
content = content.replace(old_start2, new_start2)

# There's another place at line 898 maybe? Let's use regex
content = re.sub(r'const startD = ([a-zA-Z0-9_.]+)\.startDate \? new Date\(\1\.startDate\) : new Date\(\);', r'const startD = \1.startDate ? parseDateLocal(\1.startDate) : new Date();', content)

with open('src/context/GymContext.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
