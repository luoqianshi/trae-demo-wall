// ========== 村里有人 - 模拟数据 ==========
const DB = {
  elders: [
    { id: 1, name: '李秀兰', avatar: '👵', age: 72, village: '小王村', address: '小王村东头第二户', status: 'normal', health: '高血压，需定期服药', children: ['张建国'] },
    { id: 2, name: '王德顺', avatar: '👴', age: 78, village: '小王村', address: '小王村西头第五户', status: 'warning', health: '腿脚不便，独居', children: ['王小明'] }
  ],

  users: [
    { id: 'parent1', name: '张建国', avatar: '👨‍💼', role: 'parent', phone: '138****5678', village: '小王村', elders: [1] },
    { id: 'runner1', name: '王大海', avatar: '🤝', role: 'runner', phone: '139****1234', village: '小王村', rating: 4.9, completed: 32, earnings: 3680 }
  ],

  tasks: [
    {
      id: 1,
      type: 'shop',
      typeLabel: '代购代办',
      typeIcon: '🛒',
      title: '代买降压药',
      desc: '去镇上药店买硝苯地平缓释片一盒，送到我母亲家中。',
      budget: 50,
      status: 'ongoing',
      statusLabel: '进行中',
      elderId: 1,
      elderName: '李秀兰',
      elderAvatar: '👵',
      address: '小王村东头第二户',
      runnerId: 'runner1',
      runnerName: '王大海',
      runnerAvatar: '🤝',
      createdAt: '今天 09:30',
      timeline: [
        { title: '任务发布', desc: '张建国发布了代购任务', time: '09:30', done: true },
        { title: '跑腿人接单', desc: '王大海已接单，前往采购', time: '09:35', done: true },
        { title: '采购完成', desc: '已购买硝苯地平缓释片，正在前往老人家', time: '10:15', done: true },
        { title: '上门交付', desc: '等待交付确认', time: '--', done: false },
      ],
      photos: ['💊', '📷'],
      voice: { duration: '0:08', text: '阿姨，这是您儿子让我买的药，您看看对不对？' },
      settlementId: null
    },
    {
      id: 2,
      type: 'visit',
      typeLabel: '上门探视',
      typeIcon: '👀',
      title: '上门看看母亲状态',
      desc: '麻烦上门看望一下，拍几张照片给我看看老人家精神状态怎么样。',
      budget: 30,
      status: 'pending',
      statusLabel: '待接单',
      elderId: 1,
      elderName: '李秀兰',
      elderAvatar: '👵',
      address: '小王村东头第二户',
      runnerId: null,
      createdAt: '今天 11:00',
      timeline: [
        { title: '任务发布', desc: '张建国发布了探视任务', time: '11:00', done: true },
        { title: '等待接单', desc: '系统正在匹配附近跑腿人', time: '--', done: false },
      ],
      photos: [],
      voice: null,
      settlementId: null
    },
    {
      id: 3,
      type: 'voice',
      typeLabel: '捎句话',
      typeIcon: '🎙️',
      title: '给母亲带句话',
      desc: '录了一段话，麻烦上门当面播放给我母亲听，再帮我把她的回复录下来。',
      budget: 20,
      status: 'done',
      statusLabel: '已完成',
      elderId: 1,
      elderName: '李秀兰',
      elderAvatar: '👵',
      address: '小王村东头第二户',
      runnerId: 'runner1',
      runnerName: '王大海',
      runnerAvatar: '🤝',
      createdAt: '昨天 16:00',
      completedAt: '昨天 17:20',
      timeline: [
        { title: '任务发布', desc: '张建国发布了捎话任务', time: '昨天 16:00', done: true },
        { title: '跑腿人接单', desc: '王大海已接单', time: '昨天 16:05', done: true },
        { title: '上门播放', desc: '已当面播放子女语音给老人', time: '昨天 17:10', done: true },
        { title: '录制回复', desc: '已录制老人回复语音并传回', time: '昨天 17:20', done: true },
      ],
      photos: ['👵'],
      voice: { duration: '0:15', text: '告诉你儿子，我挺好的，不用担心！' },
      settlementId: 1
    },
    {
      id: 4,
      type: 'farm',
      typeLabel: '农时互助',
      typeIcon: '🌾',
      title: '帮忙收玉米',
      desc: '家里两亩地的玉米熟了，我腰不好弯不下去，需要帮忙收割。',
      budget: 80,
      status: 'pending',
      statusLabel: '待接单',
      elderId: 2,
      elderName: '王德顺',
      elderAvatar: '👴',
      address: '小王村西头第五户',
      runnerId: null,
      createdAt: '昨天 08:00',
      timeline: [
        { title: '任务发布', desc: '王小明发布了农时互助任务', time: '昨天 08:00', done: true },
        { title: '等待接单', desc: '系统正在匹配附近跑腿人', time: '--', done: false },
      ],
      photos: [],
      voice: null,
      settlementId: null
    }
  ],

  messages: [
    { id: 1, from: 'runner1', fromName: '王大海', fromAvatar: '🤝', to: 'parent1', text: '阿姨的药已经买到了，正在送过去的路上。', time: '今天 10:15', read: true },
    { id: 2, from: 'parent1', fromName: '张建国', fromAvatar: '👨‍💼', to: 'runner1', text: '好的，谢谢大海哥！', time: '今天 10:16', read: true },
    { id: 3, from: 'runner1', fromName: '王大海', fromAvatar: '🤝', to: 'parent1', text: '药已经送到阿姨手上了，她精神头不错！', time: '今天 10:45', read: false },
    { id: 4, from: 'system', fromName: '系统通知', fromAvatar: '📢', to: 'parent1', text: '您发布的"上门看看母亲状态"任务正在匹配跑腿人...', time: '今天 11:00', read: false },
    { id: 5, from: 'system', fromName: '系统通知', fromAvatar: '📢', to: 'runner1', text: '附近有新的代购任务，金额 ¥50，距离您 800米', time: '今天 09:28', read: true }
  ],

  settlements: [
    {
      id: 1,
      taskId: 3,
      amount: 20,
      platformFee: 1,
      runnerIncome: 19,
      status: 'completed',
      parentConfirmedAt: '昨天 17:20',
      runnerConfirmedAt: '昨天 17:20',
      settledAt: '昨天 17:20'
    }
  ],

  timeBank: {
    hours: 18.5,
    totalEarned: 32,
    exchanges: [
      { date: '7月1日', type: 'earn', desc: '帮李婶喂鸡', hours: 2 },
      { date: '6月28日', type: 'earn', desc: '帮张大爷收麦子', hours: 4 },
      { date: '6月20日', type: 'use', desc: '兑换：请人帮忙种菜', hours: -3 }
    ]
  },

  earnings: [
    { date: '今天', task: '代买降压药', amount: 47.5 },
    { date: '昨天', task: '捎句话', amount: 19 },
    { date: '前天', task: '代购生活用品', amount: 38 },
    { date: '7月3日', task: '上门探视', amount: 28.5 },
    { date: '7月1日', task: '云赶集代购', amount: 52 }
  ]
};

// 当前登录用户
let currentUser = DB.users[0];

function setCurrentUser(userId) {
  const user = DB.users.find(u => u.id === userId);
  if (user) currentUser = user;
}

/* ========== 任务 CRUD ========== */

function getTasksByStatus(status) {
  return DB.tasks.filter(t => t.status === status);
}

function getTaskById(id) {
  return DB.tasks.find(t => t.id === parseInt(id));
}

function getElderById(id) {
  return DB.elders.find(e => e.id === parseInt(id));
}

function createTask(taskData) {
  const newId = Math.max(...DB.tasks.map(t => t.id), 0) + 1;
  const elder = getElderById(taskData.elderId || 1);
  const newTask = {
    id: newId,
    ...taskData,
    status: 'pending',
    statusLabel: '待接单',
    elderId: elder.id,
    elderName: elder.name,
    elderAvatar: elder.avatar,
    address: elder.address,
    runnerId: null,
    runnerName: null,
    runnerAvatar: null,
    createdAt: '刚刚',
    timeline: [
      { title: '任务发布', desc: `${currentUser.name}发布了${taskData.typeLabel || '新'}任务`, time: '刚刚', done: true },
      { title: '等待接单', desc: '系统正在匹配附近跑腿人', time: '--', done: false },
    ],
    photos: [],
    voice: null,
    settlementId: null
  };
  DB.tasks.unshift(newTask);
  return newTask;
}

function updateTask(taskId, updates) {
  const task = getTaskById(taskId);
  if (!task) return null;
  Object.assign(task, updates);
  if (updates.desc && !updates.title) {
    task.title = updates.desc.substring(0, 14) + (updates.desc.length > 14 ? '...' : '');
  }
  return task;
}

function deleteTask(taskId) {
  const idx = DB.tasks.findIndex(t => t.id === parseInt(taskId));
  if (idx === -1) return false;
  DB.tasks.splice(idx, 1);
  return true;
}

function acceptTask(taskId, runnerId, runnerName, runnerAvatar) {
  const task = getTaskById(taskId);
  if (task && task.status === 'pending') {
    task.status = 'ongoing';
    task.statusLabel = '进行中';
    task.runnerId = runnerId;
    task.runnerName = runnerName;
    task.runnerAvatar = runnerAvatar;
    task.timeline.push({
      title: '跑腿人接单',
      desc: `${runnerName}已接单，准备出发`,
      time: '刚刚',
      done: true
    });
    // 发一条系统消息给发布者
    sendMessage('system', '系统通知', '📢', task.elderId === 1 ? 'parent1' : 'parent2',
      `跑腿人${runnerName}已接单"${task.title}"，正在前往处理`);
    return true;
  }
  return false;
}

/* ========== 任务进度与上传 ========== */

function updateTaskProgress(taskId, title, desc) {
  const task = getTaskById(taskId);
  if (!task || task.status !== 'ongoing') return false;
  task.timeline.push({
    title: title,
    desc: desc,
    time: '刚刚',
    done: true
  });
  return true;
}

function addTaskPhoto(taskId, photoIcon) {
  const task = getTaskById(taskId);
  if (!task) return false;
  if (!task.photos) task.photos = [];
  task.photos.push(photoIcon);
  return true;
}

function addTaskVoice(taskId, duration, text) {
  const task = getTaskById(taskId);
  if (!task) return false;
  task.voice = { duration, text };
  return true;
}

/* ========== 交付与结算 ========== */

function runnerDeliverTask(taskId) {
  const task = getTaskById(taskId);
  if (!task || task.status !== 'ongoing') return false;
  task.status = 'delivering';
  task.statusLabel = '待确认';
  task.timeline.push({
    title: '跑腿人交付',
    desc: `${task.runnerName}已完成服务，等待子女确认`,
    time: '刚刚',
    done: true
  });
  sendMessage('system', '系统通知', '📢', 'parent1',
    `跑腿人${task.runnerName}已完成"${task.title}"，请前往确认并支付`);
  return true;
}

function parentConfirmAndPay(taskId) {
  const task = getTaskById(taskId);
  if (!task || task.status !== 'delivering') return false;

  const platformFee = Math.round(task.budget * 0.05 * 10) / 10;
  const runnerIncome = Math.round((task.budget - platformFee) * 10) / 10;

  const settlement = {
    id: DB.settlements.length + 1,
    taskId: task.id,
    amount: task.budget,
    platformFee: platformFee,
    runnerIncome: runnerIncome,
    status: 'completed',
    parentConfirmedAt: '刚刚',
    runnerConfirmedAt: '刚刚',
    settledAt: '刚刚'
  };
  DB.settlements.push(settlement);
  task.settlementId = settlement.id;
  task.status = 'done';
  task.statusLabel = '已完成';
  task.completedAt = '刚刚';
  task.timeline.push(
    { title: '子女确认', desc: '张建国已确认服务完成并支付', time: '刚刚', done: true },
    { title: '任务完成', desc: `支付¥${task.budget}，跑腿人收入¥${runnerIncome}`, time: '刚刚', done: true }
  );

  // 更新跑腿人收入记录
  DB.earnings.unshift({ date: '今天', task: task.title, amount: runnerIncome });
  const runner = DB.users.find(u => u.id === task.runnerId);
  if (runner) {
    runner.earnings = (runner.earnings || 0) + runnerIncome;
    runner.completed = (runner.completed || 0) + 1;
  }

  return settlement;
}

function getSettlementByTaskId(taskId) {
  return DB.settlements.find(s => s.taskId === parseInt(taskId));
}

/* ========== 消息 CRUD ========== */

function getUnreadCount() {
  return DB.messages.filter(m => m.to === currentUser.id && !m.read).length;
}

function getMessagesForUser(userId) {
  return DB.messages
    .filter(m => m.to === userId || m.from === userId)
    .sort((a, b) => b.id - a.id);
}

function getConversation(userId, otherId) {
  return DB.messages
    .filter(m => (m.from === userId && m.to === otherId) || (m.from === otherId && m.to === userId))
    .sort((a, b) => a.id - b.id);
}

function sendMessage(from, fromName, fromAvatar, to, text) {
  const newId = Math.max(...DB.messages.map(m => m.id), 0) + 1;
  const msg = {
    id: newId,
    from,
    fromName,
    fromAvatar,
    to,
    text,
    time: '刚刚',
    read: false
  };
  DB.messages.push(msg);
  return msg;
}

function markMessagesRead(userId, otherId) {
  DB.messages.forEach(m => {
    if (m.to === userId && m.from === otherId) {
      m.read = true;
    }
  });
}

function markAllMessagesRead(userId) {
  DB.messages.forEach(m => {
    if (m.to === userId) {
      m.read = true;
    }
  });
}

/* ========== 统计 ========== */

function getUserStats(userId) {
  const user = DB.users.find(u => u.id === userId);
  if (!user) return null;

  if (user.role === 'parent') {
    const myTasks = DB.tasks.filter(t =>
      DB.elders.filter(e => e.children.includes(user.name)).some(e => e.id === t.elderId)
    );
    return {
      totalTasks: myTasks.length,
      completedTasks: myTasks.filter(t => t.status === 'done').length,
      totalSpent: DB.settlements
        .filter(s => myTasks.some(t => t.id === s.taskId))
        .reduce((sum, s) => sum + s.amount, 0),
      pendingTasks: myTasks.filter(t => t.status === 'pending').length,
      ongoingTasks: myTasks.filter(t => t.status === 'ongoing' || t.status === 'delivering').length
    };
  } else {
    const myTasks = DB.tasks.filter(t => t.runnerId === userId);
    return {
      totalTasks: myTasks.length,
      completedTasks: myTasks.filter(t => t.status === 'done').length,
      totalIncome: DB.settlements
        .filter(s => myTasks.some(t => t.id === s.taskId))
        .reduce((sum, s) => sum + s.runnerIncome, 0),
      rating: user.rating || 5.0
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DB, currentUser, setCurrentUser,
    getTasksByStatus, getTaskById, getElderById,
    createTask, updateTask, deleteTask, acceptTask,
    updateTaskProgress, addTaskPhoto, addTaskVoice,
    runnerDeliverTask, parentConfirmAndPay, getSettlementByTaskId,
    getUnreadCount, getMessagesForUser, getConversation, sendMessage, markMessagesRead,
    getUserStats
  };
}
