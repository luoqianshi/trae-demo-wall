/* ============================================
   纹样素材库 - 瀑布流 + 调色板
   ============================================ */

(function () {
  const D = WF_DATA;
  let currentTag = '全部';
  let currentKeyword = '';

  /* ===== 渲染筛选 Tag ===== */
  function renderTags() {
    const wrap = document.getElementById('filter-tags');
    wrap.innerHTML = D.patternTags.map((tag, i) => {
      const count = tag === '全部' ? D.patterns.length : D.patterns.filter(p => p.cat === tag).length;
      return `<button class="filter-tag ${i === 0 ? 'active' : ''}" data-tag="${tag}">${tag}<span class="tag-count">${count}</span></button>`;
    }).join('');

    wrap.querySelectorAll('.filter-tag').forEach(btn => {
      btn.addEventListener('click', () => {
        wrap.querySelectorAll('.filter-tag').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTag = btn.dataset.tag;
        renderMasonry();
      });
    });
  }

  /* ===== 渲染瀑布流 ===== */
  function renderMasonry() {
    const wrap = document.getElementById('gallery-masonry');
    let list = D.patterns;

    if (currentTag !== '全部') {
      list = list.filter(p => p.cat === currentTag);
    }
    if (currentKeyword) {
      const kw = currentKeyword.toLowerCase();
      list = list.filter(p => p.title.toLowerCase().includes(kw) || p.cat.toLowerCase().includes(kw));
    }

    if (list.length === 0) {
      wrap.innerHTML = `<div class="gallery-empty">未找到匹配的纹样，换个关键词试试 ✦</div>`;
      return;
    }

    wrap.innerHTML = list.map((p, i) => `
      <div class="pattern-card" data-id="${p.id}" style="animation-delay:${i * 0.05}s">
        <div class="pattern-img" style="height:${p.h}px">${WF.patternSvg(p.id, p.palette, 400, p.h)}</div>
        <div class="pattern-overlay">
          <div class="pattern-title">${p.title}</div>
          <div class="pattern-meta">
            <span class="pattern-cat">${p.cat}</span>
            <span>· ${p.steps} 道工序</span>
          </div>
        </div>
        <div class="pattern-footer">
          <div class="pattern-name">${p.title}</div>
          <div class="palette-mini">
            ${p.palette.map(c => `<i style="background:${c}"></i>`).join('')}
          </div>
        </div>
      </div>
    `).join('');

    wrap.querySelectorAll('.pattern-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = +card.dataset.id;
        const p = D.patterns.find(x => x.id === id);
        if (p) showPreview(p);
      });
    });
  }

  /* ===== 大图预览 + 调色板 ===== */
  function showPreview(p) {
    const mask = document.getElementById('preview-mask');
    const content = document.getElementById('preview-content');

    // 国风配色候选
    const swatchColors = [
      { name: '朱红', hex: '#C8392F' },
      { name: '鎏金', hex: '#C9A14A' },
      { name: '青瓷', hex: '#2E8B7A' },
      { name: '靛蓝', hex: '#1F4E8C' },
      { name: '墨黑', hex: '#1A1208' },
      { name: '胭脂', hex: '#A82820' },
      { name: '藤黄', hex: '#E8C97A' },
      { name: '月白', hex: '#FFF6E6' }
    ];

    content.innerHTML = `
      <div class="preview-image" id="preview-image">
        ${WF.patternSvg(p.id, p.palette, 500, 400)}
      </div>
      <div class="preview-detail">
        <span class="pd-cat">${p.cat}</span>
        <h2 class="pd-title">${p.title}</h2>
        <div class="pd-en">PATTERN · No.${String(p.id).padStart(3, '0')}</div>

        <div class="pd-section">
          <div class="pd-section-title">纹样释义</div>
          <p class="pd-desc">此纹样取自潍坊 ${p.cat.replace('纹样', '')} 传统图样，承袭古法构图，对称均衡，寓意吉祥。常见于年画、风筝、剪纸等非遗工艺品，纹样线条遒劲，色彩浓烈，承载着东方美学的厚重底蕴。</p>
        </div>

        <div class="pd-section">
          <div class="pd-section-title">原纹配色</div>
          <div class="palette-ui">
            <div class="palette-row">
              <span class="palette-row-label">主色</span>
              <div class="palette-swatches">
                ${p.palette.map((c, i) => `<span class="palette-swatch ${i === 0 ? 'active' : ''}" data-color="${c}" style="background:${c}"></span>`).join('')}
              </div>
            </div>
          </div>
        </div>

        <div class="pd-section">
          <div class="pd-section-title">调色板 · 重新上色</div>
          <div class="palette-ui">
            <div class="palette-row">
              <span class="palette-row-label">国风色板</span>
              <div class="palette-swatches" id="recolor-swatches">
                ${swatchColors.map((s, i) => `<span class="palette-swatch ${i < 2 ? 'active' : ''}" data-color="${s.hex}" title="${s.name}" style="background:${s.hex}"></span>`).join('')}
              </div>
            </div>
            <div class="palette-actions">
              <button class="palette-action primary" id="recolor-btn">应用配色</button>
              <button class="palette-action ghost" id="reset-color">恢复原色</button>
            </div>
          </div>
        </div>

        <div class="pd-section">
          <div class="pd-section-title">工艺信息</div>
          <div class="pd-tags">
            <span class="pd-tag">${p.cat}</span>
            <span class="pd-tag">${p.steps} 道工序</span>
            <span class="pd-tag">手工制作</span>
            <span class="pd-tag">可商用授权</span>
          </div>
        </div>
      </div>
    `;

    mask.classList.add('show');

    // 关闭
    document.getElementById('preview-close').onclick = () => mask.classList.remove('show');
    mask.onclick = (e) => { if (e.target === mask) mask.classList.remove('show'); };

    // 调色板交互
    const swatches = content.querySelectorAll('#recolor-swatches .palette-swatch');
    swatches.forEach(s => {
      s.addEventListener('click', () => {
        s.classList.toggle('active');
      });
    });

    // 应用配色
    document.getElementById('recolor-btn').onclick = () => {
      const active = Array.from(content.querySelectorAll('#recolor-swatches .palette-swatch.active')).map(s => s.dataset.color);
      if (active.length === 0) {
        WF.toast('请至少选择一种颜色', 'warn');
        return;
      }
      const imgWrap = document.getElementById('preview-image');
      imgWrap.innerHTML = WF.patternSvg(p.id + '_recolor', active, 500, 400);
      WF.toast(`已应用 ${active.length} 种新配色，纹样焕然新生`, 'success');
    };

    // 恢复原色
    document.getElementById('reset-color').onclick = () => {
      const imgWrap = document.getElementById('preview-image');
      imgWrap.innerHTML = WF.patternSvg(p.id, p.palette, 500, 400);
      WF.toast('已恢复传统原色', 'info');
    };
  }

  /* ===== 搜索 ===== */
  function bindSearch() {
    const input = document.getElementById('filter-search');
    input.addEventListener('input', WF.debounce(() => {
      currentKeyword = input.value.trim();
      renderMasonry();
    }, 250));
  }

  /* ===== ESC 关闭 ===== */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.getElementById('preview-mask').classList.remove('show');
    }
  });

  function init() {
    renderTags();
    renderMasonry();
    bindSearch();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
