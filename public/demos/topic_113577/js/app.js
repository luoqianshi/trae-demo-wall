/* ============================================================
 * 武林秘籍 · 成绩修炼系统 — 核心逻辑
 * ============================================================ */
(function () {
  'use strict';
  const WL = window.WL;
  const $ = (id) => document.getElementById(id);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

  const LS_KEY = 'wuLinMiJi_v1';
  let S = null;
  let chartInst = null;
  let curChart = 'radar';
  let curRank = 'total';
  let curAchCat = '全部';
  let focus = { mins:25, exp:30, label:'标准番茄', timer:null, remain:25*60, running:false, paused:false };
  let aiLoading = false;
  let soundEnabled = false;

  /* ---------- 声音反馈系统 ---------- */
  const audioCtx = typeof AudioContext !== 'undefined' ? new AudioContext() : null;
  function playSound(type) {
    if (!soundEnabled || !audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    switch (type) {
      case 'achievement':
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.15);
        osc.frequency.setValueAtTime(783.99, now + 0.3);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
        break;
      case 'focus':
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554.37, now + 0.2);
        osc.frequency.setValueAtTime(659.25, now + 0.4);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
        osc.start(now);
        osc.stop(now + 0.8);
        break;
      case 'correct':
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      case 'wrong':
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.setValueAtTime(150, now + 0.2);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
        break;
      case 'levelup':
        osc.frequency.setValueAtTime(330, now);
        osc.frequency.setValueAtTime(440, now + 0.12);
        osc.frequency.setValueAtTime(554.37, now + 0.24);
        osc.frequency.setValueAtTime(659.25, now + 0.36);
        osc.frequency.setValueAtTime(783.99, now + 0.48);
        osc.frequency.setValueAtTime(1046.5, now + 0.6);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
        osc.start(now);
        osc.stop(now + 1.2);
        break;
      case 'click':
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
        break;
      default:
        break;
    }
  }

  /* ---------- 设置管理 ---------- */
  function openSettings() {
    openModal('settingsModal');
    $('soundEnabled').checked = !!S.soundEnabled;
  }
  function saveSettings() {
    S.soundEnabled = $('soundEnabled').checked;
    soundEnabled = S.soundEnabled;
    save();
    closeModal('settingsModal');
    toast(S.soundEnabled ? '灵韵已开启，修炼更沉浸' : '灵韵已关闭');
  }

  /* ---------- 智谱 AI 调用 ---------- */
  function getApiKey() {
    return WL.AI_CONFIG.defaultKey || '';
  }
  async function callZhipuAI(prompt) {
    const apiKey = getApiKey();
    if (!apiKey) {
      return { error: '灵脉未通，仙师暂不可请' };
    }
    try {
      // 超时控制：30秒未响应视为感应失败
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const res = await fetch(WL.AI_CONFIG.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: WL.AI_CONFIG.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.8,
          top_p: 0.9
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        // 常见 HTTP 错误的修仙化提示
        if (res.status === 429) return { error: '仙务繁忙，请稍候再请' };
        if (res.status >= 500) return { error: '天机紊乱，仙阁震动，请稍候再试' };
        let msg = '天机有变，请稍候再试';
        try { const err = await res.json(); if (err.error?.message) msg = err.error.message; } catch (e) {}
        return { error: msg };
      }
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || '';
      return { content };
    } catch (e) {
      // 区分超时和断网
      if (e.name === 'AbortError' || e.name === 'TimeoutError') {
        toastNet('感应超时，仙师似在闭关中，请稍后再试');
        return { error: '感应超时，仙师似在闭关中，请稍后再试' };
      }
      toastNet('灵讯受阻，天地灵气不稳（网络异常，请检查网络）');
      return { error: '灵讯受阻，天地灵气不稳（网络异常，请检查网络）' };
    }
  }
  /* 对比填空题答案：支持数值容错和文本模糊匹配 */
  function checkFillAnswer(userAns, correctAns) {
    const u = String(userAns || '').trim().toLowerCase();
    const c = String(correctAns || '').trim().toLowerCase();
    if (!u || !c) return false;
    // 完全匹配
    if (u === c) return true;
    // 数值匹配（去除空格、单位等差异）
    const un = u.match(/[-+]?\d+\.?\d*/);
    const cn = c.match(/[-+]?\d+\.?\d*/);
    if (un && cn && Math.abs(parseFloat(un[0]) - parseFloat(cn[0])) < 0.01) return true;
    // 去除标点空格后匹配
    if (u.replace(/[\s，。、,.]+/g, '') === c.replace(/[\s，。、,.]+/g, '')) return true;
    return false;
  }
  async function generatePracticeQuestions(errorId) {
    const e = S.errorHistory.find(x=>x.id===errorId);
    if (!e) return { error: '错题不存在' };
    const asked = e.askedQuestions || [];
    const prompt = WL.buildPracticePrompt(e.subject, e.question, e.answer, e.analysis, asked);
    const result = await callZhipuAI(prompt);
    if (result.error) return { error: result.error };
    let questions;
    try {
      const jsonMatch = result.content.match(/\{[\s\S]*"questions"[\s\S]*\}/);
      if (!jsonMatch) return { error: '仙师传讯有误，请重试' };
      const parsed = JSON.parse(jsonMatch[0]);
      if (!parsed.questions || !parsed.questions.length) return { error: '仙师暂未赐题，请稍后再试' };
      questions = parsed.questions;
    } catch (err) {
      return { error: '仙师传讯有误，请重试' };
    }
    // 二次验证：让AI检查题目是否有错误
    try {
      const verifyPrompt = WL.buildVerifyPrompt(e.subject, questions);
      const verifyResult = await callZhipuAI(verifyPrompt);
      if (!verifyResult.error && verifyResult.content) {
        const vMatch = verifyResult.content.match(/\{[\s\S]*"questions"[\s\S]*\}/);
        if (vMatch) {
          const vParsed = JSON.parse(vMatch[0]);
          if (vParsed.questions && vParsed.questions.length) {
            questions = vParsed.questions;
          }
        }
      }
    } catch (err) { /* 验证失败就用原始题目 */ }
    return { questions };
  }
  function getFallbackQuestions(subject) {
    const bank = WL.PRACTICE[subject];
    if (!bank || !bank.length) return null;
    return bank.sort(()=>Math.random()-.5).slice(0,3);
  }

  /* ---------- 存储 ---------- */
  function load() {
    try { const raw = localStorage.getItem(LS_KEY); if (raw) return JSON.parse(raw); } catch (e) {}
    return null;
  }
  function save() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(S)); }
    catch (e) { toast('存储已满，建议修为清零后重修'); }
  }
  function resetAll() {
    showConfirm('确定要修为清零？全部记录将清除，重新开始修炼之路。', ()=>{
      localStorage.removeItem(LS_KEY);
      S = {
        currentStage: 'middle',
        currentGrade: '初二',
        examType: 'major',
        selectedElectives: ['physics','chemistry','biology'],
        cultivationExp: 0,
        achievements: [],
        chartViews: {},
        timeFlags: {},
        focusHistory: [],
        errorHistory: [],
        examHistory: [],
        plans: [],
        soundEnabled: S.soundEnabled,
        pickedSubjects: []
      };
      commentCache = {};
      save();
      refreshAll();
      renderAchCats(); renderAchGrid();
      toast('已重入江湖，万事开头难，加油！');
    });
  }

  /* ---------- 派生状态（供成就判定） ---------- */
  function buildState() {
    const eh = S.examHistory.slice().sort((a,b)=>a.date.localeCompare(b.date));
    // 连续记录天数
    const days = [...new Set(eh.map(e=>e.date))].sort();
    let streak = days.length ? 1 : 0;
    for (let i = days.length-1; i > 0; i--) {
      const d1 = new Date(days[i]), d0 = new Date(days[i-1]);
      if (Math.round((d1-d0)/86400000) === 1) streak++; else break;
    }
    // 最大进步 & 连续进步 & D→A
    let maxProgress = 0, consecProg = 0, dToA = false;
    for (let i = 1; i < eh.length; i++) {
      const dp = eh[i].total - eh[i-1].total;
      if (dp > maxProgress) maxProgress = dp;
      if (eh[i-1].avgPercent < 60 && eh[i].avgPercent >= 85) dToA = true;
    }
    // 连续进步次数
    for (let i = eh.length-1; i > 0; i--) {
      if (eh[i].total > eh[i-1].total) consecProg++; else break;
    }
    // 排名
    const userBest = eh.length ? Math.max(...eh.map(e=>e.total)) : 0;
    const userBestAvg = eh.length ? Math.max(...eh.map(e=>e.avgPercent)) : 0;
    const oppTotals = WL.MOCK_OPPONENTS.map(o => Math.max(o.scores[0].total, o.scores[1].total));
    const oppAvgs = WL.MOCK_OPPONENTS.map(o => Math.max(o.scores[0].avg, o.scores[1].avg));
    const allTotals = [...oppTotals, userBest].sort((a,b)=>b-a);
    const allAvgs = [...oppAvgs, userBestAvg].sort((a,b)=>b-a);
    const bestRank = userBest ? allTotals.indexOf(userBest)+1 : 99;
    const bestAccRank = userBestAvg ? allAvgs.indexOf(userBestAvg)+1 : 99;
    const beaten = userBest ? oppTotals.filter(t=>t<userBest).length : 0;
    // 专注
    const fh = S.focusHistory.filter(f=>f.completed);
    const focusTotal = fh.reduce((s,f)=>s+f.duration, 0);
    const fdays = [...new Set(fh.map(f=>f.date))].sort();
    let focusStreak = fdays.length ? 1 : 0;
    for (let i = fdays.length-1; i > 0; i--) {
      if (Math.round((new Date(fdays[i])-new Date(fdays[i-1]))/86400000)===1) focusStreak++; else break;
    }
    const today = new Date().toISOString().slice(0,10);
    const focusToday = fh.filter(f=>f.date===today).reduce((s,f)=>s+f.duration,0);
    // 时间节点
    const tf = S.timeFlags || {};
    return {
      examHistory: S.examHistory, achievements: S.achievements,
      focusHistory: S.focusHistory, errorHistory: S.errorHistory,
      cultivationExp: S.cultivationExp, chartViews: S.chartViews,
      streak, maxProgress, dToA, consecProg,
      bestRank, bestAccRank, beaten,
      unlockedCount: S.achievements.length,
      nightRecord: (tf.night||0)>=3, morningRecord: (tf.morning||0)>=3, noonRecord: (tf.noon||0)>=3, weekendRecord: (tf.weekend||0)>=3,
      focusTotal, focusStreak, focusToday,
      practiceDone: S.practiceDone||0, practiceFull: !!S.practiceFull, errorViews: S.errorViews||0
    };
  }

  /* ---------- 成就检测 ---------- */
  function checkAchievements() {
    const st = buildState();
    const newly = [];
    WL.ACHIEVEMENTS.forEach(a => {
      if (!S.achievements.includes(a.id)) {
        let ok = false;
        try { ok = !!a.check(st); } catch (e) { ok = false; }
        if (ok) { S.achievements.push(a.id); newly.push(a); }
      }
    });
    if (newly.length) { save(); newly.forEach((a,i)=>setTimeout(()=>toastAch(a), i*350)); }
  }

  /* ---------- Toast ---------- */
  function toast(msg) {
    const w = $('achToastWrap');
    const t = el('div', 'ach-toast');
    t.innerHTML = `<div class="ti">🔔</div><div class="tt"><div class="tn">提示</div><div class="td">${msg}</div></div>`;
    w.appendChild(t);
    setTimeout(()=>t.remove(), 4500);
  }
  /* 网络异常专用 toast：醒目、即时 */
  let netOffline = false;
  function toastNet(msg) {
    const w = $('achToastWrap');
    const t = el('div', 'ach-toast net-toast');
    t.innerHTML = `<div class="ti">⚠️</div><div class="tt"><div class="tn">灵讯受阻</div><div class="td">${msg}</div></div>`;
    w.appendChild(t);
    setTimeout(()=>t.remove(), 5000);
  }
  function toastAch(a) {
    const w = $('achToastWrap');
    const t = el('div', 'ach-toast');
    t.innerHTML = `<div class="ti">${a.icon}</div><div class="tt"><div class="tn">成就解锁 · ${a.name}</div><div class="td">${a.desc}</div></div>`;
    w.appendChild(t);
    setTimeout(()=>t.remove(), 4600);
    playSound('achievement');
  }

  /* ---------- 修为 ---------- */
  // 数字渐变动画：让修为数字平滑过渡，而非瞬间跳变
  function animateNum(el, to, suffix, duration) {
    suffix = suffix || ''; duration = duration || 600;
    const from = parseInt(el.dataset.val || '0', 10);
    if (from === to) { el.textContent = to + suffix; return; }
    el.dataset.val = to;
    const start = performance.now();
    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out
      const val = Math.round(from + (to - from) * eased);
      el.textContent = val + suffix;
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = to + suffix;
    }
    requestAnimationFrame(step);
  }
  function addExp(n, silent) {
    const prevRealm = WL.realmByExp(S.cultivationExp).idx;
    S.cultivationExp = Math.max(0, S.cultivationExp + n);
    const newRealm = WL.realmByExp(S.cultivationExp).idx;
    save();
    renderRealm();
    if (!silent) {
      const w = $('achToastWrap');
      const t = el('div', 'ach-toast');
      t.innerHTML = `<div class="ti">✨</div><div class="tt"><div class="tn">修为 +${n}</div><div class="td">当前修为 ${S.cultivationExp}</div></div>`;
      w.appendChild(t); setTimeout(()=>t.remove(), 4600);
    }
    if (newRealm > prevRealm) {
      playSound('levelup');
    }
    checkAchievements();
    renderAchCount();
  }

  /* ---------- 渲染：年级下拉 ---------- */
  function renderGrades() {
    const st = STAGE(); const sel = $('gradeSel');
    sel.innerHTML = st.grades.map(g=>`<option ${g===S.currentGrade?'selected':''}>${g}</option>`).join('');
  }
  function STAGE() { return WL.STAGES[S.currentStage]; }

  /* ---------- 渲染：修为境界 ---------- */
  function renderRealm() {
    const r = WL.realmByExp(S.cultivationExp);
    $('realmIcon').textContent = r.cur.icon;
    $('realmName').textContent = r.cur.name;
    $('realmSub').textContent = `第 ${r.idx+1} / ${WL.REALMS.length} 重境界${r.isTop?' · 已臻圆满':''}`;
    $('realmExp').textContent = S.cultivationExp + ' 修为';
    animateNum($('realmExp'), S.cultivationExp, ' 修为');
    $('progressBar').style.width = r.pct + '%';
    $('progressText').textContent = r.isTop
      ? `已达至高境界 · ${S.cultivationExp} 修为`
      : `距 ${r.next.name}：${r.ceil - S.cultivationExp} 修为（${r.pct.toFixed(0)}%）`;
    // 统计
    const eh = S.examHistory, fh = S.focusHistory.filter(f=>f.completed);
    const stats = [
      { num: eh.length, lbl:'考试记录', cls:'' },
      { num: S.achievements.length, lbl:'已解锁成就', cls:'gold' },
      { num: fh.length, lbl:'专注次数', cls:'jade' },
      { num: S.errorHistory.length, lbl:'错题收录', cls:'cinnabar' }
    ];
    $('realmStats').innerHTML = stats.map(s=>`<div class="stat-mini"><div class="num ${s.cls}">${s.num}</div><div class="lbl">${s.lbl}</div></div>`).join('');
    // 规则
    $('rulesChips').innerHTML = WL.EXP_RULES.map(r=>`<span class="rule-chip">${r.act} ${r.exp}</span>`).join('');
    // 评语入口副标题
    if (eh.length) {
      const lastExam = eh[eh.length-1];
      $('commentEntrySub').textContent = `${lastExam.date.slice(5)} · ${lastExam.total}分 · 点击查看`;
    } else {
      $('commentEntrySub').textContent = '尚无考核记录';
    }
  }

  /* ---------- 渲染：成绩录入表单 ---------- */
  function renderForm() {
    const st = STAGE();
    const selectedOpts = S.selectedElectives || [];
    const full = st.fullFor(S.currentGrade, S.examType, selectedOpts);
    $('formStageInfo').textContent = `${st.label} · ${S.currentGrade} · ${WL.EXAM_TYPES[S.examType].label}`;
    const cont = $('formSubjects'); cont.innerHTML = '';

    // 高中选考科目
    if (st.hasElectives) {
      const elecWrap = el('div', 'electives-wrap');
      elecWrap.innerHTML = `
        <div class="electives-title">
          <span>选考科目</span>
          <span class="electives-tip">小六门选3门或6门</span>
        </div>
        <div class="electives-chips" id="elecChips"></div>`;
      cont.appendChild(elecWrap);
      const chips = elecWrap.querySelector('#elecChips');
      st.electives.forEach(sub => {
        const chip = el('label', 'elec-chip');
        const checked = selectedOpts.includes(sub) ? 'checked' : '';
        chip.innerHTML = `<input type="checkbox" data-elec="${sub}" ${checked}><span>${WL.SUBJECTS[sub].name}</span>`;
        chip.querySelector('input').addEventListener('change', onElectiveChange);
        chips.appendChild(chip);
      });
      const tip = el('div', 'electives-rule');
      tip.textContent = `当前已选 ${selectedOpts.length} 门`;
      chips.appendChild(tip);
    }

    // 小考：选考科目（可自由勾选本次考了哪些）
    let examSubjects = st.subjectsFor(S.currentGrade, selectedOpts);
    if (S.examType === 'minor') {
      const pickWrap = el('div', 'electives-wrap pick-wrap');
      pickWrap.innerHTML = `
        <div class="electives-title">
          <span>本次考试科目</span>
          <span class="electives-tip">小考可单科录入，勾选本次考了的科目</span>
        </div>
        <div class="electives-chips" id="pickChips"></div>`;
      cont.appendChild(pickWrap);
      const chips = pickWrap.querySelector('#pickChips');
      let picked = S.pickedSubjects || [];
      examSubjects.forEach(sub => {
        const chip = el('label', 'elec-chip');
        const checked = picked.includes(sub) ? 'checked' : '';
        chip.innerHTML = `<input type="checkbox" data-pick="${sub}" ${checked}><span>${WL.SUBJECTS[sub].name}</span>`;
        chip.querySelector('input').addEventListener('change', onPickChange);
        chips.appendChild(chip);
      });
      const tip = el('div', 'electives-rule');
      tip.id = 'pickCount';
      tip.textContent = `已选 ${picked.length} 门`;
      chips.appendChild(tip);
      // 只渲染选中的科目
      examSubjects = examSubjects.filter(sub => picked.includes(sub));
      // 未选科目时显示提示
      if (examSubjects.length === 0) {
        const hint = el('div', 'pick-hint');
        hint.innerHTML = '👆 请先勾选本次考试的科目，勾选后即可录入分数';
        cont.appendChild(hint);
      }
    }

    examSubjects.forEach(sub => {
      const wrap = el('div', 'subject-input');
      wrap.innerHTML = `<label>${WL.SUBJECTS[sub].name}<span class="full-mark">满分 ${full[sub]}</span></label>
        <input type="number" min="0" max="${full[sub]}" data-sub="${sub}" data-full="${full[sub]}" placeholder="0 - ${full[sub]}">`;
      cont.appendChild(wrap);
    });
    cont.querySelectorAll('input[type="number"]').forEach(i=>{
      i.addEventListener('input', ()=>{
        const f = +i.dataset.full;
        const v = parseFloat(i.value);
        if (!isNaN(v) && v > f) {
          i.classList.add('error');
          i.value = f;
        } else {
          i.classList.remove('error');
        }
        renderSummary();
      });
    });
    renderSummary();
  }
  function onElectiveChange(e) {
    const sub = e.target.dataset.elec;
    const checked = e.target.checked;
    let opts = S.selectedElectives || [];
    if (checked) {
      if (!opts.includes(sub)) opts.push(sub);
    } else {
      opts = opts.filter(x=>x!==sub);
    }
    S.selectedElectives = opts;
    save();
    const rule = document.querySelector('.electives-rule');
    if (rule) rule.textContent = `当前已选 ${opts.length} 门`;
    renderForm();
  }
  function onPickChange(e) {
    const sub = e.target.dataset.pick;
    const checked = e.target.checked;
    let picked = S.pickedSubjects || [];
    if (checked) {
      if (!picked.includes(sub)) picked.push(sub);
    } else {
      picked = picked.filter(x=>x!==sub);
    }
    S.pickedSubjects = picked;
    save();
    const tip = $('pickCount');
    if (tip) tip.textContent = `已选 ${picked.length} 门`;
    renderForm();
  }
  function renderSummary() {
    const inputs = $('formSubjects').querySelectorAll('input[type="number"]');
    let total = 0, fullSum = 0, cnt = 0;
    inputs.forEach(i => {
      const v = parseFloat(i.value);
      if (!isNaN(v) && v >= 0) { total += v; fullSum += +i.dataset.full; cnt++; }
    });
    if (cnt === 0) {
      $('sumTotal').textContent = '—'; $('sumAvg').textContent = '—'; $('sumGrade').textContent = '—';
      $('sumGrade').className = 'sum-val'; return;
    }
    const avg = fullSum ? (total/fullSum*100) : 0;
    const g = WL.gradeOf(avg);
    $('sumTotal').textContent = total;
    $('sumAvg').textContent = avg.toFixed(1) + '%';
    $('sumGrade').textContent = g.level;
    $('sumGrade').className = 'sum-val grade-' + g.level.toLowerCase();
  }

  /* ---------- 提交成绩 ---------- */
  function submitExam() {
    const inputs = $('formSubjects').querySelectorAll('input[type="number"]');
    const scores = {}; let total = 0, fullSum = 0, filled = 0;
    const full = {};
    let hasError = false;
    inputs.forEach(i => {
      i.classList.remove('error');
      const sub = i.dataset.sub, f = +i.dataset.full;
      full[sub] = f;
      const v = parseFloat(i.value);
      if (!isNaN(v) && v >= 0) {
        if (v > f) {
          i.classList.add('error');
          toast(`${WL.SUBJECTS[sub].name}请重新输入（不能超过满分${f}分）`);
          i.focus(); i.select(); hasError = true;
        } else {
          scores[sub] = v; total += v; fullSum += f; filled++;
        }
      }
    });
    if (hasError) return;
    const totalSubjects = inputs.length;
    if (S.examType === 'major') {
      // 大考：每科都必须填写
      if (filled < totalSubjects) {
        toast('大考需填写全部学科成绩');
        inputs.forEach(i => { if (!i.value.trim()) i.classList.add('error'); });
        return;
      }
    } else {
      // 小考：选了科目就必须填，没选科目要提示
      if (totalSubjects === 0) { toast('请先勾选本次考试科目'); return; }
      if (filled < totalSubjects) {
        toast('请填写已选科目的成绩');
        inputs.forEach(i => { if (!i.value.trim()) i.classList.add('error'); });
        return;
      }
    }
    const avg = fullSum ? (total/fullSum*100) : 0;
    const now = new Date();
    const rec = {
      id: Date.now(), date: now.toISOString().slice(0,10),
      stage: S.currentStage, grade: S.currentGrade, examType: S.examType,
      scores, full, total, avgPercent: +avg.toFixed(1)
    };
    S.examHistory.push(rec);
    // 修为：基础 + 分数加成 + 进步 + 满分
    let exp = 5 + Math.round(avg/25);
    if (S.examHistory.length >= 2) {
      const prev = S.examHistory[S.examHistory.length-2];
      if (total > prev.total) { exp += 8; }
    }
    Object.keys(scores).forEach(k=>{ if (full[k] && scores[k] >= full[k]) exp += 6; });
    // 时间节点（计数制）
    const tf = S.timeFlags || (S.timeFlags={});
    const h = now.getHours(), day = now.getDay();
    if (h >= 22 || h < 5) tf.night = (tf.night||0)+1;
    if (h < 7) tf.morning = (tf.morning||0)+1;
    if (h >= 12 && h < 14) tf.noon = (tf.noon||0)+1;
    if (day === 0 || day === 6) tf.weekend = (tf.weekend||0)+1;
    addExp(exp);
    save();
    refreshAll();
    toast(`记录成功！本次 ${total} 分，等级 ${WL.gradeOf(avg).level}，修为 +${exp}`);
    // 清空输入
    inputs.forEach(i=>i.value='');
    renderSummary();
    // 自动弹出仙师评语
    setTimeout(()=>openComment(rec.id), 600);
  }

  /* ---------- 渲染：图表 ---------- */
  let curSubject = null; // 单科分析当前选中科目
  function updateChartTabs() {
    const isMinor = S.examType === 'minor';
    document.querySelectorAll('.chart-tab').forEach(t => {
      const type = t.dataset.chart;
      const hide = isMinor && (type === 'radar' || type === 'bar' || type === 'pie');
      t.style.display = hide ? 'none' : '';
    });
    // 小考时如果当前图表被隐藏，切换到 line
    if (isMinor && (curChart === 'radar' || curChart === 'bar' || curChart === 'pie')) {
      curChart = 'line';
      document.querySelectorAll('.chart-tab').forEach(t=>t.classList.toggle('active', t.dataset.chart==='line'));
      if (typeof Chart !== 'undefined' && S.examHistory.length) {
        renderChart('line');
      }
    }
  }
  function renderChart(type) {
    curChart = type;
    updateChartTabs();
    document.querySelectorAll('.chart-tab').forEach(t=>t.classList.toggle('active', t.dataset.chart===type));
    const empty = $('chartEmpty'); const cv = $('mainChart');
    if (!S.examHistory.length) { empty.hidden = false; cv.hidden = true; $('chartSubjectBar').hidden = true; return; }
    // Chart.js 未加载（CDN 失败）时显示修仙化提示
    if (typeof Chart === 'undefined') {
      cv.hidden = true;
      empty.hidden = false;
      empty.innerHTML = '天机盘未通灵，灵气不足难以显象（图表库加载失败，请检查网络）';
      $('chartSubjectBar').hidden = true;
      return;
    }
    empty.innerHTML = '尚无成绩记录，先去录入一次考试吧';
    empty.hidden = true; cv.hidden = false;
    if (chartInst) { chartInst.destroy(); chartInst = null; }
    // 单科分析才显示科目选择栏
    $('chartSubjectBar').hidden = (type !== 'subject');
    // 记录查看
    S.chartViews[type] = (S.chartViews[type]||0)+1; save();
    const last = S.examHistory[S.examHistory.length-1];
    const subs = Object.keys(last.scores);
    const names = subs.map(k=>WL.SUBJECTS[k].name);
    const colors = subs.map(k=>WL.SUBJECTS[k].color);
    const ctx = cv.getContext('2d');
    const font = { family: "'Noto Serif SC', serif", size: 12 };
    const grid = 'rgba(140,126,106,.15)';
    const opts = { responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ labels:{ font, color:'#5a5048' } } },
      scales: (type==='pie'||type==='subject') ? {} : { x:{ ticks:{font,color:'#8c7e6a'}, grid:{color:grid} }, y:{ ticks:{font,color:'#8c7e6a'}, grid:{color:grid}, beginAtZero:true } }
    };

    if (type === 'radar') {
      chartInst = new Chart(ctx, { type:'radar', data:{ labels:names,
        datasets:[{ label:'能力图谱（正确率%）', data: subs.map(k=> +(last.scores[k]/last.full[k]*100).toFixed(1) ),
          backgroundColor:'rgba(43,76,126,.15)', borderColor:'#2b4c7e', borderWidth:2, pointBackgroundColor:'#c23a2b' }] },
        options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{labels:{font,color:'#5a5048'}}},
          scales:{ r:{ beginAtZero:true, max:100, ticks:{font,color:'#8c7e6a',backdropColor:'transparent'}, grid:{color:grid}, angleLines:{color:grid}, pointLabels:{font:{...font,size:13},color:'#2c2c2c'} } } } });
    } else if (type === 'bar') {
      chartInst = new Chart(ctx, { type:'bar', data:{ labels:names,
        datasets:[{ label:'本次各科得分', data: subs.map(k=>last.scores[k]), backgroundColor:colors.map(c=>c+'cc'), borderColor:colors, borderWidth:1, borderRadius:4 }] }, options:opts });
    } else if (type === 'line') {
      const sorted = S.examHistory.slice().sort((a,b)=>a.date.localeCompare(b.date));
      const isMinorExam = last.examType === 'minor';
      if (isMinorExam) {
        // 小考：展示本次考试各科目的历次得分走势
        const datasets = subs.map((k, i) => {
          const data = sorted.map(e => e.scores[k] != null ? e.scores[k] : null);
          return {
            label: WL.SUBJECTS[k].name + '得分',
            data,
            borderColor: colors[i],
            backgroundColor: colors[i] + '22',
            borderWidth: 2, tension: .35, fill: false,
            pointBackgroundColor: colors[i], pointRadius: 4,
            spanGaps: true
          };
        });
        chartInst = new Chart(ctx, { type:'line', data:{ labels: sorted.map(e=>e.date.slice(5)), datasets }, options:opts });
      } else {
        chartInst = new Chart(ctx, { type:'line', data:{ labels: sorted.map(e=>e.date.slice(5)),
          datasets:[{ label:'总分历程', data: sorted.map(e=>e.total), borderColor:'#b8860b', backgroundColor:'rgba(184,134,11,.12)', borderWidth:2, tension:.35, fill:true, pointBackgroundColor:'#c23a2b', pointRadius:4 }] }, options:opts });
      }
    } else if (type === 'pie') {
      chartInst = new Chart(ctx, { type:'pie', data:{ labels:names,
        datasets:[{ data: subs.map(k=>last.scores[k]), backgroundColor: colors.map(c=>c+'d0'), borderColor:'#fffdf8', borderWidth:2 }] },
        options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{labels:{font,color:'#5a5048'},position:'right'}} } });
    } else if (type === 'subject') {
      renderSubjectChart();
    }
    checkAchievements();
  }
  /* 单科分析：展示某科目历次考试的得分与正确率走势 */
  function renderSubjectChart() {
    const cv = $('mainChart');
    // 收集所有考试中出现过的科目
    const allSubs = [...new Set(S.examHistory.flatMap(e => Object.keys(e.scores)))];
    const sel = $('chartSubjectSel');
    // 若已选科目不在列表中，则重置
    if (!curSubject || !allSubs.includes(curSubject)) curSubject = allSubs[0];
    sel.innerHTML = allSubs.map(k=>`<option value="${k}" ${k===curSubject?'selected':''}>${WL.SUBJECTS[k].name}</option>`).join('');
    if (chartInst) { chartInst.destroy(); chartInst = null; }
    const sorted = S.examHistory.slice().sort((a,b)=>a.date.localeCompare(b.date));
    // 该科目有记录的考试
    const records = sorted.filter(e => e.scores[curSubject] != null);
    if (!records.length) return;
    const labels = records.map(e=>e.date.slice(5));
    const scoreData = records.map(e=>e.scores[curSubject]);
    const pctData = records.map(e=>+(e.scores[curSubject]/e.full[curSubject]*100).toFixed(1));
    const subColor = WL.SUBJECTS[curSubject].color;
    const ctx = cv.getContext('2d');
    const font = { family: "'Noto Serif SC', serif", size: 12 };
    const grid = 'rgba(140,126,106,.15)';
    chartInst = new Chart(ctx, { type:'line', data:{ labels,
      datasets:[
        { label:`${WL.SUBJECTS[curSubject].name}得分`, data:scoreData,
          borderColor:subColor, backgroundColor:subColor+'22', borderWidth:2, tension:.35, fill:true,
          pointBackgroundColor:'#c23a2b', pointRadius:4, yAxisID:'y' },
        { label:`正确率(%)`, data:pctData,
          borderColor:'#b8860b', backgroundColor:'rgba(184,134,11,.1)', borderWidth:2, tension:.35, fill:false,
          pointBackgroundColor:'#b8860b', pointRadius:3, yAxisID:'y1', borderDash:[6,4] }
      ] },
      options:{ responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{ labels:{ font, color:'#5a5048' } },
          tooltip:{ callbacks:{ label:(c)=>{ const ds=c.dataset.label; return ` ${ds}：${c.parsed.y}${ds.includes('%')?'%':'分'}`; } } } },
        scales:{
          x:{ ticks:{font,color:'#8c7e6a'}, grid:{color:grid} },
          y:{ position:'left', beginAtZero:true, title:{display:true,text:'得分',font,color:'#8c7e6a'}, ticks:{font,color:'#8c7e6a'}, grid:{color:grid} },
          y1:{ position:'right', beginAtZero:true, max:100, title:{display:true,text:'正确率(%)',font,color:'#b8860b'}, ticks:{font,color:'#b8860b'}, grid:{display:false} }
        }
      } });
  }

  /* ---------- 渲染：排行榜 ---------- */
  /* 排行榜单位配置 */
  const RANK_UNITS = { total:'', avg:'%', exp:'', error:'题', focus:'分', ach:'个' };
  function renderRank() {
    curRank = document.querySelector('.rank-tab.active').dataset.rank;
    const list = [];
    WL.MOCK_OPPONENTS.forEach(o => {
      let val;
      switch (curRank) {
        case 'total': val = Math.max(o.scores[0].total, o.scores[1].total); break;
        case 'avg':   val = Math.max(o.scores[0].avg, o.scores[1].avg); break;
        case 'exp':   val = o.exp; break;
        case 'error': val = o.errors; break;
        case 'focus': val = o.focus; break;
        case 'ach':   val = o.achs; break;
        default: val = 0;
      }
      list.push({ name:o.name, avatar:o.avatar, val:+val.toFixed(1), me:false });
    });
    if (curRank === 'total' || curRank === 'avg') {
      if (S.examHistory.length) {
        const myBest = curRank==='total'
          ? Math.max(...S.examHistory.map(e=>e.total))
          : +Math.max(...S.examHistory.map(e=>e.avgPercent)).toFixed(1);
        list.push({ name:'我', avatar:'🗡️', val:myBest, me:true });
      }
    } else {
      // 修为/错题/专注/成就榜
      let myVal = 0;
      if (curRank === 'exp')   myVal = S.cultivationExp;
      if (curRank === 'error') myVal = S.errorHistory.length;
      if (curRank === 'focus') { const fh = S.focusHistory.filter(f=>f.completed); myVal = fh.reduce((s,f)=>s+f.duration,0); }
      if (curRank === 'ach')   myVal = S.achievements.length;
      list.push({ name:'我', avatar:'🗡️', val:myVal, me:true });
    }
    list.sort((a,b)=>b.val-a.val);
    const unit = RANK_UNITS[curRank] || '';
    const cont = $('rankList'); cont.innerHTML = '';
    list.forEach((it,i) => {
      const rankCls = i===0?'top1':i===1?'top2':i===2?'top3':'';
      const row = el('div', `rank-item ${rankCls} ${it.me?'me':''}`);
      row.innerHTML = `<div class="rank-no">${i+1}</div>
        <div class="rank-avatar">${it.avatar}</div>
        <div class="rank-name">${it.name}${it.me?'<span class="me-tag">（你）</span>':''}</div>
        <div class="rank-val ${curRank==='avg'?'avg':''}">${it.val}${unit}</div>`;
      cont.appendChild(row);
    });
  }

  /* ---------- 渲染：修炼记录 ---------- */
  function renderRecord() {
    const body = $('recordBody');
    $('recordCount').textContent = `共 ${S.examHistory.length} 次记录`;
    if (!S.examHistory.length) { body.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:2rem">尚无记录，先去录入一次考试吧</td></tr>`; return; }
    const sorted = S.examHistory.slice().reverse();
    body.innerHTML = sorted.map(e => {
      const g = WL.gradeOf(e.avgPercent);
      const chips = Object.keys(e.scores).map(k=>`<span class="score-chip">${WL.SUBJECTS[k].name} ${e.scores[k]}</span>`).join('');
      return `<tr>
        <td>${e.date.slice(5)}</td><td>${WL.STAGES[e.stage].label}${e.grade}</td>
        <td>${WL.EXAM_TYPES[e.examType].label}</td><td>${chips}</td>
        <td><b>${e.total}</b></td><td>${e.avgPercent}%</td>
        <td><span class="grade-badge" style="background:${g.color}">${g.level}</span></td>
        <td><button class="btn-ghost comment-btn" data-eid="${e.id}">仙师评语</button></td></tr>`;
    }).join('');
    // 绑定评语按钮
    body.querySelectorAll('.comment-btn').forEach(b => {
      b.onclick = () => openComment(+b.dataset.eid);
    });
  }

  /* ---------- 渲染：专注统计 ---------- */
  function renderFocusStats() {
    const fh = S.focusHistory.filter(f=>f.completed);
    const total = fh.reduce((s,f)=>s+f.duration,0);
    const today = new Date().toISOString().slice(0,10);
    const todayMin = fh.filter(f=>f.date===today).reduce((s,f)=>s+f.duration,0);
    const todayCnt = fh.filter(f=>f.date===today).length;
    // 连续天数
    const days = [...new Set(fh.map(f=>f.date))].sort();
    let streak = days.length ? 1 : 0;
    for (let i = days.length-1; i > 0; i--) { if (Math.round((new Date(days[i])-new Date(days[i-1]))/86400000)===1) streak++; else break; }
    const errCount = S.errorHistory.length;
    const masteredCount = S.errorHistory.filter(e=>e.mastered).length;
    const pracCount = S.practiceDone || 0;
    const stats = [
      { num: fh.length, lbl:'闭关次数', color:'jade' },
      { num: total+'分', lbl:'累计时长', color:'jade' },
      { num: todayMin+'分', lbl:'今日时长', color:'jade' },
      { num: streak+'天', lbl:'连续天数', color:'jade' },
      { num: errCount, lbl:'错题收录', sub: masteredCount+' 已掌握', color:'cinnabar' },
      { num: pracCount, lbl:'举一反三', sub:'练习次数', color:'gold' }
    ];
    $('focusStats').innerHTML = stats.map(s=>`
      <div class="fstat">
        <div class="num ${s.color||''}">${s.num}</div>
        <div class="lbl">${s.lbl}</div>
        ${s.sub?`<div class="fsub">${s.sub}</div>`:''}
      </div>`).join('');
    // 弹窗内迷你统计实时更新
    const mini = $('focusStatMini');
    if (mini) {
      mini.innerHTML = `<div class="fsm-item"><span class="fsm-num">${fh.length}</span><span class="fsm-lbl">总闭关</span></div>
        <div class="fsm-item"><span class="fsm-num">${total}</span><span class="fsm-lbl">累计分钟</span></div>
        <div class="fsm-item"><span class="fsm-num">${todayCnt}</span><span class="fsm-lbl">今日次数</span></div>
        <div class="fsm-item"><span class="fsm-num">${todayMin}</span><span class="fsm-lbl">今日分钟</span></div>
        <div class="fsm-item"><span class="fsm-num">${streak}</span><span class="fsm-lbl">连续天数</span></div>`;
    }
  }

  /* ---------- 成就计数 ---------- */
  function renderAchCount() {
    $('achCount').textContent = `已解锁 ${S.achievements.length} / ${WL.ACHIEVEMENTS.length}`;
  }

  /* ---------- 成就墙 ---------- */
  function renderAchCats() {
    const cats = ['全部', ...WL.ACH_CATS];
    $('achCats').innerHTML = cats.map(c=>`<button class="ach-cat ${c===curAchCat?'active':''}" data-cat="${c}">${c}</button>`).join('');
    $('achCats').querySelectorAll('.ach-cat').forEach(b=>b.onclick=()=>{ curAchCat=b.dataset.cat; renderAchCats(); renderAchGrid(); });
  }
  function renderAchGrid() {
    const total = WL.ACHIEVEMENTS.length, got = S.achievements.length;
    $('achProgressText').textContent = `${got} / ${total}`;
    $('achProgressBar').style.width = (got/total*100) + '%';
    const list = curAchCat==='全部' ? WL.ACHIEVEMENTS : WL.ACHIEVEMENTS.filter(a=>a.cat===curAchCat);
    $('achGrid').innerHTML = list.map(a=>{
      const unlocked = S.achievements.includes(a.id);
      return `<div class="ach-cell ${unlocked?'unlocked':'locked'}">
        <div class="ach-icon">${unlocked?a.icon:'🔒'}</div>
        <div class="ach-name">${a.name}</div>
        <div class="ach-desc">${unlocked?a.desc:'未解锁'}</div></div>`;
    }).join('');
  }

  /* ============ 专注 ============ */
  function openFocus() { openModal('focusModal'); renderFocusOptions(); resetFocusUI(); renderFocusStats(); }
  function renderFocusOptions() {
    $('focusOptions').innerHTML = WL.FOCUS_OPTIONS.map((o,i)=>`<button class="fopt ${o.mins===focus.mins?'active':''}" data-i="${i}"><div class="m">${o.mins}分</div><div class="l">${o.label}</div></button>`).join('');
    $('focusOptions').querySelectorAll('.fopt').forEach(b=>b.onclick=()=>{
      const o = WL.FOCUS_OPTIONS[+b.dataset.i]; focus.mins=o.mins; focus.exp=o.exp; focus.label=o.label;
      renderFocusOptions(); resetFocusUI();
    });
  }
  function applyCustomTime() {
    const h = parseInt($('custHour').value) || 0;
    const m = parseInt($('custMin').value) || 0;
    const total = h * 60 + m;
    if (total <= 0) { toast('请输入有效时长'); return; }
    focus.mins = total;
    focus.label = `自定义 ${total} 分钟`;
    // 5分钟以下不加修为，5分钟以上每分钟+1修为
    focus.exp = total < 5 ? 0 : total * 1;
    // 清除预设按钮的选中状态
    $('focusOptions').querySelectorAll('.fopt').forEach(b=>b.classList.remove('active'));
    if (total < 5) toast('时长不足5分钟，完成后不加修为');
    else toast(`已设置 ${total} 分钟，完成后修为 +${focus.exp}`);
    resetFocusUI();
  }
  function resetFocusUI() {
    focus.remain = focus.mins*60; focus.running=false; focus.paused=false;
    if (focus.timer) { clearInterval(focus.timer); focus.timer=null; }
    $('focusOrb').classList.remove('active');
    $('focusStart').hidden=false; $('focusPause').hidden=true; $('focusGiveUp').hidden=true;
    $('focusStart').textContent='开始闭关';
    updateFocusDisplay();
  }
  const QUOTES = ['心若冰清，天塌不惊','守一息灵光，万念归一','静水流深，厚积薄发','心如止水，意如明月','一念不生，万境澄明'];
  function updateFocusDisplay() {
    const m = Math.floor(focus.remain/60), s = focus.remain%60;
    $('focusTime').textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    $('focusLabel').textContent = focus.label;
    $('focusQuote').textContent = QUOTES[Math.floor(Math.random()*QUOTES.length)];
    const C = 2*Math.PI*54, pct = 1 - focus.remain/(focus.mins*60);
    $('orbProgress').setAttribute('stroke-dashoffset', (C*(1-pct)).toFixed(2));
  }
  function startFocus() {
    if (focus.running && !focus.paused) return;
    focus.running=true; focus.paused=false;
    $('focusOrb').classList.add('active');
    $('focusStart').hidden=true; $('focusPause').hidden=false; $('focusGiveUp').hidden=false;
    $('focusPause').textContent='暂停';
    focus.timer = setInterval(()=>{
      if (focus.paused) return;
      focus.remain--; updateFocusDisplay();
      if (focus.remain<=0) finishFocus();
    }, 1000);
  }
  function pauseFocus() {
    focus.paused = !focus.paused;
    $('focusPause').textContent = focus.paused?'继续':'暂停';
  }
  function giveUpFocus() {
    showConfirm('放弃本次修炼？将不计修为。', ()=>{
      clearInterval(focus.timer); focus.timer=null;
      focus.running=false; focus.paused=false;
      resetFocusUI(); renderFocusStats(); toast('本次闭关半途而废，修为未增');
    });
  }
  function finishFocus() {
    clearInterval(focus.timer); focus.timer=null;
    focus.running=false;
    $('focusOrb').classList.remove('active');
    $('focusStart').hidden=false; $('focusPause').hidden=true; $('focusGiveUp').hidden=true;
    $('focusStart').textContent='再次闭关';
    S.focusHistory.push({ id:Date.now(), duration:focus.mins, completed:true, date:new Date().toISOString().slice(0,10) });
    if (focus.exp > 0) addExp(focus.exp);
    save(); renderFocusStats();
    if (focus.exp > 0) {
      toast(`闭关圆满！专注 ${focus.mins} 分钟，修为 +${focus.exp}`);
    } else {
      toast(`闭关圆满！专注 ${focus.mins} 分钟`);
    }
    playSound('focus');
    resetFocusUI();
  }

  /* ============ 错题 ============ */
  function openError() {
    openModal('errorModal');
    renderErrSubject(); renderErrBook(); renderPracList();
  }
  function renderErrSubject() {
    const subs = STAGE().subjectsFor(S.currentGrade);
    $('errSubject').innerHTML = subs.map(s=>`<option value="${s}">${WL.SUBJECTS[s].name}</option>`).join('');
  }
  function submitError() {
    const subject = $('errSubject').value, q = $('errQuestion').value.trim();
    const a = $('errAnswer').value.trim(), an = $('errAnalysis').value.trim();
    if (!q || !a) { toast('请填写题目与答案'); return; }
    S.errorHistory.push({ id:Date.now(), subject, question:q, answer:a, analysis:an||'—', mastered:false, date:new Date().toISOString().slice(0,10) });
    addExp(8); save();
    $('errQuestion').value=''; $('errAnswer').value=''; $('errAnalysis').value='';
    renderErrBook(); renderPracList(); renderRealm(); renderAchCount(); renderFocusStats();
    toast('错题已收录，修为 +8');
  }
  function renderErrBook() {
    $('bookCount').textContent = S.errorHistory.length;
    const cont = $('errBook');
    if (!S.errorHistory.length) { cont.innerHTML = `<div class="err-empty">错题本空空如也，去录入第一道错题吧</div>`; return; }
    S.errorViews = (S.errorViews||0)+1; save();
    cont.innerHTML = S.errorHistory.slice().reverse().map(e=>`
      <div class="err-card ${e.mastered?'mastered':''}">
        <div class="err-card-head"><span class="err-card-subject">${WL.SUBJECTS[e.subject].name}</span><span class="err-card-status">${e.mastered?'✓ 已掌握':'未掌握'}</span></div>
        <div class="err-card-q">${e.question}</div>
        <div class="err-card-a">答案：<b>${e.answer}</b>${e.analysis&&e.analysis!=='—'?` · 解析：${e.analysis}`:''}</div>
        <div class="err-card-actions">
          <button data-mid="${e.id}">${e.mastered?'取消掌握':'标记掌握 +10'}</button>
          <button class="del" data-del="${e.id}">删除</button>
        </div></div>`).join('');
    cont.querySelectorAll('[data-mid]').forEach(b=>b.onclick=()=>toggleMaster(+b.dataset.mid));
    cont.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>delError(+b.dataset.del));
    checkAchievements();
  }
  function toggleMaster(id) {
    const e = S.errorHistory.find(x=>x.id===id); if (!e) return;
    e.mastered = !e.mastered;
    if (e.mastered) addExp(4, true);
    save(); renderErrBook(); renderPracList(); renderRealm(); checkAchievements(); renderAchCount(); renderFocusStats();
    if (e.mastered) toast('融会贯通！修为 +4');
  }
  function delError(id) {
    showConfirm('删除这道错题？', ()=>{
      S.errorHistory = S.errorHistory.filter(x=>x.id!==id); save(); renderErrBook(); renderPracList(); renderRealm(); renderAchCount();
    });
  }
  function renderPracList() {
    const unmastered = S.errorHistory.filter(e=>!e.mastered);
    const cont = $('pracList');
    if (!unmastered.length) { cont.innerHTML = `<div class="err-empty">暂无可练习的错题（所有错题已掌握）</div>`; return; }
    cont.innerHTML = unmastered.map(e=>`<div class="prac-pick" data-pid="${e.id}">
      <span class="pq">${WL.SUBJECTS[e.subject].name}：${e.question}</span>
      <span class="ps">开始练习 →</span>
    </div>`).join('');
    cont.querySelectorAll('[data-pid]').forEach(b=>b.onclick=()=>startPractice(+b.dataset.pid));
  }
  let pracCurrent = null;
  async function startPractice(errorId) {
    if (aiLoading) { toast('正在生成题目，请稍候'); return; }
    const e = S.errorHistory.find(x=>x.id===errorId);
    if (!e) { toast('错题不存在'); return; }
    $('pracIntro').hidden = true;
    $('pracList').hidden = true;
    $('pracQuiz').hidden = false;
    $('pracQuiz').innerHTML = `<div class="prac-loading"><div class="loading-spinner"></div><div>正在生成练习题...</div></div>`;
    aiLoading = true;
    let picks;
    const result = await generatePracticeQuestions(errorId);
    if (result.error) {
      $('pracQuiz').innerHTML = `<div class="prac-error">
        <div class="err-icon">⚠️</div>
        <div class="err-msg">${result.error}</div>
        <div class="err-fallback">可翻阅秘籍残卷（备用题库）继续修炼</div>
        <button class="btn-primary" id="useFallback">查阅残卷</button>
        <button class="btn-ghost" id="backToList">返回列表</button>
      </div>`;
      $('useFallback').onclick = ()=>{
        picks = getFallbackQuestions(e.subject);
        if (!picks) { toast('该学科暂无秘籍残卷'); $('pracIntro').hidden=false; $('pracList').hidden=false; $('pracQuiz').hidden=true; renderPracList(); return; }
        pracCurrent = { errorId, subject:e.subject, items:picks, answers:new Array(picks.length).fill(null), idx:0, aiGenerated:false };
        renderPracQuestion();
      };
      $('backToList').onclick = ()=>{ $('pracIntro').hidden=false; $('pracList').hidden=false; $('pracQuiz').hidden=true; renderPracList(); };
      aiLoading = false;
      return;
    }
    picks = result.questions;
    pracCurrent = { errorId, subject:e.subject, items:picks, answers:new Array(picks.length).fill(null), idx:0, aiGenerated:true };
    aiLoading = false;
    renderPracQuestion();
  }
  function renderPracQuestion() {
    const p = pracCurrent; const item = p.items[p.idx];
    const aiTag = p.aiGenerated ? '<span class="ai-badge">智能生成</span>' : '';
    $('pracQuiz').innerHTML = `
      <div class="prac-q">第 ${p.idx+1} / ${p.items.length} 题 · ${WL.SUBJECTS[p.subject].name} ${aiTag}</div>
      <div class="prac-q" style="font-size:1rem">${item.q}</div>
      <div class="prac-fill"><input type="text" id="fillInput" placeholder="请输入你的答案" autocomplete="off"></div>
      <div class="prac-explain" id="pracExplain" hidden></div>
      <div style="display:flex;gap:.5rem;justify-content:flex-end">
        <button class="btn-primary" id="pracSubmit">提交答案</button>
        <button class="btn-ghost" id="pracNext" hidden>下一题 →</button>
      </div>`;
    const input = $('fillInput');
    input.focus();
    input.addEventListener('keydown', e=>{ if(e.key==='Enter') $('pracSubmit').click(); });
    $('pracSubmit').onclick = ()=>{
      const userAns = input.value.trim();
      if (!userAns) { toast('请输入答案'); return; }
      const isCorrect = checkFillAnswer(userAns, item.answer);
      p.answers[p.idx] = userAns;
      input.disabled = true;
      $('pracSubmit').hidden = true;
      $('pracNext').hidden = false;
      $('pracExplain').hidden = false;
      playSound(isCorrect ? 'correct' : 'wrong');
      const resultColor = isCorrect ? 'jade' : 'cinnabar';
      const resultText = isCorrect ? '✅ 回答正确' : '❌ 回答错误';
      const correctInfo = isCorrect ? '' : `<div style="margin-top:.4rem;color:var(--jade)">正确答案：<b>${item.answer}</b></div>`;
      $('pracExplain').innerHTML = `<div style="padding:.6rem;border-radius:4px;font-size:.85rem;color:var(--ink);background:${isCorrect?'rgba(74,124,111,.08)':'rgba(194,58,43,.08)'};border-left:3px solid var(--${resultColor})">
        <div style="font-weight:600;margin-bottom:.3rem">${resultText}</div>
        <div>💡 ${item.ex}</div>
        ${correctInfo}
      </div>`;
    };
    $('pracNext').onclick = ()=>{
      if (p.idx < p.items.length-1) { p.idx++; renderPracQuestion(); }
      else finishPractice();
    };
  }
  function finishPractice() {
    const p = pracCurrent; let correct = 0;
    p.items.forEach((it,i)=>{
      if (p.answers[i] && checkFillAnswer(p.answers[i], it.answer)) correct++;
    });
    const total = p.items.length, rate = correct/total;
    let exp = rate===1?12 : rate>=0.6?6 : 2;
    S.practiceDone = (S.practiceDone||0)+1;
    if (rate===1) S.practiceFull = true;
    // 记录已出过的题目，避免下次重复
    if (p.aiGenerated) {
      const err = S.errorHistory.find(x=>x.id===p.errorId);
      if (err) {
        if (!err.askedQuestions) err.askedQuestions = [];
        p.items.forEach(it => { if (!err.askedQuestions.includes(it.q)) err.askedQuestions.push(it.q); });
        // 最多保留30道，避免prompt过长
        if (err.askedQuestions.length > 30) err.askedQuestions = err.askedQuestions.slice(-30);
      }
    }
    addExp(exp); save();
    const aiTag = p.aiGenerated ? '<div class="ai-result-tag">智能练习</div>' : '';
    const wrongCount = total - correct;
    const againLabel = wrongCount > 0 ? '🎯 针对错题再来一组' : '✨ 换一批新题';
    $('pracQuiz').innerHTML = `<div class="prac-result">
      ${aiTag}
      <div class="score">${correct} / ${total}</div>
      <div style="color:var(--muted);margin:.5rem 0">${rate===1?'满分通关，举一反三！':rate>=0.6?'大部分正确，尚需努力':'仍需加强练习'}</div>
      <div style="color:var(--gold)">修为 +${exp}</div>
      <div style="display:flex;gap:.8rem;justify-content:center;margin-top:1.2rem">
        <button class="btn-primary" id="pracAgain">${againLabel}</button>
        <button class="btn-ghost" id="pracBack">返回列表</button>
      </div></div>`;
    $('pracAgain').onclick = ()=>{ startPractice(p.errorId); };
    $('pracBack').onclick = ()=>{ $('pracIntro').hidden=false; $('pracList').hidden=false; $('pracQuiz').hidden=true; renderPracList(); };
    checkAchievements(); renderRealm(); renderAchCount(); renderFocusStats();
    toast(`练习完成：${correct}/${total} 正确，修为 +${exp}`);
  }

  /* ============ 修炼计划 ============ */
  function openPlan() { openModal('planModal'); renderPlan(); }
  function renderPlan() {
    const cont = $('planList');
    if (!S.plans || !S.plans.length) { cont.innerHTML = `<div class="err-empty">尚未制定修炼计划，添加今日目标开始吧</div>`; return; }
    cont.innerHTML = S.plans.map(p=>`<div class="plan-item ${p.done?'done':''}">
      <div class="plan-check" data-pid="${p.id}">${p.done?'✓':''}</div>
      <div class="plan-text">${p.text}</div>
      <button class="plan-del" data-pdel="${p.id}">✕</button></div>`).join('');
    cont.querySelectorAll('[data-pid]').forEach(b=>b.onclick=()=>{ const p=S.plans.find(x=>x.id==b.dataset.pid); p.done=!p.done; save(); renderPlan(); checkAchievements(); renderAchCount(); if(p.done) toast('完成一项修炼，道心更坚！'); });
    cont.querySelectorAll('[data-pdel]').forEach(b=>b.onclick=()=>{ S.plans=S.plans.filter(x=>x.id!=b.dataset.pdel); save(); renderPlan(); });
  }
  function addPlan() {
    const v = $('planInput').value.trim(); if (!v) return;
    S.plans = S.plans||[]; S.plans.push({ id:Date.now(), text:v, done:false }); save();
    $('planInput').value=''; renderPlan();
  }

  /* ============ 弹窗 ============ */
  function openModal(id) { $(id).classList.add('open'); }
  function closeModal(id) { $(id).classList.remove('open'); }
  let confirmCallback = null;
  function showConfirm(text, cb) {
    $('confirmText').textContent = text;
    confirmCallback = cb;
    openModal('confirmModal');
  }

  /* ============ 刷新 ============ */
  function refreshAll() {
    renderRealm(); renderForm(); renderChart(curChart); renderRank(); renderRecord(); renderFocusStats(); renderAchCount();
  }

  /* ============ 仙师评语 ============ */
  let commentCache = {}; // 缓存评语，避免重复请求
  function openComment(eid) {
    const e = S.examHistory.find(x => x.id === eid);
    if (!e) return;
    openModal('commentModal');
    // 展示本次考试概况
    const g = WL.gradeOf(e.avgPercent);
    const chips = Object.keys(e.scores).map(k => {
      const pct = +(e.scores[k] / e.full[k] * 100).toFixed(0);
      return `<span class="score-chip">${WL.SUBJECTS[k].name} ${e.scores[k]}/${e.full[k]}（${pct}%）</span>`;
    }).join('');
    $('commentMeta').innerHTML = `<div class="comment-meta-row"><span>${e.date}</span><span>${WL.STAGES[e.stage].label}${e.grade}</span><span>${WL.EXAM_TYPES[e.examType].label}</span><span class="grade-badge" style="background:${g.color}">${g.level}</span><span>总分 ${e.total} · 正确率 ${e.avgPercent}%</span></div><div class="comment-scores">${chips}</div>`;
    // 已缓存则直接展示
    if (commentCache[eid]) {
      $('commentBody').innerHTML = `<div class="comment-text">${commentCache[eid]}</div>`;
      return;
    }
    // 生成评语
    $('commentBody').innerHTML = `<div class="comment-loading">仙师正在批阅卷宗...</div>`;
    generateComment(e).then(result => {
      if (result.error) {
        $('commentBody').innerHTML = `<div class="comment-error">仙师批阅受阻：${result.error}</div>`;
      } else {
        commentCache[eid] = result.content;
        $('commentBody').innerHTML = `<div class="comment-text">${result.content}</div>`;
      }
    });
  }
  async function generateComment(e) {
    // 组装本次各科得分详情
    const subjectList = Object.keys(e.scores).map(k => {
      const pct = +(e.scores[k] / e.full[k] * 100).toFixed(1);
      return `${WL.SUBJECTS[k].name}：${e.scores[k]}/${e.full[k]}（正确率${pct}%）`;
    }).join('；');
    const g = WL.gradeOf(e.avgPercent);
    // 查找上次考试记录，做对比
    const sorted = S.examHistory.slice().sort((a,b)=>a.date.localeCompare(b.date));
    const idx = sorted.findIndex(x => x.id === e.id);
    const prev = idx > 0 ? sorted[idx - 1] : null;
    let prevInfo = '无（本次为首次考核）';
    if (prev) {
      const prevList = Object.keys(prev.scores).map(k => {
        const pct = +(prev.scores[k] / prev.full[k] * 100).toFixed(1);
        return `${WL.SUBJECTS[k].name}：${prev.scores[k]}/${prev.full[k]}（${pct}%）`;
      }).join('；');
      const delta = e.total - prev.total;
      const deltaAvg = +(e.avgPercent - prev.avgPercent).toFixed(1);
      prevInfo = `上次考核（${prev.date}）：总分 ${prev.total}，正确率 ${prev.avgPercent}%\n上次各科：${prevList}\n本次较上次：总分${delta>=0?'+':''}${delta}，正确率${deltaAvg>=0?'+':''}${deltaAvg}%`;
    }
    const prompt = `你是一位修炼书院中德高望重的仙师，正在为弟子的本次考试撰写评语。请用温文尔雅、循循善诱的修炼风格口吻，结合上次成绩对比，给出点评与指引。要求：
1. 开头以"弟子"称呼，简要点明本次考核表现
2. 与上次成绩对比：若有退步科目，温和激励并帮忙分析可能的问题（如基础不牢、粗心等）；若有进步科目，给予表扬并鼓励再接再厉
3. 逐科点评（突出优劣，用修炼隐喻如"剑法凌厉"、"内功尚浅"等）
4. 总体评价与下一步修行建议
5. 结尾一句勉励
全文250-350字，用换行分段，不要用 Markdown 符号。

弟子本次考核情况：
学段：${WL.STAGES[e.stage].label}${e.grade}
考试类型：${WL.EXAM_TYPES[e.examType].label}
各科成绩：${subjectList}
总分：${e.total}
综合正确率：${e.avgPercent}%
综合等级：${g.level}

上次考核对比：
${prevInfo}`;
    return await callZhipuAI(prompt);
  }

  /* ============ AI 答疑 ============ */
  let aiSending = false;
  function openAI() {
    openModal('aiModal');
    setTimeout(()=>$('aiInput').focus(), 200);
  }
  async function sendAIQuestion() {
    if (aiSending) return;
    const input = $('aiInput');
    const q = input.value.trim();
    if (!q) return;
    aiSending = true;
    input.value = '';
    // 显示用户消息
    const chat = $('aiChat');
    chat.appendChild(el('div', 'ai-msg user', q));
    chat.scrollTop = chat.scrollHeight;
    // 显示加载中
    const loading = el('div', 'ai-msg loading', '正在思考...');
    chat.appendChild(loading);
    chat.scrollTop = chat.scrollHeight;
    // 调用 AI（修炼导师身份）
    const prompt = `你是一位修炼书院中德高望重的仙师，弟子前来请教学习上的疑惑。请用温文尔雅、循循善诱的口吻解答，开头可自称"为师/贫道"，称呼提问者为"弟子"。要求：条理清晰、通俗易懂，适合中小学生理解。计算题给出步骤，概念题举例说明，结尾可点拨一句修行道理。\n\n弟子的问题：${q}`;
    const result = await callZhipuAI(prompt);
    chat.removeChild(loading);
    if (result.error) {
      chat.appendChild(el('div', 'ai-msg bot', '仙师传讯受阻：' + result.error));
    } else {
      chat.appendChild(el('div', 'ai-msg bot', result.content));
    }
    chat.scrollTop = chat.scrollHeight;
    aiSending = false;
  }

  /* ============ 事件绑定 ============ */
  function bind() {
    $('stageSel').onchange = (e)=>{ S.currentStage=e.target.value; const st=WL.STAGES[S.currentStage]; S.currentGrade=st.grades[0]; S.pickedSubjects=[]; save(); renderGrades(); renderForm(); renderErrSubject(); refreshAll(); updateChartTabs(); };
    $('gradeSel').onchange = (e)=>{ S.currentGrade=e.target.value; S.pickedSubjects=[]; save(); renderForm(); updateChartTabs(); };
    $('examTypeSel').onchange = (e)=>{ S.examType=e.target.value; S.pickedSubjects=[]; save(); renderForm(); updateChartTabs(); };
    $('resetBtn').onclick = resetAll;
    $('openSettings').onclick = openSettings;
    $('saveSettings').onclick = saveSettings;
    $('submitBtn').onclick = submitExam;
    document.querySelectorAll('.chart-tab').forEach(t=>t.onclick=()=>renderChart(t.dataset.chart));
    $('chartSubjectSel').onchange = (e)=>{ curSubject = e.target.value; renderSubjectChart(); };
    document.querySelectorAll('.rank-tab').forEach(t=>t.onclick=()=>{ document.querySelectorAll('.rank-tab').forEach(x=>x.classList.remove('active')); t.classList.add('active'); renderRank(); });
    $('openFocus').onclick = openFocus;
    $('openError').onclick = openError;
    $('openAch').onclick = ()=>{ renderAchCats(); renderAchGrid(); openModal('achModal'); };
    $('openPlan').onclick = openPlan;
    // 仙师评语快捷入口
    $('latestCommentBtn').onclick = () => {
      if (!S.examHistory.length) { toast('尚无考试记录，先去录入一次考试吧'); return; }
      const latest = S.examHistory[S.examHistory.length - 1];
      openComment(latest.id);
    };
    // AI 答疑
    $('openAI').onclick = openAI;
    $('aiSend').onclick = sendAIQuestion;
    $('aiInput').addEventListener('keydown', e=>{ if(e.key==='Enter') sendAIQuestion(); });
    // 专注
    $('focusStart').onclick = startFocus;
    $('focusPause').onclick = pauseFocus;
    $('focusGiveUp').onclick = giveUpFocus;
    $('custApply').onclick = applyCustomTime;
    // 错题
    document.querySelectorAll('.error-tab').forEach(t=>t.onclick=()=>{
      document.querySelectorAll('.error-tab').forEach(x=>x.classList.remove('active'));
      t.classList.add('active');
      const pane=t.dataset.etab;
      document.querySelectorAll('.error-pane').forEach(p=>p.classList.toggle('active', p.dataset.pane===pane));
    });
    $('errSubmit').onclick = submitError;
    // 计划
    $('planAddBtn').onclick = addPlan;
    $('planInput').addEventListener('keydown', e=>{ if(e.key==='Enter') addPlan(); });
    // 弹窗关闭
    document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>closeModal(b.dataset.close));
    document.addEventListener('keydown', e=>{ if(e.key==='Escape') document.querySelectorAll('.modal.open').forEach(m=>m.classList.remove('open')); });
    // 确认弹窗
    $('confirmOk').onclick = ()=>{ closeModal('confirmModal'); if (confirmCallback) { const cb = confirmCallback; confirmCallback = null; cb(); } };
    $('confirmCancel').onclick = ()=>{ closeModal('confirmModal'); confirmCallback = null; };
  }

  /* ============ 初始化 ============ */
  function init() {
    S = load() || WL.demoData();
    if (!S.plans) S.plans = [{ id:1, text:'每日专注修炼 25 分钟', done:false }, { id:2, text:'整理本周数学错题', done:false }];
    if (!S.timeFlags) S.timeFlags = { morning:1 };
    if (S.soundEnabled === undefined) S.soundEnabled = true;
    S.pickedSubjects = [];
    soundEnabled = S.soundEnabled;
    save();
    renderGrades();
    $('stageSel').value = S.currentStage;
    $('examTypeSel').value = S.examType;
    bind();
    // 先渲染除图表外的所有部分
    renderRealm(); renderForm(); renderRank(); renderRecord(); renderFocusStats(); renderAchCount();
    checkAchievements();
    updateChartTabs();
    // Chart.js 可能还在异步加载，加载完后再渲染图表
    if (typeof Chart !== 'undefined') {
      renderChart(curChart);
    } else {
      // 等 Chart.js 加载完成
      window.__chartReady = function() { renderChart(curChart); };
      // 同时设置轮询检测，确保图表能渲染
      const chartCheck = setInterval(() => {
        if (typeof Chart !== 'undefined') {
          clearInterval(chartCheck);
          renderChart(curChart);
        }
      }, 300);
      setTimeout(() => clearInterval(chartCheck), 10000);
    }
    // 全局网络状态监听：断网/恢复即时弹窗
    netOffline = !navigator.onLine;
    window.addEventListener('offline', ()=>{
      if (!netOffline) { netOffline = true; toastNet('天地灵气断绝，仙讯难以通达（网络已断开）'); }
    });
    window.addEventListener('online', ()=>{
      if (netOffline) { netOffline = false; toast('灵气复通，仙讯无碍（网络已恢复）'); }
    });
  }

  // defer 脚本执行时 DOM 已就绪，直接初始化以尽早渲染首屏
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
