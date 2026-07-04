/* =================================================================
   CodeBeat 节奏编程 - 画布渲染系统（右侧像素画画布）
   委托 pixel-art.js 负责所有绘制逻辑，此处只做适配。
   ================================================================= */

// ============ 画布管理 ============

function resizeDrawCanvas() {
  const rect = drawCanvas.parentElement.getBoundingClientRect();
  drawCanvas.width = rect.width;
  drawCanvas.height = rect.height;
  // 窗口大小变化时重绘像素画
  drawPixelArt();
}

function initDrawCanvas() {
  const rect = drawCanvas.parentElement.getBoundingClientRect();
  drawCanvas.width = rect.width;
  drawCanvas.height = rect.height;
  initPixelArt();
  drawPixelArt();
}

function clearCanvas() {
  // K 键清屏：重置像素画，开始重新显影
  initPixelArt();
  drawPixelArt();
}
