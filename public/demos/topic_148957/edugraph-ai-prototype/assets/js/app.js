/* ===== app.js · 应用主入口 ===== */
window.App = (function () {

  // ============ 示例题 ============
  const EXAMPLES = [
    {
      subject: '数学',
      emoji: '📐',
      title: '二次函数求顶点',
      question: '求二次函数 y = x² - 4x + 3 的顶点坐标、对称轴和根，并画出函数图像。',
    },
    {
      subject: '物理',
      emoji: '⚖️',
      title: '斜面物体受力分析',
      question: '如图，一个质量为 m 的木块静止在倾角为 30° 的斜面上，请分析木块的受力情况（重力、支持力、摩擦力），并画出受力分析图。',
    },
    {
      subject: '生物',
      emoji: '🧬',
      title: '豌豆杂交实验',
      question: '孟德尔豌豆杂交实验：纯种高茎豌豆（DD）与矮茎豌豆（dd）杂交，得到 F1 代，F1 代自交得到 F2 代。请画出遗传图解，标注各代基因型与表现型比例。',
    },
    {
      subject: '语文',
      emoji: '📝',
      title: '议论文结构',
      question: '以"坚持的力量"为题，写一篇议论文。请给出文章结构图，包含开头引题、主体三段论证、结尾升华五部分，每部分列出要点与字数。',
    },
    {
      subject: '生物',
      emoji: '🌿',
      title: '食物链与食物网',
      question: '某草原生态系统中，草是生产者，兔和鼠以草为食，狐捕食兔和鼠，鹰也捕食鼠，兔与鼠之间存在竞争关系。请画出该生态系统的食物链与食物网图，标注各物种的营养级。',
    },
  ];

  // Gallery 示例参数（免 Key 演示用）
  const GALLERY_DEMOS = [
    {
      type: 'quadratic',
      title: '数学·二次函数',
      desc: 'y = (x-2)² - 1 的图像，含顶点、对称轴、根',
      question: '求二次函数 y = x² - 4x + 3 的顶点与根',
      subject: '数学',
      params: {
        a: 1, b: -4, c: 3,
        vertex: { x: 2, y: -1 },
        roots: [1, 3],
        axisOfSymmetry: 2,
        opening: 'up',
        vertexForm: 'y = (x-2)² - 1'
      }
    },
    {
      type: 'forceDiagram',
      title: '物理·受力分析',
      desc: '30° 斜面上木块的受力分析（重力、支持力、摩擦力）',
      question: '分析 30° 斜面上木块的受力',
      subject: '物理',
      params: {
        object: '木块（斜面）',
        forces: [
          { name: '重力G', direction: 'down', magnitude: 'mg', point: { x: 0, y: 0 } },
          { name: '支持力N', direction: 'angle', magnitude: 'mgcosθ', point: { x: 0, y: 0 } },
          { name: '摩擦力f', direction: 'angle', magnitude: 'μN', point: { x: 0, y: 0 } }
        ],
        coordinateSystem: 'xy',
        inclination: 30
      }
    },
    {
      type: 'geneticDiagram',
      title: '生物·遗传图解',
      desc: '豌豆 DD × dd 杂交，F2 代 3:1 性状分离',
      question: '画出 DD × dd 杂交遗传图解',
      subject: '生物',
      params: {
        generations: [
          { generation: 'P', genotype: 'DD × dd', phenotype: '高茎 × 矮茎', ratio: '—' },
          { generation: 'F₁', genotype: 'Dd', phenotype: '高茎', ratio: '100% 高茎' },
          { generation: 'F₂', genotype: 'DD : Dd : dd', phenotype: '高茎 : 矮茎', ratio: '3 : 1' }
        ],
        inheritanceType: '显性'
      }
    },
    {
      type: 'essayStructure',
      title: '语文·议论文结构',
      desc: '"坚持的力量"五段式议论文结构思维导图',
      question: '以"坚持的力量"为题写议论文结构',
      subject: '语文',
      params: {
        theme: '坚持的力量',
        sections: [
          { title: '开头·引题', keyPoints: ['引用名言：锲而不舍，金石可镂', '提出中心论点：坚持是成功的基石'], wordCount: 80 },
          { title: '主体·论证一', keyPoints: ['分论点：坚持能跨越困难', '事例：司马迁忍辱写《史记》'], wordCount: 200 },
          { title: '主体·论证二', keyPoints: ['分论点：坚持能成就梦想', '事例：爱迪生千次实验发明电灯'], wordCount: 200 },
          { title: '主体·论证三', keyPoints: ['分论点：坚持需正确方向', '反面论证：南辕北辙的教训'], wordCount: 100 },
          { title: '结尾·升华', keyPoints: ['总结全文', '呼应开头', '发出号召：让坚持成为习惯'], wordCount: 120 }
        ]
      }
    },
    {
      type: 'ecosystemDiagram',
      title: '生物·食物链与食物网',
      desc: '草原生态系统食物网，含生产者、消费者、捕食与竞争关系',
      question: '某草原生态系统中，草是生产者，兔和鼠以草为食，狐捕食兔和鼠，鹰也捕食鼠，兔与鼠之间存在竞争关系。请画出该生态系统的食物链与食物网图。',
      subject: '生物',
      params: {
        species: [
          { name: '草', trophicLevel: '生产者' },
          { name: '兔', trophicLevel: '初级消费者' },
          { name: '鼠', trophicLevel: '初级消费者' },
          { name: '狐', trophicLevel: '次级消费者' },
          { name: '鹰', trophicLevel: '次级消费者' }
        ],
        relationships: [
          { from: '草', to: '兔', type: '捕食' },
          { from: '草', to: '鼠', type: '捕食' },
          { from: '兔', to: '狐', type: '捕食' },
          { from: '鼠', to: '狐', type: '捕食' },
          { from: '鼠', to: '鹰', type: '捕食' },
          { from: '兔', to: '鼠', type: '竞争' }
        ]
      }
    },
  ];

  // ============ 状态 ============
  const state = {
    currentRoute: '#/',
    parseState: 'empty', // empty | loading | done | error
    parseBuffer: '',
    parsedResult: null,
    error: null,
  };

  // ============ 主区域容器 ============
  function getMain() {
    return document.getElementById('app-main');
  }

  // ============ 路由 ============
  const routes = {
    '#/': renderHome,
    '#/history': renderHistory,
    '#/gallery': renderGallery,
    '#/settings': renderSettings,
  };

  function handleRoute() {
    const hash = location.hash || '#/';
    state.currentRoute = hash;
    const renderer = routes[hash] || routes['#/'];
    // 更新导航高亮
    document.querySelectorAll('.navbar-menu a').forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === hash);
    });
    // 关闭移动端菜单
    const menu = document.querySelector('.navbar-menu');
    if (menu) menu.classList.remove('open');
    // 渲染
    renderer();
    // 滚动到顶部
    window.scrollTo(0, 0);
  }

  // ============ 解析台（首页）============
  function renderHome() {
    const main = getMain();
    main.innerHTML = `
      <div class="workspace">
        <div class="panel input-panel">
          <div class="panel-title"><span class="icon">📝</span>题目输入</div>
          <div class="form-group">
            <label class="form-label">学科</label>
            <select id="subject-select" class="form-select">
              <option value="自动">自动识别</option>
              <option value="数学">数学</option>
              <option value="物理">物理</option>
              <option value="化学">化学</option>
              <option value="生物">生物</option>
              <option value="语文">语文</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">示例题（点击快速填入）</label>
            <div class="example-list" id="example-list"></div>
          </div>
          <div class="form-group">
            <label class="form-label">题目内容</label>
            <textarea id="question-input" class="form-textarea" placeholder="粘贴题目或手动输入，支持 $...$ 公式&#10;例如：求二次函数 $y = x^2 - 4x + 3$ 的顶点"></textarea>
            <div class="form-hint"><span id="char-count">0</span>/5000</div>
          </div>
          <div class="form-group">
            <label class="form-label">图片上传（开发中）</label>
            <div id="upload-area" style="border:2px dashed var(--color-border-strong);border-radius:var(--radius-sm);padding:20px;text-align:center;color:var(--color-text-muted);cursor:pointer;font-size:13px;">
              📷 点击或拖拽上传题目图片（5MB 内）
            </div>
            <input type="file" id="file-input" accept="image/*" style="display:none">
          </div>
          <button id="parse-btn" class="btn btn-primary btn-lg btn-block">
            <span id="parse-btn-text">🚀 AI 解析</span>
          </button>
          <p style="font-size:12px;color:var(--color-text-muted);margin-top:10px;text-align:center;">
            提示：按 <code style="background:var(--color-surface-alt);padding:2px 6px;border-radius:3px;">Ctrl/⌘ + Enter</code> 快速解析
          </p>
        </div>
        <div class="panel result-panel" id="result-panel">
          ${renderResultContent()}
        </div>
      </div>
    `;

    // 示例题
    const exList = document.getElementById('example-list');
    exList.innerHTML = EXAMPLES.map((e, i) =>
      `<div class="example-item" data-idx="${i}"><span class="emoji">${e.emoji}</span>${e.title}</div>`
    ).join('');
    exList.querySelectorAll('.example-item').forEach(el => {
      el.addEventListener('click', () => {
        const ex = EXAMPLES[parseInt(el.dataset.idx)];
        document.getElementById('question-input').value = ex.question;
        document.getElementById('subject-select').value = ex.subject;
        updateCharCount();
        Utils.toast('已填入示例题', 'success');
      });
    });

    // 字符计数
    const ta = document.getElementById('question-input');
    ta.addEventListener('input', updateCharCount);
    function updateCharCount() {
      const v = ta.value;
      if (v.length > 5000) { ta.value = v.slice(0, 5000); }
      document.getElementById('char-count').textContent = ta.value.length;
    }

    // 解析按钮
    document.getElementById('parse-btn').addEventListener('click', parse);

    // 快捷键
    ta.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        parse();
      }
    });

    // 上传占位
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.style.borderColor = 'var(--color-primary)'; });
    uploadArea.addEventListener('dragleave', () => { uploadArea.style.borderColor = 'var(--color-border-strong)'; });
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = 'var(--color-border-strong)';
      Utils.toast('图片识别功能开发中，请手动输入题目', 'success');
    });
    fileInput.addEventListener('change', () => {
      Utils.toast('图片识别功能开发中，请手动输入题目', 'success');
      fileInput.value = '';
    });
  }

  // ============ 讲解文本解析 ============
  // 将 explanation 文本解析为"步骤块"结构
  // 返回: [{ title: string, bodyLines: string[] }, ...]
  // 解析规则:
  //   1. 按空行(\n\n)分割为步骤块
  //   2. 每块首行若以"步骤X"或"X."等开头则作为标题, 其余为子内容
  //   3. 若整块无标题特征, 整块视为一个步骤(无标题, 全部为子内容)
  //   4. 兼容单行步骤(无空行分隔)的情况
  function _parseExplanation(text) {
    if (!text) return [];
    const raw = text.replace(/\r\n/g, '\n');
    // 优先按空行分块
    let blocks = raw.split(/\n\s*\n/).map(b => b.trim()).filter(b => b);
    // 若没有空行分隔(只有单行步骤), 则按行识别标题切分
    if (blocks.length === 1 && blocks[0].split('\n').length > 1) {
      const lines = blocks[0].split('\n').map(l => l.trim()).filter(l => l);
      // 检测是否含"步骤"标题行
      const hasStepTitle = lines.some(l => _isStepTitle(l));
      if (hasStepTitle) {
        blocks = [];
        let cur = null;
        for (const line of lines) {
          if (_isStepTitle(line)) {
            if (cur) blocks.push(cur);
            cur = { title: line, bodyLines: [] };
          } else {
            if (!cur) cur = { title: '', bodyLines: [] };
            cur.bodyLines.push(line);
          }
        }
        if (cur) blocks.push(cur);
        return blocks;
      }
    }
    // 常规: 每块首行若为标题则分离
    return blocks.map(block => {
      const lines = block.split('\n').map(l => l.trim()).filter(l => l);
      if (lines.length === 0) return { title: '', bodyLines: [] };
      if (_isStepTitle(lines[0])) {
        return { title: lines[0], bodyLines: lines.slice(1) };
      }
      return { title: '', bodyLines: lines };
    });
  }

  // 判断一行是否为步骤标题
  // 匹配: "步骤一：..." "步骤1：..." "第一步：..." "1." "1、" "(1)" 等
  function _isStepTitle(line) {
    if (!line) return false;
    // 步骤X / 第X步
    if (/^步骤[一二三四五六七八九十\d]+[：:．\.]?/.test(line)) return true;
    if (/^第[一二三四五六七八九十\d]+步[：:．\.]?/.test(line)) return true;
    // 数字序号开头: "1." "1、" "1)" "(1)" "1:" — 仅当后面跟文字(非纯公式)
    if (/^\(?\d+[)．.、:：]/.test(line)) {
      // 排除纯公式行(如 "$y = ...$")
      const rest = line.replace(/^\(?\d+[)．.、:：]\s*/, '');
      if (rest.startsWith('$')) return false;
      return true;
    }
    return false;
  }

  // 渲染讲解步骤: 主序号(数字)给步骤标题, 子内容用圆点
  function _renderExplanationSteps(steps) {
    if (!steps || steps.length === 0) return '<div style="color:var(--color-text-muted);">暂无讲解内容</div>';
    return steps.map((step, i) => {
      const num = i + 1;
      const titleHtml = step.title
        ? `<div class="step-title"><span class="step-num">${num}</span><span class="step-title-text">${Utils.renderMath(step.title)}</span></div>`
        : `<div class="step-title"><span class="step-num">${num}</span><span class="step-title-text">步骤 ${num}</span></div>`;
      const bodyHtml = step.bodyLines && step.bodyLines.length > 0
        ? `<div class="step-body">${step.bodyLines.map(line =>
            `<div class="step-body-line"><span class="step-bullet">•</span><span class="step-body-text">${Utils.renderMath(line)}</span></div>`
          ).join('')}</div>`
        : '';
      return `<div class="explanation-step-block">${titleHtml}${bodyHtml}</div>`;
    }).join('');
  }

  // ============ 结果区内容 ============
  function renderResultContent() {
    if (state.parseState === 'empty') {
      return `
        <div class="panel-title"><span class="icon">🎯</span>AI 解析结果</div>
        <div class="empty-state">
          <div class="emoji">📚</div>
          <h3>输入题目开始解析</h3>
          <p>AI 将自动生成讲解与配图<br>支持数学 / 物理 / 生物 / 语文多学科</p>
        </div>
      `;
    }
    if (state.parseState === 'loading') {
      return `
        <div class="panel-title"><span class="icon">🎯</span>AI 解析结果</div>
        <div class="skeleton-card">
          <div class="skeleton skeleton-line short"></div>
          <div class="skeleton skeleton-line long"></div>
        </div>
        <div class="skeleton-card">
          <div class="skeleton skeleton-line long"></div>
          <div class="skeleton skeleton-line long"></div>
          <div class="skeleton skeleton-line short"></div>
        </div>
        <div class="skeleton-card">
          <div class="skeleton skeleton-line short"></div>
          <div class="skeleton skeleton-line long"></div>
        </div>
      `;
    }
    if (state.parseState === 'error') {
      return `
        <div class="panel-title"><span class="icon">🎯</span>AI 解析结果</div>
        <div class="error-state">
          <div class="emoji">⚠️</div>
          <h3>解析失败</h3>
          <p style="color:var(--color-text-secondary);">${Utils.escapeHtml(state.error || '未知错误')}</p>
          <button class="btn btn-primary" style="margin-top:16px;" onclick="App.retry()">重试</button>
        </div>
      `;
    }
    // done
    const r = state.parsedResult;
    if (!r) return '';
    const subject = r.subject || '自动';
    const steps = _parseExplanation(r.explanation || '');
    return `
      <div class="panel-title">
        <span class="icon">🎯</span>AI 解析结果
        ${Utils.subjectBadge(subject)}
        <span class="badge badge-primary" style="margin-left:auto;">${Store.getSettings().model || 'gpt-4o-mini'}</span>
      </div>
      <div class="card" id="card-question">
        <div class="card-header" onclick="this.parentElement.classList.toggle('collapsed')">
          <h3>📖 题目重述</h3>
          <span class="toggle">▼</span>
        </div>
        <div class="card-body">
          <div>${Utils.renderMath(r.question || '')}</div>
        </div>
      </div>
      <div class="card" id="card-explanation">
        <div class="card-header" onclick="this.parentElement.classList.toggle('collapsed')">
          <h3>💡 分步讲解</h3>
          <span class="toggle">▼</span>
        </div>
        <div class="card-body" id="explanation-body">
          ${_renderExplanationSteps(steps)}
        </div>
      </div>
      <div class="card" id="card-summary">
        <div class="card-header" onclick="this.parentElement.classList.toggle('collapsed')">
          <h3>📌 知识总结</h3>
          <span class="toggle">▼</span>
        </div>
        <div class="card-body">
          <div>${Utils.renderMath(r.summary || '')}</div>
        </div>
      </div>
      <div class="graph-card" id="graph-card">
        <div class="graph-card-header">
          <h3>🎨 题目配图</h3>
          <div>
            <button class="btn btn-sm" id="btn-view-params">查看参数</button>
            <button class="btn btn-sm btn-primary" id="btn-export-png">导出 PNG</button>
          </div>
        </div>
        <div class="graph-canvas-wrapper">
          <canvas id="graph-canvas" width="800" height="600"></canvas>
        </div>
      </div>
    `;
  }

  // ============ 解析主流程 ============
  function parse() {
    const ta = document.getElementById('question-input');
    if (!ta) return;
    const question = ta.value.trim();
    if (!question) {
      Utils.toast('请输入题目', 'error');
      return;
    }
    if (!Store.hasApiKey()) {
      Utils.toast('请先到设置页填写 API Key', 'error');
      setTimeout(() => { location.hash = '#/settings'; }, 800);
      return;
    }
    const subject = document.getElementById('subject-select').value;
    _doParse(question, subject);
  }

  function _doParse(question, subject) {
    const btn = document.getElementById('parse-btn');
    const btnText = document.getElementById('parse-btn-text');
    if (btn) { btn.disabled = true; }
    if (btnText) { btnText.innerHTML = '<span class="spinner"></span> 解析中<span class="loading-dots"></span>'; }

    state.parseState = 'loading';
    state.parseBuffer = '';
    state.parsedResult = null;
    state.error = null;
    _updateResult();

    const messages = [
      { role: 'system', content: Prompt.SYSTEM_PROMPT },
      { role: 'user', content: Prompt.buildUserMessage(question, subject) },
    ];

    API.callAI({
      messages,
      onChunk: (chunk, full) => {
        state.parseBuffer = full;
        // 流式过程中尝试提取讲解字段实时展示
        _streamRender();
      },
      onDone: (full) => {
        state.parseBuffer = full;
        const parsed = Parser.tryParseJSON(full);
        if (parsed && parsed.explanation) {
          _finalizeParse(parsed, question, subject);
        } else {
          // 降级：JSON 解析失败，用提取的文本构造
          const fallback = {
            subject: Parser.tryExtractSubject(full) || subject,
            question: Parser.tryExtractQuestion(full) || question,
            explanation: Parser.tryExtractExplanation(full) || '解析完成，但格式异常。以下是原始输出：\n' + full.slice(0, 500),
            summary: Parser.tryExtractSummary(full) || '',
            graph: { graphType: 'none', graphParams: {} },
          };
          _finalizeParse(fallback, question, subject);
          Utils.toast('JSON 解析异常，已降级展示', 'error');
        }
      },
      onError: (msg) => {
        state.parseState = 'error';
        state.error = msg;
        _updateResult();
        _resetBtn();
      },
    });
  }

  // 流式渲染（节流）
  let _streamTimer = null;
  function _streamRender() {
    if (_streamTimer) return;
    _streamTimer = setTimeout(() => {
      _streamTimer = null;
      const full = state.parseBuffer;
      const subject = Parser.tryExtractSubject(full);
      const question = Parser.tryExtractQuestion(full);
      const explanation = Parser.tryExtractExplanation(full);
      if (!explanation) return; // 还没到 explanation 字段
      // 切换为 done 态展示
      state.parseState = 'done';
      state.parsedResult = {
        subject: subject || '自动',
        question: question || '',
        explanation: explanation,
        summary: '',
        graph: { graphType: 'none', graphParams: {} },
      };
      _updateResult();
    }, 200);
  }

  function _finalizeParse(parsed, question, subject) {
    state.parseState = 'done';
    const graph = Parser.validateGraph(parsed.graph);
    state.parsedResult = {
      subject: parsed.subject || subject || '自动',
      question: parsed.question || question,
      explanation: parsed.explanation || '',
      summary: parsed.summary || '',
      graph: graph,
    };
    _updateResult();
    _renderGraphCanvas();
    _resetBtn();
    // 保存历史
    Store.saveHistory({
      question: question,
      subject: state.parsedResult.subject,
      result: state.parsedResult,
    });
    Utils.toast('解析完成', 'success');
  }

  function _resetBtn() {
    const btn = document.getElementById('parse-btn');
    const btnText = document.getElementById('parse-btn-text');
    if (btn) btn.disabled = false;
    if (btnText) btnText.textContent = '🚀 AI 解析';
  }

  function _updateResult() {
    const panel = document.getElementById('result-panel');
    if (panel) panel.innerHTML = renderResultContent();
  }

  // ============ 配图渲染 ============
  function _renderGraphCanvas() {
    const r = state.parsedResult;
    if (!r || !r.graph) return;
    const canvas = document.getElementById('graph-canvas');
    if (!canvas) return;
    const graphCard = document.getElementById('graph-card');
    if (r.graph.graphType === 'none') {
      if (graphCard) graphCard.style.display = 'none';
      return;
    }
    if (graphCard) graphCard.style.display = '';
    // 根据 graphType 设置 canvas 尺寸
    const sizes = {
      quadratic: [800, 600],
      forceDiagram: [900, 650],
      geneticDiagram: [1000, 820],
      essayStructure: [1200, 760],
      ecosystemDiagram: [1000, 700],
    };
    const [w, h] = sizes[r.graph.graphType] || [800, 600];
    canvas.width = w;
    canvas.height = h;
    const status = GraphRegistry.renderGraph(r.graph.graphType, r.graph.graphParams, canvas);
    if (status !== 'ok') {
      Utils.toast('配图渲染：' + status, 'error');
    }
    // 绑定导出与查看参数
    const btnExport = document.getElementById('btn-export-png');
    if (btnExport) btnExport.onclick = () => GraphRegistry.exportPNG(canvas, r.graph.graphType + '.png');
    const btnView = document.getElementById('btn-view-params');
    if (btnView) btnView.onclick = () => _showParamsModal(r.graph);
  }

  function _showParamsModal(graph) {
    let modal = document.getElementById('modal-overlay');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-overlay';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3>配图参数 JSON</h3>
          <button class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <pre>${Utils.escapeHtml(JSON.stringify(graph, null, 2))}</pre>
          <div style="margin-top:12px;text-align:right;">
            <button class="btn btn-sm" id="btn-copy-params">复制</button>
          </div>
        </div>
      </div>
    `;
    modal.classList.add('open');
    modal.querySelector('.modal-close').onclick = () => modal.classList.remove('open');
    modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('open'); };
    document.getElementById('btn-copy-params').onclick = () => {
      Utils.copyToClipboard(JSON.stringify(graph, null, 2)).then(() => Utils.toast('已复制', 'success'));
    };
  }

  function retry() {
    const ta = document.getElementById('question-input');
    if (ta && ta.value.trim()) parse();
  }

  // ============ 历史记录页 ============
  function renderHistory() {
    const main = getMain();
    const list = Store.getHistory();
    main.innerHTML = `
      <div class="page-container">
        <div class="panel">
          <div class="panel-title">
            <span class="icon">📋</span>历史记录
            <span class="badge badge-primary" style="margin-left:auto;">${list.length} / ${Store.MAX_HISTORY}</span>
          </div>
          ${list.length === 0 ? `
            <div class="empty-state">
              <div class="emoji">🗂️</div>
              <h3>暂无历史记录</h3>
              <p>解析过的题目会自动保存在这里</p>
              <button class="btn btn-primary" style="margin-top:16px;" id="btn-load-demo">📥 加载演示数据</button>
            </div>
          ` : `
            <div class="toolbar">
              <input type="text" id="history-search" class="form-input" placeholder="🔍 搜索题目..." style="flex:1;">
              <button class="btn btn-ghost" id="btn-load-demo-top" title="重新加载演示数据">📥 演示数据</button>
              <button class="btn btn-ghost" id="btn-clear-history" style="color:var(--color-error);">清空</button>
            </div>
            <div id="history-list"></div>
          `}
        </div>
      </div>
    `;
    // 绑定"加载演示数据"按钮（空状态与非空状态都有）
    const btnLoadDemo = document.getElementById('btn-load-demo') || document.getElementById('btn-load-demo-top');
    if (btnLoadDemo) {
      btnLoadDemo.onclick = () => {
        if (window.DemoData) {
          DemoData.reinject();
          Utils.toast('已加载 ' + DemoData.DEMO_HISTORY.length + ' 条演示数据', 'success');
          renderHistory();
        }
      };
    }
    if (list.length === 0) return;
    const listEl = document.getElementById('history-list');
    function renderList(filter) {
      const filtered = filter
        ? list.filter(it => (it.question || '').includes(filter) || (it.subject || '').includes(filter))
        : list;
      listEl.innerHTML = filtered.length === 0 ? '<div class="empty-state"><p>无匹配记录</p></div>' :
        filtered.map(it => `
          <div class="history-item" data-id="${it.id}">
            <div class="history-item-header">
              ${Utils.subjectBadge(it.subject || '自动')}
              <span class="history-item-time">${Utils.formatTime(it.createdAt)}</span>
            </div>
            <div class="history-item-question">${Utils.escapeHtml((it.question || '').slice(0, 80))}</div>
          </div>
        `).join('');
      listEl.querySelectorAll('.history-item').forEach(el => {
        el.addEventListener('click', () => {
          const id = el.dataset.id;
          const item = list.find(x => x.id === id);
          if (item) {
            // 跳转解析台并预填
            location.hash = '#/';
            setTimeout(() => {
              const ta = document.getElementById('question-input');
              const sub = document.getElementById('subject-select');
              if (ta) ta.value = item.question;
              if (sub) sub.value = item.subject || '自动';
              const cc = document.getElementById('char-count');
              if (cc) cc.textContent = item.question.length;
              // 恢复结果
              state.parseState = 'done';
              state.parsedResult = item.result;
              _updateResult();
              _renderGraphCanvas();
            }, 100);
          }
        });
      });
    }
    renderList();
    const search = document.getElementById('history-search');
    if (search) search.addEventListener('input', () => renderList(search.value.trim()));
    const btnClear = document.getElementById('btn-clear-history');
    if (btnClear) btnClear.addEventListener('click', () => {
      if (confirm('确定清空所有历史记录？')) {
        Store.clearHistory();
        renderHistory();
        Utils.toast('已清空', 'success');
      }
    });
  }

  // ============ 配图示例页 ============
  function renderGallery() {
    const main = getMain();
    main.innerHTML = `
      <div class="page-container">
        <div class="panel">
          <div class="panel-title"><span class="icon">🎨</span>配图示例</div>
          <p style="color:var(--color-text-secondary);font-size:13px;margin-bottom:var(--space-md);">
            已实现的 4 类学科配图。无需 API Key 即可预览效果，点击"试这道题"可跳转解析台。
          </p>
          <div class="gallery-grid" id="gallery-grid"></div>
        </div>
      </div>
    `;
    const grid = document.getElementById('gallery-grid');
    grid.innerHTML = GALLERY_DEMOS.map((d, i) => `
      <div class="gallery-card">
        <div class="gallery-card-canvas">
          <canvas id="gallery-canvas-${i}" width="600" height="400"></canvas>
        </div>
        <div class="gallery-card-info">
          <h3>${Utils.subjectBadge(d.subject)} ${d.title}</h3>
          <p>${d.desc}</p>
          <button class="btn btn-sm btn-primary" data-idx="${i}">试这道题 →</button>
        </div>
      </div>
    `).join('');
    // 渲染每个 canvas
    GALLERY_DEMOS.forEach((d, i) => {
      const canvas = document.getElementById('gallery-canvas-' + i);
      if (!canvas) return;
      const sizes = { quadratic: [600, 450], forceDiagram: [600, 440], geneticDiagram: [600, 490], essayStructure: [600, 380], ecosystemDiagram: [600, 420] };
      const [w, h] = sizes[d.type] || [600, 400];
      canvas.width = w; canvas.height = h;
      GraphRegistry.renderGraph(d.type, d.params, canvas);
    });
    // 绑定试这道题
    grid.querySelectorAll('button[data-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        const d = GALLERY_DEMOS[parseInt(btn.dataset.idx)];
        location.hash = '#/';
        setTimeout(() => {
          const ta = document.getElementById('question-input');
          const sub = document.getElementById('subject-select');
          if (ta) ta.value = d.question;
          if (sub) sub.value = d.subject;
          const cc = document.getElementById('char-count');
          if (cc) cc.textContent = d.question.length;
          Utils.toast('已填入示例题，点击"AI 解析"体验完整流程', 'success');
        }, 100);
      });
    });
  }

  // ============ 设置页 ============
  function renderSettings() {
    const main = getMain();
    const s = Store.getSettings();
    main.innerHTML = `
      <div class="page-container">
        <div class="panel">
          <div class="panel-title"><span class="icon">⚙️</span>设置</div>
          <div class="settings-form">
            <div class="form-group">
              <label class="form-label">模型</label>
              <div class="input-with-action">
                <select id="set-model" class="form-select"></select>
                <button class="btn" id="btn-add-model" type="button" title="添加自定义模型">➕ 添加</button>
              </div>
              <div class="form-hint" style="text-align:left;" id="model-hint">选择模型后会自动填充对应的 Base URL</div>
            </div>
            <div class="form-group">
              <label class="form-label">API Key</label>
              <div class="input-with-action">
                <input type="password" id="set-apikey" class="form-input" value="${Utils.escapeHtml(s.apiKey)}" placeholder="sk-...">
                <button class="btn" id="toggle-key" type="button">👁</button>
              </div>
              <div class="form-hint" style="text-align:left;">仅保存在本地 localStorage，不会上传服务器</div>
            </div>
            <div class="form-group">
              <label class="form-label">Base URL</label>
              <input type="text" id="set-baseurl" class="form-input" value="${Utils.escapeHtml(s.baseUrl)}" placeholder="https://api.openai.com/v1">
              <div class="form-hint" style="text-align:left;">OpenAI 兼容接口地址。选择模型时自动填充，也可手动修改</div>
            </div>
            <div class="form-group">
              <label class="form-label">主题</label>
              <div>
                <label style="margin-right:16px;cursor:pointer;">
                  <input type="radio" name="theme" value="light" ${s.theme === 'light' ? 'checked' : ''}> 浅色
                </label>
                <label style="cursor:pointer;">
                  <input type="radio" name="theme" value="dark" ${s.theme === 'dark' ? 'checked' : ''}> 深色
                </label>
              </div>
            </div>
            <div class="toolbar" style="margin-top:var(--space-lg);">
              <button class="btn btn-primary" id="btn-save-settings">💾 保存</button>
              <button class="btn" id="btn-test-connection">🔌 测试连接</button>
              <span id="test-result" style="font-size:13px;"></span>
            </div>

            <div style="margin-top:var(--space-lg);">
              <h4 style="color:var(--color-text);margin-bottom:8px;font-size:14px;">📋 我的模型</h4>
              <div id="custom-model-list" style="font-size:13px;"></div>
            </div>

            <div style="margin-top:var(--space-lg);padding:var(--space-md);background:var(--color-surface-alt);border-radius:var(--radius-sm);font-size:13px;color:var(--color-text-secondary);">
              <h4 style="color:var(--color-text);margin-bottom:8px;">📖 使用说明</h4>
              <ul style="padding-left:20px;line-height:1.8;">
                <li>本工具为纯前端原型，所有数据仅保存在浏览器本地</li>
                <li>支持 OpenAI 兼容接口（OpenAI / 智谱 / 通义 / DeepSeek 等）</li>
                <li>选择模型会自动填充 Base URL；自定义模型点"➕ 添加"</li>
                <li>智谱 AI 申请：<a href="https://open.bigmodel.cn" target="_blank">open.bigmodel.cn</a>，Base URL 填 <code>https://open.bigmodel.cn/api/paas/v4</code></li>
                <li>通义千问：<a href="https://dashscope.console.aliyun.com" target="_blank">dashscope.console.aliyun.com</a></li>
                <li>调用失败多为 CORS 限制，建议使用支持跨域的厂商</li>
                <li>历史记录最多保存 ${Store.MAX_HISTORY} 条</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    `;

    // 渲染模型下拉
    _renderModelSelect(s.model);

    // 模型切换时自动填充 Base URL
    document.getElementById('set-model').addEventListener('change', (e) => {
      const m = Store.findModel(e.target.value);
      if (m && m.baseUrl) {
        document.getElementById('set-baseurl').value = m.baseUrl;
        const hint = document.getElementById('model-hint');
        if (hint) hint.innerHTML = `<span style="color:var(--color-success);">已自动填充 ${Utils.escapeHtml(m.provider)} 的 Base URL</span>`;
      }
    });

    // 显示/隐藏 Key
    document.getElementById('toggle-key').onclick = () => {
      const inp = document.getElementById('set-apikey');
      inp.type = inp.type === 'password' ? 'text' : 'password';
    };

    // 主题切换即时预览
    document.querySelectorAll('input[name="theme"]').forEach(r => {
      r.addEventListener('change', () => applyTheme(r.value));
    });

    // 添加自定义模型
    document.getElementById('btn-add-model').onclick = _showAddModelModal;

    // 渲染自定义模型列表
    _renderCustomModelList();

    // 保存
    document.getElementById('btn-save-settings').onclick = () => {
      const newS = {
        apiKey: document.getElementById('set-apikey').value,
        baseUrl: document.getElementById('set-baseurl').value,
        model: document.getElementById('set-model').value,
        theme: document.querySelector('input[name="theme"]:checked').value,
      };
      Store.saveSettings(newS);
      applyTheme(newS.theme);
      Utils.toast('设置已保存', 'success');
    };

    // 测试连接
    document.getElementById('btn-test-connection').onclick = async () => {
      Store.saveSettings({
        apiKey: document.getElementById('set-apikey').value,
        baseUrl: document.getElementById('set-baseurl').value,
        model: document.getElementById('set-model').value,
      });
      const result = document.getElementById('test-result');
      result.textContent = '测试中...';
      result.style.color = 'var(--color-text-muted)';
      const r = await API.testConnection();
      result.textContent = r.msg;
      result.style.color = r.ok ? 'var(--color-success)' : 'var(--color-error)';
    };
  }

  // 渲染模型下拉：按厂商分组
  function _renderModelSelect(selectedValue) {
    const sel = document.getElementById('set-model');
    if (!sel) return;
    const all = Store.getAllModels();
    // 按厂商分组
    const groups = {};
    all.forEach(m => {
      const k = m.provider || '其他';
      if (!groups[k]) groups[k] = [];
      groups[k].push(m);
    });
    let html = '';
    Object.keys(groups).forEach(provider => {
      html += `<optgroup label="${Utils.escapeHtml(provider)}">`;
      groups[provider].forEach(m => {
        const isSel = (m.value === selectedValue) ? 'selected' : '';
        const note = m.note ? `（${m.note}）` : '';
        const tag = m.custom ? ' [自定义]' : '';
        html += `<option value="${Utils.escapeHtml(m.value)}" ${isSel}>${Utils.escapeHtml(m.label)}${note}${tag}</option>`;
      });
      html += '</optgroup>';
    });
    sel.innerHTML = html;
    // 如果当前选中值不在列表中，追加一个
    if (selectedValue && !Store.findModel(selectedValue)) {
      sel.innerHTML = `<option value="${Utils.escapeHtml(selectedValue)}" selected>${Utils.escapeHtml(selectedValue)}（未保存）</option>` + sel.innerHTML;
    }
  }

  // 渲染自定义模型列表
  function _renderCustomModelList() {
    const wrap = document.getElementById('custom-model-list');
    if (!wrap) return;
    const list = Store.getCustomModels();
    if (list.length === 0) {
      wrap.innerHTML = '<div style="color:var(--color-text-muted);padding:8px 0;">暂无自定义模型，点击上方"➕ 添加"创建</div>';
      return;
    }
    wrap.innerHTML = list.map(m => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--color-surface-alt);border-radius:var(--radius-sm);margin-bottom:6px;">
        <div>
          <strong>${Utils.escapeHtml(m.label)}</strong>
          <span class="badge badge-primary" style="margin-left:6px;">${Utils.escapeHtml(m.provider)}</span>
          ${m.note ? `<span style="color:var(--color-text-muted);margin-left:6px;">${Utils.escapeHtml(m.note)}</span>` : ''}
          <div style="font-size:11px;color:var(--color-text-muted);margin-top:2px;">${Utils.escapeHtml(m.baseUrl)}</div>
        </div>
        <button class="btn btn-sm btn-ghost" data-del="${Utils.escapeHtml(m.value)}" style="color:var(--color-error);">删除</button>
      </div>
    `).join('');
    wrap.querySelectorAll('button[data-del]').forEach(btn => {
      btn.onclick = () => {
        if (!confirm('确定删除该自定义模型？')) return;
        Store.deleteCustomModel(btn.dataset.del);
        // 如果当前选中的是被删除的，重置为默认
        const cur = document.getElementById('set-model').value;
        if (cur === btn.dataset.del) {
          Store.saveSettings({ model: 'gpt-4o-mini' });
        }
        _renderModelSelect(document.getElementById('set-model').value);
        _renderCustomModelList();
        Utils.toast('已删除', 'success');
      };
    });
  }

  // 添加自定义模型 Modal
  function _showAddModelModal() {
    let modal = document.getElementById('modal-overlay');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-overlay';
      modal.className = 'modal-overlay';
      document.body.appendChild(modal);
    }
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3>➕ 添加自定义模型</h3>
          <button class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <p style="color:var(--color-text-secondary);margin-bottom:16px;font-size:13px;">
            填写模型信息。要求：兼容 OpenAI Chat Completions 接口格式（<code>/chat/completions</code>）。
          </p>
          <div class="form-group">
            <label class="form-label">模型 ID <span style="color:var(--color-error);">*</span></label>
            <input type="text" id="cm-value" class="form-input" placeholder="例如：moonshot-v1-8k">
            <div class="form-hint" style="text-align:left;">调用接口时传的 model 参数值</div>
          </div>
          <div class="form-group">
            <label class="form-label">显示名称</label>
            <input type="text" id="cm-label" class="form-input" placeholder="例如：月之暗面 8K（留空则用模型 ID）">
          </div>
          <div class="form-group">
            <label class="form-label">厂商</label>
            <input type="text" id="cm-provider" class="form-input" placeholder="例如：月之暗面 / 自定义" value="自定义">
          </div>
          <div class="form-group">
            <label class="form-label">Base URL <span style="color:var(--color-error);">*</span></label>
            <input type="text" id="cm-baseurl" class="form-input" placeholder="https://api.moonshot.cn/v1">
            <div class="form-hint" style="text-align:left;">OpenAI 兼容接口地址，无需加 /chat/completions 后缀</div>
          </div>
          <div class="form-group">
            <label class="form-label">备注</label>
            <input type="text" id="cm-note" class="form-input" placeholder="可选，如价格、特点说明">
          </div>
          <div class="toolbar" style="margin-top:var(--space-lg);justify-content:flex-end;">
            <button class="btn" id="cm-cancel">取消</button>
            <button class="btn btn-primary" id="cm-save">💾 保存</button>
          </div>
        </div>
      </div>
    `;
    modal.classList.add('open');
    const close = () => modal.classList.remove('open');
    modal.querySelector('.modal-close').onclick = close;
    modal.onclick = (e) => { if (e.target === modal) close(); };
    document.getElementById('cm-cancel').onclick = close;
    document.getElementById('cm-save').onclick = () => {
      const value = document.getElementById('cm-value').value.trim();
      const baseUrl = document.getElementById('cm-baseurl').value.trim();
      if (!value) { Utils.toast('请填写模型 ID', 'error'); return; }
      if (!baseUrl) { Utils.toast('请填写 Base URL', 'error'); return; }
      const ok = Store.addCustomModel({
        value: value,
        label: document.getElementById('cm-label').value.trim(),
        provider: document.getElementById('cm-provider').value.trim() || '自定义',
        baseUrl: baseUrl,
        note: document.getElementById('cm-note').value.trim(),
      });
      if (!ok) {
        Utils.toast('该模型 ID 已存在', 'error');
        return;
      }
      Utils.toast('已添加自定义模型', 'success');
      close();
      _renderModelSelect(document.getElementById('set-model').value);
      _renderCustomModelList();
      // 自动选中新添加的模型
      document.getElementById('set-model').value = value;
      document.getElementById('set-baseurl').value = baseUrl.replace(/\/$/, '');
      const hint = document.getElementById('model-hint');
      if (hint) hint.innerHTML = `<span style="color:var(--color-success);">已选中新添加的模型并填充 Base URL</span>`;
    };
  }

  // ============ 主题 ============
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  // ============ 首次访问引导 ============
  function showGuide() {
    if (!Store.isFirstVisit()) return;
    const overlay = document.createElement('div');
    overlay.className = 'guide-overlay open';
    overlay.innerHTML = `
      <div class="guide-card">
        <div class="emoji">👋</div>
        <h3>欢迎使用 EduGraph AI</h3>
        <p>AI 试题解析与智能配图工具</p>
        <div class="steps">
          <div class="step"><div class="num">1</div><div>输入题目（或点击示例题快选）</div></div>
          <div class="step"><div class="num">2</div><div>到「设置」页填写 API Key</div></div>
          <div class="step"><div class="num">3</div><div>点击「AI 解析」，自动生成讲解与配图</div></div>
        </div>
        <div class="toolbar">
          <a href="#/gallery" class="btn btn-ghost" id="guide-gallery">先看示例</a>
          <button class="btn btn-primary" id="guide-start">开始使用</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('guide-start').onclick = () => {
      Store.markVisited();
      overlay.remove();
    };
    document.getElementById('guide-gallery').onclick = () => {
      Store.markVisited();
      overlay.remove();
    };
  }

  // ============ 移动端菜单 ============
  function bindNavbar() {
    const toggle = document.querySelector('.navbar-toggle');
    const menu = document.querySelector('.navbar-menu');
    if (toggle && menu) {
      toggle.addEventListener('click', () => menu.classList.toggle('open'));
    }
  }

  // ============ 初始化 ============
  function init() {
    // 注册渲染器
    GraphRegistry.registerGraphType('quadratic', window.QuadraticRenderer);
    GraphRegistry.registerGraphType('forceDiagram', window.ForceDiagramRenderer);
    GraphRegistry.registerGraphType('geneticDiagram', window.GeneticDiagramRenderer);
    GraphRegistry.registerGraphType('essayStructure', window.EssayStructureRenderer);
    GraphRegistry.registerGraphType('ecosystemDiagram', window.EcosystemDiagramRenderer);

    // 注入演示历史数据（首次或无演示数据时）
    if (window.DemoData) {
      const injected = DemoData.injectIfNeeded();
      if (injected) console.log('[EduGraph] 已注入演示历史数据');
    }

    // 应用主题
    applyTheme(Store.getSettings().theme);

    // 绑定导航
    bindNavbar();

    // 路由
    window.addEventListener('hashchange', handleRoute);
    handleRoute();

    // 首次访问引导
    setTimeout(showGuide, 300);
  }

  return {
    init, parse, retry,
    EXAMPLES, GALLERY_DEMOS,
  };
})();

// 启动
document.addEventListener('DOMContentLoaded', App.init);
