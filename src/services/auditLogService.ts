import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  getDocs, 
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SystemAuditLog } from '../types';

export interface FetchAuditLogsOptions {
  tenantId?: string; // 'all' or specific tenant ID
  isMaster?: boolean;
  limitCount?: number;
  lastDoc?: QueryDocumentSnapshot<DocumentData> | null;
  selectedDate?: string; // YYYY-MM-DD
  startDate?: string;
  endDate?: string;
  category?: 'ALL' | 'DELETE' | 'EDIT' | 'CHECKIN' | 'EXPENSE';
  searchTerm?: string;
}

export interface FetchAuditLogsResult {
  logs: SystemAuditLog[];
  lastVisibleDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
  error?: string;
}

/**
 * Remove base64 strings and large data from snapshots to keep Firestore document size minimal
 * Ensures compliance with permanent storage rules: pure text data only (<1-2KB per document).
 */
export function cleanSnapshotForAudit(snapshot?: SystemAuditLog['snapshot']): SystemAuditLog['snapshot'] | undefined {
  if (!snapshot) return undefined;
  
  try {
    const cleanObject = (obj: any, depth = 0): any => {
      if (depth > 5 || obj === null || obj === undefined) return obj;
      if (typeof obj === 'string') {
        if (obj.startsWith('data:image') || obj.startsWith('data:application') || (obj.length > 500 && !obj.includes(' '))) {
          return '[Hình ảnh/Tệp đính kèm đã lược bỏ để lưu trữ vĩnh viễn]';
        }
        return obj;
      }
      if (Array.isArray(obj)) {
        return obj.slice(0, 50).map(item => cleanObject(item, depth + 1));
      }
      if (typeof obj === 'object') {
        const cleaned: Record<string, any> = {};
        for (const [key, value] of Object.entries(obj)) {
          if (key === 'fileDataUrl' || key === 'pdfDocuments' || key === 'avatarBase64') {
            continue; // Skip heavy binary fields
          }
          cleaned[key] = cleanObject(value, depth + 1);
        }
        return cleaned;
      }
      return obj;
    };

    return cleanObject(snapshot);
  } catch (err) {
    console.warn('Error cleaning snapshot for audit log:', err);
    return undefined;
  }
}

/**
 * Optimized query function to fetch audit logs with pagination and tenant isolation.
 * Automatically limits query to 100 records by default to protect Firestore quota.
 * Permanent storage: queries historic records without expiration.
 */
export async function fetchAuditLogs(options: FetchAuditLogsOptions): Promise<FetchAuditLogsResult> {
  const {
    tenantId = 'all',
    isMaster = false,
    limitCount = 100,
    lastDoc = null,
    selectedDate = '',
    startDate = '',
    endDate = '',
    category = 'ALL',
    searchTerm = ''
  } = options;

  if (!db) {
    return { logs: [], lastVisibleDoc: null, hasMore: false };
  }

  try {
    const logsRef = collection(db, 'auditLogs');
    const isTenantSpecific = !isMaster || (tenantId && tenantId !== 'all' && tenantId !== 'master-admin');
    const targetTenantId = isTenantSpecific ? tenantId : undefined;

    let snapshotDocs: QueryDocumentSnapshot<DocumentData>[] = [];
    const queryLimit = limitCount;

    // Build the query
    // Case 1: Primary Query with orderBy('timestamp', 'desc') and limit(100)
    try {
      let q;
      if (targetTenantId) {
        if (lastDoc) {
          q = query(
            logsRef,
            where('tenantId', '==', targetTenantId),
            orderBy('timestamp', 'desc'),
            startAfter(lastDoc),
            limit(queryLimit)
          );
        } else {
          q = query(
            logsRef,
            where('tenantId', '==', targetTenantId),
            orderBy('timestamp', 'desc'),
            limit(queryLimit)
          );
        }
      } else {
        // Master admin viewing all tenants
        if (lastDoc) {
          q = query(
            logsRef,
            orderBy('timestamp', 'desc'),
            startAfter(lastDoc),
            limit(queryLimit)
          );
        } else {
          q = query(
            logsRef,
            orderBy('timestamp', 'desc'),
            limit(queryLimit)
          );
        }
      }

      const snap = await getDocs(q);
      snapshotDocs = snap.docs;
    } catch (primaryErr: any) {
      console.warn('Primary audit logs query warning (trying fallback query without composite index):', primaryErr);
      
      // Fallback query if composite index is missing or building
      let fallbackQ;
      if (targetTenantId) {
        fallbackQ = query(
          logsRef,
          where('tenantId', '==', targetTenantId),
          limit(queryLimit)
        );
      } else {
        fallbackQ = query(
          logsRef,
          limit(queryLimit)
        );
      }
      const snap = await getDocs(fallbackQ);
      snapshotDocs = snap.docs;
    }

    // Convert Firestore docs to SystemAuditLog items
    const rawLogs: SystemAuditLog[] = snapshotDocs.map(d => ({
      id: d.id,
      ...(d.data() as Omit<SystemAuditLog, 'id'>)
    }));

    // Ensure sorted desc by timestamp
    rawLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Additional client filtering if specific date or search requested
    let filteredLogs = rawLogs;

    if (selectedDate) {
      filteredLogs = filteredLogs.filter(log => {
        if (!log.timestamp) return false;
        return log.timestamp.startsWith(selectedDate);
      });
    } else if (startDate || endDate) {
      filteredLogs = filteredLogs.filter(log => {
        if (!log.timestamp) return false;
        const logDate = log.timestamp.split('T')[0];
        if (startDate && logDate < startDate) return false;
        if (endDate && logDate > endDate) return false;
        return true;
      });
    }

    if (category !== 'ALL') {
      filteredLogs = filteredLogs.filter(log => {
        switch (category) {
          case 'DELETE':
            return log.actionType.startsWith('DELETE_');
          case 'EDIT':
            return log.actionType.startsWith('UPDATE_') || log.actionType === 'RENEW_CLIENT';
          case 'CHECKIN':
            return log.actionType === 'CHECK_IN' || log.actionType === 'CANCEL_CHECK_IN';
          case 'EXPENSE':
            return log.actionType.includes('EXPENSE');
          default:
            return true;
        }
      });
    }

    if (searchTerm) {
      const lower = searchTerm.toLowerCase().trim();
      filteredLogs = filteredLogs.filter(log => 
        (log.targetName && log.targetName.toLowerCase().includes(lower)) ||
        (log.summary && log.summary.toLowerCase().includes(lower)) ||
        (log.details && log.details.toLowerCase().includes(lower))
      );
    }

    const lastVisibleDoc = snapshotDocs.length > 0 ? snapshotDocs[snapshotDocs.length - 1] : null;
    const hasMore = snapshotDocs.length >= queryLimit;

    return {
      logs: filteredLogs,
      lastVisibleDoc,
      hasMore
    };
  } catch (err: any) {
    console.error('Error in fetchAuditLogs:', err);
    return {
      logs: [],
      lastVisibleDoc: null,
      hasMore: false,
      error: err?.message || 'Lỗi khi tải lịch sử thao tác'
    };
  }
}
