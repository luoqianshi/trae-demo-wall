import express from 'express'
import { register, login, getUserInfo } from '../controllers/auth.js'
import { verifyToken } from '../middleware/auth.js'

const router = express.Router()

router.post('/register', register)
router.post('/login', login)
router.get('/me', verifyToken, getUserInfo)

export default router