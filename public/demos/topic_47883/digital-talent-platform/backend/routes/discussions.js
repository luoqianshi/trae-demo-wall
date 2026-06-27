/**
 * 讨论区路由
 * 技术答疑、团队组建交流、企业导师答疑、经验分享、评审反馈
 */

const express = require('express');
const db = require('../utils/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const DISCUSSION_CATEGORIES = {
  TECH_QA: 'tech_qa',         // 项目技术答疑
  TEAM_RECRUIT: 'team_recruit', // 团队组建交流
  MENTOR_QA: 'mentor_qa',     // 企业导师答疑
  EXPERIENCE: 'experience',   // 项目经验分享
  REVIEW_FEEDBACK: 'review_feedback' // 评审反馈讨论
};

/** GET /api/discussions - 讨论主题列表 */
router.get('/', (req, res) => {
  try {
    const { category, keyword, page = 1, limit = 10 } = req.query;
    let list = db.getTable('discussions');

    if (category) list = list.filter(d => d.category === category);
    if (keyword) {
      const k = keyword.toLowerCase();
      list = list.filter(d => (d.title && d.title.toLowerCase().includes(k)) || (d.content && d.content.toLowerCase().includes(k)));
    }
    list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    const total = list.length;
    const paginated = list.slice((page - 1) * limit, page * limit).map(d => {
      const author = db.findById('users', d.authorId);
      const replies = db.find('discussion_replies', { discussionId: d.id });
      return {
        ...d,
        author: author ? { id: author.id, name: author.name, avatar: author.avatar, role: author.role } : null,
        replyCount: replies.length
      };
    });

    res.json({
      success: true,
      data: {
        list: paginated,
        pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

/** GET /api/discussions/:id - 讨论详情（含回复） */
router.get('/:id', (req, res) => {
  const d = db.findById('discussions', req.params.id);
  if (!d) return res.status(404).json({ success: false, message: '讨论不存在' });

  const author = db.findById('users', d.authorId);
  let replies = db.find('discussion_replies', { discussionId: d.id });
  replies.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  replies = replies.map(r => {
    const u = db.findById('users', r.authorId);
    return { ...r, author: u ? { id: u.id, name: u.name, avatar: u.avatar, role: u.role } : null };
  });

  db.update('discussions', d.id, { views: (d.views || 0) + 1 });

  res.json({
    success: true,
    data: {
      ...d,
      views: (d.views || 0) + 1,
      author: author ? { id: author.id, name: author.name, avatar: author.avatar, role: author.role } : null,
      replies
    }
  });
});

/** POST /api/discussions - 发起讨论 */
router.post('/', authenticate, (req, res) => {
  const { title, content, category, projectId } = req.body;
  if (!title || !content || !category) return res.status(400).json({ success: false, message: '标题、内容和分类必填' });
  if (!Object.values(DISCUSSION_CATEGORIES).includes(category)) return res.status(400).json({ success: false, message: '无效的分类' });

  const record = db.insert('discussions', {
    title, content, category,
    projectId: projectId || '',
    authorId: req.user.userId,
    authorRole: req.user.role,
    views: 0, isPinned: false, status: 'active'
  });
  res.status(201).json({ success: true, message: '发布成功', data: record });
});

/** POST /api/discussions/:id/replies - 回复讨论 */
router.post('/:id/replies', authenticate, (req, res) => {
  const d = db.findById('discussions', req.params.id);
  if (!d) return res.status(404).json({ success: false, message: '讨论不存在' });

  const { content, replyTo } = req.body;
  if (!content) return res.status(400).json({ success: false, message: '回复内容不能为空' });

  const reply = db.insert('discussion_replies', {
    discussionId: req.params.id,
    authorId: req.user.userId,
    authorRole: req.user.role,
    content,
    replyTo: replyTo || null
  });

  db.update('discussions', req.params.id, { updatedAt: new Date().toISOString() });
  res.status(201).json({ success: true, message: '回复成功', data: reply });
});

/** DELETE /api/discussions/:id - 删除讨论 */
router.delete('/:id', authenticate, (req, res) => {
  const d = db.findById('discussions', req.params.id);
  if (!d) return res.status(404).json({ success: false, message: '讨论不存在' });
  if (d.authorId !== req.user.userId) return res.status(403).json({ success: false, message: '无权删除' });

  // 级联删除回复
  const replies = db.find('discussion_replies', { discussionId: d.id });
  replies.forEach(r => db.remove('discussion_replies', r.id));
  db.remove('discussions', req.params.id);
  res.json({ success: true, message: '删除成功' });
});

module.exports = router;
module.exports.DISCUSSION_CATEGORIES = DISCUSSION_CATEGORIES;
