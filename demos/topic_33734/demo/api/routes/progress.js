import express from 'express';
import { readStore, writeStore } from '../lib/store.js';

const router = express.Router();

router.post('/update', (req, res) => {
  const { userId, courseCode, levelId, lessonId, xp = 0, completed = false, activityType = 'lesson' } = req.body;
  if (!userId || !courseCode || !lessonId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const progress = readStore('progress', {});
  const key = `${userId}-${courseCode}`;
  const current = progress[key] || {
    userId,
    courseCode,
    xp: 0,
    lessonsDone: [],
    completedLevels: [],
    streakDays: 0,
    lastStudyDate: null,
    totalMinutes: 0,
    history: [],
  };
  current.xp += xp;
  if (completed && !current.lessonsDone.includes(lessonId)) {
    current.lessonsDone.push(lessonId);
  }
  const today = new Date().toDateString();
  if (current.lastStudyDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (current.lastStudyDate === yesterday.toDateString()) {
      current.streakDays += 1;
    } else {
      current.streakDays = 1;
    }
    current.lastStudyDate = today;
  }
  current.totalMinutes += Math.max(1, Math.floor(xp / 5));
  current.history.push({
    date: new Date().toISOString(),
    levelId,
    lessonId,
    xp,
    activityType,
  });
  progress[key] = current;
  writeStore('progress', progress);

  const users = readStore('users', []);
  const idx = users.findIndex((u) => u.id === userId);
  if (idx >= 0) {
    users[idx].xp = (users[idx].xp || 0) + xp;
    users[idx].level = Math.floor((users[idx].xp || 0) / 100) + 1;
    users[idx].streak = current.streakDays;
    users[idx].lastActive = new Date().toISOString();
    writeStore('users', users);
  }
  res.json({ progress: current, user: users[idx] });
});

router.get('/user/:userId', (req, res) => {
  const progress = readStore('progress', {});
  const userProgress = {};
  Object.keys(progress).forEach((key) => {
    if (key.startsWith(req.params.userId + '-')) {
      userProgress[key] = progress[key];
    }
  });
  res.json({ progress: userProgress });
});

router.get('/user/:userId/course/:courseCode', (req, res) => {
  const progress = readStore('progress', {});
  const key = `${req.params.userId}-${req.params.courseCode}`;
  res.json({ progress: progress[key] || null });
});

router.get('/leaderboard', (_req, res) => {
  const users = readStore('users', []);
  const sorted = [...users]
    .sort((a, b) => (b.xp || 0) - (a.xp || 0))
    .slice(0, 20)
    .map((u) => ({ id: u.id, username: u.username, avatar: u.avatar, xp: u.xp || 0, level: u.level || 1, streak: u.streak || 0 }));
  res.json({ leaderboard: sorted });
});

router.post('/recommend', (req, res) => {
  const { userId, courseCode, levelIds, lessonsDone } = req.body;
  const progress = readStore('progress', {});
  const key = `${userId}-${courseCode}`;
  const current = progress[key];
  const done = (current?.lessonsDone || []).concat(lessonsDone || []);

  let recommended = null;
  if (levelIds && levelIds.length > 0) {
    outer: for (const lid of levelIds) {
      const lessonIds = req.body.levelLessons?.[lid] || [];
      for (const lessonId of lessonIds) {
        if (!done.includes(lessonId)) {
          recommended = { levelId: lid, lessonId };
          break outer;
        }
      }
    }
  }
  const tip = (() => {
    if (!current || current.streakDays < 3) return '坚持每日学习，培养语言习惯！';
    if (current.xp < 50) return '先从单词记忆开始，打好基础。';
    if (current.xp < 200) return '试试口语跟读练习，提高发音准确度。';
    return '挑战更高级别的内容，保持学习热情！';
  })();
  res.json({ recommended, tip, doneCount: done.length });
});

export { router as progressRouter };
