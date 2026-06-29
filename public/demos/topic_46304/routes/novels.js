/* ============================================================
 * 小说 CRUD API 路由（IGA Pages 内存版）
 * ============================================================ */
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const store = require('../lib/store');

router.get('/', (req, res) => {
  const novels = store.getAllNovels();
  res.json({ ok: true, data: novels });
});

router.get('/:id', (req, res) => {
  const novel = store.getNovel(req.params.id);
  if (!novel) return res.status(404).json({ ok: false, error: '小说不存在' });
  res.json({ ok: true, data: novel });
});

router.post('/', (req, res) => {
  const novel = {
    id: uuidv4(),
    ...req.body,
    status: 'created',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  store.insertNovel(novel);
  res.json({ ok: true, data: novel });
});

router.put('/:id', (req, res) => {
  const updates = { ...req.body, updated_at: new Date().toISOString() };
  store.updateNovel(req.params.id, updates);
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  store.deleteNovel(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
