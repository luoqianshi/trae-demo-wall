const root = document.querySelector('#pet-root');
const videoLayers = [
  document.querySelector('#pet-video-a'),
  document.querySelector('#pet-video-b')
];
const fallbackPet = document.querySelector('#fallback-pet');
const bubble = document.querySelector('#speech-bubble');

let state = 'idle';
let stateUntil = 0;
let bubbleTimer = 0;
let clickCount = 0;
let clickTimer = 0;
let isPointerDown = false;
let hasDragged = false;
let dragStartPointer = null;
let dragStartWindow = null;
let movementTimer = 0;
let autoTimer = 0;
let activeVideoIndex = 0;
let videoTransitionId = 0;

const ACTION_VIDEO_DIR = '../assets/video-pets/my-cat';
const ACTION_VIDEOS = {
  idle: `${ACTION_VIDEO_DIR}/idle.webm`,
  walk: `${ACTION_VIDEO_DIR}/walk.webm`,
  sleep: `${ACTION_VIDEO_DIR}/sleep_loop.webm`,
  happy: `${ACTION_VIDEO_DIR}/happy.webm`,
  happy_hold: `${ACTION_VIDEO_DIR}/happy_hold.webm`,
  paw: `${ACTION_VIDEO_DIR}/paw_hit.webm`,
  angry: `${ACTION_VIDEO_DIR}/angry_run.webm`,
  crazy: `${ACTION_VIDEO_DIR}/crazy_run.webm`
};

function say(text, duration = 1400) {
  bubble.textContent = text;
  bubble.classList.add('is-visible');
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => bubble.classList.remove('is-visible'), duration);
}

function setVisualState(nextState) {
  root.classList.remove(
    'state-idle',
    'state-walk',
    'state-sleep',
    'state-happy',
    'state-happy_hold',
    'state-paw',
    'state-angry',
    'state-crazy'
  );
  root.classList.add(`state-${nextState}`);
}

function preloadVideo(videoElement, source, loop) {
  return new Promise((resolve, reject) => {
    const done = () => {
      videoElement.removeEventListener('canplay', done);
      videoElement.removeEventListener('loadeddata', done);
      videoElement.removeEventListener('error', fail);
      resolve();
    };

    const fail = () => {
      videoElement.removeEventListener('canplay', done);
      videoElement.removeEventListener('loadeddata', done);
      videoElement.removeEventListener('error', fail);
      reject(new Error(`视频加载失败：${source}`));
    };

    videoElement.loop = loop;
    videoElement.muted = true;
    videoElement.playsInline = true;

    if (!videoElement.src.endsWith(source)) {
      videoElement.addEventListener('canplay', done, { once: true });
      videoElement.addEventListener('loadeddata', done, { once: true });
      videoElement.addEventListener('error', fail, { once: true });
      videoElement.src = source;
      videoElement.load();
      return;
    }

    if (videoElement.readyState >= 2) {
      resolve();
      return;
    }

    videoElement.addEventListener('canplay', done, { once: true });
    videoElement.addEventListener('loadeddata', done, { once: true });
    videoElement.addEventListener('error', fail, { once: true });
  });
}

async function playActionVideo(nextState, loop = false) {
  const source = ACTION_VIDEOS[nextState];
  const transitionId = ++videoTransitionId;

  if (!source) {
    videoLayers.forEach((layer) => layer.classList.remove('is-active'));
    fallbackPet.style.display = 'block';
    return;
  }

  const currentVideo = videoLayers[activeVideoIndex];
  const nextVideoIndex = activeVideoIndex === 0 ? 1 : 0;
  const nextVideo = videoLayers[nextVideoIndex];

  try {
    await preloadVideo(nextVideo, source, loop);

    if (transitionId !== videoTransitionId) return;

    nextVideo.currentTime = 0;
    fallbackPet.style.display = 'none';

    const playPromise = nextVideo.play();

    if (playPromise) {
      await playPromise;
    }

    if (transitionId !== videoTransitionId) return;

    nextVideo.classList.add('is-active');
    currentVideo.classList.remove('is-active');
    activeVideoIndex = nextVideoIndex;

    setTimeout(() => {
      if (!currentVideo.classList.contains('is-active')) {
        currentVideo.pause();
      }
    }, 320);
  } catch {
    videoLayers.forEach((layer) => layer.classList.remove('is-active'));
    fallbackPet.style.display = 'block';
  }
}

function warmupActionVideos() {
  Object.values(ACTION_VIDEOS).forEach((source) => {
    const warmup = document.createElement('video');
    warmup.muted = true;
    warmup.playsInline = true;
    warmup.preload = 'auto';
    warmup.src = source;
  });
}

function setState(nextState, options = {}) {
  const { duration = 0, loop = false, message = '', afterState = 'idle' } = options;

  clearTimeout(stateUntil);
  state = nextState;
  setVisualState(nextState);
  playActionVideo(nextState, loop || nextState === 'idle' || nextState === 'sleep' || nextState === 'happy_hold');

  if (message) {
    say(message, 1400);
  }

  if (duration > 0) {
    stateUntil = setTimeout(() => setState(afterState, { loop: true }), duration);
  }
}

function triggerHappy() {
  setState('happy', {
    duration: 4000,
    afterState: 'happy_hold',
    message: ['摸摸头！', '我在这里', '今天也要开心', '喵，收到'][Math.floor(Math.random() * 4)]
  });
}

function triggerSleep() {
  stopMovement();
  setState('sleep', { loop: true, message: '我要睡一会儿' });
}

function triggerPaw() {
  setState('paw', {
    duration: 850,
    message: '啪！不许连点'
  });
}

function triggerAngryRun() {
  setState('angry', {
    duration: 1800,
    message: '呲牙！我跑了'
  });
  moveWindowPath('run-away', 1800);
}

function triggerCrazyRun() {
  setState('crazy', {
    duration: 3600,
    message: '突然来劲了！'
  });
  moveWindowPath('crazy', 3600);
}

function triggerWalk() {
  setState('walk', {
    duration: 2600,
    message: '我去散步啦'
  });
  moveWindowPath('walk', 2600);
}

function handlePetClick() {
  triggerHappy();
}

function stopMovement() {
  clearInterval(movementTimer);
}

async function moveWindowPath(kind, duration) {
  stopMovement();
  const startPosition = await window.desktopPet.getWindowPosition();
  const startTime = performance.now();
  const direction = Math.random() > 0.5 ? 1 : -1;

  movementTimer = setInterval(() => {
    const elapsed = performance.now() - startTime;
    const ratio = Math.min(elapsed / duration, 1);
    let x = startPosition[0];
    let y = startPosition[1];

    if (kind === 'walk') {
      x += direction * 90 * ratio;
      y += Math.sin(ratio * Math.PI * 4) * 4;
    }

    if (kind === 'crazy') {
      x += Math.sin(ratio * Math.PI * 10) * 70;
      y += Math.cos(ratio * Math.PI * 8) * 26;
    }

    if (kind === 'run-away') {
      x += direction * 170 * ratio;
      y += Math.sin(ratio * Math.PI * 3) * 16;
    }

    window.desktopPet.setWindowPosition(x, y);

    if (ratio >= 1) {
      stopMovement();
    }
  }, 33);
}

async function beginDrag(event) {
  if (event.button !== 0) return;

  isPointerDown = true;
  hasDragged = false;
  dragStartPointer = { x: event.screenX, y: event.screenY };
  dragStartWindow = await window.desktopPet.getWindowPosition();
  root.setPointerCapture(event.pointerId);
}

function updateDrag(event) {
  if (!isPointerDown || !dragStartWindow) return;

  const dx = event.screenX - dragStartPointer.x;
  const dy = event.screenY - dragStartPointer.y;

  if (Math.abs(dx) + Math.abs(dy) > 4) {
    hasDragged = true;
  }

  if (hasDragged) {
    window.desktopPet.setWindowPosition(dragStartWindow[0] + dx, dragStartWindow[1] + dy);
  }
}

function endDrag(event) {
  if (!isPointerDown) return;
  isPointerDown = false;
  dragStartPointer = null;
  dragStartWindow = null;

  try {
    root.releasePointerCapture(event.pointerId);
  } catch {
    // 指针可能已经被系统释放，这里不需要额外处理。
  }

  if (!hasDragged) {
    handlePetClick();
  }
}

root.addEventListener('pointerdown', beginDrag);
root.addEventListener('pointermove', updateDrag);
root.addEventListener('pointerup', endDrag);
root.addEventListener('pointercancel', endDrag);

root.addEventListener('contextmenu', (event) => {
  event.preventDefault();
  window.desktopPet.showContextMenu();
});

window.desktopPet.onPetAction((action) => {
  if (action === 'happy') {
    triggerHappy();
  }

  if (action === 'sleep') {
    triggerSleep();
  }

  if (action === 'wake') {
    setState('idle', { loop: true, message: '醒啦' });
  }

  if (action === 'crazy-run') {
    triggerCrazyRun();
  }

  if (action === 'walk') {
    triggerWalk();
  }
});

window.desktopPet.onSizeChanged((size) => {
  say(`已切换到${size.label}尺寸`, 1200);
});

window.desktopPet.onGenerationProgress((progress) => {
  if (progress?.message) {
    say(progress.message, 2200);
  }
});

function startAutoBehavior() {
  clearInterval(autoTimer);
}

warmupActionVideos();
setState('idle', { loop: true });
startAutoBehavior();
say('已启动');
