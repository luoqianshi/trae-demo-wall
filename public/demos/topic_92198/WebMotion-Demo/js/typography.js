/**
 * Typography.js — 排版系统 + 安全区
 * 所有字号计算统一通过此模块，消除硬编码
 * 依赖: window.TOKENS (tokens.js)
 */

const Typography = (function() {
  'use strict';

  const BASE_WIDTH = 1920;

  function getTokens() {
    return window.TOKENS || {};
  }

  /**
   * 计算 Canvas 实际字号
   * @param {'hero'|'h1'|'h2'|'h3'|'body'|'caption'|'small'} size
   * @param {number} [canvasWidth] - 当前画布宽度，默认 1920
   * @returns {number} 实际像素值
   */
  function fontSize(size, canvasWidth) {
    const t = getTokens();
    const base = (t.fontSize && t.fontSize[size]) ? t.fontSize[size] : 24;
    const w = canvasWidth || BASE_WIDTH;
    return Math.round(base * (w / BASE_WIDTH));
  }

  /**
   * 计算安全区边距
   * @param {number} canvasWidth
   * @param {number} canvasHeight
   * @returns {{ title: {x,y,w,h}, action: {x,y,w,h} }}
   */
  function safeZone(canvasWidth, canvasHeight) {
    const t = getTokens();
    const titleMargin = (t.safeZone && t.safeZone.titleMargin) ? t.safeZone.titleMargin : 0.0625;
    const actionMargin = (t.safeZone && t.safeZone.actionMargin) ? t.safeZone.actionMargin : 0.05;

    const w = canvasWidth || BASE_WIDTH;
    const h = canvasHeight || 1080;

    const tx = Math.round(w * titleMargin);
    const ty = Math.round(h * titleMargin);
    const ax = Math.round(w * actionMargin);
    const ay = Math.round(h * actionMargin);

    return {
      title: { x: tx, y: ty, w: w - tx * 2, h: h - ty * 2 },
      action: { x: ax, y: ay, w: w - ax * 2, h: h - ay * 2 }
    };
  }

  /**
   * 构建 Canvas font 字符串
   * @param {string} weight - '400'|'600'|'700'|'800'
   * @param {string} size - 'hero'|'h1'|'h2'|'h3'|'body'|'caption'|'small'
   * @param {number} [canvasWidth]
   * @returns {string} 如 '700 48px -apple-system,"PingFang SC",sans-serif'
   */
  function fontString(weight, size, canvasWidth) {
    const t = getTokens();
    const family = (t.font && t.font.sans) ? t.font.sans : 'sans-serif';
    const px = fontSize(size, canvasWidth);
    return weight + ' ' + px + 'px ' + family;
  }

  /**
   * 计算面板位置（避让热区）
   * @param {Array<{x:number,y:number,w:number,h:number}>} hotZones
   * @param {number} canvasWidth
   * @param {number} canvasHeight
   * @returns {{x:number,y:number}}
   */
  function panelPosition(hotZones, canvasWidth, canvasHeight) {
    const w = canvasWidth || BASE_WIDTH;
    const h = canvasHeight || 1080;
    const margin = Math.round(w * 0.025); // 2.5%
    const pw = 480, ph = 160;

    const corners = [
      { x: margin, y: margin },
      { x: w - margin - pw, y: margin },
      { x: margin, y: h - margin - ph },
      { x: w - margin - pw, y: h - margin - ph }
    ];

    if (!hotZones || hotZones.length === 0) return corners[0];

    let best = corners[0];
    let bestOverlap = Infinity;

    for (const c of corners) {
      let overlap = 0;
      for (const hz of hotZones) {
        const ox = Math.max(c.x, hz.x);
        const oy = Math.max(c.y, hz.y);
        const ow = Math.min(c.x + pw, hz.x + hz.w) - ox;
        const oh = Math.min(c.y + ph, hz.y + hz.h) - oy;
        if (ow > 0 && oh > 0) overlap += ow * oh;
      }
      if (overlap < bestOverlap) {
        bestOverlap = overlap;
        best = c;
      }
    }
    return best;
  }

  return { fontSize, safeZone, fontString, panelPosition, BASE_WIDTH };
})();