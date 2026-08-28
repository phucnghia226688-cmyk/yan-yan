import re

with open('src/components/CheckInView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("import { getTodayDateStr", "import { removeAccents } from '../utils/textUtils';\nimport { getTodayDateStr")

old_filtered = """  const filteredCheckIns = yearlyCheckIns
    .filter(ci => {
      const matchesSearch = ci.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            ci.dayPlanName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (ci.notes && ci.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesClient = selectedClientFilter === 'all' || ci.clientId === selectedClientFilter;"""

new_filtered = """  const filteredCheckIns = yearlyCheckIns
    .filter(ci => {
      const searchNormalized = removeAccents(searchQuery.trim().toLowerCase());
      const nameNormalized = removeAccents(ci.clientName.toLowerCase());
      const planNormalized = removeAccents(ci.dayPlanName.toLowerCase());
      const notesNormalized = ci.notes ? removeAccents(ci.notes.toLowerCase()) : '';
      const matchesSearch = nameNormalized.includes(searchNormalized) || 
                            planNormalized.includes(searchNormalized) ||
                            notesNormalized.includes(searchNormalized);
      const matchesClient = selectedClientFilter === 'all' || ci.clientId === selectedClientFilter;"""

content = content.replace(old_filtered, new_filtered)

with open('src/components/CheckInView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
