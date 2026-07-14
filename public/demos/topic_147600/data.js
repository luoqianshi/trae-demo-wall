window.__DATA__ = {
  /* ============================================================
   * 用户数据
   * ============================================================ */
  users: [
    { id: 1, username: 'test_owner', real_name: '张三', role: 'owner', phone: '13800001001', building: '3栋', unit: '2单元', room: '501', credit_score: 95, avatar: null },
    { id: 2, username: 'test_staff', real_name: '李四', role: 'staff', phone: '13800001002', building: null, unit: null, room: null, credit_score: 100, avatar: null },
    { id: 3, username: 'test_grid', real_name: '王五', role: 'grid_worker', phone: '13800001003', building: null, unit: null, room: null, credit_score: 100, avatar: null },
    { id: 4, username: 'admin', real_name: '赵六', role: 'admin', phone: '13800001004', building: null, unit: null, room: null, credit_score: 100, avatar: null },
    { id: 5, username: 'sys_admin', real_name: '系统管理员', role: 'sys_admin', phone: '13800001005', building: null, unit: null, room: null, credit_score: 100, avatar: null },
  ],

  /* ============================================================
   * 角色权限定义
   * ============================================================ */
  roles: {
    owner: { label: '业主', menus: ['dashboard', 'work-orders', 'announcements', 'courier', 'materials', 'suggestions', 'chat', 'search', 'messages', 'profile'] },
    staff: { label: '物业人员', menus: ['dashboard', 'work-orders', 'announcements', 'care', 'monitor', 'parking', 'courier', 'materials', 'suggestions', 'chat', 'search', 'messages', 'profile'] },
    grid_worker: { label: '网格员', menus: ['dashboard', 'work-orders', 'announcements', 'care', 'monitor', 'parking', 'courier', 'materials', 'suggestions', 'chat', 'search', 'messages', 'profile'] },
    admin: { label: '管理员', menus: ['dashboard', 'work-orders', 'announcements', 'care', 'monitor', 'parking', 'courier', 'materials', 'suggestions', 'chat', 'users', 'ops-dashboard', 'search', 'messages', 'profile'] },
    sys_admin: { label: '系统管理员', menus: ['dashboard', 'work-orders', 'announcements', 'care', 'monitor', 'parking', 'courier', 'materials', 'suggestions', 'chat', 'users', 'ops-dashboard', 'search', 'messages', 'profile'] },
  },

  /* ============================================================
   * 工单数据 (25条)
   * ============================================================ */
  workOrders: [
    { id: 1, order_no: 'WO20260714-001', title: '厨房水管漏水急需维修', type: 'repair', status: 'submitted', priority: 'urgent', description: '厨房水槽下方水管接头处出现严重漏水，已导致橱柜底部积水，请尽快安排维修人员处理。', location: '3栋2单元501', creator_id: 1, assignee_id: null, created_at: '2026-07-14T08:15:00+08:00', updated_at: '2026-07-14T08:15:00+08:00', satisfaction_score: null, sla_deadline: '2026-07-14T20:15:00+08:00', sla_warned: false, sla_escalated: false },
    { id: 2, order_no: 'WO20260714-002', title: '小区主干道路灯不亮', type: 'repair', status: 'pending', priority: 'high', description: '小区南门至3栋主干道上有三盏路灯不亮，夜间出行存在安全隐患，请尽快安排检修。', location: '小区主干道（南门至3栋段）', creator_id: 1, assignee_id: null, created_at: '2026-07-14T07:30:00+08:00', updated_at: '2026-07-14T07:30:00+08:00', satisfaction_score: null, sla_deadline: '2026-07-15T19:30:00+08:00', sla_warned: false, sla_escalated: false },
    { id: 3, order_no: 'WO20260713-003', title: '3栋电梯运行异响', type: 'repair', status: 'assigned', priority: 'urgent', description: '3栋1号电梯在运行过程中发出异常金属摩擦声，上下行均有异响，请立即安排专业维保人员检查。', location: '3栋1号电梯', creator_id: 1, assignee_id: 2, created_at: '2026-07-13T18:20:00+08:00', updated_at: '2026-07-13T18:45:00+08:00', satisfaction_score: null, sla_deadline: '2026-07-14T06:20:00+08:00', sla_warned: true, sla_escalated: false },
    { id: 4, order_no: 'WO20260713-004', title: '楼道及公共区域卫生清洁', type: 'cleaning', status: 'assigned', priority: 'low', description: '5栋2单元楼道及电梯间地面有污渍，楼梯扶手有积灰，请安排保洁人员进行全面清洁。', location: '5栋2单元', creator_id: 1, assignee_id: 2, created_at: '2026-07-13T10:00:00+08:00', updated_at: '2026-07-13T10:30:00+08:00', satisfaction_score: null, sla_deadline: '2026-07-15T10:00:00+08:00', sla_warned: false, sla_escalated: false },
    { id: 5, order_no: 'WO20260712-005', title: '小区南门门禁系统故障', type: 'security', status: 'in_progress', priority: 'high', description: '南门人行通道门禁刷卡器无反应，显示屏黑屏，影响居民正常出入，已临时开放侧门。', location: '小区南门人行通道', creator_id: 1, assignee_id: 2, created_at: '2026-07-12T14:00:00+08:00', updated_at: '2026-07-12T15:00:00+08:00', satisfaction_score: null, sla_deadline: '2026-07-14T02:00:00+08:00', sla_warned: true, sla_escalated: false },
    { id: 6, order_no: 'WO20260712-006', title: '2栋外墙瓷砖脱落隐患', type: 'repair', status: 'in_progress', priority: 'urgent', description: '2栋东侧外墙5层位置有多块瓷砖松动，存在高空坠物风险，已设置警戒线，需尽快进行排险维修。', location: '2栋东侧外墙', creator_id: 1, assignee_id: 2, created_at: '2026-07-12T09:00:00+08:00', updated_at: '2026-07-12T10:00:00+08:00', satisfaction_score: null, sla_deadline: '2026-07-13T21:00:00+08:00', sla_warned: true, sla_escalated: true },
    { id: 7, order_no: 'WO20260711-007', title: '广场舞噪音扰民投诉', type: 'complaint', status: 'resolved', priority: 'medium', description: '每天晚上7点至9点，小区中心广场有多支广场舞队伍使用高音喇叭，严重影响周边居民休息和学习。', location: '小区中心广场', creator_id: 1, assignee_id: 2, created_at: '2026-07-11T20:30:00+08:00', updated_at: '2026-07-12T16:00:00+08:00', satisfaction_score: 4, sla_deadline: '2026-07-13T20:30:00+08:00', sla_warned: false, sla_escalated: false },
    { id: 8, order_no: 'WO20260711-008', title: '5栋地下车库严重积水', type: 'repair', status: 'resolved', priority: 'high', description: '5栋地下车库B区出现大面积积水，最深约5厘米，怀疑是排水泵故障或管道破裂导致，请尽快排查处理。', location: '5栋地下车库B区', creator_id: 1, assignee_id: 2, created_at: '2026-07-11T08:00:00+08:00', updated_at: '2026-07-11T15:00:00+08:00', satisfaction_score: 5, sla_deadline: '2026-07-12T08:00:00+08:00', sla_warned: false, sla_escalated: false },
    { id: 9, order_no: 'WO20260710-009', title: '绿化带定期修剪建议', type: 'suggestion', status: 'closed', priority: 'low', description: '建议物业定期修剪小区绿化带的灌木和草坪，目前部分区域杂草丛生，影响小区整体美观度。', location: '小区全域绿化带', creator_id: 1, assignee_id: 2, created_at: '2026-07-10T09:00:00+08:00', updated_at: '2026-07-12T10:00:00+08:00', satisfaction_score: 5, sla_deadline: '2026-07-14T09:00:00+08:00', sla_warned: false, sla_escalated: false },
    { id: 10, order_no: 'WO20260710-010', title: '快递柜屏幕显示异常', type: 'repair', status: 'closed', priority: 'medium', description: '小区北门丰巢快递柜中间一组屏幕闪烁，无法正常显示取件码，影响居民取件。', location: '小区北门快递柜', creator_id: 1, assignee_id: 2, created_at: '2026-07-10T11:00:00+08:00', updated_at: '2026-07-11T14:00:00+08:00', satisfaction_score: 3, sla_deadline: '2026-07-12T23:00:00+08:00', sla_warned: false, sla_escalated: false },
    { id: 11, order_no: 'WO20260709-011', title: '小区内宠物不牵绳问题', type: 'complaint', status: 'rejected', priority: 'medium', description: '多次发现小区内有人遛狗不牵绳，特别是大型犬只，对老人和儿童造成安全隐患，要求物业加强管理。', location: '小区公共区域', creator_id: 1, assignee_id: null, created_at: '2026-07-09T19:00:00+08:00', updated_at: '2026-07-10T09:00:00+08:00', satisfaction_score: null, sla_deadline: '2026-07-11T19:00:00+08:00', sla_warned: false, sla_escalated: false },
    { id: 12, order_no: 'WO20260709-012', title: '电梯广告屏声音过大', type: 'complaint', status: 'escalated', priority: 'low', description: '3栋电梯内广告屏音量过大，早晚高峰期尤其刺耳，已多次反映但未改善，请求上级协调处理。', location: '3栋电梯', creator_id: 1, assignee_id: null, created_at: '2026-07-09T08:00:00+08:00', updated_at: '2026-07-10T14:00:00+08:00', satisfaction_score: null, sla_deadline: '2026-07-14T08:00:00+08:00', sla_warned: true, sla_escalated: true },
    { id: 13, order_no: 'WO20260708-013', title: '消防通道长期被车辆占用', type: 'security', status: 'escalated', priority: 'urgent', description: '6栋消防通道入口长期被私家车占用，多次劝阻无效，存在严重消防安全隐患，需紧急处理并上报。', location: '6栋消防通道', creator_id: 1, assignee_id: null, created_at: '2026-07-08T16:00:00+08:00', updated_at: '2026-07-09T10:00:00+08:00', satisfaction_score: null, sla_deadline: '2026-07-09T04:00:00+08:00', sla_warned: true, sla_escalated: true },
    { id: 14, order_no: 'WO20260708-014', title: '建议增设快递驿站', type: 'suggestion', status: 'resolved', priority: 'medium', description: '目前小区快递柜数量不足，大件快递和生鲜配送经常无法存放，建议在小区内增设一处便民快递驿站。', location: '小区北门附近', creator_id: 1, assignee_id: 2, created_at: '2026-07-08T10:00:00+08:00', updated_at: '2026-07-12T09:00:00+08:00', satisfaction_score: 4, sla_deadline: '2026-07-15T10:00:00+08:00', sla_warned: false, sla_escalated: false },
    { id: 15, order_no: 'WO20260707-015', title: '7栋门禁卡批量失效', type: 'security', status: 'assigned', priority: 'high', description: '7栋多位业主反映门禁卡突然无法使用，刷卡无反应，怀疑系统故障或数据库异常，请尽快排查。', location: '7栋门禁系统', creator_id: 1, assignee_id: 2, created_at: '2026-07-07T07:00:00+08:00', updated_at: '2026-07-07T08:00:00+08:00', satisfaction_score: null, sla_deadline: '2026-07-08T19:00:00+08:00', sla_warned: true, sla_escalated: false },
    { id: 16, order_no: 'WO20260707-016', title: '小区景观水池漂浮物清理', type: 'cleaning', status: 'in_progress', priority: 'low', description: '中心景观水池水面漂浮大量落叶和白色垃圾，水质浑浊，影响小区景观形象，请安排保洁清理并定期维护。', location: '小区中心景观水池', creator_id: 1, assignee_id: 2, created_at: '2026-07-07T13:00:00+08:00', updated_at: '2026-07-08T09:00:00+08:00', satisfaction_score: null, sla_deadline: '2026-07-14T13:00:00+08:00', sla_warned: false, sla_escalated: false },
    { id: 17, order_no: 'WO20260706-017', title: '地下车库照明不足', type: 'repair', status: 'pending', priority: 'medium', description: '地下车库C区照明灯管损坏较多，区域昏暗，停车和行走存在安全隐患，请尽快更换损坏灯管。', location: '地下车库C区', creator_id: 1, assignee_id: null, created_at: '2026-07-06T18:00:00+08:00', updated_at: '2026-07-06T18:00:00+08:00', satisfaction_score: null, sla_deadline: '2026-07-14T18:00:00+08:00', sla_warned: false, sla_escalated: false },
    { id: 18, order_no: 'WO20260706-018', title: '建议增加儿童游乐设施', type: 'suggestion', status: 'resolved', priority: 'low', description: '小区现有儿童游乐设施偏少，滑梯和秋千经常排队，建议在二期空地增设一组儿童组合滑梯和摇摇马。', location: '二期空地', creator_id: 1, assignee_id: 2, created_at: '2026-07-06T15:00:00+08:00', updated_at: '2026-07-13T11:00:00+08:00', satisfaction_score: 5, sla_deadline: '2026-07-20T15:00:00+08:00', sla_warned: false, sla_escalated: false },
    { id: 19, order_no: 'WO20260705-019', title: '3栋2单元电梯停运', type: 'repair', status: 'closed', priority: 'urgent', description: '3栋2单元电梯因故障停运超过8小时，高层住户出行严重不便，特别是老人和行动不便者，请务必尽快抢修。', location: '3栋2单元电梯', creator_id: 1, assignee_id: 2, created_at: '2026-07-05T06:00:00+08:00', updated_at: '2026-07-05T20:00:00+08:00', satisfaction_score: 5, sla_deadline: '2026-07-05T18:00:00+08:00', sla_warned: true, sla_escalated: false },
    { id: 20, order_no: 'WO20260705-020', title: '小区内车辆轻微刮擦事故', type: 'other', status: 'resolved', priority: 'medium', description: '地下车库A区两车发生轻微刮擦，双方车主已到场，需要物业协助调取监控录像并协调处理。', location: '地下车库A区', creator_id: 1, assignee_id: 2, created_at: '2026-07-05T14:00:00+08:00', updated_at: '2026-07-05T17:00:00+08:00', satisfaction_score: 4, sla_deadline: '2026-07-07T14:00:00+08:00', sla_warned: false, sla_escalated: false },
    { id: 21, order_no: 'WO20260704-021', title: '楼道堆放杂物影响通行', type: 'complaint', status: 'assigned', priority: 'medium', description: '4栋1单元6楼楼道长期堆放旧家具和纸箱，占用消防通道，存在安全隐患且影响邻里通行，请物业协调清理。', location: '4栋1单元6楼', creator_id: 1, assignee_id: 2, created_at: '2026-07-04T16:00:00+08:00', updated_at: '2026-07-05T08:00:00+08:00', satisfaction_score: null, sla_deadline: '2026-07-11T16:00:00+08:00', sla_warned: false, sla_escalated: false },
    { id: 22, order_no: 'WO20260704-022', title: '建议优化垃圾分类投放点', type: 'suggestion', status: 'resolved', priority: 'low', description: '部分垃圾分类投放点标识模糊，分类指引不清晰，建议重新制作清晰的分类标识牌，并增加洗手池方便居民使用。', location: '小区各垃圾投放点', creator_id: 1, assignee_id: 2, created_at: '2026-07-04T09:00:00+08:00', updated_at: '2026-07-10T15:00:00+08:00', satisfaction_score: 5, sla_deadline: '2026-07-18T09:00:00+08:00', sla_warned: false, sla_escalated: false },
    { id: 23, order_no: 'WO20260703-023', title: '小区围墙铁栅栏大面积生锈', type: 'repair', status: 'pending', priority: 'low', description: '小区东侧围墙铁栅栏多处生锈腐蚀，部分焊接点已松动，影响安全性和美观，建议进行除锈刷漆和加固处理。', location: '小区东侧围墙', creator_id: 1, assignee_id: null, created_at: '2026-07-03T11:00:00+08:00', updated_at: '2026-07-03T11:00:00+08:00', satisfaction_score: null, sla_deadline: '2026-07-17T11:00:00+08:00', sla_warned: false, sla_escalated: false },
    { id: 24, order_no: 'WO20260703-024', title: '公共区域防疫消毒', type: 'cleaning', status: 'in_progress', priority: 'medium', description: '按照社区要求，需对小区公共区域（电梯、楼道、活动室）进行定期消毒，请安排人员执行并做好消毒记录。', location: '小区公共区域', creator_id: 2, assignee_id: 2, created_at: '2026-07-03T08:00:00+08:00', updated_at: '2026-07-03T08:30:00+08:00', satisfaction_score: null, sla_deadline: '2026-07-15T08:00:00+08:00', sla_warned: false, sla_escalated: false },
    { id: 25, order_no: 'WO20260702-025', title: '社区活动室空调维修', type: 'repair', status: 'submitted', priority: 'medium', description: '社区活动室立式空调不制冷，夏季高温影响老年活动开展，请尽快安排维修或更换。', location: '社区活动室', creator_id: 1, assignee_id: null, created_at: '2026-07-02T14:00:00+08:00', updated_at: '2026-07-02T14:00:00+08:00', satisfaction_score: null, sla_deadline: '2026-07-09T14:00:00+08:00', sla_warned: true, sla_escalated: false },
  ],

  /* ============================================================
   * 公告数据 (8条)
   * ============================================================ */
  announcements: [
    { id: 1, title: '关于小区夏季用电安全的重要通知', type: 'urgent', content: '尊敬的各位业主：近期持续高温天气，小区用电负荷大幅增加。为确保用电安全，请各位业主注意以下事项：一、请勿同时使用多台大功率电器；二、定期检查家中电线及插座是否老化；三、离开房间时请关闭不必要的电器设备；四、发现线路异常发热或异味请立即联系物业。物业将安排电工对公共区域线路进行全面检修，感谢您的配合与理解！', is_pinned: true, is_important: true, read_count: 215, publish_at: '2026-07-14T09:00:00+08:00', publisher_id: 4 },
    { id: 2, title: '小区第七届业主联谊运动会报名通知', type: 'activity', content: '为丰富小区居民文化生活，增进邻里感情，兹定于2026年7月20日上午8:30在小区中心广场举办第七届业主联谊运动会。活动项目包括：乒乓球、羽毛球、拔河、家庭趣味接力赛等。欢迎各年龄段业主踊跃报名参加！报名方式：请至物业服务中心前台登记，或通过智邻物业小程序在线报名。报名截止日期：2026年7月18日。奖品丰厚，期待您的参与！', is_pinned: false, is_important: false, read_count: 148, publish_at: '2026-07-13T10:00:00+08:00', publisher_id: 2 },
    { id: 3, title: '关于7月15日停水检修的紧急通知', type: 'urgent', content: '接自来水公司通知，因市政供水管道检修需要，本小区将于2026年7月15日（星期三）上午8:00至下午18:00暂停供水。请各位业主提前做好储水准备，由此带来的不便敬请谅解。停水期间，物业将在每栋楼一层设置临时取水点。如有特殊需求，请提前联系物业服务中心（电话：13800001002）。维修结束后可能出现短暂水质浑浊现象，建议放水片刻后再使用。', is_pinned: true, is_important: true, read_count: 287, publish_at: '2026-07-12T08:00:00+08:00', publisher_id: 4 },
    { id: 4, title: '2026年第三季度物业费缴纳提醒', type: 'notice', content: '尊敬的各位业主：2026年第三季度（7月-9月）物业费已开始收缴，请各位业主于2026年7月31日前完成缴纳。缴费方式：一、通过智邻物业小程序在线缴费；二、前往物业服务中心刷卡或现金缴费；三、银行转账至物业对公账户。按时缴纳物业费的业主可享受信用积分奖励。如对账单有疑问，请致电物业服务中心或通过小程序查询明细。感谢您对物业工作的支持！', is_pinned: false, is_important: true, read_count: 312, publish_at: '2026-07-10T09:00:00+08:00', publisher_id: 2 },
    { id: 5, title: '小区绿化喷洒农药安全提示', type: 'notice', content: '各位业主：为防治小区绿化植物病虫害，物业将于2026年7月16日至7月18日对小区内所有绿化区域进行农药喷洒作业。在此期间，请各位业主注意：一、请勿让儿童及宠物进入绿化区域；二、低层住户请关闭面向绿化带的门窗；三、请勿采摘绿化带内的植物或果实；四、晾晒衣物的业主请在此期间将衣物收回室内。喷洒作业完成后物业将张贴安全解除通知。给您带来不便，敬请谅解！', is_pinned: false, is_important: false, read_count: 178, publish_at: '2026-07-09T15:00:00+08:00', publisher_id: 2 },
    { id: 6, title: '关于小区消防演练的通知', type: 'activity', content: '为增强小区居民消防安全意识，提高火灾应急处置能力，物业定于2026年7月22日（星期三）下午14:00在小区中心广场举行消防演练活动。届时将进行消防知识讲解、灭火器实操演练、模拟火灾逃生演练等环节。请各楼栋业主代表务必参加，同时欢迎广大业主积极参与。演练期间将有消防警报声和模拟烟雾，请勿惊慌。演练结束后将发放家庭消防应急包，数量有限，先到先得！', is_pinned: false, is_important: true, read_count: 203, publish_at: '2026-07-08T11:00:00+08:00', publisher_id: 4 },
    { id: 7, title: '小区地下车库车位抽签分配结果公示', type: 'notice', content: '各位业主：2026年下半年地下车库固定车位抽签分配工作已结束，现将结果公示如下：本次共释放固定车位32个，参与抽签业主共计87户。中签结果已张贴于各楼栋公告栏及物业服务中心门口，也可通过智邻物业小程序查询个人中签情况。中签业主请于2026年7月25日前携带身份证和房产证至物业服务中心办理签约手续，逾期未办理视为自动放弃。如有异议请在公示期内提出。', is_pinned: false, is_important: false, read_count: 256, publish_at: '2026-07-07T10:00:00+08:00', publisher_id: 2 },
    { id: 8, title: '暑期儿童安全防范温馨提示', type: 'notice', content: '各位家长：暑期已至，为了确保小区儿童度过一个安全、快乐的假期，物业特此提醒：一、请勿让儿童独自在电梯内玩耍，谨防夹伤；二、请勿让儿童攀爬小区围墙、树木及健身器材；三、请勿让儿童在车库出入口及车辆通道附近玩耍；四、禁止儿童在景观水池玩水，谨防溺水；五、请教育孩子不随意给陌生人开门。物业将加强巡逻，同时也请家长履行好监护责任，共同守护孩子的安全！', is_pinned: false, is_important: true, read_count: 189, publish_at: '2026-07-05T14:00:00+08:00', publisher_id: 4 },
  ],

  /* ============================================================
   * 关怀记录 (6条)
   * ============================================================ */
  careRecords: [
    { id: 1, care_type: '上门走访', resident_name: '刘奶奶', resident_address: '1栋1单元102', notes: '独居老人，子女在外地工作。本次走访了解其近期身体状况良好，血压正常，已帮助检查家中燃气和电器安全。老人反映最近天气炎热，胃口不好，已建议多食用清淡易消化食物，并留下物业24小时紧急联系电话。', is_completed: true, scheduled_at: '2026-07-14T09:00:00+08:00', completed_at: '2026-07-14T10:30:00+08:00', staff_id: 2 },
    { id: 2, care_type: '电话问候', resident_name: '王大爷', resident_address: '2栋3单元401', notes: '王大爷为高龄空巢老人，听力略有下降。本次电话问候确认其身体状况稳定，已提醒近期高温注意防暑，家中常备防暑药品。王大爷表示感谢物业关心，暂无特殊需求。', is_completed: true, scheduled_at: '2026-07-13T10:00:00+08:00', completed_at: '2026-07-13T10:15:00+08:00', staff_id: 2 },
    { id: 3, care_type: '健康检查', resident_name: '陈阿姨', resident_address: '5栋2单元303', notes: '陈阿姨患有高血压和糖尿病，本次由社区卫生服务站医生陪同上门进行常规健康检查。血压135/85mmHg，空腹血糖6.8mmol/L，均在可控范围内。已嘱咐按时服药，注意饮食控制，下周再行复查。', is_completed: true, scheduled_at: '2026-07-12T14:00:00+08:00', completed_at: '2026-07-12T15:00:00+08:00', staff_id: 3 },
    { id: 4, care_type: '生活帮扶', resident_name: '赵爷爷', resident_address: '4栋1单元502', notes: '赵爷爷为独居且行动不便老人，需定期帮助采购生活物资。本次已代为购买大米、食用油、蔬菜及常用药品，并帮助整理房间、打扫卫生。赵爷爷近期精神状态良好，对物业帮扶表示感谢。', is_completed: true, scheduled_at: '2026-07-11T08:00:00+08:00', completed_at: '2026-07-11T09:30:00+08:00', staff_id: 2 },
    { id: 5, care_type: '紧急关怀', resident_name: '周奶奶', resident_address: '3栋2单元201', notes: '接到邻居反映周奶奶家中连续两天未见外出，物业立即上门查看。发现老人因感冒发烧卧床，已协助联系其子女并拨打120送医。经医院检查为普通感冒，现已回家休养。物业将持续关注其恢复情况，每日上门查看一次。', is_completed: true, scheduled_at: '2026-07-10T09:00:00+08:00', completed_at: '2026-07-10T11:00:00+08:00', staff_id: 3 },
    { id: 6, care_type: '上门走访', resident_name: '孙阿姨', resident_address: '6栋2单元604', notes: '孙阿姨近期刚做过腿部手术，行动不便，子女白天上班无人照料。本次走访了解其恢复情况良好，已帮助取快递、倒垃圾，并确认轮椅通道畅通。计划每周上门走访两次，直到其完全康复。', is_completed: false, scheduled_at: '2026-07-15T09:00:00+08:00', completed_at: null, staff_id: 2 },
  ],

  /* ============================================================
   * 监控设备 (8个)
   * ============================================================ */
  monitorDevices: [
    { id: 1, device_code: 'CAM-N-001', device_name: '南门入口高清摄像头', type: '视频监控', location: '小区南门', ip_address: '192.168.1.101', stream_url: 'rtsp://192.168.1.101:554/stream1', status: 'online', last_heartbeat: '2026-07-14T08:00:00+08:00' },
    { id: 2, device_code: 'CAM-E-002', device_name: '东侧围墙红外摄像头', type: '视频监控', location: '小区东侧围墙', ip_address: '192.168.1.102', stream_url: 'rtsp://192.168.1.102:554/stream1', status: 'online', last_heartbeat: '2026-07-14T08:00:00+08:00' },
    { id: 3, device_code: 'ACC-S-001', device_name: '南门人行通道门禁', type: '门禁', location: '小区南门人行通道', ip_address: '192.168.1.201', stream_url: null, status: 'offline', last_heartbeat: '2026-07-12T14:30:00+08:00' },
    { id: 4, device_code: 'ACC-N-002', device_name: '北门车辆道闸门禁', type: '门禁', location: '小区北门车辆出入口', ip_address: '192.168.1.202', stream_url: null, status: 'online', last_heartbeat: '2026-07-14T08:00:00+08:00' },
    { id: 5, device_code: 'ALM-F-001', device_name: '3栋消防报警控制器', type: '报警', location: '3栋消防控制室', ip_address: '192.168.1.301', stream_url: null, status: 'online', last_heartbeat: '2026-07-14T08:00:00+08:00' },
    { id: 6, device_code: 'ALM-G-002', device_name: '地下车库烟感报警系统', type: '报警', location: '地下车库', ip_address: '192.168.1.302', stream_url: null, status: 'online', last_heartbeat: '2026-07-14T07:55:00+08:00' },
    { id: 7, device_code: 'GAT-E-001', device_name: '东侧行人通道闸机', type: '闸机', location: '小区东侧人行通道', ip_address: '192.168.1.401', stream_url: null, status: 'offline', last_heartbeat: '2026-07-10T18:00:00+08:00' },
    { id: 8, device_code: 'TAL-M-001', device_name: '物业管理中心对讲主机', type: '对讲', location: '物业服务中心', ip_address: '192.168.1.501', stream_url: null, status: 'online', last_heartbeat: '2026-07-14T08:00:00+08:00' },
  ],

  /* ============================================================
   * 监控告警 (5条)
   * ============================================================ */
  monitorAlerts: [
    { id: 1, device_id: 3, device_name: '南门人行通道门禁', alert_type: 'device_offline', severity: 'high', message: '设备离线超过24小时，请检查网络连接和设备电源', is_resolved: false, created_at: '2026-07-12T14:35:00+08:00' },
    { id: 2, device_id: 7, device_name: '东侧行人通道闸机', alert_type: 'device_offline', severity: 'medium', message: '设备离线超过72小时，可能为硬件故障，请安排现场检修', is_resolved: false, created_at: '2026-07-10T18:05:00+08:00' },
    { id: 3, device_id: 5, device_name: '3栋消防报警控制器', alert_type: 'low_battery', severity: 'low', message: '备用电池电量低于20%，请及时更换以确保应急供电', is_resolved: false, created_at: '2026-07-13T09:00:00+08:00' },
    { id: 4, device_id: 1, device_name: '南门入口高清摄像头', alert_type: 'storage_warning', severity: 'low', message: '视频存储空间不足10%，请清理历史录像或扩展存储', is_resolved: false, created_at: '2026-07-14T06:00:00+08:00' },
    { id: 5, device_id: 6, device_name: '地下车库烟感报警系统', alert_type: 'false_alarm', severity: 'critical', message: 'B区烟感探测器触发报警，经现场确认为施工扬尘误报，已复位', is_resolved: true, created_at: '2026-07-11T15:30:00+08:00', resolved_at: '2026-07-11T16:00:00+08:00' },
  ],

  /* ============================================================
   * 车位数据 (20个)
   * ============================================================ */
  parkingSpaces: [
    { id: 1, space_number: 'A-001', area: 'A区-地面', type: 'standard', status: 'occupied', vehicle_plate: '京A12345', monthly_fee: 150, occupant_name: '张三', occupant_phone: '13800001001' },
    { id: 2, space_number: 'A-002', area: 'A区-地面', type: 'standard', status: 'available', vehicle_plate: null, monthly_fee: 150, occupant_name: null, occupant_phone: null },
    { id: 3, space_number: 'A-003', area: 'A区-地面', type: 'electric', status: 'occupied', vehicle_plate: '京B67890', monthly_fee: 200, occupant_name: '李明', occupant_phone: '13800002001' },
    { id: 4, space_number: 'A-004', area: 'A区-地面', type: 'disabled', status: 'occupied', vehicle_plate: '京C11111', monthly_fee: 0, occupant_name: '王强', occupant_phone: '13800002002' },
    { id: 5, space_number: 'A-005', area: 'A区-地面', type: 'standard', status: 'maintenance', vehicle_plate: null, monthly_fee: 150, occupant_name: null, occupant_phone: null },
    { id: 6, space_number: 'A-006', area: 'A区-地面', type: 'standard', status: 'available', vehicle_plate: null, monthly_fee: 150, occupant_name: null, occupant_phone: null },
    { id: 7, space_number: 'A-007', area: 'A区-地面', type: 'standard', status: 'reserved', vehicle_plate: null, monthly_fee: 150, occupant_name: '刘芳', occupant_phone: '13800002003' },
    { id: 8, space_number: 'B-001', area: 'B区-地下', type: 'standard', status: 'occupied', vehicle_plate: '京D22222', monthly_fee: 300, occupant_name: '陈伟', occupant_phone: '13800002004' },
    { id: 9, space_number: 'B-002', area: 'B区-地下', type: 'standard', status: 'occupied', vehicle_plate: '京E33333', monthly_fee: 300, occupant_name: '赵丽', occupant_phone: '13800002005' },
    { id: 10, space_number: 'B-003', area: 'B区-地下', type: 'electric', status: 'occupied', vehicle_plate: '京F44444', monthly_fee: 350, occupant_name: '孙磊', occupant_phone: '13800002006' },
    { id: 11, space_number: 'B-004', area: 'B区-地下', type: 'standard', status: 'available', vehicle_plate: null, monthly_fee: 300, occupant_name: null, occupant_phone: null },
    { id: 12, space_number: 'B-005', area: 'B区-地下', type: 'standard', status: 'available', vehicle_plate: null, monthly_fee: 300, occupant_name: null, occupant_phone: null },
    { id: 13, space_number: 'B-006', area: 'B区-地下', type: 'disabled', status: 'occupied', vehicle_plate: '京G55555', monthly_fee: 0, occupant_name: '周杰', occupant_phone: '13800002007' },
    { id: 14, space_number: 'B-007', area: 'B区-地下', type: 'standard', status: 'maintenance', vehicle_plate: null, monthly_fee: 300, occupant_name: null, occupant_phone: null },
    { id: 15, space_number: 'C-001', area: 'C区-地面', type: 'standard', status: 'occupied', vehicle_plate: '京H66666', monthly_fee: 150, occupant_name: '吴敏', occupant_phone: '13800002008' },
    { id: 16, space_number: 'C-002', area: 'C区-地面', type: 'standard', status: 'available', vehicle_plate: null, monthly_fee: 150, occupant_name: null, occupant_phone: null },
    { id: 17, space_number: 'C-003', area: 'C区-地面', type: 'standard', status: 'available', vehicle_plate: null, monthly_fee: 150, occupant_name: null, occupant_phone: null },
    { id: 18, space_number: 'C-004', area: 'C区-地面', type: 'electric', status: 'occupied', vehicle_plate: '京I77777', monthly_fee: 200, occupant_name: '郑涛', occupant_phone: '13800002009' },
    { id: 19, space_number: 'C-005', area: 'C区-地面', type: 'standard', status: 'reserved', vehicle_plate: null, monthly_fee: 150, occupant_name: '黄丽', occupant_phone: '13800002010' },
    { id: 20, space_number: 'C-006', area: 'C区-地面', type: 'standard', status: 'available', vehicle_plate: null, monthly_fee: 150, occupant_name: null, occupant_phone: null },
  ],

  /* ============================================================
   * 快递任务 (8条)
   * ============================================================ */
  courierTasks: [
    { id: 1, courier_company: '顺丰速运', tracking_no: 'SF1234567890', recipient_name: '张三', recipient_address: '3栋2单元501', pickup_location: '小区北门快递柜A组', delivery_address: '3栋2单元501', status: 'delivered', expected_time: '2026-07-14T10:00:00+08:00', delivered_at: '2026-07-14T09:45:00+08:00', courier_phone: '13800003001' },
    { id: 2, courier_company: '圆通速递', tracking_no: 'YT9876543210', recipient_name: '李明', recipient_address: '1栋3单元202', pickup_location: '小区北门快递柜A组', delivery_address: '1栋3单元202', status: 'delivering', expected_time: '2026-07-14T11:00:00+08:00', delivered_at: null, courier_phone: '13800003002' },
    { id: 3, courier_company: '中通快递', tracking_no: 'ZT5678901234', recipient_name: '王强', recipient_address: '2栋1单元403', pickup_location: '小区北门快递柜B组', delivery_address: '2栋1单元403', status: 'picked_up', expected_time: '2026-07-14T14:00:00+08:00', delivered_at: null, courier_phone: '13800003003' },
    { id: 4, courier_company: '韵达快递', tracking_no: 'YD3456789012', recipient_name: '刘芳', recipient_address: '5栋2单元301', pickup_location: '小区北门快递柜B组', delivery_address: '5栋2单元301', status: 'pending', expected_time: '2026-07-14T16:00:00+08:00', delivered_at: null, courier_phone: '13800003004' },
    { id: 5, courier_company: '京东物流', tracking_no: 'JD2345678901', recipient_name: '赵丽', recipient_address: '6栋1单元102', pickup_location: '小区北门快递柜C组', delivery_address: '6栋1单元102', status: 'assigned', expected_time: '2026-07-14T15:00:00+08:00', delivered_at: null, courier_phone: '13800003005' },
    { id: 6, courier_company: '顺丰速运', tracking_no: 'SF0987654321', recipient_name: '陈伟', recipient_address: '4栋3单元601', pickup_location: '小区北门快递柜A组', delivery_address: '4栋3单元601', status: 'delivered', expected_time: '2026-07-13T09:00:00+08:00', delivered_at: '2026-07-13T08:50:00+08:00', courier_phone: '13800003001' },
    { id: 7, courier_company: '圆通速递', tracking_no: 'YT1122334455', recipient_name: '孙磊', recipient_address: '2栋2单元304', pickup_location: '小区北门快递柜A组', delivery_address: '2栋2单元304', status: 'cancelled', expected_time: '2026-07-13T14:00:00+08:00', delivered_at: null, courier_phone: '13800003002' },
    { id: 8, courier_company: '中通快递', tracking_no: 'ZT6677889900', recipient_name: '吴敏', recipient_address: '7栋1单元501', pickup_location: '小区北门快递柜C组', delivery_address: '7栋1单元501', status: 'pending', expected_time: '2026-07-14T17:00:00+08:00', delivered_at: null, courier_phone: '13800003003' },
  ],

  /* ============================================================
   * 物资数据 (10条)
   * ============================================================ */
  materials: [
    { id: 1, name: '电工工具箱', category: '维修工具', description: '包含螺丝刀、钳子、电笔、万用表等全套电工常用工具', total_stock: 10, available_stock: 8, borrow_limit_days: 7, location: '物业工具间A柜', unit: '套' },
    { id: 2, name: '管道疏通机', category: '维修工具', description: '电动管道疏通设备，适用于厨房和卫生间下水管道堵塞疏通', total_stock: 3, available_stock: 2, borrow_limit_days: 3, location: '物业工具间B柜', unit: '台' },
    { id: 3, name: '多功能清洁车', category: '清洁用品', description: '带水箱和清洁工具的推车式清洁设备，适用于楼道和公共区域清洁', total_stock: 5, available_stock: 4, borrow_limit_days: 1, location: '保洁工具间', unit: '辆' },
    { id: 4, name: '84消毒液', category: '清洁用品', description: '5L装84消毒液，用于公共区域和垃圾投放点的消毒杀菌', total_stock: 50, available_stock: 42, borrow_limit_days: 7, location: '保洁仓库', unit: '桶' },
    { id: 5, name: 'A4打印纸', category: '办公用品', description: '70g A4复印纸，500张/包，用于日常办公打印', total_stock: 100, available_stock: 85, borrow_limit_days: 30, location: '办公室仓库', unit: '包' },
    { id: 6, name: '墨盒套装', category: '办公用品', description: 'HP LaserJet打印机黑色墨盒，适用于物业服务中心打印机', total_stock: 20, available_stock: 15, borrow_limit_days: 30, location: '办公室仓库', unit: '个' },
    { id: 7, name: '灭火器（干粉）', category: '安全设备', description: '4kg干粉灭火器，适用于A/B/C类火灾，有效期至2027年', total_stock: 80, available_stock: 78, borrow_limit_days: 0, location: '各楼栋消防箱', unit: '具' },
    { id: 8, name: '反光背心', category: '安全设备', description: '荧光黄反光背心，用于夜间巡逻和道路引导', total_stock: 30, available_stock: 25, borrow_limit_days: 1, location: '保安室', unit: '件' },
    { id: 9, name: '高压水枪', category: '清洁用品', description: '1500W高压清洗机，用于地面冲洗和外墙清洗', total_stock: 4, available_stock: 3, borrow_limit_days: 3, location: '保洁工具间', unit: '台' },
    { id: 10, name: '对讲机', category: '安全设备', description: '数字对讲机，通信距离3-5公里，用于保安和物业人员即时通讯', total_stock: 15, available_stock: 10, borrow_limit_days: 1, location: '保安室', unit: '部' },
  ],

  /* ============================================================
   * 物资借用记录 (6条)
   * ============================================================ */
  materialBorrows: [
    { id: 1, material_id: 1, material_name: '电工工具箱', borrower_id: 2, borrower_name: '李四', borrow_count: 1, borrow_date: '2026-07-14T08:00:00+08:00', due_date: '2026-07-21T08:00:00+08:00', return_date: null, status: 'borrowed', purpose: '3栋电梯检修' },
    { id: 2, material_id: 3, material_name: '多功能清洁车', borrower_id: 2, borrower_name: '李四', borrow_count: 1, borrow_date: '2026-07-13T07:00:00+08:00', due_date: '2026-07-14T07:00:00+08:00', return_date: '2026-07-13T17:00:00+08:00', status: 'returned', purpose: '楼道清洁' },
    { id: 3, material_id: 10, material_name: '对讲机', borrower_id: 2, borrower_name: '李四', borrow_count: 2, borrow_date: '2026-07-12T09:00:00+08:00', due_date: '2026-07-13T09:00:00+08:00', return_date: null, status: 'overdue', purpose: '消防演练准备' },
    { id: 4, material_id: 5, material_name: 'A4打印纸', borrower_id: 4, borrower_name: '赵六', borrow_count: 5, borrow_date: '2026-07-10T14:00:00+08:00', due_date: '2026-08-09T14:00:00+08:00', return_date: null, status: 'borrowed', purpose: '办公室日常使用' },
    { id: 5, material_id: 2, material_name: '管道疏通机', borrower_id: 2, borrower_name: '李四', borrow_count: 1, borrow_date: '2026-07-08T10:00:00+08:00', due_date: '2026-07-11T10:00:00+08:00', return_date: '2026-07-10T16:00:00+08:00', status: 'returned', purpose: '5栋下水道疏通' },
    { id: 6, material_id: 8, material_name: '反光背心', borrower_id: 3, borrower_name: '王五', borrow_count: 3, borrow_date: '2026-07-05T18:00:00+08:00', due_date: '2026-07-06T18:00:00+08:00', return_date: null, status: 'lost', purpose: '夜间巡逻' },
  ],

  /* ============================================================
   * 建议反馈 (8条)
   * ============================================================ */
  suggestions: [
    { id: 1, title: '建议在小区内增设健身器材', category: 'facility', description: '目前小区仅有一组简易健身器材，数量严重不足，早晚高峰期经常需要排队等候。建议在二期空地增设一组户外健身器材，包括漫步机、扭腰器、单杠等，方便居民日常锻炼身体。', status: 'adopted', creator_id: 1, creator_name: '张三', created_at: '2026-07-10T09:00:00+08:00', ai_sentiment: 'positive', ai_keywords: ['健身器材', '锻炼', '设施完善'], ai_category: 'facility', reply_content: '感谢您的建议！物业已将此项纳入下半年改善计划，预计9月份完成二期空地健身器材的安装工作，届时会提前通知各位业主。', reply_at: '2026-07-12T14:00:00+08:00', replier_id: 4 },
    { id: 2, title: '小区门禁系统需要升级', category: 'facility', description: '现有门禁系统使用已超过5年，经常出现刷卡不灵敏、远程开门延迟等问题，建议升级为支持人脸识别和手机APP远程开门的新一代门禁系统。', status: 'processing', creator_id: 1, creator_name: '张三', created_at: '2026-07-09T15:00:00+08:00', ai_sentiment: 'neutral', ai_keywords: ['门禁', '升级', '人脸识别'], ai_category: 'facility', reply_content: null, reply_at: null, replier_id: null },
    { id: 3, title: '物业客服响应速度有待提升', category: 'service', description: '上周报修厨房水管漏水，从提交工单到维修人员上门等待了近6个小时，期间多次拨打物业电话无人接听。希望物业能增加客服人员配备，缩短响应时间。', status: 'replied', creator_id: 1, creator_name: '张三', created_at: '2026-07-08T11:00:00+08:00', ai_sentiment: 'negative', ai_keywords: ['响应慢', '客服', '维修', '等待'], ai_category: 'service', reply_content: '非常抱歉给您带来不便！我们已注意到近期报修量增加导致响应延迟的问题，目前已增加值班维修人员，并优化了工单调度流程。今后紧急工单的平均响应时间将控制在2小时以内，感谢您的监督和反馈。', reply_at: '2026-07-09T09:00:00+08:00', replier_id: 4 },
    { id: 4, title: '垃圾分类投放点需要增加洗手池', category: 'environment', description: '目前各垃圾投放点均未设置洗手池，居民投放垃圾后无法及时洗手，特别是厨余垃圾投放后很不方便，建议在各投放点增设简易洗手设施。', status: 'resolved', creator_id: 1, creator_name: '张三', created_at: '2026-07-07T08:00:00+08:00', ai_sentiment: 'positive', ai_keywords: ['垃圾分类', '洗手池', '便民设施'], ai_category: 'environment', reply_content: '您的建议非常实用！物业已安排在本周内为各垃圾投放点安装简易洗手池，并配备洗手液和擦手纸，预计7月14日前全部安装到位。', reply_at: '2026-07-08T10:00:00+08:00', replier_id: 2 },
    { id: 5, title: '地下车库存在安全隐患', category: 'safety', description: '地下车库B区多个照明灯损坏，区域昏暗，且地面有多处坑洼未修补，夜间停车和取车时存在绊倒风险。此外，部分消防栓前停有车辆，影响应急使用。', status: 'new', creator_id: 1, creator_name: '张三', created_at: '2026-07-14T07:00:00+08:00', ai_sentiment: 'negative', ai_keywords: ['安全隐患', '照明', '消防栓', '地下车库'], ai_category: 'safety', reply_content: null, reply_at: null, replier_id: null },
    { id: 6, title: '建议开设社区老年大学', category: 'other', description: '小区内退休老人较多，普遍反映日常生活单调，建议物业联合社区开设老年大学，课程可包括书法、绘画、太极拳、智能手机使用等，丰富老年人的精神文化生活。', status: 'replied', creator_id: 1, creator_name: '张三', created_at: '2026-07-06T14:00:00+08:00', ai_sentiment: 'positive', ai_keywords: ['老年大学', '社区活动', '文化'], ai_category: 'other', reply_content: '很好的建议！物业已与社区居委会沟通，初步计划在社区活动室开设老年兴趣班，秋季学期开始试运行。届时会通过公告和小程序通知课程安排和报名方式，请关注后续通知。', reply_at: '2026-07-08T15:00:00+08:00', replier_id: 4 },
    { id: 7, title: '电梯内空调制冷效果差', category: 'facility', description: '近期高温天气，多部电梯内的空调制冷效果不佳，电梯内温度较高，乘坐体验较差，特别是中午时段，老年人和儿童乘坐时感觉闷热不适。', status: 'processing', creator_id: 1, creator_name: '张三', created_at: '2026-07-12T13:00:00+08:00', ai_sentiment: 'negative', ai_keywords: ['电梯', '空调', '高温', '制冷'], ai_category: 'facility', reply_content: null, reply_at: null, replier_id: null },
    { id: 8, title: '建议推广小区闲置物品交换活动', category: 'other', description: '建议物业定期组织小区闲置物品交换或二手交易市集，既可以帮助居民处理闲置物品，又能促进邻里交流，营造绿色环保的小区氛围。', status: 'new', creator_id: 1, creator_name: '张三', created_at: '2026-07-13T16:00:00+08:00', ai_sentiment: 'positive', ai_keywords: ['闲置交换', '环保', '邻里', '市集'], ai_category: 'other', reply_content: null, reply_at: null, replier_id: null },
  ],

  /* ============================================================
   * 会话记录 (3个预设对话)
   * ============================================================ */
  conversations: [
    {
      id: 1,
      title: '业主张三询问报修',
      user_id: 1,
      user_name: '张三',
      created_at: '2026-07-14T08:00:00+08:00',
      updated_at: '2026-07-14T08:10:00+08:00',
      messages: [
        { id: 1, role: 'user', content: '你好，我家厨房水管漏水了，能帮我报修吗？', created_at: '2026-07-14T08:00:00+08:00' },
        { id: 2, role: 'assistant', content: '您好，张三先生！已识别您的身份为3栋2单元501的业主。请问漏水情况严重吗？是否已经关闭了水阀？请描述一下具体的漏水位置和情况，我马上帮您创建维修工单。', created_at: '2026-07-14T08:00:30+08:00' },
        { id: 3, role: 'user', content: '挺严重的，水槽下面的水管一直在滴水，橱柜底部都湿了，我已经把水阀关掉了。', created_at: '2026-07-14T08:02:00+08:00' },
        { id: 4, role: 'assistant', content: '了解到情况比较紧急，我已经帮您创建了紧急维修工单（WO20260714-001），已标记为"紧急"优先级。维修人员预计在2小时内上门处理，请您保持电话畅通。您也可以在小程序"工单管理"中实时查看工单进度。还有其他需要帮助的吗？', created_at: '2026-07-14T08:03:00+08:00' },
        { id: 5, role: 'user', content: '好的，谢谢！那我等维修师傅上门。', created_at: '2026-07-14T08:10:00+08:00' },
      ],
    },
    {
      id: 2,
      title: '物业人员李四查询工单统计',
      user_id: 2,
      user_name: '李四',
      created_at: '2026-07-14T08:30:00+08:00',
      updated_at: '2026-07-14T08:35:00+08:00',
      messages: [
        { id: 1, role: 'user', content: '帮我查一下今天有多少待处理的工单？', created_at: '2026-07-14T08:30:00+08:00' },
        { id: 2, role: 'assistant', content: '李四您好，当前系统数据显示：今日待处理工单共12条，其中紧急工单3条（电梯异响、外墙瓷砖脱落、消防通道占用），高度优先工单2条（门禁系统故障、门禁卡失效），中优先级工单5条，低优先级工单2条。建议优先处理紧急和高优先级工单。', created_at: '2026-07-14T08:30:30+08:00' },
        { id: 3, role: 'user', content: '好的，把紧急工单的具体信息列出来。', created_at: '2026-07-14T08:35:00+08:00' },
      ],
    },
    {
      id: 3,
      title: '管理员赵六查询运营数据',
      user_id: 4,
      user_name: '赵六',
      created_at: '2026-07-14T09:00:00+08:00',
      updated_at: '2026-07-14T09:05:00+08:00',
      messages: [
        { id: 1, role: 'user', content: '给我看一下本周的运营数据概览。', created_at: '2026-07-14T09:00:00+08:00' },
        { id: 2, role: 'assistant', content: '赵管理员您好，以下是本周（7月8日-7月14日）运营数据概览：\n- 总工单量：156条，本周新增18条\n- 待处理工单：12条\n- 工单满意度均值：4.2分\n- 公告发布：本周发布3条，总阅读量620次\n- 车位使用率：26%（65/250）\n- 本周快递代收：32件\n- 居民建议：本周收到2条，已回复1条\n如需查看详细报表，请前往运营看板页面。', created_at: '2026-07-14T09:00:30+08:00' },
        { id: 3, role: 'user', content: '满意度偏低的原因是什么？', created_at: '2026-07-14T09:05:00+08:00' },
      ],
    },
  ],

  /* ============================================================
   * 消息通知 (12条)
   * ============================================================ */
  notifications: [
    { id: 1, type: 'work_order', title: '工单已提交', content: '您的厨房水管漏水维修工单（WO20260714-001）已成功提交，我们将尽快安排维修人员处理。', related_module: 'work-orders', related_id: 1, user_id: 1, is_read: false, created_at: '2026-07-14T08:15:00+08:00' },
    { id: 2, type: 'work_order', title: '工单已分配', content: '您的路灯维修工单（WO20260714-002）已分配给维修人员李四，请保持电话畅通。', related_module: 'work-orders', related_id: 2, user_id: 1, is_read: false, created_at: '2026-07-14T07:45:00+08:00' },
    { id: 3, type: 'announcement', title: '新公告发布', content: '小区发布了重要通知：《关于小区夏季用电安全的重要通知》，请及时查看。', related_module: 'announcements', related_id: 1, user_id: 1, is_read: false, created_at: '2026-07-14T09:00:00+08:00' },
    { id: 4, type: 'system', title: '系统维护通知', content: '智邻物业管理系统将于2026年7月16日凌晨2:00-4:00进行例行维护升级，届时部分功能可能短暂不可用，敬请谅解。', related_module: 'system', related_id: null, user_id: 1, is_read: true, created_at: '2026-07-13T18:00:00+08:00' },
    { id: 5, type: 'suggestion', title: '建议已受理', content: '您提交的"建议在小区内增设健身器材"已被采纳，物业已将其纳入下半年改善计划，预计9月份完成。', related_module: 'suggestions', related_id: 1, user_id: 1, is_read: true, created_at: '2026-07-12T14:00:00+08:00' },
    { id: 6, type: 'work_order', title: '工单已完成', content: '您的工单"5栋地下车库严重积水"（WO20260711-008）已处理完毕，请对本次服务进行评价。', related_module: 'work-orders', related_id: 8, user_id: 1, is_read: true, created_at: '2026-07-11T15:00:00+08:00' },
    { id: 7, type: 'announcement', title: '停水通知', content: '接自来水公司通知，7月15日小区将停水检修，请提前做好储水准备。详情请查看公告。', related_module: 'announcements', related_id: 3, user_id: 1, is_read: true, created_at: '2026-07-12T08:00:00+08:00' },
    { id: 8, type: 'work_order', title: '工单被驳回', content: '您的工单"小区内宠物不牵绳问题"（WO20260709-011）因超出物业管理权限已被驳回，建议向社区网格员或城管部门反映。', related_module: 'work-orders', related_id: 11, user_id: 1, is_read: true, created_at: '2026-07-10T09:00:00+08:00' },
    { id: 9, type: 'system', title: '信用积分变动', content: '恭喜！您因按时缴纳物业费获得信用积分+5，当前信用积分95分，继续保持良好记录。', related_module: 'profile', related_id: null, user_id: 1, is_read: true, created_at: '2026-07-10T09:00:00+08:00' },
    { id: 10, type: 'suggestion', title: '建议已回复', content: '您提交的"物业客服响应速度有待提升"建议已收到回复，请进入建议反馈查看详情。', related_module: 'suggestions', related_id: 3, user_id: 1, is_read: true, created_at: '2026-07-09T09:00:00+08:00' },
    { id: 11, type: 'announcement', title: '物业费缴纳提醒', content: '2026年第三季度物业费已开始缴纳，请于7月31日前完成缴费，以免影响信用积分。', related_module: 'announcements', related_id: 4, user_id: 1, is_read: false, created_at: '2026-07-10T09:00:00+08:00' },
    { id: 12, type: 'work_order', title: 'SLA超时预警', content: '您的工单"社区活动室空调维修"（WO20260702-025）已超出SLA时效，我们已督促相关人员加快处理进度，非常抱歉。', related_module: 'work-orders', related_id: 25, user_id: 1, is_read: false, created_at: '2026-07-09T14:00:00+08:00' },
    { id: 13, type: 'work_order', title: '新工单待接单', content: '业主张三提交了"厨房水管漏水急需维修"工单（WO20260714-001），请尽快接单处理。', related_module: 'work-orders', related_id: 1, user_id: 2, is_read: false, created_at: '2026-07-14T08:15:00+08:00' },
    { id: 14, type: 'work_order', title: '工单处理提醒', content: '您负责的"3栋电梯运行异响"工单（WO20260713-003）已超SLA时效，请尽快完成处理。', related_module: 'work-orders', related_id: 3, user_id: 2, is_read: false, created_at: '2026-07-14T06:20:00+08:00' },
    { id: 15, type: 'system', title: '关怀任务提醒', content: '您有1项关怀任务待完成：前往3栋2单元502看望独居老人王奶奶，请在本周内完成走访。', related_module: 'care', related_id: 1, user_id: 3, is_read: false, created_at: '2026-07-14T08:00:00+08:00' },
    { id: 16, type: 'work_order', title: '网格巡查任务', content: '请于今日完成A区网格巡查，重点检查消防通道、电动车停放及垃圾分类情况。', related_module: 'work-orders', related_id: null, user_id: 3, is_read: false, created_at: '2026-07-14T07:00:00+08:00' },
    { id: 17, type: 'system', title: '系统安全告警', content: '检测到异常登录尝试：7月13日晚间有3次来自陌生IP的admin账号登录失败记录，请核实是否为正常操作。', related_module: 'system', related_id: null, user_id: 4, is_read: false, created_at: '2026-07-14T01:30:00+08:00' },
    { id: 18, type: 'work_order', title: 'SLA升级通知', content: '工单"消防通道长期被车辆占用"（WO20260708-013）已升级为紧急工单，请协调相关部门尽快处理。', related_module: 'work-orders', related_id: 13, user_id: 4, is_read: false, created_at: '2026-07-14T08:00:00+08:00' },
    { id: 19, type: 'announcement', title: '公告审核提醒', content: '物业人员李四提交了新的公告"小区夏季消杀通知"，请尽快审核并发布。', related_module: 'announcements', related_id: null, user_id: 4, is_read: true, created_at: '2026-07-13T16:00:00+08:00' },
    { id: 20, type: 'system', title: '月度数据报表', content: '2026年6月小区运营数据报表已生成：工单总量156件，满意度4.2分，请查看运维监控面板了解详情。', related_module: 'ops-dashboard', related_id: null, user_id: 4, is_read: true, created_at: '2026-07-01T10:00:00+08:00' },
  ],

  /* ============================================================
   * 仪表盘统计数据
   * ============================================================ */
  dashboardStats: {
    total_residents: 328,
    total_work_orders: 156,
    pending_work_orders: 12,
    total_announcements: 45,
    total_parking: 250,
    occupied_parking: 65,
    satisfaction_avg: 4.2,
    today_work_orders: 5,
    total_courier_tasks: 128,
    pending_courier_tasks: 3,
    total_care_records: 48,
    pending_care_records: 1,
    total_suggestions: 36,
    unread_suggestions: 2,
    online_devices: 6,
    offline_devices: 2,
    total_alerts: 5,
    unresolved_alerts: 4,
  },

  /* ============================================================
   * 图表数据
   * ============================================================ */
  chartData: {
    /* 近7天工单趋势 */
    workOrderTrend: {
      labels: ['07-08', '07-09', '07-10', '07-11', '07-12', '07-13', '07-14'],
      counts: [3, 2, 2, 3, 2, 2, 5],
    },

    /* 工单类型分布 */
    workOrderDistribution: {
      labels: ['维修', '清洁', '安全', '投诉', '建议', '其他'],
      data: [10, 3, 4, 4, 3, 1],
    },

    /* 工单优先级分布 */
    workOrderByPriority: {
      labels: ['低', '中', '高', '紧急'],
      data: [6, 8, 5, 6],
    },

    /* 车位使用情况 */
    parkingUsage: {
      labels: ['A区-地面', 'B区-地下', 'C区-地面'],
      occupied: [3, 4, 3],
      available: [3, 2, 3],
      reserved: [1, 0, 1],
      maintenance: [0, 1, 0],
    },

    /* 近12个月满意度趋势 */
    satisfactionTrend: {
      labels: ['2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07'],
      avg_score: [3.8, 3.9, 4.0, 4.1, 4.0, 3.9, 4.2, 4.1, 4.3, 4.0, 4.1, 4.2],
      count: [18, 15, 20, 22, 19, 12, 14, 16, 21, 18, 17, 15],
    },

    /* 近12个月工单量 */
    monthlyWorkOrders: {
      labels: ['2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07'],
      counts: [22, 18, 25, 20, 15, 12, 14, 18, 24, 20, 19, 16],
    },

    /* 建议分类分布 */
    suggestionCategoryDistribution: {
      labels: ['设施', '服务', '安全', '环境', '其他'],
      data: [3, 1, 1, 1, 2],
    },

    /* 各模块概览统计 */
    moduleSummary: {
      labels: ['工单管理', '公告通知', '关怀服务', '监控安防', '车位管理', '快递代收', '物资管理', '建议反馈'],
      today: [5, 1, 1, 0, 2, 4, 1, 0],
      week: [18, 3, 6, 2, 5, 12, 3, 2],
      total: [156, 45, 48, 8, 250, 128, 10, 36],
    },
  },
};