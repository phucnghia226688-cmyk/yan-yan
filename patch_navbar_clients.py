import re

with open('src/components/Navbar.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_code = """        { id: 'clients', label: 'Học viên', icon: Users, badge: clients.length },"""
new_code = """        { id: 'clients', label: 'Học viên', icon: Users, badge: clients.filter(c => c.status !== 'closed').length },"""

content = content.replace(old_code, new_code)

with open('src/components/Navbar.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
