import re

with open('src/components/CheckInView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_code = """                        <td className="p-3 font-bold text-white flex items-center gap-2">
                          {client && <img src={client.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover" />}
                          {log.clientName}
                        </td>"""

new_code = """                        <td className="p-3 font-bold text-white">
                          <div 
                            className="flex items-center gap-2 cursor-pointer hover:text-indigo-400 transition-colors"
                            onClick={() => client && onSelectClientDetail(client)}
                            title="Bấm để xem hồ sơ học viên"
                          >
                            {client && <img src={client.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover shadow-sm" />}
                            {log.clientName}
                          </div>
                        </td>"""

content = content.replace(old_code, new_code)

with open('src/components/CheckInView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
