/**
 * WebMotion - 素材管理模块
 * 管理用户上传的图片、字体等素材
 */
const AssetManager = (function() {
  let assets = []; // { id, name, type, dataUrl, width, height }
  let listeners = [];

  function init() {
    assets = [];
  }

  function addImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const asset = {
            id: Utils.uid(),
            name: file.name,
            type: 'image',
            dataUrl: e.target.result,
            width: img.width,
            height: img.height
          };
          assets.push(asset);
          notify();
          resolve(asset);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function addImageFromUrl(url, name) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        try {
          const dataUrl = canvas.toDataURL('image/png');
          const asset = {
            id: Utils.uid(),
            name: name || '网络图片',
            type: 'image',
            dataUrl,
            width: img.width,
            height: img.height
          };
          assets.push(asset);
          notify();
          resolve(asset);
        } catch (e) {
          reject(new Error('跨域图片无法加载'));
        }
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  function removeAsset(id) {
    assets = assets.filter(a => a.id !== id);
    notify();
  }

  function getAsset(id) {
    return assets.find(a => a.id === id);
  }

  function getAssets() {
    return assets;
  }

  /**
   * 在 Canvas 上绘制图片素材
   * @param {string} id - 素材 ID
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x, y - 位置
   * @param {number} w, h - 尺寸
   * @param {object} opts - { rotation, opacity, borderRadius }
   */
  function drawImage(id, ctx, x, y, w, h, opts = {}) {
    const asset = getAsset(id);
    if (!asset) return;

    ctx.save();
    ctx.globalAlpha = opts.opacity !== undefined ? opts.opacity : 1;

    if (opts.rotation) {
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate(opts.rotation);
      ctx.translate(-w / 2, -h / 2);
      x = 0; y = 0;
    }

    if (opts.borderRadius) {
      ctx.beginPath();
      const r = opts.borderRadius;
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
      ctx.clip();
    }

    // 需要从 dataUrl 创建 Image 对象
    if (!asset._img) {
      asset._img = new Image();
      asset._img.src = asset.dataUrl;
    }
    if (asset._img.complete) {
      ctx.drawImage(asset._img, x, y, w, h);
    }
    ctx.restore();
  }

  /**
   * 预加载所有图片素材，返回 Promise
   */
  function preloadImages() {
    return Promise.all(assets.filter(a => a.type === 'image').map(a => {
      if (a._img && a._img.complete) return Promise.resolve();
      return new Promise(resolve => {
        a._img = new Image();
        a._img.onload = resolve;
        a._img.onerror = resolve;
        a._img.src = a.dataUrl;
      });
    }));
  }

  function onChange(callback) {
    listeners.push(callback);
  }

  function notify() {
    listeners.forEach(fn => fn(assets));
  }

  return {
    init,
    addImage,
    addImageFromUrl,
    removeAsset,
    getAsset,
    getAssets,
    drawImage,
    preloadImages,
    onChange
  };
})();
