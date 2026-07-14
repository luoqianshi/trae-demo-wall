/* ===== ecosystemDiagram.js · 生物·食物链/食物网 =====
 * 接口：window.EcosystemDiagramRenderer = { validate, render }
 * 参数：
 *   species: [{ name, trophicLevel }]
 *   relationships: [{ from, to, type: "捕食"|"竞争" }]
 */
window.EcosystemDiagramRenderer = (function () {

  // 营养级层级顺序（从下到上）
  const TROPHIC_ORDER = ['生产者', '初级消费者', '次级消费者', '三级消费者', '顶级消费者'];
  // 营养级颜色
  const TROPHIC_COLORS = {
    '生产者':     { bg: '#d4edda', border: '#28a745', text: '#155724' },
    '初级消费者': { bg: '#fff3cd', border: '#ffc107', text: '#856404' },
    '次级消费者': { bg: '#ffe0e0', border: '#fd7e14', text: '#721c24' },
    '三级消费者': { bg: '#f8d7da', border: '#dc3545', text: '#721c24' },
    '顶级消费者': { bg: '#d1ecf1', border: '#17a2b8', text: '#0c5460' },
  };

  function validate(params) {
    if (!params) return false;
    if (!Array.isArray(params.species) || params.species.length < 2) return false;
    if (!Array.isArray(params.relationships) || params.relationships.length < 1) return false;
    // 每个物种必须有 name
    return params.species.every(s => s && s.name);
  }

  function render(ctx, params, canvas) {
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // 背景
    ctx.fillStyle = '#fafbfc';
    ctx.fillRect(0, 0, W, H);

    // 标题
    ctx.fillStyle = '#2d3436';
    ctx.font = 'bold 18px "Microsoft YaHei", "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('生态系统 · 食物链与食物网', W / 2, 14);

    // 计算营养级分组
    const levels = _groupbyTrophicLevel(params.species);
    const levelNames = Object.keys(levels);

    // 布局参数
    const padTop = 50;
    const padBottom = 50;
    const padX = 100;
    const drawableH = H - padTop - padBottom;
    const drawableW = W - padX * 2;

    // 每个营养级的 y 坐标（从上到下：顶级在上，生产者在下）
    // 按 TROPHIC_ORDER 反向排序（高级在上）
    const sortedLevels = levelNames.sort((a, b) => {
      const ia = TROPHIC_ORDER.indexOf(a);
      const ib = TROPHIC_ORDER.indexOf(b);
      return ib - ia; // 高级在前（上）
    });

    const levelY = {};
    sortedLevels.forEach((lv, i) => {
      // 均匀分布
      levelY[lv] = padTop + (drawableH / Math.max(sortedLevels.length, 1)) * (i + 0.5);
    });

    // 计算每个物种的 x 坐标（同营养级内均匀分布）
    const speciesPos = {}; // name -> {x, y, level}
    sortedLevels.forEach(lv => {
      const list = levels[lv];
      const n = list.length;
      list.forEach((sp, i) => {
        const x = padX + drawableW * ((i + 1) / (n + 1));
        speciesPos[sp.name] = { x: x, y: levelY[lv], level: lv };
      });
    });

    // ===== 绘制关系连线 =====
    params.relationships.forEach(rel => {
      const from = speciesPos[rel.from];
      const to = speciesPos[rel.to];
      if (!from || !to) return;
      _drawRelation(ctx, from, to, rel.type);
    });

    // ===== 绘制物种节点 =====
    params.species.forEach(sp => {
      const pos = speciesPos[sp.name];
      if (pos) _drawSpecies(ctx, pos, sp);
    });

    // ===== 图例 =====
    _drawLegend(ctx, W, H);
  }

  // 按营养级分组
  function _groupbyTrophicLevel(species) {
    const groups = {};
    species.forEach(s => {
      const lv = s.trophicLevel || '生产者';
      if (!groups[lv]) groups[lv] = [];
      groups[lv].push(s);
    });
    return groups;
  }

  // 绘制物种节点（圆角矩形 + 名称）
  function _drawSpecies(ctx, pos, sp) {
    const colors = TROPHIC_COLORS[sp.trophicLevel] || TROPHIC_COLORS['生产者'];
    const w = 80;
    const h = 36;
    const x = pos.x - w / 2;
    const y = pos.y - h / 2;

    // 圆角矩形背景
    ctx.fillStyle = colors.bg;
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 2;
    _roundRect(ctx, x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();

    // 物种名
    ctx.fillStyle = colors.text;
    ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(sp.name, pos.x, pos.y);
  }

  // 绘制关系连线
  function _drawRelation(ctx, from, to, type) {
    if (type === '捕食') {
      // from 被 to 吃：箭头从 from 指向 to
      // 计算节点边缘起点
      const start = _edgePoint(from, to, 40, 18);
      const end = _edgePoint(to, from, 40, 18);

      ctx.strokeStyle = '#6c5ce7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      // 用贝塞尔曲线让连线更柔和
      const mx = (start.x + end.x) / 2;
      const my = (start.y + end.y) / 2 - 20;
      ctx.quadraticCurveTo(mx, my, end.x, end.y);
      ctx.stroke();

      // 箭头
      _drawArrow(ctx, mx, my, end.x, end.y, '#6c5ce7');
    } else if (type === '竞争') {
      // 双向虚线
      const start = _edgePoint(from, to, 40, 18);
      const end = _edgePoint(to, from, 40, 18);

      ctx.strokeStyle = '#e17055';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      const mx = (start.x + end.x) / 2;
      const my = (start.y + end.y) / 2 + 15;
      ctx.quadraticCurveTo(mx, my, end.x, end.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // 双向箭头
      _drawArrow(ctx, mx, my, end.x, end.y, '#e17055');
      _drawArrow(ctx, mx, my, start.x, start.y, '#e17055');
    }
  }

  // 计算从 from 到 to 连线在节点边缘的交点
  function _edgePoint(from, to, halfW, halfH) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const angle = Math.atan2(dy, dx);
    // 简化：用椭圆边缘
    const a = halfW;
    const b = halfH;
    const t = Math.atan2(b * Math.cos(angle), a * Math.sin(angle));
    // 限制在合理范围
    const r = Math.sqrt((a * Math.cos(angle)) ** 2 + (b * Math.sin(angle)) ** 2);
    return {
      x: from.x + r * Math.cos(angle),
      y: from.y + r * Math.sin(angle),
    };
  }

  // 绘制箭头
  function _drawArrow(ctx, fromX, fromY, toX, toY, color) {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const len = 10;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - len * Math.cos(angle - Math.PI / 6), toY - len * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - len * Math.cos(angle + Math.PI / 6), toY - len * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  }

  // 圆角矩形
  function _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // 图例
  function _drawLegend(ctx, W, H) {
    const items = [
      { label: '捕食关系', color: '#6c5ce7', dash: false },
      { label: '竞争关系', color: '#e17055', dash: true },
    ];
    const lx = W - 140;
    const ly = H - 30;
    ctx.font = '12px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    items.forEach((it, i) => {
      const x = lx + i * 70;
      ctx.strokeStyle = it.color;
      ctx.lineWidth = 2;
      if (it.dash) ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(x, ly);
      ctx.lineTo(x + 20, ly);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#52606d';
      ctx.fillText(it.label, x + 26, ly);
    });

    // 营养级说明（左下）
    const trophicItems = [
      { label: '生产者', colors: TROPHIC_COLORS['生产者'] },
      { label: '消费者', colors: TROPHIC_COLORS['初级消费者'] },
    ];
    trophicItems.forEach((it, i) => {
      const x = 16 + i * 80;
      ctx.fillStyle = it.colors.bg;
      ctx.strokeStyle = it.colors.border;
      ctx.lineWidth = 1.5;
      _roundRect(ctx, x, ly - 8, 16, 16, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#52606d';
      ctx.fillText(it.label, x + 22, ly);
    });
  }

  return { validate, render };
})();
