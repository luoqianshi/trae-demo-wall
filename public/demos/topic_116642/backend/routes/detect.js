const express = require('express');
const router = express.Router();
const multer = require('multer');
const detectService = require('../services/detectService');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传图片' });
    }

    const scene = req.body.scene || 'social';
    const imageBuffer = req.file.buffer;

    const result = await detectService.detect(imageBuffer, scene);
    
    const recommendations = detectService.generateRecommendations(result.score, result.risk, scene);
    
    res.json({
      success: true,
      data: {
        ...result,
        recommendations,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Detection error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || '检测失败'
    });
  }
});

router.post('/batch', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: '请上传至少一张图片' });
    }

    const scene = req.body.scene || 'social';
    
    const results = await Promise.all(
      req.files.map(async (file, index) => {
        const result = await detectService.detect(file.buffer, scene);
        const recommendations = detectService.generateRecommendations(result.score, result.risk, scene);
        return {
          index,
          filename: file.originalname,
          ...result,
          recommendations
        };
      })
    );

    res.json({
      success: true,
      count: results.length,
      data: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Batch detection error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || '批量检测失败'
    });
  }
});

router.get('/strategies', (req, res) => {
  const strategies = {
    financial: {
      name: '金融反诈',
      apis: ['Sightengine', 'Reality Defender'],
      focus: ['证件真伪', '人脸比对', '安全评估'],
      description: '检测证件照片真伪、身份证识别、人脸比对，守护您的财产安全'
    },
    social: {
      name: '社交媒体',
      apis: ['Sightengine', 'Hive'],
      focus: ['人脸换脸', '深度伪造', '传播风险'],
      description: '检测人脸换脸、表情异常、视频截图，识别Deepfake伪造内容'
    },
    shopping: {
      name: '网购商品',
      apis: ['Sightengine', 'AI or Not'],
      focus: ['商品细节', '纹理分析', '真伪识别'],
      description: '检测商品图真伪、背景纹理重复、商品细节异常'
    },
    news: {
      name: '新闻图片',
      apis: ['Sightengine', '通义千问视觉'],
      focus: ['场景分析', '可信度', '事件验证'],
      description: '检测场景合理性、人物真实性、事件可信度评估'
    }
  };
  res.json({ success: true, data: strategies });
});

router.get('/health', async (req, res) => {
  try {
    res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
