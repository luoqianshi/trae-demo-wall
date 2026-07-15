/* ============================================================
   慧算智控 - 交互式 Demo 数据层与交互逻辑
   ============================================================ */

// ============================================================
// 数据模型（localStorage 持久化）
// ============================================================

const STORAGE_KEY = 'hszk_demo_data';

// 默认基础数据
const DEFAULT_DATA = {
    departments: [
        { id: 1, name: '业务部门1', code: 'BIZ-001', dept_type: 'business', sort_order: 1, is_active: true, submitted: false },
        { id: 2, name: '业务部门2', code: 'BIZ-002', dept_type: 'business', sort_order: 2, is_active: true, submitted: false },
        { id: 3, name: '业务部门3', code: 'BIZ-003', dept_type: 'business', sort_order: 3, is_active: true, submitted: false },
        { id: 4, name: '职能部门1', code: 'FN-001', dept_type: 'function', sort_order: 1, is_active: true, submitted: false },
        { id: 5, name: '职能部门2', code: 'FN-002', dept_type: 'function', sort_order: 2, is_active: true, submitted: false },
        { id: 6, name: '职能部门3', code: 'FN-003', dept_type: 'function', sort_order: 3, is_active: true, submitted: false },
    ],
    versions: [
        { id: 1, budget_year: 2027, actual_year: 2026, version_no: 1, name: '2027年预算 V1', status: 'draft', deadline: '2026-07-31', created_at: '2026-07-15 22:58' },
    ],
    reportTypes: [
        { id: 1, name: '人力成本', description: '固定工资、提成、奖罚补助、加班费、劳务费、社保、公积金、工会经费等', sort_order: 1, is_active: true },
        { id: 2, name: '业务费', description: '差旅费、业务招待费、办公费、通讯费、交通费、会议费、培训费等', sort_order: 2, is_active: true },
        { id: 3, name: '折旧摊销', description: '固定资产折旧、无形资产摊销、长期待摊摊销等', sort_order: 3, is_active: true },
        { id: 4, name: '租赁费', description: '房屋租赁费、设备租赁费、车辆租赁费等', sort_order: 4, is_active: true },
        { id: 5, name: '维修费', description: '房屋维修费、设备维修费、车辆维修费等', sort_order: 5, is_active: true },
        { id: 6, name: '广告宣传费', description: '广告投放、品牌宣传、媒体合作等', sort_order: 6, is_active: true },
        { id: 7, name: '市场推广费', description: '促销活动、渠道推广、市场调研等', sort_order: 7, is_active: true },
        { id: 8, name: '其他费用', description: '未归类的其他各项费用', sort_order: 8, is_active: true },
    ],
    expenseItems: [
        { id: 1, name: '人数', code: 'HR-001', aliases: '', report_type_id: null, sort_order: 1, is_active: true },
        { id: 2, name: '固定工资', code: 'HR-002', aliases: '固工资,基本工资,基本薪金', report_type_id: 1, sort_order: 2, is_active: true },
        { id: 3, name: '提成/计件工资', code: 'HR-003', aliases: '提成,计件工资,佣金,绩效工资', report_type_id: 1, sort_order: 3, is_active: true },
        { id: 4, name: '奖罚补助', code: 'HR-004', aliases: '奖金,罚款,补助,津贴', report_type_id: 1, sort_order: 4, is_active: true },
        { id: 5, name: '加班费', code: 'HR-005', aliases: '加班工资,加班薪资', report_type_id: 1, sort_order: 5, is_active: true },
        { id: 6, name: '劳务费', code: 'HR-006', aliases: '', report_type_id: 1, sort_order: 6, is_active: true },
        { id: 7, name: '社会保险', code: 'HR-007', aliases: '社保,养老保险,医疗保险,失业保险,五险', report_type_id: 1, sort_order: 7, is_active: true },
        { id: 8, name: '公积金', code: 'HR-008', aliases: '住房公积金', report_type_id: 1, sort_order: 8, is_active: true },
        { id: 9, name: '工会经费', code: 'HR-009', aliases: '', report_type_id: 1, sort_order: 9, is_active: true },
        { id: 10, name: '差旅费', code: 'BIZ-001', aliases: '差旅,出差费,差旅费用', report_type_id: 2, sort_order: 10, is_active: true },
        { id: 11, name: '业务招待费', code: 'BIZ-002', aliases: '招待费,交际费,业务招待', report_type_id: 2, sort_order: 11, is_active: true },
        { id: 12, name: '办公费', code: 'BIZ-003', aliases: '办公用品,办公耗材', report_type_id: 2, sort_order: 12, is_active: true },
        { id: 13, name: '通讯费', code: 'BIZ-004', aliases: '通讯,电话费,通讯费用', report_type_id: 2, sort_order: 13, is_active: true },
        { id: 14, name: '交通费', code: 'BIZ-005', aliases: '交通,车费,交通费用', report_type_id: 2, sort_order: 14, is_active: true },
        { id: 15, name: '会议费', code: 'BIZ-006', aliases: '', report_type_id: 2, sort_order: 15, is_active: true },
        { id: 16, name: '培训费', code: 'BIZ-007', aliases: '培训,教育培训费', report_type_id: 2, sort_order: 16, is_active: true },
        { id: 17, name: '快递费', code: 'BIZ-008', aliases: '快递,物流费', report_type_id: 2, sort_order: 17, is_active: true },
        { id: 18, name: '低值易耗品', code: 'BIZ-009', aliases: '', report_type_id: 2, sort_order: 18, is_active: true },
        { id: 19, name: '物料费', code: 'BIZ-010', aliases: '', report_type_id: 2, sort_order: 19, is_active: true },
        { id: 20, name: '广告宣传费', code: 'BIZ-011', aliases: '广告费,广告投放', report_type_id: 6, sort_order: 20, is_active: true },
        { id: 21, name: '促销费', code: 'BIZ-012', aliases: '', report_type_id: 7, sort_order: 21, is_active: true },
        { id: 22, name: '市场推广费', code: 'BIZ-013', aliases: '市场推广,推广费', report_type_id: 7, sort_order: 22, is_active: true },
        { id: 23, name: '固定资产折旧', code: 'DEP-001', aliases: '折旧,固定资产折旧费', report_type_id: 3, sort_order: 23, is_active: true },
        { id: 24, name: '无形资产摊销', code: 'DEP-002', aliases: '摊销,无形资产摊销费', report_type_id: 3, sort_order: 24, is_active: true },
        { id: 25, name: '长期待摊摊销', code: 'DEP-003', aliases: '', report_type_id: 3, sort_order: 25, is_active: true },
        { id: 26, name: '房屋租赁费', code: 'RENT-001', aliases: '房租,房屋租金,办公场地租金', report_type_id: 4, sort_order: 26, is_active: true },
        { id: 27, name: '设备租赁费', code: 'RENT-002', aliases: '设备租金', report_type_id: 4, sort_order: 27, is_active: true },
        { id: 28, name: '车辆租赁费', code: 'RENT-003', aliases: '车租,车辆租金', report_type_id: 4, sort_order: 28, is_active: true },
        { id: 29, name: '房屋维修费', code: 'MAINT-001', aliases: '房屋维修,房屋修缮', report_type_id: 5, sort_order: 29, is_active: true },
        { id: 30, name: '设备维修费', code: 'MAINT-002', aliases: '设备维修,设备修缮', report_type_id: 5, sort_order: 30, is_active: true },
        { id: 31, name: '车辆维修费', code: 'MAINT-003', aliases: '车辆维修,车辆修缮', report_type_id: 5, sort_order: 31, is_active: true },
        { id: 32, name: '财产保险', code: 'INS-001', aliases: '', report_type_id: 8, sort_order: 32, is_active: true },
        { id: 33, name: '车辆保险', code: 'INS-002', aliases: '车险', report_type_id: 8, sort_order: 33, is_active: true },
        { id: 34, name: '员工保险', code: 'INS-003', aliases: '员工意外险,雇主责任险', report_type_id: 8, sort_order: 34, is_active: true },
        { id: 35, name: '印花税', code: 'TAX-001', aliases: '', report_type_id: 8, sort_order: 35, is_active: true },
        { id: 36, name: '房产税', code: 'TAX-002', aliases: '', report_type_id: 8, sort_order: 36, is_active: true },
        { id: 37, name: '车船税', code: 'TAX-003', aliases: '', report_type_id: 8, sort_order: 37, is_active: true },
        { id: 38, name: '土地使用税', code: 'TAX-004', aliases: '土地使用费', report_type_id: 8, sort_order: 38, is_active: true },
        { id: 39, name: '福利费', code: 'OTHER-001', aliases: '', report_type_id: 8, sort_order: 39, is_active: true },
        { id: 40, name: '劳动保护费', code: 'OTHER-002', aliases: '劳保', report_type_id: 8, sort_order: 40, is_active: true },
        { id: 41, name: '绿化费', code: 'OTHER-003', aliases: '', report_type_id: 8, sort_order: 41, is_active: true },
        { id: 42, name: '排污费', code: 'OTHER-004', aliases: '', report_type_id: 8, sort_order: 42, is_active: true },
        { id: 43, name: '审计费', code: 'OTHER-005', aliases: '', report_type_id: 8, sort_order: 43, is_active: true },
        { id: 44, name: '咨询费', code: 'OTHER-006', aliases: '', report_type_id: 8, sort_order: 44, is_active: true },
        { id: 45, name: '诉讼费', code: 'OTHER-007', aliases: '', report_type_id: 8, sort_order: 45, is_active: true },
        { id: 46, name: '其他', code: 'OTHER-008', aliases: '其他费用,杂费', report_type_id: 8, sort_order: 46, is_active: true },
    ],
    expenseDetails: [], // { id, dept_id, report_category, expense_type, tax_rate, m1..m12, pm1..pm12 }
    laborBudgets: [],   // { id, dept_id, expense_item, m1..m12 }
    currentVersionId: 1,
    currentDeptId: 1,
    currentPage: 'home',
    currentDeptFilter: 'all',
    currentBaseTab: 'report-types',
};

let appData = loadData();

function loadData() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.warn('Failed to load data from localStorage:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    } catch (e) {
        console.warn('Failed to save data:', e);
    }
}

function resetData() {
    appData = JSON.parse(JSON.stringify(DEFAULT_DATA));
    saveData();
    showFlash('info', '数据已重置');
    renderPage();
}

// ============================================================
// 费用名称标准化（模拟 B9 功能）
// ============================================================
function normalizeExpenseName(name) {
    if (!name) return name;
    // 精确匹配
    const exact = appData.expenseItems.find(i => i.is_active && i.name === name);
    if (exact) return exact.name;
    // 别名匹配
    for (const item of appData.expenseItems) {
        if (!item.is_active || !item.aliases) continue;
        const aliases = item.aliases.split(',').map(a => a.trim());
        if (aliases.includes(name)) return item.name;
    }
    // 标准化后匹配（去空格括号）
    const normalized = name.replace(/[（）()\/\s]/g, '');
    for (const item of appData.expenseItems) {
        if (!item.is_active) continue;
        if (item.name.replace(/[（）()\/\s]/g, '') === normalized) return item.name;
        if (item.aliases) {
            const aliases = item.aliases.split(',').map(a => a.trim().replace(/[（）()\/\s]/g, ''));
            if (aliases.includes(normalized)) return item.name;
        }
    }
    return name;
}

// ============================================================
// 导航与页面渲染
// ============================================================

function navigate(page, deptId) {
    appData.currentPage = page;
    if (deptId) appData.currentDeptId = deptId;
    saveData();

    // 更新导航激活状态
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const navMap = {
        'home': 'home',
        'department': 'department',
        'deptDetail': 'department',
        'expense': 'department',
        'version': 'version',
        'upload': 'upload',
        'labor': 'upload',
        'report': 'report',
        'basedata': 'basedata',
    };
    const navKey = navMap[page] || 'home';
    const navEl = document.querySelector(`.nav-link[data-nav="${navKey}"]`);
    if (navEl) navEl.classList.add('active');

    // 隐藏所有页面
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    // 页面 ID 映射
    const pageIdMap = {
        'deptDetail': 'page-dept-detail',
        'labor': 'page-upload',
    };
    const pageId = pageIdMap[page] || `page-${page}`;
    const pageEl = document.getElementById(pageId);
    if (pageEl) {
        pageEl.classList.add('active');
        window.scrollTo(0, 0);
    }
    
    // labor 页面需要切换 upload tab
    if (page === 'labor') {
        switchUploadTab('labor');
    }

    renderPage();
}

function renderPage() {
    const page = appData.currentPage;
    switch (page) {
        case 'home': renderHome(); break;
        case 'department': renderDepartmentList(); break;
        case 'deptDetail': renderDeptDetail(); break;
        case 'expense': renderExpense(); break;
        case 'version': renderVersionList(); break;
        case 'upload': renderUpload(); break;
        case 'labor': navigate('upload'); break;
        case 'report': renderReport(); break;
        case 'basedata': renderBaseData(); break;
    }
}

// ============================================================
// 首页
// ============================================================

function renderHome() {
    const depts = appData.departments.filter(d => d.is_active);
    const businessDepts = depts.filter(d => d.dept_type === 'business');
    const functionDepts = depts.filter(d => d.dept_type === 'function');
    const submitted = depts.filter(d => d.submitted).length;
    const bizSubmitted = businessDepts.filter(d => d.submitted).length;
    const fnSubmitted = functionDepts.filter(d => d.submitted).length;

    const totalBudget = appData.expenseDetails.reduce((sum, d) => {
        const total = [d.m1, d.m2, d.m3, d.m4, d.m5, d.m6, d.m7, d.m8, d.m9, d.m10, d.m11, d.m12]
            .reduce((s, v) => s + (v || 0), 0);
        return sum + total;
    }, 0);

    document.getElementById('statSubmitted').textContent = `${submitted}/${depts.length}`;
    document.getElementById('statPct').textContent = `${Math.round(submitted / depts.length * 100)}%`;
    document.getElementById('statBar').style.width = `${submitted / depts.length * 100}%`;
    document.getElementById('statBusiness').textContent = `${bizSubmitted}/${businessDepts.length}`;
    document.getElementById('statBusinessPct').textContent = `${Math.round(bizSubmitted / businessDepts.length * 100)}%`;
    document.getElementById('statBusinessBar').style.width = `${bizSubmitted / businessDepts.length * 100}%`;
    document.getElementById('statFunction').textContent = `${fnSubmitted}/${functionDepts.length}`;
    document.getElementById('statFunctionPct').textContent = `${Math.round(fnSubmitted / functionDepts.length * 100)}%`;
    document.getElementById('statFunctionBar').style.width = `${fnSubmitted / functionDepts.length * 100}%`;
    document.getElementById('statTotal').textContent = formatMoney(totalBudget);

    const v = appData.versions.find(v => v.id === appData.currentVersionId);
    if (v) {
        document.getElementById('homeVersionName').textContent = v.name;
        document.getElementById('homeVersionYear').textContent = `预算年：${v.budget_year}`;
        document.getElementById('homeVersionActual').textContent = `对比年：${v.actual_year}年实际`;
        document.getElementById('homeVersionStatus').textContent = statusLabel(v.status);
        document.getElementById('homeVersionStatus').className = `badge badge-${v.status}`;
        document.getElementById('homeVersionDeadline').textContent = `截止日期：${v.deadline}`;
    }

    // 版本列表
    const tbody = document.getElementById('homeVersionList');
    tbody.innerHTML = appData.versions.map(v => `
        <tr>
            <td><strong>${v.name}</strong></td>
            <td>${v.budget_year}</td>
            <td>${v.actual_year}年实际</td>
            <td>V${v.version_no}</td>
            <td><span class="badge badge-${v.status}">${statusLabel(v.status)}</span></td>
            <td>${v.deadline}</td>
            <td class="text-muted">${v.created_at}</td>
        </tr>
    `).join('');
}

function statusLabel(status) {
    const map = { draft: '填写中', locked: '已锁定', revising: '修订中', final: '已定稿' };
    return map[status] || status;
}

function formatMoney(v) {
    if (v >= 10000) return `¥${(v / 10000).toFixed(1)}万`;
    return `¥${v.toLocaleString()}`;
}

// ============================================================
// 部门管理
// ============================================================

function filterDept(type, el) {
    appData.currentDeptFilter = type;
    saveData();
    document.querySelectorAll('.filter-tabs .tab').forEach(t => t.classList.remove('active'));
    if (el) el.classList.add('active');
    renderDepartmentList();
}

function renderDepartmentList() {
    let depts = appData.departments.filter(d => d.is_active);
    if (appData.currentDeptFilter === 'business') {
        depts = depts.filter(d => d.dept_type === 'business');
    } else if (appData.currentDeptFilter === 'function') {
        depts = depts.filter(d => d.dept_type === 'function');
    }
    depts.sort((a, b) => {
        if (a.dept_type !== b.dept_type) return a.dept_type.localeCompare(b.dept_type);
        return a.sort_order - b.sort_order;
    });

    document.getElementById('deptCountAll').textContent = `(${appData.departments.filter(d => d.is_active).length})`;

    const grid = document.getElementById('deptGrid');
    grid.innerHTML = depts.map(d => {
        const typeLabel = d.dept_type === 'business' ? '销售部门' : '职能部门';
        const expenseCount = appData.expenseDetails.filter(e => e.dept_id === d.id).length;
        return `
        <div class="dept-card ${d.dept_type}">
            <div class="dept-card-header">
                <div>
                    <div class="dept-card-name">${d.name}</div>
                    <div class="dept-card-code">${d.code} · ${typeLabel}</div>
                </div>
                <span class="badge ${d.submitted ? 'badge-success' : 'badge-draft'}">${d.submitted ? '已提交' : '未提交'}</span>
            </div>
            <div class="text-muted" style="font-size:12px; margin-bottom:4px;">费用明细：${expenseCount} 条</div>
            <div class="dept-card-actions">
                <button class="btn-sm" onclick="goExpenseFromDept(${d.id})">录入数据</button>
                <button class="btn-sm btn-info" onclick="viewDeptDetail(${d.id})">详情</button>
                <button class="btn-sm btn-warning" onclick="showEditDeptModal(${d.id})">编辑</button>
            </div>
        </div>`;
    }).join('');
}

function goExpenseFromDept(id) {
    appData.currentDeptId = id;
    saveData();
    navigate('expense');
}

function viewDeptDetail(id) {
    appData.currentDeptId = id;
    saveData();
    navigate('deptDetail');
}

function goExpense() {
    navigate('expense', appData.currentDeptId);
}

function renderDeptDetail() {
    const d = appData.departments.find(x => x.id === appData.currentDeptId);
    if (!d) return navigate('department');
    const typeLabel = d.dept_type === 'business' ? '销售部门' : '职能部门';
    document.getElementById('deptDetailName').textContent = d.name;
    document.getElementById('deptDetailCode').textContent = `${d.code} · ${typeLabel}`;
    const v = appData.versions.find(v => v.id === appData.currentVersionId);
    document.getElementById('deptDetailVersion').textContent = v ? v.name : '';

    const expenses = appData.expenseDetails.filter(e => e.dept_id === d.id);
    const labors = appData.laborBudgets.filter(e => e.dept_id === d.id);
    const total = expenses.reduce((s, e) => s + sumMonths(e, 'm'), 0);

    document.getElementById('deptDetailExpenseCount').textContent = `${expenses.length} 条`;
    document.getElementById('deptDetailLaborCount').textContent = `${labors.length} 条`;
    document.getElementById('deptDetailTotal').textContent = `¥ ${total.toLocaleString()}`;

    const badge = document.getElementById('deptDetailBadge');
    badge.textContent = d.submitted ? '已提交' : '待提交';
    badge.className = `submit-badge ${d.submitted ? 'done' : 'pending'}`;
    document.getElementById('deptDetailSubmitTime').textContent = d.submitted ? '提交时间：2026-07-15' : '尚未提交';
}

function showAddDeptModal() {
    document.getElementById('modalDeptTitle').textContent = '添加部门';
    document.getElementById('modalDeptId').value = '';
    document.getElementById('modalDeptName').value = '';
    document.getElementById('modalDeptCode').value = '';
    document.getElementById('modalDeptType').value = 'business';
    document.getElementById('modalDeptSort').value = '10';
    openModal('modalDept');
}

function showEditDeptModal(id) {
    const d = appData.departments.find(x => x.id === id);
    if (!d) return;
    document.getElementById('modalDeptTitle').textContent = '编辑部门';
    document.getElementById('modalDeptId').value = d.id;
    document.getElementById('modalDeptName').value = d.name;
    document.getElementById('modalDeptCode').value = d.code || '';
    document.getElementById('modalDeptType').value = d.dept_type;
    document.getElementById('modalDeptSort').value = d.sort_order;
    openModal('modalDept');
}

function showEditDeptFromDetail() {
    showEditDeptModal(appData.currentDeptId);
}

function saveDeptModal() {
    const id = document.getElementById('modalDeptId').value;
    const name = document.getElementById('modalDeptName').value.trim();
    const code = document.getElementById('modalDeptCode').value.trim();
    const dept_type = document.getElementById('modalDeptType').value;
    const sort_order = parseInt(document.getElementById('modalDeptSort').value) || 0;

    if (!name) {
        showFlash('error', '部门名称不能为空');
        return;
    }

    if (id) {
        const d = appData.departments.find(x => x.id === parseInt(id));
        if (d) {
            d.name = name;
            d.code = code;
            d.dept_type = dept_type;
            d.sort_order = sort_order;
        }
        showFlash('success', `部门【${name}】更新成功`);
    } else {
        const newId = Math.max(...appData.departments.map(d => d.id), 0) + 1;
        appData.departments.push({
            id: newId, name, code, dept_type, sort_order,
            is_active: true, submitted: false,
        });
        showFlash('success', `部门【${name}】添加成功`);
    }
    saveData();
    closeModal('modalDept');
    renderPage();
}

// ============================================================
// 费用明细录入
// ============================================================

function renderExpense() {
    const d = appData.departments.find(x => x.id === appData.currentDeptId);
    const v = appData.versions.find(x => x.id === appData.currentVersionId);
    if (!d) return navigate('department');

    document.getElementById('expenseDeptName').textContent = `${d.name} - 费用明细录入`;
    document.getElementById('expenseVersion').textContent = v ? `${v.name} · 预算年${v.budget_year} / 对比年${v.actual_year}` : '';

    const rows = appData.expenseDetails.filter(e => e.dept_id === d.id);
    const tbody = document.getElementById('expenseTbody');

    if (rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="28" class="empty-state">
            <p>暂无费用明细数据</p>
            <button class="btn btn-primary btn-sm" onclick="addExpenseRow()">+ 添加行</button>
        </td></tr>`;
        return;
    }

    tbody.innerHTML = rows.map(r => renderExpenseRow(r)).join('');
    // 重新绑定 select 切换事件
    bindExpenseSelectEvents();
}

function renderExpenseRow(r) {
    const deptName = (appData.departments.find(d => d.id === r.dept_id) || {}).name || '';
    const rtOptions = appData.reportTypes.filter(rt => rt.is_active)
        .map(rt => `<option value="${rt.name}" ${r.report_category === rt.name ? 'selected' : ''}>${rt.name}</option>`).join('');
    const eiOptions = appData.expenseItems.filter(ei => ei.is_active)
        .map(ei => `<option value="${ei.name}" ${r.expense_type === ei.name ? 'selected' : ''}>${ei.name}</option>`).join('');

    const budgetTotal = sumMonths(r, 'm');
    const prevTotal = sumMonths(r, 'pm');

    let budgetMonths = '';
    let prevMonths = '';
    for (let i = 1; i <= 12; i++) {
        budgetMonths += `<td><input type="number" class="cell-input num" value="${r['m' + i] || 0}" onchange="updateExpenseCell(${r.id}, 'm${i}', this.value)"></td>`;
        prevMonths += `<td><input type="number" class="cell-input num" value="${r['pm' + i] || 0}" onchange="updateExpenseCell(${r.id}, 'pm${i}', this.value)"></td>`;
    }

    const hasCustomExpense = !appData.expenseItems.some(ei => ei.is_active && ei.name === r.expense_type);
    const hasCustomCategory = !appData.reportTypes.some(rt => rt.is_active && rt.name === r.report_category);

    return `
    <tr data-id="${r.id}">
        <td><input type="text" value="${deptName}" class="cell-input" disabled></td>
        <td>
            <select class="cell-input select-report-cat" onchange="onCategoryChange(this, ${r.id})">
                <option value="">请选择</option>
                ${rtOptions}
                <option value="__custom__" ${hasCustomCategory ? 'selected' : ''}>自定义...</option>
            </select>
            <input type="text" class="cell-input custom-cat-input" value="${r.report_category || ''}"
                style="${hasCustomCategory ? 'display:block; width:100%; margin-top:4px;' : 'display:none; width:100%; margin-top:4px;'}"
                onchange="updateExpenseCell(${r.id}, 'report_category', this.value)">
        </td>
        <td>
            <select class="cell-input select-expense-type" onchange="onExpenseTypeChange(this, ${r.id})">
                <option value="">请选择</option>
                ${eiOptions}
                <option value="__custom__" ${hasCustomExpense ? 'selected' : ''}>自定义...</option>
            </select>
            <input type="text" class="cell-input custom-expense-input" value="${r.expense_type || ''}"
                style="${hasCustomExpense ? 'display:block; width:100%; margin-top:4px;' : 'display:none; width:100%; margin-top:4px;'}"
                onchange="updateExpenseCell(${r.id}, 'expense_type', this.value)">
        </td>
        <td><input type="number" class="cell-input num" value="${r.tax_rate || 0}" style="width:60px;" onchange="updateExpenseCell(${r.id}, 'tax_rate', this.value)"></td>
        <td class="row-total row-total-budget" id="total-budget-${r.id}">${budgetTotal.toFixed(2)}</td>
        ${budgetMonths}
        <td class="row-total row-total-prev" id="total-prev-${r.id}">${prevTotal.toFixed(2)}</td>
        ${prevMonths}
        <td class="actions"><button class="btn-sm btn-danger" onclick="deleteExpenseRow(${r.id})">删除</button></td>
    </tr>`;
}

function bindExpenseSelectEvents() {
    // 事件已通过 onchange 属性绑定
}

function onCategoryChange(sel, rowId) {
    const tr = sel.closest('tr');
    const customInput = tr.querySelector('.custom-cat-input');
    const r = appData.expenseDetails.find(e => e.id === rowId);
    if (!r) return;
    if (sel.value === '__custom__') {
        customInput.style.display = 'block';
        customInput.value = '';
        customInput.focus();
    } else {
        customInput.style.display = 'none';
        r.report_category = sel.value;
        saveData();
    }
}

function onExpenseTypeChange(sel, rowId) {
    const tr = sel.closest('tr');
    const customInput = tr.querySelector('.custom-expense-input');
    const r = appData.expenseDetails.find(e => e.id === rowId);
    if (!r) return;
    if (sel.value === '__custom__') {
        customInput.style.display = 'block';
        customInput.value = '';
        customInput.focus();
    } else {
        customInput.style.display = 'none';
        r.expense_type = normalizeExpenseName(sel.value);
        // 自动匹配报表分类
        const item = appData.expenseItems.find(ei => ei.name === r.expense_type && ei.is_active);
        if (item && item.report_type_id) {
            const rt = appData.reportTypes.find(rr => rr.id === item.report_type_id);
            if (rt) {
                r.report_category = rt.name;
                tr.querySelector('.select-report-cat').value = rt.name;
                tr.querySelector('.custom-cat-input').style.display = 'none';
            }
        }
        saveData();
        updateRowTotal(rowId);
    }
}

function updateExpenseCell(rowId, field, value) {
    const r = appData.expenseDetails.find(e => e.id === rowId);
    if (!r) return;
    if (field.startsWith('m') || field.startsWith('pm') || field === 'tax_rate') {
        r[field] = parseFloat(value) || 0;
    } else {
        r[field] = value;
    }
    saveData();
    if (field.startsWith('m') || field.startsWith('pm')) {
        updateRowTotal(rowId);
    }
}

function updateRowTotal(rowId) {
    const r = appData.expenseDetails.find(e => e.id === rowId);
    if (!r) return;
    const budgetTotal = sumMonths(r, 'm');
    const prevTotal = sumMonths(r, 'pm');
    const budgetEl = document.getElementById(`total-budget-${rowId}`);
    const prevEl = document.getElementById(`total-prev-${rowId}`);
    if (budgetEl) budgetEl.textContent = budgetTotal.toFixed(2);
    if (prevEl) prevEl.textContent = prevTotal.toFixed(2);
}

function sumMonths(r, prefix) {
    let sum = 0;
    for (let i = 1; i <= 12; i++) {
        sum += r[prefix + i] || 0;
    }
    return sum;
}

function addExpenseRow() {
    const newId = Math.max(0, ...appData.expenseDetails.map(e => e.id)) + 1;
    const row = { id: newId, dept_id: appData.currentDeptId, report_category: '', expense_type: '', tax_rate: 0 };
    for (let i = 1; i <= 12; i++) { row['m' + i] = 0; row['pm' + i] = 0; }
    appData.expenseDetails.push(row);
    saveData();
    renderExpense();
    showFlash('success', '已添加一行');
}

function deleteExpenseRow(id) {
    if (!confirm('确定删除该行吗？')) return;
    appData.expenseDetails = appData.expenseDetails.filter(e => e.id !== id);
    saveData();
    renderExpense();
    showFlash('success', '已删除');
}

function saveExpense() {
    saveData();
    showFlash('success', '数据已暂存');
}

function submitExpense() {
    const d = appData.departments.find(x => x.id === appData.currentDeptId);
    if (!d) return;
    if (appData.expenseDetails.filter(e => e.dept_id === d.id).length === 0) {
        if (!confirm('当前没有任何费用明细，确定提交吗？')) return;
    }
    d.submitted = true;
    saveData();
    showFlash('success', '预算已提交');
    renderPage();
}

function exportExpense() {
    showFlash('info', '费用明细导出中...');
}

// ============================================================
// 版本管理
// ============================================================

function renderVersionList() {
    const tbody = document.getElementById('versionList');
    tbody.innerHTML = appData.versions.map(v => `
        <tr>
            <td><strong>${v.name}</strong></td>
            <td>${v.budget_year}</td>
            <td>${v.actual_year}年实际</td>
            <td>V${v.version_no}</td>
            <td><span class="badge badge-${v.status}">${statusLabel(v.status)}</span></td>
            <td>${v.deadline}</td>
            <td class="text-muted">${v.created_at}</td>
            <td class="actions">
                ${v.status === 'draft' ? `<button class="btn-sm btn-warning" onclick="lockVersion(${v.id})">锁定</button>` : ''}
                ${v.status === 'locked' ? `<button class="btn-sm btn-info" onclick="finalizeVersion(${v.id})">定稿</button>` : ''}
                <button class="btn-sm btn-danger" onclick="deleteVersion(${v.id})">删除</button>
            </td>
        </tr>
    `).join('');
}

function showCreateVersionModal() {
    document.getElementById('modalVerYear').value = 2027;
    document.getElementById('modalVerActual').value = 2026;
    document.getElementById('modalVerName').value = '';
    document.getElementById('modalVerDeadline').value = '2026-07-31';
    openModal('modalVersion');
}

function saveVersionModal() {
    const budget_year = parseInt(document.getElementById('modalVerYear').value);
    const actual_year = parseInt(document.getElementById('modalVerActual').value);
    const name = document.getElementById('modalVerName').value.trim() || `${budget_year}年预算 V${appData.versions.length + 1}`;
    const deadline = document.getElementById('modalVerDeadline').value;
    if (!budget_year) {
        showFlash('error', '请输入预算年度');
        return;
    }
    const maxNo = Math.max(0, ...appData.versions.filter(v => v.budget_year === budget_year).map(v => v.version_no));
    const newId = Math.max(0, ...appData.versions.map(v => v.id)) + 1;
    const now = new Date();
    const createdAt = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    appData.versions.push({
        id: newId, budget_year, actual_year,
        version_no: maxNo + 1, name,
        status: 'draft', deadline, created_at: createdAt,
    });
    appData.currentVersionId = newId;
    saveData();
    closeModal('modalVersion');
    showFlash('success', `版本【${name}】创建成功`);
    renderPage();
}

function lockVersion(id) {
    if (!confirm('确定锁定该版本吗？锁定后各部门将无法修改数据。')) return;
    const v = appData.versions.find(x => x.id === id);
    if (v) { v.status = 'locked'; saveData(); showFlash('success', '版本已锁定'); renderPage(); }
}

function finalizeVersion(id) {
    if (!confirm('确定将版本定稿吗？定稿后将不可再修改。')) return;
    const v = appData.versions.find(x => x.id === id);
    if (v) { v.status = 'final'; saveData(); showFlash('success', '版本已定稿'); renderPage(); }
}

function deleteVersion(id) {
    if (appData.versions.length <= 1) {
        showFlash('error', '至少保留一个版本');
        return;
    }
    if (!confirm('确定删除该版本吗？相关数据将一并删除。')) return;
    appData.versions = appData.versions.filter(v => v.id !== id);
    if (appData.currentVersionId === id) {
        appData.currentVersionId = appData.versions[0].id;
    }
    saveData();
    showFlash('success', '版本已删除');
    renderPage();
}

// ============================================================
// 数据导入
// ============================================================

function switchUploadTab(tab, el) {
    document.querySelectorAll('.sub-sidebar-item').forEach(i => i.classList.remove('active'));
    if (el) el.classList.add('active');
    document.getElementById('upload-expense').style.display = tab === 'expense' ? 'block' : 'none';
    document.getElementById('upload-labor').style.display = tab === 'labor' ? 'block' : 'none';
}

function renderUpload() {
    // 填充部门下拉
    const deptSelect = document.getElementById('uploadDept');
    if (deptSelect && deptSelect.options.length === 0) {
        appData.departments.filter(d => d.is_active).forEach(d => {
            const opt = document.createElement('option');
            opt.value = d.id;
            opt.textContent = d.name;
            deptSelect.appendChild(opt);
        });
    }
    // 填充版本下拉
    const verSelect = document.getElementById('uploadVersion');
    const laborVerSelect = document.getElementById('laborVersion');
    [verSelect, laborVerSelect].forEach(sel => {
        if (!sel) return;
        if (sel.options.length > 0) return;
        appData.versions.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v.id;
            opt.textContent = `${v.name} (${statusLabel(v.status)})`;
            sel.appendChild(opt);
        });
    });
}

function handleFileSelect(input, displayId) {
    const file = input.files[0];
    if (file) {
        document.getElementById(displayId).textContent = `已选择：${file.name}`;
    }
}

function uploadExpense() {
    const file = document.getElementById('expenseFile').files[0];
    const deptId = document.getElementById('uploadDept').value;
    if (!deptId) {
        showFlash('error', '请选择部门');
        return;
    }
    if (!file) {
        showFlash('error', '请选择文件');
        return;
    }
    // 模拟解析：生成几条示例数据
    const sampleItems = [
        { report: '人力成本', item: '固定工资' },
        { report: '人力成本', item: '社会保险' },
        { report: '业务费', item: '差旅费' },
        { report: '业务费', item: '办公费' },
    ];
    let count = 0;
    sampleItems.forEach(s => {
        const newId = Math.max(0, ...appData.expenseDetails.map(d => d.id || 0)) + 1;
        const newRow = {
            id: newId, dept_id: parseInt(deptId),
            report_category: s.report, expense_type: s.item, tax_rate: 0,
        };
        for (let i = 1; i <= 12; i++) { newRow['m' + i] = Math.floor(Math.random() * 50000 + 10000); newRow['pm' + i] = Math.floor(Math.random() * 45000 + 8000); }
        appData.expenseDetails.push(newRow);
        count++;
    });
    saveData();
    showFlash('success', `成功导入 ${count} 条费用明细`);
    setTimeout(() => navigate('expense', parseInt(deptId)), 800);
}

function uploadLabor() {
    const file = document.getElementById('laborFile').files[0];
    if (!file) {
        showFlash('error', '请选择文件');
        return;
    }
    // 模拟导入
    showFlash('success', `人工预算文件 ${file.name} 已导入，数据已增量合并`);
}

function distributeLabor() {
    if (!confirm('确定下发人工预算到各部门费用明细吗？')) return;
    showFlash('success', '人工预算已下发到各部门费用明细');
    // 模拟：给每个部门加一条人力成本
    appData.departments.forEach(d => {
        if (!appData.expenseDetails.find(e => e.dept_id === d.id && e.expense_type === '固定工资')) {
            const newId = Math.max(0, ...appData.expenseDetails.map(d => d.id || 0), ...appData.expenseDetails.map(d => d.id || 0)) + 1;
            const row = { id: newId, dept_id: d.id, report_category: '人力成本', expense_type: '固定工资', tax_rate: 0 };
            for (let i = 1; i <= 12; i++) { row['m' + i] = Math.floor(Math.random() * 80000 + 50000); row['pm' + i] = Math.floor(Math.random() * 70000 + 45000); }
            appData.expenseDetails.push(row);
        }
    });
    saveData();
}

// ============================================================
// 汇总报表
// ============================================================

let reportChartPie = null;
let reportChartBar = null;

function renderReport() {
    const hasData = appData.expenseDetails.length > 0;
    const emptyEl = document.getElementById('reportEmpty');
    const contentEl = document.getElementById('reportContent');

    if (!hasData) {
        if (emptyEl) emptyEl.style.display = 'block';
        if (contentEl) contentEl.style.display = 'none';
        return;
    }
    if (emptyEl) emptyEl.style.display = 'none';
    if (contentEl) contentEl.style.display = 'block';

    // 统计数据
    const depts = appData.departments.filter(d => d.is_active);
    const totalBudget = appData.expenseDetails.reduce((s, d) => s + sumMonths(d, 'm'), 0);
    const submittedCount = depts.filter(d => d.submitted).length;

    // 按报表分类汇总
    const categoryMap = {};
    appData.expenseDetails.forEach(d => {
        const cat = d.report_category || '未分类';
        if (!categoryMap[cat]) categoryMap[cat] = 0;
        categoryMap[cat] += sumMonths(d, 'm');
    });

    // 月度趋势
    const monthly = Array(12).fill(0);
    appData.expenseDetails.forEach(d => {
        for (let i = 1; i <= 12; i++) monthly[i-1] += d['m' + i] || 0;
    });

    // 更新统计卡片
    document.getElementById('reportStatTotal').textContent = formatMoney(totalBudget);
    document.getElementById('reportStatDept').textContent = `${submittedCount}/${depts.length}`;
    document.getElementById('reportStatItems').textContent = appData.expenseDetails.length;
    const avgPerDept = depts.length > 0 ? totalBudget / depts.length : 0;
    document.getElementById('reportStatAvg').textContent = formatMoney(avgPerDept);

    // 部门状态网格
    const deptGrid = document.getElementById('reportDeptGrid');
    deptGrid.innerHTML = depts.map(d => {
        const deptTotal = appData.expenseDetails.filter(e => e.dept_id === d.id)
            .reduce((s, e) => s + sumMonths(e, 'm'), 0);
        return `
        <div class="dept-status-card ${d.submitted ? 'done' : 'pending'}">
            <div class="dept-name">${d.name}</div>
            <div class="dept-amount">${formatMoney(deptTotal)}</div>
            <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">${d.submitted ? '已提交' : '填写中'}</div>
        </div>`;
    }).join('');

    // 渲染图表
    setTimeout(() => {
        renderReportCharts(categoryMap, monthly);
        renderCategoryTable(categoryMap);
    }, 50);
}

function renderReportCharts(categoryMap, monthly) {
    const pieEl = document.getElementById('chartPie');
    const barEl = document.getElementById('chartBar');
    if (!pieEl || !barEl) return;

    // 饼图
    if (reportChartPie) reportChartPie.dispose();
    reportChartPie = echarts.init(pieEl);
    const pieData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
    reportChartPie.setOption({
        tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
        legend: { orient: 'vertical', left: 'left', top: 'center', textStyle: { fontSize: 12 } },
        series: [{
            type: 'pie', radius: ['45%', '70%'], center: ['60%', '50%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
            label: { show: false },
            emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
            data: pieData,
        }],
        color: ['#2563eb', '#f59e0b', '#8b5cf6', '#10b981', '#ef4444', '#06b6d4', '#ec4899', '#6366f1'],
    });

    // 柱状图
    if (reportChartBar) reportChartBar.dispose();
    reportChartBar = echarts.init(barEl);
    reportChartBar.setOption({
        tooltip: { trigger: 'axis', formatter: '{b}: ¥{c}' },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
            type: 'category', data: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
            axisLabel: { fontSize: 11 },
        },
        yAxis: { type: 'value', axisLabel: { formatter: v => v >= 10000 ? (v/10000).toFixed(0)+'万' : v } },
        series: [{
            type: 'bar', data: monthly,
            itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: '#3b82f6' },
                    { offset: 1, color: '#93c5fd' },
                ]),
                borderRadius: [4, 4, 0, 0],
            },
        }],
    });
}

function renderCategoryTable(categoryMap) {
    const tbody = document.getElementById('reportCategoryTable');
    if (!tbody) return;
    const entries = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((s, [_, v]) => s + v, 0);
    tbody.innerHTML = entries.map(([name, value]) => `
        <tr>
            <td><strong>${name}</strong></td>
            <td class="text-mono" style="text-align:right;">¥ ${value.toLocaleString()}</td>
            <td class="text-mono" style="text-align:right;">${total ? (value / total * 100).toFixed(1) : 0}%</td>
        </tr>
    `).join('');
}

// ============================================================
// 基础信息
// ============================================================

function switchBaseTab(tab) {
    appData.currentBaseTab = tab;
    saveData();
    document.querySelectorAll('.bd-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.bd-tab[data-tab="${tab}"]`)?.classList.add('active');
    document.getElementById('bd-report-types').style.display = tab === 'report-types' ? 'block' : 'none';
    document.getElementById('bd-expense-items').style.display = tab === 'expense-items' ? 'block' : 'none';
    if (tab === 'report-types') renderReportTypes();
    else renderExpenseItems();
}

function renderBaseData() {
    const activeTab = appData.currentBaseTab || 'report-types';
    switchBaseTab(activeTab);
}

function renderReportTypes() {
    const tbody = document.getElementById('rtList');
    if (!tbody) return;
    const rts = appData.reportTypes.filter(rt => rt.is_active).sort((a, b) => a.sort_order - b.sort_order);
    tbody.innerHTML = rts.map(rt => `
        <tr>
            <td><strong>${rt.name}</strong></td>
            <td>${rt.description || '-'}</td>
            <td><span class="badge badge-success">启用</span></td>
            <td class="actions">
                <button class="btn-sm" onclick="showEditRTModal(${rt.id})">编辑</button>
                <button class="btn-sm btn-danger" onclick="deleteRT(${rt.id})">删除</button>
            </td>
        </tr>
    `).join('');
}

function showAddRTModal() {
    document.getElementById('modalRTTitle').textContent = '添加报表分类';
    document.getElementById('modalRTId').value = '';
    document.getElementById('modalRTName').value = '';
    document.getElementById('modalRTDesc').value = '';
    openModal('modalRT');
}

function showEditRTModal(id) {
    const rt = appData.reportTypes.find(r => r.id === id);
    if (!rt) return;
    document.getElementById('modalRTTitle').textContent = '编辑报表分类';
    document.getElementById('modalRTId').value = rt.id;
    document.getElementById('modalRTName').value = rt.name;
    document.getElementById('modalRTDesc').value = rt.description || '';
    openModal('modalRT');
}

function saveRTModal() {
    const id = document.getElementById('modalRTId').value;
    const name = document.getElementById('modalRTName').value.trim();
    const desc = document.getElementById('modalRTDesc').value.trim();
    if (!name) { showFlash('error', '名称不能为空'); return; }
    if (id) {
        const rt = appData.reportTypes.find(r => r.id === parseInt(id));
        if (rt) { rt.name = name; rt.description = desc; }
        showFlash('success', `报表分类【${name}】更新成功`);
    } else {
        const newId = Math.max(0, ...appData.reportTypes.map(r => r.id)) + 1;
        const maxSort = Math.max(0, ...appData.reportTypes.map(r => r.sort_order));
        appData.reportTypes.push({ id: newId, name, description: desc, sort_order: maxSort + 1, is_active: true });
        showFlash('success', `报表分类【${name}】添加成功`);
    }
    saveData();
    closeModal('modalRT');
    renderReportTypes();
}

function deleteRT(id) {
    const rt = appData.reportTypes.find(r => r.id === id);
    if (!rt) return;
    if (!confirm(`确定删除报表分类【${rt.name}】吗？`)) return;
    rt.is_active = false;
    saveData();
    showFlash('success', '已删除');
    renderReportTypes();
}

function renderExpenseItems() {
    const tbody = document.getElementById('eiList');
    if (!tbody) return;
    const items = appData.expenseItems.filter(ei => ei.is_active)
        .sort((a, b) => a.sort_order - b.sort_order);
    tbody.innerHTML = items.map(ei => {
        const rt = appData.reportTypes.find(r => r.id === ei.report_type_id);
        return `
        <tr>
            <td><strong>${ei.name}</strong></td>
            <td class="text-mono">${ei.code || '-'}</td>
            <td style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${ei.aliases || ''}">${ei.aliases || '-'}</td>
            <td>${rt ? rt.name : '-'}</td>
            <td><span class="badge badge-success">启用</span></td>
            <td class="actions">
                <button class="btn-sm" onclick="showEditEIModal(${ei.id})">编辑</button>
                <button class="btn-sm btn-danger" onclick="deleteEI(${ei.id})">删除</button>
            </td>
        </tr>`;
    }).join('');
}

function showAddEIModal() {
    document.getElementById('modalEITitle').textContent = '添加费用项目';
    document.getElementById('modalEIId').value = '';
    document.getElementById('modalEIName').value = '';
    document.getElementById('modalEICode').value = '';
    document.getElementById('modalEIAliases').value = '';
    document.getElementById('modalEIRT').value = '';
    openModal('modalEI');
}

function showEditEIModal(id) {
    const ei = appData.expenseItems.find(e => e.id === id);
    if (!ei) return;
    document.getElementById('modalEITitle').textContent = '编辑费用项目';
    document.getElementById('modalEIId').value = ei.id;
    document.getElementById('modalEIName').value = ei.name;
    document.getElementById('modalEICode').value = ei.code || '';
    document.getElementById('modalEIAliases').value = ei.aliases || '';
    document.getElementById('modalEIRT').value = ei.report_type_id || '';
    openModal('modalEI');
}

function saveEIModal() {
    const id = document.getElementById('modalEIId').value;
    const name = document.getElementById('modalEIName').value.trim();
    const code = document.getElementById('modalEICode').value.trim();
    const aliases = document.getElementById('modalEIAliases').value.trim();
    const rtId = document.getElementById('modalEIRT').value;
    if (!name) { showFlash('error', '名称不能为空'); return; }
    if (id) {
        const ei = appData.expenseItems.find(e => e.id === parseInt(id));
        if (ei) {
            ei.name = name; ei.code = code; ei.aliases = aliases;
            ei.report_type_id = rtId ? parseInt(rtId) : null;
        }
        showFlash('success', `费用项目【${name}】更新成功`);
    } else {
        const newId = Math.max(0, ...appData.expenseItems.map(e => e.id)) + 1;
        const maxSort = Math.max(0, ...appData.expenseItems.map(e => e.sort_order));
        appData.expenseItems.push({
            id: newId, name, code, aliases,
            report_type_id: rtId ? parseInt(rtId) : null,
            sort_order: maxSort + 1, is_active: true,
        });
        showFlash('success', `费用项目【${name}】添加成功`);
    }
    saveData();
    closeModal('modalEI');
    renderExpenseItems();
}

function deleteEI(id) {
    const ei = appData.expenseItems.find(e => e.id === id);
    if (!ei) return;
    if (!confirm(`确定删除费用项目【${ei.name}】吗？`)) return;
    ei.is_active = false;
    saveData();
    showFlash('success', '已删除');
    renderExpenseItems();
}

// ============================================================
// 模态框
// ============================================================

function openModal(id) {
    document.getElementById(id).classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

// 点击遮罩关闭模态框
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
    }
});

// ============================================================
// Flash 消息
// ============================================================

function showFlash(type, message) {
    const container = document.getElementById('flashContainer');
    const el = document.createElement('div');
    el.className = `flash flash-${type}`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => {
        el.style.opacity = '0';
        el.style.transform = 'translateX(100%)';
        el.style.transition = 'all 0.3s ease';
        setTimeout(() => el.remove(), 300);
    }, 2500);
}

// ============================================================
// 示例数据
// ============================================================

function seedDemoData() {
    if (!confirm('将载入示例预算数据（覆盖当前数据），确定继续吗？')) return;

    // 清空现有数据
    appData.expenseDetails = [];
    appData.laborBudgets = [];

    const depts = appData.departments.filter(d => d.is_active);
    const items = [
        { cat: '人力成本', item: '固定工资', base: 80000 },
        { cat: '人力成本', item: '社会保险', base: 24000 },
        { cat: '人力成本', item: '公积金', base: 12000 },
        { cat: '业务费', item: '差旅费', base: 15000 },
        { cat: '业务费', item: '办公费', base: 5000 },
        { cat: '业务费', item: '业务招待费', base: 8000 },
        { cat: '折旧摊销', item: '固定资产折旧', base: 20000 },
        { cat: '租赁费', item: '房屋租赁费', base: 30000 },
    ];

    let idCounter = 1;
    depts.forEach(dept => {
        items.forEach(({ cat, item, base }) => {
            // 业务部门业务费高，职能部门人力成本高
            let multiplier = 0.7 + Math.random() * 0.6;
            if (dept.dept_type === 'business' && (cat === '业务费' || item === '业务招待费')) multiplier *= 1.5;
            if (dept.dept_type === 'function' && cat === '人力成本') multiplier *= 1.3;

            const row = {
                id: idCounter++,
                dept_id: dept.id,
                report_category: cat,
                expense_type: item,
                tax_rate: 0,
            };
            for (let i = 1; i <= 12; i++) {
                // 月度有小幅波动
                const monthVar = 0.9 + Math.random() * 0.2;
                row['m' + i] = Math.round(base * multiplier * monthVar);
                row['pm' + i] = Math.round(base * multiplier * monthVar * 0.85);
            }
            appData.expenseDetails.push(row);
        });
        dept.submitted = Math.random() > 0.4; // 60% 提交率
    });

    saveData();
    showFlash('success', '示例数据已载入，共 ' + appData.expenseDetails.length + ' 条费用明细');
    renderPage();
}

// ============================================================
// 初始化
// ============================================================

// ============================================================
// 页面内联辅助函数
// ============================================================

function addRTFromPage() {
    const name = document.getElementById('rtAddName').value.trim();
    const desc = document.getElementById('rtAddDesc').value.trim();
    if (!name) { showFlash('error', '请输入报表分类名称'); return; }
    const newId = Math.max(0, ...appData.reportTypes.map(r => r.id)) + 1;
    const maxSort = Math.max(0, ...appData.reportTypes.map(r => r.sort_order));
    appData.reportTypes.push({ id: newId, name, description: desc, sort_order: maxSort + 1, is_active: true });
    saveData();
    document.getElementById('rtAddName').value = '';
    document.getElementById('rtAddDesc').value = '';
    showFlash('success', `报表分类【${name}】添加成功`);
    renderReportTypes();
}

function addEIFromPage() {
    const name = document.getElementById('eiAddName').value.trim();
    const code = document.getElementById('eiAddCode').value.trim();
    const aliases = document.getElementById('eiAddAliases').value.trim();
    const rtId = document.getElementById('eiAddRT').value;
    if (!name) { showFlash('error', '请输入费用项目名称'); return; }
    const newId = Math.max(0, ...appData.expenseItems.map(e => e.id)) + 1;
    const maxSort = Math.max(0, ...appData.expenseItems.map(e => e.sort_order));
    appData.expenseItems.push({
        id: newId, name, code, aliases,
        report_type_id: rtId ? parseInt(rtId) : null,
        sort_order: maxSort + 1, is_active: true,
    });
    saveData();
    document.getElementById('eiAddName').value = '';
    document.getElementById('eiAddCode').value = '';
    document.getElementById('eiAddAliases').value = '';
    document.getElementById('eiAddRT').value = '';
    document.getElementById('eiCount').textContent = appData.expenseItems.filter(e => e.is_active).length;
    showFlash('success', `费用项目【${name}】添加成功`);
    renderExpenseItems();
}

// ============================================================
// 初始化
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    // 填充报表分类下拉（模态框 + 页面添加表单）
    const rtSelects = [document.getElementById('modalEIRT'), document.getElementById('eiAddRT')];
    rtSelects.forEach(rtSelect => {
        if (!rtSelect || rtSelect.options.length > 1) return;
        appData.reportTypes.filter(rt => rt.is_active).sort((a, b) => a.sort_order - b.sort_order)
            .forEach(rt => {
                const opt = document.createElement('option');
                opt.value = rt.id;
                opt.textContent = rt.name;
                rtSelect.appendChild(opt);
            });
    });

    // 填充报表版本下拉（汇总报表页）
    const reportVerSel = document.getElementById('reportVersionSelect');
    if (reportVerSel && reportVerSel.options.length === 0) {
        appData.versions.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v.id;
            opt.textContent = `${v.name} (${v.budget_year}年预算)`;
            reportVerSel.appendChild(opt);
        });
    }

    // 窗口大小变化时重绘图表
    window.addEventListener('resize', function() {
        if (reportChartPie) reportChartPie.resize();
        if (reportChartBar) reportChartBar.resize();
    });

    // 渲染首页
    navigate(appData.currentPage || 'home', appData.currentDeptId);
});
