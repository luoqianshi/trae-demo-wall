    // ===== 4. 视图渲染函数：编辑器 =====
    // 根据 OC 的领养状态渲染对应操作区（领养副本信息 / 已上架信息+下架 / 上架按钮）
    function renderAdoptActionForOC(oc) {
      const a = oc.adoptable || {};
      // 领养副本：展示来源信息，不可再上架
      if (a.isAdopted && a.originalCreator) {
        return `<div class="adopt-info-box">🌱 领养自 <strong>${escapeHtml(a.originalCreator)}</strong>（${escapeHtml(a.license || 'CC-BY')}）</div>`;
      }
      // 已上架：展示状态 + 下架按钮
      if (a.isListed) {
        const typeLabel = { free: '无偿', fixed: '一口价 ¥' + (a.price || 0), raffle: '抽奖' }[a.type] || a.type;
        return `
          <div class="adopt-info-box">✓ 已上架到领养市场（${typeLabel}）</div>
          <button class="btn btn-ghost btn-sm" data-action="unlist-adopt" data-id="${oc.id}">下架</button>
        `;
      }
      // 普通 OC：展示上架按钮
      return `<button class="btn btn-ghost" data-action="list-adopt" data-id="${oc.id}">🌱 上架到领养市场</button>`;
    }

    function renderOCCommunityTab(oc) {
      const liked = isLiked('oc', oc.id);
      const favorited = isFavorited('oc', oc.id);
      const adopted = isAdopted(oc.id);
      const likeCount = oc.communityLikes || 0;
      const commentList = getComments('oc', oc.id);
      const commentCount = commentList.length;
      const favoriteCount = 0; // OC 收藏数暂不统计他人
      const adoptionCount = (oc.adoptable && oc.adoptable.isAdopted) ? 1 : 0; // 被领养数
      const isPublic = oc.privacy === 'public';

      const commentsHTML = commentList.length > 0
        ? commentList.map(c => renderCommentItem(c)).join('')
        : `<div class="empty-state"><p>暂无评论</p></div>`;

      return `
        <div class="community-stats-grid">
          <div class="community-stat">
            <div class="community-stat-value">${likeCount}</div>
            <div class="community-stat-label">点赞</div>
          </div>
          <div class="community-stat">
            <div class="community-stat-value">${commentCount}</div>
            <div class="community-stat-label">评论</div>
          </div>
          <div class="community-stat">
            <div class="community-stat-value">${favoriteCount}</div>
            <div class="community-stat-label">收藏</div>
          </div>
          <div class="community-stat">
            <div class="community-stat-value">${adoptionCount}</div>
            <div class="community-stat-label">被领养</div>
          </div>
        </div>
        <div class="community-actions">
          <button class="like-btn ${liked ? 'liked' : ''}" data-action="like-oc" data-id="${oc.id}">
            ${liked ? '❤️ 已点赞' : '🤍 点赞'}
          </button>
          <button class="favorite-btn ${favorited ? 'favorited' : ''}" data-action="favorite-oc" data-id="${oc.id}">
            ${favorited ? '⭐ 已收藏' : '☆ 收藏'}
          </button>
          ${renderAdoptActionForOC(oc)}
          ${isPublic
            ? `<button class="btn btn-primary" data-action="share-oc" data-id="${oc.id}">📤 分享到社区</button>`
            : `<button class="btn btn-ghost" disabled title="请先将 OC 设为公开">📤 分享到社区（需公开）</button>`
          }
        </div>
        <div class="topic-comments">
          <h3 class="comments-header">💬 评论 (${commentCount})</h3>
          <div class="comment-list">${commentsHTML}</div>
          <div class="comment-input-area">
            <textarea class="comment-input" placeholder="写下你对这个 OC 的看法..." rows="3"></textarea>
            <button class="btn btn-primary" data-action="send-comment" data-target-type="oc" data-target-id="${oc.id}">发送</button>
          </div>
        </div>
      `;
    }

    // 视图：创建/编辑表单
    function renderEditor(id) {
      const isEdit = !!id;
      const oc = isEdit
        ? state.ocs.find(o => o.id === id)
        : createDefaultOC();

      if (isEdit && !oc) {
        showToast('未找到该 OC', 'error');
        navigate('#/garden');
        return;
      }

      const emojiOptions = ['🌸','🦊','🐉','🐺','🐱','🦅','🌙','⭐','🔥','❄️','🦋','🌊','🍃','☀️','🎭','🔮','🦌','🐰','🦜','🐚'];
      const mbtiOptions = ['INTJ','INTP','ENTJ','ENTP','INFJ','INFP','ENFJ','ENFP','ISTJ','ISFJ','ESTJ','ESFJ','ISTP','ISFP','ESTP','ESFP'];
      const relationTypeOptions = ['朋友','挚友','恋人','家人','师徒','宿敌','同事','邻居','其他'];

      // 立绘预览内容
      const portraitPreviewHTML = oc.portraitImage
        ? `<img src="${oc.portraitImage}" alt="立绘预览">`
        : `<div class="character-preview-silhouette">
            <svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="100" cy="50" rx="32" ry="38" fill="currentColor" opacity="0.6"/>
              <path d="M 68 88 Q 68 85 72 85 L 128 85 Q 132 85 132 88 L 140 180 Q 140 185 135 185 L 65 185 Q 60 185 60 180 Z" fill="currentColor" opacity="0.5"/>
              <path d="M 72 185 L 60 280 Q 58 285 62 285 L 82 285 Q 86 285 86 280 L 88 185 Z" fill="currentColor" opacity="0.5"/>
              <path d="M 128 185 L 140 280 Q 142 285 138 285 L 118 285 Q 114 285 114 280 L 112 185 Z" fill="currentColor" opacity="0.5"/>
            </svg>
          </div>
          <div class="character-preview-label">人物剪影 · 待生成</div>`;

      // 关系编辑器行
      const relationRowsHTML = oc.relations.length > 0
        ? oc.relations.map((r, i) => `
            <div class="editor-row" data-row-type="relation" data-index="${i}">
              <select class="form-select" name="relation-target-${i}">
                <option value="">选择 OC</option>
                ${state.ocs.filter(o => o.id !== oc.id).map(o => `<option value="${o.id}" ${r.targetId===o.id?'selected':''}>${escapeHtml(o.name)}</option>`).join('')}
              </select>
              <select class="form-select" name="relation-type-${i}">
                ${relationTypeOptions.map(t => `<option value="${t}" ${r.type===t?'selected':''}>${t}</option>`).join('')}
              </select>
              <input type="text" class="form-input desc-input" name="relation-desc-${i}" value="${escapeAttr(r.desc || '')}" placeholder="关系描述">
              <div class="editor-row-remove" data-remove="relation" data-index="${i}">×</div>
            </div>
          `).join('')
        : `<div class="editor-empty-hint">还没有关系记录，点击下方按钮添加</div>`;

      // 时间线编辑器行
      const timelineRowsHTML = oc.timeline.length > 0
        ? oc.timeline.map((t, i) => `
            <div class="editor-row" data-row-type="timeline" data-index="${i}">
              <input type="text" class="form-input" name="timeline-date-${i}" value="${escapeAttr(t.date || '')}" placeholder="日期/年龄" style="flex:0 0 120px;">
              <input type="text" class="form-input desc-input" name="timeline-event-${i}" value="${escapeAttr(t.event || '')}" placeholder="事件描述">
              <div class="editor-row-remove" data-remove="timeline" data-index="${i}">×</div>
            </div>
          `).join('')
        : `<div class="editor-empty-hint">还没有时间线记录，点击下方按钮添加</div>`;

      // 喜好/厌恶标签
      const renderTagList = (tags, type) => tags.length > 0
        ? tags.map((t, i) => `
            <span class="tag-item">
              ${escapeHtml(t)}
              <span class="tag-remove" data-tag-type="${type}" data-tag-index="${i}">×</span>
            </span>
          `).join('')
        : '';

      const app = document.getElementById('app');
      app.innerHTML = `
        <div class="back-link" data-route="${isEdit ? '#/oc/' + id : '#/garden'}">← 返回</div>
        <div class="page-header">
          <p class="page-eyebrow">${isEdit ? 'Edit Character' : 'New Character'}</p>
          <h1 class="page-title">${isEdit ? '编辑 OC' : '创建新 OC'}</h1>
          <p class="page-subtitle">${isEdit ? '修改角色的设定信息' : '为你的原创角色建立一份完整档案'}</p>
        </div>

        <form class="editor-form" id="oc-form" data-edit-id="${isEdit ? id : ''}">
          <div class="editor-layout">

            <!-- 左栏：人物形象设计（捏人区） -->
            <div class="editor-left">
              <h3 class="form-section-title">人物形象</h3>

              <!-- 大图预览 -->
              <div class="character-preview" id="portrait-preview" style="${oc.portraitImage ? '' : 'color: var(--accent);'}">
                ${portraitPreviewHTML}
              </div>

              <!-- 立绘操作按钮 -->
              <div class="portrait-actions">
                <button type="button" class="btn btn-primary" id="btn-generate-portrait">🎨 AI 生成立绘</button>
                <button type="button" class="btn btn-ghost" id="btn-upload-portrait">📤 上传图片</button>
                ${oc.portraitImage ? '<button type="button" class="btn btn-ghost" id="btn-clear-portrait">🗑️ 清除</button>' : ''}
              </div>
              <input type="file" id="portrait-upload-input" accept="image/*" style="display:none;">
              <input type="hidden" name="portraitImage" value="${escapeAttr(oc.portraitImage || '')}">

              <!-- Emoji 头像兜底 -->
              <div class="form-group">
                <label class="form-label">头像 Emoji（无立绘时显示）</label>
                <div class="emoji-picker" id="emoji-picker">
                  ${emojiOptions.map(e => `<div class="emoji-option ${e===oc.avatar?'selected':''}" data-emoji="${e}">${e}</div>`).join('')}
                </div>
                <input type="hidden" name="avatar" value="${oc.avatar}">
              </div>

              <!-- 细分外观字段 -->
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">发型</label>
                  <input type="text" class="form-input" name="hairStyle" value="${escapeAttr(oc.hairStyle)}" placeholder="如 银色长发及腰">
                </div>
                <div class="form-group">
                  <label class="form-label">瞳色</label>
                  <input type="text" class="form-input" name="eyeColor" value="${escapeAttr(oc.eyeColor)}" placeholder="如 紫色瞳孔">
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">肤色</label>
                  <input type="text" class="form-input" name="skinTone" value="${escapeAttr(oc.skinTone)}" placeholder="如 白皙 / 小麦色">
                </div>
                <div class="form-group">
                  <label class="form-label">身高</label>
                  <input type="text" class="form-input" name="height" value="${escapeAttr(oc.height)}" placeholder="如 165cm">
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">体型</label>
                <input type="text" class="form-input" name="bodyType" value="${escapeAttr(oc.bodyType)}" placeholder="如 纤细 / 健壮 / 丰满">
              </div>
              <div class="form-group">
                <label class="form-label">配色方案</label>
                <div class="color-inputs">
                  ${[0,1,2].map(i => `
                    <div class="color-input-wrapper">
                      <input type="color" class="color-input" name="color${i}" value="${oc.colors[i] || '#ff2e97'}">
                    </div>
                  `).join('')}
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">服装</label>
                <textarea class="form-textarea" name="outfit" placeholder="描述角色的服装风格">${escapeHtml(oc.outfit)}</textarea>
              </div>
              <div class="form-group">
                <label class="form-label">特征标记</label>
                <textarea class="form-textarea" name="features" placeholder="外貌上的显著特征，如疤痕、胎记、特殊瞳色等">${escapeHtml(oc.features)}</textarea>
              </div>
            </div>

            <!-- 右栏：人物信息 -->
            <div class="editor-right">

              <!-- 1. 基础信息 -->
              <div class="form-section">
                <h3 class="form-section-title">基础信息</h3>
                <div class="form-group">
                  <label class="form-label">姓名 <span class="required">*</span></label>
                  <input type="text" class="form-input" name="name" value="${escapeAttr(oc.name)}" required placeholder="给角色起个名字">
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">性别</label>
                    <select class="form-select" name="gender">
                      <option value="">请选择</option>
                      <option value="女" ${oc.gender==='女'?'selected':''}>女</option>
                      <option value="男" ${oc.gender==='男'?'selected':''}>男</option>
                      <option value="非二元" ${oc.gender==='非二元'?'selected':''}>非二元</option>
                      <option value="无性别" ${oc.gender==='无性别'?'selected':''}>无性别</option>
                      <option value="其他" ${oc.gender==='其他'?'selected':''}>其他</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">年龄</label>
                    <input type="text" class="form-input" name="age" value="${escapeAttr(oc.age)}" placeholder="如 17 / 不老 / 300岁">
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">种族</label>
                    <input type="text" class="form-input" name="race" value="${escapeAttr(oc.race)}" placeholder="如 人类 / 精灵 / 星灵族">
                  </div>
                  <div class="form-group">
                    <label class="form-label">世界观</label>
                    <input type="text" class="form-input" name="worldview" value="${escapeAttr(oc.worldview)}" placeholder="角色所属的世界设定">
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">口头禅</label>
                  <input type="text" class="form-input" name="catchphrase" value="${escapeAttr(oc.catchphrase)}" placeholder="角色的标志性台词">
                </div>
                <div class="form-group">
                  <label class="form-label">隐私等级</label>
                  <select class="form-select" name="privacy">
                    <option value="private" ${oc.privacy==='private'?'selected':''}>仅自己可见</option>
                    <option value="followers" ${oc.privacy==='followers'?'selected':''}>仅粉丝可见</option>
                    <option value="public" ${oc.privacy==='public'?'selected':''}>公开可见</option>
                  </select>
                </div>
              </div>

              <!-- 2. 性格 -->
              <div class="form-section">
                <h3 class="form-section-title">性格</h3>
                <div class="form-group">
                  <label class="form-label">MBTI 人格</label>
                  <select class="form-select" name="mbti">
                    <option value="">请选择</option>
                    ${mbtiOptions.map(m => `<option value="${m}" ${oc.mbti===m?'selected':''}>${m}</option>`).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">性格关键词</label>
                  <div class="tag-input-wrapper" id="tag-input-wrapper">
                    ${oc.personalityTags.map(t => `
                      <span class="tag-item">
                        ${escapeHtml(t)}
                        <span class="tag-remove" data-tag-type="personality" data-tag="${escapeAttr(t)}">×</span>
                      </span>
                    `).join('')}
                    <input type="text" class="tag-input" id="tag-input" placeholder="输入关键词后回车">
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">喜好</label>
                  <div class="tag-input-wrapper" id="likes-input-wrapper">
                    ${renderTagList(oc.likes, 'likes')}
                    <input type="text" class="tag-input" id="likes-input" placeholder="输入喜好后回车，如 观星">
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">厌恶</label>
                  <div class="tag-input-wrapper" id="dislikes-input-wrapper">
                    ${renderTagList(oc.dislikes, 'dislikes')}
                    <input type="text" class="tag-input" id="dislikes-input" placeholder="输入厌恶后回车，如 嘈杂">
                  </div>
                </div>
              </div>

              <!-- 3. 背景故事与能力设定 -->
              <div class="form-section">
                <h3 class="form-section-title">背景故事与能力设定</h3>
                <div class="form-group">
                  <label class="form-label">职业/身份</label>
                  <input type="text" class="form-input" name="occupation" value="${escapeAttr(oc.occupation)}" placeholder="如 学生 / 骑士 / 流浪法师">
                </div>
                <div class="form-group">
                  <label class="form-label">能力设定</label>
                  <textarea class="form-textarea" name="abilities" placeholder="特殊能力、技能、魔法等">${escapeHtml(oc.abilities)}</textarea>
                </div>
                <div class="form-group">
                  <label class="form-label">背景故事</label>
                  <textarea class="form-textarea" name="background" rows="6" placeholder="角色的过往经历、出身、重要事件等">${escapeHtml(oc.background)}</textarea>
                </div>
              </div>

              <!-- 4. 关系图谱 -->
              <div class="form-section">
                <h3 class="form-section-title">关系图谱</h3>
                <div class="editor-row-list" id="relation-rows">
                  ${relationRowsHTML}
                </div>
                <button type="button" class="btn btn-ghost" id="btn-add-relation" style="width:100%;">+ 添加关系</button>
              </div>

              <!-- 5. 时间线 -->
              <div class="form-section">
                <h3 class="form-section-title">时间线</h3>
                <div class="editor-row-list" id="timeline-rows">
                  ${timelineRowsHTML}
                </div>
                <button type="button" class="btn btn-ghost" id="btn-add-timeline" style="width:100%;">+ 添加时间线事件</button>
              </div>

              <!-- 6. 版权信息 -->
              <div class="form-section">
                <h3 class="form-section-title">版权信息</h3>
                <div class="form-group">
                  <label class="form-label">作者/创作者</label>
                  <input type="text" class="form-input" name="copyrightAuthor" value="${escapeAttr(oc.copyright?.author || state.copyrightSettings.defaultAuthor || '')}" placeholder="默认使用全局设置">
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">版权协议</label>
                    <select class="form-select" name="copyrightLicense">
                      ${['CC-BY','CC-BY-NC','独家','商用授权','保留所有权利'].map(l => `<option value="${l}" ${oc.copyright?.license===l?'selected':''}>${l}</option>`).join('')}
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">登记日期</label>
                    <input type="date" class="form-input" name="copyrightRegisteredAt" value="${oc.copyright?.registeredAt ? new Date(oc.copyright.registeredAt).toISOString().slice(0,10) : ''}">
                  </div>
                </div>
                <div class="form-group">
                  <label class="checkbox-wrapper">
                    <input type="checkbox" name="watermarkEnabled" ${oc.copyright?.watermarkEnabled !== false ? 'checked' : ''}>
                    <span>启用水印保护</span>
                  </label>
                </div>
                <div class="form-group">
                  <label class="form-label">水印文字（留空则用 OC 名字）</label>
                  <input type="text" class="form-input" name="watermarkText" value="${escapeAttr(oc.copyright?.watermarkText || '')}" placeholder="如 ©作者名">
                </div>
                <div class="form-group">
                  <label class="checkbox-wrapper">
                    <input type="checkbox" name="disableDownload" ${oc.copyright?.disableDownload !== false ? 'checked' : ''}>
                    <span>禁止下载（禁用右键和拖拽）</span>
                  </label>
                </div>
              </div>

              <div class="form-actions">
                <button type="button" class="btn btn-ghost" data-route="${isEdit ? '#/oc/' + id : '#/garden'}">取消</button>
                <button type="submit" class="btn btn-primary">${isEdit ? '保存修改' : '创建角色'}</button>
              </div>
            </div>

          </div>
        </form>
      `;

      initEditorInteractions();
    }

    function initEditorInteractions() {
      // Emoji 头像选择
      document.getElementById('emoji-picker').addEventListener('click', (e) => {
        const option = e.target.closest('.emoji-option');
        if (!option) return;
        document.querySelectorAll('.emoji-option').forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
        document.querySelector('input[name="avatar"]').value = option.dataset.emoji;
      });

      // 通用标签输入处理（性格、喜好、厌恶）
      const setupTagInput = (wrapperId, inputId, type) => {
        const wrapper = document.getElementById(wrapperId);
        const input = document.getElementById(inputId);
        if (!wrapper || !input) return;

        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && input.value.trim()) {
            e.preventDefault();
            const value = input.value.trim();
            const existing = Array.from(wrapper.querySelectorAll('.tag-item'))
              .map(item => item.textContent.replace('×', '').trim());
            if (existing.includes(value)) {
              showToast('该标签已存在', 'info');
              return;
            }
            const tagEl = document.createElement('span');
            tagEl.className = 'tag-item';
            tagEl.innerHTML = `${escapeHtml(value)} <span class="tag-remove" data-tag-type="${type}" data-tag="${escapeAttr(value)}">×</span>`;
            wrapper.insertBefore(tagEl, input);
            input.value = '';
          }
        });
      };

      setupTagInput('tag-input-wrapper', 'tag-input', 'personality');
      setupTagInput('likes-input-wrapper', 'likes-input', 'likes');
      setupTagInput('dislikes-input-wrapper', 'dislikes-input', 'dislikes');

      // 标签删除（事件委托，统一处理所有 tag-remove）
      document.getElementById('oc-form').addEventListener('click', (e) => {
        if (e.target.classList.contains('tag-remove')) {
          e.target.closest('.tag-item').remove();
        }
      });

      // === AI 立绘生成 ===
      const btnGenerate = document.getElementById('btn-generate-portrait');
      if (btnGenerate) {
        btnGenerate.addEventListener('click', async () => {
          const form = document.getElementById('oc-form');
          const formData = new FormData(form);
          // 从表单收集当前 OC 数据用于生成提示词
          const tempOC = {
            gender: formData.get('gender'),
            age: formData.get('age'),
            race: formData.get('race'),
            hairStyle: formData.get('hairStyle'),
            eyeColor: formData.get('eyeColor'),
            skinTone: formData.get('skinTone'),
            bodyType: formData.get('bodyType'),
            height: formData.get('height'),
            outfit: formData.get('outfit'),
            features: formData.get('features'),
            colors: [formData.get('color0'), formData.get('color1'), formData.get('color2')]
          };

          const preview = document.getElementById('portrait-preview');
          // 显示 loading
          preview.innerHTML = `
            <div class="portrait-loading">
              <div class="loading-spinner"></div>
              <div class="loading-text">AI 正在绘制立绘，请稍候...</div>
            </div>
          `;
          btnGenerate.disabled = true;
          btnGenerate.textContent = '生成中...';

          try {
            const imageUrl = await generatePortrait(tempOC);
            if (!imageUrl) throw new Error('未获取到图片URL');
            preview.innerHTML = `<img src="${imageUrl}" alt="AI 生成立绘">`;
            document.querySelector('input[name="portraitImage"]').value = imageUrl;
            showToast('立绘生成成功', 'success');
            // 重新渲染以显示"清除"按钮
            const clearBtn = document.getElementById('btn-clear-portrait');
            if (!clearBtn) {
              const actionsDiv = btnGenerate.parentElement;
              const newClearBtn = document.createElement('button');
              newClearBtn.type = 'button';
              newClearBtn.className = 'btn btn-ghost';
              newClearBtn.id = 'btn-clear-portrait';
              newClearBtn.textContent = '🗑️ 清除';
              newClearBtn.addEventListener('click', clearPortrait);
              actionsDiv.appendChild(newClearBtn);
            }
          } catch (err) {
            showToast('立绘生成失败：' + err.message, 'error');
            preview.style.color = 'var(--text-muted)';
            preview.innerHTML = getSilhouetteHTML('生成失败，请重试或上传本地图片');
          } finally {
            btnGenerate.disabled = false;
            btnGenerate.textContent = '🎨 AI 生成立绘';
          }
        });
      }

      // 生成剪影占位 HTML
      function getSilhouetteHTML(label) {
        return `
          <div class="character-preview-silhouette">
            <svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="100" cy="50" rx="32" ry="38" fill="currentColor" opacity="0.6"/>
              <path d="M 68 88 Q 68 85 72 85 L 128 85 Q 132 85 132 88 L 140 180 Q 140 185 135 185 L 65 185 Q 60 185 60 180 Z" fill="currentColor" opacity="0.5"/>
              <path d="M 72 185 L 60 280 Q 58 285 62 285 L 82 285 Q 86 285 86 280 L 88 185 Z" fill="currentColor" opacity="0.5"/>
              <path d="M 128 185 L 140 280 Q 142 285 138 285 L 118 285 Q 114 285 114 280 L 112 185 Z" fill="currentColor" opacity="0.5"/>
            </svg>
          </div>
          <div class="character-preview-label">${label}</div>
        `;
      }

      // === 清除立绘 ===
      const clearBtn = document.getElementById('btn-clear-portrait');
      if (clearBtn) {
        clearBtn.addEventListener('click', clearPortrait);
      }
      function clearPortrait() {
        const preview = document.getElementById('portrait-preview');
        preview.style.color = 'var(--accent)';
        preview.innerHTML = getSilhouetteHTML('人物剪影 · 待生成');
        document.querySelector('input[name="portraitImage"]').value = '';
        const btn = document.getElementById('btn-clear-portrait');
        if (btn) btn.remove();
      }

      // === 本地图片上传 ===
      const btnUpload = document.getElementById('btn-upload-portrait');
      const fileInput = document.getElementById('portrait-upload-input');
      if (btnUpload && fileInput) {
        btnUpload.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const preview = document.getElementById('portrait-preview');
          preview.innerHTML = `
            <div class="portrait-loading">
              <div class="loading-spinner"></div>
              <div class="loading-text">正在处理图片...</div>
            </div>
          `;
          try {
            const base64 = await compressImage(file);
            preview.innerHTML = `<img src="${base64}" alt="上传的立绘">`;
            document.querySelector('input[name="portraitImage"]').value = base64;
            showToast('图片上传成功', 'success');
            // 显示清除按钮
            if (!document.getElementById('btn-clear-portrait')) {
              const actionsDiv = btnUpload.parentElement;
              const newClearBtn = document.createElement('button');
              newClearBtn.type = 'button';
              newClearBtn.className = 'btn btn-ghost';
              newClearBtn.id = 'btn-clear-portrait';
              newClearBtn.textContent = '🗑️ 清除';
              newClearBtn.addEventListener('click', clearPortrait);
              actionsDiv.appendChild(newClearBtn);
            }
          } catch (err) {
            showToast('图片处理失败：' + err.message, 'error');
            preview.style.color = 'var(--text-muted)';
            preview.innerHTML = getSilhouetteHTML('上传失败，请重试');
          }
          fileInput.value = '';
        });
      }

      // === 关系图谱：添加/删除行 ===
      const relationTypeOptions = ['朋友','挚友','恋人','家人','师徒','宿敌','同事','邻居','其他'];
      const btnAddRelation = document.getElementById('btn-add-relation');
      const relationRows = document.getElementById('relation-rows');

      const createRelationRow = () => {
        // 计算新行的 index（基于现有行数）
        const existingCount = relationRows.querySelectorAll('.editor-row[data-row-type="relation"]').length;
        const i = existingCount;
        const emptyHint = relationRows.querySelector('.editor-empty-hint');
        if (emptyHint) emptyHint.remove();

        const row = document.createElement('div');
        row.className = 'editor-row';
        row.dataset.rowType = 'relation';
        row.dataset.index = i;
        const editId = document.getElementById('oc-form').dataset.editId;
        const currentOCId = editId || '';
        row.innerHTML = `
          <select class="form-select" name="relation-target-${i}">
            <option value="">选择 OC</option>
            ${state.ocs.filter(o => o.id !== currentOCId).map(o => `<option value="${o.id}">${escapeHtml(o.name)}</option>`).join('')}
          </select>
          <select class="form-select" name="relation-type-${i}">
            ${relationTypeOptions.map(t => `<option value="${t}">${t}</option>`).join('')}
          </select>
          <input type="text" class="form-input desc-input" name="relation-desc-${i}" placeholder="关系描述">
          <div class="editor-row-remove" data-remove="relation">×</div>
        `;
        relationRows.appendChild(row);
      };

      if (btnAddRelation) {
        btnAddRelation.addEventListener('click', createRelationRow);
      }

      // === 时间线：添加/删除行 ===
      const btnAddTimeline = document.getElementById('btn-add-timeline');
      const timelineRows = document.getElementById('timeline-rows');

      const createTimelineRow = () => {
        const existingCount = timelineRows.querySelectorAll('.editor-row[data-row-type="timeline"]').length;
        const i = existingCount;
        const emptyHint = timelineRows.querySelector('.editor-empty-hint');
        if (emptyHint) emptyHint.remove();

        const row = document.createElement('div');
        row.className = 'editor-row';
        row.dataset.rowType = 'timeline';
        row.dataset.index = i;
        row.innerHTML = `
          <input type="text" class="form-input" name="timeline-date-${i}" placeholder="日期/年龄" style="flex:0 0 120px;">
          <input type="text" class="form-input desc-input" name="timeline-event-${i}" placeholder="事件描述">
          <div class="editor-row-remove" data-remove="timeline">×</div>
        `;
        timelineRows.appendChild(row);
      };

      if (btnAddTimeline) {
        btnAddTimeline.addEventListener('click', createTimelineRow);
      }

      // 删除行（事件委托）
      document.getElementById('oc-form').addEventListener('click', (e) => {
        if (e.target.classList.contains('editor-row-remove')) {
          const row = e.target.closest('.editor-row');
          const list = row.parentElement;
          row.remove();
          // 如果列表为空，显示空状态提示
          if (list.querySelectorAll('.editor-row').length === 0) {
            const type = list.id === 'relation-rows' ? 'relation' : 'timeline';
            const hint = document.createElement('div');
            hint.className = 'editor-empty-hint';
            hint.textContent = type === 'relation' ? '还没有关系记录，点击下方按钮添加' : '还没有时间线记录，点击下方按钮添加';
            list.appendChild(hint);
          }
        }
      });

      // 表单提交
      document.getElementById('oc-form').addEventListener('submit', (e) => {
        e.preventDefault();
        handleFormSubmit();
      });
    }

    function handleFormSubmit() {
      const form = document.getElementById('oc-form');
      const formData = new FormData(form);
      const isEdit = !!form.dataset.editId;

      const name = formData.get('name').trim();
      if (!name) {
        showToast('请填写角色姓名', 'error');
        return;
      }

      // 收集标签类字段
      const collectTags = (wrapperId) => Array.from(document.querySelectorAll(`#${wrapperId} .tag-item`))
        .map(item => item.textContent.replace('×', '').trim())
        .filter(Boolean);

      const personalityTags = collectTags('tag-input-wrapper');
      const likes = collectTags('likes-input-wrapper');
      const dislikes = collectTags('dislikes-input-wrapper');

      // 收集关系图谱
      const relations = [];
      document.querySelectorAll('#relation-rows .editor-row').forEach(row => {
        const i = row.dataset.index;
        const targetId = formData.get(`relation-target-${i}`);
        const type = formData.get(`relation-type-${i}`);
        const desc = (formData.get(`relation-desc-${i}`) || '').trim();
        if (targetId && type) {
          relations.push({ targetId, type, desc });
        }
      });

      // 收集时间线
      const timeline = [];
      document.querySelectorAll('#timeline-rows .editor-row').forEach(row => {
        const i = row.dataset.index;
        const date = (formData.get(`timeline-date-${i}`) || '').trim();
        const event = (formData.get(`timeline-event-${i}`) || '').trim();
        if (date && event) {
          timeline.push({ date, event });
        }
      });

      const editId = form.dataset.editId;

      const ocData = {
        name,
        gender: formData.get('gender') || '',
        age: (formData.get('age') || '').trim(),
        race: (formData.get('race') || '').trim(),
        worldview: (formData.get('worldview') || '').trim(),
        catchphrase: (formData.get('catchphrase') || '').trim(),
        avatar: formData.get('avatar') || '🌸',
        colors: [formData.get('color0'), formData.get('color1'), formData.get('color2')],
        // 细分外观字段
        hairStyle: (formData.get('hairStyle') || '').trim(),
        eyeColor: (formData.get('eyeColor') || '').trim(),
        skinTone: (formData.get('skinTone') || '').trim(),
        height: (formData.get('height') || '').trim(),
        bodyType: (formData.get('bodyType') || '').trim(),
        outfit: (formData.get('outfit') || '').trim(),
        features: (formData.get('features') || '').trim(),
        // 背景故事与能力设定
        background: (formData.get('background') || '').trim(),
        occupation: (formData.get('occupation') || '').trim(),
        abilities: (formData.get('abilities') || '').trim(),
        likes,
        dislikes,
        // 图片字段
        portraitImage: formData.get('portraitImage') || '',
        // 性格
        mbti: formData.get('mbti') || '',
        personalityTags,
        // 关系与时间线
        relations,
        timeline,
        privacy: formData.get('privacy') || 'private',
        // 版权信息
        copyright: {
          author: (formData.get('copyrightAuthor') || '').trim(),
          license: formData.get('copyrightLicense') || 'CC-BY',
          registeredAt: formData.get('copyrightRegisteredAt') ? new Date(formData.get('copyrightRegisteredAt')).getTime() : null,
          watermarkEnabled: formData.get('watermarkEnabled') === 'on',
          watermarkText: (formData.get('watermarkText') || '').trim(),
          disableDownload: formData.get('disableDownload') === 'on'
        }
      };

      if (editId) {
        updateOC(editId, ocData);
        showToast('OC 信息已更新', 'success');
        navigate('#/oc/' + editId);
      } else {
        const newOC = createOC(ocData);
        showToast(`角色 "${name}" 已创建`, 'success');
        navigate('#/oc/' + newOC.id);
      }
    }

    // 视图：养成互动
