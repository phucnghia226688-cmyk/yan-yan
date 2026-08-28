import re

with open('src/components/DashboardView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("{clients.length} học viên", "{clients.filter(c => c.status !== 'closed').length} học viên")
content = content.replace("/ tổng {clients.length} khách", "/ tổng {clients.filter(c => c.status !== 'closed').length} khách")

with open('src/components/DashboardView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
