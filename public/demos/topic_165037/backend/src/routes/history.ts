import { Router } from 'express';
import { getHistory, deleteHistory } from '../controllers/historyController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, getHistory);
router.delete('/:id', authMiddleware, deleteHistory);

export default router;
