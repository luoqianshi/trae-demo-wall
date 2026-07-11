/* ================================================================
 * 银行服务治理平台 - 导航逻辑 layout.js
 * 功能：菜单渲染 / 多标签页管理 / 页面切换 / 面包屑 / 下拉菜单 / 用户-管理后台切换
 * ================================================================ */

(function () {
    'use strict';

    /* ============================================================
     * 0. 当前模式状态 + 标签页管理
     * ============================================================ */
    let currentMode = 'user'; // 'user' | 'admin'
    let tabs = []; // { id, url, title, breadcrumb, closable }
    let activeTabId = null;

    /* ============================================================
     * 1. 菜单数据 —— 用户侧（11 个模块）
     * 改动说明（V1.5）：
     *  - "环境总览"从"服务治理"移至"投产管理"（与版本晋升管理同属发布管道场景）
     *  - "预警通知"→"完整性预警"（补充域前缀，避免与管理侧"通知管理"混淆）
     *  - "规则执行记录"→"规则执行日志"（与管理侧同页面名称统一）
     *  - "分类统计"→"分类分布总览"（避免与"分类统计报表"混淆）
     *  - "文件规范文档"→"文件格式规范"（与管理侧同页面名称统一）
     *  - "命名规范查询"→"文件命名规范查询"（补充"文件"限定词）
     *  历史改动（V1.4）：
     *  - "系统环境管理"菜单组移除，版本晋升管理→投产管理，配置差异对比/一致性校验→环境总览子页面
     *  - "服务治理"增加血缘维护（从管理侧迁入）
     *  - "API规范文档"→"报文头规范查询"，"FAQ管理"→"FAQ查询"
     *  - "治理总览"增加治理指标看板
     * ============================================================ */
    const userMenuData = [
        { title: '首页驾驶舱', icon: 'fa-tachometer', url: 'pages/dashboard/home.html', single: true },
        { title: '工作台', icon: 'fa-user-circle-o', children: [
            { title: '待办事项',        url: 'pages/workspace/todo.html' },
            { title: '我的申请',        url: 'pages/application/my-apply.html' },
            { title: '审核中心',        url: 'pages/rule/audit-workbench.html' },
            { title: '我的服务',        url: 'pages/workspace/my-services.html' },
            { title: '消息中心',        url: 'pages/workspace/message.html' },
            { title: '影响分析预警',    url: 'pages/workspace/impact-alert.html' },
            { title: '我的收藏',        url: 'pages/workspace/favorite.html' }
        ]},
        { title: '服务目录', icon: 'fa-th-large', children: [
            { title: '服务导航',      url: 'pages/interface/navigate.html' },
            { title: '服务清单',      url: 'pages/service/service-list.html' },
            { title: '接口服务清单',  url: 'pages/interface/list.html' },
            { title: '文件服务清单',  url: 'pages/interface/file-list.html' },
            { title: '接入系统清单',  url: 'pages/system/system-list.html' }
        ]},
        { title: '服务治理', icon: 'fa-sitemap', children: [
            { title: '完整性检查',     url: 'pages/integrity/check.html' },
            { title: '完整性审计',     url: 'pages/integrity/audit.html' },
            { title: '完整性预警',     url: 'pages/integrity/alert.html' },
            { title: '标准合规检查',   url: 'pages/standard/compliance.html' },
            { title: '命名冲突检查',   url: 'pages/standard/naming-conflict.html' },
            { title: '规范落地检查',   url: 'pages/standard/implement-check.html' },
            { title: '版本列表',       url: 'pages/version/list.html' },
            { title: '版本生命周期',   url: 'pages/version/lifecycle.html' },
            { title: '僵尸接口',       url: 'pages/interface/zombie.html' },
            { title: '自定义字段治理', url: 'pages/governance/custom-field-governance.html' },
            { title: '血缘维护',       url: 'pages/lineage/maintain.html' }
        ]},
        { title: '追溯与血缘', icon: 'fa-share-alt', children: [
            { title: '纵向追溯',       url: 'pages/lineage/trace.html' },
            { title: '血缘图谱',       url: 'pages/lineage/graph-view.html' },
            { title: '血缘列表',       url: 'pages/lineage/list-view.html' },
            { title: '文件字段血缘',   url: 'pages/lineage/field-lineage.html' },
            { title: '影响分析',       url: 'pages/lineage/impact.html' },
            { title: '血缘统计',       url: 'pages/lineage/stats.html' }
        ]},
        { title: '标准规范', icon: 'fa-file-text-o', children: [
              { title: '规范文档中心',   url: 'pages/standard/user-query.html' },
              { title: '报文头规范查询', url: 'pages/standard/header-template.html?mode=readonly' },
              { title: '文件格式规范',   url: 'pages/standard/file-format.html?mode=readonly' },
              { title: '文件命名规范查询', url: 'pages/standard/file-naming.html?mode=readonly' },
              { title: '数据标准查询',     url: 'pages/datadict/category.html?mode=readonly' },
              { title: '枚举值查询',     url: 'pages/datadict/enum-mgmt.html?mode=readonly' }
          ]},
        { title: '规则查询', icon: 'fa-cogs', children: [
            { title: '规则查询中心',   url: 'pages/rule/user-query.html' },
            { title: '内置规则库',     url: 'pages/rule/built-in-rules.html' },
            { title: '规则执行日志',   url: 'pages/rule/rule-log.html' }
        ]},
        { title: '投产管理', icon: 'fa-rocket', children: [
            { title: '环境总览',       url: 'pages/environment/overview.html' },
            { title: '变更单管理',     url: 'pages/deploy/change-order.html' },
            { title: '版本晋升管理',   url: 'pages/environment/promotion.html' },
            { title: '投产批次管理',   url: 'pages/deploy/batch.html' },
            { title: '投产历史记录',   url: 'pages/deploy/history.html' }
        ]},
        { title: '存量接口改造', icon: 'fa-refresh', children: [
            { title: '差距分析报告',   url: 'pages/standardization/gap-analysis.html' },
            { title: '字段映射配置',   url: 'pages/standardization/mapping.html' },
            { title: '映射结果查看',   url: 'pages/standardization/mapping-result.html' },
            { title: '改造结果导入',   url: 'pages/standardization/import-result.html' }
        ]},
        { title: '治理总览', icon: 'fa-sitemap', children: [
            { title: '治理指标看板',   url: 'pages/report/governance-dashboard.html' },
            { title: '接口服务总览',   url: 'pages/interface/api-overview.html' },
            { title: '文件服务总览',   url: 'pages/interface/file-overview.html' },
            { title: '治理考核',       url: 'pages/ops/governance-kpi.html' },
            { title: '治理报表',       url: 'pages/report/governance.html' },
            { title: 'SLA报表',        url: 'pages/report/sla-report.html' },
            { title: '服务质量报告',   url: 'pages/report/report.html' },
            { title: '分类分布总览',   url: 'pages/category/stats.html' },
            { title: '分类统计报表',   url: 'pages/report/category-report.html' },
            { title: '行领导成果台账', url: 'pages/report/executive.html' },
            { title: '字段标准化指标', url: 'pages/governance/custom-field-governance.html?mode=readonly' },
            { title: '标准化率统计',   url: 'pages/standardization/rate-stats.html' }
        ]},
        { title: '文档与帮助', icon: 'fa-book', children: [
            { title: '文档列表',       url: 'pages/doc/list.html' },
            { title: '消费方接入指南', url: 'pages/doc/consumer-guide.html' },
            { title: '文件变更通知',   url: 'pages/doc/change-notify.html' },
            { title: 'FAQ查询',        url: 'pages/doc/faq.html' },
            { title: '在线帮助', url: 'pages/ops/help.html' },
            { title: '文件规范说明书', url: 'pages/doc/spec-doc.html' },
            { title: '文档导出',       url: 'pages/doc/export.html' }
        ]}
    ];

    /* ============================================================
     * 1b. 菜单数据 —— 管理后台（10 组，按治理生命周期排序）
     * 改动说明：
     *  - 合并"数据标准管理"入"标准规范管理"（2项）
     *  - 合并"完整性配置"入"规则引擎管理"（2项）
     *  - 消除唯一的三级菜单嵌套，统一扁平为二级
     *  - "追溯与血缘管理"整体移除（查询功能在用户侧，血缘维护移至用户侧服务治理）
     *  - "报文定义规范模板"→"报文体模板管理"（与"报文头模板管理"命名对称）
     *  - 按治理流程排序：分类分级 → 标准规范 → 存量纳管 → 规则引擎 → SLA → 系统管理 → 通知 → 日志 → 运营
     * ============================================================ */
    const adminMenuData = [
        { title: '管理后台首页', icon: 'fa-tachometer', url: 'pages/admin/index.html', single: true },
        { title: '分类分级管理', icon: 'fa-sitemap', children: [
            { title: 'L1业务领域管理', url: 'pages/category/l1-domain.html' },
            { title: 'L2价值流管理',   url: 'pages/category/l2-stream.html' },
            { title: 'L3业务活动管理', url: 'pages/category/l3-activity.html' },
            { title: 'L4任务管理',     url: 'pages/category/l4-task.html' },
            { title: '接口分级标准',   url: 'pages/category/level-standard.html' },
            { title: '分类编码规范',   url: 'pages/category/code-standard.html' },
            { title: '分类统计',       url: 'pages/category/stats.html' }
        ]},
        { title: '标准规范管理', icon: 'fa-file-text-o', children: [
            // 原"数据标准管理"合并项
            { title: '字典管理',       url: 'pages/datadict/category.html' },
            { title: '枚举值管理',     url: 'pages/datadict/enum-mgmt.html' },
            // 原三级嵌套扁平化
            { title: '报文头模板管理', url: 'pages/standard/header-template.html' },
            { title: '报文体模板管理', url: 'pages/standard/body-template.html' },
            { title: '文件命名规范',   url: 'pages/standard/file-naming.html' },
            { title: '文件格式规范',   url: 'pages/standard/file-format.html' },
            { title: '文件目录规范',   url: 'pages/standard/file-dir.html' },
            { title: '文件传输协议规范', url: 'pages/standard/file-protocol.html' },
            { title: '文件模板管理',   url: 'pages/standard/file-template.html' }
        ]},
        { title: '存量数据纳管', icon: 'fa-database', children: [
            { title: '批量导入',       url: 'pages/onboarding/import-page.html' },
            { title: '系统清单管理',   url: 'pages/onboarding/system-list.html' },
            { title: '数据质量报告',   url: 'pages/onboarding/quality-report.html' }
        ]},
        { title: '规则引擎管理', icon: 'fa-cogs', children: [
            { title: '规则管理',       url: 'pages/rule/rule-list.html' },
            { title: '规则执行日志',   url: 'pages/rule/rule-log.html' },
            { title: '内置规则库',     url: 'pages/rule/built-in-rules.html' },
            { title: '审批流程配置',   url: 'pages/rule/process-config.html' },
            // 原"完整性配置"合并项
            { title: '接口依赖关系建模', url: 'pages/integrity/dependency-model.html' },
            { title: '完整性规则',     url: 'pages/integrity/rules.html' }
        ]},
        { title: 'SLA配置', icon: 'fa-bar-chart', children: [
            { title: 'SLA指标定义',    url: 'pages/sla/indicator.html' },
            { title: '文件服务SLA指标', url: 'pages/sla/file-sla.html' },
            { title: 'SLA模板管理',    url: 'pages/sla/template.html' }
        ]},
        { title: '系统管理', icon: 'fa-cog', children: [
            { title: '权限总览',       url: 'pages/system/permission-overview.html' },
            { title: '角色权限管理',   url: 'pages/system/role-mgmt.html' },
            { title: '动态角色映射',   url: 'pages/system/dynamic-role-mapping.html' },
            { title: '数据权限管理',   url: 'pages/system/data-permission.html' },
            { title: '用户管理',       url: 'pages/system/user-mgmt.html' },
            { title: '组织架构管理',   url: 'pages/system/org-mgmt.html' },
            { title: '参数配置',       url: 'pages/system/config.html' }
        ]},
        { title: '通知管理', icon: 'fa-bell-o', children: [
            { title: '消息列表',       url: 'pages/notify/message-list.html' },
            { title: '通知模板管理',   url: 'pages/notify/template.html' },
            { title: '通知配置',       url: 'pages/notify/config.html' }
        ]},
        { title: '日志审计', icon: 'fa-history', children: [
            { title: '操作日志',       url: 'pages/logaudit/op-log.html' },
            { title: '登录日志',       url: 'pages/logaudit/login-log.html' },
            { title: '审批日志',       url: 'pages/logaudit/audit-log.html' },
            { title: '审计报告',       url: 'pages/logaudit/report.html' },
            { title: '安全审计',       url: 'pages/logaudit/security.html' }
        ]},
        { title: '运营支撑', icon: 'fa-server', children: [
            { title: '平台监控',       url: 'pages/ops/monitor.html' },
            { title: '批量导入导出',   url: 'pages/ops/batch-io.html' },
            { title: '数据备份与恢复', url: 'pages/ops/backup.html' },
            { title: '数据迁移方案',   url: 'pages/ops/migration.html' },
            { title: '系统日志',       url: 'pages/ops/system-log.html' }
        ]}
    ];

    /* ============================================================
     * 2. 菜单数据获取
     * ============================================================ */
    function getMenuData() {
        return currentMode === 'admin' ? adminMenuData : userMenuData;
    }

    /* ============================================================
     * 3. 菜单渲染（支持三级菜单）
     * ============================================================ */
    function renderMenu() {
        const container = document.getElementById('sidebarMenu');
        if (!container) return;
        const menuData = getMenuData();
        let html = '';
        menuData.forEach((group, idx) => {
            if (group.single) {
                html += `<div class="menu-group" data-idx="${idx}">
                    <div class="menu-item" data-url="${group.url}" data-title="${group.title}" data-label="${group.title}">
                        <i class="menu-icon fa ${group.icon}"></i>
                        <span class="menu-label">${group.title}</span>
                    </div></div>`;
            } else {
                html += `<div class="menu-group" data-idx="${idx}">
                    <div class="menu-item" data-group="${idx}" data-label="${group.title}">
                        <i class="menu-icon fa ${group.icon}"></i>
                        <span class="menu-label">${group.title}</span>
                        <i class="menu-arrow fa fa-angle-right"></i>
                    </div>
                    <div class="submenu">${group.children.map(c => renderSubItem(c, group.title, idx)).join('')}</div></div>`;
            }
        });
        container.innerHTML = html;
        bindMenuEvents();
    }

    /** 渲染单个二级项（若有children则是三级菜单容器） */
    function renderSubItem(item, parentTitle, groupIdx) {
        // 支持三级菜单：该二级项本身有 children，作为可展开容器
        if (item.children && item.children.length > 0) {
            const subId = `subg_${groupIdx}_${item.title}`;
            return `
                <div class="sub-item sub-expand" data-sub-expand="${subId}" data-label="${item.title}">
                    <span style="flex:1">${item.title}</span>
                    <i class="menu-arrow fa fa-angle-right" style="font-size:10px"></i>
                </div>
                <div class="submenu-sub" data-sub-menu="${subId}">
                    ${item.children.map(c => `
                        <div class="sub-item sub-item-deep" data-url="${c.url}" data-title="${c.title}" data-parent="${parentTitle} / ${item.title}">${c.title}</div>
                    `).join('')}
                </div>`;
        }
        return `<div class="sub-item" data-url="${item.url}" data-title="${item.title}" data-parent="${parentTitle}">${item.title}</div>`;
    }

    /* ============================================================
     * 4. 菜单事件绑定（支持三级菜单）
     * ============================================================ */
    function bindMenuEvents() {
        const container = document.getElementById('sidebarMenu');
        if (!container) return;

        // 一级菜单展开/收起
        container.querySelectorAll('.menu-item[data-group]').forEach(item => {
            item.addEventListener('click', () => {
                const group = item.closest('.menu-group');
                const isOpen = group.classList.contains('open');
                container.querySelectorAll('.menu-group').forEach(g => {
                    g.classList.remove('open');
                });
                if (!isOpen) group.classList.add('open');
            });
        });

        // 三级菜单容器点击：展开/收起
        container.querySelectorAll('.sub-expand').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const subId = item.getAttribute('data-sub-expand');
                const subMenu = container.querySelector(`[data-sub-menu="${subId}"]`);
                if (subMenu) {
                    const isOpen = subMenu.classList.contains('show');
                    // 先收起同组内其他子菜单
                    subMenu.parentElement.querySelectorAll('.submenu-sub').forEach(s => {
                        if (s !== subMenu) s.classList.remove('show');
                    });
                    if (!isOpen) subMenu.classList.add('show');
                }
            });
        });

        // 单级菜单点击 → 打开新标签
        container.querySelectorAll('.menu-item[data-url]').forEach(item => {
            item.addEventListener('click', () => {
                const url = item.getAttribute('data-url');
                const title = item.getAttribute('data-title');
                openTab(url, ['首页', title]);
                setActive(item);
            });
        });

        // 二级/三级菜单点击 → 打开新标签
        container.querySelectorAll('.sub-item[data-url]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const url = item.getAttribute('data-url');
                const title = item.getAttribute('data-title');
                const parent = item.getAttribute('data-parent');
                const trail = parent.split(' / ');
                trail.push(title);
                trail.unshift('首页');
                openTab(url, trail);
                setActive(item);
            });
        });
    }

    function setActive(element) {
        const container = document.getElementById('sidebarMenu');
        container.querySelectorAll('.menu-item.active, .sub-item.active').forEach(el => {
            el.classList.remove('active');
        });
        element.classList.add('active');
    }

    /* ============================================================
     * 5. 多标签页核心逻辑：openTab / switchTab / closeTab
     * ============================================================ */

    // 从 URL 生成稳定的标签 ID（去除参数，使不同参数相同 URL 共享标签）
    function getTabIdFromUrl(url) {
        let base = url.split('?')[0].split('#')[0];
        return 'tab_' + base.replace(/[^a-zA-Z0-9]/g, '_');
    }

    function openTab(url, breadcrumbArr, params) {
        // 如果带参数，将参数拼到 URL
        let finalUrl = url;
        if (params && typeof params === 'object' && Object.keys(params).length > 0) {
            const queryStr = Object.keys(params)
                .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
                .join('&');
            finalUrl += (url.indexOf('?') >= 0 ? '&' : '?') + queryStr;
        }

        const tabId = getTabIdFromUrl(finalUrl);
        const label = Array.isArray(breadcrumbArr)
            ? breadcrumbArr[breadcrumbArr.length - 1]
            : (typeof breadcrumbArr === 'string' ? breadcrumbArr : '新页面');

        // 如果已存在相同 tabId，直接切换
        const existing = tabs.find(t => t.id === tabId);
        if (existing) {
            // 即使已存在，也刷新 URL（因为参数可能有变化）
            existing.url = finalUrl;
            existing.breadcrumb = breadcrumbArr;
            const frame = document.getElementById('frame_' + tabId);
            if (frame && frame.src !== finalUrl) {
                frame.src = finalUrl;
            }
            switchTab(tabId);
            return;
        }

        // 判断是否为首页（不可关闭）
        const isHome = (currentMode === 'admin'
            ? url === 'pages/admin/index.html'
            : url === 'pages/dashboard/home.html');

        const tab = {
            id: tabId,
            url: finalUrl,
            title: label,
            breadcrumb: breadcrumbArr,
            closable: !isHome
        };
        tabs.push(tab);

        // 创建 iframe
        const contentArea = document.getElementById('contentArea');
        const iframe = document.createElement('iframe');
        iframe.id = 'frame_' + tabId;
        iframe.src = finalUrl;
        iframe.className = 'hidden-frame';
        iframe.frameBorder = '0';
        contentArea.appendChild(iframe);

        // 渲染标签栏
        renderTabBar();
        switchTab(tabId);
    }

    function switchTab(tabId) {
        activeTabId = tabId;
        // 更新 iframe 显示状态
        document.querySelectorAll('#contentArea iframe').forEach(f => {
            if (f.id === 'frame_' + tabId) {
                f.classList.remove('hidden-frame');
            } else {
                f.classList.add('hidden-frame');
            }
        });
        // 更新标签项高亮
        document.querySelectorAll('.tab-item-tab').forEach(t => {
            if (t.getAttribute('data-tab-id') === tabId) {
                t.classList.add('active');
            } else {
                t.classList.remove('active');
            }
        });
        // 更新面包屑
        const tab = tabs.find(t => t.id === tabId);
        if (tab && tab.breadcrumb) {
            updateBreadcrumb(tab.breadcrumb);
        }
    }

    function closeTab(tabId) {
        const idx = tabs.findIndex(t => t.id === tabId);
        if (idx < 0) return;
        if (!tabs[idx].closable) return; // 首页不可关闭

        // 移除 iframe
        const frame = document.getElementById('frame_' + tabId);
        if (frame) frame.remove();

        tabs.splice(idx, 1);

        // 如果关闭的是当前激活标签，切换到相邻标签
        if (activeTabId === tabId && tabs.length > 0) {
            const newIdx = Math.min(idx, tabs.length - 1);
            switchTab(tabs[newIdx].id);
        }

        renderTabBar();
    }

    function renderTabBar() {
        const bar = document.getElementById('tabBar');
        if (!bar) return;
        let html = '';
        tabs.forEach(tab => {
            html += `<div class="tab-item-tab ${tab.id === activeTabId ? 'active' : ''}" data-tab-id="${tab.id}" onclick="__govSwitchTab('${tab.id}')">
                <i class="fa fa-file-o tab-icon"></i>
                <span>${tab.title}</span>
                ${tab.closable ? `<span class="tab-close" onclick="event.stopPropagation();__govCloseTab('${tab.id}')"><i class="fa fa-times"></i></span>` : ''}
            </div>`;
        });
        bar.innerHTML = html;
    }

    // 暴露到全局给 HTML onclick 调用
    window.__govSwitchTab = switchTab;
    window.__govCloseTab = closeTab;

    /* ============================================================
     * 6. 面包屑更新
     * ============================================================ */
    function updateBreadcrumb(items) {
        const bc = document.getElementById('breadcrumb');
        if (!bc || !items || !items.length) return;
        let html = `<span class="bc-icon"><i class="fa fa-home"></i></span>`;
        items.forEach((it, i) => {
            if (i > 0) html += `<span class="bc-sep">/</span>`;
            if (i === items.length - 1) html += `<span class="bc-item active">${it}</span>`;
            else html += `<span class="bc-item">${it}</span>`;
        });
        bc.innerHTML = html;
    }

    /* ============================================================
     * 7. 侧边栏折叠
     * ============================================================ */
    function toggleSidebar() {
        const app = document.querySelector('.app-container');
        if (!app) return;
        app.classList.toggle('collapsed');
        try { localStorage.setItem('sidebar-collapsed', app.classList.contains('collapsed') ? '1' : '0'); } catch (e) {}
    }
    function initSidebarToggle() {
        const btn = document.getElementById('sidebarToggle');
        if (!btn) return;
        btn.addEventListener('click', () => toggleSidebar());
        try {
            if (localStorage.getItem('sidebar-collapsed') === '1') {
                document.querySelector('.app-container').classList.add('collapsed');
            }
        } catch (e) {}
    }

    /* ============================================================
     * 8. 下拉菜单（消息 / 用户）
     * ============================================================ */
    function initDropdowns() {
        const notifyBtn = document.getElementById('notifyBtn');
        const notifyDrop = document.getElementById('notifyDropdown');
        const userBtn = document.getElementById('userBtn');
        const userDrop = document.getElementById('userDropdown');

        function toggleDropdown(btn, drop) {
            if (!btn || !drop) return;
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.dropdown.show').forEach(d => { if (d !== drop) d.classList.remove('show'); });
                drop.classList.toggle('show');
            });
        }
        function closeAll() {
            document.querySelectorAll('.dropdown.show').forEach(d => d.classList.remove('show'));
        }

        toggleDropdown(notifyBtn, notifyDrop);
        toggleDropdown(userBtn, userDrop);

        // 用户下拉项点击
        if (userDrop) {
            userDrop.querySelectorAll('.dd-item[data-url]').forEach(item => {
                item.addEventListener('click', () => {
                    const url = item.getAttribute('data-url');
                    const title = item.textContent.trim();
                    openTab(url, ['首页', title]);
                    closeAll();
                });
            });
        }

        // 消息下拉"查看全部"
        if (notifyDrop) {
            const link = notifyDrop.querySelector('.dd-link');
            if (link) {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const url = link.getAttribute('href');
                    openTab(url, ['首页', '消息中心', '消息列表']);
                    closeAll();
                });
            }
            // 消息条目也可点击跳转
            notifyDrop.querySelectorAll('.dd-item').forEach(item => {
                if (item.querySelector('.dd-link')) return;
                item.addEventListener('click', () => {
                    const title = item.querySelector('.dd-title');
                    if (title && title.textContent.indexOf('审核') >= 0) {
                        openTab('pages/rule/audit-workbench.html', ['首页', '工作台', '审核中心']);
                    } else if (title && title.textContent.indexOf('预警') >= 0) {
                        openTab('pages/workspace/impact-alert.html', ['首页', '工作台', '影响分析预警']);
                    } else {
                        openTab('pages/notify/message-list.html', ['首页', '消息中心', '消息列表']);
                    }
                    closeAll();
                });
            });
        }

        document.addEventListener('click', closeAll);
    }

    /* ============================================================
     * 10. 全局搜索
     * ============================================================ */
    function initGlobalSearch() {
        const input = document.getElementById('globalSearch');
        if (!input) return;
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && input.value.trim()) {
                alert('搜索：' + input.value.trim() + '\n（Demo 演示，未接入实际搜索服务）');
            }
        });
    }

    /* ============================================================
     * 11. 模式切换：用户 / 管理后台
     * ============================================================ */
    function govSwitchMode(mode) {
        if (mode !== 'user' && mode !== 'admin') return;
        if (currentMode === mode) return;
        currentMode = mode;

        const switchBtn = document.getElementById('modeSwitchBtn');
        if (switchBtn) {
            switchBtn.textContent = currentMode === 'admin' ? '切到用户侧' : '切到管理后台';
            switchBtn.setAttribute('data-mode', currentMode);
        }

        // 清空现有标签（切换模式后重置）
        tabs = [];
        activeTabId = null;
        const contentArea = document.getElementById('contentArea');
        if (contentArea) contentArea.innerHTML = '';
        renderMenu();

        // 打开对应模式的首页
        const homeUrl = currentMode === 'admin'
            ? 'pages/admin/index.html'
            : 'pages/dashboard/home.html';
        const homeTitle = currentMode === 'admin' ? '管理后台首页' : '首页驾驶舱';
        openTab(homeUrl, ['首页', homeTitle]);

        setTimeout(() => {
            const homeItem = document.querySelector(`.menu-item[data-url="${homeUrl}"]`);
            if (homeItem) {
                document.querySelectorAll('.menu-item.active, .sub-item.active').forEach(el => el.classList.remove('active'));
                homeItem.classList.add('active');
            }
        }, 0);
    }

    /* ============================================================
     * 12. 暴露给 iframe 子页面的全局 API
     * ============================================================ */
    window.governancePlatform = {
        // 切换/打开页面（在当前标签页中导航，或打开新标签）
        navigate: function (url, breadcrumb, params) {
            let finalUrl = url;
            if (params && typeof params === 'object' && Object.keys(params).length > 0) {
                const queryStr = Object.keys(params)
                    .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
                    .join('&');
                finalUrl += (url.indexOf('?') >= 0 ? '&' : '?') + queryStr;
            }
            let bc = ['首页'];
            if (Array.isArray(breadcrumb)) bc = breadcrumb;
            else if (typeof breadcrumb === 'string') bc = ['首页', breadcrumb];

            openTab(finalUrl, bc);

            // 同步高亮侧边栏
            const menuEl = document.querySelector(`.sub-item[data-url="${url}"]`) ||
                           document.querySelector(`.menu-item[data-url="${url}"]`);
            if (menuEl) {
                setActive(menuEl);
                const group = menuEl.closest('.menu-group');
                if (group && !group.classList.contains('open')) {
                    const menuItem = group.querySelector('.menu-item[data-group]');
                    if (menuItem) {
                        document.querySelectorAll('.menu-group').forEach(g => g.classList.remove('open'));
                        group.classList.add('open');
                    }
                }
            }
        },
        getParam: function (key) {
            const url = window.location.search.substring(1);
            const pairs = url.split('&');
            for (let p of pairs) {
                const [k, v] = p.split('=');
                if (decodeURIComponent(k) === key) return decodeURIComponent((v || '').replace(/\+/g, ' '));
            }
            return null;
        },
        govNav: function (url, breadcrumb) { return window.governancePlatform.navigate(url, breadcrumb); },
        openTab: openTab,
        switchMode: govSwitchMode
    };
    window.govSwitchMode = govSwitchMode;

    /* ============================================================
     * 13. postMessage 监听 —— 兼容 Chrome file:// 跨域场景
     * iframe 子页面中调用 window.parent.governancePlatform.navigate() 在 file:// 下会抛 DOMException
     * 因此子页面改用 postMessage 发送导航请求
     * ============================================================ */
    window.addEventListener('message', function (event) {
        if (!event.data) return;
        // 支持两种消息格式：
        // 1. { type: 'GOVERNANCE_NAVIGATE', url, breadcrumb, params }
        // 2. { govNav: true, url, breadcrumb, params } —— 通用导航消息
        if (event.data.type === 'GOVERNANCE_NAVIGATE' || event.data.govNav === true) {
            const url = event.data.url;
            const breadcrumb = event.data.breadcrumb;
            const params = event.data.params;
            if (url && window.governancePlatform) {
                window.governancePlatform.navigate(url, breadcrumb, params);
            }
        }
    });

    /* ============================================================
     * 14. 顶部模式切换按钮
     * ============================================================ */
    function initModeSwitchButton() {
        const btn = document.getElementById('modeSwitchBtn');
        if (!btn) return;
        btn.textContent = '切到管理后台';
        btn.setAttribute('data-mode', currentMode);
        btn.addEventListener('click', () => {
            const next = currentMode === 'admin' ? 'user' : 'admin';
            govSwitchMode(next);
        });
    }

    /* ============================================================
     * 15. 初始化 —— 先渲染菜单，然后打开首页标签
     * ============================================================ */
    document.addEventListener('DOMContentLoaded', () => {
        renderMenu();
        initSidebarToggle();
        initDropdowns();
        initGlobalSearch();
        initModeSwitchButton();

        // 默认打开首页驾驶舱标签
        openTab('pages/dashboard/home.html', ['首页', '首页驾驶舱']);
        setTimeout(() => {
            const homeItem = document.querySelector('.menu-item[data-url="pages/dashboard/home.html"]');
            if (homeItem) homeItem.classList.add('active');
        }, 0);
    });
})();
