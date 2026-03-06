export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
}

export type LeadStage =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'IN_REVIEW'
  | 'CONFLICT_HOLD'
  | 'ENGAGED_PENDING'
  | 'READY_TO_CONVERT'
  | 'CONVERTED';

export type MatterStatus = 'ACTIVE' | 'CLOSED' | 'ON_HOLD' | 'ARCHIVED';

export type ConflictStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'CLEARED'
  | 'POTENTIAL_CONFLICT'
  | 'CONFIRMED_CONFLICT';

export type EngagementStatus = 'DRAFT' | 'IN_REVIEW' | 'SENT' | 'VIEWED' | 'SIGNED' | 'DECLINED' | 'EXPIRED';

export type ReviewGateStatus = 'PROPOSED' | 'IN_REVIEW' | 'APPROVED' | 'EXECUTED' | 'RETURNED';
