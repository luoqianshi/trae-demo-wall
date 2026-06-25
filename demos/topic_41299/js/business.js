    // ===== 5. 业务逻辑 =====

    function createOC(data) {
      const newOC = createDefaultOC(data);
      state.ocs.push(newOC);
      saveState();
      checkAchievements();
      return newOC;
    }

    function updateOC(id, data) {
      const oc = state.ocs.find(o => o.id === id);
      if (!oc) return;
      Object.assign(oc, data);
      oc.updatedAt = Date.now();
      saveState();
    }

    function deleteOC(id) {
      const idx = state.ocs.findIndex(o => o.id === id);
      if (idx === -1) return;
      const oc = state.ocs[idx];
      state.ocs.splice(idx, 1);
      state.ocs.forEach(o => {
        o.relations = o.relations.filter(r => r.targetId !== id);
      });
      saveState();
      showToast(`角色 "${oc.name}" 已删除`, 'success');
    }

    function interact(ocId, type) {
      const oc = state.ocs.find(o => o.id === ocId);
      if (!oc) return;

      const now = Date.now();
      const config = {
        checkin: { mood: 15, exp: 10 },
        feed: { mood: 8, exp: 5, cooldown: 2 * 3600000 },
        talk: { mood: 5, exp: 3, cooldown: 30 * 60000 },
        touch: { mood: 6, exp: 4, cooldown: 3600000 }
      };

      const cfg = config[type];
      if (!cfg) return;

      if (type === 'checkin') {
        if (oc.nurturing.lastCheckIn === new Date().toDateString()) {
          showToast('今天已经签到过了', 'info');
          return;
        }
      } else if (cfg.cooldown) {
        if (now - oc.nurturing.lastInteract < cfg.cooldown) {
          showToast('操作冷却中，请稍后再试', 'info');
          return;
        }
      }

      oc.nurturing.mood = Math.min(100, oc.nurturing.mood + cfg.mood);
      oc.nurturing.exp += cfg.exp;
      oc.nurturing.lastInteract = now;
      oc.nurturing.interactCount += 1;

      if (type === 'checkin') {
        oc.nurturing.lastCheckIn = new Date().toDateString();
      }

      const oldStage = oc.nurturing.stage;
      const newStage = checkGrowthStage(oc);
      if (newStage !== oldStage) {
        oc.nurturing.stage = newStage;
        showCelebration('成长升级！', `${oc.name} 从 ${oldStage} 成长为 ${newStage}！`, '🎉');
        unlockAchievement('grow_up');
      }

      if (type === 'talk') {
        const dialogues = [
          oc.catchphrase,
          '嗯...今天也一起度过吧。',
          '谢谢你来看我。',
          '最近有什么有趣的故事吗？',
          '和你在一起总是很安心。',
          '我好像又长大了一点点呢。',
          '今天的天气真不错。',
          '能被你记住，我很开心。'
        ].filter(Boolean);
        const dialogue = dialogues[Math.floor(Math.random() * dialogues.length)];
        showDialogue(dialogue);
      } else {
        const labels = { checkin: '签到', feed: '喂食', touch: '抚摸' };
        showToast(`${labels[type]}成功！心情 +${cfg.mood}，经验 +${cfg.exp}`, 'success');
      }

      state.stats.totalInteractions += 1;
      unlockAchievement('first_interact');
      if (state.stats.totalInteractions >= 10) {
        unlockAchievement('ten_interacts');
      }
      saveState();

      renderNurtureContent();
    }

    function applyMoodDecay(oc) {
      const now = Date.now();
      const elapsed = now - oc.nurturing.lastInteract;
      const sixHours = 6 * 3600000;
      if (elapsed < sixHours) return oc;

      const decaySteps = Math.floor(elapsed / sixHours);
      const newMood = Math.max(0, oc.nurturing.mood - decaySteps * 5);
      oc.nurturing.mood = newMood;
      return oc;
    }

    function checkGrowthStage(oc) {
      const exp = oc.nurturing.exp;
      if (exp >= 300) return '成年';
      if (exp >= 100) return '少年';
      return '幼年';
    }

    function checkAchievements() {
      if (state.ocs.length >= 1) unlockAchievement('first_oc');
      if (state.ocs.length >= 3) unlockAchievement('three_oc');
    }

    function unlockAchievement(key) {
      if (state.achievements.includes(key)) return false;
      state.achievements.push(key);
      saveState();
      const ach = ACHIEVEMENTS[key];
      if (ach) {
        showToast(`成就解锁：${ach.icon} ${ach.name}`, 'success');
      }
      return true;
    }

    function exportData() {
      const data = Store.get() || { ocs: [], achievements: [], stats: { totalInteractions: 0 } };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `oc-garden-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('数据已导出', 'success');
    }

    function exportSingleOC(id) {
      const oc = state.ocs.find(o => o.id === id);
      if (!oc) return;
      const blob = new Blob([JSON.stringify(oc, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${oc.name}-oc-export.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`角色 "${oc.name}" 已导出`, 'success');
    }

    function importData(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (data.ocs && Array.isArray(data.ocs)) {
            const existingIds = new Set(state.ocs.map(o => o.id));
            const newOCs = data.ocs.filter(o => !existingIds.has(o.id));
            state.ocs.push(...newOCs);
            if (data.achievements) {
              data.achievements.forEach(a => {
                if (!state.achievements.includes(a)) state.achievements.push(a);
              });
            }
            if (data.stats) {
              state.stats.totalInteractions += data.stats.totalInteractions || 0;
            }
            saveState();
            showToast(`成功导入 ${newOCs.length} 个 OC`, 'success');
            renderSettings();
          } else if (data.id) {
            const existingIds = new Set(state.ocs.map(o => o.id));
            if (!existingIds.has(data.id)) {
              state.ocs.push(data);
              saveState();
              showToast(`成功导入角色 "${data.name}"`, 'success');
              renderSettings();
            } else {
              showToast('该 OC 已存在', 'info');
            }
          } else {
            showToast('文件格式不正确', 'error');
          }
        } catch (err) {
          showToast('导入失败：JSON 解析错误', 'error');
        }
      };
      reader.readAsText(file);
    }

    function loadSampleData() {
      const samples = getSampleOCs();
      const existingIds = new Set(state.ocs.map(o => o.id));
      const newSamples = samples.filter(s => !existingIds.has(s.id));
      let loadedCount = 0;
      if (newSamples.length > 0) {
        state.ocs.push(...newSamples);
        loadedCount += newSamples.length;
      }
      // 加载示例画师
      if (state.artists.length === 0) {
        const sampleArtists = getSampleArtists();
        state.artists.push(...sampleArtists);
        loadedCount += sampleArtists.length;
      }
      // 加载示例社区数据
      if (state.topics.length === 0 && state.events.length === 0) {
        const communityData = getSampleCommunityData();
        state.topics.push(...communityData.topics);
        state.comments.push(...communityData.comments);
        state.events.push(...communityData.events);
        loadedCount += communityData.topics.length + communityData.events.length;
      }
      // 加载示例领养市场数据
      if (state.adoptMarket.length === 0) {
        const sampleMarket = getSampleAdoptMarket();
        state.adoptMarket.push(...sampleMarket);
        loadedCount += sampleMarket.length;
      }
      if (loadedCount === 0) {
        showToast('示例数据已存在', 'info');
        return;
      }
      saveState();
      checkAchievements();
      showToast(`已加载示例数据（OC、画师、社区与领养市场）`, 'success');
    }

    function clearAllData() {
      state.ocs = [];
      state.achievements = [];
      state.stats = { totalInteractions: 0 };
      state.commissions = [];
      state.artists = [];
      state.topics = [];
      state.comments = [];
      state.userLikes = [];
      state.userFavorites = [];
      state.userAdoptions = [];
      state.events = [];
      state.eventParticipations = [];
      state.adoptMarket = [];
      state.currentCommunityFilter = 'all';
      state.currentCommunitySort = 'latest';
      state.currentCommunityTab = 'topics';
      // 幻象广场数据重置
      state.plazaPosts = [];
      state.plazaDialogs = [];
      state.plazaStats = { totalPosts: 0, totalDialogs: 0, activeOCs: 0 };
      state.currentPlazaView = 'god';
      state.plazaAutoRun = false;
      state.plazaRunning = false;
      Store.clear();
      showToast('所有数据已清空', 'success');
    }

    // ===== 画廊 CRUD =====

    // 上传图片到指定 OC 的画廊（压缩原图 + 生成缩略图 + 配额检测 + 持久化）
    async function addGalleryImage(ocId, file, category = 'other', title = '') {
      const oc = state.ocs.find(o => o.id === ocId);
      if (!oc) {
        showToast('未找到该 OC', 'error');
        return null;
      }

      try {
        // 1. 压缩原图（复用现有 compressImage，800px 宽）
        const src = await compressImage(file, 800, 0.8);
        // 2. 估算配额（原图 base64 长度 + 缩略图估算 10KB）
        const estimatedBytes = src.length + 10240;
        const quota = checkStorageQuota(estimatedBytes);
        if (!quota.ok) {
          showToast(`存储空间不足（已用 ${(quota.current/1024/1024).toFixed(1)}MB，上限约 4.5MB），请先删除部分图片`, 'error');
          return null;
        }
        // 3. 生成缩略图（200px 宽）
        const thumbnail = await compressImageToThumbnail(src, 200, 0.7);
        // 4. 构建图片对象
        const imgObj = {
          id: 'img_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          src,
          thumbnail,
          category,
          title: title.trim(),
          uploadedAt: Date.now()
        };
        // 5. 添加到 OC 的 gallery 数组
        if (!oc.gallery) oc.gallery = [];
        oc.gallery.push(imgObj);
        // 6. 持久化
        const saved = saveState();
        if (!saved) {
          // 持久化失败：回滚
          oc.gallery.pop();
          showToast('保存失败，存储空间可能已满，请删除部分图片后重试', 'error');
          return null;
        }
        showToast('图片已添加到画廊', 'success');
        return imgObj;
      } catch (err) {
        console.error('添加画廊图片失败:', err);
        showToast('图片处理失败：' + err.message, 'error');
        return null;
      }
    }

    // 从 OC 画廊删除指定图片
    function deleteGalleryImage(ocId, imageId) {
      const oc = state.ocs.find(o => o.id === ocId);
      if (!oc || !oc.gallery) return;
      const idx = oc.gallery.findIndex(g => g.id === imageId);
      if (idx === -1) return;
      oc.gallery.splice(idx, 1);
      saveState();
      showToast('图片已删除', 'success');
    }

    // 更新画廊图片的元数据（分类、标题）
    function updateGalleryImage(ocId, imageId, updates) {
      const oc = state.ocs.find(o => o.id === ocId);
      if (!oc || !oc.gallery) return;
      const img = oc.gallery.find(g => g.id === imageId);
      if (!img) return;
      if (updates.category !== undefined) img.category = updates.category;
      if (updates.title !== undefined) img.title = updates.title.trim();
      saveState();
      showToast('图片信息已更新', 'success');
    }

    // 将画廊中的图片设为 OC 的主立绘（portraitImage）
    function setGalleryImageAsPortrait(ocId, imageId) {
      const oc = state.ocs.find(o => o.id === ocId);
      if (!oc || !oc.gallery) return;
      const img = oc.gallery.find(g => g.id === imageId);
      if (!img) return;
      oc.portraitImage = img.src;
      saveState();
      showToast('已设为主立绘', 'success');
    }

    // ===== 碎碎念 CRUD =====

    // 添加一条碎碎念
    function addWhisper(ocId, content, mood = '') {
      const oc = state.ocs.find(o => o.id === ocId);
      if (!oc) {
        showToast('未找到该 OC', 'error');
        return null;
      }
      const trimmed = content.trim();
      if (!trimmed) {
        showToast('碎碎念内容不能为空', 'error');
        return null;
      }
      const whisper = {
        id: 'whisper_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        content: trimmed,
        mood: mood,
        createdAt: Date.now()
      };
      if (!oc.whispers) oc.whispers = [];
      oc.whispers.unshift(whisper);  // 新碎碎念插入数组开头（倒序展示）
      const saved = saveState();
      if (!saved) {
        oc.whispers.shift();
        showToast('保存失败，存储空间可能已满', 'error');
        return null;
      }
      showToast('碎碎念已发布', 'success');
      return whisper;
    }

    // 删除一条碎碎念
    function deleteWhisper(ocId, whisperId) {
      const oc = state.ocs.find(o => o.id === ocId);
      if (!oc || !oc.whispers) return;
      const idx = oc.whispers.findIndex(w => w.id === whisperId);
      if (idx === -1) return;
      oc.whispers.splice(idx, 1);
      saveState();
      showToast('碎碎念已删除', 'success');
    }
