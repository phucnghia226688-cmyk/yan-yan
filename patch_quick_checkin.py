import re

with open('src/components/QuickCheckInModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("import { getTodayDateStr } from '../utils/dateUtils';", "import { getTodayDateStr } from '../utils/dateUtils';\nimport { removeAccents } from '../utils/textUtils';")

old_filtered = """  const filteredClients = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.phone.includes(searchQuery.trim());
    if (!matchesSearch) return false;"""

new_filtered = """  const filteredClients = clients.filter(c => {
    const searchNormalized = removeAccents(searchQuery.trim().toLowerCase());
    const nameNormalized = removeAccents(c.name.toLowerCase());
    const matchesSearch = nameNormalized.includes(searchNormalized) || c.phone.includes(searchQuery.trim());
    if (!matchesSearch) return false;"""

content = content.replace(old_filtered, new_filtered)

with open('src/components/QuickCheckInModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
