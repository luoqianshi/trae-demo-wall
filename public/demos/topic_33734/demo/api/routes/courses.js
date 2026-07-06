import express from 'express';
import { COURSES_DATA } from '../data/courses.js';

const router = express.Router();

router.get('/', (_req, res) => {
  const list = Object.values(COURSES_DATA).map((c) => ({
    code: c.code,
    name: c.name,
    flag: c.flag,
    description: c.description,
    levels: c.levels.map((l) => ({
      id: l.id,
      name: l.name,
      description: l.description,
      lessonsCount: l.lessons.length,
    })),
  }));
  res.json({ languages: list });
});

router.get('/:code', (req, res) => {
  const course = COURSES_DATA[req.params.code];
  if (!course) return res.status(404).json({ error: 'Not found' });
  res.json({ course });
});

router.get('/:code/level/:levelId', (req, res) => {
  const course = COURSES_DATA[req.params.code];
  if (!course) return res.status(404).json({ error: 'Not found' });
  const level = course.levels.find((l) => l.id === req.params.levelId);
  if (!level) return res.status(404).json({ error: 'Level not found' });
  res.json({ level });
});

router.get('/:code/level/:levelId/lesson/:lessonId', (req, res) => {
  const course = COURSES_DATA[req.params.code];
  if (!course) return res.status(404).json({ error: 'Not found' });
  const level = course.levels.find((l) => l.id === req.params.levelId);
  if (!level) return res.status(404).json({ error: 'Level not found' });
  const lesson = level.lessons.find((l) => l.id === req.params.lessonId);
  if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
  res.json({ lesson, levelName: level.name, courseName: course.name });
});

export { router as coursesRouter };
