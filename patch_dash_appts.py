import re

with open('src/components/DashboardView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Make the avatar clickable in Dashboard todaysAppointments
content = content.replace("""                    <div className="flex items-center gap-3.5">
                      <img 
                        src={apt.clientAvatar || client?.avatarUrl || DEFAULT_AVATAR_URL} 
                        alt={apt.clientName}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs\"""", """                    <div className="flex items-center gap-3.5">
                      <img 
                        src={apt.clientAvatar || client?.avatarUrl || DEFAULT_AVATAR_URL} 
                        alt={apt.clientName}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => client && onSelectClientDetail(client)}
                        title="Bấm để xem hồ sơ học viên\"""")

with open('src/components/DashboardView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
