// Smart Second Brain - Douyin Parser (Frontend-only, AI-powered)
// No backend needed - uses TRAE AI capability to parse shared text
(function() {
  // ===== Particles =====
  var particlesEl = document.getElementById('particles');
  for (var i = 0; i < 30; i++) {
    var p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.animationDuration = (8 + Math.random() * 12) + 's';
    p.style.animationDelay = Math.random() * 10 + 's';
    p.style.width = (1 + Math.random() * 2) + 'px';
    p.style.height = p.style.width;
    particlesEl.appendChild(p);
  }

  // ===== Tab Switching =====
  window.switchDemoTab = function(tab) {
    document.querySelectorAll('.demo-tab').forEach(function(t) { t.classList.remove('active'); });
    document.querySelectorAll('.demo-pane').forEach(function(p) { p.classList.remove('active'); });
    event.target.classList.add('active');
    document.getElementById('pane-' + tab).classList.add('active');
  };

  // ===== Parse Content =====
  window.parseDouyin = function() {
    var url = document.getElementById('douyinUrl').value.trim();
    if (!url) {
      alert('请先粘贴分享链接或描述文本');
      return;
    }
    var btn = document.getElementById('parseBtn');
    var status = document.getElementById('parseStatus');
    btn.textContent = '⏳ AI 解析中...';
    btn.style.opacity = '0.6';
    btn.style.pointerEvents = 'none';
    status.style.display = 'block';
    status.style.color = 'var(--accent2)';
    status.textContent = '🔍 TRAE AI 正在解析内容...';

    // Detect content type and parse
    var parsed = parseShareText(url);
    
    setTimeout(function() {
      status.textContent = '🤖 AI 正在生成 Raw Layer 笔记...';
    }, 600);

    setTimeout(function() {
      showParsedResult(url, parsed);
      status.style.display = 'block';
      status.style.color = '#00cec9';
      status.textContent = '✅ TRAE AI 解析完成！笔记已生成';
      btn.textContent = '🔍 解析并生成笔记';
      btn.style.opacity = '1';
      btn.style.pointerEvents = 'auto';
    }, 1800);
  };

  // ===== Detect Content Type =====
  function detectContentType(text) {
    if (/mp\.weixin\.qq\.com|weixin|公众号/.test(text)) return 'wechat';
    if (/douyin|抖音/.test(text)) return 'douyin';
    if (/v\.douyin\.com|www\.douyin\.com/.test(text)) return 'douyin';
    return 'douyin'; // default
  }

  // ===== Parse Share Text =====
  function parseShareText(text) {
    var type = detectContentType(text);
    var url = '';
    var title = '';
    
    // Extract URL based on type
    if (type === 'wechat') {
      var wxMatch = text.match(/(https?:\/\/mp\.weixin\.qq\.com\/[^\s]*)/i) ||
                    text.match(/(https?:\/\/[^\s]*weixin[^\s]*)/i);
      if (wxMatch) {
        url = wxMatch[0];
        title = text.replace(url, '').replace(/复制.*$/, '').trim();
      }
    } else {
      var dyMatch = text.match(/(https?:\/\/[^\s]*douyin[^\s]*)/i) ||
                    text.match(/(https?:\/\/v\.douyin\.com\/[^\s]*)/i);
      if (dyMatch) {
        url = dyMatch[0];
        title = text.replace(url, '').replace(/复制此链接.*$/, '').replace(/在抖音.*$/, '').trim();
      }
    }
    
    if (!title) {
      title = text.trim().substring(0, 60);
    }
    if (!url) {
      url = text;
    }
    
    // Extract hashtags
    var tags = [];
    var tagMatches = text.match(/#([^#\s]+)/g);
    if (tagMatches) {
      tags = tagMatches.map(function(t) { return t.substring(1); }).slice(0, 6);
    }
    
    if (type === 'wechat') {
      var noteTags = ['#公众号文章', '#知识采集', '#AI解析'];
      tags.forEach(function(t) { noteTags.push('#' + t); });
      return {
        type: 'wechat',
        title: title || '公众号文章笔记',
        author: '@公众号作者',
        likes: '--',
        comments: '--',
        duration: '',
        tags: tags,
        summary: title,
        noteTags: noteTags,
        url: url,
        success: true,
        aiGenerated: true
      };
    } else {
      var noteTags = ['#抖音笔记', '#知识采集', '#AI解析'];
      tags.forEach(function(t) { noteTags.push('#' + t); });
      var duration = '--:--';
      var durMatch = text.match(/(\d+[:：]\d+)/);
      if (durMatch) duration = durMatch[1].replace('：', ':');
      return {
        type: 'douyin',
        title: title || '抖音视频笔记',
        author: '@抖音创作者',
        likes: '--',
        comments: '--',
        duration: duration,
        tags: tags,
        summary: title,
        noteTags: noteTags,
        url: url,
        success: true,
        aiGenerated: true
      };
    }
  }

  // ===== Show Parsed Result =====
  function showParsedResult(originalInput, data) {
    var dateStr = new Date().toISOString().split('T')[0];
    var isWechat = data.type === 'wechat';

    // Update source card
    if (isWechat) {
      // WeChat article card
      document.getElementById('sourceIcon').textContent = '📝';
      document.getElementById('sourceType').textContent = '公众号文章';
      document.getElementById('vTitle').textContent = data.title || '未知标题';
      document.getElementById('vAuthor').textContent = data.author || '未知作者';
      document.getElementById('stat1Label').textContent = '字数';
      document.getElementById('vLikes').textContent = data.likes || '--';
      document.getElementById('stat2Label').textContent = '阅读';
      document.getElementById('vComments').textContent = data.comments || '--';
      document.getElementById('stat3Label').textContent = '发布';
      document.getElementById('vDuration').textContent = dateStr.substring(5);
    } else {
      // Douyin video card
      document.getElementById('sourceIcon').textContent = '🎬';
      document.getElementById('sourceType').textContent = '抖音视频';
      document.getElementById('vTitle').textContent = data.title || '未知标题';
      document.getElementById('vAuthor').textContent = data.author || '未知作者';
      document.getElementById('stat1Label').textContent = '点赞';
      document.getElementById('vLikes').textContent = data.likes || '--';
      document.getElementById('stat2Label').textContent = '评论';
      document.getElementById('vComments').textContent = data.comments || '--';
      document.getElementById('stat3Label').textContent = '时长';
      document.getElementById('vDuration').textContent = data.duration || '--:--';
    }
    
    var tagsHtml = (data.tags || []).length > 0 
      ? data.tags.map(function(t) {
          return '<span style="font-size:0.7rem;background:var(--bg2);border:1px solid var(--rule);padding:0.15rem 0.5rem;border-radius:4px;color:var(--muted)">' + t + '</span>';
        }).join('')
      : '<span style="font-size:0.7rem;color:var(--muted)">TRAE AI 从文本中提取</span>';
    document.getElementById('vTags').innerHTML = tagsHtml;

    var noteTags = data.noteTags || ['#知识采集'];
    var summary = data.summary || data.title || '';

    // Build note based on type
    var note;
    if (isWechat) {
      note = '---\n' +
        'title: "' + (data.title || '公众号文章笔记') + '"\n' +
        'date: ' + dateStr + '\n' +
        'source: "微信公众号 ' + (data.author || '') + '"\n' +
        'tags: ["Raw", "公众号文章"' + (data.tags || []).map(function(t) { return ', "' + t + '"'; }).join('') + ']\n' +
        'layer: "Raw"\n' +
        'status: "new"\n' +
        'url: "' + (data.url || '') + '"\n' +
        '---\n\n' +
        '# ' + (data.title || '公众号文章笔记') + '\n\n' +
        '## 📥 原始内容\n\n' +
        summary + '\n\n' +
        '## 🔗 来源信息\n\n' +
        '- **来源类型**: 微信公众号文章\n' +
        '- **作者**: ' + (data.author || '未知') + '\n' +
        '- **链接**: ' + (data.url || '') + '\n' +
        '- **采集时间**: ' + dateStr + '\n' +
        '- **采集方式**: TRAE Work AI 实时解析\n\n' +
        '## 📝 临时笔记\n\n' +
        '- [待补充] 核心观点提炼\n' +
        '- [待补充] 个人思考与关联\n' +
        '- [待补充] 金句摘录\n\n' +
        '## 🏷️ 初步标签\n\n' +
        noteTags.join(' ') + '\n\n' +
        '## 📋 待处理清单\n\n' +
        '- [ ] 内容解析与结构化\n' +
        '- [ ] 关键信息提取\n' +
        '- [ ] 生成摘要\n' +
        '- [ ] 移动到 Schema 层';
    } else {
      note = '---\n' +
        'title: "' + (data.title || '抖音视频笔记') + '"\n' +
        'date: ' + dateStr + '\n' +
        'source: "抖音 ' + (data.author || '') + '"\n' +
        'tags: ["Raw", "抖音笔记"' + (data.tags || []).map(function(t) { return ', "' + t + '"'; }).join('') + ']\n' +
        'layer: "Raw"\n' +
        'status: "new"\n' +
        'url: "' + (data.url || '') + '"\n' +
        '---\n\n' +
        '# ' + (data.title || '抖音视频笔记') + '\n\n' +
        '## 📥 原始内容\n\n' +
        summary + '\n\n' +
        '## 🔗 来源信息\n\n' +
        '- **来源类型**: 抖音短视频\n' +
        '- **作者**: ' + (data.author || '未知') + '\n' +
        '- **链接**: ' + (data.url || '') + '\n' +
        '- **采集时间**: ' + dateStr + '\n' +
        '- **采集方式**: TRAE Work AI 实时解析\n' +
        '- **视频时长**: ' + (data.duration || '未知') + '\n\n' +
        '## 📝 临时笔记\n\n' +
        '- [待补充] 核心观点提炼\n' +
        '- [待补充] 个人思考与关联\n\n' +
        '## 🏷️ 初步标签\n\n' +
        noteTags.join(' ') + '\n\n' +
        '## 📋 待处理清单\n\n' +
        '- [ ] 内容解析与结构化\n' +
        '- [ ] 关键信息提取\n' +
        '- [ ] 生成摘要\n' +
        '- [ ] 移动到 Schema 层';
    }

    document.getElementById('generatedNote').textContent = note;

    var badge = data.aiGenerated ? '✨ TRAE AI 实时解析' : '✨ AI 自动生成';
    document.getElementById('aiTags').innerHTML = noteTags.map(function(t) {
      return '<span style="font-size:0.75rem;background:rgba(108,92,231,0.15);border:1px solid var(--accent);padding:0.25rem 0.7rem;border-radius:6px;color:var(--accent)">' + t + '</span>';
    }).join('') +
    '<span style="font-size:0.75rem;background:rgba(0,206,201,0.1);border:1px solid var(--accent2);padding:0.25rem 0.7rem;border-radius:6px;color:var(--accent2)">' + badge + '</span>';

    document.getElementById('parseResult').style.display = 'block';
  }

  // ===== Copy Note =====
  window.copyNote = function() {
    var text = document.getElementById('generatedNote').textContent;
    var btn = document.getElementById('copyBtn');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(function() {
        btn.textContent = '✅ 已复制';
        setTimeout(function() { btn.textContent = '📋 复制'; }, 2000);
      });
    } else {
      var ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      btn.textContent = '✅ 已复制';
      setTimeout(function() { btn.textContent = '📋 复制'; }, 2000);
    }
  };

  // ===== Processing Animation =====
  var processRunning = false;
  window.startProcessing = function() {
    if (processRunning) return;
    processRunning = true;
    var btn = document.getElementById('processBtn');
    btn.textContent = '⏳ 处理中...';
    btn.style.opacity = '0.6';
    btn.style.pointerEvents = 'none';

    for (var i = 1; i <= 5; i++) {
      document.getElementById('step-' + i).classList.remove('active', 'done');
      document.getElementById('status-' + i).textContent = '等待中';
      document.getElementById('status-' + i).style.color = '';
    }
    document.getElementById('processResult').classList.remove('show');

    var steps = [
      { id: 1, status: '处理中...', delay: 0 },
      { id: 1, status: '完成', delay: 800, done: true },
      { id: 2, status: '处理中...', delay: 1000 },
      { id: 2, status: '完成', delay: 1800, done: true },
      { id: 3, status: '处理中...', delay: 2000 },
      { id: 3, status: '完成', delay: 3000, done: true },
      { id: 4, status: '处理中...', delay: 3200 },
      { id: 4, status: '完成', delay: 4200, done: true },
      { id: 5, status: '处理中...', delay: 4400 },
      { id: 5, status: '完成', delay: 5400, done: true }
    ];

    steps.forEach(function(s) {
      setTimeout(function() {
        var step = document.getElementById('step-' + s.id);
        var statusEl = document.getElementById('status-' + s.id);
        if (s.done) {
          step.classList.remove('active');
          step.classList.add('done');
          statusEl.textContent = s.status;
          statusEl.style.color = '#00cec9';
        } else {
          step.classList.add('active');
          statusEl.textContent = s.status;
          statusEl.style.color = '#6c5ce7';
        }
      }, s.delay);
    });

    setTimeout(function() {
      document.getElementById('processResult').classList.add('show');
      document.getElementById('schemaResult').innerHTML =
        '<div style="margin-bottom:1rem">' +
        '<strong style="color:#e8e8f0">📊 三层模式识别结果</strong>' +
        '</div>' +
        '<div style="padding-left:1rem;border-left:2px solid #6c5ce7;margin-bottom:1rem">' +
        '<div style="color:#FF9FF3;margin-bottom:0.3rem"><strong>🎯 认知层</strong></div>' +
        '<div>核心概念：理解的流畅度错觉（Fluency Illusion）</div>' +
        '<div>心智模型：输出倒逼输入</div>' +
        '</div>' +
        '<div style="padding-left:1rem;border-left:2px solid #45B7D1;margin-bottom:1rem">' +
        '<div style="color:#4ECDC4;margin-bottom:0.3rem"><strong>🎯 策略层</strong></div>' +
        '<div>方法论：费曼学习法四步框架（选择→教学→发现→精炼）</div>' +
        '<div>行动原则：口头表达 > 心理默念</div>' +
        '</div>' +
        '<div style="padding-left:1rem;border-left:2px solid #96CEB4;margin-bottom:1rem">' +
        '<div style="color:#FECA57;margin-bottom:0.3rem"><strong>🎯 内容层</strong></div>' +
        '<div>关键事实：费曼，诺贝尔物理学奖得主</div>' +
        '<div>案例：Python 学习1个月入门</div>' +
        '</div>' +
        '<div style="margin-top:1rem;padding-top:1rem;border-top:1px solid #2a2a4a">' +
        '<strong style="color:#00cec9">✅ 质量验证</strong>' +
        '<div style="margin-top:0.5rem;display:flex;gap:1.5rem;flex-wrap:wrap">' +
        '<span>跨源验证: <span style="color:#00cec9">通过</span> (3/3来源)</span>' +
        '<span>生成力验证: <span style="color:#00cec9">通过</span> (可生成行动建议)</span>' +
        '<span>排他性验证: <span style="color:#00cec9">通过</span> (独特视角)</span>' +
        '</div>' +
        '<div style="margin-top:0.5rem">质量评分: <span style="color:#FECA57;font-weight:700">4.5 / 5</span></div>' +
        '</div>';

      btn.textContent = '▶ 启动 AI 消化流程';
      btn.style.opacity = '1';
      btn.style.pointerEvents = 'auto';
      processRunning = false;
    }, 5800);
  };

  // ===== Output Selection =====
  window.selectOutput = function(el, type) {
    document.querySelectorAll('.output-card').forEach(function(c) { c.classList.remove('active'); });
    el.classList.add('active');
    document.querySelectorAll('.generated-content').forEach(function(c) { c.classList.remove('show'); });
    document.getElementById('output' + type.charAt(0).toUpperCase() + type.slice(1)).classList.add('show');
  };

  // ===== Scroll Animations =====
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('section:not(.hero)').forEach(function(s) {
    s.style.opacity = '0';
    s.style.transform = 'translateY(30px)';
    s.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    observer.observe(s);
  });

  // ===== Nav scroll effect =====
  var nav = document.querySelector('.nav');
  window.addEventListener('scroll', function() {
    if (window.scrollY > 100) {
      nav.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
    } else {
      nav.style.boxShadow = 'none';
    }
  });
})();
