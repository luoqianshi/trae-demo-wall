// AI 路由模块
// 提供菜品识别、推荐和标签查询功能

const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../database');
const { authRequired } = require('../middleware/auth');
const aiService = require('../services/ai-service');

const router = express.Router();

// 所有路由都需要登录认证
router.use(authRequired);

// 配置 multer 文件上传
const storage = multer.diskStorage({
  // 保存到 uploads 目录
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', '..', 'uploads'));
  },
  // 文件名使用时间戳 + 原始扩展名
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${Date.now()}${ext}`);
  }
});

// 文件过滤器，只允许图片
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('只支持 jpg、png、gif、webp 格式的图片'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 限制 10MB
});

/**
 * POST /recognize - 识别菜品
 * 接收 multipart/form-data 上传的图片文件（field name: "image"）
 * 返回: { success, data: { dish, confidence, alternatives, imagePath } }
 */
router.post('/recognize', upload.single('image'), async (req, res) => {
  try {
    // 检查是否上传了文件
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请上传图片文件（field name: image）'
      });
    }

    const absolutePath = req.file.path;
    // 返回给前端的相对路径
    const imagePath = `/uploads/${req.file.filename}`;

    // 调用 AI 服务识别菜品
    const result = await aiService.recognizeDish(absolutePath);

    res.json({
      success: true,
      data: {
        dish: result.dish,
        confidence: result.confidence,
        alternatives: result.alternatives || [],
        imagePath
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /recommend - 获取推荐
 * 返回: { success, data: [recommendations] }
 */
router.get('/recommend', (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit, 10) || 5;

    // 获取用户的历史记录作为推荐依据
    const rows = db.prepare('SELECT * FROM records WHERE user_id = ? ORDER BY created_at DESC').all(userId);

    // 调用 AI 服务获取推荐
    const recommendations = aiService.getRecommendations(rows, limit);

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /tags - 获取所有标签
 * 返回: { success, data: [tags] }
 */
router.get('/tags', (req, res) => {
  try {
    const tags = aiService.getAllTags();
    res.json({
      success: true,
      data: tags
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
