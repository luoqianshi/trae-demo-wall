const API_BASE = 'http://127.0.0.1:5000/api';

// ========== Mock 数据中心 ==========
const MockDB = {
  users: [
    { id: 'u001', name: '张先生', phone: '13800138000', building: '3号楼', unit: '2单元', room: '502室', points: 852, password: '123456' }
  ],
  workOrders: [
    { id: 'wo001', category: '漏水维修', description: '厨房水槽下方水管连接处有漏水现象，已持续两天，地面有明显积水。', location: '3号楼2单元502室 厨房', status: '处理中', created_at: '2025-06-18 08:30', images: [] },
    { id: 'wo002', category: '路灯修复', description: '小区西门进入后第三个路灯不亮，晚上回家比较暗，存在安全隐患。', location: '小区西门主路 第三盏', status: '待处理', created_at: '2025-06-18 19:45', images: [] },
    { id: 'wo003', category: '门禁系统', description: '2单元的门禁刷卡系统偶尔失灵，需要多次刷卡才能开门，有时甚至无响应。', location: '3号楼2单元 门禁', status: '已完成', created_at: '2025-06-15 10:20', images: [] },
    { id: 'wo004', category: '电梯故障', description: '1号楼电梯按键有时失灵，按下后灯不亮，需要反复按几次才有反应。', location: '1号楼 电梯', status: '处理中', created_at: '2025-06-17 14:30', images: [] },
    { id: 'wo005', category: '消防隐患', description: '地下车库B1层有一个消防栓的玻璃门破损，内部器材外露，需要尽快修复。', location: '地下车库B1层 消防栓', status: '已完成', created_at: '2025-06-10 09:15', images: [] },
    { id: 'wo006', category: '漏水维修', description: '卫生间天花板有渗水痕迹，怀疑是楼上住户防水问题，需要物业协调检查。', location: '3号楼2单元502室 卫生间', status: '待处理', created_at: '2025-06-18 11:00', images: [] },
    { id: 'wo007', category: '路灯修复', description: '小区健身广场的照明灯有两盏不亮，晚上老人小孩活动不安全。', location: '小区健身广场', status: '已完成', created_at: '2025-06-12 20:00', images: [] },
    { id: 'wo008', category: '门禁系统', description: '地下车库通往单元楼的门禁密码键盘坏了，数字5按下去没有反应。', location: '地下车库B1层 3号单元入口', status: '处理中', created_at: '2025-06-16 16:40', images: [] },
    { id: 'wo009', category: '电梯故障', description: '5号楼电梯运行时有异响，轿厢内有轻微晃动，乘坐体验不好。', location: '5号楼 电梯', status: '待处理', created_at: '2025-06-18 07:50', images: [] },
    { id: 'wo010', category: '消防隐患', description: '楼道内有住户堆放杂物在消防通道，影响逃生通道畅通，需要清理。', location: '3号楼2单元 2-3楼楼梯间', status: '已完成', created_at: '2025-06-08 15:30', images: [] }
  ],
  appeals: [
    { id: 'ap001', title: '关于小区停车位分配的建议', type: '物业咨询', description: '建议小区停车位按照先到先得和固定租赁相结合的方式进行管理，目前的分配方式让很多晚下班的业主找不到车位，希望物业能重新规划。', status: '处理中', created_at: '2025-06-15 10:00', publisher: '3号楼居民' },
    { id: 'ap002', title: '建议增设儿童游乐设施', type: '建议反馈', description: '社区广场目前缺少适合3-6岁儿童的游乐设施，很多家长带孩子只能在草地上玩耍，希望能增加一些安全的游乐设施。', status: '已完成', created_at: '2025-06-08 15:30', publisher: '多位居民', result: '已纳入2025年社区改善计划，预计8月安装完成。' },
    { id: 'ap003', title: '楼上邻居噪音太大影响休息', type: '邻里纠纷', description: '我家楼上的住户经常在深夜11点后还在制造噪音，影响家人休息，已经多次沟通无果，希望物业能协调处理。', status: '处理中', created_at: '2025-06-16 22:15', publisher: '2号楼居民' },
    { id: 'ap004', title: '关于高龄补贴政策的咨询', type: '政策咨询', description: '我家有一位80岁的老人，想咨询一下高龄补贴的申请条件、流程和补贴标准，需要准备哪些材料？', status: '已完成', created_at: '2025-06-12 09:45', publisher: '3号楼居民', result: '已电话回复，携带身份证原件及复印件、近期一寸彩色照片2张、银行卡复印件到社区服务中心办理。' },
    { id: 'ap005', title: '建议增加小区绿化', type: '建议反馈', description: '小区内的绿化面积相对较少，建议在一些闲置的空地上增加绿植和花卉，改善居住环境。', status: '待处理', created_at: '2025-06-17 11:30', publisher: '4号楼居民' },
    { id: 'ap006', title: '小区健身器材维护问题', type: '物业咨询', description: '小区健身广场的部分健身器材出现松动和磨损，存在安全隐患，希望物业能定期检查维护。', status: '处理中', created_at: '2025-06-14 18:20', publisher: '多位居民' },
    { id: 'ap007', title: '关于垃圾分类投放时间的建议', type: '建议反馈', description: '目前垃圾分类投放时间为早晚各2小时，对于上班族来说不太方便，建议延长投放时间或增加投放点。', status: '待处理', created_at: '2025-06-18 08:00', publisher: '1号楼居民' },
    { id: 'ap008', title: '医保报销流程咨询', type: '政策咨询', description: '家中老人生病住院，想了解一下医保报销的具体流程、所需材料和报销比例。', status: '已完成', created_at: '2025-06-10 14:00', publisher: '5号楼居民', result: '已详细告知流程：出院后携带发票、费用清单、病历、医保卡到社保所办理报销，报销比例约70%-85%。' }
  ],
  shares: [
    { id: 'sh001', name: '电动螺丝刀套装', category: '工具', condition: '九成新', description: '博世品牌电动螺丝刀，带多种批头，使用过几次，状态很好。邻居有需要可以免费借用。', is_free: true, price: 0, image: '🔧', owner: '3号楼 张叔叔', ownerPhone: '138****8000', available: true, views: 128, borrow_count: 5, created_at: '2025-06-10', status: 'on' },
    { id: 'sh002', name: '儿童自行车', category: '母婴', condition: '七成新', description: '家中孩子长大了，闲置的12寸儿童自行车，适合3-5岁儿童使用，车况良好。', is_free: false, price: 80, image: '🚲', owner: '5号楼 李阿姨', ownerPhone: '139****9000', available: true, views: 256, borrow_count: 3, created_at: '2025-06-08', status: 'on' },
    { id: 'sh003', name: '《平凡的世界》全三册', category: '书籍', condition: '八成新', description: '经典文学作品，已看完，愿意免费与邻居分享阅读，书况良好无划痕。', is_free: true, price: 0, image: '📚', owner: '2号楼 王老师', ownerPhone: '137****7000', available: true, views: 95, borrow_count: 8, created_at: '2025-06-05', status: 'on' },
    { id: 'sh004', name: '家用小型吸尘器', category: '家电', condition: '九成新', description: '戴森V8吸尘器，去年购买，使用正常，配件齐全。适合临时需要深度清洁的邻居借用。', is_free: false, price: 30, image: '🔌', owner: '1号楼 陈先生', ownerPhone: '136****6000', available: false, views: 312, borrow_count: 12, created_at: '2025-06-01', status: 'on' },
    { id: 'sh005', name: '家用梯子（四步梯）', category: '工具', condition: '八成新', description: '铝合金四步梯，承重150kg，换灯泡、挂窗帘必备，轻便易搬运。', is_free: true, price: 0, image: '🪜', owner: '4号楼 赵阿姨', ownerPhone: '135****5000', available: true, views: 187, borrow_count: 15, created_at: '2025-05-28', status: 'on' },
    { id: 'sh006', name: '婴儿推车（轻便款）', category: '母婴', condition: '九成新', description: '好孩子品牌轻便婴儿推车，折叠方便，重量轻，适合出门逛街购物使用。', is_free: false, price: 100, image: '👶', owner: '6号楼 孙女士', ownerPhone: '134****4000', available: true, views: 223, borrow_count: 7, created_at: '2025-05-25', status: 'on' },
    { id: 'sh007', name: '停车位出租', category: '车位', condition: '全新', description: '1号楼地下停车位B1-023号，按月出租，车位宽敞，靠近电梯口，停车方便。', is_free: false, price: 300, image: '🚗', owner: '1号楼 业主', ownerPhone: '133****3000', available: true, views: 445, borrow_count: 2, created_at: '2025-05-20', status: 'on' },
    { id: 'sh008', name: '家用烧烤炉', category: '其他', condition: '九成新', description: '大号家用烧烤炉，仅使用过两次，适合邻里聚会、户外烧烤使用，附带烤网和炭夹。', is_free: true, price: 0, image: '🍖', owner: '7号楼 周先生', ownerPhone: '132****2000', available: true, views: 156, borrow_count: 4, created_at: '2025-05-18', status: 'on' },
    { id: 'sh009', name: '电锯工具套装', category: '工具', condition: '八成新', description: '家用小型电锯，适合切割木材、板材，带安全护具，使用时请注意安全。', is_free: true, price: 0, image: '🪚', owner: '2号楼 钱师傅', ownerPhone: '131****1000', available: true, views: 88, borrow_count: 3, created_at: '2025-05-15', status: 'on' },
    { id: 'sh010', name: '儿童绘本30册', category: '书籍', condition: '九成新', description: '精选儿童绘本30册，适合2-6岁儿童阅读，书况良好，希望能分享给爱读书的小朋友。', is_free: true, price: 0, image: '📖', owner: '4号楼 吴妈妈', ownerPhone: '130****2000', available: true, views: 201, borrow_count: 10, created_at: '2025-05-12', status: 'on' },
    { id: 'sh011', name: '空气净化器', category: '家电', condition: '八成新', description: '小米空气净化器，已更换全新滤网，适合雾霾天气或新房使用，可免费借用。', is_free: true, price: 0, image: '💨', owner: '3号楼 郑先生', ownerPhone: '129****3000', available: false, views: 178, borrow_count: 6, created_at: '2025-05-08', status: 'on' },
    { id: 'sh012', name: '羽毛球拍两副', category: '其他', condition: '九成新', description: '尤尼克斯羽毛球拍两副，附带羽毛球一筒，适合周末运动健身使用。', is_free: true, price: 0, image: '🏸', owner: '5号楼 冯先生', ownerPhone: '128****4000', available: true, views: 67, borrow_count: 4, created_at: '2025-05-05', status: 'on' },
    { id: 'sh013', name: '折叠野餐桌椅', category: '其他', condition: '九成新', description: '便携式折叠野餐桌椅套装，含桌子1张和椅子4把，适合户外野餐、露营使用。', is_free: true, price: 0, image: '🪑', owner: '7号楼 刘先生', ownerPhone: '138****4100', available: true, views: 112, borrow_count: 3, created_at: '2025-05-03', status: 'on' },
    { id: 'sh014', name: '专业相机（佳能）', category: '其他', condition: '九成新', description: '佳能EOS 80D单反相机，适合参加活动、婚礼拍摄时借用，附带50mm定焦镜头。', is_free: false, price: 200, image: '📷', owner: '2号楼 赵先生', ownerPhone: '139****4200', available: true, views: 387, borrow_count: 11, created_at: '2025-04-30', status: 'on' },
    { id: 'sh015', name: '儿童安全座椅', category: '母婴', condition: '九成新', description: 'Britax儿童安全座椅，适合9个月-12岁儿童，带ISOFIX接口，已清洗消毒。', is_free: true, price: 0, image: '🪑', owner: '3号楼 孙妈妈', ownerPhone: '135****4300', available: true, views: 145, borrow_count: 6, created_at: '2025-04-28', status: 'on' },
    { id: 'sh016', name: '家用蒸汽熨斗', category: '家电', condition: '八成新', description: '飞利浦蒸汽熨斗，可挂烫和平烫，适合出门前整理衣物使用。', is_free: true, price: 0, image: '♨️', owner: '5号楼 陈阿姨', ownerPhone: '138****4400', available: true, views: 76, borrow_count: 2, created_at: '2025-04-25', status: 'on' },
    { id: 'sh017', name: '《哈利波特》全集7本', category: '书籍', condition: '九成新', description: '哈利波特中文版全集7本，书况良好，适合中小学生阅读，免费与邻居分享。', is_free: true, price: 0, image: '📕', owner: '2号楼 王爸爸', ownerPhone: '137****4500', available: true, views: 163, borrow_count: 9, created_at: '2025-04-20', status: 'on' },
    { id: 'sh018', name: '投影仪（家用高清）', category: '家电', condition: '九成新', description: '极米Z6X家用高清投影仪，1080P分辨率，适合在家看电影、聚会观看体育比赛。', is_free: false, price: 50, image: '🎬', owner: '4号楼 李先生', ownerPhone: '134****4600', available: true, views: 421, borrow_count: 14, created_at: '2025-04-18', status: 'on' },
    { id: 'sh019', name: '便携音响', category: '家电', condition: '九成新', description: 'JBL便携蓝牙音响，音质出色，适合户外聚会、烧烤使用，电池续航好。', is_free: true, price: 0, image: '🔊', owner: '6号楼 周先生', ownerPhone: '132****4700', available: true, views: 98, borrow_count: 5, created_at: '2025-04-15', status: 'on' },
    { id: 'sh020', name: '电动滑板车', category: '工具', condition: '八成新', description: '九号电动滑板车，续航25km，适合短距离代步和周末短途出行体验。', is_free: false, price: 80, image: '🛴', owner: '1号楼 吴先生', ownerPhone: '133****4800', available: true, views: 276, borrow_count: 8, created_at: '2025-04-10', status: 'on' }
  ],
  notices: [
    { id: 'n001', category: '水电通知', title: '关于本周末小区停水通知', content: '因市政供水管网维护升级，本小区将于本周六（6月22日）上午8:00至下午18:00暂停供水。请各位居民提前做好储水准备，建议储存饮用水2-3天用量。停水期间物业将提供临时供水点，位置在小区广场喷泉旁。给您带来不便，敬请谅解！如有紧急用水需求，请拨打物业24小时热线：010-8888-8888。', publisher: '物业管理处', created_at: '2025-06-18 10:30', is_read: false },
    { id: 'n002', category: '安全提醒', title: '紧急！近期诈骗案件高发通知', content: '近期本小区及周边发生多起电信诈骗和入室盗窃案件，请居民务必提高警惕：1. 不轻易透露银行卡号、密码、验证码等信息；2. 不向陌生人转账汇款，接到可疑电话请拨打110核实；3. 出门前检查门窗是否关好，夜间回家注意观察是否有可疑人员尾随；4. 家中有老人的请特别提醒防范以"保健品"、"中奖"为名的诈骗。如发现可疑情况，请立即联系物业或拨打110报警。', publisher: '社区居委会', created_at: '2025-06-17 15:20', is_read: false },
    { id: 'n003', category: '水电通知', title: '夏季用电安全温馨提示', content: '随着夏季高温来临，居民用电负荷增大，为确保您的用电安全，请注意以下事项：1. 避免同时使用大功率电器（如空调、电热水器、电磁炉等），防止线路过载；2. 定期检查电器线路，发现老化、破损及时更换；3. 外出时请关闭不必要的电器电源；4. 空调温度建议设置在26℃以上，既节能又舒适；5. 如遇停电，请及时拨打物业24小时热线报修。', publisher: '物业管理处', created_at: '2025-06-16 09:00', is_read: true },
    { id: 'n004', category: '社区活动', title: '阳光花园第一届广场舞大赛报名开始', content: '为丰富社区居民文化生活，增进邻里交流，阳光花园社区将于7月1日（建党节）在社区广场举办第一届广场舞大赛！参赛形式：以家庭或邻里组队参赛，每队5-12人；奖项设置：一等奖1名（奖金500元+荣誉证书）、二等奖2名（奖金300元+荣誉证书）、三等奖3名（奖金200元+荣誉证书）、参与奖若干；报名时间：即日起至6月25日；报名地点：社区服务中心前台。欢迎广大居民踊跃报名参加！', publisher: '社区文化站', created_at: '2025-06-15 14:00', is_read: false },
    { id: 'n005', category: '水电通知', title: '电梯维保通知', content: '为确保电梯安全运行，物业将于6月19日（周三）上午9:00-12:00对1号楼电梯进行例行维保。维保期间电梯将暂停使用，请1号楼居民提前安排出行计划，或使用楼梯出行。维保完成后电梯将恢复正常运行。给您带来不便，敬请谅解！如有特殊需求（如运送重物、病人就医等），请提前联系物业协调。', publisher: '物业管理处', created_at: '2025-06-14 16:30', is_read: true },
    { id: 'n006', category: '社区活动', title: '社区义诊活动通知', content: '为关爱社区居民健康，特别是老年人健康，社区联合市中心医院将于6月25日（周二）上午9:00-11:30在社区服务中心举办免费义诊活动。义诊项目包括：血压测量、血糖检测、心电图检查、内科咨询、骨科咨询、眼科检查、健康饮食指导等。所有检查项目全部免费，无需预约，欢迎广大居民尤其是老年朋友前来参加。', publisher: '社区居委会', created_at: '2025-06-13 11:00', is_read: false },
    { id: 'n007', category: '安全提醒', title: '消防安全隐患排查通知', content: '根据上级消防安全部门要求，物业将于近期对小区进行全面消防安全隐患排查。排查内容包括：1. 消防通道是否畅通（请各位居民不要在楼道、楼梯间堆放杂物）；2. 消防栓、灭火器是否完好有效；3. 应急照明和疏散指示标志是否正常；4. 电动车是否存在违规充电情况。请各位居民配合检查，发现问题及时整改，共同维护小区消防安全。', publisher: '物业管理处', created_at: '2025-06-12 08:30', is_read: false },
    { id: 'n008', category: '其他通知', title: '关于物业费缴纳的温馨提示', content: '2025年下半年物业费缴纳工作已开始，请各位居民及时缴纳物业费。缴费方式：1. 到物业前台现金或刷卡缴纳；2. 通过微信公众号"阳光花园物业"在线缴纳；3. 通过小区自助缴费机缴纳。缴费时间：每月1日-25日。如有疑问，请拨打物业热线咨询。感谢您对物业工作的支持与配合！', publisher: '物业管理处', created_at: '2025-06-11 10:15', is_read: true }
  ],
  pointsHistory: [
    { id: 'ph001', title: '报修评价奖励', description: '对工单 WO202506150003 进行评价', change: 5, type: 'earn', created_at: '2025-06-18 10:30' },
    { id: 'ph002', title: '发布共享物品', description: '发布"电动螺丝刀套装"', change: 20, type: 'earn', created_at: '2025-06-15 14:20' },
    { id: 'ph003', title: '帮助邻居取快递', description: '帮助 3号楼2单元501 王奶奶取快递', change: 10, type: 'earn', created_at: '2025-06-12 16:00' },
    { id: 'ph004', title: '积分兑换洗衣液', description: '兑换 蓝月亮洗衣液2kg装', change: -300, type: 'spend', created_at: '2025-06-10 09:15' },
    { id: 'ph005', title: '参加社区活动', description: '参加6月8日社区健康讲座', change: 30, type: 'earn', created_at: '2025-06-08 10:00' },
    { id: 'ph006', title: '完善个人资料', description: '首次完善个人信息并认证', change: 50, type: 'earn', created_at: '2025-06-01 09:00' },
    { id: 'ph007', title: '陪伴独居老人', description: '陪伴 1号楼301 李奶奶2小时', change: 30, type: 'earn', created_at: '2025-05-28 15:30' },
    { id: 'ph008', title: '报修反馈奖励', description: '报告楼道灯损坏问题', change: 15, type: 'earn', created_at: '2025-05-25 19:00' },
    { id: 'ph009', title: '积分兑换大米', description: '兑换 东北优质大米5kg', change: -500, type: 'spend', created_at: '2025-05-20 10:30' },
    { id: 'ph010', title: '邻里互助奖励', description: '帮助邻居搬运重物', change: 20, type: 'earn', created_at: '2025-05-18 14:00' },
    { id: 'ph011', title: '共享物品被借用', description: '梯子被邻居借用', change: 15, type: 'earn', created_at: '2025-05-15 11:20' },
    { id: 'ph012', title: '参加志愿活动', description: '参加社区清洁日活动', change: 40, type: 'earn', created_at: '2025-05-10 08:00' },
    { id: 'ph013', title: '积分兑换雨伞', description: '兑换 社区定制晴雨伞', change: -200, type: 'spend', created_at: '2025-05-05 16:30' },
    { id: 'ph014', title: '提出建设性建议', description: '建议增加小区座椅被采纳', change: 50, type: 'earn', created_at: '2025-05-01 10:00' },
    { id: 'ph015', title: '参加社区会议', description: '参加业主代表大会', change: 20, type: 'earn', created_at: '2025-04-28 19:00' }
  ],
  pointsGoods: [
    { id: 'pg001', name: '物业费10元抵扣券', icon: '🎫', points: 100, stock: 99, description: '可用于抵扣下月物业费10元' },
    { id: 'pg002', name: '社区定制晴雨伞', icon: '☂️', points: 200, stock: 20, description: '阳光花园定制款，防雨防晒' },
    { id: 'pg003', name: '蓝月亮洗衣液', icon: '🧴', points: 300, stock: 15, description: '蓝月亮深层洁净洗衣液2kg装' },
    { id: 'pg004', name: '东北优质大米', icon: '🌾', points: 500, stock: 10, description: '东北五常大米5kg装，新米' },
    { id: 'pg005', name: '金龙鱼调和油', icon: '🫒', points: 600, stock: 8, description: '金龙鱼食用调和油5L装' },
    { id: 'pg006', name: '社区定制水杯', icon: '🥤', points: 150, stock: 30, description: '邻里智联定制纪念保温杯' },
    { id: 'pg007', name: '图书借阅月卡', icon: '📖', points: 80, stock: 50, description: '社区图书角免费借阅1个月' },
    { id: 'pg008', name: '家政服务代金券', icon: '🧹', points: 400, stock: 12, description: '4小时家庭清洁服务' }
  ],
  pointsRules: [
    { id: 'pr001', title: '发布共享物品', desc: '在邻里共享平台发布闲置物品供邻居借用', points: '20 积分/件' },
    { id: 'pr002', title: '帮助邻居取快递', desc: '帮助邻居代取快递并送达', points: '10 积分/次' },
    { id: 'pr003', title: '帮忙照看宠物', desc: '邻居外出时代为照看宠物（猫、狗等）', points: '20 积分/天' },
    { id: 'pr004', title: '陪伴独居老人', desc: '主动陪伴社区登记的独居老人1小时以上', points: '30 积分/次' },
    { id: 'pr005', title: '报修后评价', desc: '完成报修并对服务质量进行评价反馈', points: '5 积分/次' },
    { id: 'pr006', title: '参加社区活动', desc: '参加社区组织的各类文化、体育、公益活动', points: '20-50 积分/次' },
    { id: 'pr007', title: '完善个人资料', desc: '首次完善个人信息并通过楼栋认证', points: '50 积分' },
    { id: 'pr008', title: '提出建设性建议', desc: '对社区建设或物业服务提出建议被采纳', points: '30-100 积分/条' }
  ],
  elderly: [
    { id: 'el001', name: '李奶奶', age: 78, building: '1号楼', room: '301室', phone: '138****1111', emergency_contact: '儿子 张建国 139-0000-1111', last_active: '2025-06-18 08:30', status: '正常', health_note: '高血压，需定期服药', hobbies: ['散步', '广场舞', '养花'] },
    { id: 'el002', name: '王爷爷', age: 82, building: '2号楼', room: '202室', phone: '138****2222', emergency_contact: '女儿 王美丽 139-0000-2222', last_active: '2025-06-17 20:15', status: '关注', health_note: '糖尿病，行动稍缓，独居', hobbies: ['下棋', '看书', '听广播'] },
    { id: 'el003', name: '张奶奶', age: 75, building: '3号楼', room: '501室', phone: '138****3333', emergency_contact: '孙子 张明 139-0000-3333', last_active: '2025-06-18 07:45', status: '正常', health_note: '身体状况良好，喜欢运动', hobbies: ['太极', '广场舞', '买菜'] },
    { id: 'el004', name: '刘爷爷', age: 85, building: '4号楼', room: '102室', phone: '138****4444', emergency_contact: '侄女 刘芳 139-0000-4444', last_active: '2025-06-16 18:20', status: '预警', health_note: '心脏病，近期身体不适，已联系家属', hobbies: ['养花', '养鱼'] },
    { id: 'el005', name: '陈奶奶', age: 73, building: '5号楼', room: '401室', phone: '138****5555', emergency_contact: '儿子 陈伟 139-0000-5555', last_active: '2025-06-18 09:10', status: '正常', health_note: '轻度关节炎，腿脚不太方便', hobbies: ['看电视', '织毛衣'] },
    { id: 'el006', name: '赵爷爷', age: 80, building: '6号楼', room: '203室', phone: '138****6666', emergency_contact: '邻居（已委托）张先生 139-0000-6666', last_active: '2025-06-15 11:30', status: '关注', health_note: '听力下降，与人沟通有障碍，子女在外地', hobbies: ['散步', '看报纸', '书法'] }
  ],
  complaints: [
    { id: 'cp001', no: 'TS202506180001', type: 'item', target_item_id: 'sh005', target_item_name: '电动螺丝刀套装', target_user_name: '2号楼 李先生', reason: '虚假描述', reason_detail: '借用后发现工具损坏严重，与描述中的"九成新"严重不符。', reporter: '当前用户', created_at: '2025-06-18 09:15', status: '待处理', priority: 'high', images: [], punishment: null },
    { id: 'cp002', no: 'TS202506180002', type: 'user', target_user_id: 'u010', target_user_name: '5号楼 冯先生', reason: '不文明沟通', reason_detail: '在沟通过程中使用不文明用语，态度恶劣，多次沟通无果。', reporter: '当前用户', created_at: '2025-06-17 14:30', status: '处理中', priority: 'medium', images: [], punishment: null },
    { id: 'cp003', no: 'TS202506180003', type: 'item', target_item_id: 'sh011', target_item_name: '空气净化器', target_user_name: '3号楼 郑先生', reason: '卫生问题', reason_detail: '借用的净化器有明显异味，滤网未按描述更换，使用体验极差。', reporter: '3号楼2单元 王女士', created_at: '2025-06-16 10:45', status: '待处理', priority: 'medium', images: [], punishment: null },
    { id: 'cp004', no: 'TS202506180004', type: 'user', target_user_id: 'u008', target_user_name: '4号楼 吴先生', reason: '失信行为', reason_detail: '约定的归还时间没有归还物品，多次联系也不回复，已经拖延3天。', reporter: '5号楼1单元 钱先生', created_at: '2025-06-15 16:20', status: '已处理', priority: 'high', images: [], punishment: { type: 'ban_user', duration_days: 7, reason: '不按时归还物品且失联', banned_until: '2025-06-22', banned_permanent: false } },
    { id: 'cp005', no: 'TS202506180005', type: 'item', target_item_id: 'sh013', target_item_name: '园艺工具套装', target_user_name: '6号楼 赵阿姨', reason: '违规收费', reason_detail: '申请时注明免费共享，实际领取时却被要求支付费用，与平台信息不符。', reporter: '2号楼3单元 李女士', created_at: '2025-06-14 11:30', status: '已处理', priority: 'high', images: [], punishment: { type: 'remove_item', reason: '与描述不符并违规收费', duration_days: null } },
    { id: 'cp006', no: 'TS202506180006', type: 'user', target_user_id: 'u013', target_user_name: '7号楼 孙先生', reason: '不文明沟通', reason_detail: '因借用问题发生矛盾，对方在沟通中使用大量不文明用语并进行人身攻击。', reporter: '4号楼2单元 周女士', created_at: '2025-06-13 08:50', status: '已处理', priority: 'urgent', images: [], punishment: { type: 'ban_user', duration_days: null, reason: '多次使用不文明用语，严重违反社区规定', banned_permanent: true } }
  ],
  complaintReasons: {
    item: [
      { value: '虚假描述', label: '物品描述与实际不符' },
      { value: '卫生问题', label: '卫生状况差、有异味' },
      { value: '违规收费', label: '收费与说明不符' },
      { value: '损坏物品', label: '归还时物品损坏' },
      { value: '非法物品', label: '包含违禁或危险物品' },
      { value: '其他', label: '其他问题（请在详情说明）' }
    ],
    user: [
      { value: '不文明沟通', label: '使用不文明用语、态度恶劣' },
      { value: '失信行为', label: '不按时归还/承诺不兑现' },
      { value: '诈骗嫌疑', label: '疑似诈骗、欺诈行为' },
      { value: '恶意投诉', label: '恶意举报、骚扰他人' },
      { value: '冒用信息', label: '冒用他人身份发布信息' },
      { value: '其他', label: '其他问题（请在详情说明）' }
    ]
  },
  forumPosts: [
    { id: 'fp001', title: '分享一下我家的阳台改造全过程，花了3000块，效果超出预期！', content: '之前阳台一直堆杂物，上周找时间改造了一下。先清理，然后刷墙、装架子、买了一些绿植。总共花了3000块左右，结果比想象中好太多。现在每天早上起来第一件事就是去阳台喝咖啡。有需要看具体图纸和材料清单的可以私信我，免费提供。', author: '3号楼 张女士', authorPhone: '138****8100', category: '生活分享', likes: 128, liked: false, favorites: 46, favorited: false, comments: 23, views: 562, created_at: '2025-06-18 09:30', images: ['🌿'], isHot: true },
    { id: 'fp002', title: '提醒各位邻居：7号楼电梯年检通知', content: '接到物业通知，7号楼电梯将于本周四（6月20日）上午9点至下午5点进行年度安全检测，期间电梯将暂停使用。如给您带来不便敬请谅解。行动不便的老人请提前安排，或联系物业协调使用其他楼电梯。', author: '社区居委会', authorPhone: '010-8888-0000', category: '社区通知', likes: 56, liked: false, favorites: 22, favorited: false, comments: 8, views: 342, created_at: '2025-06-18 08:00', images: [], isHot: false },
    { id: 'fp003', title: '周末打算组织小区孩子一起去图书馆，有想一起去的吗？', content: '计划本周六上午带孩子去市图书馆新馆，目前已经有3户邻居报名了。想一起去的家长可以私信我。图书馆免费开放，但需提前预约。集合时间地点：周六上午8:30，小区西门公交站。我们一起拼车或坐公交前往，中午在附近吃饭，下午3点左右返回。', author: '5号楼 李妈妈', authorPhone: '139****8200', category: '邻里互助', likes: 87, liked: false, favorites: 34, favorited: false, comments: 15, views: 428, created_at: '2025-06-17 20:15', images: ['📚'], isHot: false },
    { id: 'fp004', title: '关于小区健身器材老化问题的建议', content: '最近带孩子去健身广场玩，发现好几件健身器材都有不同程度的损坏，有的螺丝松动，有的把手有裂缝。这些器材如果继续使用存在一定安全隐患，尤其是老人和小孩使用时。建议物业：1.尽快安排一次全面检修；2.在损坏的器材上贴警示标志；3.考虑申请更换一批新器材。不知大家意见如何？', author: '2号楼 王大爷', authorPhone: '137****8300', category: '讨论吐槽', likes: 203, liked: false, favorites: 78, favorited: false, comments: 45, views: 892, created_at: '2025-06-17 15:20', images: [], isHot: true },
    { id: 'fp005', title: '分享一个简单又好吃的家常菜：西红柿炖牛腩', content: '最近做了一道西红柿炖牛腩，家里人都很喜欢，和大家分享一下做法：1.牛腩切块冷水下锅焯水；2.西红柿去皮切块；3.锅中放油，下姜片葱爆香；4.下牛腩翻炒几分钟；5.加西红柿、生抽、老抽、料酒、糖；6.加水没过食材大火烧开转小火炖1小时；7.最后大火收汁即可。简单又下饭，大家可以试试！', author: '4号楼 陈阿姨', authorPhone: '135****8400', category: '美食分享', likes: 156, liked: false, favorites: 92, favorited: false, comments: 28, views: 634, created_at: '2025-06-16 18:45', images: ['🍲'], isHot: true },
    { id: 'fp006', title: '寻物启事：4号楼3单元楼下花园遗失一串钥匙', content: '今天上午10点左右在4号楼3单元楼下花园不慎遗失一串钥匙，大约有5把，钥匙扣是红色的小熊挂件。有捡到的邻居请联系我，不胜感激！也请物业帮忙留意一下。联系电话：136****8500', author: '4号楼 周女士', authorPhone: '136****8500', category: '失物招领', likes: 23, liked: false, favorites: 8, favorited: false, comments: 5, views: 182, created_at: '2025-06-18 10:20', images: [], isHot: false },
    { id: 'fp007', title: '免费送！家里孩子长大了，闲置的儿童书籍有人要吗？', content: '家里孩子上小学三年级了，之前幼儿园时期的绘本、故事书闲置了大概50本，书况都很好，没有涂画和损坏。想免费送给小区有需要的邻居，最好是家里有2-6岁小朋友的家庭。如果您需要，请私信我，时间方便的话也可以上门挑选。', author: '1号楼 吴妈妈', authorPhone: '134****8600', category: '闲置物品', likes: 45, liked: false, favorites: 67, favorited: false, comments: 12, views: 289, created_at: '2025-06-17 11:30', images: ['📖'], isHot: false },
    { id: 'fp008', title: '建议在小区增加一些夜间照明', content: '入夏以后晚上出来散步的人越来越多，但发现小区西北角落的几条小路照明严重不足，晚上黑漆漆的很不安全。建议物业在以下几个位置增加路灯：1.5号楼后面花园小路；2.地下车库B2层人行通道；3.小区健身广场的西北角。不知大家有没有同感？', author: '6号楼 孙先生', authorPhone: '133****8700', category: '讨论吐槽', likes: 167, liked: false, favorites: 43, favorited: false, comments: 32, views: 567, created_at: '2025-06-16 21:50', images: [], isHot: false }
  ],
  forumCategories: ['社区通知', '生活分享', '邻里互助', '美食分享', '讨论吐槽', '失物招领', '闲置物品', '其他'],
  forumComments: [
    { id: 'fc001', postId: 'fp001', author: '5号楼 李先生', authorPhone: '139****8200', content: '太厉害了！能告诉我具体用了哪些工具吗？', created_at: '2025-06-18 10:00', likes: 5 },
    { id: 'fc002', postId: 'fp001', author: '2号楼 王女士', authorPhone: '137****8210', content: '这个改造后真的漂亮', created_at: '2025-06-18 10:15', likes: 8 },
    { id: 'fc003', postId: 'fp001', author: '4号楼 陈先生', authorPhone: '136****8220', content: '能私信给我发一下材料清单吗？很想参考', created_at: '2025-06-18 11:00', likes: 12 },
    { id: 'fc004', postId: 'fp004', author: '1号楼 孙阿姨', authorPhone: '135****8230', content: '支持！我家老人也反映过这个问题', created_at: '2025-06-17 16:00', likes: 15 },
    { id: 'fc005', postId: 'fp004', author: '7号楼 周先生', authorPhone: '134****8240', content: '建议物业每月检查一次', created_at: '2025-06-17 18:30', likes: 22 },
    { id: 'fc006', postId: 'fp005', author: '3号楼 张大爷', authorPhone: '133****8250', content: '收藏了，周末试试', created_at: '2025-06-17 19:10', likes: 6 },
    { id: 'fc007', postId: 'fp005', author: '6号楼 吴妈妈', authorPhone: '132****8260', content: '能分享一下用的什么锅吗？', created_at: '2025-06-17 20:00', likes: 9 },
    { id: 'fc008', postId: 'fp008', author: '2号楼 钱先生', authorPhone: '131****8270', content: '严重支持，晚上遛弯确实不安全', created_at: '2025-06-16 22:15', likes: 18 }
  ],
  helpDemands: {
    '取快递': [
      { id: 'hd001', title: '帮忙取快递', content: '上班不能回家，有3个快递在菜鸟驿站，地址在小区南门。下班后顺路的邻居帮我带回来即可，可加50积分感谢。', publisher: '2号楼 王女士', phone: '138****9100', time: '今晚18:00-20:00', points: 50, status: 'open', views: 23, accepted_by: null, created_at: '2025-06-18 10:20' },
      { id: 'hd002', title: '急！下班顺路取个大件快递', content: '有一个大件快递（约5kg）需要从菜鸟驿站取回来，本人下班太晚不方便。如果有邻居下班后往2号楼方向方便的话请帮忙，愿意支付100积分感谢。', publisher: '5号楼 张先生', phone: '139****9200', time: '今天17:00-19:00', points: 100, status: 'accepted', views: 45, accepted_by: '3号楼 刘先生', created_at: '2025-06-18 08:30' },
      { id: 'hd003', title: '长期需要周末帮忙取快递', content: '本人周末经常需要出差，希望能找一位固定的邻居帮忙代收一下快递。不需要每次都送过来，放在小区物业处就行。愿意每次支付30积分。', publisher: '4号楼 陈先生', phone: '137****9300', time: '周末不定时', points: 30, status: 'open', views: 67, accepted_by: null, created_at: '2025-06-17 20:10' }
    ],
    '照看宠物': [
      { id: 'hd004', title: '下周末出门，需要临时照顾小猫2天', content: '下周六周日要出差2天，家里一只英短小猫需要找人临时照顾。已打疫苗已绝育，性格温顺不挑食。可提供猫粮猫砂，愿意支付200积分/天。', publisher: '1号楼 吴女士', phone: '135****9400', time: '6月22日-6月23日', points: 400, status: 'open', views: 89, accepted_by: null, created_at: '2025-06-18 09:45' },
      { id: 'hd005', title: '每天傍晚帮忙遛狗30分钟', content: '最近一周需要加班，每天傍晚6点左右没办法按时遛狗。想请爱狗的邻居帮忙遛我家金毛30分钟。狗狗已训练好，很听话。愿支付100积分/次。', publisher: '6号楼 孙先生', phone: '133****9500', time: '本周每天18:00-18:30', points: 500, status: 'accepted', views: 112, accepted_by: '7号楼 钱阿姨', created_at: '2025-06-17 15:20' },
      { id: 'hd006', title: '暑假期间需要长期寄养的邻居看过来', content: '我家有一只2岁的柯基，性格活泼。7月底-8月初我们全家要出门旅游10天，希望能找到靠谱的邻居帮忙照看。可送狗上门，支付300元+500积分。', publisher: '3号楼 赵先生', phone: '132****9600', time: '7月25日-8月5日', points: 500, status: 'open', views: 156, accepted_by: null, created_at: '2025-06-16 11:30' }
    ],
    '陪伴老人': [
      { id: 'hd007', title: '想请热心邻居周末陪我家老人去医院复查', content: '我家住在2号楼，老人78岁，身体还算健康但腿脚不太方便。下周二需要去医院做复查，我和丈夫都要上班无法请假。想请一位有时间的热心邻居陪同。愿意支付300积分感谢。', publisher: '2号楼 李女士（老人女儿）', phone: '138****9700', time: '6月25日 周二上午9:00-12:00', points: 300, status: 'open', views: 78, accepted_by: null, created_at: '2025-06-18 09:00' },
      { id: 'hd008', title: '独居老人希望有人能偶尔陪聊聊天', content: '我是社区志愿者，负责联系的1号楼301室张奶奶最近比较孤独，儿女都在外地。张奶奶76岁，身体很好，喜欢养花和唱歌。希望小区有热心邻居有空能偶尔上门陪老人聊聊天、喝喝茶。', publisher: '社区志愿者', phone: '010-8888-0001', time: '每周2-3次，每次1小时', points: 100, status: 'open', views: 45, accepted_by: null, created_at: '2025-06-17 14:00' },
      { id: 'hd009', title: '下月初老人过生日想请人帮忙做一顿丰盛的午餐', content: '我母亲下月1号满80岁，想在家里办一个简单的家宴，大约10人。老人希望吃一些传统的家常菜，但我自己做饭水平有限。想请一位会做家常菜的邻居帮忙做一顿午饭。食材费用另付。', publisher: '5号楼 王先生', phone: '139****9800', time: '7月1日 中午11:00-13:00', points: 500, status: 'accepted', views: 123, accepted_by: '4号楼 周阿姨', created_at: '2025-06-15 16:30' }
    ],
    '绿植托管': [
      { id: 'hd010', title: '出差一周，家里的多肉植物和绿萝需要浇水', content: '下周一到周日要出差7天，家里阳台有20多盆多肉植物和几盆绿萝，需要每周浇水2-3次。希望有喜欢养花的邻居帮忙照看一下。有自动补水工具，很简单。', publisher: '4号楼 吴女士', phone: '137****9900', time: '6月24日-6月30日', points: 150, status: 'open', views: 67, accepted_by: null, created_at: '2025-06-18 11:00' },
      { id: 'hd011', title: '长期托管：父母回老家，家里有10盆兰花需要照顾', content: '父母下月要回老家2个月，家里有10盆名贵兰花需要每周浇水、施肥。本人工作忙不太懂养花。想请会养花的邻居帮忙长期托管一下，或者定期上门浇水。愿支付500积分/月。', publisher: '7号楼 钱先生', phone: '136****1000', time: '7月1日-8月31日', points: 1000, status: 'open', views: 89, accepted_by: null, created_at: '2025-06-17 10:15' },
      { id: 'hd012', title: '免费托管！分享自己的养花小经验', content: '本人有10年养花经验，家里养了30多盆绿植。邻居们有花草需要临时托管的，我可以免费帮忙，前提是你们愿意把花草搬过来（因为我家阳台比较大）。同时也欢迎喜欢养花的邻居来我家参观交流。', publisher: '2号楼 孙阿姨', phone: '135****1100', time: '随时', points: 0, status: 'open', views: 234, accepted_by: null, created_at: '2025-06-16 08:00' }
    ]
  },
  helpCategories: ['取快递', '照看宠物', '陪伴老人', '绿植托管']
};

// ========== 通用请求包装函数 ==========
async function apiRequest(endpoint, method, params, mockFn) {
  try {
    const token = localStorage.getItem('neighbor_token') || '';
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      }
    };
    let url = API_BASE + endpoint;
    if (method === 'GET' && params) {
      const parts = [];
      for (const k in params) {
        if (params[k] !== null && params[k] !== undefined && params[k] !== '') {
          parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(params[k]));
        }
      }
      if (parts.length > 0) url += '?' + parts.join('&');
    } else if (params) {
      options.body = JSON.stringify(params);
    }
    const res = await fetch(url, options);
    const data = await res.json();
    if (data.code === 0 || data.code === 200) {
      return data.data !== undefined ? data.data : data;
    }
    throw new Error(data.msg || '请求失败');
  } catch (err) {
    return mockFn();
  }
}

// ========== 通用列表过滤 ==========
function filterList(list, params) {
  let result = [...list];
  if (params) {
    if (params.status) {
      result = result.filter(item => item.status === params.status);
    }
    if (params.category) {
      result = result.filter(item => item.category === params.category || item.type === params.category);
    }
    if (params.type) {
      result = result.filter(item => item.type === params.type);
    }
  }
  return result;
}

function paginate(list, page, size) {
  const p = page || 1;
  const s = size || 10;
  const start = (p - 1) * s;
  const end = start + s;
  return list.slice(start, end);
}

// ========== AuthAPI ==========
window.AuthAPI = {
  login(phone, password) {
    return apiRequest('/auth/login', 'POST', { phone, password }, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          if (phone && /^1\d{10}$/.test(phone) && password && password.length >= 6) {
            let user = MockDB.users.find(function(u) { return u.phone === phone; });
            if (!user) {
              user = {
                id: 'u_' + Date.now(),
                name: phone.slice(-4) + '用户',
                phone: phone,
                building: '3号楼',
                unit: '2单元',
                room: '502室',
                points: 852
              };
              MockDB.users.push(user);
            }
            resolve({
              token: 'mock_token_' + Date.now(),
              user: {
                id: user.id,
                name: user.name,
                phone: user.phone,
                building: user.building,
                unit: user.unit,
                room: user.room,
                points: user.points
              }
            });
          } else {
            resolve({
              token: 'mock_token_' + Date.now(),
              user: {
                id: 'u001',
                name: '张先生',
                phone: phone || '13800138000',
                building: '3号楼',
                unit: '2单元',
                room: '502室',
                points: 852
              }
            });
          }
        }, 300);
      });
    });
  },
  register(params) {
    return apiRequest('/auth/register', 'POST', params, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          const newUser = {
            id: 'u_' + Date.now(),
            name: params.name || '新用户',
            phone: params.phone || '',
            building: params.building || '',
            unit: params.unit || '',
            room: params.room || '',
            points: 50,
            password: params.password || ''
          };
          MockDB.users.push(newUser);
          resolve({ success: true, message: '注册成功，请等待网格员审核' });
        }, 300);
      });
    });
  },
  logout() {
    return apiRequest('/auth/logout', 'POST', null, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          localStorage.removeItem('neighbor_token');
          localStorage.removeItem('neighbor_user');
          resolve({ success: true });
        }, 100);
      });
    });
  },
  me() {
    return apiRequest('/auth/me', 'GET', null, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          const userStr = localStorage.getItem('neighbor_user');
          const user = userStr ? JSON.parse(userStr) : null;
          if (user) {
            resolve({
              id: user.id || 'u001',
              name: user.name || '张先生',
              phone: user.phone || '13800138000',
              building: user.building || '3号楼',
              unit: user.unit || '2单元',
              room: user.room || '502室',
              points: user.points || 852
            });
          } else {
            resolve({
              id: 'u001',
              name: '张先生',
              phone: '13800138000',
              building: '3号楼',
              unit: '2单元',
              room: '502室',
              points: 852
            });
          }
        }, 200);
      });
    });
  }
};

// ========== WorkOrderAPI ==========
window.WorkOrderAPI = {
  list(params) {
    return apiRequest('/workorders', 'GET', params, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          const p = params || {};
          let list = filterList(MockDB.workOrders, p);
          const total = list.length;
          list = paginate(list, p.page, p.size);
          resolve({ list: list, total: total });
        }, 200);
      });
    });
  },
  detail(id) {
    return apiRequest('/workorders/' + id, 'GET', null, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          const order = MockDB.workOrders.find(function(w) { return w.id === id; });
          resolve(order || MockDB.workOrders[0]);
        }, 150);
      });
    });
  },
  create(params) {
    return apiRequest('/workorders', 'POST', params, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          const newOrder = {
            id: 'wo_' + Date.now(),
            category: params.category || '其他',
            description: params.description || '',
            location: params.location || '',
            status: '待处理',
            created_at: new Date().toLocaleString('zh-CN', { hour12: false }),
            images: params.images || []
          };
          MockDB.workOrders.unshift(newOrder);
          resolve({ success: true, id: newOrder.id });
        }, 300);
      });
    });
  },
  process(id, result) {
    return apiRequest('/workorders/' + id + '/process', 'POST', { result: result }, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          const order = MockDB.workOrders.find(function(w) { return w.id === id; });
          if (order) order.status = '处理中';
          resolve({ success: true });
        }, 200);
      });
    });
  },
  complete(id, result) {
    return apiRequest('/workorders/' + id + '/complete', 'POST', { result: result }, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          const order = MockDB.workOrders.find(function(w) { return w.id === id; });
          if (order) order.status = '已完成';
          resolve({ success: true });
        }, 200);
      });
    });
  },
  rate(id, rating, feedback) {
    return apiRequest('/workorders/' + id + '/rate', 'POST', { rating: rating, feedback: feedback }, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          const order = MockDB.workOrders.find(function(w) { return w.id === id; });
          if (order) {
            order.rating = rating;
            order.feedback = feedback;
            const userStr = localStorage.getItem('neighbor_user');
            if (userStr) {
              const user = JSON.parse(userStr);
              user.points = (user.points || 852) + 5;
              localStorage.setItem('neighbor_user', JSON.stringify(user));
            }
          }
          resolve({ success: true, bonusPoints: 5, message: '评价成功！您已获得 5 积分奖励' });
        }, 200);
      });
    });
  }
};

// ========== AppealAPI ==========
window.AppealAPI = {
  list(params) {
    return apiRequest('/appeals', 'GET', params, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          const p = params || {};
          let list = filterList(MockDB.appeals, p);
          const total = list.length;
          list = paginate(list, p.page, p.size);
          resolve({ list: list, total: total });
        }, 200);
      });
    });
  },
  detail(id) {
    return apiRequest('/appeals/' + id, 'GET', null, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          const appeal = MockDB.appeals.find(function(a) { return a.id === id; });
          resolve(appeal || MockDB.appeals[0]);
        }, 150);
      });
    });
  },
  create(params) {
    return apiRequest('/appeals', 'POST', params, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          const newAppeal = {
            id: 'ap_' + Date.now(),
            title: params.title || '',
            description: params.description || '',
            type: params.type || '建议反馈',
            status: '待处理',
            created_at: new Date().toLocaleString('zh-CN', { hour12: false }),
            publisher: '当前用户'
          };
          MockDB.appeals.unshift(newAppeal);
          resolve({ success: true, id: newAppeal.id });
        }, 300);
      });
    });
  }
};

// ========== ShareAPI ==========
window.ShareAPI = {
  list(params) {
    return apiRequest('/shares', 'GET', params, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          const p = params || {};
          let list = [...MockDB.shares];
          if (p.category && p.category !== '全部') {
            list = list.filter(function(item) { return item.category === p.category; });
          }
          const total = list.length;
          list = paginate(list, p.page, p.size);
          resolve({ list: list, total: total });
        }, 200);
      });
    });
  },
  detail(id) {
    return apiRequest('/shares/' + id, 'GET', null, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          const item = MockDB.shares.find(function(s) { return s.id === id; });
          resolve(item || MockDB.shares[0]);
        }, 150);
      });
    });
  },
  publish(params) {
    return apiRequest('/shares', 'POST', params, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          const newItem = {
            id: 'sh_' + Date.now(),
            name: params.name || '',
            category: params.category || '其他',
            condition: params.condition || '八成新',
            description: params.description || '',
            is_free: params.is_free !== undefined ? params.is_free : true,
            price: params.price || 0,
            image: params.image || '📦',
            owner: '当前用户',
            ownerPhone: '138****0000',
            available: true,
            views: 0,
            borrow_count: 0,
            created_at: new Date().toLocaleDateString('zh-CN')
          };
          MockDB.shares.unshift(newItem);
          resolve({ success: true, id: newItem.id });
        }, 300);
      });
    });
  },
  borrow(id) {
    return apiRequest('/shares/' + id + '/borrow', 'POST', null, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          const item = MockDB.shares.find(function(s) { return s.id === id; });
          if (item) item.available = false;
          resolve({ success: true, message: '借用申请已发送，请联系发布者' });
        }, 200);
      });
    });
  },
  return(id) {
    return apiRequest('/shares/' + id + '/return', 'POST', null, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          const item = MockDB.shares.find(function(s) { return s.id === id; });
          if (item) item.available = true;
          resolve({ success: true, message: '物品已归还，感谢使用' });
        }, 200);
      });
    });
  },
  edit(id, params) {
    return apiRequest('/shares/' + id, 'PUT', params, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          const item = MockDB.shares.find(function(s) { return s.id === id; });
          if (item) {
            if (params.name !== undefined) item.name = params.name;
            if (params.condition !== undefined) item.condition = params.condition;
            if (params.description !== undefined) item.description = params.description;
            if (params.is_free !== undefined) item.is_free = params.is_free;
            if (params.price !== undefined) item.price = params.price;
            if (params.image !== undefined) item.image = params.image;
            if (params.category !== undefined) item.category = params.category;
          }
          resolve({ success: true, message: '修改成功' });
        }, 250);
      });
    });
  },
  takeOff(id) {
    return apiRequest('/shares/' + id + '/takeoff', 'POST', null, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          const item = MockDB.shares.find(function(s) { return s.id === id; });
          if (item) { item.status = 'off'; item.available = false; }
          resolve({ success: true, message: '物品已下架' });
        }, 200);
      });
    });
  },
  relist(id) {
    return apiRequest('/shares/' + id + '/relist', 'POST', null, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          const item = MockDB.shares.find(function(s) { return s.id === id; });
          if (item) { item.status = 'on'; item.available = true; }
          resolve({ success: true, message: '物品已重新上架' });
        }, 200);
      });
    });
  },
  deleteItem(id) {
    return apiRequest('/shares/' + id, 'DELETE', null, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          const idx = MockDB.shares.findIndex(function(s) { return s.id === id; });
          if (idx >= 0) MockDB.shares.splice(idx, 1);
          resolve({ success: true, message: '已删除' });
        }, 200);
      });
    });
  },
  myPublished() {
    return apiRequest('/shares/my/published', 'GET', null, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          const list = MockDB.shares.filter(function(s) { return s.id === 'sh001' || s.id === 'sh003' || s.id === 'sh008' || s.id === 'sh012'; });
          resolve({ list: list, total: list.length });
        }, 200);
      });
    });
  },
  myBorrowed() {
    return apiRequest('/shares/my/borrowed', 'GET', null, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          const list = MockDB.shares.slice(4, 7).map(function(item) {
            return {
              ...item,
              borrow_time: '2025-06-15',
              expected_return: '2025-06-22'
            };
          });
          resolve({ list: list, total: list.length });
        }, 200);
      });
    });
  }
};

// ========== ForumAPI（社区论坛）==========
window.ForumAPI = {
  list(params) {
    return apiRequest('/forum/posts', 'GET', params, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          const p = params || {};
          let list = [...MockDB.forumPosts];
          if (p.category && p.category !== '全部') {
            list = list.filter(function(item) { return item.category === p.category; });
          }
          if (p.keyword) {
            const kw = String(p.keyword).toLowerCase();
            list = list.filter(function(item) {
              return (item.title || '').toLowerCase().indexOf(kw) !== -1 ||
                     (item.content || '').toLowerCase().indexOf(kw) !== -1 ||
                     (item.author || '').toLowerCase().indexOf(kw) !== -1;
            });
          }
          list.sort(function(a, b) { return (b.isHot ? 1 : 0) - (a.isHot ? 1 : 0) || new Date(b.created_at) - new Date(a.created_at); });
          const total = list.length;
          list = paginate(list, p.page, p.size);
          resolve({ list: list, total: total });
        }, 200);
      });
    });
  },
  getCategories() {
    return apiRequest('/forum/categories', 'GET', null, function() {
      return new Promise(function(resolve) {
        setTimeout(function() { resolve({ list: MockDB.forumCategories }); }, 100);
      });
    });
  },
  detail(id) {
    return apiRequest('/forum/posts/' + id, 'GET', null, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          const post = MockDB.forumPosts.find(function(p) { return p.id === id; });
          if (post) post.views = (post.views || 0) + 1;
          resolve(post || null);
        }, 150);
      });
    });
  },
  create(params) {
    return apiRequest('/forum/posts', 'POST', params, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          const newPost = {
            id: 'fp_' + Date.now(),
            title: params.title || '',
            content: params.content || '',
            author: params.author || '当前用户',
            authorPhone: params.authorPhone || '',
            category: params.category || '生活分享',
            likes: 0, liked: false,
            favorites: 0, favorited: false,
            comments: 0, views: 1,
            created_at: new Date().toLocaleString('zh-CN', { hour12: false }),
            images: params.images || [],
            isHot: false
          };
          MockDB.forumPosts.unshift(newPost);
          resolve({ success: true, id: newPost.id, message: '发布成功' });
        }, 300);
      });
    });
  },
  like(id) {
    return apiRequest('/forum/posts/' + id + '/like', 'POST', null, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          const post = MockDB.forumPosts.find(function(p) { return p.id === id; });
          if (post) {
            post.liked = !post.liked;
            post.likes += post.liked ? 1 : -1;
            if (post.likes < 0) post.likes = 0;
          }
          resolve({ success: true, liked: post ? post.liked : false, likes: post ? post.likes : 0 });
        }, 150);
      });
    });
  },
  favorite(id) {
    return apiRequest('/forum/posts/' + id + '/favorite', 'POST', null, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          const post = MockDB.forumPosts.find(function(p) { return p.id === id; });
          if (post) {
            post.favorited = !post.favorited;
            post.favorites += post.favorited ? 1 : -1;
            if (post.favorites < 0) post.favorites = 0;
          }
          resolve({ success: true, favorited: post ? post.favorited : false, favorites: post ? post.favorites : 0 });
        }, 150);
      });
    });
  },
  comment(id, content) {
    return apiRequest('/forum/posts/' + id + '/comments', 'POST', { content: content }, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          const post = MockDB.forumPosts.find(function(p) { return p.id === id; });
          if (post) post.comments = (post.comments || 0) + 1;
          const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
          const newComment = {
            id: 'fc_' + Date.now(),
            postId: id,
            author: user ? (user.building ? user.building + ' ' + user.name : user.name) : '当前用户',
            authorPhone: user ? user.phone : '',
            content: content,
            created_at: new Date().toLocaleString('zh-CN', { hour12: false }),
            likes: 0
          };
          MockDB.forumComments.push(newComment);
          resolve({ success: true, message: '评论成功' });
        }, 200);
      });
    });
  },
  deletePost(id) {
    return apiRequest('/forum/posts/' + id, 'DELETE', null, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          const idx = MockDB.forumPosts.findIndex(function(p) { return p.id === id; });
          if (idx >= 0) MockDB.forumPosts.splice(idx, 1);
          resolve({ success: true, message: '删除成功' });
        }, 200);
      });
    });
  },
  getComments(postId) {
    return apiRequest('/forum/posts/' + postId + '/comments', 'GET', null, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          let list = MockDB.forumComments.filter(function(c) { return c.postId === postId; });
          list.sort(function(a, b) { return new Date(b.created_at) - new Date(a.created_at); });
          resolve({ list: list, total: list.length });
        }, 150);
      });
    });
  },
  getMyLikedPosts() {
    return apiRequest('/forum/mine/liked', 'GET', null, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          const list = MockDB.forumPosts.filter(function(p) { return p.liked === true; });
          resolve({ list: list, total: list.length });
        }, 150);
      });
    });
  },
  getMyFavoritedPosts() {
    return apiRequest('/forum/mine/favorited', 'GET', null, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          const list = MockDB.forumPosts.filter(function(p) { return p.favorited === true; });
          resolve({ list: list, total: list.length });
        }, 150);
      });
    });
  },
  getMyComments() {
    return apiRequest('/forum/mine/comments', 'GET', null, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
          const userName = user ? user.name : '';
          const userBuilding = user ? user.building : '';
          const fullName = userBuilding && userName ? userBuilding + ' ' + userName : (userName || '当前用户');
          const list = MockDB.forumComments
            .filter(function(c) { return c.author === userName || c.author === fullName; })
            .map(function(c) {
              const post = MockDB.forumPosts.find(function(p) { return p.id === c.postId; });
              const result = {
                id: c.id,
                postId: c.postId,
                author: c.author,
                authorPhone: c.authorPhone,
                content: c.content,
                created_at: c.created_at,
                likes: c.likes,
                postTitle: post ? post.title : ''
              };
              return result;
            });
          list.sort(function(a, b) { return new Date(b.created_at) - new Date(a.created_at); });
          resolve({ list: list, total: list.length });
        }, 150);
      });
    });
  },
  getRepliesReceived() {
    return apiRequest('/forum/mine/replies', 'GET', null, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
          const userName = user ? user.name : '';
          const userBuilding = user ? user.building : '';
          const fullName = userBuilding && userName ? userBuilding + ' ' + userName : (userName || '当前用户');
          const myPosts = MockDB.forumPosts.filter(function(p) {
            return p.author === userName || p.author === fullName || (userName && p.author && p.author.indexOf(userName) !== -1);
          });
          const myPostIds = myPosts.map(function(p) { return p.id; });
          const list = MockDB.forumComments
            .filter(function(c) { return myPostIds.indexOf(c.postId) !== -1; })
            .map(function(c) {
              const post = MockDB.forumPosts.find(function(p) { return p.id === c.postId; });
              const result = {
                id: c.id,
                postId: c.postId,
                author: c.author,
                authorPhone: c.authorPhone,
                content: c.content,
                created_at: c.created_at,
                likes: c.likes,
                postTitle: post ? post.title : ''
              };
              return result;
            });
          list.sort(function(a, b) { return new Date(b.created_at) - new Date(a.created_at); });
          resolve({ list: list, total: list.length });
        }, 150);
      });
    });
  }
};

// ========== HelpAPI（邻里互助）==========
window.HelpAPI = {
  getCategories() {
    return apiRequest('/help/categories', 'GET', null, function() {
      return new Promise(function(resolve) {
        setTimeout(function() { resolve({ list: MockDB.helpCategories }); }, 100);
      });
    });
  },
  listByCategory(category) {
    return apiRequest('/help/demands', 'GET', { category: category }, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          const list = MockDB.helpDemands[category] || [];
          const sortedList = [...list].sort(function(a, b) {
            if (a.status === 'open' && b.status !== 'open') return -1;
            if (a.status !== 'open' && b.status === 'open') return 1;
            return new Date(b.created_at) - new Date(a.created_at);
          });
          resolve({ list: sortedList, total: sortedList.length });
        }, 200);
      });
    });
  },
  detail(id) {
    return apiRequest('/help/demands/' + id, 'GET', null, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          let found = null;
          for (const cat in MockDB.helpDemands) {
            const item = MockDB.helpDemands[cat].find(function(d) { return d.id === id; });
            if (item) { found = item; break; }
          }
          if (found) found.views = (found.views || 0) + 1;
          resolve(found || null);
        }, 150);
      });
    });
  },
  create(params) {
    return apiRequest('/help/demands', 'POST', params, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          const newDemand = {
            id: 'hd_' + Date.now(),
            title: params.title || '',
            content: params.content || '',
            publisher: params.publisher || '当前用户',
            phone: params.phone || '',
            time: params.time || '',
            points: params.points || 0,
            status: 'open',
            views: 0,
            accepted_by: null,
            created_at: new Date().toLocaleString('zh-CN', { hour12: false })
          };
          const category = params.category || '取快递';
          if (!MockDB.helpDemands[category]) MockDB.helpDemands[category] = [];
          MockDB.helpDemands[category].unshift(newDemand);
          resolve({ success: true, id: newDemand.id, message: '发布成功' });
        }, 300);
      });
    });
  },
  accept(id, category) {
    return apiRequest('/help/demands/' + id + '/accept', 'POST', null, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          let found = null;
          const cats = category ? [category] : Object.keys(MockDB.helpDemands);
          for (let i = 0; i < cats.length; i++) {
            const item = MockDB.helpDemands[cats[i]].find(function(d) { return d.id === id; });
            if (item) { found = item; break; }
          }
          if (!found) {
            resolve({ success: false, message: '需求不存在' });
            return;
          }
          if (found.status === 'completed') {
            resolve({ success: false, message: '该需求已完成' });
            return;
          }
          if (found.status === 'accepted') {
            resolve({ success: false, message: '该需求已被他人接受' });
            return;
          }
          const user = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
          const currentName = (user && user.name) ? user.name : '热心邻居';
          found.status = 'accepted';
          found.accepted_by = currentName;
          resolve({ success: true, message: '已接受，请注意联系发布者' });
        }, 200);
      });
    });
  },
  complete(id, category) {
    return apiRequest('/help/demands/' + id + '/complete', 'POST', null, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          let found = null;
          const cats = category ? [category] : Object.keys(MockDB.helpDemands);
          for (let i = 0; i < cats.length; i++) {
            const item = MockDB.helpDemands[cats[i]].find(function(d) { return d.id === id; });
            if (item) { found = item; break; }
          }
          if (!found) {
            resolve({ success: false, message: '需求不存在' });
            return;
          }
          if (found.status === 'open') {
            resolve({ success: false, message: '该需求尚未被接受，请先接受' });
            return;
          }
          if (found.status === 'completed') {
            resolve({ success: false, message: '该需求已经完成' });
            return;
          }
          found.status = 'completed';
          resolve({ success: true, message: '已完成' });
        }, 200);
      });
    });
  },
  deleteDemand(id, category) {
    return apiRequest('/help/demands/' + id, 'DELETE', null, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          const cats = category ? [category] : Object.keys(MockDB.helpDemands);
          for (let i = 0; i < cats.length; i++) {
            const idx = MockDB.helpDemands[cats[i]].findIndex(function(d) { return d.id === id; });
            if (idx >= 0) { MockDB.helpDemands[cats[i]].splice(idx, 1); break; }
          }
          resolve({ success: true, message: '删除成功' });
        }, 200);
      });
    });
  }
};

// ========== NoticeAPI ==========
window.NoticeAPI = {
  list(params) {
    return apiRequest('/notices', 'GET', params, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          const p = params || {};
          let list = [...MockDB.notices];
          if (p.category && p.category !== '全部') {
            list = list.filter(function(item) { return item.category === p.category; });
          }
          const total = list.length;
          list = paginate(list, p.page, p.size);
          resolve({ list: list, total: total });
        }, 200);
      });
    });
  },
  detail(id) {
    return apiRequest('/notices/' + id, 'GET', null, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          const notice = MockDB.notices.find(function(n) { return n.id === id; });
          if (notice) notice.is_read = true;
          resolve(notice || MockDB.notices[0]);
        }, 150);
      });
    });
  },
  markRead(id) {
    return apiRequest('/notices/' + id + '/read', 'POST', null, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          const notice = MockDB.notices.find(function(n) { return n.id === id; });
          if (notice) notice.is_read = true;
          resolve({ success: true });
        }, 100);
      });
    });
  }
};

// ========== PointsAPI ==========
window.PointsAPI = {
  getBalance() {
    return apiRequest('/points/balance', 'GET', null, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          const userStr = localStorage.getItem('neighbor_user');
          let balance = 852;
          if (userStr) {
            const user = JSON.parse(userStr);
            balance = user.points || 852;
          }
          let earned = 0;
          let spent = 0;
          MockDB.pointsHistory.forEach(function(item) {
            if (item.change > 0) earned += item.change;
            else spent += Math.abs(item.change);
          });
          resolve({ balance: balance, earned: earned, spent: spent });
        }, 200);
      });
    });
  },
  getHistory() {
    return apiRequest('/points/history', 'GET', null, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          resolve({ list: MockDB.pointsHistory, total: MockDB.pointsHistory.length });
        }, 200);
      });
    });
  },
  getRules() {
    return apiRequest('/points/rules', 'GET', null, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          resolve({ list: MockDB.pointsRules, total: MockDB.pointsRules.length });
        }, 200);
      });
    });
  },
  exchange(goodsId) {
    return apiRequest('/points/exchange', 'POST', { goods_id: goodsId }, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          const goods = MockDB.pointsGoods.find(function(g) { return g.id === goodsId; });
          if (!goods) {
            resolve({ success: false, message: '商品不存在' });
            return;
          }
          const userStr = localStorage.getItem('neighbor_user');
          let user = userStr ? JSON.parse(userStr) : { points: 852 };
          if (user.points < goods.points) {
            resolve({ success: false, message: '积分不足' });
            return;
          }
          user.points -= goods.points;
          localStorage.setItem('neighbor_user', JSON.stringify(user));
          if (goods.stock > 0) goods.stock -= 1;
          resolve({ success: true, remainingPoints: user.points, message: '兑换成功！请前往社区服务中心领取' });
        }, 300);
      });
    });
  },
  getGoods() {
    return apiRequest('/points/goods', 'GET', null, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          resolve({ list: MockDB.pointsGoods, total: MockDB.pointsGoods.length });
        }, 200);
      });
    });
  }
};

// ========== ElderlyAPI ==========
window.ElderlyAPI = {
  list() {
    return apiRequest('/elderly', 'GET', null, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          resolve({ list: MockDB.elderly, total: MockDB.elderly.length });
        }, 200);
      });
    });
  },
  detail(id) {
    return apiRequest('/elderly/' + id, 'GET', null, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          const elder = MockDB.elderly.find(function(e) { return e.id === id; });
          resolve(elder || MockDB.elderly[0]);
        }, 150);
      });
    });
  }
};

// ========== DashboardAPI ==========
window.DashboardAPI = {
  getStats() {
    return apiRequest('/dashboard/stats', 'GET', null, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          const pending = MockDB.workOrders.filter(function(w) { return w.status === '待处理'; }).length;
          const processing = MockDB.workOrders.filter(function(w) { return w.status === '处理中'; }).length;
          const completed = MockDB.workOrders.filter(function(w) { return w.status === '已完成'; }).length;
          const appeals = MockDB.appeals.length;
          const activeAppeals = MockDB.appeals.filter(function(a) { return a.status !== '已完成'; }).length;
          const unreadNotices = MockDB.notices.filter(function(n) { return n.is_read === false; }).length;
          const userStr = localStorage.getItem('neighbor_user');
          let userPoints = 852;
          if (userStr) {
            const user = JSON.parse(userStr);
            userPoints = user.points || 852;
          }
          resolve({
            residents: MockDB.users.length + 1200,
            workOrders: MockDB.workOrders.length,
            processing: processing + pending,
            appeals: appeals,
            active: activeAppeals,
            notices: unreadNotices,
            points: userPoints,
            pending_orders: pending,
            processing_orders: processing,
            completed_orders: completed,
            shares: MockDB.shares.length,
            elderly: MockDB.elderly.length,
            elderly_normal: MockDB.elderly.filter(function(e) { return e.status === '正常'; }).length,
            elderly_warning: MockDB.elderly.filter(function(e) { return e.status === '关注'; }).length,
            elderly_alert: MockDB.elderly.filter(function(e) { return e.status === '预警'; }).length
          });
        }, 300);
      });
    });
  }
};

// ========== ComplaintAPI（投诉与举报） ==========
window.ComplaintAPI = {
  // 获取投诉原因列表
  getReasons(type) {
    return apiRequest('/complaints/reasons', 'GET', { type: type }, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          resolve({ list: MockDB.complaintReasons[type] || [] });
        }, 100);
      });
    });
  },

  // 提交投诉
  submit(data) {
    return apiRequest('/complaints', 'POST', data, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          const now = new Date();
          const dateStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0') + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
          const priorityMap = { '虚假描述': 'high', '违规收费': 'high', '诈骗嫌疑': 'urgent', '非法物品': 'urgent', '失信行为': 'high' };
          const newComplaint = {
            id: 'cp' + Date.now(),
            no: 'TS' + now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0') + String(Math.floor(Math.random() * 9999)).padStart(4, '0'),
            type: data.type,
            target_item_id: data.target_item_id || '',
            target_item_name: data.target_item_name || '',
            target_user_id: data.target_user_id || '',
            target_user_name: data.target_user_name || '',
            reason: data.reason,
            reason_detail: data.reason_detail || '',
            reporter: data.reporter || '当前用户',
            created_at: dateStr,
            status: '待处理',
            priority: priorityMap[data.reason] || 'medium',
            images: data.images || [],
            punishment: null
          };
          MockDB.complaints.unshift(newComplaint);
          resolve({ success: true, id: newComplaint.id, no: newComplaint.no, status: newComplaint.status });
        }, 300);
      });
    });
  },

  // 获取我提交的投诉
  myList(params) {
    return apiRequest('/complaints/my', 'GET', params, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          const list = MockDB.complaints.filter(function(c) { return c.reporter === '当前用户'; });
          resolve({ list: list, total: list.length });
        }, 200);
      });
    });
  },

  // 获取投诉详情
  detail(id) {
    return apiRequest('/complaints/' + id, 'GET', null, function() {
      return new Promise(function(resolve) {
        setTimeout(function() {
          const item = MockDB.complaints.find(function(c) { return c.id === id; });
          resolve(item || null);
        }, 150);
      });
    });
  }
};
