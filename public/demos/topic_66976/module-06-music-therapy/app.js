/**
 * 模块6：音乐疗法
 */

(function() {
  'use strict';

  // 预设歌曲库（使用占位音频URL，实际使用时替换为真实音频文件）
  const defaultMusicLibrary = [
    { id: 1, title: '茉莉花', year: 1950, region: '江苏', url: '', liked: false },
    { id: 2, title: '我的祖国', year: 1956, region: '全国', url: '', liked: false },
    { id: 3, title: '让我们荡起双桨', year: 1955, region: '全国', url: '', liked: false },
    { id: 4, title: '甜蜜蜜', year: 1979, region: '港台', url: '', liked: false },
    { id: 5, title: '小城故事', year: 1979, region: '港台', url: '', liked: false },
    { id: 6, title: '一无所有', year: 1986, region: '大陆', url: '', liked: false },
    { id: 7, title: '童年', year: 1982, region: '港台', url: '', liked: false },
    { id: 8, title: '月亮代表我的心', year: 1973, region: '港台', url: '', liked: false },
    { id: 9, title: '东方红', year: 1960, region: '全国', url: '', liked: false },
    { id: 10, title: '在希望的田野上', year: 1981, region: '大陆', url: '', liked: false }
  ];

  // DOM 元素
  const els = {
    albumArt: document.getElementById('albumArt'),
    songTitle: document.getElementById('songTitle'),
    songMeta: document.getElementById('songMeta'),
    progressFill: document.getElementById('progressFill'),
    currentTime: document.getElementById('currentTime'),
    totalTime: document.getElementById('totalTime'),
    playBtn: document.getElementById('playBtn'),
    prevSongBtn: document.getElementById('prevSongBtn'),
    nextSongBtn: document.getElementById('nextSongBtn'),
    decadeTabs: document.getElementById('decadeTabs'),
    songList: document.getElementById('songList'),
    moodButtons: document.querySelector('.mood-buttons'),
    visualizer: document.getElementById('visualizer'),
    nowPlayingBadge: document.getElementById('nowPlayingBadge')
  };

  let songs = [];
  let currentIndex = -1;
  let audio = null;
  let isPlaying = false;
  let currentDecade = 'all';

  /**
   * 初始化
   */
  function init() {
    loadSongs();
    bindEvents();
    renderSongList();
  }

  /**
   * 加载歌曲
   */
  function loadSongs() {
    // 合并预设歌曲和用户偏好
    const prefs = Storage.get(StorageKeys.MUSIC_PREFS, {});
    songs = defaultMusicLibrary.map(song => ({
      ...song,
      liked: prefs[song.id]?.liked || false
    }));
  }

  /**
   * 渲染歌曲列表
   */
  function renderSongList() {
    if (!els.songList) return;

    const filtered = currentDecade === 'all'
      ? songs
      : songs.filter(s => {
          const decade = Math.floor(s.year / 10) * 10;
          return decade === parseInt(currentDecade);
        });

    if (filtered.length === 0) {
      els.songList.innerHTML = '<div class="empty-state-small"><p>该年代暂无歌曲</p></div>';
      return;
    }

    els.songList.innerHTML = filtered.map((song, idx) => {
      const globalIndex = songs.indexOf(song);
      return `
        <div class="song-item ${globalIndex === currentIndex ? 'active' : ''}" data-index="${globalIndex}">
          <div class="song-number">${globalIndex === currentIndex && isPlaying ? '&#9654;' : idx + 1}</div>
          <div class="song-item-info">
            <div class="song-item-title">${escapeHtml(song.title)}</div>
            <div class="song-item-meta">${song.year}年 · ${song.region}</div>
          </div>
          <button class="song-item-like ${song.liked ? 'liked' : ''}" data-index="${globalIndex}">
            ${song.liked ? '&#9829;' : '&#9825;'}
          </button>
        </div>
      `;
    }).join('');
  }

  /**
   * 使用 Web Audio API 生成简单的提示音
   */
  function generateTone(frequency, duration, type = 'sine') {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;

      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

      gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);

      return ctx;
    } catch (e) {
      console.warn('[MusicTherapy] Web Audio API 不可用:', e);
      return null;
    }
  }

  /**
   * 播放开始提示音（简单的五声音阶）
   */
  function playStartChime() {
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => generateTone(freq, 0.4, 'sine'), i * 120);
    });
  }

  /**
   * 播放歌曲
   */
  function playSong(index) {
    if (index < 0 || index >= songs.length) return;

    // 停止当前播放
    if (audio) {
      audio.pause();
      audio = null;
    }

    currentIndex = index;
    const song = songs[index];

    // 更新UI
    if (els.songTitle) els.songTitle.textContent = song.title;
    if (els.songMeta) els.songMeta.textContent = `${song.year}年 · ${song.region}`;

    // 如果有真实音频URL则播放真实音频，否则模拟播放并生成提示音
    if (song.url && song.url.trim() !== '') {
      playRealAudio(song);
    } else {
      playStartChime();
      simulatePlayback();
    }

    isPlaying = true;
    updatePlayButton();
    renderSongList();

    EventBus.emit(EVENTS.MUSIC_PLAYED, song);
  }

  /**
   * 播放真实音频
   */
  function playRealAudio(song) {
    try {
      audio = new Audio(song.url);

      audio.onplay = () => {
        updateVisualFeedback(true);
      };

      audio.onpause = () => {
        updateVisualFeedback(false);
      };

      audio.onended = () => {
        isPlaying = false;
        updatePlayButton();
        updateVisualFeedback(false);
        nextSong();
      };

      audio.ontimeupdate = () => {
        if (audio.duration) {
          const pct = (audio.currentTime / audio.duration) * 100;
          if (els.progressFill) els.progressFill.style.width = pct + '%';
          if (els.currentTime) els.currentTime.textContent = formatTime(audio.currentTime);
          if (els.totalTime) els.totalTime.textContent = formatTime(audio.duration);
        }
      };

      audio.onerror = () => {
        console.warn('[MusicTherapy] 音频加载失败，切换到模拟播放:', song.url);
        simulatePlayback();
      };

      audio.play().catch(err => {
        console.warn('[MusicTherapy] 音频播放失败:', err);
        simulatePlayback();
      });
    } catch (e) {
      console.warn('[MusicTherapy] 创建音频对象失败:', e);
      simulatePlayback();
    }
  }

  /**
   * 更新视觉反馈状态
   */
  function updateVisualFeedback(playing) {
    if (els.visualizer) {
      els.visualizer.classList.toggle('active', playing);
    }
    if (els.nowPlayingBadge) {
      els.nowPlayingBadge.classList.toggle('visible', playing);
    }
    if (els.albumArt) {
      els.albumArt.classList.toggle('playing', playing);
    }
  }

  /**
   * 模拟播放（因为没有真实音频文件）
   */
  function simulatePlayback() {
    updateVisualFeedback(true);

    let progress = 0;
    const duration = 180; // 模拟3分钟

    // 清除之前的模拟
    if (audio && audio._simInterval) {
      clearInterval(audio._simInterval);
    }

    audio = {
      _simInterval: setInterval(() => {
        progress += 1;
        const pct = (progress / duration) * 100;
        if (els.progressFill) els.progressFill.style.width = pct + '%';
        if (els.currentTime) els.currentTime.textContent = formatTime(progress);
        if (els.totalTime) els.totalTime.textContent = formatTime(duration);

        if (progress >= duration) {
          clearInterval(audio._simInterval);
          isPlaying = false;
          updatePlayButton();
          updateVisualFeedback(false);
          nextSong();
        }
      }, 1000),
      pause: function() {
        clearInterval(this._simInterval);
        updateVisualFeedback(false);
      }
    };
  }

  /**
   * 暂停/播放切换
   */
  function togglePlay() {
    if (currentIndex === -1) {
      playSong(0);
      return;
    }

    if (isPlaying) {
      if (audio) audio.pause();
      isPlaying = false;
    } else {
      simulatePlayback();
      isPlaying = true;
    }
    updatePlayButton();
    renderSongList();
  }

  /**
   * 上一首
   */
  function prevSong() {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : songs.length - 1;
    playSong(newIndex);
  }

  /**
   * 下一首
   */
  function nextSong() {
    const newIndex = currentIndex < songs.length - 1 ? currentIndex + 1 : 0;
    playSong(newIndex);
  }

  /**
   * 更新播放按钮
   */
  function updatePlayButton() {
    if (els.playBtn) {
      els.playBtn.innerHTML = isPlaying ? '&#9632;' : '&#9654;';
    }
  }

  /**
   * 切换喜欢
   */
  function toggleLike(index) {
    const song = songs[index];
    if (!song) return;

    song.liked = !song.liked;

    // 保存偏好
    const prefs = Storage.get(StorageKeys.MUSIC_PREFS, {});
    prefs[song.id] = { liked: song.liked };
    Storage.set(StorageKeys.MUSIC_PREFS, prefs);

    EventBus.emit(EVENTS.MUSIC_LIKED, { songId: song.id, liked: song.liked });

    renderSongList();
  }

  /**
   * 记录情绪
   */
  function recordMood(mood) {
    const song = currentIndex >= 0 ? songs[currentIndex] : null;

    const record = {
      type: 'music_mood',
      mood: mood,
      songId: song ? song.id : null,
      date: new Date().toISOString()
    };

    const records = Storage.get(StorageKeys.MOOD_RECORDS, []);
    records.push(record);
    Storage.set(StorageKeys.MOOD_RECORDS, records);

    EventBus.emit(EVENTS.MOOD_RECORDED, record);

    // 更新按钮状态
    document.querySelectorAll('.mood-btn').forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.mood === mood);
    });
  }

  /**
   * 格式化时间
   */
  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  /**
   * HTML 转义
   */
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 绑定事件
   */
  function bindEvents() {
    if (els.playBtn) els.playBtn.addEventListener('click', togglePlay);
    if (els.prevSongBtn) els.prevSongBtn.addEventListener('click', prevSong);
    if (els.nextSongBtn) els.nextSongBtn.addEventListener('click', nextSong);

    // 年代标签
    if (els.decadeTabs) {
      els.decadeTabs.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-btn')) {
          document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
          e.target.classList.add('active');
          currentDecade = e.target.dataset.decade;
          renderSongList();
        }
      });
    }

    // 歌曲列表
    if (els.songList) {
      els.songList.addEventListener('click', (e) => {
        const songItem = e.target.closest('.song-item');
        const likeBtn = e.target.closest('.song-item-like');

        if (likeBtn) {
          e.stopPropagation();
          toggleLike(parseInt(likeBtn.dataset.index));
        } else if (songItem) {
          playSong(parseInt(songItem.dataset.index));
        }
      });
    }

    // 情绪按钮
    if (els.moodButtons) {
      els.moodButtons.addEventListener('click', (e) => {
        if (e.target.classList.contains('mood-btn')) {
          recordMood(e.target.dataset.mood);
        }
      });
    }
  }

  // 启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
