import re

with open('src/components/ClientManagementView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

state_vars = """  const [cancelCheckInTarget, setCancelCheckInTarget] = useState<{ id: string; clientName: string } | null>(null);
  const [editCheckInTarget, setEditCheckInTarget] = useState<any | null>(null);
  const [editCheckInPlanName, setEditCheckInPlanName] = useState('');"""

content = content.replace("  const [cancelCheckInTarget, setCancelCheckInTarget] = useState<{ id: string; clientName: string } | null>(null);", state_vars)

with open('src/components/ClientManagementView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
