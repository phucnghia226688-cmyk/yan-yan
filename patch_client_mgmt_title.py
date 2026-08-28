import re

with open('src/components/ClientManagementView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_code = """          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-[#FF4E00]" />
            Quản lý học viên ({clients.length})
          </h2>"""
new_code = """          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-[#FF4E00]" />
            Quản lý học viên ({clients.filter(c => c.status !== 'closed').length})
          </h2>"""

content = content.replace(old_code, new_code)

with open('src/components/ClientManagementView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
