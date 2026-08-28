import re

with open('src/components/ClientManagementView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("const codeHV = `HV-${1000 + (clients.length - idx)}`;", 
"""const originalIdx = clients.findIndex(c => c.id === client.id);
                const codeHV = `HV-${1000 + (clients.length - (originalIdx !== -1 ? originalIdx : idx))}`;""")

with open('src/components/ClientManagementView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
