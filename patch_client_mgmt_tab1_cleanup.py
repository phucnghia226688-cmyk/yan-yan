import re

with open('src/components/ClientManagementView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the block: <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-4"> ... </div>
# Which contains the check-in history.
content = re.sub(
    r"""\s*<div className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-4">\s*\{\/\* Quick Observation: Check-in History & Dates \*\/\}\s*<div>.*?</div>\s*</div>\s*<div className="pt-3 border-t border-slate-200">""",
    '\n                      <div className="pt-3 border-t border-slate-200">',
    content,
    flags=re.DOTALL
)

# Also remove goals, health, ptNotes
content = re.sub(
    r"""\s*<div className="pt-3 border-t border-slate-200">\s*<h5 className="text-xs font-bold text-\[\#FF4E00\].*?</div>\s*<div className="pt-3 border-t border-slate-200">\s*<h5 className="text-xs font-bold text-rose-600.*?</div>\s*<div className="pt-3 border-t border-slate-200">\s*<h5 className="text-xs font-bold text-indigo-600.*?</div>\s*<div className="pt-3 border-t border-slate-200">\s*<h5 className="text-xs font-bold text-slate-700""",
    '\n                      <div className="pt-3 border-t border-slate-200">\n                        <h5 className="text-xs font-bold text-slate-700',
    content,
    flags=re.DOTALL
)


with open('src/components/ClientManagementView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
