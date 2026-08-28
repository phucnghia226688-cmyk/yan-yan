import re

with open('src/components/ClientManagementView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace onClick
content = re.sub(
    r"""onClick=\{\(\) => setSelectedClient\(client\)\}\s*onDoubleClick=\{\(\) => \{ setSelectedClient\(client\); setIsDetailModalOpen\(true\); \}\}\s*title="Click chọn \| Click 2 lần để mở chi tiết.*?"""",
    """onClick={() => { setSelectedClient(client); setIsDetailModalOpen(true); }}
                    title="Click để mở chi tiết\"""",
    content
)

with open('src/components/ClientManagementView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
