import express from 'express'
import { 
  getCourses, 
  getCourseById, 
  getCourseSections,
  enrollCourse,
  getUserCourses,
  updateProgress,
  getCertificates
} from '../controllers/courses.js'
import { verifyToken, requireRole } from '../middleware/auth.js'

const router = express.Router()

router.get('/', verifyToken, getCourses)
router.get('/:id', verifyToken, getCourseById)
router.get('/:id/sections', verifyToken, getCourseSections)
router.post('/:id/enroll', verifyToken, enrollCourse)
router.get('/user/my-courses', verifyToken, getUserCourses)
router.post('/:id/progress', verifyToken, updateProgress)
router.get('/user/certificates', verifyToken, getCertificates)

export default router