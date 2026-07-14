/* ===== registry.js · 配图类型注册表与路由分发 ===== */
window.GraphRegistry = (function () {

  // 渲染器接口：{ validate(params): boolean, render(ctx, params, canvas): void }
  // 约定：渲染器直接读取 canvas.width / canvas.height 获取尺寸
  //       调用方（app.js）负责在调用前设置好 canvas 的 width/height 属性
  const registry = new Map();

  function registerGraphType(type, renderer) {
    if (!renderer || typeof renderer.render !== 'function') {
      console.warn('注册失败：渲染器缺少 render 方法', type);
      return;
    }
    registry.set(type, renderer);
  }

  function getRenderer(type) {
    return registry.get(type) || null;
  }

  function listTypes() {
    return Array.from(registry.keys());
  }

  // 路由分发：根据 type 调用对应渲染器
  // 返回：'ok' | 'unsupported' | 'invalid'
  function renderGraph(type, params, canvas) {
    if (!canvas) return 'unsupported';
    const renderer = registry.get(type);
    if (!renderer) {
      _renderUnsupported(canvas, '该题型配图开发中');
      return 'unsupported';
    }
    // 校验参数
    if (renderer.validate && !renderer.validate(params)) {
      _renderUnsupported(canvas, '配图参数校验失败');
      return 'invalid';
    }
    const ctx = canvas.getContext('2d');
    // 清空（按 canvas 实际尺寸）
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    try {
      renderer.render(ctx, params, canvas);
      return 'ok';
    } catch (e) {
      console.error('渲染失败:', type, e);
      _renderUnsupported(canvas, '渲染异常：' + e.message);
      return 'invalid';
    }
  }

  // 兜底：绘制"暂不支持"提示
  function _renderUnsupported(canvas, msg) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fafbfc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#95a5a6';
    ctx.font = '16px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎨 ' + (msg || '暂不支持'), canvas.width / 2, canvas.height / 2);
  }

  // 导出 PNG
  function exportPNG(canvas, filename) {
    try {
      const dataUrl = canvas.toDataURL('image/png');
      Utils.downloadDataUrl(dataUrl, filename || 'edugraph-' + Date.now() + '.png');
      return true;
    } catch (e) {
      Utils.toast('导出失败：' + e.message, 'error');
      return false;
    }
  }

  return {
    registerGraphType, getRenderer, listTypes, renderGraph, exportPNG,
  };
})();
