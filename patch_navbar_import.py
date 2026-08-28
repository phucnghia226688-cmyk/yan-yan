import re

with open('src/components/Navbar.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

if 'import { ' in content and 'lucide-react' in content:
    if 'Clock' not in content.split('lucide-react')[0]:
        content = content.replace("import {", "import { Clock,", 1)

with open('src/components/Navbar.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
