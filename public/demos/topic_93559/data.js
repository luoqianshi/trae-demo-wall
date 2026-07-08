/**
 * 数据层 - localStorage 封装 + seed 数据
 * 适配江苏初中学生课后自主学习场景
 */

const STORAGE_KEYS = {
  TASKS: 'zhitu_tasks',
  FOCUS: 'zhitu_focus',
  INIT: 'zhitu_initialized',
  ACHIEVEMENTS: 'zhitu_achievements'
};

// 江苏初中12个学科分类
const CATEGORIES = {
  chinese:   { name: '语文',  icon: '📖', class: 'cat-chinese' },
  math:      { name: '数学',  icon: '🔢', class: 'cat-math' },
  english:   { name: '英语',  icon: '🔤', class: 'cat-english' },
  physics:   { name: '物理',  icon: '⚛️', class: 'cat-physics' },
  chemistry: { name: '化学',  icon: '🧪', class: 'cat-chemistry' },
  biology:   { name: '生物',  icon: '🧬', class: 'cat-biology' },
  history:   { name: '历史',  icon: '📜', class: 'cat-history' },
  politics:  { name: '道法',  icon: '⚖️', class: 'cat-politics' },
  geography: { name: '地理',  icon: '🌍', class: 'cat-geography' },
  pe:        { name: '体育',  icon: '⚽', class: 'cat-pe' },
  music:     { name: '音乐',  icon: '🎵', class: 'cat-music' },
  art:       { name: '美术',  icon: '🎨', class: 'cat-art' }
};

const PRIORITIES = {
  high:   { name: '高', class: 'priority-high' },
  medium: { name: '中', class: 'priority-medium' },
  low:    { name: '低', class: 'priority-low' }
};

// 中考日期（2027年江苏中考，通常在6月中旬）
const ZHONGKAO_DATE = '2027-06-17';

// 作业快速模板
const HOMEWORK_TEMPLATES = [
  { title: '语文作业',   category: 'chinese',   priority: 'high' },
  { title: '数学作业',   category: 'math',      priority: 'high' },
  { title: '英语作业',   category: 'english',   priority: 'high' },
  { title: '物理作业',   category: 'physics',   priority: 'high' },
  { title: '化学作业',   category: 'chemistry', priority: 'medium' },
  { title: '背单词30个', category: 'english',   priority: 'medium' },
  { title: '背诵课文',   category: 'chinese',   priority: 'medium' },
  { title: '错题复习',   category: 'math',      priority: 'medium' },
  { title: '预习新课',   category: 'chinese',   priority: 'low' },
  { title: '体育锻炼',   category: 'pe',        priority: 'medium' }
];

// 成就系统
const ACHIEVEMENTS = [
  { id: 'first_task',    name: '初心者',   icon: '🌱', desc: '完成第一个任务' },
  { id: 'hard_worker',   name: '勤学者',   icon: '📚', desc: '完成10个任务' },
  { id: 'focus_master',  name: '专注达人', icon: '🍅', desc: '完成10次番茄钟' },
  { id: 'streak_7',      name: '坚持不懈', icon: '🔥', desc: '连续7天专注学习' },
  { id: 'all_done',      name: '全勤王',   icon: '⭐', desc: '一天完成所有任务' },
  { id: 'perfect_score', name: '学霸',     icon: '🏆', desc: '效率评分达到90分' }
];

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function getToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getWeekDays() {
  const days = [];
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day;
  for (let i = 0; i < 7; i++) {
    const date = new Date(d.getFullYear(), d.getMonth(), diff + i);
    days.push(`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`);
  }
  return days;
}

function initData() {
  if (localStorage.getItem(STORAGE_KEYS.INIT)) return;

  const today = getToday();
  const yesterday = (() => {
    const d = new Date(); d.setDate(d.getDate()-1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  })();
  const tomorrow = (() => {
    const d = new Date(); d.setDate(d.getDate()+1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  })();

  const tasks = [
    { id: generateId(), title: '数学：完成习题册P45-46', category: 'math', priority: 'high', dueDate: today, completed: false, createdAt: Date.now() - 86400000 },
    { id: generateId(), title: '英语：背单词 Unit 8（30个）', category: 'english', priority: 'medium', dueDate: today, completed: false, createdAt: Date.now() - 86400000 },
    { id: generateId(), title: '语文：背诵《岳阳楼记》第三段', category: 'chinese', priority: 'high', dueDate: today, completed: false, createdAt: Date.now() - 172800000 },
    { id: generateId(), title: '物理：预习摩擦力章节', category: 'physics', priority: 'medium', dueDate: today, completed: true, createdAt: Date.now() - 86400000, completedAt: Date.now() - 3600000 },
    { id: generateId(), title: '化学：整理实验笔记', category: 'chemistry', priority: 'low', dueDate: yesterday, completed: true, createdAt: Date.now() - 172800000, completedAt: Date.now() - 86400000 },
    { id: generateId(), title: '历史：复习中国古代史时间线', category: 'history', priority: 'medium', dueDate: today, completed: true, createdAt: Date.now() - 86400000, completedAt: Date.now() - 7200000 },
    { id: generateId(), title: '数学：错题本复习（上周错题）', category: 'math', priority: 'medium', dueDate: tomorrow, completed: false, createdAt: Date.now() - 3600000 },
    { id: generateId(), title: '体育：跳绳500个+慢跑15分钟', category: 'pe', priority: 'low', dueDate: tomorrow, completed: false, createdAt: Date.now() - 3600000 }
  ];

  const focusRecords = [
    { id: generateId(), duration: 25, actualDuration: 25, startTime: Date.now() - 86400000, endTime: Date.now() - 86340000, completed: true },
    { id: generateId(), duration: 25, actualDuration: 25, startTime: Date.now() - 43200000, endTime: Date.now() - 43170000, completed: true },
    { id: generateId(), duration: 45, actualDuration: 45, startTime: Date.now() - 3600000, endTime: Date.now() - 900000, completed: true }
  ];

  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  localStorage.setItem(STORAGE_KEYS.FOCUS, JSON.stringify(focusRecords));
  localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.INIT, 'true');
}

function getTasks() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
}

function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
}

function addTask(task) {
  const tasks = getTasks();
  tasks.push({ ...task, id: generateId(), createdAt: Date.now() });
  saveTasks(tasks);
  return tasks;
}

function updateTask(id, updates) {
  const tasks = getTasks();
  const idx = tasks.findIndex(t => t.id === id);
  if (idx >= 0) {
    tasks[idx] = { ...tasks[idx], ...updates };
    saveTasks(tasks);
  }
  return tasks;
}

function deleteTask(id) {
  const tasks = getTasks().filter(t => t.id !== id);
  saveTasks(tasks);
  return tasks;
}

function toggleTask(id) {
  const tasks = getTasks();
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    task.completedAt = task.completed ? Date.now() : null;
    saveTasks(tasks);
  }
  return tasks;
}

function getFocusRecords() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.FOCUS) || '[]');
}

function saveFocusRecords(records) {
  localStorage.setItem(STORAGE_KEYS.FOCUS, JSON.stringify(records));
}

function addFocusRecord(record) {
  const records = getFocusRecords();
  records.push({ ...record, id: generateId() });
  saveFocusRecords(records);
  return records;
}

// 成就系统
function getAchievements() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS) || '[]');
}

function saveAchievements(achievements) {
  localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
}

function checkAndUnlockAchievements() {
  const tasks = getTasks();
  const focusRecords = getFocusRecords().filter(r => r.completed);
  const unlocked = getAchievements();
  const newlyUnlocked = [];

  const stats = {
    totalCompleted: tasks.filter(t => t.completed).length,
    totalFocus: focusRecords.length,
    streak: calculateStreak(focusRecords),
    allDoneDays: countAllDoneDays(tasks),
    maxScore: getCurrentMaxScore()
  };

  ACHIEVEMENTS.forEach(ach => {
    if (unlocked.includes(ach.id)) return;
    let condition = false;
    switch (ach.id) {
      case 'first_task':    condition = stats.totalCompleted >= 1; break;
      case 'hard_worker':   condition = stats.totalCompleted >= 10; break;
      case 'focus_master':  condition = stats.totalFocus >= 10; break;
      case 'streak_7':      condition = stats.streak >= 7; break;
      case 'all_done':      condition = stats.allDoneDays >= 1; break;
      case 'perfect_score': condition = stats.maxScore >= 90; break;
    }
    if (condition) {
      unlocked.push(ach.id);
      newlyUnlocked.push(ach);
    }
  });

  saveAchievements(unlocked);
  return newlyUnlocked;
}

function calculateStreak(records) {
  if (records.length === 0) return 0;
  const dates = [...new Set(records.map(r => {
    const d = new Date(r.startTime);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }))].sort();

  if (dates.length === 0) return 0;

  let streak = 1;
  for (let i = dates.length - 1; i > 0; i--) {
    const curr = new Date(dates[i]);
    const prev = new Date(dates[i-1]);
    const diff = (curr - prev) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function countAllDoneDays(tasks) {
  const dateGroups = {};
  tasks.forEach(t => {
    if (!dateGroups[t.dueDate]) dateGroups[t.dueDate] = [];
    dateGroups[t.dueDate].push(t);
  });
  let count = 0;
  Object.values(dateGroups).forEach(group => {
    if (group.length > 0 && group.every(t => t.completed)) count++;
  });
  return count;
}

function getCurrentMaxScore() {
  const tasks = getTasks();
  const focusRecords = getFocusRecords();
  const weekDays = getWeekDays();
  const weekTasks = tasks.filter(t => weekDays.includes(t.dueDate));
  const weekCompleted = weekTasks.filter(t => t.completed).length;
  const weekRate = weekTasks.length > 0 ? Math.round((weekCompleted / weekTasks.length) * 100) : 0;
  const totalFocusMinutes = focusRecords.filter(r => r.completed).reduce((sum, r) => sum + r.actualDuration, 0);
  const totalFocusHours = totalFocusMinutes / 60;
  return Math.min(100, Math.round(weekRate * 0.5 + Math.min(totalFocusHours * 10, 50)));
}

function clearAllData() {
  localStorage.removeItem(STORAGE_KEYS.TASKS);
  localStorage.removeItem(STORAGE_KEYS.FOCUS);
  localStorage.removeItem(STORAGE_KEYS.ACHIEVEMENTS);
  localStorage.removeItem(STORAGE_KEYS.INIT);
  initData();
}

function getTasksByDate(date) {
  return getTasks().filter(t => t.dueDate === date);
}

function getTodayTasks() {
  return getTasksByDate(getToday());
}
