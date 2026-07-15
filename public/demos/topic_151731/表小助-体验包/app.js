/* ===========================================================
 * 学生信息智能填表助手 - 核心逻辑
 * 纯前端实现，所有数据在浏览器本地处理
 * =========================================================== */

// ---------- 全局状态 ----------
const state = {
  masterWorkbook: null,      // 总表 Workbook 对象
  masterSheetName: null,     // 当前选中的总表 sheet
  masterHeaders: [],         // 总表字段名数组
  masterRows: [],            // 总表数据行（对象数组，以字段名为 key）
  masterFileName: '',

  templateWorkbook: null,    // 小表 Workbook 对象
  templateSheetName: null,   // 当前选中的小表 sheet
  templateHeaderRow: 1,      // 小表表头所在行（1-based）
  templateHeaders: [],       // 小表列名数组
  templateFileName: '',

  mapping: [],               // [{ templateCol, masterField }]，masterField 可为 null
  filters: [],               // [{ field, operator, value }]
  currentStep: 1
};

// ---------- 同义词字典（用于 AI 智能字段映射）----------
const SYNONYM_DICT = {
  '姓名': ['姓名', '学生姓名', '学生', '名字', 'name', 'sname', '学生名', '学员姓名'],
  '身份证号': ['身份证号', '身份证号码', '身份证', '身份证件号码', '公民身份号码', 'idcard', 'id number', '身份证号 '],
  '家庭地址': ['家庭地址', '家庭住址', '住址', '地址', '现住址', '现住地址', '居住地址', '家庭详细地址', 'address', 'addr'],
  '学籍号': ['学籍号', '学生学籍号', '全国学籍号', '学籍号码', '学号', 'student id', '学籍'],
  '性别': ['性别', 'sex', 'gender', '男/女'],
  '民族': ['民族', '族别', 'nation', 'race'],
  '出生日期': ['出生日期', '出生年月', '生日', '出生', '出生日期 ', 'birthday', 'birth', 'date of birth', '出生年月日'],
  '年龄': ['年龄', 'age', '周岁'],
  '年级': ['年级', '年级名称', 'grade'],
  '班级': ['班级', '班级名称', '班', 'class'],
  '年级班级': ['年级班级', '年级和班级', '班级信息'],
  '学校': ['学校', '学校名称', '所在学校', '就读学校', 'school'],
  '监护人姓名': ['监护人姓名', '监护人', '家长姓名', '父亲姓名', '母亲姓名', 'parent', 'guardian', '家长'],
  '监护人电话': ['监护人电话', '家长电话', '联系电话', '电话号码', '手机号', '手机', 'phone', 'tel', 'contact', '监护人手机', '家长手机号'],
  '监护人身份证': ['监护人身份证', '监护人身份证号', '家长身份证'],
  '与学生关系': ['与学生关系', '与本人关系', '关系', 'relationship'],
  '学号': ['学号', '编号', '学生编号', 'student no'],
  '政治面貌': ['政治面貌', '政治面目', '政治身份'],
  '健康状况': ['健康状况', '健康情况', '健康'],
  '是否留守儿童': ['是否留守儿童', '留守儿童', '留守'],
  '是否享受营养午餐': ['是否享受营养午餐', '享受营养午餐', '营养午餐', '午餐补贴'],
  '是否建档立卡': ['是否建档立卡', '建档立卡', '是否贫困', '贫困'],
  '户口所在地': ['户口所在地', '户口', '户籍', '户籍地址', '户籍所在地'],
  '入学时间': ['入学时间', '入学日期', '入学年月', '入学'],
  '备注': ['备注', '说明', 'note', 'remark', 'remarks']
};

// 根据字段名归并到一个规范化 key
function normalizeField(field) {
  if (!field) return '';
  let s = String(field).trim();
  // 去掉括号里的标注文字（如"姓名（必填）"→"姓名"、"身份证号[选填]"→"身份证号"）
  s = s.replace(/[（(\[【][^）)\]】]*[）)\]】]/g, '');
  s = s.toLowerCase().replace(/[\s\-_\/]/g, '');
  // 去除"是否""是否是"前缀
  return s.replace(/^是否/, '').replace(/^是/, '') || s;
}

function buildFieldKey(field) {
  return normalizeField(field);
}

// 计算两个字符串的 Levenshtein 相似度（0~1，1 最相似）
function levenshteinSimilarity(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const len = Math.max(a.length, b.length);
  if (len === 0) return 1;
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return 1 - dp[a.length][b.length] / len;
}

/**
 * 给一个小表列名找最匹配的总表字段
 * 返回 { field: 总表字段名或 null, score, isAuto }
 */
function autoMatchField(templateCol, masterFields) {
  const q = buildFieldKey(templateCol);
  if (!q) return { field: null, score: 0, isAuto: false };

  // 1) 查找同义词词典
  let bestDictField = null;
  let bestDictGroup = null;
  for (const groupName in SYNONYM_DICT) {
    const words = SYNONYM_DICT[groupName];
    for (const w of words) {
      if (buildFieldKey(w) === q) {
        bestDictGroup = groupName;
        break;
      }
    }
    if (bestDictGroup) break;
  }
  if (bestDictGroup) {
    // 在 masterFields 中找到属于同一同义词组的字段
    for (const mf of masterFields) {
      const mk = buildFieldKey(mf);
      for (const w of SYNONYM_DICT[bestDictGroup]) {
        if (buildFieldKey(w) === mk) {
          bestDictField = mf;
          break;
        }
      }
      if (bestDictField) break;
    }
    if (bestDictField) return { field: bestDictField, score: 0.95, isAuto: true };
  }

  // 2) 子串包含关系（双方互相包含）
  for (const mf of masterFields) {
    const mk = buildFieldKey(mf);
    if (mk && (mk.includes(q) || q.includes(mk)) && Math.abs(mk.length - q.length) < Math.max(mk.length, q.length) * 0.5) {
      return { field: mf, score: 0.85, isAuto: true };
    }
  }

  // 3) Levenshtein 模糊匹配，取最高
  let bestField = null;
  let bestScore = 0;
  for (const mf of masterFields) {
    const mk = buildFieldKey(mf);
    if (!mk) continue;
    const sim = levenshteinSimilarity(q, mk);
    if (sim > bestScore) {
      bestScore = sim;
      bestField = mf;
    }
  }
  if (bestScore >= 0.6) {
    return { field: bestField, score: bestScore, isAuto: true };
  }
  return { field: null, score: bestScore, isAuto: false };
}

// ---------- Excel 解析 ----------
function readExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        resolve(workbook);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

// 从 sheet 中按指定表头行解析出 headers 与 rows（对象数组）
function parseSheet(workbook, sheetName, headerRow = 1) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return { headers: [], rows: [] };
  const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
  if (!aoa.length) return { headers: [], rows: [] };

  const headerIdx = Math.max(0, headerRow - 1);
  if (headerIdx >= aoa.length) return { headers: [], rows: [] };
  const headerRowData = aoa[headerIdx] || [];

  const rawHeaders = headerRowData.map((h, i) => {
    const name = (h === null || h === undefined) ? '' : String(h).trim();
    return name || `列${i + 1}`;
  });

  const headers = rawHeaders.map(h => h);

  const rows = [];
  for (let i = headerIdx + 1; i < aoa.length; i++) {
    const row = aoa[i];
    if (!row || row.every(c => c === '' || c === null || c === undefined)) continue;
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j] !== undefined ? row[j] : '';
    }
    rows.push(obj);
  }
  return { headers, rows };
}

// 获取 sheet 中 headerRow 之前的行（用于在导出时还原小表顶部的标题行）
function getPrefixRows(workbook, sheetName, headerRow) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
  const idx = headerRow - 1;
  return aoa.slice(0, idx);
}

// ---------- UI 辅助 ----------
function $(id) { return document.getElementById(id); }

function showStep(n) {
  state.currentStep = n;
  for (let i = 1; i <= 5; i++) {
    $('panel-' + i).style.display = i === n ? 'block' : 'none';
    const stepEl = document.querySelector('.step[data-step="' + i + '"]');
    if (stepEl) {
      stepEl.classList.remove('active', 'done');
      if (i === n) stepEl.classList.add('active');
      else if (i < n) stepEl.classList.add('done');
    }
    // 更新连接线状态（第 i 步和第 i+1 步之间的线，共 4 条）
    if (i < 5) {
      const steps = document.querySelectorAll('.step');
      const line = steps[i - 1] ? steps[i - 1].nextElementSibling : null;
      if (line && line.classList.contains('step-line')) {
        line.classList.toggle('done', i < n);
      }
    }
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderTable(containerEl, headers, rows, maxRows = 5) {
  containerEl.innerHTML = '';
  if (!headers.length) return;

  const thead = document.createElement('thead');
  const trh = document.createElement('tr');
  headers.forEach(h => {
    const th = document.createElement('th');
    th.textContent = h;
    trh.appendChild(th);
  });
  thead.appendChild(trh);
  containerEl.appendChild(thead);

  const tbody = document.createElement('tbody');
  const displayRows = rows.slice(0, maxRows);
  displayRows.forEach(r => {
    const tr = document.createElement('tr');
    headers.forEach(h => {
      const td = document.createElement('td');
      const v = r[h];
      td.textContent = (v === undefined || v === null) ? '' : String(v);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  containerEl.appendChild(tbody);
}

// ---------- 文件上传处理 ----------
function bindUpload(areaId, inputId, onFile) {
  const area = $(areaId);
  const input = $(inputId);
  area.addEventListener('click', () => input.click());
  area.addEventListener('dragover', (e) => {
    e.preventDefault();
    area.classList.add('dragover');
  });
  area.addEventListener('dragleave', () => area.classList.remove('dragover'));
  area.addEventListener('drop', (e) => {
    e.preventDefault();
    area.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) onFile(e.dataTransfer.files[0]);
  });
  input.addEventListener('change', (e) => {
    if (e.target.files.length > 0) onFile(e.target.files[0]);
  });
}

// ---------- 总表 ----------
async function handleMasterFile(file) {
  try {
    const wb = await readExcelFile(file);
    state.masterWorkbook = wb;
    state.masterFileName = file.name;

    const sel = $('master-sheet');
    sel.innerHTML = '';
    wb.SheetNames.forEach(name => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      sel.appendChild(opt);
    });

    state.masterSheetName = wb.SheetNames[0];
    sel.value = state.masterSheetName;

    $('master-config').style.display = 'flex';
    $('master-info').style.display = 'flex';
    $('master-filename').textContent = file.name;
    $('master-meta').textContent = `共 ${wb.SheetNames.length} 个工作表`;

    refreshMasterPreview();
  } catch (err) {
    alert('读取总表失败：' + err.message);
  }
}

function refreshMasterPreview() {
  const { headers, rows } = parseSheet(state.masterWorkbook, state.masterSheetName, 1);
  state.masterHeaders = headers;
  state.masterRows = rows;

  if (headers.length === 0) {
    alert('当前工作表为空或无法解析，请选择其它工作表');
    return;
  }

  renderTable($('master-table'), headers, rows, 5);
  $('master-preview').style.display = 'block';
  $('master-badge').textContent = `${headers.length} 个字段 · ${rows.length} 名学生`;
  $('master-meta').textContent = `共 ${state.masterWorkbook.SheetNames.length} 个工作表 · ${headers.length} 个字段 · ${rows.length} 条数据`;
  $('to-step-2').disabled = false;
}

// ---------- 小表模板 ----------
async function handleTemplateFile(file) {
  try {
    const wb = await readExcelFile(file);
    state.templateWorkbook = wb;
    state.templateFileName = file.name;

    const sel = $('template-sheet');
    sel.innerHTML = '';
    wb.SheetNames.forEach(name => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      sel.appendChild(opt);
    });

    state.templateSheetName = wb.SheetNames[0];
    sel.value = state.templateSheetName;
    state.templateHeaderRow = 1;
    $('template-header-row').value = 1;

    $('template-config').style.display = 'flex';
    $('template-info').style.display = 'flex';
    $('template-filename').textContent = file.name;
    $('template-meta').textContent = '正在识别列名...';

    refreshTemplatePreview();
  } catch (err) {
    alert('读取小表失败：' + err.message);
  }
}

function refreshTemplatePreview() {
  const rowNum = parseInt($('template-header-row').value, 10) || 1;
  state.templateHeaderRow = rowNum;
  const { headers, rows } = parseSheet(
    state.templateWorkbook,
    state.templateSheetName,
    rowNum
  );
  state.templateHeaders = headers;

  if (headers.length === 0) {
    alert('小表无列可解析，请检查表头行设置');
    $('to-step-3').disabled = true;
    return;
  }

  renderTable($('template-table'), headers, rows, 3);
  $('template-preview').style.display = 'block';
  $('template-badge').textContent = `识别出 ${headers.length} 列`;
  $('template-meta').textContent = `识别出 ${headers.length} 列字段`;
  $('to-step-3').disabled = false;
}

// ---------- 字段映射 ----------
function buildMapping(autoMatch = true) {
  const used = new Set();
  state.mapping = state.templateHeaders.map(col => {
    if (!autoMatch) return { templateCol: col, masterField: null };
    const candidates = state.masterHeaders.filter(f => !used.has(f));
    const res = autoMatchField(col, candidates);
    if (res.field) {
      used.add(res.field);
      return { templateCol: col, masterField: res.field };
    }
    return { templateCol: col, masterField: null };
  });
}

function renderMapping() {
  const tbody = $('mapping-body');
  tbody.innerHTML = '';

  const usedCount = { matched: 0, total: state.templateHeaders.length };
  state.templateHeaders.forEach((col, i) => {
    const tr = document.createElement('tr');

    const tdCol = document.createElement('td');
    tdCol.textContent = col;
    tr.appendChild(tdCol);

    const tdArrow = document.createElement('td');
    tdArrow.style.textAlign = 'center';
    const arrowSpan = document.createElement('span');
    arrowSpan.textContent = '→';
    arrowSpan.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:#eef2ff;color:#6366f1;font-size:14px;font-weight:700;';
    tdArrow.appendChild(arrowSpan);
    tr.appendChild(tdArrow);

    const tdSelect = document.createElement('td');
    const select = document.createElement('select');
    select.dataset.idx = i;

    const optEmpty = document.createElement('option');
    optEmpty.value = '';
    optEmpty.textContent = '— 不填充 —';
    select.appendChild(optEmpty);

    const currentMap = state.mapping[i];
    state.masterHeaders.forEach(f => {
      const opt = document.createElement('option');
      opt.value = f;
      opt.textContent = f;
      if (currentMap && currentMap.masterField === f) {
        opt.selected = true;
        select.classList.add('auto-mapped');
        usedCount.matched++;
      }
      select.appendChild(opt);
    });

    select.addEventListener('change', (e) => {
      state.mapping[i].masterField = e.target.value || null;
      select.classList.remove('auto-mapped');
      updateMappingStat();
    });

    tdSelect.appendChild(select);
    tr.appendChild(tdSelect);

    const tdSample = document.createElement('td');
    if (state.mapping[i] && state.mapping[i].masterField && state.masterRows.length > 0) {
      const v = state.masterRows[0][state.mapping[i].masterField];
      tdSample.textContent = v !== undefined && v !== null ? String(v) : '';
    } else {
      tdSample.textContent = '—';
      tdSample.style.color = '#bdc3c7';
    }
    tr.appendChild(tdSample);

    tbody.appendChild(tr);
  });

  // 当用户选择某个字段时，更新其他行的"示例值"（切换项而非修改，这里简单处理：不联动）
  tbody.querySelectorAll('select').forEach(sel => {
    sel.addEventListener('change', () => {
      const idx = parseInt(sel.dataset.idx, 10);
      const field = state.mapping[idx].masterField;
      const sampleCell = sel.closest('tr').children[3];
      if (field && state.masterRows.length > 0) {
        const v = state.masterRows[0][field];
        sampleCell.textContent = v !== undefined && v !== null ? String(v) : '';
        sampleCell.style.color = '';
      } else {
        sampleCell.textContent = '—';
        sampleCell.style.color = '#bdc3c7';
      }
    });
  });

  updateMappingStat();
}

function updateMappingStat() {
  const matched = state.mapping.filter(m => m.masterField).length;
  const pct = state.mapping.length ? Math.round(matched / state.mapping.length * 100) : 0;
  $('mapping-stat').innerHTML = `已自动匹配 <strong>${matched}</strong> / ${state.mapping.length} 个字段（${pct}%）`;
}

// ---------- 筛选 ----------
function renderFilters() {
  const wrap = $('filters-wrap');
  wrap.innerHTML = '';
  state.filters.forEach((f, idx) => addFilterRow(f, idx));
  updateFilterSummary();
}

function addFilterRow(filter, idx) {
  const wrap = $('filters-wrap');
  const row = document.createElement('div');
  row.className = 'filter-row';

  const fieldSel = document.createElement('select');
  fieldSel.className = 'field-select';
  const optEmpty = document.createElement('option');
  optEmpty.value = '';
  optEmpty.textContent = '-- 选择字段 --';
  fieldSel.appendChild(optEmpty);
  state.masterHeaders.forEach(h => {
    const opt = document.createElement('option');
    opt.value = h;
    opt.textContent = h;
    if (filter && filter.field === h) opt.selected = true;
    fieldSel.appendChild(opt);
  });

  const opSel = document.createElement('select');
  opSel.className = 'op-select';
  const ops = [
    { v: 'eq', text: '等于' },
    { v: 'ne', text: '不等于' },
    { v: 'contains', text: '包含' },
    { v: 'not_contains', text: '不包含' },
    { v: 'empty', text: '为空' },
    { v: 'not_empty', text: '不为空' },
    { v: 'gt', text: '大于' },
    { v: 'lt', text: '小于' }
  ];
  ops.forEach(o => {
    const opt = document.createElement('option');
    opt.value = o.v;
    opt.textContent = o.text;
    if (filter && filter.operator === o.v) opt.selected = true;
    opSel.appendChild(opt);
  });

  const valueInput = document.createElement('input');
  valueInput.type = 'text';
  valueInput.className = 'value-input';
  valueInput.placeholder = '输入筛选值（留空即匹配全部）';
  valueInput.value = filter ? filter.value : '';

  const btnRemove = document.createElement('button');
  btnRemove.className = 'btn-remove-filter';
  btnRemove.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
  btnRemove.title = '移除筛选条件';
  btnRemove.addEventListener('click', () => {
    state.filters.splice(idx, 1);
    renderFilters();
  });

  fieldSel.addEventListener('change', () => {
    state.filters[idx].field = fieldSel.value;
    updateFilterSummary();
  });
  opSel.addEventListener('change', () => {
    state.filters[idx].operator = opSel.value;
    updateFilterSummary();
  });
  valueInput.addEventListener('input', () => {
    state.filters[idx].value = valueInput.value;
    updateFilterSummary();
  });

  row.appendChild(fieldSel);
  row.appendChild(opSel);
  row.appendChild(valueInput);
  row.appendChild(btnRemove);
  wrap.appendChild(row);
}

function applyFilters(rows, filters) {
  const validFilters = filters.filter(f => f.field && f.operator && (['empty', 'not_empty'].includes(f.operator) || f.value !== undefined));
  if (validFilters.length === 0) return rows.slice();
  return rows.filter(row => validFilters.every(f => matchFilter(row, f)));
}

function matchFilter(row, f) {
  const raw = row[f.field];
  const cellVal = (raw === undefined || raw === null) ? '' : String(raw);
  const valStr = cellVal;
  const inputStr = (f.value === undefined || f.value === null) ? '' : String(f.value);
  switch (f.operator) {
    case 'eq': return valStr === inputStr;
    case 'ne': return valStr !== inputStr;
    case 'contains': return valStr.includes(inputStr);
    case 'not_contains': return !valStr.includes(inputStr);
    case 'empty': return valStr === '';
    case 'not_empty': return valStr !== '';
    case 'gt': {
      const a = parseFloat(valStr), b = parseFloat(inputStr);
      if (isNaN(a) || isNaN(b)) return false;
      return a > b;
    }
    case 'lt': {
      const a = parseFloat(valStr), b = parseFloat(inputStr);
      if (isNaN(a) || isNaN(b)) return false;
      return a < b;
    }
    default: return true;
  }
}

function updateFilterSummary() {
  const total = state.masterRows.length;
  $('total-count').textContent = total;
  const filtered = applyFilters(state.masterRows, state.filters);
  $('filtered-count').textContent = filtered.length;
  const ratioEl = $('ratio-text');
  if (ratioEl) {
    if (total === 0) {
      ratioEl.textContent = '-';
    } else {
      const pct = Math.round(filtered.length / total * 100);
      ratioEl.textContent = pct + '%';
    }
  }
}

// ---------- 预览与导出 ----------
function buildResultRows() {
  const filtered = applyFilters(state.masterRows, state.filters);
  return filtered.map(row => {
    const obj = {};
    state.mapping.forEach(m => {
      if (m.masterField) {
        const v = row[m.masterField];
        obj[m.templateCol] = (v === undefined || v === null) ? '' : v;
      } else {
        obj[m.templateCol] = '';
      }
    });
    return obj;
  });
}

function renderPreview() {
  const rows = buildResultRows();
  const headers = state.templateHeaders;
  renderTable($('result-table'), headers, rows, 20);

  const mapped = state.mapping.filter(m => m.masterField).length;
  const unmapped = state.mapping.length - mapped;
  let warn = '';
  if (unmapped > 0) {
    warn = `<br><small style="color:#64748b;">⚠️ 有 ${unmapped} 个字段未匹配，对应列将留空</small>`;
  }
  $('preview-summary').innerHTML =
    `将按小表列顺序填充 <strong>${rows.length}</strong> 名学生的数据，` +
    `已匹配 <strong>${mapped}/${state.mapping.length}</strong> 个字段。${warn}`;

  const badge = $('result-badge');
  if (badge) badge.textContent = `${rows.length} 条数据`;
}

function exportExcel() {
  if (!state.templateWorkbook) {
    alert('请先上传小表');
    return;
  }

  const resultRows = buildResultRows();
  const headers = state.templateHeaders;
  const sheetName = state.templateSheetName || state.templateWorkbook.SheetNames[0];

  // 构造新的 sheet：保留表头行之前的内容（如果有）+ 表头 + 数据
  const prefixRows = getPrefixRows(state.templateWorkbook, sheetName, state.templateHeaderRow);

  // 按小表原始列顺序生成 AOA
  const dataAoa = resultRows.map(r => headers.map(h => r[h]));

  // 合并到新 workbook
  const aoa = [];
  prefixRows.forEach(r => aoa.push(r));
  aoa.push(headers.slice());
  dataAoa.forEach(r => aoa.push(r));

  const newWb = XLSX.utils.book_new();
  const newSheet = XLSX.utils.aoa_to_sheet(aoa);

  // 自动列宽
  const colWidths = headers.map((h, i) => {
    let maxLen = String(h).length;
    resultRows.forEach(r => {
      const v = r[h];
      const s = (v === undefined || v === null) ? '' : String(v);
      if (s.length > maxLen) maxLen = s.length;
    });
    return { wch: Math.min(Math.max(maxLen + 2, 8), 40) };
  });
  newSheet['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(newWb, newSheet, sheetName || 'Sheet1');

  // 文件名：原小表名 + "_已填充.xlsx"
  const baseName = state.templateFileName.replace(/\.(xlsx|xls)$/i, '');
  const fileName = `${baseName}_已填充.xlsx`;

  XLSX.writeFile(newWb, fileName);

  const tip = $('export-tip');
  tip.textContent = `✓ 已导出文件：${fileName}（共 ${resultRows.length} 行数据）。若浏览器未自动下载，请检查下载设置。`;
  tip.classList.add('show');
}

// ---------- 事件绑定 ----------
document.addEventListener('DOMContentLoaded', () => {
  // 总表上传
  bindUpload('upload-master', 'file-master', handleMasterFile);
  $('master-sheet').addEventListener('change', (e) => {
    state.masterSheetName = e.target.value;
    refreshMasterPreview();
  });

  // 小表上传
  bindUpload('upload-template', 'file-template', handleTemplateFile);
  $('template-sheet').addEventListener('change', (e) => {
    state.templateSheetName = e.target.value;
    refreshTemplatePreview();
  });
  $('template-header-row').addEventListener('change', refreshTemplatePreview);

  // 步骤导航
  $('to-step-2').addEventListener('click', () => showStep(2));
  $('back-step-1').addEventListener('click', () => showStep(1));
  $('to-step-3').addEventListener('click', () => {
    buildMapping(true);
    renderMapping();
    showStep(3);
  });
  $('back-step-2').addEventListener('click', () => showStep(2));

  $('btn-auto-map').addEventListener('click', () => {
    buildMapping(true);
    renderMapping();
  });

  $('to-step-4').addEventListener('click', () => {
    // 若尚未有筛选条件，默认一条空的方便用户添加
    if (state.filters.length === 0) {
      state.filters.push({ field: '', operator: 'eq', value: '' });
    }
    renderFilters();
    showStep(4);
  });
  $('back-step-3').addEventListener('click', () => showStep(3));

  $('btn-add-filter').addEventListener('click', () => {
    state.filters.push({ field: '', operator: 'eq', value: '' });
    renderFilters();
  });

  $('to-step-5').addEventListener('click', () => {
    renderPreview();
    showStep(5);
  });
  $('back-step-4').addEventListener('click', () => showStep(4));

  $('btn-export').addEventListener('click', exportExcel);

  // 初始
  showStep(1);
});
