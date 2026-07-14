(function() {
    const loadingOverlay = document.getElementById('loading-overlay');
    const gameWrapper = document.getElementById('game-wrapper');
    const mainMenu = document.getElementById('main-menu');
    const endScreen = document.getElementById('end-screen');
    const uiTop = document.getElementById('ui-top');
    const uiBottom = document.getElementById('ui-bottom');
    const startBtn = document.getElementById('start-btn');
    const backToMenuBtn = document.getElementById('back-to-menu-btn');
    let skipTutorialBtn = null;
    let game = null;
    let sceneManager = null;

    function resizeGame() {
        const container = document.getElementById('game-container');
        const cw = container.clientWidth;
        const ch = container.clientHeight;
        const scaleX = cw / 1280;
        const scaleY = ch / 720;
        const scale = Math.min(scaleX, scaleY);
        gameWrapper.style.transform = `scale(${scale})`;
    }

    function updateUIForState(state) {
        if (state === 'menu') {
            mainMenu.style.display = 'flex';
            endScreen.style.display = 'none';
            uiTop.style.display = 'none';
            uiBottom.style.display = 'none';
        } else if (state === 'intro') {
            mainMenu.style.display = 'none';
            endScreen.style.display = 'none';
            uiTop.style.display = 'none';
            uiBottom.style.display = 'none';
        } else if (state === 'tutorial') {
            mainMenu.style.display = 'none';
            endScreen.style.display = 'none';
            uiTop.style.display = 'flex';
            uiBottom.style.display = 'flex';
            if (skipTutorialBtn) skipTutorialBtn.style.display = 'block';
        } else if (state === 'playing') {
            mainMenu.style.display = 'none';
            endScreen.style.display = 'none';
            uiTop.style.display = 'flex';
            uiBottom.style.display = 'flex';
            if (skipTutorialBtn) skipTutorialBtn.style.display = 'none';
        } else if (state === 'ending') {
            mainMenu.style.display = 'none';
            endScreen.style.display = 'none';
            uiTop.style.display = 'none';
            uiBottom.style.display = 'none';
        }
    }

    async function init() {
        resizeGame();
        window.addEventListener('resize', resizeGame);

        try {
            const assets = await window.Assets.loadAll();
            console.log('Assets loaded successfully:', assets);

            if (window.RelicArtifacts && assets.relics) {
                window.RelicArtifacts.setImages(assets.relics);
            }

            game = new window.Game();
            game.init(assets);
            window.game = game;

            sceneManager = new window.SceneManager();
            sceneManager.init(game);
            window.sceneManager = sceneManager;

            sceneManager.onStateChange((newState, oldState) => {
                console.log('Scene changed:', oldState, '->', newState);
                updateUIForState(newState);
            });

            setTimeout(() => {
                loadingOverlay.style.display = 'none';
                updateUIForState('menu');
                sceneManager.setState('menu');

                setupSkipTutorialBtn();
                setupCardSlots();
                setupEnemyCards();
                setupRestartBtn();
                setupMenuButtons();
                startCardUpdateLoop();
            }, 300);
        } catch (err) {
            console.error('Failed to load assets:', err);
            loadingOverlay.textContent = '加载失败!';
        }
    }

    function setupSkipTutorialBtn() {
        skipTutorialBtn = document.createElement('button');
        skipTutorialBtn.id = 'skip-tutorial-btn';
        skipTutorialBtn.textContent = '跳过指引 →';
        skipTutorialBtn.style.cssText = `
            position: fixed;
            top: 24px;
            right: 24px;
            z-index: 1000;
            padding: 12px 24px;
            font-size: 18px;
            font-weight: bold;
            color: #ffd700;
            background: rgba(20, 15, 10, 0.85);
            border: 2px solid #ffd700;
            border-radius: 8px;
            cursor: pointer;
            font-family: "Microsoft YaHei", sans-serif;
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.3), inset 0 0 10px rgba(255, 215, 0, 0.1);
            transition: all 0.2s ease;
            display: none;
            letter-spacing: 1px;
        `;
        skipTutorialBtn.addEventListener('mouseenter', () => {
            skipTutorialBtn.style.background = 'rgba(60, 45, 20, 0.95)';
            skipTutorialBtn.style.boxShadow = '0 0 30px rgba(255, 215, 0, 0.5), inset 0 0 15px rgba(255, 215, 0, 0.2)';
            skipTutorialBtn.style.transform = 'scale(1.05)';
            if (window.GameAudio && window.GameAudio.isInitialized()) {
                window.GameAudio.playSfx('buttonHover');
            }
        });
        skipTutorialBtn.addEventListener('mouseleave', () => {
            skipTutorialBtn.style.background = 'rgba(20, 15, 10, 0.85)';
            skipTutorialBtn.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.3), inset 0 0 10px rgba(255, 215, 0, 0.1)';
            skipTutorialBtn.style.transform = 'scale(1)';
        });
        skipTutorialBtn.addEventListener('click', () => {
            if (window.GameAudio && window.GameAudio.isInitialized()) {
                window.GameAudio.playSfx('buttonClick');
            }
            if (sceneManager) {
                sceneManager.setState('playing');
            }
        });
        document.body.appendChild(skipTutorialBtn);
    }

    function setupMenuButtons() {
        if (startBtn) {
            startBtn.addEventListener('mouseenter', () => {
                if (window.GameAudio && window.GameAudio.isInitialized()) {
                    window.GameAudio.playSfx('buttonHover');
                }
            });

            startBtn.addEventListener('click', () => {
                if (window.GameAudio) {
                    window.GameAudio.init();
                    window.GameAudio.playSfx('buttonClick');
                }
                sceneManager.setState('intro');
            });
        }

        if (backToMenuBtn) {
            backToMenuBtn.addEventListener('click', () => {
                game.reset();
                sceneManager.setState('menu');
            });
        }
    }

    function setupRestartBtn() {
        const btn = document.getElementById('restart-btn');
        if (btn) {
            btn.addEventListener('click', () => {
                btn.style.display = 'none';
                game.startBattle();
            });
        }
    }

    function startCardUpdateLoop() {
        function update() {
            const cardSlots = document.querySelectorAll('.card-slot');
            cardSlots.forEach(slot => {
                const key = slot.dataset.spirit;
                const sd = game.assets.spirits[key];
                if (sd) {
                    if (game.lingyun >= sd.stats.cost) {
                        slot.classList.remove('disabled');
                    } else {
                        slot.classList.add('disabled');
                    }

                    if (key === 'huying') {
                        const HUYING_ULTIMATE_COST = 23;
                        const nameEl = slot.querySelector('.card-name');
                        const costEl = slot.querySelector('.card-cost');
                        const progressFill = slot.querySelector('.ult-progress-fill');
                        const progressText = slot.querySelector('.ult-progress-text');
                        const progressEl = slot.querySelector('.ultimate-progress');

                        const currentLingyun = Math.min(game.lingyun, HUYING_ULTIMATE_COST);
                        const progressPct = (currentLingyun / HUYING_ULTIMATE_COST) * 100;

                        if (progressFill) {
                            progressFill.style.width = progressPct + '%';
                        }
                        if (progressText) {
                            progressText.textContent = '必杀 ' + currentLingyun + '/' + HUYING_ULTIMATE_COST;
                        }

                        if (progressEl) {
                            progressEl.classList.remove('progress-low', 'progress-mid', 'progress-high', 'progress-full');
                            if (game.lingyun >= HUYING_ULTIMATE_COST) {
                                progressEl.classList.add('progress-full');
                            } else if (progressPct >= 65) {
                                progressEl.classList.add('progress-high');
                            } else if (progressPct >= 30) {
                                progressEl.classList.add('progress-mid');
                            } else {
                                progressEl.classList.add('progress-low');
                            }
                        }

                        if (game.lingyun >= HUYING_ULTIMATE_COST) {
                            slot.classList.add('ultimate');
                            if (nameEl) nameEl.textContent = '虎鎣·一击必杀';
                            if (costEl) costEl.innerHTML = '<span class="fire-icon">🔥</span>×23';
                        } else {
                            slot.classList.remove('ultimate');
                            if (nameEl) nameEl.textContent = sd.stats.name;
                            if (costEl) costEl.innerHTML = '🔥×' + sd.stats.cost;
                        }
                    }
                }
            });

            const restartBtn = document.getElementById('restart-btn');
            if (restartBtn) {
                if (game.state === 'lose') {
                    restartBtn.style.display = 'block';
                } else if (game.state === 'playing') {
                    restartBtn.style.display = 'none';
                }
            }

            requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    }

    function drawCardPreview(canvas, spiritData) {
        canvas.width = 160;
        canvas.height = 160;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!spiritData || !spiritData.idle || !spiritData.idle.img) return;

        const previewSprite = new window.Sprite({
            idle: spiritData.idle,
            walk: spiritData.walk || spiritData.idle,
            attack: spiritData.attack
        });
        previewSprite.play('idle');
        previewSprite.draw(ctx, canvas.width / 2, canvas.height - 15, spiritData.stats.flipX, 1, 1.5);
    }

    function setupCardSlots() {
        const cardSlots = document.querySelectorAll('.card-slot');
        const spiritKeys = ['zengbo', 'zilong', 'huying'];

        cardSlots.forEach((slot, index) => {
            const spiritKey = spiritKeys[index];
            const spiritData = game.assets.spirits[spiritKey];
            if (!spiritData) return;

            slot.draggable = true;
            slot.dataset.spirit = spiritKey;

            const previewCanvas = slot.querySelector('.card-preview');
            const nameEl = slot.querySelector('.card-name');
            const costEl = slot.querySelector('.card-cost');

            if (nameEl) nameEl.textContent = spiritData.stats.name;
            if (costEl) {
                if (spiritKey === 'huying') {
                    costEl.innerHTML = '🔥×' + spiritData.stats.cost;
                } else {
                    costEl.textContent = '🔥×' + spiritData.stats.cost;
                }
            }
            if (spiritKey === 'huying') {
                const cardInfo = slot.querySelector('.card-info');
                if (cardInfo) {
                    const progressEl = document.createElement('div');
                    progressEl.className = 'ultimate-progress';
                    progressEl.innerHTML = `
                        <span class="ult-progress-icon">⚡</span>
                        <div class="ult-progress-bar">
                            <div class="ult-progress-fill" style="width: 0%"></div>
                        </div>
                        <span class="ult-progress-text">必杀 0/23</span>
                    `;
                    cardInfo.appendChild(progressEl);
                }
            }
            if (previewCanvas) drawCardPreview(previewCanvas, spiritData);

            slot.addEventListener('dragstart', (e) => {
                if (slot.classList.contains('disabled')) {
                    e.preventDefault();
                    return;
                }
                if (sceneManager.getState() !== 'playing' && sceneManager.getState() !== 'tutorial') {
                    e.preventDefault();
                    return;
                }
                e.dataTransfer.setData('text/plain', spiritKey);
                e.dataTransfer.effectAllowed = 'move';
                game.selectedCard = spiritKey;
                document.querySelectorAll('.card-slot').forEach(s => {
                    s.classList.remove('selected');
                    s.style.borderColor = '';
                });
                slot.classList.add('selected');
                slot.style.borderColor = '#00ffcc';
            });

            slot.addEventListener('dragend', () => {
                game.selectedCard = null;
                document.querySelectorAll('.card-slot').forEach(s => {
                    s.classList.remove('selected');
                    s.style.borderColor = '';
                });
            });
        });
    }

    function setupEnemyCards() {
        const enemyCosts = { enemy_knife: 12, enemy_gun: 12 };
        const cards = document.querySelectorAll('.enemy-card');
        cards.forEach(card => {
            const enemyKey = card.dataset.enemy;
            const enemyData = game.assets.enemies[enemyKey];
            if (!enemyData) return;

            const previewCanvas = card.querySelector('.enemy-card-preview');
            const nameEl = card.querySelector('.enemy-card-name');
            const costEl = card.querySelector('.enemy-card-cost');

            if (nameEl) nameEl.textContent = enemyData.stats.name;
            if (costEl) costEl.textContent = '🔥×' + enemyCosts[enemyKey];
            if (previewCanvas) drawCardPreview(previewCanvas, enemyData);
        });
    }

    window.addEventListener('load', init);
})();
