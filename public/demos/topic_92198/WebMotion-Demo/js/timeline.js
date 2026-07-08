/**
 * WebMotion - 时间轴控制（多场景版）
 * 全局时间轴跨所有场景
 */
const Timeline = (function() {
  let fps = 30;
  let currentTime = 0;
  let isPlaying = false;
  let isLooping = true;
  let lastTimestamp = 0;
  let animationId = null;
  let onTickCallback = null;
  let suppressClick = false; // 拖拽结束后短时间内抑制 click 事件，避免双重触发

  let track, progress, handle;
  let btnPlay, btnStop, btnPrev, btnNext;
  let selectFps, chkLoop;
  let timeCurrent, timeTotal, infoFrame;

  function init() {
    track = document.getElementById('timeline-track');
    progress = document.getElementById('timeline-progress');
    handle = document.getElementById('timeline-handle');
    btnPlay = document.getElementById('btn-play');
    btnStop = document.getElementById('btn-stop');
    btnPrev = document.getElementById('btn-prev-frame');
    btnNext = document.getElementById('btn-next-frame');
    selectFps = document.getElementById('select-fps');
    chkLoop = document.getElementById('chk-loop');
    timeCurrent = document.getElementById('time-current');
    timeTotal = document.getElementById('time-total');
    infoFrame = document.getElementById('info-frame');

    btnPlay.addEventListener('click', togglePlay);
    btnStop.addEventListener('click', stop);
    btnPrev.addEventListener('click', () => stepFrame(-1));
    btnNext.addEventListener('click', () => stepFrame(1));

    selectFps.addEventListener('change', e => {
      fps = parseInt(e.target.value);
      document.getElementById('info-fps').textContent = fps + ' fps';
      updateDisplay();
    });

    chkLoop.addEventListener('change', e => { isLooping = e.target.checked; });
    track.addEventListener('mousedown', startScrub);
    track.addEventListener('click', (e) => {
      if (suppressClick) return; // 拖拽刚结束，忽略此次 click
      scrubTo(e);
    });

    updateDisplay();
  }

  function getDuration() { return SceneManager.getTotalDuration(); }

  function togglePlay() { if (isPlaying) pause(); else play(); }

  function play() {
    if (isPlaying) return;
    isPlaying = true;
    lastTimestamp = performance.now();
    updatePlayButton();
    animationId = requestAnimationFrame(tick);
  }

  function pause() {
    isPlaying = false;
    updatePlayButton();
    if (animationId) { cancelAnimationFrame(animationId); animationId = null; }
  }

  function stop() {
    pause();
    currentTime = 0;
    updateDisplay();
    if (onTickCallback) onTickCallback(currentTime);
  }

  function tick(timestamp) {
    if (!isPlaying) return;
    const delta = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;
    currentTime += delta;
    const duration = getDuration();
    if (currentTime >= duration) {
      if (isLooping && duration > 0) { currentTime = currentTime % duration; }
      else { currentTime = duration; pause(); }
    }
    updateDisplay();
    if (onTickCallback) onTickCallback(currentTime);
    if (isPlaying) animationId = requestAnimationFrame(tick);
  }

  function stepFrame(direction) {
    pause();
    const frameDuration = 1 / fps;
    currentTime += direction * frameDuration;
    const duration = getDuration();
    if (currentTime < 0) currentTime = 0;
    if (currentTime > duration) currentTime = duration;
    updateDisplay();
    if (onTickCallback) onTickCallback(currentTime);
  }

  function startScrub(e) {
    pause();
    scrubTo(e);
    const onMove = (e) => scrubTo(e);
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      // 拖拽结束后短时间内抑制 click 事件，避免与 mousedown 中的 scrubTo 双重触发
      suppressClick = true;
      setTimeout(() => { suppressClick = false; }, 100);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  function scrubTo(e) {
    const rect = track.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const ratio = x / rect.width;
    currentTime = ratio * getDuration();
    updateDisplay();
    if (onTickCallback) onTickCallback(currentTime);
  }

  function seekTo(time) {
    currentTime = Math.max(0, Math.min(getDuration(), time));
    updateDisplay();
    if (onTickCallback) onTickCallback(currentTime);
  }

  function updateDisplay() {
    const duration = getDuration();
    const percent = duration > 0 ? (currentTime / duration) * 100 : 0;
    progress.style.width = percent + '%';
    handle.style.left = percent + '%';
    timeCurrent.textContent = Utils.formatTime(currentTime);
    timeTotal.textContent = Utils.formatTime(duration);
    const totalFrames = Math.floor(duration * fps);
    const currentFrame = Math.floor(currentTime * fps);
    infoFrame.textContent = `帧 ${currentFrame} / ${totalFrames}`;
  }

  function updatePlayButton() {
    const iconPlay = btnPlay.querySelector('.icon-play');
    const iconPause = btnPlay.querySelector('.icon-pause');
    iconPlay.style.display = isPlaying ? 'none' : 'block';
    iconPause.style.display = isPlaying ? 'block' : 'none';
  }

  function setOnTick(callback) { onTickCallback = callback; }
  function getFps() { return fps; }
  function getCurrentTime() { return currentTime; }
  function isPlayingState() { return isPlaying; }

  return {
    init, play, pause, stop, seekTo, setOnTick,
    getDuration, getFps, getCurrentTime, isPlayingState,
    updateDisplay
  };
})();
