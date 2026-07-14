/**
 * QuadraticRenderer - 二次函数图像渲染模块
 * 从 quadratic_graph.html 迁移而来，支持自适应 canvas 尺寸
 *
 * 接口：
 *   - validate(params): boolean  校验参数合法性
 *   - render(ctx, params, canvas): void  在 canvas 上绘制二次函数图
 */
(function () {
  'use strict';

  // 默认数学坐标范围
  var DEFAULT_X_MIN = -3;
  var DEFAULT_X_MAX = 7;
  var DEFAULT_Y_MIN = -4;
  var DEFAULT_Y_MAX = 6;

  // 画布四周留白（像素）
  var PADDING = 40;

  /**
   * 校验参数
   * @param {Object} params
   * @returns {boolean}
   */
  function validate(params) {
    if (!params || typeof params !== 'object') return false;
    if (typeof params.a !== 'number' || isNaN(params.a)) return false;
    if (!params.vertex || typeof params.vertex !== 'object') return false;
    if (typeof params.vertex.x !== 'number' || typeof params.vertex.y !== 'number') return false;
    if (!Array.isArray(params.roots)) return false;
    return true;
  }

  /**
   * 渲染入口
   * @param {CanvasRenderingContext2D} ctx
   * @param {Object} params 渲染参数
   * @param {HTMLCanvasElement} canvas
   */
  function render(ctx, params, canvas) {
    if (!validate(params)) return;

    var W = canvas.width;
    var H = canvas.height;

    // 解析参数（提供默认值）
    var a = params.a;
    var vertex = params.vertex;
    var roots = params.roots || [];
    var axisOfSymmetry = (typeof params.axisOfSymmetry === 'number')
      ? params.axisOfSymmetry
      : vertex.x;
    var vertexForm = params.vertexForm || '';

    // 坐标范围（保留默认值，便于自适应）
    var xMin = DEFAULT_X_MIN;
    var xMax = DEFAULT_X_MAX;
    var yMin = DEFAULT_Y_MIN;
    var yMax = DEFAULT_Y_MAX;
    var xRange = xMax - xMin;
    var yRange = yMax - yMin;

    // 单位长度（像素），自适应 canvas 尺寸
    var unit = Math.min((W - PADDING * 2) / xRange, (H - PADDING * 2) / yRange);
    var originX = PADDING + (0 - xMin) * unit;     // x=0 在画布上的位置
    var originY = H - PADDING - (0 - yMin) * unit;  // y=0 在画布上的位置

    // 数学坐标 -> 画布坐标
    function toCanvas(x, y) {
      return [originX + x * unit, originY - y * unit];
    }

    // ---- 绘制网格 ----
    function drawGrid() {
      ctx.strokeStyle = '#ecf0f3';
      ctx.lineWidth = 1;
      var gx, gy, cx, cy;
      for (gx = Math.ceil(xMin); gx <= xMax; gx++) {
        cx = toCanvas(gx, 0)[0];
        ctx.beginPath();
        ctx.moveTo(cx, 0);
        ctx.lineTo(cx, H);
        ctx.stroke();
      }
      for (gy = Math.ceil(yMin); gy <= yMax; gy++) {
        cy = toCanvas(0, gy)[1];
        ctx.beginPath();
        ctx.moveTo(0, cy);
        ctx.lineTo(W, cy);
        ctx.stroke();
      }
    }

    // ---- 绘制坐标轴 ----
    function drawAxes() {
      ctx.strokeStyle = '#34495e';
      ctx.lineWidth = 1.5;
      // X 轴
      ctx.beginPath();
      ctx.moveTo(0, originY);
      ctx.lineTo(W, originY);
      ctx.stroke();
      // Y 轴
      ctx.beginPath();
      ctx.moveTo(originX, 0);
      ctx.lineTo(originX, H);
      ctx.stroke();

      // 箭头
      ctx.fillStyle = '#34495e';
      // X 轴箭头
      ctx.beginPath();
      ctx.moveTo(W - 2, originY);
      ctx.lineTo(W - 12, originY - 5);
      ctx.lineTo(W - 12, originY + 5);
      ctx.closePath();
      ctx.fill();
      // Y 轴箭头
      ctx.beginPath();
      ctx.moveTo(originX, 2);
      ctx.lineTo(originX - 5, 12);
      ctx.lineTo(originX + 5, 12);
      ctx.closePath();
      ctx.fill();

      // 刻度与标签
      ctx.fillStyle = '#5a6c7d';
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      var gx, gy, cx, cy;
      for (gx = Math.ceil(xMin); gx <= xMax; gx++) {
        if (gx === 0) continue;
        cx = toCanvas(gx, 0)[0];
        ctx.beginPath();
        ctx.moveTo(cx, originY - 3);
        ctx.lineTo(cx, originY + 3);
        ctx.stroke();
        ctx.fillText(gx, cx, originY + 6);
      }
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      for (gy = Math.ceil(yMin); gy <= yMax; gy++) {
        if (gy === 0) continue;
        cy = toCanvas(0, gy)[1];
        ctx.beginPath();
        ctx.moveTo(originX - 3, cy);
        ctx.lineTo(originX + 3, cy);
        ctx.stroke();
        ctx.fillText(gy, originX - 6, cy);
      }
      // 原点 O
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillText('O', originX - 6, originY + 4);
      // 轴标签
      ctx.textAlign = 'left';
      ctx.fillText('x', W - 18, originY + 6);
      ctx.textAlign = 'center';
      ctx.fillText('y', originX + 12, 4);
    }

    // ---- 绘制对称轴 ----
    function drawAxisOfSymmetry() {
      var cx = toCanvas(axisOfSymmetry, 0)[0];
      ctx.strokeStyle = '#9b59b6';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, H);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#9b59b6';
      ctx.font = 'italic 13px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('x = ' + axisOfSymmetry + ' (对称轴)', cx + 6, 10);
    }

    // ---- 绘制抛物线 ----
    // y = a*(x - vertex.x)^2 + vertex.y
    function drawParabola() {
      ctx.strokeStyle = '#2980b9';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      var started = false;
      var x, y, cx, cy;
      for (x = xMin; x <= xMax; x += 0.02) {
        y = a * (x - vertex.x) * (x - vertex.x) + vertex.y;
        cy = toCanvas(x, y)[1];
        cx = toCanvas(x, y)[0];
        if (cy < 0 || cy > H) { started = false; continue; }
        if (!started) { ctx.moveTo(cx, cy); started = true; }
        else ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }

    // ---- 绘制单个关键点 ----
    function drawPoint(x, y, color, label) {
      var pos = toCanvas(x, y);
      var cx = pos[0], cy = pos[1];
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#2c3e50';
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText(label, cx + 9, cy - 8);
    }

    // ---- 绘制关键点 ----
    function drawKeyPoints() {
      // 顶点
      drawPoint(vertex.x, vertex.y, '#e67e22',
        '顶点 (' + vertex.x + ', ' + vertex.y + ')');
      // 根（支持数字或 {x, y} 对象）
      roots.forEach(function (r) {
        var rx, ry;
        if (typeof r === 'number') { rx = r; ry = 0; }
        else { rx = r.x; ry = (typeof r.y === 'number') ? r.y : 0; }
        drawPoint(rx, ry, '#27ae60', '根 (' + rx + ', ' + ry + ')');
      });
      // y 轴截距 (x=0 处的 y 值)
      var yIntercept = a * (0 - vertex.x) * (0 - vertex.x) + vertex.y;
      drawPoint(0, yIntercept, '#c0392b', 'y 截距 (0, ' + yIntercept + ')');
    }

    // ---- 绘制图例 ----
    function drawLegend() {
      var items = [
        { color: '#2980b9', label: vertexForm || ('y = ' + a + '(x-' + vertex.x + ')²' + (vertex.y >= 0 ? '+' : '') + vertex.y) },
        { color: '#e67e22', label: '顶点 (' + vertex.x + ', ' + vertex.y + ')' },
        { color: '#27ae60', label: '根 ' + roots.map(function (r) {
            return 'x = ' + (typeof r === 'number' ? r : r.x);
          }).join(', ') },
        { color: '#9b59b6', label: '对称轴 x = ' + axisOfSymmetry }
      ];
      var boxW = 160, boxH = 98;
      var lx = W - boxW - 15;
      var ly = H - boxH - 15;
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.strokeStyle = '#dfe4ea';
      ctx.lineWidth = 1;
      ctx.fillRect(lx, ly, boxW, boxH);
      ctx.strokeRect(lx, ly, boxW, boxH);

      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      items.forEach(function (it, i) {
        var y = ly + 16 + i * 20;
        ctx.fillStyle = it.color;
        ctx.fillRect(lx + 10, y - 5, 16, 10);
        ctx.fillStyle = '#2c3e50';
        ctx.fillText(it.label, lx + 32, y);
      });
    }

    // ---- 绘制标题 ----
    function drawTitle() {
      if (!vertexForm) return;
      ctx.fillStyle = '#2c3e50';
      ctx.font = 'bold 15px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(vertexForm, W / 2, 8);
    }

    // ---- 执行渲染（顺序与原 HTML 一致）----
    drawGrid();
    drawAxes();
    drawAxisOfSymmetry();
    drawParabola();
    drawKeyPoints();
    drawLegend();
    drawTitle();
  }

  // 导出全局对象
  var QuadraticRenderer = {
    validate: validate,
    render: render
  };

  window.QuadraticRenderer = QuadraticRenderer;
})();
