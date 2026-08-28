import re

with open('src/components/AppointmentsView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("/ {clients.length} HV", "/ {clients.filter(c => c.status !== 'closed').length} HV")

with open('src/components/AppointmentsView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
