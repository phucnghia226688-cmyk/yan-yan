import re

with open('src/components/AppointmentsView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace `const date = new Date(dateStr);` inside getWeekDays
# to `const date = parseDateLocal(dateStr);`
content = content.replace("const date = new Date(dateStr);", "const date = parseDateLocal(dateStr);", 1)

# And line 436 `const d = new Date(dateStr);`
content = content.replace("const d = new Date(dateStr);", "const d = parseDateLocal(dateStr);")

with open('src/components/AppointmentsView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
