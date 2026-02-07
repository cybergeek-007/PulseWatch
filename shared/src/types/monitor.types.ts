/**
 * Monitor-related TypeScript interfaces and types
 * Shared between client, server, and worker packages
 */

export type MonitorType = 'http' | 'https' | 'tcp' | 'ping' | 'grpc';
export type MonitorMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
export type MonitorStatus = 'up' | 'down' | 'paused' | 'pending';
export type MonitorInterval = 60000 | 300000 | 900000 | 1800000; // 1min, 5min, 15min, 30min

export interface IMonitor {
  id: string;
  user_id: string;
  name: string;
  url: string;
  type: MonitorType;
  method: MonitorMethod;
  headers: Record<string, string> | null;
  body: string | null;
  interval: MonitorInterval;
  timeout: number;
  retries: number;
  status: MonitorStatus;
  expected_status_code: number | null;
  expected_response_content: string | null;
  follow_redirects: boolean;
  verify_ssl: boolean;
  regions: string[];
  last_checked_at: Date | null;
  last_status_change_at: Date | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  is_active: boolean;
}

export interface IMonitorWithStats extends IMonitor {
  uptime_percentage_24h: number;
  uptime_percentage_7d: number;
  uptime_percentage_30d: number;
  avg_response_time: number;
  total_checks_24h: number;
  failed_checks_24h: number;
}

export interface ICreateMonitorRequest {
  name: string;
  url: string;
  type?: MonitorType;
  method?: MonitorMethod;
  headers?: Record<string, string>;
  body?: string;
  interval?: MonitorInterval;
  timeout?: number;
  retries?: number;
  expected_status_code?: number;
  expected_response_content?: string;
  follow_redirects?: boolean;
  verify_ssl?: boolean;
  regions?: string[];
}

export interface IUpdateMonitorRequest {
  name?: string;
  url?: string;
  type?: MonitorType;
  method?: MonitorMethod;
  headers?: Record<string, string>;
  body?: string;
  interval?: MonitorInterval;
  timeout?: number;
  retries?: number;
  expected_status_code?: number;
  expected_response_content?: string;
  follow_redirects?: boolean;
  verify_ssl?: boolean;
  regions?: string[];
  status?: MonitorStatus;
}

export interface IMonitorListResponse {
  monitors: IMonitorWithStats[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface IMonitorFilters {
  status?: MonitorStatus;
  type?: MonitorType;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: 'name' | 'status' | 'last_checked_at' | 'created_at';
  sort_order?: 'asc' | 'desc';
}
