import express from 'express'
import { 
  createClassroom, 
  getClassrooms, 
  getClassroomById, 
  joinClassroom, 
  leaveClassroom, 
  deleteClassroom,
  getClassroomUsers
} from '../controllers/classrooms.js'
import { verifyToken, requireRole } from '../middleware/auth.js'

const router = express.Router()

router.post('/', verifyToken, createClassroom)
router.get('/', verifyToken, getClassrooms)
router.get('/:id', verifyToken, getClassroomById)
router.get('/:id/users', verifyToken, getClassroomUsers)
router.post('/:id/join', verifyToken, joinClassroom)
router.post('/:id/leave', verifyToken, leaveClassroom)
router.delete('/:id', verifyToken, requireRole(['teacher', 'admin']), deleteClassroom)

export default router