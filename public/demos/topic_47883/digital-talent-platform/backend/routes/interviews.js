/**
 * 远程面试/评审路由
 * 与企业微信打通、在线视频面试、远程答辩、实时点评
 */

const express = require('express');
const db = require('../utils/db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

const INTERVIEW_TYPES = {
  INTERVIEW: 'interview',   // 面试
  DEFENSE: 'defense',       // 答辩
  REVIEW: 'review',         // 评审
  MENTORING: 'mentoring'    // 指导
};

const INTERVIEW_STATUS = {
  SCHEDULED: 'scheduled',   // 已安排
  ONGOING: 'ongoing',       // 进行中
  COMPLETED: 'completed',   // 已完成
  CANCELLED: 'cancelled'    // 已取消
};

/** GET /api/interviews - 面试/评审列表 */
router.get('/', authenticate, (req, res) => {
  try {
    const { type, status, projectId, page = 1, limit = 10 } = req.query;
    let list = db.getTable('interviews');

    // 用户只能看到与自己相关的
    if (req.user.role === 'student') {
      list = list.filter(i => i.participants.includes(req.user.userId));
    } else if (req.user.role === 'teacher') {
      list = list.filter(i => i.hostId === req.user.userId || i.participants.includes(req.user.userId));
    }
    // 企业用户可以看到自己主持的所有

    if (type) list = list.filter(i => i.type === type);
    if (status) list = list.filter(i => i.status === status);
    if (projectId) list = list.filter(i => i.projectId === projectId);

    list.sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt));

    const total = list.length;
    const paginated = list.slice((page - 1) * limit, page * limit).map(i => {
      const host = db.findById('users', i.hostId);
      const project = db.findById('projects', i.projectId);
      return {
        ...i,
        host: host ? { id: host.id, name: host.name, role: host.role } : null,
        project: project ? { id: project.id, title: project.title } : null,
        participantCount: i.participants.length
      };
    });

    res.json({
      success: true,
      data: {
        list: paginated,
        pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

/** GET /api/interviews/:id - 面试详情 */
router.get('/:id', authenticate, (req, res) => {
  const interview = db.findById('interviews', req.params.id);
  if (!interview) return res.status(404).json({ success: false, message: '记录不存在' });

  const host = db.findById('users', interview.hostId);
  const project = db.findById('projects', interview.projectId);
  const participants = interview.participants.map(pid => {
    const u = db.findById('users', pid);
    return u ? { id: u.id, name: u.name, role: u.role, avatar: u.avatar } : null;
  }).filter(Boolean);

  res.json({
    success: true,
    data: {
      ...interview,
      host: host ? { id: host.id, name: host.name, role: host.role } : null,
      project: project ? { id: project.id, title: project.title } : null,
      participants
    }
  });
});

/** POST /api/interviews - 创建面试/评审 */
router.post('/', authenticate, requireRole('enterprise', 'teacher'), (req, res) => {
  const { title, type, projectId, participants, scheduledAt, duration, description, meetingLink } = req.body;
  if (!title || !type || !scheduledAt) {
    return res.status(400).json({ success: false, message: '标题、类型和时间必填' });
  }

  const interview = db.insert('interviews', {
    title, type,
    projectId: projectId || '',
    hostId: req.user.userId,
    participants: participants || [],
    scheduledAt,
    duration: duration || 60,
    description: description || '',
    meetingLink: meetingLink || '',
    status: INTERVIEW_STATUS.SCHEDULED,
    recordingUrl: '',
    feedback: [],
    wechatRoomId: ''
  });
  res.status(201).json({ success: true, message: '安排成功', data: interview });
});

/** POST /api/interviews/:id/start - 开始会议 */
router.post('/:id/start', authenticate, (req, res) => {
  const interview = db.findById('interviews', req.params.id);
  if (!interview) return res.status(404).json({ success: false, message: '记录不存在' });
  if (interview.hostId !== req.user.userId) return res.status(403).json({ success: false, message: '无权操作' });

  const updated = db.update('interviews', req.params.id, {
    status: INTERVIEW_STATUS.ONGOING,
    startedAt: new Date().toISOString()
  });
  res.json({ success: true, message: '会议已开始', data: updated });
});

/** POST /api/interviews/:id/end - 结束会议 */
router.post('/:id/end', authenticate, (req, res) => {
  const interview = db.findById('interviews', req.params.id);
  if (!interview) return res.status(404).json({ success: false, message: '记录不存在' });
  if (interview.hostId !== req.user.userId) return res.status(403).json({ success: false, message: '无权操作' });

  const { recordingUrl } = req.body;
  const updated = db.update('interviews', req.params.id, {
    status: INTERVIEW_STATUS.COMPLETED,
    endedAt: new Date().toISOString(),
    recordingUrl: recordingUrl || interview.recordingUrl
  });
  res.json({ success: true, message: '会议已结束', data: updated });
});

/** POST /api/interviews/:id/feedback - 添加点评 */
router.post('/:id/feedback', authenticate, requireRole('enterprise', 'teacher'), (req, res) => {
  const { targetUserId, content, score } = req.body;
  const interview = db.findById('interviews', req.params.id);
  if (!interview) return res.status(404).json({ success: false, message: '记录不存在' });

  const feedbackItem = {
    id: Date.now().toString(),
    fromId: req.user.userId,
    fromName: req.user.name,
    targetUserId: targetUserId || '',
    content: content || '',
    score: score || null,
    createdAt: new Date().toISOString()
  };

  const updatedFeedback = [...(interview.feedback || []), feedbackItem];
  db.update('interviews', req.params.id, { feedback: updatedFeedback });

  res.status(201).json({ success: true, message: '点评已添加', data: feedbackItem });
});

/** POST /api/interviews/:id/join - 加入会议（生成企业微信会议链接） */
router.post('/:id/join', authenticate, (req, res) => {
  const interview = db.findById('interviews', req.params.id);
  if (!interview) return res.status(404).json({ success: false, message: '记录不存在' });

  // 检查是否为参与者
  const isParticipant = interview.participants.includes(req.user.userId) || interview.hostId === req.user.userId;
  if (!isParticipant) return res.status(403).json({ success: false, message: '您未被邀请参加此会议' });

  // 实际环境：调用企业微信API生成会议链接
  // const wxMeetingUrl = generateWechatMeeting(interview.wechatRoomId, req.user.userId);

  res.json({
    success: true,
    data: {
      meetingLink: interview.meetingLink || 'https://work.weixin.qq.com/meeting/placeholder',
      roomId: interview.wechatRoomId || 'room-' + interview.id,
      role: interview.hostId === req.user.userId ? 'host' : 'participant'
    }
  });
});

module.exports = router;
