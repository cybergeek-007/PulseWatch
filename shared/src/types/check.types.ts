/**
 * Check (health check result) related TypeScript interfaces and types
 * Shared between client, server, and worker packages
 */

export type CheckStatus = 'success' | 'failure' | 'timeout' | 'error';

export interface ICheck {
  id: string;
  monitor_id: string;
  status: CheckStatus;
  response_time_ms: number;
  status_code: number | null;
  response_body: string | null;
  response_headers: Record<string, string> | null;
  error_message: string | null;
  region: string;
  checked_at: Date;
  created_at: Date;
}

export interface ICheckMetrics {
  monitor_id: string;
  period: '1h' | '24h' | '7d' | '30d';
  total_checks: number;
  successful_checks: number;
  failed_checks: number;
  uptime_percentage: number;
  avg_response_time: number;
  min_response_time: number;
  max_response_time: number;
  p50_response_time: number;
  p95_response_time: number;
  p99_response_time: number;
}

export interface ICheckHistoryResponse {
  checks: ICheck[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface ICheckFilters {
  status?: CheckStatus;
  region?: string;
  start_date?: Date;
  end_date?: Date;
  page?: number;
  limit?: number;
}
