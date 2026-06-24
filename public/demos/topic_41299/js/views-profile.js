    // ===== 4. 视图渲染函数：档案 =====
    function renderProfile(id) {
      const oc = state.ocs.find(o => o.id === id);
      const app = document.getElementById('app');

      if (!oc) {
        app.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">🔍</div>
            <h2 class="empty-state-title">未找到该 OC</h2>
            <p class="empty-state-desc">可能已被删除或链接有误</p>
            <button class="btn btn-primary" data-route="#/garden">返回花园</button>
          </div>
        `;
        return;
      }

      // 应用心情衰减
      const decayedOc = applyMoodDecay(oc);
      if (decayedOc.nurturing.mood !== oc.nurturing.mood) {
        oc.nurturing.mood = decayedOc.nurturing.mood;
        oc.nurturing.lastInteract = decayedOc.nurturing.lastInteract;
        saveState();
      }

      const moodEmoji = getMoodEmoji(oc.nurturing.mood);

      // 立绘展示（如果有）- 应用版权保护
      const cp = oc.copyright || {};
      const portraitHTML = oc.portraitImage
        ? `<div class="profile-portrait">
            ${renderImageWithProtection(oc, oc.portraitImage, { alt: oc.name + ' 的立绘' })}
            <div class="copyright-notice-bar">© ${cp.author || oc.name} · ${cp.license} · 版权所有</div>
          </div>`
        : '';

      // 喜好/厌恶标签渲染
      const renderStoryTags = (tags, cls) => tags.length > 0
        ? `<div class="story-tags">${tags.map(t => `<span class="${cls}">${escapeHtml(t)}</span>`).join('')}</div>`
        : '<span style="color:var(--text-muted);font-size:0.85rem;">未设定</span>';

      app.innerHTML = `
        <div class="back-link" data-route="#/garden">← 返回花园</div>

        ${portraitHTML}

        <div class="profile-hero">
          <div class="profile-avatar">${renderAvatar(oc, 'large')}</div>
          <div class="profile-info">
            <h1 class="profile-name">${escapeHtml(oc.name)}</h1>
            <div class="profile-meta">
              <span class="profile-badge accent">${oc.nurturing.stage}</span>
              ${oc.mbti ? `<span class="profile-badge">${oc.mbti}</span>` : ''}
              ${oc.race ? `<span class="profile-badge">${escapeHtml(oc.race)}</span>` : ''}
              ${oc.occupation ? `<span class="profile-badge">${escapeHtml(oc.occupation)}</span>` : ''}
              <span class="profile-badge">${moodEmoji} ${oc.nurturing.mood}</span>
            </div>
            ${oc.catchphrase ? `<p class="profile-catchphrase">"${escapeHtml(oc.catchphrase)}"</p>` : ''}
          </div>
          <div class="profile-actions">
            <button class="btn btn-ghost" data-action="edit-oc" data-id="${oc.id}">编辑</button>
            <button class="btn btn-ghost" data-action="export-oc" data-id="${oc.id}">导出</button>
            <button class="btn btn-ghost" data-action="share-oc" data-id="${oc.id}">📤 分享</button>
            <button class="btn btn-danger" data-action="delete-oc" data-id="${oc.id}">删除</button>
          </div>
        </div>

        <div class="tabs">
          <div class="tab active" data-tab="basic">基础信息</div>
          <div class="tab" data-tab="appearance">外观设定</div>
          <div class="tab" data-tab="personality">性格</div>
          <div class="tab" data-tab="story">背景故事</div>
          <div class="tab" data-tab="relations">关系图谱</div>
          <div class="tab" data-tab="gallery">画廊</div>
          <div class="tab" data-tab="timeline">时间线</div>
          <div class="tab" data-tab="whispers">碎碎念</div>
          <div class="tab" data-tab="commissions">约稿记录</div>
          <div class="tab" data-tab="community">社区</div>
        </div>

        <div class="tab-content active" data-content="basic">
          <div class="info-list">
            <div class="info-item">
              <div class="info-label">姓名</div>
              <div class="info-value">${escapeHtml(oc.name || '—')}</div>
            </div>
            <div class="info-item">
              <div class="info-label">性别</div>
              <div class="info-value">${escapeHtml(oc.gender || '—')}</div>
            </div>
            <div class="info-item">
              <div class="info-label">年龄</div>
              <div class="info-value">${escapeHtml(oc.age || '—')}</div>
            </div>
            <div class="info-item">
              <div class="info-label">种族</div>
              <div class="info-value">${escapeHtml(oc.race || '—')}</div>
            </div>
            <div class="info-item">
              <div class="info-label">世界观</div>
              <div class="info-value">${escapeHtml(oc.worldview || '—')}</div>
            </div>
            <div class="info-item">
              <div class="info-label">职业/身份</div>
              <div class="info-value">${escapeHtml(oc.occupation || '—')}</div>
            </div>
            <div class="info-item">
              <div class="info-label">口头禅</div>
              <div class="info-value">${escapeHtml(oc.catchphrase || '—')}</div>
            </div>
            <div class="info-item">
              <div class="info-label">隐私等级</div>
              <div class="info-value">${getPrivacyLabel(oc.privacy)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">创建时间</div>
              <div class="info-value">${formatDate(oc.createdAt)}</div>
            </div>
          </div>

          <div class="copyright-info-card">
            <div class="copyright-info-title">© 版权信息</div>
            <div class="copyright-info-row">
              <span class="copyright-info-label">作者</span>
              <span class="copyright-info-value">${escapeHtml(cp.author || '未标注')}</span>
            </div>
            <div class="copyright-info-row">
              <span class="copyright-info-label">协议</span>
              <span class="copyright-license-badge">${escapeHtml(cp.license || 'CC-BY')}</span>
            </div>
            <div class="copyright-info-row">
              <span class="copyright-info-label">登记日期</span>
              <span class="copyright-info-value">${cp.registeredAt ? formatDate(cp.registeredAt) : '未登记'}</span>
            </div>
            <div class="copyright-info-row">
              <span class="copyright-info-label">保护措施</span>
              <span class="copyright-info-value">${cp.watermarkEnabled !== false ? '水印 ' : ''}${cp.disableDownload !== false ? '禁下载' : ''}${cp.watermarkEnabled === false && cp.disableDownload === false ? '无' : ''}</span>
            </div>
          </div>
        </div>

        <div class="tab-content" data-content="appearance">
          <div class="info-list" style="grid-template-columns:1fr;">
            <div class="info-item">
              <div class="info-label">配色方案</div>
              <div class="color-swatches">
                ${oc.colors.map(c => `<div class="color-swatch" style="background:${c}" title="${c}"></div>`).join('')}
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">发型</div>
              <div class="info-value">${escapeHtml(oc.hairStyle || '—')}</div>
            </div>
            <div class="info-item">
              <div class="info-label">瞳色</div>
              <div class="info-value">${escapeHtml(oc.eyeColor || '—')}</div>
            </div>
            <div class="info-item">
              <div class="info-label">肤色</div>
              <div class="info-value">${escapeHtml(oc.skinTone || '—')}</div>
            </div>
            <div class="info-item">
              <div class="info-label">身高</div>
              <div class="info-value">${escapeHtml(oc.height || '—')}</div>
            </div>
            <div class="info-item">
              <div class="info-label">体型</div>
              <div class="info-value">${escapeHtml(oc.bodyType || '—')}</div>
            </div>
            <div class="info-item">
              <div class="info-label">服装</div>
              <div class="info-value">${escapeHtml(oc.outfit || '—')}</div>
            </div>
            <div class="info-item">
              <div class="info-label">特征标记</div>
              <div class="info-value">${escapeHtml(oc.features || '—')}</div>
            </div>
          </div>
        </div>

        <div class="tab-content" data-content="personality">
          <div class="info-list" style="grid-template-columns:1fr;">
            <div class="info-item">
              <div class="info-label">MBTI 人格</div>
              <div class="info-value">${escapeHtml(oc.mbti || '—')}</div>
            </div>
            <div class="info-item">
              <div class="info-label">性格关键词</div>
              <div class="tag-cloud">
                ${oc.personalityTags.length > 0
                  ? oc.personalityTags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')
                  : '<span style="color:var(--text-muted)">暂无标签</span>'}
              </div>
            </div>
          </div>
        </div>

        <div class="tab-content" data-content="story">
          <div class="story-block">
            <div class="story-block-title">背景故事</div>
            <div class="story-block-content">${oc.background ? escapeHtml(oc.background).replace(/\n/g, '<br>') : '<span style="color:var(--text-muted)">尚未填写背景故事</span>'}</div>
          </div>
          <div class="story-block">
            <div class="story-block-title">能力设定</div>
            <div class="story-block-content">${oc.abilities ? escapeHtml(oc.abilities).replace(/\n/g, '<br>') : '<span style="color:var(--text-muted)">尚未填写能力设定</span>'}</div>
          </div>
          <div class="story-block">
            <div class="story-block-title">喜好</div>
            ${renderStoryTags(oc.likes || [], 'story-tag-like')}
          </div>
          <div class="story-block">
            <div class="story-block-title">厌恶</div>
            ${renderStoryTags(oc.dislikes || [], 'story-tag-dislike')}
          </div>
        </div>

        <div class="tab-content" data-content="relations">
          ${buildRelationGraphHTML(oc)}
        </div>

        <div class="tab-content" data-content="gallery">
          ${renderGalleryTab(oc)}
        </div>

        <div class="tab-content" data-content="timeline">
          ${oc.timeline.length > 0
            ? `<div class="timeline-list">${oc.timeline.map(t => `
                <div class="timeline-item">
                  <div class="timeline-dot"></div>
                  <div>
                    <div class="timeline-date">${escapeHtml(t.date)}</div>
                    <div class="timeline-event">${escapeHtml(t.event)}</div>
                  </div>
                </div>
              `).join('')}</div>`
            : `<div class="empty-tab">这个 OC 还没有时间线记录</div>`
          }
        </div>

        <div class="tab-content" data-content="whispers">
          ${renderWhispersTab(oc)}
        </div>

        <div class="tab-content" data-content="commissions">
          ${(() => {
            const ocCommissions = (state.commissions || []).filter(c => c.ocId === oc.id);
            if (ocCommissions.length === 0) {
              return `
                <div class="empty-tab">
                  这个 OC 还没有约稿记录
                  <button class="btn btn-ghost btn-sm" data-route="#/commissions" style="margin-left:12px;">去约稿管理添加</button>
                </div>
              `;
            }
            return `<div class="commission-list">${ocCommissions.map(c => renderCommissionCard(c)).join('')}</div>`;
          })()}
        </div>

        <div class="tab-content" data-content="community">
          ${renderOCCommunityTab(oc)}
        </div>
      `;
    }

    // ===== 关系图谱可视化（D3.js + SVG） =====

    // 关系类型 → 颜色映射（兜底灰紫）
    function getRelationColor(type) {
      const map = {
        '恋人': '#FF003C',
        '家人': '#FF6B00',
        '挚友': '#FF6BB5',
        '朋友': '#00F0FF',
        '师徒': '#FFE600',
        '同事': '#00FF88',
        '邻居': '#0099AA',
        '宿敌': '#4A0080',
        '其他': '#6B5B8E'
      };
      return map[type] || '#6B5B8E';
    }

    // 聚合双向关系数据，构建 D3 所需的 { nodes, links } 结构
    function buildGraphData(oc) {
      // 出边（当前 OC → 他人）
      const outEdges = (oc.relations || []).map(r => ({
        source: oc.id, target: r.targetId, type: r.type, desc: r.desc || '', direction: 'out'
      }));
      // 入边（他人 → 当前 OC），反查 state.ocs
      const inEdges = [];
      state.ocs.forEach(other => {
        if (other.id === oc.id) return;
        (other.relations || []).forEach(r => {
          if (r.targetId === oc.id) {
            inEdges.push({ source: other.id, target: oc.id, type: r.type, desc: r.desc || '', direction: 'in' });
          }
        });
      });
      const allEdges = [...outEdges, ...inEdges];

      // 收集节点 ID（当前 OC + 所有关联 OC）
      const nodeIds = new Set([oc.id]);
      allEdges.forEach(e => { nodeIds.add(e.source); nodeIds.add(e.target); });

      const nodes = [...nodeIds].map(id => {
        const o = state.ocs.find(x => x.id === id);
        return {
          id,
          name: o ? o.name : '已删除的 OC',
          avatar: o ? (o.avatar || '🌸') : '❓'
        };
      });

      return { nodes, links: allEdges };
    }

    // 构建图谱容器 HTML（含图例），供 renderProfile 模板字符串同步调用
    function buildRelationGraphHTML(oc) {
      const { links } = buildGraphData(oc);

      // 空状态
      if (links.length === 0) {
        return `<div class="empty-tab">这个 OC 还没有与其他角色的关系记录</div>`;
      }

      // 收集涉及的关系类型（去重），生成图例
      const usedTypes = [...new Set(links.map(e => e.type))];
      const legendHTML = usedTypes.map(t => {
        const color = getRelationColor(t);
        return `<span class="legend-item"><i style="background:${color}"></i>${escapeHtml(t)}</span>`;
      }).join('');

      return `
        <div class="relation-graph-wrap">
          <div class="relation-graph-header">
            <div class="relation-graph-title">关系网络</div>
            <div class="relation-graph-legend">${legendHTML}</div>
            <div class="relation-graph-tips">拖拽节点 · 点击跳转 · 滚轮缩放</div>
          </div>
          <div class="relation-graph-container" id="relation-graph-${oc.id}"></div>
          <div class="relation-graph-detail" id="relation-detail-${oc.id}">
            <span class="relation-detail-hint">悬停关系线查看描述，点击节点跳转详情</span>
          </div>
        </div>
      `;
    }

    // D3 力导向布局渲染 SVG 图谱（由 init.js Tab 切换时触发）
    function renderRelationGraph(oc) {
      const container = document.getElementById(`relation-graph-${oc.id}`);
      if (!container) return;  // 容器不存在（可能已切走）则跳过
      if (typeof d3 === 'undefined') {
        container.innerHTML = `<div class="empty-tab">D3.js 加载失败，无法渲染关系图谱</div>`;
        return;
      }

      const { nodes, links } = buildGraphData(oc);
      if (links.length === 0) return;

      // 清空容器，初始化 SVG
      container.innerHTML = '';
      const width = container.clientWidth || 600;
      const height = 400;

      const svg = d3.select(container).append('svg')
        .attr('width', '100%')
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('max-height', '500px');

      // 缩放/平移
      const g = svg.append('g');
      const zoom = d3.zoom().scaleExtent([0.5, 3]).on('zoom', (e) => g.attr('transform', e.transform));
      svg.call(zoom);

      // 力导向仿真
      const simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(d => d.id).distance(120))
        .force('charge', d3.forceManyBody().strength(-400))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(50));

      // 渲染边（线条 + 方向箭头 + 类型颜色）
      //    - 出边：实线；入边：虚线
      //    - 颜色按关系类型
      //    - 悬停显示 desc
      const linkGroup = g.append('g').selectAll('line')
        .data(links).enter().append('line')
        .attr('stroke', d => getRelationColor(d.type))
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', d => d.direction === 'in' ? '6 4' : 'none')
        .style('cursor', 'pointer')
        .on('mouseover', (e, d) => {
          showRelationDetail(oc.id, d);
        })
        .on('mouseout', () => {
          resetRelationDetail(oc.id);
        });

      // 渲染节点（圆形 + Emoji 文本 + 名称）
      //    - 当前 OC 节点放大 + 高亮边框
      //    - 点击节点跳转：navigate('#/oc/' + d.id)
      //    - 拖拽节点
      const nodeGroup = g.append('g').selectAll('g')
        .data(nodes).enter().append('g')
        .style('cursor', 'pointer')
        .call(d3.drag()
          .on('start', dragStart)
          .on('drag', dragging)
          .on('end', dragEnd));

      nodeGroup.append('circle')
        .attr('r', d => d.id === oc.id ? 32 : 24)
        .attr('fill', 'var(--bg-elevated)')
        .attr('stroke', d => d.id === oc.id ? 'var(--dopamine-pink)' : 'var(--border-soft)')
        .attr('stroke-width', d => d.id === oc.id ? 3 : 1.5);

      // 节点内 Emoji（用 OC.avatar，避免 img 在 SVG 中的复杂处理）
      nodeGroup.append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('font-size', d => d.id === oc.id ? '1.8rem' : '1.4rem')
        .text(d => (d.avatar || '🌸').slice(0, 2));

      // 节点下方名称
      nodeGroup.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', d => d.id === oc.id ? 52 : 42)
        .attr('fill', 'var(--text-primary)')
        .attr('font-size', '0.8rem')
        .text(d => d.name.length > 6 ? d.name.slice(0, 6) + '…' : d.name);

      nodeGroup.on('click', (e, d) => {
        if (d.id !== oc.id) navigate('#/oc/' + d.id);
      });

      // 仿真 tick 更新坐标
      simulation.on('tick', () => {
        linkGroup
          .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
        nodeGroup.attr('transform', d => `translate(${d.x},${d.y})`);
      });

      // 拖拽函数
      function dragStart(e, d) {
        if (!e.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x; d.fy = d.y;
      }
      function dragging(e, d) { d.fx = e.x; d.fy = e.y; }
      function dragEnd(e, d) {
        if (!e.active) simulation.alphaTarget(0);
        d.fx = null; d.fy = null;
      }
    }

    // 在图谱下方详情区显示边的关系描述
    function showRelationDetail(ocId, edge) {
      const el = document.getElementById(`relation-detail-${ocId}`);
      if (!el) return;
      const sourceOC = state.ocs.find(o => o.id === edge.source);
      const targetOC = state.ocs.find(o => o.id === edge.target);
      const sName = sourceOC ? sourceOC.name : '已删除';
      const tName = targetOC ? targetOC.name : '已删除';
      el.innerHTML = `
        <span class="relation-detail-type" style="color:${getRelationColor(edge.type)}">${escapeHtml(edge.type)}</span>
        <span class="relation-detail-names">${escapeHtml(sName)} → ${escapeHtml(tName)}</span>
        ${edge.desc ? `<span class="relation-detail-desc">${escapeHtml(edge.desc)}</span>` : ''}
      `;
    }

    function resetRelationDetail(ocId) {
      const el = document.getElementById(`relation-detail-${ocId}`);
      if (el) el.innerHTML = `<span class="relation-detail-hint">悬停关系线查看描述，点击节点跳转详情</span>`;
    }

    // ===== 画廊 Tab =====

    function renderGalleryTab(oc) {
      const gallery = oc.gallery || [];
      // 分类筛选器
      const filterHTML = `
        <div class="gallery-filter">
          <button class="gallery-filter-btn active" data-action="filter-gallery" data-value="all">全部 (${gallery.length})</button>
          ${GALLERY_CATEGORIES.map(c => {
            const count = gallery.filter(g => g.category === c.value).length;
            return `<button class="gallery-filter-btn" data-action="filter-gallery" data-value="${c.value}">${c.label} (${count})</button>`;
          }).join('')}
        </div>
      `;
      // 上传按钮
      const uploadHTML = `
        <div class="gallery-upload-area">
          <button class="btn btn-primary" data-action="upload-gallery-image" data-id="${oc.id}">📤 上传图片到画廊</button>
          <input type="file" id="gallery-upload-input-${oc.id}" accept="image/*" style="display:none;">
        </div>
      `;
      // 画廊网格
      const gridHTML = gallery.length > 0
        ? `<div class="gallery-grid" id="gallery-grid-${oc.id}">
            ${gallery.map(g => renderGalleryItem(oc, g)).join('')}
          </div>`
        : `<div class="empty-tab">画廊还是空的，点击上方按钮上传第一张图片</div>`;

      return `
        <div class="gallery-wrap">
          ${filterHTML}
          ${uploadHTML}
          ${gridHTML}
        </div>
      `;
    }

    function renderGalleryItem(oc, g) {
      const categoryLabel = getGalleryCategoryLabel(g.category);
      const cp = oc.copyright || {};
      const protectionAttrs = cp.disableDownload !== false ? 'oncontextmenu="return false" ondragstart="return false"' : '';
      return `
        <div class="gallery-item" data-image-id="${g.id}">
          <div class="gallery-item-thumb" data-action="view-gallery-image" data-id="${oc.id}" data-image-id="${g.id}">
            <img src="${g.thumbnail}" alt="${escapeAttr(g.title || categoryLabel)}" ${protectionAttrs}>
            <div class="gallery-item-overlay">
              <span class="gallery-item-zoom">🔍</span>
            </div>
          </div>
          <div class="gallery-item-meta">
            <span class="gallery-item-category" data-category="${g.category}">${escapeHtml(categoryLabel)}</span>
            ${g.title ? `<span class="gallery-item-title">${escapeHtml(g.title)}</span>` : ''}
          </div>
          <div class="gallery-item-actions">
            <button class="btn btn-ghost btn-sm" data-action="set-portrait-from-gallery" data-id="${oc.id}" data-image-id="${g.id}" title="设为主立绘">⭐</button>
            <button class="btn btn-ghost btn-sm" data-action="edit-gallery-image" data-id="${oc.id}" data-image-id="${g.id}" title="编辑信息">✏️</button>
            <button class="btn btn-danger btn-sm" data-action="delete-gallery-image" data-id="${oc.id}" data-image-id="${g.id}" title="删除">🗑️</button>
          </div>
        </div>
      `;
    }

    // 处理画廊图片上传：弹出分类/标题输入模态框，确认后调用 addGalleryImage
    async function handleGalleryUpload(ocId, file) {
      const categoryOptions = GALLERY_CATEGORIES.map(c =>
        `<option value="${c.value}">${c.label}</option>`
      ).join('');
      const bodyHTML = `
        <div class="gallery-upload-form">
          <div class="form-group">
            <label>分类</label>
            <select class="form-select" id="gallery-upload-category">
              ${categoryOptions}
            </select>
          </div>
          <div class="form-group">
            <label>标题（可选）</label>
            <input type="text" class="form-input" id="gallery-upload-title" placeholder="给这张图片起个名字">
          </div>
          <div class="gallery-upload-preview" id="gallery-upload-preview">正在处理图片预览...</div>
        </div>
      `;
      try {
        const previewSrc = await compressImage(file, 400, 0.6);
        showModal('上传图片到画廊', bodyHTML, [
          { label: '取消', style: 'btn-ghost' },
          { label: '上传', style: 'btn-primary', onClick: async () => {
            const category = document.getElementById('gallery-upload-category').value;
            const title = document.getElementById('gallery-upload-title').value;
            closeModal();
            const result = await addGalleryImage(ocId, file, category, title);
            if (result) {
              renderProfile(ocId);
              // 重新渲染后自动切换回画廊 Tab
              const galleryTab = document.querySelector('.tab[data-tab="gallery"]');
              if (galleryTab) galleryTab.click();
            }
          }}
        ]);
        // 模态框打开后填充预览
        setTimeout(() => {
          const preview = document.getElementById('gallery-upload-preview');
          if (preview) preview.innerHTML = `<img src="${previewSrc}" alt="预览" style="max-width:100%;border-radius:4px;">`;
        }, 100);
      } catch (err) {
        showToast('图片处理失败：' + err.message, 'error');
      }
    }

    // 点击缩略图查看大图，应用版权保护
    function showGalleryImageModal(ocId, imageId) {
      const oc = state.ocs.find(o => o.id === ocId);
      if (!oc || !oc.gallery) return;
      const img = oc.gallery.find(g => g.id === imageId);
      if (!img) return;
      const categoryLabel = getGalleryCategoryLabel(img.category);
      const cp = oc.copyright || {};
      const bodyHTML = `
        <div class="gallery-modal-image">
          ${renderImageWithProtection(oc, img.src, { alt: img.title || categoryLabel })}
        </div>
        <div class="gallery-modal-meta">
          <div class="gallery-modal-category">${escapeHtml(categoryLabel)}</div>
          ${img.title ? `<div class="gallery-modal-title">${escapeHtml(img.title)}</div>` : ''}
          <div class="gallery-modal-date">上传于 ${formatDate(img.uploadedAt)}</div>
          ${cp.author ? `<div class="gallery-modal-copyright">© ${escapeHtml(cp.author)} · ${escapeHtml(cp.license)}</div>` : ''}
        </div>
      `;
      showModal(categoryLabel + (img.title ? ' · ' + img.title : ''), bodyHTML, [
        { label: '关闭', style: 'btn-ghost' }
      ]);
    }

    // 编辑画廊图片的分类和标题
    function showGalleryEditModal(ocId, imageId) {
      const oc = state.ocs.find(o => o.id === ocId);
      if (!oc || !oc.gallery) return;
      const img = oc.gallery.find(g => g.id === imageId);
      if (!img) return;
      const categoryOptions = GALLERY_CATEGORIES.map(c =>
        `<option value="${c.value}" ${c.value === img.category ? 'selected' : ''}>${c.label}</option>`
      ).join('');
      const bodyHTML = `
        <div class="gallery-edit-form">
          <div class="form-group">
            <label>分类</label>
            <select class="form-select" id="gallery-edit-category">
              ${categoryOptions}
            </select>
          </div>
          <div class="form-group">
            <label>标题</label>
            <input type="text" class="form-input" id="gallery-edit-title" value="${escapeAttr(img.title || '')}" placeholder="图片标题">
          </div>
        </div>
      `;
      showModal('编辑图片信息', bodyHTML, [
        { label: '取消', style: 'btn-ghost' },
        { label: '保存', style: 'btn-primary', onClick: () => {
          const category = document.getElementById('gallery-edit-category').value;
          const title = document.getElementById('gallery-edit-title').value;
          updateGalleryImage(ocId, imageId, { category, title });
          closeModal();
          renderProfile(ocId);
          const galleryTab = document.querySelector('.tab[data-tab="gallery"]');
          if (galleryTab) galleryTab.click();
        }}
      ]);
    }

    // ===== 碎碎念 Tab =====

    // 碎碎念心情选项（5 档 emoji）
    const WHISPER_MOODS = ['😊', '😌', '😐', '😟', '😢'];

    function renderWhispersTab(oc) {
      const whispers = oc.whispers || [];
      // 发布区
      const publishHTML = `
        <div class="whisper-publish">
          <textarea class="form-textarea whisper-input" id="whisper-input-${oc.id}" placeholder="此刻 ${escapeHtml(oc.name || 'OC')} 想说点什么..." maxlength="200" rows="3"></textarea>
          <div class="whisper-publish-actions">
            <div class="whisper-mood-picker" id="whisper-mood-picker-${oc.id}">
              ${WHISPER_MOODS.map(m => `<button type="button" class="whisper-mood-btn" data-mood="${m}" title="${m}">${m}</button>`).join('')}
            </div>
            <button class="btn btn-primary btn-sm" data-action="publish-whisper" data-id="${oc.id}">发布</button>
          </div>
          <div class="whisper-char-count" id="whisper-char-count-${oc.id}">0/200</div>
        </div>
      `;
      // 碎碎念列表（倒序，最新在上）
      const listHTML = whispers.length > 0
        ? `<div class="whisper-list">
            ${whispers.map(w => renderWhisperItem(oc, w)).join('')}
          </div>`
        : `<div class="empty-tab">${escapeHtml(oc.name || 'OC')} 还没有碎碎念，在上方写下第一条吧</div>`;

      return `
        <div class="whisper-wrap">
          ${publishHTML}
          ${listHTML}
        </div>
      `;
    }

    function renderWhisperItem(oc, w) {
      const timeStr = formatDateTime(w.createdAt);
      const moodHTML = w.mood ? `<span class="whisper-item-mood">${w.mood}</span>` : '';
      return `
        <div class="whisper-item" data-whisper-id="${w.id}">
          <div class="whisper-item-header">
            ${moodHTML}
            <span class="whisper-item-time">${escapeHtml(timeStr)}</span>
            <button class="whisper-item-delete" data-action="delete-whisper" data-id="${oc.id}" data-whisper-id="${w.id}" title="删除">×</button>
          </div>
          <div class="whisper-item-content">${escapeHtml(w.content)}</div>
        </div>
      `;
    }

    // OC 详情页社区 Tab 内容
