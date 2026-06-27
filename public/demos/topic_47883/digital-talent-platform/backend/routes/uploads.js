/**
 * 文件上传路由
 * 处理项目成果、技术标准、头像等文件上传
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// 确保上传目录存在
const UPLOAD_DIR = path.join(__dirname, '../uploads');
const IMAGES_DIR = path.join(UPLOAD_DIR, 'images');
const DOCS_DIR = path.join(UPLOAD_DIR, 'documents');

[IMAGES_DIR, DOCS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 文件类型配置
const ALLOWED_TYPES = {
  'image/': IMAGES_DIR,
  'application/pdf': DOCS_DIR,
  'application/msword': DOCS_DIR,
  'application/vnd.openxmlformats-officedocument': DOCS_DIR,
  'text/': DOCS_DIR
};

// 存储引擎
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dest = DOCS_DIR;
    for (const [prefix, dir] of Object.entries(ALLOWED_TYPES)) {
      if (file.mimetype.startsWith(prefix) || file.mimetype === prefix) {
        dest = dir;
        break;
      }
    }
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 8)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// 文件过滤
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown'
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`不支持的文件类型: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

/**
 * POST /api/uploads
 * 上传文件（需登录）
 */
router.post('/', authenticate, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '未提供文件' });
    }

    const fileInfo = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: `/uploads/${path.basename(req.file.destination)}/${req.file.filename}`,
      uploadedBy: req.user.userId,
      uploadedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      message: '上传成功',
      data: fileInfo
    });
  } catch (err) {
    console.error('上传失败:', err);
    res.status(500).json({ success: false, message: '上传失败: ' + err.message });
  }
});

/**
 * POST /api/uploads/avatar
 * 上传头像（需登录）
 */
router.post('/avatar', authenticate, upload.single('avatar'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '未提供图片' });
    }

    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ success: false, message: '仅支持图片文件' });
    }

    const avatarUrl = `/uploads/images/${req.file.filename}`;

    res.json({
      success: true,
      message: '头像上传成功',
      data: { url: avatarUrl }
    });
  } catch (err) {
    console.error('头像上传失败:', err);
    res.status(500).json({ success: false, message: '上传失败' });
  }
});

/**
 * POST /api/uploads/multiple
 * 批量上传文件（需登录）
 */
router.post('/multiple', authenticate, upload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: '未提供文件' });
    }

    const files = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `/uploads/${path.basename(file.destination)}/${file.filename}`
    }));

    res.json({
      success: true,
      message: `成功上传 ${files.length} 个文件`,
      data: { files }
    });
  } catch (err) {
    console.error('批量上传失败:', err);
    res.status(500).json({ success: false, message: '上传失败' });
  }
});

module.exports = router;
