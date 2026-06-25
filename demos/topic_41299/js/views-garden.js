    // ===== 4. 视图渲染函数：花园 =====

    // 视图：花园首页
    function renderGarden() {
      const app = document.getElementById('app');
      const today = new Date().toDateString();
      const todayInteracts = state.ocs.filter(oc =>
        new Date(oc.nurturing.lastInteract).toDateString() === today
      ).length;

      if (state.ocs.length === 0) {
        app.innerHTML = `
          <div class="page-header">
            <p class="page-eyebrow">Your Character Garden</p>
            <h1 class="page-title">我的花园</h1>
            <p class="page-subtitle">让每一个原创角色在这里生根发芽</p>
          </div>
          <div class="empty-state">
            <div class="empty-state-icon">🌱</div>
            <h2 class="empty-state-title">花园还是空的</h2>
            <p class="empty-state-desc">创建你的第一个 OC，或加载示例数据快速体验 OC Garden 的全部功能。</p>
            <div class="empty-state-actions">
              <button class="btn btn-primary" data-action="create-oc">+ 创建第一个 OC</button>
              <button class="btn btn-ghost" data-action="load-sample">加载示例数据</button>
            </div>
          </div>
        `;
        return;
      }

      const tilesHTML = state.ocs.map((oc, index) => {
        const mood = oc.nurturing.mood;
        const moodEmoji = getMoodEmoji(mood);
        const exp = oc.nurturing.exp;
        const tags = oc.personalityTags.slice(0, 3);
        const catchphrase = oc.catchphrase || '尚未设定口头禅';

        // Bento 尺寸分配：第1个 lg，第2个 wide，第3个 tall，其余标准
        let bentoClass = '';
        if (index === 0) bentoClass = 'bento-lg';
        else if (index === 1) bentoClass = 'bento-wide';
        else if (index === 2) bentoClass = 'bento-tall';

        // 大尺寸特色 tile：横向布局，含口头禅与统计
        if (bentoClass === 'bento-lg') {
          return `
            <div class="oc-tile ${bentoClass}" data-action="view-oc" data-id="${oc.id}">
              <div class="oc-tile-avatar">${renderAvatar(oc, 'large')}</div>
              <div class="oc-tile-main">
                <div class="oc-tile-name">${escapeHtml(oc.name)}</div>
                <div class="oc-tile-meta">${escapeHtml(oc.race || '未设定种族')} · ${escapeHtml(oc.gender || '?')} · ${escapeHtml(oc.mbti || '未测')}</div>
                <div class="oc-tile-stage">${oc.nurturing.stage} · ${moodEmoji}</div>
                <div class="oc-tile-stats">
                  <div class="oc-tile-stat">
                    <div class="oc-tile-stat-value">${mood}</div>
                    <div class="oc-tile-stat-label">心情</div>
                  </div>
                  <div class="oc-tile-stat">
                    <div class="oc-tile-stat-value">${exp}</div>
                    <div class="oc-tile-stat-label">经验</div>
                  </div>
                  <div class="oc-tile-stat">
                    <div class="oc-tile-stat-value">${oc.nurturing.interactCount}</div>
                    <div class="oc-tile-stat-label">互动</div>
                  </div>
                </div>
                <div class="oc-tile-catchphrase">"${escapeHtml(catchphrase)}"</div>
              </div>
            </div>
          `;
        }

        // 宽 tile：横向紧凑，头像 + 信息 + 心情条
        if (bentoClass === 'bento-wide') {
          return `
            <div class="oc-tile ${bentoClass}" data-action="view-oc" data-id="${oc.id}">
              <div class="oc-tile-avatar">${renderAvatar(oc, 'large')}</div>
              <div class="oc-tile-main">
                <div class="oc-tile-name">${escapeHtml(oc.name)}</div>
                <div class="oc-tile-meta">${escapeHtml(oc.race || '未设定种族')} · ${escapeHtml(oc.gender || '?')}</div>
                <div class="mood-bar">
                  <div class="mood-bar-fill" style="width:${mood}%"></div>
                </div>
                <div class="mood-label">
                  <span>${moodEmoji} ${oc.nurturing.stage}</span>
                  <span>${mood}/100</span>
                </div>
              </div>
              <div class="oc-tile-side">
                <div class="oc-tile-stage">${oc.nurturing.stage}</div>
                <span style="font-size:0.72rem;color:var(--text-muted);">${exp} EXP</span>
              </div>
            </div>
          `;
        }

        // 高 tile：纵向扩展，含性格标签
        if (bentoClass === 'bento-tall') {
          return `
            <div class="oc-tile ${bentoClass}" data-action="view-oc" data-id="${oc.id}">
              <div class="oc-tile-avatar">${renderAvatar(oc, 'large')}</div>
              <div class="oc-tile-name">${escapeHtml(oc.name)}</div>
              <div class="oc-tile-meta">${escapeHtml(oc.race || '未设定种族')}</div>
              <div class="oc-tile-stage">${oc.nurturing.stage} · ${moodEmoji}</div>
              <div class="mood-bar">
                <div class="mood-bar-fill" style="width:${mood}%"></div>
              </div>
              <div class="mood-label">
                <span>心情</span>
                <span>${mood}/100</span>
              </div>
              <div class="oc-tile-extra">
                ${tags.length > 0 ? `
                  <div class="oc-tile-tags">
                    ${tags.map(t => `<span class="oc-tile-tag">${escapeHtml(t)}</span>`).join('')}
                  </div>
                ` : ''}
                <span style="font-size:0.7rem;color:var(--text-faint);">${escapeHtml(oc.mbti || '')}</span>
              </div>
            </div>
          `;
        }

        // 标准 tile
        return `
          <div class="oc-tile" data-action="view-oc" data-id="${oc.id}">
            <div class="oc-tile-avatar">${renderAvatar(oc, 'large')}</div>
            <div class="oc-tile-name">${escapeHtml(oc.name)}</div>
            <div class="oc-tile-meta">${escapeHtml(oc.race || '未设定种族')} · ${escapeHtml(oc.gender || '?')}</div>
            <div class="oc-tile-stage">${oc.nurturing.stage} · ${moodEmoji}</div>
            <div class="mood-bar">
              <div class="mood-bar-fill" style="width:${mood}%"></div>
            </div>
            <div class="mood-label">
              <span>心情</span>
              <span>${mood}/100</span>
            </div>
          </div>
        `;
      }).join('');

      // 创建 tile：融入 Bento 网格末尾
      const createTileHTML = `
        <div class="oc-tile-create" data-action="create-oc">
          <div class="oc-tile-create-icon">+</div>
          <div class="oc-tile-create-text">创建新角色</div>
          <div class="oc-tile-create-sub">为花园添加新的灵魂</div>
        </div>
      `;

      app.innerHTML = `
        <div class="page-header">
          <p class="page-eyebrow">Your Character Garden</p>
          <h1 class="page-title">我的花园</h1>
          <p class="page-subtitle">让每一个原创角色在这里生根发芽</p>
        </div>
        <div class="stats-strip">
          <div class="stat-item">
            <div class="stat-value">${state.ocs.length}</div>
            <div class="stat-label">OC 总数</div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <div class="stat-value">${todayInteracts}</div>
            <div class="stat-label">今日互动</div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <div class="stat-value">${state.stats.totalInteractions}</div>
            <div class="stat-label">累计互动</div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <div class="stat-value">${state.achievements.length}</div>
            <div class="stat-label">成就徽章</div>
          </div>
        </div>
        <div class="gallery-header">
          <h2 class="gallery-title">角色画廊</h2>
          <span class="gallery-count">${state.ocs.length} 个角色 · Bento 视图</span>
        </div>
        <div class="oc-gallery">${tilesHTML}${createTileHTML}</div>
      `;
    }

    // 视图：角色档案详情
