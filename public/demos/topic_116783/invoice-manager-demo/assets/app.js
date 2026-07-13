/* === 智票管家 Demo - 交互逻辑 === */

// ===== Data Store =====
var invoices = [];
var archived = [];
var nextId = 1;

// ===== Demo Data =====
var DEMO_INVOICES = [
  { code: '044002100111', number: '23956001', type: '增值税电子普通发票', date: '2026-06-03', seller: '北京星辰科技有限公司', buyer: '智联信息技术有限公司', amount: 8500.00, tax: 1105.00, taxRate: 13, status: 'pending', source: 'email' },
  { code: '031001800411', number: '18723456', type: '增值税专用发票', date: '2026-06-05', seller: '上海锐恒电子科技有限公司', buyer: '智联信息技术有限公司', amount: 23400.00, tax: 3042.00, taxRate: 13, status: 'pending', source: 'email' },
  { code: '044002100111', number: '23956001', type: '增值税电子普通发票', date: '2026-06-03', seller: '北京星辰科技有限公司', buyer: '智联信息技术有限公司', amount: 8500.00, tax: 1105.00, taxRate: 13, status: 'pending', source: 'local' },
  { code: '055001700311', number: '76234891', type: '增值税电子普通发票', date: '2026-06-08', seller: '深圳市万维云计算有限公司', buyer: '智联信息技术有限公司', amount: 3600.00, tax: 216.00, taxRate: 6, status: 'pending', source: 'email' },
  { code: '110021500410', number: '00589234', type: '增值税专用发票', date: '2026-06-10', seller: '杭州数澜数据服务有限公司', buyer: '智联信息技术有限公司', amount: 15600.00, tax: 936.00, taxRate: 6, status: 'pending', source: 'local' },
  { code: '031002200111', number: '55678123', type: '增值税电子普通发票', date: '2026-06-12', seller: '天津汇达物流有限公司', buyer: '智联信息技术有限公司', amount: 4200.00, tax: 126.00, taxRate: 3, status: 'pending', source: 'email' },
  { code: '044001900311', number: '11234567', type: '增值税专用发票', date: '2026-06-15', seller: '北京星辰科技有限公司', buyer: '智联信息技术有限公司', amount: 62800.00, tax: 8164.00, taxRate: 13, status: 'pending', source: 'email' },
  { code: '033001600210', number: '99012345', type: '增值税电子普通发票', date: '2026-07-01', seller: '广州博创智能科技有限公司', buyer: '智联信息技术有限公司', amount: 1980.00, tax: 118.80, taxRate: 6, status: 'pending', source: 'email' },
  { code: '055001800311', number: '44321678', type: '增值税电子普通发票', date: '2026-07-05', seller: '深圳市万维云计算有限公司', buyer: '智联信息技术有限公司', amount: 12800.00, tax: 768.00, taxRate: 6, status: 'pending', source: 'email' },
  { code: '045001500111', number: '88765432', type: '增值税专用发票', date: '2026-05-20', seller: '成都云端软件有限公司', buyer: '智联信息技术有限公司', amount: 45000.00, tax: 2700.00, taxRate: 6, status: 'pending', source: 'local' },
  { code: '044002100111', number: '23956002', type: '增值税电子普通发票', date: '2026-06-20', seller: '北京星辰科技有限公司', buyer: '智联信息技术有限公司', amount: -500.00, tax: -65.00, taxRate: 13, status: 'pending', source: 'email' },
  { code: '031001500411', number: '18720001', type: '增值税电子普通发票', date: '2026-06-25', seller: '上海锐恒电子科技有限公司', buyer: '智联信息技术有限公司', amount: 7200.00, tax: 432.00, taxRate: 6, status: 'pending', source: 'email' },
];

var DEMO_BILLS = [
  { date: '2026-06-03', seller: '北京星辰科技有限公司', amount: 8500.00, desc: '办公设备采购' },
  { date: '2026-06-05', seller: '上海锐恒电子科技有限公司', amount: 23400.00, desc: '服务器硬件采购' },
  { date: '2026-06-08', seller: '深圳市万维云计算有限公司', amount: 3600.00, desc: '云服务费用' },
  { date: '2026-06-10', seller: '杭州数澜数据服务有限公司', amount: 15600.00, desc: '数据分析服务' },
  { date: '2026-06-12', seller: '天津汇达物流有限公司', amount: 4200.00, desc: '物流配送费用' },
  { date: '2026-06-15', seller: '北京星辰科技有限公司', amount: 62800.00, desc: '年度软件授权' },
  { date: '2026-06-20', seller: '某供应商A', amount: 3500.00, desc: '咨询服务费' },
  { date: '2026-06-25', seller: '上海锐恒电子科技有限公司', amount: 7200.00, desc: '技术支持服务' },
];

// ===== Navigation =====
function switchPage(page) {
  // Update nav
  document.querySelectorAll('.nav-item').forEach(function(item) {
    item.classList.remove('active');
    if (item.dataset.page === page) item.classList.add('active');
  });
  // Update pages
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  var el = document.getElementById('page-' + page);
  if (el) el.classList.add('active');

  // Update header
  var titles = {
    dashboard: '工作台', collect: '发票收集', invoices: '发票列表',
    dedup: '自动去重', compliance: '合规检测', reconcile: '自动对账',
    archive: '归档管理', export: '报表导出', settings: '系统设置'
  };
  document.getElementById('pageTitle').textContent = titles[page] || page;
  document.getElementById('breadcrumb').textContent = '首页 / ' + (titles[page] || page);

  // Auto-refresh data views
  if (page === 'dashboard') refreshDashboard();
  if (page === 'invoices') renderInvoiceTable();
  if (page === 'archive') renderArchive();

  // Close mobile sidebar
  document.getElementById('sidebar').classList.remove('open');
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ===== Toast =====
function showToast(type, message) {
  var container = document.getElementById('toastContainer');
  var icons = { success: '&#9989;', error: '&#10060;', warning: '&#9888;', info: '&#8505;' };
  var toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.innerHTML = '<span class="toast-icon">' + (icons[type] || '') + '</span>' +
    '<span class="toast-msg">' + message + '</span>' +
    '<button class="toast-close" onclick="this.parentElement.remove()">&times;</button>';
  container.appendChild(toast);
  setTimeout(function() { toast.remove(); }, 4000);
}

// ===== Modal =====
function showAddInvoiceModal() {
  document.getElementById('addDate').value = new Date().toISOString().split('T')[0];
  openModal('addInvoiceModal');
}
function openModal(id) { document.getElementById(id).classList.add('show'); }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }

// ===== Load Demo Data =====
function loadDemoData() {
  invoices = [];
  DEMO_INVOICES.forEach(function(d) {
    invoices.push(Object.assign({}, d, { id: nextId++ }));
  });
  showToast('success', '已加载 ' + DEMO_INVOICES.length + ' 条演示发票数据');
  refreshAll();
}

function clearAllData() {
  invoices = [];
  archived = [];
  nextId = 1;
  showToast('info', '所有数据已清空');
  refreshAll();
}

function refreshAll() {
  refreshDashboard();
  renderInvoiceTable();
  renderArchive();
  updateBadges();
}

function updateBadges() {
  document.getElementById('invoiceCount').textContent = invoices.length;
  var dupCount = invoices.filter(function(i) { return i.status === 'duplicate'; }).length;
  document.getElementById('dupCount').textContent = dupCount;
}

// ===== Dashboard =====
function refreshDashboard() {
  var total = invoices.length;
  var valid = invoices.filter(function(i) { return i.status === 'valid'; }).length;
  var invalid = invoices.filter(function(i) { return i.status === 'invalid'; }).length;
  var dup = invoices.filter(function(i) { return i.status === 'duplicate'; }).length;
  var pending = invoices.filter(function(i) { return i.status === 'pending'; }).length;
  var recon = invoices.filter(function(i) { return i.reconciled; }).length;

  document.getElementById('statTotal').textContent = total;
  document.getElementById('statValid').textContent = valid;
  document.getElementById('statInvalid').textContent = invalid;
  document.getElementById('statDup').textContent = dup;
  document.getElementById('statReconciled').textContent = recon;

  // Recent invoices
  var tbody = document.getElementById('recentInvoices');
  if (invoices.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="padding:24px; text-align:center; color:var(--muted);">暂无数据，请先加载演示数据或导入发票</td></tr>';
    return;
  }
  var recent = invoices.slice(-5).reverse();
  tbody.innerHTML = recent.map(function(inv) {
    var tag = statusTag(inv.status);
    return '<tr><td>' + inv.number + '</td><td>&yen;' + inv.amount.toFixed(2) + '</td><td>' + tag + '</td><td>' + inv.date + '</td></tr>';
  }).join('');

  // Compliance overview
  var compDiv = document.getElementById('complianceOverview');
  if (total === 0) {
    compDiv.innerHTML = '<div class="empty-state" style="padding:24px;"><div class="icon">&#128203;</div><h3>暂无检测数据</h3><p>导入发票后系统将自动进行合规检测</p></div>';
    return;
  }
  var checked = valid + invalid;
  var rate = checked > 0 ? Math.round(valid / checked * 100) : 0;
  compDiv.innerHTML =
    '<div class="progress-bar"><div class="progress-fill" style="width:' + rate + '%;"></div></div>' +
    '<div style="display:flex; justify-content:space-between; font-size:0.88rem; margin-top:8px;">' +
    '<span>已检测: <strong>' + checked + '</strong> / ' + total + '</span>' +
    '<span>合规率: <strong>' + rate + '%</strong></span></div>' +
    '<div style="display:flex; gap:16px; margin-top:12px;">' +
    '<span class="tag tag-success">&#9989; 合规 ' + valid + '</span>' +
    '<span class="tag tag-danger">&#10060; 不合规 ' + invalid + '</span>' +
    '<span class="tag tag-muted">&#128260; 待检测 ' + pending + '</span>' +
    '</div>';
}

function statusTag(status) {
  var map = {
    valid: '<span class="tag tag-success">&#9989; 合规</span>',
    invalid: '<span class="tag tag-danger">&#10060; 不合规</span>',
    duplicate: '<span class="tag tag-warning">&#128260; 重复</span>',
    pending: '<span class="tag tag-muted">&#128311; 待检测</span>'
  };
  return map[status] || '<span class="tag tag-muted">' + status + '</span>';
}

// ===== Collect =====
function simulateEmailFetch() {
  var progress = document.getElementById('importProgress');
  var emailInvoices = DEMO_INVOICES.filter(function(d) { return d.source === 'email'; });
  var html = '<h4 style="margin-bottom:12px;">正在从 finance@demo.com 拉取邮件发票...</h4>';
  emailInvoices.forEach(function(inv, i) {
    html += '<div style="display:flex; align-items:center; gap:12px; padding:8px 0; border-bottom:1px solid var(--rule);">' +
      '<span style="color:var(--success);">&#10003;</span>' +
      '<span style="flex:1;">邮件: <strong>' + inv.seller + '</strong> - 发票号码 ' + inv.number + '</span>' +
      '<span class="tag tag-success">已下载</span></div>';
  });
  html += '<div style="margin-top:12px; display:flex; gap:8px;">' +
    '<button class="btn btn-primary" onclick="importEmailInvoices()">&#128229; 导入全部 ' + emailInvoices.length + ' 张发票</button></div>';
  progress.innerHTML = html;
  showToast('info', '从邮箱拉取到 ' + emailInvoices.length + ' 封含发票的邮件');
}

function importEmailInvoices() {
  var emailInvoices = DEMO_INVOICES.filter(function(d) { return d.source === 'email'; });
  var count = 0;
  emailInvoices.forEach(function(inv) {
    var exists = invoices.some(function(i) { return i.code === inv.code && i.number === inv.number; });
    if (!exists) {
      invoices.push(Object.assign({}, inv, { id: nextId++ }));
      count++;
    }
  });
  document.getElementById('importProgress').innerHTML =
    '<div style="text-align:center; padding:16px;">' +
    '<div style="font-size:2rem; color:var(--success); margin-bottom:8px;">&#9989;</div>' +
    '<h4>导入完成！成功导入 ' + count + ' 张新发票</h4></div>';
  showToast('success', '成功导入 ' + count + ' 张新发票');
  refreshAll();
}

function simulateFileUpload(files) {
  if (!files || files.length === 0) return;
  var progress = document.getElementById('importProgress');
  var html = '<h4 style="margin-bottom:12px;">正在解析上传的 ' + files.length + ' 个文件...</h4>';
  // Simulate parsing random invoices
  var count = 0;
  for (var i = 0; i < files.length; i++) {
    var demoInv = DEMO_INVOICES[Math.floor(Math.random() * DEMO_INVOICES.length)];
    var exists = invoices.some(function(inv) { return inv.code === demoInv.code && inv.number === demoInv.number; });
    if (!exists) {
      invoices.push(Object.assign({}, demoInv, { id: nextId++, source: 'local' }));
      count++;
    }
    html += '<div style="display:flex; align-items:center; gap:12px; padding:8px 0; border-bottom:1px solid var(--rule);">' +
      '<span style="color:var(--success);">&#10003;</span>' +
      '<span style="flex:1;">文件: <strong>' + files[i].name + '</strong></span>' +
      '<span class="tag tag-success">解析成功</span></div>';
  }
  html += '<div style="margin-top:12px; text-align:center; color:var(--success); font-weight:600;">' +
    '&#9989; 完成！成功导入 ' + count + ' 张发票</div>';
  progress.innerHTML = html;
  showToast('success', '文件上传并解析完成，导入 ' + count + ' 张发票');
  refreshAll();
}

// ===== Drop Zone =====
(function() {
  var dz = document.getElementById('dropZone');
  if (dz) {
    dz.addEventListener('dragover', function(e) { e.preventDefault(); dz.classList.add('dragover'); });
    dz.addEventListener('dragleave', function() { dz.classList.remove('dragover'); });
    dz.addEventListener('drop', function(e) {
      e.preventDefault();
      dz.classList.remove('dragover');
      simulateFileUpload(e.dataTransfer.files);
    });
  }
})();

// ===== Add Invoice =====
function addInvoice() {
  var code = document.getElementById('addCode').value.trim();
  var number = document.getElementById('addNumber').value.trim();
  var date = document.getElementById('addDate').value;
  var seller = document.getElementById('addSeller').value.trim();
  var amount = parseFloat(document.getElementById('addAmount').value) || 0;
  var tax = parseFloat(document.getElementById('addTax').value) || 0;
  var taxRate = parseInt(document.getElementById('addTaxRate').value);
  var type = document.getElementById('addType').value;

  if (!code || !number || !date || !seller) {
    showToast('warning', '请填写完整的发票信息（代码、号码、日期、供应商）');
    return;
  }

  var inv = {
    id: nextId++,
    code: code, number: number, type: type, date: date,
    seller: seller, buyer: '智联信息技术有限公司',
    amount: amount, tax: tax, taxRate: taxRate,
    status: 'pending', source: 'manual'
  };
  invoices.push(inv);
  closeModal('addInvoiceModal');
  showToast('success', '发票 ' + number + ' 添加成功');
  // Clear form
  ['addCode', 'addNumber', 'addDate', 'addSeller', 'addAmount', 'addTax'].forEach(function(id) {
    document.getElementById(id).value = '';
  });
  refreshAll();
}

// ===== Invoice Table =====
function renderInvoiceTable() {
  var tbody = document.getElementById('invoiceTableBody');
  var filtered = getFilteredInvoices();
  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="padding:24px; text-align:center; color:var(--muted);">暂无发票数据</td></tr>';
    return;
  }
  tbody.innerHTML = filtered.map(function(inv) {
    return '<tr data-id="' + inv.id + '">' +
      '<td><label class="checkbox-wrap"><input type="checkbox" class="row-check" value="' + inv.id + '"></label></td>' +
      '<td><a href="#" style="color:var(--accent); text-decoration:none;" onclick="showDetail(' + inv.id + '); return false;">' + inv.number + '</a></td>' +
      '<td>' + inv.type + '</td>' +
      '<td>' + inv.date + '</td>' +
      '<td>' + inv.seller + '</td>' +
      '<td style="text-align:right;">&yen;' + inv.amount.toFixed(2) + '</td>' +
      '<td style="text-align:right;">&yen;' + inv.tax.toFixed(2) + '</td>' +
      '<td>' + statusTag(inv.status) + '</td>' +
      '<td><div class="action-btns">' +
      '<button class="action-btn" title="查看详情" onclick="showDetail(' + inv.id + ')">&#128065;</button>' +
      '<button class="action-btn delete" title="删除" onclick="deleteInvoice(' + inv.id + ')">&#128465;</button>' +
      '</div></td></tr>';
  }).join('');
}

function getFilteredInvoices() {
  var search = document.getElementById('invoiceSearch').value.toLowerCase();
  var statusFilter = document.getElementById('filterStatus').value;
  var typeFilter = document.getElementById('filterType').value;
  return invoices.filter(function(inv) {
    if (search && inv.number.toLowerCase().indexOf(search) === -1 &&
        inv.seller.toLowerCase().indexOf(search) === -1 &&
        inv.code.toLowerCase().indexOf(search) === -1) return false;
    if (statusFilter && inv.status !== statusFilter) return false;
    if (typeFilter && inv.type !== typeFilter) return false;
    return true;
  });
}

function filterInvoices() { renderInvoiceTable(); }

function toggleSelectAll() {
  var checked = document.getElementById('selectAll').checked;
  document.querySelectorAll('.row-check').forEach(function(cb) { cb.checked = checked; });
  // Toggle row highlight
  document.querySelectorAll('#invoiceTableBody tr').forEach(function(tr) {
    var cb = tr.querySelector('.row-check');
    if (cb) tr.classList.toggle('selected', cb.checked);
  });
}

function deleteSelected() {
  var checks = document.querySelectorAll('.row-check:checked');
  if (checks.length === 0) { showToast('warning', '请先选择要删除的发票'); return; }
  var ids = [];
  checks.forEach(function(cb) { ids.push(parseInt(cb.value)); });
  invoices = invoices.filter(function(i) { return ids.indexOf(i.id) === -1; });
  showToast('success', '已删除 ' + ids.length + ' 张发票');
  document.getElementById('selectAll').checked = false;
  refreshAll();
}

function deleteInvoice(id) {
  invoices = invoices.filter(function(i) { return i.id !== id; });
  showToast('success', '发票已删除');
  refreshAll();
}

// ===== Invoice Detail =====
function showDetail(id) {
  var inv = invoices.find(function(i) { return i.id === id; });
  if (!inv) return;
  var html =
    '<div class="detail-grid">' +
    '<div class="detail-item"><div class="label">发票类型</div><div class="value">' + inv.type + '</div></div>' +
    '<div class="detail-item"><div class="label">发票代码</div><div class="value">' + inv.code + '</div></div>' +
    '<div class="detail-item"><div class="label">发票号码</div><div class="value">' + inv.number + '</div></div>' +
    '<div class="detail-item"><div class="label">开票日期</div><div class="value">' + inv.date + '</div></div>' +
    '<div class="detail-item"><div class="label">销售方</div><div class="value">' + inv.seller + '</div></div>' +
    '<div class="detail-item"><div class="label">购买方</div><div class="value">' + (inv.buyer || '智联信息技术有限公司') + '</div></div>' +
    '<div class="detail-item"><div class="label">金额</div><div class="value">&yen;' + inv.amount.toFixed(2) + '</div></div>' +
    '<div class="detail-item"><div class="label">税额</div><div class="value">&yen;' + inv.tax.toFixed(2) + '</div></div>' +
    '<div class="detail-item"><div class="label">税率</div><div class="value">' + inv.taxRate + '%</div></div>' +
    '<div class="detail-item"><div class="label">状态</div><div class="value">' + statusTag(inv.status) + '</div></div>' +
    '<div class="detail-item"><div class="label">来源</div><div class="value">' + (inv.source === 'email' ? '邮件拉取' : inv.source === 'local' ? '本地导入' : '手动添加') + '</div></div>' +
    '</div>';
  document.getElementById('detailContent').innerHTML = html;
  openModal('detailModal');
}

// ===== Dedup =====
function runDedupCheck() {
  if (invoices.length === 0) { showToast('warning', '暂无发票数据，请先导入发票'); return; }

  var scanned = invoices.length;
  var dupMap = {};
  var uniqueCount = 0;
  var dupCount = 0;

  invoices.forEach(function(inv) {
    var key = inv.code + '_' + inv.number;
    if (dupMap[key]) {
      inv.status = 'duplicate';
      dupCount++;
    } else {
      dupMap[key] = true;
      uniqueCount++;
      if (inv.status === 'duplicate') inv.status = 'pending';
    }
  });

  document.getElementById('dedupScanned').textContent = scanned;
  document.getElementById('dedupFound').textContent = dupCount;
  document.getElementById('dedupUnique').textContent = uniqueCount;

  var resultHtml = '<h4 style="margin-bottom:12px;">&#128269; 去重检测结果</h4>';

  if (dupCount === 0) {
    resultHtml += '<div style="text-align:center; padding:16px; color:var(--success);">' +
      '<div style="font-size:2rem;">&#9989;</div><h4>恭喜！未发现重复发票</h4>' +
      '<p>所有 ' + scanned + ' 张发票均唯一</p></div>';
  } else {
    resultHtml += '<div style="margin-bottom:12px; color:var(--danger);">&#9888; 发现 ' + dupCount + ' 张重复发票：</div>';
    invoices.filter(function(i) { return i.status === 'duplicate'; }).forEach(function(inv) {
      resultHtml += '<div class="match-result unmatched">' +
        '<span class="match-icon">&#128260;</span>' +
        '<div style="flex:1;"><strong>' + inv.number + '</strong> (' + inv.code + ') - ' + inv.seller +
        '<br><span style="font-size:0.82rem; color:var(--muted);">金额: &yen;' + inv.amount.toFixed(2) + ' | 日期: ' + inv.date + '</span></div>' +
        '<span class="tag tag-warning">重复</span></div>';
    });
  }

  resultHtml += '<div style="margin-top:16px; padding:12px; background:var(--bg2); border-radius:8px; font-size:0.85rem; color:var(--muted);">' +
    '&#128712; 去重策略: 基于发票代码 + 发票号码进行唯一性校验。相同代码和号码的发票将被标记为重复。</div>';

  document.getElementById('dedupResult').innerHTML = resultHtml;
  showToast(dupCount > 0 ? 'warning' : 'success', dupCount > 0 ? '发现 ' + dupCount + ' 张重复发票' : '未发现重复发票');
  refreshAll();
}

// ===== Compliance =====
function runComplianceCheck() {
  if (invoices.length === 0) { showToast('warning', '暂无发票数据，请先导入发票'); return; }

  var validTaxes = [13, 9, 6, 3, 1, 0];
  var today = new Date().toISOString().split('T')[0];
  var passCount = 0;
  var failCount = 0;
  var issues = [];

  invoices.forEach(function(inv) {
    if (inv.status === 'duplicate') return; // Skip dups
    var invIssues = [];

    // Check code format
    if (!/^\d{10,12}$/.test(inv.code)) {
      invIssues.push('发票代码格式错误（需10-12位数字）');
    }
    // Check number format
    if (!/^\d{8}$/.test(inv.number)) {
      invIssues.push('发票号码格式错误（需8位数字）');
    }
    // Check date
    if (inv.date > today) {
      invIssues.push('开票日期晚于当前日期');
    }
    // Check amount
    if (inv.amount < 0) {
      invIssues.push('金额为负数（可能是红冲发票，请确认）');
    }
    // Check tax rate
    if (validTaxes.indexOf(inv.taxRate) === -1) {
      invIssues.push('税率 ' + inv.taxRate + '% 不是法定税率');
    }
    // Check amount vs tax consistency
    if (inv.amount > 0 && inv.taxRate > 0) {
      var expectedTax = Math.round(inv.amount * inv.taxRate / 100 * 100) / 100;
      if (Math.abs(inv.tax - expectedTax) > 0.05) {
        invIssues.push('税额与金额/税率不一致（应为 ¥' + expectedTax.toFixed(2) + '）');
      }
    }

    if (invIssues.length > 0) {
      inv.status = 'invalid';
      inv.issues = invIssues;
      failCount++;
      issues.push({ inv: inv, issues: invIssues });
    } else {
      inv.status = 'valid';
      inv.issues = [];
      passCount++;
    }
  });

  var checked = passCount + failCount;
  var rate = checked > 0 ? Math.round(passCount / checked * 100) : 0;
  document.getElementById('compPass').textContent = passCount;
  document.getElementById('compFail').textContent = failCount;
  document.getElementById('compRate').textContent = rate + '%';

  var html = '<h4 style="margin-bottom:16px;">&#9989; 合规检测报告</h4>';
  html += '<div class="progress-bar" style="height:12px;"><div class="progress-fill" style="width:' + rate + '%;"></div></div>';
  html += '<div style="text-align:center; font-size:1.4rem; font-weight:700; margin:8px 0;">合规率 ' + rate + '%</div>';

  if (issues.length === 0) {
    html += '<div style="text-align:center; padding:16px; color:var(--success);">' +
      '<div style="font-size:2rem;">&#9989;</div><h4>所有发票均通过合规检测</h4></div>';
  } else {
    html += '<h4 style="margin-top:16px; margin-bottom:12px; color:var(--danger);">&#10060; 问题发票详情</h4>';
    issues.forEach(function(item) {
      html += '<div style="margin-bottom:12px; padding:12px; border:1px solid var(--rule); border-radius:8px; border-left:4px solid var(--danger);">' +
        '<div style="font-weight:600; margin-bottom:6px;">发票号码: ' + item.inv.number + ' (' + item.inv.seller + ')</div>';
      item.issues.forEach(function(issue) {
        html += '<div style="display:flex; align-items:center; gap:6px; padding:4px 0; font-size:0.88rem;">' +
          '<span style="color:var(--danger);">&#10060;</span>' + issue + '</div>';
      });
      html += '</div>';
    });
  }

  document.getElementById('complianceResult').innerHTML = html;
  showToast(failCount > 0 ? 'warning' : 'success', '合规检测完成：' + passCount + ' 通过，' + failCount + ' 存在问题');
  refreshAll();
}

// ===== Reconciliation =====
function runReconciliation() {
  if (invoices.length === 0) { showToast('warning', '暂无发票数据，请先导入发票'); return; }

  var startDate = document.getElementById('reconStart').value;
  var endDate = document.getElementById('reconEnd').value;

  // Filter invoices in date range
  var inRange = invoices.filter(function(i) {
    return i.status !== 'duplicate' && i.date >= startDate && i.date <= endDate;
  });

  // Filter bills in date range
  var billsInRange = DEMO_BILLS.filter(function(b) { return b.date >= startDate && b.date <= endDate; });

  var matched = [];
  var unmatchedInvoices = [];
  var unmatchedBills = [];

  // Simple matching by amount + seller + date
  var matchedBillIndices = {};
  inRange.forEach(function(inv) {
    var found = false;
    billsInRange.forEach(function(bill, bi) {
      if (!matchedBillIndices[bi] && Math.abs(inv.amount - bill.amount) < 0.01 && inv.seller === bill.seller && inv.date === bill.date) {
        matched.push({ invoice: inv, bill: bill });
        matchedBillIndices[bi] = true;
        found = true;
      }
    });
    if (!found) unmatchedInvoices.push(inv);
  });
  billsInRange.forEach(function(bill, bi) {
    if (!matchedBillIndices[bi]) unmatchedBills.push(bill);
  });

  // Mark matched invoices
  matched.forEach(function(m) { m.invoice.reconciled = true; });

  var html = '<div class="stats-grid" style="margin-bottom:16px;">' +
    '<div class="stat-card"><div class="stat-icon green">&#9989;</div><div class="stat-info"><h4>匹配成功</h4><div class="number">' + matched.length + '</div></div></div>' +
    '<div class="stat-card"><div class="stat-icon amber">&#128200;</div><div class="stat-info"><h4>发票未匹配</h4><div class="number">' + unmatchedInvoices.length + '</div></div></div>' +
    '<div class="stat-card"><div class="stat-icon red">&#128203;</div><div class="stat-info"><h4>账单未匹配</h4><div class="number">' + unmatchedBills.length + '</div></div></div></div>';

  // Matched list
  if (matched.length > 0) {
    html += '<h4 style="margin-bottom:8px; color:var(--success);">&#9989; 匹配成功的记录</h4>';
    matched.forEach(function(m) {
      html += '<div class="match-result matched">' +
        '<span class="match-icon">&#9989;</span>' +
        '<div style="flex:1;"><strong>' + m.invoice.number + '</strong> &harr; <strong>' + m.bill.desc + '</strong>' +
        '<br><span style="font-size:0.82rem; color:var(--muted);">' + m.invoice.seller + ' | ¥' + m.invoice.amount.toFixed(2) + ' | ' + m.invoice.date + '</span></div>' +
        '<span class="tag tag-success">已匹配</span></div>';
    });
  }

  // Unmatched invoices
  if (unmatchedInvoices.length > 0) {
    html += '<h4 style="margin:16px 0 8px; color:var(--accent2);">&#128200; 未匹配的发票</h4>';
    unmatchedInvoices.forEach(function(inv) {
      html += '<div class="match-result unmatched">' +
        '<span class="match-icon">&#128200;</span>' +
        '<div style="flex:1;"><strong>' + inv.number + '</strong> - ' + inv.seller +
        '<br><span style="font-size:0.82rem; color:var(--muted);">¥' + inv.amount.toFixed(2) + ' | ' + inv.date + '</span></div>' +
        '<span class="tag tag-warning">未匹配</span></div>';
    });
  }

  // Unmatched bills
  if (unmatchedBills.length > 0) {
    html += '<h4 style="margin:16px 0 8px; color:var(--danger);">&#128203; 未匹配的账单</h4>';
    unmatchedBills.forEach(function(bill) {
      html += '<div class="match-result unmatched">' +
        '<span class="match-icon">&#128203;</span>' +
        '<div style="flex:1;"><strong>' + bill.desc + '</strong> - ' + bill.seller +
        '<br><span style="font-size:0.82rem; color:var(--muted);">¥' + bill.amount.toFixed(2) + ' | ' + bill.date + '</span></div>' +
        '<span class="tag tag-danger">缺失发票</span></div>';
    });
  }

  html += '<div style="margin-top:16px; padding:12px; background:var(--bg2); border-radius:8px; font-size:0.85rem; color:var(--muted);">' +
    '&#128712; 对账日期范围: ' + startDate + ' 至 ' + endDate + ' | 匹配维度: ' + document.getElementById('reconDimension').value + '</div>';

  document.getElementById('reconcileResult').innerHTML = html;
  showToast('success', '对账完成：' + matched.length + ' 匹配，' + unmatchedInvoices.length + ' 张发票未匹配，' + unmatchedBills.length + ' 条账单缺失');
  refreshAll();
}

// ===== Archive =====
function renderArchive() {
  archived = invoices.filter(function(i) { return i.status === 'valid' || i.status === 'invalid'; });
  var filter = document.getElementById('archiveFilter').value;
  var filtered = archived;
  if (filter) {
    filtered = archived.filter(function(i) {
      var month = i.date.substring(0, 7).replace('-', '年') + '月';
      return month === filter;
    });
  }
  var tbody = document.getElementById('archiveTableBody');
  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="padding:24px; text-align:center; color:var(--muted);">暂无归档数据</td></tr>';
    return;
  }
  tbody.innerHTML = filtered.map(function(inv) {
    var month = inv.date.substring(0, 7).replace('-', '年') + '月';
    return '<tr>' +
      '<td>' + inv.number + '</td>' +
      '<td>' + inv.seller + '</td>' +
      '<td>&yen;' + inv.amount.toFixed(2) + '</td>' +
      '<td>' + inv.date + '</td>' +
      '<td><span class="tag tag-info">' + month + '</span></td>' +
      '<td>2026-06-22 10:30</td>' +
      '<td><button class="action-btn" title="查看详情" onclick="showDetail(' + inv.id + ')">&#128065;</button></td></tr>';
  }).join('');
}

// ===== Export =====
function exportReport(type) {
  if (invoices.length === 0) {
    showToast('warning', '暂无数据可导出');
    return;
  }
  var names = { reconciliation: '对账报表', archive: '归档数据', statistics: '统计报表' };

  // Generate CSV content
  var csv = '\uFEFF'; // BOM for Chinese in Excel
  csv += '发票号码,发票类型,发票代码,开票日期,供应商,金额,税额,税率,状态\n';
  invoices.forEach(function(inv) {
    csv += inv.number + ',' + inv.type + ',' + inv.code + ',' + inv.date + ',' +
      inv.seller + ',' + inv.amount.toFixed(2) + ',' + inv.tax.toFixed(2) + ',' +
      inv.taxRate + '%,' + inv.status + '\n';
  });

  // Create download
  var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  var link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = '智票管家_' + names[type] + '_' + new Date().toISOString().split('T')[0] + '.csv';
  link.click();
  URL.revokeObjectURL(link.href);
  showToast('success', names[type] + ' 已导出（CSV 格式）');
}

// ===== Init =====
document.addEventListener('DOMContentLoaded', function() {
  refreshAll();
});
