/**
 * 考试路由
 * 岗位技能认证、项目准入测评、阶段能力测试
 */

const express = require('express');
const db = require('../utils/db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

const EXAM_TYPES = {
  CERTIFICATION: 'certification', // 岗位技能认证
  ADMISSION: 'admission',         // 项目准入测评
  STAGE: 'stage'                  // 阶段能力测试
};

/** GET /api/exams - 考试列表 */
router.get('/', (req, res) => {
  try {
    const { type, keyword, status, page = 1, limit = 10 } = req.query;
    let list = db.getTable('exams');

    if (type) list = list.filter(e => e.type === type);
    if (status) list = list.filter(e => e.status === status);
    if (keyword) {
      const k = keyword.toLowerCase();
      list = list.filter(e => (e.title && e.title.toLowerCase().includes(k)));
    }
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = list.length;
    const paginated = list.slice((page - 1) * limit, page * limit).map(e => {
      const creator = db.findById('users', e.creatorId);
      return { ...e, creator: creator ? { id: creator.id, name: creator.name } : null };
    });

    res.json({ success: true, data: { list: paginated, pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) } } });
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

/** GET /api/exams/:id - 考试详情（含题目） */
router.get('/:id', (req, res) => {
  const exam = db.findById('exams', req.params.id);
  if (!exam) return res.status(404).json({ success: false, message: '考试不存在' });

  const questions = db.find('exam_questions', { examId: exam.id });
  const creator = db.findById('users', exam.creatorId);

  res.json({
    success: true,
    data: {
      ...exam,
      creator: creator ? { id: creator.id, name: creator.name } : null,
      questionCount: questions.length,
      totalScore: questions.reduce((sum, q) => sum + (q.score || 0), 0)
    }
  });
});

/** POST /api/exams - 创建考试（企业/教师） */
router.post('/', authenticate, requireRole('enterprise', 'teacher'), (req, res) => {
  const { title, description, type, duration, passScore, questionIds, status } = req.body;
  if (!title || !type) return res.status(400).json({ success: false, message: '标题和类型必填' });

  const exam = db.insert('exams', {
    title, description: description || '', type,
    duration: duration || 60,
    passScore: passScore || 60,
    creatorId: req.user.userId,
    questionIds: questionIds || [],
    status: status || 'draft'
  });
  res.status(201).json({ success: true, message: '考试创建成功', data: exam });
});

/** POST /api/exams/:id/start - 开始考试（学生） */
router.post('/:id/start', authenticate, requireRole('student'), (req, res) => {
  const exam = db.findById('exams', req.params.id);
  if (!exam) return res.status(404).json({ success: false, message: '考试不存在' });
  if (exam.status !== 'published') return res.status(400).json({ success: false, message: '考试未发布' });

  // 检查是否已参加过
  const existing = db.findOne('exam_records', { examId: req.params.id, studentId: req.user.userId });
  if (existing && existing.status === 'submitted') {
    return res.status(400).json({ success: false, message: '您已完成此考试' });
  }

  const questions = db.find('exam_questions', { examId: exam.id });
  const record = db.insert('exam_records', {
    examId: req.params.id,
    studentId: req.user.userId,
    startTime: new Date().toISOString(),
    endTime: null,
    answers: [],
    score: null,
    status: 'in_progress'
  });

  res.json({
    success: true,
    message: '考试开始',
    data: {
      recordId: record.id,
      exam: { id: exam.id, title: exam.title, duration: exam.duration },
      questions: questions.map(q => ({ id: q.id, type: q.type, content: q.content, options: q.options, score: q.score }))
    }
  });
});

/** POST /api/exams/:id/submit - 提交考试 */
router.post('/:id/submit', authenticate, requireRole('student'), (req, res) => {
  const { answers } = req.body;
  const exam = db.findById('exams', req.params.id);
  if (!exam) return res.status(404).json({ success: false, message: '考试不存在' });

  const record = db.findOne('exam_records', { examId: req.params.id, studentId: req.user.userId, status: 'in_progress' });
  if (!record) return res.status(400).json({ success: false, message: '没有找到进行中的考试记录' });

  // 自动评分
  const questions = db.find('exam_questions', { examId: exam.id });
  let totalScore = 0;
  const gradedAnswers = (answers || []).map(ans => {
    const q = questions.find(qx => qx.id === ans.questionId);
    const isCorrect = q && ans.answer === q.correctAnswer;
    const score = isCorrect ? (q.score || 0) : 0;
    totalScore += score;
    return { questionId: ans.questionId, answer: ans.answer, correct: isCorrect, score };
  });

  const passed = totalScore >= (exam.passScore || 60);

  db.update('exam_records', record.id, {
    endTime: new Date().toISOString(),
    answers: gradedAnswers,
    score: totalScore,
    status: 'submitted',
    passed
  });

  res.json({ success: true, message: '提交成功', data: { score: totalScore, passed, totalQuestions: questions.length } });
});

/** GET /api/exams/:id/records - 考试记录（创建者查看） */
router.get('/:id/records', authenticate, (req, res) => {
  const exam = db.findById('exams', req.params.id);
  if (!exam) return res.status(404).json({ success: false, message: '考试不存在' });

  let records = db.find('exam_records', { examId: req.params.id });
  records = records.map(r => {
    const s = db.findById('users', r.studentId);
    return { ...r, student: s ? { id: s.id, name: s.name } : null };
  });

  res.json({ success: true, data: records });
});

module.exports = router;
