class App {
  constructor(domainId) {
    this.domainId = domainId || 'python';
    this.domain = DOMAINS[this.domainId];
    this.nodes = this.domain.nodes;
    this.progress = {};
    this.currentNodeId = null;
    this.currentMode = 'standard';
    this.rescueAttempts = {};
    this.hasSeenAiWelcome = false;
    this.nodePositions = {};
    this.initProgress();
    this.calcNodePositions();
  }

  initProgress() {
    this.nodes.forEach(n => {
      this.progress[n.id] = 'locked';
      this.rescueAttempts[n.id] = 0;
    });
    // Unlock first node (no prerequisites)
    const first = this.nodes.find(n => n.prerequisites.length === 0);
    if (first) this.progress[first.id] = 'unlocked';
  }

  calcNodePositions() {
    // Group nodes by difficulty
    const layers = {};
    let maxDiff = 0;
    this.nodes.forEach(n => {
      const d = n.difficulty;
      if (d > maxDiff) maxDiff = d;
      if (!layers[d]) layers[d] = [];
      layers[d].push(n.id);
    });

    const layerHeight = 120;
    const startY = 80;
    this.nodePositions = {};

    for (let d = 1; d <= maxDiff; d++) {
      const layer = layers[d] || [];
      const count = layer.length;
      const spacing = 1000 / (count + 1);
      const y = startY + (d - 1) * layerHeight;
      layer.forEach((id, i) => {
        this.nodePositions[id] = {
          x: spacing * (i + 1),
          y: y
        };
      });
    }

    // Adjust SVG viewBox height based on layers
    const svgHeight = startY + (maxDiff - 1) * layerHeight + 100;
    const svg = document.getElementById('map-svg');
    if (svg) {
      svg.setAttribute('viewBox', `0 0 1000 ${svgHeight}`);
      svg.setAttribute('height', svgHeight);
    }
  }

  /* ===== NAVIGATION ===== */
  showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-' + id).classList.add('active');
    window.scrollTo(0, 0);
  }

  goHome() { this.showScreen('home'); }
  goMap() { this.showScreen('map'); this.renderMap(); }

  enterDomain(domainId) {
    if (domainId && domainId !== this.domainId) {
      this.domainId = domainId;
      this.domain = DOMAINS[domainId];
      this.nodes = this.domain.nodes;
      this.initProgress();
      this.calcNodePositions();
      this.hasSeenAiWelcome = false;
    }
    // Update header titles
    const mapTitle = document.getElementById('map-header-title');
    if (mapTitle) mapTitle.textContent = this.domain.name + ' - 知识地图';
    const summaryTitle = document.getElementById('summary-title');
    if (summaryTitle) summaryTitle.textContent = '你的 ' + this.domain.name + ' 知识图谱';

    this.showScreen('map');
    this.renderMap();
    if (!this.hasSeenAiWelcome) {
      this.hasSeenAiWelcome = true;
      setTimeout(() => this.showAiWelcome(), 600);
    }
  }

  /* ===== MAP ===== */
  renderMap() {
    const svg = document.getElementById('map-svg');
    svg.innerHTML = '';
    const ns = 'http://www.w3.org/2000/svg';

    // Draw connections first (behind nodes)
    this.nodes.forEach(node => {
      node.prerequisites.forEach(preId => {
        const from = this.nodePositions[preId];
        const to = this.nodePositions[node.id];
        if (!from || !to) return;
        const line = document.createElementNS(ns, 'line');
        line.setAttribute('x1', from.x);
        line.setAttribute('y1', from.y + 28);
        line.setAttribute('x2', to.x);
        line.setAttribute('y2', to.y - 28);
        const preStatus = this.progress[preId];
        const nodeStatus = this.progress[node.id];
        const isActive = preStatus === 'mastered' || preStatus === 'review';
        line.setAttribute('stroke', isActive ? '#a0aec0' : '#e2e8f0');
        line.setAttribute('stroke-width', isActive ? '2' : '1.5');
        line.setAttribute('stroke-dasharray', isActive ? '' : '5,5');
        svg.appendChild(line);
      });
    });

    // Draw nodes
    this.nodes.forEach(node => {
      const pos = this.nodePositions[node.id];
      const status = this.progress[node.id];
      const g = document.createElementNS(ns, 'g');
      g.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);
      g.style.cursor = (status !== 'locked') ? 'pointer' : 'not-allowed';
      g.onclick = () => {
        if (status !== 'locked') this.openNode(node.id);
        else this.showToast('需先完成前置知识点');
      };

      // Circle
      const circle = document.createElementNS(ns, 'circle');
      circle.setAttribute('r', '28');
      circle.setAttribute('stroke-width', '3');
      if (status === 'mastered') {
        circle.setAttribute('fill', '#48bb78');
        circle.setAttribute('stroke', '#38a169');
      } else if (status === 'review') {
        circle.setAttribute('fill', '#ecc94b');
        circle.setAttribute('stroke', '#d69e2e');
      } else if (status === 'unlocked') {
        circle.setAttribute('fill', '#ffffff');
        circle.setAttribute('stroke', '#3182ce');
      } else {
        circle.setAttribute('fill', '#f7fafc');
        circle.setAttribute('stroke', '#cbd5e0');
        circle.setAttribute('stroke-dasharray', '4,4');
      }
      if (this.currentNodeId === node.id) {
        circle.setAttribute('stroke', '#3182ce');
        circle.setAttribute('stroke-width', '4');
        const anim = document.createElementNS(ns, 'animate');
        anim.setAttribute('attributeName', 'r');
        anim.setAttribute('values', '28;31;28');
        anim.setAttribute('dur', '2s');
        anim.setAttribute('repeatCount', 'indefinite');
        circle.appendChild(anim);
      }
      g.appendChild(circle);

      // Icon / number
      const text = document.createElementNS(ns, 'text');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dy', '5');
      text.setAttribute('font-size', '13');
      text.setAttribute('font-weight', '700');
      text.setAttribute('fill', (status === 'mastered' || status === 'review') ? '#fff' : (status === 'locked' ? '#a0aec0' : '#2d3748'));
      text.textContent = this.nodeNumber(node.id);
      g.appendChild(text);

      // Label
      const label = document.createElementNS(ns, 'text');
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('y', '48');
      label.setAttribute('font-size', '11');
      label.setAttribute('fill', status === 'locked' ? '#a0aec0' : '#4a5568');
      label.textContent = node.title;
      g.appendChild(label);

      svg.appendChild(g);
    });
  }

  nodeNumber(id) {
    // Extract number from id like 'py-01' or 'psy-01'
    const match = id.match(/-(\d+)$/);
    return match ? match[1] : id;
  }

  /* ===== LEARNING ===== */
  openNode(nodeId) {
    this.currentNodeId = nodeId;
    this.currentMode = 'standard';
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) return;

    document.getElementById('learn-title').textContent = node.title;
    const stars = '★'.repeat(node.difficulty) + '☆'.repeat(5 - node.difficulty);
    document.getElementById('learn-difficulty').textContent = `难度：${stars}`;
    this.renderLearnContent();

    const res = document.getElementById('learn-resource');
    res.textContent = '外部学习资源：' + node.resource.title;
    res.href = node.resource.url;

    // Mode toggle visibility
    const hasSimple = !!node.content_simple;
    document.getElementById('mode-toggle').style.display = hasSimple ? 'inline-flex' : 'none';
    document.querySelectorAll('#mode-toggle button').forEach(b => b.classList.remove('active'));
    document.querySelector('#mode-toggle button:first-child').classList.add('active');

    this.showScreen('learn');
  }

  renderLearnContent() {
    const node = this.nodes.find(n => n.id === this.currentNodeId);
    if (!node) return;
    const text = this.currentMode === 'simple' && node.content_simple ? node.content_simple : node.content;
    document.getElementById('learn-content').innerHTML = this.escapeHtml(text).replace(/`([^`]+)`/g, '<code>$1</code>');
  }

  setMode(mode) {
    this.currentMode = mode;
    document.querySelectorAll('#mode-toggle button').forEach(b => b.classList.remove('active'));
    document.querySelector('#mode-toggle button:nth-child(' + (mode === 'standard' ? 1 : 2) + ')').classList.add('active');
    this.renderLearnContent();
  }

  finishLearning() {
    const node = this.nodes.find(n => n.id === this.currentNodeId);
    if (!node) return;
    // 如果该知识点有客观测试题，先进行知识小测
    if (node.quiz && node.quiz.question && node.quiz.options && node.quiz.options.length > 0) {
      this.showKnowledgeTest(node);
    } else {
      this.showSelfAssessment();
    }
  }

  showKnowledgeTest(node) {
    const q = node.quiz;
    document.getElementById('test-question').textContent = q.question;
    const container = document.getElementById('test-options');
    container.innerHTML = '';
    const feedback = document.getElementById('test-feedback');
    feedback.style.display = 'none';
    feedback.textContent = '';
    const nextBtn = document.getElementById('test-next-btn');
    nextBtn.style.display = 'none';
    nextBtn.textContent = '继续自评';
    nextBtn.onclick = () => this.handleTestNext();

    q.options.forEach((text, i) => {
      const div = document.createElement('div');
      div.className = 'quiz-option';
      div.id = 'test-opt-' + i;
      div.innerHTML = `<div class="opt-label">${String.fromCharCode(65 + i)}</div><div>${text}</div>`;
      div.onclick = () => this.handleTestChoice(i);
      container.appendChild(div);
    });
    this.openModal('test');
  }

  handleTestChoice(choice) {
    const node = this.nodes.find(n => n.id === this.currentNodeId);
    if (!node || !node.quiz) return;
    const correct = node.quiz.answer;
    const container = document.getElementById('test-options');
    const feedback = document.getElementById('test-feedback');
    const nextBtn = document.getElementById('test-next-btn');

    // 禁用所有选项点击
    container.querySelectorAll('.quiz-option').forEach((el, i) => {
      el.onclick = null;
      el.style.cursor = 'default';
      if (i === correct) {
        el.style.borderColor = '#48bb78';
        el.style.background = '#c6f6d5';
      } else if (i === choice && i !== correct) {
        el.style.borderColor = '#f56565';
        el.style.background = '#fed7d7';
      }
    });

    if (choice === correct) {
      feedback.textContent = '回答正确！继续完成自评即可解锁下一个知识点。';
      feedback.style.color = '#38a169';
      feedback.style.display = 'block';
      nextBtn.style.display = 'block';
    } else {
      feedback.textContent = '回答错误，建议再复习一下这个知识点。';
      feedback.style.color = '#e53e3e';
      feedback.style.display = 'block';
      nextBtn.textContent = '知道了，返回学习';
      nextBtn.style.display = 'block';
      nextBtn.onclick = () => {
        this.closeModal('test');
        this.rescueAttempts[this.currentNodeId]++;
        const attempts = this.rescueAttempts[this.currentNodeId];
        if (attempts === 1) {
          this.showRescueFirst();
        } else if (attempts === 2) {
          this.showRescueSecond();
        } else {
          this.showRescueThird();
        }
      };
    }
  }

  handleTestNext() {
    this.closeModal('test');
    this.showSelfAssessment();
  }

  showSelfAssessment() {
    document.getElementById('quiz-question').textContent = '你觉得掌握了吗？';
    const opts = [
      { label: 'A', text: '完全懂了' },
      { label: 'B', text: '似懂非懂' },
      { label: 'C', text: '没看懂' }
    ];
    const container = document.getElementById('quiz-options');
    container.innerHTML = '';
    opts.forEach((opt, i) => {
      const div = document.createElement('div');
      div.className = 'quiz-option';
      div.innerHTML = `<div class="opt-label">${opt.label}</div><div>${opt.text}</div>`;
      div.onclick = () => this.handleQuizChoice(i);
      container.appendChild(div);
    });
    this.openModal('quiz');
  }

  handleQuizChoice(choice) {
    this.closeModal('quiz');
    const nodeId = this.currentNodeId;
    if (choice === 0) {
      this.progress[nodeId] = 'mastered';
      this.rescueAttempts[nodeId] = 0;
      this.unlockNext(nodeId);
      this.showToast('恭喜！解锁了新的知识点');
      this.goMap();
    } else if (choice === 1) {
      this.progress[nodeId] = 'review';
      this.rescueAttempts[nodeId] = 0;
      this.unlockNext(nodeId);
      this.showToast('已标记为待复习，可以继续前进');
      this.goMap();
    } else {
      this.rescueAttempts[nodeId]++;
      const attempts = this.rescueAttempts[nodeId];
      if (attempts === 1) {
        this.showRescueFirst();
      } else if (attempts === 2) {
        this.showRescueSecond();
      } else {
        this.showRescueThird();
      }
    }
  }

  unlockNext(nodeId) {
    this.nodes.forEach(n => {
      if (n.prerequisites.includes(nodeId)) {
        const allPreDone = n.prerequisites.every(pre => {
          const s = this.progress[pre];
          return s === 'mastered' || s === 'review';
        });
        if (allPreDone && this.progress[n.id] === 'locked') {
          this.progress[n.id] = 'unlocked';
        }
      }
    });
  }

  /* ===== RESCUE ===== */
  showRescueFirst() {
    const node = this.nodes.find(n => n.id === this.currentNodeId);
    const actions = document.getElementById('rescue-actions');
    actions.innerHTML = '';
    if (node.content_simple) {
      const btn = document.createElement('button');
      btn.className = 'rescue-btn';
      btn.innerHTML = '<div class="rescue-title">换个说法（通俗版讲解）</div><div class="rescue-desc">用更生活化的比喻重新解释这个知识点</div>';
      btn.onclick = () => {
        this.closeModal('rescue');
        this.setMode('simple');
        this.showToast('已切换到通俗版讲解');
      };
      actions.appendChild(btn);
    }
    const skip = document.createElement('button');
    skip.className = 'rescue-btn';
    skip.innerHTML = '<div class="rescue-title">重新阅读标准版</div><div class="rescue-desc">再仔细看一遍，也许会有新理解</div>';
    skip.onclick = () => {
      this.closeModal('rescue');
      this.setMode('standard');
    };
    actions.appendChild(skip);
    this.openModal('rescue');
  }

  showRescueSecond() {
    const node = this.nodes.find(n => n.id === this.currentNodeId);
    const actions = document.getElementById('rescue-actions');
    actions.innerHTML = '';
    node.prerequisites.forEach(preId => {
      const pre = this.nodes.find(n => n.id === preId);
      if (!pre) return;
      const btn = document.createElement('button');
      btn.className = 'rescue-btn';
      btn.innerHTML = `<div class="rescue-title">前置补课：${pre.title}</div><div class="rescue-desc">你可能需要先复习这个前置知识</div>`;
      btn.onclick = () => {
        this.closeModal('rescue');
        this.openNode(preId);
        this.showToast('已跳转至前置知识点');
      };
      actions.appendChild(btn);
    });
    this.openModal('rescue');
  }

  showRescueThird() {
    const node = this.nodes.find(n => n.id === this.currentNodeId);
    const actions = document.getElementById('rescue-actions');
    actions.innerHTML = '';
    const btn = document.createElement('button');
    btn.className = 'rescue-btn';
    btn.innerHTML = `<div class="rescue-title">外部资源：${node.resource.title}</div><div class="rescue-desc">点击跳转到外部资源，换个方式学习</div>`;
    btn.onclick = () => {
      window.open(node.resource.url, '_blank');
      this.closeModal('rescue');
    };
    actions.appendChild(btn);
    const back = document.createElement('button');
    back.className = 'rescue-btn';
    back.innerHTML = '<div class="rescue-title">返回地图，稍后再来</div><div class="rescue-desc">休息一下，过段时间再尝试</div>';
    back.onclick = () => {
      this.closeModal('rescue');
      this.goMap();
    };
    actions.appendChild(back);
    this.openModal('rescue');
  }

  /* ===== AI WELCOME ===== */
  showAiWelcome() {
    const first = this.nodes.find(n => n.prerequisites.length === 0);
    const firstTitle = first ? first.title : '第一个知识点';
    const msg = document.getElementById('ai-message');
    msg.innerHTML = `<p>你好！我是你的学习规划师。</p>
    <p>根据你的情况，我为你规划了一条<strong>${this.domain.name}</strong>学习路径。建议从<strong>"${firstTitle}"</strong>开始，循序渐进，逐步掌握核心知识。</p>
    <p>学习过程中，每个知识点都有自评测试。如果遇到困难，"知识补给站"会帮你突破瓶颈。</p>
    <p style="margin-bottom:0;">准备好了吗？开始探索你的知识地图吧！</p>`;
    this.openModal('ai');
  }

  closeAiModal() {
    this.closeModal('ai');
  }

  /* ===== SUMMARY ===== */
  showSummary() {
    const mastered = Object.values(this.progress).filter(s => s === 'mastered').length;
    const review = Object.values(this.progress).filter(s => s === 'review').length;
    const unlocked = Object.values(this.progress).filter(s => s === 'unlocked').length;
    const stats = document.getElementById('summary-stats');
    stats.innerHTML = `
      <div class="stat-card"><div class="number">${mastered}</div><div class="label">已掌握</div></div>
      <div class="stat-card"><div class="number">${review}</div><div class="label">待复习</div></div>
      <div class="stat-card"><div class="number">${unlocked}</div><div class="label">可学习</div></div>
    `;
    this.renderSummarySvg(mastered, review, unlocked);
    this.showScreen('summary');
  }

  renderSummarySvg(mastered, review, unlocked) {
    const svg = document.getElementById('summary-svg');
    const total = this.nodes.length;
    const mW = (mastered / total) * 360;
    const rW = (review / total) * 360;
    const uW = (unlocked / total) * 360;
    const lW = 360 - mW - rW - uW;
    let x = 20;
    const barH = 32;
    const y = 44;
    const colors = ['#48bb78', '#ecc94b', '#3182ce', '#e2e8f0'];
    const widths = [mW, rW, uW, lW];
    const labels = [`已掌握 ${mastered}`, `待复习 ${review}`, `可学习 ${unlocked}`, `待解锁 ${total - mastered - review - unlocked}`];
    let rects = '';
    widths.forEach((w, i) => {
      if (w > 0) {
        rects += `<rect x="${x}" y="${y}" width="${w}" height="${barH}" fill="${colors[i]}" rx="6"/>`;
        if (w > 40) {
          rects += `<text x="${x + w/2}" y="${y + 22}" text-anchor="middle" fill="#fff" font-size="12" font-weight="600">${labels[i]}</text>`;
        }
        x += w + 4;
      }
    });
    svg.innerHTML = `<text x="20" y="24" fill="#4a5568" font-size="13" font-weight="600">学习进度总览</text>${rects}`;
  }

  exportGraph() {
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    const maxDiff = Math.max(...this.nodes.map(n => n.difficulty));
    const svgHeight = 80 + (maxDiff - 1) * 120 + 100;
    canvas.height = Math.max(svgHeight, 650);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f7fafc';
    ctx.fillRect(0, 0, 1000, canvas.height);

    // Draw title
    ctx.fillStyle = '#2d3748';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('知趣探图 - ' + this.domain.name + '知识图谱', 40, 40);
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#718096';
    ctx.fillText('生成时间：' + new Date().toLocaleDateString('zh-CN'), 40, 64);

    // Draw connections
    this.nodes.forEach(node => {
      node.prerequisites.forEach(preId => {
        const from = this.nodePositions[preId];
        const to = this.nodePositions[node.id];
        if (!from || !to) return;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y + 28);
        ctx.lineTo(to.x, to.y - 28);
        const preStatus = this.progress[preId];
        const isActive = preStatus === 'mastered' || preStatus === 'review';
        ctx.strokeStyle = isActive ? '#a0aec0' : '#e2e8f0';
        ctx.lineWidth = isActive ? 2 : 1.5;
        if (!isActive) ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      });
    });

    // Draw nodes
    this.nodes.forEach(node => {
      const pos = this.nodePositions[node.id];
      const status = this.progress[node.id];
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 28, 0, Math.PI * 2);
      if (status === 'mastered') {
        ctx.fillStyle = '#48bb78';
        ctx.strokeStyle = '#38a169';
      } else if (status === 'review') {
        ctx.fillStyle = '#ecc94b';
        ctx.strokeStyle = '#d69e2e';
      } else if (status === 'unlocked') {
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#3182ce';
      } else {
        ctx.fillStyle = '#f7fafc';
        ctx.strokeStyle = '#cbd5e0';
      }
      ctx.lineWidth = 3;
      ctx.fill();
      ctx.stroke();

      // Text
      ctx.fillStyle = (status === 'mastered' || status === 'review') ? '#fff' : (status === 'locked' ? '#a0aec0' : '#2d3748');
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.nodeNumber(node.id), pos.x, pos.y);

      // Label
      ctx.fillStyle = status === 'locked' ? '#a0aec0' : '#4a5568';
      ctx.font = '11px sans-serif';
      ctx.fillText(node.title, pos.x, pos.y + 48);
    });

    // Watermark
    ctx.fillStyle = '#cbd5e0';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('知趣探图生成', 960, canvas.height - 20);

    const link = document.createElement('a');
    link.download = '知趣探图_' + this.domain.name + '_知识图谱.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    this.showToast('知识图谱已导出');
  }

  /* ===== MODALS & TOAST ===== */
  openModal(id) {
    document.getElementById('modal-' + id).classList.add('active');
  }
  closeModal(id) {
    document.getElementById('modal-' + id).classList.remove('active');
  }
  showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.style.opacity = '1';
    t.style.transform = 'translateX(-50%) translateY(0)';
    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transform = 'translateX(-50%) translateY(100px)';
    }, 2500);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

const app = new App();
