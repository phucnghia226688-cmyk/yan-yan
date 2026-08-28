import re

with open('src/components/CheckInView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("({clients.length})", "({clients.filter(c => c.status !== 'closed').length})")

with open('src/components/CheckInView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
