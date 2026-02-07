-- ============================================
-- PulseWatch Initial Database Schema
-- PostgreSQL with TimescaleDB extension
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url TEXT,
    is_email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMPTZ,
    timezone VARCHAR(50) DEFAULT 'UTC',
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Indexes for users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;

-- ============================================
-- USER SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_email BOOLEAN DEFAULT TRUE,
    notification_webhook BOOLEAN DEFAULT FALSE,
    notification_browser BOOLEAN DEFAULT TRUE,
    webhook_url TEXT,
    alert_threshold_minutes INTEGER DEFAULT 5,
    theme VARCHAR(20) DEFAULT 'system',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- ============================================
-- PASSWORD RESET TOKENS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token_hash);
CREATE INDEX idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);

-- ============================================
-- EMAIL VERIFICATION TOKENS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX idx_email_verification_tokens_token ON email_verification_tokens(token_hash);

-- ============================================
-- REFRESH TOKENS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    revoked_by_ip INET,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by_ip INET
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);

-- ============================================
-- MONITORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS monitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'https',
    method VARCHAR(10) NOT NULL DEFAULT 'GET',
    headers JSONB,
    body TEXT,
    interval INTEGER NOT NULL DEFAULT 300000, -- 5 minutes in milliseconds
    timeout INTEGER NOT NULL DEFAULT 30000, -- 30 seconds
    retries INTEGER NOT NULL DEFAULT 3,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    expected_status_code INTEGER,
    expected_response_content TEXT,
    follow_redirects BOOLEAN DEFAULT TRUE,
    verify_ssl BOOLEAN DEFAULT TRUE,
    regions TEXT[] DEFAULT ARRAY['us-east-1'],
    last_checked_at TIMESTAMPTZ,
    last_status_change_at TIMESTAMPTZ,
    consecutive_failures INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Indexes for monitors
CREATE INDEX idx_monitors_user_id ON monitors(user_id);
CREATE INDEX idx_monitors_status ON monitors(status);
CREATE INDEX idx_monitors_active ON monitors(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_monitors_deleted_at ON monitors(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_monitors_last_checked ON monitors(last_checked_at);
CREATE INDEX idx_monitors_user_status ON monitors(user_id, status);

-- ============================================
-- CHECKS TABLE (Time-series data with TimescaleDB)
-- ============================================
CREATE TABLE IF NOT EXISTS checks (
    id UUID,
    monitor_id UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    response_time_ms INTEGER NOT NULL,
    status_code INTEGER,
    response_body TEXT,
    response_headers JSONB,
    error_message TEXT,
    region VARCHAR(50) DEFAULT 'us-east-1',
    checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Convert to hypertable for time-series data
SELECT create_hypertable('checks', 'checked_at', if_not_exists => TRUE);

-- Indexes for checks
CREATE INDEX idx_checks_monitor_id ON checks(monitor_id);
CREATE INDEX idx_checks_status ON checks(status);
CREATE INDEX idx_checks_monitor_status ON checks(monitor_id, status);
CREATE INDEX idx_checks_region ON checks(region);

-- ============================================
-- INCIDENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    monitor_id UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    severity VARCHAR(20) NOT NULL DEFAULT 'medium',
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES users(id),
    resolution_notes TEXT,
    post_mortem TEXT,
    root_cause TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for incidents
CREATE INDEX idx_incidents_monitor_id ON incidents(monitor_id);
CREATE INDEX idx_incidents_user_id ON incidents(user_id);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_started_at ON incidents(started_at);
CREATE INDEX idx_incidents_user_status ON incidents(user_id, status);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,
    monitor_id UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
    channel VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    content TEXT,
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_monitor_id ON notifications(monitor_id);
CREATE INDEX idx_notifications_incident_id ON notifications(incident_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- ============================================
-- NOTIFICATION PREFERENCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel VARCHAR(20) NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, channel)
);

CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);

-- ============================================
-- STATUS PAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS status_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    logo_url TEXT,
    favicon_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#007bff',
    background_color VARCHAR(7) DEFAULT '#ffffff',
    is_public BOOLEAN DEFAULT TRUE,
    is_custom_domain BOOLEAN DEFAULT FALSE,
    custom_domain VARCHAR(255),
    show_uptime_percentage BOOLEAN DEFAULT TRUE,
    show_response_time BOOLEAN DEFAULT TRUE,
    show_incident_history BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_status_pages_user_id ON status_pages(user_id);
CREATE INDEX idx_status_pages_slug ON status_pages(slug);
CREATE INDEX idx_status_pages_custom_domain ON status_pages(custom_domain);
CREATE INDEX idx_status_pages_public ON status_pages(is_public) WHERE is_public = TRUE;

-- ============================================
-- STATUS PAGE MONITORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS status_page_monitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    status_page_id UUID NOT NULL REFERENCES status_pages(id) ON DELETE CASCADE,
    monitor_id UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
    display_name VARCHAR(255),
    display_order INTEGER DEFAULT 0,
    show_on_page BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(status_page_id, monitor_id)
);

CREATE INDEX idx_status_page_monitors_page_id ON status_page_monitors(status_page_id);
CREATE INDEX idx_status_page_monitors_monitor_id ON status_page_monitors(monitor_id);

-- ============================================
-- WEBHOOK DELIVERIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    monitor_id UUID NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
    incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,
    url TEXT NOT NULL,
    event VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    response_status INTEGER,
    response_body TEXT,
    error_message TEXT,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhook_deliveries_user_id ON webhook_deliveries(user_id);
CREATE INDEX idx_webhook_deliveries_monitor_id ON webhook_deliveries(monitor_id);
CREATE INDEX idx_webhook_deliveries_event ON webhook_deliveries(event);
CREATE INDEX idx_webhook_deliveries_created_at ON webhook_deliveries(created_at);

-- ============================================
-- AUDIT LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Convert to hypertable for time-series data
SELECT create_hypertable('audit_logs', 'created_at', if_not_exists => TRUE);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monitors_updated_at BEFORE UPDATE ON monitors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON incidents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_status_pages_updated_at BEFORE UPDATE ON status_pages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS
-- ============================================

-- Monitor stats view
CREATE OR REPLACE VIEW monitor_stats AS
SELECT 
    m.id,
    m.user_id,
    m.name,
    m.url,
    m.status,
    m.last_checked_at,
    COUNT(DISTINCT c.id) FILTER (WHERE c.checked_at > NOW() - INTERVAL '24 hours') as total_checks_24h,
    COUNT(DISTINCT c.id) FILTER (WHERE c.checked_at > NOW() - INTERVAL '24 hours' AND c.status = 'failure') as failed_checks_24h,
    COALESCE(
        100.0 - (COUNT(DISTINCT c.id) FILTER (WHERE c.checked_at > NOW() - INTERVAL '24 hours' AND c.status = 'failure') * 100.0 / 
        NULLIF(COUNT(DISTINCT c.id) FILTER (WHERE c.checked_at > NOW() - INTERVAL '24 hours'), 0)),
        100.0
    ) as uptime_percentage_24h,
    COALESCE(AVG(c.response_time_ms) FILTER (WHERE c.checked_at > NOW() - INTERVAL '24 hours'), 0) as avg_response_time_24h
FROM monitors m
LEFT JOIN checks c ON m.id = c.monitor_id
WHERE m.deleted_at IS NULL AND m.is_active = TRUE
GROUP BY m.id, m.user_id, m.name, m.url, m.status, m.last_checked_at;

-- Insert default user settings trigger
CREATE OR REPLACE FUNCTION create_default_user_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_settings (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_user_settings_after_insert
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_user_settings();
