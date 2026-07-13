import type { User, Child, Classroom, Participant, LearningRecord, GrowthReport } from '../types';

const STORAGE_KEY = 'tutoring-software-mock-db';

interface MockDB {
  users: User[];
  children: Child[];
  classrooms: Classroom[];
  participants: Participant[];
  learningRecords: LearningRecord[];
  smsCodes: Record<string, { code: string; expiresAt: number }>;
  sessions: Record<string, { userId: string; expiresAt: number }>;
}

export function loadDB(): MockDB {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const db = JSON.parse(raw);
      if (db.users && db.classrooms) return db;
    }
  } catch (e) {
    console.warn('Failed to load mock DB', e);
  }
  const fresh = createInitialDB();
  saveDB(fresh);
  return fresh;
}

export function saveDB(db: MockDB): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (e) {
    console.warn('Failed to save mock DB', e);
  }
}

export function resetDB(): MockDB {
  const fresh = createInitialDB();
  saveDB(fresh);
  return fresh;
}

function createInitialDB(): MockDB {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const yesterday = new Date(now.getTime() - 86400000).toISOString().slice(0, 10);
  const threeDaysAgo = new Date(now.getTime() - 3 * 86400000).toISOString().slice(0, 10);

  const users: User[] = [
    {
      id: 'u_parent_1',
      phone: '13800138001',
      nickname: '李家长',
      avatar: '',
      role: 'parent',
      createdAt: '2026-05-01T10:00:00Z',
    },
    {
      id: 'u_parent_2',
      phone: '13900139002',
      nickname: '王老师',
      avatar: '',
      role: 'parent',
      createdAt: '2026-04-15T09:00:00Z',
    },
    {
      id: 'u_student_1',
      phone: '13700137003',
      nickname: '李明',
      avatar: '',
      role: 'student',
      createdAt: '2026-05-10T14:00:00Z',
    },
    {
      id: 'u_student_2',
      phone: '13700137004',
      nickname: '张华',
      avatar: '',
      role: 'student',
      createdAt: '2026-05-12T14:00:00Z',
    },
    {
      id: 'u_admin',
      phone: '13000130000',
      nickname: '管理员',
      avatar: '',
      role: 'super_admin',
      createdAt: '2026-01-01T00:00:00Z',
    },
  ];

  const children: Child[] = [
    {
      id: 's_1',
      parentId: 'u_parent_1',
      nickname: '李明',
      grade: '三年级',
      age: 9,
      subjects: ['数学', '语文', '英语'],
    },
    {
      id: 's_2',
      parentId: 'u_parent_1',
      nickname: '李红',
      grade: '一年级',
      age: 6,
      subjects: ['语文', '数学'],
    },
    {
      id: 's_3',
      parentId: 'u_parent_2',
      nickname: '张华',
      grade: '四年级',
      age: 10,
      subjects: ['数学', '物理', '语文'],
    },
  ];

  const classrooms: Classroom[] = [
    {
      id: 'c_1',
      name: '数学基础辅导',
      description: '针对小学三年级数学基础概念进行系统辅导',
      startTime: `${today} 14:00`,
      endTime: `${today} 15:30`,
      status: 'ongoing',
      hostId: 'u_parent_2',
      hostName: '王老师',
      participantCount: 5,
      subject: '数学',
      agoraChannel: `agora_${Math.random().toString(36).slice(2, 10)}`,
    },
    {
      id: 'c_2',
      name: '英语阅读理解',
      description: '提升英语阅读能力，讲解阅读理解技巧',
      startTime: `${new Date(now.getTime() + 86400000).toISOString().slice(0, 10)} 10:00`,
      endTime: `${new Date(now.getTime() + 86400000).toISOString().slice(0, 10)} 11:30`,
      status: 'upcoming',
      hostId: 'u_parent_2',
      hostName: '王老师',
      participantCount: 0,
      subject: '英语',
      agoraChannel: `agora_${Math.random().toString(36).slice(2, 10)}`,
    },
    {
      id: 'c_3',
      name: '语文作文指导',
      description: '作文写作技巧与素材积累',
      startTime: `${yesterday} 16:00`,
      endTime: `${yesterday} 17:30`,
      status: 'ended',
      hostId: 'u_parent_2',
      hostName: '王老师',
      participantCount: 8,
      subject: '语文',
      agoraChannel: `agora_${Math.random().toString(36).slice(2, 10)}`,
    },
    {
      id: 'c_4',
      name: '物理实验讲解',
      description: '力学基础实验原理与操作方法',
      startTime: `${threeDaysAgo} 14:00`,
      endTime: `${threeDaysAgo} 15:30`,
      status: 'ended',
      hostId: 'u_parent_2',
      hostName: '王老师',
      participantCount: 6,
      subject: '物理',
      agoraChannel: `agora_${Math.random().toString(36).slice(2, 10)}`,
    },
  ];

  const participants: Participant[] = [
    { id: 'p_1', userId: 'u_parent_2', classroomId: 'c_1', name: '王老师', role: 'host', isOnline: true, isMuted: false, isCameraOn: true, isHandRaised: false },
    { id: 'p_2', userId: 'u_student_1', classroomId: 'c_1', name: '李明', role: 'student', isOnline: true, isMuted: true, isCameraOn: true, isHandRaised: false },
    { id: 'p_3', userId: 'u_student_2', classroomId: 'c_1', name: '张华', role: 'student', isOnline: true, isMuted: false, isCameraOn: false, isHandRaised: true },
    { id: 'p_4', classroomId: 'c_1', name: '王芳', role: 'student', isOnline: true, isMuted: false, isCameraOn: true, isHandRaised: false },
    { id: 'p_5', classroomId: 'c_1', name: '刘洋', role: 'student', isOnline: false, isMuted: true, isCameraOn: false, isHandRaised: false },
  ];

  const learningRecords: LearningRecord[] = [
    { id: 'r_1', classroomId: 'c_3', studentId: 's_1', studentName: '李明', date: yesterday, duration: 90, content: '学习了记叙文写作技巧，完成了一篇300字作文', score: 92, subject: '语文' },
    { id: 'r_2', classroomId: 'c_4', studentId: 's_1', studentName: '李明', date: threeDaysAgo, duration: 90, content: '学习了牛顿三大定律，完成了相关习题', score: 88, subject: '物理' },
    { id: 'r_3', classroomId: 'c_1', studentId: 's_1', studentName: '李明', date: today, duration: 45, content: '学习了分数的基本概念和运算', score: 95, subject: '数学' },
    { id: 'r_4', classroomId: 'c_3', studentId: 's_3', studentName: '张华', date: yesterday, duration: 90, content: '学习了议论文写作结构', score: 85, subject: '语文' },
    { id: 'r_5', classroomId: 'c_4', studentId: 's_3', studentName: '张华', date: threeDaysAgo, duration: 90, content: '完成了力学实验报告', score: 90, subject: '物理' },
  ];

  return {
    users,
    children,
    classrooms,
    participants,
    learningRecords,
    smsCodes: {},
    sessions: {},
  };
}

export const db = {
  get: loadDB,
  set: saveDB,
  reset: resetDB,
};

export const ROLE_PERMISSIONS = {
  super_admin: [
    'classroom.view', 'classroom.create', 'classroom.update', 'classroom.delete',
    'classroom.control', 'classroom.join', 'ai.use', 'ocr.use',
    'records.view', 'records.manage', 'user.manage',
  ],
  parent: [
    'classroom.view', 'classroom.create', 'classroom.update', 'classroom.delete',
    'classroom.control', 'classroom.join', 'ai.use', 'ocr.use',
    'records.view', 'records.manage',
  ],
  student: [
    'classroom.view', 'classroom.join', 'ai.use', 'ocr.use', 'records.view',
  ],
  guest: ['classroom.view'],
};

export function hasPermission(role: string, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS];
  return perms?.includes(permission as any) ?? false;
}

export const DEFAULT_GROWTH: GrowthReport = {
  weeklyHours: [2, 3, 2.5, 4, 3.5, 2, 3],
  weeklyScores: [85, 88, 90, 87, 92, 89, 95],
  subjectScores: { 数学: 92, 语文: 88, 英语: 90, 物理: 85 },
  totalStudyTime: 20,
  avgScore: 89,
  learningDays: 5,
  maxScore: 95,
  improvements: ['数学运算能力提升', '英语口语表达增强', '学习时长稳步增长'],
  recentActivities: (() => {
    const now = new Date();
    return [
      { date: now.toISOString().slice(0, 10), activity: '数学辅导课', duration: 90, subject: '数学' },
      { date: new Date(now.getTime() - 86400000).toISOString().slice(0, 10), activity: '语文作文练习', duration: 60, subject: '语文' },
      { date: new Date(now.getTime() - 3 * 86400000).toISOString().slice(0, 10), activity: '物理实验', duration: 90, subject: '物理' },
    ];
  })(),
  achievements: [
    { id: 'a_1', title: '学习新星', description: '连续7天完成学习任务', icon: 'Star', earnedAt: '2026-07-01' },
    { id: 'a_2', title: '数学高手', description: '数学单科成绩突破90分', icon: 'Trophy', earnedAt: '2026-06-15' },
    { id: 'a_3', title: '勤奋学生', description: '累计学习时长超过50小时', icon: 'Award', earnedAt: '2026-06-30' },
  ],
};
