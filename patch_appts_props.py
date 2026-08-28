import re

with open('src/components/AppointmentsView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("interface AppointmentsViewProps {\n  onOpenQuickCheckIn: (client?: any) => void;\n  onGoToProgram: (clientId: string) => void;\n}", "interface AppointmentsViewProps {\n  onOpenQuickCheckIn: (client?: any) => void;\n  onGoToProgram: (clientId: string) => void;\n  onSelectClientDetail: (client: Client) => void;\n}")

content = content.replace("export const AppointmentsView: React.FC<AppointmentsViewProps> = ({", "export const AppointmentsView: React.FC<AppointmentsViewProps> = ({\n  onSelectClientDetail,")

with open('src/components/AppointmentsView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
