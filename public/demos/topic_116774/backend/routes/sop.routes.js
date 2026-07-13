/**
 * SOP·��
 * ��������: 2026-07-10
 */

const express = require('express');
const router = express.Router();
const sopController = require('../controllers/sop.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/', sopController.getSOPList);
router.get('/:id', sopController.getSOPById);

module.exports = router;
