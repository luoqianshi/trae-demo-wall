    // ===== 8. 事件绑定与初始化 =====

    function bindGlobalEvents() {
      document.addEventListener('click', (e) => {
        const navTarget = e.target.closest('[data-route]');
        if (navTarget) {
          e.preventDefault();
          navigate(navTarget.dataset.route);
          return;
        }

        const actionEl = e.target.closest('[data-action]');
        if (!actionEl) {
          // 碎碎念心情选择（无 data-action，通过 class 识别）
          if (e.target.classList.contains('whisper-mood-btn')) {
            const picker = e.target.parentElement;
            picker.querySelectorAll('.whisper-mood-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            return;
          }
          return;
        }

        const action = actionEl.dataset.action;
        const id = actionEl.dataset.id;
        const type = actionEl.dataset.type;

        switch (action) {
          case 'create-oc':
            navigate('#/editor');
            break;
          case 'view-oc':
            navigate('#/oc/' + id);
            break;
          case 'edit-oc':
            navigate('#/editor/' + id);
            break;
          case 'delete-oc':
            const oc = state.ocs.find(o => o.id === id);
            if (oc) {
              confirmDialog(`确定要删除角色 "${oc.name}" 吗？此操作不可恢复。`, () => {
                deleteOC(id);
                navigate('#/garden');
              });
            }
            break;
          case 'export-oc':
            exportSingleOC(id);
            break;
          // ===== 画廊操作 =====
          case 'upload-gallery-image': {
            const input = document.getElementById(`gallery-upload-input-${id}`);
            if (input) input.click();
            break;
          }
          case 'filter-gallery': {
            document.querySelectorAll('.gallery-filter-btn').forEach(b => b.classList.remove('active'));
            actionEl.classList.add('active');
            const filter = actionEl.dataset.value;
            document.querySelectorAll('.gallery-item').forEach(item => {
              if (filter === 'all') {
                item.style.display = '';
              } else {
                const cat = item.querySelector('.gallery-item-category')?.dataset.category;
                item.style.display = (cat === filter) ? '' : 'none';
              }
            });
            break;
          }
          case 'view-gallery-image': {
            const imageId = actionEl.dataset.imageId;
            showGalleryImageModal(id, imageId);
            break;
          }
          case 'set-portrait-from-gallery': {
            const imageId = actionEl.dataset.imageId;
            confirmDialog('确定将这张图片设为主立绘吗？', () => {
              setGalleryImageAsPortrait(id, imageId);
              renderProfile(id);
            });
            break;
          }
          case 'edit-gallery-image': {
            const imageId = actionEl.dataset.imageId;
            showGalleryEditModal(id, imageId);
            break;
          }
          case 'delete-gallery-image': {
            const imageId = actionEl.dataset.imageId;
            confirmDialog('确定删除这张图片吗？此操作不可恢复。', () => {
              deleteGalleryImage(id, imageId);
              renderProfile(id);
              const galleryTab = document.querySelector('.tab[data-tab="gallery"]');
              if (galleryTab) galleryTab.click();
            });
            break;
          }
          // ===== 碎碎念操作 =====
          case 'publish-whisper': {
            const input = document.getElementById(`whisper-input-${id}`);
            if (!input) break;
            const content = input.value;
            // 获取选中的心情（带 active 类的 mood-btn）
            const activeMood = document.querySelector(`#whisper-mood-picker-${id} .whisper-mood-btn.active`);
            const mood = activeMood ? activeMood.dataset.mood : '';
            const result = addWhisper(id, content, mood);
            if (result) {
              renderProfile(id);
              const whisperTab = document.querySelector('.tab[data-tab="whispers"]');
              if (whisperTab) whisperTab.click();
            }
            break;
          }
          case 'delete-whisper': {
            const whisperId = actionEl.dataset.whisperId;
            confirmDialog('确定删除这条碎碎念吗？', () => {
              deleteWhisper(id, whisperId);
              renderProfile(id);
              const whisperTab = document.querySelector('.tab[data-tab="whispers"]');
              if (whisperTab) whisperTab.click();
            });
            break;
          }
          case 'load-sample':
            loadSampleData();
            if (state.currentRoute === '#/garden' || state.currentRoute === '#/') {
              renderGarden();
            } else if (state.currentRoute === '#/settings') {
              renderSettings();
            }
            break;
          case 'select-nurture-oc':
            state.currentOCId = id;
            renderNurtureContent();
            break;
          case 'interact':
            interact(state.currentOCId, type);
            break;
          case 'export-all':
            exportData();
            break;
          case 'import-data':
            document.getElementById('import-file-input').click();
            break;
          case 'clear-all':
            confirmDialog('确定要清空所有数据吗？所有 OC、成就、约稿记录将被永久删除。', () => {
              clearAllData();
              renderSettings();
            });
            break;
          case 'add-commission':
            renderCommissionForm(null);
            break;
          case 'edit-commission':
            renderCommissionForm(id);
            break;
          case 'delete-commission':
            deleteCommission(id);
            break;
          case 'add-artist':
            renderArtistForm(null);
            break;
          case 'edit-artist':
            renderArtistForm(id);
            break;
          case 'delete-artist':
            deleteArtist(id);
            break;
          case 'commission-from-artist':
            renderCommissionForm(null, id);
            break;
          case 'save-copyright-settings':
            state.copyrightSettings.defaultAuthor = document.getElementById('default-author').value.trim();
            state.copyrightSettings.defaultWatermark = document.getElementById('default-watermark').checked;
            state.copyrightSettings.defaultDisableDownload = document.getElementById('default-disable-download').checked;
            state.copyrightSettings.defaultLicense = document.getElementById('default-license').value;
            saveState();
            showToast('版权默认设置已保存', 'success');
            break;
          // ===== 社区互动 =====
          case 'switch-community-tab':
            state.currentCommunityTab = actionEl.dataset.value || 'topics';
            saveState();
            break;
          case 'filter-community':
            state.currentCommunityFilter = actionEl.dataset.value || 'all';
            renderCommunity();
            break;
          case 'publish-topic':
            renderTopicForm(null);
            break;
          case 'view-topic':
            navigate('#/topic/' + id);
            break;
          case 'like-topic':
            toggleLike('topic', id);
            if (state.currentRoute.startsWith('#/topic/')) {
              renderTopicDetail(id);
            } else {
              renderCommunity();
            }
            break;
          case 'favorite-topic':
            toggleFavorite('topic', id);
            if (state.currentRoute.startsWith('#/topic/')) {
              renderTopicDetail(id);
            } else {
              renderCommunity();
            }
            break;
          case 'delete-topic': {
            const topic = state.topics.find(t => t.id === id);
            if (!topic) break;
            if (topic.isSample) {
              showToast('示例话题不可删除', 'warning');
              break;
            }
            confirmDialog(`确定要删除话题"${topic.title}"吗？`, () => {
              state.topics = state.topics.filter(t => t.id !== id);
              // 同时删除关联评论
              state.comments = state.comments.filter(c => !(c.targetType === 'topic' && c.targetId === id));
              saveState();
              showToast('话题已删除', 'success');
              navigate('#/community');
            });
            break;
          }
          case 'like-oc':
            toggleLike('oc', id);
            renderProfile(id);
            // 切换到社区 Tab
            state.currentTab = 'community';
            const communityTab = document.querySelector('.tab[data-tab="community"]');
            if (communityTab) communityTab.click();
            break;
          case 'favorite-oc':
            toggleFavorite('oc', id);
            renderProfile(id);
            state.currentTab = 'community';
            const favTab = document.querySelector('.tab[data-tab="community"]');
            if (favTab) favTab.click();
            break;
          case 'adopt-market-oc':
            confirmDialog('确定要领养这个 OC 吗？领养后你将成为TA的新家长。', () => {
              adoptOC(id);
              renderAdoptMarket();
            });
            break;
          case 'raffle-adopt':
            raffleAdopt(id);
            renderAdoptMarket();
            break;
          case 'list-adopt':
            renderListAdoptForm(id);
            break;
          case 'unlist-adopt':
            confirmDialog('确定要下架这个 OC 吗？', () => {
              unlistOCForAdoption(id);
              if (state.currentRoute === '#/adopt-market') renderAdoptMarket();
              else if (state.currentRoute.startsWith('#/oc/')) renderProfile(id);
            });
            break;
          case 'filter-adopt':
            state.currentAdoptFilter = actionEl.dataset.value || 'all';
            renderAdoptMarket();
            break;
          case 'plaza-run-round':
            runPlazaRound();
            break;
          case 'plaza-toggle-auto':
            state.plazaAutoRun = e.target.checked;
            saveState();
            if (state.plazaAutoRun) {
              scheduleAutoRun();
            } else if (typeof plazaAutoTimer !== 'undefined' && plazaAutoTimer) {
              clearTimeout(plazaAutoTimer);
              plazaAutoTimer = null;
            }
            break;
          case 'plaza-switch-view':
            state.currentPlazaView = actionEl.dataset.value || 'god';
            renderPlaza();
            break;
          case 'share-oc':
            renderShareOCForm(id);
            break;
          case 'send-comment': {
            const targetType = actionEl.dataset.targetType;
            const targetId = actionEl.dataset.targetId;
            const textarea = actionEl.closest('.comment-input-area').querySelector('.comment-input');
            const content = textarea ? textarea.value : '';
            if (addComment(targetType, targetId, content)) {
              if (targetType === 'topic') {
                renderTopicDetail(targetId);
              } else if (targetType === 'oc') {
                renderProfile(targetId);
                state.currentTab = 'community';
                const cTab = document.querySelector('.tab[data-tab="community"]');
                if (cTab) cTab.click();
              }
            }
            break;
          }
          case 'delete-comment':
            confirmDialog('确定要删除这条评论吗？', () => {
              const comment = state.comments.find(c => c.id === id);
              deleteComment(id);
              if (comment) {
                if (comment.targetType === 'topic') {
                  renderTopicDetail(comment.targetId);
                } else if (comment.targetType === 'oc') {
                  renderProfile(comment.targetId);
                  state.currentTab = 'community';
                  const cTab = document.querySelector('.tab[data-tab="community"]');
                  if (cTab) cTab.click();
                }
              }
            });
            break;
          case 'join-event':
            joinEvent(id);
            if (state.currentRoute === '#/events') {
              renderEvents();
            } else {
              renderCommunity();
            }
            break;
          case 'view-event': {
            const event = state.events.find(e => e.id === id);
            if (event) {
              if (event.status === 'ended') {
                showToast(`活动"${event.title}"已结束，共 ${event.participants} 人参与`, 'info');
              } else {
                showToast(`活动详情：${event.title}`, 'info');
              }
            }
            break;
          }
          case 'close-modal':
            closeModal();
            break;
        }
      });

      document.addEventListener('click', (e) => {
        const tab = e.target.closest('.tab');
        if (!tab) return;
        const tabName = tab.dataset.tab;
        if (!tabName) return; // 无 data-tab 的 Tab（如约稿管理使用 data-action）跳过
        const tabContainer = tab.closest('.tabs');

        tabContainer.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // 在整个文档中查找对应内容并切换
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        const targetContent = document.querySelector(`[data-content="${tabName}"]`);
        if (targetContent) targetContent.classList.add('active');

        // 关系图谱 Tab：延迟触发 D3 渲染
        if (tabName === 'relations') {
          const ocId = window.location.hash.match(/^#\/oc\/(.+)$/);
          if (ocId) {
            const oc = state.ocs.find(o => o.id === ocId[1]);
            if (oc) requestAnimationFrame(() => renderRelationGraph(oc));
          }
        }
      });

      document.addEventListener('change', (e) => {
        if (e.target.id === 'import-file-input') {
          const file = e.target.files[0];
          if (file) {
            importData(file);
          }
          e.target.value = '';
        }
        // 社区排序下拉
        if (e.target.dataset.action === 'sort-community') {
          state.currentCommunitySort = e.target.value || 'latest';
          renderCommunity();
        }
        // 画廊图片上传
        if (e.target.id && e.target.id.startsWith('gallery-upload-input-')) {
          const file = e.target.files[0];
          if (file) {
            const ocId = e.target.id.replace('gallery-upload-input-', '');
            handleGalleryUpload(ocId, file);
          }
          e.target.value = '';
        }
      });

      // 碎碎念输入字符计数
      document.addEventListener('input', (e) => {
        if (e.target.id && e.target.id.startsWith('whisper-input-')) {
          const ocId = e.target.id.replace('whisper-input-', '');
          const counter = document.getElementById(`whisper-char-count-${ocId}`);
          if (counter) counter.textContent = `${e.target.value.length}/200`;
        }
      });

      window.addEventListener('hashchange', router);

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
      });
    }

    function init() {
      loadState();
      bindGlobalEvents();

      if (!window.location.hash) {
        window.location.hash = '#/garden';
      } else {
        router();
      }
    }

    init();
