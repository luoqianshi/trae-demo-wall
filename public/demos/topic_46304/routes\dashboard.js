/* ============================================================
 * Dashboard API 路由（IGA Pages 内存版）
 *
 * 从 library_data JSON 提取看板数据。
 * ============================================================ */
const express = require('express');
const router = express.Router();
const store = require('../lib/store');

const LIBRARY_KEY = 'library_data';

function findNovel(novelId) {
  const raw = store.getSetting(LIBRARY_KEY);
  if (!raw) return null;
  try {
    const library = JSON.parse(raw);
    return library.find(n => n.id === novelId) || null;
  } catch {
    return null;
  }
}

router.get('/:novelId/memory', (req, res) => {
  const empty = {
    stats: { atoms: 0, cards: 0, foreshadowings: 0 },
    atoms: [], cards: [], foreshadowings: [],
  };

  const novel = findNovel(req.params.novelId);
  if (!novel) return res.json({ ok: true, data: empty });

  const mem = novel.memory || {};
  const cards = mem.characterCards || [];
  const cardList = Array.isArray(cards)
    ? cards
    : Object.entries(cards).map(([name, c]) => ({ name, ...c }));
  const foreshadowings = mem.foreshadowing || mem.foreshadowings || [];

  const atoms = [];
  if (mem.atoms && Array.isArray(mem.atoms) && mem.atoms.length > 0) {
    atoms.push(...mem.atoms);
  } else if (mem.knowledgeBase) {
    const kb = mem.knowledgeBase;
    if (kb.characters) kb.characters.forEach(c => {
      atoms.push({ type: 'role', content: c.name + '：' + (c.personality || c.desc || ''), chapter: 0, importance: 0.9 });
    });
    if (kb.worldbuilding) kb.worldbuilding.forEach(w => {
      atoms.push({ type: 'worldview', content: w.content || w, chapter: 0, importance: 0.7 });
    });
    if (kb.plots) kb.plots.forEach(p => {
      atoms.push({ type: 'plot', content: p.content || p, chapter: 0, importance: 0.8 });
    });
    if (kb.styles) kb.styles.forEach(s => {
      atoms.push({ type: 'style', content: s.content || s, chapter: 0, importance: 0.6 });
    });
  }
  if (mem.keyEvents) mem.keyEvents.forEach(e => {
    atoms.push({ type: 'plot', content: e.content || e.description || String(e), chapter: e.chapter || 0, importance: 0.85 });
  });
  if (mem.storyBible && typeof mem.storyBible === 'string') {
    atoms.push({ type: 'worldview', content: mem.storyBible.substring(0, 200), chapter: 0, importance: 0.95 });
  }

  res.json({
    ok: true,
    data: {
      stats: { atoms: atoms.length, cards: cardList.length, foreshadowings: foreshadowings.length },
      atoms, cards: cardList, foreshadowings,
    },
  });
});

router.get('/:novelId/agent', (req, res) => {
  const empty = {
    stats: { totalDecisions: 0, activeDirectives: 0, successRate: 0 },
    directives: [], logs: [],
  };

  const novel = findNovel(req.params.novelId);
  if (!novel) return res.json({ ok: true, data: empty });

  const directives = novel.agentDirectives || [];
  const chapters = novel.chapters || [];
  const logs = [];

  if (novel.agentLogs && novel.agentLogs.length > 0) {
    logs.push(...novel.agentLogs);
  } else {
    chapters.forEach((c, i) => {
      if (c.score && c.score.overall) {
        logs.push({
          type: 'evaluation',
          message: '第' + (i + 1) + '章评分：' + (c.score.overall || 0).toFixed(1) + '分',
          timestamp: c.generatedAt || (novel.createdAt || 0) + i * 3600000,
        });
      }
      if (c.criticScore) {
        logs.push({
          type: 'critic',
          message: 'CriticAgent 评估第' + (i + 1) + '章',
          timestamp: c.generatedAt || (novel.createdAt || 0) + i * 3600000,
        });
      }
    });
  }

  res.json({
    ok: true,
    data: {
      stats: {
        totalDecisions: logs.length,
        activeDirectives: directives.filter(d => d.status !== 'completed' && d.status !== 'expired').length,
        successRate: 0,
      },
      directives, logs,
    },
  });
});

router.get('/:novelId/health', (req, res) => {
  const empty = {
    score: 60, alerts: [], chapterQualities: [],
    emotionCurve: [], qualityCurve: [], recommendations: [],
  };

  const novel = findNovel(req.params.novelId);
  if (!novel) return res.json({ ok: true, data: empty });

  const chapters = novel.chapters || [];
  const chapterQualities = chapters.map((c, i) => ({
    index: i,
    title: c.title || ('第' + (i + 1) + '章'),
    quality: c.score && c.score.overall ? c.score.overall : (c.quality || (c.status === 'done' ? 7.5 : 0)),
    status: c.status || 'pending',
  }));

  const scored = chapterQualities.filter(c => c.quality > 0);
  let score = 60;
  const alerts = [];

  if (scored.length > 0) {
    const avg = scored.reduce((s, c) => s + c.quality, 0) / scored.length;
    score = Math.round(avg * 10);
    scored.forEach(c => {
      if (c.quality < 6) {
        alerts.push({ level: 'danger', message: '第' + (c.index + 1) + '章质量偏低（' + c.quality.toFixed(1) + '分）', chapter: c.index });
      } else if (c.quality < 7) {
        alerts.push({ level: 'warning', message: '第' + (c.index + 1) + '章质量待提升（' + c.quality.toFixed(1) + '分）', chapter: c.index });
      }
    });
  }

  if (novel.memory && novel.memory.foreshadowing) {
    novel.memory.foreshadowing.forEach((f, i) => {
      if (f.status === 'planted' && f.plantedChapter !== undefined) {
        const age = chapters.length - f.plantedChapter;
        if (age > 10) {
          alerts.push({ level: 'warning', message: '伏笔"' + (f.description || f.content || '').substring(0, 20) + '"已超' + age + '章未回收', chapter: 0 });
        }
      }
    });
  }

  const qualityCurve = scored.map(c => ({ x: c.index, y: c.quality }));
  const emotionCurve = scored.map(c => ({ x: c.index, y: Math.round(c.quality * 10) }));

  res.json({
    ok: true,
    data: { score, alerts, chapterQualities, emotionCurve, qualityCurve, recommendations: [] },
  });
});

router.get('/:novelId/logs', (req, res) => {
  const novel = findNovel(req.params.novelId);
  if (!novel) return res.json({ ok: true, data: [] });

  const chapters = novel.chapters || [];
  const logs = [];

  if (novel.createdAt) {
    logs.push({ time: formatTime(novel.createdAt), message: '创建小说项目', type: 'info' });
  }
  if (novel.pipeline && novel.pipeline.startedAt) {
    logs.push({ time: formatTime(novel.pipeline.startedAt), message: '开始生成流程', type: 'info' });
  }
  chapters.forEach((c, i) => {
    if (c.generatedAt) {
      logs.push({ time: formatTime(c.generatedAt), message: '第' + (i + 1) + '章《' + (c.title || '') + '》生成完成', type: 'success' });
    }
    if (c.rewrittenAt) {
      logs.push({ time: formatTime(c.rewrittenAt), message: '第' + (i + 1) + '章重写完成', type: 'warn' });
    }
  });
  if (novel.pipeline && novel.pipeline.completedAt) {
    logs.push({ time: formatTime(novel.pipeline.completedAt), message: '生成流程完成', type: 'success' });
  }

  logs.reverse();
  res.json({ ok: true, data: logs });
});

function formatTime(ts) {
  if (!ts) return '-';
  const d = new Date(ts);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return mm + '-' + dd + ' ' + hh + ':' + mi;
}

module.exports = router;
