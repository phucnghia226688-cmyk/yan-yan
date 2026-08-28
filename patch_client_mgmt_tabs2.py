import re

with open('src/components/ClientManagementView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove Tab 5 Content completely
content = re.sub(
    r"""\s*\{\/\* TAB 5: WORKOUT PROGRAM LINK \*\/\}\s*\{activeDetailTab === 'program' && \(.*?\)\s*\}\s*(?=\{\/\* RENEW MODAL \*\/)""",
    "\n                ",
    content,
    flags=re.DOTALL
)

with open('src/components/ClientManagementView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
