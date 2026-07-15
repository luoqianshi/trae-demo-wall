// MoodWave 主控制器：屏幕路由 + 状态机 + 模块装配
(function () {
  'use strict';

  const $  = (s, p = document) => p.querySelector(s);
  const $$ = (s, p = document) => Array.from(p.querySelectorAll(s));

  // ===== 状态 =====
  const store = window.createStore({
    screen: 'boot',        // boot | radio | karaoke | card
    mood: null,            // 当前心情
    song: null,            // 当前歌曲
    voice: 'original',     // original | accomp
    playing: false,
    currentTime: 0,
    lyricIndex: 0,
    recordState: 'idle'    // idle | recording
  });

  // ===== 模块实例 =====
  const audio = new window.AudioEngine();
  const recorder = new window.Recorder();
  let radioEngine = null;     // 当前 radio 屏的粒子
  let karaokeEngine = null;   // 当前 karaoke 屏的粒子
  let playTimer = null;       // 歌曲播放定时器
  const startWallClock = { t: 0 };

  // ===== 搜索功能 =====
  function bindSearch() {
    $$('.search-bar').forEach(bar => {
      const input = bar.querySelector('input');
      const clear = bar.querySelector('.search-clear');
      input.addEventListener('input', (e) => {
        const q = e.target.value.trim();
        clear.style.display = q ? 'grid' : 'none';
        if (q) {
          filterSongs(q);
        } else {
          renderSongList();
        }
      });
      clear.addEventListener('click', () => {
        input.value = '';
        clear.style.display = 'none';
        renderSongList();
        input.focus();
      });
    });
  }

  function filterSongs(query) {
    const mood = store.get().mood;
    const list = $('#songList');
    list.innerHTML = '';
    const q = query.toLowerCase();
    const allSongs = window.SONGS.filter(s => 
      s.title.toLowerCase().includes(q) || 
      s.artist.toLowerCase().includes(q)
    );
    if (!allSongs.length) {
      list.innerHTML = '<div style="color:var(--ink-2);padding:40px 24px;text-align:center;font-size:14px;">未找到相关歌曲</div>';
      return;
    }
    allSongs.forEach(s => {
      const card = document.createElement('div');
      card.className = 'song-card';
      card.innerHTML = `
        <div class="song-cover" style="background:${s.cover}">
          <div class="play-overlay" aria-hidden="true">▶</div>
        </div>
        <div class="song-meta">
          <div class="t">${s.title}</div>
          <div class="a">${s.artist} · ${fmtTime(s.dur)}</div>
        </div>
      `;
      card.addEventListener('click', () => openKaraoke(s));
      list.appendChild(card);
    });
  }
  function fmtTime(sec) {
    sec = Math.max(0, Math.floor(sec));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m + ':' + String(s).padStart(2, '0');
  }
  function setScreen(name) {
    store.set({ screen: name });
    $$('.screen').forEach(el => el.classList.remove('active'));
    const map = { boot: '#boot', radio: '#radio', karaoke: '#karaoke', card: '#card' };
    $(map[name]).classList.add('active');
    if (name === 'radio')   startRadio();
    if (name === 'karaoke') startKaraoke();
  }
  function applyMoodVars(mood) {
    document.documentElement.style.setProperty('--from', mood.palette.from);
    document.documentElement.style.setProperty('--to', mood.palette.to);
    document.documentElement.style.setProperty('--accent', mood.palette.accent);
  }
  function showToast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => t.classList.remove('show'), 1800);
  }

  // ===== 1) 启动屏：心情选择 =====
  function renderBoot() {
    const grid = $('#moodGrid');
    grid.innerHTML = '';
    window.MOODS.forEach(m => {
      const cell = document.createElement('button');
      cell.className = 'mood-cell';
      cell.dataset.mood = m.id;
      cell.style.setProperty('--from', m.palette.from);
      cell.style.setProperty('--to', m.palette.to);
      cell.innerHTML = `
        <div class="emo">${m.icon}</div>
        <div class="nm">${m.name}</div>
        <div class="en">${m.en}</div>
      `;
      cell.addEventListener('click', () => {
        store.set({ mood: m });
        setScreen('radio');
      });
      grid.appendChild(cell);
    });
  }

  // ===== 音频事件绑定 =====
  function bindAudioEvents() {
    audio.onTimeUpdate((currentTime, duration) => {
      const s = store.get().song;
      if (!s) return;
      const lrc = window.LRC[s.id] || [];
      let idx = 0;
      for (let i = 0; i < lrc.length; i++) if (lrc[i][0] <= currentTime) idx = i + 1;
      store.set({ currentTime, lyricIndex: idx });
    });
    audio.onEnded(() => {
      store.set({ playing: false, currentTime: 0, lyricIndex: 0 });
      $('#playToggle').textContent = '▶';
    });
    audio.onLoaded((duration) => {
      const s = store.get().song;
      if (s) {
        s.dur = duration;
        if (store.get().screen === 'radio') renderSongList();
      }
    });
  }

  // ===== 2) 情绪电台 =====
  function startRadio() {
    const mood = store.get().mood;
    applyMoodVars(mood);

    $('#radioTitle').textContent = mood.name + ' 电台';
    $('#radioSub').textContent = mood.desc;

    // 头部 mood pill
    const pill = $('#radioMoodPill');
    pill.querySelector('.label').textContent = mood.icon + '  ' + mood.name + ' · ' + mood.en;
    pill.querySelector('.dot').style.background =
      `linear-gradient(135deg, ${mood.palette.from}, ${mood.palette.to})`;

    // 粒子
    const cv = $('#radioCanvas');
    if (!radioEngine) radioEngine = new window.ParticleEngine(cv, mood);
    radioEngine.setMood(mood);
    radioEngine.start();

    // 歌单
    renderSongList();

    // 上一首 / 下一首 / 暂停
    bindRadioControls();
  }

  function renderSongList() {
    const mood = store.get().mood;
    const list = $('#songList');
    list.innerHTML = '';
    const ids = mood.songs;
    ids.forEach((id, i) => {
      const s = window.SONGS.find(x => x.id === id);
      if (!s) return;
      const card = document.createElement('div');
      card.className = 'song-card';
      card.innerHTML = `
        <div class="song-cover" style="background:${s.cover}">
          <div class="play-overlay" aria-hidden="true">▶</div>
        </div>
        <div class="song-meta">
          <div class="t">${s.title}</div>
          <div class="a">${s.artist} · ${fmtTime(s.dur)}</div>
        </div>
      `;
      card.addEventListener('click', () => openKaraoke(s));
      list.appendChild(card);
    });
  }

  function bindRadioControls() {
    const s = store.get().song;
    const bar = $('#nowBar');
    bar.style.display = 'flex';
    if (s) {
      bar.querySelector('.cover').style.background = s.cover;
      bar.querySelector('.t').textContent = s.title;
      bar.querySelector('.s').textContent = s.artist;
    } else {
      bar.querySelector('.cover').style.background = `linear-gradient(135deg, ${store.get().mood.palette.from}, ${store.get().mood.palette.to})`;
      bar.querySelector('.t').textContent = '未播放';
      bar.querySelector('.s').textContent = '轻触进入 K 歌';
    }
    $('#playToggle').onclick = () => {
      const cur = store.get();
      if (!cur.song) {
        const first = window.SONGS.find(x => x.id === cur.mood.songs[0]);
        if (first) openKaraoke(first);
        return;
      }
      if (cur.playing) {
        audio.pause();
        store.set({ playing: false });
        $('#playToggle').textContent = '▶';
      } else {
        audio.resume();
        store.set({ playing: true });
        $('#playToggle').textContent = '⏸';
      }
    };
    bar.onclick = () => {
      const cur = store.get();
      if (cur.song) openKaraoke(cur.song);
    };
    $('#backFromRadio').onclick = () => {
      audio.stop();
      if (radioEngine) radioEngine.stop();
      store.set({ playing: false, song: null, currentTime: 0, lyricIndex: 0 });
      setScreen('boot');
    };
  }

  // ===== 3) K 歌 =====
  function openKaraoke(song) {
    store.set({ song, voice: 'original', currentTime: 0, lyricIndex: 0, playing: true });
    setScreen('karaoke');
  }

  function startKaraoke() {
    const { mood, song, voice } = store.get();
    if (!song) return;
    applyMoodVars(mood);

    // 粒子背景
    const cv = $('#karaokeCanvas');
    if (!karaokeEngine) karaokeEngine = new window.ParticleEngine(cv, mood);
    karaokeEngine.setMood(mood);
    karaokeEngine.start();

    // 头部
    $('#kTitle').textContent = song.title;
    $('#kSub').textContent = song.artist;
    $('#kHero').style.background = song.cover;

    // 模式
    setVoiceMode(voice, false);

    // 音频
    audio.play(song, mood);
    store.set({ playing: true });
    $('#playToggle').textContent = '⏸';

    // 录音按钮
    const recBtn = $('#recordBtn');
    recBtn.classList.remove('recording');
    recBtn.innerHTML = '●  录制翻唱';

    // 进度
    updateProgress();

    bindKaraokeControls();
  }

  function setVoiceMode(mode, play = true) {
    store.set({ voice: mode });
    audio.setVoiceMode(mode);
    const opts = $$('.mode-switch .opt');
    opts.forEach(o => o.classList.toggle('on', o.dataset.mode === mode));
    const pill = $('.mode-switch .pill');
    pill.classList.toggle('right', mode === 'accomp');
    if (play) showToast(mode === 'original' ? '切换到原唱' : '切换到伴奏 · 想唱就唱');
  }

  function bindKaraokeControls() {
    $$('.mode-switch .opt').forEach(o => {
      o.onclick = () => setVoiceMode(o.dataset.mode, true);
    });
    $('#backFromKaraoke').onclick = () => {
      audio.pause();
      if (karaokeEngine) karaokeEngine.stop();
      setScreen('radio');
      bindRadioControls();
    };
    $('#recordBtn').onclick = async () => {
      const rs = recorder.state;
      if (rs === 'idle') {
        try {
          await recorder.start();
          const btn = $('#recordBtn');
          btn.classList.add('recording');
          btn.innerHTML = '<span class="pulse"></span> 停止录制';
          store.set({ recordState: 'recording' });
        } catch (e) {
          showToast(e.message || '无法访问麦克风');
        }
      } else {
        const result = await recorder.stop();
        const btn = $('#recordBtn');
        btn.classList.remove('recording');
        btn.innerHTML = '●  录制翻唱';
        if (result) {
          store.set({ recordState: 'idle' });
          showCoverCard(result.duration);
        }
      }
    };
  }

  function updateProgress() {
    if (store.get().screen !== 'karaoke') return;
    const { song, currentTime, lyricIndex } = store.get();
    if (!song) return;
    const lrc = window.LRC[song.id] || [];
    const dur = audio.getDuration() || song.dur || 0;

    // 进度
    const pct = dur > 0 ? Math.min(100, (currentTime / dur) * 100) : 0;
    $('#progressBar').style.width = pct + '%';
    $('#curTime').textContent = fmtTime(currentTime);
    $('#totalTime').textContent = fmtTime(dur);

    // 歌词
    const track = $('#lyricsTrack');
    if (!lrc.length) {
      track.innerHTML = '<div class="lyric-line active">（暂无歌词）</div>';
      return;
    }
    // 找到当前行
    let cur = 0;
    for (let i = 0; i < lrc.length; i++) {
      if (lrc[i][0] <= currentTime) cur = i;
    }
    track.innerHTML = lrc.map((row, i) => {
      const cls = i === cur ? 'active' : (Math.abs(i - cur) === 1 ? 'near' : '');
      return `<div class="lyric-line ${cls}">${row[1]}</div>`;
    }).join('');
    // 滚动到当前行
    const lines = $$('.lyric-line', track);
    if (lines[cur]) {
      const y = lines[cur].offsetTop;
      track.style.transform = `translateY(calc(50% - ${y}px - 18px))`;
    }
  }

  // 订阅：自动更新歌词 / 进度
  store.subscribe((s) => {
    if (s.screen === 'karaoke') updateProgress();
  });

  // ===== 4) 翻唱卡片 =====
  function showCoverCard(duration) {
    setScreen('card');
    const { song, mood } = store.get();
    const cv = $('#coverCanvas');
    cv.width = 720; cv.height = 1080;
    window.Recorder.renderCard(cv, { song, mood, duration });

    $('#downloadBtn').onclick = () => {
      const a = document.createElement('a');
      a.download = `MoodWave-${song.title}.png`;
      a.href = cv.toDataURL('image/png');
      a.click();
      showToast('已保存到下载文件夹');
    };
    $('#shareBtn').onclick = () => {
      // Demo 阶段：复制提示
      showToast('已复制分享口令（Demo 模拟）');
    };
    $('#backFromCard').onclick = () => {
      setScreen('karaoke');
    };
  }

  // ===== 启动 =====
  document.addEventListener('DOMContentLoaded', () => {
    renderBoot();
    bindSearch();
    bindAudioEvents();
    setScreen('boot');
  });
})();
