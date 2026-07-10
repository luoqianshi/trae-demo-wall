export type AchievementLevel = 'micro' | 'minor' | 'growth' | 'major' | 'transformation';

export interface AchievementCondition {
  evaluate: (stats: Record<string, any>) => boolean;
  progress: (stats: Record<string, any>) => number;
  threshold: { field: string; value: number | boolean } | null;
}

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  level: AchievementLevel;
  category: string;
}

export const achievementDefinitions: AchievementDefinition[] = [
  { id: 'records_1', title: '启程', description: '第1条记录', icon: '🌱', level: 'micro', category: '记录' },
  { id: 'records_3', title: '初试', description: '第3条记录', icon: '✨', level: 'micro', category: '记录' },
  { id: 'records_7', title: '一周足迹', description: '第7条记录', icon: '📅', level: 'minor', category: '记录' },
  { id: 'records_14', title: '两周坚持', description: '第14条记录', icon: '💪', level: 'minor', category: '记录' },
  { id: 'records_30', title: '月度记录者', description: '第30条记录', icon: '🎯', level: 'growth', category: '记录' },
  { id: 'records_66', title: '习惯养成', description: '第66条记录', icon: '🔄', level: 'growth', category: '记录' },
  { id: 'records_100', title: '百条长路', description: '第100条记录', icon: '🌟', level: 'major', category: '记录' },
  { id: 'records_200', title: '双百里程', description: '第200条记录', icon: '🌈', level: 'transformation', category: '记录' },
  { id: 'streak_3', title: '三连击', description: '连续3天记录', icon: '🔥', level: 'micro', category: '连续' },
  { id: 'streak_7', title: '一周达人', description: '连续7天记录', icon: '📆', level: 'micro', category: '连续' },
  { id: 'streak_14', title: '两周坚持', description: '连续14天记录', icon: '🌙', level: 'minor', category: '连续' },
  { id: 'streak_21', title: '习惯养成', description: '连续21天记录', icon: '🔄', level: 'minor', category: '连续' },
  { id: 'streak_30', title: '月度勇士', description: '连续30天记录', icon: '💪', level: 'growth', category: '连续' },
  { id: 'streak_66', title: '深度习惯', description: '连续66天记录', icon: '⚡', level: 'growth', category: '连续' },
  { id: 'streak_100', title: '百日坚持', description: '连续100天记录', icon: '🏅', level: 'major', category: '连续' },
  { id: 'streak_365', title: '全年坚持', description: '连续365天记录', icon: '👑', level: 'transformation', category: '连续' },
  { id: 'challenge_first', title: '挑战者', description: '完成首个挑战', icon: '🎯', level: 'micro', category: '挑战' },
  { id: 'challenge_bronze_5', title: '青铜新手', description: '完成5个青铜挑战', icon: '🥉', level: 'micro', category: '挑战' },
  { id: 'challenge_silver_1', title: '白银进阶', description: '完成1个白银挑战', icon: '🥈', level: 'minor', category: '挑战' },
  { id: 'challenge_gold_1', title: '黄金勇士', description: '完成1个黄金挑战', icon: '🥇', level: 'minor', category: '挑战' },
  { id: 'challenge_all_types', title: '全能挑战者', description: '完成所有难度挑战', icon: '🏆', level: 'growth', category: '挑战' },
  { id: 'challenge_10', title: '挑战达人', description: '完成10个挑战', icon: '⭐', level: 'major', category: '挑战' },
  { id: 'task_first', title: '行动派', description: '完成第1个任务', icon: '✅', level: 'micro', category: '任务' },
  { id: 'task_5', title: '执行者', description: '完成5个任务', icon: '📋', level: 'minor', category: '任务' },
  { id: 'task_10', title: '任务达人', description: '完成10个任务', icon: '🎖️', level: 'growth', category: '任务' },
  { id: 'interact_first', title: '雪球之友', description: '首次与雪球互动', icon: '❄️', level: 'micro', category: '互动' },
  { id: 'interact_10', title: '亲密伙伴', description: '与雪球互动10次', icon: '💙', level: 'minor', category: '互动' },
  { id: 'interact_50', title: '雪球知己', description: '与雪球互动50次', icon: '💜', level: 'growth', category: '互动' },
  { id: 'interact_100', title: '最佳拍档', description: '与雪球互动100次', icon: '💝', level: 'major', category: '互动' },
  { id: 'hidden_midnight', title: '夜猫子', description: '深夜记录', icon: '🦉', level: 'minor', category: '隐藏' },
  { id: 'hidden_clicker', title: '雪球按摩师', description: '连续点击雪球100次', icon: '👆', level: 'growth', category: '隐藏' },
  { id: 'hidden_perfect', title: '完美主义者', description: '单条记录字数超过500字', icon: '💎', level: 'major', category: '隐藏' },
  { id: 'first_procrastination', title: '急救先锋', description: '首次使用拖延急救', icon: '⚡', level: 'micro', category: '急救' },
  { id: 'master_all', title: '雪球大师', description: '解锁所有其他成就', icon: '🌈', level: 'transformation', category: '大师' },
];

export const stepTemplates: {
  keywords: string[];
  category: string;
  generateSteps: (goal: string, currentState: string) => Array<{ description: string; completed: boolean }>;
}[] = [
  {
    keywords: ['躺', '床', '刷手机', '手机', '图书馆', '学习'],
    category: '躺床刷手机→去图书馆学习',
    generateSteps: (goal, currentState) => [
      { description: '继续躺着，但把手机放到枕头旁边。你不需要立刻起身，只是让手先休息一下。', completed: false },
      { description: '保持躺着的姿势，轻轻转动一下脚踝和手腕。让身体开始微微活动，不需要任何力气。', completed: false },
      { description: '慢慢坐起来，靠在床头。你可以继续休息，只是换个更清醒的姿势。', completed: false },
      { description: '坐起来后，把腿放到床边。脚踩到地上，感受地板的温度。', completed: false },
      { description: '站起来，走到书桌旁。把需要学习的书本或电脑装进书包，你已经离开了床。', completed: false },
      { description: '背上书包，走出房门。朝着图书馆的方向走，每一步都在靠近目标。', completed: false },
    ],
  },
  {
    keywords: ['躺', '床', '刷手机', '手机', '运动', '跑步', '锻炼'],
    category: '躺床刷手机→去运动跑步',
    generateSteps: (goal, currentState) => [
      { description: '继续躺着，把手机屏幕朝下扣在旁边。不用关掉，只是让眼睛先休息。', completed: false },
      { description: '躺着做几个深呼吸，吸气时肚子鼓起来，呼气时缩回去。让身体开始苏醒。', completed: false },
      { description: '在床上做几个简单的拉伸，伸直手臂和腿。像刚睡醒一样自然地舒展身体。', completed: false },
      { description: '坐起来，双脚踩到地板上。站起来，原地轻轻蹦两下，感受身体的力量。', completed: false },
      { description: '换上运动鞋和运动服。穿上它们的那一刻，你已经是一个准备运动的人了。', completed: false },
      { description: '走到门口，做几个开合跳热身。然后推开门，迈出第一步。', completed: false },
    ],
  },
  {
    keywords: ['沙发', '发呆', '坐', '做饭', '厨房', '吃饭'],
    category: '坐沙发发呆→去做饭',
    generateSteps: (goal, currentState) => [
      { description: '继续坐着，但把目光从虚空移到厨房的方向。只是看一眼，不需要动。', completed: false },
      { description: '在沙发上轻轻扭扭腰，活动一下肩膀。让身体从发呆的僵硬中慢慢松开。', completed: false },
      { description: '从沙发上站起来，可以先伸个懒腰。站着的你已经比坐着的你多了一份行动力。', completed: false },
      { description: '走到厨房门口，打开冰箱看一眼有什么食材。不需要想好做什么，先看看再说。', completed: false },
      { description: '拿出两三样食材放到台面上。挑一个最简单的菜开始洗，水流过手的感觉会让你更清醒。', completed: false },
      { description: '打开炉灶，倒油，开始炒菜。锅里的声音会告诉你，一切已经在进行了。', completed: false },
    ],
  },
  {
    keywords: ['躺', '不想动', '洗澡', '淋浴', '浴室'],
    category: '躺着不想动→去洗澡',
    generateSteps: (goal, currentState) => [
      { description: '继续躺着，想象一下热水冲在身上的感觉。不用动，只是在脑海里预演一下。', completed: false },
      { description: '动一动手指和脚趾，让末梢先醒过来。这是最小的动作，但身体已经开始响应了。', completed: false },
      { description: '翻个身，从躺变成侧卧。换一个姿势就是一次小小的改变。', completed: false },
      { description: '慢慢坐起来，在床边坐一会儿。你可以闭着眼睛坐，不用急着站起来。', completed: false },
      { description: '站起来，走到浴室。打开花洒，用手试一下水温。温热的水会帮你完成剩下的部分。', completed: false },
    ],
  },
  {
    keywords: ['短视频', '刷', '停不下来', '工作', '作业', '写'],
    category: '刷短视频停不下来→开始工作写作业',
    generateSteps: (goal, currentState) => [
      { description: '继续刷，但把手机亮度调低一点。让屏幕变得不那么吸引人，你的眼睛会自然想休息。', completed: false },
      { description: '刷完当前这个视频后，把手机翻过来扣在桌上。不需要关掉APP，只是暂时看不到屏幕。', completed: false },
      { description: '闭上眼睛揉一揉，让视线从屏幕的距离调整回来。深呼吸三次，每次呼气都把注意力拉回自己身上。', completed: false },
      { description: '站起来走两步，倒一杯水喝。让身体活动一下，打断刷视频的惯性。', completed: false },
      { description: '坐到书桌前，打开电脑或拿出作业本。不需要立刻开始写，只是先坐到那个位置上。', completed: false },
      { description: '写下第一行字或打开第一个文件。万事开头难，但第一行之后就容易多了。', completed: false },
      { description: '设定一个25分钟的专注时段。告诉自己只做25分钟，之后可以再休息。', completed: false },
    ],
  },
  {
    keywords: ['游戏', '玩', '停不下来', '睡觉', '休息'],
    category: '玩游戏不想停→去睡觉',
    generateSteps: (goal, currentState) => [
      { description: '继续玩，但把当前这局当成最后一局。告诉自己打完这局就结束，给自己一个明确的终点。', completed: false },
      { description: '打完之后，退出游戏但不要关掉。把游戏窗口最小化，让"退出"这个动作先发生。', completed: false },
      { description: '站起来伸个懒腰，活动一下因为久坐而僵硬的脖子和肩膀。', completed: false },
      { description: '去洗手间洗把脸，冷水会让你从游戏的兴奋中冷静下来。', completed: false },
      { description: '关掉电脑或主机，把手机放到离床远一点的地方。切断游戏的声音和光线。', completed: false },
      { description: '换上睡衣，躺到床上。闭上眼睛，感受枕头和被子的柔软，让身体知道该休息了。', completed: false },
    ],
  },
  {
    keywords: ['赖床', '不想起', '起床', '出门', '办事'],
    category: '赖床不想起→出门办事',
    generateSteps: (goal, currentState) => [
      { description: '继续躺着，但把闹钟再设一个5分钟后的。告诉自己5分钟后一定起来，先给自己一个缓冲。', completed: false },
      { description: '5分钟到了，把被子掀开一条缝。让空气进来，身体会自然感觉到温度变化。', completed: false },
      { description: '坐起来，把腿放到床边。脚踩到地板上，地板的凉意会帮你清醒。', completed: false },
      { description: '站起来走到窗边，拉开窗帘。光线是最好的闹钟，让阳光帮你彻底醒来。', completed: false },
      { description: '去洗把脸，换好出门的衣服。每穿一件衣服，你就离出门近了一步。', completed: false },
      { description: '拿好钥匙和需要的东西，走到门口。穿上鞋，推开门，你已经出发了。', completed: false },
    ],
  },
  {
    keywords: ['坐', '发呆', '打扫', '卫生', '收拾', '整理'],
    category: '坐着发呆→开始打扫卫生',
    generateSteps: (goal, currentState) => [
      { description: '继续坐着，但环顾一下四周。找到离你最近的一件需要收拾的东西，只需要看到它。', completed: false },
      { description: '伸出手，把最近的那件东西拿起来。比如桌上的一个杯子或一件衣服，只需要拿起来。', completed: false },
      { description: '站起来，把手里那件东西放到它该放的地方。你已经完成了第一个收拾动作。', completed: false },
      { description: '再找两三件东西放好。不需要想"大扫除"，只是顺手多放几件。', completed: false },
      { description: '拿出垃圾袋或抹布，选一个角落开始清理。从最小的区域开始，比如桌面或茶几。', completed: false },
      { description: '清理完一个角落后，自然地移到下一个。你已经有了惯性，停不下来了。', completed: false },
    ],
  },
  {
    keywords: ['社交媒体', '刷', '健身', '锻炼', '运动', '健身房'],
    category: '刷社交媒体→去健身',
    generateSteps: (goal, currentState) => [
      { description: '继续刷，但注意看一下时间。告诉自己已经刷了多久，让数字帮你意识到该停了。', completed: false },
      { description: '给最后一条感兴趣的内容点个赞，然后锁屏。不需要卸载APP，只是暂时放下手机。', completed: false },
      { description: '站起来做几个深蹲或俯卧撑。不需要做很多，5个就够，让肌肉唤醒你的身体意识。', completed: false },
      { description: '换上运动服和运动鞋。穿上它们就像穿上了"去健身"的开关。', completed: false },
      { description: '准备好水壶和毛巾，装进运动包。这些准备工作会让健身变得更顺理成章。', completed: false },
      { description: '出门走向健身房或运动场地。迈出家门的那一刻，最难的部分已经过去了。', completed: false },
    ],
  },
  {
    keywords: ['看剧', '停不下来', '追剧', '学习', '阅读', '看书'],
    category: '看剧停不下来→去学习阅读',
    generateSteps: (goal, currentState) => [
      { description: '继续看，但按下暂停键。不需要关掉，只是暂停一下，喝口水再继续也可以。', completed: false },
      { description: '暂停的时候站起来走一走，让眼睛从屏幕上移开。看看窗外或远处的墙壁，让视线放松。', completed: false },
      { description: '把播放设备放到另一个房间或够不到的地方。不是关掉，只是让"继续看"变得不那么方便。', completed: false },
      { description: '坐到书桌前，翻开一本书或打开学习资料。不需要立刻全神贯注，先浏览一下目录或标题。', completed: false },
      { description: '读第一段或做第一道题。告诉自己只做5分钟，如果5分钟后还是想看剧，可以回去。', completed: false },
      { description: '5分钟后你大概率已经进入状态了。继续下去，你会感谢现在做出选择的自己。', completed: false },
      { description: '设定一个学习时段，完成后奖励自己看一集剧。学习和娱乐可以共存，只是顺序要对。', completed: false },
    ],
  },
];
