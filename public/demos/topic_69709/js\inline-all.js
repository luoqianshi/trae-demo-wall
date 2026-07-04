// ============ 绘本数据库（13大分类，100+本经典绘本）============
const bookDatabase = [
  // ===== 认知启蒙类（10本）=====
  { id: 1, title: '好饿的毛毛虫', author: '艾瑞·卡尔', ageRange: '3-4', tags: ['认知启蒙', '自然', '颜色'], abilities: { language: 5, science: 4, art: 3, social: 2, emotion: 2 }, emoji: '🐛', description: '经典认知启蒙绘本，毛毛虫从出生到变成蝴蝶的故事。', readingTips: '让孩子数毛毛虫吃了几个东西，认识星期概念。' },
  { id: 2, title: '棕色的熊，棕色的熊，你在看什么', author: '比尔·马丁', ageRange: '3-4', tags: ['认知启蒙', '颜色', '动物'], abilities: { language: 5, science: 3, art: 4, social: 2, emotion: 2 }, emoji: '🐻', description: '韵文绘本，帮助孩子认识颜色和动物。', readingTips: '用唱的方式读出来，让孩子模仿动物叫声。' },
  { id: 3, title: '点点点', author: '埃尔维·杜莱', ageRange: '3-4', tags: ['认知启蒙', '互动', '颜色'], abilities: { language: 3, science: 3, art: 5, social: 3, emotion: 2 }, emoji: '🔵', description: '神奇的互动书，按一下点点就会变！', readingTips: '和孩子一起按、摇、吹，体验互动乐趣。' },
  { id: 4, title: '小黄和小蓝', author: '李欧·李奥尼', ageRange: '3-4', tags: ['认知启蒙', '颜色', '友情'], abilities: { language: 4, science: 4, art: 5, social: 4, emotion: 3 }, emoji: '🔵', description: '两个颜色小点点的友情故事，认识颜色混合。', readingTips: '用颜料让孩子体验颜色混合的魔法。' },
  { id: 5, title: '谁藏起来了', author: '大西悟', ageRange: '3-4', tags: ['认知启蒙', '观察', '动物'], abilities: { language: 3, science: 4, art: 3, social: 2, emotion: 2 }, emoji: '🐶', description: '找找看游戏书，锻炼观察力和记忆力。', readingTips: '和孩子比赛谁先找到藏起来的动物。' },
  { id: 6, title: '首先有一个苹果', author: '伊东宽', ageRange: '3-4', tags: ['认知启蒙', '数学', '自然'], abilities: { language: 4, science: 5, art: 3, social: 2, emotion: 2 }, emoji: '🍎', description: '从苹果开始逐步加入元素，有趣地教数数。', readingTips: '边读边数，猜猜下一页会出现什么。' },
  { id: 7, title: '晚安月亮', author: '玛格丽特·怀兹·布朗', ageRange: '3-4', tags: ['认知启蒙', '睡前', '生活'], abilities: { language: 4, science: 2, art: 4, social: 2, emotion: 4 }, emoji: '🌙', description: '小兔子睡前向房间每样东西道晚安。', readingTips: '睡前故事，和孩子一起说晚安。' },
  { id: 8, title: '好安静的蟋蟀', author: '艾瑞·卡尔', ageRange: '3-4', tags: ['认知启蒙', '昆虫', '声音'], abilities: { language: 4, science: 5, art: 4, social: 2, emotion: 3 }, emoji: '🦗', description: '小蟋蟀找到自己声音的故事。', readingTips: '模仿各种昆虫声音，让孩子猜猜是什么。' },
  { id: 9, title: '从头动到脚', author: '艾瑞·卡尔', ageRange: '3-4', tags: ['认知启蒙', '身体', '运动'], abilities: { language: 4, science: 4, art: 4, social: 3, emotion: 3 }, emoji: '🦒', description: '认识身体部位，跟着动物一起动起来。', readingTips: '和孩子一起模仿动物的动作。' },
  { id: 10, title: '小金鱼逃走了', author: '五味太郎', ageRange: '3-4', tags: ['认知启蒙', '观察', '趣味'], abilities: { language: 3, science: 3, art: 4, social: 2, emotion: 2 }, emoji: '🐟', description: '小金鱼躲在哪里？找找看游戏书。', readingTips: '让孩子找小金鱼藏在哪里。' },

  // ===== 翻翻/立体/互动玩具书（8本）=====
  { id: 11, title: '亲爱的动物园', author: '罗德·坎贝尔', ageRange: '3-4', tags: ['翻翻书', '动物', '互动'], abilities: { language: 4, science: 4, art: 3, social: 3, emotion: 2 }, emoji: '📦', description: '经典翻翻书，猜猜动物园送来什么动物。', readingTips: '让孩子翻开箱子猜猜是什么动物。' },
  { id: 12, title: '小波在哪里', author: '艾瑞·希尔', ageRange: '3-4', tags: ['翻翻书', '动物', '互动'], abilities: { language: 4, science: 3, art: 4, social: 3, emotion: 3 }, emoji: '🐕', description: '找小波的翻翻书，藏在各个角落。', readingTips: '翻开每一页找找小波在哪里。' },
  { id: 13, title: '打开打开', author: '五味太郎', ageRange: '3-4', tags: ['翻翻书', '认知', '互动'], abilities: { language: 4, science: 3, art: 4, social: 2, emotion: 2 }, emoji: '🎁', description: '打开各种盒子，发现惊喜。', readingTips: '和孩子一起打开书中的盒子。' },
  { id: 14, title: '变变变', author: '埃尔维·杜莱', ageRange: '3-4', tags: ['互动书', '颜色', '创意'], abilities: { language: 3, science: 3, art: 5, social: 3, emotion: 2 }, emoji: '🎨', description: '神奇的互动书，摇一摇颜色就变了。', readingTips: '和孩子一起摇、转、翻，体验颜色变化。' },
  { id: 15, title: '奇妙洞洞书系列', author: '多种作者', ageRange: '3-4', tags: ['洞洞书', '认知', '互动'], abilities: { language: 3, science: 4, art: 4, social: 2, emotion: 2 }, emoji: '🕳️', description: '透过洞洞发现惊喜，锻炼小手精细动作。', readingTips: '让孩子用手指探索洞洞里的世界。' },
  { id: 16, title: '立体书：小红帽', author: '多种版本', ageRange: '4-5', tags: ['立体书', '童话', '互动'], abilities: { language: 4, science: 2, art: 5, social: 3, emotion: 3 }, emoji: '👧', description: '经典童话立体书，场景栩栩如生。', readingTips: '翻开立体场景，让孩子感受童话世界。' },
  { id: 17, title: '触摸书：毛毛虫吃什么', author: '艾瑞·卡尔', ageRange: '3-4', tags: ['触摸书', '认知', '互动'], abilities: { language: 3, science: 4, art: 4, social: 2, emotion: 2 }, emoji: '🐛', description: '可以触摸的绘本，感受不同材质。', readingTips: '让孩子用手指触摸书中的各种材质。' },
  { id: 18, title: '声音书：农场里的朋友', author: '多种作者', ageRange: '3-4', tags: ['声音书', '动物', '互动'], abilities: { language: 3, science: 4, art: 3, social: 2, emotion: 2 }, emoji: '🐄', description: '按下按钮就能听到动物叫声。', readingTips: '让孩子听声音猜猜是什么动物。' },

  // ===== 情绪性格成长绘本（10本）=====
  { id: 19, title: '我的情绪小怪兽', author: '安娜·耶纳斯', ageRange: '3-5', tags: ['情绪成长', '情商', '颜色'], abilities: { language: 4, science: 2, art: 4, social: 3, emotion: 5 }, emoji: '👾', description: '用颜色和小怪兽帮助孩子认识情绪。', readingTips: '让孩子指出今天是什么颜色的小怪兽。' },
  { id: 20, title: '生气汤', author: '贝西·艾芙瑞', ageRange: '4-5', tags: ['情绪成长', '生气', '调节'], abilities: { language: 4, science: 2, art: 3, social: 3, emotion: 5 }, emoji: '😤', description: '妈妈用煮生气汤帮孩子释放坏情绪。', readingTips: '和孩子讨论生气时怎么办，一起"煮"生气汤。' },
  { id: 21, title: '菲菲生气了', author: '莫莉·卞', ageRange: '4-5', tags: ['情绪成长', '生气', '调节'], abilities: { language: 4, science: 2, art: 5, social: 3, emotion: 5 }, emoji: '😡', description: '菲菲生气后如何平静下来的故事。', readingTips: '讨论生气时可以做什么让自己平静。' },
  { id: 22, title: '杰瑞的冷静太空', author: '简·尼尔森', ageRange: '4-5', tags: ['情绪成长', '冷静', '调节'], abilities: { language: 4, science: 3, art: 4, social: 3, emotion: 5 }, emoji: '🚀', description: '创建一个冷静角帮助孩子调节情绪。', readingTips: '和孩子一起设计一个属于他的冷静角。' },
  { id: 23, title: '我不敢说，我怕被骂', author: '皮姆·凡·赫斯特', ageRange: '4-5', tags: ['情绪成长', '勇气', '沟通'], abilities: { language: 4, science: 2, art: 3, social: 4, emotion: 5 }, emoji: '🤐', description: '鼓励孩子勇敢说出自己的想法。', readingTips: '和孩子讨论为什么害怕说出来，鼓励表达。' },
  { id: 24, title: '勇敢的本', author: '英格丽德', ageRange: '4-5', tags: ['情绪成长', '勇气', '成长'], abilities: { language: 4, science: 2, art: 4, social: 3, emotion: 4 }, emoji: '🦁', description: '本如何战胜恐惧变得勇敢的故事。', readingTips: '讨论孩子害怕什么，一起想办法克服。' },
  { id: 25, title: '没关系，没关系', author: '长谷川义史', ageRange: '4-5', tags: ['情绪成长', '宽容', '成长'], abilities: { language: 4, science: 2, art: 4, social: 4, emotion: 4 }, emoji: '😊', description: '爷爷教会孩子宽容和接纳。', readingTips: '和孩子讨论什么事情可以说没关系。' },
  { id: 26, title: '大脚丫跳芭蕾', author: '艾米·杨', ageRange: '4-5', tags: ['情绪成长', '自信', '梦想'], abilities: { language: 4, science: 2, art: 5, social: 3, emotion: 4 }, emoji: '💃', description: '大脚丫女孩坚持梦想的故事。', readingTips: '讨论每个人都有独特之处，要相信自己。' },
  { id: 27, title: '糟糕，身上长条纹了', author: '大卫·香农', ageRange: '4-5', tags: ['情绪成长', '自我', '接纳'], abilities: { language: 4, science: 2, art: 5, social: 4, emotion: 4 }, emoji: '🌈', description: '卡米拉因为不敢做自己而长条纹。', readingTips: '讨论为什么要勇敢做自己。' },
  { id: 28, title: '小兔子的烦恼', author: '多种作者', ageRange: '3-4', tags: ['情绪成长', '烦恼', '解决'], abilities: { language: 4, science: 2, art: 3, social: 3, emotion: 4 }, emoji: '🐰', description: '小兔子遇到烦恼如何解决的故事。', readingTips: '和孩子讨论遇到烦恼可以怎么办。' },

  // ===== 行为习惯养成绘本（10本）=====
  { id: 29, title: '大卫不可以', author: '大卫·香农', ageRange: '3-5', tags: ['行为习惯', '规则', '家庭'], abilities: { language: 4, science: 1, art: 4, social: 4, emotion: 3 }, emoji: '🙅', description: '调皮大卫的故事，妈妈最后说爱你。', readingTips: '边读边让孩子说"不可以"，讨论危险行为。' },
  { id: 30, title: '鳄鱼怕怕牙医怕怕', author: '五味太郎', ageRange: '3-5', tags: ['行为习惯', '刷牙', '健康'], abilities: { language: 4, science: 2, art: 4, social: 3, emotion: 4 }, emoji: '🐊', description: '鳄鱼和牙医互相害怕但都要勇敢面对。', readingTips: '角色扮演，讨论为什么要刷牙。' },
  { id: 31, title: '牙齿大街的新鲜事', author: '鲁斯曼·安娜', ageRange: '4-5', tags: ['行为习惯', '刷牙', '健康'], abilities: { language: 4, science: 4, art: 4, social: 2, emotion: 3 }, emoji: '🦷', description: '哈克和迪克在牙齿上建房子的故事。', readingTips: '让孩子了解为什么要刷牙，蛀牙怎么来的。' },
  { id: 32, title: '肚子里有个火车站', author: '鲁斯曼·安娜', ageRange: '4-5', tags: ['行为习惯', '饮食', '健康'], abilities: { language: 4, science: 4, art: 4, social: 2, emotion: 3 }, emoji: '🚂', description: '用火车站比喻消化系统，教健康饮食。', readingTips: '讨论为什么要细嚼慢咽，少吃零食。' },
  { id: 33, title: '不睡觉的世界冠军', author: '西恩·泰勒', ageRange: '3-4', tags: ['行为习惯', '睡眠', '睡前'], abilities: { language: 4, science: 2, art: 4, social: 2, emotion: 3 }, emoji: '😴', description: '樱桃猪不想睡觉的各种借口。', readingTips: '睡前故事，讨论为什么要按时睡觉。' },
  { id: 34, title: '我要拉粑粑', author: '佐佐木洋子', ageRange: '3-4', tags: ['行为习惯', '如厕', '生活'], abilities: { language: 4, science: 3, art: 3, social: 2, emotion: 2 }, emoji: '🚽', description: '小动物学习上厕所的故事。', readingTips: '帮助孩子学习独立上厕所。' },
  { id: 35, title: '小熊宝宝绘本系列', author: '佐佐木洋子', ageRange: '3-4', tags: ['行为习惯', '生活', '习惯'], abilities: { language: 4, science: 3, art: 4, social: 3, emotion: 3 }, emoji: '🐻', description: '涵盖刷牙、洗澡、吃饭等生活习惯。', readingTips: '每天读一本，培养好习惯。' },
  { id: 36, title: '排队排队，排队接水', author: '多种作者', ageRange: '3-4', tags: ['行为习惯', '规则', '社交'], abilities: { language: 3, science: 2, art: 3, social: 4, emotion: 3 }, emoji: '🚰', description: '学习排队和遵守规则。', readingTips: '讨论为什么要排队，什么时候需要排队。' },
  { id: 37, title: '我会自己穿衣服', author: '多种作者', ageRange: '3-4', tags: ['行为习惯', '自理', '生活'], abilities: { language: 3, science: 2, art: 3, social: 3, emotion: 3 }, emoji: '👕', description: '学习自己穿衣服的生活技能。', readingTips: '读完让孩子尝试自己穿衣服。' },
  { id: 38, title: '收拾收拾，变干净', author: '多种作者', ageRange: '3-4', tags: ['行为习惯', '整理', '生活'], abilities: { language: 3, science: 2, art: 3, social: 3, emotion: 3 }, emoji: '🧹', description: '学习收拾玩具和整理房间。', readingTips: '读完和孩子一起收拾玩具。' },

  // ===== 亲情家庭主题绘本（10本）=====
  { id: 39, title: '猜猜我有多爱你', author: '山姆·麦克布雷尼', ageRange: '3-5', tags: ['亲情家庭', '爱', '表达'], abilities: { language: 4, science: 1, art: 2, social: 3, emotion: 5 }, emoji: '🐰', description: '大兔子和小兔子用各种方式表达爱。', readingTips: '玩"猜猜我有多爱你"游戏，表达爱。' },
  { id: 40, title: '逃家小兔', author: '玛格丽特·怀兹·布朗', ageRange: '3-5', tags: ['亲情家庭', '母爱', '想象'], abilities: { language: 5, science: 2, art: 3, social: 3, emotion: 5 }, emoji: '🐇', description: '小兔子要逃跑，妈妈说会追上去。', readingTips: '玩"如果你变成...我就变成..."游戏。' },
  { id: 41, title: '我爸爸', author: '安东尼·布朗', ageRange: '3-5', tags: ['亲情家庭', '父爱', '想象'], abilities: { language: 4, science: 2, art: 4, social: 3, emotion: 5 }, emoji: '👨', description: '孩子视角描绘强壮又温柔的爸爸。', readingTips: '让孩子说说爸爸是什么样的。' },
  { id: 42, title: '我妈妈', author: '安东尼·布朗', ageRange: '3-5', tags: ['亲情家庭', '母爱', '想象'], abilities: { language: 4, science: 2, art: 4, social: 3, emotion: 5 }, emoji: '👩', description: '描绘全能又充满爱心的妈妈。', readingTips: '让孩子说说妈妈是什么样的。' },
  { id: 43, title: '爷爷一定有办法', author: '菲比·吉尔曼', ageRange: '4-6', tags: ['亲情家庭', '祖孙', '智慧'], abilities: { language: 4, science: 3, art: 4, social: 4, emotion: 4 }, emoji: '👴', description: '爷爷把旧东西变成新东西的故事。', readingTips: '讨论旧东西可以怎么重新利用。' },
  { id: 44, title: '你看起来好像很好吃', author: '宫西达也', ageRange: '4-6', tags: ['亲情家庭', '恐龙', '父爱'], abilities: { language: 5, science: 3, art: 3, social: 4, emotion: 5 }, emoji: '🦖', description: '霸王龙和小甲龙感人的父子故事。', readingTips: '讨论为什么霸王龙不吃小甲龙，什么是爱。' },
  { id: 45, title: '爱心树', author: '谢尔·希尔弗斯坦', ageRange: '5-6', tags: ['亲情家庭', '奉献', '哲理'], abilities: { language: 5, science: 2, art: 3, social: 4, emotion: 5 }, emoji: '🌳', description: '大树无私给予男孩一切的故事。', readingTips: '讨论大树和男孩的关系，什么是给予。' },
  { id: 46, title: '团圆', author: '余丽琼', ageRange: '4-5', tags: ['亲情家庭', '团圆', '中国'], abilities: { language: 4, science: 2, art: 4, social: 4, emotion: 5 }, emoji: '🧧', description: '中国新年父女团圆的温馨故事。', readingTips: '讨论和家人团聚的意义。' },
  { id: 47, title: '外婆家', author: '多种作者', ageRange: '4-5', tags: ['亲情家庭', '祖孙', '童年'], abilities: { language: 4, science: 2, art: 4, social: 3, emotion: 4 }, emoji: '👵', description: '在外婆家度过的快乐童年时光。', readingTips: '让孩子说说外婆家的回忆。' },
  { id: 48, title: '抱抱', author: '杰兹·阿波罗', ageRange: '3-4', tags: ['亲情家庭', '拥抱', '爱'], abilities: { language: 3, science: 2, art: 4, social: 4, emotion: 5 }, emoji: '🤗', description: '小猩猩找妈妈求抱抱的故事。', readingTips: '读完给孩子一个大大的拥抱。' },

  // ===== 入园校园绘本（8本）=====
  { id: 49, title: '魔法亲亲', author: '奥黛莉·潘恩', ageRange: '3-4', tags: ['入园校园', '分离', '安慰'], abilities: { language: 4, science: 2, art: 4, social: 3, emotion: 5 }, emoji: '🦝', description: '浣熊妈妈给孩子的魔法亲亲缓解分离焦虑。', readingTips: '给孩子一个魔法亲亲，告诉他妈妈的爱一直都在。' },
  { id: 50, title: '我爱幼儿园', author: '塞尔日·布洛克', ageRange: '3-4', tags: ['入园校园', '幼儿园', '适应'], abilities: { language: 4, science: 2, art: 4, social: 4, emotion: 4 }, emoji: '🏫', description: '小朋友适应幼儿园生活的故事。', readingTips: '和孩子讨论幼儿园有什么好玩的事情。' },
  { id: 51, title: '汤姆上幼儿园', author: '玛丽·阿利娜·巴文', ageRange: '3-4', tags: ['入园校园', '幼儿园', '适应'], abilities: { language: 4, science: 2, art: 4, social: 4, emotion: 4 }, emoji: '🐰', description: '小兔子汤姆上幼儿园的经历。', readingTips: '讨论上幼儿园可能会遇到什么，怎么应对。' },
  { id: 52, title: '小阿力的大学校', author: '安荷特', ageRange: '4-5', tags: ['入园校园', '入学', '适应'], abilities: { language: 4, science: 2, art: 4, social: 4, emotion: 4 }, emoji: '🎒', description: '小阿力准备上小学的故事。', readingTips: '和孩子讨论小学和幼儿园有什么不同。' },
  { id: 53, title: '大卫上学去', author: '大卫·香农', ageRange: '4-5', tags: ['入园校园', '学校', '规则'], abilities: { language: 4, science: 2, art: 4, social: 4, emotion: 3 }, emoji: '📚', description: '大卫在学校学习遵守规则。', readingTips: '讨论学校里需要遵守什么规则。' },
  { id: 54, title: '老师，我为什么要上学', author: '奥斯卡·伯瑞尼弗', ageRange: '4-5', tags: ['入园校园', '学习', '思考'], abilities: { language: 4, science: 3, art: 3, social: 4, emotion: 3 }, emoji: '🤔', description: '哲学绘本，探讨为什么要上学。', readingTips: '和孩子讨论上学是为了什么。' },
  { id: 55, title: '同桌的阿达', author: '武田美穗', ageRange: '4-5', tags: ['入园校园', '同学', '友谊'], abilities: { language: 4, science: 2, art: 4, social: 4, emotion: 4 }, emoji: '👧', description: '和同桌相处的故事，学会理解和包容。', readingTips: '讨论如何和同学相处，遇到矛盾怎么办。' },
  { id: 56, title: '我要上小学了', author: '多种作者', ageRange: '5-6', tags: ['入园校园', '幼小衔接', '准备'], abilities: { language: 4, science: 3, art: 3, social: 4, emotion: 4 }, emoji: '📝', description: '幼小衔接准备，了解小学生活。', readingTips: '和孩子一起准备上小学需要的东西。' },

  // ===== 生命与爱主题绘本（8本）=====
  { id: 57, title: '小种子', author: '艾瑞·卡尔', ageRange: '3-5', tags: ['生命与爱', '生命', '自然'], abilities: { language: 4, science: 5, art: 4, social: 2, emotion: 3 }, emoji: '🌱', description: '小种子经历困难长成最大的花。', readingTips: '和孩子一起种一颗种子观察生长。' },
  { id: 58, title: '一片叶子落下来', author: '巴斯卡利亚', ageRange: '4-6', tags: ['生命与爱', '生命', '死亡'], abilities: { language: 4, science: 4, art: 4, social: 3, emotion: 5 }, emoji: '🍂', description: '叶子弗雷迪经历四季，理解生命轮回。', readingTips: '和孩子讨论生命的意义，自然的变化。' },
  { id: 59, title: '爷爷变成了幽灵', author: '金·弗珀兹·艾克松', ageRange: '4-6', tags: ['生命与爱', '死亡', '亲情'], abilities: { language: 4, science: 2, art: 4, social: 3, emotion: 5 }, emoji: '👻', description: '爷爷变成幽灵和小艾斯本告别的故事。', readingTips: '温柔地和孩子讨论死亡和告别。' },
  { id: 60, title: '楼上的外婆和楼下的外婆', author: '汤米·狄波拉', ageRange: '4-5', tags: ['生命与爱', '亲情', '衰老'], abilities: { language: 4, science: 2, art: 4, social: 4, emotion: 5 }, emoji: '👵', description: '两个外婆的故事，理解衰老和亲情。', readingTips: '讨论老人需要什么关爱。' },
  { id: 61, title: '獾的礼物', author: '苏珊·华莱', ageRange: '4-6', tags: ['生命与爱', '死亡', '礼物'], abilities: { language: 4, science: 2, art: 4, social: 4, emotion: 5 }, emoji: '🦊', description: '獾离开后留下的礼物温暖了朋友们。', readingTips: '讨论离开的人留下了什么美好的回忆。' },
  { id: 62, title: '再见，莫格', author: '朱迪斯·克尔', ageRange: '4-5', tags: ['生命与爱', '宠物', '告别'], abilities: { language: 4, science: 2, art: 4, social: 3, emotion: 5 }, emoji: '🐱', description: '小猫莫格离开后家人的思念。', readingTips: '讨论宠物离开后如何面对。' },
  { id: 63, title: '活了100万次的猫', author: '佐野洋子', ageRange: '5-6', tags: ['生命与爱', '生命', '爱'], abilities: { language: 5, science: 2, art: 4, social: 3, emotion: 5 }, emoji: '🐈', description: '一只活了100万次的猫终于懂得了爱。', readingTips: '讨论什么才是真正有意义的生活。' },
  { id: 64, title: '大象的算术', author: '赫姆·海恩', ageRange: '4-5', tags: ['生命与爱', '生命', '成长'], abilities: { language: 4, science: 4, art: 4, social: 3, emotion: 4 }, emoji: '🐘', description: '大象用算术理解生命的加减。', readingTips: '讨论生命中的得到和失去。' },

  // ===== 科普百科类（10本）=====
  { id: 65, title: '神奇校车系列', author: '乔安娜·柯尔', ageRange: '4-6', tags: ['科普百科', '科学', '探索'], abilities: { language: 4, science: 5, art: 4, social: 3, emotion: 3 }, emoji: '🚌', description: '卷毛老师带学生乘坐神奇校车探索科学。', readingTips: '和孩子一起探索书中的科学知识。' },
  { id: 66, title: 'DK儿童百科全书', author: 'DK出版社', ageRange: '5-6', tags: ['科普百科', '百科', '知识'], abilities: { language: 4, science: 5, art: 5, social: 2, emotion: 2 }, emoji: '📖', description: '精美的百科全书，涵盖各种知识。', readingTips: '和孩子一起翻阅感兴趣的章节。' },
  { id: 67, title: '我们的身体', author: '帕斯卡尔', ageRange: '4-5', tags: ['科普百科', '身体', '认知'], abilities: { language: 4, science: 5, art: 4, social: 3, emotion: 3 }, emoji: '🫀', description: '翻翻书形式认识身体结构和功能。', readingTips: '让孩子翻开了解身体各部位。' },
  { id: 68, title: '地球的奥秘', author: '多种作者', ageRange: '5-6', tags: ['科普百科', '地球', '自然'], abilities: { language: 4, science: 5, art: 5, social: 2, emotion: 3 }, emoji: '🌍', description: '了解地球的形成和各种自然现象。', readingTips: '讨论地球上的各种神奇现象。' },
  { id: 69, title: '恐龙百科', author: '多种作者', ageRange: '4-6', tags: ['科普百科', '恐龙', '古生物'], abilities: { language: 4, science: 5, art: 5, social: 2, emotion: 3 }, emoji: '🦕', description: '各种恐龙的知识和图片。', readingTips: '和孩子一起认识不同的恐龙。' },
  { id: 70, title: '太空探索', author: '多种作者', ageRange: '5-6', tags: ['科普百科', '太空', '宇宙'], abilities: { language: 4, science: 5, art: 5, social: 2, emotion: 3 }, emoji: '🚀', description: '了解太阳系和宇宙的奥秘。', readingTips: '讨论太空中有什么，想去哪里探索。' },
  { id: 71, title: '动物百科', author: '多种作者', ageRange: '4-5', tags: ['科普百科', '动物', '自然'], abilities: { language: 4, science: 5, art: 5, social: 2, emotion: 3 }, emoji: '🦁', description: '各种动物的知识和习性。', readingTips: '让孩子选择喜欢的动物深入了解。' },
  { id: 72, title: '昆虫记', author: '法布尔', ageRange: '5-6', tags: ['科普百科', '昆虫', '自然'], abilities: { language: 4, science: 5, art: 4, social: 2, emotion: 3 }, emoji: '🦋', description: '法布尔观察昆虫的经典著作绘本版。', readingTips: '和孩子一起观察身边的昆虫。' },
  { id: 73, title: '海洋百科', author: '多种作者', ageRange: '4-5', tags: ['科普百科', '海洋', '自然'], abilities: { language: 4, science: 5, art: 5, social: 2, emotion: 3 }, emoji: '🌊', description: '海洋生物和海洋知识。', readingTips: '讨论海洋里有什么神奇的生物。' },
  { id: 74, title: '植物百科', author: '多种作者', ageRange: '4-5', tags: ['科普百科', '植物', '自然'], abilities: { language: 4, science: 5, art: 5, social: 2, emotion: 3 }, emoji: '🌻', description: '各种植物的知识和生长过程。', readingTips: '和孩子一起观察植物的生长。' },

  // ===== 国学传统文化类（8本）=====
  { id: 75, title: '三字经绘本', author: '多种作者', ageRange: '4-6', tags: ['国学传统', '经典', '启蒙'], abilities: { language: 5, science: 2, art: 4, social: 4, emotion: 3 }, emoji: '📜', description: '三字经配图版，传统文化启蒙。', readingTips: '和孩子一起朗读三字经。' },
  { id: 76, title: '弟子规绘本', author: '多种作者', ageRange: '4-6', tags: ['国学传统', '礼仪', '经典'], abilities: { language: 5, science: 2, art: 4, social: 5, emotion: 3 }, emoji: '📖', description: '弟子规配图版，学习礼仪规范。', readingTips: '讨论弟子规中的道理如何在生活中运用。' },
  { id: 77, title: '中国神话故事', author: '多种作者', ageRange: '4-6', tags: ['国学传统', '神话', '传说'], abilities: { language: 5, science: 2, art: 4, social: 3, emotion: 3 }, emoji: '🐉', description: '盘古开天地、女娲补天等神话故事。', readingTips: '和孩子一起感受中国神话的魅力。' },
  { id: 78, title: '中国传统节日故事', author: '多种作者', ageRange: '4-5', tags: ['国学传统', '节日', '文化'], abilities: { language: 4, science: 2, art: 4, social: 4, emotion: 4 }, emoji: '🧨', description: '春节、端午、中秋等节日故事。', readingTips: '过节时读对应的节日故事。' },
  { id: 79, title: '二十四节气故事', author: '多种作者', ageRange: '4-5', tags: ['国学传统', '节气', '自然'], abilities: { language: 4, science: 4, art: 4, social: 3, emotion: 3 }, emoji: '🌾', description: '二十四节气的由来和习俗。', readingTips: '每个节气读对应的故事。' },
  { id: 80, title: '成语故事绘本', author: '多种作者', ageRange: '5-6', tags: ['国学传统', '成语', '故事'], abilities: { language: 5, science: 2, art: 4, social: 3, emotion: 3 }, emoji: '📚', description: '经典成语的由来故事。', readingTips: '读完让孩子说说成语的意思。' },
  { id: 81, title: '古诗绘本', author: '多种作者', ageRange: '4-6', tags: ['国学传统', '古诗', '文学'], abilities: { language: 5, science: 2, art: 5, social: 3, emotion: 4 }, emoji: '📝', description: '经典古诗配图版。', readingTips: '和孩子一起朗读古诗，感受意境。' },
  { id: 82, title: '西游记绘本', author: '吴承恩原著', ageRange: '5-6', tags: ['国学传统', '名著', '冒险'], abilities: { language: 5, science: 2, art: 5, social: 3, emotion: 4 }, emoji: '🐵', description: '西游记精彩章节绘本版。', readingTips: '和孩子一起感受孙悟空的冒险故事。' },

  // ===== 语言文学阅读类（10本）=====
  { id: 83, title: '从百草园到三味书屋', author: '鲁迅', ageRange: '5-6', tags: ['语言文学', '散文', '童年'], abilities: { language: 5, science: 3, art: 4, social: 3, emotion: 3 }, emoji: '🌿', description: '鲁迅散文绘本版，童年乐园回忆。', readingTips: '讨论孩子的童年乐园在哪里。' },
  { id: 84, title: '小王子', author: '圣埃克苏佩里', ageRange: '5-6', tags: ['语言文学', '哲理', '经典'], abilities: { language: 5, science: 2, art: 5, social: 4, emotion: 5 }, emoji: '🌟', description: '小王子星球旅行的哲理故事。', readingTips: '讨论什么是真正重要的东西。' },
  { id: 85, title: '夏洛的网', author: 'E.B.怀特', ageRange: '5-6', tags: ['语言文学', '友谊', '经典'], abilities: { language: 5, science: 3, art: 3, social: 5, emotion: 5 }, emoji: '🕷️', description: '蜘蛛夏洛和小猪威尔伯的友谊故事。', readingTips: '讨论真正的友谊是什么。' },
  { id: 86, title: '窗边的小豆豆', author: '黑柳彻子', ageRange: '5-6', tags: ['语言文学', '成长', '学校'], abilities: { language: 5, science: 2, art: 3, social: 4, emotion: 4 }, emoji: '👧', description: '小豆豆在巴学园的成长故事。', readingTips: '讨论什么样的学校是好学校。' },
  { id: 87, title: '绿野仙踪', author: '鲍姆', ageRange: '5-6', tags: ['语言文学', '冒险', '童话'], abilities: { language: 5, science: 2, art: 4, social: 4, emotion: 4 }, emoji: '🌈', description: '多萝西奥兹国冒险的故事。', readingTips: '和孩子一起感受冒险的乐趣。' },
  { id: 88, title: '安徒生童话精选', author: '安徒生', ageRange: '4-6', tags: ['语言文学', '童话', '经典'], abilities: { language: 5, science: 2, art: 4, social: 3, emotion: 4 }, emoji: '🧜', description: '海的女儿、丑小鸭等经典童话。', readingTips: '让孩子选择喜欢的童话阅读。' },
  { id: 89, title: '格林童话精选', author: '格林兄弟', ageRange: '4-6', tags: ['语言文学', '童话', '经典'], abilities: { language: 5, science: 2, art: 4, social: 3, emotion: 4 }, emoji: '🏰', description: '白雪公主、灰姑娘等经典童话。', readingTips: '和孩子一起感受童话的魅力。' },
  { id: 90, title: '伊索寓言', author: '伊索', ageRange: '4-5', tags: ['语言文学', '寓言', '智慧'], abilities: { language: 5, science: 2, art: 3, social: 4, emotion: 3 }, emoji: '🦊', description: '经典寓言故事，蕴含人生智慧。', readingTips: '读完讨论寓言告诉我们什么道理。' },
  { id: 91, title: '一千零一夜', author: '多种作者', ageRange: '5-6', tags: ['语言文学', '故事', '经典'], abilities: { language: 5, science: 2, art: 4, social: 3, emotion: 3 }, emoji: '🌙', description: '阿拉丁神灯等阿拉伯故事精选。', readingTips: '和孩子一起感受异域故事的魅力。' },
  { id: 92, title: '中国民间故事', author: '多种作者', ageRange: '4-5', tags: ['语言文学', '民间', '传统'], abilities: { language: 5, science: 2, art: 4, social: 4, emotion: 3 }, emoji: '🎭', description: '牛郎织女、田螺姑娘等民间故事。', readingTips: '和孩子一起感受中国民间故事的魅力。' },

  // ===== 益智思维逻辑类（8本）=====
  { id: 93, title: '数学绘本：谁偷了包子', author: '卢正惠', ageRange: '4-5', tags: ['益智思维', '数学', '推理'], abilities: { language: 4, science: 5, art: 4, social: 3, emotion: 3 }, emoji: '🥟', description: '用数学推理找出偷包子的人。', readingTips: '和孩子一起用数学方法解决问题。' },
  { id: 94, title: '数学绘本：过去是怎么算的', author: '多种作者', ageRange: '4-5', tags: ['益智思维', '数学', '历史'], abilities: { language: 4, science: 5, art: 4, social: 3, emotion: 3 }, emoji: '🔢', description: '了解数学的历史和发展。', readingTips: '讨论古代人是怎么计算的。' },
  { id: 95, title: '逻辑狗系列', author: '多种作者', ageRange: '3-5', tags: ['益智思维', '逻辑', '思维'], abilities: { language: 3, science: 5, art: 4, social: 2, emotion: 2 }, emoji: '🧠', description: '逻辑思维训练游戏书。', readingTips: '和孩子一起做逻辑思维游戏。' },
  { id: 96, title: '迷宫大冒险', author: '多种作者', ageRange: '4-5', tags: ['益智思维', '迷宫', '观察'], abilities: { language: 3, science: 4, art: 4, social: 2, emotion: 2 }, emoji: '🗺️', description: '各种迷宫挑战，锻炼观察力。', readingTips: '和孩子一起走迷宫，比赛谁更快。' },
  { id: 97, title: '找不同大挑战', author: '多种作者', ageRange: '3-4', tags: ['益智思维', '观察', '专注'], abilities: { language: 3, science: 4, art: 4, social: 2, emotion: 2 }, emoji: '🔍', description: '找不同游戏，锻炼观察力和专注力。', readingTips: '和孩子比赛找不同。' },
  { id: 98, title: '七巧板故事', author: '多种作者', ageRange: '4-5', tags: ['益智思维', '几何', '创意'], abilities: { language: 3, science: 5, art: 5, social: 2, emotion: 2 }, emoji: '🔷', description: '用七巧板拼出各种形状和故事。', readingTips: '和孩子一起用七巧板拼图。' },
  { id: 99, title: '形状变变变', author: '多种作者', ageRange: '3-4', tags: ['益智思维', '形状', '认知'], abilities: { language: 3, science: 4, art: 5, social: 2, emotion: 2 }, emoji: '⭐', description: '认识各种形状，用形状创作。', readingTips: '让孩子用形状画出自己的作品。' },
  { id: 100, title: '数字在哪里', author: '五味太郎', ageRange: '3-4', tags: ['益智思维', '数字', '认知'], abilities: { language: 3, science: 5, art: 4, social: 2, emotion: 2 }, emoji: '🔢', description: '在生活中发现数字的存在。', readingTips: '和孩子一起在生活中找数字。' },

  // ===== 艺术美育类（8本）=====
  { id: 101, title: '点', author: '彼得·雷诺兹', ageRange: '4-5', tags: ['艺术美育', '绘画', '自信'], abilities: { language: 4, science: 2, art: 5, social: 3, emotion: 4 }, emoji: '🔵', description: '一个小点开启孩子的艺术之旅。', readingTips: '让孩子也画一个点，开启创作。' },
  { id: 102, title: '味儿', author: '彼得·雷诺兹', ageRange: '4-5', tags: ['艺术美育', '艺术', '表达'], abilities: { language: 4, science: 2, art: 5, social: 3, emotion: 4 }, emoji: '🎨', description: '雷蒙学会用自己的方式表达艺术。', readingTips: '鼓励孩子用自己的方式表达。' },
  { id: 103, title: '阿罗有支彩色笔', author: '克罗格特·约翰逊', ageRange: '3-4', tags: ['艺术美育', '绘画', '想象'], abilities: { language: 4, science: 2, art: 5, social: 3, emotion: 3 }, emoji: '🖍️', description: '阿罗用彩色笔画出自己的世界。', readingTips: '让孩子也用笔画出自己的故事。' },
  { id: 104, title: '颜色的战争', author: '海勒', ageRange: '4-5', tags: ['艺术美育', '颜色', '创意'], abilities: { language: 4, science: 4, art: 5, social: 2, emotion: 3 }, emoji: '🎨', description: '各种颜色之间的有趣战争。', readingTips: '和孩子讨论颜色的性格和搭配。' },
  { id: 105, title: '艺术大魔法', author: '大卫·香农', ageRange: '4-5', tags: ['艺术美育', '绘画', '创意'], abilities: { language: 4, science: 2, art: 5, social: 3, emotion: 3 }, emoji: '🎭', description: '达芬蜥和马蒂的绘画冒险。', readingTips: '和孩子一起尝试不同的绘画方式。' },
  { id: 106, title: '美术馆奇遇记', author: '多种作者', ageRange: '5-6', tags: ['艺术美育', '艺术', '欣赏'], abilities: { language: 4, science: 2, art: 5, social: 3, emotion: 3 }, emoji: '🖼️', description: '在美术馆发现艺术的魅力。', readingTips: '带孩子去美术馆看真正的画作。' },
  { id: 107, title: '梵高和我', author: '迈克尔·帕克', ageRange: '5-6', tags: ['艺术美育', '画家', '故事'], abilities: { language: 4, science: 2, art: 5, social: 3, emotion: 4 }, emoji: '🌻', description: '关于梵高的儿童故事。', readingTips: '和孩子一起欣赏梵高的画作。' },
  { id: 108, title: '音乐绘本：动物音乐会', author: '多种作者', ageRange: '3-4', tags: ['艺术美育', '音乐', '动物'], abilities: { language: 3, science: 3, art: 5, social: 3, emotion: 3 }, emoji: '🎵', description: '动物们举办音乐会的故事。', readingTips: '和孩子一起模仿动物的"音乐"。' },

  // ===== 幼小衔接专项图书（8本）=====
  { id: 109, title: '幼小衔接：拼音启蒙', author: '多种作者', ageRange: '5-6', tags: ['幼小衔接', '拼音', '语言'], abilities: { language: 5, science: 2, art: 3, social: 2, emotion: 2 }, emoji: '🔤', description: '拼音学习的启蒙读物。', readingTips: '和孩子一起学习拼音，玩拼音游戏。' },
  { id: 110, title: '幼小衔接：汉字启蒙', author: '多种作者', ageRange: '5-6', tags: ['幼小衔接', '汉字', '语言'], abilities: { language: 5, science: 2, art: 4, social: 2, emotion: 2 }, emoji: '汉字', description: '基础汉字的学习启蒙。', readingTips: '让孩子认识常用汉字。' },
  { id: 111, title: '幼小衔接：数学启蒙', author: '多种作者', ageRange: '5-6', tags: ['幼小衔接', '数学', '思维'], abilities: { language: 3, science: 5, art: 3, social: 2, emotion: 2 }, emoji: '➕', description: '小学数学基础启蒙。', readingTips: '和孩子一起做数学启蒙练习。' },
  { id: 112, title: '幼小衔接：时间认知', author: '多种作者', ageRange: '5-6', tags: ['幼小衔接', '时间', '认知'], abilities: { language: 3, science: 5, art: 3, social: 2, emotion: 2 }, emoji: '⏰', description: '学习认识时钟和时间概念。', readingTips: '让孩子学习看时钟，安排时间。' },
  { id: 113, title: '幼小衔接：专注力训练', author: '多种作者', ageRange: '5-6', tags: ['幼小衔接', '专注', '习惯'], abilities: { language: 3, science: 4, art: 3, social: 2, emotion: 3 }, emoji: '🎯', description: '提升专注力的训练游戏。', readingTips: '和孩子一起做专注力训练。' },
  { id: 114, title: '幼小衔接：书写准备', author: '多种作者', ageRange: '5-6', tags: ['幼小衔接', '书写', '技能'], abilities: { language: 4, science: 2, art: 3, social: 2, emotion: 2 }, emoji: '✏️', description: '书写姿势和运笔练习。', readingTips: '让孩子练习正确的握笔姿势。' },
  { id: 115, title: '幼小衔接：自理能力', author: '多种作者', ageRange: '5-6', tags: ['幼小衔接', '自理', '生活'], abilities: { language: 3, science: 2, art: 3, social: 3, emotion: 3 }, emoji: '🎒', description: '培养小学需要的自理能力。', readingTips: '让孩子练习整理书包、收拾文具。' },
  { id: 116, title: '幼小衔接：社交能力', author: '多种作者', ageRange: '5-6', tags: ['幼小衔接', '社交', '沟通'], abilities: { language: 4, science: 2, art: 3, social: 5, emotion: 4 }, emoji: '🤝', description: '小学社交场景的应对能力。', readingTips: '讨论小学里如何和同学老师相处。' },

  // ===== 晋江图书馆真实借阅精选（80本）=====
  // --- 语言文学阅读类 ---
  { id: 117, title: '14只老鼠吃早餐', author: '岩村和朗', ageRange: '4-6', tags: ['语言文学', '自然', '亲情'], abilities: { language: 5, science: 3, art: 4, social: 3, emotion: 4 }, emoji: '🐭', description: '14只老鼠一家人温馨的早餐时光，感受大家庭的温暖。', readingTips: '让孩子数数画面里有几只老鼠，找一找每个家庭成员在做什么。' },
  { id: 118, title: '10只小青蛙的歌咏大赛去野餐', author: '间所寿子', ageRange: '3-5', tags: ['语言文学', '动物', '友谊'], abilities: { language: 5, science: 2, art: 4, social: 4, emotion: 3 }, emoji: '🐸', description: '10只小青蛙一起去野餐和参加歌咏比赛的有趣故事。', readingTips: '和孩子一起数青蛙，模仿青蛙叫声玩游戏。' },
  { id: 119, title: '生气的亚瑟', author: '希亚文·奥拉姆', ageRange: '4-6', tags: ['情绪成长', '生气', '调节'], abilities: { language: 5, science: 2, art: 4, social: 3, emotion: 5 }, emoji: '😤', description: '亚瑟的气越来越大，直到宇宙都被摧毁了，最后发现生气也没什么大不了。', readingTips: '和孩子讨论生气的时候身体有什么感觉，怎么让气消掉。' },
  { id: 120, title: '大家都是大猩猩', author: '高畠那生', ageRange: '3-5', tags: ['亲情家庭', '父爱', '想象'], abilities: { language: 4, science: 2, art: 5, social: 3, emotion: 5 }, emoji: '🦍', description: '爸爸变成了大猩猩，和孩子一起度过奇妙的一天。', readingTips: '和孩子玩"如果爸爸变成...会怎么样"的想象游戏。' },
  { id: 121, title: '母鸡萝丝去散步', author: '佩特·哈群斯', ageRange: '3-5', tags: ['语言文学', '幽默', '动物'], abilities: { language: 5, science: 2, art: 4, social: 3, emotion: 3 }, emoji: '🐔', description: '萝丝出门散步，狐狸在后面跟着，发生了一连串好笑的事。', readingTips: '让孩子猜猜狐狸接下来会遇到什么倒霉事，锻炼预测能力。' },
  { id: 122, title: '蚂蚁和西瓜', author: '田村茂', ageRange: '3-5', tags: ['语言文学', '合作', '昆虫'], abilities: { language: 4, science: 4, art: 4, social: 5, emotion: 3 }, emoji: '🍉', description: '小蚂蚁发现了一块大西瓜，大家一起想办法把西瓜搬回家。', readingTips: '讨论为什么蚂蚁能搬动比自己大很多的西瓜，团结合作的力量。' },
  { id: 123, title: '好饿的小蛇', author: '宫西达也', ageRange: '3-4', tags: ['语言文学', '幽默', '认知'], abilities: { language: 5, science: 3, art: 4, social: 2, emotion: 3 }, emoji: '🐍', description: '好饿的小蛇扭来扭去散步，吃了各种各样的东西，肚子变成了各种形状。', readingTips: '让孩子猜猜小蛇吃了东西后肚子会变成什么形状，认识不同形状。' },
  { id: 124, title: '爷爷一定有办法', author: '菲比·吉尔曼', ageRange: '4-6', tags: ['亲情家庭', '祖孙', '智慧'], abilities: { language: 5, science: 3, art: 4, social: 4, emotion: 5 }, emoji: '👴', description: '爷爷把旧毯子一次次变成新东西，充满智慧和爱的故事。', readingTips: '和孩子讨论旧东西还可以怎么重新利用，培养环保意识。' },
  { id: 125, title: '逃家小兔', author: '玛格丽特·怀兹·布朗', ageRange: '3-5', tags: ['亲情家庭', '母爱', '想象'], abilities: { language: 5, science: 2, art: 3, social: 3, emotion: 5 }, emoji: '🐇', description: '小兔子要离家出走，妈妈说会一直追着他，因为他是妈妈的小宝贝。', readingTips: '玩"如果你变成...我就变成..."的想象游戏，感受母爱。' },
  { id: 126, title: '河马幼儿园', author: '郑振铎', ageRange: '3-4', tags: ['入园校园', '幼儿园', '适应'], abilities: { language: 4, science: 2, art: 3, social: 5, emotion: 4 }, emoji: '🦛', description: '小河马第一次上幼儿园的故事，认识幼儿园的生活。', readingTips: '和孩子讨论幼儿园里有什么好玩的，缓解入园焦虑。' },
  { id: 127, title: '小山羊和小老虎', author: '鲁兵', ageRange: '4-6', tags: ['语言文学', '友谊', '动物'], abilities: { language: 5, science: 2, art: 3, social: 5, emotion: 4 }, emoji: '🐐', description: '小山羊和小老虎成了好朋友，原来天敌也可以做朋友。', readingTips: '讨论为什么不同的人也可以成为好朋友，什么是真正的友谊。' },
  { id: 128, title: '我爸爸是大英雄', author: '丹·雷莫斯·德·弗里斯', ageRange: '4-6', tags: ['亲情家庭', '父爱', '英雄'], abilities: { language: 4, science: 2, art: 4, social: 3, emotion: 5 }, emoji: '🦸', description: '孩子眼中的爸爸是个大英雄，无所不能。', readingTips: '让孩子说说自己的爸爸有什么厉害的地方。' },
  { id: 129, title: '讨厌牙刷的男孩', author: '泽赫拉·希克', ageRange: '3-5', tags: ['行为习惯', '刷牙', '健康'], abilities: { language: 4, science: 3, art: 4, social: 2, emotion: 4 }, emoji: '🪥', description: '一个讨厌刷牙的男孩，最后发现刷牙的重要性。', readingTips: '和孩子讨论为什么要刷牙，不刷牙会怎么样。' },
  { id: 130, title: '大城市里的小象', author: '迈克·库拉托', ageRange: '4-6', tags: ['语言文学', '友谊', '城市'], abilities: { language: 5, science: 2, art: 5, social: 4, emotion: 4 }, emoji: '🐘', description: '小象在大城市里感到渺小，直到遇到了更小的朋友。', readingTips: '讨论每个人都有自己的价值，帮助别人也会让自己快乐。' },
  { id: 131, title: '小鲸鱼回来了', author: '本吉·戴维斯', ageRange: '4-6', tags: ['语言文学', '友情', '海洋'], abilities: { language: 5, science: 3, art: 5, social: 4, emotion: 5 }, emoji: '🐋', description: '小男孩和小鲸鱼之间跨越海洋的友谊故事。', readingTips: '讨论朋友分开了怎么办，真正的友谊不会因为距离而消失。' },
  { id: 132, title: '小象的游乐园大冒险', author: '迈克·库拉托', ageRange: '4-6', tags: ['语言文学', '冒险', '友谊'], abilities: { language: 4, science: 2, art: 5, social: 4, emotion: 4 }, emoji: '🎢', description: '小象和小老鼠的游乐园大冒险，充满惊喜和快乐。', readingTips: '让孩子说说最喜欢游乐园里的什么项目。' },
  { id: 133, title: '波西和皮普', author: '阿克塞尔·舍夫勒', ageRange: '3-5', tags: ['语言文学', '友谊', '生活'], abilities: { language: 5, science: 2, art: 4, social: 5, emotion: 4 }, emoji: '🐸', description: '波西和皮普是最好的朋友，一起经历了很多有趣的小事。', readingTips: '讨论好朋友之间应该怎么相处，吵架了怎么办。' },
  { id: 134, title: '鸡蛋哥哥大全集', author: '秋山匡', ageRange: '3-5', tags: ['语言文学', '成长', '勇气'], abilities: { language: 5, science: 2, art: 4, social: 3, emotion: 5 }, emoji: '🥚', description: '鸡蛋哥哥一直不想从蛋壳里出来，最后终于鼓起勇气破壳。', readingTips: '讨论长大是怎么回事，鼓励孩子勇敢面对成长。' },
  { id: 135, title: '屁屁侦探', author: 'Troll', ageRange: '5-6', tags: ['益智思维', '推理', '侦探'], abilities: { language: 4, science: 3, art: 4, social: 2, emotion: 3 }, emoji: '🍑', description: '屁屁侦探用智慧破解各种案件，超级有趣的推理绘本。', readingTips: '和孩子一起找线索、破案，锻炼观察力和逻辑思维。' },
  { id: 136, title: '野猫军团吃咖喱饭', author: '工藤纪子', ageRange: '3-5', tags: ['语言文学', '美食', '冒险'], abilities: { language: 4, science: 2, art: 5, social: 3, emotion: 4 }, emoji: '🍛', description: '野猫军团偷偷做咖喱饭，结果弄得一团糟。', readingTips: '讨论做事要认真，不能偷偷摸摸，自己动手的乐趣。' },

  // --- 益智思维逻辑类 ---
  { id: 137, title: '今晚七点半，数学妈妈的游戏课', author: '曲少云', ageRange: '4-6', tags: ['益智思维', '数学', '游戏'], abilities: { language: 4, science: 5, art: 3, social: 2, emotion: 3 }, emoji: '🔢', description: '用游戏的方式教孩子数学，让数学变得有趣。', readingTips: '和孩子一起玩书里的数学游戏，在生活中发现数学。' },
  { id: 138, title: '奇迹幼儿数学', author: 'Naon教育研究所', ageRange: '5-6', tags: ['益智思维', '数学', '幼小衔接'], abilities: { language: 3, science: 5, art: 3, social: 2, emotion: 2 }, emoji: '➕', description: '学习大数并进行简单的运算，为小学数学打基础。', readingTips: '用生活中的物品练习加减法，比如数水果、数玩具。' },
  { id: 139, title: '真相只有一个', author: '保罗·马丁', ageRange: '5-6', tags: ['益智思维', '推理', '观察力'], abilities: { language: 4, science: 4, art: 4, social: 2, emotion: 3 }, emoji: '🔍', description: '超好玩的侦探推理书，在错综复杂的线索中找出真相。', readingTips: '和孩子一起当侦探，比赛谁先找到答案。' },
  { id: 140, title: '猫咪大侦探', author: '保罗·马丁', ageRange: '5-6', tags: ['益智思维', '侦探', '逻辑'], abilities: { language: 4, science: 4, art: 4, social: 2, emotion: 3 }, emoji: '🐱', description: '猫咪侦探破解各种奇案，考验观察力和逻辑思维。', readingTips: '引导孩子仔细观察画面细节，培养专注力和推理能力。' },
  { id: 141, title: '聪明宝宝左右脑潜能开发', author: '松鼠少儿', ageRange: '5-6', tags: ['益智思维', '全脑开发', '认知'], abilities: { language: 4, science: 5, art: 4, social: 2, emotion: 3 }, emoji: '🧠', description: '左右脑均衡开发的益智游戏书，全面提升思维能力。', readingTips: '每天和孩子玩几页，循序渐进开发智力。' },
  { id: 142, title: '一古拉的岔路口奇遇', author: '幼发拉底', ageRange: '4-6', tags: ['益智思维', '选择', '冒险'], abilities: { language: 5, science: 3, art: 5, social: 3, emotion: 4 }, emoji: '🚦', description: '每一页都有岔路口可以选择，每次读都有不一样的故事。', readingTips: '让孩子自己选择路线，体验不同的故事结局。' },
  { id: 143, title: '跟着地图去探秘', author: '尤斯伯恩出版公司', ageRange: '5-6', tags: ['益智思维', '地理', '探索'], abilities: { language: 4, science: 5, art: 4, social: 2, emotion: 3 }, emoji: '🗺️', description: '跟着地图探索世界，了解不同的地方和文化。', readingTips: '和孩子一起在地图上找不同的国家，认识世界。' },
  { id: 144, title: '大探险家消失之谜：学习算术', author: '斯特法妮·加尔尼', ageRange: '5-6', tags: ['益智思维', '数学', '侦探'], abilities: { language: 4, science: 5, art: 3, social: 2, emotion: 3 }, emoji: '🧮', description: '通过侦探故事学习算术，数学变得超有趣。', readingTips: '一边读故事一边解题，让孩子在趣味中学数学。' },
  { id: 145, title: '我在汉朝当神探', author: '段张取艺', ageRange: '5-6', tags: ['益智思维', '历史', '推理'], abilities: { language: 4, science: 3, art: 4, social: 3, emotion: 3 }, emoji: '🏯', description: '穿越到汉朝当神探，一边破案一边学历史知识。', readingTips: '讨论汉朝是什么样的，和现在有什么不一样。' },
  { id: 146, title: '哇！好多汽车日本经典推理力培养大书', author: '马尔钦·布雷克钦斯基', ageRange: '5-6', tags: ['益智思维', '汽车', '观察力'], abilities: { language: 3, science: 4, art: 5, social: 2, emotion: 2 }, emoji: '🚗', description: '超多汽车的图画书，在找一找中培养观察力和专注力。', readingTips: '和孩子比赛找汽车，看谁先找到指定的那辆车。' },
  { id: 147, title: '天才儿童头脑风暴系列游戏书', author: '谢伦琴', ageRange: '5-6', tags: ['益智思维', '全脑开发', '游戏'], abilities: { language: 4, science: 5, art: 3, social: 2, emotion: 3 }, emoji: '💡', description: '各种头脑风暴游戏，全面开发孩子的思维能力。', readingTips: '每天玩几个游戏，让大脑越来越灵活。' },
  { id: 148, title: '空间想象力', author: '李骁', ageRange: '5-6', tags: ['益智思维', '空间', '数学'], abilities: { language: 3, science: 5, art: 4, social: 2, emotion: 2 }, emoji: '📦', description: '培养空间想象力的益智书，为数学学习打基础。', readingTips: '用积木和孩子一起玩空间游戏，比如搭积木、折纸。' },
  { id: 149, title: '疯狂海洋城', author: '凯瑟琳娜·马诺利索', ageRange: '4-6', tags: ['益智思维', '海洋', '观察力'], abilities: { language: 4, science: 4, art: 5, social: 2, emotion: 3 }, emoji: '🌊', description: '海洋城里藏着好多秘密，一起来找找看吧。', readingTips: '和孩子一起找画面里的小细节，培养观察力和专注力。' },
  { id: 150, title: '生日会大冒险', author: '土井麻希', ageRange: '4-6', tags: ['益智思维', '迷宫', '冒险'], abilities: { language: 4, science: 4, art: 5, social: 3, emotion: 4 }, emoji: '🎂', description: '去参加生日会的路上要经过好多迷宫，一起来闯关吧。', readingTips: '和孩子一起走迷宫，锻炼空间思维和手眼协调。' },
  { id: 151, title: '宝藏岛大冒险', author: '土井麻希', ageRange: '4-6', tags: ['益智思维', '迷宫', '冒险'], abilities: { language: 4, science: 4, art: 5, social: 3, emotion: 4 }, emoji: '🏝️', description: '到宝藏岛去寻宝，一路上要解开好多谜题。', readingTips: '走迷宫的同时讨论寻宝故事，增加趣味性。' },

  // --- 科普百科类 ---
  { id: 152, title: '我的100个小小问题', author: '今泉忠明', ageRange: '4-6', tags: ['科普百科', '自然', '动物'], abilities: { language: 4, science: 5, art: 3, social: 2, emotion: 2 }, emoji: '❓', description: '解答孩子最常问的100个小问题，满足好奇心。', readingTips: '鼓励孩子多提问，一起在生活中寻找答案。' },
  { id: 153, title: '汪汪队立大功拯救恐龙大冒险', author: '新天地童书', ageRange: '4-6', tags: ['科普百科', '恐龙', '救援'], abilities: { language: 4, science: 5, art: 4, social: 4, emotion: 3 }, emoji: '🦕', description: '汪汪队和恐龙的冒险故事，了解恐龙知识。', readingTips: '看完后让孩子说说认识了哪些恐龙，有什么特点。' },
  { id: 154, title: '别让恐龙进超市', author: '蒂莫西·纳普曼', ageRange: '4-6', tags: ['科普百科', '恐龙', '幽默'], abilities: { language: 5, science: 4, art: 4, social: 3, emotion: 4 }, emoji: '🦖', description: '如果恐龙跑进超市会怎么样？超有趣的恐龙科普。', readingTips: '讨论为什么恐龙不能生活在现代，它们生活在什么时代。' },
  { id: 155, title: '玩出来的科学脑', author: '亦学亦玩', ageRange: '5-6', tags: ['科普百科', '实验', '动手'], abilities: { language: 3, science: 5, art: 4, social: 3, emotion: 3 }, emoji: '🔬', description: '通过有趣的小实验培养科学思维，边玩边学。', readingTips: '和孩子一起做书中的小实验，体验科学的乐趣。' },
  { id: 156, title: '坚定信念．奔向宇宙', author: '书童文化', ageRange: '5-6', tags: ['科普百科', '太空', '奥特曼'], abilities: { language: 4, science: 5, art: 4, social: 3, emotion: 4 }, emoji: '🚀', description: '跟着奥特曼一起探索宇宙，了解太空知识。', readingTips: '晚上一起看星星，聊聊宇宙里有什么。' },
  { id: 157, title: '哈利和小恐龙', author: '伊恩·威伯', ageRange: '4-6', tags: ['科普百科', '恐龙', '友谊'], abilities: { language: 5, science: 4, art: 4, social: 4, emotion: 5 }, emoji: '🦕', description: '哈利和恐龙朋友们的温馨故事，了解各种恐龙。', readingTips: '让孩子讲讲最喜欢什么恐龙，为什么喜欢它。' },
  { id: 158, title: '最美的四季科普', author: '克雷芒蒂娜·苏黛', ageRange: '4-6', tags: ['科普百科', '四季', '自然'], abilities: { language: 4, science: 5, art: 5, social: 2, emotion: 4 }, emoji: '🌸', description: '美丽的四季科普书，感受每个季节的独特魅力。', readingTips: '带孩子去户外感受季节变化，捡树叶、观察花朵。' },
  { id: 159, title: '新小小牛顿：启蒙版', author: '台湾小牛顿科学教育有限公司', ageRange: '4-6', tags: ['科普百科', '自然', '科学'], abilities: { language: 4, science: 5, art: 4, social: 2, emotion: 3 }, emoji: '🔭', description: '经典科普品牌，涵盖自然、科学、生活等多方面知识。', readingTips: '每读完一个主题，带孩子去生活中验证和观察。' },
  { id: 160, title: '恐龙时代', author: '罗曼·阿米奥', ageRange: '5-6', tags: ['科普百科', '恐龙', '古生物'], abilities: { language: 3, science: 5, art: 5, social: 2, emotion: 3 }, emoji: '🦖', description: '穿越到恐龙时代，认识各种各样的恐龙。', readingTips: '和孩子一起画恐龙，制作恐龙手工。' },

  // --- 认知启蒙类 ---
  { id: 161, title: '森林动物这样做对吗', author: '乔纳森·利顿', ageRange: '3-5', tags: ['认知启蒙', '动物', '行为'], abilities: { language: 4, science: 4, art: 4, social: 4, emotion: 3 }, emoji: '🐾', description: '看看森林里的小动物哪些行为是对的，哪些是错的。', readingTips: '和孩子讨论什么行为是对的，什么是不对的。' },
  { id: 162, title: '幼儿左右脑开发', author: '南京合谷科技信息技术有限公司', ageRange: '5-6', tags: ['认知启蒙', '全脑开发', '幼小衔接'], abilities: { language: 4, science: 5, art: 4, social: 2, emotion: 3 }, emoji: '🧩', description: '左右脑均衡开发，为上小学做准备。', readingTips: '每天做几页，循序渐进，不要给孩子压力。' },
  { id: 163, title: '爸爸妈妈，今天我们玩什么', author: '李白', ageRange: '3-6', tags: ['认知启蒙', '亲子游戏', '交往'], abilities: { language: 4, science: 3, art: 3, social: 5, emotion: 4 }, emoji: '🎮', description: '100个亲子游戏，在游戏中学习和成长。', readingTips: '每周选一个游戏和孩子一起玩，增进亲子感情。' },
  { id: 164, title: '最适合中国宝宝的亲子游戏', author: '董颖', ageRange: '3-6', tags: ['认知启蒙', '亲子游戏', '互动'], abilities: { language: 3, science: 4, art: 3, social: 5, emotion: 4 }, emoji: '👨‍👩‍👧', description: '适合中国家庭的亲子游戏，简单好玩又有教育意义。', readingTips: '利用生活中的物品就能玩，不用买昂贵的玩具。' },
  { id: 165, title: '鱼', author: '马场登', ageRange: '3-5', tags: ['认知启蒙', '动物', '自然'], abilities: { language: 4, science: 5, art: 4, social: 2, emotion: 3 }, emoji: '🐟', description: '认识各种各样的鱼，了解鱼类的生活。', readingTips: '去水族馆或河边看鱼，让孩子观察鱼是怎么游的。' },

  // --- 国学传统文化类 ---
  { id: 166, title: '东方自古有神话', author: '张鸿鹤', ageRange: '5-6', tags: ['国学传统', '神话', '历史'], abilities: { language: 5, science: 2, art: 4, social: 3, emotion: 4 }, emoji: '🐉', description: '中国古代神话故事，感受传统文化的魅力。', readingTips: '讨论神话故事里的人物为什么让人敬佩。' },
  { id: 167, title: '爆笑虫子在中国', author: '深圳拉瓦数字动漫有限公司', ageRange: '4-6', tags: ['国学传统', '文化', '趣味'], abilities: { language: 4, science: 2, art: 4, social: 3, emotion: 4 }, emoji: '🐛', description: '跟着爆笑虫子一起了解中国文化，趣味十足。', readingTips: '在生活中找一找书中提到的中国元素。' },

  // --- 艺术美育类 ---
  { id: 168, title: '幼儿园创意美术游戏', author: '温帅', ageRange: '4-6', tags: ['艺术美育', '手工', '创意'], abilities: { language: 3, science: 3, art: 5, social: 3, emotion: 4 }, emoji: '🎨', description: '彩泥、绘画、手工，各种创意美术游戏。', readingTips: '和孩子一起做手工，享受创作的乐趣。' },
  { id: 169, title: '果实好美味', author: '费代丽卡·巴列欧尼', ageRange: '3-5', tags: ['艺术美育', '自然', '美食'], abilities: { language: 4, science: 4, art: 5, social: 2, emotion: 3 }, emoji: '🍎', description: '用果实做的艺术作品，感受自然之美。', readingTips: '用水果和蔬菜做创意拼盘，既好吃又好看。' },
  { id: 170, title: '美人鱼大变身', author: '保冬妮', ageRange: '4-6', tags: ['艺术美育', '海洋', '想象'], abilities: { language: 5, science: 3, art: 5, social: 2, emotion: 4 }, emoji: '🧜', description: '美人鱼的美丽故事，充满想象力和艺术美感。', readingTips: '让孩子画一画自己想象中的美人鱼。' },

  // --- 亲情家庭主题绘本 ---
  { id: 171, title: '西瓜一家去旅行', author: '深见春夫', ageRange: '3-5', tags: ['亲情家庭', '旅行', '想象'], abilities: { language: 5, science: 2, art: 5, social: 4, emotion: 5 }, emoji: '🍉', description: '西瓜一家人去旅行的奇妙故事，充满想象力。', readingTips: '讨论一家人去旅行要准备什么东西，最想去哪里。' },
  { id: 172, title: '巴巴爸爸搭树屋', author: '安娜特·缇森', ageRange: '3-5', tags: ['亲情家庭', '创造', '家庭'], abilities: { language: 4, science: 3, art: 5, social: 4, emotion: 4 }, emoji: '🌳', description: '巴巴爸爸一家人一起搭树屋，团结力量大。', readingTips: '讨论巴巴爸爸一家每个人有什么特点，一家人怎么分工合作。' },
  { id: 173, title: '小鼹鼠摘月', author: '乔纳森·埃米特', ageRange: '3-5', tags: ['亲情家庭', '梦想', '坚持'], abilities: { language: 5, science: 2, art: 4, social: 3, emotion: 5 }, emoji: '🌙', description: '小鼹鼠想摸到月亮，在朋友们的帮助下努力尝试。', readingTips: '讨论为了梦想要不要坚持，朋友的帮助很重要。' },
  { id: 174, title: '圆脑袋回家记', author: '帕特查理·米苏克', ageRange: '3-5', tags: ['亲情家庭', '回家', '友谊'], abilities: { language: 4, science: 2, art: 5, social: 4, emotion: 5 }, emoji: '🏠', description: '圆脑袋在回家路上遇到了很多朋友，大家一起回家。', readingTips: '讨论家是什么感觉，回家的路上会遇到什么。' },

  // --- 生命与爱主题绘本 ---
  { id: 175, title: '永恒的光', author: '书童文化', ageRange: '5-6', tags: ['生命与爱', '奥特曼', '信念'], abilities: { language: 4, science: 3, art: 4, social: 3, emotion: 5 }, emoji: '✨', description: '关于光明与黑暗、信念与勇气的故事。', readingTips: '讨论什么是"光"，为什么要有信念。' },
  { id: 176, title: '幽灵列车', author: '约娜·比约谢纳', ageRange: '4-6', tags: ['生命与爱', '幽灵', '友谊'], abilities: { language: 5, science: 2, art: 4, social: 3, emotion: 5 }, emoji: '👻', description: '幽灵列车上发生的温馨故事，不可怕反而很温暖。', readingTips: '讨论幽灵是不是真的存在，死亡并不可怕。' },

  // --- 更多热门绘本 ---
  { id: 177, title: '汪汪队立大功我喜爱的救援交通工具图画书', author: '新天地童书', ageRange: '3-5', tags: ['语言文学', '交通工具', '救援'], abilities: { language: 4, science: 4, art: 4, social: 4, emotion: 3 }, emoji: '🚚', description: '认识各种工程车和救援工具，了解它们的用途。', readingTips: '和孩子讨论每种交通工具是干什么的，最喜欢哪一种。' },
  { id: 178, title: '培西说到做到', author: '英国HIT娱乐有限公司', ageRange: '3-5', tags: ['行为习惯', '诚信', '责任'], abilities: { language: 4, science: 2, art: 3, social: 5, emotion: 4 }, emoji: '🚂', description: '小火车培西说到做到，学会守信用和负责任。', readingTips: '讨论为什么说到做到很重要，做个守信用的孩子。' },
  { id: 179, title: '托马斯和朋友拼音认读故事', author: '童趣出版有限公司', ageRange: '5-6', tags: ['语言文学', '拼音', '火车'], abilities: { language: 5, science: 2, art: 3, social: 4, emotion: 3 }, emoji: '🚆', description: '跟着托马斯学拼音认读，为阅读打基础。', readingTips: '让孩子试着拼读书上的拼音，培养独立阅读能力。' },
  { id: 180, title: '新黑猫警长', author: '杨鹏', ageRange: '5-6', tags: ['语言文学', '侦探', '科学'], abilities: { language: 5, science: 4, art: 4, social: 3, emotion: 4 }, emoji: '🐱', description: '黑猫警长破解各种案件，科学破案超精彩。', readingTips: '和孩子一起分析案件，猜猜凶手是谁。' },
  { id: 181, title: '我一定有办法', author: '李金龙', ageRange: '4-6', tags: ['情绪成长', '自信', '解决问题'], abilities: { language: 4, science: 3, art: 3, social: 3, emotion: 5 }, emoji: '💪', description: '遇到困难不要怕，我一定有办法解决。', readingTips: '讨论遇到困难时怎么办，鼓励孩子自己想办法。' },
  { id: 182, title: '小鹅学跑步', author: '邱国鹰', ageRange: '3-5', tags: ['语言文学', '成长', '坚持'], abilities: { language: 4, science: 2, art: 3, social: 3, emotion: 5 }, emoji: '🦢', description: '小鹅学跑步的故事，学会坚持和努力。', readingTips: '讨论学新东西的时候遇到困难怎么办。' },
  { id: 183, title: '超级甲虫变形记', author: '奥飞娱乐', ageRange: '4-6', tags: ['语言文学', '昆虫', '变身'], abilities: { language: 4, science: 4, art: 5, social: 3, emotion: 4 }, emoji: '🪲', description: '超级甲虫的变形冒险，又酷又有趣。', readingTips: '讨论如果可以变形想变成什么，为什么。' },
  { id: 184, title: '超级方块兔', author: '托马斯·弗林特哈姆', ageRange: '4-6', tags: ['语言文学', '冒险', '游戏'], abilities: { language: 4, science: 3, art: 5, social: 3, emotion: 4 }, emoji: '🐰', description: '方块兔的像素世界大冒险，像玩游戏一样有趣。', readingTips: '讨论游戏里的闯关精神，遇到难关不要放弃。' },
  { id: 185, title: '捷德奥特曼剧场版拼音认读故事', author: '知信阳光', ageRange: '5-6', tags: ['语言文学', '拼音', '英雄'], abilities: { language: 5, science: 2, art: 4, social: 3, emotion: 5 }, emoji: '🦸', description: '奥特曼的英雄故事，拼音认读帮助孩子自主阅读。', readingTips: '让孩子试着自己拼读，培养阅读兴趣。' },
  { id: 186, title: '泽塔奥特曼拼音认读故事', author: '日本圆谷制作株式会社', ageRange: '5-6', tags: ['语言文学', '拼音', '英雄'], abilities: { language: 5, science: 3, art: 4, social: 3, emotion: 4 }, emoji: '⭐', description: '泽塔奥特曼的精彩战斗故事，学拼音涨知识。', readingTips: '讨论奥特曼为什么要保护地球，什么是正义。' },
  { id: 187, title: '抓不到老鼠的猫', author: '迪迪埃·莱维', ageRange: '3-5', tags: ['语言文学', '幽默', '动物'], abilities: { language: 5, science: 2, art: 4, social: 3, emotion: 4 }, emoji: '🐱', description: '一只总是抓不到老鼠的猫，发生了好多好笑的事。', readingTips: '讨论为什么猫抓不到老鼠，失败了也没关系。' },
  { id: 188, title: '小猫探长吓一跳', author: '王淑芬', ageRange: '4-6', tags: ['语言文学', '侦探', '趣味'], abilities: { language: 5, science: 3, art: 4, social: 3, emotion: 3 }, emoji: '🐱', description: '小猫探长的趣味侦探故事，又惊险又好笑。', readingTips: '和孩子一起当侦探找线索。' },
  { id: 189, title: '开山挖洞的挖掘机', author: '童趣出版有限公司', ageRange: '3-5', tags: ['语言文学', '工程车', '认知'], abilities: { language: 4, science: 4, art: 4, social: 2, emotion: 2 }, emoji: '🚜', description: '认识挖掘机和各种工程车，了解它们的本领。', readingTips: '路上看到工程车时指给孩子看，说说它们在干什么。' },
  { id: 190, title: '幸运小姐交朋友', author: '明心编译', ageRange: '3-5', tags: ['情绪成长', '友谊', '社交'], abilities: { language: 4, science: 2, art: 3, social: 5, emotion: 5 }, emoji: '😊', description: '幸运小姐交朋友的故事，学会主动和人交往。', readingTips: '讨论怎么和新朋友打招呼，怎么交到好朋友。' },
  { id: 191, title: '疯狂兔子爆笑漫画书', author: '蒂托姆', ageRange: '4-6', tags: ['语言文学', '漫画', '幽默'], abilities: { language: 4, science: 2, art: 5, social: 3, emotion: 4 }, emoji: '🐰', description: '疯狂兔子的爆笑日常，保证笑到肚子疼。', readingTips: '和孩子一起看漫画，一起哈哈大笑。' },
  { id: 192, title: '要是被香蕉皮滑倒了', author: '森比左志', ageRange: '3-5', tags: ['行为习惯', '安全', '想象'], abilities: { language: 4, science: 2, art: 4, social: 3, emotion: 4 }, emoji: '🍌', description: '要是踩到香蕉皮滑倒了会怎么样？有趣的想象。', readingTips: '讨论怎样才能避免摔倒，注意安全。' },
  { id: 193, title: '我会关心别人', author: '科尼莉亚·莫德·斯佩尔曼', ageRange: '3-5', tags: ['情绪成长', '关心', '社交'], abilities: { language: 4, science: 2, art: 3, social: 5, emotion: 5 }, emoji: '💝', description: '学会关心别人，做一个温暖的孩子。', readingTips: '在生活中引导孩子关心家人和朋友。' },
  { id: 194, title: '困难其实不可怕', author: '', ageRange: '4-6', tags: ['情绪成长', '抗挫力', '乐观'], abilities: { language: 4, science: 2, art: 3, social: 3, emotion: 5 }, emoji: '💪', description: '提高耐挫力，培养乐观精神，困难其实没那么可怕。', readingTips: '讨论遇到困难时的心情，怎么调整心态。' },
  { id: 195, title: '小熊猫和山林动物', author: '', ageRange: '3-5', tags: ['科普百科', '动物', '自然'], abilities: { language: 4, science: 5, art: 4, social: 2, emotion: 3 }, emoji: '🐼', description: '认识山林里的各种动物，了解它们的生活习性。', readingTips: '去动物园时找找书中的动物，观察它们的行为。' },
  { id: 196, title: '语言表达真好玩', author: '乐凡', ageRange: '4-6', tags: ['语言文学', '表达', '游戏'], abilities: { language: 5, science: 2, art: 3, social: 4, emotion: 3 }, emoji: '💬', description: '通过游戏大闯关提升语言表达能力。', readingTips: '和孩子玩语言游戏，比如词语接龙、讲故事。' },
];

// 分类配置（13大分类）
const categories = [
  { id: 'today', name: '今日推荐', emoji: '✨' },
  { id: 'cognition', name: '认知启蒙', emoji: '🧠' },
  { id: 'interactive', name: '互动玩具书', emoji: '🎁' },
  { id: 'emotion', name: '情绪成长', emoji: '😊' },
  { id: 'habit', name: '行为习惯', emoji: '🌟' },
  { id: 'family', name: '亲情家庭', emoji: '👨‍👩‍👧' },
  { id: 'school', name: '入园校园', emoji: '🏫' },
  { id: 'life', name: '生命与爱', emoji: '🌱' },
  { id: 'science', name: '科普百科', emoji: '🔬' },
  { id: 'traditional', name: '国学传统', emoji: '📜' },
  { id: 'literature', name: '语言文学', emoji: '📚' },
  { id: 'logic', name: '益智思维', emoji: '🧩' },
  { id: 'art', name: '艺术美育', emoji: '🎨' },
  { id: 'bridge', name: '幼小衔接', emoji: '📝' }
];

// 兴趣标签列表
const interestTags = ['动物', '交通工具', '公主', '恐龙', '太空', '科普', '节日', '自然', '音乐', '美食', '运动', '建筑'];

// 头像列表
const avatarOptions = ['🧒', '👦', '👧', '🧑', '👶', '🐻', '🐰', '🦊', '🐼', '🐨', '🦁', '🐯'];

// ============ Kimi AI 集成模块 ============
// Kimi API 配置
const KIMI_API_KEY = 'YOUR_API_KEY_HERE';
const KIMI_API_URL = 'https://api.moonshot.cn/v1/chat/completions';
const KIMI_MODEL = 'moonshot-v1-8k';

let kimiLastRequestTime = 0;
const KIMI_MIN_INTERVAL = 1500;

async function callKimiAPI(messages, temperature = 0.7, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const now = Date.now();
      const waitTime = KIMI_MIN_INTERVAL - (now - kimiLastRequestTime);
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      kimiLastRequestTime = Date.now();

      const response = await fetch(KIMI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${KIMI_API_KEY}`
        },
        body: JSON.stringify({
          model: KIMI_MODEL,
          messages: messages,
          temperature: temperature,
          max_tokens: 1000
        })
      });

      if (response.status === 429) {
        if (attempt < retries) {
          const delay = 2000 * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw new Error('API调用失败: 429');
      }

      if (!response.ok) {
        throw new Error(`API调用失败: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      if (attempt === retries) {
        console.error('Kimi API 调用失败:', error);
        return null;
      }
    }
  }
  return null;
}

// Kimi AI 对话历史
let kimiConversationHistory = [];

// 初始化对话上下文（绘本讲解场景）
function initKimiContext(book) {
  const bookInfo = book ? `
绘本信息：
- 书名：${book.title}
- 作者：${book.author || '未知'}
- 简介：${book.description || '暂无简介'}
- 适读年龄：${book.ageRange || '3-6'}岁
- 能力培养：${book.abilities ? Object.entries(book.abilities).filter(([k,v]) => v > 3).map(([k]) => k).join('、') : '综合能力'}
` : '';

  kimiConversationHistory = [
    {
      role: 'system',
      content: `你是"童书伴读"的AI助手，一个专为3-6岁儿童和家长设计的绘本科普讲解专家。你应该：
1. 用温暖、童趣的语言讲解绘本故事
2. 回答孩子的问题时要简单易懂
3. 适当提问引导孩子思考
4. 鼓励亲子互动
5. 每次回答控制在100字以内
6. 使用emoji增加趣味性`
    },
    {
      role: 'user',
      content: `以下是绘本的背景信息：
${bookInfo}
请用一段话介绍这个绘本，吸引孩子和家长想读这本书。`
    }
  ];
}

// Kimi AI 绘本科普问答
async function kimiBookQA(book, question) {
  const bookInfo = book ? `
绘本：《${book.title}》
作者：${book.author || '未知'}
简介：${book.description || '暂无简介'}
适读年龄：${book.ageRange || '3-6'}岁
` : '';

  const messages = [
    ...kimiConversationHistory,
    {
      role: 'user',
      content: `${bookInfo}
孩子问：${question}
请用适合3-6岁孩子理解的方式回答，保持温暖有趣的风格，控制在80字以内。`
    }
  ];

  const answer = await callKimiAPI(messages);
  
  if (answer) {
    // 更新对话历史
    kimiConversationHistory.push({ role: 'user', content: question });
    kimiConversationHistory.push({ role: 'assistant', content: answer });
    
    // 保持对话历史不超过10轮
    if (kimiConversationHistory.length > 20) {
      kimiConversationHistory = kimiConversationHistory.slice(-20);
    }
  }
  
  return answer;
}

// Kimi AI 故事讲解
async function kimiTellStory(book) {
  const messages = [
    {
      role: 'system',
      content: `你是"童书伴读"的AI故事讲解员，为3-6岁孩子讲故事。要求：
1. 用生动有趣的语言讲述
2. 适当加入角色对话
3. 穿插提问引导思考
4. 每个故事控制在300字以内
5. 结尾要有寓意或互动引导`
    },
    {
      role: 'user',
      content: `请为绘本《${book.title}》${book.author ? `（作者：${book.author}）` : ''}讲一个适合3-6岁孩子的精彩故事片段。如果你不完全了解这本书，请根据书名和类型发挥想象，创作一个有趣的故事。`
    }
  ];

  return await callKimiAPI(messages, 0.8);
}

// Kimi AI 生成亲子问答
async function kimiGenerateQuestions(book, ageRange = '4-5') {
  const messages = [
    {
      role: 'system',
      content: `你是"童书伴读"的亲子问答专家，根据绘本内容生成适合孩子年龄的问题。要求：
1. 生成3个问题
2. 问题要符合孩子认知水平
3. 包含理解性问题和开放性问题
4. 用孩子能理解的语言
5. 格式简洁，每行一个问题`
    },
    {
      role: 'user',
      content: `请为绘本《${book.title}》生成3个亲子问答题目，适合${ageRange}岁孩子。
要求：
1. 第1个问题：关于故事内容的（感知记忆）
2. 第2个问题：需要理解的（理解应用）
3. 第3个问题：开放性思考（创造评价）
只输出问题，每行一个问题，不要编号。`
    }
  ];

  return await callKimiAPI(messages, 0.7);
}

// Kimi AI 生成推荐理由
async function kimiGenerateReason(book, childProfile) {
  const profileInfo = childProfile ? `
孩子画像：
- 年龄：${childProfile.age || '未知'}岁
- 兴趣：${childProfile.interests ? childProfile.interests.slice(0, 3).join('、') : '阅读'}
- 能力优势：${childProfile.abilities ? Object.entries(childProfile.abilities).sort((a,b) => b[1]-a[1]).slice(0, 2).map(([k]) => k).join('、') : '综合'}
- 需要加强：${childProfile.weakAbilities ? childProfile.weakAbilities.join('、') : '综合能力'}
` : '';

  const messages = [
    {
      role: 'system',
      content: `你是"童书伴读"的智能推荐专家，为家长生成个性化的绘本推荐理由。要求：
1. 推荐理由要贴合孩子特点
2. 突出绘本与孩子需求的匹配点
3. 语言温暖专业
4. 控制在60字以内
5. 要有说服力，让人想读这本书`
    },
    {
      role: 'user',
      content: `绘本：《${book.title}》
作者：${book.author || '未知'}
${profileInfo}

请生成一段吸引家长的推荐理由，说明为什么这本书适合这个孩子。`
    }
  ];

  return await callKimiAPI(messages, 0.6);
}

// Kimi AI 阅读分析
async function kimiAnalyzeReading(records, profile) {
  const recentBooks = records.slice(0, 10).map(r => r.bookTitle).join('、');
  const ageInfo = profile?.age ? `${profile.age}岁` : '4-5岁';
  const totalBooks = new Set(records.map(r => r.bookTitle)).size;
  const totalMinutes = records.reduce((sum, r) => sum + (r.duration || 0), 0);
  
  const messages = [
    {
      role: 'system',
      content: `你是"童书伴读"的阅读成长分析师，基于阅读记录为家长提供专业分析。
要求：
1. 返回严格的JSON格式，不要包含任何其他文字
2. JSON包含4个字段：preference（阅读偏好，50字内）、ability（能力发展，50字内）、suggestion（阅读建议，50字内）、expand（拓展推荐，50字内）
3. 语言温暖专业，有洞察力
4. 要有数据支撑，不要空泛`
    },
    {
      role: 'user',
      content: `孩子信息：${ageInfo}
共阅读 ${totalBooks} 本书，总时长 ${totalMinutes} 分钟
最近阅读的绘本：${recentBooks}

请分析并返回JSON：
{
  "preference": "孩子的阅读偏好分析",
  "ability": "能力发展情况",
  "suggestion": "具体的阅读建议",
  "expand": "可以从哪些方面拓展"
}`
    }
  ];

  const result = await callKimiAPI(messages, 0.5);
  if (!result) return null;
  
  try {
    const jsonStr = result.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    return {
      preference: result.slice(0, 60),
      ability: '语言理解和想象力表现积极，继续保持',
      suggestion: '增加科普类书籍拓宽知识面',
      expand: '科普知识、传统文化、情感教育'
    };
  }
}

// ============ 数据存储模块 ============
const Storage = {
  get(key, defaultValue) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }
};

// 初始化示例数据
function initSampleData() {
  if (!Storage.get('childProfile')) {
    Storage.set('childProfile', {
      nickname: '小橙子',
      ageRange: '4-5',
      gender: 'boy',
      interests: ['恐龙', '动物', '自然'],
      avatar: '🧒',
      createdAt: '2024-01-01'
    });
  }

  if (!Storage.get('readingRecords')) {
    const records = generateSampleRecords();
    Storage.set('readingRecords', records);
  }

  if (!Storage.get('userPersona')) {
    updateUserPersona();
  }
}

// 生成示例阅读记录（基于晋江图书馆真实借阅记录）
function generateSampleRecords() {
  const records = [];
  const today = new Date();

  // 真实借阅记录（80条精选，日期分散，按日期倒序）
  const realRecords = [
    // ============ 新增40条记录 ============
    { date: '2026-06-22', title: '汪汪队立大功我喜爱的救援交通工具图画书', duration: 20, rating: 5, emotion: ['很喜欢'], ability: ['语言表达', '自然认知'], highlight: '工程车是男孩子的最爱！孩子全程眼睛盯着各种救援车。好的表现：能说出每种车的名字和用途。认字：对"车"字特别感兴趣。互动片段：我们比赛谁认识的工程车多，孩子赢了好几次，信心满满。' },
    { date: '2026-06-22', title: '真相只有一个', duration: 25, rating: 5, emotion: ['很喜欢', '主动提问'], ability: ['科学思维', '语言表达'], highlight: '侦探书太上头了！孩子研究了好久，眼睛都不眨。好的表现：能注意到画面里的小细节。困难：有些线索还是需要提示。互动片段：妈妈当侦探，孩子当嫌疑人，故意留下线索让孩子找。' },
    { date: '2026-06-21', title: '疯狂海洋城', duration: 18, rating: 5, emotion: ['很喜欢'], ability: ['自然认知', '艺术创造'], highlight: '海洋世界太神奇了！孩子一页一页翻，找各种小动物。好的表现：观察特别仔细，能发现藏在角落的小鱼。互动片段：我们比赛找章鱼，孩子找得比我快多了。' },
    { date: '2026-06-21', title: '培西说到做到', duration: 15, rating: 4, emotion: ['很喜欢'], ability: ['社会交往', '情绪认知'], highlight: '小火车培西的故事告诉孩子要守信用。好的表现：能理解说到做到的意思。困难：有时候还是会忘记承诺。互动片段：我们约定一件事，看孩子能不能做到。' },
    { date: '2026-06-20', title: '新黑猫警长', duration: 22, rating: 5, emotion: ['很喜欢', '主动提问'], ability: ['语言表达', '科学思维'], highlight: '黑猫警长抓坏人太帅了！孩子看得入迷，一直问"后来呢"。好的表现：能预测凶手是谁。互动片段：我们扮演警民合作，孩子当黑猫警长，抓我这个"小偷"。' },
    { date: '2026-06-20', title: '幼儿园创意美术游戏', duration: 20, rating: 4, emotion: ['很喜欢'], ability: ['艺术创造', '精细动作'], highlight: '美术游戏太好玩了！孩子迫不及待想动手做。好的表现：会按照步骤来做。困难：有些精细动作还不太熟练。互动片段：我们一起用彩泥做小动物，孩子做了只歪歪扭扭的小兔子。' },
    { date: '2026-06-19', title: '大家都是大猩猩', duration: 12, rating: 4, emotion: ['很喜欢'], ability: ['语言表达', '情绪认知'], highlight: '爸爸变成大猩猩太搞笑了！孩子笑得停不下来。好的表现：会想象爸爸变成其他动物。互动片段：我们玩"爸爸变成..."游戏，孩子说"爸爸变成大恐龙"，然后满屋子跑。' },
    { date: '2026-06-19', title: '东方自古有神话', duration: 15, rating: 4, emotion: ['很喜欢'], ability: ['语言表达', '社会交往'], highlight: '中国神话故事很有魅力，孩子听得很认真。好的表现：能记住几个神话人物的名字。困难：对有些神话的寓意还不太懂。互动片段：我们讨论哪个神话人物最厉害，孩子选了孙悟空，因为会七十二变。' },
    { date: '2026-06-18', title: '爆笑虫子在中国', duration: 10, rating: 4, emotion: ['很喜欢'], ability: ['语言表达', '艺术创造'], highlight: '虫子们太逗了！孩子笑得在地上打滚。好的表现：能理解简单的中文梗。互动片段：我们学虫子说话的语气，孩子学得特别像，惹得全家都笑了。' },
    { date: '2026-06-17', title: '猫咪大侦探', duration: 28, rating: 5, emotion: ['很喜欢', '主动提问'], ability: ['科学思维', '语言表达'], highlight: '猫咪侦探太厉害了！孩子跟着一起破案，特别有成就感。好的表现：观察力越来越好，能发现更多线索。互动片段：我们轮流当侦探，孩子已经能独立破几个简单的案子了。' },
    { date: '2026-06-17', title: '我一定有办法', duration: 15, rating: 4, emotion: ['很喜欢'], ability: ['情绪认知', '语言表达'], highlight: '遇到困难不可怕，要想办法解决！好的表现：能说出"我有办法"。困难：真的遇到困难还是会先哭。互动片段：我们讨论遇到困难怎么办，孩子说要先冷静，然后想办法。' },
    { date: '2026-06-16', title: '小鹅学跑步', duration: 12, rating: 4, emotion: ['很喜欢'], ability: ['语言表达', '情绪认知'], highlight: '小鹅学跑步的故事很励志。好的表现：能理解坚持的意义。困难：遇到挫折还是容易放弃。互动片段：我们比赛跑步，孩子输了有点沮丧，我鼓励他像小鹅一样坚持。' },
    { date: '2026-06-15', title: '超级甲虫变形记', duration: 15, rating: 5, emotion: ['很喜欢'], ability: ['语言表达', '自然认知'], highlight: '变形甲虫太酷了！孩子眼睛都看直了。好的表现：能说出变形的顺序。互动片段：我们玩变形游戏，孩子当甲虫，我当敌人，孩子成功"变形"打败了我。' },
    { date: '2026-06-15', title: '超级方块兔', duration: 18, rating: 4, emotion: ['很喜欢'], ability: ['语言表达', '科学思维'], highlight: '像素游戏风格太有意思了！孩子说像在玩我的世界。好的表现：会思考下一步怎么走。互动片段：我们比赛闯关，有时孩子真的能赢我一两次。' },
    { date: '2026-06-14', title: '捷德奥特曼剧场版拼音认读故事', duration: 20, rating: 5, emotion: ['很喜欢'], ability: ['语言表达', '社会交往'], highlight: '奥特曼是男孩子的英雄！孩子拼拼音拼得很认真。好的表现：遇到不会的字会主动问。互动片段：孩子当捷德，我当怪兽，我们打了一架，孩子赢了特别开心。' },
    { date: '2026-06-13', title: '泽塔奥特曼拼音认读故事', duration: 22, rating: 5, emotion: ['很喜欢'], ability: ['语言表达', '情绪认知'], highlight: '泽塔奥特曼太帅了！孩子一边拼拼音一边看故事。好的表现：拼音越来越熟练了。互动片段：我们讨论什么是正义，奥特曼为什么要保护地球，孩子说得头头是道。' },
    { date: '2026-06-13', title: '抓不到老鼠的猫', duration: 12, rating: 4, emotion: ['很喜欢'], ability: ['语言表达', '情绪认知'], highlight: '这只猫太好笑了！孩子笑得停不下来。好的表现：能理解故事的幽默。互动片段：我们模仿猫抓老鼠的动作，孩子学猫的样子太逗了。' },
    { date: '2026-06-12', title: '小猫探长吓一跳', duration: 15, rating: 4, emotion: ['很喜欢'], ability: ['语言表达', '科学思维'], highlight: '小猫探长的故事很精彩！孩子跟着一起破案。好的表现：能注意到一些细节。互动片段：我们轮流出谜题让对方猜，孩子出的谜语还挺难的。' },
    { date: '2026-06-10', title: '开山挖洞的挖掘机', duration: 10, rating: 5, emotion: ['很喜欢'], ability: ['自然认知', '语言表达'], highlight: '挖掘机、推土机、搅拌车...男孩子的最爱！好的表现：能说出每种车的名字。互动片段：我们去工地附近看真的工程车，孩子激动得跳起来。' },
    { date: '2026-06-09', title: '幸运小姐交朋友', duration: 18, rating: 5, emotion: ['很喜欢', '主动提问'], ability: ['社会交往', '语言表达'], highlight: '交朋友的故事很温暖。好的表现：能理解交朋友的技巧。困难：在幼儿园还是有点害羞。互动片段：我们讨论怎么和新朋友打招呼，孩子说要说"你好，我叫..."。' },
    { date: '2026-06-09', title: '疯狂兔子爆笑漫画书', duration: 15, rating: 4, emotion: ['很喜欢'], ability: ['语言表达', '艺术创造'], highlight: '疯狂兔子的日常太好笑了！孩子笑得满地打滚。好的表现：能复述好笑的情节。互动片段：我们一起学疯狂兔子做表情，孩子做鬼脸做得特别夸张。' },
    { date: '2026-06-08', title: '要是被香蕉皮滑倒了', duration: 10, rating: 4, emotion: ['主动提问'], ability: ['社会交往', '语言表达'], highlight: '如果踩到香蕉皮会怎样？孩子的想象力被激发了。好的表现：会主动想象各种"要是..."的情况。互动片段：我们讨论生活中还有哪些危险，孩子说了很多要注意的事情。' },
    { date: '2026-06-07', title: '我会关心别人', duration: 12, rating: 4, emotion: ['很喜欢'], ability: ['社会交往', '情绪认知'], highlight: '学会关心别人很重要。好的表现：说想帮妈妈做事。困难：有时候还是以自己为中心。互动片段：我们玩关心人的游戏，孩子给我倒了杯水，说"妈妈辛苦了"。' },
    { date: '2026-06-07', title: '困难其实不可怕', duration: 15, rating: 4, emotion: ['很喜欢'], ability: ['情绪认知', '语言表达'], highlight: '困难可以被克服！好的表现：能举出自己克服困难的例子。困难：遇到新困难还是会害怕。互动片段：我们画"我不怕困难"，孩子画了自己爬上滑梯的样子。' },
    { date: '2026-06-06', title: '森林动物这样做对吗', duration: 18, rating: 4, emotion: ['很喜欢'], ability: ['社会交往', '自然认知'], highlight: '小动物们的行为对不对呢？孩子能判断大部分。好的表现：会思考为什么对或错。互动片段：我们讨论自己的行为对不对，孩子说以后要做一个正确的人。' },
    { date: '2026-06-05', title: '爸爸妈妈，今天我们玩什么', duration: 20, rating: 5, emotion: ['很喜欢'], ability: ['社会交往', '语言表达'], highlight: '亲子游戏书太棒了！和孩子一起玩了好几个游戏。好的表现：会主动想新的玩法。互动片段：我们玩了"抢椅子"和"木头人"，孩子玩得满头大汗但特别开心。' },
    { date: '2026-06-04', title: '小熊猫和山林动物', duration: 15, rating: 4, emotion: ['很喜欢'], ability: ['自然认知', '语言表达'], highlight: '山林里的小动物真可爱！孩子认识了好多种动物。好的表现：能说出动物的名字。互动片段：我们去动物园找小熊猫，孩子兴奋地指着说"看，小熊猫！"' },
    { date: '2026-06-04', title: '鱼', duration: 10, rating: 4, emotion: ['很喜欢'], ability: ['自然认知', '语言表达'], highlight: '各种各样的鱼太神奇了！孩子学到了很多新知识。好的表现：能记住几种鱼的名字。互动片段：我们吃鱼的时候讨论是什么鱼，孩子说"这会不会是书里的鱼"。' },
    { date: '2026-06-03', title: '最适合中国宝宝的亲子游戏', duration: 18, rating: 5, emotion: ['很喜欢'], ability: ['社会交往', '语言表达'], highlight: '这些游戏太好玩了！一家人玩得停不下来。好的表现：会主动组织游戏。互动片段：我们玩了老鹰捉小鸡，孩子当老鹰，抓到了好多人。' },
    { date: '2026-06-02', title: '宝藏岛大冒险', duration: 20, rating: 5, emotion: ['很喜欢'], ability: ['科学思维', '艺术创造'], highlight: '宝藏岛冒险太刺激了！孩子一边走迷宫一边找宝藏。好的表现：耐心越来越好了。互动片段：我们用积木搭了自己的"宝藏岛"，孩子藏了很多"宝藏"让我找。' },
    { date: '2026-06-02', title: '妈妈买绿豆', duration: 12, rating: 5, emotion: ['很喜欢'], ability: ['语言表达', '自然认知'], highlight: '买绿豆、煮绿豆、做绿豆冰...太生活化了！好的表现：能联想到自己的生活经历。互动片段：我们也买了绿豆，孩子帮忙洗绿豆，特别认真。' },
    { date: '2026-06-01', title: '巴巴爸爸系列', duration: 15, rating: 5, emotion: ['很喜欢'], ability: ['语言表达', '社会交往'], highlight: '巴巴爸爸能变成任何东西！孩子的想象力被激发了。好的表现：会说"巴巴爸爸变成..."。互动片段：我们玩"变成什么"游戏，孩子说"妈妈变成大狮子"，然后假装吼叫。' },
    { date: '2026-05-31', title: '猜猜我有多爱你', duration: 10, rating: 5, emotion: ['很喜欢'], ability: ['语言表达', '情绪认知'], highlight: '爱要大声说出来！孩子听完紧紧抱住我。好的表现：会表达爱了。互动片段：我们玩"猜猜我有多爱你"的游戏，孩子说爱到月亮那里。' },
    { date: '2026-05-31', title: '我的100个小小问题', duration: 20, rating: 5, emotion: ['很喜欢', '主动提问'], ability: ['自然认知', '科学思维'], highlight: '孩子的"为什么"越来越多了！好的表现：好奇心很强。困难：有些问题我也答不上来。互动片段：我们一起查资料找答案，孩子特别有成就感。' },
    { date: '2026-05-30', title: '波西和皮普', duration: 15, rating: 5, emotion: ['很喜欢'], ability: ['社会交往', '语言表达'], highlight: '好朋友之间会有矛盾，但会和好的。好的表现：能理解吵架很正常。困难：和好朋友吵架还是会难过。互动片段：我们在幼儿园找波西和皮普这样的好朋友。' },
    { date: '2026-05-30', title: '大卫不可以', duration: 12, rating: 4, emotion: ['很喜欢'], ability: ['社会交往', '情绪认知'], highlight: '大卫做的事情我们也经常做呢！好的表现：知道什么是不可以做的。互动片段：孩子说"我以前也这样"，我说"现在你知道不可以了"。' },
    { date: '2026-05-28', title: '爷爷一定有办法', duration: 18, rating: 5, emotion: ['很喜欢'], ability: ['语言表达', '艺术创造'], highlight: '爷爷的手好巧啊！好的表现：会想旧物可以利用。互动片段：我们一起把旧衣服改成小袋子，孩子特别有成就感。' },
    { date: '2026-05-28', title: '逃家小兔', duration: 12, rating: 5, emotion: ['很喜欢'], ability: ['语言表达', '情绪认知'], highlight: '妈妈的爱永远都在！孩子听完抱着我不放。好的表现：能感受到深深的爱。互动片段：我们玩"如果你要逃跑"的游戏，孩子说"我要变成小鱼游走"，我说"我就变成渔夫抓你"。' },
    { date: '2026-05-27', title: '生气汤', duration: 15, rating: 4, emotion: ['主动提问'], ability: ['情绪认知', '语言表达'], highlight: '生气的时候要发泄出来！好的表现：知道生气是正常的。互动片段：我们真的煮了一锅"生气汤"，孩子对着锅大喊，把"气"都撒出去了。' },
    { date: '2026-05-27', title: '菲菲生气了', duration: 12, rating: 4, emotion: ['很喜欢'], ability: ['情绪认知', '语言表达'], highlight: '生气的时候要学会冷静。好的表现：能说出让自己平静的方法。互动片段：孩子生气的时候，我说"菲菲是怎么做的"，孩子就去深呼吸了。' },
    { date: '2026-05-26', title: '好饿的小蛇', duration: 8, rating: 5, emotion: ['很喜欢'], ability: ['语言表达', '自然认知'], highlight: '小蛇吃东西的样子太好笑了！孩子笑个不停。好的表现：能预测下一页会吃什么。互动片段：我们用身体表演小蛇扭来扭去找东西吃，孩子学得特别像。' },
    { date: '2026-05-26', title: '点点点', duration: 10, rating: 5, emotion: ['很喜欢'], ability: ['艺术创造', '语言表达'], highlight: '这本书太好玩了！按一按、摇一摇，颜色就变了。好的表现：会跟着指令操作。互动片段：我们用手指在空中画点点，然后一起"变"出各种颜色。' },
    { date: '2026-05-25', title: '我爸爸', duration: 12, rating: 5, emotion: ['很喜欢'], ability: ['语言表达', '情绪认知'], highlight: '我爸爸真的很厉害！孩子特别自豪。好的表现：会夸自己的爸爸。互动片段：孩子也说"我爸爸也会..."，说了一大堆爸爸的本事。' },
    { date: '2026-05-25', title: '我妈妈', duration: 12, rating: 5, emotion: ['很喜欢'], ability: ['语言表达', '情绪认知'], highlight: '我妈妈是最棒的！孩子听完说"妈妈我爱你"。好的表现：会感恩。互动片段：孩子画了一幅妈妈的画像，说"这是我最美的妈妈"。' },
    { date: '2026-05-24', title: '蚯蚓的日记', duration: 15, rating: 4, emotion: ['很喜欢'], ability: ['自然认知', '语言表达'], highlight: '原来蚯蚓这么有趣！好的表现：能记住蚯蚓的特点。困难：有些内容还不太理解。互动片段：我们去花园挖土找蚯蚓，孩子观察了好久。' },
    { date: '2026-05-24', title: '蚂蚁的日记', duration: 12, rating: 4, emotion: ['很喜欢'], ability: ['自然认知', '社会交往'], highlight: '蚂蚁世界真神奇！好的表现：能说出蚂蚁是怎么分工合作的。互动片段：我们看蚂蚁搬家，孩子蹲在地上看了半个小时。' },
    { date: '2026-05-23', title: '我的情绪小怪兽', duration: 15, rating: 5, emotion: ['很喜欢'], ability: ['情绪认知', '语言表达'], highlight: '每种情绪都是不同颜色的小怪兽！好的表现：能说出今天是什么颜色。互动片段：孩子把自己装进"情绪瓶子"里，说"我现在是黄色小怪兽"。' },
    { date: '2026-05-23', title: '彩虹色的花', duration: 10, rating: 5, emotion: ['很喜欢'], ability: ['语言表达', '情绪认知'], highlight: '分享让别人快乐，自己也快乐！好的表现：能理解助人的意义。互动片段：我们也做了一朵彩虹色的花，送给邻居。' },
    { date: '2026-05-22', title: '牙齿大街的新鲜事', duration: 18, rating: 4, emotion: ['很喜欢'], ability: ['自然认知', '社会交往'], highlight: '哈克和迪克在牙齿上建房子！好的表现：知道要保护牙齿。互动片段：孩子刷牙特别认真，说"我要把哈克和迪克都刷掉"。' },
    { date: '2026-05-22', title: '肚子里有个火车站', duration: 15, rating: 4, emotion: ['很喜欢'], ability: ['自然认知', '语言表达'], highlight: '小精灵在肚子里工作呢！好的表现：知道要细嚼慢咽。互动片段：孩子吃饭慢了下来，说"小精灵要我慢慢吃"。' },
    { date: '2026-05-21', title: '魔法亲亲', duration: 12, rating: 5, emotion: ['很喜欢'], ability: ['情绪认知', '语言表达'], highlight: '魔法亲亲好温暖！孩子也要了一个魔法亲亲。好的表现：学会了表达爱。互动片段：孩子在我的手心亲了一下，说"这是给你的魔法亲亲"。' },
    { date: '2026-05-21', title: '小金鱼逃走了', duration: 10, rating: 5, emotion: ['很喜欢'], ability: ['自然认知', '语言表达'], highlight: '小金鱼藏在哪里呢？孩子找得好认真。好的表现：观察力越来越好了。互动片段：我们也玩"找一找"游戏，孩子总能很快找到。' },
    { date: '2026-05-19', title: '首先有一个苹果', duration: 8, rating: 5, emotion: ['很喜欢'], ability: ['语言表达', '自然认知'], highlight: '数字越来越多，太有趣了！好的表现：能跟着数数。互动片段：我们也用苹果、橘子来玩数数游戏。' },
    { date: '2026-05-19', title: '谁藏起来了', duration: 12, rating: 4, emotion: ['很喜欢'], ability: ['自然认知', '语言表达'], highlight: '找找看谁藏起来了！孩子的眼睛真尖。好的表现：能快速找到答案。互动片段：我们比赛谁先找到，孩子赢了好几次。' },
    { date: '2026-05-18', title: '棕色的熊，你在看什么', duration: 10, rating: 5, emotion: ['很喜欢'], ability: ['语言表达', '自然认知'], highlight: '这本可以唱出来！孩子跟着节奏拍手。好的表现：能模仿动物。互动片段：我们一起唱这首歌，孩子学动物的叫声学得特别像。' },
    { date: '2026-05-18', title: '从头动到脚', duration: 12, rating: 5, emotion: ['很喜欢'], ability: ['自然认知', '社会交往'], highlight: '跟着动物动起来！孩子的模仿能力很强。好的表现：能模仿各种动物的动作。互动片段：我们比赛谁学得像，孩子学大猩猩捶胸的样子太可爱了。' },
    { date: '2026-05-16', title: '好安静的蟋蟀', duration: 10, rating: 4, emotion: ['很喜欢'], ability: ['自然认知', '语言表达'], highlight: '蟋蟀的声音好好听！好的表现：能安静听故事。互动片段：我们一起找草丛里的蟋蟀，听它们唱歌。' },
    { date: '2026-05-16', title: '小种子', duration: 15, rating: 5, emotion: ['很喜欢'], ability: ['自然认知', '语言表达'], highlight: '小种子长成了最大的花！好的表现：能理解种子生长的过程。互动片段：我们种了一颗向日葵种子，每天观察它的变化。' },
    { date: '2026-05-14', title: '是谁嗯嗯在我头上', duration: 12, rating: 4, emotion: ['很喜欢'], ability: ['自然认知', '语言表达'], highlight: '这个故事太好笑了！好的表现：能记住每种动物的特点。互动片段：孩子学各种动物的表情，特别逗。' },
    { date: '2026-05-14', title: '月亮的味道', duration: 10, rating: 5, emotion: ['很喜欢'], ability: ['语言表达', '社会交往'], highlight: '动物们想尝尝月亮的味道！好的表现：会想象。互动片段：晚上看月亮，孩子说"我好想尝尝月亮的味道"。' },
    { date: '2026-05-13', title: '晚安月亮', duration: 15, rating: 5, emotion: ['很喜欢'], ability: ['语言表达', '情绪认知'], highlight: '睡前必读绘本！好的表现：会跟着说晚安。互动片段：孩子也向房间里的每样东西说晚安，然后安心睡着了。' },
    { date: '2026-05-13', title: '不睡觉的世界冠军', duration: 12, rating: 4, emotion: ['主动提问'], ability: ['语言表达', '情绪认知'], highlight: '小猪不想睡觉的理由太好笑了。好的表现：知道睡觉很重要。互动片段：我们约定按时睡觉，孩子说"我不想当不睡觉的冠军"。' },
    { date: '2026-05-11', title: '我会自己穿衣服', duration: 8, rating: 4, emotion: ['很喜欢'], ability: ['社会交往', '精细动作'], highlight: '自己穿衣服真棒！好的表现：越来越独立了。困难：有时候还是分不清正反面。互动片段：孩子自己穿好后特别骄傲，说"我自己穿的！"' },
    { date: '2026-05-11', title: '小熊宝宝绘本系列', duration: 10, rating: 5, emotion: ['很喜欢'], ability: ['社会交往', '语言表达'], highlight: '小熊宝宝的生活真有趣！好的表现：会模仿书里的好习惯。互动片段：孩子说"我也要像小熊一样..."。' },
    { date: '2026-05-10', title: '排队啦', duration: 8, rating: 4, emotion: ['主动提问'], ability: ['社会交往', '语言表达'], highlight: '排队要守规矩！好的表现：知道什么时候要排队。困难：在外面还是有点急。互动片段：我们练习排队，孩子当排头，特别有责任感。' },
    { date: '2026-05-10', title: '鳄鱼怕怕牙医怕怕', duration: 12, rating: 5, emotion: ['很喜欢'], ability: ['语言表达', '情绪认知'], highlight: '看牙医不可怕！好的表现：克服了一点恐惧。互动片段：孩子说"我不怕牙医"，虽然还是有点紧张。' },
    { date: '2026-05-09', title: '100层的巴士', duration: 15, rating: 5, emotion: ['很喜欢'], ability: ['语言表达', '社会交往'], highlight: '这辆巴士太神奇了！孩子数都数不过来。好的表现：会想象未来的交通工具。互动片段：我们也画了一辆100层的巴士。' },
    { date: '2026-05-09', title: '坐电车出发', duration: 10, rating: 4, emotion: ['很喜欢'], ability: ['自然认知', '语言表达'], highlight: '电车穿过隧道好刺激！好的表现：能安静欣赏。互动片段：孩子也想去坐真的电车。' },
    { date: '2026-05-08', title: '母鸡萝丝去散步', duration: 8, rating: 5, emotion: ['很喜欢'], ability: ['语言表达', '艺术创造'], highlight: '狐狸好倒霉！孩子笑得停不下来。好的表现：会注意画面细节。互动片段：孩子专门盯着狐狸看，发现它每次都倒霉。' },
    { date: '2026-05-08', title: '虎皮毯子', duration: 12, rating: 4, emotion: ['很喜欢'], ability: ['语言表达', '社会交往'], highlight: '老虎和小男孩的友谊真温暖。好的表现：能理解互相帮助。互动片段：孩子说也想有一个虎皮毯子。' },
    { date: '2026-05-07', title: '猜猜在哪里', duration: 10, rating: 4, emotion: ['很喜欢'], ability: ['语言表达', '自然认知'], highlight: '翻翻书太好玩了！好的表现：会主动翻页找答案。互动片段：我们轮流藏东西让对方找。' },
    { date: '2026-05-07', title: '不见了不见了', duration: 8, rating: 5, emotion: ['很喜欢'], ability: ['自然认知', '社会交往'], highlight: '躲猫猫太好笑了！好的表现：会模仿动作。互动片段：全家人一起玩躲猫猫，孩子笑得肚子疼。' },
    { date: '2026-05-06', title: '亲爱的动物园', duration: 10, rating: 5, emotion: ['很喜欢'], ability: ['自然认知', '语言表达'], highlight: '每个动物都装在箱子里！好的表现：能猜出是什么动物。互动片段：我们也做了"神秘箱子"，摸一摸猜一猜。' },
    { date: '2026-05-06', title: '小波在哪里', duration: 12, rating: 5, emotion: ['很喜欢'], ability: ['自然认知', '语言表达'], highlight: '小波躲在各个地方！好的表现：观察很仔细。互动片段：孩子在家里也玩"找小波"的游戏。' },
    { date: '2026-05-05', title: '我要拉㞎㞎', duration: 10, rating: 4, emotion: ['很喜欢'], ability: ['社会交往', '语言表达'], highlight: '小动物们学上厕所真可爱。好的表现：会主动说要去厕所。互动片段：孩子说"我也要像小动物一样自己上厕所"。' },
    { date: '2026-05-05', title: '小鸡鸡的故事', duration: 8, rating: 4, emotion: ['主动提问'], ability: ['自然认知', '语言表达'], highlight: '原来是这样！好的表现：对自己的身体好奇。互动片段：孩子问了很多问题，我们认真回答了。' },
    { date: '2026-05-04', title: '我们的身体', duration: 15, rating: 5, emotion: ['很喜欢', '主动提问'], ability: ['自然认知', '语言表达'], highlight: '身体太神奇了！好的表现：认识了很多身体部位。困难：有些部位还是不太懂。互动片段：孩子指着身体的各个部位让我猜名称。' },
    { date: '2026-05-04', title: '我会照顾牙齿', duration: 10, rating: 4, emotion: ['很喜欢'], ability: ['自然认知', '社会交往'], highlight: '牙齿很重要！好的表现：刷牙更认真了。互动片段：孩子自己刷牙，还说"我要把每颗牙齿都刷干净"。' },
    { date: '2026-05-03', title: '好饿的毛毛虫', duration: 8, rating: 5, emotion: ['很喜欢'], ability: ['自然认知', '语言表达'], highlight: '毛毛虫吃了好多东西！好的表现：能数数了。互动片段：我们也吃了水果，数一数今天吃了几种。' },
    { date: '2026-05-03', title: '我的连衣裙', duration: 10, rating: 5, emotion: ['很喜欢'], ability: ['艺术创造', '语言表达'], highlight: '小兔子的连衣裙变成各种图案！好的表现：会想象。互动片段：孩子也画了一条自己的连衣裙。' },
    { date: '2026-05-02', title: '月亮的味道', duration: 12, rating: 5, emotion: ['很喜欢'], ability: ['语言表达', '社会交往'], highlight: '小动物们一起叠高高够月亮！好的表现：能理解合作的意义。互动片段：我们也玩叠高高的游戏。' },
    { date: '2026-05-02', title: '彩虹鱼', duration: 10, rating: 4, emotion: ['很喜欢'], ability: ['社会交往', '语言表达'], highlight: '分享会让自己更快乐！好的表现：愿意分享玩具了。互动片段：孩子把心爱的贴纸分给了小朋友。' },
    { date: '2026-05-01', title: '古利和古拉', duration: 12, rating: 5, emotion: ['很喜欢'], ability: ['语言表达', '社会交往'], highlight: '古利和古拉做美食真有趣！好的表现：会想象做各种食物。互动片段：我们在厨房一起做了简单的三明治。' },
    { date: '2026-04-30', title: '11只猫', duration: 15, rating: 5, emotion: ['很喜欢'], ability: ['语言表达', '社会交往'], highlight: '11只小猫太可爱了！好的表现：会数数了。互动片段：我们也画了11只小猫，排成一排。' },
    { date: '2026-04-29', title: '14只老鼠吃早餐', duration: 20, rating: 5, emotion: ['很喜欢', '主动提问'], ability: ['自然认知', '语言表达'], highlight: '14只老鼠一大家子好热闹！好的表现：会数家里有几口人。互动片段：孩子说"我们家也要像老鼠一样一起吃早餐"。' },
    { date: '2026-04-29', title: '14只老鼠去春游', duration: 18, rating: 5, emotion: ['很喜欢'], ability: ['自然认知', '语言表达'], highlight: '春天好美啊！好的表现：能观察春天的变化。互动片段：我们去公园找春天，孩子发现了很多小花小草。' },
    { date: '2026-04-28', title: '小蓝和小黄', duration: 10, rating: 5, emotion: ['很喜欢'], ability: ['自然认知', '艺术创造'], highlight: '颜色混合好神奇！好的表现：会想象。互动片段：我们用颜料做了小蓝和小黄，混合出绿色。' },
    { date: '2026-04-28', title: '点点点', duration: 12, rating: 5, emotion: ['很喜欢'], ability: ['艺术创造', '语言表达'], highlight: '这本书像变魔术一样！好的表现：会跟着指令操作。互动片段：孩子指挥我"按一下"、"摇一摇"，玩得特别开心。' },
    { date: '2026-04-27', title: '变变变', duration: 10, rating: 5, emotion: ['很喜欢'], ability: ['艺术创造', '语言表达'], highlight: '颜色会变化！好的表现：理解颜色混合。互动片段：红加黄变成橙色，我们画了一幅彩色画。' },
    { date: '2026-04-27', title: '我的连衣裙', duration: 8, rating: 4, emotion: ['很喜欢'], ability: ['艺术创造', '语言表达'], highlight: '小兔子穿上自己做的连衣裙！好的表现：会想象。互动片段：孩子也用纸做了一条连衣裙，穿上转圈圈。' },
    { date: '2026-04-26', title: '我的情绪小怪兽', duration: 15, rating: 5, emotion: ['很喜欢', '主动提问'], ability: ['情绪认知', '语言表达'], highlight: '每种情绪都是不同颜色！好的表现：能说出自己的感受。互动片段：孩子说"我今天是蓝色小怪兽，有点难过"。' },
    { date: '2026-04-26', title: '生气汤', duration: 12, rating: 4, emotion: ['很喜欢'], ability: ['情绪认知', '语言表达'], highlight: '生气的时候可以煮生气汤！好的表现：知道发泄情绪的方法。互动片段：孩子生气的时候，我们一起煮了一锅"生气汤"。' },
    { date: '2026-04-24', title: '菲菲生气了', duration: 10, rating: 4, emotion: ['很喜欢'], ability: ['情绪认知', '语言表达'], highlight: '生气的时候要冷静。好的表现：学会深呼吸。互动片段：孩子说"我要像菲菲一样深呼吸"。' },
    { date: '2026-04-24', title: '杰瑞的冷静太空', duration: 12, rating: 5, emotion: ['很喜欢'], ability: ['情绪认知', '语言表达'], highlight: '创建一个自己的冷静角！好的表现：会自己冷静下来。互动片段：孩子给自己设计了一个"冷静角"，放了很多小熊。' },
    { date: '2026-04-23', title: '魔法亲亲', duration: 15, rating: 5, emotion: ['很喜欢'], ability: ['情绪认知', '社会交往'], highlight: '妈妈的魔法亲亲好温暖！好的表现：会表达爱。互动片段：孩子在我的手心亲了一下，说"这是我的魔法亲亲"。' },
    { date: '2026-04-23', title: '猜猜我有多爱你', duration: 12, rating: 5, emotion: ['很喜欢'], ability: ['情绪认知', '语言表达'], highlight: '爱要表达出来！好的表现：会说"我爱你"。互动片段：孩子说"我爱你到月亮那里，再从月亮回来"。' },
    { date: '2026-04-22', title: '逃家小兔', duration: 10, rating: 5, emotion: ['很喜欢'], ability: ['情绪认知', '语言表达'], highlight: '妈妈的爱永远不会变！好的表现：紧紧抱着我。互动片段：孩子说"我不要逃跑，我要一直和妈妈在一起"。' },
    { date: '2026-04-22', title: '爷爷一定有办法', duration: 15, rating: 5, emotion: ['很喜欢'], ability: ['语言表达', '艺术创造'], highlight: '爷爷的手好巧！好的表现：会珍惜东西。互动片段：我们把旧衣服改成小袋子，孩子特别有成就感。' },
    { date: '2026-04-20', title: '你看起来好像很好吃', duration: 18, rating: 5, emotion: ['很喜欢'], ability: ['情绪认知', '语言表达'], highlight: '霸王龙爸爸好温柔！好的表现：理解了父爱。互动片段：孩子说"爸爸也很爱我"。' },
    { date: '2026-04-20', title: '我是霸王龙', duration: 15, rating: 4, emotion: ['很喜欢'], ability: ['社会交往', '语言表达'], highlight: '朋友之间要互相帮助！好的表现：会分享。互动片段：孩子主动把玩具分享给小朋友。' },
    { date: '2026-04-19', title: '永远永远爱你', duration: 12, rating: 5, emotion: ['很喜欢'], ability: ['情绪认知', '语言表达'], highlight: '慈母龙妈妈的爱好伟大！好的表现：会表达感恩。互动片段：孩子画了一张妈妈的画，说"妈妈我永远爱你"。' },
    { date: '2026-04-19', title: '我爸爸', duration: 10, rating: 5, emotion: ['很喜欢'], ability: ['情绪认知', '语言表达'], highlight: '我爸爸真的很棒！好的表现：会夸爸爸。互动片段：孩子说"我爸爸会修车、会做饭、还会陪我玩"。' },
    { date: '2026-04-17', title: '大卫不可以', duration: 12, rating: 4, emotion: ['很喜欢'], ability: ['社会交往', '情绪认知'], highlight: '大卫做的事情我也有过！好的表现：知道什么不可以做。互动片段：孩子说"我不会像大卫一样"。' },
    { date: '2026-04-17', title: '大卫上学去', duration: 10, rating: 4, emotion: ['主动提问'], ability: ['社会交往', '语言表达'], highlight: '学校里有好多规矩！好的表现：期待上小学。互动片段：我们讨论小学和幼儿园有什么不同。' },
    { date: '2026-04-16', title: '小阿力的大学校', duration: 15, rating: 5, emotion: ['很喜欢'], ability: ['社会交往', '语言表达'], highlight: '大学校不可怕！好的表现：减少了对小学的恐惧。互动片段：孩子说"我也要像小阿力一样勇敢"。' },
    { date: '2026-04-16', title: '老师我为什么要上学', duration: 12, rating: 4, emotion: ['主动提问'], ability: ['社会交往', '语言表达'], highlight: '原来上学这么重要！好的表现：理解了学习的意义。互动片段：孩子说"我要上学学知识"。' },
    { date: '2026-04-15', title: '同桌的阿达', duration: 15, rating: 4, emotion: ['很喜欢'], ability: ['社会交往', '语言表达'], highlight: '和同桌相处要有包容心。好的表现：会理解别人。互动片段：我们讨论怎么和同学相处。' },
    { date: '2026-04-15', title: '小猪变形记', duration: 10, rating: 5, emotion: ['很喜欢'], ability: ['语言表达', '社会交往'], highlight: '做自己才是最棒的！好的表现：接受自己。互动片段：孩子说"我就想做我自己"。' },
    { date: '2026-04-14', title: '大脚丫跳芭蕾', duration: 12, rating: 5, emotion: ['很喜欢'], ability: ['情绪认知', '语言表达'], highlight: '坚持梦想就会成功！好的表现：有梦想了。互动片段：孩子说"我也要像大脚丫一样跳芭蕾"。' },
    { date: '2026-04-14', title: '糟糕，身上长条纹了', duration: 15, rating: 4, emotion: ['很喜欢'], ability: ['情绪认知', '语言表达'], highlight: '做自己很重要！好的表现：知道不要迎合别人。互动片段：孩子说"我才不要长条纹，我要做我自己"。' },
    { date: '2026-04-13', title: '小种子', duration: 10, rating: 5, emotion: ['很喜欢'], ability: ['自然认知', '语言表达'], highlight: '小种子很勇敢！好的表现：理解成长的过程。互动片段：我们种了一颗豆子，观察它发芽。' },
    { date: '2026-04-13', title: '一片叶子落下来', duration: 15, rating: 4, emotion: ['主动提问'], ability: ['自然认知', '情绪认知'], highlight: '生命是循环的。好的表现：理解了季节变化。互动片段：我们在公园捡落叶，观察颜色变化。' },
    { date: '2026-04-12', title: '爷爷变成了幽灵', duration: 12, rating: 4, emotion: ['主动提问'], ability: ['情绪认知', '语言表达'], highlight: '死亡是生命的一部分。好的表现：能接受告别。互动片段：我们谈论了什么是永远在一起。' },
    { date: '2026-04-12', title: '楼上的外婆和楼下的外婆', duration: 10, rating: 5, emotion: ['很喜欢'], ability: ['情绪认知', '语言表达'], highlight: '要珍惜和老人在一起的时光。好的表现：会去看爷爷奶奶。互动片段：孩子说"我要多陪陪爷爷奶奶"。' },
    { date: '2026-04-11', title: '獾的礼物', duration: 12, rating: 4, emotion: ['很喜欢'], ability: ['情绪认知', '社会交往'], highlight: '帮助别人会留下美好的回忆。好的表现：会主动帮助别人。互动片段：孩子帮奶奶拿东西，说"这是我的礼物"。' },
    { date: '2026-04-11', title: '活了100万次的猫', duration: 15, rating: 5, emotion: ['很喜欢'], ability: ['情绪认知', '语言表达'], highlight: '真正的爱只有一次！好的表现：理解了爱。互动片段：孩子问什么是真正的爱，我们一起讨论。' },
    { date: '2026-04-09', title: '花婆婆', duration: 18, rating: 5, emotion: ['很喜欢'], ability: ['情绪认知', '语言表达'], highlight: '让世界变得更美好！好的表现：有梦想了。互动片段：孩子说"我也要做花婆婆，让世界更美"。' },
    { date: '2026-04-09', title: '市场街最后一站', duration: 12, rating: 4, emotion: ['社会交往', '语言表达'], highlight: '平凡的生活也很美好。好的表现：懂得感恩。互动片段：孩子说"我也要谢谢奶奶"。' },
    { date: '2026-04-08', title: '世界上最好的爸爸', duration: 10, rating: 5, emotion: ['很喜欢'], ability: ['情绪认知', '语言表达'], highlight: '每个爸爸都是最好的！好的表现：爱爸爸。互动片段：孩子抱了抱爸爸，说"你是世界上最好的爸爸"。' },
    { date: '2026-04-08', title: '世界上最好的妈妈', duration: 10, rating: 5, emotion: ['很喜欢'], ability: ['情绪认知', '语言表达'], highlight: '妈妈的爱最伟大！好的表现：感谢妈妈。互动片段：孩子说"妈妈我爱你，你是世界上最好的妈妈"。' },
    { date: '2026-04-07', title: '团圆', duration: 15, rating: 5, emotion: ['很喜欢'], ability: ['情绪认知', '语言表达'], highlight: '和家人在一起最幸福。好的表现：珍惜家庭时光。互动片段：我们讨论了为什么要过年。' },
    { date: '2026-04-07', title: '火焰', duration: 12, rating: 4, emotion: ['很喜欢'], ability: ['情绪认知', '语言表达'], highlight: '妈妈的爱像火焰一样温暖。好的表现：感受到母爱。互动片段：孩子紧紧抱着我。' },
    { date: '2026-04-06', title: '安的种子', duration: 15, rating: 5, emotion: ['很喜欢'], ability: ['情绪认知', '语言表达'], highlight: '要耐心等待。好的表现：学会等待。互动片段：我们种花，等待它发芽。' },
    { date: '2026-04-06', title: '妈妈的红沙发', duration: 10, rating: 4, emotion: ['社会交往', '语言表达'], highlight: '家人一起努力真好。好的表现：懂得节俭。互动片段：孩子说"我也要存钱买沙发"。' },
    { date: '2026-04-05', title: '隧道', duration: 18, rating: 5, emotion: ['很喜欢'], ability: ['社会交往', '语言表达'], highlight: '兄妹之间的爱。好的表现：会照顾弟弟妹妹。互动片段：孩子说"我也要保护弟弟妹妹"。' },
    { date: '2026-04-05', title: '第五个', duration: 12, rating: 4, emotion: ['主动提问'], ability: ['语言表达', '情绪认知'], highlight: '克服恐惧需要勇气。好的表现：变勇敢了。互动片段：我们讨论了什么是勇敢。' },
    { date: '2026-04-04', title: '野兽国', duration: 15, rating: 5, emotion: ['很喜欢'], ability: ['情绪认知', '语言表达'], highlight: '想象一下没关系，但要回家。好的表现：理解规则。互动片段：孩子说"我可以生气，但不能太久"。' },
    { date: '2026-04-04', title: '床底下的怪物', duration: 10, rating: 4, emotion: ['主动提问'], ability: ['情绪认知', '语言表达'], highlight: '害怕的时候会自己吓自己。好的表现：克服恐惧。互动片段：孩子说"其实床底下没有怪物"。' },
    { date: '2026-04-03', title: '我的大喊大叫的一天', duration: 12, rating: 4, emotion: ['主动提问'], ability: ['情绪认知', '语言表达'], highlight: '大喊大叫是不对的。好的表现：知道自己错了。互动片段：孩子说"对不起，我今天大喊大叫了"。' },
    { date: '2026-04-03', title: '罗伯生气了', duration: 10, rating: 4, emotion: ['很喜欢'], ability: ['情绪认知', '语言表达'], highlight: '生气的时候要冷静。好的表现：学会控制情绪。互动片段：孩子说"我要深呼吸"。' },
    { date: '2026-04-02', title: '我变成一只喷火龙了', duration: 12, rating: 5, emotion: ['很喜欢'], ability: ['情绪认知', '语言表达'], highlight: '生气会伤害别人。好的表现：理解情绪管理。互动片段：孩子说"我不想变成喷火龙"。' },
    { date: '2026-04-02', title: '雷欧幼儿园', duration: 15, rating: 5, emotion: ['很喜欢'], ability: ['社会交往', '语言表达'], highlight: '幼儿园生活真丰富！好的表现：期待上幼儿园。互动片段：孩子说"我也要像雷欧一样交很多朋友"。' }
  ];

  // 生成记录
  realRecords.forEach((r, i) => {
    records.push({
      id: Date.now() + i * 100,
      bookTitle: r.title,
      date: r.date,
      duration: r.duration,
      rating: r.rating,
      emotionTags: r.emotion,
      interactionHighlights: r.highlight,
      abilityTags: r.ability,
      inputMethod: ['voice', 'quick', 'photo'][i % 3]
    });
  });

  return records.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// 更新用户画像
function updateUserPersona() {
  const records = Storage.get('readingRecords', []);
  const profile = Storage.get('childProfile', {});

  const interestProfile = {};
  const abilityCounts = {};
  const emotionCounts = {};
  let totalMinutes = 0;
  const uniqueBooks = new Set();

  records.forEach(r => {
    totalMinutes += r.duration || 0;
    uniqueBooks.add(r.bookTitle);

    (r.abilityTags || []).forEach(tag => {
      abilityCounts[tag] = (abilityCounts[tag] || 0) + 1;
    });

    (r.emotionTags || []).forEach(tag => {
      emotionCounts[tag] = (emotionCounts[tag] || 0) + 1;
    });

    // 根据书名推断兴趣
    const title = r.bookTitle;
    if (title.includes('恐龙') || title.includes('你看起来好像很好吃')) interestProfile['恐龙'] = (interestProfile['恐龙'] || 0) + 2;
    if (title.includes('动物') || title.includes('熊') || title.includes('兔') || title.includes('鸭') || title.includes('鳄鱼') || title.includes('鱼')) interestProfile['动物'] = (interestProfile['动物'] || 0) + 1;
    if (title.includes('自然') || title.includes('种子') || title.includes('毛毛虫') || title.includes('蟋蟀') || title.includes('百草园')) interestProfile['自然'] = (interestProfile['自然'] || 0) + 1;
    if (title.includes('情绪') || title.includes('生气')) interestProfile['情绪认知'] = (interestProfile['情绪认知'] || 0) + 2;
    if (title.includes('爸爸') || title.includes('妈妈') || title.includes('爷爷') || title.includes('爱')) interestProfile['亲情'] = (interestProfile['亲情'] || 0) + 1;
    if (title.includes('科学') || title.includes('苹果') || title.includes('种子')) interestProfile['科普'] = (interestProfile['科普'] || 0) + 1;
  });

  // 计算连续阅读天数
  const streakDays = calculateStreak(records);

  // 判断阅读水平
  let readingLevel = 'beginner';
  let levelProgress = 30;
  if (uniqueBooks.size >= 20) {
    readingLevel = 'advanced';
    levelProgress = 85;
  } else if (uniqueBooks.size >= 10) {
    readingLevel = 'growing';
    levelProgress = 60;
  }

  // 分析强弱项
  const allAbilities = ['语言表达', '自然认知', '情绪认知', '社交能力', '科学思维'];
  const sortedAbilities = allAbilities.sort((a, b) => (abilityCounts[b] || 0) - (abilityCounts[a] || 0));
  const strongAbilities = sortedAbilities.slice(0, 2).filter(a => (abilityCounts[a] || 0) > 0);
  const weakAbilities = sortedAbilities.slice(-2).filter(a => {
    const count = abilityCounts[a] || 0;
    return count < Math.max(...Object.values(abilityCounts), 1) * 0.4;
  });

  const persona = {
    interestProfile,
    readingLevel,
    levelProgress,
    weakAbilities,
    strongAbilities,
    totalBooks: uniqueBooks.size,
    totalMinutes,
    streakDays,
    abilityCounts,
    emotionCounts,
    recordCount: records.length
  };

  Storage.set('userPersona', persona);
  return persona;
}

// 计算连续阅读天数
function calculateStreak(records) {
  const dates = new Set(records.map(r => r.date));
  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = formatDate(d);
    if (dates.has(dateStr)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

// 日期格式化
function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ============ 推荐算法 ============
// ============ 优化推荐算法 ============

// 能力映射表
const abilityMap = {
  '语言表达': 'language',
  '自然认知': 'science',
  '情绪认知': 'emotion',
  '社交能力': 'social',
  '科学思维': 'science',
  '艺术美育': 'art'
};

function getRecommendedBooks(categoryId, limit = 4) {
  const profile = Storage.get('childProfile', {});
  const persona = Storage.get('userPersona', {});
  const records = Storage.get('readingRecords', []);
  const userInterests = profile.interests || [];
  const childAge = profile.ageRange || '3-4';

  let filteredBooks = [...bookDatabase];

  // ========== 分类筛选 ==========
  const categoryFilters = {
    'cognition': (b) => b.tags.includes('认知启蒙'),
    'interactive': (b) => b.tags.some(t => ['翻翻书', '立体书', '洞洞书', '触摸书', '声音书', '互动书', '互动'].includes(t)),
    'emotion': (b) => b.tags.includes('情绪成长'),
    'habit': (b) => b.tags.includes('行为习惯'),
    'family': (b) => b.tags.includes('亲情家庭'),
    'school': (b) => b.tags.includes('入园校园'),
    'life': (b) => b.tags.includes('生命与爱'),
    'science': (b) => b.tags.includes('科普百科'),
    'traditional': (b) => b.tags.includes('国学传统'),
    'literature': (b) => b.tags.includes('语言文学'),
    'logic': (b) => b.tags.includes('益智思维'),
    'art': (b) => b.tags.includes('艺术美育'),
    'bridge': (b) => b.tags.includes('幼小衔接')
  };

  if (categoryFilters[categoryId]) {
    filteredBooks = filteredBooks.filter(categoryFilters[categoryId]);
  }

  // ========== 1. 协同过滤 - 计算书籍相似度 ==========
  const readBooks = records.map(r => r.bookTitle);
  const readBookIds = new Set(records.map(r => {
    const book = bookDatabase.find(b => b.title === r.bookTitle);
    return book ? book.id : -1;
  }));

  // 构建已读书籍的特征向量
  const readCategories = {};
  const readAbilities = { language: 0, science: 0, art: 0, social: 0, emotion: 0 };
  
  records.forEach(r => {
    const book = bookDatabase.find(b => b.title === r.bookTitle);
    if (book) {
      book.tags.forEach(tag => {
        readCategories[tag] = (readCategories[tag] || 0) + 1;
      });
      Object.entries(book.abilities).forEach(([key, val]) => {
        readAbilities[key] = (readAbilities[key] || 0) + val;
      });
    }
  });

  // 计算每本书与已读历史的相似度
  function calculateSimilarity(book) {
    let similarity = 0;
    
    // 标签相似度
    book.tags.forEach(tag => {
      if (readCategories[tag]) {
        similarity += readCategories[tag] * 2;
      }
    });
    
    // 能力向量相似度
    Object.entries(book.abilities).forEach(([key, val]) => {
      if (readAbilities[key] > 0) {
        similarity += val * readAbilities[key] / 10;
      }
    });
    
    return similarity;
  }

  // ========== 2. 新鲜度因子 ==========
  // 统计已读分类和作者
  const readCategorySet = new Set();
  const readAuthorSet = new Set();
  records.forEach(r => {
    const book = bookDatabase.find(b => b.title === r.bookTitle);
    if (book) {
      book.tags.forEach(t => readCategorySet.add(t));
      readAuthorSet.add(book.author);
    }
  });

  // ========== 3. 能力短板加权 ==========
  const weakAbilities = persona.weakAbilities || [];

  // ========== 计算综合推荐分数 ==========
  const scoredBooks = filteredBooks.map(book => {
    let score = 0;
    const factors = [];

    // ---------- A. 协同过滤分数 (满分 30) ----------
    const similarity = calculateSimilarity(book);
    // 如果是相似书籍，给予高分
    if (similarity > 0 && !readBookIds.has(book.id)) {
      score += Math.min(similarity, 30);
      factors.push({ name: '同类推荐', score: Math.min(similarity, 30) });
    }

    // ---------- B. 能力短板强化 (满分 25) ----------
    let abilityBoost = 0;
    weakAbilities.forEach(weak => {
      const key = abilityMap[weak];
      if (key && book.abilities[key]) {
        // 能力值越高，权重越高
        abilityBoost += book.abilities[key] * 5;
      }
    });
    abilityBoost = Math.min(abilityBoost, 25);
    if (abilityBoost > 0) {
      score += abilityBoost;
      factors.push({ name: '能力补强', score: abilityBoost });
    }

    // ---------- C. 新鲜度因子 (满分 20) ----------
    let freshnessBonus = 0;
    
    // 新分类书籍加分
    const isNewCategory = book.tags.some(t => !readCategorySet.has(t));
    if (isNewCategory && !readBookIds.has(book.id)) {
      freshnessBonus += 10;
    }
    
    // 新作者加分
    if (!readAuthorSet.has(book.author) && !readBookIds.has(book.id)) {
      freshnessBonus += 5;
    }
    
    // 完全未读的书加分
    if (!readBookIds.has(book.id)) {
      freshnessBonus += 5;
    }
    
    score += freshnessBonus;
    if (freshnessBonus > 0) {
      factors.push({ name: '探索新领域', score: freshnessBonus });
    }

    // ---------- D. 兴趣匹配 (满分 15) ----------
    let interestScore = 0;
    book.tags.forEach(tag => {
      if (userInterests.includes(tag)) {
        interestScore += 5;
      }
    });
    // 画像兴趣匹配
    Object.entries(persona.interestProfile || {}).forEach(([interest, count]) => {
      if (book.tags.some(t => t.includes(interest) || interest.includes(t))) {
        interestScore += Math.min(count, 3);
      }
    });
    interestScore = Math.min(interestScore, 15);
    score += interestScore;
    if (interestScore > 0) {
      factors.push({ name: '兴趣匹配', score: interestScore });
    }

    // ---------- E. 适龄匹配 (满分 10) ----------
    const bookAges = book.ageRange.split('-').map(Number);
    const childAges = childAge.split('-').map(Number);
    const ageOverlap = Math.min(bookAges[1], childAges[1]) - Math.max(bookAges[0], childAges[0]);
    let ageScore = 0;
    if (ageOverlap >= 1) {
      ageScore = 10;
    } else if (ageOverlap >= 0) {
      ageScore = 7;
    } else if (bookAges[0] <= childAges[0]) {
      ageScore = 5;
    }
    score += ageScore;
    if (ageScore > 0) {
      factors.push({ name: '适龄', score: ageScore });
    }

    // ---------- F. 书籍质量因子 (满分 5) ----------
    // 高能力值的书略加分
    const avgAbility = Object.values(book.abilities).reduce((a, b) => a + b, 0) / 5;
    score += Math.round(avgAbility);

    // 生成个性化推荐理由
    const reason = generateRecommendationReason(book, profile, persona, factors);

    return { ...book, score, recommendationReason: reason };
  });

  // 按分数降序排列
  scoredBooks.sort((a, b) => b.score - a.score);

  // 如果是"今日推荐"，加入多样性
  if (categoryId === 'today') {
    // 取前几名，然后打散增加多样性
    const topCount = Math.min(3, scoredBooks.length);
    const top = scoredBooks.slice(0, topCount);
    const rest = scoredBooks.slice(topCount);
    
    // 打散顺序
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }
    
    return [...top, ...rest].slice(0, limit);
  }

  return scoredBooks.slice(0, limit);
}

// 优化的推荐理由生成
function generateRecommendationReason(book, profile, persona, factors) {
  const nickname = profile.nickname || '宝贝';
  const reasons = [];

  // 根据加分因素生成理由
  const factorNames = factors.map(f => f.name);
  
  if (factorNames.includes('能力补强')) {
    const weak = persona.weakAbilities?.[0] || '综合';
    reasons.push(`针对性地提升${weak}能力`);
  }
  
  if (factorNames.includes('探索新领域')) {
    reasons.push(`发现不同主题的精彩世界`);
  }
  
  if (factorNames.includes('同类推荐')) {
    reasons.push(`延续宝贝喜欢的故事风格`);
  }
  
  if (factorNames.includes('兴趣匹配')) {
    reasons.push(`符合宝贝的兴趣偏好`);
  }
  
  if (factorNames.includes('适龄')) {
    reasons.push(`适合${book.ageRange}岁阅读`);
  }

  // 确保至少有2个理由
  if (reasons.length < 2) {
    if (book.abilities.language >= 5) {
      reasons.push(`优美的语言滋养`);
    }
    if (book.abilities.science >= 4) {
      reasons.push(`有趣的科学启蒙`);
    }
  }

  return reasons.slice(0, 2).join('；') + '。';
}

// ============ 旧的推荐理由生成函数保留兼容 ============
function generateRecommendationReasonOld(book, profile, persona) {
  const reasons = [];
  const nickname = profile.nickname || '宝贝';

  if (profile.interests && profile.interests.some(i => book.tags.some(t => t.includes(i) || i.includes(t)))) {
    reasons.push(`因为${nickname}喜欢${profile.interests[0]}，这本${book.tags[0]}主题的绘本一定会让宝贝着迷`);
  }

  if (persona.weakAbilities && persona.weakAbilities.some(w => {
    const map = { '语言表达': 'language', '自然认知': 'science', '情绪认知': 'emotion', '社交能力': 'social' };
    return book.abilities[map[w]] >= 4;
  })) {
    reasons.push(`能够帮助提升${persona.weakAbilities[0]}能力，是很好的启蒙读物`);
  }

  reasons.push(`适合${book.ageRange}岁的孩子，图文比例恰到好处`);

  if (book.abilities.language >= 5) {
    reasons.push(`语言优美，能够丰富${nickname}的词汇量`);
  }

  return reasons.slice(0, 2).join('；') + '。';
}

// ============ 页面切换 ============
let currentPage = 'home';
let currentCategory = 'today';
let currentRecordFilter = 'all';
let currentReportPeriod = 'week';

function switchPage(page) {
  currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${page}`).classList.add('active');

  document.querySelectorAll('.tab-item').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.page === page);
  });

  // 页面特定渲染
  if (page === 'home') renderHome();
  if (page === 'record') renderRecords();
  if (page === 'report') renderReport();
  if (page === 'profile') renderProfile();
}

// ============ 首页渲染 ============
let aiSummaryLoading = false;

function renderHome() {
  const profile = Storage.get('childProfile', {});
  document.getElementById('home-nickname').textContent = profile.nickname || '宝贝';
  document.getElementById('home-avatar').textContent = profile.avatar || '🧒';

  // 渲染分类 Tab
  const tabsContainer = document.getElementById('category-tabs');
  tabsContainer.innerHTML = categories.map(cat => `
    <span class="category-tab ${cat.id === currentCategory ? 'active' : ''}" onclick="switchCategory('${cat.id}')">
      ${cat.emoji} ${cat.name}
    </span>
  `).join('');

  // 渲染推荐列表
  renderBookList();
  
  // 添加 AI 推荐摘要（延迟加载避免频繁调用API）
  setTimeout(() => {
    loadAISummary();
  }, 2000);
}

async function loadAISummary() {
  if (aiSummaryLoading) return;
  aiSummaryLoading = true;
  
  const records = Storage.get('readingRecords', []);
  const profile = Storage.get('childProfile', {});
  const persona = Storage.get('userPersona', {});
  
  // 只在有阅读记录时才调用AI
  if (records.length < 5) {
    aiSummaryLoading = false;
    return;
  }
  
  const recentBooks = records.slice(0, 5).map(r => r.bookTitle).join('、');
  const ageInfo = profile.ageRange || '3-4岁';
  const interests = persona.interests?.slice(0, 3).join('、') || '阅读';
  
  const messages = [
    {
      role: 'system',
      content: `你是"童书伴读"的智能推荐助手，为家长生成简洁的今日推荐摘要。要求：
1. 根据孩子阅读历史和兴趣，生成个性化推荐引导语
2. 语言温暖简洁，控制在50字以内
3. 要有引导性，让人想去看推荐的书`
    },
    {
      role: 'user',
      content: `孩子信息：${ageInfo}，兴趣：${interests}
最近读的书：${recentBooks}

请生成一句引导语，告诉家长今天推荐的书有什么特别之处。`
    }
  ];
  
  const summary = await callKimiAPI(messages, 0.6);
  
  if (summary) {
    // 在推荐区域上方添加AI摘要
    const bookList = document.getElementById('book-list');
    if (bookList && !bookList.querySelector('.ai-summary')) {
      const summaryDiv = document.createElement('div');
      summaryDiv.className = 'ai-summary';
      summaryDiv.style.cssText = 'background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%); padding: 10px 12px; border-radius: 10px; margin-bottom: 12px; font-size: 13px; line-height: 1.6;';
      summaryDiv.innerHTML = `<span style="color: var(--primary);">✨ AI推荐：</span>${summary}`;
      bookList.insertBefore(summaryDiv, bookList.firstChild);
    }
  }
  
  aiSummaryLoading = false;
}

function switchCategory(categoryId) {
  currentCategory = categoryId;
  isSearchMode = false;
  document.getElementById('search-input').value = '';
  document.querySelectorAll('.category-tab').forEach(tab => {
    tab.classList.toggle('active', tab.textContent.includes(categories.find(c => c.id === categoryId)?.name));
  });
  renderBookList();
}

function renderBookList() {
  const books = getRecommendedBooks(currentCategory, currentCategory === 'today' ? 5 : 4);
  const container = document.getElementById('book-list');
  const favorites = Storage.get('favoriteBooks', []);

  if (books.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="emoji">📚</div>
        <div class="text">这个分类下暂无绘本<br>快去看看其他分类吧~</div>
      </div>
    `;
    return;
  }

  container.innerHTML = books.map(book => {
    const isFav = favorites.includes(book.id);
    const records = Storage.get('readingRecords', []);
    const readCount = records.filter(r => r.bookTitle === book.title).length;
    const hasRead = readCount > 0;
    return `
    <div class="book-card">
      ${hasRead ? '<div class="book-read-badge">已读' + readCount + '次</div>' : ''}
      <div class="book-card-main" onclick="showBookDetail(${book.id})">
        <div class="book-cover">${book.emoji}</div>
        <div class="book-info">
          <div class="book-title">${book.title}</div>
          <div class="book-author">${book.author}</div>
          <div class="book-tags">
            <span class="tag tag-age">${book.ageRange}岁</span>
            ${book.tags.slice(0, 2).map(t => `<span class="tag tag-theme">${t}</span>`).join('')}
          </div>
          <div class="book-reason">${book.recommendationReason}</div>
          <div class="book-abilities">
            ${Object.entries(book.abilities).slice(0, 3).map(([key, val]) => {
              const nameMap = { language: '语言', science: '科学', art: '艺术', social: '社交', emotion: '情绪' };
              return `<span class="ability-item">${nameMap[key]}<span class="ability-stars">${'★'.repeat(Math.ceil(val/2))}</span></span>`;
            }).join('')}
          </div>
        </div>
      </div>
      <div class="book-card-actions">
        <button class="action-btn quick-record" onclick="event.stopPropagation(); quickRecordBook(${book.id})" title="一键记录">
          ✏️
        </button>
        <button class="action-btn favorite ${isFav ? 'active' : ''}" onclick="event.stopPropagation(); toggleFavorite(${book.id})" title="收藏">
          ${isFav ? '⭐' : '☆'}
        </button>
        <button class="action-btn get" onclick="event.stopPropagation(); openGetBookModal(${book.id})" title="获取">
          📥
        </button>
      </div>
    </div>
  `}).join('');
}

// ============ 搜索功能 ============
let isSearchMode = false;

function handleSearch(event) {
  if (event.key === 'Enter') {
    performSearch();
  }
}

function performSearch() {
  const query = document.getElementById('search-input').value.trim();
  if (!query) {
    isSearchMode = false;
    renderBookList();
    return;
  }

  isSearchMode = true;
  const container = document.getElementById('book-list');
  const records = Storage.get('readingRecords', []);

  const results = bookDatabase.filter(book => {
    const searchText = query.toLowerCase();
    return book.title.toLowerCase().includes(searchText) ||
           book.author.toLowerCase().includes(searchText) ||
           book.tags.some(tag => tag.toLowerCase().includes(searchText));
  });

  if (results.length > 0) {
    container.innerHTML = results.map(book => {
      const favorites = Storage.get('favoriteBooks', []);
      const isFav = favorites.includes(book.id);

      const bookRecords = records.filter(r => r.bookTitle === book.title);
      const readCount = bookRecords.length;
      const avgRating = readCount > 0 
        ? Math.round(bookRecords.reduce((sum, r) => sum + (parseInt(r.rating) || 0), 0) / readCount) 
        : 0;
      const hasRead = readCount > 0;

      return `
        <div class="book-card">
          ${hasRead ? '<div class="book-read-badge">已读' + readCount + '次</div>' : ''}
          <div class="book-card-main" onclick="showBookDetail(${book.id})">
            <div class="book-cover">${book.emoji}</div>
            <div class="book-info">
              <div class="book-title">${book.title}</div>
              <div class="book-author">${book.author}</div>
              <div class="book-tags">
                <span class="tag tag-age">${book.ageRange}岁</span>
                ${book.tags.slice(0, 2).map(t => `<span class="tag tag-theme">${t}</span>`).join('')}
              </div>
              <div class="book-reason">${book.description}</div>
              <div class="book-abilities">
                ${Object.entries(book.abilities).slice(0, 3).map(([key, val]) => {
                  const nameMap = { language: '语言', science: '科学', art: '艺术', social: '社交', emotion: '情绪' };
                  return `<span class="ability-item">${nameMap[key]}<span class="ability-stars">${'★'.repeat(Math.ceil(val/2))}</span></span>`;
                }).join('')}
              </div>
              <div class="search-stats">
                <span class="search-stat-item">📖 阅读 ${readCount} 次</span>
                <span class="search-stat-item">📝 记录 ${readCount} 条</span>
                ${avgRating > 0 ? `<span class="search-stat-item">⭐ 评分 ${avgRating}分</span>` : ''}
              </div>
            </div>
          </div>
          <div class="book-card-actions">
            <button class="action-btn quick-record" onclick="event.stopPropagation(); quickRecordBook(${book.id})" title="一键记录">✓</button>
            <button class="action-btn favorite ${isFav ? 'active' : ''}" onclick="event.stopPropagation(); toggleFavorite(${book.id})" title="收藏">${isFav ? '⭐' : '☆'}</button>
            <button class="action-btn get" onclick="event.stopPropagation(); openGetBookModal(${book.id})" title="获取">📥</button>
          </div>
        </div>
      `;
    }).join('');
  } else {
    saveBookRequest(query);
    
    container.innerHTML = `
      <div class="empty-state" style="padding: 30px 20px;">
        <div class="emoji" style="font-size: 48px; margin-bottom: 12px;">📭</div>
        <div class="text" style="font-size: 15px;">抱歉，我们还未收录《${query}》这本绘本</div>
        <div class="text" style="font-size: 13px; color: var(--text-secondary); margin-top: 8px;">我们会记录您的需求，尽快补充到绘本库中</div>
        <div style="margin-top: 16px;">
          <button class="btn btn-primary btn-block" onclick="document.getElementById('search-input').value=''; isSearchMode=false; renderBookList();">返回推荐</button>
        </div>
      </div>
    `;
  }
}

function saveBookRequest(bookName) {
  let requests = Storage.get('bookRequests', []);
  
  const existing = requests.find(r => r.name === bookName);
  if (existing) {
    existing.count = (existing.count || 1) + 1;
    existing.lastRequest = new Date().toISOString();
  } else {
    requests.push({
      name: bookName,
      count: 1,
      firstRequest: new Date().toISOString(),
      lastRequest: new Date().toISOString()
    });
  }
  
  Storage.set('bookRequests', requests);
}

let currentDetailBookId = null;
let aiRecommendationLoading = false;
let aiQuestionsLoading = false;
let aiTipsLoading = false;

async function showBookDetail(bookId) {
  const book = bookDatabase.find(b => b.id === bookId);
  if (!book) return;

  currentDetailBookId = bookId;
  const profile = Storage.get('childProfile', {});
  const persona = Storage.get('userPersona', {});

  document.getElementById('detail-cover').textContent = book.emoji;
  document.getElementById('detail-title').textContent = book.title;
  document.getElementById('detail-author').textContent = book.author;
  document.getElementById('detail-record-book-title').value = book.title;
  document.getElementById('detail-record-date').value = formatDate(new Date());
  document.getElementById('detail-record-duration').value = '5';
  document.getElementById('detail-record-highlights').value = '';
  setDetailRecordRating(3);
  document.querySelectorAll('#detail-record-emotion-tags .tag-select').forEach(tag => tag.classList.remove('selected'));
  clearDetailRecordTimer();
  detailRecordUploadedImage = null;
  document.getElementById('detail-record-image-preview').style.display = 'none';
  document.getElementById('detail-record-image-preview').innerHTML = '';
  document.getElementById('detail-record-image-upload').value = '';

  document.getElementById('detail-tags').innerHTML = `
    <span class="tag tag-age">${book.ageRange}岁</span>
    ${book.tags.map(t => `<span class="tag tag-theme">${t}</span>`).join('')}
  `;

  const basicReason = generateRecommendationReason(book, profile, persona, []);
  document.getElementById('detail-reason').textContent = basicReason;

  document.getElementById('detail-abilities').innerHTML = Object.entries(book.abilities).map(([key, val]) => {
    const nameMap = { language: '语言表达', science: '科学思维', art: '艺术创造', social: '社交能力', emotion: '情绪认知' };
    return `<div style="display:flex;justify-content:space-between;margin-bottom:4px;">
      <span>${nameMap[key]}</span>
      <span style="color: var(--warm-yellow);">${'★'.repeat(val)}</span>
    </div>`;
  }).join('');

  const tips = generateReadingTips(book);
  document.getElementById('detail-tips').innerHTML = tips.map((tip, i) => `
    <div style="margin-bottom:8px;${i === tips.length - 1 ? 'margin-bottom:0;' : ''}">
      <span style="color: var(--primary); font-weight: 600;">${i + 1}.</span> ${tip}
    </div>
  `).join('');

  const childAge = profile.ageRange || '3-4';
  const basicQuestions = generateQuestions(book, childAge);
  document.getElementById('detail-questions').innerHTML = basicQuestions.map((q, i) => `
    <div style="margin-bottom:6px;${i === basicQuestions.length - 1 ? 'margin-bottom:0;' : ''}">
      <span style="color: var(--primary); font-weight: 600; margin-right:6px;">${i + 1}.</span>
      <span style="font-size:13px;line-height:1.5;">${q.text}</span>
    </div>
  `).join('');

  const extension = generateExtension(book);
  document.getElementById('detail-extension').innerHTML = `
    <div style="background: var(--secondary-bg);padding:10px 12px;border-radius:8px;">
      <div style="font-size:13px;line-height:1.6;">${extension}</div>
    </div>
  `;

  updateDetailFavBtn();

  document.getElementById('book-detail-modal').classList.add('show');

  setTimeout(async () => {
    aiRecommendationLoading = true;
    const aiReason = await kimiGenerateReason(book, persona);
    if (aiReason && aiRecommendationLoading && currentDetailBookId === bookId) {
      document.getElementById('detail-reason').innerHTML = `<span style="color: var(--primary);">✨ AI推荐：</span>${aiReason}`;
    }
    aiRecommendationLoading = false;
  }, 100);

  setTimeout(async () => {
    aiTipsLoading = true;
    const aiTipsMessages = [
      {
        role: 'system',
        content: `你是"童书伴读"的亲子共读专家，为家长生成实用的阅读指导小贴士。要求：
1. 生成3条简洁的小贴士
2. 内容要具体、可操作
3. 结合绘本特点和孩子年龄
4. 每条控制在30字以内`
      },
      {
        role: 'user',
        content: `绘本：《${book.title}》
特点：${book.description || '有趣的故事'}
适读年龄：${book.ageRange}岁
请生成3条亲子共读小贴士，帮助家长更好地和孩子一起读这本书。`
      }
    ];
    const aiTipsText = await callKimiAPI(aiTipsMessages, 0.6);
    if (aiTipsText && aiTipsLoading && currentDetailBookId === bookId) {
      const aiTipsList = aiTipsText.split('\n').filter(t => t.trim()).slice(0, 3);
      if (aiTipsList.length >= 2) {
        document.getElementById('detail-tips').innerHTML = `
        ${aiTipsList.map((t, i) => `
            <div style="margin-bottom:8px;${i === aiTipsList.length - 1 ? 'margin-bottom:0;' : ''}">
              <span style="color: var(--primary); font-weight: 600;">${i + 1}.</span> ${t.trim()}
            </div>
          `).join('')}
        `;
      }
    }
    aiTipsLoading = false;
  }, 200);

  setTimeout(async () => {
    aiQuestionsLoading = true;
    const aiQuestionsText = await kimiGenerateQuestions(book, childAge);
    if (aiQuestionsText && aiQuestionsLoading && currentDetailBookId === bookId) {
      const aiQuestionsList = aiQuestionsText.split('\n').filter(q => q.trim());
      if (aiQuestionsList.length >= 2) {
        document.getElementById('detail-questions').innerHTML = `
        ${aiQuestionsList.map((q, i) => `
            <div style="margin-bottom:6px;${i === aiQuestionsList.length - 1 ? 'margin-bottom:0;' : ''}">
              <span style="color: var(--primary); font-weight: 600; margin-right:6px;">${i + 1}.</span>
              <span style="font-size:13px;line-height:1.5;">${q.trim()}</span>
            </div>
          `).join('')}
        `;
      }
    }
    aiQuestionsLoading = false;
  }, 300);
}

// ============ 亲子共读小贴士库（100+条）============
const readingTipsLibrary = {
  // 父母多做（30条）
  parentDo: [
    '多提问开放式问题，鼓励孩子表达自己的想法，少问"对不对""是不是"。',
    '耐心等待孩子的回答，不要急于纠正，给孩子思考和表达的时间。',
    '多和孩子眼神交流，用温和的语气回应，让孩子感受到你的关注。',
    '读到有趣的地方停下来，和孩子一起笑一笑，享受阅读的乐趣。',
    '结合孩子的生活经历提问，帮助孩子将故事与自己联系起来。',
    '让孩子自己翻书页，培养自主阅读的兴趣和能力。',
    '用夸张的表情和语气读故事，增加趣味性和吸引力。',
    '读完后问问孩子最喜欢哪一页，为什么喜欢。',
    '允许孩子中途打断提问，认真回答每一个问题。',
    '重复读孩子喜欢的书，每次都会有新的发现。',
    '和孩子一起模仿故事里的动作或声音。',
    '让孩子坐在怀里或旁边，营造亲密的阅读氛围。',
    '固定每天阅读时间，养成习惯比读多少更重要。',
    '阅读时关掉电视和手机，专注陪伴。',
    '让孩子自己选今天读什么书，尊重孩子的选择。',
    '读前先看封面猜猜内容，激发好奇心。',
    '遇到不懂的词用孩子能理解的方式解释。',
    '让孩子当"小老师"，给爸爸妈妈讲故事。',
    '读完后一起画画或做手工，延伸阅读体验。',
    '用故事里的情节解决生活中的问题。',
    '记录孩子说的有趣话语，做成阅读日记。',
    '和孩子一起给故事编新的结尾。',
    '把故事里的角色和孩子熟悉的玩具联系起来。',
    '读完后问问孩子想不想再读一遍。',
    '用故事里的道理引导孩子思考行为。',
    '让孩子指出故事里和家里一样的东西。',
    '读到感人的地方和孩子一起感受。',
    '鼓励孩子把故事讲给爷爷奶奶听。',
    '把阅读当成礼物，而不是任务。',
    '相信孩子能理解，不要过度简化。'
  ],
  // 父母避坑（25条）
  parentAvoid: [
    '避免频繁打断孩子的思考，不要急于给出答案或纠正错误。',
    '避免只关注识字和数数，忽略故事理解和情感交流。',
    '避免用考试式提问，比如"这个字念什么？""这是第几个？"。',
    '避免强迫孩子复述或背诵，让阅读变成压力。',
    '避免自己读得很快，不顾孩子是否理解和感兴趣。',
    '避免在孩子不感兴趣时强行读完。',
    '避免用阅读作为惩罚或奖励的手段。',
    '避免只读"有用"的书，忽略孩子的兴趣。',
    '避免每次都纠正孩子的发音或用词。',
    '避免在孩子疲惫时要求阅读。',
    '避免把阅读变成比赛，比如"今天读了多少本"。',
    '避免用手机拍视频代替真正的陪伴。',
    '避免在孩子提问时敷衍回答。',
    '避免只让孩子听，不让孩子说。',
    '避免用成人标准评判孩子的理解。',
    '避免在孩子分心时批评指责。',
    '避免跳过孩子喜欢的页面。',
    '避免用"你应该这样理解"限制孩子。',
    '避免在孩子说错时立刻纠正。',
    '避免只读新书，忽略孩子想重复读的旧书。',
    '避免用阅读时间衡量阅读质量。',
    '避免在孩子情绪不好时强迫阅读。',
    '避免把阅读变成睡前唯一任务。',
    '避免只关注故事结局，忽略过程。',
    '避免用"快点读完"催促孩子。'
  ],
  // 孩子鼓励（25条）
  childEncourage: [
    '鼓励孩子指着图画说话，哪怕说得不完整也要肯定。',
    '鼓励孩子提出自己的问题，无论问题多简单都要认真回答。',
    '鼓励孩子预测接下来会发生什么，培养想象力。',
    '鼓励孩子表达自己的感受，比如"你觉得这个小动物开心吗？"。',
    '鼓励孩子联系自己的生活，说说"如果是你会怎么做？"。',
    '鼓励孩子给故事里的角色起名字。',
    '鼓励孩子用动作表达故事内容。',
    '鼓励孩子画出故事里最喜欢的场景。',
    '鼓励孩子把故事讲给宠物或玩具听。',
    '鼓励孩子找出故事里的颜色和形状。',
    '鼓励孩子模仿故事里的声音。',
    '鼓励孩子说出故事里谁最勇敢。',
    '鼓励孩子想想故事里的问题怎么解决。',
    '鼓励孩子说出自己的阅读感受。',
    '鼓励孩子把故事和动画片比较。',
    '鼓励孩子给故事打分，说说为什么。',
    '鼓励孩子找出故事里的数字。',
    '鼓励孩子说出故事发生在哪里。',
    '鼓励孩子想象自己是故事里的角色。',
    '鼓励孩子找出故事里的好朋友。',
    '鼓励孩子说出故事里最有趣的部分。',
    '鼓励孩子想想故事里的角色在想什么。',
    '鼓励孩子用故事里的词语说话。',
    '鼓励孩子把故事和生活联系起来。',
    '鼓励孩子说出读完后的心情。'
  ],
  // 孩子制止（10条）
  childStop: [
    '制止孩子撕书或乱扔书的行为，温和但坚定地说"书要爱护"。',
    '制止孩子在阅读时跑来跑去，引导坐下来专注。',
    '制止孩子抢着翻页太快，引导慢慢看。',
    '制止孩子在阅读时大声喊叫，引导安静聆听。',
    '制止孩子打断别人讲故事，引导轮流说。',
    '制止孩子把书当玩具乱玩，引导正确使用。',
    '制止孩子在阅读时吃零食，引导专注阅读。',
    '制止孩子只看图画不看文字，引导两者结合。',
    '制止孩子跳过不喜欢的页面，引导完整阅读。',
    '制止孩子在阅读时玩手机，引导专注陪伴。'
  ],
  // 敏感期信号（15条）
  sensitiveSignal: [
    '孩子反复问"为什么"，可能是逻辑敏感期，适合科普类绘本。',
    '孩子喜欢模仿说话，可能是语言敏感期，适合韵文类绘本。',
    '孩子对颜色特别感兴趣，可能是色彩敏感期，适合艺术类绘本。',
    '孩子喜欢数数，可能是数学敏感期，适合数学启蒙绘本。',
    '孩子总问"这是什么"，可能是认知敏感期，适合认知类绘本。',
    '孩子喜欢模仿动作，可能是运动敏感期，适合互动类绘本。',
    '孩子对情绪变化敏感，可能是情感敏感期，适合情绪类绘本。',
    '孩子喜欢角色扮演，可能是社交敏感期，适合社交类绘本。',
    '孩子对文字感兴趣，可能是识字敏感期，适合文字类绘本。',
    '孩子喜欢问"在哪里"，可能是空间敏感期，适合方位类绘本。',
    '孩子喜欢听故事重复，可能是秩序敏感期，适合重复情节绘本。',
    '孩子对声音敏感，可能是听觉敏感期，适合声音书。',
    '孩子喜欢触摸一切，可能是触觉敏感期，适合触摸书。',
    '孩子对细节特别关注，可能是观察敏感期，适合细节丰富绘本。',
    '孩子喜欢问时间，可能是时间敏感期，适合时间概念绘本。'
  ],
  // 不配合应对（15条）
  notCooperate: [
    '孩子不愿配合时，试试换一本孩子更喜欢的书。',
    '孩子不愿配合时，试试用玩具吸引注意力后再阅读。',
    '孩子不愿配合时，试试让孩子自己选阅读方式。',
    '孩子不愿配合时，试试缩短阅读时间，读一小段。',
    '孩子不愿配合时，试试换个时间，比如饭后或睡前。',
    '孩子不愿配合时，试试让孩子当"小老师"讲故事。',
    '孩子不愿配合时，试试用夸张表情吸引兴趣。',
    '孩子不愿配合时，试试只看图画不读文字。',
    '孩子不愿配合时，试试和孩子一起做书里的动作。',
    '孩子不愿配合时，试试先聊聊孩子感兴趣的话题。',
    '孩子不愿配合时，试试换个阅读地点，比如沙发或地毯。',
    '孩子不愿配合时，试试让孩子抱着喜欢的玩具一起读。',
    '孩子不愿配合时，试试只读孩子喜欢的页面。',
    '孩子不愿配合时，试试把故事变成游戏。',
    '孩子不愿配合时，试试暂停阅读，过会儿再试。'
  ]
};

// 记录已使用的小贴士索引，避免重复
let usedTipsIndices = {
  parentDo: [],
  parentAvoid: [],
  childEncourage: [],
  childStop: [],
  sensitiveSignal: [],
  notCooperate: []
};

// 从列表随机选取一条，避免重复
function getRandomTip(category) {
  const pool = readingTipsLibrary[category];
  const used = usedTipsIndices[category];
  
  // 找未使用的索引
  let available = [];
  for (let i = 0; i < pool.length; i++) {
    if (!used.includes(i)) available.push(i);
  }
  
  // 如果都用过了，重置
  if (available.length === 0) {
    usedTipsIndices[category] = [];
    available = pool.map((_, i) => i);
  }
  
  // 随机选一个
  const idx = available[Math.floor(Math.random() * available.length)];
  usedTipsIndices[category].push(idx);
  
  return pool[idx];
}

// 生成3条亲子共读注意事项
function generateReadingTips(book) {
  const tips = [];
  
  // 第1条：父母多做
  tips.push(getRandomTip('parentDo'));
  
  // 第2条：父母避坑或孩子制止（随机）
  if (Math.random() > 0.6) {
    tips.push('❌ 避坑：' + getRandomTip('parentAvoid'));
  } else {
    tips.push('🚫 注意：' + getRandomTip('childStop'));
  }
  
  // 第3条：孩子鼓励或敏感期信号或不配合应对（随机）
  const r = Math.random();
  if (r < 0.5) {
    tips.push('💪 鼓励：' + getRandomTip('childEncourage'));
  } else if (r < 0.75) {
    tips.push('🔍 观察：' + getRandomTip('sensitiveSignal'));
  } else {
    tips.push('💡 应对：' + getRandomTip('notCooperate'));
  }
  
  return tips;
}

// 生成亲子问答（结合书本和孩子画像）
function generateQuestions(book, ageRange) {
  const questions = [];
  const title = book.title;
  const emoji = book.emoji;
  const tags = book.tags;
  
  // 获取孩子画像
  const profile = Storage.get('childProfile', {});
  const childName = profile.nickname || '宝贝';
  const childInterests = profile.interests || [];
  const childAge = profile.ageRange || '3-4';

  // 根据书本主题生成问题模板
  const themeQuestions = {
    '认知启蒙': [
      `这本书里有哪些颜色呀？你最喜欢哪个颜色？`,
      `故事里出现了什么形状？你能找出来吗？`,
      `书里的${emoji}在做什么呢？`,
      `你能数一数故事里有几个${emoji}吗？`,
      `故事发生在什么地方呀？`
    ],
    '情绪成长': [
      `${emoji}现在是什么心情呀？你怎么看出来的？`,
      `你有没有像${emoji}一样生气/开心过？`,
      `如果${emoji}不开心了，你会怎么安慰它？`,
      `故事里谁最开心？谁最难过？为什么？`,
      `读完这个故事，你现在的心情怎么样？`
    ],
    '行为习惯': [
      `${emoji}做了什么好事呀？你觉得它做得对吗？`,
      `如果是${childName}，你会像${emoji}一样做吗？`,
      `故事里的小朋友哪里做得好？哪里可以更好？`,
      `我们为什么要像${emoji}那样做呢？`,
      `读完这个故事，${childName}想学什么好习惯？`
    ],
    '亲情家庭': [
      `故事里的爸爸妈妈/爷爷奶奶是怎么爱${emoji}的？`,
      `你的爸爸妈妈/爷爷奶奶是怎么爱你的呀？`,
      `${emoji}和家人的关系怎么样？你喜欢吗？`,
      `读完这个故事，你想对家人说什么？`,
      `故事里最温馨的是哪一页？为什么？`
    ],
    '科普百科': [
      `故事里有什么有趣的知识呀？`,
      `你学到了什么新东西？`,
      `${emoji}有什么特别的地方？`,
      `你能告诉爸爸妈妈一个故事里的秘密吗？`,
      `如果去故事里的地方，你想看什么？`
    ],
    '国学传统': [
      `故事里有什么传统习俗呀？`,
      `你见过这样的节日/习俗吗？`,
      `${emoji}在做什么传统的事呢？`,
      `这个故事和我们的文化有什么关系？`,
      `你想试试故事里的传统活动吗？`
    ],
    '语言文学': [
      `故事里哪句话你最喜欢？`,
      `你能模仿${emoji}说话的样子吗？`,
      `这个故事和别的故事有什么不一样？`,
      `如果让你给故事起个新名字，你会叫什么？`,
      `故事里有什么好听的新词语吗？`
    ],
    '益智思维': [
      `故事里有什么数字呀？`,
      `${emoji}遇到了什么难题？怎么解决的？`,
      `你能帮${emoji}想个办法吗？`,
      `故事里有什么规律？你能发现吗？`,
      `如果换一个方法，结果会怎样？`
    ],
    '艺术美育': [
      `这本书的画是什么颜色的？你喜欢吗？`,
      `你能画出故事里的${emoji}吗？`,
      `故事里最美的画面是哪一页？`,
      `如果让你画这本书，你会怎么画？`,
      `故事里的颜色让你想到了什么？`
    ],
    '入园校园': [
      `${emoji}在学校/幼儿园发生了什么呀？`,
      `如果是${childName}去学校，你会怎么做？`,
      `故事里的小朋友是怎么交朋友的？`,
      `学校里有什么好玩的事？`,
      `读完这个故事，你对上学有什么想法？`
    ],
    '生命与爱': [
      `故事里${emoji}是怎么长大的？`,
      `你发现故事里有什么变化吗？`,
      `${emoji}学会了什么重要的道理？`,
      `这个故事让你想到了什么？`,
      `你想对故事里的${emoji}说什么？`
    ],
    '幼小衔接': [
      `故事里有什么字你认识吗？`,
      `${emoji}在学习什么呀？`,
      `你能数一数故事里的东西吗？`,
      `故事里的小朋友是怎么准备的？`,
      `读完这个故事，你想学什么？`
    ]
  };

  // 根据孩子兴趣生成问题
  const interestQuestions = {};
  childInterests.forEach(interest => {
    interestQuestions[interest] = [
      `故事里有没有${interest}呀？`,
      `${childName}喜欢${interest}，故事里的${emoji}也喜欢吗？`,
      `你能找出故事里和${interest}有关的东西吗？`,
      `如果${emoji}也喜欢${interest}，它会怎么做？`,
      `故事里的${interest}是什么样的？`
    ];
  });

  // 通用问题（感知回忆类）
  const perceptionQuestions = [
    `故事里都有谁呀？你最喜欢谁？`,
    `这本书的主角是${emoji}，它叫什么名字？`,
    `你还记得故事里发生了什么有趣的事吗？`,
    `故事里最让你印象深刻的是哪一页？`,
    `你看到故事里有什么颜色/形状？`
  ];

  // 通用问题（简单理解类）
  const comprehensionQuestions = [
    `为什么${emoji}会这样做呢？`,
    `你觉得这个故事讲了一个什么道理？`,
    `故事里的小朋友/小动物开心吗？为什么？`,
    `如果是你，你会怎么做呢？`,
    `你觉得故事里谁做得最好？为什么？`
  ];

  // 通用问题（预测推理类）
  const predictionQuestions = [
    `你猜接下来会发生什么事？`,
    `如果${emoji}没有那样做，结果会怎样？`,
    `你觉得故事结束后，${emoji}会去哪里？`,
    `为什么会发生这件事？`,
    `如果给故事加一个结尾，你想怎么加？`
  ];

  // 通用问题（迁移创造类）
  const creationQuestions = [
    `如果你是故事里的${emoji}，你会怎么做？`,
    `我们一起编一个新故事好不好？`,
    `这个故事让你想到了什么其他的故事？`,
    `如果把这个故事的主角换成${childName}，会发生什么？`,
    `你想给这本书加一页吗？画什么内容？`
  ];

  // 难度配置
  const ageConfig = {
    '3-4': {感知回忆: 0.7, 简单理解: 0.3, 预测推理: 0, 迁移创造: 0},
    '4-5': {感知回忆: 0.4, 简单理解: 0.4, 预测推理: 0.2, 迁移创造: 0},
    '5-6': {感知回忆: 0.25, 简单理解: 0.25, 预测推理: 0.25, 迁移创造: 0.25}
  };
  const config = ageConfig[childAge] || ageConfig['3-4'];

  // 构建问题池
  const questionPools = [
    { pool: perceptionQuestions, weight: config['感知回忆'] },
    { pool: comprehensionQuestions, weight: config['简单理解'] },
    { pool: predictionQuestions, weight: config['预测推理'] },
    { pool: creationQuestions, weight: config['迁移创造'] }
  ].filter(p => p.weight > 0);

  // 优先从主题和兴趣问题中选择
  const themePool = [];
  tags.forEach(tag => {
    if (themeQuestions[tag]) {
      themePool.push(...themeQuestions[tag]);
    }
  });
  childInterests.forEach(interest => {
    if (interestQuestions[interest]) {
      themePool.push(...interestQuestions[interest]);
    }
  });

  // 生成3个问题
  for (let i = 0; i < 3; i++) {
    // 优先使用主题相关问题（如果有）
    if (themePool.length > 0 && Math.random() > 0.3) {
      const q = themePool[Math.floor(Math.random() * themePool.length)];
      questions.push({ text: q });
      themePool.splice(themePool.indexOf(q), 1); // 避免重复
    } else {
      // 根据难度比例选择
      const pool = questionPools[i % questionPools.length].pool;
      const q = pool[Math.floor(Math.random() * pool.length)];
      questions.push({ text: q });
    }
  }

  return questions;
}

// 生成阅读延伸活动
function generateExtension(book) {
  const extensions = {
    '认知启蒙': [
      '和孩子一起找找家里有没有书中出现的物品，指认并说一说。',
      '用积木搭一搭故事里的场景，边玩边复述故事。',
      '玩"我说你找"的游戏，家长描述，孩子找对应的图。'
    ],
    '互动书': [
      '和孩子一起动手做一本属于自己的翻翻书。',
      '用家里的纸盒做一个神秘盒子，放东西进去猜猜看。',
      '模仿书中的互动方式，设计一个亲子小游戏。'
    ],
    '情绪成长': [
      '和孩子一起画一画今天的心情小怪兽，是什么颜色的？',
      '玩"表情模仿秀"，互相模仿不同的情绪表情。',
      '一起制作一个情绪选择轮，不开心的时候转一转。'
    ],
    '行为习惯': [
      '和孩子一起制定一个小目标，比如"今天自己刷牙"，做到了就贴个小贴纸。',
      '角色扮演：你来当老师，我当小朋友，教一教应该怎么做。',
      '画一张"好习惯清单"，把今天做到的好习惯都画上去。'
    ],
    '亲情家庭': [
      '和孩子一起做一张全家福，每个人都画上自己。',
      '给家里每个人一个大大的拥抱，说一句"我爱你"。',
      '一起做一道家人爱吃的菜，体验一起做饭的乐趣。'
    ],
    '入园校园': [
      '玩"模拟幼儿园/小学"的游戏，让孩子当老师，家长当学生。',
      '和孩子一起准备明天的书包，练习整理物品。',
      '画一画"我理想中的学校"，让孩子讲讲画里的故事。'
    ],
    '生命与爱': [
      '和孩子一起种一颗小种子，观察它的成长。',
      '聊聊家里的长辈，听听他们小时候的故事。',
      '养一只小宠物（蚕宝宝、小鱼等），学习照顾生命。'
    ],
    '科普百科': [
      '做一个简单的小实验，比如彩虹水、火山爆发等。',
      '一起看一集相关的科普动画片，拓展知识。',
      '去博物馆/科技馆/动物园，实地观察学习。'
    ],
    '国学传统': [
      '一起读一首古诗，配上动作和表情。',
      '做一个传统手工，比如剪纸、灯笼、粽子等。',
      '讲一讲这个故事背后的传统文化故事。'
    ],
    '语言文学': [
      '让孩子用自己的话把故事讲给你听。',
      '一起给故事编一个新的结尾。',
      '玩"故事接龙"，你说一句我说一句，编新故事。'
    ],
    '益智思维': [
      '玩一个相关的逻辑小游戏，锻炼思维能力。',
      '用家里的物品摆一摆，还原故事中的数学场景。',
      '出几道和故事相关的小谜题，让孩子猜一猜。'
    ],
    '艺术美育': [
      '准备画材，让孩子画一画故事里最喜欢的场景。',
      '用彩泥捏一捏故事里的角色。',
      '听一段和故事风格匹配的音乐，边听边画画。'
    ],
    '幼小衔接': [
      '一起认一认故事里出现的汉字。',
      '用故事里的词语玩"词语接龙"。',
      '练习写一两个故事里出现的简单汉字。'
    ]
  };

  const category = book.tags[0] || '认知启蒙';
  const pool = extensions[category] || extensions['认知启蒙'];
  return pool[Math.floor(Math.random() * pool.length)];
}

function updateDetailFavBtn() {
  const favorites = Storage.get('favoriteBooks', []);
  const btn = document.getElementById('detail-fav-btn');
  const isFav = favorites.includes(currentDetailBookId);
  if (btn) {
    btn.textContent = isFav ? '⭐ 已收藏' : '☆ 收藏';
    btn.style.borderColor = isFav ? '#FF9800' : '';
    btn.style.color = isFav ? '#FF9800' : '';
  }
}

function closeBookDetail() {
  document.getElementById('book-detail-modal').classList.remove('show');
  switchDetailTab('tips');
}

function switchDetailTab(tab) {
  const tipsBtn = document.getElementById('detail-tab-tips-btn');
  const recordBtn = document.getElementById('detail-tab-record-btn');
  const tipsContent = document.getElementById('detail-tab-tips');
  const recordContent = document.getElementById('detail-tab-record');

  if (tab === 'tips') {
    tipsBtn.classList.add('btn-primary');
    tipsBtn.style.background = 'linear-gradient(135deg,#FF8C42,#FF6B1A)';
    tipsBtn.style.color = 'white';
    recordBtn.classList.remove('btn-primary');
    recordBtn.style.background = 'transparent';
    recordBtn.style.color = 'var(--text)';
    tipsContent.style.display = 'block';
    recordContent.style.display = 'none';
  } else {
    recordBtn.classList.add('btn-primary');
    recordBtn.style.background = 'linear-gradient(135deg,#FF8C42,#FF6B1A)';
    recordBtn.style.color = 'white';
    tipsBtn.classList.remove('btn-primary');
    tipsBtn.style.background = 'transparent';
    tipsBtn.style.color = 'var(--text)';
    tipsContent.style.display = 'none';
    recordContent.style.display = 'block';
    if (!detailRecordTimerStarted) {
      startDetailRecordTimer();
    }
  }
}

function addBookToPlan() {
  showToast('已加入阅读计划 ✨');
  closeBookDetail();
}

// ============ 获取途径功能 ============
let currentGetBookId = null;

function openGetBookModal(bookId) {
  const book = bookDatabase.find(b => b.id === bookId);
  if (!book) return;
  currentGetBookId = bookId;

  document.getElementById('get-book-cover').textContent = book.emoji;
  document.getElementById('get-book-title').textContent = book.title;
  document.getElementById('get-book-author').textContent = book.author;
  document.getElementById('get-isbn-title').textContent = book.title;

  // 生成模拟 ISBN
  const isbn = '978-7-' + String(1000 + bookId * 137).slice(0, 4) + '-' + String(10000 + bookId * 97).slice(0, 5) + '-' + (bookId % 10);
  document.getElementById('get-isbn-code').textContent = isbn;

  // 生成模拟索书号
  const categoryMap = {
    '认知启蒙': 'G613.3', '互动书': 'G613.3', '情绪成长': 'I287.8',
    '行为习惯': 'I287.8', '亲情家庭': 'I287.8', '入园校园': 'I287.8',
    '生命与爱': 'I287.8', '科普百科': 'Z228.1', '国学传统': 'G611',
    '语言文学': 'I287.8', '益智思维': 'G613.4', '艺术美育': 'J228',
    '幼小衔接': 'G613'
  };
  let callNumber = 'I287.8';
  for (const tag of book.tags) {
    if (categoryMap[tag]) {
      callNumber = categoryMap[tag];
      break;
    }
  }
  document.getElementById('get-call-number').textContent = callNumber;

  // 生成漂流书单（同主题5本）
  renderFloatBookList(book);

  document.getElementById('get-book-modal').classList.add('show');
}

function closeGetBookModal() {
  document.getElementById('get-book-modal').classList.remove('show');
}

function renderFloatBookList(book) {
  // 找到同分类的书，排除当前这本
  const sameCategory = bookDatabase.filter(b => {
    if (b.id === book.id) return false;
    return b.tags.some(t => book.tags.includes(t));
  });

  // 随机选4本，加上当前这本共5本
  const shuffled = sameCategory.sort(() => Math.random() - 0.5).slice(0, 4);
  const list = [book, ...shuffled];

  const container = document.getElementById('book-float-list');
  container.innerHTML = list.map((b, i) => `
    <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #F0E6D8;${i === list.length - 1 ? 'border-bottom:none;' : ''}">
      <div style="width:24px;height:24px;border-radius:4px;background:var(--primary-bg);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;">${b.emoji}</div>
      <div style="flex:1;min-width:0;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${b.title}</div>
      ${i === 0 ? '<span style="font-size:10px;color:var(--primary);background:var(--primary-bg);padding:2px 6px;border-radius:8px;flex-shrink:0;">选中</span>' : ''}
    </div>
  `).join('');
}

function openShop(platform) {
  const book = bookDatabase.find(b => b.id === currentGetBookId);
  if (!book) return;

  const searchUrl = {
    douyin: `https://www.douyin.com/search/${encodeURIComponent(book.title + ' 绘本')}`,
    tmall: `https://list.tmall.com/search_product.htm?q=${encodeURIComponent(book.title + ' 绘本')}`,
    jd: `https://search.jd.com/Search?keyword=${encodeURIComponent(book.title + ' 绘本')}`
  };

  if (searchUrl[platform]) {
    window.open(searchUrl[platform], '_blank');
    showToast('正在跳转到对应平台...');
  }
}

function floatBookRequest() {
  showToast('🎁 漂流绘本申请已提交，等待确认中~');
  closeGetBookModal();
}

// ============ 收藏功能 ============
function toggleFavorite(bookId) {
  let favorites = Storage.get('favoriteBooks', []);
  const idx = favorites.indexOf(bookId);
  if (idx > -1) {
    favorites.splice(idx, 1);
    showToast('已取消收藏');
  } else {
    favorites.push(bookId);
    showToast('⭐ 收藏成功');
  }
  Storage.set('favoriteBooks', favorites);
  renderBookList();
}

function openFavoriteModal() {
  const favorites = Storage.get('favoriteBooks', []);
  const container = document.getElementById('favorite-list');

  if (favorites.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="emoji">⭐</div>
        <div class="text">还没有收藏绘本哦<br>快去首页找找喜欢的绘本吧~</div>
      </div>
    `;
  } else {
    const favBooks = favorites.map(id => bookDatabase.find(b => b.id === id)).filter(Boolean);
    container.innerHTML = favBooks.map(book => `
      <div style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);">
        <div style="width:48px;height:67px;border-radius:6px;background:var(--primary-bg);display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;">${book.emoji}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:14px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${book.title}</div>
          <div style="font-size:11px;color:var(--text-light);margin:2px 0;">${book.author}</div>
          <div style="display:flex;gap:6px;margin-top:4px;">
            <button class="btn btn-primary btn-sm" style="padding:2px 8px;font-size:10px;" onclick="closeFavoriteModal();quickRecordBook(${book.id})">记录</button>
            <button class="btn btn-outline btn-sm" style="padding:2px 8px;font-size:10px;" onclick="removeFavorite(${book.id})">取消收藏</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  document.getElementById('favorite-modal').classList.add('show');
}

function closeFavoriteModal() {
  document.getElementById('favorite-modal').classList.remove('show');
}

function removeFavorite(bookId) {
  let favorites = Storage.get('favoriteBooks', []);
  favorites = favorites.filter(id => id !== bookId);
  Storage.set('favoriteBooks', favorites);
  openFavoriteModal();
  showToast('已取消收藏');
}

// ============ 快速记录 ============
function quickRecordBook(bookId) {
  const book = bookDatabase.find(b => b.id === bookId);
  if (!book) return;

  // 直接打开语音录入形式，自动填入
  document.getElementById('voice-step-1').style.display = 'none';
  document.getElementById('voice-step-2').style.display = 'none';
  document.getElementById('voice-step-3').style.display = 'block';
  document.getElementById('voice-book-title').value = book.title;
  document.getElementById('voice-date').value = formatDate(new Date());
  document.getElementById('voice-duration').value = '5';

  // 清空所有情绪标签选中状态
  document.querySelectorAll('#voice-emotion-tags .tag-select').forEach(tag => {
    tag.classList.remove('selected');
  });

  // 清空所有能力标签选中状态
  document.querySelectorAll('#voice-ability-tags .tag-select').forEach(tag => {
    tag.classList.remove('selected');
  });

  // 清空亲子互动亮点
  document.getElementById('voice-highlights').value = '';

  // 重置评分
  setVoiceRating(3);

  document.getElementById('voice-modal').classList.add('show');
  
  startVoiceTimer();
}

// ============ 语音表单内联计时器 ============
let voiceTimerInterval = null;
let voiceTimerSeconds = 0;
let isVoiceTimerPaused = false;
let isVoiceTimerStopped = false;

function startVoiceTimer() {
  voiceTimerSeconds = 0;
  isVoiceTimerPaused = false;
  isVoiceTimerStopped = false;
  
  document.getElementById('voice-timer-btns').style.display = 'flex';
  document.getElementById('voice-timer-btns-paused').style.display = 'none';
  updateVoiceTimerDisplay();
  
  if (voiceTimerInterval) {
    clearInterval(voiceTimerInterval);
  }
  
  voiceTimerInterval = setInterval(() => {
    if (!isVoiceTimerPaused && !isVoiceTimerStopped) {
      voiceTimerSeconds++;
      updateVoiceTimerDisplay();
    }
  }, 1000);
}

function updateVoiceTimerDisplay() {
  const mins = Math.floor(voiceTimerSeconds / 60).toString().padStart(2, '0');
  const secs = (voiceTimerSeconds % 60).toString().padStart(2, '0');
  document.getElementById('voice-timer-display').textContent = `${mins}:${secs}`;
}

function pauseVoiceTimer() {
  isVoiceTimerPaused = true;
  document.getElementById('voice-timer-btns').style.display = 'none';
  document.getElementById('voice-timer-btns-paused').style.display = 'flex';
}

function resumeVoiceTimer() {
  isVoiceTimerPaused = false;
  document.getElementById('voice-timer-btns').style.display = 'flex';
  document.getElementById('voice-timer-btns-paused').style.display = 'none';
}

function stopVoiceTimer() {
  isVoiceTimerStopped = true;
  if (voiceTimerInterval) {
    clearInterval(voiceTimerInterval);
    voiceTimerInterval = null;
  }
  const minutes = Math.max(1, Math.round(voiceTimerSeconds / 60));
  document.getElementById('voice-duration').value = minutes;
  
  document.getElementById('voice-timer-btns').style.display = 'none';
  document.getElementById('voice-timer-btns-paused').style.display = 'none';
  
  showToast(`计时结束，共 ${minutes} 分钟`);
}

function clearVoiceTimer() {
  if (voiceTimerInterval) {
    clearInterval(voiceTimerInterval);
    voiceTimerInterval = null;
  }
  voiceTimerSeconds = 0;
  isVoiceTimerPaused = false;
  isVoiceTimerStopped = false;
}

// ============ 详情弹窗内联记录 ============
let detailRecordRating = 0;
let detailRecordTimerInterval = null;
let detailRecordTimerSeconds = 0;
let isDetailRecordTimerPaused = false;
let isDetailRecordTimerStopped = false;
let detailRecordTimerStarted = false;
let detailRecordUploadedImage = null;

function setDetailRecordRating(rating) {
  detailRecordRating = rating;
  const stars = document.querySelectorAll('#detail-record-rating .star-item');
  stars.forEach((star, index) => {
    if (index < rating) {
      star.textContent = '★';
      star.style.color = '#FFC107';
    } else {
      star.textContent = '☆';
      star.style.color = '#ccc';
    }
  });
}

function startDetailRecordTimer() {
  detailRecordTimerSeconds = 0;
  isDetailRecordTimerPaused = false;
  isDetailRecordTimerStopped = false;
  detailRecordTimerStarted = true;
  document.getElementById('detail-record-timer-btns').style.display = 'flex';
  document.getElementById('detail-record-timer-btns-paused').style.display = 'none';
  updateDetailRecordTimerDisplay();
  if (detailRecordTimerInterval) clearInterval(detailRecordTimerInterval);
  detailRecordTimerInterval = setInterval(() => {
    if (!isDetailRecordTimerPaused && !isDetailRecordTimerStopped) {
      detailRecordTimerSeconds++;
      updateDetailRecordTimerDisplay();
    }
  }, 1000);
}

function updateDetailRecordTimerDisplay() {
  const mins = Math.floor(detailRecordTimerSeconds / 60).toString().padStart(2, '0');
  const secs = (detailRecordTimerSeconds % 60).toString().padStart(2, '0');
  document.getElementById('detail-record-timer-display').textContent = `${mins}:${secs}`;
}

function pauseDetailRecordTimer() {
  isDetailRecordTimerPaused = true;
  document.getElementById('detail-record-timer-btns').style.display = 'none';
  document.getElementById('detail-record-timer-btns-paused').style.display = 'flex';
}

function resumeDetailRecordTimer() {
  isDetailRecordTimerPaused = false;
  document.getElementById('detail-record-timer-btns').style.display = 'flex';
  document.getElementById('detail-record-timer-btns-paused').style.display = 'none';
}

function stopDetailRecordTimer() {
  isDetailRecordTimerStopped = true;
  if (detailRecordTimerInterval) {
    clearInterval(detailRecordTimerInterval);
    detailRecordTimerInterval = null;
  }
  const minutes = Math.max(1, Math.round(detailRecordTimerSeconds / 60));
  document.getElementById('detail-record-duration').value = minutes;
  document.getElementById('detail-record-timer-btns').style.display = 'none';
  document.getElementById('detail-record-timer-btns-paused').style.display = 'none';
  showToast(`计时结束，共 ${minutes} 分钟`);
}

function clearDetailRecordTimer() {
  if (detailRecordTimerInterval) {
    clearInterval(detailRecordTimerInterval);
    detailRecordTimerInterval = null;
  }
  detailRecordTimerSeconds = 0;
  isDetailRecordTimerPaused = false;
  isDetailRecordTimerStopped = false;
  detailRecordTimerStarted = false;
}

function handleDetailRecordImageUpload(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    detailRecordUploadedImage = e.target.result;
    const preview = document.getElementById('detail-record-image-preview');
    preview.innerHTML = `<img src="${e.target.result}" style="max-width:100%;border-radius:8px;">`;
    preview.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

function saveDetailRecord() {
  const title = document.getElementById('detail-record-book-title').value.trim();
  if (!title) {
    showToast('请输入绘本名称再保存');
    document.getElementById('detail-record-book-title').focus();
    return;
  }
  if (!isDetailRecordTimerStopped && detailRecordTimerSeconds > 0) {
    const minutes = Math.max(1, Math.round(detailRecordTimerSeconds / 60));
    document.getElementById('detail-record-duration').value = minutes;
  }
  const emotions = Array.from(document.querySelectorAll('#detail-record-emotion-tags .tag-select.selected')).map(t => t.dataset.tag);
  const record = {
    id: Date.now(),
    bookTitle: title,
    date: document.getElementById('detail-record-date').value || formatDate(new Date()),
    duration: parseInt(document.getElementById('detail-record-duration').value) || 5,
    rating: detailRecordRating || 3,
    emotionTags: emotions,
    interactionHighlights: document.getElementById('detail-record-highlights').value.trim(),
    inputMethod: 'detail',
    image: detailRecordUploadedImage || null
  };
  saveRecord(record);
  resetDetailRecordForm();
  switchDetailTab('tips');
  showToast('保存成功！积分 +5');
}

function resetDetailRecordForm() {
  document.getElementById('detail-record-book-title').value = '';
  document.getElementById('detail-record-date').value = formatDate(new Date());
  document.getElementById('detail-record-duration').value = '5';
  document.getElementById('detail-record-highlights').value = '';
  setDetailRecordRating(3);
  document.querySelectorAll('#detail-record-emotion-tags .tag-select').forEach(tag => tag.classList.remove('selected'));
  document.getElementById('detail-record-image-preview').style.display = 'none';
  document.getElementById('detail-record-image-preview').innerHTML = '';
  document.getElementById('detail-record-image-upload').value = '';
  clearDetailRecordTimer();
  detailRecordUploadedImage = null;
}

// 显示评分评判标准
function showRatingCriteria(event) {
  event.stopPropagation();
  document.getElementById('criteria-title').textContent = '评分标准';
  document.getElementById('criteria-content').innerHTML = `
    <div style="font-weight:600;margin-bottom:12px;">孩子喜欢这本书吗？</div>
    <div style="margin-bottom:8px;"><strong>⭐ 很讨厌</strong> → 记录原因，以后同类型避雷</div>
    <div style="margin-bottom:8px;"><strong>⭐⭐ 不喜欢</strong> → 记录原因</div>
    <div style="margin-bottom:8px;"><strong>⭐⭐⭐ 一般</strong> → 正常</div>
    <div style="margin-bottom:8px;"><strong>⭐⭐⭐⭐ 喜欢</strong> → 记住偏好方向</div>
    <div style="margin-bottom:12px;"><strong>⭐⭐⭐⭐⭐ 非常喜欢</strong> → 核心兴趣信号，可买同系列/同作者</div>
    <div style="font-size:12px;color:#999;border-top:1px dashed #eee;padding-top:10px;">💡 注：如果没有选择评分，默认3星，以免影响孩子偏好判断</div>
  `;
  document.getElementById('criteria-modal').classList.add('show');
}

function showEngagementCriteria(event) {
  event.stopPropagation();
  document.getElementById('criteria-title').textContent = '投入程度标准';
  document.getElementById('criteria-content').innerHTML = `
    <div style="margin-bottom:10px;"><strong>非常投入</strong> → 叫不听、主动翻页、读完后还在想/聊</div>
    <div style="margin-bottom:10px;"><strong>比较投入</strong> → 专注读完、偶尔分心但能拉回来</div>
    <div style="margin-bottom:10px;"><strong>一般投入</strong> → 需要提醒才继续、边读边玩</div>
    <div><strong>不太投入</strong> → 明显不想读、敷衍翻完</div>
  `;
  document.getElementById('criteria-modal').classList.add('show');
}

function closeCriteriaModal() {
  document.getElementById('criteria-modal').classList.remove('show');
}

// 评分函数
let currentVoiceRating = 0;
function setVoiceRating(rating) {
  currentVoiceRating = rating;
  const stars = document.querySelectorAll('#voice-rating .star-item');
  stars.forEach((star, index) => {
    if (index < rating) {
      star.textContent = '★';
      star.style.color = '#FFC107';
    } else {
      star.textContent = '☆';
      star.style.color = '#ccc';
    }
  });
}

// ============ 阅读记录渲染 ============
function renderRecords() {
  const records = Storage.get('readingRecords', []);

  // 本月统计
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthRecords = records.filter(r => new Date(r.date) >= monthStart);
  const monthBooks = new Set(monthRecords.map(r => r.bookTitle)).size;
  document.getElementById('month-badge').textContent = `本月 ${monthBooks} 本`;

  renderRecordsList();
}

function filterRecords(filter) {
  currentRecordFilter = filter;
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.filter === filter);
  });
  renderRecordsList();
}

function renderRecordsList() {
  let records = Storage.get('readingRecords', []);
  const today = new Date();

  // 筛选
  if (currentRecordFilter === 'week') {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 7);
    records = records.filter(r => new Date(r.date) >= weekStart);
  } else if (currentRecordFilter === 'month') {
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    records = records.filter(r => new Date(r.date) >= monthStart);
  }

  const container = document.getElementById('records-list');

  if (records.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="emoji">📖</div>
        <div class="text">还没有阅读记录哦<br>快去和宝贝一起读一本绘本吧！</div>
      </div>
    `;
    return;
  }

  container.innerHTML = records.map(r => `
    <div class="record-item" onclick="toggleRecordDetail(${r.id})">
      <div class="record-header">
        <div class="record-book-title">${r.bookTitle}</div>
        <div class="record-date">${r.date}</div>
      </div>
      <div class="record-meta">
        <span>${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span>
        <span>⏱ ${r.duration}分钟</span>
        <span>${getInputMethodLabel(r.inputMethod)}</span>
      </div>
      <div class="book-tags">
        ${(r.emotionTags || []).map(t => `<span class="tag tag-theme">${t}</span>`).join('')}
      </div>
      <div class="record-detail" id="record-detail-${r.id}">
        <p style="margin-bottom: 8px;"><strong>互动亮点：</strong>${r.interactionHighlights || '无'}</p>
        <p style="margin-bottom: 8px;"><strong>能力标签：</strong>${(r.abilityTags || []).join('、') || '无'}</p>
        <div class="record-actions">
          <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); deleteRecord(${r.id})">删除</button>
        </div>
      </div>
    </div>
  `).join('');
}

function getInputMethodLabel(method) {
  const map = { voice: '🎤 语音', quick: '✏️ 打卡', photo: '📷 拍照' };
  return map[method] || '✏️ 打卡';
}

function toggleRecordDetail(id) {
  const el = document.getElementById(`record-detail-${id}`);
  if (el) el.classList.toggle('show');
}

let pendingDeleteId = null;

function deleteRecord(id) {
  pendingDeleteId = id;
  showConfirm('删除记录', '确定要删除这条阅读记录吗？删除后无法恢复。', (confirmed) => {
    if (confirmed) {
      let records = Storage.get('readingRecords', []);
      records = records.filter(r => r.id !== id);
      Storage.set('readingRecords', records);
      updateUserPersona();
      renderRecords();
      showToast('删除成功');
    }
  });
}

// ============ 语音录入 ============
function openVoiceRecorder() {
  document.getElementById('voice-step-1').style.display = 'block';
  document.getElementById('voice-step-2').style.display = 'none';
  document.getElementById('voice-step-3').style.display = 'none';
  document.getElementById('voice-modal').classList.add('show');
  renderRecentBooks('voice');
}

function renderRecentBooks(type) {
  const records = Storage.get('readingRecords', []);
  const containerId = type === 'voice' ? 'recent-books-list' : 'quick-recent-books-list';
  const sectionId = type === 'voice' ? 'recent-books-section' : 'quick-recent-books-section';
  const container = document.getElementById(containerId);
  const section = document.getElementById(sectionId);
  
  if (!container || !section) return;
  
  // 获取最近3本不重复的绘本
  const seen = new Set();
  const recentBooks = [];
  for (const record of records) {
    if (!seen.has(record.bookTitle)) {
      seen.add(record.bookTitle);
      recentBooks.push(record.bookTitle);
    }
    if (recentBooks.length >= 3) break;
  }
  
  if (recentBooks.length === 0) {
    section.style.display = 'none';
    return;
  }
  
  section.style.display = 'block';
  container.innerHTML = recentBooks.map((title, i) => {
    const book = bookDatabase.find(b => b.title === title);
    const emoji = book ? book.emoji : '📚';
    return `<span class="recent-book-chip" onclick="selectRecentBook('${type}', '${title.replace(/'/g, "\\'")}')" style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;background:var(--primary-bg);border-radius:16px;font-size:12px;cursor:pointer;">${emoji} ${title}</span>`;
  }).join('');
}

function selectRecentBook(type, title) {
  if (type === 'voice') {
    document.getElementById('voice-book-title').value = title;
  } else {
    document.getElementById('quick-book-title').value = title;
    // 隐藏自动联想下拉
    hideAutocomplete();
  }
}

function closeVoiceModal() {
  document.getElementById('voice-modal').classList.remove('show');
  clearVoiceTimer();
  // 恢复标题为语音录入
  document.querySelector('#voice-modal .modal-title').textContent = '🎤 语音录入';
  // 恢复第一步显示
  document.getElementById('voice-step-1').style.display = 'block';
  document.getElementById('voice-step-2').style.display = 'none';
  document.getElementById('voice-step-3').style.display = 'none';
}

function demoVoiceInput() {
  document.getElementById('voice-step-1').style.display = 'none';
  document.getElementById('voice-step-2').style.display = 'block';

  setTimeout(() => {
    document.getElementById('voice-step-2').style.display = 'none';
    document.getElementById('voice-step-3').style.display = 'block';
    document.getElementById('voice-date').value = formatDate(new Date());

    // 清空默认标签
    document.querySelectorAll('#voice-emotion-tags .tag-select').forEach(tag => {
      tag.classList.remove('selected');
    });
    document.querySelectorAll('#voice-ability-tags .tag-select').forEach(tag => {
      tag.classList.remove('selected');
    });
    // 清空亮点和评分
    document.getElementById('voice-highlights').value = '';
    setVoiceRating(3);
  }, 2000);
}

function saveVoiceRecord() {
  const title = document.getElementById('voice-book-title').value.trim();
  if (!title) {
    showToast('请输入绘本名称再保存');
    document.getElementById('voice-book-title').focus();
    return;
  }

  if (!isVoiceTimerStopped && voiceTimerSeconds > 0) {
    const minutes = Math.max(1, Math.round(voiceTimerSeconds / 60));
    document.getElementById('voice-duration').value = minutes;
  }

  const emotions = Array.from(document.querySelectorAll('#voice-emotion-tags .tag-select.selected')).map(t => t.dataset.tag);

  const record = {
    id: Date.now(),
    bookTitle: title,
    date: document.getElementById('voice-date').value || formatDate(new Date()),
    duration: parseInt(document.getElementById('voice-duration').value) || 5,
    rating: currentVoiceRating || 0,
    emotionTags: emotions,
    interactionHighlights: document.getElementById('voice-highlights').value.trim(),
    inputMethod: 'voice',
    image: voiceUploadedImage || null
  };

  saveRecord(record);
  closeVoiceModal();
}

let voiceUploadedImage = null;

// ============ 阅读计时器 ============
let timerInterval = null;
let timerSeconds = 0;
let timerBookTitle = '';
let timerBookId = null;
let isTimerPaused = false;

function startReadingTimer(bookId) {
  const book = bookDatabase.find(b => b.id === bookId);
  if (!book) return;
  
  timerBookId = bookId;
  timerBookTitle = book.title;
  timerSeconds = 0;
  isTimerPaused = false;
  
  document.getElementById('timer-book-name').textContent = `《${book.title}》`;
  updateTimerDisplay();
  
  document.getElementById('timer-buttons').style.display = 'flex';
  document.getElementById('timer-buttons-paused').style.display = 'none';
  document.getElementById('timer-modal').classList.add('show');
  
  // 启动计时器
  timerInterval = setInterval(() => {
    if (!isTimerPaused) {
      timerSeconds++;
      updateTimerDisplay();
    }
  }, 1000);
  
  // 显示悬浮计时器
  document.getElementById('reading-timer').style.display = 'block';
}

function updateTimerDisplay() {
  const mins = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
  const secs = (timerSeconds % 60).toString().padStart(2, '0');
  const timeStr = `${mins}:${secs}`;
  document.getElementById('timer-display').textContent = timeStr;
  document.getElementById('timer-big-display').textContent = timeStr;
}

function toggleTimerView() {
  document.getElementById('timer-modal').classList.add('show');
}

function pauseTimer() {
  isTimerPaused = true;
  document.getElementById('timer-buttons').style.display = 'none';
  document.getElementById('timer-buttons-paused').style.display = 'flex';
}

function resumeTimer() {
  isTimerPaused = false;
  document.getElementById('timer-buttons').style.display = 'flex';
  document.getElementById('timer-buttons-paused').style.display = 'none';
}

function finishTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  
  const minutes = Math.max(1, Math.round(timerSeconds / 60));
  document.getElementById('reading-timer').style.display = 'none';
  document.getElementById('timer-modal').classList.remove('show');
  
  // 打开记录表单并填入时长
  openQuickCheckin(timerBookTitle);
  document.getElementById('voice-duration').value = minutes;
  
  timerSeconds = 0;
  timerBookTitle = '';
  timerBookId = null;
}

function cancelTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  document.getElementById('reading-timer').style.display = 'none';
  document.getElementById('timer-modal').classList.remove('show');
  timerSeconds = 0;
  timerBookTitle = '';
  timerBookId = null;
  isTimerPaused = false;
}

function handleImageUpload(input) {
  const file = input.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    voiceUploadedImage = e.target.result;
    const preview = document.getElementById('voice-image-preview');
    preview.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;">
        <img src="${e.target.result}" style="width:60px;height:60px;border-radius:8px;object-fit:cover;">
        <div style="flex:1;">
          <div style="font-size:12px;color:var(--text-primary);">已上传图片</div>
          <div style="font-size:11px;color:var(--text-light);">${file.name}</div>
        </div>
        <button class="btn btn-outline btn-sm" onclick="clearImageUpload()" style="padding:4px 8px;font-size:11px;">删除</button>
      </div>
    `;
    preview.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

function clearImageUpload() {
  voiceUploadedImage = null;
  document.getElementById('voice-image-preview').style.display = 'none';
  document.getElementById('voice-image-preview').innerHTML = '';
  document.getElementById('voice-image-upload').value = '';
}

// ============ 快速打卡 ============
let quickRating = 3;
let quickSelectedReactions = [];

function openQuickCheckin(prefillTitle = '') {
  // 关闭快速打卡弹窗（如果有的话）
  closeQuickModal();
  
  // 打开语音录入弹窗
  document.getElementById('voice-modal').classList.add('show');
  
  // 显示第三步表单
  document.getElementById('voice-step-1').style.display = 'none';
  document.getElementById('voice-step-2').style.display = 'none';
  document.getElementById('voice-step-3').style.display = 'block';
  
  // 修改标题为快速打卡
  document.querySelector('#voice-modal .modal-title').textContent = '✏️ 快速打卡';
  
  // 渲染最近阅读
  renderRecentBooks('voice');
  
  // 设置绘本名称（如果有预填内容）
  const bookTitleInput = document.getElementById('voice-book-title');
  if (prefillTitle) {
    bookTitleInput.value = prefillTitle;
    bookTitleInput.placeholder = '';
  } else {
    bookTitleInput.value = '';
    bookTitleInput.placeholder = '输入绘本名称（必填）';
  }
  
  // 重置其他字段
  document.getElementById('voice-date').value = formatDate(new Date());
  document.getElementById('voice-duration').value = '5';
  document.getElementById('voice-highlights').value = '';
  
  // 重置评分
  setVoiceRating(3);
  
  // 清空情绪标签选中状态
  document.querySelectorAll('#voice-emotion-tags .tag-select').forEach(tag => {
    tag.classList.remove('selected');
  });
  
  // 清空能力标签选中状态
  document.querySelectorAll('#voice-ability-tags .tag-select').forEach(tag => {
    tag.classList.remove('selected');
  });
  
  startVoiceTimer();
}

function closeQuickModal() {
  // 关闭快速打卡弹窗
  const quickModal = document.getElementById('quick-modal');
  if (quickModal) {
    quickModal.classList.remove('show');
  }
}

function setQuickRating(value) {
  quickRating = value;
  document.querySelectorAll('#quick-stars .star').forEach((star, i) => {
    star.classList.toggle('active', i < value);
  });
}

function toggleQuickReaction(tagEl) {
  const tag = tagEl.dataset.tag;
  tagEl.classList.toggle('selected');
}

function toggleQuickExtra() {
  const content = document.getElementById('quick-extra');
  const toggle = document.getElementById('quick-extra-toggle');
  content.classList.toggle('show');
  toggle.textContent = content.classList.contains('show') ? '− 收起' : '+ 补充记录';
}

function handleAutocomplete(input) {
  const query = input.value.trim().toLowerCase();
  const dropdown = document.getElementById('autocomplete-dropdown');

  if (!query) {
    dropdown.classList.remove('show');
    return;
  }

  const matches = bookDatabase.filter(b =>
    b.title.toLowerCase().includes(query) ||
    b.author.toLowerCase().includes(query)
  ).slice(0, 5);

  if (matches.length === 0) {
    dropdown.classList.remove('show');
    return;
  }

  dropdown.innerHTML = matches.map(b => `
    <div class="autocomplete-item" onmousedown="selectAutocomplete('${b.title.replace(/'/g, "\\'")}')">
      ${b.emoji} <strong>${b.title}</strong> - ${b.author}
    </div>
  `).join('');
  dropdown.classList.add('show');
}

function hideAutocomplete() {
  document.getElementById('autocomplete-dropdown').classList.remove('show');
}

function selectAutocomplete(title) {
  document.getElementById('quick-book-title').value = title;
  hideAutocomplete();
}

function saveQuickRecord() {
  const title = document.getElementById('quick-book-title').value.trim();
  if (!title) {
    showToast('请输入绘本名称');
    return;
  }
  if (quickRating === 0) {
    showToast('请选择评分');
    return;
  }

  const reactions = Array.from(document.querySelectorAll('#quick-reaction-tags .tag-select.selected')).map(t => t.dataset.tag);
  const remark = document.getElementById('quick-remark').value.trim();

  // 根据书名推断能力标签
  const book = bookDatabase.find(b => b.title === title);
  let abilityTags = [];
  if (book) {
    abilityTags = Object.entries(book.abilities)
      .filter(([k, v]) => v >= 4)
      .map(([k]) => {
        const map = { language: '语言表达', science: '科学思维', art: '艺术创造', social: '社交能力', emotion: '情绪认知' };
        return map[k];
      });
  }

  const record = {
    id: Date.now(),
    bookTitle: title,
    date: formatDate(new Date()),
    duration: 15,
    rating: quickRating || 3,
    emotionTags: reactions,
    interactionHighlights: remark,
    abilityTags: abilityTags,
    inputMethod: 'quick'
  };

  saveRecord(record);
  closeQuickModal();
}

// ============ 拍照识别 ============
let photoRecognizedBook = null;

function openPhotoRecognition() {
  photoRecognizedBook = null;
  document.getElementById('photo-step-1').style.display = 'block';
  document.getElementById('photo-step-2').style.display = 'none';
  document.getElementById('photo-step-3').style.display = 'none';
  document.getElementById('photo-modal').classList.add('show');
}

function closePhotoModal() {
  document.getElementById('photo-modal').classList.remove('show');
}

function demoPhotoRecognition() {
  document.getElementById('photo-step-1').style.display = 'none';
  document.getElementById('photo-step-2').style.display = 'block';

  // 随机选一本书
  const book = bookDatabase[Math.floor(Math.random() * bookDatabase.length)];
  photoRecognizedBook = book;

  setTimeout(() => {
    document.getElementById('photo-step-2').style.display = 'none';
    document.getElementById('photo-step-3').style.display = 'block';
    document.getElementById('photo-cover').textContent = book.emoji;
    document.getElementById('photo-title').textContent = book.title;
    document.getElementById('photo-author').textContent = book.author;
  }, 2000);
}

function confirmPhotoResult() {
  closePhotoModal();
  if (photoRecognizedBook) {
    openQuickCheckin(photoRecognizedBook.title);
  }
}

// ============ 保存记录通用方法 ============
function saveRecord(record) {
  let records = Storage.get('readingRecords', []);
  const oldPersona = Storage.get('userPersona', {});

  const oldBooks = new Set(records.map(r => r.bookTitle));
  const wasNewBook = !oldBooks.has(record.bookTitle);

  const oldCategories = new Set();
  records.forEach(r => {
    const book = bookDatabase.find(b => b.title === r.bookTitle);
    if (book) oldCategories.add(book.category);
  });
  const newBook = bookDatabase.find(b => b.title === record.bookTitle);
  const wasNewCategory = newBook && !oldCategories.has(newBook.category);

  records.unshift(record);
  records.sort((a, b) => new Date(b.date) - new Date(a.date));
  Storage.set('readingRecords', records);
  updateUserPersona();

  const newPersona = Storage.get('userPersona', {});

  const pointsList = calculatePointsForRecord(record, wasNewBook, wasNewCategory);
  const milestones = checkMilestones(oldPersona, newPersona);
  const allPoints = [...pointsList, ...milestones];

  let totalPointsEarned = 0;
  allPoints.forEach(p => {
    addPoints(p.points, p.reason, record.id);
    totalPointsEarned += p.points;
  });

  const newBadges = checkBadges();
  if (newBadges.length > 0) {
    // 显示第一个徽章的庆祝动画（队列后续处理）
    showBadgeCelebration(newBadges[0]);
    const badgeNames = newBadges.map(b => b.name).join('、');
    if (totalPointsEarned > 0) {
      setTimeout(() => showToast(`🎉 解锁新徽章：${badgeNames}！获得 +${totalPointsEarned} 积分`), 500);
    } else {
      setTimeout(() => showToast(`🎉 解锁新徽章：${badgeNames}！`), 500);
    }
  } else if (totalPointsEarned > 0) {
    showToast(`✅ 已记录！获得 +${totalPointsEarned} 积分`);
  } else {
    showToast('✅ 已记录！');
  }

  // 检查每周挑战奖励
  checkWeeklyChallengeReward();

  renderRecords();
}

// ============ 成长报告渲染 ============
function renderReport() {
  const persona = Storage.get('userPersona', {});
  const records = Storage.get('readingRecords', []);
  const today = new Date();

  // 根据周期计算统计
  let periodRecords;
  if (currentReportPeriod === 'week') {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 7);
    periodRecords = records.filter(r => new Date(r.date) >= weekStart);
  } else {
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    periodRecords = records.filter(r => new Date(r.date) >= monthStart);
  }

  const periodBooks = new Set(periodRecords.map(r => r.bookTitle)).size;
  const periodMinutes = periodRecords.reduce((sum, r) => sum + (r.duration || 0), 0);

  // 显示/隐藏月度趋势图
  document.getElementById('month-trend-card').style.display = currentReportPeriod === 'month' ? 'block' : 'none';

  renderCalendar();
  renderAnalysisReport();
  renderGrowthComparison();
  renderRadarChart();
  renderAbilityProgress();
  renderSuggestions();

  // 画月度趋势图
  if (currentReportPeriod === 'month') {
    setTimeout(() => renderTrendChart(), 100);
  }
}

function switchReportPeriod(period) {
  currentReportPeriod = period;
  document.querySelectorAll('.report-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.period === period);
  });
  renderReport();
}

// ============ 成长对比 ============
function renderGrowthComparison() {
  const records = Storage.get('readingRecords', []);
  const now = new Date();
  
  // 本月数据
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthRecords = records.filter(r => {
    const d = new Date(r.date);
    return d >= thisMonthStart && d <= now;
  });
  
  // 上月数据
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const lastMonthRecords = records.filter(r => {
    const d = new Date(r.date);
    return d >= lastMonthStart && d <= lastMonthEnd;
  });
  
  // 计算各项指标
  const thisBooks = new Set(thisMonthRecords.map(r => r.bookTitle)).size;
  const lastBooks = new Set(lastMonthRecords.map(r => r.bookTitle)).size;
  const booksChange = thisBooks - lastBooks;
  
  const thisMinutes = thisMonthRecords.reduce((sum, r) => sum + (r.duration || 0), 0);
  const lastMinutes = lastMonthRecords.reduce((sum, r) => sum + (r.duration || 0), 0);
  const minutesChange = thisMinutes - lastMinutes;
  
  // 注意力（根据情绪标签判断）
  const thisFocused = thisMonthRecords.filter(r => 
    r.emotionTags && r.emotionTags.includes('主动提问')
  ).length;
  const lastFocused = lastMonthRecords.filter(r => 
    r.emotionTags && r.emotionTags.includes('主动提问')
  ).length;
  const focusedChange = thisFocused - lastFocused;
  
  // 兴趣分布（分类偏好）
  const thisCategories = {};
  const lastCategories = {};
  
  thisMonthRecords.forEach(r => {
    const book = bookDatabase.find(b => b.title === r.bookTitle);
    if (book && book.tags[0]) {
      thisCategories[book.tags[0]] = (thisCategories[book.tags[0]] || 0) + 1;
    }
  });
  
  lastMonthRecords.forEach(r => {
    const book = bookDatabase.find(b => b.title === r.bookTitle);
    if (book && book.tags[0]) {
      lastCategories[book.tags[0]] = (lastCategories[book.tags[0]] || 0) + 1;
    }
  });
  
  // 找出本月最热门分类
  const topCategory = Object.entries(thisCategories).sort((a, b) => b[1] - a[1])[0];
  const lastTopCategory = Object.entries(lastCategories).sort((a, b) => b[1] - a[1])[0];
  
  // 渲染对比内容
  const container = document.getElementById('growth-comparison-content');
  container.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
      <div style="background:var(--secondary-bg);padding:12px;border-radius:10px;">
        <div style="font-size:12px;color:var(--text-light);margin-bottom:4px;">📚 阅读量</div>
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="font-size:18px;font-weight:700;color:var(--primary);">${thisBooks}本</span>
          <span style="font-size:12px;color:${booksChange > 0 ? '#4CAF50' : booksChange < 0 ? '#f44336' : '#999'};">
            ${getChangeArrow(booksChange)} ${booksChange > 0 ? '+' + booksChange : booksChange < 0 ? booksChange : '持平'}
          </span>
        </div>
        <div style="font-size:11px;color:var(--text-light);">上月 ${lastBooks}本</div>
      </div>
      
      <div style="background:var(--secondary-bg);padding:12px;border-radius:10px;">
        <div style="font-size:12px;color:var(--text-light);margin-bottom:4px;">⏱️ 阅读时长</div>
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="font-size:18px;font-weight:700;color:var(--primary);">${thisMinutes}分钟</span>
          <span style="font-size:12px;color:${minutesChange > 0 ? '#4CAF50' : minutesChange < 0 ? '#f44336' : '#999'};">
            ${getChangeArrow(minutesChange)} ${minutesChange > 0 ? '+' + minutesChange : minutesChange < 0 ? minutesChange : '持平'}
          </span>
        </div>
        <div style="font-size:11px;color:var(--text-light);">上月 ${lastMinutes}分钟</div>
      </div>
      
      <div style="background:var(--secondary-bg);padding:12px;border-radius:10px;">
        <div style="font-size:12px;color:var(--text-light);margin-bottom:4px;">🎯 主动提问</div>
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="font-size:18px;font-weight:700;color:var(--primary);">${thisFocused}次</span>
          <span style="font-size:12px;color:${focusedChange > 0 ? '#4CAF50' : focusedChange < 0 ? '#f44336' : '#999'};">
            ${getChangeArrow(focusedChange)} ${focusedChange > 0 ? '+' + focusedChange : focusedChange < 0 ? focusedChange : '持平'}
          </span>
        </div>
        <div style="font-size:11px;color:var(--text-light);">上月 ${lastFocused}次</div>
      </div>
      
      <div style="background:var(--secondary-bg);padding:12px;border-radius:10px;">
        <div style="font-size:12px;color:var(--text-light);margin-bottom:4px;">📖 最爱分类</div>
        <div style="font-size:14px;font-weight:600;color:var(--primary);">
          ${topCategory ? topCategory[0] : '暂无'}
        </div>
        <div style="font-size:11px;color:var(--text-light);">
          ${topCategory ? `上月 ${lastTopCategory ? lastTopCategory[0] : '暂无'}` : ''}
        </div>
      </div>
    </div>
    
    <div style="margin-top:10px;padding:8px 12px;background:#FFF8E1;border-radius:8px;font-size:12px;color:#E65100;">
      ${getGrowthSummary(booksChange, minutesChange, focusedChange, thisBooks, thisMinutes, thisFocused)}
    </div>
  `;
}

function getChangeArrow(change) {
  if (change > 0) return '↑';
  if (change < 0) return '↓';
  return '→';
}

function getGrowthSummary(books, minutes, focused, totalBooks, totalMinutes, totalFocused) {
  const improvements = [];
  if (books > 0) improvements.push('阅读量增加');
  if (minutes > 0) improvements.push('阅读时长增长');
  if (focused > 0) improvements.push('注意力提升');
  
  if (improvements.length === 0) {
    return '💡 本月阅读数据与上月持平，建议尝试新绘本类型激发兴趣';
  }
  
  const avgMinutes = totalBooks > 0 ? Math.round(totalMinutes / totalBooks) : 0;
  return `🎉 本月${improvements.join('、')}！平均每本阅读${avgMinutes}分钟，继续保持～`;
}

let currentCalendarDate = new Date();

function changeCalendarMonth(delta) {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() + delta);
  renderCalendar();
}

function renderCalendar() {
  const records = Storage.get('readingRecords', []);
  const dateCounts = {};
  records.forEach(r => {
    dateCounts[r.date] = (dateCounts[r.date] || 0) + 1;
  });

  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();

  document.getElementById('calendar-month').textContent = `${year}年${month + 1}月`;

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const today = new Date();
  const todayStr = formatDate(today);

  const allCounts = Object.values(dateCounts);
  const avgCount = allCounts.length > 0 ? allCounts.reduce((a, b) => a + b, 0) / allCounts.length : 0;

  const calendarDays = [];

  for (let i = startDay - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    const dateStr = formatDate(d);
    const count = dateCounts[dateStr] || 0;
    let level = 0;
    if (count >= 4) level = 4;
    else if (count >= 3) level = 3;
    else if (count >= 2) level = 2;
    else if (count >= 1) level = 1;
    calendarDays.push({
      day: d.getDate(),
      dateStr,
      count,
      level,
      isPeak: count > avgCount * 1.5 && count >= 2,
      isToday: dateStr === todayStr,
      isOtherMonth: true
    });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i);
    const dateStr = formatDate(d);
    const count = dateCounts[dateStr] || 0;
    let level = 0;
    if (count >= 4) level = 4;
    else if (count >= 3) level = 3;
    else if (count >= 2) level = 2;
    else if (count >= 1) level = 1;
    calendarDays.push({
      day: i,
      dateStr,
      count,
      level,
      isPeak: count > avgCount * 1.5 && count >= 2,
      isToday: dateStr === todayStr,
      isOtherMonth: false
    });
  }

  const remaining = 42 - calendarDays.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    const dateStr = formatDate(d);
    const count = dateCounts[dateStr] || 0;
    let level = 0;
    if (count >= 4) level = 4;
    else if (count >= 3) level = 3;
    else if (count >= 2) level = 2;
    else if (count >= 1) level = 1;
    calendarDays.push({
      day: i,
      dateStr,
      count,
      level,
      isPeak: count > avgCount * 1.5 && count >= 2,
      isToday: dateStr === todayStr,
      isOtherMonth: true
    });
  }

  const container = document.getElementById('calendar-grid');
  container.innerHTML = calendarDays.map(d => {
    const levelClass = d.count > 0 ? `level-${d.level}` : '';
    const peakClass = d.isPeak ? 'is-peak' : '';
    const todayClass = d.isToday ? 'today' : '';
    const otherClass = d.isOtherMonth ? 'other-month' : '';
    const hasDataClass = d.count > 0 ? 'has-data' : '';
    const clickAttr = d.count > 0 ? `onclick="showDayDetail('${d.dateStr}')"` : '';
    return `<div class="calendar-day ${hasDataClass} ${levelClass} ${peakClass} ${todayClass} ${otherClass}" ${clickAttr} title="${d.dateStr} · ${d.count}本">${d.day}</div>`;
  }).join('');
}

function showDayDetail(dateStr) {
  const records = Storage.get('readingRecords', []);
  const dayRecords = records.filter(r => r.date === dateStr);
  
  if (dayRecords.length === 0) return;
  
  // 格式化日期显示
  const dateObj = new Date(dateStr);
  const displayDate = `${dateObj.getMonth() + 1}月${dateObj.getDate()}日`;
  document.getElementById('day-detail-title').textContent = `📅 ${displayDate}阅读详情`;
  
  const modal = document.getElementById('day-detail-modal');
  const content = document.getElementById('day-detail-content');
  
  content.innerHTML = dayRecords.map(r => {
    const book = bookDatabase.find(b => b.title === r.bookTitle);
    const emoji = book ? book.emoji : '📚';
    const rating = r.rating ? '⭐'.repeat(r.rating) : '';
    return `
      <div class="day-record-item" style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);">
        <div style="font-size:28px;">${emoji}</div>
        <div style="flex:1;">
          <div style="font-weight:600;font-size:14px;">${r.bookTitle}</div>
          <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">
            ${r.duration || 5}分钟 ${rating}
          </div>
          ${r.interactionHighlights ? `<div style="font-size:12px;color:var(--text-light);margin-top:4px;line-height:1.4;">${r.interactionHighlights.substring(0, 50)}${r.interactionHighlights.length > 50 ? '...' : ''}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');
  
  modal.classList.add('show');
}

function closeDayDetailModal() {
  document.getElementById('day-detail-modal').classList.remove('show');
}

// 雷达图
function renderRadarChart() {
  const canvas = document.getElementById('radar-chart');
  const ctx = canvas.getContext('2d');
  const persona = Storage.get('userPersona', {});
  const records = Storage.get('readingRecords', []);

  // 6个维度的兴趣数据
  const dimensions = ['动物', '交通工具', '公主', '恐龙', '科普', '情绪认知'];
  const data = dimensions.map(dim => {
    let count = 0;
    records.forEach(r => {
      const title = r.bookTitle;
      if (dim === '动物' && (title.includes('熊') || title.includes('兔') || title.includes('鸭') || title.includes('鱼') || title.includes('鳄鱼') || title.includes('恐龙'))) count++;
      if (dim === '交通工具' && (title.includes('车') || title.includes('船') || title.includes('飞机'))) count++;
      if (dim === '公主' && (title.includes('公主') || title.includes('女'))) count++;
      if (dim === '恐龙' && (title.includes('恐龙') || title.includes('你看起来好像很好吃'))) count += 2;
      if (dim === '科普' && (title.includes('种子') || title.includes('苹果') || title.includes('毛毛虫') || title.includes('蟋蟀') || title.includes('百草园'))) count++;
      if (dim === '情绪认知' && (title.includes('情绪') || title.includes('生气'))) count++;
    });
    return count;
  });

  const maxVal = Math.max(...data, 1);
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.min(centerX, centerY) - 40;
  const levels = 5;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 绘制背景网格
  ctx.strokeStyle = '#F0E6D8';
  ctx.lineWidth = 1;
  for (let i = 1; i <= levels; i++) {
    const r = radius * i / levels;
    ctx.beginPath();
    for (let j = 0; j < dimensions.length; j++) {
      const angle = (Math.PI * 2 * j / dimensions.length) - Math.PI / 2;
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      if (j === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  // 绘制轴线
  for (let j = 0; j < dimensions.length; j++) {
    const angle = (Math.PI * 2 * j / dimensions.length) - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  // 绘制数据区域
  ctx.beginPath();
  for (let j = 0; j < dimensions.length; j++) {
    const angle = (Math.PI * 2 * j / dimensions.length) - Math.PI / 2;
    const val = data[j] / maxVal;
    const r = radius * val;
    const x = centerX + r * Math.cos(angle);
    const y = centerY + r * Math.sin(angle);
    if (j === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(255, 140, 66, 0.3)';
  ctx.fill();
  ctx.strokeStyle = '#FF8C42';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 绘制数据点
  for (let j = 0; j < dimensions.length; j++) {
    const angle = (Math.PI * 2 * j / dimensions.length) - Math.PI / 2;
    const val = data[j] / maxVal;
    const r = radius * val;
    const x = centerX + r * Math.cos(angle);
    const y = centerY + r * Math.sin(angle);
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#FF8C42';
    ctx.fill();
  }

  // 绘制标签
  ctx.fillStyle = '#666';
  ctx.font = '12px -apple-system, "PingFang SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let j = 0; j < dimensions.length; j++) {
    const angle = (Math.PI * 2 * j / dimensions.length) - Math.PI / 2;
    const labelRadius = radius + 22;
    const x = centerX + labelRadius * Math.cos(angle);
    const y = centerY + labelRadius * Math.sin(angle);
    ctx.fillText(dimensions[j], x, y);
  }
}

// 月度趋势折线图
function renderTrendChart() {
  const canvas = document.getElementById('trend-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const records = Storage.get('readingRecords', []);
  const today = new Date();

  // 统计最近30天每天的阅读量
  const dailyData = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = formatDate(d);
    const count = records.filter(r => r.date === dateStr).length;
    dailyData.push({ date: d, count, day: d.getDate() });
  }

  const padding = { top: 20, right: 15, bottom: 25, left: 25 };
  const chartW = canvas.width - padding.left - padding.right;
  const chartH = canvas.height - padding.top - padding.bottom;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const maxVal = Math.max(...dailyData.map(d => d.count), 1);

  // 网格线
  ctx.strokeStyle = '#F0E6D8';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + chartH * i / 4;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + chartW, y);
    ctx.stroke();

    ctx.fillStyle = '#999';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(Math.round(maxVal * (4 - i) / 4), padding.left - 5, y);
  }

  // 折线
  ctx.beginPath();
  ctx.strokeStyle = '#FF8C42';
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  dailyData.forEach((d, i) => {
    const x = padding.left + chartW * i / (dailyData.length - 1);
    const y = padding.top + chartH * (1 - d.count / maxVal);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // 填充区域
  ctx.lineTo(padding.left + chartW, padding.top + chartH);
  ctx.lineTo(padding.left, padding.top + chartH);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255, 140, 66, 0.15)';
  ctx.fill();

  // 数据点
  dailyData.forEach((d, i) => {
    const x = padding.left + chartW * i / (dailyData.length - 1);
    const y = padding.top + chartH * (1 - d.count / maxVal);
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#FF8C42';
    ctx.fill();
  });

  // X轴标签（每隔5天）
  ctx.fillStyle = '#999';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (let i = 0; i < dailyData.length; i += 5) {
    const x = padding.left + chartW * i / (dailyData.length - 1);
    ctx.fillText(dailyData[i].day + '日', x, padding.top + chartH + 5);
  }
}

// 能力发展进度
function renderAbilityProgress() {
  const persona = Storage.get('userPersona', {});
  const abilities = [
    { key: 'language', name: '语言', icon: '🗣️' },
    { key: 'social', name: '社会', icon: '🤝' },
    { key: 'science', name: '科学', icon: '🔬' },
    { key: 'health', name: '健康', icon: '💪' },
    { key: 'art', name: '艺术', icon: '🎨' }
  ];

  const abilityData = {
    language: 75,
    social: 55,
    science: 65,
    health: 50,
    art: 60
  };

  // 根据阅读记录调整
  const counts = persona.abilityCounts || {};
  const maxCount = Math.max(...Object.values(counts), 1);
  if (counts['语言表达']) abilityData.language = Math.min(95, 50 + counts['语言表达'] * 5);
  if (counts['社交能力']) abilityData.social = Math.min(95, 50 + counts['社交能力'] * 5);
  if (counts['自然认知'] || counts['科学思维']) abilityData.science = Math.min(95, 50 + (counts['自然认知'] || 0 + counts['科学思维'] || 0) * 4);
  if (counts['情绪认知']) abilityData.health = Math.min(95, 50 + counts['情绪认知'] * 5);

  const strongAbilities = persona.strongAbilities || [];
  const weakAbilities = persona.weakAbilities || [];

  const container = document.getElementById('ability-progress-list');
  container.innerHTML = abilities.map(ab => {
    const val = Math.round(abilityData[ab.key]);
    const abilityNameMap = { language: '语言表达', social: '社交能力', science: '科学思维', health: '情绪健康', art: '艺术创造' };
    const fullName = abilityNameMap[ab.key];
    let tagClass = '';
    let tagText = '';

    if (strongAbilities.some(s => fullName.includes(s) || s.includes(fullName))) {
      tagClass = 'strong';
      tagText = '<span class="ability-tag strong">优势</span>';
    } else if (weakAbilities.some(w => fullName.includes(w) || w.includes(fullName))) {
      tagClass = 'weak';
      tagText = '<span class="ability-tag weak">待提升</span>';
    }

    return `
      <div class="ability-progress">
        <div class="ability-progress-header">
          <span class="ability-progress-name">${ab.icon} ${ab.name} ${tagText}</span>
          <span class="ability-progress-value">${val}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill ${tagClass}" style="width: ${val}%;"></div>
        </div>
      </div>
    `;
  }).join('');
}

// ============ 周/月分析报告 ============
function getPeriodRecords(period) {
  const records = Storage.get('readingRecords', []);
  const today = new Date();
  const startDate = new Date(today);

  if (period === 'week') {
    startDate.setDate(today.getDate() - 6);
  } else {
    startDate.setDate(1);
  }

  const startStr = formatDate(startDate);
  return records.filter(r => r.date >= startStr);
}

function analyzeAttention(highlights) {
  let fullFocus = 0;
  let mostFocus = 0;
  let fluctuated = 0;
  let lowFocus = 0;

  highlights.forEach(h => {
    if (h.includes('超投入') || h.includes('非常投入') || h.includes('全程')) fullFocus++;
    else if (h.includes('不太投入') || h.includes('明显不想') || h.includes('敷衍')) lowFocus++;
    else if (h.includes('很投入') || h.includes('比较投入') || h.includes('注意力很好')) mostFocus++;
    else if (h.includes('不太') || h.includes('分心') || h.includes('波动') || h.includes('时好时坏')) fluctuated++;
    else mostFocus++;
  });

  return { fullFocus, mostFocus, fluctuated, lowFocus, total: highlights.length };
}

function findHighlights(records, count = 3) {
  const highlightTemplates = [
    {
      what: '孩子主动提问的次数增加了',
      meaning: '这说明孩子的好奇心和思考能力在发展，开始对故事内容产生自己的疑问。'
    },
    {
      what: '出现了"互动片段"式的深度参与',
      meaning: '从被动听故事到主动参与角色扮演/游戏，是阅读参与度提升的重要信号。'
    },
    {
      what: '认字问字的行为越来越多',
      meaning: '文字意识开始萌芽——孩子发现书上的符号和说话有关系，这是阅读准备的起点。'
    },
    {
      what: '能预测故事情节的发展',
      meaning: '说明孩子开始理解故事逻辑，不是只看单张图，而是能串联起前后内容了。'
    },
    {
      what: '会用自己的话复述片段',
      meaning: '语言表达和记忆能力都在发展，能把听到的内容内化为自己的语言。'
    },
    {
      what: '把故事和自己的生活联系起来',
      meaning: '这是高级思维能力的体现——孩子开始把书本知识迁移到真实生活中。'
    },
    {
      what: '注意力持续时间变长了',
      meaning: '专注力是可以锻炼的，持续的亲子共读正在帮助孩子延长注意力周期。'
    },
    {
      what: '主动要求读同一本书',
      meaning: '重复阅读是这个年龄段很正常的学习方式，孩子在用"反复"来消化和巩固理解。'
    }
  ];

  const shuffled = highlightTemplates.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function generateAnalysisReport(period) {
  const records = getPeriodRecords(period);
  const profile = Storage.get('childProfile', {});
  const nickname = profile.nickname || '宝贝';
  const ageRange = profile.ageRange || '4-5';

  if (records.length === 0) {
    return `
      <div class="analysis-section">
        <div class="analysis-section-title">📊 数据总览</div>
        <div style="font-size:13px;color:var(--text-secondary);text-align:center;padding:20px 0;">
          暂无${period === 'week' ? '本周' : '本月'}阅读记录
        </div>
      </div>
    `;
  }

  const totalDays = new Set(records.map(r => r.date)).size;
  const totalBooks = new Set(records.map(r => r.bookTitle)).size;
  const totalMinutes = records.reduce((sum, r) => sum + (r.duration || 0), 0);
  const highlights = records.map(r => r.interactionHighlights || '');
  const attention = analyzeAttention(highlights);
  const topHighlights = findHighlights(records, Math.min(3, records.length));

  let html = '';

  html += `
    <div class="analysis-section">
      <div class="analysis-section-title">📊 ${period === 'week' ? '本周' : '本月'}数据总览</div>
      <div class="analysis-data-row"><span>共读天数</span><span style="font-weight:600;color:var(--primary);">${totalDays} 天</span></div>
      <div class="analysis-data-row"><span>绘本数量</span><span style="font-weight:600;color:var(--primary);">${totalBooks} 本</span></div>
      <div class="analysis-data-row"><span>总时长</span><span style="font-weight:600;color:var(--primary);">约 ${totalMinutes} 分钟</span></div>
      <div class="analysis-data-row"><span>阅读投入程度</span>
        <span>
          <span class="analysis-tag green">非常投入${attention.fullFocus}次</span>
          <span class="analysis-tag orange">比较投入${attention.mostFocus}次</span>
          <span class="analysis-tag purple">一般投入${attention.fluctuated}次</span>
          <span class="analysis-tag red">不太投入${attention.lowFocus}次</span>
        </span>
      </div>
    </div>
  `;

  html += `<div class="analysis-section"><div class="analysis-section-title">⭐ ${Math.min(3, records.length)}个亮点</div>`;
  topHighlights.forEach(h => {
    html += `
      <div class="analysis-highlight">
        <div class="what">✓ ${h.what}</div>
        <div class="meaning">💡 ${h.meaning}</div>
      </div>
    `;
  });
  html += `</div>`;

  const bookCounts = {};
  records.forEach(r => {
    bookCounts[r.bookTitle] = (bookCounts[r.bookTitle] || 0) + 1;
  });
  const topBook = Object.entries(bookCounts).sort((a, b) => b[1] - a[1])[0];
  const hasRepetitiveReading = topBook && topBook[1] >= 2;

  const interestPattern = records.some(r =>
    r.interactionHighlights && r.interactionHighlights.includes('互动片段')
  );

  html += `<div class="analysis-section"><div class="analysis-section-title">🔍 核心发现</div>`;

  if (records.length < 3 && period === 'week') {
    html += `
      <div class="analysis-finding">
        📝 本周记录较少（${records.length}天），数据不够做趋势判断。继续坚持记录，下周就能看到更清晰的发展规律啦～
      </div>
    `;
  } else {
    let findingText = '';
    if (hasRepetitiveReading) {
      findingText = `${nickname}对《${topBook[0]}》特别感兴趣，读了${topBook[1]}次。<br><br>💡 这是深度阅读的信号，不是"喜新厌旧"有问题。这个年龄段的孩子会通过反复阅读来消化和巩固理解，就像大人反复听一首歌一样。每次重读，孩子都会发现新的细节。<br><br>👉 待继续观察：这种深度阅读会持续多久？是否会自然过渡到新书？`;
    } else if (interestPattern) {
      findingText = `${nickname}的阅读参与度很高，多本绘本都出现了"互动片段"式的深度参与（角色扮演、游戏化阅读等）。<br><br>💡 这说明孩子已经不满足于"听"，而是想要"玩"故事。这是从被动接受到主动参与的重要转变，想象力和创造力都在发展。<br><br>👉 可以多提供能让孩子参与进来的互动类绘本。`;
    } else {
      findingText = `${nickname}的阅读兴趣比较广泛，${totalBooks}本书涉及不同主题。<br><br>💡 广泛接触不同类型的绘本对开阔视野很有帮助。同时注意观察：有没有哪一类书让${nickname}明显更投入、互动更多？<br><br>👉 待继续观察：兴趣点是否会逐渐集中？`;
    }
    html += `<div class="analysis-finding">${findingText}</div>`;
  }
  html += `</div>`;

  html += `<div class="analysis-section"><div class="analysis-section-title">💡 ${period === 'week' ? '下周' : '下月'}建议</div>`;

  const suggestions = [];

  if (attention.fluctuated > attention.fullFocus) {
    suggestions.push({
      type: '给孩子的发展支持',
      text: `观察到${nickname}注意力时有波动，可以试试用"分段读"的方式——每读2-3页就停下来聊一聊，因为这个年龄段孩子的注意力大约是${ageRange === '3-4' ? '8-12' : ageRange === '4-5' ? '12-18' : '15-25'}分钟，超过了就需要中场休息。`
    });
  } else {
    suggestions.push({
      type: '给孩子的发展支持',
      text: `观察到${nickname}${attention.fullFocus}次全程投入，注意力基础很好，可以试试在阅读后留一个小问题让孩子思考，比如"你觉得接下来会发生什么"，慢慢锻炼预测和推理能力。`
    });
  }

  const questionPattern = records.some(r =>
    r.interactionHighlights && (r.interactionHighlights.includes('问') || r.interactionHighlights.includes('提问'))
  );

  if (questionPattern) {
    suggestions.push({
      type: '给父母的互动优化',
      text: '当孩子问"为什么"时，试试先反问"你觉得呢"，而不是直接给答案。这样能引导孩子自己思考，而不是被动接收信息。'
    });
  } else {
    suggestions.push({
      type: '给父母的互动优化',
      text: '当读到有趣的画面时，试试停下来问"你看到了什么"，而不是继续往下读。给孩子留出表达的空间，哪怕只说一两个词也好。'
    });
  }

  suggestions.forEach(s => {
    html += `
      <div class="analysis-suggestion">
        <div class="type">${s.type}</div>
        <div>${s.text}</div>
      </div>
    `;
  });

  html += `</div>`;

  html += `
    <div class="analysis-section">
      <div class="analysis-section-title">📚 选书参考</div>
      <div class="analysis-book-ref">
        基于${nickname}${hasRepetitiveReading ? `对《${topBook[0]}》的深度兴趣` : '广泛的阅读偏好'}和${ageRange}岁的发展阶段，建议试试：<br>
        <span class="analysis-tag orange">互动类绘本</span>
        <span class="analysis-tag green">预测类绘本</span>
        <span class="analysis-tag blue">翻翻/立体书</span>
      </div>
    </div>
  `;

  return html;
}

let aiAnalysisLoading = false;

function renderAnalysisReport() {
  const container = document.getElementById('analysis-report');
  const titleEl = document.getElementById('analysis-report-title');
  titleEl.textContent = currentReportPeriod === 'week' ? '📝 周分析报告' : '📝 月分析报告';
  
  container.innerHTML = generateAnalysisReport(currentReportPeriod);
  
  aiAnalysisLoading = true;
  const records = Storage.get('readingRecords', []);
  const profile = Storage.get('childProfile', {});
  
  setTimeout(async () => {
    if (!aiAnalysisLoading) return;
    
    const aiAnalysis = await kimiAnalyzeReading(records, profile);
    if (aiAnalysis && aiAnalysisLoading) {
      const dataSection = container.querySelector('.analysis-section');
      if (dataSection) {
        const aiSection = document.createElement('div');
        aiSection.className = 'analysis-section';
        aiSection.innerHTML = `
          <div class="analysis-section-title">✨ AI智能解读</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            <div style="background:linear-gradient(135deg,#FFF3E0,#FFE0B2);padding:10px 12px;border-radius:8px;">
              <div style="font-size:12px;color:#E65100;font-weight:600;margin-bottom:4px;">📚 阅读偏好</div>
              <div style="font-size:12px;line-height:1.5;color:#5D4037;">${aiAnalysis.preference || ''}</div>
            </div>
            <div style="background:linear-gradient(135deg,#E8F5E9,#C8E6C9);padding:10px 12px;border-radius:8px;">
              <div style="font-size:12px;color:#2E7D32;font-weight:600;margin-bottom:4px;">🌟 能力发展</div>
              <div style="font-size:12px;line-height:1.5;color:#1B5E20;">${aiAnalysis.ability || ''}</div>
            </div>
            <div style="background:linear-gradient(135deg,#E3F2FD,#BBDEFB);padding:10px 12px;border-radius:8px;">
              <div style="font-size:12px;color:#1565C0;font-weight:600;margin-bottom:4px;">💡 阅读建议</div>
              <div style="font-size:12px;line-height:1.5;color:#0D47A1;">${aiAnalysis.suggestion || ''}</div>
            </div>
            <div style="background:linear-gradient(135deg,#FCE4EC,#F8BBD0);padding:10px 12px;border-radius:8px;">
              <div style="font-size:12px;color:#C2185B;font-weight:600;margin-bottom:4px;">🚀 拓展推荐</div>
              <div style="font-size:12px;line-height:1.5;color:#880E4F;">${aiAnalysis.expand || ''}</div>
            </div>
          </div>
        `;
        dataSection.after(aiSection);
      }
    }
    aiAnalysisLoading = false;
  }, 500);
}

// AI 阅读建议
function renderSuggestions() {
  const persona = Storage.get('userPersona', {});
  const suggestions = [];
  const profile = Storage.get('childProfile', {});
  const nickname = profile.nickname || '宝贝';

  // 兴趣相关建议
  const topInterest = Object.entries(persona.interestProfile || {})
    .sort((a, b) => b[1] - a[1])[0];

  if (topInterest) {
    const interest = topInterest[0];
    let nextTopic = '太空探索';
    if (interest === '恐龙') nextTopic = '古生物';
    if (interest === '动物') nextTopic = '海洋生物';
    if (interest === '自然') nextTopic = '四季变化';
    if (interest === '情绪认知') nextTopic = '社交礼仪';
    if (interest === '亲情') nextTopic = '友情';

    suggestions.push({
      icon: '🌟',
      text: `这个月${nickname}最爱的主题是${interest}，建议接下来尝试${nextTopic}类绘本拓展视野`,
      category: 'science'
    });
  }

  // 薄弱项建议
  (persona.weakAbilities || []).forEach(weak => {
    let book = '《我的情绪小怪兽》';
    let cat = 'emotion';
    if (weak.includes('社交')) { book = '《彩虹鱼》'; cat = 'social'; }
    if (weak.includes('科学')) { book = '《小种子》'; cat = 'science'; }
    if (weak.includes('语言')) { book = '《棕色的熊》'; cat = 'language'; }

    suggestions.push({
      icon: '💡',
      text: `${nickname}在${weak}方面阅读较少，推荐尝试${book}系列`,
      category: cat
    });
  });

  // 阅读习惯建议
  if (persona.streakDays < 3) {
    suggestions.push({
      icon: '⏰',
      text: '建议每天固定时间读绘本，比如睡前15分钟，帮助孩子养成阅读习惯',
      category: 'today'
    });
  }

  // 适龄建议
  suggestions.push({
    icon: '📈',
    text: `根据${nickname}的阅读水平，接下来可以尝试文字稍多的故事绘本，提升理解能力`,
    category: 'language'
  });

  const container = document.getElementById('suggestion-list');
  container.innerHTML = suggestions.slice(0, 5).map(s => `
    <div class="suggestion-card">
      <div class="text"><span class="icon">${s.icon}</span>${s.text}</div>
      <div class="action" onclick="goToCategory('${s.category}')">→ 查看推荐绘本</div>
    </div>
  `).join('');
}

function goToCategory(categoryId) {
  currentCategory = categoryId;
  switchPage('home');
}

// ============ 宝贝档案渲染 ============
let aiPersonaLoading = false;

function renderProfile() {
  const profile = Storage.get('childProfile', {});
  const persona = Storage.get('userPersona', {});

  // 头像和昵称
  document.getElementById('profile-avatar').textContent = profile.avatar || '🧒';
  document.getElementById('profile-nickname').textContent = profile.nickname || '宝贝';
  document.getElementById('profile-age-tag').textContent = (profile.ageRange || '3-4') + '岁';
  document.getElementById('profile-gender-tag').textContent = profile.gender === 'girl' ? '女孩' : '男孩';

  // 年龄段选择
  document.querySelectorAll('#age-select .tag-select').forEach(tag => {
    tag.classList.toggle('selected', tag.dataset.age === profile.ageRange);
    tag.onclick = () => updateAge(tag.dataset.age);
  });

  // 性别选择
  document.querySelectorAll('#gender-select .tag-select').forEach(tag => {
    tag.classList.toggle('selected', tag.dataset.gender === profile.gender);
    tag.onclick = () => updateGender(tag.dataset.gender);
  });

  // 兴趣标签
  const interests = profile.interests || [];
  const interestContainer = document.getElementById('interest-tags');
  interestContainer.innerHTML = interestTags.map(tag => `
    <span class="tag-select ${interests.includes(tag) ? 'selected' : ''}" onclick="toggleInterest('${tag}')">${tag}</span>
  `).join('');

  // AI 推断标签
  const aiContainer = document.getElementById('ai-tags');
  const aiTags = [];
  const interestProfile = persona.interestProfile || {};
  const sortedInterests = Object.entries(interestProfile).sort((a, b) => b[1] - a[1]);
  if (sortedInterests.length > 0) {
    aiTags.push(`${sortedInterests[0][0]}爱好者`);
  }
  if (persona.totalBooks >= 20) aiTags.push('小书虫');
  if (persona.streakDays >= 7) aiTags.push('阅读小达人');
  if ((persona.strongAbilities || []).length > 0) aiTags.push(`${persona.strongAbilities[0]}小能手`);

  aiContainer.innerHTML = aiTags.map(tag => `
    <span class="tag-select ai-tag">${tag}</span>
  `).join('') || '<span style="font-size:12px;color:var(--text-light);">暂无推断标签，多读绘本后更新</span>';

  // AI 画像智能分析（延迟加载）
  setTimeout(() => {
    loadAIPersonaAnalysis(profile, persona);
  }, 1500);

  // 阅读水平
  const level = persona.readingLevel || 'beginner';
  const levelMap = { beginner: 0, growing: 1, advanced: 2 };
  const levelIndex = levelMap[level];
  const progress = persona.levelProgress || 30;

  document.querySelectorAll('.level-stage').forEach((el, i) => {
    el.classList.toggle('active', i <= levelIndex);
  });

  const fill = document.getElementById('level-progress-fill');
  const marker = document.getElementById('level-progress-marker');
  fill.style.width = progress + '%';
  marker.style.left = progress + '%';

  const levelDescs = {
    beginner: '宝贝正处于入门期，适合图多字少的认知类绘本',
    growing: '宝贝正处于成长期，图文并重的故事绘本最适合啦',
    advanced: '宝贝已经进入进阶期，可以尝试有情节的短篇故事'
  };
  document.getElementById('level-desc').textContent = levelDescs[level] || levelDescs.beginner;

  // 薄弱能力识别
  renderWeakAbilities();

  // 宝贝阅读名片
  renderPersonaCard();

  // 积分和徽章
  renderPointsBadges();

  // 阅读目标
  updateReadingGoalDisplay();

  // 每周挑战
  updateWeeklyChallengeDisplay();
}

// AI 画像智能分析
async function loadAIPersonaAnalysis(profile, persona) {
  if (aiPersonaLoading) return;
  aiPersonaLoading = true;
  
  const records = Storage.get('readingRecords', []);
  
  // 只在有足够阅读记录时才调用AI
  if (records.length < 10) {
    aiPersonaLoading = false;
    return;
  }
  
  const recentBooks = records.slice(0, 10).map(r => r.bookTitle).join('、');
  const ageInfo = profile.ageRange || '3-4岁';
  const interests = persona.interests?.slice(0, 3).join('、') || '阅读';
  const strongAbilities = persona.strongAbilities?.slice(0, 2).join('、') || '综合能力';
  const weakAbilities = persona.weakAbilities?.slice(0, 2).join('、') || '需全面发展';
  
  const messages = [
    {
      role: 'system',
      content: `你是"童书伴读"的儿童阅读专家，根据孩子的阅读数据生成个性化画像分析。要求：
1. 分析孩子的阅读特点、兴趣偏好、能力发展
2. 给出具体的阅读建议和推荐方向
3. 语言温暖有洞察力，像教育顾问一样
4. 控制在150字以内
5. 要有数据支撑，不要空泛`
    },
    {
      role: 'user',
      content: `孩子信息：
- 年龄：${ageInfo}
- 已读书数：${persona.totalBooks || 0}本
- 总阅读时长：${persona.totalMinutes || 0}分钟
- 连续阅读天数：${persona.streakDays || 0}天
- 兴趣偏好：${interests}
- 能力优势：${strongAbilities}
- 需要加强：${weakAbilities}
- 最近阅读：${recentBooks}

请生成一份个性化的阅读画像分析，包括：
1. 孩子是什么类型的读者
2. 阅读特点分析
3. 成长建议
4. 推荐阅读方向`
    }
  ];
  
  const analysis = await callKimiAPI(messages, 0.5);
  
  if (analysis) {
    // 在兴趣偏好卡片上方添加AI分析模块
    const interestCard = document.querySelector('.card:nth-child(2)'); // 第二个卡片是兴趣偏好
    if (interestCard && !interestCard.querySelector('.ai-persona-analysis')) {
      const analysisDiv = document.createElement('div');
      analysisDiv.className = 'ai-persona-analysis';
      analysisDiv.style.cssText = 'background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); padding: 12px; border-radius: 10px; margin-bottom: 12px; font-size: 13px; line-height: 1.7;';
      analysisDiv.innerHTML = `<div style="color: var(--primary); font-weight: 600; margin-bottom: 8px;">✨ AI画像智能分析</div>${analysis}`;
      interestCard.insertBefore(analysisDiv, interestCard.firstChild);
    }
  }
  
  aiPersonaLoading = false;
}

function renderPersonaCard() {
  const persona = Storage.get('userPersona', {});
  const records = Storage.get('readingRecords', []);
  const profile = Storage.get('childProfile', {});

  document.getElementById('persona-total-books').textContent = persona.totalBooks || 0;
  document.getElementById('persona-total-minutes').textContent = persona.totalMinutes || 0;
  document.getElementById('persona-streak').textContent = persona.streakDays || 0;

  const level = persona.readingLevel || 'beginner';
  const badgeEl = document.getElementById('persona-badge');
  const levelMap = {
    beginner: { icon: '🌱', name: '阅读小萌芽' },
    growing: { icon: '🌿', name: '阅读小达人' },
    advanced: { icon: '🌳', name: '阅读小博士' }
  };
  const levelInfo = levelMap[level] || levelMap.beginner;
  badgeEl.querySelector('.badge-icon').textContent = levelInfo.icon;
  badgeEl.querySelector('.badge-level').textContent = levelInfo.name;

  const interestProfile = persona.interestProfile || {};
  const interests = Object.entries(interestProfile)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const interestsContainer = document.getElementById('persona-top-interests');
  if (interests.length === 0) {
    interestsContainer.innerHTML = '<div style="font-size:12px;color:var(--text-light);">多读几本就能发现兴趣啦~</div>';
  } else {
    interestsContainer.innerHTML = interests.map((item, index) => `
      <div class="top-interest-item rank-${index + 1}">
        <span class="interest-rank">${index + 1}</span>
        <span>${item[0]}</span>
      </div>
    `).join('');
  }

  const abilityCounts = persona.abilityCounts || {};
  const strongAbilities = persona.strongAbilities || [];
  const abilityIcons = {
    '语言表达': '🗣️',
    '自然认知': '🌿',
    '科学思维': '🔬',
    '艺术创造': '🎨',
    '精细动作': '✋',
    '情绪认知': '😊',
    '社交能力': '🤝'
  };

  const abilitiesContainer = document.getElementById('persona-ability-badges');
  const sortedAbilities = Object.entries(abilityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  if (sortedAbilities.length === 0) {
    abilitiesContainer.innerHTML = '<div style="font-size:12px;color:var(--text-light);">继续阅读解锁能力徽章~</div>';
  } else {
    abilitiesContainer.innerHTML = sortedAbilities.map(item => {
      const isStrong = strongAbilities.includes(item[0]);
      return `
        <div class="ability-badge-item ${isStrong ? 'strong' : ''}">
          <div class="ability-badge-icon">${abilityIcons[item[0]] || '⭐'}</div>
          <div class="ability-badge-name">${item[0]}</div>
        </div>
      `;
    }).join('');
  }

  const traits = generatePersonaTraits(persona, records, profile);
  document.getElementById('trait-1').querySelector('.trait-text').textContent = traits[0] || '继续阅读发现更多特质~';
  document.getElementById('trait-2').querySelector('.trait-text').textContent = traits[1] || '多读几本解锁更多洞察~';
  document.getElementById('trait-3').querySelector('.trait-text').textContent = traits[2] || '每一次共读都是成长的印记~';
}

function generatePersonaTraits(persona, records, profile) {
  const traits = [];
  const interestProfile = persona.interestProfile || {};
  const emotionCounts = persona.emotionCounts || {};
  const strongAbilities = persona.strongAbilities || [];
  const weakAbilities = persona.weakAbilities || [];
  const totalRecords = persona.recordCount || 0;

  if (totalRecords === 0) {
    return [];
  }

  const topInterest = Object.entries(interestProfile).sort((a, b) => b[1] - a[1])[0];
  if (topInterest) {
    traits.push(`对「${topInterest[0]}」主题特别感兴趣，是个小专家哦~`);
  }

  const likeCount = emotionCounts['很喜欢'] || emotionCounts['要求再读'] || 0;
  if (likeCount > totalRecords * 0.5) {
    traits.push('是个热情的小书虫，大部分绘本都超喜欢！');
  }

  if ((emotionCounts['主动提问'] || 0) > totalRecords * 0.3) {
    traits.push('好奇心旺盛，经常主动提问，是个爱思考的宝贝~');
  }

  if (strongAbilities.length > 0) {
    traits.push(`在${strongAbilities.slice(0, 2).join('、')}方面表现突出，继续保持！`);
  }

  if (persona.streakDays >= 7) {
    traits.push(`已经连续阅读${persona.streakDays}天啦，坚持力棒棒的！`);
  }

  if ((emotionCounts['读到一半分心'] || 0) > totalRecords * 0.4) {
    traits.push('注意力正在发展中，可以试试分段阅读，每次短一点~');
  }

  if (weakAbilities.length > 0) {
    traits.push(`在${weakAbilities[0]}方面可以多练习，选对应的绘本玩着学~`);
  }

  if (persona.totalBooks >= 10) {
    traits.push(`已经读过${persona.totalBooks}本书啦，阅读量超赞！`);
  }

  while (traits.length < 3) {
    traits.push('每一次共读都在帮助宝贝成长~');
  }

  return traits.slice(0, 3);
}

// ==================== 积分和徽章系统 ====================

const badgeDefinitions = [
  { id: 'first_read', name: '初入书海', icon: '📖', desc: '完成第1次阅读记录', category: 'reading', condition: { type: 'totalRecords', value: 1 } },
  { id: 'read_10', name: '阅读小能手', icon: '📚', desc: '累计阅读10本绘本', category: 'reading', condition: { type: 'totalBooks', value: 10 } },
  { id: 'read_30', name: '阅读达人', icon: '🏆', desc: '累计阅读30本绘本', category: 'reading', condition: { type: 'totalBooks', value: 30 } },
  { id: 'read_50', name: '阅读大师', icon: '👑', desc: '累计阅读50本绘本', category: 'reading', condition: { type: 'totalBooks', value: 50 } },
  { id: 'streak_3', name: '三天坚持', icon: '🔥', desc: '连续打卡3天', category: 'streak', condition: { type: 'streak', value: 3 } },
  { id: 'streak_7', name: '坚持不懈', icon: '💪', desc: '连续打卡7天', category: 'streak', condition: { type: 'streak', value: 7 } },
  { id: 'streak_30', name: '月度之星', icon: '🌟', desc: '连续打卡30天', category: 'streak', condition: { type: 'streak', value: 30 } },
  { id: 'diverse_3', name: '小小探索家', icon: '🌈', desc: '阅读3个不同分类', category: 'diverse', condition: { type: 'categories', value: 3 } },
  { id: 'diverse_5', name: '博学多才', icon: '🎯', desc: '阅读5个不同分类', category: 'diverse', condition: { type: 'categories', value: 5 } },
  { id: 'diverse_8', name: '全方位小达人', icon: '💎', desc: '阅读8个不同分类', category: 'diverse', condition: { type: 'categories', value: 8 } },
  { id: 'detail_5', name: '认真记录员', icon: '✍️', desc: '5条带互动亮点的记录', category: 'detail', condition: { type: 'detailedRecords', value: 5 } },
  { id: 'detail_20', name: '观察小达人', icon: '🔍', desc: '20条详细阅读记录', category: 'detail', condition: { type: 'detailedRecords', value: 20 } },
  { id: 'emotion_10', name: '情绪小专家', icon: '😊', desc: '10条带情绪标签的记录', category: 'detail', condition: { type: 'emotionRecords', value: 10 } },
  { id: 'rating_5', name: '五星好评官', icon: '⭐', desc: '给出5个五星评分', category: 'detail', condition: { type: 'fiveStarRatings', value: 5 } },
  { id: 'time_100', name: '百日陪伴', icon: '⏰', desc: '累计阅读100分钟', category: 'time', condition: { type: 'totalMinutes', value: 100 } },
  { id: 'time_500', name: '时光收藏家', icon: '📅', desc: '累计阅读500分钟', category: 'time', condition: { type: 'totalMinutes', value: 500 } },
  { id: 'category_expert', name: '分类专家', icon: '🎓', desc: '某分类阅读10本', category: 'category', condition: { type: 'categoryMax', value: 10 } },
];

const pointRules = {
  recordBase: { points: 10, name: '阅读记录' },
  hasRating: { points: 5, name: '记录评分' },
  hasHighlights10: { points: 10, name: '详细记录' },
  hasHighlights50: { points: 20, name: '优质记录' },
  hasHighlights100: { points: 30, name: '深度记录' },
  hasEmotionTags: { points: 5, name: '情绪标签' },
  hasAbilityTags: { points: 5, name: '能力标签' },
  newCategory: { points: 15, name: '新分类探索' },
  streak3: { points: 20, name: '连续3天打卡' },
  streak7: { points: 50, name: '连续7天打卡' },
  streak30: { points: 200, name: '连续30天打卡' },
  milestone10: { points: 30, name: '阅读10本里程碑' },
  milestone30: { points: 100, name: '阅读30本里程碑' },
  milestone50: { points: 200, name: '阅读50本里程碑' },
};

function getPointsData() {
  return Storage.get('pointsData', {
    totalPoints: 0,
    records: [],
    unlockedBadges: [],
    unlockedAt: {}
  });
}

function savePointsData(data) {
  Storage.set('pointsData', data);
}

function calculateBadgeProgress(badgeDef, persona, records) {
  const condition = badgeDef.condition;
  let current = 0;
  let target = condition.value;

  switch (condition.type) {
    case 'totalRecords':
      current = persona.recordCount || 0;
      break;
    case 'totalBooks':
      current = persona.totalBooks || 0;
      break;
    case 'streak':
      current = persona.streakDays || 0;
      break;
    case 'categories':
      const interestProfile = persona.interestProfile || {};
      current = Object.keys(interestProfile).length;
      break;
    case 'detailedRecords':
      current = records.filter(r => r.interactionHighlights && r.interactionHighlights.length > 10).length;
      break;
    case 'emotionRecords':
      current = records.filter(r => r.emotionTags && r.emotionTags.length > 0).length;
      break;
    case 'fiveStarRatings':
      current = records.filter(r => r.rating === 5).length;
      break;
    case 'totalMinutes':
      current = persona.totalMinutes || 0;
      break;
    case 'categoryMax':
      const bookCounts = {};
      records.forEach(r => {
        const book = bookDatabase.find(b => b.title === r.bookTitle);
        if (book) {
          bookCounts[book.category] = (bookCounts[book.category] || 0) + 1;
        }
      });
      current = Math.max(...Object.values(bookCounts), 0);
      break;
  }

  return { current: Math.min(current, target), target, percent: Math.min(100, Math.round((current / target) * 100)) };
}

function checkBadges() {
  const persona = Storage.get('userPersona', {});
  const records = Storage.get('readingRecords', []);
  const pointsData = getPointsData();
  const newlyUnlocked = [];

  badgeDefinitions.forEach(badge => {
    if (!pointsData.unlockedBadges.includes(badge.id)) {
      const progress = calculateBadgeProgress(badge, persona, records);
      if (progress.current >= progress.target) {
        pointsData.unlockedBadges.push(badge.id);
        pointsData.unlockedAt[badge.id] = Date.now();
        newlyUnlocked.push(badge);
      }
    }
  });

  if (newlyUnlocked.length > 0) {
    savePointsData(pointsData);
  }

  return newlyUnlocked;
}

// ============ 徽章解锁庆祝动画 ============
function showBadgeCelebration(badge) {
  document.getElementById('celebration-badge-icon').textContent = badge.icon;
  document.getElementById('celebration-badge-name').textContent = badge.name;
  document.getElementById('celebration-badge-desc').textContent = badge.desc;
  
  const modal = document.getElementById('badge-celebration-modal');
  modal.classList.add('show');
  
  // 启动彩纸动画
  startConfetti();
}

function startConfetti() {
  const container = document.getElementById('confetti-container');
  container.innerHTML = '';
  
  const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#AA96DA'];
  const emojis = ['⭐', '🌟', '✨', '💫', '🎉', '🏆', '🎊', '💝'];
  
  for (let i = 0; i < 30; i++) {
    const particle = document.createElement('div');
    particle.style.cssText = `
      position: absolute;
      font-size: ${12 + Math.random() * 16}px;
      left: ${Math.random() * 100}%;
      top: -30px;
      animation: confetti-fall ${1.5 + Math.random() * 1.5}s ease-out forwards;
      animation-delay: ${Math.random() * 0.5}s;
    `;
    particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    container.appendChild(particle);
  }
}

function closeCelebrationModal() {
  document.getElementById('badge-celebration-modal').classList.remove('show');
}

// 添加彩纸动画CSS
const confettiStyle = document.createElement('style');
confettiStyle.textContent = `
  @keyframes confetti-fall {
    0% {
      transform: translateY(0) rotate(0deg) scale(1);
      opacity: 1;
    }
    100% {
      transform: translateY(400px) rotate(${360 + Math.random() * 360}deg) scale(0.5);
      opacity: 0;
    }
  }
`;
document.head.appendChild(confettiStyle);

function addPoints(points, reason, recordId = null) {
  if (points <= 0) return;

  const pointsData = getPointsData();
  pointsData.totalPoints += points;
  pointsData.records.unshift({
    id: Date.now() + Math.random(),
    points: points,
    reason: reason,
    recordId: recordId,
    time: formatDate(new Date()),
    timestamp: Date.now()
  });

  if (pointsData.records.length > 200) {
    pointsData.records = pointsData.records.slice(0, 200);
  }

  savePointsData(pointsData);
}

function calculatePointsForRecord(record, wasNewBook, wasNewCategory) {
  const pointsEarned = [];

  pointsEarned.push({ points: pointRules.recordBase.points, reason: pointRules.recordBase.name });

  if (record.rating && record.rating > 0) {
    pointsEarned.push({ points: pointRules.hasRating.points, reason: pointRules.hasRating.name });
  }

  if (record.interactionHighlights && record.interactionHighlights.length > 10) {
    const highlightLength = record.interactionHighlights.length;
    if (highlightLength > 100) {
      pointsEarned.push({ points: pointRules.hasHighlights100.points, reason: pointRules.hasHighlights100.name });
    } else if (highlightLength > 50) {
      pointsEarned.push({ points: pointRules.hasHighlights50.points, reason: pointRules.hasHighlights50.name });
    } else {
      pointsEarned.push({ points: pointRules.hasHighlights10.points, reason: pointRules.hasHighlights10.name });
    }
  }

  if (record.emotionTags && record.emotionTags.length > 0) {
    pointsEarned.push({ points: pointRules.hasEmotionTags.points, reason: pointRules.hasEmotionTags.name });
  }

  if (record.abilityTags && record.abilityTags.length > 0) {
    pointsEarned.push({ points: pointRules.hasAbilityTags.points, reason: pointRules.hasAbilityTags.name });
  }

  if (wasNewCategory) {
    pointsEarned.push({ points: pointRules.newCategory.points, reason: pointRules.newCategory.name });
  }

  return pointsEarned;
}

function checkMilestones(oldPersona, newPersona) {
  const milestones = [];
  const oldBooks = oldPersona.totalBooks || 0;
  const newBooks = newPersona.totalBooks || 0;

  if (oldBooks < 10 && newBooks >= 10) {
    milestones.push({ points: pointRules.milestone10.points, reason: pointRules.milestone10.name });
  }
  if (oldBooks < 30 && newBooks >= 30) {
    milestones.push({ points: pointRules.milestone30.points, reason: pointRules.milestone30.name });
  }
  if (oldBooks < 50 && newBooks >= 50) {
    milestones.push({ points: pointRules.milestone50.points, reason: pointRules.milestone50.name });
  }

  const oldStreak = oldPersona.streakDays || 0;
  const newStreak = newPersona.streakDays || 0;

  if (oldStreak < 3 && newStreak >= 3) {
    milestones.push({ points: pointRules.streak3.points, reason: pointRules.streak3.name });
  }
  if (oldStreak < 7 && newStreak >= 7) {
    milestones.push({ points: pointRules.streak7.points, reason: pointRules.streak7.name });
  }
  if (oldStreak < 30 && newStreak >= 30) {
    milestones.push({ points: pointRules.streak30.points, reason: pointRules.streak30.name });
  }

  return milestones;
}

// ============ AI讲绘本（豆包RTC模拟） ============
let aiCameraStream = null;
let aiCurrentBook = null;
let aiReadingTimer = null;

function openAIVideoModal() {
  document.getElementById('ai-video-modal').classList.add('show');
  resetAIVideo();
}

function closeAIVideoModal() {
  document.getElementById('ai-video-modal').classList.remove('show');
  stopAICamera();
  if (aiReadingTimer) {
    clearTimeout(aiReadingTimer);
    aiReadingTimer = null;
  }
}

function resetAIVideo() {
  document.getElementById('ai-video-step-scan').style.display = 'block';
  document.getElementById('ai-video-step-read').style.display = 'none';
  document.getElementById('btn-start-camera').style.display = 'block';
  document.getElementById('btn-start-read').style.display = 'none';
  document.getElementById('scan-overlay').style.display = 'none';
  document.getElementById('ai-detected-book').style.display = 'none';
  document.getElementById('camera-placeholder').style.display = 'block';
  document.getElementById('ai-camera-video').style.display = 'none';
  document.getElementById('ai-chat-area').innerHTML = `
    <div class="ai-message ai-message-ai" style="display:flex;gap:8px;margin-bottom:10px;">
      <div style="width:28px;height:28px;background:linear-gradient(135deg,#FF8C42,#FF6B1A);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;">🤖</div>
      <div style="background:#fff;padding:8px 12px;border-radius:12px 12px 12px 4px;max-width:80%;font-size:13px;color:var(--text-primary);line-height:1.5;">
        小朋友你好呀～我是你的AI绘本老师！准备好和我一起读故事了吗？🌟
      </div>
    </div>
  `;
}

function startAICamera() {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        aiCameraStream = stream;
        const video = document.getElementById('ai-camera-video');
        video.srcObject = stream;
        video.style.display = 'block';
        document.getElementById('camera-placeholder').style.display = 'none';
        document.getElementById('btn-start-camera').style.display = 'none';
        document.getElementById('scan-overlay').style.display = 'block';

        setTimeout(() => {
          simulateBookDetection();
        }, 2000);
      })
      .catch(err => {
        simulateBookDetection();
      });
  } else {
    simulateBookDetection();
  }
}

function stopAICamera() {
  if (aiCameraStream) {
    aiCameraStream.getTracks().forEach(track => track.stop());
    aiCameraStream = null;
  }
}

function simulateBookDetection() {
  const randomBooks = bookDatabase.filter(b => b.ageRange.includes('4') || b.ageRange.includes('5'));
  aiCurrentBook = randomBooks[Math.floor(Math.random() * randomBooks.length)];

  document.getElementById('detected-book-title').textContent = aiCurrentBook.title;
  document.getElementById('ai-detected-book').style.display = 'block';
  document.getElementById('btn-start-read').style.display = 'block';
}

async function startAIReading() {
  if (!aiCurrentBook) return;

  document.getElementById('ai-video-step-scan').style.display = 'none';
  document.getElementById('ai-video-step-read').style.display = 'block';

  document.getElementById('ai-read-cover').textContent = aiCurrentBook.emoji;
  document.getElementById('ai-read-title').textContent = aiCurrentBook.title;
  document.getElementById('ai-read-author').textContent = aiCurrentBook.author;

  // 初始化 Kimi 对话上下文
  initKimiContext(aiCurrentBook);

  const chatArea = document.getElementById('ai-chat-area');
  chatArea.innerHTML = '';

  addAIMessage(`小朋友好呀～今天我们来读《${aiCurrentBook.title}》吧！📖

这本书是关于${aiCurrentBook.description || '一个很有趣的故事'}哦！

你准备好了吗？让我们开始这趟奇妙的阅读之旅～`);

  // 显示加载中
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'ai-message ai-message-ai';
  loadingDiv.innerHTML = `<span class="ai-name">AI老师</span><div class="ai-typing"><span></span><span></span><span></span></div><div class="ai-typing-text">AI正在为你生成故事，请稍候...</div>`;
  chatArea.appendChild(loadingDiv);
  chatArea.scrollTop = chatArea.scrollHeight;

  // 调用 Kimi API 获取故事
  const story = await kimiTellStory(aiCurrentBook);
  
  // 移除加载提示
  loadingDiv.remove();

  if (story) {
    addAIMessage(`✨ 故事开始啦！\n\n${story}\n\n小朋友，你听到这里有什么想问的吗？🤔\n\n可以问我：\n- 故事讲了什么？\n- 主角是谁？\n- 这个故事告诉我们什么道理？\n- 还有什么问题想问的？`);
  } else {
    // 如果 API 调用失败，使用内置故事
    addAIMessage(`✨ 故事开始啦！\n\n${generateStoryContent(aiCurrentBook)}\n\n小朋友，你听到这里有什么想问的吗？🤔`);
  }
}

function generateStoryContent(book) {
  const contents = {
    '好饿的毛毛虫': '月光下，一个小小的卵躺在叶子上。星期天的早晨，太阳升起来了——"啵！"一条又小又饿的毛毛虫从卵里钻出来了。它要去找一些东西吃。星期一，它吃了一个苹果，可是肚子还是好饿。星期二，它吃了两个梨子，可是肚子还是好饿。星期三，它吃了三个李子，可是肚子还是好饿...',
    '猜猜我有多爱你': '小栗色兔子该上床睡觉了，可是他紧紧地抓住大栗色兔子的长耳朵不放。他要大兔子好好听他说："猜猜我有多爱你。"大兔子说："喔，这我可猜不出来。"小兔子把手臂张开，开得不能再开："这么多。"他说...',
    '我们的身体': '我们的身体真神奇！有心脏在"咚咚"跳，有肺在呼吸空气，还有大脑在思考问题。每一个器官都在努力工作呢！我们的身体里有206块骨头，还有好多好多肌肉，它们一起帮助我们跑、跳、玩耍...',
    '恐龙百科': '很久很久以前，地球上生活着各种各样的恐龙。有的恐龙很大很大，像霸王龙，它有锋利的牙齿和强壮的尾巴；有的恐龙背上有尖尖的刺，像剑龙；还有的恐龙会飞，像翼龙，它们展开翅膀就能在天空中翱翔...',
    '棕色的熊，棕色的熊，你在看什么': '棕色的熊，棕色的熊，你在看什么？我看见一只红色的鸟在看我。红色的鸟，红色的鸟，你在看什么？我看见一只黄色的鸭子在看我。黄色的鸭子，黄色的鸭子，你在看什么...',
    '点点点': '按一下黄色的点点，会发生什么呢？哇，变成两个啦！再按一下，变成三个啦！用手指轻轻往左滑，点点就跑到左边去了。往右滑，点点就跑到右边去了。摇一摇书，所有的点点都跳起舞来啦...',
    '小黄和小蓝': '小黄和小蓝是一对好朋友。有一天，小黄出门去找小蓝。他们找啊找，终于在街角找到了对方。他们抱在一起，抱啊抱，结果变成了绿色！小黄和小蓝都惊呆了："我们变成绿色啦！"...',
    '爷爷一定有办法': '当约瑟还是娃娃的时候，爷爷为他缝了一条奇妙的毯子。毯子又舒服、又保暖，还可以把噩梦通通赶跑。不过，约瑟渐渐长大了，奇妙的毯子也变得老旧了。妈妈说："约瑟，看看你的毯子，又旧又破，该把它丢了。"...',
    '逃家小兔': '从前有一只小兔子，他很想要离家出走。有一天，他对妈妈说："我要跑走啦！""如果你跑走了，"妈妈说，"我就去追你，因为你是我的小宝贝呀！""如果你来追我，"小兔说，"我就要变成溪里的小鳟鱼，游得远远的。"...',
    '好饿的小蛇': '好饿的小蛇扭来扭去在散步，它发现了一个圆圆的苹果。你猜猜，好饿的小蛇会怎么样？"啊呜——咕嘟！"啊，真好吃。第二天，好饿的小蛇扭来扭去在散步，它发现了一根黄色的香蕉...',
    '蚂蚁和西瓜': '一个夏天的下午，蚂蚁们发现了一块大西瓜。"哇——好大的西瓜呀！"蚂蚁们一起推西瓜，可是西瓜一动也不动。"有办法了！"小蚂蚁们跑回洞去叫大家。"快来呀，发现好东西啦！"...',
    '母鸡萝丝去散步': '母鸡萝丝出门去散步，她走过院子。一只狐狸从后面悄悄地跟上来。萝丝绕过池塘，狐狸也跟着绕过池塘。扑通！狐狸掉进了池塘里，溅起了好大的水花。可是萝丝一点儿也不知道，她继续往前走...',
    '爱心树': '从前有一棵大树，它喜欢上一个男孩儿。男孩儿每天会跑到树下，采集树叶，给自己做王冠，想象自己就是森林之王。他也常常爬上树干，在树枝上荡秋千，吃树上结的苹果...',
    '活了一百万次的猫': '有一只活了一百万次的猫，它死了一百万次，又活了一百万次。有一百万个人宠爱过这只猫，有一百万个人在这只猫死的时候哭过。可是猫连一次也没有哭过。有一次，猫是国王的猫...',
    '小王子': '从前有一个小王子，他住在一个很小很小的星球上，那个星球比一座房子大不了多少。每天早上，他把星球打扫得干干净净，然后他会挪挪椅子，看看日落。有一天，一颗不知道从哪里来的种子发了芽...'
  };

  if (contents[book.title]) {
    return contents[book.title];
  }

  const tag = book.tags && book.tags[0] ? book.tags[0] : '神奇';
  const templates = [
    `在很久很久以前，有一个关于${tag}的故事。故事里有一个特别的主角，它经历了很多有趣的事情。有一天，它遇到了一个小小的困难，但是它没有放弃，而是动脑筋想办法...`,
    `小朋友，今天的故事发生在一个美丽的地方。那里有${tag}，还有很多可爱的小伙伴。故事的主角是一个勇敢的小家伙，它要去完成一个重要的任务。一路上，它会遇到什么呢...`,
    `这是一个关于${tag}的温暖故事。故事里有欢笑，有感动，还有很多很多的爱。让我们一起走进这个奇妙的世界，看看故事里的小伙伴们都经历了什么...`
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}

function stopAIReading() {
  if (aiReadingTimer) {
    clearTimeout(aiReadingTimer);
    aiReadingTimer = null;
  }
  document.getElementById('ai-video-step-read').style.display = 'none';
  document.getElementById('ai-video-step-scan').style.display = 'block';
}

async function sendAIMessage() {
  const input = document.getElementById('ai-chat-input');
  const message = input.value.trim();
  if (!message) return;

  addUserMessage(message);
  input.value = '';

  showTyping();

  // 调用 Kimi API 获取回复
  const response = await generateAIResponse(message);
  
  hideTyping();
  addAIMessage(response);
}

async function quickAIQuestion(question) {
  addUserMessage(question);
  showTyping();
  
  // 调用 Kimi API 获取回复
  const response = await generateAIResponse(question);
  
  hideTyping();
  addAIMessage(response);
}

function addAIMessage(text) {
  const chatArea = document.getElementById('ai-chat-area');
  const msgDiv = document.createElement('div');
  msgDiv.className = 'ai-message ai-message-ai';
  msgDiv.style.cssText = 'display:flex;gap:8px;margin-bottom:10px;';
  msgDiv.innerHTML = `
    <div style="width:28px;height:28px;background:linear-gradient(135deg,#FF8C42,#FF6B1A);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;">🤖</div>
    <div style="background:#fff;padding:8px 12px;border-radius:12px 12px 12px 4px;max-width:80%;font-size:13px;color:var(--text-primary);line-height:1.5;white-space:pre-wrap;">${text}</div>
  `;
  chatArea.appendChild(msgDiv);
  chatArea.scrollTop = chatArea.scrollHeight;
}

function addUserMessage(text) {
  const chatArea = document.getElementById('ai-chat-area');
  const msgDiv = document.createElement('div');
  msgDiv.className = 'ai-message ai-message-user';
  msgDiv.style.cssText = 'display:flex;gap:8px;margin-bottom:10px;justify-content:flex-end;';
  msgDiv.innerHTML = `
    <div style="background:linear-gradient(135deg,#FF8C42,#FF6B1A);color:#fff;padding:8px 12px;border-radius:12px 12px 4px 12px;max-width:80%;font-size:13px;line-height:1.5;">${text}</div>
    <div style="width:28px;height:28px;background:#E8F5E9;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;">🧒</div>
  `;
  chatArea.appendChild(msgDiv);
  chatArea.scrollTop = chatArea.scrollHeight;
}

function showTyping() {
  const chatArea = document.getElementById('ai-chat-area');
  const typingDiv = document.createElement('div');
  typingDiv.id = 'ai-typing-indicator';
  typingDiv.className = 'ai-message ai-message-ai';
  typingDiv.style.cssText = 'display:flex;gap:8px;margin-bottom:10px;';
  typingDiv.innerHTML = `
    <div style="width:28px;height:28px;background:linear-gradient(135deg,#FF8C42,#FF6B1A);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;">🤖</div>
    <div style="background:#fff;padding:10px 14px;border-radius:12px 12px 12px 4px;" class="ai-typing">
      <span></span><span></span><span></span>
    </div>
  `;
  chatArea.appendChild(typingDiv);
  chatArea.scrollTop = chatArea.scrollHeight;
}

function hideTyping() {
  const indicator = document.getElementById('ai-typing-indicator');
  if (indicator) indicator.remove();
}

// AI 问答（调用 Kimi 真实 API）
async function generateAIResponse(question) {
  const book = aiCurrentBook;
  
  // 调用 Kimi API 获取真实回答
  const kimiAnswer = await kimiBookQA(book, question);
  if (kimiAnswer) {
    return kimiAnswer;
  }
  
  // 如果 API 调用失败，使用默认回复
  const q = question.toLowerCase();

  if (q.includes('你好') || q.includes('您好') || q.includes('hi') || q.includes('hello')) {
    return `你好呀，小朋友！👋\n\n我是你的AI绘本老师，很高兴认识你！我们今天读的是《${book?.title || '一本好看的书'}》，你喜欢这个故事吗？`;
  }

  if (q.includes('故事') || q.includes('讲了什么') || q.includes('什么内容')) {
    return `这个故事讲的是：\n\n${book?.description || '一个很有趣的故事哦，你认真听就知道啦～'}\n\n你喜欢这个故事吗？😊`;
  }

  if (q.includes('主角') || q.includes('主人公')) {
    return `这本书讲的是一个很特别的故事哦！🎭\n\n故事里有可爱的主角，还有好多有趣的角色。它们会一起经历很多好玩的事情。\n\n你猜猜故事里的主角是什么样的呀？`;
  }

  if (q.includes('再见') || q.includes('拜拜') || q.includes('bye')) {
    return `再见啦，小朋友！👋\n\n今天的故事就讲到这里。下次我们再一起读更多好听的故事。记得要多读书哦，拜拜～🌟`;
  }

  const responses = [
    '哇，你问了一个好问题！让我想想...🤔\n\n其实答案就在故事里面哦，你再仔细听听看？说不定你已经找到答案啦！',
    '你真聪明，会想到这个问题！🧠\n\n我们可以一起来找找答案。你先说说你的想法好不好？老师想听听你是怎么想的。',
    '这个问题很有意思！✨\n\n你觉得呢？先说说你的想法，然后老师再告诉你答案，好不好？',
    '你听得真认真！👂\n\n关于这个问题，故事后面还会讲到哦。我们继续往下读，说不定读着读着你就明白啦！',
    '哈哈哈，你真可爱！😄\n\n能和你一起读故事真开心。你还有什么想问的吗？尽管问老师哦～'
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}

function renderPointsBadges() {
  const pointsData = getPointsData();
  const persona = Storage.get('userPersona', {});
  const records = Storage.get('readingRecords', []);

  document.getElementById('total-points').textContent = pointsData.totalPoints;

  const previewContainer = document.getElementById('badges-preview');
  const unlockedBadges = pointsData.unlockedBadges || [];
  const previewBadges = badgeDefinitions.slice(0, 6);

  previewContainer.innerHTML = previewBadges.map(badge => {
    const isUnlocked = unlockedBadges.includes(badge.id);
    return `<div class="badge-mini ${isUnlocked ? '' : 'locked'}" title="${badge.name}">${badge.icon}</div>`;
  }).join('');
}

function openPointsModal() {
  document.getElementById('points-modal').classList.add('show');
  renderBadgeGrid();
  renderPointsRecordList();
  updatePointsSummary();
}

function closePointsModal() {
  document.getElementById('points-modal').classList.remove('show');
}

function switchPointsTab(tab) {
  document.querySelectorAll('.points-modal-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
  document.getElementById('points-tab-badges').style.display = tab === 'badges' ? 'block' : 'none';
  document.getElementById('points-tab-points').style.display = tab === 'points' ? 'block' : 'none';
  document.getElementById('points-tab-exchange').style.display = tab === 'exchange' ? 'block' : 'none';
  
  if (tab === 'exchange') {
    renderExchangeList();
  }
}

function updatePointsSummary() {
  const pointsData = getPointsData();
  const unlockedCount = (pointsData.unlockedBadges || []).length;
  const totalBadges = badgeDefinitions.length;

  document.getElementById('modal-total-points').textContent = pointsData.totalPoints;
  document.getElementById('modal-total-points-2').textContent = pointsData.totalPoints;
  document.getElementById('modal-unlocked-badges').textContent = unlockedCount;
  document.getElementById('modal-total-badges').textContent = totalBadges;
  document.getElementById('modal-exchange-points').textContent = pointsData.totalPoints;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthPoints = (pointsData.records || []).filter(r => new Date(r.timestamp) >= monthStart)
    .reduce((sum, r) => sum + r.points, 0);
  document.getElementById('modal-month-points').textContent = monthPoints;
}

// ============ 阅读目标系统 ============
const defaultReadingGoal = { month: { books: 10, minutes: 120, days: 15 }, quarter: { books: 30, minutes: 360, days: 40 } };
let currentGoalPeriod = 'month';

function getReadingGoal() {
  const profile = Storage.get('childProfile', {});
  const saved = profile.readingGoal || { ...defaultReadingGoal };
  return saved[currentGoalPeriod] || defaultReadingGoal[currentGoalPeriod];
}

function getGoalPeriodLabel() {
  return currentGoalPeriod === 'month' ? '本月' : '本季度';
}

function calculateGoalProgress() {
  const goal = getReadingGoal();
  const records = Storage.get('readingRecords', []);
  const now = new Date();
  
  let periodStart;
  if (currentGoalPeriod === 'month') {
    periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    const quarter = Math.floor(now.getMonth() / 3);
    periodStart = new Date(now.getFullYear(), quarter * 3, 1);
  }
  
  const periodRecords = records.filter(r => {
    const recordDate = new Date(r.date);
    return recordDate >= periodStart && recordDate <= now;
  });

  const actualBooks = new Set(periodRecords.map(r => r.bookTitle)).size;
  const actualMinutes = periodRecords.reduce((sum, r) => sum + (r.duration || 0), 0);
  const daysWithReading = new Set(periodRecords.map(r => r.date)).size;

  const booksProgress = Math.min(100, Math.round((actualBooks / goal.books) * 100));
  const minutesProgress = Math.min(100, Math.round((actualMinutes / goal.minutes) * 100));
  const daysProgress = Math.min(100, Math.round((daysWithReading / goal.days) * 100));

  const overallProgress = Math.round(booksProgress * 0.4 + minutesProgress * 0.3 + daysProgress * 0.3);

  return {
    books: { current: actualBooks, target: goal.books, progress: booksProgress },
    minutes: { current: actualMinutes, target: goal.minutes, progress: minutesProgress },
    days: { current: daysWithReading, target: goal.days, progress: daysProgress },
    overall: overallProgress
  };
}

function updateReadingGoalDisplay() {
  const progress = calculateGoalProgress();
  document.getElementById('goal-period-label').textContent = getGoalPeriodLabel();
  document.getElementById('goal-completion-rate').textContent = progress.overall + '%';
  document.getElementById('goal-progress-fill').style.width = progress.overall + '%';
  document.getElementById('goal-books-stat').textContent = `📚 ${progress.books.current}/${progress.books.target}`;
  document.getElementById('goal-minutes-stat').textContent = `⏱️ ${progress.minutes.current}分`;
  document.getElementById('goal-days-stat').textContent = `📅 ${progress.days.current}天`;
}

function switchGoalPeriod(period) {
  currentGoalPeriod = period;
  
  document.querySelectorAll('.goal-period-tab').forEach(tab => {
    tab.classList.toggle('active', tab.textContent.includes(period === 'month' ? '月度' : '季度'));
    if (tab.classList.contains('active')) {
      tab.style.background = 'var(--primary)';
      tab.style.color = 'white';
    } else {
      tab.style.background = 'var(--secondary-bg)';
      tab.style.color = 'var(--text-secondary)';
    }
  });
  
  updateReadingGoalDisplay();
}

function openReadingGoalModal() {
  const goal = getReadingGoal();
  
  // 设置选中状态
  document.querySelectorAll('.goal-tag').forEach(tag => {
    const type = tag.dataset.type;
    const value = parseInt(tag.dataset.value);
    tag.classList.toggle('selected', value === goal[type]);
  });
  
  document.getElementById('reading-goal-modal').classList.add('show');
}

function closeReadingGoalModal() {
  document.getElementById('reading-goal-modal').classList.remove('show');
}

function saveReadingGoal() {
  const selectedTags = document.querySelectorAll('.goal-tag.selected');
  const goal = { books: 10, minutes: 120, days: 15 };
  
  selectedTags.forEach(tag => {
    const type = tag.dataset.type;
    const value = parseInt(tag.dataset.value);
    goal[type] = value;
  });

  const profile = Storage.get('childProfile', {});
  profile.readingGoal = profile.readingGoal || { month: { ...defaultReadingGoal.month }, quarter: { ...defaultReadingGoal.quarter } };
  profile.readingGoal[currentGoalPeriod] = goal;
  Storage.set('childProfile', profile);
  
  updateReadingGoalDisplay();
  closeReadingGoalModal();
  showToast('阅读目标已设置！');
}

// 点击目标标签切换选中
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('goal-tag')) {
    const type = e.target.dataset.type;
    document.querySelectorAll(`.goal-tag[data-type="${type}"]`).forEach(t => t.classList.remove('selected'));
    e.target.classList.add('selected');
  }
});

// ============ 每周挑战系统 ============
const defaultWeeklyChallenge = { books: 5, minutes: 120, categories: 3, records: 3 };

function getWeeklyChallenge() {
  const profile = Storage.get('childProfile', {});
  return profile.weeklyChallenge || { ...defaultWeeklyChallenge };
}

function calculateWeeklyProgress() {
  const challenge = getWeeklyChallenge();
  const records = Storage.get('readingRecords', []);
  const now = new Date();
  const dayOfWeek = now.getDay() || 7;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - dayOfWeek + 1);
  weekStart.setHours(0, 0, 0, 0);
  
  const weekRecords = records.filter(r => new Date(r.date) >= weekStart);
  
  const actualBooks = new Set(weekRecords.map(r => r.bookTitle)).size;
  const actualMinutes = weekRecords.reduce((sum, r) => sum + (r.duration || 0), 0);
  
  const categories = new Set();
  weekRecords.forEach(r => {
    const book = bookDatabase.find(b => b.title === r.bookTitle);
    if (book) categories.add(book.tags[0]);
  });
  const actualCategories = categories.size;
  
  const actualRecords = weekRecords.filter(r => r.interactionHighlights && r.interactionHighlights.length > 10).length;
  
  const booksProgress = Math.min(100, Math.round((actualBooks / challenge.books) * 100));
  const minutesProgress = Math.min(100, Math.round((actualMinutes / challenge.minutes) * 100));
  const categoriesProgress = Math.min(100, Math.round((actualCategories / challenge.categories) * 100));
  const recordsProgress = Math.min(100, Math.round((actualRecords / challenge.records) * 100));
  
  const overallProgress = Math.round((booksProgress + minutesProgress + categoriesProgress + recordsProgress) / 4);
  
  return {
    books: { current: actualBooks, target: challenge.books, progress: booksProgress },
    minutes: { current: actualMinutes, target: challenge.minutes, progress: minutesProgress },
    categories: { current: actualCategories, target: challenge.categories, progress: categoriesProgress },
    records: { current: actualRecords, target: challenge.records, progress: recordsProgress },
    overall: overallProgress
  };
}

function updateWeeklyChallengeDisplay() {
  const progress = calculateWeeklyProgress();
  document.getElementById('weekly-progress-fill').style.width = progress.overall + '%';
  document.getElementById('weekly-progress-text').textContent = `${progress.overall}%`;
  document.getElementById('weekly-reward').textContent = '+50积分';
  
  const status = progress.overall >= 100 ? '✅ 已完成' : '进行中';
  document.getElementById('weekly-challenge-status').textContent = status;
}

function openWeeklyChallengeModal() {
  const challenge = getWeeklyChallenge();
  
  document.querySelectorAll('.week-tag').forEach(tag => {
    const type = tag.dataset.type;
    const value = parseInt(tag.dataset.value);
    tag.classList.toggle('selected', value === challenge[type]);
  });
  
  document.getElementById('weekly-challenge-modal').classList.add('show');
}

function closeWeeklyChallengeModal() {
  document.getElementById('weekly-challenge-modal').classList.remove('show');
}

function saveWeeklyChallenge() {
  const selectedTags = document.querySelectorAll('.week-tag.selected');
  const challenge = { books: 5, minutes: 120, categories: 3, records: 3 };
  
  selectedTags.forEach(tag => {
    const type = tag.dataset.type;
    const value = parseInt(tag.dataset.value);
    challenge[type] = value;
  });

  const profile = Storage.get('childProfile', {});
  profile.weeklyChallenge = challenge;
  Storage.set('childProfile', profile);
  
  updateWeeklyChallengeDisplay();
  closeWeeklyChallengeModal();
  showToast('每周挑战已设置！');
}

// 点击挑战标签切换选中
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('week-tag')) {
    const type = e.target.dataset.type;
    document.querySelectorAll(`.week-tag[data-type="${type}"]`).forEach(t => t.classList.remove('selected'));
    e.target.classList.add('selected');
  }
});

// 每周挑战完成奖励检查
function checkWeeklyChallengeReward() {
  const pointsData = getPointsData();
  const now = new Date();
  const weekKey = `${now.getFullYear()}-W${Math.ceil((now.getDate() - now.getDay() + 1) / 7)}`;
  
  if (pointsData.weeklyRewards && pointsData.weeklyRewards[weekKey]) {
    return;
  }
  
  const progress = calculateWeeklyProgress();
  if (progress.overall >= 100) {
    pointsData.totalPoints += 50;
    pointsData.records.push({
      timestamp: Date.now(),
      points: 50,
      reason: '🔥 完成本周挑战'
    });
    pointsData.weeklyRewards = pointsData.weeklyRewards || {};
    pointsData.weeklyRewards[weekKey] = true;
    savePointsData(pointsData);
  }
}

// ============ 积分兑换系统 ============
const exchangeItems = [
  { id: 'recognition', name: '专属称号', desc: '解锁"阅读小达人"称号', icon: '🎖️', cost: 100, type: 'title' },
  { id: 'theme1', name: '主题皮肤', desc: '海洋探险主题背景', icon: '🌊', cost: 200, type: 'theme' },
  { id: 'theme2', name: '主题皮肤', desc: '森林冒险主题背景', icon: '🌲', cost: 200, type: 'theme' },
  { id: 'report', name: '深度报告', desc: '解锁月度深度分析报告', icon: '📊', cost: 150, type: 'report' },
  { id: 'category', name: '扩展分类', desc: '解锁2个新绘本分类', icon: '📚', cost: 300, type: 'category' },
  { id: 'badge1', name: '专属徽章', desc: '解锁"知识探险家"徽章', icon: '🧭', cost: 500, type: 'badge' }
];

function renderExchangeList() {
  const pointsData = getPointsData();
  const owned = pointsData.exchangedItems || [];
  const container = document.getElementById('exchange-list');
  
  container.innerHTML = exchangeItems.map(item => {
    const isOwned = owned.includes(item.id);
    const canAfford = pointsData.totalPoints >= item.cost;
    
    return `
      <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--secondary-bg);border-radius:10px;margin-bottom:8px;">
        <div style="font-size:32px;">${item.icon}</div>
        <div style="flex:1;">
          <div style="font-size:14px;font-weight:600;">${item.name}</div>
          <div style="font-size:12px;color:var(--text-light);">${item.desc}</div>
        </div>
        <div>
          ${isOwned 
            ? '<span style="font-size:12px;color:#4CAF50;">已拥有</span>'
            : `<button class="btn btn-outline btn-sm" onclick="exchangeItem('${item.id}')" ${!canAfford ? 'disabled style="opacity:0.5;"' : ''}>${item.cost}积分</button>`
          }
        </div>
      </div>
    `;
  }).join('');
}

function exchangeItem(itemId) {
  const item = exchangeItems.find(i => i.id === itemId);
  if (!item) return;
  
  const pointsData = getPointsData();
  const owned = pointsData.exchangedItems || [];
  
  if (owned.includes(itemId)) {
    showToast('已拥有该权益');
    return;
  }
  
  if (pointsData.totalPoints < item.cost) {
    showToast('积分不足');
    return;
  }
  
  pointsData.totalPoints -= item.cost;
  owned.push(itemId);
  pointsData.exchangedItems = owned;
  savePointsData(pointsData);
  
  showBadgeCelebration({ icon: item.icon, name: item.name, desc: item.desc + ' - 已兑换' });
  updatePointsSummary();
  renderExchangeList();
}

function renderBadgeGrid() {
  const persona = Storage.get('userPersona', {});
  const records = Storage.get('readingRecords', []);
  const pointsData = getPointsData();
  const container = document.getElementById('badge-grid');

  container.innerHTML = badgeDefinitions.map(badge => {
    const isUnlocked = pointsData.unlockedBadges.includes(badge.id);
    const progress = calculateBadgeProgress(badge, persona, records);
    const progressBar = isUnlocked ? '' : `
      <div class="badge-card-progress">
        <div class="badge-card-progress-fill" style="width: ${progress.percent}%"></div>
      </div>
    `;
    const progressText = isUnlocked ? '已解锁' : `${progress.current}/${progress.target}`;

    return `
      <div class="badge-card ${isUnlocked ? 'unlocked' : 'locked'}">
        <div class="badge-card-icon">${badge.icon}</div>
        <div class="badge-card-name">${badge.name}</div>
        <div class="badge-card-desc">${badge.desc}</div>
        ${progressBar}
        <div style="font-size:10px;color:var(--text-light);margin-top:4px;">${progressText}</div>
      </div>
    `;
  }).join('');
}

function renderPointsRecordList() {
  const pointsData = getPointsData();
  const container = document.getElementById('points-record-list');
  const records = pointsData.records || [];

  if (records.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-light);font-size:13px;">暂无积分记录，开始阅读吧！</div>';
    return;
  }

  container.innerHTML = records.map(r => `
    <div class="points-record-item">
      <div class="points-record-info">
        <div class="points-record-title">${r.reason}</div>
        <div class="points-record-time">${r.time}</div>
      </div>
      <div class="points-record-value ${r.points < 0 ? 'minus' : ''}">
        ${r.points > 0 ? '+' : ''}${r.points}
      </div>
    </div>
  `).join('');
}

function renderWeakAbilities() {
  const persona = Storage.get('userPersona', {});
  const weakAbilities = persona.weakAbilities || [];
  const container = document.getElementById('weak-ability-list');

  if (weakAbilities.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-light);font-size:13px;">🎉 暂无明显薄弱项，继续保持！</div>';
    return;
  }

  container.innerHTML = weakAbilities.map(weak => {
    let reason = '';
    let cat = 'emotion';
    if (weak.includes('情绪')) { reason = '最近阅读中情绪类绘本占比较少'; cat = 'emotion'; }
    if (weak.includes('社交')) { reason = '社交主题绘本阅读量偏低'; cat = 'social'; }
    if (weak.includes('科学')) { reason = '科学探索类内容接触较少'; cat = 'science'; }
    if (weak.includes('语言')) { reason = '语言表达类绘本还可以加强'; cat = 'language'; }

    return `
      <div style="padding:12px;background:var(--primary-bg);border-radius:var(--radius-sm);margin-bottom:10px;">
        <div style="font-size:14px;font-weight:600;margin-bottom:4px;">${weak}</div>
        <div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;">${reason}</div>
        <button class="btn btn-primary btn-sm" onclick="goToCategory('${cat}')">查看推荐</button>
      </div>
    `;
  }).join('');
}

// ============ 档案编辑功能 ============
function updateAge(age) {
  let profile = Storage.get('childProfile', {});
  profile.ageRange = age;
  Storage.set('childProfile', profile);
  renderProfile();
  showToast('年龄段已更新');
}

function updateGender(gender) {
  let profile = Storage.get('childProfile', {});
  profile.gender = gender;
  Storage.set('childProfile', profile);
  renderProfile();
  showToast('性别已更新');
}

function toggleInterest(tag) {
  let profile = Storage.get('childProfile', {});
  let interests = profile.interests || [];
  const idx = interests.indexOf(tag);
  if (idx > -1) {
    interests.splice(idx, 1);
  } else {
    interests.push(tag);
  }
  profile.interests = interests;
  Storage.set('childProfile', profile);
  updateUserPersona();
  renderProfile();
}

function editNickname() {
  const profile = Storage.get('childProfile', {});
  const newName = prompt('请输入宝贝昵称', profile.nickname || '');
  if (newName && newName.trim()) {
    profile.nickname = newName.trim();
    Storage.set('childProfile', profile);
    renderProfile();
    renderHome();
    showToast('昵称已更新');
  }
}

// 头像选择
let selectedAvatar = null;

function openAvatarSelector() {
  const profile = Storage.get('childProfile', {});
  selectedAvatar = profile.avatar || '🧒';
  const grid = document.getElementById('avatar-grid');
  grid.innerHTML = avatarOptions.map(av => `
    <div class="avatar-option ${av === selectedAvatar ? 'selected' : ''}" onclick="selectAvatar('${av}')">${av}</div>
  `).join('');
  document.getElementById('avatar-modal').classList.add('show');
}

function selectAvatar(av) {
  selectedAvatar = av;
  document.querySelectorAll('.avatar-option').forEach(el => {
    el.classList.toggle('selected', el.textContent === av);
  });
}

function closeAvatarModal() {
  document.getElementById('avatar-modal').classList.remove('show');
}

function saveAvatar() {
  let profile = Storage.get('childProfile', {});
  profile.avatar = selectedAvatar;
  Storage.set('childProfile', profile);
  closeAvatarModal();
  renderProfile();
  renderHome();
  showToast('头像已更新');
}

// ============ 通用组件 ============
let toastTimer = null;

function showToast(message, duration = 2500) {
  const toast = document.getElementById('toast');
  if (message.includes('<div') || message.includes('<strong') || message.includes('<span')) {
    toast.innerHTML = message;
  } else {
    toast.textContent = message;
  }
  toast.classList.remove('animate');
  void toast.offsetWidth;
  toast.classList.add('show', 'animate');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show', 'animate');
  }, duration);
}

let confirmCallback = null;

function showConfirm(title, content, callback) {
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-content').textContent = content;
  confirmCallback = callback;
  document.getElementById('confirm-modal').classList.add('show');
}

function closeConfirm(confirmed) {
  document.getElementById('confirm-modal').classList.remove('show');
  if (confirmCallback) {
    confirmCallback(confirmed);
    confirmCallback = null;
  }
}

// 点击弹窗外部关闭
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      if (overlay.id === 'confirm-modal') {
        closeConfirm(false);
      } else {
        overlay.classList.remove('show');
      }
    }
  });
});

// ============ API Key 管理 ============
function getKimiApiKey() {
  return localStorage.getItem('kimi_api_key') || '';
}

function setKimiApiKey(key) {
  localStorage.setItem('kimi_api_key', key);
}

function openApiKeyModal() {
  document.getElementById('api-key-input').value = getKimiApiKey();
  document.getElementById('api-key-modal').classList.add('show');
}

function closeApiKeyModal() {
  document.getElementById('api-key-modal').classList.remove('show');
}

function saveApiKey() {
  const key = document.getElementById('api-key-input').value.trim();
  if (key && !key.startsWith('sk-')) {
    showToast('API Key 格式不正确，应以 sk- 开头');
    return;
  }
  setKimiApiKey(key);
  updateApiKeyStatus();
  closeApiKeyModal();
  showToast(key ? 'API Key 保存成功 ✨' : 'API Key 已清除');
}

function updateApiKeyStatus() {
  const key = getKimiApiKey();
  const statusEl = document.getElementById('api-key-status');
  if (statusEl) {
    if (key) {
      statusEl.textContent = '已配置 · ' + key.slice(0, 6) + '...' + key.slice(-4);
      statusEl.style.color = '#7BC67E';
    } else {
      statusEl.textContent = '点击配置 Kimi AI API Key';
      statusEl.style.color = '';
    }
  }
}

// ============ 初始化 ============
function init() {
  initSampleData();
  updateUserPersona();
  initPointsAndBadges();
  switchPage('home');
  initTagSelectEvents();
}

function initTagSelectEvents() {
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('tag-select')) {
      const tag = e.target;
      const parent = tag.parentElement;
      if (parent.id === 'age-select' || parent.id === 'gender-select') return;
      if (tag.closest('#interest-tags') || tag.closest('#ai-tags')) return;
      if (tag.closest('.goal-selector') || tag.closest('.challenge-selector')) return;
      tag.classList.toggle('selected');
    }
  });
}

function initPointsAndBadges() {
  const pointsData = getPointsData();
  if (pointsData.initialized) return;

  const records = Storage.get('readingRecords', []);
  const persona = Storage.get('userPersona', {});
  let totalPoints = 0;
  const seenBooks = new Set();
  const seenCategories = new Set();

  const sortedRecords = [...records].sort((a, b) => new Date(a.date) - new Date(b.date));

  sortedRecords.forEach(record => {
    const wasNewBook = !seenBooks.has(record.bookTitle);
    const book = bookDatabase.find(b => b.title === record.bookTitle);
    const wasNewCategory = book && !seenCategories.has(book.category);

    if (wasNewBook) seenBooks.add(record.bookTitle);
    if (wasNewCategory) seenCategories.add(book.category);

    const pointsList = calculatePointsForRecord(record, wasNewBook, wasNewCategory);
    pointsList.forEach(p => {
      totalPoints += p.points;
      pointsData.records.push({
        id: Date.now() + Math.random(),
        points: p.points,
        reason: p.reason,
        recordId: record.id,
        time: record.date,
        timestamp: new Date(record.date).getTime()
      });
    });
  });

  if (persona.totalBooks >= 10) {
    totalPoints += pointRules.milestone10.points;
    pointsData.records.push({ id: Date.now(), points: pointRules.milestone10.points, reason: pointRules.milestone10.name, time: formatDate(new Date()), timestamp: Date.now() });
  }
  if (persona.totalBooks >= 30) {
    totalPoints += pointRules.milestone30.points;
    pointsData.records.push({ id: Date.now() + 1, points: pointRules.milestone30.points, reason: pointRules.milestone30.name, time: formatDate(new Date()), timestamp: Date.now() });
  }
  if (persona.totalBooks >= 50) {
    totalPoints += pointRules.milestone50.points;
    pointsData.records.push({ id: Date.now() + 2, points: pointRules.milestone50.points, reason: pointRules.milestone50.name, time: formatDate(new Date()), timestamp: Date.now() });
  }

  if (persona.streakDays >= 3) {
    totalPoints += pointRules.streak3.points;
    pointsData.records.push({ id: Date.now() + 3, points: pointRules.streak3.points, reason: pointRules.streak3.name, time: formatDate(new Date()), timestamp: Date.now() });
  }
  if (persona.streakDays >= 7) {
    totalPoints += pointRules.streak7.points;
    pointsData.records.push({ id: Date.now() + 4, points: pointRules.streak7.points, reason: pointRules.streak7.name, time: formatDate(new Date()), timestamp: Date.now() });
  }
  if (persona.streakDays >= 30) {
    totalPoints += pointRules.streak30.points;
    pointsData.records.push({ id: Date.now() + 5, points: pointRules.streak30.points, reason: pointRules.streak30.name, time: formatDate(new Date()), timestamp: Date.now() });
  }

  pointsData.totalPoints = totalPoints;
  pointsData.records.sort((a, b) => b.timestamp - a.timestamp);
  pointsData.initialized = true;

  checkBadges();
  savePointsData(pointsData);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);

// 如果 DOM 已经加载完毕
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  init();
}
