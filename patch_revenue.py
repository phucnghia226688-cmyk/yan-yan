import re

with open('src/components/RevenueView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("import { getTodayDateStr }", "import { getTodayDateStr } from '../utils/dateUtils';\nimport { removeAccents }")

old_filtered = """    const matchesSearch = p.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.packageName.toLowerCase().includes(searchQuery.toLowerCase());"""

new_filtered = """    const searchNormalized = removeAccents(searchQuery.trim().toLowerCase());
    const nameNormalized = removeAccents(p.clientName.toLowerCase());
    const packageNormalized = removeAccents(p.packageName.toLowerCase());
    const matchesSearch = nameNormalized.includes(searchNormalized) || packageNormalized.includes(searchNormalized);"""

content = content.replace(old_filtered, new_filtered)

with open('src/components/RevenueView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
