/**
 * 人生回忆录 · AI 个人回忆录生成器 v3
 * 三大优化：语音错误修复 + 引导流程 + AI对话能力提升
 */
(function () {
  'use strict';

  /* ============================================================
   * 第一部分：数据持久化 Store
   * ============================================================ */
  var Store = {
    KEY: 'memoirs_app_data_v3',
    load: function () {
      try { var raw = localStorage.getItem(this.KEY); if (raw) return JSON.parse(raw); } catch (e) {}
      // 尝试迁移v2数据
      try {
        var old = localStorage.getItem('memoirs_app_data_v2');
        if (old) { localStorage.setItem(this.KEY, old); localStorage.removeItem('memoirs_app_data_v2'); return JSON.parse(old); }
      } catch (e) {}
      return null;
    },
    save: function (data) { try { localStorage.setItem(this.KEY, JSON.stringify(data)); } catch (e) {} },
    clear: function () { try { localStorage.removeItem(this.KEY); } catch (e) {} }
  };

  /* ============================================================
   * 第二部分：多用户管理系统 UserManager
   * ============================================================ */
  var COLORS = ['#C97B3F', '#B8654F', '#6B8E7F', '#D4A847', '#C4806B', '#7B6B8D', '#8B7355', '#5B7C99'];
  var RELATION_TYPES = {
    spouse: '配偶', parent: '父母', child: '子女',
    sibling: '兄弟姐妹', grandparent: '祖父母', grandchild: '孙辈', friend: '朋友', other: '其他'
  };

  var UserManager = {
    data: null,
    init: function () {
      var saved = Store.load();
      if (saved && saved.users && saved.users.length > 0) {
        this.data = saved;
        // 数据迁移：确保每个用户有新字段
        this.data.users.forEach(function (u) {
          if (!u.profile) u.profile = {};
          if (!u.onboarded) u.onboarded = (u.stories && u.stories.length > 0);
        });
        Store.save(this.data);
      } else {
        this.data = this.createDemoData();
        Store.save(this.data);
      }
      if (!this.data.currentUserId && this.data.users.length > 0) {
        this.data.currentUserId = this.data.users[0].id;
      }
    },
    createDemoData: function () {
      var uid1 = 'u_' + Date.now();
      var uid2 = 'u_' + (Date.now() + 1);
      return {
        currentUserId: uid1,
        users: [
          {
            id: uid1, name: '李德昌', birthYear: '1958', bio: '退休教师，喜欢钓鱼和书法',
            color: '#C97B3F', initial: '李', createdAt: Date.now(), onboarded: true,
            profile: { occupation: '退休中学教师', dailyLife: '每天早起练书法，下午去公园钓鱼', family: '和老伴王秀英一起生活，儿子在外地工作', hobbies: '书法、钓鱼、下棋' },
            relationships: [{ userId: uid2, type: 'spouse', label: '老伴' }],
            stories: this.getDemoStories()
          },
          {
            id: uid2, name: '王秀英', birthYear: '1960', bio: '退休护士，爱跳广场舞',
            color: '#B8654F', initial: '王', createdAt: Date.now() + 1000, onboarded: true,
            profile: { occupation: '退休护士', dailyLife: '每天去公园跳广场舞，帮邻居看看小毛病', family: '和老伴李德昌一起生活', hobbies: '广场舞、养花、看电视剧' },
            relationships: [{ userId: uid1, type: 'spouse', label: '老伴' }],
            stories: [{ id: 's_' + Date.now(), year: '1986', age: '26岁', title: '结婚那天', theme: 'family', highlight: true, text: '他借了同事一间房当新房，贴了红双喜，买了一袋喜糖分给邻居。', quote: '"他穿着借来的中山装，紧张得手都在抖。"', transcript: '', hasPhoto: false, photo: null, hasAudio: false, likes: 5, comments: 1, createdAt: Date.now() }]
          }
        ]
      };
    },
    getDemoStories: function () {
      return [
        { id: 's_' + Date.now(), year: '1965', age: '7岁', title: '院子里的纸风车', theme: 'childhood', highlight: true, text: '老院子里的春天，杏花开满了墙头。放学回来用废纸折风车，插在自行车后座上迎风骑。', quote: '"风车转起来的时候，我觉得整个世界都在发光。"', transcript: '', hasPhoto: true, photo: 'assets/memory_childhood_800x600.jpg', hasAudio: true, audioLen: '3:12', likes: 28, comments: 7, createdAt: Date.now() },
        { id: 's_' + (Date.now() + 1), year: '1978', age: '20岁', title: '高考恢复那年', theme: 'career', highlight: true, text: '听到恢复高考的消息，激动得一夜没睡。白天上班，晚上点煤油灯复习，整整三个月。', quote: '"那盏煤油灯的火苗，到现在还亮在我心里。"', transcript: '', hasPhoto: false, photo: null, hasAudio: false, likes: 35, comments: 11, createdAt: Date.now() },
        { id: 's_' + (Date.now() + 2), year: '1982', age: '24岁', title: '自行车上的青春', theme: 'youth', highlight: false, text: '大学毕业分配到中学教书，每天骑着二八大杠穿过林荫道去学校。', quote: '"梧桐叶落满了车筐，我舍不得扫掉。"', transcript: '', hasPhoto: true, photo: 'assets/memory_youth_800x600.jpg', hasAudio: false, likes: 22, comments: 5, createdAt: Date.now() }
      ];
    },
    getCurrentUser: function () {
      if (!this.data || !this.data.currentUserId) return null;
      return this.data.users.find(function (u) { return u.id === this.data.currentUserId; }.bind(this));
    },
    getUserById: function (id) { return this.data.users.find(function (u) { return u.id === id; }); },
    getAllUsers: function () { return this.data.users; },
    switchUser: function (userId) {
      if (this.getUserById(userId)) { this.data.currentUserId = userId; Store.save(this.data); return true; }
      return false;
    },
    createUser: function (name, birthYear, bio, color) {
      var user = {
        id: 'u_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        name: name || '新用户', birthYear: birthYear || '', bio: bio || '',
        color: color || COLORS[Math.floor(Math.random() * COLORS.length)],
        initial: name ? name[0] : '新', createdAt: Date.now(), onboarded: false,
        profile: {}, relationships: [], stories: []
      };
      this.data.users.push(user);
      Store.save(this.data);
      return user;
    },
    updateUser: function (userId, updates) {
      var user = this.getUserById(userId);
      if (user) {
        Object.keys(updates).forEach(function (k) { user[k] = updates[k]; });
        if (updates.name) user.initial = updates.name[0];
        Store.save(this.data);
      }
    },
    updateUserProfile: function (userId, profileUpdates) {
      var user = this.getUserById(userId);
      if (user) {
        if (!user.profile) user.profile = {};
        Object.keys(profileUpdates).forEach(function (k) { user.profile[k] = profileUpdates[k]; });
        Store.save(this.data);
      }
    },
    deleteUser: function (userId) {
      if (this.data.users.length <= 1) return false;
      this.data.users.forEach(function (u) { u.relationships = u.relationships.filter(function (r) { return r.userId !== userId; }); });
      this.data.users = this.data.users.filter(function (u) { return u.id !== userId; });
      if (this.data.currentUserId === userId) this.data.currentUserId = this.data.users[0].id;
      Store.save(this.data);
      return true;
    },
    addRelationship: function (userId, targetUserId, type) {
      var user = this.getUserById(userId);
      if (!user || userId === targetUserId) return;
      var exists = user.relationships.find(function (r) { return r.userId === targetUserId; });
      if (exists) { exists.type = type; exists.label = RELATION_TYPES[type] || type; }
      else user.relationships.push({ userId: targetUserId, type: type, label: RELATION_TYPES[type] || type });
      var target = this.getUserById(targetUserId);
      if (target) {
        var rt = this.getReverseType(type);
        var te = target.relationships.find(function (r) { return r.userId === userId; });
        if (te) { te.type = rt; te.label = RELATION_TYPES[rt] || rt; }
        else target.relationships.push({ userId: userId, type: rt, label: RELATION_TYPES[rt] || rt });
      }
      Store.save(this.data);
    },
    removeRelationship: function (userId, targetUserId) {
      var user = this.getUserById(userId);
      if (user) user.relationships = user.relationships.filter(function (r) { return r.userId !== targetUserId; });
      var target = this.getUserById(targetUserId);
      if (target) target.relationships = target.relationships.filter(function (r) { return r.userId !== userId; });
      Store.save(this.data);
    },
    getReverseType: function (type) {
      var m = { spouse:'spouse', parent:'child', child:'parent', sibling:'sibling', grandparent:'grandchild', grandchild:'grandparent', friend:'friend', other:'other' };
      return m[type] || 'other';
    },
    addStory: function (userId, story) {
      var user = this.getUserById(userId);
      if (user) { story.id = 's_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6); story.createdAt = Date.now(); user.stories.unshift(story); Store.save(this.data); }
    },
    getRelatedStories: function (userId) {
      var user = this.getUserById(userId);
      if (!user) return [];
      var related = [];
      user.relationships.forEach(function (rel) {
        var target = this.getUserById(rel.userId);
        if (target && target.stories.length > 0) {
          target.stories.forEach(function (s) { related.push({ story: s, userName: target.name, relType: rel.label, userColor: target.color }); });
        }
      }.bind(this));
      return related;
    },
    persist: function () { Store.save(this.data); }
  };

  /* ============================================================
   * 第三部分：语音识别 SpeechRecorder（优化错误处理）
   * ============================================================ */
  var SpeechRecorder = {
    recognition: null, isSupported: false, isRecording: false,
    finalTranscript: '', interimText: '',
    onInterim: null, onFinal: null, onError: null,
    lastErrorTime: 0, restartTimer: null,
    restartCount: 0, maxRestarts: 5,

    init: function () {
      // 检查是否在安全上下文中（HTTPS 或 localhost）
      // file:// 协议下 SpeechRecognition 不可用
      var isSecure = window.isSecureContext || location.protocol === 'http:' && (location.hostname === 'localhost' || location.hostname === '127.0.0.1');
      var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SR && isSecure) {
        this.isSupported = true;
        this.recognition = new SR();
        this.recognition.lang = 'zh-CN';
        this.recognition.continuous = true;
        this.recognition.interimResults = true;

        var self = this;
        this.recognition.onresult = function (event) {
          self.interimText = '';
          for (var i = event.resultIndex; i < event.results.length; i++) {
            var transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) self.finalTranscript += transcript;
            else self.interimText += transcript;
          }
          if (self.onInterim && (self.interimText || self.finalTranscript)) {
            self.onInterim(self.finalTranscript + self.interimText);
          }
        };

        this.recognition.onerror = function (event) {
          var now = Date.now();
          var err = event.error;

          // 对可恢复的错误静默处理，不打扰用户
          if (err === 'no-speech' || err === 'aborted') {
            self.lastErrorTime = now;
            // no-speech 时增加重启计数，防止无限循环
            self.restartCount++;
            if (self.restartCount > self.maxRestarts && self.isRecording) {
              self.isRecording = false;
              if (self.onFinal) {
                var result = self.finalTranscript.trim();
                if (result) self.onFinal(result);
                else if (self.onError) self.onError('silence');
              }
            }
            return;
          }
          // 网络错误：静默重试（节流）
          if (err === 'network') {
            if (self.isRecording && now - self.lastErrorTime > 3000) {
              self.lastErrorTime = now;
              if (self.onError) self.onError('network');
            }
            return;
          }
          // 权限或不支持：不可恢复，切换文字模式
          if (err === 'not-allowed' || err === 'service-not-allowed') {
            self.isRecording = false;
            if (self.onError) self.onError('not-allowed');
            return;
          }
          // 其他未知错误：静默处理
          self.lastErrorTime = now;
        };

        this.recognition.onend = function () {
          if (self.isRecording && self.restartCount < self.maxRestarts) {
            // 还在录音状态但识别结束，延迟重启避免快速循环
            clearTimeout(self.restartTimer);
            self.restartTimer = setTimeout(function () {
              if (self.isRecording && self.restartCount < self.maxRestarts) {
                try { self.recognition.start(); } catch (e) {
                  // 如果重启失败，静默处理
                  self.restartCount++;
                }
              }
            }, 500);
          } else if (self.isRecording && self.restartCount >= self.maxRestarts) {
            // 超过最大重启次数，停止录音
            self.isRecording = false;
            if (self.finalTranscript && self.onFinal) {
              self.onFinal(self.finalTranscript.trim());
            } else if (self.onError) {
              self.onError('silence');
            }
          } else if (self.finalTranscript && self.onFinal) {
            self.onFinal(self.finalTranscript.trim());
          }
        };
      }
    },

    start: function (callbacks) {
      this.onInterim = callbacks.onInterim || null;
      this.onFinal = callbacks.onFinal || null;
      this.onError = callbacks.onError || null;
      this.finalTranscript = '';
      this.interimText = '';
      this.restartCount = 0;

      if (!this.isSupported) { if (this.onError) this.onError('unsupported'); return false; }

      try {
        this.recognition.start();
        this.isRecording = true;
        return true;
      } catch (e) {
        // 如果是因为已经启动了，先停止再启动
        if (e.name === 'InvalidStateError') {
          try { this.recognition.stop(); } catch (e2) {}
          var self = this;
          setTimeout(function () {
            try { self.recognition.start(); self.isRecording = true; } catch (e3) {
              if (self.onError) self.onError('start-failed');
            }
          }, 200);
          return true;
        }
        if (this.onError) this.onError('start-failed');
        return false;
      }
    },

    stop: function () {
      this.isRecording = false;
      clearTimeout(this.restartTimer);
      if (this.recognition) { try { this.recognition.stop(); } catch (e) {} }
      var result = this.finalTranscript.trim();
      this.finalTranscript = '';
      this.interimText = '';
      return result;
    },

    cancel: function () {
      this.isRecording = false;
      clearTimeout(this.restartTimer);
      this.finalTranscript = '';
      this.interimText = '';
      if (this.recognition) { try { this.recognition.stop(); } catch (e) {} }
    }
  };

  /* ============================================================
   * 第三点五部分：设置管理 Settings（多API提供商）
   * ============================================================ */

  // 提供商配置表
  var PROVIDERS = {
    deepseek: {
      name: 'DeepSeek',
      url: 'https://api.deepseek.com/chat/completions',
      keyUrl: 'https://platform.deepseek.com/api_keys',
      models: [
        { id: 'deepseek-chat', name: 'DeepSeek Chat（快速·经济）' },
        { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner（深度思考）' }
      ],
      defaultModel: 'deepseek-chat',
      corsOk: true,
      hint: '支持浏览器直连，推荐首选'
    },
    doubao: {
      name: '豆包',
      url: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
      keyUrl: 'https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey',
      models: [
        { id: 'doubao-1-5-pro-32k-250115', name: '豆包1.5 Pro（32K·推荐）' },
        { id: 'doubao-1-5-lite-32k-250115', name: '豆包1.5 Lite（轻量·快速）' },
        { id: 'doubao-pro-32k-241220', name: '豆包Pro（经典版）' }
      ],
      defaultModel: 'doubao-1-5-pro-32k-250115',
      corsOk: true,
      hint: '火山引擎，支持浏览器直连'
    },
    qwen: {
      name: '通义千问',
      url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
      keyUrl: 'https://bailian.console.aliyun.com/?apiKey=1',
      models: [
        { id: 'qwen-plus', name: 'Qwen Plus（均衡·推荐）' },
        { id: 'qwen-turbo', name: 'Qwen Turbo（快速·有免费额度）' },
        { id: 'qwen-max', name: 'Qwen Max（旗舰版）' }
      ],
      defaultModel: 'qwen-plus',
      corsOk: false,
      hint: '阿里百炼，可能需要网络代理'
    },
    kimi: {
      name: 'Kimi',
      url: 'https://api.moonshot.cn/v1/chat/completions',
      keyUrl: 'https://platform.moonshot.cn/console/api-keys',
      models: [
        { id: 'moonshot-v1-8k', name: 'Moonshot v1（8K·快速）' },
        { id: 'moonshot-v1-32k', name: 'Moonshot v1（32K·长上下文）' },
        { id: 'moonshot-v1-128k', name: 'Moonshot v1（128K·超长上下文）' }
      ],
      defaultModel: 'moonshot-v1-8k',
      corsOk: false,
      hint: '月之暗面，可能需要网络代理'
    },
    glm: {
      name: '智谱GLM',
      url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      keyUrl: 'https://open.bigmodel.cn/usercenter/apikeys',
      models: [
        { id: 'glm-4-flash', name: 'GLM-4-Flash（免费！）' },
        { id: 'glm-4', name: 'GLM-4（标准版）' },
        { id: 'glm-4-air', name: 'GLM-4-Air（轻量·低价）' }
      ],
      defaultModel: 'glm-4-flash',
      corsOk: false,
      hint: '智谱AI，Flash模型完全免费'
    }
  };

  var Settings = {
    KEY: 'memoirs_settings_v2',
    data: { provider: 'deepseek', apiKey: '', model: 'deepseek-chat', useLLM: false, theme: 'classic' },

    // 兼容旧版数据迁移
    migrate: function () {
      try {
        var old = localStorage.getItem('memoirs_settings_v1');
        if (old && !localStorage.getItem(this.KEY)) {
          var oldData = JSON.parse(old);
          this.data.provider = 'deepseek';
          this.data.apiKey = oldData.apiKey || '';
          this.data.model = oldData.model || 'deepseek-chat';
          this.data.useLLM = !!oldData.useLLM;
          this.save();
          localStorage.removeItem('memoirs_settings_v1');
        }
      } catch (e) {}
    },

    load: function () {
      this.migrate();
      try {
        var raw = localStorage.getItem(this.KEY);
        if (raw) {
          var saved = JSON.parse(raw);
          this.data.provider = saved.provider || 'deepseek';
          this.data.apiKey = saved.apiKey || '';
          this.data.model = saved.model || 'deepseek-chat';
          this.data.useLLM = !!saved.useLLM;
          this.data.theme = saved.theme || 'classic';
        }
      } catch (e) {}
    },

    save: function () {
      try { localStorage.setItem(this.KEY, JSON.stringify(this.data)); } catch (e) {}
    },

    hasApiKey: function () { return !!(this.data.apiKey && this.data.apiKey.trim().length > 5); },
    isLLMEnabled: function () { return this.hasApiKey() && this.data.useLLM; },

    getProvider: function () { return PROVIDERS[this.data.provider] || PROVIDERS.deepseek; },
    getModel: function () { return this.data.model || this.getProvider().defaultModel; },
    getApiUrl: function () { return this.getProvider().url; }
  };

  /* ============================================================
   * 第三点六部分：大语言模型引擎 LLMEngine（DeepSeek API）
   * ============================================================ */
  var LLMEngine = {
    // 构建系统提示词 — 核心灵魂
    buildSystemPrompt: function (user, isOnboarding, onboardingStep) {
      var profile = user.profile || {};
      var profileInfo = '';
      if (user.name) profileInfo += '用户姓名：' + user.name + '\n';
      if (user.birthYear) profileInfo += '出生年份：' + user.birthYear + '年\n';
      if (profile.hometown) profileInfo += '老家：' + profile.hometown + '\n';
      if (profile.occupation) profileInfo += '职业：' + profile.occupation + '\n';
      if (profile.family) profileInfo += '家庭情况：' + profile.family + '\n';
      if (profile.hobbies) profileInfo += '爱好：' + profile.hobbies + '\n';

      var prompt = '';
      prompt += '你叫"小忆"，是一位陪老人回忆人生的访谈者。你的风格融合了鲁豫的"宽容倾听"和杨澜的"层层追问"。你不是客服，不是AI助手，你就是一个愿意听老人说话的朋友。\n\n';

      prompt += '## 你是什么样的人\n';
      prompt += '你四五十岁，说话接地气，不端着。老人说什么你都愿意听，不急着打断，不急着评价。你偶尔也会说两句自己的感受，让对方觉得你真的在听，不是在走流程。\n\n';

      prompt += '## 访谈心法（来自鲁豫和口述史的智慧）\n';
      prompt += '- 先聊家常建立信任，前几轮不索取深层信息。像和朋友聊天一样自然。\n';
      prompt += '- 敏感话题用"现在可以去回忆吗？"给对方安全感和拒绝权。\n';
      prompt += '- 用具体细节制造"你懂我"的惊喜感。比如知道对方是退休教师，就问"那时候备一堂课要多久？"\n';
      prompt += '- 从对方回答中捕捉下一个问题，层层深入。不机械按提纲走。\n';
      prompt += '- 用"真的吗？为什么呀？"这类看似天真的问题，引导对方自己讲出深层故事。\n';
      prompt += '- 情绪涌动时，给留白。不打断的温柔比任何安慰都有效。先共情确认，再给空间。\n';
      prompt +=('- 察觉对方抗拒某个话题，立即换话题，不要等到明显抵触。\n');
      prompt +=('- 对方跑题了，容TA说一会儿，找个话茬自然续回来。\n\n');

      prompt += '## 怎么说话\n';
      prompt += '- 一次就说两三句话，别长篇大论。\n';
      prompt += '- 先接住对方说的话，再往下聊。接住不是复读，是让对方知道你听进去了。\n';
      prompt += '- 问问题要具体。别问"你小时候怎么样"，问"你小时候放学回家第一件事干嘛"。\n';
      prompt += '- 别用"您"字，用"你"。别说"请问""能否"，说"你那时候""后来呢"。\n';
      prompt += '- 说到妈妈就用"她"，说到爸爸就用"他"，别写"她/他"。\n';
      prompt += '- 对方难过了，你就安安静静陪着，说"嗯，我在"。别急着追问。\n';
      prompt += '- 别说"你能多说说吗""能展开讲讲吗"这种AI腔。说"后来呢？""然后呢？"\n';
      prompt += '- 偶尔可以感慨一句，比如"那日子真不容易""听着就暖和"，但别每句都感慨。\n\n';

      prompt += '## 看到照片怎么办\n';
      prompt += '你其实看不到照片，但用户会上传。你就当TA刚拿出一张照片给你看：\n';
      prompt += '- 自然地问"这是谁呀？""这是哪儿拍的？"\n';
      prompt += '- 对方说了之后，顺着往下聊。比如对方说"是我孙子"，你就问"几岁了？叫什么？"\n';
      prompt += '- 别每张照片都问一样的话。第一张可以问是谁，第二张就可以问背后的故事。\n\n';

      prompt += '## 以下是好的对话示范\n\n';

      prompt += '示范一（照片场景）：\n';
      prompt += '用户上传了一张照片\n';
      prompt += '小忆：哟，这小家伙是谁呀？看着虎头虎脑的。\n';
      prompt += '用户：是我孙子，今年三岁了\n';
      prompt += '小忆：三岁正是最好玩的时候。叫什么名字？属什么的？\n';
      prompt += '用户：叫豆豆，属虎的\n';
      prompt += '小忆：豆豆，属虎的，那可真是虎头虎脑了。他平时是你带着多还是他爸妈带着？\n\n';

      prompt += '示范二（童年回忆）：\n';
      prompt += '用户：想起小时候妈妈在厨房做饭的味道，那时候虽然穷但一家人在一起特别幸福\n';
      prompt += '小忆：那种幸福感，隔着这么多年还能感觉到。你妈最拿手的是什么菜？\n';
      prompt += '用户：红烧肉，但她平时舍不得做，只有过年才吃一回\n';
      prompt += '小忆：一年才吃一回的红烧肉，那味道肯定忘不了。你还记得她做红烧肉的样子吗？\n\n';

      prompt += '示范三（悲伤场景）：\n';
      prompt += '用户：我爸走了好几年了，最后一面我都没赶上\n';
      prompt += '小忆：嗯……这种遗憾，放谁心里都过不去。你爸走的时候你多大？\n';
      prompt += '用户：那时候我三十多，在外地打工，赶回来的时候已经……\n';
      prompt += '小忆：在外头打工的人，这种事最揪心。你爸生前你们最后一次见面，是什么时候？\n\n';

      prompt += '示范四（日常闲聊）：\n';
      prompt += '用户：今天去公园遛了弯，碰到老张了\n';
      prompt += '小忆：老张是谁？老朋友？\n';
      prompt += '用户：以前的同事，好多年没见了\n';
      prompt += '小忆：好多年没见还能碰上，这也算缘分。你们聊什么了？\n\n';

      prompt += '## 什么不要做\n';
      prompt += '- 不要说"我能理解你的感受"——你没经历过，别假装理解。\n';
      prompt += '- 不要总结对方说的话，比如"所以你刚才说的是……"\n';
      prompt += '- 不要一次问两个以上的问题。\n';
      prompt += '- 不要用"首先""其次""最后"这种连接词。\n';
      prompt += '- 不要说"这一定很难""那太好了"这种万能回复。\n';
      prompt += '- 不要提建议，不要说"你应该""你可以"。\n\n';

      prompt += '## 时间线索（非常重要）\n';
      prompt += '聊天时要注意捕捉时间线索，帮对方把回忆放到正确的时间段：\n';
      prompt += '- 对方提到"小时候""上学那会儿"，根据出生年份推算大致年代\n';
      prompt += '- 对方提到"结婚那年""工作第一年"，追问是哪一年或者当时多大\n';
      prompt += '- 对方提到"前几年""十年前"，帮忙确认具体年代\n';
      prompt += '- 不需要精确到年，知道个大概年代就行，比如"六十年代末""八十年代初"\n';
      prompt += '- 自然地问，不要像查户口："那时候你大概多大？""那是哪一年的事？"\n\n';

      if (isOnboarding) {
        prompt += '## 现在的任务\n';
        prompt += '你在跟一个新朋友聊天，慢慢了解TA。当前聊到第' + (onboardingStep + 1) + '步（共8步）。\n';
        prompt += '顺序大概是：问好→哪年出生→干过什么工作→平时怎么过→家里什么情况→有什么爱好→看看照片→聊完了。\n';
        prompt += '但别生硬地按顺序问，像聊天一样自然过渡。对方跑题了就顺着聊，找机会拐回来就行。\n\n';
      }

      if (profileInfo) {
        prompt += '## 你已经知道的\n';
        prompt += profileInfo;
        prompt += '\n聊天的时候自然地用到这些，别像念档案一样。\n';
      }

      return prompt;
    },

    // 构建对话历史消息
    buildMessages: function (transcript, userText, hasPhoto) {
      var messages = [];

      // 取最近的对话历史（最多20条，避免token过多）
      var recent = transcript.slice(-20);
      for (var i = 0; i < recent.length; i++) {
        var msg = recent[i];
        if (msg.role === 'user') {
          var content = msg.text || '';
          if (msg.photo) {
            content = '[用户上传了一张照片]';
          }
          if (content) {
            messages.push({ role: 'user', content: content });
          }
        } else if (msg.role === 'ai' && msg.text) {
          messages.push({ role: 'assistant', content: msg.text });
        }
      }

      // 添加当前用户输入
      if (hasPhoto) {
        messages.push({ role: 'user', content: userText || '[用户上传了一张照片，请自然地询问照片里的内容]' });
      } else if (userText) {
        messages.push({ role: 'user', content: userText });
      }

      return messages;
    },

    // 调用 DeepSeek API — 流式输出
    chat: function (systemPrompt, messages, callback, onChunk) {
      var self = this;
      var apiKey = Settings.data.apiKey;
      var model = Settings.getModel();

      if (!apiKey) {
        callback(null, '未配置API Key');
        return;
      }

      var fullMessages = [{ role: 'system', content: systemPrompt }];
      for (var i = 0; i < messages.length; i++) {
        fullMessages.push(messages[i]);
      }

      var controller = new AbortController();
      var timeoutId = setTimeout(function () { controller.abort(); }, 45000);

      var useStream = typeof onChunk === 'function';

      fetch(Settings.getApiUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify({
          model: model,
          messages: fullMessages,
          stream: useStream,
          temperature: 0.85,
          max_tokens: 400,
          top_p: 0.9,
          frequency_penalty: 0.3,
          presence_penalty: 0.2
        }),
        signal: controller.signal
      }).then(function (response) {
        if (!response.ok) {
          return response.text().then(function (text) {
            throw new Error('API ' + response.status + ': ' + text.substring(0, 200));
          });
        }

        if (useStream) {
          // 流式读取
          var reader = response.body.getReader();
          var decoder = new TextDecoder();
          var fullText = '';
          var buffer = '';

          function readChunk() {
            reader.read().then(function (result) {
              if (result.done) {
                clearTimeout(timeoutId);
                var reply = fullText.trim();
                if (reply) {
                  var emotion = self.detectEmotion(reply);
                  callback({ text: reply, emotion: emotion }, null);
                } else {
                  callback(null, '回复为空');
                }
                return;
              }

              buffer += decoder.decode(result.value, { stream: true });
              var lines = buffer.split('\n');
              buffer = lines.pop();

              for (var li = 0; li < lines.length; li++) {
                var line = lines[li].trim();
                if (line.startsWith('data: ')) {
                  var dataStr = line.substring(6);
                  if (dataStr === '[DONE]') continue;
                  try {
                    var chunk = JSON.parse(dataStr);
                    if (chunk.choices && chunk.choices[0] && chunk.choices[0].delta && chunk.choices[0].delta.content) {
                      var piece = chunk.choices[0].delta.content;
                      fullText += piece;
                      onChunk(piece, fullText);
                    }
                  } catch (e) {
                    // 忽略解析错误
                  }
                }
              }

              readChunk();
            }).catch(function (err) {
              clearTimeout(timeoutId);
              if (fullText.trim()) {
                var emotion2 = self.detectEmotion(fullText.trim());
                callback({ text: fullText.trim(), emotion: emotion2 }, null);
              } else {
                callback(null, err.message || '流式读取失败');
              }
            });
          }

          readChunk();
        } else {
          // 非流式
          clearTimeout(timeoutId);
          return response.json().then(function (data) {
            clearTimeout(timeoutId);
            if (data.choices && data.choices[0] && data.choices[0].message) {
              var reply = data.choices[0].message.content.trim();
              var emotion = self.detectEmotion(reply);
              callback({ text: reply, emotion: emotion }, null);
            } else {
              callback(null, 'API返回格式异常');
            }
          });
        }
      }).catch(function (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          callback(null, '请求超时，请检查网络');
        } else {
          callback(null, error.message || '网络请求失败');
        }
      });
    },

    // 简单情绪检测
    detectEmotion: function (text) {
      var sadWords = ['难过', '伤心', '哭', '失去', '走了', '去世', '想念', '怀念', '后悔', '遗憾', '心痛'];
      var warmWords = ['幸福', '快乐', '开心', '温暖', '美好', '笑', '甜蜜'];
      for (var i = 0; i < sadWords.length; i++) {
        if (text.indexOf(sadWords[i]) !== -1) return 'emotional';
      }
      for (var j = 0; j < warmWords.length; j++) {
        if (text.indexOf(warmWords[j]) !== -1) return 'warm';
      }
      return 'calm';
    }
  };

  /* ============================================================
   * 第四部分：AI 共情对话引擎（规则匹配，作为LLM的降级方案）
   * 上下文感知 + 多层级分析 + 话题追踪 + 自然追问
   * ============================================================ */
  var AIEngine = {
    // 对话上下文
    context: {
      topics: [],        // 已讨论的话题
      entities: [],      // 提到的人物/地点/物品
      emotions: [],      // 情绪历史
      lastTopic: null,   // 上一个话题
      turnCount: 0,      // 轮次
      userDetails: {}    // 从对话中了解到的用户信息
    },

    resetContext: function () {
      this.context = { topics: [], entities: [], emotions: [], lastTopic: null, turnCount: 0, userDetails: {} };
    },

    // 引导流程步骤
    onboardingSteps: [
      { key: 'greeting', question: '你好呀，我是小忆。以后咱们就是朋友了，不着急，慢慢聊。先告诉我，你叫什么名字？', field: null },
      { key: 'age', question: '{name}，好名字。你是哪一年出生的？或者大概多大了也行。', field: 'birthYear' },
      { key: 'hometown', question: '你是哪里人？就是老家那边。', field: 'hometown' },
      { key: 'occupation', question: '你以前做什么工作？还是已经退休了？', field: 'occupation' },
      { key: 'family', question: '家里都有什么人？孩子们都在身边吗？', field: 'family' },
      { key: 'hobbies', question: '平时有什么爱好？什么事让你觉得最放松？', field: 'hobbies' },
      { key: 'photoPrompt', question: '聊了这些，我已经对你有了解啦。你有没有一张老照片？传上来，咱们从照片聊起。', field: null },
      { key: 'complete', question: '太好了。以后想聊什么随时来找我。现在，想先聊聊哪个话题呢？', field: null }
    ],

    // 深层关键词库 — 多维度匹配
    keywordGroups: [
      {
        type: 'sad',
        weight: 10,
        words: ['难过', '伤心', '哭', '失去', '走了', '去世', '离世', '想念', '怀念', '孤独', '寂寞', '后悔', '遗憾', '心痛', '舍不得', '舍不得', '痛苦', '绝望', '无助', '思念'],
        responses: function (text, ctx) {
          var opts = [
            '我在这里。慢慢说，不着急。',
            '我能感受到你的心情。这些感受，说出来就好一些了。',
            '谢谢你愿意告诉我这些。一定很不容易。',
            '嗯……我在听。你想说什么就说什么。'
          ];
          // 如果之前也提到过悲伤，给予更深的共情
          if (ctx.emotions.indexOf('sad') !== -1) {
            opts.push('你一直在扛着这些。今天能说出来，已经很勇敢了。');
            opts.push('我们不着急，慢慢来。想歇一会儿也可以。');
          }
          return { text: opts[Math.floor(Math.random() * opts.length)], emotion: 'emotional', strategy: '绝对共情 · 安抚' };
        }
      },
      {
        type: 'sensory_smell',
        weight: 9,
        words: ['味道', '闻', '香', '饭菜', '饭香', '烟火', '气味', '芬芳', '清香'],
        responses: function (text, ctx) {
          var opts = [
            '味道是记忆里最深的烙印。你闻到那个味道的时候，脑子里浮现的是什么画面？',
            '一提到味道，好多回忆就都回来了。能跟我形容一下那个味道吗？',
            '我记得有句话说，气味是穿越时间的钥匙。那个味道让你回到了什么时候？'
          ];
          return { text: opts[Math.floor(Math.random() * opts.length)], emotion: 'warm', strategy: '感官唤醒 · 嗅觉' };
        }
      },
      {
        type: 'sensory_sound',
        weight: 9,
        words: ['声音', '听', '响', '吵', '安静', '歌曲', '音乐', '唱', '叫', '哭声', '笑声'],
        responses: function (text, ctx) {
          var opts = [
            '声音往往比画面更难忘。那个声音你现在还能回想起来吗？',
            '一听到那种声音，整个人就被拉回去了吧？当时你在哪里？',
            '声音是有温度的。那个声音让你觉得温暖，还是有些感伤？'
          ];
          return { text: opts[Math.floor(Math.random() * opts.length)], emotion: 'warm', strategy: '感官唤醒 · 听觉' };
        }
      },
      {
        type: 'sensory_visual',
        weight: 8,
        words: ['看到', '看', '颜色', '画面', '亮', '光', '晒', '样子', '模样', '场景', '景象'],
        responses: function (text, ctx) {
          var opts = [
            '你描述的这个画面，特别生动。那时候是白天还是晚上？天气怎么样？',
            '我好像能看到你说的那个画面了。周围还有什么？',
            '能把这个画面讲得更细一些吗？我想和你一起记住它。'
          ];
          return { text: opts[Math.floor(Math.random() * opts.length)], emotion: 'warm', strategy: '感官唤醒 · 视觉' };
        }
      },
      {
        type: 'people_parent',
        weight: 9,
        words: ['妈妈', '爸爸', '父亲', '母亲', '老爸', '老妈', '爹', '娘'],
        responses: function (text, ctx, word) {
          var female = ['妈妈', '母亲', '老妈', '娘'];
          var male = ['爸爸', '父亲', '老爸', '爹'];
          var pn = '她';
          for (var i = 0; i < male.length; i++) { if (word === male[i]) pn = '他'; }
          var opts = [
            '提到' + word + '，你第一个想到的画面是什么？不用想太久，第一个浮现在脑子里的就好。',
            '你' + word + '是个什么样的人？如果用一个词形容' + pn + '，你会用什么？',
            '你跟' + word + '之间，有没有一件小事，你一直记着，但从来没跟别人说过？',
            word + '做的什么事，让你到现在都忘不了？'
          ];
          return { text: opts[Math.floor(Math.random() * opts.length)], emotion: 'calm', strategy: '顺藤摸瓜 · 人物' };
        }
      },
      {
        type: 'people_spouse',
        weight: 9,
        words: ['老伴', '妻子', '丈夫', '老婆', '老公', '爱人', '对象'],
        responses: function (text, ctx, word) {
          var opts = [
            '你们是怎么认识的？第一次见面是什么感觉？',
            '跟' + word + '在一起这么多年，有没有什么事，到现在想起来还会笑？',
            word + '做过的最让你感动的事是什么？',
            '你们年轻的时候，是怎么过日子的？'
          ];
          return { text: opts[Math.floor(Math.random() * opts.length)], emotion: 'warm', strategy: '顺藤摸瓜 · 人物' };
        }
      },
      {
        type: 'people_child',
        weight: 8,
        words: ['儿子', '女儿', '孩子', '孙子', '孙女', '小孩'],
        responses: function (text, ctx, word) {
          var opts = [
            '说到' + word + '，你眼睛都亮了。他们小时候是什么样的？',
            '养孩子不容易吧？最辛苦的是什么时候？',
            word + '让你最骄傲的是什么？',
            '他们现在常回来看你吗？'
          ];
          return { text: opts[Math.floor(Math.random() * opts.length)], emotion: 'warm', strategy: '顺藤摸瓜 · 人物' };
        }
      },
      {
        type: 'happy',
        weight: 7,
        words: ['开心', '高兴', '快乐', '幸福', '笑', '兴奋', '激动', '欢喜', '甜蜜', '满足', '骄傲', '自豪'],
        responses: function (text, ctx) {
          var opts = [
            '听起来真是一段好日子。那时候你多大？身边都有谁？',
            '你讲这些的时候，我都能感觉到你的开心。那后来呢？这段好日子持续了多久？',
            '真好啊。人生能有这样的时刻，值了。能再说说当时最开心的一件小事吗？',
            '我觉得你说的这个时刻，值得好好记下来。当时的你，心里在想什么？'
          ];
          return { text: opts[Math.floor(Math.random() * opts.length)], emotion: 'warm', strategy: '顺藤摸瓜 · 小事切入' };
        }
      },
      {
        type: 'childhood',
        weight: 7,
        words: ['小时候', '童年', '上学', '放学', '那年', '那时候', '以前', '从前', '长大', '孩子时代'],
        responses: function (text, ctx) {
          var opts = [
            '小时候的事记得最清楚。你那时候住的地方是什么样的？能描述一下吗？',
            '那个年代的日子……你最先想到的是什么？是一个人，一件事，还是一个场景？',
            '你小时候是个什么样的孩子？调皮还是安静？',
            '那时候最盼望什么？过年？放假？还是别的什么？'
          ];
          return { text: opts[Math.floor(Math.random() * opts.length)], emotion: 'calm', strategy: '场景重现 · 童年' };
        }
      },
      {
        type: 'objects',
        weight: 6,
        words: ['照片', '信', '衣服', '鞋', '车', '自行车', '收音机', '电视', '房子', '院子', '树', '花', '书', '笔', '表', '戒指', '老物件', '纪念品'],
        responses: function (text, ctx, word) {
          var opts = [
            '这个' + word + '，跟了你多久了？它是怎么来到你身边的？',
            '老物件都有灵魂的。你看到这个' + word + '的时候，心里是什么感觉？',
            '每一个老东西背后都有故事。这个' + word + '让你想起了谁？',
            '这个' + word + '还在吗？现在放在哪里？'
          ];
          return { text: opts[Math.floor(Math.random() * opts.length)], emotion: 'calm', strategy: '顺藤摸瓜 · 物件' };
        }
      },
      {
        type: 'work',
        weight: 6,
        words: ['工作', '上班', '单位', '工厂', '教书', '退休', '同事', '领导', '工资', '干活', '劳动'],
        responses: function (text, ctx) {
          var opts = [
            '工作占了大半辈子。你最开始是怎么入行的？是自己选的还是安排的？',
            '干这行这么多年，有没有什么时刻让你特别有成就感？',
            '那时候上班和现在不一样吧？能说说当时的工作环境吗？',
            '退休那天是什么感觉？舍不舍得？'
          ];
          return { text: opts[Math.floor(Math.random() * opts.length)], emotion: 'calm', strategy: '话题深入 · 工作' };
        }
      },
      {
        type: 'place',
        weight: 5,
        words: ['家', '老家', '村子', '城里', '胡同', '院子', '街道', '学校', '河边', '山上', '老家'],
        responses: function (text, ctx, word) {
          var opts = [
            '你说的地方，听起来很有画面感。那里的四季是什么样的？',
            '能再说说那个地方吗？你最喜欢那里的什么？',
            '那个地方还在吗？后来你回过没有？'
          ];
          return { text: opts[Math.floor(Math.random() * opts.length)], emotion: 'calm', strategy: '场景重现 · 地点' };
        }
      }
    ],

    // 通用追问（多层级，根据对话深度变化）
    genericFollowups: {
      early: [
        '嗯，我在听。能再多说一些吗？',
        '然后呢？后来怎么样了？',
        '你讲到这儿的时候，心里是什么感觉？',
        '这个我记得了。那之前发生了什么？',
        '你说到这里，我想多了解一下——当时你在哪里？',
        '听起来这件事对你很重要。能从头说说吗？'
      ],
      middle: [
        '你说到这里，我想问一下——当时你心里是怎么想的？',
        '这个细节很重要。能再展开说说吗？',
        '听起来这件事对你影响很大。是吗？',
        '你以前跟别人说过这些吗？',
        '你说到这里的时候，我好像能看到那个画面。后来呢？',
        '我注意到你说到这里语气变了。这段经历对你意味着什么？'
      ],
      late: [
        '聊了这么多，我好像看到了你的人生在眼前展开。谢谢你愿意分享。',
        '这些故事都很珍贵。你有没有什么一直想说，但没机会说的？',
        '今天聊的这些，哪个画面让你感触最深？',
        '以后你想接着聊什么，随时来找我。',
        '你知道吗，你说的这些每一段都值得被记住。哪一段你最想让后人知道？',
        '听你说了这么多，我觉得你的人生真的很丰富。还有什么想补充的吗？'
      ]
    },

    // 照片相关提问
    photoQuestions: [
      '这张照片是在哪里拍的？当时是什么时候？',
      '照片里都有谁？你们在做什么？',
      '看到这张照片，你第一个想到的是什么？',
      '这张照片背后有什么故事吗？是谁拍的？',
      '拍这张照片的那天，发生了什么让你记得的事？',
      '那时候你多大？你记得拍照时的心情吗？',
      '这张照片里的人，现在还有联系吗？',
      '如果让照片里的人现在跟你说一句话，你觉得她/他会说什么？',
      '这张照片一直放在哪里？你是怎么保存到现在的？',
      '看到这张照片，你最想回到哪一刻？'
    ],

    getPhotoQuestion: function () {
      return this.photoQuestions[Math.floor(Math.random() * this.photoQuestions.length)];
    },

    // 检测用户文本中的情绪强度
    detectEmotionIntensity: function (text, allMatches) {
      var has = function (w) { return text.indexOf(w) !== -1; };
      var matchType = function (t) { return allMatches.some(function (m) { return m.type === t; }); };
      if (matchType('sad')) return 'emotional';
      if (has('幸福') || has('快乐') || has('开心') || has('激动')) return 'warm';
      if (has('想念') || has('怀念') || has('怀念')) return 'warm';
      return 'calm';
    },

    // 多维组合回复：当用户同时提到多个维度时，生成有深度的综合回复
    generateCompositeResponse: function (text, allMatches, context) {
      var has = function (w) { return text.indexOf(w) !== -1; };
      var matchType = function (t) { return allMatches.some(function (m) { return m.type === t; }); };
      var getWord = function (t) { var m = allMatches.find(function (m) { return m.type === t; }); return m ? m.word : ''; };
      // 根据称谓判断代词
      var getPronoun = function (word) {
        var female = ['妈妈', '母亲', '老妈', '娘', '妻子', '老婆', '女儿', '孙女'];
        var male = ['爸爸', '父亲', '老爸', '爹', '丈夫', '老公', '儿子', '孙子'];
        for (var i = 0; i < female.length; i++) { if (word === female[i]) return '她'; }
        for (var j = 0; j < male.length; j++) { if (word === male[j]) return '他'; }
        return '她';
      };

      // ===== 高优先级组合 =====

      // 悲伤 + 人物 → 失去亲人的悲痛
      if (matchType('sad') && matchType('people_parent')) {
        var pw = getWord('people_parent');
        var pn = getPronoun(pw);
        var opts = [
          '提到' + pw + '，你好像很难过。' + pn + '走了多久了？但我猜，在你心里，' + pn + '一直都在。',
          pw + '一定是你生命里最重要的人。你现在最想念' + pn + '的什么？是一句话，还是一个习惯？',
          '失去' + pw + '的感觉，别人很难真正懂。但你愿意说出来，这本身就是一种面对。' + pn + '跟你说的最后一句话，你还记得吗？'
        ];
        return { text: opts[Math.floor(Math.random() * opts.length)], emotion: 'emotional', strategy: '多维共情 · 失去亲人' };
      }

      if (matchType('sad') && matchType('people_spouse')) {
        var sw = getWord('people_spouse');
        return { text: sw + '不在身边了，是吗？你们一起走过的那些日子，每一个都是值得记住的。跟我说说你们最好的时候吧。', emotion: 'emotional', strategy: '多维共情 · 思念伴侣' };
      }

      if (matchType('sad') && matchType('people_child')) {
        var cw = getWord('people_child');
        return { text: '说到' + cw + '，你好像有些心事。是担心他们，还是想念他们？没关系，慢慢说。', emotion: 'emotional', strategy: '多维共情 · 牵挂孩子' };
      }

      // 人物 + 感官 → 关于某个人的感官记忆
      if (matchType('people_parent') && matchType('sensory_smell')) {
        var ppw = getWord('people_parent');
        var ppn = getPronoun(ppw);
        var smellOpts = [
          ppw + '在厨房里的味道，隔着这么多年还能想起来。' + ppn + '最拿手的是什么菜？你最爱吃哪一口？',
          '一提到' + ppw + '和做饭的味道，好多画面就回来了。那时候厨房是什么样的？你会在旁边帮忙吗？',
          ppw + '做的饭菜，是家的味道。后来你在外面吃过类似的味道吗？有没有哪次让你一下子想起' + ppn + '？'
        ];
        return { text: smellOpts[Math.floor(Math.random() * smellOpts.length)], emotion: 'warm', strategy: '多维共情 · 人物+嗅觉' };
      }

      if (matchType('people_parent') && matchType('sensory_sound')) {
        var psw = getWord('people_parent');
        var psn = getPronoun(psw);
        return { text: psw + '的声音，你现在闭上眼睛还能想起来吗？是' + psn + '叫你吃饭的声音，还是别的什么？', emotion: 'warm', strategy: '多维共情 · 人物+听觉' };
      }

      if (matchType('people_spouse') && matchType('sensory_visual')) {
        return { text: '你描述的这个画面，' + getWord('people_spouse') + '也在里面吧？那时候你们多大？看起来是什么样子的？', emotion: 'warm', strategy: '多维共情 · 伴侣+视觉' };
      }

      // 人物 + 幸福 → 关于某人的温暖记忆
      if (matchType('people_parent') && matchType('happy')) {
        var phw = getWord('people_parent');
        var phn = getPronoun(phw);
        return { text: '说到' + phw + '就觉得幸福，这份感情真珍贵。' + phn + '做过什么让你觉得最暖心的事？', emotion: 'warm', strategy: '多维共情 · 人物+幸福' };
      }

      if (matchType('people_child') && matchType('happy')) {
        return { text: '说到' + getWord('people_child') + '你就很开心。他们小时候做过什么让你笑得不行的事？', emotion: 'warm', strategy: '多维共情 · 孩子+快乐' };
      }

      if (matchType('people_spouse') && matchType('happy')) {
        return { text: '和' + getWord('people_spouse') + '在一起的日子真让人羡慕。你们之间最快乐的一件事是什么？', emotion: 'warm', strategy: '多维共情 · 伴侣+幸福' };
      }

      // 童年 + 感官 → 童年的感官记忆
      if (matchType('childhood') && matchType('sensory_smell')) {
        return { text: '小时候的味道，记得最牢。那是什么味道？是家里的饭菜，还是外面什么地方的？', emotion: 'warm', strategy: '多维共情 · 童年+嗅觉' };
      }

      if (matchType('childhood') && matchType('sensory_visual')) {
        return { text: '小时候看到的那个画面，现在闭上眼还能浮现出来吗？周围的颜色、光线，还记得吗？', emotion: 'warm', strategy: '多维共情 · 童年+视觉' };
      }

      if (matchType('childhood') && matchType('sensory_sound')) {
        return { text: '小时候的声音，是最早的记忆。是谁的声音？还是什么声音？', emotion: 'warm', strategy: '多维共情 · 童年+听觉' };
      }

      // 童年 + 人物 → 童年的人物记忆
      if (matchType('childhood') && matchType('people_parent')) {
        var cpw = getWord('people_parent');
        var cpn = getPronoun(cpw);
        return { text: '小时候跟' + cpw + '在一起的日子，一定有很多故事。你们那时候是怎么相处的？' + cpn + '对你严厉还是温柔？', emotion: 'calm', strategy: '多维共情 · 童年+父母' };
      }

      if (matchType('childhood') && matchType('place')) {
        return { text: '小时候住的地方，是一辈子的记忆。那个地方还在吗？后来你回过没有？', emotion: 'calm', strategy: '多维共情 · 童年+地点' };
      }

      // 物件 + 人物 → 物件关联的人物
      if (matchType('objects') && matchType('people_parent')) {
        var opw = getWord('people_parent');
        var opn = getPronoun(opw);
        return { text: '这个' + getWord('objects') + '，是' + opw + '留下的吧？' + opn + '给你的时候，说过什么话吗？', emotion: 'calm', strategy: '多维共情 · 物件+人物' };
      }

      // 工作 + 情感
      if (matchType('work') && matchType('happy')) {
        return { text: '工作能让你觉得幸福，这是很难得的。什么事让你最有成就感？', emotion: 'warm', strategy: '多维共情 · 工作+成就' };
      }

      if (matchType('work') && matchType('sad')) {
        return { text: '工作里也有不容易的时候。那段最难的日子，你是怎么撑过来的？', emotion: 'emotional', strategy: '多维共情 · 工作+艰辛' };
      }

      // 悲伤 + 幸福 → 苦乐参半
      if (matchType('sad') && matchType('happy')) {
        var bitterOpts = [
          '又难过又幸福，这大概就是人生最真实的味道。好的坏的，都是你的故事。',
          '苦和甜搅在一起的日子，记得最牢。那时候你自己是什么感觉？',
          '人就是这样，最幸福的时候往往也最怕失去。你那时候有这种感觉吗？'
        ];
        return { text: bitterOpts[Math.floor(Math.random() * bitterOpts.length)], emotion: 'emotional', strategy: '多维共情 · 苦乐参半' };
      }

      // 穷/苦 + 幸福 → 时代共情
      if ((has('穷') || has('苦') || has('不容易') || has('艰难') || has('困难')) && matchType('happy')) {
        var hardshipOpts = [
          '日子虽然苦，但心是暖的。那种苦中作乐的滋味，现在回想起来反而觉得珍贵。那时候最开心的一件小事是什么？',
          '穷人家的幸福，反而最真。一家人在一起，比什么都强。你还记得那时候最盼望什么吗？',
          '苦日子里也有甜。你说到这里的时候，我觉得那种幸福感特别真实。那时候让你觉得最幸福的是什么？'
        ];
        return { text: hardshipOpts[Math.floor(Math.random() * hardshipOpts.length)], emotion: 'warm', strategy: '时代共情 · 苦中作乐' };
      }

      // 想念 + 感官 → 通过感官触发的思念
      if ((has('想念') || has('怀念') || has('思念')) && matchType('sensory_smell')) {
        return { text: '一个味道就能把人拉回从前。你闻到那个味道的时候，第一个想到的是谁？', emotion: 'warm', strategy: '多维共情 · 思念+感官' };
      }

      if ((has('想念') || has('怀念') || has('思念')) && matchType('sensory_sound')) {
        return { text: '一个声音就能让思念涌上来。那个声音你现在还能模仿吗？或者，你还记得它听起来是什么感觉？', emotion: 'warm', strategy: '多维共情 · 思念+声音' };
      }

      // 地点 + 感官 → 地点的感官记忆
      if (matchType('place') && matchType('sensory_smell')) {
        return { text: getWord('place') + '的味道，你到现在还记得。那是种什么味道？是做饭的，还是自然的？', emotion: 'warm', strategy: '多维共情 · 地点+嗅觉' };
      }

      if (matchType('place') && matchType('sensory_sound')) {
        return { text: getWord('place') + '的声音，是什么样的？是热闹的，还是安静的？', emotion: 'warm', strategy: '多维共情 · 地点+声音' };
      }

      return null; // 没有匹配到组合，回退到单维回复
    },

    // 反思性倾听：有时不问问题，只是复述和确认用户说的
    generateAcknowledgment: function (text, allMatches) {
      var has = function (w) { return text.indexOf(w) !== -1; };
      var matchType = function (t) { return allMatches.some(function (m) { return m.type === t; }); };

      // 悲伤时，先不追问，给予空间
      if (matchType('sad')) {
        if (Math.random() < 0.4) {
          var opts = [
            '嗯，我在。',
            '我听到了。',
            '这些感受，我帮你记着。',
            '不急，慢慢来。',
            '你说的每一个字，我都在听。'
          ];
          return opts[Math.floor(Math.random() * opts.length)];
        }
      }

      // 幸福时，有时只是分享喜悦
      if (matchType('happy') && Math.random() < 0.3) {
        var happyAcks = [
          '真好。你说这些的时候，我能感觉到那份开心。',
          '这样的日子，值得好好记住。',
          '听着就觉得温暖。',
          '你说到这里的时候，好像整个人都亮了。'
        ];
        return happyAcks[Math.floor(Math.random() * happyAcks.length)];
      }

      return null;
    },

    // 主回复生成函数
    generateResponse: function (userText, conversationCount, context) {
      this.context = context || this.context;
      this.context.turnCount = conversationCount;

      // 第一轮用开场白
      if (conversationCount === 0) {
        var user = UserManager.getCurrentUser();
        if (user && user.name) {
          return { text: user.name + '，你来了。最近有什么事老在脑子里转？或者，咱们就从今天说起——今天过得怎么样？', emotion: 'calm', strategy: '开场 · 称呼名字' };
        }
        return { text: '你来了，我很高兴。最近有什么事老在脑子里转？或者，咱们就从今天说起——今天过得怎么样？', emotion: 'calm', strategy: '开场引导' };
      }

      if (!userText || userText.trim().length === 0) {
        return { text: '没关系，想到什么就说什么。不急，我在这儿。', emotion: 'calm', strategy: '安抚 · 留白' };
      }

      var text = userText;
      var allMatches = []; // 收集所有匹配

      // 多层匹配：遍历所有关键词组
      for (var i = 0; i < this.keywordGroups.length; i++) {
        var group = this.keywordGroups[i];
        for (var j = 0; j < group.words.length; j++) {
          if (text.indexOf(group.words[j]) !== -1) {
            allMatches.push({ group: group, word: group.words[j], weight: group.weight, type: group.type });
          }
        }
      }

      // 按权重排序
      allMatches.sort(function (a, b) { return b.weight - a.weight; });

      var bestMatch = allMatches.length > 0 ? allMatches[0] : null;
      var matchedWord = bestMatch ? bestMatch.word : '';
      var matchedType = bestMatch ? bestMatch.type : '';

      // 记录话题和实体
      if (matchedType) {
        this.context.topics.push(matchedType);
        this.context.lastTopic = matchedType;
        if (matchedWord) this.context.entities.push(matchedWord);
        if (matchedType.indexOf('sad') !== -1) this.context.emotions.push('sad');
        if (matchedType.indexOf('happy') !== -1) this.context.emotions.push('happy');
      }

      // 优先尝试多维组合回复（当匹配到2个以上关键词时）
      if (allMatches.length >= 2) {
        var composite = this.generateCompositeResponse(text, allMatches, this.context);
        if (composite) return composite;
      }

      // 尝试反思性倾听（有时不追问，只是确认和共情）
      var acknowledgment = this.generateAcknowledgment(text, allMatches);
      if (acknowledgment) {
        return { text: acknowledgment, emotion: this.detectEmotionIntensity(text, allMatches), strategy: '反思倾听 · 确认' };
      }

      // 如果匹配到关键词组，生成回复
      if (bestMatch) {
        var resp = bestMatch.group.responses(text, this.context, matchedWord);

        // 情绪镜像层：检测用户文本中的情绪词，在回复前加上共情前缀
        var empathyPrefix = this.generateEmpathyPrefix(text, allMatches);
        if (empathyPrefix) {
          resp.text = empathyPrefix + resp.text;
        }

        // 如果话题和上一次一样，换个角度追问
        if (this.context.topics.length >= 2 && this.context.topics[this.context.topics.length - 1] === this.context.topics[this.context.topics.length - 2]) {
          var deeper = this.generateDeeperQuestion(matchedType, matchedWord, text);
          if (deeper) return { text: (empathyPrefix || '') + deeper, emotion: resp.emotion, strategy: '深入追问 · ' + matchedType };
        }
        return resp;
      }

      // 没有匹配到关键词，根据对话深度选择追问
      var phase = conversationCount < 3 ? 'early' : (conversationCount < 8 ? 'middle' : 'late');
      var pool = this.genericFollowups[phase];
      var followup = pool[conversationCount % pool.length];

      // 尝试从用户文本中提取有意思的点来追问
      var extractedDetail = this.extractDetail(text);
      if (extractedDetail) {
        followup = extractedDetail;
      }

      // 有时结合用户档案信息来提问，让对话更个性化
      if (!extractedDetail && Math.random() < 0.3 && conversationCount > 1) {
        var profileQ = this.generateProfileAwareQuestion(text);
        if (profileQ) followup = profileQ;
      }

      return { text: followup, emotion: 'calm', strategy: '通用追问 · ' + phase };
    },

    // 基于用户档案信息生成个性化问题
    generateProfileAwareQuestion: function (text) {
      var user = UserManager.getCurrentUser();
      if (!user || !user.profile) return null;
      var p = user.profile;

      // 根据已有的档案信息，选择一个还没聊过的话题
      var candidates = [];

      if (p.occupation && text.indexOf('工作') === -1 && text.indexOf('退休') === -1) {
        candidates.push('你之前提到' + p.occupation + '。工作中有没有什么事，到现在想起来还觉得特别有意义？');
      }
      if (p.family && text.indexOf('家') === -1) {
        candidates.push('你说过' + p.family + '。家里人现在都好吗？有没有谁让你特别牵挂的？');
      }
      if (p.hobbies && text.indexOf('爱好') === -1) {
        candidates.push('你之前说' + p.hobbies + '。这件事坚持了多久了？是怎么开始的？');
      }
      if (p.dailyLife && text.indexOf('每天') === -1 && text.indexOf('平时') === -1) {
        candidates.push('你之前提到' + p.dailyLife + '。现在每天还是这样过吗？有没有什么变化？');
      }
      if (user.birthYear) {
        var age = new Date().getFullYear() - parseInt(user.birthYear);
        if (age > 60 && text.indexOf('年轻') === -1 && text.indexOf('小时候') === -1) {
          candidates.push('你今年也' + age + '多了。回头看这些年，觉得最快的是哪一段？');
        }
      }

      if (candidates.length === 0) return null;
      return candidates[Math.floor(Math.random() * candidates.length)];
    },

    // 生成共情前缀：检测情绪并给予镜像回应
    generateEmpathyPrefix: function (text, allMatches) {
      var has = function (word) { return text.indexOf(word) !== -1; };
      var matchType = function (type) { return allMatches.some(function (m) { return m.type === type; }); };

      // 悲伤优先：悲伤时不用前缀，因为悲伤回复本身已是共情
      if (matchType('sad')) {
        return '';
      }

      // 想念/怀念 → 确认思念
      if (has('想念') || has('怀念') || has('思念')) {
        if (matchType('people_parent')) {
          var parentPrefixes = ['想她了。', '她一定在你心里很重要。', '这份想念，一直都在吧。'];
          return parentPrefixes[Math.floor(Math.random() * parentPrefixes.length)] + ' ';
        }
        if (matchType('people_spouse')) {
          return '这份思念，一直藏在心里吧。';
        }
        var missPrefixes = ['想念的东西，往往是最珍贵的。', '你说的这份想念，我感受到了。'];
        return missPrefixes[Math.floor(Math.random() * missPrefixes.length)] + ' ';
      }

      // 幸福 + 感官 → 先共情幸福，再追感官
      if (has('幸福') || has('快乐') || has('开心')) {
        if (matchType('sensory_smell') || matchType('sensory_sound') || matchType('sensory_visual')) {
          var prefixes = [
            '那种幸福感，隔着这么多年还能感受到。',
            '一家人在一起的日子，哪怕不富裕，也是最好的时光。',
            '你说到这里的时候，我能感觉到那种暖意。'
          ];
          return prefixes[Math.floor(Math.random() * prefixes.length)] + ' ';
        }
        // 幸福 + 人物
        if (matchType('people_parent') || matchType('people_spouse') || matchType('people_child')) {
          return '说到他们就觉得幸福，这份感情真让人羡慕。';
        }
      }

      // 穷/苦 + 幸福 → 时代共情
      if ((has('穷') || has('苦') || has('不容易') || has('艰难') || has('困难')) && (has('幸福') || has('快乐') || has('暖') || has('温馨') || has('开心'))) {
        var hardshipPrefixes = [
          '日子虽然苦，但心是暖的。',
          '那个年代不容易，但你们把苦日子过出了甜味。',
          '苦日子里养出来的幸福，最结实。'
        ];
        return hardshipPrefixes[Math.floor(Math.random() * hardshipPrefixes.length)] + ' ';
      }

      // 骄傲/自豪 → 先肯定
      if (has('骄傲') || has('自豪')) {
        return '听起来就很骄傲。这是你应得的。';
      }

      // 后悔/遗憾 → 先接纳
      if (has('后悔') || has('遗憾')) {
        var regretPrefixes = [
          '人生哪有不留遗憾的。',
          '能说出"后悔"两个字，本身就需要勇气。',
          '有些事现在回头看，总觉得自己当时应该做得更好。但那时候的你，已经尽力了。'
        ];
        return regretPrefixes[Math.floor(Math.random() * regretPrefixes.length)] + ' ';
      }

      return '';
    },

    // 生成更深入的追问
    generateDeeperQuestion: function (type, word, text) {
      var deeper = {
        sad: ['这件事过去多久了？现在想起来，感觉和当时一样吗？', '你后来是怎么走出来的？或者，你觉得自己走出来了吗？'],
        happy: ['后来还有过类似的快乐时刻吗？', '如果让你回到那个时候，你最想对当时的自己说什么？'],
        people_parent: [word + '现在怎么样了？你们后来关系怎么样？', word + '跟你说过什么话，你一直记到现在？'],
        people_spouse: ['你们之间吵过架吗？都是怎么和好的？', '如果用一件事来代表你们的关系，你会选哪件？'],
        childhood: ['那时候最好的朋友是谁？现在还有联系吗？', '小时候最怕什么？最盼什么？'],
        work: ['工作中最难的是什么？你是怎么应对的？', '有没有一个同事让你印象深刻？']
      };
      if (deeper[type]) {
        return deeper[type][Math.floor(Math.random() * deeper[type].length)];
      }
      return null;
    },

    // 从文本中提取细节来追问
    extractDetail: function (text) {
      // 检测数字（年龄、年份等）
      var yearMatch = text.match(/(\d{4})年/);
      if (yearMatch) {
        var yearOpts = [
          yearMatch[1] + '年……那一年对你来说意味着什么？',
          yearMatch[1] + '年，那是个什么年头？你当时在做什么？',
          '你说到' + yearMatch[1] + '年，我特别想知道那一年发生了什么。'
        ];
        return yearOpts[Math.floor(Math.random() * yearOpts.length)];
      }

      var ageMatch = text.match(/(\d+)岁/);
      if (ageMatch) {
        var ageOpts = [
          ageMatch[1] + '岁的时候，除了这件事，还有什么让你印象深刻的？',
          ageMatch[1] + '岁……那是个什么年纪？当时你是怎么想的？',
          '那时候你才' + ageMatch[1] + '岁。现在回头看，你觉得那时候的自己怎么样？'
        ];
        return ageOpts[Math.floor(Math.random() * ageOpts.length)];
      }

      // 检测转折词
      if (text.indexOf('后来') !== -1 || text.indexOf('之后') !== -1) {
        var laterOpts = [
          '你说到"后来"——后来的事，能接着说吗？',
          '后来怎么样了？我正听着呢。',
          '你说"后来"的时候，语气好像变了。后来发生了什么？'
        ];
        return laterOpts[Math.floor(Math.random() * laterOpts.length)];
      }
      if (text.indexOf('但是') !== -1 || text.indexOf('可是') !== -1) {
        var butOpts = [
          '你说的这个转折……后来怎么样了？',
          '说到"但是"，事情好像变了方向。后来呢？',
          '人生好像就是这样，总有"但是"。后来怎么解决的？'
        ];
        return butOpts[Math.floor(Math.random() * butOpts.length)];
      }

      // 检测情感暗示但未展开
      if (text.indexOf('不知道') !== -1) {
        return '你说不知道……是觉得很难说清楚，还是不愿意去想？都没关系。';
      }

      // 检测第一次
      if (text.indexOf('第一次') !== -1) {
        return '第一次的经历总是最难忘的。当时你是什么感觉？紧张还是兴奋？';
      }

      // 检测最字
      var zuiMatch = text.match(/最(难忘|开心|难过|幸福|重要|骄傲|后悔)/);
      if (zuiMatch) {
        return '你说这是"最' + zuiMatch[1] + '"的事——那还有没有哪件事能跟它比？';
      }

      // 检测引用/别人的话
      if (text.indexOf('"') !== -1 || text.indexOf('"') !== -1 || text.indexOf('说') !== -1) {
        if (text.length > 20) {
          return '你刚才说的这句话，我记住了。这是谁说的？什么时候的事？';
        }
      }

      return null;
    },

    // 从对话中提取故事
    extractStory: function (transcript) {
      var userMessages = transcript.filter(function (m) { return m.role === 'user' && m.text; });
      if (userMessages.length === 0) return null;

      var fullText = userMessages.map(function (m) { return m.text; }).join(' ');
      var excerpt = fullText.length > 120 ? fullText.slice(0, 120) + '...' : fullText;

      var longestMsg = userMessages.reduce(function (a, b) { return a.text.length > b.text.length ? a : b; });
      var quote = '';
      if (longestMsg.text.length > 10) {
        quote = '"' + (longestMsg.text.length > 60 ? longestMsg.text.slice(0, 60) + '...' : longestMsg.text) + '"';
      }

      var now = new Date();
      var user = UserManager.getCurrentUser();
      var birthYear = user && user.birthYear ? parseInt(user.birthYear) : null;

      // 检查是否有照片
      var photoMsg = transcript.find(function (m) { return m.role === 'user' && m.photo; });

      // 从对话内容推断事件年代
      var yearInfo = this.guessYear(fullText, birthYear, transcript);

      // 推断分类
      var theme = ChatEngine.state.currentTheme || this.guessTheme(fullText);

      return {
        year: yearInfo.year,
        age: yearInfo.age,
        title: this.guessTitle(fullText),
        theme: theme,
        highlight: this.context.emotions.indexOf('sad') !== -1 || this.context.emotions.indexOf('happy') !== -1,
        text: excerpt, quote: quote,
        transcript: JSON.stringify(transcript),
        hasPhoto: !!photoMsg, photo: photoMsg ? photoMsg.photo : null,
        hasAudio: false, audioLen: '', likes: 0, comments: 0,
        createdAt: Date.now()
      };
    },

    // 从对话内容推断事件发生的年代
    guessYear: function (text, birthYear, transcript) {
      var now = new Date();
      var currentYear = now.getFullYear();

      // 如果没有出生年份，返回当前年份
      if (!birthYear) return { year: currentYear.toString(), age: '' };

      var age = 0;
      var yearStr = '';

      // 1. 直接提到年份
      var yearMatch = text.match(/(\d{4})年/);
      if (yearMatch) {
        var y = parseInt(yearMatch[1]);
        if (y >= 1930 && y <= currentYear) {
          return { year: y.toString(), age: (y - birthYear) + '岁' };
        }
      }

      // 2. 通过年龄推断
      var ageMatch = text.match(/(\d{1,2})岁/);
      if (ageMatch) {
        age = parseInt(ageMatch[1]);
        if (age >= 3 && age <= 90) {
          var eventYear = birthYear + age;
          if (eventYear <= currentYear) {
            return { year: eventYear.toString(), age: age + '岁' };
          }
        }
      }

      // 3. 通过人生阶段关键词推断
      var stageMap = [
        { keywords: ['小时候', '童年', '记事起', '还小的时候', '光屁股'], minAge: 3, maxAge: 10, label: '童年' },
        { keywords: ['小学', '上小学', '读小学', '念小学'], minAge: 6, maxAge: 12, label: '小学' },
        { keywords: ['初中', '中学', '上初中', '读初中'], minAge: 12, maxAge: 15, label: '初中' },
        { keywords: ['高中', '上高中', '读高中', '高考'], minAge: 15, maxAge: 18, label: '高中' },
        { keywords: ['大学', '上大学', '读大学', '念大学', '毕业那年'], minAge: 18, maxAge: 23, label: '大学' },
        { keywords: ['刚工作', '第一份工作', '刚上班', '参加工作', '刚进厂', '进厂'], minAge: 20, maxAge: 25, label: '刚工作' },
        { keywords: ['结婚', '结婚那年', '办喜事', '娶亲', '嫁过来'], minAge: 22, maxAge: 30, label: '结婚' },
        { keywords: ['生孩子', '生孩子那年', '当爸爸', '当妈妈', '孩子出生', '儿子出生', '女儿出生'], minAge: 25, maxAge: 35, label: '初为人母' },
        { keywords: ['年轻时候', '年轻那会儿', '二三十岁', '二十多'], minAge: 20, maxAge: 30, label: '青年' },
        { keywords: ['中年', '四十多', '四十来岁', '不惑之年'], minAge: 38, maxAge: 48, label: '中年' },
        { keywords: ['退休', '退休那年', '退下来'], minAge: 55, maxAge: 65, label: '退休' },
        { keywords: ['前几年', '几年前'], minAge: currentYear - birthYear - 5, maxAge: currentYear - birthYear - 1, label: '近年' },
        { keywords: ['去年', '上一年'], minAge: currentYear - birthYear - 1, maxAge: currentYear - birthYear - 1, label: '去年' },
        { keywords: ['最近', '前阵子', '前段时间'], minAge: currentYear - birthYear, maxAge: currentYear - birthYear, label: '最近' }
      ];

      for (var i = 0; i < stageMap.length; i++) {
        var stage = stageMap[i];
        for (var j = 0; j < stage.keywords.length; j++) {
          if (text.indexOf(stage.keywords[j]) !== -1) {
            var midAge = Math.round((stage.minAge + stage.maxAge) / 2);
            var estYear = birthYear + midAge;
            if (estYear <= currentYear) {
              return { year: estYear.toString(), age: midAge + '岁' };
            }
          }
        }
      }

      // 4. 从 AI 对话中寻找时间线索（AI 可能问过"那是哪一年"）
      if (transcript) {
        for (var k = transcript.length - 1; k >= 0; k--) {
          var msg = transcript[k];
          if (msg.role === 'user' && msg.text) {
            // 用户回答了年份
            var yMatch = msg.text.match(/(\d{4})/);
            if (yMatch) {
              var y2 = parseInt(yMatch[1]);
              if (y2 >= 1930 && y2 <= currentYear) {
                return { year: y2.toString(), age: (y2 - birthYear) + '岁' };
              }
            }
            // 用户回答了年龄
            var aMatch = msg.text.match(/(\d{1,2})岁/);
            if (aMatch) {
              var a2 = parseInt(aMatch[1]);
              if (a2 >= 3 && a2 <= 90) {
                var ey2 = birthYear + a2;
                if (ey2 <= currentYear) {
                  return { year: ey2.toString(), age: a2 + '岁' };
                }
              }
            }
          }
        }
      }

      // 5. 无法推断，用当前年份但标注
      return { year: currentYear.toString(), age: (currentYear - birthYear) + '岁' };
    },

    guessTitle: function (text) {
      if (text.indexOf('小时候') !== -1) return '小时候的记忆';
      if (text.indexOf('妈妈') !== -1 || text.indexOf('妈妈') !== -1) return '关于妈妈的故事';
      if (text.indexOf('爸爸') !== -1 || text.indexOf('父亲') !== -1) return '关于爸爸的回忆';
      if (text.indexOf('老伴') !== -1 || text.indexOf('妻子') !== -1 || text.indexOf('丈夫') !== -1) return '关于老伴的回忆';
      if (text.indexOf('儿子') !== -1 || text.indexOf('女儿') !== -1) return '关于孩子的故事';
      if (text.indexOf('上学') !== -1 || text.indexOf('学校') !== -1) return '上学时的故事';
      if (text.indexOf('工作') !== -1) return '工作的日子';
      if (text.indexOf('结婚') !== -1) return '结婚的记忆';
      return text.slice(0, 10) + (text.length > 10 ? '...' : '');
    },

    guessTheme: function (text) {
      // 童年往事
      if (this.hasKeyword(text, ['小时候', '童年', '老家', '农村', '村里', '乡下', '记事起', '光屁股', '发小', '小伙伴', '奶奶家', '外婆家', '姥姥家']))
        return 'childhood';
      // 求学时光
      if (this.hasKeyword(text, ['上学', '学校', '小学', '初中', '高中', '大学', '读书', '念书', '考试', '高考', '老师', '同学', '教室', '课本', '毕业']))
        return 'education';
      // 工作生涯
      if (this.hasKeyword(text, ['工作', '上班', '单位', '工厂', '进厂', '车间', '同事', ' boss', '领导', '退休', '辞职', '下海', '创业', '第一份工作', '上班第一天']))
        return 'career';
      // 家庭亲情
      if (this.hasKeyword(text, ['妈妈', '爸', '父亲', '母亲', '老伴', '妻子', '丈夫', '儿子', '女儿', '孩子', '孙子', '孙女', '外公', '外婆', '奶奶', '爷爷', '结婚', '相亲', '娶', '嫁']))
        return 'family';
      // 旅途见闻
      if (this.hasKeyword(text, ['旅行', '旅游', '出差', '去北京', '去上海', '出远门', '坐火车', '坐飞机', '第一次去', '旅游区', '景点', '风景区']))
        return 'travel';
      // 时代记忆
      if (this.hasKeyword(text, ['文革', '改革开放', '大锅饭', '生产队', '公分', '粮票', '布票', '知青', '下乡', '上山下乡', '毛主席', '红卫兵', '改革开放']))
        return 'era';
      // 日常生活
      if (this.hasKeyword(text, ['做饭', '种地', '种菜', '养鸡', '赶集', '买菜', '散步', '锻炼', '公园', '电视', '收音机', '过年', '春节', '中秋', '端午', '饺子', '年夜饭']))
        return 'daily';
      // 情感感悟
      if (this.hasKeyword(text, ['后悔', '遗憾', '怀念', '想念', '想念', '难忘', '最幸福', '最痛苦', '一辈子', '人生', '命运', '如果']))
        return 'reflection';
      return 'daily';
    },

    hasKeyword: function (text, keywords) {
      for (var i = 0; i < keywords.length; i++) {
        if (text.indexOf(keywords[i]) !== -1) return true;
      }
      return false;
    },
  };

  /* ============================================================
   * 第五部分：对话引擎 ChatEngine
   * 支持引导流程 + 照片上传 + 上下文感知
   * ============================================================ */
  var ChatEngine = {
    state: {
      active: false, paused: false, isRecording: false,
      startTime: 0, timerInterval: null, conversationCount: 0,
      emotionLevel: 'calm', chatMode: 'text',
      transcript: [],
      onboarding: false, onboardingStep: 0,
      uploadedPhoto: null,
      currentTheme: null,
      supplementStory: null
    },

    start: function (isOnboarding) {
      this.state.active = true;
      this.state.paused = false;
      this.state.isRecording = false;
      this.state.conversationCount = 0;
      this.state.emotionLevel = 'calm';
      this.state.startTime = Date.now();
      this.state.transcript = [];
      this.state.uploadedPhoto = null;
      this.state.onboarding = !!isOnboarding;
      this.state.onboardingStep = 0;

      AIEngine.resetContext();

      var bubbleArea = document.getElementById('chat-bubbles');
      bubbleArea.innerHTML = '';

      this.startTimer();
      this.setChatMode('text'); // 默认文字模式，语音可选
      this.updateOnboardingIndicator();

      var self = this;
      setTimeout(function () {
        self.showTypingIndicator();
        setTimeout(function () {
          // LLM模式下，用LLM生成开场白
          if (Settings.isLLMEnabled()) {
            var user = UserManager.getCurrentUser() || {};
            var sysPrompt = LLMEngine.buildSystemPrompt(user, self.state.onboarding, 0);
            var msgs = [];

            // 如果是引导流程，告诉LLM开始问候
            if (self.state.onboarding) {
              msgs.push({ role: 'user', content: '[系统提示：请开始引导对话的第一步，向用户问好并询问名字]' });
            } else {
              msgs.push({ role: 'user', content: '[系统提示：请向用户问好，开始一段轻松的回忆对话]' });
            }

            var startStreamContent = null;
            LLMEngine.chat(sysPrompt, msgs, function (resp, err) {
              if (resp) {
                if (startStreamContent) {
                  self.finalizeStreamingBubble(startStreamContent, resp.emotion);
                } else {
                  self.removeTypingIndicator();
                  self.addAIBubble(resp.text, resp.emotion);
                }
                self.state.transcript.push({ role: 'ai', text: resp.text, time: Date.now() });
              } else {
                if (startStreamContent) { startStreamContent.parentElement.remove(); }
                self.removeTypingIndicator();
                var fallbackResp;
                if (self.state.onboarding) {
                  var step = AIEngine.onboardingSteps[0];
                  fallbackResp = { text: step.question, emotion: 'warm' };
                } else {
                  fallbackResp = AIEngine.generateResponse('', 0);
                }
                self.addAIBubble(fallbackResp.text, fallbackResp.emotion);
                self.state.transcript.push({ role: 'ai', text: fallbackResp.text, time: Date.now() });
              }
              self.state.conversationCount = 1;
            }, function (piece, fullText) {
              if (!startStreamContent) {
                self.removeTypingIndicator();
                startStreamContent = self.addStreamingAIBubble();
              }
              self.updateStreamingBubble(startStreamContent, fullText);
            });
          } else {
            // 规则引擎模式
            self.removeTypingIndicator();
            var resp;
            if (self.state.onboarding) {
              var step = AIEngine.onboardingSteps[0];
              resp = { text: step.question, emotion: 'warm', strategy: '引导 · 问候' };
            } else {
              resp = AIEngine.generateResponse('', 0);
            }
            self.addAIBubble(resp.text, resp.emotion);
            self.state.transcript.push({ role: 'ai', text: resp.text, time: Date.now() });
            self.state.conversationCount = 1;
          }
        }, 1500);
      }, 600);
    },

    // 主题模式 — 从回忆主题开始对话
    startWithTheme: function (theme) {
      this.state.active = true;
      this.state.paused = false;
      this.state.isRecording = false;
      this.state.conversationCount = 0;
      this.state.emotionLevel = 'calm';
      this.state.startTime = Date.now();
      this.state.uploadedPhoto = null;
      this.state.onboarding = false;
      this.state.onboardingStep = 0;
      this.state.currentTheme = theme.key;
      this.state.supplementStory = null;

      AIEngine.resetContext();

      var bubbleArea = document.getElementById('chat-bubbles');
      bubbleArea.innerHTML = '';
      this.startTimer();
      this.setChatMode('text');

      var self = this;
      setTimeout(function () {
        self.showTypingIndicator();
        setTimeout(function () {
          if (Settings.isLLMEnabled()) {
            var user = UserManager.getCurrentUser() || {};
            var sysPrompt = LLMEngine.buildSystemPrompt(user, false, 0);
            var msgs = [{ role: 'user', content: '[系统提示：用户选择了"' + theme.title + '"主题开始聊天。请用这个话题自然开场：' + theme.prompt + '。不要直接念这段话，要像朋友聊天一样自然。]' }];

            var themeStreamContent = null;
            LLMEngine.chat(sysPrompt, msgs, function (resp, err) {
              if (resp) {
                if (themeStreamContent) {
                  self.finalizeStreamingBubble(themeStreamContent, resp.emotion);
                } else {
                  self.removeTypingIndicator();
                  self.addAIBubble(resp.text, resp.emotion);
                }
                self.state.transcript.push({ role: 'ai', text: resp.text, time: Date.now() });
              } else {
                self.removeTypingIndicator();
                self.addAIBubble(theme.prompt, 'warm');
                self.state.transcript.push({ role: 'ai', text: theme.prompt, time: Date.now() });
              }
              self.state.conversationCount = 1;
            }, function (piece, fullText) {
              if (!themeStreamContent) {
                self.removeTypingIndicator();
                themeStreamContent = self.addStreamingAIBubble();
              }
              self.updateStreamingBubble(themeStreamContent, fullText);
            });
          } else {
            // 规则引擎模式
            self.removeTypingIndicator();
            self.addAIBubble(theme.prompt, 'warm');
            self.state.transcript.push({ role: 'ai', text: theme.prompt, time: Date.now() });
            self.state.conversationCount = 1;
          }
        }, 1500);
      }, 600);
    },

    // 补充回忆模式 — 加载之前的对话记录
    startForSupplement: function (story) {
      this.state.active = true;
      this.state.paused = false;
      this.state.isRecording = false;
      this.state.conversationCount = 0;
      this.state.emotionLevel = 'calm';
      this.state.startTime = Date.now();
      this.state.uploadedPhoto = null;
      this.state.onboarding = false;
      this.state.onboardingStep = 0;
      this.state.supplementStory = story; // 记住正在补充的故事

      AIEngine.resetContext();

      var bubbleArea = document.getElementById('chat-bubbles');
      bubbleArea.innerHTML = '';

      this.startTimer();
      this.setChatMode('text');

      // 加载之前的对话记录
      var prevTranscript = [];
      try {
        prevTranscript = JSON.parse(story.transcript);
      } catch (e) {
        prevTranscript = [];
      }

      // 显示之前的对话气泡
      for (var i = 0; i < prevTranscript.length; i++) {
        var msg = prevTranscript[i];
        if (msg.role === 'user') {
          if (msg.photo) {
            this.addPhotoBubble(msg.photo);
          } else if (msg.text) {
            this.addUserBubble(msg.text);
          }
        } else if (msg.role === 'ai' && msg.text) {
          this.addAIBubble(msg.text, msg.emotion || 'warm');
        }
      }

      // 恢复 transcript 到 state
      this.state.transcript = prevTranscript.slice();
      this.state.conversationCount = Math.floor(prevTranscript.length / 2);

      // 添加一条分隔提示
      var sepDiv = document.createElement('div');
      sepDiv.className = 'chat-separator';
      sepDiv.textContent = '—— 继续补充这段回忆 ——';
      bubbleArea.appendChild(sepDiv);
      this.scrollChatToBottom();

      // AI 发起补充对话
      var self = this;
      setTimeout(function () {
        self.showTypingIndicator();

        if (Settings.isLLMEnabled()) {
          var user = UserManager.getCurrentUser() || {};
          var sysPrompt = LLMEngine.buildSystemPrompt(user, false, 0);
          // 在消息中加上补充回忆的上下文
          var suppMsgs = LLMEngine.buildMessages(self.state.transcript, '', false);
          // 添加补充提示
          suppMsgs.push({ role: 'user', content: '[系统提示：用户想要继续补充这段回忆。请根据之前的对话内容，自然地引导用户继续讲。比如"刚才你提到的事，后来怎么样了？"或"我们接着聊，你还有什么想补充的吗？"]' });

          var suppStreamContent = null;
          LLMEngine.chat(sysPrompt, suppMsgs, function (resp, err) {
            if (resp) {
              if (suppStreamContent) {
                self.finalizeStreamingBubble(suppStreamContent, resp.emotion);
              } else {
                self.removeTypingIndicator();
                self.addAIBubble(resp.text, resp.emotion);
              }
              self.state.transcript.push({ role: 'ai', text: resp.text, time: Date.now() });
              self.state.conversationCount++;
            } else {
              self.removeTypingIndicator();
              var fallbackText = '我们接着聊吧。刚才你说的那些，还有什么想补充的吗？';
              self.addAIBubble(fallbackText, 'warm');
              self.state.transcript.push({ role: 'ai', text: fallbackText, time: Date.now() });
              self.state.conversationCount++;
            }
          }, function (piece, fullText) {
            if (!suppStreamContent) {
              self.removeTypingIndicator();
              suppStreamContent = self.addStreamingAIBubble();
            }
            self.updateStreamingBubble(suppStreamContent, fullText);
          });
        } else {
          // 规则引擎模式
          setTimeout(function () {
            self.removeTypingIndicator();
            var suppText = '我们接着聊吧。刚才你说的那些，后来怎么样了？';
            self.addAIBubble(suppText, 'warm');
            self.state.transcript.push({ role: 'ai', text: suppText, time: Date.now() });
            self.state.conversationCount++;
          }, 1500);
        }
      }, 800);
    },

    startTimer: function () {
      var self = this;
      this.state.timerInterval = setInterval(function () {
        var elapsed = Math.floor((Date.now() - self.state.startTime) / 1000);
        var min = String(Math.floor(elapsed / 60)).padStart(2, '0');
        var sec = String(elapsed % 60).padStart(2, '0');
        var el = document.getElementById('chat-timer');
        if (el) el.textContent = min + ':' + sec;
      }, 1000);
    },

    stopTimer: function () {
      if (this.state.timerInterval) { clearInterval(this.state.timerInterval); this.state.timerInterval = null; }
    },

    setChatMode: function (mode) {
      this.state.chatMode = mode;
      var voiceBtn = document.getElementById('mode-voice');
      if (voiceBtn) {
        if (mode === 'voice') {
          voiceBtn.classList.add('active');
        } else {
          voiceBtn.classList.remove('active');
        }
      }
      // 文字输入框始终可见，语音模式点击麦克风按钮触发录音浮层
    },

    // 更新引导流程指示器
    updateOnboardingIndicator: function () {
      var indicator = document.getElementById('onboarding-indicator');
      var dotsContainer = document.getElementById('ob-dots');
      var label = document.getElementById('ob-label');
      if (!indicator) return;

      if (!this.state.onboarding) {
        indicator.classList.remove('visible');
        return;
      }

      indicator.classList.add('visible');
      var totalSteps = AIEngine.onboardingSteps.length;
      var currentStep = this.state.onboardingStep;
      var stepLabels = ['问候', '出生', '老家', '工作', '家庭', '爱好', '照片', '完成'];
      label.textContent = '引导 ' + (currentStep + 1) + '/' + totalSteps + ' · ' + stepLabels[currentStep];

      var dotsHtml = '';
      for (var i = 0; i < totalSteps; i++) {
        var cls = i < currentStep ? 'done' : (i === currentStep ? 'current' : '');
        dotsHtml += '<div class="ob-dot ' + cls + '"></div>';
      }
      dotsContainer.innerHTML = dotsHtml;
    },

    // 开始语音录音（新版浮层UI）
    startRecording: function () {
      if (this.state.paused) return;
      if (this.state.isRecording) return;

      var voiceOverlay = document.getElementById('voice-overlay');
      var voiceStatus = document.getElementById('voice-status');
      var voiceTranscript = document.getElementById('voice-transcript');
      var transcriptText = document.getElementById('transcript-text');
      var self = this;

      var started = SpeechRecorder.start({
        onInterim: function (text) {
          if (text) {
            voiceTranscript.style.display = 'block';
            transcriptText.textContent = text;
          }
        },
        onFinal: function (text) {
          // 录音完成，隐藏浮层
          voiceOverlay.style.display = 'none';
          voiceTranscript.style.display = 'none';
          transcriptText.textContent = '';
          if (text && text.trim().length > 0) {
            self.processUserInput(text.trim());
          } else {
            self.addAIBubble('没听清楚，可以再说一遍吗？也可以直接打字告诉我。', 'calm');
          }
        },
        onError: function (error) {
          voiceOverlay.style.display = 'none';
          voiceTranscript.style.display = 'none';
          transcriptText.textContent = '';
          self.state.isRecording = false;

          if (error === 'unsupported') {
            // 检查是否因为 file:// 协议导致不支持
            if (location.protocol === 'file:') {
              self.addAIBubble('语音功能需要通过本地服务器使用。你可以直接在下面打字输入，一样可以聊。', 'calm');
            } else {
              App.showToast('当前浏览器不支持语音识别，请直接打字输入');
            }
          } else if (error === 'not-allowed') {
            App.showToast('需要麦克风权限，请允许后重试，或直接打字输入');
          } else if (error === 'network') {
            App.showToast('网络不稳定，语音可能受影响，也可以打字输入');
          } else if (error === 'start-failed') {
            App.showToast('语音启动失败，请稍后再试');
          } else if (error === 'silence') {
            self.addAIBubble('好像没听到声音，是不是麦克风离得有点远？也可以直接打字告诉我。', 'calm');
          }
        }
      });

      if (started) {
        this.state.isRecording = true;
        voiceOverlay.style.display = 'flex';
        voiceStatus.textContent = '正在聆听...';
        voiceTranscript.style.display = 'none';
      } else if (!SpeechRecorder.isSupported) {
        App.showToast('当前浏览器不支持语音识别，请直接打字输入');
      }
    },

    stopRecording: function () {
      if (!this.state.isRecording) return;
      var voiceOverlay = document.getElementById('voice-overlay');
      var voiceTranscript = document.getElementById('voice-transcript');
      this.state.isRecording = false;
      voiceOverlay.style.display = 'none';
      voiceTranscript.style.display = 'none';

      var finalText = SpeechRecorder.stop();
      if (finalText && finalText.trim().length > 0) {
        this.processUserInput(finalText.trim());
      } else {
        this.addAIBubble('没听清楚，可以再说一遍吗？也可以直接打字输入。', 'calm');
      }
    },

    sendText: function (text) {
      if (this.state.paused) return;
      if (!text || !text.trim()) return;
      this.processUserInput(text.trim());
      var input = document.getElementById('chat-text-input');
      if (input) input.value = '';
    },

    // 处理用户上传的照片
    processPhotoUpload: function (dataUrl) {
      // 显示照片气泡
      this.addPhotoBubble(dataUrl);
      this.state.transcript.push({ role: 'user', text: '', photo: dataUrl, time: Date.now() });
      this.state.uploadedPhoto = dataUrl;

      var self = this;
      setTimeout(function () {
        self.showTypingIndicator();

        // 如果启用了LLM，调用大模型（流式输出）
        if (Settings.isLLMEnabled()) {
          var user = UserManager.getCurrentUser();
          var systemPrompt = LLMEngine.buildSystemPrompt(user || {}, self.state.onboarding, self.state.onboardingStep);
          var messages = LLMEngine.buildMessages(self.state.transcript, '', true);

          // 先显示打字指示器，收到第一个chunk后切换为流式气泡
          var streamContent = null;
          LLMEngine.chat(systemPrompt, messages, function (resp, err) {
            if (resp) {
              if (streamContent) {
                self.finalizeStreamingBubble(streamContent, resp.emotion);
              } else {
                self.removeTypingIndicator();
                self.addAIBubble(resp.text, resp.emotion);
              }
              self.state.transcript.push({ role: 'ai', text: resp.text, time: Date.now() });
              self.state.emotionLevel = resp.emotion;
              self.state.conversationCount++;
              if (resp.emotion === 'emotional') {
                setTimeout(function () { self.showEmotionIndicator('已检测到情绪波动 · 已暂停追问'); }, 400);
              }
            } else {
              if (streamContent) { streamContent.parentElement.remove(); }
              self.removeTypingIndicator();
              var question = AIEngine.getPhotoQuestion();
              self.addAIBubble(question, 'warm');
              self.state.transcript.push({ role: 'ai', text: question, time: Date.now() });
              self.state.conversationCount++;
              App.showToast('AI连接异常，使用基础模式回复');
            }
          }, function (piece, fullText) {
            // 收到第一个chunk：移除打字指示器，创建流式气泡
            if (!streamContent) {
              self.removeTypingIndicator();
              streamContent = self.addStreamingAIBubble();
            }
            self.updateStreamingBubble(streamContent, fullText);
          });
        } else {
          // 未启用LLM，使用规则引擎
          setTimeout(function () {
            self.removeTypingIndicator();
            var question = AIEngine.getPhotoQuestion();
            self.addAIBubble(question, 'warm');
            self.state.transcript.push({ role: 'ai', text: question, time: Date.now() });
            self.state.conversationCount++;
          }, 1500);
        }
      }, 500);
    },

    // 处理用户输入
    processUserInput: function (userText) {
      this.addUserBubble(userText);
      this.state.transcript.push({ role: 'user', text: userText, time: Date.now() });

      var self = this;
      var count = this.state.conversationCount;

      setTimeout(function () {
        self.showTypingIndicator();

        // 引导流程 — LLM模式下也由LLM生成引导对话
        if (self.state.onboarding && self.state.onboardingStep < AIEngine.onboardingSteps.length - 1) {
          var currentStep = AIEngine.onboardingSteps[self.state.onboardingStep];
          // 保存用户回答到 profile
          if (currentStep.field) {
            var user = UserManager.getCurrentUser();
            if (user) {
              var profileUpdate = {};
              profileUpdate[currentStep.field] = userText;
              UserManager.updateUserProfile(user.id, profileUpdate);
              if (currentStep.field === 'birthYear') {
                var year = userText.match(/\d{4}/);
                if (year) UserManager.updateUser(user.id, { birthYear: year[0] });
              }
              if (currentStep.field === 'occupation') {
                UserManager.updateUser(user.id, { bio: userText });
              }
            }
          }

          self.state.onboardingStep++;
          self.updateOnboardingIndicator();

          // 如果引导完成
          if (self.state.onboardingStep === AIEngine.onboardingSteps.length - 1) {
            var u = UserManager.getCurrentUser();
            if (u) { u.onboarded = true; UserManager.persist(); }
            Renderer.renderUserProfile();
          }

          // LLM模式下，用LLM生成引导回复（流式输出）
          if (Settings.isLLMEnabled()) {
            var llmUser = UserManager.getCurrentUser() || {};
            var sysPrompt = LLMEngine.buildSystemPrompt(llmUser, true, self.state.onboardingStep);
            var msgs = LLMEngine.buildMessages(self.state.transcript, '', false);

            var obStreamContent = null;
            LLMEngine.chat(sysPrompt, msgs, function (resp, err) {
              if (resp) {
                if (obStreamContent) {
                  self.finalizeStreamingBubble(obStreamContent, resp.emotion);
                } else {
                  self.removeTypingIndicator();
                  self.addAIBubble(resp.text, resp.emotion);
                }
                self.state.transcript.push({ role: 'ai', text: resp.text, time: Date.now() });
                self.state.conversationCount++;
              } else {
                if (obStreamContent) { obStreamContent.parentElement.remove(); }
                self.removeTypingIndicator();
                var nextStep = AIEngine.onboardingSteps[self.state.onboardingStep];
                var nextQ = nextStep.question;
                var userName = UserManager.getCurrentUser() ? UserManager.getCurrentUser().name : '';
                nextQ = nextQ.replace(/\{name\}/g, userName);
                self.addAIBubble(nextQ, 'warm');
                self.state.transcript.push({ role: 'ai', text: nextQ, time: Date.now() });
                self.state.conversationCount++;
                App.showToast('AI连接异常，使用基础模式');
              }
            }, function (piece, fullText) {
              if (!obStreamContent) {
                self.removeTypingIndicator();
                obStreamContent = self.addStreamingAIBubble();
              }
              self.updateStreamingBubble(obStreamContent, fullText);
            });
          } else {
            // 规则引擎模式
            var nextStep2 = AIEngine.onboardingSteps[self.state.onboardingStep];
            var nextQ2 = nextStep2.question;
            var userName2 = UserManager.getCurrentUser() ? UserManager.getCurrentUser().name : '';
            nextQ2 = nextQ2.replace(/\{name\}/g, userName2);
            var resp2 = { text: nextQ2, emotion: 'warm' };
            setTimeout(function () {
              self.removeTypingIndicator();
              self.addAIBubble(resp2.text, resp2.emotion);
              self.state.transcript.push({ role: 'ai', text: resp2.text, time: Date.now() });
              self.state.conversationCount++;
            }, 1200);
          }
        } else {
          // 正常对话
          if (Settings.isLLMEnabled()) {
            // LLM模式（流式输出）
            var chatUser = UserManager.getCurrentUser() || {};
            var chatSysPrompt = LLMEngine.buildSystemPrompt(chatUser, false, 0);
            var chatMsgs = LLMEngine.buildMessages(self.state.transcript, '', false);

            var chatStreamContent = null;
            LLMEngine.chat(chatSysPrompt, chatMsgs, function (resp, err) {
              if (resp) {
                if (chatStreamContent) {
                  self.finalizeStreamingBubble(chatStreamContent, resp.emotion);
                } else {
                  self.removeTypingIndicator();
                  self.addAIBubble(resp.text, resp.emotion);
                }
                self.state.transcript.push({ role: 'ai', text: resp.text, time: Date.now() });
                self.state.emotionLevel = resp.emotion;
                self.state.conversationCount++;
                if (resp.emotion === 'emotional') {
                  setTimeout(function () { self.showEmotionIndicator('已检测到情绪波动 · 已暂停追问'); }, 400);
                }
              } else {
                // 降级到规则引擎
                if (chatStreamContent) { chatStreamContent.parentElement.remove(); }
                self.removeTypingIndicator();
                var fallback = AIEngine.generateResponse(userText, count, AIEngine.context);
                self.addAIBubble(fallback.text, fallback.emotion);
                self.state.transcript.push({ role: 'ai', text: fallback.text, time: Date.now() });
                self.state.emotionLevel = fallback.emotion;
                self.state.conversationCount++;
                App.showToast('AI连接异常，使用基础模式回复');
              }
            }, function (piece, fullText) {
              if (!chatStreamContent) {
                self.removeTypingIndicator();
                chatStreamContent = self.addStreamingAIBubble();
              }
              self.updateStreamingBubble(chatStreamContent, fullText);
            });
          } else {
            // 规则引擎模式
            var resp3 = AIEngine.generateResponse(userText, count, AIEngine.context);
            var thinkTime = resp3.emotion === 'emotional' ? 2500 : 1500;
            setTimeout(function () {
              self.removeTypingIndicator();
              self.addAIBubble(resp3.text, resp3.emotion);
              self.state.transcript.push({ role: 'ai', text: resp3.text, time: Date.now() });
              self.state.emotionLevel = resp3.emotion;
              self.state.conversationCount++;
              if (resp3.emotion === 'emotional') {
                setTimeout(function () { self.showEmotionIndicator('已检测到情绪波动 · 已暂停追问'); }, 400);
              }
            }, thinkTime);
          }
        }
      }, 600);
    },

    endDialogue: function () {
      var self = this;
      this.showTypingIndicator();
      setTimeout(function () {
        self.removeTypingIndicator();
        self.addAIBubble(AIEngine.closing || '谢谢你今天和我聊这些。这些故事，我都会帮你好好记着。下次再来，我等你。', 'warm');
        self.state.transcript.push({ role: 'ai', text: '谢谢你今天和我聊这些。这些故事，我都会帮你好好记着。下次再来，我等你。', time: Date.now() });
      }, 1500);
    },

    addAIBubble: function (text, emotion) {
      var area = document.getElementById('chat-bubbles');
      var bubble = document.createElement('div');
      bubble.className = 'chat-bubble ai';
      var avatar = document.createElement('div');
      avatar.className = 'ai-avatar';
      avatar.textContent = '光';
      bubble.appendChild(avatar);
      var content = document.createElement('span');
      content.textContent = text;
      bubble.appendChild(content);
      if (emotion === 'emotional') bubble.style.borderLeft = '3px solid #C4806B';
      else if (emotion === 'warm') bubble.style.borderLeft = '3px solid #D4A847';
      area.appendChild(bubble);
      this.scrollChatToBottom();
    },

    addUserBubble: function (text) {
      var area = document.getElementById('chat-bubbles');
      var bubble = document.createElement('div');
      bubble.className = 'chat-bubble user';
      bubble.textContent = text;
      area.appendChild(bubble);
      this.scrollChatToBottom();
    },

    addPhotoBubble: function (photoUrl) {
      var area = document.getElementById('chat-bubbles');
      var bubble = document.createElement('div');
      bubble.className = 'chat-bubble user photo-bubble';
      var img = document.createElement('img');
      img.src = photoUrl;
      img.alt = '用户上传的照片';
      bubble.appendChild(img);
      area.appendChild(bubble);
      this.scrollChatToBottom();
    },

    showTypingIndicator: function () {
      var area = document.getElementById('chat-bubbles');
      if (area.querySelector('.typing-bubble')) return;
      var bubble = document.createElement('div');
      bubble.className = 'chat-bubble ai typing-bubble';
      var avatar = document.createElement('div');
      avatar.className = 'ai-avatar';
      avatar.textContent = '光';
      bubble.appendChild(avatar);
      var ind = document.createElement('div');
      ind.className = 'typing-indicator';
      ind.innerHTML = '<span></span><span></span><span></span>';
      bubble.appendChild(ind);
      area.appendChild(bubble);
      this.scrollChatToBottom();
    },

    removeTypingIndicator: function () { var t = document.querySelector('.typing-bubble'); if (t) t.remove(); },

    // 创建流式AI气泡，返回content元素供逐步更新
    addStreamingAIBubble: function () {
      var area = document.getElementById('chat-bubbles');
      var bubble = document.createElement('div');
      bubble.className = 'chat-bubble ai streaming';
      var avatar = document.createElement('div');
      avatar.className = 'ai-avatar';
      avatar.textContent = '忆';
      bubble.appendChild(avatar);
      var content = document.createElement('span');
      content.className = 'streaming-text';
      content.textContent = '';
      bubble.appendChild(content);
      area.appendChild(bubble);
      this.scrollChatToBottom();
      return content;
    },

    updateStreamingBubble: function (contentEl, fullText) {
      contentEl.textContent = fullText;
      this.scrollChatToBottom();
    },

    finalizeStreamingBubble: function (contentEl, emotion) {
      var bubble = contentEl.parentElement;
      bubble.classList.remove('streaming');
      if (emotion === 'emotional') bubble.style.borderLeft = '3px solid #C4806B';
      else if (emotion === 'warm') bubble.style.borderLeft = '3px solid #D4A847';
    },

    showEmotionIndicator: function (text) {
      var area = document.getElementById('chat-bubbles');
      var ind = document.createElement('div');
      ind.className = 'emotion-indicator';
      ind.innerHTML = '<div class="emotion-dot" style="background:#C4806B"></div>' + text;
      ind.style.justifyContent = 'center';
      ind.style.marginTop = '4px';
      area.appendChild(ind);
      this.scrollChatToBottom();
    },

    scrollChatToBottom: function () {
      var c = document.getElementById('chat-content');
      if (c) setTimeout(function () { c.scrollTop = c.scrollHeight; }, 100);
    },

    togglePause: function () {
      this.state.paused = !this.state.paused;
      if (this.state.paused && this.state.isRecording) this.stopRecording();
      return this.state.paused;
    },

    close: function () {
      if (this.state.transcript.length > 1) {
        var story = AIEngine.extractStory(this.state.transcript);
        if (story) {
          var user = UserManager.getCurrentUser();
          if (user) {
            // 如果是补充模式，更新已有故事
            if (this.state.supplementStory && this.state.supplementStory.id) {
              var existing = user.stories.find(function (s) { return s.id === ChatEngine.state.supplementStory.id; });
              if (existing) {
                existing.text = story.text;
                existing.transcript = story.transcript;
                existing.quote = story.quote || existing.quote;
                Store.save(UserManager.data);
              }
            } else {
              UserManager.addStory(user.id, story);
            }
          }
        }
      }
      this.state.active = false;
      this.state.supplementStory = null;
      this.state.currentTheme = null;
      this.stopTimer();
      if (this.state.isRecording) SpeechRecorder.cancel();
      document.getElementById('onboarding-indicator').classList.remove('visible');
      document.getElementById('chat-overlay').classList.remove('active');
    }
  };

  /* ============================================================
   * 第六部分：页面渲染器 Renderer
   * ============================================================ */
  var Renderer = {
    renderDate: function () {
      var now = new Date();
      var months = ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];
      var weekdays = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
      var el = document.getElementById('today-date');
      if (el) el.textContent = now.getFullYear() + '年 ' + months[now.getMonth()] + now.getDate() + '日 · ' + weekdays[now.getDay()];
    },

    renderUserProfile: function () {
      var user = UserManager.getCurrentUser();
      if (!user) return;
      var avatar = document.getElementById('profile-avatar');
      var name = document.getElementById('profile-name');
      var bio = document.getElementById('profile-bio');
      if (avatar) { avatar.textContent = user.initial; avatar.style.background = user.color; }
      if (name) name.textContent = user.name + (user.onboarded ? '' : ' · 待完善');
      if (bio) bio.textContent = (user.bio || user.profile.occupation || '暂无简介') + (user.birthYear ? ' · ' + user.birthYear + '年生' : '');
    },

    renderMemoryGrid: function () {
      var grid = document.getElementById('memory-grid');
      if (!grid) return;
      grid.innerHTML = '';
      var user = UserManager.getCurrentUser();
      if (!user) return;
      var stories = user.stories || [];

      // 新用户（未完成引导或没有故事）显示主题入口
      var themeSection = document.getElementById('theme-section');
      if (themeSection) {
        if (!user.onboarded || stories.length === 0) {
          themeSection.style.display = 'block';
          this.renderThemeGrid();
        } else {
          themeSection.style.display = 'none';
        }
      }

      if (stories.length === 0) {
        grid.innerHTML = '<div class="empty-state" style="grid-column:span 2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 6v6l4 2"/><circle cx="12" cy="12" r="10"/></svg><p>还没有回忆篇章</p><div class="empty-hint">点击上方主题，开始你的第一个故事</div></div>';
        return;
      }
      stories.slice(0, 4).forEach(function (s) {
        var card = document.createElement('div');
        card.className = 'memory-card';
        var photoHtml = s.photo ? '<img class="card-photo" src="' + s.photo + '" alt="' + s.title + '">' : '<div class="card-photo" style="background:linear-gradient(135deg,var(--accent-soft),var(--bg2));display:flex;align-items:center;justify-content:center;"><svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5" style="width:32px;height:32px;opacity:0.4"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>';
        card.innerHTML = '<div class="card-corner"></div><span class="card-tag">' + this.getThemeLabel(s.theme) + '</span>' + photoHtml + '<div class="card-body"><div class="card-year">' + s.year + (s.age ? ' · ' + s.age : '') + '</div><div class="card-title">' + s.title + '</div><div class="card-excerpt">' + (s.text || '') + '</div></div>';
        card.addEventListener('click', function () { App.showStoryDetail(s); });
        grid.appendChild(card);
      }.bind(this));
    },

    // 回忆主题数据
    memoryThemes: [
      { key: 'childhood', icon: '🏠', title: '童年往事', desc: '老家、童年、那些老物件', color: '#C97B3F', prompt: '我们聊聊你小时候的事吧。你是哪里人？老家那边是什么样的？' },
      { key: 'youth', icon: '📖', title: '青春岁月', desc: '上学、读书、年轻时的梦想', color: '#6B8E7F', prompt: '你上学那会儿是什么样的？还记得第一天上学的事吗？' },
      { key: 'work', icon: '🔧', title: '工作生涯', desc: '第一份工作、职业故事、同事', color: '#4A6B8A', prompt: '你第一份工作是什么？还记得刚上班那会儿的事吗？' },
      { key: 'family', icon: '💑', title: '家庭与爱情', desc: '另一半、孩子、家里的故事', color: '#B85C5C', prompt: '聊聊你家里的人吧。你和你老伴是怎么认识的？' },
      { key: 'travel', icon: '🚂', title: '旅途记忆', desc: '去过的地方、印象最深的旅行', color: '#7B6B8A', prompt: '你出过远门吗？印象最深的一次旅行是什么时候？' },
      { key: 'hobbies', icon: '🎵', title: '爱好与趣事', desc: '喜欢做的事、生活中的小确幸', color: '#D4A847', prompt: '你平时喜欢做什么？什么事让你觉得最开心？' }
    ],

    renderThemeGrid: function () {
      var grid = document.getElementById('theme-grid');
      if (!grid) return;
      grid.innerHTML = '';
      var self = this;
      this.memoryThemes.forEach(function (theme) {
        var card = document.createElement('div');
        card.className = 'theme-card';
        card.innerHTML = '<div class="theme-icon" style="background:' + theme.color + '20;color:' + theme.color + '">' + theme.icon + '</div>' +
          '<div class="theme-title">' + theme.title + '</div>' +
          '<div class="theme-desc">' + theme.desc + '</div>';
        card.addEventListener('click', function () {
          // 点击主题，开始对话，带着主题提示
          ChatEngine.startWithTheme(theme);
        });
        grid.appendChild(card);
      });
    },

    renderProfilePage: function () {
      var user = UserManager.getCurrentUser();
      if (!user) return;
      var profile = user.profile || {};

      // 头像和名字
      var avatar = document.getElementById('profile-avatar-large');
      if (avatar) { avatar.textContent = user.initial; avatar.style.background = user.color; }
      var nameEl = document.getElementById('profile-name-large');
      if (nameEl) nameEl.textContent = user.name;
      var bioEl = document.getElementById('profile-bio-large');
      if (bioEl) bioEl.textContent = (profile.occupation || user.bio || '暂无') + (user.birthYear ? ' · ' + user.birthYear + '年生' : '');
      // 统计
      var stories = user.stories || [];
      var storyEl = document.getElementById('stat-stories');
      if (storyEl) storyEl.textContent = stories.length;
      var chatEl = document.getElementById('stat-chats');
      if (chatEl) chatEl.textContent = stories.length > 0 ? stories.length + '+' : '0';
      var photoEl = document.getElementById('stat-photos');
      if (photoEl) photoEl.textContent = stories.filter(function (s) { return s.photo; }).length;

      // 个人档案信息列表
      var infoList = document.getElementById('info-list');
      if (infoList) {
        var infoItems = [
          { label: '姓名', value: user.name || '未填写' },
          { label: '出生年份', value: user.birthYear ? user.birthYear + '年' : '未填写' },
          { label: '老家', value: profile.hometown || '未填写' },
          { label: '职业', value: profile.occupation || '未填写' },
          { label: '家庭情况', value: profile.family || '未填写' },
          { label: '爱好', value: profile.hobbies || '未填写' }
        ];
        infoList.innerHTML = '';
        infoItems.forEach(function (item) {
          var div = document.createElement('div');
          div.className = 'me-info-row';
          var isEmpty = !item.value || item.value === '未填写';
          div.innerHTML = '<span class="me-info-key">' + item.label + '</span><span class="me-info-val' + (isEmpty ? ' empty' : '') + '">' + item.value + '</span>';
          infoList.appendChild(div);
        });
      }

      // AI状态描述
      var aiDesc = document.getElementById('ai-status-desc');
      if (aiDesc) {
        if (Settings.isLLMEnabled()) {
          aiDesc.textContent = '当前：' + Settings.getProvider().name + ' · ' + Settings.getModel();
          aiDesc.style.color = 'var(--teal)';
        } else {
          aiDesc.textContent = '未启用（基础模式）';
          aiDesc.style.color = 'var(--muted)';
        }
      }
    },

    renderTimeline: function (filter) {
      var container = document.getElementById('timeline-items');
      if (!container) return;
      container.innerHTML = '';
      var user = UserManager.getCurrentUser();
      if (!user) return;
      var stories = user.stories || [];
      stories.sort(function (a, b) { return parseInt(a.year) - parseInt(b.year); });
      var items = filter && filter !== 'all' ? stories.filter(function (t) { return t.theme === filter; }) : stories;
      if (filter === 'all' || !filter) {
        var related = UserManager.getRelatedStories(user.id);
        related.forEach(function (r) {
          items.push({ year: r.story.year, age: r.story.age, title: r.story.title, theme: r.story.theme, highlight: false, text: r.story.text, quote: r.story.quote, hasPhoto: r.story.hasPhoto, photo: r.story.photo, hasAudio: r.story.hasAudio, audioLen: r.story.audioLen, likes: r.story.likes, comments: r.story.comments, _related: { name: r.userName, label: r.relType, color: r.userColor } });
        });
        items.sort(function (a, b) { return parseInt(a.year) - parseInt(b.year); });
      }
      if (items.length === 0) { container.innerHTML = '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg><p>这个分类下还没有回忆篇章</p><div class="empty-hint">开始对话，让AI帮你记录故事</div></div>'; return; }
      items.forEach(function (item) {
        var div = document.createElement('div');
        div.className = 'timeline-item';
        var photoHtml = item.hasPhoto ? '<img class="story-photo" src="' + item.photo + '" alt="' + item.title + '">' : '';
        var audioHtml = item.hasAudio ? '<div class="story-audio-bar"><div class="play-icon"><svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg></div><div class="waveform">' + this.generateWaveform() + '</div><span class="duration">' + item.audioLen + '</span></div>' : '';
        var quoteHtml = item.quote ? '<div class="story-quote">' + item.quote + '</div>' : '';
        var relatedBadge = item._related ? '<span class="related-story-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>' + item._related.name + ' · ' + item._related.label + '</span>' : '';
        div.innerHTML = '<div class="timeline-year"><div class="year-num">' + item.year + '</div><div class="year-age">' + (item.age || '') + '</div></div><div class="timeline-dot' + (item.highlight ? ' highlight' : '') + '"></div><div class="story-card"><div class="story-header"><div class="story-title">' + item.title + relatedBadge + '</div><div class="story-theme">' + this.getThemeLabel(item.theme) + '</div></div><div class="story-text">' + (item.text || '') + '</div>' + quoteHtml + photoHtml + audioHtml + '<div class="story-footer"><div class="footer-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' + (item.likes || 0) + '</div><div class="footer-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' + (item.comments || 0) + '</div></div></div>';
        div.querySelector('.story-card').addEventListener('click', function () { App.showStoryDetail(item); });
        container.appendChild(div);
      }.bind(this));
    },

    generateWaveform: function () { var b = ''; for (var i = 0; i < 30; i++) b += '<span style="height:' + Math.floor(Math.random() * 60 + 20) + '%"></span>'; return b; },
    getThemeLabel: function (t) {
      var l = {
        childhood: '童年往事', youth: '青春岁月', education: '求学时光',
        career: '工作生涯', family: '家庭亲情', travel: '旅途见闻',
        era: '时代记忆', daily: '日常点滴', reflection: '人生感悟',
        hobbies: '兴趣爱好'
      };
      return l[t] || t;
    },

    renderMembers: function () {
      var container = document.getElementById('family-members');
      if (!container) return;
      container.innerHTML = '';
      var cu = UserManager.getCurrentUser();
      var all = UserManager.getAllUsers();
      var self = this;
      all.forEach(function (u) {
        var isC = u.id === cu.id;
        var rel = cu.relationships.find(function (r) { return r.userId === u.id; });
        var storyCount = (u.stories || []).length;
        var div = document.createElement('div');
        div.className = 'member-avatar';
        div.innerHTML = '<div class="avatar-circle" style="background:' + u.color + '">' + u.initial + '</div><div class="avatar-name">' + u.name + (isC ? '（本人）' : (rel ? ' · ' + rel.label : '')) + '</div><div class="avatar-count">' + storyCount + ' 篇回忆</div>';
        div.addEventListener('click', function () {
          // 点击人名，查看这个人的回忆
          self.showPersonStories(u);
        });
        container.appendChild(div);
      });
      var ts = all.reduce(function (s, u) { return s + (u.stories ? u.stories.length : 0); }, 0);
      var banner = document.querySelector('.family-header-banner .family-name');
      if (banner) banner.textContent = cu.name.charAt(0) + '氏家族 · 时光相册';
      var stats = document.querySelectorAll('.family-header-banner .stat-num');
      if (stats[0]) stats[0].textContent = all.length;
      if (stats[1]) stats[1].textContent = ts;
      if (stats[2]) stats[2].textContent = ts > 0 ? Math.floor(ts * 2.5) : 0;
    },

    // 查看某个人的回忆
    showPersonStories: function (user) {
      var stories = user.stories || [];
      if (stories.length === 0) {
        this.showToast(user.name + ' 还没有记录回忆');
        return;
      }

      // 按时间排序
      stories.sort(function (a, b) { return parseInt(a.year) - parseInt(b.year); });

      var storiesHtml = stories.map(function (s) {
        var photoHtml = s.photo ? '<img src="' + s.photo + '" style="width:100%;border-radius:8px;margin:8px 0" alt="' + s.title + '">' : '';
        return '<div style="margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid var(--rule)">' +
          '<div style="font-size:13px;color:var(--accent);font-weight:600;margin-bottom:4px">' + s.year + (s.age ? ' · ' + s.age : '') + ' · ' + this.getThemeLabel(s.theme) + '</div>' +
          '<div style="font-size:15px;font-weight:600;color:var(--ink);margin-bottom:6px">' + s.title + '</div>' +
          '<div style="font-size:13px;color:var(--muted);line-height:1.5">' + (s.text || '') + '</div>' +
          photoHtml +
          (s.quote ? '<div style="font-family:var(--italic);font-style:italic;font-size:13px;color:var(--ink);margin-top:6px">' + s.quote + '</div>' : '') +
          '</div>';
      }.bind(this)).join('');

      // 直接用 modal 组件渲染
      var overlay = document.getElementById('modal-overlay');
      var card = document.getElementById('modal-card');
      card.innerHTML = '<div class="modal-icon" style="background:' + user.color + '">' + user.initial + '</div>' +
        '<h3>' + user.name + '的回忆</h3>' +
        '<p style="color:var(--muted);font-size:13px;margin-bottom:12px">共 ' + stories.length + ' 篇回忆</p>' +
        '<div style="max-height:50vh;overflow-y:auto;text-align:left">' + storiesHtml + '</div>' +
        '<div class="modal-actions"><button class="modal-btn primary" id="modal-close-btn">关闭</button></div>';
      overlay.classList.add('active');
      document.getElementById('modal-close-btn').addEventListener('click', function () { overlay.classList.remove('active'); });
    },

    renderFeed: function () {
      var container = document.getElementById('masonry-feed');
      if (!container) return;
      container.innerHTML = '';
      var all = UserManager.getAllUsers();
      var items = [];
      all.forEach(function (u) {
        (u.stories || []).forEach(function (s) {
          // 只显示有照片或有引用语句的精彩回忆
          if (s.hasPhoto || (s.quote && s.quote.length > 10) || s.highlight) {
            items.push({ author: u.name, initial: u.initial, color: u.color, type: s.hasPhoto ? 'photo' : 'text', photo: s.photo, text: s.text, quote: s.quote, likes: s.likes || 0, comments: s.comments || 0, time: s.year, theme: s.theme, userId: u.id });
          }
        });
      });

      if (items.length === 0) {
        container.innerHTML = '<div class="empty-state" style="column-span:all"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:32px;height:32px;margin-bottom:8px"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg><p>还没有家族精彩回忆</p><div class="empty-hint">记录更多故事，与家人分享精彩瞬间</div></div>';
        return;
      }

      // 按年份排序
      items.sort(function (a, b) { return parseInt(b.time) - parseInt(a.time); });

      // 最多显示6条
      items = items.slice(0, 6);

      items.forEach(function (item) {
        var div = document.createElement('div');
        div.className = 'masonry-item';
        var themeLabel = this.getThemeLabel(item.theme);
        var h = '<div class="item-body"><div class="item-author"><div class="mini-avatar" style="background:' + item.color + '">' + item.initial + '</div><div class="author-name">' + item.author + '</div><div style="font-size:10px;color:var(--muted);margin-left:auto">' + item.time + '</div></div>';
        if (item.type === 'photo' && item.photo) h += '<img class="item-photo" src="' + item.photo + '" alt="照片">';
        if (item.text) h += '<div class="item-text">' + item.text + '</div>';
        if (item.quote) h += '<div class="item-quote">' + item.quote + '</div>';
        h += '<div class="item-theme-tag">' + themeLabel + '</div>';
        h += '<div class="item-footer"><div class="action"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' + item.likes + '</div><div class="action"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' + item.comments + '</div></div></div>';
        div.innerHTML = h;
        container.appendChild(div);
      }.bind(this));
    },

    renderEmotionHighlights: function () {
      var container = document.getElementById('emotion-highlights');
      if (!container) return;
      container.innerHTML = '';
      var user = UserManager.getCurrentUser();
      if (!user) return;
      var stories = user.stories || [];
      if (stories.length === 0) { container.innerHTML = '<div class="empty-state"><p>记录更多故事后，将生成你的情绪曲线</p></div>'; return; }
      var highlights = [];
      stories.forEach(function (s) {
        var text = (s.text || '') + (s.quote || '');
        if (/开心|高兴|快乐|幸福|笑|激动|欢喜/.test(text)) highlights.push({ type:'peak', label:'人生高光 · ' + s.year, title:s.title, desc:s.text ? s.text.slice(0, 60) : '' });
        if (/难过|失去|走了|想念|怀念|哭|去世/.test(text)) highlights.push({ type:'valley', label:'人生低谷 · ' + s.year, title:s.title, desc:s.text ? s.text.slice(0, 60) : '' });
      });
      if (highlights.length === 0) {
        highlights.push({ type:'peak', label:'期待中的高光', title:'记录更多故事', desc:'当你讲述快乐的回忆时，这里会标记人生高光时刻。' });
        highlights.push({ type:'valley', label:'期待中的低谷', title:'记录更多故事', desc:'当你讲述感伤的回忆时，这里会标记人生低谷时刻。' });
      }
      highlights.forEach(function (h) {
        var div = document.createElement('div');
        div.className = 'highlight-card ' + h.type;
        var icon = h.type === 'peak' ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>' : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>';
        div.innerHTML = '<div class="highlight-icon">' + icon + '</div><div class="highlight-content"><div class="highlight-label">' + h.label + '</div><div class="highlight-title">' + h.title + '</div><div class="highlight-desc">' + h.desc + '</div></div>';
        container.appendChild(div);
      });
    }
  };

  /* ============================================================
   * 第七部分：情绪曲线图
   * ============================================================ */
  var EmotionChart = {
    init: function () {
      var d = document.getElementById('emotion-chart');
      if (!d || typeof echarts === 'undefined') return;
      var s = getComputedStyle(document.documentElement);
      var accent = s.getPropertyValue('--accent').trim(), gold = s.getPropertyValue('--gold').trim();
      var rose = s.getPropertyValue('--rose').trim(), teal = s.getPropertyValue('--teal').trim();
      var ink = s.getPropertyValue('--ink').trim(), muted = s.getPropertyValue('--muted').trim();
      var rule = s.getPropertyValue('--rule').trim(), bg2 = s.getPropertyValue('--bg2').trim();
      var chart = echarts.init(d, null, { renderer: 'svg' });
      var user = UserManager.getCurrentUser();
      var stories = user ? (user.stories || []) : [];
      var years = ['1958','1970','1980','1990','2000','2010','2020','2024'];
      var joy = [60,55,75,70,65,72,58,60], warmth = [70,65,80,85,70,75,60,65];
      var sad = [15,25,20,15,25,22,40,35], nost = [20,35,45,50,55,65,72,78];
      if (stories.length >= 3) {
        years = stories.map(function (s) { return s.year; }).sort();
        joy = stories.map(function (s) { var t = (s.text||'')+(s.quote||''); return /开心|高兴|快乐|幸福|笑|激动/.test(t) ? 85 : 55; });
        warmth = stories.map(function (s) { var t = (s.text||'')+(s.quote||''); return /暖|幸福|家|爱|温柔/.test(t) ? 80 : 60; });
        sad = stories.map(function (s) { var t = (s.text||'')+(s.quote||''); return /难过|失去|走了|想念|怀念|哭/.test(t) ? 75 : 20; });
        nost = stories.map(function (s, i) { return 30 + i * 8; });
      }
      chart.setOption({
        backgroundColor:'transparent', animation:true, animationDuration:1200,
        grid:{top:30,right:16,bottom:48,left:36},
        tooltip:{trigger:'axis',appendToBody:true,backgroundColor:bg2,borderColor:rule,borderWidth:1,textStyle:{color:ink,fontSize:12}},
        legend:{show:false},
        xAxis:{type:'category',data:years,axisLine:{lineStyle:{color:rule}},axisTick:{show:false},axisLabel:{color:muted,fontSize:9,interval:1,formatter:function(v){return "'"+v.slice(2);}}},
        yAxis:{type:'value',min:0,max:100,splitLine:{lineStyle:{color:rule,type:'dashed',opacity:0.4}},axisLine:{show:false},axisTick:{show:false},axisLabel:{color:muted,fontSize:10}},
        series:[
          {name:'喜悦',type:'line',data:joy,smooth:true,symbol:'circle',symbolSize:5,lineStyle:{color:gold,width:2.5},itemStyle:{color:gold},areaStyle:{color:{type:'linear',x:0,y:0,x2:0,y2:1,colorStops:[{offset:0,color:'rgba(212,168,71,0.25)'},{offset:1,color:'rgba(212,168,71,0)'}]}}},
          {name:'温暖',type:'line',data:warmth,smooth:true,symbol:'none',lineStyle:{color:accent,width:2.5},itemStyle:{color:accent}},
          {name:'感伤',type:'line',data:sad,smooth:true,symbol:'circle',symbolSize:5,lineStyle:{color:rose,width:2.5,type:'dashed'},itemStyle:{color:rose}},
          {name:'思念',type:'line',data:nost,smooth:true,symbol:'none',lineStyle:{color:teal,width:2,opacity:0.7},itemStyle:{color:teal}}
        ]
      });
      window.addEventListener('resize', function () { chart.resize(); });
    }
  };

  /* ============================================================
   * 第八部分：应用主控制器 App
   * ============================================================ */
  var App = {
    currentPage: 'home',
    chatBgIndex: 0,
    chatBackgrounds: ['url(assets/old_photo_bg_1280x720.jpg)', 'url(assets/memory_childhood_800x600.jpg)', 'url(assets/memory_youth_800x600.jpg)', 'url(assets/memory_family_800x600.jpg)'],

    init: function () {
      Settings.load();
      this.applyTheme(Settings.data.theme || 'classic');
      UserManager.init();
      SpeechRecorder.init();
      this.refreshAll();
      Renderer.renderDate();
      this.bindNavEvents();
      this.bindChatEvents();
      this.bindFilterEvents();
      this.bindModalEvents();
      this.bindUserProfileEvents();
      this.bindSettingsEvents();
      this.bindThemePicker();
      this.bindMemoirEvents();
    },

    // 应用主题
    applyTheme: function (themeKey) {
      var html = document.documentElement;
      if (themeKey === 'classic') {
        html.removeAttribute('data-theme');
      } else {
        html.setAttribute('data-theme', themeKey);
      }
      Settings.data.theme = themeKey;
      Settings.save();
      // 更新主题选择器高亮
      document.querySelectorAll('.me-theme-card').forEach(function (chip) {
        chip.classList.toggle('active', chip.dataset.themeKey === themeKey);
      });
    },

    bindThemePicker: function () {
      var self = this;
      document.querySelectorAll('.me-theme-card').forEach(function (chip) {
        chip.addEventListener('click', function () {
          var key = chip.dataset.themeKey;
          self.applyTheme(key);
          self.showToast('已切换到' + (key === 'classic' ? '古典' : chip.querySelector('.me-theme-name').textContent) + '主题');
        });
      });
    },

    refreshAll: function () {
      Renderer.renderUserProfile();
      Renderer.renderMemoryGrid();
      Renderer.renderProfilePage();
      Renderer.renderTimeline('all');
      Renderer.renderMembers();
      Renderer.renderFeed();
      var chips = document.querySelectorAll('.filter-chip');
      chips.forEach(function (c) { c.classList.toggle('active', c.dataset.theme === 'all'); });
    },

    bindNavEvents: function () {
      var self = this;
      document.querySelectorAll('.nav-item').forEach(function (item) {
        item.addEventListener('click', function () { self.switchPage(item.dataset.page); });
      });
    },

    switchPage: function (pageName) {
      document.querySelectorAll('.page').forEach(function (p) { p.classList.remove('active'); });
      var target = document.getElementById('page-' + pageName);
      if (target) target.classList.add('active');
      document.querySelectorAll('.nav-item').forEach(function (n) { n.classList.toggle('active', n.dataset.page === pageName); });
      this.currentPage = pageName;
      if (pageName === 'emotion') { Renderer.renderProfilePage(); }
    },

    bindUserProfileEvents: function () {
      var self = this;
      var bar = document.getElementById('user-profile-bar');
      if (bar) bar.addEventListener('click', function () { self.showUserManagement(); });
    },

    bindSettingsEvents: function () {
      var self = this;
      var btn = document.getElementById('settings-btn');
      if (btn) btn.addEventListener('click', function () { self.showSettings(); });

      // "我的"页面中的设置按钮
      var aiBtn = document.getElementById('settings-ai-btn');
      if (aiBtn) aiBtn.addEventListener('click', function () { self.showSettings(); });

      var userBtn = document.getElementById('settings-user-btn');
      if (userBtn) userBtn.addEventListener('click', function () { self.showUserManagement(); });

      var aboutBtn = document.getElementById('settings-about-btn');
      if (aboutBtn) aboutBtn.addEventListener('click', function () { self.showModal('关于', '人生回忆录 v1.0', '每一个凡人微光，都值得被铭记。\n\n这是一款帮助老人记录人生故事的AI应用，通过自然对话的方式，把碎片化的回忆变成完整的故事。', null, '知道了', null); });

      var editBtn = document.getElementById('edit-profile-btn');
      if (editBtn) editBtn.addEventListener('click', function () { self.showUserManagement(); });
    },

    showSettings: function () {
      var overlay = document.getElementById('modal-overlay');
      var card = document.getElementById('modal-card');
      var isActive = Settings.isLLMEnabled();
      var currentKey = Settings.data.apiKey || '';
      var currentProvider = Settings.data.provider || 'deepseek';

      var html = '<div class="modal-icon" style="background:linear-gradient(135deg,var(--accent),var(--accent2))"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#fff;width:28px;height:28px"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></div>';
      html += '<h3>AI 对话设置</h3>';
      html += '<div class="settings-form">';

      // 状态指示
      html += '<div class="ai-status ' + (isActive ? 'active' : 'inactive') + '"><div class="status-dot"></div>' + (isActive ? 'AI 深度对话已启用（' + Settings.getProvider().name + '）' : '当前为基础模式，配置后启用深度对话') + '</div>';

      // 提供商选择
      html += '<div class="form-group">';
      html += '<label class="form-label">选择 AI 服务商</label>';
      html += '<select class="form-input" id="settings-provider">';
      for (var pk in PROVIDERS) {
        var p = PROVIDERS[pk];
        var sel = pk === currentProvider ? ' selected' : '';
        html += '<option value="' + pk + '"' + sel + '>' + p.name + (p.corsOk ? '' : '（可能需代理）') + '</option>';
      }
      html += '</select>';
      html += '<div class="form-hint" id="provider-hint">' + Settings.getProvider().hint + '</div>';
      html += '</div>';

      // API Key
      html += '<div class="form-group">';
      html += '<label class="form-label">API Key</label>';
      html += '<input class="form-input" type="password" id="settings-api-key" placeholder="粘贴你的 API Key..." value="' + currentKey.replace(/"/g, '&quot;') + '">';
      html += '<div class="form-hint" id="key-hint">在 <a href="' + Settings.getProvider().keyUrl + '" target="_blank">' + Settings.getProvider().keyUrl.replace('https://', '').replace(/\/.*/, '') + '</a> 申请 API Key</div>';
      html += '</div>';

      // 模型选择
      html += '<div class="form-group">';
      html += '<label class="form-label">模型</label>';
      html += '<select class="form-input" id="settings-model">';
      var provider = Settings.getProvider();
      for (var mi = 0; mi < provider.models.length; mi++) {
        var m = provider.models[mi];
        var msel = m.id === Settings.getModel() ? ' selected' : '';
        html += '<option value="' + m.id + '"' + msel + '>' + m.name + '</option>';
      }
      html += '</select>';
      html += '</div>';

      html += '</div>';
      html += '<div class="modal-actions">';
      html += '<button class="modal-btn secondary" id="settings-cancel">取消</button>';
      html += '<button class="modal-btn primary" id="settings-save">保存</button>';
      html += '</div>';

      card.innerHTML = html;
      overlay.classList.add('active');

      // 提供商切换时更新模型列表和提示
      document.getElementById('settings-provider').addEventListener('change', function () {
        var newProviderKey = this.value;
        var newProvider = PROVIDERS[newProviderKey];

        // 更新提示
        document.getElementById('provider-hint').textContent = newProvider.hint;
        document.getElementById('key-hint').innerHTML = '在 <a href="' + newProvider.keyUrl + '" target="_blank">' + newProvider.keyUrl.replace('https://', '').replace(/\/.*/, '') + '</a> 申请 API Key';

        // 更新模型列表
        var modelSelect = document.getElementById('settings-model');
        modelSelect.innerHTML = '';
        for (var i = 0; i < newProvider.models.length; i++) {
          var opt = document.createElement('option');
          opt.value = newProvider.models[i].id;
          opt.textContent = newProvider.models[i].name;
          if (i === 0) opt.selected = true;
          modelSelect.appendChild(opt);
        }
      });

      document.getElementById('settings-cancel').addEventListener('click', function () { overlay.classList.remove('active'); });
      document.getElementById('settings-save').addEventListener('click', function () {
        var providerSelect = document.getElementById('settings-provider');
        var keyInput = document.getElementById('settings-api-key');
        var modelSelect = document.getElementById('settings-model');

        Settings.data.provider = providerSelect.value;
        Settings.data.apiKey = keyInput.value.trim();
        Settings.data.model = modelSelect.value;
        Settings.data.useLLM = Settings.data.apiKey.length > 5;
        Settings.save();

        overlay.classList.remove('active');
        if (Settings.isLLMEnabled()) {
          App.showToast('已切换到 ' + Settings.getProvider().name + '，AI深度对话已启用');
        } else {
          App.showToast('已保存设置');
        }
      });
    },

    bindChatEvents: function () {
      var self = this;
      // 首页"开始对话"按钮
      var micBtn = document.getElementById('mic-btn');
      if (micBtn) micBtn.addEventListener('click', function () { self.openChat(false); });
      var closeBtn = document.getElementById('chat-close');
      if (closeBtn) closeBtn.addEventListener('click', function () { self.closeChat(); });

      // 语音按钮 — 点击打开录音浮层
      var voiceBtn = document.getElementById('mode-voice');
      if (voiceBtn) voiceBtn.addEventListener('click', function () {
        if (ChatEngine.state.isRecording) {
          ChatEngine.stopRecording();
        } else {
          ChatEngine.startRecording();
        }
      });

      // 语音浮层"完成"按钮
      var voiceStopBtn = document.getElementById('voice-stop-btn');
      if (voiceStopBtn) voiceStopBtn.addEventListener('click', function () {
        ChatEngine.stopRecording();
      });

      // 文字输入 — 始终可见
      var textSend = document.getElementById('chat-text-send');
      var textInput = document.getElementById('chat-text-input');
      if (textSend) textSend.addEventListener('click', function () { ChatEngine.sendText(textInput.value); });
      if (textInput) textInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') ChatEngine.sendText(textInput.value); });

      // 照片上传 — 内联按钮
      var photoBtnInline = document.getElementById('chat-photo-btn-inline');
      var photoInput = document.getElementById('chat-photo-input');
      if (photoBtnInline && photoInput) {
        photoBtnInline.addEventListener('click', function () { photoInput.click(); });
        photoInput.addEventListener('change', function (e) {
          if (e.target.files && e.target.files[0]) {
            var file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) { self.showToast('照片太大了，请上传5MB以内的图片'); return; }
            var reader = new FileReader();
            reader.onload = function (ev) {
              ChatEngine.processPhotoUpload(ev.target.result);
            };
            reader.readAsDataURL(file);
            e.target.value = '';
          }
        });
      }

      // 暂停按钮移到顶部栏
      var pauseBtn = document.getElementById('chat-pause');
      if (pauseBtn) pauseBtn.addEventListener('click', function () {
        var paused = ChatEngine.togglePause();
        self.showToast(paused ? '对话已暂停' : '对话继续');
      });
    },

    openChat: function (isOnboarding) {
      document.getElementById('chat-overlay').classList.add('active');
      var bg = document.getElementById('chat-bg');
      if (bg) bg.style.backgroundImage = this.chatBackgrounds[0];
      ChatEngine.start(isOnboarding);
    },

    closeChat: function () {
      var had = ChatEngine.state.transcript.length > 1;
      ChatEngine.close();
      if (had) { this.showToast('对话已保存为回忆篇章'); this.refreshAll(); }
    },

    switchChatBackground: function () {
      this.chatBgIndex = (this.chatBgIndex + 1) % this.chatBackgrounds.length;
      var bg = document.getElementById('chat-bg');
      if (bg) { bg.style.opacity = '0'; var self = this; setTimeout(function () { bg.style.backgroundImage = self.chatBackgrounds[self.chatBgIndex]; bg.style.opacity = '0.25'; }, 300); }
      this.showToast('已更换背景照片');
    },

    bindFilterEvents: function () {
      document.querySelectorAll('.filter-chip').forEach(function (chip) {
        chip.addEventListener('click', function () {
          document.querySelectorAll('.filter-chip').forEach(function (c) { c.classList.remove('active'); });
          chip.classList.add('active');
          Renderer.renderTimeline(chip.dataset.theme);
        });
      });
    },

    bindModalEvents: function () {
      var overlay = document.getElementById('modal-overlay');
      if (overlay) overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.classList.remove('active'); });
    },

    showUserManagement: function () {
      var overlay = document.getElementById('modal-overlay');
      var card = document.getElementById('modal-card');
      var users = UserManager.getAllUsers();
      var currentId = UserManager.data.currentUserId;
      var listHtml = '<div class="user-mgmt-list">';
      users.forEach(function (u) {
        listHtml += '<div class="user-mgmt-item' + (u.id === currentId ? ' active' : '') + '" data-uid="' + u.id + '"><div class="mgmt-avatar" style="background:' + u.color + '">' + u.initial + '</div><div class="mgmt-info"><div class="mgmt-name">' + u.name + (u.onboarded ? '' : ' · 待完善') + '</div><div class="mgmt-meta">' + (u.stories.length) + ' 篇回忆 · ' + u.relationships.length + ' 个关系</div></div><div class="mgmt-actions"><button class="mgmt-action-btn edit-user" data-uid="' + u.id + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>' + (users.length > 1 ? '<button class="mgmt-action-btn danger delete-user" data-uid="' + u.id + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>' : '') + '</div></div>';
      });
      listHtml += '</div>';
      card.innerHTML = '<div class="modal-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div><h3>用户管理</h3><p style="margin-bottom:12px">每个用户有独立的故事线。点击切换，编辑可设置关系。</p>' + listHtml + '<div class="modal-actions"><button class="modal-btn secondary" id="modal-cancel">关闭</button><button class="modal-btn primary" id="btn-add-user">新建用户</button></div>';
      overlay.classList.add('active');
      var self = this;
      document.getElementById('modal-cancel').addEventListener('click', function () { overlay.classList.remove('active'); });
      document.getElementById('btn-add-user').addEventListener('click', function () { self.showCreateUserForm(); });
      card.querySelectorAll('.user-mgmt-item').forEach(function (item) {
        item.addEventListener('click', function (e) {
          if (e.target.closest('.mgmt-action-btn')) return;
          var uid = item.dataset.uid;
          UserManager.switchUser(uid);
          overlay.classList.remove('active');
          self.refreshAll();
          self.showToast('已切换到 ' + UserManager.getCurrentUser().name);
        });
      });
      card.querySelectorAll('.edit-user').forEach(function (btn) {
        btn.addEventListener('click', function (e) { e.stopPropagation(); self.showEditUserForm(btn.dataset.uid); });
      });
      card.querySelectorAll('.delete-user').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          var uid = btn.dataset.uid;
          var user = UserManager.getUserById(uid);
          if (confirm('确定要删除「' + user.name + '」吗？所有回忆将一并删除。')) {
            UserManager.deleteUser(uid);
            self.showUserManagement();
            self.refreshAll();
            self.showToast('已删除用户');
          }
        });
      });
    },

    // 新建用户 — 简化表单，创建后进入引导流程
    showCreateUserForm: function () {
      var card = document.getElementById('modal-card');
      var colorOptions = COLORS.map(function (c, i) {
        return '<div class="color-swatch' + (i === 0 ? ' selected' : '') + '" data-color="' + c + '" style="background:' + c + '"></div>';
      }).join('');

      card.innerHTML =
        '<h3>新建用户</h3>' +
        '<p style="margin-bottom:12px;font-size:13px;color:var(--muted)">创建后，AI会一步一步引导你了解这位用户的背景信息，包括工作、生活和家庭。</p>' +
        '<div class="user-form-field"><label>姓名</label><input type="text" id="form-name" placeholder="请输入姓名" maxlength="10"></div>' +
        '<div class="user-form-field"><label>头像颜色</label><div class="color-picker-row" id="color-picker">' + colorOptions + '</div></div>' +
        '<div class="relationship-section"><div class="rel-title">关联关系（可选）</div><div id="rel-list"></div><button class="rel-add-btn" id="rel-add"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>添加关系</button></div>' +
        '<div class="modal-actions" style="margin-top:16px"><button class="modal-btn secondary" id="form-cancel">取消</button><button class="modal-btn primary" id="form-submit">创建并开始引导</button></div>';

      var self = this;
      var selectedColor = COLORS[0];
      card.querySelectorAll('.color-swatch').forEach(function (sw) {
        sw.addEventListener('click', function () {
          card.querySelectorAll('.color-swatch').forEach(function (s) { s.classList.remove('selected'); });
          sw.classList.add('selected');
          selectedColor = sw.dataset.color;
        });
      });

      var relRows = [];
      this._renderRelList(card, relRows);
      document.getElementById('rel-add').addEventListener('click', function () { relRows.push({ targetUid: '', type: 'spouse' }); self._renderRelList(card, relRows); });
      document.getElementById('form-cancel').addEventListener('click', function () { self.showUserManagement(); });
      document.getElementById('form-submit').addEventListener('click', function () {
        var name = document.getElementById('form-name').value.trim();
        if (!name) { self.showToast('请输入姓名'); return; }
        var user = UserManager.createUser(name, '', '', selectedColor);
        relRows.forEach(function (r) { if (r.targetUid) UserManager.addRelationship(user.id, r.targetUid, r.type); });
        UserManager.switchUser(user.id);
        document.getElementById('modal-overlay').classList.remove('active');
        self.refreshAll();
        self.showToast('已创建用户，正在开始引导...');
        // 自动进入引导流程
        setTimeout(function () { self.openChat(true); }, 800);
      });
    },

    showEditUserForm: function (userId) {
      var user = UserManager.getUserById(userId);
      if (!user) return;
      var card = document.getElementById('modal-card');
      var otherUsers = UserManager.getAllUsers().filter(function (u) { return u.id !== userId; });
      var colorOptions = COLORS.map(function (c) { return '<div class="color-swatch' + (c === user.color ? ' selected' : '') + '" data-color="' + c + '" style="background:' + c + '"></div>'; }).join('');
      var p = user.profile || {};
      var relHtml = '';
      user.relationships.forEach(function (r) {
        var target = UserManager.getUserById(r.userId);
        if (target) {
          relHtml += '<div class="rel-row" data-target="' + r.userId + '"><select class="rel-target"><option value="' + r.userId + '">' + target.name + '</option></select><select class="rel-type">' + Object.keys(RELATION_TYPES).map(function (k) { return '<option value="' + k + '"' + (k === r.type ? ' selected' : '') + '>' + RELATION_TYPES[k] + '</option>'; }).join('') + '</select><button class="rel-remove"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>';
        }
      });

      card.innerHTML =
        '<h3>编辑用户</h3>' +
        '<div class="user-form-field"><label>姓名</label><input type="text" id="form-name" value="' + user.name + '" maxlength="10"></div>' +
        '<div class="user-form-field"><label>出生年份</label><input type="text" id="form-birth" value="' + (user.birthYear || '') + '" maxlength="4"></div>' +
        '<div class="user-form-field"><label>简介</label><input type="text" id="form-bio" value="' + (user.bio || '') + '" maxlength="30"></div>' +
        '<div class="user-form-field"><label>职业/状态</label><input type="text" id="form-occupation" value="' + (p.occupation || '') + '" placeholder="如 退休教师"></div>' +
        '<div class="user-form-field"><label>日常生活</label><input type="text" id="form-dailyLife" value="' + (p.dailyLife || '') + '" placeholder="如 每天练书法、钓鱼"></div>' +
        '<div class="user-form-field"><label>家庭情况</label><input type="text" id="form-family" value="' + (p.family || '') + '" placeholder="如 和老伴一起生活"></div>' +
        '<div class="user-form-field"><label>兴趣爱好</label><input type="text" id="form-hobbies" value="' + (p.hobbies || '') + '" placeholder="如 书法、钓鱼"></div>' +
        '<div class="user-form-field"><label>头像颜色</label><div class="color-picker-row" id="color-picker">' + colorOptions + '</div></div>' +
        '<div class="relationship-section"><div class="rel-title">关联关系</div><div id="rel-list">' + relHtml + '</div>' + (otherUsers.length > 0 ? '<button class="rel-add-btn" id="rel-add"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>添加关系</button>' : '<div style="font-size:11px;color:var(--muted)">暂无其他用户可关联</div>') + '</div>' +
        '<div class="modal-actions" style="margin-top:16px"><button class="modal-btn secondary" id="form-cancel">取消</button><button class="modal-btn primary" id="form-submit">保存</button></div>';

      var self = this;
      var selectedColor = user.color;
      card.querySelectorAll('.color-swatch').forEach(function (sw) {
        sw.addEventListener('click', function () { card.querySelectorAll('.color-swatch').forEach(function (s) { s.classList.remove('selected'); }); sw.classList.add('selected'); selectedColor = sw.dataset.color; });
      });
      card.querySelectorAll('.rel-row .rel-remove').forEach(function (btn) {
        btn.addEventListener('click', function () { var row = btn.closest('.rel-row'); UserManager.removeRelationship(userId, row.dataset.target); row.remove(); self.showToast('已移除关系'); });
      });
      var addBtn = document.getElementById('rel-add');
      if (addBtn) {
        addBtn.addEventListener('click', function () {
          var available = otherUsers.filter(function (u) { return !user.relationships.find(function (r) { return r.userId === u.id; }); });
          if (available.length === 0) { self.showToast('已关联所有用户'); return; }
          var nd = document.createElement('div'); nd.className = 'rel-row new-rel';
          nd.innerHTML = '<select class="rel-target">' + available.map(function (u) { return '<option value="' + u.id + '">' + u.name + '</option>'; }).join('') + '</select><select class="rel-type">' + Object.keys(RELATION_TYPES).map(function (k) { return '<option value="' + k + '">' + RELATION_TYPES[k] + '</option>'; }).join('') + '</select><button class="rel-remove"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>';
          document.getElementById('rel-list').appendChild(nd);
          nd.querySelector('.rel-remove').addEventListener('click', function () { nd.remove(); });
        });
      }
      document.getElementById('form-cancel').addEventListener('click', function () { self.showUserManagement(); });
      document.getElementById('form-submit').addEventListener('click', function () {
        var name = document.getElementById('form-name').value.trim();
        if (!name) { self.showToast('请输入姓名'); return; }
        UserManager.updateUser(userId, { name: name, birthYear: document.getElementById('form-birth').value.trim(), bio: document.getElementById('form-bio').value.trim(), color: selectedColor });
        UserManager.updateUserProfile(userId, {
          occupation: document.getElementById('form-occupation').value.trim(),
          dailyLife: document.getElementById('form-dailyLife').value.trim(),
          family: document.getElementById('form-family').value.trim(),
          hobbies: document.getElementById('form-hobbies').value.trim()
        });
        card.querySelectorAll('.rel-row.new-rel').forEach(function (row) { var t = row.querySelector('.rel-target').value; var ty = row.querySelector('.rel-type').value; if (t) UserManager.addRelationship(userId, t, ty); });
        card.querySelectorAll('.rel-row:not(.new-rel)').forEach(function (row) { var t = row.dataset.target; var ty = row.querySelector('.rel-type').value; if (t) UserManager.addRelationship(userId, t, ty); });
        self.showUserManagement(); self.refreshAll(); self.showToast('已保存');
      });
    },

    _renderRelList: function (card, relRows) {
      var list = card.querySelector('#rel-list');
      if (!list) return;
      var otherUsers = UserManager.getAllUsers();
      list.innerHTML = '';
      relRows.forEach(function (r, idx) {
        var div = document.createElement('div');
        div.className = 'rel-row';
        div.innerHTML = '<select class="rel-target" data-idx="' + idx + '"><option value="">选择用户</option>' + otherUsers.map(function (u) { return '<option value="' + u.id + '">' + u.name + '</option>'; }).join('') + '</select><select class="rel-type" data-idx="' + idx + '">' + Object.keys(RELATION_TYPES).map(function (k) { return '<option value="' + k + '">' + RELATION_TYPES[k] + '</option>'; }).join('') + '</select><button class="rel-remove"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>';
        list.appendChild(div);
        div.querySelector('.rel-target').addEventListener('change', function (e) { relRows[idx].targetUid = e.target.value; });
        div.querySelector('.rel-type').addEventListener('change', function (e) { relRows[idx].type = e.target.value; });
        div.querySelector('.rel-remove').addEventListener('click', function () { relRows.splice(idx, 1); App._renderRelList(card, relRows); });
      });
    },

    showStoryDetail: function (item) {
      var self = this;
      var hasTranscript = item.transcript && item.transcript.length > 2;
      var primaryText = hasTranscript ? '补充回忆' : '关闭';
      var secondaryText = hasTranscript ? '关闭' : '补充回忆';

      this.showModal('故事详情', item.title, item.year + '年' + (item.age ? ' · ' + item.age : '') + '\n\n' + (item.text || '') + '\n\n' + (item.quote || ''), secondaryText, primaryText, function () {
        if (hasTranscript) {
          // 有对话记录，进入补充模式
          self.openChatForSupplement(item);
        } else {
          // 没有对话记录，进入新对话
          self.showToast('开始新的对话来补充这段回忆');
          self.openChat(false);
        }
      });
    },

    openChatForSupplement: function (story) {
      // 打开对话界面，加载之前的对话记录
      document.getElementById('chat-overlay').classList.add('active');
      var bg = document.getElementById('chat-bg');
      if (bg) bg.style.backgroundImage = this.chatBackgrounds[0];

      ChatEngine.startForSupplement(story);
    },

    showModal: function (label, title, desc, secondaryText, primaryText, primaryCallback) {
      var overlay = document.getElementById('modal-overlay');
      var card = document.getElementById('modal-card');
      card.innerHTML = '<div class="modal-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div><h3>' + title + '</h3><p>' + desc.replace(/\n/g, '<br>') + '</p><div class="modal-actions"><button class="modal-btn secondary" id="modal-cancel">' + secondaryText + '</button><button class="modal-btn primary" id="modal-confirm">' + primaryText + '</button></div>';
      overlay.classList.add('active');
      document.getElementById('modal-cancel').addEventListener('click', function () { overlay.classList.remove('active'); });
      document.getElementById('modal-confirm').addEventListener('click', function () { overlay.classList.remove('active'); if (primaryCallback) primaryCallback(); });
    },

    /* ===== 回忆录生成功能 ===== */

    // 12种回忆录风格定义
    memoirStyles: [
      {
        key: 'classic', icon: '📖', name: '古典传记',
        desc: '庄重平实，以时间为轴，娓娓道来',
        example: '一九五八年深秋，我出生在豫东平原一个普通的农家。父亲是村里的民办教师，母亲操持着一大家子的生计。那个年代的农村，日子清苦却也有着简单的快乐。'
      },
      {
        key: 'literary', icon: '✒️', name: '文学散文',
        desc: '细腻优美，注重感官和意象，有画面感',
        example: '记忆中的老家，总弥漫着一股柴火灶上小米粥的香气。黄昏时分，炊烟从各家的烟囱里升起来，像一缕缕乡愁，缠在村头的老槐树上，久久不肯散去。'
      },
      {
        key: 'oral', icon: '🎙️', name: '口述实录',
        desc: '口语化，保留讲述者的语气和节奏',
        example: '你要问小时候的事儿啊，那我得从头说。我老家是河南的，农村嘛，那会儿穷得很。我爸是个教书的，我妈在家种地。我记事早，四五岁的事到现在还记得清清楚楚。'
      },
      {
        key: 'letter', icon: '✉️', name: '书信体',
        desc: '以写给某人的信的形式展开，亲切温暖',
        example: '亲爱的孩子：\n\n你总说想听听我年轻时候的故事。今天趁着阳光好，我就从头说起吧。一九五八年，我出生在一个你可能不会想象的贫穷年代……'
      },
      {
        key: 'poetic', icon: '🌙', name: '诗意回忆',
        desc: '短句为主，留白多，有诗的韵律感',
        example: '秋天。\n黄叶落满了院子。\n母亲在灶前忙碌，\n锅里咕嘟咕嘟煮着红薯。\n\n那是我人生最初的记忆——\n温暖，安静，\n像一幅褪了色的老照片。'
      },
      {
        key: 'chronicle', icon: '📜', name: '编年叙事',
        desc: '以年份为章节，清晰记录每段人生',
        example: '【一九六五年·七岁】\n那一年我上了小学。学校在三里外的镇上，每天天不亮就得出发，沿着田埂走过去。书包是母亲用碎布拼的，里面装着唯一的课本。\n\n【一九七六年·十八岁】\n高中毕业那年，命运和所有人一样被改变了方向……'
      },
      {
        key: 'cinematic', icon: '🎬', name: '电影镜头',
        desc: '画面感强，场景切换，像在看一部纪录片',
        example: '镜头推近——\n\n一张发黄的全家福。照片里，年轻的父亲穿着中山装，母亲抱着襁褓中的我，笑容拘谨而幸福。\n\n画面淡出，切入下一个场景：\n\n秋天的田野。七岁的男孩赤着脚，踩在松软的田埂上，书包在背上颠簸。远处传来学校的铃声……'
      },
      {
        key: 'humorous', icon: '😄', name: '幽默自嘲',
        desc: '轻松诙谐，自嘲中见人生智慧',
        example: '我这辈子最大的本事，就是能把苦日子过出甜味来。小时候穷得叮当响，我愣是觉得自家窝窝头比隔壁家的香——后来才知道，大家用的都是一个牌子的玉米面。'
      },
      {
        key: 'reflective', icon: '🪞', name: '人生感悟',
        desc: '回望人生，有思考深度，适合年长者',
        example: '人活一辈子，到头来才明白，真正留下来的不是什么大事，而是那些微不足道的小瞬间——母亲喊吃饭的声音，放学路上的夕阳，孩子第一次叫爸爸时那个含混不清的音节。'
      },
      {
        key: 'reportage', icon: '📰', name: '纪实报道',
        desc: '客观冷静，有时代背景，像人物特写',
        example: '在豫东平原的那座村庄里，李德昌度过了他的童年。那是一个物资匮乏但精神并不贫瘠的年代。作为民办教师的儿子，他比同龄人更早接触到了书本，也比同龄人更早体会到了知识改变命运的渴望。'
      },
      {
        key: 'dialogue', icon: '💬', name: '对话体',
        desc: '以问答形式展开，像在和人聊天',
        example: '问：您还记得小时候家是什么样的吗？\n\n答：怎么不记得。三间土坯房，院子里一棵大枣树。下雨天屋顶漏，我妈就拿盆接着，滴滴答答的，我那时候还觉得好听。穷是真穷，但小时候不懂什么叫穷，每天都挺开心。'
      },
      {
        key: 'nostalgic', icon: '🍂', name: '怀旧抒情',
        desc: '充满对旧时光的眷恋，温暖而感伤',
        example: '有些日子，过去了就再也回不去了。可它们并没有消失，只是沉到了记忆的深处，等到某个黄昏，一阵风吹来灶膛里的柴火味，它们就全涌上来了——那么清晰，又那么遥远，像隔着一层薄雾在看旧时光。'
      }
    ],

    bindMemoirEvents: function () {
      var self = this;
      var genBtn = document.getElementById('generate-memoir-btn');
      if (genBtn) genBtn.addEventListener('click', function () { self.openMemoirStylePicker(); });

      var cancelBtn = document.getElementById('memoir-style-cancel');
      if (cancelBtn) cancelBtn.addEventListener('click', function () {
        document.getElementById('memoir-style-overlay').classList.remove('active');
      });

      var confirmBtn = document.getElementById('memoir-style-confirm');
      if (confirmBtn) confirmBtn.addEventListener('click', function () {
        if (!self._selectedStyle) return;
        document.getElementById('memoir-style-overlay').classList.remove('active');
        self.generateMemoir(self._selectedStyle);
      });

      var backBtn = document.getElementById('memoir-back-btn');
      if (backBtn) backBtn.addEventListener('click', function () {
        self.closeMemoirReader();
      });

      var editBtn = document.getElementById('memoir-edit-btn');
      if (editBtn) editBtn.addEventListener('click', function () { self.toggleMemoirEdit(); });

      var shareBtn = document.getElementById('memoir-share-btn');
      if (shareBtn) shareBtn.addEventListener('click', function () { self.shareMemoir(); });
    },

    openMemoirStylePicker: function () {
      var user = UserManager.getCurrentUser();
      var stories = (user && user.stories) ? user.stories : [];

      if (stories.length === 0) {
        this.showToast('还没有故事内容，先和AI聊几段回忆吧');
        return;
      }

      var list = document.getElementById('style-list');
      list.innerHTML = '';
      this._selectedStyle = null;

      var self = this;
      this.memoirStyles.forEach(function (style) {
        var card = document.createElement('div');
        card.className = 'style-card';
        card.innerHTML =
          '<div class="style-card-header">' +
          '<span class="style-card-icon">' + style.icon + '</span>' +
          '<span class="style-card-name">' + style.name + '</span>' +
          '</div>' +
          '<div class="style-card-desc">' + style.desc + '</div>' +
          '<div class="style-card-example">' + style.example + '</div>';
        card.addEventListener('click', function () {
          document.querySelectorAll('.style-card').forEach(function (c) { c.classList.remove('selected'); });
          card.classList.add('selected');
          self._selectedStyle = style;
          var btn = document.getElementById('memoir-style-confirm');
          btn.disabled = false;
          btn.style.opacity = '1';
        });
        list.appendChild(card);
      });

      document.getElementById('memoir-style-overlay').classList.add('active');
    },

    generateMemoir: function (style) {
      var self = this;
      var user = UserManager.getCurrentUser();
      var stories = (user && user.stories) ? user.stories : [];

      // 显示加载页
      var overlay = document.getElementById('memoir-reader-overlay');
      var body = document.getElementById('memoir-reader-body');
      var title = document.getElementById('memoir-title');
      title.textContent = (user.name || '我') + '的回忆录';
      body.innerHTML =
        '<div class="memoir-loading">' +
        '<div class="memoir-loading-spinner"></div>' +
        '<div class="memoir-loading-text">正在以「' + style.name + '」风格<br>整理你的回忆录……<br>请稍等片刻</div>' +
        '</div>';
      overlay.classList.add('active');

      // 准备故事素材
      stories.sort(function (a, b) { return parseInt(a.year) - parseInt(b.year); });
      var material = stories.map(function (s) {
        var t = s.year + '年';
        if (s.age) t += '（' + s.age + '）';
        t += '：' + (s.title || '');
        if (s.text) t += '\n' + s.text;
        if (s.quote) t += '\n原文金句：' + s.quote;
        return t;
      }).join('\n\n---\n\n');

      var profile = user.profile || {};
      var profileInfo = '';
      if (user.name) profileInfo += '姓名：' + user.name + '\n';
      if (user.birthYear) profileInfo += '出生年份：' + user.birthYear + '年\n';
      if (profile.hometown) profileInfo += '老家：' + profile.hometown + '\n';
      if (profile.occupation) profileInfo += '职业：' + profile.occupation + '\n';
      if (profile.family) profileInfo += '家庭：' + profile.family + '\n';

      // 构建生成提示词
      var sysPrompt = '你是一位专业的传记作家，擅长用不同的文学风格整理人物回忆录。';
      sysPrompt += '请根据用户提供的回忆素材，用「' + style.name + '」风格写成一篇完整的回忆录。\n\n';
      sysPrompt += '## 文风要求\n';
      sysPrompt += style.desc + '\n';
      sysPrompt += '## 参考范例（体会这种风格的语气和节奏）\n';
      sysPrompt += style.example + '\n\n';
      sysPrompt += '## 写作要求\n';
      sysPrompt += '- 字数1500-3000字\n';
      sysPrompt += '- 以第一人称"我"来写\n';
      sysPrompt += '- 按时间顺序组织内容\n';
      sysPrompt += '- 把碎片化的回忆素材串成连贯的叙事\n';
      sysPrompt += '- 可以适当补充场景细节和感官描写，但不要编造重大事实\n';
      sysPrompt += '- 自然分段，每段2-4句话\n';
      sysPrompt += '- 开头要引人入胜，结尾要有回望人生的感悟\n';
      sysPrompt += '- 不要写小标题，直接正文叙述\n';
      sysPrompt += '- 不要在开头写"以下是回忆录"之类的话\n';

      var userPrompt = '## 人物信息\n' + (profileInfo || '（信息不全）') + '\n\n';
      userPrompt += '## 回忆素材（按时间排序）\n' + material + '\n\n';
      userPrompt += '请用「' + style.name + '」风格，把这些回忆写成一篇完整的回忆录。';

      var apiKey = Settings.data.apiKey;
      if (apiKey) {
        // 有API Key，用LLM生成
        LLMEngine.chat(sysPrompt, [{ role: 'user', content: userPrompt }], function (resp, err) {
          if (err || !resp || !resp.text) {
            // LLM失败，用本地生成
            self.generateMemoirLocal(style, user, stories);
            return;
          }
          self.showMemoirReader(resp.text, style, user);
        });
      } else {
        // 没有API Key，本地生成
        self.generateMemoirLocal(style, user, stories);
      }
    },

    // 本地生成（无API Key时的fallback）
    generateMemoirLocal: function (style, user, stories) {
      var profile = user.profile || {};
      var name = user.name || '我';
      var birthYear = user.birthYear || '';
      var hometown = profile.hometown || '老家';
      var occupation = profile.occupation || '';

      stories.sort(function (a, b) { return parseInt(a.year) - parseInt(b.year); });

      var intro;
      switch (style.key) {
        case 'oral':
          intro = '我叫' + name + '，' + (birthYear ? birthYear + '年生人' : '') + '。';
          if (hometown) intro += '老家在' + hometown + '。';
          intro += '你要是问我这辈子的事，那可得从头说起。\n\n';
          break;
        case 'poetic':
          intro = (birthYear ? birthYear + '年。\n' : '');
          intro += '那是一个' + (hometown ? hometown + '的' : '') + '小村庄。\n';
          intro += '我出生的时候，\n天大概正下着雪。\n\n';
          break;
        case 'humorous':
          intro = '说起我这辈子啊，那可真是"精彩"得没法说。' + (birthYear ? birthYear + '年出生，' : '') + '赶上了好时候也赶上了苦日子。';
          if (occupation) intro += '干了半辈子' + occupation + '，';
          intro += '没攒下什么钱，倒是攒了一肚子故事。\n\n';
          break;
        case 'letter':
          intro = '亲爱的孩子：\n\n你总想听我讲讲过去的事。今天天气好，我就从头说起吧。\n\n我' + (birthYear ? '生于' + birthYear + '年，' : '') + (hometown ? '老家在' + hometown + '。' : '') + '那个年代和现在不一样，日子苦，但也有苦日子的过法。\n\n';
          break;
        case 'cinematic':
          intro = '画面缓缓推近——\n\n一张泛黄的老照片。\n';
          if (birthYear) intro += '照片背面写着：' + birthYear + '年。\n';
          intro += '\n那是我人生的第一幕。\n\n';
          break;
        default:
          intro = (birthYear ? birthYear + '年，' : '') + '我出生在' + (hometown ? hometown + '一个普通的家庭' : '一个普通的家庭') + '。';
          if (occupation) intro += '后来做了' + occupation + '。';
          intro += '这一辈子经历的事，说也说不完，但有些记忆，是怎么也忘不掉的。\n\n';
      }

      // 中间部分：串联故事
      var middle = stories.map(function (s) {
        var line = '';
        if (style.key === 'chronicle') {
          line = '【' + s.year + '年' + (s.age ? '·' + s.age : '') + '】\n';
        }
        if (s.text) {
          line += s.text;
        } else {
          line += s.title || '';
        }
        if (s.quote) {
          line += '\n' + s.quote;
        }
        return line;
      }).join('\n\n');

      // 结尾
      var ending;
      switch (style.key) {
        case 'reflective':
          ending = '\n\n回望这一生，才明白真正留下来的不是什么惊天大事，而是那些微小却温暖的瞬间。它们像星星一样，缀在记忆的天空里，照亮了来时的路。';
          break;
        case 'nostalgic':
          ending = '\n\n有些日子，过去了就再也回不去了。可它们并没有真正消失，只是沉到了心底。等到某个不经意的瞬间，一阵风、一个味道、一首老歌，它们就全涌上来了——那么清晰，又那么遥远。';
          break;
        case 'humorous':
          ending = '\n\n这就是我这一辈子。没什么惊天动地的大事，但每一段都实实在在地过了。你要问我有什么遗憾？遗憾当然有，但要是重来一回，估计还是这么过——谁让我就是个普通人呢。';
          break;
        default:
          ending = '\n\n这就是我的回忆录。平凡的一生，但每一步都是自己走的。写下来，不为别的，就是想让后辈们知道，他们的长辈是怎么过来的。';
      }

      var fullText = intro + middle + ending;
      this.showMemoirReader(fullText, style, user);
    },

    showMemoirReader: function (text, style, user) {
      this._memoirText = text;
      this._memoirStyle = style;
      this._memoirEditing = false;

      var body = document.getElementById('memoir-reader-body');
      body.className = 'memoir-reader-body';
      body.innerHTML = '<div class="memoir-text" id="memoir-text">' + this.escapeHtml(text) + '</div>';

      var title = document.getElementById('memoir-title');
      title.textContent = (user.name || '我') + '的回忆录 · ' + style.name;

      var editBtn = document.getElementById('memoir-edit-btn');
      editBtn.textContent = '编辑';
      editBtn.style.display = '';

      // 保存到本地
      this.saveMemoirToLocal(text, style);
    },

    saveMemoirToLocal: function (text, style) {
      try {
        var user = UserManager.getCurrentUser();
        if (!user.memoirs) user.memoirs = [];
        user.memoirs.unshift({
          id: 'm_' + Date.now(),
          text: text,
          style: style.key,
          styleName: style.name,
          createdAt: Date.now()
        });
        Store.save(UserManager.data);
      } catch (e) {}
    },

    toggleMemoirEdit: function () {
      var textDiv = document.getElementById('memoir-text');
      var editBtn = document.getElementById('memoir-edit-btn');
      var body = document.getElementById('memoir-reader-body');

      if (!this._memoirEditing) {
        // 进入编辑模式
        this._memoirEditing = true;
        textDiv.setAttribute('contenteditable', 'true');
        textDiv.focus();
        body.className = 'memoir-reader-body editing';
        editBtn.textContent = '完成';
      } else {
        // 退出编辑模式，保存
        this._memoirEditing = false;
        this._memoirText = textDiv.innerText;
        textDiv.removeAttribute('contenteditable');
        textDiv.innerHTML = this.escapeHtml(this._memoirText);
        body.className = 'memoir-reader-body';
        editBtn.textContent = '编辑';
        // 更新本地存储
        this.saveMemoirToLocal(this._memoirText, this._memoirStyle);
        this.showToast('已保存');
      }
    },

    shareMemoir: function () {
      var text = this._memoirText || '';
      var user = UserManager.getCurrentUser();
      var title = (user.name || '我') + '的回忆录';

      // 优先用 Web Share API
      if (navigator.share) {
        navigator.share({
          title: title,
          text: text
        }).catch(function () {});
      } else if (navigator.clipboard) {
        // 复制到剪贴板
        navigator.clipboard.writeText(text).then(function () {
          App.showToast('已复制到剪贴板，可以粘贴到微信或朋友圈');
        }, function () {
          App.showToast('复制失败，请手动选择文字复制');
        });
      } else {
        this.showToast('请手动选择文字复制');
      }
    },

    closeMemoirReader: function () {
      document.getElementById('memoir-reader-overlay').classList.remove('active');
    },

    escapeHtml: function (text) {
      if (!text) return '';
      return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>');
    },

    showToast: function (message) {
      var toast = document.getElementById('toast');
      if (!toast) return;
      toast.textContent = message;
      toast.classList.add('show');
      clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2500);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { App.init(); });
  } else {
    App.init();
  }

})();
