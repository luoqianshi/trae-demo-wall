/* ============================================================
 * 设置管理 API（IGA Pages 内存版）
 * ============================================================ */
const express = require('express');
const router = express.Router();
const store = require('../lib/store');

router.get('/', (req, res) => {
  const rawSettings = store.getAllSettings();
  const settings = {};
  for (const [key, value] of Object.entries(rawSettings)) {
    try { settings[key] = JSON.parse(value); } catch { settings[key] = value; }
  }
  res.json({ ok: true, data: settings });
});

router.post('/', (req, res) => {
  const { settings } = req.body;
  for (const [key, value] of Object.entries(settings)) {
    store.setSetting(key, JSON.stringify(value));
  }
  res.json({ ok: true });
});

router.get('/models', (req, res) => {
  const models = store.getAllModels();
  res.json({ ok: true, data: models });
});

router.post('/models', (req, res) => {
  const model = { id: 'm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8), ...req.body };
  store.insertModel(model);
  res.json({ ok: true, data: model });
});

router.delete('/models/:id', (req, res) => {
  store.deleteModel(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
