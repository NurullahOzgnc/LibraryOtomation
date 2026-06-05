import { Router } from 'express';
import { 
  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser,
  banUser,
  unbanUser,
  acceptTerms,
  checkTerms
} from './user.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requireAdmin } from '../../middlewares/role.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', requireAdmin, getAllUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', requireAdmin, deleteUser);

// ─── Ban yönetimi ───────────────────────────────────────────────────────────
router.post('/:id/ban', requireAdmin, banUser);
router.post('/:id/unban', requireAdmin, unbanUser);

// ─── Terms & Policies ───────────────────────────────────────────────────────
router.post('/terms/accept', acceptTerms);
router.get('/terms/check', checkTerms);

export default router;
