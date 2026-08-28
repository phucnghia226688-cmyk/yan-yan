import re

with open('src/components/ClientManagementView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find: const [activeDetailTab, setActiveDetailTab] = useState<'info' | 'metrics' | 'photos' | 'history' | 'program'>('info');
# Insert useEffect after it
old_code = "const [activeDetailTab, setActiveDetailTab] = useState<'info' | 'metrics' | 'photos' | 'history' | 'program'>('info');"
new_code = "const [activeDetailTab, setActiveDetailTab] = useState<'info' | 'metrics' | 'photos' | 'history' | 'program'>('info');\n\n  useEffect(() => {\n    if (selectedClientFromNav) {\n      setSelectedClient(selectedClientFromNav);\n      setIsDetailModalOpen(true);\n    }\n  }, [selectedClientFromNav]);"

content = content.replace(old_code, new_code)

with open('src/components/ClientManagementView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
