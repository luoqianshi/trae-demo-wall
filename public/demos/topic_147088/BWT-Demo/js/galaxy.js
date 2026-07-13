/**
 * BWTGalaxy - Canvas 星系可视化组件
 *
 * 将评测框架以星座/星系地图的形式呈现，每颗"星星"代表一个评测框架，
 * 星星之间根据使用相似度连线，形成可探索的框架市场可视化。
 *
 * 依赖: 无外部依赖，纯 Canvas 2D 实现
 */

;(function () {
  'use strict';

  /* ==============================
   * 常量与配置
   * ============================== */

  // 类别配色方案
  var CATEGORY_COLORS = {
    '数码': '#00D4AA',   // 翡翠绿
    '家居': '#7B829E',   // 柔蓝
    '运动': '#FFB84D',   // 琥珀黄
    '母婴': '#FF9EC6',   // 粉红
    '美妆': '#C084FC',   // 浅紫
    '食品': '#4ADE80'    // 绿色
  };
  var DEFAULT_COLOR = '#7B829E';

  // 内置示例数据：评测框架条目
  var SAMPLE_DATA = [
    { name: '手机评测框架',   category: '数码', usage: 12400, rating: 4.8, size: 7 },
    { name: '耳机选购指南',   category: '数码', usage: 8900,  rating: 4.6, size: 6 },
    { name: '平板电脑评估',   category: '数码', usage: 7200,  rating: 4.5, size: 6 },
    { name: '智能手表评测',   category: '数码', usage: 5100,  rating: 4.3, size: 5 },
    { name: '笔记本选购',     category: '数码', usage: 4300,  rating: 4.4, size: 5 },

    { name: '床垫舒适度评估', category: '家居', usage: 6800,  rating: 4.7, size: 6 },
    { name: '空气净化器对比', category: '家居', usage: 5200,  rating: 4.5, size: 5 },
    { name: '灯具照明评测',   category: '家居', usage: 3100,  rating: 4.2, size: 4 },
    { name: '厨房电器选购',   category: '家居', usage: 4600,  rating: 4.6, size: 5 },

    { name: '跑鞋性能评估',   category: '运动', usage: 5600,  rating: 4.7, size: 5 },
    { name: '瑜伽垫评测',     category: '运动', usage: 3800,  rating: 4.4, size: 4 },
    { name: '运动手环对比',   category: '运动', usage: 4200,  rating: 4.3, size: 5 },

    { name: '婴儿推车评测',   category: '母婴', usage: 7800,  rating: 4.8, size: 7 },
    { name: '奶粉安全评估',   category: '母婴', usage: 9200,  rating: 4.9, size: 7 },
    { name: '儿童安全座椅',   category: '母婴', usage: 5500,  rating: 4.6, size: 5 },

    { name: '精华液评测',     category: '美妆', usage: 8500,  rating: 4.7, size: 6 },
    { name: '防晒霜测评',     category: '美妆', usage: 6300,  rating: 4.5, size: 6 },
    { name: '口红选购指南',   category: '美妆', usage: 4900,  rating: 4.4, size: 5 },

    { name: '咖啡豆评测',     category: '食品', usage: 3200,  rating: 4.6, size: 4 },
    { name: '零食健康评估',   category: '食品', usage: 4100,  rating: 4.3, size: 4 }
  ];

  // 填充至约 40 颗星星（自动补充低热度框架）
  var EXTRA_DATA = [
    { name: '充电宝评测',     category: '数码', usage: 2800,  rating: 4.1, size: 3 },
    { name: '显示器对比',     category: '数码', usage: 3500,  rating: 4.3, size: 4 },
    { name: '机械键盘评测',   category: '数码', usage: 4100,  rating: 4.5, size: 4 },
    { name: '路由器选购',     category: '数码', usage: 2600,  rating: 4.0, size: 3 },
    { name: '投影仪评测',     category: '数码', usage: 3000,  rating: 4.2, size: 3 },
    { name: '沙发舒适评测',   category: '家居', usage: 3700,  rating: 4.4, size: 4 },
    { name: '扫地机器人评估', category: '家居', usage: 5800,  rating: 4.6, size: 5 },
    { name: '净水器对比',     category: '家居', usage: 2900,  rating: 4.2, size: 3 },
    { name: '健身器材评测',   category: '运动', usage: 2500,  rating: 4.1, size: 3 },
    { name: '羽毛球拍选购',   category: '运动', usage: 1800,  rating: 4.0, size: 3 },
    { name: '游泳装备评测',   category: '运动', usage: 2100,  rating: 4.2, size: 3 },
    { name: '纸尿裤评测',     category: '母婴', usage: 6000,  rating: 4.5, size: 5 },
    { name: '儿童玩具评估',   category: '母婴', usage: 3200,  rating: 4.3, size: 4 },
    { name: '面霜评测',       category: '美妆', usage: 3700,  rating: 4.4, size: 4 },
    { name: '洗发水测评',     category: '美妆', usage: 2800,  rating: 4.2, size: 3 },
    { name: '茶叶评测',       category: '食品', usage: 2200,  rating: 4.3, size: 3 },
    { name: '蜂蜜品质评估',   category: '食品', usage: 1600,  rating: 4.1, size: 3 },
    { name: '橄榄油对比',     category: '食品', usage: 1900,  rating: 4.2, size: 3 },
    { name: '奶粉冲泡评测',   category: '母婴', usage: 2400,  rating: 4.4, size: 3 },
    { name: '蓝牙音箱评测',   category: '数码', usage: 3400,  rating: 4.3, size: 4 }
  ];

  /* ==============================
   * 工具函数
   * ============================== */

  /**
   * 获取类别对应的颜色
   * @param {string} category
   * @returns {string}
   */
  function getCategoryColor(category) {
    return CATEGORY_COLORS[category] || DEFAULT_COLOR;
  }

  /**
   * 将十六进制颜色转为 RGBA 字符串
   * @param {string} hex - 如 '#00D4AA'
   * @param {number} alpha - 0-1
   * @returns {string}
   */
  function hexToRgba(hex, alpha) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }

  /**
   * 判断是否为移动端
   * @returns {boolean}
   */
  function isMobile() {
    return typeof window !== 'undefined' && window.innerWidth < 768;
  }

  /**
   * 随机数：[min, max)
   */
  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  /* ==============================
   * BWTGalaxy 类
   * ============================== */

  /**
   * @constructor
   * @param {HTMLCanvasElement} canvas - 目标画布元素
   * @param {Object} [config] - 可选配置
   * @param {Array} [config.data] - 自定义框架数据（缺省时使用内置示例）
   * @param {number} [config.starCount] - 星星数量（桌面默认40，移动端20）
   * @param {number} [config.rotationSpeed] - 自动旋转速度（弧度/帧）
   * @param {number} [config.connectionDistance] - 连线最大距离
   * @param {number} [config.hoverRadius] - 鼠标悬停感应半径
   */
  function BWTGalaxy(canvas, config) {
    if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
      throw new Error('BWTGalaxy: 需要传入一个 HTMLCanvasElement');
    }

    config = config || {};
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // 配置
    this._mobile = isMobile();
    this._starCount = config.starCount || (this._mobile ? 20 : 40);
    this._rotationSpeed = config.rotationSpeed !== undefined
      ? config.rotationSpeed
      : (this._mobile ? 0 : 0.001);          // 移动端禁用自动旋转
    this._connectionDistance = config.connectionDistance || 150;
    this._hoverRadius = config.hoverRadius || 80;

    // 状态
    this._rotation = 0;                       // 当前旋转角度
    this._paused = false;                     // 鼠标悬停暂停旋转
    this._hoveredStar = null;                 // 当前悬停的星星
    this._selectedStar = null;                // 当前点击选中的星星
    this._selectedPulse = 0;                  // 选中脉冲动画计数
    this._animFrameId = null;                 // rAF ID
    this._mouseX = -9999;
    this._mouseY = -9999;
    this._time = 0;                           // 全局时间计数

    // 绑定事件（使用绑定引用以便移除）
    this._boundResize = this._onResize.bind(this);
    this._boundMouseMove = this._onMouseMove.bind(this);
    this._boundMouseLeave = this._onMouseLeave.bind(this);
    this._boundClick = this._onClick.bind(this);

    // 初始化星星数据
    this._initData(config.data);

    // 首次尺寸设定
    this._resizeCanvas();

    // 生成星星分布
    this._generateStars();

    // 预计算连线
    this._computeConnections();

    // 绑定 DOM 事件
    this._bindEvents();

    // 启动动画循环
    this._startLoop();
  }

  /* ---- 数据初始化 ---- */

  /**
   * 初始化框架数据，截取或填充至目标星星数量
   */
  BWTGalaxy.prototype._initData = function (customData) {
    var allData = customData || SAMPLE_DATA.concat(EXTRA_DATA);
    this._data = allData.slice(0, this._starCount);
  };

  /* ---- 画布尺寸 ---- */

  /**
   * 设置画布尺寸（处理高 DPI）
   */
  BWTGalaxy.prototype._resizeCanvas = function () {
    var parent = this.canvas.parentElement;
    var w = parent ? parent.clientWidth : this.canvas.clientWidth;
    var h = parent ? parent.clientHeight : this.canvas.clientHeight;
    var dpr = window.devicePixelRatio || 1;

    this._width = w;
    this._height = h;
    this._dpr = dpr;

    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 中心点
    this._cx = w / 2;
    this._cy = h / 2;
  };

  /* ---- 星星生成 ---- */

  /**
   * 在画布上以近似圆形星系分布生成星星
   * 中心区域密度更高
   */
  BWTGalaxy.prototype._generateStars = function () {
    var stars = [];
    var cx = this._cx;
    var cy = this._cy;
    var maxR = Math.min(cx, cy) * 0.75;  // 星系最大半径
    var dataLen = this._data.length;

    for (var i = 0; i < dataLen; i++) {
      var d = this._data[i];

      // 使用平方根分布使中心更密集
      var distRatio = Math.pow(Math.random(), 0.6);  // 0~1，偏向小值
      var dist = distRatio * maxR;
      var angle = Math.random() * Math.PI * 2;

      // 越靠近中心的星星亮度越高
      var brightnessBase = 1 - distRatio * 0.5;      // 0.5~1
      var brightness = Math.max(0.4, Math.min(0.9, brightnessBase + (d.rating - 4.0) * 0.15));

      var star = {
        // 数据属性
        name: d.name,
        category: d.category,
        usage: d.usage,
        rating: d.rating,
        color: getCategoryColor(d.category),

        // 空间属性（相对于中心的极坐标）
        distRatio: distRatio,
        dist: dist,
        angle: angle,

        // 视觉属性
        baseRadius: d.size,
        radius: d.size,
        brightness: brightness,

        // 动画状态
        driftAngle: Math.random() * Math.PI * 2,         // 漂移方向
        driftSpeed: rand(0.05, 0.15),                      // 漂移速度 px/帧
        twinklePhase: Math.random() * Math.PI * 2,         // 闪烁相位
        twinkleSpeed: rand(0.02, 0.06),                    // 闪烁速率
        isPopular: brightness > 0.7                         // 是否为热门框架
      };

      stars.push(star);
    }

    this._stars = stars;
  };

  /* ---- 连线计算 ---- */

  /**
   * 预计算星星之间的连线关系
   * 以极坐标距离为基准（旋转时距离不变，无需重新计算）
   */
  BWTGalaxy.prototype._computeConnections = function () {
    var connections = [];
    var stars = this._stars;
    var len = stars.length;
    var maxDist = this._connectionDistance;

    for (var i = 0; i < len; i++) {
      for (var j = i + 1; j < len; j++) {
        var a = stars[i];
        var b = stars[j];

        // 使用极坐标径向距离差作为简化距离
        var dAngle = Math.abs(a.angle - b.angle);
        if (dAngle > Math.PI) dAngle = Math.PI * 2 - dAngle;
        var dist = Math.sqrt(
          Math.pow(a.dist - b.dist, 2) +
          Math.pow(dAngle * Math.max(a.dist, b.dist), 2)
        );

        if (dist < maxDist) {
          // 连线透明度：越近越明显
          var opacity = 0.05 + 0.10 * (1 - dist / maxDist);
          // 使用两颗星中较暗的颜色
          var dimColor = a.brightness < b.brightness ? a.color : b.color;
          // 贝塞尔偏移量
          var curveOffset = rand(-15, 15);

          connections.push({
            a: a,
            b: b,
            opacity: opacity,
            color: dimColor,
            curveOffset: curveOffset
          });
        }
      }
    }

    this._connections = connections;
  };

  /* ---- 星星坐标计算 ---- */

  /**
   * 根据当前旋转角度和漂移偏移计算星星的屏幕坐标
   */
  BWTGalaxy.prototype._getStarPos = function (star) {
    // 当前角度 = 原始角度 + 全局旋转 + 漂移偏移
    var currentAngle = star.angle + this._rotation;
    // 微小漂移
    var driftX = Math.cos(star.driftAngle) * star.driftSpeed * 0.3;
    var driftY = Math.sin(star.driftAngle) * star.driftSpeed * 0.3;

    var x = this._cx + Math.cos(currentAngle) * star.dist + driftX;
    var y = this._cy + Math.sin(currentAngle) * star.dist + driftY;
    return { x: x, y: y };
  };

  /* ---- 绘制 ---- */

  /**
   * 主绘制帧
   */
  BWTGalaxy.prototype._draw = function () {
    var ctx = this.ctx;
    var w = this._width;
    var h = this._height;

    // 清空画布
    ctx.clearRect(0, 0, w, h);

    // 绘制背景（微弱径向渐变，营造深空氛围）
    this._drawBackground(ctx, w, h);

    // 绘制连线
    this._drawConnections(ctx);

    // 绘制星星
    this._drawStars(ctx);

    // 绘制悬停提示
    this._drawTooltip(ctx);

    // 绘制选中信息卡
    this._drawInfoCard(ctx);
  };

  /**
   * 绘制深空背景
   */
  BWTGalaxy.prototype._drawBackground = function (ctx, w, h) {
    var gradient = ctx.createRadialGradient(
      this._cx, this._cy, 0,
      this._cx, this._cy, Math.max(w, h) * 0.7
    );
    gradient.addColorStop(0, 'rgba(15,20,35,0.6)');
    gradient.addColorStop(0.5, 'rgba(10,14,25,0.3)');
    gradient.addColorStop(1, 'rgba(5,8,18,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  };

  /**
   * 绘制星星之间的连线（二次贝塞尔曲线）
   */
  BWTGalaxy.prototype._drawConnections = function (ctx) {
    var connections = this._connections;

    for (var i = 0; i < connections.length; i++) {
      var c = connections[i];
      var posA = this._getStarPos(c.a);
      var posB = this._getStarPos(c.b);

      // 计算中点及垂直偏移（用于曲线）
      var midX = (posA.x + posB.x) / 2;
      var midY = (posA.y + posB.y) / 2;
      // 垂直方向偏移
      var dx = posB.x - posA.x;
      var dy = posB.y - posA.y;
      var perpX = -dy;
      var perpY = dx;
      var perpLen = Math.sqrt(perpX * perpX + perpY * perpY) || 1;
      var ctrlX = midX + (perpX / perpLen) * c.curveOffset;
      var ctrlY = midY + (perpY / perpLen) * c.curveOffset;

      ctx.beginPath();
      ctx.moveTo(posA.x, posA.y);
      ctx.quadraticCurveTo(ctrlX, ctrlY, posB.x, posB.y);
      ctx.strokeStyle = hexToRgba(c.color, c.opacity);
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }
  };

  /**
   * 绘制所有星星
   */
  BWTGalaxy.prototype._drawStars = function (ctx) {
    var stars = this._stars;
    var time = this._time;

    for (var i = 0; i < stars.length; i++) {
      var star = stars[i];
      var pos = this._getStarPos(star);

      // 计算与鼠标距离
      var dx = this._mouseX - pos.x;
      var dy = this._mouseY - pos.y;
      var mouseDist = Math.sqrt(dx * dx + dy * dy);
      var isNearMouse = mouseDist < this._hoverRadius;

      // 闪烁效果（不受欢迎的星星闪烁更明显）
      var twinkleAmount = star.isPopular ? 0.03 : 0.12;
      var twinkle = Math.sin(time * star.twinkleSpeed + star.twinklePhase) * twinkleAmount;
      var currentBrightness = star.brightness + twinkle;

      // 鼠标靠近时增大并增亮
      var sizeMultiplier = 1;
      var brightMultiplier = 1;
      if (isNearMouse) {
        var proximity = 1 - mouseDist / this._hoverRadius;  // 0~1
        sizeMultiplier = 1 + proximity * 0.6;
        brightMultiplier = 1 + proximity * 0.3;
        // 记录最近鼠标的星星用于悬停
        if (!this._hoveredStar || mouseDist <
            this._starMouseDist(this._hoveredStar)) {
          this._hoveredStar = star;
          this._hoveredStar._pos = pos;
        }
      }

      star._pos = pos;
      var r = Math.max(1, star.baseRadius * sizeMultiplier);
      star._currentRadius = r;
      star._currentBrightness = Math.min(1, currentBrightness * brightMultiplier);

      // 热门星星的光晕效果
      if (star.isPopular) {
        var glowR = r * 3.5;
        var glow = ctx.createRadialGradient(pos.x, pos.y, r * 0.5, pos.x, pos.y, glowR);
        glow.addColorStop(0, hexToRgba(star.color, 0.15 * star._currentBrightness));
        glow.addColorStop(0.5, hexToRgba(star.color, 0.05 * star._currentBrightness));
        glow.addColorStop(1, hexToRgba(star.color, 0));
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, glowR, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
      }

      // 星星本体
      var bodyGradient = ctx.createRadialGradient(
        pos.x - r * 0.25, pos.y - r * 0.25, 0,
        pos.x, pos.y, r
      );
      bodyGradient.addColorStop(0, hexToRgba('#ffffff', star._currentBrightness));
      bodyGradient.addColorStop(0.4, hexToRgba(star.color, star._currentBrightness * 0.9));
      bodyGradient.addColorStop(1, hexToRgba(star.color, star._currentBrightness * 0.4));

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
      ctx.fillStyle = bodyGradient;
      ctx.fill();

      // 选中脉冲效果
      if (this._selectedStar === star) {
        var pulseR = r + this._selectedPulse * 15;
        var pulseAlpha = Math.max(0, 0.5 - this._selectedPulse * 0.5);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, pulseR, 0, Math.PI * 2);
        ctx.strokeStyle = hexToRgba(star.color, pulseAlpha);
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
  };

  /**
   * 获取某颗星当前到鼠标的距离
   */
  BWTGalaxy.prototype._starMouseDist = function (star) {
    if (!star._pos) return Infinity;
    var dx = this._mouseX - star._pos.x;
    var dy = this._mouseY - star._pos.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  /**
   * 绘制悬停提示（tooltip）
   */
  BWTGalaxy.prototype._drawTooltip = function (ctx) {
    var star = this._hoveredStar;
    if (!star || !star._pos) return;

    // 检查鼠标是否真的在范围内
    if (this._starMouseDist(star) > this._hoverRadius) {
      this._hoveredStar = null;
      return;
    }

    var pos = star._pos;
    var text = star.name;
    var subText = '使用 ' + star.usage.toLocaleString() + '  |  评分 ' + star.rating;

    ctx.font = '13px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
    var nameWidth = ctx.measureText(text).width;
    ctx.font = '11px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
    var subWidth = ctx.measureText(subText).width;

    var boxW = Math.max(nameWidth, subWidth) + 24;
    var boxH = 52;
    var boxX = pos.x - boxW / 2;
    var boxY = pos.y - star._currentRadius - boxH - 12;

    // 边界修正
    if (boxX < 8) boxX = 8;
    if (boxX + boxW > this._width - 8) boxX = this._width - 8 - boxW;
    if (boxY < 8) boxY = pos.y + star._currentRadius + 12;

    // 背景
    ctx.fillStyle = 'rgba(12,16,28,0.88)';
    this._roundRect(ctx, boxX, boxY, boxW, boxH, 6);
    ctx.fill();

    // 边框
    ctx.strokeStyle = hexToRgba(star.color, 0.4);
    ctx.lineWidth = 0.8;
    this._roundRect(ctx, boxX, boxY, boxW, boxH, 6);
    ctx.stroke();

    // 分类小圆点
    ctx.beginPath();
    ctx.arc(boxX + 12, boxY + 18, 3, 0, Math.PI * 2);
    ctx.fillStyle = star.color;
    ctx.fill();

    // 名称
    ctx.font = '13px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#E8ECF4';
    ctx.fillText(text, boxX + 20, boxY + 22);

    // 副标题
    ctx.font = '11px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillStyle = 'rgba(200,205,220,0.6)';
    ctx.fillText(subText, boxX + 12, boxY + 40);
  };

  /**
   * 绘制点击后的信息卡
   */
  BWTGalaxy.prototype._drawInfoCard = function (ctx) {
    var star = this._selectedStar;
    if (!star || !star._pos) return;

    // 脉冲动画推进
    this._selectedPulse += 0.02;
    if (this._selectedPulse > 1) {
      // 动画结束后短暂停留，2秒后自动关闭
      if (!this._selectedExpire) {
        this._selectedExpire = Date.now() + 2000;
      }
      if (Date.now() > this._selectedExpire) {
        this._selectedStar = null;
        this._selectedPulse = 0;
        this._selectedExpire = null;
        return;
      }
    }

    var pos = star._pos;
    var boxW = 180;
    var boxH = 90;
    var boxX = pos.x + star._currentRadius + 16;
    var boxY = pos.y - boxH / 2;

    // 边界修正
    if (boxX + boxW > this._width - 8) boxX = pos.x - star._currentRadius - 16 - boxW;
    if (boxY < 8) boxY = 8;
    if (boxY + boxH > this._height - 8) boxY = this._height - 8 - boxH;

    // 背景渐变
    var bgGrad = ctx.createLinearGradient(boxX, boxY, boxX + boxW, boxY + boxH);
    bgGrad.addColorStop(0, 'rgba(12,16,28,0.92)');
    bgGrad.addColorStop(1, 'rgba(18,22,38,0.92)');

    ctx.fillStyle = bgGrad;
    this._roundRect(ctx, boxX, boxY, boxW, boxH, 8);
    ctx.fill();

    // 顶部彩色条
    ctx.fillStyle = hexToRgba(star.color, 0.7);
    this._roundRect(ctx, boxX, boxY, boxW, 3, 8);
    ctx.fill();

    // 边框
    ctx.strokeStyle = hexToRgba(star.color, 0.3);
    ctx.lineWidth = 1;
    this._roundRect(ctx, boxX, boxY, boxW, boxH, 8);
    ctx.stroke();

    // 名称
    ctx.font = 'bold 14px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#F0F2F8';
    ctx.fillText(star.name, boxX + 14, boxY + 28);

    // 分类标签
    ctx.font = '11px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
    var catText = star.category;
    var catWidth = ctx.measureText(catText).width + 12;
    ctx.fillStyle = hexToRgba(star.color, 0.15);
    this._roundRect(ctx, boxX + 14, boxY + 36, catWidth, 18, 3);
    ctx.fill();
    ctx.fillStyle = star.color;
    ctx.fillText(catText, boxX + 20, boxY + 49);

    // 使用量
    ctx.font = '12px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillStyle = 'rgba(200,205,220,0.7)';
    ctx.fillText('使用量: ' + star.usage.toLocaleString(), boxX + 14, boxY + 72);

    // 评分（右侧）
    var ratingText = star.rating.toFixed(1);
    ctx.font = 'bold 16px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#FFD700';
    var rw = ctx.measureText(ratingText).width;
    ctx.fillText(ratingText, boxX + boxW - 14 - rw, boxY + 72);
  };

  /**
   * 绘制圆角矩形路径
   */
  BWTGalaxy.prototype._roundRect = function (ctx, x, y, w, h, r) {
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
  };

  /* ---- 更新逻辑 ---- */

  /**
   * 每帧更新状态
   */
  BWTGalaxy.prototype._update = function () {
    this._time++;

    // 自动旋转（悬停暂停）
    if (!this._paused && this._rotationSpeed > 0) {
      this._rotation += this._rotationSpeed;
    }

    // 漂移方向缓慢变化（模拟轨道微扰）
    var stars = this._stars;
    for (var i = 0; i < stars.length; i++) {
      stars[i].driftAngle += 0.001;
    }

    // 重置悬停检测（每帧重新计算）
    this._hoveredStar = null;
  };

  /* ---- 动画循环 ---- */

  /**
   * 启动 requestAnimationFrame 循环
   */
  BWTGalaxy.prototype._startLoop = function () {
    var self = this;

    function loop() {
      self._update();
      self._draw();
      self._animFrameId = requestAnimationFrame(loop);
    }

    this._animFrameId = requestAnimationFrame(loop);
  };

  /* ---- 事件处理 ---- */

  /**
   * 窗口/容器大小变化
   */
  BWTGalaxy.prototype._onResize = function () {
    var oldW = this._width;
    var oldH = this._height;
    this._resizeCanvas();

    // 按比例更新星星径向距离
    var scaleX = this._width / (oldW || this._width);
    var scaleY = this._height / (oldH || this._height);
    var scale = Math.min(scaleX, scaleY);

    var stars = this._stars;
    var maxR = Math.min(this._cx, this._cy) * 0.75;
    for (var i = 0; i < stars.length; i++) {
      stars[i].dist = stars[i].distRatio * maxR;
    }
  };

  /**
   * 鼠标移动
   */
  BWTGalaxy.prototype._onMouseMove = function (e) {
    var rect = this.canvas.getBoundingClientRect();
    this._mouseX = e.clientX - rect.left;
    this._mouseY = e.clientY - rect.top;

    // 检测是否悬停在某颗星上（暂停旋转）
    var nearStar = false;
    for (var i = 0; i < this._stars.length; i++) {
      var s = this._stars[i];
      if (!s._pos) continue;
      var dx = this._mouseX - s._pos.x;
      var dy = this._mouseY - s._pos.y;
      if (Math.sqrt(dx * dx + dy * dy) < this._hoverRadius) {
        nearStar = true;
        break;
      }
    }
    this._paused = nearStar;
  };

  /**
   * 鼠标离开画布
   */
  BWTGalaxy.prototype._onMouseLeave = function () {
    this._mouseX = -9999;
    this._mouseY = -9999;
    this._paused = false;
    this._hoveredStar = null;
  };

  /**
   * 点击事件
   */
  BWTGalaxy.prototype._onClick = function (e) {
    var rect = this.canvas.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;

    // 查找点击的星星
    var clicked = null;
    var minDist = 30; // 最大点击判定距离

    for (var i = 0; i < this._stars.length; i++) {
      var s = this._stars[i];
      if (!s._pos) continue;
      var dx = mx - s._pos.x;
      var dy = my - s._pos.y;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d < minDist) {
        minDist = d;
        clicked = s;
      }
    }

    if (clicked) {
      this._selectedStar = clicked;
      this._selectedPulse = 0;
      this._selectedExpire = null;
    } else {
      this._selectedStar = null;
      this._selectedPulse = 0;
      this._selectedExpire = null;
    }
  };

  /**
   * 绑定 DOM 事件
   */
  BWTGalaxy.prototype._bindEvents = function () {
    window.addEventListener('resize', this._boundResize);
    this.canvas.addEventListener('mousemove', this._boundMouseMove);
    this.canvas.addEventListener('mouseleave', this._boundMouseLeave);
    this.canvas.addEventListener('click', this._boundClick);

    // 触摸事件支持（移动端）
    this._boundTouchStart = this._onTouchStart.bind(this);
    this._boundTouchMove = this._onTouchMove.bind(this);
    this._boundTouchEnd = this._onTouchEnd.bind(this);
    this.canvas.addEventListener('touchstart', this._boundTouchStart, { passive: true });
    this.canvas.addEventListener('touchmove', this._boundTouchMove, { passive: true });
    this.canvas.addEventListener('touchend', this._boundTouchEnd, { passive: true });
  };

  /**
   * 触摸开始
   */
  BWTGalaxy.prototype._onTouchStart = function (e) {
    if (e.touches.length === 1) {
      var touch = e.touches[0];
      var rect = this.canvas.getBoundingClientRect();
      this._mouseX = touch.clientX - rect.left;
      this._mouseY = touch.clientY - rect.top;
    }
  };

  /**
   * 触摸移动
   */
  BWTGalaxy.prototype._onTouchMove = function (e) {
    if (e.touches.length === 1) {
      var touch = e.touches[0];
      var rect = this.canvas.getBoundingClientRect();
      this._mouseX = touch.clientX - rect.left;
      this._mouseY = touch.clientY - rect.top;
    }
  };

  /**
   * 触摸结束 - 模拟点击
   */
  BWTGalaxy.prototype._onTouchEnd = function () {
    // 检查最近的星星
    var clicked = null;
    var minDist = 40;

    for (var i = 0; i < this._stars.length; i++) {
      var s = this._stars[i];
      if (!s._pos) continue;
      var dx = this._mouseX - s._pos.x;
      var dy = this._mouseY - s._pos.y;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d < minDist) {
        minDist = d;
        clicked = s;
      }
    }

    if (clicked) {
      this._selectedStar = clicked;
      this._selectedPulse = 0;
      this._selectedExpire = null;
    }

    // 延迟清除鼠标位置
    var self = this;
    setTimeout(function () {
      self._mouseX = -9999;
      self._mouseY = -9999;
    }, 300);
  };

  /**
   * 解绑所有事件
   */
  BWTGalaxy.prototype._unbindEvents = function () {
    window.removeEventListener('resize', this._boundResize);
    this.canvas.removeEventListener('mousemove', this._boundMouseMove);
    this.canvas.removeEventListener('mouseleave', this._boundMouseLeave);
    this.canvas.removeEventListener('click', this._boundClick);
    this.canvas.removeEventListener('touchstart', this._boundTouchStart);
    this.canvas.removeEventListener('touchmove', this._boundTouchMove);
    this.canvas.removeEventListener('touchend', this._boundTouchEnd);
  };

  /* ---- 公开方法 ---- */

  /**
   * 销毁实例，清理所有资源和事件
   */
  BWTGalaxy.prototype.destroy = function () {
    if (this._animFrameId) {
      cancelAnimationFrame(this._animFrameId);
      this._animFrameId = null;
    }
    this._unbindEvents();
    this._stars = null;
    this._connections = null;
    this._hoveredStar = null;
    this._selectedStar = null;
  };

  /* ==============================
   * 导出
   * ============================== */
  window.BWTGalaxy = BWTGalaxy;

})();
