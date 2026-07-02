/**
 * AI Interview System — Mock Data
 * All mock data for the application, organized by domain.
 * Call MockData.init() on page load to seed localStorage.
 */

const MockData = {

  /* ============================================
     Students
     ============================================ */
  students: [
    { id: 'STU001', name: '张三', idCard: '440101200501011234', studentNo: '2026001', major: '汽车维修', phone: '13800138001', className: '汽修2401班', enrollmentYear: '2026', avatar: null },
    { id: 'STU002', name: '李四', idCard: '440102200502022345', studentNo: '2026002', major: '烹饪工艺', phone: '13800138002', className: '烹饪2401班', enrollmentYear: '2026', avatar: null },
    { id: 'STU003', name: '王五', idCard: '440103200503033456', studentNo: '2026003', major: '机电一体化', phone: '13800138003', className: '机电2401班', enrollmentYear: '2026', avatar: null },
    { id: 'STU004', name: '赵六', idCard: '440104200504044567', studentNo: '2026004', major: '汽车维修', phone: '13800138004', className: '汽修2401班', enrollmentYear: '2026', avatar: null },
    { id: 'STU005', name: '钱七', idCard: '440105200505055678', studentNo: '2026005', major: '烹饪工艺', phone: '13800138005', className: '烹饪2402班', enrollmentYear: '2026', avatar: null },
    { id: 'STU006', name: '孙八', idCard: '440106200506066789', studentNo: '2026006', major: '数控技术', phone: '13800138006', className: '数控2401班', enrollmentYear: '2025', avatar: null },
    { id: 'STU007', name: '周九', idCard: '440107200507077890', studentNo: '2026007', major: '电子商务', phone: '13800138007', className: '电商2401班', enrollmentYear: '2026', avatar: null },
    { id: 'STU008', name: '吴十', idCard: '440108200508088901', studentNo: '2026008', major: '机电一体化', phone: '13800138008', className: '机电2402班', enrollmentYear: '2024', avatar: null },
  ],

  /* ============================================
     Majors
     ============================================ */
  majors: ['汽车维修', '烹饪工艺', '机电一体化', '数控技术', '电子商务', '计算机应用'],

  /* ============================================
     Question Bank — organized by major
     Question types: single, multiple, judge, short_answer, fill_blank, cloze
     ============================================ */
  questions: {
    '汽车维修': [
      { id: 'Q001', type: 'single', content: '四冲程汽油发动机的正确工作顺序是？', options: ['进气→压缩→做功→排气', '进气→做功→压缩→排气', '压缩→进气→做功→排气', '排气→进气→压缩→做功'], answer: 0, difficulty: 1, knowledge: '发动机原理' },
      { id: 'Q002', type: 'single', content: '汽车底盘由哪几部分组成？', options: ['传动系、行驶系、转向系、制动系', '发动机、变速箱、车桥、车轮', '车身、底盘、电气、发动机', '悬挂、转向、制动、排气'], answer: 0, difficulty: 1, knowledge: '底盘构造' },
      { id: 'Q003', type: 'multiple', content: '以下属于发动机润滑系统组成部分的有？', options: ['机油泵', '机油滤清器', '散热器', '油底壳', '节气门'], answer: [0, 1, 3], difficulty: 2, knowledge: '润滑系统' },
      { id: 'Q004', type: 'multiple', content: '导致发动机过热的原因可能包括？', options: ['冷却液不足', '节温器故障', '风扇不转', '机油过多', '点火提前角过大'], answer: [0, 1, 2, 4], difficulty: 3, knowledge: '冷却系统' },
      { id: 'Q005', type: 'judge', content: '汽油发动机的压缩比通常比柴油发动机低。', answer: true, difficulty: 1, knowledge: '发动机原理' },
      { id: 'Q006', type: 'judge', content: 'ABS防抱死制动系统可以缩短制动距离。', answer: false, difficulty: 2, knowledge: '制动系统' },
      { id: 'Q007', type: 'short_answer', content: '请简述发动机冷却系统的主要作用及工作原理。', keywords: ['散热', '循环', '节温器', '水温', '冷却液', '水泵'], modelAnswer: '发动机冷却系统的主要作用是保持发动机在正常工作温度范围内运行。工作原理：水泵驱动冷却液在发动机水套和散热器之间循环流动，将发动机产生的热量带到散热器散发到空气中。节温器根据水温自动调节冷却液循环路径，冷车时小循环快速升温，热车时大循环充分散热。', difficulty: 3, knowledge: '冷却系统' },
      { id: 'Q008', type: 'short_answer', content: '请说明汽车制动系统的工作原理。', keywords: ['制动踏板', '制动液', '摩擦', '制动片', '制动盘', '液压'], modelAnswer: '汽车制动系统通过液压传动原理工作。驾驶员踩下制动踏板，推动制动总泵活塞，使制动液产生压力，压力通过管路传递到各车轮的制动分泵，推动制动片夹紧制动盘（或制动蹄撑开制动鼓），利用摩擦力将车辆动能转化为热能，实现减速或停车。', difficulty: 3, knowledge: '制动系统' },
      { id: 'Q009', type: 'fill_blank', content: '汽车制动系统主要由___、___和___三部分组成。', blanks: ['制动踏板（操纵装置）', '制动传动装置（液压/气压）', '制动器（执行装置）'], difficulty: 2, knowledge: '制动系统' },
      { id: 'Q010', type: 'fill_blank', content: '发动机正常工作水温一般在___℃到___℃之间。', blanks: ['80', '95'], difficulty: 1, knowledge: '冷却系统' },
      { id: 'Q011', type: 'cloze', content: '发动机是汽车的动力源泉，它通过燃烧{{0}}产生动力。汽油发动机采用{{1}}点火方式，而柴油发动机采用{{2}}点火方式。现代汽车发动机普遍采用电子控制{{3}}系统，能精确控制喷油量和喷油时机。', blanks: ['燃料（汽油/柴油）', '火花塞', '压燃（压缩自燃）', '燃油喷射（电喷）'], difficulty: 2, knowledge: '发动机原理' },
      { id: 'Q012', type: 'single', content: '以下哪种故障会导致汽车跑偏？', options: ['轮胎气压不一致', '发动机功率不足', '空调系统故障', '音响系统故障'], answer: 0, difficulty: 2, knowledge: '底盘构造' },
    ],

    '烹饪工艺': [
      { id: 'Q101', type: 'single', content: '以下哪种刀工技法是将原料切成细丝？', options: ['切丝', '切片', '切丁', '切段'], answer: 0, difficulty: 1, knowledge: '刀工技法' },
      { id: 'Q102', type: 'single', content: '食品加工中，"焯水"的主要目的是？', options: ['去除异味和血沫', '增加食物颜色', '提高食物甜度', '使食物变软'], answer: 0, difficulty: 1, knowledge: '烹饪基础' },
      { id: 'Q103', type: 'multiple', content: '以下属于中式烹饪基本技法的是？', options: ['炒', '炸', '烤', '蒸', '煮'], answer: [0, 1, 2, 3, 4], difficulty: 1, knowledge: '烹饪技法' },
      { id: 'Q104', type: 'multiple', content: '厨房食品安全管理中，以下哪些是正确的做法？', options: ['生熟分开存放', '定期清洁消毒', '食物留样48小时', '从业人员持健康证上岗', '食材随意堆放'], answer: [0, 1, 2, 3], difficulty: 2, knowledge: '食品安全' },
      { id: 'Q105', type: 'judge', content: '烹饪中"勾芡"的作用是增加菜肴的色泽和口感。', answer: true, difficulty: 1, knowledge: '烹饪技法' },
      { id: 'Q106', type: 'judge', content: '食材的初加工包括洗涤、切配和烹饪三个步骤。', answer: false, difficulty: 2, knowledge: '烹饪基础' },
      { id: 'Q107', type: 'short_answer', content: '请简述食品加工过程中防止交叉污染的措施。', keywords: ['生熟分开', '工具分类', '消毒', '温度', '储存', '清洁'], modelAnswer: '防止交叉污染的主要措施包括：1.生熟食材分开存放和加工，使用不同的砧板和刀具；2.加工工具（砧板、刀具、容器）定期消毒；3.控制储存温度，冷藏温度保持在0-4℃；4.从业人员注意个人卫生，操作前后洗手消毒；5.垃圾及时清理，保持加工环境清洁。', difficulty: 3, knowledge: '食品安全' },
      { id: 'Q108', type: 'short_answer', content: '请说明中餐"火候"对菜肴质量的影响。', keywords: ['温度', '时间', '口感', '色泽', '营养', '火候控制'], modelAnswer: '火候是烹饪中控制加热温度和时间的技巧，直接影响菜肴质量。火候过大可能导致食材外焦内生、营养流失；火候不足则食材不熟、口感差。恰当的火候能保证食材受热均匀，达到理想的色泽、口感和营养成分保留。不同食材和烹饪方法需要不同的火候控制。', difficulty: 3, knowledge: '烹饪技法' },
      { id: 'Q109', type: 'fill_blank', content: '厨房"四害"是指___、___、___和___。', blanks: ['老鼠', '蟑螂', '苍蝇', '蚊子'], difficulty: 1, knowledge: '食品安全' },
      { id: 'Q110', type: 'fill_blank', content: '食品冷藏保存温度应控制在___℃以下，热菜保温温度应保持在___℃以上。', blanks: ['4', '60'], difficulty: 2, knowledge: '食品安全' },
      { id: 'Q111', type: 'cloze', content: '中式烹饪讲究"色、{{0}}、{{1}}、{{2}}"四个方面的统一。其中"色"指菜肴的{{3}}，"香"指菜肴的{{4}}。', blanks: ['香', '味', '形', '色泽（外观）', '气味（香味）'], difficulty: 1, knowledge: '烹饪基础' },
      { id: 'Q112', type: 'single', content: '以下哪种调味方式属于"复合味"的调配？', options: ['糖醋味', '咸味', '甜味', '辣味'], answer: 0, difficulty: 2, knowledge: '调味技术' },
    ],

    '机电一体化': [
      { id: 'Q201', type: 'single', content: '三相交流电的线电压为380V时，相电压为？', options: ['220V', '380V', '110V', '36V'], answer: 0, difficulty: 1, knowledge: '电工基础' },
      { id: 'Q202', type: 'single', content: 'PLC编程中，OUT指令的作用是？', options: ['输出控制信号', '读取输入信号', '设置定时器', '调用子程序'], answer: 0, difficulty: 2, knowledge: 'PLC编程' },
      { id: 'Q203', type: 'multiple', content: '以下属于传感器类型的有？', options: ['温度传感器', '压力传感器', '光电传感器', '接近传感器', '电动螺丝刀'], answer: [0, 1, 2, 3], difficulty: 1, knowledge: '传感器技术' },
      { id: 'Q204', type: 'multiple', content: '电气设备安全操作规范包括？', options: ['操作前检查设备状态', '佩戴绝缘手套', '湿手操作开关', '断电检修', '挂牌上锁'], answer: [0, 1, 3, 4], difficulty: 2, knowledge: '安全规范' },
      { id: 'Q205', type: 'judge', content: '交流电和直流电可以互相转换。', answer: true, difficulty: 1, knowledge: '电工基础' },
      { id: 'Q206', type: 'judge', content: 'PLC只能处理数字量信号，不能处理模拟量信号。', answer: false, difficulty: 2, knowledge: 'PLC编程' },
      { id: 'Q207', type: 'short_answer', content: '请简述PLC（可编程逻辑控制器）的基本工作原理。', keywords: ['输入扫描', '程序执行', '输出刷新', '循环扫描', '存储器', 'CPU'], modelAnswer: 'PLC采用循环扫描工作方式，每个扫描周期包括三个阶段：1.输入扫描阶段：读取所有输入端口的状态并存入输入映像寄存器；2.程序执行阶段：CPU按照从上到下的顺序执行用户程序，处理逻辑运算；3.输出刷新阶段：将运算结果写入输出映像寄存器，并通过输出端口控制外部设备。整个过程不断循环重复。', difficulty: 3, knowledge: 'PLC编程' },
      { id: 'Q208', type: 'short_answer', content: '请说明机电设备日常维护保养的基本内容。', keywords: ['清洁', '润滑', '检查', '紧固', '调整', '更换'], modelAnswer: '机电设备日常维护保养的基本内容包括：1.清洁：清除设备表面灰尘和油污，保持设备整洁；2.润滑：按规程对运动部件加注润滑油；3.检查：检查设备运行状态，包括温度、声音、振动等是否正常；4.紧固：检查并紧固松动的连接件和螺栓；5.调整：调整设备参数至正常工作范围；6.更换：及时更换磨损严重的零部件。', difficulty: 3, knowledge: '设备维护' },
      { id: 'Q209', type: 'fill_blank', content: '欧姆定律的公式为___，其中I表示___，U表示___，R表示___。', blanks: ['I=U/R', '电流', '电压', '电阻'], difficulty: 1, knowledge: '电工基础' },
      { id: 'Q210', type: 'fill_blank', content: '电气设备检修时必须遵循的安全步骤是：___、___、___、___。', blanks: ['停电', '验电', '放电', '接地'], difficulty: 2, knowledge: '安全规范' },
      { id: 'Q211', type: 'cloze', content: '机电一体化系统由{{0}}、{{1}}、{{2}}和{{3}}四大要素组成。其中{{0}}是系统的"大脑"，{{1}}是系统的"肌肉"。', blanks: ['控制系统', '执行机构', '传感检测', '动力系统'], difficulty: 2, knowledge: '机电基础' },
      { id: 'Q212', type: 'single', content: '以下哪种保护器件用于防止电路短路？', options: ['熔断器（保险丝）', '热继电器', '接触器', '按钮开关'], answer: 0, difficulty: 2, knowledge: '电气元件' },
    ],

    '数控技术': [
      { id: 'Q301', type: 'single', content: 'CNC机床中，G代码主要用于？', options: ['运动控制指令', '辅助功能指令', '刀具补偿', '主轴控制'], answer: 0, difficulty: 1, knowledge: '数控编程' },
      { id: 'Q302', type: 'single', content: '数控加工中，"零点"是指？', options: ['工件坐标原点', '机床原点', '刀具起点', '程序起点'], answer: 0, difficulty: 1, knowledge: '数控基础' },
      { id: 'Q303', type: 'multiple', content: '以下属于数控机床组成部分的有？', options: ['数控装置', '伺服驱动系统', '机床本体', '测量反馈装置', '普通手柄'], answer: [0, 1, 2, 3], difficulty: 1, knowledge: '数控基础' },
      { id: 'Q304', type: 'multiple', content: '数控编程中常用的坐标系有？', options: ['机床坐标系', '工件坐标系', '局部坐标系', '绝对坐标系', '相对坐标系'], answer: [0, 1, 2, 3, 4], difficulty: 2, knowledge: '数控编程' },
      { id: 'Q305', type: 'judge', content: '数控机床的加工精度主要取决于机床的机械精度和数控系统的控制精度。', answer: true, difficulty: 1, knowledge: '数控基础' },
      { id: 'Q306', type: 'judge', content: 'G00指令是直线插补指令，用于直线切削加工。', answer: false, difficulty: 2, knowledge: '数控编程' },
      { id: 'Q307', type: 'short_answer', content: '请简述数控加工的基本工艺流程。', keywords: ['图纸分析', '工艺规划', '编程', '输入', '加工', '检验'], modelAnswer: '数控加工的基本工艺流程：1.图纸分析：理解零件图纸要求，确定加工内容；2.工艺规划：确定加工路线、切削参数、刀具选择；3.数控编程：编写或生成数控加工程序；4.程序输入与校验：将程序输入数控系统并进行空运行校验；5.零件加工：安装工件和刀具，执行加工程序；6.质量检验：检测加工零件是否符合图纸要求。', difficulty: 3, knowledge: '数控工艺' },
      { id: 'Q308', type: 'short_answer', content: '请说明刀具补偿在数控加工中的作用。', keywords: ['刀具磨损', '半径补偿', '长度补偿', '精度', '编程简化'], modelAnswer: '刀具补偿在数控加工中具有重要作用：1.刀具半径补偿：当使用不同半径的刀具时，无需修改程序轨迹，只需在系统中设置刀具半径值，系统自动计算偏移量；2.刀具长度补偿：补偿刀具长度差异，确保加工深度准确；3.磨损补偿：补偿刀具使用后的磨损量，维持加工精度。刀具补偿大大简化了编程工作，提高了加工灵活性和精度。', difficulty: 3, knowledge: '数控编程' },
      { id: 'Q309', type: 'fill_blank', content: 'G01指令表示___运动，G00指令表示___运动。', blanks: ['直线插补', '快速定位（点位）'], difficulty: 1, knowledge: '数控编程' },
      { id: 'Q310', type: 'fill_blank', content: '数控机床的加工精度通常用___mm来衡量，一般数控机床的定位精度可达___mm。', blanks: ['加工误差', '0.01（或0.005）'], difficulty: 2, knowledge: '数控基础' },
      { id: 'Q311', type: 'cloze', content: '数控编程方法主要分为{{0}}和{{1}}两种。其中{{0}}适用于简单零件，{{1}}利用CAD/CAM软件自动生成程序，适用于{{2}}零件。', blanks: ['手工编程', '自动编程（计算机辅助编程）', '复杂'], difficulty: 2, knowledge: '数控编程' },
      { id: 'Q312', type: 'single', content: '以下哪个M代码表示主轴正转？', options: ['M03', 'M04', 'M05', 'M06'], answer: 0, difficulty: 1, knowledge: '数控编程' },
    ],

    '电子商务': [
      { id: 'Q401', type: 'single', content: '以下哪种营销方式属于社交媒体营销？', options: ['微信公众号推广', '电视广告', '报纸广告', '户外广告牌'], answer: 0, difficulty: 1, knowledge: '网络营销' },
      { id: 'Q402', type: 'single', content: '电商运营中，"转化率"是指？', options: ['下单用户数/访问用户数', '访问用户数/注册用户数', '退货订单数/总订单数', '好评数/总评价数'], answer: 0, difficulty: 1, knowledge: '电商运营' },
      { id: 'Q403', type: 'multiple', content: '以下属于电商平台主要模式的有？', options: ['B2B', 'B2C', 'C2C', 'O2O', 'P2P借贷'], answer: [0, 1, 2, 3], difficulty: 1, knowledge: '电商基础' },
      { id: 'Q404', type: 'multiple', content: '网店商品标题优化应考虑的因素包括？', options: ['关键词搜索量', '商品核心属性', '品牌词', '促销信息', '无关热门词'], answer: [0, 1, 2, 3], difficulty: 2, knowledge: '电商运营' },
      { id: 'Q405', type: 'judge', content: '电子商务中的"物流"仅指快递配送。', answer: false, difficulty: 1, knowledge: '电商基础' },
      { id: 'Q406', type: 'judge', content: 'SEO（搜索引擎优化）是提高网站在搜索引擎自然排名的技术。', answer: true, difficulty: 2, knowledge: '网络营销' },
      { id: 'Q407', type: 'short_answer', content: '请简述电子商务订单处理的基本流程。', keywords: ['下单', '支付', '确认', '配货', '发货', '签收', '评价'], modelAnswer: '电子商务订单处理基本流程：1.顾客下单：浏览商品后提交订单；2.在线支付：选择支付方式完成付款；3.订单确认：系统确认支付成功，生成订单；4.仓库配货：根据订单信息拣选商品；5.打包发货：将商品打包交由物流公司配送；6.物流跟踪：顾客可实时查看物流信息；7.签收评价：顾客收到商品后确认收货并评价。', difficulty: 3, knowledge: '电商运营' },
      { id: 'Q408', type: 'short_answer', content: '请说明客户关系管理（CRM）在电子商务中的重要性。', keywords: ['客户维护', '复购', '满意度', '数据分析', '个性化', '忠诚度'], modelAnswer: 'CRM在电子商务中具有重要意义：1.客户维护：通过系统化管理客户信息，提供更好的服务体验；2.提高复购率：通过精准营销和个性化推荐促进客户再次购买；3.提升满意度：及时响应客户需求，处理售后问题；4.数据分析：分析客户行为数据，优化运营策略；5.培养忠诚度：通过会员体系、积分奖励等增强客户粘性。', difficulty: 3, knowledge: '电商运营' },
      { id: 'Q409', type: 'fill_blank', content: '电商运营的核心指标"ROI"全称是___，计算公式为___。', blanks: ['投资回报率（Return on Investment）', '利润/投资成本×100%'], difficulty: 2, knowledge: '电商运营' },
      { id: 'Q410', type: 'fill_blank', content: '常见的在线支付方式包括___、___和___。', blanks: ['支付宝', '微信支付', '银行卡支付（网银）'], difficulty: 1, knowledge: '电商基础' },
      { id: 'Q411', type: 'cloze', content: '电商客服的主要工作包括{{0}}、{{1}}、{{2}}和{{3}}。其中{{0}}是售前服务，{{2}}是售后服务。', blanks: ['售前咨询', '订单处理', '售后处理', '投诉处理'], difficulty: 1, knowledge: '电商运营' },
      { id: 'Q412', type: 'single', content: '以下哪种方式可以有效降低电商退货率？', options: ['准确详细的商品描述和实物图', '夸大商品功能', '模糊商品图片', '减少商品信息'], answer: 0, difficulty: 2, knowledge: '电商运营' },
    ],

    '计算机应用': [
      { id: 'Q501', type: 'single', content: '计算机中，1GB等于？', options: ['1024MB', '1000MB', '1024KB', '1000KB'], answer: 0, difficulty: 1, knowledge: '计算机基础' },
      { id: 'Q502', type: 'single', content: '以下哪种不是计算机操作系统？', options: ['Windows', 'CPU', 'Linux', 'macOS'], answer: 1, difficulty: 1, knowledge: '操作系统' },
      { id: 'Q503', type: 'multiple', content: '以下属于办公软件组件的有？', options: ['文字处理', '电子表格', '演示文稿', '数据库管理', '游戏引擎'], answer: [0, 1, 2, 3], difficulty: 1, knowledge: '办公软件' },
      { id: 'Q504', type: 'multiple', content: '计算机网络按覆盖范围可分为？', options: ['局域网(LAN)', '城域网(MAN)', '广域网(WAN)', '互联网', '蓝牙网络'], answer: [0, 1, 2, 3], difficulty: 2, knowledge: '网络基础' },
      { id: 'Q505', type: 'judge', content: 'HTTP协议是超文本传输协议，是互联网数据通信的基础。', answer: true, difficulty: 1, knowledge: '网络基础' },
      { id: 'Q506', type: 'judge', content: '计算机病毒是一种硬件故障。', answer: false, difficulty: 1, knowledge: '信息安全' },
      { id: 'Q507', type: 'short_answer', content: '请简述计算机信息安全的基本防护措施。', keywords: ['密码', '防火墙', '杀毒软件', '备份', '更新', '权限'], modelAnswer: '计算机信息安全的基本防护措施：1.设置强密码并定期更换；2.安装防火墙，控制网络访问；3.安装并更新杀毒软件，定期扫描；4.重要数据定期备份；5.及时更新操作系统和软件补丁；6.合理设置访问权限，最小权限原则；7.不随意点击不明链接和下载未知文件。', difficulty: 3, knowledge: '信息安全' },
      { id: 'Q508', type: 'short_answer', content: '请说明IP地址和MAC地址的区别。', keywords: ['网络层', '数据链路层', '逻辑地址', '物理地址', '可变', '固定', 'IPv4', 'IPv6'], modelAnswer: 'IP地址和MAC地址的区别：1.所属层级不同：IP地址工作在网络层，MAC地址工作在数据链路层；2.性质不同：IP地址是逻辑地址，可以手动配置或自动获取（DHCP）；MAC地址是物理地址，烧录在网卡上，全球唯一且不可更改；3.表示方式不同：IP地址如192.168.1.1（IPv4），MAC地址如00:1A:2B:3C:4D:5E；4.作用范围不同：IP地址用于网络间寻址路由，MAC地址用于同一网络内的设备通信。', difficulty: 3, knowledge: '网络基础' },
      { id: 'Q509', type: 'fill_blank', content: 'CPU的中文全称是___，它是计算机的___部件。', blanks: ['中央处理器', '核心运算（处理）'], difficulty: 1, knowledge: '计算机基础' },
      { id: 'Q510', type: 'fill_blank', content: '常见的计算机存储设备有___、___和___。', blanks: ['硬盘（HDD/SSD）', 'U盘（闪存盘）', '光盘'], difficulty: 1, knowledge: '计算机基础' },
      { id: 'Q511', type: 'cloze', content: 'OSI七层模型从下到上依次是：{{0}}层、{{1}}层、{{2}}层、{{3}}层、{{4}}层、{{5}}层和{{6}}层。', blanks: ['物理', '数据链路', '网络', '传输', '会话', '表示', '应用'], difficulty: 2, knowledge: '网络基础' },
      { id: 'Q512', type: 'single', content: '以下哪种文件格式是图片格式？', options: ['JPG', 'MP3', 'PDF', 'DOCX'], answer: 0, difficulty: 1, knowledge: '计算机基础' },
    ]
  },

  /* ============================================
     Interview Sessions (for admin)
     ============================================ */
  interviews: [
    {
      id: 'INT001',
      title: '2026年秋季汽车维修专业面试（第一批）',
      major: '汽车维修',
      date: '2026-07-02',
      time: '09:00-12:00',
      mode: 'scheduled', // scheduled or self_service
      interviewer: { name: '刘老师', id: 'INTW001', avatar: null },
      status: 'upcoming',
      description: '汽车维修专业第一批入学面试，重点考察专业基础知识和实操能力',
      students: ['STU001', 'STU004'],
      trtcRoomId: 'TRTC-20260702-001'
    },
    {
      id: 'INT002',
      title: '2026年秋季烹饪工艺专业面试',
      major: '烹饪工艺',
      date: '2026-06-25',
      time: '14:00-17:00',
      mode: 'self_service', // self-service mode
      interviewer: { name: '陈老师', id: 'INTW002', avatar: null },
      status: 'upcoming',
      description: '烹饪工艺专业自助测评，包含AI纹身检测',
      students: ['STU002', 'STU005'],
      trtcRoomId: null
    },
    {
      id: 'INT003',
      title: '2026年秋季机电一体化专业面试',
      major: '机电一体化',
      date: '2026-06-26',
      time: '09:00-12:00',
      mode: 'scheduled',
      interviewer: { name: '王老师', id: 'INTW003', avatar: null },
      status: 'upcoming',
      description: '机电一体化专业实时面试，考察PLC编程和设备维护能力',
      students: ['STU001', 'STU003', 'STU008'],
      trtcRoomId: 'TRTC-20260626-001'
    },
    {
      id: 'INT004',
      title: '2026年春季数控技术专业面试',
      major: '数控技术',
      date: '2026-06-20',
      time: '09:00-11:00',
      mode: 'self_service',
      interviewer: { name: '赵老师', id: 'INTW004', avatar: null },
      status: 'completed',
      description: '数控技术专业自助测评（已结束）',
      students: ['STU006'],
      trtcRoomId: null
    },
    {
      id: 'INT005',
      title: '2026年秋季电子商务专业面试',
      major: '电子商务',
      date: '2026-06-27',
      time: '10:00-12:00',
      mode: 'scheduled',
      interviewer: { name: '李老师', id: 'INTW005', avatar: null },
      status: 'upcoming',
      description: '电子商务专业实时面试',
      students: ['STU007'],
      trtcRoomId: 'TRTC-20260627-001'
    },
  ],

  /* ============================================
     Questionnaires
     ============================================ */
  questionnaires: [
    { id: 'QN001', title: '新生入学性格测评', type: 'personality', questions: ['你更喜欢团队合作还是独立工作？', '面对压力时你通常如何应对？', '你认为自己最大的优点是什么？'], status: 'active', responses: 5 },
    { id: 'QN002', title: '健康状况调查问卷', type: 'health', questions: ['你是否有以下慢性疾病？', '你是否有食物过敏史？', '你是否有纹身或疤痕？'], status: 'active', responses: 3 },
    { id: 'QN003', title: '学习兴趣倾向调查', type: 'interest', questions: ['你对以下哪些技术领域最感兴趣？', '你希望在校期间重点学习什么技能？'], status: 'draft', responses: 0 },
  ],

  /* ============================================
     Interviewers
     ============================================ */
  interviewers: [
    { id: 'INTW001', name: '刘老师', department: '汽车工程系', phone: '13900001001' },
    { id: 'INTW002', name: '陈老师', department: '烹饪艺术系', phone: '13900001002' },
    { id: 'INTW003', name: '王老师', department: '机电工程系', phone: '13900001003' },
    { id: 'INTW004', name: '赵老师', department: '数控技术系', phone: '13900001004' },
    { id: 'INTW005', name: '李老师', department: '电子商务系', phone: '13900001005' },
  ],

  /* ============================================
     Notifications (for student notice page)
     ============================================ */
  notifications: [
    { id: 'NOT001', type: 'system', title: '欢迎使用AI智能面试系统', content: '欢迎使用AI智能面试系统，请按照指引完成测评流程。如有问题请联系技术支持。', time: Date.now() - 7200000, read: false, studentId: 'all' },
    { id: 'NOT002', type: 'interview', title: '您的面试已安排', content: '面试时间：2026年6月25日 09:00-12:00\n面试专业：汽车维修\n面试官：刘老师\n请准时参加。', time: Date.now() - 86400000, read: false, studentId: 'STU001', interviewId: 'INT001' },
    { id: 'NOT003', type: 'exam', title: '综合测试已完成', content: '您的综合测试已完成，得分：85分。请继续完成视频录制环节。', time: Date.now() - 86400000, read: true, studentId: 'STU001' },
    { id: 'NOT004', type: 'detection', title: 'AI纹身检测已通过', content: '您的四肢纹身AI检测已通过，未检测到纹身。', time: Date.now() - 172800000, read: true, studentId: 'STU001' },
    { id: 'NOT005', type: 'result', title: '面试结果已出', content: '恭喜！您的面试已通过。请查看完整评估报告。', time: Date.now() - 259200000, read: true, studentId: 'STU001' },
    { id: 'NOT006', type: 'system', title: '系统维护通知', content: '系统将于6月28日凌晨2:00-4:00进行维护升级，届时将暂停服务。', time: Date.now() - 432000000, read: true, studentId: 'all' },
    { id: 'NOT007', type: 'interview', title: '您被加入了机电一体化专业面试', content: '您已被安排参加2026年6月26日机电一体化专业面试，面试官：王老师，请准时参加。', time: Date.now() - 3600000, read: false, studentId: 'STU001', interviewId: 'INT003' },
     { id: 'NOT008', type: 'system', title: '面试日期变更通知', content: '原定6月25日的汽车维修专业面试已调整至7月2日，请留意更新后的时间安排。', time: Date.now() - 1800000, read: false, studentId: 'STU001', interviewId: 'INT001' },
     { id: 'NOT009', type: 'assessment', title: '面试着装要求提醒', content: '参加面试时请穿着整洁，不得佩戴帽子、墨镜等遮挡物品。女生请束发露出耳朵。', time: Date.now() - 7200000, read: false, studentId: 'all' },
     { id: 'NOT010', type: 'interview', title: '面试评分标准已更新', content: '最新面试评分标准已发布，包含专业素养、表达能力、仪容仪表、综合印象四个维度，请提前了解。', time: Date.now() - 14400000, read: true, studentId: 'all' },
    ],

  /* ============================================
     Initialize mock data into localStorage
     ============================================ */
  init() {
    // Check version — if code was updated, force re-initialize
    var version = DataStore.get('mockVersion');
    var currentVersion = 'v4';
    var needsInit = !version || version !== currentVersion;

    if (needsInit) {
      DataStore.set('allStudents', this.students);
      DataStore.set('allInterviews', this.interviews);
      DataStore.set('allQuestionnaires', this.questionnaires);
      DataStore.set('allInterviewers', this.interviewers);
      DataStore.set('allNotifications', this.notifications);
      DataStore.remove('interviewState'); // clear old state to re-seed
      DataStore.set('mockVersion', currentVersion);
      DataStore.set('initialized', true);
      console.log('[MockData] Re-initialized mock data (version ' + currentVersion + ').');
    }

    // Always seed interview state to ensure demo data is available
    if (!DataStore.get('interviewState')) {
      this._seedInterviewState();
    }
  },

  /* ============================================
     Interview State — pre-seeded use case data
     ============================================ */
  _seedInterviewState() {
    // Helper — uses common.js InterviewState API for consistent key format
    var setStatus = function(stuId, intId, status) {
      InterviewState.setStudentStatus(stuId, intId, { status: status });
    };
    var setScore = function(stuId, intId, score) {
      InterviewState.setScore(stuId, intId, score);
    };
    var setAI = function(stuId, intId, aiResult) {
      InterviewState.setAIResult(stuId, intId, aiResult);
    };

    // ---- INT001: 汽车维修 ----
    setScore('STU001', 'INT001', {
      professionalism: 88, expression: 82, appearance: 91, impression: 85,
      total: 86.4,
      comment: '该生专业素养扎实，对汽车发动机原理掌握到位，表达清晰有条理，仪容整洁，综合表现优秀。',
      scoredAt: Date.now() - 86400000, scoredBy: '刘老师'
    });
    setStatus('STU001', 'INT001', { status: 'completed', scored: true });
    setAI('STU001', 'INT001', { status: 'pass', confidence: 0.97 });

    setScore('STU004', 'INT001', {
      professionalism: 72, expression: 68, appearance: 85, impression: 76,
      total: 74.4,
      comment: '基础知识尚可，但表达能力有待提高，回答问题时逻辑不够清晰，建议加强口语训练。',
      scoredAt: Date.now() - 43200000, scoredBy: '刘老师'
    });
    setStatus('STU004', 'INT001', { status: 'completed', scored: true });
    setAI('STU004', 'INT001', { status: 'pass', confidence: 0.93 });

    // ---- INT002: 烹饪工艺 ----
    setScore('STU002', 'INT002', {
      professionalism: 92, expression: 88, appearance: 86, impression: 90,
      total: 89.6,
      comment: '该生对烹饪工艺有浓厚兴趣，实操知识丰富，回答问题条理清晰，具备良好的职业素养。',
      scoredAt: Date.now() - 172800000, scoredBy: '陈老师'
    });
    setStatus('STU002', 'INT002', { status: 'completed', scored: true });
    setAI('STU002', 'INT002', { status: 'pass', confidence: 0.99 });

    setScore('STU005', 'INT002', {
      professionalism: 65, expression: 72, appearance: 78, impression: 68,
      total: 68.8,
      comment: '对烹饪基础有一定了解，但专业知识深度不够，建议加强实践操作和理论学习。',
      scoredAt: Date.now() - 86400000, scoredBy: '陈老师'
    });
    setStatus('STU005', 'INT002', { status: 'completed', scored: true });
    setAI('STU005', 'INT002', { status: 'warning', confidence: 0.76 });

    // ---- INT003: 机电一体化 ----
    setStatus('STU001', 'INT003', { status: 'pending' });
    setStatus('STU003', 'INT003', { status: 'interviewing' });
    setStatus('STU008', 'INT003', { status: 'pending' });

    // ---- INT004: 数控技术 ----
    setScore('STU006', 'INT004', {
      professionalism: 95, expression: 90, appearance: 88, impression: 93,
      total: 92.2,
      comment: '该生数控编程能力突出，对G代码和M代码掌握熟练，能够独立完成复杂零件的编程与加工，表现优异。',
      scoredAt: Date.now() - 604800000, scoredBy: '赵老师'
    });
    setStatus('STU006', 'INT004', { status: 'completed', scored: true });
    setAI('STU006', 'INT004', { status: 'pass', confidence: 0.98 });

    // ---- INT005: 电子商务 ----
    setStatus('STU007', 'INT005', { status: 'pending' });

    console.log('[MockData] Seeded interview state with use case data.');
  }
};
