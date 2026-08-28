import re

with open('src/components/AppointmentsView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
import_stmt = "import { getTodayDateStr, getVNDateStr, parseDateLocal } from '../utils/dateUtils';\n"
if "dateUtils" not in content:
    content = content.replace("import React,", import_stmt + "import React,")

# Replace all simple `new Date().toISOString().split('T')[0]`
content = content.replace("new Date().toISOString().split('T')[0]", "getTodayDateStr()")

# Replace `handleDateChange`
old_handle_date = """  const handleDateChange = (offsetDays: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + offsetDays);
    setSelectedDate(current.toISOString().split('T')[0]);
  };"""

new_handle_date = """  const handleDateChange = (offsetDays: number) => {
    const current = parseDateLocal(selectedDate);
    current.setDate(current.getDate() + offsetDays);
    setSelectedDate(getVNDateStr(current));
  };"""
content = content.replace(old_handle_date, new_handle_date)

# Replace `getWeekDays`
old_get_week = """  const getWeekDays = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDay(); // 0 = Sun, 1 = Mon...
    const diffToMon = date.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(date);
    mon.setDate(diffToMon);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(mon);
      d.setDate(mon.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const formattedStr = `${yyyy}-${mm}-${dd}`;
      days.push({
        dateStr: formattedStr,
        dayNum: d.getDate(),
        monthNum: d.getMonth() + 1,
        dayName: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'][i],
        fullDayName: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'][i],
        isToday: formattedStr === getTodayDateStr()
      });
    }
    return days;
  };"""

new_get_week = """  const getWeekDays = (dateStr: string) => {
    const date = parseDateLocal(dateStr);
    const day = date.getDay(); // 0 = Sun, 1 = Mon...
    const diffToMon = date.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(date);
    mon.setDate(diffToMon);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(mon);
      d.setDate(mon.getDate() + i);
      const formattedStr = getVNDateStr(d);
      days.push({
        dateStr: formattedStr,
        dayNum: d.getDate(),
        monthNum: d.getMonth() + 1,
        dayName: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'][i],
        fullDayName: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'][i],
        isToday: formattedStr === getTodayDateStr()
      });
    }
    return days;
  };"""
content = content.replace(old_get_week, new_get_week)

# Replace handleWeekChange
old_handle_week = """  const handleWeekChange = (offset: number) => {
    const curr = new Date(selectedDate);
    curr.setDate(curr.getDate() + offset * 7);
    setSelectedDate(curr.toISOString().split('T')[0]);
  };"""
new_handle_week = """  const handleWeekChange = (offset: number) => {
    const curr = parseDateLocal(selectedDate);
    curr.setDate(curr.getDate() + offset * 7);
    setSelectedDate(getVNDateStr(curr));
  };"""
content = content.replace(old_handle_week, new_handle_week)

with open('src/components/AppointmentsView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
