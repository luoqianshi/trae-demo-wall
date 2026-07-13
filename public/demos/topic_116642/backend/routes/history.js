const express = require('express');
const router = express.Router();

const history = [];

router.get('/', (req, res) => {
  const { page = 1, limit = 10, scene } = req.query;
  
  let filtered = history;
  if (scene) {
    filtered = filtered.filter(h => h.scene === scene);
  }
  
  const start = (page - 1) * limit;
  const end = start + parseInt(limit);
  
  res.json({
    success: true,
    total: filtered.length,
    page: parseInt(page),
    limit: parseInt(limit),
    data: filtered.slice(start, end)
  });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const record = history.find(h => h.id == id);
  
  if (!record) {
    return res.status(404).json({ error: '记录不存在' });
  }
  
  res.json({ success: true, data: record });
});

router.post('/', (req, res) => {
  const { scene, score, risk, filename, detectionTime } = req.body;
  
  const newRecord = {
    id: Date.now(),
    scene,
    score,
    risk,
    filename,
    detectionTime,
    createdAt: new Date().toISOString()
  };
  
  history.unshift(newRecord);
  
  res.json({ success: true, data: newRecord });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const index = history.findIndex(h => h.id == id);
  
  if (index === -1) {
    return res.status(404).json({ error: '记录不存在' });
  }
  
  history.splice(index, 1);
  
  res.json({ success: true, message: '记录已删除' });
});

router.delete('/', (req, res) => {
  history.length = 0;
  res.json({ success: true, message: '所有记录已清空' });
});

router.get('/stats', (req, res) => {
  const stats = {
    total: history.length,
    byScene: {},
    byRisk: {
      'safe': 0,
      'low-risk': 0,
      'suspicious': 0,
      'high-risk': 0
    },
    avgScore: 0
  };
  
  if (history.length > 0) {
    let totalScore = 0;
    
    history.forEach(record => {
      if (!stats.byScene[record.scene]) {
        stats.byScene[record.scene] = 0;
      }
      stats.byScene[record.scene]++;
      
      if (stats.byRisk[record.risk] !== undefined) {
        stats.byRisk[record.risk]++;
      }
      
      totalScore += record.score;
    });
    
    stats.avgScore = Math.round(totalScore / history.length * 10) / 10;
  }
  
  res.json({ success: true, data: stats });
});

module.exports = router;
