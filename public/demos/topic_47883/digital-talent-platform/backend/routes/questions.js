/**
 * 题库路由
 * 项目模拟题、标准考核题、行业认证真题、共建题目
 */

const express = require('express');
const db = require('../utils/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const QUESTION_TYPES = {
  SINGLE: 'single',     // 单选题
  MULTI: 'multi',       // 多选题
  JUDGE: 'judge',       // 判断题
  FILL: 'fill',         // 填空题
  ESSAY: 'essay'        // 简答题
};

/** GET /api/questions - 题目列表 */
router.get('/', (req, res) => {
  try {
    const { type, category, keyword, difficulty, page = 1, limit = 20 } = req.query;
    let list = db.getTable('questions');

    if (type) list = list.filter(q => q.type === type);
    if (category) list = list.filter(q => q.category === category);
    if (difficulty) list = list.filter(q => q.difficulty === difficulty);
    if (keyword) {
      const k = keyword.toLowerCase();
      list = list.filter(q => (q.content && q.content.toLowerCase().includes(k)));
    }

    const total = list.length;
    const paginated = list.slice((page - 1) * limit, page * limit).map(q => {
      const creator = db.findById('users', q.creatorId);
      return { ...q, creator: creator ? { id: creator.id, name: creator.name } : null };
    });

    res.json({ success: true, data: { list: paginated, pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) } } });
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

/** GET /api/questions/:id - 题目详情 */
router.get('/:id', (req, res) => {
  const q = db.findById('questions', req.params.id);
  if (!q) return res.status(404).json({ success: false, message: '题目不存在' });
  const creator = db.findById('users', q.creatorId);
  res.json({ success: true, data: { ...q, creator: creator ? { id: creator.id, name: creator.name } : null } });
});

/** POST /api/questions - 创建题目 */
router.post('/', authenticate, (req, res) => {
  const { type, content, options, correctAnswer, explanation, category, difficulty, score, tags } = req.body;
  if (!type || !content || !correctAnswer) {
    return res.status(400).json({ success: false, message: '题目类型、内容和正确答案必填' });
  }

  const question = db.insert('questions', {
    type, content,
    options: options || [],
    correctAnswer,
    explanation: explanation || '',
    category: category || '通用',
    difficulty: difficulty || 'medium',
    score: score || 10,
    tags: tags || [],
    creatorId: req.user.userId,
    usageCount: 0,
    status: 'active'
  });
  res.status(201).json({ success: true, message: '题目创建成功', data: question });
});

/** PUT /api/questions/:id - 更新题目 */
router.put('/:id', authenticate, (req, res) => {
  const q = db.findById('questions', req.params.id);
  if (!q) return res.status(404).json({ success: false, message: '题目不存在' });
  if (q.creatorId !== req.user.userId) return res.status(403).json({ success: false, message: '无权修改' });

  const allowed = ['content', 'options', 'correctAnswer', 'explanation', 'category', 'difficulty', 'score', 'tags', 'status'];
  const updates = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  const updated = db.update('questions', req.params.id, updates);
  res.json({ success: true, message: '更新成功', data: updated });
});

/** DELETE /api/questions/:id - 删除题目 */
router.delete('/:id', authenticate, (req, res) => {
  const q = db.findById('questions', req.params.id);
  if (!q) return res.status(404).json({ success: false, message: '题目不存在' });
  if (q.creatorId !== req.user.userId) return res.status(403).json({ success: false, message: '无权删除' });
  db.remove('questions', req.params.id);
  res.json({ success: true, message: '删除成功' });
});

/** POST /api/questions/:id/use - 记录题目被使用 */
router.post('/:id/use', (req, res) => {
  const q = db.findById('questions', req.params.id);
  if (!q) return res.status(404).json({ success: false, message: '题目不存在' });
  db.update('questions', req.params.id, { usageCount: (q.usageCount || 0) + 1 });
  res.json({ success: true, message: '使用次数已更新' });
});

module.exports = router;
