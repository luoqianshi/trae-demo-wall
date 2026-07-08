/**
 * WebMotion - 动态噪点叠加层（脏玻璃效果）
 * 给画面增加胶片颗粒感，让矢量动画看起来更有质感
 * 透明度控制在 3%-8%，使用 source-atop 混合模式保留透明通道
 */
const NoiseOverlay = (function() {
  let noiseCanvas = null;
  let noiseCtx = null;
  let lastWidth = 0;
  let lastHeight = 0;
  let enabled = false;
  let opacity = 0.05;

  function setEnabled(val) { enabled = val; }
  function isEnabled() { return enabled; }
  function setOpacity(val) { opacity = Math.max(0.01, Math.min(0.15, val)); }

  /** 生成噪点像素数据（统一函数，消除重复） */
  function generateNoise(width, height, seed) {
    const imageData = noiseCtx.createImageData(width, height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const x = (i / 4) % width;
      const y = Math.floor((i / 4) / width);
      const r = ((x * 374761393 + y * 668265263 + seed * 107) & 0x7FFFFFFF) / 0x7FFFFFFF;
      const v = Math.floor(r * 255);
      data[i] = v; data[i + 1] = v; data[i + 2] = v;
      data[i + 3] = v; // 随机透明度
    }
    noiseCtx.putImageData(imageData, 0, 0);
  }

  /** 更新噪点画布（尺寸变化时重建，否则重新生成噪点） */
  function updateNoiseCanvas(width, height, t) {
    if (!noiseCanvas || width !== lastWidth || height !== lastHeight) {
      noiseCanvas = document.createElement('canvas');
      noiseCanvas.width = width;
      noiseCanvas.height = height;
      noiseCtx = noiseCanvas.getContext('2d');
      lastWidth = width;
      lastHeight = height;
    }
    generateNoise(width, height, Math.floor(t * 60));
  }

  /** 绘制噪点层到目标 canvas */
  function draw(targetCtx, width, height, t) {
    if (!enabled) return;
    updateNoiseCanvas(width, height, t);
    targetCtx.save();
    targetCtx.globalAlpha = opacity;
    targetCtx.globalCompositeOperation = 'source-atop';
    targetCtx.drawImage(noiseCanvas, 0, 0, width, height);
    targetCtx.restore();
  }

  function reset() {
    noiseCanvas = null;
    noiseCtx = null;
    lastWidth = 0;
    lastHeight = 0;
  }

  return { setEnabled, isEnabled, setOpacity, draw, reset };
})();
