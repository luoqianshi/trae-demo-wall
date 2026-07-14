const projectInfo = {
    name: 'e-commerce-platform',
    language: 'Java Spring Boot',
    framework: 'Spring Boot 2.7.x',
    linesOfCode: 128456,
    fileCount: 2847,
    totalCommits: 3247,
    firstCommit: '2021-07-15',
    lastCommit: '2024-06-30',
    activeDevelopers: 12,
    overallHealth: 68,
    debtScore: 4.2,
    riskLevel: 'medium',
    modules: 12
};

const modules = [
    { id: 'user-service', name: '用户服务', complexity: 72, status: 'healthy' },
    { id: 'order-service', name: '订单服务', complexity: 85, status: 'warning' },
    { id: 'payment-service', name: '支付服务', complexity: 68, status: 'healthy' },
    { id: 'inventory-service', name: '库存服务', complexity: 55, status: 'healthy' },
    { id: 'notification-service', name: '通知服务', complexity: 42, status: 'healthy' },
    { id: 'auth-service', name: '认证服务', complexity: 78, status: 'warning' },
    { id: 'gateway-service', name: '网关服务', complexity: 65, status: 'healthy' },
    { id: 'config-service', name: '配置服务', complexity: 35, status: 'healthy' },
    { id: 'log-service', name: '日志服务', complexity: 48, status: 'healthy' },
    { id: 'monitor-service', name: '监控服务', complexity: 52, status: 'healthy' },
    { id: 'cache-service', name: '缓存服务', complexity: 70, status: 'healthy' },
    { id: 'search-service', name: '搜索服务', complexity: 60, status: 'healthy' }
];

const dependencies = [
    { source: 'gateway-service', target: 'auth-service', weight: 0.9 },
    { source: 'gateway-service', target: 'user-service', weight: 0.8 },
    { source: 'gateway-service', target: 'order-service', weight: 0.85 },
    { source: 'order-service', target: 'payment-service', weight: 0.95 },
    { source: 'order-service', target: 'inventory-service', weight: 0.9 },
    { source: 'order-service', target: 'user-service', weight: 0.7 },
    { source: 'order-service', target: 'notification-service', weight: 0.6 },
    { source: 'payment-service', target: 'auth-service', weight: 0.5 },
    { source: 'payment-service', target: 'log-service', weight: 0.4 },
    { source: 'user-service', target: 'auth-service', weight: 0.8 },
    { source: 'user-service', target: 'cache-service', weight: 0.65 },
    { source: 'inventory-service', target: 'cache-service', weight: 0.75 },
    { source: 'notification-service', target: 'log-service', weight: 0.5 },
    { source: 'auth-service', target: 'cache-service', weight: 0.8 },
    { source: 'auth-service', target: 'log-service', weight: 0.4 },
    { source: 'config-service', target: 'gateway-service', weight: 0.3 },
    { source: 'config-service', target: 'order-service', weight: 0.35 },
    { source: 'config-service', target: 'user-service', weight: 0.3 },
    { source: 'log-service', target: 'monitor-service', weight: 0.55 },
    { source: 'monitor-service', target: 'gateway-service', weight: 0.4 },
    { source: 'monitor-service', target: 'order-service', weight: 0.45 },
    { source: 'cache-service', target: 'search-service', weight: 0.5 },
    { source: 'search-service', target: 'user-service', weight: 0.4 },
    { source: 'search-service', target: 'order-service', weight: 0.45 },
    { source: 'order-service', target: 'search-service', weight: 0.5 },
    { source: 'inventory-service', target: 'order-service', weight: 0.8 },
    { source: 'payment-service', target: 'order-service', weight: 0.3 },
    { source: 'auth-service', target: 'order-service', weight: 0.2 }
];

const relics = [
    { id: 'R001', module: 'order-service', type: 'dead-code', severity: 'critical', title: 'UserService.legacyMethod()', description: '该方法已 180 天未被调用，包含 247 行不可达代码', suggestion: '删除死代码，将有用逻辑迁移至新服务', quarter: '2022 Q2' },
    { id: 'R002', module: 'order-service', type: 'coupling', severity: 'critical', title: 'OrderModule 循环依赖', description: '与 payment-service 和 inventory-service 形成 3 层循环依赖', suggestion: '引入事件驱动架构解耦', quarter: '2022 Q3' },
    { id: 'R003', module: 'payment-service', type: 'complexity', severity: 'critical', title: 'PaymentProcessor.process() 圈复杂度 42', description: '单方法包含 42 个条件分支，难以维护', suggestion: '拆分为多个独立方法，采用策略模式', quarter: '2022 Q4' },
    { id: 'R004', module: 'auth-service', type: 'dead-code', severity: 'critical', title: 'TokenUtil 废弃类', description: '整个工具类已被 Spring Security 替代，包含 5 个废弃方法', suggestion: '完全移除该类及所有引用', quarter: '2023 Q1' },
    { id: 'R005', module: 'inventory-service', type: 'duplicate', severity: 'critical', title: '库存扣减逻辑重复 3 次', description: '在 OrderService、InventoryController、API 层各实现一次', suggestion: '抽取公共服务，统一调用入口', quarter: '2023 Q2' },
    { id: 'R006', module: 'gateway-service', type: 'complexity', severity: 'critical', title: 'FilterChain 嵌套 8 层', description: '请求过滤链深度嵌套，难以调试和扩展', suggestion: '重构为责任链模式，每层独立', quarter: '2023 Q3' },
    { id: 'R007', module: 'user-service', type: 'coupling', severity: 'critical', title: 'UserEntity 被 15 个模块直接引用', description: '领域实体暴露过多，修改风险极高', suggestion: '引入 DTO 层隔离，定义稳定接口', quarter: '2023 Q4' },
    { id: 'R008', module: 'notification-service', type: 'dead-code', severity: 'critical', title: 'SMSGateway v1 API', description: '使用已废弃的短信网关 API，官方已停止维护', suggestion: '迁移至 v3 API，更新配置参数', quarter: '2024 Q1' },
    
    { id: 'R009', module: 'order-service', type: 'complexity', severity: 'warning', title: 'OrderValidator 方法过长', description: 'validateOrder() 方法超过 150 行', suggestion: '按校验规则拆分为多个小方法', quarter: '2021 Q4' },
    { id: 'R010', module: 'payment-service', type: 'duplicate', severity: 'warning', title: '金额计算逻辑重复', description: 'discount() 和 calculateTotal() 有 60% 代码重复', suggestion: '抽取公共计算服务', quarter: '2022 Q1' },
    { id: 'R011', module: 'user-service', type: 'coupling', severity: 'warning', title: 'UserRepository 与 Cache 紧耦合', description: '仓储层直接操作缓存，违背分层原则', suggestion: '引入缓存服务层，仓储层只负责数据库', quarter: '2022 Q2' },
    { id: 'R012', module: 'inventory-service', type: 'complexity', severity: 'warning', title: 'StockManager 圈复杂度 28', description: '库存管理逻辑过于集中', suggestion: '按功能拆分：入库、出库、盘点', quarter: '2022 Q3' },
    { id: 'R013', module: 'auth-service', type: 'duplicate', severity: 'warning', title: '密码加密逻辑重复', description: '在 3 个地方实现相同的 BCrypt 加密', suggestion: '统一至 SecurityConfig', quarter: '2022 Q4' },
    { id: 'R014', module: 'gateway-service', type: 'coupling', severity: 'warning', title: '路由配置硬编码', description: '路由规则直接写在代码中，无法动态调整', suggestion: '迁移至配置中心或数据库', quarter: '2023 Q1' },
    { id: 'R015', module: 'config-service', type: 'dead-code', severity: 'warning', title: '旧版配置加载器', description: 'Spring Cloud Config 1.x 兼容代码', suggestion: '清理废弃代码，统一使用 2.x API', quarter: '2023 Q2' },
    { id: 'R016', module: 'log-service', type: 'complexity', severity: 'warning', title: 'LogParser 正则表达式复杂', description: '单正则包含 10+ 捕获组，难以理解', suggestion: '分步解析，使用命名捕获组', quarter: '2023 Q3' },
    { id: 'R017', module: 'monitor-service', type: 'coupling', severity: 'warning', title: 'MetricsCollector 依赖过多', description: '同时依赖 6 个监控 SDK', suggestion: '抽象统一接口，按需加载', quarter: '2023 Q4' },
    { id: 'R018', module: 'cache-service', type: 'dead-code', severity: 'warning', title: 'RedisClusterConfig 废弃配置', description: '集群模式已停用，保留单节点配置即可', suggestion: '删除集群配置相关代码', quarter: '2024 Q1' },
    { id: 'R019', module: 'search-service', type: 'complexity', severity: 'warning', title: 'SearchQueryBuilder 链式调用过长', description: '单次查询构建超过 20 个链式调用', suggestion: '使用构建器模式，分步构建', quarter: '2024 Q2' },
    { id: 'R020', module: 'notification-service', type: 'coupling', severity: 'warning', title: 'EmailService 与模板引擎紧耦合', description: '直接依赖 Freemarker 实现', suggestion: '抽象模板接口，支持多种引擎', quarter: '2021 Q3' },
    { id: 'R021', module: 'order-service', type: 'duplicate', severity: 'warning', title: '退款逻辑与订单创建重复', description: '状态机处理逻辑有 40% 重复', suggestion: '抽取状态机框架，统一状态流转', quarter: '2021 Q4' },
    { id: 'R022', module: 'payment-service', type: 'dead-code', severity: 'warning', title: 'AlipayLegacyCallback', description: '支付宝旧版回调接口，已迁移至新版', suggestion: '保留 1 个月后删除', quarter: '2022 Q1' },
    { id: 'R023', module: 'inventory-service', type: 'coupling', severity: 'warning', title: 'WarehouseDAO 直接被 Controller 调用', description: '跳过 Service 层，违反分层架构', suggestion: '新增 Service 层，Controller 只调用 Service', quarter: '2022 Q2' },
    
    { id: 'R024', module: 'user-service', type: 'complexity', severity: 'info', title: 'UserDTO 字段过多', description: '包含 25 个字段，建议拆分', suggestion: '按用途拆分为 BasicUserDTO、FullUserDTO 等', quarter: '2022 Q4' },
    { id: 'R025', module: 'order-service', type: 'duplicate', severity: 'info', title: '订单状态枚举重复定义', description: '在 order-service 和 payment-service 各定义一次', suggestion: '提取共享模块，统一枚举定义', quarter: '2023 Q1' },
    { id: 'R026', module: 'payment-service', type: 'coupling', severity: 'info', title: 'PayPalConfig 与特定实现绑定', description: '配置类包含 PayPal 特有字段', suggestion: '使用泛型或接口抽象支付配置', quarter: '2023 Q2' },
    { id: 'R027', module: 'inventory-service', type: 'dead-code', severity: 'info', title: 'CSVImporter 未使用', description: '库存导入功能已改用 Excel', suggestion: '标记 @Deprecated，计划移除', quarter: '2023 Q3' },
    { id: 'R028', module: 'notification-service', type: 'complexity', severity: 'info', title: 'NotificationFactory 分支较多', description: '支持 8 种通知类型，分支较多', suggestion: '考虑使用策略模式替代 if-else', quarter: '2023 Q4' },
    { id: 'R029', module: 'auth-service', type: 'duplicate', severity: 'info', title: 'JWT 配置重复', description: '在 application.yml 和 SecurityConfig 各定义一次', suggestion: '统一配置来源', quarter: '2024 Q1' },
    { id: 'R030', module: 'gateway-service', type: 'dead-code', severity: 'info', title: 'RateLimitFilter 旧版实现', description: '已替换为 Bucket4j 实现', suggestion: '清理旧版代码', quarter: '2024 Q2' },
    { id: 'R031', module: 'config-service', type: 'complexity', severity: 'info', title: 'ConfigLoader 条件判断复杂', description: '支持 5 种配置源，判断逻辑嵌套', suggestion: '使用责任链模式处理不同配置源', quarter: '2021 Q3' },
    { id: 'R032', module: 'log-service', type: 'coupling', severity: 'info', title: 'LogAppender 与 Elasticsearch 绑定', description: '日志输出直接依赖 ES', suggestion: '抽象输出接口，支持多种存储', quarter: '2021 Q4' },
    { id: 'R033', module: 'monitor-service', type: 'duplicate', severity: 'info', title: 'HealthIndicator 实现重复', description: '多个模块实现类似的健康检查', suggestion: '提取公共健康检查模块', quarter: '2022 Q1' },
    { id: 'R034', module: 'cache-service', type: 'complexity', severity: 'info', title: 'CacheEvictionPolicy 逻辑复杂', description: '驱逐策略包含多种条件', suggestion: '拆分为独立策略类', quarter: '2022 Q2' },
    { id: 'R035', module: 'search-service', type: 'dead-code', severity: 'info', title: 'SolrClient 兼容代码', description: '已迁移至 Elasticsearch，保留 Solr 兼容', suggestion: '确认不再使用后删除', quarter: '2022 Q3' },
    { id: 'R036', module: 'user-service', type: 'coupling', severity: 'info', title: 'UserEventListener 监听过多', description: '监听 6 种事件，职责过重', suggestion: '按事件类型拆分多个监听器', quarter: '2022 Q4' }
];

const stratigraphy = [
    { quarter: '2021 Q3', commits: 156, bugs: 28, debtScore: 7.8, health: 45, color: '#ff6b6b' },
    { quarter: '2021 Q4', commits: 234, bugs: 24, debtScore: 7.2, health: 52, color: '#ff6b6b' },
    { quarter: '2022 Q1', commits: 189, bugs: 20, debtScore: 6.5, health: 58, color: '#ff9f43' },
    { quarter: '2022 Q2', commits: 267, bugs: 18, debtScore: 6.0, health: 62, color: '#ff9f43' },
    { quarter: '2022 Q3', commits: 312, bugs: 15, debtScore: 5.5, health: 65, color: '#ff9f43' },
    { quarter: '2022 Q4', commits: 289, bugs: 12, debtScore: 4.8, health: 68, color: '#00d4ff' },
    { quarter: '2023 Q1', commits: 345, bugs: 10, debtScore: 4.5, health: 70, color: '#00d4ff' },
    { quarter: '2023 Q2', commits: 378, bugs: 8, debtScore: 4.2, health: 72, color: '#00d4ff' },
    { quarter: '2023 Q3', commits: 412, bugs: 6, debtScore: 3.8, health: 75, color: '#00ff88' },
    { quarter: '2023 Q4', commits: 356, bugs: 5, debtScore: 3.5, health: 78, color: '#00ff88' },
    { quarter: '2024 Q1', commits: 298, bugs: 4, debtScore: 3.2, health: 80, color: '#00ff88' },
    { quarter: '2024 Q2', commits: 252, bugs: 3, debtScore: 2.8, health: 85, color: '#00ff88' }
];

let currentFilter = 'all';
let currentSearch = '';
let currentQuarterFilter = null;
let currentModuleFilter = null;
let graphSimulation = null;
let graphNodes = [];
let graphLinks = [];
let leftPanelCollapsed = false;
let rightPanelCollapsed = false;

function createMatrixRain() {
    const container = document.getElementById('matrixBg');
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*(){}[]|;:,.<>?/~`';
    for (let i = 0; i < 50; i++) {
        const char = document.createElement('div');
        char.className = 'matrix-char';
        char.textContent = chars[Math.floor(Math.random() * chars.length)];
        char.style.left = Math.random() * 100 + '%';
        char.style.animationDelay = Math.random() * 5 + 's';
        container.appendChild(char);
    }
}

function renderStratigraphy() {
    const container = document.getElementById('stratigraphyContainer');
    const width = container.clientWidth;
    const height = container.clientHeight;
    const svg = d3.select('#stratigraphySvg')
        .attr('width', width)
        .attr('height', height);

    svg.selectAll('*').remove();

    const padding = { top: 40, right: 20, bottom: 60, left: 20 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const xScale = d3.scaleBand()
        .domain(stratigraphy.map(d => d.quarter))
        .range([0, chartWidth])
        .padding(0.1);

    const yScale = d3.scaleLinear()
        .domain([0, 100])
        .range([chartHeight, 0]);

    const g = svg.append('g')
        .attr('transform', `translate(${padding.left},${padding.top})`);

    g.selectAll('.stratum-bar')
        .data(stratigraphy)
        .enter()
        .append('rect')
        .attr('class', 'stratum-bar')
        .attr('x', d => xScale(d.quarter))
        .attr('y', d => yScale(d.health))
        .attr('width', xScale.bandwidth())
        .attr('height', d => chartHeight - yScale(d.health))
        .attr('fill', d => d.color)
        .attr('opacity', 0.8)
        .attr('rx', 4)
        .on('mouseenter', function(event, d) {
            d3.select(this).attr('opacity', 1);
            showStratumTooltip(event, d);
        })
        .on('mousemove', function(event) {
            moveTooltip(event, 'stratumTooltip');
        })
        .on('mouseleave', function() {
            d3.select(this).attr('opacity', 0.8);
            hideTooltip('stratumTooltip');
        })
        .on('click', function(event, d) {
            toggleQuarterFilter(d.quarter);
        });

    g.selectAll('.stratum-label')
        .data(stratigraphy)
        .enter()
        .append('text')
        .attr('class', 'stratum-label')
        .attr('x', d => xScale(d.quarter) + xScale.bandwidth() / 2)
        .attr('y', chartHeight + 20)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('fill', '#6b6b80')
        .text(d => d.quarter);

    g.selectAll('.stratum-value')
        .data(stratigraphy)
        .enter()
        .append('text')
        .attr('class', 'stratum-value')
        .attr('x', d => xScale(d.quarter) + xScale.bandwidth() / 2)
        .attr('y', d => yScale(d.health) - 8)
        .attr('text-anchor', 'middle')
        .attr('font-size', '11px')
        .attr('font-weight', '600')
        .attr('fill', '#e8e8f0')
        .text(d => d.health + '%');

    const healthLegend = svg.append('g')
        .attr('transform', `translate(${padding.left}, ${padding.top - 20})`);

    const legendItems = [
        { color: '#ff6b6b', label: 'Critical' },
        { color: '#ff9f43', label: 'Warning' },
        { color: '#00d4ff', label: 'Normal' },
        { color: '#00ff88', label: 'Healthy' }
    ];

    healthLegend.selectAll('.legend-item')
        .data(legendItems)
        .enter()
        .append('rect')
        .attr('x', (d, i) => i * 80)
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', d => d.color)
        .attr('rx', 2);

    healthLegend.selectAll('.legend-label')
        .data(legendItems)
        .enter()
        .append('text')
        .attr('x', (d, i) => i * 80 + 18)
        .attr('y', 10)
        .attr('font-size', '9px')
        .attr('fill', '#6b6b80')
        .text(d => d.label);
}

function toggleQuarterFilter(quarter) {
    if (currentQuarterFilter === quarter) {
        currentQuarterFilter = null;
        d3.selectAll('.stratum-bar').attr('opacity', 0.8);
    } else {
        currentQuarterFilter = quarter;
        d3.selectAll('.stratum-bar')
            .attr('opacity', function(d) {
                return d.quarter === quarter ? 1 : 0.2;
            });
    }
    renderRelics();
}

function showStratumTooltip(event, data) {
    const healthText = data.health >= 75 ? 'Healthy' : data.health >= 60 ? 'Normal' : data.health >= 50 ? 'Warning' : 'Critical';
    const tooltip = document.getElementById('stratumTooltip');
    tooltip.innerHTML = `
        <div class="tooltip-title">${data.quarter}</div>
        <div class="tooltip-row"><span class="tooltip-label">Commits:</span><span class="tooltip-value">${data.commits}</span></div>
        <div class="tooltip-row"><span class="tooltip-label">Bugs:</span><span class="tooltip-value" style="color: #ff6b6b">${data.bugs}</span></div>
        <div class="tooltip-row"><span class="tooltip-label">Debt Score:</span><span class="tooltip-value" style="color: #ff9f43">${data.debtScore}</span></div>
        <div class="tooltip-row"><span class="tooltip-label">Health:</span><span class="tooltip-value" style="color: ${data.color}">${data.health}%</span></div>
        <div class="tooltip-row"><span class="tooltip-label">Status:</span><span class="tooltip-value" style="color: ${data.color}">${healthText}</span></div>
    `;
    tooltip.classList.add('active');
    moveTooltip(event, 'stratumTooltip');
}

function moveTooltip(event, tooltipId) {
    const tooltip = document.getElementById(tooltipId);
    const rect = tooltip.getBoundingClientRect();
    let left = event.clientX + 10;
    let top = event.clientY + 10;
    
    if (left + rect.width > window.innerWidth) {
        left = event.clientX - rect.width - 10;
    }
    if (top + rect.height > window.innerHeight) {
        top = event.clientY - rect.height - 10;
    }
    
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
}

function hideTooltip(tooltipId) {
    document.getElementById(tooltipId).classList.remove('active');
}

function renderGraph() {
    const container = document.getElementById('graphContainer');
    const width = container.clientWidth;
    const height = container.clientHeight;
    const svg = d3.select('#graphSvg')
        .attr('width', width)
        .attr('height', height);

    svg.selectAll('*').remove();

    const g = svg.append('g');

    const zoom = d3.zoom()
        .scaleExtent([0.5, 3])
        .on('zoom', function(event) {
            g.attr('transform', event.transform);
        });

    svg.call(zoom);

    graphNodes = modules.map(m => ({
        id: m.id,
        name: m.name,
        complexity: m.complexity,
        status: m.status,
        size: m.complexity > 80 ? 60 : (m.complexity > 50 ? 45 : 30)
    }));

    graphLinks = dependencies.map(d => ({
        source: d.source,
        target: d.target,
        weight: d.weight
    }));

    graphSimulation = d3.forceSimulation(graphNodes)
        .force('link', d3.forceLink(graphLinks).id(d => d.id).distance(d => 100 - d.weight * 50))
        .force('charge', d3.forceManyBody().strength(-250))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(d => d.size / 2 + 8))
        .alphaDecay(0.0228)
        .on('tick', () => {
            link.attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            node.attr('cx', d => d.x).attr('cy', d => d.y);
            labels.attr('x', d => d.x).attr('y', d => d.y + d.size / 2 + 14);
        });

    setTimeout(() => {
        if (graphSimulation) {
            graphSimulation.stop();
        }
    }, 5000);

    const link = g.append('g')
        .selectAll('line')
        .data(graphLinks)
        .enter()
        .append('line')
        .attr('stroke', '#1e1e2e')
        .attr('stroke-width', d => d.weight > 0.7 ? 3 : (d.weight > 0.4 ? 2 : 1))
        .attr('opacity', 0.6);

    const node = g.append('g')
        .selectAll('circle')
        .data(graphNodes)
        .enter()
        .append('circle')
        .attr('r', d => d.size / 2)
        .attr('fill', d => d.status === 'warning' ? '#ff9f43' : '#00ff88')
        .attr('stroke', '#1e1e2e')
        .attr('stroke-width', 2)
        .style('filter', 'drop-shadow(0 0 8px rgba(0,255,136,0.3))')
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended));

    const labels = g.append('g')
        .selectAll('text')
        .data(graphNodes)
        .enter()
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('font-size', '9px')
        .attr('fill', '#e8e8f0')
        .attr('pointer-events', 'none')
        .text(d => d.name.length > 6 ? d.name.substring(0, 6) + '...' : d.name);

    node.on('mouseenter', function(event, d) {
        d3.select(this)
            .attr('fill', '#00d4ff')
            .style('filter', 'drop-shadow(0 0 15px rgba(0,212,255,0.5))');
        showNodeTooltip(event, d);
    });

    node.on('mousemove', function(event) {
        moveTooltip(event, 'nodeTooltip');
    });

    node.on('mouseleave', function(event, d) {
        d3.select(this)
            .attr('fill', d.status === 'warning' ? '#ff9f43' : '#00ff88')
            .style('filter', 'drop-shadow(0 0 8px rgba(0,255,136,0.3))');
        hideTooltip('nodeTooltip');
    });

    node.on('click', function(event, d) {
        highlightNode(d.id);
    });

    node.on('dblclick', function(event, d) {
        centerNode(d);
    });

    function dragstarted(event, d) {
        if (!event.active && graphSimulation) {
            graphSimulation.alphaTarget(0.3).restart();
        }
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active && graphSimulation) {
            graphSimulation.alphaTarget(0);
        }
        d.fx = null;
        d.fy = null;
    }
}

function highlightNode(nodeId) {
    if (currentModuleFilter === nodeId) {
        currentModuleFilter = null;
        d3.selectAll('.graph-svg circle')
            .attr('opacity', 1)
            .style('filter', d => d.status === 'warning' ? 'drop-shadow(0 0 8px rgba(0,255,136,0.3))' : 'drop-shadow(0 0 8px rgba(0,255,136,0.3))');
        d3.selectAll('.graph-svg line')
            .attr('opacity', 0.6);
    } else {
        currentModuleFilter = nodeId;
        
        const connectedNodes = new Set([nodeId]);
        graphLinks.forEach(link => {
            if (link.source === nodeId || link.target === nodeId) {
                connectedNodes.add(link.source);
                connectedNodes.add(link.target);
            }
        });

        d3.selectAll('.graph-svg circle')
            .attr('opacity', function(d) {
                return connectedNodes.has(d.id) ? 1 : 0.15;
            })
            .style('filter', function(d) {
                return connectedNodes.has(d.id) ? 'drop-shadow(0 0 15px rgba(0,212,255,0.5))' : 'none';
            });

        d3.selectAll('.graph-svg line')
            .attr('opacity', function(d) {
                return (d.source.id === nodeId || d.target.id === nodeId) ? 1 : 0.15;
            });
    }
    renderRelics();
}

function centerNode(d) {
    if (!graphSimulation) return;
    
    const container = document.getElementById('graphContainer');
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    graphSimulation
        .force('center', d3.forceCenter(width / 2, height / 2))
        .alpha(1)
        .restart();
    
    d.fx = width / 2;
    d.fy = height / 2;
    
    setTimeout(() => {
        if (graphSimulation) {
            graphSimulation.stop();
        }
        d.fx = null;
        d.fy = null;
    }, 2000);
}

function showNodeTooltip(event, data) {
    const tooltip = document.getElementById('nodeTooltip');
    tooltip.innerHTML = `
        <div style="font-weight:600; color:#00ff88; margin-bottom:4px">${data.name}</div>
        <div style="font-size:9px; color:#6b6b80">ID: ${data.id}</div>
        <div style="font-size:9px; color:#6b6b80">Complexity: ${data.complexity}</div>
        <div style="font-size:9px; color:#6b6b80">Status: ${data.status === 'warning' ? '<span style="color:#ff9f43">Warning</span>' : '<span style="color:#00ff88">Healthy</span>'}</div>
    `;
    tooltip.classList.add('active');
    moveTooltip(event, 'nodeTooltip');
}

function hideNodeTooltip() {
    document.getElementById('nodeTooltip').classList.remove('active');
}

function renderRelics() {
    const list = document.getElementById('relicList');
    const fragment = document.createDocumentFragment();

    const filtered = relics.filter(r => {
        const matchesFilter = currentFilter === 'all' || r.severity === currentFilter;
        const matchesSearch = !currentSearch || 
            r.title.toLowerCase().includes(currentSearch.toLowerCase()) ||
            r.module.toLowerCase().includes(currentSearch.toLowerCase()) ||
            r.description.toLowerCase().includes(currentSearch.toLowerCase());
        const matchesQuarter = !currentQuarterFilter || r.quarter === currentQuarterFilter;
        const matchesModule = !currentModuleFilter || r.module === currentModuleFilter;
        return matchesFilter && matchesSearch && matchesQuarter && matchesModule;
    });

    filtered.forEach(relic => {
        const item = document.createElement('div');
        item.className = `relic-item ${relic.severity}`;
        item.onclick = () => openModal(relic);
        
        const icons = { 'dead-code': '💀', 'coupling': '🔗', 'duplicate': '📋', 'complexity': '🧩' };

        item.innerHTML = `
            <div class="relic-icon">${icons[relic.type] || '🔍'}</div>
            <div class="relic-content">
                <div class="relic-title">${relic.title}</div>
                <div class="relic-desc">${relic.description}</div>
                <div class="relic-meta">
                    <span>${relic.module}</span>
                    <span>${relic.severity.charAt(0).toUpperCase() + relic.severity.slice(1)}</span>
                </div>
            </div>
        `;
        fragment.appendChild(item);
    });

    list.innerHTML = '';
    list.appendChild(fragment);

    if (filtered.length === 0) {
        list.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--text-secondary); font-size: 11px;">No relics found.</div>`;
    }
}

function filterRelics(severity) {
    currentFilter = severity;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        if (btn.textContent.toLowerCase() === severity.toLowerCase() || 
            (severity === 'all' && btn.textContent === 'ALL')) {
            btn.classList.add('active');
        }
    });
    renderRelics();
}

function searchRelics(query) {
    currentSearch = query;
    renderRelics();
}

function getCodeSamples(type) {
    const samples = {
        'dead-code': {
            before: '<span class="comment">// Dead code - 180 days unused</span>\n<span class="keyword">public</span> <span class="keyword">void</span> <span class="function">legacyMethod</span>(<span class="type">String</span> userId) {\n    <span class="comment">// TODO: Migrate to new service</span>\n    User user = userRepository.findById(userId);\n    <span class="keyword">if</span> (user != <span class="keyword">null</span>) {\n        <span class="comment">// Legacy business logic</span>\n        processUserData(user);\n        updateUserStatus(user);\n        <span class="comment">// ... 200+ lines of dead code</span>\n    }\n}',
            after: '<span class="comment">// Refactored - simplified logic</span>\n<span class="keyword">public</span> <span class="keyword">void</span> <span class="function">optimizedMethod</span>(<span class="type">String</span> userId) {\n    User user = userRepository.findById(userId);\n    <span class="keyword">if</span> (user == <span class="keyword">null</span>) {\n        <span class="keyword">throw</span> <span class="keyword">new</span> UserNotFoundException(userId);\n    }\n    userService.processUserData(user);\n    userStatusUpdater.update(user);\n}'
        },
        'coupling': {
            before: '<span class="comment">// Tight coupling - direct dependency</span>\n<span class="keyword">public</span> <span class="keyword">class</span> <span class="type">OrderService</span> {\n    <span class="keyword">private</span> <span class="type">PaymentService</span> paymentService;\n    <span class="keyword">private</span> <span class="type">InventoryService</span> inventoryService;\n    \n    <span class="keyword">public</span> <span class="keyword">void</span> <span class="function">createOrder</span>() {\n        paymentService.processPayment();\n        inventoryService.deductStock();\n    }\n}',
            after: '<span class="comment">// Decoupled - event-driven</span>\n<span class="keyword">public</span> <span class="keyword">class</span> <span class="type">OrderService</span> {\n    <span class="keyword">private</span> <span class="type">EventPublisher</span> eventPublisher;\n    \n    <span class="keyword">public</span> <span class="keyword">void</span> <span class="function">createOrder</span>() {\n        eventPublisher.publish(<span class="keyword">new</span> OrderCreatedEvent());\n    }\n}'
        },
        'duplicate': {
            before: '<span class="comment">// Duplicate code - same logic repeated</span>\n<span class="keyword">public</span> <span class="keyword">void</span> <span class="function">discount</span>(<span class="type">Order</span> order) {\n    <span class="keyword">if</span> (order.getAmount() > 1000) {\n        order.setTotal(order.getAmount() * 0.9);\n    }\n}\n\n<span class="keyword">public</span> <span class="keyword">void</span> <span class="function">calculateTotal</span>(<span class="type">Order</span> order) {\n    <span class="keyword">if</span> (order.getAmount() > 1000) {\n        order.setTotal(order.getAmount() * 0.9);\n    }\n}',
            after: '<span class="comment">// Refactored - single source of truth</span>\n<span class="keyword">public</span> <span class="keyword">class</span> <span class="type">PriceCalculator</span> {\n    <span class="keyword">public</span> <span class="keyword">static</span> <span class="type">BigDecimal</span> <span class="function">applyDiscount</span>(<span class="type">BigDecimal</span> amount) {\n        <span class="keyword">return</span> amount.compareTo(<span class="string">"1000"</span>) > 0 \n            ? amount.multiply(<span class="string">"0.9"</span>) \n            : amount;\n    }\n}\n\n<span class="keyword">public</span> <span class="keyword">void</span> <span class="function">calculateTotal</span>(<span class="type">Order</span> order) {\n    order.setTotal(PriceCalculator.applyDiscount(order.getAmount()));\n}'
        },
        'complexity': {
            before: '<span class="comment">// High complexity - 42 condition branches</span>\n<span class="keyword">public</span> <span class="type">boolean</span> <span class="function">process</span>(<span class="type">Payment</span> p) {\n    <span class="keyword">if</span> (p.getType() == <span class="string">"CREDIT"</span>) {\n        <span class="keyword">if</span> (p.getAmount() > 5000) {\n            <span class="keyword">if</span> (p.getCreditScore() > 700) {\n                <span class="keyword">return</span> <span class="keyword">true</span>;\n            }\n        }\n    } <span class="keyword">else</span> <span class="keyword">if</span> (p.getType() == <span class="string">"DEBIT"</span>) {\n        <span class="comment">// ... more nested logic</span>\n    }\n    <span class="keyword">return</span> <span class="keyword">false</span>;\n}',
            after: '<span class="comment">// Refactored - Strategy Pattern</span>\n<span class="keyword">public</span> <span class="keyword">interface</span> <span class="type">PaymentProcessor</span> {\n    <span class="type">boolean</span> <span class="function">process</span>(<span class="type">Payment</span> payment);\n}\n\n<span class="keyword">public</span> <span class="keyword">class</span> <span class="type">CreditCardProcessor</span> <span class="keyword">implements</span> <span class="type">PaymentProcessor</span> {\n    <span class="keyword">public</span> <span class="type">boolean</span> <span class="function">process</span>(<span class="type">Payment</span> p) {\n        <span class="keyword">return</span> p.getAmount() > 5000 && p.getCreditScore() > 700;\n    }\n}'
        }
    };
    return samples[type] || samples['dead-code'];
}

function getMigrationSteps(type, suggestion) {
    const baseSteps = {
        'dead-code': [
            'Analyze call sites and verify no usages',
            'Move any useful logic to appropriate services',
            'Remove dead code files/methods',
            'Run tests to verify nothing breaks',
            'Update documentation if needed'
        ],
        'coupling': [
            'Identify all direct dependencies',
            'Define event contracts for decoupled communication',
            'Introduce event bus/publisher pattern',
            'Update dependent services to subscribe to events',
            'Gradually remove direct dependencies'
        ],
        'duplicate': [
            'Identify all duplicate instances',
            'Extract shared logic to common utility/service',
            'Replace all duplicates with single source',
            'Add tests for the shared implementation',
            'Verify all callers work correctly'
        ],
        'complexity': [
            'Identify cyclomatic complexity hotspots',
            'Apply appropriate design patterns (Strategy, Factory, etc.)',
            'Break large methods into smaller focused ones',
            'Add unit tests for each new method',
            'Refactor incrementally to minimize risk'
        ]
    };
    return baseSteps[type] || baseSteps['dead-code'];
}

function getRiskLevel(severity) {
    const levels = {
        'critical': { code: 'high', test: 'medium', migration: 'high' },
        'warning': { code: 'medium', test: 'medium', migration: 'medium' },
        'info': { code: 'low', test: 'low', migration: 'low' }
    };
    return levels[severity] || levels['info'];
}

function getRiskColor(level) {
    const colors = {
        'high': '#ff6b6b',
        'medium': '#ff9f43',
        'low': '#00ff88'
    };
    return colors[level] || colors['low'];
}

function getRiskPercent(level) {
    const percent = {
        'high': 85,
        'medium': 55,
        'low': 25
    };
    return percent[level] || 25;
}

function openModal(relic) {
    const modal = document.getElementById('modalOverlay');
    const modalContent = document.querySelector('.modal');
    
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('active');
        modalContent.style.transform = 'scale(1)';
        modalContent.style.opacity = '1';
    }, 10);
    
    const samples = getCodeSamples(relic.type);
    const steps = getMigrationSteps(relic.type, relic.suggestion);
    const risks = getRiskLevel(relic.severity);
    
    const severityColors = {
        'critical': '#ff6b6b',
        'warning': '#ff9f43',
        'info': '#00d4ff'
    };
    
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div class="modal-header-info">
            <div class="modal-title">${relic.title}</div>
            <div class="modal-meta">
                <span class="severity-badge" style="background-color: ${severityColors[relic.severity]}20; color: ${severityColors[relic.severity]}; border-color: ${severityColors[relic.severity]}">
                    ${relic.severity.toUpperCase()}
                </span>
                <span class="module-badge">${relic.module}</span>
            </div>
        </div>

        <div class="code-comparison">
            <div class="code-block before">
                <div class="code-header">
                    <span class="code-badge before">BEFORE</span>
                    <span class="code-file">${relic.module}.java</span>
                </div>
                <pre><code>${samples.before}</code></pre>
            </div>
            <div class="code-block after">
                <div class="code-header">
                    <span class="code-badge after">AFTER</span>
                    <span class="optimized-badge">OPTIMIZED</span>
                    <span class="code-file">${relic.module}.java</span>
                </div>
                <pre><code>${samples.after}</code></pre>
            </div>
        </div>

        <div class="risk-assessment">
            <div class="risk-title">RISK ASSESSMENT</div>
            <div class="risk-grid">
                <div class="risk-item">
                    <div class="risk-header">
                        <span class="risk-label">Impact</span>
                        <span class="risk-value" style="color: ${getRiskColor(risks.code)}">${risks.code.toUpperCase()}</span>
                    </div>
                    <div class="risk-bar">
                        <div class="risk-bar-fill" style="width: ${getRiskPercent(risks.code)}%; background: ${getRiskColor(risks.code)}"></div>
                    </div>
                </div>
                <div class="risk-item">
                    <div class="risk-header">
                        <span class="risk-label">Test Coverage</span>
                        <span class="risk-value" style="color: ${getRiskColor(risks.test)}">${risks.test.toUpperCase()}</span>
                    </div>
                    <div class="risk-bar">
                        <div class="risk-bar-fill" style="width: ${getRiskPercent(risks.test)}%; background: ${getRiskColor(risks.test)}"></div>
                    </div>
                </div>
                <div class="risk-item">
                    <div class="risk-header">
                        <span class="risk-label">Rollback Difficulty</span>
                        <span class="risk-value" style="color: ${getRiskColor(risks.migration)}">${risks.migration.toUpperCase()}</span>
                    </div>
                    <div class="risk-bar">
                        <div class="risk-bar-fill" style="width: ${getRiskPercent(risks.migration)}%; background: ${getRiskColor(risks.migration)}"></div>
                    </div>
                </div>
            </div>
        </div>

        <div class="migration-steps">
            <div class="steps-title">MIGRATION STEPS</div>
            <div class="steps-grid">
                ${steps.slice(0, 3).map((step, i) => `
                    <div class="step-card">
                        <div class="step-number">${i + 1}</div>
                        <div class="step-content">${step}</div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="modal-actions">
            <button class="btn btn-secondary" onclick="copyCode()">COPY CODE</button>
            <button class="btn btn-secondary">EXPORT REPORT</button>
            <button class="btn btn-primary" onclick="closeModal()">APPLY CHANGES</button>
        </div>
    `;
}

function closeModal() {
    const modal = document.getElementById('modalOverlay');
    const modalContent = document.querySelector('.modal');
    
    modalContent.style.transform = 'scale(0.9)';
    modalContent.style.opacity = '0';
    
    setTimeout(() => {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }, 300);
}

function copyCode() {
    const newCode = document.querySelector('.code-block.after pre').textContent;
    navigator.clipboard.writeText(newCode).then(() => {
        const btn = document.querySelector('.modal-actions .btn-secondary:first-child');
        const originalText = btn.textContent;
        btn.textContent = 'COPIED!';
        setTimeout(() => {
            btn.textContent = originalText;
        }, 2000);
    });
}

function startScan() {
    const statusBar = document.querySelector('.status-bar span');
    const scanLine = document.querySelector('.scan-line');
    
    statusBar.textContent = 'SCANNING...';
    scanLine.classList.add('scanning');
    
    const scanOverlay = document.createElement('div');
    scanOverlay.className = 'scan-overlay';
    document.body.appendChild(scanOverlay);
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += 2;
        scanOverlay.style.background = `linear-gradient(to bottom, transparent ${progress - 5}%, rgba(0, 255, 136, 0.1) ${progress}%, transparent ${progress + 5}%)`;
        
        if (progress >= 100) {
            clearInterval(interval);
            statusBar.textContent = 'SCAN COMPLETE';
            scanLine.classList.remove('scanning');
            setTimeout(() => {
                if (scanOverlay.parentNode) {
                    scanOverlay.remove();
                }
            }, 500);
        }
    }, 50);
}

function animateValue(id, end, duration, suffix = '') {
    const obj = document.getElementById(id);
    if (!obj) return;
    let start = 0;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(start + (end - start) * easeOut);
        
        if (end >= 100000) {
            obj.textContent = (current / 1000).toFixed(0) + 'K';
        } else {
            obj.textContent = current.toLocaleString() + suffix;
        }
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    requestAnimationFrame(update);
}

function runLoadingAnimation() {
    const lines = ['loaderLine1', 'loaderLine2', 'loaderLine3', 'loaderLine4', 'loaderLine5'];
    const progress = document.getElementById('loaderProgress');
    const overlay = document.getElementById('loaderOverlay');
    
    let currentLine = 0;
    let currentProgress = 0;
    
    const lineInterval = setInterval(() => {
        if (currentLine < lines.length) {
            document.getElementById(lines[currentLine]).style.opacity = '1';
            currentLine++;
            currentProgress += 20;
            progress.style.width = currentProgress + '%';
        } else {
            clearInterval(lineInterval);
            setTimeout(() => {
                overlay.classList.add('fade-out');
                setTimeout(() => {
                    overlay.style.display = 'none';
                    startNumberAnimations();
                    startTerminalLoop();
                }, 500);
            }, 500);
        }
    }, 500);
}

function startNumberAnimations() {
    animateValue('statLines', 128456, 1500);
    animateValue('statFiles', 2847, 1500);
    animateValue('statCommits', 3247, 1500);
    animateValue('statDevs', 12, 1500);
}

function startTerminalLoop() {
    const statusElement = document.getElementById('terminalStatus');
    const statuses = [
        'System Online | 12 Modules Active | 36 Relics Detected | Debt Score: 72/100',
        'Scanning repository... | Analyzing code patterns | Detecting anomalies',
        'AI Engine Ready | Pattern Recognition Active | Generating insights',
        '128K Lines Analyzed | 2,847 Files Processed | 3,247 Commits Scanned',
        'Code Health: 68% | Technical Debt: 4.2 | Risk Level: MEDIUM'
    ];
    
    let currentIndex = 0;
    setInterval(() => {
        currentIndex = (currentIndex + 1) % statuses.length;
        statusElement.textContent = statuses[currentIndex];
    }, 3000);
}

function toggleLeftPanel() {
    const leftPanel = document.querySelector('.left-panel');
    const centerPanel = document.querySelector('.center-panel');
    const toggleBtn = document.querySelector('.panel-toggle-left');
    
    leftPanelCollapsed = !leftPanelCollapsed;
    
    if (leftPanelCollapsed) {
        leftPanel.style.width = '0';
        leftPanel.style.padding = '0';
        leftPanel.style.overflow = 'hidden';
        toggleBtn.textContent = '▶';
        toggleBtn.style.left = '0';
    } else {
        leftPanel.style.width = '280px';
        leftPanel.style.padding = '20px';
        leftPanel.style.overflow = 'auto';
        toggleBtn.textContent = '◀';
        toggleBtn.style.left = '280px';
    }
}

function toggleRightPanel() {
    const rightPanel = document.querySelector('.right-panel');
    const centerPanel = document.querySelector('.center-panel');
    const toggleBtn = document.querySelector('.panel-toggle-right');
    
    rightPanelCollapsed = !rightPanelCollapsed;
    
    if (rightPanelCollapsed) {
        rightPanel.style.width = '0';
        rightPanel.style.padding = '0';
        rightPanel.style.overflow = 'hidden';
        toggleBtn.textContent = '◀';
        toggleBtn.style.right = '0';
    } else {
        rightPanel.style.width = '400px';
        rightPanel.style.padding = '0';
        rightPanel.style.overflow = 'hidden';
        toggleBtn.textContent = '▶';
        toggleBtn.style.right = '400px';
    }
    
    setTimeout(() => {
        renderStratigraphy();
        renderGraph();
    }, 300);
}

function checkResponsive() {
    const mobileWarning = document.getElementById('mobileWarning');
    if (window.innerWidth < 1200) {
        mobileWarning.style.display = 'flex';
    } else {
        mobileWarning.style.display = 'none';
    }
}

function init() {
    createMatrixRain();
    renderStratigraphy();
    renderGraph();
    renderRelics();

    window.addEventListener('resize', () => {
        checkResponsive();
        renderStratigraphy();
        renderGraph();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });

    runLoadingAnimation();
    checkResponsive();
}

document.addEventListener('DOMContentLoaded', init);