export interface Classroom {
  id: string;
  name: string;
  description: string;
  startTime: string;
  endTime: string;
  status: 'ongoing' | 'upcoming' | 'ended';
  hostId: string;
  hostName: string;
  participantCount: number;
}

export interface Participant {
  id: string;
  classroomId: string;
  name: string;
  role: 'host' | 'student';
  isOnline: boolean;
  isMuted: boolean;
  isCameraOn: boolean;
  isHandRaised: boolean;
}

export interface LearningRecord {
  id: string;
  classroomId: string;
  studentId: string;
  studentName: string;
  date: string;
  duration: number;
  content: string;
  score: number;
  subject: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface DictionaryEntry {
  word: string;
  phonetic: string;
  meaning: string;
  example: string;
  partOfSpeech: string;
}

export const mockClassrooms: Classroom[] = [
  {
    id: '1',
    name: '数学基础辅导',
    description: '针对小学三年级数学基础概念进行系统辅导',
    startTime: '2026-07-08 14:00',
    endTime: '2026-07-08 15:30',
    status: 'ongoing',
    hostId: 'host1',
    hostName: '王老师',
    participantCount: 5,
  },
  {
    id: '2',
    name: '英语阅读理解',
    description: '提升英语阅读能力，讲解阅读理解技巧',
    startTime: '2026-07-09 10:00',
    endTime: '2026-07-09 11:30',
    status: 'upcoming',
    hostId: 'host1',
    hostName: '王老师',
    participantCount: 0,
  },
  {
    id: '3',
    name: '语文作文指导',
    description: '作文写作技巧与素材积累',
    startTime: '2026-07-07 16:00',
    endTime: '2026-07-07 17:30',
    status: 'ended',
    hostId: 'host1',
    hostName: '王老师',
    participantCount: 8,
  },
  {
    id: '4',
    name: '物理实验讲解',
    description: '力学基础实验原理与操作方法',
    startTime: '2026-07-06 14:00',
    endTime: '2026-07-06 15:30',
    status: 'ended',
    hostId: 'host1',
    hostName: '王老师',
    participantCount: 6,
  },
];

export const mockParticipants: Participant[] = [
  {
    id: 'p1',
    classroomId: '1',
    name: '王老师',
    role: 'host',
    isOnline: true,
    isMuted: false,
    isCameraOn: true,
    isHandRaised: false,
  },
  {
    id: 'p2',
    classroomId: '1',
    name: '李明',
    role: 'student',
    isOnline: true,
    isMuted: true,
    isCameraOn: true,
    isHandRaised: false,
  },
  {
    id: 'p3',
    classroomId: '1',
    name: '张华',
    role: 'student',
    isOnline: true,
    isMuted: false,
    isCameraOn: false,
    isHandRaised: true,
  },
  {
    id: 'p4',
    classroomId: '1',
    name: '王芳',
    role: 'student',
    isOnline: true,
    isMuted: false,
    isCameraOn: true,
    isHandRaised: false,
  },
  {
    id: 'p5',
    classroomId: '1',
    name: '刘洋',
    role: 'student',
    isOnline: false,
    isMuted: true,
    isCameraOn: false,
    isHandRaised: false,
  },
];

export const mockLearningRecords: LearningRecord[] = [
  {
    id: 'r1',
    classroomId: '3',
    studentId: 'p2',
    studentName: '李明',
    date: '2026-07-07',
    duration: 90,
    content: '学习了记叙文写作技巧，完成了一篇300字作文',
    score: 92,
    subject: '语文',
  },
  {
    id: 'r2',
    classroomId: '4',
    studentId: 'p2',
    studentName: '李明',
    date: '2026-07-06',
    duration: 90,
    content: '学习了牛顿三大定律，完成了相关习题',
    score: 88,
    subject: '物理',
  },
  {
    id: 'r3',
    classroomId: '1',
    studentId: 'p2',
    studentName: '李明',
    date: '2026-07-08',
    duration: 45,
    content: '学习了分数的基本概念和运算',
    score: 95,
    subject: '数学',
  },
  {
    id: 'r4',
    classroomId: '3',
    studentId: 'p3',
    studentName: '张华',
    date: '2026-07-07',
    duration: 90,
    content: '学习了议论文写作结构',
    score: 85,
    subject: '语文',
  },
  {
    id: 'r5',
    classroomId: '4',
    studentId: 'p3',
    studentName: '张华',
    date: '2026-07-06',
    duration: 90,
    content: '完成了力学实验报告',
    score: 90,
    subject: '物理',
  },
];

export const mockDictionary: Record<string, DictionaryEntry> = {
  'apple': {
    word: 'apple',
    phonetic: '/ˈæp.əl/',
    meaning: '苹果',
    example: 'I eat an apple every day.',
    partOfSpeech: 'noun',
  },
  'beautiful': {
    word: 'beautiful',
    phonetic: '/ˈbjuː.tɪ.fəl/',
    meaning: '美丽的，漂亮的',
    example: 'The sunset is beautiful.',
    partOfSpeech: 'adjective',
  },
  'computer': {
    word: 'computer',
    phonetic: '/kəmˈpjuː.tər/',
    meaning: '电脑，计算机',
    example: 'I use my computer for work.',
    partOfSpeech: 'noun',
  },
  '学习': {
    word: '学习',
    phonetic: '/xué xí/',
    meaning: 'study, learn',
    example: '我每天都要学习新知识。',
    partOfSpeech: 'verb',
  },
  '知识': {
    word: '知识',
    phonetic: '/zhī shi/',
    meaning: 'knowledge',
    example: '知识就是力量。',
    partOfSpeech: 'noun',
  },
};

export const mockAIResponses: Record<string, string> = {
  '你好': '你好！我是智学通AI助手，很高兴为你服务。请问有什么可以帮助你的吗？',
  '这道数学题怎么做': '请告诉我题目内容，我会为你详细解答。一般来说，解题需要先理解题意，找出已知条件和未知量，然后选择合适的方法进行计算。',
  '什么是分数': '分数表示一个数是另一个数的几分之几，或者一个事件与所有事件的比例。分数由分子和分母组成，分子在上，分母在下，中间用分数线隔开。',
  '英语怎么学': '学习英语需要多听、多说、多读、多写。建议每天坚持练习，可以通过看英文电影、听英文歌曲、阅读英文书籍等方式来提高。',
  '谢谢': '不客气！如果你还有其他问题，随时可以问我。',
};

export const generateAIResponse = (query: string): string => {
  for (const [key, response] of Object.entries(mockAIResponses)) {
    if (query.includes(key)) {
      return response;
    }
  }
  return `你提出了一个很好的问题："${query}"。让我来帮你分析一下...\n\n这个问题涉及到多个知识点，建议你从基础概念开始理解，逐步深入。如果你有具体的题目或例子，我可以为你提供更详细的解答。`;
};

export const mockGrowthData = {
  weeklyHours: [2, 3, 2.5, 4, 3.5, 2, 3],
  weeklyScores: [85, 88, 90, 87, 92, 89, 95],
  subjectScores: {
    数学: 92,
    语文: 88,
    英语: 90,
    物理: 85,
  },
  recentActivities: [
    { date: '2026-07-08', activity: '数学辅导课', duration: 90 },
    { date: '2026-07-07', activity: '语文作文练习', duration: 60 },
    { date: '2026-07-06', activity: '物理实验', duration: 90 },
    { date: '2026-07-05', activity: '英语阅读', duration: 45 },
    { date: '2026-07-04', activity: '数学作业', duration: 30 },
  ],
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};