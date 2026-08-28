import re

with open('src/components/AppointmentsView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace block 1
content = content.replace("""<div className="flex items-center gap-3 mt-3">
                      <img
                        src={apt.clientAvatar || client?.avatarUrl || DEFAULT_AVATAR_URL}""", """<div className="flex items-center gap-3 mt-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => client && onSelectClientDetail(client)} title="Bấm để xem hồ sơ học viên">
                      <img
                        src={apt.clientAvatar || client?.avatarUrl || DEFAULT_AVATAR_URL}""")

# Replace block 2
content = content.replace("""<div className="flex items-center gap-3">
                      <img
                        src={apt.clientAvatar || client?.avatarUrl || DEFAULT_AVATAR_URL}""", """<div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => client && onSelectClientDetail(client)} title="Bấm để xem hồ sơ học viên">
                      <img
                        src={apt.clientAvatar || client?.avatarUrl || DEFAULT_AVATAR_URL}""")


with open('src/components/AppointmentsView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
