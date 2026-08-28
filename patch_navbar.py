import re

with open('src/components/Navbar.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Import removeAccents
content = content.replace("import { getTodayDateStr } from '../utils/dateUtils';", "import { getTodayDateStr } from '../utils/dateUtils';\nimport { removeAccents } from '../utils/textUtils';")

old_filtered = """  // Instant quick search by name or phone number
  const filteredClients = searchQuery.trim()
    ? clients.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery.trim())
      ).slice(0, 6)
    : [];"""

new_filtered = """  // Instant quick search by name or phone number
  const filteredClients = searchQuery.trim()
    ? clients.filter(c => {
        const searchNormalized = removeAccents(searchQuery.trim().toLowerCase());
        const nameNormalized = removeAccents(c.name.toLowerCase());
        return nameNormalized.includes(searchNormalized) || c.phone.includes(searchQuery.trim());
      }).slice(0, 6)
    : [];"""

content = content.replace(old_filtered, new_filtered)

with open('src/components/Navbar.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
