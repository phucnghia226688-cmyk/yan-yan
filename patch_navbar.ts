import fs from 'fs';

let content = fs.readFileSync('src/components/Navbar.tsx', 'utf-8');

const navGroupsCode = `  const navGroups = [
    ...(isMasterAdmin ? [{
      id: 'admin',
      label: 'Quản trị Master',
      icon: ShieldCheck,
      items: [
        { id: 'admin_tenants', label: 'Cho thuê tài khoản', icon: ShieldCheck, badge: Math.max(0, tenants.length - 1) },
      ]
    }] : []),
    {
      id: 'overview',
      label: 'Tổng quan & lịch',
      icon: LayoutDashboard,
      items: [
        { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
        { id: 'appointments', label: 'Lịch hẹn & check-in PT', icon: Calendar },
        { id: 'checkin_history', label: 'Nhật ký check-in', icon: History },
      ]
    },
    {
      id: 'clients',
      label: 'Quản lý học viên',
      icon: Users,
      items: [
        { id: 'clients', label: 'Học viên', icon: Users, badge: clients.length },
        { id: 'programs', label: 'Giáo án tập luyện', icon: ClipboardList },
      ]
    },
    ...(isMasterAdmin ? [
      {
        id: 'finance',
        label: 'Quản lý thu chi',
        icon: Wallet,
        items: [
          { id: 'finance', label: 'Quản lý thu chi', icon: Wallet },
        ]
      },
      {
        id: 'reports',
        label: 'Báo cáo & hệ thống',
        icon: BarChart3,
        items: [
          { id: 'reports', label: 'Báo cáo & lịch sử', icon: BarChart3, badge: auditLogs ? auditLogs.filter(a => !a.isUndone).length : undefined },
        ]
      }
    ] : [])
  ];`;

content = content.replace(/  const navGroups = \[[^]*?  \];/m, navGroupsCode);

fs.writeFileSync('src/components/Navbar.tsx', content);
