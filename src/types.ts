export interface TenantAccount {
  id: string;
  username: string;
  password: string;
  gymName: string;
  ownerName: string;
  phone: string;
  role: 'admin' | 'tenant';
  status: 'active' | 'suspended' | 'expired';
  createdAt: string; // YYYY-MM-DD
  expireDate: string; // YYYY-MM-DD
  notes?: string;
  maxClients?: number;
  tenantId: string;
  activeSessions?: {
    id: string;
    device: string;
    lastActive: string;
    ip?: string;
  }[];
}

export type AuditActionType = 
  | 'DELETE_CLIENT' 
  | 'ADD_CLIENT' 
  | 'UPDATE_CLIENT' 
  | 'CHECK_IN' 
  | 'CANCEL_CHECK_IN' 
  | 'RENEW_CLIENT' 
  | 'DELETE_EXPENSE' 
  | 'UPDATE_EXPENSE'
  | 'ADD_EXPENSE' 
  | 'DELETE_PAYMENT'
  | 'UPDATE_PAYMENT'
  | 'ADD_PAYMENT'
  | 'DELETE_APPOINTMENT' 
  | 'ADD_APPOINTMENT'
  | 'RESTORE_DATA'
  | 'EXPORT_BACKUP'
  | 'IMPORT_BACKUP';

export interface SystemAuditLog {
  id: string;
  tenantId?: string;
  timestamp: string; // ISO string
  actionType: AuditActionType;
  targetName: string;
  summary: string;
  details?: string;
  isUndone?: boolean;
  undoneAt?: string;
  snapshot?: {
    client?: Client;
    previousClientState?: Client;
    updatedClientState?: Client;
    checkInLog?: CheckInLog;
    appointment?: Appointment;
    appointmentsList?: Appointment[];
    expense?: ExpenseRecord;
    payment?: PaymentRecord;
    program?: WorkoutProgram;
  };
}

export interface BodyMetricEntry {
  id: string;
  date: string;
  weightKg: number;
  bodyFatPercent?: number;
  waistCm?: number;
  hipsCm?: number;
  photoUrl?: string;
  notes?: string;
}

export interface EditHistoryEntry {
  id: string;
  timestamp: string; // e.g. "23/07/2026 15:30"
  summary: string;   // e.g. "Đã sửa: Họ tên, Số điện thoại, Lịch tập cố định"
  actionType?: 'edit' | 'renew' | 'cancel' | 'status' | 'create';
}

export const DEFAULT_AVATAR_URL = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23e2e8f0'/><circle cx='50' cy='38' r='20' fill='%2364748b'/><path d='M 18,90 C 18,65 32,55 50,55 C 68,55 82,65 82,90 Z' fill='%2364748b'/></svg>";

export interface Client {
  id: string;
  tenantId?: string;
  name: string;
  phone: string;
  gender?: 'Nam' | 'Nữ' | string;
  dob: string; // YYYY-MM-DD
  occupation: string;
  goals: string;
  clientType?: 'session' | 'monthly';
  packageName: string;
  totalSessions: number;
  remainingSessions: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  avatarUrl: string;
  status: 'active' | 'expiring' | 'expired' | 'paused' | 'closed';
  healthNotes: string;
  ptNotes: string;
  trainingType?: '1/1' | 'ca_nhom';
  preferredDays?: number[]; // [1, 3, 5] (1=Mon, 3=Wed, 5=Fri, 0=Sun)
  preferredTime?: string;   // e.g. "08:00 - 09:00"
  dayTimes?: Record<number, string>; // e.g. { 1: "05:00 - 06:00", 3: "08:00 - 09:00", 5: "08:00 - 09:00" }
  editHistory?: EditHistoryEntry[];
  bodyMetrics?: BodyMetricEntry[];
  beforeAfterPhotos?: {
    beforeUrl?: string;
    beforeDate?: string;
    afterUrl?: string;
    afterDate?: string;
  };
  workoutProgramId?: string;
}

export interface ExerciseItem {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weightKg: number;
  tempo: string;
  rpe: number; // 1-10
  restSeconds: number;
  videoUrl?: string;
  notes?: string;
}

export interface WorkoutDay {
  id: string;
  dayName: string; // e.g. "Day 1 - Ngực & Tay sau", "Day 2 - Lưng & Tay trước"
  exercises: ExerciseItem[];
}

export interface PdfDocument {
  id: string;
  tenantId?: string;
  title: string;
  fileName: string;
  fileSize: string;
  fileDataUrl: string; // base64 Data URL
  uploadedAt: string;
  clientId?: string;  // optional linked client ID, or 'GENERAL'
  category?: 'Giáo án' | 'Dinh dưỡng' | 'Lịch tập' | 'Hướng dẫn' | 'Khác';
  description?: string;
}

export interface WorkoutProgram {
  id: string;
  tenantId?: string;
  clientId: string;
  clientName: string;
  title: string;
  days: WorkoutDay[];
  pdfDocuments?: PdfDocument[];
  updatedAt: string;
}

export interface CheckInLog {
  id: string;
  tenantId?: string;
  clientId: string;
  clientName: string;
  timestamp: string; // ISO String
  dayPlanName: string;
  sessionsRemainingAfter: number;
  notes?: string;
  exerciseLogs?: {
    exerciseName: string;
    setsLogged: { setNum: number; weightKg: number; reps: number }[];
  }[];
}

export interface PaymentRecord {
  id: string;
  tenantId?: string;
  clientId: string;
  clientName: string;
  packageName: string;
  sessionsCount: number;
  amountVnd: number;
  paymentMethod: 'Tiền mặt' | 'Chuyển khoản' | 'Thẻ';
  paymentDate: string; // YYYY-MM-DD
  notes?: string;
  skipSessionUpdate?: boolean;
  isEdited?: boolean;
  editedAt?: string;
  newEndDate?: string;
  previousState?: {
    remainingSessions: number;
    totalSessions: number;
    endDate: string;
    status: 'active' | 'expiring' | 'expired' | 'paused' | 'closed';
  };
  isCancelled?: boolean;
}

export type GymExpenseCategory = 
  | 'Thuê mặt bằng'
  | 'Điện'
  | 'Nước'
  | 'Internet'
  | 'Marketing'
  | 'Bảo trì thiết bị'
  | 'Dụng cụ tiêu hao'
  | 'Khác';

export type FamilyExpenseCategory =
  | 'Ăn uống'
  | 'Học phí con'
  | 'Điện nước gia đình'
  | 'Internet'
  | 'Xăng xe'
  | 'Mua sắm'
  | 'Du lịch'
  | 'Khác';

export interface ExpenseRecord {
  id: string;
  tenantId?: string;
  categoryGroup: 'Phòng gym' | 'Gia đình';
  category: GymExpenseCategory | FamilyExpenseCategory | string;
  amountVnd: number;
  date: string; // YYYY-MM-DD
  notes?: string;
}

export interface Appointment {
  id: string;
  tenantId?: string;
  clientId: string;
  clientName: string;
  clientAvatar?: string;
  time: string; // e.g. "08:00 - 09:00"
  date: string; // YYYY-MM-DD
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  dayPlan: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export interface UserSession {
  session_id: string;
  user_id: string;
  tenantId: string;
  user_agent: string;
  created_at: string;
  is_active: boolean;
}
