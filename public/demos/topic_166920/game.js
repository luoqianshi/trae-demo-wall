const CHARACTER_DATA = {
    1: { name: '石棒', price: 50, attack: '低', hp: '低', attackSpeed: '普通', attackInterval: 3, type: '地面', canAir: false, canGround: true, skill: '', image: 'role1.svg', attackRange: 70, detectRange: 180 },
    2: { name: '法师', price: 180, attack: '中', hp: '高', attackSpeed: '较慢', attackInterval: 6, type: '地面', canAir: true, canGround: true, skill: 'summonArray', image: 'role2.svg', attackRange: 300, detectRange: 350 },
    3: { name: '弓箭', price: 120, attack: '高', hp: '低', attackSpeed: '较快', attackInterval: 2.5, type: '地面', canAir: true, canGround: true, skill: 'shootArrow', image: 'role3.svg', attackRange: 280, detectRange: 320 },
    4: { name: '重锤', price: 280, attack: '高', hp: '非常高', attackSpeed: '较慢', attackInterval: 4.5, type: '地面', canAir: false, canGround: true, skill: '', image: 'role4.svg', attackRange: 70, detectRange: 200 },
    5: { name: '头锤', price: 150, attack: '高', hp: '普通', attackSpeed: '慢', attackInterval: 5, type: '地面', canAir: false, canGround: true, skill: '', image: 'role5.svg', attackRange: 70, detectRange: 180 },
    6: { name: '王冠', price: 550, attack: '高', hp: '高', attackSpeed: '普通', attackInterval: 4.5, type: '地面', canAir: true, canGround: true, skill: 'throwCrown', image: 'role6.svg', attackRange: 250, detectRange: 300 },
    7: { name: '飞火', price: 220, attack: '高', hp: '普通', attackSpeed: '普通', attackInterval: 3.5, type: '空中', canAir: true, canGround: true, skill: 'shootFireball', image: 'role7.svg', attackRange: 250, detectRange: 300 },
    10: { name: '小型骷髅', price: 0, attack: '低', hp: '低', attackSpeed: '普通', attackInterval: 2.8, type: '地面', canAir: false, canGround: true, skill: '', image: 'role10.svg', attackRange: 70, detectRange: 180 },
    20: { name: '女娲', price: 800, attack: '彩蛋秒杀', hp: '非常高', attackSpeed: '生娃型', attackInterval: 25, type: '地面', canAir: false, canGround: true, skill: 'giveBirth', image: 'role20.svg', attackRange: 300, detectRange: 350 },
    21: { name: '角色21', price: 0, attack: '低', hp: '普通', attackSpeed: '普通', attackInterval: 3.5, type: '地面', canAir: false, canGround: true, skill: '', image: 'role21.svg', attackRange: 70, detectRange: 180 },
    22: { name: '角色22', price: 0, attack: '中', hp: '非常高', attackSpeed: '很慢', attackInterval: 25, type: '地面', canAir: false, canGround: true, skill: 'shootHeart', image: 'role22.svg', attackRange: 250, detectRange: 300 },
    23: { name: '爱心', price: 0, attack: '中', hp: '无', attackSpeed: '随角色22', attackInterval: 0, type: '武器', canAir: false, canGround: false, skill: '', image: 'role23.svg', attackRange: 0, detectRange: 0 },
    24: { name: '角色24', price: 0, attack: '高', hp: '高', attackSpeed: '快', attackInterval: 2, type: '地面', canAir: false, canGround: true, skill: '', image: 'role24.svg', attackRange: 70, detectRange: 200 },
    25: { name: '角色25', price: 0, attack: '较弱', hp: '普通', attackSpeed: '普通', attackInterval: 3, type: '空中', canAir: true, canGround: false, skill: '', image: 'role25.svg', attackRange: 70, detectRange: 180 },
    26: { name: '治疗师', price: 200, attack: '治疗/加速', hp: '普通', attackSpeed: '较慢', attackInterval: 8, type: '地面', canAir: true, canGround: true, skill: 'heal', image: 'role26.svg', attackRange: 150, detectRange: 200 },
    29: { name: '红眼符号', price: 0, attack: '中高', hp: '无', attackSpeed: '随角色26', attackInterval: 0, type: '武器', canAir: true, canGround: true, skill: '', image: 'role29.svg', attackRange: 0, detectRange: 0 },
    15: { name: '豌豆植物', price: 0, attack: '中', hp: '普通', attackSpeed: '较快', attackInterval: 2.5, type: '地面', canAir: false, canGround: true, skill: 'shootPea', image: 'role15.svg', attackRange: 250, detectRange: 300 },
    16: { name: '坚果', price: 0, attack: '无', hp: '非常高', attackSpeed: '无', attackInterval: 0, type: '地面', canAir: false, canGround: true, skill: '', image: 'role16.svg', attackRange: 0, detectRange: 200 },
    18: { name: '土豆地雷', price: 0, attack: '高', hp: '普通', attackSpeed: '触发式', attackInterval: 0, type: '地面', canAir: false, canGround: true, skill: '', image: 'role18.svg', attackRange: 70, detectRange: 50 },
    28: { name: '金盏花', price: 0, attack: '产金币', hp: '普通', attackSpeed: '生产型', attackInterval: 15, type: '地面', canAir: false, canGround: true, skill: 'produceGold', image: 'role28.svg', attackRange: 0, detectRange: 0 }
};

const PURCHASABLE_ROLES = [1, 2, 3, 4, 5, 6, 7, 20, 26];

class AudioManager {
    constructor() {
        this.audioContext = null;
        this.volume = 0.3;
        this.sfxEnabled = true;
    }

    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    playDeathSound(isAirType = false) {
        if (!this.sfxEnabled) return;
        
        this.init();
        
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        const now = this.audioContext.currentTime;
        const duration = 0.5;

        const osc1 = this.audioContext.createOscillator();
        const osc2 = this.audioContext.createOscillator();
        const osc3 = this.audioContext.createOscillator();
        
        const gainNode = this.audioContext.createGain();
        
        const formantFilter1 = this.audioContext.createBiquadFilter();
        const formantFilter2 = this.audioContext.createBiquadFilter();
        const formantFilter3 = this.audioContext.createBiquadFilter();

        osc1.connect(formantFilter1);
        osc2.connect(formantFilter2);
        osc3.connect(formantFilter3);
        
        formantFilter1.connect(gainNode);
        formantFilter2.connect(gainNode);
        formantFilter3.connect(gainNode);
        
        gainNode.connect(this.audioContext.destination);

        formantFilter1.type = 'bandpass';
        formantFilter1.frequency.setValueAtTime(700, now);
        formantFilter1.Q.setValueAtTime(10);

        formantFilter2.type = 'bandpass';
        formantFilter2.frequency.setValueAtTime(1200, now);
        formantFilter2.Q.setValueAtTime(10);

        formantFilter3.type = 'bandpass';
        formantFilter3.frequency.setValueAtTime(2000, now);
        formantFilter3.Q.setValueAtTime(5);

        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(150, now);
        osc1.frequency.exponentialRampToValueAtTime(80, now + duration);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(300, now);
        osc2.frequency.exponentialRampToValueAtTime(150, now + duration);

        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(450, now);
        osc3.frequency.exponentialRampToValueAtTime(200, now + duration);

        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(this.volume * 0.5, now + 0.03);
        gainNode.gain.linearRampToValueAtTime(this.volume * 0.8, now + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

        osc1.start(now);
        osc2.start(now);
        osc3.start(now);
        
        osc1.stop(now + duration);
        osc2.stop(now + duration);
        osc3.stop(now + duration);
    }

    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
    }

    toggleSfx() {
        this.sfxEnabled = !this.sfxEnabled;
        return this.sfxEnabled;
    }
}

class Game {
    constructor() {
        this.audioManager = new AudioManager();
        this.state = {
            leftGold: 1000,
            rightGold: 1000,
            leftHealth: 2500,
            rightHealth: 2500,
            isPlaying: false,
            leftCharacters: [],
            rightCharacters: [],
            projectiles: [],
            healingEffects: [],
            lastTime: 0,
            characterIdCounter: 1
        };

        this.init();
    }

    init() {
        this.setupCards();
        this.setupDragAndDrop();
        this.setupButtons();
        this.setupBottomBarScroll();
        this.gameLoop();
    }

    setupCards() {
        const leftCards = document.getElementById('left-cards');
        const rightCards = document.getElementById('right-cards');

        PURCHASABLE_ROLES.forEach(roleId => {
            const char = CHARACTER_DATA[roleId];
            
            const leftCard = this.createCard(roleId, char, 'left');
            leftCards.appendChild(leftCard);

            const rightCard = this.createCard(roleId, char, 'right');
            rightCards.appendChild(rightCard);
        });

        this.updateCardStates();
    }

    createCard(roleId, char, team) {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.roleId = roleId;
        card.dataset.team = team;
        card.draggable = true;

        card.innerHTML = `
            <div class="card-id">角色${roleId}</div>
            <div class="card-image">
                <img src="assets/sprites/${char.image}" alt="${char.name}">
                <div class="card-cooldown" style="display: none;">
                    <div class="cooldown-mask"></div>
                    <div class="cooldown-text">0</div>
                </div>
            </div>
            <div class="card-name">${char.name}</div>
            <div class="card-price">💰 ${char.price}</div>
        `;

        return card;
    }

    setupDragAndDrop() {
        this.dragState = null;

        document.addEventListener('dragstart', (e) => {
            const card = e.target.closest('.card');
            if (card && !card.classList.contains('disabled')) {
                this.dragState = {
                    type: 'card',
                    roleId: parseInt(card.dataset.roleId),
                    team: card.dataset.team
                };
                card.style.opacity = '0.5';
                if (e.dataTransfer) {
                    e.dataTransfer.effectAllowed = 'copy';
                    e.dataTransfer.setData('text/plain', JSON.stringify(this.dragState));
                }
            } else {
                const battleChar = e.target.closest('.battle-character');
                if (battleChar && !this.state.isPlaying) {
                    this.dragState = {
                        type: 'character',
                        charId: parseInt(battleChar.dataset.charId),
                        team: battleChar.classList.contains('left-team') ? 'left' : 'right'
                    };
                    battleChar.style.opacity = '0.5';
                    if (e.dataTransfer) {
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', JSON.stringify(this.dragState));
                    }
                }
            }
        });

        document.addEventListener('dragend', (e) => {
            if (this.dragState) {
                if (this.dragState.type === 'card') {
                    const cards = document.querySelectorAll('.card');
                    cards.forEach(c => c.style.opacity = '1');
                } else {
                    const chars = document.querySelectorAll('.battle-character');
                    chars.forEach(c => c.style.opacity = '1');
                }
                this.dragState = null;
            }
            
            document.querySelectorAll('.trash-can').forEach(trash => {
                trash.classList.remove('drag-over');
            });
        });

        document.getElementById('battle-field').addEventListener('dragover', (e) => {
            e.preventDefault();
            if (e.dataTransfer) {
                e.dataTransfer.dropEffect = this.dragState?.type === 'character' ? 'move' : 'copy';
            }
        });

        document.getElementById('battle-field').addEventListener('drop', (e) => {
            e.preventDefault();
            const battleField = document.getElementById('battle-field');
            const rect = battleField.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const team = x < rect.width / 2 ? 'left' : 'right';
            this.handleDrop(e, team);
        });

        document.querySelectorAll('.trash-can').forEach(trash => {
            trash.addEventListener('dragover', (e) => {
                e.preventDefault();
                trash.classList.add('drag-over');
            });

            trash.addEventListener('dragleave', () => {
                trash.classList.remove('drag-over');
            });

            trash.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                trash.classList.remove('drag-over');
                this.handleTrashDrop(e, trash.id === 'left-trash' ? 'left' : 'right');
            });
        });
    }

    handleDrop(e, team) {
        if (!this.state.isPlaying && this.dragState) {
            const battleField = document.getElementById('battle-field');
            if (!battleField) return;
            
            const rect = battleField.getBoundingClientRect();
            const wallWidth = 30;
            const margin = 10;
            const charSize = 70;
            const centerX = rect.width / 2;
            
            let x = e.clientX - rect.left;
            let y = e.clientY - rect.top;
            
            if (team === 'left') {
                x = Math.max(wallWidth + margin, Math.min(x, centerX - margin));
            } else {
                x = Math.max(centerX + margin, Math.min(x, rect.width - wallWidth - margin - charSize));
            }
            y = Math.max(margin, Math.min(y, rect.height - margin - charSize));

            if (this.dragState.type === 'character') {
                if (this.dragState.team === team) {
                    const chars = this.state[`${team}Characters`];
                    const char = chars.find(c => c.id === this.dragState.charId);
                    
                    if (char) {
                        char.x = x;
                        char.y = y;
                        
                        const charEl = document.querySelector(`.battle-character[data-char-id="${this.dragState.charId}"]`);
                        if (charEl) {
                            charEl.style.left = x + 'px';
                            charEl.style.top = y + 'px';
                        }
                    }
                }
            } else if (this.dragState.type === 'card') {
                if (this.dragState.team === team) {
                    const char = CHARACTER_DATA[this.dragState.roleId];
                    const gold = team === 'left' ? this.state.leftGold : this.state.rightGold;

                    if (gold >= char.price) {
                        this.placeCharacter(this.dragState.roleId, team, x, y);
                        this.updateGold(team, -char.price);
                        this.updateCardStates();
                    }
                }
            }
        }
    }

    handleTrashDrop(e, team) {
        if (this.dragState && this.dragState.type === 'character') {
            this.removeCharacter(team, this.dragState.charId);
        }
    }

    placeCharacter(roleId, team, x, y) {
        const char = CHARACTER_DATA[roleId];
        const charId = this.state.characterIdCounter++;
        
        const charData = {
            id: charId,
            roleId: roleId,
            name: char.name,
            team: team,
            x: x,
            y: y,
            hp: this.getHpValue(char.hp),
            maxHp: this.getHpValue(char.hp),
            attack: this.getAttackValue(char.attack),
            attackInterval: char.attackInterval,
            lastAttackTime: 0,
            type: char.type,
            canAir: char.canAir,
            canGround: char.canGround,
            skill: char.skill,
            skillCooldown: 0,
            isRedEye: false,
            redEyeEndTime: 0,
            hasShield: false,
            shieldHp: 20,
            shieldCooldown: 0,
            healCooldown: 0,
            summonTimer: 0,
            birthIndex: 0,
            killCount: 0,
            target: null,
            image: char.image,
            hasTarget: false,
            moveSpeed: 0.5,
            aiState: 'patrol',
            lastAiState: null,
            patrolTarget: null,
            patrolPath: [],
            chaseTimer: 0,
            attackRange: char.attackRange || 70,
            detectRange: char.detectRange || 200,
            guardTimer: 0,
            isFloating: false,
            floatProgress: 0,
            baseY: y,
            beenAttackedByGround: false
        };

        if (team === 'left') {
            this.state.leftCharacters.push(charData);
        } else {
            this.state.rightCharacters.push(charData);
        }

        this.renderCharacter(charData);
    }

    getHpValue(hpStr) {
        const values = { '低': 40, '普通': 80, '高': 150, '非常高': 350 };
        return values[hpStr] || 80;
    }

    getAttackValue(atkStr) {
        const values = { '低': 10, '中': 25, '高': 45, '较弱': 12, '中高': 35, '召唤型': 0, '治疗/加速': 0, '彩蛋秒杀': 9999, '无': 0, '产金币': 0, '触发式': 80 };
        return values[atkStr] || 25;
    }

    renderCharacter(charData) {
        const field = document.getElementById('battle-field');
        const charEl = document.createElement('div');
        charEl.className = `battle-character ${charData.team}-team`;
        if (charData.type === '空中') {
            charEl.classList.add('flying');
        }
        charEl.dataset.charId = charData.id;
        charEl.style.left = charData.x + 'px';
        charEl.style.top = charData.y + 'px';
        charEl.draggable = true;

        charEl.innerHTML = `
            <div class="health-bar-overlay">
                <div class="health-fill" style="width: 100%"></div>
            </div>
            <img src="assets/sprites/${charData.image}" alt="${charData.name}">
            <div class="lock-on-effect" style="display: none;">
                <div class="lock-on-ring outer"></div>
                <div class="lock-on-ring middle"></div>
                <div class="lock-on-ring inner"></div>
                <div class="lock-on-crosshair"></div>
            </div>
        `;

        field.appendChild(charEl);
        charData.el = charEl;
        charData.lockOnEl = charEl.querySelector('.lock-on-effect');
    }

    removeCharacter(team, charId) {
        const chars = team === 'left' ? this.state.leftCharacters : this.state.rightCharacters;
        const index = chars.findIndex(c => c.id === charId);
        
        if (index !== -1) {
            const char = chars[index];
            const gold = Math.floor(CHARACTER_DATA[char.roleId].price * 0.5);
            this.updateGold(team, gold);
            
            chars.splice(index, 1);
            
            const charEl = document.querySelector(`.battle-character[data-char-id="${charId}"]`);
            if (charEl) {
                charEl.remove();
            }
            
            this.updateCardStates();
        }
    }

    updateGold(team, amount) {
        if (team === 'left') {
            this.state.leftGold = Math.max(0, this.state.leftGold + amount);
            document.getElementById('left-gold').textContent = this.state.leftGold;
        } else {
            this.state.rightGold = Math.max(0, this.state.rightGold + amount);
            document.getElementById('right-gold').textContent = this.state.rightGold;
        }
    }

    updateCardStates() {
        document.querySelectorAll('.card').forEach(card => {
            const roleId = parseInt(card.dataset.roleId);
            const team = card.dataset.team;
            const char = CHARACTER_DATA[roleId];
            const gold = team === 'left' ? this.state.leftGold : this.state.rightGold;

            if (gold >= char.price && !this.state.isPlaying) {
                card.classList.remove('disabled');
            } else {
                card.classList.add('disabled');
            }
        });
    }

    setupButtons() {
        document.getElementById('start-btn').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('reset-btn').addEventListener('click', () => {
            this.resetGame();
        });

        document.getElementById('restart-btn').addEventListener('click', () => {
            this.resetGame();
        });

        const aboutBtn = document.getElementById('about-btn');
        if (aboutBtn) {
            aboutBtn.addEventListener('click', () => {
                const aboutModal = document.getElementById('about-modal');
                if (aboutModal) {
                    aboutModal.style.display = 'flex';
                }
            });
        }

        const closeAboutBtn = document.getElementById('close-about-btn');
        if (closeAboutBtn) {
            closeAboutBtn.addEventListener('click', () => {
                const aboutModal = document.getElementById('about-modal');
                if (aboutModal) {
                    aboutModal.style.display = 'none';
                }
            });
        }

        const aboutCloseXBtn = document.getElementById('about-close-x');
        if (aboutCloseXBtn) {
            aboutCloseXBtn.addEventListener('click', () => {
                const aboutModal = document.getElementById('about-modal');
                if (aboutModal) {
                    aboutModal.style.display = 'none';
                }
            });
        }

        const gameIntroBtn = document.getElementById('game-intro-btn');
        if (gameIntroBtn) {
            gameIntroBtn.addEventListener('click', () => {
                const gameIntroModal = document.getElementById('game-intro-modal');
                if (gameIntroModal) {
                    gameIntroModal.style.display = 'flex';
                }
            });
        }

        const closeGameIntroBtn = document.getElementById('close-game-intro-btn');
        if (closeGameIntroBtn) {
            closeGameIntroBtn.addEventListener('click', () => {
                const gameIntroModal = document.getElementById('game-intro-modal');
                if (gameIntroModal) {
                    gameIntroModal.style.display = 'none';
                }
            });
        }

        const gameIntroCloseXBtn = document.getElementById('game-intro-close-x');
        if (gameIntroCloseXBtn) {
            gameIntroCloseXBtn.addEventListener('click', () => {
                const gameIntroModal = document.getElementById('game-intro-modal');
                if (gameIntroModal) {
                    gameIntroModal.style.display = 'none';
                }
            });
        }
    }

    setupBottomBarScroll() {
        const bottomBar = document.getElementById('bottom-bar');
        let touchStartY = 0;
        let touchStartDistance = 0;
        let isTwoFinger = false;
        let mouseStartY = 0;
        let isMouseDown = false;

        bottomBar.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                isTwoFinger = true;
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                touchStartDistance = Math.sqrt(
                    Math.pow(touch2.clientX - touch1.clientX, 2) +
                    Math.pow(touch2.clientY - touch1.clientY, 2)
                );
                touchStartY = (touch1.clientY + touch2.clientY) / 2;
            }
        }, { passive: true });

        bottomBar.addEventListener('touchmove', (e) => {
            if (!isTwoFinger || e.touches.length !== 2) return;
            
            e.preventDefault();
            
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const currentY = (touch1.clientY + touch2.clientY) / 2;
            const deltaY = currentY - touchStartY;
            
            const scrollAmount = Math.abs(deltaY) * 1.5;
            bottomBar.scrollTop += scrollAmount;
            
            touchStartY = currentY;
        }, { passive: false });

        bottomBar.addEventListener('touchend', () => {
            isTwoFinger = false;
        });

        bottomBar.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                isMouseDown = true;
                mouseStartY = e.clientY;
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (!isMouseDown) return;
            
            const deltaY = e.clientY - mouseStartY;
            
            const scrollAmount = -deltaY * 1.2;
            bottomBar.scrollTop += scrollAmount;
            
            mouseStartY = e.clientY;
        });

        document.addEventListener('mouseup', () => {
            isMouseDown = false;
        });

        bottomBar.addEventListener('wheel', (e) => {
            e.preventDefault();
            bottomBar.scrollTop += e.deltaY * 0.5;
        }, { passive: false });
    }

    startGame() {
        if (!this.state.isPlaying) {
            if (this.state.leftCharacters.length === 0) {
                alert('左队必须至少有一个角色才能开始战斗！');
                return;
            }
            if (this.state.rightCharacters.length === 0) {
                alert('右队必须至少有一个角色才能开始战斗！');
                return;
            }
            
            this.audioManager.init();
            
            this.cacheWallPositions();
            this.state.isPlaying = true;
            document.getElementById('start-btn').style.display = 'none';
            document.getElementById('reset-btn').style.display = 'block';
            this.updateCardStates();
        }
    }

    resetGame() {
        this.state.isPlaying = false;
        this.state.leftGold = 1000;
        this.state.rightGold = 1000;
        this.state.leftHealth = 2500;
        this.state.rightHealth = 2500;
        this.state.leftCharacters = [];
        this.state.rightCharacters = [];
        this.state.projectiles = [];
        this.state.healingEffects = [];
        this.state.characterIdCounter = 1;

        document.getElementById('left-gold').textContent = '1000';
        document.getElementById('right-gold').textContent = '1000';
        document.getElementById('left-health-bar').style.width = '100%';
        document.getElementById('right-health-bar').style.width = '100%';
        document.getElementById('start-btn').style.display = 'block';
        document.getElementById('reset-btn').style.display = 'none';
        document.getElementById('victory-modal').style.display = 'none';

        document.querySelectorAll('.battle-character').forEach(el => el.remove());
        document.querySelectorAll('.projectile').forEach(el => el.remove());
        document.querySelectorAll('.healing-effect').forEach(el => el.remove());
        document.querySelectorAll('.floating-text').forEach(el => el.remove());
        document.querySelectorAll('.gold-coin').forEach(el => el.remove());

        this.updateCardStates();
    }

    gameLoop(timestamp) {
        let deltaTime = timestamp - this.state.lastTime;
        this.state.lastTime = timestamp;
        
        if (deltaTime > 100 || deltaTime < 0) {
            deltaTime = 16;
        }

        if (this.state.isPlaying) {
            this.updateBattle(deltaTime);
        }

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    updateBattle(deltaTime) {
        this.cacheWallPositions();
        this.processCharacterSkills('left', deltaTime);
        this.processCharacterSkills('right', deltaTime);
        this.processProjectiles(deltaTime);
        this.updateCooldownDisplays();
        this.updateLockOnEffects();
        this.checkVictory();
    }

    cacheWallPositions() {
        const leftWall = document.getElementById('left-wall');
        const rightWall = document.getElementById('right-wall');
        const battleField = document.getElementById('battle-field');
        
        if (!leftWall || !rightWall || !battleField) return;
        
        const battleRect = battleField.getBoundingClientRect();
        
        const leftRect = leftWall.getBoundingClientRect();
        this.state.leftWallPos = {
            x: leftRect.left - battleRect.left + leftRect.width / 2,
            y: leftRect.top - battleRect.top + leftRect.height / 2
        };
        
        const rightRect = rightWall.getBoundingClientRect();
        this.state.rightWallPos = {
            x: rightRect.left - battleRect.left + rightRect.width / 2,
            y: rightRect.top - battleRect.top + rightRect.height / 2
        };
    }

    processCharacterSkills(team, deltaTime) {
        const chars = team === 'left' ? this.state.leftCharacters : this.state.rightCharacters;
        const enemyTeam = team === 'left' ? 'right' : 'left';
        const enemyChars = this.state[`${enemyTeam}Characters`];

        chars.forEach(char => {
            if (char.roleId === 20) {
                this.processNuwaSkill(char, enemyChars, deltaTime);
            } else if (char.roleId === 26) {
                this.processHealerSkill(char, chars, deltaTime);
            } else if (char.roleId === 2) {
                this.processMageSkill(char, deltaTime);
            } else if (char.roleId === 6) {
                this.processCrownSkill(char, enemyChars, deltaTime);
            } else if (char.roleId === 7) {
                this.processFireSkill(char, enemyChars, deltaTime);
            } else if (char.roleId === 3) {
                this.processArcherSkill(char, enemyChars, deltaTime);
            } else {
                this.processBasicAttack(char, enemyChars, deltaTime);
            }

            this.updateHealthBar(char);
        });
    }

    processNuwaSkill(char, enemyChars, deltaTime) {
        char.hasTarget = false;
        char.summonTimer += deltaTime;
        char.skillCooldown += deltaTime / 1000;
        
        if (char.hp < char.maxHp * 0.4 || char.killCount >= 4) {
            if (!char.isRedEye) {
                char.isRedEye = true;
                char.redEyeEndTime = Date.now() + 20000;
                char.attackInterval = 5;
                this.activateRedEye(char);
            }

            if (Date.now() > char.redEyeEndTime) {
                char.isRedEye = false;
                char.attackInterval = 20;
                this.deactivateRedEye(char);
            }
            
            if (char.isRedEye) {
                const target = this.findNearestEnemy(char, enemyChars);
                if (target && this.getDistance(char, target) <= 300) {
                    char.hasTarget = true;
                }
            }
        }

        if (char.summonTimer >= char.attackInterval * 1000) {
            char.summonTimer = 0;
            const birthOrder = [21, 22, 24];
            const childRoleId = birthOrder[char.birthIndex % 3];
            char.birthIndex++;
            
            this.spawnChild(char, childRoleId);
        }

        if (char.isRedEye && char.skillCooldown <= 0) {
            const target = this.findNearestEnemy(char, enemyChars);
            if (target) {
                target.hp = 0;
                char.killCount++;
                char.skillCooldown = 9999;
                this.showFloatingText(target.x, target.y, '秒杀!', '#FF0000');
            }
        }
    }

    spawnChild(parent, roleId) {
        const childImage = `role${roleId}.svg`;
        const charData = CHARACTER_DATA[roleId] || {};
        const childData = {
            id: this.state.characterIdCounter++,
            roleId: roleId,
            name: `角色${roleId}`,
            team: parent.team,
            x: parent.x + (Math.random() - 0.5) * 50,
            y: parent.y - 30,
            hp: roleId === 22 ? 500 : (roleId === 24 ? 200 : 100),
            maxHp: roleId === 22 ? 500 : (roleId === 24 ? 200 : 100),
            attack: roleId === 24 ? 50 : (roleId === 25 ? 15 : (roleId === 22 ? 0 : 10)),
            attackInterval: roleId === 24 ? 2.2 : (roleId === 22 ? 20 : 3.6),
            lastAttackTime: 0,
            type: roleId === 25 ? '空中' : '地面',
            canAir: roleId === 25,
            canGround: true,
            skill: roleId === 22 ? 'shootHeart' : '',
            skillCooldown: 0,
            isRedEye: false,
            redEyeEndTime: 0,
            hasShield: false,
            shieldHp: 20,
            shieldCooldown: 0,
            healCooldown: 0,
            summonTimer: 0,
            birthIndex: 0,
            killCount: 0,
            target: null,
            image: childImage,
            hasTarget: false,
            moveSpeed: 0.5,
            aiState: 'patrol',
            lastAiState: null,
            patrolTarget: null,
            patrolPath: [],
            chaseTimer: 0,
            attackRange: charData.attackRange || 70,
            detectRange: charData.detectRange || 200,
            guardTimer: 0
        };

        this.state[`${parent.team}Characters`].push(childData);
        this.renderCharacter(childData);
        
        this.showFloatingText(parent.x, parent.y, '出生!', '#FF69B4');
    }

    processHealerSkill(char, teammates, deltaTime) {
        char.hasTarget = false;
        
        if (!char.isRedEye && char.hp < char.maxHp * 0.5) {
            char.isRedEye = true;
            this.activateRedEye(char);
            char.image = 'role26-red-eye.svg';
            const charEl = document.querySelector(`.battle-character[data-char-id="${char.id}"] img`);
            if (charEl) charEl.src = `assets/sprites/${char.image}`;
        }

        if (char.hasShield && char.shieldHp <= 0) {
            char.hasShield = false;
            char.shieldCooldown = 8;
        }
        
        if (!char.hasShield) {
            char.shieldCooldown -= deltaTime / 1000;
            if (char.shieldCooldown <= 0) {
                char.hasShield = true;
                char.shieldHp = 20;
            }
        }

        char.healCooldown -= deltaTime / 1000;
        if (char.healCooldown <= 0 && char.hp < char.maxHp) {
            char.hp = Math.min(char.maxHp, char.hp + 20);
            char.healCooldown = 20;
        }

        char.summonTimer += deltaTime;
        if (char.summonTimer >= char.attackInterval * 1000) {
            char.summonTimer = 0;
            this.triggerBasicAttack(char);

            if (char.isRedEye) {
                const enemies = this.state[char.team === 'left' ? 'rightCharacters' : 'leftCharacters'];
                const target = this.findNearestEnemy(char, enemies);
                if (target) {
                    this.createProjectile(char, target, 'role29.svg', 25);
                }
            } else {
                const injuredTeammate = teammates.find(t => t.hp < t.maxHp);
                if (injuredTeammate) {
                    this.createHealingProjectile(char, injuredTeammate);
                } else {
                    const randomTeammate = teammates[Math.floor(Math.random() * teammates.length)];
                    if (randomTeammate) {
                        this.createHealingProjectile(char, randomTeammate);
                    }
                }
            }
        }
        
        if (!char.isRedEye) {
            const wallTarget = this.getWallTarget(char);
            if (wallTarget) {
                const distanceToWall = this.getDistance(char, wallTarget);
                if (distanceToWall > 50) {
                    this.moveTowardsTarget(char, wallTarget, deltaTime);
                }
            }
        }
    }

    createHealingProjectile(source, target) {
        const direction = source.team === 'left' ? 1 : -1;
        const projectile = {
            id: this.state.characterIdCounter++,
            x: source.x + direction * 35,
            y: source.y,
            target: target,
            damage: -30,
            image: 'role27.svg',
            type: 'heal',
            speed: 5,
            team: source.team
        };

        this.state.projectiles.push(projectile);
        this.renderProjectile(projectile);
    }

    healTarget(healer, target) {
        const healAmount = 30;
        target.hp = Math.min(target.maxHp, target.hp + healAmount);
        
        this.createHealingEffect(target.x, target.y);
        this.showFloatingText(target.x, target.y, `+${healAmount}`, '#00FF00');
    }

    buffTarget(target) {
        target.attackInterval = Math.max(1, target.attackInterval - 0.5);
        this.showFloatingText(target.x, target.y, '加速!', '#00BFFF');
    }

    processMageSkill(char, deltaTime) {
        char.hasTarget = false;
        char.summonTimer += deltaTime;

        char.skillCooldown += deltaTime / 1000;
        const enemies = this.state[char.team === 'left' ? 'rightCharacters' : 'leftCharacters'];
        const target = this.findNearestEnemy(char, enemies);
        const attackRange = char.attackRange || 300;
        
        if (target && this.getDistance(char, target) <= attackRange) {
            char.hasTarget = true;
        }
        
        if (target) {
            const distance = this.getDistance(char, target);
            
            if (distance > attackRange) {
                this.moveTowardsTarget(char, target, deltaTime);
            } else {
                if (char.skillCooldown >= char.attackInterval) {
                    char.skillCooldown = 0;
                    this.triggerBasicAttack(char, () => {
                        if (char.summonTimer >= 30000) {
                            char.summonTimer = 0;
                            this.createSummonProjectile(char, target, 10, 4);
                        } else {
                            this.createProjectile(char, target, null, 30, 'magic');
                        }
                    });
                }
            }
        } else {
            const wallTarget = this.getWallTarget(char);
            if (wallTarget) {
                const distanceToWall = this.getDistance(char, wallTarget);
                if (distanceToWall > 50) {
                    this.moveTowardsTarget(char, wallTarget, deltaTime);
                } else {
                    char.hasTarget = true;
                    if (char.skillCooldown >= char.attackInterval) {
                        char.skillCooldown = 0;
                        this.triggerBasicAttack(char, () => {
                            if (char.summonTimer >= 30000) {
                                char.summonTimer = 0;
                                this.createSummonProjectile(char, wallTarget, 10, 4);
                            } else {
                                this.createProjectile(char, wallTarget, null, 30, 'magic');
                            }
                        });
                    }
                }
            }
        }
    }

    createSummonProjectile(source, target, summonRoleId, count) {
        const direction = source.team === 'left' ? 1 : -1;
        const projectile = {
            id: this.state.characterIdCounter++,
            x: source.x + direction * 35,
            y: source.y,
            target: target,
            damage: 0,
            image: 'role10.svg',
            type: 'summon',
            speed: 5,
            summonRoleId: summonRoleId,
            summonCount: count,
            team: source.team
        };

        this.state.projectiles.push(projectile);
        this.renderProjectile(projectile);
    }

    createSummonCircle(x, y, team) {
        const field = document.getElementById('battle-field');
        const circle = document.createElement('div');
        circle.className = 'summon-circle';
        circle.style.left = (x - 50) + 'px';
        circle.style.top = (y - 50) + 'px';
        field.appendChild(circle);

        setTimeout(() => {
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI * 2;
                const offsetX = Math.cos(angle) * 30;
                const offsetY = Math.sin(angle) * 30;
                
                const skeletonData = {
                    id: this.state.characterIdCounter++,
                    roleId: 10,
                    name: '骷髅小兵',
                    team: team,
                    x: x + offsetX,
                    y: y + offsetY,
                    hp: 50,
                    maxHp: 50,
                    attack: 10,
                    attackInterval: 3,
                    lastAttackTime: 0,
                    type: '地面',
                    canAir: false,
                    canGround: true,
                    skill: '',
                    skillCooldown: 0,
                    image: 'role10.svg',
                    aiState: 'patrol',
                    lastAiState: null,
                    idleTimer: 0,
                    patrolTarget: null,
                    patrolPath: [],
                    chaseTimer: 0,
                    attackRange: 70,
                    detectRange: 200,
                    moveSpeed: 0.5
                };
                this.state[`${team}Characters`].push(skeletonData);
                this.renderCharacter(skeletonData);
            }
            this.showFloatingText(x, y, '召唤!', '#8A2BE2');
            
            setTimeout(() => {
                circle.remove();
            }, 1000);
        }, 1000);
    }

    processCrownSkill(char, enemyChars, deltaTime) {
        char.hasTarget = false;
        char.skillCooldown += deltaTime / 1000;
        
        const target = this.findNearestEnemy(char, enemyChars);
        const attackRange = char.attackRange || 250;
        
        if (target && this.getDistance(char, target) <= attackRange) {
            char.hasTarget = true;
        }
        
        if (target) {
            const distance = this.getDistance(char, target);
            
            if (distance > attackRange) {
                this.moveTowardsTarget(char, target, deltaTime);
            } else {
                if (char.skillCooldown >= char.attackInterval) {
                    char.skillCooldown = 0;
                    this.triggerBasicAttack(char);
                    this.createProjectile(char, target, 'role8.svg', 60, 'rotate');
                }
            }
        } else {
            const wallTarget = this.getWallTarget(char);
            if (wallTarget) {
                const distanceToWall = this.getDistance(char, wallTarget);
                if (distanceToWall > 50) {
                    this.moveTowardsTarget(char, wallTarget, deltaTime);
                } else {
                    char.hasTarget = true;
                    if (char.skillCooldown >= char.attackInterval) {
                        char.skillCooldown = 0;
                        this.triggerBasicAttack(char);
                        this.createProjectile(char, wallTarget, 'role8.svg', 60, 'rotate');
                    }
                }
            }
        }

        char.summonTimer += deltaTime;
        if (char.summonTimer >= 30000) {
            char.summonTimer = 0;
            const randomRole = PURCHASABLE_ROLES[Math.floor(Math.random() * PURCHASABLE_ROLES.length)];
            const summonX = char.x + (Math.random() - 0.5) * 60;
            const summonY = char.y + (Math.random() - 0.5) * 60;
            
            const summonData = {
                id: this.state.characterIdCounter++,
                roleId: randomRole,
                name: CHARACTER_DATA[randomRole].name,
                team: char.team,
                x: summonX,
                y: summonY,
                hp: this.getHpValue(CHARACTER_DATA[randomRole].hp),
                maxHp: this.getHpValue(CHARACTER_DATA[randomRole].hp),
                attack: this.getAttackValue(CHARACTER_DATA[randomRole].attack),
                attackInterval: CHARACTER_DATA[randomRole].attackInterval,
                lastAttackTime: 0,
                type: CHARACTER_DATA[randomRole].type,
                canAir: CHARACTER_DATA[randomRole].canAir,
                canGround: CHARACTER_DATA[randomRole].canGround,
                skill: CHARACTER_DATA[randomRole].skill,
                skillCooldown: 0,
                image: CHARACTER_DATA[randomRole].image,
                hasTarget: false,
                moveSpeed: 0.5,
                aiState: 'patrol',
                lastAiState: null,
                patrolTarget: null,
                patrolPath: [],
                chaseTimer: 0,
                attackRange: CHARACTER_DATA[randomRole].attackRange || 70,
                detectRange: CHARACTER_DATA[randomRole].detectRange || 200,
                guardTimer: 0
            };
            this.state[`${char.team}Characters`].push(summonData);
            this.renderCharacter(summonData);
        }
    }

    processFireSkill(char, enemyChars, deltaTime) {
        char.hasTarget = false;
        char.skillCooldown += deltaTime / 1000;

        if (!char.baseY) {
            char.baseY = char.y;
        }
        
        char.floatProgress += deltaTime / 2000;
        const floatHeight = Math.sin(char.floatProgress * Math.PI) * 15;
        char.y = char.baseY - floatHeight;
        
        const charEl = document.querySelector(`.battle-character[data-char-id="${char.id}"]`);
        if (charEl) {
            charEl.style.top = char.y + 'px';
        }
        
        const target = this.findNearestEnemy(char, enemyChars);
        const attackRange = char.attackRange || 250;
        
        if (target && this.getDistance(char, target) <= attackRange) {
            char.hasTarget = true;
        }
        
        if (target) {
            const distance = this.getDistance(char, target);
            
            if (distance > attackRange) {
                this.moveTowardsTarget(char, target, deltaTime);
            } else {
                if (char.skillCooldown >= char.attackInterval) {
                    char.skillCooldown = 0;
                    this.triggerFireAttack(char, () => {
                        this.createProjectile(char, target, 'role11.svg', 50);
                    });
                }
            }
        } else {
            const wallTarget = this.getWallTarget(char);
            if (wallTarget) {
                const distanceToWall = this.getDistance(char, wallTarget);
                if (distanceToWall > 50) {
                    this.moveTowardsTarget(char, wallTarget, deltaTime);
                } else {
                    char.hasTarget = true;
                    if (char.skillCooldown >= char.attackInterval) {
                        char.skillCooldown = 0;
                        this.triggerFireAttack(char, () => {
                            this.createProjectile(char, wallTarget, 'role11.svg', 50);
                        });
                    }
                }
            }
        }
    }

    processArcherSkill(char, enemyChars, deltaTime) {
        char.hasTarget = false;
        char.skillCooldown += deltaTime / 1000;
        
        const target = this.findNearestEnemy(char, enemyChars);
        const attackRange = char.attackRange || 250;
        
        if (target && this.getDistance(char, target) <= attackRange) {
            char.hasTarget = true;
        }
        
        if (target) {
            const distance = this.getDistance(char, target);
            
            if (distance > attackRange) {
                this.moveTowardsTarget(char, target, deltaTime);
            } else {
                if (char.skillCooldown >= char.attackInterval) {
                    char.skillCooldown = 0;
                    this.triggerArcherAttack(char);
                    this.createProjectile(char, target, 'role19.svg', 50);
                }
            }
        } else {
            const wallTarget = this.getWallTarget(char);
            if (wallTarget) {
                const distanceToWall = this.getDistance(char, wallTarget);
                if (distanceToWall > 50) {
                    this.moveTowardsTarget(char, wallTarget, deltaTime);
                } else {
                    char.hasTarget = true;
                    if (char.skillCooldown >= char.attackInterval) {
                        char.skillCooldown = 0;
                        this.triggerArcherAttack(char);
                        this.createProjectile(char, wallTarget, 'role19.svg', 50);
                    }
                }
            }
        }
    }

    processBasicAttack(char, enemyChars, deltaTime) {
        char.hasTarget = false;
        let wallTarget = this.getWallTarget(char);
        
        if (char.skill === 'shootHeart') {
            char.skillCooldown += deltaTime / 1000;
            const attackRange = char.attackRange || 250;
            const target = this.findNearestEnemy(char, enemyChars);
            
            if (target) {
                char.hasTarget = true;
                const distance = this.getDistance(char, target);
                
                if (distance > attackRange) {
                    this.moveTowardsTarget(char, target, deltaTime);
                } else {
                    if (char.skillCooldown >= 20) {
                        char.skillCooldown = 0;
                        this.triggerBasicAttack(char);
                        this.createProjectile(char, target, 'role23.svg', 30);
                    }
                }
            } else {
                wallTarget = this.getWallTarget(char);
                if (wallTarget) {
                    const distanceToWall = this.getDistance(char, wallTarget);
                    if (distanceToWall > 50) {
                        this.moveTowardsTarget(char, wallTarget, deltaTime);
                    } else {
                        char.hasTarget = true;
                        char.skillCooldown += deltaTime / 1000;
                        if (char.skillCooldown >= 20) {
                            char.skillCooldown = 0;
                            this.triggerBasicAttack(char);
                            this.createProjectile(char, wallTarget, 'role23.svg', 30);
                        }
                    }
                }
            }
        } else if (char.skill === 'shootPea') {
            char.skillCooldown += deltaTime / 1000;
            const attackRange = char.attackRange || 250;
            const target = this.findNearestEnemy(char, enemyChars);
            
            if (target) {
                char.hasTarget = true;
                const distance = this.getDistance(char, target);
                
                if (distance > attackRange) {
                    this.moveTowardsTarget(char, target, deltaTime);
                } else {
                    if (char.skillCooldown >= char.attackInterval) {
                        char.skillCooldown = 0;
                        this.triggerPeaAttack(char);
                        this.createProjectile(char, target, 'role17.svg', 100);
                    }
                }
            } else {
                wallTarget = this.getWallTarget(char);
                if (wallTarget) {
                    const distanceToWall = this.getDistance(char, wallTarget);
                    if (distanceToWall > 50) {
                        this.moveTowardsTarget(char, wallTarget, deltaTime);
                    } else {
                        char.hasTarget = true;
                        char.skillCooldown += deltaTime / 1000;
                        if (char.skillCooldown >= char.attackInterval) {
                            char.skillCooldown = 0;
                            this.triggerPeaAttack(char);
                            this.createProjectile(char, wallTarget, 'role17.svg', 100);
                        }
                    }
                }
            }
        } else if (char.skill === 'produceGold') {
            char.summonTimer += deltaTime;
            if (char.summonTimer >= 10000) {
                char.summonTimer = 0;
                this.triggerBasicAttack(char);
                this.produceGold(char);
            }
        } else if (char.skill === 'giveBirth') {
            char.skillCooldown += deltaTime / 1000;
            if (char.skillCooldown >= char.attackInterval) {
                char.skillCooldown = 0;
                this.triggerBasicAttack(char);
                const babyRole = PURCHASABLE_ROLES[Math.floor(Math.random() * PURCHASABLE_ROLES.length)];
                const babyData = {
                    id: this.state.characterIdCounter++,
                    roleId: babyRole,
                    name: CHARACTER_DATA[babyRole].name,
                    team: char.team,
                    x: char.x + (Math.random() - 0.5) * 40,
                    y: char.y + (Math.random() - 0.5) * 30,
                    hp: this.getHpValue(CHARACTER_DATA[babyRole].hp),
                    maxHp: this.getHpValue(CHARACTER_DATA[babyRole].hp),
                    attack: this.getAttackValue(CHARACTER_DATA[babyRole].attack),
                    attackInterval: CHARACTER_DATA[babyRole].attackInterval,
                    lastAttackTime: 0,
                    type: CHARACTER_DATA[babyRole].type,
                    canAir: CHARACTER_DATA[babyRole].canAir,
                    canGround: CHARACTER_DATA[babyRole].canGround,
                    skill: CHARACTER_DATA[babyRole].skill,
                    skillCooldown: 0,
                    image: CHARACTER_DATA[babyRole].image,
                    hasTarget: false,
                    moveSpeed: 0.5,
                    attackRange: CHARACTER_DATA[babyRole].attackRange || 70,
                    detectRange: CHARACTER_DATA[babyRole].detectRange || 200,
                    guardTimer: 0,
                    isFloating: false,
                    floatProgress: 0,
                    baseY: char.y,
                    beenAttackedByGround: false
                };
                this.state[`${char.team}Characters`].push(babyData);
                this.renderCharacter(babyData);
                this.showFloatingText(char.x, char.y, '诞生!', '#FF69B4');
            }
        } else {
            if (char.roleId === 10) {
                this.processSkeletonAI(char, enemyChars, deltaTime);
            } else {
                const target = this.findNearestEnemy(char, enemyChars);
                
                if (target) {
                    char.hasTarget = true;
                    const distance = this.getDistance(char, target);
                    const attackRange = char.attackRange || 70;
                    
                    if (distance > attackRange) {
                        this.moveTowardsTarget(char, target, deltaTime);
                    } else {
                        char.skillCooldown += deltaTime / 1000;
                        if (char.skillCooldown >= char.attackInterval) {
                            char.skillCooldown = 0;
                            if (char.roleId === 1) {
                                this.triggerStickAttack(char);
                            } else if (char.roleId === 4) {
                                this.triggerHammerAttack(char);
                            } else if (char.roleId === 5) {
                                this.triggerHeadAttack(char);
                            } else {
                                this.triggerBasicAttack(char);
                            }
                            this.attackTarget(char, target);
                        }
                    }
                } else if (wallTarget) {
                    const distanceToWall = this.getDistance(char, wallTarget);
                    if (distanceToWall > 50) {
                        this.moveTowardsTarget(char, wallTarget, deltaTime);
                    } else {
                        char.hasTarget = true;
                        char.skillCooldown += deltaTime / 1000;
                        if (char.skillCooldown >= char.attackInterval) {
                            char.skillCooldown = 0;
                            if (char.roleId === 1) {
                                this.triggerStickAttack(char);
                            } else if (char.roleId === 4) {
                                this.triggerHammerAttack(char);
                            } else if (char.roleId === 5) {
                                this.triggerHeadAttack(char);
                            } else {
                                this.triggerBasicAttack(char);
                            }
                            this.attackTarget(char, wallTarget);
                        }
                    }
                }
            }
        }
    }

    moveTowardsTarget(char, target, deltaTime) {
        const moveSpeed = (char.moveSpeed || 0.5) * (deltaTime / 16);
        const dx = target.x - char.x;
        const dy = target.y - char.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 5) {
            char.x += (dx / dist) * moveSpeed;
            char.y += (dy / dist) * moveSpeed;
            
            const battleField = document.getElementById('battle-field');
            if (battleField) {
                const rect = battleField.getBoundingClientRect();
                const wallWidth = 30;
                const margin = 10;
                
                char.x = Math.max(wallWidth + margin, Math.min(char.x, rect.width - wallWidth - margin));
                char.y = Math.max(margin, Math.min(char.y, rect.height - margin));
            }
            
            if (char.el) {
                char.el.classList.add('walking');
            }
        } else {
            if (char.el) {
                char.el.classList.remove('walking');
            }
        }
        
        if (char.el) {
            char.el.style.left = char.x + 'px';
            char.el.style.top = char.y + 'px';
        }
    }

    processSkeletonAI(char, enemyChars, deltaTime) {
        const nearestEnemy = this.findNearestEnemy(char, enemyChars);
        const wallTarget = this.getWallTarget(char);
        const attackRange = char.attackRange || 70;
        const detectRange = char.detectRange || 200;
        
        const primaryTarget = nearestEnemy && (!wallTarget || this.getDistance(char, nearestEnemy) < this.getDistance(char, wallTarget))
            ? nearestEnemy : wallTarget;
        
        char.hasTarget = char.aiState === 'chase' || char.aiState === 'attack';
        
        this.updateSkeletonAnimation(char);
        
        switch (char.aiState) {
            case 'idle':
                this.skeletonIdleState(char, primaryTarget, deltaTime, detectRange);
                break;
            case 'patrol':
                this.skeletonPatrolState(char, primaryTarget, deltaTime, detectRange);
                break;
            case 'chase':
                this.skeletonChaseState(char, primaryTarget, deltaTime, attackRange);
                break;
            case 'attack':
                this.skeletonAttackState(char, primaryTarget, deltaTime, attackRange);
                break;
            case 'guard':
                this.skeletonGuardState(char, nearestEnemy, deltaTime, detectRange);
                break;
        }
    }

    getWallTarget(char) {
        const isLeftTeam = char.team === 'left';
        const wallPos = isLeftTeam ? this.state.rightWallPos : this.state.leftWallPos;
        
        if (!wallPos) return null;
        
        return {
            x: wallPos.x,
            y: wallPos.y,
            hp: isLeftTeam ? this.state.rightHealth : this.state.leftHealth,
            maxHp: 2500,
            hasShield: false,
            isWall: true,
            team: isLeftTeam ? 'right' : 'left'
        };
    }

    getWallTargetByTeam(team) {
        const isLeftTeam = team === 'left';
        const wallPos = isLeftTeam ? this.state.rightWallPos : this.state.leftWallPos;
        
        if (!wallPos) return null;
        
        return {
            x: wallPos.x,
            y: wallPos.y,
            hp: isLeftTeam ? this.state.rightHealth : this.state.leftHealth,
            maxHp: 2500,
            hasShield: false,
            isWall: true,
            team: isLeftTeam ? 'right' : 'left'
        };
    }

    skeletonIdleState(char, nearestEnemy, deltaTime, detectRange) {
        if (nearestEnemy && this.getDistance(char, nearestEnemy) <= detectRange) {
            char.aiState = 'chase';
            char.chaseTimer = 0;
        } else {
            char.aiState = 'patrol';
            const wallTarget = this.getWallTarget(char);
            if (wallTarget) {
                char.patrolTarget = wallTarget;
                char.patrolPath = [];
            } else {
                this.generatePatrolPath(char);
            }
        }
    }

    skeletonGuardState(char, nearestEnemy, deltaTime, detectRange) {
        char.guardTimer += deltaTime;
        
        if (nearestEnemy && this.getDistance(char, nearestEnemy) <= detectRange) {
            char.aiState = 'chase';
            char.chaseTimer = 0;
            return;
        }
        
        const wallTarget = this.getWallTarget(char);
        if (wallTarget) {
            const distanceToWall = this.getDistance(char, wallTarget);
            if (distanceToWall > 80) {
                char.aiState = 'patrol';
                return;
            }
        }
        
        if (char.guardTimer > 5000) {
            char.aiState = 'patrol';
        }
    }

    skeletonPatrolState(char, nearestEnemy, deltaTime, detectRange) {
        if (nearestEnemy && this.getDistance(char, nearestEnemy) <= detectRange) {
            char.aiState = 'chase';
            char.chaseTimer = 0;
            char.patrolTarget = null;
            char.patrolPath = [];
            return;
        }
        
        const wallTarget = this.getWallTarget(char);
        if (wallTarget) {
            const distanceToWall = this.getDistance(char, wallTarget);
            
            if (distanceToWall > 50) {
                this.moveSkeletonToPoint(char, wallTarget, deltaTime);
            } else {
                char.aiState = 'guard';
                char.guardTimer = 0;
            }
        } else {
            if (!char.patrolTarget || char.patrolPath.length === 0) {
                this.generatePatrolPath(char);
            }
            
            if (char.patrolTarget) {
                const distance = this.getDistance(char, char.patrolTarget);
                
                if (distance > 10) {
                    this.moveSkeletonToPoint(char, char.patrolTarget, deltaTime);
                } else {
                    if (char.patrolPath.length > 0) {
                        char.patrolTarget = char.patrolPath.shift();
                    } else {
                        this.generatePatrolPath(char);
                    }
                }
            }
        }
    }

    skeletonChaseState(char, nearestEnemy, deltaTime, attackRange) {
        if (!nearestEnemy) {
            char.aiState = 'patrol';
            this.generatePatrolPath(char);
            return;
        }
        
        const distance = this.getDistance(char, nearestEnemy);
        
        if (distance <= attackRange) {
            char.aiState = 'attack';
            char.skillCooldown = 0;
        } else {
            this.moveSkeletonToPoint(char, nearestEnemy, deltaTime);
        }
    }

    skeletonAttackState(char, nearestEnemy, deltaTime, attackRange) {
        if (!nearestEnemy) {
            char.aiState = 'patrol';
            this.generatePatrolPath(char);
            return;
        }
        
        const distance = this.getDistance(char, nearestEnemy);
        
        if (distance > attackRange + 20) {
            char.aiState = 'chase';
            char.chaseTimer = 0;
            return;
        }
        
        char.skillCooldown += deltaTime / 1000;
        
        if (char.skillCooldown >= char.attackInterval) {
            char.skillCooldown = 0;
            this.triggerSkeletonAttack(char);
            this.attackTarget(char, nearestEnemy);
        }
    }

    generatePatrolPath(char) {
        const direction = char.team === 'left' ? 1 : -1;
        const startX = char.x;
        const startY = char.y;
        
        const wallTarget = this.getWallTarget(char);
        const wallX = wallTarget ? wallTarget.x : (char.team === 'left' ? 770 : 30);
        
        char.patrolPath = [];
        for (let i = 0; i < 3; i++) {
            const targetX = Math.min(wallX - 50, Math.max(50, startX + direction * (80 + Math.random() * 60)));
            const targetY = Math.max(30, Math.min(270, startY + (Math.random() - 0.5) * 60));
            char.patrolPath.push({
                x: targetX,
                y: targetY
            });
        }
        char.patrolTarget = char.patrolPath.shift();
    }

    moveSkeletonToPoint(char, point, deltaTime) {
        const moveSpeed = (char.moveSpeed || 0.5) * (deltaTime / 16);
        const dx = point.x - char.x;
        const dist = Math.abs(dx);
        
        if (dist > 5) {
            char.x += Math.sign(dx) * moveSpeed;
        }
        
        const dy = point.y - char.y;
        const yDist = Math.abs(dy);
        if (yDist > 5) {
            char.y += Math.sign(dy) * moveSpeed * 0.5;
        }
        
        const battleField = document.getElementById('battle-field');
        if (battleField) {
            const rect = battleField.getBoundingClientRect();
            const wallWidth = 30;
            const margin = 10;
            
            char.x = Math.max(wallWidth + margin, Math.min(char.x, rect.width - wallWidth - margin));
            char.y = Math.max(margin, Math.min(char.y, rect.height - margin));
        }
        
        if (char.el) {
            char.el.style.left = char.x + 'px';
            char.el.style.top = char.y + 'px';
        }
    }

    triggerSkeletonAttack(char) {
        const charEl = char.el || document.querySelector(`.battle-character[data-char-id="${char.id}"]`);
        if (charEl) {
            charEl.classList.remove('skeleton-idle', 'skeleton-walking');
            charEl.classList.add('skeleton-attacking');
            
            setTimeout(() => {
                charEl.classList.remove('skeleton-attacking');
            }, 400);
        }
    }

    triggerStickAttack(char) {
        const charEl = char.el || document.querySelector(`.battle-character[data-char-id="${char.id}"]`);
        if (charEl) {
            charEl.classList.remove('walking');
            charEl.classList.add('attacking-stick');
            setTimeout(() => {
                charEl.classList.remove('attacking-stick');
            }, 400);
        }
    }

    triggerHammerAttack(char) {
        const charEl = char.el || document.querySelector(`.battle-character[data-char-id="${char.id}"]`);
        if (charEl) {
            charEl.classList.remove('walking');
            charEl.classList.add('attacking-hammer');
            setTimeout(() => {
                charEl.classList.remove('attacking-hammer');
            }, 500);
        }
    }

    triggerHeadAttack(char) {
        const charEl = char.el || document.querySelector(`.battle-character[data-char-id="${char.id}"]`);
        if (charEl) {
            charEl.classList.remove('walking');
            charEl.classList.add('attacking-head');
            setTimeout(() => {
                charEl.classList.remove('attacking-head');
            }, 400);
        }
    }

    triggerArcherAttack(char) {
        const charEl = char.el || document.querySelector(`.battle-character[data-char-id="${char.id}"]`);
        if (charEl) {
            charEl.classList.remove('walking');
            charEl.classList.add('attacking-archer');
            setTimeout(() => {
                charEl.classList.remove('attacking-archer');
            }, 300);
        }
    }

    triggerFireAttack(char, callback) {
        const charEl = char.el || document.querySelector(`.battle-character[data-char-id="${char.id}"]`);
        if (charEl) {
            charEl.classList.remove('walking');
            charEl.classList.add('attacking-fire');
            
            setTimeout(() => {
                charEl.classList.remove('attacking-fire');
                if (callback) callback();
            }, 400);
        } else if (callback) {
            setTimeout(callback, 200);
        }
    }

    triggerPeaAttack(char) {
        const charEl = char.el || document.querySelector(`.battle-character[data-char-id="${char.id}"]`);
        if (charEl) {
            charEl.classList.remove('walking');
            charEl.classList.add('attacking-pea');
            setTimeout(() => {
                charEl.classList.remove('attacking-pea');
            }, 300);
        }
    }

    triggerBasicAttack(char, callback) {
        const charEl = char.el || document.querySelector(`.battle-character[data-char-id="${char.id}"]`);
        if (charEl) {
            charEl.classList.remove('walking');
            charEl.classList.add('attacking-basic');
            setTimeout(() => {
                charEl.classList.remove('attacking-basic');
                if (callback) callback();
            }, 350);
        } else if (callback) {
            setTimeout(callback, 175);
        }
    }

    updateSkeletonAnimation(char) {
        const charEl = document.querySelector(`.battle-character[data-char-id="${char.id}"]`);
        if (!charEl) return;
        
        if (char.lastAiState !== char.aiState) {
            charEl.classList.remove('skeleton-idle', 'skeleton-walking', 'skeleton-attacking');
            
            switch (char.aiState) {
                case 'idle':
                case 'guard':
                    charEl.classList.add('skeleton-idle');
                    break;
                case 'patrol':
                case 'chase':
                    charEl.classList.add('skeleton-walking');
                    break;
                case 'attack':
                    break;
            }
            char.lastAiState = char.aiState;
        }
    }

    attackTarget(attacker, target) {
        let damage = attacker.attack;
        
        if (target.hasShield && !target.isWall) {
            if (target.shieldHp > damage) {
                target.shieldHp -= damage;
                damage = 0;
            } else {
                damage -= target.shieldHp;
                target.shieldHp = 0;
                target.hasShield = false;
            }
        }
        
        const attackerEl = document.querySelector(`.battle-character[data-char-id="${attacker.id}"]`);
        if (attackerEl) {
            if (attacker.roleId === 5) {
                attackerEl.classList.add('attacking-head');
                setTimeout(() => attackerEl.classList.remove('attacking-head'), 400);
            } else if (attacker.roleId === 4) {
                attackerEl.classList.add('attacking-hammer');
                setTimeout(() => attackerEl.classList.remove('attacking-hammer'), 500);
            } else if (attacker.roleId === 10) {
                attackerEl.classList.add('skeleton-attacking');
                setTimeout(() => attackerEl.classList.remove('skeleton-attacking'), 400);
            }
        }
        
        if (target.isWall) {
            if (target.team === 'left') {
                this.state.leftHealth -= damage;
            } else {
                this.state.rightHealth -= damage;
            }
            this.updateHealthBars();
        } else {
            target.hp -= damage;
            this.updateHealthBar(target);
        }
        
        this.showFloatingText(target.x, target.y, `-${damage}`, '#FF0000');
        
        if (!target.isWall && target.hp <= 0) {
            this.killCharacter(target);
            attacker.killCount++;
        }
    }

    getDistance(a, b) {
        return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
    }

    findNearestEnemy(char, enemies) {
        let nearest = null;
        let minDist = Infinity;

        enemies.forEach(enemy => {
            const dist = this.getDistance(char, enemy);
            if (dist < minDist && 
                (char.canAir || enemy.type !== '空中') &&
                (char.canGround || enemy.type === '空中')) {
                minDist = dist;
                nearest = enemy;
            }
        });

        if (!nearest) {
            const wallTarget = this.getWallTarget(char);
            if (wallTarget) {
                nearest = wallTarget;
            }
        }

        return nearest;
    }

    createProjectile(source, target, image, damage, type = 'normal') {
        const direction = source.team === 'left' ? 1 : -1;
        const projectile = {
            id: this.state.characterIdCounter++,
            x: source.x + direction * 35,
            y: source.y,
            target: target,
            damage: damage,
            image: image,
            type: type,
            speed: type === 'rotate' ? 5 : 8,
            rotation: 0,
            rotationSpeed: 15,
            lastBackAttack: 0,
            backAttackInterval: 500,
            team: source.team
        };

        this.state.projectiles.push(projectile);
        this.renderProjectile(projectile);
    }

    triggerCrownBackAttack(crown) {
        const direction = crown.team === 'left' ? -1 : 1;
        const backAttack = {
            id: this.state.characterIdCounter++,
            x: crown.x,
            y: crown.y,
            damage: 20,
            image: 'role8.svg',
            type: 'crown-back',
            speed: 6,
            vx: direction * 6,
            vy: (Math.random() - 0.5) * 2,
            team: crown.team
        };

        this.state.projectiles.push(backAttack);
        this.renderProjectile(backAttack);
    }

    renderProjectile(projectile) {
        const field = document.getElementById('battle-field');
        const projEl = document.createElement('div');
        projEl.className = `projectile ${projectile.type === 'rotate' ? 'rotating' : ''}`;
        projEl.dataset.projId = projectile.id;
        projEl.style.left = projectile.x + 'px';
        projEl.style.top = projectile.y + 'px';

        if (projectile.type === 'rotate') {
            projEl.style.width = '30px';
            projEl.style.height = '30px';
        } else {
            projEl.style.width = '20px';
            projEl.style.height = '20px';
        }

        if (projectile.image) {
            projEl.innerHTML = `<img src="assets/sprites/${projectile.image}" alt="projectile">`;
        } else if (projectile.type === 'magic') {
            projEl.style.width = '15px';
            projEl.style.height = '15px';
            projEl.style.background = 'radial-gradient(circle, #FF00FF, #8B008B)';
            projEl.style.borderRadius = '50%';
            projEl.style.boxShadow = '0 0 10px rgba(255, 0, 255, 0.8), 0 0 20px rgba(139, 0, 139, 0.5)';
        } else {
            projEl.style.background = 'radial-gradient(circle, #FFD700, #FF4500)';
            projEl.style.borderRadius = '50%';
            projEl.style.boxShadow = '0 0 8px rgba(255, 215, 0, 0.8)';
        }

        field.appendChild(projEl);
    }

    createHealingEffect(x, y) {
        const field = document.getElementById('battle-field');
        const effect = document.createElement('div');
        effect.className = 'healing-effect';
        effect.style.left = x + 'px';
        effect.style.top = y + 'px';
        effect.innerHTML = `<img src="assets/sprites/role27.svg" alt="heal">`;
        field.appendChild(effect);

        setTimeout(() => {
            effect.remove();
        }, 1000);
    }

    showFloatingText(x, y, text, color) {
        const field = document.getElementById('battle-field');
        const floatText = document.createElement('div');
        floatText.className = 'floating-text';
        floatText.style.left = x + 'px';
        floatText.style.top = y + 'px';
        floatText.style.color = color;
        floatText.textContent = text;
        field.appendChild(floatText);

        setTimeout(() => {
            floatText.remove();
        }, 1000);
    }

    produceGold(flower) {
        const field = document.getElementById('battle-field');
        const coin = document.createElement('div');
        coin.className = 'gold-coin';
        coin.style.left = flower.x + 'px';
        coin.style.top = flower.y + 'px';
        coin.textContent = '💰';
        field.appendChild(coin);

        this.updateGold(flower.team, 50);

        setTimeout(() => {
            coin.remove();
        }, 2000);
    }

    activateRedEye(char) {
        const charEl = document.querySelector(`.battle-character[data-char-id="${char.id}"]`);
        if (charEl) {
            charEl.classList.add('red-eye');
        }
    }

    deactivateRedEye(char) {
        const charEl = document.querySelector(`.battle-character[data-char-id="${char.id}"]`);
        if (charEl) {
            charEl.classList.remove('red-eye');
        }
    }

    processProjectiles(deltaTime) {
        const toRemove = [];

        this.state.projectiles.forEach(proj => {
            try {
            let target = proj.target;
            
            if (!target) {
                if (proj.type !== 'summon' && proj.type !== 'crown-back') {
                    const direction = proj.team === 'left' ? 1 : -1;
                    proj.vx = direction * (proj.speed || 8);
                    proj.vy = 0;
                }
            } else if (!target.isWall) {
                const targetTeam = target.team === 'left' ? 'left' : 'right';
                const targetArray = this.state[`${targetTeam}Characters`];
                const targetExists = targetArray.some(c => c.id === target.id);
                
                if (!targetExists || (typeof target.hp === 'number' && target.hp <= 0)) {
                    const dx = target.x - proj.x;
                    const dy = target.y - proj.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > 0) {
                        proj.vx = (dx / dist) * proj.speed;
                        proj.vy = (dy / dist) * proj.speed;
                    } else {
                        const direction = proj.team === 'left' ? 1 : -1;
                        proj.vx = direction * proj.speed;
                        proj.vy = 0;
                    }
                    proj.target = null;
                    target = null;
                }
            } else if (target && (typeof target.x !== 'number' || typeof target.y !== 'number')) {
                const direction = proj.team === 'left' ? 1 : -1;
                proj.vx = direction * (proj.speed || 8);
                proj.vy = 0;
                proj.target = null;
                target = null;
            }
            
            let moved = false;
            
            if (target && typeof target.x === 'number' && typeof target.y === 'number') {
                const dx = target.x - proj.x;
                const dy = target.y - proj.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (isNaN(dist) || dist <= 35 || dist === 0) {
                    if (proj.type === 'heal') {
                        const healAmount = Math.abs(proj.damage);
                        target.hp = Math.min(target.maxHp, target.hp + healAmount);
                        this.updateHealthBar(target);
                        this.showFloatingText(target.x, target.y, `+${healAmount}`, '#00FF00');
                        toRemove.push(proj.id);
                        return;
                    }
                    
                    let damage = proj.damage || 30;
                    
                    if (target.hasShield && !target.isWall) {
                        if (target.shieldHp > damage) {
                            target.shieldHp -= damage;
                            damage = 0;
                        } else {
                            damage -= target.shieldHp;
                            target.shieldHp = 0;
                            target.hasShield = false;
                        }
                    }
                    
                    if (target.isWall) {
                        if (target.team === 'left') {
                            this.state.leftHealth -= damage;
                        } else {
                            this.state.rightHealth -= damage;
                        }
                        this.updateHealthBars();
                    } else {
                        target.hp -= damage;
                        this.updateHealthBar(target);
                        if (target.hp <= 0) {
                            this.killCharacter(target);
                        }
                    }
                    
                    this.showFloatingText(target.x, target.y, `-${damage}`, '#FF0000');
                    toRemove.push(proj.id);
                    return;
                } else {
                    const moveDist = Math.min(proj.speed, dist);
                    proj.x += (dx / dist) * moveDist;
                    proj.y += (dy / dist) * moveDist;
                    moved = true;
                }
            } else if (proj.type === 'summon') {
                const direction = proj.team === 'left' ? 1 : -1;
                proj.x += direction * proj.speed;
                moved = true;
                
                const wallPos = proj.team === 'left' ? this.state.rightWallPos : this.state.leftWallPos;
                if (wallPos) {
                    const distToWall = Math.sqrt(Math.pow(wallPos.x - proj.x, 2) + Math.pow(wallPos.y - proj.y, 2));
                    if (distToWall < 50) {
                        for (let i = 0; i < proj.summonCount; i++) {
                            const skeletonData = {
                                id: this.state.characterIdCounter++,
                                roleId: proj.summonRoleId,
                                name: '骷髅小兵',
                                team: proj.team,
                                x: proj.x + (Math.random() - 0.5) * 40,
                                y: proj.y + (Math.random() - 0.5) * 30,
                                hp: 50,
                                maxHp: 50,
                                attack: 10,
                                attackInterval: 3,
                                lastAttackTime: 0,
                                type: '地面',
                                canAir: false,
                                canGround: true,
                                skill: '',
                                skillCooldown: 0,
                                image: `role${proj.summonRoleId}.svg`,
                                aiState: 'patrol',
                                lastAiState: null,
                                idleTimer: 0,
                                patrolTarget: null,
                                patrolPath: [],
                                chaseTimer: 0,
                                attackRange: 70,
                                detectRange: 200,
                                moveSpeed: 0.5
                            };
                            this.state[`${proj.team}Characters`].push(skeletonData);
                            this.renderCharacter(skeletonData);
                        }
                        this.showFloatingText(proj.x, proj.y, '召唤!', '#8A2BE2');
                        toRemove.push(proj.id);
                        return;
                    }
                }
            } else if (proj.vx !== undefined || proj.vy !== undefined) {
                if (proj.vx === undefined) proj.vx = 0;
                if (proj.vy === undefined) proj.vy = 0;
                proj.x += proj.vx;
                proj.y += proj.vy;
                moved = true;

                if (proj.type === 'crown-back') {
                    const enemyTeam = proj.team === 'left' ? 'right' : 'left';
                    const enemies = this.state[`${enemyTeam}Characters`];
                    
                    for (const enemy of enemies) {
                        const dist = Math.sqrt(Math.pow(proj.x - enemy.x, 2) + Math.pow(proj.y - enemy.y, 2));
                        if (dist < 40) {
                            let damage = proj.damage;
                            
                            if (enemy.hasShield) {
                                if (enemy.shieldHp > damage) {
                                    enemy.shieldHp -= damage;
                                    damage = 0;
                                } else {
                                    damage -= enemy.shieldHp;
                                    enemy.shieldHp = 0;
                                    enemy.hasShield = false;
                                }
                            }
                            
                            enemy.hp -= damage;
                            this.showFloatingText(enemy.x, enemy.y, `-${damage}`, '#FF0000');
                            
                            if (enemy.hp <= 0) {
                                this.killCharacter(enemy);
                            }
                            
                            toRemove.push(proj.id);
                            return;
                        }
                    }
                }
            } else {
                const direction = proj.team === 'left' ? 1 : -1;
                proj.x += direction * (proj.speed || 8);
                moved = true;
            }
            
            const battleField = document.getElementById('battle-field');
            if (battleField) {
                const rect = battleField.getBoundingClientRect();
                if (proj.x < -200 || proj.x > rect.width + 200 || proj.y < -200 || proj.y > rect.height + 200) {
                    toRemove.push(proj.id);
                    return;
                }
            }

            const projEl = document.querySelector(`.projectile[data-proj-id="${proj.id}"]`);
            if (projEl) {
                projEl.style.left = proj.x + 'px';
                projEl.style.top = proj.y + 'px';
                if (proj.type === 'rotate') {
                    proj.rotation += proj.rotationSpeed;
                    projEl.style.transform = `rotate(${proj.rotation}deg)`;

                    proj.lastBackAttack += deltaTime;
                    if (proj.lastBackAttack >= proj.backAttackInterval) {
                        proj.lastBackAttack = 0;
                        this.triggerCrownBackAttack(proj);
                    }
                }
            }

            if (!moved && proj.type !== 'crown-back') {
                toRemove.push(proj.id);
            }
            } catch (error) {
                console.error('Projectile error:', error);
            }
        });

        toRemove.forEach(id => {
            this.state.projectiles = this.state.projectiles.filter(p => p.id !== id);
            const projEl = document.querySelector(`.projectile[data-proj-id="${id}"]`);
            if (projEl) projEl.remove();
        });
    }

    killCharacter(char) {
        const chars = this.state[`${char.team}Characters`];
        const index = chars.findIndex(c => c.id === char.id);
        
        if (index !== -1) {
            chars.splice(index, 1);
            
            const damage = Math.floor(char.maxHp * 0.1);
            const enemyTeam = char.team === 'left' ? 'right' : 'left';
            this.state[`${enemyTeam}Health`] = Math.max(0, this.state[`${enemyTeam}Health`] - damage);
            
            const healthBar = document.getElementById(`${enemyTeam}-health-bar`);
            if (healthBar) {
                const maxHealth = 2500;
                healthBar.style.width = (this.state[`${enemyTeam}Health`] / maxHealth * 100) + '%';
            }
            
            const charEl = char.el || document.querySelector(`.battle-character[data-char-id="${char.id}"]`);
            if (charEl) {
                charEl.classList.remove('walking', 'skeleton-walking', 'skeleton-idle', 'skeleton-attacking');
                charEl.classList.add('dying');
                setTimeout(() => {
                    charEl.remove();
                }, 1000);
            }

            if (char.roleId !== 7) {
                try {
                    this.audioManager.playDeathSound();
                } catch (error) {
                    console.error('Death sound error:', error);
                }
            }

            if (char.roleId === 6) {
                for (let i = 0; i < 4; i++) {
                    const randomRole = PURCHASABLE_ROLES[Math.floor(Math.random() * PURCHASABLE_ROLES.length)];
                    const charData = CHARACTER_DATA[randomRole];
                    const summonData = {
                        id: this.state.characterIdCounter++,
                        roleId: randomRole,
                        name: charData.name,
                        team: char.team,
                        x: char.x + (Math.random() - 0.5) * 80,
                        y: char.y + (Math.random() - 0.5) * 80,
                        hp: this.getHpValue(charData.hp),
                        maxHp: this.getHpValue(charData.hp),
                        attack: this.getAttackValue(charData.attack),
                        attackInterval: charData.attackInterval,
                        lastAttackTime: 0,
                        type: charData.type,
                        canAir: charData.canAir,
                        canGround: charData.canGround,
                        skill: charData.skill,
                        skillCooldown: 0,
                        isRedEye: false,
                        redEyeEndTime: 0,
                        hasShield: false,
                        shieldHp: 40,
                        shieldCooldown: 0,
                        healCooldown: 0,
                        summonTimer: 0,
                        birthIndex: 0,
                        killCount: 0,
                        target: null,
                        image: charData.image,
                        hasTarget: false,
                        moveSpeed: 0.5,
                        aiState: 'patrol',
                        lastAiState: null,
                        patrolTarget: null,
                        patrolPath: [],
                        chaseTimer: 0,
                        attackRange: charData.attackRange || 70,
                        detectRange: charData.detectRange || 200,
                        guardTimer: 0
                    };
                    this.state[`${char.team}Characters`].push(summonData);
                    this.renderCharacter(summonData);
                }
            }

            if (char.roleId === 20) {
                const birthOrder = [25, 24, 22, 21];
                birthOrder.forEach(roleId => {
                    const childImage = `role${roleId}.svg`;
                    const childData = {
                        id: this.state.characterIdCounter++,
                        roleId: roleId,
                        name: `角色${roleId}`,
                        team: char.team,
                        x: char.x + (Math.random() - 0.5) * 60,
                        y: char.y + (Math.random() - 0.5) * 60,
                        hp: roleId === 22 ? 500 : (roleId === 24 ? 200 : 100),
                        maxHp: roleId === 22 ? 500 : (roleId === 24 ? 200 : 100),
                        attack: roleId === 24 ? 50 : (roleId === 25 ? 15 : (roleId === 22 ? 0 : 10)),
                        attackInterval: roleId === 24 ? 2.2 : (roleId === 22 ? 20 : 3.6),
                        lastAttackTime: 0,
                        type: roleId === 25 ? '空中' : '地面',
                        canAir: roleId === 25,
                        canGround: true,
                        skill: roleId === 22 ? 'shootHeart' : '',
                        skillCooldown: 0,
                        isRedEye: false,
                        redEyeEndTime: 0,
                        hasShield: false,
                        shieldHp: 40,
                        shieldCooldown: 0,
                        healCooldown: 0,
                        summonTimer: 0,
                        birthIndex: 0,
                        killCount: 0,
                        target: null,
                        image: childImage,
                        hasTarget: false,
                        moveSpeed: 0.5,
                        aiState: 'patrol',
                        lastAiState: null,
                        patrolTarget: null,
                        patrolPath: [],
                        chaseTimer: 0,
                        attackRange: 70,
                        detectRange: 200,
                        guardTimer: 0
                    };
                    this.state[`${char.team}Characters`].push(childData);
                    this.renderCharacter(childData);
                });
            }
        }
    }

    updateHealthBar(char) {
        const charEl = document.querySelector(`.battle-character[data-char-id="${char.id}"]`);
        if (charEl) {
            const healthFill = charEl.querySelector('.health-fill');
            if (healthFill) {
                const percent = (char.hp / char.maxHp) * 100;
                healthFill.style.width = percent + '%';
            }

            if (char.hasShield && !charEl.querySelector('.shield-effect')) {
                const shield = document.createElement('div');
                shield.className = 'shield-effect';
                charEl.appendChild(shield);
            } else if (!char.hasShield && charEl.querySelector('.shield-effect')) {
                charEl.querySelector('.shield-effect').remove();
            }

        }
    }

    updateHealthBars() {
        const maxHealth = 2500;
        const leftHealthBar = document.getElementById('left-health-bar');
        const rightHealthBar = document.getElementById('right-health-bar');
        
        if (leftHealthBar) {
            leftHealthBar.style.width = (this.state.leftHealth / maxHealth * 100) + '%';
        }
        if (rightHealthBar) {
            rightHealthBar.style.width = (this.state.rightHealth / maxHealth * 100) + '%';
        }
    }

    updateCooldownDisplays() {
        ['left', 'right'].forEach(team => {
            const cards = document.querySelectorAll(`.card[data-role-id="2"][data-team="${team}"]`);
            const mages = this.state[`${team}Characters`].filter(c => c.roleId === 2);
            
            cards.forEach(card => {
                const cooldownDiv = card.querySelector('.card-cooldown');
                const cooldownText = card.querySelector('.cooldown-text');
                
                if (mages.length > 0) {
                    const mage = mages[0];
                    const cooldownRemaining = Math.ceil((30000 - mage.summonTimer) / 1000);
                    
                    if (cooldownRemaining > 0) {
                        cooldownDiv.style.display = 'flex';
                        cooldownText.textContent = cooldownRemaining;
                    } else {
                        cooldownDiv.style.display = 'none';
                    }
                } else {
                    cooldownDiv.style.display = 'none';
                }
            });
        });
    }

    updateLockOnEffects() {
        ['left', 'right'].forEach(team => {
            const chars = this.state[`${team}Characters`];
            
            chars.forEach(char => {
                if (!char.lockOnEl) return;
                
                if (char.hasTarget) {
                    char.lockOnEl.style.display = 'block';
                } else {
                    char.lockOnEl.style.display = 'none';
                }
            });
        });
    }

    checkVictory() {
        if (this.state.leftHealth <= 0) {
            console.log('Game over: right wins. Left health:', this.state.leftHealth);
            this.showVictory('right');
        } else if (this.state.rightHealth <= 0) {
            console.log('Game over: left wins. Right health:', this.state.rightHealth);
            this.showVictory('left');
        }
    }

    showVictory(winner) {
        this.state.isPlaying = false;
        const modal = document.getElementById('victory-modal');
        const text = document.getElementById('victory-text');
        
        if (winner === 'left') {
            text.textContent = '恭喜左队成功获得胜利';
        } else if (winner === 'right') {
            text.textContent = '恭喜右队成功获得胜利';
        } else {
            text.textContent = '平局！双方同归于尽';
        }
        
        modal.style.display = 'flex';
    }
}

const game = new Game();
window.game = game;