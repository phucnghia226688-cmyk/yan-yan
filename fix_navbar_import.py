import re

with open('src/components/Navbar.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("import { Clock, getTodayDateStr }", "import { getTodayDateStr }")

# find lucide-react import
pattern = r'(import\s+\{)([^}]*)(\}\s+from\s+[\'"]lucide-react[\'"])'
def repl(m):
    return m.group(1) + " Clock, " + m.group(2) + m.group(3)

content = re.sub(pattern, repl, content)

with open('src/components/Navbar.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
