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
  const trimmed = dateStr.trim();
  // If DD/MM/YYYY format
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const [d, m, y] = trimmed.split('/');
    return new Date(Number(y), Number(m) - 1, Number(d));
  }
  // expects YYYY-MM-DD
  const match = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (match) {
    const [, y, m, d] = match;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }
  return new Date(dateStr);
};

/**
 * Chuyển đổi chuỗi ngày an toàn thành Timestamp (đến cuối ngày 23:59:59.999 để tính trọn vẹn thời hạn).
 * Tuyệt đối không dùng new Date("DD/MM/YYYY") trực tiếp để tránh lỗi Invalid Date / NaN.
 */
export const getSafeDateTimestamp = (dateInput?: string | Date | number | null): number | null => {
  if (!dateInput && dateInput !== 0) return null;
  if (typeof dateInput === 'number') return isNaN(dateInput) ? null : dateInput;
  if (dateInput instanceof Date) return isNaN(dateInput.getTime()) ? null : dateInput.getTime();

  const trimmed = String(dateInput).trim();
  if (!trimmed || trimmed === '-' || trimmed === 'N/A' || trimmed === 'null' || trimmed === 'undefined') return null;

  // 1. Nếu chuỗi là DD/MM/YYYY hoặc D/M/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const [day, month, year] = trimmed.split('/');
    const d = new Date(Number(year), Number(month) - 1, Number(day), 23, 59, 59, 999);
    return isNaN(d.getTime()) ? null : d.getTime();
  }

  // 2. Nếu chuỗi là YYYY-MM-DD hoặc bắt đầu bằng YYYY-MM-DD
  const ymdMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (ymdMatch) {
    const [, year, month, day] = ymdMatch;
    const d = new Date(Number(year), Number(month) - 1, Number(day), 23, 59, 59, 999);
    return isNaN(d.getTime()) ? null : d.getTime();
  }

  // 3. Fallback cho ISO string chuẩn hoặc RFC2822
  const fallback = new Date(trimmed);
  if (!isNaN(fallback.getTime())) {
    fallback.setHours(23, 59, 59, 999);
    return fallback.getTime();
  }

  return null;
};

/**
 * Tính số ngày chênh lệch chuẩn xác theo từng ngày (diffDays):
 * const today = new Date(); today.setHours(0, 0, 0, 0);
 * const diffDays = Math.ceil((targetTimestamp - today.getTime()) / (1000 * 60 * 60 * 24));
 * - diffDays > 0: còn hạn (số ngày)
 * - diffDays == 0: hết hạn vào cuối ngày hôm nay
 * - diffDays < 0: đã quá hạn
 */
export const calculateContractDiffDays = (endDateInput?: string | Date | number | null): number | null => {
  const targetTimestamp = getSafeDateTimestamp(endDateInput);
  if (targetTimestamp === null) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((targetTimestamp - today.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Chuyển đổi chuỗi ngày bất kỳ (kể cả DD/MM/YYYY) thành định dạng YYYY-MM-DD cho thẻ <input type="date" />.
 */
export const toInputDateStr = (dateInput?: string | Date | number | null): string => {
  if (!dateInput && dateInput !== 0) return '';
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
      const [d, m, y] = trimmed.split('/');
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    const match = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (match) {
      const [, y, m, d] = match;
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  }
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/**
 * Kết quả phân loại trạng thái học viên & viền cảnh báo
 */
export interface ClientContractStatusInfo {
  status: 'active' | 'expiring' | 'expired' | 'paused' | 'closed';
  diffDays: number | null;
  borderClass: string;
  badgeLabel: string;
  badgeColor: 'green' | 'amber' | 'red' | 'gray';
  isOverdue: boolean;
  isWarning: boolean;
  isSafe: boolean;
}

/**
 * QUY TẮC HIỂN THỊ TRẠNG THÁI & CẢNH BÁO VIỀN:
 * 🟢 ĐANG TẬP (ACTIVE - CÒN HẠN):
 *   Điều kiện: diffDays > 5 VÀ số buổi còn lại > 2 (nếu khách tháng thì chỉ cần diffDays > 5)
 *   Giao diện: Nhãn xanh lá "Đang tập", TUYỆT ĐỐI KHÔNG xuất hiện viền đỏ hay viền cam mép trái.
 * 🟡 SẮP HẾT HẠN / SẮP HẾT BUỔI:
 *   Điều kiện: (diffDays >= 0 && diffDays <= 5) HOẶC (số buổi > 0 && số buổi <= 2)
 *   Giao diện: Viền cam mép trái (`border-l-4 border-amber-500 bg-amber-50/40`), huy hiệu cam
 * 🔴 QUÁ HẠN / HẾT HẠN HỢP ĐỒNG:
 *   Điều kiện: diffDays < 0 HOẶC số buổi <= 0
 *   Giao diện: Viền đỏ mép trái (`border-l-4 border-rose-500 bg-rose-50/40`), huy hiệu đỏ
 */
export const getClientContractStatus = (client?: {
  status?: string;
  clientType?: 'session' | 'monthly';
  remainingSessions?: number;
  totalSessions?: number;
  endDate?: string;
  expirationDate?: string;
} | null): ClientContractStatusInfo => {
  if (!client) {
    return {
      status: 'active',
      diffDays: null,
      borderClass: '',
      badgeLabel: 'Đang tập',
      badgeColor: 'green',
      isOverdue: false,
      isWarning: false,
      isSafe: true
    };
  }

  if (client.status === 'closed') {
    return {
      status: 'closed',
      diffDays: null,
      borderClass: 'border-l-4 border-slate-400 bg-slate-100/50',
      badgeLabel: 'HĐ đã đóng',
      badgeColor: 'gray',
      isOverdue: false,
      isWarning: false,
      isSafe: false
    };
  }

  if (client.status === 'paused') {
    return {
      status: 'paused',
      diffDays: null,
      borderClass: 'border-l-4 border-slate-400 bg-slate-100/50',
      badgeLabel: 'Bảo lưu',
      badgeColor: 'gray',
      isOverdue: false,
      isWarning: false,
      isSafe: false
    };
  }

  const isMonthly = client.clientType === 'monthly';
  const remaining = client.remainingSessions ?? 0;
  const effectiveEndDate = client.endDate || client.expirationDate;
  const diffDays = calculateContractDiffDays(effectiveEndDate);

  // 🔴 QUÁ HẠN / HẾT HẠN HỢP ĐỒNG:
  // diffDays < 0 HOẶC số buổi còn lại <= 0 (đối với gói buổi)
  const isDateExpired = diffDays !== null && diffDays < 0;
  const isSessionExpired = !isMonthly && remaining <= 0;

  if (isDateExpired || isSessionExpired) {
    let badgeLabel = 'Quá hạn';
    if (isDateExpired && isSessionExpired) badgeLabel = 'Hết hạn HĐ & Buổi';
    else if (isDateExpired) badgeLabel = 'Hết hạn HĐ';
    else badgeLabel = 'Hết buổi';

    return {
      status: 'expired',
      diffDays,
      borderClass: 'border-l-4 border-rose-500 bg-rose-50/40',
      badgeLabel,
      badgeColor: 'red',
      isOverdue: true,
      isWarning: false,
      isSafe: false
    };
  }

  // 🟡 SẮP HẾT HẠN / SẮP HẾT BUỔI:
  // (diffDays >= 0 && diffDays <= 5) HOẶC (số buổi > 0 && số buổi <= 2)
  const isDateWarning = diffDays !== null && diffDays >= 0 && diffDays <= 5;
  const isSessionWarning = !isMonthly && remaining > 0 && remaining <= 2;

  if (isDateWarning || isSessionWarning) {
    let badgeLabel = 'Sắp hết hạn';
    if (isDateWarning && isSessionWarning) badgeLabel = `Hạn ${diffDays}n & Còn ${remaining}b`;
    else if (isDateWarning) badgeLabel = diffDays === 0 ? 'Hết hạn hôm nay' : `Hạn còn ${diffDays} ngày`;
    else badgeLabel = `Còn ${remaining} buổi`;

    return {
      status: 'expiring',
      diffDays,
      borderClass: 'border-l-4 border-amber-500 bg-amber-50/40',
      badgeLabel,
      badgeColor: 'amber',
      isOverdue: false,
      isWarning: true,
      isSafe: false
    };
  }

  // 🟢 ĐANG TẬP (ACTIVE - CÒN HẠN):
  // diffDays > 5 VÀ (isMonthly || remaining > 2)
  // Giao diện: Nhãn xanh lá "Đang tập", TUYỆT ĐỐI KHÔNG xuất hiện viền đỏ hay viền cam bên mép trái.
  return {
    status: 'active',
    diffDays,
    borderClass: '', // Tuyệt đối không có viền đỏ/cam
    badgeLabel: 'Đang tập',
    badgeColor: 'green',
    isOverdue: false,
    isWarning: false,
    isSafe: true
  };
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
 * Formats date and time to "HH:mm - DD/MM/YYYY"
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
        return `${hh.padStart(2, '0')}:${min.padStart(2, '0')} - ${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
      }
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return typeof dateStr === 'string' ? dateStr : '-';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${min} - ${dd}/${mm}/${yyyy}`;
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
