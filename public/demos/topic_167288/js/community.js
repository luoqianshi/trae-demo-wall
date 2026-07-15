// ===== 社区模块 mock（全局对象 CommunityPage） =====
const CommunityPage = {
  activeTab: 'feed',  // feed/feed/topic/qa/diary

  // mock 数据
  MOCK_FEEDS: [
    { id: 'f1', user: { name: '爱心猫猫', avatar: '🐱' }, content: '今天救助的小橘猫已经找到领养家庭啦！感谢所有帮助过它的朋友们 ❤️', images: [], likes: 128, comments: 32, time: Date.now() - 2 * 3600000, tags: ['#救助成功', '#橘猫'] },
    { id: 'f2', user: { name: '温暖狗狗', avatar: '🐶' }, content: '带豆豆去公园遛弯，它今天特别开心，交到了好几个新朋友！分享几张可爱的照片给大家～', images: ['🐾'], likes: 256, comments: 48, time: Date.now() - 5 * 3600000, tags: ['#遛狗日常'] },
    { id: 'f3', user: { name: '勇敢兔兔', avatar: '🐰' }, content: '团子今天吃了好多干草，看来身体恢复得不错。感谢大家的关心！', images: [], likes: 89, comments: 15, time: Date.now() - 8 * 3600000, tags: ['#宠物日记', '#兔子'] },
    { id: 'f4', user: { name: '快乐熊熊', avatar: '🐻' }, content: '推荐一家超好的宠物医院，24小时营业，医生特别有耐心。上次半夜急诊，全程都很专业。', images: [], likes: 342, comments: 67, time: Date.now() - 12 * 3600000, tags: ['#宠物医院推荐', '#北京'] },
    { id: 'f5', user: { name: '爱心猫猫', avatar: '🐱' }, content: '小区楼下又有新的流浪猫了，已经放了猫粮和水。有附近的朋友能帮忙看看吗？', images: [], likes: 56, comments: 23, time: Date.now() - 24 * 3600000, tags: ['#流浪猫', '#求助'] }
  ],

  MOCK_TOPICS: [
    { id: 't1', name: '#救助成功故事分享#', posts: 1289, followers: 5632, hot: 98, desc: '分享你救助流浪动物的温暖故事' },
    { id: 't2', name: '#新手养猫指南#', posts: 856, followers: 4231, hot: 95, desc: '猫咪饲养、健康、行为全攻略' },
    { id: 't3', name: '#领养代替购买#', posts: 2156, followers: 8965, hot: 99, desc: '用领养给流浪动物一个家' },
    { id: 't4', name: '#宠物搞笑瞬间#', posts: 3421, followers: 12056, hot: 97, desc: '主子们的沙雕日常大赏' },
    { id: 't5', name: '#遛狗好去处#', posts: 678, followers: 3214, hot: 88, desc: '分享宠物友好公园和场所' },
    { id: 't6', name: '#宠物健康问答#', posts: 1023, followers: 5867, hot: 92, desc: '专业兽医在线解答' }
  ],

  MOCK_QA: [
    { id: 'q1', user: { name: '新手铲屎官', avatar: '🧑' }, title: '猫咪不吃猫粮怎么办？', desc: '我家猫咪这两天突然不吃猫粮，精神还好，是不是换粮太快了？', answers: 12, views: 1256, solved: true, time: Date.now() - 3 * 3600000, tags: ['健康', '饮食'] },
    { id: 'q2', user: { name: '豆豆妈', avatar: '👩' }, title: '狗狗老是拆家怎么训练？', desc: '一岁多的柴犬，家里没人就拆家，沙发已经换了两个了...', answers: 28, views: 3421, solved: false, time: Date.now() - 6 * 3600000, tags: ['行为', '训练'] },
    { id: 'q3', user: { name: '兔兔主人', avatar: '🧑' }, title: '兔子需要打疫苗吗？', desc: '第一次养兔子，想知道兔子有哪些必须打的疫苗？', answers: 8, views: 892, solved: true, time: Date.now() - 12 * 3600000, tags: ['兔子', '疫苗'] },
    { id: 'q4', user: { name: '爱猫人士', avatar: '🐱' }, title: '流浪猫可以直接带回家吗？', desc: '小区里有只亲人的流浪猫，想带回家，需要做哪些准备？', answers: 35, views: 5621, solved: false, time: Date.now() - 24 * 3600000, tags: ['救助', '领养'] }
  ],

  MOCK_DIARIES: [
    { id: 'd1', user: { name: '爱心猫猫', avatar: '🐱' }, petName: '咪咪', mood: '😊', content: '咪咪今天学会了握手！太聪明了，奖励了一包猫条。体重已经到4.5kg了，越来越圆润～', weight: '4.5kg', time: Date.now() - 2 * 3600000 },
    { id: 'd2', user: { name: '温暖狗狗', avatar: '🐶' }, petName: '豆豆', mood: '🥰', content: '豆豆今天在公园交到了新朋友，两只狗玩了一下午。回家后饭量翻倍，累得直接睡着了。', weight: '12.5kg', time: Date.now() - 8 * 3600000 },
    { id: 'd3', user: { name: '勇敢兔兔', avatar: '🐰' }, petName: '团子', mood: '😴', content: '团子今天特别安静，可能天气热。多放了些水和蔬菜，希望明天精神好些。', weight: '1.6kg', time: Date.now() - 20 * 3600000 }
  ],

  init() {
    this.render()
  },

  onShow() {
    this.render()
  },

  render() {
    const page = document.getElementById('page-community')
    page.innerHTML = this._renderHTML()
    this._bindEvents()
  },

  _renderHTML() {
    const tabs = [
      { key: 'feed', label: '动态' },
      { key: 'topic', label: '话题' },
      { key: 'qa', label: '问答' },
      { key: 'diary', label: '日记' }
    ]
    return `
      <div class="community-page">
        <div class="community-header">
          <div class="community-title">🐾 宠物社区</div>
          <div class="community-tabs">
            ${tabs.map(t => `<div class="com-tab ${this.activeTab === t.key ? 'active' : ''}" data-tab="${t.key}">${t.label}</div>`).join('')}
          </div>
        </div>
        <div class="community-content" id="communityContent">
          ${this._renderTabContent()}
        </div>
        <div class="community-fab" onclick="CommunityPage._showPublishTip()">＋</div>
      </div>
    `
  },

  _renderTabContent() {
    switch (this.activeTab) {
      case 'feed': return this._renderFeed()
      case 'topic': return this._renderTopic()
      case 'qa': return this._renderQA()
      case 'diary': return this._renderDiary()
      default: return ''
    }
  },

  // 动态
  _renderFeed() {
    return this.MOCK_FEEDS.map(f => `
      <div class="feed-card">
        <div class="feed-user">
          <div class="feed-avatar">${f.user.avatar}</div>
          <div class="feed-user-info">
            <div class="feed-name">${f.user.name}</div>
            <div class="feed-time">${Util.timeAgo(f.time)}</div>
          </div>
          <div class="feed-follow">关注</div>
        </div>
        <div class="feed-content">${this._escape(f.content)}</div>
        ${f.tags && f.tags.length ? `<div class="feed-tags">${f.tags.map(t => `<span class="feed-tag">${t}</span>`).join('')}</div>` : ''}
        ${f.images && f.images.length ? `<div class="feed-images">${f.images.map(() => `<div class="feed-img-placeholder">🐾</div>`).join('')}</div>` : ''}
        <div class="feed-actions">
          <div class="feed-action" onclick="CommunityPage._like('${f.id}', this)">
            <span class="fa-icon">❤️</span>
            <span class="fa-count">${f.likes}</span>
          </div>
          <div class="feed-action" onclick="CommunityPage._showTip('评论功能开发中')">
            <span class="fa-icon">💬</span>
            <span class="fa-count">${f.comments}</span>
          </div>
          <div class="feed-action" onclick="CommunityPage._showTip('分享功能开发中')">
            <span class="fa-icon">🔗</span>
            <span class="fa-count">分享</span>
          </div>
        </div>
      </div>
    `).join('')
  },

  // 话题
  _renderTopic() {
    return `
      <div class="topic-banner">
        <div class="topic-banner-icon">🔥</div>
        <div class="topic-banner-text">
          <div class="topic-banner-title">热门话题</div>
          <div class="topic-banner-desc">和 12,563 位爱宠人士一起交流</div>
        </div>
      </div>
      ${this.MOCK_TOPICS.map(t => `
        <div class="topic-card" onclick="CommunityPage._showTip('话题详情开发中')">
          <div class="topic-rank">${this.MOCK_TOPICS.indexOf(t) + 1}</div>
          <div class="topic-info">
            <div class="topic-name">${t.name}</div>
            <div class="topic-desc">${this._escape(t.desc)}</div>
            <div class="topic-stats">
              <span>${t.posts} 帖子</span>
              <span>${t.followers} 关注</span>
              <span class="topic-hot">🔥 ${t.hot}</span>
            </div>
          </div>
          <div class="topic-join">参与</div>
        </div>
      `).join('')}
    `
  },

  // 问答
  _renderQA() {
    return `
      <div class="qa-header-tip">
        <span>💡 提问前请先搜索，避免重复提问</span>
      </div>
      ${this.MOCK_QA.map(q => `
        <div class="qa-card" onclick="CommunityPage._showTip('问答详情开发中')">
          <div class="qa-status ${q.solved ? 'solved' : 'unsolved'}">${q.solved ? '✓ 已解决' : '待回复'}</div>
          <div class="qa-title">${this._escape(q.title)}</div>
          <div class="qa-desc">${this._escape(q.desc)}</div>
          <div class="qa-tags">${q.tags.map(t => `<span class="qa-tag">${t}</span>`).join('')}</div>
          <div class="qa-meta">
            <div class="qa-user">
              <span class="qa-avatar">${q.user.avatar}</span>
              <span>${q.user.name}</span>
              <span class="qa-time">${Util.timeAgo(q.time)}</span>
            </div>
            <div class="qa-stats">
              <span>💬 ${q.answers} 回答</span>
              <span>👁 ${q.views} 浏览</span>
            </div>
          </div>
        </div>
      `).join('')}
    `
  },

  // 日记
  _renderDiary() {
    return this.MOCK_DIARIES.map(d => `
      <div class="diary-card">
        <div class="diary-header">
          <div class="diary-avatar">${d.user.avatar}</div>
          <div class="diary-user-info">
            <div class="diary-name">${d.user.name}</div>
            <div class="diary-time">${Util.timeAgo(d.time)}</div>
          </div>
          <div class="diary-pet">📝 ${d.petName}</div>
        </div>
        <div class="diary-mood">心情：${d.mood}</div>
        <div class="diary-content">${this._escape(d.content)}</div>
        ${d.weight ? `<div class="diary-weight">⚖️ 体重：${d.weight}</div>` : ''}
        <div class="diary-actions">
          <span onclick="CommunityPage._showTip('点赞功能开发中')">❤️ 32</span>
          <span onclick="CommunityPage._showTip('评论功能开发中')">💬 8</span>
        </div>
      </div>
    `).join('')
  },

  _bindEvents() {
    document.querySelectorAll('.com-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.activeTab = tab.dataset.tab
        document.querySelectorAll('.com-tab').forEach(t => t.classList.remove('active'))
        tab.classList.add('active')
        document.getElementById('communityContent').innerHTML = this._renderTabContent()
      })
    })
  },

  _like(feedId, el) {
    const countEl = el.querySelector('.fa-count')
    const current = parseInt(countEl.textContent)
    if (el.classList.contains('liked')) {
      el.classList.remove('liked')
      countEl.textContent = current - 1
    } else {
      el.classList.add('liked')
      countEl.textContent = current + 1
    }
  },

  _showTip(msg) {
    Util.toast(msg)
  },

  _showPublishTip() {
    Util.toast('发布功能将在 P3 正式上线')
  },

  _escape(str) {
    if (!str) return ''
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }
}
