import re

with open('src/components/RevenueView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_code = """                    <td className="p-3 text-center">
                      <button
                        onClick={() => deletePayment(p.id)}"""

new_code = """                    <td className="p-3 text-center flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleOpenReceipt(p)}
                        className="text-[#4F46E5] hover:text-indigo-700 p-1.5 rounded-lg hover:bg-indigo-50 transition-colors flex items-center gap-1"
                        title="Xuất bill ảnh"
                      >
                        <ImageIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deletePayment(p.id)}"""

content = content.replace(old_code, new_code)

with open('src/components/RevenueView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
