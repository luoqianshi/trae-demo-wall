// ============================================
// 钟鸣九霄 — 核心交互逻辑
// ============================================

// ===== 音频系统 =====
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playBell(frequency, duration = 1.5, type = 'bronze') {
    initAudio();
    const now = audioCtx.currentTime;

    const fundamental = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    fundamental.type = 'sine';
    fundamental.frequency.setValueAtTime(frequency, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(frequency * 3, now);
    filter.Q.setValueAtTime(1, now);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.4, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    fundamental.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    fundamental.start(now);
    fundamental.stop(now + duration);

    if (type === 'bronze') {
        const harmonics = [2, 3, 4.2, 5.4];
        const levels = [0.3, 0.2, 0.1, 0.08];
        harmonics.forEach((h, i) => {
            const osc = audioCtx.createOscillator();
            const oscGain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(frequency * h, now);
            oscGain.gain.setValueAtTime(0, now);
            oscGain.gain.linearRampToValueAtTime(levels[i], now + 0.02);
            oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.7);
            osc.connect(oscGain);
            oscGain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + duration);
        });
    }

    const noise = audioCtx.createBufferSource();
    const noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.1, audioCtx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 0.02));
    }
    noise.buffer = noiseBuffer;
    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.15, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    const noiseFilter = audioCtx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(frequency * 2, now);
    noiseFilter.Q.setValueAtTime(5, now);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(audioCtx.destination);
    noise.start(now);
}

// ===== 音名与频率映射 =====
const gongcheNotes = {
    '合': { freq: 261.63, solfege: 'Do', lvming: '姑洗', modern: 'C4', index: 0 },
    '四': { freq: 293.66, solfege: 'Re', lvming: '仲吕', modern: 'D4', index: 1 },
    '一': { freq: 329.63, solfege: 'Mi', lvming: '蕤宾', modern: 'E4', index: 2 },
    '上': { freq: 349.23, solfege: 'Fa', lvming: '林钟', modern: 'F4', index: 3 },
    '尺': { freq: 392.00, solfege: 'Sol', lvming: '南吕', modern: 'G4', index: 4 },
    '工': { freq: 440.00, solfege: 'La', lvming: '清姑洗', modern: 'A4', index: 5 },
    '凡': { freq: 493.88, solfege: 'Si', lvming: '清仲吕', modern: 'B4', index: 6 },
    '六': { freq: 523.25, solfege: 'Do', lvming: '清蕤宾', modern: 'C5', index: 7 },
    '五': { freq: 587.33, solfege: 'Re', lvming: '清林钟', modern: 'D5', index: 8 },
    '乙': { freq: 659.25, solfege: 'Mi', lvming: '清南吕', modern: 'E5', index: 9 }
};

const bellNotes = [
    { name: '姑洗', gongche: '合', freq: 261.63, modern: 'C4' },
    { name: '仲吕', gongche: '四', freq: 293.66, modern: 'D4' },
    { name: '蕤宾', gongche: '一', freq: 329.63, modern: 'E4' },
    { name: '林钟', gongche: '上', freq: 349.23, modern: 'F4' },
    { name: '南吕', gongche: '尺', freq: 392.00, modern: 'G4' },
    { name: '清姑洗', gongche: '工', freq: 440.00, modern: 'A4' },
    { name: '清仲吕', gongche: '凡', freq: 493.88, modern: 'B4' },
    { name: '清蕤宾', gongche: '六', freq: 523.25, modern: 'C5' },
    { name: '清林钟', gongche: '五', freq: 587.33, modern: 'D5' }
];

// ===== 页面导航 =====
let currentScreen = 'welcome';

function goToScreen(screenName) {
    const screens = ['welcome', 'mode', 'puzzle', 'result', 'bells'];
    screens.forEach(s => {
        const el = document.getElementById('screen-' + s);
        if (el) {
            el.classList.remove('active');
        }
    });
    const target = document.getElementById('screen-' + screenName);
    if (target) {
        target.classList.add('active');
        currentScreen = screenName;
    }
    if (screenName === 'bells') {
        initBells();
    }
}

// ===== 任务说明折叠 =====
document.addEventListener('DOMContentLoaded', function() {
    const taskToggle = document.getElementById('taskToggle');
    const taskToggleBtn = document.getElementById('taskToggleBtn');
    if (taskToggleBtn && taskToggle) {
        taskToggleBtn.addEventListener('click', function() {
            taskToggle.classList.toggle('expanded');
        });
    }
    initBells();
    initKnowledgeGallery();
});

// ===== 解谜游戏逻辑 =====
const puzzleLevels = [
    {
        level: 1,
        title: '第 1 关 · 工尺谱',
        count: '1/3',
        task: '将下列工尺谱字按音高从低到高排列。仔细聆听旋律，感受每个音的<strong style="color: var(--accent);">高低关系</strong>。',
        answer: ['上', '尺', '工', '凡', '六'],
        options: ['工', '凡', '上', '六', '尺'],
        hint: '从最低音开始，按 Do Re Mi Fa Sol 的顺序排列'
    },
    {
        level: 2,
        title: '第 2 关 · 十二律吕',
        count: '2/3',
        task: '按律名从低到高排列。黄钟为宫，十二律构成完整的半音音阶。',
        answer: ['黄钟', '大吕', '太簇', '夹钟', '姑洗'],
        options: ['太簇', '姑洗', '黄钟', '夹钟', '大吕'],
        hint: '黄钟为第一律，按奇数律（阳律）和偶数吕（阴吕）交替排列'
    },
    {
        level: 3,
        title: '第 3 关 · 一钟双音',
        count: '3/3',
        task: '每件编钟有两个音。按正鼓音从低到高排列编钟。',
        answer: ['合', '四', '一', '上', '尺'],
        options: ['一', '上', '合', '尺', '四'],
        hint: '正鼓音对应工尺谱的基本音阶，从低到高是合四一上尺'
    }
];

let currentLevel = 0;
let userAnswer = [];
let hintsRemaining = 3;
let wrongAttempts = 0;

function startPuzzle() {
    currentLevel = 0;
    goToScreen('puzzle');
    loadLevel(currentLevel);
}

function loadLevel(levelIdx) {
    const level = puzzleLevels[levelIdx];
    if (!level) return;

    document.getElementById('puzzle-level-title').textContent = level.title;
    document.getElementById('puzzle-level-count').textContent = level.count;
    document.getElementById('task-desc').innerHTML = level.task;

    userAnswer = [];
    wrongAttempts = 0;
    hintsRemaining = 3;
    document.getElementById('hintCount').textContent = hintsRemaining;
    document.getElementById('hintArea').textContent = '';

    renderNotationDisplay(level.answer.length);
    renderSymbolGrid(level.options);

    const taskToggle = document.getElementById('taskToggle');
    if (taskToggle) taskToggle.classList.remove('expanded');
}

function renderNotationDisplay(slotCount) {
    const container = document.getElementById('notationDisplay');
    container.innerHTML = '';
    for (let i = 0; i < slotCount; i++) {
        const slot = document.createElement('div');
        slot.className = 'notation-slot';
        if (i < userAnswer.length) {
            slot.classList.add('filled');
            slot.innerHTML = `<span class="slot-index">${i + 1}</span><span class="slot-char">${userAnswer[i]}</span>`;
            slot.onclick = () => removeFromSlot(i);
        } else if (i === userAnswer.length) {
            slot.classList.add('current');
            slot.innerHTML = `<span class="slot-index">${i + 1}</span><span class="slot-char">...</span>`;
        } else {
            slot.classList.add('empty');
            slot.innerHTML = `<span class="slot-index">${i + 1}</span>`;
        }
        container.appendChild(slot);
    }
}

function renderSymbolGrid(options) {
    const grid = document.getElementById('symbolGrid');
    grid.innerHTML = '';
    const shuffled = [...options].sort(() => Math.random() - 0.5);
    shuffled.forEach(symbol => {
        const btn = document.createElement('button');
        btn.className = 'symbol-btn';
        const isUsed = userAnswer.includes(symbol);
        if (isUsed) btn.classList.add('used');

        const note = gongcheNotes[symbol];
        const solfege = note ? note.solfege : '';

        btn.innerHTML = `
            <span class="symbol-char">${symbol}</span>
            <span class="solfege">${solfege}</span>
        `;
        btn.onclick = () => selectSymbol(symbol, btn);
        grid.appendChild(btn);
    });
}

function selectSymbol(symbol, btnElement) {
    const level = puzzleLevels[currentLevel];
    if (userAnswer.length >= level.answer.length) return;
    if (userAnswer.includes(symbol)) return;

    initAudio();
    const note = gongcheNotes[symbol];
    if (note) {
        playBell(note.freq, 1);
        updatePitchBar(note.index / 9 * 100, symbol);
    }

    userAnswer.push(symbol);
    renderNotationDisplay(level.answer.length);
    renderSymbolGrid(level.options);

    if (userAnswer.length === level.answer.length) {
        setTimeout(() => submitPuzzle(), 500);
    }
}

function removeFromSlot(index) {
    const removed = userAnswer.splice(index, 1)[0];
    const level = puzzleLevels[currentLevel];
    renderNotationDisplay(level.answer.length);
    renderSymbolGrid(level.options);
}

function resetPuzzle() {
    userAnswer = [];
    wrongAttempts = 0;
    const level = puzzleLevels[currentLevel];
    renderNotationDisplay(level.answer.length);
    renderSymbolGrid(level.options);
    document.getElementById('hintArea').textContent = '';
}

function showHint() {
    if (hintsRemaining <= 0) {
        document.getElementById('hintArea').textContent = '提示次数已用完';
        return;
    }
    const level = puzzleLevels[currentLevel];
    hintsRemaining--;
    document.getElementById('hintCount').textContent = hintsRemaining;
    document.getElementById('hintArea').textContent = '💡 ' + level.hint;
}

function playMelody() {
    const level = puzzleLevels[currentLevel];
    initAudio();
    level.answer.forEach((symbol, idx) => {
        const note = gongcheNotes[symbol];
        if (note) {
            setTimeout(() => {
                playBell(note.freq, 0.8);
                updatePitchBar(note.index / 9 * 100, symbol);
            }, idx * 400);
        }
    });
}

function updatePitchBar(percent, label) {
    const indicator = document.getElementById('pitchBarIndicator');
    const labelEl = document.getElementById('pitchBarLabel');
    if (indicator) {
        indicator.style.left = percent + '%';
        indicator.classList.add('active', 'bounce');
        setTimeout(() => indicator.classList.remove('bounce'), 300);
    }
    if (labelEl) labelEl.textContent = label;
}

function submitPuzzle() {
    const level = puzzleLevels[currentLevel];
    const correct = JSON.stringify(userAnswer) === JSON.stringify(level.answer);
    const slots = document.querySelectorAll('#notationDisplay .notation-slot');

    if (correct) {
        slots.forEach(slot => {
            slot.style.borderColor = 'var(--jade)';
            slot.style.color = 'var(--jade)';
        });
        createParticles(window.innerWidth / 2, window.innerHeight / 2, 20);
        setTimeout(() => showResult(), 800);
    } else {
        wrongAttempts++;
        slots.forEach((slot, idx) => {
            if (userAnswer[idx] !== level.answer[idx]) {
                slot.classList.add('wrong');
            }
        });
        document.getElementById('hintArea').textContent = '❌ 顺序不对，再听听旋律想一想';
        setTimeout(() => {
            resetPuzzle();
        }, 1000);
    }
}

function showResult() {
    const level = puzzleLevels[currentLevel];
    const accuracy = Math.max(0, 100 - wrongAttempts * 20);
    const hintsUsed = 3 - hintsRemaining;

    document.getElementById('stat-level').textContent = level.level;
    document.getElementById('stat-level-bar').style.width = (level.level / 3 * 100) + '%';
    document.getElementById('stat-hints').textContent = hintsUsed + '/3';
    document.getElementById('stat-hints-bar').style.width = (hintsUsed / 3 * 100) + '%';
    document.getElementById('stat-accuracy').textContent = accuracy + '%';

    const knowledgeItems = [
        {
            title: '工尺谱',
            body: '工尺谱是中国传统记谱法，用"上尺工凡六五乙"等汉字记录音高。"上"对应 Do，"尺"对应 Re……这种记谱法至今仍在中国传统音乐中使用。',
            chars: ['上', '尺', '工', '凡', '六', '五', '乙']
        },
        {
            title: '十二律吕',
            body: '十二律吕是中国古代的音律体系，将一个八度分为十二个半音。奇数为"律"（阳律），偶数为"吕"（阴吕），合称律吕。',
            chars: ['黄', '大', '太', '夹', '姑', '仲', '蕤', '林']
        },
        {
            title: '一钟双音',
            body: '曾侯乙编钟每件钟可发出两个不同的音：正鼓音和侧鼓音。敲击钟的正中部得到正鼓音，敲击侧面得到侧鼓音，二者成三度关系。',
            chars: ['合', '四', '一', '上', '尺', '工', '凡']
        }
    ];

    const item = knowledgeItems[currentLevel] || knowledgeItems[0];
    document.getElementById('knowledgeTitle').textContent = item.title;
    document.getElementById('knowledgeBody').textContent = item.body;

    const charsContainer = document.getElementById('knowledgeChars');
    charsContainer.innerHTML = '';
    item.chars.forEach(c => {
        const span = document.createElement('span');
        span.className = 'rkc-char';
        span.textContent = c;
        span.onclick = () => playNoteByChar(c);
        charsContainer.appendChild(span);
    });

    unlockKnowledge(currentLevel);

    const nextBtn = document.getElementById('btn-next-level');
    if (currentLevel >= puzzleLevels.length - 1) {
        nextBtn.innerHTML = '全部通关 🎉';
        nextBtn.onclick = () => goToScreen('mode');
    } else {
        nextBtn.innerHTML = `下一关
            <svg viewBox="0 0 16 16" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 4 L10 8 L6 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`;
        nextBtn.onclick = nextLevel;
    }

    goToScreen('result');
}

function nextLevel() {
    currentLevel++;
    if (currentLevel < puzzleLevels.length) {
        goToScreen('puzzle');
        loadLevel(currentLevel);
    } else {
        goToScreen('mode');
    }
}

function playNoteByChar(char) {
    const note = gongcheNotes[char];
    if (note) {
        playBell(note.freq, 1.2);
    }
}

// ===== 编钟演奏 =====
let bellsInitialized = false;
let currentNotation = 'gongche';
let playalongIndex = 0;
let playalongScore = 0;
let playalongMelody = [];
let playalongActive = false;

const playalongMelodies = [
    { name: '小星星', notes: ['合', '合', '尺', '尺', '工', '工', '尺'] },
    { name: '两只老虎', notes: ['合', '尺', '工', '合', '合', '尺', '工', '合'] },
    { name: '音阶练习', notes: ['合', '四', '一', '上', '尺', '工', '凡', '六'] }
];

function initBells() {
    if (bellsInitialized) {
        renderMelodyDisplay();
        return;
    }
    bellsInitialized = true;

    const bellRow = document.getElementById('bellRow');
    if (!bellRow) return;

    const bellSizes = [
        { w: 36, h: 48 },
        { w: 40, h: 53 },
        { w: 46, h: 61 },
        { w: 52, h: 69 },
        { w: 56, h: 75 },
        { w: 52, h: 69 },
        { w: 46, h: 61 },
        { w: 40, h: 53 },
        { w: 36, h: 48 }
    ];

    bellNotes.forEach((bell, idx) => {
        const size = bellSizes[idx] || { w: 40, h: 53 };
        const col = document.createElement('div');
        col.className = 'bell-col';
        col.dataset.bell = idx;
        col.innerHTML = `
            <div class="bell-connector" style="width:2px;height:18px;background:linear-gradient(180deg,var(--bronze-mid),var(--accent));"></div>
            <div class="bell-wrapper">
                <svg viewBox="0 0 60 80" width="${size.w}" height="${size.h}" class="bell-svg">
                    <rect x="26" y="0" width="8" height="12" rx="3" fill="url(#bellBodyGrad)"/>
                    <path d="M24 10C20 14,14 28,12 42 10.5 52,8 60,5 70L55 70C52 60,49.5 52,48 42 46 28,40 14,36 10Z" fill="url(#bellBodyGrad)"/>
                    <path d="M24 10C20 14,14 28,12 42 10.5 52,8 60,5 70L55 70C52 60,49.5 52,48 42 46 28,40 14,36 10Z" fill="url(#bellShineGrad)"/>
                    <rect x="11" y="28" width="38" height="8" rx="1" fill="rgba(107,78,10,0.35)"/>
                    <circle cx="18" cy="20" r="1.5" fill="rgba(255,255,255,0.18)"/>
                    <circle cx="30" cy="20" r="1.5" fill="rgba(255,255,255,0.18)"/>
                    <circle cx="42" cy="20" r="1.5" fill="rgba(255,255,255,0.18)"/>
                    <circle cx="16" cy="32" r="1.5" fill="rgba(255,255,255,0.14)"/>
                    <circle cx="30" cy="32" r="1.5" fill="rgba(255,255,255,0.14)"/>
                    <circle cx="44" cy="32" r="1.5" fill="rgba(255,255,255,0.14)"/>
                    <circle cx="14" cy="44" r="1.5" fill="rgba(255,255,255,0.14)"/>
                    <circle cx="30" cy="44" r="1.5" fill="rgba(255,255,255,0.14)"/>
                    <circle cx="46" cy="44" r="1.5" fill="rgba(255,255,255,0.14)"/>
                    <ellipse cx="30" cy="70" rx="25" ry="4" fill="#4A3808"/>
                    <ellipse cx="30" cy="70" rx="22" ry="2.5" fill="#3A2A06"/>
                </svg>
                <div class="bell-glow"></div>
                <div class="bell-hitzone top" title="正鼓"></div>
                <div class="bell-hitzone side" title="侧鼓"></div>
                <div class="bell-ripple gold-ripple"></div>
                <div class="bell-ripple jade-ripple"></div>
            </div>
            <span class="bell-label">${bell.name}</span>
        `;

        col.addEventListener('click', (e) => {
            const isSide = e.target.classList.contains('bell-hitzone') && e.target.classList.contains('side');
            ringBell(idx, isSide ? 'side' : 'top');
        });

        bellRow.appendChild(col);
    });

    const melody = playalongMelodies[2];
    playalongMelody = melody.notes;
    playalongIndex = 0;
    playalongScore = 0;
    renderMelodyDisplay();
    updatePlayalongScore();
}

function ringBell(idx, zone = 'top') {
    initAudio();
    const bell = bellNotes[idx];
    if (!bell) return;

    let freq = bell.freq;
    let rippleClass = 'gold-ripple';
    let noteName = bell.gongche;

    if (zone === 'side') {
        freq = bell.freq * 1.25;
        rippleClass = 'jade-ripple';
    }

    playBell(freq, 2);

    const col = document.querySelector(`.bell-col[data-bell="${idx}"]`);
    if (col) {
        col.classList.add('ringing');
        setTimeout(() => col.classList.remove('ringing'), 600);

        const ripple = col.querySelector('.' + rippleClass);
        if (ripple) {
            ripple.classList.remove('active');
            void ripple.offsetWidth;
            ripple.classList.add('active');
        }
    }

    const percent = (idx / (bellNotes.length - 1)) * 100;
    updateBellsPitchBar(percent, bell.name);

    if (playalongActive) {
        checkPlayalongNote(bell.gongche);
    }
}

function updateBellsPitchBar(percent, label) {
    const indicator = document.getElementById('bellsPitchIndicator');
    const labelEl = document.getElementById('bellsPitchLabel');
    if (indicator) {
        indicator.style.left = percent + '%';
        indicator.classList.add('active', 'bounce');
        setTimeout(() => indicator.classList.remove('bounce'), 300);
    }
    if (labelEl) labelEl.textContent = label;
}

function setNotation(type) {
    currentNotation = type;
    document.querySelectorAll('.toggle-opt').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.notation === type);
    });

    const indicator = document.getElementById('toggleIndicator');
    if (indicator) {
        const idx = ['gongche', 'modern', 'lvming'].indexOf(type);
        indicator.style.transform = `translateX(${idx * 100}%)`;
    }

    renderMelodyDisplay();
}

function renderMelodyDisplay() {
    const container = document.getElementById('melodyDisplay');
    if (!container) return;
    container.innerHTML = '';

    playalongMelody.forEach((noteChar, idx) => {
        const note = gongcheNotes[noteChar];
        if (!note) return;

        const div = document.createElement('div');
        div.className = 'melody-note';
        if (idx === playalongIndex && playalongActive) div.classList.add('current');

        let displayText = noteChar;
        if (currentNotation === 'modern') displayText = note.modern;
        else if (currentNotation === 'lvming') displayText = note.lvming;

        div.textContent = displayText;
        div.dataset.gongche = noteChar;
        container.appendChild(div);
    });
}

function updatePlayalongScore() {
    document.getElementById('playalongScore').textContent = `得分 ${playalongScore}/${playalongMelody.length}`;
    const progress = document.getElementById('playalongProgress');
    if (progress) {
        progress.style.width = (playalongIndex / playalongMelody.length * 100) + '%';
    }
}

function checkPlayalongNote(noteChar) {
    if (!playalongActive) return;

    const notes = document.querySelectorAll('.melody-note');
    const currentNote = playalongMelody[playalongIndex];

    if (noteChar === currentNote) {
        if (notes[playalongIndex]) {
            notes[playalongIndex].classList.remove('current');
            notes[playalongIndex].classList.add('correct');
        }
        playalongScore++;
        playalongIndex++;
        updatePlayalongScore();

        if (playalongIndex < playalongMelody.length && notes[playalongIndex]) {
            notes[playalongIndex].classList.add('current');
        }

        if (playalongIndex >= playalongMelody.length) {
            playalongActive = false;
            setTimeout(() => {
                alert(`🎉 演奏完成！得分：${playalongScore}/${playalongMelody.length}`);
            }, 300);
        }
    } else {
        if (notes[playalongIndex]) {
            notes[playalongIndex].classList.add('wrong');
            setTimeout(() => notes[playalongIndex].classList.remove('wrong'), 400);
        }
    }
}

function restartPlayalong() {
    playalongIndex = 0;
    playalongScore = 0;
    playalongActive = true;
    renderMelodyDisplay();
    updatePlayalongScore();
    const notes = document.querySelectorAll('.melody-note');
    if (notes[0]) notes[0].classList.add('current');
}

// ===== 知识图鉴 =====
const knowledgeData = [
    {
        id: 0,
        title: '工尺谱',
        status: 'mastered',
        text: '中国传统记谱法，以上、尺、工、凡、六、五、乙等汉字记录音高，是古代宫廷与民间音乐传承的重要工具。工尺谱始见于唐代，成熟于宋代，广泛应用于雅乐、器乐与戏曲之中。'
    },
    {
        id: 1,
        title: '十二律吕',
        status: 'unlocked',
        text: '古代音律体系，将一个八度分为十二个半音，以黄钟、大吕等命名，是制定音高标准的基础理论框架。十二律分为六律（阳律）和六吕（阴吕），合称律吕。'
    },
    {
        id: 2,
        title: '三分损益法',
        status: 'unlocked',
        text: '通过弦长比例计算音程的数学方法，依次递增或递减三分之一弦长来生成新的音高，是中国古代律学的核心算法。三分损益法最早见于《管子·地员篇》。'
    },
    {
        id: 3,
        title: '一钟双音',
        status: 'locked',
        text: ''
    },
    {
        id: 4,
        title: '曾侯乙编钟',
        status: 'locked',
        text: ''
    },
    {
        id: 5,
        title: '八音分类',
        status: 'locked',
        text: ''
    }
];

let unlockedKnowledge = [0, 1, 2];
let quizScore = 0;
let currentQuizIdx = 0;
let quizAnswered = false;

const quizQuestions = [
    {
        question: '工尺谱中，"上"字对应哪个音？',
        options: ['Re', 'Do', 'Mi', 'Fa'],
        correct: 1,
        explanation: '在工尺谱体系中，"上"字对应 Do 音。工尺谱以"上、尺、工、凡、六、五、乙"分别对应 Do、Re、Mi、Fa、Sol、La、Si 七个音级，"上"为音阶的起始音。'
    },
    {
        question: '曾侯乙编钟出土于哪里？',
        options: ['湖南长沙', '湖北随州', '河南安阳', '陕西西安'],
        correct: 1,
        explanation: '曾侯乙编钟于1978年在湖北随州擂鼓墩曾侯乙墓出土，是战国早期的文物，共65件青铜编钟，是迄今发现的最大、保存最完好的先秦打击乐器群。'
    },
    {
        question: '"一钟双音"指的是什么？',
        options: ['一个钟能响两次', '敲击不同部位发出不同音高', '两个钟一起响', '钟有两种颜色'],
        correct: 1,
        explanation: '一钟双音是指同一件编钟敲击正鼓部和侧鼓部能发出两个不同的音高，二者通常成三度关系。这一青铜铸造工艺的奇迹领先西方两千多年。'
    },
    {
        question: '十二律吕中，第一律是什么？',
        options: ['大吕', '黄钟', '太簇', '姑洗'],
        correct: 1,
        explanation: '黄钟是十二律的第一律，也是中国古代音乐的基准音。古人以黄钟为宫，确立了整个音乐体系的音高标准。'
    },
    {
        question: '工尺谱中"尺"字对应的音名是？',
        options: ['Sol', 'La', 'Re', 'Mi'],
        correct: 2,
        explanation: '工尺谱中"尺"对应 Re 音。工尺谱的七声音阶为：上(Do)、尺(Re)、工(Mi)、凡(Fa)、六(Sol)、五(La)、乙(Si)。'
    },
    {
        question: '"八音"分类法是按什么来分类的？',
        options: ['音高', '制作材料', '演奏方式', '产生年代'],
        correct: 1,
        explanation: '八音是中国古代对乐器的分类法，按制作材料分为金、石、土、革、丝、木、匏、竹八类。编钟属于"金"类乐器。'
    }
];

function unlockKnowledge(level) {
    if (!unlockedKnowledge.includes(level)) {
        unlockedKnowledge.push(level);
    }
    updateKgProgress();
}

function updateKgProgress() {
    const countEl = document.getElementById('kgProgressCount');
    if (countEl) {
        countEl.textContent = `${unlockedKnowledge.length}/${knowledgeData.length}`;
    }
}

function openKnowledgeGallery() {
    initAudio();
    document.getElementById('kgOverlay').classList.add('active');
    showKgGallery();
    renderKgGrid();
    updateKgProgress();
}

function closeKnowledgeGallery() {
    document.getElementById('kgOverlay').classList.remove('active');
}

function showKgGallery() {
    document.getElementById('kgGallery').style.display = '';
    document.getElementById('kgQuiz').style.display = 'none';
    document.getElementById('kgComplete').style.display = 'none';
    renderKgGrid();
}

function renderKgGrid() {
    const grid = document.getElementById('kgGrid');
    if (!grid) return;
    grid.innerHTML = '';

    knowledgeData.forEach(item => {
        const isUnlocked = unlockedKnowledge.includes(item.id);
        const card = document.createElement('div');

        if (isUnlocked) {
            const isMastered = item.status === 'mastered';
            const tagClass = isMastered ? 'kg-tag-jade' : 'kg-tag-gold';
            const tagText = isMastered ? '精通' : '初识';
            const barColor = isMastered ? 'var(--jade)' : 'var(--accent)';

            card.className = 'kg-card kg-card-unlocked';
            card.innerHTML = `
                <div class="kg-card-bar" style="background:${barColor};"></div>
                <span class="kg-tag ${tagClass}">${tagText}</span>
                <h4 class="kg-card-title">${item.title}</h4>
                <div class="kg-card-body">
                    <p class="kg-card-text">${item.text}</p>
                </div>
                <button class="kg-expand-toggle">点击查看详情</button>
            `;

            const toggleBtn = card.querySelector('.kg-expand-toggle');
            toggleBtn.addEventListener('click', function() {
                card.classList.toggle('expanded');
                toggleBtn.textContent = card.classList.contains('expanded') ? '收起详情' : '点击查看详情';
            });
        } else {
            card.className = 'kg-card kg-card-locked';
            card.innerHTML = `
                <svg class="kg-lock-watermark" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="1">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <div class="kg-card-title-locked">???</div>
                <div class="kg-card-subtitle">完成对应挑战以解锁</div>
            `;
        }

        grid.appendChild(card);
    });
}

function startQuiz() {
    quizScore = 0;
    currentQuizIdx = 0;
    quizAnswered = false;
    showQuizQuestion();
    document.getElementById('kgGallery').style.display = 'none';
    document.getElementById('kgQuiz').style.display = '';
    document.getElementById('kgComplete').style.display = 'none';
}

function showQuizQuestion() {
    const q = quizQuestions[currentQuizIdx];
    quizAnswered = false;

    document.getElementById('kgQuizProgress').style.width = ((currentQuizIdx + 1) / quizQuestions.length * 100) + '%';
    document.getElementById('kgQuizProgressText').textContent = `第 ${currentQuizIdx + 1} 题 / 共 ${quizQuestions.length} 题`;
    document.getElementById('kgQuizQuestion').textContent = q.question;

    const optionsEl = document.getElementById('kgQuizOptions');
    optionsEl.innerHTML = '';
    q.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = opt;
        btn.addEventListener('click', () => selectQuizAnswer(idx));
        optionsEl.appendChild(btn);
    });

    document.getElementById('kgExplanation').style.display = 'none';
    document.getElementById('kgNextWrap').style.display = 'none';
}

function selectQuizAnswer(idx) {
    if (quizAnswered) return;
    quizAnswered = true;

    const q = quizQuestions[currentQuizIdx];
    const buttons = document.querySelectorAll('#kgQuizOptions .option-btn');

    if (idx === q.correct) {
        buttons[idx].classList.add('correct');
        quizScore++;
    } else {
        buttons[idx].classList.add('wrong');
        buttons[q.correct].classList.add('correct');
    }

    document.getElementById('kgExplanation').textContent = q.explanation;
    document.getElementById('kgExplanation').style.display = '';
    document.getElementById('kgNextWrap').style.display = '';

    const nextBtn = document.getElementById('kgNextBtn');
    if (currentQuizIdx >= quizQuestions.length - 1) {
        nextBtn.textContent = '查看结果';
    } else {
        nextBtn.textContent = '下一题';
    }
}

function nextQuizQuestion() {
    currentQuizIdx++;
    if (currentQuizIdx < quizQuestions.length) {
        showQuizQuestion();
    } else {
        showQuizComplete();
    }
}

function showQuizComplete() {
    document.getElementById('kgQuiz').style.display = 'none';
    document.getElementById('kgComplete').style.display = '';

    const scoreEl = document.getElementById('kgRingScore');
    const circle = document.getElementById('kgRingCircle');
    const evalEl = document.getElementById('kgCompleteEval');

    const percent = quizScore / quizQuestions.length;
    scoreEl.textContent = `${quizScore}/${quizQuestions.length}`;

    const circumference = 213.63;
    const offset = circumference * (1 - percent);
    if (circle) {
        circle.style.strokeDashoffset = offset;
    }

    let evalText = '继续努力';
    if (percent >= 0.9) evalText = '音乐大师';
    else if (percent >= 0.7) evalText = '学有所成';
    else if (percent >= 0.5) evalText = '初窥门径';
    if (evalEl) evalEl.textContent = evalText;
}

function restartQuiz() {
    startQuiz();
}

// ===== 粒子效果 =====
function createParticles(x, y, count = 15) {
    const container = document.getElementById('particleContainer');
    if (!container) return;

    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle' + (Math.random() > 0.5 ? ' diamond' : '');
        const size = Math.random() * 8 + 4;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.left = (x + (Math.random() - 0.5) * 100) + 'px';
        particle.style.top = (y + (Math.random() - 0.5) * 100) + 'px';
        particle.style.animationDuration = (0.8 + Math.random() * 0.6) + 's';
        particle.style.animationDelay = (Math.random() * 0.2) + 's';
        if (Math.random() > 0.5) {
            particle.style.background = 'var(--jade)';
        }
        container.appendChild(particle);
        setTimeout(() => particle.remove(), 1500);
    }
}

// ===== 键盘支持 =====
document.addEventListener('keydown', function(e) {
    if (currentScreen === 'bells') {
        const keyMap = {
            'a': 0, 's': 1, 'd': 2, 'f': 3, 'g': 4, 'h': 5, 'j': 6, 'k': 7, 'l': 8
        };
        const idx = keyMap[e.key.toLowerCase()];
        if (idx !== undefined) {
            ringBell(idx, e.shiftKey ? 'side' : 'top');
        }
    }
});
