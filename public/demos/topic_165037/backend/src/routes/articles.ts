import { Router } from 'express';
import { getArticles, getArticleDetail, getQuiz, submitQuiz } from '../controllers/articleController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, getArticles);
router.get('/:id', authMiddleware, getArticleDetail);
router.get('/:id/quiz', authMiddleware, getQuiz);
router.post('/:id/quiz/submit', authMiddleware, submitQuiz);

export default router;
