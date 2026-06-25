// ============ 心声树洞 - 数据持久化存储 ============
(function(global){
  'use strict';

  const LS_KEY = 'xinsheng_shudong_v1';

  function load(){
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return initialState(true);
      const data = JSON.parse(raw);
      return Object.assign(initialState(), data);
    } catch (e) {
      return initialState();
    }
  }

  function buildSeedTreeholes(){
    const anonNames = ['匿名旅人','月光守护者','深夜小熊','流浪诗人','树洞精灵','沉默的海','夜航船','温柔的风','云上信笺'];
    const seeds = [
      { emotion:'anxiety', content:'考研倒计时 30 天，每天早上睁开眼都心跳加速。明明已经很努力了，还是怕让爸妈失望。大家也会这样吗？' },
      { emotion:'lonely',  content:'在异地读大学，室友都出去约会了。周末一个人在食堂吃饭，听着周围的笑声，突然很想家。' },
      { emotion:'anger',   content:'明明已经连续加班三个月了，leader 还是在周会上说我"不够主动"。我真的想直接摔门走人。' },
      { emotion:'lost',    content:'毕业三年，同学有的考公有的读博，我还在小公司做着不喜欢的工作。我的人生是不是走偏了？' },
      { emotion:'heal',   content:'今天在阳台种的小多肉冒出了新芽。很小很小，但我盯着它看了好久。原来治愈自己，可以这么简单。' },
      { emotion:'anxiety', content:'暗恋了两年的人官宣了。没有哭，但心里空落落的。树洞真好，没人认识我。' },
      { emotion:'lonely',  content:'i 人真的会谢，团建结束后回家，一晚上没说话，也不想说话。安静就是最好的充电。' },
      { emotion:'heal',   content:'给五年后的自己写了封信。原来那些以为过不去的坎，真的会过去。' },
    ];
    return seeds.map((s, i) => ({
      id: 'seed_'+i,
      content: s.content,
      emotion: s.emotion,
      anonymousName: anonNames[i % anonNames.length],
      hugs: [12,5,28,3,17,9,22,14][i],
      createdAt: Date.now() - (i+1) * 12 * 3600 * 1000,
      ownerId: null
    }));
  }

  function initialState(withSeeds){
    return {
      user: null,
      treeholes: withSeeds ? buildSeedTreeholes() : [],
      chats: [],
      moods: [],
      badges: [],
      meta: { published: 0, hugs: 0, lastCheckIn: 0 }
    };
  }

  function save(state){
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) {}
  }

  // 使用 Vue.reactive 创建响应式根状态
  const state = Vue.reactive(load());

  const listeners = new Set();
  function subscribe(fn){ listeners.add(fn); return () => listeners.delete(fn); }

  function persist(){
    const plain = {
      user: state.user ? {...state.user} : null,
      treeholes: state.treeholes.map(t => ({...t})),
      chats: state.chats.map(c => ({...c, messages: c.messages || []})),
      moods: state.moods.map(m => ({...m})),
      badges: state.badges.map(b => ({...b})),
      meta: {...state.meta}
    };
    save(plain);
    listeners.forEach(fn => { try { fn(state); } catch(e){} });
  }

  const Store = {
    state,
    subscribe,
    login(nickname){
      const id = 'u_' + Math.random().toString(36).slice(2, 9);
      state.user = { id, nickname, createdAt: Date.now(), streakDays: 1 };
      persist();
      return state.user;
    },
    logout(){
      state.user = null;
      persist();
    },
    publishTreehole(content, emotion){
      const id = 't_' + Date.now() + '_' + Math.random().toString(36).slice(2,5);
      const anonNames = ['匿名旅人','月光守护者','深夜小熊','流浪诗人','树洞精灵','沉默的海','夜航船','温柔的风','云上信笺'];
      const item = {
        id, content, emotion,
        anonymousName: anonNames[Math.floor(Math.random()*anonNames.length)],
        hugs: 0, createdAt: Date.now(),
        ownerId: state.user ? state.user.id : null
      };
      state.treeholes = [item, ...state.treeholes];
      state.meta.published = (state.meta.published || 0) + 1;
      persist();
      Store.checkBadge('first_publish');
      return item;
    },
    hugTreehole(id){
      state.treeholes = state.treeholes.map(t => t.id===id ? {...t, hugs:(t.hugs||0)+1} : t);
      state.meta.hugs = (state.meta.hugs || 0) + 1;
      persist();
    },
    saveChat(chatId, messages){
      const exist = state.chats.find(c => c.id===chatId);
      if (exist){
        state.chats = state.chats.map(c => c.id===chatId ? {...c, messages} : c);
      } else {
        state.chats = [...state.chats, { id: chatId, messages }];
      }
      persist();
    },
    addMood(mood, note){
      const entry = { ts: Date.now(), mood, note };
      state.moods = [entry, ...state.moods];
      persist();
      Store.checkBadge('checkin_day');
      return entry;
    },
    checkBadge(id){
      const def = BADGE_DEFS.find(b => b.id===id);
      if (!def) return;
      if (state.badges.some(b => b.id===id)) return;
      state.badges = [...state.badges, { id, unlockedAt: Date.now() }];
      persist();
      // 连续打卡
      if (id==='checkin_day'){
        const days = new Set(state.moods.map(m => new Date(m.ts).toDateString()));
        if (days.size >= 3) Store.checkBadge('streak_3');
        if (days.size >= 7) Store.checkBadge('streak_7');
      }
    },
    reset(){
      Object.assign(state, initialState());
      persist();
    }
  };

  const BADGE_DEFS = [
    { id:'first_publish',  name:'树洞初鸣',   desc:'第一次在树洞倾诉', icon:'🌱' },
    { id:'first_hug',      name:'温柔一抱',   desc:'第一次给别人抱抱', icon:'💗' },
    { id:'first_chat',     name:'AI 挚友',    desc:'与 AI 倾诉超过 3 轮', icon:'💬' },
    { id:'checkin_day',    name:'每日一问',   desc:'完成每日情绪打卡', icon:'📅' },
    { id:'streak_3',       name:'坚持三天',   desc:'连续打卡 3 天', icon:'🔥' },
    { id:'streak_7',       name:'治愈一周',   desc:'连续打卡 7 天', icon:'✨' },
    { id:'first_aid',      name:'自救先锋',   desc:'使用情绪急救包', icon:'🛡️' },
    { id:'week_report',    name:'回望自己',   desc:'查看情绪周报', icon:'📊' },
  ];

  Store.BADGE_DEFS = BADGE_DEFS;

  global.TH = global.TH || {};
  global.TH.Store = Store;

})(window);
