import re

with open('src/services/googleSheetsService.ts', 'r', encoding='utf-8') as f:
    content = f.read()

import_stmt = "import { getVNDate } from '../utils/dateUtils';\n"
if "getVNDate" not in content:
    content = import_stmt + content

content = content.replace("new Date().toLocaleString", "getVNDate().toLocaleString")

with open('src/services/googleSheetsService.ts', 'w', encoding='utf-8') as f:
    f.write(content)
