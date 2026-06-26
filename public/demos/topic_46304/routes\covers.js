/* ============================================================
 * 封面 API 路由（IGA Pages 内存版）
 * ============================================================ */
const express = require('express');
const router = express.Router();
const coverService = require('../lib/cover-service');

router.post('/generate', (req, res) => {
  try {
    const { novelId, title, genre, style, author, color } = req.body;
    if (!novelId) return res.json({ ok: false, error: '缺少 novelId' });
    const svg = coverService.generateCover({ title, genre, style, author, color });
    coverService.saveGeneratedCover(novelId, svg);
    res.json({ ok: true, data: svg, type: 'generated' });
  } catch (e) {
    res.json({ ok: false, error: e.message });
  }
});

router.post('/upload', (req, res) => {
  try {
    const { novelId, imageData } = req.body;
    if (!novelId || !imageData) return res.json({ ok: false, error: '缺少 novelId 或 imageData' });
    if (imageData.length > 7 * 1024 * 1024) return res.json({ ok: false, error: '图片过大（限制 5MB）' });
    coverService.uploadCover(novelId, imageData);
    res.json({ ok: true, type: 'custom' });
  } catch (e) {
    res.json({ ok: false, error: e.message });
  }
});

router.get('/:novelId', (req, res) => {
  try {
    const cover = coverService.getCover(req.params.novelId);
    if (!cover) return res.json({ ok: true, data: null });
    res.json({ ok: true, data: cover.data, type: cover.type, updatedAt: cover.updatedAt });
  } catch (e) {
    res.json({ ok: false, error: e.message });
  }
});

router.delete('/:novelId', (req, res) => {
  try {
    coverService.deleteCover(req.params.novelId);
    res.json({ ok: true });
  } catch (e) {
    res.json({ ok: false, error: e.message });
  }
});

module.exports = router;
