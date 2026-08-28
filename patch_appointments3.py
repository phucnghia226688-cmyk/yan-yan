with open('src/components/AppointmentsView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_hwc = """  const handleWeekChange = (offset: number) => {
    const curr = new Date(selectedDate);
    curr.setDate(curr.getDate() + offset * 7);
    const yyyy = curr.getFullYear();
    const mm = String(curr.getMonth() + 1).padStart(2, '0');
    const dd = String(curr.getDate()).padStart(2, '0');
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  };"""

new_hwc = """  const handleWeekChange = (offset: number) => {
    const curr = parseDateLocal(selectedDate);
    curr.setDate(curr.getDate() + offset * 7);
    setSelectedDate(getVNDateStr(curr));
  };"""

content = content.replace(old_hwc, new_hwc)

with open('src/components/AppointmentsView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
