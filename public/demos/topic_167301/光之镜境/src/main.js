import { LightEngine } from './engine/LightEngine.js';
import { SceneManager, LevelManager } from './engine/SceneManager.js';
import { Modal } from './components/Modal.js';
import { experiments, experimentKnowledge } from './data/experiments.js';
import { levels, levelKnowledge } from './data/levels.js';
import { commonKnowledge, tips } from './data/knowledge.js';

class App {
    constructor() {
        this.currentPage = 'welcome';
        this.canvas = null;
        this.lightEngine = null;
        this.sceneManager = null;
        this.levelManager = null;
        this.selectedElement = null;
        this.isDragging = false;
        this.isRotating = false;
        this.dragOffset = { x: 0, y: 0 };
        this.lastMousePos = { x: 0, y: 0 };
        this.stars = 0;
        this.starThresholds = [10, 5, 2];
        this.actionCount = 0;
        this.gameLoop = null;
        this.showNormal = false;
        this.darkMode = false;
        this.isRecording = false;
        
        this.init();
    }

    init() {
        this.renderWelcomePage();
    }

    renderWelcomePage() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="fixed inset-0 overflow-hidden relative">
                <div class="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
                <div class="absolute inset-0 overflow-hidden">
                    ${this.createLightBeams()}
                </div>
                <div class="absolute inset-0 flex items-center justify-center p-4">
                    <div class="glass rounded-3xl p-10 max-w-lg w-full text-center shadow-2xl animate-slide-up">
                        <div class="mb-6">
                            <i class="fas fa-lightbulb text-6xl text-cyan-400 mb-4 animate-pulse-glow"></i>
                        </div>
                        <h1 class="text-3xl font-bold text-white mb-2 text-glow">光之镜境</h1>
                        <h2 class="text-xl text-cyan-300 mb-6">光的反射互动实验室</h2>
                        <p class="text-gray-400 text-sm mb-2">人教版八年级物理上册 · 第三单元同步学习工具</p>
                        <div class="space-y-3 mb-8 text-left">
                            <div class="flex items-start gap-3">
                                <i class="fas fa-mouse-pointer text-cyan-400 mt-1"></i>
                                <span class="text-gray-300 text-sm">拖拽器材搭建光路，直观验证反射定律</span>
                            </div>
                            <div class="flex items-start gap-3">
                                <i class="fas fa-gamepad text-cyan-400 mt-1"></i>
                                <span class="text-gray-300 text-sm">趣味闯关+自由创作，边玩边学吃透考点</span>
                            </div>
                            <div class="flex items-start gap-3">
                                <i class="fas fa-flask text-cyan-400 mt-1"></i>
                                <span class="text-gray-300 text-sm">零门槛虚拟实验室，解锁无限创意可能</span>
                            </div>
                        </div>
                        <button id="startBtn" class="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-white font-bold rounded-xl transition-all glow-cyan">
                            开启探索
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('startBtn').addEventListener('click', () => {
            localStorage.setItem('lightlab_first_visit', 'false');
            this.renderHomePage();
        });
    }

    createLightBeams() {
        let beams = '';
        for (let i = 0; i < 5; i++) {
            const left = Math.random() * 100;
            const top = Math.random() * 100;
            const angle = Math.random() * 60 + 60;
            const delay = Math.random() * 4;
            beams += `
                <div class="absolute w-1 h-96 bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent"
                     style="left: ${left}%; top: ${top}%; transform: rotate(${angle}deg); animation: light-beam 4s ease-in-out ${delay}s infinite;"></div>
            `;
        }
        return beams;
    }

    renderHomePage() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="min-h-screen flex flex-col">
                <header class="flex items-center justify-between px-6 py-4 glass">
                    <div class="flex items-center gap-3">
                        <i class="fas fa-lightbulb text-cyan-400 text-xl"></i>
                        <h1 class="text-xl font-bold text-white">光之镜境</h1>
                    </div>
                    <div class="flex items-center gap-3">
                        <button id="aboutBtn" class="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center">
                            <i class="fas fa-info-circle text-gray-300"></i>
                        </button>
                        <button id="settingsBtn" class="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center">
                            <i class="fas fa-cog text-gray-300"></i>
                        </button>
                    </div>
                </header>
                <main class="flex-1 flex items-center justify-center p-8">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
                        <div class="mode-card card-hover glass rounded-2xl p-6 cursor-pointer group" data-mode="experiment">
                            <div class="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <i class="fas fa-flask text-3xl text-white"></i>
                            </div>
                            <h3 class="text-xl font-bold text-white mb-2">教材实验</h3>
                            <p class="text-gray-400 text-sm mb-4">还原课本经典实验，掌握反射定律</p>
                            <div class="flex items-center justify-between">
                                <span class="text-xs text-cyan-400">自由实验 + 经典库</span>
                                <button class="info-btn w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center">
                                    <i class="fas fa-info text-gray-300 text-xs"></i>
                                </button>
                            </div>
                            <div class="info-bubble hidden mt-3 p-3 bg-gray-800 rounded-lg text-xs text-gray-300">
                                <p class="font-bold text-cyan-400 mb-1">模式说明</p>
                                <p>自由实验台：拖拽器材自由搭建光路</p>
                                <p>经典实验库：一键加载课本预设实验</p>
                            </div>
                        </div>
                        <div class="mode-card card-hover glass rounded-2xl p-6 cursor-pointer group" data-mode="challenge">
                            <div class="w-16 h-16 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <i class="fas fa-gamepad text-3xl text-white"></i>
                            </div>
                            <h3 class="text-xl font-bold text-white mb-2">闯关挑战</h3>
                            <p class="text-gray-400 text-sm mb-4">难度递进关卡，挑战你的物理思维</p>
                            <div class="flex items-center justify-between">
                                <span class="text-xs text-yellow-400">6个关卡</span>
                                <button class="info-btn w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center">
                                    <i class="fas fa-info text-gray-300 text-xs"></i>
                                </button>
                            </div>
                            <div class="info-bubble hidden mt-3 p-3 bg-gray-800 rounded-lg text-xs text-gray-300">
                                <p class="font-bold text-yellow-400 mb-1">模式说明</p>
                                <p>精准打靶：使用镜子将光线反射到目标</p>
                                <p>光路绕障：绕过障碍物完成光路</p>
                            </div>
                        </div>
                        <div class="mode-card card-hover glass rounded-2xl p-6 cursor-pointer group" data-mode="sandbox">
                            <div class="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <i class="fas fa-palette text-3xl text-white"></i>
                            </div>
                            <h3 class="text-xl font-bold text-white mb-2">流光造境</h3>
                            <p class="text-gray-400 text-sm mb-4">无限创意沙盒，打造专属光影艺术</p>
                            <div class="flex items-center justify-between">
                                <span class="text-xs text-purple-400">自由创作</span>
                                <button class="info-btn w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center">
                                    <i class="fas fa-info text-gray-300 text-xs"></i>
                                </button>
                            </div>
                            <div class="info-bubble hidden mt-3 p-3 bg-gray-800 rounded-lg text-xs text-gray-300">
                                <p class="font-bold text-purple-400 mb-1">模式说明</p>
                                <p>无限器材：放置任意数量的光学元件</p>
                                <p>创新玩法：光绘涂鸦、光影连锁、谜题生成</p>
                            </div>
                        </div>
                    </div>
                </main>
                <footer class="px-6 py-4 glass">
                    <div class="flex items-center justify-center gap-6 text-sm text-gray-400">
                        <button id="helpBtn" class="hover:text-cyan-400 transition-colors">
                            <i class="fas fa-question-circle mr-1"></i>帮助指引
                        </button>
                        <button id="savesBtn" class="hover:text-cyan-400 transition-colors">
                            <i class="fas fa-save mr-1"></i>存档管理
                        </button>
                        <button id="knowledgeBtn" class="hover:text-cyan-400 transition-colors">
                            <i class="fas fa-book mr-1"></i>科普知识
                        </button>
                    </div>
                </footer>
            </div>
        `;

        document.querySelectorAll('.mode-card').forEach(card => {
            card.addEventListener('click', () => {
                const mode = card.dataset.mode;
                if (mode === 'experiment') {
                    this.renderExperimentPage();
                } else if (mode === 'challenge') {
                    this.renderChallengeLevelMap();
                } else if (mode === 'sandbox') {
                    this.renderSandboxPage();
                }
            });
        });

        document.querySelectorAll('.info-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const bubble = btn.parentElement.nextElementSibling;
                bubble.classList.toggle('hidden');
            });
        });

        document.getElementById('aboutBtn').addEventListener('click', () => {
            this.renderWelcomePage();
        });

        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.renderSettingsModal();
        });

        document.getElementById('helpBtn').addEventListener('click', () => {
            this.renderHelpModal();
        });

        document.getElementById('savesBtn').addEventListener('click', () => {
            this.renderSavesModal();
        });

        document.getElementById('knowledgeBtn').addEventListener('click', () => {
            this.renderKnowledgeModal();
        });
    }

    renderExperimentPage() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="min-h-screen flex flex-col">
                <header class="flex items-center justify-between px-6 py-4 glass">
                    <div class="flex items-center gap-4">
                        <button id="backBtn" class="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center">
                            <i class="fas fa-arrow-left text-gray-300"></i>
                        </button>
                        <h1 class="text-xl font-bold text-white">教材实验模式</h1>
                    </div>
                    <div class="flex items-center gap-3">
                        <button id="normalToggle" class="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm">
                            <i class="fas fa-ruler-combined mr-2"></i>法线: 关
                        </button>
                        <button id="darkModeToggle" class="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm">
                            <i class="fas fa-moon mr-2"></i>暗室: 关
                        </button>
                    </div>
                </header>
                <div class="flex-1 flex">
                    <aside class="w-64 glass p-4 flex flex-col gap-4">
                        <div>
                            <h3 class="text-sm font-bold text-gray-300 mb-3">实验选择</h3>
                            <div class="space-y-2">
                                <button id="freeLabBtn" class="w-full p-3 rounded-lg bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/30 transition-colors">
                                    <i class="fas fa-flask mr-2"></i>自由实验台
                                </button>
                                <button id="libraryBtn" class="w-full p-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors">
                                    <i class="fas fa-book mr-2"></i>经典实验库
                                </button>
                            </div>
                        </div>
                        <div>
                            <h3 class="text-sm font-bold text-gray-300 mb-3">器材库</h3>
                            <div class="grid grid-cols-3 gap-2">
                                ${this.createEquipmentButtons(['laser', 'mirror', 'screen', 'protractor', 'obstacle'])}
                            </div>
                        </div>
                        <div id="anglePanel" class="glass p-3 rounded-lg">
                            <h3 class="text-sm font-bold text-cyan-400 mb-2">实时角度</h3>
                            <div class="text-center">
                                <p class="text-2xl font-mono text-white">入射角: <span id="incidentAngle">0</span>°</p>
                                <p class="text-2xl font-mono text-white">反射角: <span id="reflectAngle">0</span>°</p>
                            </div>
                        </div>
                        <div class="mt-auto">
                            <button id="clearBtn" class="w-full p-3 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 transition-colors">
                                <i class="fas fa-trash mr-2"></i>清空场景
                            </button>
                        </div>
                    </aside>
                    <main class="flex-1 relative">
                        <canvas id="mainCanvas" class="w-full h-full cursor-crosshair"></canvas>
                        <div id="knowledgeCard" class="absolute bottom-4 right-4 glass p-4 rounded-xl max-w-xs hidden">
                            <h4 class="text-sm font-bold text-cyan-400 mb-2"><i class="fas fa-lightbulb mr-2"></i>知识点</h4>
                            <p id="knowledgeContent" class="text-xs text-gray-300"></p>
                        </div>
                    </main>
                </div>
            </div>
        `;

        this.initCanvas();
        this.setupCanvasEvents();

        document.getElementById('backBtn').addEventListener('click', () => {
            this.renderHomePage();
        });

        document.getElementById('freeLabBtn').addEventListener('click', () => {
            this.sceneManager.clearElements();
            this.sceneManager.addElement(this.sceneManager.createLaser(200, 300, 0));
            document.getElementById('knowledgeCard').classList.add('hidden');
        });

        document.getElementById('libraryBtn').addEventListener('click', () => {
            this.renderExperimentLibrary();
        });

        document.getElementById('normalToggle').addEventListener('click', () => {
            this.showNormal = !this.showNormal;
            this.lightEngine.showNormal = this.showNormal;
            const btn = document.getElementById('normalToggle');
            btn.innerHTML = this.showNormal 
                ? '<i class="fas fa-ruler-combined mr-2"></i>法线: 开' 
                : '<i class="fas fa-ruler-combined mr-2"></i>法线: 关';
            btn.className = this.showNormal 
                ? 'px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white text-sm' 
                : 'px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm';
        });

        document.getElementById('darkModeToggle').addEventListener('click', () => {
            this.darkMode = !this.darkMode;
            this.lightEngine.darkMode = this.darkMode;
            const btn = document.getElementById('darkModeToggle');
            btn.innerHTML = this.darkMode 
                ? '<i class="fas fa-moon mr-2"></i>暗室: 开' 
                : '<i class="fas fa-moon mr-2"></i>暗室: 关';
            btn.className = this.darkMode 
                ? 'px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-400 text-white text-sm' 
                : 'px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm';
        });

        document.getElementById('clearBtn').addEventListener('click', () => {
            this.sceneManager.clearElements();
            document.getElementById('knowledgeCard').classList.add('hidden');
        });

        this.startGameLoop();
    }

    createEquipmentButtons(types) {
        const icons = {
            laser: 'fas fa-lightbulb',
            mirror: 'fas fa-square',
            screen: 'fas fa-tv',
            protractor: 'fas fa-circle',
            obstacle: 'fas fa-ban'
        };
        const colors = {
            laser: 'bg-yellow-500/20 text-yellow-400',
            mirror: 'bg-blue-500/20 text-blue-400',
            screen: 'bg-white/20 text-white',
            protractor: 'bg-cyan-500/20 text-cyan-400',
            obstacle: 'bg-gray-500/20 text-gray-400'
        };
        return types.map(type => `
            <button class="equip-btn p-2 rounded-lg ${colors[type]} hover:opacity-80 transition-opacity" data-type="${type}" title="${this.getEquipmentName(type)}">
                <i class="${icons[type]}"></i>
            </button>
        `).join('');
    }

    getEquipmentName(type) {
        const names = {
            laser: '激光笔',
            mirror: '平面镜',
            screen: '光屏',
            protractor: '量角器',
            obstacle: '障碍物'
        };
        return names[type] || type;
    }

    renderExperimentLibrary() {
        const modal = new Modal({
            title: '经典实验库',
            width: '600px',
            buttons: []
        }).render();
        
        const list = document.createElement('div');
        list.className = 'space-y-3';
        
        experiments.forEach(exp => {
            const item = document.createElement('div');
            item.className = 'glass p-4 rounded-xl cursor-pointer hover:bg-white/10 transition-colors';
            item.innerHTML = `
                <div class="flex items-center gap-4">
                    <div class="text-3xl">${exp.icon}</div>
                    <div>
                        <h4 class="font-bold text-white">${exp.name}</h4>
                        <p class="text-sm text-gray-400">${exp.description}</p>
                    </div>
                    <button class="ml-auto px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg text-sm">加载</button>
                </div>
            `;
            
            item.querySelector('button').addEventListener('click', () => {
                this.sceneManager.loadPreset(exp);
                const knowledge = experimentKnowledge[exp.knowledge];
                document.getElementById('knowledgeContent').innerHTML = knowledge.content.replace(/\n/g, '<br>');
                document.getElementById('knowledgeCard').classList.remove('hidden');
                modal.close();
            });
            
            list.appendChild(item);
        });
        
        modal.modal.insertBefore(list, modal.modal.querySelector('.flex'));
    }

    renderChallengeLevelMap() {
        const app = document.getElementById('app');
        
        if (!this.levelManager) {
            this.levelManager = new LevelManager();
            this.levelManager.loadLevels(levels);
        }

        const levelGrid = levels.map(level => {
            const unlocked = this.levelManager.isUnlocked(level.id);
            const stars = this.levelManager.getStars(level.id);
            const difficultyColors = {
                easy: 'text-green-400',
                medium: 'text-yellow-400',
                hard: 'text-red-400'
            };
            const difficultyText = {
                easy: '简单',
                medium: '中等',
                hard: '困难'
            };
            
            return `
                <div class="level-card glass rounded-xl p-4 cursor-pointer ${!unlocked ? 'opacity-50' : 'hover:bg-white/10'} transition-colors" 
                     data-level="${level.id}" ${!unlocked ? 'title="未解锁"' : ''}>
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-2xl font-bold text-cyan-400">${level.id}</span>
                        <span class="text-xs ${difficultyColors[level.difficulty]}">${difficultyText[level.difficulty]}</span>
                    </div>
                    <h3 class="font-bold text-white mb-1">${level.name}</h3>
                    <p class="text-xs text-gray-400 mb-3">${level.description}</p>
                    <div class="flex items-center justify-center gap-1">
                        ${[1, 2, 3].map(i => `
                            <i class="fas fa-star ${i <= stars ? 'text-yellow-400' : 'text-gray-600'}"></i>
                        `).join('')}
                    </div>
                    ${!unlocked ? '<div class="absolute inset-0 flex items-center justify-center"><i class="fas fa-lock text-gray-500 text-3xl"></i></div>' : ''}
                </div>
            `;
        }).join('');

        app.innerHTML = `
            <div class="min-h-screen flex flex-col">
                <header class="flex items-center justify-between px-6 py-4 glass">
                    <div class="flex items-center gap-4">
                        <button id="backBtn" class="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center">
                            <i class="fas fa-arrow-left text-gray-300"></i>
                        </button>
                        <h1 class="text-xl font-bold text-white">闯关挑战模式</h1>
                    </div>
                    <div class="text-sm text-gray-400">
                        已完成: ${this.levelManager.getStars(1) > 0 ? Object.keys(this.levelManager.progress).length - 1 : 0}/${levels.length}
                    </div>
                </header>
                <main class="flex-1 p-8">
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                        ${levelGrid}
                    </div>
                </main>
            </div>
        `;

        document.getElementById('backBtn').addEventListener('click', () => {
            this.renderHomePage();
        });

        document.querySelectorAll('.level-card').forEach(card => {
            card.addEventListener('click', () => {
                const levelId = parseInt(card.dataset.level);
                if (this.levelManager.isUnlocked(levelId)) {
                    this.startLevel(levelId);
                }
            });
        });
    }

    startLevel(levelId) {
        const level = levels.find(l => l.id === levelId);
        if (!level) return;

        this.actionCount = 0;
        this.stars = 0;
        this.currentPage = 'challenge';
        this.levelManager.setLevel(levelId - 1);

        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="min-h-screen flex flex-col">
                <header class="flex items-center justify-between px-6 py-4 glass">
                    <div class="flex items-center gap-4">
                        <button id="backBtn" class="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center">
                            <i class="fas fa-arrow-left text-gray-300"></i>
                        </button>
                        <div>
                            <h1 class="text-xl font-bold text-white">关卡 ${level.id}: ${level.name}</h1>
                            <p class="text-sm text-gray-400">${level.description}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-4">
                        <div class="flex items-center gap-2 text-yellow-400">
                            <i class="fas fa-star"></i>
                            <span id="starCount">0/3</span>
                        </div>
                        <div class="text-sm text-gray-400">
                            操作次数: <span id="actionCount">0</span>
                        </div>
                    </div>
                </header>
                <div class="flex-1 flex">
                    <aside class="w-48 glass p-4 flex flex-col gap-4">
                        <div>
                            <h3 class="text-sm font-bold text-gray-300 mb-3">可用器材</h3>
                            <div class="grid grid-cols-2 gap-2">
                                ${this.createEquipmentButtons(['mirror'])}
                            </div>
                            <p class="text-xs text-gray-500 mt-2">最多使用 ${level.maxMirrors} 面镜子</p>
                        </div>
                        <div>
                            <h3 class="text-sm font-bold text-gray-300 mb-3">提示</h3>
                            <p class="text-xs text-gray-400">${levelKnowledge[level.knowledge].content.split('\n')[0]}</p>
                        </div>
                        <div class="mt-auto space-y-2">
                            <button id="resetBtn" class="w-full p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm">
                                <i class="fas fa-redo mr-1"></i>重置关卡
                            </button>
                            <button id="hintBtn" class="w-full p-2 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 text-sm">
                                <i class="fas fa-lightbulb mr-1"></i>查看提示
                            </button>
                        </div>
                    </aside>
                    <main class="flex-1 relative">
                        <canvas id="mainCanvas" class="w-full h-full cursor-crosshair"></canvas>
                    </main>
                </div>
            </div>
        `;

        this.initCanvas();
        
        for (const element of level.elements) {
            this.sceneManager.addElement({ ...element });
        }

        this.setupCanvasEvents();

        document.getElementById('backBtn').addEventListener('click', () => {
            this.renderChallengeLevelMap();
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            this.startLevel(levelId);
        });

        document.getElementById('hintBtn').addEventListener('click', () => {
            Modal.alert(levelKnowledge[level.knowledge].content, '提示');
        });

        this.startGameLoop();
    }

    checkLevelComplete(level) {
        if (this.sceneManager.hasTargetHit()) {
            this.stars = 3;
            if (this.actionCount > this.starThresholds[0]) this.stars = 1;
            else if (this.actionCount > this.starThresholds[1]) this.stars = 2;
            else if (this.actionCount > this.starThresholds[2]) this.stars = 2;
            
            this.levelManager.setStars(level.id, this.stars);
            
            setTimeout(() => {
                this.showLevelComplete(level);
            }, 500);
            
            return true;
        }
        return false;
    }

    showLevelComplete(level) {
        const knowledge = levelKnowledge[level.knowledge];
        
        const modal = new Modal({
            title: '关卡完成!',
            content: `
                <div class="text-center mb-4">
                    <div class="flex justify-center gap-2 mb-4">
                        ${[1, 2, 3].map(i => `
                            <i class="fas fa-star text-4xl ${i <= this.stars ? 'text-yellow-400 animate-pulse' : 'text-gray-600'}"></i>
                        `).join('')}
                    </div>
                    <p class="text-gray-300">操作次数: ${this.actionCount} 次</p>
                    <p class="text-gray-300">获得 ${this.stars} 星评价</p>
                </div>
                <div class="glass p-4 rounded-lg mb-4">
                    <h4 class="font-bold text-cyan-400 mb-2">知识点总结</h4>
                    <p class="text-sm text-gray-300">${knowledge.summary}</p>
                </div>
            `,
            buttons: [
                { text: '返回地图', onClick: () => this.renderChallengeLevelMap() },
                { text: '下一关', primary: true, onClick: () => {
                    const nextLevel = this.levelManager.nextLevel();
                    if (nextLevel) {
                        this.startLevel(nextLevel.id);
                    } else {
                        Modal.alert('恭喜你完成了所有关卡!', '通关成功');
                        this.renderChallengeLevelMap();
                    }
                }}
            ]
        }).render();
    }

    renderSandboxPage() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="min-h-screen flex flex-col">
                <header class="flex items-center justify-between px-6 py-4 glass">
                    <div class="flex items-center gap-4">
                        <button id="backBtn" class="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center">
                            <i class="fas fa-arrow-left text-gray-300"></i>
                        </button>
                        <h1 class="text-xl font-bold text-white">流光造境 · 沙盒模式</h1>
                    </div>
                    <div class="flex items-center gap-3">
                        <button id="recordBtn" class="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm">
                            <i class="fas fa-record-vinyl mr-2"></i>录制
                        </button>
                        <button id="normalToggle" class="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm">
                            <i class="fas fa-ruler-combined mr-2"></i>法线: 关
                        </button>
                        <button id="darkModeToggle" class="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm">
                            <i class="fas fa-moon mr-2"></i>暗室: 关
                        </button>
                    </div>
                </header>
                <div class="flex-1 flex">
                    <aside class="w-64 glass p-4 flex flex-col gap-4">
                        <div>
                            <h3 class="text-sm font-bold text-gray-300 mb-3">器材库</h3>
                            <div class="grid grid-cols-3 gap-2">
                                ${this.createEquipmentButtons(['laser', 'mirror', 'concave', 'convex', 'screen', 'target', 'obstacle', 'sensor', 'canvas'])}
                            </div>
                        </div>
                        <div>
                            <h3 class="text-sm font-bold text-gray-300 mb-3">激光颜色</h3>
                            <div class="flex gap-2">
                                ${['#fbbf24', '#ef4444', '#4ade80', '#3b82f6'].map(color => `
                                    <button class="color-btn w-8 h-8 rounded-full border-2 ${color === '#fbbf24' ? 'border-cyan-400' : 'border-transparent'}" 
                                            style="background-color: ${color}" data-color="${color}"></button>
                                `).join('')}
                            </div>
                        </div>
                        <div>
                            <h3 class="text-sm font-bold text-gray-300 mb-3">玩法工具</h3>
                            <div class="space-y-2">
                                <button id="trailBtn" class="w-full p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-sm flex items-center gap-2">
                                    <i class="fas fa-paint-brush"></i>光路残影
                                </button>
                                <button id="puzzleBtn" class="w-full p-2 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 text-sm flex items-center gap-2">
                                    <i class="fas fa-puzzle-piece"></i>谜题生成器
                                </button>
                            </div>
                        </div>
                        <div class="mt-auto space-y-2">
                            <button id="saveBtn" class="w-full p-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-sm flex items-center gap-2">
                                <i class="fas fa-save"></i>保存场景
                            </button>
                            <button id="sceneCodeBtn" class="w-full p-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-300 text-sm flex items-center gap-2">
                                <i class="fas fa-qrcode"></i>生成场景码
                            </button>
                            <button id="clearBtn" class="w-full p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm flex items-center gap-2">
                                <i class="fas fa-trash"></i>清空场景
                            </button>
                        </div>
                    </aside>
                    <main class="flex-1 relative">
                        <canvas id="mainCanvas" class="w-full h-full cursor-crosshair"></canvas>
                    </main>
                </div>
            </div>
        `;

        this.initCanvas();
        this.lightEngine.initTrailCanvas();
        this.setupCanvasEvents();

        document.getElementById('backBtn').addEventListener('click', () => {
            this.renderHomePage();
        });

        document.getElementById('recordBtn').addEventListener('click', () => {
            this.isRecording = !this.isRecording;
            const btn = document.getElementById('recordBtn');
            if (this.isRecording) {
                btn.innerHTML = '<i class="fas fa-stop mr-2"></i>停止';
                btn.className = 'px-4 py-2 rounded-lg bg-red-500 hover:bg-red-400 text-white text-sm';
            } else {
                btn.innerHTML = '<i class="fas fa-record-vinyl mr-2"></i>录制';
                btn.className = 'px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm';
                Modal.alert('光绘轨迹已记录到感光画布上!', '录制完成');
            }
        });

        document.getElementById('normalToggle').addEventListener('click', () => {
            this.showNormal = !this.showNormal;
            this.lightEngine.showNormal = this.showNormal;
            const btn = document.getElementById('normalToggle');
            btn.innerHTML = this.showNormal 
                ? '<i class="fas fa-ruler-combined mr-2"></i>法线: 开' 
                : '<i class="fas fa-ruler-combined mr-2"></i>法线: 关';
            btn.className = this.showNormal 
                ? 'px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white text-sm' 
                : 'px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm';
        });

        document.getElementById('darkModeToggle').addEventListener('click', () => {
            this.darkMode = !this.darkMode;
            this.lightEngine.darkMode = this.darkMode;
            const btn = document.getElementById('darkModeToggle');
            btn.innerHTML = this.darkMode 
                ? '<i class="fas fa-moon mr-2"></i>暗室: 开' 
                : '<i class="fas fa-moon mr-2"></i>暗室: 关';
            btn.className = this.darkMode 
                ? 'px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-400 text-white text-sm' 
                : 'px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm';
        });

        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('border-cyan-400'));
                btn.classList.add('border-cyan-400');
                this.currentColor = btn.dataset.color;
            });
        });
        this.currentColor = '#fbbf24';

        document.getElementById('trailBtn').addEventListener('click', () => {
            if (!this.lightEngine.trailCanvas) {
                this.lightEngine.initTrailCanvas();
            }
            Modal.alert('光路残影已开启，移动镜子时会留下光线轨迹', '提示');
        });

        document.getElementById('puzzleBtn').addEventListener('click', () => {
            this.renderPuzzleGenerator();
        });

        document.getElementById('saveBtn').addEventListener('click', () => {
            Modal.prompt('请输入场景名称', '保存场景').then(name => {
                if (name) {
                    this.sceneManager.saveToLocalStorage(name);
                    Modal.alert('场景保存成功!', '保存成功');
                }
            });
        });

        document.getElementById('sceneCodeBtn').addEventListener('click', () => {
            const code = this.sceneManager.generateSceneCode();
            const modal = new Modal({
                title: '场景码',
                content: '<textarea class="w-full h-32 p-3 rounded-lg bg-gray-800 border border-gray-600 text-white text-sm" readonly></textarea>',
                buttons: [
                    { text: '复制', onClick: () => {
                        const textarea = modal.modal.querySelector('textarea');
                        textarea.select();
                        document.execCommand('copy');
                        Modal.alert('场景码已复制到剪贴板', '复制成功');
                    }},
                    { text: '导入', onClick: () => {
                        Modal.prompt('请输入场景码', '导入场景').then(inputCode => {
                            if (inputCode) {
                                if (this.sceneManager.loadFromSceneCode(inputCode)) {
                                    Modal.alert('场景导入成功!', '导入成功');
                                } else {
                                    Modal.alert('无效的场景码', '导入失败');
                                }
                            }
                        });
                    }},
                    { text: '关闭', primary: true }
                ]
            }).render();
            
            const textarea = modal.modal.querySelector('textarea');
            textarea.value = code;
        });

        document.getElementById('clearBtn').addEventListener('click', () => {
            Modal.confirm('确定要清空场景吗?', '确认清空').then(confirmed => {
                if (confirmed) {
                    this.sceneManager.clearElements();
                    this.lightEngine.clearTrails();
                }
            });
        });

        this.startGameLoop();
    }

    renderPuzzleGenerator() {
        const modal = new Modal({
            title: '谜题生成器',
            content: `
                <p class="text-gray-300 text-sm mb-4">隐藏指定元件，生成挑战码供其他玩家挑战</p>
                <div class="space-y-3">
                    <label class="flex items-center gap-2 text-sm text-gray-300">
                        <input type="checkbox" id="hideMirrors" checked>
                        隐藏所有镜子
                    </label>
                    <label class="flex items-center gap-2 text-sm text-gray-300">
                        <input type="checkbox" id="hideLasers">
                        隐藏激光源
                    </label>
                </div>
            `,
            buttons: [
                { text: '取消' },
                { text: '生成挑战码', primary: true, onClick: () => {
                    const hideMirrors = document.getElementById('hideMirrors').checked;
                    const hideLasers = document.getElementById('hideLasers').checked;
                    
                    const puzzleData = {
                        elements: this.sceneManager.elements.filter(e => {
                            if (hideMirrors && (e.type === 'mirror' || e.type === 'concave' || e.type === 'convex')) {
                                return false;
                            }
                            if (hideLasers && e.type === 'laser') {
                                return false;
                            }
                            return true;
                        }),
                        solution: this.sceneManager.elements.filter(e => 
                            e.type === 'mirror' || e.type === 'concave' || e.type === 'convex'
                        )
                    };
                    
                    const code = btoa(encodeURIComponent(JSON.stringify(puzzleData)));
                    
                    const resultModal = new Modal({
                        title: '挑战码已生成',
                        content: '<textarea class="w-full h-32 p-3 rounded-lg bg-gray-800 border border-gray-600 text-white text-sm" readonly></textarea>',
                        buttons: [
                            { text: '复制', onClick: () => {
                                const textarea = resultModal.modal.querySelector('textarea');
                                textarea.select();
                                document.execCommand('copy');
                                Modal.alert('挑战码已复制', '成功');
                            }},
                            { text: '关闭', primary: true }
                        ]
                    }).render();
                    
                    resultModal.modal.querySelector('textarea').value = code;
                }}
            ]
        }).render();
    }

    initCanvas() {
        const canvas = document.getElementById('mainCanvas');
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        
        this.canvas = canvas;
        this.lightEngine = new LightEngine(canvas);
        this.sceneManager = new SceneManager(this.lightEngine);
        
        window.addEventListener('resize', () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            this.lightEngine.setSize(canvas.width, canvas.height);
        });
    }

    setupCanvasEvents() {
        const canvas = this.canvas;
        
        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            if (e.button === 0) {
                const clicked = this.getElementAt(x, y);
                if (clicked) {
                    this.selectedElement = clicked;
                    this.isDragging = true;
                    this.dragOffset = {
                        x: x - clicked.x,
                        y: y - clicked.y
                    };
                } else {
                    this.selectedElement = null;
                }
            } else if (e.button === 2) {
                const clicked = this.getElementAt(x, y);
                if (clicked) {
                    this.selectedElement = clicked;
                    this.isRotating = true;
                    this.lastMousePos = { x, y };
                }
            }
        });

        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            if (this.isDragging && this.selectedElement) {
                this.selectedElement.x = x - this.dragOffset.x;
                this.selectedElement.y = y - this.dragOffset.y;
                this.actionCount++;
                this.updateActionCount();
            } else if (this.isRotating && this.selectedElement) {
                const dx = x - this.lastMousePos.x;
                const dy = y - this.lastMousePos.y;
                const angle = Math.atan2(dy, dx) * 180 / Math.PI;
                this.selectedElement.rotation += angle * 0.5;
                this.lastMousePos = { x, y };
                this.actionCount++;
                this.updateActionCount();
            }
        });

        canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.isRotating = false;
        });

        canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
            this.isRotating = false;
        });

        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' && this.selectedElement) {
                this.sceneManager.removeElement(this.selectedElement);
                this.selectedElement = null;
            } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.sceneManager.undo();
            } else if (e.key === 'y' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.sceneManager.redo();
            }
        });

        document.querySelectorAll('.equip-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                this.addElement(type);
            });
        });
    }

    getElementAt(x, y) {
        for (let i = this.sceneManager.elements.length - 1; i >= 0; i--) {
            const element = this.sceneManager.elements[i];
            const dx = x - element.x;
            const dy = y - element.y;
            
            let distance;
            if (element.type === 'target') {
                distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < element.radius + 10) return element;
            } else if (element.type === 'laser') {
                distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 25) return element;
            } else {
                const width = element.width || 80;
                const height = element.height || 40;
                if (Math.abs(dx) < width / 2 + 10 && Math.abs(dy) < height / 2 + 10) {
                    return element;
                }
            }
        }
        return null;
    }

    addElement(type) {
        const x = this.canvas.width / 2;
        const y = this.canvas.height / 2;
        
        let element;
        switch (type) {
            case 'laser':
                element = this.sceneManager.createLaser(x, y, 0, this.currentColor || '#fbbf24');
                break;
            case 'mirror':
                element = this.sceneManager.createMirror(x, y, 0);
                break;
            case 'concave':
                element = this.sceneManager.createConcaveMirror(x, y, 0);
                break;
            case 'convex':
                element = this.sceneManager.createConvexMirror(x, y, 0);
                break;
            case 'screen':
                element = this.sceneManager.createScreen(x, y);
                break;
            case 'target':
                element = this.sceneManager.createTarget(x, y);
                break;
            case 'obstacle':
                element = this.sceneManager.createObstacle(x, y);
                break;
            case 'protractor':
                element = this.sceneManager.createProtractor(x, y);
                break;
            case 'sensor':
                element = this.sceneManager.createSensor(x, y);
                break;
            case 'canvas':
                element = this.sceneManager.createLightCanvas(x, y);
                break;
        }
        
        if (element) {
            this.sceneManager.addElement(element);
            this.actionCount++;
            this.updateActionCount();
        }
    }

    updateActionCount() {
        const el = document.getElementById('actionCount');
        if (el) {
            el.textContent = this.actionCount;
        }
    }

    startGameLoop() {
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
        }
        
        const loop = () => {
            this.lightEngine.updateRays();
            
            const angles = this.lightEngine.getRayAngles();
            if (angles.length > 0) {
                const incidentEl = document.getElementById('incidentAngle');
                const reflectEl = document.getElementById('reflectAngle');
                if (incidentEl) incidentEl.textContent = angles[0].incidentAngle;
                if (reflectEl) reflectEl.textContent = angles[0].reflectAngle;
            }
            
            this.lightEngine.draw();
            
            if (this.currentPage === 'challenge' && this.levelManager?.getCurrentLevel()) {
                this.checkLevelComplete(this.levelManager.getCurrentLevel());
            }
            
            this.gameLoop = requestAnimationFrame(loop);
        };
        
        loop();
    }

    renderSettingsModal() {
        const modal = new Modal({
            title: '设置',
            content: `
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm text-gray-300 mb-2">音效音量</label>
                        <input type="range" min="0" max="100" value="50" class="w-full">
                    </div>
                    <div>
                        <label class="block text-sm text-gray-300 mb-2">光线亮度</label>
                        <input type="range" min="0" max="100" value="80" class="w-full">
                    </div>
                    <div>
                        <label class="block text-sm text-gray-300 mb-2">画质模式</label>
                        <select class="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white">
                            <option>高性能</option>
                            <option selected>标准</option>
                            <option>高质量</option>
                        </select>
                    </div>
                    <div class="pt-4 border-t border-gray-700">
                        <button id="resetProgress" class="w-full p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm">
                            重置所有进度
                        </button>
                    </div>
                </div>
            `,
            buttons: [{ text: '确定', primary: true }]
        }).render();
        
        document.getElementById('resetProgress').addEventListener('click', () => {
            Modal.confirm('确定要重置所有进度吗?此操作不可撤销!', '确认重置').then(confirmed => {
                if (confirmed) {
                    localStorage.removeItem('lightlab_level_progress');
                    localStorage.removeItem('lightlab_saves');
                    Modal.alert('进度已重置', '重置成功');
                }
            });
        });
    }

    renderHelpModal() {
        const modal = new Modal({
            title: '帮助指引',
            content: `
                <div class="space-y-4">
                    <div class="glass p-3 rounded-lg">
                        <h4 class="font-bold text-cyan-400 mb-2"><i class="fas fa-mouse-pointer mr-2"></i>基本操作</h4>
                        <ul class="text-sm text-gray-300 space-y-1">
                            <li>• 点击器材可选中并拖拽移动</li>
                            <li>• 右键拖动可旋转选中的元件</li>
                            <li>• 按 Delete 键删除选中的元件</li>
                            <li>• Ctrl+Z 撤销，Ctrl+Y 重做</li>
                        </ul>
                    </div>
                    <div class="glass p-3 rounded-lg">
                        <h4 class="font-bold text-cyan-400 mb-2"><i class="fas fa-flask mr-2"></i>实验模式</h4>
                        <ul class="text-sm text-gray-300 space-y-1">
                            <li>• 自由实验台：从零开始搭建光路</li>
                            <li>• 经典实验库：一键加载预设实验</li>
                            <li>• 法线开关：显示/隐藏法线辅助线</li>
                        </ul>
                    </div>
                    <div class="glass p-3 rounded-lg">
                        <h4 class="font-bold text-cyan-400 mb-2"><i class="fas fa-gamepad mr-2"></i>闯关模式</h4>
                        <ul class="text-sm text-gray-300 space-y-1">
                            <li>• 使用镜子将光线反射到目标点</li>
                            <li>• 操作次数越少，星级评价越高</li>
                            <li>• 通关后解锁下一关</li>
                        </ul>
                    </div>
                </div>
            `,
            buttons: [{ text: '知道了', primary: true }]
        }).render();
    }

    renderSavesModal() {
        const saves = this.sceneManager?.getSaves() || [];
        
        const modal = new Modal({
            title: '存档管理',
            width: '600px',
            buttons: []
        }).render();
        
        const list = document.createElement('div');
        list.className = 'space-y-2 max-h-80 overflow-y-auto';
        
        if (saves.length === 0) {
            list.innerHTML = '<p class="text-center text-gray-500 py-8">暂无存档</p>';
        } else {
            saves.forEach(save => {
                const item = document.createElement('div');
                item.className = 'glass p-3 rounded-lg flex items-center justify-between';
                item.innerHTML = `
                    <div>
                        <h4 class="font-bold text-white">${save.name}</h4>
                        <p class="text-xs text-gray-500">${new Date(save.createdAt).toLocaleString()}</p>
                    </div>
                    <div class="flex gap-2">
                        <button class="load-btn px-3 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-sm" data-id="${save.id}">加载</button>
                        <button class="delete-btn px-3 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm" data-id="${save.id}">删除</button>
                    </div>
                `;
                
                item.querySelector('.load-btn').addEventListener('click', () => {
                    if (this.sceneManager) {
                        this.sceneManager.loadFromSave(save);
                        modal.close();
                        Modal.alert('场景加载成功!', '加载成功');
                    }
                });
                
                item.querySelector('.delete-btn').addEventListener('click', () => {
                    Modal.confirm('确定要删除这个存档吗?', '确认删除').then(confirmed => {
                        if (confirmed && this.sceneManager) {
                            this.sceneManager.deleteSave(save.id);
                            this.renderSavesModal();
                            modal.close();
                        }
                    });
                });
                
                list.appendChild(item);
            });
        }
        
        modal.modal.insertBefore(list, modal.modal.querySelector('.flex'));
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'px-6 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white font-medium';
        closeBtn.textContent = '关闭';
        closeBtn.addEventListener('click', () => modal.close());
        
        const btnContainer = modal.modal.querySelector('.flex');
        if (btnContainer) {
            btnContainer.appendChild(closeBtn);
        }
    }

    renderKnowledgeModal() {
        const modal = new Modal({
            title: '科普知识',
            width: '700px',
            buttons: [{ text: '关闭', primary: true }]
        }).render();
        
        const content = document.createElement('div');
        content.className = 'space-y-6';
        
        const lawSection = document.createElement('div');
        lawSection.className = 'glass p-4 rounded-xl';
        lawSection.innerHTML = `
            <h3 class="font-bold text-cyan-400 mb-3"><i class="fas fa-book-open mr-2"></i>${commonKnowledge.reflect_law_summary.title}</h3>
            <div class="grid grid-cols-3 gap-4">
                ${commonKnowledge.reflect_law_summary.points.map(point => `
                    <div class="text-center">
                        <div class="text-lg font-bold text-white mb-1">${point.text}</div>
                        <div class="text-xs text-gray-400">${point.desc}</div>
                    </div>
                `).join('')}
            </div>
        `;
        content.appendChild(lawSection);
        
        const reflectionSection = document.createElement('div');
        reflectionSection.className = 'glass p-4 rounded-xl';
        reflectionSection.innerHTML = `
            <h3 class="font-bold text-cyan-400 mb-3"><i class="fas fa-compare mr-2"></i>${commonKnowledge.mirror_vs_diffuse.title}</h3>
            <div class="grid grid-cols-2 gap-4">
                <div class="bg-gray-800/50 p-3 rounded-lg">
                    <h4 class="font-bold text-green-400 mb-2">${commonKnowledge.mirror_vs_diffuse.mirror.title}</h4>
                    <p class="text-xs text-gray-300 mb-1">${commonKnowledge.mirror_vs_diffuse.mirror.description}</p>
                    <p class="text-xs text-gray-500">示例: ${commonKnowledge.mirror_vs_diffuse.mirror.example}</p>
                </div>
                <div class="bg-gray-800/50 p-3 rounded-lg">
                    <h4 class="font-bold text-yellow-400 mb-2">${commonKnowledge.mirror_vs_diffuse.diffuse.title}</h4>
                    <p class="text-xs text-gray-300 mb-1">${commonKnowledge.mirror_vs_diffuse.diffuse.description}</p>
                    <p class="text-xs text-gray-500">示例: ${commonKnowledge.mirror_vs_diffuse.diffuse.example}</p>
                </div>
            </div>
        `;
        content.appendChild(reflectionSection);
        
        const applicationsSection = document.createElement('div');
        applicationsSection.className = 'glass p-4 rounded-xl';
        applicationsSection.innerHTML = `
            <h3 class="font-bold text-cyan-400 mb-3"><i class="fas fa-lightbulb mr-2"></i>生活中的应用</h3>
            <div class="grid grid-cols-3 gap-3">
                ${commonKnowledge.real_life_applications.map(app => `
                    <div class="bg-gray-800/50 p-3 rounded-lg text-center">
                        <div class="text-2xl mb-2">${app.icon}</div>
                        <h4 class="font-bold text-white text-sm mb-1">${app.title}</h4>
                        <p class="text-xs text-gray-400">${app.description}</p>
                    </div>
                `).join('')}
            </div>
        `;
        content.appendChild(applicationsSection);
        
        modal.modal.insertBefore(content, modal.modal.querySelector('.flex'));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const firstVisit = localStorage.getItem('lightlab_first_visit');
    if (firstVisit === 'false') {
        const app = new App();
        app.renderHomePage();
    } else {
        const app = new App();
    }
});
