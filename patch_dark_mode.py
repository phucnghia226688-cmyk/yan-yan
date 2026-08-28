import re

with open('src/index.css', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace background color for body
content = re.sub(
    r"""html\.dark,.*?,html\.dark \.bg-slate-50 \{\s*background-color: #0b0f19 !important;.*?color: #f8fafc !important;\s*\}""",
    """html.dark,
html.dark body,
html.dark #root,
html.dark .bg-[#F8FAFC],
html.dark .bg-slate-50 {
  background-color: #18191A !important;
  color: #E4E6EB !important;
}""",
    content,
    flags=re.DOTALL
)

# Replace background color for cards
content = re.sub(
    r"""html\.dark header,.*?,html\.dark \.bg-slate-100\/80 \{\s*background-color: #1a2234 !important;.*?color: #f8fafc !important;\s*\}""",
    """html.dark header,
html.dark nav,
html.dark footer,
html.dark .bg-white,
html.dark .bg-white\\/80,
html.dark .bg-white\\/90,
html.dark .bg-white\\/95,
html.dark .bg-white\\/50,
html.dark .bg-slate-50\\/90,
html.dark .bg-slate-50\\/95,
html.dark .bg-slate-50\\/80,
html.dark .bg-slate-50\\/50,
html.dark .bg-slate-100,
html.dark .bg-slate-100\\/50,
html.dark .bg-slate-100\\/80 {
  background-color: #242526 !important;
  color: #E4E6EB !important;
}""",
    content,
    flags=re.DOTALL
)

# Replace inputs
content = re.sub(
    r"""html\.dark input,.*?,html\.dark input\[type="datetime-local"\] \{\s*background-color: #0f172a !important;\s*color: #f8fafc !important;\s*border-color: #334155 !important;\s*\}""",
    """html.dark input,
html.dark select,
html.dark textarea,
html.dark option,
html.dark input[type="text"],
html.dark input[type="number"],
html.dark input[type="date"],
html.dark input[type="datetime-local"] {
  background-color: #3A3B3C !important;
  color: #E4E6EB !important;
  border-color: #3A3B3C !important;
}""",
    content,
    flags=re.DOTALL
)

content = re.sub(
    r"""html\.dark input:focus,.*?textarea:focus \{\s*background-color: #1e293b !important;\s*border-color: #6366f1 !important;\s*\}""",
    """html.dark input:focus,
html.dark select:focus,
html.dark textarea:focus {
  background-color: #3A3B3C !important;
  border-color: #E4E6EB !important;
}""",
    content,
    flags=re.DOTALL
)

content = re.sub(
    r"""html\.dark input::placeholder,.*?textarea::placeholder \{\s*color: #94a3b8 !important;\s*\}""",
    """html.dark input::placeholder,
html.dark textarea::placeholder {
  color: #B0B3B8 !important;
}""",
    content,
    flags=re.DOTALL
)

# Replace borders
content = re.sub(
    r"""html\.dark \.border-slate-100,.*?\> \* \+ \* \{\s*border-color: #2b384e !important;\s*\}""",
    """html.dark .border-slate-100,
html.dark .border-slate-200,
html.dark .border-slate-200\\/80,
html.dark .border-slate-200\\/90,
html.dark .border-slate-200\\/60,
html.dark .border-slate-300,
html.dark .border-slate-300\\/80,
html.dark .border-slate-400,
html.dark .border-indigo-150,
html.dark .border-indigo-100,
html.dark .border-indigo-200,
html.dark .border-indigo-300,
html.dark .divide-slate-100 > * + *,
html.dark .divide-slate-200 > * + *,
html.dark .divide-slate-200\\/60 > * + * {
  border-color: #3A3B3C !important;
}""",
    content,
    flags=re.DOTALL
)

# Replace text colors
content = re.sub(
    r"""html\.dark \.text-slate-950,.*?,html\.dark \.text-amber-800 \{\s*color: #f8fafc !important;\s*\}""",
    """html.dark .text-slate-950,
html.dark .text-slate-900,
html.dark .text-slate-800,
html.dark .text-slate-700,
html.dark .text-indigo-950,
html.dark .text-indigo-900,
html.dark .text-indigo-800,
html.dark .text-emerald-950,
html.dark .text-emerald-900,
html.dark .text-emerald-800,
html.dark .text-rose-950,
html.dark .text-rose-900,
html.dark .text-rose-800,
html.dark .text-amber-950,
html.dark .text-amber-900,
html.dark .text-amber-800 {
  color: #E4E6EB !important;
}""",
    content,
    flags=re.DOTALL
)

content = re.sub(
    r"""html\.dark \.text-slate-600,.*?\{\s*color: #cbd5e1 !important;\s*\}""",
    """html.dark .text-slate-600,
html.dark .text-slate-500 {
  color: #B0B3B8 !important;
}""",
    content,
    flags=re.DOTALL
)

content = re.sub(
    r"""html\.dark \.text-slate-400 \{\s*color: #94a3b8 !important;\s*\}""",
    """html.dark .text-slate-400 {
  color: #B0B3B8 !important;
}""",
    content,
    flags=re.DOTALL
)

# Fix accent colors (Badges/Pills with opacity 15%-25%)
content = re.sub(
    r"""html\.dark \.bg-indigo-50,.*?\{\s*background-color: rgba\(49, 46, 129, 0\.45\) !important;\s*color: #e0e7ff !important;\s*\}""",
    """html.dark .bg-indigo-50,
html.dark .bg-indigo-50\\/30,
html.dark .bg-indigo-50\\/50,
html.dark .bg-indigo-50\\/80,
html.dark .bg-indigo-100,
html.dark .bg-indigo-100\\/60,
html.dark .bg-indigo-200 {
  background-color: rgba(165, 180, 252, 0.2) !important;
  color: #C7D2FE !important;
}""",
    content,
    flags=re.DOTALL
)

content = re.sub(
    r"""html\.dark \.bg-emerald-50,.*?\{\s*background-color: rgba\(6, 78, 59, 0\.45\) !important;\s*color: #d1fae5 !important;\s*\}""",
    """html.dark .bg-emerald-50,
html.dark .bg-emerald-50\\/30,
html.dark .bg-emerald-50\\/50,
html.dark .bg-emerald-50\\/80,
html.dark .bg-emerald-100,
html.dark .bg-emerald-200 {
  background-color: rgba(110, 231, 183, 0.2) !important;
  color: #A7F3D0 !important;
}""",
    content,
    flags=re.DOTALL
)

content = re.sub(
    r"""html\.dark \.bg-amber-50,.*?\{\s*background-color: rgba\(120, 53, 15, 0\.45\) !important;\s*color: #fef3c7 !important;\s*\}""",
    """html.dark .bg-amber-50,
html.dark .bg-amber-50\\/30,
html.dark .bg-amber-50\\/50,
html.dark .bg-amber-50\\/80,
html.dark .bg-amber-100,
html.dark .bg-amber-200 {
  background-color: rgba(253, 224, 71, 0.2) !important;
  color: #FEF08A !important;
}""",
    content,
    flags=re.DOTALL
)

content = re.sub(
    r"""html\.dark \.bg-rose-50,.*?\{\s*background-color: rgba\(136, 19, 55, 0\.45\) !important;\s*color: #ffe4e6 !important;\s*\}""",
    """html.dark .bg-rose-50,
html.dark .bg-rose-50\\/30,
html.dark .bg-rose-50\\/50,
html.dark .bg-rose-50\\/80,
html.dark .bg-rose-100,
html.dark .bg-rose-200 {
  background-color: rgba(252, 165, 165, 0.2) !important;
  color: #FECACA !important;
}""",
    content,
    flags=re.DOTALL
)

# Text accent colors
content = re.sub(
    r"""html\.dark \.text-indigo-600,.*?\{\s*color: #a5b4fc !important;\s*\}""",
    """html.dark .text-indigo-600,
html.dark .text-indigo-700 {
  color: #C7D2FE !important;
}""",
    content,
    flags=re.DOTALL
)

content = re.sub(
    r"""html\.dark \.text-emerald-600,.*?\{\s*color: #6ee7b7 !important;\s*\}""",
    """html.dark .text-emerald-600,
html.dark .text-emerald-700 {
  color: #A7F3D0 !important;
}""",
    content,
    flags=re.DOTALL
)

content = re.sub(
    r"""html\.dark \.text-rose-600,.*?\{\s*color: #fca5a5 !important;\s*\}""",
    """html.dark .text-rose-600,
html.dark .text-rose-700 {
  color: #FECACA !important;
}""",
    content,
    flags=re.DOTALL
)

content = re.sub(
    r"""html\.dark \.text-amber-600,.*?\{\s*color: #fde047 !important;\s*\}""",
    """html.dark .text-amber-600,
html.dark .text-amber-700 {
  color: #FEF08A !important;
}""",
    content,
    flags=re.DOTALL
)

# Slate neutral backgrounds
content = re.sub(
    r"""html\.dark \.bg-slate-200,.*?\{\s*background-color: #283548 !important;\s*color: #f8fafc !important;\s*\}""",
    """html.dark .bg-slate-200,
html.dark .bg-slate-200\\/80,
html.dark .bg-slate-200\\/60,
html.dark .bg-slate-200\\/50 {
  background-color: #3A3B3C !important;
  color: #E4E6EB !important;
}""",
    content,
    flags=re.DOTALL
)

# Table styles
content = re.sub(
    r"""html\.dark table thead tr \{\s*background-color: #0f172a !important;\s*\}""",
    """html.dark table thead tr {
  background-color: #242526 !important;
}""",
    content,
    flags=re.DOTALL
)

content = re.sub(
    r"""html\.dark table tbody tr:hover \{\s*background-color: #283548 !important;\s*\}""",
    """html.dark table tbody tr:hover {
  background-color: #3A3B3C !important;
}""",
    content,
    flags=re.DOTALL
)

# Scrollbars
content = re.sub(
    r"""html\.dark ::-webkit-scrollbar-track \{\s*background: #0b0f19;\s*\}""",
    """html.dark ::-webkit-scrollbar-track {
  background: #18191A;
}""",
    content,
    flags=re.DOTALL
)

content = re.sub(
    r"""html\.dark ::-webkit-scrollbar-thumb \{\s*background: #334155;""",
    """html.dark ::-webkit-scrollbar-thumb {
  background: #3A3B3C;""",
    content,
    flags=re.DOTALL
)

with open('src/index.css', 'w', encoding='utf-8') as f:
    f.write(content)
