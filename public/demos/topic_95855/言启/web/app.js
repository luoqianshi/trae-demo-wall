(function() {
  const CONFIG = {
    DEEPSEEK_API_KEY: 'sk-YOUR_API_KEY_HERE',
    DEEPSEEK_API_URL: 'https://api.deepseek.com/v1/chat/completions',
    DEEPSEEK_MODEL: 'deepseek-chat',
    CHARS_PER_SECOND: 3.5,
    MIN_ANSWER_CHARS: 8,
    DEFAULT_QUESTIONS_PER_SESSION: 5
  };

  let ttsUtterance = null; let ttsSpeaking = false;
  function stopSpeaking() { stopSpeak(); }
  function stopSpeak() {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      state.isSpeaking = false;
      ttsSpeaking = false;
    } catch (e) { state.isSpeaking = false; ttsSpeaking = false; }
  }
  function stripMarkdownForSpeech(text) {
    if (!text) return '';
    return String(text)
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      .replace(/~~([^~]+)~~/g, '$1')
      .replace(/^\s{0,3}#{1,6}\s+/gm, '')
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      .replace(/>\s?/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function speakQuestion(text, onEnd, voiceConfig) {
    if (!state.settings.autoReadQuestion) { if (onEnd) setTimeout(onEnd, 300); return; }
    if (!('speechSynthesis' in window)) { if (onEnd) setTimeout(onEnd, 300); return; }
    stopSpeaking();
    ttsSpeaking = true;
    state.isSpeaking = true;
    render();
    const isEn = isEnglishQuestion(text);
    const vc = voiceConfig || (state.chat && (state.chat.quickVoice || (state.chat.sceneId ? (SCENES.find(s => s.id === state.chat.sceneId)?.voice) : null)));
    let _beginPrompt='。请考生开始作答。';if(!isEn){const _cs=state.chat?.sceneId;const _iqp=state.chat?.isQuickPractice;if(_cs===7){_beginPrompt='。请小朋友开始回答~';}else if(_cs===5){_beginPrompt='。请开始你的演讲。';}else if(_iqp){_beginPrompt='。请开始作答。';}}const prompt = isEn ? ' Please begin your answer.' : _beginPrompt;
    const fullText = stripMarkdownForSpeech(text) + prompt;
    const utter = new SpeechSynthesisUtterance(fullText);
    utter.lang = isEn ? 'en-US' : 'zh-CN';
    if (vc && !isEn) {
      utter.rate = vc.rate || 0.95;
      utter.pitch = vc.pitch || 1.05;
    } else {
      utter.rate = isEn ? 0.95 : (getSpeechRate ? getSpeechRate() : 0.9);
      utter.pitch = 1.05;
    }
    utter.volume = 1;
    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (isEn) {
        const enFemale = voices.find(v => v.lang.startsWith('en') && /female|woman|samantha|zira|google us english/i.test(v.name));
        const enMale = voices.find(v => v.lang.startsWith('en') && /male|man|david|mark|daniel/i.test(v.name));
        if (vc?.gender === 'male' && enMale) return enMale;
        return enFemale || voices.find(v => v.lang.startsWith('en-US')) || voices.find(v => v.lang.startsWith('en'));
      }
      if (vc && vc.name) {
        const patterns = vc.name.split('|');
        for (const p of patterns) {
          const found = voices.find(v => v.lang.startsWith('zh') && v.name.toLowerCase().includes(p.toLowerCase()));
          if (found) return found;
        }
        if (vc.gender === 'male') {
          const maleV = voices.find(v => v.lang.startsWith('zh') && /male|yunyang|yunjian|kangkang|yunxi/i.test(v.name));
          if (maleV) return maleV;
        } else {
          const femaleV = voices.find(v => v.lang.startsWith('zh') && /female|女|xiaoxiao|huihui|yaoyao|xiaomo/i.test(v.name));
          if (femaleV) return femaleV;
        }
      }
      return voices.find(v => v.lang.startsWith('zh-CN')) || voices.find(v => v.lang.startsWith('zh'));
    };
    const setVoice = () => { const v = pickVoice(); if (v) utter.voice = v; };
    setVoice();
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => { setVoice(); window.speechSynthesis.onvoiceschanged = null; };
    }
    const finish = () => {
      ttsSpeaking = false; state.isSpeaking = false; render();
      if (onEnd) setTimeout(onEnd, 200);
    };
    utter.onend = finish;
    utter.onerror = finish;
    ttsUtterance = utter;
    try { window.speechSynthesis.speak(utter); } catch(e) { finish(); if (onEnd) onEnd(); }
    if (onEnd) {
      const estDuration = Math.max(5000, fullText.length * (isEn?90:280));
      setTimeout(() => { if (ttsSpeaking) finish(); }, estDuration + 3000);
    }
  }
  function isEnglishQuestion(text) {
    const ascii = (text.match(/[a-zA-Z]/g) || []).length;
    return ascii > text.length * 0.5;
  }
  function replayQuestion() {
    if (!state.chat) return;
    const lastQ = [...state.chat.messages].reverse().find(m => m.role === 'assistant');
    if (lastQ) {
      SFX.click();
      speakQuestion(lastQ.content, null);
    }
  }
  function celebrate(type='success') {
    try {
      const colors = type === 'levelup' ? ['#ffd700','#f4a261','#e76f51','#52b788','#74c0fc','#be78ff'] :
                     type === 'checkin' ? ['#f4a261','#e76f51','#ffd700','#52b788','#ff8fab'] :
                     ['#f4a261','#52b788','#74c0fc','#e9c46a'];
      const container = document.createElement('div');
      container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:99999;overflow:hidden;';
      document.body.appendChild(container);
      for (let i = 0; i < (type==='levelup'?80:50); i++) {
        const el = document.createElement('div');
        const size = 6 + Math.random()*10;
        const color = colors[Math.floor(Math.random()*colors.length)];
        const left = Math.random()*100;
        const delay = Math.random()*0.5;
        const dur = 2 + Math.random()*2;
        const shape = Math.random() > 0.5 ? '50%' : '2px';
        el.style.cssText = `position:absolute;left:${left}%;top:-20px;width:${size}px;height:${size}px;background:${color};border-radius:${shape};opacity:${0.7+Math.random()*0.3};animation:confetti-fall ${dur}s ${delay}s ease-in forwards;`;
        container.appendChild(el);
      }
      setTimeout(() => container.remove(), 4500);
    } catch(e) {}
  }

  function speakPromptThenAnswer(prompt, onStartAnswer) {
    if (!state.settings.autoReadQuestion || !('speechSynthesis' in window)) { if (onStartAnswer) setTimeout(onStartAnswer, 500); return; }
    stopSpeaking();
    const utter = new SpeechSynthesisUtterance(prompt);
    utter.lang = 'zh-CN'; utter.rate = 0.95; utter.pitch = 1.0; utter.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const zhVoice = voices.find(v => v.lang.startsWith('zh') && (v.name.includes('Female') || v.name.includes('女') || v.name.includes('Xiaoxiao') || v.name.includes('Yunxi'))) || voices.find(v => v.lang.startsWith('zh'));
    if (zhVoice) utter.voice = zhVoice;
    utter.onend = () => { if (onStartAnswer) setTimeout(onStartAnswer, 300); };
    utter.onerror = () => { if (onStartAnswer) setTimeout(onStartAnswer, 300); };
    try { window.speechSynthesis.speak(utter); } catch(e) { if (onStartAnswer) onStartAnswer(); }
  }

  const AVATAR_OPTIONS = ['言','启','🎤','⚔️','🎓','💼','📚','🏛️','🎙️','🎨','✦','🌟','🎭','💬','🗣️','📖','🏆','🔥','💡','🌸','🍀','🦊','🐼','🦁','🐯','🐲','🦄','🌈'];
  const AVATAR_COLORS = [
    {bg:'linear-gradient(135deg, #f4a261, #e76f51)', ring:'rgba(244,162,97,0.4)'},
    {bg:'linear-gradient(135deg, #52b788, #40916c)', ring:'rgba(82,183,136,0.4)'},
    {bg:'linear-gradient(135deg, #74c0fc, #339af0)', ring:'rgba(116,192,252,0.4)'},
    {bg:'linear-gradient(135deg, #be78ff, #9775fa)', ring:'rgba(190,120,255,0.4)'},
    {bg:'linear-gradient(135deg, #ff8fab, #fb6f92)', ring:'rgba(255,143,171,0.4)'},
    {bg:'linear-gradient(135deg, #ffd43b, #fab005)', ring:'rgba(255,212,59,0.4)'},
    {bg:'linear-gradient(135deg, #20c997, #12b886)', ring:'rgba(32,201,151,0.4)'},
    {bg:'linear-gradient(135deg, #e599f7, #cc5de8)', ring:'rgba(229,153,247,0.4)'},
  ];

  function getScoreGrade(score){const s=Number(score)||0;if(s>=90)return{label:"优秀",color:"#f59e0b",cls:"grade-excellent"};if(s>=80)return{label:"良好",color:"#10b981",cls:"grade-good"};if(s>=60)return{label:"及格",color:"#3b82f6",cls:"grade-pass"};return{label:"不及格",color:"#ef4444",cls:"grade-fail"};}
function getPrepTime(sceneId) {
    const scene = SCENES.find(s => s.id === sceneId);
    const sceneDefault = scene?.prepTime || 15;
    if (state.settings.prepTimeMode === 'none') return 0;
    if (state.settings.prepTimeMode === 'custom') return Math.max(0, Math.min(120, state.settings.prepTimeCustom || 0));
    return sceneDefault;
  }

  function updatePrepUI() {
    if (!state.chat) return;
    const t = document.getElementById('chatTimer');
    if (t) {
      t.textContent = '⏳ 准备 ' + state.chat.prepTimeLeft + 's';
      t.classList.add('prepping');
    }
    const ps = document.querySelector('.voice-status.prepping strong');
    if (ps) ps.textContent = state.chat.prepTimeLeft + '秒';
    else {
      const statusBar = document.querySelector('.voice-status.prepping');
      if (statusBar) {
        statusBar.innerHTML = `<span>🧠</span><span>思考准备中 <strong>${state.chat.prepTimeLeft}秒</strong>，请快速构思答题框架</span><button class="btn btn-accent btn-sm" onclick="skipPrepAndStart()" style="margin-left:auto;padding:6px 14px;font-size:13px">跳过准备 →</button>`;
      }
    }
  }

  function runPrepTime(onComplete) {
    if (!state.chat) { if (onComplete) onComplete(); return; }
    const prepSec = state.chat.currentPrepTime || getPrepTime(state.chat.sceneId);
    if (prepSec <= 0) {
      state.chat.status = 'readyToAnswer';
      render();
      return;
    }
    state.chat.status = 'preparing';
    state.chat.prepTimeLeft = prepSec;
    render();
    playSound('tick');
    const iv = setInterval(() => {
      if (!state.chat || state.chat.status !== 'preparing') { clearInterval(iv); return; }
      state.chat.prepTimeLeft--;
      if (state.chat.prepTimeLeft <= 0) {
        clearInterval(iv);
        state.chat.status = 'readyToAnswer';
        render();
        return;
      }
      updatePrepUI();
      if (state.chat.prepTimeLeft <= 3) playSound('bell');
    }, 1000);
    state.chat.prepTimerInterval = iv;
  }

  async function startAnsweringNow() {
    if (!state.chat) return;
    state.chat.status = 'answering';
    const micPending = micReadyPromise && !state.micPermissionGranted && !state.micPermissionDenied;
    const needMic = !state.micPermissionDenied;
    state.chat.requestingMic = needMic || micPending;
    render();
    if (needMic || micPending) {
      const micOk = await ensureMicReady(0);
      state.chat.requestingMic = false;
      state.chat.startTime = Date.now();
      state.chat.answerTimeLeft = state.chat.timeLimit;
      startAnswerTimer();
      const inp = document.getElementById('chatInput');
      if (micOk) {
        if (inp) { inp.placeholder = '🎤 麦克风已就绪，请直接作答'; }
        startVoiceWithRetry();
        playSound('success');
      } else {
        if (inp) { inp.placeholder = '⚠️ 未获得麦克风权限，请点击🎤手动开启'; }
        showToast('⚠️ 未获得麦克风权限，请点击🎤手动开启', 'warning', 4000);
      }
    } else {
      state.chat.requestingMic = false;
      state.chat.startTime = Date.now();
      state.chat.answerTimeLeft = state.chat.timeLimit;
      startAnswerTimer();
      const inp = document.getElementById('chatInput');
      if (inp) { inp.placeholder = '点击左侧🎤开启语音后开始作答'; }
    }
    render();
  }

  function beginAnswering() {
    startAnsweringNow();
  }

  function skipPrep() {
    if (state.chat && state.chat.prepTimerInterval) clearInterval(state.chat.prepTimerInterval);
    state.chat.prepTimeLeft = 0;
  }

  function skipPrepAndStart() {
    if (!state.chat) return;
    skipPrep();
    state.chat.status = 'readyToAnswer';
    render();
  }

  const SCENES = [
    { id: 1, name: '公务员面试', icon: '🏛️', desc: '结构化面试，综合分析、应急应变、人际关系（每题3分钟）', color: 'rgba(244,162,97,0.15)', timeLimit: 180, prepTime: 30, voice: { gender: 'male', lang: 'zh', name: 'yunyang|yunxi|kangkang|male', pitch: 0.9, rate: 0.9, desc: '沉稳男声' } },
    { id: 2, name: '考研复试', icon: '🎓', desc: '专业基础、英语口语、科研潜力考察（每题3分钟）', color: 'rgba(116,192,252,0.15)', timeLimit: 180, prepTime: 20, voice: { gender: 'female', lang: 'zh', name: 'xiaoxiao|xiaoyi|female', pitch: 1.05, rate: 0.95, desc: '知性女声' } },
    { id: 3, name: '教资面试', icon: '📚', desc: '结构化问答+试讲+答辩，教学综合能力（每题2分30秒）', color: 'rgba(82,183,136,0.15)', timeLimit: 150, prepTime: 20, voice: { gender: 'female', lang: 'zh', name: 'xiaomo|xiaoxiao|huihui|female', pitch: 1.1, rate: 0.95, desc: '亲和女声' } },
    { id: 4, name: '求职面试', icon: '💼', desc: 'STAR法则，专业能力与团队协作考察（每题2分30秒）', color: 'rgba(233,196,106,0.15)', timeLimit: 150, prepTime: 20, voice: { gender: 'female', lang: 'zh', name: 'xiaoxiao|zhiyu|female', pitch: 1.0, rate: 0.95, desc: '专业女声' } },
    { id: 5, name: '即兴演讲', icon: '🎤', desc: '2分钟即兴演讲，快速构思与表达能力训练', color: 'rgba(231,111,81,0.15)', timeLimit: 120, prepTime: 15, voice: { gender: 'male', lang: 'zh', name: 'yunyang|yunxi|male', pitch: 1.0, rate: 0.9, desc: '磁性男声' } },
    { id: 6, name: '辩论训练', icon: '⚔️', desc: '逻辑思辨与临场反应，立论/攻辩发言（每题3分钟）', color: 'rgba(190,120,255,0.15)', timeLimit: 180, prepTime: 15, voice: { gender: 'male', lang: 'zh', name: 'yunyang|yunjian|male', pitch: 0.95, rate: 1.0, desc: '锐利男声' } },
    { id: 7, name: '少儿口才', icon: '🧒', desc: '适合5-12岁，讲故事/表达/绕口令，每题1-2分钟', color: 'rgba(255,146,43,0.15)', timeLimit: 90, prepTime: 5, voice: { gender: 'female', lang: 'zh', name: 'xiaoyou|xiaoxiao|huihui|female', pitch: 1.25, rate: 1.0, desc: '活泼童声' } },
    { id: 8, name: '主持培训', icon: '🎙️', desc: '开场白、串场、控场与救场即兴训练（每题2分钟）', color: 'rgba(100,200,255,0.15)', timeLimit: 120, prepTime: 10, voice: { gender: 'female', lang: 'zh', name: 'xiaoxiao|xiaohan|female', pitch: 1.05, rate: 0.95, desc: '播音女声' } },
    { id: 9, name: '背诵小助手', icon: '📖', desc: '上传资料AI出题助背', color: 'rgba(162,122,255,0.15)', timeLimit: 0, prepTime: 0, voice: null, isMemo: true }
  ];

  const SCENE_PROMPTS = {
    1: '你是一位经验丰富、极其严格、铁面无私的公务员面试考官（有20年考官经验）。请对考生进行结构化面试，关注综合分析能力、应急应变能力、人际关系处理、组织协调能力。问题要具体、有针对性，符合真实公务员面试难度，绝对不要放水。每轮一个问题，根据回答质量进行严格评判。全程中文。',
    2: '你是一位严格的研究生导师，正在考研复试现场。考察专业基础、英语口语、科研潜力和学术素养。可以包含1个英文问题。深入追问专业问题，不要放水，回答不好就给低分。全程以中文为主，英文问题用英文。',
    3: '你是一位资深教师招聘考官，有15年教资面试评委经验。模拟教资面试结构化问答，关注教学理念、课堂管理、教学设计能力、教师职业认知。问题要符合真实教资面试难度，评分要极其严格。全程中文。',
    4: '你是一位世界500强HR总监，专业且犀利。模拟求职面试，用STAR法则和行为面试法深度提问。考察专业能力、沟通表达、团队协作、问题解决能力、抗压能力。问题要有深度，不要太简单。全程中文。',
    5: '你是一位即兴演讲教练，曾担任多个演讲比赛评委。给出一个有挑战性的演讲主题，让用户进行2分钟即兴演讲，然后从立意、结构、内容、表达、感染力等维度给出极其严格、一针见血、毫不留情的点评。全程中文。',
    6: '你是一位国家级辩论赛最佳辩手，现在作为辩论对手与用户进行辩论训练。就给定辩题先亮出你的观点和论据，然后等待用户发言。辩论发言时间3分钟，用户发言后你要犀利指出其逻辑漏洞、论据不足、概念偷换、论证缺失等所有问题。全程中文。',
    7: "你是一位亲切活泼、像大姐姐/大哥哥一样的少儿口才老师，正在和5-12岁的小朋友练习说话和表达。你说话要简单、有趣、充满童趣。出题时：\n- 用小朋友听得懂的话，题目简单有趣\n- 可以让小朋友讲故事、描述事物、表达想法、角色扮演\n- 不要出太难的题目，不要用难词\n- 语气要鼓励、夸奖为主\n- 出题要短小，一道题只让小朋友做一件事（讲一个故事/描述一个东西/说一段话）\n- 适合年龄段：5-8岁用更简单题，9-12岁可稍复杂\n全程用温柔可爱的语气，像幼儿园/小学老师一样。",
    8: '你是一位资深主持人培训导师，有20年电视台主持经验。模拟各种主持场景（晚会、活动、发布会、突发状况等），让用户练习开场白、串场、互动控场和即兴救场能力。点评要专业、严格但有建设性。全程中文。'
  };

  const JOB_POSITIONS = [
    { id:'pm', name:'产品经理', desc:'互联网产品经理（B端/C端）', icon:'📱' },
    { id:'dev', name:'软件开发工程师', desc:'前端/后端/算法/测试开发', icon:'💻' },
    { id:'data', name:'数据分析师', desc:'数据分析/数据科学/BI', icon:'📊' },
    { id:'op', name:'运营', desc:'用户运营/内容运营/活动运营/电商运营', icon:'📢' },
    { id:'mk', name:'市场营销', desc:'品牌/市场推广/营销策划/新媒体', icon:'🎯' },
    { id:'hr', name:'人力资源', desc:'HRBP/招聘/培训/薪酬绩效', icon:'👥' },
    { id:'fin', name:'财务/会计', desc:'财务会计/审计/税务/金融分析', icon:'💰' },
    { id:'sales', name:'销售/商务', desc:'B端销售/大客户/商务拓展BD', icon:'🤝' },
    { id:'dsgn', name:'设计师', desc:'UI/UX/平面/视觉/交互设计师', icon:'🎨' },
    { id:'admin', name:'行政/文员', desc:'行政/秘书/办公室/综合岗', icon:'📋' },
    { id:'edu', name:'教育培训', desc:'老师/讲师/课程顾问/教研', icon:'📚' },
    { id:'med', name:'医疗/医药', desc:'医生/护士/医药代表/医疗器械', icon:'⚕️' },
    { id:'law', name:'法务/律师', desc:'法务/律师/合规/知识产权', icon:'⚖️' },
    { id:'bank', name:'金融/银行', desc:'银行/证券/基金/保险/投行', icon:'🏦' },
    { id:'logi', name:'供应链/物流', desc:'采购/物流/供应链管理', icon:'🚚' },
    { id:'cust', name:'客服/售后', desc:'客户服务/售后支持/客户成功', icon:'💬' },
    { id:'media', name:'传媒/新媒体', desc:'新媒体运营/自媒体/编导/主播', icon:'📺' },
    { id:'cons', name:'咨询/顾问', desc:'管理咨询/战略咨询/行业顾问', icon:'💡' }
  ];

  const TEACH_STAGES = [
    { id: 'kindergarten', name: '幼儿园', icon: '🧸', subjects: ['综合通识','幼儿保育','健康教育','语言表达','社会适应','科学启蒙','艺术教育'] },
    { id: 'primary', name: '小学', icon: '📖', subjects: ['语文','数学','英语','道德与法治','科学','音乐','体育','美术','信息技术','心理健康'] },
    { id: 'junior', name: '初中', icon: '📚', subjects: ['语文','数学','英语','物理','化学','生物','道德与法治','历史','地理','音乐','体育','美术','信息技术'] },
    { id: 'senior', name: '高中', icon: '🎓', subjects: ['语文','数学','英语','物理','化学','生物','政治','历史','地理','音乐','体育','美术','信息技术','通用技术'] }
  ];

  const POSTGRAD_MAJORS = [
    { id: 'cs', name: '计算机科学与技术', icon: '💻' },
    { id: 'ee', name: '电子信息/通信工程', icon: '📡' },
    { id: 'me', name: '机械工程', icon: '⚙️' },
    { id: 'ce', name: '土木工程', icon: '🏗️' },
    { id: 'chem', name: '化学/化工', icon: '🧪' },
    { id: 'bio', name: '生物/生命科学', icon: '🧬' },
    { id: 'med', name: '医学/临床医学', icon: '⚕️' },
    { id: 'econ', name: '经济学/金融学', icon: '📈' },
    { id: 'biz', name: '工商管理/MBA', icon: '💼' },
    { id: 'law', name: '法学/法律', icon: '⚖️' },
    { id: 'edu', name: '教育学', icon: '📚' },
    { id: 'lit', name: '中国语言文学', icon: '📝' },
    { id: 'eng', name: '外国语言文学', icon: '🌐' },
    { id: 'news', name: '新闻传播学', icon: '📰' },
    { id: 'art', name: '艺术学/设计学', icon: '🎨' },
    { id: 'psy', name: '心理学', icon: '🧠' },
    { id: 'math', name: '数学', icon: '🔢' },
    { id: 'phy', name: '物理学', icon: '🔭' },
    { id: 'his', name: '历史学', icon: '📜' },
    { id: 'phi', name: '哲学', icon: '💭' },
    { id: 'man', name: '管理科学与工程', icon: '📊' },
    { id: 'pub', name: '公共管理/MPA', icon: '🏛️' },
    { id: 'acc', name: '会计学/审计', icon: '💰' },
    { id: 'env', name: '环境科学与工程', icon: '🌿' }
  ];

  const CIVIL_POSITIONS = [
    { id: 'general', name: '综合管理岗', icon: '🏛️', desc: '办公室/综合行政/文秘' },
    { id: 'tax', name: '税务/财政', icon: '💰', desc: '税务局/财政局/审计' },
    { id: 'police', name: '公安/警察', icon: '🚔', desc: '民警/交警/刑警' },
    { id: 'court', name: '法院/检察院', icon: '⚖️', desc: '法官/检察官/司法行政' },
    { id: 'market', name: '市场监管', icon: '🔍', desc: '市场监督管理/食药监' },
    { id: 'edu', name: '教育系统', icon: '📚', desc: '教育局/学校行政' },
    { id: 'health', name: '卫生健康', icon: '🏥', desc: '卫健委/医院管理' },
    { id: 'urban', name: '城建/规划', icon: '🏗️', desc: '住建/规划/城管' },
    { id: 'grass', name: '基层/乡镇', icon: '🌾', desc: '乡镇公务员/村官/社区' },
    { id: 'foreign', name: '外交/外事', icon: '🌐', desc: '外交部/外事办' },
    { id: 'customs', name: '海关/边检', icon: '🛃', desc: '海关/出入境边防' },
    { id: 'stat', name: '统计/调研', icon: '📊', desc: '统计局/政策研究' }
  ];

  const SPEECH_TOPICS = [
    '人工智能对人类社会的影响是机遇还是挑战','坚持的力量如何改变人生','青春与奋斗的时代意义','选择比努力更重要吗',
    '团队合作中个人价值如何体现','面对挫折应有的态度','诚信在当代社会的价值','传统文化的创新与传承',
    '保护环境人人有责如何践行','我最敬佩的人及其精神','梦想与现实的平衡之道','时间管理对个人成长的重要性',
    '阅读如何改变一个人的思维','学会感恩是人生必修课','责任与担当的时代内涵','压力如何转化为成长动力',
    '短视频时代深度思考的价值','内卷与躺平之外的第三条路','终身学习的意义','共情能力在沟通中的重要性',
    '科技发展是否让人更孤独','仪式感对生活品质的提升','拒绝的艺术','失败的经历同样珍贵',
    '当代年轻人应该具备的核心竞争力','跨界学习如何打破思维局限','慢生活在快节奏时代的意义',
    '家庭教育对个人成长的深远影响','全球化背景下的文化自信','逆境中保持乐观心态的方法',
    '数字化时代人际关系的变与不变','青年一代的社会责任感','创新思维在日常工作中的应用'
  ];

  const KIDS_TOPICS = [
    '请讲一个关于勇敢小兔子的故事','描述你最喜欢的动物是什么样子','我的梦想是成为什么样的人',
    '如果你有一双翅膀会飞到哪里','介绍你最喜欢的一本书','描述一次难忘的旅行经历',
    '请介绍你的家庭','如果能和动物说话你想对谁说什么','我最好的朋友','我最喜欢的节日',
    '假如我是老师','描述下雨天的样子和声音','我学会了一项新本领','我的小宠物','如果我变成了巨人',
    '我最喜欢的季节是什么样子的','如果我会魔法想做什么','描述一次帮助别人的经历','我最喜欢的动画片',
    '假如我是超人会做什么','我爱吃的美食描述','我的学校是什么样子的','我最喜欢的游戏',
    '如果我有一百元会怎么花','我长大以后想发明什么','描述一次开心的生日派对',
    '我和好朋友之间最难忘的事','如果可以养一只恐龙会发生什么','我最喜欢的一首古诗',
    '假如今天是世界微笑日我会怎么做'
  ];

  const HOST_TOPICS = [
    '学校新年晚会开场白','公司年会主持开场','婚礼司仪主持','颁奖典礼主持词',
    '电视节目访谈开场','校园歌唱比赛主持','生日宴会主持','运动会开幕式解说',
    '产品发布会主持','慈善晚宴主持','新闻发布会提问环节','紧急突发事件现场播报',
    '毕业典礼主持','才艺比赛串词','论坛峰会主持开场',
    '校园辩论赛开场主持','少儿才艺展示活动主持','社区文艺晚会主持','婚礼仪式互动环节串词',
    '公司表彰大会主持','展会开幕式主持','电竞比赛解说开场','美食节活动主持',
    '毕业十周年同学聚会主持','公益募捐活动主持','电影首映礼主持','校园招聘会主持',
    '科技馆开馆仪式主持','达人秀海选现场主持','儿童生日派对互动主持'
  ];

  const DIMENSIONS = [
    { key: 'content', name: '内容质量', weight: 30 },
    { key: 'structure', name: '逻辑结构', weight: 25 },
    { key: 'fluency', name: '表达流畅', weight: 20 },
    { key: 'emotion', name: '情绪感染', weight: 15 },
    { key: 'adaptability', name: '应变能力', weight: 10 }
  ];

  const QUOTES = [
    { text: '一言可以兴邦，一言可以丧邦。', author: '《论语》' },
    { text: '语言是思想的外衣。', author: '塞缪尔·约翰逊' },
    { text: '口才是社交的需要，是事业的需要。', author: '戴尔·卡耐基' },
    { text: '说话前要思考，发言前要斟酌。', author: '德谟克利特' },
    { text: '能控制自己感情的人，比拿下一座城市的人更伟大。', author: '《圣经》' },
    { text: '善言使人如坐春风，恶语伤人六月寒。', author: '中国古语' }
  ];

  const TIPS = [
    '💡 答题前先用10秒构思：观点→2-3个论点+案例→总结',
    '💡 使用"第一、第二、第三"让表达更有条理',
    '💡 结合具体案例和个人经历更有说服力',
    '💡 语速适中，注意在重点处停顿',
    '💡 眼神坚定，声音洪亮，展现自信',
    '💡 每天坚持3-5题，一周就能看到进步',
    '💡 录音回听自己的回答，找出口头禅和问题',
    '💡 开头直接亮明观点，结尾总结升华',
    '💡 遇到不会的题不要慌，从是什么-为什么-怎么办展开',
    '💡 真情实感比华丽辞藻更能打动人'
  ];

  const TITLES = ['初入言途','崭露头角','能说会道','口若悬河','辩才无碍','语言大师','舌灿莲花','一代宗师'];

  const EXAM_TYPES = [
    { id: 'civil', icon: '🏛️', name: '公务员考试', color: 'rgba(244,162,97,0.2)' },
    { id: 'teacher', icon: '📚', name: '教资面试', color: 'rgba(82,183,136,0.2)' },
    { id: 'postgrad', icon: '🎓', name: '考研复试', color: 'rgba(116,192,252,0.2)' },
    { id: 'job', icon: '💼', name: '求职面试', color: 'rgba(233,196,106,0.2)' },
    { id: 'speech', icon: '🎤', name: '演讲比赛', color: 'rgba(231,111,81,0.2)' },
    { id: 'other', icon: '📝', name: '其他考试', color: 'rgba(150,150,150,0.2)' }
  ];

  const ACHIEVEMENTS = [
    { id: 'first_train', icon: '🎯', name: '初次开口', desc: '完成第一次训练', condition: (u,h) => u.totalQuestions >= 1 },
    { id: 'ten_questions', icon: '📝', name: '十题达成', desc: '累计完成10道题', condition: (u,h) => u.totalQuestions >= 10 },
    { id: 'fifty_questions', icon: '📚', name: '勤学苦练', desc: '累计完成50道题', condition: (u,h) => u.totalQuestions >= 50 },
    { id: 'hundred_questions', icon: '🏅', name: '百题达人', desc: '累计完成100道题', condition: (u,h) => u.totalQuestions >= 100 },
    { id: 'streak_3', icon: '🔥', name: '三日之约', desc: '连续训练3天', condition: (u,h) => u.streak >= 3 },
    { id: 'streak_7', icon: '⚡', name: '一周坚持', desc: '连续训练7天', condition: (u,h) => u.streak >= 7 },
    { id: 'streak_14', icon: '💫', name: '两周不断', desc: '连续训练14天', condition: (u,h) => u.streak >= 14 },
    { id: 'streak_30', icon: '💎', name: '月度坚守', desc: '连续训练30天', condition: (u,h) => u.streak >= 30 },
    { id: 'first_checkin', icon: '📅', name: '首次打卡', desc: '完成第一次每日打卡', condition: (u,h) => Object.keys(u.checkIns||{}).length >= 1 },
    { id: 'score_80', icon: '🌟', name: '初露锋芒', desc: '单题得分达到80分', condition: (u,h) => h.some(s => s.scores.some(sc => sc.totalScore >= 80)) },
    { id: 'score_90', icon: '👑', name: '卓越表现', desc: '单题得分达到90分', condition: (u,h) => h.some(s => s.scores.some(sc => sc.totalScore >= 90)) },
    { id: 'perfect_answer', icon: '💯', name: '完美作答', desc: '单题得分达到95分', condition: (u,h) => h.some(s => s.scores.some(sc => sc.totalScore >= 95)) },
    { id: 'avg_80', icon: '🏆', name: '实力出众', desc: '单场训练平均分80以上', condition: (u,h) => h.some(s => s.avgScore >= 80) },
    { id: 'civil_expert', icon: '🏛️', name: '公考达人', desc: '完成5次公务员面试训练', condition: (u,h) => h.filter(s=>s.sceneId===1).length >= 5 },
    { id: 'debate_master', icon: '⚔️', name: '辩论高手', desc: '完成5次辩论训练', condition: (u,h) => h.filter(s=>s.sceneId===6).length >= 5 },
    { id: 'speaker', icon: '🎤', name: '即兴演说家', desc: '完成5次即兴演讲训练', condition: (u,h) => h.filter(s=>s.sceneId===5).length >= 5 },
    { id: 'all_scenes', icon: '🌈', name: '全面发展', desc: '体验所有8种训练场景', condition: (u,h) => new Set(h.map(s=>s.sceneId)).size >= 8 },
    { id: 'night_owl', icon: '🦉', name: '夜猫子', desc: '在晚上22点后训练', condition: (u,h) => h.some(s=>new Date(s.date).getHours()>=22) },
    { id: 'early_bird', icon: '🐦', name: '早起的鸟儿', desc: '在早上8点前训练', condition: (u,h) => h.some(s=>new Date(s.date).getHours()<8) },
    { id: 'marathon', icon: '🏃', name: '马拉松', desc: '单场训练10道题', condition: (u,h) => h.some(s=>s.totalQuestions>=10) },
    { id: 'collector', icon: '📚', name: '收藏家', desc: '收藏5道好题', condition: (u,h) => (u.favorites||[]).length>=5 }
  ];

  function getDefaultUser() {
    return {
      nickname: '表达学习者',
      avatar: '言',
      avatarColorIndex: 0,
      avatarImage: null,
      signature: '每一次开口，都是更好的自己',
      gender: '',
      birthday: '',
      occupation: '',
      city: '',
      goal: '',
      bio: '',
      joinDate: new Date().toISOString().split('T')[0],
      level: 1, exp: 0, streak: 0,
      totalSessions: 0, totalQuestions: 0, totalMinutes: 0,
      avgScore: 0, bestScore: 0,
      dailyGoal: 3,
      lastTrainDate: null,
      todayCount: 0,
      todayOnlineSeconds: 0,
      todayHasTrained: false,
      lastOnlineDate: null,
      unlockedAchievements: [],
      checkIns: {},
      exams: [],
      calendarMonth: null,
      favorites: [],
      dailyChallengeDone: false,
      dailyChallengeDate: null
    };
  }

  function getDefaultSettings() {
    return {
      theme: 'dark',
      soundEnabled: true,
      autoStartMic: true,
      questionsPerSession: 5,
      strictMode: true,
      voiceLang: 'zh-CN',
      showTimer: true,
      autoReadQuestion: true,
      speechRate: 'normal',
      soundVolume: 'high',
      prepTimeMode: 'scene',
      prepTimeCustom: 15
    };
  }

  let state = {
    memoMode:{active:false,content:"",questions:[],currentIdx:0,showAnswer:false,correct:[],wrong:[],page:'home',memoHistory:[]},
    currentPage: 'home',
    sidebarOpen: false,
    isMobile: window.innerWidth <= 900,
    user: getDefaultUser(),
    settings: getDefaultSettings(),
    chat: null,
    voiceRecognition: null,
    userStoppedVoice: false,
    micPermissionDenied: false,
    micPermissionGranted: false,
    micStarting: false,
    finalTranscript: '',
    interimTranscript: '',
    helpOpen: false,
    profileEditOpen: false,
    avatarPickerOpen: false,
    settingsOpen: false,
    historyDetailId: null,
    timerPaused: false,
    pausedTimeLeft: 0,
    themeApplied: false,
    isSpeaking: false,
    audioContext: null,
    showingFavorites: false
  };

  let audioCtx = null;

  function getAudioContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
  }

  function getVolume() {
    if (!state.settings.soundEnabled) return 0;
    const v = state.settings.soundVolume;
    if (v === 'off') return 0;
    if (v === 'low') return 0.3;
    return 0.7;
  }

  function playTone(freq, duration, type = 'sine', volume = null, delay = 0) {
    try {
      const ctx = getAudioContext();
      const vol = volume !== null ? volume : getVolume();
      if (vol === 0) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(vol * 0.3, ctx.currentTime + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration);
    } catch (e) {}
  }

  function playSound(type) {
    if (!state.settings.soundEnabled) return;
    try {
      switch(type) {
        case 'correct':
          playTone(523.25, 0.15, 'sine', null, 0);
          playTone(659.25, 0.15, 'sine', null, 0.1);
          playTone(783.99, 0.3, 'sine', null, 0.2);
          break;
        case 'complete':
          const notes = [523.25, 659.25, 783.99, 1046.50];
          notes.forEach((n, i) => playTone(n, 0.2, 'sine', null, i * 0.12));
          break;
        case 'click':
          playTone(800, 0.05, 'sine', 0.15);
          break;
        case 'tick':
          playTone(440, 0.03, 'sine', 0.1);
          break;
        case 'bell':
          playTone(880, 0.12, 'triangle', null, 0);
          playTone(660, 0.18, 'triangle', null, 0.02);
          break;
        case 'achievement':
          [523.25, 659.25, 783.99, 659.25, 783.99, 1046.50].forEach((n, i) => {
            playTone(n, 0.18, 'triangle', null, i * 0.1);
          });
          break;
      }
    } catch (e) {}
  }

  const SFX = {
    click: () => playSound('click'),
    success: () => playSound('correct'),
    achievement: () => playSound('achievement'),
    levelup: () => { [523,659,784,880,1047].forEach((f,i)=>setTimeout(()=>playTone(f,0.18,'triangle',null,i*0.1),i*100)); },
    error: () => { playTone(200, 0.15, 'sawtooth', null, 0); setTimeout(()=>playTone(150,0.2,'sawtooth',null,0.12),120); },
    tick: () => playSound('tick'),
    checkin: () => playSound('achievement'),
    countdown: () => playTone(600, 0.08, 'sine', null, 0),
    start: () => { playTone(440,0.08,'sine',null,0); setTimeout(()=>playTone(660,0.15,'sine',null,0.1),100); }
  };

  function getSpeechRate() {
    const r = state.settings.speechRate;
    if (r === 'slow') return 0.85;
    if (r === 'fast') return 1.1;
    return 0.95;
  }

  function replaySpeak(text) {
    try {
      stopSpeak();
      if (!('speechSynthesis' in window)) return;
      state.isSpeaking = true;
      const synth = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = getSpeechRate();
      utterance.pitch = 1.05;
      const voices = synth.getVoices();
      const zhVoice = voices.find(v => v.lang.includes('zh') || v.lang.includes('CN'));
      if (zhVoice) utterance.voice = zhVoice;
      utterance.onend = () => { state.isSpeaking = false; };
      utterance.onerror = () => { state.isSpeaking = false; };
      synth.speak(utterance);
    } catch (e) { state.isSpeaking = false; }
  }

  function toggleRefAnswer() {
    const el = document.getElementById('refAnswerContent');
    if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
  }

  function speakReferenceAnswer() {
    try {
      stopSpeak();
      const el = document.getElementById('refAnswerContent');
      const text = el ? el.textContent : (state.chat.lastScore?.referenceAnswer || '');
      if (!text) return;
      if (el) el.style.display = 'block';
      if (!('speechSynthesis' in window)) { showToast('您的浏览器不支持语音朗读', 'warning'); return; }
      state.isSpeaking = true;
      const synth = window.speechSynthesis;
      const voices = synth.getVoices();
      const zhVoices = voices.filter(v => v.lang.includes('zh') || v.lang.includes('CN'));
      const utterance = new SpeechSynthesisUtterance(stripMarkdownForSpeech(text));
      utterance.lang = 'zh-CN';
      utterance.rate = 0.9 + Math.random() * 0.15;
      utterance.pitch = 0.9 + Math.random() * 0.3;
      if (zhVoices.length > 0) {
        const randomVoice = zhVoices[Math.floor(Math.random() * zhVoices.length)];
        utterance.voice = randomVoice;
      }
      const btn = document.querySelector('.ref-speak-btn');
      if (btn) { btn.textContent = '🔊 朗读中...'; btn.disabled = true; }
      utterance.onend = () => {
        state.isSpeaking = false;
        if (btn) { btn.textContent = '🔊 听示范'; btn.disabled = false; }
      };
      utterance.onerror = () => {
        state.isSpeaking = false;
        if (btn) { btn.textContent = '🔊 听示范'; btn.disabled = false; }
      };
      synth.speak(utterance);
      playSound('click');
    } catch (e) { state.isSpeaking = false; }
  }

  function showCelebration(title, subtitle, emoji) {
    const overlay = document.createElement('div');
    overlay.className = 'celebration-overlay';
    const colors = ['#f4a261', '#e76f51', '#e9c46a', '#52b788', '#74c0fc', '#be78ff', '#ff8fab'];
    let particles = '';
    for (let i = 0; i < 40; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const left = Math.random() * 100;
      const delay = Math.random() * 1.5;
      const duration = 2 + Math.random() * 2;
      const size = 6 + Math.random() * 10;
      particles += `<div class="confetti-particle" style="left:${left}%;background:${color};width:${size}px;height:${size}px;animation-delay:${delay}s;animation-duration:${duration}s"></div>`;
    }
    overlay.innerHTML = `
      <div class="confetti-container">${particles}</div>
      <div class="celebration-content">
        <div class="celebration-emoji">${emoji || '🎉'}</div>
        <div class="celebration-title">${title || '恭喜！'}</div>
        ${subtitle ? `<div class="celebration-subtitle">${subtitle}</div>` : ''}
        <button class="btn btn-primary celebration-close-btn" onclick="this.closest('.celebration-overlay').remove()">太棒了！</button>
      </div>
    `;
    document.body.appendChild(overlay);
    playSound('achievement');
    setTimeout(() => {
      if (overlay.parentNode) overlay.remove();
    }, 4000);
  }

  function toggleFavorite(scoreData) {
    if (!state.user.favorites) state.user.favorites = [];
    const question = state.chat.messages.filter(m => m.role === 'assistant').pop()?.content || '';
    const exists = state.user.favorites.findIndex(f => f.question === question);
    if (exists !== -1) {
      state.user.favorites.splice(exists, 1);
      showToast('已取消收藏', 'info');
    } else {
      state.user.favorites.unshift({
        id: Date.now(),
        sceneId: state.chat.sceneId,
        question: question,
        score: scoreData.totalScore,
        date: new Date().toISOString()
      });
      showToast('⭐ 已收藏到好题本', 'success');
      playSound('click');
    }
    saveData();
    render();
    checkAchievements();
  }

  function isQuestionFavorited() {
    if (!state.user.favorites) return false;
    const question = state.chat.messages.filter(m => m.role === 'assistant').pop()?.content || '';
    return state.user.favorites.some(f => f.question === question);
  }

  function removeFavorite(id) {
    state.user.favorites = (state.user.favorites || []).filter(f => f.id !== id);
    saveData();
    render();
    showToast('已移除', 'info');
  }

  function practiceFavorite(fav) {
    if (fav.sceneId === 0) {
      startTraining(5, 1, { isQuickPractice: true });
    } else if ([5,7,8].includes(fav.sceneId)) {
      showQuestionCountPicker(fav.sceneId);
    } else {
      startTraining(fav.sceneId, 1);
    }
  }

  function renderFavorites() {
    const favs = state.user.favorites || [];
    if (favs.length === 0) {
      return `<div class="favorites-empty" style="text-align:center;padding:60px 20px;color:var(--color-text-muted)">
        <div style="font-size:64px;margin-bottom:16px">⭐</div>
        <div style="font-size:18px;margin-bottom:8px">还没有收藏好题</div>
        <div style="font-size:14px;opacity:0.7">在答题后的评分卡片上点击⭐收藏好题</div>
      </div>`;
    }
    return `<div class="favorites-list">
      ${favs.map(f => {
        const scene = SCENES.find(s => s.id === f.sceneId);
        const d = new Date(f.date);
        return `<div class="favorite-item">
          <div class="favorite-scene">${scene?.icon || '📝'} ${scene?.name || '练习'}</div>
          <div class="favorite-question">${escapeHtml(f.question)}</div>
          <div class="favorite-meta">
            <span>${d.getMonth()+1}月${d.getDate()}日</span>
            ${f.score ? `<span>得分：${f.score}</span>` : ''}
          </div>
          <div class="favorite-actions">
            <button class="btn btn-primary btn-sm" onclick="practiceFavorite(${JSON.stringify(f).replace(/"/g, '&quot;')})">再练一次</button>
            <button class="btn btn-secondary btn-sm" onclick="removeFavorite(${f.id})">移除</button>
          </div>
        </div>`;
      }).join('')}
    </div>`;
  }

  function loadData() {
    try {
      const saved = localStorage.getItem('yanqi_data');
      if (saved) {
        const data = JSON.parse(saved);
        state.user = { ...getDefaultUser(), ...data.user };
        state.settings = { ...getDefaultSettings(), ...(data.settings || {}) };
        if (!state.user.favorites) state.user.favorites = [];
        checkDailyReset();
        state.firstTime = false;
        saveData();
      } else {
        state.firstTime = true;
        saveData();
      }
    } catch (e) {}
    applyTheme();
  }

  function checkDailyReset() {
    const today = new Date().toISOString().split('T')[0];
    if (state.user.lastTrainDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const hadCheckinYesterday = state.user.checkIns && state.user.checkIns[yesterday];
      if (state.user.lastTrainDate && state.user.lastTrainDate !== yesterday && !hadCheckinYesterday) {
        state.user.streak = 0;
      }
      state.user.todayCount = 0;
    }
    const lastOnlineDate = state.user.lastOnlineDate;
    if (lastOnlineDate !== today) {
      state.user.todayOnlineSeconds = 0;
      state.user.todayHasTrained = false;
      state.user.lastOnlineDate = today;
    }
  }

  function saveData() {
    try { localStorage.setItem('yanqi_data', JSON.stringify({ user: state.user, settings: state.settings, firstTime: false })); } catch (e) {}
  }

  function getHistory() {
    try { return JSON.parse(localStorage.getItem('yanqi_history') || '[]'); } catch (e) { return []; }
  }

  function saveHistory(h) {
    try { localStorage.setItem('yanqi_history', JSON.stringify(h)); } catch (e) {}
  }

  function applyTheme() {
    const isLight = state.settings.theme === 'light';
    document.documentElement.setAttribute('data-theme', isLight ? 'light' : 'dark');
    state.themeApplied = true;
  }

  function toggleTheme() {
    state.settings.theme = state.settings.theme === 'dark' ? 'light' : 'dark';
    applyTheme();
    saveData();
    render();
    playSound('click');
  }

  function getAvatarStyle() {
    if (state.user.avatarImage) {
      return `background-image:url(${state.user.avatarImage});background-size:cover;background-position:center;box-shadow:0 0 0 3px rgba(244,162,97,0.4),0 6px 20px rgba(0,0,0,0.3);`;
    }
    const c = AVATAR_COLORS[state.user.avatarColorIndex] || AVATAR_COLORS[0];
    return `background:${c.bg};box-shadow:0 0 0 3px ${c.ring},0 6px 20px rgba(0,0,0,0.3);color:white;`;
  }

  function getAvatarContent() {
    return state.user.avatarImage ? '' : state.user.avatar;
  }

  function triggerAvatarUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = e => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) {
        showToast('图片大小不能超过2MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = ev => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const size = 200;
          canvas.width = size; canvas.height = size;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, size, size);
          state.user.avatarImage = canvas.toDataURL('image/jpeg', 0.85);
          saveData();
          openAvatarPicker();
          showToast('头像上传成功', 'success');
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }

  function clearAvatarImage() {
    state.user.avatarImage = null;
    saveData();
    openAvatarPicker();
    showToast('已恢复默认头像', 'info');
  }

  function isAchievementUnlocked(id) {
    return (state.user.unlockedAchievements||[]).some(x => (typeof x==='string'?x:x.id) === id);
  }
  function getAchievementUnlockDate(id) {
    const rec = (state.user.unlockedAchievements||[]).find(x => (typeof x==='string'?x:x.id) === id);
    if (!rec) return null;
    if (typeof rec === 'string') return inferAchievementDate(id, getHistory());
    return rec.date || inferAchievementDate(id, getHistory());
  }
  function inferAchievementDate(achId, history) {
    const sorted = [...history].sort((a,b) => new Date(a.date) - new Date(b.date));
    const first = sorted[0];
    if (first && first.date) return first.date;
    try {
      const keys = Object.keys(localStorage);
      let earliest = null;
      keys.forEach(k => {
        try {
          const raw = localStorage.getItem(k);
          if (!raw) return;
          const m = raw.match(/"date":"(\d{4}-\d{2}-\d{2}T[^"]+)"/);
          if (m) { const t = new Date(m[1]).getTime(); if (!earliest || t < earliest) earliest = t; }
        } catch(e) {}
      });
      if (earliest) return new Date(earliest).toISOString();
    } catch(e) {}
    return new Date().toISOString();
  }

  function checkAchievements() {
    const history = getHistory();
    const newlyUnlocked = [];
    const unlockedMap = {};
    let needsMigration = false;
    (state.user.unlockedAchievements||[]).forEach(x => {
      if (typeof x === 'string') {
        needsMigration = true;
        unlockedMap[x] = { id: x, date: inferAchievementDate(x, history) };
      }
      else if (x && x.id) {
        if (!x.date) { needsMigration = true; x.date = inferAchievementDate(x.id, history); }
        unlockedMap[x.id] = x;
      }
    });
    ACHIEVEMENTS.forEach(a => {
      if (!unlockedMap[a.id] && a.condition(state.user, history)) {
        const rec = { id: a.id, date: new Date().toISOString() };
        unlockedMap[a.id] = rec;
        newlyUnlocked.push(a);
      }
    });
    state.user.unlockedAchievements = Object.values(unlockedMap);
    if (newlyUnlocked.length || needsMigration) {
      saveData();
      newlyUnlocked.forEach((a, i) => {
        setTimeout(() => {
          showToast(`🏅 解锁成就「${a.name}」：${a.desc}`, 'success', 4500);
        }, i * 1500);
      });
      if (newlyUnlocked.length > 0) {
        setTimeout(() => playSound('achievement'), 500);
      }
    }
  }

  async function callDeepSeek(messages, options = {}) {
    const { temperature = 0.7, maxTokens = 2048, timeout = 40000 } = options;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(CONFIG.DEEPSEEK_API_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${CONFIG.DEEPSEEK_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: CONFIG.DEEPSEEK_MODEL, messages, temperature, max_tokens: maxTokens }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`API: ${response.status}`);
      const data = await response.json();
      return data.choices[0].message.content;
    } catch (e) { clearTimeout(timeoutId); throw e; }
  }

  function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toastRoot');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  function getScoreContext(answerLen, expectedLen, durationSec, timeLimit) {
    const ratio = answerLen / Math.max(expectedLen, 1);
    if (answerLen === 0) return { cap: 0, level: 'EMPTY', dimCap: 0, note: '🔴 未作答，0分' };
    if (answerLen <= 10 && durationSec < 30) return { cap: 10, level: 'MIN', dimCap: 15, note: '🔴 回答几乎为零（仅几个字），总分不超过10分' };
    if (durationSec < 30 && answerLen < 50) return { cap: 25, level: 'MIN', dimCap: 30, note: '🔴 答题时间不足30秒且内容很少，总分不超过25分' };
    if (durationSec >= timeLimit * 0.5) return { cap: 100, level: 'NORMAL', dimCap: 100, note: '' };
    if (durationSec >= timeLimit - 2) return { cap: 100, level: 'NORMAL', dimCap: 100, note: '' };
    if (durationSec < 30) {
      if (answerLen >= expectedLen * 0.4) return { cap: 50, level: 'SHORT_TIME', dimCap: 55, note: `🟠 答题时间较短（${durationSec}秒），但有一定内容，AI将根据质量评分（上限50）` };
      return { cap: 30, level: 'SHORT_TIME', dimCap: 35, note: `🔴 答题时间不足30秒，总分不超过30分` };
    }
    if (ratio >= 0.6) return { cap: 100, level: 'NORMAL', dimCap: 100, note: '' };
    if (ratio >= 0.4) return { cap: 85, level: 'OK', dimCap: 90, note: `🟡 回答尚可（${Math.round(ratio*100)}%），AI将综合评判` };
    if (ratio >= 0.25) return { cap: 70, level: 'SHORT', dimCap: 75, note: `🟠 回答偏短（${Math.round(ratio*100)}%），总分不超过70分` };
    if (answerLen < 25) return { cap: 25, level: 'CRITICAL', dimCap: 30, note: '🔴 内容极少，总分不超过25分' };
    return { cap: 50, level: 'BAD', dimCap: 55, note: `🔴 回答过短（${Math.round(ratio*100)}%），总分不超过50分` };
  }

  function getLengthPenalty(answerLen, expectedLen) {
    const ctx = getScoreContext(answerLen, expectedLen, state.chat?.answerDuration||0, state.chat?.timeLimit||120);
    return { cap: ctx.cap, level: ctx.level, note: ctx.note };
  }

  function getDimCap(answerLen, expectedLen, totalCap) {
    const ctx = getScoreContext(answerLen, expectedLen, state.chat?.answerDuration||0, state.chat?.timeLimit||120);
    return Math.min(totalCap, ctx.dimCap);
  }

  function formatExamDate(dateStr) {
    if (!dateStr) return '未设置';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`;
  }

  function formatDate(d) {
    const date = new Date(d);
    return `${date.getMonth()+1}月${date.getDate()}日`;
  }

  function formatTime(sec) {
    const m = Math.floor(sec/60), s = sec%60;
    return `${m}:${String(s).padStart(2,'0')}`;
  }

  function toggleSidebar() {
    if (!state.isMobile) return;
    state.sidebarOpen = !state.sidebarOpen;
    document.getElementById('sidebar')?.classList.toggle('open', state.sidebarOpen);
  }

  window.addEventListener('resize', () => {
    state.isMobile = window.innerWidth <= 900;
    if (!state.isMobile) document.getElementById('sidebar')?.classList.remove('open');
  });

  function navigateTo(page) {
    if (state.chat && page !== 'training') {
      if (state.chat.messages.length > 0 && !state.chat.lastScore && state.chat.status !== 'reviewing') {
        if (!confirm('确定离开？当前训练进度不会保存。')) return;
      }
      clearInterval(state.chat.timerInterval);
      clearInterval(state.chat.prepTimerInterval);
      stopVoice();
      stopSpeak();
      state.chat = null;
    }
    state.showingFavorites = false;
    closeAllModals();
    state.currentPage = page;
    if (state.sidebarOpen) toggleSidebar();
    document.querySelectorAll('.nav-link, .nav-item').forEach(el => {
      if (el.dataset.page) el.classList.toggle('active', el.dataset.page === page);
    });
    render();
  }

  function closeAllModals() {
    state.helpOpen = false;
    state.profileEditOpen = false;
    state.avatarPickerOpen = false;
    state.settingsOpen = false;
    state.historyDetailId = null;
    document.getElementById('modalRoot')?.classList.remove('open');
    const mr = document.getElementById('modalRoot');
    if (mr) { mr.classList.remove('open'); setTimeout(() => { if (!state.helpOpen && !state.profileEditOpen && !state.settingsOpen && !state.avatarPickerOpen && !state.historyDetailId) mr.innerHTML=''; }, 300); }
  }

  function escapeHtml(text) {
    if (!text) return '';
    const d = document.createElement('div'); d.textContent = text; return d.innerHTML;
  }

  function getXPProgress() {
    const currentLevelExp = (state.user.level - 1) * 100;
    const nextLevelExp = state.user.level * 100;
    const progress = ((state.user.exp - currentLevelExp) / (nextLevelExp - currentLevelExp)) * 100;
    return Math.min(100, Math.max(0, progress));
  }

  function getEncouragementMessage() {
    const hour = new Date().getHours();
    const todayCount = state.user.todayCount;
    const goal = state.user.dailyGoal;
    if (todayCount >= goal) return '🎉 今日目标已达成，你太棒了！';
    if (hour < 9) return '🌅 早上好！早起练习，事半功倍';
    if (hour < 12) return '☀️ 上午是练习表达的黄金时间';
    if (hour < 14) return '🍱 午休后练一题，保持状态';
    if (hour < 18) return '💪 下午加油，再练一题就进步';
    if (hour < 22) return '🌙 晚上练习，巩固一天的学习';
    return '🦉 夜猫子模式！注意休息哦';
  }

  function getWeeklyStats() {
    const history = getHistory();
    const now = new Date();
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - now.getDay());
    thisWeekStart.setHours(0,0,0,0);
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    let thisWeek = 0, lastWeek = 0;
    history.forEach(h => {
      const d = new Date(h.date);
      if (d >= thisWeekStart) thisWeek += h.scores.length;
      else if (d >= lastWeekStart) lastWeek += h.scores.length;
    });
    return { thisWeek, lastWeek };
  }

  function getDailyTip() {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    return TIPS[dayOfYear % TIPS.length];
  }

  function render() {
    const container = document.getElementById('pageContainer');
    if (!container) return;
    const lt = document.getElementById('levelText'); if (lt) lt.textContent = `Lv.${state.user.level}`;
    const sn = document.getElementById('streakNumber'); if (sn) sn.textContent = state.user.streak;
    const ti = document.getElementById('themeIcon'); if (ti) ti.textContent = state.settings.theme === 'light' ? '☀️' : '🌙';

    const ut = document.getElementById('userTitle');
    if (ut) ut.textContent = TITLES[Math.min(Math.floor(state.user.level/3), TITLES.length-1)];

    const sidebarName = document.querySelector('.user-name');
    if (sidebarName) sidebarName.textContent = state.user.nickname;
    const sidebarTitle = document.querySelector('.user-title');
    if (sidebarTitle) sidebarTitle.textContent = TITLES[Math.min(Math.floor(state.user.level/3), TITLES.length-1)];
    const sidebarAvatar = document.querySelector('.sidebar-header .avatar span');
    if (sidebarAvatar) sidebarAvatar.textContent = getAvatarContent();
    const sidebarAvatarRing = document.querySelector('.sidebar-header .avatar');
    if (sidebarAvatarRing) sidebarAvatarRing.setAttribute('style', getAvatarStyle());
    const sidebarAvatarOuter = document.querySelector('.sidebar-header .avatar-ring');
    if (sidebarAvatarOuter) sidebarAvatarOuter.style.background = 'transparent';

    let html = '';
    switch (state.currentPage) {
      case 'home': html = renderHome(); break;
      case 'training': html = (state.memoMode && state.memoMode.active) ? renderMemoMode() : ((state.chat && state.chat.messages) ? renderChat() : renderTraining()); break;
      case 'growth': html = renderGrowth(); setTimeout(drawRadar, 100); setTimeout(drawWeekChart, 100); break;
      case 'profile': html = renderProfile(); break;
      default: html = renderHome();
    }
    container.innerHTML = html;
    if (state.currentPage === 'training' && state.chat) setTimeout(scrollToBottom, 100);
  }

  function getCalendarMonth() {
    if (!state.user.calendarMonth) {
      const now = new Date();
      state.user.calendarMonth = { year: now.getFullYear(), month: now.getMonth() };
    }
    return state.user.calendarMonth;
  }

  function changeCalendarMonth(delta) {
    const cm = getCalendarMonth();
    let m = cm.month + delta;
    let y = cm.year;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    state.user.calendarMonth = { year: y, month: m };
    saveData();
    render();
  }

  function renderCalendar() {
    const cm = getCalendarMonth();
    const year = cm.year, month = cm.month;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startWeekDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const checkIns = state.user.checkIns || {};
    const weekDays = ['日','一','二','三','四','五','六'];
    let daysHtml = '';
    for (let i = 0; i < startWeekDay; i++) daysHtml += '<div class="calendar-day empty"></div>';
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const checkIn = checkIns[dateStr];
      const isToday = dateStr === todayStr;
      const isFuture = new Date(dateStr) > today;
      let cls = 'calendar-day';
      let content = `<span class="cd-num">${d}</span>`;
      if (isToday) cls += ' today';
      if (isFuture) cls += ' future';
      if (checkIn) {
        cls += ' checked';
        let level;
        let minuteText;
        if (checkIn.minutes >= 30) { level = 'high'; minuteText = `${checkIn.minutes}分钟`; }
        else if (checkIn.minutes >= 15) { level = 'mid'; minuteText = `${checkIn.minutes}分钟`; }
        else if (checkIn.minutes > 0) { level = 'low'; minuteText = `${checkIn.minutes}分钟`; }
        else { level = 'low'; minuteText = '已打卡'; }
        cls += ` level-${level}`;
        content += `<div class="cd-dot"></div><span class="cd-minutes">${minuteText}</span>`;
      }
      daysHtml += `<div class="${cls}" ${checkIn?`onclick="showDayDetail('${dateStr}')"`:''}>${content}</div>`;
    }
    const monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
    const thisMonthCheckIns = Object.keys(checkIns).filter(k => k.startsWith(`${year}-${String(month+1).padStart(2,'0')}`)).length;
    const totalMinutes = Object.values(checkIns).reduce((s,c) => s + (c.minutes||0), 0);
    return `
      <div class="calendar-card">
        <div class="calendar-header">
          <button class="cal-nav-btn" onclick="changeCalendarMonth(-1)">‹</button>
          <div class="cal-title">${year}年 ${monthNames[month]}</div>
          <button class="cal-nav-btn" onclick="changeCalendarMonth(1)">›</button>
        </div>
        <div class="calendar-weekdays">${weekDays.map(w=>`<div class="cw-day">${w}</div>`).join('')}</div>
        <div class="calendar-grid">${daysHtml}</div>
        <div class="calendar-footer">
          <div class="cal-stat"><span class="cal-stat-num">${thisMonthCheckIns}</span><span class="cal-stat-label">本月打卡</span></div>
          <div class="cal-stat"><span class="cal-stat-num">${totalMinutes}</span><span class="cal-stat-label">累计分钟</span></div>
          <div class="cal-stat ${state.user.streak>=3?'streak-hot':''}"><span class="cal-stat-num">${state.user.streak}</span><span class="cal-stat-label">🔥 连续</span></div>
        </div>
      </div>`;
  }

  function showDayDetail(dateStr) {
    const checkIns = state.user.checkIns || {};
    const ci = checkIns[dateStr];
    if (!ci) return;
    const d = new Date(dateStr);
    const root = document.getElementById('modalRoot');
    const isManualOnly = ci.sessions === 0 && ci.minutes === 0;
    root.innerHTML = `<div class="modal-backdrop" onclick="closeAllModals()"></div><div class="modal-content modal-sm">
      <div class="modal-title">📅 ${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日</div>
      ${isManualOnly ? `<div style="text-align:center;padding:20px 0;color:var(--color-text-muted);"><div style="font-size:48px;margin-bottom:12px;">✅</div><div>已打卡，开始训练记录学习数据</div></div>` :
      `<div class="day-detail-stats">
        <div class="dd-stat"><div class="dd-val">${ci.questions}</div><div class="dd-lbl">练习题数</div></div>
        <div class="dd-stat"><div class="dd-val">${ci.minutes}</div><div class="dd-lbl">学习分钟</div></div>
        <div class="dd-stat"><div class="dd-val">${ci.score||0}</div><div class="dd-lbl">平均分</div></div>
        <div class="dd-stat"><div class="dd-val">${ci.sessions}</div><div class="dd-lbl">训练场次</div></div>
      </div>`}
      <div class="modal-actions"><button class="btn btn-primary" onclick="closeAllModals()">关闭</button></div>
    </div>`;
    root.classList.add('open');
  }

  function getDaysUntil(dateStr) {
    const target = new Date(dateStr);
    const now = new Date();
    target.setHours(0,0,0,0); now.setHours(0,0,0,0);
    return Math.ceil((target - now) / 86400000);
  }

  function renderExams() {
    const exams = state.user.exams || [];
    const sortedExams = [...exams].sort((a,b) => {
      const da = getDaysUntil(a.date), db = getDaysUntil(b.date);
      if (da < 0 && db < 0) return new Date(b.date) - new Date(a.date);
      if (da < 0) return 1;
      if (db < 0) return -1;
      return da - db;
    });
    const upcoming = sortedExams.filter(e => getDaysUntil(e.date) >= 0).slice(0, 3);
    const expired = sortedExams.filter(e => getDaysUntil(e.date) < 0).slice(0, 2);
    return `
      <div class="exams-card">
        <div class="exams-header">
          <span class="exams-title">🎯 目标考试</span>
          <button class="add-exam-btn" onclick="openAddExam()">+ 添加</button>
        </div>
        ${exams.length === 0 ? `
          <div class="empty-exams">
            <div class="empty-exams-icon">📅</div>
            <div class="empty-exams-text">设置你的目标考试日期</div>
            <div class="empty-exams-sub">倒计时激励自己坚持练习</div>
            <button class="btn btn-primary btn-sm" onclick="openAddExam()" style="margin-top:12px">添加目标考试</button>
          </div>` : `
          <div class="exams-list">
            ${upcoming.map(e => renderExamCard(e, false)).join('')}
            ${expired.length > 0 ? `<div class="expired-exams-label">已结束</div>${expired.map(e => renderExamCard(e, true)).join('')}` : ''}
          </div>`}
      </div>`;
  }

  function renderExamCard(exam, expired) {
    const type = EXAM_TYPES.find(t => t.id === exam.type) || EXAM_TYPES[6];
    const days = getDaysUntil(exam.date);
    let daysText, daysClass;
    if (expired || days < 0) {
      daysText = '已结束'; daysClass = 'expired';
    } else if (days === 0) {
      daysText = '今天'; daysClass = 'today';
    } else {
      daysText = `${days}天`; daysClass = days <= 7 ? 'urgent' : days <= 30 ? 'soon' : 'normal';
    }
    return `<div class="exam-card ${daysClass}" style="--exam-color:${type.color}">
      <div class="exam-type-icon">${type.icon}</div>
      <div class="exam-info">
        <div class="exam-name">${escapeHtml(exam.name)}</div>
        <div class="exam-type">${type.name} · ${formatExamDate(exam.date)}</div>
      </div>
      <div class="exam-countdown">
        <div class="ec-num">${daysText}</div>
      </div>
      <button class="exam-delete" onclick="event.stopPropagation();deleteExam('${exam.id}')" title="删除">×</button>
    </div>`;
  }

  function openAddExam(examId) {
    const exams = state.user.exams || [];
    const exam = examId ? exams.find(e => e.id === examId) : null;
    const isEdit = !!exam;
    const root = document.getElementById('modalRoot');
    root.innerHTML = `<div class="modal-backdrop" onclick="closeAllModals()"></div><div class="modal-content modal-sm">
      <div class="modal-title">${isEdit ? '✏️ 编辑考试' : '🎯 添加目标考试'}</div>
      <div class="form-group"><label>考试类型</label>
        <div class="exam-type-grid">${EXAM_TYPES.map(t => `<button type="button" class="et-option ${(!exam && t.id==='civil') || (exam && exam.type===t.id) ? 'selected' : ''}" data-type="${t.id}" onclick="selectExamType(this,'${t.id}')" style="--et-color:${t.color}"><span class="et-icon">${t.icon}</span><span class="et-name">${t.name}</span></button>`).join('')}</div>
      </div>
      <div class="form-group"><label>考试名称</label><input type="text" class="form-input" id="examName" value="${exam ? escapeHtml(exam.name) : ''}" maxlength="30" placeholder="如：2026国考面试"></div>
      <div class="form-group"><label>考试日期</label><input type="date" class="form-input" id="examDate" ${exam?`value="${exam.date}"`:''} min="${new Date().toISOString().split('T')[0]}"></div>
      <input type="hidden" id="examId" value="${exam ? exam.id : ''}">
      <input type="hidden" id="examType" value="${exam ? exam.type : 'civil'}">
      <div class="modal-actions">
        <button class="btn btn-secondary" onclick="closeAllModals()">取消</button>
        <button class="btn btn-primary" onclick="saveExam()">${isEdit ? '保存' : '添加'}</button>
      </div>
    </div>`;
    root.classList.add('open');
    if (!isEdit) setTimeout(() => document.getElementById('examName')?.focus(), 100);
  }

  function selectExamType(btn, typeId) {
    document.querySelectorAll('.et-option').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    document.getElementById('examType').value = typeId;
  }

  function saveExam() {
    const name = document.getElementById('examName')?.value.trim();
    const date = document.getElementById('examDate')?.value;
    const type = document.getElementById('examType')?.value || 'civil';
    const id = document.getElementById('examId')?.value;
    if (!name) { showToast('请输入考试名称', 'error'); return; }
    if (!date) { showToast('请选择考试日期', 'error'); return; }
    if (!state.user.exams) state.user.exams = [];
    if (id) {
      const idx = state.user.exams.findIndex(e => e.id === id);
      if (idx !== -1) state.user.exams[idx] = { ...state.user.exams[idx], name, date, type };
    } else {
      state.user.exams.push({ id: Date.now().toString(), name, date, type });
    }
    saveData(); closeAllModals(); render();
    showToast(id ? '考试已更新' : '目标考试已添加', 'success');
  }

  function deleteExam(examId) {
    if (!confirm('确定删除这个考试目标？')) return;
    state.user.exams = (state.user.exams || []).filter(e => e.id !== examId);
    saveData(); render(); showToast('已删除', 'info');
  }

  function showCheckInProgress(needMinutes, needTrain) {
    const onlineMin = Math.floor((state.user.todayOnlineSeconds || 0) / 60);
    const onlineProgress = Math.min(100, (onlineMin / 10) * 100);
    let msg = `<div style="text-align:left"><div style="margin-bottom:16px">打卡需要满足两个条件：</div>`;
    msg += `<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px"><span style="font-size:20px">${onlineMin>=10?'✅':'⏱️'}</span><span style="flex:1"><div>在线学习满10分钟</div><div style="font-size:12px;color:var(--color-text-muted);margin-top:2px">当前：${onlineMin}分钟 / 10分钟</div></span></div>`;
    msg += `<div style="height:6px;background:var(--color-surface-hover);border-radius:3px;margin-bottom:14px;overflow:hidden"><div style="height:100%;width:${onlineProgress}%;background:var(--color-primary);border-radius:3px;transition:width .3s"></div></div>`;
    msg += `<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px"><span style="font-size:20px">${state.user.todayHasTrained?'✅':'🎯'}</span><span style="flex:1"><div>完成至少1次训练</div><div style="font-size:12px;color:var(--color-text-muted);margin-top:2px">${state.user.todayHasTrained?'已完成':'任意板块训练1题即可'}</div></span></div>`;
    msg += `</div>`;
    const root = document.getElementById('modalRoot');
    root.innerHTML = `<div class="modal-backdrop" onclick="closeAllModals()"></div><div class="modal-content modal-sm">
      <div class="modal-title">⏳ 打卡进行中</div>
      ${msg}
      <div class="modal-actions">
        <button class="btn btn-secondary" onclick="closeAllModals()">知道了</button>
        ${!state.user.todayHasTrained?`<button class="btn btn-primary" onclick="closeAllModals();startQuickPractice()">去训练</button>`:''}
      </div>
    </div>`;
    root.classList.add('open');
  }

  function doCheckIn() {
    const today = new Date().toISOString().split('T')[0];
    if (!state.user.checkIns) state.user.checkIns = {};
    if (state.user.checkIns[today]) return false;
    const onlineMin = Math.floor((state.user.todayOnlineSeconds || 0) / 60);
    if (onlineMin < 10 || !state.user.todayHasTrained) return false;
    state.user.checkIns[today] = { minutes: 0, questions: 0, score: 0, sessions: 0 };
    const yesterday = new Date(Date.now()-86400000).toISOString().split('T')[0];
    const hadCheckinYesterday = state.user.checkIns[yesterday];
    if (state.user.lastTrainDate === yesterday || hadCheckinYesterday) {
      state.user.streak++;
    } else {
      state.user.streak = 1;
    }
    state.user.lastTrainDate = today;
    saveData();
    SFX.checkin();
    setTimeout(() => celebrate('checkin'), 200);
    const streakMilestones = [3, 7, 14, 30];
    if (streakMilestones.includes(state.user.streak)) {
      setTimeout(() => {
        showCelebration(`连续打卡${state.user.streak}天！`, '坚持就是胜利，继续加油！', '🔥');
      }, 500);
    } else {
      setTimeout(() => {
        showCelebration('打卡成功！', '今天也认真练习了，真棒！', '✅');
      }, 300);
    }
    checkAchievements();
    return true;
  }

  function manualCheckIn() {
    const today = new Date().toISOString().split('T')[0];
    if (!state.user.checkIns) state.user.checkIns = {};
    if (state.user.checkIns[today]) {
      showToast('今天已经打卡过啦，继续训练增加时长吧！', 'info');
      return;
    }
    const onlineMin = Math.floor((state.user.todayOnlineSeconds || 0) / 60);
    if (onlineMin < 10) {
      showCheckInProgress(Math.max(0, 10-onlineMin), !state.user.todayHasTrained);
      return;
    }
    if (!state.user.todayHasTrained) {
      showCheckInProgress(0, true);
      return;
    }
    doCheckIn();
    render();
  }

  function renderHome() {
    const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    const hour = new Date().getHours();
    const greeting = hour < 6 ? '夜深了' : hour < 12 ? '早上好' : hour < 14 ? '中午好' : hour < 18 ? '下午好' : '晚上好';
    const history = getHistory();
    const todayProgress = Math.min(100, (state.user.todayCount / state.user.dailyGoal) * 100);
    const hasLastSession = history.length > 0;
    const goalComplete = state.user.todayCount >= state.user.dailyGoal;
    const today = new Date().toISOString().split('T')[0];
    const todayChecked = !!(state.user.checkIns && state.user.checkIns[today]);
    const onlineMinutes = Math.floor((state.user.todayOnlineSeconds || 0) / 60);
    const canCheckIn = !todayChecked && onlineMinutes >= 10 && state.user.todayHasTrained;
    const checkInProgress = !todayChecked && !canCheckIn;
    const needMinutes = Math.max(0, 10 - onlineMinutes);
    const needTrain = !state.user.todayHasTrained;
    const encouragement = getEncouragementMessage();
    const weeklyStats = getWeeklyStats();
    const dailyTip = getDailyTip();

    return `
      <div class="welcome-section">
        <div class="welcome-greeting">${greeting}，${escapeHtml(state.user.nickname)}</div>
        <h1 class="welcome-title">开启你的<br><span class="accent">表达之旅</span></h1>
        <p class="welcome-subtitle">${escapeHtml(state.user.signature)}</p>
      </div>

      ${goalComplete ? `<div class="goal-complete-banner">
        <div class="gcb-emoji">🎉</div>
        <div class="gcb-text">
          <div class="gcb-title">今日目标已达成！</div>
          <div class="gcb-sub">你今天练习了${state.user.todayCount}题，太棒了！</div>
        </div>
      </div>` : ''}

      <div class="encouragement-card">
        <span class="ec-emoji">💪</span>
        <span class="ec-text">${encouragement}</span>
      </div>

      <div class="daily-goal-card">
        <div class="daily-goal-header">
          <span class="daily-goal-title">🎯 今日目标</span>
          <span class="daily-goal-count">${state.user.todayCount}/${state.user.dailyGoal}题</span>
        </div>
        <div class="daily-goal-bar">
          <div class="daily-goal-fill" style="width:${todayProgress}%;background:${goalComplete?'linear-gradient(90deg,var(--color-success),#40916c)':'linear-gradient(90deg,var(--color-primary),var(--color-secondary))'}"></div>
        </div>
        <div class="daily-goal-msg">${goalComplete ? '🎉 今日目标已完成，继续加油！' : `再练${Math.max(0,state.user.dailyGoal-state.user.todayCount)}题达成今日目标`}</div>
      </div>

      <div class="tip-card">
        <div class="tip-title">💡 学习小贴士</div>
        <div class="tip-content">${dailyTip}</div>
      </div>

      ${(()=>{const ch=getDailyChallenge();return `<div class="daily-challenge-card" style="background:linear-gradient(135deg,rgba(244,162,97,0.12),rgba(231,111,81,0.08));border:1px solid rgba(244,162,97,0.25);border-radius:16px;padding:18px 20px;margin-bottom:16px;cursor:${ch.done?'default':'pointer'}" ${ch.done?'':`onclick="startDailyChallenge();playSound('click')"`}>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <div style="display:flex;align-items:center;gap:8px"><span style="font-size:20px">🎯</span><span style="font-weight:700;font-size:15px">每日挑战</span>${ch.done?'<span style="font-size:12px;color:var(--color-success);background:rgba(82,183,136,0.15);padding:2px 8px;border-radius:10px">已完成</span>':'<span style="font-size:12px;color:var(--color-accent);background:rgba(244,162,97,0.15);padding:2px 8px;border-radius:10px">点击开始</span>'}</div>
          <span style="font-size:12px;color:var(--color-text-dim)">${ch.date}</span>
        </div>
        <div style="font-size:14px;line-height:1.6;color:var(--color-text)">${escapeHtml(ch.topic)}</div>
        <div style="font-size:12px;color:var(--color-text-dim);margin-top:8px">${ch.done?'今天的挑战已完成，明天再来！':'2分钟即兴表达 · 完成可计入打卡训练量'}</div>
      </div>`;})()}

      <div class="weekly-mini-stats">
        <div class="wms-item">
          <div class="wms-label">本周</div>
          <div class="wms-value">${weeklyStats.thisWeek}题</div>
        </div>
        <div class="wms-divider"></div>
        <div class="wms-item">
          <div class="wms-label">上周</div>
          <div class="wms-value">${weeklyStats.lastWeek}题</div>
        </div>
        <div class="wms-divider"></div>
        <div class="wms-item ${weeklyStats.thisWeek > weeklyStats.lastWeek ? 'wms-up' : weeklyStats.thisWeek < weeklyStats.lastWeek ? 'wms-down' : ''}">
          <div class="wms-label">趋势</div>
          <div class="wms-value">${weeklyStats.thisWeek > weeklyStats.lastWeek ? '📈' : weeklyStats.thisWeek < weeklyStats.lastWeek ? '📉' : '➡️'}</div>
        </div>
      </div>

      <div class="quote-card">
        <p class="quote-text">${quote.text}</p>
        <p class="quote-author">—— ${quote.author}</p>
      </div>

      <div class="stats-row">
        <div class="stat-card clickable" onclick="navigateTo('growth');playSound('click')"><div class="stat-value">${state.user.totalSessions}</div><div class="stat-label">训练场次</div></div>
        <div class="stat-card clickable" onclick="navigateTo('growth');playSound('click')"><div class="stat-value">${state.user.totalQuestions}</div><div class="stat-label">答题总数</div></div>
        <div class="stat-card clickable" onclick="navigateTo('growth');playSound('click')"><div class="stat-value">${state.user.avgScore || 0}</div><div class="stat-label">平均分数</div></div>
        <div class="stat-card clickable ${state.user.streak>=3?'streak-active':''}" onclick="navigateTo('growth');playSound('click')"><div class="stat-value streak-value">${state.user.streak}</div><div class="stat-label">🔥 连续天数</div></div>
      </div>

      <div class="quick-actions" style="grid-template-columns: repeat(2, 1fr);">
        <button class="quick-action-btn primary" onclick="startQuickPractice();playSound('click')">
          <span class="qa-icon">⚡</span>
          <div><div class="qa-title">快速练习</div><div class="qa-desc">通用即兴题 · 智能计时</div></div>
        </button>
        <button class="quick-action-btn ${todayChecked?'checked':canCheckIn?'':'locked'}" onclick="${todayChecked?'':canCheckIn?'manualCheckIn()':`showCheckInProgress(${needMinutes},${needTrain?'true':'false'})`}">
          <span class="qa-icon">${todayChecked?'✅':canCheckIn?'📅':'⏳'}</span>
          <div><div class="qa-title">${todayChecked?'今日已打卡':canCheckIn?'每日打卡':'打卡进行中'}</div><div class="qa-desc">${todayChecked?'继续加油':canCheckIn?'点击打卡记录学习':needTrain?`在线${needMinutes}分钟+完成1次训练`:`还需在线${needMinutes}分钟`}</div></div>
        </button>

      </div>

      <div class="home-two-col">
        <div class="home-col">
          <div class="section-header">
            <h2 class="section-title">📅 学习日历</h2>
          </div>
          ${renderCalendar()}
        </div>
        <div class="home-col">
          <div class="section-header">
            <h2 class="section-title">🎯 目标倒计时</h2>
          </div>
          ${renderExams()}
        </div>
      </div>

      <div class="section-header">
        <h2 class="section-title">热门训练场景</h2>
        <button class="section-more" onclick="navigateTo('training');playSound('click')">查看全部 →</button>
      </div>
      <div class="scene-grid">
        ${SCENES.filter(s=>!s.isMemo && s.id!==3).slice(0,4).map(s => `
          <div class="scene-card" onclick="${s.isMemo?'startMemoMode()':`showQuestionCountPicker(${s.id})`};playSound('click')" style="--scene-color:${s.color};">
            <div class="scene-icon" style="background:${s.color};">${s.icon}</div>
            <div class="scene-name">${s.name}</div>
            <div class="scene-desc">${s.desc}</div>
            <div class="scene-meta"><span>⏱</span><span>${Math.floor(s.timeLimit/60)}分钟 · 约${Math.round(s.timeLimit*CONFIG.CHARS_PER_SECOND)}字</span></div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderTraining() {
    const qOptions = [1,3,5,10];
    return `
      <div class="training-header">
        <h1 class="training-title">选择训练场景</h1>
        <p class="training-subtitle">AI模拟真实考官，一对一严格陪练 · <strong style="color:var(--color-success)">答完可随时提前交卷</strong> · <strong style="color:var(--color-danger)">评分极其严格，内容不足直接低分</strong></p>
      </div>

      <div class="quick-practice-banner" onclick="startQuickPractice();playSound('click')">
        <div class="qpb-icon">⚡</div>
        <div class="qpb-content">
          <div class="qpb-title">通用即兴速练</div>
          <div class="qpb-desc">各行各业通用即兴回答题 · 难度适中 · AI智能计时</div>
        </div>
        <div class="qpb-arrow">→</div>
      </div>

      <div class="scene-list">
        ${SCENES.filter(s=>!s.isMemo).map(s => `
          <div class="scene-list-item" onclick="showQuestionCountPicker(${s.id});playSound('click')">
            <div class="scene-list-icon" style="background:${s.color};">${s.icon}</div>
            <div class="scene-list-content">
              <div class="scene-list-name">${s.name}</div>
              <div class="scene-list-desc">${s.desc}</div>
              <div class="scene-list-meta">
                <span>⏱ 答题时间：AI动态设定</span>
                <span>📝 AI建议字数</span>
              </div>
            </div>
            <div class="scene-list-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="scene-section-divider">
        <span class="ssd-line"></span>
        <span class="ssd-title">拓展板块</span>
        <span class="ssd-line"></span>
      </div>

      <div class="scene-list">
        ${SCENES.filter(s=>s.isMemo).map(s => `
          <div class="scene-list-item" onclick="${s.isMemo?`startMemoMode()`:`showQuestionCountPicker(${s.id})`};playSound('click')">
            <span class="scene-beta-badge">测试</span>
            <div class="scene-list-icon" style="background:${s.color};">${s.icon}</div>
            <div class="scene-list-content">
              <div class="scene-list-name">${s.name}</div>
              <div class="scene-list-desc">${s.desc}</div>
              <div class="scene-list-meta">
                <span>📄 支持 txt/doc/docx/pdf 上传</span>
                <span>📊 自动保存练习记录</span>
              </div>
            </div>
            <div class="scene-list-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function showQuestionCountPicker(sceneId) {
    const root = document.getElementById('modalRoot');
    if (!root) return;
    const scene = SCENES.find(s => s.id === sceneId);
    if (sceneId === 4) { showJobPositionPicker(scene); return; }
    if (sceneId === 3) { showTeachPicker(scene); return; }
    if (sceneId === 2) { showPostgradPicker(scene); return; }
    if (sceneId === 1) { showCivilPicker(scene); return; }
    if ([5, 7, 8].includes(sceneId)) { showTopicPicker(scene); return; }
    if (sceneId === 9) { closeAllModals(); startMemoMode(); return; }
    root.innerHTML = `
      <div class="modal-backdrop" onclick="closeAllModals()"></div>
      <div class="modal-content modal-sm">
        <div class="modal-title">${scene.icon} ${scene.name}</div>
        <div class="modal-subtitle">选择本题目的题数</div>
        <div class="qcp-grid">
          ${[1,3,5,10].map(n => `<button class="qcp-option" onclick="closeAllModals();startTraining(${sceneId},${n})"><div class="qcp-num">${n}</div><div class="qcp-label">${n===1?'单题练习':n+'道题'}</div><div class="qcp-time">约${n}×${Math.floor(scene.timeLimit/60)}分钟</div></button>`).join('')}
        </div>
        <div class="modal-actions"><button class="btn btn-secondary" onclick="closeAllModals()">取消</button></div>
      </div>`;
    root.classList.add('open');
  }

  function showJobPositionPicker(scene) {
    const root = document.getElementById('modalRoot');
    if (!root) return;
    const qOptions = [1,3,5,10];
    root.innerHTML = `
      <div class="modal-backdrop" onclick="closeAllModals()"></div>
      <div class="modal-content modal-lg job-picker-modal">
        <div class="modal-title">💼 求职面试 — 选择目标岗位</div>
        <div class="modal-subtitle">选择常用岗位快速开始，或输入目标职位与工作简介</div>
        <div class="job-picker-section">
          <div class="job-picker-label">📌 常用岗位（点击选中）</div>
          <div class="job-pos-grid">
            ${JOB_POSITIONS.map(p => `<button type="button" class="job-pos-option" data-job="${p.id}" onclick="selectJobPos(this,'${p.id}')" style="--job-color:${stringToColor(p.name)}"><span class="jpos-icon">${p.icon}</span><span class="jpos-name">${p.name}</span><span class="jpos-desc">${p.desc}</span></button>`).join('')}
            <button type="button" class="job-pos-option job-pos-custom" data-job="__custom__" onclick="selectJobPos(this,'__custom__')"><span class="jpos-icon">✍️</span><span class="jpos-name">自定义职位</span><span class="jpos-desc">自行填写岗位与要求</span></button>
          </div>
        </div>
        <div class="job-picker-section">
          <div class="job-picker-label">📝 目标职位 / 公司（可选）</div>
          <input type="text" class="form-input" id="jobTitle" placeholder="如：字节跳动产品经理 / 腾讯后端开发工程师" maxlength="60">
        </div>
        <div class="job-picker-section">
          <div class="job-picker-label">💼 工作简介 / JD（可选，AI会据此定制面试题）</div>
          <textarea class="form-input" id="jobBio" rows="3" placeholder="简要介绍你应聘的岗位、主要职责、要求的技能、公司行业、工作年限要求等；越详细AI出题越贴合真实面试" maxlength="500" style="resize:vertical"></textarea>
        </div>
        <div class="job-picker-section">
          <div class="job-picker-label">🎯 本次训练题数</div>
          <div class="segmented-control" style="justify-content:flex-start;flex-wrap:wrap">
            ${qOptions.map(n => `<button type="button" class="${n===3?'active':''}" data-qcount="${n}" onclick="selectQCount(this,${n})">${n===1?'1题速练':n+'道题'}</button>`).join('')}
          </div>
        </div>
        <input type="hidden" id="jobSelectedId" value="">
        <input type="hidden" id="jobSelectedCount" value="3">
        <div class="modal-actions">
          <button class="btn btn-secondary" onclick="closeAllModals()">取消</button>
          <button class="btn btn-primary" onclick="confirmJobStart()">开始面试 →</button>
        </div>
      </div>`;
    root.classList.add('open');
    setTimeout(() => document.getElementById('jobTitle')?.focus(), 150);
  }

  function selectJobPos(btn, jobId) {
    document.querySelectorAll('.job-pos-option').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    document.getElementById('jobSelectedId').value = jobId;
    if (jobId !== '__custom__') {
      const pos = JOB_POSITIONS.find(p => p.id === jobId);
      if (pos) {
        const titleEl = document.getElementById('jobTitle');
        const bioEl = document.getElementById('jobBio');
        if (titleEl && !titleEl.value) titleEl.value = pos.name;
        if (bioEl && !bioEl.value) bioEl.value = pos.desc;
      }
    }
  }

  function selectQCount(btn, n) {
    document.querySelectorAll('[data-qcount]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('jobSelectedCount').value = n;
  }

  function confirmJobStart() {
    const jobId = document.getElementById('jobSelectedId')?.value || '';
    const jobTitle = document.getElementById('jobTitle')?.value.trim() || '';
    const jobBio = document.getElementById('jobBio')?.value.trim() || '';
    const qCount = parseInt(document.getElementById('jobSelectedCount')?.value || '3', 10);
    const pos = jobId ? JOB_POSITIONS.find(p => p.id === jobId) : null;
    const position = jobTitle || (pos ? pos.name : '通用岗位');
    const bio = jobBio || (pos ? pos.desc : '');
    closeAllModals();
    startTraining(4, qCount, { jobContext: { position, bio } });
  }

  function showTeachPicker(scene) {
    const root = document.getElementById('modalRoot');
    if (!root) return;
    const qOptions = [1,3,5,10];
    root.innerHTML = `
      <div class="modal-backdrop" onclick="closeAllModals()"></div>
      <div class="modal-content modal-lg">
        <div class="modal-title">📚 教资面试 — 选择学段与科目</div>
        <div class="modal-subtitle">随机出结构化面试题，或按学段+科目匹配题目</div>
        <div class="job-picker-section">
          <div class="job-picker-label">🎲 快速开始</div>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <button class="btn btn-primary" onclick="closeAllModals();startTraining(3,1,{teachContext:{stage:'random',subject:''}})" style="flex:1;min-width:140px">🎲 随机单题（结构化）</button>
          </div>
        </div>
        <div class="job-picker-section">
          <div class="job-picker-label">🏫 选择学段</div>
          <div class="segmented-control" style="justify-content:flex-start;flex-wrap:wrap" id="teachStageTabs">
            ${TEACH_STAGES.map((st,i) => `<button type="button" class="${i===0?'active':''}" data-stage="${st.id}" onclick="selectTeachStage(this,'${st.id}')">${st.icon} ${st.name}</button>`).join('')}
          </div>
        </div>
        <div class="job-picker-section">
          <div class="job-picker-label">📖 选择科目</div>
          <div class="job-pos-grid" id="teachSubjectGrid">
            ${TEACH_STAGES[0].subjects.map(sub => `<button type="button" class="job-pos-option" data-subject="${sub}" onclick="selectTeachSubject(this,'${sub}')" style="--job-color:${stringToColor(sub)}"><span class="jpos-name">${sub}</span></button>`).join('')}
            <button type="button" class="job-pos-option job-pos-custom" data-subject="__random__" onclick="selectTeachSubject(this,'__random__')"><span class="jpos-name">🎲 随机</span></button>
          </div>
        </div>
        <div class="job-picker-section">
          <div class="job-picker-label">🎯 本次训练题数</div>
          <div class="segmented-control" style="justify-content:flex-start;flex-wrap:wrap">
            ${qOptions.map(n => `<button type="button" class="${n===3?'active':''}" data-qcount="${n}" onclick="selectTeachQCount(this,${n})">${n===1?'1题速练':n+'道题'}</button>`).join('')}
          </div>
        </div>
        <input type="hidden" id="teachSelectedStage" value="${TEACH_STAGES[0].id}">
        <input type="hidden" id="teachSelectedSubject" value="">
        <input type="hidden" id="teachSelectedCount" value="3">
        <div class="modal-actions">
          <button class="btn btn-secondary" onclick="closeAllModals()">取消</button>
          <button class="btn btn-primary" onclick="confirmTeachStart()">开始训练 →</button>
        </div>
      </div>`;
    root.classList.add('open');
  }
  function selectTeachStage(btn, stageId) {
    document.querySelectorAll('#teachStageTabs button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('teachSelectedStage').value = stageId;
    document.getElementById('teachSelectedSubject').value = '';
    const stage = TEACH_STAGES.find(s => s.id === stageId);
    const grid = document.getElementById('teachSubjectGrid');
    if (grid && stage) {
      grid.innerHTML = stage.subjects.map(sub => `<button type="button" class="job-pos-option" data-subject="${sub}" onclick="selectTeachSubject(this,'${sub}')" style="--job-color:${stringToColor(sub)}"><span class="jpos-name">${sub}</span></button>`).join('')
        + `<button type="button" class="job-pos-option job-pos-custom" data-subject="__random__" onclick="selectTeachSubject(this,'__random__')"><span class="jpos-name">🎲 随机</span></button>`;
    }
    document.querySelectorAll('#teachSubjectGrid .job-pos-option').forEach(b => b.classList.remove('selected'));
  }
  function selectTeachSubject(btn, subject) {
    document.querySelectorAll('#teachSubjectGrid .job-pos-option').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    document.getElementById('teachSelectedSubject').value = subject;
  }
  function selectTeachQCount(btn, n) {
    btn.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('teachSelectedCount').value = n;
  }
  function confirmTeachStart() {
    const stage = document.getElementById('teachSelectedStage')?.value || 'primary';
    const subject = document.getElementById('teachSelectedSubject')?.value || '';
    const qCount = parseInt(document.getElementById('teachSelectedCount')?.value || '3', 10);
    closeAllModals();
    startTraining(3, qCount, { teachContext: { stage, subject: subject === '__random__' ? '' : subject } });
  }

  function showPostgradPicker(scene) {
    const root = document.getElementById('modalRoot');
    if (!root) return;
    const qOptions = [1,3,5,10];
    root.innerHTML = `
      <div class="modal-backdrop" onclick="closeAllModals()"></div>
      <div class="modal-content modal-lg">
        <div class="modal-title">🎓 考研复试 — 选择专业</div>
        <div class="modal-subtitle">AI将根据你选择的专业生成针对性复试题目</div>
        <div class="job-picker-section">
          <div class="job-picker-label">📌 常用专业（点击选中）</div>
          <div class="job-pos-grid">
            ${POSTGRAD_MAJORS.map(p => `<button type="button" class="job-pos-option" data-major="${p.id}" onclick="selectPostgradMajor(this,'${p.id}','${p.name}')" style="--job-color:${stringToColor(p.name)}"><span class="jpos-icon">${p.icon}</span><span class="jpos-name">${p.name}</span></button>`).join('')}
          </div>
        </div>
        <div class="job-picker-section">
          <div class="job-picker-label">✍️ 自定义专业（如不在列表中）</div>
          <input type="text" class="form-input" id="postgradMajor" placeholder="如：马克思主义理论、建筑学、药学..." maxlength="40">
        </div>
        <div class="job-picker-section">
          <div class="job-picker-label">🏫 报考院校/研究方向（可选）</div>
          <input type="text" class="form-input" id="postgradDirection" placeholder="如：北京大学计算机系AI方向" maxlength="60">
        </div>
        <div class="job-picker-section">
          <div class="job-picker-label">🎯 本次训练题数</div>
          <div class="segmented-control" style="justify-content:flex-start;flex-wrap:wrap">
            ${qOptions.map(n => `<button type="button" class="${n===3?'active':''}" data-qcount="${n}" onclick="selectPostgradQCount(this,${n})">${n===1?'1题速练':n+'道题'}</button>`).join('')}
          </div>
        </div>
        <input type="hidden" id="postgradSelectedMajor" value="">
        <input type="hidden" id="postgradSelectedMajorName" value="">
        <input type="hidden" id="postgradSelectedCount" value="3">
        <div class="modal-actions">
          <button class="btn btn-secondary" onclick="closeAllModals()">取消</button>
          <button class="btn btn-primary" onclick="confirmPostgradStart()">开始复试训练 →</button>
        </div>
      </div>`;
    root.classList.add('open');
  }
  function selectPostgradMajor(btn, majorId, majorName) {
    btn.closest('.job-pos-grid').querySelectorAll('.job-pos-option').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    document.getElementById('postgradSelectedMajor').value = majorId;
    document.getElementById('postgradSelectedMajorName').value = majorName;
    const el = document.getElementById('postgradMajor');
    if (el && !el.value) el.value = majorName;
  }
  function selectPostgradQCount(btn, n) {
    btn.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('postgradSelectedCount').value = n;
  }
  function confirmPostgradStart() {
    const majorId = document.getElementById('postgradSelectedMajor')?.value || '';
    const customMajor = document.getElementById('postgradMajor')?.value.trim() || '';
    const direction = document.getElementById('postgradDirection')?.value.trim() || '';
    const qCount = parseInt(document.getElementById('postgradSelectedCount')?.value || '3', 10);
    const major = customMajor || (majorId ? POSTGRAD_MAJORS.find(m => m.id === majorId)?.name : '') || '本专业';
    closeAllModals();
    startTraining(2, qCount, { postgradContext: { major, direction } });
  }

  function showCivilPicker(scene) {
    const root = document.getElementById('modalRoot');
    if (!root) return;
    const qOptions = [1,3,5,10];
    root.innerHTML = `
      <div class="modal-backdrop" onclick="closeAllModals()"></div>
      <div class="modal-content modal-lg">
        <div class="modal-title">🏛️ 公务员面试 — 选择出题方式</div>
        <div class="modal-subtitle">随机生成通用结构化面试题，或按岗位类型定制题目</div>
        <div class="job-picker-section">
          <div class="job-picker-label">🎲 快速开始</div>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <button class="btn btn-primary" onclick="closeAllModals();startTraining(1,1,{civilContext:{position:'random'}})" style="flex:1;min-width:140px">🎲 随机单题（通用结构化）</button>
          </div>
        </div>
        <div class="job-picker-section">
          <div class="job-picker-label">🏢 选择岗位类型</div>
          <div class="job-pos-grid">
            ${CIVIL_POSITIONS.map(p => `<button type="button" class="job-pos-option" data-civil="${p.id}" onclick="selectCivilPos(this,'${p.id}')" style="--job-color:${stringToColor(p.name)}"><span class="jpos-icon">${p.icon}</span><span class="jpos-name">${p.name}</span><span class="jpos-desc">${p.desc}</span></button>`).join('')}
          </div>
        </div>
        <div class="job-picker-section">
          <div class="job-picker-label">📝 补充说明（可选）</div>
          <input type="text" class="form-input" id="civilCustom" placeholder="如：国税系统、省直机关、选调生、基层执法等" maxlength="60">
        </div>
        <div class="job-picker-section">
          <div class="job-picker-label">🎯 本次训练题数</div>
          <div class="segmented-control" style="justify-content:flex-start;flex-wrap:wrap">
            ${qOptions.map(n => `<button type="button" class="${n===3?'active':''}" data-qcount="${n}" onclick="selectCivilQCount(this,${n})">${n===1?'1题速练':n+'道题'}</button>`).join('')}
          </div>
        </div>
        <input type="hidden" id="civilSelectedPos" value="">
        <input type="hidden" id="civilSelectedCount" value="3">
        <div class="modal-actions">
          <button class="btn btn-secondary" onclick="closeAllModals()">取消</button>
          <button class="btn btn-primary" onclick="confirmCivilStart()">开始训练 →</button>
        </div>
      </div>`;
    root.classList.add('open');
  }
  function selectCivilPos(btn, posId) {
    btn.closest('.job-pos-grid').querySelectorAll('.job-pos-option').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    document.getElementById('civilSelectedPos').value = posId;
  }
  function selectCivilQCount(btn, n) {
    btn.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('civilSelectedCount').value = n;
  }
  function confirmCivilStart() {
    const posId = document.getElementById('civilSelectedPos')?.value || 'random';
    const custom = document.getElementById('civilCustom')?.value.trim() || '';
    const qCount = parseInt(document.getElementById('civilSelectedCount')?.value || '3', 10);
    closeAllModals();
    startTraining(1, qCount, { civilContext: { position: posId, custom } });
  }

  function showTopicPicker(scene) {
    const root = document.getElementById('modalRoot');
    if (!root) return;
    const qOptions = [1,3,5,10];
    const topicHints = {
      5: '演讲主题，如：坚持的力量、科技与人文、我的梦想',
      7: '口才练习主题，如：我最喜欢的动物、假如我会飞',
      8: '主持场景，如：公司年会开场、婚礼主持、突发救场'
    };
    root.innerHTML = `
      <div class="modal-backdrop" onclick="closeAllModals()"></div>
      <div class="modal-content modal-md">
        <div class="modal-title">${scene.icon} ${scene.name} — 选择题材</div>
        <div class="modal-subtitle">随机出题或输入你想练习的主题/场景</div>
        <div class="job-picker-section">
          <div class="job-picker-label">🎲 随机出题</div>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <button class="btn btn-primary" onclick="closeAllModals();startTraining(${scene.id},1,{topicContext:'random'})" style="flex:1;min-width:140px">🎲 随机单题</button>
            <button class="btn btn-accent" onclick="document.getElementById('topicCustom').focus()" style="flex:1;min-width:140px">✍️ 自定义主题</button>
          </div>
        </div>
        <div class="job-picker-section">
          <div class="job-picker-label">💡 推荐主题（点击填入）</div>
          <div class="job-pos-grid" style="grid-template-columns:repeat(auto-fill,minmax(120px,1fr))">
            ${(scene.id===7?KIDS_TOPICS:scene.id===8?HOST_TOPICS:SPEECH_TOPICS).slice(0,15).map(t => `<button type="button" class="job-pos-option" onclick="document.getElementById('topicCustom').value='${t}';document.getElementById('topicCustom').focus()" style="--job-color:${stringToColor(t)};padding:10px 8px"><span class="jpos-name" style="font-size:13px">${t}</span></button>`).join('')}
          </div>
        </div>
        <div class="job-picker-section">
          <div class="job-picker-label">✍️ 自定义主题/场景</div>
          <input type="text" class="form-input" id="topicCustom" placeholder="${topicHints[scene.id] || '输入你想练习的主题'}" maxlength="50">
        </div>
        <div class="job-picker-section">
          <div class="job-picker-label">🎯 本次训练题数</div>
          <div class="segmented-control" style="justify-content:flex-start;flex-wrap:wrap">
            ${qOptions.map(n => `<button type="button" class="${n===1?'active':''}" data-qcount="${n}" onclick="selectTopicQCount(this,${n})">${n===1?'1题速练':n+'道题'}</button>`).join('')}
          </div>
        </div>
        <input type="hidden" id="topicSelectedCount" value="1">
        <div class="modal-actions">
          <button class="btn btn-secondary" onclick="closeAllModals()">取消</button>
          <button class="btn btn-primary" onclick="confirmTopicStart(${scene.id})">开始训练 →</button>
        </div>
      </div>`;
    root.classList.add('open');
    setTimeout(() => document.getElementById('topicCustom')?.focus(), 150);
  }
  function selectTopicQCount(btn, n) {
    btn.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('topicSelectedCount').value = n;
  }
  function confirmTopicStart(sceneId) {
    const topic = document.getElementById('topicCustom')?.value.trim() || '';
    const qCount = parseInt(document.getElementById('topicSelectedCount')?.value || '1', 10);
    closeAllModals();
    if (topic) {
      startTraining(sceneId, qCount, { topicContext: 'custom', customTopic: topic });
    } else {
      startTraining(sceneId, qCount, { topicContext: 'random' });
    }
  }

  function stringToColor(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    const hue = Math.abs(h) % 360;
    return `hsla(${hue},60%,55%,0.18)`;
  }

  function startTraining(sceneId, questionCount, opts) {
    const scene = SCENES.find(s => s.id === sceneId);
    if (!scene) return;
    const qCount = questionCount || state.settings.questionsPerSession || CONFIG.DEFAULT_QUESTIONS_PER_SESSION;
    const o = opts || {};
    const isQuick = !!o.isQuickPractice;
    state.chat = {
      currentPrepTime:0, expectedWords:0,
      sceneId: isQuick ? 0 : sceneId,
      sceneName: isQuick ? '即兴速练' : scene.name,
      sceneIcon: isQuick ? '⚡' : scene.icon,
      timeLimit: isQuick ? 180 : scene.timeLimit,
      messages: [], questionCount: 0, totalQuestions: qCount,
      status: 'countdown', answerTimeLeft: isQuick ? 180 : scene.timeLimit,
      timerInterval: null, scores: [], lastScore: null,
      startTime: null, answerDuration: 0, paused: false,
      isQuickPractice: isQuick,
      jobContext: o.jobContext || null,
      teachContext: o.teachContext || null,
      postgradContext: o.postgradContext || null,
      civilContext: o.civilContext || null,
      topicContext: o.topicContext || null,
      customTopic: o.customTopic || null,
      quickVoice: isQuick ? { gender: 'female', lang: 'zh', pitch: 1.1, rate: 0.95, desc: '温和女声' } : null,
      requestingMic: false
    };
    state.finalTranscript = ''; state.interimTranscript = ''; state.userStoppedVoice = false;
    state.timerPaused = false;
    navigateTo('training');
    runCountdown();
    playSound('click');
  }

  function getRecommendedScene() {
    const u = state.user;
    let scores = {};
    SCENES.forEach(s => scores[s.id] = 0);
    const history = getHistory();

    const getAge = () => {
      if (!u.birthday) return null;
      const b = new Date(u.birthday);
      const now = new Date();
      let a = now.getFullYear() - b.getFullYear();
      const m = now.getMonth() - b.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < b.getDate())) a--;
      return a >= 0 && a < 120 ? a : null;
    };
    const age = getAge();

    if (age !== null && age < 14) {
      scores[7] += 50;
    } else {
      scores[7] -= 100;
    }

    if (u.exams && u.exams.length > 0) {
      const examTypeMap = {
        'civil': [1], 'teacher': [3], 'postgrad': [2], 'job': [4],
        'speech': [5], 'other': [4, 5, 8]
      };
      const nearestExam = u.exams
        .map(e => ({ ...e, days: getDaysUntil(e.date) }))
        .filter(e => e.days >= 0)
        .sort((a, b) => a.days - b.days)[0];
      if (nearestExam) {
        const typeIds = examTypeMap[nearestExam.type] || [4];
        typeIds.forEach(id => { scores[id] += 40; });
      }
    }

    const occ = (u.occupation || '').toLowerCase();
    const goal = (u.goal || '').toLowerCase();
    const text = occ + ' ' + goal;
    if (/公务员|事业编|选调|国考|省考|基层|行政/.test(text)) scores[1] += 30;
    if (/教师|老师|教资|教育|学校|讲师/.test(text)) scores[3] += 30;
    if (/考研|研究生|复试|硕士|学术|科研/.test(text)) scores[2] += 30;
    if (/求职|面试|找工作|offer|hr|应聘|秋招|春招|实习/.test(text)) scores[4] += 30;
    if (/演讲|口才|主持|辩论|表达|演说|比赛/.test(text)) { scores[5] += 25; scores[8] += 20; }
    if (/英语|英文|雅思|托福|口语/.test(text)) scores[2] += 15;
    if (/学生|大学|高中|初中/.test(text)) { scores[4] += 15; scores[2] += 10; scores[3] += 10; }

    if (history.length > 0) {
      const recentHistory = history.slice(0, 10);
      const sceneCount = {};
      recentHistory.forEach(h => { sceneCount[h.sceneId] = (sceneCount[h.sceneId] || 0) + 1; });
      Object.entries(sceneCount).forEach(([id, count]) => {
        scores[parseInt(id)] += count * 5;
      });
      const lastScene = history[0].sceneId;
      scores[lastScene] += 8;
    }

    const defaultScores = { 1: 10, 2: 12, 3: 12, 4: 20, 5: 18, 6: 8, 7: 0, 8: 10 };
    Object.entries(defaultScores).forEach(([id, s]) => { scores[parseInt(id)] += s; });

    let bestId = 4;
    let bestScore = -Infinity;
    SCENES.forEach(s => {
      if (scores[s.id] > bestScore) {
        bestScore = scores[s.id];
        bestId = s.id;
      }
    });

    if (age === null && !u.exams?.length && !u.occupation && !u.goal && history.length === 0) {
      const generalScenes = [1, 3, 4, 5, 8];
      return generalScenes[Math.floor(Math.random() * generalScenes.length)];
    }

    return bestId;
  }

  function startQuickPractice() {
    startTraining(5, 1, { isQuickPractice: true });
  }

  function continueLastSession() {
    const history = getHistory();
    if (history.length > 0) {
      const h = history[0];
      if (h.sceneId === 0 || h.isQuickPractice) {
        startQuickPractice();
      } else {
        startTraining(h.sceneId, state.settings.questionsPerSession);
      }
    } else {
      navigateTo('training');
    }
  }

  function runCountdown() {
    warmupMic(true);
    const container = document.getElementById('pageContainer');
    if (!container) return;
    let count = 5;
    const scene = SCENES.find(s => s.id === state.chat.sceneId);
    const tips = {5:'深呼吸，放松心情...',4:'集中注意力，准备看题...',3:'题目将自动朗读，请仔细听...',2:'理清思路，准备作答...',1:'即将开始...',0:`🎤 ${scene?.icon || ''} ${scene?.name || '训练'}即将开始！`};
    const show = () => { container.innerHTML = `<div class="countdown-overlay"><div class="countdown-scene-info">${scene?.icon || ''} ${scene?.name || '训练'}</div><div class="countdown-number">${count}</div><div class="countdown-text">${tips[count]}</div></div>`; };
    show();
    const iv = setInterval(() => { count--; if (count < 0) { clearInterval(iv); startChat(); } else show(); }, 1000);
  }

  async function startChat() {
    state.chat.status = 'ai_turn';
    state.chat.messages = [];
    state.finalTranscript = ''; state.interimTranscript = '';
    render();
    try {
      showToast('AI考官正在出题...','info');
      const q = await getAIQuestion();
      state.chat.messages.push({ role:'assistant', content:q });
      state.chat.questionCount = 1;
      render();
      const startMicAfterSpeak = () => { runPrepTime(); };
      if (state.settings.autoReadQuestion) {
        speakQuestion(q, startMicAfterSpeak);
      } else {
        startMicAfterSpeak();
      }
    } catch (err) {
      console.error(err);
      showToast('网络问题，使用备用题目','warning');
      const fb = {
        1:'请谈谈你对"为人民服务"这句话的理解，并结合基层工作实际，谈谈如何在工作中落实这一理念。',
        2:'Please introduce yourself briefly in English, including your academic background, research interests, and career plans.',
        3:'你认为作为一名新时代的人民教师，最重要的素质是什么？请结合教育教学理念谈谈你的看法。',
        4:'请做一个自我介绍，重点谈谈你的核心优势和一个能够体现你能力的具体经历（STAR法则）。',
        5:'请以"坚持的力量"为题，进行一段即兴演讲。',
        6:'在当今社会，竞争比合作更能促进个人成长。请作为正方一辩，阐述你的观点。',
        7:'小朋友，给老师讲一个关于小兔子和小乌龟比赛的故事吧~',
        8:'假设你是一场大学迎新晚会的主持人，请准备一段热情洋溢的开场白。'
      };
      const fallbackQ = fb[state.chat.sceneId]||fb[5];const fallbackTimes = {1:180,2:180,3:150,4:150,5:120,6:180,7:90,8:120};
      state.chat.timeLimit = fallbackTimes[state.chat.sceneId]||120;
      state.chat.answerTimeLeft = state.chat.timeLimit;
      state.chat.expectedWords=Math.round(state.chat.timeLimit*CONFIG.CHARS_PER_SECOND);
      state.chat.currentPrepTime=getPrepTime(state.chat.sceneId);
      state.chat.messages.push({role:'assistant',content:fallbackQ});
      state.chat.questionCount = 1;
      render();
      const startMicAfterSpeak = () => { runPrepTime(); };
      if (state.settings.autoReadQuestion) {
        speakQuestion(fallbackQ, startMicAfterSpeak);
      } else {
        startMicAfterSpeak();
      }
    }
  }

  function startMemoMode(){
    if (state.chat) { clearInterval(state.chat.timerInterval); clearInterval(state.chat.prepTimerInterval); }
    state.chat = null;
    const savedHistory = state.memoMode.memoHistory || [];
    state.memoMode={active:true,content:'',questions:[],currentIdx:0,showAnswer:false,correct:[],wrong:[],page:'home',memoHistory:savedHistory};
    closeAllModals();state.currentPage='training';render();
  }
  window.startMemoMode=startMemoMode;

  function exitMemoMode(){
    const savedHistory = state.memoMode.memoHistory || [];
    state.memoMode={active:false,content:'',questions:[],currentIdx:0,showAnswer:false,correct:[],wrong:[],page:'home',memoHistory:savedHistory};
    state.chat = null;
    closeAllModals();
    render();
  }
  window.exitMemoMode=exitMemoMode;

  const MEMO_HISTORY_KEY = 'yanqi_memo_history';
  function getMemoHistory(){ try { return JSON.parse(localStorage.getItem(MEMO_HISTORY_KEY) || '[]'); } catch(e){ return []; } }
  function saveMemoHistory(arr){ try { localStorage.setItem(MEMO_HISTORY_KEY, JSON.stringify(arr.slice(0,100))); } catch(e){} }
  function questionId(q){ return btoa(unescape(encodeURIComponent((q.q||'').slice(0,80)))).replace(/[^a-zA-Z0-9]/g,'').slice(0,24); }

  function renderMemoMode(){
    const m=state.memoMode;
    if(m.page==='history') return renderMemoHistoryPage();
    if(m.page==='detail') return renderMemoDetailPage();
    if(!m.questions.length) return renderMemoHomePage();
    return renderMemoAnswerPage();
  }

  function renderMemoHomePage(){
    const history = getMemoHistory();
    return `<div class="memo-container">
      <div class="memo-header">
        <button class="icon-btn memo-back-btn" onclick="exitMemoMode()" title="返回训练中心">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <span class="memo-title">📖 背诵小助手</span>
        <span class="memo-beta-tag">测试功能</span>
      </div>

      <div class="memo-quick-actions">
        <div class="memo-qa-card" onclick="memoGoUpload();playSound('click')">
          <div class="memo-qa-icon">📝</div>
          <div class="memo-qa-title">开始背诵</div>
          <div class="memo-qa-desc">上传文档或粘贴资料，AI自动生成背诵题</div>
        </div>
        <div class="memo-qa-card ${history.length===0?'disabled':''}" onclick="${history.length>0?`memoShowHistory();playSound('click')`:`showToast('还没有背诵记录','info')`}">
          <div class="memo-qa-icon">📊</div>
          <div class="memo-qa-title">背诵记录</div>
          <div class="memo-qa-desc">共 ${history.length} 次练习</div>
        </div>
      </div>

      <div class="memo-input-card" id="memoUploadCard">
        <div class="memo-input-tip">粘贴需要背诵的学习资料内容，或上传文档（支持 .txt / .doc / .docx / .pdf）</div>
        <textarea id="memoContentInput" class="memo-textarea" placeholder="在此粘贴资料内容，或上传文档后自动填充..."></textarea>
        <div class="memo-upload-row">
          <label class="btn btn-secondary memo-upload-btn">📁 上传文档<input type="file" accept=".txt,.doc,.docx,.pdf" style="display:none" onchange="uploadMemoFile(this.files[0])"></label>
          <span class="memo-hint" id="memoUploadHint">支持 txt/doc/docx/pdf</span>
          <button class="btn btn-primary" onclick="generateMemoQuestions()" style="margin-left:auto">✨ 生成背诵题</button>
        </div>
      </div>
    </div>`;
  }

  function renderMemoAnswerPage(){
    const m=state.memoMode;
    const q=m.questions[m.currentIdx];const total=m.questions.length;
    const tl={term:'名词解释',fill:'填空题',short:'简答题'}[q.type]||'题目';
    const ti={term:'📘',fill:'✏️',short:'💬'}[q.type]||'📝';
    return `<div class="memo-container">
      <div class="memo-header">
        <button class="icon-btn memo-back-btn" onclick="memoExitToHome()" title="返回背诵主页">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <span class="memo-title">📖 背诵小助手</span>
        <span class="memo-progress">${(m.currentIdx+1)}/${total}</span>
      </div>
      <div class="memo-stats-bar">
        <span class="memo-stat memo-stat-correct">✅ 已掌握 ${m.correct.length}</span>
        <span class="memo-stat memo-stat-wrong">❌ 待复习 ${m.wrong.length}</span>
      </div>
      <div class="memo-card">
        <div class="memo-card-inner">
          <div class="memo-card-front" ${m.showAnswer?'hidden':''}>
            <div class="memo-q-type"><span>${ti}</span><span>${tl}</span></div>
            <div class="memo-q-text">${escapeHtml(q.q)}</div>
            <button class="btn btn-primary memo-reveal-btn" onclick="memoRevealAnswer()">👀 查看答案</button>
          </div>
          <div class="memo-card-back" ${m.showAnswer?'':'hidden'}>
            <div class="memo-a-label">参考答案：</div>
            <div class="memo-a-text">${escapeHtml(q.answer)}</div>
            <div class="memo-rate-row">
              <button class="btn btn-success" onclick="memoMarkAnswer(true)">✅ 已掌握</button>
              <button class="btn btn-danger" onclick="memoMarkAnswer(false)">❌ 需复习</button>
            </div>
          </div>
        </div>
      </div>
      <div class="memo-nav-row">
        <button class="btn btn-secondary" onclick="memoPrev()" ${(m.currentIdx===0?'disabled':'')}>← 上一题</button>
        <button class="btn btn-secondary" onclick="memoFinish()">🏁 结束练习</button>
        <button class="btn btn-secondary" onclick="memoNext()">下一题 →</button>
      </div>
    </div>`;
  }

  function renderMemoHistoryPage(){
    const history = getMemoHistory();
    return `<div class="memo-container">
      <div class="memo-header">
        <button class="icon-btn memo-back-btn" onclick="memoGoHome()" title="返回背诵主页">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <span class="memo-title">📊 背诵记录</span>
      </div>
      ${history.length===0?`<div class="memo-empty">暂无背诵记录</div>`:
        `<div class="memo-history-list">${history.map((h,i)=>`<div class="memo-history-item" onclick="memoShowDetail(${i})">
          <div class="memo-hi-icon">📖</div>
          <div class="memo-hi-content">
            <div class="memo-hi-title">${escapeHtml(h.contentTitle||'背诵练习')}</div>
            <div class="memo-hi-meta">${h.date} · ${h.totalQuestions}题 · 正确率${h.accuracy}%</div>
          </div>
          <div class="memo-hi-score">${h.accuracy}%</div>
        </div>`).join('')}</div>`}
      <div class="memo-nav-row" style="margin-top:16px">
        <button class="btn btn-secondary" onclick="memoGoHome()">← 返回主页</button>
      </div>
    </div>`;
  }

  function renderMemoDetailPage(){
    const history = getMemoHistory();
    const h = history[state.memoMode.detailIdx];
    if(!h){ state.memoMode.page='history'; return renderMemoHistoryPage(); }
    return `<div class="memo-container">
      <div class="memo-header">
        <button class="icon-btn memo-back-btn" onclick="memoShowHistory()" title="返回记录列表">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <span class="memo-title">📋 练习详情</span>
      </div>
      <div class="memo-detail-meta">${h.date} · ${h.totalQuestions}题 · 正确率${h.accuracy}%</div>
      <div class="memo-detail-list">
        ${(h.questions||[]).map((q,i)=>{
          const isCorrect = h.correctIds && h.correctIds.includes(questionId(q));
          return `<div class="memo-detail-q ${isCorrect?'correct':'wrong'}">
            <div class="memo-dq-head"><span>第${i+1}题</span><span>${isCorrect?'✅':'❌'}</span></div>
            <div class="memo-dq-q">${escapeHtml(q.q||'')}</div>
            <div class="memo-dq-a">${escapeHtml(q.answer||'')}</div>
          </div>`;
        }).join('')}
      </div>
      <div class="memo-nav-row" style="margin-top:16px">
        <button class="btn btn-secondary" onclick="memoShowHistory()">← 返回列表</button>
        <button class="btn btn-primary" onclick="memoGoHome()">返回主页</button>
      </div>
    </div>`;
  }

  function memoGoUpload(){ state.memoMode.page='home'; const c=document.getElementById('memoUploadCard'); if(c){ c.scrollIntoView({behavior:'smooth'}); const ta=document.getElementById('memoContentInput'); if(ta) setTimeout(()=>ta.focus(),300); } }
  window.memoGoUpload=memoGoUpload;
  function memoShowHistory(){ state.memoMode.page='history'; render(); }
  window.memoShowHistory=memoShowHistory;
  function memoShowDetail(idx){ state.memoMode.page='detail'; state.memoMode.detailIdx=idx; render(); }
  window.memoShowDetail=memoShowDetail;
  function memoGoHome(){ state.memoMode.page='home'; render(); }
  window.memoGoHome=memoGoHome;
  function memoExitToHome(){ state.memoMode.questions=[]; state.memoMode.currentIdx=0; state.memoMode.showAnswer=false; state.memoMode.correct=[]; state.memoMode.wrong=[]; state.memoMode.page='home'; render(); }
  window.memoExitToHome=memoExitToHome;

  function uploadMemoFile(file){
    if(!file) return;
    const name=file.name||''; const ext=name.split('.').pop().toLowerCase();
    const hint=document.getElementById('memoUploadHint');
    if(hint){ hint.textContent='解析中...'; }
    if(ext==='txt'){
      const reader=new FileReader();
      reader.onload=e=>{ const ta=document.getElementById('memoContentInput'); if(ta)ta.value=e.target.result; if(hint)hint.textContent='已载入 '+name; showToast('文件已载入','success'); };
      reader.onerror=()=>{ if(hint)hint.textContent='读取失败'; showToast('文件读取失败','error'); };
      reader.readAsText(file,'utf-8');
      return;
    }
    if(ext==='pdf'){
      parsePdfFile(file).then(text=>{
        fillMemoText(text,name,hint);
      }).catch(err=>{
        if(hint)hint.textContent='解析失败';
        showToast('PDF解析失败，请手动复制文本粘贴','warning',5000);
      });
      return;
    }
    if(ext==='doc'||ext==='docx'){
      parseDocFile(file,ext).then(text=>{
        fillMemoText(text,name,hint);
      }).catch(err=>{
        if(hint)hint.textContent='解析失败';
        showToast('文档解析失败，请手动复制文本粘贴','warning',5000);
      });
      return;
    }
    if(hint)hint.textContent='不支持的格式';
    showToast('不支持的文件格式，请上传 txt/doc/docx/pdf','error');
  }
  window.uploadMemoFile=uploadMemoFile;

  function fillMemoText(text,name,hint){
    const ta=document.getElementById('memoContentInput');
    if(ta) ta.value=text;
    if(hint) hint.textContent='已载入 '+name;
    if(text && text.trim().length>10) showToast('文档解析成功，共'+text.length+'字','success');
    else showToast('文档内容为空，请手动粘贴','warning');
  }

  let pdfjsLoaded = false;
  async function ensurePdfjs(){
    if(pdfjsLoaded || window.pdfjsLib) return;
    return new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.src='https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
      s.onload=()=>{ if(window.pdfjsLib){ window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js'; pdfjsLoaded=true; resolve(); } else reject(new Error('pdfjs加载失败')); };
      s.onerror=()=>reject(new Error('pdfjs加载失败'));
      document.head.appendChild(s);
    });
  }
  async function parsePdfFile(file){
    await ensurePdfjs();
    const buf=await file.arrayBuffer();
    const pdf=await window.pdfjsLib.getDocument({data:buf}).promise;
    let text='';
    for(let i=1;i<=pdf.numPages;i++){
      const page=await pdf.getPage(i);
      const content=await page.getTextContent();
      text+=content.items.map(it=>it.str).join(' ')+'\n';
    }
    return text;
  }

  let mammothLoaded = false;
  async function ensureMammoth(){
    if(mammothLoaded || window.mammoth) return;
    return new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.src='https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js';
      s.onload=()=>{ mammothLoaded=true; resolve(); };
      s.onerror=()=>reject(new Error('mammoth加载失败'));
      document.head.appendChild(s);
    });
  }
  async function parseDocFile(file,ext){
    if(ext==='docx'){
      await ensureMammoth();
      const arrayBuffer=await file.arrayBuffer();
      const result=await window.mammoth.extractRawText({arrayBuffer});
      return result.value||'';
    }
    return new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onload=e=>{
        try{
          const buf=new Uint8Array(e.target.result);
          let text='';
          for(let i=0;i<buf.length;i++){
            const c=buf[i];
            if(c>=32&&c<127) text+=String.fromCharCode(c);
            else if(c===10||c===13) text+='\n';
          }
          text=text.replace(/[^\u0020-\u007e\u4e00-\u9fff\u3000-\u303f\n]/g,' ').replace(/ {3,}/g,'  ');
          resolve(text.trim());
        }catch(err){ reject(err); }
      };
      reader.onerror=()=>reject(new Error('读取失败'));
      reader.readAsArrayBuffer(file);
    });
  }

  async function generateMemoQuestions(){
    const ta=document.getElementById('memoContentInput');const txt=ta?ta.value.trim():'';
    if(txt.length<20){showToast('内容太短，请输入更多资料');return;}
    state.memoMode.content=txt;showToast('AI正在生成题目...','info');
    try{
      const sysP='你是一位背诵辅助助手。根据用户提供的学习资料，生成帮助记忆的练习题。严格输出JSON格式：{"questions":[{"type":"term","q":"术语名词","answer":"完整定义解释"},{"type":"fill","q":"填空题干，用____表示空缺","answer":"空缺内容"},{"type":"short","q":"简答题题干","answer":"参考答案要点"}]}。生成5-10道题，覆盖资料中的重点知识，按题目类型混合。不要过于简单，要真正考察对知识的掌握。';
      const usrP='学习资料如下：\n'+txt.substring(0,5000);
      const res=await callDeepSeek([{role:'system',content:sysP},{role:'user',content:usrP}],{temperature:0.7,maxTokens:4000});
      const js=res.match(/\{[\s\S]*\}/);
      if(js){const obj=JSON.parse(js[0]);state.memoMode.questions=obj.questions||[];state.memoMode.currentIdx=0;state.memoMode.showAnswer=false;state.memoMode.correct=[];state.memoMode.wrong=[];state.memoMode.page='answer';render();showToast('已生成'+state.memoMode.questions.length+'道题','success');}
      else{showToast('生成失败，请重试','error');}
    }catch(e){showToast('生成失败：'+e.message,'error');}
  }
  window.generateMemoQuestions=generateMemoQuestions;

  function memoRevealAnswer(){state.memoMode.showAnswer=true;render();}
  window.memoRevealAnswer=memoRevealAnswer;
  function memoPrev(){if(state.memoMode.currentIdx>0){state.memoMode.currentIdx--;state.memoMode.showAnswer=false;render();}}
  window.memoPrev=memoPrev;

  function memoMarkAnswer(correct){
    const q=state.memoMode.questions[state.memoMode.currentIdx];
    if(correct){state.memoMode.correct.push(q);
    }else{state.memoMode.wrong.push(q);}
    memoNext();
  }
  window.memoMarkAnswer=memoMarkAnswer;

  function memoNext(){
    if(state.memoMode.currentIdx<state.memoMode.questions.length-1){state.memoMode.currentIdx++;state.memoMode.showAnswer=false;}
    else{
      if(state.memoMode.wrong.length>0){
        showToast('将复习'+state.memoMode.wrong.length+'道错题','info');
        state.memoMode.questions=[...state.memoMode.wrong];state.memoMode.wrong=[];state.memoMode.currentIdx=0;state.memoMode.showAnswer=false;
      } else {
        memoSaveHistory();
        showToast('太棒了！全部掌握🎉','success');
        playSound('achievement');
        return;
      }
    }
    render();
  }
  window.memoNext=memoNext;

  function memoFinish(){
    if(state.memoMode.questions.length===0){ memoExitToHome(); return; }
    memoSaveHistory();
    showToast('练习已结束，记录已保存','info');
    memoExitToHome();
  }
  window.memoFinish=memoFinish;

  function memoSaveHistory(){
    const m=state.memoMode;
    if(!m.questions.length && !m.correct.length) return;
    const total = m.questions.length > m.correct.length + m.wrong.length ? m.correct.length + m.wrong.length : m.questions.length;
    if(total===0) return;
    const accuracy = total>0 ? Math.round(m.correct.length/total*100) : 0;
    const correctIds = m.correct.map(q=>questionId(q));
    const contentTitle = (m.content||'').substring(0,30).replace(/\n/g,' ') || '背诵练习';
    const record = {
      id: Date.now(),
      date: new Date().toLocaleString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}),
      contentTitle: contentTitle,
      totalQuestions: total,
      correctCount: m.correct.length,
      wrongCount: m.wrong.length,
      accuracy: accuracy,
      questions: m.questions.slice(),
      correctIds: correctIds
    };
    const history = getMemoHistory();
    history.unshift(record);
    saveMemoHistory(history);
    state.memoMode.memoHistory = history;
  }
  window.memoSaveHistory = memoSaveHistory;

  if(!state.memoMode.memoHistory || state.memoMode.memoHistory.length===0){
    state.memoMode.memoHistory = getMemoHistory();
  }
  function startVoiceWithRetry() {
    if (state.micStarting) return;
    if (state.isSpeaking) {
      setTimeout(() => startVoiceWithRetry(), 500);
      return;
    }
    if (state.micPermissionDenied) {
      const inp = document.getElementById('chatInput');
      if (inp) inp.placeholder = '请手动点击🎤按钮开启语音';
      return;
    }
    startVoice();
    let checks = 0;
    const checkStarted = setInterval(() => {
      checks++;
      if (state.voiceRecognition) {
        clearInterval(checkStarted);
        return;
      }
      if (state.micPermissionDenied || checks > 8 || state.userStoppedVoice) {
        clearInterval(checkStarted);
        if (!state.voiceRecognition && state.chat?.status === 'answering') {
          showToast('自动开麦失败，请手动点击 🎤 开启', 'warning', 5000);
          const inp = document.getElementById('chatInput');
          if (inp) inp.placeholder = '点击左侧🎤手动开启语音后开始作答';
        }
      }
    }, 500);
  }

  const QUICK_PRACTICE_PROMPT = '你是一位温和且有经验的表达能力训练教练，面向各行各业、各年龄段的普通人。请给出一道适合即兴回答的开放式问题，话题涵盖日常生活、社会现象、职场沟通、个人成长、价值观思考、人际关系、热点看法、情景应对等方面。题目要难度适中，不需要任何专业背景知识也能作答，适合普通人练习临场组织语言和表达观点的能力。题目要有趣味性和思辨性，不要太简单也不要太学术。避免只针对特定职业、特定考试或特定年龄段的题目。\n\n【重要】请在问题前用JSON格式输出：{"prepTime":准备秒数(5-30，30的倍数或5/10/15/20均可),"time":答题秒数(必须是30的倍数，60-240之间),"words":建议字数(整数),"question":"题目内容"}\n根据题目难度动态分配时间：简单快速反应题（如"你最喜欢的季节"）time=60-90；中等开放题（如"谈谈你对远程办公的看法"）time=90-150；需要深入分析或多角度思考的题time=150-240。';

  async function getAIQuestion() {
    const scene = SCENES.find(s=>s.id===state.chat.sceneId) || {name:'即兴速练'};
    const strict = state.settings.strictMode ? '问题要有挑战性，不要太简单太泛泛，要能真正考察出考生水平。' : '问题难度适中，鼓励为主。';
    let sysPrompt = '';

    if (state.chat.isQuickPractice) {
      sysPrompt = QUICK_PRACTICE_PROMPT;
    } else {
      sysPrompt = SCENE_PROMPTS[state.chat.sceneId] || '';
    }

    if (state.chat.sceneId === 4 && state.chat.jobContext) {
      const { position, bio } = state.chat.jobContext;
      sysPrompt += `\n\n【本次面试岗位信息】\n目标职位：${position || '通用岗位'}\n岗位描述/工作简介：${bio || '无'}\n\n请针对"${position}"这一岗位进行面试提问，题目必须贴合该岗位实际工作场景，考核该岗位核心能力（如专业技能、业务理解、岗位经验、软技能等），不要问通用的空泛问题。第一题可先请考生做自我介绍并说明为什么应聘该岗位，后续问题围绕岗位展开深入追问。`;
    }

    if (state.chat.sceneId === 3 && state.chat.teachContext) {
      const { stage, subject } = state.chat.teachContext;
      const stageName = TEACH_STAGES.find(s => s.id === stage)?.name || '中小学';
      sysPrompt += `\n\n【本次教资面试信息】\n学段：${stageName}\n报考科目：${subject || '不限科目'}\n\n请针对${stageName}${subject || ''}科目出面试题。题目要贴合该学段该学科的实际教学场景，涵盖结构化问答、教学情境应对、班级管理、教学设计、师德师风等方面。如果是结构化题可以不限学科，但要考虑${stageName}学生的特点；如果是学科相关题，要紧扣${subject || '该学科'}的教学内容和教学法。`;
    }

    if (state.chat.sceneId === 2 && state.chat.postgradContext) {
      const { major, direction } = state.chat.postgradContext;
      sysPrompt += `\n\n【本次考研复试信息】\n报考专业：${major || '本专业'}\n研究方向/报考院校：${direction || '无'}\n\n请围绕"${major}"专业出复试题目。第一题可请考生做自我介绍（含本科背景、科研经历、报考动机），后续题目涵盖：专业基础知识、专业前沿热点、科研经历/毕业设计、读研规划、英语口语（可以出1道英文题让考生用英文回答）等。题目要真正考察该专业的学术素养和培养潜力，不要问通用空泛的问题。`;
    }

    if (state.chat.sceneId === 1 && state.chat.civilContext) {
      const { position, custom } = state.chat.civilContext;
      if (position && position !== 'random') {
        const pos = CIVIL_POSITIONS.find(p => p.id === position);
        sysPrompt += `\n\n【本次公务员面试岗位信息】\n岗位类型：${pos ? pos.name : position}\n岗位说明：${pos ? pos.desc : ''}\n${custom ? '补充说明：' + custom : ''}\n\n请针对该岗位出结构化面试题，题目要贴合该岗位的实际工作场景和核心能力要求（综合分析、应急应变、人际关系、组织协调、岗位匹配等），不要问放之四海而皆准的空泛题目。`;
      }
    }

    if ([5, 7, 8].includes(state.chat.sceneId)) {
      if (state.chat.topicContext === 'random') {
        let topicList = SPEECH_TOPICS; if(state.chat.sceneId===7)topicList=KIDS_TOPICS; else if(state.chat.sceneId===8)topicList=HOST_TOPICS; const topic = topicList[Math.floor(Math.random() * topicList.length)];
        sysPrompt += `\n\n【本次${scene.name}主题】主题方向：${topic}。请围绕该主题方向出题。`;
      } else if (state.chat.topicContext === 'custom' && state.chat.customTopic) {
        sysPrompt += `\n\n【用户指定主题】${state.chat.customTopic}\n\n请围绕用户指定的"${state.chat.customTopic}"这一主题出题。`;
      } else if (!state.chat.topicContext) {
        let topicList = SPEECH_TOPICS; if(state.chat.sceneId===7)topicList=KIDS_TOPICS; else if(state.chat.sceneId===8)topicList=HOST_TOPICS; const topic = topicList[Math.floor(Math.random() * topicList.length)];
        sysPrompt += `\n\n【本次${scene.name}主题】主题方向：${topic}。请围绕该主题方向出题。`;
      }
    }

    const timeJsonInstruction = state.chat.isQuickPractice
      ? ''
      : state.chat.sceneId===7
      ? '\n\n【重要】请在问题前用JSON格式输出：{"prepTime":准备秒数(5-15),"time":答题秒数(60-120，小朋友注意力有限不超120秒),"words":建议字数(80-200),"question":"题目内容"}\n注意：少儿口才训练，题目简单有趣，答题60-120秒。'
      : '\n\n【重要】请在问题前用JSON格式输出：{"prepTime":准备秒数(5-60),"time":答题秒数(60-300，任意整数，无需30倍数),"words":建议字数(整数),"question":"题目内容"}\n简单快速反应题prepTime=5-10、time=60-90、words=100-180；标准面试题prepTime=15-30、time=120-180、words=300-500；复杂分析/多问题prepTime=20-45、time=180-300、words=500-800。';
    const prompt = sysPrompt + `\n\n请提出一个${strict}` + timeJsonInstruction;
    const raw = (await callDeepSeek([{role:'system',content:prompt},...state.chat.messages.slice(-6)],{temperature:0.85,maxTokens:512})).trim();
    let questionText = raw;
    let recommendedTime = 0; let recomPrep = 0; let recomWords = 0;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.question && typeof parsed.question === 'string') questionText = parsed.question;
        if (parsed.time && typeof parsed.time === 'number') recommendedTime = parsed.time;
        if (parsed.prepTime && typeof parsed.prepTime === 'number') recomPrep = parsed.prepTime;
        if (parsed.words && typeof parsed.words === 'number') recomWords = parsed.words;
      }
    } catch(e) {}
    if (!recommendedTime) { const tm=raw.match(/"time"\s*:\s*(\d+)/); if(tm)recommendedTime=parseInt(tm[1],10); }
    if (!recomPrep) { const pm=raw.match(/"prepTime"\s*:\s*(\d+)/); if(pm)recomPrep=parseInt(pm[1],10); }
    if (!recomWords) { const wm=raw.match(/"words"\s*:\s*(\d+)/); if(wm)recomWords=parseInt(wm[1],10); }
    if (recommendedTime) {
      let t=Math.max(60,Math.min(300,recommendedTime));
      if(state.chat.isQuickPractice){t=Math.round(t/30)*30;t=Math.max(60,Math.min(240,t));}
      recommendedTime=t;
      state.chat.timeLimit=t; state.chat.answerTimeLeft=t;
    }
    else { const sc=SCENES.find(s=>s.id===state.chat.sceneId); const dt=state.chat.isQuickPractice?120:(sc?.timeLimit||120); state.chat.timeLimit=dt; state.chat.answerTimeLeft=dt; }
    if(recomPrep>=5&&recomPrep<=60){state.chat.prepTime=recomPrep;state.chat.currentPrepTime=recomPrep;}else{state.chat.currentPrepTime=getPrepTime(state.chat.sceneId);}
    state.chat.expectedWords=recomWords>0?recomWords:Math.round(state.chat.timeLimit*CONFIG.CHARS_PER_SECOND);
    state.chat.currentPrepTime=state.chat.currentPrepTime||getPrepTime(state.chat.sceneId);
    state.chat.expectedWords=state.chat.expectedWords||Math.round(state.chat.timeLimit*CONFIG.CHARS_PER_SECOND);
    return questionText.replace(/^["']|["']$/g, '').trim();
  }

  function pauseTimer() {
    if(!state.chat||state.chat.status!=='answering')return;
    state.chat.paused = true;
    state.timerPaused = true;
    state.pausedTimeLeft = state.chat.answerTimeLeft;
    clearInterval(state.chat.timerInterval);
    stopVoice();
    stopSpeak();
    state.countdownSpeaking = false;
    try { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); } catch(e) {}
    render();
    showToast('⏸ 计时已暂停','info');
  }

  function resumeTimer() {
    if(!state.chat||!state.chat.paused)return;
    state.timerPaused = false;
    state.chat.startTime = Date.now() - (state.chat.timeLimit - state.pausedTimeLeft)*1000;
    render();
    startAnswerTimer();
    if(!state.micPermissionDenied) startVoiceWithRetry();
    showToast('▶️ 继续作答','info');
  }

  function speakCountdown() {
    if (!('speechSynthesis' in window)) return;
    if (state.chat.paused) return;
    state.countdownSpeaking = true;
    if (state.voiceRecognition) {
      try { state.voiceRecognition.onend = null; state.voiceRecognition.stop(); } catch(e) {}
      state.voiceRecognition = null;
    }
    const vb = document.getElementById('voiceBtn');
    if (vb) vb.classList.remove('active');
    const nums = ['十','九','八','七','六','五','四','三','二','一'];
    let idx = 0;
    const speakOne = () => {
      if (idx >= nums.length) {
        state.countdownSpeaking = false;
        if (!state.userStoppedVoice && state.chat?.status === 'answering' && !state.chat.paused && state.chat.answerTimeLeft > 0) {
          setTimeout(() => {
            if (!state.userStoppedVoice && !state.chat.paused && state.chat?.status === 'answering' && state.chat.answerTimeLeft > 0) {
              startVoice();
            }
          }, 200);
        }
        return;
      }
      if (!state.chat || state.chat.status !== 'answering' || state.chat.paused) {
        state.countdownSpeaking = false;
        try { window.speechSynthesis.cancel(); } catch(e) {}
        return;
      }
      const u = new SpeechSynthesisUtterance(nums[idx]);
      u.lang = 'zh-CN';
      u.volume = 0.35;
      u.rate = 1.8;
      u.pitch = 1.0;
      const voices = window.speechSynthesis.getVoices();
      const zh = voices.find(v => v.lang.startsWith('zh'));
      if (zh) u.voice = zh;
      idx++;
      let spoken = false;
      u.onend = () => { if(!spoken){spoken=true;setTimeout(speakOne, 400);} };
      u.onerror = () => { if(!spoken){spoken=true;setTimeout(speakOne, 400);} };
      try { window.speechSynthesis.speak(u); } catch(e) { idx++; setTimeout(speakOne, 400); }
    };
    setTimeout(speakOne, 100);
  }

  function startAnswerTimer() {
    if(!state.chat)return;
    clearInterval(state.chat.timerInterval);
    state.chat.answerTimeLeft = state.chat.paused ? state.pausedTimeLeft : state.chat.timeLimit;
    state.chat.paused = false;
    updateTimerDisplay(); updateWordCount();
    state.chat.timerInterval = setInterval(()=>{
      if(!state.chat||state.chat.status!=='answering'||state.chat.paused){clearInterval(state.chat.timerInterval);return;}
      state.chat.answerTimeLeft--;
      updateTimerDisplay();updateWordCount();
      if(state.chat.answerTimeLeft<=0){clearInterval(state.chat.timerInterval);showToast('⏰ 时间到！自动提交','warning',5000);finishAnswer(true);}
      else if(state.chat.answerTimeLeft===30)showToast('⏱ 还剩30秒','info');
      else if(state.chat.answerTimeLeft===10){showToast('⚠️ 最后10秒！','warning');playSound('tick');speakCountdown();}
    },1000);
  }

  function updateTimerDisplay() {
    const t=document.getElementById('chatTimer');if(!t||!state.chat)return;
    if (state.isSpeaking) { t.textContent = '🔊 听题中'; t.classList.add('speaking'); return; }
    t.textContent=formatTime(state.chat.answerTimeLeft);
    t.classList.remove('warning','danger','paused','speaking','prepping');
    if(state.chat.paused){t.classList.add('paused');return;}
    const ratio=state.chat.answerTimeLeft/state.chat.timeLimit;
    if(ratio<=0.15)t.classList.add('danger');else if(ratio<=0.3)t.classList.add('warning');
  }

  function updateWordCount() {
    const inp=document.getElementById('chatInput'),wc=document.getElementById('wordCount');
    if(!inp||!wc)return;
    const text=inp.value.trim(),len=text.length;
    const expected=Math.round(state.chat.timeLimit*CONFIG.CHARS_PER_SECOND);
    let status='',color='var(--color-text-dim)';
    if(len===0){color='var(--color-text-dim)';}
    else if(len<expected*0.15){color='var(--color-danger)';status='（内容严重不足！）';}
    else if(len<expected*0.30){color='var(--color-danger)';status='（内容过少）';}
    else if(len<expected*0.50){color='var(--color-warning)';status='（内容偏短）';}
    else if(len<expected*0.70){color='var(--color-accent)';status='（继续补充）';}
    else if(len<expected*0.90){color='var(--color-success)';status='（内容较好）';}
    else{color='var(--color-success)';status='（内容充足）';}
    wc.innerHTML=`<span style="color:${color}">${len}字</span>/建议${expected}字 ${status}`;
  }

  function renderChat() {
    const scene=SCENES.find(s=>s.id===state.chat.sceneId) || {name:'即兴速练',icon:'⚡',color:'rgba(244,162,97,0.15)'};
    const expectedWords=state.chat.expectedWords||Math.round(state.chat.timeLimit*CONFIG.CHARS_PER_SECOND);
    const voiceActive=!!state.voiceRecognition;
    return `
      <div class="chat-container">
        <div class="chat-header">
          <button class="chat-back" onclick="exitChat()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg></button>
          <div class="chat-scene-info">
            <div class="chat-scene-name">${scene?scene.icon+' '+scene.name:'训练'}${state.chat.jobContext?`<span class="chat-job-tag">💼 ${escapeHtml(state.chat.jobContext.position)}</span>`:''}</div>
            <div class="chat-progress">第${state.chat.questionCount}/${state.chat.totalQuestions}题 · <span style="color:var(--color-success)">答完点击「✓ 作答完毕」即可提交</span></div>
          </div>
          <div class="chat-header-right">
            ${state.chat.status==='answering' && !state.chat.lastScore && !state.isSpeaking && !state.chat.requestingMic ? `
              <button class="timer-pause-btn" onclick="${state.chat.paused?'resumeTimer()':'pauseTimer()'}" title="${state.chat.paused?'继续':'暂停'}">
                ${state.chat.paused?'▶':'⏸'}
              </button>`:''}
            <div class="chat-timer ${state.chat.paused?'paused':''} ${state.isSpeaking?'speaking':''} ${state.chat.status==='preparing'?'prepping':''}" id="chatTimer">${state.chat.status==='preparing' ? '⏳ 准备 '+state.chat.prepTimeLeft+'s' : state.chat.status==='readyToAnswer' ? '🎤 准备就绪' : state.chat.requestingMic ? '🎤 连接中' : state.isSpeaking ? '🔊 听题中' : formatTime(state.chat.answerTimeLeft)}</div>
          </div>
        </div>

        ${state.chat.status==='preparing'?`<div class="voice-status prepping"><span>🧠</span><span>思考准备中 <strong>${state.chat.prepTimeLeft}秒</strong>，请快速构思答题框架</span><button class="btn btn-secondary btn-sm" onclick="showAnswerTemplates()" style="margin-left:8px;padding:6px 12px;font-size:13px">📐 模板</button><button class="btn btn-accent btn-sm" onclick="skipPrepAndStart()" style="padding:6px 14px;font-size:13px">跳过准备 →</button></div>`:''}
        ${state.chat.status==='readyToAnswer'?`<div class="voice-status" style="background:rgba(82,183,136,0.15);border-color:rgba(82,183,136,0.3)"><span>✅</span><span>准备时间结束，点击下方按钮开始作答</span></div>`:''}
        ${state.chat.paused ? `<div class="voice-status" style="background:rgba(116,192,252,0.15);border-color:rgba(116,192,252,0.3)"><span>⏸</span><span>计时已暂停，麦克风已关闭。点击▶继续作答</span></div>`:''}
        ${state.isSpeaking && state.chat.status!=='preparing' ? `<div class="voice-status" style="background:rgba(244,162,97,0.15);border-color:rgba(244,162,97,0.3)"><span>🔊</span><span>正在朗读题目...请仔细听题</span></div>`:''}
        ${state.chat.requestingMic?`<div class="voice-status" style="background:rgba(116,192,252,0.15);border-color:rgba(116,192,252,0.3)"><span>🎤</span><span>正在请求麦克风权限，请在浏览器弹窗中点击"允许"...</span></div>`:''}
        ${voiceActive&&state.chat.status==='answering'&&!state.chat.paused&&!state.isSpeaking&&!state.chat.requestingMic?`<div class="voice-status recording"><div class="voice-wave"><span></span><span></span><span></span><span></span><span></span></div><span>🎤 麦克风已开启，正在聆听...直接作答即可</span></div>`:''}
        ${state.chat.status==='answering'&&!voiceActive&&!state.chat.paused&&!state.chat.lastScore&&!state.isSpeaking&&!state.chat.requestingMic?`<div class="voice-status"><span>🎤</span><span>点击左侧麦克风按钮开启语音作答</span></div>`:''}

        <div class="chat-messages" id="chatMessages">
          ${state.chat.messages.map((m,i)=>{
            let html = renderMessage(m);
            if (m.role==='assistant' && i===state.chat.messages.length-1 && state.chat.questionCount>0) {
              const tl = state.chat.timeLimit;
              const mins = Math.floor(tl/60), secs = tl%60;
              const timeStr = secs>0 ? `${mins}分${secs}秒` : `${mins}分钟`;
              html += `<div class="question-time-hint">⏱ 准备${state.chat.currentPrepTime||getPrepTime(state.chat.sceneId)}秒 · 作答${timeStr} · 建议约${expectedWords}字</div>`;
            }
            return html;
          }).join('')}
          ${(state.chat.status==='ai_turn'||state.chat.status==='scoring')?`<div class="message ai"><div class="message-avatar">🤖</div><div class="message-bubble"><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div></div>`:''}
          ${state.chat.status==='readyToAnswer'?`<div class="ready-to-answer-card"><div class="ready-icon">🎤</div><div class="ready-title">准备就绪</div><div class="ready-desc">点击下方按钮开始作答，系统将自动打开麦克风</div><button class="btn btn-primary btn-lg ready-start-btn" onclick="startAnsweringNow()">🎤 开始作答</button></div>`:''}
          ${state.chat.requestingMic?`<div class="ready-to-answer-card" style="border-color:rgba(116,192,252,0.4);background:linear-gradient(135deg,rgba(116,192,252,0.08),rgba(116,192,252,0.03));animation:none"><div class="ready-icon" style="animation:pulse 1s ease-in-out infinite">🎤</div><div class="ready-title" style="color:var(--color-info,#339af0);font-size:18px">正在请求麦克风权限...</div><div class="ready-desc">请在浏览器弹窗中点击"允许"以启用语音输入<br>如未弹出权限窗口，请稍候...或刷新页面重试</div></div>`:''}
          ${state.chat.lastScore?renderScoreCard(state.chat.lastScore):''}
        </div>

        ${state.chat.status==='answering'&&!state.chat.lastScore&&!state.chat.paused&&!state.chat.requestingMic?`
          <div class="chat-input-area">
            <div class="input-hint"><span id="wordCount" style="color:var(--color-text-dim)">0字/建议${expectedWords}字</span>&nbsp;·&nbsp;答完点「作答完毕」或说"回答完毕"&nbsp;·&nbsp;⏸可随时暂停</div>
            <div class="input-wrapper">
              <button class="input-action-btn ${voiceActive?'active':''}" id="voiceBtn" onclick="toggleVoice()" title="语音输入"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg></button>
              <button class="input-action-btn" onclick="pauseTimer()" title="暂停作答" style="font-size:18px">⏸</button>
              <button class="input-action-btn" onclick="showAnswerTemplates()" title="答题结构模板" style="font-size:18px">📐</button>
              <textarea class="chat-input" id="chatInput" placeholder="🎤 开启麦克风后直接说话答题，识别文字将显示在此" rows="1" readonly style="cursor:default;background:var(--color-bg-card,#f8f9fa)"></textarea>
              <button class="finish-btn" onclick="finishAnswer(false)" title="作答完毕"><span>✓</span><span>作答完毕</span></button>
            </div>
          </div>`:''}
        ${state.chat.paused?`<div class="chat-input-area paused-area"><button class="btn btn-primary" style="max-width:280px;margin:0 auto" onclick="resumeTimer()">▶️ 继续作答</button></div>`:''}
      </div>`;
  }

  function renderMessage(m){
    const isAI = m.role === 'assistant';
    const speakBtn = isAI ? `<button class="speak-replay-btn" onclick="replaySpeak('${escapeHtml(m.content).replace(/'/g,"\\'")}')" title="重新朗读">🔊</button>` : '';
    return `<div class="message ${isAI?'ai':'user'}"><div class="message-avatar">${isAI?'🤖':'👤'}</div><div class="message-bubble"><div class="message-text">${escapeHtml(m.content)}</div>${speakBtn}</div></div>`;
  }

  function renderScoreCard(s){
    const _g=getScoreGrade(s.totalScore);const gradeClass=_g.cls;const gradeText=_g.label;
    const expectedWords=Math.round(state.chat.timeLimit*CONFIG.CHARS_PER_SECOND);
    const answerLen=state.chat.messages.filter(m=>m.role==='user').pop()?.content.length||0;
    const duration=s.answerDuration||0;
    const lengthRatio=answerLen/expectedWords;
    const penalty=getLengthPenalty(answerLen,expectedWords);
    const wordsPerMin=answerLen>0&&duration>0?Math.round(answerLen/duration*60):0;
    const lengthCritical=['CRITICAL','SEVERE','EMPTY'].includes(penalty.level);
    const lengthWarning=['BAD','SHORT'].includes(penalty.level);
    const isFav = isQuestionFavorited();
    let progressHtml = '';
    const prevScore = state.chat.scores.length >= 2 ? state.chat.scores[state.chat.scores.length-2]?.totalScore : null;
    if (prevScore !== null && prevScore !== undefined) {
      const diff = s.totalScore - prevScore;
      if (diff > 0) progressHtml += '<div class="score-progress-item up">📈 比上一题提高了 +' + diff + '分</div>';
      else if (diff < 0) progressHtml += '<div class="score-progress-item down">📉 比上一题下降了 ' + diff + '分</div>';
      else progressHtml += '<div class="score-progress-item same">➡️ 与上一题持平</div>';
    }
    try {
      const history = getHistory();
      const sameSceneHistory = history.filter(h => h.sceneId === state.chat.sceneId).slice(0, 5);
      if (sameSceneHistory.length > 0) {
        const histAvg = Math.round(sameSceneHistory.reduce((sum,h) => sum + (h.avgScore||0), 0) / sameSceneHistory.length);
        const histDiff = s.totalScore - histAvg;
        if (histDiff > 0) progressHtml += '<div class="score-progress-item up">🎯 相比最近练习平均分提高了 +' + histDiff + '分</div>';
        else if (histDiff < 0) progressHtml += '<div class="score-progress-item down">🎯 相比最近练习平均分低了 ' + Math.abs(histDiff) + '分</div>';
      }
    } catch(e) {}
    if (progressHtml) progressHtml = '<div class="score-progress">' + progressHtml + '</div>';
    return `
      <div class="score-card">
        ${s.encouragement?`<div class="encouragement-banner ${gradeClass}"><div class="eb-icon">💬</div><div class="eb-text">${escapeHtml(s.encouragement)}</div></div>`:''}
        <div class="score-header">
          <div class="score-label">本题得分</div>
          <div style="position:relative;display:inline-block;">
            <div class="score-total">${s.totalScore}<span class="score-grade-inline" style="color:${_g.color}">${_g.label}</span></div>
            <button class="favorite-star-btn ${isFav?'favorited':''}" onclick="toggleFavorite(${JSON.stringify(s).replace(/"/g,'&quot;')})" title="${isFav?'取消收藏':'收藏好题'}">${isFav?'⭐':'☆'}</button>
          </div>
          <div class="score-grade ${gradeClass}">${gradeText}</div>
          ${progressHtml}
          <div class="score-meta">
            <span>📝 ${answerLen}字</span>
            <span>⏱ ${Math.floor(duration/60)}分${duration%60}秒</span>
            ${wordsPerMin>0?`<span>🗣️ ${wordsPerMin}字/分钟</span>`:''}
            <span>📊 ${Math.round(Math.min(lengthRatio,1)*100)}%</span>
          </div>
        </div>
        ${s.strengths?`<div class="strengths-banner"><div class="sb-icon">🌟</div><div class="sb-content"><div class="sb-title">亮点优势</div><div class="sb-text">${escapeHtml(s.strengths)}</div></div></div>`:''}
        ${lengthCritical?`<div class="answer-length-warning"><span>🚫</span><div><strong>回答严重不足是本次低分主因！</strong><br>本次仅${answerLen}字，建议${expectedWords}字（达标${Math.round(lengthRatio*100)}%）。按"观点→2-3个论点+案例→总结"结构展开。</div></div>`:''}
        ${lengthWarning?`<div class="answer-length-warning"><span>⚠️</span><div><strong>回答字数不足！</strong><br>本次${answerLen}字，建议${expectedWords}字（达标${Math.round(lengthRatio*100)}%），内容不够充实。</div></div>`:''}
        <div class="score-dimensions">
          ${DIMENSIONS.map(d=>{
            const score=s.scores[d.key]||0;const comment=s.comments?.[d.key]||'';
            let scoreColor='var(--color-primary)';
            if(score>=85)scoreColor='var(--color-success)';else if(score>=70)scoreColor='var(--color-accent)';else if(score>=60)scoreColor='var(--color-info)';else scoreColor='var(--color-danger)';
            return `<div class="dimension-card"><div class="dimension-header"><span class="dimension-name">${d.name}<span class="dimension-weight">权重${d.weight}%</span></span><span class="dimension-score-big" style="color:${scoreColor}">${score}</span></div><div class="dimension-bar"><div class="dimension-fill" style="width:${Math.min(score,100)}%;background:${scoreColor}"></div></div>${comment?`<div class="dimension-comment">${escapeHtml(comment)}</div>`:''}</div>`;
          }).join('')}
        </div>
        ${s.highlights?.length?`<div class="feedback-section"><div class="feedback-title"><span style="color:var(--color-success)">✓</span><span>具体亮点</span></div><div class="feedback-list">${s.highlights.slice(0,3).map(h=>`<div class="feedback-item highlight"><div class="feedback-bullet"></div><span>${escapeHtml(h)}</span></div>`).join('')}</div></div>`:''}
        ${s.improvements?.length?`<div class="feedback-section"><div class="feedback-title"><span style="color:var(--color-warning)">!</span><span>需要改进</span></div><div class="feedback-list">${s.improvements.slice(0,5).map(i=>`<div class="feedback-item improvement"><div class="feedback-bullet"></div><span>${escapeHtml(i)}</span></div>`).join('')}</div></div>`:''}
        ${s.suggestions?.length?`<div class="feedback-section"><div class="feedback-title"><span style="color:var(--color-info)">💡</span><span>提升建议</span></div><div class="feedback-list">${s.suggestions.slice(0,4).map(sg=>`<div class="feedback-item suggestion"><div class="feedback-bullet"></div><span>${escapeHtml(sg)}</span></div>`).join('')}</div></div>`:''}
        ${s.referenceAnswer?`<div class="reference-answer-section">
          <div class="ref-answer-header">
            <span class="ref-icon">📖</span>
            <span class="ref-title">标准回答参考</span>
            <button class="ref-speak-btn" onclick="speakReferenceAnswer()" title="朗读标准回答">🔊 听示范</button>
            <button class="ref-toggle-btn" onclick="toggleRefAnswer()">展开/收起</button>
          </div>
          <div class="ref-answer-content" id="refAnswerContent" style="display:none">${escapeHtml(s.referenceAnswer)}</div>
        </div>`:''}
        ${state.chat.refAnswerLoading?`<div style="text-align:center;padding:16px;color:var(--color-text-dim)"><div class="typing-indicator" style="display:inline-flex"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div><div style="margin-top:8px;font-size:13px">AI 正在生成参考范文...</div></div>`:''}
        ${state.chat.showRefAnswer && state.chat.referenceAnswer && !s.referenceAnswer?`<div class="reference-answer-section">
          <div class="ref-answer-header">
            <span class="ref-icon">📝</span>
            <span class="ref-title">AI 参考范文</span>
            <button class="ref-speak-btn" onclick="speakReferenceAnswer()" title="朗读">🔊</button>
            <button class="ref-toggle-btn" onclick="toggleRefAnswerModal()">收起</button>
          </div>
          <div class="ref-answer-content" style="display:block">${escapeHtml(state.chat.referenceAnswer)}</div>
        </div>`:''}
        ${state.chat.followUpLoading?`<div style="text-align:center;padding:12px;color:var(--color-text-dim)"><div class="typing-indicator" style="display:inline-flex"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div><div style="margin-top:6px;font-size:13px">AI 正在生成追问...</div></div>`:''}
        <div class="score-actions" style="flex-wrap:wrap;gap:8px">
          <button class="btn btn-secondary btn-sm" onclick="generateReferenceAnswer()" title="让AI写一份参考答案">📝 参考范文</button>
          <button class="btn btn-secondary btn-sm" onclick="askFollowUp()" title="AI根据你的回答追问">🔄 AI追问</button>
          <button class="btn btn-secondary btn-sm" onclick="showAnswerTemplates()" title="查看答题结构模板">📐 答题模板</button>
          ${state.chat.questionCount<state.chat.totalQuestions?`
            <button class="btn btn-primary" onclick="nextQuestion()">下一题 →</button>
            <button class="btn btn-accent" onclick="retryQuestion()">🔁 重答本题</button>
            <button class="btn btn-secondary" onclick="exitChat()">退出训练</button>
          `:`
            <button class="btn btn-primary" onclick="finishTraining()">查看完整训练报告</button>
            <button class="btn btn-accent" onclick="retryQuestion()">🔁 重答本题</button>
            <button class="btn btn-secondary" onclick="exitChat()">退出</button>
          `}
        </div>
      </div>`;
  }

  function autoResize(el){el.style.height='auto';el.style.height=Math.min(el.scrollHeight,220)+'px';}
  function scrollToBottom(){const m=document.getElementById('chatMessages');if(m)m.scrollTop=m.scrollHeight;}

  function finishAnswer(timeUp){
    const input=document.getElementById('chatInput');
    const text=(input?.value||'').trim();
    if(state.chat.status!=='answering')return;
    const expectedWords=Math.round(state.chat.timeLimit*CONFIG.CHARS_PER_SECOND);
    if(!text||text.length<CONFIG.MIN_ANSWER_CHARS){
      if(timeUp){state.chat.messages.push({role:'user',content:text||'（时间到，未能有效作答）'});}
      else{
        if(text.length<5){showToast('回答内容太少，至少说几句话再提交','error');return;}
        if(!confirm(`回答较短（${text.length}字），建议${expectedWords}字。内容过短会直接低分，确认提交？`))return;
        state.chat.messages.push({role:'user',content:text});
      }
    }else{state.chat.messages.push({role:'user',content:text});}
    state.chat.answerDuration=Math.round((Date.now()-state.chat.startTime)/1000);
    clearInterval(state.chat.timerInterval);stopVoice();stopSpeak();
    if(input)input.value='';
    state.finalTranscript='';state.interimTranscript='';
    scoreAnswer();
  }

  async function scoreAnswer(){
    state.chat.status='scoring';render();setTimeout(scrollToBottom,50);
    let score=null;let retryCount=0;
    while(retryCount<2 && !score){
      try{
        score=await aiScoreAnswer();
      }catch(err){
        retryCount++;
        console.error(`评分失败(第${retryCount}次):`,err?.message||err);
        if(retryCount<2){
          showToast('AI评分较慢，正在重试...','info',3000);
          await new Promise(r=>setTimeout(r,1000));
        }
      }
    }
    if(score){
      state.chat.scores.push(score);state.chat.lastScore=score;state.chat.status='reviewing';
      if(score.totalScore>=80)playSound('correct');
    }else{
      showToast('AI评分较慢，正在生成评分...','info',4000);
      try{
        score=await aiScoreAnswerLite();
        state.chat.scores.push(score);state.chat.lastScore=score;state.chat.status='reviewing';
        if(score.totalScore>=80)playSound('correct');
        fetchReferenceAnswerAsync().then(ref=>{
          if(ref && state.chat.lastScore){state.chat.lastScore.referenceAnswer=ref;render();}
        }).catch(()=>{});
      }catch(err2){
        console.error('精简评分也失败:',err2);
        showToast('网络较慢，使用备用评分','warning');
        const ms=getMockScore();state.chat.scores.push(ms);state.chat.lastScore=ms;state.chat.status='reviewing';
        fetchReferenceAnswerAsync().then(ref=>{
          if(ref && state.chat.lastScore){state.chat.lastScore.referenceAnswer=ref;render();}
        }).catch(()=>{});
      }
    }
    render();setTimeout(scrollToBottom,50);
  }

  async function aiScoreAnswerLite(){
    const userAnswer=state.chat.messages.filter(m=>m.role==='user').pop()?.content||'';
    const answerLength=userAnswer.length;
    const expectedLength=Math.round(state.chat.timeLimit*CONFIG.CHARS_PER_SECOND);
    const penalty=getLengthPenalty(answerLength,expectedLength);
    const maxScoreCap=penalty.cap;
    const lengthRatio=answerLength/expectedLength;const dimCap=getDimCap(answerLength,expectedLength,maxScoreCap);
    const sceneName=state.chat.isQuickPractice?'即兴表达训练':(SCENES.find(s=>s.id===state.chat.sceneId)?.name||'面试');
    const durationSec=state.chat.answerDuration;
    const sysPrompt=`你是一位有20年经验的${sceneName}评估专家。请对考生回答严格评分。
【评分铁律】回答过短按上限给分，总分≤${maxScoreCap}，各维度≤${dimCap}。
【关键】totalScore必须=content*0.3+structure*0.25+fluency*0.2+emotion*0.15+adaptability*0.1（四舍五入），5个维度分数必须与总分严格匹配！
【维度】1.内容质量(30%) 2.逻辑结构(25%) 3.表达流畅(20%) 4.情绪感染(15%) 5.应变能力(10%)
考生信息：${sceneName} · ${Math.floor(state.chat.timeLimit/60)}分钟 · 建议${expectedLength}字 · 实际${answerLength}字（${Math.round(lengthRatio*100)}%）· 用时${Math.floor(durationSec/60)}分${durationSec%60}秒
面试题：${state.chat.messages.filter(m=>m.role==='assistant').pop()?.content||''}
考生回答：${userAnswer||'（未作答）'}
只输出JSON：{"totalScore":整数,"scores":{"content":n,"structure":n,"fluency":n,"emotion":n,"adaptability":n},"comments":{"content":"...","structure":"...","fluency":"...","emotion":"...","adaptability":"..."},"strengths":"一句话总结亮点","encouragement":"一句鼓励语","improvements":["问题1","问题2","问题3"],"suggestions":["建议1","建议2","建议3"]}`;
    const raw=await callDeepSeek([{role:'system',content:sysPrompt}],{temperature:0.1,maxTokens:1500});
    let jsonStr=raw.trim().replace(/```json\s*/g,'').replace(/```\s*/g,'').trim();
    const fb=jsonStr.indexOf('{'),lb=jsonStr.lastIndexOf('}');
    if(fb!==-1&&lb!==-1)jsonStr=jsonStr.substring(fb,lb+1);
    let result;try{result=JSON.parse(jsonStr);}catch(e){throw new Error('JSON parse failed');}
    if(!result.scores)result.scores={};
    ['content','structure','fluency','emotion','adaptability'].forEach(k=>{
      if(typeof result.scores[k]!=='number'||isNaN(result.scores[k]))result.scores[k]=Math.max(0,Math.min(dimCap,maxScoreCap-8));
      result.scores[k]=Math.max(0,Math.min(100,Math.min(result.scores[k],dimCap)));
      result.scores[k]=Math.round(result.scores[k]);
      if(answerLength===0)result.scores[k]=0;
    });
    let total=Math.round(result.scores.content*0.3+result.scores.structure*0.25+result.scores.fluency*0.2+result.scores.emotion*0.15+result.scores.adaptability*0.1);
    total=Math.max(0,Math.min(100,total));
    total=Math.min(total,maxScoreCap);
    if(answerLength===0)total=0;
    result.totalScore=total;
    if(!result.comments)result.comments={};
    DIMENSIONS.forEach(d=>{if(!result.comments[d.key]||result.comments[d.key].length<6){const sc=result.scores[d.key];result.comments[d.key]=sc>=75?'表现良好':sc>=60?'基本达标':'有待加强';}});
    result.improvements=Array.isArray(result.improvements)?result.improvements.filter(i=>i&&i.length>4).slice(0,5):[];
    result.suggestions=Array.isArray(result.suggestions)?result.suggestions.filter(s=>s&&s.length>4).slice(0,4):[];
    if(result.improvements.length===0)result.improvements=['内容可以更深入','增加具体案例','注意逻辑结构'];
    if(result.suggestions.length===0)result.suggestions=[`每次说满${Math.round(expectedLength*0.6)}字以上`,'积累素材案例','练习结构化表达'];
    if(typeof result.strengths!=='string'||result.strengths.length<4)result.strengths=total>=60?'完成了作答，有可圈可点之处':'敢于开口就是好的开始';
    if(typeof result.encouragement!=='string'||result.encouragement.length<4)result.encouragement='每一次开口都是进步，继续加油！';
    return{success:true,totalScore:total,scores:result.scores,comments:result.comments,strengths:result.strengths,encouragement:result.encouragement,highlights:[],improvements:result.improvements,suggestions:result.suggestions,referenceAnswer:'',answerDuration:state.chat.answerDuration};
  }
  window.aiScoreAnswerLite=aiScoreAnswerLite;

  async function fetchReferenceAnswerAsync(){
    const question=state.chat.messages.filter(m=>m.role==='assistant').pop()?.content||'';
    if(!question)return'';
    const expectedLength=Math.round(state.chat.timeLimit*CONFIG.CHARS_PER_SECOND);
    const sceneName=state.chat.isQuickPractice?'即兴表达':(SCENES.find(s=>s.id===state.chat.sceneId)?.name||'面试');
    const sysPrompt=`你是一位资深${sceneName}教练。请针对以下题目，给出一份高质量参考回答。
要求：1.结构清晰（开头+主体论证+结尾总结）2.内容充实有说服力 3.语言自然适合口头表达 4.长度${Math.round(expectedLength*0.9)}-${Math.round(expectedLength*1.3)}字 5.分2-4段，段落用换行符分隔 6.直接输出回答正文，不要加"参考答案"等前缀
题目：${question}`;
    const res=await callDeepSeek([{role:'system',content:sysPrompt}],{temperature:0.7,maxTokens:2048});
    return res.trim();
  }
  window.fetchReferenceAnswerAsync=fetchReferenceAnswerAsync;
  window.getScoreContext=getScoreContext;
  window.callDeepSeek=callDeepSeek;
  window.getMockScore=getMockScore;

  const sceneEvalRules={"1":{name:"公务员面试",rule:"重点评估：政策理论水平、综合分析能力、应急应变能力、语言规范正式度、政治站位准确性。对语气助词（嗯、啊、那个、呃等）扣分严格，应使用正式规范的公务用语；逻辑层次清晰，对策建议具有可行性。"},"2":{name:"考研复试",rule:"重点评估：专业知识准确性、学术思维能力、英语表达能力、科研潜力与研究兴趣。对专业术语错误扣分严格，回答需体现学术严谨性，能清晰阐述研究经历与学术规划。"},"3":{name:"教资面试",rule:"重点评估：教学理念正确性、师德师风体现、课堂互动感、教姿教态自然度、语言表达儿童友好度。对少儿说话要温柔亲切，语气助词适当宽容，应体现教师的亲和力与引导力。"},"4":{name:"求职面试",rule:"重点评估：STAR法则运用、岗位匹配度、职业素养展现、沟通逻辑条理性。职场专业度要求高，回答需结合具体事例，突出个人能力与岗位需求的契合。"},"5":{name:"即兴演讲",rule:"重点评估：感染力与号召力、立意深度、文采用语、开头吸引力、结尾升华能力。鼓励有个性的表达，语气助词适度宽容，应注重情感共鸣与价值传递。"},"6":{name:"辩论训练",rule:"重点评估：逻辑严密性、反驳有力程度、论据充分性、快速反应能力。对逻辑漏洞扣分严格，论证需有理有据，能迅速识别对方论证缺陷并进行有效反击。"},"7":{name:"少儿口才",rule:"【儿童友好标准】重点评估：声音洪亮程度、表达自信心、故事完整性、童趣表现力。对逻辑深度不做高要求，语气助词（嗯、啊、然后呢等）完全宽容，不因为口语化表达扣分。采用鼓励性评分，只要小朋友能完整说完就给70分以上，敢于开口就给予肯定。"},"8":{name:"主持培训",rule:"重点评估：控场能力、普通话标准度、应变救场能力、语言感染力。语气助词适度扣分，应展现主持人的稳重大气与灵活应变能力。"},"quick":{name:"通用即兴",rule:"重点评估：观点表达清晰度、思路条理性、表达基本连贯性。语气助词适度宽容，鼓励大胆开口，注重表达的完整性和基本逻辑。"}};
  async function aiScoreAnswer(){
    const userAnswer=state.chat.messages.filter(m=>m.role==='user').pop()?.content||'';
    const answerLength=userAnswer.length;
    const expectedLength=Math.round(state.chat.timeLimit*CONFIG.CHARS_PER_SECOND);
    const penalty=getLengthPenalty(answerLength,expectedLength);
    const maxScoreCap=penalty.cap;const lengthNote=penalty.note;
    const lengthRatio=answerLength/expectedLength;const dimCap=getDimCap(answerLength,expectedLength,maxScoreCap);
    const sceneName=state.chat.isQuickPractice?'即兴表达训练':(SCENES.find(s=>s.id===state.chat.sceneId)?.name||'面试');
    const durationSec=state.chat.answerDuration;
    const ctx=getScoreContext(answerLength,expectedLength,durationSec,state.chat.timeLimit);
    const isVeryShort=ctx.level==='CRITICAL'||ctx.level==='MIN'||ctx.level==='EMPTY';
    const isExtremelyShort=answerLength<=10&&durationSec<30;
    const isEmpty=answerLength===0;
    const strictLevel=state.settings.strictMode?'严格但公正，注重考生回答的实际质量，既指出不足也肯定亮点':'鼓励为主，对完成基本回答的考生给予合理分数，注重鼓励进步';
    const timeNote = isEmpty?'🔴考生完全未作答（0字），总分必须为0分，各维度也为0分！':durationSec<30?`⚠️答题时间仅${durationSec}秒（不足30秒），请按上限给分。` : durationSec>=state.chat.timeLimit*0.5?'✅答题时间充足（≥50%限时），按正常标准评分，即使字数略少也不应极端压分。':'';
    const sysPrompt=`你是一位${strictLevel}、有20年经验的${sceneName}评估专家。
【核心评分铁律】
1.严格按上限给分：总分≤${maxScoreCap}，各维度≤${dimCap}
2.${isEmpty?'🔴考生完全未作答，totalScore必须为0，所有维度scores必须为0，highlights必须为空数组，referenceAnswer正常生成':''}
3.总分必须等于加权分：totalScore=content*0.3+structure*0.25+fluency*0.2+emotion*0.15+adaptability*0.1（四舍五入），5个维度分数必须与totalScore严格匹配！
4.答非所问→应变≤25分，总分≤35；无论据→内容≤35；口头禅多→流畅≤35；平淡→情绪≤30
5.${lengthNote||'回答长度达标'}
6.${timeNote||'答题时长合理'}
7.答题时间≥限时的50%（${Math.round(state.chat.timeLimit*0.5)}秒）时，即使字数略少也不应极端压分，应结合表达质量综合评判
8.comments必须具体，引用回答中的具体问题，禁止空话
【分数等级】
90+优秀/80-89良好/70-79中等/60-69及格/50-59基本完成/40-49有待提高/0-30未作答或回答极差
【维度】
1.内容质量(${DIMENSIONS[0].weight}%)：切题、观点明确、论据案例、深度
2.逻辑结构(${DIMENSIONS[1].weight}%)：结构清晰、层次分明、论证严密
3.表达流畅(${DIMENSIONS[2].weight}%)：连贯、口头禅、准确
4.情绪感染(${DIMENSIONS[3].weight}%)：抑扬顿挫、情感、自信
5.应变能力(${DIMENSIONS[4].weight}%)：理解题意、灵活、多角度
考生信息：${sceneName} · ${Math.floor(state.chat.timeLimit/60)}分钟 · 建议${expectedLength}字 · 实际${answerLength}字（${Math.round(lengthRatio*100)}%）· 用时${Math.floor(durationSec/60)}分${durationSec%60}秒
${isExtremelyShort&&!isEmpty?'🔴回答几乎为零（仅几个字），请给极低分！':''}
${answerLength<25&&answerLength>0&&durationSec>=30?'🟡内容较短但答题时间充足，请根据表达质量合理评分。':''}
评分应注重回答的内容质量和表达效果，对于观点明确、有基本论证结构、表达流畅的回答，即使存在小瑕疵也应给及格(60+)以上分数。标准朗读文稿应能得到85-95分。完成基本结构（观点+至少1个论据+总结）的回答不应低于60分。\n输出JSON（总分≤${maxScoreCap}，维度≤${dimCap}）：
{"totalScore":整数,"scores":{"content":n,"structure":n,"fluency":n,"emotion":n,"adaptability":n},"comments":{"content":"${isEmpty?'未作答':'具体点评...'}","structure":"...","fluency":"...","emotion":"...","adaptability":"..."},"strengths":"${isEmpty?'未作答':'一句话总结考生最突出的1-2个长处/优势（必须真诚具体，不要空泛，无论分数高低都要找到闪光点）'}","encouragement":"${isEmpty?'勇敢开口就是成功的第一步，下次加油！':'一句温暖有力的考官鼓励语（15-30字）'}","referenceAnswer":"本题的高质量参考回答（${Math.round(expectedLength*0.9)}-${Math.round(expectedLength*1.3)}字，分2-4段，有开头、主体论证、结尾总结，引用具体案例或数据，结构清晰、论证充分、表达自然流畅，口语化适合朗读）","highlights":${isVeryShort?'[]':'["点1","点2"]'},"improvements":${isEmpty?'["勇敢开口回答","先理清思路再作答","多练习即兴表达"]':'["问题1","问题2","问题3"]'},"suggestions":${isEmpty?'["从简单题目开始练习","每天坚持开口说几分钟","先写提纲再口头表达"]':'["建议1","建议2","建议3"]'}`;
    const _csid=state.chat.sceneId;const _iq=state.chat.isQuickPractice;let _sr="";let _sn="";if(_iq){_sr=sceneEvalRules.quick.rule;_sn=sceneEvalRules.quick.name;}else if(sceneEvalRules[_csid]){_sr=sceneEvalRules[_csid].rule;_sn=(SCENES.find(s=>s.id===_csid)||{}).name||sceneEvalRules[_csid].name;}if(_sr){sysPrompt+="\n【"+_sn+"专项评分标准】\n"+_sr+"\n";}
    const userMsg=`面试题：${state.chat.messages.filter(m=>m.role==='assistant').pop()?.content||''}\n\n考生回答（${answerLength}字）：\n${userAnswer||'（未作答）'}\n\n请严格评分，总分≤${maxScoreCap}，维度≤${dimCap}！`;
    let raw=await callDeepSeek([{role:'system',content:sysPrompt},{role:'user',content:userMsg}],{temperature:0.1,maxTokens:3072});
    let jsonStr=raw.trim().replace(/```json\s*/g,'').replace(/```\s*/g,'').trim();
    const fb=jsonStr.indexOf('{'),lb=jsonStr.lastIndexOf('}');
    if(fb!==-1&&lb!==-1)jsonStr=jsonStr.substring(fb,lb+1);
    let result;try{result=JSON.parse(jsonStr);}catch(e){;throw new Error('JSON parse failed');}
    if(!result.scores)result.scores={};
    ['content','structure','fluency','emotion','adaptability'].forEach(k=>{
      if(typeof result.scores[k]!=='number'||isNaN(result.scores[k]))result.scores[k]=Math.max(0,Math.min(dimCap,maxScoreCap-8));
      result.scores[k]=Math.max(0,Math.min(100,result.scores[k]));result.scores[k]=Math.min(result.scores[k],dimCap);
    });
    ['content','structure','fluency','emotion','adaptability'].forEach(k=>{
      result.scores[k]=Math.min(result.scores[k],dimCap);
      result.scores[k]=Math.max(0,Math.min(100,Math.round(result.scores[k])));
      if(answerLength===0)result.scores[k]=0;
    });
    let total=Math.round(result.scores.content*0.3+result.scores.structure*0.25+result.scores.fluency*0.2+result.scores.emotion*0.15+result.scores.adaptability*0.1);
    total=Math.max(0,Math.min(100,total));
    total=Math.min(total,maxScoreCap);
    if(answerLength===0)total=0;
    result.totalScore=total;
    if(!result.comments)result.comments={};
    DIMENSIONS.forEach(d=>{
      if(!result.comments[d.key]||typeof result.comments[d.key]!=='string'||result.comments[d.key].length<6){
        const sc=result.scores[d.key];
        if(sc>=85)result.comments[d.key]='表现优秀';
        else if(sc>=75)result.comments[d.key]='表现良好';
        else if(sc>=65)result.comments[d.key]='基本达标';
        else if(sc>=55)result.comments[d.key]='有待加强';
        else if(sc>=40)result.comments[d.key]='薄弱项';
        else if(sc>=25)result.comments[d.key]='回答过短，能力无法有效评估';
        else result.comments[d.key]='几乎无有效回答';
      }
    });
    result.highlights=Array.isArray(result.highlights)?result.highlights.filter(h=>h&&h.length>4).slice(0,3):[];
    result.improvements=Array.isArray(result.improvements)?result.improvements.filter(i=>i&&i.length>4).slice(0,5):[];
    result.suggestions=Array.isArray(result.suggestions)?result.suggestions.filter(s=>s&&s.length>4).slice(0,4):[];
    if(total>=80&&result.highlights.length===0)result.highlights=['完成了基本回答'];
    if(isVeryShort)result.highlights=[];
    if(result.improvements.length===0){
      if(lengthRatio<0.4)result.improvements=[`回答严重不足（${answerLength}/${expectedLength}字）`,'缺少具体案例支撑','结构不清晰','回答过于简短'];
      else if(lengthRatio<0.6)result.improvements=['内容不够充实','建议增加具体案例','逻辑结构可以更清晰','注意语气抑扬顿挫'];
      else result.improvements=['内容可以更深入','增加更多案例','注意表达连贯'];
    }
    if(result.suggestions.length===0)result.suggestions=[`每次至少说满${Math.round(expectedLength*0.6)}字`,'积累话题素材库','练习结构化表达','录音回听找不足'];
    if(lengthRatio<0.40){result.improvements.unshift(`回答过于简短（${answerLength}/${expectedLength}字），内容严重不足`);result.suggestions.unshift(`下次按"观点→2-3个论据+案例→总结"展开，说${Math.round(expectedLength*0.6)}-${expectedLength}字`);}
    if(typeof result.strengths!=='string'||result.strengths.length<4){
      if(total>=85)result.strengths='整体表现出色，回答质量高，展现了扎实的功底';
      else if(total>=75)result.strengths='回答有亮点，整体表现良好';
      else if(total>=60)result.strengths='完成了作答，有可圈可点之处';
      else if(answerLength>=30)result.strengths='敢于开口完整表达自己的观点';
      else result.strengths='勇敢尝试作答就是好的开始';
    }
    if(typeof result.encouragement!=='string'||result.encouragement.length<4){
      if(total>=90)result.encouragement='非常出色！继续保持这份状态，你已经很接近完美！';
      else if(total>=80)result.encouragement='表现亮眼！再打磨细节就能更上一层楼！';
      else if(total>=70)result.encouragement='稳步提升中，坚持练习一定会越来越棒！';
      else if(total>=60)result.encouragement='已经及格啦，再接再厉突破自己！';
      else result.encouragement='每一次开口都是进步，不要放弃，继续加油！';
    }
    return{success:true,totalScore:total,scores:result.scores,comments:result.comments,strengths:result.strengths,encouragement:result.encouragement,highlights:result.highlights,improvements:result.improvements,suggestions:result.suggestions,referenceAnswer:result.referenceAnswer||'',answerDuration:state.chat.answerDuration};
  }

  function getMockScore(){
    const answerLen=state.chat.messages.filter(m=>m.role==='user').pop()?.content.length||0;
    const expected=Math.round(state.chat.timeLimit*CONFIG.CHARS_PER_SECOND);
    const penalty=getLengthPenalty(answerLen,expected);const dimCap=getDimCap(answerLen,expected,penalty.cap);
    if(answerLen===0){
      return{success:false,totalScore:0,scores:{content:0,structure:0,fluency:0,emotion:0,adaptability:0},
        comments:{content:'未作答','structure':'未作答','fluency':'未作答','emotion':'未作答','adaptability':'未作答'},
        strengths:'未作答',encouragement:'勇敢开口就是成功的第一步，下次加油！',highlights:[],
        improvements:['勇敢开口回答','先理清思路再作答','多练习即兴表达'],
        referenceAnswer:'',suggestions:['从简单题目开始练习','每天坚持开口说几分钟','先写提纲再口头表达'],
        answerDuration:state.chat.answerDuration};
    }
    let base=Math.max(5,penalty.cap-6+Math.floor(Math.random()*4-2));base=Math.min(base,penalty.cap-2);
    const vary=()=>Math.floor(Math.random()*4-2);
    const scores={content:Math.max(2,Math.min(dimCap,base+vary()-3)),structure:Math.max(2,Math.min(dimCap,base+vary())),fluency:Math.max(2,Math.min(dimCap,base+vary()+2)),emotion:Math.max(2,Math.min(dimCap,base+vary()-4)),adaptability:Math.max(2,Math.min(dimCap,base+vary()-2))};
    const total=Math.round(scores.content*0.3+scores.structure*0.25+scores.fluency*0.2+scores.emotion*0.15+scores.adaptability*0.1);
    const ratio=answerLen/expected;
    return{success:false,totalScore:Math.max(5,Math.min(penalty.cap,total)),scores,
      comments:{content:ratio<0.2?'内容严重不足，缺乏具体案例和深度':'内容基本切题但不够充实','structure':ratio<0.2?'没有清晰结构层次':'结构基本清晰','fluency':'语言基本连贯','emotion':ratio<0.2?'回答过短，无法体现感染力':'语气较平淡','adaptability':ratio<0.2?'回答简单，未能充分回应':'基本理解了题意'},
      strengths:ratio>=0.75?'敢于开口完整回答，能够回应问题核心':ratio>=0.5?'有尝试作答的意识，继续加油':'勇敢开口就是进步的第一步',
      encouragement:ratio>=0.75?'表现不错，继续保持这份状态，下次会更好！':ratio>=0.5?'已经迈出很好的一步，多练习几次一定能突破！':'别灰心，每一次开口都是进步，坚持练习必有所成！',
      highlights:ratio>=0.75?['能够回应问题核心']:ratio>=0.5?['尝试回答了问题']:[],
      improvements:ratio<0.25?['回答过短，内容严重不足','缺少具体案例','结构不清晰']:ratio<0.45?['内容不够充实','增加具体案例','注意逻辑结构']:['内容可以更深入','增加案例','注意语气'],
      referenceAnswer:'',suggestions:[`每次说满${Math.round(expected*0.6)}字以上`,'积累素材案例','练习结构化表达','录音回听'],
      answerDuration:state.chat.answerDuration};
  }

  async function retryQuestion(){
    if(!state.chat||!state.chat.lastScore)return;
    if(state.chat.scores.length>0)state.chat.scores.pop();
    state.chat.lastScore=null;
    state.chat.status='answering';
    state.chat.paused=false;
    state.finalTranscript='';state.interimTranscript='';state.userStoppedVoice=false;
    const lastUserIdx=[...state.chat.messages].reverse().findIndex(m=>m.role==='user');
    if(lastUserIdx>=0){const realIdx=state.chat.messages.length-1-lastUserIdx;state.chat.messages.splice(realIdx,1);}
    render();
    showToast('🔁 已重置本题，请重新作答','info');
    stopSpeak();
    const q=state.chat.messages.filter(m=>m.role==='assistant').pop()?.content||'';
    const startMicAfterPrep=()=>{ runPrepTime(); };
    if(state.settings.autoReadQuestion){speakQuestion(q,startMicAfterPrep);}else{startMicAfterPrep();}
  }

  async function nextQuestion(){
    state.chat.lastScore=null;state.chat.status='ai_turn';state.chat.questionCount++;
    state.finalTranscript='';state.interimTranscript='';state.userStoppedVoice=false;state.chat.paused=false;
    render();
    try{
      showToast('AI考官正在出题...','info');
      const q=await getAIQuestion();
      state.chat.messages.push({role:'assistant',content:q});
      render();
      const startMicAfterSpeak = () => { runPrepTime(); };
      if (state.settings.autoReadQuestion) {
        speakQuestion(q, startMicAfterSpeak);
      } else {
        startMicAfterSpeak();
      }
    }catch(e){showToast('获取题目失败，请重试','error');state.chat.status='readyToAnswer';render();}
  }

  function finishTraining(){
    const scores=state.chat.scores;
    if(!scores.length){state.chat=null;navigateTo('home');return;}
    const avg=Math.round(scores.reduce((s,x)=>s+x.totalScore,0)/scores.length);
    const totalDur=scores.reduce((s,x)=>s+(x.answerDuration||0),0);
    state.user.totalSessions++;state.user.totalQuestions+=scores.length;
    state.user.totalMinutes+=Math.round(totalDur/60);
    state.user.avgScore=state.user.totalSessions===1?avg:Math.round((state.user.avgScore*(state.user.totalSessions-1)+avg)/state.user.totalSessions);
    state.user.bestScore=Math.max(state.user.bestScore||0,...scores.map(s=>s.totalScore));
    state.user.exp+=scores.length*20;
    const today=new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now()-86400000).toISOString().split('T')[0];
    state.user.lastTrainDate=today;state.user.todayCount+=scores.length;
    state.user.todayHasTrained = true;
    if(!state.user.checkIns)state.user.checkIns={};
    if(!state.user.checkIns[today])state.user.checkIns[today]={minutes:0,questions:0,score:0,sessions:0};
    state.user.checkIns[today].minutes+=Math.round(totalDur/60);
    state.user.checkIns[today].questions+=scores.length;
    state.user.checkIns[today].sessions++;
    state.user.checkIns[today].score=Math.round(((state.user.checkIns[today].score*(state.user.checkIns[today].sessions-1))+avg)/state.user.checkIns[today].sessions);
    const hadCheckinYesterday = state.user.checkIns[yesterday];
    if (state.user.streak === 0) {
      state.user.streak = 1;
    } else if (state.user.lastTrainDate === yesterday || hadCheckinYesterday) {
      state.user.streak++;
    } else if (state.user.lastTrainDate !== today) {
      state.user.streak = 1;
    }
    const onlineMin = Math.floor((state.user.todayOnlineSeconds || 0) / 60);
    const wasCheckedIn = !!state.user.checkIns[today] && state.user.checkIns[today].sessions > 1;
    if (!wasCheckedIn && onlineMin >= 10 && state.user.todayHasTrained) {
      doCheckIn();
    }
    const nl=Math.floor(state.user.exp/100)+1;
    let leveledUp = false;
    if(nl>state.user.level){state.user.level=nl;leveledUp=true;showToast(`🎉 恭喜升级到Lv.${nl}！`,'success');}
    saveData();
    const enhancedScores = scores.map((s, idx) => {
      const qMsg = state.chat.messages.filter(m => m.role === 'assistant')[idx];
      const aMsg = state.chat.messages.filter(m => m.role === 'user')[idx];
      return Object.assign({}, s, {
        question: qMsg ? qMsg.content : '',
        answer: aMsg ? (aMsg.content || '').substring(0, 2000) : ''
      });
    });
    try { addToWrongQuestions({scores:enhancedScores, messages:state.chat.messages, sceneId:state.chat.sceneId}); } catch(e) {}
    if (state.chat.isDailyChallenge) {
      state.user.dailyChallengeDone = true;
      state.user.dailyChallengeDate = today;
    }
    const h=getHistory();
    h.unshift({id:Date.now(),sceneId:state.chat.sceneId,sceneName:state.chat.sceneName,scores:enhancedScores,avgScore:avg,totalQuestions:state.chat.totalQuestions,date:new Date().toISOString(),totalDuration:totalDur,isQuickPractice:!!state.chat.isQuickPractice});
    saveHistory(h.slice(0,100));
    var rScores = enhancedScores;
    var rAvg = avg;
    var rScene = state.chat.sceneName;
    var rTotalQ = state.chat.totalQuestions;
    var rDur = totalDur;
    state.chat=null;
    checkAchievements();
    if (rTotalQ > 1) {
      showTrainingReport(rScores, rAvg, rScene, rTotalQ, rDur);
    } else {
      navigateTo('growth');
    }
    setTimeout(()=>{
      showToast(`训练完成！平均分：${rAvg}分`,'success');
      playSound('complete');
      if (rAvg >= 80) {
        setTimeout(() => showCelebration('训练完成！', `平均分${rAvg}分，表现出色！`, rAvg >= 90 ? '🏆' : '🎉'), 800);
      }
    }, rTotalQ > 1 ? 800 : 300);
  }

  function exitChat(){
    if(state.chat&&state.chat.messages.length>0&&!state.chat.lastScore&&state.chat.status!=='reviewing'){if(!confirm('确定退出？进度不保存。'))return;}
    clearInterval(state.chat?.timerInterval);clearInterval(state.chat?.prepTimerInterval);stopVoice();stopSpeak();state.chat=null;navigateTo('training');
  }

  function toggleVoice(){state.voiceRecognition?stopVoice():startVoice();}

  function startVoice(){
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){showToast('请使用Chrome或Edge浏览器','error',8000);return;}
    if(state.micPermissionDenied){showToast('麦克风权限已被拒绝，请在地址栏🔒中手动允许','error',5000);return;}
    if(state.voiceRecognition){return;}
    state.userStoppedVoice=false;
    state.micStarting = true;
    const existing=document.getElementById('chatInput')?.value||'';
    state.finalTranscript=existing||state.finalTranscript||'';state.interimTranscript='';
    let restartCount = 0;
    let silentRestartCount = 0;
    const r=new SR();r.continuous=true;r.interimResults=true;r.lang=state.settings.voiceLang||'zh-CN';r.maxAlternatives=1;
    r.onresult=(e)=>{
      silentRestartCount = 0;
      restartCount = 0;
      state.interimTranscript='';
      for(let i=e.resultIndex;i<e.results.length;i++){const t=e.results[i][0].transcript;if(e.results[i].isFinal)state.finalTranscript+=t;else state.interimTranscript+=t;}
      const fullText=state.finalTranscript+state.interimTranscript;
      const inp=document.getElementById('chatInput');
      if(inp){inp.value=fullText;autoResize(inp);updateWordCount();}
      if(/回答完毕|答题完毕|作答完毕|我答完了|回答完了|我的回答完毕|完毕$/.test(fullText.trim())&&fullText.trim().length>8&&!state._submitting&&!state.countdownSpeaking){
        state._submitting=true;
        const stripped=fullText.replace(/回答完毕|答题完毕|作答完毕|我答完了|回答完了|我的回答完毕/g,'').trim();
        state.finalTranscript=stripped;
        if(inp){inp.value=stripped;autoResize(inp);updateWordCount();}
        setTimeout(()=>{state._submitting=false;finishAnswer(false);},600);
      }
    };
    r.onend=()=>{
      state.micStarting = false;
      if(state.countdownSpeaking){return;}
      if(!state.userStoppedVoice&&state.chat?.status==='answering'&&!state.chat.paused&&!state.micPermissionDenied){
        restartCount++;
        const delay = restartCount > 10 ? 1500 : 300;
        setTimeout(()=>{try{if(!state.userStoppedVoice&&!state.micPermissionDenied&&!state.chat.paused&&state.chat?.status==='answering'){r.start();}else{state.voiceRecognition=null;const vb=document.getElementById('voiceBtn');if(vb)vb.classList.remove('active');if(state.chat?.status==='answering')render();}}catch(e){state.voiceRecognition=null;render();}},delay);
        return;
      }
      state.voiceRecognition=null;
      const vb=document.getElementById('voiceBtn');if(vb)vb.classList.remove('active');
      if(state.chat?.status==='answering')render();
    };
    r.onerror=(e)=>{
      state.micStarting = false;
      if(e.error==='not-allowed'||e.error==='service-not-allowed'){
        state.micPermissionDenied=true;
        state.micPermissionGranted=false;
        state.micPermissionGranted=false;
        showToast('⚠️ 麦克风权限被拒绝！请点击地址栏🔒图标允许','error',8000);
        const inp=document.getElementById('chatInput');
        if(inp)inp.placeholder='麦克风权限被拒绝，请点击🔒图标允许';
      }
      else if(e.error==='network'){/* 静默处理网络错误，onend会自动重启 */}
      else if(e.error==='no-speech'){silentRestartCount++;/* 无语音，onend会重启 */}
      else if(e.error!=='aborted'){}
    };
    r.onstart=()=>{
      state.micStarting = false;
      state.micPermissionDenied=false;
      state.micPermissionGranted=true;
      restartCount=0;
      const inp=document.getElementById('chatInput');if(inp)inp.placeholder='🎤 正在聆听...答完点「作答完毕」';
      const vb=document.getElementById('voiceBtn');if(vb)vb.classList.add('active');
      render();
    };
    try{
      r.start();
      state.voiceRecognition=r;
    }catch(e){
      state.micStarting=false;
      state.voiceRecognition=null;
      console.warn('语音启动失败:',e);
    }
  }

  function stopVoice(){state.userStoppedVoice=true;if(state.voiceRecognition){try{state.voiceRecognition.stop();}catch(e){}state.voiceRecognition=null;}const vb=document.getElementById('voiceBtn');if(vb)vb.classList.remove('active');}

  function getWeakestDimension() {
    const history = getHistory();
    if (history.length === 0) return null;
    const dimTotals = { content: 0, structure: 0, fluency: 0, emotion: 0, adaptability: 0 };
    const dimCounts = { content: 0, structure: 0, fluency: 0, emotion: 0, adaptability: 0 };
    history.forEach(h => {
      h.scores.forEach(s => {
        Object.keys(dimTotals).forEach(k => {
          if (s.scores[k]) {
            dimTotals[k] += s.scores[k];
            dimCounts[k]++;
          }
        });
      });
    });
    let weakest = null, lowestAvg = 101;
    Object.keys(dimTotals).forEach(k => {
      if (dimCounts[k] > 0) {
        const avg = dimTotals[k] / dimCounts[k];
        if (avg < lowestAvg) {
          lowestAvg = avg;
          weakest = k;
        }
      }
    });
    return weakest ? { key: weakest, name: DIMENSIONS.find(d => d.key === weakest)?.name, avg: Math.round(lowestAvg) } : null;
  }

  function getImprovementTrend() {
    const history = getHistory();
    if (history.length < 5) return null;
    const sorted = [...history].sort((a,b) => new Date(a.date) - new Date(b.date));
    const first5 = sorted.slice(0, Math.min(5, sorted.length));
    const last5 = sorted.slice(-5);
    const firstAvg = Math.round(first5.reduce((s,h) => s + h.avgScore, 0) / first5.length);
    const lastAvg = Math.round(last5.reduce((s,h) => s + h.avgScore, 0) / last5.length);
    return { firstAvg, lastAvg, diff: lastAvg - firstAvg };
  }

  function getSceneDistribution() {
    const history = getHistory();
    const dist = {};
    SCENES.forEach(s => dist[s.id] = 0);
    history.forEach(h => { dist[h.sceneId] = (dist[h.sceneId] || 0) + h.scores.length; });
    return Object.entries(dist).map(([id, count]) => ({
      scene: SCENES.find(s => s.id === parseInt(id)),
      count
    })).filter(x => x.count > 0);
  }

  function drawWeekChart() {
    const container = document.getElementById('weekChart');
    if (!container) return;
    const history = getHistory();
    const now = new Date();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      d.setHours(0,0,0,0);
      const dayStart = new Date(d);
      const dayEnd = new Date(d);
      dayEnd.setHours(23,59,59,999);
      const count = history.reduce((s,h) => {
        const hd = new Date(h.date);
        if (hd >= dayStart && hd <= dayEnd) return s + h.scores.length;
        return s;
      }, 0);
      days.push({ date: d, count, label: ['日','一','二','三','四','五','六'][d.getDay()], dateLabel: `${d.getMonth()+1}/${d.getDate()}` });
    }
    const maxCount = Math.max(1, ...days.map(d => d.count));
    container.innerHTML = days.map(d => {
      const height = d.count === 0 ? 4 : Math.max(8, (d.count / maxCount) * 100);
      const isToday = d.date.toDateString() === new Date().toDateString();
      return `<div class="week-bar-item" title="${d.dateLabel} 训练${d.count}题">
        <div class="week-bar-value">${d.count || ''}</div>
        <div class="week-bar ${isToday?'today':''}" style="height:${height}%"></div>
        <div class="week-bar-label">${d.label}</div>
        <div class="week-bar-date">${d.dateLabel}</div>
      </div>`;
    }).join('');
  }

  function drawRadar() {
    const canvas = document.getElementById('radarChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width, h = rect.height;
    const cx = w/2, cy = h/2, r = Math.min(w,h)/2 - 50;
    const history = getHistory();
    const avgScores = { content:0, structure:0, fluency:0, emotion:0, adaptability:0 };
    let hasData = false;
    if (history.length > 0) {
      hasData = true;
      const recent = history.slice(0, 10);
      let totalQ = 0;
      recent.forEach(s => s.scores.forEach(sc => {
        DIMENSIONS.forEach(d => { avgScores[d.key] += sc.scores[d.key] || 0; });
        totalQ++;
      }));
      if (totalQ > 0) DIMENSIONS.forEach(d => { avgScores[d.key] = Math.round(avgScores[d.key]/totalQ); });
    }
    ctx.clearRect(0,0,w,h);
    for (let level = 1; level <= 5; level++) {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (Math.PI*2/5)*i - Math.PI/2;
        const lr = r * level/5;
        const x = cx + lr*Math.cos(angle), y = cy + lr*Math.sin(angle);
        if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    DIMENSIONS.forEach((d,i) => {
      const angle = (Math.PI*2/5)*i - Math.PI/2;
      ctx.beginPath();
      ctx.moveTo(cx,cy);
      ctx.lineTo(cx+r*Math.cos(angle), cy+r*Math.sin(angle));
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.stroke();
      const lx = cx+(r+28)*Math.cos(angle), ly = cy+(r+28)*Math.sin(angle);
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.font = 'bold 14px "Noto Sans SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(d.name, lx, ly);
    });
    if (hasData) {
      ctx.beginPath();
      DIMENSIONS.forEach((d,i) => {
        const angle = (Math.PI*2/5)*i - Math.PI/2;
        const val = Math.min(100, Math.max(0, avgScores[d.key]||55))/100;
        const x = cx + r*val*Math.cos(angle), y = cy + r*val*Math.sin(angle);
        if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      });
      ctx.closePath();
      ctx.fillStyle = 'rgba(244,162,97,0.25)';
      ctx.fill();
      ctx.strokeStyle = '#f4a261';
      ctx.lineWidth = 2;
      ctx.stroke();
      DIMENSIONS.forEach((d,i) => {
        const angle = (Math.PI*2/5)*i - Math.PI/2;
        const val = Math.min(100, Math.max(0, avgScores[d.key]||55))/100;
        const x = cx + r*val*Math.cos(angle), y = cy + r*val*Math.sin(angle);
        ctx.beginPath();
        ctx.arc(x,y,5.5,0,Math.PI*2);
        ctx.fillStyle = '#f4a261';
        ctx.fill();
      });
      DIMENSIONS.forEach((d,i) => {
        const angle = (Math.PI*2/5)*i - Math.PI/2;
        const val = Math.min(100, Math.max(0, avgScores[d.key]||55))/100;
        const x = cx + r*val*Math.cos(angle), y = cy + r*val*Math.sin(angle);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText(avgScores[d.key], x, y-12);
      });
    } else {
      ctx.setLineDash([5,5]);
      ctx.beginPath();
      DIMENSIONS.forEach((d,i) => {
        const angle = (Math.PI*2/5)*i - Math.PI/2;
        const x = cx + r*0.55*Math.cos(angle), y = cy + r*0.55*Math.sin(angle);
        if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      });
      ctx.closePath();
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '14px "Noto Sans SC"';
      ctx.textAlign = 'center';
      ctx.fillText('完成首次训练后', cx, cy-8);
      ctx.fillText('即可查看能力雷达图', cx, cy+12);
    }
  }

  function renderGrowth() {
    const history = getHistory();
    const totalSessions = history.length;
    const totalQ = state.user.totalQuestions;
    const avgScore = state.user.avgScore || 0;
    const bestScore = state.user.bestScore || 0;
    const totalMin = state.user.totalMinutes || 0;
    const recent = history.slice(0, 5);
    const first = history.slice(-5);
    let trend = 0, trendText = '持平', trendIcon = '➡️';
    if (history.length >= 5) {
      const recentAvg = Math.round(recent.reduce((s,h)=>s+h.avgScore,0)/recent.length);
      const firstAvg = Math.round(first.reduce((s,h)=>s+h.avgScore,0)/first.length);
      trend = recentAvg - firstAvg;
      if (trend > 3) { trendText = `提升${trend}分`; trendIcon = '📈'; }
      else if (trend < -3) { trendText = `下降${Math.abs(trend)}分`; trendIcon = '📉'; }
    }
    let weakPoint = null, weakScore = 101;
    const dimAvg = { content:0, structure:0, fluency:0, emotion:0, adaptability:0 };
    let dimCount = 0;
    history.forEach(h => h.scores.forEach(s => {
      DIMENSIONS.forEach(d => { dimAvg[d.key] += s.scores[d.key]||0; });
      dimCount++;
    }));
    if (dimCount > 0) {
      DIMENSIONS.forEach(d => {
        dimAvg[d.key] = Math.round(dimAvg[d.key]/dimCount);
        if (dimAvg[d.key] < weakScore) { weakScore = dimAvg[d.key]; weakPoint = d; }
      });
    }
    const sceneDist = getSceneDistribution();
    return `
      <div class="growth-header">
        <h1 class="growth-title">成长轨迹</h1>
        <p class="growth-subtitle">记录你每一次的进步</p>
      </div>
      <div class="stats-overview">
        <div class="stat-big-card"><div class="sbc-value">${totalSessions}</div><div class="sbc-label">训练场次</div></div>
        <div class="stat-big-card"><div class="sbc-value">${totalQ}</div><div class="sbc-label">答题总数</div></div>
        <div class="stat-big-card"><div class="sbc-value">${avgScore}</div><div class="sbc-label">平均分数</div></div>
        <div class="stat-big-card"><div class="sbc-value">${totalMin}<span style="font-size:16px">分</span></div><div class="sbc-label">累计时长</div></div>
      </div>
      ${weakPoint ? `<div class="weak-point-card">
        <div class="wpc-icon">⚠️</div>
        <div class="wpc-content">
          <div class="wpc-title">薄弱环节：${weakPoint.name}（${weakScore}分）</div>
          <div class="wpc-desc">建议多练习此维度，可以尝试针对性训练</div>
        </div>
      </div>` : ''}
      <div class="growth-grid">
        <div class="chart-card">
          <h3 class="chart-title">🎯 能力雷达图</h3>
          <div class="radar-container"><canvas id="radarChart"></canvas></div>
          ${dimCount > 0 ? `<div class="dimension-scores-list">
            ${DIMENSIONS.map(d => `<div class="dsl-item"><span>${d.name}</span><span class="dsl-score">${dimAvg[d.key]||'--'}</span></div>`).join('')}
          </div>` : ''}
        </div>
        <div class="chart-card">
          <h3 class="chart-title">📊 近7天训练量</h3>
          <div class="week-chart-container" id="weekChart"></div>
          ${trend !== 0 || history.length >= 5 ? `<div class="trend-info">
            <span>${trendIcon}</span><span>最近5场 vs 最早5场：${trendText}</span>
          </div>` : `<div class="trend-info"><span>📊</span><span>完成更多训练后可查看趋势分析</span></div>`}
        </div>
      </div>
      ${sceneDist.length > 0 ? `<div class="scene-dist-card">
        <h3 class="chart-title">🎭 训练场景分布</h3>
        <div class="scene-dist-list">
          ${sceneDist.map(sd => `<div class="sd-item">
            <span class="sd-icon">${sd.scene?.icon||'📝'}</span>
            <span class="sd-name">${sd.scene?.name||'练习'}</span>
            <div class="sd-bar-wrap"><div class="sd-bar" style="width:${Math.round(sd.count/Math.max(...sceneDist.map(x=>x.count))*100)}%"></div></div>
            <span class="sd-count">${sd.count}次</span>
          </div>`).join('')}
        </div>
      </div>` : ''}
      <div class="history-section">
        <h3 class="section-title" style="display:flex;align-items:center;justify-content:space-between"><span>📕 错题本</span><span style="font-size:13px;color:var(--color-text-dim);font-weight:400">${getWrongQuestions().length}道错题</span></h3>
        ${renderWrongQuestionsBook()}
      </div>
      <div class="history-section">
        <h3 class="section-title">📋 训练历史</h3>
        ${history.length === 0 ? `<div class="empty-state"><div style="font-size:48px;margin-bottom:12px">📭</div><div>暂无训练记录，快去开始第一次训练吧！</div></div>` :
        (() => {
          const groups = {};
          history.forEach(h => {
            const d = new Date(h.date);
            const key = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
            if (!groups[key]) groups[key] = { date: new Date(d.getFullYear(), d.getMonth(), d.getDate()), items: [] };
            groups[key].items.push(h);
          });
          const groupKeys = Object.keys(groups).sort((a,b) => new Date(groups[b].date) - new Date(groups[a].date));
          return groupKeys.map(key => {
            const g = groups[key];
            const today = new Date(); today.setHours(0,0,0,0);
            const yesterday = new Date(today); yesterday.setDate(yesterday.getDate()-1);
            let dayLabel = `${g.date.getMonth()+1}月${g.date.getDate()}日`;
            if (g.date.toDateString() === today.toDateString()) dayLabel = '今天 · ' + dayLabel;
            else if (g.date.toDateString() === yesterday.toDateString()) dayLabel = '昨天 · ' + dayLabel;
            const weekdays = ['周日','周一','周二','周三','周四','周五','周六'];
            dayLabel += ' ' + weekdays[g.date.getDay()];
            const totalQ = g.items.reduce((s,h) => s + h.scores.length, 0);
            const avgScore = Math.round(g.items.reduce((s,h) => s + h.avgScore, 0) / g.items.length);
            const totalDur = Math.round(g.items.reduce((s,h) => s + (h.totalDuration||0), 0) / 60);
            return `<div class="history-date-group">
              <div class="history-date-header">
                <div class="hdh-day">${dayLabel}</div>
                <div class="hdh-summary">${g.items.length}场 · ${totalQ}题 · ${avgScore}分<span class="hdh-grade" style="color:${getScoreGrade(avgScore).color}">${getScoreGrade(avgScore).label}</span> · ${totalDur}分钟</div>
              </div>
              <div class="history-list">
                ${g.items.map(h => {
                  const d = new Date(h.date);
                  const scene = SCENES.find(s => s.id === h.sceneId);
                  const isQuick = h.isQuickPractice;
                  const timeStr = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
                  return `<div class="history-item" onclick="showHistoryDetail('${h.id}')">
                    <div class="hi-icon" style="background:${scene?.color||'rgba(150,150,150,0.2)'}">${isQuick?'⚡':(scene?.icon||'📝')}</div>
                    <div class="hi-info">
                      <div class="hi-name">${isQuick?'⚡ 快速训练':(scene?.name||'训练')} <span class="hi-time">${timeStr}</span></div>
                      <div class="hi-meta">${h.totalQuestions}题 · ${Math.round((h.totalDuration||0)/60)}分钟</div>
                    </div>
                    <div class="hi-score"><span class="hi-score-num ${h.avgScore>=80?'good':h.avgScore>=60?'':'poor'}">${h.avgScore}分</span><span class="hi-grade-badge" style="color:${getScoreGrade(h.avgScore).color}">${getScoreGrade(h.avgScore).label}</span></div>
                  </div>`;
                }).join('')}
              </div>
            </div>`;
          }).join('');
        })()}
      </div>
    `;
  }

  function renderProfile() {
    const expForNext = state.user.level * 100;
    const expCurrent = (state.user.level - 1) * 100;
    const expProgress = Math.min(100, Math.max(0, ((state.user.exp - expCurrent) / (expForNext - expCurrent)) * 100));
    const history = getHistory();
    const unlockedCount = state.user.unlockedAchievements.length;
    const checkInDays = Object.keys(state.user.checkIns||{}).length;
    const favsCount = (state.user.favorites||[]).length;
    const title = TITLES[Math.min(Math.floor(state.user.level/3), TITLES.length-1)];
    return `
      <div class="profile-header">
        <div class="profile-avatar-section">
          <div class="avatar-ring profile-avatar-ring">
            <div class="avatar profile-avatar" style="${getAvatarStyle()}">
              <span>${getAvatarContent()}</span>
            </div>
          </div>
          <button class="avatar-edit-btn" onclick="openAvatarPicker()" title="更换头像">✎</button>
        </div>
        <div class="profile-info">
          <h2 class="profile-name">${escapeHtml(state.user.nickname)}</h2>
          <div class="profile-title-badge">${title}</div>
          <p class="profile-signature">${escapeHtml(state.user.signature)}</p>
        </div>
      </div>
      <div class="xp-card">
        <div class="xp-header">
          <span>Lv.${state.user.level}</span>
          <span>${state.user.exp} / ${expForNext} EXP</span>
          <span>Lv.${state.user.level+1}</span>
        </div>
        <div class="xp-bar">
          <div class="xp-bar-fill" style="width:${expProgress}%"></div>
        </div>
      </div>
      <div class="profile-stats-grid">
        <div class="ps-item"><div class="ps-value">${state.user.totalSessions}</div><div class="ps-label">训练场次</div></div>
        <div class="ps-item"><div class="ps-value">${state.user.totalQuestions}</div><div class="ps-label">答题总数</div></div>
        <div class="ps-item"><div class="ps-value">${state.user.avgScore||0}</div><div class="ps-label">平均分</div></div>
        <div class="ps-item"><div class="ps-value">${state.user.bestScore||0}</div><div class="ps-label">最高分</div></div>
        <div class="ps-item"><div class="ps-value">${state.user.streak}</div><div class="ps-label">🔥连续天数</div></div>
        <div class="ps-item"><div class="ps-value">${checkInDays}</div><div class="ps-label">📅打卡天数</div></div>
        <div class="ps-item"><div class="ps-value">${favsCount}</div><div class="ps-label">⭐收藏好题</div></div>
        <div class="ps-item"><div class="ps-value">${unlockedCount}/${ACHIEVEMENTS.length}</div><div class="ps-label">🏅成就</div></div>
      </div>
      <div class="profile-menu">
        <button class="profile-menu-item" onclick="openProfileEdit()">
          <span class="pmi-icon">✏️</span><span>编辑资料</span><span class="pmi-arrow">›</span>
        </button>
        <button class="profile-menu-item" onclick="state.showingFavorites=!state.showingFavorites;render()">
          <span class="pmi-icon">⭐</span><span>我的收藏（${favsCount}题）</span><span class="pmi-arrow">${state.showingFavorites?'∨':'›'}</span>
        </button>
        ${state.showingFavorites ? `<div class="favorites-container">${renderFavorites()}</div>` : ''}
        <button class="profile-menu-item" onclick="openSettings()">
          <span class="pmi-icon">⚙️</span><span>应用设置</span><span class="pmi-arrow">›</span>
        </button>
        <button class="profile-menu-item" onclick="exportData()">
          <span class="pmi-icon">📤</span><span>导出数据</span><span class="pmi-arrow">›</span>
        </button>
        <button class="profile-menu-item" onclick="document.getElementById('importFile').click()">
          <span class="pmi-icon">📥</span><span>导入数据</span><span class="pmi-arrow">›</span>
        </button>
        <input type="file" id="importFile" accept=".json" style="display:none" onchange="importData(event)">
        <button class="profile-menu-item danger" onclick="clearAllData()">
          <span class="pmi-icon">🗑️</span><span>清除所有数据</span><span class="pmi-arrow">›</span>
        </button>
      </div>
      <div class="achievements-section">
        <h3 class="section-title">🏅 成就徽章 (${unlockedCount}/${ACHIEVEMENTS.length})</h3>
        <div class="achievements-grid">
          ${[...ACHIEVEMENTS].sort((a,b) => {
            const ua = isAchievementUnlocked(a.id) ? 0 : 1;
            const ub = isAchievementUnlocked(b.id) ? 0 : 1;
            if (ua !== ub) return ua - ub;
            return 0;
          }).map(a => {
            const unlocked = isAchievementUnlocked(a.id);
            const unlockDate = getAchievementUnlockDate(a.id);
            let dateTip = '';
            if (unlocked && unlockDate) {
              const dd = new Date(unlockDate);
              dateTip = `${dd.getFullYear()}/${dd.getMonth()+1}/${dd.getDate()} ${String(dd.getHours()).padStart(2,'0')}:${String(dd.getMinutes()).padStart(2,'0')} 获得`;
            } else if (!unlocked) {
              dateTip = '点击查看获得方式';
            }
            return `<div class="achievement-badge ${unlocked?'unlocked':'locked'}" title="${dateTip}" onclick="showAchievementDetail('${a.id}')">
              <div class="ab-badge-ribbon">${unlocked?'✓':''}</div>
              <div class="ab-icon">${a.icon}</div>
              <div class="ab-name">${a.name}</div>
              <div class="ab-desc">${unlocked?a.desc:'未解锁'}</div>
              ${unlocked && unlockDate ? `<div class="ab-date">🏆 ${new Date(unlockDate).getMonth()+1}月${new Date(unlockDate).getDate()}日获得</div>` : `<div class="ab-date locked-hint">点击查看获取方式</div>`}
            </div>`;
          }).join('')}
        </div>
      </div>
    `;
  }

  function openSettings() {
    const s = state.settings;
    const root = document.getElementById('modalRoot');
    root.innerHTML = `
      <div class="modal-overlay open" onclick="if(event.target===this)closeAllModals()">
        <div class="modal-content settings-modal">
          <div class="modal-title">⚙️ 应用设置</div>
          <div class="settings-group">
            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-name">深色模式</div>
                <div class="setting-desc">切换深色/浅色主题</div>
              </div>
              <label class="switch"><input type="checkbox" ${s.theme==='dark'?'checked':''} onchange="state.settings.theme=this.checked?'dark':'light';applyTheme();saveData()"><span class="slider"></span></label>
            </div>
            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-name">音效</div>
                <div class="setting-desc">按钮点击、完成提示等音效</div>
              </div>
              <label class="switch"><input type="checkbox" ${s.soundEnabled?'checked':''} onchange="state.settings.soundEnabled=this.checked;saveData();openSettings()"><span class="slider"></span></label>
            </div>
            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-name">自动朗读题目</div>
                <div class="setting-desc">AI出题后自动语音朗读</div>
              </div>
              <label class="switch"><input type="checkbox" ${s.autoReadQuestion?'checked':''} onchange="state.settings.autoReadQuestion=this.checked;saveData()"><span class="slider"></span></label>
            </div>
            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-name">自动开启麦克风</div>
                <div class="setting-desc">题目朗读完成后自动开麦</div>
              </div>
              <label class="switch"><input type="checkbox" ${s.autoStartMic?'checked':''} onchange="state.settings.autoStartMic=this.checked;saveData()"><span class="slider"></span></label>
            </div>
            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-name">显示计时器</div>
                <div class="setting-desc">答题时显示倒计时</div>
              </div>
              <label class="switch"><input type="checkbox" ${s.showTimer?'checked':''} onchange="state.settings.showTimer=this.checked;saveData();render()"><span class="slider"></span></label>
            </div>
            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-name">严格评分模式</div>
                <div class="setting-desc">AI评分更加严格</div>
              </div>
              <label class="switch"><input type="checkbox" ${s.strictMode?'checked':''} onchange="state.settings.strictMode=this.checked;saveData()"><span class="slider"></span></label>
            </div>
          </div>
          <div class="settings-group">
            <div class="setting-item-row">
              <div class="setting-info-full"><div class="setting-name">朗读语速</div></div>
              <div class="segmented-control">
                <button class="${s.speechRate==='slow'?'active':''}" onclick="state.settings.speechRate='slow';saveData();openSettings()">慢速</button>
                <button class="${s.speechRate==='normal'?'active':''}" onclick="state.settings.speechRate='normal';saveData();openSettings()">正常</button>
                <button class="${s.speechRate==='fast'?'active':''}" onclick="state.settings.speechRate='fast';saveData();openSettings()">快速</button>
              </div>
            </div>
            <div class="setting-item-row">
              <div class="setting-info-full"><div class="setting-name">音量</div></div>
              <div class="segmented-control">
                <button class="${s.soundVolume==='off'?'active':''}" onclick="state.settings.soundVolume='off';state.settings.soundEnabled=false;saveData();openSettings()">🔇 静音</button>
                <button class="${s.soundVolume==='low'?'active':''}" onclick="state.settings.soundVolume='low';state.settings.soundEnabled=true;saveData();openSettings()">🔈 小声</button>
                <button class="${s.soundVolume==='high'?'active':''}" onclick="state.settings.soundVolume='high';state.settings.soundEnabled=true;saveData();openSettings()">🔊 大声</button>
              </div>
            </div>
            <div class="setting-item-row">
              <div class="setting-info-full"><div class="setting-name">准备时间</div><div class="setting-desc" style="font-size:12px;margin-top:2px">读题后给你构思的思考时间</div></div>
              <div class="segmented-control">
                <button class="${s.prepTimeMode==='none'?'active':''}" onclick="state.settings.prepTimeMode='none';saveData();openSettings()">无</button>
                <button class="${s.prepTimeMode==='scene'?'active':''}" onclick="state.settings.prepTimeMode='scene';saveData();openSettings()">按场景</button>
                <button class="${s.prepTimeMode==='custom'?'active':''}" onclick="state.settings.prepTimeMode='custom';saveData();openSettings()">自定义</button>
              </div>
            </div>
            ${s.prepTimeMode==='custom'?`
            <div class="setting-item-row">
              <div class="setting-info-full"><div class="setting-name">自定义秒数</div></div>
              <div class="segmented-control">
                ${[0,5,10,15,20,30,45,60].map(n => `<button class="${s.prepTimeCustom===n?'active':''}" onclick="state.settings.prepTimeCustom=${n};saveData();openSettings()">${n===0?'无':n+'秒'}</button>`).join('')}
              </div>
            </div>`:''}
            <div class="setting-item-row">
              <div class="setting-info-full"><div class="setting-name">每轮题数</div></div>
              <div class="segmented-control">
                ${[3,5,10].map(n => `<button class="${s.questionsPerSession===n?'active':''}" onclick="state.settings.questionsPerSession=${n};saveData();openSettings()">${n}题</button>`).join('')}
              </div>
            </div>
            <div class="setting-item-row">
              <div class="setting-info-full"><div class="setting-name">每日目标</div></div>
              <div class="segmented-control">
                ${[1,3,5,10].map(n => `<button class="${state.user.dailyGoal===n?'active':''}" onclick="state.user.dailyGoal=${n};saveData();openSettings()">${n}题</button>`).join('')}
              </div>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn btn-primary" onclick="closeAllModals()">完成</button>
          </div>
        </div>
      </div>`;
    root.classList.add('open');
  }

  function openProfileEdit() {
    const u = state.user;
    const root = document.getElementById('modalRoot');
    root.innerHTML = `
      <div class="modal-overlay open" onclick="if(event.target===this)closeAllModals()">
        <div class="modal-content profile-edit-modal">
          <div class="modal-title">✏️ 编辑个人资料</div>
          <div class="form-group">
            <label>昵称</label>
            <input type="text" id="editNickname" value="${escapeHtml(u.nickname)}" maxlength="20" class="form-input">
          </div>
          <div class="form-group">
            <label>个性签名</label>
            <input type="text" id="editSignature" value="${escapeHtml(u.signature)}" maxlength="50" class="form-input">
          </div>
          <div class="form-group">
            <label>性别</label>
            <div class="segmented-control">
              <button class="${!u.gender?'active':''}" onclick="document.getElementById('editGender').value='';this.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('active'));this.classList.add('active')">保密</button>
              <button class="${u.gender==='男'?'active':''}" onclick="document.getElementById('editGender').value='男';this.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('active'));this.classList.add('active')">男</button>
              <button class="${u.gender==='女'?'active':''}" onclick="document.getElementById('editGender').value='女';this.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('active'));this.classList.add('active')">女</button>
            </div>
            <input type="hidden" id="editGender" value="${u.gender||''}">
          </div>
          <div class="form-group"><label>生日</label><input type="date" id="editBirthday" value="${u.birthday||''}" class="form-input"></div>
          <div class="form-group"><label>职业/身份</label><input type="text" id="editOccupation" value="${escapeHtml(u.occupation||'')}" maxlength="30" class="form-input" placeholder="如：大学生、公务员、教师..."></div>
          <div class="form-group"><label>所在城市</label><input type="text" id="editCity" value="${escapeHtml(u.city||'')}" maxlength="20" class="form-input"></div>
          <div class="form-group"><label>训练目标</label><input type="text" id="editGoal" value="${escapeHtml(u.goal||'')}" maxlength="50" class="form-input" placeholder="如：公务员面试、考研复试..."></div>
          <div class="modal-actions">
            <button class="btn btn-secondary" onclick="closeAllModals()">取消</button>
            <button class="btn btn-primary" onclick="saveProfileEdit()">保存</button>
          </div>
        </div>
      </div>`;
    root.classList.add('open');
  }

  function saveProfileEdit() {
    state.user.nickname = document.getElementById('editNickname').value.trim() || '表达学习者';
    state.user.signature = document.getElementById('editSignature').value.trim() || '每一次开口，都是更好的自己';
    state.user.gender = document.getElementById('editGender').value;
    state.user.birthday = document.getElementById('editBirthday').value;
    state.user.occupation = document.getElementById('editOccupation').value.trim();
    state.user.city = document.getElementById('editCity').value.trim();
    state.user.goal = document.getElementById('editGoal').value.trim();
    saveData();
    closeAllModals();
    render();
    showToast('资料已更新', 'success');
  }

  function openAvatarPicker() {
    const colorsHtml = AVATAR_COLORS.map((c,i) => `<button type="button" class="avatar-color-opt ${i===state.user.avatarColorIndex?'active':''}" style="background:${c.bg}" data-avatar-color="${i}"></button>`).join('');
    const emojisHtml = AVATAR_OPTIONS.map((e,i) => `<button type="button" class="avatar-emoji-opt ${e===state.user.avatar?'active':''}" data-avatar-idx="${i}">${e}</button>`).join('');
    const root = document.getElementById('modalRoot');
    root.innerHTML = `
      <div class="modal-overlay open" onclick="if(event.target===this)closeAllModals()">
        <div class="modal-content avatar-picker-modal">
          <div class="modal-title">选择头像</div>
          <div class="avatar-preview-big"><div class="avatar-ring"><div class="avatar" style="${getAvatarStyle()}"><span>${getAvatarContent()}</span></div></div></div>
          <div class="avatar-actions-row">
            <button type="button" class="btn btn-secondary btn-sm" onclick="triggerAvatarUpload()">📷 上传图片</button>
            ${state.user.avatarImage?`<button type="button" class="btn btn-secondary btn-sm" onclick="clearAvatarImage()">恢复默认</button>`:''}
          </div>
          <div class="avatar-section-title">选择背景色</div>
          <div class="avatar-color-grid">${colorsHtml}</div>
          <div class="avatar-section-title">选择头像图标</div>
          <div class="avatar-emoji-grid">${emojisHtml}</div>
          <div class="modal-actions"><button type="button" class="btn btn-primary" onclick="closeAllModals();render()">完成</button></div>
        </div>
      </div>`;
    root.classList.add('open');
    root.querySelectorAll('.avatar-color-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        state.user.avatarColorIndex = parseInt(btn.dataset.avatarColor, 10);
        saveData();
        openAvatarPicker();
      });
    });
    root.querySelectorAll('.avatar-emoji-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.avatarIdx, 10);
        state.user.avatar = AVATAR_OPTIONS[idx];
        state.user.avatarImage = null;
        saveData();
        openAvatarPicker();
      });
    });
  }

  function showHelp() {
    const root = document.getElementById('modalRoot');
    root.innerHTML = `
      <div class="modal-overlay open" onclick="if(event.target===this)closeAllModals()">
        <div class="modal-content help-modal">
          <div class="modal-title">📖 使用帮助</div>
          <div class="help-content">
            <div class="help-section"><h4>🎤 如何开始训练</h4><p>1. 在「首页」点击热门场景或「通用即兴速练」快速开始<br>2. 在「训练中心」选择训练场景（公务员面试、考研复试、求职面试、即兴演讲、辩论训练、少儿口才、主持培训等）<br>3. 选择出题方式：随机出题 / 按岗位/专业选择 / 自定义题目<br>4. 准备倒计时后AI考官出题，自动开启麦克风语音作答<br>5. 答完点击「作答完毕」提交，或说"回答完毕"自动提交，或等待时间到自动提交<br>6. 答题中可点击⏸暂停（暂停时计时和麦克风都暂停）<br>7. AI从5个维度严格评分，给出参考答案、点评和改进建议</p></div>
            <div class="help-section"><h4>📖 背诵小助手（测试功能）</h4><p>1. 在训练中心底部「拓展板块」进入背诵小助手<br>2. 粘贴学习资料或上传文档（支持 .txt / .doc / .docx / .pdf）<br>3. AI自动生成名词解释、填空题、简答题等背诵题目<br>4. 逐题作答，查看参考答案后自评「已掌握」或「需复习」<br>5. 练习记录自动保存，可查看历史详情和原题重答</p></div>
            <div class="help-section"><h4>⏱ 答题与时间规则</h4><p>• 答题有时间限制，AI会根据题目难度动态分配时间（快速练习60-240秒，30秒为一档；其他场景1-5分钟）<br>• 首次打开网页会请求麦克风权限，授权后全程语音作答<br>• 最后10秒语音倒计时"十九八...一"（小声，不录入回答）<br>• 准备倒计时最后3秒（3、2、1）有提示音<br>• 答题中可随时点击⏸暂停，点击▶继续（计时同步暂停/恢复）<br>• 完全未作答（0字）→ 0分<br>• 答题不足30秒且内容极少 → 极低分（≤10-25分）<br>• 答题时间≥限时50%（如3分钟答90秒以上）→ AI正常评分，不极端压分<br>• 自动交卷和手动交卷同等评分，答满时间不会低分</p></div>
            <div class="help-section"><h4>🎯 评分标准</h4><p>AI从5个维度综合评分，总分=加权合计（始终一致）：<br>• 内容质量(30%)：切题度、观点明确度、论据案例、深度<br>• 逻辑结构(25%)：结构清晰、层次分明、论证严密<br>• 表达流畅(20%)：连贯度、口头禅控制、用词准确<br>• 情绪感染(15%)：抑扬顿挫、情感投入、自信度<br>• 应变能力(10%)：理解题意、灵活应对、多角度思考<br>评分后提供5维雷达图、考官点评、参考答案、亮点、改进建议和训练建议</p></div>
            <div class="help-section"><h4>🛠 辅助功能</h4><p>• 📐 答题模板：输入框左侧按钮，提供观点+论据+总结等结构化答题框架<br>• ⏸ 暂停/继续：答题中随时暂停，处理突发事情<br>• ⭐ 收藏好题：评分卡片点击⭐收藏，在「个人中心→我的收藏」查看<br>• 🔊 语音播报：AI考官出题自动朗读，可随时点击暂停/播放<br>• 🔁 AI追问：评分后AI可针对回答进行深度追问<br>• 📊 训练报告：每次训练结束生成分数报告，支持分享<br>• 📝 错题本：低分题目自动收录，可集中复习<br>• 🔥 每日挑战：首页每日推荐一道挑战题，完成打卡</p></div>
            <div class="help-section"><h4>📅 打卡与成长</h4><p>• 每日在线满10分钟 + 完成至少1次训练 → 打卡成功<br>• 连续打卡3/7/14/30天解锁成就徽章<br>• 等级随训练次数和分数提升：初入言途→渐入佳境→能言善辩→口才达人→演说家<br>• 成长轨迹页查看训练历史、分数趋势、能力雷达图</p></div>
            <div class="help-section"><h4>💡 小技巧</h4><p>• 建议按「亮明观点→2-3个论点+案例→总结升华」结构回答<br>• 答完说"回答完毕"可自动提交答案<br>• 字数达到建议字数60%以上更容易获得好分数<br>• 暂停功能可以随时使用，不影响评分<br>• 背诵小助手支持上传txt/doc/docx/pdf文档自动出题</p></div>
          </div>
          <div class="modal-actions"><button class="btn btn-primary" onclick="closeAllModals()">知道了</button></div>
        </div>
      </div>`;
    root.classList.add('open');
  }

  function showAchievementDetail(id) {
    const a = ACHIEVEMENTS.find(x => x.id === id);
    if (!a) return;
    const unlocked = isAchievementUnlocked(id);
    const unlockDate = getAchievementUnlockDate(id);
    const root = document.getElementById('modalRoot');
    let dateHtml = '';
    if (unlocked) {
      if (unlockDate) {
        const d = new Date(unlockDate);
        const dateStr = `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`;
        dateHtml = `<div class="ach-date-row"><span class="ach-date-label">🏆 获得日期</span><span class="ach-date-value">${dateStr}</span></div>`;
      } else {
        dateHtml = `<div class="ach-date-row"><span class="ach-date-label">🏆 状态</span><span class="ach-date-value">已解锁（早期版本数据）</span></div>`;
      }
    } else {
      dateHtml = `<div class="ach-date-row locked"><span class="ach-date-label">🔒 未解锁</span><span class="ach-date-value">继续加油完成目标吧！</span></div>`;
    }
    root.innerHTML = `
      <div class="modal-overlay open" onclick="if(event.target===this)closeAllModals()">
        <div class="modal-content achievement-detail-modal">
          <button class="modal-close-btn" onclick="closeAllModals()">✕</button>
          <div class="ach-detail-icon ${unlocked?'unlocked':'locked'}">${a.icon}</div>
          <div class="modal-title" style="margin-top:16px">${a.name}</div>
          <div class="ach-detail-status ${unlocked?'unlocked':'locked'}">${unlocked?'✅ 已解锁':'🔒 未解锁'}</div>
          <div class="ach-detail-desc">${a.desc}</div>
          <div class="ach-detail-meta">
            ${dateHtml}
            <div class="ach-tip-row">
              <span class="ach-tip-label">📌 获得方式</span>
              <span class="ach-tip-value">${a.desc}</span>
            </div>
          </div>
          <button class="btn btn-primary" style="margin-top:24px;width:100%" onclick="closeAllModals()">我知道了</button>
        </div>
      </div>`;
    root.classList.add('open');
    playSound('modal');
  }

  function showHistoryDetail(id) {
    const history = getHistory();
    const h = history.find(x => String(x.id) === String(id));
    if (!h) return;
    const d = new Date(h.date);
    const scene = SCENES.find(s => s.id === h.sceneId);
    const dateStr = `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日 ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    const root = document.getElementById('modalRoot');
    root.innerHTML = `
      <div class="modal-overlay open" onclick="if(event.target===this)closeAllModals()">
        <div class="modal-content history-detail-modal">
          <div class="modal-title">${scene?.icon||'📝'} ${scene?.name||'训练'}详情</div>
          <div class="hd-meta">${dateStr} · ${h.totalQuestions}题 · 平均分${h.avgScore}分<span class="hd-meta-grade" style="color:${getScoreGrade(h.avgScore).color}">${getScoreGrade(h.avgScore).label}</span> · ${Math.round((h.totalDuration||0)/60)}分钟</div>
          <div class="hd-scores-list">
            ${h.scores.map((s,i) => `<div class="hd-score-item">
              <div class="hd-q-header"><span>第${i+1}题</span><span class="hd-q-score">${s.totalScore}分<span class="hd-q-grade" style="color:${getScoreGrade(s.totalScore).color}">${getScoreGrade(s.totalScore).label}</span></span></div>
              <div class="hd-dims">${DIMENSIONS.map(d=>`<span class="hd-dim-tag">${d.name}:${s.scores[d.key]||'--'}</span>`).join('')}</div>
              ${s.comments?`<div class="hd-comments">${DIMENSIONS.map(d=>s.comments[d.key]?`<div class="hd-comment"><strong>${d.name}：</strong>${escapeHtml(s.comments[d.key])}</div>`:'').join('')}</div>`:''}
              ${s.question?`<div class="hd-section"><strong>📝 题目：</strong><span class="hd-q-text">${escapeHtml(s.question)}</span></div>`:''}
              ${s.answer?`<div class="hd-section"><strong>💬 我的回答：</strong><div class="hd-answer-full">${escapeHtml(s.answer)}</div></div>`:`<div class="hd-section hd-no-answer"><strong>💬 我的回答：</strong><span style="color:var(--color-text-dim)">（本次未作答）</span></div>`}
              ${s.referenceAnswer?`<div class="hd-section"><strong>📖 参考答案：</strong><button class="ref-speak-btn" onclick="speakHistoryRef(this)" title="朗读">🔊</button><span class="hd-ref-text">${escapeHtml(s.referenceAnswer)}</span></div>`:''}
              <div class="hd-q-actions">
                <button class="btn btn-secondary btn-sm" onclick="showQuestionDetailModal('${h.id}',${i})">🔍 查看详情</button>
                <button class="btn btn-accent btn-sm" onclick="reanswerHistoryQuestion('${h.id}',${i})">🔁 原题重答</button>
              </div>
            </div>`).join('')}
          </div>
          <div class="modal-actions">
            <button class="btn btn-secondary" onclick="retakeHistorySession('${h.id}')">再练一组</button>
            <button class="btn btn-primary" onclick="closeAllModals()">关闭</button>
          </div>
        </div>
      </div>`;
    root.classList.add('open');
  }

  function showQuestionDetailModal(historyId, qIdx) {
    const history = getHistory();
    const h = history.find(x => String(x.id) === String(historyId));
    if (!h || !h.scores[qIdx]) return;
    const s = h.scores[qIdx];
    const scene = SCENES.find(sc => sc.id === h.sceneId);
    const root = document.getElementById('modalRoot');
    const dimsHtml = DIMENSIONS.map(d => {
      const sc = s.scores[d.key];
      const cm = s.comments && s.comments[d.key];
      return `<div class="qd-dim-row">
        <div class="qd-dim-head"><span class="qd-dim-name">${d.icon||''} ${d.name}</span><span class="qd-dim-score">${sc||'--'}分</span></div>
        ${cm?`<div class="qd-dim-comment">${escapeHtml(cm)}</div>`:''}
      </div>`;
    }).join('');
    root.innerHTML = `
      <div class="modal-overlay open" onclick="if(event.target===this)closeAllModals()">
        <div class="modal-content question-detail-modal">
          <div class="modal-title">🔍 第${qIdx+1}题 · 详细结果</div>
          <div class="qd-meta">${scene?.icon||'📝'} ${scene?.name||'训练'} · 得分${s.totalScore}分<span style="color:${getScoreGrade(s.totalScore).color}"> ${getScoreGrade(s.totalScore).label}</span></div>
          <div class="qd-section">
            <div class="qd-section-title">📝 题目</div>
            <div class="qd-section-body">${s.question?escapeHtml(s.question):'<span style="color:var(--color-text-dim)">无题目记录</span>'}</div>
          </div>
          <div class="qd-section">
            <div class="qd-section-title">💬 我的回答</div>
            <div class="qd-section-body">${s.answer?escapeHtml(s.answer):'<span style="color:var(--color-text-dim)">（本次未作答）</span>'}</div>
          </div>
          ${s.referenceAnswer?`<div class="qd-section">
            <div class="qd-section-title">📖 参考答案 <button class="ref-speak-btn" onclick="speakHistoryRef(this)" title="朗读">🔊</button></div>
            <div class="qd-section-body hd-ref-text">${escapeHtml(s.referenceAnswer)}</div>
          </div>`:''}
          <div class="qd-section">
            <div class="qd-section-title">📊 评分明细</div>
            <div class="qd-dims-list">${dimsHtml}</div>
          </div>
          ${s.improvements&&s.improvements.length?`<div class="qd-section">
            <div class="qd-section-title">💡 改进建议</div>
            <ul class="qd-improvements">${s.improvements.map(im=>`<li>${escapeHtml(im)}</li>`).join('')}</ul>
          </div>`:''}
          <div class="modal-actions">
            <button class="btn btn-accent" onclick="reanswerHistoryQuestion('${historyId}',${qIdx})">🔁 原题重答</button>
            <button class="btn btn-primary" onclick="showHistoryDetail('${historyId}')">← 返回列表</button>
          </div>
        </div>
      </div>`;
    root.classList.add('open');
  }

  function reanswerHistoryQuestion(historyId, qIdx) {
    const history = getHistory();
    const h = history.find(x => String(x.id) === String(historyId));
    if (!h || !h.scores[qIdx]) return;
    const s = h.scores[qIdx];
    const question = s.question || '';
    if (!question) { showToast('该题没有保存题目内容，无法重答','warning'); return; }
    closeAllModals();
    const scene = SCENES.find(sc => sc.id === h.sceneId) || { id: h.sceneId, name: h.sceneName, icon: '📝', timeLimit: 120, prepTime: 15, voice: null };
    state.chat = {
      sceneId: h.sceneId,
      sceneName: h.sceneName || scene.name,
      messages: [{ role: 'assistant', content: question }],
      scores: [],
      questionCount: 1,
      totalQuestions: 1,
      timeLimit: scene.timeLimit || 120,
      answerTimeLeft: scene.timeLimit || 120,
      status: 'ai_turn',
      startTime: null,
      currentPrepTime: getPrepTime(h.sceneId),
      isQuickPractice: !!h.isQuickPractice,
      isReanswer: true
    };
    state.finalTranscript = ''; state.interimTranscript = ''; state.userStoppedVoice = false;
    navigateTo('training');
    render();
    showToast('已加载原题，即将开始重答','info');
    setTimeout(() => {
      const startMicAfterSpeak = () => { runPrepTime(); };
      if (state.settings.autoReadQuestion) {
        speakQuestion(question, startMicAfterSpeak);
      } else {
        startMicAfterSpeak();
      }
    }, 600);
  }

  function showTrainingReport(scores, avg, sceneName, totalQ, totalDur) {
    navigateTo('growth');
    setTimeout(function() {
      var root = document.getElementById('modalRoot');
      var itemsHtml = '';
      for (var i = 0; i < scores.length; i++) {
        var s = scores[i];
        itemsHtml += '<div class="hd-score-item">';
        var _g=getScoreGrade(s.totalScore);itemsHtml += '<div class="hd-q-header"><span>第'+(i+1)+'题</span><span class="hd-q-score">'+s.totalScore+'分<span class="hd-q-grade" style="color:'+_g.color+'">'+_g.label+'</span></span></div>';
        itemsHtml += '<div class="hd-dims">';
        for (var j = 0; j < DIMENSIONS.length; j++) {
          var d = DIMENSIONS[j];
          itemsHtml += '<span class="hd-dim-tag">'+d.name+':'+(s.scores[d.key]||'--')+'</span>';
        }
        itemsHtml += '</div>';
        if (s.comments) {
          itemsHtml += '<div class="hd-comments">';
          for (var k = 0; k < DIMENSIONS.length; k++) {
            var dd = DIMENSIONS[k];
            if (s.comments[dd.key]) itemsHtml += '<div class="hd-comment"><strong>'+dd.name+'：</strong>'+escapeHtml(s.comments[dd.key])+'</div>';
          }
          itemsHtml += '</div>';
        }
        if (s.question) itemsHtml += '<div class="hd-section"><strong>📝 题目：</strong>'+escapeHtml(s.question)+'</div>';
        if (s.answer) itemsHtml += '<div class="hd-section"><strong>💬 我的回答：</strong><div class="hd-answer-full">'+escapeHtml(s.answer)+'</div></div>';
        if (s.referenceAnswer) itemsHtml += '<div class="hd-section"><strong>📖 参考答案：</strong><button class="ref-speak-btn" onclick="speakReportRef(this)" title="朗读">🔊</button><span class="hd-ref-text">'+escapeHtml(s.referenceAnswer)+'</span></div>';
        itemsHtml += '</div>';
      }
      var html = '<div class="modal-overlay open" onclick="if(event.target===this)closeAllModals()">';
      html += '<div class="modal-content training-report-modal">';
      html += '<div class="modal-title">📊 训练报告</div>';
      html += '<div class="hd-meta">'+(sceneName||'训练')+' · '+totalQ+'题 · 平均分'+avg+'分 · '+Math.round((totalDur||0)/60)+'分钟</div>';
      html += '<div class="hd-scores-list">'+itemsHtml+'</div>';
      var _tg=getScoreGrade(avg);html += '<div class="report-total">总分：<strong>'+avg+'</strong>分 <span class="report-total-grade" style="color:'+_tg.color+'">'+_tg.label+'</span> / 100分</div>';
      html += '<div class="modal-actions"><button class="btn btn-primary" onclick="closeAllModals()">完成</button></div>';
      html += '</div></div>';
      root.innerHTML = html;
      root.classList.add('open');
    }, 500);
  }

  window.speakReportRef = function(btn) {
    try {
      stopSpeak();
      var textEl = btn.nextElementSibling;
      var text = textEl ? textEl.textContent : '';
      if (!text || !('speechSynthesis' in window)) return;
      state.isSpeaking = true;
      var synth = window.speechSynthesis;
      var voices = synth.getVoices();
      var zhVoices = voices.filter(function(v) { return v.lang.includes('zh') || v.lang.includes('CN'); });
      var utterance = new SpeechSynthesisUtterance(stripMarkdownForSpeech(text));
      utterance.lang = 'zh-CN';
      utterance.rate = 0.9 + Math.random() * 0.15;
      utterance.pitch = 0.9 + Math.random() * 0.3;
      if (zhVoices.length > 0) {
        utterance.voice = zhVoices[Math.floor(Math.random() * zhVoices.length)];
      }
      var orig = btn.textContent;
      btn.textContent = '🔊 朗读中...'; btn.disabled = true;
      utterance.onend = function() { state.isSpeaking = false; btn.textContent = orig; btn.disabled = false; };
      utterance.onerror = function() { state.isSpeaking = false; btn.textContent = orig; btn.disabled = false; };
      synth.speak(utterance);
    } catch(e) { state.isSpeaking = false; }
  };

  window.retakeHistorySession = function(id) {
    const history = getHistory();
    const h = history.find(x => String(x.id) === String(id));
    if (!h) return;
    closeAllModals();
    if (h.sceneId === 0 || h.isQuickPractice) {
      startQuickPractice();
    } else {
      startTraining(h.sceneId, h.totalQuestions || 1);
    }
  };

  window.speakHistoryRef = function(btn) {
    try {
      stopSpeak();
      var textEl = btn.nextElementSibling;
      var text = textEl ? textEl.textContent : '';
      if (!text || !('speechSynthesis' in window)) return;
      state.isSpeaking = true;
      var synth = window.speechSynthesis;
      var voices = synth.getVoices();
      var zhVoices = voices.filter(function(v) { return v.lang.includes('zh') || v.lang.includes('CN'); });
      var utterance = new SpeechSynthesisUtterance(stripMarkdownForSpeech(text));
      utterance.lang = 'zh-CN';
      utterance.rate = 0.9 + Math.random() * 0.15;
      utterance.pitch = 0.9 + Math.random() * 0.3;
      if (zhVoices.length > 0) {
        utterance.voice = zhVoices[Math.floor(Math.random() * zhVoices.length)];
      }
      var orig = btn.textContent;
      btn.textContent = '🔊 朗读中...'; btn.disabled = true;
      utterance.onend = function() { state.isSpeaking = false; btn.textContent = orig; btn.disabled = false; };
      utterance.onerror = function() { state.isSpeaking = false; btn.textContent = orig; btn.disabled = false; };
      synth.speak(utterance);
    } catch(e) { state.isSpeaking = false; }
  };

  function exportData() {
    const data = { user: state.user, settings: state.settings, history: getHistory(), exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `yanqi_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('数据已导出', 'success');
  }

  function importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!confirm('导入将覆盖现有数据，确定继续？')) return;
        if (data.user) { state.user = { ...getDefaultUser(), ...data.user }; if (!state.user.favorites) state.user.favorites = []; }
        if (data.settings) state.settings = { ...getDefaultSettings(), ...data.settings };
        if (data.history) saveHistory(data.history.slice(0, 100));
        saveData();
        render();
        showToast('数据导入成功', 'success');
      } catch(err) { showToast('导入失败，文件格式错误', 'error'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function clearAllData() {
    if (!confirm('确定要清除所有数据吗？此操作不可恢复！')) return;
    if (!confirm('再次确认：所有训练记录、成就、设置都将被清除！')) return;
    localStorage.removeItem('yanqi_data');
    localStorage.removeItem('yanqi_history');
    state.user = getDefaultUser();
    state.settings = getDefaultSettings();
    state.showingFavorites = false;
    applyTheme();
    render();
    showToast('所有数据已清除', 'info');
  }

  function addExam() {
    const root = document.getElementById('modalRoot');
    root.innerHTML = `
      <div class="modal-overlay open" onclick="if(event.target===this)closeAllModals()">
        <div class="modal-content">
          <div class="modal-title">🎯 添加考试倒计时</div>
          <div class="form-group"><label>考试名称</label><input type="text" id="examName" class="form-input" placeholder="如：2025年国考面试"></div>
          <div class="form-group"><label>考试类型</label>
            <div class="exam-type-grid">
              ${EXAM_TYPES.map(t => `<button class="exam-type-btn" data-type="${t.id}" onclick="this.parentElement.querySelectorAll('.exam-type-btn').forEach(b=>b.classList.remove('active'));this.classList.add('active');document.getElementById('examType').value='${t.id}'"><span>${t.icon}</span><span>${t.name}</span></button>`).join('')}
            </div>
            <input type="hidden" id="examType" value="civil">
          </div>
          <div class="form-group"><label>考试日期</label><input type="date" id="examDate" class="form-input"></div>
          <div class="modal-actions">
            <button class="btn btn-secondary" onclick="closeAllModals()">取消</button>
            <button class="btn btn-primary" onclick="saveNewExam()">添加</button>
          </div>
        </div>
      </div>`;
    root.classList.add('open');
    setTimeout(() => {
      const btns = root.querySelectorAll('.exam-type-btn');
      if (btns[0]) btns[0].classList.add('active');
    }, 50);
  }

  function saveNewExam() {
    const name = document.getElementById('examName').value.trim();
    const type = document.getElementById('examType').value;
    const date = document.getElementById('examDate').value;
    if (!name) { showToast('请输入考试名称', 'error'); return; }
    if (!date) { showToast('请选择考试日期', 'error'); return; }
    if (!state.user.exams) state.user.exams = [];
    state.user.exams.push({ id: Date.now(), name, type, date });
    saveData();
    closeAllModals();
    render();
    showToast('已添加考试倒计时', 'success');
  }

  let onlineTimer = null;
  function startOnlineTimer() {
    if (onlineTimer) return;
    onlineTimer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        state.user.todayOnlineSeconds = (state.user.todayOnlineSeconds || 0) + 1;
        if (state.user.todayOnlineSeconds % 30 === 0) saveData();
      }
    }, 1000);
  }

  const ANSWER_TEMPLATES = [
    { id:'star', name:'STAR法则', icon:'⭐', scenes:[1,2,3,4], desc:'适合行为面试、经历类问题',
      structure:'S (情境 Situation) → T (任务 Task) → A (行动 Action) → R (结果 Result)',
      detail:'先描述当时所处的具体情境(S)，再说你面临的任务或挑战(T)，接着重点讲你采取了哪些具体行动(A)，最后给出可量化的结果或收获(R)。每部分1-3句话，行动部分最详细。',
      example:'S: 去年部门需要在两周内完成一次产品发布。\nT: 我作为负责人需要协调3个团队。\nA: 我先建立每日站会机制，再用甘特图拆解任务，遇到冲突时拉双方对齐优先级。\nR: 最终提前2天完成发布，用户零投诉。' },
    { id:'prep', name:'PREP结构', icon:'🧩', scenes:[5,6,1,8], desc:'适合观点类、即兴演讲、辩论',
      structure:'P (观点 Point) → R (理由 Reason) → E (例子 Example) → P (重申观点 Point)',
      detail:'先一句话亮明观点(P)，再给出1-2个支撑理由(R)，接着用具体案例或数据佐证(E)，最后用不同措辞重申观点升华(P)。',
      example:'P: 我认为选择比努力更重要。\nR: 因为方向错了，越努力离目标越远。\nE: 比如诺基亚坚持塞班而苹果押注iOS，结果天壤之别。\nP: 所以在埋头苦干前，先抬头看路。' },
    { id:'total', name:'总分总结构', icon:'🏗️', scenes:[1,3,4,7,8], desc:'适合综合分析、教学讲解',
      structure:'总(概述) → 分(1/2/3点展开) → 总(总结升华)',
      detail:'开头用一句话概括核心观点(总)，中间分3个层次或角度逐条展开，每点用"第一/第二/第三"引导(分)，结尾呼应开头并适度升华(总)。',
      example:'总: 做好基层工作需要三种心态。\n第一，要有耐心，群众问题不能急于求成。\n第二，要有同理心，换位思考才能理解诉求。\n第三，要有进取心，在平凡岗位上也能创新。\n总: 这三种心态，是基层工作者行稳致远的根基。' },
    { id:'past_present_future', name:'时间轴结构', icon:'⏳', scenes:[5,8,1], desc:'适合演讲、发展类问题',
      structure:'过去(回顾) → 现在(现状) → 未来(展望)',
      detail:'先回顾事物的发展历程或过去的情况，再分析当前现状与特点，最后展望未来趋势并提出自己的判断或行动建议。',
      example:'过去: 十年前，移动支付还只是概念。\n现在: 如今它已渗透到买菜、乘车等每个角落。\n未来: 下一个十年，无感支付或将彻底改变消费体验。' },
    { id:'problem_solution', name:'问题-解决结构', icon:'🔧', scenes:[1,4,6], desc:'适合应急应变、问题解决类',
      structure:'定性问题 → 分析原因 → 提出对策 → 预防机制',
      detail:'先界定问题性质与严重程度，再从主观客观多角度分析原因，接着给出3条以上可操作的解决对策(分轻重缓急)，最后提出长效预防机制。',
      example:'定性: 这是涉及群众利益的突发舆情，需快速响应。\n原因: 一是信息不透明，二是沟通渠道不畅。\n对策: 立即发布权威通报，开通专线答疑，负责人一线回应。\n预防: 建立舆情预警与日常沟通双机制。' }
  ];

  function showAnswerTemplates() {
    const sceneId = state.chat?.sceneId;
    const isQuick = state.chat?.isQuickPractice;
    const root = document.getElementById('modalRoot');
    const recommended = ANSWER_TEMPLATES.filter(t => sceneId && t.scenes.includes(sceneId));
    const others = ANSWER_TEMPLATES.filter(t => !sceneId || !t.scenes.includes(sceneId));
    root.innerHTML = `
      <div class="modal-overlay open" onclick="if(event.target===this)closeAllModals()">
        <div class="modal-content" style="max-width:560px">
          <div class="modal-title">📐 答题结构模板</div>
          <div style="font-size:13px;color:var(--color-text-dim);margin-bottom:16px">参考以下结构组织你的回答，让表达更有条理。点击模板查看示例。</div>
          <div id="templateList">
            ${recommended.length?`<div style="font-size:13px;color:var(--color-success);margin-bottom:8px;font-weight:600">推荐模板</div>`:''}
            ${recommended.map(t=>renderTemplateCard(t)).join('')}
            ${others.length?`<div style="font-size:13px;color:var(--color-text-dim);margin:12px 0 8px;font-weight:600">其他模板</div>`:''}
            ${others.map(t=>renderTemplateCard(t)).join('')}
          </div>
          <div class="modal-actions"><button class="btn btn-primary" onclick="closeAllModals()">关闭</button></div>
        </div>
      </div>`;
    root.classList.add('open');
  }
  function renderTemplateCard(t) {
    return `<div class="template-card" style="border:1px solid var(--color-border);border-radius:12px;padding:14px;margin-bottom:10px;cursor:pointer;background:var(--color-bg-card)" onclick="toggleTemplateDetail('${t.id}')">
      <div style="display:flex;align-items:center;gap:10px"><span style="font-size:24px">${t.icon}</span><div><div style="font-weight:600">${t.name}</div><div style="font-size:12px;color:var(--color-text-dim)">${t.desc}</div></div></div>
      <div id="tpl-${t.id}" style="display:none;margin-top:12px;padding-top:12px;border-top:1px dashed var(--color-border)">
        <div style="font-size:13px;color:var(--color-primary);margin-bottom:6px"><strong>结构：</strong>${t.structure}</div>
        <div style="font-size:13px;margin-bottom:8px"><strong>用法：</strong>${t.detail}</div>
        <div style="font-size:13px;background:var(--color-bg);padding:10px;border-radius:8px;white-space:pre-wrap;color:var(--color-text-dim)"><strong>示例：</strong>\n${t.example}</div>
      </div>
    </div>`;
  }
  function toggleTemplateDetail(id) {
    const el = document.getElementById('tpl-' + id);
    if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
  }

  async function generateReferenceAnswer() {
    if (!state.chat) return;
    const lastQ = [...state.chat.messages].reverse().find(m => m.role === 'assistant');
    if (!lastQ) { showToast('未找到题目','warning'); return; }
    if (state.chat.refAnswerLoading) return;
    state.chat.refAnswerLoading = true; render();
    try {
      const sceneName = state.chat.isQuickPractice ? '即兴表达' : (SCENES.find(s=>s.id===state.chat.sceneId)?.name || '面试');
      const sysP = `你是一位资深${sceneName}教练。请针对用户的问题，给出一份高质量参考回答。要求：1.结构清晰(可用STAR/总分总等框架) 2.内容充实有说服力 3.语言自然适合口头表达 4.长度200-400字 5.直接输出回答正文，不要加"参考答案"等前缀`;
      const res = await callDeepSeek([{role:'system',content:sysP},{role:'user',content:'题目：'+lastQ.content}],{temperature:0.7,maxTokens:800});
      state.chat.referenceAnswer = res.trim();
      state.chat.refAnswerLoading = false;
      state.chat.showRefAnswer = true;
      render();
      showToast('参考范文已生成','success');
    } catch(e) {
      state.chat.refAnswerLoading = false; render();
      showToast('生成失败：'+e.message,'error');
    }
  }
  function toggleRefAnswerModal() {
    if (!state.chat) return;
    state.chat.showRefAnswer = !state.chat.showRefAnswer;
    render();
  }

  async function askFollowUp() {
    if (!state.chat) return;
    const lastUser = [...state.chat.messages].reverse().find(m => m.role === 'user');
    const lastQ = [...state.chat.messages].reverse().find(m => m.role === 'assistant');
    if (!lastUser || !lastQ) { showToast('需要先回答当前题目','warning'); return; }
    if (state.chat.followUpLoading) return;
    state.chat.followUpLoading = true; render();
    try {
      const sceneName = state.chat.isQuickPractice ? '即兴表达' : (SCENES.find(s=>s.id===state.chat.sceneId)?.name || '面试');
      const sysP = `你是一位${sceneName}考官。用户刚才回答了一个问题，请基于其回答内容提出一个有深度的追问，模拟真实面试的深挖节奏。追问要求：1.针对回答中的具体细节或薄弱点 2.简短直接，不超过2句话 3.只输出追问内容，不加任何前缀或解释`;
      const usrP = `原题：${lastQ.content}\n用户回答：${lastUser.content}\n请给出追问：`;
      const followUp = await callDeepSeek([{role:'system',content:sysP},{role:'user',content:usrP}],{temperature:0.8,maxTokens:200});
      state.chat.followUpLoading = false;
      state.chat.messages.push({role:'assistant',content:followUp.trim()});
      state.chat.status = 'readyToAnswer';
      state.chat.lastScore = null;
      state.chat.questionCount = Math.max(state.chat.questionCount, state.chat.totalQuestions);
      state.chat.totalQuestions = state.chat.questionCount + 1;
      render();
      if (state.settings.autoReadQuestion) speakQuestion(followUp.trim(), ()=>{ startAnsweringNow(); });
      else { startAnsweringNow(); }
      showToast('AI已追问，请继续作答','info');
    } catch(e) {
      state.chat.followUpLoading = false; render();
      showToast('追问生成失败：'+e.message,'error');
    }
  }

  function getWrongQuestions() {
    try { return JSON.parse(localStorage.getItem('yanqi_wrong') || '[]'); } catch(e) { return []; }
  }
  function saveWrongQuestions(arr) {
    try { localStorage.setItem('yanqi_wrong', JSON.stringify(arr.slice(-200))); } catch(e) {}
  }
  function addToWrongQuestions(sessionData) {
    if (!sessionData) return;
    const wrong = getWrongQuestions();
    sessionData.scores.forEach((sc, i) => {
      if (sc.totalScore < 60) {
        const q = sessionData.messages?.filter(m=>m.role==='assistant')[i];
        const a = sessionData.messages?.filter(m=>m.role==='user')[i];
        if (q && a) {
          wrong.push({
            id: Date.now() + '-' + i,
            question: q.content,
            answer: a.content,
            score: sc.totalScore,
            sceneId: sessionData.sceneId,
            sceneName: SCENES.find(s=>s.id===sessionData.sceneId)?.name || '即兴练习',
            date: new Date().toISOString(),
            weaknesses: (sc.improvements||[]).slice(0,3)
          });
        }
      }
    });
    saveWrongQuestions(wrong);
  }
  function practiceWrongQuestion(id) {
    const wrong = getWrongQuestions();
    const item = wrong.find(w => w.id === id);
    if (!item) return;
    closeAllModals();
    state.chat = {
      sceneId: item.sceneId || 5,
      messages: [{role:'assistant', content:item.question}],
      questionCount: 1, totalQuestions: 1,
      timeLimit: 120, answerTimeLeft: 120,
      currentPrepTime: 10, status:'preparing',
      prepTimeLeft: 10, scores:[], startTime:null,
      expectedWords: 420, isQuickPractice: !item.sceneId,
      fromWrongBook: true
    };
    state.currentPage = 'training';
    render();
    runPrepTime();
  }
  function removeWrongQuestion(id) {
    let wrong = getWrongQuestions();
    wrong = wrong.filter(w => w.id !== id);
    saveWrongQuestions(wrong);
    render();
    showToast('已移出错题本','info');
  }
  function renderWrongQuestionsBook() {
    const wrong = getWrongQuestions();
    if (!wrong.length) {
      return `<div class="empty-state" style="text-align:center;padding:40px 20px;color:var(--color-text-dim)">
        <div style="font-size:48px;margin-bottom:12px">📚</div>
        <div style="font-size:16px;font-weight:600;margin-bottom:6px">错题本空空如也</div>
        <div style="font-size:13px">训练中得分低于60分的题目会自动收集到这里，方便针对性复习</div>
      </div>`;
    }
    return `<div class="wrong-book">
      <div style="margin-bottom:12px;font-size:13px;color:var(--color-text-dim)">共 ${wrong.length} 道错题 · 按时间倒序排列</div>
      ${wrong.slice().reverse().map(w => {
        const days = Math.floor((Date.now()-new Date(w.date).getTime())/86400000);
        return `<div class="wrong-item" style="border:1px solid var(--color-border);border-radius:12px;padding:14px;margin-bottom:10px;background:var(--color-bg-card)">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:8px">
            <span style="font-size:12px;color:var(--color-text-dim)">${escapeHtml(w.sceneName)} · ${days===0?'今天':days+'天前'} · 得分 ${w.score}</span>
            <button class="icon-btn" onclick="removeWrongQuestion('${w.id}')" title="移出" style="padding:2px 6px;font-size:14px">✕</button>
          </div>
          <div style="font-weight:600;margin-bottom:6px;line-height:1.5">${escapeHtml(w.question)}</div>
          ${w.weaknesses&&w.weaknesses.length?`<div style="font-size:12px;color:var(--color-danger);margin-bottom:8px">薄弱点：${w.weaknesses.map(escapeHtml).join('；')}</div>`:''}
          <button class="btn btn-primary btn-sm" onclick="practiceWrongQuestion('${w.id}')">🔄 重练此题</button>
        </div>`;
      }).join('')}
    </div>`;
  }

  const DAILY_CHALLENGE_TOPICS = [
    '请用1分钟介绍一部对你影响最大的书，并说明它改变了你什么。',
    '如果让你给刚入职的自己提三条建议，你会说什么？',
    '请描述一次你克服困难的经历，重点讲你当时的心态转变。',
    '人工智能会取代你的工作吗？请给出你的判断和理由。',
    '请用"如果时间倒流十年"开头，做一段30秒的开场白。',
    '你认为当代年轻人最需要的品质是什么？请举例说明。',
    '请评价你所在城市的一个优点和一个不足，给出改进建议。',
    '用一分钟说服我：为什么应该养成每天阅读的习惯。',
    '描述一个你敬佩的人，不是名人，是你身边的人，为什么敬佩？',
    '如果只能保留一项能力去面对未来，你选什么？为什么？',
    '请就"内卷"现象发表你的看法，2分钟即兴表达。',
    '你最近学到的最有价值的一件事是什么？请清楚讲出来。',
    '请做一个1分钟的自我介绍，突出你的一个独特优势。',
    '如何看待"躺平"？请给出平衡的观点。',
    '如果让你组织一次部门团建，你会怎么设计？请讲思路。'
  ];
  function getDailyChallenge() {
    const today = new Date().toISOString().split('T')[0];
    const dayNum = Math.floor(new Date(today).getTime() / 86400000);
    const topic = DAILY_CHALLENGE_TOPICS[dayNum % DAILY_CHALLENGE_TOPICS.length];
    const done = !!(state.user.dailyChallengeDone && state.user.dailyChallengeDate === today);
    return { topic, done, date: today };
  }
  function startDailyChallenge() {
    const ch = getDailyChallenge();
    closeAllModals();
    state.chat = {
      sceneId: 5,
      messages: [],
      questionCount: 0, totalQuestions: 1,
      timeLimit: 120, answerTimeLeft: 120,
      currentPrepTime: 15, status: 'ai_turn',
      prepTimeLeft: 15, scores: [], startTime: null,
      expectedWords: 420, isQuickPractice: true,
      isDailyChallenge: true,
      dailyChallengeTopic: ch.topic
    };
    state.currentPage = 'training';
    render();
    state.chat.messages.push({role:'assistant', content: ch.topic});
    state.chat.questionCount = 1;
    state.chat.status = 'preparing';
    render();
    if (state.settings.autoReadQuestion) speakQuestion(ch.topic, runPrepTime);
    else runPrepTime();
  }

  function shareTrainingReport() {
    if (!state.chat || !state.chat.scores.length) { showToast('暂无训练报告可分享','warning'); return; }
    const scores = state.chat.scores;
    const avg = Math.round(scores.reduce((s,x)=>s+x.totalScore,0)/scores.length);
    const best = Math.max(...scores.map(s=>s.totalScore));
    const sceneName = state.chat.isQuickPractice ? '即兴练习' : (SCENES.find(s=>s.id===state.chat.sceneId)?.name || '训练');
    const text = `🎯 我在「言启」完成了${state.chat.totalQuestions}道${sceneName}训练！\n📊 平均分：${avg}分 | 最高分：${best}分\n💪 每次开口都是更好的自己，一起来练表达吧！`;
    if (navigator.share) {
      navigator.share({ title:'我的言启训练报告', text }).catch(()=>{});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(()=>{
        showToast('训练报告已复制，快去粘贴分享吧！','success',4000);
      }).catch(()=>{ showToast('复制失败，请手动截图分享','warning'); });
    } else {
      showToast('请手动截图分享你的成绩','info');
    }
  }

  window.startTraining = startTraining;
  window.startChat = startChat;
  window.startQuickPractice = startQuickPractice;
  window.continueLastSession = continueLastSession;
  window.navigateTo = navigateTo;
  window.toggleSidebar = toggleSidebar;
  window.toggleTheme = toggleTheme;
  window.state = state;
  window.applyTheme = applyTheme;
  window.saveData = saveData;
  window.render = render;
  window.showDayDetail = showDayDetail;
  window.showCheckInProgress = showCheckInProgress;
  window.showAnswerTemplates = showAnswerTemplates;
  window.toggleTemplateDetail = toggleTemplateDetail;
  window.generateReferenceAnswer = generateReferenceAnswer;
  window.toggleRefAnswerModal = toggleRefAnswerModal;
  window.askFollowUp = askFollowUp;
  window.practiceWrongQuestion = practiceWrongQuestion;
  window.removeWrongQuestion = removeWrongQuestion;
  window.startDailyChallenge = startDailyChallenge;
  window.renderWrongQuestionsBook = renderWrongQuestionsBook;
  window.shareTrainingReport = shareTrainingReport;
  window.nextQuestion = nextQuestion;
  window.retryQuestion = retryQuestion;
  window.skipPrepAndStart = skipPrepAndStart;
  window.finishTraining = finishTraining;
  window.finishAnswer = finishAnswer;
  window.exitChat = exitChat;
  window.toggleVoice = toggleVoice;
  window.manualCheckIn = manualCheckIn;
  window.pauseTimer = pauseTimer;
  window.resumeTimer = resumeTimer;
  window.showHelp = showHelp;
  window.openSettings = openSettings;
  window.openProfileEdit = openProfileEdit;
  window.saveProfileEdit = saveProfileEdit;
  window.openAvatarPicker = openAvatarPicker;
  window.triggerAvatarUpload = triggerAvatarUpload;
  window.clearAvatarImage = clearAvatarImage;
  window.closeAllModals = closeAllModals;
  window.exportData = exportData;
  window.importData = importData;
  window.clearAllData = clearAllData;
  window.autoResize = autoResize;
  window.showHistoryDetail = showHistoryDetail;
  window.showQuestionDetailModal = showQuestionDetailModal;
  window.reanswerHistoryQuestion = reanswerHistoryQuestion;
  window.addExam = addExam;
  window.saveNewExam = saveNewExam;
  window.deleteExam = deleteExam;
  window.openAddExam = openAddExam;
  window.saveExam = saveExam;
  window.selectExamType = selectExamType;
  window.showJobPositionPicker = showJobPositionPicker;
  window.selectJobPos = selectJobPos;
  window.selectQCount = selectQCount;
  window.confirmJobStart = confirmJobStart;
  window.changeCalendarMonth = changeCalendarMonth;
  window.replaySpeak = replaySpeak;
  window.stopSpeak = stopSpeak;
  window.toggleFavorite = toggleFavorite;
  window.removeFavorite = removeFavorite;
  window.practiceFavorite = practiceFavorite;
  window.showQuestionCountPicker = showQuestionCountPicker;
  window.replayQuestion = replayQuestion;
  window.speakQuestion = speakQuestion;
  window.playSound = playSound;
  window.showAchievementDetail = showAchievementDetail;
  window.toggleRefAnswer = toggleRefAnswer;
  window.speakReferenceAnswer = speakReferenceAnswer;
  window.showTeachPicker = showTeachPicker;
  window.selectTeachStage = selectTeachStage;
  window.selectTeachSubject = selectTeachSubject;
  window.selectTeachQCount = selectTeachQCount;
  window.confirmTeachStart = confirmTeachStart;
  window.showPostgradPicker = showPostgradPicker;
  window.selectPostgradMajor = selectPostgradMajor;
  window.selectPostgradQCount = selectPostgradQCount;
  window.confirmPostgradStart = confirmPostgradStart;
  window.showCivilPicker = showCivilPicker;
  window.selectCivilPos = selectCivilPos;
  window.selectCivilQCount = selectCivilQCount;
  window.confirmCivilStart = confirmCivilStart;
  window.showTopicPicker = showTopicPicker;
  window.selectTopicQCount = selectTopicQCount;
  window.confirmTopicStart = confirmTopicStart;
  window.startAnsweringNow = startAnsweringNow;

  let micWarmupDone = false;
  let micWarmupStream = null;
  let micReadyPromise = null;
  function warmupMic(showHint) {
    if (state.micPermissionDenied) return Promise.resolve(false);
    if (micReadyPromise) return micReadyPromise;
    if (micWarmupDone && micWarmupStream && micWarmupStream.active) return Promise.resolve(true);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return Promise.resolve(false);
    if (showHint) {
      showToast('🎤 请在浏览器弹窗中允许使用麦克风，以便语音答题', 'info', 6000);
    }
    micWarmupDone = true;
    micReadyPromise = navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        micWarmupStream = stream;
        state.micPermissionGranted = true;
        stream.getTracks().forEach(t => { t.enabled = false; });
        return true;
      })
      .catch(err => {
        micWarmupDone = false;
        micReadyPromise = null;
        if (err && (err.name === 'NotAllowedError' || err.name === 'SecurityError')) {
          state.micPermissionDenied = true;
          showToast('⚠️ 麦克风权限被拒绝，建议点击地址栏🔒图标将麦克风设置为"允许"', 'warning', 6000);
        }
        return false;
      });
    return micReadyPromise;
  }
  async function ensureMicReady(timeoutMs) {
    if (state.micPermissionGranted && micWarmupStream && micWarmupStream.active) return true;
    if (state.micPermissionDenied) return false;
    if (timeoutMs === 0) {
      try {
        const ok = await warmupMic(true);
        return !!ok;
      } catch(e) { return false; }
    }
    const ms = timeoutMs || 15000;
    try {
      const ok = await Promise.race([
        warmupMic(true),
        new Promise(res => setTimeout(() => res(null), ms))
      ]);
      return !!ok;
    } catch(e) { return false; }
  }

  function initPet(){
    const exist=document.getElementById('aiPet');if(exist)return;
    const pet=document.createElement('div');pet.id='aiPet';pet.className='ai-pet';
    pet.innerHTML='<div class="ai-pet-body">🐱</div><div class="ai-pet-chat" id="aiPetChat" style="display:none"><div class="ai-pet-chat-header"><span>小言助手</span><button class="ai-pet-close" onclick="petToggleChat(false)">×</button></div><div class="ai-pet-messages" id="aiPetMsgs"></div><div class="ai-pet-input-row"><input type="text" id="aiPetInput" class="ai-pet-input" placeholder="问我任何问题..." onkeydown="if(event.key==&quot;Enter&quot;)petSend()"><button class="ai-pet-send" onclick="petSend()">发送</button></div></div>';
    document.body.appendChild(pet);
    pet._drag={active:false,ox:0,oy:0,moved:false};
    const body=pet.querySelector('.ai-pet-body');
    body.addEventListener('mousedown',e=>{e.preventDefault();pet._drag.active=true;pet._drag.moved=false;const r=pet.getBoundingClientRect();pet._drag.ox=e.clientX-r.left;pet._drag.oy=e.clientY-r.top;pet.style.transition='none';});
    document.addEventListener('mousemove',e=>{if(!pet._drag.active)return;pet._drag.moved=true;const nx=e.clientX-pet._drag.ox;const ny=e.clientY-pet._drag.oy;pet.style.left=Math.max(0,Math.min(window.innerWidth-60,nx))+'px';pet.style.top=Math.max(0,Math.min(window.innerHeight-60,ny))+'px';pet.style.right='auto';pet.style.bottom='auto';});
    document.addEventListener('mouseup',()=>{if(pet._drag.active){pet._drag.active=false;pet.style.transition='';if(!pet._drag.moved)petToggleChat();}});
    body.addEventListener('touchstart',e=>{const t=e.touches[0];const r=pet.getBoundingClientRect();pet._drag.active=true;pet._drag.moved=false;pet._drag.ox=t.clientX-r.left;pet._drag.oy=t.clientY-r.top;pet.style.transition='none';},{passive:true});
    document.addEventListener('touchmove',e=>{if(!pet._drag.active)return;pet._drag.moved=true;const t=e.touches[0];const nx=t.clientX-pet._drag.ox;const ny=t.clientY-pet._drag.oy;pet.style.left=Math.max(0,Math.min(window.innerWidth-60,nx))+'px';pet.style.top=Math.max(0,Math.min(window.innerHeight-60,ny))+'px';pet.style.right='auto';pet.style.bottom='auto';},{passive:true});
    document.addEventListener('touchend',()=>{if(pet._drag.active){pet._drag.active=false;pet.style.transition='';if(!pet._drag.moved)petToggleChat();}});
    pet.style.right='20px';pet.style.bottom='100px';
    pet._history=[{role:'system',content:'你是言启App的可爱AI助手小言，形象是一只可爱的小猫咪。请用简短可爱的语气回答用户关于言启App使用的问题。言启是一个语言表达训练应用，功能包括：公务员面试、考研复试、教资面试、求职面试、即兴演讲、辩论训练、少儿口才、主持培训、快速练习、背诵小助手等模块。用户可以练习口头表达、获得AI评分和改进建议。回答要简短(100字以内)、有用、友好。如果问的问题与产品无关，也可以简单回答但引导回产品使用。'}];
    setTimeout(()=>petAddMsg('assistant','你好呀~我是小言🐱有什么问题可以问我哦！'),600);
  }
  window.initPet=initPet;
  function petToggleChat(show){const chat=document.getElementById('aiPetChat');if(show===undefined)chat.style.display=chat.style.display==='none'?'flex':'none';else chat.style.display=show?'flex':'none';}
  window.petToggleChat=petToggleChat;
  function petAddMsg(role,txt){const msgs=document.getElementById('aiPetMsgs');if(!msgs)return;const d=document.createElement('div');d.className='ai-pet-msg ai-pet-msg-'+role;d.textContent=txt;msgs.appendChild(d);msgs.scrollTop=msgs.scrollHeight;}
  window.petAddMsg=petAddMsg;
  async function petSend(){const inp=document.getElementById('aiPetInput');const v=inp.value.trim();if(!v)return;inp.value='';const pet=document.getElementById('aiPet');petAddMsg('user',v);pet._history.push({role:'user',content:v});try{const res=await callDeepSeek(pet._history,{temperature:0.8,maxTokens:200});petAddMsg('assistant',res);pet._history.push({role:'assistant',content:res});if(pet._history.length>20)pet._history=[pet._history[0],...pet._history.slice(-18)];}catch(e){petAddMsg('assistant','喵~好像出了点小问题，稍后再试试吧~');}}
  window.petSend=petSend;

  window.addEventListener('beforeunload', () => {
    if (micWarmupStream) micWarmupStream.getTracks().forEach(t => t.stop());
  });

  loadData();
  checkAchievements();
  render();
  initPet();
  startOnlineTimer();
  setTimeout(() => {
    if (!state.micPermissionGranted && !state.micPermissionDenied) {
      warmupMic(true).then(ok => {
        if (ok) showToast('🎤 麦克风已就绪，训练时可直接语音作答', 'success', 3000);
      });
    }
  }, 1500);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkDailyReset();
      render();
    }
  });
  window.addEventListener('resize', () => {
    state.isMobile = window.innerWidth <= 900;
  });
  if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {};
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modalRoot = document.getElementById('modalRoot');
      if (modalRoot && modalRoot.classList.contains('open')) { closeAllModals(); return; }
      if (state.helpOpen || state.profileEditOpen || state.settingsOpen || state.avatarPickerOpen || state.historyDetailId) { closeAllModals(); return; }
    }
  });
})();