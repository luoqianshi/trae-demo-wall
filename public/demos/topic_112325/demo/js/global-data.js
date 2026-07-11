/* ================================================================
 * 赣州银行服务治理平台 - 全局数据字典 global-data.js
 * 统一所有页面的核心数据源，避免跨页面数据不一致
 * 所有页面应引用本文件获取全局常量
 * ================================================================ */

(function (global) {
    'use strict';

    var GlobalData = {};

    /* ========== 一、核心指标（全局基准） ========== */
    GlobalData.CORE = {
        INTERFACE_TOTAL: 3981,        // 接口总数（含API+文件接口）
        API_TOTAL: 3155,              // API接口数
        FILE_INTERFACE_TOTAL: 826,    // 文件接口数
        SYSTEM_COUNT: 42,             // 接入系统数
        BUSINESS_DOMAIN_COUNT: 18,    // 业务域数（L1分类数）
        SLA_PASS_RATE: 94.2,          // SLA达标率
        APPLY_PASS_RATE: 89.8,        // 申请通过率
        STANDARDIZATION_RATE: 87.6,   // 接口标准化率
        FIELD_STANDARD_RATE: 72.3,    // 字段标准化覆盖率
        RULE_PASS_RATE: 96.8,         // 规则执行通过率
        INTEGRITY_COVERAGE: 91.5,     // 完整性检查覆盖率
        GOVERNANCE_SCORE: 86.4,       // 平台平均治理评分
        UNMET_INTERFACE_COUNT: 231,   // 未达标接口数 = 3981 * (1 - 94.2%)
        GRADED_INTERFACE_TOTAL: 3482, // 已分级接口数
        PENDING_GRADE_COUNT: 499,     // 待分级接口数 = 3981 - 3482
        FILE_METADATA_TOTAL: 1256,    // 文件元数据数（包含历史和归档）
        ZOMBIE_COUNT: 35,             // 僵尸接口数
        APPROVAL_FLOW_COUNT: 3,       // 审批流程数
        BUILTIN_RULE_COUNT: 326,      // 规则总数（PROD环境）
        ACTIVE_RULE_COUNT: 284,       // 已启用规则数
        THIS_MONTH_APPLY: 176,        // 本月申请数
        THIS_MONTH_PASS: 158,         // 本月通过数 = 176 * 89.8%
        THIS_MONTH_NEW_API: 38,       // 本月新增API
        THIS_MONTH_NEW_FILE: 18,      // 本月新增文件接口
        THIS_MONTH_NEW_TOTAL: 56,     // 本月新增合计 = 38 + 18
        DAILY_CALL_VOLUME: 186.5,     // 日调用量（万次）
        GOVERNANCE_DOMAIN_COUNT: 8,   // 治理业务域数（用于分类统计展示）
        DATA_QUALITY_SCORE: 91.6,     // 数据质量综合得分
        BLOODLINE_COVERAGE: 78.5,     // 血缘覆盖率
        AUDIT_INSTANCE_TOTAL: 1286,   // 审批实例总数
        AUDIT_THIS_MONTH: 186,        // 本月新增审批
        AUDIT_AVG_DAYS: 2.3,          // 平均审批时长（天）
        AUDIT_PASS_RATE: 89.2,        // 审批通过率（审批日志页用）
        OP_LOG_TOTAL: 1256,           // 操作日志总数
        LOGIN_LOG_TOTAL: 892          // 登录日志总数
    };

    /* ========== 二、接口分级分布 ========== */
    GlobalData.LEVEL_DISTRIBUTION = {
        A: 486,    // A级（核心）
        B: 1245,   // B级（重要）
        C: 1751,   // C级（一般）
        D: 499,    // D级（低优）/待分级
        total: 3981,
        // 已分级分布
        gradedA: 486,
        gradedB: 1245,
        gradedC: 1751,
        gradedTotal: 3482,
        pendingGrade: 499
    };

    /* ========== 三、SLA分级达标率（统一） ========== */
    GlobalData.SLA_BY_LEVEL = {
        A: { rate: 99.2, target: 99.5, count: 486,  unmet: 4 },
        B: { rate: 97.5, target: 98.0, count: 1245, unmet: 31 },
        C: { rate: 95.1, target: 95.0, count: 1751, unmet: 86 },
        D: { rate: 96.8, target: 95.0, count: 499,  unmet: 16 },
        total: { rate: 94.2, count: 3981, unmet: 231 }
    };

    /* ========== 四、业务域分布（统一为8个治理域） ========== */
    GlobalData.DOMAINS = [
        { name: '客户管理',   count: 625,  level: 'B', slaRate: 96.8 },
        { name: '贷款管理',   count: 528,  level: 'B', slaRate: 95.2 },
        { name: '账务处理',   count: 456,  level: 'A', slaRate: 99.5 },
        { name: '风险管理',   count: 445,  level: 'A', slaRate: 99.1 },
        { name: '投资理财',   count: 385,  level: 'C', slaRate: 93.8 },
        { name: '支付清算',   count: 318,  level: 'A', slaRate: 99.3 },
        { name: '卡片服务',   count: 0,    level: 'C', slaRate: 0 },
        { name: '其他',       count: 1224, level: 'C', slaRate: 92.5 }
    ];

    /* ========== 五、系统治理排名（统一一套数据） ========== */
    GlobalData.SYSTEM_RANKING = [
        { rank: 1, name: '核心业务系统',     score: 95.4, slaRate: 99.2, interfaceCount: 685, status: '优秀' },
        { rank: 2, name: '客户信息管理平台', score: 91.2, slaRate: 97.8, interfaceCount: 423, status: '优秀' },
        { rank: 3, name: '反洗钱监测系统',   score: 90.4, slaRate: 98.5, interfaceCount: 312, status: '优秀' },
        { rank: 4, name: '信贷管理系统',     score: 89.6, slaRate: 96.5, interfaceCount: 528, status: '良好' },
        { rank: 5, name: '风险管理系统',     score: 88.3, slaRate: 95.8, interfaceCount: 386, status: '良好' },
        { rank: 6, name: '信用卡核心系统',   score: 87.1, slaRate: 96.2, interfaceCount: 342, status: '良好' },
        { rank: 7, name: '支付清算系统',     score: 85.6, slaRate: 94.8, interfaceCount: 318, status: '良好' },
        { rank: 8, name: '监管报送平台',     score: 83.2, slaRate: 93.5, interfaceCount: 186, status: '一般' }
    ];

    /* ========== 六、SLA系统排名（统一一套数据） ========== */
    GlobalData.SLA_SYSTEM_RANKING = [
        { rank: 1, name: '核心业务系统',     rate: 99.2, interfaceCount: 685, unmet: 5 },
        { rank: 2, name: '客户信息管理平台', rate: 98.5, interfaceCount: 423, unmet: 6 },
        { rank: 3, name: '风险管理系统',     rate: 97.8, interfaceCount: 386, unmet: 8 },
        { rank: 4, name: '信贷管理系统',     rate: 96.5, interfaceCount: 528, unmet: 18 },
        { rank: 5, name: '信用卡核心系统',   rate: 96.2, interfaceCount: 342, unmet: 13 },
        { rank: 6, name: '反洗钱监测系统',   rate: 95.8, interfaceCount: 312, unmet: 13 },
        { rank: 7, name: '支付清算系统',     rate: 94.8, interfaceCount: 318, unmet: 16 },
        { rank: 8, name: '监管报送平台',     rate: 93.5, interfaceCount: 186, unmet: 12 }
    ];

    /* ========== 七、SLA趋势（6个月） ========== */
    GlobalData.SLA_TREND = [
        { month: '1月', rate: 93.8 },
        { month: '2月', rate: 94.0 },
        { month: '3月', rate: 93.5 },
        { month: '4月', rate: 94.5 },
        { month: '5月', rate: 94.0 },
        { month: '6月', rate: 94.2 }
    ];

    /* ========== 八、申请单号格式规范 ========== */
    GlobalData.APPLY_ID_FORMAT = 'APP-YYYY-MMDD-NNN';
    GlobalData.APPLY_ID_EXAMPLE = 'APP-2026-0625-001';

    /* ========== 九、规则编号格式规范 ========== */
    GlobalData.RULE_ID_FORMAT = 'R-XXX-NNNN';
    GlobalData.RULE_ID_EXAMPLE = 'R-FMT-0001';

    /* ========== 十、辅助函数 ========== */

    // 生成申请单号
    GlobalData.genApplyId = function (seq) {
        var d = new Date();
        var mm = String(d.getMonth() + 1).padStart(2, '0');
        var dd = String(d.getDate()).padStart(2, '0');
        var nnn = String(seq || 1).padStart(3, '0');
        return 'APP-' + d.getFullYear() + '-' + mm + dd + '-' + nnn;
    };

    // 生成规则编号
    GlobalData.genRuleId = function (category, seq) {
        var nnnn = String(seq || 1).padStart(4, '0');
        return 'R-' + (category || 'FMT') + '-' + nnnn;
    };

    // 格式化数字（千分位）
    GlobalData.formatNumber = function (num) {
        return (num || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    // 全局暴露
    global.GlobalData = GlobalData;

})(window);
