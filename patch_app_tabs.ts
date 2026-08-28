import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

const regex1 = /({activeTab === 'admin_tenants' && \(\s*<AdminTenantsView \/>\s*\)})/;
content = content.replace(regex1, "{isMasterAdmin && activeTab === 'admin_tenants' && (\n          <AdminTenantsView />\n        )}");

const regex2 = /({(?:activeTab === 'finance' \|\| activeTab === 'revenue' \|\| activeTab === 'expenses') && \(\s*<FinanceView initialTab={activeTab === 'expenses' \? 'expenses' : 'revenue'} \/>\s*\)})/;
content = content.replace(regex2, "{isMasterAdmin && (activeTab === 'finance' || activeTab === 'revenue' || activeTab === 'expenses') && (\n          <FinanceView initialTab={activeTab === 'expenses' ? 'expenses' : 'revenue'} />\n        )}");

const regex3 = /({(?:activeTab === 'reports' \|\| activeTab === 'sheets' \|\| activeTab === 'audit') && \(\s*<ReportsView\s*activeSubTab={activeTab as 'reports' \| 'sheets' \| 'audit'}\s*onSubTabChange={\(sub\) => setActiveTab\(sub\)}\s*\/>\s*\)})/;
content = content.replace(regex3, "{isMasterAdmin && (activeTab === 'reports' || activeTab === 'sheets' || activeTab === 'audit') && (\n          <ReportsView \n            activeSubTab={activeTab as 'reports' | 'sheets' | 'audit'} \n            onSubTabChange={(sub) => setActiveTab(sub)} \n          />\n        )}");

if (!content.includes('const { currentUser, isMasterAdmin } = useTenant();')) {
   content = content.replace("const { currentUser, logout } = useTenant();", "const { currentUser, isMasterAdmin, logout } = useTenant();");
}
// Wait, `isMasterAdmin` should be fetched from `useTenant()` in `AppContent` too!
if (!content.includes('const { isMasterAdmin } = useTenant();')) {
  content = content.replace("const handleTabChange = (tab: string) => {", "const { isMasterAdmin } = useTenant();\n  const handleTabChange = (tab: string) => {");
}

fs.writeFileSync('src/App.tsx', content);
