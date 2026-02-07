/**
 * Monitor routes
 */
import { Router } from 'express';
import { MonitorController } from '../controllers';
import {
  authenticate,
  monitorCreateRateLimiter,
  validateRequest,
  createMonitorValidation,
  updateMonitorValidation,
  monitorIdValidation,
  listMonitorsValidation,
} from '../middleware';

const router = Router();

// All monitor routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/monitors
 * @desc    Create a new monitor
 * @access  Private
 */
router.post(
  '/',
  monitorCreateRateLimiter,
  validateRequest(createMonitorValidation),
  MonitorController.createMonitor
);

/**
 * @route   GET /api/monitors
 * @desc    List all monitors
 * @access  Private
 */
router.get(
  '/',
  validateRequest(listMonitorsValidation),
  MonitorController.listMonitors
);

/**
 * @route   GET /api/monitors/:id
 * @desc    Get a single monitor
 * @access  Private
 */
router.get(
  '/:id',
  validateRequest(monitorIdValidation),
  MonitorController.getMonitor
);

/**
 * @route   PUT /api/monitors/:id
 * @desc    Update a monitor
 * @access  Private
 */
router.put(
  '/:id',
  validateRequest(updateMonitorValidation),
  MonitorController.updateMonitor
);

/**
 * @route   DELETE /api/monitors/:id
 * @desc    Delete a monitor
 * @access  Private
 */
router.delete(
  '/:id',
  validateRequest(monitorIdValidation),
  MonitorController.deleteMonitor
);

/**
 * @route   POST /api/monitors/:id/pause
 * @desc    Pause a monitor
 * @access  Private
 */
router.post(
  '/:id/pause',
  validateRequest(monitorIdValidation),
  MonitorController.pauseMonitor
);

/**
 * @route   POST /api/monitors/:id/resume
 * @desc    Resume a monitor
 * @access  Private
 */
router.post(
  '/:id/resume',
  validateRequest(monitorIdValidation),
  MonitorController.resumeMonitor
);

export default router;
