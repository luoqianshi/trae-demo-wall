// ============ 心声树洞 - 视图组件 ============
(function(global){
  'use strict';

  const { reactive, ref, computed, onMounted, onBeforeUnmount, watch, h } = Vue;
  const Store = global.TH.Store;
  const Lib = global.TH.Lib;
  const Audio = global.TH.Audio;
  const AI = global.TH.AI;

  const Toast = reactive({ show:false, msg:'', type:'info' });
  function showToast(msg, type='info'){
    Toast.msg = msg; Toast.type = type; Toast.show = true;
    setTimeout(() => Toast.show=false, 2200);
  }

  const helpers = {
    emotionOf(key){ return Lib.EMOTIONS[key] || Lib.EMOTIONS.lost; },
    moodOf(idx){ return Lib.MOODS[idx] || Lib.MOODS[2]; },
    timeAgo: Lib.timeAgo
  };

  // ====== 登录页 ======
  const LoginView = {
    template: `
      <div class="min-h-screen flex items-center justify-center p-6 animate-fade-in">
        <div class="w-full max-w-md">
          <div class="text-center mb-8 animate-slide-up">
            <div class="inline-block relative">
              <div class="text-6xl heartbeat">🌳</div>
              <div class="absolute inset-0 blur-xl opacity-60" style="background:radial-gradient(circle,#ff6b9d,transparent 70%);"></div>
            </div>
            <h1 class="font-display text-5xl mt-6 grad-text">心声树洞</h1>
            <p class="text-white/60 mt-3 text-sm tracking-wide">给每一份情绪，一个温柔的出口</p>
          </div>
          <div class="glass rounded-3xl p-8 animate-slide-up" style="animation-delay:.15s">
            <div class="mb-5">
              <label class="text-white/70 text-sm mb-2 block">给自己取一个昵称</label>
              <input v-model="nickname" maxlength="12" class="field" placeholder="匿名旅人" />
              <p class="text-white/40 text-xs mt-2">🌙 全程匿名，你的树洞永远不会被熟人发现</p>
            </div>
            <button @click="enter" class="btn-glow w-full py-3.5 text-base font-medium">进入我的树洞</button>
            <button @click="randomName" class="w-full mt-3 py-2 text-sm text-white/60 hover:text-white/90 transition">✨ 随机一个温柔的名字</button>
          </div>
          <p class="text-center text-white/30 text-xs mt-6">本应用不收集任何真实身份信息 · 数据仅保存在本设备</p>
        </div>
      </div>
    `,
    data(){ return { nickname: '' }; },
    methods: {
      randomName(){
        const names = ['月光守护者','深夜小熊','流浪诗人','树洞精灵','沉默的海','夜航船','温柔的风','云上信笺','拾光的人','海边拾贝'];
        this.nickname = names[Math.floor(Math.random()*names.length)];
      },
      enter(){
        const n = this.nickname.trim() || ('匿名旅人' + Math.floor(Math.random()*999));
        Store.login(n);
        showToast('欢迎你，' + n, 'success');
        window.TH.bus.emit('nav', { name: 'home' });
      }
    }
  };

  // ====== 主框架 ======
  const AppShell = {
    props: ['route'],
    template: `
      <div class="min-h-screen flex flex-col">
        <header class="sticky top-0 z-40 glass-strong border-b border-white/10">
          <div class="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
            <div class="flex items-center gap-3">
              <div class="text-2xl">🌳</div>
              <div>
                <div class="font-display text-lg leading-tight">心声树洞</div>
                <div class="text-[11px] text-white/50 leading-tight hidden sm:block">给情绪一个温柔的出口</div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <div class="text-right hidden sm:block">
                <div class="text-sm text-white/90">{{ user.nickname }}</div>
                <div class="text-[11px] text-white/50">已陪伴 {{ streak }} 天</div>
              </div>
              <div class="w-9 h-9 rounded-full glass-strong flex items-center justify-center text-lg">{{ avatar }}</div>
            </div>
          </div>
        </header>

        <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 pb-28 lg:pb-10">
          <component :is="currentView" :route="route" />
        </main>

        <nav class="hidden lg:block fixed left-6 top-1/2 -translate-y-1/2 z-40 glass-strong rounded-full p-3">
          <div v-for="t in tabs" :key="t.key"
               @click="nav(t.key)"
               :class="['w-12 h-12 rounded-full flex items-center justify-center my-2 cursor-pointer transition text-2xl',
                        current===t.key ? 'bg-gradient-to-br from-coral-500 to-midnight-500 shadow-glow' : 'hover:bg-white/10 text-white/60']"
               :title="t.label">
            <span>{{ t.emoji }}</span>
          </div>
        </nav>

        <nav class="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass-strong border-t border-white/10">
          <div class="grid grid-cols-5">
            <div v-for="t in tabs" :key="t.key"
                 @click="nav(t.key)"
                 :class="['flex flex-col items-center py-3 cursor-pointer tab-item transition',
                          current===t.key ? 'tab-active text-coral-400' : 'text-white/60']">
              <span class="text-xl mb-1">{{ t.emoji }}</span>
              <span class="text-[11px]">{{ t.short }}</span>
              <div class="tab-dot w-1 h-1 rounded-full bg-coral-400 mt-0.5"></div>
            </div>
          </div>
        </nav>

        <div v-if="toast.show" class="fixed top-20 left-1/2 -translate-x-1/2 z-50 toast-pop">
          <div class="glass-strong rounded-full px-5 py-2.5 text-sm">{{ toast.msg }}</div>
        </div>
      </div>
    `,
    data(){
      return {
        tabs: [
          { key:'home',      label:'首页',     short:'首页',   emoji:'🏠' },
          { key:'treehole',  label:'心声树洞', short:'树洞',   emoji:'🌳' },
          { key:'companion', label:'AI 陪伴',  short:'AI',     emoji:'🤍' },
          { key:'first-aid', label:'急救包',   short:'急救',   emoji:'🫧' },
          { key:'profile',   label:'我的',     short:'我的',   emoji:'👤' }
        ]
      };
    },
    computed: {
      user(){ return Store.state.user || { nickname:'旅人', streakDays:1 }; },
      current(){ return this.route && this.route.name || 'home'; },
      currentView(){
        return ({
          home: global.TH.Views.HomeView,
          treehole: global.TH.Views.TreeHoleView,
          'treehole-publish': global.TH.Views.PublishView,
          companion: global.TH.Views.CompanionView,
          'first-aid': global.TH.Views.FirstAidView,
          profile: global.TH.Views.ProfileView,
          'profile-weekly': global.TH.Views.WeeklyView,
        })[this.current] || global.TH.Views.HomeView;
      },
      avatar(){ return (this.user.nickname || '旅').charAt(0); },
      toast(){ return Toast; },
      streak(){
        const days = new Set(Store.state.moods.map(m => new Date(m.ts).toDateString()));
        return Math.max(days.size, 1);
      }
    },
    watch: {
      route(){ window.scrollTo({ top: 0, behavior: 'smooth' }); }
    },
    methods: {
      nav(name){ window.TH.bus.emit('nav', { name }); }
    }
  };

  // ====== 首页 ======
  const HomeView = {
    template: `
      <div class="space-y-6 animate-fade-in">
        <section class="glass rounded-3xl p-6 sm:p-8 animate-slide-up">
          <div class="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div class="text-white/50 text-xs tracking-widest">今天的心情</div>
              <h2 class="font-display text-2xl sm:text-3xl mt-1">{{ greet }}{{ user.nickname }} ·</h2>
              <p class="text-white/60 text-sm mt-1">{{ tip }}</p>
            </div>
            <div class="text-right">
              <div class="text-white/40 text-xs">已打卡</div>
              <div class="font-display text-3xl">{{ streak }}</div>
              <div class="text-white/40 text-xs">天</div>
            </div>
          </div>

          <div class="mt-6 grid grid-cols-5 gap-3 sm:gap-4">
            <button v-for="m in moods" :key="m.key"
                    @click="pickMood(m)"
                    :class="['group relative p-4 sm:p-5 rounded-2xl transition',
                             picked===m.key ? 'bg-white/15 ring-2 ring-coral-400/60' : 'bg-white/5 hover:bg-white/10']">
              <div class="text-3xl sm:text-4xl transition group-hover:scale-110">{{ m.emoji }}</div>
              <div class="text-xs text-white/70 mt-2">{{ m.label }}</div>
            </button>
          </div>
        </section>

        <section class="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-up" style="animation-delay:.1s">
          <div @click="nav('treehole')" class="glass rounded-3xl p-6 cursor-pointer hover:-translate-y-1 transition group">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-coral-500/25 flex items-center justify-center text-2xl">🌳</div>
              <div>
                <div class="font-medium">去树洞倾诉</div>
                <div class="text-white/50 text-xs">匿名发布心事，接收抱抱</div>
              </div>
            </div>
            <div class="text-white/40 text-xs mt-4 line-clamp-3">有 {{ recentHoles }} 位旅人最近在这里留下了心声，他们都被温柔接住了。</div>
            <div class="text-coral-400 text-sm mt-3 opacity-0 group-hover:opacity-100 transition">去看看 →</div>
          </div>

          <div @click="nav('companion')" class="glass rounded-3xl p-6 cursor-pointer hover:-translate-y-1 transition group">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-mint-500/25 flex items-center justify-center text-2xl">🤍</div>
              <div>
                <div class="font-medium">和 AI 聊聊</div>
                <div class="text-white/50 text-xs">温柔陪伴，随时在线</div>
              </div>
            </div>
            <div class="text-white/40 text-xs mt-4 line-clamp-3">想说又不敢说的话，可以先对 AI 说。不会评判，只会倾听。</div>
            <div class="text-mint-400 text-sm mt-3 opacity-0 group-hover:opacity-100 transition">开始对话 →</div>
          </div>

          <div @click="nav('first-aid')" class="glass rounded-3xl p-6 cursor-pointer hover:-translate-y-1 transition group">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-midnight-400/30 flex items-center justify-center text-2xl">🫧</div>
              <div>
                <div class="font-medium">情绪急救包</div>
                <div class="text-white/50 text-xs">呼吸练习 · 白噪音 · 故事</div>
              </div>
            </div>
            <div class="text-white/40 text-xs mt-4 line-clamp-3">当情绪涌上来时，选一种方式先把它安顿下来。</div>
            <div class="text-white/70 text-sm mt-3 opacity-0 group-hover:opacity-100 transition">深呼吸 →</div>
          </div>
        </section>

        <section class="glass rounded-3xl p-6 animate-slide-up" style="animation-delay:.2s">
          <div class="flex items-center justify-between mb-4">
            <div class="font-display text-xl">今日推荐</div>
            <div class="text-white/40 text-xs">{{ weekTips[picked-1] || weekTips[2] }}</div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div v-for="(tip, i) in weekTips.slice(0, 4)" :key="i"
                 :class="['p-4 rounded-2xl border transition',
                          i===picked-1 ? 'bg-white/10 border-coral-400/40' : 'bg-white/5 border-white/5']">
              <div class="text-sm">{{ tip }}</div>
            </div>
          </div>
        </section>
      </div>
    `,
    data(){
      return {
        moods: Lib.MOODS,
        picked: 3,
        weekTips: [
          '情绪低落时，先把自己当朋友对待。',
          '写下来比想下去更省力。',
          '你不必对所有人解释自己。',
          '一杯温水，一个深呼吸，先照顾好身体。',
          '允许自己今天"不优秀"。',
          '你已经做得比你以为的更好了。',
          '活着本身就已经是了不起的事。'
        ]
      };
    },
    computed: {
      user(){ return Store.state.user || { nickname:'旅人' }; },
      greet(){
        const h = new Date().getHours();
        if (h < 6) return '夜深了，';
        if (h < 11) return '早安，';
        if (h < 14) return '午安，';
        if (h < 18) return '下午好，';
        if (h < 22) return '晚上好，';
        return '夜深了，';
      },
      tip(){ return Lib.MOODS[this.picked-1].tip; },
      streak(){
        const days = new Set(Store.state.moods.map(m => new Date(m.ts).toDateString()));
        return Math.max(days.size, 1);
      },
      recentHoles(){ return Math.max(8, Store.state.treeholes.length + 5); }
    },
    mounted(){
      const last = Store.state.moods[0];
      if (last) this.picked = last.mood;
    },
    methods: {
      pickMood(m){
        this.picked = m.key;
        Store.addMood(m.key, '');
        showToast(m.emoji + ' 谢谢你诚实记录自己', 'success');
      },
      nav(name){ window.TH.bus.emit('nav', { name }); }
    }
  };

  // ====== 心声树洞 ======
  const TreeHoleView = {
    template: `
      <div class="space-y-5 animate-fade-in">
        <div class="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 class="font-display text-3xl">🌳 心声树洞</h2>
            <p class="text-white/50 text-sm">你说的话，树会接住</p>
          </div>
          <button @click="nav('treehole-publish')" class="btn-glow px-5 py-2.5 text-sm">✍️ 我也要倾诉</button>
        </div>

        <div class="flex gap-2 flex-wrap">
          <button v-for="f in filters" :key="f.key"
                  @click="filter=f.key"
                  :class="['px-3 py-1.5 rounded-full text-xs transition',
                           filter===f.key ? 'bg-white text-midnight-900' : 'bg-white/10 text-white/70 hover:bg-white/20']">
            {{ f.label }}
          </button>
        </div>

        <div v-if="!holes.length" class="glass rounded-3xl p-8 text-center">
          <div class="text-5xl mb-4">✨</div>
          <div class="text-lg">还没有树洞</div>
          <div class="text-white/50 text-sm mt-1">第一条可以是你哦</div>
          <button @click="nav('treehole-publish')" class="btn-glow mt-5">写下第一条</button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <article v-for="h in filteredHoles" :key="h.id"
                   class="glass rounded-3xl p-5 animate-slide-up hover:-translate-y-1 transition relative overflow-hidden">
            <div class="absolute top-0 left-0 right-0 h-[3px]" :style="{background: emotionOf(h.emotion).color}"></div>
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-full glass-strong flex items-center justify-center">{{ (h.anonymousName||'匿').charAt(0) }}</div>
                <div>
                  <div class="text-sm font-medium">{{ h.anonymousName }}</div>
                  <div class="text-white/40 text-[11px]">{{ timeAgo(h.createdAt) }}</div>
                </div>
              </div>
              <span :class="['emotion-tag', emotionOf(h.emotion).cls]">
                {{ emotionOf(h.emotion).emoji }} {{ emotionOf(h.emotion).label }}
              </span>
            </div>
            <p class="text-sm leading-relaxed text-white/85 whitespace-pre-wrap">{{ h.content }}</p>
            <div class="mt-4 flex items-center justify-between">
              <button @click="hug(h)" class="flex items-center gap-1.5 text-white/70 hover:text-coral-400 transition text-sm">
                <span class="text-lg">🤗</span> 抱抱 · {{ h.hugs }}
              </button>
              <span class="text-white/30 text-xs">你不是一个人</span>
            </div>
          </article>
        </div>
      </div>
    `,
    data(){
      return { filter:'all', filters: [
        { key:'all',      label:'全部' },
        { key:'anxiety',  label:'焦虑' },
        { key:'lonely',   label:'孤独' },
        { key:'anger',    label:'愤怒' },
        { key:'lost',    label:'迷茫' },
        { key:'heal',    label:'治愈' }
      ]};
    },
    computed: {
      holes(){
        return Store.state.treeholes;
      },
      filteredHoles(){
        if (this.filter==='all') return this.holes;
        return this.holes.filter(h => h.emotion===this.filter);
      }
    },
    methods: {
      emotionOf: helpers.emotionOf,
      nav(n){ window.TH.bus.emit('nav', { name:n }); },
      hug(h){
        Store.hugTreehole(h.id);
        h.hugs += 1;
        Store.checkBadge('first_hug');
        showToast('🤗 一个温柔的抱抱已送达', 'success');
      },
      timeAgo: Lib.timeAgo
    }
  };

  // ====== 发布树洞 ======
  const PublishView = {
    template: `
      <div class="max-w-2xl mx-auto animate-fade-in">
        <div @click="nav('treehole')" class="text-white/60 text-sm mb-4 cursor-pointer hover:text-white">← 返回树洞</div>
        <div class="glass rounded-3xl p-6 sm:p-8 animate-slide-up">
          <div class="font-display text-2xl">我想说……</div>
          <p class="text-white/50 text-sm mt-1">你的声音会被温柔接住，没有人会认识你</p>

          <div class="mt-5">
            <label class="text-white/70 text-sm mb-2 block">此刻的心情</label>
            <div class="grid grid-cols-5 gap-2">
              <button v-for="e in emotions" :key="e.key"
                      @click="emotion=e.key"
                      :class="['p-3 rounded-xl transition text-xs',
                               emotion===e.key ? 'bg-white/15 ring-2' : 'bg-white/5 hover:bg-white/10']"
                      :style="emotion===e.key ? { borderColor: e.color } : {}">
                <div class="text-2xl">{{ e.emoji }}</div>
                <div class="text-white/70 mt-1">{{ e.label }}</div>
              </button>
            </div>
          </div>

          <div class="mt-5">
            <label class="text-white/70 text-sm mb-2 block">想说的话</label>
            <textarea v-model="content" maxlength="400" rows="6" class="field resize-none" placeholder="在这里写下任何你想说的，不完美也没关系…"></textarea>
            <div class="text-right text-white/40 text-xs mt-1">{{ content.length }}/400</div>
          </div>

          <div class="mt-6 flex gap-3">
            <button @click="nav('treehole')" class="flex-1 py-3 rounded-full bg-white/10 hover:bg-white/20 transition text-sm">取消</button>
            <button @click="publish" :disabled="!canPublish" class="btn-glow flex-1 py-3 text-sm disabled:opacity-50">发布到树洞</button>
          </div>
        </div>

        <div class="text-center text-white/40 text-xs mt-4">🌟 发布即代表你同意以匿名方式展示，仅在本设备可见</div>
      </div>
    `,
    data(){ return { content:'', emotion:'lost' }; },
    computed: {
      emotions(){ return Object.values(Lib.EMOTIONS); },
      canPublish(){ return this.content.trim().length >= 5; }
    },
    methods: {
      nav(n){ window.TH.bus.emit('nav', { name:n }); },
      publish(){
        if (!this.canPublish) return;
        Store.publishTreehole(this.content.trim(), this.emotion);
        showToast('🌳 你的声音被树洞接住了', 'success');
        this.content = '';
        window.TH.bus.emit('nav', { name: 'treehole' });
      }
    }
  };

  // ====== AI 情感陪伴 ======
  const CompanionView = {
    template: `
      <div class="max-w-3xl mx-auto h-[calc(100vh-180px)] min-h-[500px] flex flex-col glass rounded-3xl overflow-hidden animate-fade-in">
        <div class="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-coral-400 to-midnight-500 flex items-center justify-center text-xl">🤍</div>
            <div>
              <div class="font-medium">小伴 · 你的 AI 陪伴师</div>
              <div class="text-[11px] text-mint-400 flex items-center gap-1">
                <span class="inline-block w-1.5 h-1.5 rounded-full bg-mint-400 animate-pulse"></span> 在线 · 不会评判，只会倾听
              </div>
            </div>
          </div>
          <button @click="clearChat" class="text-white/50 text-xs hover:text-white">清空对话</button>
        </div>

        <div ref="streamEl" class="flex-1 overflow-y-auto px-4 py-5 space-y-3 bg-gradient-to-b from-transparent to-black/20">
          <div v-if="messages.length===0" class="text-center text-white/50 mt-10">
            <div class="text-4xl mb-3">🫧</div>
            <div>你可以从任何一句话开始</div>
            <div class="text-xs mt-2">比如："我今天考试没考好"</div>
          </div>
          <div v-for="m in messages" :key="m.id"
               :class="['flex gap-2 items-start animate-slide-up', m.role==='user' ? 'justify-end' : '']">
            <div v-if="m.role==='ai'" class="w-8 h-8 rounded-full bg-gradient-to-br from-coral-400 to-midnight-500 flex items-center justify-center text-sm shrink-0">🤍</div>
            <div :class="['bubble', m.role==='user' ? 'bubble-user' : 'bubble-ai', m.typing ? 'typing' : '']">{{ m.content }}</div>
            <div v-if="m.role==='user'" class="w-8 h-8 rounded-full glass-strong flex items-center justify-center text-sm shrink-0">{{ avatar }}</div>
          </div>
        </div>

        <div v-if="suggestions.length" class="px-4 py-3 border-t border-white/10 flex gap-2 overflow-x-auto">
          <button v-for="s in suggestions" :key="s" @click="send(s)"
                  class="whitespace-nowrap text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition text-white/80">{{ s }}</button>
        </div>

        <div class="px-4 py-3 border-t border-white/10 flex items-end gap-2">
          <textarea v-model="draft" rows="1" @keydown.enter.exact.prevent="send(draft)" class="field resize-none flex-1" placeholder="跟小伴说点什么… (Enter 发送)"></textarea>
          <button @click="send(draft)" :disabled="!draft.trim() || loading" class="btn-glow px-4 py-2.5 text-sm shrink-0 disabled:opacity-50">{{ loading ? '…' : '发送' }}</button>
        </div>
      </div>
    `,
    data(){
      return {
        chatId: 'main',
        messages: [],
        draft: '',
        loading: false,
        suggestions: ['今天有点累','我很焦虑','一个人好孤单','有点生气','对未来很迷茫']
      };
    },
    computed: {
      avatar(){ return (Store.state.user?.nickname || '旅').charAt(0); }
    },
    mounted(){
      const saved = Store.state.chats.find(c => c.id===this.chatId);
      if (saved && saved.messages.length){
        this.messages = saved.messages.map(m => ({...m}));
        if (this.messages.length===0) this.welcome();
      } else {
        this.welcome();
      }
    },
    watch: {
      messages: {
        deep: true,
        handler(){
          Store.saveChat(this.chatId, this.messages.map(m => ({ role: m.role, content: m.content, ts: m.ts||Date.now() })));
          this.scrollToBottom();
        }
      }
    },
    methods: {
      welcome(){
        this.messages.push({ id: 'ai_'+Date.now(), role:'ai', content: Lib.randomPick(Lib.AI_REPLIES.greeting), ts: Date.now() });
      },
      scrollToBottom(){
        this.$nextTick(() => { if (this.$refs.streamEl) this.$refs.streamEl.scrollTop = this.$refs.streamEl.scrollHeight; });
      },
      send(text){
        const t = (text || '').trim();
        if (!t || this.loading) return;
        this.messages.push({ id:'u_'+Date.now(), role:'user', content:t, ts:Date.now() });
        this.draft = '';
        this.loading = true;
        const aiMsg = { id:'ai_'+Date.now(), role:'ai', content:'', ts:Date.now(), typing:true };
        this.messages.push(aiMsg);

        const lines = AI.respond(t);
        let lineIdx = 0;
        let charIdx = 0;
        const tick = () => {
          if (lineIdx >= lines.length){
            aiMsg.typing = false;
            this.loading = false;
            const userTurns = this.messages.filter(m => m.role==='user').length;
            if (userTurns >= 3) Store.checkBadge('first_chat');
            return;
          }
          const line = lines[lineIdx];
          if (charIdx <= line.length){
            aiMsg.content = line.slice(0, charIdx);
            charIdx++;
            setTimeout(tick, 22);
          } else {
            aiMsg.content += '\n\n';
            lineIdx++;
            charIdx = 0;
            setTimeout(tick, 450);
          }
        };
        tick();
      },
      clearChat(){
        if (!confirm('确定清空全部对话吗？')) return;
        this.messages = [];
        Store.saveChat(this.chatId, []);
        this.welcome();
      }
    }
  };

  // ====== 情绪急救包 ======
  const FirstAidView = {
    template: `
      <div class="space-y-6 animate-fade-in">
        <div class="flex items-center gap-3">
          <div class="text-4xl">🫧</div>
          <div>
            <h2 class="font-display text-3xl">情绪急救包</h2>
            <p class="text-white/50 text-sm">当情绪涌上来时，选一种方式先把它安顿下来</p>
          </div>
        </div>

        <section class="glass rounded-3xl p-6 sm:p-8">
          <div class="flex items-center justify-between mb-4">
            <div>
              <div class="font-display text-xl">4-7-8 呼吸练习</div>
              <div class="text-white/50 text-xs">吸气 4 秒 · 屏息 7 秒 · 呼气 8 秒，重复 4 轮</div>
            </div>
            <div :class="['text-xs px-3 py-1 rounded-full', running ? 'bg-mint-500/25 text-mint-400' : 'bg-white/10 text-white/60']">
              {{ running ? '进行中' : '未开始' }}
            </div>
          </div>
          <div class="flex flex-col sm:flex-row items-center gap-8">
            <div class="relative">
              <div :class="['breath-ring', phase]">
                <div class="text-center">
                  <div class="text-white/90 font-display text-xl">{{ phaseText }}</div>
                  <div class="text-white/60 text-sm mt-1">{{ countdown }}</div>
                </div>
              </div>
            </div>
            <div class="flex-1 w-full">
              <p class="text-white/70 text-sm leading-relaxed">跟着圆环一起呼吸。如果走神了，也没关系，轻轻地把注意力带回来就好。这是你给自己的 1 分钟。</p>
              <div class="mt-4 flex gap-2">
                <button @click="startBreath" :disabled="running" class="btn-glow px-5 py-2 text-sm disabled:opacity-50">{{ running ? '进行中…' : '开始练习' }}</button>
                <button @click="stopBreath" :disabled="!running" class="px-5 py-2 text-sm rounded-full bg-white/10 hover:bg-white/20 transition disabled:opacity-40">停止</button>
              </div>
            </div>
          </div>
        </section>

        <section class="glass rounded-3xl p-6 sm:p-8">
          <div class="font-display text-xl mb-1">白噪音</div>
          <div class="text-white/50 text-xs mb-5">选一种环境音，让它成为你此刻的背景</div>
          <div class="grid grid-cols-3 gap-3">
            <button v-for="p in audioList" :key="p.key"
                    @click="toggleAudio(p.key)"
                    :class="['p-5 rounded-2xl transition text-left relative overflow-hidden',
                             currentAudio===p.key ? 'bg-white/15 ring-2 ring-coral-400/50' : 'bg-white/5 hover:bg-white/10']">
              <div class="text-3xl">{{ p.icon }}</div>
              <div class="text-sm mt-2">{{ p.name }}</div>
              <div v-if="currentAudio===p.key" class="text-[11px] text-coral-400 mt-1 flex items-center gap-1">
                <span class="inline-block w-1.5 h-1.5 rounded-full bg-coral-400 animate-pulse"></span>正在播放
              </div>
            </button>
          </div>
          <button v-if="currentAudio" @click="toggleAudio('')" class="mt-4 text-xs text-white/60 hover:text-white">停止所有</button>
        </section>

        <section class="glass rounded-3xl p-6 sm:p-8">
          <div class="flex items-center justify-between mb-4">
            <div>
              <div class="font-display text-xl">过来人故事</div>
              <div class="text-white/50 text-xs">{{ storyIndex+1 }} / {{ stories.length }}</div>
            </div>
            <button @click="nextStory" class="text-sm text-white/70 hover:text-white">换一个 →</button>
          </div>
          <div class="p-5 rounded-2xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10 min-h-[140px]">
            <div class="font-medium text-coral-400">{{ currentStory.title }}</div>
            <p class="text-white/80 text-sm leading-relaxed mt-2">{{ currentStory.body }}</p>
          </div>
        </section>

        <section class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div v-for="t in tips" :key="t.title" class="glass rounded-2xl p-5">
            <div class="text-xl mb-2">{{ t.icon }}</div>
            <div class="font-medium text-sm">{{ t.title }}</div>
            <div class="text-white/60 text-xs mt-1 leading-relaxed">{{ t.body }}</div>
          </div>
        </section>
      </div>
    `,
    data(){
      return {
        phase: 'exhale', phaseText: '准备好了吗', countdown: 0, running: false,
        breathTimer: null,
        audioList: [
          { key:'rain',   name:'细雨', icon:'🌧️' },
          { key:'wave',   name:'海浪', icon:'🌊' },
          { key:'forest', name:'森林', icon:'🌲' }
        ],
        currentAudio: '',
        stories: Lib.STORY_CARDS,
        storyIndex: 0,
        tips: [
          { icon:'💧', title:'一杯温水', body:'水会把你的身体温柔地唤醒' },
          { icon:'📝', title:'写下来', body:'把情绪写在纸上，就已经分担了一半' },
          { icon:'🚶', title:'走 10 分钟', body:'哪怕只是下楼取个快递，也是对身体的照顾' },
          { icon:'📞', title:'给信任的人发一句', body:'不必说全部，只说"我今天有点累"也可以' }
        ]
      };
    },
    computed: { currentStory(){ return this.stories[this.storyIndex]; } },
    beforeUnmount(){ this.stopBreath(); Audio.stop(); },
    methods: {
      startBreath(){
        if (this.running) return;
        this.running = true;
        Store.checkBadge('first_aid');
        showToast('🫧 跟着圆环呼吸', 'success');
        const pattern = [
          { phase:'inhale',  text:'吸气',   sec: 4 },
          { phase:'hold',    text:'屏息',   sec: 7 },
          { phase:'exhale',  text:'呼气',   sec: 8 }
        ];
        let p = 0, s = 0, round = 0;
        const step = () => {
          if (!this.running) return;
          const cur = pattern[p];
          this.phase = cur.phase;
          this.phaseText = cur.text;
          this.countdown = cur.sec - s;
          s++;
          if (s >= cur.sec){
            s = 0; p = (p+1) % 3;
            if (p === 0) round++;
          }
          if (round >= 4){
            this.stopBreath();
            this.phaseText = '你做得真好 💗';
            this.countdown = 0;
            return;
          }
          this.breathTimer = setTimeout(step, 1000);
        };
        step();
      },
      stopBreath(){
        this.running = false;
        if (this.breathTimer){ clearTimeout(this.breathTimer); this.breathTimer = null; }
        this.phase = 'exhale';
      },
      toggleAudio(key){
        if (this.currentAudio === key){ Audio.stop(); this.currentAudio = ''; return; }
        if (key){ Audio.play(key); showToast('🎧 ' + (this.audioList.find(a=>a.key===key)?.name || '') + ' 已播放', 'success'); }
        this.currentAudio = key;
      },
      nextStory(){ this.storyIndex = (this.storyIndex+1) % this.stories.length; }
    }
  };

  // ====== 我的 ======
  const ProfileView = {
    template: `
      <div class="space-y-6 animate-fade-in">
        <section class="glass rounded-3xl p-6 sm:p-8 relative overflow-hidden">
          <div class="blob" style="width:240px;height:240px;background:#ff6b9d;top:-60px;right:-60px;opacity:.35"></div>
          <div class="flex items-center gap-5 relative">
            <div class="w-16 h-16 rounded-full glass-strong flex items-center justify-center text-2xl">{{ avatar }}</div>
            <div class="flex-1">
              <div class="font-display text-2xl">{{ user.nickname }}</div>
              <div class="text-white/50 text-xs mt-1">已加入 {{ joined }} · 陪伴 {{ streak }} 天</div>
              <div class="flex gap-4 mt-3">
                <div><span class="font-display text-xl">{{ stats.published }}</span> <span class="text-white/50 text-xs">次倾诉</span></div>
                <div><span class="font-display text-xl">{{ stats.hugs }}</span> <span class="text-white/50 text-xs">次抱抱</span></div>
                <div><span class="font-display text-xl">{{ badges.length }}</span> <span class="text-white/50 text-xs">枚徽章</span></div>
              </div>
            </div>
            <button @click="logout" class="text-white/60 text-xs hover:text-coral-400">退出</button>
          </div>
        </section>

        <section class="glass rounded-3xl p-6 sm:p-8">
          <div class="flex items-center justify-between mb-4">
            <div>
              <div class="font-display text-xl">本周情绪</div>
              <div class="text-white/50 text-xs">最近 7 天 · 数据在本设备本地</div>
            </div>
            <button @click="showWeekly" class="text-sm text-coral-400 hover:text-white">查看详情 →</button>
          </div>
          <div ref="chartEl" style="height:180px"></div>
          <div class="mt-3 text-white/70 text-sm">{{ weekSummary }}</div>
        </section>

        <section class="glass rounded-3xl p-6 sm:p-8">
          <div class="font-display text-xl mb-4">我的徽章</div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div v-for="b in defs" :key="b.id"
                 :class="['badge-card rounded-2xl p-4 text-center', unlocked(b.id) ? 'glass-strong' : 'bg-white/5 opacity-40']">
              <div class="text-3xl">{{ b.icon }}</div>
              <div class="text-sm mt-2 font-medium">{{ b.name }}</div>
              <div class="text-white/40 text-[11px] mt-1">{{ b.desc }}</div>
              <div v-if="unlocked(b.id)" class="text-[11px] text-mint-400 mt-1">已获得</div>
            </div>
          </div>
        </section>

        <section class="glass rounded-3xl p-6 sm:p-8">
          <div class="font-display text-xl mb-4">最近的情绪</div>
          <div v-if="!moods.length" class="text-white/50 text-sm text-center py-8">还没有记录，去首页打个卡吧～</div>
          <div v-for="(m,i) in moods.slice(0,8)" :key="i" class="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
            <div class="text-2xl">{{ moodOf(m.mood-1).emoji }}</div>
            <div class="flex-1">
              <div class="text-sm">{{ moodOf(m.mood-1).label }}</div>
              <div class="text-white/40 text-xs">{{ fmt(m.ts) }}</div>
            </div>
          </div>
        </section>
      </div>
    `,
    data(){ return { chart: null }; },
    computed: {
      user(){ return Store.state.user || { nickname:'旅人', createdAt: Date.now() }; },
      avatar(){ return (this.user.nickname || '旅').charAt(0); },
      defs(){ return Store.BADGE_DEFS; },
      badges(){ return Store.state.badges; },
      moods(){ return Store.state.moods; },
      stats(){ return Store.state.meta; },
      streak(){
        const days = new Set(this.moods.map(m => new Date(m.ts).toDateString()));
        return Math.max(days.size, 1);
      },
      joined(){ return Lib.timeAgo(this.user.createdAt); },
      weekSummary(){
        const week = this.moods.filter(m => Date.now()-m.ts < 7*24*3600*1000);
        if (!week.length) return '本周还没有情绪记录。完成几次打卡后，这里会出现属于你的文字小结。';
        const avg = week.reduce((a,b)=>a+b.mood, 0) / week.length;
        const label = avg >= 4 ? '整体偏向积极' : avg >= 3 ? '相对平稳' : '有些起伏';
        return `本周共记录 ${week.length} 天，平均心情 ${avg.toFixed(1)} / 5，${label}。`;
      }
    },
    mounted(){ this.$nextTick(() => this.drawChart()); },
    methods: {
      moodOf: helpers.moodOf,
      unlocked(id){ return this.badges.some(b => b.id===id); },
      fmt(ts){ return new Date(ts).toLocaleString('zh-CN', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' }); },
      showWeekly(){ Store.checkBadge('week_report'); window.TH.bus.emit('nav', { name: 'profile-weekly' }); },
      logout(){
        if (!confirm('确定退出当前身份？（你的本地数据会保留）')) return;
        Store.logout();
        window.location.reload();
      },
      drawChart(){
        const el = this.$refs.chartEl;
        if (!el || !window.Chart) return;
        if (this.chart){ this.chart.destroy(); }
        const labels = Array.from({length: 7}, (_,i) => {
          const d = new Date(); d.setDate(d.getDate() - (6-i));
          return ['日','一','二','三','四','五','六'][d.getDay()];
        });
        const data = Array.from({length: 7}, (_,i) => {
          const d = new Date(); d.setDate(d.getDate() - (6-i));
          const dayMoods = this.moods.filter(m => new Date(m.ts).toDateString() === d.toDateString());
          if (!dayMoods.length) return 0;
          return +(dayMoods.reduce((a,b)=>a+b.mood,0)/dayMoods.length).toFixed(1);
        });
        this.chart = new window.Chart(el, {
          type: 'line',
          data: { labels, datasets: [{
            label: '心情指数', data,
            borderColor: '#ff6b9d',
            backgroundColor: 'rgba(255,107,157,.2)',
            tension: .4, fill: true,
            pointBackgroundColor: '#ff8fb1', pointRadius: 4, pointHoverRadius: 6
          }]},
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display:false } },
            scales: {
              x: { ticks:{ color:'rgba(255,255,255,.5)' }, grid:{ color:'rgba(255,255,255,.04)' } },
              y: { min:0, max:5, ticks:{ stepSize:1, color:'rgba(255,255,255,.5)' }, grid:{ color:'rgba(255,255,255,.04)' } }
            }
          }
        });
      }
    }
  };

  // ====== 周报详情 ======
  const WeeklyView = {
    template: `
      <div class="max-w-3xl mx-auto animate-fade-in space-y-5">
        <div @click="back" class="text-white/60 text-sm cursor-pointer hover:text-white">← 返回我的</div>
        <div class="glass rounded-3xl p-6 sm:p-8">
          <div class="font-display text-3xl">📊 本周情绪周报</div>
          <p class="text-white/50 text-sm mt-1">你最近 7 天的情绪轨迹</p>
          <div ref="chartEl" style="height:240px" class="mt-5"></div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="glass rounded-2xl p-5">
            <div class="text-white/50 text-xs">最常见的情绪</div>
            <div class="font-display text-2xl mt-1">{{ topEmotion }}</div>
          </div>
          <div class="glass rounded-2xl p-5">
            <div class="text-white/50 text-xs">最活跃的一天</div>
            <div class="font-display text-2xl mt-1">{{ topDay }}</div>
          </div>
        </div>
        <div class="glass rounded-3xl p-6 sm:p-8">
          <div class="font-display text-xl mb-2">致你的一封信</div>
          <p class="text-white/80 leading-relaxed whitespace-pre-wrap">{{ letter }}</p>
        </div>
      </div>
    `,
    computed: {
      weekMoods(){ return Store.state.moods.filter(m => Date.now()-m.ts < 7*24*3600*1000); },
      topEmotion(){
        if (!this.weekMoods.length) return '暂无数据';
        const counts = [0,0,0,0,0];
        this.weekMoods.forEach(m => counts[m.mood-1]++);
        const i = counts.indexOf(Math.max(...counts));
        return Lib.MOODS[i].emoji + ' ' + Lib.MOODS[i].label;
      },
      topDay(){
        if (!this.weekMoods.length) return '暂无数据';
        const byDay = {};
        this.weekMoods.forEach(m => { const d = new Date(m.ts).toDateString(); byDay[d] = (byDay[d]||0) + 1; });
        const top = Object.entries(byDay).sort((a,b)=>b[1]-a[1])[0];
        return top ? new Date(top[0]).toLocaleDateString('zh-CN',{ month:'long', day:'numeric', weekday:'long' }) : '暂无';
      },
      letter(){
        const m = this.weekMoods;
        if (!m.length){
          return '你还没有记录本周的情绪。明天试着花一分钟，问问自己"今天过得怎么样"，然后诚实地写下一个表情就好。';
        }
        const avg = m.reduce((a,b)=>a+b.mood,0)/m.length;
        const best = m.reduce((a,b)=> a.mood>=b.mood?a:b);
        const worst = m.reduce((a,b)=> a.mood<=b.mood?a:b);
        const lines = ['亲爱的你：', '', `这周，你记录了 ${m.length} 天的情绪。平均值 ${avg.toFixed(1)} / 5。`];
        if (best && worst){
          lines.push(`最灿烂的那一天，是 ${new Date(best.ts).toLocaleDateString('zh-CN',{month:'long',day:'numeric'})}；`);
          lines.push(`最低谷的那一天，是 ${new Date(worst.ts).toLocaleDateString('zh-CN',{month:'long',day:'numeric'})}。`);
        }
        lines.push('');
        lines.push(avg >= 4
          ? '整体看起来，这周你过得不错。请把这份"不错"牢牢记在心里，等下次低落时回来取一点。'
          : avg >= 3
            ? '整体平稳。平静本身就是礼物，不必非要"积极"。'
            : '这周有些辛苦。但你撑过来了，这本身就值得被肯定。');
        lines.push('');
        lines.push('下周也要好好照顾自己。');
        lines.push('—— 你的树洞朋友');
        return lines.join('\n');
      }
    },
    mounted(){ this.$nextTick(() => this.draw()); },
    methods: {
      back(){ window.TH.bus.emit('nav', { name:'profile' }); },
      draw(){
        const el = this.$refs.chartEl;
        if (!el || !window.Chart) return;
        const labels = Array.from({length: 7}, (_,i) => {
          const d = new Date(); d.setDate(d.getDate() - (6-i));
          return ['日','一','二','三','四','五','六'][d.getDay()];
        });
        const data = Array.from({length: 7}, (_,i) => {
          const d = new Date(); d.setDate(d.getDate() - (6-i));
          const ms = this.weekMoods.filter(m => new Date(m.ts).toDateString()===d.toDateString());
          if (!ms.length) return 0;
          return +(ms.reduce((a,b)=>a+b.mood,0)/ms.length).toFixed(1);
        });
        new window.Chart(el, {
          type: 'bar',
          data: { labels, datasets: [{
            data,
            backgroundColor: data.map(v => v===0 ? 'rgba(255,255,255,.08)' : `hsla(${ 180 - v*30 }, 85%, 65%, .8)`),
            borderRadius: 12
          }]},
          options: {
            responsive:true, maintainAspectRatio:false,
            plugins: { legend:{display:false} },
            scales: {
              x: { ticks:{ color:'rgba(255,255,255,.5)' }, grid:{ display:false } },
              y: { min:0, max:5, ticks:{ color:'rgba(255,255,255,.5)' }, grid:{ color:'rgba(255,255,255,.05)' } }
            }
          }
        });
      }
    }
  };

  global.TH.Views = {
    LoginView, AppShell,
    HomeView, TreeHoleView, PublishView,
    CompanionView, FirstAidView,
    ProfileView, WeeklyView
  };

})(window);
