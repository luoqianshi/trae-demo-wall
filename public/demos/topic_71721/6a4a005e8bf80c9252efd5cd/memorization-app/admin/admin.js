/**
 * 内容管理后台 - 前端逻辑
 */

const SEMESTERS = [
  { value: '', label: '全部学期' },
  { value: 'grade7_1', label: '初一 上学期' },
  { value: 'grade7_2', label: '初一 下学期' },
  { value: 'grade8_1', label: '初二 上学期' },
  { value: 'grade8_2', label: '初二 下学期' },
  { value: 'grade9_1', label: '初三 上学期' },
  { value: 'grade9_2', label: '初三 下学期' },
];

let SUBJECTS = [];

// ============ 初始化 ============
async function init() {
  // 填充学期下拉
  const fillSemesters = (sel, withAll) => {
    sel.innerHTML = '';
    const list = withAll ? SEMESTERS : SEMESTERS.filter(s => s.value);
    list.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.value;
      opt.textContent = s.label;
      sel.appendChild(opt);
    });
  };
  fillSemesters(document.getElementById('f-semester'), true);
  fillSemesters(document.getElementById('c-semester'), false);

  // 学科
  try {
    SUBJECTS = await api('/api/subjects');
    const fSubj = document.getElementById('f-subject');
    const cSubj = document.getElementById('c-subject');
    fSubj.innerHTML = '<option value="">全部学科</option>';
    SUBJECTS.forEach(s => {
      fSubj.innerHTML += `<option value="${s.code}">${s.icon} ${s.name}</option>`;
      cSubj.innerHTML += `<option value="${s.code}">${s.icon} ${s.name}</option>`;
    });
  } catch (e) {}

  document.getElementById('apiBase').textContent = 'API: ' + window.location.origin;

  loadList();
}

// ============ 通用请求 ============
async function api(url, method = 'GET', body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const data = await res.json();
  if (data.code !== 0) throw new Error(data.msg || '请求失败');
  return data.data;
}

// ============ Tab 切换 ============
function switchTab(tab) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  document.querySelector(`.menu-item[data-tab="${tab}"]`).classList.add('active');
  if (tab === 'list') loadList();
  if (tab === 'stats') loadStats();
}

// ============ 列表 ============
let allContents = [];
async function loadList() {
  const sem = document.getElementById('f-semester').value;
  const subj = document.getElementById('f-subject').value;
  const search = document.getElementById('f-search').value.trim().toLowerCase();

  let url = '/api/contents?';
  if (sem) url += `semester=${sem}&`;
  if (subj) url += `subject=${subj}&`;

  try {
    allContents = await api(url);
    let list = allContents;
    if (search) list = list.filter(c => c.title.toLowerCase().includes(search));

    const subjMap = {};
    SUBJECTS.forEach(s => subjMap[s.code] = s);

    const tbody = document.getElementById('list-body');
    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-row">暂无内容</td></tr>';
    } else {
      tbody.innerHTML = list.map(c => {
        const subj = subjMap[c.subject_code] || { name: c.subject_code, icon: '📘' };
        const semLabel = (SEMESTERS.find(s => s.value === c.semester) || {}).label || c.semester;
        return `<tr>
          <td>${c.id}</td>
          <td><span class="tag-sub">${subj.icon} ${subj.name}</span></td>
          <td>${semLabel}</td>
          <td>${c.unit || '-'}</td>
          <td>${escapeHtml(c.title)}</td>
          <td class="body-preview">${escapeHtml(c.body)}</td>
          <td>
            <button class="btn-edit" onclick="editContent(${c.id})">编辑</button>
            <button class="btn-del" onclick="delContent(${c.id}, '${escapeHtml(c.title)}')">删除</button>
          </td>
        </tr>`;
      }).join('');
    }
    document.getElementById('list-count').textContent = `共 ${list.length} 条`;
  } catch (e) {
    document.getElementById('list-body').innerHTML = `<tr><td colspan="7" class="empty-row">加载失败: ${e.message}</td></tr>`;
  }
}

function escapeHtml(s) {
  if (!s) return '';
  return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

// ============ 新增 / 编辑 ============
async function editContent(id) {
  // 需要获取详情(列表只有部分字段)
  try {
    const c = await api(`/api/contents/${id}`);
    document.getElementById('c-id').value = c.id;
    document.getElementById('c-subject').value = c.subject_code;
    document.getElementById('c-semester').value = c.semester;
    document.getElementById('c-unit').value = c.unit || '';
    document.getElementById('c-title').value = c.title;
    document.getElementById('c-body').value = c.body;
    document.getElementById('c-tip').value = c.tip || '';
    document.getElementById('form-title').textContent = '✏️ 编辑内容 #' + id;
    switchTab('add');
  } catch (e) {
    alert('加载失败: ' + e.message);
  }
}

function resetForm() {
  document.getElementById('content-form').reset();
  document.getElementById('c-id').value = '';
  document.getElementById('form-title').textContent = '➕ 新增背诵内容';
}

async function saveContent(e) {
  e.preventDefault();
  const id = document.getElementById('c-id').value;
  const payload = {
    subject_code: document.getElementById('c-subject').value,
    semester: document.getElementById('c-semester').value,
    unit: document.getElementById('c-unit').value,
    title: document.getElementById('c-title').value,
    body: document.getElementById('c-body').value,
    tip: document.getElementById('c-tip').value,
  };
  try {
    if (id) {
      await api(`/api/admin/contents/${id}`, 'PUT', payload);
      alert('更新成功');
    } else {
      await api('/api/admin/contents', 'POST', payload);
      alert('新增成功');
    }
    resetForm();
    switchTab('list');
  } catch (e) {
    alert('保存失败: ' + e.message);
  }
}

// ============ 删除 ============
async function delContent(id, title) {
  if (!confirm(`确定删除「${title}」吗?`)) return;
  try {
    await api(`/api/admin/contents/${id}`, 'DELETE');
    loadList();
  } catch (e) {
    alert('删除失败: ' + e.message);
  }
}

// ============ 批量导入 ============
async function batchImport() {
  const text = document.getElementById('batch-input').value.trim();
  if (!text) return alert('请输入 JSON 内容');
  let arr;
  try {
    arr = JSON.parse(text);
  } catch (e) {
    return alert('JSON 格式错误: ' + e.message);
  }
  if (!Array.isArray(arr)) return alert('需要 JSON 数组');
  try {
    const data = await api('/api/admin/contents/batch', 'POST', { contents: arr });
    alert(data.msg || '导入完成');
    switchTab('list');
  } catch (e) {
    alert('导入失败: ' + e.message);
  }
}

function fillExample() {
  document.getElementById('batch-input').value = JSON.stringify([
    {
      subject_code: "chinese",
      semester: "grade7_1",
      unit: "第一单元",
      title: "《次北固山下》王湾",
      body: "客路青山外,行舟绿水前。潮平两岸阔,风正一帆悬。海日生残夜,江春入旧年。乡书何处达?归雁洛阳边。",
      tip: "表现羁旅之思,名句:海日生残夜,江春入旧年。"
    },
    {
      subject_code: "english",
      semester: "grade7_1",
      unit: "Unit 3",
      title: "形容词性物主代词",
      body: "my 我的 / your 你的 / his 他的 / her 她的 / its 它的 / our 我们的 / your 你们的 / their 他(她、它)们的\n口诀:形物代词不独立,后面必须接名词。",
      tip: "形容词性物主代词后面必须接名词。"
    }
  ], null, 2);
}

// ============ 统计 ============
async function loadStats() {
  try {
    // 用列表接口拿全部内容做统计
    const all = await api('/api/contents');
    const subjMap = {};
    SUBJECTS.forEach(s => subjMap[s.code] = { name: s.name, icon: s.icon, count: 0 });
    let semCount = {};
    all.forEach(c => {
      if (subjMap[c.subject_code]) subjMap[c.subject_code].count++;
      semCount[c.semester] = (semCount[c.semester] || 0) + 1;
    });

    const cards = [
      { num: all.length, label: '内容总数' },
      { num: SUBJECTS.length, label: '学科数' },
      { num: Object.keys(semCount).length, label: '覆盖学期数' },
    ];
    document.getElementById('stats-cards').innerHTML = cards.map(c =>
      `<div class="stat-card"><div class="num">${c.num}</div><div class="label">${c.label}</div></div>`
    ).join('');

    const maxCount = Math.max(...Object.values(subjMap).map(s => s.count), 1);
    document.getElementById('stats-subjects').innerHTML = Object.values(subjMap).map(s => `
      <div class="subject-bar-row">
        <div class="name">${s.icon} ${s.name}</div>
        <div class="bar-bg">
          <div class="bar-fg" style="width: ${(s.count / maxCount * 100)}%">${s.count}</div>
        </div>
      </div>
    `).join('');
  } catch (e) {
    document.getElementById('stats-cards').textContent = '加载失败: ' + e.message;
  }
}

// 启动
init();
