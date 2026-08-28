import re

with open('src/context/GymContext.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add to interface
content = content.replace(
    "  cancelCheckIn: (checkInId: string) => void;",
    "  cancelCheckIn: (checkInId: string) => void;\n  updateCheckIn: (id: string, updates: Partial<CheckInLog>) => void;"
)

# Add implementation
impl = """  const updateCheckIn = (id: string, updates: Partial<CheckInLog>) => {
    setCheckIns(prev => {
      const updated = prev.map(ci => ci.id === id ? { ...ci, ...updates } : ci);
      const target = updated.find(ci => ci.id === id);
      if (target) {
        saveToCloud('checkins', target);
      }
      return updated;
    });
  };

"""

content = content.replace(
    "  const cancelCheckIn = (checkInId: string) => {",
    impl + "  const cancelCheckIn = (checkInId: string) => {"
)

# Add to return object
content = content.replace(
    "      cancelCheckIn,",
    "      cancelCheckIn,\n      updateCheckIn,"
)

with open('src/context/GymContext.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
