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
  if (!dateStr) return new Date();
  // If DD/MM/YYYY format
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr.trim())) {
    const [d, m, y] = dateStr.trim().split('/');
    return new Date(Number(y), Number(m) - 1, Number(d));
  }
  // expects YYYY-MM-DD
  const parts = dateStr.split('-');
  if (parts.length >= 3) {
    const [y, m, d] = parts;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }
  return new Date(dateStr);
};

/**
 * Formats a date string/object to DD/MM/YYYY for Vietnamese UI display.
 * Safely handles null, undefined, empty, ISO strings, YYYY-MM-DD, or already formatted strings.
 */
export const formatDate = (dateStr?: string | Date | number | null): string => {
  if (!dateStr) return '-';
  try {
    if (typeof dateStr === 'string') {
      const trimmed = dateStr.trim();
      if (!trimmed || trimmed === '-' || trimmed === 'N/A') return '-';
      
      // If already in DD/MM/YYYY format
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
        const [d, m, y] = trimmed.split('/');
        return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
      }
      
      // If YYYY-MM-DD (e.g. 2026-08-11 or 2026-08-11T...)
      const match = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
      if (match) {
        const [, y, m, d] = match;
        return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
      }
    }
    
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return typeof dateStr === 'string' ? dateStr : '-';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch {
    return typeof dateStr === 'string' ? dateStr : '-';
  }
};

/**
 * Formats date and time to "HH:mm DD/MM/YYYY" or "DD/MM/YYYY HH:mm"
 */
export const formatDateTime = (dateStr?: string | Date | number | null): string => {
  if (!dateStr) return '-';
  try {
    if (typeof dateStr === 'string') {
      const trimmed = dateStr.trim();
      if (!trimmed || trimmed === '-') return '-';
      
      const matchISO = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
      if (matchISO) {
        const [, y, m, d, hh, min] = matchISO;
        return `${hh.padStart(2, '0')}:${min.padStart(2, '0')} ${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
      }
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return typeof dateStr === 'string' ? dateStr : '-';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${min} ${dd}/${mm}/${yyyy}`;
  } catch {
    return typeof dateStr === 'string' ? dateStr : '-';
  }
};

/**
 * Formats date range like "11/08/2026 -> 11/09/2026"
 */
export const formatDateRange = (startStr?: string | null, endStr?: string | null): string => {
  if (!startStr && !endStr) return '-';
  if (startStr && !endStr) return formatDate(startStr);
  if (!startStr && endStr) return `-> ${formatDate(endStr)}`;
  return `${formatDate(startStr)} -> ${formatDate(endStr)}`;
};

export const getWeekdayName = (dateStr: string): string => {
  try {
    const d = parseDateLocal(dateStr);
    if (isNaN(d.getTime())) return '';
    const dayIndex = d.getDay();
    const names = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return names[dayIndex];
  } catch {
    return '';
  }
};

export const getVNDayOfWeek = (date?: Date | string | number): number => {
  return getVNDate(date).getDay();
};
