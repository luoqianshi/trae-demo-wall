import db from '../config/database';

// 每个分类抽2-3个最容易出人物的任务来检查
const tasks = db.prepare(`
  SELECT id, title, category FROM tasks 
  ORDER BY category, id
`).all() as any[];

// 按分类分组
const byCat: Record<string, any[]> = {};
tasks.forEach((t: any) => {
  if (!byCat[t.category]) byCat[t.category] = [];
  byCat[t.category].push(t);
});

console.log('各分类任务数:');
Object.entries(byCat).sort().forEach(([cat, list]) => {
  console.log(`  ${cat}: ${list.length}个`);
  // 打印每个分类的所有任务名，方便判断哪些容易出问题
  // list.forEach((t: any) => console.log(`    [${t.id}] ${t.title}`));
});

// 高风险任务（容易出人物/动物）
const highRisk = [
  // 人文/历史类（人物）
  '秦始皇兵马俑', '历史名人小传', '郑和下西洋', '长城的故事', '国旗国徽',
  '中国茶文化', '丝绸之路地图', '二十四节气研究', '古代四大发明研究',
  '我的家族故事', '家乡非遗小调查', '我家老物件博物馆',
  '中国传统节日研究', '中国汉字演变', '地方方言收集',
  '创作一本绘本', '古诗词里的四季',
  // 语文/英语（人物）
  '成语故事小剧场', '古诗配画创作', '寓言故事新编', '小小书法家',
  '我的第一本日记', '绕口令大挑战', '童谣创编小达人',
  '英语绘本小读者', '英语歌曲小歌手', '我的英语自我介绍',
  '英语情景对话', '英语国家文化探索',
  // 生活实践（人物）
  '包饺子', '社区志愿服务', '心肺复苏(CPR)学习', '小小志愿者',
  '校园文明公约', '诚信小故事', '团结合作的力量',
  '运动打卡', '学做菜', '防溺水安全教育', '火灾逃生我知道',
  '网络安全小卫士', '校园防欺凌', '情绪管理小达人',
  // 自然/生物（动物）
  '蚂蚁行为观察', '小区鸟类调查', '蝴蝶生命周期', '蚕宝宝成长',
  '恐龙时代探秘', '树叶变色实验', '昆虫标本制作', '蘑菇种植日记',
  '食物链探秘', '微生物观察',
  // 编程/计算机（人物）
  '我的第一个动画故事', '迷宫小游戏', '打地鼠大作战',
  '英语单词记忆器', '电子相册制作', '天气查询小程序',
  '数学图形绘制', '打字练习小能手', '猜数字大挑战',
  // AI（人物）
  '什么是人工智能', 'AI绘画体验', '语音助手初体验', 'AI与生活',
];

console.log('\n高风险任务ID查询:');
highRisk.forEach(name => {
  const t = tasks.find((x: any) => x.title === name);
  if (t) {
    console.log(`  [${t.id}] ${t.title} (${t.category})`);
  }
});
