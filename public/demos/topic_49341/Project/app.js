const ImagePreloader = {
  cache: new Map(),
  loadingQueue: [],
  isPreloading: false,
  totalImages: 0,
  loadedImages: 0,
  onProgress: null,
  onComplete: null,

  preloadAll(acts, onProgress, onComplete) {
    // 使用 ImageManager 的预加载功能
    if (typeof ImageManager !== 'undefined') {
      ImageManager.preloadAll(acts, onProgress, onComplete);
      this.totalImages = ImageManager.totalImages;
      this.loadedImages = ImageManager.loadedImages;
    } else {
      console.warn('[ImagePreloader] ImageManager 不可用');
      if (onComplete) onComplete();
    }
  },

  getImage(prompt) {
    if (typeof ImageManager !== 'undefined') {
      return ImageManager.getImageUrl(prompt);
    }
    return '';
  }
};

const Game = {
  state: {
    currentAct: 0,
    currentSceneId: null,
    choices: [],
    currentPoemLine: 0,
    poemTimer: null,
    poemPage: 1,
    poemPages: [],
    poemHint: null,
    isTransitioning: false,
    videoCurrentShot: 0,
    videoTimer: null,
    videoProgressTimer: null,
    videoStartTime: 0,
    videoIsPlaying: false,
    isPreloading: true,
    preloadComplete: false
  },

  acts: [],
  currentActData: null,
  currentScene: null,

  elements: {
    app: null,
    startScreen: null,
    gameScreen: null,
    endScreen: null,
    progressBar: null,
    progressFill: null,
    actTitle: null,
    actHeader: null,
    sceneBg: null,
    sceneBgNext: null,
    poemContainer: null,
    poemLines: null,
    poemHint: null,
    poemPage: null,
    videoContainer: null,
    videoSubtitle: null,
    videoProgressFill: null,
    videoDots: null,
    videoHint: null,
    choiceContainer: null,
    choiceQuestion: null,
    choiceOptions: null,
    reflectionContainer: null,
    reflectionText: null,
    continueBtn: null,
    endTitle: null,
    endSubtitle: null,
    endDescription: null,
    badgesContainer: null,
    restartBtn: null,
    audioToggle: null,
    preloadScreen: null,
    preloadText: null,
    preloadProgress: null,
    preloadProgressBar: null
  },

  init() {
    this.acts = [window.actHome, window.actSchool, window.actPeople];
    
    this._cacheElements();
    this._bindEvents();
    
    AudioManager.init();
    
    this._showPreloadScreen();
    this._startPreloading();
  },

  _cacheElements() {
    this.elements.app = document.getElementById('app');
    this.elements.startScreen = document.getElementById('start-screen');
    this.elements.gameScreen = document.getElementById('game-screen');
    this.elements.endScreen = document.getElementById('end-screen');
    this.elements.progressBar = document.getElementById('progress-bar');
    this.elements.progressFill = document.getElementById('progress-fill');
    this.elements.actHeader = document.getElementById('act-header');
    this.elements.actTitle = document.getElementById('act-title');
    this.elements.sceneBg = document.getElementById('scene-bg');
    this.elements.sceneBgNext = document.getElementById('scene-bg-next');
    this.elements.poemContainer = document.getElementById('poem-container');
    this.elements.poemLines = document.getElementById('poem-lines');
    this.elements.poemHint = document.getElementById('poem-hint');
    this.elements.poemPage = document.getElementById('poem-page');
    this.elements.videoContainer = document.getElementById('video-container');
    this.elements.videoSubtitle = document.getElementById('video-subtitle');
    this.elements.videoProgressFill = document.getElementById('video-progress-fill');
    this.elements.videoDots = document.getElementById('video-dots');
    this.elements.videoHint = document.getElementById('video-hint');
    this.elements.choiceContainer = document.getElementById('choice-container');
    this.elements.choiceQuestion = document.getElementById('choice-question');
    this.elements.choiceOptions = document.getElementById('choice-options');
    this.elements.reflectionContainer = document.getElementById('reflection-container');
    this.elements.reflectionText = document.getElementById('reflection-text');
    this.elements.continueBtn = document.getElementById('continue-btn');
    this.elements.endTitle = document.getElementById('end-title');
    this.elements.endSubtitle = document.getElementById('end-subtitle');
    this.elements.endDescription = document.getElementById('end-description');
    this.elements.badgesContainer = document.getElementById('badges-container');
    this.elements.restartBtn = document.getElementById('restart-btn');
    this.elements.audioToggle = document.getElementById('audio-toggle');
    this.elements.preloadScreen = document.getElementById('preload-screen');
    this.elements.preloadText = document.getElementById('preload-text');
    this.elements.preloadProgressBar = document.getElementById('preload-progress-bar');
    this.elements.preloadPercent = document.querySelector('.preload-percent');
  },

  _bindEvents() {
    document.getElementById('start-btn').addEventListener('click', () => {
      AudioManager.resume();
      AudioManager.playSFX('click');
      this.startGame();
    });

    this.elements.continueBtn.addEventListener('click', () => {
      AudioManager.playSFX('click');
      this._handleContinue();
    });

    this.elements.restartBtn.addEventListener('click', () => {
      AudioManager.playSFX('click');
      this.restartGame();
    });

    this.elements.audioToggle.addEventListener('click', () => {
      const enabled = AudioManager.toggleMute();
      this.elements.audioToggle.textContent = enabled ? '🔊' : '🔇';
    });

    this.elements.poemContainer.addEventListener('click', () => {
      if (this.state.poemHint) {
        AudioManager.playSFX('click');
        this._continuePoem();
      } else if (this.state.poemTimer) {
        this._skipPoem();
      }
    });

    this.elements.videoContainer.addEventListener('click', () => {
      if (this.state.videoIsPlaying) {
        this._skipVideoShot();
      }
    });

    this.elements.reflectionContainer.addEventListener('click', (e) => {
      if (e.target === this.elements.continueBtn) return;
      this._handleContinue();
    });
  },

  _showPreloadScreen() {
    // 确保预加载界面存在
    if (!this.elements.preloadScreen) {
      const preloadHTML = `
        <div id="preload-screen" class="preload-screen">
          <div class="preload-content">
            <h2 class="preload-title">少年渡</h2>
            <p class="preload-text">正在准备故事...</p>
            <div class="preload-progress-bar">
              <div id="preload-progress-bar" class="preload-progress-fill"></div>
            </div>
            <p class="preload-percent">0%</p>
          </div>
        </div>
      `;
      document.getElementById('app').insertAdjacentHTML('afterbegin', preloadHTML);
      this.elements.preloadScreen = document.getElementById('preload-screen');
      this.elements.preloadText = document.querySelector('.preload-text');
      this.elements.preloadProgressBar = document.getElementById('preload-progress-bar');
      this.elements.preloadPercent = document.querySelector('.preload-percent');
    }
    
    this.elements.startScreen.style.display = 'none';
    this.elements.preloadScreen.style.display = 'flex';
  },

  _startPreloading() {
    ImagePreloader.preloadAll(this.acts, (loaded, total) => {
      const percent = Math.round((loaded / total) * 100);
      this.elements.preloadProgressBar.style.width = percent + '%';
      this.elements.preloadText.textContent = `正在准备故事... ${loaded}/${total}`;
      if (this.elements.preloadPercent) {
        this.elements.preloadPercent.textContent = percent + '%';
      }
    }, () => {
      // 预加载完成
      setTimeout(() => {
        this.state.isPreloading = false;
        this.state.preloadComplete = true;
        this._showStartScreen();
      }, 500);
    });
  },

  _showStartScreen() {
    this.elements.preloadScreen.style.display = 'none';
    this.elements.startScreen.style.display = 'flex';
    this.elements.startScreen.style.opacity = '1';
    this.elements.gameScreen.style.display = 'none';
    this.elements.endScreen.style.display = 'none';
    this.elements.progressBar.style.opacity = '0';
    this.elements.audioToggle.style.display = 'none';
  },

  startGame() {
    this.state = {
      currentAct: 0,
      currentSceneId: null,
      choices: [],
      currentPoemLine: 0,
      poemTimer: null,
      poemPage: 1,
      poemPages: [],
      poemHint: null,
      isTransitioning: false,
      videoCurrentShot: 0,
      videoTimer: null,
      videoProgressTimer: null,
      videoStartTime: 0,
      videoIsPlaying: false,
      isPreloading: false,
      preloadComplete: true
    };

    this.elements.startScreen.style.opacity = '0';
    setTimeout(() => {
      this.elements.startScreen.style.display = 'none';
      this.elements.gameScreen.style.display = 'flex';
      this.elements.audioToggle.style.display = 'block';
      this.elements.progressBar.style.opacity = '1';
      requestAnimationFrame(() => {
        this.elements.gameScreen.style.opacity = '1';
      });
      this._startAct(0);
    }, 800);
  },

  _startAct(actIndex) {
    this.state.currentAct = actIndex;
    this.currentActData = this.acts[actIndex];
    this.state.currentSceneId = null;
    this.state.currentPoemLine = 0;

    this._updateProgress();
    
    AudioManager.playBGM(this.currentActData.id);
    AudioManager.playSFX('transition');
    
    // 使用预加载的图片
    const bgUrl = ImagePreloader.getImage(this.currentActData.poemBg[0]);
    this._setSceneBgFromUrl(bgUrl);
    
    this.elements.actTitle.textContent = this.currentActData.title;
    this.elements.actHeader.style.opacity = '0';

    this._hideAllPanels();

    setTimeout(() => {
      this.elements.actHeader.style.opacity = '1';
      this._startPoem();
    }, 1000);
  },

  _setSceneBg(prompt, callback) {
    const url = ImagePreloader.getImage(prompt);
    this._setSceneBgFromUrl(url, callback);
  },

  _setSceneBgFromUrl(url, callback) {
    this.elements.sceneBgNext.style.backgroundImage = `url(${url})`;
    this.elements.sceneBgNext.style.opacity = '1';
    
    setTimeout(() => {
      this.elements.sceneBg.style.backgroundImage = `url(${url})`;
      this.elements.sceneBgNext.style.opacity = '0';
      if (callback) callback();
    }, 1000);
  },

  _startPoem() {
    this.elements.poemContainer.style.display = 'flex';
    this.elements.poemLines.innerHTML = '';
    this.elements.poemHint.textContent = '';
    this.elements.poemHint.classList.remove('visible');
    this.state.currentPoemLine = 0;
    this.state.poemPage = 1;
    this.state.poemHint = null;

    const poem = this.currentActData.poem;
    this.state.poemPages = this._calculatePoemPages(poem);
    
    const totalPages = this.state.poemPages.length;
    this.elements.poemPage.textContent = `— ${this.state.poemPage} / ${totalPages} —`;

    this._showNextPoemLine(poem, 0);
  },

  _calculatePoemPages(poem) {
    const pages = [];
    let startIndex = 0;
    
    for (let i = 0; i < poem.length; i++) {
      if (poem[i] === '') {
        pages.push({ start: startIndex, end: i });
        startIndex = i + 1;
      }
    }
    
    if (startIndex < poem.length) {
      pages.push({ start: startIndex, end: poem.length });
    }
    
    return pages;
  },

  _showNextPoemLine(poem, index) {
    const pages = this.state.poemPages;
    const currentPageIndex = this.state.poemPage - 1;
    const currentPage = pages[currentPageIndex];
    
    if (currentPageIndex < pages.length - 1 && index >= currentPage.end) {
      this._showPoemPageTurnHint();
      return;
    }
    
    if (index >= poem.length) {
      this.state.poemTimer = setTimeout(() => {
        this._fadeOutPoem();
      }, 3000);
      return;
    }

    const line = poem[index];
    const lineEl = document.createElement('div');
    lineEl.className = 'poem-line';
    
    if (line === '') {
      lineEl.innerHTML = '&nbsp;';
      lineEl.style.height = '0.3em';
    } else {
      lineEl.textContent = line;
    }
    
    this.elements.poemLines.appendChild(lineEl);
    
    AudioManager.playSFX('page');
    
    requestAnimationFrame(() => {
      lineEl.classList.add('visible');
    });

    this.state.currentPoemLine = index;
    
    if (line && line.trim()) {
      const lineDuration = line.length * 60 + 500;
      this.state.poemTimer = setTimeout(() => {
        this._showNextPoemLine(poem, index + 1);
      }, lineDuration);
    } else {
      this.state.poemTimer = setTimeout(() => {
        this._showNextPoemLine(poem, index + 1);
      }, 300);
    }
  },

  _showPoemPageTurnHint() {
    this.elements.poemHint.textContent = '— 点击翻页 —';
    this.elements.poemHint.classList.add('visible');
    this.state.poemHint = this.elements.poemHint;
  },

  _continuePoem() {
    this.state.poemHint = null;
    this.elements.poemHint.classList.remove('visible');
    this.elements.poemHint.textContent = '';
    
    this.elements.poemContainer.style.opacity = '0';
    this.elements.poemContainer.style.transform = 'translate(-50%, -48%)';
    
    setTimeout(() => {
      this.elements.poemLines.innerHTML = '';
      this.state.poemPage++;
      const pages = this.state.poemPages;
      const nextPageStart = pages[this.state.poemPage - 1].start;
      
      this.elements.poemPage.textContent = `— ${this.state.poemPage} / ${pages.length} —`;
      
      const bgPrompt = this.currentActData.poemBg[this.state.poemPage - 1];
      if (bgPrompt) {
        const bgUrl = ImagePreloader.getImage(bgPrompt);
        this._setSceneBgFromUrl(bgUrl);
      }
      
      this.elements.poemContainer.style.opacity = '1';
      this.elements.poemContainer.style.transform = 'translate(-50%, -50%)';
      
      const poem = this.currentActData.poem;
      this._showNextPoemLine(poem, nextPageStart);
    }, 500);
  },

  _skipPoem() {
    if (this.state.poemTimer) {
      clearTimeout(this.state.poemTimer);
      this.state.poemTimer = null;
    }
    
    if (this.state.poemHint) {
      this._continuePoem();
      return;
    }
    
    const poem = this.currentActData.poem;
    const pages = this.state.poemPages;
    const currentPageIndex = this.state.poemPage - 1;
    const currentPage = pages[currentPageIndex];
    const container = this.elements.poemLines;
    
    container.innerHTML = '';
    
    for (let i = currentPage.start; i < currentPage.end; i++) {
      const line = poem[i];
      const lineEl = document.createElement('div');
      lineEl.className = 'poem-line';
      
      if (line === '') {
        lineEl.innerHTML = '&nbsp;';
        lineEl.style.height = '0.3em';
      } else {
        lineEl.textContent = line;
      }
      
      lineEl.classList.add('visible');
      container.appendChild(lineEl);
    }
    
    if (currentPageIndex < pages.length - 1) {
      this.state.poemTimer = setTimeout(() => {
        this._showPoemPageTurnHint();
      }, 1000);
    } else {
      this.state.poemTimer = setTimeout(() => {
        this._fadeOutPoem();
      }, 3000);
    }
  },

  _fadeOutPoem() {
    this.elements.poemContainer.style.opacity = '0';
    
    setTimeout(() => {
      this.elements.poemContainer.style.display = 'none';
      this.elements.actHeader.style.opacity = '0';
      const firstScene = this.currentActData.scenes[0];
      this._goToScene(firstScene.id);
    }, 500);
  },

  _goToScene(sceneId) {
    const scene = this.currentActData.scenes.find(s => s.id === sceneId);
    if (!scene) {
      console.warn('Scene not found:', sceneId);
      return;
    }
    
    this.currentScene = scene;
    this.state.currentSceneId = sceneId;

    this._hideAllPanels();
    
    if (scene.type === 'video') {
      const firstShot = scene.shots[0];
      if (firstShot && firstShot.image) {
        const bgUrl = ImagePreloader.getImage(firstShot.image);
        this._setSceneBgFromUrl(bgUrl);
      }
      setTimeout(() => {
        this._playVideoScene(scene);
      }, 600);
    } else if (scene.type === 'choice') {
      if (scene.bgImage) {
        const bgUrl = ImagePreloader.getImage(scene.bgImage);
        this._setSceneBgFromUrl(bgUrl);
      }
      setTimeout(() => {
        this._showChoice(scene);
      }, 600);
    } else if (scene.type === 'reflection') {
      if (scene.bgImage) {
        const bgUrl = ImagePreloader.getImage(scene.bgImage);
        this._setSceneBgFromUrl(bgUrl);
      }
      setTimeout(() => {
        this._showReflection(scene);
      }, 600);
    }
  },

  _playVideoScene(scene) {
    this._hideAllPanels();
    this.elements.videoContainer.style.display = 'flex';
    this.elements.videoSubtitle.textContent = '';
    this.elements.videoSubtitle.classList.remove('visible');
    this.elements.videoProgressFill.style.width = '0%';
    this.elements.videoHint.classList.remove('visible');
    this.state.videoCurrentShot = 0;
    this.state.videoIsPlaying = true;

    this._renderVideoDots(scene.shots.length);

    this.elements.videoContainer.style.opacity = '0';
    requestAnimationFrame(() => {
      this.elements.videoContainer.style.transition = 'opacity 0.6s ease';
      this.elements.videoContainer.style.opacity = '1';
    });

    setTimeout(() => {
      this._playShot(scene, 0);
    }, 600);

    setTimeout(() => {
      this.elements.videoHint.classList.add('visible');
    }, 2000);
  },

  _renderVideoDots(total) {
    this.elements.videoDots.innerHTML = '';
    for (let i = 0; i < total; i++) {
      const dot = document.createElement('div');
      dot.className = 'video-dot';
      if (i === 0) dot.classList.add('active');
      this.elements.videoDots.appendChild(dot);
    }
  },

  _updateVideoDots(currentIndex) {
    const dots = this.elements.videoDots.querySelectorAll('.video-dot');
    dots.forEach((dot, i) => {
      dot.classList.remove('active', 'done');
      if (i < currentIndex) {
        dot.classList.add('done');
      } else if (i === currentIndex) {
        dot.classList.add('active');
      }
    });
  },

  _playShot(scene, shotIndex) {
    if (shotIndex >= scene.shots.length) {
      this._finishVideoScene(scene);
      return;
    }

    const shot = scene.shots[shotIndex];
    this.state.videoCurrentShot = shotIndex;

    if (shot.image) {
      const bgUrl = ImagePreloader.getImage(shot.image);
      this._setSceneBgFromUrl(bgUrl);
    }

    this._updateVideoDots(shotIndex);

    this.elements.videoSubtitle.classList.remove('visible');
    
    setTimeout(() => {
      this.elements.videoSubtitle.textContent = shot.text;
      this.elements.videoSubtitle.classList.add('visible');
      
      AudioManager.playSFX('page');
    }, 300);

    this._startProgressBar(shot.duration);

    this.state.videoTimer = setTimeout(() => {
      this._playShot(scene, shotIndex + 1);
    }, shot.duration);
  },

  _startProgressBar(duration) {
    if (this.state.videoProgressTimer) {
      clearInterval(this.state.videoProgressTimer);
    }
    
    this.elements.videoProgressFill.style.width = '0%';
    this.state.videoStartTime = Date.now();
    
    this.state.videoProgressTimer = setInterval(() => {
      const elapsed = Date.now() - this.state.videoStartTime;
      const progress = Math.min((elapsed / duration) * 100, 100);
      this.elements.videoProgressFill.style.width = progress + '%';
      
      if (progress >= 100) {
        clearInterval(this.state.videoProgressTimer);
        this.state.videoProgressTimer = null;
      }
    }, 50);
  },

  _skipVideoShot() {
    if (!this.state.videoIsPlaying) return;

    if (this.state.videoTimer) {
      clearTimeout(this.state.videoTimer);
      this.state.videoTimer = null;
    }
    if (this.state.videoProgressTimer) {
      clearInterval(this.state.videoProgressTimer);
      this.state.videoProgressTimer = null;
    }

    const scene = this.currentScene;
    const nextShot = this.state.videoCurrentShot + 1;
    
    if (nextShot >= scene.shots.length) {
      this._finishVideoScene(scene);
    } else {
      this._playShot(scene, nextShot);
    }
  },

  _finishVideoScene(scene) {
    this.state.videoIsPlaying = false;
    
    if (this.state.videoProgressTimer) {
      clearInterval(this.state.videoProgressTimer);
      this.state.videoProgressTimer = null;
    }
    
    this.elements.videoProgressFill.style.width = '100%';
    this.elements.videoHint.textContent = '— 点击继续 —';

    const handleClick = () => {
      this.elements.videoContainer.removeEventListener('click', handleClick);
      if (scene.nextScene) {
        AudioManager.playSFX('click');
        this._goToScene(scene.nextScene);
      }
    };

    this.elements.videoContainer.addEventListener('click', handleClick);
  },

  _showChoice(scene) {
    this._hideAllPanels();
    this.elements.choiceContainer.style.display = 'block';
    this.elements.choiceQuestion.textContent = '';
    this.elements.choiceOptions.innerHTML = '';
    
    this.elements.choiceContainer.style.opacity = '0';
    this.elements.choiceContainer.style.transform = 'translate(-50%, -50%) scale(0.95)';
    
    requestAnimationFrame(() => {
      this.elements.choiceContainer.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      this.elements.choiceContainer.style.opacity = '1';
      this.elements.choiceContainer.style.transform = 'translate(-50%, -50%) scale(1)';
    });

    this._typeText(scene.question, this.elements.choiceQuestion, () => {
      scene.options.forEach((option, index) => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn' + (option.isPositive ? ' positive' : ' negative');
        btn.textContent = option.text;
        
        btn.addEventListener('click', () => {
          AudioManager.playSFX(option.isPositive ? 'positive' : 'negative');
          this._makeChoice(index, option);
        });
        
        this.elements.choiceOptions.appendChild(btn);
        
        setTimeout(() => {
          btn.classList.add('visible');
        }, 200 + index * 200);
      });
    });
  },

  _typeText(text, element, callback) {
    element.textContent = '';
    
    let index = 0;
    const typeNext = () => {
      if (index >= text.length) {
        if (callback) callback();
        return;
      }

      element.textContent += text[index];
      index++;
      
      setTimeout(typeNext, 40);
    };

    typeNext();
  },

  _makeChoice(optionIndex, option) {
    this.state.choices.push({
      act: this.state.currentAct,
      sceneId: this.state.currentSceneId,
      optionIndex: optionIndex,
      isPositive: option.isPositive,
      isBrave: option.isBrave || false,
      isThinker: option.isThinker || false
    });

    Storage.saveChoices(this.state.choices);

    this.elements.choiceContainer.style.opacity = '0';
    setTimeout(() => {
      this._goToScene(option.nextScene);
    }, 400);
  },

  _showReflection(scene) {
    this._hideAllPanels();
    this.elements.reflectionContainer.style.display = 'block';
    this.elements.reflectionText.textContent = '';
    this.elements.continueBtn.style.display = 'none';
    
    this.elements.reflectionContainer.style.opacity = '0';
    this.elements.reflectionContainer.style.transform = 'translate(-50%, -50%) scale(0.95)';
    
    requestAnimationFrame(() => {
      this.elements.reflectionContainer.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      this.elements.reflectionContainer.style.opacity = '1';
      this.elements.reflectionContainer.style.transform = 'translate(-50%, -50%) scale(1)';
    });

    this._typeText(scene.text, this.elements.reflectionText, () => {
      this.elements.continueBtn.style.display = 'block';
      
      if (scene.nextAct === 'end') {
        this.elements.continueBtn.textContent = '查看结局 →';
      } else if (scene.nextAct) {
        this.elements.continueBtn.textContent = '前往下一幕 →';
      } else {
        this.elements.continueBtn.textContent = '继续 →';
      }
    });
  },

  _handleContinue() {
    if (this.currentScene && this.currentScene.type === 'reflection') {
      if (this.currentScene.nextAct === 'end') {
        this._showEnding();
      } else if (this.currentScene.nextAct) {
        const nextActIndex = this.state.currentAct + 1;
        if (nextActIndex < this.acts.length) {
          this._startAct(nextActIndex);
        }
      } else if (this.currentScene.nextScene) {
        this._goToScene(this.currentScene.nextScene);
      }
    }
  },

  _showEnding() {
    AudioManager.playSFX('transition');
    AudioManager.stopBGM();

    const endingId = window.calculateEnding(this.state.choices);
    const ending = window.endings.find(e => e.id === endingId);
    
    const badges = window.calculateBadges(this.state.choices, true);
    const savedBadges = Storage.loadBadges();
    const newBadgeIds = badges.map(b => b.id);
    savedBadges.forEach(id => {
      if (!newBadgeIds.includes(id)) {
        const badge = window.badges.find(b => b.id === id);
        if (badge) badges.push(badge);
      }
    });
    Storage.saveBadges(badges.map(b => b.id));

    this.elements.endTitle.textContent = ending.icon + ' ' + ending.title;
    this.elements.endSubtitle.textContent = ending.subtitle;
    this.elements.endDescription.textContent = ending.description;

    this.elements.badgesContainer.innerHTML = '';
    const allBadges = window.badges;
    allBadges.forEach(badge => {
      const earned = badges.some(b => b.id === badge.id);
      const badgeEl = document.createElement('div');
      badgeEl.className = 'badge-item' + (earned ? ' earned' : ' locked');
      badgeEl.innerHTML = `
        <div class="badge-icon">${badge.icon}</div>
        <div class="badge-name">${badge.name}</div>
        <div class="badge-desc">${badge.description}</div>
      `;
      badgeEl.style.opacity = '0';
      badgeEl.style.transform = 'translateY(20px)';
      this.elements.badgesContainer.appendChild(badgeEl);
    });

    this.elements.gameScreen.style.opacity = '0';
    setTimeout(() => {
      this.elements.gameScreen.style.display = 'none';
      this.elements.progressBar.style.opacity = '0';
      this.elements.audioToggle.style.display = 'none';
      this.elements.endScreen.style.display = 'flex';
      
      requestAnimationFrame(() => {
        this.elements.endScreen.style.opacity = '1';
        
        const badgeItems = this.elements.badgesContainer.querySelectorAll('.badge-item');
        badgeItems.forEach((item, i) => {
          setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
          }, 500 + i * 150);
        });
      });
    }, 800);
  },

  restartGame() {
    this.elements.endScreen.style.opacity = '0';
    setTimeout(() => {
      this.elements.endScreen.style.display = 'none';
      this._showStartScreen();
      requestAnimationFrame(() => {
        this.elements.startScreen.style.opacity = '1';
      });
    }, 600);
  },

  _updateProgress() {
    const progress = ((this.state.currentAct) / this.acts.length) * 100;
    this.elements.progressFill.style.width = progress + '%';
    
    const act = this.currentActData || this.acts[0];
    this.elements.progressFill.style.background = act.moodColor;
  },

  _hideAllPanels() {
    if (this.state.poemTimer) {
      clearTimeout(this.state.poemTimer);
      this.state.poemTimer = null;
    }
    if (this.state.videoTimer) {
      clearTimeout(this.state.videoTimer);
      this.state.videoTimer = null;
    }
    if (this.state.videoProgressTimer) {
      clearInterval(this.state.videoProgressTimer);
      this.state.videoProgressTimer = null;
    }
    this.state.videoIsPlaying = false;
    this.state.poemHint = null;

    this.elements.poemContainer.style.display = 'none';
    this.elements.poemContainer.style.opacity = '1';
    this.elements.videoContainer.style.display = 'none';
    this.elements.videoContainer.style.opacity = '1';
    this.elements.videoHint.textContent = '— 点击跳过 —';
    this.elements.videoHint.classList.remove('visible');
    this.elements.choiceContainer.style.display = 'none';
    this.elements.reflectionContainer.style.display = 'none';
    this.elements.continueBtn.style.display = 'none';
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Game.init();
});
