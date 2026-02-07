/**
 * Common API-related TypeScript interfaces and types
 * Shared between client, server, and worker packages
 */

export interface IApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: IApiError;
  meta?: IApiMeta;
}

export interface IApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
  stack?: string;
}

export interface IApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  total_pages?: number;
  timestamp: string;
  request_id?: string;
}

export interface IPaginationParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface IValidationError {
  field: string;
  message: string;
  value?: any;
}

// Socket.IO event types
export interface IServerToClientEvents {
  'monitor:status:changed': (data: { monitorId: string; status: string; timestamp: Date }) => void;
  'monitor:check:completed': (data: { monitorId: string; check: any }) => void;
  'incident:created': (data: { incidentId: string; monitorId: string; title: string }) => void;
  'incident:resolved': (data: { incidentId: string; monitorId: string; resolvedAt: Date }) => void;
  'notification:received': (data: { notification: any }) => void;
}

export interface IClientToServerEvents {
  'monitor:subscribe': (monitorId: string) => void;
  'monitor:unsubscribe': (monitorId: string) => void;
  'dashboard:subscribe': () => void;
  'dashboard:unsubscribe': () => void;
}

// Webhook payload types
export interface IWebhookPayload {
  event: 'monitor.up' | 'monitor.down' | 'incident.created' | 'incident.resolved' | 'incident.acknowledged';
  timestamp: string;
  data: any;
}

// Health check result from worker
export interface IHealthCheckResult {
  monitor_id: string;
  status: 'success' | 'failure';
  response_time_ms: number;
  status_code?: number;
  response_body?: string;
  response_headers?: Record<string, string>;
  error_message?: string;
  region: string;
  checked_at: Date;
}
