/**
 * �Ǳ���·��
 * ��������: 2026-07-10
 */

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

router.get('/stats', authenticate, dashboardController.getDashboardStats);
router.get('/activity', authenticate, dashboardController.getRecentActivity);

module.exports = router;
