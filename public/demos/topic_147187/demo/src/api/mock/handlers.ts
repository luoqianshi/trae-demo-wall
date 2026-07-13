import type { ApiResponse } from '../types';
import { db, loadDB, saveDB, hasPermission, ROLE_PERMISSIONS } from './database';

type Handler = (params?: Record<string, any>, body?: any) => Promise<ApiResponse<any>> | ApiResponse<any>;

const TOKEN_PREFIX = 'rt_software_jwt_';
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000;

const generateToken = (userId: string): string => {
  const expires = Date.now() + SESSION_TTL;
  return `${TOKEN_PREFIX}${userId}_${expires}_${Math.random().toString(36).slice(2)}`;
};

const verifyToken = (token: string): string | null => {
  if (!token?.startsWith(TOKEN_PREFIX)) return null;
  const parts = token.split('_');
  const expires = parseInt(parts[parts.length - 2] || '0', 10);
  if (Date.now() > expires) return null;
  return parts[2] || null;
};

const getCurrentUserId = (token?: string): string | null => {
  if (!token) {
    const stored = localStorage.getItem('zhixuetong-token');
    if (!stored) return null;
    return verifyToken(stored);
  }
  return verifyToken(token);
};

const requireAuth = (token?: string): string => {
  const userId = getCurrentUserId(token);
  if (!userId) {
    const err: ApiResponse<null> = { code: 1001, message: '未登录或登录已过期', data: null };
    throw err;
  }
  return userId;
};

const requirePermission = (userId: string, permission: string): void => {
  const data = loadDB();
  const user = data.users.find((u) => u.id === userId);
  if (!user) {
    const err: ApiResponse<null> = { code: 1001, message: '用户不存在', data: null };
    throw err;
  }
  if (!hasPermission(user.role, permission)) {
    const err: ApiResponse<null> = { code: 1003, message: `无权限: ${permission}`, data: null };
    throw err;
  }
};

const maskPhone = (phone: string): string => {
  if (phone.length !== 11) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(7);
};

const success = <T>(data: T): ApiResponse<T> => ({
  code: 0,
  message: 'success',
  data,
});

const error = (code: number, message: string): ApiResponse<null> => ({
  code,
  message,
  data: null,
});

const persistSession = (token: string, userId: string) => {
  const data = loadDB();
  data.sessions[token] = { userId, expiresAt: Date.now() + SESSION_TTL };
  saveDB(data);
  localStorage.setItem('zhixuetong-token', token);
};

export const MOCK_HANDLERS: Record<string, Handler> = {
  'POST /auth/sms-code': (_p, body) => {
    const phone = body?.phone || '';
    if (!/^1\d{10}$/.test(phone)) return error(2001, '手机号格式不正确');
    const code = String(Math.floor(1000 + Math.random() * 9000));
    const data = loadDB();
    data.smsCodes[phone] = { code, expiresAt: Date.now() + 5 * 60 * 1000 };
    saveDB(data);
    console.log(`[Mock SMS] 验证码: ${code} → ${phone}`);
    return success({ sent: true, debugCode: code });
  },

  'POST /auth/login': (_p, body) => {
    const { phone, password, role } = body || {};
    if (!phone || !password) return error(2001, '手机号和密码不能为空');
    const data = loadDB();
    // 演示账号：内置用户可使用 'demo1234' 密码登录
    const DEMO_PASSWORD = 'demo1234';
    const user = data.users.find((u) => u.phone === phone && u.role === (role || 'parent'));
    if (!user) {
      return success({
        requireRegister: true,
        message: '账号不存在，请注册',
      });
    }
    // Mock 简化：演示账号使用统一密码，其他账号只要密码长度>=6即可
    if (password !== DEMO_PASSWORD && password.length < 6) {
      return error(2001, '密码错误，演示账号请使用 demo1234');
    }
    const token = generateToken(user.id);
    persistSession(token, user.id);
    return success({
      token,
      refreshToken: token,
      user: { ...user, phone: maskPhone(user.phone) },
      expiresAt: new Date(Date.now() + SESSION_TTL).toISOString(),
    });
  },

  'POST /auth/register': (_p, body) => {
    const { phone, password, nickname, role, verifyCode } = body || {};
    if (!phone || !password || !nickname || !role) return error(2001, '参数不完整');
    if (!/^1\d{10}$/.test(phone)) return error(2001, '手机号格式不正确');
    if (password.length < 6) return error(2001, '密码至少6位');
    const data = loadDB();
    const codeInfo = data.smsCodes[phone];
    if (!codeInfo || codeInfo.code !== verifyCode) {
      return error(2001, '验证码错误或已过期');
    }
    if (codeInfo.expiresAt < Date.now()) {
      return error(2001, '验证码已过期');
    }
    const exists = data.users.find((u) => u.phone === phone);
    if (exists) return error(2001, '该手机号已注册');
    const newUser = {
      id: `u_${role}_${Date.now()}`,
      phone,
      nickname,
      role,
      avatar: '',
      createdAt: new Date().toISOString(),
    };
    data.users.push(newUser);
    delete data.smsCodes[phone];
    saveDB(data);
    const token = generateToken(newUser.id);
    persistSession(token, newUser.id);
    return success({
      token,
      refreshToken: token,
      user: { ...newUser, phone: maskPhone(newUser.phone) },
      expiresAt: new Date(Date.now() + SESSION_TTL).toISOString(),
    });
  },

  'POST /auth/logout': () => {
    localStorage.removeItem('rt-software-token');
    return success({});
  },

  'GET /auth/profile': (_p?: Record<string, any>, _b?: any) => {
    try {
      const userId = requireAuth();
      const data = loadDB();
      const user = data.users.find((u) => u.id === userId);
      if (!user) return error(1001, '用户不存在');
      const children = data.children
        .filter((c) => c.parentId === userId)
        .map((c) => ({ id: c.id, nickname: c.nickname, grade: c.grade, avatar: c.avatar }));
      return success({
        ...user,
        phone: maskPhone(user.phone),
        children,
      });
    } catch (e: any) {
      return e;
    }
  },

  'GET /auth/permissions': () => {
    try {
      const userId = requireAuth();
      const data = loadDB();
      const user = data.users.find((u) => u.id === userId);
      if (!user) return error(1001, '用户不存在');
      return success({
        role: user.role,
        permissions: ROLE_PERMISSIONS[user.role],
      });
    } catch (e: any) {
      return e;
    }
  },

  'GET /classrooms': (params) => {
    try {
      const userId = requireAuth();
      requirePermission(userId, 'classroom.view');
      const data = loadDB();
      let list = data.classrooms;
      if (params?.status) list = list.filter((c) => c.status === params.status);
      if (params?.hostId) list = list.filter((c) => c.hostId === params.hostId);
      return success({ list, total: list.length });
    } catch (e: any) {
      return e;
    }
  },

  'GET /classrooms/:id': (params) => {
    try {
      const userId = requireAuth();
      const data = loadDB();
      const classroom = data.classrooms.find((c) => c.id === params?.id);
      if (!classroom) return error(2001, '课堂不存在');
      const participants = data.participants.filter((p) => p.classroomId === classroom.id);
      return success({ ...classroom, participants });
    } catch (e: any) {
      return e;
    }
  },

  'POST /classrooms': (_p, body) => {
    try {
      const userId = requireAuth();
      requirePermission(userId, 'classroom.create');
      const data = loadDB();
      const host = data.users.find((u) => u.id === userId);
      const classroom = {
        id: `c_${Date.now()}`,
        name: body.name || '未命名课堂',
        description: body.description || '',
        startTime: body.startTime,
        endTime: body.endTime,
        status: 'upcoming' as const,
        hostId: userId,
        hostName: host?.nickname || '未知',
        participantCount: 0,
        subject: body.subject || '通用',
        agoraChannel: `agora_${Math.random().toString(36).slice(2, 10)}`,
      };
      data.classrooms.push(classroom);
      saveDB(data);
      return success(classroom);
    } catch (e: any) {
      return e;
    }
  },

  'DELETE /classrooms/:id': (params) => {
    try {
      const userId = requireAuth();
      requirePermission(userId, 'classroom.delete');
      const data = loadDB();
      const idx = data.classrooms.findIndex((c) => c.id === params?.id);
      if (idx === -1) return error(2001, '课堂不存在');
      const room = data.classrooms[idx];
      if (room.hostId !== userId) {
        requirePermission(userId, 'user.manage');
      }
      data.classrooms.splice(idx, 1);
      saveDB(data);
      return success({ deleted: true });
    } catch (e: any) {
      return e;
    }
  },

  'POST /rtc/token': (params) => {
    try {
      const userId = requireAuth();
      const data = loadDB();
      const classroom = data.classrooms.find((c) => c.id === params?.classroomId);
      if (!classroom) return error(2001, '课堂不存在');
      const uid = Math.floor(Math.random() * 100000) + 1;
      return success({
        appId: 'demo_agora_app_id',
        channel: classroom.agoraChannel,
        token: 'demo_agora_token_' + btoa(`${uid}:${Date.now() + 3600 * 1000}`),
        uid,
        expiresIn: 3600,
      });
    } catch (e: any) {
      return e;
    }
  },

  'GET /ai/providers': () => {
    return success([
      { id: 'deepseek', name: 'DeepSeek', description: '深度求索 - 国产领先大模型', models: ['deepseek-chat', 'deepseek-reasoner'], enabled: true, strengths: ['数学推理', '代码生成', '中文理解'] },
      { id: 'qwen', name: '通义千问', description: '阿里云 - 多模态大模型', models: ['qwen-turbo', 'qwen-plus', 'qwen-max'], enabled: true, strengths: ['多模态', '工具调用', '通用对话'] },
      { id: 'ernie', name: '文心一言', description: '百度 - 知识增强大模型', models: ['ernie-4.0', 'ernie-3.5'], enabled: true, strengths: ['中文知识', '教育场景', '文学创作'] },
      { id: 'zhipu', name: '智谱清言', description: '清华系 - GLM系列', models: ['glm-4', 'glm-4-flash'], enabled: true, strengths: ['逻辑推理', '长文本', '工具调用'] },
      { id: 'kimi', name: 'Kimi', description: '月之暗面 - 长上下文专家', models: ['moonshot-v1-32k', 'moonshot-v1-128k'], enabled: true, strengths: ['长上下文', '文档分析', '联网搜索'] },
      { id: 'doubao', name: '豆包', description: '字节跳动 - 多模态助手', models: ['doubao-pro', 'doubao-lite'], enabled: true, strengths: ['多模态', '语音交互', '低延迟'] },
    ]);
  },

  'POST /ai/chat': (_p, body) => {
    try {
      const userId = requireAuth();
      requirePermission(userId, 'ai.use');
      const { messages, provider = 'deepseek' } = body || {};
      const last = messages?.[messages.length - 1];
      const text = last?.content || '';
      const reply = generateAIReply(text, provider);
      return success({
        message: {
          id: `ai_${Date.now()}`,
          role: 'assistant',
          content: reply,
          timestamp: new Date().toISOString(),
          provider,
          model: provider === 'deepseek' ? 'deepseek-chat' : 'unknown',
        },
        usage: { promptTokens: text.length, completionTokens: reply.length, totalTokens: text.length + reply.length },
      });
    } catch (e: any) {
      return e;
    }
  },

  'POST /tools/ocr': () => {
    try {
      const userId = requireAuth();
      requirePermission(userId, 'ocr.use');
      const samples = [
        { text: '题目：小明有5个苹果，分给小红2个，还剩下几个？\n5 - 2 = 3\n答案：3个苹果', confidence: 0.96 },
        { text: '已知函数 f(x) = 2x + 1，求 f(3) 的值。\nf(3) = 2 × 3 + 1 = 7', confidence: 0.92 },
        { text: '古诗：床前明月光，疑是地上霜。\n举头望明月，低头思故乡。', confidence: 0.98 },
      ];
      const sample = samples[Math.floor(Math.random() * samples.length)];
      return success({
        text: sample.text,
        confidence: sample.confidence,
        blocks: sample.text.split('\n').map((t) => ({
          text: t,
          bbox: [0, 0, 100, 30] as [number, number, number, number],
        })),
      });
    } catch (e: any) {
      return e;
    }
  },

  'GET /tools/dictionary': (params) => {
    const word = (params?.word || '').toLowerCase();
    const dict: Record<string, any> = {
      apple: { word: 'apple', phonetic: '/ˈæp.əl/', meaning: '苹果', example: 'I eat an apple every day.', partOfSpeech: 'noun' },
      beautiful: { word: 'beautiful', phonetic: '/ˈbjuː.tɪ.fəl/', meaning: '美丽的', example: 'The sunset is beautiful.', partOfSpeech: 'adj.' },
      computer: { word: 'computer', phonetic: '/kəmˈpjuː.tər/', meaning: '电脑', example: 'I use my computer for work.', partOfSpeech: 'noun' },
      学习: { word: '学习', phonetic: '/xué xí/', meaning: 'study, learn', example: '我每天都要学习。', partOfSpeech: 'verb' },
      知识: { word: '知识', phonetic: '/zhī shi/', meaning: 'knowledge', example: '知识就是力量。', partOfSpeech: 'noun' },
      科学: { word: '科学', phonetic: '/kē xué/', meaning: 'science', example: '科学改变世界。', partOfSpeech: 'noun' },
      先生: { word: '先生', phonetic: '/xiān sheng/', meaning: 'sir, mister', example: '老师是一位好先生。', partOfSpeech: 'noun' },
    };
    const entry = dict[word];
    if (!entry) return error(2001, `未找到词汇: ${word}`);
    return success(entry);
  },

  'GET /records': (params) => {
    try {
      const userId = requireAuth();
      requirePermission(userId, 'records.view');
      const data = loadDB();
      let list = data.learningRecords;
      if (params?.studentId) list = list.filter((r) => r.studentId === params.studentId);
      if (params?.subject) list = list.filter((r) => r.subject === params.subject);
      return success({ list, total: list.length });
    } catch (e: any) {
      return e;
    }
  },

  'GET /records/growth': (params) => {
    try {
      const userId = requireAuth();
      requirePermission(userId, 'records.view');
      const data = loadDB();
      const studentId = params?.studentId;
      const records = data.learningRecords.filter((r) =>
        studentId ? r.studentId === studentId : true
      );
      const subjectScores: Record<string, number[]> = {};
      for (const r of records) {
        if (!subjectScores[r.subject]) subjectScores[r.subject] = [];
        subjectScores[r.subject].push(r.score);
      }
      const avgScores: Record<string, number> = {};
      Object.entries(subjectScores).forEach(([s, list]) => {
        avgScores[s] = Math.round(list.reduce((a, b) => a + b, 0) / list.length);
      });

      return success({
        weeklyHours: [2, 3, 2.5, 4, 3.5, 2, 3],
        weeklyScores: [85, 88, 90, 87, 92, 89, 95],
        subjectScores: Object.keys(avgScores).length > 0 ? avgScores : { 数学: 92, 语文: 88, 英语: 90, 物理: 85 },
        totalStudyTime: Math.round(records.reduce((sum, r) => sum + r.duration, 0) / 60 * 10) / 10,
        avgScore: records.length > 0 ? Math.round(records.reduce((s, r) => s + r.score, 0) / records.length) : 89,
        learningDays: records.length,
        maxScore: records.length > 0 ? Math.max(...records.map((r) => r.score)) : 95,
        improvements: ['数学运算能力提升', '英语口语表达增强', '学习时长稳步增长'],
        recentActivities: records.slice(0, 5).map((r) => ({
          date: r.date,
          activity: `${r.subject}${r.content.substring(0, 20)}`,
          duration: r.duration,
          subject: r.subject,
        })),
        achievements: [
          { id: 'a_1', title: '学习新星', description: '连续7天完成学习任务', icon: 'Star', earnedAt: '2026-07-01' },
          { id: 'a_2', title: '数学高手', description: '数学单科成绩突破90分', icon: 'Trophy', earnedAt: '2026-06-15' },
        ],
      });
    } catch (e: any) {
      return e;
    }
  },
};

function generateAIReply(query: string, provider: string): string {
  const trimmed = query.trim();
  if (!trimmed) return '请告诉我你想要了解的问题。';

  const providerTips: Record<string, string> = {
    deepseek: '[DeepSeek-V3回答]',
    qwen: '[通义千问回答]',
    ernie: '[文心一言回答]',
    zhipu: '[智谱清言回答]',
    kimi: '[Kimi回答]',
    doubao: '[豆包回答]',
  };
  const tip = providerTips[provider] || '[AI助手回答]';

  if (/(你好|您好|hi|hello)/i.test(trimmed)) {
    return `${tip} 你好！我是智学通的AI学习助手，当前由${provider}模型支持。请问有什么学习问题我可以帮你解答？`;
  }

  if (trimmed.includes('数学') && (trimmed.includes('怎么') || trimmed.includes('题'))) {
    return `${tip} 这道题请先告诉我具体题目。一般来说，解应用题可以按以下步骤：\n\n1️⃣ 审题：找出已知条件、未知量\n2️⃣ 标注数量关系\n3️⃣ 选择合适的方法（算术/方程/比例等）\n4️⃣ 验算答案合理性\n\n如果你能提供具体题目，我会给出更详细的解答步骤。`;
  }
  if (trimmed.includes('分数')) {
    return `${tip} 分数是数的一种，表示一个整体被等分成若干份后，所取份数的形式。\n\n📌 关键概念：\n• 分子：表示取了多少份\n• 分母：表示一共分成多少份\n• 分数线：相当于除号\n\n📌 运算规则：\n• 同分母：分子相加，分母不变\n• 异分母：先通分再相加\n• 分数乘法：分子乘分子，分母乘分母`;
  }
  if (trimmed.includes('英语') && trimmed.includes('学')) {
    return `${tip} 学习英语有几个关键建议：\n\n🎯 输入（吸收）：\n• 每天30分钟英语听力（动画、有声书）\n• 阅读分级英文读物\n\n🎯 输出（表达）：\n• 大声朗读练习口语\n• 用英语写日记或短文\n\n🎯 工具：\n• 词典查生词记到专属单词本\n• 英语词典APP随时学\n\n坚持6个月就能看到显著进步！`;
  }
  if (trimmed.includes('作文') || trimmed.includes('写')) {
    return `${tip} 写作文的关键技巧：\n\n📝 结构（虎头猪肚豹尾）：\n• 开篇点题，吸引读者\n• 中间充实，详略得当\n• 结尾升华，呼应主题\n\n✨ 内容亮点：\n• 善用修辞（比喻、拟人、排比）\n• 加入具体细节和人物对话\n• 引用名言警句点缀\n\n📖 平时积累：\n• 准备素材本，记录生活点滴\n• 多读优秀作文，模仿写法`;
  }
  if (trimmed.includes('谢谢') || trimmed.includes('感谢')) {
    return `${tip} 不客气！学习是一个持续的过程，遇到任何问题都可以随时找我。祝学习进步！🌟`;
  }
  return `${tip} 你问的是："${trimmed}"。这是一个很好的问题！\n\n让我尝试分析一下：\n\n这个问题的关键在于理解核心概念，掌握基本原理。我建议你：\n\n1. 先从基础概念入手，弄清定义\n2. 通过具体例子加深理解\n3. 多做相关练习巩固\n\n如果你能提供具体题目或情境描述，我可以给出更有针对性的解答。`;
}
