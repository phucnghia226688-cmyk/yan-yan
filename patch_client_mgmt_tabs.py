import re

with open('src/components/ClientManagementView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove Tab 5 Button
content = re.sub(
    r"""\s*<button\s*onClick=\{\(\) => setActiveDetailTab\('program'\)\}.*?Giáo án tập\s*</button>""",
    "",
    content,
    flags=re.DOTALL
)

# Remove Tab 5 Content
content = re.sub(
    r"""\s*\{\/\* TAB 5: WORKOUT PROGRAM \*\/\}\s*\{activeDetailTab === 'program' && \(.*?\)\s*\}\s*\{\/\* RENEW MODAL \*\/\}""",
    "\n                {/* RENEW MODAL */}",
    content,
    flags=re.DOTALL
)

with open('src/components/ClientManagementView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
