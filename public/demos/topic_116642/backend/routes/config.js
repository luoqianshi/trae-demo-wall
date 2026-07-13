const express = require('express');
const router = express.Router();

const apiConfig = {
  sightengine: {
    enabled: true,
    name: 'Sightengine',
    description: '支持浏览器端直接调用，准确率高',
    endpoint: 'https://api.sightengine.com/1.0/check.json',
    requiresAuth: true,
    authType: 'basic'
  },
  hive: {
    enabled: true,
    name: 'Hive AI',
    description: '准确率高，支持区域分析',
    endpoint: 'https://api.hivemoderation.com/api/v1/image/check',
    requiresAuth: true,
    authType: 'token'
  },
  realityDefender: {
    enabled: true,
    name: 'Reality Defender',
    description: '专注Deepfake检测',
    endpoint: 'https://api.realitydefender.com/api/v2/analyze',
    requiresAuth: true,
    authType: 'apiKey'
  },
  aiOrNot: {
    enabled: false,
    name: 'AI or Not',
    description: '操作简单，快速检测',
    endpoint: 'https://api.aiornot.com/v1/analyze',
    requiresAuth: false,
    authType: null
  },
  dashscope: {
    enabled: false,
    name: '通义千问视觉',
    description: '支持中文场景',
    endpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/image-detect',
    requiresAuth: true,
    authType: 'bearer'
  }
};

router.get('/apis', (req, res) => {
  res.json({ success: true, data: apiConfig });
});

router.put('/apis/:apiName', (req, res) => {
  const { apiName } = req.params;
  const { enabled, credentials } = req.body;
  
  if (!apiConfig[apiName]) {
    return res.status(404).json({ error: 'API不存在' });
  }
  
  apiConfig[apiName].enabled = enabled !== undefined ? enabled : apiConfig[apiName].enabled;
  
  if (credentials) {
    process.env[`${apiName.toUpperCase()}_API_KEY`] = credentials.apiKey;
    process.env[`${apiName.toUpperCase()}_USERNAME`] = credentials.username;
    process.env[`${apiName.toUpperCase()}_PASSWORD`] = credentials.password;
  }
  
  res.json({ success: true, data: apiConfig[apiName] });
});

router.get('/strategies', (req, res) => {
  const strategies = {
    financial: {
      apis: ['sightengine', 'realityDefender'],
      weights: { sightengine: 0.6, realityDefender: 0.4 },
      thresholds: { safe: 30, suspicious: 60, highRisk: 80 }
    },
    social: {
      apis: ['sightengine', 'hive'],
      weights: { sightengine: 0.5, hive: 0.5 },
      thresholds: { safe: 30, suspicious: 60, highRisk: 80 }
    },
    shopping: {
      apis: ['sightengine', 'aiOrNot'],
      weights: { sightengine: 0.7, aiOrNot: 0.3 },
      thresholds: { safe: 30, suspicious: 60, highRisk: 80 }
    },
    news: {
      apis: ['sightengine', 'dashscope'],
      weights: { sightengine: 0.5, dashscope: 0.5 },
      thresholds: { safe: 30, suspicious: 60, highRisk: 80 }
    }
  };
  res.json({ success: true, data: strategies });
});

router.put('/strategies/:scene', (req, res) => {
  const { scene } = req.params;
  const { apis, weights, thresholds } = req.body;
  
  res.json({ 
    success: true, 
    message: `场景 ${scene} 的策略已更新`,
    data: { apis, weights, thresholds }
  });
});

module.exports = router;
