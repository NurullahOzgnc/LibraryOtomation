import { Router } from 'express';
import { getLoans, createLoan, returnBook, getLoanById } from './loan.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requireAdmin } from '../../middlewares/role.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', requireAdmin, getLoans);              // Admin: tüm işlemleri listele
router.get('/:id', getLoanById);                     // Tekil işlem
router.post('/', createLoan);                        // Kullanıcı ödünç alma talebi
router.patch('/:id/return', requireAdmin, returnBook); // Admin iade onayı

export default router;
