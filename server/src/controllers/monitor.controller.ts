/**
 * Monitor controller
 */
import { Request, Response } from 'express';
import { MonitorService } from '../services';
import { asyncHandler, ApiError, NotFoundError } from '../middleware';
import type { IApiResponse, IMonitor, IMonitorListResponse } from '@pulsewatch/shared';

/**
 * Create a new monitor
 * POST /api/monitors
 */
export const createMonitor = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const monitor = await MonitorService.createMonitor(userId, req.body);

  const response: IApiResponse<IMonitor> = {
    success: true,
    data: monitor,
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  res.status(201).json(response);
});

/**
 * List monitors
 * GET /api/monitors
 */
export const listMonitors = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  // Parse query parameters
  const filters = {
    page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
    status: req.query.status as any,
    type: req.query.type as any,
    search: req.query.search as string,
    sort_by: req.query.sort_by as any,
    sort_order: req.query.sort_order as any,
  };

  const result = await MonitorService.listMonitors(userId, filters);

  const response: IApiResponse<IMonitorListResponse> = {
    success: true,
    data: result,
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  res.status(200).json(response);
});

/**
 * Get a single monitor
 * GET /api/monitors/:id
 */
export const getMonitor = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params;

  const monitor = await MonitorService.getMonitor(id, userId);

  if (!monitor) {
    throw new NotFoundError('Monitor not found');
  }

  const response: IApiResponse<typeof monitor> = {
    success: true,
    data: monitor,
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  res.status(200).json(response);
});

/**
 * Update a monitor
 * PUT /api/monitors/:id
 */
export const updateMonitor = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params;

  const monitor = await MonitorService.updateMonitor(id, userId, req.body);

  const response: IApiResponse<IMonitor> = {
    success: true,
    data: monitor,
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  res.status(200).json(response);
});

/**
 * Delete a monitor
 * DELETE /api/monitors/:id
 */
export const deleteMonitor = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params;

  await MonitorService.deleteMonitor(id, userId);

  const response: IApiResponse<{ message: string }> = {
    success: true,
    data: { message: 'Monitor deleted successfully' },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  res.status(200).json(response);
});

/**
 * Pause a monitor
 * POST /api/monitors/:id/pause
 */
export const pauseMonitor = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params;

  const monitor = await MonitorService.pauseMonitor(id, userId);

  const response: IApiResponse<IMonitor> = {
    success: true,
    data: monitor,
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  res.status(200).json(response);
});

/**
 * Resume a monitor
 * POST /api/monitors/:id/resume
 */
export const resumeMonitor = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { id } = req.params;

  const monitor = await MonitorService.resumeMonitor(id, userId);

  const response: IApiResponse<IMonitor> = {
    success: true,
    data: monitor,
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  res.status(200).json(response);
});
