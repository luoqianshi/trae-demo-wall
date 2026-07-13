const express = require('express');
const router = express.Router();
const graphController = require('../controllers/knowledge-graph.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/', authenticate, graphController.getAllKnowledgeGraph);
router.get('/:id', authenticate, graphController.getKnowledgeGraph);

module.exports = router;