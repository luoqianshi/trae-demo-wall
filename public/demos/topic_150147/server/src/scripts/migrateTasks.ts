/**
 * 项目升级迁移脚本
 * 1. 删除16个教育价值低的任务
 * 2. 新增16个教育价值高的任务
 * 3. 更新tasks_v3.json
 * 4. 重置数据库
 */

import fs from 'fs';
import path from 'path';
import db from '../config/database';

// ============================================================
// 要删除的任务列表
// ============================================================
const TITLES_TO_REMOVE = [
  '折纸动物园', '扎染手帕魔法', '纸板机器人伙伴', '橡皮泥定格动画',
  '石头彩绘小精灵', '纸箱城堡', '自制贺卡',
  '打地鼠大作战', '二维码生成器', '简单聊天机器人',
  '星座观察家', '自然声音地图',
  '睡眠日记', '运动打卡', '时间管理大师', '社区志愿服务',
];

// ============================================================
// 风格模板
// ============================================================
function makeSteps(title: string, steps: string[]): any[] {
  const stepTemplates = [
    { title: '准备材料', content: '', image_desc: 'materials and tools neatly arranged on a desk' },
    { title: '学习探究', content: '', image_desc: 'learning process with reference materials and notes' },
    { title: '动手实践', content: '', image_desc: 'hands-on activity in progress' },
    { title: '观察记录', content: '', image_desc: 'notebook and observation tools' },
    { title: '思考分析', content: '', image_desc: 'analysis and reflection with diagrams' },
    { title: '展示分享', content: '', image_desc: 'final result presentation and display' },
  ];
  return steps.map((s, i) => ({
    step: i + 1,
    title: stepTemplates[i].title,
    content: s,
    image_prompt: `${title} project, ${stepTemplates[i].image_desc}, educational illustration, clean and simple style`
  }));
}

// ============================================================
// 16个新任务
// ============================================================
const NEW_TASKS = [
  // ========== 生活实践 (6个) ==========
  {
    title: '红绿灯与交通规则',
    description: '你每天上学放学都要过马路，你知道红绿灯为什么是红黄绿三种颜色吗？斑马线、停止线、各种交通标志都代表什么意思？在这个项目中，你将成为一名"交通安全小卫士"，学习交通规则，制作交通安全宣传海报，保护自己和家人！',
    category: 'life',
    difficulty: 'beginner',
    grade_level: '1-3',
    estimated_time: '30分钟',
    requirements: '1. 准备材料：纸、彩笔、尺子、交通标志图片（可从网上搜索打印）\n2. 学习红绿灯三种颜色的含义和三灯顺序\n3. 认识常见交通标志：斑马线、停止线、禁止通行、注意行人等\n4. 和家人一起模拟过马路场景\n5. 制作一张交通安全宣传海报\n6. 向家人分享你学到的交通知识',
    reference_materials: '1. 视频推荐：搜索"儿童交通安全教育"\n2. 知识卡片：红灯停、绿灯行、黄灯亮了等一等\n3. 安全口诀：过马路，左右看，不在路上跑和玩\n4. 拓展知识：为什么选红黄绿？红色波长最长，穿透力最强；绿色与红色对比明显；黄色是警示色',
    visual_prompt: 'Traffic light with red yellow green lights on a pole, crosswalk zebra stripes on the road, various traffic signs like stop sign and pedestrian crossing sign, child safety education poster scene, bright and clear illustration',
    steps: makeSteps('红绿灯与交通规则', [
      '准备材料：白纸、彩笔、尺子、交通标志图片、剪刀、胶水',
      '学习红绿灯知识：红黄绿三种颜色的含义，三灯亮起的顺序，为什么选这三种颜色',
      '认识交通标志：斑马线、停止线、人行天桥、注意儿童、禁止通行等至少10个标志',
      '和家人模拟过马路：一停二看三通过，左看右看再左看，举手示意过马路',
      '思考：为什么有的路口没有红绿灯？没有红绿灯时怎么安全过马路？',
      '制作交通安全海报并向家人展示讲解',
    ]),
  },
  {
    title: '地震逃生我知道',
    description: '地震是一种可怕的自然灾害，但如果我们掌握了正确的逃生方法，就能保护自己！你知道地震来了应该躲在哪里吗？家里哪些地方是安全的？在这个项目中，你将学习地震逃生知识，制定家庭逃生计划，成为家里的"安全小卫士"！',
    category: 'life',
    difficulty: 'beginner',
    grade_level: '1-6',
    estimated_time: '40分钟',
    requirements: '1. 学习地震基本知识：地震是怎么发生的、震级和烈度的概念\n2. 记住避震口诀：伏地、遮挡、手抓牢（Drop, Cover, Hold On）\n3. 找出家里每个房间的安全三角区（坚固桌子下、内墙墙角等）\n4. 绘制家庭地震逃生路线图\n5. 准备家庭应急包（水、食物、手电筒、急救用品等）\n6. 和家人进行一次地震逃生演练',
    reference_materials: '1. 视频推荐：搜索"地震避险科普"\n2. 避震口诀：伏地、遮挡、手抓牢\n3. 安全位置：坚固桌子下、内墙墙角、卫生间（空间小、管道多）\n4. 危险位置：窗户旁、吊灯下、外墙、电梯\n5. 科学原理：地震波传播，P波先到（纵波，上下颠），S波后到（横波，左右摇），P波到达时是最佳逃生时间',
    visual_prompt: 'Earthquake safety education scene, a sturdy table with a person-sized space underneath labeled as safe zone, emergency backpack with flashlight water and first aid kit, floor plan of a house with red escape route arrows drawn on paper, safety education poster, bright warm illustration',
    steps: makeSteps('地震逃生我知道', [
      '准备材料：纸、笔、尺子、红色水彩笔、应急包物品清单',
      '学习地震知识：地震是怎么发生的（板块运动），震级和烈度的区别，P波和S波的概念',
      '找出家中安全区域：每个房间的坚固桌子下、内墙墙角、卫生间，用红笔标记在平面图上',
      '绘制家庭逃生路线图，标注每个房间的"伏地遮挡手抓牢"位置和集合点',
      '思考：如果在学校、商场、户外遇到地震，应该怎么做？',
      '准备应急包并向家人展示完整的逃生方案',
    ]),
  },
  {
    title: '食品安全我最懂',
    description: '你爱吃的零食真的安全吗？包装袋上那些密密麻麻的小字都写了什么？什么是"三无产品"？在这个项目中，你将成为一名"食品安全侦探"，学会读懂食品包装上的秘密，辨别健康食品和垃圾食品，保护自己和家人的健康！',
    category: 'life',
    difficulty: 'beginner',
    grade_level: '3-6',
    estimated_time: '40分钟',
    requirements: '1. 收集家里5-10种食品包装袋（零食、饮料、调味品等）\n2. 学习识别食品标签：生产日期、保质期、配料表、营养成分表\n3. 了解什么是"三无产品"（无生产日期、无质量合格证、无生产厂家）\n4. 对比不同食品的配料表，找出哪些添加剂比较多\n5. 制作一张"健康食品VS垃圾食品"对比海报\n6. 向家人分享你的食品安全知识',
    reference_materials: '1. 视频推荐：搜索"儿童食品安全教育"\n2. 食品标签怎么看：配料表按含量从多到少排列，排第一的说明含量最多\n3. 常见添加剂：防腐剂（苯甲酸钠）、色素（柠檬黄）、甜味剂（阿斯巴甜）\n4. 健康饮食原则：多吃天然食物，少吃加工食品；多喝水，少喝含糖饮料',
    visual_prompt: 'Food packaging inspection scene, several snack packages with ingredient labels visible, magnifying glass examining food labels, nutrition facts table close-up, healthy food vs junk food comparison chart on paper, clean kitchen table setting',
    steps: makeSteps('食品安全我最懂', [
      '准备材料：收集5-10种食品包装袋（零食、饮料、调味品等），白纸，彩笔',
      '学习识别食品标签：找到生产日期、保质期、配料表、营养成分表、SC编号（食品生产许可证）',
      '对比分析：把每种食品的配料表前5位写下来，数一数有多少种添加剂',
      '制作"健康食品VS垃圾食品"对比表，按配料表长短、添加剂多少来排序',
      '思考：为什么有些食品保质期特别长？配料表越短的食品就越好吗？',
      '制作食品安全知识海报，向家人展示你的发现',
    ]),
  },
  {
    title: '用电安全我知道',
    description: '电是我们生活中离不开的好帮手，但如果不小心，它也可能变成"电老虎"！你知道湿手不能碰插座吗？为什么小鸟站在电线上不会触电？在这个项目中，你将学习用电安全知识，排查家里的用电隐患，成为"安全用电小达人"！',
    category: 'life',
    difficulty: 'beginner',
    grade_level: '2-5',
    estimated_time: '35分钟',
    requirements: '1. 学习电的基本知识：什么是电、导体和绝缘体\n2. 记住用电安全"五不"：不湿手摸电器、不插拔正在使用的插头、不乱拉电线、不碰裸露的电线、不在高压线下玩耍\n3. 认识绝缘体和导体：塑料、木头、橡胶是绝缘体；金属、水、人体是导体\n4. 和家人一起排查家里的用电隐患（老化电线、插座过载、电器靠近水源等）\n5. 制作一张家庭用电安全提示卡\n6. 了解触电急救的基本方法',
    reference_materials: '1. 视频推荐：搜索"儿童用电安全教育"\n2. 安全用电口诀：电老虎，看不见，湿手不碰插头和线\n3. 导体和绝缘体：金属、水、人体是导体（能导电）；塑料、橡胶、木头、玻璃是绝缘体（不导电）\n4. 小鸟为什么站在电线上不会被电？因为小鸟两只脚站在同一根电线上，没有形成电压差，电流不通过身体',
    visual_prompt: 'Electrical safety education scene, electrical outlet with safety cover, various household appliances with safety labels, a diagram showing conductor vs insulator materials, danger warning signs near electrical equipment, clean bright educational illustration',
    steps: makeSteps('用电安全我知道', [
      '准备材料：纸、笔、彩笔、不干胶贴纸（用来做安全标签）',
      '学习电的基础知识：电是什么、电流怎么流动、什么是导体和绝缘体',
      '认识导体和绝缘体：列举生活中常见的导体（铁丝、水、人体）和绝缘体（塑料、木头、橡胶）',
      '排查家中用电隐患：检查插座是否过载、电线是否老化、电器是否靠近水源',
      '思考：为什么小鸟站在电线上不会触电？为什么插头有3个脚？为什么保险丝会熔断？',
      '制作"家庭用电安全提示卡"贴在家里显眼位置，并向家人讲解',
    ]),
  },
  {
    title: '防溺水安全教育',
    description: '夏天到了，游泳是最好玩的运动之一，但水也可能很危险！你知道如果不小心掉进水里该怎么办吗？什么是"叫叫伸抛划"？在这个项目中，你将学习防溺水知识，掌握基本的自救方法，安全快乐地度过夏天！',
    category: 'life',
    difficulty: 'beginner',
    grade_level: '1-6',
    estimated_time: '35分钟',
    requirements: '1. 学习防溺水"六不"：不私自下水、不擅自结伴游泳、不在无家长带领时游泳、不到无安全设施水域游泳、不到不熟悉水域游泳、不盲目下水施救\n2. 记住溺水救援"五字诀"：叫（大声呼救）、叫（拨打110/120）、伸（用竹竿树枝伸过去）、抛（抛救生圈漂浮物）、划（划船过去）\n3. 学习水中自救：保持冷静、仰面漂浮、保存体力\n4. 认识危险水域：水库、河流、水坑、海边暗流\n5. 制作防溺水安全宣传画\n6. 向家人和朋友分享你学到的安全知识',
    reference_materials: '1. 视频推荐：搜索"中小学生防溺水安全教育"\n2. 防溺水"六不"口诀\n3. 救援五字诀：叫、叫、伸、抛、划\n4. 为什么会溺水？人体密度略大于水，不会游泳时身体下沉；肺部充满空气时可以浮起来\n5. 科学原理：水的浮力，人体的密度约1.02g/cm³（略大于水），所以人自然会下沉，需要靠游泳动作或仰面漂浮来利用浮力',
    visual_prompt: 'Water safety education scene, a swimming pool with safety ring and life jacket, warning signs near water body, a simple diagram showing water rescue methods, bright summer day with blue water, educational safety poster illustration',
    steps: makeSteps('防溺水安全教育', [
      '准备材料：纸、彩笔、蓝色水彩笔、安全标志图片',
      '学习防溺水"六不"原则，理解每一项背后的原因',
      '学习救援五字诀"叫叫伸抛划"，用图画演示每个步骤',
      '了解水中自救方法：保持冷静不要慌、仰面漂浮、保存体力不乱扑腾',
      '思考：为什么水库比游泳池更危险？为什么看到有人落水不能直接跳下去救？',
      '制作防溺水宣传画，向家人模拟演练救援方法',
    ]),
  },
  {
    title: '认识人民币',
    description: '你平时用钱买东西吗？你知道人民币上有哪些图案吗？1元、5元、10元、20元、50元、100元分别是什么颜色？怎么辨别真假钱？在这个项目中，你将学习认识人民币，了解基本的购物和找零，成为"小小理财家"！',
    category: 'life',
    difficulty: 'beginner',
    grade_level: '1-3',
    estimated_time: '30分钟',
    requirements: '1. 准备好各种面额的人民币（1元、5元、10元、20元、50元、100元）\n2. 观察每种面额的颜色、图案、大小\n3. 学习元角分的关系：1元=10角=100分\n4. 和家长模拟购物场景：定价、付款、找零\n5. 制作一张"人民币面额认知表"\n6. 了解电子支付和现金支付的区别',
    reference_materials: '1. 视频推荐：搜索"儿童认识人民币"\n2. 人民币面额：100元（红色，毛主席像，人民大会堂）、50元（绿色，布达拉宫）、20元（棕色，桂林山水）、10元（蓝色，长江三峡）、5元（紫色，泰山）、1元（橄榄绿，三潭印月）\n3. 换算口诀：1元=10角，1角=10分，1元=100分\n4. 找零练习：买一个3.5元的东西，给10元，应该找多少钱？',
    visual_prompt: 'Chinese RMB banknotes of different denominations arranged neatly on a wooden table, 100 yuan red, 50 yuan green, 20 yuan brown, 10 yuan blue, 5 yuan purple, 1 yuan green, coins, a piggy bank, calculator, notebook with price calculations, bright educational illustration',
    steps: makeSteps('认识人民币', [
      '准备材料：各种面额的人民币纸币和硬币，纸、笔、计算器',
      '认识每种面额：颜色、正面图案（毛主席像）、背面图案（风景名胜）、大小区别',
      '学习元角分换算：1元=10角=100分，用硬币和纸币做换算练习',
      '模拟购物：设定商品价格，练习付款和找零计算',
      '思考：为什么同样的东西，用现金和手机支付价格一样吗？如果没有零钱怎么办？',
      '制作"人民币面额认知表"并向家人展示你的购物找零计算',
    ]),
  },

  // ========== 科学实验 (4个) ==========
  {
    title: '磁铁探秘',
    description: '磁铁是一个神奇的东西，它能吸住铁钉，却吸不住塑料和木头！你知道磁铁有哪两极吗？为什么指南针总是指向南方？在这个实验中，你将探索磁铁的神奇力量，发现看不见的磁场！',
    category: 'science',
    difficulty: 'beginner',
    grade_level: '2-5',
    estimated_time: '35分钟',
    requirements: '1. 准备材料：条形磁铁（或冰箱贴磁铁）、铁钉、回形针、铜线、塑料片、木片、纸片、指南针\n2. 测试哪些材料能被磁铁吸住，哪些不能\n3. 观察磁铁有两极：N极（北极）和S极（南极），同极相斥、异极相吸\n4. 用铁屑观察磁力线（将铁屑撒在纸上，磁铁放在纸下）\n5. 用磁铁磁化铁钉（用磁铁一端沿一个方向摩擦铁钉多次）\n6. 了解磁铁在生活中的应用：冰箱贴、门吸、磁悬浮列车',
    reference_materials: '1. 视频推荐：搜索"磁铁实验 小学生"\n2. 磁性材料：铁、镍、钴能被磁铁吸引；铜、铝、塑料、木头不能被吸引\n3. 磁极规律：同极相斥，异极相吸\n4. 地球是一个大磁铁：地磁南极在地理北极附近，地磁北极在地理南极附近\n5. 科学原理：磁铁周围存在磁场，磁力线从N极出发回到S极；铁屑沿磁力线排列，形成可见的磁场图案',
    visual_prompt: 'Bar magnet on a wooden table with iron filings scattered around showing magnetic field lines pattern, paper clips and nails being attracted to the magnet, compass pointing north, various metal and non-metal objects being tested, clean simple science experiment illustration',
    steps: makeSteps('磁铁探秘', [
      '准备材料：条形磁铁、铁钉、回形针、铜线、塑料片、木片、纸片、指南针',
      '分类测试：用磁铁依次接触各种材料，记录哪些能被吸住、哪些不能，总结磁性材料的规律',
      '观察磁极：用两个磁铁靠近，记录什么情况下相吸、什么情况下相斥',
      '观察磁力线：将铁屑均匀撒在白纸上，磁铁放在纸下面，轻轻敲击纸面，观察铁屑排列的图案',
      '思考：为什么指南针总是指向南方？地球本身是一个大磁铁吗？磁悬浮列车是怎么浮起来的？',
      '绘出你观察到的磁力线图案，向家人展示磁铁的神奇力量',
    ]),
  },
  {
    title: '光的折射与彩虹',
    description: '你有没有见过彩虹？彩虹是怎么形成的？为什么把筷子放进水里看起来像断了？这些都是"光的折射"造成的！在这个实验中，你将用一杯水、一面镜子、一个手电筒，亲手制造彩虹，探索光的奇妙世界！',
    category: 'science',
    difficulty: 'beginner',
    grade_level: '2-5',
    estimated_time: '35分钟',
    requirements: '1. 准备材料：透明玻璃杯、水、小镜子、手电筒（或手机闪光灯）、白纸、CD光盘\n2. 筷子放入水中观察弯折现象\n3. 用镜子和水制造彩虹（镜子斜放入水中，照射阳光或手电筒）\n4. 用CD光盘观察光的色散（光盘反光面可以看到彩虹色）\n5. 用三棱镜（如果有）或装满水的玻璃杯折射阳光\n6. 记录彩虹的七种颜色：红橙黄绿蓝靛紫',
    reference_materials: '1. 视频推荐：搜索"光的折射实验 小学生"\n2. 彩虹七色：红、橙、黄、绿、蓝、靛、紫（从外到内）\n3. 科学原理：光从一种介质（空气）进入另一种介质（水）时，传播方向会发生改变，这就是折射。不同颜色的光折射角度不同，白光被分解成七色光，这就是色散。雨后天空中的小水滴就像无数个小三棱镜，把阳光分解成彩虹\n4. 为什么筷子看起来弯了？光从水中进入空气时发生折射，我们看到的筷子位置和实际位置不同',
    visual_prompt: 'Glass of water with a pencil appearing bent at the water line, a small mirror placed diagonally in water creating a rainbow spectrum on white paper, CD disc reflecting rainbow colors, prism splitting white light into seven colors, clean science experiment table setup',
    steps: makeSteps('光的折射与彩虹', [
      '准备材料：透明玻璃杯、水、筷子、小镜子、手电筒、白纸、CD光盘',
      '筷子弯折实验：将筷子放入水杯中，从侧面观察筷子在水面处"折断"的现象',
      '制造彩虹：将镜子斜放入水中，用手电筒照射镜子，调整角度直到白纸上出现彩虹光带',
      '色散观察：用CD光盘反光面对准阳光或手电筒，观察光盘表面出现的彩虹色',
      '思考：为什么彩虹是弯的（弧形）？为什么红色在最外面？为什么中午看不到彩虹？',
      '画出彩虹七色顺序，并用文字解释彩虹的形成原理',
    ]),
  },
  {
    title: '简单电路',
    description: '按下开关，灯泡亮了！你知道这是怎么做到的吗？在这个实验中，你将用电池、导线和小灯泡，亲手搭建一个最简单的电路，理解电流是怎么流动的，还能尝试串联和并联两种不同的连接方式！',
    category: 'science',
    difficulty: 'beginner',
    grade_level: '3-6',
    estimated_time: '40分钟',
    requirements: '1. 准备材料：1.5V电池（2节）、带底座的电池盒、小灯泡（2个）、导线（若干）、开关、电工胶带\n2. 搭建最简单的电路：电池→导线→开关→灯泡→导线→电池（一个回路）\n3. 观察开关闭合时灯泡亮、断开时灯泡灭\n4. 尝试串联电路：两个灯泡串在一起，观察亮度变化\n5. 尝试并联电路：两个灯泡并排连接，观察亮度变化\n6. 了解导体和绝缘体在电路中的角色',
    reference_materials: '1. 视频推荐：搜索"简单电路实验 小学生"\n2. 电路三要素：电源（电池）、导线、用电器（灯泡）\n3. 串联：两个灯泡串在一起，电流只有一条路，灯泡亮度变暗\n4. 并联：两个灯泡并排，电流有两条路，灯泡亮度不变\n5. 科学原理：电流从电池正极出发，经过导线和用电器，回到电池负极，形成一个完整的回路，灯泡才能亮。如果回路断开（开关断开），电流不流通，灯泡就灭了',
    visual_prompt: 'Simple electric circuit on a wooden table, battery connected to wires and a small light bulb through a switch, the bulb glowing softly, neat arrangement of electronic components, two circuits showing series and parallel connections, hands-free educational science experiment',
    steps: makeSteps('简单电路', [
      '准备材料：1.5V电池、电池盒、小灯泡（2个）、导线、开关、电工胶带',
      '搭建基本电路：将电池、导线、开关、灯泡连接成一个完整回路，闭合开关观察灯泡亮起',
      '串联实验：将两个灯泡串联接入电路，闭合开关，观察两个灯泡的亮度变化',
      '并联实验：将两个灯泡并联接入电路，闭合开关，观察两个灯泡的亮度变化',
      '思考：串联和并联有什么区别？家里插座是串联还是并联？为什么电池有正负极？',
      '画出你搭建的三种电路图，向家人展示并解释串联和并联的区别',
    ]),
  },
  {
    title: '认识人体器官',
    description: '你的身体里藏着好多神奇的器官！心脏像一个永远不会停的水泵，肺像两个气球，肝脏是身体的"化工厂"，肾脏是"过滤器"……在这个项目中，你将认识人体最重要的器官，了解它们的位置和功能，成为"人体小专家"！',
    category: 'science',
    difficulty: 'beginner',
    grade_level: '2-5',
    estimated_time: '35分钟',
    requirements: '1. 准备材料：大白纸（可画人体轮廓）、彩笔、人体器官图（可从网上搜索打印）\n2. 在大白纸上画出人体轮廓\n3. 学习主要器官：大脑、心脏、肺、肝脏、胃、肾脏、小肠、大肠\n4. 了解每个器官的位置和在轮廓图上标注\n5. 学习每个器官的简单功能\n6. 制作"人体器官认知图"',
    reference_materials: '1. 视频推荐：搜索"儿童人体器官认知"\n2. 器官功能口诀：大脑想问题，心脏泵血液，肺部来呼吸，肝脏解毒素，胃来消化食，肾脏过滤血\n3. 器官位置：大脑在头骨里，心脏在胸腔偏左，肺在胸腔两侧，肝脏在右上腹，胃在左上腹，肾脏在后腰两侧\n4. 有趣知识：心脏每天跳动约10万次；小肠展开有6-7米长；大脑有约860亿个神经元',
    visual_prompt: 'Human body anatomy educational chart, outline of human body with major organs labeled and color-coded, brain heart lungs liver stomach kidneys intestines, each organ with a simple icon, bright colorful educational illustration for children, clean medical diagram style',
    steps: makeSteps('认识人体器官', [
      '准备材料：大白纸、彩笔、人体器官参考图',
      '在大白纸上画出人体轮廓（可以躺在地上让家人帮忙描边）',
      '学习8个主要器官的名称、位置和功能：大脑、心脏、肺、肝脏、胃、肾脏、小肠、大肠',
      '在人体轮廓图上标注每个器官的位置，用不同颜色区分',
      '思考：心脏为什么一直在跳？为什么跑步后呼吸会变快？为什么吃饭后胃会变大？',
      '完成"人体器官认知图"并向家人讲解每个器官的功能',
    ]),
  },

  // ========== 自然探索 (2个) ==========
  {
    title: '天气播报小专家',
    description: '你有没有想过，为什么天气预报能知道明天会不会下雨？温度计是怎么工作的？云朵有哪几种？在这个项目中，你将学习观察天气、使用温度计、认识云的类型，成为一名"小小气象员"！',
    category: 'nature',
    difficulty: 'beginner',
    grade_level: '2-5',
    estimated_time: '40分钟',
    requirements: '1. 准备材料：温度计、笔记本、天气预报APP（用家长的手机查看）\n2. 每天早上、中午、晚上记录温度\n3. 学习认识云的类型：积云（像棉花糖）、层云（像一大片被子）、卷云（像羽毛）\n4. 学习简单的天气符号：晴天☀、多云⛅、阴天☁、下雨🌧、雷阵雨⛈\n5. 连续一周记录天气，制作"一周天气记录表"\n6. 尝试预测第二天的天气，和实际天气对比',
    reference_materials: '1. 视频推荐：搜索"儿童气象科普"\n2. 云的类型：积云（低空，块状，好天气）、层云（低空，层状，阴天）、卷云（高空，羽毛状，晴天）、积雨云（高大，顶部像铁砧，雷阵雨）\n3. 气象谚语：朝霞不出门，晚霞行千里；燕子低飞蛇过道，大雨不久就来到\n4. 科学原理：气温变化受太阳辐射、云层覆盖、风力等因素影响；云是水蒸气在高空遇冷凝结成的小水滴或冰晶',
    visual_prompt: 'Weather observation station setup, thermometer on a windowsill, notebook with weather symbols and temperature records, blue sky with different cloud types labeled, simple weather chart with sun cloud rain icons, bright outdoor educational scene',
    steps: makeSteps('天气播报小专家', [
      '准备材料：温度计、记录本、彩笔、天气预报APP',
      '学习使用温度计读取温度，每天早中晚各记录一次',
      '认识四种云：积云、层云、卷云、积雨云，用简笔画画出每种云的样子',
      '连续一周记录天气：日期、温度（早中晚）、天气现象、云的类型、风向风力',
      '思考：为什么早晨和晚上温度低、中午温度高？为什么先看到闪电后听到雷声？',
      '制作"一周天气记录表"，尝试预测明天的天气并验证',
    ]),
  },
  {
    title: '认识方向与地图',
    description: '你分得清东南西北吗？如果你在一个陌生的地方迷路了，怎么找到回家的路？指南针为什么总是指向南方？在这个项目中，你将学习辨别方向、使用指南针、看懂地图，成为"方向小达人"！',
    category: 'nature',
    difficulty: 'beginner',
    grade_level: '2-5',
    estimated_time: '35分钟',
    requirements: '1. 准备材料：指南针（或手机指南针APP）、纸、笔、尺子\n2. 学习利用太阳辨别方向：早晨太阳在东方，傍晚在西方，中午影子指向北方\n3. 学习使用指南针：把指南针水平放置，等指针稳定后，红色端指向北方\n4. 绘制自家的平面图（标注方向）\n5. 绘制从家到学校（或公园）的路线图\n6. 了解地图上的方向：上北下南左西右东',
    reference_materials: '1. 视频推荐：搜索"儿童辨别方向"\n2. 方向口诀：上北下南左西右东；早晨面向太阳，前面是东后面是西，左边是北右边是南\n3. 自然辨别方向：看树冠（南面茂盛）、看树桩年轮（南面稀疏北面密集）、看蚂蚁洞口（多朝南）\n4. 科学原理：地球本身是一个大磁铁，指南针的磁针受地球磁场作用，N极指向地磁南极（地理北极附近）',
    visual_prompt: 'Compass on a wooden table pointing north, a simple hand-drawn map with roads and landmarks, sun position in the sky showing east direction, cardinal directions compass rose with N E S W clearly marked, trees and natural landmarks, bright outdoor educational scene',
    steps: makeSteps('认识方向与地图', [
      '准备材料：指南针、纸、笔、尺子、彩笔',
      '学习用太阳辨别方向：早上太阳在东方，傍晚在西方，中午影子指北方',
      '学习使用指南针：水平放置，观察磁针指向，确认红色端指北',
      '绘制自家平面图：画出房间格局，标注东南西北方向',
      '思考：如果在阴天或夜晚，没有太阳和指南针，怎么辨别方向？',
      '绘制从家到学校的路线图，标注方向和重要地标',
    ]),
  },

  // ========== 人文社科 (1个) ==========
  {
    title: '认识中国地图',
    description: '中国有多大？你住在哪个省？长江黄河在哪里？北京在哪里？在这个项目中，你将从中国地图上认识我们伟大的祖国，了解各省的位置、长江黄河的走向、首都北京的位置，成为"地理小达人"！',
    category: 'humanities',
    difficulty: 'beginner',
    grade_level: '2-5',
    estimated_time: '35分钟',
    requirements: '1. 准备材料：中国地图（打印或从书上找）、彩笔、纸\n2. 在中国地图上找到自己所在的省份，用颜色标注\n3. 认识中国的地图形状：像一只雄鸡\n4. 找到长江和黄河，用蓝色笔描出来\n5. 找到首都北京的位置，标注五角星\n6. 找到中国最北（漠河）、最南（曾母暗沙）、最东（黑瞎子岛）、最西（帕米尔高原）的位置',
    reference_materials: '1. 视频推荐：搜索"中国地图 儿童版"\n2. 中国有34个省级行政区：23个省、5个自治区、4个直辖市、2个特别行政区\n3. 长江：中国第一大河，发源于青藏高原，流经11个省市，在上海注入东海\n4. 黄河：中国第二大河，发源于青藏高原，流经9个省区，在山东注入渤海，因为含沙量大水色发黄而得名\n5. 记忆口诀：两湖两广两河山，五江云贵福吉安，四西二宁青陕甘，内海台重北上天',
    visual_prompt: 'Colorful China map on a wooden table, provinces colored in different colors, the rooster-like shape of China, blue Yangtze River and Yellow River marked, Beijing marked with a red star, compass and colored pencils next to the map, bright educational illustration',
    steps: makeSteps('认识中国地图', [
      '准备材料：中国地图、彩笔、纸、尺子',
      '找到自己所在省份，用红色标注；观察中国地图的轮廓像不像一只雄鸡',
      '找到长江和黄河，用蓝色笔描出它们的流向，标注发源地和入海口',
      '找到首都北京，标注五角星；找到四个直辖市：北京、上海、天津、重庆',
      '思考：为什么中国东部人口多、西部人口少？为什么长江黄河都从西往东流？',
      '完成标注版中国地图，向家人介绍中国的地理特征',
    ]),
  },

  // ========== 创意制作 (2个) ==========
  {
    title: '自制指南针',
    description: '你想拥有一个自己做的指南针吗？只需要一根缝衣针、一块磁铁和一碗水，你就能亲手制作一个能指方向的指南针！这个项目结合了磁铁知识和动手能力，做完后你可以用它来辨别方向，再也不怕迷路啦！',
    category: 'creative',
    difficulty: 'beginner',
    grade_level: '2-5',
    estimated_time: '30分钟',
    requirements: '1. 准备材料：缝衣针、磁铁、小碗、水、泡沫塑料片（或瓶盖、树叶）、指南针（用来验证）\n2. 用磁铁的一端沿一个方向摩擦缝衣针30-50次（磁化过程）\n3. 将磁化后的针轻轻放在水面的泡沫塑料片上\n4. 观察针慢慢转动，最终指向南北方向\n5. 用真正的指南针验证方向是否正确\n6. 了解指南针的历史：中国古代四大发明之一——司南',
    reference_materials: '1. 视频推荐：搜索"自制指南针 小学生"\n2. 磁化方法：用磁铁N极（或S极）沿一个方向摩擦缝衣针，重复30-50次，针就被磁化了\n3. 为什么针会指向南北？磁化后的针变成了一个小磁铁，受地球磁场作用，N极指向地磁南极（地理北方）\n4. 指南针的前身：战国时期中国人发明了"司南"，用天然磁石磨成勺子形状，放在光滑的铜盘上，勺子柄指向南方',
    visual_prompt: 'DIY compass made from a magnetized sewing needle floating on a small piece of foam in a bowl of water, the needle pointing north, a real compass next to it for comparison, craft table with magnet and sewing supplies, hands-free educational craft scene',
    steps: makeSteps('自制指南针', [
      '准备材料：缝衣针、磁铁、小碗、水、泡沫塑料片、指南针（用来验证）',
      '磁化缝衣针：用磁铁一端沿同一方向摩擦缝衣针30-50次',
      '制作漂浮装置：将针放在泡沫塑料片或瓶盖上，轻轻放入水碗中',
      '观察：等待针稳定下来，观察它指向哪个方向，用真正的指南针验证',
      '思考：如果用磁铁的另一端摩擦针，指向会改变吗？如果没有磁铁，还能磁化针吗？',
      '展示你的自制指南针，讲述指南针的工作原理和中国古代司南的故事',
    ]),
  },
  {
    title: '自制温度计',
    description: '温度计是怎么知道冷热的？原来，很多液体都有"热胀冷缩"的特性！在这个项目中，你将用吸管、颜料水和一个小瓶子，亲手制作一个温度计，观察热水和冷水中液柱的变化，理解热胀冷缩的科学原理！',
    category: 'creative',
    difficulty: 'beginner',
    grade_level: '2-5',
    estimated_time: '30分钟',
    requirements: '1. 准备材料：小玻璃瓶（或透明塑料瓶）、吸管、食用色素（或墨水）、橡皮泥、热水、冷水、两个碗\n2. 在小瓶中倒入加了色素的水，约占瓶子的2/3\n3. 将吸管插入瓶中，用橡皮泥封住瓶口（确保吸管中有一段水柱）\n4. 将瓶子放入热水中，观察吸管中的水柱上升\n5. 将瓶子放入冷水中，观察吸管中的水柱下降\n6. 在吸管上标记刻度，制作简易温度计',
    reference_materials: '1. 视频推荐：搜索"自制温度计 小学生"\n2. 科学原理：热胀冷缩——液体受热时分子运动加快，体积膨胀，液柱上升；受冷时分子运动减慢，体积收缩，液柱下降\n3. 真正的温度计：水银温度计（利用水银热胀冷缩）、酒精温度计（利用酒精热胀冷缩，红色液体就是加了色素的酒精）、电子温度计（利用热敏电阻）\n4. 温度单位：摄氏度（℃），水结冰是0℃，水沸腾是100℃',
    visual_prompt: 'DIY thermometer made from a small glass bottle with colored water and a straw sealed with clay, the liquid column rising in hot water and falling in cold water, two bowls of water (hot and cold), simple science experiment on a table, hands-free educational craft',
    steps: makeSteps('自制温度计', [
      '准备材料：小玻璃瓶、吸管、食用色素、橡皮泥、热水、冷水、两个碗',
      '制作温度计：瓶中装2/3的色素水，插入吸管，用橡皮泥密封瓶口',
      '热胀实验：将瓶子放入热水碗中，观察吸管中的水柱上升',
      '冷缩实验：将瓶子放入冷水碗中，观察吸管中的水柱下降',
      '思考：为什么水银温度计打碎后很危险？为什么体温计拿出来后读数不会下降？',
      '在吸管上标记刻度，展示你的自制温度计并解释热胀冷缩原理',
    ]),
  },

  // ========== 编程技术 (1个) ==========
  {
    title: '打字练习小能手',
    description: '你想像大人一样熟练地打字吗？在这个项目中，你将学习电脑键盘的正确指法，认识每个手指负责的键位，通过有趣的练习提高打字速度和准确率，成为"打字小能手"！',
    category: 'programming',
    difficulty: 'beginner',
    grade_level: '2-6',
    estimated_time: '40分钟',
    requirements: '1. 准备：电脑或笔记本、键盘\n2. 认识键盘布局：字母区、数字区、功能键区\n3. 学习正确指法：F键和J键是基准键（上面有小凸起），食指放在F和J上\n4. 学习每个手指负责的键位区域\n5. 在打字练习网站上练习（推荐：金山打字通、Typing.com）\n6. 测试自己的打字速度，设定进步目标',
    reference_materials: '1. 练习网站推荐：TypingClub（免费）、金山打字通\n2. 指法口诀：左手食指放F键，右手食指放J键，大拇指放空格键\n3. 手指分工：左手食指（F、G、R、T、V、B）、左手中指（D、E、C）、左手无名指（S、W、X）、左手小指（A、Q、Z）；右手食指（J、H、Y、U、N、M）、右手中指（K、I）、右手无名指（L、O）、右手小指（;、P）\n4. 为什么F和J键上有小凸起？帮助你在不看键盘的情况下找到基准位置',
    visual_prompt: 'Computer keyboard with colored key zones showing different finger assignments, hands resting on home row keys F and J, typing practice screen with falling letters game, clean modern tech workspace, bright educational illustration, keyboard with hands-free close-up view',
    steps: makeSteps('打字练习小能手', [
      '准备：打开电脑，打开打字练习网站（如金山打字通或TypingClub）',
      '认识键盘：字母区、数字区、功能键区，找到F和J键上的小凸起',
      '学习正确指法：每个手指负责的键位区域，练习基准键位ASDF和JKL;',
      '在打字练习网站上练习基础课程，记录第一次测试的速度和准确率',
      '思考：为什么打字快的人可以不用看键盘？为什么键盘字母不是按ABCD排列的？',
      '展示你的打字进步：对比第一次和最后一次的测试成绩',
    ]),
  },
];

// ============================================================
// 主函数
// ============================================================
async function main() {
  const jsonPath = path.join(__dirname, '..', 'data', 'tasks_v3.json');

  // 1. 读取当前JSON
  console.log('[1/4] 读取当前 tasks_v3.json...');
  let tasks = JSON.parse(fs.readFileSync(jsonPath, 'utf-8')) as any[];

  const beforeCount = tasks.length;
  console.log(`  当前任务数: ${beforeCount}`);

  // 2. 删除旧任务
  console.log('[2/4] 删除教育价值低的任务...');
  const removed: string[] = [];
  tasks = tasks.filter((t: any) => {
    if (TITLES_TO_REMOVE.includes(t.title)) {
      removed.push(t.title);
      return false;
    }
    return true;
  });
  console.log(`  已删除 ${removed.length} 个:`);
  removed.forEach(t => console.log(`    - ${t}`));

  // 3. 添加新任务
  console.log('[3/4] 添加新任务...');
  tasks.push(...NEW_TASKS);
  console.log(`  已添加 ${NEW_TASKS.length} 个:`);
  NEW_TASKS.forEach(t => console.log(`    + ${t.title} [${t.category}]`));

  // 4. 写入JSON
  console.log('[4/4] 写入 tasks_v3.json...');
  fs.writeFileSync(jsonPath, JSON.stringify(tasks, null, 2), 'utf-8');
  console.log(`  任务总数: ${beforeCount} -> ${tasks.length}`);

  // 5. 重置数据库
  console.log('\n[5/5] 重置数据库...');
  db.prepare('DELETE FROM submissions').run();
  db.prepare('DELETE FROM tasks').run();
  console.log('  已清空旧的tasks和submissions');

  // 重新导入
  const insertTask = db.prepare(
    `INSERT INTO tasks (title, description, category, difficulty, requirements, reference_materials, grade_level, estimated_time, steps_json, ai_video_url, external_video_url, status, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', NULL)`
  );

  const insertMany = db.transaction(() => {
    for (const t of tasks) {
      insertTask.run(
        t.title, t.description, t.category, t.difficulty,
        t.requirements, t.reference_materials, t.grade_level, t.estimated_time,
        JSON.stringify(t.steps || []), t.ai_video_url || '', t.external_video_url || ''
      );
    }
  });

  insertMany();
  console.log(`  已重新导入 ${tasks.length} 个任务`);

  // 分类统计
  const cats: Record<string, number> = {};
  tasks.forEach((t: any) => {
    cats[t.category] = (cats[t.category] || 0) + 1;
  });
  console.log('\n新分类统计:');
  Object.entries(cats).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count}个`);
  });

  console.log('\n迁移完成!');
}

main().catch(console.error);