import express from 'express';
import { readStore, writeStore } from '../lib/store.js';

const ACHIEVEMENTS = [
  { id: 'first-lesson', name: '初出茅庐', description: '完成第一节课', icon: '🎯', requirement: { lessons: 1 } },
  { id: 'ten-lessons', name: '学习新手', description: '完成 10 节课', icon: '📚', requirement: { lessons: 10 } },
  { id: 'streak-3', name: '三日坚持', description: '连续学习 3 天', icon: '🔥', requirement: { streak: 3 } },
  { id: 'streak-7', name: '一周达人', description: '连续学习 7 天', icon: '⭐', requirement: { streak: 7 } },
  { id: 'streak-30', name: '月度之星', description: '连续学习 30 天', icon: '🏆', requirement: { streak: 30 } },
  { id: 'xp-100', name: '百分达成', description: '累计获得 100 XP', icon: '💯', requirement: { xp: 100 } },
  { id: 'xp-500', name: '学习高手', description: '累计获得 500 XP', icon: '🚀', requirement: { xp: 500 } },
  { id: 'xp-1000', name: '语言大师', description: '累计获得 1000 XP', icon: '👑', requirement: { xp: 1000 } },
  { id: 'multi-lang', name: '多语通', description: '学习 2 种以上语言', icon: '🌍', requirement: { languages: 2 } },
  { id: 'grammar-master', name: '语法达人', description: '完成 5 道语法题', icon: '✏️', requirement: { grammar: 5 } },
  { id: 'speaker', name: '口语新星', description: '完成 3 次口语跟读', icon: '🎤', requirement: { speaking: 3 } },
  { id: 'listener', name: '聆听者', description: '完成 5 次听力练习', icon: '🎧', requirement: { listening: 5 } },
];

router.get('/', (_req, res) => {
  res.json({ achievements: ACHIEVEMENTS });
});

router.get('/user/:userId', (req, res) => {
  const progress = readStore('progress', {});
  const users = readStore('users', []);
  const user = users.find((u) => u.id === req.params.userId);
  if (!user) return res.json({ earned: [], total: ACHIEVEMENTS.length });

  const userProgress = Object.keys(progress)
    .filter((k) => k.startsWith(req.params.userId + '-'))
    .map((k) => progress[k]);

  const totalLessons = userProgress.reduce((s, p) => s + (p.lessonsDone?.length || 0), 0);
  const totalXp = user.xp || 0;
  const maxStreak = Math.max(user.streak || 0, ...userProgress.map((p) => p.streakDays || 0));
  const languagesCount = userProgress.filter((p) => (p.lessonsDone?.length || 0) > 0).length;

  const activityTypeCount = {};
  userProgress.forEach((p) => {
    (p.history || []).forEach((h) => {
      activityTypeCount[h.activityType] = (activityTypeCount[h.activityType] || 0) + 1;
    });
  });

  const earned = ACHIEVEMENTS.filter((a) => {
    const r = a.requirement;
    if (r.lessons && totalLessons >= r.lessons) return true;
    if (r.streak && maxStreak >= r.streak) return true;
    if (r.xp && totalXp >= r.xp) return true;
    if (r.languages && languagesCount >= r.languages) return true;
    if (r.grammar && (activityTypeCount['grammar'] || 0) >= r.grammar) return true;
    if (r.speaking && (activityTypeCount['speaking'] || 0) >= r.speaking) return true;
    if (r.listening && (activityTypeCount['listening'] || 0) >= r.listening) return true;
    return false;
  });

  res.json({
    earned,
    total: ACHIEVEMENTS.length,
    stats: { totalLessons, totalXp, maxStreak, languagesCount },
  });
});

router.post('/unlock', (req, res) => {
  const { userId, achievementId } = req.body || {};
  const achieved = readStore('achieved', {});
  const list = achieved[userId] || [];
  if (!list.includes(achievementId)) list.push(achievementId);
  achieved[userId] = list;
  writeStore('achieved', achieved);
  res.json({ unlocked: list });
});

export { router as achievementsRouter, ACHIEVEMENTS };
