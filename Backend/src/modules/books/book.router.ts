import { Router } from 'express';
import {
  getAllBooks, getBookById, createBook, updateBook, deleteBook, searchBookByIsbn, importBooksFromCsv,
} from './book.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { requireAdmin } from '../../middlewares/role.middleware';

const router = Router();

router.get('/', getAllBooks);
router.get('/:id', getBookById);
router.post('/isbn-lookup', authMiddleware, requireAdmin, searchBookByIsbn);
router.post('/import-csv', authMiddleware, requireAdmin, importBooksFromCsv);
router.post('/', authMiddleware, requireAdmin, createBook);
router.put('/:id', authMiddleware, requireAdmin, updateBook);
router.delete('/:id', authMiddleware, requireAdmin, deleteBook);

export default router;
