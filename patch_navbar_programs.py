import re

with open('src/components/Navbar.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r"\s*\{\s*id:\s*'programs',\s*label:\s*'Giáo án tập luyện',\s*icon:\s*ClipboardList\s*\},", "", content)

with open('src/components/Navbar.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
