/**
 * Status Page-related TypeScript interfaces and types
 * Shared between client, server, and worker packages
 */

export interface IStatusPage {
  id: string;
  user_id: string;
  slug: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  background_color: string;
  is_public: boolean;
  is_custom_domain: boolean;
  custom_domain: string | null;
  show_uptime_percentage: boolean;
  show_response_time: boolean;
  show_incident_history: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface IStatusPageMonitor {
  id: string;
  status_page_id: string;
  monitor_id: string;
  display_name: string;
  display_order: number;
  show_on_page: boolean;
  created_at: Date;
}

export interface IStatusPageWithMonitors extends IStatusPage {
  monitors: {
    id: string;
    display_name: string;
    status: string;
    uptime_24h: number;
    uptime_7d: number;
    uptime_30d: number;
    avg_response_time: number;
  }[];
}

export interface ICreateStatusPageRequest {
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  favicon_url?: string;
  primary_color?: string;
  background_color?: string;
  is_public?: boolean;
  show_uptime_percentage?: boolean;
  show_response_time?: boolean;
  show_incident_history?: boolean;
}

export interface IUpdateStatusPageRequest {
  name?: string;
  description?: string;
  logo_url?: string;
  favicon_url?: string;
  primary_color?: string;
  background_color?: string;
  is_public?: boolean;
  is_custom_domain?: boolean;
  custom_domain?: string;
  show_uptime_percentage?: boolean;
  show_response_time?: boolean;
  show_incident_history?: boolean;
}

export interface IPublicStatusPageResponse {
  name: string;
  description: string | null;
  logo_url: string | null;
  primary_color: string;
  background_color: string;
  overall_status: 'operational' | 'degraded' | 'partial_outage' | 'major_outage';
  monitors: {
    id: string;
    name: string;
    status: string;
    uptime_24h: number;
    uptime_7d: number;
    uptime_30d: number;
    avg_response_time: number;
  }[];
  incidents: {
    id: string;
    title: string;
    status: string;
    severity: string;
    started_at: Date;
    resolved_at: Date | null;
  }[];
}
