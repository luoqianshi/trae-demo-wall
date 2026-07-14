const recommendations = {
  1: {
    feeding: { milkAmount: '每次60-120ml', frequency: '每3-4小时一次', solidFoods: ['暂不添加辅食'] },
    toys: { type: '视觉刺激类', examples: ['黑白卡片', '床头摇铃', '视觉追踪球'], benefits: ['促进视觉发育', '提高注意力', '培养好奇心'] },
    books: { type: '视觉认知书', examples: ['黑白视觉卡', '彩色视觉激发卡', '触感布书'], readingTips: ['每天看5-10分钟', '保持30cm距离', '用轻柔声音解说'] },
    milestones: ['抬头', '追视物体', '发出咿呀声']
  },
  2: {
    feeding: { milkAmount: '每次100-150ml', frequency: '每3-4小时一次', solidFoods: ['暂不添加辅食'] },
    toys: { type: '触觉听觉类', examples: ['触感球', '手摇铃', '音乐盒'], benefits: ['锻炼手部抓握', '发展听觉', '促进感官发育'] },
    books: { type: '触感布书', examples: ['小动物布书', '水果布书', '触感认知书'], readingTips: ['让宝宝触摸不同材质', '模仿动物叫声', '重复简单词语'] },
    milestones: ['抬头更稳', '发出笑声', '手眼协调开始发展']
  },
  3: {
    feeding: { milkAmount: '每次120-180ml', frequency: '每4小时一次', solidFoods: ['少量米粉尝试'] },
    toys: { type: '抓握训练类', examples: ['牙胶', '软积木', '悬挂玩具'], benefits: ['锻炼抓握能力', '缓解出牙不适', '促进手眼协调'] },
    books: { type: '认知绘本', examples: ['《小眼睛看大世界》', '《猜猜我是谁》', '《脸脸各种各样》'], readingTips: ['指着图片讲解', '模仿书中声音', '培养阅读兴趣'] },
    milestones: ['翻身', '抓握玩具', '发出更多音节']
  },
  4: {
    feeding: { milkAmount: '每次150-200ml', frequency: '每4小时一次', solidFoods: ['强化铁米粉', '南瓜泥', '胡萝卜泥'] },
    toys: { type: '活动能力类', examples: ['健身架', '爬爬垫', '彩色积木'], benefits: ['锻炼四肢力量', '促进大运动发展', '培养空间意识'] },
    books: { type: '互动绘本', examples: ['《躲猫猫》', '《小手摸摸》', '《洞洞书》'], readingTips: ['和宝宝一起互动', '鼓励宝宝动手探索', '培养好奇心'] },
    milestones: ['仰卧翻身', '抓握更熟练', '认人']
  },
  5: {
    feeding: { milkAmount: '每次150-200ml', frequency: '每4-5小时一次', solidFoods: ['土豆泥', '西兰花泥', '苹果泥'] },
    toys: { type: '精细动作类', examples: ['形状配对盒', '叠叠杯', '手指套'], benefits: ['发展精细动作', '培养专注力', '学习因果关系'] },
    books: { type: '动物绘本', examples: ['《可爱的动物》', '《动物叫声绘本》', '《小熊宝宝绘本》'], readingTips: ['模仿动物叫声', '指认身体部位', '培养语言能力'] },
    milestones: ['独坐', '伸手抓物', '区分熟人和陌生人']
  },
  6: {
    feeding: { milkAmount: '每次180-240ml', frequency: '每4-5小时一次', solidFoods: ['肉泥', '蛋黄泥', '豌豆泥', '香蕉泥'] },
    toys: { type: '感官探索类', examples: ['玩水玩具', '触觉板', '感官桶'], benefits: ['探索不同材质', '发展触觉感知', '激发创造力'] },
    books: { type: '生活习惯绘本', examples: ['《吃饭饭》', '《睡觉觉》', '《洗澡澡》'], readingTips: ['联系日常生活', '培养生活习惯', '简单重复语言'] },
    milestones: ['独坐更稳', '手传递玩具', '发出简单音节']
  },
  7: {
    feeding: { milkAmount: '每次200-250ml', frequency: '每日4-5次', solidFoods: ['鸡肉泥', '三文鱼泥', '豆腐泥', '菠菜泥'] },
    toys: { type: '语言启蒙类', examples: ['发声玩具', '故事机', '手偶'], benefits: ['促进语言发展', '培养想象力', '学习社交互动'] },
    books: { type: '语言启蒙书', examples: ['《宝宝学说话》', '《语言启蒙绘本》', '《儿歌童谣》'], readingTips: ['重复词语', '鼓励模仿', '唱儿歌童谣'] },
    milestones: ['爬行', '发出"爸爸""妈妈"音', '用手势表达需求']
  },
  8: {
    feeding: { milkAmount: '每次200-250ml', frequency: '每日4次', solidFoods: ['小块软食', '面条', '粥', '碎菜'] },
    toys: { type: '运动能力类', examples: ['隧道玩具', '学步车', '大球'], benefits: ['锻炼爬行能力', '发展平衡感', '增强体质'] },
    books: { type: '认知百科', examples: ['《交通工具》', '《日常生活》', '《颜色形状》'], readingTips: ['指认物品', '教认颜色形状', '扩展词汇量'] },
    milestones: ['手膝爬行', '扶站', '理解简单指令']
  },
  9: {
    feeding: { milkAmount: '每次200-300ml', frequency: '每日3-4次', solidFoods: ['软米饭', '肉末', '蛋羹', '豆腐'] },
    toys: { type: '建构类', examples: ['大积木', '形状分类器', '拼图'], benefits: ['培养空间想象力', '发展逻辑思维', '锻炼手眼协调'] },
    books: { type: '想象力绘本', examples: ['《好饿的毛毛虫》', '《逃家小兔》', '《猜猜我有多爱你》'], readingTips: ['讲完整故事', '提问互动', '培养情感认知'] },
    milestones: ['扶走', '用拇指食指捏物', '拍手']
  },
  10: {
    feeding: { milkAmount: '每次200-300ml', frequency: '每日3次', solidFoods: ['米饭', '炒菜', '水果块', '酸奶'] },
    toys: { type: '角色扮演类', examples: ['娃娃家', '厨房玩具', '工具套装'], benefits: ['培养想象力', '学习社交技能', '发展语言能力'] },
    books: { type: '情感绘本', examples: ['《我爱妈妈》', '《我爱爸爸》', '《情绪小怪兽》'], readingTips: ['谈论情感', '联系自身经历', '培养同理心'] },
    milestones: ['独站', '挥手再见', '理解"不"']
  },
  11: {
    feeding: { milkAmount: '每次200-300ml', frequency: '每日2-3次', solidFoods: ['全家饭菜', '手指食物', '小点心'] },
    toys: { type: '音乐律动类', examples: ['小鼓', '沙锤', '跳舞毯'], benefits: ['培养节奏感', '发展音乐能力', '释放能量'] },
    books: { type: '数数绘本', examples: ['《数一数》', '《数字绘本》', '《颜色数字》'], readingTips: ['学数数', '唱数字儿歌', '玩数字游戏'] },
    milestones: ['独走', '说简单单词', '模仿动作']
  },
  12: {
    feeding: { milkAmount: '每日300-500ml', frequency: '每日2次', solidFoods: ['正常饭菜', '丰富辅食', '多样化饮食'] },
    toys: { type: '创意艺术类', examples: ['蜡笔', '橡皮泥', '贴纸'], benefits: ['培养创造力', '发展精细动作', '表达自我'] },
    books: { type: '经典绘本', examples: ['《彼得兔》', '《小熊温尼》', '《晚安，月亮》'], readingTips: ['讲复杂故事', '角色扮演', '复述故事'] },
    milestones: ['走得稳', '说简单句子', '自己用勺子吃饭']
  },
  18: {
    feeding: { milkAmount: '每日300-400ml', frequency: '每日2次', solidFoods: ['成人饮食', '独立进食', '健康零食'] },
    toys: { type: '益智类', examples: ['拼图', '积木', '形状配对'], benefits: ['发展认知能力', '培养专注力', '锻炼问题解决'] },
    books: { type: '科普绘本', examples: ['《神奇的大自然》', '《动物世界》', '《交通工具》'], readingTips: ['解释原理', '回答问题', '培养好奇心'] },
    milestones: ['跑', '跳', '说2-3个字的句子']
  },
  24: {
    feeding: { milkAmount: '每日300ml左右', frequency: '每日1-2次', solidFoods: ['均衡饮食', '自主进食', '尝试新食物'] },
    toys: { type: '社交互动类', examples: ['过家家', '积木城堡', '绘画工具'], benefits: ['学习社交规则', '发展想象力', '培养合作能力'] },
    books: { type: '故事绘本', examples: ['《小猪唏哩呼噜》', '《不一样的卡梅拉》', '《青蛙弗洛格》'], readingTips: ['深入讨论', '预测情节', '培养阅读习惯'] },
    milestones: ['双脚跳', '说完整句子', '自己穿简单衣物']
  },
  36: {
    feeding: { milkAmount: '每日300ml左右', frequency: '每日1次', solidFoods: ['完整饮食', '健康习惯', '自主选择'] },
    toys: { type: '建构创造类', examples: ['乐高', '磁性积木', '科学实验套装'], benefits: ['发展创造力', '培养科学思维', '锻炼动手能力'] },
    books: { type: '桥梁书', examples: ['《神奇校车》', '《贝贝熊》', '《长袜子皮皮》'], readingTips: ['独立阅读', '讨论主题', '写简单读后感'] },
    milestones: ['单脚站立', '说复杂句子', '自己如厕']
  }
};

const behaviors = [
  {
    id: 1,
    behavior: '频繁夜醒',
    ageRange: '0-12个月',
    interpretation: '宝宝夜间醒来是非常正常的现象，尤其是在婴儿期。这可能是由于饥饿、尿布湿了、身体不适或需要安抚。',
    causes: ['饥饿', '尿布湿了', '温度不适', '出牙不适', '分离焦虑', '白天过度兴奋'],
    suggestions: ['检查尿布是否需要更换', '尝试安抚后再喂奶', '保持室温舒适', '建立固定的睡前仪式', '白天保证充足睡眠', '夜间保持安静环境'],
    category: '睡眠'
  },
  {
    id: 2,
    behavior: '吃手',
    ageRange: '2-12个月',
    interpretation: '吃手是宝宝自我安抚和探索世界的方式。在婴儿期，手是宝宝认识自己身体和周围环境的重要工具。',
    causes: ['自我安抚', '出牙期牙龈不适', '探索世界', '无聊或困倦', '口欲期正常表现'],
    suggestions: ['保持手部清洁', '提供安全的牙胶', '不要强行阻止', '提供足够的玩具和刺激', '关注宝宝的情绪需求'],
    category: '口腔'
  },
  {
    id: 3,
    behavior: '扔东西',
    ageRange: '6-18个月',
    interpretation: '扔东西是宝宝学习因果关系的重要阶段。他们通过扔东西来观察物体的运动轨迹和声音，这是认知发展的正常表现。',
    causes: ['学习因果关系', '探索物理规律', '表达情绪', '寻求注意', '锻炼手部力量'],
    suggestions: ['提供安全的可扔玩具', '示范正确的行为', '用游戏方式引导', '给予积极反馈', '保持耐心不生气'],
    category: '认知'
  },
  {
    id: 4,
    behavior: '咬人',
    ageRange: '6-24个月',
    interpretation: '咬人通常发生在出牙期或宝宝不知道如何表达自己情绪的时候。这是宝宝探索和沟通的一种方式。',
    causes: ['出牙期牙龈不适', '表达愤怒或沮丧', '寻求关注', '模仿行为', '不知道如何表达需求'],
    suggestions: ['提供牙胶缓解出牙不适', '教导替代表达方式', '立即制止并说明原因', '转移注意力', '保持一致的反应'],
    category: '社交'
  },
  {
    id: 5,
    behavior: '粘人',
    ageRange: '8-24个月',
    interpretation: '粘人是宝宝建立安全依恋的正常表现。当宝宝意识到与照顾者分离时会感到不安，这是情感发展的重要阶段。',
    causes: ['分离焦虑', '环境变化', '感到不安全', '身体不适', '需要更多关注'],
    suggestions: ['建立安全感', '逐步分离', '保持稳定的日常', '给予足够的关注', '鼓励独立探索'],
    category: '情感'
  },
  {
    id: 6,
    behavior: '挑食',
    ageRange: '1-3岁',
    interpretation: '挑食是幼儿期常见的行为。宝宝可能对新食物感到陌生，或者正在尝试控制自己的饮食选择。',
    causes: ['对新食物的恐惧', '尝试独立', '口味偏好', '吃饭压力', '模仿家人行为'],
    suggestions: ['提供多样化食物', '让宝宝参与选择', '保持轻松的用餐氛围', '少量多餐', '以身作则', '不强迫进食'],
    category: '饮食'
  },
  {
    id: 7,
    behavior: '发脾气',
    ageRange: '1-3岁',
    interpretation: '发脾气是宝宝情绪发展的正常阶段。当宝宝无法用语言表达需求或感到挫败时，就可能通过发脾气来表达。',
    causes: ['语言能力不足', '需求未被满足', '过度疲劳', '环境变化', '自我意识发展'],
    suggestions: ['保持冷静', '理解并共情', '教导情绪表达', '提供选择', '转移注意力', '建立规则'],
    category: '情绪'
  },
  {
    id: 8,
    behavior: '拒绝睡觉',
    ageRange: '6个月-3岁',
    interpretation: '宝宝拒绝睡觉可能是因为过度兴奋、分离焦虑或对睡眠环境不适应。这是宝宝尝试控制自己生活的一种表现。',
    causes: ['白天睡眠过多', '睡前过度兴奋', '分离焦虑', '睡眠环境不适', '身体不适'],
    suggestions: ['建立固定的睡前仪式', '保持规律作息', '创造舒适的睡眠环境', '避免睡前刺激', '逐步培养独立入睡能力'],
    category: '睡眠'
  },
  {
    id: 9,
    behavior: '重复提问',
    ageRange: '2-5岁',
    interpretation: '重复提问是宝宝学习和巩固知识的方式。他们通过反复提问来理解世界，这是认知发展的重要表现。',
    causes: ['学习新知识', '寻求安全感', '测试成人反应', '语言发展', '好奇心驱使'],
    suggestions: ['耐心回答', '鼓励思考', '提供更多信息', '引导自主探索', '保持积极态度'],
    category: '认知'
  },
  {
    id: 10,
    behavior: '怕生',
    ageRange: '6-24个月',
    interpretation: '怕生是宝宝社会认知发展的正常表现。当宝宝开始区分熟人和陌生人时，会对陌生人产生警惕和不安。',
    causes: ['陌生人焦虑', '环境陌生', '安全感不足', '身体不适', '过度保护'],
    suggestions: ['逐步接触陌生人', '保持照顾者在场', '提供安全感', '避免强迫互动', '鼓励社交'],
    category: '社交'
  },
  {
    id: 11,
    behavior: '抢玩具',
    ageRange: '1-3岁',
    interpretation: '抢玩具是宝宝学习社交规则的过程。在这个阶段，宝宝还没有学会分享和轮流的概念。',
    causes: ['自我中心', '缺乏社交技能', '想要某个玩具', '寻求关注', '语言表达不足'],
    suggestions: ['教导分享概念', '提供足够玩具', '示范轮流游戏', '引导用语言表达', '及时干预'],
    category: '社交'
  },
  {
    id: 12,
    behavior: '说"不"',
    ageRange: '1-3岁',
    interpretation: '说"不"是宝宝自我意识发展的重要标志。这表明宝宝正在尝试独立，表达自己的意愿。',
    causes: ['自我意识觉醒', '测试边界', '表达独立', '寻求控制感', '语言能力发展'],
    suggestions: ['理解这是正常发展', '提供有限选择', '尊重宝宝意愿', '用游戏方式引导', '保持耐心'],
    category: '自我'
  }
];

const toys = [
  { id: 1, name: '黑白视觉卡', ageRange: '0-3个月', description: '高对比度的黑白图案，帮助宝宝发展视觉能力', benefits: ['促进视觉发育', '提高注意力', '培养好奇心'], icon: '⬛', gradient: 'linear-gradient(135deg, #2c3e50, #4ca1af)' },
  { id: 2, name: '触感球', ageRange: '0-6个月', description: '不同材质和纹理的球，帮助宝宝探索触觉', benefits: ['发展触觉感知', '锻炼抓握能力', '缓解出牙不适'], icon: '🔴', gradient: 'linear-gradient(135deg, #ff9a9e, #fecfef)' },
  { id: 3, name: '健身架', ageRange: '2-6个月', description: '悬挂各种玩具的健身架，宝宝躺着可以踢打玩耍', benefits: ['锻炼四肢力量', '促进手眼协调', '发展大运动'], icon: '🏋️', gradient: 'linear-gradient(135deg, #a8edea, #fed6e3)' },
  { id: 4, name: '牙胶', ageRange: '3-12个月', description: '安全无毒的牙胶，帮助缓解宝宝出牙期的牙龈不适', benefits: ['缓解出牙疼痛', '锻炼咀嚼能力', '满足口欲'], icon: '🦷', gradient: 'linear-gradient(135deg, #d4fc79, #96e6a1)' },
  { id: 5, name: '软积木', ageRange: '6-18个月', description: '柔软安全的积木，可以堆叠和投掷', benefits: ['发展空间意识', '锻炼手眼协调', '培养创造力'], icon: '🧱', gradient: 'linear-gradient(135deg, #84fab0, #8fd3f4)' },
  { id: 6, name: '形状配对盒', ageRange: '6-18个月', description: '需要将不同形状的积木放入对应形状的孔中', benefits: ['学习形状认知', '发展精细动作', '培养专注力'], icon: '🔷', gradient: 'linear-gradient(135deg, #a1c4fd, #c2e9fb)' },
  { id: 7, name: '叠叠杯', ageRange: '6-18个月', description: '可以堆叠和嵌套的杯子，帮助宝宝学习大小概念', benefits: ['理解大小概念', '锻炼手部力量', '培养耐心'], icon: '🥤', gradient: 'linear-gradient(135deg, #fbc2eb, #a6c1ee)' },
  { id: 8, name: '手偶', ageRange: '6-24个月', description: '可爱的动物手偶，可以用来讲故事和角色扮演', benefits: ['促进语言发展', '培养想象力', '学习社交互动'], icon: '🐻', gradient: 'linear-gradient(135deg, #ffecd2, #fcb69f)' },
  { id: 9, name: '拼图', ageRange: '1-3岁', description: '适合幼儿的简单拼图，培养观察力和逻辑思维', benefits: ['发展认知能力', '培养专注力', '锻炼手眼协调'], icon: '🧩', gradient: 'linear-gradient(135deg, #f6d365, #fda085)' },
  { id: 10, name: '过家家玩具', ageRange: '1-3岁', description: '厨房、医生等角色扮演玩具套装', benefits: ['培养想象力', '学习社交技能', '发展语言能力'], icon: '🍳', gradient: 'linear-gradient(135deg, #ffecd2, #fcb69f)' },
  { id: 11, name: '大积木', ageRange: '1-3岁', description: '大尺寸的木质或塑料积木，可以搭建各种造型', benefits: ['发展空间想象力', '锻炼动手能力', '培养创造力'], icon: '🏗️', gradient: 'linear-gradient(135deg, #a18cd1, #fbc2eb)' },
  { id: 12, name: '音乐玩具', ageRange: '6-36个月', description: '小鼓、沙锤、电子琴等音乐玩具', benefits: ['培养音乐感知', '发展节奏感', '释放能量'], icon: '🎵', gradient: 'linear-gradient(135deg, #667eea, #764ba2)' },
  { id: 13, name: '绘画工具', ageRange: '1-3岁', description: '安全无毒的蜡笔、水彩笔和画纸', benefits: ['培养创造力', '发展精细动作', '表达自我'], icon: '🎨', gradient: 'linear-gradient(135deg, #f093fb, #f5576c)' },
  { id: 14, name: '乐高积木', ageRange: '2-5岁', description: '经典的乐高积木套装，适合搭建各种模型', benefits: ['发展创造力', '培养空间思维', '锻炼动手能力'], icon: '🧱', gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
  { id: 15, name: '科学实验套装', ageRange: '3-5岁', description: '适合幼儿的简单科学实验玩具', benefits: ['培养科学兴趣', '发展逻辑思维', '探索自然规律'], icon: '🔬', gradient: 'linear-gradient(135deg, #43e97b, #38f9d7)' }
];

const books = [
  { id: 1, title: '黑白视觉卡', author: '视觉激发系列', ageRange: '0-3个月', description: '高对比度的黑白图案，刺激宝宝视觉发育', icon: '⬛', gradient: 'linear-gradient(135deg, #2c3e50, #4ca1af)' },
  { id: 2, title: '彩色视觉激发卡', author: '视觉激发系列', ageRange: '2-6个月', description: '丰富的色彩和图案，促进视觉发展', icon: '🎨', gradient: 'linear-gradient(135deg, #f093fb, #f5576c)' },
  { id: 3, title: '猜猜我是谁', author: '尼娜·兰登', ageRange: '3-12个月', description: '洞洞书经典，通过翻页互动认识动物', icon: '🐾', gradient: 'linear-gradient(135deg, #a8edea, #fed6e3)' },
  { id: 4, title: '小熊宝宝绘本', author: '佐佐木洋子', ageRange: '6-24个月', description: '培养宝宝生活习惯的经典绘本系列', icon: '🐻', gradient: 'linear-gradient(135deg, #ffecd2, #fcb69f)' },
  { id: 5, title: '好饿的毛毛虫', author: '艾瑞·卡尔', ageRange: '6-36个月', description: '充满想象力的故事，认识数字和水果', icon: '🐛', gradient: 'linear-gradient(135deg, #d4fc79, #96e6a1)' },
  { id: 6, title: '逃家小兔', author: '玛格丽特·怀兹·布朗', ageRange: '1-3岁', description: '温馨感人的母子情深故事', icon: '🐰', gradient: 'linear-gradient(135deg, #ff9a9e, #fecfef)' },
  { id: 7, title: '猜猜我有多爱你', author: '山姆·麦克布雷尼', ageRange: '1-3岁', description: '表达爱意的经典绘本', icon: '❤️', gradient: 'linear-gradient(135deg, #ffecd2, #fcb69f)' },
  { id: 8, title: '情绪小怪兽', author: '安娜·耶纳斯', ageRange: '1-3岁', description: '帮助宝宝认识和管理情绪', icon: '👾', gradient: 'linear-gradient(135deg, #667eea, #764ba2)' },
  { id: 9, title: '小猪唏哩呼噜', author: '孙幼军', ageRange: '2-5岁', description: '中国经典童话，幽默有趣', icon: '🐷', gradient: 'linear-gradient(135deg, #fbc2eb, #a6c1ee)' },
  { id: 10, title: '不一样的卡梅拉', author: '克里斯提昂·约里波瓦', ageRange: '2-5岁', description: '充满冒险精神的小鸡故事', icon: '🐔', gradient: 'linear-gradient(135deg, #f6d365, #fda085)' },
  { id: 11, title: '神奇校车', author: '乔安娜·柯尔', ageRange: '3-6岁', description: '科普桥梁书，探索科学奥秘', icon: '🚌', gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
  { id: 12, title: '贝贝熊', author: '斯坦·博丹', ageRange: '3-6岁', description: '家庭教育经典，培养良好习惯', icon: '🐻', gradient: 'linear-gradient(135deg, #84fab0, #8fd3f4)' },
  { id: 13, title: '长袜子皮皮', author: '阿斯特丽德·林格伦', ageRange: '3-6岁', description: '勇敢独立的小女孩故事', icon: '🧦', gradient: 'linear-gradient(135deg, #a18cd1, #fbc2eb)' },
  { id: 14, title: '青蛙弗洛格', author: '马克斯·维尔修思', ageRange: '2-4岁', description: '帮助宝宝认识情感和友谊', icon: '🐸', gradient: 'linear-gradient(135deg, #43e97b, #38f9d7)' },
  { id: 15, title: '晚安，月亮', author: '玛格丽特·怀兹·布朗', ageRange: '0-24个月', description: '温馨的睡前故事', icon: '🌙', gradient: 'linear-gradient(135deg, #667eea, #764ba2)' }
];

const vaccines = [
  { id: 1, name: '乙肝疫苗', age: 0, type: 'free', description: '预防乙型肝炎', notes: '出生后24小时内接种第一针' },
  { id: 2, name: '卡介苗', age: 0, type: 'free', description: '预防结核病', notes: '出生后24小时内接种' },
  { id: 3, name: '乙肝疫苗', age: 1, type: 'free', description: '预防乙型肝炎', notes: '第二针' },
  { id: 4, name: '脊灰疫苗', age: 2, type: 'free', description: '预防脊髓灰质炎', notes: '口服糖丸或注射' },
  { id: 5, name: '脊灰疫苗', age: 3, type: 'free', description: '预防脊髓灰质炎', notes: '第二针' },
  { id: 6, name: '百白破疫苗', age: 3, type: 'free', description: '预防百日咳、白喉、破伤风', notes: '第一针' },
  { id: 7, name: '脊灰疫苗', age: 4, type: 'free', description: '预防脊髓灰质炎', notes: '第三针' },
  { id: 8, name: '百白破疫苗', age: 4, type: 'free', description: '预防百日咳、白喉、破伤风', notes: '第二针' },
  { id: 9, name: '百白破疫苗', age: 5, type: 'free', description: '预防百日咳、白喉、破伤风', notes: '第三针' },
  { id: 10, name: '乙肝疫苗', age: 6, type: 'free', description: '预防乙型肝炎', notes: '第三针，完成基础免疫' },
  { id: 11, name: '流脑疫苗', age: 6, type: 'free', description: '预防流行性脑脊髓膜炎', notes: '第一针' },
  { id: 12, name: '流脑疫苗', age: 9, type: 'free', description: '预防流行性脑脊髓膜炎', notes: '第二针' },
  { id: 13, name: '麻腮风疫苗', age: 8, type: 'free', description: '预防麻疹、腮腺炎、风疹', notes: '第一针' },
  { id: 14, name: '乙脑疫苗', age: 8, type: 'free', description: '预防流行性乙型脑炎', notes: '第一针' },
  { id: 15, name: '乙脑疫苗', age: 24, type: 'free', description: '预防流行性乙型脑炎', notes: '第二针' },
  { id: 16, name: '麻腮风疫苗', age: 18, type: 'free', description: '预防麻疹、腮腺炎、风疹', notes: '第二针，加强免疫' },
  { id: 17, name: '百白破疫苗', age: 18, type: 'free', description: '预防百日咳、白喉、破伤风', notes: '加强针' },
  { id: 18, name: '甲肝疫苗', age: 18, type: 'free', description: '预防甲型肝炎', notes: '完成基础免疫' },
  { id: 19, name: '流脑疫苗', age: 36, type: 'free', description: '预防流行性脑脊髓膜炎', notes: '加强针' },
  { id: 20, name: '脊灰疫苗', age: 48, type: 'free', description: '预防脊髓灰质炎', notes: '加强针' },
  { id: 21, name: '流感疫苗', age: 6, type: 'optional', description: '预防流行性感冒', notes: '每年接种一次，自费' },
  { id: 22, name: '手足口病疫苗', age: 6, type: 'optional', description: '预防手足口病', notes: '6月龄-5岁，自费' },
  { id: 23, name: '轮状病毒疫苗', age: 2, type: 'optional', description: '预防轮状病毒腹泻', notes: '口服，自费' },
  { id: 24, name: '肺炎疫苗', age: 2, type: 'optional', description: '预防肺炎球菌感染', notes: '2月龄-5岁，自费' },
  { id: 25, name: '水痘疫苗', age: 12, type: 'optional', description: '预防水痘', notes: '1岁以上，自费' },
  { id: 26, name: 'Hib疫苗', age: 2, type: 'optional', description: '预防流感嗜血杆菌感染', notes: '2月龄-5岁，自费' },
  { id: 27, name: '五联疫苗', age: 2, type: 'optional', description: '替代百白破+脊灰+Hib', notes: '减少接种次数，自费' },
  { id: 28, name: '13价肺炎疫苗', age: 2, type: 'optional', description: '预防13种肺炎球菌', notes: '2月龄-5岁，自费' },
  { id: 29, name: '流感嗜血杆菌疫苗', age: 6, type: 'optional', description: '预防Hib引起的感染', notes: '自费' },
  { id: 30, name: 'EV71疫苗', age: 6, type: 'optional', description: '预防EV71型手足口病', notes: '6月龄-5岁，自费' }
];

const clothesItems = [
  { id: 1, name: '和尚服/蝴蝶衣', ageRange: '0-3个月', season: ['spring', 'autumn', 'winter'], category: '内衣', description: '系带设计，方便穿脱，适合刚出生的宝宝', tips: '选纯棉面料，前长后短防止尿湿', icon: '👶', gradient: 'linear-gradient(135deg, #ffecd2, #fcb69f)' },
  { id: 2, name: '包屁衣/三角哈衣', ageRange: '0-12个月', season: ['spring', 'summer', 'autumn', 'winter'], category: '内衣', description: '保护宝宝肚子不着凉，换尿布方便', tips: '夏季选短袖，冬季选长袖打底', icon: '👕', gradient: 'linear-gradient(135deg, #ff9a9e, #fecfef)' },
  { id: 3, name: '连体衣/爬服', ageRange: '0-24个月', season: ['spring', 'autumn'], category: '外出服', description: '上下连体，抱宝宝时不会露肚子', tips: '选按扣款，换尿布更方便', icon: '🧸', gradient: 'linear-gradient(135deg, #a8edea, #fed6e3)' },
  { id: 4, name: '分体套装', ageRange: '6-36个月', season: ['spring', 'autumn'], category: '外出服', description: '上衣和裤子分开，活动更自由', tips: '选松紧腰裤子，不勒肚子', icon: '👚', gradient: 'linear-gradient(135deg, #a1c4fd, #c2e9fb)' },
  { id: 5, name: '短袖T恤', ageRange: '3-60个月', season: ['summer'], category: '夏装', description: '透气舒适，适合炎热天气', tips: '选纯棉或竹纤维面料', icon: '☀️', gradient: 'linear-gradient(135deg, #84fab0, #8fd3f4)' },
  { id: 6, name: '短裤/七分裤', ageRange: '3-60个月', season: ['summer'], category: '夏装', description: '凉爽透气，方便活动', tips: '选宽松版型，不勒大腿', icon: '🩳', gradient: 'linear-gradient(135deg, #fbc2eb, #a6c1ee)' },
  { id: 7, name: '连衣裙', ageRange: '6-60个月', season: ['spring', 'summer'], category: '夏装', description: '女宝宝必备，可爱又方便', tips: '选A字版型，活动自如', icon: '👗', gradient: 'linear-gradient(135deg, #f093fb, #f5576c)' },
  { id: 8, name: '背心/马甲', ageRange: '0-60个月', season: ['spring', 'autumn', 'winter'], category: '外套', description: '保暖不臃肿，护前后心', tips: '春秋选薄款，冬季选夹棉款', icon: '🦺', gradient: 'linear-gradient(135deg, #f6d365, #fda085)' },
  { id: 9, name: '薄外套/开衫', ageRange: '3-60个月', season: ['spring', 'autumn'], category: '外套', description: '早晚温差大时穿，方便穿脱', tips: '选按扣或拉链款', icon: '🧥', gradient: 'linear-gradient(135deg, #667eea, #764ba2)' },
  { id: 10, name: '羽绒服/棉服', ageRange: '6-60个月', season: ['winter'], category: '冬装', description: '冬季保暖必备，轻便又暖和', tips: '选连帽款，护住头部和脖子', icon: '🧣', gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
  { id: 11, name: '秋衣秋裤套装', ageRange: '0-60个月', season: ['autumn', 'winter'], category: '内衣', description: '贴身保暖，冬季内搭必备', tips: '选纯棉磨毛面料更保暖', icon: '🧦', gradient: 'linear-gradient(135deg, #a18cd1, #fbc2eb)' },
  { id: 12, name: '睡袋/防踢被', ageRange: '0-36个月', season: ['spring', 'autumn', 'winter'], category: '睡衣', description: '防止宝宝踢被子着凉', tips: '根据室温选择厚度', icon: '😴', gradient: 'linear-gradient(135deg, #5ee7df, #b490ca)' },
  { id: 13, name: '纱布巾/包巾', ageRange: '0-6个月', season: ['spring', 'summer', 'autumn'], category: '用品', description: '可当包被、盖毯、浴巾使用', tips: '选纯棉纱布，透气吸汗', icon: '🛁', gradient: 'linear-gradient(135deg, #d4fc79, #96e6a1)' },
  { id: 14, name: '婴儿鞋/步前鞋', ageRange: '6-12个月', season: ['spring', 'autumn', 'winter'], category: '鞋类', description: '学步前穿，保护小脚', tips: '选软底鞋，不影响脚部发育', icon: '👟', gradient: 'linear-gradient(135deg, #ffecd2, #fcb69f)' },
  { id: 15, name: '学步鞋', ageRange: '12-36个月', season: ['spring', 'autumn', 'winter'], category: '鞋类', description: '学走路时穿，支撑脚踝', tips: '鞋底要防滑，鞋头要宽', icon: '🦶', gradient: 'linear-gradient(135deg, #f093fb, #f5576c)' },
  { id: 16, name: '袜子', ageRange: '0-60个月', season: ['spring', 'autumn', 'winter'], category: '用品', description: '保护宝宝小脚不着凉', tips: '选松口袜，不勒脚踝', icon: '🧦', gradient: 'linear-gradient(135deg, #a1c4fd, #c2e9fb)' },
  { id: 17, name: '帽子', ageRange: '0-60个月', season: ['spring', 'summer', 'autumn', 'winter'], category: '用品', description: '夏季遮阳，冬季保暖', tips: '夏季选宽檐遮阳帽，冬季选护耳帽', icon: '🎩', gradient: 'linear-gradient(135deg, #ff9a9e, #fecfef)' },
  { id: 18, name: '围嘴/口水巾', ageRange: '0-24个月', season: ['spring', 'summer', 'autumn', 'winter'], category: '用品', description: '防止口水和食物弄脏衣服', tips: '选防水款，方便清洁', icon: '👄', gradient: 'linear-gradient(135deg, #84fab0, #8fd3f4)' }
];

function getStoredRecords() {
  const records = localStorage.getItem('babyRecords');
  return records ? JSON.parse(records) : [];
}

function saveRecord(record) {
  const records = getStoredRecords();
  records.unshift(record);
  localStorage.setItem('babyRecords', JSON.stringify(records));
}

function deleteRecord(id) {
  const records = getStoredRecords();
  const filtered = records.filter(r => r.id !== id);
  localStorage.setItem('babyRecords', JSON.stringify(records));
}

function getStoredMoments() {
  const moments = localStorage.getItem('babyMoments');
  return moments ? JSON.parse(moments) : [];
}

function saveMoment(moment) {
  const moments = getStoredMoments();
  moments.unshift(moment);
  localStorage.setItem('babyMoments', JSON.stringify(moments));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function switchTab(tabName) {
  const dataTab = document.getElementById('data-tab');
  const momentsTab = document.getElementById('moments-tab');
  const tabBtns = document.querySelectorAll('.tab-btn');
  
  if (tabName === 'data') {
    dataTab.style.display = 'block';
    momentsTab.style.display = 'none';
  } else {
    dataTab.style.display = 'none';
    momentsTab.style.display = 'block';
    renderMomentsTimeline();
  }
  
  tabBtns.forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
}

function initMonthSelector() {
  const slider = document.getElementById('month-slider');
  const display = document.getElementById('month-display');
  
  if (slider && display) {
    slider.addEventListener('input', (e) => {
      const month = parseInt(e.target.value);
      display.textContent = month + ' 个月';
      updateRecommendations(month);
    });
    
    updateRecommendations(parseInt(slider.value));
  }
}

function updateRecommendations(month) {
  const rec = recommendations[month] || recommendations[6];
  
  const feedingCard = document.getElementById('feeding-card');
  const toysCard = document.getElementById('toys-card');
  const booksCard = document.getElementById('books-card');
  
  if (feedingCard) {
    feedingCard.innerHTML = `
      <div class="card-icon">🍼</div>
      <h3 class="card-title">喂养建议</h3>
      <p class="card-description">奶量: ${rec.feeding.milkAmount}<br>频率: ${rec.feeding.frequency}</p>
      <a href="feeding.html" class="card-link">查看详细 →</a>
    `;
  }
  
  if (toysCard) {
    toysCard.innerHTML = `
      <div class="card-icon">🧸</div>
      <h3 class="card-title">玩具推荐</h3>
      <p class="card-description">${rec.toys.type}: ${rec.toys.examples.slice(0, 2).join('、')}</p>
      <a href="toys.html" class="card-link">查看详细 →</a>
    `;
  }
  
  if (booksCard) {
    booksCard.innerHTML = `
      <div class="card-icon">📚</div>
      <h3 class="card-title">阅读建议</h3>
      <p class="card-description">${rec.books.type}: ${rec.books.examples.slice(0, 2).join('、')}</p>
      <a href="books.html" class="card-link">查看详细 →</a>
    `;
  }
  
  updateHomeVaccines(month);
}

function updateHomeVaccines(month) {
  const container = document.getElementById('home-vaccine-list');
  if (!container) return;
  
  const monthVaccines = vaccines.filter(v => v.age === month);
  
  if (monthVaccines.length === 0) {
    container.innerHTML = `
      <div class="vaccine-empty">
        <div class="vaccine-empty-icon">✨</div>
        <p>本月暂无需要接种的疫苗</p>
        <p class="vaccine-empty-tip">宝宝健康成长中~</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = monthVaccines.map(v => `
    <div class="home-vaccine-item">
      <div class="home-vaccine-icon">💉</div>
      <div class="home-vaccine-info">
        <div class="home-vaccine-name">${v.name}</div>
        <div class="home-vaccine-desc">${v.description}</div>
        <div class="home-vaccine-notes">${v.notes}</div>
      </div>
      <span class="vaccine-type ${v.type}">${v.type === 'free' ? '🆓 免费' : '💰 自费'}</span>
    </div>
  `).join('');
}

function initMobileMenu() {
  const menuBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');
  
  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });
  }
}

function initBehaviorPage() {
  const searchInput = document.getElementById('behavior-search');
  const categories = document.querySelectorAll('.category-tag');
  const behaviorList = document.getElementById('behavior-list');
  const modal = document.getElementById('behavior-modal');
  const modalClose = document.querySelector('.modal-close');
  
  let filteredBehaviors = behaviors;
  
  function renderBehaviors() {
    behaviorList.innerHTML = filteredBehaviors.map(b => `
      <div class="behavior-item" onclick="showBehaviorDetail(${b.id})">
        <h3>${b.behavior}</h3>
        <div class="age-range">适合月龄: ${b.ageRange}</div>
        <p class="short-desc">${b.interpretation.slice(0, 50)}...</p>
      </div>
    `).join('');
  }
  
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const keyword = e.target.value.toLowerCase();
      filteredBehaviors = behaviors.filter(b => 
        b.behavior.toLowerCase().includes(keyword) ||
        b.interpretation.toLowerCase().includes(keyword)
      );
      renderBehaviors();
    });
  }
  
  if (categories) {
    categories.forEach(cat => {
      cat.addEventListener('click', () => {
        categories.forEach(c => c.classList.remove('active'));
        cat.classList.add('active');
        
        const category = cat.dataset.category;
        if (category === 'all') {
          filteredBehaviors = behaviors;
        } else {
          filteredBehaviors = behaviors.filter(b => b.category === category);
        }
        renderBehaviors();
      });
    });
  }
  
  if (modalClose) {
    modalClose.addEventListener('click', () => {
      modal.classList.remove('active');
    });
  }
  
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  }
  
  renderBehaviors();
}

function showBehaviorDetail(id) {
  const behavior = behaviors.find(b => b.id === id);
  if (!behavior) return;
  
  const modal = document.getElementById('behavior-modal');
  const modalContent = modal.querySelector('.modal-content');
  
  modalContent.innerHTML = `
    <span class="modal-close" onclick="document.getElementById('behavior-modal').classList.remove('active')">&times;</span>
    <h2>${behavior.behavior}</h2>
    <div class="age-range">适合月龄: ${behavior.ageRange}</div>
    <h3>行为解读</h3>
    <p>${behavior.interpretation}</p>
    <h3>可能原因</h3>
    <ul>${behavior.causes.map(c => `<li>${c}</li>`).join('')}</ul>
    <h3>应对建议</h3>
    <ul>${behavior.suggestions.map(s => `<li>${s}</li>`).join('')}</ul>
  `;
  
  modal.classList.add('active');
}

function initGrowthPage() {
  const form = document.getElementById('growth-form');
  const recordsList = document.getElementById('records-list');
  const momentForm = document.getElementById('moment-form');
  const momentImage = document.getElementById('moment-image');
  const previewImage = document.getElementById('preview-image');
  
  function renderRecords() {
    const records = getStoredRecords();
    
    if (records.length === 0) {
      recordsList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📝</div>
          <h3>还没有成长记录</h3>
          <p>点击上方表单开始记录宝宝的成长吧！</p>
        </div>
      `;
      return;
    }
    
    recordsList.innerHTML = records.map(r => `
      <div class="growth-record-item">
        <div class="record-header">
          <span class="record-date">${r.date}</span>
          <span class="record-age">${r.babyAge}</span>
        </div>
        <div class="record-data">
          <div class="data-item">
            <div class="data-value">${r.height} cm</div>
            <div class="data-label">身高</div>
          </div>
          <div class="data-item">
            <div class="data-value">${r.weight} kg</div>
            <div class="data-label">体重</div>
          </div>
          <div class="data-item">
            <div class="data-value">${r.headCircumference} cm</div>
            <div class="data-label">头围</div>
          </div>
        </div>
        ${r.notes ? `<div class="record-notes">备注: ${r.notes}</div>` : ''}
      </div>
    `).join('');
  }
  
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const record = {
        id: generateId(),
        date: document.getElementById('record-date').value,
        babyAge: document.getElementById('baby-age').value,
        height: document.getElementById('height').value,
        weight: document.getElementById('weight').value,
        headCircumference: document.getElementById('head-circumference').value,
        notes: document.getElementById('notes').value
      };
      
      saveRecord(record);
      form.reset();
      renderRecords();
    });
  }
  
  if (momentImage && previewImage) {
    momentImage.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          previewImage.src = event.target.result;
          previewImage.style.display = 'block';
        };
        reader.readAsDataURL(file);
      }
    });
  }
  
  if (momentForm) {
    momentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const fileInput = document.getElementById('moment-image');
      const file = fileInput.files[0];
      
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const moment = {
          id: generateId(),
          date: document.getElementById('moment-date').value,
          babyAge: document.getElementById('moment-age').value,
          image: event.target.result,
          description: document.getElementById('moment-desc').value
        };
        
        saveMoment(moment);
        momentForm.reset();
        previewImage.style.display = 'none';
        renderMomentsTimeline();
      };
      reader.readAsDataURL(file);
    });
  }
  
  renderRecords();
}

function renderMomentsTimeline() {
  const timelineContainer = document.getElementById('moments-timeline');
  const moments = getStoredMoments();
  
  if (moments.length === 0) {
    timelineContainer.innerHTML = `
      <div class="moments-empty-state">
        <div class="empty-icon">📸</div>
        <h3>还没有成长瞬间</h3>
        <p>上传照片记录宝宝的美好时刻吧！</p>
      </div>
    `;
    return;
  }
  
  timelineContainer.innerHTML = `
    <div class="moments-timeline-container">
      ${moments.map((m, index) => `
        <div class="moment-item" style="animation-delay: ${index * 0.1}s;">
          <div class="moment-content">
            <img src="${m.image}" class="moment-image" alt="成长瞬间">
            <div class="moment-info">
              <div class="moment-date">📅 ${m.date}</div>
              <div class="moment-age">👶 ${m.babyAge}</div>
              <div class="moment-desc">${m.description || '记录下这个美好的瞬间 ❤️'}</div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function initFeedingPage() {
  const container = document.getElementById('feeding-container');
  if (!container) return;
  
  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24, 36];
  
  container.innerHTML = months.map(month => {
    const rec = recommendations[month];
    return `
      <div class="feeding-card">
        <h3>${month}个月宝宝</h3>
        <div class="milk-amount">${rec.feeding.milkAmount}</div>
        <div class="frequency">${rec.feeding.frequency}</div>
        <h4>辅食建议:</h4>
        <ul>${rec.feeding.solidFoods.map(f => `<li>${f}</li>`).join('')}</ul>
      </div>
    `;
  }).join('');
}

function initToysPage() {
  const container = document.getElementById('toys-container');
  if (!container) return;
  
  container.innerHTML = toys.map(toy => `
    <div class="toy-item">
      <div class="toy-image" style="background: ${toy.gradient};">
        <span class="toy-icon">${toy.icon}</span>
      </div>
      <div class="toy-info">
        <h3>${toy.name}</h3>
        <span class="age-tag">${toy.ageRange}</span>
        <p>${toy.description}</p>
        <div class="benefits">✨ ${toy.benefits.join(' | ')}</div>
      </div>
    </div>
  `).join('');
}

function initBooksPage() {
  const container = document.getElementById('books-container');
  if (!container) return;
  
  container.innerHTML = books.map(book => `
    <div class="book-item">
      <div class="book-cover" style="background: ${book.gradient};">
        <span class="book-icon">${book.icon}</span>
      </div>
      <div class="book-info">
        <h3>${book.title}</h3>
        <div class="author">${book.author}</div>
        <span class="age-tag">${book.ageRange}</span>
        <p>${book.description}</p>
      </div>
    </div>
  `).join('');
}

function renderVaccines(filterAge = 'all') {
  const container = document.getElementById('vaccine-container');
  if (!container) return;
  
  let filteredVaccines = vaccines;
  if (filterAge !== 'all') {
    filteredVaccines = vaccines.filter(v => v.age === parseInt(filterAge));
  }
  
  const grouped = filteredVaccines.reduce((acc, v) => {
    if (!acc[v.age]) acc[v.age] = [];
    acc[v.age].push(v);
    return acc;
  }, {});
  
  const sortedAges = Object.keys(grouped).sort((a, b) => parseInt(a) - parseInt(b));
  
  if (sortedAges.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">💉</div>
        <h3>该月龄暂无疫苗接种计划</h3>
        <p>请选择其他月龄查看</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = sortedAges.map(age => `
    <div class="vaccine-group">
      <div class="vaccine-age-header">
        <span class="age-number">${age === '0' ? '出生' : age + '个月'}</span>
      </div>
      <div class="vaccine-list">
        ${grouped[age].map(v => `
          <div class="vaccine-item">
            <div class="vaccine-icon">💉</div>
            <div class="vaccine-content">
              <div class="vaccine-header">
                <h3>${v.name}</h3>
                <span class="vaccine-type ${v.type}">${v.type === 'free' ? '🆓 免费' : '💰 自费'}</span>
              </div>
              <p class="vaccine-desc">${v.description}</p>
              <div class="vaccine-notes">📌 ${v.notes}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function filterVaccines() {
  const select = document.getElementById('vaccine-age');
  const age = select.value;
  renderVaccines(age);
}

function initVaccinePage() {
  renderVaccines();
}

function renderClothes(ageFilter = 'all', seasonFilter = 'all') {
  const container = document.getElementById('clothes-container');
  if (!container) return;
  
  let filtered = clothesItems;
  
  if (ageFilter !== 'all') {
    const [start, end] = ageFilter.split('-').map(Number);
    filtered = filtered.filter(item => {
      const [itemStart, itemEnd] = item.ageRange.replace('个月').replace('岁', '').split('-').map(s => {
        const num = parseInt(s);
        return s.includes('岁') ? num * 12 : num;
      });
      return start < itemEnd && end > itemStart;
    });
  }
  
  if (seasonFilter !== 'all') {
    filtered = filtered.filter(item => item.season.includes(seasonFilter));
  }
  
  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">👕</div>
        <h3>暂无匹配的衣服推荐</h3>
        <p>试试其他筛选条件</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = filtered.map(item => `
    <div class="clothes-card">
      <div class="clothes-image" style="background: ${item.gradient};">
        <span class="clothes-icon">${item.icon}</span>
      </div>
      <div class="clothes-content">
        <div class="clothes-category">${item.category}</div>
        <h3>${item.name}</h3>
        <p class="clothes-desc">${item.description}</p>
        <div class="clothes-meta">
          <span class="clothes-age">👶 ${item.ageRange}</span>
          <span class="clothes-season">${item.season.map(s => {
            const map = { spring: '🌸', summer: '☀️', autumn: '🍂', winter: '❄️' };
            return map[s] || '';
          }).join('')}</span>
        </div>
        <div class="clothes-tips">💡 ${item.tips}</div>
      </div>
    </div>
  `).join('');
}

function filterClothes() {
  const ageSelect = document.getElementById('clothes-age');
  const seasonSelect = document.getElementById('clothes-season');
  renderClothes(ageSelect.value, seasonSelect.value);
}

function initClothesPage() {
  renderClothes();
}

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  
  if (document.getElementById('month-slider')) {
    initMonthSelector();
  }
  
  if (document.getElementById('behavior-list')) {
    initBehaviorPage();
  }
  
  if (document.getElementById('records-list')) {
    initGrowthPage();
  }
  
  if (document.getElementById('feeding-container')) {
    initFeedingPage();
  }
  
  if (document.getElementById('toys-container')) {
    initToysPage();
  }
  
  if (document.getElementById('books-container')) {
    initBooksPage();
  }
  
  if (document.getElementById('vaccine-container')) {
    initVaccinePage();
  }
  
  if (document.getElementById('clothes-container')) {
    initClothesPage();
  }
});
