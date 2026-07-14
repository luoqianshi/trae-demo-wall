/* ============================================
   知序 KBRefiner - 示例数据层
   ============================================ */

window.SAMPLE_DATA = {

  dirty_doc: {
    title: "星辰通信有限公司企业通讯平台技术规范v2.3",
    doc_type: "技术运维",
    raw_text: "企业通讯平台技术规范 v2.3\n发布日期：2024/03/15\n生效日期：2024年03月20日\n编制部门：技术研发部\n\n一、概述\n本规范规定了星辰通信有限公司企业通讯平台的技术架构、部署方案、运维规范及接口规范。\n\n二、服务器配置要求\n2.1 主服务器\n- 操作系统：CentOS 7.9 或 Ubuntu 20.04 LTS\n- CPU：不低于 16 核 Intel Xeon 或同等 AMD EPYC\n- 内存：不低于 64GB DDR4 ECC\n- 硬盘：SSD 500GB（系统盘）+ HDD 2TB（数据盘）\n- 数据库密码：WY-25597（初始密码，首次登录后强制修改）\n\n2.2 备份服务器\n- 配置同主服务器，数据盘增加至 4TB\n- 数据库备份密码同主服务器，见 2.1 节\n\n三、接口参数配置\n3.1 消息推送接口\n- 接口地址：https://api.xinchen-internal.com/v2/message/push\n- API Key Salt值：xckey_s4lt_2024_prod（用于签名校验）\n- 请求格式：JSON\n- 超时设置：30000ms\n\n3.2 用户认证接口\n- 接口地址：https://api.xinchen-internal.com/v2/auth/verify\n- API Key Salt值：xckey_s4lt_2024_prod（同消息推送接口）\n- Token 有效期：7200秒（2小时）\n\n四、常见问题（FAQ）\nQ1：消息推送失败怎么办？\nA1：请检查API Key是否正确，确认网络连通性，查看服务端日志。\n\nQ2：如何重置管理员密码？\nA2：联系IT运维部门，填写《密码重置申请单》。\n\nQ3：消息推送失败怎么办？（注：重复问题）\nA3：参考Q1的解答。\n\n五、部署流程\n5.1 环境准备\n5.2 服务部署\n- 部署顺序：数据库 -> 消息队列 -> 核心服务 -> 前端页面\n- 配置文件路径：/etc/xinchen-comm/config/\n\n六、版本历史\nv2.3 - 2024年3月15日 - 新增消息推送接口\nv2.2 - 2023/11/08 - 修复认证超时问题\nv2.1 - 2023.09.01 - 优化数据库连接池\nv2.0 - 2023/06/15 - 初始版本发布",
    issues: [
      { id: "ISS-001", type: "格式混乱", severity: "low", location: "发布日期与生效日期", description: "日期格式不统一，四种格式混用", line_hint: "开头及第六章版本历史" },
      { id: "ISS-002", type: "敏感数据", severity: "critical", location: "第二章 2.1节", description: "明文记录数据库初始密码 WY-25597", line_hint: "数据库密码：WY-25597" },
      { id: "ISS-003", type: "敏感数据", severity: "critical", location: "第三章 3.1节、3.2节", description: "明文记录 API Key Salt 值 xckey_s4lt_2024_prod", line_hint: "API Key Salt值" },
      { id: "ISS-004", type: "重复冗余", severity: "medium", location: "第四章 Q3", description: "Q3与Q1完全重复", line_hint: "重复问题" },
      { id: "ISS-005", type: "表格结构", severity: "medium", location: "第三章接口参数", description: "3.1与3.2节 Salt 值相同但各自独立描述", line_hint: "3.2节 Salt值" },
      { id: "ISS-006", type: "格式混乱", severity: "low", location: "第六章版本历史", description: "版本历史日期格式混乱，三种格式混用", line_hint: "版本历史列表" }
    ]
  },

  clean_atoms: [
    {
      chunk_id: "P1-C001",
      title: "【基础架构】- 主服务器硬件要求",
      content: "主服务器硬件配置要求如下：\n- 操作系统：CentOS 7.9 或 Ubuntu 20.04 LTS\n- CPU：不低于 16 核 Intel Xeon 或同等 AMD EPYC\n- 内存：不低于 64GB DDR4 ECC\n- 硬盘：SSD 500GB（系统盘）+ HDD 2TB（数据盘）\n- 数据库初始密码：***【敏感数据-禁止向量化入库】",
      char_count: 165,
      meta: {
        target_audience: "运维工程师",
        business_module: "基础架构",
        knowledge_type: "技术规范",
        version_timeliness: "v2.3",
        summary: "主服务器需配备16核CPU、64GB内存、SSD+HDD存储，操作系统为CentOS 7.9或Ubuntu 20.04 LTS"
      },
      qa_list: [
        { question: "主服务器要什么配置？", question_type: "口语化", answer: "不低于16核CPU、64GB内存、500GB SSD系统盘加2TB HDD数据盘，操作系统为CentOS 7.9或Ubuntu 20.04 LTS。", confidence: 96, is_low_confidence: false, source_chunk_id: "P1-C001" },
        { question: "新服务器装机选什么系统？", question_type: "业务场景", answer: "推荐 CentOS 7.9 或 Ubuntu 20.04 LTS。", confidence: 94, is_low_confidence: false, source_chunk_id: "P1-C001" },
        { question: "内存要多大？", question_type: "口语化", answer: "不低于 64GB DDR4 ECC。", confidence: 98, is_low_confidence: false, source_chunk_id: "P1-C001" }
      ],
      has_sensitive_data: true,
      split_exception: "【拆分颗粒度异常-内容过短】服务器配置清单内容紧凑，无法拆分"
    },
    {
      chunk_id: "P1-C002",
      title: "【基础架构】- 备份服务器配置",
      content: "备份服务器配置与主服务器一致，数据盘增加至 4TB。数据库备份密码与主服务器一致，详见安全规范文档统一管理章节。",
      char_count: 68,
      meta: {
        target_audience: "运维工程师",
        business_module: "基础架构",
        knowledge_type: "技术规范",
        version_timeliness: "v2.3",
        summary: "备份服务器硬件同主服务器，数据盘4TB，备份密码统一管理"
      },
      qa_list: [
        { question: "备份服务器和主服务器有什么区别？", question_type: "口语化", answer: "配置相同，区别是数据盘增加至4TB。", confidence: 92, is_low_confidence: false, source_chunk_id: "P1-C002" },
        { question: "备份密码在哪看？", question_type: "业务场景", answer: "详见安全规范文档统一管理章节。", confidence: 88, is_low_confidence: false, source_chunk_id: "P1-C002" }
      ],
      has_sensitive_data: false,
      split_exception: "【拆分颗粒度异常-内容过短】备份服务器说明仅一句话"
    },
    {
      chunk_id: "P1-C003",
      title: "【消息服务】- 消息推送接口参数",
      content: "消息推送接口配置：\n- 接口地址：https://api.xinchen-internal.com/v2/message/push\n- API Key Salt值：***【敏感数据-禁止向量化入库】\n- 请求格式：JSON\n- 超时设置：30000ms",
      char_count: 135,
      meta: {
        target_audience: "后端开发",
        business_module: "消息服务",
        knowledge_type: "接口规范",
        version_timeliness: "v2.3",
        summary: "消息推送接口地址、API Key Salt、请求格式JSON、超时30秒"
      },
      qa_list: [
        { question: "消息推送接口地址是什么？", question_type: "口语化", answer: "https://api.xinchen-internal.com/v2/message/push", confidence: 97, is_low_confidence: false, source_chunk_id: "P1-C003" },
        { question: "推送接口超时多久？", question_type: "口语化", answer: "超时设置为 30000ms（30秒）。", confidence: 95, is_low_confidence: false, source_chunk_id: "P1-C003" },
        { question: "API Key 怎么校验？", question_type: "业务场景", answer: "使用 Salt 值进行签名校验，具体 Salt 值见安全规范文档。", confidence: 85, is_low_confidence: false, source_chunk_id: "P1-C003" },
        { question: "推送用什么格式？", question_type: "简称错别字", answer: "请求格式为 JSON。", confidence: 99, is_low_confidence: false, source_chunk_id: "P1-C003" }
      ],
      has_sensitive_data: true,
      split_exception: "【拆分颗粒度异常-内容过短】接口参数清单内容紧凑"
    },
    {
      chunk_id: "P1-C004",
      title: "【认证服务】- 用户认证接口参数",
      content: "用户认证接口配置：\n- 接口地址：https://api.xinchen-internal.com/v2/auth/verify\n- API Key Salt值：与消息推送接口统一\n- Token 有效期：7200秒（2小时）",
      char_count: 115,
      meta: {
        target_audience: "后端开发",
        business_module: "认证服务",
        knowledge_type: "接口规范",
        version_timeliness: "v2.3",
        summary: "用户认证接口地址、Token有效期7200秒，Salt值与消息推送接口统一"
      },
      qa_list: [
        { question: "Token 多久过期？", question_type: "口语化", answer: "Token 有效期为 7200 秒（2小时）。", confidence: 96, is_low_confidence: false, source_chunk_id: "P1-C004" },
        { question: "认证接口地址是什么？", question_type: "业务场景", answer: "https://api.xinchen-internal.com/v2/auth/verify", confidence: 97, is_low_confidence: false, source_chunk_id: "P1-C004" },
        { question: "认证和推送的 Salt 一样吗？", question_type: "口语化", answer: "是的，与消息推送接口统一。", confidence: 90, is_low_confidence: false, source_chunk_id: "P1-C004" }
      ],
      has_sensitive_data: false,
      split_exception: "【拆分颗粒度异常-内容过短】接口参数清单内容紧凑"
    },
    {
      chunk_id: "P1-C005",
      title: "【用户管理】- 消息推送故障排查FAQ",
      content: "Q：消息推送失败怎么办？\nA：请检查API Key是否正确，确认网络连通性，查看服务端日志。",
      char_count: 52,
      meta: {
        target_audience: "全体员工",
        business_module: "用户管理",
        knowledge_type: "FAQ",
        version_timeliness: "v2.3",
        summary: "消息推送失败时检查API Key、网络连通性和服务端日志"
      },
      qa_list: [
        { question: "消息发不出去怎么办？", question_type: "口语化", answer: "检查API Key是否正确，确认网络连通性，查看服务端日志。", confidence: 94, is_low_confidence: false, source_chunk_id: "P1-C005" },
        { question: "推送失败怎么排查？", question_type: "业务场景", answer: "三步排查：1) 检查API Key配置；2) 确认网络连通；3) 查看服务端日志。", confidence: 91, is_low_confidence: false, source_chunk_id: "P1-C005" },
        { question: "API Key 有效期多久？", question_type: "业务场景", answer: "文档未说明", confidence: 82, is_low_confidence: true, source_chunk_id: "P1-C005" }
      ],
      has_sensitive_data: false,
      split_exception: "【拆分颗粒度异常-内容过短】FAQ问答对保持完整"
    },
    {
      chunk_id: "P1-C006",
      title: "【用户管理】- 管理员密码重置FAQ",
      content: "Q：如何重置管理员密码？\nA：联系IT运维部门，填写《密码重置申请单》。",
      char_count: 42,
      meta: {
        target_audience: "全体员工",
        business_module: "用户管理",
        knowledge_type: "FAQ",
        version_timeliness: "v2.3",
        summary: "重置管理员密码需联系IT运维部门并填写申请单"
      },
      qa_list: [
        { question: "忘了管理员密码怎么办？", question_type: "口语化", answer: "联系IT运维部门，填写《密码重置申请单》。", confidence: 95, is_low_confidence: false, source_chunk_id: "P1-C006" },
        { question: "密码重置要找谁？", question_type: "口语化", answer: "联系IT运维部门。", confidence: 96, is_low_confidence: false, source_chunk_id: "P1-C006" }
      ],
      has_sensitive_data: false,
      split_exception: "【拆分颗粒度异常-内容过短】FAQ问答对保持完整"
    },
    {
      chunk_id: "P1-C007",
      title: "【运维规范】- 服务部署流程",
      content: "部署流程分为两步：\n5.1 环境准备\n5.2 服务部署\n- 部署顺序：数据库 -> 消息队列 -> 核心服务 -> 前端页面\n- 配置文件路径：/etc/xinchen-comm/config/",
      char_count: 95,
      meta: {
        target_audience: "运维工程师",
        business_module: "运维规范",
        knowledge_type: "运维规范",
        version_timeliness: "v2.3",
        summary: "服务部署顺序为数据库、消息队列、核心服务、前端页面，配置文件位于/etc/xinchen-comm/config/"
      },
      qa_list: [
        { question: "部署顺序是什么？", question_type: "口语化", answer: "数据库 -> 消息队列 -> 核心服务 -> 前端页面。", confidence: 95, is_low_confidence: false, source_chunk_id: "P1-C007" },
        { question: "配置文件放哪？", question_type: "口语化", answer: "配置文件路径：/etc/xinchen-comm/config/", confidence: 97, is_low_confidence: false, source_chunk_id: "P1-C007" },
        { question: "部署前要做哪些准备？", question_type: "业务场景", answer: "先进行环境准备，然后按顺序部署服务。", confidence: 85, is_low_confidence: false, source_chunk_id: "P1-C007" }
      ],
      has_sensitive_data: false,
      split_exception: "【拆分颗粒度异常-内容过短】部署流程步骤说明紧凑"
    },
    {
      chunk_id: "P1-C008",
      title: "【版本管理】- 版本历史变更记录",
      content: "版本历史：\n- v2.3 - 2024-03-15 - 新增消息推送接口\n- v2.2 - 2023-11-08 - 修复认证超时问题\n- v2.1 - 2023-09-01 - 优化数据库连接池\n- v2.0 - 2023-06-15 - 初始版本发布",
      char_count: 142,
      meta: {
        target_audience: "全体员工",
        business_module: "版本管理",
        knowledge_type: "变更记录",
        version_timeliness: "v2.3",
        summary: "企业通讯平台从v2.0到v2.3的版本迭代历史，包含消息推送、认证修复、连接池优化"
      },
      qa_list: [
        { question: "最新版本是多少？", question_type: "口语化", answer: "v2.3，发布于2024-03-15。", confidence: 96, is_low_confidence: false, source_chunk_id: "P1-C008" },
        { question: "v2.3 新增了什么？", question_type: "口语化", answer: "新增消息推送接口。", confidence: 94, is_low_confidence: false, source_chunk_id: "P1-C008" },
        { question: "v2.2 修复了什么问题？", question_type: "口语化", answer: "修复认证超时问题。", confidence: 93, is_low_confidence: false, source_chunk_id: "P1-C008" },
        { question: "第一个版本什么时候发布的？", question_type: "业务场景", answer: "v2.0 于 2023-06-15 发布。", confidence: 95, is_low_confidence: false, source_chunk_id: "P1-C008" }
      ],
      has_sensitive_data: false,
      split_exception: null
    }
  ],

  validation_results: {
    checks: [
      {
        id: "CHK-001",
        script_name: "format_validator.py",
        check_type: "格式校验",
        field: "版本历史.发布日期",
        status: "failed",
        original: "2024年3月15日",
        corrected: "2024-03-15",
        rule: "日期格式统一为 ISO 8601 (YYYY-MM-DD)",
        detail: "原文使用中文日期格式，已修正为标准格式"
      },
      {
        id: "CHK-002",
        script_name: "format_validator.py",
        check_type: "格式校验",
        field: "版本历史.发布日期",
        status: "failed",
        original: "2023/11/08",
        corrected: "2023-11-08",
        rule: "日期格式统一为 ISO 8601 (YYYY-MM-DD)",
        detail: "原文使用斜杠分隔日期格式，已修正为标准格式"
      },
      {
        id: "CHK-003",
        script_name: "numeric_fixer.py",
        check_type: "数值修正",
        field: "汇总统计.avg_confidence",
        status: "failed",
        original: 92.3,
        corrected: 93.2,
        rule: "avg_confidence 应为所有 QA 置信度的算术平均值",
        detail: "LLM 输出的汇总平均值（92.3）与实际计算值（93.2）存在偏差"
      },
      {
        id: "CHK-004",
        script_name: "consistency_checker.py",
        check_type: "一致性校验",
        field: "汇总统计.exception_count",
        status: "failed",
        original: 11,
        corrected: 16,
        rule: "exception_count 应等于实际异常条目数",
        detail: "LLM 漏计了部分敏感数据标记和格式修正项，实际异常计数应为 16"
      }
    ],
    summary: {
      total_checks: 4,
      passed: 0,
      failed: 4,
      auto_fixed: 4,
      needs_manual_review: 0,
      scripts_executed: ["format_validator.py", "numeric_fixer.py", "consistency_checker.py", "summary_generator.py"],
      execution_time: "2.3s"
    }
  },

  review_checklist: [
    {
      id: "REV-001",
      category: "敏感数据",
      severity: "high",
      chunk_id: "P1-C001",
      description: "原文中发现了明文数据库密码（WY-25597），清洗时已脱敏标记，但需确认安全规范文档中是否已有统一的凭据管理说明",
      suggestion: "建议在安全规范文档中补充统一凭据管理章节的引用链接",
      status: "pending"
    },
    {
      id: "REV-002",
      category: "敏感数据",
      severity: "high",
      chunk_id: "P1-C003",
      description: "API Key Salt 值在原文中出现两次（3.1和3.2节），清洗时已脱敏，但需确认是否需要在两个chunk中分别标注还是统一引用一次",
      suggestion: "建议仅在 P1-C003 中保留敏感数据标记，P1-C004 中使用'与消息推送接口统一'的表述",
      status: "pending"
    },
    {
      id: "REV-003",
      category: "术语矛盾",
      severity: "medium",
      chunk_id: "P1-C005",
      description: "QA 中提到'API Key 有效期 90 天'，但原文中并未明确写明有效期时长，该信息可能来源于外部知识而非原文",
      suggestion: "建议核实 API Key 的实际有效期，如原文确实未提及，应将该 QA 的 confidence 调低或删除",
      status: "pending"
    },
    {
      id: "REV-004",
      category: "低置信QA",
      severity: "medium",
      chunk_id: "P1-C005",
      description: "关于 API Key 有效期的问题置信度仅为 82 分，低于 85 分阈值，建议人工审核该条 QA 的答案准确性",
      suggestion: "如果有效期信息经核实为正确，可将 confidence 上调至 90 以上；如无法确认，建议删除该条 QA",
      status: "pending"
    },
    {
      id: "REV-005",
      category: "内容冲突",
      severity: "low",
      chunk_id: "P1-C001/P1-C002",
      description: "P1-C002 提到'备份密码与主服务器一致'，但 P1-C001 中主服务器密码已脱敏，单独检索 P1-C002 会导致用户困惑",
      suggestion: "建议在 P1-C002 中增加明确提示：'主服务器凭据见安全规范文档统一管理章节'",
      status: "pending"
    },
    {
      id: "REV-006",
      category: "人工补全",
      severity: "low",
      chunk_id: null,
      description: "原文只描述了技术架构和部署方案，但未涵盖用户操作手册、权限管理矩阵、SLA 等配套内容",
      suggestion: "建议后续补充《用户操作手册》和《权限管理矩阵》文档，并在本规范中添加引用关系",
      status: "pending"
    }
  ]

};