import express from 'express'
import { 
  createExam, 
  getExams, 
  getExamById, 
  submitExam, 
  getExamSubmissions,
  gradeExam
} from '../controllers/exams.js'
import { verifyToken, requireRole } from '../middleware/auth.js'

const router = express.Router()

router.post('/', verifyToken, requireRole(['teacher', 'admin']), createExam)
router.get('/', verifyToken, getExams)
router.get('/:id', verifyToken, getExamById)
router.post('/:id/submit', verifyToken, submitExam)
router.get('/:id/submissions', verifyToken, getExamSubmissions)
router.post('/:id/grade', verifyToken, requireRole(['teacher', 'admin']), gradeExam)

export default router