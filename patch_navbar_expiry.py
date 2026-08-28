import re

with open('src/components/Navbar.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# We need to add the expiry date badge next to the Realtime Sync badge or the Owner info.
# In the owner info section:
replacement = """                  <p className="text-[11px] sm:text-xs text-slate-400 capitalize font-medium truncate">
                    {currentUser?.ownerName ? `PT: ${currentUser.ownerName} • ` : ''}{currentDateStr}
                  </p>
                  {currentUser?.role === 'tenant' && currentUser?.expireDate && (() => {
                    const diffTime = new Date(currentUser.expireDate).getTime() - new Date().getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    const isExpiringSoon = diffDays <= 7;
                    return (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs border ${isExpiringSoon ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`} title={`Tài khoản hết hạn vào ${new Date(currentUser.expireDate).toLocaleDateString('vi-VN')}`}>
                        <Clock className="w-3 h-3" />
                        Còn {diffDays > 0 ? diffDays : 0} ngày
                      </span>
                    );
                  })()}"""

content = content.replace("""                  <p className="text-[11px] sm:text-xs text-slate-400 capitalize font-medium truncate">
                    {currentUser?.ownerName ? `PT: ${currentUser.ownerName} • ` : ''}{currentDateStr}
                  </p>""", replacement)

with open('src/components/Navbar.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
