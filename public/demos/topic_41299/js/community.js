    // ===== 5.5 社区互动机制 =====

    // 获取可在社区展示的 OC（仅 public）
    function getPublicOCs() {
      return state.ocs.filter(oc => oc.privacy === 'public');
    }

    // 判断是否已点赞
    function isLiked(targetType, targetId) {
      return state.userLikes.indexOf(`${targetType}_${targetId}`) >= 0;
    }

    // 判断是否已收藏
    function isFavorited(targetType, targetId) {
      return state.userFavorites.indexOf(`${targetType}_${targetId}`) >= 0;
    }

    // 判断是否已领养（基于对象数组 userAdoptions）
    function isAdopted(ocId) {
      return state.userAdoptions.some(a => a.ocId === ocId);
    }

    // 获取目标的评论列表
    function getComments(targetType, targetId) {
      return state.comments
        .filter(c => c.targetType === targetType && c.targetId === targetId)
        .sort((a, b) => a.createdAt - b.createdAt);
    }

    // 获取目标的点赞数
    function getLikeCount(targetType, targetId) {
      if (targetType === 'topic') {
        const t = state.topics.find(t => t.id === targetId);
        return t ? t.likes : 0;
      }
      if (targetType === 'oc') {
        const oc = state.ocs.find(o => o.id === targetId);
        return oc ? (oc.communityLikes || 0) : 0;
      }
      return 0;
    }

    // 更新点赞计数
    function updateLikeCount(targetType, targetId, delta) {
      if (targetType === 'topic') {
        const t = state.topics.find(t => t.id === targetId);
        if (t) t.likes = Math.max(0, (t.likes || 0) + delta);
      } else if (targetType === 'oc') {
        const oc = state.ocs.find(o => o.id === targetId);
        if (oc) oc.communityLikes = Math.max(0, (oc.communityLikes || 0) + delta);
      }
    }

    // 更新评论计数
    function updateCommentCount(targetType, targetId, delta) {
      if (targetType === 'topic') {
        const t = state.topics.find(t => t.id === targetId);
        if (t) t.comments = Math.max(0, (t.comments || 0) + delta);
      }
    }

    // 点赞切换
    function toggleLike(targetType, targetId) {
      const key = `${targetType}_${targetId}`;
      const idx = state.userLikes.indexOf(key);
      if (idx >= 0) {
        state.userLikes.splice(idx, 1);
        updateLikeCount(targetType, targetId, -1);
        showToast('已取消点赞', 'info');
      } else {
        state.userLikes.push(key);
        updateLikeCount(targetType, targetId, 1);
        showToast('已点赞', 'success');
      }
      saveState();
    }

    // 发表评论
    function addComment(targetType, targetId, content) {
      if (!content || !content.trim()) return false;
      const comment = {
        id: 'comment_' + Date.now().toString(36),
        targetType, targetId,
        author: '我',
        authorAvatar: '🌙',
        content: content.trim(),
        createdAt: Date.now(),
        isSample: false
      };
      state.comments.push(comment);
      updateCommentCount(targetType, targetId, 1);
      saveState();
      showToast('评论已发布', 'success');
      return true;
    }

    // 删除评论（仅自己的评论）
    function deleteComment(commentId) {
      const idx = state.comments.findIndex(c => c.id === commentId && c.author === '我');
      if (idx < 0) {
        showToast('只能删除自己的评论', 'warning');
        return;
      }
      const comment = state.comments[idx];
      state.comments.splice(idx, 1);
      updateCommentCount(comment.targetType, comment.targetId, -1);
      saveState();
      showToast('评论已删除', 'info');
    }

    // 收藏切换
    function toggleFavorite(targetType, targetId) {
      const key = `${targetType}_${targetId}`;
      const idx = state.userFavorites.indexOf(key);
      if (idx >= 0) {
        state.userFavorites.splice(idx, 1);
        showToast('已取消收藏', 'info');
      } else {
        state.userFavorites.push(key);
        showToast('已收藏', 'success');
      }
      saveState();
    }

    // 领养 OC（无偿/一口价）— 深拷贝市场 OC 到用户账户
    function adoptOC(marketOcId) {
      const marketOC = state.adoptMarket.find(o => o.id === marketOcId);
      if (!marketOC) { showToast('未找到该 OC', 'error'); return; }
      if (marketOC.isAdopted) { showToast('该 OC 已被领养', 'warning'); return; }
      if (marketOC.type === 'raffle') { showToast('抽奖领养请使用抽奖按钮', 'info'); return; }

      // 深拷贝到用户账户
      const newOC = createDefaultOC({
        name: marketOC.name, avatar: marketOC.avatar, gender: marketOC.gender,
        age: marketOC.age, race: marketOC.race, worldview: marketOC.worldview,
        background: marketOC.background, colors: marketOC.colors,
        privacy: 'private',
        copyright: { author: marketOC.creator, license: marketOC.license, registeredAt: null, watermarkEnabled: true, watermarkText: '', disableDownload: true },
        adoptable: { isListed: false, type: marketOC.type, price: marketOC.price, license: marketOC.license, description: '', listedAt: null, adoptedBy: '我', adoptedAt: Date.now(), originalCreator: marketOC.creator, isAdopted: true }
      });
      state.ocs.push(newOC);

      // 标记市场 OC 已被领养
      marketOC.isAdopted = true;
      marketOC.adoptedBy = '我';
      marketOC.adoptedAt = Date.now();

      // 记录领养历史
      state.userAdoptions.push({
        ocId: newOC.id, originalOcId: marketOcId, adoptedAt: Date.now(),
        originalCreator: marketOC.creator, license: marketOC.license,
        adoptionType: marketOC.type, price: marketOC.price
      });

      saveState();
      showCelebration('领养成功！', `你已成为 ${marketOC.name} 的新家长，原创建者：${marketOC.creator}`, '🌱');
    }

    // 抽奖领养（50% 中奖率）
    function raffleAdopt(marketOcId) {
      const marketOC = state.adoptMarket.find(o => o.id === marketOcId);
      if (!marketOC) { showToast('未找到该 OC', 'error'); return; }
      if (marketOC.isAdopted) { showToast('该 OC 已被领养', 'warning'); return; }
      if (marketOC.type !== 'raffle') { showToast('该 OC 不是抽奖领养', 'info'); return; }

      const won = Math.random() < 0.5;
      if (!won) {
        showToast('很遗憾，本次抽奖未中奖，再试试吧！', 'info');
        saveState();
        return;
      }
      // 中奖：深拷贝到用户账户
      const newOC = createDefaultOC({
        name: marketOC.name, avatar: marketOC.avatar, gender: marketOC.gender,
        age: marketOC.age, race: marketOC.race, worldview: marketOC.worldview,
        background: marketOC.background, colors: marketOC.colors,
        privacy: 'private',
        copyright: { author: marketOC.creator, license: marketOC.license, registeredAt: null, watermarkEnabled: true, watermarkText: '', disableDownload: true },
        adoptable: { isListed: false, type: 'raffle', price: 0, license: marketOC.license, description: '', listedAt: null, adoptedBy: '我', adoptedAt: Date.now(), originalCreator: marketOC.creator, isAdopted: true }
      });
      state.ocs.push(newOC);
      marketOC.isAdopted = true;
      marketOC.adoptedBy = '我';
      marketOC.adoptedAt = Date.now();
      state.userAdoptions.push({
        ocId: newOC.id, originalOcId: marketOcId, adoptedAt: Date.now(),
        originalCreator: marketOC.creator, license: marketOC.license,
        adoptionType: 'raffle', price: 0
      });
      saveState();
      showCelebration('抽奖中奖！', `恭喜你成为 ${marketOC.name} 的新家长！`, '🎉');
    }

    // 上架 OC 到领养市场
    function listOCForAdoption(ocId, config) {
      const oc = state.ocs.find(o => o.id === ocId);
      if (!oc) { showToast('OC 不存在', 'error'); return; }
      oc.adoptable = Object.assign({}, oc.adoptable, {
        isListed: true, type: config.type, price: config.price || 0,
        license: config.license, description: config.description || '',
        listedAt: Date.now(), isAdopted: false, adoptedBy: null, adoptedAt: null,
        originalCreator: oc.copyright?.author || '我'
      });
      saveState();
      showToast(`${oc.name} 已上架到领养市场`, 'success');
    }

    // 下架 OC
    function unlistOCForAdoption(ocId) {
      const oc = state.ocs.find(o => o.id === ocId);
      if (!oc) return;
      oc.adoptable.isListed = false;
      saveState();
      showToast(`${oc.name} 已从领养市场下架`, 'info');
    }

    // 获取市场中可领养的 OC（未被领养）
    function getAdoptableOCs() {
      return state.adoptMarket.filter(o => !o.isAdopted);
    }

    // 获取用户已领养的 OC 记录
    function getMyAdoptedOCs() {
      return state.userAdoptions;
    }

    // 获取用户已上架的 OC
    function getMyListedOCs() {
      return state.ocs.filter(o => o.adoptable && o.adoptable.isListed);
    }

    // 报名活动
    function joinEvent(eventId) {
      const idx = state.eventParticipations.indexOf(eventId);
      const event = state.events.find(e => e.id === eventId);
      if (!event) return;
      if (idx >= 0) {
        state.eventParticipations.splice(idx, 1);
        event.participants = Math.max(0, (event.participants || 0) - 1);
        showToast('已取消报名', 'info');
      } else {
        state.eventParticipations.push(eventId);
        event.participants = (event.participants || 0) + 1;
        showCelebration('报名成功！', `你已加入「${event.title}」`, '🎉');
      }
      saveState();
    }

    // 判断是否已报名活动
    function isJoinedEvent(eventId) {
      return state.eventParticipations.indexOf(eventId) >= 0;
    }

    // 获取分类标签
    function getCategoryLabel(category) {
      const map = { all: '全部', worldview: '世界观', race: '种族', creation: '创作形式', showcase: 'OC展示' };
      return map[category] || category;
    }

    // 获取分类颜色
    function getCategoryColor(category) {
      const map = {
        worldview: 'var(--dopamine-pink, #ff2e97)',
        race: 'var(--neon-green, #00ff88)',
        creation: 'var(--neon-yellow, #ffe600)',
        showcase: 'var(--accent-pink, #f472b6)'
      };
      return map[category] || 'var(--text-muted, #888)';
    }

    // 获取活动类型标签
    function getEventTypeLabel(type) {
      const map = { beauty: 'OC选美', relay: '故事接龙', challenge: '设定挑战' };
      return map[type] || type;
    }

    // 获取活动类型图标
    function getEventTypeIcon(type) {
      const map = { beauty: '👑', relay: '📖', challenge: '🎯' };
      return map[type] || '🎁';
    }

    // 获取活动状态标签
    function getEventStatusLabel(status) {
      const map = { ongoing: '进行中', upcoming: '即将开始', ended: '已结束' };
      return map[status] || status;
    }

    // 格式化相对时间
    function formatRelativeTime(timestamp) {
      const now = Date.now();
      const diff = now - timestamp;
      const minute = 60 * 1000;
      const hour = 60 * minute;
      const day = 24 * hour;
      if (diff < minute) return '刚刚';
      if (diff < hour) return Math.floor(diff / minute) + ' 分钟前';
      if (diff < day) return Math.floor(diff / hour) + ' 小时前';
      if (diff < 7 * day) return Math.floor(diff / day) + ' 天前';
      const d = new Date(timestamp);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    // 格式化日期范围
    function formatDateRange(start, end) {
      const fmt = (ts) => {
        const d = new Date(ts);
        return `${d.getMonth() + 1}/${d.getDate()}`;
      };
      return `${fmt(start)} - ${fmt(end)}`;
    }

    // ===== 幻象广场：业务逻辑 =====

    // 获取可参与广场的 OC（公开且有名字的）
    function getPlazaOCs() {
      return state.ocs.filter(oc => oc.privacy === 'public' && oc.name);
    }

    // 执行一轮广场交流（自动）
    async function runPlazaRound() {
      if (state.plazaRunning) return;
      const ocs = getPlazaOCs();
      if (ocs.length < 2) {
        showToast('至少需要 2 个公开 OC 才能开启广场交流', 'warning');
        return;
      }
      state.plazaRunning = true;
      renderPlaza();  // 更新 UI 显示"进行中"状态

      // 随机选择交流形式：60% 广场发帖，40% 双 OC 对话
      if (Math.random() < 0.6) {
        await runPlazaPostRound(ocs);
      } else {
        await runPlazaDialogRound(ocs);
      }

      state.plazaRunning = false;
      state.plazaStats.totalPosts = state.plazaPosts.length;
      state.plazaStats.totalDialogs = state.plazaDialogs.length;
      state.plazaStats.activeOCs = ocs.length;
      saveState();
      renderPlaza();
    }

    // 广场发帖一轮：1 个 OC 发帖 + 1-2 个 OC 回复
    async function runPlazaPostRound(ocs) {
      const poster = ocs[Math.floor(Math.random() * ocs.length)];
      const topic = pickPlazaTopic();
      const content = generateOCPost(poster, topic.text);

      const post = {
        id: 'plaza_post_' + Date.now().toString(36),
        ocId: poster.id,
        ocName: poster.name,
        ocAvatar: poster.avatar || '🌟',
        topic: topic.category,
        topicText: topic.text,
        content,
        replies: [],
        likes: 0,
        createdAt: Date.now()
      };

      // 随机选 1-2 个其他 OC 回复
      const others = ocs.filter(o => o.id !== poster.id);
      const replyCount = Math.min(others.length, Math.random() < 0.5 ? 1 : 2);
      const shuffled = others.slice().sort(() => Math.random() - 0.5).slice(0, replyCount);

      for (const replier of shuffled) {
        const replyText = generateOCReplyToPost(replier, content, poster.name);
        post.replies.push({
          ocId: replier.id,
          ocName: replier.name,
          ocAvatar: replier.avatar || '🌟',
          content: replyText,
          createdAt: Date.now()
        });
        // 回复有 30% 概率获得"共鸣"（点赞）
        if (Math.random() < 0.3) post.likes++;
      }

      state.plazaPosts.unshift(post);
      // 保留最近 50 条
      if (state.plazaPosts.length > 50) state.plazaPosts = state.plazaPosts.slice(0, 50);
    }

    // 双 OC 对话一轮：随机 2 个 OC 围绕话题对话 3-4 轮
    async function runPlazaDialogRound(ocs) {
      if (ocs.length < 2) return;
      const shuffled = ocs.slice().sort(() => Math.random() - 0.5);
      const ocA = shuffled[0];
      const ocB = shuffled[1];
      const topic = pickPlazaTopic();

      const dialog = {
        id: 'plaza_dialog_' + Date.now().toString(36),
        ocAId: ocA.id, ocBId: ocB.id,
        ocAName: ocA.name, ocBName: ocB.name,
        ocAAvatar: ocA.avatar || '🌟', ocBAvatar: ocB.avatar || '🌟',
        topic: topic.text,
        messages: [],
        createdAt: Date.now()
      };

      const turns = 3 + Math.floor(Math.random() * 2);  // 3-4 轮
      let lastMessage = '';
      for (let i = 0; i < turns; i++) {
        const { aText, bText } = await generateOCDialogTurn(ocA, ocB, topic.text, lastMessage);
        dialog.messages.push({ speaker: 'A', text: aText, timestamp: Date.now() });
        dialog.messages.push({ speaker: 'B', text: bText, timestamp: Date.now() });
        lastMessage = bText;
      }

      state.plazaDialogs.unshift(dialog);
      if (state.plazaDialogs.length > 30) state.plazaDialogs = state.plazaDialogs.slice(0, 30);
    }

    // 获取广场统计
    function getPlazaStats() {
      const ocs = getPlazaOCs();
      return {
        totalPosts: state.plazaPosts.length,
        totalDialogs: state.plazaDialogs.length,
        activeOCs: ocs.length,
        totalReplies: state.plazaPosts.reduce((s, p) => s + p.replies.length, 0),
        totalMessages: state.plazaDialogs.reduce((s, d) => s + d.messages.length, 0)
      };
    }
