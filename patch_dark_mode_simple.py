import re

with open('src/index.css', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace body background
content = content.replace("background-color: #0b0f19 !important; /* Deep dark slate-950 */", "background-color: #18191A !important;")
content = content.replace("color: #f8fafc !important;", "color: #E4E6EB !important;")

# Replace card background
content = content.replace("background-color: #1a2234 !important; /* Elegant midnight card background */", "background-color: #242526 !important;")

# Replace inputs
content = content.replace("background-color: #0f172a !important;", "background-color: #3A3B3C !important;")
content = content.replace("border-color: #334155 !important;", "border-color: #3A3B3C !important;")

# Tables
content = content.replace("background-color: #0f172a !important;", "background-color: #242526 !important;")
content = content.replace("background-color: #283548 !important;", "background-color: #3A3B3C !important;")

# Scrollbar
content = content.replace("background: #0b0f19;", "background: #18191A;")
content = content.replace("background: #334155;", "background: #3A3B3C;")
content = content.replace("background: #475569;", "background: #505050;")

with open('src/index.css', 'w', encoding='utf-8') as f:
    f.write(content)
