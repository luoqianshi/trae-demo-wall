// =====================================================================
// 开心组 - 趣味互动类游戏（4个）
// 所有函数自包含，CSS类名加前缀，变量在函数内部声明
// =====================================================================

// ---------------------------------------------------------------------
// 游戏1：情绪对对碰（翻牌记忆配对）
// ---------------------------------------------------------------------
function gameMatchInit(root) {
  // 情绪emoji池（最多15个，对应困难难度）
  const POOL = ['😊','🤩','😍','😎','🥳','🤗','😇','🥰','😆','😜','🤪','😁','😄','🥹','😴'];
  // 难度配置：[对数, 列数]
  const LEVELS = {
    easy:   { pairs: 6,  cols: 4, name: '简单' },
    normal: { pairs: 8,  cols: 4, name: '普通' },
    hard:   { pairs: 15, cols: 6, name: '困难' }
  };
  let curLevel = 'easy';
  let cards = [];      // 卡牌数据
  let flipped = [];    // 当前翻开未配对的卡索引
  let lock = false;    // 锁定（动画进行中）
  let steps = 0;
  let matched = 0;
  let timer = null;
  let startTime = 0;
  let elapsed = 0;

  root.innerHTML = `
    <style>
      .match-wrap{font-family:'Segoe UI',sans-serif;color:#fff;max-width:760px;margin:0 auto;padding:12px;}
      .match-title{font-size:24px;font-weight:800;text-align:center;background:linear-gradient(90deg,#ffd166,#ff6b6b);-webkit-background-clip:text;background-clip:text;color:transparent;margin-bottom:6px;}
      .match-sub{text-align:center;color:#ffe9a8;font-size:13px;margin-bottom:10px;}
      .match-bar{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;align-items:center;margin-bottom:10px;}
      .match-btn{background:linear-gradient(135deg,#ff8fab,#ffb4a2);border:none;color:#5a2a2a;font-weight:700;padding:7px 14px;border-radius:20px;cursor:pointer;font-size:13px;box-shadow:0 3px 8px rgba(255,107,107,.35);}
      .match-btn.active{background:linear-gradient(135deg,#ffd166,#ff8c42);color:#5a2a00;}
      .match-btn:hover{transform:translateY(-1px);}
      .match-info{display:flex;gap:18px;justify-content:center;font-size:14px;margin-bottom:10px;background:rgba(255,255,255,.1);padding:8px 14px;border-radius:14px;}
      .match-info b{color:#ffd166;}
      .match-grid{display:grid;gap:8px;justify-content:center;margin:0 auto;perspective:1200px;}
      .match-card{aspect-ratio:1;width:88px;position:relative;transform-style:preserve-3d;transition:transform .45s;cursor:pointer;}
      @media(max-width:520px){.match-card{width:64px;}}
      .match-card.flipped{transform:rotateY(180deg);}
      .match-card.done{opacity:0;transform:rotateY(180deg) scale(.4);pointer-events:none;transition:all .4s;}
      .match-face{position:absolute;inset:0;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:34px;backface-visibility:hidden;box-shadow:0 4px 12px rgba(0,0,0,.3);}
      .match-front{background:linear-gradient(135deg,#ff9a9e,#fad0c4);font-size:28px;color:#fff;}
      .match-back{background:linear-gradient(135deg,#fff3b0,#ffd166);transform:rotateY(180deg);}
      .match-ovr{position:fixed;inset:0;background:rgba(0,0,0,.6);display:none;align-items:center;justify-content:center;z-index:99;}
      .match-ovr.show{display:flex;}
      .match-modal{background:linear-gradient(160deg,#fff5d6,#ffe0b3);padding:24px 30px;border-radius:22px;text-align:center;color:#5a2a00;max-width:320px;box-shadow:0 12px 40px rgba(0,0,0,.4);}
      .match-stars{font-size:38px;margin:8px 0;letter-spacing:4px;}
      .match-lb{margin-top:12px;text-align:left;font-size:13px;background:rgba(255,255,255,.4);padding:10px;border-radius:12px;max-height:140px;overflow:auto;}
      .match-lb div{padding:2px 0;}
      .match-lb .me{color:#c0392b;font-weight:700;}
      .match-particle{position:absolute;pointer-events:none;font-size:18px;}
    </style>
    <div class="match-wrap">
      <div class="match-title">😊 情绪对对碰</div>
      <div class="match-sub">翻开两张相同情绪的卡牌即可消除，看谁用时最少！</div>
      <div class="match-bar">
        <button class="match-btn active" data-lv="easy">简单 4×3</button>
        <button class="match-btn" data-lv="normal">普通 4×4</button>
        <button class="match-btn" data-lv="hard">困难 6×5</button>
        <button class="match-btn" id="matchRestart">🔄 重开</button>
        <button class="match-btn" id="matchLB">🏆 榜单</button>
      </div>
      <div class="match-info">
        <span>步数：<b id="matchSteps">0</b></span>
        <span>用时：<b id="matchTime">0.0</b>s</span>
        <span>配对：<b id="matchMatched">0/0</b></span>
      </div>
      <div class="match-grid" id="matchGrid"></div>
    </div>
    <div class="match-ovr" id="matchOvr">
      <div class="match-modal" id="matchModal"></div>
    </div>
  `;

  const gridEl = root.querySelector('#matchGrid');
  const stepsEl = root.querySelector('#matchSteps');
  const timeEl = root.querySelector('#matchTime');
  const matchedEl = root.querySelector('#matchMatched');
  const ovrEl = root.querySelector('#matchOvr');
  const modalEl = root.querySelector('#matchModal');

  // 洗牌
  function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

  // 启动一局
  function startGame(){
    const cfg = LEVELS[curLevel];
    const used = POOL.slice(0, cfg.pairs);
    cards = shuffle([...used, ...used]).map((e,i)=>({id:i,emoji:e,flipped:false,done:false}));
    flipped = []; lock = false; steps = 0; matched = 0; elapsed = 0;
    stepsEl.textContent = '0';
    timeEl.textContent = '0.0';
    matchedEl.textContent = '0/' + cfg.pairs;
    if(timer) clearInterval(timer);
    startTime = Date.now();
    timer = setInterval(()=>{
      elapsed = (Date.now()-startTime)/1000;
      timeEl.textContent = elapsed.toFixed(1);
    },100);
    render();
  }

  // 渲染棋盘
  function render(){
    const cfg = LEVELS[curLevel];
    gridEl.style.gridTemplateColumns = `repeat(${cfg.cols}, 1fr)`;
    gridEl.innerHTML = '';
    cards.forEach((c,i)=>{
      const el = document.createElement('div');
      el.className = 'match-card' + (c.flipped?' flipped':'') + (c.done?' done':'');
      el.innerHTML = `<div class="match-face match-front">❓</div><div class="match-face match-back">${c.emoji}</div>`;
      el.addEventListener('click',()=>onFlip(i));
      gridEl.appendChild(el);
    });
  }

  // 翻牌逻辑
  function onFlip(i){
    if(lock) return;
    const c = cards[i];
    if(c.flipped || c.done) return;
    c.flipped = true;
    flipped.push(i);
    render();
    if(flipped.length === 2){
      steps++;
      stepsEl.textContent = steps;
      lock = true;
      const [a,b] = flipped;
      if(cards[a].emoji === cards[b].emoji){
        // 配对成功
        setTimeout(()=>{
          cards[a].done = true; cards[b].done = true;
          matched++;
          matchedEl.textContent = matched + '/' + LEVELS[curLevel].pairs;
          burstParticles(cards[a].emoji);
          render();
          flipped = []; lock = false;
          if(matched === LEVELS[curLevel].pairs) finish();
        },380);
      }else{
        // 配对失败
        setTimeout(()=>{
          cards[a].flipped = false; cards[b].flipped = false;
          render();
          flipped = []; lock = false;
        },820);
      }
    }
  }

  // 粒子爆炸效果
  function burstParticles(emoji){
    const r = gridEl.getBoundingClientRect();
    for(let k=0;k<8;k++){
      const p = document.createElement('div');
      p.className = 'match-particle';
      p.textContent = ['✨','💫','⭐','🎉'][k%4];
      p.style.left = (r.left + r.width/2 + (Math.random()-.5)*60) + 'px';
      p.style.top = (r.top + r.height/2 + (Math.random()-.5)*60) + 'px';
      p.style.transition = 'all .8s ease-out';
      document.body.appendChild(p);
      requestAnimationFrame(()=>{
        p.style.transform = `translate(${(Math.random()-.5)*200}px,${(Math.random()-.5)*200}px) scale(2)`;
        p.style.opacity = '0';
      });
      setTimeout(()=>p.remove(),850);
    }
  }

  // 通关：评星 + 排行榜
  function finish(){
    clearInterval(timer);
    const cfg = LEVELS[curLevel];
    // 评星：根据步数和时间
    const optimal = cfg.pairs * 2;
    const stepRatio = steps / optimal;
    let stars = 1;
    if(stepRatio < 1.6 && elapsed < cfg.pairs*4) stars = 3;
    else if(stepRatio < 2.2 || elapsed < cfg.pairs*6) stars = 2;
    const score = Math.round(10000 - steps*20 - elapsed*10);

    // 写入排行榜
    const key = 'xinji_match_lb_' + curLevel;
    let lb = JSON.parse(localStorage.getItem(key) || '[]');
    const entry = { score, steps, time: +elapsed.toFixed(1), stars, date: new Date().toLocaleDateString() };
    lb.push(entry);
    lb.sort((a,b)=>b.score - a.score);
    lb = lb.slice(0,5);
    localStorage.setItem(key, JSON.stringify(lb));
    const rank = lb.findIndex(e=>e===entry) + 1;

    modalEl.innerHTML = `
      <div style="font-size:22px;font-weight:800;">🎉 通关啦！</div>
      <div class="match-stars">${'⭐'.repeat(stars)}${'☆'.repeat(3-stars)}</div>
      <div>步数：<b>${steps}</b>　用时：<b>${elapsed.toFixed(1)}s</b></div>
      <div style="margin-top:4px;">得分：<b style="color:#c0392b;">${score}</b></div>
      <div style="margin-top:8px;">排名：第 <b>${rank||'-'}</b> 名</div>
      <div class="match-lb">${renderLB(lb, entry)}</div>
      <button class="match-btn" style="margin-top:12px;" id="matchAgain">🔄 再来一局</button>
    `;
    ovrEl.classList.add('show');
    root.querySelector('#matchAgain').addEventListener('click',()=>{
      ovrEl.classList.remove('show');
      startGame();
    });
  }

  // 渲染排行榜
  function renderLB(lb, me){
    if(!lb.length) return '<div style="text-align:center;">暂无记录</div>';
    return lb.map((e,i)=>`<div class="${e===me?'me':''}">${i+1}. ⭐${e.stars} ${e.score}分 (${e.steps}步/${e.time}s)</div>`).join('');
  }

  // 显示总榜单
  function showLB(){
    const key = 'xinji_match_lb_' + curLevel;
    const lb = JSON.parse(localStorage.getItem(key) || '[]');
    modalEl.innerHTML = `
      <div style="font-size:20px;font-weight:800;">🏆 ${LEVELS[curLevel].name}榜单 TOP5</div>
      <div class="match-lb">${renderLB(lb, null)}</div>
      <button class="match-btn" style="margin-top:12px;" id="matchCloseLB">关闭</button>
    `;
    ovrEl.classList.add('show');
    root.querySelector('#matchCloseLB').addEventListener('click',()=>ovrEl.classList.remove('show'));
  }

  // 难度切换
  root.querySelectorAll('[data-lv]').forEach(b=>{
    b.addEventListener('click',()=>{
      root.querySelectorAll('[data-lv]').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      curLevel = b.dataset.lv;
      startGame();
    });
  });
  root.querySelector('#matchRestart').addEventListener('click', startGame);
  root.querySelector('#matchLB').addEventListener('click', showLB);

  startGame();
}


// ---------------------------------------------------------------------
// 游戏2：你画我猜（Canvas画板 + AI猜词）
// ---------------------------------------------------------------------
function gameDrawguessInit(root) {
  // 词库
  const WORDS = ['小猫咪','冰淇淋','彩虹','星星','太阳','花朵','房子','汽车','鱼','蛋糕','苹果','树','蝴蝶','月亮','雨伞','气球','钟表','眼镜','帽子','鞋子'];
  // 画笔类型
  const BRUSHES = [
    { id:'pen',     name:'普通', icon:'✏️', color:'#ff6b6b' },
    { id:'rainbow', name:'彩虹', icon:'🌈', color:'#ff8fab' },
    { id:'sparkle', name:'闪光', icon:'✨', color:'#ffd166' },
    { id:'fluffy',  name:'毛绒', icon:'🧸', color:'#a29bfe' }
  ];
  let canvas, ctx, drawing = false, lastX=0, lastY=0;
  let curBrush = 'pen';
  let hue = 0;          // 彩虹色相
  let curWord = '';
  let timeLeft = 60;
  let timer = null;
  let totalScore = 0;

  root.innerHTML = `
    <style>
      .dg-wrap{font-family:'Segoe UI',sans-serif;color:#fff;max-width:760px;margin:0 auto;padding:12px;}
      .dg-title{font-size:24px;font-weight:800;text-align:center;background:linear-gradient(90deg,#a29bfe,#74b9ff);-webkit-background-clip:text;background-clip:text;color:transparent;margin-bottom:6px;}
      .dg-sub{text-align:center;color:#d6eaff;font-size:13px;margin-bottom:10px;}
      .dg-bar{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:10px;}
      .dg-btn{background:linear-gradient(135deg,#74b9ff,#a29bfe);border:none;color:#fff;font-weight:700;padding:7px 14px;border-radius:20px;cursor:pointer;font-size:13px;box-shadow:0 3px 8px rgba(116,185,255,.35);}
      .dg-btn.active{background:linear-gradient(135deg,#ffeaa7,#fd79a8);color:#5a2a00;}
      .dg-btn:hover{transform:translateY(-1px);}
      .dg-stage{display:flex;flex-direction:column;align-items:center;gap:10px;}
      .dg-wordbox{background:rgba(255,255,255,.12);padding:8px 18px;border-radius:16px;font-size:16px;text-align:center;min-width:240px;}
      .dg-wordbox b{color:#ffeaa7;font-size:18px;}
      .dg-timer{font-size:18px;font-weight:800;color:#ffd166;}
      .dg-canvas{background:#fff;border-radius:14px;box-shadow:0 6px 20px rgba(0,0,0,.3);touch-action:none;cursor:crosshair;}
      .dg-tools{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;}
      .dg-tool{background:rgba(255,255,255,.1);border:2px solid transparent;border-radius:14px;padding:6px 12px;cursor:pointer;font-size:14px;color:#fff;}
      .dg-tool.active{border-color:#ffeaa7;background:rgba(255,234,167,.2);}
      .dg-size{display:flex;align-items:center;gap:6px;color:#fff;font-size:13px;}
      .dg-size input{width:90px;}
      .dg-score{text-align:center;font-size:14px;color:#d6eaff;}
      .dg-options{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:10px;}
      .dg-opt{background:linear-gradient(135deg,#fd79a8,#e84393);border:none;color:#fff;font-weight:700;padding:12px 20px;border-radius:16px;cursor:pointer;font-size:15px;min-width:100px;box-shadow:0 4px 12px rgba(232,67,147,.4);}
      .dg-opt:hover{transform:translateY(-2px);}
      .dg-ovr{position:fixed;inset:0;background:rgba(0,0,0,.6);display:none;align-items:center;justify-content:center;z-index:99;}
      .dg-ovr.show{display:flex;}
      .dg-modal{background:linear-gradient(160deg,#d6eaff,#fff5d6);padding:24px;border-radius:22px;text-align:center;color:#2a3a5a;max-width:340px;}
      .dg-gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px;max-height:260px;overflow:auto;margin:10px 0;}
      .dg-gallery img{width:100%;border-radius:8px;border:2px solid #fff;}
    </style>
    <div class="dg-wrap">
      <div class="dg-title">🎨 你画我猜</div>
      <div class="dg-sub">系统给词你来画，画完让AI猜猜看！</div>
      <div class="dg-bar">
        <button class="dg-btn" id="dgStart">🎮 开始作画</button>
        <button class="dg-btn" id="dgClear">🧹 清空画板</button>
        <button class="dg-btn" id="dgGallery">🖼️ 画廊</button>
        <button class="dg-btn" id="dgSave">💾 存入画廊</button>
      </div>
      <div class="dg-stage">
        <div class="dg-wordbox" id="dgWordbox">点击「开始作画」获取题目</div>
        <div class="dg-timer" id="dgTimer">⏱️ 60s</div>
        <canvas class="dg-canvas" id="dgCanvas" width="520" height="360"></canvas>
        <div class="dg-tools" id="dgTools"></div>
        <div class="dg-size">画笔粗细：<input type="range" id="dgSize" min="2" max="20" value="5"><span id="dgSizeV">5</span>px</div>
        <div class="dg-score" id="dgScore">本轮得分：0</div>
      </div>
    </div>
    <div class="dg-ovr" id="dgOvr">
      <div class="dg-modal" id="dgModal"></div>
    </div>
  `;

  canvas = root.querySelector('#dgCanvas');
  ctx = canvas.getContext('2d');
  const wordbox = root.querySelector('#dgWordbox');
  const timerEl = root.querySelector('#dgTimer');
  const scoreEl = root.querySelector('#dgScore');
  const ovrEl = root.querySelector('#dgOvr');
  const modalEl = root.querySelector('#dgModal');
  const sizeInput = root.querySelector('#dgSize');
  const sizeVEl = root.querySelector('#dgSizeV');
  let lineSize = 5;

  // 初始化白色画板
  function clearCanvas(){
    ctx.fillStyle = '#fff';
    ctx.fillRect(0,0,canvas.width,canvas.height);
  }
  clearCanvas();

  // 渲染画笔工具
  const toolsEl = root.querySelector('#dgTools');
  BRUSHES.forEach(b=>{
    const el = document.createElement('div');
    el.className = 'dg-tool' + (b.id===curBrush?' active':'');
    el.innerHTML = `${b.icon} ${b.name}`;
    el.dataset.id = b.id;
    el.addEventListener('click',()=>{
      curBrush = b.id;
      root.querySelectorAll('.dg-tool').forEach(t=>t.classList.toggle('active', t.dataset.id===curBrush));
    });
    toolsEl.appendChild(el);
  });

  sizeInput.addEventListener('input',()=>{
    lineSize = +sizeInput.value;
    sizeVEl.textContent = lineSize;
  });

  // 取坐标（兼容鼠标/触摸）
  function getPos(e){
    const r = canvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return {
      x: (t.clientX - r.left) * (canvas.width / r.width),
      y: (t.clientY - r.top) * (canvas.height / r.height)
    };
  }

  function startDraw(e){
    e.preventDefault();
    drawing = true;
    const p = getPos(e);
    lastX = p.x; lastY = p.y;
  }
  function moveDraw(e){
    if(!drawing) return;
    e.preventDefault();
    const p = getPos(e);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = lineSize;
    if(curBrush === 'pen'){
      ctx.strokeStyle = '#ff6b6b';
      ctx.beginPath(); ctx.moveTo(lastX,lastY); ctx.lineTo(p.x,p.y); ctx.stroke();
    }else if(curBrush === 'rainbow'){
      hue = (hue+6)%360;
      ctx.strokeStyle = `hsl(${hue},90%,55%)`;
      ctx.beginPath(); ctx.moveTo(lastX,lastY); ctx.lineTo(p.x,p.y); ctx.stroke();
    }else if(curBrush === 'sparkle'){
      // 闪光：主线 + 散点
      ctx.strokeStyle = 'rgba(255,209,102,0.9)';
      ctx.beginPath(); ctx.moveTo(lastX,lastY); ctx.lineTo(p.x,p.y); ctx.stroke();
      for(let i=0;i<3;i++){
        ctx.fillStyle = `hsl(${Math.random()*60+30},100%,70%)`;
        ctx.beginPath();
        ctx.arc(p.x+(Math.random()-.5)*16, p.y+(Math.random()-.5)*16, Math.random()*3+1, 0, Math.PI*2);
        ctx.fill();
      }
    }else if(curBrush === 'fluffy'){
      // 毛绒：多条偏移线
      ctx.strokeStyle = 'rgba(162,155,254,0.5)';
      ctx.lineWidth = lineSize*0.6;
      for(let i=0;i<4;i++){
        ctx.beginPath();
        ctx.moveTo(lastX+(Math.random()-.5)*8, lastY+(Math.random()-.5)*8);
        ctx.lineTo(p.x+(Math.random()-.5)*8, p.y+(Math.random()-.5)*8);
        ctx.stroke();
      }
    }
    lastX = p.x; lastY = p.y;
  }
  function endDraw(){ drawing = false; }

  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', moveDraw);
  canvas.addEventListener('mouseup', endDraw);
  canvas.addEventListener('mouseleave', endDraw);
  canvas.addEventListener('touchstart', startDraw, {passive:false});
  canvas.addEventListener('touchmove', moveDraw, {passive:false});
  canvas.addEventListener('touchend', endDraw);

  // 开始一局
  function startRound(){
    clearCanvas();
    curWord = WORDS[Math.floor(Math.random()*WORDS.length)];
    wordbox.innerHTML = `请画出：<b>${curWord}</b>`;
    timeLeft = 60;
    timerEl.textContent = '⏱️ 60s';
    if(timer) clearInterval(timer);
    timer = setInterval(()=>{
      timeLeft--;
      timerEl.textContent = `⏱️ ${timeLeft}s`;
      if(timeLeft <= 0){
        clearInterval(timer);
        // 时间到，进入猜词阶段
        askGuess();
      }
    },1000);
  }

  // AI猜词：生成4个选项
  function askGuess(){
    clearInterval(timer);
    // 随机选3个干扰词
    const others = WORDS.filter(w=>w!==curWord).sort(()=>Math.random()-.5).slice(0,3);
    const opts = shuffleArr([curWord, ...others]);
    wordbox.innerHTML = `画完啦！AI猜你画的是？`;
    modalEl.innerHTML = `
      <div style="font-size:20px;font-weight:800;">🤖 AI来猜啦</div>
      <div style="margin:8px 0;">你觉得AI会猜对哪个？</div>
      <div class="dg-options">${opts.map(o=>`<button class="dg-opt" data-w="${o}">${o}</button>`).join('')}</div>
    `;
    ovrEl.classList.add('show');
    modalEl.querySelectorAll('.dg-opt').forEach(b=>{
      b.addEventListener('click',()=>{
        const pick = b.dataset.w;
        const correct = pick === curWord;
        // 得分：剩余时间越多分越高（这里时间已到，按是否答对给基础分）
        const gain = correct ? 60 + timeLeft*2 : 0;
        if(correct) totalScore += gain;
        scoreEl.textContent = `本轮得分：${gain}　总分：${totalScore}`;
        modalEl.innerHTML = `
          <div style="font-size:22px;font-weight:800;">${correct?'🎉 猜对啦！':'💪 再接再厉！'}</div>
          <div style="margin:10px 0;">正确答案：<b style="color:#e84393;">${curWord}</b></div>
          <div>${correct?`+${gain}分`:'没得分，下次加油～'}</div>
          <button class="dg-btn" style="margin-top:14px;" id="dgNext">🔄 再画一题</button>
          <button class="dg-btn" id="dgClose">关闭</button>
        `;
        root.querySelector('#dgNext').addEventListener('click',()=>{ ovrEl.classList.remove('show'); startRound(); });
        root.querySelector('#dgClose').addEventListener('click',()=>ovrEl.classList.remove('show'));
      });
    });
  }

  function shuffleArr(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

  // 保存到画廊
  function saveGallery(){
    const data = canvas.toDataURL('image/png');
    let gallery = JSON.parse(localStorage.getItem('xinji_gallery') || '[]');
    gallery.unshift({ img: data, word: curWord || '未命名', date: new Date().toLocaleString() });
    gallery = gallery.slice(0, 30); // 最多30张
    localStorage.setItem('xinji_gallery', JSON.stringify(gallery));
    flash('已存入画廊！');
  }

  // 查看画廊
  function viewGallery(){
    const gallery = JSON.parse(localStorage.getItem('xinji_gallery') || '[]');
    modalEl.innerHTML = `
      <div style="font-size:20px;font-weight:800;">🖼️ 我的画廊（${gallery.length}）</div>
      ${gallery.length === 0 ? '<div style="margin:14px 0;">还没有作品哦，画一幅存进来吧～</div>' :
        `<div class="dg-gallery">${gallery.map(g=>`<div><img src="${g.img}" title="${g.word}"><div style="font-size:11px;color:#5a3a2a;">${g.word}</div></div>`).join('')}</div>`}
      <button class="dg-btn" id="dgClearGal" style="background:linear-gradient(135deg,#e17055,#d63031);">🗑️ 清空画廊</button>
      <button class="dg-btn" id="dgCloseGal">关闭</button>
    `;
    ovrEl.classList.add('show');
    root.querySelector('#dgCloseGal').addEventListener('click',()=>ovrEl.classList.remove('show'));
    const clearBtn = root.querySelector('#dgClearGal');
    if(clearBtn) clearBtn.addEventListener('click',()=>{
      if(confirm('确定清空所有画作吗？')){
        localStorage.removeItem('xinji_gallery');
        viewGallery();
      }
    });
  }

  // 简易提示
  function flash(msg){
    wordbox.textContent = msg;
    setTimeout(()=>{ if(curWord) wordbox.innerHTML = `请画出：<b>${curWord}</b>`; },1200);
  }

  root.querySelector('#dgStart').addEventListener('click', startRound);
  root.querySelector('#dgClear').addEventListener('click', ()=>{ clearCanvas(); flash('画板已清空'); });
  root.querySelector('#dgSave').addEventListener('click', saveGallery);
  root.querySelector('#dgGallery').addEventListener('click', viewGallery);
}


// ---------------------------------------------------------------------
// 游戏3：表情包大战（Canvas射击）
// ---------------------------------------------------------------------
function gameEmojibattleInit(root) {
  // 敌人类型（速度系数递增）
  const ENEMIES = ['😠','😤','😭','😱'];
  let canvas, ctx;
  let W=0, H=0;
  let player = { x: 50, y: 200, r: 22 };
  let bullets = [];      // 子弹
  let enemies = [];      // 敌人
  let particles = [];    // 粒子
  let score = 0;
  let lives = 3;
  let wave = 1;
  let weapon = 'heart';  // heart/rainbow/hug
  let rainbowCD = 0;     // 彩虹波CD
  let hugCD = 0;         // 拥抱CD
  let boss = null;       // 当前BOSS
  let bossTimer = 0;     // BOSS出现计时
  let spawnTimer = 0;
  let lastTime = 0;
  let running = false;
  let rafId = null;
  let combo = 0;

  root.innerHTML = `
    <style>
      .eb-wrap{font-family:'Segoe UI',sans-serif;color:#fff;max-width:760px;margin:0 auto;padding:12px;}
      .eb-title{font-size:24px;font-weight:800;text-align:center;background:linear-gradient(90deg,#ff6b6b,#feca57);-webkit-background-clip:text;background-clip:text;color:transparent;margin-bottom:6px;}
      .eb-sub{text-align:center;color:#ffd6d6;font-size:13px;margin-bottom:10px;}
      .eb-bar{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:10px;}
      .eb-btn{background:linear-gradient(135deg,#ff6b6b,#ee5a6f);border:none;color:#fff;font-weight:700;padding:7px 14px;border-radius:20px;cursor:pointer;font-size:13px;box-shadow:0 3px 8px rgba(255,107,107,.35);}
      .eb-btn:hover{transform:translateY(-1px);}
      .eb-hud{display:flex;gap:14px;justify-content:center;font-size:15px;background:rgba(255,255,255,.1);padding:8px 14px;border-radius:14px;margin-bottom:8px;flex-wrap:wrap;}
      .eb-hud b{color:#ffd166;}
      .eb-weapons{display:flex;gap:8px;justify-content:center;margin-bottom:8px;flex-wrap:wrap;}
      .eb-wbtn{background:rgba(255,255,255,.1);border:2px solid transparent;border-radius:14px;padding:6px 12px;cursor:pointer;color:#fff;font-size:13px;}
      .eb-wbtn.active{border-color:#ffd166;background:rgba(255,209,102,.2);}
      .eb-wbtn small{color:#aaa;font-size:10px;display:block;}
      .eb-canvas{display:block;background:linear-gradient(180deg,#1a1a2e,#16213e);border-radius:14px;box-shadow:0 6px 20px rgba(0,0,0,.4);margin:0 auto;touch-action:none;}
      .eb-ovr{position:fixed;inset:0;background:rgba(0,0,0,.7);display:none;align-items:center;justify-content:center;z-index:99;}
      .eb-ovr.show{display:flex;}
      .eb-modal{background:linear-gradient(160deg,#ffd6d6,#ffe9b3);padding:24px 30px;border-radius:22px;text-align:center;color:#5a2a2a;max-width:320px;}
    </style>
    <div class="eb-wrap">
      <div class="eb-title">💗 表情包大战</div>
      <div class="eb-sub">用爱心感染坏情绪！手机拖动移动，点击射击</div>
      <div class="eb-bar">
        <button class="eb-btn" id="ebStart">🎮 开始游戏</button>
        <button class="eb-btn" id="ebPause">⏸️ 暂停</button>
      </div>
      <div class="eb-hud">
        <span>生命：<b id="ebLives">❤️❤️❤️</b></span>
        <span>得分：<b id="ebScore">0</b></span>
        <span>波次：<b id="ebWave">1</b></span>
        <span>连击：<b id="ebCombo">0</b></span>
      </div>
      <div class="eb-weapons" id="ebWeapons">
        <div class="eb-wbtn active" data-w="heart">💗 普通<small>默认</small></div>
        <div class="eb-wbtn" data-w="rainbow">🌈 彩虹波<small>3s CD</small></div>
        <div class="eb-wbtn" data-w="hug">🤗 拥抱<small>5s CD</small></div>
      </div>
      <canvas class="eb-canvas" id="ebCanvas" width="640" height="420"></canvas>
    </div>
    <div class="eb-ovr" id="ebOvr">
      <div class="eb-modal" id="ebModal"></div>
    </div>
  `;

  canvas = root.querySelector('#ebCanvas');
  ctx = canvas.getContext('2d');
  const livesEl = root.querySelector('#ebLives');
  const scoreEl = root.querySelector('#ebScore');
  const waveEl = root.querySelector('#ebWave');
  const comboEl = root.querySelector('#ebCombo');
  const ovrEl = root.querySelector('#ebOvr');
  const modalEl = root.querySelector('#ebModal');

  function resize(){
    // 自适应宽度
    const maxW = Math.min(640, root.clientWidth - 24);
    canvas.style.width = maxW + 'px';
    canvas.style.height = (maxW * 420 / 640) + 'px';
    W = canvas.width; H = canvas.height;
  }
  resize();
  window.addEventListener('resize', resize);

  // 初始化游戏状态
  function initState(){
    player = { x: 60, y: H/2, r: 22 };
    bullets = []; enemies = []; particles = [];
    score = 0; lives = 3; wave = 1; combo = 0;
    weapon = 'heart'; rainbowCD = 0; hugCD = 0;
    boss = null; bossTimer = 0; spawnTimer = 0;
    updateHUD();
  }

  function updateHUD(){
    livesEl.textContent = '❤️'.repeat(Math.max(0,lives)) || '💀';
    scoreEl.textContent = score;
    waveEl.textContent = wave;
    comboEl.textContent = combo;
  }

  // 武器切换
  root.querySelectorAll('.eb-wbtn').forEach(b=>{
    b.addEventListener('click',()=>{
      const w = b.dataset.w;
      if(w === 'rainbow' && rainbowCD > 0) return;
      if(w === 'hug' && hugCD > 0) return;
      weapon = w;
      root.querySelectorAll('.eb-wbtn').forEach(x=>x.classList.toggle('active', x.dataset.w===w));
      // 自动射击会在循环中处理，这里手动射一次
      shoot();
    });
  });

  // 射击
  function shoot(){
    if(weapon === 'heart'){
      bullets.push({ x: player.x+20, y: player.y, vx: 7, vy: 0, type:'heart', r:12 });
    }else if(weapon === 'rainbow' && rainbowCD <= 0){
      // 彩虹波：3发散射
      for(let i=-1;i<=1;i++){
        bullets.push({ x: player.x+20, y: player.y, vx: 8, vy: i*2, type:'rainbow', r:14 });
      }
      rainbowCD = 3;
      // 切回普通
      weapon = 'heart';
      root.querySelectorAll('.eb-wbtn').forEach(x=>x.classList.toggle('active', x.dataset.w==='heart'));
    }else if(weapon === 'hug' && hugCD <= 0){
      // 拥抱：范围攻击，清除屏幕下半部分敌人
      bullets.push({ x: player.x+20, y: player.y, vx: 5, vy: 0, type:'hug', r:60 });
      hugCD = 5;
      weapon = 'heart';
      root.querySelectorAll('.eb-wbtn').forEach(x=>x.classList.toggle('active', x.dataset.w==='heart'));
    }
  }

  // 生成敌人
  function spawnEnemy(){
    const idx = Math.min(ENEMIES.length-1, Math.floor(wave/2));
    const speed = 1.2 + wave*0.15 + Math.random()*0.6;
    enemies.push({
      x: W + 30,
      y: 40 + Math.random()*(H-80),
      vx: -speed,
      r: 20,
      emoji: ENEMIES[idx],
      hp: 1,
      infected: false
    });
  }

  // 生成BOSS
  function spawnBoss(){
    boss = {
      x: W - 80,
      y: H/2,
      vx: -0.5,
      vy: 1.5,
      r: 36,
      emoji: '😈',
      hp: 10,
      maxHp: 10,
      shootTimer: 0
    };
  }

  // 粒子
  function burst(x, y, emoji){
    for(let i=0;i<8;i++){
      particles.push({
        x, y,
        vx: (Math.random()-.5)*6,
        vy: (Math.random()-.5)*6,
        life: 30,
        emoji: ['✨','💫','⭐','💖'][i%4]
      });
    }
  }

  // 游戏主循环
  function loop(ts){
    if(!running) return;
    const dt = Math.min(50, ts - lastTime) / 16.67;
    lastTime = ts;
    update(dt);
    draw();
    rafId = requestAnimationFrame(loop);
  }

  function update(dt){
    // CD递减
    if(rainbowCD > 0) rainbowCD = Math.max(0, rainbowCD - dt/60);
    if(hugCD > 0) hugCD = Math.max(0, hugCD - dt/60);
    // 更新CD显示
    root.querySelectorAll('.eb-wbtn').forEach(b=>{
      const w = b.dataset.w;
      if(w === 'rainbow') b.style.opacity = rainbowCD>0?0.5:1;
      if(w === 'hug') b.style.opacity = hugCD>0?0.5:1;
    });

    // 自动射击（每帧概率）
    if(running && Math.random() < 0.04) shoot();

    // 子弹移动
    bullets.forEach(b=>{ b.x += b.vx*dt; b.y += b.vy*dt; });
    bullets = bullets.filter(b=>b.x < W+50 && b.x > -50 && b.y > -50 && b.y < H+50);

    // 敌人生成
    spawnTimer += dt;
    const spawnRate = Math.max(40, 90 - wave*5);
    if(spawnTimer > spawnRate && !boss){
      spawnTimer = 0;
      spawnEnemy();
    }

    // BOSS计时
    bossTimer += dt/60;
    if(bossTimer > 30 && !boss){
      spawnBoss();
      bossTimer = 0;
    }

    // 敌人移动 + 碰撞
    enemies.forEach(e=>{
      e.x += e.vx*dt;
      // 与玩家碰撞
      if(dist(e.x,e.y,player.x,player.y) < e.r+player.r){
        e.dead = true;
        lives--;
        combo = 0;
        burst(e.x, e.y, '💥');
        updateHUD();
        if(lives <= 0) gameOver();
      }
      // 与子弹碰撞
      bullets.forEach(b=>{
        if(b.dead) return;
        const rr = b.type==='hug' ? b.r : e.r + b.r;
        if(dist(e.x,e.y,b.x,b.y) < rr){
          e.infected = true;
          e.dead = true;
          b.dead = b.type !== 'hug'; // 拥抱可穿透
          score += 10;
          combo++;
          burst(e.x, e.y, '😊');
          updateHUD();
        }
      });
    });
    enemies = enemies.filter(e=>!e.dead && e.x > -50);

    // BOSS移动 + 碰撞
    if(boss){
      boss.x += boss.vx*dt;
      boss.y += boss.vy*dt;
      if(boss.y < 40 || boss.y > H-40) boss.vy *= -1;
      if(boss.x < W-120) boss.vx = 0;
      // BOSS发射子弹
      boss.shootTimer += dt;
      if(boss.shootTimer > 80){
        boss.shootTimer = 0;
        enemies.push({ x: boss.x, y: boss.y, vx: -3, vy:0, r:14, emoji:'💢', hp:1, isBossBullet:true });
      }
      // 与玩家碰撞
      if(dist(boss.x,boss.y,player.x,player.y) < boss.r+player.r){
        lives--;
        combo = 0;
        burst(player.x, player.y, '💥');
        updateHUD();
        if(lives <= 0) gameOver();
      }
      // 与子弹碰撞
      bullets.forEach(b=>{
        if(b.dead) return;
        const rr = b.type==='hug' ? b.r+boss.r : boss.r + b.r;
        if(dist(boss.x,boss.y,b.x,b.y) < rr){
          boss.hp--;
          b.dead = b.type !== 'hug';
          burst(b.x, b.y, '💥');
          if(boss.hp <= 0){
            score += 200;
            combo += 5;
            burst(boss.x, boss.y, '🏆');
            boss = null;
            wave++;
            updateHUD();
          }
        }
      });
    }

    // 粒子更新
    particles.forEach(p=>{ p.x += p.vx*dt; p.y += p.vy*dt; p.life -= dt; });
    particles = particles.filter(p=>p.life > 0);

    // 波次递增（每500分+1波）
    const newWave = 1 + Math.floor(score/300);
    if(newWave > wave){ wave = newWave; updateHUD(); }
  }

  function dist(x1,y1,x2,y2){ return Math.hypot(x1-x2, y1-y2); }

  function draw(){
    ctx.clearRect(0,0,W,H);
    // 背景星点
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    for(let i=0;i<30;i++){
      ctx.fillRect((i*37)%W, (i*53)%H, 2, 2);
    }
    // 玩家
    ctx.font = '36px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('😊', player.x, player.y);
    // 子弹
    bullets.forEach(b=>{
      ctx.font = (b.type==='hug'?'40px':'24px') + ' serif';
      const icon = b.type==='heart'?'💗':b.type==='rainbow'?'🌈':'🤗';
      ctx.fillText(icon, b.x, b.y);
    });
    // 敌人
    enemies.forEach(e=>{
      ctx.font = '32px serif';
      ctx.fillText(e.infected?'😊':e.emoji, e.x, e.y);
    });
    // BOSS
    if(boss){
      ctx.font = '52px serif';
      ctx.fillText(boss.emoji, boss.x, boss.y);
      // 血条
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(boss.x-40, boss.y-50, 80, 8);
      ctx.fillStyle = '#ff6b6b';
      ctx.fillRect(boss.x-40, boss.y-50, 80*(boss.hp/boss.maxHp), 8);
    }
    // 粒子
    particles.forEach(p=>{
      ctx.globalAlpha = Math.max(0, p.life/30);
      ctx.font = '18px serif';
      ctx.fillText(p.emoji, p.x, p.y);
    });
    ctx.globalAlpha = 1;
    // CD提示
    ctx.fillStyle = '#fff';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    if(rainbowCD>0) ctx.fillText(`🌈 CD: ${rainbowCD.toFixed(1)}s`, 10, H-20);
    if(hugCD>0) ctx.fillText(`🤗 CD: ${hugCD.toFixed(1)}s`, 10, H-6);
  }

  // 控制：鼠标/触摸
  function movePlayer(e){
    e.preventDefault();
    const r = canvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    const x = (t.clientX - r.left) * (W / r.width);
    const y = (t.clientY - r.top) * (H / r.height);
    // 玩家跟随，但限制在左半区域
    player.x = Math.max(20, Math.min(W*0.6, x));
    player.y = Math.max(20, Math.min(H-20, y));
  }
  canvas.addEventListener('mousemove', movePlayer);
  canvas.addEventListener('touchmove', movePlayer, {passive:false});
  canvas.addEventListener('touchstart', (e)=>{ movePlayer(e); shoot(); }, {passive:false});
  canvas.addEventListener('click', shoot);

  function startGame(){
    initState();
    running = true;
    ovrEl.classList.remove('show');
    lastTime = performance.now();
    rafId = requestAnimationFrame(loop);
  }

  function gameOver(){
    running = false;
    cancelAnimationFrame(rafId);
    const highKey = 'xinji_eb_high';
    const high = +(localStorage.getItem(highKey) || 0);
    if(score > high) localStorage.setItem(highKey, score);
    modalEl.innerHTML = `
      <div style="font-size:22px;font-weight:800;">🎮 游戏结束</div>
      <div style="margin:10px 0;">本局得分：<b style="color:#c0392b;font-size:20px;">${score}</b></div>
      <div>最高分：${Math.max(high, score)}</div>
      <div style="margin-top:6px;">坚持到第 <b>${wave}</b> 波</div>
      <button class="eb-btn" style="margin-top:14px;" id="ebAgain">🔄 再战一局</button>
    `;
    ovrEl.classList.add('show');
    root.querySelector('#ebAgain').addEventListener('click', startGame);
  }

  root.querySelector('#ebStart').addEventListener('click', startGame);
  root.querySelector('#ebPause').addEventListener('click',()=>{
    running = !running;
    if(running){ lastTime = performance.now(); rafId = requestAnimationFrame(loop); }
  });

  // 初始画面
  ctx.fillStyle = '#fff';
  ctx.font = '18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('点击「开始游戏」开战！', W/2, H/2);
}


// ---------------------------------------------------------------------
// 游戏4：音乐方块（3轨道节奏游戏）
// ---------------------------------------------------------------------
function gameMusicblockInit(root) {
  // 简化的音符序列（数字代表轨道0/1/2，间隔为节拍）
  // 小星星、欢乐颂、生日快乐
  const SONGS = {
    star: {
      name: '小星星',
      notes: [0,0,2,2,1,1,2,-1, 0,0,2,2,1,1,2,-1, 2,2,0,0,1,1,0,-1, 2,2,0,0,1,1,0,-1],
      noteFreqs: [0,1,2,1,0]  // C C G G → 轨道映射
    },
    ode: {
      name: '欢乐颂',
      notes: [1,1,2,0,1,2,2,1,1,0,0,1,1,-1, 1,1,2,0,1,2,2,1,1,0,0,1,0,-1],
      noteFreqs: [0,1,2,1,0]
    },
    birthday: {
      name: '生日快乐',
      notes: [1,1,0,1,2,-1, 1,1,0,1,1,-1, 1,1,2,0,1,-1, 0,0,1,2,2,-1],
      noteFreqs: [0,1,2,1,0]
    }
  };
  // 轨道对应的音阶频率（C D E F G A B → 取 C E G 等）
  const TRACK_FREQS = [261.63, 329.63, 392.00]; // C4 E4 G4
  const DIFFS = {
    easy:   { name:'简单', speed: 2.0, interval: 700 },
    normal: { name:'普通', speed: 3.0, interval: 550 },
    hard:   { name:'困难', speed: 4.2, interval: 400 }
  };
  const COLORS = ['#ff6b6b','#feca57','#48dbfb'];

  let canvas, ctx;
  let W=0, H=0;
  let curSong = 'star';
  let curDiff = 'easy';
  let blocks = [];        // 下落方块
  let particles = [];
  let score = 0;
  let combo = 0;
  let maxCombo = 0;
  let perfect = 0, good = 0, miss = 0;
  let noteIdx = 0;
  let running = false;
  let rafId = null;
  let lastTime = 0;
  let spawnTimer = 0;
  let audioCtx = null;
  let songOver = false;

  root.innerHTML = `
    <style>
      .mb-wrap{font-family:'Segoe UI',sans-serif;color:#fff;max-width:760px;margin:0 auto;padding:12px;}
      .mb-title{font-size:24px;font-weight:800;text-align:center;background:linear-gradient(90deg,#48dbfb,#a29bfe);-webkit-background-clip:text;background-clip:text;color:transparent;margin-bottom:6px;}
      .mb-sub{text-align:center;color:#d6eaff;font-size:13px;margin-bottom:10px;}
      .mb-bar{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:10px;}
      .mb-btn{background:linear-gradient(135deg,#48dbfb,#a29bfe);border:none;color:#fff;font-weight:700;padding:7px 14px;border-radius:20px;cursor:pointer;font-size:13px;box-shadow:0 3px 8px rgba(72,219,251,.35);}
      .mb-btn.active{background:linear-gradient(135deg,#ffeaa7,#fd79a8);color:#5a2a00;}
      .mb-btn:hover{transform:translateY(-1px);}
      .mb-hud{display:flex;gap:14px;justify-content:center;font-size:15px;background:rgba(255,255,255,.1);padding:8px 14px;border-radius:14px;margin-bottom:8px;flex-wrap:wrap;}
      .mb-hud b{color:#ffeaa7;}
      .mb-canvas{display:block;background:linear-gradient(180deg,#0f0c29,#302b63,#24243e);border-radius:14px;box-shadow:0 6px 20px rgba(0,0,0,.4);margin:0 auto;touch-action:none;}
      .mb-tracks{display:flex;justify-content:center;gap:8px;margin-top:10px;}
      .mb-tbtn{flex:1;max-width:140px;padding:16px;border-radius:14px;border:none;font-size:18px;font-weight:800;color:#fff;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.3);}
      .mb-tbtn:active{transform:scale(0.95);}
      .mb-ovr{position:fixed;inset:0;background:rgba(0,0,0,.7);display:none;align-items:center;justify-content:center;z-index:99;}
      .mb-ovr.show{display:flex;}
      .mb-modal{background:linear-gradient(160deg,#d6eaff,#e9d6ff);padding:24px 30px;border-radius:22px;text-align:center;color:#2a3a5a;max-width:340px;}
    </style>
    <div class="mb-wrap">
      <div class="mb-title">🎵 音乐方块</div>
      <div class="mb-sub">方块落到判定线时点击对应按钮！连击越高分越高</div>
      <div class="mb-bar">
        <button class="mb-btn active" data-song="star">⭐ 小星星</button>
        <button class="mb-btn" data-song="ode">🎼 欢乐颂</button>
        <button class="mb-btn" data-song="birthday">🎂 生日快乐</button>
        <button class="mb-btn active" data-diff="easy">简单</button>
        <button class="mb-btn" data-diff="normal">普通</button>
        <button class="mb-btn" data-diff="hard">困难</button>
        <button class="mb-btn" id="mbStart">🎮 开始</button>
      </div>
      <div class="mb-hud">
        <span>得分：<b id="mbScore">0</b></span>
        <span>连击：<b id="mbCombo">0</b></span>
        <span>P/G/M：<b id="mbPGM">0/0/0</b></span>
      </div>
      <canvas class="mb-canvas" id="mbCanvas" width="420" height="480"></canvas>
      <div class="mb-tracks">
        <button class="mb-tbtn" data-track="0" style="background:#ff6b6b;">C</button>
        <button class="mb-tbtn" data-track="1" style="background:#feca57;">E</button>
        <button class="mb-tbtn" data-track="2" style="background:#48dbfb;">G</button>
      </div>
    </div>
    <div class="mb-ovr" id="mbOvr">
      <div class="mb-modal" id="mbModal"></div>
    </div>
  `;

  canvas = root.querySelector('#mbCanvas');
  ctx = canvas.getContext('2d');
  const scoreEl = root.querySelector('#mbScore');
  const comboEl = root.querySelector('#mbCombo');
  const pgmEl = root.querySelector('#mbPGM');
  const ovrEl = root.querySelector('#mbOvr');
  const modalEl = root.querySelector('#mbModal');

  function resize(){
    const maxW = Math.min(420, root.clientWidth - 24);
    canvas.style.width = maxW + 'px';
    canvas.style.height = (maxW * 480 / 420) + 'px';
    W = canvas.width; H = canvas.height;
  }
  resize();
  window.addEventListener('resize', resize);

  // Web Audio：播放音阶
  function playNote(track){
    if(!audioCtx){
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch(e){ return; }
    }
    const freq = TRACK_FREQS[track];
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  }

  function updateHUD(){
    scoreEl.textContent = score;
    comboEl.textContent = combo;
    pgmEl.textContent = `${perfect}/${good}/${miss}`;
  }

  // 初始化一局
  function startGame(){
    score = 0; combo = 0; maxCombo = 0;
    perfect = 0; good = 0; miss = 0;
    blocks = []; particles = [];
    noteIdx = 0; spawnTimer = 0;
    running = true; songOver = false;
    ovrEl.classList.remove('show');
    lastTime = performance.now();
    rafId = requestAnimationFrame(loop);
    updateHUD();
  }

  // 生成方块
  function spawnNote(){
    const song = SONGS[curSong];
    if(noteIdx >= song.notes.length){
      // 歌曲结束判定
      if(blocks.length === 0 && !songOver){
        songOver = true;
        setTimeout(finishGame, 500);
      }
      return;
    }
    const track = song.notes[noteIdx];
    noteIdx++;
    if(track < 0) return; // 间隔（空拍）
    blocks.push({
      track,
      y: -40,
      hit: false
    });
  }

  // 判定线Y坐标
  const JUDGE_Y = 400;
  // 轨道X坐标
  function trackX(t){ return (t + 0.5) * (W / 3); }

  // 点击轨道判定
  function hitTrack(t){
    playNote(t);
    // 找该轨道最接近判定线的方块
    let best = null, bestDist = Infinity;
    blocks.forEach(b=>{
      if(b.track !== t || b.hit) return;
      const d = Math.abs(b.y - JUDGE_Y);
      if(d < bestDist){ bestDist = d; best = b; }
    });
    if(!best || bestDist > 60){
      // 没有可判定的，不计miss（空按）
      return;
    }
    best.hit = true;
    if(bestDist < 20){
      // Perfect
      perfect++;
      combo++;
      const bonus = Math.floor(combo/5)*10;
      score += 100 + bonus;
      burst(trackX(t), JUDGE_Y, 'PERFECT', '#ffeaa7');
    }else if(bestDist < 45){
      // Good
      good++;
      combo++;
      score += 50;
      burst(trackX(t), JUDGE_Y, 'GOOD', '#a8e6cf');
    }else{
      miss++;
      combo = 0;
      score += 0;
      burst(trackX(t), JUDGE_Y, 'MISS', '#ff6b6b');
    }
    maxCombo = Math.max(maxCombo, combo);
    updateHUD();
    // 移除命中方块
    setTimeout(()=>{ blocks = blocks.filter(b=>b!==best || b.y < JUDGE_Y-80); }, 200);
  }

  // 粒子爆炸
  function burst(x, y, text, color){
    for(let i=0;i<10;i++){
      particles.push({
        x, y,
        vx: (Math.random()-.5)*8,
        vy: (Math.random()-.5)*8 - 2,
        life: 25,
        color,
        size: Math.random()*4+2
      });
    }
    particles.push({ x, y:y-20, vx:0, vy:-1, life:30, color, text, isText:true });
  }

  // 主循环
  function loop(ts){
    if(!running) return;
    const dt = Math.min(50, ts - lastTime) / 16.67;
    lastTime = ts;
    update(dt);
    draw();
    rafId = requestAnimationFrame(loop);
  }

  function update(dt){
    const diff = DIFFS[curDiff];
    // 方块下落
    blocks.forEach(b=>{ b.y += diff.speed * dt * 1.5; });
    // 超过判定线未命中 → miss
    blocks.forEach(b=>{
      if(!b.hit && b.y > JUDGE_Y + 40){
        b.hit = true;
        b.missed = true;
        miss++;
        combo = 0;
        updateHUD();
      }
    });
    blocks = blocks.filter(b=>b.y < H + 40);

    // 生成新方块
    spawnTimer += dt * 16.67;
    if(spawnTimer > diff.interval){
      spawnTimer = 0;
      spawnNote();
    }

    // 粒子
    particles.forEach(p=>{
      p.x += p.vx*dt;
      p.y += p.vy*dt;
      p.vy += 0.2*dt;
      p.life -= dt;
    });
    particles = particles.filter(p=>p.life > 0);
  }

  function draw(){
    ctx.clearRect(0,0,W,H);
    // 轨道背景
    for(let i=0;i<3;i++){
      ctx.fillStyle = `rgba(255,255,255,${i===1?0.04:0.02})`;
      ctx.fillRect(i*(W/3), 0, W/3, H);
      // 轨道分隔线
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.beginPath();
      ctx.moveTo(i*(W/3), 0);
      ctx.lineTo(i*(W/3), H);
      ctx.stroke();
    }
    // 判定线
    ctx.strokeStyle = '#ffeaa7';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, JUDGE_Y);
    ctx.lineTo(W, JUDGE_Y);
    ctx.stroke();
    // 判定圈
    for(let i=0;i<3;i++){
      ctx.beginPath();
      ctx.arc(trackX(i), JUDGE_Y, 26, 0, Math.PI*2);
      ctx.strokeStyle = COLORS[i];
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    // 方块
    blocks.forEach(b=>{
      if(b.hit) return;
      ctx.fillStyle = COLORS[b.track];
      ctx.shadowColor = COLORS[b.track];
      ctx.shadowBlur = 12;
      const bw = W/3 - 16;
      ctx.fillRect(trackX(b.track)-bw/2, b.y-18, bw, 36);
      ctx.shadowBlur = 0;
      // 高光
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(trackX(b.track)-bw/2, b.y-18, bw, 6);
    });
    // 粒子
    particles.forEach(p=>{
      ctx.globalAlpha = Math.max(0, p.life/30);
      if(p.isText){
        ctx.fillStyle = p.color;
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(p.text, p.x, p.y);
      }else{
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
        ctx.fill();
      }
    });
    ctx.globalAlpha = 1;
    // 连击显示
    if(combo > 0){
      ctx.fillStyle = '#ffeaa7';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${combo} COMBO!`, W/2, 40);
    }
  }

  // 结算
  function finishGame(){
    running = false;
    cancelAnimationFrame(rafId);
    const highKey = 'xinji_mb_high_' + curSong + '_' + curDiff;
    const high = +(localStorage.getItem(highKey) || 0);
    const isNew = score > high;
    if(isNew) localStorage.setItem(highKey, score);
    // 评级
    const total = perfect + good + miss;
    let rank = 'C';
    if(total > 0){
      const acc = perfect / total;
      if(acc > 0.9) rank = 'S';
      else if(acc > 0.75) rank = 'A';
      else if(acc > 0.5) rank = 'B';
    }
    modalEl.innerHTML = `
      <div style="font-size:22px;font-weight:800;">🎵 演奏完成！</div>
      <div style="font-size:40px;font-weight:900;color:${isNew?'#e84393':'#2a3a5a'};margin:6px 0;">${rank}</div>
      <div>总分：<b style="color:#c0392b;font-size:22px;">${score}</b></div>
      <div style="margin:6px 0;">Perfect ${perfect} · Good ${good} · Miss ${miss}</div>
      <div>最高连击：${maxCombo}</div>
      <div style="margin-top:6px;">最高分：${Math.max(high, score)} ${isNew?'🆕':''}</div>
      <button class="mb-btn" style="margin-top:14px;" id="mbAgain">🔄 再来一次</button>
    `;
    ovrEl.classList.add('show');
    root.querySelector('#mbAgain').addEventListener('click', startGame);
  }

  // 歌曲选择
  root.querySelectorAll('[data-song]').forEach(b=>{
    b.addEventListener('click',()=>{
      root.querySelectorAll('[data-song]').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      curSong = b.dataset.song;
    });
  });
  // 难度选择
  root.querySelectorAll('[data-diff]').forEach(b=>{
    b.addEventListener('click',()=>{
      root.querySelectorAll('[data-diff]').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      curDiff = b.dataset.diff;
    });
  });
  // 轨道按钮
  root.querySelectorAll('[data-track]').forEach(b=>{
    b.addEventListener('click',()=>hitTrack(+b.dataset.track));
  });
  // 键盘支持
  const keyHandler = (e)=>{
    if(e.key==='a'||e.key==='A'||e.key==='1') hitTrack(0);
    else if(e.key==='s'||e.key==='S'||e.key==='2') hitTrack(1);
    else if(e.key==='d'||e.key==='D'||e.key==='3') hitTrack(2);
  };
  document.addEventListener('keydown', keyHandler);

  root.querySelector('#mbStart').addEventListener('click', startGame);

  // 初始画面
  ctx.fillStyle = '#fff';
  ctx.font = '18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('点击「开始」演奏！', W/2, H/2);
  ctx.font = '12px sans-serif';
  ctx.fillText('键盘 A/S/D 或点击下方按钮', W/2, H/2 + 24);
}
