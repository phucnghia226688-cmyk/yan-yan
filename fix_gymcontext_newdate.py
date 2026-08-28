import re

with open('src/context/GymContext.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

import_stmt = "import { getTodayDateStr, parseDateLocal, getVNDate } from '../utils/dateUtils';\n"
content = content.replace("import { getTodayDateStr, parseDateLocal } from '../utils/dateUtils';", import_stmt)

content = content.replace("parseDateLocal(newClientData.startDate) : new Date()", "parseDateLocal(newClientData.startDate) : getVNDate()")
content = content.replace("const startD = new Date();", "const startD = getVNDate();")

with open('src/context/GymContext.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
