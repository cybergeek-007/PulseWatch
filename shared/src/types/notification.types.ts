/**
 * Notification-related TypeScript interfaces and types
 * Shared between client, server, and worker packages
 */

export type NotificationChannel = 'email' | 'webhook' | 'slack' | 'discord' | 'sms';
export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'delivered';

export interface INotification {
  id: string;
  user_id: string;
  incident_id: string | null;
  monitor_id: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  recipient: string;
  subject: string;
  content: string;
  error_message: string | null;
  sent_at: Date | null;
  delivered_at: Date | null;
  created_at: Date;
}

export interface INotificationPreference {
  id: string;
  user_id: string;
  channel: NotificationChannel;
  is_enabled: boolean;
  config: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface IEmailConfig {
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_pass: string;
  from_address: string;
  from_name: string;
}

export interface IWebhookConfig {
  url: string;
  headers?: Record<string, string>;
  secret?: string;
}

export interface ISlackConfig {
  webhook_url: string;
  channel?: string;
  username?: string;
}

export interface IDiscordConfig {
  webhook_url: string;
}

export interface INotificationTemplate {
  id: string;
  name: string;
  subject_template: string;
  body_template: string;
  channel: NotificationChannel;
  event_type: 'monitor_down' | 'monitor_up' | 'incident_created' | 'incident_resolved';
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
}
