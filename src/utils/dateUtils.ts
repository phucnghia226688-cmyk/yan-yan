export const getVNDate = (date?: Date | string | number): Date => {
  const d = date ? new Date(date) : new Date();
  const vnStr = d.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });
  return new Date(vnStr);
};

export const getVNDateStr = (date?: Date | string | number): string => {
  const vnDate = getVNDate(date);
  const yyyy = vnDate.getFullYear();
  const mm = String(vnDate.getMonth() + 1).padStart(2, '0');
  const dd = String(vnDate.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const getTodayDateStr = (): string => {
  return getVNDateStr();
};

export const parseDateLocal = (dateStr: string): Date => {
  // expects YYYY-MM-DD
  const [y, m, d] = dateStr.split('-');
  return new Date(Number(y), Number(m) - 1, Number(d));
};

export const getWeekdayName = (dateStr: string): string => {
  const d = parseDateLocal(dateStr);
  const dayIndex = d.getDay();
  const names = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  return names[dayIndex];
};

export const getVNDayOfWeek = (date?: Date | string | number): number => {
  return getVNDate(date).getDay();
};
