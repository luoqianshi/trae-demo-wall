/**
 * 遗传图解渲染器 —— 豌豆杂交实验（分离定律）
 * 纯 Canvas 2D API 实现，自适应 canvas 尺寸，不依赖任何外部库。
 *
 * 导出全局对象：window.GeneticDiagramRenderer
 *   - validate(params): boolean  校验 params.generations 为数组且长度 ≥ 2
 *   - render(ctx, params, canvas): void  在 canvas 上绘制遗传图解
 */
var GeneticDiagramRenderer = (function () {
  'use strict';

  // 原始设计基准尺寸（仅用作按比例缩放的参考，不作为输出硬编码尺寸）
  var BASE_W = 1000;
  var BASE_H = 820;

  // 颜色配置
  var COLORS = {
    dominant: '#27ae60',          // 显性 D（高茎）
    recessive: '#e67e22',         // 隐性 d（矮茎）
    f1: '#2980b9',                // F1 杂合子
    cross: '#c0392b',             // 杂交 / 受精符号
    self: '#8e44ad',              // 自交标记
    title: '#34495e',             // 各级标题
    text: '#2c3e50',              // 正文
    gray: '#7f8c8d',              // 辅助说明
    border: '#bdc3c7',            // 棋盘格边框
    legendBorder: '#dfe4ea',      // 图例边框
    conclusionBg: '#fef9e7',      // 结论框背景
    conclusionBorder: '#f39c12',  // 结论框边框
    conclusionText: '#b9770e'     // 结论框文字
  };

  /**
   * 校验参数
   * @param {object} params - { generations:[{generation,genotype,phenotype,ratio}], inheritanceType }
   * @returns {boolean} generations 为数组且长度 ≥ 2 时返回 true
   */
  function validate(params) {
    return !!params &&
      Array.isArray(params.generations) &&
      params.generations.length >= 2;
  }

  /**
   * 渲染遗传图解
   * @param {CanvasRenderingContext2D} ctx
   * @param {object} params - { generations, inheritanceType }
   * @param {HTMLCanvasElement} canvas
   */
  function render(ctx, params, canvas) {
    var W = canvas.width;
    var H = canvas.height;

    // 统一缩放比例（保持原始比例并居中绘制，自适应任意 canvas 尺寸）
    var s = Math.min(W / BASE_W, H / BASE_H);
    var ox = (W - BASE_W * s) / 2;
    var oy = (H - BASE_H * s) / 2;

    // 坐标转换：原始设计坐标 → 实际 canvas 坐标
    function tx(x) { return ox + x * s; }
    function ty(y) { return oy + y * s; }
    // 尺寸缩放
    function ts(v) { return v * s; }
    // 字体字符串构造（字号随缩放变化）
    function font(weight, size, family) {
      return (weight ? weight + ' ' : '') + (+ts(size).toFixed(2)) + 'px ' + family;
    }

    // ============ 工具函数 ============
    // 圆角矩形
    function roundRect(x, y, w, h, r, fill, strokeColor, lineWidth) {
      var X = tx(x), Y = ty(y), Wd = ts(w), Hd = ts(h), R = ts(r);
      ctx.beginPath();
      ctx.moveTo(X + R, Y);
      ctx.arcTo(X + Wd, Y, X + Wd, Y + Hd, R);
      ctx.arcTo(X + Wd, Y + Hd, X, Y + Hd, R);
      ctx.arcTo(X, Y + Hd, X, Y, R);
      ctx.arcTo(X, Y, X + Wd, Y, R);
      ctx.closePath();
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (strokeColor) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = ts(lineWidth || 1.5);
        ctx.stroke();
      }
    }

    // 箭头
    function drawArrow(x1, y1, x2, y2, color, width) {
      width = width || 2;
      var headLen = ts(12);
      var ang = Math.atan2(y2 - y1, x2 - x1);
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = ts(width);
      ctx.beginPath();
      ctx.moveTo(tx(x1), ty(y1));
      ctx.lineTo(tx(x2) - headLen * Math.cos(ang) * 0.6, ty(y2) - headLen * Math.sin(ang) * 0.6);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(tx(x2), ty(y2));
      ctx.lineTo(tx(x2) - headLen * Math.cos(ang - Math.PI / 7), ty(y2) - headLen * Math.sin(ang - Math.PI / 7));
      ctx.lineTo(tx(x2) - headLen * Math.cos(ang + Math.PI / 7), ty(y2) - headLen * Math.sin(ang + Math.PI / 7));
      ctx.closePath();
      ctx.fill();
    }

    // 虚线 / 实线
    function drawLine(x1, y1, x2, y2, color, width, dash) {
      ctx.strokeStyle = color;
      ctx.lineWidth = ts(width || 1.5);
      if (dash) {
        ctx.setLineDash(dash.map(function (d) { return ts(d); }));
      } else {
        ctx.setLineDash([]);
      }
      ctx.beginPath();
      ctx.moveTo(tx(x1), ty(y1));
      ctx.lineTo(tx(x2), ty(y2));
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // ============ 个体卡片 ============
    function drawOrganism(cx, cy, genotype, phenotype, color, label) {
      var w = 150, h = 92;
      var x = cx - w / 2, y = cy - h / 2;
      // 卡片
      roundRect(x, y, w, h, 10, '#ffffff', color, 2);
      // 顶部色条（顶部圆角、底部方角）
      ctx.fillStyle = color;
      roundRect(x, y, w, 22, 10, color);
      ctx.fillRect(tx(x), ty(y + 12), ts(w), ts(10));
      // 标签
      ctx.fillStyle = '#fff';
      ctx.font = font('bold', 12, '"Microsoft YaHei", sans-serif');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, tx(cx), ty(y + 11));
      // 基因型
      ctx.fillStyle = COLORS.text;
      ctx.font = font('bold', 22, '"Times New Roman", serif');
      ctx.fillText(genotype, tx(cx), ty(y + 50));
      // 表现型
      ctx.fillStyle = color;
      ctx.font = font('', 13, '"Microsoft YaHei", sans-serif');
      ctx.fillText(phenotype, tx(cx), ty(y + 75));
    }

    // ============ 配子小圆 ============
    function drawGamete(cx, cy, gene, color) {
      var r = ts(18);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(tx(cx), ty(cy), r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = ts(2);
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = font('bold', 16, '"Times New Roman", serif');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(gene, tx(cx), ty(cy));
    }

    // ============ 图例 ============
    function drawLegend() {
      var lx = 40, ly = 60;
      roundRect(lx, ly, 200, 90, 6, '#fff', COLORS.legendBorder, 1);

      ctx.fillStyle = COLORS.title;
      ctx.font = font('bold', 12, '"Microsoft YaHei", sans-serif');
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('图例', tx(lx + 12), ty(ly + 14));

      var items = [
        { color: COLORS.dominant, label: 'D — 显性（高茎）' },
        { color: COLORS.recessive, label: 'd — 隐性（矮茎）' },
        { color: COLORS.f1, label: 'F₁ 杂合子 Dd' }
      ];
      items.forEach(function (it, i) {
        var yy = ly + 34 + i * 18;
        ctx.fillStyle = it.color;
        ctx.beginPath();
        ctx.arc(tx(lx + 18), ty(yy), ts(5), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#34495e';
        ctx.font = font('', 11, '"Microsoft YaHei", sans-serif');
        ctx.fillText(it.label, tx(lx + 30), ty(yy));
      });
    }

    // ============ 亲代 P ============
    function drawP() {
      var y = 130;
      // 标题
      ctx.fillStyle = COLORS.title;
      ctx.font = font('bold', 16, '"Microsoft YaHei", sans-serif');
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('亲本 P', tx(40), ty(y - 70));

      // 左亲本 DD 高茎
      drawOrganism(220, y, 'DD', '高茎', COLORS.dominant, '♀ 高茎');
      // 右亲本 dd 矮茎
      drawOrganism(620, y, 'dd', '矮茎', COLORS.recessive, '♂ 矮茎');

      // × 符号
      ctx.fillStyle = COLORS.cross;
      ctx.font = font('bold', 36, '"Segoe UI", sans-serif');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('×', tx(420), ty(y));

      // 配子箭头与配子
      // 左亲本 → D 配子
      drawArrow(295, y + 30, 360, y + 90, COLORS.dominant, 2);
      drawGamete(380, y + 100, 'D', COLORS.dominant);
      // 右亲本 → d 配子
      drawArrow(545, y + 30, 480, y + 90, COLORS.recessive, 2);
      drawGamete(460, y + 100, 'd', COLORS.recessive);

      // 配子标签
      ctx.fillStyle = COLORS.gray;
      ctx.font = font('italic', 12, '"Microsoft YaHei", sans-serif');
      ctx.textAlign = 'center';
      ctx.fillText('配子', tx(380), ty(y + 130));
      ctx.fillText('配子', tx(460), ty(y + 130));
    }

    // ============ 子一代 F1 ============
    function drawF1() {
      var y = 320;
      ctx.fillStyle = COLORS.title;
      ctx.font = font('bold', 16, '"Microsoft YaHei", sans-serif');
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('子一代 F₁', tx(40), ty(y - 70));

      // 两个配子汇聚受精 → F1
      drawArrow(380, 245, 420, y - 50, COLORS.dominant, 1.8);
      drawArrow(460, 245, 420, y - 50, COLORS.recessive, 1.8);

      // 受精标记
      ctx.fillStyle = COLORS.cross;
      ctx.font = font('bold', 14, '"Microsoft YaHei", sans-serif');
      ctx.textAlign = 'center';
      ctx.fillText('受精', tx(420), ty(y - 65));

      // F1 个体（杂合子 Dd，全为高茎）
      drawOrganism(420, y, 'Dd', '高茎（100%）', COLORS.f1, 'F₁ 高茎');

      // F1 自交标记
      ctx.fillStyle = COLORS.self;
      ctx.font = font('italic', 13, '"Microsoft YaHei", sans-serif');
      ctx.textAlign = 'center';
      ctx.fillText('↓ 自交（F₁ × F₁）', tx(420), ty(y + 65));
    }

    // ============ F1 配子 ============
    function drawF1Gametes() {
      var y = 470;
      // F1（Dd）产生 D、d 两种配子，比例 1:1
      drawArrow(420, 385, 360, y - 30, COLORS.f1, 1.8);
      drawArrow(420, 385, 480, y - 30, COLORS.f1, 1.8);

      drawGamete(360, y, 'D', COLORS.dominant);
      drawGamete(480, y, 'd', COLORS.recessive);

      ctx.fillStyle = COLORS.gray;
      ctx.font = font('italic', 12, '"Microsoft YaHei", sans-serif');
      ctx.textAlign = 'center';
      ctx.fillText('配子 D (50%)', tx(360), ty(y + 32));
      ctx.fillText('配子 d (50%)', tx(480), ty(y + 32));
    }

    // ============ F2 棋盘格（Punnett Square） ============
    function drawPunnett() {
      var y = 560;
      var cellSize = 50;
      var startX = 360, startY = y;

      // 标题
      ctx.fillStyle = COLORS.title;
      ctx.font = font('bold', 14, '"Microsoft YaHei", sans-serif');
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('F₂ 棋盘格', tx(40), ty(y - 10));

      // 列标签（雌配子）
      ctx.fillStyle = COLORS.dominant;
      ctx.font = font('bold', 16, '"Times New Roman", serif');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('D', tx(startX + cellSize + cellSize / 2), ty(startY - 12));
      ctx.fillText('d', tx(startX + cellSize * 2 + cellSize / 2), ty(startY - 12));
      // 行标签（雄配子）
      ctx.fillStyle = COLORS.recessive;
      ctx.fillText('D', tx(startX - 14), ty(startY + cellSize + cellSize / 2));
      ctx.fillText('d', tx(startX - 14), ty(startY + cellSize * 2 + cellSize / 2));

      // 配子箭头
      drawArrow(360, 502, startX + cellSize + cellSize / 2, startY - 2, COLORS.dominant, 1.2);
      drawArrow(480, 502, startX + cellSize * 2 + cellSize / 2, startY - 2, COLORS.recessive, 1.2);

      // 四个格子（四种组合）
      var cells = [
        { gene: 'DD', color: COLORS.dominant, pheno: '高茎' },
        { gene: 'Dd', color: COLORS.dominant, pheno: '高茎' },
        { gene: 'Dd', color: COLORS.dominant, pheno: '高茎' },
        { gene: 'dd', color: COLORS.recessive, pheno: '矮茎' }
      ];
      var idx = 0;
      for (var r = 0; r < 2; r++) {
        for (var c = 0; c < 2; c++) {
          var cx = startX + cellSize + c * cellSize;
          var cy = startY + cellSize + r * cellSize;
          var cell = cells[idx++];
          // 背景
          ctx.fillStyle = cell.color + '22';
          ctx.fillRect(tx(cx), ty(cy), ts(cellSize), ts(cellSize));
          // 边框
          ctx.strokeStyle = COLORS.border;
          ctx.lineWidth = ts(1);
          ctx.strokeRect(tx(cx), ty(cy), ts(cellSize), ts(cellSize));
          // 基因型
          ctx.fillStyle = cell.color;
          ctx.font = font('bold', 18, '"Times New Roman", serif');
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(cell.gene, tx(cx + cellSize / 2), ty(cy + cellSize / 2 - 6));
          // 表现型
          ctx.fillStyle = COLORS.gray;
          ctx.font = font('', 10, '"Microsoft YaHei", sans-serif');
          ctx.fillText(cell.pheno, tx(cx + cellSize / 2), ty(cy + cellSize / 2 + 14));
        }
      }
      // 外框
      ctx.strokeStyle = COLORS.title;
      ctx.lineWidth = ts(1.5);
      ctx.strokeRect(tx(startX + cellSize), ty(startY + cellSize), ts(cellSize * 2), ts(cellSize * 2));
    }

    // ============ F2 结果与比例 ============
    function drawF2Result() {
      var y = 730;
      // 标题
      ctx.fillStyle = COLORS.title;
      ctx.font = font('bold', 16, '"Microsoft YaHei", sans-serif');
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('子二代 F₂', tx(40), ty(y - 30));

      // 比例饼图
      var pieX = tx(760), pieY = ty(y), pieR = ts(50);
      // 高茎 3/4
      ctx.fillStyle = COLORS.dominant;
      ctx.beginPath();
      ctx.moveTo(pieX, pieY);
      ctx.arc(pieX, pieY, pieR, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * 0.75);
      ctx.closePath();
      ctx.fill();
      // 矮茎 1/4
      ctx.fillStyle = COLORS.recessive;
      ctx.beginPath();
      ctx.moveTo(pieX, pieY);
      ctx.arc(pieX, pieY, pieR, -Math.PI / 2 + Math.PI * 2 * 0.75, -Math.PI / 2);
      ctx.closePath();
      ctx.fill();
      // 边框
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = ts(2);
      ctx.beginPath();
      ctx.arc(pieX, pieY, pieR, 0, Math.PI * 2);
      ctx.stroke();
      // 标签
      ctx.fillStyle = '#fff';
      ctx.font = font('bold', 14, '"Segoe UI", sans-serif');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('75%', pieX - ts(18), pieY - ts(8));
      ctx.fillText('25%', pieX + ts(22), pieY + ts(18));

      // 表现型比
      ctx.fillStyle = COLORS.text;
      ctx.font = font('bold', 14, '"Microsoft YaHei", sans-serif');
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('表现型比：', tx(220), ty(y - 18));
      ctx.fillStyle = COLORS.dominant;
      ctx.font = font('bold', 18, '"Microsoft YaHei", sans-serif');
      ctx.fillText('高茎 3', tx(300), ty(y - 18));
      ctx.fillStyle = COLORS.text;
      ctx.fillText(' : ', tx(360), ty(y - 18));
      ctx.fillStyle = COLORS.recessive;
      ctx.fillText('矮茎 1', tx(385), ty(y - 18));

      // 基因型比
      ctx.fillStyle = COLORS.text;
      ctx.font = font('bold', 14, '"Microsoft YaHei", sans-serif');
      ctx.fillText('基因型比：', tx(220), ty(y + 14));
      ctx.fillStyle = COLORS.dominant;
      ctx.font = font('bold', 14, '"Times New Roman", serif');
      ctx.fillText('1 DD', tx(300), ty(y + 14));
      ctx.fillStyle = COLORS.text;
      ctx.fillText(':', tx(355), ty(y + 14));
      ctx.fillStyle = COLORS.f1;
      ctx.fillText('2 Dd', tx(372), ty(y + 14));
      ctx.fillStyle = COLORS.text;
      ctx.fillText(':', tx(425), ty(y + 14));
      ctx.fillStyle = COLORS.recessive;
      ctx.fillText('1 dd', tx(442), ty(y + 14));

      // 分离定律结论框
      roundRect(540, y - 28, 180, 56, 6, COLORS.conclusionBg, COLORS.conclusionBorder, 1.5);
      ctx.fillStyle = COLORS.conclusionText;
      ctx.font = font('bold', 12, '"Microsoft YaHei", sans-serif');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('分离定律', tx(630), ty(y - 14));
      ctx.font = font('', 11, '"Microsoft YaHei", sans-serif');
      ctx.fillText('杂合子自交后代', tx(630), ty(y + 4));
      ctx.fillText('出现 3:1 性状分离', tx(630), ty(y + 18));
    }

    // 清空画布
    ctx.clearRect(0, 0, W, H);

    // 依次绘制各部分
    drawLegend();
    drawP();
    drawF1();
    drawF1Gametes();
    drawPunnett();
    drawF2Result();
  }

  return { validate: validate, render: render };
})();

window.GeneticDiagramRenderer = GeneticDiagramRenderer;
