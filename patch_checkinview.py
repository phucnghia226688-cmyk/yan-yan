import re

with open('src/components/CheckInView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

import_stmt = "import { getTodayDateStr, getVNDate, getVNDayOfWeek, getVNDateStr } from '../utils/dateUtils';\n"
if "getVNDayOfWeek" not in content:
    content = content.replace("import { getTodayDateStr } from '../utils/dateUtils';", import_stmt)

# todayDayOfWeek
content = content.replace("const todayDayOfWeek = new Date().getDay();", "const todayDayOfWeek = getVNDayOfWeek();")

# todayStrDate
content = content.replace("const todayStrDate = new Date().toDateString();", "const todayStrDate = getVNDate().toDateString();")
content = content.replace("new Date(ci.timestamp).toDateString()", "getVNDate(ci.timestamp).toDateString()")

# todayStr
content = content.replace("const todayStr = new Date().toLocaleDateString('vi-VN', {", "const todayStr = getVNDate().toLocaleDateString('vi-VN', {")

# replace simple new Date() 
# Wait, let's keep `new Date(ci.timestamp).getTime()` for sorting, it's safe.
# But for `const oneYearAgo = new Date(); oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);`, it's also okay.

with open('src/components/CheckInView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
