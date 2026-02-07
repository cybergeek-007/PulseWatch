/**
 * Monitor service - business logic for monitor management
 */
import { logger } from '../config/logger';
import * as MonitorModel from '../models/monitor.model';
import type {
  IMonitor,
  IMonitorWithStats,
  ICreateMonitorRequest,
  IUpdateMonitorRequest,
  IMonitorFilters,
  IMonitorListResponse,
} from '@pulsewatch/shared';

// Maximum monitors per user (can be configured per plan in the future)
const MAX_MONITORS_PER_USER = 50;

/**
 * Create a new monitor
 */
export async function createMonitor(
  userId: string,
  data: ICreateMonitorRequest
): Promise<IMonitor> {
  // Check monitor limit
  const currentCount = await MonitorModel.countByUser(userId);
  if (currentCount >= MAX_MONITORS_PER_USER) {
    throw new Error(`Maximum monitor limit (${MAX_MONITORS_PER_USER}) reached`);
  }

  // Validate URL
  validateMonitorUrl(data.url, data.type);

  // Validate interval
  const validIntervals = [60000, 300000, 900000, 1800000];
  if (data.interval && !validIntervals.includes(data.interval)) {
    throw new Error('Invalid interval. Must be one of: 1min, 5min, 15min, 30min');
  }

  // Create monitor
  const monitor = await MonitorModel.create(userId, data);

  // TODO: Schedule first check via worker queue

  return monitor;
}

/**
 * Get a monitor by ID
 */
export async function getMonitor(
  monitorId: string,
  userId: string
): Promise<IMonitorWithStats | null> {
  const monitor = await MonitorModel.findByIdAndUser(monitorId, userId);
  if (!monitor) return null;

  // Get stats (simplified - in production, use the view)
  return {
    ...monitor,
    uptime_percentage_24h: 100,
    uptime_percentage_7d: 100,
    uptime_percentage_30d: 100,
    avg_response_time: 0,
    total_checks_24h: 0,
    failed_checks_24h: 0,
  };
}

/**
 * List monitors for a user
 */
export async function listMonitors(
  userId: string,
  filters: IMonitorFilters = {}
): Promise<IMonitorListResponse> {
  const { monitors, total } = await MonitorModel.listByUser(userId, filters);

  const limit = filters.limit || 20;
  const page = filters.page || 1;

  return {
    monitors,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Update a monitor
 */
export async function updateMonitor(
  monitorId: string,
  userId: string,
  updates: IUpdateMonitorRequest
): Promise<IMonitor> {
  // Check if monitor exists and belongs to user
  const existingMonitor = await MonitorModel.findByIdAndUser(monitorId, userId);
  if (!existingMonitor) {
    throw new Error('Monitor not found');
  }

  // Validate URL if provided
  if (updates.url) {
    const type = updates.type || existingMonitor.type;
    validateMonitorUrl(updates.url, type);
  }

  // Validate interval if provided
  if (updates.interval) {
    const validIntervals = [60000, 300000, 900000, 1800000];
    if (!validIntervals.includes(updates.interval)) {
      throw new Error('Invalid interval. Must be one of: 1min, 5min, 15min, 30min');
    }
  }

  // Update monitor
  const updatedMonitor = await MonitorModel.update(monitorId, userId, updates);
  if (!updatedMonitor) {
    throw new Error('Failed to update monitor');
  }

  // TODO: Update schedule if interval changed

  return updatedMonitor;
}

/**
 * Delete a monitor
 */
export async function deleteMonitor(monitorId: string, userId: string): Promise<void> {
  const deleted = await MonitorModel.softDelete(monitorId, userId);
  if (!deleted) {
    throw new Error('Monitor not found');
  }

  // TODO: Cancel scheduled checks

  logger.info({ monitorId, userId }, 'Monitor deleted');
}

/**
 * Pause a monitor
 */
export async function pauseMonitor(monitorId: string, userId: string): Promise<IMonitor> {
  const monitor = await updateMonitor(monitorId, userId, { status: 'paused' });

  // TODO: Cancel scheduled checks

  logger.info({ monitorId, userId }, 'Monitor paused');
  return monitor;
}

/**
 * Resume a monitor
 */
export async function resumeMonitor(monitorId: string, userId: string): Promise<IMonitor> {
  const monitor = await updateMonitor(monitorId, userId, { status: 'pending' });

  // TODO: Schedule next check

  logger.info({ monitorId, userId }, 'Monitor resumed');
  return monitor;
}

/**
 * Validate monitor URL
 */
function validateMonitorUrl(url: string, type?: string): void {
  try {
    const parsedUrl = new URL(url);

    // Validate protocol based on type
    if (type === 'https' && parsedUrl.protocol !== 'https:') {
      throw new Error('HTTPS monitors must use https:// protocol');
    }

    if (type === 'http' && parsedUrl.protocol !== 'http:') {
      throw new Error('HTTP monitors must use http:// protocol');
    }

    // Validate hostname
    if (!parsedUrl.hostname || parsedUrl.hostname.length < 1) {
      throw new Error('Invalid URL: missing hostname');
    }

    // Block localhost and private IPs in production
    if (process.env.NODE_ENV === 'production') {
      const hostname = parsedUrl.hostname.toLowerCase();
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.')
      ) {
        throw new Error('Cannot monitor localhost or private IP addresses');
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid URL')) {
      throw new Error('Invalid URL format');
    }
    throw error;
  }
}

/**
 * Get monitors that need to be checked (for worker)
 */
export async function getMonitorsToCheck(): Promise<IMonitor[]> {
  return MonitorModel.getMonitorsToCheck();
}

/**
 * Update monitor status (called by worker)
 */
export async function updateMonitorStatus(
  monitorId: string,
  status: 'up' | 'down' | 'pending',
  consecutiveFailures: number
): Promise<void> {
  await MonitorModel.updateStatus(monitorId, status, consecutiveFailures);
}
