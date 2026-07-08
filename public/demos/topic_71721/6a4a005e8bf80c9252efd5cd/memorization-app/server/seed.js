/**
 * 种子数据:学科 + 各学科示例背诵内容
 * 内容贴合人教版初中教材,示例数量适中,可通过管理后台持续扩充
 */
const db = require('./db');

// ====== 学科 ======
const SUBJECTS = [
  { code: 'chinese',   name: '语文',   icon: '📖', sort: 1 },
  { code: 'math',      name: '数学',   icon: '🔢', sort: 2 },
  { code: 'english',   name: '英语',   icon: '🔤', sort: 3 },
  { code: 'physics',   name: '物理',   icon: '⚙️', sort: 4 },
  { code: 'chemistry', name: '化学',   icon: '🧪', sort: 5 },
  { code: 'biology',   name: '生物',   icon: '🧬', sort: 6 },
  { code: 'history',   name: '历史',   icon: '🏛️', sort: 7 },
  { code: 'geography', name: '地理',   icon: '🌍', sort: 8 },
  { code: 'politics',  name: '道德与法治', icon: '⚖️', sort: 9 },
];

// ====== 示例背诵内容 ======
// semester: grade7_1 / grade7_2 / grade8_1 / grade8_2 / grade9_1 / grade9_2
const CONTENTS = [
  // ============ 语文 ============
  { subject:'chinese', semester:'grade7_1', unit:'第一单元', title:'《观沧海》曹操',
    body:'东临碣石,以观沧海。水何澹澹,山岛竦峙。树木丛生,百草丰茂。秋风萧瑟,洪波涌起。日月之行,若出其中;星汉灿烂,若出其里。幸甚至哉,歌以咏志。',
    tip:'诗人以沧海自比,表现开阔胸襟与统一天下的雄心。' },
  { subject:'chinese', semester:'grade7_1', unit:'第一单元', title:'《闻王昌龄左迁龙标遥有此寄》李白',
    body:'杨花落尽子规啼,闻道龙标过五溪。我寄愁心与明月,随君直到夜郎西。',
    tip:'借月抒怀,表达对友人的牵挂与同情。' },
  { subject:'chinese', semester:'grade7_1', unit:'第二单元', title:'《论语》十二章(节选)',
    body:'子曰:"学而时习之,不亦说乎?有朋自远方来,不亦乐乎?人不知而不愠,不亦君子乎?"\n子曰:"温故而知新,可以为师矣。"\n子曰:"学而不思则罔,思而不学则殆。"',
    tip:'学习态度与方法、修身做人。' },
  { subject:'chinese', semester:'grade7_2', unit:'第二单元', title:'《黄河颂》光未然',
    body:'我站在高山之巅,望黄河滚滚,奔向东南。惊涛澎湃,掀起万丈狂澜;浊流宛转,结成九曲连环;从昆仑山下奔向黄海之边;把中原大地劈成南北两面。',
    tip:'赞美黄河,激励中华民族精神。' },
  { subject:'chinese', semester:'grade8_1', unit:'第三单元', title:'《使至塞上》王维',
    body:'单车欲问边,属国过居延。征蓬出汉塞,归雁入胡天。大漠孤烟直,长河落日圆。萧关逢候骑,都护在燕然。',
    tip:'"大漠孤烟直,长河落日圆"为千古名句。' },
  { subject:'chinese', semester:'grade9_1', unit:'第一单元', title:'《沁园春·雪》毛泽东',
    body:'北国风光,千里冰封,万里雪飘。望长城内外,惟余莽莽;大河上下,顿失滔滔。山舞银蛇,原驰蜡象,欲与天公试比高。须晴日,看红装素裹,分外妖娆。',
    tip:'赞美祖国山河,抒发革命豪情。' },

  // ============ 数学 ============
  { subject:'math', semester:'grade7_1', unit:'第一章 有理数', title:'有理数运算法则',
    body:'1. 同号两数相加:取相同的符号,并把绝对值相加。\n2. 异号两数相加:取绝对值较大加数的符号,并用较大的绝对值减去较小的绝对值。\n3. 一个数同 0 相加,仍得这个数。\n4. 减去一个数等于加上这个数的相反数。',
    tip:'注意先定符号,再算绝对值。' },
  { subject:'math', semester:'grade7_1', unit:'第二章 整式', title:'合并同类项法则',
    body:'把同类项的系数相加,字母和字母的指数保持不变。\n步骤:① 找同类项;② 系数相加;③ 字母部分不变。',
    tip:'同类项:所含字母相同,相同字母指数也相同的项。' },
  { subject:'math', semester:'grade8_1', unit:'第十一章 三角形', title:'三角形内角和定理',
    body:'三角形三个内角的和等于 180°。\n推论:① 三角形的一个外角等于与它不相邻的两个内角的和;② 三角形的一个外角大于任何一个与它不相邻的内角。',
    tip:'可通过作平行线证明。' },
  { subject:'math', semester:'grade9_1', unit:'第二十一章 一元二次方程', title:'求根公式',
    body:'一元二次方程 ax² + bx + c = 0 (a≠0):\n当 Δ = b² - 4ac ≥ 0 时,\nx = (-b ± √(b²-4ac)) / (2a)\n判别式:Δ > 0 两不等实根;Δ = 0 两相等实根;Δ < 0 无实根。',
    tip:'韦达定理:x₁+x₂=-b/a,x₁·x₂=c/a。' },

  // ============ 英语 ============
  { subject:'english', semester:'grade7_1', unit:'Starter Unit', title:'be 动词用法',
    body:'I am / You are / He is / She is / It is / We are / They are\n口诀:I 用 am,you 用 are,is 连着他她它,单数 is,复数 are。',
    tip:'be 动词随主语变化。' },
  { subject:'english', semester:'grade7_1', unit:'Unit 1', title:'人称代词主格与宾格',
    body:'主格:I / you / he / she / it / we / they\n宾格:me / you / him / her / it / us / them\n主格作主语,宾格作宾语(动词或介词后)。',
    tip:'介词后用宾格,如 "with me"。' },
  { subject:'english', semester:'grade8_1', unit:'Unit 1', title:'一般过去时',
    body:'用法:表示过去某时间发生的动作或状态。\n结构:主语 + 动词过去式\n规则变化:① +ed (play→played);② +d (like→liked);③ 双写+ed (stop→stopped);④ y→i+ed (study→studied)\n不规则:go→went, do→did, have→had, see→saw, buy→bought',
    tip:'常见时间状语:yesterday, last week, in 2010。' },
  { subject:'english', semester:'grade9_1', unit:'Unit 2', title:'现在完成时',
    body:'结构:have/has + 过去分词\n用法:① 过去动作对现在造成影响;② 到现在为止的经历。\n标志词:already, yet, ever, never, just, since, for。\nhave been to 去过(已回);have gone to 去了(未回)。',
    tip:'since + 时间点;for + 时间段。' },

  // ============ 物理 ============
  { subject:'physics', semester:'grade8_1', unit:'第一章 机械运动', title:'速度公式',
    body:'v = s / t\ns 表示路程(米 m),t 表示时间(秒 s),v 表示速度(米/秒 m/s)。\n1 m/s = 3.6 km/h\n匀速直线运动:速度大小和方向都不变。',
    tip:'单位换算易错点:m/s → km/h 乘 3.6。' },
  { subject:'physics', semester:'grade8_1', unit:'第二章 声现象', title:'声音的产生与传播',
    body:'1. 声音由物体振动产生。\n2. 声音传播需要介质(气体、液体、固体),真空不能传声。\n3. 声速:15℃ 空气中 340 m/s;固体 > 液体 > 气体。\n4. 回声:声音遇到障碍物被反射回来。',
    tip:'声音能传递能量和信息。' },
  { subject:'physics', semester:'grade8_2', unit:'第七章 力', title:'牛顿第一定律',
    body:'一切物体在没有受到力的作用时,总保持静止状态或匀速直线运动状态。\n惯性:物体保持原有运动状态不变的性质,一切物体都具有惯性,质量越大惯性越大。',
    tip:'惯性不是力,不能说"受到惯性作用"。' },
  { subject:'physics', semester:'grade9_1', unit:'第十四章 内能', title:'比热容',
    body:'c = Q / (m·Δt)\n水的比热容:c水 = 4.2×10³ J/(kg·℃)\n比热容大的物质:吸热多,温度变化小(如水)。\n应用:沿海地区温差比内陆小。',
    tip:'比热容是物质本身的一种特性。' },

  // ============ 化学 ============
  { subject:'chemistry', semester:'grade9_1', unit:'第二单元 我们周围的空气', title:'氧气化学性质',
    body:'氧气支持燃烧,支持呼吸,具有助燃性(本身不可燃)。\n1. 木炭在 O₂ 中燃烧:发白光,放热。\n2. 硫在 O₂ 中燃烧:明亮的蓝紫色火焰,生成刺激性气味气体(SO₂)。\n3. 铁丝在 O₂ 中燃烧:剧烈燃烧,火星四射,生成黑色固体(Fe₃O₄)。',
    tip:'铁丝燃烧前需系火柴引燃,集气瓶底留水或沙。' },
  { subject:'chemistry', semester:'grade9_1', unit:'第三单元 物质构成的奥秘', title:'元素周期表前 20 号元素',
    body:'1 H 氢  2 He 氦  3 Li 锂  4 Be 铍  5 B 硼  6 C 碳  7 N 氮  8 O 氧  9 F 氟  10 Ne 氖\n11 Na 钠  12 Mg 镁  13 Al 铝  14 Si 硅  15 P 磷  16 S 硫  17 Cl 氯  18 Ar 氩  19 K 钾  20 Ca 钙',
    tip:'口诀:氢氦锂铍硼,碳氮氧氟氖,钠镁铝硅磷,硫氯氩钾钙。' },
  { subject:'chemistry', semester:'grade9_2', unit:'第十单元 酸和碱', title:'常见酸的性质',
    body:'盐酸 HCl:无色液体,挥发性,胃酸主要成分。\n硫酸 H₂SO₄:浓硫酸有强腐蚀性、吸水性、脱水性。\n酸的通性:① 使紫色石蕊变红;② 与活泼金属反应生成盐和氢气;③ 与金属氧化物反应生成盐和水;④ 与碱中和生成盐和水;⑤ 与某些盐反应。',
    tip:'浓硫酸稀释:酸入水,沿器壁,慢慢倒,不断搅。' },

  // ============ 生物 ============
  { subject:'biology', semester:'grade7_1', unit:'第一单元 生物和生物圈', title:'生物的基本特征',
    body:'1. 需要营养;2. 能进行呼吸;3. 能排出身体内的废物;4. 能对外界刺激作出反应;5. 能生长和繁殖;6. 除病毒外,都由细胞构成;7. 有遗传和变异的特性。',
    tip:'应激性、生长、繁殖是判断生物的关键。' },
  { subject:'biology', semester:'grade7_1', unit:'第二单元 细胞', title:'动植物细胞结构对比',
    body:'植物细胞特有:细胞壁、叶绿体、液泡。\n动植物共有:细胞膜、细胞质、细胞核。\n细胞膜:控制物质进出;细胞质:生命活动主要场所;细胞核:含有遗传物质;叶绿体:光合作用;线粒体:呼吸作用;液泡:含细胞液。',
    tip:'叶绿体、线粒体都是能量转换器。' },
  { subject:'biology', semester:'grade8_1', unit:'第四单元 生物圈中的人', title:'消化系统组成',
    body:'消化道:口腔→咽→食道→胃→小肠→大肠→肛门。\n消化腺:唾液腺(唾液淀粉酶)、胃腺(胃蛋白酶)、肠腺、胰腺、肝脏(分泌胆汁,不含消化酶)。\n小肠是消化和吸收的主要器官:有皱襞、绒毛,增大吸收面积。',
    tip:'胆汁乳化脂肪,属物理消化。' },

  // ============ 历史 ============
  { subject:'history', semester:'grade7_1', unit:'第一单元 史前时期', title:'夏商周更替',
    body:'夏:约公元前 2070 年,禹建立,是我国第一个王朝。\n商:约公元前 1600 年,汤建立,盘庚迁殷。\n西周:公元前 1046 年,武王伐纣,牧野之战,建立西周。\n分封制:周天子把土地和人民分给宗亲、功臣,封为诸侯。',
    tip:'夏商周更替的关键战役:鸣条之战、牧野之战。' },
  { subject:'history', semester:'grade7_1', unit:'第二单元 夏商周时期', title:'百家争鸣',
    body:'儒家:孔子(仁、礼、为政以德)、孟子(仁政)、荀子。\n道家:老子(道法自然、无为而治)、庄子。\n墨家:墨子(兼爱、非攻)。\n法家:韩非子(以法治国、改革)。\n兵家:孙武(《孙子兵法》"知己知彼")。',
    tip:'孔子核心思想是"仁",韩非子代表新兴地主阶级。' },
  { subject:'history', semester:'grade8_1', unit:'第一单元 中国开始沦为半殖民地半封建社会', title:'鸦片战争',
    body:'时间:1840-1842 年。\n导火索:林则徐虎门销烟(1839)。\n结果:清政府战败,签订《南京条约》。\n《南京条约》内容:① 割香港岛;② 赔款 2100 万银元;③ 五口通商(广厦福宁上);④ 协定关税。\n意义:中国开始沦为半殖民地半封建社会,是中国近代史的开端。',
    tip:'五口通商:广州、厦门、福州、宁波、上海。' },

  // ============ 地理 ============
  { subject:'geography', semester:'grade7_1', unit:'第一章 地球和地图', title:'地球基本数据',
    body:'1. 形状:两极稍扁、赤道略鼓的不规则球体。\n2. 平均半径:约 6371 千米。\n3. 赤道周长:约 4 万千米。\n4. 表面积:约 5.1 亿平方千米。\n5. 经线:连接南北两极的半圆,指示南北方向,长度相等。\n6. 纬线:与赤道平行的圆,指示东西方向,长度从赤道向两极递减。',
    tip:'本初子午线(0°经线)经过英国伦敦格林尼治。' },
  { subject:'geography', semester:'grade7_1', unit:'第二章 陆地和海洋', title:'七大洲四大洋',
    body:'七大洲(面积由大到小):亚洲、非洲、北美洲、南美洲、南极洲、欧洲、大洋洲。\n四大洋(面积由大到小):太平洋、大西洋、印度洋、北冰洋。\n亚洲与非洲分界线:苏伊士运河。\n亚洲与欧洲分界线:乌拉尔山—乌拉尔河—里海—大高加索山—黑海—土耳其海峡。\n北美洲与南美洲分界线:巴拿马运河。',
    tip:'亚欧分界线、亚非分界线、南北美分界线是常考点。' },
  { subject:'geography', semester:'grade8_1', unit:'第一章 从世界看中国', title:'中国疆域',
    body:'1. 位置:位于东半球、北半球,亚洲东部,太平洋西岸。\n2. 陆地领土面积约 960 万平方千米,居世界第三。\n3. 陆上邻国 14 个(朝鲜、俄罗斯、蒙古、哈萨克斯坦等)。\n4. 隔海相望国家 6 个(日本、韩国、菲律宾、马来西亚等)。\n5. 主要岛屿:台湾岛、海南岛、舟山群岛。',
    tip:'濒临的海洋由北向南:渤海、黄海、东海、南海。' },

  // ============ 道德与法治(政治) ============
  { subject:'politics', semester:'grade7_1', unit:'第一单元 成长的节拍', title:'中学生活新起点',
    body:'1. 中学生活把我们带入一个新的天地,新的目标和要求、新的机会和挑战。\n2. 中学时代是人生发展的一个新阶段,为我们的一生奠定重要基础。\n3. 中学时代见证着一个人从少年到青年的生命进阶。\n4. 我们要珍视当下,把握机遇,从点滴做起。',
    tip:'中学时代是人生的重要转折点。' },
  { subject:'politics', semester:'grade8_1', unit:'第一单元 走进社会生活', title:'网络改变世界',
    body:'网络积极:① 网络让信息传递和交流变得方便快捷;② 网络打破了传统人际交往时空限制;③ 网络为经济发展注入新活力;④ 网络为文化传播和科技创新搭建新平台。\n网络消极:① 网络信息良莠不齐;② 沉迷网络影响学习生活;③ 个人隐私容易被侵犯。\n我们要:合理利用网络,做网络的主人。',
    tip:'理性参与网络生活,传播正能量。' },
  { subject:'politics', semester:'grade9_1', unit:'第一单元 富强与创新', title:'改革开放',
    body:'1. 1978 年党的十一届三中全会作出改革开放的历史抉择。\n2. 改革开放是强国之路,是我们党、我们国家发展进步的活力源泉。\n3. 改革开放极大解放和发展社会生产力。\n4. 中国共产党团结带领中国人民进行改革开放新的伟大革命。\n5. 改革开放是决定当代中国命运的关键一招。',
    tip:'改革开放 40 多年来取得的历史性成就。' },
];

function seed() {
  // 学科
  const insSubj = db.prepare(`INSERT OR REPLACE INTO subjects(code,name,icon,sort) VALUES(@code,@name,@icon,@sort)`);
  for (const s of SUBJECTS) insSubj.run(s);

  // 内容(先清空再插入,便于重新 seed)
  db.prepare(`DELETE FROM contents`).run();
  const insContent = db.prepare(`INSERT INTO contents(subject_code,semester,unit,title,body,tip,sort) VALUES(@subject,@semester,@unit,@title,@body,@tip,@sort)`);
  let sort = 0;
  for (const c of CONTENTS) {
    insContent.run({ ...c, subject: c.subject, sort: sort++ });
  }

  console.log(`✓ 已插入 ${SUBJECTS.length} 个学科`);
  console.log(`✓ 已插入 ${CONTENTS.length} 条背诵内容`);
}

seed();
