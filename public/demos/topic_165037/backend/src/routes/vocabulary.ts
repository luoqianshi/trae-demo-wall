import { Router } from 'express';
import {
  getVocabulary,
  getTodayReview,
  addVocabulary,
  markWordKnown,
  deleteVocabulary
} from '../controllers/vocabularyController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, getVocabulary);
router.get('/today', authMiddleware, getTodayReview);
router.post('/', authMiddleware, addVocabulary);
router.put('/:wordId/mark-known', authMiddleware, markWordKnown);
router.delete('/:wordId', authMiddleware, deleteVocabulary);

export default router;
