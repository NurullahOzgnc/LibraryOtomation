import { Router } from 'express';
import {
  getDevices,
  getDeviceById,
  createDevice,
  updateDevice,
  deleteDevice,
  reserveDevice,
  getReservations,
  getMyReservations,
  cancelReservation,
  completeReservation,
  getDeviceUsage,
} from './device.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requireAdmin, requireUser } from '../../middlewares/role.middleware';

const router = Router();

router.get('/', getDevices);
router.post('/', authMiddleware, requireAdmin, createDevice);
router.get('/reservations', authMiddleware, requireAdmin, getReservations);
router.get('/reservations/me', authMiddleware, requireUser, getMyReservations);
router.patch('/reservations/:id/cancel', authMiddleware, cancelReservation);
router.post('/reservations/:id/complete', authMiddleware, requireAdmin, completeReservation);
router.get('/:id/usage', authMiddleware, requireAdmin, getDeviceUsage);
router.post('/:id/reserve', authMiddleware, requireUser, reserveDevice);
router.get('/:id', getDeviceById);
router.put('/:id', authMiddleware, requireAdmin, updateDevice);
router.delete('/:id', authMiddleware, requireAdmin, deleteDevice);

export default router;
