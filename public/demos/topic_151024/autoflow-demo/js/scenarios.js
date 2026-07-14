/**
 * AutoFlow — 预置智能场景数据
 * 模拟 AI 对自然语言任务的解析能力
 */
const Scenarios = {

  // 场景1：数据导出+整理+发送
  dataExport: {
    id: 'data-export',
    name: 'OA数据导出与汇报',
    icon: '📊',
    category: '数据搬运',
    inputText: '每天早上9点从OA系统导出昨日销售数据，整理成Excel发到部门群',
    keywords: ['导出', '销售', '数据', 'OA', '整理', 'excel', '发送', '群', '每天', '9点'],
    parsed: {
      taskName: '每日销售数据自动导出与汇报',
      trigger: '定时触发 · 每日 09:00',
      schedule: '0 9 * * *',
      confidence: 96,
      steps: [
        {
          id: 's1', title: '登录 OA 系统', icon: '🔐', type: 'auth',
          detail: '自动填充账号密码 → 完成登录验证 → 进入销售数据模块',
          logs: [
            { t: '09:00:01', level: 'info', msg: '正在访问 OA 系统...' },
            { t: '09:00:03', level: 'ok', msg: '页面加载完成' },
            { t: '09:00:05', level: 'info', msg: '自动填充登录凭证...' },
            { t: '09:00:08', level: 'ok', msg: '登录成功，进入工作台' },
          ]
        },
        {
          id: 's2', title: '导出昨日销售数据', icon: '📥', type: 'export',
          detail: '导航至销售报表 → 选择日期范围（昨日）→ 点击导出 → 等待生成',
          logs: [
            { t: '09:00:10', level: 'info', msg: '导航至：销售管理 > 报表中心' },
            { t: '09:00:14', level: 'info', msg: '设置日期范围：2026-06-28' },
            { t: '09:00:16', level: 'info', msg: '点击导出按钮...' },
            { t: '09:00:24', level: 'info', msg: '系统生成中，请稍候...' },
            { t: '09:00:32', level: 'ok', msg: '数据导出完成，共 1,247 条记录' },
          ]
        },
        {
          id: 's3', title: '数据格式化整理', icon: '🔄', type: 'process',
          detail: '读取原始CSV → 清洗空行 → 按区域排序 → 生成Excel文件',
          logs: [
            { t: '09:00:34', level: 'info', msg: '读取原始数据文件...' },
            { t: '09:00:36', level: 'info', msg: '清洗数据：移除 3 条空记录' },
            { t: '09:00:38', level: 'info', msg: '按区域汇总统计...' },
            { t: '09:00:40', level: 'info', msg: '生成 Excel 格式文件...' },
            { t: '09:00:42', level: 'ok', msg: '文件已生成：sales_20260628.xlsx (248KB)' },
          ]
        },
        {
          id: 's4', title: '发送到部门群', icon: '💬', type: 'notify',
          detail: '打开飞书群聊 → 上传Excel附件 → 发送汇报消息',
          logs: [
            { t: '09:00:44', level: 'info', msg: '连接飞书 API...' },
            { t: '09:00:46', level: 'info', msg: '定位群聊：销售部日常群' },
            { t: '09:00:48', level: 'info', msg: '上传附件 sales_20260628.xlsx...' },
            { t: '09:00:52', level: 'info', msg: '发送汇报消息...' },
            { t: '09:00:54', level: 'ok', msg: '消息发送成功！' },
          ]
        }
      ]
    },
    result: {
      summary: '任务执行成功，已自动完成数据导出与群消息发送',
      metrics: [
        { label: '处理记录', value: '1,247' },
        { label: '耗时', value: '53s' },
        { label: '节省人工', value: '~25min' },
      ]
    }
  },

  // 场景2：竞品信息采集
  infoCollect: {
    id: 'info-collect',
    name: '竞品价格监控',
    icon: '🔍',
    category: '信息采集',
    inputText: '每周五下午从竞品网站采集价格信息，生成对比报告',
    keywords: ['采集', '价格', '竞品', '网站', '报告', '每周', '周五', '对比', '监控'],
    parsed: {
      taskName: '竞品价格定期采集与对比分析',
      trigger: '定时触发 · 每周五 15:00',
      schedule: '0 15 * * 5',
      confidence: 94,
      steps: [
        {
          id: 's1', title: '访问竞品网站', icon: '🌐', type: 'navigate',
          detail: '打开3个竞品官网 → 定位产品定价页面 → 等待页面加载',
          logs: [
            { t: '15:00:01', level: 'info', msg: '启动浏览器自动化引擎...' },
            { t: '15:00:04', level: 'info', msg: '访问竞品A：example-a.com/pricing' },
            { t: '15:00:08', level: 'ok', msg: '竞品A页面加载完成' },
            { t: '15:00:10', level: 'info', msg: '访问竞品B：example-b.com/plans' },
            { t: '15:00:14', level: 'ok', msg: '竞品B页面加载完成' },
            { t: '15:00:16', level: 'info', msg: '访问竞品C：example-c.com/price' },
            { t: '15:00:20', level: 'ok', msg: '竞品C页面加载完成' },
          ]
        },
        {
          id: 's2', title: '提取价格信息', icon: '🎯', type: 'extract',
          detail: 'AI识别价格元素 → 提取套餐名称、价格、功能列表 → 结构化存储',
          logs: [
            { t: '15:00:22', level: 'info', msg: 'AI 视觉模型分析页面结构...' },
            { t: '15:00:26', level: 'info', msg: '竞品A：提取到 4 个套餐价格' },
            { t: '15:00:30', level: 'info', msg: '竞品B：提取到 3 个套餐价格' },
            { t: '15:00:34', level: 'info', msg: '竞品C：提取到 5 个套餐价格' },
            { t: '15:00:36', level: 'ok', msg: '共提取 12 条价格数据' },
          ]
        },
        {
          id: 's3', title: '生成对比报告', icon: '📝', type: 'process',
          detail: '数据清洗去重 → 按套餐层级对齐 → 计算价格差异 → 生成HTML报告',
          logs: [
            { t: '15:00:38', level: 'info', msg: '数据清洗与去重...' },
            { t: '15:00:40', level: 'info', msg: '按套餐层级对齐...' },
            { t: '15:00:42', level: 'info', msg: '计算价格差异百分比...' },
            { t: '15:00:44', level: 'info', msg: '渲染对比表格与图表...' },
            { t: '15:00:46', level: 'ok', msg: '报告生成完成：price_compare_w26.html' },
          ]
        },
        {
          id: 's4', title: '推送报告通知', icon: '📧', type: 'notify',
          detail: '发送邮件给产品团队 → 附带报告链接 → 飞书群同步摘要',
          logs: [
            { t: '15:00:48', level: 'info', msg: '发送邮件至 product@company.com...' },
            { t: '15:00:52', level: 'ok', msg: '邮件发送成功' },
            { t: '15:00:54', level: 'info', msg: '飞书群同步摘要...' },
            { t: '15:00:56', level: 'ok', msg: '群消息发送成功' },
          ]
        }
      ]
    },
    result: {
      summary: '已完成3个竞品的价格采集与对比分析',
      metrics: [
        { label: '采集数据', value: '12条' },
        { label: '耗时', value: '55s' },
        { label: '节省人工', value: '~40min' },
      ]
    }
  },

  // 场景3：文件批量处理
  fileProcess: {
    id: 'file-process',
    name: '文件自动归档',
    icon: '📁',
    category: '文件处理',
    inputText: '把下载文件夹里的图片按日期分类，压缩后上传到云盘',
    keywords: ['文件', '图片', '分类', '日期', '压缩', '上传', '云盘', '下载', '整理'],
    parsed: {
      taskName: '下载文件夹图片自动归档',
      trigger: '手动触发 · 立即执行',
      schedule: null,
      confidence: 92,
      steps: [
        {
          id: 's1', title: '扫描下载文件夹', icon: '📂', type: 'scan',
          detail: '遍历 ~/Downloads 目录 → 筛选图片文件 → 按日期分组',
          logs: [
            { t: '00:00:01', level: 'info', msg: '扫描目录：~/Downloads ...' },
            { t: '00:00:03', level: 'info', msg: '发现文件 186 个' },
            { t: '00:00:04', level: 'info', msg: '筛选图片文件（jpg/png/webp）...' },
            { t: '00:00:06', level: 'ok', msg: '找到图片文件 94 个' },
          ]
        },
        {
          id: 's2', title: '按日期分类整理', icon: '🗓️', type: 'process',
          detail: '读取EXIF日期 → 按年月创建文件夹 → 移动图片到对应目录',
          logs: [
            { t: '00:00:08', level: 'info', msg: '读取图片元数据...' },
            { t: '00:00:12', level: 'info', msg: '创建分类文件夹：2026-03, 2026-04, 2026-05, 2026-06' },
            { t: '00:00:14', level: 'info', msg: '移动文件至对应目录...' },
            { t: '00:00:18', level: 'ok', msg: '94 个文件已分类完成' },
          ]
        },
        {
          id: 's3', title: '压缩打包', icon: '📦', type: 'process',
          detail: '按月份生成ZIP压缩包 → 优化压缩率 → 校验文件完整性',
          logs: [
            { t: '00:00:20', level: 'info', msg: '压缩 2026-03：23 张图片...' },
            { t: '00:00:24', level: 'ok', msg: '2026-03.zip (45.2MB)' },
            { t: '00:00:26', level: 'info', msg: '压缩 2026-04：31 张图片...' },
            { t: '00:00:31', level: 'ok', msg: '2026-04.zip (62.8MB)' },
            { t: '00:00:33', level: 'info', msg: '压缩 2026-05：28 张图片...' },
            { t: '00:00:37', level: 'ok', msg: '2026-05.zip (51.4MB)' },
            { t: '00:00:39', level: 'info', msg: '压缩 2026-06：12 张图片...' },
            { t: '00:00:42', level: 'ok', msg: '2026-06.zip (22.1MB)' },
          ]
        },
        {
          id: 's4', title: '上传到云盘', icon: '☁️', type: 'upload',
          detail: '连接云盘API → 创建目标文件夹 → 上传4个ZIP文件 → 生成分享链接',
          logs: [
            { t: '00:00:44', level: 'info', msg: '连接云盘服务...' },
            { t: '00:00:46', level: 'info', msg: '创建文件夹：/图片归档/2026Q2' },
            { t: '00:00:48', level: 'info', msg: '上传 2026-03.zip ...' },
            { t: '00:00:52', level: 'ok', msg: '上传完成' },
            { t: '00:00:54', level: 'info', msg: '上传 2026-04.zip ...' },
            { t: '00:00:59', level: 'ok', msg: '上传完成' },
            { t: '00:01:01', level: 'info', msg: '上传 2026-05.zip ...' },
            { t: '00:01:05', level: 'ok', msg: '上传完成' },
            { t: '00:01:07', level: 'info', msg: '上传 2026-06.zip ...' },
            { t: '00:01:10', level: 'ok', msg: '上传完成，已生成分享链接' },
          ]
        }
      ]
    },
    result: {
      summary: '94张图片已归档、压缩并上传至云盘',
      metrics: [
        { label: '处理文件', value: '94' },
        { label: '压缩包', value: '4个' },
        { label: '节省人工', value: '~35min' },
      ]
    }
  },

  // 场景4：表单自动填写
  formFill: {
    id: 'form-fill',
    name: '报销单自动填写',
    icon: '✍️',
    category: '表单填写',
    inputText: '自动填写月度报销单，金额从消费记录中统计',
    keywords: ['填写', '报销', '表单', '金额', '消费', '统计', '记录', '月度', '自动'],
    parsed: {
      taskName: '月度报销单自动填写',
      trigger: '手动触发 · 每月末',
      schedule: '0 17 28-31 * *',
      confidence: 90,
      steps: [
        {
          id: 's1', title: '读取消费记录', icon: '💳', type: 'extract',
          detail: '连接财务系统 → 获取本月消费记录 → 按类别归类统计',
          logs: [
            { t: '00:00:01', level: 'info', msg: '连接财务系统API...' },
            { t: '00:00:04', level: 'info', msg: '获取本月消费记录...' },
            { t: '00:00:08', level: 'info', msg: '解析记录：交通 15 条, 餐饮 22 条, 办公 8 条' },
            { t: '00:00:10', level: 'ok', msg: '共获取 45 条消费记录' },
          ]
        },
        {
          id: 's2', title: '智能分类汇总', icon: '🧮', type: 'process',
          detail: 'AI识别消费类别 → 按报销政策匹配 → 计算可报销金额',
          logs: [
            { t: '00:00:12', level: 'info', msg: 'AI 分析消费类别...' },
            { t: '00:00:16', level: 'info', msg: '匹配报销政策...' },
            { t: '00:00:18', level: 'info', msg: '交通费：¥1,280.00' },
            { t: '00:00:19', level: 'info', msg: '餐饮费：¥2,450.00' },
            { t: '00:00:20', level: 'info', msg: '办公费：¥860.00' },
            { t: '00:00:22', level: 'ok', msg: '可报销总额：¥4,590.00' },
          ]
        },
        {
          id: 's3', title: '填写报销表单', icon: '📝', type: 'fill',
          detail: '打开报销系统 → 自动填充各字段 → 上传消费凭证 → 检查必填项',
          logs: [
            { t: '00:00:24', level: 'info', msg: '打开报销系统...' },
            { t: '00:00:28', level: 'info', msg: '填写报销人信息...' },
            { t: '00:00:30', level: 'info', msg: '填写交通费明细（15条）...' },
            { t: '00:00:34', level: 'info', msg: '填写餐饮费明细（22条）...' },
            { t: '00:00:38', level: 'info', msg: '填写办公费明细（8条）...' },
            { t: '00:00:40', level: 'info', msg: '上传电子凭证 45 份...' },
            { t: '00:00:44', level: 'ok', msg: '表单填写完成，必填项已检查' },
          ]
        },
        {
          id: 's4', title: '提交并通知审批', icon: '📨', type: 'submit',
          detail: '提交报销单 → 发送审批通知给直属上级 → 记录报销单号',
          logs: [
            { t: '00:00:46', level: 'info', msg: '提交报销单...' },
            { t: '00:00:50', level: 'ok', msg: '提交成功，单号：BX-202606-0042' },
            { t: '00:00:52', level: 'info', msg: '发送审批通知至：张经理' },
            { t: '00:00:54', level: 'ok', msg: '通知已发送' },
          ]
        }
      ]
    },
    result: {
      summary: '月度报销单已自动填写并提交审批',
      metrics: [
        { label: '报销金额', value: '¥4,590' },
        { label: '消费记录', value: '45条' },
        { label: '节省人工', value: '~30min' },
      ]
    }
  },

  // 获取所有场景
  all() {
    return [this.dataExport, this.infoCollect, this.fileProcess, this.formFill];
  },

  // 获取示例文本列表
  examples() {
    return this.all().map(s => s.inputText);
  },

  // 模糊匹配场景
  match(input) {
    if (!input || input.trim().length < 5) return null;
    const text = input.toLowerCase();
    let best = null;
    let bestScore = 0;
    for (const scenario of this.all()) {
      let score = 0;
      for (const kw of scenario.keywords) {
        if (text.includes(kw.toLowerCase())) score++;
      }
      score = score / scenario.keywords.length;
      if (score > bestScore) {
        bestScore = score;
        best = scenario;
      }
    }
    // 如果匹配度太低，返回默认场景（用第一个）
    if (bestScore < 0.15) {
      best = this.dataExport;
      bestScore = 0;
    }
    return { scenario: best, confidence: Math.max(Math.round(bestScore * 100), 72) };
  }
};

// 插件市场数据
const Plugins = [
  { id: 'feishu', name: '飞书', icon: '🐦', color: '#3370ff', cat: '即时通讯', desc: '发送消息、创建群聊、上传文件、管理日历', installs: '12.4k', installed: true },
  { id: 'dingtalk', name: '钉钉', icon: '💬', color: '#1677ff', cat: '即时通讯', desc: '消息推送、审批流程、智能填表、工作通知', installs: '8.7k', installed: true },
  { id: 'wecom', name: '企业微信', icon: '💼', color: '#07c160', cat: '即时通讯', desc: '客户管理、群发消息、应用消息、通讯录同步', installs: '6.2k', installed: false },
  { id: 'notion', name: 'Notion', icon: '📝', color: '#000000', cat: '文档协作', desc: '创建页面、编辑文档、查询数据库、管理知识库', installs: '9.1k', installed: false },
  { id: 'googlesheets', name: 'Google Sheets', icon: '📈', color: '#0f9d58', cat: '数据表格', desc: '读写单元格、公式计算、数据透视、图表生成', installs: '7.8k', installed: false },
  { id: 'github', name: 'GitHub', icon: '🐙', color: '#181717', cat: '开发工具', desc: 'Issue管理、PR通知、代码审查、CI/CD触发', installs: '11.3k', installed: false },
  { id: 'email', name: '邮件服务', icon: '📧', color: '#ea4335', cat: '通信', desc: '发送邮件、模板渲染、附件处理、定时发送', installs: '15.6k', installed: true },
  { id: 'webdav', name: '云盘存储', icon: '☁️', color: '#4285f4', cat: '文件存储', desc: '文件上传下载、目录管理、分享链接、版本控制', installs: '5.4k', installed: false },
  { id: 'slack', name: 'Slack', icon: '🔔', color: '#4a154b', cat: '即时通讯', desc: '频道消息、私信通知、文件分享、工作流触发', installs: '4.2k', installed: false },
];
