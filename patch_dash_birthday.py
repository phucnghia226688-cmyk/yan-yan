import re

with open('src/components/DashboardView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("""                    <div className="flex items-center gap-3">
                      <img src={client.avatarUrl} alt={client.name} className="w-9 h-9 rounded-full object-cover" />
                      <div>
                        <p className="text-xs font-bold text-slate-900">{client.name}</p>""", """                    <div 
                      className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => onSelectClientDetail(client)}
                      title="Bấm để xem hồ sơ học viên"
                    >
                      <img src={client.avatarUrl} alt={client.name} className="w-9 h-9 rounded-full object-cover" />
                      <div>
                        <p className="text-xs font-bold text-slate-900 hover:text-[#4F46E5]">{client.name}</p>""")


with open('src/components/DashboardView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
