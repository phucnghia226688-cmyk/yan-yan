import re

with open('src/components/ClientManagementView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("import { getTodayDateStr", "import { removeAccents } from '../utils/textUtils';\nimport { getTodayDateStr")

old_filtered = """    .filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery.trim());
      if (statusFilter === 'all') return matchesSearch && c.status !== 'closed';
      return matchesSearch && c.status === statusFilter;
    })"""

new_filtered = """    .filter(c => {
      const searchNormalized = removeAccents(searchQuery.trim().toLowerCase());
      const nameNormalized = removeAccents(c.name.toLowerCase());
      const matchesSearch = nameNormalized.includes(searchNormalized) || c.phone.includes(searchQuery.trim());
      if (statusFilter === 'all') return matchesSearch && c.status !== 'closed';
      return matchesSearch && c.status === statusFilter;
    })"""

content = content.replace(old_filtered, new_filtered)

with open('src/components/ClientManagementView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
