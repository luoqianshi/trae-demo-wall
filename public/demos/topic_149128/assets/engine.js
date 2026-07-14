/**
 * 文玩核桃图像特征提取与品种匹配引擎
 * 纯 JavaScript 实现，基于 Canvas 2D API，不依赖任何外部库
 */
;(function () {
  'use strict';

  /* ================================================================
   *  RGB → HSV 色彩空间转换
   *  返回: { h: 0-360, s: 0-100, v: 0-100 }
   * ================================================================ */
  function rgbToHsv(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    var max = Math.max(r, g, b);
    var min = Math.min(r, g, b);
    var d = max - min;

    var h = 0;
    var s = max === 0 ? 0 : (d / max) * 100;
    var v = max * 100;

    if (d !== 0) {
      if (max === r) {
        h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
      } else if (max === g) {
        h = ((b - r) / d + 2) * 60;
      } else {
        h = ((r - g) / d + 4) * 60;
      }
    }

    return { h: h, s: s, v: v };
  }

  /* ================================================================
   *  图像特征分析器
   *  从一张已绘制到 Canvas 上的核桃图片中提取多种视觉特征
   * ================================================================ */
  function WalnutAnalyzer(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.imageData = null;
    this.features = {};
  }

  /**
   * 主分析方法 —— 返回提取的所有特征
   */
  WalnutAnalyzer.prototype.analyze = function () {
    this.imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    return {
      colorHistogram: this.extractColorHistogram(),    // 颜色直方图
      edgeDensity: this.calculateEdgeDensity(),         // 边缘密度 (0-1)
      circularity: this.calculateCircularity(),        // 圆形度 (0-1)
      aspectRatio: this.calculateAspectRatio(),          // 长宽比
      avgBrightness: this.calculateAvgBrightness(),     // 平均亮度 (0-255)
      dominantColor: this.getDominantColor(),            // 主色调 {h, s, v}
      textureComplexity: this.calculateTextureComplexity(), // 纹理复杂度 (0-1)
      symmetryScore: this.estimateSymmetry()             // 对称性估计 (0-1)
    };
  };

  /* ----------------------------------------------------------------
   *  颜色直方图提取
   *  在 HSV 色彩空间中统计 H 通道 (18 bin) 和 S 通道 (5 bin) 的分布
   * ---------------------------------------------------------------- */
  WalnutAnalyzer.prototype.extractColorHistogram = function () {
    var data = this.imageData.data;
    var len = data.length;

    // 初始化直方图数组
    var hBins = new Array(18).fill(0);  // 每 20 度一个 bin
    var sBins = new Array(5).fill(0);    // 每 20% 饱和度一个 bin

    for (var i = 0; i < len; i += 4) {
      var r = data[i];
      var g = data[i + 1];
      var b = data[i + 2];
      var hsv = rgbToHsv(r, g, b);

      // H 通道：0-360 分成 18 个 bin，每 bin 20 度
      var hIdx = Math.min(17, Math.floor(hsv.h / 20));
      hBins[hIdx]++;

      // S 通道：0-100 分成 5 个 bin，每 bin 20%
      var sIdx = Math.min(4, Math.floor(hsv.s / 20));
      sBins[sIdx]++;
    }

    // 归一化（转换为 0-1 的比例）
    var totalPixels = len / 4;
    var hNormalized = hBins.map(function (v) { return v / Math.max(1, totalPixels); });
    var sNormalized = sBins.map(function (v) { return v / Math.max(1, totalPixels); });

    return { h: hNormalized, s: sNormalized };
  };

  /* ----------------------------------------------------------------
   *  边缘密度计算
   *  使用 Sobel 算子计算图像梯度，统计超过阈值的像素比例
   * ---------------------------------------------------------------- */
  WalnutAnalyzer.prototype.calculateEdgeDensity = function () {
    var w = this.canvas.width;
    var h = this.canvas.height;
    var data = this.imageData.data;

    // 先转灰度
    var gray = new Float32Array(w * h);
    for (var i = 0; i < w * h; i++) {
      var idx = i * 4;
      gray[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
    }

    // Sobel 卷积核
    var gx = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    var gy = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

    var edgeCount = 0;
    var threshold = 30;  // 梯度幅值阈值
    var processedCount = 0;

    // 遍历图像（跳过边缘像素）
    for (var y = 1; y < h - 1; y++) {
      for (var x = 1; x < w - 1; x++) {
        var sumX = 0;
        var sumY = 0;
        for (var ky = -1; ky <= 1; ky++) {
          for (var kx = -1; kx <= 1; kx++) {
            var pixel = gray[(y + ky) * w + (x + kx)];
            var ki = (ky + 1) * 3 + (kx + 1);
            sumX += pixel * gx[ki];
            sumY += pixel * gy[ki];
          }
        }
        var magnitude = Math.sqrt(sumX * sumX + sumY * sumY);
        if (magnitude > threshold) {
          edgeCount++;
        }
        processedCount++;
      }
    }

    return processedCount > 0 ? edgeCount / processedCount : 0;
  };

  /* ----------------------------------------------------------------
   *  圆形度计算
   *  通过阈值分割找到核桃轮廓，计算轮廓像素到重心的距离分布
   * ---------------------------------------------------------------- */
  WalnutAnalyzer.prototype.calculateCircularity = function () {
    var w = this.canvas.width;
    var h = this.canvas.height;
    var data = this.imageData.data;

    // 转灰度
    var gray = new Float32Array(w * h);
    for (var i = 0; i < w * h; i++) {
      var idx = i * 4;
      gray[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
    }

    // 计算灰度直方图，用 Otsu 方法确定自适应阈值
    var histogram = new Array(256).fill(0);
    for (var i = 0; i < gray.length; i++) {
      histogram[Math.round(gray[i])]++;
    }

    var total = gray.length;
    var sumAll = 0;
    for (var t = 0; t < 256; t++) {
      sumAll += t * histogram[t];
    }

    var sumB = 0;
    var wB = 0;
    var maxVariance = 0;
    var otsuThreshold = 128;

    for (var t = 0; t < 256; t++) {
      wB += histogram[t];
      if (wB === 0) continue;
      var wF = total - wB;
      if (wF === 0) break;

      sumB += t * histogram[t];
      var mB = sumB / wB;
      var mF = (sumAll - sumB) / wF;

      var variance = wB * wF * (mB - mF) * (mB - mF);
      if (variance > maxVariance) {
        maxVariance = variance;
        otsuThreshold = t;
      }
    }

    // 提取轮廓像素，计算重心
    var cx = 0, cy = 0, count = 0;
    var isForeground = new Uint8Array(w * h);

    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        if (gray[y * w + x] < otsuThreshold) {
          isForeground[y * w + x] = 1;
          cx += x;
          cy += y;
          count++;
        }
      }
    }

    // 没有找到前景像素，返回默认值
    if (count === 0) return 0;

    cx /= count;
    cy /= count;

    // 找到轮廓像素（前景与背景的边界像素）
    var distances = [];
    for (var y = 1; y < h - 1; y++) {
      for (var x = 1; x < w - 1; x++) {
        if (isForeground[y * w + x] === 1) {
          // 检查是否为边界像素（上下左右至少一个为背景）
          if (
            isForeground[(y - 1) * w + x] === 0 ||
            isForeground[(y + 1) * w + x] === 0 ||
            isForeground[y * w + (x - 1)] === 0 ||
            isForeground[y * w + (x + 1)] === 0
          ) {
            var dx = x - cx;
            var dy = y - cy;
            distances.push(Math.sqrt(dx * dx + dy * dy));
          }
        }
      }
    }

    // 如果轮廓点太少，返回默认值
    if (distances.length < 10) return 0;

    // 计算平均距离和距离标准差
    var avgDist = 0;
    for (var i = 0; i < distances.length; i++) {
      avgDist += distances[i];
    }
    avgDist /= distances.length;

    if (avgDist === 0) return 0;

    var variance = 0;
    for (var i = 0; i < distances.length; i++) {
      var diff = distances[i] - avgDist;
      variance += diff * diff;
    }
    variance /= distances.length;
    var stdDev = Math.sqrt(variance);

    // 圆形度 = 1 - (标准差 / 平均距离)
    var circularity = 1 - (stdDev / avgDist);
    // 确保在 0-1 范围内
    return Math.max(0, Math.min(1, circularity));
  };

  /* ----------------------------------------------------------------
   *  长宽比计算
   *  找到非背景区域的边界框，返回 width / height
   * ---------------------------------------------------------------- */
  WalnutAnalyzer.prototype.calculateAspectRatio = function () {
    var w = this.canvas.width;
    var h = this.canvas.height;
    var data = this.imageData.data;

    // 转灰度
    var gray = new Float32Array(w * h);
    for (var i = 0; i < w * h; i++) {
      var idx = i * 4;
      gray[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
    }

    // 使用灰度中位数作为简单阈值
    var sortedGray = Array.from(gray).sort(function (a, b) { return a - b; });
    var median = sortedGray[Math.floor(sortedGray.length / 2)];

    // 找边界框
    var minX = w, maxX = 0, minY = h, maxY = 0;
    var found = false;

    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        if (gray[y * w + x] < median * 0.85) {
          found = true;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (!found) return 1;

    var bboxW = maxX - minX + 1;
    var bboxH = maxY - minY + 1;

    // 防止除零
    if (bboxH === 0 || bboxW === 0) return 1;

    return bboxW / bboxH;
  };

  /* ----------------------------------------------------------------
   *  平均亮度计算
   *  统计所有像素的灰度平均值
   * ---------------------------------------------------------------- */
  WalnutAnalyzer.prototype.calculateAvgBrightness = function () {
    var data = this.imageData.data;
    var len = data.length;
    var totalBrightness = 0;
    var pixelCount = 0;

    for (var i = 0; i < len; i += 4) {
      // 灰度公式：0.299R + 0.587G + 0.114B
      var brightness = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      totalBrightness += brightness;
      pixelCount++;
    }

    return pixelCount > 0 ? totalBrightness / pixelCount : 0;
  };

  /* ----------------------------------------------------------------
   *  主色调提取
   *  统计所有非背景像素的 HSV 平均值
   * ---------------------------------------------------------------- */
  WalnutAnalyzer.prototype.getDominantColor = function () {
    var w = this.canvas.width;
    var h = this.canvas.height;
    var data = this.imageData.data;

    // 计算灰度中位数确定背景
    var gray = new Float32Array(w * h);
    for (var i = 0; i < w * h; i++) {
      var idx = i * 4;
      gray[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
    }
    var sortedGray = Array.from(gray).sort(function (a, b) { return a - b; });
    var median = sortedGray[Math.floor(sortedGray.length / 2)];
    var bgThreshold = median * 0.85;

    // 累计非背景像素的 H/S/V
    var sumH = 0, sumS = 0, sumV = 0, count = 0;

    for (var i = 0; i < w * h; i++) {
      if (gray[i] < bgThreshold) {
        var idx = i * 4;
        var hsv = rgbToHsv(data[idx], data[idx + 1], data[idx + 2]);
        sumH += hsv.h;
        sumS += hsv.s;
        sumV += hsv.v;
        count++;
      }
    }

    if (count === 0) return { h: 0, s: 0, v: 0 };

    return {
      h: sumH / count,
      s: sumS / count,
      v: sumV / count
    };
  };

  /* ----------------------------------------------------------------
   *  纹理复杂度计算
   *  将图像分成 8x8 网格，计算每个格子内灰度方差，取均值并归一化
   * ---------------------------------------------------------------- */
  WalnutAnalyzer.prototype.calculateTextureComplexity = function () {
    var w = this.canvas.width;
    var h = this.canvas.height;
    var data = this.imageData.data;

    // 转灰度
    var gray = new Float32Array(w * h);
    for (var i = 0; i < w * h; i++) {
      var idx = i * 4;
      gray[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
    }

    var gridCols = 8;
    var gridRows = 8;
    var cellW = w / gridCols;
    var cellH = h / gridRows;
    var variances = [];

    for (var row = 0; row < gridRows; row++) {
      for (var col = 0; col < gridCols; col++) {
        var startX = Math.floor(col * cellW);
        var startY = Math.floor(row * cellH);
        var endX = Math.min(w, Math.floor((col + 1) * cellW));
        var endY = Math.min(h, Math.floor((row + 1) * cellH));

        // 计算格子内像素灰度均值
        var sum = 0;
        var cellCount = 0;
        for (var y = startY; y < endY; y++) {
          for (var x = startX; x < endX; x++) {
            sum += gray[y * w + x];
            cellCount++;
          }
        }

        if (cellCount === 0) {
          variances.push(0);
          continue;
        }

        var mean = sum / cellCount;

        // 计算方差
        var varianceSum = 0;
        for (var y = startY; y < endY; y++) {
          for (var x = startX; x < endX; x++) {
            var diff = gray[y * w + x] - mean;
            varianceSum += diff * diff;
          }
        }

        variances.push(varianceSum / cellCount);
      }
    }

    // 取所有格子方差的平均值
    var avgVariance = 0;
    for (var i = 0; i < variances.length; i++) {
      avgVariance += variances[i];
    }
    avgVariance /= variances.length;

    // 归一化到 0-1（灰度方差的理论最大值约为 (128)^2 = 16384）
    var maxPossibleVariance = 16384;
    return Math.min(1, avgVariance / maxPossibleVariance);
  };

  /* ----------------------------------------------------------------
   *  对称性估计
   *  将图像左右分成两半，计算像素差异
   * ---------------------------------------------------------------- */
  WalnutAnalyzer.prototype.estimateSymmetry = function () {
    var w = this.canvas.width;
    var h = this.canvas.height;
    var data = this.imageData.data;

    // 转灰度
    var gray = new Float32Array(w * h);
    for (var i = 0; i < w * h; i++) {
      var idx = i * 4;
      gray[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
    }

    // 只取左半部分宽度（奇数宽度时取 floor）
    var halfW = Math.floor(w / 2);
    var totalDiff = 0;
    var totalPixels = 0;

    for (var y = 0; y < h; y++) {
      for (var x = 0; x < halfW; x++) {
        // 左半边的像素
        var leftPixel = gray[y * w + x];
        // 右半边的镜像像素
        var rightPixel = gray[y * w + (w - 1 - x)];
        var diff = Math.abs(leftPixel - rightPixel);
        totalDiff += diff;
        totalPixels++;
      }
    }

    if (totalPixels === 0) return 0;

    // 平均差异，最大可能差异为 255
    var avgDiff = totalDiff / totalPixels;
    // 对称性 = 1 - 归一化差异
    var symmetry = 1 - (avgDiff / 255);

    return Math.max(0, Math.min(1, symmetry));
  };

  /* ================================================================
   *  品种匹配引擎
   *  根据提取的图像特征与品种数据库进行匹配
   * ================================================================ */
  function WalnutMatcher(database) {
    this.database = database;
  }

  /**
   * 根据提取的特征匹配最可能的品种
   * @param {Object} features - analyze() 返回的特征对象
   * @returns {Array} 排序后的匹配结果数组
   */
  WalnutMatcher.prototype.match = function (features) {
    var results = [];
    var self = this;

    this.database.forEach(function (variety) {
      var scores = self._calculateScores(features, variety);
      var composite = scores.colorScore * 0.4 + scores.textureScore * 0.3 + scores.shapeScore * 0.3;

      results.push({
        variety: variety.name,
        id: variety.id,
        score: Math.max(0, Math.min(1, composite)),
        details: scores
      });
    });

    // 按综合得分从高到低排序
    results.sort(function (a, b) { return b.score - a.score; });

    return results;
  };

  /**
   * 计算单个品种在各维度上的匹配分数
   * @private
   */
  WalnutMatcher.prototype._calculateScores = function (features, variety) {
    // ---- 1. 颜色相似度 ----
    var hDiff = Math.abs(features.dominantColor.h - variety.colorProfile.h);
    // H 通道是环形的，需要处理跨越 360/0 的情况
    if (hDiff > 180) {
      hDiff = 360 - hDiff;
    }
    var sDiff = Math.abs(features.dominantColor.s - variety.colorProfile.s);
    var vDiff = Math.abs(features.dominantColor.v - variety.colorProfile.v);

    var colorScore = 1 - (
      (hDiff / 180) * 0.4 +
      (sDiff / 100) * 0.3 +
      (vDiff / 100) * 0.3
    );
    colorScore = Math.max(0, Math.min(1, colorScore));

    // ---- 2. 纹理匹配 ----
    // deep → complexity > 0.6, medium → 0.3-0.6, shallow < 0.3
    var textureScore = 0;
    var tc = features.textureComplexity;
    switch (variety.texture) {
      case 'deep':
        // 复杂度越高越匹配
        textureScore = tc > 0.6 ? 0.7 + (tc - 0.6) / 0.4 * 0.3 : tc / 0.6 * 0.7;
        break;
      case 'medium':
        // 复杂度在 0.3-0.6 之间最匹配
        var midCenter = 0.45;
        var midDist = Math.abs(tc - midCenter);
        textureScore = Math.max(0, 1 - midDist / 0.45);
        break;
      case 'shallow':
        // 复杂度越低越匹配
        textureScore = tc < 0.3 ? 0.7 + (0.3 - tc) / 0.3 * 0.3 : (1 - tc) / 0.7 * 0.7;
        break;
      default:
        textureScore = 0.5;
    }
    textureScore = Math.max(0, Math.min(1, textureScore));

    // ---- 3. 形状匹配 ----
    // round → circularity > 0.7, high → aspectRatio > 1.1, flat → aspectRatio < 0.9
    var shapeScore = 0;
    var circ = features.circularity;
    var ar = features.aspectRatio;

    switch (variety.shape) {
      case 'round':
        // 高圆形度 + 接近 1 的长宽比
        var roundness = circ > 0.7 ? 0.7 + (circ - 0.7) / 0.3 * 0.3 : circ / 0.7 * 0.7;
        var arBalance = 1 - Math.abs(ar - 1) * 2; // 长宽比越接近1越好
        arBalance = Math.max(0, Math.min(1, arBalance));
        shapeScore = roundness * 0.6 + arBalance * 0.4;
        break;
      case 'high':
        // 高长宽比 + 较高圆形度
        var heightScore = ar > 1.1 ? 0.7 + Math.min((ar - 1.1) / 0.5, 1) * 0.3 : ar / 1.1 * 0.7;
        shapeScore = heightScore * 0.6 + circ * 0.4;
        break;
      case 'flat':
        // 低长宽比
        var flatScore = ar < 0.9 ? 0.7 + Math.min((0.9 - ar) / 0.5, 1) * 0.3 : (2 - ar) / 1.1 * 0.7;
        shapeScore = flatScore * 0.6 + circ * 0.4;
        break;
      case 'oval':
        // 椭圆形：长宽比稍偏离1，圆形度中等
        var ovalAR = 1 - Math.abs(ar - 1.15) * 3;
        ovalAR = Math.max(0, Math.min(1, ovalAR));
        var ovalCirc = 1 - Math.abs(circ - 0.6) * 2;
        ovalCirc = Math.max(0, Math.min(1, ovalCirc));
        shapeScore = ovalAR * 0.5 + ovalCirc * 0.5;
        break;
      default:
        shapeScore = 0.5;
    }
    shapeScore = Math.max(0, Math.min(1, shapeScore));

    return {
      colorScore: colorScore,
      textureScore: textureScore,
      shapeScore: shapeScore
    };
  };

  /**
   * 品相评分 —— 基于图像特征生成各维度评分
   * @param {Object} features - analyze() 返回的特征对象
   * @returns {Object} 包含五个维度评分的对象（0-100）
   */
  WalnutMatcher.prototype.assessQuality = function (features) {
    return {
      // 桩型：基于圆形度和长宽比的对称程度
      zhuang: Math.round(
        50 +
        features.circularity * 40 +
        (1 - Math.abs(features.aspectRatio - 1)) * 10
      ),
      // 纹理：基于纹理复杂度和边缘密度
      wenlu: Math.round(
        40 +
        features.textureComplexity * 45 +
        features.edgeDensity * 15
      ),
      // 皮质：基于平均亮度和饱和度
      pizhi: Math.round(
        50 +
        features.avgBrightness / 255 * 20 +
        features.dominantColor.s / 100 * 30
      ),
      // 配对：基于对称性
      peidui: Math.round(
        50 +
        features.symmetryScore * 40 +
        Math.random() * 10
      ),
      // 尺寸：基于长宽比和圆形度
      chicun: Math.round(
        60 +
        (1 - Math.abs(features.aspectRatio - 1)) * 25 +
        features.circularity * 15
      )
    };
  };

  /* ================================================================
   *  品种数据库
   *  文玩核桃常见品种的特征数据
   * ================================================================ */
  var WALNUT_DATABASE = [
    {
      id: 'shizitou',
      name: '狮子头',
      alias: '闷墩狮子头',
      origin: '北京、河北',
      description: '狮子头是文玩核桃中最经典的品种之一，以纹路深邃、桩型饱满著称。底平大脐，纹路如狮鬃，手感厚重，是收藏级的代表品种。',
      features: { zhuang: 85, wenlu: 92, pizhi: 78, peidui: 80, chicun: 75 },
      priceRange: '500-3000元',
      colorProfile: { h: 25, s: 65, v: 45 },
      texture: 'deep',
      shape: 'round'
    },
    {
      id: 'gongtiao',
      name: '官帽',
      alias: '公子帽',
      origin: '北京、河北、山西',
      description: '官帽因形状似古代官员的帽子而得名，边大而突出，纹路规整，桩型略高，底部较平，是传统四大名核之一。',
      features: { zhuang: 80, wenlu: 85, pizhi: 80, peidui: 78, chicun: 82 },
      priceRange: '300-1500元',
      colorProfile: { h: 20, s: 55, v: 50 },
      texture: 'medium',
      shape: 'round'
    },
    {
      id: 'wenxiu',
      name: '文玩虎头',
      alias: '虎头',
      origin: '河北涞水',
      description: '虎头核桃纹路粗犷有力，像虎皮纹路一样霸气。桩型饱满厚重，纹路深浅分明，手感极佳，是文玩爱好者的热门选择。',
      features: { zhuang: 82, wenlu: 88, pizhi: 75, peidui: 76, chicun: 78 },
      priceRange: '200-1200元',
      colorProfile: { h: 30, s: 60, v: 42 },
      texture: 'deep',
      shape: 'round'
    },
    {
      id: 'panlong',
      name: '盘龙纹狮子头',
      alias: '满天星',
      origin: '河北涞水',
      description: '盘龙纹狮子头以其独特的盘龙纹理而得名，纹路蜿蜒盘旋如同游龙，底部纹路密集，是非常具有辨识度的品种。',
      features: { zhuang: 78, wenlu: 95, pizhi: 82, peidui: 74, chicun: 76 },
      priceRange: '800-5000元',
      colorProfile: { h: 22, s: 70, v: 40 },
      texture: 'deep',
      shape: 'round'
    },
    {
      id: 'baifengwo',
      name: '白狮子头',
      alias: '白狮子',
      origin: '河北涞水',
      description: '白狮子头因嫁接枝条呈白色而得名，皮质细腻白净，纹路规整流畅，属于较为年轻的品种但深受玩家喜爱。',
      features: { zhuang: 80, wenlu: 78, pizhi: 90, peidui: 82, chicun: 80 },
      priceRange: '300-2000元',
      colorProfile: { h: 35, s: 45, v: 55 },
      texture: 'medium',
      shape: 'round'
    },
    {
      id: 'sijiaotou',
      name: '四座楼狮子头',
      alias: '四座楼',
      origin: '北京平谷',
      description: '四座楼狮子头产自北京平谷四座楼景区，纹路深邃规整，底平脐大，桩型端庄，是近年市场上非常热门的品种。',
      features: { zhuang: 88, wenlu: 90, pizhi: 80, peidui: 82, chicun: 84 },
      priceRange: '600-4000元',
      colorProfile: { h: 25, s: 60, v: 43 },
      texture: 'deep',
      shape: 'round'
    },
    {
      id: 'mapi',
      name: '麻皮核桃',
      alias: '秋子',
      origin: '东北、河北',
      description: '麻皮核桃是野生核桃中最常见的品种，表面粗糙有明显麻点纹理，价格亲民，是新手入门的好选择。',
      features: { zhuang: 60, wenlu: 55, pizhi: 60, peidui: 50, chicun: 55 },
      priceRange: '20-200元',
      colorProfile: { h: 28, s: 40, v: 55 },
      texture: 'shallow',
      shape: 'oval'
    },
    {
      id: 'tielingka',
      name: '铁核桃',
      alias: '铁蛋',
      origin: '云南、贵州',
      description: '铁核桃产自西南地区，质地极为坚硬，密度大重量沉，纹路较浅但皮质出色，适合喜欢沉甸甸手感的玩家。',
      features: { zhuang: 70, wenlu: 50, pizhi: 88, peidui: 65, chicun: 70 },
      priceRange: '50-500元',
      colorProfile: { h: 15, s: 35, v: 38 },
      texture: 'shallow',
      shape: 'round'
    },
    {
      id: 'chuangshi',
      name: '灯笼核桃',
      alias: '灯笼',
      origin: '河北、山西',
      description: '灯笼核桃因外形酷似灯笼而得名，桩型较高，肚圆顶尖，纹路简洁流畅，小巧玲珑，是文玩核桃中的经典造型之一。',
      features: { zhuang: 65, wenlu: 60, pizhi: 72, peidui: 68, chicun: 65 },
      priceRange: '100-800元',
      colorProfile: { h: 18, s: 50, v: 48 },
      texture: 'medium',
      shape: 'high'
    },
    {
      id: 'guanguan',
      name: '鸡心核桃',
      alias: '鸡心',
      origin: '河北、山西',
      description: '鸡心核桃形状如鸡心，顶部尖底部平，纹路细密均匀，是传统四大名核之一，历史悠久，文化底蕴深厚。',
      features: { zhuang: 68, wenlu: 75, pizhi: 76, peidui: 72, chicun: 70 },
      priceRange: '200-1500元',
      colorProfile: { h: 22, s: 50, v: 46 },
      texture: 'medium',
      shape: 'oval'
    },
    {
      id: 'sanyangkai',
      name: '三羊开泰',
      alias: '三羊',
      origin: '河北涞水',
      description: '三羊开泰是近年来培育的新品种，纹路舒展大气，三条主筋明显，如同三只祥羊，寓意吉祥，桩型端庄饱满。',
      features: { zhuang: 83, wenlu: 82, pizhi: 85, peidui: 80, chicun: 80 },
      priceRange: '500-3000元',
      colorProfile: { h: 24, s: 58, v: 47 },
      texture: 'medium',
      shape: 'round'
    },
    {
      id: 'laozha',
      name: '老扎狮子头',
      alias: '老树狮子头',
      origin: '北京',
      description: '老扎狮子头是传统老树品种，树龄长，果型沉稳，纹路古朴自然，皮质厚实温润，是资深玩家追求的收藏级品种。',
      features: { zhuang: 90, wenlu: 86, pizhi: 92, peidui: 85, chicun: 82 },
      priceRange: '1000-8000元',
      colorProfile: { h: 20, s: 72, v: 35 },
      texture: 'deep',
      shape: 'round'
    }
  ];

  /* ================================================================
   *  暴露全局接口
   * ================================================================ */
  window.WalnutAnalyzer = WalnutAnalyzer;
  window.WalnutMatcher = WalnutMatcher;
  window.WALNUT_DATABASE = WALNUT_DATABASE;
  window.rgbToHsv = rgbToHsv;

})();
