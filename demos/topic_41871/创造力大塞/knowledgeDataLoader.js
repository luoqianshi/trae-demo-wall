/**
 * 高中学习管理系统 - 知识点数据加载器
 * 
 * 设计目标：
 *   1. 将知识点数据从 index.html 中分离出来，便于独立维护和扩展
 *   2. 支持按学科/年级拆分为多个独立的数据文件
 *   3. 先从外部文件加载；若加载失败（例如本地 file:// 协议跨域），
 *      则回退使用内置在 window 中的数据对象（如 math_knowledge.js）
 *   4. 向后兼容：最终仍然提供 knowledgeData 这个全局对象，结构不变
 *
 * 数据结构：
 *   knowledgeData = {
 *       '高一': { '语文': [...], '数学': [...], ... },
 *       '高二': { ... },
 *       '高三': { ... }
 *   }
 *
 * 用法：
 *   // 1. 在 <head> / <body> 中按需引入学科数据文件
 *   <script src="math_knowledge.js"></script>
 *   <script src="knowledgeDataLoader.js"></script>
 *
 *   // 2. 之后即可使用 knowledgeData（可等待 ready 回调）
 *   KnowledgeDataLoader.whenReady(function() {
 *       console.log(knowledgeData);
 *   });
 */
(function (global) {
    'use strict';

    // ========================================================================
    // 1. 基础数据（原先硬编码在 index.html 中的精简版本）
    //    这里的内容是最小可用版本；更详细的内容由学科数据文件覆盖
    // ========================================================================
    const BASE_KNOWLEDGE = {
        '高一': {
            '语文': [
                { id: 'yuwen-g1-1', chapter: '现代文阅读', name: '记叙文阅读技巧', content: '掌握记叙文的六要素：时间、地点、人物、起因、经过、结果。<br>重点：分析文章结构、理解作者情感、概括中心思想。<br>技巧：划线标注关键句、归纳段落大意、找出线索贯穿全文。' },
                { id: 'yuwen-g1-2', chapter: '现代文阅读', name: '说明文阅读方法', content: '说明文的三大特征：科学性、条理性、通俗性。<br>说明顺序：时间顺序、空间顺序、逻辑顺序。<br>说明方法：举例子、列数字、作比较、打比方、分类别。' },
                { id: 'yuwen-g1-3', chapter: '文言文阅读', name: '文言文基础语法', content: '重要虚词：之、其、而、于、以、乃。<br>词类活用：名词作动词、形容词作名词、使动用法、意动用法。<br>句式：判断句、被动句、倒装句、省略句。' },
                { id: 'yuwen-g1-4', chapter: '文言文阅读', name: '常见文言实词', content: '一词多义：亡、走、疾、穷等。<br>古今异义：妻子、行李、逢迎等。<br>通假字：本有其字、假借音同。' },
                { id: 'yuwen-g1-5', chapter: '诗歌鉴赏', name: '诗歌意象理解', content: '常见意象：月亮-思乡、菊花-高洁、梅花-坚韧、鸿雁-书信。<br>情感类别：思乡怀人、离愁别绪、爱国情怀、山水田园。<br>表现手法：借景抒情、托物言志、对比衬托。' },
                { id: 'yuwen-g1-6', chapter: '写作表达', name: '议论文写作', content: '议论文三要素：论点、论据、论证。<br>结构模式：总分总式、并列式、对照式、层进式。<br>论证方法：举例论证、道理论证、对比论证、比喻论证。' }
            ],
            '英语': [
                { id: 'eng-g1-1', chapter: '词汇语法', name: '核心词汇记忆', content: '词根词缀法：un-, dis-, -ment, -tion等。<br>联想记忆法：同义词、反义词、词组搭配。<br>语境记忆：在句子中记忆单词。' },
                { id: 'eng-g1-2', chapter: '词汇语法', name: '时态语态', content: '八种基本时态：一般现在、一般过去、一般将来、现在进行、过去进行、现在完成、过去完成、将来完成。<br>被动语态：be+过去分词。' },
                { id: 'eng-g1-3', chapter: '阅读理解', name: '阅读技巧', content: '先看题干，带着问题读文章。<br>定位关键词：人名、地名、数字、特殊词汇。<br>理解主旨大意：首段、尾段、各段首句。' },
                { id: 'eng-g1-4', chapter: '写作', name: '书面表达', content: '写作步骤：审题→列提纲→写草稿→检查。<br>开头句型：图表描述、观点表达。<br>衔接词：however, therefore, moreover, in addition。' }
            ],
            '物理': [
                { id: 'phy-g1-1', chapter: '运动学', name: '运动的描述', content: '参考系、质点、坐标系。<br>位移与路程、速度与速率。<br>加速度：描述速度变化快慢的物理量。' },
                { id: 'phy-g1-2', chapter: '运动学', name: '匀变速直线运动', content: '基本公式：v=v0+at, x=v0t+½at²。<br>推论：v²-v0²=2ax。<br>自由落体运动：v=gt, h=½gt²。' },
                { id: 'phy-g1-3', chapter: '力学', name: '力的合成与分解', content: '平行四边形定则、三角形定则。<br>正交分解法。<br>共点力的平衡条件：ΣF=0。' },
                { id: 'phy-g1-4', chapter: '力学', name: '牛顿运动定律', content: '第一定律：惯性定律。<br>第二定律：F=ma。<br>第三定律：作用力与反作用力。<br>超重与失重。' },
                { id: 'phy-g1-5', chapter: '能量守恒', name: '功和功率', content: '功：W=Fscosθ。<br>功率：P=W/t=P=Fv。<br>机械效率：η=W有/W总。' },
                { id: 'phy-g1-6', chapter: '能量守恒', name: '动能定理', content: '动能：Ek=½mv²。<br>动能定理：合外力做功等于动能变化量。<br>重力做功与路径无关，只与高度有关。' }
            ],
            '化学': [
                { id: 'chem-g1-1', chapter: '物质的分类', name: '物质的组成', content: '纯净物与混合物。<br>单质、化合物、氧化物。<br>分子、原子、离子。<br>化学式的书写与意义。' },
                { id: 'chem-g1-2', chapter: '氧化还原反应', name: '氧化还原反应', content: '氧化反应：失电子、化合价升高、被氧化。<br>还原反应：得电子、化合价降低、被还原。<br>氧化剂、还原剂、氧化产物、还原产物。' },
                { id: 'chem-g1-3', chapter: '氧化还原反应', name: '电子转移表示法', content: '双线桥法：标出得失电子数目。<br>单线桥法：箭头从失电子元素指向得电子元素。<br>配平方法：化合价升降法。' },
                { id: 'chem-g1-4', chapter: '离子反应', name: '电解质', content: '电解质：在水溶液中或熔融状态下能导电的化合物。<br>强电解质、弱电解质。<br>电离方程式书写。' },
                { id: 'chem-g1-5', chapter: '离子反应', name: '离子方程式', content: '离子方程式：用实际参与反应的离子表示。<br>书写步骤：写→拆→删→查。<br>离子共存问题。' }
            ],
            '生物': [
                { id: 'bio-g1-1', chapter: '细胞结构', name: '细胞的基本结构', content: '动物细胞与植物细胞的区别。<br>细胞膜：流动镶嵌模型。<br>细胞器：线粒体、叶绿体、内质网、高尔基体等。' },
                { id: 'bio-g1-2', chapter: '细胞结构', name: '细胞核', content: '核膜、核孔、核仁。<br>染色质与染色体。<br>DNA是主要的遗传物质。' },
                { id: 'bio-g1-3', chapter: '新陈代谢', name: '酶与ATP', content: '酶的本质：蛋白质或RNA。<br>酶的特性：高效性、专一性、作用条件温和。<br>ATP的结构与功能。' },
                { id: 'bio-g1-4', chapter: '新陈代谢', name: '光合作用', content: '光反应阶段：水的光解、ATP合成。<br>暗反应阶段：CO2固定、C3还原。<br>影响光合作用的因素。' }
            ],
            '历史': [
                { id: 'his-g1-1', chapter: '中国古代史', name: '先秦时期', content: '夏商周三代更替。<br>分封制、宗法制。<br>诸子百家：儒家、道家、法家。' },
                { id: 'his-g1-2', chapter: '中国古代史', name: '秦汉时期', content: '秦统一六国、郡县制。<br>汉武帝大一统。<br>丝绸之路。' },
                { id: 'his-g1-3', chapter: '近代世界史', name: '工业革命', content: '英国工业革命的条件与进程。<br>珍妮纺纱机、蒸汽机的应用。<br>工业革命的影响。' },
                { id: 'his-g1-4', chapter: '近代世界史', name: '资产阶级革命', content: '英国资产阶级革命。<br>美国独立战争与南北战争。<br>法国大革命。' }
            ],
            '政治': [
                { id: 'pol-g1-1', chapter: '经济生活', name: '商品的含义', content: '商品的基本属性：使用价值与价值。<br>货币的职能：价值尺度、流通手段。<br>纸币与信用工具。' },
                { id: 'pol-g1-2', chapter: '经济生活', name: '价格与消费', content: '影响价格的因素：供求关系、价值决定。<br>价格变动的影响。<br>消费心理与消费行为。' },
                { id: 'pol-g1-3', chapter: '政治生活', name: '公民的政治权利', content: '我国公民的政治权利与自由。<br>公民应履行的政治性义务。<br>公民参与民主决策的途径。' },
                { id: 'pol-g1-4', chapter: '政治生活', name: '政府职能', content: '我国政府的主要职能。<br>政府工作的原则与宗旨。<br>政府权力的监督。' }
            ],
            '地理': [
                { id: 'geo-g1-1', chapter: '自然地理', name: '地球与地图', content: '地球的形状与大小。<br>经纬线、经纬度。<br>地图三要素：比例尺、方向、图例。' },
                { id: 'geo-g1-2', chapter: '自然地理', name: '大气与气候', content: '大气的组成与分层。<br>热力循环。<br>气压带与风带。' },
                { id: 'geo-g1-3', chapter: '人文地理', name: '人口与城市', content: '人口增长模式。<br>人口迁移。<br>城市化进程与问题。' },
                { id: 'geo-g1-4', chapter: '人文地理', name: '农业与工业', content: '农业区位因素。<br>工业区位因素与工业地域。<br>传统工业区与新工业区。' }
            ]
        },
        '高二': {
            '语文': [
                { id: 'yuwen-g2-1', chapter: '散文阅读', name: '散文的特点与分类', content: '散文的三大特点：形散神聚、意境深远、语言优美。<br>分类：叙事散文、抒情散文、哲理散文。' },
                { id: 'yuwen-g2-2', chapter: '散文阅读', name: '散文阅读方法', content: '抓关键词句，体会感情。<br>理清行文思路，把握线索。<br>赏析语言特色。' },
                { id: 'yuwen-g2-3', chapter: '小说阅读', name: '小说三要素', content: '人物形象：正面描写、侧面描写。<br>环境描写：自然环境、社会环境。<br>情节：开端、发展、高潮、结局。' },
                { id: 'yuwen-g2-4', chapter: '小说阅读', name: '小说主题分析', content: '通过情节分析主题。<br>通过人物形象揭示主题。<br>通过环境描写烘托主题。' },
                { id: 'yuwen-g2-5', chapter: '语言应用', name: '病句修改', content: '六大病句类型：语序不当、搭配不当、成分残缺、成分赘余、结构混乱、表意不明。' },
                { id: 'yuwen-g2-6', chapter: '语言应用', name: '句式变换', content: '长句与短句的变换。<br>主动句与被动句的变换。<br>陈述句与反问句的变换。' }
            ],
            '英语': [
                { id: 'eng-g2-1', chapter: '完形填空', name: '完形填空技巧', content: '首句信息原则。<br>上下文语境分析。<br>词语辨析与搭配。' },
                { id: 'eng-g2-2', chapter: '阅读技巧', name: '主旨大意题', content: '寻找主题句：通常在首段或尾段。<br>概括归纳法。<br>排除法。' },
                { id: 'eng-g2-3', chapter: '阅读技巧', name: '推理判断题', content: '明示信息与隐含信息。<br>作者态度与观点。<br>文章出处判断。' },
                { id: 'eng-g2-4', chapter: '书面表达', name: '应用文写作', content: '书信、邮件、通知等格式。<br>开头与结尾的常用表达。<br>高级句型与词汇运用。' }
            ],
            '物理': [
                { id: 'phy-g2-1', chapter: '电磁学', name: '电场', content: '库仑定律、电场强度。<br>电势、电势能。<br>电容器的电容。' },
                { id: 'phy-g2-2', chapter: '电磁学', name: '恒定电流', content: '电流、电压、电阻。<br>欧姆定律。<br>串并联电路。' },
                { id: 'phy-g2-3', chapter: '电磁学', name: '磁场', content: '磁感应强度。<br>安培力、洛伦兹力。<br>带电粒子在磁场中的运动。' },
                { id: 'phy-g2-4', chapter: '电磁学', name: '电磁感应', content: '磁通量、电磁感应定律。<br>法拉第电磁感应定律。<br>自感与互感。' },
                { id: 'phy-g2-5', chapter: '光学', name: '光的传播', content: '光的反射与折射。<br>折射率、全反射。<br>棱镜与透镜。' },
                { id: 'phy-g2-6', chapter: '热学', name: '分子动理论', content: '分子动理论三条内容。<br>内能、热量、温度。<br>热力学第一定律。' }
            ],
            '化学': [
                { id: 'chem-g2-1', chapter: '有机化学', name: '有机物分类', content: '烃：烷烃、烯烃、炔烃、芳香烃。<br>衍生物：卤代烃、醇、醛、羧酸、酯。' },
                { id: 'chem-g2-2', chapter: '有机化学', name: '官能团性质', content: '碳碳双键、碳碳三键。<br>羟基、醛基、羧基。<br>取代反应、加成反应、消去反应。' },
                { id: 'chem-g2-3', chapter: '化学反应速率', name: '反应速率', content: '反应速率表示方法。<br>影响反应速率的因素：浓度、温度、压强、催化剂。' },
                { id: 'chem-g2-4', chapter: '化学反应速率', name: '化学平衡', content: '化学平衡状态。<br>平衡移动原理（勒夏特列原理）。<br>转化率与计算。' }
            ],
            '生物': [
                { id: 'bio-g2-1', chapter: '遗传与变异', name: '遗传的基本规律', content: '分离定律、自由组合定律。<br>孟德尔实验。<br>概率计算方法。' },
                { id: 'bio-g2-2', chapter: '遗传与变异', name: '伴性遗传', content: 'X染色体隐性遗传、显性遗传。<br>遗传图谱分析。<br>概率计算。' },
                { id: 'bio-g2-3', chapter: '变异', name: '基因突变与染色体变异', content: '基因突变的概念与特点。<br>染色体结构变异、数目变异。<br>变异在育种中的应用。' },
                { id: 'bio-g2-4', chapter: '进化', name: '现代生物进化理论', content: '种群、基因库、基因频率。<br>突变与基因重组。<br>自然选择与物种形成。' }
            ],
            '历史': [
                { id: 'his-g2-1', chapter: '中国现代史', name: '新中国成立', content: '开国大典、历史意义。<br>土地改革。<br>第一个五年计划。' },
                { id: 'his-g2-2', chapter: '中国现代史', name: '改革开放', content: '十一届三中全会。<br>家庭联产承包责任制。<br>对外开放格局形成。' },
                { id: 'his-g2-3', chapter: '世界现代史', name: '两次世界大战', content: '一战导火索、进程、影响。<br>二战爆发原因、进程、影响。' },
                { id: 'his-g2-4', chapter: '世界现代史', name: '冷战与世界格局', content: '冷战政策与表现。<br>两极格局形成与瓦解。<br>多极化趋势。' }
            ],
            '政治': [
                { id: 'pol-g2-1', chapter: '文化生活', name: '文化的作用', content: '文化与经济、政治的关系。<br>文化对人的影响。<br>文化软实力。' },
                { id: 'pol-g2-2', chapter: '文化生活', name: '传统文化', content: '传统文化的特点与继承。<br>文化创新。<br>弘扬民族精神。' },
                { id: 'pol-g2-3', chapter: '哲学生活', name: '唯物论', content: '物质与意识的辩证关系。<br>规律客观性。<br>发挥主观能动性。' },
                { id: 'pol-g2-4', chapter: '哲学生活', name: '认识论', content: '实践与认识的关系。<br>真理的特点。<br>认识的反复性与无限性。' }
            ],
            '地理': [
                { id: 'geo-g2-1', chapter: '区域地理', name: '中国地理分区', content: '北方地区、南方地区、西北地区、青藏地区。<br>各区自然与人文特征对比。' },
                { id: 'geo-g2-2', chapter: '区域地理', name: '世界地理', content: '各大洲地形、气候、水文特征。<br>主要国家与城市。' },
                { id: 'geo-g2-3', chapter: '环境问题', name: '资源与环境', content: '自然资源分类。<br>能源问题。<br>资源跨区域调配。' },
                { id: 'geo-g2-4', chapter: '环境问题', name: '环境污染与保护', content: '大气污染、水污染、固体废弃物污染。<br>可持续发展理念。<br>生态文明建设。' }
            ]
        },
        '高三': {
            '语文': [
                { id: 'yuwen-g3-1', chapter: '高考专题复习', name: '古诗词鉴赏', content: '炼字与炼句。<br>表达技巧分析。<br>思想感情概括。' },
                { id: 'yuwen-g3-2', chapter: '高考专题复习', name: '文言文阅读', content: '断句与翻译技巧。<br>信息筛选与概括。<br>内容分析与评价。' },
                { id: 'yuwen-g3-3', chapter: '综合训练', name: '现代文阅读', content: '小说阅读答题模板。<br>散文阅读答题技巧。<br>新闻阅读要点。' },
                { id: 'yuwen-g3-4', chapter: '综合训练', name: '写作提升', content: '高考作文评分标准。<br>议论文高级结构。<br>素材积累与运用。' }
            ],
            '英语': [
                { id: 'eng-g3-1', chapter: '高考题型专练', name: '阅读理解', content: '细节理解题技巧。<br>推理判断题方法。<br>主旨大意题策略。' },
                { id: 'eng-g3-2', chapter: '高考题型专练', name: '完形填空', content: '语境分析能力培养。<br>高频词汇积累。<br>常见固定搭配。' },
                { id: 'eng-g3-3', chapter: '高考题型专练', name: '语法填空与改错', content: '谓语动词与非谓语动词。<br>从句连接词。<br>常见错误类型。' },
                { id: 'eng-g3-4', chapter: '真题演练', name: '书面表达', content: '高考作文常见话题。<br>高级句型与词汇。<br>范文分析与模仿。' }
            ],
            '物理': [
                { id: 'phy-g3-1', chapter: '综合应用', name: '力学综合', content: '运动与力综合分析。<br>能量观点应用。<br>动量守恒定律。' },
                { id: 'phy-g3-2', chapter: '综合应用', name: '电磁学综合', content: '电场与磁场综合。<br>电磁感应综合。<br>力电综合问题。' },
                { id: 'phy-g3-3', chapter: '创新实验', name: '实验设计', content: '测量性实验方法。<br>控制变量法应用。<br>误差分析方法。' },
                { id: 'phy-g3-4', chapter: '创新实验', name: '高考实验专题', content: '打点计时器实验。<br>电阻测量方法。<br>电源电动势测定。' }
            ],
            '化学': [
                { id: 'chem-g3-1', chapter: '综合应用', name: '化学计算', content: '守恒法在计算中的应用。<br>关系式法。<br>过量计算与讨论。' },
                { id: 'chem-g3-2', chapter: '综合应用', name: '工艺流程', content: '物质分离与提纯。<br>反应条件控制。<br>绿色化学理念。' },
                { id: 'chem-g3-3', chapter: '实验专题', name: '实验基础', content: '仪器识别与使用。<br>气体制备方法。<br>实验安全意识。' },
                { id: 'chem-g3-4', chapter: '实验专题', name: '实验探究', content: '猜想与假设。<br>实验方案设计。<br>结论与反思。' }
            ],
            '历史': [
                { id: 'his-g3-1', chapter: '中外关联', name: '中国与世界', content: '中外历史对比分析。<br>文明交流互鉴。<br>中国梦与世界发展。' },
                { id: 'his-g3-2', chapter: '热点专题', name: '周年纪念热点', content: '重要历史事件周年。<br>历史人物纪念。<br>时事热点历史背景。' },
                { id: 'his-g3-3', chapter: '热点专题', name: '长效热点', content: '三农问题历史渊源。<br>科技革命影响。<br>全球化与逆全球化。' },
                { id: 'his-g3-4', chapter: '答题技巧', name: '选择题技巧', content: '时间定位法。<br>排除法应用。<br>关键词抓取。' }
            ],
            '政治': [
                { id: 'pol-g3-1', chapter: '时事政治', name: '年度重大时事', content: '国内重要会议与政策。<br>国际重要事件。<br>时政热点分析。' },
                { id: 'pol-g3-2', chapter: '时事政治', name: '长效热点', content: '五大发展理念。<br>供给侧结构性改革。<br>人类命运共同体。' },
                { id: 'pol-g3-3', chapter: '答题技巧', name: '选择题技巧', content: '主体分析法。<br>排除错误选项。<br>最优选项选择。' },
                { id: 'pol-g3-4', chapter: '答题技巧', name: '非选择题技巧', content: '题型分类与答题模板。<br>原理与方法论结合。<br>材料分析与运用。' }
            ],
            '地理': [
                { id: 'geo-g3-1', chapter: '综合分析', name: '区域发展', content: '区域差异分析。<br>区域协调发展。<br>区位因素评价。' },
                { id: 'geo-g3-2', chapter: '综合分析', name: '自然地理综合', content: '气候类型与分布。<br>地形对气候影响。<br>水循环与水平衡。' },
                { id: 'geo-g3-3', chapter: '答题模板', name: '综合题答题', content: '特征描述类答题思路。<br>原因分析类答题思路。<br>措施建议类答题思路。' },
                { id: 'geo-g3-4', chapter: '答题模板', name: '图表分析', content: '等值线图判读。<br>统计图表分析。<br>区域地图定位。' }
            ]
        }
    };

    // ========================================================================
    // 2. 合并工具：将外部加载的数据合并到基础数据中
    // ========================================================================
    /**
     * 合并两个 knowledgeData 结构：外部数据中的学科会覆盖/扩展基础数据
     */
    function mergeKnowledgeData(base, extra) {
        if (!extra || typeof extra !== 'object') return base;
        const result = {};
        // 复制基础结构
        for (const grade in base) {
            result[grade] = {};
            for (const subject in base[grade]) {
                result[grade][subject] = (base[grade][subject] || []).slice();
            }
        }
        // 叠加外部数据
        for (const grade in extra) {
            if (!result[grade]) result[grade] = {};
            for (const subject in extra[grade]) {
                const list = extra[grade][subject];
                if (Array.isArray(list) && list.length > 0) {
                    result[grade][subject] = list.slice(); // 覆盖/新增
                }
            }
        }
        return result;
    }

    // ========================================================================
    // 3. 知识数据加载器
    // ========================================================================
    const pendingCallbacks = [];
    let isReady = false;
    let finalData = null;

    /**
     * 主加载流程：
     *   1) 合并所有挂在 window 上的数据对象（如 window.mathKnowledgeData）
     *   2) 尝试通过 fetch 加载额外的 JSON 数据文件（仅在 http/https 环境下有效）
     *   3) 将最终结果挂到 window.knowledgeData 上，并触发所有回调
     */
    function startLoading() {
        // 从 window 上收集所有形如 xxxKnowledgeData / xxx_knowledge / xxxKnowledge 的数据
        const windowData = [
            window.mathKnowledgeData,
            window.physicsKnowledgeData,
            window.chineseKnowledgeData,
            window.englishKnowledgeData,
            window.chemistryKnowledgeData,
            window.biologyKnowledgeData,
            window.historyKnowledgeData,
            window.politicsKnowledgeData,
            window.geographyKnowledgeData
        ].filter(Boolean);

        // 将基础数据和 window 上已有的数据做一次合并
        let data = BASE_KNOWLEDGE;
        windowData.forEach(function (ext) {
            data = mergeKnowledgeData(data, ext);
        });
        finalData = data;

        // 尝试加载 JSON 文件（可选，失败不影响功能）
        const jsonSources = [];
        const fetches = jsonSources.map(function (url) {
            return fetch(url)
                .then(function (resp) { return resp.ok ? resp.json() : null; })
                .then(function (json) {
                    if (json) {
                        finalData = mergeKnowledgeData(finalData, json);
                    }
                })
                .catch(function () { /* 静默失败 */ });
        });

        Promise.all(fetches).then(function () {
            window.knowledgeData = finalData;
            isReady = true;
            while (pendingCallbacks.length) {
                const cb = pendingCallbacks.shift();
                try { cb(window.knowledgeData); } catch (e) { /* no-op */ }
            }
        });
    }

    // 对外接口
    const Loader = {
        whenReady: function (cb) {
            if (typeof cb !== 'function') return;
            if (isReady) { cb(window.knowledgeData); }
            else { pendingCallbacks.push(cb); }
        },
        isReady: function () { return isReady; },
        get: function () { return window.knowledgeData; }
    };

    global.KnowledgeDataLoader = Loader;

    // 页面脚本加载完毕后，启动加载流程
    // 放在 DOMContentLoaded 后，让 <script src="math_knowledge.js"> 等先执行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startLoading);
    } else {
        startLoading();
    }

})(window);
