/* 不三迁 · 学生端逻辑（完整版）
   集成：场景引擎 + 兴趣引擎 + 游戏桥接 + 健康守护 + 安全引擎 + 性格演化 + 苏格拉底7状态机 + 间隔重复 + 记忆系统
*/

initSharedData();

/* ===== DOM 引用 ===== */
const video = document.getElementById('camera');
const canvas = document.getElementById('camera-canvas');
const ctx = canvas.getContext('2d');
const modelStatus = document.getElementById('model-status');
const fpsEl = document.getElementById('fps');
const detectedCard = document.getElementById('detected-card');
const detectedNameEl = document.getElementById('detected-name');
const detectedBridgeEl = document.getElementById('detected-bridge');
const toggleBtn = document.getElementById('toggle-camera');
const captureProblemBtn = document.getElementById('capture-problem');
const chatList = document.getElementById('chat-list');
const voiceBtn = document.getElementById('voice-btn');
const voiceHint = document.getElementById('voice-hint');
const sceneBadge = document.getElementById('scene-badge');
const sceneState = document.getElementById('scene-state');
const sceneFocus = document.getElementById('scene-focus');
const sceneMeta = document.getElementById('scene-meta');
const interestBridgeDiv = document.getElementById('interest-bridge');
const interestBridgeText = document.getElementById('interest-bridge-text');
const healthCard = document.getElementById('health-card');
const healthContent = document.getElementById('health-content');
const gameBridgeCard = document.getElementById('game-bridge-card');
const gameSessionInfo = document.getElementById('game-session-info');
const gameBridgeChat = document.getElementById('game-bridge-chat');

let model = null;
let stream = null;
let isCameraOn = false;
let lastDetectedClass = null;
let lastDetectionTime = 0;
let currentSceneState = 'TRANSITION';
let focusTimer = null;

/* ===== 场景状态栏更新 ===== */
function updateSceneBar() {
  const stateInfo = SceneEngine.states[currentSceneState];
  sceneBadge.textContent = getSceneLabel();
  sceneState.textContent = stateInfo ? stateInfo.name : '未知';
  const focusMin = HealthGuardian.checkFocus();
  sceneFocus.textContent = focusMin ? `专注 ${focusMin.elapsed}min` : '专注 0min';

  const canResult = SceneEngine.canIntervene(currentSceneState);
  if (canResult.can) {
    sceneMeta.textContent = '搭子可以主动发起话题';
    sceneMeta.style.color = 'var(--sage)';
  } else {
    sceneMeta.textContent = canResult.reason;
    sceneMeta.style.color = 'var(--muted)';
  }
}

function getSceneLabel() {
  if (isCameraOn) return '探索中';
  if (guideSession) return '学习中';
  if (gameSession) return '游戏中';
  return '通勤中';
}

/* ===== 摄像头与物体识别 ===== */
async function loadModel() {
  modelStatus.textContent = '加载模型中…';
  try {
    model = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
    modelStatus.textContent = '模型就绪';
  } catch (e) {
    modelStatus.textContent = '模型加载失败';
  }
}

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    video.srcObject = stream;
    isCameraOn = true;
    toggleBtn.textContent = '关闭摄像头';
    currentSceneState = 'LIGHT_TASK';
    SceneEngine.updateSignal('cameraActivity', 'detecting');  // ★ 接入场景引擎
    HealthGuardian.startFocus();
    startHealthCheck();
    updateSceneBar();
    updateSceneInteractionPanel();
    detectLoop();
  } catch (e) {
    alert('无法访问摄像头：' + e.message);
  }
}

function stopCamera() {
  if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
  video.srcObject = null;
  isCameraOn = false;
  toggleBtn.textContent = '开启摄像头';
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  detectedCard.style.display = 'none';
  captureProblemBtn.style.display = 'none';
  interestBridgeDiv.style.display = 'none';
  HealthGuardian.endFocus();
  stopHealthCheck();
  currentSceneState = 'TRANSITION';
  SceneEngine.updateSignal('cameraActivity', 'idle');  // ★ 接入场景引擎
  updateSceneBar();
  updateSceneInteractionPanel();
}

toggleBtn.addEventListener('click', () => { if (isCameraOn) stopCamera(); else startCamera(); });

async function detectLoop() {
  if (!isCameraOn) return;
  // 即使模型未加载，也把视频帧绘制到canvas，保证画面可见
  if (video.readyState === 4) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    // 仅在模型就绪时做检测
    if (model) {
      const start = performance.now();
      const predictions = await model.detect(video);
      fpsEl.textContent = Math.round(1000 / (performance.now() - start + 1)) + ' FPS';
      let best = null;
      predictions.forEach(p => { if (!best || p.score > best.score) best = p; drawBox(p); });

      const now = Date.now();
      if (best && best.score > 0.6 && now - lastDetectionTime > 5000) {
        handleDetection(best);
        lastDetectionTime = now;
      }
    } else {
      fpsEl.textContent = '模型加载中';
    }
  }
  requestAnimationFrame(detectLoop);
}

function handleDetection(pred) {
  const graphResult = KnowledgeGraph.query(pred.class);
  if (!graphResult) return;

  // 场景引擎判断
  const canResult = SceneEngine.canIntervene(currentSceneState);
  if (!canResult.can) return;

  // 内容选择：从知识点中选最优
  let bestKnowledge = null;
  let bestScore = 0;
  graphResult.knowledgePoints.forEach(kp => {
    const score = SceneEngine.scoreKnowledge(kp, pred.class, StudentProfile);
    if (score > bestScore) { bestScore = score; bestKnowledge = kp; }
  });

  if (!bestKnowledge) return;

  // 参与度预测
  const action = SceneEngine.predictEngagement(currentSceneState, bestKnowledge.name);
  if (action === 'SKIP') return;

  // 兴趣桥接
  const interestKey = StudentProfile.interests[0];
  const bridged = KnowledgeGraph.bridgeWithInterest(pred.class, interestKey);

  lastDetectedClass = pred.class;
  detectedNameEl.textContent = graphResult.entity;
  detectedBridgeEl.textContent = bestKnowledge.detail?.desc || bestKnowledge.name;

  // 显示兴趣桥接
  if (bridged && bridged.bridges) {
    const bridgeEntry = Object.entries(bridged.bridges)[0];
    interestBridgeDiv.style.display = 'block';
    interestBridgeText.textContent = `${bridged.interestBridge}：${bridgeEntry[0]} → ${bridgeEntry[1]}`;
  }

  // 生成话术
  const style = Personality.getStyle();
  let speech = generateSceneSpeech(graphResult.entity, bestKnowledge, bridged, action, style);

  if (action === 'WHISPER') {
    speech = '顺便提一下，' + speech;
  }

  detectedCard.style.display = 'block';
  speak(speech);
  addChatBubble('ai', speech);

  // 摄像头识题：识别到书本/笔记本/手机时显示"识别题目"按钮
  const problemEntities = {
    'book': '一辆汽车以 60km/h 的速度行驶 2 小时，走了多少千米？',
    'laptop': '一个长方形的长是 8cm，宽是 5cm，它的面积和周长分别是多少？',
    'cell phone': '鸡兔同笼，共有头 35 个，脚 94 只，问鸡和兔各有多少只？'
  };
  if (problemEntities[pred.class]) {
    captureProblemBtn.style.display = 'block';
    captureProblemBtn.dataset.sample = problemEntities[pred.class];
  } else {
    captureProblemBtn.style.display = 'none';
  }

  // 记录到记忆系统
  Memory.addEpisode({
    scene: getSceneLabel(),
    topic: graphResult.entity,
    knowledge: bestKnowledge.name,
    response: 'neutral',
    emotion: 'curious',
    followUp: false
  });

  // 加入间隔重复队列
  SpacedRepetition.add(bestKnowledge.name, getSceneLabel());

  // 记录干预
  SceneEngine.recordIntervention('neutral');

  // 更新场景栏
  updateSceneBar();
  renderSpacedRepetition();
  renderPersonality();
}

function generateSceneSpeech(entityName, knowledge, bridged, action, style) {
  const desc = knowledge.detail?.desc || '';
  const subject = knowledge.detail?.subject || '';
  const weakBoost = StudentProfile.weakSubjects.includes(subject);

  let speech = '';
  if (style === 'playful') {
    speech = `嘿，我看到${entityName}了！`;
  } else if (style === 'curious') {
    speech = `诶，你知道${entityName}背后藏着一个有趣的知识吗？`;
  } else {
    speech = `我看到${entityName}了。`;
  }

  if (bridged && bridged.bridges) {
    const bridgeEntry = Object.entries(bridged.bridges)[0];
    speech += `你玩的${bridged.interestBridge}里的${bridgeEntry[0]}，其实就对应${bridgeEntry[1]}。`;
  }

  speech += desc;

  if (weakBoost) {
    speech += `这个知识点正好是你${subject}里可以加强的部分哦。`;
  }

  if (action === 'ENGAGE') {
    speech += '你觉得有趣吗？想深入聊聊吗？';
  }

  return speech;
}

function drawBox(pred) {
  const [x, y, w, h] = pred.bbox;
  ctx.strokeStyle = '#D4856B';
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = '#D4856B';
  ctx.font = '16px sans-serif';
  ctx.fillText(`${pred.class} ${Math.round(pred.score * 100)}%`, x, y > 20 ? y - 6 : y + 18);
}

/* ===== 摄像头识题 ===== */
captureProblemBtn.addEventListener('click', () => {
  const sample = captureProblemBtn.dataset.sample || '请把题目贴在这里';
  problemText.value = sample;
  document.getElementById('study-problem-input').scrollIntoView({ behavior: 'smooth', block: 'center' });
  speak('已识别题目，你可以修改后点击开始引导我思考。');
  addChatBubble('ai', '已识别题目，你可以修改后点击"开始引导我思考"。');
});

/* ===== 健康守护 ===== */
function startHealthCheck() {
  stopHealthCheck();
  focusTimer = setInterval(() => {
    const result = HealthGuardian.checkFocus();
    if (result && result.shouldRest) {
      healthCard.style.display = 'block';
      healthContent.innerHTML = `
        <div class="alert">
          <div class="alert-title">该休息啦！</div>
          <div class="alert-text">你已经连续专注 ${result.elapsed} 分钟了，站起来活动一下吧～</div>
        </div>
        <button class="btn btn-sage" style="width:100%;margin-top:8px;" onclick="dismissHealthReminder()">好的，休息一下</button>
      `;
      speak(`你已经连续专注${result.elapsed}分钟了，站起来活动一下吧！`);
      HealthGuardian.restReminders++;
      HealthGuardian.endFocus();
      currentSceneState = 'TRANSITION';
      updateSceneBar();
    } else if (result) {
      healthCard.style.display = 'block';
      healthContent.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:0.85rem;">连续专注 <strong style="color:var(--sage);">${result.elapsed}</strong> 分钟</span>
          <span style="font-size:0.75rem;color:var(--muted);">建议每40分钟休息</span>
        </div>
        <div class="progress-track" style="margin-top:8px;">
          <div class="progress-fill" style="width:${Math.min(100, result.elapsed/40*100)}%;background:var(--sage);"></div>
        </div>
      `;
      // ★ 接入场景引擎：更新专注时长
      SceneEngine.updateSignal('focusMinutes', result.elapsed);
      updateSceneInteractionPanel();
    }
    updateSceneBar();
  }, 5000);
}

function stopHealthCheck() {
  if (focusTimer) { clearInterval(focusTimer); focusTimer = null; }
}

function dismissHealthReminder() {
  healthCard.style.display = 'none';
  HealthGuardian.startFocus();
  currentSceneState = 'LIGHT_TASK';
  updateSceneBar();
}

/* ===== 苏格拉底式学习引导（7状态机 + 脚手架 + 误解检测） ===== */
const problemInputDiv = document.getElementById('study-problem-input');
const studyGuideDiv = document.getElementById('study-guide');
const problemText = document.getElementById('problem-text');
const startGuideBtn = document.getElementById('start-guide');
const guideChat = document.getElementById('guide-chat');
const guideInput = document.getElementById('guide-input');
const guideSend = document.getElementById('guide-send');
const giveHintBtn = document.getElementById('give-hint');
const endGuideBtn = document.getElementById('end-guide');
const guideStatusText = document.getElementById('guide-status-text');
const stuckTimerEl = document.getElementById('stuck-timer');
const scaffoldLevelDiv = document.getElementById('scaffold-level');

let guideSession = null;
let stuckTimerInterval = null;
let lastAnswerTime = 0;

const GUIDE_STATES = {
  INIT: 'INIT', PROBE: 'PROBE', GUIDE: 'GUIDE',
  HINT: 'HINT', VERIFY: 'VERIFY', REINFORCE: 'REINFORCE', CLOSE: 'CLOSE'
};

const stateLabels = {
  INIT: '初始化', PROBE: '探索思路', GUIDE: '引导推理',
  HINT: '提供提示', VERIFY: '验证答案', REINFORCE: '举一反三', CLOSE: '结束'
};

function detectProblemType(text) {
  const t = text.toLowerCase();
  if (/速度|时间|路程|距离|相遇|追及|km|小时|分钟/.test(t)) return 'motion';
  if (/面积|周长|边长|体积|底|高|长|宽/.test(t)) return 'geometry';
  if (/鸡兔|同笼|假设|方程|元/.test(t)) return 'equation';
  if (/浓度|溶液|盐水|糖/.test(t)) return 'concentration';
  if (/利润|打折|原价|现价/.test(t)) return 'commerce';
  return 'general';
}

function getStatePrompt(state, type, scaffoldLevel, misconception) {
  const prompts = {
    [GUIDE_STATES.INIT]: { motion: '这是一道路程问题。先别急着算，你能用自己的话告诉我：题目想让我们求什么吗？' },
    [GUIDE_STATES.PROBE]: {
      motion: '很好。那题目里给了我们哪些数字？哪些是速度，哪些是时间？',
      geometry: '很好。那题目给了我们哪些具体数据？',
      equation: '很好。那我们可以把哪个未知量设为 x？',
      concentration: '很好。混合前后，什么量是不变的？',
      commerce: '很好。现价、原价、折扣之间有什么关系？',
      general: '很好。那题目里有哪些已知条件？请一条条列出来。'
    },
    [GUIDE_STATES.GUIDE]: {
      motion: '现在我们有速度和时间了。路程、速度、时间三者之间有什么关系？试着写出公式。',
      geometry: '知道了图形和条件，你想用什么公式把它们联系起来？',
      equation: '根据你列的等式，下一步应该怎么解？',
      concentration: '浓度 = 溶质 ÷ 溶液。你能用这个关系列算式吗？',
      commerce: '现价 = 原价 × 折扣。你能算出现价或原价吗？',
      general: '这些已知条件和问题之间，可以用什么关系连起来？'
    },
    [GUIDE_STATES.HINT]: {
      motion: '提示：路程 = 速度 × 时间。把数字代进去试试。',
      geometry: '提示：回忆一下相关公式，比如面积 = 长 × 宽。',
      equation: '提示：试试把等式两边同时减去某个数。',
      concentration: '提示：溶质质量不变，溶液质量变了。',
      commerce: '提示：打折就是原价乘以折扣比例。',
      general: '提示：把已知条件和问题用等号连起来。'
    },
    [GUIDE_STATES.VERIFY]: {
      motion: '你算出的答案合理吗？60km/h 走 2 小时应该是 120km 左右，你的答案在这个范围吗？',
      geometry: '你算出的结果符合图形性质吗？边长是正数吗？',
      equation: '把答案代回原来的等式，看看左右两边是否相等？',
      concentration: '混合后的浓度应该介于两种溶液之间，你的答案满足吗？',
      commerce: '打八折后现价应该比原价低，你的答案符合吗？',
      general: '你得到的答案合理吗？能用另一种方法验证吗？'
    },
    [GUIDE_STATES.REINFORCE]: {
      motion: '很棒！如果汽车再走 1 小时，总路程是多少？',
      geometry: '很好！如果边长变为 2 倍，面积会怎么变？',
      equation: '很好！如果条件变一下，你还会列方程吗？',
      concentration: '很好！如果再加入水稀释，浓度会怎么变？',
      commerce: '很好！如果商家想赚 20% 利润，定价应该是多少？',
      general: '很好！如果题目条件改一点点，你还能解决吗？'
    }
  };

  let prompt = prompts[state]?.[type] || prompts[state]?.general || '继续想想看。';

  // 脚手架层级调整
  if (scaffoldLevel === 'L1') {
    prompt = '用一个类比来想：' + prompt;
  } else if (scaffoldLevel === 'L2') {
    prompt = '我给你第一步：' + prompt;
  } else if (scaffoldLevel === 'L3') {
    prompt = '试试这个方法：' + prompt;
  } else if (scaffoldLevel === 'L4') {
    prompt = '我给你一个框架，你来填：' + prompt;
  }

  // 误解纠正
  if (misconception) {
    prompt = `我注意到你的思路里有个常见误区——${misconception.type}。` + prompt;
  }

  return prompt;
}

function addGuideBubble(role, text) {
  const div = document.createElement('div');
  div.className = `chat-bubble ${role}`;
  div.textContent = text;
  guideChat.appendChild(div);
  guideChat.scrollTop = guideChat.scrollHeight;
}

function updateScaffoldDisplay(level) {
  const info = SocraticDM.scaffoldLevels[level];
  if (info) {
    scaffoldLevelDiv.innerHTML = `<span class="tag tag-accent">${level} · ${info.name}</span> <span style="font-size:0.78rem;color:var(--muted);">${info.strategy}</span>`;
  }
}

function startGuideSession() {
  const problem = problemText.value.trim();
  if (!problem) { alert('请先输入一道题目哦'); return; }

  const type = detectProblemType(problem);
  guideSession = {
    problem, type,
    state: GUIDE_STATES.INIT,
    stuckCount: 0,
    hintsGiven: 0,
    correctStreak: 0,
    mastery: 0.3
  };

  problemInputDiv.style.display = 'none';
  studyGuideDiv.style.display = 'block';
  guideChat.innerHTML = '';
  currentSceneState = 'DEEP_FOCUS';
  SceneEngine.updateSignal('cameraActivity', 'learning');  // ★ 接入场景引擎
  HealthGuardian.startFocus();
  startHealthCheck();
  updateSceneBar();
  updateSceneInteractionPanel();

  addGuideBubble('ai', `好，我们一起看这道题：\n${problem}`);
  guideSession.state = GUIDE_STATES.PROBE;
  guideStatusText.textContent = `引导中：${stateLabels[GUIDE_STATES.PROBE]}`;
  updateScaffoldDisplay('L0');

  setTimeout(() => {
    const prompt = getStatePrompt(GUIDE_STATES.PROBE, type, 'L0', null);
    addGuideBubble('ai', prompt);
    speak(prompt);
    resetStuckTimer();
  }, 400);
}

function advanceGuide(userText) {
  if (!guideSession) return;
  addGuideBubble('user', userText);
  resetStuckTimer();

  // 检测误解
  const misconception = SocraticDM.detectMisconception(userText);

  // 判断回答质量
  const isCorrect = assessAnswer(userText, guideSession);
  const isPartial = assessPartial(userText, guideSession);

  const { state, type, stuckCount } = guideSession;

  if (state === GUIDE_STATES.CLOSE) return;

  // 状态转移
  if (state === GUIDE_STATES.PROBE) {
    if (isCorrect || isPartial) {
      guideSession.state = GUIDE_STATES.GUIDE;
      guideSession.stuckCount = 0;
    } else {
      guideSession.stuckCount++;
      if (guideSession.stuckCount >= 2) {
        guideSession.state = GUIDE_STATES.HINT;
      }
    }
  } else if (state === GUIDE_STATES.GUIDE) {
    if (isCorrect) {
      guideSession.state = GUIDE_STATES.VERIFY;
      guideSession.correctStreak++;
    } else {
      guideSession.stuckCount++;
      if (guideSession.stuckCount >= 2) {
        guideSession.state = GUIDE_STATES.HINT;
      }
    }
  } else if (state === GUIDE_STATES.HINT) {
    if (isCorrect || isPartial) {
      guideSession.state = GUIDE_STATES.GUIDE;
    } else {
      guideSession.stuckCount++;
      if (guideSession.stuckCount >= 4) {
        guideSession.state = GUIDE_STATES.VERIFY;
        addGuideBubble('ai', '没关系，我们换个角度。让我帮你梳理一下...');
      }
    }
  } else if (state === GUIDE_STATES.VERIFY) {
    if (isCorrect) {
      guideSession.state = GUIDE_STATES.REINFORCE;
      guideSession.mastery = Math.min(1, guideSession.mastery + 0.2);
    } else {
      guideSession.state = GUIDE_STATES.GUIDE;
    }
  } else if (state === GUIDE_STATES.REINFORCE) {
    if (isCorrect) {
      guideSession.state = GUIDE_STATES.CLOSE;
      guideSession.mastery = Math.min(1, guideSession.mastery + 0.15);
    } else {
      guideSession.state = GUIDE_STATES.GUIDE;
    }
  }

  // 更新脚手架层级
  const scaffoldLevel = SocraticDM.getScaffoldLevel(guideSession.stuckCount, guideSession.mastery);
  updateScaffoldDisplay(scaffoldLevel);

  // 检查是否结束
  if (guideSession.state === GUIDE_STATES.CLOSE) {
    addGuideBubble('ai', '太棒了！这道题我们完整走了一遍。记住：遇到任何题目，都可以先理解、再列已知、找关系、验证答案。继续加油！');
    speak('太棒了！这道题我们完整走了一遍。继续加油！');
    guideStatusText.textContent = '引导完成';
    stopStuckTimer();
    HealthGuardian.endFocus();
    currentSceneState = 'TRANSITION';
    updateSceneBar();

    // 记录到记忆系统
    Memory.addEpisode({
      scene: '学习', topic: guideSession.problem.substring(0, 30),
      knowledge: type, response: 'positive', emotion: 'accomplished',
      duration: 0, followUp: true
    });
    // 性格演化：正面反馈
    Personality.evolve('patience', 'positive');
    Personality.evolve('warmth', 'positive');
    renderPersonality();
    return;
  }

  guideStatusText.textContent = `引导中：${stateLabels[guideSession.state]}`;

  setTimeout(() => {
    const prompt = getStatePrompt(guideSession.state, type, scaffoldLevel, misconception);
    addGuideBubble('ai', prompt);
    speak(prompt);
  }, 500);
}

function assessAnswer(text, session) {
  const t = text.toLowerCase();
  if (/对|正确|是的|没错|等于|答案是|结果是/.test(t)) return true;
  if (session.type === 'motion' && /\d+.*km|\d+.*千米/.test(t)) return true;
  if (/\d{2,}/.test(t) && session.state === GUIDE_STATES.VERIFY) return true;
  return false;
}

function assessPartial(text, session) {
  const t = text.toLowerCase();
  if (/我觉得|可能是|大概|试试|应该是/.test(t)) return true;
  if (t.length > 10) return true;
  return false;
}

function giveHint() {
  if (!guideSession) return;
  guideSession.stuckCount++;
  guideSession.hintsGiven++;
  const scaffoldLevel = SocraticDM.getScaffoldLevel(guideSession.stuckCount, guideSession.mastery);
  updateScaffoldDisplay(scaffoldLevel);
  const hint = getStatePrompt(GUIDE_STATES.HINT, guideSession.type, scaffoldLevel, null);
  addGuideBubble('ai', hint);
  speak(hint);
  resetStuckTimer();
}

function endGuide() {
  if (!guideSession) return;
  guideSession.state = GUIDE_STATES.CLOSE;
  addGuideBubble('ai', '没关系，先休息一下，下次再继续。');
  speak('没关系，先休息一下。');
  guideStatusText.textContent = '已结束';
  stopStuckTimer();
  HealthGuardian.endFocus();
  currentSceneState = 'TRANSITION';
  SceneEngine.updateSignal('cameraActivity', isCameraOn ? 'detecting' : 'idle');  // ★ 接入场景引擎
  updateSceneBar();
  updateSceneInteractionPanel();
  // 性格演化：负面反馈
  Personality.evolve('proactivity', 'negative');
  renderPersonality();
}

function resetStuckTimer() {
  lastAnswerTime = Date.now();
  stuckTimerEl.textContent = '已停顿 0 秒';
  stuckTimerEl.classList.remove('warning');
}

function startStuckTimer() {
  stopStuckTimer();
  lastAnswerTime = Date.now();
  stuckTimerInterval = setInterval(() => {
    if (!guideSession || guideSession.state === GUIDE_STATES.CLOSE) return;
    const elapsed = Math.floor((Date.now() - lastAnswerTime) / 1000);
    stuckTimerEl.textContent = `已停顿 ${elapsed} 秒`;
    if (elapsed >= 20) stuckTimerEl.classList.add('warning');
    if (elapsed === 25) {
      guideSession.stuckCount++;
      const scaffoldLevel = SocraticDM.getScaffoldLevel(guideSession.stuckCount, guideSession.mastery);
      updateScaffoldDisplay(scaffoldLevel);
      const hint = getStatePrompt(GUIDE_STATES.HINT, guideSession.type, scaffoldLevel, null);
      addGuideBubble('ai', `你好像停住了，给你一个小提示：${hint}`);
      speak(hint);
    }
    if (elapsed === 60) {
      addGuideBubble('ai', '要不要先休息一下？换个心情再回来也行哦。');
      speak('要不要先休息一下？');
    }
  }, 1000);
}

function stopStuckTimer() {
  if (stuckTimerInterval) { clearInterval(stuckTimerInterval); stuckTimerInterval = null; }
}

startGuideBtn.addEventListener('click', () => { startGuideSession(); startStuckTimer(); });
guideSend.addEventListener('click', () => {
  const text = guideInput.value.trim(); if (!text) return;
  guideInput.value = ''; advanceGuide(text);
});
guideInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { const text = guideInput.value.trim(); if (!text) return; guideInput.value = ''; advanceGuide(text); }
});
giveHintBtn.addEventListener('click', giveHint);
endGuideBtn.addEventListener('click', endGuide);

/* ===== 游戏场景知识桥接 ===== */
let gameSession = null;

const gameScenarios = [
  { game: '我的世界', action: '搭建红石电路', knowledge: '并联电路', bridge: '你搭的两条独立线路，其实就是并联电路，电流可以分别走' },
  { game: '我的世界', action: '建造房屋', knowledge: '结构力学', bridge: '你用的支柱和横梁，和现实建筑一样需要考虑受力分布' },
  { game: '原神', action: '探索璃月港', knowledge: '宋代贸易', bridge: '璃月港的建筑风格参考了宋代，那时海上贸易非常繁荣' },
  { game: '原神', action: '元素反应', knowledge: '化学反应', bridge: '水+火=蒸发，这和化学反应里的放热反应很像' },
];

document.getElementById('simulate-game').addEventListener('click', () => {
  gameSession = { count: 0, maxCount: 3, events: [] };
  gameBridgeCard.style.display = 'block';
  gameBridgeChat.innerHTML = '';
  gameSessionInfo.textContent = '本次游戏已植入 0/3 个知识点';
  currentSceneState = 'LIGHT_TASK';
  updateSceneBar();
  addGameBubble('ai', '🎮 进入游戏模式。搭子会在自然停顿时植入知识，每次最多3个。');

  // 模拟游戏加载间隙
  setTimeout(() => triggerGameBridge(0), 2000);
});

function triggerGameBridge(index) {
  if (!gameSession || gameSession.count >= gameSession.maxCount) {
    addGameBubble('ai', '本次游戏知识植入已完成，继续玩吧！');
    return;
  }
  const scenario = gameScenarios[index % gameScenarios.length];
  addGameBubble('ai', `【${scenario.game}·${scenario.action}】${scenario.bridge}`);
  speak(scenario.bridge);
  gameSession.count++;
  gameSessionInfo.textContent = `本次游戏已植入 ${gameSession.count}/3 个知识点`;

  Memory.addEpisode({
    scene: '游戏', topic: scenario.action, knowledge: scenario.knowledge,
    response: 'neutral', emotion: 'engaged', followUp: false
  });
  SpacedRepetition.add(scenario.knowledge, '游戏');

  if (gameSession.count < gameSession.maxCount) {
    setTimeout(() => triggerGameBridge(index + 1), 4000);
  }
}

function addGameBubble(role, text) {
  const div = document.createElement('div');
  div.className = `chat-bubble ${role}`;
  div.textContent = text;
  gameBridgeChat.appendChild(div);
  gameBridgeChat.scrollTop = gameBridgeChat.scrollHeight;
}

/* ===== 间隔重复渲染 ===== */
function renderSpacedRepetition() {
  const dueList = document.getElementById('sr-due-list');
  const allList = document.getElementById('sr-all-list');
  const due = SpacedRepetition.getDue();

  if (due.length > 0) {
    dueList.innerHTML = due.map(item => `
      <div class="list-item" style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <strong>${item.knowledge}</strong>
          <div style="font-size:0.75rem;color:var(--muted);">第${item.round + 1}轮复习 · 场景：${item.scene}</div>
        </div>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-sage" style="padding:4px 10px;font-size:0.78rem;" onclick="reviewSR('${item.id}','correct')">记得</button>
          <button class="btn" style="padding:4px 10px;font-size:0.78rem;background:var(--surface-alt);" onclick="reviewSR('${item.id}','forgot')">忘了</button>
        </div>
      </div>
    `).join('');
  } else {
    dueList.innerHTML = '<div class="empty-state">暂无待复习知识点 🎉</div>';
  }

  allList.innerHTML = SpacedRepetition.queue.slice(0, 5).map(item => `
    <div class="list-item" style="display:flex;justify-content:space-between;font-size:0.82rem;">
      <span>${item.knowledge}</span>
      <span style="color:var(--muted);">第${item.round}/4轮 · 强度${item.strength.toFixed(1)}</span>
    </div>
  `).join('') || '<div class="empty-state">还没有知识点记录</div>';
}

function reviewSR(itemId, result) {
  SpacedRepetition.review(itemId, result === 'correct' ? 'correct' : 'forgot');
  renderSpacedRepetition();
  if (result === 'correct') {
    addChatBubble('ai', '记得很清楚！这个知识点已经巩固了。');
    Personality.evolve('warmth', 'positive');
  } else {
    addChatBubble('ai', '没关系，忘了就再来一次。下次复习时间会提前。');
    Personality.evolve('patience', 'positive');
  }
  renderPersonality();
}

/* ===== 性格显示 ===== */
function renderPersonality() {
  const display = document.getElementById('personality-display');
  const v = Personality.vector;
  const dims = [
    { key: 'warmth', label: '温暖度', color: 'var(--accent)' },
    { key: 'humor', label: '幽默感', color: 'var(--gold)' },
    { key: 'patience', label: '耐心度', color: 'var(--sage)' },
    { key: 'proactivity', label: '主动性', color: 'var(--coral)' },
    { key: 'formality', label: '正式度', color: 'var(--blue)' },
    { key: 'curiosity', label: '好奇心', color: 'var(--accent)' }
  ];
  display.innerHTML = dims.map(d => `
    <div class="progress-row">
      <div class="progress-label">${d.label}</div>
      <div class="progress-track"><div class="progress-fill" style="width:${v[d.key]*100}%;background:${d.color}"></div></div>
      <div class="progress-value">${Math.round(v[d.key]*100)}</div>
    </div>
  `).join('') + `<div style="margin-top:8px;font-size:0.78rem;color:var(--muted);">当前风格：${getStyleLabel(Personality.getStyle())} · 今日干预 ${SceneEngine.interventionCount}/20 次</div>`;
}

function getStyleLabel(style) {
  return { playful: '活泼趣味', formal: '正式严谨', curious: '好奇探索', balanced: '均衡自然' }[style] || '均衡自然';
}

/* ===== 聊天与AI回复 ===== */
function addChatBubble(role, text) {
  const div = document.createElement('div');
  div.className = `chat-bubble ${role}`;
  div.textContent = text;
  chatList.appendChild(div);
  chatList.scrollTop = chatList.scrollHeight;
}

function generateReply(text) {
  const t = text.toLowerCase();
  // 记忆检索
  const memories = Memory.retrieve(t);
  let memoryPrefix = '';
  if (memories.length > 0) {
    memoryPrefix = `上次我们聊过${memories[0].topic}，你还记得吗？`;
  }

  if (/你好|嗨|在吗/.test(t)) return '你好呀！今天想聊点什么？';
  if (/谢谢/.test(t)) { Personality.evolve('warmth', 'positive'); return '不客气，随时陪你聊！'; }
  if (/累|烦|不想学/.test(t)) {
    Personality.evolve('proactivity', 'negative');
    currentSceneState = 'FRUSTRATED';
    updateSceneBar();
    return '听起来你有点累，先休息一下吧。偶尔停下来，反而能走得更远。';
  }
  if (/你是谁/.test(t)) return '我是你的 AI 搭子，不三迁。我会陪你学习、聊天，但不会替你做作业哦～';
  if (/物理|牛顿|力|速度/.test(t)) return '物理很有趣！力是改变物体运动状态的原因。你可以想想，骑自行车刹车时，是什么力让你停下来？';
  if (/历史|朝代|古代/.test(t)) return '历史就像连续剧，每个朝代都有自己的主角。你最想了解哪个朝代的故事？';
  if (/生物|动物|植物|细胞/.test(t)) return '生物世界里，细胞是基本单位。人体大约有 37 万亿个细胞，它们分工合作！';
  if (memoryPrefix) return memoryPrefix + '这个问题很有意思，你觉得呢？';
  return '这个问题很有意思！我们可以从你最熟悉的部分开始聊起。你觉得呢？';
}

/* ===== 语音合成 ===== */
function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'zh-CN';
  u.rate = 1.05; u.pitch = 1.05;
  window.speechSynthesis.speak(u);
}

/* ===== 语音识别 ===== */
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let micPermission = 'unknown'; // unknown / granted / denied / prompt

/* 主动请求麦克风权限（触发浏览器权限弹窗） */
async function requestMicPermission() {
  var micBtn = document.getElementById('mic-permission-btn');
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      voiceHint.textContent = '当前浏览器不支持麦克风访问';
      micPermission = 'unsupported';
      if (micBtn) micBtn.style.display = 'none';
      return false;
    }
    voiceHint.textContent = '正在请求麦克风权限…';
    // 请求音频流以触发权限弹窗，获取后立即停止
    const micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    micStream.getTracks().forEach(t => t.stop());
    micPermission = 'granted';
    voiceHint.textContent = '麦克风已就绪 · 按住说话';
    if (micBtn) micBtn.style.display = 'none';
    return true;
  } catch (e) {
    if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
      micPermission = 'denied';
      voiceHint.textContent = '麦克风权限被拒绝，请点击"开启麦克风"重新授权';
      if (micBtn) micBtn.style.display = 'inline-block';
    } else if (e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError') {
      micPermission = 'nodevice';
      voiceHint.textContent = '未检测到麦克风设备';
      if (micBtn) micBtn.style.display = 'none';
    } else {
      micPermission = 'error';
      voiceHint.textContent = '麦克风访问失败：' + e.message;
      if (micBtn) micBtn.style.display = 'inline-block';
    }
    return false;
  }
}

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = 'zh-CN';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onstart = () => { voiceBtn.classList.add('listening'); voiceHint.textContent = '正在听…'; };
  recognition.onend = () => { voiceBtn.classList.remove('listening'); voiceHint.textContent = '麦克风已就绪 · 按住说话'; };
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    addChatBubble('user', transcript);
    const reply = generateReply(transcript);
    setTimeout(() => { addChatBubble('ai', reply); speak(reply); }, 400);
    Memory.addEpisode({ scene: '语音问答', topic: transcript.substring(0, 20), response: 'positive', emotion: 'neutral', followUp: true });
  };
  recognition.onerror = (e) => {
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
      voiceHint.textContent = '麦克风权限被拒绝，请点击"开启麦克风"按钮授权';
      micPermission = 'denied';
    } else if (e.error === 'no-speech') {
      voiceHint.textContent = '没有听到声音，请再试一次';
    } else if (e.error === 'network') {
      voiceHint.textContent = '语音识别需要网络连接（Web Speech API）';
    } else {
      voiceHint.textContent = '识别失败：' + e.error;
    }
  };
} else {
  voiceHint.textContent = '当前浏览器不支持语音识别，建议使用 Chrome 浏览器';
}

/* 按住说话 */
function startListening() {
  if (!recognition) {
    voiceHint.textContent = '当前浏览器不支持语音识别，建议使用 Chrome 浏览器';
    return;
  }
  if (micPermission === 'denied') {
    requestMicPermission();
    return;
  }
  try { recognition.start(); } catch(e) {}
}
function stopListening() {
  if (!recognition) return;
  try { recognition.stop(); } catch(e) {}
}

voiceBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startListening(); });
voiceBtn.addEventListener('mousedown', (e) => { e.preventDefault(); startListening(); });
voiceBtn.addEventListener('touchend', (e) => { e.preventDefault(); stopListening(); });
voiceBtn.addEventListener('mouseup', (e) => { e.preventDefault(); stopListening(); });

/* ===== 场景交互引擎可视化面板 ===== */
const sigFace = document.getElementById('sig-face').querySelector('.sig-value');
const sigVoice = document.getElementById('sig-voice').querySelector('.sig-value');
const sigFocus = document.getElementById('sig-focus').querySelector('.sig-value');
const sigCamera = document.getElementById('sig-camera').querySelector('.sig-value');
const sigHistory = document.getElementById('sig-history').querySelector('.sig-value');
const inferredStateEl = document.getElementById('inferred-state');
const inferredConfidenceEl = document.getElementById('inferred-confidence');
const inferenceScoresEl = document.getElementById('inference-scores');
const sceneReasonsEl = document.getElementById('scene-reasons');
const sceneStrategyEl = document.getElementById('scene-strategy');

const stateColors = {
  DEEP_FOCUS: 'var(--sage)',
  LIGHT_TASK: 'var(--accent)',
  TRANSITION: 'var(--gold)',
  BORED: 'var(--blue)',
  FRUSTRATED: 'var(--coral)'
};

const stateEmojis = {
  DEEP_FOCUS: '🎯',
  LIGHT_TASK: '📖',
  TRANSITION: '🔄',
  BORED: '😴',
  FRUSTRATED: '😣'
};

function updateSceneInteractionPanel() {
  const sig = SceneEngine.signals;
  const result = SceneEngine.inferState();

  // 更新5个信号值
  const faceEmotionMap = { neutral: '中性', happy: '开心', sad: '难过', angry: '生气', fearful: '害怕', disgusted: '厌恶', surprised: '惊讶' };
  sigFace.textContent = faceEmotionMap[sig.faceEmotion] || sig.faceEmotion;
  sigFace.style.color = getEmotionColor(sig.faceEmotion);

  sigVoice.textContent = sig.voiceEmotion;
  sigFocus.textContent = sig.focusMinutes + 'min';
  sigCamera.textContent = sig.cameraActivity;
  sigHistory.textContent = sig.recentResponses.length + '次';

  // 更新推断状态
  inferredStateEl.textContent = stateEmojis[result.state] + ' ' + result.stateName;
  inferredStateEl.style.color = stateColors[result.state];
  inferredConfidenceEl.textContent = '置信度 ' + result.confidence + '%';

  // 更新状态得分条
  const scores = result.scores;
  let scoresHtml = '';
  const stateList = ['DEEP_FOCUS', 'LIGHT_TASK', 'TRANSITION', 'BORED', 'FRUSTRATED'];
  const stateShort = { DEEP_FOCUS: '深度', LIGHT_TASK: '轻量', TRANSITION: '切换', BORED: '无聊', FRUSTRATED: '挫败' };
  let maxAbs = 0.01;
  for (const s of stateList) if (Math.abs(scores[s]) > maxAbs) maxAbs = Math.abs(scores[s]);
  for (const s of stateList) {
    const v = scores[s];
    const pct = Math.round(Math.abs(v) / maxAbs * 100);
    const isPositive = v > 0;
    scoresHtml += '<div class="score-row">' +
      '<span class="score-label" style="color:' + (s === result.state ? stateColors[s] : 'var(--muted)') + ';">' + stateShort[s] + (s === result.state ? ' ★' : '') + '</span>' +
      '<div class="score-bar"><div class="score-fill" style="width:' + pct + '%;background:' + (isPositive ? stateColors[s] : 'var(--muted)') + ';opacity:' + (isPositive ? 1 : 0.4) + ';"></div></div>' +
      '<span class="score-value">' + v.toFixed(2) + '</span>' +
      '</div>';
  }
  inferenceScoresEl.innerHTML = scoresHtml;

  // 更新推断理由
  let reasonsHtml = '<div class="reasons-title">推断依据</div>';
  for (let i = 0; i < result.reasons.length; i++) {
    reasonsHtml += '<div class="reason-item">• ' + result.reasons[i] + '</div>';
  }
  sceneReasonsEl.innerHTML = reasonsHtml;

  // 更新交互策略
  const strat = result.strategy;
  let stratHtml = '<div class="strategy-header">' +
    '<span class="strategy-action" style="color:' + stateColors[result.state] + ';">' + strat.action + '</span>' +
    '<span class="strategy-priority">优先级 P' + strat.priority + '</span></div>' +
    '<div class="strategy-desc">' + strat.desc + '</div>';
  if (strat.speak) {
    stratHtml += '<div class="strategy-speak">💬 搭子话术："' + strat.speak + '"</div>';
    // 提供执行按钮
    stratHtml += '<button class="btn btn-sage" style="width:100%;margin-top:6px;font-size:0.8rem;" onclick="executeStrategy()">执行策略（语音播报）</button>';
  } else if (strat.tone === 'silent') {
    stratHtml += '<div class="strategy-speak" style="color:var(--muted);">🤫 静默模式，不打扰学生</div>';
  }
  sceneStrategyEl.innerHTML = stratHtml;
}

/* 执行当前策略 */
function executeStrategy() {
  const result = SceneEngine.inferState();
  const strat = result.strategy;
  if (strat.speak) {
    speak(strat.speak);
    addChatBubble('ai', strat.speak);
    // 记录干预
    SceneEngine.recordIntervention('neutral');
  }
}

/* 交互反馈按钮 */
document.getElementById('scene-respond-positive').addEventListener('click', () => {
  SceneEngine.updateSignal('interactionResponse', 'positive');
  SceneEngine.recordIntervention('positive');
  // 性格演化：积极反馈提升温暖度
  Personality.evolve('warmth', 'positive');
  Personality.evolve('proactivity', 'positive');
  renderPersonality();
  updateSceneInteractionPanel();
  addChatBubble('user', '👍');
});

document.getElementById('scene-respond-neutral').addEventListener('click', () => {
  SceneEngine.updateSignal('interactionResponse', 'neutral');
  SceneEngine.recordIntervention('neutral');
  updateSceneInteractionPanel();
});

document.getElementById('scene-respond-ignore').addEventListener('click', () => {
  SceneEngine.updateSignal('interactionResponse', 'ignore');
  SceneEngine.recordIntervention('ignore');
  // 忽略连击：性格向低主动性演化
  Personality.evolve('proactivity', 'negative');
  renderPersonality();
  updateSceneInteractionPanel();
});

/* ===== 初始化 ===== */
loadModel();
updateSceneBar();
updateSceneInteractionPanel();
renderSpacedRepetition();
renderPersonality();

/* 页面加载后主动请求麦克风权限（触发浏览器权限弹窗） */
if (SpeechRecognition) {
  requestMicPermission();
}

/* ===== 人脸情绪识别（face-api.js） ===== */
const faceVideo = document.getElementById('face-video');
const faceCanvas = document.getElementById('face-canvas');
const faceCtx = faceCanvas.getContext('2d');
const faceModelStatus = document.getElementById('face-model-status');
const toggleFaceBtn = document.getElementById('toggle-face');
const emotionDisplay = document.getElementById('emotion-display');
const emotionLabel = emotionDisplay.querySelector('.emotion-label');
const emotionConfidence = emotionDisplay.querySelector('.emotion-confidence');
const emotionBars = document.getElementById('emotion-bars');

let faceModel = null;
let faceStream = null;
let isFaceDetectOn = false;
let faceDetectLoopId = null;

// 情绪中英文映射
const emotionMap = {
  neutral: '中性', happy: '开心', sad: '难过', angry: '生气',
  fearful: '害怕', disgusted: '厌恶', surprised: '惊讶'
};

// 情绪→搭子应对策略
const emotionStrategy = {
  happy: { action: '顺势引导', speech: '看你心情不错，要不要一起探索点新知识？' },
  sad: { action: '温柔安慰', speech: '好像有点不开心，先休息一下吧，我给你讲个有趣的事。' },
  angry: { action: '冷静降频', speech: '深呼吸，先冷静一下，我们等会儿再继续。' },
  surprised: { action: '解释解惑', speech: '是不是发现了什么有趣的东西？我帮你看看。' },
  fearful: { action: '安抚鼓励', speech: '别担心，有我在呢，我们一起面对。' },
  disgusted: { action: '转移话题', speech: '换个话题吧，我给你分享一个好玩的知识。' },
  neutral: { action: '正常互动', speech: '' }
};

async function loadFaceModel() {
  faceModelStatus.textContent = '加载情绪模型中…';
  try {
    // 从CDN加载模型权重
    const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights';
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
    faceModel = true;
    faceModelStatus.textContent = '情绪模型就绪';
  } catch (e) {
    faceModelStatus.textContent = '情绪模型加载失败（可继续使用识物功能）';
  }
}

async function startFaceDetect() {
  try {
    faceStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
    faceVideo.srcObject = faceStream;
    isFaceDetectOn = true;
    toggleFaceBtn.textContent = '关闭人脸情绪检测';
    faceModelStatus.textContent = faceModel ? '检测中…' : '情绪模型未加载';
    if (!faceModel) { loadFaceModel().then(() => { if (isFaceDetectOn) faceDetectLoop(); }); }
    else { faceDetectLoop(); }
  } catch (e) {
    alert('无法访问摄像头：' + e.message);
  }
}

function stopFaceDetect() {
  if (faceStream) { faceStream.getTracks().forEach(t => t.stop()); faceStream = null; }
  faceVideo.srcObject = null;
  isFaceDetectOn = false;
  toggleFaceBtn.textContent = '开启人脸情绪检测';
  faceCtx.clearRect(0, 0, faceCanvas.width, faceCanvas.height);
  emotionLabel.textContent = '等待检测…';
  emotionConfidence.textContent = '--';
  emotionBars.innerHTML = '';
  faceModelStatus.textContent = faceModel ? '情绪模型就绪' : '情绪模型未加载';
}

toggleFaceBtn.addEventListener('click', () => { if (isFaceDetectOn) stopFaceDetect(); else startFaceDetect(); });

async function faceDetectLoop() {
  if (!isFaceDetectOn) return;
  // 始终把视频帧绘制到canvas，保证画面可见（即使模型未加载或检测失败）
  if (faceVideo.readyState === 4) {
    faceCanvas.width = faceVideo.videoWidth;
    faceCanvas.height = faceVideo.videoHeight;
    faceCtx.clearRect(0, 0, faceCanvas.width, faceCanvas.height);
    // 镜像绘制（与video的 scaleX(-1) 保持一致）
    faceCtx.save();
    faceCtx.scale(-1, 1);
    faceCtx.drawImage(faceVideo, -faceCanvas.width, 0, faceCanvas.width, faceCanvas.height);
    faceCtx.restore();
  }
  // 仅在模型就绪时做检测
  if (faceVideo.readyState === 4 && faceModel) {
    try {
      const detections = await faceapi.detectAllFaces(faceVideo, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
        .withFaceExpressions();

      if (detections.length > 0) {
        // 取最大的人脸
        let best = detections[0];
        for (let i = 1; i < detections.length; i++) {
          if (detections[i].detection.box.area > best.detection.box.area) best = detections[i];
        }
        const box = best.detection.box;
        // 镜像绘制检测框（因为video是镜像的）
        const x = faceCanvas.width - box.x - box.width;
        faceCtx.strokeStyle = '#6B9080';
        faceCtx.lineWidth = 3;
        faceCtx.strokeRect(x, box.y, box.width, box.height);

        const expressions = best.expressions;
        let maxEmotion = 'neutral', maxVal = 0;
        const emotionList = ['neutral', 'happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised'];
        for (let i = 0; i < emotionList.length; i++) {
          if (expressions[emotionList[i]] > maxVal) { maxVal = expressions[emotionList[i]]; maxEmotion = emotionList[i]; }
        }

        emotionLabel.textContent = emotionMap[maxEmotion] || maxEmotion;
        emotionConfidence.textContent = Math.round(maxVal * 100) + '%';
        emotionLabel.style.color = getEmotionColor(maxEmotion);

        // ★ 接入场景引擎：更新人脸情绪信号
        SceneEngine.updateSignal('faceEmotion', maxEmotion, { confidence: maxVal });
        updateSceneInteractionPanel();

        // 绘制情绪条
        let barsHtml = '';
        for (let i = 0; i < emotionList.length; i++) {
          const e = emotionList[i];
          const v = Math.round(expressions[e] * 100);
          barsHtml += '<div class="emotion-bar-row">' +
            '<span class="emotion-bar-label">' + emotionMap[e] + '</span>' +
            '<div class="emotion-bar-track"><div class="emotion-bar-fill" style="width:' + v + '%;background:' + getEmotionColor(e) + ';"></div></div>' +
            '<span class="emotion-bar-value">' + v + '%</span></div>';
        }
        emotionBars.innerHTML = barsHtml;

        // 根据情绪调整搭子行为（仅在情绪强烈时触发）
        if (maxVal > 0.6 && (maxEmotion === 'sad' || maxEmotion === 'angry' || maxEmotion === 'fearful')) {
          const strategy = emotionStrategy[maxEmotion];
          if (strategy && strategy.speech && Date.now() - (window.lastEmotionIntervention || 0) > 30000) {
            window.lastEmotionIntervention = Date.now();
            speak(strategy.speech);
            addChatBubble('ai', strategy.speech);
            // 记录到性格演化
            Personality.evolve('warmth', 'negative');
            renderPersonality();
          }
        }
      } else {
        emotionLabel.textContent = '未检测到人脸';
        emotionConfidence.textContent = '--';
        emotionBars.innerHTML = '';
      }
    } catch (e) {
      // 检测异常时静默
    }
  }
  faceDetectLoopId = requestAnimationFrame(faceDetectLoop);
}

function getEmotionColor(emotion) {
  const colors = {
    neutral: 'var(--muted)', happy: 'var(--sage)', sad: 'var(--blue)',
    angry: 'var(--coral)', fearful: 'var(--gold)', disgusted: 'var(--coral)', surprised: 'var(--accent)'
  };
  return colors[emotion] || 'var(--muted)';
}

// 页面加载后预加载情绪模型
setTimeout(() => { if (typeof faceapi !== 'undefined') loadFaceModel(); }, 2000);

/* ===== 声音情绪识别（Web Audio API 声学特征分析） ===== */
const toggleVoiceEmotionBtn = document.getElementById('toggle-voice-emotion');
const voiceEmotionStatus = document.getElementById('voice-emotion-status');
const voiceEmotionMetrics = document.getElementById('voice-emotion-metrics');
const voiceEmotionResult = document.getElementById('voice-emotion-result');
const metricF0 = document.getElementById('metric-f0');
const metricEnergy = document.getElementById('metric-energy');
const metricRate = document.getElementById('metric-rate');
const metricVariation = document.getElementById('metric-variation');

let voiceEmotionStream = null;
let audioContext = null;
let analyser = null;
let isVoiceEmotionOn = false;
let voiceEmotionLoopId = null;
let pitchHistory = [];
let energyHistory = [];
let lastVoiceTime = 0;
let voiceSegments = 0;

toggleVoiceEmotionBtn.addEventListener('click', async () => {
  if (isVoiceEmotionOn) {
    stopVoiceEmotion();
  } else {
    await startVoiceEmotion();
  }
});

async function startVoiceEmotion() {
  try {
    voiceEmotionStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(voiceEmotionStream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);
    isVoiceEmotionOn = true;
    toggleVoiceEmotionBtn.textContent = '停止声音情绪分析';
    voiceEmotionStatus.textContent = '正在分析声音特征…';
    voiceEmotionMetrics.style.display = 'block';
    voiceEmotionResult.style.display = 'block';
    pitchHistory = [];
    energyHistory = [];
    voiceSegments = 0;
    lastVoiceTime = Date.now();
    voiceEmotionLoop();
  } catch (e) {
    voiceEmotionStatus.textContent = '无法访问麦克风：' + e.message;
  }
}

function stopVoiceEmotion() {
  if (voiceEmotionStream) { voiceEmotionStream.getTracks().forEach(t => t.stop()); voiceEmotionStream = null; }
  if (audioContext) { audioContext.close(); audioContext = null; }
  isVoiceEmotionOn = false;
  toggleVoiceEmotionBtn.textContent = '开始声音情绪分析';
  voiceEmotionStatus.textContent = '声音情绪分析已停止';
  if (voiceEmotionLoopId) { cancelAnimationFrame(voiceEmotionLoopId); voiceEmotionLoopId = null; }
}

function voiceEmotionLoop() {
  if (!isVoiceEmotionOn || !analyser) return;
  const bufferLength = analyser.fftSize;
  const timeData = new Float32Array(bufferLength);
  const freqData = new Uint8Array(analyser.frequencyBinCount);
  analyser.getFloatTimeDomainData(timeData);
  analyser.getByteFrequencyData(freqData);

  // 1. 计算基频F0（自相关法简化版）
  const f0 = computePitch(timeData, audioContext.sampleRate);

  // 2. 计算能量（RMS）
  let sum = 0;
  for (let i = 0; i < timeData.length; i++) sum += timeData[i] * timeData[i];
  const rms = Math.sqrt(sum / timeData.length);
  const energy = Math.round(rms * 1000);

  // 3. 判断是否有语音活动（能量阈值）
  const isSpeaking = energy > 30;
  if (isSpeaking) {
    if (f0 > 50 && f0 < 500) pitchHistory.push(f0);
    energyHistory.push(energy);
    if (pitchHistory.length > 100) pitchHistory.shift();
    if (energyHistory.length > 100) energyHistory.shift();
    if (Date.now() - lastVoiceTime > 800) voiceSegments++;
    lastVoiceTime = Date.now();
  }

  // 4. 计算音高变化（标准差）
  let pitchVar = 0;
  if (pitchHistory.length > 5) {
    const mean = pitchHistory.reduce((a, b) => a + b, 0) / pitchHistory.length;
    const variance = pitchHistory.reduce((a, b) => a + (b - mean) * (b - mean), 0) / pitchHistory.length;
    pitchVar = Math.round(Math.sqrt(variance));
  }

  // 5. 估算语速（基于语音段数/时间）
  const elapsedSec = Math.max(1, (Date.now() - lastVoiceTime + 1000) / 1000);
  const rate = voiceSegments > 0 ? (voiceSegments / Math.max(1, elapsedSec / 10)).toFixed(1) : '0.0';

  // 更新显示
  metricF0.textContent = f0 > 0 ? Math.round(f0) + ' Hz' : '静默';
  metricEnergy.textContent = energy + ' / 1000';
  metricRate.textContent = voiceSegments + ' 段';
  metricVariation.textContent = pitchVar + ' Hz';

  // 6. 声音情绪推断算法
  if (pitchHistory.length > 10 && energyHistory.length > 10) {
    const avgF0 = pitchHistory.reduce((a, b) => a + b, 0) / pitchHistory.length;
    const avgEnergy = energyHistory.reduce((a, b) => a + b, 0) / energyHistory.length;
    let emotion = '中性', color = 'var(--muted)', confidence = 50;

    // 高音高 + 高能量 + 大变化 → 兴奋/开心
    if (avgF0 > 220 && avgEnergy > 100 && pitchVar > 40) {
      emotion = '兴奋/开心'; color = 'var(--sage)'; confidence = 75;
    }
    // 高音高 + 高能量 + 急促 → 生气/激动
    else if (avgF0 > 200 && avgEnergy > 150 && voiceSegments > 5) {
      emotion = '激动/生气'; color = 'var(--coral)'; confidence = 70;
    }
    // 低音高 + 低能量 → 难过/疲惫
    else if (avgF0 < 150 && avgEnergy < 50) {
      emotion = '低落/疲惫'; color = 'var(--blue)'; confidence = 65;
    }
    // 低变化 + 中能量 → 平静
    else if (pitchVar < 20 && avgEnergy > 30 && avgEnergy < 100) {
      emotion = '平静'; color = 'var(--sage)'; confidence = 60;
    }
    // 高变化 + 中能量 → 焦虑/紧张
    else if (pitchVar > 50 && avgEnergy < 100) {
      emotion = '焦虑/紧张'; color = 'var(--gold)'; confidence = 60;
    }

    voiceEmotionResult.innerHTML =
      '<div style="text-align:center;padding:12px;background:var(--surface-alt);border-radius:var(--radius-sm);">' +
      '<div style="font-size:1.3rem;font-weight:700;color:' + color + ';">' + emotion + '</div>' +
      '<div style="font-size:0.8rem;color:var(--muted);margin-top:4px;">置信度 ' + confidence + '%</div>' +
      '<div style="font-size:0.72rem;color:var(--ink-soft);margin-top:6px;">基于F0=' + Math.round(avgF0) + 'Hz · 能量=' + Math.round(avgEnergy) + ' · 变化=' + pitchVar + 'Hz</div>' +
      '</div>';

    // ★ 接入场景引擎：更新声音情绪信号
    SceneEngine.updateSignal('voiceEmotion', emotion, { energy: avgEnergy });
    updateSceneInteractionPanel();
  }

  voiceEmotionLoopId = requestAnimationFrame(voiceEmotionLoop);
}

/* 简化自相关基频检测算法 */
function computePitch(buffer, sampleRate) {
  const SIZE = buffer.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1; // 静默

  // 截取有效区间
  const minPeriod = Math.floor(sampleRate / 500); // 500Hz
  const maxPeriod = Math.floor(sampleRate / 80);  // 80Hz
  let bestPeriod = 0, bestCorr = 0;

  for (let period = minPeriod; period < maxPeriod && period < SIZE / 2; period++) {
    let corr = 0;
    for (let i = 0; i < SIZE - period; i++) {
      corr += buffer[i] * buffer[i + period];
    }
    if (corr > bestCorr) { bestCorr = corr; bestPeriod = period; }
  }

  if (bestPeriod === 0 || bestCorr < 0.1) return -1;
  return sampleRate / bestPeriod;
}
