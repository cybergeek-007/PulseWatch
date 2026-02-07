/**
 * Route exports and main router
 */
import { Router, Request, Response } from 'express';
import authRoutes from './auth.routes';
import monitorRoutes from './monitor.routes';
import { HTTP_STATUS } from '@pulsewatch/shared';

const router = Router();

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/monitors', monitorRoutes);

export default router;
