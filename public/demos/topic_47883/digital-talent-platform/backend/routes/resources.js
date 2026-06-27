/**
 * 资料库路由
 * 企业技术标准库、项目需求文档、学生作品集、课件教案
 */

const express = require('express');
const db = require('../utils/db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

const RESOURCE_TYPES = {
  STANDARD: 'standard',    // 企业技术标准
  DOCUMENT: 'document',    // 项目需求文档
  PORTFOLIO: 'portfolio',  // 学生作品集
  CASE: 'case',            // 行业案例
  COURSEWARE: 'courseware' // 课程课件与教案
};

/** GET /api/resources - 资料列表 */
router.get('/', (req, res) => {
  try {
    const { type, keyword, uploaderRole, page = 1, limit = 10 } = req.query;
    let list = db.getTable('resources');

    if (type) list = list.filter(r => r.type === type);
    if (uploaderRole) list = list.filter(r => r.uploaderRole === uploaderRole);
    if (keyword) {
      const k = keyword.toLowerCase();
      list = list.filter(r => (r.title && r.title.toLowerCase().includes(k)) || (r.description && r.description.toLowerCase().includes(k)));
    }
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = list.length;
    const paginated = list.slice((page - 1) * limit, page * limit).map(r => {
      const u = db.findById('users', r.uploaderId);
      return { ...r, uploader: u ? { id: u.id, name: u.name, orgName: u.orgName } : null };
    });

    res.json({ success: true, data: { list: paginated, pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) } } });
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

/** GET /api/resources/:id - 资料详情 */
router.get('/:id', (req, res) => {
  const r = db.findById('resources', req.params.id);
  if (!r) return res.status(404).json({ success: false, message: '资料不存在' });
  db.update('resources', r.id, { views: (r.views || 0) + 1 });
  const u = db.findById('users', r.uploaderId);
  res.json({ success: true, data: { ...r, views: (r.views || 0) + 1, uploader: u ? { id: u.id, name: u.name, orgName: u.orgName } : null } });
});

/** POST /api/resources - 上传资料 */
router.post('/', authenticate, (req, res) => {
  const { title, description, type, fileUrl, fileSize, fileType, tags } = req.body;
  if (!title || !type) return res.status(400).json({ success: false, message: '标题和类型必填' });
  if (!Object.values(RESOURCE_TYPES).includes(type)) return res.status(400).json({ success: false, message: '无效的资料类型' });

  const record = db.insert('resources', {
    title, description: description || '', type,
    fileUrl: fileUrl || '', fileSize: fileSize || 0, fileType: fileType || '',
    tags: tags || [], uploaderId: req.user.userId, uploaderRole: req.user.role,
    views: 0, downloads: 0, status: 'active'
  });
  res.status(201).json({ success: true, message: '上传成功', data: record });
});

/** PUT /api/resources/:id - 更新资料 */
router.put('/:id', authenticate, (req, res) => {
  const r = db.findById('resources', req.params.id);
  if (!r) return res.status(404).json({ success: false, message: '资料不存在' });
  if (r.uploaderId !== req.user.userId) return res.status(403).json({ success: false, message: '无权修改' });
  const allowed = ['title', 'description', 'tags', 'fileUrl', 'status'];
  const updates = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  const updated = db.update('resources', req.params.id, updates);
  res.json({ success: true, message: '更新成功', data: updated });
});

/** DELETE /api/resources/:id - 删除资料 */
router.delete('/:id', authenticate, (req, res) => {
  const r = db.findById('resources', req.params.id);
  if (!r) return res.status(404).json({ success: false, message: '资料不存在' });
  if (r.uploaderId !== req.user.userId) return res.status(403).json({ success: false, message: '无权删除' });
  db.remove('resources', req.params.id);
  res.json({ success: true, message: '删除成功' });
});

/** POST /api/resources/:id/download - 记录下载 */
router.post('/:id/download', (req, res) => {
  const r = db.findById('resources', req.params.id);
  if (!r) return res.status(404).json({ success: false, message: '资料不存在' });
  db.update('resources', req.params.id, { downloads: (r.downloads || 0) + 1 });
  res.json({ success: true, message: '下载计数已更新' });
});

module.exports = router;
