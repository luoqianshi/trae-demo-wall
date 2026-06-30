// 路由配置
const express = require('express');
const router = express.Router();

const userController = require('./controllers/userController');
const chatController = require('./controllers/chatController');
const moodController = require('./controllers/moodController');
const artController = require('./controllers/artController');
const achievementController = require('./controllers/achievementController');
const testimonialController = require('./controllers/testimonialController');
const statsController = require('./controllers/statsController');

// ========== 用户相关 ==========
router.post('/user/login', userController.login);
router.get('/user/info', userController.getUserInfo);

// ========== AI对话相关 ==========
router.post('/chat/reply', chatController.getAIReply);
router.get('/chat/history', chatController.getChatHistory);
router.get('/chat/stats', chatController.getChatStats);

// ========== 情绪记录相关 ==========
router.post('/mood/record', moodController.recordMood);
router.get('/mood/trend', moodController.getMoodTrend);
router.get('/mood/stats', moodController.getMoodStats);

// ========== 绘画相关 ==========
router.post('/art/generate', artController.generateArt);
router.get('/art/history', artController.getArtHistory);

// ========== 成就相关 ==========
router.get('/achievements', achievementController.getUserAchievements);

// ========== 用户见证 ==========
router.get('/testimonials', testimonialController.getTestimonials);

// ========== 统计 ==========
router.get('/statistics', statsController.getStatistics);
router.get('/dashboard', statsController.getDashboard);
router.get('/stats/summary', statsController.getStatsSummary);

module.exports = router;
