/* ============================================
   匠人档案 - 渲染逻辑
   ============================================ */

(function () {
  const D = WF_DATA;

  function renderMasters() {
    const list = document.getElementById('masters-list');
    list.innerHTML = D.masters.map((m, i) => {
      const colors = [
        ['#C8392F', '#C9A14A'],
        ['#C9A14A', '#E8C97A'],
        ['#2E8B7A', '#C9A14A'],
        ['#A82820', '#C8392F'],
        ['#1F4E8C', '#2E8B7A'],
        ['#C9A14A', '#A82820']
      ];
      const [c1, c2] = colors[i % colors.length];
      const firstChar = m.name.charAt(0);

      return `
        <article class="master-card" style="animation-delay:${i * 0.1}s">
          <div class="master-inner">
            <div class="master-avatar-wrap">
              <div class="master-avatar">${WF.avatarSvg(firstChar, c1, c2)}</div>
              <div class="master-name">${m.name}</div>
              <div class="master-title-badge">${m.title}</div>
            </div>

            <div class="master-bio">
              <div class="master-bio-head">
                <div class="master-craft">${m.craft}</div>
                <div class="master-meta">
                  <span>📍 ${m.region}</span>
                  <span>⏳ ${m.years}</span>
                </div>
              </div>
              <p class="master-bio-text">${m.bio}</p>
              <div class="master-tags">
                <span class="master-tag">${m.craft.split('·')[0].trim()}</span>
                <span class="master-tag">${m.region}</span>
                <span class="master-tag">${m.years}</span>
                <span class="master-tag">代表传承人</span>
              </div>
            </div>

            <div class="master-video-wrap">
              <div class="master-video-label">工艺记录影像</div>
              <div class="master-video-frame">
                <video src="${m.video}" preload="none" playsinline controls></video>
                <div class="master-video-poster" data-idx="${i}">
                  ${WF.illustrationSvg('kite', 320, 200)}
                  <div class="master-video-play">▶</div>
                  <div class="master-video-text">点击观看 · ${m.craft}</div>
                  <div class="master-video-meta">
                    <span>📸 4K 高清</span>
                    <span class="master-video-duration">08:36</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>
      `;
    }).join('');

    // 视频点击播放
    list.querySelectorAll('.master-video-poster').forEach(poster => {
      poster.addEventListener('click', function () {
        const frame = this.parentElement;
        const video = frame.querySelector('video');
        this.classList.add('hidden');
        video.play().catch(() => {
          WF.toast('视频加载中，请稍候', 'info');
        });
      });
    });
  }

  function animateNumbers() {
    document.querySelectorAll('.masters-page .scroll-num').forEach((el, i) => {
      setTimeout(() => WF.animateNumber(el, +el.dataset.target, { duration: 1800 + i * 100 }), 300 + i * 100);
    });
  }

  function init() {
    renderMasters();
    animateNumbers();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
