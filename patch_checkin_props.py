import re

with open('src/components/CheckInView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add onSelectClientDetail to Props
content = content.replace("interface CheckInViewProps {\n  onOpenQuickCheckIn: (client?: Client) => void;\n  onGoToProgram: (clientId: string) => void;\n}", "interface CheckInViewProps {\n  onOpenQuickCheckIn: (client?: Client) => void;\n  onGoToProgram: (clientId: string) => void;\n  onSelectClientDetail: (client: Client) => void;\n}")

# Add to destructuring
content = content.replace("export const CheckInView: React.FC<CheckInViewProps> = ({\n  onOpenQuickCheckIn,\n  onGoToProgram\n}) => {", "export const CheckInView: React.FC<CheckInViewProps> = ({\n  onOpenQuickCheckIn,\n  onGoToProgram,\n  onSelectClientDetail\n}) => {")
content = content.replace("export const CheckInView: React.FC<CheckInViewProps> = ({ onOpenQuickCheckIn, onGoToProgram }) => {", "export const CheckInView: React.FC<CheckInViewProps> = ({ onOpenQuickCheckIn, onGoToProgram, onSelectClientDetail }) => {")

with open('src/components/CheckInView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
