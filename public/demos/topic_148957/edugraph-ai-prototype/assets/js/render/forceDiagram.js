/**
 * ForceDiagramRenderer
 * 斜面物体受力分析图渲染器（纯 Canvas 2D API，不依赖外部库）
 *
 * 接口：
 *   - validate(params): boolean  校验 params.forces 是数组且 params.inclination 是数字
 *   - render(ctx, params, canvas): void  在 canvas 上绘制斜面物体受力分析图
 */
var ForceDiagramRenderer = (function () {
  'use strict';

  /**
   * 校验渲染参数
   * @param {Object} params - 渲染参数
   * @returns {boolean} params.forces 为数组且 params.inclination 为数字时返回 true
   */
  function validate(params) {
    return !!params
      && Array.isArray(params.forces)
      && typeof params.inclination === 'number'
      && !Number.isNaN(params.inclination);
  }

  /**
   * 在 canvas 上绘制斜面物体受力分析图
   * @param {CanvasRenderingContext2D} ctx - 2D 上下文
   * @param {Object} params - 渲染参数 { object, forces, coordinateSystem, inclination }
   * @param {HTMLCanvasElement} canvas - canvas 元素（通过 canvas.width/height 自适应尺寸）
   */
  function render(ctx, params, canvas) {
    // 自适应 canvas 尺寸（不硬编码 720x520）
    var W = canvas.width;
    var H = canvas.height;

    // 倾角（度 -> 弧度）
    var inclination = params.inclination || 0;
    var theta = inclination * Math.PI / 180;

    // 自适应缩放因子（以原始 720x520 设计为基准）
    var scale = Math.min(W / 720, H / 520);

    // ==================== 几何配置 ====================
    var baseX = 120 * scale;            // 斜面底端 x（画布坐标）
    var baseY = 440 * scale;            // 斜面底端 y
    var inclineLen = 420 * scale;       // 斜面长度（像素）

    // 斜面顶端坐标
    var topX = baseX + inclineLen * Math.cos(theta);
    var topY = baseY - inclineLen * Math.sin(theta);

    // 木块中心（沿斜面 0.45 处，画在斜面中段）
    var t = 0.45;
    var blockCenterX = baseX + inclineLen * t * Math.cos(theta);
    var blockCenterY = baseY - inclineLen * t * Math.sin(theta);

    var blockSize = 60 * scale;

    // 斜面外法线方向（指向斜面上方/外侧）n = (-sinθ, -cosθ)
    var nx = -Math.sin(theta), ny = -Math.cos(theta);
    // 沿斜面向上方向 u = (cosθ, -sinθ)
    var ux = Math.cos(theta), uy = -Math.sin(theta);

    // 木块四个顶点（以中心为基准，沿 u/n 方向）
    function blockCorners() {
      var half = blockSize / 2;
      return [
        [blockCenterX + (-ux + nx) * half, blockCenterY + (-uy + ny) * half],
        [blockCenterX + ( ux + nx) * half, blockCenterY + ( uy + ny) * half],
        [blockCenterX + ( ux - nx) * half, blockCenterY + ( uy - ny) * half],
        [blockCenterX + (-ux - nx) * half, blockCenterY + (-uy - ny) * half],
      ];
    }

    // ==================== 绘制工具 ====================
    // 画带箭头的线段
    function drawArrow(x1, y1, x2, y2, color, width) {
      width = width || 3 * scale;
      var dx = x2 - x1, dy = y2 - y1;
      var len = Math.hypot(dx, dy);
      if (len < 1) return;
      var ang = Math.atan2(dy, dx);
      var headLen = 14 * scale;

      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2 - headLen * Math.cos(ang) * 0.5,
                 y2 - headLen * Math.sin(ang) * 0.5);
      ctx.stroke();

      // 箭头三角
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - headLen * Math.cos(ang - Math.PI / 7),
                 y2 - headLen * Math.sin(ang - Math.PI / 7));
      ctx.lineTo(x2 - headLen * Math.cos(ang + Math.PI / 7),
                 y2 - headLen * Math.sin(ang + Math.PI / 7));
      ctx.closePath();
      ctx.fill();
    }

    // 沿方向画力箭头：从 (px,py) 出发，方向 (dx,dy) 单位向量，长度 L
    function drawForce(px, py, dx, dy, L, color, label, labelOffset) {
      labelOffset = (labelOffset == null) ? 1.0 : labelOffset;
      var x2 = px + dx * L, y2 = py + dy * L;
      drawArrow(px, py, x2, y2, color);
      // 标签放在箭头中部偏侧
      var lx = px + dx * L * labelOffset + (dx > 0.1 ? 10 : (dx < -0.1 ? -10 : 0)) * scale;
      var ly = py + dy * L * labelOffset + (dy > 0.1 ? 16 : (dy < -0.1 ? -10 : 0)) * scale;
      ctx.fillStyle = color;
      ctx.font = 'bold ' + (15 * scale) + 'px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, lx, ly);
    }

    // ==================== 绘制斜面 ====================
    function drawIncline() {
      // 地面
      ctx.strokeStyle = '#34495e';
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.moveTo(60 * scale, baseY);
      ctx.lineTo(W - 40 * scale, baseY);
      ctx.stroke();

      // 地面阴影线
      ctx.strokeStyle = '#95a5a6';
      ctx.lineWidth = 1;
      for (var x = 70 * scale; x < W - 40 * scale; x += 18 * scale) {
        ctx.beginPath();
        ctx.moveTo(x, baseY);
        ctx.lineTo(x - 10 * scale, baseY + 12 * scale);
        ctx.stroke();
      }

      // 斜面（三角形）
      ctx.fillStyle = 'rgba(218, 223, 230, 0.55)';
      ctx.strokeStyle = '#34495e';
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.moveTo(baseX, baseY);
      ctx.lineTo(topX, topY);
      ctx.lineTo(topX, baseY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 倾角标记弧（θ = inclination°）
      ctx.strokeStyle = '#e67e22';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(baseX, baseY, 46 * scale, -theta, 0);
      ctx.stroke();

      // θ 标签
      ctx.fillStyle = '#e67e22';
      ctx.font = 'italic bold ' + (16 * scale) + 'px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('θ = ' + inclination + '°', baseX + 54 * scale, baseY - 18 * scale);

      // 斜面底边长度参考（水平虚线）
      ctx.strokeStyle = '#bdc3c7';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(baseX, baseY);
      ctx.lineTo(topX, baseY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // ==================== 绘制木块 ====================
    function drawBlock() {
      var corners = blockCorners();
      ctx.fillStyle = '#d4a373';
      ctx.strokeStyle = '#8b5a2b';
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.moveTo(corners[0][0], corners[0][1]);
      for (var i = 1; i < 4; i++) {
        ctx.lineTo(corners[i][0], corners[i][1]);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 木纹（两条线）
      ctx.strokeStyle = 'rgba(139,90,43,0.4)';
      ctx.lineWidth = 1;
      for (var k = 0; k < 2; k++) {
        var off = (k + 1) / 3;
        var p1 = [
          corners[0][0] + (corners[1][0] - corners[0][0]) * off,
          corners[0][1] + (corners[1][1] - corners[0][1]) * off,
        ];
        var p2 = [
          corners[3][0] + (corners[2][0] - corners[3][0]) * off,
          corners[3][1] + (corners[2][1] - corners[3][1]) * off,
        ];
        ctx.beginPath();
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.stroke();
      }

      // 木块中心点（受力作用点）
      ctx.fillStyle = '#2c3e50';
      ctx.beginPath();
      ctx.arc(blockCenterX, blockCenterY, 3.5 * scale, 0, Math.PI * 2);
      ctx.fill();
    }

    // ==================== 绘制坐标轴 ====================
    function drawCoordinate() {
      var oX = 60 * scale, oY = baseY;
      var axisLen = 70 * scale;
      // x 轴
      drawArrow(oX, oY, oX + axisLen, oY, '#7f8c8d', 1.5 * scale);
      // y 轴
      drawArrow(oX, oY, oX, oY - axisLen, '#7f8c8d', 1.5 * scale);
      ctx.fillStyle = '#7f8c8d';
      ctx.font = 'italic ' + (13 * scale) + 'px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('x', oX + axisLen + 6 * scale, oY);
      ctx.fillText('y', oX, oY - axisLen - 8 * scale);
    }

    // ==================== 绘制受力 ====================
    function drawForces() {
      var px = blockCenterX, py = blockCenterY;

      // 力的视觉长度（按比例缩放）
      var G = 110 * scale;
      var N = 95 * scale;
      var f = 70 * scale;

      // 1) 重力 G = mg （红色，竖直向下）
      drawForce(px, py, 0, 1, G, '#c0392b', 'G = mg', 1.0);

      // 2) 支持力 N = mgcosθ （绿色，垂直斜面向外 n = (-sinθ, -cosθ)）
      drawForce(px, py, nx, ny, N, '#27ae60', 'N = mgcosθ', 1.0);

      // 3) 摩擦力 f = μN （蓝色，沿斜面向上 u = (cosθ, -sinθ)）
      drawForce(px, py, ux, uy, f, '#2980b9', 'f = μN', 1.0);

      // 重力分解：红色虚线 + 分量箭头
      // 把 G 分解为沿斜面 mg sinθ 和垂直斜面 mg cosθ
      ctx.strokeStyle = 'rgba(192,57,43,0.45)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      // 沿斜面向下方向 d = (-cosθ, sinθ)
      var ddx = -Math.cos(theta), ddy = Math.sin(theta);
      var Gpar = G * Math.sin(theta);   // 沿斜面分量长度（按比例）
      var Gperp = G * Math.cos(theta);  // 垂直斜面分量长度

      // 分量端点
      var parEnd = [px + ddx * Gpar, py + ddy * Gpar];
      var perpEnd = [px + nx * Gperp, py + ny * Gperp];
      var gEnd = [px, py + G];  // 重力端点

      // 平行四边形辅助线（虚线）
      ctx.beginPath();
      ctx.moveTo(parEnd[0], parEnd[1]);
      ctx.lineTo(gEnd[0], gEnd[1]);
      ctx.moveTo(perpEnd[0], perpEnd[1]);
      ctx.lineTo(gEnd[0], gEnd[1]);
      ctx.stroke();
      ctx.setLineDash([]);

      // 分量箭头：mg sinθ（沿斜面向下）和 mg cosθ（垂直斜面）
      drawArrow(px, py, parEnd[0], parEnd[1], 'rgba(192,57,43,0.75)', 1.5 * scale);
      drawArrow(px, py, perpEnd[0], perpEnd[1], 'rgba(192,57,43,0.75)', 1.5 * scale);

      // 分量标签
      ctx.fillStyle = 'rgba(192,57,43,0.85)';
      ctx.font = 'italic ' + (12 * scale) + 'px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('mg sinθ', parEnd[0] - 18 * scale, parEnd[1] + 14 * scale);
      ctx.fillText('mg cosθ', perpEnd[0] - 30 * scale, perpEnd[1] - 10 * scale);
    }

    // ==================== 图例 ====================
    function drawLegend() {
      var items = [
        { color: '#c0392b', label: '重力 G = mg（向下）' },
        { color: '#27ae60', label: '支持力 N = mgcosθ（⊥斜面）' },
        { color: '#2980b9', label: '摩擦力 f = μN（沿斜面向上）' },
        { color: 'rgba(192,57,43,0.75)', label: '重力分解分量' },
      ];
      var lx = W - 270 * scale, ly = 30 * scale;
      var lw = 250 * scale, lh = 100 * scale;

      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.strokeStyle = '#dfe4ea';
      ctx.lineWidth = 1;
      ctx.fillRect(lx, ly, lw, lh);
      ctx.strokeRect(lx, ly, lw, lh);

      ctx.font = (13 * scale) + 'px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        var y = ly + 18 * scale + i * 22 * scale;
        ctx.fillStyle = it.color;
        ctx.fillRect(lx + 12 * scale, y - 5 * scale, 18 * scale, 10 * scale);
        ctx.fillStyle = '#2c3e50';
        ctx.fillText(it.label, lx + 38 * scale, y);
      }
    }

    // ==================== 渲染（按层级顺序绘制）====================
    drawIncline();    // 斜面（含地面阴影、倾角弧、底边虚线）
    drawCoordinate(); // 左下角坐标轴
    drawBlock();      // 木块（带木纹）
    drawForces();     // 三个受力箭头 + 重力分解
    drawLegend();     // 右上角图例
  }

  return {
    validate: validate,
    render: render,
  };
})();

window.ForceDiagramRenderer = ForceDiagramRenderer;
