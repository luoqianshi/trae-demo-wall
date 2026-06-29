/* =========================================================
   《你好，我的思念》共享数据：5 案例 + 跨页 localStorage
   - 供各页面引用同一份案例库
   - 翻译页生成的家庭对话卡存到 STORAGE.card
   - 记录页添加的回忆存到 STORAGE.memory
   ========================================================= */

(function () {
  'use strict';

  var CASES = [
    {
      id: 'grandma-phone', tag: '奶奶 → 孙女 · 手机与实习', role: 'elder',
      raw: '奶奶总说：「你怎么天天抱着手机？眼睛不要了？跟你说多少遍了就是不听。」我知道她是关心我，但听起来很烦。今天我其实是在手机上查实习资料，投了三份简历，只是没有告诉她。',
      care: '奶奶不是想否定你，她可能是在担心你的眼睛、作息和身体，也担心自己说的话已经不被你需要。',
      gentle: '我有点担心你看手机太久会累到眼睛。你能不能休息一会儿？我不是想管你，我只是希望你身体好一点。',
      reply: '奶奶，我知道你是担心我。你这样说我会有点烦，但我会休息一下。以后你可以直接说你担心我的眼睛，我会更愿意听。',
      memoryHook: '我今天投了三份实习简历，有点紧张，也有点期待。',
      tags: ['奶奶', '手机', '健康担心', '语气刺耳'],
      memoryNote: 'AI 帮奶奶看到：孩子不是一直玩手机，也在认真为未来努力。',
      futureEcho: '一年后，这条记录会变成「你第一次认真找实习的那段时间」，成为家庭时间线里一段可以回看的思念。'
    },
    {
      id: 'mom-postgrad', tag: '妈妈 → 女儿 · 考研与工作', role: 'elder',
      raw: '妈妈：「考不上就去考公，别折腾了，女孩子家考个稳定的就够了。」每次回家都在讲。我其实在准备跨专业考研，已经复习了三个月，每次想解释她都不愿意听。',
      care: '妈妈不是否定你的努力，她是在用她能想到的最"安全"的方式替你规划未来，也怕你考完一场空。',
      gentle: '我知道你最近很努力地准备考试，我不太懂你选的方向，但我希望你走的路是你自己喜欢的，也是你准备好了再走的。',
      reply: '妈，我理解你担心我考不上。我会认真评估自己的状态，如果决定考我会全力以赴，如果换方向也会想清楚。能不能让我自己做完这次决定，再把结果告诉你？',
      memoryHook: '我今天整理完了一轮专业课笔记，啃完了一个难点，第一次觉得自己可能真的可以。',
      tags: ['妈妈', '考研', '未来规划', '代际期待'],
      memoryNote: 'AI 帮妈妈看到：孩子不是不听话，是在认真选择自己的人生。',
      futureEcho: '一年后，这条记录会变成「你第一次为自己的人生做主的那段日子」。'
    },
    {
      id: 'dad-faraway', tag: '爸爸 → 儿子 · 远方与家乡', role: 'elder',
      raw: '爸爸：「非要跑那么远，家里不好吗？养你这么大白养了。」我想去南方工作，他觉得去太远就是不认家。我其实也想家，只是想趁年轻多看看。',
      care: '爸爸不是真的反对你走远，他是在用"责备"的方式表达"我会想你"，也担心自己年纪大了你走远就难见面。',
      gentle: '我其实不是不想留在家，是怕你走太远我们见面少了。我知道你长大了，但家里这盏灯还是给你留着的。',
      reply: '爸，我懂你的意思。我不是不认家，是想先出去试试。我会常回来，也会把路上看到的事讲给你听。等我在外面稳下来，我带你和我妈一起出去玩。',
      memoryHook: '今天爸爸难得没说话，只问我吃了没。我想他也在学着用新方式表达。',
      tags: ['爸爸', '远方', '不舍', '保护欲'],
      memoryNote: 'AI 帮儿子看到：父亲的"白养了"，其实是一句没说出口的"我会想你"。',
      futureEcho: '一年后，这条记录会变成「你第一次听见父亲说软话的那顿晚饭」。'
    },
    {
      id: 'fatherinlaw-cook', tag: '岳父 → 女婿 · 习惯与心疼', role: 'elder',
      raw: '岳父：「一个男人连饭都不会做，我女儿嫁给你图什么？」每次去岳父家吃饭都提这事。我其实会做，只是没有他做得熟练，怕做不好被嫌弃。',
      care: '岳父不是真的嫌弃你，他是在用挑剔的方式心疼女儿，也希望女儿在你那里生活得"被照顾好"。',
      gentle: '我不是真的嫌弃你不会做，我是怕我女儿太累。你愿意学着做，已经很好了，能不能让我女儿也学着分担一些？',
      reply: '爸，我知道你是心疼小羽。我最近在认真学做饭了，不是为了证明什么，是想让她回家能吃上一口热的。下次我做给你们尝尝，您给我指点指点。',
      memoryHook: '今天第一次独立做完三菜一汤，小羽拍了照发给爸妈。',
      tags: ['岳父', '家务', '心疼女儿', '语言习惯'],
      memoryNote: 'AI 帮女婿看到：挑剔背后，是父亲怕女儿受苦的本能。',
      futureEcho: '一年后，这条记录会变成「你被岳父第一次夹菜的那顿家宴」。'
    },
    {
      id: 'grandma-presence', tag: '姥姥 → 外孙 · 陪伴与手机', role: 'elder',
      raw: '姥姥：「跟你说话心不在焉，跟手机过一辈子算了。」每次回家都这么讲。我其实是工作压力大，回家只想安静刷一会儿，但姥姥觉得我嫌弃她。',
      care: '姥姥不是真的想没收你的手机，她是在用抱怨表达"我怕你不再需要我"，也想多点陪伴。',
      gentle: '我不是想管你玩手机，我是怕你累的时候一个人扛着不跟我说。下次回家能不能先陪我坐十分钟，再去玩手机？',
      reply: '姥姥，我没有嫌弃你。我只是上班太累，回家想放空一下。下次回家我先陪你聊天，再处理工作的事。你想聊什么我都可以听。',
      memoryHook: '今天姥姥跟我讲了年轻时候下放的事，第一次讲了那么久，我没刷手机。',
      tags: ['姥姥', '陪伴', '怕不被需要', '工作压力'],
      memoryNote: 'AI 帮年轻人看到：姥姥的"埋怨"，是想多陪你坐一会儿的"请求"。',
      futureEcho: '一年后，这条记录会变成「你第一次完整听姥姥讲完那段下放的下午」。'
    }
  ];

  function extractKeywords(text) {
    var t = text;
    var tags = [];
    var feel = '担心', care = '关心', careBody = '我希望你过得好';
    var softOpen = '不是想让你为难';

    if (/手机|刷|抖音|微信/.test(t)) { tags.push('手机'); feel = '担心'; care = '健康与陪伴'; careBody = '我担心你看屏幕太久，也怕我被晾在一边'; }
    else if (/考|考研|工作|前途|未来|稳定/.test(t)) { tags.push('未来规划'); feel = '焦虑'; care = '希望你有保障'; careBody = '我希望你走的路稳一点，也别太累着自己'; }
    else if (/远|走|去外|不在家|白养|不回来/.test(t)) { tags.push('远方'); feel = '不舍'; care = '怕失去联络'; careBody = '我怕你走太远、见面变少，但我又想让你去'; }
    else if (/饭|做菜|家务|累|辛苦/.test(t)) { tags.push('家务'); feel = '心疼'; care = '怕家人受苦'; careBody = '我不是在挑剔，是怕她/他太累'; }
    else if (/陪|说话|心不在焉|嫌弃|不理/.test(t)) { tags.push('陪伴'); feel = '失落'; care = '想被需要'; careBody = '我只是想你多陪我坐一会儿'; }
    else if (/钱|乱花|省钱|贵/.test(t)) { tags.push('消费观'); feel = '心疼'; care = '怕你受苦'; careBody = '我怕你以后手头紧，也想教你过紧日子'; }
    else if (/婚|对象|朋友|社交/.test(t)) { tags.push('婚恋'); feel = '着急'; care = '想让你有依靠'; careBody = '我希望你身边有个能照顾你的人'; }
    else { tags.push('日常'); feel = '担心'; care = '关心'; careBody = '我希望你过得好，也愿意听你说'; }

    return { feel: feel, care: care, careBody: careBody, softOpen: softOpen, tags: tags };
  }

  function buildFromFreeText(text, role) {
    var t = (text || '').trim();
    var isElder = role === 'elder';
    var isShort = t.length < 8;
    if (isShort) {
      return {
        care: '这句话里可能有还没说出口的情绪，值得把它说完整。',
        gentle: isElder
          ? '我想告诉你我真实的想法：我可能不是在责怪你，只是不知道怎么说才好。'
          : '我想让你知道我不是在顶嘴，我只是希望你能听我说完。',
        reply: isElder
          ? '我愿意坐下来好好听你说，你慢慢讲，我不会打断。'
          : '我听到了。我会认真想你说的话，也想把我自己的感受慢慢说给你听。',
        memoryHook: '今天记下了一句话，留给以后回看。',
        memoryNote: 'AI 提示：原话太短，AI 只能做"轻识别"，未来可结合语音和上下文增强。',
        futureEcho: '一个月后，这条记录会变成「那天我们第一次认真说话」的开头。',
        tags: ['自由输入', '短句识别', '轻量翻译']
      };
    }
    var k = extractKeywords(t);
    return {
      care: (isElder
        ? 'TA 不是在否定你，TA 可能是在用' + k.feel + '的方式表达' + k.care + '。'
        : '这句话里有没说完的' + k.feel + '，也藏着你希望被听懂的' + k.care + '。'),
      gentle: isElder
        ? '我其实' + k.softOpen + '，我只是想让你知道：' + k.careBody + '。'
        : '我听见了你说的话，我也想说：' + k.careBody + '。',
      reply: isElder
        ? '我听见了。我会好好想你说的话，也想把我自己的感受慢慢说给你听。'
        : '我懂你的担心，我会认真想这件事。下次我们可以坐下来把话说完整。',
      memoryHook: isElder
        ? '今天我试着把一句刺耳的话重新说了一遍。'
        : '今天我记录了一句想说但没说出口的话。',
      memoryNote: 'AI 帮对方看到：这句话背后有没说出口的' + k.care + '。',
      futureEcho: '一段时间后，这条记录会变成「我们第一次认真翻译彼此」的那天。',
      tags: ['自由输入', 'AI 改写', '家庭对话卡'].concat(k.tags || [])
    };
  }

  /* ===== localStorage 跨页数据 ===== */
  var STORAGE = {
    card: 'hml_card',
    memory: 'hml_memory',
    case: 'hml_case',
    role: 'hml_role',
    lastRaw: 'hml_lastRaw'
  };

  function loadJSON(key) {
    try {
      var s = localStorage.getItem(key);
      return s ? JSON.parse(s) : null;
    } catch (e) { return null; }
  }
  function saveJSON(key, v) {
    try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {}
  }
  function nowStamp() {
    var d = new Date();
    var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  function futureStamp(monthsLater) {
    var d = new Date();
    d.setMonth(d.getMonth() + monthsLater);
    var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        if (window.__showToast) window.__showToast('已复制到剪贴板');
      }, function () { fallbackCopy(text); });
    } else {
      fallbackCopy(text);
    }
  }
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); if (window.__showToast) window.__showToast('已复制到剪贴板'); }
    catch (e) { if (window.__showToast) window.__showToast('复制失败，请手动选择'); }
    document.body.removeChild(ta);
  }
  function exportText(filename, text) {
    var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function buildResult(caseIndex, role, rawText) {
    var c = CASES[caseIndex] || CASES[0];
    var role_ = role || c.role;
    var isPreset = !rawText || rawText.trim() === '' || rawText === c.raw;
    if (isPreset) {
      return {
        source: 'case',
        caseIndex: caseIndex,
        role: role_,
        raw: c.raw,
        care: c.care,
        gentle: c.gentle,
        reply: c.reply,
        memoryHook: c.memoryHook,
        memoryNote: c.memoryNote,
        futureEcho: c.futureEcho,
        tags: c.tags,
        title: c.tag
      };
    }
    var free = buildFromFreeText(rawText, role_);
    return {
      source: 'free',
      caseIndex: caseIndex,
      role: role_,
      raw: rawText,
      care: free.care,
      gentle: free.gentle,
      reply: free.reply,
      memoryHook: free.memoryHook,
      memoryNote: free.memoryNote,
      futureEcho: free.futureEcho,
      tags: free.tags,
      title: '自由输入'
    };
  }

  function renderResultInline(area, r) {
    area.classList.remove('placeholder');
    var tagsHtml = r.tags.map(function (t) { return '<span class="tag" style="display:inline-flex;padding:.2rem .55rem;border-radius:999px;border:1px solid var(--rule);background:color-mix(in srgb, var(--bg2) 80%, transparent);color:var(--muted);font-size:.78rem;margin-right:.25rem">' + escapeHtml(t) + '</span>'; }).join('');
    var html = ''
      + '<div class="result-block" style="animation: fadeUp .55s ease both;">'
      +   '<span class="result-label">原话</span>'
      +   '<div class="result-text">' + escapeHtml(r.raw) + '</div>'
      + '</div>'
      + '<div class="result-block" style="animation: fadeUp .55s ease .12s both;">'
      +   '<span class="result-label">原话背后的关心</span>'
      +   '<div class="result-text"><mark class="key">' + escapeHtml(r.care) + '</mark></div>'
      + '</div>'
      + '<div class="result-block" style="animation: fadeUp .55s ease .24s both;">'
      +   '<span class="result-label">温柔改写</span>'
      +   '<div class="result-text serif quote-text">' + escapeHtml(r.gentle) + '</div>'
      + '</div>'
      + '<div class="result-block" style="animation: fadeUp .55s ease .36s both;">'
      +   '<span class="result-label">推荐回应</span>'
      +   '<div class="response-bubble">'
      +     escapeHtml(r.reply)
      +     '<small>AI 建议：先承认关心，再表达边界。</small>'
      +   '</div>'
      + '</div>'
      + '<div class="dialogue-card" style="animation: fadeUp .55s ease .48s both;">'
      +   '<div class="row"><span class="k">原话</span><span class="v">' + escapeHtml(r.raw) + '</span></div>'
      +   '<div class="row"><span class="k">真实关心</span><span class="v">' + escapeHtml(r.care) + '</span></div>'
      +   '<div class="row"><span class="k">温柔版</span><span class="v serif">' + escapeHtml(r.gentle) + '</span></div>'
      +   '<div class="row"><span class="k">推荐回应</span><span class="v">' + escapeHtml(r.reply) + '</span></div>'
      +   '<div class="row"><span class="k">日常记录</span><span class="v">' + escapeHtml(r.memoryHook) + '</span></div>'
      +   '<div class="row"><span class="k">未来回忆</span><span class="v serif">' + escapeHtml(r.futureEcho) + '</span></div>'
      + '</div>'
      + '<div class="card-actions" style="animation: fadeUp .55s ease .6s both;">'
      +   '<a class="micro-btn primary" href="./page-card.html" data-act="view-card">查看完整对话卡 →</a>'
      +   '<button class="micro-btn" data-act="copy" type="button">复制对话卡</button>'
      +   '<button class="micro-btn" data-act="export" type="button">导出为文本</button>'
      +   '<button class="micro-btn" data-act="memory" type="button">加入思念回忆</button>'
      +   tagsHtml
      + '</div>';
    area.innerHTML = html;
    area.querySelectorAll('[data-act]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var act = btn.getAttribute('data-act');
        if (act === 'view-card') {
          saveJSON(STORAGE.card, r);
          window.location.href = './page-card.html';
          return;
        }
        if (act === 'copy') {
          var t = '【家庭对话卡】\n原话：' + r.raw + '\n真实关心：' + r.care + '\n温柔改写：' + r.gentle + '\n推荐回应：' + r.reply + '\n日常记录：' + r.memoryHook + '\n未来回忆：' + r.futureEcho;
          copyText(t);
        } else if (act === 'export') {
          var text = '《你好，我的思念》· 家庭对话卡\n\n原话：' + r.raw + '\n\n真实关心：' + r.care + '\n\n温柔改写：' + r.gentle + '\n\n推荐回应：' + r.reply + '\n\n日常记录：' + r.memoryHook + '\n\n未来回忆：' + r.futureEcho + '\n\n—— 由《你好，我的思念》Demo 生成';
          exportText('family-card-' + Date.now() + '.txt', text);
          if (window.__showToast) window.__showToast('已导出为文本文件');
        } else if (act === 'memory') {
          addMemoryItem({
            time: nowStamp(),
            who: r.role === 'elder' ? '家人' : '我',
            raw: r.raw,
            summary: (r.care || '') + ' / 温柔版：' + r.gentle,
            future: r.futureEcho,
            horizon: 'today'
          });
          if (window.__showToast) window.__showToast('已加入家庭时间线');
        }
      });
    });
  }

  function addMemoryItem(opts) {
    var list = loadJSON(STORAGE.memory) || [];
    var item = {
      id: 'mem-' + Date.now() + '-' + Math.floor(Math.random() * 9999),
      time: opts.time || nowStamp(),
      who: opts.who || '家人',
      raw: opts.raw || '',
      summary: opts.summary || '',
      future: opts.future || '未来某天，这段记录会成为思念的证据。',
      horizon: opts.horizon || 'today'
    };
    list.unshift(item);
    saveJSON(STORAGE.memory, list);
  }

  function getMemoryList() {
    return loadJSON(STORAGE.memory) || [];
  }

  function getCurrentCard() {
    return loadJSON(STORAGE.card);
  }

  function setCurrentCard(r) { saveJSON(STORAGE.card, r); }

  /* 暴露到全局 */
  window.HML = {
    CASES: CASES,
    STORAGE: STORAGE,
    buildResult: buildResult,
    renderResultInline: renderResultInline,
    addMemoryItem: addMemoryItem,
    getMemoryList: getMemoryList,
    getCurrentCard: getCurrentCard,
    setCurrentCard: setCurrentCard,
    copyText: copyText,
    exportText: exportText,
    extractKeywords: extractKeywords,
    nowStamp: nowStamp,
    futureStamp: futureStamp,
    escapeHtml: escapeHtml,
    FEED: getFeed(),
    PAST_TODAY: getPastToday(),
    REMEMBRANCE: getRemembrance()
  };

  /* ============ 家庭 Feed 流（类朋友圈）============ */
  function getFeed() {
    return [
      {
        id: 'p1', who: '奶奶', avatar: '奶',
        time: '2 小时前 · 2026-06-27 09:30',
        type: 'photo', mediaCaption: '阳台上的月季今年开得最好',
        text: '今早给月季浇水，发现今年开得最好的一朵比拳头还大。想拍给孙女看，又怕她上班忙。',
        aiSummary: 'AI 摘要：奶奶在向你分享日常小幸福',
        tags: ['#日常', '#奶奶说']
      },
      {
        id: 'p2', who: '妈妈', avatar: '妈',
        time: '昨天 21:12',
        type: 'video', mediaCaption: '爸爸唱歌视频 · 0:23',
        text: '爸今天突然自己唱了一首老歌，我没听过他唱。录下来了。',
        aiSummary: 'AI 摘要：来自已故亲人的动态影像复刻',
        tags: ['#视频', '#回忆', '#已故']
      },
      {
        id: 'p3', who: '我（孙女）', avatar: '孙',
        time: '3 天前',
        type: 'text', mediaCaption: '',
        text: '今天下班路上看到一棵银杏树，黄得不像真的。想奶奶。',
        aiSummary: 'AI 摘要：触发 3 年前的今天 · 银杏叶上传',
        tags: ['#情绪', '#银杏']
      },
      {
        id: 'p4', who: '爷爷', avatar: '爷',
        time: '2018-11-04',
        type: 'photo', mediaCaption: '孙女第一次会走路',
        text: '（补录）2018 年 11 月 4 日，孙女第一次会走路。',
        aiSummary: 'AI 补录：自动识别拍摄时间与人物',
        tags: ['#补录', '#老照片']
      }
    ];
  }

  /* ============ 过去的今天 引擎 ============ */
  function getPastToday() {
    // 仅在数据里查找"今天日期范围内"的历史条目
    var today = new Date();
    var mm = today.getMonth() + 1;
    var dd = today.getDate();
    var samples = [
      {
        matchDate: '2023-06-27',
        yearsAgo: 3,
        who: '奶奶',
        avatar: '奶',
        text: '今天在阳台上给月季剪枝。想着孙女小时候也常在阳台玩。',
        aiEcho: '那年你也在这棵月季旁拍过照。',
        type: 'photo',
        hint: 'AI 从历史发布中提取「同月份、同主题」的回忆。'
      },
      {
        matchDate: '2024-11-04',
        yearsAgo: 2,
        who: '爷爷',
        avatar: '爷',
        text: '今天给孙女录了一段话，让她以后想爷爷了就放。',
        aiEcho: '那段录音已经被你标记为「常听」。',
        type: 'video',
        hint: 'AI 识别到同日同人物的视频，自动生成「那年的今天」。'
      }
    ];
    // 简化演示：固定返回 2 条
    return samples;
  }

  /* ============ 思念复刻 Demo 素材 ============ */
  function getRemembrance() {
    return {
      grandfather: {
        name: '爷爷',
        who: '孙子',
        avatar: '孙',
        learnFrom: [
          '2017-2023 年微信聊天记录 2,143 条',
          '生前视频素材 18 段（合计 2.4 小时）',
          '家庭照片 326 张',
          '录音素材 6 段（合计 38 分钟）'
        ],
        photos: [
          { caption: '2008 年·爷爷在院子里浇花', yearsAgo: 18 },
          { caption: '2015 年·春节全家福', yearsAgo: 11 },
          { caption: '2021 年·最后一次视频通话', yearsAgo: 5 }
        ],
        dialogue: [
          { side: 'live', text: '爷爷，我想你了。' },
          { side: 'departed', text: '孩子，爷爷也一直在。你小时候最爱吃的红烧肉，爷爷把方子写进了柜子里那本老菜谱，你去找找。' },
          { side: 'live', text: '我找到了。我按你写的做了一次，但是没你做得好。' },
          { side: 'departed', text: '哈哈，慢慢来。爷爷当年也烧糊过三回锅。' },
          { side: 'live', text: '我们都很想你。' },
          { side: 'departed', text: '爷爷知道。家里那盏灯，记得常亮。' }
        ]
      }
    };
  }
})();

