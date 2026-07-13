// ============================================================
//  暗焰 — 煤气灯效应心理视觉小说  |  Game Engine + Script
// ============================================================

(function(){
"use strict";

/* ===== 全局状态 ===== */
const state = {
  sanity: 100,
  currentNode: null,
  typing: false,
  typingDone: false,
  fullText: '',
  typewriterTimer: null,
  choiceLocked: false,
  flags: {},
  particles: [],
  audioCtx: null,
  paused: false,
  started: false,
  currentChapter: '',
  unlockedChapters: [],
  seenEndings: [],
  achievements: []
};

/* ===== 章节定义 ===== */
const CHAPTERS = [
  { id:'prologue', num:'序章', name:'搬入新居', sub:'「 一切都刚刚好 」', node:'prologue' },
  { id:'ch1', num:'第一章', name:'裂 隙', sub:'「 也许是我记错了吧 」', node:'ch1' },
  { id:'ch2', num:'第二章', name:'迷 雾', sub:'「 你真的没问题吗？ 」', node:'ch2' },
  { id:'ch3', num:'第三章', name:'暗 焰', sub:'「 你已经分不清了，对吧 」', node:'ch3' },
  { id:'ch4', num:'第四章', name:'破 壳', sub:'「 我还记得什么 」', node:'ch4' }
];

/* ===== 成就定义 ===== */
const ACHIEVEMENTS = [
  { id:'first_step', name:'初入迷雾', desc:'开始游戏', icon:'◇', condition: () => true },
  { id:'doubt', name:'第一道裂隙', desc:'第一次质疑陆明的话', icon:'◇', condition: () => state.flags.saw_contradiction || state.flags.questioned_motive || state.flags.noticed_photo },
  { id:'evidence', name:'物证在手', desc:'拿出牛奶作为证据', icon:'◇', condition: () => state.flags.showed_evidence },
  { id:'friend', name:'求救信号', desc:'向苏然寻求确认', icon:'◇', condition: () => state.flags.asked_friend || state.flags.called_friend },
  { id:'confronted', name:'正面交锋', desc:'要求陆明离开', icon:'◇', condition: () => state.flags.confronted },
  { id:'awakened', name:'拨通那通电话', desc:'在最黑暗的时刻联系苏然', icon:'◇', condition: () => state.flags.awakened },
  { id:'survivor', name:'破晓', desc:'达成「破晓」结局', icon:'★', condition: () => state.seenEndings.includes('good') },
  { id:'enlightened', name:'觉醒', desc:'达成「觉醒」结局', icon:'★', condition: () => state.seenEndings.includes('awaken') },
  { id:'collector', name:'探索者', desc:'解锁全部7个结局', icon:'★', condition: () => state.seenEndings.length >= 7 },
  { id:'full_ach', name:'暗焰的见证者', desc:'解锁全部成就', icon:'★', condition: () => state.achievements.length >= ACHIEVEMENTS.length }
];

/* ===== 本地存储 ===== */
function saveProgress(){
  try {
    localStorage.setItem('gaslight_save', JSON.stringify({
      unlockedChapters: state.unlockedChapters,
      seenEndings: state.seenEndings,
      achievements: state.achievements
    }));
  } catch(e){}
}
function loadProgress(){
  try {
    const d = JSON.parse(localStorage.getItem('gaslight_save'));
    if(d){
      state.unlockedChapters = d.unlockedChapters || [];
      state.seenEndings = d.seenEndings || [];
      state.achievements = d.achievements || [];
    }
  } catch(e){}
}

/* ===== 章节解锁 ===== */
function unlockChapter(chapterId){
  if(!state.unlockedChapters.includes(chapterId)){
    state.unlockedChapters.push(chapterId);
  }
  // 解锁当前章节的下一个
  const idx = CHAPTERS.findIndex(c => c.id === chapterId);
  if(idx < CHAPTERS.length - 1){
    const next = CHAPTERS[idx + 1].id;
    if(!state.unlockedChapters.includes(next)){
      state.unlockedChapters.push(next);
    }
  }
  // 第一关始终解锁
  if(!state.unlockedChapters.includes('prologue')){
    state.unlockedChapters.push('prologue');
  }
  saveProgress();
}

/* ===== 成就检查 ===== */
function checkAchievements(){
  let newAch = [];
  ACHIEVEMENTS.forEach(a => {
    if(!state.achievements.includes(a.id) && a.condition()){
      state.achievements.push(a.id);
      newAch.push(a);
    }
  });
  if(newAch.length > 0){
    saveProgress();
    // 显示新成就通知
    showAchievementNotification(newAch);
  }
  return newAch;
}

function showAchievementNotification(achs){
  achs.forEach((a, i) => {
    setTimeout(() => {
      sfxChoice();
      const notif = document.createElement('div');
      notif.style.cssText = 'position:fixed;top:80px;right:20px;z-index:60;padding:12px 20px;border-radius:6px;background:linear-gradient(135deg,rgba(30,25,15,0.95),rgba(20,15,10,0.98));border:1px solid rgba(200,160,80,0.4);box-shadow:0 0 20px rgba(140,100,40,0.3);opacity:0;transition:opacity 0.5s;pointer-events:none;max-width:250px;';
      notif.innerHTML = `<div style="font-size:10px;color:rgba(200,180,120,0.5);letter-spacing:2px;margin-bottom:4px;">成就解锁</div><div style="font-size:14px;color:rgba(220,200,140,0.9);letter-spacing:2px;">${a.icon} ${a.name}</div><div style="font-size:10px;color:rgba(160,150,180,0.5);margin-top:4px;letter-spacing:1px;">${a.desc}</div>`;
      document.body.appendChild(notif);
      requestAnimationFrame(() => notif.style.opacity = '1');
      setTimeout(() => { notif.style.opacity = '0'; setTimeout(() => notif.remove(), 500); }, 3000);
    }, i * 800);
  });
}

/* ===== 资源路径 ===== */
const CHARS = {
  luming_smile:   'assets/chars_transparent/char_luming_smile.png',
  luming_serious: 'assets/chars_transparent/char_luming_serious.png',
  luming_angry:   'assets/chars_transparent/char_luming_angry.png',
  luming_worry:   'assets/chars_transparent/char_luming_worry.png',
  linxi_normal:   'assets/chars_transparent/char_linxi_normal.png',
  linxi_sad:      'assets/chars_transparent/char_linxi_sad.png',
  linxi_anxious:  'assets/chars_transparent/char_linxi_anxious.png'
};
const BGS = {
  livingroom: 'assets/bg_apartment_livingroom.jpg',
  bedroom:    'assets/bg_bedroom.jpg',
  kitchen:    'assets/bg_kitchen.jpg',
  park:       'assets/bg_park.jpg',
  cafe:       'assets/bg_dark_cafe.jpg',
  dark_room:  'assets/bg_dark_bedroom.jpg'
};

/* ===== DOM 引用 ===== */
const $ = id => document.getElementById(id);
const bgLayer         = $('bg-layer');
const distortionOvl   = $('distortion-overlay');
const charLayer       = $('character-layer');
const dialogBox       = $('dialog-box');
const speakerName     = $('speaker-name');
const dialogText      = $('dialog-text');
const clickIndicator  = $('click-indicator');
const choiceLayer     = $('choice-layer');
const choiceContainer= $('choice-container');
const sanityHud       = $('sanity-hud');
const sanityBar       = $('sanity-bar');
const sanityValue     = $('sanity-value');
const chapterTitle    = $('chapter-title');
const chapterNum      = $('chapter-number');
const chapterName     = $('chapter-name');
const chapterSub      = $('chapter-subtitle');
const fadeOverlay     = $('fade-overlay');
const titleScreen     = $('title-screen');
const endingScreen    = $('ending-screen');
const endingTitle     = $('ending-title');
const endingDesc      = $('ending-desc');
const particlesCanvas = $('particles-canvas');
const ctx             = particlesCanvas.getContext('2d');

/* ===== 音效 ===== */
function playTone(freq, dur, vol){
  try {
    if(!state.audioCtx) state.audioCtx = new (window.AudioContext||window.webkitAudioContext)();
    const o = state.audioCtx.createOscillator();
    const g = state.audioCtx.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.value = vol||0.06;
    g.gain.exponentialRampToValueAtTime(0.001, state.audioCtx.currentTime+dur);
    o.connect(g); g.connect(state.audioCtx.destination);
    o.start(); o.stop(state.audioCtx.currentTime+dur);
  } catch(e){}
}
function sfxClick(){ playTone(800,0.08,0.04); }
function sfxChoice(){ playTone(600,0.12,0.05); playTone(900,0.15,0.03); }
function sfxDistort(){ playTone(120,0.5,0.04); }

/* ===== 背景管理 ===== */
function setBackground(bgKey, brightness, saturate){
  if(BGS[bgKey]){
    bgLayer.style.backgroundImage = `url('${BGS[bgKey]}')`;
  }
  if(brightness !== undefined) bgLayer.style.setProperty('--bg-brightness', brightness);
  if(saturate !== undefined) bgLayer.style.setProperty('--bg-saturate', saturate);
}

/* ===== 角色管理 ===== */
let activeSprites = {};
function showCharacter(charKey, position, dim, shake){
  const pos = position || 'center';
  const id = charKey + '_' + pos;
  if(!activeSprites[id]){
    const img = document.createElement('img');
    img.className = 'character-sprite character-' + pos + ' character-visible';
    img.src = CHARS[charKey];
    charLayer.appendChild(img);
    activeSprites[id] = img;
  }
  const spr = activeSprites[id];
  spr.classList.remove('character-hidden','character-dim','character-shake');
  spr.classList.add('character-visible');
  if(dim) spr.classList.add('character-dim');
  if(shake) spr.classList.add('character-shake');
}
function hideCharacter(charKey, position){
  const pos = position || 'center';
  const id = charKey + '_' + pos;
  if(activeSprites[id]){
    activeSprites[id].classList.remove('character-visible','character-dim','character-shake');
    activeSprites[id].classList.add('character-hidden');
  }
}
function hideAllCharacters(){
  Object.keys(activeSprites).forEach(id => {
    activeSprites[id].classList.remove('character-visible','character-dim','character-shake');
    activeSprites[id].classList.add('character-hidden');
  });
}
function setCharacterExpression(charKey, expr, position, dim, shake){
  const pos = position || 'center';
  const oldId = pos + '_placeholder';
  // find existing sprite at this position
  Object.keys(activeSprites).forEach(id => {
    if(id.endsWith('_'+pos)){
      const oldKey = id.replace('_'+pos,'');
      if(oldKey !== charKey){
        hideCharacter(oldKey, pos);
      }
    }
  });
  showCharacter(charKey, pos, dim, shake);
}

/* ===== 打字机 ===== */
function typeText(text, speed, cb){
  state.typing = true;
  state.typingDone = false;
  state.fullText = text;
  dialogText.innerHTML = '';
  let i = 0;
  const spd = speed || 45;

  // 检查理智值，低理智时文字抖动
  const distortClass = state.sanity < 30 ? ' text-distort' : '';

  function tick(){
    if(i < text.length){
      let ch = text[i];
      if(ch === '\n') ch = '<br>';
      dialogText.innerHTML = text.substring(0,i+1).replace(/\n/g,'<br>') + '<span class="typewriter' + distortClass + '"></span>';
      i++;
      state.typewriterTimer = setTimeout(tick, spd);
    } else {
      state.typing = false;
      state.typingDone = true;
      dialogText.innerHTML = text.replace(/\n/g,'<br>');
      clickIndicator.classList.add('visible');
      if(cb) cb();
    }
  }
  tick();
}

function finishTyping(){
  if(state.typing){
    clearTimeout(state.typewriterTimer);
    state.typing = false;
    state.typingDone = true;
    dialogText.innerHTML = state.fullText.replace(/\n/g,'<br>');
    clickIndicator.classList.add('visible');
  }
}

/* ===== 对话推进 ===== */
window.advanceDialog = function(){
  sfxClick();
  if(state.paused || !state.started) return;
  if(state.choiceLocked) return;
  if(state.typing){ finishTyping(); return; }
  clickIndicator.classList.remove('visible');
  const node = SCRIPT[state.currentNode];
  if(node && node.next){
    state.currentNode = node.next;
    processNode(state.currentNode);
    checkAchievements();
  }
};

/* ===== 理智值 ===== */
function changeSanity(delta){
  state.sanity = Math.max(0, Math.min(100, state.sanity + delta));
  sanityBar.style.width = state.sanity + '%';
  sanityValue.textContent = state.sanity;
  // 颜色变化
  if(state.sanity <= 30){
    sanityBar.style.background = 'linear-gradient(90deg, #ff4444, #cc2222)';
  } else if(state.sanity <= 60){
    sanityBar.style.background = 'linear-gradient(90deg, #ffaa44, #cc7722)';
  } else {
    sanityBar.style.background = 'linear-gradient(90deg, #6eb8ff, #a088ff)';
  }
  // 全局视觉效果
  if(state.sanity <= 40){
    distortionOvl.classList.add('active');
  } else {
    distortionOvl.classList.remove('active');
  }
}

/* ===== 选项系统 ===== */
function showChoices(choices){
  choiceLayer.classList.add('active');
  choiceContainer.innerHTML = '';
  choices.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    if(state.sanity < 35) btn.classList.add('sanity-low');
    btn.textContent = c.text;
    btn.onclick = () => {
      sfxChoice();
      choiceLayer.classList.remove('active');
      state.choiceLocked = false;
      if(c.sanity !== undefined) changeSanity(c.sanity);
      if(c.flag) state.flags[c.flag] = true;
      if(c.next){
        state.currentNode = c.next;
        processNode(state.currentNode);
      }
    };
    choiceContainer.appendChild(btn);
  });
}

/* ===== 章节标题 ===== */
function showChapter(num, name, sub){
  return new Promise(resolve => {
    chapterNum.textContent = num;
    chapterName.textContent = name;
    chapterSub.textContent = sub || '';
    chapterTitle.classList.add('active');
    playTone(220,1.5,0.05);
    setTimeout(() => {
      chapterTitle.classList.remove('active');
      setTimeout(resolve, 800);
    }, 2800);
  });
}

/* ===== 转场 ===== */
function fadeTransition(dur, cb){
  return new Promise(resolve => {
    fadeOverlay.classList.add('active');
    setTimeout(() => {
      if(cb) cb();
      setTimeout(() => {
        fadeOverlay.classList.remove('active');
        setTimeout(resolve, 800);
      }, 200);
    }, dur || 800);
  });
}

/* ===== 粒子系统 ===== */
function initParticles(){
  particlesCanvas.width = window.innerWidth;
  particlesCanvas.height = window.innerHeight;
  for(let i=0; i<30; i++){
    state.particles.push({
      x: Math.random()*particlesCanvas.width,
      y: Math.random()*particlesCanvas.height,
      vx: (Math.random()-0.5)*0.3,
      vy: -Math.random()*0.5-0.1,
      size: Math.random()*2+0.5,
      alpha: Math.random()*0.3+0.1,
      pulse: Math.random()*Math.PI*2
    });
  }
  animateParticles();
}
function animateParticles(){
  ctx.clearRect(0,0,particlesCanvas.width,particlesCanvas.height);
  // 理智越低粒子越多越红
  const intensity = state.sanity < 50 ? (50-state.sanity)/50 : 0;
  const count = Math.floor(30 + intensity * 50);
  while(state.particles.length < count){
    state.particles.push({
      x: Math.random()*particlesCanvas.width,
      y: particlesCanvas.height + 10,
      vx: (Math.random()-0.5)*0.5,
      vy: -Math.random()*1-0.3,
      size: Math.random()*2+0.5,
      alpha: Math.random()*0.4+0.1,
      pulse: Math.random()*Math.PI*2
    });
  }
  state.particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.pulse += 0.02;
    const a = p.alpha * (0.5+0.5*Math.sin(p.pulse));
    if(intensity > 0.3){
      ctx.fillStyle = `rgba(180,60,60,${a})`;
    } else {
      ctx.fillStyle = `rgba(140,130,200,${a})`;
    }
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
    ctx.fill();
    if(p.y < -10 || p.x < -10 || p.x > particlesCanvas.width+10){
      p.y = particlesCanvas.height+10;
      p.x = Math.random()*particlesCanvas.width;
    }
  });
  requestAnimationFrame(animateParticles);
}

/* ===== 结局 ===== */
function showEnding(endingId, title, desc){
  endingTitle.textContent = title;
  endingDesc.textContent = desc;
  endingScreen.classList.add('active');
  playTone(180,3,0.06);
  // 记录结局
  if(!state.seenEndings.includes(endingId)){
    state.seenEndings.push(endingId);
  }
  // 解锁第四章（通关任何结局）
  unlockChapter('ch4');
  // 检查成就
  checkAchievements();
  // 显示本局解锁的成就
  renderEndingAchievements();
  saveProgress();
}

function renderEndingAchievements(){
  const existing = document.querySelector('.ending-achievements');
  if(existing) existing.remove();
  const recentAch = ACHIEVEMENTS.filter(a => state.achievements.includes(a.id));
  if(recentAch.length === 0) return;
  const container = document.createElement('div');
  container.className = 'ending-achievements';
  let html = '<div class="ending-achievements-title">已解锁成就</div>';
  recentAch.slice(-5).forEach(a => {
    html += `<div class="ending-ach-item${state.achievements.indexOf(a.id) === state.achievements.length - 1 ? ' new' : ''}">${a.icon} ${a.name} — ${a.desc}</div>`;
  });
  container.innerHTML = html;
  endingScreen.insertBefore(container, $('ending-restart'));
}

/* ===== 节点处理引擎 ===== */
async function processNode(nodeId){
  const node = SCRIPT[nodeId];
  if(!node){ console.warn('Node not found:', nodeId); return; }

  // 如果节点有type，执行特殊逻辑
  if(node.type === 'chapter'){
    sanityHud.classList.add('visible');
    state.currentChapter = node.node_id || '';
    unlockChapter(node.node_id || '');
    await showChapter(node.chapter_num, node.chapter_name, node.chapter_sub);
    if(node.next){ state.currentNode = node.next; processNode(state.currentNode); }
    return;
  }

  if(node.type === 'bg_change'){
    await fadeTransition(600, () => {
      setBackground(node.bg, node.brightness, node.saturate);
    });
    if(node.next){ state.currentNode = node.next; processNode(state.currentNode); }
    return;
  }

  if(node.type === 'sanity_check'){
    if(node.condition === 'low' && state.sanity <= node.threshold){
      state.currentNode = node.then;
      processNode(node.then);
    } else {
      state.currentNode = node.else || node.next;
      processNode(state.currentNode);
    }
    return;
  }

  if(node.type === 'flag_check'){
    if(state.flags[node.flag]){
      state.currentNode = node.then;
      processNode(node.then);
    } else {
      state.currentNode = node.else || node.next;
      processNode(state.currentNode);
    }
    return;
  }

  if(node.type === 'ending'){
    await fadeTransition(1000);
    showEnding(node.ending_id || 'unknown', node.title, node.desc);
    return;
  }

  if(node.type === 'effect'){
    if(node.effect === 'distort'){
      distortionOvl.classList.add('active');
      sfxDistort();
    }
    if(node.effect === 'clear_distort'){
      distortionOvl.classList.remove('active');
    }
    if(node.effect === 'shake_char'){
      Object.values(activeSprites).forEach(s => s.classList.add('character-shake'));
    }
    if(node.effect === 'stop_shake'){
      Object.values(activeSprites).forEach(s => s.classList.remove('character-shake'));
    }
    if(node.next){ state.currentNode = node.next; processNode(state.currentNode); }
    return;
  }

  // 普通对话节点
  if(node.bg) setBackground(node.bg, node.brightness, node.saturate);

  // 角色显示
  hideAllCharacters();
  if(node.characters){
    node.characters.forEach(c => {
      showCharacter(c.key, c.pos, c.dim, c.shake);
    });
  }

  // 说话者
  if(node.speaker === 'narration'){
    speakerName.textContent = '';
    speakerName.className = 'narrator';
  } else if(node.speaker === 'inner'){
    speakerName.textContent = '内心';
    speakerName.className = 'inner';
  } else if(node.speaker === 'linxi'){
    speakerName.textContent = '林 夕';
    speakerName.className = 'linxi';
  } else if(node.speaker === 'luming'){
    speakerName.textContent = '陆 明';
    speakerName.className = 'luming';
  } else {
    speakerName.textContent = node.speaker || '';
    speakerName.className = '';
  }

  // 文字效果类
  let textClass = '';
  if(node.textEffect === 'distort' && state.sanity < 40) textClass = ' text-distort';

  // 理智变化
  if(node.sanity !== undefined) changeSanity(node.sanity);

  // 打字
  clickIndicator.classList.remove('visible');
  // 如果有选项，立即标记锁定防止点击空洞
  if(node.choices){
    state.choiceLocked = true;
  }
  typeText(node.text, node.speed, () => {
    if(node.choices){
      showChoices(node.choices);
    }
  });
}

/* ===== 剧本数据 ===== */
const SCRIPT = {

// =============================================
//  序章 + 第一章：新居
// =============================================
prologue: {
  type:'chapter', node_id:'prologue', chapter_num:'序章', chapter_name:'搬入新居', chapter_sub:'「 一切都刚刚好 」',
  next:'p0'
},

// 序章互动：探索新居
p0: {
  type:'bg_change', bg:'livingroom', brightness:1, saturate:1,
  next:'p0b'
},
p0b: {
  bg:'livingroom', brightness:1, saturate:1,
  speaker:'narration', text:'七月的阳光透过落地窗洒进来，在崭新的木地板上铺开一片暖色。\n这是我和陆明一起挑选的公寓——两室一厅，阳台朝南。',
  next:'p0_explore'
},
p0_explore: {
  speaker:'narration',
  text:'纸箱还没有全部拆完。趁陆明还没回来，我先看看各个房间。',
  choices:[
    { text:'先去厨房看看', sanity:0, next:'p0_kitchen' },
    { text:'先去卧室看看', sanity:0, next:'p0_bedroom' },
    { text:'就在客厅等他', sanity:0, next:'p1' }
  ]
},
p0_kitchen: {
  type:'bg_change', bg:'kitchen', brightness:0.95, saturate:1,
  next:'p0_kitchen2'
},
p0_kitchen2: {
  bg:'kitchen', brightness:0.95, saturate:1,
  speaker:'narration', text:'厨房不大，但设施齐全。\n我把调料罐按自己的习惯摆好了——盐在左边第二层，糖在右边第三层。\n强迫症般的整齐让我安心。',
  sanity:2,
  next:'p0_after_explore'
},
p0_bedroom: {
  type:'bg_change', bg:'bedroom', brightness:0.9, saturate:1,
  next:'p0_bedroom2'
},
p0_bedroom2: {
  bg:'bedroom', brightness:0.9, saturate:1,
  speaker:'narration', text:'卧室的窗帘是浅灰色的，光线柔和。\n床头柜上放了一个我们合照的相框。\n照片里我们笑得很开心。',
  sanity:2,
  next:'p0_after_explore'
},
p0_after_explore: {
  type:'bg_change', bg:'livingroom', brightness:1, saturate:1,
  next:'p1'
},

p1: {
  bg:'livingroom', brightness:1, saturate:1,
  speaker:'narration', text:'客厅已经初具雏形。\n门锁响动——陆明回来了，手里提着两杯奶茶。',
  characters:[{key:'linxi_normal',pos:'center'}],
  next:'p2'
},

p2: {
  speaker:'luming', text:'林夕，快来看看，我买了你爱喝的芋泥波波。',
  characters:[{key:'luming_smile',pos:'center'},{key:'linxi_normal',pos:'left',dim:true}],
  next:'p3'
},

p3: {
  speaker:'luming', text:'别忙了。这个家又不会跑掉，来歇一会儿。',
  characters:[{key:'luming_smile',pos:'center'},{key:'linxi_normal',pos:'left',dim:true}],
  next:'p4'
},

p4: {
  speaker:'linxi', text:'可是厨房的东西还没归类……你确定那个柜子的螺丝你拧紧了吗？',
  characters:[{key:'luming_smile',pos:'right',dim:true},{key:'linxi_normal',pos:'left'}],
  next:'p5'
},

p5: {
  speaker:'luming', text:'我又不是小孩子。放心吧，都弄好了。\n来，喝奶茶。',
  characters:[{key:'luming_smile',pos:'center'},{key:'linxi_normal',pos:'left',dim:true}],
  sanity:2,
  next:'p6'
},

p6: {
  speaker:'narration', text:'他递过来一杯冰凉的奶茶，笑容温和得像窗外的阳光。\n我接过杯子，心里涌起一阵安心。\n\n新生活，就这样开始了。',
  characters:[{key:'luming_smile',pos:'center'}],
  sanity:2,
  next:'p7'
},

p7: {
  speaker:'inner', text:'那时候的我不知道——\n这些温暖，将来都会变成操控我的工具。',
  characters:[{key:'linxi_normal',pos:'center'}],
  next:'ch1'
},

ch1: {
  type:'chapter', node_id:'ch1', chapter_num:'第一章', chapter_name:'裂 隙', chapter_sub:'「 也许是我记错了吧 」',
  next:'d1'
},

d1: {
  type:'bg_change', bg:'kitchen', brightness:0.95, saturate:0.95,
  next:'d2'
},

d2: {
  bg:'kitchen', brightness:0.95, saturate:0.95,
  speaker:'narration', text:'搬进来第三天，早上。我在厨房准备做早餐。\n习惯性地伸手去拿盐罐——',
  characters:[{key:'linxi_normal',pos:'center'}],
  next:'d3'
},

d3: {
  speaker:'narration', text:'手停在了半空中。\n盐罐的位置……和昨天不一样了。',
  characters:[{key:'linxi_normal',pos:'center'}],
  next:'d3b'
},

d3b: {
  speaker:'inner', text:'我明明放在第二层的左边。\n现在它跑到了右边，而且罐口朝向也变了。',
  characters:[{key:'linxi_normal',pos:'center'}],
  next:'d4'
},

d4: {
  speaker:'narration', text:'陆明从卧室走出来，打着哈欠。',
  characters:[{key:'linxi_normal',pos:'left'},{key:'luming_smile',pos:'right'}],
  next:'d5'
},

d5: {
  speaker:'linxi', text:'陆明，你动过盐罐吗？',
  characters:[{key:'linxi_normal',pos:'left'},{key:'luming_smile',pos:'right'}],
  next:'d6'
},

d6: {
  speaker:'luming', text:'盐罐？没有啊。怎么了？',
  characters:[{key:'linxi_normal',pos:'left',dim:true},{key:'luming_smile',pos:'right'}],
  next:'d7'
},

d7: {
  speaker:'linxi', text:'它位置变了……我明明放在左边的。',
  characters:[{key:'linxi_normal',pos:'left'},{key:'luming_smile',pos:'right',dim:true}],
  next:'d8'
},

d8: {
  speaker:'luming', text:'你确定吗？也许你记错了，昨天你太累了。\n搬东西搬了一整天，混乱一点很正常吧。',
  characters:[{key:'linxi_normal',pos:'left',dim:true},{key:'luming_worry',pos:'right'}],
  next:'d9'
},

d9: {
  speaker:'inner', text:'……确实，我昨天挺累的。',
  characters:[{key:'linxi_normal',pos:'center'}],
  next:'d10'
},

d10_choice: {
  bg:'kitchen',
  speaker:'narration',
  text:'我应该怎么回应？',
  characters:[{key:'luming_worry',pos:'right',dim:true},{key:'linxi_normal',pos:'left'}],
  choices:[
    { text:'「好吧，可能是我记错了。」', sanity:-3, next:'d11a' },
    { text:'「不，我很确定放在左边。」', sanity:3, next:'d11b' },
    { text:'先不说了，也许过两天就习惯了。', sanity:-5, next:'d11c' }
  ]
},

d11a: {
  speaker:'linxi', text:'……好吧，可能确实是我记错了。',
  characters:[{key:'linxi_normal',pos:'center'},{key:'luming_smile',pos:'right',dim:true}],
  next:'d12'
},

d11b: {
  speaker:'linxi', text:'不，我很确定。我每次用完都会放回原位。',
  characters:[{key:'linxi_normal',pos:'left'},{key:'luming_smile',pos:'right',dim:true}],
  next:'d11b2'
},

d11b2: {
  speaker:'luming', text:'林夕，你听我说。你最近压力很大，\n新环境适应需要时间，别太紧张了。',
  characters:[{key:'luming_worry',pos:'center'},{key:'linxi_normal',pos:'left',dim:true}],
  next:'d11b3'
},

d11b3: {
  speaker:'luming', text:'一个盐罐的位置而已，不值得这么纠结。\n你是不是最近睡眠不好？',
  characters:[{key:'luming_worry',pos:'center'}],
  next:'d12'
},

d11c: {
  speaker:'linxi', text:'……先不说了。也许过两天就习惯了。',
  characters:[{key:'linxi_sad',pos:'center'},{key:'luming_smile',pos:'right',dim:true}],
  next:'d12'
},

d12: {
  speaker:'narration', text:'他的语气带着关切，眉头微微皱起。\n那种表情让我觉得……也许真的是我太敏感了。',
  characters:[{key:'luming_worry',pos:'center'}],
  sanity:-3,
  next:'d13'
},

d13: {
  type:'bg_change', bg:'livingroom', brightness:0.9,
  next:'d14'
},

d14: {
  bg:'livingroom', brightness:0.9,
  speaker:'narration', text:'一周后的傍晚。我下班回到家，发现客厅有些异样。\n沙发靠垫被重新排列了，电视柜上的相框也换了位置。',
  characters:[{key:'linxi_normal',pos:'center'}],
  next:'d14b'
},

d14b: {
  speaker:'narration', text:'而且……我和陆明的合照，\n原本放在电视柜最中间的位置——\n现在被一张他单身时的照片取代了。',
  characters:[{key:'linxi_normal',pos:'center'}],
  next:'d15'
},

d15: {
  speaker:'inner', text:'我走之前明明把那个蓝色靠垫放在左边——\n现在它在右边，而且反了个面。\n合照不可能自己跑到角落里去。',
  characters:[{key:'linxi_normal',pos:'center'}],
  next:'d16'
},

d16: {
  speaker:'narration', text:'陆明正在厨房做饭，锅铲的声响传来。',
  characters:[{key:'linxi_normal',pos:'left'}],
  next:'d17'
},

d17: {
  speaker:'linxi', text:'陆明，你今天整理过客厅吗？',
  characters:[{key:'linxi_normal',pos:'left'},{key:'luming_smile',pos:'right'}],
  next:'d18'
},

d18: {
  speaker:'luming', text:'嗯？没有啊。我一整天都在家办公，\n根本没出书房。你看，电脑还开着呢。',
  characters:[{key:'linxi_normal',pos:'left',dim:true},{key:'luming_smile',pos:'right'}],
  next:'d19'
},

d19: {
  speaker:'linxi', text:'可是沙发靠垫的位置变了……\n还有相框，我们的合照我放在中间的，\n现在被换成了你自己的照片。',
  characters:[{key:'linxi_normal',pos:'left'},{key:'luming_smile',pos:'right',dim:true}],
  next:'d20'
},

d20: {
  speaker:'luming', text:'林夕。',
  characters:[{key:'luming_serious',pos:'center'}],
  next:'d21'
},

d21: {
  speaker:'luming', text:'你是不是最近工作压力太大了？\n上次你也说盐罐位置不对，现在又是靠垫……\n你不觉得这些"异常"有点频繁吗？',
  characters:[{key:'luming_serious',pos:'center'},{key:'linxi_normal',pos:'left',dim:true}],
  next:'d21b'
},

d21b: {
  speaker:'narration', text:'他把"异常"两个字说得特别重。\n像是给我的怀疑盖了一个章——"不正常"。',
  characters:[{key:'luming_serious',pos:'center'}],
  next:'d22'
},

d22: {
  speaker:'luming', text:'我没有动过那些东西。你想想看，\n如果真的是我做的，我有什么理由骗你呢？',
  characters:[{key:'luming_worry',pos:'center'}],
  next:'d22_choice'
},

d22_choice: {
  speaker:'narration',
  text:'他的目光真诚而担忧，像是在看一个生病的人。\n但"异常"两个字还回荡在我耳边。',
  characters:[{key:'luming_worry',pos:'center'},{key:'linxi_sad',pos:'left',dim:true}],
  choices:[
    { text:'「……也许我真的太累了。」（认同他的说法）', sanity:-8, next:'d23a' },
    { text:'「我没有生病，我只是在陈述事实。」（坚持立场）', sanity:5, next:'d23b' },
    { text:'沉默不语。', sanity:-5, next:'d23c' },
    { text:'「你为什么把合照换掉了？」（追问照片）', sanity:8, flag:'noticed_photo', next:'d23d' }
  ]
},

d23a: {
  speaker:'linxi', text:'……也许我真的太累了。抱歉，\n不要在意，可能是我的记忆出了问题。',
  characters:[{key:'linxi_sad',pos:'center'},{key:'luming_smile',pos:'right',dim:true}],
  next:'d24'
},

d23b: {
  speaker:'linxi', text:'我没有生病。我只是在陈述我看到的。\n你可以不信，但请不要把它归结为我的问题。',
  characters:[{key:'linxi_normal',pos:'left'},{key:'luming_serious',pos:'right'}],
  next:'d23b2'
},

d23b2: {
  speaker:'luming', text:'……好，好。我不说了。\n你先去休息一下吧，晚饭我来弄。',
  characters:[{key:'luming_worry',pos:'center'},{key:'linxi_normal',pos:'left',dim:true}],
  sanity:-3,
  next:'d24'
},

d23c: {
  speaker:'narration', text:'我沉默了。\n陆明叹了口气，走过来轻轻拍了拍我的肩膀。',
  characters:[{key:'linxi_sad',pos:'center'},{key:'luming_worry',pos:'right'}],
  next:'d23c2'
},

d23c2: {
  speaker:'luming', text:'别想了。来吃饭吧。\n我做了你爱吃的番茄炒蛋。',
  characters:[{key:'luming_smile',pos:'center'},{key:'linxi_sad',pos:'left',dim:true}],
  next:'d24'
},

// 新增分支：追问合照
d23d: {
  speaker:'linxi', text:'且不说靠垫的事——\n我们的合照，为什么被换成了你单身时的照片？',
  characters:[{key:'linxi_normal',pos:'left'},{key:'luming_serious',pos:'right'}],
  next:'d23d2'
},

d23d2: {
  speaker:'luming', text:'……什么？我什么时候换过照片？\n那张照片一直在那里的。',
  characters:[{key:'luming_worry',pos:'center'},{key:'linxi_normal',pos:'left',dim:true}],
  next:'d23d3'
},

d23d3: {
  speaker:'linxi', text:'它原来不是那张。原来是我们两个人的合照。\n我亲手放的，在电视柜正中间。',
  characters:[{key:'linxi_normal',pos:'left'},{key:'luming_worry',pos:'right',dim:true}],
  next:'d23d4'
},

d23d4: {
  speaker:'narration', text:'陆明看着我，表情从惊讶变成了无奈。',
  characters:[{key:'luming_worry',pos:'center'}],
  next:'d23d5'
},

d23d5: {
  speaker:'luming', text:'林夕……那张合照是上周你不小心摔碎了相框，\n我还没来得及换新的。\n你不记得了吗？',
  characters:[{key:'luming_worry',pos:'center'},{key:'linxi_anxious',pos:'left',dim:true}],
  sanity:-10,
  next:'d23d6'
},

d23d6: {
  speaker:'inner', text:'摔碎了？我不记得有这件事。\n……可是，万一他说的对呢？',
  characters:[{key:'linxi_anxious',pos:'center'}],
  next:'d24'
},

d24: {
  speaker:'inner', text:'他总是这样。当我提出疑虑时，\n话题最终会绕回到「你太累了」「你太紧张了」。',
  characters:[{key:'linxi_sad',pos:'center'}],
  next:'d25'
},

d25: {
  speaker:'inner', text:'每一次，我都找不到反驳的理由。\n因为他说得好像……真的很有道理。\n而且他总是那么温柔、那么体贴。\n一个这么爱我的人，怎么会故意骗我呢？',
  characters:[{key:'linxi_sad',pos:'center'}],
  next:'ch2'
},

// =============================================
//  第二章：迷雾
// =============================================
ch2: {
  type:'chapter', node_id:'ch2', chapter_num:'第二章', chapter_name:'迷 雾', chapter_sub:'「 你真的没问题吗？ 」',
  next:'e1'
},

e1: {
  type:'bg_change', bg:'livingroom', brightness:0.8, saturate:0.8,
  next:'e2'
},

e2: {
  bg:'livingroom', brightness:0.8, saturate:0.8,
  speaker:'narration', text:'两周过去了。\n那些「小事」还在继续——物品移动、时间对不上、\n明明说过的话被否认。\n甚至有一次，我的手机备忘录里的一段文字不见了。',
  characters:[{key:'linxi_sad',pos:'center'}],
  next:'e3'
},

e3: {
  speaker:'narration', text:'我开始养成了一个习惯：\n给重要的事情拍照记录。以证明自己没有记错。',
  characters:[{key:'linxi_normal',pos:'center'}],
  sanity:2,
  next:'e4'
},

e4: {
  type:'bg_change', bg:'bedroom', brightness:0.75,
  next:'e5'
},

e5: {
  bg:'bedroom', brightness:0.75,
  speaker:'narration', text:'这天晚上，我翻看手机相册，\n想找上周拍的一张桌面照片作为证据。',
  characters:[{key:'linxi_normal',pos:'center'}],
  next:'e6'
},

e6: {
  speaker:'narration', text:'翻了一圈，没有找到。',
  characters:[{key:'linxi_normal',pos:'center'}],
  next:'e7'
},

e7: {
  speaker:'inner', text:'不可能。我明明拍了的，还编辑了标题「桌面0725」……\n怎么会消失？',
  characters:[{key:'linxi_anxious',pos:'center'}],
  next:'e8'
},

e8: {
  speaker:'narration', text:'我反复翻看相册，甚至检查了「最近删除」文件夹。\n什么都没有。',
  characters:[{key:'linxi_anxious',pos:'center'}],
  next:'e9'
},

e9: {
  speaker:'luming', text:'你在找什么？这么晚了还不睡。',
  characters:[{key:'luming_worry',pos:'right'},{key:'linxi_anxious',pos:'left'}],
  next:'e10'
},

e10: {
  speaker:'linxi', text:'我上周拍的一张照片……不见了。\n我确定拍了，但现在找不到了。',
  characters:[{key:'linxi_anxious',pos:'left'},{key:'luming_smile',pos:'right',dim:true}],
  next:'e11'
},

e11: {
  speaker:'luming', text:'也许你当时按了拍摄但没成功？\n这种事很常见的，尤其是着急的时候。',
  characters:[{key:'luming_smile',pos:'center'},{key:'linxi_anxious',pos:'left',dim:true}],
  next:'e12'
},

e12: {
  speaker:'luming', text:'林夕，你最近总是疑神疑鬼的。\n我觉得你应该去医院检查一下。',
  characters:[{key:'luming_worry',pos:'center'}],
  next:'e13'
},

e13: {
  speaker:'luming', text:'不是为了别的，是因为我在乎你。\n一个正常人不会总是觉得周围的东西在被「动过」。',
  characters:[{key:'luming_worry',pos:'center'},{key:'linxi_anxious',pos:'left',dim:true}],
  next:'e13_choice'
},

e13_choice: {
  speaker:'narration',
  text:'他的关心像一根柔软的绳子，紧紧缠绕着我不安的心。',
  characters:[{key:'luming_worry',pos:'center'},{key:'linxi_sad',pos:'left'}],
  choices:[
    { text:'「你说得对，也许我该去看看。」（接受建议）', sanity:-10, flag:'accepted_hospital', next:'e14a' },
    { text:'「我没有疑神疑鬼，是事情真的不对劲。」（拒绝）', sanity:5, flag:'refused_hospital', next:'e14b' },
    { text:'「……你为什么这么急着让我去医院？」（反问）', sanity:8, flag:'questioned_motive', next:'e14c' }
  ]
},

e14a: {
  speaker:'linxi', text:'……你说得对。也许我确实应该去看看。\n对不起，让你担心了。',
  characters:[{key:'linxi_sad',pos:'center'},{key:'luming_smile',pos:'right',dim:true}],
  next:'e15'
},

e14b: {
  speaker:'linxi', text:'我没有疑神疑鬼。是事情真的不对劲——\n先是盐罐，然后是靠垫，现在连照片都消失了。',
  characters:[{key:'linxi_normal',pos:'left'},{key:'luming_serious',pos:'right'}],
  next:'e14b2'
},

e14b2: {
  speaker:'luming', text:'你看，你现在的状态……\n正常人是不会这样说话的。',
  characters:[{key:'luming_serious',pos:'center'},{key:'linxi_normal',pos:'left',dim:true}],
  next:'e15'
},

e14c: {
  speaker:'linxi', text:'等一下。你为什么这么急着让我去医院？\n我只是说了一张照片不见了。',
  characters:[{key:'linxi_normal',pos:'left'},{key:'luming_serious',pos:'right'}],
  next:'e14c2'
},

e14c2: {
  speaker:'luming', text:'……因为我担心你啊。\n你觉得我会害你吗？',
  characters:[{key:'luming_worry',pos:'center'},{key:'linxi_normal',pos:'left',dim:true}],
  next:'e15'
},

e15: {
  type:'bg_change', bg:'park', brightness:0.85, saturate:0.85,
  next:'e16'
},

e16: {
  bg:'park', brightness:0.85, saturate:0.85,
  speaker:'narration', text:'周末。我和大学时的好友苏然约在公园见面。\n我已经很久没有跟别人倾诉了。',
  characters:[{key:'linxi_normal',pos:'center'}],
  next:'e17'
},

e17: {
  speaker:'narration', text:'我没有告诉苏然所有的事。\n只是说最近搬了新家，有点不适应，感觉记忆力不太好。',
  characters:[{key:'linxi_normal',pos:'center'}],
  next:'e18'
},

e18: {
  speaker:'narration', text:'苏然看着我，沉默了一会儿。\n然后她问了一个让我浑身发凉的问题。',
  characters:[{key:'linxi_normal',pos:'center'}],
  next:'e18b'
},

e18b: {
  speaker:'narration', text:'「林夕，你以前不是这样的。」\n「你以前是最清醒的那个人。」\n「……他对你做了什么？」',
  characters:[{key:'linxi_sad',pos:'center'}],
  next:'e19'
},

e19: {
  speaker:'inner', text:'以前……是吗？\n她说了「他对你做了什么」。\n不是「你怎么了」，而是——「他做了什么」。',
  characters:[{key:'linxi_sad',pos:'center'}],
  sanity:3,
  next:'e20'
},

e20: {
  speaker:'inner', text:'我开始不确定了。\n「以前的我」到底是怎样的？\n我真的变了吗？还是说——',
  characters:[{key:'linxi_anxious',pos:'center'}],
  next:'e21'
},

e21: {
  speaker:'inner', text:'还是说，有什么人正在改变我？',
  characters:[{key:'linxi_anxious',pos:'center'}],
  next:'e21_choice'
},

e21_choice: {
  speaker:'narration',
  text:'回家的路上，夕阳把影子拉得很长。',
  characters:[{key:'linxi_sad',pos:'center'}],
  choices:[
    { text:'给苏然发消息：「你觉得我正常吗？」', sanity:-3, flag:'asked_friend', next:'e21a' },
    { text:'什么都不说，直接回家。', sanity:-5, next:'e22' }
  ]
},

e21a: {
  speaker:'narration', text:'苏然回复了：「你是我认识的最正常的人。\n如果你觉得不对劲，那就是不对劲。\n相信自己的直觉。」',
  characters:[],
  sanity:5,
  next:'e22'
},

e22: {
  speaker:'narration', text:'手机震动了一下。是陆明的消息。',
  characters:[{key:'linxi_sad',pos:'center'}],
  next:'e23'
},

e23: {
  speaker:'luming', text:'「回来的时候买点牛奶。冰箱里没有了。\n对了，今天和朋友见面开心吗？」',
  characters:[],
  next:'e24'
},

e24: {
  speaker:'narration', text:'他的消息看起来很正常、很体贴。\n可是——冰箱里的牛奶，明明还有半盒。',
  characters:[],
  next:'e25'
},

e25: {
  type:'effect', effect:'distort',
  next:'e25b'
},

e25b: {
  speaker:'inner', text:'他说没有了。\n但我早上才看到过。',
  characters:[],
  sanity:-5,
  next:'e25c'
},

e25c: {
  type:'effect', effect:'clear_distort',
  next:'e25d'
},

e25d: {
  type:'bg_change', bg:'livingroom', brightness:0.7, saturate:0.7,
  next:'e26'
},

e26: {
  bg:'livingroom', brightness:0.7, saturate:0.7,
  speaker:'narration', text:'回到家，我径直走向冰箱。\n打开门——牛奶还在那里。半盒，和我早上看到的一模一样。',
  characters:[{key:'linxi_anxious',pos:'center'}],
  next:'e27'
},

e27: {
  speaker:'inner', text:'他没有看错。\n他是不想让我确认他说的是不是真话。',
  characters:[{key:'linxi_anxious',pos:'center'}],
  next:'e28'
},

e28: {
  speaker:'luming', text:'回来啦？牛奶买了吗？',
  characters:[{key:'luming_smile',pos:'right'},{key:'linxi_anxious',pos:'left',dim:true}],
  next:'e29'
},

e29: {
  speaker:'linxi', text:'……你说的牛奶，冰箱里不是还有半盒吗？',
  characters:[{key:'linxi_normal',pos:'left'},{key:'luming_smile',pos:'right'}],
  next:'e30'
},

e30: {
  speaker:'luming', text:'啊？是吗？我可能没注意看。\n你看，这就是你为什么应该多休息。\n我对这种小事从来不记得。',
  characters:[{key:'luming_smile',pos:'center'},{key:'linxi_normal',pos:'left',dim:true}],
  next:'e31'
},

e31: {
  speaker:'inner', text:'他说他从来不记得这种小事。\n可是他记得盐罐不是他动的。\n他记得靠垫不是他整理的。\n他记得我没有拍过照片。\n他甚至记得我"摔碎了"我们的合照。',
  characters:[{key:'linxi_normal',pos:'center'}],
  next:'e31_choice'
},

e31_choice: {
  speaker:'narration',
  text:'矛盾在他轻描淡写的语句中，像针一样刺入我的意识。',
  characters:[{key:'linxi_normal',pos:'center'}],
  choices:[
    { text:'「你说你不记得小事——但你明明记得那些。」（指出矛盾）', sanity:10, flag:'saw_contradiction', next:'e32a' },
    { text:'「……算了，我去休息。」（回避冲突）', sanity:-8, next:'e32b' },
    { text:'拿出手机给他看冰箱里的牛奶。', sanity:12, flag:'showed_evidence', next:'e32c' }
  ]
},

e32a: {
  speaker:'linxi', text:'等一下。你说你不记得小事——\n但你明明记得盐罐不是你动的，靠垫不是你整理的。',
  characters:[{key:'linxi_normal',pos:'left'},{key:'luming_serious',pos:'right'}],
  next:'e32a2'
},

e32a2: {
  speaker:'linxi', text:'你不记得牛奶，却记得那么多「不是你做的」事？\n这不矛盾吗？',
  characters:[{key:'linxi_normal',pos:'left'},{key:'luming_serious',pos:'right'}],
  next:'e32a3'
},

e32a3: {
  speaker:'narration', text:'陆明的表情停顿了零点几秒。\n然后他笑了。笑容和往常一样温和。',
  characters:[{key:'luming_smile',pos:'center'},{key:'linxi_normal',pos:'left',dim:true}],
  next:'e32a4'
},

e32a4: {
  speaker:'luming', text:'你看你，又开始分析我了。\n我什么时候说我不记得了？我说的是可能没注意。\n林夕，你最近真的太紧张了。',
  characters:[{key:'luming_worry',pos:'center'}],
  next:'e33'
},

e32b: {
  speaker:'linxi', text:'……算了，我去休息了。有点累。',
  characters:[{key:'linxi_sad',pos:'center'},{key:'luming_smile',pos:'right',dim:true}],
  next:'e33'
},

// 新增分支：出示证据
e32c: {
  speaker:'linxi', text:'等一下。你说牛奶没有了，\n但它就在冰箱里。你来看看。',
  characters:[{key:'linxi_normal',pos:'left'},{key:'luming_smile',pos:'right'}],
  next:'e32c2'
},

e32c2: {
  speaker:'narration', text:'我打开冰箱，指给他看。\n半盒牛奶安静地躺在架子上。',
  characters:[{key:'linxi_normal',pos:'left'}],
  next:'e32c3'
},

e32c3: {
  speaker:'luming', text:'……哦。可能是昨天又买了一盒。\n我记不清了。你看，我说了我对这些小事完全不在意。',
  characters:[{key:'luming_smile',pos:'center'},{key:'linxi_normal',pos:'left',dim:true}],
  next:'e32c4'
},

e32c4: {
  speaker:'narration', text:'他又笑了。把所有证据消解成一个小小的"不在意"。\n就像水滴落入大海，荡不起任何涟漪。',
  characters:[{key:'luming_smile',pos:'center'}],
  sanity:-5,
  next:'e33'
},

e33: {
  speaker:'inner', text:'他说我太紧张了。\n他总说我太紧张了、太累了、太敏感了。\n……周围的一切好像都在印证他的话。',
  characters:[{key:'linxi_sad',pos:'center'}],
  next:'ch3'
},

// =============================================
//  第三章：暗焰
// =============================================
ch3: {
  type:'chapter', node_id:'ch3', chapter_num:'第三章', chapter_name:'暗 焰', chapter_sub:'「 你已经分不清了，对吧 」',
  next:'f1'
},

f1: {
  type:'bg_change', bg:'dark_room', brightness:0.6, saturate:0.5,
  next:'f2'
},

f2: {
  bg:'dark_room', brightness:0.6, saturate:0.5,
  speaker:'narration', text:'一个月后。\n我已经不确定什么是真实的了。',
  characters:[{key:'linxi_anxious',pos:'center'}],
  next:'f3'
},

f3: {
  speaker:'inner', text:'是盐罐先动的，还是我先记错的？\n是我弄丢了照片，还是有人删除了它？\n牛奶到底还在不在冰箱里？\n我到底有没有摔碎过那张合照？',
  characters:[{key:'linxi_anxious',pos:'center'}],
  sanity:-5,
  next:'f4'
},

f4: {
  speaker:'narration', text:'这些问题像缠绕的藤蔓，\n每一个答案都引出新的疑问。\n而陆明永远站在答案的那一端，微笑着。',
  characters:[{key:'linxi_anxious',pos:'center'}],
  next:'f5'
},

f5: {
  type:'effect', effect:'distort',
  next:'f6'
},

f6: {
  speaker:'narration', text:'这天深夜，我被一阵声响惊醒。\n客厅里有人走动的声音——很轻，但确实存在。',
  characters:[{key:'linxi_anxious',pos:'center'}],
  next:'f7'
},

f7: {
  speaker:'narration', text:'陆明就睡在旁边，呼吸均匀。\n我悄悄起身，透过门缝向外看——',
  characters:[{key:'linxi_anxious',pos:'center'}],
  next:'f8'
},

f8: {
  speaker:'narration', text:'月光下，一个影子在客厅里移动。\n它正在把书架上的书一本一本取下来，\n然后放回不同的位置。',
  characters:[],
  next:'f9'
},

f9: {
  type:'effect', effect:'shake_char',
  next:'f10'
},

f10: {
  speaker:'inner', text:'有人在动我的东西。\n在深夜。当所有人都睡着的时候。',
  characters:[],
  textEffect:'distort',
  sanity:-8,
  next:'f11'
},

f11: {
  type:'effect', effect:'stop_shake',
  next:'f12'
},

f12: {
  type:'bg_change', bg:'kitchen', brightness:0.65, saturate:0.6,
  next:'f12b'
},

f12b: {
  speaker:'narration', text:'第二天早上，我质问陆明。',
  next:'f13'
},

f13: {
  bg:'kitchen', brightness:0.65, saturate:0.6,
  speaker:'linxi', text:'昨晚客厅有声音。有人动了书架上的书。',
  characters:[{key:'linxi_anxious',pos:'left'},{key:'luming_smile',pos:'right'}],
  next:'f14'
},

f14: {
  speaker:'luming', text:'……你做梦了吧？我昨晚睡得很好，什么声音都没听到。\n你确定不是你在梦游？',
  characters:[{key:'luming_smile',pos:'center'},{key:'linxi_anxious',pos:'left',dim:true}],
  next:'f15'
},

f15: {
  speaker:'linxi', text:'我没有梦游！我看到了！\n书架上的书都被重新排列了！',
  characters:[{key:'linxi_anxious',pos:'left'},{key:'luming_serious',pos:'right'}],
  next:'f16'
},

f16: {
  speaker:'luming', text:'林夕。',
  characters:[{key:'luming_serious',pos:'center'}],
  next:'f17'
},

f17: {
  speaker:'luming', text:'你看看你现在的样子。\n失眠、幻听、偏执、记忆混乱……\n你觉得这些是正常的吗？',
  characters:[{key:'luming_serious',pos:'center'},{key:'linxi_anxious',pos:'left',dim:true}],
  next:'f18'
},

f18: {
  speaker:'luming', text:'我一直在忍着没说，因为我不想伤害你。\n但你真的需要帮助。\n不仅仅是休息，你需要专业的医生。',
  characters:[{key:'luming_worry',pos:'center'}],
  next:'f18_choice'
},

f18_choice: {
  type:'sanity_check', condition:'low', threshold:35,
  then:'f18_low', else:'f18_normal'
},

// 高理智路线
f18_normal: {
  speaker:'inner', text:'他说的每一个字都像针。\n但这一次，有什么东西在我心里亮了起来——\n很微弱，但确实存在。\n\n苏然的话回响在耳边：「相信自己的直觉。」',
  characters:[{key:'linxi_normal',pos:'center'},{key:'luming_worry',pos:'right',dim:true}],
  sanity:5,
  next:'f19_choice'
},

// 低理智路线
f18_low: {
  type:'effect', effect:'distort',
  next:'f18low2'
},

f18low2: {
  speaker:'inner', text:'也许……他说的是对的。\n也许我真的有问题。\n毕竟，所有证据都指向我自己。\n没有人站在我这边。',
  characters:[{key:'linxi_anxious',pos:'center'}],
  textEffect:'distort',
  next:'f18low3'
},

f18low3: {
  type:'effect', effect:'clear_distort',
  next:'f19_choice'
},

f19_choice: {
  speaker:'narration',
  text:'这一刻，我必须做出选择。\n这也许是最后一次，我能为自己做出决定。',
  characters:[{key:'linxi_normal',pos:'center'}],
  choices:[
    { text:'「我不需要医生。我需要的是你离开我的生活。」', sanity:15, flag:'confronted', next:'f20a' },
    { text:'「……好。我去看医生。」', sanity:-15, next:'f20b' },
    { text:'「如果我真的病了，那你为什么不离我而去？」', sanity:8, flag:'asked_why_stay', next:'f20c' },
    { text:'拿出手机，给苏然打电话。', sanity:5, flag:'called_friend', next:'f20d' }
  ]
},

f20a: {
  speaker:'narration', text:'陆明的笑容终于凝固了。\n那一刻，他的表情像一面被打碎的镜子——\n裂缝中露出了与往常截然不同的东西。',
  characters:[{key:'luming_serious',pos:'center'},{key:'linxi_normal',pos:'left'}],
  next:'f20a2'
},

f20a2: {
  speaker:'luming', text:'……你说什么？',
  characters:[{key:'luming_angry',pos:'center'}],
  next:'f20a3'
},

f20a3: {
  speaker:'linxi', text:'你听到了。我说，离开。',
  characters:[{key:'linxi_normal',pos:'left'},{key:'luming_angry',pos:'right'}],
  next:'f20a4'
},

f20a4: {
  speaker:'narration', text:'沉默。\n长久的沉默。',
  characters:[{key:'luming_serious',pos:'center'}],
  next:'f20a5'
},

f20a5: {
  speaker:'luming', text:'……行。你确定？',
  characters:[{key:'luming_serious',pos:'center'},{key:'linxi_normal',pos:'left',dim:true}],
  next:'f20a6'
},

f20a6: {
  speaker:'linxi', text:'确定。',
  characters:[{key:'linxi_normal',pos:'center'},{key:'luming_serious',pos:'right',dim:true}],
  next:'f20a7'
},

f20a7: {
  speaker:'narration', text:'他拿起外套，走向门口。\n在推开门的瞬间，他回过头。',
  characters:[{key:'luming_serious',pos:'center'}],
  next:'f20a8'
},

f20a8: {
  speaker:'luming', text:'你不会后悔的。因为很快你就会发现——\n没有我在，你连自己都照顾不好。',
  characters:[{key:'luming_angry',pos:'center'}],
  sanity:-5,
  next:'f20a9'
},

f20a9: {
  speaker:'narration', text:'门关上了。\n公寓安静了下来。',
  characters:[{key:'linxi_normal',pos:'center'}],
  next:'f20a10'
},

f20a10: {
  speaker:'inner', text:'我活下来了。\n即使我不确定我的记忆是否曾经可靠，\n但此刻的清醒，是真实的。',
  characters:[{key:'linxi_normal',pos:'center'}],
  sanity:10,
  next:'ending_check'
},

// 接受看医生 -> 沉溺路线
f20b: {
  speaker:'linxi', text:'……好。我去看医生。',
  characters:[{key:'linxi_sad',pos:'center'},{key:'luming_smile',pos:'right',dim:true}],
  next:'f20b2'
},

f20b2: {
  speaker:'luming', text:'这就对了。我会陪你去。\n放心，一切都会好起来的。',
  characters:[{key:'luming_smile',pos:'center'},{key:'linxi_sad',pos:'left',dim:true}],
  next:'f20b3'
},

f20b3: {
  speaker:'narration', text:'他拥抱了我。温暖、安全。\n但我的心像是被什么东西慢慢抽空。',
  characters:[{key:'luming_smile',pos:'center'}],
  next:'f20b4'
},

f20b4: {
  type:'effect', effect:'distort',
  next:'f20b5'
},

f20b5: {
  speaker:'inner', text:'我不再确定这是温暖。\n还是牢笼。',
  characters:[],
  textEffect:'distort',
  sanity:-5,
  next:'f20b6'
},

f20b6: {
  type:'effect', effect:'clear_distort',
  next:'ending_check'
},

// 反问"为什么不离开我" -> 觉醒路线前置
f20c: {
  speaker:'linxi', text:'如果我真的病了，像你说的那样……\n那你为什么不离开我？',
  characters:[{key:'linxi_normal',pos:'left'},{key:'luming_worry',pos:'right'}],
  next:'f20c2'
},

f20c2: {
  speaker:'luming', text:'……因为我爱你。不管你变成什么样。',
  characters:[{key:'luming_worry',pos:'center'},{key:'linxi_normal',pos:'left',dim:true}],
  next:'f20c3'
},

f20c3: {
  speaker:'inner', text:'「因为我爱你。」\n这句话听起来像是答案。\n但更像是一把钥匙——\n一把锁住我的钥匙。',
  characters:[{key:'linxi_normal',pos:'center'}],
  next:'f20c4'
},

f20c4: {
  speaker:'narration', text:'我没有再说任何话。\n但那句话种在了我心里。\n一颗种子，在黑暗中发芽。',
  characters:[{key:'linxi_normal',pos:'center'}],
  sanity:3,
  next:'ending_check'
},

// 新增分支：打电话给苏然 -> 觉醒结局路线
f20d: {
  speaker:'narration', text:'我掏出手机，拨通了苏然的号码。\n陆明的表情瞬间变了。',
  characters:[{key:'linxi_normal',pos:'left'},{key:'luming_serious',pos:'right'}],
  next:'f20d2'
},

f20d2: {
  speaker:'luming', text:'你在干什么？你在给谁打电话？',
  characters:[{key:'luming_serious',pos:'center'}],
  next:'f20d3'
},

f20d3: {
  speaker:'linxi', text:'我在给我的朋友打电话。\n这很正常吧？还是说……你不允许？',
  characters:[{key:'linxi_normal',pos:'left'},{key:'luming_angry',pos:'right'}],
  sanity:5,
  next:'f20d4'
},

f20d4: {
  speaker:'narration', text:'电话接通了。苏然的声音从听筒里传来。\n「喂？林夕？怎么了？」',
  characters:[],
  next:'f20d5'
},

f20d5: {
  speaker:'linxi', text:'苏然……你之前问我的那个问题——\n「他对我做了什么」。\n我想我知道答案了。',
  characters:[{key:'linxi_normal',pos:'center'}],
  sanity:15,
  flag:'awakened',
  next:'ending_check'
},

// =============================================
//  结局判定（5结局系统）
// =============================================
ending_check: {
  type:'sanity_check', condition:'low', threshold:30,
  then:'ending_bad', else:'ending_mid_check'
},

ending_mid_check: {
  type:'sanity_check', condition:'low', threshold:50,
  then:'ending_normal', else:'ending_high_check'
},

ending_high_check: {
  // 高理智 + 觉醒flag -> 觉醒结局
  type:'flag_check', flag:'awakened',
  then:'ending_awaken', else:'ending_good'
},

// ===== 结局1：破晓（好结局）=====
ending_good: {
  type:'ending', ending_id:'good',
  title:'破 晓',
  desc:'林夕在迷雾中找到了自己的锚。\n她认清了那些温柔的谎言背后，是一个试图控制她的人。\n离开不是结束——是重新开始的勇气。\n\n煤气灯效应的受害者需要明白：你的感知是真实的。\n当有人不断否认你的现实，那不是你疯了——\n而是有人希望你以为自己疯了。'
},

// ===== 结局2：觉醒（最佳结局）=====
ending_awaken: {
  type:'ending', ending_id:'awaken',
  title:'觉 醒',
  desc:'在最黑暗的时刻，林夕拨通了那通电话。\n那一小步，打破了操控的闭环。\n\n苏然后来告诉她：煤气灯效应不是一夜之间发生的，\n是一点一滴、一句一句地侵蚀。\n但只要还有一个人愿意听你说、相信你的感受——\n暗焰就无法吞噬全部的光。\n\n你不是一个人。'
},

// ===== 结局3：余烬（普通结局）=====
ending_normal: {
  type:'ending', ending_id:'normal',
  title:'余 烬',
  desc:'林夕意识到了什么不对，但还无法完全挣脱。\n真相像余烬一样在灰暗里微微发光。\n也许明天，也许下个月——\n她会找到走出迷宫的出口。\n\n心理学告诉我们：从煤气灯效应中恢复需要时间和支持。\n第一步，是允许自己相信自己的感受。'
},

// ===== 结局4：暗焰（坏结局）=====
ending_bad: {
  type:'ending', ending_id:'bad',
  title:'暗 焰',
  desc:'她不再确定任何事情。\n她的记忆、她的判断、她的自我——\n都被一句句「你是不是太紧张了」消磨殆尽。\n\n这就是煤气灯效应最可怕的地方：\n它不需要暴力，不需要威胁。\n只需要一个人反复告诉你——「你错了」。\n直到你相信为止。'
},

// ===== 结局5：沉溺（最坏结局，理智极低且接受看医生）=====
ending_sunk: {
  type:'ending', ending_id:'sunk',
  title:'沉 溺',
  desc:'林夕走进了医院的大门。\n医生说她的焦虑和记忆问题可能是压力导致的。\n但真正的病因，每天晚上都陪她回家。\n\n他把诊断结果举在手里，像举着一面盾牌：\n「你看，医生说你确实有问题。」\n\n从此以后，每一个质疑都会被一句话挡回去：\n「你的医生怎么说？」\n\n她再也没有走出那个家门。'
},

// =============================================
//  第四章：破壳（隐藏章节，通关后解锁）
// =============================================
ch4: {
  type:'chapter', node_id:'ch4', chapter_num:'第四章', chapter_name:'破 壳', chapter_sub:'「 我还记得什么 」',
  next:'g1'
},

g1: {
  type:'bg_change', bg:'cafe', brightness:0.7, saturate:0.7,
  next:'g2'
},

g2: {
  bg:'cafe', brightness:0.7, saturate:0.7,
  speaker:'narration', text:'三个月后。一家安静的咖啡馆。\n林夕坐在窗边，面前的咖啡已经凉了。',
  characters:[{key:'linxi_normal',pos:'center'}],
  next:'g3'
},

g3: {
  speaker:'narration', text:'她离开了那间公寓。\n离开了那个每天告诉她"你记错了"的人。\n但有些东西还留在她脑子里——\n像碎玻璃一样，偶尔在某个瞬间刺痛她。',
  characters:[{key:'linxi_normal',pos:'center'}],
  next:'g4'
},

g4: {
  speaker:'inner', text:'「你太敏感了。」\n「你确定吗？」\n「我在乎你才会这样说。」\n\n这些话还在回响。即使他已经不在身边了。',
  characters:[{key:'linxi_sad',pos:'center'}],
  next:'g5'
},

g5: {
  speaker:'narration', text:'苏然推开咖啡馆的门走了进来。\n看到林夕，她笑了笑，坐到对面。',
  characters:[{key:'linxi_normal',pos:'left'},{key:'luming_smile',pos:'right',dim:true}],
  next:'g6'
},

g6: {
  speaker:'narration', text:'不对——对面是苏然，不是陆明。\n我的记忆又在欺骗我了。',
  characters:[{key:'linxi_normal',pos:'center'}],
  sanity:-3,
  next:'g7'
},

g7: {
  speaker:'narration', text:'「最近还好吗？」苏然问。\n「比以前好。」林夕说。',
  characters:[{key:'linxi_normal',pos:'center'}],
  next:'g8'
},

g8: {
  speaker:'narration', text:'沉默了一会儿。\n然后林夕说了一句话——一句她在那间公寓里永远不会说出的话。',
  characters:[{key:'linxi_normal',pos:'center'}],
  next:'g9'
},

g9: {
  speaker:'linxi', text:'苏然……你能不能告诉我，\n在盐罐的事情之前，我是什么样的？',
  characters:[{key:'linxi_normal',pos:'center'}],
  next:'g10'
},

g10: {
  speaker:'narration', text:'苏然看着她，眼神很认真。',
  characters:[{key:'linxi_normal',pos:'center'}],
  next:'g11'
},

g11: {
  speaker:'narration', text:'「你以前是那种——\n 会在超市发现标价错误就去找负责人理论的人。\n 会在会议上直接指出数据不对的人。\n 会在朋友说\u2018没事\u2019的时候追问\u2018真的没事吗\u2019的人。」',
  characters:[{key:'linxi_normal',pos:'center'}],
  next:'g12'
},

g12: {
  speaker:'narration', text:'「你以前从不怀疑自己。\n 因为你对自己有一种……确定感。」',
  characters:[{key:'linxi_normal',pos:'center'}],
  next:'g13'
},

g13: {
  speaker:'inner', text:'确定感。\n\n那是什么感觉？\n我已经不太记得了。\n但它好像正在回来。',
  characters:[{key:'linxi_normal',pos:'center'}],
  sanity:10,
  next:'g14'
},

g14: {
  speaker:'narration', text:'窗外的阳光照进来，照在已经凉掉的咖啡上。\n蒸气早就散了。\n但杯子还在那里。',
  characters:[{key:'linxi_normal',pos:'center'}],
  next:'g15'
},

g15: {
  speaker:'inner', text:'也许恢复就是这样的。\n不是一夜之间重新变成那个"以前的自己"。\n而是慢慢找回——\n那种对自己的确定感。',
  characters:[{key:'linxi_normal',pos:'center'}],
  sanity:5,
  next:'g16'
},

g16: {
  speaker:'narration', text:'林夕端起咖啡，喝了一口。\n凉的。\n但还能喝。\n\n她笑了。',
  characters:[{key:'linxi_normal',pos:'center'}],
  next:'g17'
},

g17: {
  type:'sanity_check', condition:'low', threshold:60,
  then:'ending_truth', else:'g18'
},

g18: {
  type:'bg_change', bg:'park', brightness:0.9, saturate:1,
  next:'g19'
},

g19: {
  bg:'park', brightness:0.9, saturate:1,
  speaker:'narration', text:'走出咖啡馆的时候，林夕收到了一条消息。\n不是陆明的。\n是她妈妈发来的。',
  characters:[{key:'linxi_normal',pos:'center'}],
  next:'g20'
},

g20: {
  speaker:'narration', text:'「夕夕，周末回家吃饭吧。\n 妈做了你爱吃的红烧排骨。」',
  characters:[{key:'linxi_normal',pos:'center'}],
  next:'g21'
},

g21: {
  speaker:'narration', text:'没有操控。没有否定。\n只是——有人想见她。',
  characters:[{key:'linxi_normal',pos:'center'}],
  next:'g22'
},

g22: {
  speaker:'linxi', text:'好的，妈。\n我周六到。',
  characters:[{key:'linxi_normal',pos:'center'}],
  sanity:5,
  next:'g23'
},

g23: {
  speaker:'narration', text:'她收起手机，走进了秋天的阳光里。\n影子在身后被拉得很长。\n但这一次，是她在往前走。',
  characters:[{key:'linxi_normal',pos:'center'}],
  next:'g24_choice'
},

g24_choice: {
  speaker:'narration',
  text:'走在回去的路上，林夕想起了什么。',
  characters:[{key:'linxi_normal',pos:'center'}],
  choices:[
    { text:'「我已经不是以前的我了。但也许，我正在成为新的我。」', sanity:10, flag:'accepted_self', next:'ending_truth' },
    { text:'「总有一天，我会完全好起来。」', sanity:5, next:'ending_rebuild' }
  ]
},

// ===== 结局6：真相（隐藏结局，第四章 + 高理智）=====
ending_truth: {
  type:'ending', ending_id:'truth',
  title:'真 相',
  desc:'林夕重新找回了对自己的确定感。\n不是回到从前——而是成为一个更清醒的自己。\n\n她终于理解了一件事：\n煤气灯效应不是关于谁赢了谁输了。\n它是关于——你有没有勇气承认：\n「我的感受是真实的，即使全世界都说不是。」\n\n真相从来不在别人嘴里。\n它一直在你自己心里。'
},

// ===== 结局7：重建（第四章 + 中等理智）=====
ending_rebuild: {
  type:'ending', ending_id:'rebuild',
  title:'重 建',
  desc:'林夕走在回家的路上。\n所谓的"回家"——不再是那间公寓。\n而是她自己。\n\n恢复不是一条直线。\n有些日子她会怀疑自己。\n有些日子她会想起他的话。\n但她学会了最重要的东西：\n\n当怀疑升起时，不再问"是不是我的问题"，\n而是问——"这件事本身，对不对？"\n\n这就是重建的开始。'
}

}; // SCRIPT end

/* ===== 启动游戏 ===== */
window.startGame = async function(){
  sfxClick();
  loadProgress();
  titleScreen.style.opacity = '0';
  titleScreen.style.transition = 'opacity 1s ease';
  setTimeout(() => {
    titleScreen.style.display = 'none';
    state.started = true;
    state.currentNode = 'prologue';
    processNode(state.currentNode);
    // 初始成就检查
    checkAchievements();
  }, 1000);
  initParticles();
};

/* ===== ESC 暂停/退出菜单 ===== */
function showPauseMenu(){
  state.paused = true;
  clearTimeout(state.typewriterTimer);
  state.typing = false;
  let menu = document.getElementById('pause-menu');
  if(!menu){
    menu = document.createElement('div');
    menu.id = 'pause-menu';
    document.getElementById('game-container').appendChild(menu);
  }
  // 构建菜单内容
  let html = `<div class="pause-content">
    <div class="pause-title">游戏暂停</div>
    <button class="pause-btn" id="pause-resume">继续游戏</button>
    <button class="pause-btn" id="pause-restart">重新开始</button>
    <button class="pause-btn" id="pause-quit">返回标题</button>
    <div class="pause-divider"></div>
    <div class="pause-section-title">章节选择</div>
    <div class="pause-chapters">`;

  CHAPTERS.forEach(ch => {
    const unlocked = state.unlockedChapters.includes(ch.id);
    const isCurrent = state.currentChapter === ch.id;
    html += `<div class="pause-chapter-btn${unlocked ? ' unlocked' : ''}${isCurrent ? ' current' : ''}" data-chapter="${ch.node}">
      ${ch.num} · ${ch.name}
      <span class="chapter-sub">${ch.sub}</span>
    </div>`;
  });

  html += `</div>
    <div class="pause-divider"></div>
    <button class="pause-btn pause-achievements-btn" id="pause-ach">成就 · ${state.achievements.length}/${ACHIEVEMENTS.length}</button>
  </div>`;

  menu.innerHTML = html;
  menu.classList.add('active');

  // 绑定事件
  document.getElementById('pause-resume').onclick = () => { hidePauseMenu(); if(state.fullText) finishTyping(); };
  document.getElementById('pause-restart').onclick = () => { hidePauseMenu(); location.reload(); };
  document.getElementById('pause-quit').onclick = () => {
    hidePauseMenu(); resetToTitle();
  };
  document.querySelectorAll('.pause-chapter-btn.unlocked').forEach(btn => {
    btn.onclick = () => {
      const chapterNode = btn.dataset.chapter;
      hidePauseMenu();
      jumpToChapter(chapterNode);
    };
  });
  document.getElementById('pause-ach').onclick = () => {
    showAchievementPanel();
  };
}

function resetToTitle(){
  endingScreen.classList.remove('active');
  sanityHud.classList.remove('visible');
  hideAllCharacters();
  dialogText.innerHTML = '';
  speakerName.textContent = '';
  speakerName.className = '';
  clickIndicator.classList.remove('visible');
  choiceLayer.classList.remove('active');
  state.choiceLocked = false;
  distortionOvl.classList.remove('active');
  state.paused = false;
  state.started = false;
  state.sanity = 100;
  state.currentChapter = '';
  sanityBar.style.width = '100%';
  sanityBar.style.background = 'linear-gradient(90deg, #6eb8ff, #a088ff)';
  sanityValue.textContent = '100';
  titleScreen.style.display = 'flex';
  titleScreen.style.opacity = '1';
}

async function jumpToChapter(chapterNode){
  state.currentNode = chapterNode;
  state.choiceLocked = false;
  state.typing = false;
  hideAllCharacters();
  clickIndicator.classList.remove('visible');
  choiceLayer.classList.remove('active');
  await fadeTransition(600);
  processNode(chapterNode);
}

/* ===== 成就面板 ===== */
function showAchievementPanel(){
  let panel = document.getElementById('achievement-panel');
  if(!panel){
    panel = document.createElement('div');
    panel.id = 'achievement-panel';
    document.getElementById('game-container').appendChild(panel);
  }
  let html = `<div class="ach-content">
    <div class="ach-title">成就 · ${state.achievements.length}/${ACHIEVEMENTS.length}</div>
    <div class="ach-grid">`;

  ACHIEVEMENTS.forEach(a => {
    const unlocked = state.achievements.includes(a.id);
    html += `<div class="ach-item${unlocked ? ' unlocked' : ''}">
      <div class="ach-icon">${unlocked ? a.icon : '?'}</div>
      <div>
        <div class="ach-name">${unlocked ? a.name : '???'}</div>
        <div class="ach-desc">${unlocked ? a.desc : '尚未解锁'}</div>
      </div>
    </div>`;
  });

  html += `</div><button class="ach-back" id="ach-back">返回</button></div>`;
  panel.innerHTML = html;
  panel.classList.add('active');
  document.getElementById('ach-back').onclick = () => {
    panel.classList.remove('active');
    document.getElementById('pause-menu').classList.add('active');
  };
}

function hidePauseMenu(){
  state.paused = false;
  const menu = document.getElementById('pause-menu');
  if(menu) menu.classList.remove('active');
}

/* ===== 键盘支持 ===== */
document.addEventListener('keydown', e => {
  // ESC 键：暂停/退出
  if(e.key === 'Escape'){
    e.preventDefault();
    if(state.started && !state.paused){
      showPauseMenu();
    } else if(state.paused){
      hidePauseMenu();
    }
    return;
  }
  // 游戏暂停时不响应其他键
  if(state.paused) return;
  if(e.key === 'Enter' || e.key === ' '){
    e.preventDefault();
    if(!choiceLayer.classList.contains('active')){
      advanceDialog();
    }
  }
});

/* ===== 窗口调整 ===== */
window.addEventListener('resize', () => {
  particlesCanvas.width = window.innerWidth;
  particlesCanvas.height = window.innerHeight;
});

/* ===== 绑定按钮事件（替代 inline onclick） ===== */
document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('dialog-box').addEventListener('click', function(e){
  advanceDialog();
});
document.getElementById('ending-restart').addEventListener('click', function(){
  location.reload();
});

})();
