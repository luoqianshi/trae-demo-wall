/* ============================================================
   文审星 · 评审体验版 — Mock 数据层
   重写全局 fetch，拦截所有 /api/ 请求，返回预设假数据
   ============================================================ */

(function() {
  var _origFetch = window.fetch;

  /* ─── 模拟文档内容 ─── */
  var DEMO_DOC_PARAGRAPHS = [
    "1  范围",
    "本规范规定了应急预案平台的架构设计、功能要求、性能指标和安全规范。",
    "本规范适用于公司所有应急响应相关系统的设计、开发与运维工作。",
    "2  规范性引用文件",
    "下列文件对于本文件的应用是必不可少的，凡是注日期的引用文件，仅注日期的版本适用于本文件。",
    "GB/T 22239-2019 信息安全技术 网络安全等级保护基本要求",
    "GB/T 25069-2020 信息安全技术 术语",
    "GJB 150A-2009 军用设备环境试验方法",
    "3  术语和定义",
    "3.1 应急预案平台：指用于突发事件应急响应指挥、调度和管理的综合性信息系统。",
    "3.2 应急管控平台：本规范后续章节统称为应急平台或简称平台。",
    "3.3 RPO：Recovery Point Objective，恢复点目标，指灾难发生后允许丢失数据的最大时间。",
    "3.4 RTO：Recovery Time Objective，恢复时间目标，指灾难发生后系统恢复运行的最大时间。",
    "4  总体架构",
    "4.1 平台整体采用微服务架构，节点间通过 Kafka 消息总线进行解耦。",
    "4.2 单一集群建议不少于 12 个工作节点，最大可线性扩展至 64 节点。",
    "4.3 平台前端采用 Vue 3 + Ant Design 技术栈，后端采用 FastAPI 框架。",
    "4.4 数据存储层采用 MySQL 主从复制 + Redis 缓存方案。",
    "5  功能要求",
    "5.1 健康检查机制：要求节点每 5 分钟完成一次心跳上报，超过 8 分钟未上报视为失联。",
    "5.2 心跳数据写入 InfluxDB 时序库，保留周期 90 天。",
    "5.3 Kafka 主题按业务域划分，共 14 个核心主题，partition 数 6。",
    "5.4 当某节点连续 3 次心跳失败时，调度器自动触发切流，切流过程不超过 30 秒。",
    "5.5 监控指标采集频率 10 秒，指标项不少于 200 个。",
    "5.6 备份策略：每日全量 + 每 15 分钟增量，RPO ≤ 5 分钟。",
    "6  性能指标",
    "6.1 系统峰值 QPS 不低于 12000，平均响应时间不超过 200ms。",
    "6.2 单节点并发用户数不低于 500，系统整体支持 10000 并发用户。",
    "6.3 数据查询响应时间：95% 请求在 500ms 以内完成。",
    "6.4 平台可用性应达到 99.9%，即年停机时间不超过 8.76 小时。",
    "6.5 系统 QPS 峰值 1.5 万。",
    "7  安全规范",
    "7.1 所有部署均须符合《GB/T 22239-2019》第 8.1.4 节的访问控制要求。",
    "7.2 用户密码长度不少于 8 位，必须包含大小写字母、数字和特殊字符。",
    "7.3 所有 API 接口必须通过 HTTPS 协议访问，禁止明文传输。",
    "7.4 敏感数据（如用户密码、密钥等）必须加密存储，禁止明文保存。",
    "7.5 操作日志保留期限不少于 180 天，日志内容包含操作人、操作时间、操作内容和 IP 地址。",
    "8  运维要求",
    "8.1 系统运行期间，运维人员应每日检查系统运行状态，确保各项指标正常。",
    "8.2 每月进行一次安全漏洞扫描，每季度进行一次渗透测试。",
    "8.3 数据备份应定期进行恢复演练，每半年至少一次完整恢复演练。",
    "8.4 版本发布应遵循灰度发布策略，先在测试环境验证，再逐步扩大范围。",
  ];

  var DEMO_DOC_TEXT = DEMO_DOC_PARAGRAPHS.join('\n\n');

  /* ─── 模拟 issue 数据 ─── */
  var SG_ISSUES = [
    { id:'sg_001', source:'逻辑一致性审查', category:'数据冲突', severity:'high',
      title:'QPS 峰值数据前后不一致',
      snippet:'6.1 系统峰值 QPS 不低于 12000',
      issue:'第 6.1 节写"QPS 不低于 12000"，第 6.5 节写"QPS 峰值 1.5 万"，同一指标两个数值。',
      rationale:'同一份规范内关键性能指标应保持一致，避免读者困惑。',
      suggestion:'统一为 12000 或 15000，并确认最终目标值。',
      confidence:0.96, docParagraphIndex:31, docParagraphText:'6.5 系统 QPS 峰值 1.5 万。' },
    { id:'sg_002', source:'文字校对', category:'错别字', severity:'low',
      title:'"切流"用词不规范',
      snippet:'调度器自动触发切流',
      issue:'"切流"为行业口语化表达，规范文档中建议使用"流量切换"或"故障转移"。',
      rationale:'技术规范应使用标准术语，避免口语化表达。',
      suggestion:'将"切流"改为"流量切换"。',
      confidence:0.82, docParagraphIndex:24, docParagraphText:'5.4 当某节点连续 3 次心跳失败时，调度器自动触发切流，切流过程不超过 30 秒。' },
    { id:'sg_003', source:'格式审查', category:'标点符号', severity:'low',
      title:'英文单位与数字之间缺少空格',
      snippet:'RPO ≤ 5分钟',
      issue:'数字与单位"分钟"之间缺少空格，不符合 GB/T 15835-2011 出版物上数字用法。',
      rationale:'GB/T 15835 规定：阿拉伯数字与单位之间应有半个字的空格。',
      suggestion:'改为"5 分钟"。',
      confidence:0.90, docParagraphIndex:26, docParagraphText:'5.6 备份策略：每日全量 + 每 15 分钟增量，RPO ≤ 5 分钟。' },
    { id:'sg_004', source:'逻辑一致性审查', category:'术语漂移', severity:'low',
      title:'系统名称不统一：应急预案平台/应急管控平台/平台',
      snippet:'3.2 应急管控平台：本规范后续章节统称为应急平台或简称平台。',
      issue:'全文使用了"应急预案平台"、"应急管控平台"、"应急平台"、"平台"四种称法，虽有定义但易造成混淆。',
      rationale:'技术规范中系统名称应统一，建议全文统一为一个主名称。',
      suggestion:'全文统一使用"应急平台"作为主名称，其他名称在定义章节说明即可。',
      confidence:0.88, docParagraphIndex:12, docParagraphText:'3.2 应急管控平台：本规范后续章节统称为应急平台或简称平台。' },
    { id:'sg_005', source:'语法审查', category:'语序不当', severity:'low',
      title:'"不少于"语序问题',
      snippet:'指标项不少于 200 个',
      issue:'"指标项不少于 200 个"语序略拗口，更通顺的表达为"指标项数量不少于 200 个"。',
      rationale:'中文表达中"不少于"修饰数量时，建议明确数量主体。',
      suggestion:'改为"监控指标不少于 200 项"。',
      confidence:0.75, docParagraphIndex:25, docParagraphText:'5.5 监控指标采集频率 10 秒，指标项不少于 200 个。' },
    { id:'sg_006', source:'规则校对', category:'多余空格', severity:'low',
      title:'行首多余空格',
      snippet:'  本规范规定了应急预案平台的架构设计',
      issue:'段落开头存在多余空格（2 个全角空格）。',
      rationale:'中文段落首行缩进应使用格式设置，而非空格字符。',
      suggestion:'删除行首空格，使用段落首行缩进格式。',
      confidence:0.98, docParagraphIndex:1, docParagraphText:'本规范规定了应急预案平台的架构设计、功能要求、性能指标和安全规范。' },
  ];

  var MT_ISSUES = [
    { id:'mt_001', source:'参考资料一致性', category:'数据矛盾', severity:'high',
      title:'心跳失联阈值与参考资料不一致',
      snippet:'超过 8 分钟未上报视为失联',
      issue:'待审文档写"超过 8 分钟视为失联"，参考资料《技术规范 V2.1》第 3.2 节规定为"超过 5 分钟未上报即视为节点故障"。',
      rationale:'关键告警阈值必须与公司标准一致，差异可能导致故障发现延迟。',
      suggestion:'按照参考资料统一为"超过 5 分钟未上报视为失联"。',
      confidence:0.96, docParagraphIndex:22,
      docParagraphText:'5.1 健康检查机制：要求节点每 5 分钟完成一次心跳上报，超过 8 分钟未上报视为失联。',
      refQuote:'第 3.2 节：节点心跳间隔 5 分钟，连续 2 次未上报（超过 5 分钟）即判定失联',
      refName:'参考资料_技术规范_V2.1.md' },
    { id:'mt_002', source:'参考资料一致性', category:'引用断章', severity:'high',
      title:'GB/T 22239-2019 章节引用错误',
      snippet:'第 8.1.4 节的访问控制要求',
      issue:'待审文档引用《GB/T 22239-2019》第 8.1.4 节，但该国标实际章节编号为 8.1.3（访问控制），8.1.4 为"入侵防范"。',
      rationale:'国标引用必须准确，错误引用会影响规范的权威性和可执行性。',
      suggestion:'改为第 8.1.3 节（访问控制），并核对具体条款内容。',
      confidence:0.99, docParagraphIndex:34,
      docParagraphText:'7.1 所有部署均须符合《GB/T 22239-2019》第 8.1.4 节的访问控制要求。',
      refQuote:'GB/T 22239-2019 第 8.1.3 节 访问控制；第 8.1.4 节 入侵防范',
      refName:'参考资料_安全规范.md' },
    { id:'mt_003', source:'逻辑一致性审查', category:'数据冲突', severity:'high',
      title:'QPS 峰值数据前后矛盾',
      snippet:'6.1 系统峰值 QPS 不低于 12000',
      issue:'第 6.1 节写"QPS 不低于 12000"，第 6.5 节写"QPS 峰值 1.5 万"。',
      rationale:'同一份文档关键指标应一致。',
      suggestion:'统一为 12000 或 15000。',
      confidence:0.95, docParagraphIndex:31,
      docParagraphText:'6.5 系统 QPS 峰值 1.5 万。' },
    { id:'mt_004', source:'目录结构审查', category:'结构缺失', severity:'high',
      title:'模板要求的"第 9 章 附录"缺失',
      snippet:'（模板要求第 9 章为附录）',
      issue:'模板规定文档应包含第 9 章附录（含术语对照表、修订记录），但待审文档只有 8 章，缺少附录部分。',
      rationale:'附录是规范文档的标准组成部分，包含术语、修订记录等重要信息。',
      suggestion:'补充第 9 章附录，至少包含术语对照表和修订记录表。',
      confidence:0.92, docParagraphIndex:-1, docParagraphText:'' },
    { id:'mt_005', source:'格式审查', category:'序号错误', severity:'low',
      title:'章节编号层级不统一',
      snippet:'5.1 健康检查机制',
      issue:'第 5 章下的子节使用"5.1"格式，但第 7 章部分内容存在使用"7.1.1"三层编号的情况，层级不统一。',
      rationale:'GB/T 9704 规定了公文层次结构，建议统一层级。',
      suggestion:'统一使用两级编号（5.1、5.2…）或三级编号，保持全文一致。',
      confidence:0.80, docParagraphIndex:22,
      docParagraphText:'5.1 健康检查机制：要求节点每 5 分钟完成一次心跳上报，超过 8 分钟未上报视为失联。' },
    { id:'mt_006', source:'文字校对', category:'错别字', severity:'low',
      title:'"切流"用词不规范',
      snippet:'调度器自动触发切流',
      issue:'建议使用"流量切换"替代口语化表达"切流"。',
      suggestion:'改为"流量切换"。',
      confidence:0.82, docParagraphIndex:24,
      docParagraphText:'5.4 当某节点连续 3 次心跳失败时，调度器自动触发切流，切流过程不超过 30 秒。' },
    { id:'mt_007', source:'参考资料一致性', category:'缺少参考依据', severity:'low',
      title:'"14 个核心主题"缺少参考依据',
      snippet:'共 14 个核心主题，partition 数 6',
      issue:'Kafka 主题数量（14 个）和分区数（6）在参考资料中未找到明确依据，属于待审文档自行规定。',
      rationale:'关键设计参数建议在参考资料中有对应依据，或在文档中标明决策原因。',
      suggestion:'补充设计决策说明，或在参考资料中增加 Kafka 规划章节。',
      confidence:0.70, docParagraphIndex:23,
      docParagraphText:'5.3 Kafka 主题按业务域划分，共 14 个核心主题，partition 数 6。',
      refName:'参考资料_技术规范_V2.1.md' },
    { id:'mt_008', source:'逻辑一致性审查', category:'术语漂移', severity:'low',
      title:'系统名称有四种称法',
      snippet:'应急预案平台 / 应急管控平台 / 应急平台 / 平台',
      issue:'全文使用四种不同名称，虽有定义但易混淆。',
      suggestion:'全文统一使用"应急平台"。',
      confidence:0.88, docParagraphIndex:12,
      docParagraphText:'3.2 应急管控平台：本规范后续章节统称为应急平台或简称平台。' },
  ];

  var SG_STEPS = [
    { name:'规则引擎检查', status:'done', issues:2 },
    { name:'AI语法审查', status:'done', issues:1 },
    { name:'AI格式审查', status:'done', issues:1 },
    { name:'AI文字校对', status:'done', issues:1 },
    { name:'自定义要点审查', status:'done', issues:0 },
    { name:'结果汇总去重', status:'done', issues:6 },
  ];

  var MT_STEPS = [
    { name:'文档解析', status:'done', issues:0 },
    { name:'AI语法审查', status:'done', issues:0 },
    { name:'AI格式审查', status:'done', issues:1 },
    { name:'AI文字校对', status:'done', issues:1 },
    { name:'目录结构审查', status:'done', issues:1 },
    { name:'参考资料一致性审查', status:'done', issues:3 },
    { name:'AI逻辑一致性审查', status:'done', issues:2 },
    { name:'专业常识审查', status:'done', issues:0 },
    { name:'自定义要点审查', status:'done', issues:0 },
    { name:'结果汇总去重', status:'done', issues:8 },
  ];

  /* ─── 历史记录 ─── */
  var HISTORY_ITEMS = [
    { id:20260710001, mode:'multi', source_name:'待审查_安全设计文档_04.docx',
      target_name:'安全规范.md, 技术规范_V2.1.md, 设计规范.md',
      status:'done', issue_count:8,
      created_at:'2026-07-10 14:32:18',
      created_at_display:'2026-07-10 14:32',
      retention_days_remaining:'剩 28 天' },
    { id:20260710002, mode:'single', source_name:'应急预案平台技术规范.docx',
      target_name:'—',
      status:'done', issue_count:6,
      created_at:'2026-07-10 11:05:42',
      created_at_display:'2026-07-10 11:05',
      retention_days_remaining:'剩 28 天' },
    { id:20260709003, mode:'multi', source_name:'产品需求说明书_v3.docx',
      target_name:'项目合同.docx, API接口规范.docx',
      status:'done', issue_count:12,
      created_at:'2026-07-09 16:48:03',
      created_at_display:'2026-07-09 16:48',
      retention_days_remaining:'剩 27 天' },
    { id:20260709002, mode:'single', source_name:'错别字词测试-图片和表格.docx',
      target_name:'—',
      status:'done', issue_count:23,
      created_at:'2026-07-09 10:22:55',
      created_at_display:'2026-07-09 10:22',
      retention_days_remaining:'剩 27 天' },
    { id:20260708001, mode:'multi', source_name:'硬件配置规范_v1.2.docx',
      target_name:'数据字典.docx, 运营指标规范.md',
      status:'done', issue_count:5,
      created_at:'2026-07-08 09:15:30',
      created_at_display:'2026-07-08 09:15',
      retention_days_remaining:'剩 26 天' },
  ];

  /* ─── 审查进度（按步推进） ─── */
  function buildSgProgress(stepsDone, status) {
    var steps = SG_STEPS.map(function(s, i) {
      return {
        name: s.name,
        status: i < stepsDone ? 'done' : (i === stepsDone ? status : 'pending'),
        issues: i < stepsDone ? s.issues : undefined,
      };
    });
    var doneCount = steps.filter(function(s) { return s.status === 'done'; }).length;
    var partialIssues = SG_ISSUES.slice(0, Math.min(doneCount, SG_ISSUES.length));
    return {
      detail: { steps: steps, partialIssues: partialIssues,
        docText: DEMO_DOC_TEXT, content: DEMO_DOC_PARAGRAPHS.map(function(p, i) { return { type:'paragraph', text:p, index:i }; }) },
      status: status,
      issue_count: SG_ISSUES.length,
    };
  }

  function buildMtProgress(stepsDone, status) {
    var steps = MT_STEPS.map(function(s, i) {
      return {
        name: s.name,
        status: i < stepsDone ? 'done' : (i === stepsDone ? status : 'pending'),
        issues: i < stepsDone ? s.issues : undefined,
      };
    });
    var doneCount = steps.filter(function(s) { return s.status === 'done'; }).length;
    var partialIssues = MT_ISSUES.slice(0, Math.min(doneCount, MT_ISSUES.length));
    return {
      detail: {
        steps: steps,
        partialIssues: partialIssues,
        docText: DEMO_DOC_TEXT,
        content: DEMO_DOC_PARAGRAPHS.map(function(p, i) { return { type:'paragraph', text:p, index:i }; }),
        references: [
          { name:'参考资料_安全规范.md', text:'安全规范全文…' },
          { name:'参考资料_技术规范_V2.1.md', text:'技术规范全文…' },
          { name:'参考资料_设计规范.md', text:'设计规范全文…' },
        ],
        structureIssues: MT_ISSUES.filter(function(i) { return i.source === '目录结构审查'; }),
      },
      status: status,
      issue_count: MT_ISSUES.length,
    };
  }

  /* ─── 任务状态机 ─── */
  var tasks = {};

  function startTask(mode, recordId) {
    tasks[recordId] = { mode: mode, startedAt: Date.now(), step: 0, done: false };
  }

  function getTaskProgress(recordId) {
    var t = tasks[recordId];
    if (!t) return null;
    var totalSteps = t.mode === 'single' ? SG_STEPS.length : MT_STEPS.length;
    var elapsed = (Date.now() - t.startedAt) / 1000;
    var stepDuration = 1.2;
    var currentStep = Math.min(Math.floor(elapsed / stepDuration), totalSteps);
    var isRunning = currentStep < totalSteps;
    var stepStatus = isRunning ? 'running' : 'done';
    var overallStatus = isRunning ? 'running' : 'done';
    if (currentStep >= totalSteps) { t.done = true; }
    var prog = t.mode === 'single'
      ? buildSgProgress(currentStep, currentStep >= totalSteps ? 'done' : stepStatus)
      : buildMtProgress(currentStep, currentStep >= totalSteps ? 'done' : stepStatus);
    return {
      id: recordId, mode: t.mode,
      status: overallStatus,
      issue_count: t.mode === 'single' ? SG_ISSUES.length : MT_ISSUES.length,
      updated_at: new Date().toISOString(),
      detail: prog.detail,
    };
  }

  function getFullResult(recordId) {
    var t = tasks[recordId];
    if (!t) return null;
    var issues = t.mode === 'single' ? SG_ISSUES : MT_ISSUES;
    return {
      id: recordId, mode: t.mode, status:'done',
      issue_count: issues.length,
      source_name: t.mode === 'single' ? '应急预案平台技术规范.docx' : '待审查_安全设计文档_04.docx',
      target_name: t.mode === 'multi' ? '安全规范.md, 技术规范_V2.1.md' : '—',
      detail: {
        issues: issues,
        docText: DEMO_DOC_TEXT,
        content: DEMO_DOC_PARAGRAPHS.map(function(p, i) { return { type:'paragraph', text:p, index:i }; }),
        steps: t.mode === 'single' ? SG_STEPS : MT_STEPS,
        tables: [], images: [],
        structureIssues: t.mode === 'multi' ? MT_ISSUES.filter(function(i){ return i.source === '目录结构审查'; }) : [],
        references: t.mode === 'multi' ? [
          { name:'参考资料_安全规范.md' },
          { name:'参考资料_技术规范_V2.1.md' },
          { name:'参考资料_设计规范.md' },
        ] : [],
      },
    };
  }

  /* ─── Mock fetch ─── */
  function jsonResponse(data, status) {
    return new Response(JSON.stringify(data), {
      status: status || 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  function mockFetch(input, init) {
    var url = typeof input === 'string' ? input : (input && input.url ? input.url : '');
    var method = (init && init.method) || 'GET';

    /* 登录 */
    if (url.endsWith('/api/login') && method === 'POST') {
      return Promise.resolve(jsonResponse({
        success: true,
        userId: 'admin',
        displayName: '评审体验员',
      }));
    }

    /* 登出 */
    if (url.endsWith('/api/logout')) {
      return Promise.resolve(jsonResponse({ success: true }));
    }

    /* 当前用户 */
    if (url.endsWith('/api/me')) {
      return Promise.resolve(jsonResponse({
        success: true,
        user: { userId: 'admin', displayName: '评审体验员', role: 'admin' }
      }));
    }

    /* 文档解析 */
    if (url.indexOf('/api/docx/parse') >= 0) {
      return Promise.resolve(jsonResponse({
        markdown: DEMO_DOC_TEXT,
        content: DEMO_DOC_PARAGRAPHS.map(function(p, i) { return { type:'paragraph', text:p, index:i }; }),
        paragraphs: DEMO_DOC_PARAGRAPHS,
        tables: [], images: [],
        word_count: DEMO_DOC_TEXT.length,
      }));
    }

    /* 单文档校对启动 */
    if (url.endsWith('/api/check/single')) {
      var recordId = 'sg_' + Date.now();
      startTask('single', recordId);
      return Promise.resolve(jsonResponse({ recordId: recordId, status: 'queued' }));
    }

    /* 多文档比对启动 */
    if (url.endsWith('/api/check/multi')) {
      var recordId2 = 'mt_' + Date.now();
      startTask('multi', recordId2);
      return Promise.resolve(jsonResponse({ recordId: recordId2, status: 'queued' }));
    }

    /* 审查进度（progress 路径） */
    var mProgress = url.match(/\/api\/history\/([^/]+)\/progress$/);
    if (mProgress) {
      var rid = mProgress[1];
      var prog = getTaskProgress(rid);
      if (!prog) return Promise.resolve(jsonResponse({ detail: 'not found' }, 404));
      return Promise.resolve(jsonResponse({ item: prog }));
    }

    /* 审查历史详情 */
    var mHist = url.match(/\/api\/history\/([^/?]+)/);
    if (mHist) {
      var rid2 = mHist[1];
      var includeContent = url.indexOf('include_content=true') >= 0;
      if (tasks[rid2]) {
        var tp = getTaskProgress(rid2);
        if (includeContent && tp.status === 'done') {
          tp = getFullResult(rid2);
        }
        return Promise.resolve(jsonResponse({ item: tp }));
      }
      var hist = HISTORY_ITEMS.find(function(h) { return String(h.id) === String(rid2); });
      if (hist) {
        var isMulti = hist.mode === 'multi';
        var issues = isMulti ? MT_ISSUES : SG_ISSUES;
        var detail = {
          issues: includeContent ? issues : [],
          docText: includeContent ? DEMO_DOC_TEXT : '',
          content: includeContent ? DEMO_DOC_PARAGRAPHS.map(function(p, i) { return { type:'paragraph', text:p, index:i }; }) : [],
          steps: isMulti ? MT_STEPS : SG_STEPS,
          tables: [], images: [],
          structureIssues: isMulti ? [MT_ISSUES[3]] : [],
        };
        return Promise.resolve(jsonResponse({
          item: {
            id: hist.id, mode: hist.mode, status: hist.status,
            issue_count: hist.issue_count,
            source_name: hist.source_name,
            target_name: hist.target_name,
            created_at: hist.created_at,
            updated_at: hist.created_at,
            detail: detail,
          }
        }));
      }
      return Promise.resolve(jsonResponse({ detail: 'not found' }, 404));
    }

    /* 历史列表 */
    if (url.indexOf('/api/history') >= 0 && url.indexOf('/history/') < 0) {
      return Promise.resolve(jsonResponse({
        items: HISTORY_ITEMS,
        total: HISTORY_ITEMS.length,
        page: 1, page_size: 20,
      }));
    }

    /* 审查偏好 */
    if (url.endsWith('/api/preferences') && method === 'GET') {
      return Promise.resolve(jsonResponse({
        focusItems: [
          { id:'f1', text:'检查文档内部数据一致性', enabled:true },
          { id:'f2', text:'检查引用国标编号准确性', enabled:true },
          { id:'f3', text:'检查术语统一', enabled:true },
        ],
        habits: { autoStart: false, defaultMode: 'single' },
      }));
    }

    if (url.endsWith('/api/preferences') && method === 'POST') {
      return Promise.resolve(jsonResponse({ success: true }));
    }

    /* 审查要点文件 */
    if (url.indexOf('/api/preferences/focus-files') >= 0 && method === 'GET') {
      return Promise.resolve(jsonResponse({
        files: [
          { fileId:'ff1', fileName:'安全审查要点.txt', size: 1024, createdAt:'2026-07-01' },
          { fileId:'ff2', fileName:'项目规范审查清单.docx', size: 4096, createdAt:'2026-06-15' },
        ]
      }));
    }

    if (url.indexOf('/api/preferences/focus-files') >= 0 && method === 'POST') {
      return Promise.resolve(jsonResponse({ fileId: 'ff_new', fileName: '新上传要点.txt', size: 2048 }));
    }

    if (url.indexOf('/api/preferences/focus-files/') >= 0 && method === 'DELETE') {
      return Promise.resolve(jsonResponse({ success: true }));
    }

    /* 模板管理 */
    if (url.endsWith('/api/preferences/templates')) {
      return Promise.resolve(jsonResponse({
        templates: [
          { sha256:'abc123', name:'标准技术规范模板.docx', usedAt:'2026-07-10', sectionCount: 12, createdAt:'2026-05-01' },
          { sha256:'def456', name:'安全设计文档模板.docx', usedAt:'2026-07-09', sectionCount: 9, createdAt:'2026-06-10' },
        ]
      }));
    }

    /* 记忆 */
    if (url.endsWith('/api/memories')) {
      return Promise.resolve(jsonResponse({
        items: [
          { id:'m1', content:'用户偏好严格的数据一致性审查', type:'preference', created_at:'2026-07-08' },
          { id:'m2', content:'团队术语：统一使用"应急平台"', type:'terminology', created_at:'2026-07-05' },
          { id:'m3', content:'用户常用审查模式：多文档比对', type:'habit', created_at:'2026-07-01' },
        ]
      }));
    }

    /* 问题反馈 */
    if (url.indexOf('/api/issues/feedback') >= 0 && method === 'POST') {
      return Promise.resolve(jsonResponse({ success: true }));
    }

    if (url.indexOf('/api/issues/feedback') >= 0 && method === 'GET') {
      return Promise.resolve(jsonResponse({ items: [] }));
    }

    /* 报告导出 */
    if (url.indexOf('/api/report/export') >= 0) {
      return Promise.resolve(new Blob(['模拟报告内容'], { type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }));
    }

    /* 取消审查 */
    if (url.indexOf('/api/review/cancel/') >= 0) {
      return Promise.resolve(jsonResponse({ success: true, status: 'cancelled' }));
    }

    /* 健康检查 */
    if (url.endsWith('/api/health')) {
      return Promise.resolve(jsonResponse({ status: 'ok', version: '0.1.0' }));
    }

    /* SSO */
    if (url.endsWith('/api/sso')) {
      return Promise.resolve(jsonResponse({ success: false, detail: 'SSO not available in demo' }, 400));
    }

    /* 未命中：透传 */
    return _origFetch.apply(window, arguments);
  }

  window.fetch = function(input, init) {
    try {
      var url = typeof input === 'string' ? input : (input && input.url ? input.url : '');
      if (url.indexOf('/api/') >= 0) {
        return mockFetch(input, init);
      }
    } catch (e) { console.warn('mock fetch error', e); }
    return _origFetch.apply(window, arguments);
  };

  /* 评审体验版横幅 + 强制自动登录 */
  window.addEventListener('load', function() {
    var bar = document.createElement('div');
    bar.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;background:linear-gradient(90deg,#C73E1D,#B8762A);color:#FAF7F0;font-family:ui-monospace,monospace;font-size:11px;letter-spacing:.15em;text-align:center;padding:6px 12px;text-transform:uppercase;';
    bar.innerHTML = '⭐ 评审体验版 · 数据为预设模拟 · 不调用真实后端 &nbsp;|&nbsp; 👋 欢迎体验文审星核心功能';
    document.body.appendChild(bar);
    document.body.style.paddingTop = '28px';

    /* 强制绕过登录：等待主脚本初始化完成后直接进入首页 */
    var autoLoginTries = 0;
    var autoLoginTimer = setInterval(function() {
      autoLoginTries++;
      if (autoLoginTries > 30) { clearInterval(autoLoginTimer); return; }
      if (typeof state === 'undefined' || typeof navTo !== 'function' || typeof renderPage !== 'function') return;
      if (state.user) { clearInterval(autoLoginTimer); return; }
      clearInterval(autoLoginTimer);
      try {
        state.user = { userId: 'admin', displayName: '评审体验员' };
        var siderUser = document.getElementById('sider-user');
        var topbarUser = document.getElementById('topbar-user');
        var btnLogout = document.getElementById('btn-logout');
        if (siderUser) siderUser.textContent = '当前用户：评审体验员';
        if (topbarUser) topbarUser.textContent = '评审体验员';
        if (btnLogout) btnLogout.style.display = '';
        if (typeof loadUserPreferences === 'function') loadUserPreferences().catch(function(){});
        if (typeof attachFocusAutoSave === 'function') { try { attachFocusAutoSave(); } catch(e){} }
        if (typeof loadFocusFiles === 'function') { try { loadFocusFiles(); } catch(e){} }
        location.hash = '#/home';
        navTo('home');
      } catch(e) { console.warn('auto login failed', e); }
    }, 100);
  });
})();
