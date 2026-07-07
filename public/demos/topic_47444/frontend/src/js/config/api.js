/**
 * API 配置与封装 v3.0
 * 对齐《标准认知阶梯教案v3.0》三轴并行
 * 三轴：见察力(看清世界) / 澄省力(了解自己) / 明定力(找到路径)
 * 五驱：自保驱/归属驱/地位驱/意义驱/自由驱
 */

// ========== 训练系统本地模拟（Demo演示用）==========

function mockDelay(ms = 1200) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getOpeningByPortrait(portrait) {
  const openings = {
    AAA: '你的报告我看了——三轴均衡，很少见。但均衡也有均衡的盲区。接下来10分钟，我们快速练一轮。给我一条你最近关注的信息——',
    AAB: '你的报告我看了——方向感清晰，落地还差一口气。给我一条你最近在纠结的事——',
    ABA: '你的报告我看了——看外面很准，转过来看自己呢？给我一条你觉得「想不通」的事——',
    ABB: '你的报告我看了——有看透世界的能力，往里走是下一步。给我一条你最近看明白了但没做的事——',
    BAA: '你的报告我看了——内心清晰，把这份清晰用到更大的世界。给我一条你觉得「外面的规则不对」的事——',
    BAB: '你的报告我看了——你习惯一个人扛，但有些结构不是一个人的事。给我一条你觉得「只有我能理解」的事——',
    BBA: '你的报告我看了——行动力拉满，但方向对吗？给我一条你觉得「做了再说」的事——',
    BBB: '你的报告我看了——起点已在脚下，从这里开始不晚。给我一条你觉得「不太确定」的事——'
  };
  return openings[portrait] || '我是澄明。10分钟，聊一件事。说一件你最近在想的事——纠结的、生气的、难做决定的都行。随便说。';
}

async function generateMockReply(round, profile, userMessage) {
  await mockDelay(800 + Math.random() * 1000);

  const portrait = profile?.portrait || 'BBB';

  // 五指数字段名（v3.0）
  const fiveFingers = {
    utilizeSociety: profile?.utilizeSociety || null,
    beatenBySociety: profile?.beatenBySociety || null,
    aiUtilization: profile?.aiUtilization || null,
    aiRisk: profile?.aiRisk || null,
    sixStep: profile?.sixStep || null
  };

  switch (round) {
    case 1:
      return {
        content: getOpeningByPortrait(portrait),
        role: 'assistant'
      };

    case 2:
      return {
        content: '这条信息背后——谁在推动？他们各自想要什么？',
        role: 'assistant'
      };

    case 3:
      return {
        content: '你的反应——是什么在推你？五驱照一下：哪个在？哪个声音最大？',
        role: 'assistant'
      };

    case 4:
      return {
        content: '这个驱动——是你自己选的，还是环境种进去的？',
        role: 'assistant'
      };

    case 5:
      return {
        content: '如果现在让你做一件事——48小时内完成，不需要准备——你会做什么？不能是「再想想」。',
        role: 'assistant'
      };

    case 6:
      return {
        content: '这10分钟你做了什么：\n🌍 你看到了什么之前没注意到的？\n❤️ 你发现了什么在推你？\n🎯 你决定做的第一件事是什么？\n\n记住这三样。飞轮已经在转了——保持它。',
        role: 'assistant'
      };

    default:
      return {
        content: '继续说。',
        role: 'assistant'
      };
  }
}

export const CoachAPI = {
  start: async (profile) => {
    const reply = await generateMockReply(1, profile, '');
    return {
      success: true,
      reply,
      currentRound: 1,
      isTrainingComplete: false
    };
  },

  message: async (messages, profile, round) => {
    const currentRound = Math.max(1, Math.min(6, Number(round) || 1));
    const lastUserMsg = messages.filter(m => m.role === 'user').pop();
    const userContent = lastUserMsg?.content || '';

    const reply = await generateMockReply(currentRound, profile, userContent);

    return {
      success: true,
      reply,
      currentRound,
      isTrainingComplete: currentRound === 6
    };
  },

  feedback: async (sessionId, learningScore, awarenessScore, npsScore, bestFinding) => {
    const feedbacks = JSON.parse(localStorage.getItem('cji_coach_feedback') || '[]');
    feedbacks.push({
      sessionId,
      learningScore,
      awarenessScore,
      npsScore,
      bestFinding,
      timestamp: Date.now()
    });
    localStorage.setItem('cji_coach_feedback', JSON.stringify(feedbacks));
    return { success: true };
  }
};

// ========== 预留接口（后端就绪后接入）==========

const API_BASE = window.location.hostname === 'localhost'
  ? '/api'
  : 'https://your-api-domain.com/api';

async function request(url, options = {}) {
  const headers = options.body ? { 'Content-Type': 'application/json' } : {};
  const res = await fetch(url, {
    headers,
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `请求失败: ${res.status}`);
  }

  return res.json();
}

async function backendRequest(path, options = {}) {
  const url = `${API_BASE}${path}`;
  return request(url, options);
}

export const UserAPI = {
  create: () => backendRequest('/user/create', { method: 'POST' }),
  bindWechat: (userId, code) => backendRequest('/user/bindWechat', {
    method: 'POST',
    body: { userId, code }
  }),
  get: (id) => backendRequest(`/user/${id}`),
  delete: (userId) => backendRequest('/user/data', {
    method: 'DELETE',
    body: { userId }
  })
};

export const EvalAPI = {
  submit: (userId, evalType, answers, duration) => backendRequest('/eval/submit', {
    method: 'POST',
    body: { userId, evalType, answers, duration }
  }),
  get: (id) => backendRequest(`/eval/${id}`),
  list: (userId) => backendRequest(`/eval/list/${userId}`),
  retestCheck: (userId) => backendRequest(`/eval/retest-check/${userId}`)
};

export const ReportAPI = {
  get: (evalId) => backendRequest(`/report/${evalId}`)
};

export default { UserAPI, EvalAPI, ReportAPI, CoachAPI };
