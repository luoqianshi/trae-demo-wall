// demo.js — 峡谷思路 · 王者意识 AI 教练 · 交互 Demo
(function () {
  'use strict';

  // ====================================================================
  // 数据
  // ====================================================================
  const HEROES = [
    { n: '马可波罗', r: '射手', p: { early: 3, mid: 7, late: 8 }, tag: ['真伤', '位移', '后期'] },
    { n: '后羿', r: '射手', p: { early: 5, mid: 6, late: 8 }, tag: ['站桩', '开团'] },
    { n: '鲁班七号', r: '射手', p: { early: 4, mid: 6, late: 9 }, tag: ['站桩', '后期'] },
    { n: '伽罗', r: '射手', p: { early: 3, mid: 6, late: 9 }, tag: ['手长', '后期'] },
    { n: '虞姬', r: '射手', p: { early: 6, mid: 7, late: 7 }, tag: ['自保', '物免'] },
    { n: '瑶', r: '辅助', p: { early: 3, mid: 6, late: 7 }, tag: ['保护', '单保'] },
    { n: '张飞', r: '辅助', p: { early: 7, mid: 8, late: 8 }, tag: ['开团', '保人'] },
    { n: '蔡文姬', r: '辅助', p: { early: 6, mid: 7, late: 6 }, tag: ['回复', '抱团'] },
    { n: '大乔', r: '辅助', p: { early: 5, mid: 8, late: 8 }, tag: ['转线', '运营'] },
    { n: '露娜', r: '打野', p: { early: 3, mid: 8, late: 8 }, tag: ['蓝耗', '发育', '操作'] },
    { n: '李白', r: '打野', p: { early: 4, mid: 7, late: 7 }, tag: ['拉扯', '收割'] },
    { n: '韩信', r: '打野', p: { early: 7, mid: 7, late: 5 }, tag: ['节奏', '带线'] },
    { n: '兰陵王', r: '打野', p: { early: 8, mid: 6, late: 4 }, tag: ['前期', '抓单'] },
    { n: '阿轲', r: '打野', p: { early: 5, mid: 7, late: 6 }, tag: ['收割', '进场'] },
    { n: '沈梦溪', r: '中路', p: { early: 5, mid: 8, late: 6 }, tag: ['消耗', '支援'] },
    { n: '王昭君', r: '中路', p: { early: 5, mid: 7, late: 7 }, tag: ['控制', '守塔'] },
    { n: '诸葛亮', r: '中路', p: { early: 5, mid: 8, late: 7 }, tag: ['收割', '位移'] },
    { n: '安琪拉', r: '中路', p: { early: 6, mid: 7, late: 6 }, tag: ['爆发', '蹲草'] },
    { n: '妲己', r: '中路', p: { early: 4, mid: 6, late: 6 }, tag: ['单点', '蹲草'] },
    { n: '吕布', r: '对抗路', p: { early: 4, mid: 7, late: 9 }, tag: ['真伤', '团战'] },
    { n: '关羽', r: '对抗路', p: { early: 6, mid: 8, late: 7 }, tag: ['绕后', '开团'] },
    { n: '马超', r: '对抗路', p: { early: 6, mid: 8, late: 7 }, tag: ['带线', '机动'] },
    { n: '亚瑟', r: '对抗路', p: { early: 6, mid: 6, late: 5 }, tag: ['沉默', '抗压'] },
    { n: '廉颇', r: '对抗路', p: { early: 7, mid: 8, late: 7 }, tag: ['控制', '开团'] },
    { n: '项羽', r: '对抗路', p: { early: 6, mid: 7, late: 7 }, tag: ['坦度', '开团'] }
  ];

  const HERO_TIPS = {
    '马可波罗': '前期清线别硬换血,等末世后再主动接团;团战先叠被动,别第一时间交大。',
    '瑶': '优先跟露娜保蓝区和进野节奏,中后期再绑定马可波罗打收割;不要裸探草。',
    '露娜': '蓝区是命门。前 4 分钟宁可少抓人,也要保证蓝 buff 和等级不断档。',
    '沈梦溪': '前期别为了消耗压太深。你的职责是帮守野区入口、快速清线支援,不是单人打穿中路。',
    '吕布': '前期抗压为主,中后期大招封路配合马可进场;别把大招浪费在单抓。',
    '张飞': '前期强保野区和中线,有大招再接正面团,没大招时以反开为主。',
    '兰陵王': '前期一定要制造击杀,拖到后期作用下降;盯住无位移后排。',
    '伽罗': '前期别被抓崩,后期站位决定一切;遇到强突进需要辅助贴身。',
    '韩信': '前期节奏英雄,需要连续控龙和反野;拖后期要靠带线牵制而不是正面硬团。',
    '王昭君': '守塔能力强,打野区口和龙坑地形价值高;技能留给进场点。',
    '廉颇': '前中期控制和抗伤很强,注意他闪现开团;后排要和他保持安全距离。',
    '后羿': '无位移但后期输出高,前期可多抓,后期必须先逼闪现或切保护位。',
    '大乔': '不要被她运营牵着走,看见回城圈要立刻判断是否追击还是拿资源。'
  };


  // ====================================================================
  // Tab 切换
  // ====================================================================
  const tabs = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.panel');
  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(x => x.classList.remove('active'));
    panels.forEach(p => p.classList.remove('active'));
    t.classList.add('active');
    document.getElementById('tab-' + t.dataset.tab).classList.add('active');
  }));

  // ====================================================================
  // Tab 1: BP 教练
  // ====================================================================
  const allyTeam = document.getElementById('ally-team');
  const enemyTeam = document.getElementById('enemy-team');
  const poolHeroes = document.getElementById('pool-heroes');
  const bpOutput = document.getElementById('bp-output');
  let allyPicks = [null, null, null, null, null];
  let enemyPicks = [null, null, null, null, null];
  let activeTeam = 'ally';
  let activeSlot = 0;

  function heroData(name) {
    return HEROES.find(h => h.n === name);
  }

  function renderHeroPool() {
    poolHeroes.innerHTML = '<span style="font-size:.72rem;color:var(--muted);width:100%;font-family:var(--font-mono);letter-spacing:.1em">先点阵容空位,再点下方英雄填入 →</span>';
    HEROES.forEach(h => {
      const used = allyPicks.includes(h.n) || enemyPicks.includes(h.n);
      const chip = document.createElement('div');
      chip.className = 'hero-chip' + (used ? ' disabled' : '');
      chip.textContent = `${h.n} · ${h.r}`;
      chip.addEventListener('click', () => {
        if (used) return;
        const target = activeTeam === 'ally' ? allyPicks : enemyPicks;
        let idx = target.indexOf(null);
        if (idx === -1) idx = activeSlot;
        target[idx] = h.n;
        renderTeamSlots();
        renderHeroPool();
      });
      poolHeroes.appendChild(chip);
    });
  }

  function renderTeamSlots() {
    [...allyTeam.children].forEach((slot, i) => {
      const pick = allyPicks[i];
      slot.classList.toggle('filled', !!pick);
      slot.classList.toggle('ally', !!pick);
      slot.classList.remove('enemy');
      slot.textContent = pick || '空位';
    });
    [...enemyTeam.children].forEach((slot, i) => {
      const pick = enemyPicks[i];
      slot.classList.toggle('filled', !!pick);
      slot.classList.toggle('enemy', !!pick);
      slot.classList.remove('ally');
      slot.textContent = pick || '空位';
    });
  }

  function bindTeam(teamEl, teamName) {
    teamEl.addEventListener('click', e => {
      const slot = e.target.closest('.hero-slot');
      if (!slot) return;
      const idx = +slot.dataset.idx;
      activeTeam = teamName;
      activeSlot = idx;
      const target = teamName === 'ally' ? allyPicks : enemyPicks;
      if (target[idx]) {
        target[idx] = null;
        renderTeamSlots();
        renderHeroPool();
      }
    });
  }
  bindTeam(allyTeam, 'ally');
  bindTeam(enemyTeam, 'enemy');

  function avgStrength(picks, phase) {
    const heroes = picks.filter(Boolean).map(heroData);
    if (!heroes.length) return 0;
    return Math.round(heroes.reduce((sum, h) => sum + h.p[phase], 0) / heroes.length * 10);
  }

  function roleCount(picks, role) {
    return picks.filter(n => heroData(n)?.r === role).length;
  }

  function generateTips(picks, sideName) {
    return picks.filter(Boolean).map(n => {
      const h = heroData(n);
      const base = HERO_TIPS[n] || `${h.r}定位,注意围绕自身强势期打节奏,不要在弱势期硬接无意义团战。`;
      return `<div class="tip-card"><div class="hero-name">${sideName} · ${n}</div><div class="tip-text">${base}</div></div>`;
    }).join('');
  }

  function phaseComment(ally, enemy) {
    const diff = ally - enemy;
    if (diff >= 10) return '己方明显强势,可以主动抢线、控资源。';
    if (diff >= 3) return '己方略强,可用小规模团扩大优势。';
    if (diff > -3) return '双方接近,重点看兵线和技能状态。';
    if (diff > -10) return '己方略弱,少打无视野团,以换资源为主。';
    return '己方明显弱势,必须避战发育,守野区和防掉点优先。';
  }

  function buildGamePlan() {
    const hasMarcoYao = allyPicks.includes('马可波罗') && allyPicks.includes('瑶');
    const hasLuna = allyPicks.includes('露娜');
    const hasShen = allyPicks.includes('沈梦溪');
    const weakEarly = avgStrength(allyPicks, 'early') < avgStrength(enemyPicks, 'early');

    if (hasMarcoYao && hasLuna && hasShen) {
      return {
        conclusion: 'Ban 兰陵王 → 选 蔡文姬 · 前期缩塔发育，12 分钟后接团',
        steps: [
          ['0-4 分钟', '阵容前期偏弱,沈梦溪不要打太猛,中路快速清线后优先看自家蓝区入口;瑶前期先帮露娜守蓝,不要急着挂马可。'],
          ['4-8 分钟', '露娜到 4 后才有节奏能力,第一条暴君不强抢,能换边塔或守住蓝区就是赚;马可波罗以发育出末世为核心。'],
          ['8-12 分钟', '沈梦溪用大招先压血线,露娜找残血进场,马可 + 瑶开始接管中路团;有蓝 buff 的露娜可以主动入侵。'],
          ['12 分钟后', '进入己方强势期,吕布大招封路,沈梦溪消耗,马可波罗叠满被动后再转大;核心原则是"先消耗,后收割,不先手硬开"。']
        ]
      };
    }

    if (weakEarly) {
      return {
        conclusion: '前期避战发育 · 优先守野区 · 拖中后期翻盘',
        steps: [
          ['0-4 分钟', '前期强度不如对面,不要主动反野;中辅第一职责是守自家野区,边路少压线。'],
          ['4-8 分钟', '第一波资源能拿则拿,拿不到就换塔换线,避免因强抢暴君被滚雪球。'],
          ['8-12 分钟', '等核心装备成型后再抱团,用中线优先权换视野和野区入口。'],
          ['12 分钟后', '拖到后期胜算上升,围绕射手/核心打野打保护反开,避免单人掉点。']
        ]
      };
    }

    return {
      conclusion: '前期主动抢线 · 控中立资源 · 别让对面拖到后期',
      steps: [
        ['0-4 分钟', '己方前期不弱,中辅可以抢线帮打野看河道,但不要为了反野牺牲边路线和状态。'],
        ['4-8 分钟', '围绕第一条暴君/主宰先锋开节奏,谁有线权谁先动,优先拿中立资源。'],
        ['8-12 分钟', '利用转线和人数差抓边,扩大外塔优势,别让对面拖到后期装备成型。'],
        ['12 分钟后', '如果优势未扩大,后期要稳视野、控龙王,用兵线逼团而不是无脑冲高地。']
      ]
    };
  }

  document.getElementById('btn-bp-example').addEventListener('click', () => {
    allyPicks = ['马可波罗', '瑶', '露娜', '沈梦溪', '吕布'];
    enemyPicks = ['伽罗', '张飞', '兰陵王', '王昭君', '廉颇'];
    renderTeamSlots();
    renderHeroPool();
    bpOutput.innerHTML = '<div class="empty">示例阵容已填入,点击 <b style="color:var(--accent)">AI 分析阵容</b> 查看完整思路。</div>';
  });

  document.getElementById('btn-bp-reset').addEventListener('click', () => {
    allyPicks = [null, null, null, null, null];
    enemyPicks = [null, null, null, null, null];
    renderTeamSlots();
    renderHeroPool();
    bpOutput.innerHTML = '<div class="empty">← 先填入己方与对面 5 个英雄,或直接点 <b style="color:var(--accent)">填入示例</b>,再点 <b style="color:var(--accent)">AI 分析阵容</b></div>';
  });

  document.getElementById('btn-bp-analyze').addEventListener('click', () => {
    const allyFilled = allyPicks.filter(Boolean);
    const enemyFilled = enemyPicks.filter(Boolean);
    if (allyFilled.length < 5 || enemyFilled.length < 5) {
      bpOutput.innerHTML = '<div class="empty" style="color:var(--danger)">请先把己方和对面 5 个英雄都填满</div>';
      return;
    }
    bpOutput.innerHTML = '<div class="empty"><b style="color:var(--accent)">AI 正在分析双方阵容...</b><br><small>计算前中后期强度 / 关键英雄注意事项 / 胜算曲线 / 整局思路</small></div>';

    setTimeout(() => {
      const phases = [
        { k: 'early', name: '前期 0-4 分钟' },
        { k: 'mid', name: '中期 4-12 分钟' },
        { k: 'late', name: '后期 12 分钟后' }
      ];
      const scores = phases.map(p => ({ ...p, ally: avgStrength(allyPicks, p.k), enemy: avgStrength(enemyPicks, p.k) }));
      const winRates = scores.map(s => Math.max(28, Math.min(72, 50 + Math.round((s.ally - s.enemy) * 0.9))));
      const plan = buildGamePlan();
      const hasLuna = allyPicks.includes('露娜');
      const hasShen = allyPicks.includes('沈梦溪');
      const hasProtect = roleCount(allyPicks, '辅助') > 0;
      const coreWarning = (hasLuna && hasShen)
        ? '核心提醒:露娜前期野区守护能力较弱,沈梦溪前期不要打太猛,优先清线保蓝区入口;等露娜 4 级和马可波罗末世后再逐步接团。'
        : (scores[0].ally < scores[0].enemy ? '核心提醒:前期弱于对面,先保野区、保中线、少打无视野小团。' : '核心提醒:前期可以主动抢线,但不要为了反野牺牲边路线和状态。');

      bpOutput.innerHTML = `
        <div class="bp-verdict">
          <div class="tagline">AI 核心判断</div>
          <div class="main">${plan.conclusion}</div>
          <div class="sub">拖到 <span class="hl">${scores[2].ally > scores[2].enemy ? '后期' : scores[1].ally > scores[1].enemy ? '中期' : '装备成型后'}</span> 胜算最大，当前前期<span class="hl">${scores[0].ally > scores[0].enemy ? '略强' : '偏弱'}</span></div>
        </div>
        <h4>① 前中后期强度</h4>
        <div class="strength-grid">
          ${scores.map(s => `
            <div class="phase-card">
              <div class="phase-name">${s.name}</div>
              <div class="score">己 ${s.ally} / 敌 ${s.enemy}</div>
              <div class="note">${phaseComment(s.ally, s.enemy)}</div>
            </div>
          `).join('')}
        </div>
        <h4 style="margin-top:1rem">② 阵容六维属性对比</h4>
        <figure class="bp-radar-wrap">
          <figcaption>双方阵容在爆发 / 控制 / 续航 / 机动 / 推塔 / 视野六维上的对比</figcaption>
          <div id="bp-radar"></div>
        </figure>
        <h4 style="margin-top:1rem">③ 拖到前中后期的胜算变化</h4>
        ${scores.map((s, i) => `
          <div class="win-curve">
            <div class="label">${i === 0 ? '前期' : i === 1 ? '中期' : '后期'}</div>
            <div class="rail"><div class="fill" style="width:${winRates[i]}%"></div></div>
            <div class="pct">${winRates[i]}%</div>
          </div>
        `).join('')}
        <h4 style="margin-top:1rem">④ 各英雄应对技巧 / 注意事项</h4>
        <div class="hero-tips">
          ${generateTips(allyPicks, '己方')}
          ${generateTips(enemyPicks, '对面')}
        </div>
        <h4 style="margin-top:1rem">⑤ 整局对局思路</h4>
        <div class="recommend">
          <div class="rh">${hasProtect ? '围绕核心发育,避免前期无意义团战' : '缺少稳定保护,站位和视野优先级更高'}</div>
          <div class="rd">${coreWarning}</div>
        </div>
        <div class="plan-list">
          ${plan.steps.map(p => `<div class="plan-step"><div class="time">${p[0]}</div><div class="text">${p[1]}</div></div>`).join('')}
        </div>
      `;

      // 初始化阵容雷达图
      setTimeout(() => {
        const radarEl = document.getElementById('bp-radar');
        if (!radarEl || typeof echarts === 'undefined') return;
        const radarChart = echarts.init(radarEl, null, { renderer: 'svg' });
        const allyH = allyPicks.filter(Boolean).map(heroData);
        const enemyH = enemyPicks.filter(Boolean).map(heroData);
        const dims = ['爆发', '控制', '续航', '机动', '推塔', '视野'];
        const calcDim = (heroes, dim) => {
          if (!heroes.length) return 0;
          const map = {
            '爆发': h => h.p.mid > 7 ? 80 : h.p.early > 7 ? 75 : 55,
            '控制': h => /控制|沉默|开团|保护/.test((HERO_TIPS[h.n] || '') + h.tag.join('')) ? 80 : h.r === '辅助' || h.r === '坦克' ? 65 : 45,
            '续航': h => h.tag.includes('回复') || h.n === '蔡文姬' ? 90 : h.r === '辅助' ? 60 : h.r === '射手' ? 50 : 50,
            '机动': h => h.tag.includes('位移') || h.tag.includes('机动') || h.n === '韩信' || h.n === '马超' ? 90 : h.tag.includes('拉扯') ? 70 : 50,
            '推塔': h => h.r === '射手' ? 90 : h.r === '法师' && h.p.late > 7 ? 70 : h.r === '战士' ? 60 : 40,
            '视野': h => h.r === '辅助' || h.r === '坦克' ? 80 : h.r === '打野' ? 70 : h.r === '法师' ? 60 : 50
          };
          return Math.round(heroes.reduce((s, h) => s + map[dim](h), 0) / heroes.length);
        };
        const allyV = dims.map(d => calcDim(allyH, d));
        const enemyV = dims.map(d => calcDim(enemyH, d));
        radarChart.setOption({
          animation: false,
          backgroundColor: 'transparent',
          tooltip: { trigger: 'item', appendToBody: true, backgroundColor: 'rgba(17,20,51,.95)', borderColor: '#2c3160', textStyle: { color: '#f3f5ff' } },
          legend: { data: ['己方', '对面'], textStyle: { color: '#9095c4' }, right: 10, top: 'middle', orient: 'vertical', itemWidth: 14, itemHeight: 8 },
          radar: {
            indicator: dims.map(d => ({ name: d, max: 100 })),
            shape: 'polygon',
            center: ['42%', '50%'],
            radius: '65%',
            splitNumber: 4,
            axisName: { color: '#9095c4', fontSize: 11 },
            splitLine: { lineStyle: { color: '#2c3160' } },
            splitArea: { show: true, areaStyle: { color: ['rgba(26,31,71,.5)', 'rgba(26,31,71,.3)'] } },
            axisLine: { lineStyle: { color: '#2c3160' } }
          },
          series: [{
            type: 'radar',
            data: [
              { value: allyV, name: '己方', itemStyle: { color: '#6ea8fe' }, areaStyle: { color: 'rgba(110,168,254,.25)' }, lineStyle: { width: 2 } },
              { value: enemyV, name: '对面', itemStyle: { color: '#ff6b9d' }, areaStyle: { color: 'rgba(255,107,157,.25)' }, lineStyle: { width: 2 } }
            ]
          }]
        });
        window.addEventListener('resize', () => radarChart.resize());
      }, 150);
    }, 900);
  });

  renderTeamSlots();
  renderHeroPool();


  // ====================================================================
  // Tab 2: 局中实时指导
  // ====================================================================
  const SCRIPT = [
    // [游戏时间秒, 标题, 提示文字, 是否更新计时器/小地图]
    { t: 5,  msg: '喂，开局先去<span class="key">蓝buff</span>，辅助帮你开一下，这时候反野的人少 — 稳稳发育别浪。', tts: '开局先去蓝buff，稳稳发育' },
    { t: 30, msg: '中路兵线过来了，小心<span class="key">河道那两个草丛</span>，对面打野最喜欢在这蹲 — 没视野别硬上。', tts: '注意河道草丛，没视野别硬上' },
    { t: 95, msg: '对面打野<span class="key">已经消失 8 秒了</span>，大概率在下半区晃悠 — 上路兄弟收着点，别压太深。', tts: '对面打野消失了，上路收着点' },
    { t: 150, msg: '兵线进塔了，<span class="key">趁机回家补个装备</span>，4 分钟一塔节奏快到了，状态不好别硬守。', tts: '兵线进塔，回家补装备' },
    { t: 235, msg: '⚠ 兄弟，<span class="key">暴君还有 30 秒刷新</span>！残血的先回家，辅助去龙坑旁边插个眼，别被人抢了。', tts: '暴君三十秒刷新，准备抢龙' },
    { t: 300, msg: '集合打<span class="key">暴君</span>！射手注意最后一刀，你站后排输出就行，别贪近身。', tts: '集合打暴君，射手站后排' },
    { t: 420, msg: '经济落后 2k 了，<span class="key">别跟他们正面团</span> — 去带线牵制，打 4 保 1，等主宰刷新再找机会。', tts: '经济落后，别正面团，带线' },
    { t: 540, msg: '<span class="key">主宰还有 40 秒</span>刷新，先把下半区视野做了，这波稳拿别丢。', tts: '主宰四十秒，先布视野' },
    { t: 660, msg: '主宰 buff 到手！<span class="key">别在中路墨迹</span>，直接带边路兵线施压，逼他们分人回防。', tts: '主宰到手，带边路施压' },
    { t: 780, msg: '⚠ 对面五人挤在中路 — <span class="key">你是射手站这么前干嘛</span>？等坦克先开团吸收技能，你再输出。', tts: '射手别站前面，等坦克开团' },
    { t: 900, msg: '高地决战了！<span class="key">先等对面交闪现或者控制</span>，集火秒了法师再开团，别急。', tts: '高地决战，先秒法师再开团' },
    { t: 1020, msg: '<span class="key">风暴龙王 20 秒</span>刷新，先插眼再打！别莽，没视野直接打龙等于送。', tts: '风暴龙王刷新，先插眼再打' }
  ];

  const TIMER_MARKS = {
    180: { baojun: '04:00' },
    240: { baojun: '00:30 ⚠' },
    540: { zhuzai: '09:30' },
    600: { zhuzai: '00:30 ⚠' },
    1000: { xianzhi: '17:20 ⚠' }
  };

  const overlayEl = document.getElementById('ai-overlay');
  const aiMsg = document.getElementById('ai-msg');
  const aiTime = document.getElementById('ai-time');
  const gameClock = document.getElementById('game-clock');
  const progressBar = document.getElementById('progress-bar');
  const coachLog = document.getElementById('coach-log');
  const tBaojun = document.getElementById('t-baojun');
  const tZhuzai = document.getElementById('t-zhuzai');
  const tXianzhi = document.getElementById('t-xianzhi');

  let playing = false;
  let gameSec = 0;
  let timerInt = null;
  let scriptIdx = 0;
  let mode = 'detail'; // silent / brief / detail
  let voiceOn = true;
  let overlayOn = true;
  const TOTAL = 1200; // 20 分钟
  const SPEED = 8;    // 1 真实秒 = 8 游戏秒,2.5 分钟跑完

  function fmtTime(s) {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  }

  function speakTTS(text) {
    if (!voiceOn) return;
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'zh-CN';
      u.rate = 1.05;
      u.pitch = 1.0;
      window.speechSynthesis.speak(u);
    } catch (e) { /* ignore */ }
  }

  function showAIMessage(item) {
    if (mode === 'silent') return;
    const msg = mode === 'brief' ? item.tts : item.msg;
    aiTime.textContent = fmtTime(item.t);
    aiMsg.innerHTML = msg;
    if (overlayOn) {
      overlayEl.classList.add('show');
      setTimeout(() => overlayEl.classList.remove('show'), 4500);
    }
    speakTTS(item.tts);

    // 写入日志
    const empty = coachLog.querySelector('.log-empty');
    if (empty) empty.remove();
    const li = document.createElement('div');
    li.className = 'log-item';
    li.innerHTML = `<span class="t">${fmtTime(item.t)}</span><span class="m">${item.tts}</span>`;
    // header 之后插入
    const header = coachLog.querySelector('h4');
    header.insertAdjacentElement('afterend', li);
  }

  function tick() {
    gameSec += SPEED;
    if (gameSec > TOTAL) gameSec = TOTAL;
    gameClock.textContent = fmtTime(gameSec);
    progressBar.style.width = (gameSec / TOTAL * 100) + '%';

    // 计时器更新
    Object.keys(TIMER_MARKS).forEach(k => {
      if (gameSec >= +k && gameSec < +k + SPEED) {
        const m = TIMER_MARKS[k];
        if (m.baojun) tBaojun.textContent = m.baojun;
        if (m.zhuzai) tZhuzai.textContent = m.zhuzai;
        if (m.xianzhi) tXianzhi.textContent = m.xianzhi;
      }
    });

    // 触发脚本
    while (scriptIdx < SCRIPT.length && gameSec >= SCRIPT[scriptIdx].t) {
      showAIMessage(SCRIPT[scriptIdx]);
      scriptIdx++;
    }

    if (gameSec >= TOTAL) {
      stopGame();
      const li = document.createElement('div');
      li.className = 'log-item';
      li.innerHTML = `<span class="t">${fmtTime(TOTAL)}</span><span class="m" style="color:var(--good)">★ 比赛结束 — 切到「局后复盘」看 AI 自动分析。</span>`;
      coachLog.querySelector('h4').insertAdjacentElement('afterend', li);
    }
  }

  function startGame() {
    if (playing) return;
    playing = true;
    document.getElementById('btn-play').textContent = '暂停';
    timerInt = setInterval(tick, 1000);
  }
  function stopGame() {
    playing = false;
    document.getElementById('btn-play').textContent = '继续';
    clearInterval(timerInt);
  }
  function resetGame() {
    stopGame();
    gameSec = 0;
    scriptIdx = 0;
    gameClock.textContent = '00:00';
    progressBar.style.width = '0%';
    tBaojun.textContent = '--:--';
    tZhuzai.textContent = '--:--';
    tXianzhi.textContent = '--:--';
    overlayEl.classList.remove('show');
    coachLog.innerHTML = '<h4>AI 提示日志</h4><div class="log-empty">点击"开始演示"查看 AI 战术提示流</div>';
    document.getElementById('btn-play').textContent = '开始演示';
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }


  // 初始化进度条关键节点
  const progressNodes = document.getElementById('progress-nodes');
  SCRIPT.forEach((item, i) => {
    const node = document.createElement('div');
    node.className = 'p-node';
    node.style.left = (item.t / TOTAL * 100) + '%';
    const tip = document.createElement('div');
    tip.className = 'p-tip';
    tip.textContent = fmtTime(item.t) + ' · ' + item.tts.substring(0, 12) + '...';
    node.appendChild(tip);
    node.addEventListener('click', () => {
      resetGame();
      gameSec = item.t;
      scriptIdx = i;
      gameClock.textContent = fmtTime(gameSec);
      progressBar.style.width = (gameSec / TOTAL * 100) + '%';
      // 高亮当前节点
      document.querySelectorAll('.p-node').forEach(n => n.classList.remove('active'));
      node.classList.add('active');
      // 触发当前及之前的所有消息
      for (let j = 0; j < i; j++) {
        const li = document.createElement('div');
        li.className = 'log-item';
        li.innerHTML = `<span class="t">${fmtTime(SCRIPT[j].t)}</span><span class="m">${SCRIPT[j].tts}</span>`;
        const header = coachLog.querySelector('h4');
        const empty = coachLog.querySelector('.log-empty');
        if (empty) empty.remove();
        header.insertAdjacentElement('afterend', li);
      }
      showAIMessage(item);
    });
    progressNodes.appendChild(node);
  });

  document.getElementById('btn-play').addEventListener('click', () => {
    if (playing) stopGame(); else startGame();
  });
  document.getElementById('btn-reset-live').addEventListener('click', resetGame);

  // 模式切换
  document.querySelectorAll('.mode-btn').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      mode = b.dataset.mode;
      document.getElementById('m-mode').textContent = { silent: '静音', brief: '简略', detail: '详细' }[mode];
    });
  });

  // toggles
  document.getElementById('t-voice').addEventListener('click', e => {
    e.currentTarget.classList.toggle('on');
    voiceOn = e.currentTarget.classList.contains('on');
    document.getElementById('m-sound').textContent = voiceOn ? 'ON' : 'OFF';
    if (!voiceOn && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  });
  document.getElementById('t-overlay').addEventListener('click', e => {
    e.currentTarget.classList.toggle('on');
    overlayOn = e.currentTarget.classList.contains('on');
    if (!overlayOn) overlayEl.classList.remove('show');
  });


  // Replay 决策时间轴初始化
  (function initReplayTimeline() {
    const timeline = document.getElementById('decision-timeline');
    const track = timeline.querySelector('.tl-track');
    const cards = document.querySelectorAll('.replay-card');
    if (!cards.length) return;
    timeline.style.display = '';
    cards.forEach((card, i) => {
      const time = +card.dataset.time || 0;
      const type = card.dataset.type || 'warn';
      const left = (time / TOTAL * 100) + '%';
      const dot = document.createElement('div');
      dot.className = 'tl-dot ' + type;
      dot.style.left = left;
      dot.dataset.index = i;
      const timeLabel = document.createElement('div');
      timeLabel.className = 'tl-time';
      timeLabel.textContent = fmtTime(time);
      timeLabel.style.left = left;
      dot.addEventListener('click', () => {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.style.borderColor = 'var(--accent)';
        setTimeout(() => { card.style.borderColor = ''; }, 2000);
        document.querySelectorAll('.tl-dot').forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
      });
      track.appendChild(dot);
      track.appendChild(timeLabel);
    });
  })();

  // 当用户切到其他 tab 时停止语音
  tabs.forEach(t => t.addEventListener('click', () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }));
})();
