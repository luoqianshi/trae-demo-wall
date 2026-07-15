import { Router } from 'express';
import { register, login, getUserInfo, updateExamStage } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/user', authMiddleware, getUserInfo);
router.put('/user/exam-stage', authMiddleware, updateExamStage);

export default router;
