/* ============================================
   无聊APP · 选择困难症
   - 穿搭/吃喝：进页面立即出结果，无任何选项
   - 去哪：5个问题 + 星座 → 推荐目的地 + 攻略
   - 自定义已移除，只保留随机选择（6个框）
   ============================================ */

const Select = {
  // 主页
  render() {
    const m = DATA.me;
    return `
      <div class="user-card" onclick="Select.editProfile()">
        <div class="user-avatar">${m.avatar}</div>
        <div class="user-info">
          <b>${U.esc(m.name)}</b>
          <span>${m.decade} · ${m.sign} · ${m.gender} · ${m.region}</span>
        </div>
        <span class="user-edit">✏️</span>
      </div>

      <div class="section-title">今天选什么？让命运决定</div>
      <div class="choice-grid">
        <div class="choice-card card-mustard" onclick="App.goto('select-outfit')">
          <span class="ico">👔</span>
          <div class="name">今天穿什么</div>
          <div class="desc">穿搭推荐</div>
        </div>
        <div class="choice-card card-mint" onclick="App.goto('select-food')">
          <span class="ico">🍜</span>
          <div class="name">今天吃什么</div>
          <div class="desc">按时段出结果</div>
        </div>
        <div class="choice-card card-sky" onclick="App.goto('select-drink')">
          <span class="ico">🥤</span>
          <div class="name">今天喝什么</div>
          <div class="desc">配当前时段</div>
        </div>
        <div class="choice-card card-pink" onclick="App.goto('select-makeup')">
          <span class="ico">💄</span>
          <div class="name">今日美妆</div>
          <div class="desc">口红/美甲/眼影</div>
        </div>
        <div class="choice-card card-grape" onclick="App.goto('select-travel')">
          <span class="ico">✈️</span>
          <div class="name">去哪玩</div>
          <div class="desc">5问+星座+攻略</div>
        </div>
        <div class="choice-card card-orange" onclick="App.goto('select-random')">
          <span class="ico">🎲</span>
          <div class="name">随机选择</div>
          <div class="desc">6个框 · 你填我选</div>
        </div>
      </div>
      <div style="height:20px"></div>
    `;
  },
  init() {},

  editProfile() {
    const m = DATA.me;
    U.modal(`
      <h3 style="font-family:var(--font-display);font-size:20px;margin-bottom:12px">修改画像</h3>
      <label style="font-size:12px;font-weight:700">星座</label>
      <select id="ed-sign" class="input" style="margin:6px 0 12px">
        ${['白羊','金牛','双子','巨蟹','狮子','处女','天秤','天蝎','射手','摩羯','水瓶','双鱼'].map(s =>
          `<option ${s+'座'===m.sign?'selected':''}>${s}座</option>`).join('')}
      </select>
      <label style="font-size:12px;font-weight:700">年龄</label>
      <input id="ed-age" type="number" class="input" value="${m.age}" min="5" max="120" style="margin:6px 0 12px"/>
      <label style="font-size:12px;font-weight:700">性别</label>
      <select id="ed-gender" class="input" style="margin:6px 0 12px">
        <option ${m.gender==='女'?'selected':''}>女</option>
        <option ${m.gender==='男'?'selected':''}>男</option>
        <option ${m.gender==='其他'?'selected':''}>其他</option>
      </select>
      <label style="font-size:12px;font-weight:700">地区</label>
      <input id="ed-region" class="input" value="${U.esc(m.region)}" style="margin:6px 0 16px"/>
      <button class="btn btn-primary btn-block btn-lg" onclick="Select.saveProfile()">保存</button>
    `);
  },
  saveProfile() {
    const age = parseInt(document.getElementById('ed-age').value);
    if (!age || age < 5 || age > 120) { U.toast('请填写正确的年龄'); return; }
    const curYear = new Date().getFullYear();
    DATA.me.sign = document.getElementById('ed-sign').value;
    DATA.me.age = age;
    DATA.me.decade = U.decadeByYear(curYear - age);
    DATA.me.gender = document.getElementById('ed-gender').value;
    DATA.me.region = document.getElementById('ed-region').value;
    U.closeModal();
    App.renderCurrent();
    U.toast('画像已更新 ✨');
  },

  // ===== 穿搭：进页面立即出结果（综合星座/五行/塔罗/生肖/抽签理由）=====
  _randomSource() {
    const sources = ['星座', '塔罗牌', '生肖运势', '抽签', '五行穿搭'];
    return sources[Math.floor(Math.random() * sources.length)];
  },
  _outfitReason(sign) {
    const r = DATA.zodiacOutfits[sign] || DATA.zodiacOutfits['天秤座'];
    const year = new Date().getFullYear() - DATA.me.age;
    const animal = U.zodiacAnimal(year);
    const wuxing = U.pick(['金','木','水','火','土']);
    const tarot = U.pick(['愚者','魔术师','女祭司','皇后','皇帝','恋人','战车','力量','隐士','命运之轮','正义','星星','太阳','世界']);
    const draw = U.pick(['上上签','上签','上上签','大吉']);
    return `${r.reason} 另外，今日${wuxing}行气场与你${animal}年生肖相合，塔罗抽到「${tarot}」牌，签文${draw}，这一身刚好把这些能量都穿在身上。`;
  },
  outfit() {
    const sign = DATA.me.sign;
    const r = DATA.zodiacOutfits[sign] || DATA.zodiacOutfits['天秤座'];
    const parts = r.style.split('+').map(s => s.trim());
    return `
      <div class="section">
        <div class="scene-hero scene-outfit">
          <div class="scene-host">👗</div>
          <div class="scene-host-bubble">今日穿搭已生成</div>
          <div class="scene-tags">
            <span class="tag tag-mustard">${U.esc(DATA.me.sign)}</span>
            <span class="tag tag-sky">${U.esc(DATA.me.decade)}</span>
          </div>
        </div>
        <div class="result-card" style="margin-top:0">
          <h3 style="font-family:var(--font-display);font-size:22px;color:var(--red)">✨ 今日穿搭推荐</h3>
          <div class="result-row">
            <span class="lbl">幸运色</span>
            <span class="val" style="font-size:18px"><b>${r.colorIco} ${U.esc(r.color)}</b></span>
          </div>
          <div class="result-row">
            <span class="lbl">简单款</span>
            <span class="val" style="font-weight:700">${U.esc(parts[0] || r.style)}</span>
          </div>
          <div class="result-row">
            <span class="lbl">复杂款</span>
            <span class="val" style="font-weight:700">${U.esc(r.style)}</span>
          </div>
          <div class="result-row" style="display:block">
            <span class="lbl" style="display:block;margin-bottom:6px">无聊理由</span>
            <span class="val" style="line-height:1.7;font-size:13px">${U.esc(Select._outfitReason(sign))}</span>
          </div>
        </div>
      </div>
    `;
  },
  outfitInit() {},

  // ===== 饮食：根据当前时间自动判断餐别 =====
  food() {
    const hour = U.hour();
    const period = U.mealPeriod(hour);
    const opts = DATA.mealResults[period];
    const signs = ['白羊','金牛','双子','巨蟹','狮子','处女','天秤','天蝎','射手','摩羯','水瓶','双鱼'];
    const mySignBase = DATA.me.sign.replace('座','');
    const idx = (signs.indexOf(mySignBase) + Math.floor(hour / 4)) % opts.length;
    const r = opts[idx];
    const mealIcon = { '早餐':'🌅', '午餐':'☀️', '晚餐':'🌙', '夜宵':'🌃' }[period];
    return `
      <div class="section">
        <div class="scene-hero scene-food">
          <div class="scene-host">🍜</div>
          <div class="scene-host-bubble">${mealIcon} 现在是${period}时间，${DATA.me.sign} 这么吃</div>
          <div class="scene-tags">
            <span class="tag tag-mustard">${U.now()}</span>
            <span class="tag tag-red">${period}</span>
            <span class="tag tag-sky">${U.esc(DATA.me.sign)}</span>
          </div>
        </div>
        <div class="result-card" style="margin-top:0">
          <h3 style="font-family:var(--font-display);font-size:22px;color:var(--red)">🍜 今日宜吃</h3>
          <div class="result-row">
            <span class="lbl">食物</span>
            <span class="val" style="font-size:18px;font-weight:700">${U.esc(r.food)}</span>
          </div>
          <div class="result-row" style="display:block">
            <span class="lbl" style="display:block;margin-bottom:6px">理由</span>
            <span class="val" style="line-height:1.7;font-size:13px">${U.esc(r.reason)}</span>
          </div>
        </div>

        <div class="section-title">📍 附近外卖 & 团购</div>
        <div class="nearby-list">
          ${r.nearby.map(n => `
            <div class="nearby-card" onclick="U.toast('已为你打开 ${U.esc(n)} 🛵')">
              <span class="nearby-ico">🍽️</span>
              <div class="nearby-info">
                <div class="nearby-name">${U.esc(n)}</div>
                <div class="nearby-meta">人均 ¥${U.rand(20,80)} · ${U.rand(3,15)}分钟</div>
              </div>
              <span class="nearby-go">›</span>
            </div>
          `).join('')}
        </div>
        <button class="btn btn-primary btn-block btn-lg" style="margin-top:14px" onclick="Select.refreshFood()">🔄 重新推荐</button>
      </div>
    `;
  },
  foodInit() {},
  refreshFood() {
    App.renderCurrent();
    U.toast('已根据当前时间重新推荐 🍜');
  },

  // ===== 今天喝什么（独立模块）=====
  drink() {
    const period = U.mealPeriod();
    const list = DATA.drinkResults[period] || DATA.drinkResults['午餐'];
    const r = U.pick(list);
    return `
      <div class="section">
        <div class="scene-hero scene-drink">
          <div class="scene-host">🥤</div>
          <div class="scene-host-bubble">${period}喝这个刚刚好</div>
          <div class="scene-tags">
            <span class="tag tag-red">${period}</span>
            <span class="tag tag-sky">${U.esc(DATA.me.sign)}</span>
          </div>
        </div>
        <div class="result-card" style="margin-top:0">
          <h3 style="font-family:var(--font-display);font-size:22px;color:var(--sky)">🥤 今天喝什么</h3>
          <div class="result-row">
            <span class="lbl">饮品</span>
            <span class="val" style="font-size:18px;font-weight:700">${U.esc(r.name)}</span>
          </div>
          <div class="result-row" style="display:block">
            <span class="lbl" style="display:block;margin-bottom:6px">理由</span>
            <span class="val" style="line-height:1.7;font-size:13px">${U.esc(r.reason)}</span>
          </div>
        </div>
        <button class="btn btn-primary btn-block btn-lg" style="margin-top:14px" onclick="Select.refreshDrink()">🔄 换一杯</button>
      </div>
    `;
  },
  drinkInit() {},
  refreshDrink() {
    App.renderCurrent();
    U.toast('已换一杯 🥤');
  },

  // ===== 今日美妆 =====
  makeup() {
    const m = DATA.makeupResults;
    const source = Select._randomSource();
    return `
      <div class="section">
        <div class="scene-hero scene-makeup">
          <div class="scene-host">💄</div>
          <div class="scene-host-bubble">今日美妆已生成</div>
          <div class="scene-tags">
            <span class="tag tag-mustard">${U.esc(DATA.me.sign)}</span>
            <span class="tag tag-sky">${U.esc(DATA.me.decade)}</span>
            <span class="tag">${source}</span>
          </div>
        </div>
        <div class="result-card" style="margin-top:0">
          <h3 style="font-family:var(--font-display);font-size:20px;color:var(--red)">💋 今日美妆推荐</h3>
          <div class="result-row"><span class="lbl">口红</span><span class="val"><b>${U.esc(m.lipstick)}</b></span></div>
          <div class="result-row"><span class="lbl">美甲</span><span class="val">${U.esc(m.nail)}</span></div>
          <div class="result-row"><span class="lbl">眼影</span><span class="val">${U.esc(m.eyeshadow)}</span></div>
          <div class="result-row" style="display:block">
            <span class="lbl" style="display:block;margin-bottom:6px">理由</span>
            <span class="val" style="line-height:1.7;font-size:13px">${U.esc(m.reason)}（来源：${source}）</span>
          </div>
        </div>
        <button class="btn btn-primary btn-block btn-lg" onclick="U.toast('已收藏到我的美妆库 💄')">收藏推荐</button>
      </div>
    `;
  },
  makeupInit() {},

  // ===== 去哪儿：5个问题 + 星座 =====
  travel() {
    if (Select._travelStep === undefined) {
      Select._travelStep = 0;
      Select._travelAnswers = {};
    }
    if (Select._travelStep >= DATA.travelQuestions.length) {
      return Select._travelResultRender();
    }
    const q = DATA.travelQuestions[Select._travelStep];
    const progress = (Select._travelStep / DATA.travelQuestions.length) * 100;
    return `
      <div class="section">
        <div class="scene-hero scene-travel">
          <div class="scene-host">🧳</div>
          <div class="scene-host-bubble">回答 5 个小问题，让星座帮你选旅行地</div>
          <div class="scene-tags">
            <span class="tag tag-sky">${U.esc(DATA.me.sign)}</span>
            <span class="tag tag-mustard">${Select._travelStep + 1}/${DATA.travelQuestions.length}</span>
          </div>
        </div>
        <div class="bar" style="margin:0 0 14px"><div class="bar-fill" style="width:${progress}%"></div></div>
        <div class="result-card" style="margin-top:0">
          <h3 style="font-family:var(--font-display);font-size:20px;color:var(--red)">🤔 ${U.esc(q.q)}</h3>
          <div class="opt-grid" style="margin-top:14px">
            ${q.opts.map((o, i) => `
              <div class="opt" onclick="Select.answerTravel('${U.esc(o)}')">${U.esc(o)}</div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },
  travelInit() {
    // 只在首次进入时重置；答题后 renderCurrent 会再次调用 init，不能清空进度
    if (Select._travelStep === undefined) {
      Select._travelStep = 0;
      Select._travelAnswers = {};
    }
  },
  answerTravel(ans) {
    Select._travelAnswers[DATA.travelQuestions[Select._travelStep].id] = ans;
    Select._travelStep++;
    App.renderCurrent();
  },
  _travelResultRender() {
    const a = Select._travelAnswers;
    const sign = DATA.me.sign;
    const scores = {};
    DATA.travelDestinations.forEach(d => scores[d.dest] = 0);

    const add = (dest, pts) => { if (scores[dest] !== undefined) scores[dest] += pts; };

    // Q1: 穿梭时空
    if (a.time === '童年夏天') { add('大理', 2); add('青岛', 1); }
    else if (a.time === '盛唐长安') { add('西安', 3); add('敦煌', 1); }
    else if (a.time === '80年代街头') { add('成都', 3); add('青岛', 1); }
    else if (a.time === '未来太空城') { add('三亚', 2); add('西藏', 1); }

    // Q2: 对话动物
    if (a.animal === '猫') { add('成都', 2); add('大理', 1); }
    else if (a.animal === '狗') { add('青岛', 2); add('呼伦贝尔', 1); }
    else if (a.animal === '海豚') { add('三亚', 3); }
    else if (a.animal === '老鹰') { add('呼伦贝尔', 3); add('西藏', 1); }

    // Q3: 治愈伤痛
    if (a.heal === '疲惫的陌生人') { add('大理', 2); add('成都', 1); }
    else if (a.heal === '流浪动物') { add('成都', 2); add('呼伦贝尔', 1); }
    else if (a.heal === '远方的亲人') { add('西安', 2); add('大理', 1); }
    else if (a.heal === '自己') { add('三亚', 2); add('西藏', 1); }

    // Q4: 超能力
    if (a.power === '隐身') { add('大理', 2); add('敦煌', 1); }
    else if (a.power === '飞行') { add('呼伦贝尔', 3); add('西藏', 1); }
    else if (a.power === '读心') { add('成都', 2); add('西安', 1); }
    else if (a.power === '时间暂停') { add('西安', 2); add('敦煌', 1); }

    // Q5: 操控天气
    if (a.weather === '把雨天变晴天') { add('三亚', 3); }
    else if (a.weather === '让沙漠下雪') { add('敦煌', 3); add('西藏', 1); }
    else if (a.weather === '给夏天降温') { add('青岛', 3); add('大理', 1); }
    else if (a.weather === '让极光天天见') { add('西藏', 3); add('呼伦贝尔', 1); }

    // 星座加成
    const base = sign.replace('座', '');
    const fire = ['白羊', '狮子', '射手'];
    const earth = ['金牛', '处女', '摩羯'];
    const wind = ['双子', '天秤', '水瓶'];
    const water = ['巨蟹', '天蝎', '双鱼'];
    if (fire.includes(base)) { add('三亚', 1); add('呼伦贝尔', 1); }
    else if (earth.includes(base)) { add('西安', 1); add('敦煌', 1); }
    else if (wind.includes(base)) { add('成都', 1); add('青岛', 1); }
    else if (water.includes(base)) { add('大理', 1); add('三亚', 1); }

    let best = DATA.travelDestinations[0];
    let bestScore = -1;
    DATA.travelDestinations.forEach(d => {
      if (scores[d.dest] > bestScore) { bestScore = scores[d.dest]; best = d; }
    });

    return `
      <div class="section">
        <div class="scene-hero scene-travel-result" style="background:linear-gradient(135deg,var(--sky-soft),var(--mint-soft))">
          <div class="scene-host" style="font-size:64px">✈️</div>
          <div class="scene-host-bubble" style="color:var(--ink)">算出结果啦！${U.esc(sign)} 适合去这里</div>
          <div class="scene-tags">
            <span class="tag tag-sky">${U.esc(sign)}</span>
            <span class="tag tag-mustard">${U.esc(DATA.me.decade)}</span>
          </div>
        </div>
        <div class="result-card" style="margin-top:0">
          <h3 style="font-family:var(--font-display);font-size:22px;color:var(--red)">✈️ 推荐你去</h3>
          <div style="text-align:center;font-family:var(--font-display);font-size:40px;color:var(--red);margin:10px 0">${U.esc(best.dest)}</div>
          <div class="result-row">
            <span class="lbl">预算</span>
            <span class="val" style="font-weight:700">${U.esc(best.budget)}</span>
          </div>
          <div class="result-row" style="display:block">
            <span class="lbl" style="display:block;margin-bottom:6px">理由</span>
            <span class="val" style="line-height:1.7;font-size:13px">${U.esc(best.reason)}</span>
          </div>
        </div>

        <div class="result-card">
          <h3 style="font-family:var(--font-display);font-size:18px;color:var(--mint)">📖 详细攻略</h3>
          <div style="line-height:1.8;font-size:13px;margin-top:8px">${U.esc(best.guide)}</div>
        </div>

        <button class="btn btn-primary btn-block btn-lg" style="margin-top:14px" onclick="Select.travelAgain()">🔄 再测一次</button>
      </div>
    `;
  },
  travelAgain() {
    Select._travelStep = 0;
    Select._travelAnswers = {};
    App.renderCurrent();
  },

  // ===== 随机选择：6个框，不需要完全输入 =====
  random() {
    return `
      <div class="section">
        <div class="scene-hero scene-random">
          <div class="scene-host">🎲</div>
          <div class="scene-host-bubble">把纠结交给命运，填 2-6 个选项</div>
          <div class="scene-tags">
            <span class="tag tag-mustard">6个框</span>
            <span class="tag tag-sky">不用全填</span>
          </div>
        </div>
        <div class="input-grid-6" style="margin-top:0">
          ${Array.from({length:6}, (_,i) => `
            <input class="input rand-input" data-idx="${i}" placeholder="选项${i+1}" maxlength="20"/>
          `).join('')}
        </div>
        <div style="font-size:12px;color:var(--ink-soft);margin:10px 0;text-align:center">
          至少填2个，命运骰子才能转起来
        </div>
        <div class="dice-stage">
          <div class="dice-cube" id="dice-cube">🎲</div>
          <div class="dice-result" id="dice-result">点下面的按钮</div>
        </div>
        <button class="btn btn-primary btn-block btn-lg" onclick="Select.rollRandom()">🎲 转！</button>
      </div>
    `;
  },
  randomInit() {},
  rollRandom() {
    const inputs = document.querySelectorAll('.rand-input');
    let opts = [];
    inputs.forEach(inp => {
      const v = inp.value.trim();
      if (v) opts.push(v);
    });
    if (opts.length < 2) {
      U.toast('至少填2个选项');
      return;
    }
    const cube = document.getElementById('dice-cube');
    const result = document.getElementById('dice-result');
    cube.classList.remove('rolling');
    void cube.offsetWidth;
    cube.classList.add('rolling');
    result.textContent = '转动中…';
    setTimeout(() => {
      cube.classList.remove('rolling');
      const chosen = U.pick(opts);
      result.textContent = chosen;
      result.style.animation = 'none'; void result.offsetWidth;
      result.style.animation = 'pop .4s';
      U.toast(`骰子说：${chosen}`);
    }, 900);
  },
};

window.Select = Select;
