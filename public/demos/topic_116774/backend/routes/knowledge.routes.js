/**
 * 知识库路由
 * 创建日期: 2026-07-10
 */

const express = require('express');
const router = express.Router();
const knowledgeController = require('../controllers/knowledge.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

router.get('/', knowledgeController.getKnowledgeList);
router.get('/:id', knowledgeController.getKnowledgeById);
router.put('/:id/verify', authenticate, requireRole(['expert', 'admin']), knowledgeController.verifyKnowledge);
router.post('/:id/feedback', authenticate, knowledgeController.feedbackKnowledge);

module.exports = router;