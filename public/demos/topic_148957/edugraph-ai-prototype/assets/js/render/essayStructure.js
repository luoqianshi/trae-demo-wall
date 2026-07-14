/**
 * 议论文结构思维导图渲染器
 * 由 essay_structure.html 迁移重构而来，自适应任意 Canvas 尺寸
 * 纯 Canvas 2D API，无外部依赖
 */
var EssayStructureRenderer = (function () {
  'use strict';

  // 默认段落色板（当 section 未指定 color 时使用）
  var DEFAULT_COLORS = ['#3498db', '#e67e22', '#27ae60', '#9b59b6', '#c0392b'];

  /**
   * 校验参数合法性
   * @param {Object} params - 渲染参数
   * @returns {boolean}
   */
  function validate(params) {
    if (!params || typeof params !== 'object') return false;
    if (typeof params.theme !== 'string') return false;
    if (!Array.isArray(params.sections)) return false;
    return true;
  }

  // ============ 颜色工具 ============
  // 颜色加深 / 变浅（percent 为负变深，为正变浅）
  function shadeColor(hex, percent) {
    var R = parseInt(hex.substring(1, 3), 16);
    var G = parseInt(hex.substring(3, 5), 16);
    var B = parseInt(hex.substring(5, 7), 16);
    R = Math.max(0, Math.min(255, R + (R * percent / 100)));
    G = Math.max(0, Math.min(255, G + (G * percent / 100)));
    B = Math.max(0, Math.min(255, B + (B * percent / 100)));
    function pad2(v) {
      var s = Math.round(v).toString(16);
      return s.length < 2 ? '0' + s : s;
    }
    return '#' + pad2(R) + pad2(G) + pad2(B);
  }

  // ============ 形状绘制工具 ============
  // 圆角矩形
  function roundRect(ctx, x, y, w, h, r, fill, stroke, strokeColor) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = strokeColor || '#333'; ctx.lineWidth = 1.5; ctx.stroke(); }
  }

  // 带箭头线段
  function drawArrow(ctx, x1, y1, x2, y2, color, width) {
    width = width || 2;
    var ang = Math.atan2(y2 - y1, x2 - x1);
    var headLen = 11;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;
    // 杆
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2 - headLen * Math.cos(ang) * 0.6, y2 - headLen * Math.sin(ang) * 0.6);
    ctx.stroke();
    // 头
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLen * Math.cos(ang - Math.PI / 7), y2 - headLen * Math.sin(ang - Math.PI / 7));
    ctx.lineTo(x2 - headLen * Math.cos(ang + Math.PI / 7), y2 - headLen * Math.sin(ang + Math.PI / 7));
    ctx.closePath();
    ctx.fill();
  }

  // 中文文本自动换行（基于 ctx.measureText 精确测量，逐字符累积）
  function wrapText(ctx, text, x, y, maxW, lineH) {
    var line = '';
    var yy = y;
    for (var i = 0; i < text.length; i++) {
      var testLine = line + text[i];
      if (ctx.measureText(testLine).width > maxW && line.length > 0) {
        ctx.fillText(line, x, yy);
        line = text[i];
        yy += lineH;
      } else {
        line = testLine;
      }
    }
    if (line) ctx.fillText(line, x, yy);
    return yy;
  }

  /**
   * 主渲染入口：在 canvas 上绘制议论文结构思维导图
   * @param {CanvasRenderingContext2D} ctx
   * @param {Object} params - { theme, sections:[{title,keyPoints:[],wordCount,color}] }
   * @param {HTMLCanvasElement} canvas
   */
  function render(ctx, params, canvas) {
    if (!validate(params)) return;

    var W = canvas.width;
    var H = canvas.height;
    var rawSections = params.sections;
    var n = rawSections.length;

    // 为每个 section 补充默认颜色
    var sections = rawSections.map(function (s, i) {
      return {
        title: s.title || '',
        keyPoints: Array.isArray(s.keyPoints) ? s.keyPoints : [],
        wordCount: typeof s.wordCount === 'number' ? s.wordCount : 0,
        color: s.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]
      };
    });

    // ============ 布局计算（基于 canvas 实际尺寸自适应）============
    var padX = Math.max(20, W * 0.022);            // 左右内边距

    // 主题中心节点
    var centerW = Math.min(320, Math.max(220, W * 0.28));
    var centerH = Math.max(56, Math.min(80, H * 0.085));
    var centerX = W / 2;
    var centerY = centerH / 2 + 20;

    // 段落节点行
    var sectionY = centerY + centerH / 2 + Math.max(60, H * 0.08);
    var sectionH = Math.max(76, Math.min(110, H * 0.13));
    var gap = Math.max(12, W * 0.018);
    var sectionW = (W - padX * 2 - gap * (n - 1)) / n;

    var sectionNodes = sections.map(function (s, i) {
      return {
        title: s.title,
        keyPoints: s.keyPoints,
        wordCount: s.wordCount,
        color: s.color,
        x: padX + i * (sectionW + gap),
        y: sectionY,
        w: sectionW,
        h: sectionH
      };
    });

    // 要点卡片行（高度随要点数量自适应）
    var detailY = sectionY + sectionH + Math.max(50, H * 0.07);
    var detailW = sectionW;
    var maxKp = 1;
    sections.forEach(function (s) {
      if (s.keyPoints.length > maxKp) maxKp = s.keyPoints.length;
    });
    var detailH = Math.max(140, Math.min(H * 0.34, 50 + maxKp * 56));

    // 底部论证脉络
    var flowY = detailY + detailH + Math.max(40, H * 0.06);

    // ============ 调用绘制流程（顺序与原 HTML 保持一致）============
    drawConnections();
    drawCenter();
    drawSections();
    drawDetails();
    drawFlow();

    // ============ 内部绘制函数 ============
    // 主题 -> 各段落 的贝塞尔连接线
    function drawConnections() {
      var sx = centerX;
      var sy = centerY + centerH / 2;
      sectionNodes.forEach(function (s) {
        var tx = s.x + s.w / 2;
        var ty = s.y;
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        var midY = (sy + ty) / 2;
        ctx.bezierCurveTo(sx, midY + 20, tx, midY - 20, tx, ty);
        ctx.stroke();
        // 入段小箭头
        drawArrow(ctx, tx, ty - 12, tx, ty, s.color, 2);
      });
    }

    // 顶部主题中心：深色渐变卡片
    function drawCenter() {
      var cx = centerX - centerW / 2;
      var cy = centerY - centerH / 2;
      var grad = ctx.createLinearGradient(cx, cy, cx, cy + centerH);
      grad.addColorStop(0, '#2c3e50');
      grad.addColorStop(1, '#34495e');
      roundRect(ctx, cx, cy, centerW, centerH, 12, grad, true);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold ' + Math.max(18, Math.round(centerH * 0.34)) + 'px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('主题：' + params.theme, centerX, centerY - 8);

      ctx.font = '13px "Microsoft YaHei", sans-serif';
      ctx.fillStyle = '#bdc3c7';
      ctx.fillText('议论文结构图 · 五段式', centerX, centerY + 16);
    }

    // 段落节点（彩色色块 + 序号圆点 + 标题 + 字数）
    function drawSections() {
      sectionNodes.forEach(function (s, i) {
        var grad = ctx.createLinearGradient(s.x, s.y, s.x, s.y + s.h);
        grad.addColorStop(0, s.color);
        grad.addColorStop(1, shadeColor(s.color, -15));
        roundRect(ctx, s.x, s.y, s.w, s.h, 10, grad, true);

        // 序号圆点
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(s.x + 22, s.y + 22, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = s.color;
        ctx.font = 'bold 15px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(i + 1), s.x + 22, s.y + 22);

        // 段落标题（窄列时自动缩小字号）
        ctx.fillStyle = '#ffffff';
        var titleFont = s.w < 160 ? 13 : 16;
        ctx.font = 'bold ' + titleFont + 'px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(s.title, s.x + 44, s.y + 22);

        // 字数
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.font = '12px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('约 ' + s.wordCount + ' 字', s.x + s.w / 2, s.y + s.h - 20);
      });
    }

    // 要点卡片：白底 + 左侧色条 + keyPoints 列表（自动换行）
    function drawDetails() {
      sectionNodes.forEach(function (s) {
        var dx = s.x;
        var dy = detailY;

        // 与上方段落节点的虚线连接
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(s.x + s.w / 2, s.y + s.h);
        ctx.lineTo(dx + detailW / 2, dy);
        ctx.stroke();
        ctx.setLineDash([]);

        // 卡片背景
        roundRect(ctx, dx, dy, detailW, detailH, 8, '#ffffff', true, s.color);
        // 左侧色条
        ctx.fillStyle = s.color;
        ctx.fillRect(dx, dy + 4, 6, detailH - 8);

        // 卡片标题
        ctx.fillStyle = s.color;
        ctx.font = 'bold 13px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('要点 Key Points', dx + 14, dy + 10);

        // 分隔线
        ctx.strokeStyle = '#ecf0f3';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(dx + 14, dy + 30);
        ctx.lineTo(dx + detailW - 14, dy + 30);
        ctx.stroke();

        // 要点条目
        ctx.font = '13px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        var yy = dy + 42;
        s.keyPoints.forEach(function (kp) {
          // 圆点
          ctx.fillStyle = s.color;
          ctx.beginPath();
          ctx.arc(dx + 20, yy + 7, 3.5, 0, Math.PI * 2);
          ctx.fill();
          // 文本（自动换行）
          ctx.fillStyle = '#34495e';
          var maxW = detailW - 36;
          var endY = wrapText(ctx, String(kp), dx + 30, yy, maxW, 18);
          yy = endY + 12;
        });
      });
    }

    // 底部论证脉络：流程箭头 + 字数占比堆叠条形图
    function drawFlow() {
      var firstNode = sectionNodes[0];
      var lastNode = sectionNodes[n - 1];
      var startX = firstNode.x + firstNode.w / 2;
      var endX = lastNode.x + lastNode.w / 2;

      // 主流程箭头线
      ctx.strokeStyle = '#bdc3c7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(startX, flowY);
      ctx.lineTo(endX, flowY);
      ctx.stroke();
      // 箭头头
      drawArrow(ctx, endX - 60, flowY, endX, flowY, '#7f8c8d', 2);

      // 起止标签
      ctx.fillStyle = '#7f8c8d';
      ctx.font = 'italic 13px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('引入', startX, flowY + 20);
      ctx.fillText('升华', endX, flowY + 20);

      // 总字数标题
      var total = sections.reduce(function (a, s) { return a + s.wordCount; }, 0);
      ctx.fillStyle = '#5a6c7d';
      ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('论证脉络（总字数 ' + total + ' 字）', W / 2, flowY - 30);

      // 字数比例堆叠条形图
      var barY = flowY + 50;
      var barX = startX;
      var barW = endX - startX;
      var barH = 16;
      var acc = 0;
      sections.forEach(function (s) {
        var segW = total > 0 ? (s.wordCount / total) * barW : 0;
        ctx.fillStyle = s.color;
        ctx.fillRect(barX + acc, barY, segW, barH);
        // 百分比标签（仅当段宽足够时显示）
        ctx.fillStyle = '#fff';
        ctx.font = '11px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        var pct = total > 0 ? Math.round(s.wordCount / total * 100) : 0;
        if (segW > 40) ctx.fillText(pct + '%', barX + acc + segW / 2, barY + barH / 2);
        acc += segW;
      });
      // 边框
      ctx.strokeStyle = '#bdc3c7';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barW, barH);
    }
  }

  return { validate: validate, render: render };
})();

window.EssayStructureRenderer = EssayStructureRenderer;
