/* ============================================================
 * 书架同步 API（IGA Pages 内存版）
 *
 * 使用 settings 内存存储完整 library JSON，key = 'library_data'。
 * ============================================================ */
const express = require('express');
const router = express.Router();
const store = require('../lib/store');

const LIBRARY_KEY = 'library_data';

function getLibrary() {
  const raw = store.getSetting(LIBRARY_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function saveLibrary(library) {
  store.setSetting(LIBRARY_KEY, JSON.stringify(library));
}

router.get('/', (req, res) => {
  const library = getLibrary();
  res.json({ ok: true, data: library });
});

router.put('/', (req, res) => {
  const library = req.body.library || req.body;
  saveLibrary(library);
  res.json({ ok: true });
});

router.get('/:id', (req, res) => {
  const library = getLibrary();
  const novel = library.find(n => n.id === req.params.id);
  if (!novel) return res.status(404).json({ ok: false, error: '小说不存在' });
  res.json({ ok: true, data: novel });
});

router.put('/:id', (req, res) => {
  const novel = req.body;
  const library = getLibrary();
  const idx = library.findIndex(n => n.id === req.params.id);
  if (idx >= 0) {
    library[idx] = novel;
  } else {
    library.unshift(novel);
  }
  saveLibrary(library);
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  let library = getLibrary();
  library = library.filter(n => n.id !== req.params.id);
  saveLibrary(library);
  res.json({ ok: true });
});

module.exports = router;
