import { Project, Template, Category } from '../types';

export const mockProjects: Project[] = [
  {
    id: '1',
    name: '在线商城系统',
    description: '一个面向电商行业的在线购物平台，包含商品展示、购物车、订单管理等功能',
    createdAt: '2024-01-15',
    status: 'completed',
    requirement: '用户需要一个在线商城系统，支持商品浏览、搜索、购物车、下单支付等功能。需要包含用户注册登录、商品管理、订单管理等模块。',
    analysis: {
      id: 'a1',
      features: [
        { id: 'f1', name: '商品展示', description: '展示商品列表和详情', priority: 'high' },
        { id: 'f2', name: '购物车', description: '添加商品到购物车', priority: 'high' },
        { id: 'f3', name: '订单管理', description: '查看和管理订单', priority: 'high' },
        { id: 'f4', name: '用户登录', description: '用户注册和登录', priority: 'medium' },
      ],
      userStories: [
        { id: 'us1', role: '用户', want: '浏览商品列表', reason: '找到心仪的商品' },
        { id: 'us2', role: '用户', want: '添加商品到购物车', reason: '方便统一结算' },
        { id: 'us3', role: '管理员', want: '管理商品库存', reason: '保持库存准确' },
      ],
      businessRules: ['商品库存不足时不能下单', '订单完成后自动更新库存', '用户必须登录才能下单'],
      entities: [
        { id: 'e1', name: '商品', attributes: [{ name: '名称', type: 'string' }, { name: '价格', type: 'number' }, { name: '库存', type: 'number' }] },
        { id: 'e2', name: '订单', attributes: [{ name: '编号', type: 'string' }, { name: '金额', type: 'number' }, { name: '状态', type: 'string' }] },
      ],
    },
    prototype: {
      id: 'p1',
      pages: [
        {
          id: 'page1',
          name: '首页',
          components: [
            { id: 'c1', type: 'navigation', props: { title: '商城首页' }, style: { width: '100%', height: '60px' }, position: { x: 0, y: 0 } },
            { id: 'c2', type: 'card', props: { title: '热门商品', items: ['商品A', '商品B', '商品C'] }, style: { width: '300px', height: '200px' }, position: { x: 50, y: 100 } },
            { id: 'c3', type: 'card', props: { title: '新品上架', items: ['商品D', '商品E'] }, style: { width: '300px', height: '200px' }, position: { x: 400, y: 100 } },
          ],
        },
      ],
      theme: { primaryColor: '#6366f1', secondaryColor: '#f97316', fontFamily: 'Inter', borderRadius: '8px' },
    },
    chatMessages: [
      { id: 'cm1', role: 'user', content: '我想要做一个在线商城系统', type: 'text', timestamp: '2024-01-15 09:00' },
      { id: 'cm2', role: 'assistant', content: '好的，我来帮您分析需求。请问商城主要包含哪些功能模块？', type: 'text', timestamp: '2024-01-15 09:01' },
      { id: 'cm3', role: 'user', content: '需要支持商品浏览、搜索、购物车、下单支付等功能。需要包含用户注册登录、商品管理、订单管理等模块。', type: 'text', timestamp: '2024-01-15 09:05' },
      { id: 'cm4', role: 'assistant', content: '已为您完成需求分析，提取了4个功能点、3个用户故事、3条业务规则和2个数据实体。', type: 'analysis', timestamp: '2024-01-15 09:06' },
      { id: 'cm5', role: 'user', content: '功能还不错，可以生成原型吗？', type: 'text', timestamp: '2024-01-15 09:10' },
      { id: 'cm6', role: 'assistant', content: '原型已生成，包含首页和商品列表页，共8个组件。', type: 'prototype', timestamp: '2024-01-15 09:11' },
    ],
  },
  {
    id: '2',
    name: '企业内部OA系统',
    description: '企业办公自动化系统，包含考勤管理、审批流程、文件共享等功能',
    createdAt: '2024-01-20',
    status: 'designing',
    requirement: '需要一个企业内部OA系统，支持员工考勤打卡、请假审批、文件共享、会议安排等功能。',
    analysis: {
      id: 'a2',
      features: [
        { id: 'f5', name: '考勤管理', description: '员工打卡和考勤统计', priority: 'high' },
        { id: 'f6', name: '审批流程', description: '请假和报销审批', priority: 'high' },
        { id: 'f7', name: '文件共享', description: '文档上传和共享', priority: 'medium' },
      ],
      userStories: [
        { id: 'us4', role: '员工', want: '打卡上班', reason: '记录出勤情况' },
        { id: 'us5', role: '员工', want: '申请请假', reason: '处理个人事务' },
        { id: 'us6', role: '主管', want: '审批请假申请', reason: '管理团队出勤' },
      ],
      businessRules: ['请假需要提前申请', '审批需要逐级审批', '考勤异常需要报备'],
      entities: [
        { id: 'e3', name: '员工', attributes: [{ name: '姓名', type: 'string' }, { name: '部门', type: 'string' }] },
        { id: 'e4', name: '审批', attributes: [{ name: '类型', type: 'string' }, { name: '状态', type: 'string' }] },
      ],
    },
    prototype: {
      id: 'p2',
      pages: [
        {
          id: 'page2',
          name: '工作台',
          components: [
            { id: 'c4', type: 'navigation', props: { title: 'OA系统' }, style: { width: '100%', height: '60px' }, position: { x: 0, y: 0 } },
            { id: 'c5', type: 'card', props: { title: '待审批', count: 5 }, style: { width: '200px', height: '120px' }, position: { x: 50, y: 100 } },
            { id: 'c6', type: 'card', props: { title: '今日考勤', status: '已打卡' }, style: { width: '200px', height: '120px' }, position: { x: 300, y: 100 } },
          ],
        },
      ],
      theme: { primaryColor: '#6366f1', secondaryColor: '#f97316', fontFamily: 'Inter', borderRadius: '8px' },
    },
  },
  {
    id: '3',
    name: '客户管理系统',
    description: 'CRM客户关系管理系统，用于管理客户信息、销售跟进、报表分析',
    createdAt: '2024-01-25',
    status: 'analyzing',
    requirement: '需要一个CRM系统，能够管理客户信息、记录销售跟进、生成销售报表。',
  },
  {
    id: '4',
    name: '项目管理工具',
    description: '团队协作项目管理工具，支持任务分配、进度跟踪、文档管理',
    createdAt: '2024-02-01',
    status: 'draft',
    requirement: '',
  },
  {
    id: '5',
    name: '医院营养科病人膳食管理系统',
    description: '医院营养科用于管理住院病人膳食计划、营养评估和配餐管理的系统',
    createdAt: '2024-07-01',
    status: 'completed',
    requirement: '医院营养科需要一个病人膳食管理系统，主要功能包括：1.病人基本信息管理，记录病人的年龄、性别、体重、疾病诊断等；2.营养评估，根据病人情况进行营养需求分析；3.膳食计划制定，根据评估结果制定每日三餐膳食方案；4.特殊饮食管理，如糖尿病饮食、低盐饮食等；5.配餐管理，生成配餐清单并跟踪配送情况；6.营养报告，生成病人营养摄入统计报告。需要支持医生、营养师、配餐员等不同角色的操作。',
    analysis: {
      id: 'a5',
      features: [
        { id: 'f10', name: '病人信息管理', description: '管理病人基本信息和疾病诊断', priority: 'high' },
        { id: 'f11', name: '营养评估', description: '根据病人情况进行营养需求分析和评估', priority: 'high' },
        { id: 'f12', name: '膳食计划制定', description: '制定每日三餐膳食方案', priority: 'high' },
        { id: 'f13', name: '特殊饮食管理', description: '管理糖尿病、低盐等特殊饮食需求', priority: 'high' },
        { id: 'f14', name: '配餐管理', description: '生成配餐清单并跟踪配送情况', priority: 'medium' },
        { id: 'f15', name: '营养报告', description: '生成病人营养摄入统计报告', priority: 'medium' },
        { id: 'f16', name: '角色权限管理', description: '支持医生、营养师、配餐员不同角色操作', priority: 'medium' },
      ],
      userStories: [
        { id: 'us10', role: '营养师', want: '查看病人基本信息和诊断', reason: '了解病人情况进行营养评估' },
        { id: 'us11', role: '营养师', want: '制定个性化膳食计划', reason: '满足病人特殊营养需求' },
        { id: 'us12', role: '医生', want: '查看病人膳食计划', reason: '了解病人饮食情况配合治疗' },
        { id: 'us13', role: '配餐员', want: '查看配餐清单', reason: '准备病人餐食' },
        { id: 'us14', role: '护士', want: '确认病人用餐情况', reason: '确保病人按时就餐' },
        { id: 'us15', role: '管理员', want: '管理营养师和配餐员权限', reason: '保障系统安全' },
      ],
      businessRules: [
        '营养师必须根据病人诊断制定膳食计划',
        '特殊饮食需求需要医生确认',
        '配餐清单每天生成并发送给厨房',
        '病人信息需要保密，仅限授权人员查看',
        '营养评估结果需要定期更新',
      ],
      entities: [
        { id: 'e10', name: '病人', attributes: [{ name: '姓名', type: 'string' }, { name: '年龄', type: 'number' }, { name: '性别', type: 'string' }, { name: '体重', type: 'number' }, { name: '诊断', type: 'string' }, { name: '科室', type: 'string' }, { name: '床号', type: 'string' }] },
        { id: 'e11', name: '膳食计划', attributes: [{ name: '日期', type: 'date' }, { name: '早餐', type: 'string' }, { name: '午餐', type: 'string' }, { name: '晚餐', type: 'string' }, { name: '加餐', type: 'string' }, { name: '总热量', type: 'number' }, { name: '蛋白质', type: 'number' }, { name: '碳水化合物', type: 'number' }, { name: '脂肪', type: 'number' }] },
        { id: 'e12', name: '营养师', attributes: [{ name: '姓名', type: 'string' }, { name: '工号', type: 'string' }, { name: '职称', type: 'string' }] },
        { id: 'e13', name: '配餐记录', attributes: [{ name: '日期', type: 'date' }, { name: '状态', type: 'string' }, { name: '配餐员', type: 'string' }, { name: '送达时间', type: 'datetime' }] },
        { id: 'e14', name: '特殊饮食', attributes: [{ name: '类型', type: 'string' }, { name: '限制项', type: 'string' }, { name: '推荐食物', type: 'string' }] },
      ],
    },
    prototype: {
      id: 'p5',
      pages: [
        {
          id: 'page5',
          name: '病人膳食管理首页',
          components: [
            { id: 'c20', type: 'navigation', props: { title: '营养膳食管理系统' }, style: { width: '100%', height: '60px' }, position: { x: 0, y: 0 } },
            { id: 'c21', type: 'card', props: { title: '今日待处理', count: 12 }, style: { width: '200px', height: '120px' }, position: { x: 50, y: 100 } },
            { id: 'c22', type: 'card', props: { title: '新增病人', count: 5 }, style: { width: '200px', height: '120px' }, position: { x: 280, y: 100 } },
            { id: 'c23', type: 'card', props: { title: '待审核计划', count: 8 }, style: { width: '200px', height: '120px' }, position: { x: 510, y: 100 } },
            { id: 'c24', type: 'card', props: { title: '配餐完成率', count: '95%' }, style: { width: '200px', height: '120px' }, position: { x: 740, y: 100 } },
            { id: 'c25', type: 'table', props: { title: '病人列表', columns: ['姓名', '床号', '科室', '诊断', '状态', '操作'], data: [['张三', '301', '消化内科', '糖尿病', '住院', '查看'], ['李四', '302', '心血管内科', '高血压', '住院', '查看'], ['王五', '303', '肿瘤科', '胃癌术后', '住院', '查看']] }, style: { width: '90%', height: '250px' }, position: { x: 50, y: 250 } },
          ],
        },
        {
          id: 'page6',
          name: '营养评估页面',
          components: [
            { id: 'c26', type: 'navigation', props: { title: '营养评估', back: true }, style: { width: '100%', height: '60px' }, position: { x: 0, y: 0 } },
            { id: 'c27', type: 'form', props: { title: '病人基本信息', fields: [{ label: '姓名', type: 'input', value: '张三' }, { label: '性别', type: 'select', value: '男' }, { label: '年龄', type: 'input', value: '55' }, { label: '体重', type: 'input', value: '65kg' }, { label: '身高', type: 'input', value: '170cm' }, { label: '诊断', type: 'textarea', value: '2型糖尿病，高血压' }] }, style: { width: '450px', height: '350px' }, position: { x: 50, y: 100 } },
            { id: 'c28', type: 'card', props: { title: '营养指标', items: ['BMI指数: 22.5 (正常)', '基础代谢率: 1580 kcal', '每日所需热量: 1800 kcal', '蛋白质需求: 65g', '碳水化合物: 225g', '脂肪: 60g'] }, style: { width: '450px', height: '350px' }, position: { x: 550, y: 100 } },
            { id: 'c29', type: 'button', props: { title: '生成膳食计划', variant: 'primary' }, style: { width: '200px', height: '40px' }, position: { x: 50, y: 480 } },
          ],
        },
        {
          id: 'page7',
          name: '膳食计划详情',
          components: [
            { id: 'c30', type: 'navigation', props: { title: '膳食计划详情', back: true }, style: { width: '100%', height: '60px' }, position: { x: 0, y: 0 } },
            { id: 'c31', type: 'card', props: { title: '病人信息', items: ['姓名: 张三', '床号: 301', '科室: 消化内科', '诊断: 糖尿病', '饮食类型: 糖尿病饮食'] }, style: { width: '100%', height: '120px' }, position: { x: 50, y: 100 } },
            { id: 'c32', type: 'card', props: { title: '早餐', items: ['主食: 全麦面包 100g', '蛋白质: 鸡蛋 1个', '蔬菜: 凉拌黄瓜 50g', '饮品: 无糖豆浆 200ml', '热量: 450 kcal'] }, style: { width: '300px', height: '180px' }, position: { x: 50, y: 250 } },
            { id: 'c33', type: 'card', props: { title: '午餐', items: ['主食: 糙米饭 100g', '蛋白质: 清蒸鱼 150g', '蔬菜: 西兰花 100g', '汤品: 豆腐汤 200ml', '热量: 650 kcal'] }, style: { width: '300px', height: '180px' }, position: { x: 380, y: 250 } },
            { id: 'c34', type: 'card', props: { title: '晚餐', items: ['主食: 燕麦粥 100g', '蛋白质: 鸡胸肉 100g', '蔬菜: 菠菜 100g', '饮品: 酸奶 150ml', '热量: 500 kcal'] }, style: { width: '300px', height: '180px' }, position: { x: 710, y: 250 } },
            { id: 'c35', type: 'card', props: { title: '营养摄入统计', items: ['总热量: 1600 kcal', '蛋白质: 68g', '碳水化合物: 200g', '脂肪: 55g'] }, style: { width: '100%', height: '100px' }, position: { x: 50, y: 460 } },
            { id: 'c36', type: 'button', props: { title: '提交审核', variant: 'primary' }, style: { width: '150px', height: '40px' }, position: { x: 50, y: 580 } },
            { id: 'c37', type: 'button', props: { title: '编辑计划', variant: 'secondary' }, style: { width: '150px', height: '40px' }, position: { x: 220, y: 580 } },
          ],
        },
      ],
      theme: { primaryColor: '#10b981', secondaryColor: '#f59e0b', fontFamily: 'Inter', borderRadius: '8px' },
    },
    chatMessages: [
      { id: 'cm10', role: 'user', content: '我们医院营养科需要一个病人膳食管理系统', type: 'text', timestamp: '2024-07-01 09:30' },
      { id: 'cm11', role: 'assistant', content: '好的，请问系统主要服务于哪些人群？需要哪些核心功能？', type: 'text', timestamp: '2024-07-01 09:31' },
      { id: 'cm12', role: 'user', content: '主要是营养师、医生、配餐员使用。需要病人信息管理、营养评估、膳食计划制定、特殊饮食管理、配餐管理、营养报告这些功能。', type: 'text', timestamp: '2024-07-01 09:35' },
      { id: 'cm13', role: 'assistant', content: '已为您完成需求分析，提取了7个功能点、6个用户故事、5条业务规则和5个数据实体。', type: 'analysis', timestamp: '2024-07-01 09:37' },
      { id: 'cm14', role: 'user', content: '分析得很全面，能生成业务流程图吗？', type: 'text', timestamp: '2024-07-01 09:40' },
      { id: 'cm15', role: 'assistant', content: '业务流程图已生成，包含病人入院、营养评估、膳食制定、配餐配送、营养跟踪的完整流程。', type: 'flowchart', timestamp: '2024-07-01 09:42' },
      { id: 'cm16', role: 'user', content: '很好，生成原型看看效果', type: 'text', timestamp: '2024-07-01 09:45' },
      { id: 'cm17', role: 'assistant', content: '原型已生成，包含首页仪表盘、营养评估页面、膳食计划详情页3个页面，共18个组件。', type: 'prototype', timestamp: '2024-07-01 09:47' },
      { id: 'cm18', role: 'user', content: '原型效果不错，再调整一下配色，用绿色主题更符合医疗健康行业', type: 'text', timestamp: '2024-07-01 10:00' },
      { id: 'cm19', role: 'assistant', content: '已更新主题配色为绿色系，更符合医疗健康行业的视觉风格。', type: 'text', timestamp: '2024-07-01 10:02' },
    ],
  },
];

export const mockTemplates: Template[] = [
  { id: 't1', name: '电商首页', description: '适合电商网站的首页模板', thumbnail: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ecommerce%20website%20homepage%20mockup%20clean%20modern%20design&image_size=square', category: '电商' },
  { id: 't2', name: '后台管理', description: '适合管理系统的后台模板', thumbnail: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=admin%20dashboard%20template%20clean%20modern%20ui&image_size=square', category: '管理' },
  { id: 't3', name: '移动端App', description: '适合移动应用的界面模板', thumbnail: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=mobile%20app%20ui%20mockup%20modern%20design&image_size=square', category: '移动' },
  { id: 't4', name: '企业官网', description: '适合企业展示的官网模板', thumbnail: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=corporate%20website%20homepage%20professional%20design&image_size=square', category: '企业' },
];

export const mockCategories: Category[] = [
  { id: 'cat1', name: '电商', icon: 'ShoppingCart' },
  { id: 'cat2', name: '管理', icon: 'Layout' },
  { id: 'cat3', name: '移动', icon: 'Smartphone' },
  { id: 'cat4', name: '企业', icon: 'Building' },
];

export const componentLibrary = [
  { type: 'button', name: '按钮', icon: 'Square', category: '基础' },
  { type: 'input', name: '输入框', icon: 'Type', category: '基础' },
  { type: 'textarea', name: '文本域', icon: 'AlignLeft', category: '基础' },
  { type: 'checkbox', name: '复选框', icon: 'CheckSquare', category: '基础' },
  { type: 'radio', name: '单选框', icon: 'Circle', category: '基础' },
  { type: 'dropdown', name: '下拉菜单', icon: 'ChevronDown', category: '基础' },
  { type: 'card', name: '卡片', icon: 'LayoutGrid', category: '容器' },
  { type: 'list', name: '列表', icon: 'List', category: '容器' },
  { type: 'navigation', name: '导航栏', icon: 'Navigation', category: '导航' },
  { type: 'form', name: '表单', icon: 'FileText', category: '表单' },
  { type: 'table', name: '表格', icon: 'Table', category: '数据' },
  { type: 'chart', name: '图表', icon: 'BarChart3', category: '数据' },
  { type: 'image', name: '图片', icon: 'Image', category: '媒体' },
  { type: 'modal', name: '弹窗', icon: 'Maximize2', category: '反馈' },
  { type: 'text', name: '文本', icon: 'Type', category: '基础' },
];

export const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    draft: '草稿',
    analyzing: '分析中',
    designing: '设计中',
    reviewing: '审核中',
    completed: '已完成',
  };
  return labels[status] || status;
};

export const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    draft: 'badge-info',
    analyzing: 'badge-warning',
    designing: 'badge-success',
    reviewing: 'badge-medium',
    completed: 'badge-success',
  };
  return colors[status] || 'badge-info';
};
