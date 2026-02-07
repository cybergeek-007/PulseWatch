/**
 * Incident-related TypeScript interfaces and types
 * Shared between client, server, and worker packages
 */

export type IncidentStatus = 'open' | 'acknowledged' | 'resolved' | 'closed';
export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface IIncident {
  id: string;
  monitor_id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: IncidentStatus;
  severity: IncidentSeverity;
  started_at: Date;
  acknowledged_at: Date | null;
  acknowledged_by: string | null;
  resolved_at: Date | null;
  resolved_by: string | null;
  resolution_notes: string | null;
  post_mortem: string | null;
  root_cause: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface IIncidentWithMonitor extends IIncident {
  monitor_name: string;
  monitor_url: string;
}

export interface ICreateIncidentRequest {
  monitor_id: string;
  title: string;
  description?: string;
  severity?: IncidentSeverity;
}

export interface IUpdateIncidentRequest {
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  acknowledged_by?: string;
  resolved_by?: string;
  resolution_notes?: string;
  post_mortem?: string;
  root_cause?: string;
}

export interface IIncidentListResponse {
  incidents: IIncidentWithMonitor[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface IIncidentFilters {
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  monitor_id?: string;
  start_date?: Date;
  end_date?: Date;
  page?: number;
  limit?: number;
}
