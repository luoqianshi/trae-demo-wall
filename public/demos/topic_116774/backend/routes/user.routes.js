/**
 * 用户路由
 * 创建日期: 2026-07-10
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

router.get('/me', authenticate, userController.getCurrentUser);
router.put('/me', authenticate, userController.updateCurrentUser);
router.get('/', authenticate, requireRole(['admin']), userController.getUserList);
router.get('/:id', authenticate, requireRole(['admin']), userController.getUserById);
router.put('/:id', authenticate, requireRole(['admin']), userController.updateUser);

module.exports = router;