/**
 * User-related TypeScript interfaces and types
 * Shared between client, server, and worker packages
 */

export interface IUser {
  id: string;
  email: string;
  password_hash: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  is_email_verified: boolean;
  email_verified_at: Date | null;
  timezone: string;
  created_at: Date;
  updated_at: Date;
  last_login_at: Date | null;
  is_active: boolean;
}

export interface IUserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  timezone: string;
  is_email_verified: boolean;
  created_at: Date;
  last_login_at: Date | null;
}

export interface IUserSettings {
  user_id: string;
  notification_email: boolean;
  notification_webhook: boolean;
  notification_browser: boolean;
  webhook_url: string | null;
  alert_threshold_minutes: number;
  theme: 'light' | 'dark' | 'system';
  updated_at: Date;
}

export interface ICreateUserRequest {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  timezone?: string;
}

export interface ILoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface IAuthResponse {
  user: IUserProfile;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface ITokenPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface IPasswordResetRequest {
  email: string;
}

export interface IPasswordResetConfirm {
  token: string;
  new_password: string;
}

export interface IUpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  timezone?: string;
  avatar_url?: string;
}

export interface IChangePasswordRequest {
  current_password: string;
  new_password: string;
}
