/**
 * 访谈路由
 * 创建日期: 2026-07-10
 */

const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interview.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

router.post('/', authenticate, interviewController.createInterview);
router.get('/', authenticate, interviewController.getInterviewList);
router.get('/:id', authenticate, interviewController.getInterviewById);
router.post('/:id/messages', authenticate, interviewController.addMessage);
router.post('/:id/complete', authenticate, interviewController.completeInterview);
router.post('/:id/summary', authenticate, interviewController.generateAISummary);

module.exports = router;