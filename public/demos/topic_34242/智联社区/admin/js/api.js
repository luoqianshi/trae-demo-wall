/* 邻里智联 - 管理后台 API 客户端 */
const API_BASE = 'http://127.0.0.1:5000/api';

/* ============== Mock 数据（完整） ============== */
const MOCK_DATA = {
    workOrders: [
        { id: 1, order_no: 'WO20260618001', type: 'hazard', title: '2号楼楼道堆积杂物', location: '2号楼3单元', priority: 'urgent', status: 'pending', description: '楼道内堆积纸箱和旧家具，影响通行，存在火灾隐患', reporter: '王女士', phone: '13800138001', create_time: Date.now() - 3600000 * 2, handle_result: '' },
        { id: 2, order_no: 'WO20260618002', type: 'repair', title: '3号楼电梯按钮损坏', location: '3号楼1单元', priority: 'high', status: 'processing', description: '电梯3层按钮损坏，无法呼叫', reporter: '李先生', phone: '13800138002', create_time: Date.now() - 3600000 * 5, handle_result: '已联系电梯维修公司，预计2小时内到达' },
        { id: 3, order_no: 'WO20260618003', type: 'elevator', title: '5号楼电梯异响', location: '5号楼2单元', priority: 'urgent', status: 'pending', description: '电梯运行时有明显异响，居民反映强烈', reporter: '张阿姨', phone: '13800138003', create_time: Date.now() - 3600000 * 8, handle_result: '' },
        { id: 4, order_no: 'WO20260618004', type: 'hazard', title: '消防通道被占用', location: '1号楼南侧', priority: 'urgent', status: 'completed', description: '有车辆长期占用消防通道', reporter: '社区巡防', phone: '13800138004', create_time: Date.now() - 86400000 * 2, handle_result: '已通知车主移车，并设置警示标识，安排日常巡查' },
        { id: 5, order_no: 'WO20260618005', type: 'repair', title: '路灯不亮', location: '北区6栋前', priority: 'normal', status: 'pending', description: '北区6栋前路灯多日不亮，夜晚通行困难', reporter: '赵师傅', phone: '13800138005', create_time: Date.now() - 86400000, handle_result: '' },
        { id: 6, order_no: 'WO20260618006', type: 'consult', title: '中心花园长椅更换建议', location: '中心花园', priority: 'normal', status: 'completed', description: '建议在中心花园增加长椅，方便老人休息', reporter: '刘先生', phone: '13800138006', create_time: Date.now() - 86400000 * 3, handle_result: '已采纳建议，下周安排采购安装3张长椅' },
        { id: 7, order_no: 'WO20260618007', type: 'repair', title: '楼道灯损坏', location: '4号楼2单元3-4层', priority: 'high', status: 'processing', description: '楼道感应灯损坏，夜间漆黑', reporter: '孙女士', phone: '13800138007', create_time: Date.now() - 3600000 * 12, handle_result: '已安排物业电工维修' },
        { id: 8, order_no: 'WO20260618008', type: 'hazard', title: '地下车库消防栓漏水', location: '地下车库B区', priority: 'urgent', status: 'processing', description: '地下车库B区消防栓漏水，地面湿滑', reporter: '保安队', phone: '13800138008', create_time: Date.now() - 3600000 * 6, handle_result: '已联系消防维保单位，临时关闭阀门' },
        { id: 9, order_no: 'WO20260618009', type: 'elevator', title: '7号楼电梯年检', location: '7号楼1单元', priority: 'normal', status: 'completed', description: '7号楼电梯年检到期，需安排年检', reporter: '物业', phone: '13800138009', create_time: Date.now() - 86400000 * 4, handle_result: '已完成年检，合格通过' },
        { id: 10, order_no: 'WO20260618010', type: 'repair', title: '单元门门禁故障', location: '6号楼2单元', priority: 'high', status: 'pending', description: '单元门门禁刷卡无反应，无法正常开关门', reporter: '周先生', phone: '13800138010', create_time: Date.now() - 3600000 * 20, handle_result: '' },
        { id: 11, order_no: 'WO20260618011', type: 'hazard', title: '外墙瓷砖脱落', location: '8号楼外墙', priority: 'urgent', status: 'processing', description: '8号楼外墙有瓷砖脱落，危及行人安全', reporter: '吴女士', phone: '13800138011', create_time: Date.now() - 3600000 * 4, handle_result: '已在下方设置警示区，联系专业维修公司评估' },
        { id: 12, order_no: 'WO20260618012', type: 'repair', title: '排水管堵塞', location: '2号楼1单元', priority: 'normal', status: 'completed', description: '厨房排水管堵塞，反水严重', reporter: '郑先生', phone: '13800138012', create_time: Date.now() - 86400000, handle_result: '已疏通，恢复正常' },
        { id: 13, order_no: 'WO20260618013', type: 'consult', title: '社区活动中心使用咨询', location: '社区活动中心', priority: 'normal', status: 'completed', description: '咨询社区活动中心的开放时间和使用预约方式', reporter: '钱阿姨', phone: '13800138013', create_time: Date.now() - 86400000 * 5, handle_result: '已回复开放时间及预约流程' },
        { id: 14, order_no: 'WO20260618014', type: 'repair', title: '小区健身器材损坏', location: '中心花园健身区', priority: 'normal', status: 'pending', description: '部分健身器材螺丝松动、扶手损坏', reporter: '孙先生', phone: '13800138014', create_time: Date.now() - 3600000 * 30, handle_result: '' },
        { id: 15, order_no: 'WO20260618015', type: 'hazard', title: '电动车飞线充电', location: '3号楼南侧', priority: 'high', status: 'pending', description: '居民从高层私拉电线给电动车充电，存在安全隐患', reporter: '网格员', phone: '13800138015', create_time: Date.now() - 3600000 * 10, handle_result: '' }
    ],

    appeals: [
        { id: 1, appeal_no: 'AP20260618001', type: 'consult', title: '如何办理居住证？', content: '想咨询居住证办理流程和所需材料，本人为外地来此工作，租房居住。', user_name: '孙女士', phone: '13900139001', building: '3号楼1单元', status: 'pending', create_time: Date.now() - 3600000 * 3, handle_result: '' },
        { id: 2, appeal_no: 'AP20260618002', type: 'complaint', title: '楼下烧烤店油烟扰民', content: '楼下新开烧烤店，晚上油烟直接排到小区，气味难闻，窗户无法打开通风。', user_name: '周先生', phone: '13900139002', building: '6号楼2单元', status: 'processing', create_time: Date.now() - 3600000 * 10, handle_result: '已联系城管部门，约定明日上门检查，要求安装油烟净化设备' },
        { id: 3, appeal_no: 'AP20260618003', type: 'repair', title: '公共卫生间水管漏水', content: '社区活动中心公共卫生间水管持续漏水，地面湿滑，老人小孩容易滑倒。', user_name: '吴阿姨', phone: '13900139003', building: '社区活动中心', status: 'pending', create_time: Date.now() - 3600000, handle_result: '' },
        { id: 4, appeal_no: 'AP20260618004', type: 'consult', title: '儿童疫苗接种咨询', content: '想了解社区近期的疫苗接种安排和时间，孩子需要接种加强针。', user_name: '郑妈妈', phone: '13900139004', building: '4号楼3单元', status: 'completed', create_time: Date.now() - 86400000 * 2, handle_result: '已回复社区医院接种时间为每周二、四上午8:00-11:00，需携带儿童预防接种证' },
        { id: 5, appeal_no: 'AP20260618005', type: 'complaint', title: '夜间施工噪音扰民', content: '近日附近工地夜间施工，噪音严重，影响老人和孩子休息，多次投诉未果。', user_name: '钱先生', phone: '13900139005', building: '7号楼1单元', status: 'completed', create_time: Date.now() - 86400000 * 4, handle_result: '已与施工方沟通协调，夜间22:00后停止作业，已改善' },
        { id: 6, appeal_no: 'AP20260618006', type: 'neighbor', title: '邻里纠纷-宠物扰民', content: '邻居家狗经常在楼道大声叫，并且不牵绳，孩子害怕。多次沟通无果。', user_name: '冯女士', phone: '13900139006', building: '5号楼2单元', status: 'processing', create_time: Date.now() - 3600000 * 8, handle_result: '已安排网格员和物业上门调解，拟定文明养犬协议' },
        { id: 7, appeal_no: 'AP20260618007', type: 'policy', title: '老旧小区改造政策咨询', content: '咨询本小区是否纳入今年老旧小区改造计划，具体改造内容有哪些。', user_name: '陈先生', phone: '13900139007', building: '2号楼3单元', status: 'completed', create_time: Date.now() - 86400000 * 6, handle_result: '已答复：本小区已纳入改造计划，包括外立面翻新、管网改造、增设电梯等，预计下半年启动' },
        { id: 8, appeal_no: 'AP20260618008', type: 'repair', title: '小区大门道闸维修申请', content: '小区南门道闸反应迟钝，经常无法识别车牌，导致车辆排队拥堵。', user_name: '韩先生', phone: '13900139008', building: '业主代表', status: 'pending', create_time: Date.now() - 3600000 * 15, handle_result: '' },
        { id: 9, appeal_no: 'AP20260618009', type: 'consult', title: '居民社保办理咨询', content: '想了解居民社保的缴费标准、缴费方式以及如何查询缴费记录。', user_name: '唐阿姨', phone: '13900139009', building: '8号楼1单元', status: 'completed', create_time: Date.now() - 86400000 * 3, handle_result: '已详细解答，提供了社保APP二维码和社区服务中心预约方式' },
        { id: 10, appeal_no: 'AP20260618010', type: 'complaint', title: '垃圾分类投放问题', content: '部分居民不按规定时间和分类要求投放垃圾，导致垃圾桶周边脏乱。', user_name: '许先生', phone: '13900139010', building: '1号楼2单元', status: 'processing', create_time: Date.now() - 3600000 * 12, handle_result: '已安排志愿者值守引导，并计划增设宣传提示牌，加强巡查' }
    ],

    shares: [
        { id: 1, name: '电动螺丝刀套装', category: 'tools', owner_name: '李先生', owner_phone: '13800138001', location: '3号楼1单元', points_cost: 20, status: 'available', description: '博世电动螺丝刀一套，含多种批头，可借用于家具安装维修', create_time: Date.now() - 86400000 * 10, borrower_name: '', borrow_time: null, views: 128 },
        { id: 2, name: '儿童绘本（10本）', category: 'books', owner_name: '王妈妈', owner_phone: '13800138002', location: '5号楼2单元', points_cost: 10, status: 'borrowed', description: '适合3-6岁儿童阅读的绘本10本，含经典童话系列', create_time: Date.now() - 86400000 * 15, borrower_name: '赵小朋友家', borrow_time: Date.now() - 86400000 * 2, views: 256 },
        { id: 3, name: '折叠梯（2米）', category: 'tools', owner_name: '张师傅', owner_phone: '13800138003', location: '2号楼3单元', points_cost: 15, status: 'available', description: '2米折叠梯，换灯泡、清洁高处可用，承重120kg', create_time: Date.now() - 86400000 * 8, borrower_name: '', borrow_time: null, views: 95 },
        { id: 4, name: '家用烧烤炉', category: 'other', owner_name: '刘先生', owner_phone: '13800138004', location: '6号楼2单元', points_cost: 30, status: 'removed', description: '家用木炭烧烤炉一套（含烤盘、烤网、碳夹），适合5-8人使用', create_time: Date.now() - 3600000 * 5, borrower_name: '', borrow_time: null, views: 42, remove_reason: '物品描述与实物不符', removed_by: '管理员' },
        { id: 5, name: '电钻套装', category: 'tools', owner_name: '陈师傅', owner_phone: '13800138005', location: '1号楼1单元', points_cost: 25, status: 'available', description: '冲击电钻+各种钻头附件，墙面打孔可用', create_time: Date.now() - 86400000 * 12, borrower_name: '', borrow_time: null, views: 167 },
        { id: 6, name: '单反相机', category: 'other', owner_name: '周先生', owner_phone: '13800138006', location: '7号楼1单元', points_cost: 50, status: 'borrowed', description: '佳能入门单反相机，含18-55mm镜头，适合家庭活动拍照', create_time: Date.now() - 86400000 * 20, borrower_name: '吴先生', borrow_time: Date.now() - 86400000, views: 312 },
        { id: 7, name: '婴儿推车', category: 'baby', owner_name: '孙妈妈', owner_phone: '13800138007', location: '4号楼2单元', points_cost: 15, status: 'available', description: '好孩子牌婴儿推车，可折叠，9成新，适合0-3岁婴幼儿', create_time: Date.now() - 86400000 * 5, borrower_name: '', borrow_time: null, views: 89 },
        { id: 8, name: '野营帐篷（3-4人）', category: 'outdoor', owner_name: '钱先生', owner_phone: '13800138008', location: '8号楼3单元', points_cost: 35, status: 'available', description: '3-4人双层自动帐篷，防雨，适合家庭郊游使用', create_time: Date.now() - 86400000 * 18, borrower_name: '', borrow_time: null, views: 203 },
        { id: 9, name: '高压水枪', category: 'tools', owner_name: '吴师傅', owner_phone: '13800138009', location: '2号楼1单元', points_cost: 20, status: 'posting_ban', description: '家用高压水枪，清洗汽车、阳台地面非常方便', create_time: Date.now() - 86400000 * 7, borrower_name: '', borrow_time: null, views: 178, ban_reason: '收取费用与平台描述不符', ban_until: Date.now() + 86400000 * 14, banned_by: '管理员' },
        { id: 10, name: '烘焙工具套装', category: 'kitchen', owner_name: '郑女士', owner_phone: '13800138010', location: '5号楼3单元', points_cost: 25, status: 'available', description: '烤箱适用烘焙工具套装，含模具、量杯、裱花嘴等', create_time: Date.now() - 86400000 * 9, borrower_name: '', borrow_time: null, views: 145 },
        { id: 11, name: '儿童自行车（14寸）', category: 'baby', owner_name: '王先生', owner_phone: '13800138011', location: '3号楼2单元', points_cost: 20, status: 'pending', description: '14寸儿童自行车，辅助轮可拆，适合4-7岁儿童', create_time: Date.now() - 3600000 * 20, borrower_name: '', borrow_time: null, views: 67 },
        { id: 12, name: '便携式投影仪', category: 'other', owner_name: '李先生', owner_phone: '13800138012', location: '6号楼1单元', points_cost: 40, status: 'available', description: '便携式家用投影仪，支持1080P，适合家庭观影', create_time: Date.now() - 86400000 * 14, borrower_name: '', borrow_time: null, views: 289 },
        { id: 13, name: '园艺工具套装', category: 'tools', owner_name: '赵阿姨', owner_phone: '13800138013', location: '1号楼2单元', points_cost: 15, status: 'removed', description: '含铲子、耙子、修枝剪、手套等，适合阳台种菜养花', create_time: Date.now() - 86400000 * 11, borrower_name: '', borrow_time: null, views: 76, remove_reason: '被投诉物品违规收费', removed_by: '管理员' },
        { id: 14, name: '家庭急救包', category: 'other', owner_name: '社区医院', owner_phone: '13800138014', location: '社区活动中心', points_cost: 0, status: 'available', description: '家庭常备急救包，含创可贴、消毒液、纱布、体温计等', create_time: Date.now() - 86400000 * 25, borrower_name: '', borrow_time: null, views: 421 },
        { id: 15, name: '儿童益智玩具套装', category: 'baby', owner_name: '周妈妈', owner_phone: '13800138015', location: '4号楼3单元', points_cost: 15, status: 'borrowed', description: '含积木、拼图、益智卡片等多种儿童玩具，适合2-6岁', create_time: Date.now() - 86400000 * 6, borrower_name: '徐小朋友家', borrow_time: Date.now() - 86400000 * 3, views: 198 }
    ],

    notices: [
        { id: 1, title: '6月20日停水通知', category: 'water', content: '因市政管网维修，6月20日上午8:00-下午18:00小区将临时停水，请业主提前做好储水准备。给您带来的不便敬请谅解。', scope: '全社区', status: 'published', create_time: Date.now() - 3600000 * 24, views: 528 },
        { id: 2, title: '反诈宣传活动通知', category: 'event', content: '本周六（6月22日）上午9:00在社区活动中心举办反诈宣传讲座，邀请派出所民警现场讲解近期常见诈骗手法，欢迎居民积极参加，现场有礼品赠送。', scope: '全社区', status: 'published', create_time: Date.now() - 86400000 * 2, views: 289 },
        { id: 3, title: '社区老年免费体检活动', category: 'event', content: '7月1日-5日，社区医院为60岁以上老人提供免费体检服务，项目包括血压、血糖、心电图、B超等。请携带身份证前往社区医院体检科。开放时间：每天上午8:00-11:00。', scope: '全社区', status: 'published', create_time: Date.now() - 86400000 * 5, views: 642 },
        { id: 4, title: '夏季电梯保养安排通知', category: 'maintain', content: '本周开始对全小区电梯进行夏季保养，每栋楼约需2小时，具体时间见各楼栋通知。保养期间电梯暂停使用，请业主提前做好出行安排。', scope: '全社区', status: 'draft', create_time: Date.now() - 3600000 * 3, views: 0 },
        { id: 5, title: '垃圾分类宣传周活动', category: 'event', content: '6月24日-30日为社区垃圾分类宣传周，每天上午9:00-11:00在各垃圾投放点有志愿者值守指导，参与互动可获得积分奖励。', scope: '全社区', status: 'published', create_time: Date.now() - 86400000, views: 156 },
        { id: 6, title: '小区道路临时施工通知', category: 'maintain', content: '因小区路面修补工程需要，6月21日-23日每天8:00-17:00，小区东门至中心花园路段临时封闭施工，请绕行。', scope: '全社区', status: 'published', create_time: Date.now() - 3600000 * 8, views: 234 },
        { id: 7, title: '业主委员会换届选举公告', category: 'notice', content: '根据《物业管理条例》规定，本小区业主委员会任期届满，定于7月15日举行换届选举大会。候选人报名截止时间为6月30日，请有意者到社区工作站报名。', scope: '全社区', status: 'published', create_time: Date.now() - 86400000 * 4, views: 445 },
        { id: 8, title: '社区暑期兴趣班招生通知', category: 'event', content: '社区活动中心暑期兴趣班开始招生！设书法班、绘画班、舞蹈班、围棋班，适合6-12岁儿童。费用由社区补贴部分，名额有限，先到先得。咨询电话：社区活动中心。', scope: '全社区', status: 'draft', create_time: Date.now() - 3600000 * 2, views: 0 },
        { id: 9, title: '紧急停电通知（6月25日）', category: 'power', content: '因电力设备检修，6月25日上午9:00-12:00小区将临时停电。停电期间电梯、水泵暂停运行，请业主提前做好准备。', scope: '全社区', status: 'published', create_time: Date.now() - 3600000 * 12, views: 378 },
        { id: 10, title: '关于加强电动车管理的通知', category: 'notice', content: '近期发现部分业主违规停放电动车、私拉电线充电行为，存在严重安全隐患。现通知如下：1. 电动车统一停放在地下车库充电区；2. 严禁私拉电线飞线充电；3. 违规者将按规定处理。', scope: '全社区', status: 'published', create_time: Date.now() - 86400000 * 3, views: 567 }
    ],

    complaints: [
        { id: 1, complaint_no: 'TS20250618001', type: 'item', target_item_id: 4, target_item_name: '家用烧烤炉', target_user_name: '刘先生', target_user_phone: '13800138004', reason: '虚假描述', reason_detail: '借用后发现烧烤炉损坏严重，有大量铁锈无法使用，但描述为"九成新"。', reporter_name: '王女士', reporter_phone: '13900139001', status: 'pending', priority: 'high', create_time: Date.now() - 3600000 * 2, handle_time: null, handle_result: '', punishment: null },
        { id: 2, complaint_no: 'TS20250618002', type: 'user', target_user_id: 7, target_user_name: '吴伟', reason: '不文明沟通', reason_detail: '因借用问题发生纠纷，对方多次使用不文明用语，态度非常恶劣，沟通无效。', reporter_name: '周先生', reporter_phone: '13900139002', status: 'resolved', priority: 'urgent', create_time: Date.now() - 3600000 * 8, handle_time: Date.now() - 3600000 * 4, handle_result: '已对违规用户作出永久封号处理，并告知投诉人。', punishment: { type: 'permanent_ban', reason: '多次使用不文明用语' } },
        { id: 3, complaint_no: 'TS20250618003', type: 'item', target_item_id: 13, target_item_name: '园艺工具套装', target_user_name: '赵阿姨', reason: '违规收费', reason_detail: '借用时对方表示免费，归还时却要求支付50元费用，与平台标注"免费共享"严重不符。', reporter_name: '陈先生', reporter_phone: '13900139003', status: 'resolved', priority: 'high', create_time: Date.now() - 86400000, handle_time: Date.now() - 3600000 * 2, handle_result: '已下架物品并对该用户限制发布14天。', punishment: { type: 'remove_item', post_ban_days: 14, reason: '违规收取费用' } },
        { id: 4, complaint_no: 'TS20250618004', type: 'user', target_user_id: 5, target_user_name: '刘强', reason: '失信行为', reason_detail: '约定归还物品时间已超过3天，多次联系不回复，物品也未归还。', reporter_name: '钱先生', reporter_phone: '13900139004', status: 'processing', priority: 'high', create_time: Date.now() - 86400000 * 2, handle_time: Date.now() - 86400000, handle_result: '正在联系双方协调。', punishment: null },
        { id: 5, complaint_no: 'TS20250618005', type: 'item', target_item_id: 9, target_item_name: '高压水枪', target_user_name: '吴师傅', reason: '卫生问题', reason_detail: '水枪很脏并且有霉味，不像是描述中的可用状态。', reporter_name: '孙女士', reporter_phone: '13900139005', status: 'pending', priority: 'medium', create_time: Date.now() - 86400000 * 3, handle_time: null, handle_result: '', punishment: null },
        { id: 6, complaint_no: 'TS20250618006', type: 'item', target_item_id: 12, target_item_name: '便携式投影仪', target_user_name: '李先生', reason: '虚假描述', reason_detail: '分辨率仅支持720P，但描述中标注1080P，清晰度远不及预期。', reporter_name: '郑女士', reporter_phone: '13900139006', status: 'pending', priority: 'medium', create_time: Date.now() - 86400000 * 4, handle_time: null, handle_result: '', punishment: null },
        { id: 7, complaint_no: 'TS20250618007', type: 'user', target_user_id: 10, target_user_name: '钱进', reason: '失信行为', reason_detail: '借用后不按时归还，并且以各种借口拖延时间。', reporter_name: '林女士', reporter_phone: '13900139007', status: 'pending', priority: 'medium', create_time: Date.now() - 86400000 * 5, handle_time: null, handle_result: '', punishment: null }
    ],

    elderly: [
        { id: 1, name: '王桂芳', age: 78, gender: '女', building: '2号楼3单元502', phone: '13700137001', emergency_contact: '儿子 李建国 13700137011', device_status: 'online', last_activity: Date.now() - 3600000 * 2, alert_level: 'normal', health_note: '高血压，日常服药，身体状况良好' },
        { id: 2, name: '李国强', age: 82, gender: '男', building: '3号楼1单元301', phone: '13700137002', emergency_contact: '女儿 李梅 13700137012', device_status: 'offline', last_activity: Date.now() - 86400000 * 2, alert_level: 'danger', health_note: '心脏病史，装置离线超过48小时，需立即上门查看' },
        { id: 3, name: '张秀珍', age: 75, gender: '女', building: '5号楼2单元202', phone: '13700137003', emergency_contact: '孙女 张小雅 13700137013', device_status: 'online', last_activity: Date.now() - 3600000 * 6, alert_level: 'warning', health_note: '糖尿病，近期活动量偏少，建议关注' },
        { id: 4, name: '刘德发', age: 79, gender: '男', building: '1号楼1单元601', phone: '13700137004', emergency_contact: '侄子 刘军 13700137014', device_status: 'online', last_activity: Date.now() - 3600000, alert_level: 'normal', health_note: '腿脚不便，使用助行器，日常活动正常' },
        { id: 5, name: '陈秀英', age: 85, gender: '女', building: '7号楼2单元102', phone: '13700137005', emergency_contact: '孙子 陈伟 13700137015', device_status: 'offline', last_activity: Date.now() - 86400000 * 3, alert_level: 'danger', health_note: '阿尔茨海默症早期，装置已3天无数据，需紧急处理' },
        { id: 6, name: '赵永顺', age: 73, gender: '男', building: '4号楼3单元301', phone: '13700137006', emergency_contact: '女儿 赵丽 13700137016', device_status: 'online', last_activity: Date.now() - 3600000 * 4, alert_level: 'normal', health_note: '身体健康，独居，子女每周探望' },
        { id: 7, name: '孙玉梅', age: 77, gender: '女', building: '6号楼1单元402', phone: '13700137007', emergency_contact: '儿子 孙明 13700137017', device_status: 'online', last_activity: Date.now() - 3600000 * 8, alert_level: 'warning', health_note: '骨质疏松，近两日活动异常，建议电话问候' },
        { id: 8, name: '周文斌', age: 81, gender: '男', building: '8号楼2单元201', phone: '13700137008', emergency_contact: '女儿 周静 13700137018', device_status: 'online', last_activity: Date.now() - 3600000, alert_level: 'normal', health_note: '高血压、轻度关节炎，日常规律服药，状态稳定' }
    ],

    users: [
        { id: 1, name: '王晓明', phone: '13800138001', building: '2号楼3单元501', role: 'resident', status: 'active', points: 280, create_time: Date.now() - 86400000 * 60 },
        { id: 2, name: '李丽', phone: '13800138002', building: '5号楼1单元202', role: 'resident', status: 'active', points: 150, create_time: Date.now() - 86400000 * 45 },
        { id: 3, name: '张磊', phone: '13800138001', role: 'grid', status: 'active', points: 520, create_time: Date.now() - 86400000 * 120 },
        { id: 4, name: '陈芳', phone: '13800138004', building: '社区工作站', role: 'admin', status: 'active', points: 0, create_time: Date.now() - 86400000 * 200 },
        { id: 5, name: '刘强', phone: '13800138005', building: '1号楼2单元301', role: 'resident', status: 'banned', points: 180, create_time: Date.now() - 86400000 * 30, ban_reason: '多次发布虚假物品描述', banned_until: Date.now() + 86400000 * 3, banned_by: '管理员' },
        { id: 6, name: '周敏', phone: '13800138006', building: '6号楼2单元402', role: 'resident', status: 'active', points: 95, create_time: Date.now() - 86400000 * 25 },
        { id: 7, name: '吴伟', phone: '13800138007', building: '4号楼1单元501', role: 'resident', status: 'permanent_ban', points: 220, create_time: Date.now() - 86400000 * 55, ban_reason: '使用不文明用语严重违反社区规定', banned_by: '管理员' },
        { id: 8, name: '郑华', phone: '13800138008', building: '7号楼3单元202', role: 'grid', status: 'active', points: 460, create_time: Date.now() - 86400000 * 90 },
        { id: 9, name: '孙娟', phone: '13800138009', building: '8号楼1单元301', role: 'resident', status: 'inactive', points: 60, create_time: Date.now() - 86400000 * 15 },
        { id: 10, name: '钱进', phone: '13800138010', building: '2号楼1单元201', role: 'resident', status: 'active', points: 135, create_time: Date.now() - 86400000 * 40 },
        { id: 11, name: '马超', phone: '13800138011', building: '3号楼3单元602', role: 'resident', status: 'active', points: 175, create_time: Date.now() - 86400000 * 35 },
        { id: 12, name: '朱琳', phone: '13800138012', building: '5号楼2单元101', role: 'resident', status: 'active', points: 310, create_time: Date.now() - 86400000 * 70 },
        { id: 13, name: '胡军', phone: '13800138013', building: '6号楼1单元202', role: 'resident', status: 'inactive', points: 50, create_time: Date.now() - 86400000 * 10 },
        { id: 14, name: '林芳', phone: '13800138014', building: '4号楼2单元401', role: 'resident', status: 'active', points: 198, create_time: Date.now() - 86400000 * 50 },
        { id: 15, name: '何强', phone: '13800138015', building: '1号楼1单元101', role: 'resident', status: 'active', points: 245, create_time: Date.now() - 86400000 * 80 }
    ],

    pendingUsers: [
        { id: 201, name: '周建军', phone: '13900139101', building: '4号楼1单元301', role: 'resident', status: 'pending', id_card: '110101198001011234', create_time: Date.now() - 3600000 * 5 },
        { id: 202, name: '吴静', phone: '13900139102', building: '6号楼2单元502', role: 'resident', status: 'pending', id_card: '110101199003034567', create_time: Date.now() - 86400000 },
        { id: 203, name: '孙涛', phone: '13900139103', building: '7号楼3单元201', role: 'grid', status: 'pending', id_card: '110101198505057890', create_time: Date.now() - 3600000 * 8 },
        { id: 204, name: '徐慧', phone: '13900139104', building: '2号楼2单元402', role: 'resident', status: 'pending', id_card: '110101199207072345', create_time: Date.now() - 3600000 * 2 },
        { id: 205, name: '高峰', phone: '13900139105', building: '8号楼1单元102', role: 'resident', status: 'pending', id_card: '110101197809098765', create_time: Date.now() - 3600000 * 12 }
    ],

    cameras: [
        { id: 'CAM001', name: '1号楼1单元楼道摄像头', location: '1号楼1单元 2-3层楼道', status: 'online', types: ['杂物','电动车','儿童'], icon: '🏢' },
        { id: 'CAM002', name: '2号楼电梯轿厢', location: '2号楼电梯内部', status: 'alert', types: ['电动车','人员'], icon: '🛗', lastDetect: '检测到电动车' },
        { id: 'CAM003', name: '3号楼2单元楼道', location: '3号楼2单元 1-4层', status: 'online', types: ['杂物','消防通道'], icon: '🏢' },
        { id: 'CAM004', name: '4号楼1单元楼道摄像头', location: '4号楼1单元', status: 'online', types: ['杂物','电动车'], icon: '🏢' },
        { id: 'CAM005', name: '地下车库入口', location: 'B区 地下车库 东入口', status: 'online', types: ['车辆','消防通道'], icon: '🚗' },
        { id: 'CAM006', name: '社区东门门禁', location: '社区东门出入口', status: 'online', types: ['人员','可疑人员'], icon: '🚪' },
        { id: 'CAM007', name: '中心花园广场', location: '中心花园 活动区域', status: 'online', types: ['儿童','老人'], icon: '🌳' },
        { id: 'CAM008', name: '消防通道监控-北', location: '北侧消防通道路口', status: 'alert', types: ['消防通道','占用'], icon: '🚧', lastDetect: '车辆占用通道' },
        { id: 'CAM009', name: '5号楼电梯井入口', location: '5号楼1层 电梯井附近', status: 'alert', types: ['儿童','安全'], icon: '⚠️', lastDetect: '儿童靠近危险区域' },
        { id: 'CAM010', name: '6号楼2单元楼道', location: '6号楼2单元', status: 'online', types: ['杂物','电动车'], icon: '🏢' },
        { id: 'CAM011', name: '7号楼1层电梯厅', location: '7号楼1层电梯厅', status: 'online', types: ['电动车'], icon: '🛗' },
        { id: 'CAM012', name: '8号楼3单元楼道', location: '8号楼3单元', status: 'offline', types: ['杂物','电动车'], icon: '🏢' }
    ],

    detectionEvents: [
        { id: 1, time: Date.now() - 3600000 * 0.3, type: 'child', camera: 'CAM009', location: '5号楼 电梯井入口区域', confidence: 0.94, status: 'active', description: '检测到一名儿童（约5-7岁）在电梯井入口附近独自停留超过2分钟，无成人陪同，系统自动告警。', orderId: true },
        { id: 2, time: Date.now() - 3600000 * 1.2, type: 'clutter', camera: 'CAM001', location: '1号楼1单元 2层楼道转角', confidence: 0.88, status: 'acknowledged', description: '检测到楼道内堆放纸箱、旧家具等杂物，占用消防疏散通道约1.2平方米，触发告警。', orderId: true },
        { id: 3, time: Date.now() - 3600000 * 2.0, type: 'ev_lift', camera: 'CAM002', location: '2号楼电梯轿厢', confidence: 0.97, status: 'active', description: '检测到居民将电动自行车推入电梯轿厢内，触发电梯禁入电动车识别告警。', orderId: true },
        { id: 4, time: Date.now() - 3600000 * 3.5, type: 'ev_bike', camera: 'CAM003', location: '3号楼2单元 1层楼道', confidence: 0.92, status: 'acknowledged', description: '检测到电动自行车停放在楼栋内充电，电池充电线从高处垂下，存在严重消防安全隐患。', orderId: true },
        { id: 5, time: Date.now() - 3600000 * 4.0, type: 'clutter', camera: 'CAM010', location: '6号楼2单元 3层楼道', confidence: 0.85, status: 'resolved', description: '检测到楼道内堆放自行车、纸箱等杂物，影响通行。网格员已上门核实并要求清理。', orderId: true },
        { id: 6, time: Date.now() - 3600000 * 5.8, type: 'intruder', camera: 'CAM006', location: '社区东门 外围区域', confidence: 0.80, status: 'resolved', description: '检测到陌生人员在东门出入口附近徘徊超过10分钟，行为疑似踩点。保安已前往查看，确认为快递员。', orderId: false },
        { id: 7, time: Date.now() - 3600000 * 6.5, type: 'ev_bike', camera: 'CAM004', location: '4号楼1单元 楼道', confidence: 0.91, status: 'resolved', description: '检测到电动自行车停放在楼道内充电，已通知居民移至地下车库充电区。', orderId: true },
        { id: 8, time: Date.now() - 3600000 * 8.0, type: 'clutter', camera: 'CAM003', location: '3号楼2单元 4层楼道', confidence: 0.87, status: 'resolved', description: '检测到楼道内堆放大量旧报纸、废纸箱，火灾风险极高，已通知居民立即清理。', orderId: true },
        { id: 9, time: Date.now() - 3600000 * 9.5, type: 'intruder', camera: 'CAM007', location: '中心花园 北侧步道', confidence: 0.78, status: 'resolved', description: '夜间检测到可疑人员在花园附近徘徊，巡逻保安已查看，确认为住户散步。', orderId: false },
        { id: 10, time: Date.now() - 3600000 * 10.0, type: 'child', camera: 'CAM007', location: '中心花园 水池边', confidence: 0.93, status: 'resolved', description: '检测到一名幼儿（约3岁）独自靠近景观水池，无成人视线范围内，自动触发告警。附近保安已前往看护并找到家长。', orderId: true },
        { id: 11, time: Date.now() - 3600000 * 12.0, type: 'ev_lift', camera: 'CAM011', location: '7号楼1层电梯厅', confidence: 0.95, status: 'resolved', description: '检测到电动自行车进入电梯，系统自动触发告警并启动电梯安全控制模块。', orderId: true },
        { id: 12, time: Date.now() - 3600000 * 14.0, type: 'clutter', camera: 'CAM001', location: '1号楼1单元 3层楼道', confidence: 0.89, status: 'resolved', description: '检测到楼道内堆放旧家具、鞋柜等物品占用超过1平方米疏散通道。', orderId: true },
        { id: 13, time: Date.now() - 3600000 * 18.0, type: 'ev_bike', camera: 'CAM011', location: '7号楼1单元 楼道', confidence: 0.90, status: 'resolved', description: '检测到电动自行车在楼道内充电超过6小时，电池发热风险较高。', orderId: true },
        { id: 14, time: Date.now() - 3600000 * 22.0, type: 'clutter', camera: 'CAM003', location: '3号楼2单元 2层楼道', confidence: 0.86, status: 'resolved', description: '检测到大量杂物堆积在楼道转角，严重影响应急疏散。', orderId: true }
    ]
};

/* ============== 通用请求包装 ============== */
function apiRequest(path, options = {}) {
    return new Promise((resolve) => {
        const token = localStorage.getItem('admin_token') || '';
        fetch(API_BASE + path, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? 'Bearer ' + token : '',
                ...(options.headers || {})
            }
        }).then(res => res.json()).then(data => {
            if (data && (data.code === 200 || data.code === 0 || data.success !== false)) {
                resolve(data.data !== undefined ? data.data : data);
            } else {
                console.warn('API返回非成功状态，降级使用mock数据:', data);
                resolve(handleMockRoute(path, options && options.method, options && options.body));
            }
        }).catch(err => {
            console.warn('API请求失败，降级使用mock数据:', err.message);
            resolve(handleMockRoute(path, options && options.method, options && options.body));
        });
    });
}

/* ============== Mock 路由处理 ============== */
function handleMockRoute(path, method, body) {
    method = (method || 'GET').toUpperCase();
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    body = body || {};

    // 登录
    if (path === '/auth/login' || path === '/admin/login') {
        const isAdmin = (body.phone === '13800138000' && body.password === 'admin123');
        const isGrid = (body.phone === '13800138001' && body.password === 'grid123');
        if (isAdmin || isGrid) {
            return {
                token: 'token-' + Date.now(),
                user: {
                    id: isAdmin ? 1 : 2,
                    name: isAdmin ? '系统管理员' : '网格员王',
                    role: isAdmin ? 'admin' : 'grid',
                    phone: body.phone
                }
            };
        }
        // 其他也允许演示登录
        return { token: 'demo-' + Date.now(), user: { id: 99, name: '演示用户', role: body.role || 'admin', phone: body.phone } };
    }

    if (path === '/auth/logout' || path === '/admin/logout') return { success: true };

    // 工单
    if (path.startsWith('/workorders')) {
        if (path === '/workorders/stats') {
            const list = MOCK_DATA.workOrders;
            return {
                total: list.length,
                pending: list.filter(o => o.status === 'pending').length,
                processing: list.filter(o => o.status === 'processing').length,
                completed: list.filter(o => o.status === 'completed').length,
                urgent: list.filter(o => o.priority === 'urgent').length
            };
        }
        const parts = path.split('/');
        const id = parts[2] && !isNaN(parts[2]) ? parseInt(parts[2]) : null;
        if (id) {
            const wo = MOCK_DATA.workOrders.find(x => x.id === id);
            if (path.includes('/assign') && wo) { wo.status = 'processing'; return { success: true }; }
            if (path.includes('/process') && wo) { wo.status = 'processing'; wo.handle_result = body.result || ''; return { success: true }; }
            if (path.includes('/complete') && wo) { wo.status = 'completed'; wo.handle_result = body.result || wo.handle_result || '已处理完成'; return { success: true }; }
            if (method === 'DELETE') {
                const idx = MOCK_DATA.workOrders.findIndex(x => x.id === id);
                if (idx >= 0) MOCK_DATA.workOrders.splice(idx, 1);
                return { success: true };
            }
            return wo;
        }
        if (method === 'POST') {
            const newId = Math.max(...MOCK_DATA.workOrders.map(x => x.id)) + 1;
            const newWo = { id: newId, order_no: 'WO' + Date.now(), ...body, status: body.status || 'pending', create_time: Date.now(), handle_result: '' };
            MOCK_DATA.workOrders.unshift(newWo);
            return newWo;
        }
        let list = MOCK_DATA.workOrders.slice();
        if (body.status && body.status !== 'all') list = list.filter(o => o.status === body.status);
        if (body.keyword) {
            const kw = String(body.keyword).toLowerCase();
            list = list.filter(o => [o.order_no, o.title, o.description, o.location, o.reporter].filter(Boolean).join(' ').toLowerCase().includes(kw));
        }
        return { list, total: list.length };
    }

    // 诉求
    if (path.startsWith('/appeals')) {
        if (path === '/appeals/stats') {
            const list = MOCK_DATA.appeals;
            return {
                total: list.length,
                pending: list.filter(a => a.status === 'pending').length,
                processing: list.filter(a => a.status === 'processing').length,
                completed: list.filter(a => a.status === 'completed').length
            };
        }
        const parts = path.split('/');
        const id = parts[2] && !isNaN(parts[2]) ? parseInt(parts[2]) : null;
        if (id) {
            const ap = MOCK_DATA.appeals.find(x => x.id === id);
            if (path.includes('/reply') && ap) { ap.status = 'processing'; ap.handle_result = body.content || ''; return { success: true }; }
            if (path.includes('/close') && ap) { ap.status = 'completed'; ap.handle_result = body.result || ap.handle_result || '已处理完成'; return { success: true }; }
            if (method === 'DELETE') {
                const idx = MOCK_DATA.appeals.findIndex(x => x.id === id);
                if (idx >= 0) MOCK_DATA.appeals.splice(idx, 1);
                return { success: true };
            }
            return ap;
        }
        let list = MOCK_DATA.appeals.slice();
        if (body.status && body.status !== 'all') list = list.filter(a => a.status === body.status);
        if (body.keyword) {
            const kw = String(body.keyword).toLowerCase();
            list = list.filter(a => [a.appeal_no, a.title, a.content, a.building, a.user_name].filter(Boolean).join(' ').toLowerCase().includes(kw));
        }
        return { list, total: list.length };
    }

    // 共享物品
    if (path.startsWith('/shares')) {
        if (path === '/shares/stats') {
            const list = MOCK_DATA.shares;
            return {
                total: list.length,
                available: list.filter(s => s.status === 'available').length,
                borrowed: list.filter(s => s.status === 'borrowed').length,
                removed: list.filter(s => s.status === 'removed').length,
                posting_banned: list.filter(s => s.status === 'posting_ban').length,
                popular: list.slice().sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 3).map(s => s.name)
            };
        }
        const parts = path.split('/');
        const id = parts[2] && !isNaN(parts[2]) ? parseInt(parts[2]) : null;
        if (id) {
            const it = MOCK_DATA.shares.find(x => x.id === id);
            if (path.includes('/remove') && it) {
                it.status = 'removed';
                it.remove_reason = body.reason || '违规物品';
                it.removed_by = body.operator || '管理员';
                return { success: true, message: '物品已下架' };
            }
            if (path.includes('/restore') && it) {
                it.status = body.prevStatus || 'available';
                delete it.remove_reason;
                delete it.removed_by;
                return { success: true, message: '物品已恢复' };
            }
            if (path.includes('/ban-post') && it) {
                it.status = 'posting_ban';
                it.ban_reason = body.reason || '违规发布';
                it.ban_until = body.ban_until ? (Date.now() + body.ban_until * 86400000) : null;
                it.banned_by = body.operator || '管理员';
                return { success: true, message: '已禁止该物品发布' };
            }
            if (method === 'DELETE') {
                const idx = MOCK_DATA.shares.findIndex(x => x.id === id);
                if (idx >= 0) MOCK_DATA.shares.splice(idx, 1);
                return { success: true };
            }
            return it;
        }
        let list = MOCK_DATA.shares.slice();
        if (body.status && body.status !== 'all') list = list.filter(s => s.status === body.status);
        if (body.keyword) {
            const kw = String(body.keyword).toLowerCase();
            list = list.filter(s => [s.name, s.category, s.description, s.owner_name, s.location].filter(Boolean).join(' ').toLowerCase().includes(kw));
        }
        return { list, total: list.length };
    }

    // 通知
    if (path.startsWith('/notices')) {
        if (path === '/notices/stats') {
            const list = MOCK_DATA.notices;
            return {
                total: list.length,
                published: list.filter(n => n.status === 'published').length,
                views: list.reduce((sum, n) => sum + (n.views || 0), 0)
            };
        }
        const parts = path.split('/');
        const id = parts[2] && !isNaN(parts[2]) ? parseInt(parts[2]) : null;
        if (id) {
            const nc = MOCK_DATA.notices.find(x => x.id === id);
            if (method === 'DELETE') {
                const idx = MOCK_DATA.notices.findIndex(x => x.id === id);
                if (idx >= 0) MOCK_DATA.notices.splice(idx, 1);
                return { success: true };
            }
            return nc;
        }
        if (method === 'POST') {
            const newId = Math.max(...MOCK_DATA.notices.map(x => x.id)) + 1;
            const nc = { id: newId, ...body, category: body.category || 'notice', status: body.status || 'published', create_time: Date.now(), views: 0 };
            MOCK_DATA.notices.unshift(nc);
            return { success: true };
        }
        let list = MOCK_DATA.notices.slice();
        if (body.keyword) {
            const kw = String(body.keyword).toLowerCase();
            list = list.filter(n => [n.title, n.content, n.scope, n.category].filter(Boolean).join(' ').toLowerCase().includes(kw));
        }
        return { list, total: list.length };
    }

    // 老人
    if (path.startsWith('/elderly')) {
        if (path === '/elderly/stats') {
            const list = MOCK_DATA.elderly;
            return {
                total: list.length,
                normal: list.filter(e => e.alert_level === 'normal').length,
                warning: list.filter(e => e.alert_level === 'warning').length,
                danger: list.filter(e => e.alert_level === 'danger').length
            };
        }
        const parts = path.split('/');
        const id = parts[2] && !isNaN(parts[2]) ? parseInt(parts[2]) : null;
        if (id) {
            const el = MOCK_DATA.elderly.find(x => x.id === id);
            if (path.includes('/dismiss') || path.includes('/alert/clear')) {
                if (el) { el.alert_level = 'normal'; el.last_activity = Date.now(); }
                return { success: true };
            }
            if (method === 'PUT' || method === 'POST') {
                if (el) Object.assign(el, body);
                return { success: true };
            }
            return el;
        }
        return { list: MOCK_DATA.elderly.slice(), total: MOCK_DATA.elderly.length };
    }

    // 用户
    if (path.startsWith('/users') || path.startsWith('/admin/users')) {
        if (path.includes('/pending')) {
            return { list: MOCK_DATA.pendingUsers.slice(), total: MOCK_DATA.pendingUsers.length };
        }
        if (path === '/users/stats' || path === '/admin/users/stats') {
            const list = MOCK_DATA.users;
            const roleCount = {};
            list.forEach(u => { roleCount[u.role] = (roleCount[u.role] || 0) + 1; });
            return {
                total: list.length + MOCK_DATA.pendingUsers.length,
                active: list.filter(u => u.status === 'active').length,
                banned: list.filter(u => u.status === 'banned').length,
                permanent_banned: list.filter(u => u.status === 'permanent_ban').length,
                pending: MOCK_DATA.pendingUsers.length,
                roles: roleCount
            };
        }
        const parts = path.split('/');
        const id = parts[parts.length - 1] && !isNaN(parts[parts.length - 1]) ? parseInt(parts[parts.length - 1]) : null;
        if (id) {
            if (path.includes('/review')) {
                let idx = MOCK_DATA.pendingUsers.findIndex(x => x.id === id);
                if (idx >= 0) {
                    const u = MOCK_DATA.pendingUsers[idx];
                    MOCK_DATA.pendingUsers.splice(idx, 1);
                    if (body.approved) { u.status = 'active'; u.points = 100; MOCK_DATA.users.push(u); }
                    return { success: true };
                }
                return { success: true };
            }
            const u = MOCK_DATA.users.find(x => x.id === id) || MOCK_DATA.pendingUsers.find(x => x.id === id);
            if (path.includes('/ban') && u) {
                const days = body.ban_days;
                if (days === 'permanent' || days === -1 || body.permanent) {
                    u.status = 'permanent_ban';
                    u.ban_reason = body.reason || '严重违反社区规定';
                    u.banned_by = body.operator || '管理员';
                    delete u.banned_until;
                } else {
                    u.status = 'banned';
                    u.ban_reason = body.reason || '违反社区规定';
                    u.banned_until = Date.now() + (days || 7) * 86400000;
                    u.banned_by = body.operator || '管理员';
                }
                u.ban_time = Date.now();
                return { success: true, message: body.permanent || days === -1 ? '已永久封号' : ('已封号' + days + '天') };
            }
            if (path.includes('/unban') && u) {
                u.status = 'active';
                delete u.ban_reason; delete u.banned_until; delete u.banned_by; delete u.ban_time;
                return { success: true, message: '已解除封号' };
            }
            if (path.includes('/ban-post') && u) {
                u.post_banned = true;
                u.post_ban_reason = body.reason || '违规发布';
                u.post_banned_until = Date.now() + (body.ban_days || 14) * 86400000;
                return { success: true, message: '已限制发布' };
            }
            if (method === 'DELETE') {
                let idx = MOCK_DATA.users.findIndex(x => x.id === id);
                if (idx >= 0) { MOCK_DATA.users.splice(idx, 1); return { success: true }; }
                idx = MOCK_DATA.pendingUsers.findIndex(x => x.id === id);
                if (idx >= 0) MOCK_DATA.pendingUsers.splice(idx, 1);
                return { success: true };
            }
            return u;
        }
        let list = MOCK_DATA.users.slice();
        if (body.status && body.status !== 'all') list = list.filter(u => u.status === body.status);
        if (body.keyword) {
            const kw = String(body.keyword).toLowerCase();
            list = list.filter(u => [u.name, u.phone, u.building].filter(Boolean).join(' ').toLowerCase().includes(kw));
        }
        return { list, total: list.length };
    }

    // AI隐患检测
    if (path.startsWith('/detection')) {
        if (path === '/detection/stats' || path === '/admin/detection/stats') {
            const evts = MOCK_DATA.detectionEvents;
            const activeCount = evts.filter(e => e.status === 'active').length;
            const ackCount = evts.filter(e => e.status === 'acknowledged').length;
            const totalCount = evts.length;
            const resolvedCount = evts.filter(e => e.status === 'resolved').length;
            const highRisk = evts.filter(e => (e.type === 'child' || e.type === 'ev_lift' || e.type === 'fire') && e.status !== 'resolved').length;
            return {
                totalCameras: MOCK_DATA.cameras.length,
                onlineCameras: MOCK_DATA.cameras.filter(c => c.status !== 'offline').length,
                alertCameras: MOCK_DATA.cameras.filter(c => c.status === 'alert').length,
                todayAlerts: totalCount,
                active: activeCount,
                acknowledged: ackCount,
                resolved: resolvedCount,
                highRisk: highRisk,
                rate: Math.round((resolvedCount / totalCount) * 100) + '%',
                compare: '+3',
                breakdown: [
                    { label: '楼道杂物堆积', count: evts.filter(e => e.type === 'clutter').length, color: '#E8A838', icon: '📦' },
                    { label: '楼道内电动车', count: evts.filter(e => e.type === 'ev_bike').length, color: '#D9534F', icon: '🛵' },
                    { label: '电梯内电动车', count: evts.filter(e => e.type === 'ev_lift').length, color: '#D9534F', icon: '🎢' },
                    { label: '儿童靠近电梯井', count: evts.filter(e => e.type === 'child').length, color: '#D9534F', icon: '👶' },
                    { label: '可疑人员徘徊', count: evts.filter(e => e.type === 'intruder').length, color: '#E8A838', icon: '👀' },
                    { label: '消防通道占用', count: 1, color: '#D9534F', icon: '🚧' }
                ]
            };
        }
        if (path === '/detection/cameras' || path === '/admin/detection/cameras') {
            return { list: MOCK_DATA.cameras, total: MOCK_DATA.cameras.length };
        }
        if (path === '/detection/events' || path === '/admin/detection/events') {
            let list = MOCK_DATA.detectionEvents.slice();
            if (body.status && body.status !== 'all') list = list.filter(e => e.status === body.status);
            if (body.type && body.type !== 'all') list = list.filter(e => e.type === body.type);
            return { list, total: list.length };
        }
        const parts = path.split('/');
        const id = parts[2] && !isNaN(parts[2]) ? parseInt(parts[2]) : null;
        if (id) {
            const ev = MOCK_DATA.detectionEvents.find(x => x.id === id);
            if (path.includes('/resolve') && ev) { ev.status = 'resolved'; return { success: true }; }
            if (path.includes('/acknowledge') && ev) { ev.status = 'acknowledged'; return { success: true }; }
            return ev;
        }
        return { list: MOCK_DATA.detectionEvents, total: MOCK_DATA.detectionEvents.length };
    }

    // 工作台总览
    if (path === '/dashboard/overview' || path === '/admin/dashboard/overview') {
        return {
            residentTotal: MOCK_DATA.users.filter(u => u.role === 'resident').length + MOCK_DATA.pendingUsers.length,
            workOrderTotal: MOCK_DATA.workOrders.length,
            appealTotal: MOCK_DATA.appeals.length,
            shareTotal: MOCK_DATA.shares.length,
            noticeTotal: MOCK_DATA.notices.length,
            elderlyTotal: MOCK_DATA.elderly.length,
            pendingWorkOrder: MOCK_DATA.workOrders.filter(o => o.status === 'pending').length,
            pendingAppeal: MOCK_DATA.appeals.filter(a => a.status === 'pending').length,
            elderlyAlert: MOCK_DATA.elderly.filter(e => e.alert_level !== 'normal').length,
            todayActive: MOCK_DATA.users.length
        };
    }

    if (path === '/dashboard/workorder-trend' || path === '/admin/dashboard/workorder-trend') {
        return {
            labels: ['6-12', '6-13', '6-14', '6-15', '6-16', '6-17', '6-18'],
            counts: [8, 12, 6, 15, 10, 13, MOCK_DATA.workOrders.length]
        };
    }

    if (path === '/dashboard/appeal-by-type' || path === '/admin/dashboard/appeal-by-type') {
        const map = { consult: '咨询', complaint: '投诉', repair: '报修', policy: '政策', neighbor: '邻里' };
        const counts = {};
        MOCK_DATA.appeals.forEach(a => {
            const key = map[a.type] || a.type || '其他';
            counts[key] = (counts[key] || 0) + 1;
        });
        return { labels: Object.keys(counts), counts: Object.values(counts) };
    }

    if (path === '/dashboard/elderly-status' || path === '/admin/dashboard/elderly-status') {
        return {
            labels: ['状态正常', '需关注', '预警'],
            counts: [
                MOCK_DATA.elderly.filter(e => e.alert_level === 'normal').length,
                MOCK_DATA.elderly.filter(e => e.alert_level === 'warning').length,
                MOCK_DATA.elderly.filter(e => e.alert_level === 'danger').length
            ]
        };
    }

    if (path === '/dashboard/share-by-category' || path === '/admin/dashboard/share-by-category') {
        const map = { tools: '工具', books: '图书', baby: '母婴儿童', outdoor: '户外用品', kitchen: '厨房', other: '其他' };
        const counts = {};
        MOCK_DATA.shares.forEach(s => {
            const key = map[s.category] || s.category || '其他';
            counts[key] = (counts[key] || 0) + 1;
        });
        return { labels: Object.keys(counts), counts: Object.values(counts) };
    }

    // 投诉
    if (path.startsWith('/complaints') || path.startsWith('/admin/complaints')) {
        if (path.endsWith('/stats') || path.endsWith('complaints/stats')) {
            const list = MOCK_DATA.complaints;
            return {
                total: list.length,
                pending: list.filter(c => c.status === 'pending').length,
                processing: list.filter(c => c.status === 'processing').length,
                resolved: list.filter(c => c.status === 'resolved').length,
                urgent: list.filter(c => c.priority === 'urgent').length
            };
        }
        const parts = path.split('/');
        const id = parts[parts.length - 1] && !isNaN(parts[parts.length - 1]) ? parseInt(parts[parts.length - 1]) : null;
        if (id) {
            const cp = MOCK_DATA.complaints.find(x => x.id === id);
            if (path.includes('/process') && cp) {
                cp.status = 'processing';
                cp.handle_time = Date.now();
                cp.handle_result = body.result || '处理中';
                return { success: true, message: '已标记为处理中' };
            }
            if (path.includes('/resolve') && cp) {
                cp.status = 'resolved';
                cp.handle_time = Date.now();
                cp.handle_result = body.result || '已处理完成';
                // 同步执行处罚
                if (body.punishment) {
                    const p = body.punishment;
                    if (p.type === 'ban_user' || p.type === 'permanent_ban') {
                        const user = MOCK_DATA.users.find(u => u.id === cp.target_user_id);
                        if (user) {
                            user.status = p.type === 'permanent_ban' ? 'permanent_ban' : 'banned';
                            user.ban_reason = p.reason || cp.reason;
                            if (p.type !== 'permanent_ban') {
                                user.banned_until = Date.now() + (p.ban_days || 7) * 86400000;
                            }
                            user.banned_by = body.operator || '管理员';
                            user.ban_time = Date.now();
                        }
                    }
                    if (p.type === 'remove_item') {
                        const item = MOCK_DATA.shares.find(s => s.id === cp.target_item_id);
                        if (item) {
                            item.status = 'removed';
                            item.remove_reason = p.reason || '违规物品';
                            item.removed_by = body.operator || '管理员';
                        }
                    }
                    if (p.type === 'ban_post') {
                        const item = MOCK_DATA.shares.find(s => s.id === cp.target_item_id);
                        if (item) {
                            item.status = 'posting_ban';
                            item.ban_reason = p.reason || '违规发布';
                            item.banned_by = body.operator || '管理员';
                            item.ban_until = Date.now() + (p.ban_days || 14) * 86400000;
                        }
                    }
                }
                cp.punishment = body.punishment || null;
                return { success: true, message: '投诉已处理' };
            }
            if (path.includes('/reject') && cp) {
                cp.status = 'rejected';
                cp.handle_time = Date.now();
                cp.handle_result = body.result || '投诉不成立';
                return { success: true, message: '已驳回' };
            }
            if (method === 'DELETE') {
                const idx = MOCK_DATA.complaints.findIndex(x => x.id === id);
                if (idx >= 0) MOCK_DATA.complaints.splice(idx, 1);
                return { success: true };
            }
            return cp;
        }
        if (method === 'POST') {
            const newId = Math.max(...MOCK_DATA.complaints.map(x => x.id), 0) + 1;
            const cp = {
                id: newId,
                complaint_no: 'TS' + Date.now(),
                type: body.type || 'item',
                target_item_id: body.target_item_id,
                target_item_name: body.target_item_name || '',
                target_user_id: body.target_user_id,
                target_user_name: body.target_user_name || '',
                target_user_phone: body.target_user_phone || '',
                reason: body.reason || '其他',
                reason_detail: body.reason_detail || '',
                reporter_name: body.reporter_name || '匿名',
                reporter_phone: body.reporter_phone || '',
                status: 'pending',
                priority: body.priority || 'medium',
                create_time: Date.now(),
                handle_time: null,
                handle_result: '',
                punishment: null
            };
            MOCK_DATA.complaints.unshift(cp);
            return { success: true, id: newId, no: cp.complaint_no };
        }
        let list = MOCK_DATA.complaints.slice();
        if (body.status && body.status !== 'all') list = list.filter(c => c.status === body.status);
        if (body.type && body.type !== 'all') list = list.filter(c => c.type === body.type);
        if (body.keyword) {
            const kw = String(body.keyword).toLowerCase();
            list = list.filter(c => [c.complaint_no, c.target_item_name, c.target_user_name, c.reason, c.reason_detail, c.reporter_name].filter(Boolean).join(' ').toLowerCase().includes(kw));
        }
        return { list, total: list.length };
    }

    return null;
}

/* ============== API 类（挂载到 window） ============== */

window.AuthAPI = {
    login(phone, password) {
        return apiRequest('/admin/login', { method: 'POST', body: JSON.stringify({ phone, password }) });
    },
    logout() {
        return apiRequest('/admin/logout', { method: 'POST' });
    }
};

window.WorkOrderAPI = {
    list(params = {}) {
        return apiRequest('/workorders', { method: 'POST', body: JSON.stringify(params) });
    },
    detail(id) {
        return apiRequest('/workorders/' + id);
    },
    assign(id, handler) {
        return apiRequest('/workorders/' + id + '/assign', { method: 'POST', body: JSON.stringify({ handler }) });
    },
    process(id, result) {
        return apiRequest('/workorders/' + id + '/process', { method: 'POST', body: JSON.stringify({ result }) });
    },
    complete(id, result) {
        return apiRequest('/workorders/' + id + '/complete', { method: 'POST', body: JSON.stringify({ result }) });
    },
    remove(id) {
        return apiRequest('/workorders/' + id, { method: 'DELETE' });
    },
    getStats() {
        return apiRequest('/workorders/stats');
    }
};

window.AppealAPI = {
    list(params = {}) {
        return apiRequest('/appeals', { method: 'POST', body: JSON.stringify(params) });
    },
    detail(id) {
        return apiRequest('/appeals/' + id);
    },
    reply(id, content) {
        return apiRequest('/appeals/' + id + '/reply', { method: 'POST', body: JSON.stringify({ content }) });
    },
    close(id, result) {
        return apiRequest('/appeals/' + id + '/close', { method: 'POST', body: JSON.stringify({ result }) });
    },
    remove(id) {
        return apiRequest('/appeals/' + id, { method: 'DELETE' });
    },
    getStats() {
        return apiRequest('/appeals/stats');
    }
};

window.ShareAPI = {
    list(params = {}) {
        return apiRequest('/shares', { method: 'POST', body: JSON.stringify(params) });
    },
    detail(id) {
        return apiRequest('/shares/' + id);
    },
    remove(id) {
        return apiRequest('/shares/' + id, { method: 'DELETE' });
    },
    getStats() {
        return apiRequest('/shares/stats');
    }
};

window.NoticeAPI = {
    list(params = {}) {
        return apiRequest('/notices', { method: 'POST', body: JSON.stringify(params) });
    },
    publish(data) {
        return apiRequest('/notices', { method: 'POST', body: JSON.stringify(data) });
    },
    remove(id) {
        return apiRequest('/notices/' + id, { method: 'DELETE' });
    },
    getStats() {
        return apiRequest('/notices/stats');
    }
};

window.ElderlyAPI = {
    list() {
        return apiRequest('/elderly');
    },
    detail(id) {
        return apiRequest('/elderly/' + id);
    },
    update(id, data) {
        return apiRequest('/elderly/' + id, { method: 'PUT', body: JSON.stringify(data) });
    },
    dismissAlert(id, note) {
        return apiRequest('/elderly/' + id + '/dismiss', { method: 'POST', body: JSON.stringify({ note }) });
    },
    getStats() {
        return apiRequest('/elderly/stats');
    }
};

window.UserAPI = {
    list(params = {}) {
        return apiRequest('/users', { method: 'POST', body: JSON.stringify(params) });
    },
    detail(id) {
        return apiRequest('/users/' + id);
    },
    review(id, approved, note) {
        return apiRequest('/users/' + id + '/review', { method: 'POST', body: JSON.stringify({ approved, note }) });
    },
    remove(id) {
        return apiRequest('/users/' + id, { method: 'DELETE' });
    },
    getStats() {
        return apiRequest('/users/stats');
    }
};

window.DashboardAPI = {
    overview() {
        return apiRequest('/admin/dashboard/overview');
    },
    workOrderTrend() {
        return apiRequest('/admin/dashboard/workorder-trend');
    },
    appealByType() {
        return apiRequest('/admin/dashboard/appeal-by-type');
    },
    elderlyStatus() {
        return apiRequest('/admin/dashboard/elderly-status');
    },
    shareByCategory() {
        return apiRequest('/admin/dashboard/share-by-category');
    }
};

// AI隐患检测
window.DetectionAPI = {
    getStats() {
        return apiRequest('/admin/detection/stats');
    },
    getCameras() {
        return apiRequest('/admin/detection/cameras');
    },
    getEvents(params = {}) {
        return apiRequest('/admin/detection/events', { method: 'POST', body: JSON.stringify(params) });
    },
    getEventDetail(id) {
        return apiRequest('/admin/detection/' + id);
    },
    acknowledge(id) {
        return apiRequest('/admin/detection/' + id + '/acknowledge', { method: 'POST' });
    },
    resolve(id) {
        return apiRequest('/admin/detection/' + id + '/resolve', { method: 'POST' });
    }
};

window.ComplaintAPI = {
    getStats() {
        return apiRequest('/admin/complaints/stats', { method: 'POST' });
    },
    list(params) {
        return apiRequest('/admin/complaints', { method: 'POST', body: JSON.stringify(params || {}) });
    },
    detail(id) {
        return apiRequest('/admin/complaints/' + id);
    },
    submit(body) {
        return apiRequest('/complaints', { method: 'POST', body: JSON.stringify(body) });
    },
    process(id, result) {
        return apiRequest('/admin/complaints/' + id + '/process', { method: 'POST', body: JSON.stringify({ result: result }) });
    },
    resolve(id, body) {
        return apiRequest('/admin/complaints/' + id + '/resolve', { method: 'POST', body: JSON.stringify(body || {}) });
    },
    reject(id, result) {
        return apiRequest('/admin/complaints/' + id + '/reject', { method: 'POST', body: JSON.stringify({ result: result }) });
    },
    remove(id) {
        return apiRequest('/admin/complaints/' + id, { method: 'DELETE' });
    },
    banUser(userId, params) {
        return apiRequest('/admin/users/' + userId + '/ban', { method: 'POST', body: JSON.stringify(params || {}) });
    },
    unbanUser(userId) {
        return apiRequest('/admin/users/' + userId + '/unban', { method: 'POST' });
    },
    banUserPost(userId, params) {
        return apiRequest('/admin/users/' + userId + '/ban-post', { method: 'POST', body: JSON.stringify(params || {}) });
    },
    removeItem(itemId, reason) {
        return apiRequest('/admin/shares/' + itemId + '/remove', { method: 'POST', body: JSON.stringify({ reason: reason }) });
    },
    restoreItem(itemId) {
        return apiRequest('/admin/shares/' + itemId + '/restore', { method: 'POST' });
    },
    banItemPost(itemId, params) {
        return apiRequest('/admin/shares/' + itemId + '/ban-post', { method: 'POST', body: JSON.stringify(params || {}) });
    }
};
