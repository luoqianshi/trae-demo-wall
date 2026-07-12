// PipeAI Demo v2.1 - Interactive Application Logic
(function() {
  'use strict';

  // === Page Navigation ===
  window.switchPage = function(page) {
    document.querySelectorAll('.page-section').forEach(function(s) { s.classList.remove('active'); });
    document.getElementById('page-' + page).classList.add('active');
    document.querySelectorAll('.nav-links a').forEach(function(a) {
      a.classList.toggle('active', a.dataset.page === page);
    });
    if (page === 'match') { showPclInfoPanel(); }
  };

  window.showPclInfoPanel = function() {
    var panel = document.getElementById('pcl-info-panel');
    if (panel && panel.style.display === 'none') {
      panel.style.display = 'block';
      renderPipeClassLibrary();
    }
  };
  document.querySelectorAll('.nav-links a').forEach(function(a) {
    a.addEventListener('click', function(e) { e.preventDefault(); switchPage(this.dataset.page); });
  });

  // === Init Stats ===
  document.getElementById('stat-pipes').textContent = DEMO_DATA.pipeLines.length;
  document.getElementById('stat-classes').textContent = DEMO_DATA.pipeClassTable.length;
  document.getElementById('stat-materials').textContent = DEMO_DATA.installMaterialTable.length;
  document.getElementById('stat-summary').textContent = DEMO_DATA.summaryTable.length;

  // ==========================================
  // PIPE CLASS LIBRARY
  // ==========================================
  var PCL_DATA = {
    code: 'M1E',
    description: '1.6MPa 不锈钢304-工艺物料',
    medium: '工艺物料',
    material: '304',
    nominalPressure: 1.6,
    minTemp: -20,
    maxTemp: 200,
    pressureClass: 'A',
    categories: [
      {
        name: '管道', key: 'pipe',
        items: [
          { name: '不锈钢无缝钢管', code: 'GD_BXGG', minDn: 10, maxDn: 25, material: '304/304L', standard: 'GB/T14976-2025', thickness: '2.5', connectionType: 'BE' },
          { name: '不锈钢无缝钢管', code: 'GD_BXGG', minDn: 32, maxDn: 50, material: '304/304L', standard: 'GB/T14976-2025', thickness: '3', connectionType: 'BE' },
          { name: '不锈钢无缝钢管', code: 'GD_BXGG', minDn: 65, maxDn: 100, material: '304/304L', standard: 'GB/T14976-2025', thickness: '3.5', connectionType: 'BE' },
          { name: '不锈钢无缝钢管', code: 'GD_BXGG', minDn: 125, maxDn: 150, material: '304/304L', standard: 'GB/T14976-2025', thickness: '4', connectionType: 'BE' },
          { name: '不锈钢无缝钢管', code: 'GD_BXGG', minDn: 200, maxDn: 200, material: '304/304L', standard: 'GB/T14976-2025', thickness: '5', connectionType: 'BE' },
          { name: '不锈钢无缝钢管', code: 'GD_BXGG', minDn: 250, maxDn: 250, material: '304/304L', standard: 'GB/T14976-2025', thickness: '6', connectionType: 'BE' },
          { name: '不锈钢无缝钢管', code: 'GD_BXGG', minDn: 300, maxDn: 300, material: '304/304L', standard: 'GB/T14976-2025', thickness: '8', connectionType: 'BE' },
          { name: '不锈钢无缝钢管', code: 'GD_BXGG', minDn: 350, maxDn: 600, material: '304/304L', standard: 'GB/T14976-2025', thickness: '10', connectionType: 'BE' }
        ]
      },
      {
        name: '阀门', key: 'valve',
        items: [
          { name: '截止阀', code: 'ZZF', minDn: 15, maxDn: 250, standard: 'J41W-16P', connectionType: 'FLGD', model: 'J41W-16P' },
          { name: '球阀', code: 'QF', minDn: 15, maxDn: 200, standard: 'Q41F-16P', connectionType: 'FLGD', model: 'Q41F-16P' },
          { name: '水平升降式止回阀', code: 'ZHF_SP', minDn: 15, maxDn: 300, standard: 'H41W-16P', connectionType: 'FLGD', model: 'H41W-16P' },
          { name: '立式升降式止回阀', code: 'ZHF_LP', minDn: 15, maxDn: 300, standard: 'H42W-16P', connectionType: 'FLGD', model: 'H42W-16P' },
          { name: '旋启式止回阀', code: 'ZHF_XQ', minDn: 50, maxDn: 600, standard: 'H44W-16P', connectionType: 'FLGD', model: 'H44W-16P' },
          { name: '过滤器', code: 'GLF', minDn: 15, maxDn: 300, standard: 'GL41W-16P', connectionType: 'FLGD', model: 'GL41W-16P' },
          { name: '安全阀', code: 'AQF', minDn: 15, maxDn: 200, standard: 'A41W-16P', connectionType: 'FLGD', model: 'A41W-16P' },
          { name: '蝶阀', code: 'DF', minDn: 200, maxDn: 600, standard: 'D341F-16P', connectionType: 'FLGD', model: 'D341F-16P' },
          { name: '针型阀', code: 'ZXF', minDn: 6, maxDn: 25, standard: 'J13W-16P', connectionType: 'FLGD', model: 'J13W-16P' }
        ]
      },
      {
        name: '法兰', key: 'flange',
        items: [
          { name: '带颈平焊法兰', code: 'FL_SO_RF', minDn: 10, maxDn: 600, material: '304', standard: 'HG/T20592-2009', connectionType: 'RF' },
          { name: '带颈对焊法兰', code: 'FL_WN_RF', minDn: 10, maxDn: 600, material: '304', standard: 'HG/T20592-2009', connectionType: 'RF' },
          { name: '板式平焊法兰', code: 'FL_PL_RF', minDn: 10, maxDn: 600, material: '304', standard: 'HG/T20592-2009', connectionType: 'RF' },
          { name: '法兰盖', code: 'FL_BL_RF', minDn: 10, maxDn: 600, material: '304', standard: 'HG/T20592-2009', connectionType: 'RF' }
        ]
      },
      {
        name: '垫片', key: 'gasket',
        items: [
          { name: '聚四氟乙烯包覆垫片', code: 'DP_PTFE', minDn: 10, maxDn: 600, material: 'PTFE/橡胶', standard: 'HG/T20607-2009', connectionType: 'RF', thickness: '3' }
        ]
      },
      {
        name: '螺栓', key: 'bolt',
        items: [
          { name: '双头螺柱', code: 'LS', minDn: 10, maxDn: 600, material: '304', standard: 'HG/T20613-2009' }
        ]
      },
      {
        name: '螺母', key: 'nut',
        items: [
          { name: '螺母', code: 'LM', minDn: 10, maxDn: 600, material: '304', standard: 'HG/T20613-2009' }
        ]
      },
      {
        name: '管件', key: 'fitting',
        items: [
          { name: '45度弯头', code: '45E(L)', minDn: 10, maxDn: 600, standard: 'GB/T 12459-2025', connectionType: 'BE' },
          { name: '90度长半径弯头', code: '90E(L)', minDn: 10, maxDn: 600, standard: 'GB/T 12459-2025', connectionType: 'BE' },
          { name: '90度短半径弯头', code: '90E(S)', minDn: 10, maxDn: 600, standard: 'GB/T 12459-2025', connectionType: 'BE' },
          { name: '三通', code: 'T(S)', minDn: 10, maxDn: 600, standard: 'GB/T 12459-2025', connectionType: 'BE' },
          { name: '异径三通', code: 'T(R)', minDn: 10, maxDn: 600, standard: 'GB/T 12459-2025', connectionType: 'BE' },
          { name: '四通', code: 'CR(S)', minDn: 10, maxDn: 600, standard: 'GB/T 12459-2025', connectionType: 'BE' },
          { name: '同心异径管', code: 'R(C)', minDn: 10, maxDn: 600, standard: 'GB/T 12459-2025', connectionType: 'BE' },
          { name: '偏心异径管', code: 'R(E)', minDn: 10, maxDn: 600, standard: 'GB/T 12459-2025', connectionType: 'BE' },
          { name: '管帽', code: 'C', minDn: 10, maxDn: 600, standard: 'GB/T 12459-2025', connectionType: 'BE' }
        ]
      }
    ]
  };

  var pclActiveCat = 'pipe';

  function renderPipeClassLibrary() {
    // Summary
    var sumHtml = '<div class="stats-bar">' +
      '<div class="stat-chip"><span class="num" style="font-size:1.1rem;">' + PCL_DATA.code + '</span><span class="lbl">等级代号</span></div>' +
      '<div class="stat-chip"><span class="num" style="font-size:1.1rem;">PN1.6</span><span class="lbl">公称压力</span></div>' +
      '<div class="stat-chip"><span class="num" style="font-size:1.1rem;">' + PCL_DATA.material + '</span><span class="lbl">材质</span></div>' +
      '<div class="stat-chip"><span class="num" style="font-size:1.1rem;">' + PCL_DATA.minTemp + '~' + PCL_DATA.maxTemp + '°C</span><span class="lbl">温度范围</span></div>' +
      '<div class="stat-chip"><span class="num" style="font-size:1.1rem;">' + PCL_DATA.categories.reduce(function(s, c) { return s + c.items.length; }, 0) + '</span><span class="lbl">组件总数</span></div>' +
      '<div class="stat-chip"><span class="num" style="font-size:1.1rem;">' + PCL_DATA.categories.length + '</span><span class="lbl">组件类别</span></div>' +
      '</div>' +
      '<p style="color:var(--muted);font-size:0.85rem;">' + esc(PCL_DATA.description) + ' | 介质: ' + esc(PCL_DATA.medium) + ' | 压力等级: ' + PCL_DATA.pressureClass + '</p>';
    document.getElementById('pcl-summary').innerHTML = sumHtml;

    // Category tabs
    var tabHtml = '';
    PCL_DATA.categories.forEach(function(cat) {
      tabHtml += '<div class="level-tag' + (cat.key === pclActiveCat ? ' selected' : '') + '" data-cat="' + cat.key + '" onclick="switchPclCat(\'' + cat.key + '\')">' + esc(cat.name) + ' (' + cat.items.length + ')</div>';
    });
    document.getElementById('pcl-cat-tabs').innerHTML = tabHtml;

    // Items table
    renderPclItems();
  }

  window.switchPclCat = function(key) {
    pclActiveCat = key;
    renderPipeClassLibrary();
  };

  function renderPclItems() {
    var cat = PCL_DATA.categories.find(function(c) { return c.key === pclActiveCat; });
    if (!cat) { document.getElementById('pcl-items').innerHTML = ''; return; }

    var catNameMap = { pipe: '管道', valve: '阀门', flange: '法兰', gasket: '垫片', bolt: '螺栓', nut: '螺母', fitting: '管件' };
    var tableHtml = '<table><thead><tr>';
    tableHtml += '<th>组件名称</th><th>编码</th><th>DN 范围</th>';
    if (cat.key === 'pipe') tableHtml += '<th>壁厚(mm)</th><th>材质</th><th>连接方式</th>';
    else if (cat.key === 'valve') tableHtml += '<th>型号</th><th>连接方式</th>';
    else if (cat.key === 'flange') tableHtml += '<th>材质</th><th>密封面</th>';
    else if (cat.key === 'gasket') tableHtml += '<th>材质</th><th>厚度(mm)</th><th>密封面</th>';
    else if (cat.key === 'bolt' || cat.key === 'nut') tableHtml += '<th>材质</th>';
    else if (cat.key === 'fitting') tableHtml += '<th>连接方式</th>';
    tableHtml += '<th>标准</th></tr></thead><tbody>';

    cat.items.forEach(function(item) {
      tableHtml += '<tr>';
      tableHtml += '<td class="accent">' + esc(item.name) + '</td>';
      tableHtml += '<td><span class="tag">' + esc(item.code) + '</span></td>';
      tableHtml += '<td>' + 'DN' + item.minDn + '~' + 'DN' + item.maxDn + '</td>';
      if (cat.key === 'pipe') {
        tableHtml += '<td class="num">' + esc(item.thickness) + '</td>';
        tableHtml += '<td>' + esc(item.material || '') + '</td>';
        tableHtml += '<td>' + esc(item.connectionType || '') + '</td>';
      } else if (cat.key === 'valve') {
        tableHtml += '<td>' + esc(item.model || item.standard || '') + '</td>';
        tableHtml += '<td>' + esc(item.connectionType || '') + '</td>';
      } else if (cat.key === 'flange') {
        tableHtml += '<td>' + esc(item.material || '') + '</td>';
        tableHtml += '<td>' + esc(item.connectionType || '') + '</td>';
      } else if (cat.key === 'gasket') {
        tableHtml += '<td>' + esc(item.material || '') + '</td>';
        tableHtml += '<td class="num">' + esc(item.thickness || '') + '</td>';
        tableHtml += '<td>' + esc(item.connectionType || '') + '</td>';
      } else if (cat.key === 'bolt' || cat.key === 'nut') {
        tableHtml += '<td>' + esc(item.material || '') + '</td>';
      } else if (cat.key === 'fitting') {
        tableHtml += '<td>' + esc(item.connectionType || '') + '</td>';
      }
      tableHtml += '<td>' + esc(item.standard) + '</td>';
      tableHtml += '</tr>';
    });

    tableHtml += '</tbody></table>';
    document.getElementById('pcl-items').innerHTML = tableHtml;
  }

  // ==========================================
  // IMPORT PAGE - Simulated DWG/DXF Import
  // ==========================================
  (function() {
    var uploadArea = document.getElementById('upload-area');
    var logEl = document.getElementById('import-log');
    var stepsEl = document.getElementById('import-steps');
    var progressBar = document.getElementById('import-progress');
    var progressFill = document.getElementById('import-progress-fill');
    var resultEl = document.getElementById('import-result');

    function addLog(msg, type) {
      var span = document.createElement('div');
      span.className = 'log-line' + (type ? ' log-' + type : '');
      span.textContent = msg;
      logEl.appendChild(span);
      logEl.scrollTop = logEl.scrollHeight;
    }

    function startImportSimulation() {
      uploadArea.style.display = 'none';
      document.getElementById('scan-visual').style.display = 'block';
      document.getElementById('scan-line').style.display = 'block';
      document.getElementById('scan-status-badge').textContent = '扫描中';
      document.getElementById('scan-status-badge').style.background = 'var(--accent)';
      // Reset all scan elements to dim
      document.querySelectorAll('.scan-el').forEach(function(el) { el.setAttribute('opacity', '0.1'); });
      document.getElementById('scan-labels').innerHTML = '';
      document.getElementById('cnt-pipes').textContent = '0';
      document.getElementById('cnt-valves').textContent = '0';
      document.getElementById('cnt-equips').textContent = '0';

      stepsEl.style.display = 'flex';
      progressBar.style.display = 'block';
      logEl.style.display = 'block';
      logEl.innerHTML = '';
      resultEl.style.display = 'none';

      var stepEls = stepsEl.querySelectorAll('.step');
      var pipeCount = 0, valveCount = 0, equipCount = 0;

      // Highlight an SVG element with glow
      function highlightEl(id, type) {
        var el = document.getElementById(id);
        if (!el) return;
        el.setAttribute('opacity', '1');
        el.setAttribute('filter', 'url(#glow)');
        var color = type === 'pipe' ? '#00b4d8' : type === 'valve' ? '#f0883e' : '#3fb950';
        el.querySelectorAll('line').forEach(function(l) { l.setAttribute('stroke', color); l.setAttribute('stroke-width', '2.5'); });
        el.querySelectorAll('polygon').forEach(function(p) { p.setAttribute('stroke', color); });
        el.querySelectorAll('rect, circle').forEach(function(s) { s.setAttribute('stroke', color); });
        el.querySelectorAll('text').forEach(function(t) { t.setAttribute('fill', color); });
        setTimeout(function() { el.setAttribute('filter', ''); }, 1500);
      }

      // Add a floating label near an element
      function addScanLabel(text, x, y, color) {
        var ns = 'http://www.w3.org/2000/svg';
        var g = document.createElementNS(ns, 'g');
        g.setAttribute('opacity', '0');
        var bg = document.createElementNS(ns, 'rect');
        bg.setAttribute('x', x - 2); bg.setAttribute('y', y - 12);
        bg.setAttribute('rx', '3'); bg.setAttribute('ry', '3');
        bg.setAttribute('fill', color); bg.setAttribute('opacity', '0.15');
        bg.setAttribute('width', text.length * 7 + 10); bg.setAttribute('height', '16');
        var txt = document.createElementNS(ns, 'text');
        txt.setAttribute('x', x + 3); txt.setAttribute('y', y);
        txt.setAttribute('fill', color); txt.setAttribute('font-size', '10');
        txt.setAttribute('font-family', 'monospace'); txt.setAttribute('font-weight', '600');
        txt.textContent = text;
        g.appendChild(bg);
        g.appendChild(txt);
        document.getElementById('scan-labels').appendChild(g);
        // Animate in
        requestAnimationFrame(function() {
          g.setAttribute('opacity', '1');
          g.style.transition = 'opacity 0.3s';
        });
      }

      var steps = [
        { pct: 10, msg: '[INFO] 正在读取 DWG 文件...', type: 'info', action: function() {} },
        { pct: 25, msg: '[INFO] 解析图层信息... 发现 12 个图层', type: 'info', action: function() {} },
        { pct: 35, msg: '[INFO] 识别 P&ID 图层: PIPING, VALVES, EQUIPMENT, INSTRUMENTS', type: 'info', action: function() {} },
        { pct: 48, msg: '[INFO] 提取管线数据...', type: 'info', action: function() {
          highlightEl('pipe-X101A01', 'pipe'); addScanLabel('PL-X101A01', 155, 130, '#00b4d8');
          pipeCount++; document.getElementById('cnt-pipes').textContent = pipeCount;
        }},
        { pct: 56, msg: '[INFO] 识别管线 PL-X101A02', type: 'success', action: function() {
          highlightEl('pipe-X101A02', 'pipe'); addScanLabel('PL-X101A02', 420, 262, '#00b4d8');
          pipeCount++; document.getElementById('cnt-pipes').textContent = pipeCount;
        }},
        { pct: 62, msg: '[INFO] 识别管线 PL-X101A03', type: 'success', action: function() {
          highlightEl('pipe-X101A03', 'pipe'); addScanLabel('PL-X101A03', 540, 148, '#00b4d8');
          pipeCount++; document.getElementById('cnt-pipes').textContent = pipeCount;
        }},
        { pct: 68, msg: '[INFO] 识别管线 PL-X101A04', type: 'success', action: function() {
          highlightEl('pipe-X101A04', 'pipe'); addScanLabel('PL-X101A04', 100, 148, '#00b4d8');
          pipeCount++; document.getElementById('cnt-pipes').textContent = pipeCount;
        }},
        { pct: 74, msg: '[INFO] 提取阀门组件...', type: 'info', action: function() {
          highlightEl('valve-v01', 'valve'); addScanLabel('V-01', 165, 100, '#f0883e');
          valveCount++; document.getElementById('cnt-valves').textContent = valveCount;
        }},
        { pct: 80, msg: '[INFO] 识别阀门 V-02, V-03', type: 'info', action: function() {
          highlightEl('valve-v02', 'valve'); highlightEl('valve-v03', 'valve');
          addScanLabel('V-02', 515, 178, '#f0883e');
          addScanLabel('V-03', 55, 100, '#f0883e');
          valveCount += 2; document.getElementById('cnt-valves').textContent = valveCount;
        }},
        { pct: 86, msg: '[INFO] 识别设备: T-101, V-101, P-101, R-101', type: 'success', action: function() {
          highlightEl('equip-T101', 'equip'); highlightEl('equip-V101', 'equip');
          highlightEl('equip-P101', 'equip'); highlightEl('equip-R101', 'equip');
          equipCount = 4; document.getElementById('cnt-equips').textContent = equipCount;
        }},
        { pct: 94, msg: '[WARN] 部分管线缺少设计压力参数，建议人工补充', type: 'warn', action: function() {} },
        { pct: 100, msg: '[SUCCESS] 图纸解析完成！共提取 ' + DEMO_DATA.pipeLines.length + ' 条管线', type: 'success', action: function() {
          document.getElementById('scan-line').style.display = 'none';
          document.getElementById('scan-status-badge').textContent = '完成';
          document.getElementById('scan-status-badge').style.background = 'var(--green)';
        }},
      ];

      var i = 0;
      function nextStep() {
        if (i >= steps.length) {
          setTimeout(function() {
            resultEl.style.display = 'block';
            document.getElementById('res-pipes').textContent = DEMO_DATA.pipeLines.length;
            document.getElementById('res-pipes-detail').textContent = DEMO_DATA.pipeLines.length + ' 条管线已识别';
            document.getElementById('res-equip').textContent = 0;
            var totalComps = 0;
            DEMO_DATA.pipeLines.forEach(function(p) { totalComps += (p.components || []).length; });
            document.getElementById('res-comps').textContent = totalComps;
            document.getElementById('res-warn').textContent = 1;
          }, 300);
          return;
        }
        var s = steps[i];
        setTimeout(function() {
          progressFill.style.width = s.pct + '%';
          addLog(s.msg, s.type);
          if (s.action) s.action();
          var activeIdx = Math.floor(s.pct / 20);
          stepEls.forEach(function(el, idx) {
            el.classList.remove('active', 'done');
            if (idx < activeIdx) el.classList.add('done');
            else if (idx === activeIdx) el.classList.add('active');
          });
          i++;
          nextStep();
        }, i === 0 ? 200 : (i < 3 ? 600 : (i < 7 ? 400 : 300)));
      }
      nextStep();
    }

    uploadArea.addEventListener('click', startImportSimulation);
    uploadArea.addEventListener('dragover', function(e) { e.preventDefault(); this.classList.add('dragover'); });
    uploadArea.addEventListener('dragleave', function() { this.classList.remove('dragover'); });
    uploadArea.addEventListener('drop', function(e) { e.preventDefault(); this.classList.remove('dragover'); startImportSimulation(); });
  })();

  // ==========================================
  // REVIEW PAGE - Editable PipeLine Table
  // ==========================================
  (function() {
    var data = DEMO_DATA.pipeLines.map(function(p) { return JSON.parse(JSON.stringify(p)); });
    var editingIdx = -1;

    function render() {
      var search = document.getElementById('rv-search').value.toLowerCase();
      var filtered = data.filter(function(r) {
        if (!search) return true;
        return (r.lineNo || '').toLowerCase().indexOf(search) > -1 ||
               (r.medium || '').toLowerCase().indexOf(search) > -1 ||
               (r.from || '').toLowerCase().indexOf(search) > -1 ||
               (r.to || '').toLowerCase().indexOf(search) > -1;
      });
      document.getElementById('rv-count').textContent = filtered.length + ' / ' + data.length + ' 条';
      var tbody = document.querySelector('#tbl-review tbody');
      tbody.innerHTML = '';

      filtered.forEach(function(r, idx) {
        var tr = document.createElement('tr');
        var isEditing = editingIdx === idx;
        if (isEditing) tr.classList.add('editing');

        function td(val, field, editable) {
          if (isEditing && editable) {
            return '<td><input class="edit-input" value="' + esc(String(val || '')) + '" data-field="' + field + '" data-idx="' + idx + '"></td>';
          }
          return '<td>' + (field === 'lineNo' ? '<span class="accent">' + esc(String(val || '')) + '</span>' : esc(String(val || ''))) + '</td>';
        }

        tr.innerHTML =
          td(r.lineNo, 'lineNo', true) +
          td(r.medium, 'medium', true) +
          td(r.nominalSize, 'nominalSize', true) +
          td(r.pipeClass, 'pipeClass', true) +
          td(r.material, 'material', true) +
          td(r.from, 'from', true) +
          td(r.to, 'to', true) +
          td(r.designPressure, 'designPressure', true) +
          td(r.designTemp, 'designTemp', true) +
          td(r.operatingPressure, 'operatingPressure', true) +
          td(r.operatingTemp, 'operatingTemp', true) +
          td(r.outerDiameter, 'outerDiameter', false) +
          td(r.wallThickness, 'wallThickness', false) +
          td(r.length, 'length', false) +
          '<td class="num">' + (r.components || []).length + '</td>';

        tr.addEventListener('click', function(e) {
          if (e.target.tagName === 'INPUT') return;
          editingIdx = idx;
          render();
          setTimeout(function() {
            var inp = tr.querySelector('input');
            if (inp) { inp.focus(); inp.select(); }
          }, 10);
        });

        tbody.appendChild(tr);
      });

      tbody.querySelectorAll('input.edit-input').forEach(function(inp) {
        inp.addEventListener('blur', function() {
          var field = this.dataset.field;
          var idx = parseInt(this.dataset.idx);
          var val = this.value;
          if (['designPressure','designTemp','operatingPressure','operatingTemp','outerDiameter','wallThickness','length'].indexOf(field) > -1) {
            val = parseFloat(val) || 0;
          }
          data[idx][field] = val;
          editingIdx = -1;
          render();
        });
        inp.addEventListener('keydown', function(e) {
          if (e.key === 'Enter') { this.blur(); }
        });
      });
    }

    document.getElementById('rv-search').addEventListener('input', function() { editingIdx = -1; render(); });
    render();
  })();

  // ==========================================
  // MATCH PAGE - Pipe Class Matching
  // ==========================================
  (function() {
    var levels = ['M1E', 'M2B', 'M3D', 'L1A'];
    var sel = 'M1E';
    var selEl = document.getElementById('level-selector');
    var matchData = [];

    levels.forEach(function(l) {
      var tag = document.createElement('div');
      tag.className = 'level-tag' + (l === sel ? ' selected' : '');
      tag.textContent = l;
      tag.addEventListener('click', function() {
        selEl.querySelectorAll('.level-tag').forEach(function(t) { t.classList.remove('selected'); });
        tag.classList.add('selected');
        sel = l;
        showPclInfoPanel();
        document.getElementById('match-result').style.display = 'none';
      });
      selEl.appendChild(tag);
    });

    window.runMatch = function() {
      var btn = document.getElementById('btn-match');
      btn.disabled = true;
      btn.textContent = '匹配中...';

      var classDef = DEMO_DATA.pipeClassTable.find(function(c) { return c.pipeClass === sel; }) || DEMO_DATA.pipeClassTable[0];
      matchData = DEMO_DATA.pipeCharTable.map(function(r) {
        return {
          lineNo: r.lineNo,
          medium: r.medium,
          nominalSize: r.nominalSize,
          matchedClass: sel,
          pipeSpec: classDef.pipeSpec || r.pipeSpec,
          pipeStandard: classDef.pipeStandard || r.pipeStandard,
          flangeStandard: classDef.flangeStandard || r.flangeStandard,
          flangeFace: classDef.flangeFace || r.flangeFace,
          gasketType: classDef.gasketType || r.gasketType,
          boltType: classDef.boltType || r.boltType
        };
      });

      setTimeout(function() {
        btn.disabled = false;
        btn.innerHTML = '&#x2699;&#xFE0F; 自动匹配标准';
        document.getElementById('match-result').style.display = 'block';
        document.getElementById('match-count').textContent = matchData.length;

        var tbody = document.querySelector('#tbl-match-result tbody');
        tbody.innerHTML = '';
        matchData.forEach(function(r) {
          var tr = document.createElement('tr');
          tr.innerHTML =
            '<td class="accent">' + esc(r.lineNo) + '</td>' +
            '<td>' + esc(r.medium) + '</td>' +
            '<td>' + esc(r.nominalSize) + '</td>' +
            '<td class="accent">' + esc(r.matchedClass) + '</td>' +
            '<td>' + esc(r.pipeSpec) + '</td>' +
            '<td>' + esc(r.pipeStandard) + '</td>' +
            '<td>' + esc(r.flangeStandard) + '</td>' +
            '<td>' + esc(r.flangeFace) + '</td>' +
            '<td>' + esc(r.gasketType) + '</td>' +
            '<td>' + esc(r.boltType) + '</td>';
          tbody.appendChild(tr);
        });
      }, 800);
    };
  })();

  // ==========================================
  // PIPE CHAR TABLE (search, filter, sort)
  // ==========================================
  var pcData = DEMO_DATA.pipeCharTable.slice();
  var pcSortKey = '', pcSortAsc = true;

  function pcPopulateFilters() {
    var mediums = {}, classes = {};
    DEMO_DATA.pipeCharTable.forEach(function(r) {
      if (r.medium) mediums[r.medium] = true;
      if (r.pipeClass) classes[r.pipeClass] = true;
    });
    var mSel = document.getElementById('pc-filter-medium');
    var cSel = document.getElementById('pc-filter-class');
    Object.keys(mediums).sort().forEach(function(m) {
      var opt = document.createElement('option'); opt.value = m; opt.textContent = m; mSel.appendChild(opt);
    });
    Object.keys(classes).sort().forEach(function(c) {
      var opt = document.createElement('option'); opt.value = c; opt.textContent = c; cSel.appendChild(opt);
    });
  }
  pcPopulateFilters();

  function pcRender() {
    var search = document.getElementById('pc-search').value.toLowerCase();
    var fMedium = document.getElementById('pc-filter-medium').value;
    var fClass = document.getElementById('pc-filter-class').value;
    var filtered = pcData.filter(function(r) {
      if (search && r.lineNo.toLowerCase().indexOf(search) === -1 && r.medium.toLowerCase().indexOf(search) === -1 && r.from.toLowerCase().indexOf(search) === -1 && r.to.toLowerCase().indexOf(search) === -1) return false;
      if (fMedium && r.medium !== fMedium) return false;
      if (fClass && r.pipeClass !== fClass) return false;
      return true;
    });
    if (pcSortKey) {
      filtered.sort(function(a, b) {
        var va = a[pcSortKey], vb = b[pcSortKey];
        if (typeof va === 'number') return pcSortAsc ? va - vb : vb - va;
        return pcSortAsc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
      });
    }
    document.getElementById('pc-count').textContent = filtered.length + ' / ' + pcData.length + ' 条';
    var tbody = document.querySelector('#tbl-pipechar tbody');
    tbody.innerHTML = '';
    filtered.forEach(function(r) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td class="accent">' + esc(r.lineNo) + '</td>' +
        '<td>' + esc(r.nominalSize) + '</td>' +
        '<td>' + esc(r.pipeClass) + '</td>' +
        '<td>' + esc(r.material) + '</td>' +
        '<td>' + esc(r.pipeSpec) + '</td>' +
        '<td class="wrap">' + esc(r.pipeStandard) + '</td>' +
        '<td>' + esc(r.from) + '</td>' +
        '<td>' + esc(r.to) + '</td>' +
        '<td>' + esc(r.medium) + '</td>' +
        '<td class="num">' + r.operatingTemp + '</td>' +
        '<td class="num">' + r.operatingPressure + '</td>' +
        '<td class="num">' + r.designTemp + '</td>' +
        '<td class="num">' + r.designPressure + '</td>' +
        '<td>' + esc(r.flangeStandard) + '</td>' +
        '<td>' + esc(r.gasketType) + '</td>' +
        '<td>' + esc(r.boltType) + '</td>';
      tbody.appendChild(tr);
    });
  }
  document.getElementById('pc-search').addEventListener('input', pcRender);
  document.getElementById('pc-filter-medium').addEventListener('change', pcRender);
  document.getElementById('pc-filter-class').addEventListener('change', pcRender);
  document.querySelectorAll('#tbl-pipechar thead th[data-sort]').forEach(function(th) {
    th.addEventListener('click', function() {
      var key = this.dataset.sort;
      if (pcSortKey === key) { pcSortAsc = !pcSortAsc; } else { pcSortKey = key; pcSortAsc = true; }
      document.querySelectorAll('#tbl-pipechar thead th').forEach(function(t) { t.classList.remove('sorted'); });
      this.classList.add('sorted');
      pcRender();
    });
  });
  pcRender();

  // ==========================================
  // INSTALL MATERIAL TABLE (editable + expandable)
  // ==========================================
  (function() {
    var mtData = DEMO_DATA.installMaterialTable.map(function(r) { return JSON.parse(JSON.stringify(r)); });
    var mtEditingIdx = -1;

    function mtRender() {
      var search = document.getElementById('mt-search').value.toLowerCase();
      var filtered = mtData.filter(function(r) {
        if (search && r.lineNo.toLowerCase().indexOf(search) === -1) return false;
        return true;
      });
      document.getElementById('mt-count').textContent = filtered.length + ' / ' + mtData.length + ' 条';
      var tbody = document.querySelector('#tbl-material tbody');
      tbody.innerHTML = '';

      filtered.forEach(function(r, idx) {
        var hasDetail = (r.valves && r.valves.length > 0) || (r.fittings && r.fittings.length > 0) ||
                        (r.gaskets && r.gaskets.length > 0) || (r.bolts && r.bolts.length > 0) ||
                        (r.flanges && r.flanges.length > 0);
        var tr = document.createElement('tr');
        var isEditing = mtEditingIdx === idx;
        if (isEditing) tr.classList.add('editing');

        function td(val, field) {
          if (isEditing) {
            return '<td><input class="edit-input" value="' + esc(String(val || '')) + '" data-field="' + field + '" data-idx="' + idx + '"></td>';
          }
          return '<td>' + (field === 'lineNo' ? esc(String(val || '')) : esc(String(val || ''))) + '</td>';
        }

        tr.innerHTML =
          (hasDetail ? '<td><span class="expand-btn" onclick="toggleMt(this)">&#9654;</span></td>' : '<td></td>') +
          td(r.lineNo, 'lineNo') +
          td(r.pipeClass, 'pipeClass') +
          td(r.nominalSize, 'nominalSize') +
          td(r.pipeSpec, 'pipeSpec') +
          '<td class="num">' + fmt1(r.pipeLength) + '</td>' +
          '<td class="num">' + fmt1(r.pipeWeight) + '</td>' +
          td(r.flangeSpec, 'flangeSpec') +
          td(r.valveSpec, 'valveSpec') +
          td(r.gasketSpec, 'gasketSpec') +
          td(r.boltSpec, 'boltSpec');

        tr.addEventListener('click', function(e) {
          if (e.target.tagName === 'INPUT') return;
          mtEditingIdx = idx;
          mtRender();
          setTimeout(function() {
            var inp = tr.querySelector('input');
            if (inp) { inp.focus(); inp.select(); }
          }, 10);
        });

        tbody.appendChild(tr);

        if (hasDetail) {
          var tr2 = document.createElement('tr');
          tr2.innerHTML = '<td colspan="11"><div class="sub-table">' + buildMtDetail(r) + '</div></td>';
          tbody.appendChild(tr2);
        }
      });

      tbody.querySelectorAll('input.edit-input').forEach(function(inp) {
        inp.addEventListener('blur', function() {
          var field = this.dataset.field;
          var idx = parseInt(this.dataset.idx);
          var val = this.value;
          if (['pipeLength','pipeWeight'].indexOf(field) > -1) {
            val = parseFloat(val) || 0;
          }
          mtData[idx][field] = val;
          mtEditingIdx = -1;
          mtRender();
        });
        inp.addEventListener('keydown', function(e) {
          if (e.key === 'Enter') { this.blur(); }
        });
      });
    }

    document.getElementById('mt-search').addEventListener('input', function() { mtEditingIdx = -1; mtRender(); });
    mtRender();
  })();

  function buildMtDetail(r) {
    var html = '';
    if (r.valves && r.valves.length > 0) {
      html += '<h4 style="color:var(--accent);font-size:0.78rem;margin:0.5rem 0 0.25rem;">阀门 (' + r.valves.length + ')</h4>';
      html += '<table><thead><tr><th>类型</th><th>规格</th><th>数量</th><th>型号</th><th>材质</th></tr></thead><tbody>';
      r.valves.forEach(function(v) {
        html += '<tr><td>' + esc(v.type) + '</td><td>' + esc(v.spec || '') + '</td><td class="num">' + v.quantity + '</td><td>' + esc(v.standard || '') + '</td><td>' + esc(v.material || '') + '</td></tr>';
      });
      html += '</tbody></table>';
    }
    if (r.fittings && r.fittings.length > 0) {
      html += '<h4 style="color:var(--accent);font-size:0.78rem;margin:0.5rem 0 0.25rem;">管件 (' + r.fittings.length + ')</h4>';
      html += '<table><thead><tr><th>类型</th><th>规格</th><th>数量</th><th>标准</th><th>材质</th></tr></thead><tbody>';
      r.fittings.forEach(function(f) {
        html += '<tr><td>' + esc(f.type) + '</td><td>' + esc(f.spec || '') + '</td><td class="num">' + f.quantity + '</td><td>' + esc(f.standard || '') + '</td><td>' + esc(f.material || '') + '</td></tr>';
      });
      html += '</tbody></table>';
    }
    if (r.gaskets && r.gaskets.length > 0) {
      html += '<h4 style="color:var(--accent);font-size:0.78rem;margin:0.5rem 0 0.25rem;">垫片 (' + r.gaskets.length + ')</h4>';
      html += '<table><thead><tr><th>类型</th><th>规格</th><th>数量</th><th>密封面</th></tr></thead><tbody>';
      r.gaskets.forEach(function(g) {
        html += '<tr><td>' + esc(g.type) + '</td><td>' + esc(g.spec || '') + '</td><td class="num">' + g.quantity + '</td><td>' + esc(g.sealFace || '') + '</td></tr>';
      });
      html += '</tbody></table>';
    }
    if (r.bolts && r.bolts.length > 0) {
      html += '<h4 style="color:var(--accent);font-size:0.78rem;margin:0.5rem 0 0.25rem;">紧固件 (' + r.bolts.length + ')</h4>';
      html += '<table><thead><tr><th>类型</th><th>规格</th><th>数量</th><th>材质</th></tr></thead><tbody>';
      r.bolts.forEach(function(b) {
        html += '<tr><td>' + esc(b.type) + '</td><td>' + esc(b.spec || '') + '</td><td class="num">' + b.quantity + '</td><td>' + esc(b.material || '') + '</td></tr>';
      });
      html += '</tbody></table>';
    }
    return html;
  }

  window.toggleMt = function(btn) {
    btn.classList.toggle('open');
    var sub = btn.closest('tr').nextElementSibling.querySelector('.sub-table');
    sub.classList.toggle('show');
  };

  // ==========================================
  // SUMMARY TABLE (hierarchical)
  // ==========================================
  function smRender() {
    var search = document.getElementById('sm-search').value.toLowerCase();
    var rows = DEMO_DATA.summaryTable;
    var filtered = rows.filter(function(r) {
      if (r.rowType === 'category') return true;
      if (r.rowType === 'subItem') return true;
      if (search && (r.specification || '').toLowerCase().indexOf(search) === -1 && (r.material || '').toLowerCase().indexOf(search) === -1 && (r.standard || '').toLowerCase().indexOf(search) === -1) return false;
      return true;
    });
    document.getElementById('sm-count').textContent = filtered.length + ' / ' + rows.length + ' 条';
    var tbody = document.querySelector('#tbl-summary tbody');
    tbody.innerHTML = '';
    filtered.forEach(function(r) {
      var tr = document.createElement('tr');
      if (r.rowType === 'category') {
        tr.className = 'cat-row';
        tr.innerHTML = '<td></td><td colspan="8">' + esc(r.category) + '</td>';
      } else if (r.rowType === 'subItem') {
        tr.className = 'sub-row';
        tr.innerHTML = '<td></td><td>' + esc(r.subItemName) + '</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>';
      } else {
        tr.className = 'det-row';
        tr.innerHTML =
          '<td></td><td>' + esc(r.materialName || '') + '</td>' +
          '<td>' + esc(r.specification) + '</td>' +
          '<td>' + esc(r.material) + '</td>' +
          '<td>' + esc(r.standard) + '</td>' +
          '<td>' + esc(r.unit) + '</td>' +
          '<td class="num">' + fmt1(r.quantity) + '</td>' +
          '<td class="num">' + fmt1(r.totalWeight || 0) + '</td>' +
          '<td>' + esc(r.remarks) + '</td>';
      }
      tbody.appendChild(tr);
    });
  }
  document.getElementById('sm-search').addEventListener('input', smRender);
  smRender();

  // === Utility ===
  function esc(s) { if (s === null || s === undefined) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function fmt1(v) { var n = parseFloat(v); return isNaN(n) ? '0' : n.toFixed(1); }

  // ==========================================
  // EXCEL EXPORT (styled HTML .xls)
  // ==========================================
  function escH(s) { var v = String(s == null ? '' : s); return v.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function downloadXls(filename, htmlContent) {
    var blob = new Blob(['\uFEFF' + htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  }

  function xlsWrap(title, headers, rows, opts) {
    opts = opts || {};
    var h = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
    h += '<head><meta charset="utf-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>';
    h += '<x:Name>' + escH(title) + '</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->';
    h += '<style>';
    h += 'td,th{mso-number-format:"\\@";font-family:"宋体",SimSun;font-size:11px;padding:4px 6px;border:1px solid #b0b0b0;white-space:nowrap;}';
    h += 'th{background:#4472C4;color:#fff;font-weight:bold;text-align:center;font-size:11px;}';
    h += '.title{font-family:"宋体",SimSun;font-size:16px;font-weight:bold;text-align:center;padding:10px 6px;background:#2f5496;color:#fff;}';
    h += '.subtitle{font-family:"宋体",SimSun;font-size:11px;text-align:center;padding:4px 6px;color:#555;background:#f2f2f2;}';
    h += '.cat-row td{background:#d6e4f0;font-weight:bold;font-size:12px;text-align:left;padding-left:12px;}';
    h += '.sub-row td{background:#e9eff7;font-size:11px;text-align:left;padding-left:24px;}';
    h += '.num{mso-number-format:"0.0";text-align:right;}';
    h += '.row0 td{background:#ffffff;} .row1 td{background:#f5f8fc;}';
    h += '</style></head><body><table border="0" cellpadding="0" cellspacing="0">';

    // Title row
    h += '<tr class="title"><td colspan="' + headers.length + '">' + escH(title) + '</td></tr>';
    // Subtitle
    if (opts.subtitle) {
      h += '<tr class="subtitle"><td colspan="' + headers.length + '">' + escH(opts.subtitle) + '</td></tr>';
    }
    // Header
    h += '<tr>';
    for (var i = 0; i < headers.length; i++) h += '<th>' + escH(headers[i]) + '</th>';
    h += '</tr>';
    // Data rows
    for (var j = 0; j < rows.length; j++) {
      var r = rows[j];
      h += '<tr class="' + (r._cls || ('row' + (j % 2))) + '">';
      if (r._full) {
        h += '<td colspan="' + headers.length + '">' + escH(r._text) + '</td>';
      } else {
        for (var k = 0; k < headers.length; k++) {
          var val = r[k] != null ? r[k] : '';
          var cls = (typeof val === 'string' && val.indexOf('.num') === 0) ? ' class="num"' : '';
          var display = (typeof val === 'string' && val.indexOf('.num') === 0) ? val.substring(4) : escH(val);
          h += '<td' + cls + '>' + display + '</td>';
        }
      }
      h += '</tr>';
    }
    h += '</table></body></html>';
    return h;
  }

  window.exportPipeChar = function() {
    var headers = ['管线号','公称直径','等级','材质','管材规格','管材标准','起点','终点','介质','操作温度(℃)','操作压力(MPa)','设计温度(℃)','设计压力(MPa)','法兰标准','垫片类型','紧固件'];
    var rows = [];
    DEMO_DATA.pipeCharTable.forEach(function(r) {
      rows.push([r.lineNo, r.nominalSize, r.pipeClass, r.material, r.pipeSpec, r.pipeStandard, r.from, r.to, r.medium,
        r.operatingTemp, r.operatingPressure, r.designTemp, r.designPressure, r.flangeStandard, r.gasketType, r.boltType]);
    });
    downloadXls('管道特性表_' + DEMO_DATA.projectName + '.xls', xlsWrap('管道特性表', headers, rows, { subtitle: DEMO_DATA.projectName }));
  };

  window.exportMaterial = function() {
    var headers = ['管线号','等级','公称直径','管材规格','管长(m)','管重(kg)','法兰规格','阀门型号','垫片规格','螺栓规格'];
    var rows = [];
    DEMO_DATA.installMaterialTable.forEach(function(r) {
      rows.push([r.lineNo, r.pipeClass, r.nominalSize, r.pipeSpec,
        '.num' + fmt1(r.pipeLength), '.num' + fmt1(r.pipeWeight),
        r.flangeSpec, r.valveSpec, r.gasketSpec, r.boltSpec]);
    });
    downloadXls('安装材料表_' + DEMO_DATA.projectName + '.xls', xlsWrap('安装材料表', headers, rows, { subtitle: DEMO_DATA.projectName }));
  };

  window.exportSummary = function() {
    var headers = ['材料名称','规格型号','材质','执行标准','单位','数量','总重(kg)','备注'];
    var rows = [];
    DEMO_DATA.summaryTable.forEach(function(r) {
      if (r.rowType === 'category') {
        rows.push({ _full: true, _text: r.category, _cls: 'cat-row' });
      } else if (r.rowType === 'subItem') {
        rows.push({ _full: true, _text: r.subItemName, _cls: 'sub-row' });
      } else {
        rows.push([r.materialName, r.specification, r.material, r.standard, r.unit,
          '.num' + fmt1(r.quantity), '.num' + fmt1(r.totalWeight || 0), r.remarks]);
      }
    });
    downloadXls('综合材料表_' + DEMO_DATA.projectName + '.xls', xlsWrap('综合材料表', headers, rows, { subtitle: DEMO_DATA.projectName }));
  };
})();