// main.js — 主流程编排：上传 → (AI 分析 | 示例特征) → 匹配 → 渲染
//
// 经典脚本版（非 ES Module），双击 index.html 即可运行，无需本地服务器。
// 依赖加载顺序：config.js → data/products.js → match.js → ai.js → main.js
(function () {
  'use strict';

  const CL = window.CosLens || {};
  const matchProducts = CL.matchProducts;
  const buildReason = CL.buildReason;
  const analyzeImage = CL.analyzeImage;

  const els = {
    fileInput: document.getElementById('file-input'),
    dropZone: document.getElementById('drop-zone'),
    placeholder: document.getElementById('upload-placeholder'),
    previewImg: document.getElementById('preview-img'),
    analyzeBtn: document.getElementById('analyze-btn'),
    demoBtn: document.getElementById('demo-btn'),
    statusLine: document.getElementById('status-line'),
    featureArea: document.getElementById('feature-area'),
    featureGrid: document.getElementById('feature-grid'),
    resultArea: document.getElementById('result-area'),
    resultList: document.getElementById('result-list'),
  };

  let currentDataUrl = null;
  let productsCache = null;

  const FIELD_ORDER = ['瞳色主色', '显色度', '直径', '风格'];

  // 无 Key / 离线时验证匹配用的示例特征
  const DEMO_FEATURES = {
    瞳色主色: { value: '蓝', confidence: 0.85 },
    显色度: { value: '高', confidence: 0.9 },
    直径: { value: '大', confidence: 0.8 },
    风格: { value: '二次元', confidence: 0.7 },
  };

  // 是否可能存在本地 AI 代理：只有通过 http(s) 启动 server.py 才可能，file:// 双击必然没有
  const CAN_CALL_API = location.protocol === 'http:' || location.protocol === 'https:';

  function setStatus(msg, type) {
    els.statusLine.textContent = msg || '';
    els.statusLine.className = 'status-line' + (type ? ' status-' + type : '');
  }

  // 商品库：优先用内嵌数据（离线双击可用），回退到 fetch（http 下也可）
  async function loadProducts() {
    if (productsCache) return productsCache;
    if (Array.isArray(window.CosLens && window.CosLens.products)) {
      productsCache = window.CosLens.products;
      return productsCache;
    }
    const resp = await fetch('data/products.json');
    if (!resp.ok) throw new Error('无法加载商品库 data/products.json');
    productsCache = await resp.json();
    return productsCache;
  }

  // ===== 上传处理 =====
  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      setStatus('请选择图片文件', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      currentDataUrl = reader.result;
      els.previewImg.src = currentDataUrl;
      els.previewImg.classList.remove('hidden');
      els.placeholder.classList.add('hidden');
      els.analyzeBtn.disabled = false;
      setStatus('图片已就绪，点击「开始分析」');
    };
    reader.readAsDataURL(file);
  }

  els.fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

  ['dragover', 'dragenter'].forEach((evt) =>
    els.dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      els.dropZone.classList.add('drag-over');
    })
  );
  ['dragleave', 'drop'].forEach((evt) =>
    els.dropZone.addEventListener(evt, (e) => {
      e.preventDefault();
      els.dropZone.classList.remove('drag-over');
    })
  );
  els.dropZone.addEventListener('drop', (e) => {
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    handleFile(file);
  });

  // ===== 分析流程 =====
  // 优先真实 AI（需 server.py + Key）；无 Key / 离线 / 调用失败时自动降级到示例特征，不报错。
  els.analyzeBtn.addEventListener('click', async () => {
    if (!currentDataUrl) return;
    els.analyzeBtn.disabled = true;
    try {
      if (!CAN_CALL_API) {
        setStatus('离线模式（未启动本地 AI 服务）· 用示例特征演示完整推荐流程…', 'loading');
        await runRecommend(DEMO_FEATURES);
        setStatus('已用示例特征完成推荐（离线模式，未调用 AI）', 'success');
        return;
      }
      setStatus('AI 正在分析美瞳特征…', 'loading');
      const features = await analyzeImage(currentDataUrl);
      await runRecommend(features);
      setStatus('分析完成', 'success');
    } catch (err) {
      // 未配置 Key / 服务未启动 / 网络失败：降级而非报错
      console.warn('AI 未就绪，降级为示例特征：', err);
      await runRecommend(DEMO_FEATURES);
      setStatus('AI 未就绪（未配置 Key 或服务未启动），已降级为示例特征演示', 'success');
    } finally {
      els.analyzeBtn.disabled = false;
    }
  });

  // 跳过 AI，用示例特征验证匹配与渲染（评审无 Key 也能完整体验核心链路）
  els.demoBtn.addEventListener('click', async () => {
    setStatus('使用示例特征验证推荐逻辑…', 'loading');
    try {
      await runRecommend(DEMO_FEATURES);
      setStatus('示例特征推荐完成（未调用 AI）', 'success');
    } catch (err) {
      console.error(err);
      setStatus(err.message || '匹配失败', 'error');
    }
  });

  async function runRecommend(features) {
    renderFeatures(features);
    const products = await loadProducts();
    const top = matchProducts(features, products, 3);
    renderResults(features, top);
  }

  // ===== 渲染：特征 =====
  function renderFeatures(features) {
    els.featureGrid.innerHTML = '';
    for (const field of FIELD_ORDER) {
      const f = features[field] || { value: '—', confidence: 0 };
      const conf = Math.round((f.confidence ?? 0) * 100);
      const low = (f.confidence ?? 0) < 0.5;
      const item = document.createElement('div');
      item.className = 'feature-item' + (low ? ' feature-low' : '');
      item.innerHTML =
        '<div class="feature-name">' + field + '</div>' +
        '<div class="feature-value">' + (f.value ?? '—') + '</div>' +
        '<div class="feature-conf">' +
        '<div class="conf-bar"><span style="width:' + conf + '%"></span></div>' +
        '<span class="conf-num">' + conf + '%' + (low ? ' · 低置信降权' : '') + '</span>' +
        '</div>';
      els.featureGrid.appendChild(item);
    }
    els.featureArea.classList.remove('hidden');
  }

  // ===== 渲染：推荐结果 =====
  function renderResults(features, top) {
    els.resultList.innerHTML = '';
    if (!top.length) {
      els.resultList.innerHTML = '<p class="empty">商品库为空，请先在 data/products.js 添加商品</p>';
      els.resultArea.classList.remove('hidden');
      return;
    }
    top.forEach((m, i) => {
      const p = m.product;
      const reason = buildReason(features, m);
      const tags = FIELD_ORDER.map((field) => {
        const b = m.breakdown.find((x) => x.field === field);
        const cls = b && b.score >= 0.5 ? 'tag-hit' : 'tag-miss';
        return '<span class="tag ' + cls + '">' + field + ':' + (p[field] ?? '—') + '</span>';
      }).join('');

      const card = document.createElement('div');
      card.className = 'product-card' + (i === 0 ? ' product-top' : '');
      card.innerHTML =
        '<div class="rank">#' + (i + 1) + '</div>' +
        '<img class="product-img" src="' + (p.image || '') + '" alt="' + (p.name || '') + '"' +
        ' onerror="this.classList.add(\'img-fallback\');this.removeAttribute(\'src\');" />' +
        '<div class="product-body">' +
        '<div class="product-head">' +
        '<span class="product-name">' + (p.name || '未命名') + '</span>' +
        (p.price != null ? '<span class="product-price">¥' + p.price + '</span>' : '') +
        '</div>' +
        '<div class="match-score">' +
        '<div class="score-bar"><span style="width:' + m.score + '%"></span></div>' +
        '<span class="score-num">匹配度 ' + m.score + '%</span>' +
        '</div>' +
        '<div class="product-tags">' + tags + '</div>' +
        '<p class="product-reason">' + reason + '</p>' +
        '</div>';
      els.resultList.appendChild(card);
    });
    els.resultArea.classList.remove('hidden');
  }

  // ===== 初始化提示 =====
  if (!CAN_CALL_API) {
    setStatus('提示：无需 API Key，点「示例特征测试」即可体验完整推荐流程');
  }
})();
