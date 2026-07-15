// Soloist HTML Demo - 交互逻辑

// === 检测进行中页面 ===
function initDetectionRunning() {
  let elapsedSeconds = 0;
  let currentScore = 0;
  let isRunning = true;

  document.getElementById('page-detection-running').innerHTML = `
    <div class="nav-header">
      <div class="back-btn" onclick="navigateBack()">←</div>
      <div class="nav-title">检测中</div>
      <div class="nav-right" id="detect-timer">00:00</div>
    </div>

    <div class="card">
      <div style="font-size:14px;color:var(--text-secondary);margin-bottom:8px">实时音准曲线</div>
      <div class="pitch-curve-container">
        <canvas id="pitch-canvas" style="width:100%"></canvas>
      </div>
    </div>

    <div class="realtime-data">
      <div class="data-item">
        <div class="data-label">当前音名</div>
        <div class="data-value" id="current-note" style="color:var(--primary)">--</div>
      </div>
      <div class="data-item">
        <div class="data-label">偏差(音分)</div>
        <div class="data-value" id="current-cents" style="color:var(--success)">0</div>
      </div>
      <div class="data-item">
        <div class="data-label">实时评分</div>
        <div class="data-value" id="current-score" style="color:var(--primary)">0</div>
      </div>
    </div>

    <div class="card">
      <div style="display:flex;justify-content:space-between;margin-bottom:12px">
        <div style="font-size:14px;font-weight:500">姿态检测</div>
        <div style="font-size:12px;color:var(--success)">📷 摄像头已开启</div>
      </div>
      <div class="camera-preview">
        <div class="pose-icon">🧍</div>
        <div class="pose-status">
          <div class="ok">✓ 脊柱挺直</div>
          <div class="ok" style="margin-top:4px">✓ 肩膀放松</div>
          <div class="warn" style="margin-top:4px">⚠ 头部微前倾</div>
        </div>
      </div>
    </div>

    <div class="running-controls">
      <button class="btn btn-secondary" onclick="pauseDetection()">暂停</button>
      <button class="btn" style="background:var(--error);color:#FFFFFF;flex:2" onclick="finishDetection()">结束检测</button>
    </div>
  `;

  // 启动音准曲线动画
  AppState.pitchAnimator = new PitchCurveAnimator('pitch-canvas');
  AppState.pitchAnimator.start();

  // 计时器
  AppState.detectionTimer = setInterval(() => {
    if (isRunning) {
      elapsedSeconds++;
      currentScore = Math.min(95, 70 + Math.floor(Math.random() * 25));

      const min = Math.floor(elapsedSeconds / 60);
      const sec = elapsedSeconds % 60;
      document.getElementById('detect-timer').textContent =
        `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;

      // 更新实时数据
      const note = AppState.pitchAnimator.getCurrentNote();
      const cents = AppState.pitchAnimator.getCurrentCents();
      document.getElementById('current-note').textContent = note;
      document.getElementById('current-cents').textContent = cents > 0 ? `+${cents}` : cents;
      document.getElementById('current-cents').style.color = Math.abs(cents) < 50 ? 'var(--success)' : 'var(--error)';
      document.getElementById('current-score').textContent = currentScore;
      document.getElementById('current-score').style.color = getScoreColor(currentScore);
    }
  }, 1000);
}

function pauseDetection() {
  if (AppState.pitchAnimator) {
    AppState.pitchAnimator.stop();
  }
}

function finishDetection() {
  if (AppState.pitchAnimator) {
    AppState.pitchAnimator.stop();
  }
  if (AppState.detectionTimer) {
    clearInterval(AppState.detectionTimer);
  }
  navigateTo('detection-result');
}

// === 检测结果页面 ===
function initDetectionResult() {
  const dims = MockData.dimensionScores;
  const totalScore = Math.round(dims.reduce((sum, d) => sum + d.score * d.weight / 100, 0));

  document.getElementById('page-detection-result').innerHTML = `
    <div class="nav-header">
      <div class="back-btn" onclick="navigateBack()">←</div>
      <div class="nav-title">检测报告</div>
      <div class="nav-right">分享</div>
    </div>

    <div class="result-total">
      <div class="label">综合评分</div>
      <div class="score" style="color:${getScoreColor(totalScore)}">${totalScore}<span class="score-unit">分</span></div>
      <div class="rating" style="background:${getScoreColor(totalScore)}">${getRating(totalScore)}</div>
    </div>

    <div class="card">
      <div class="card-title">五维能力分析</div>
      <div class="radar-container">
        <canvas id="radar-canvas" style="width:300px"></canvas>
      </div>
    </div>

    <div class="card">
      <div class="card-title">维度详情</div>
      ${dims.map(d => `
        <div class="dimension-card">
          <div class="dimension-header">
            <div><span class="dimension-name">${d.name}</span><span class="dimension-weight">权重${d.weight}%</span></div>
            <div class="dimension-score" style="color:${getScoreColor(d.score)}">${d.score}分</div>
          </div>
          <div class="dimension-eval">${d.evaluation}</div>
          ${d.details.map(detail => `
            <div class="detail-row">
              <span style="color:var(--text-secondary)">${detail.name}</span>
              <span>${detail.value}</span>
              <span style="color:${detail.status==='good'?'var(--success)':detail.status==='normal'?'var(--warning)':'var(--error)'};width:30px;text-align:right">${detail.score}</span>
            </div>
          `).join('')}
        </div>
      `).join('')}
    </div>

    <div class="card">
      <div class="card-title">🤖 AI改进建议</div>
      ${MockData.aiSuggestions.map((s, i) => `
        <div class="suggestion-item">
          <div class="suggestion-num">${i + 1}</div>
          <div class="suggestion-text">${s}</div>
        </div>
      `).join('')}
    </div>

    <div style="display:flex;gap:12px;margin:20px 12px">
      <button class="btn btn-secondary" style="flex:1" onclick="navigateTo('detection-running')">再测一次</button>
      <button class="btn btn-primary" style="flex:1" onclick="navigateBack()">查看历史</button>
    </div>
  `;

  // 绘制雷达图
  setTimeout(() => {
    drawRadarChart('radar-canvas', dims);
  }, 100);
}

// === 课程详情页面 ===
function initCourseDetail(courseId) {
  const module = MockData.courseModules.find(m => m.id === courseId) || MockData.courseModules[0];
  const chapters = [
    { type: '视频讲解', desc: '专业老师详细讲解核心知识点', duration: 8, completed: module.status === 'completed' },
    { type: 'AI示范', desc: 'AI生成标准示范音频', duration: 5, completed: module.status === 'completed' },
    { type: '跟练检测', desc: '实时AI检测练习效果', duration: 12, completed: module.status === 'completed' },
    { type: '错题重练', desc: '针对薄弱环节巩固', duration: 8, completed: module.status === 'completed' },
    { type: '课后作业', desc: '完成作业巩固所学', duration: 10, completed: module.status === 'completed' }
  ];

  document.getElementById('page-course-detail').innerHTML = `
    <div class="nav-header">
      <div class="back-btn" onclick="navigateBack()">←</div>
      <div class="nav-title">课程详情</div>
      <div class="nav-right"></div>
    </div>

    <div class="card" style="text-align:center">
      <div style="width:80px;height:80px;border-radius:40px;background:var(--primary);display:flex;align-items:center;justify-content:center;margin:0 auto;font-size:36px;font-weight:700;color:#FFFFFF">${module.index}</div>
      <div style="font-size:20px;font-weight:700;margin-top:12px">${module.title}</div>
      <div style="font-size:14px;color:var(--text-secondary);margin-top:4px">${module.description}</div>
      <div style="display:flex;justify-content:center;gap:16px;margin-top:12px;font-size:12px;color:var(--text-hint)">
        <span>⏱️ ${module.duration}分钟</span>
        <span>⭐ 难度${'★'.repeat(module.difficulty)}</span>
        <span>🎯 ${module.focus}</span>
      </div>
      <div style="font-size:12px;color:var(--primary);margin-top:12px">学习进度：${module.progress}%</div>
    </div>

    <div class="card">
      <div class="card-title">学习路径（五步闭环）</div>
      ${chapters.map((c, i) => `
        <div style="display:flex;padding:12px 0;border-bottom:1px solid var(--divider)">
          <div style="width:32px;height:32px;border-radius:16px;background:${c.completed?'var(--success)':'#F3F4F6'};color:${c.completed?'#FFFFFF':'var(--text-primary)'};display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700">${i + 1}</div>
          <div style="flex:1;margin-left:12px">
            <div style="display:flex;justify-content:space-between"><span style="font-size:15px;font-weight:500">${c.type}</span><span style="font-size:12px;color:${c.completed?'var(--success)':'var(--text-hint)'}">${c.completed?'✓ 已完成':'待完成'}</span></div>
            <div style="font-size:13px;color:var(--text-secondary);margin-top:4px">${c.desc}</div>
            <div style="font-size:12px;color:var(--text-hint);margin-top:2px">时长：${c.duration}分钟</div>
          </div>
        </div>
      `).join('')}
    </div>

    <button class="btn btn-primary btn-block" style="margin:20px 12px;width:calc(100% - 24px)" onclick="alert('进入课程学习：${module.title}')">开始学习</button>
  `;
}

// === 曲谱播放页面 ===
function initScorePlayer(scoreId) {
  const score = MockData.scores.find(s => s.id === scoreId) || MockData.scores[0];
  AppState.selectedScore = score;
  let currentNoteIndex = -1;
  let isPlaying = false;
  let playTimer = null;

  document.getElementById('page-score-player').innerHTML = `
    <div class="nav-header">
      <div class="back-btn" onclick="navigateBack()">←</div>
      <div class="nav-title" style="text-align:center">
        <div>${score.title}</div>
        <div style="font-size:12px;opacity:0.8">${score.key} · ${score.bpm}BPM</div>
      </div>
      <div class="nav-right">❤️</div>
    </div>

    <div class="score-display">
      <div style="font-size:14px;color:var(--text-secondary);margin-bottom:12px">🎵 简谱视图</div>
      <div class="score-notes" id="score-notes">
        ${score.notes.map((n, i) => `
          <div class="score-note" data-index="${i}">
            <div class="number">${noteToNumber(n.pitch)}</div>
            <div class="lyric">${n.lyric}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="lyric-display">
      <div class="label">当前歌词</div>
      <div class="text" id="current-lyric">准备播放...</div>
    </div>

    <div class="pitch-shift">
      <div style="font-size:13px;color:var(--text-secondary)">升降调</div>
      <div style="display:flex;align-items:center;gap:8px">
        <span id="pitch-shift-value" style="font-size:16px;font-weight:700;color:var(--primary)">0</span>
        <button class="control-btn" style="width:32px;height:32px;border-radius:16px;font-size:18px" onclick="adjustPitch(-1)">-</button>
        <button class="control-btn" style="width:32px;height:32px;border-radius:16px;font-size:18px" onclick="adjustPitch(1)">+</button>
      </div>
    </div>

    <div class="player-controls">
      <button class="control-btn" onclick="prevNote()">⏮</button>
      <button class="play-btn" id="play-btn" onclick="togglePlay()">▶</button>
      <button class="control-btn" onclick="nextNote()">⏭</button>
    </div>
  `;

  window.togglePlay = function() {
    isPlaying = !isPlaying;
    document.getElementById('play-btn').textContent = isPlaying ? '⏸' : '▶';
    if (isPlaying) {
      startPlayback();
    } else {
      stopPlayback();
    }
  };

  window.prevNote = function() {
    currentNoteIndex = Math.max(0, currentNoteIndex - 1);
    updateNoteHighlight();
  };

  window.nextNote = function() {
    currentNoteIndex++;
    if (currentNoteIndex >= score.notes.length) currentNoteIndex = 0;
    updateNoteHighlight();
  };

  let pitchShift = 0;
  window.adjustPitch = function(delta) {
    pitchShift = Math.max(-5, Math.min(5, pitchShift + delta));
    document.getElementById('pitch-shift-value').textContent = pitchShift > 0 ? `+${pitchShift}` : pitchShift;
  };

  function startPlayback() {
    const interval = 60000 / score.bpm;
    playTimer = setInterval(() => {
      currentNoteIndex++;
      if (currentNoteIndex >= score.notes.length) {
        currentNoteIndex = 0;
      }
      updateNoteHighlight();
    }, interval);
  }

  function stopPlayback() {
    if (playTimer) {
      clearInterval(playTimer);
      playTimer = null;
    }
  }

  function updateNoteHighlight() {
    document.querySelectorAll('.score-note').forEach((el, i) => {
      el.classList.toggle('current', i === currentNoteIndex);
    });
    if (currentNoteIndex >= 0 && score.notes[currentNoteIndex]) {
      document.getElementById('current-lyric').textContent = score.notes[currentNoteIndex].lyric;
    }
  }
}

// === 声乐DNA页面 ===
function initVocalDNA() {
  const dna = MockData.vocalDNA;
  document.getElementById('page-vocal-dna').innerHTML = `
    <div class="nav-header">
      <div class="back-btn" onclick="navigateBack()">←</div>
      <div class="nav-title">声乐DNA档案</div>
      <div class="nav-right"></div>
    </div>

    <div class="voice-type-card">
      <div class="icon">🎤</div>
      <div class="type">${dna.voiceType}</div>
      <div style="font-size:13px;color:var(--text-secondary);margin-top:4px">音域跨度：${dna.range.semitones}个半音</div>
    </div>

    <div class="card">
      <div class="card-title">音域范围</div>
      <div style="display:flex;align-items:center;justify-content:center;margin:16px 0">
        <span style="background:var(--error);color:#FFFFFF;padding:4px 8px;border-radius:8px;font-weight:700">${dna.range.lowest}</span>
        <span style="margin:0 12px;color:var(--text-hint)">→</span>
        <span style="background:var(--success);color:#FFFFFF;padding:4px 8px;border-radius:8px;font-weight:700">${dna.range.highest}</span>
      </div>
      <div style="position:relative;height:24px;background:#E5E7EB;border-radius:12px;overflow:hidden">
        <div style="position:absolute;left:20%;width:50%;height:100%;background:rgba(108,99,255,0.5);display:flex;align-items:center;justify-content:center;font-size:11px;color:#FFFFFF">舒适区</div>
      </div>
    </div>

    <div class="timbre-bars">
      <div class="card-title">音色特征</div>
      ${dna.timbre.map(t => `
        <div class="timbre-bar">
          <div class="name">${t.name}</div>
          <div class="track"><div class="fill" style="width:${t.value}%"></div></div>
          <div class="value">${t.value}</div>
        </div>
      `).join('')}
    </div>

    <div class="card">
      <div style="display:flex;align-items:center;margin-bottom:8px"><span style="font-size:20px">💡</span><span style="font-size:16px;font-weight:500;margin-left:8px">声音分析</span></div>
      <div style="font-size:14px;color:var(--text-secondary);line-height:24px">${dna.description}</div>
    </div>

    <button class="btn btn-primary btn-block" style="margin:20px 12px;width:calc(100% - 24px)" onclick="navigateTo('detection-running')">重新测试音域</button>
  `;
}

// === 成长曲线页面 ===
function initGrowthChart() {
  const growth = MockData.growthData;
  const avg = Math.round(growth.weekly.reduce((a, b) => a + b, 0) / growth.weekly.length);
  const max = Math.max(...growth.weekly);
  const progress = growth.weekly[growth.weekly.length - 1] - growth.weekly[0];

  document.getElementById('page-growth').innerHTML = `
    <div class="nav-header">
      <div class="back-btn" onclick="navigateBack()">←</div>
      <div class="nav-title">成长曲线</div>
      <div class="nav-right"></div>
    </div>

    <div class="period-tabs">
      ${['周', '月', '年'].map((p, i) => `<div class="period-tab ${i === 0 ? 'active' : ''}" onclick="selectGrowthPeriod(${i})">${p}</div>`).join('')}
    </div>

    <div class="growth-chart">
      <div class="card-title">综合评分趋势</div>
      <canvas id="growth-canvas" style="width:100%"></canvas>
      <div class="growth-stats">
        <div class="item"><div class="label">本期平均</div><div class="value" style="color:var(--primary)">${avg}</div></div>
        <div class="item"><div class="label">最高分</div><div class="value" style="color:var(--success)">${max}</div></div>
        <div class="item"><div class="label">进步幅度</div><div class="value" style="color:var(--success)">+${progress}</div></div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">🏆 学习里程碑</div>
      ${growth.milestones.map(m => `
        <div class="milestone-item">
          <div class="icon">${m.icon}</div>
          <div class="info"><div class="title">${m.title}</div><div class="desc">${m.desc}</div></div>
          <div class="date">${m.date}</div>
        </div>
      `).join('')}
    </div>
  `;

  setTimeout(() => {
    drawLineChart('growth-canvas', growth.weekly, growth.weeklyLabels);
  }, 100);
}

window.selectGrowthPeriod = function(index) {
  document.querySelectorAll('.period-tab').forEach((t, i) => {
    t.classList.toggle('active', i === index);
  });
  const data = [MockData.growthData.weekly, [65, 68, 70, 72, 75, 78, 80, 82, 85, 86, 88, 90], [55, 60, 65, 70, 75, 80, 85, 90]];
  const labels = [MockData.growthData.weeklyLabels, ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'], ['Q1', 'Q2', 'Q3', 'Q4']];
  drawLineChart('growth-canvas', data[index], labels[index]);
};

// === 成就徽章页面 ===
function initAchievements() {
  const achievements = MockData.achievements;
  const unlocked = achievements.filter(a => a.unlocked).length;

  document.getElementById('page-achievements').innerHTML = `
    <div class="nav-header">
      <div class="back-btn" onclick="navigateBack()">←</div>
      <div class="nav-title">成就徽章</div>
      <div class="nav-right"></div>
    </div>

    <div class="voice-type-card">
      <div style="font-size:48px">🏆</div>
      <div style="font-size:32px;font-weight:700;margin-top:8px">${unlocked}/${achievements.length}</div>
      <div style="font-size:13px;color:var(--text-secondary);margin-top:4px">已解锁${Math.round(unlocked / achievements.length * 100)}%</div>
      <div style="width:80%;height:8px;background:#E5E7EB;border-radius:4px;margin-top:12px;overflow:hidden">
        <div style="width:${unlocked / achievements.length * 100}%;height:100%;background:linear-gradient(90deg,#FFD700,#FFA500);border-radius:4px"></div>
      </div>
    </div>

    <div class="card">
      <div class="achievement-grid">
        ${achievements.map(a => `
          <div class="achievement-item">
            <div class="achievement-icon ${a.unlocked ? 'unlocked' : 'locked'}">${a.icon}</div>
            <div class="achievement-title">${a.title}</div>
            <div class="achievement-status ${a.unlocked ? 'unlocked' : 'locked'}">
              ${a.unlocked ? '已解锁' : (a.progress !== undefined ? `${a.progress}/${a.target}` : '未解锁')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// === AI私教页面 ===
function initAICoach() {
  const messages = [{ role: 'ai', content: '你好！我是你的AI声乐私教🎵 有任何关于唱歌的问题都可以问我，比如气息、音准、高音、颤音等技巧。' }];

  document.getElementById('page-ai-coach').innerHTML = `
    <div class="nav-header">
      <div class="back-btn" onclick="navigateBack()">←</div>
      <div class="nav-title" style="text-align:center">
        <div>🤖 AI私教</div>
        <div style="font-size:11px;color:var(--success)">● 在线</div>
      </div>
      <div class="nav-right"></div>
    </div>

    <div id="chat-messages" style="flex:1;overflow-y:auto;padding:16px"></div>

    <div class="quick-questions" id="quick-questions">
      ${['如何改善气息？', '高音上不去怎么办？', '如何练习颤音？', '唱歌时紧张怎么办？'].map(q => `
        <div class="quick-question" onclick="sendQuickQuestion('${q}')">${q}</div>
      `).join('')}
    </div>

    <div class="chat-input">
      <input type="text" id="chat-input-field" placeholder="输入你的问题..." onkeypress="if(event.key==='Enter')sendChatMessage()">
      <button onclick="sendChatMessage()">发送</button>
    </div>
  `;

  function renderMessages() {
    const container = document.getElementById('chat-messages');
    container.innerHTML = messages.map(m => `
      <div class="chat-message ${m.role}">
        ${m.role === 'ai' ? '<div class="ai-avatar">🤖</div>' : ''}
        <div class="chat-bubble">${m.content.replace(/\n/g, '<br>')}</div>
      </div>
    `).join('');
    container.scrollTop = container.scrollHeight;
  }

  renderMessages();

  window.sendChatMessage = function() {
    const input = document.getElementById('chat-input-field');
    const text = input.value.trim();
    if (!text) return;
    messages.push({ role: 'user', content: text });
    input.value = '';
    renderMessages();

    // 显示思考中
    messages.push({ role: 'ai', content: '正在思考...', thinking: true });
    renderMessages();

    setTimeout(() => {
      messages.pop();
      const reply = getAIReply(text);
      messages.push({ role: 'ai', content: reply });
      renderMessages();
    }, 1200);
  };

  window.sendQuickQuestion = function(q) {
    document.getElementById('chat-input-field').value = q;
    sendChatMessage();
  };

  function getAIReply(question) {
    const replies = MockData.aiReplies;
    for (const key in replies) {
      if (question.includes(key)) return replies[key];
    }
    return `这是个很好的问题！关于"${question}"，建议你：\n1. 可以在课程中心找到对应的专项课程\n2. 使用AI检测功能分析当前问题\n3. 坚持每日练习，循序渐进\n\n如果需要更详细的指导，随时告诉我！`;
  }
}

// === 社区页面 ===
function initCommunity() {
  document.getElementById('page-community').innerHTML = `
    <div class="nav-header">
      <div class="back-btn" onclick="navigateBack()">←</div>
      <div class="nav-title">歌友社区</div>
      <div class="nav-right">+</div>
    </div>

    ${MockData.communityPosts.map(p => `
      <div class="post-card">
        <div class="post-header">
          <div class="post-avatar">${p.avatar}</div>
          <div class="post-user-info">
            <div class="name">${p.nickname}</div>
            <div class="time">${p.time}</div>
          </div>
          <div class="post-score" style="background:${getScoreColor(p.score)}">${p.score}分</div>
        </div>
        <div class="post-content">${p.content}</div>
        <div style="font-size:12px;color:var(--text-secondary);margin-top:8px">⏱️ 练习${p.minutes}分钟</div>
        <div class="post-actions">
          <span>❤️ ${p.likes}</span>
          <span>💬 ${p.comments}</span>
          <span style="margin-left:auto">分享</span>
        </div>
      </div>
    `).join('')}
  `;
}

// === 排行榜页面 ===
function initLeaderboard() {
  const entries = MockData.leaderboard;
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  document.getElementById('page-leaderboard').innerHTML = `
    <div class="nav-header">
      <div class="back-btn" onclick="navigateBack()">←</div>
      <div class="nav-title">排行榜</div>
      <div class="nav-right"></div>
    </div>

    <div class="period-tabs">
      ${['周榜', '月榜', '总榜'].map((p, i) => `<div class="period-tab ${i === 0 ? 'active' : ''}">${p}</div>`).join('')}
    </div>

    <div style="display:flex;align-items:flex-end;justify-content:center;margin:16px 12px;height:160px">
      <div style="flex:1;text-align:center">
        <div style="font-size:28px">🥈</div>
        <div style="width:56px;height:56px;border-radius:28px;background:#C0C0C0;display:flex;align-items:center;justify-content:center;font-size:32px;margin:4px auto">${top3[1].avatar}</div>
        <div style="font-size:12px">${top3[1].nickname}</div>
        <div style="font-size:13px;font-weight:700">${top3[1].score}分</div>
        <div style="width:60px;height:50px;background:#C0C0C0;border-radius:8px 8px 0 0;margin-top:4px"></div>
      </div>
      <div style="flex:1;text-align:center">
        <div style="font-size:28px">👑</div>
        <div style="width:56px;height:56px;border-radius:28px;background:#FFD700;display:flex;align-items:center;justify-content:center;font-size:32px;margin:4px auto">${top3[0].avatar}</div>
        <div style="font-size:12px">${top3[0].nickname}</div>
        <div style="font-size:13px;font-weight:700">${top3[0].score}分</div>
        <div style="width:60px;height:70px;background:#FFD700;border-radius:8px 8px 0 0;margin-top:4px"></div>
      </div>
      <div style="flex:1;text-align:center">
        <div style="font-size:28px">🥉</div>
        <div style="width:56px;height:56px;border-radius:28px;background:#CD7F32;display:flex;align-items:center;justify-content:center;font-size:32px;margin:4px auto">${top3[2].avatar}</div>
        <div style="font-size:12px">${top3[2].nickname}</div>
        <div style="font-size:13px;font-weight:700">${top3[2].score}分</div>
        <div style="width:60px;height:40px;background:#CD7F32;border-radius:8px 8px 0 0;margin-top:4px"></div>
      </div>
    </div>

    <div class="card">
      ${rest.map(e => `
        <div class="rank-item">
          <div class="rank-num">${e.rank}</div>
          <div class="rank-avatar">${e.avatar}</div>
          <div class="rank-name">${e.nickname}</div>
          <div class="rank-score">${e.score}分</div>
          <div class="rank-trend" style="color:${e.trend==='up'?'var(--success)':e.trend==='down'?'var(--error)':'var(--text-hint)'}">
            ${e.trend==='up'?'↑':e.trend==='down'?'↓':'—'}
          </div>
        </div>
      `).join('')}
    </div>

    <div style="position:absolute;bottom:0;left:0;right:0;background:var(--primary);color:#FFFFFF;padding:12px 16px;display:flex;align-items:center">
      <div style="width:32px;text-align:center;font-weight:700">42</div>
      <div style="width:36px;height:36px;border-radius:18px;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:20px">🎤</div>
      <div style="flex:1;margin-left:12px">我</div>
      <div style="font-weight:700">82分</div>
      <div style="margin-left:8px;color:#4CAF50">↑3</div>
    </div>
  `;
}
