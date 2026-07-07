import { Game, STATES } from './core/game.js';
import plantData from './data/plants.js';
import hybridData from './data/hybrids.js';
import { Lab } from './systems/lab.js';
import relicData from './data/relics.js';
import zombieData, { WEAKNESS_INFO as ZOMBIE_WEAKNESS_INFO } from './data/zombies.js';
import waveData from './data/waves.js';
import sceneData from './data/scenes.js';
import { NODE_INFO, EVENT_DESCRIPTIONS, EVENT_TYPES, generateFullTowerMap } from './data/tower_map.js';
import { generateShopRelics as generateTowerShopRelics, SHOP_CONFIG as TOWER_SHOP_CONFIG } from './systems/tower_shop.js';

// ── DOM references ──────────────────────────────────────────────
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ── WebGL support check ─────────────────────────────────────────
function isWebGLSupported() {
    try {
        const canvas = document.createElement('canvas');
        const gl = window.WebGLRenderingContext &&
            (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
        // 不仅检查上下文是否存在，还验证它能实际渲染（drawingBufferWidth > 0）
        return !!(gl && gl.drawingBufferWidth > 0);
    } catch (e) {
        return false;
    }
}

// ── Loading screen helpers ──────────────────────────────────────
function showLoading() {
    const el = $('#loading-screen');
    if (el) el.classList.remove('hidden');
}

function hideLoading() {
    const el = $('#loading-screen');
    if (el) {
        el.classList.add('fade-out');
        setTimeout(() => el.classList.add('hidden'), 600);
    }
}

function showError(message) {
    const errScreen = $('#error-screen');
    if (errScreen) {
        // 若提供了真实错误信息，替换默认的 WebGL 文案
        if (message) {
            const detail = $('#error-detail');
            if (detail) detail.textContent = message;
        }
        errScreen.classList.remove('hidden');
    }
    hideLoading();
}

// ── Screen visibility helpers ───────────────────────────────────
function showScreen(id) {
    $$('.game-screen').forEach((s) => s.classList.add('hidden'));
    const target = $(`#${id}`);
    if (target) target.classList.remove('hidden');
}

function hideAllScreens() {
    $$('.game-screen').forEach((s) => s.classList.add('hidden'));
}

// ── HUD update ──────────────────────────────────────────────────
function updateHUD(game) {
    const sunEl = $('#hud-sun-count');
    const waveEl = $('#hud-wave');
    const coinsEl = $('#hud-coins');
    const floorEl = $('#hud-floor');
    const hpEl = $('#hud-hp');
    const relicsEl = $('#hud-relics');
    const deckEl = $('#hud-deck');

    if (sunEl) sunEl.textContent = game.sun;
    if (waveEl) waveEl.textContent = `${game.currentWave + 1} / ${game.totalWaves}`;
    if (coinsEl) coinsEl.textContent = game.coins;
    if (floorEl) floorEl.textContent = game.currentFloor || game.floor || 1;
    if (hpEl) hpEl.textContent = game.baseHP;
    if (relicsEl) relicsEl.textContent = (game.relics ? game.relics.length : 0);
    if (deckEl) deckEl.textContent = (game.loadout ? game.loadout.length : 0);

    // 铲子按钮：只在战斗状态显示
    const shovelBtn = $('#btn-shovel');
    if (shovelBtn) {
        if (game.state === 'playing') {
            shovelBtn.classList.remove('hidden');
        } else {
            shovelBtn.classList.add('hidden');
            shovelBtn.classList.remove('active');
        }
    }

    // 更新波次进度条
    updateWaveProgressBar(game);
}

// 更新波次进度条
function updateWaveProgressBar(game) {
    const barEl = $('#wave-progress-bar');
    const fillEl = $('#wave-progress-fill');
    const labelEl = $('#wave-progress-label');
    if (!barEl || !fillEl || !labelEl) return;

    // 只在战斗状态显示
    if (game.state !== 'playing') {
        barEl.classList.add('hidden');
        return;
    }
    barEl.classList.remove('hidden');

    // 计算进度
    const totalWaves = game.totalWaves || 2;
    const currentWave = game.currentWave || 0;
    const progress = Math.min(1, (currentWave + 0.5) / totalWaves);
    fillEl.style.width = `${progress * 100}%`;

    // 阶段标签（兼容新的 prelude_N / wave_N 格式）
    let label = '';
    const phase = game.wavePhase || '';
    if (phase === 'prep') {
        label = '准备阶段';
        fillEl.classList.remove('huge-wave');
    } else if (phase.startsWith && phase.startsWith('prelude_')) {
        const idx = parseInt(phase.split('_')[1], 10) + 1;
        label = `第${idx}波 前置`;
        fillEl.classList.remove('huge-wave');
    } else if (phase.startsWith && phase.startsWith('wave_')) {
        const idx = parseInt(phase.split('_')[1], 10) + 1;
        if (game.isHugeWave) {
            label = '一大波僵尸!';
            fillEl.classList.add('huge-wave');
        } else {
            label = `第${idx}波`;
            fillEl.classList.remove('huge-wave');
        }
    } else if (phase === 'clear_wait') {
        label = `第${currentWave + 1}波 清场中`;
        fillEl.classList.remove('huge-wave');
    } else {
        label = `${currentWave + 1} / ${totalWaves}`;
    }
    labelEl.textContent = `${label} (${currentWave + 1}/${totalWaves})`;
}

// Expose for game.js to call from its update loop
window.updatePVZHUD = updateHUD;

// ── Card slot bar ──────────────────────────────────────────────
function buildCardSlots(game) {
    const bar = $('#card-slot-bar');
    if (!bar) return;
    bar.innerHTML = '';

    // 战斗中只显示 cardSlots 个卡槽（初始6，可通过商店升级到10）
    const maxSlots = game.cardSlots || 6;
    const loadout = game.loadout || [];
    const displayLoadout = loadout.slice(0, maxSlots);

    displayLoadout.forEach((plantId, idx) => {
        const slot = document.createElement('div');
        slot.className = 'card-slot';
        slot.dataset.plantId = plantId;
        slot.dataset.index = idx;

        // 使用 game.plantData 而非导入的 plantData，以支持杂交植物
        const data = (game.plantData && game.plantData[plantId]) || plantData[plantId];
        const name = data ? data.name_cn : plantId;
        const cost = data ? data.cost : 0;

        // Plant name
        const nameEl = document.createElement('div');
        nameEl.className = 'card-name';
        nameEl.textContent = name;
        slot.appendChild(nameEl);

        // Sun cost
        const costEl = document.createElement('div');
        costEl.className = 'card-cost';
        costEl.textContent = `☀${cost}`;
        slot.appendChild(costEl);

        // Cooldown overlay
        const cooldownEl = document.createElement('div');
        cooldownEl.className = 'card-cooldown-overlay';
        slot.appendChild(cooldownEl);

        // Add DOM click listener for card selection
        slot.addEventListener('click', (e) => {
            e.stopPropagation();
            // Check cooldown
            if (game.plantCooldowns && game.plantCooldowns[plantId] > 0) return;
            // Check sun
            if (data && game.sun < data.cost) return;
            if (game.input) {
                game.input.selectPlant(plantId);
            }
        });

        bar.appendChild(slot);
    });
}

// Expose buildCardSlots globally so game.js can call it
window.buildPVZCardSlots = buildCardSlots;

// Update card slot visual state (selection + cooldown) based on game state
function updateCardSlotSelection(game) {
    const slots = $$('.card-slot');
    const selectedPlant = game.input ? game.input.selectedPlant : null;
    slots.forEach((slot) => {
        const plantId = slot.dataset.plantId;
        const data = (game.plantData && game.plantData[plantId]) || plantData[plantId];

        // Selection state
        if (plantId === selectedPlant) {
            slot.classList.add('selected');
        } else {
            slot.classList.remove('selected');
        }

        // Cooldown state
        const cooldownEl = slot.querySelector('.card-cooldown-overlay');
        const cooldown = game.plantCooldowns ? (game.plantCooldowns[plantId] || 0) : 0;
        if (cooldown > 0 && data) {
            slot.classList.add('cooldown');
            if (cooldownEl) {
                const pct = Math.min(100, (cooldown / (data.cooldown || 7.5)) * 100);
                cooldownEl.style.height = pct + '%';
                cooldownEl.textContent = Math.ceil(cooldown) + 's';
            }
        } else {
            slot.classList.remove('cooldown');
            if (cooldownEl) {
                cooldownEl.style.height = '0%';
                cooldownEl.textContent = '';
            }
        }

        // Sun affordability
        if (data && game.sun < data.cost) {
            slot.classList.add('disabled');
        } else {
            slot.classList.remove('disabled');
        }
    });
}
window.updatePVZCardSlots = updateCardSlotSelection;

// ── Keyboard shortcuts ──────────────────────────────────────────
function setupKeyboardShortcuts(game) {
    document.addEventListener('keydown', (e) => {
        // Ignore if user is typing in an input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        switch (e.key.toLowerCase()) {
            case 'p':
                if (game.getState() === STATES.PLAYING) {
                    game.pause();
                } else if (game.getState() === STATES.PAUSED) {
                    game.resume();
                }
                break;

            case 'm':
                if (game.audio) {
                    if (game.audio.isMuted()) {
                        game.audio.unmute();
                    } else {
                        game.audio.mute();
                    }
                    const muteBtn = $('#btn-mute');
                    if (muteBtn) muteBtn.textContent = game.audio.isMuted() ? '🔇' : '🔊';
                }
                break;

            case 'escape':
                if (game.getState() === STATES.PLAYING) {
                    game.pause();
                } else if (game.getState() === STATES.PAUSED) {
                    game.resume();
                } else if (game.getState() === STATES.SHOP) {
                    game.setState(STATES.PLAYING);
                } else if (game.getState() === STATES.LAB) {
                    game.setState(STATES.PLAYING);
                } else if (game.getState() === STATES.MENU) {
                    // Already at menu, do nothing
                }
                break;
        }
    });
}

// ── Touch event prevention (mobile) ─────────────────────────────
function preventTouchDefaults() {
    document.addEventListener('touchmove', (e) => {
        if (e.target.closest('#game-canvas')) {
            e.preventDefault();
        }
    }, { passive: false });

    document.addEventListener('touchstart', (e) => {
        if (e.target.closest('#game-canvas')) {
            e.preventDefault();
        }
    }, { passive: false });
}

// ── UI button wiring ────────────────────────────────────────────
function setupUIButtons(game) {
    // Main menu - 继续游戏按钮（加载最近存档，进入塔地图）
    const btnContinue = $('#btn-continue-game');
    if (btnContinue) {
        btnContinue.addEventListener('click', () => {
            // 查找最近的存档
            const latestSlot = findLatestSaveSlot();
            if (latestSlot) {
                loadSaveAndEnterTowerMap(game, latestSlot);
            } else {
                alert('没有找到存档，请开始新游戏');
            }
        });
    }

    // Main menu - 新游戏按钮（弹出存档选择，选择槽位后进入植物选择）
    const btnNewGame = $('#btn-new-game');
    if (btnNewGame) {
        btnNewGame.addEventListener('click', () => {
            game._saveSelectMode = 'new';  // 新游戏模式
            game.setState(STATES.SAVE_SELECT);
        });
    }

    // Main menu - 图鉴按钮
    const btnEncyclopediaMenu = $('#btn-encyclopedia-menu');
    if (btnEncyclopediaMenu) {
        btnEncyclopediaMenu.addEventListener('click', () => {
            game.setState(STATES.ENCYCLOPEDIA);
        });
    }

    // Main menu - 成就按钮
    const btnAchievementsMenu = $('#btn-achievements-menu');
    if (btnAchievementsMenu) {
        btnAchievementsMenu.addEventListener('click', () => {
            game.setState(STATES.ACHIEVEMENTS);
        });
    }

    // Achievements screen - 返回按钮
    const btnAchievementsBack = $('#btn-achievements-back');
    if (btnAchievementsBack) {
        btnAchievementsBack.addEventListener('click', () => {
            game.setState(STATES.MENU);
        });
    }

    // Main menu - 设置按钮
    const btnSettingsMenu = $('#btn-settings-menu');
    if (btnSettingsMenu) {
        btnSettingsMenu.addEventListener('click', () => {
            game.setState(STATES.SETTINGS);
        });
    }

    // Settings screen buttons
    const btnSettingsBack = $('#btn-settings-back');
    if (btnSettingsBack) {
        btnSettingsBack.addEventListener('click', () => {
            game.setState(STATES.MENU);
        });
    }

    const btnSettingsSaveManager = $('#btn-settings-save-manager');
    if (btnSettingsSaveManager) {
        btnSettingsSaveManager.addEventListener('click', () => {
            game.setState(STATES.SAVE_MANAGER);
        });
    }

    const btnToggleSound = $('#btn-toggle-sound');
    if (btnToggleSound) {
        btnToggleSound.addEventListener('click', () => {
            if (game.audio) {
                if (game.audio.isMuted()) {
                    game.audio.unmute();
                    btnToggleSound.textContent = '🔊 开启';
                } else {
                    game.audio.mute();
                    btnToggleSound.textContent = '🔇 关闭';
                }
            }
        });
    }

    // Save select screen back button
    const btnSaveSelectBack = $('#btn-save-select-back');
    if (btnSaveSelectBack) {
        btnSaveSelectBack.addEventListener('click', () => {
            game.setState(STATES.MENU);
        });
    }

    // Plant select → start tower mode
    const btnConfirmPlants = $('#btn-confirm-plants');
    if (btnConfirmPlants) {
        btnConfirmPlants.addEventListener('click', () => {
            const selected = [...$$('.plant-grid-item.selected')].map((el) => el.dataset.plantId);
            const maxSlots = game.maxLoadoutSize || 10;

            // 初始植物选择特殊处理
            if (!game.introCompleted) {
                // 初始选择必须选满 maxSlots 株
                if (selected.length < maxSlots) {
                    alert(`请选择 ${maxSlots} 株植物！还需选择 ${maxSlots - selected.length} 株。`);
                    return;
                }
                const loadout = selected.slice(0, maxSlots);
                // 将选中的植物添加到 unlockedPlants（仅唯一ID）
                game.unlockedPlants = [...new Set([...game.unlockedPlants, ...loadout])];
                game.loadout = loadout;
                game.introCompleted = true;
                // 给予2个蓝色能源（在 _applyEventEffect 中已处理，但确保有）
                game.energy.blue = Math.max(game.energy.blue, 2);
                // 初始化实验室并添加植物到库存
                if (!game.lab) {
                    game.lab = new Lab(game);
                }
                for (const plantId of loadout) {
                    game.lab.addPlant(plantId, 1);
                }
                // 进入塔地图
                game.setState(STATES.TOWER_MAP);
                buildCardSlots(game);
                return;
            }

            // 正常战斗选植物
            if (selected.length === 0) {
                alert('请至少选择1种植物！');
                return;
            }
            const loadout = selected.slice(0, maxSlots);
            game.loadout = loadout;
            // 如果有待战斗节点，确认后开始战斗
            if (game.pendingBattleNode) {
                game.confirmPlantSelect();
            } else {
                // 否则启动塔模式
                game.startTowerMode(loadout);
                buildTowerMapUI(game);
            }
            buildCardSlots(game);
        });
    }

    // Cancel plant select → back to menu or tower map
    const btnCancelSelect = $('#btn-cancel-select');
    if (btnCancelSelect) {
        btnCancelSelect.addEventListener('click', () => {
            if (game.pendingBattleNode) {
                game.pendingBattleNode = null;
                game.setState(STATES.TOWER_MAP);
            } else {
                game.setState(STATES.MENU);
            }
        });
    }

    // Next level button
    const btnNextLevel = $('#btn-next-level');
    if (btnNextLevel) {
        btnNextLevel.addEventListener('click', () => {
            // 塔模式返回塔地图选择下一个节点
            if (game.mode === 'tower') {
                if (game.currentSaveSlot) {
                    game.saveManager.save(game.currentSaveSlot, game.saveSlotName || `存档 ${game.currentSaveSlot}`);
                }
                game.setState(STATES.TOWER_MAP);
                return;
            }
            // 冒险模式：进入下一关
            game.floor++;
            game.startGame(game.mode || 'adventure', game.sceneType, game.loadout);
            buildCardSlots(game);
        });
    }

    // Pause screen
    const btnResume = $('#btn-resume');
    if (btnResume) {
        btnResume.addEventListener('click', () => {
            game.resume();
        });
    }

    const btnQuitToMenu = $('#btn-quit-menu');
    if (btnQuitToMenu) {
        btnQuitToMenu.addEventListener('click', () => {
            // 返回主菜单前自动保存到当前槽位
            if (game.currentSaveSlot) {
                game.saveManager.save(game.currentSaveSlot, game.saveSlotName || `存档 ${game.currentSaveSlot}`);
            }
            game.plants = [];
            game.zombies = [];
            game.projectiles = [];
            game.suns = [];
            game.wavePhase = 'prep';
            game.running = true;
            game.setState(STATES.MENU);
        });
    }

    // Game over / victory
    const btnRetry = $('#btn-retry');
    if (btnRetry) {
        btnRetry.addEventListener('click', () => {
            game.startGame(game.mode || 'adventure', game.sceneType, game.loadout);
            buildCardSlots(game);
        });
    }

    const btnVictoryMenu = $('#btn-victory-menu');
    if (btnVictoryMenu) {
        btnVictoryMenu.addEventListener('click', () => {
            // 返回主菜单前自动保存
            if (game.currentSaveSlot) {
                game.saveManager.save(game.currentSaveSlot, game.saveSlotName || `存档 ${game.currentSaveSlot}`);
            }
            // 塔模式返回塔地图，冒险模式返回主菜单
            if (game.mode === 'tower') {
                // 检查当前层是否所有节点都已完成或不可达，若是则进入下一层
                const floorData = game.towerMap[game.currentFloor - 1];
                if (floorData) {
                    const hasAccessible = floorData.nodes.some(n => !n.completed && n.accessible);
                    if (!hasAccessible) {
                        game.nextFloor();
                    }
                }
                game.setState(STATES.TOWER_MAP);
            } else {
                game.setState(STATES.MENU);
            }
        });
    }

    // Game over 返回主菜单按钮
    const btnGameoverMenu = $('#btn-gameover-menu');
    if (btnGameoverMenu) {
        btnGameoverMenu.addEventListener('click', () => {
            // 返回主菜单前自动保存
            if (game.currentSaveSlot) {
                game.saveManager.save(game.currentSaveSlot, game.saveSlotName || `存档 ${game.currentSaveSlot}`);
            }
            // 塔模式返回塔地图，冒险模式返回主菜单
            if (game.mode === 'tower') {
                game.setState(STATES.TOWER_MAP);
            } else {
                game.setState(STATES.MENU);
            }
        });
    }

    // HUD buttons
    const btnPause = $('#btn-pause');
    if (btnPause) {
        btnPause.addEventListener('click', () => {
            game.pause();
        });
    }

    // 商店和实验室按钮已移除，改为通过塔地图的商店/休息节点进入

    // 铲子按钮
    const btnShovel = $('#btn-shovel');
    if (btnShovel) {
        btnShovel.addEventListener('click', () => {
            if (game.input) {
                game.input.shovelMode = !game.input.shovelMode;
                if (game.input.shovelMode) {
                    game.input.deselectPlant();
                    btnShovel.classList.add('active');
                } else {
                    btnShovel.classList.remove('active');
                }
            }
        });
    }

    const btnMute = $('#btn-mute');
    if (btnMute) {
        btnMute.addEventListener('click', () => {
            if (game.audio) {
                if (game.audio.isMuted()) {
                    game.audio.unmute();
                } else {
                    game.audio.mute();
                }
                btnMute.textContent = game.audio.isMuted() ? '🔇' : '🔊';
            }
        });
    }

    const btnEncyclopedia = $('#btn-encyclopedia');
    if (btnEncyclopedia) {
        btnEncyclopedia.addEventListener('click', () => {
            game.setState(STATES.ENCYCLOPEDIA);
        });
    }

    // Save manager back button
    const btnSaveManagerBack = $('#btn-save-manager-back');
    if (btnSaveManagerBack) {
        btnSaveManagerBack.addEventListener('click', () => {
            game.setState(STATES.SETTINGS);
        });
    }

    // Tower map back button (HTML中的静态按钮)
    const btnTowerBack = $('#btn-tower-back');
    if (btnTowerBack) {
        btnTowerBack.addEventListener('click', () => {
            // 返回主菜单前自动保存
            if (game.currentSaveSlot) {
                game.saveManager.save(game.currentSaveSlot, game.saveSlotName || `存档 ${game.currentSaveSlot}`);
            }
            game.setState(STATES.MENU);
        });
    }

    // Shop back - 返回到进入商店前的状态（塔地图/休息处/主菜单）
    const btnShopBack = $('#btn-shop-back');
    if (btnShopBack) {
        btnShopBack.addEventListener('click', () => {
            // 优先返回塔地图，其次休息处，最后主菜单
            const returnState = game.previousState || (game.mode === 'tower' ? STATES.TOWER_MAP : STATES.MENU);
            game.setState(returnState);
        });
    }

    // Lab back - 返回到进入实验室前的状态
    const btnLabBack = $('#btn-lab-back');
    if (btnLabBack) {
        btnLabBack.addEventListener('click', () => {
            const returnState = game.previousState || (game.mode === 'tower' ? STATES.TOWER_MAP : STATES.MENU);
            game.setState(returnState);
        });
    }

    // Encyclopedia back - 返回主菜单
    const btnEncyclopediaBack = $('#btn-encyclopedia-back');
    if (btnEncyclopediaBack) {
        btnEncyclopediaBack.addEventListener('click', () => {
            game.setState(STATES.MENU);
        });
    }

    // Inventory panel - 打开背包
    const btnInventory = $('#btn-inventory');
    if (btnInventory) {
        btnInventory.addEventListener('click', () => {
            const panel = $('#inventory-panel');
            if (panel) {
                buildInventoryUI(game);
                panel.classList.remove('hidden');
            }
        });
    }

    // Inventory panel - 关闭背包
    const btnInventoryClose = $('#btn-inventory-close');
    if (btnInventoryClose) {
        btnInventoryClose.addEventListener('click', () => {
            const panel = $('#inventory-panel');
            if (panel) panel.classList.add('hidden');
        });
    }

    // Inventory panel - 点击背景关闭
    const inventoryPanel = $('#inventory-panel');
    if (inventoryPanel) {
        inventoryPanel.addEventListener('click', (e) => {
            if (e.target === inventoryPanel) {
                inventoryPanel.classList.add('hidden');
            }
        });
    }
}

// ── Scene type icons ────────────────────────────────────────────
const SCENE_ICONS = {
    lawn: '🌿',
    pool: '🏊',
    roof: '🏠',
    fog_forest: '🌫️'
};

const SCENE_TYPES = ['lawn', 'pool', 'roof', 'fog_forest'];

// ── Build map selection (3 layers per run) ──────────────────────
function buildMapSelection(game) {
    const list = $('#map-layer-list');
    if (!list) return;
    list.innerHTML = '';

    // Generate 3 random scene types
    const layers = [];
    for (let i = 0; i < 3; i++) {
        const type = SCENE_TYPES[Math.floor(Math.random() * SCENE_TYPES.length)];
        layers.push(type);
    }
    game.mapLayers = layers;
    game.selectedMapLayer = -1;

    // Hide detail panel
    const detail = $('#map-layer-detail');
    if (detail) {
        detail.classList.add('hidden');
        detail.innerHTML = '';
    }

    // Disable confirm button until a layer is selected
    const btnConfirm = $('#btn-confirm-map');
    if (btnConfirm) btnConfirm.disabled = true;

    layers.forEach((sceneType, idx) => {
        const data = sceneData[sceneType];
        const card = document.createElement('div');
        card.className = 'map-layer-card';
        card.dataset.layerIndex = idx;

        const numEl = document.createElement('div');
        numEl.className = 'map-layer-number';
        numEl.textContent = `第 ${idx + 1} 层`;
        card.appendChild(numEl);

        const iconEl = document.createElement('span');
        iconEl.className = 'map-layer-icon';
        iconEl.textContent = SCENE_ICONS[sceneType] || '🌍';
        card.appendChild(iconEl);

        const nameEl = document.createElement('div');
        nameEl.className = 'map-layer-name';
        nameEl.textContent = data ? data.name_cn : sceneType;
        card.appendChild(nameEl);

        card.addEventListener('click', () => {
            // Highlight selected card
            $$('.map-layer-card').forEach((c) => c.classList.remove('selected'));
            card.classList.add('selected');
            card.classList.add('viewed');

            game.selectedMapLayer = idx;

            // Show detail panel
            showLayerDetail(game, sceneType, idx);

            // Enable confirm button
            if (btnConfirm) btnConfirm.disabled = false;
        });

        list.appendChild(card);
    });
}

function showLayerDetail(game, sceneType, layerIndex) {
    const detail = $('#map-layer-detail');
    if (!detail) return;

    const data = sceneData[sceneType];
    if (!data) return;

    detail.classList.remove('hidden');
    detail.innerHTML = `
        <h4>${SCENE_ICONS[sceneType]} 第 ${layerIndex + 1} 层 — ${data.name_cn}</h4>
        <div class="detail-row">
            <span class="detail-label">行数</span>
            <span class="detail-value">${data.rows}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">列数</span>
            <span class="detail-value">${data.cols}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">阳光倍率</span>
            <span class="detail-value">×${data.sunMultiplier}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">冷却倍率</span>
            <span class="detail-value">×${data.cooldownMultiplier}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">迷雾</span>
            <span class="detail-value">${data.hasFog ? '是' : '否'}</span>
        </div>
        ${data.waterRows.length > 0 ? `<div class="detail-row"><span class="detail-label">水行</span><span class="detail-value">${data.waterRows.map(r => r + 1).join(', ')}</span></div>` : ''}
        ${data.hasSlope ? `<div class="detail-row"><span class="detail-label">斜坡</span><span class="detail-value">是</span></div>` : ''}
    `;
}

// ── Build event UI ──────────────────────────────────────────────
function buildEventUI(game) {
    const titleEl = $('#event-title');
    const descEl = $('#event-description');
    const choicesEl = $('#event-choices');

    if (!titleEl || !descEl || !choicesEl) return;

    const event = game.currentEvent;
    if (!event || !event.eventType) {
        titleEl.textContent = '❓ 未知事件';
        descEl.textContent = '这里什么也没有...';
        choicesEl.innerHTML = '<button class="pvz-btn" id="btn-event-continue">继续前进</button>';
        const btn = $('#btn-event-continue');
        if (btn) btn.addEventListener('click', () => game.setState(STATES.TOWER_MAP));
        return;
    }

    const eventDesc = EVENT_DESCRIPTIONS[event.eventType];
    if (!eventDesc) {
        titleEl.textContent = '❓ 事件';
        descEl.textContent = '一个神秘的事件发生了...';
        choicesEl.innerHTML = '<button class="pvz-btn" id="btn-event-continue">继续前进</button>';
        const btn = $('#btn-event-continue');
        if (btn) btn.addEventListener('click', () => {
            event.completed = true;
            game.unlockNextNode();
            game.setState(STATES.TOWER_MAP);
        });
        return;
    }

    titleEl.textContent = `❓ ${eventDesc.title}`;
    descEl.textContent = eventDesc.description;

    choicesEl.innerHTML = '';
    eventDesc.choices.forEach((choice, idx) => {
        const btn = document.createElement('button');
        btn.className = 'pvz-btn event-choice-btn';
        btn.textContent = choice.text;
        btn.addEventListener('click', () => game.handleEventChoice(idx));
        choicesEl.appendChild(btn);
    });
}

// ── Build dialogue UI (初始对话 + 事件对话) ─────────────────────
function buildDialogueUI(game) {
    const titleEl = $('#dialogue-title');
    const speakerEl = $('#dialogue-speaker');
    const textEl = $('#dialogue-text');
    const choicesEl = $('#dialogue-choices');
    const continueBtn = $('#dialogue-continue');

    if (!titleEl || !textEl) return;

    const dialogue = game.currentDialogue;
    if (!dialogue) {
        // 没有对话内容，不显示空屏幕，返回塔地图
        if (game.state === STATES.INTRO_DIALOGUE) {
            game.introCompleted = true;
            game.setState(STATES.TOWER_MAP);
        } else {
            game.setState(STATES.TOWER_MAP);
        }
        return;
    }

    titleEl.textContent = dialogue.title || '对话';

    // 确保对话索引在有效范围内
    if (game.dialogueIndex < 0) game.dialogueIndex = 0;
    if (game.dialogueIndex >= dialogue.dialogues.length) {
        game.dialogueIndex = dialogue.dialogues.length - 1;
    }

    // 显示当前对话段
    const currentLine = dialogue.dialogues[game.dialogueIndex];
    if (currentLine) {
        if (speakerEl) speakerEl.textContent = currentLine.speaker || '';
        if (textEl) textEl.textContent = currentLine.text || '';
    }

    // 隐藏选项和继续按钮
    if (choicesEl) choicesEl.innerHTML = '';
    if (continueBtn) continueBtn.classList.add('hidden');

    // 检查是否还有下一段对话
    const isLastLine = game.dialogueIndex >= dialogue.dialogues.length - 1;

    if (isLastLine) {
        // 最后一段对话，显示选项
        if (choicesEl) {
            dialogue.choices.forEach((choice, idx) => {
                const btn = document.createElement('button');
                btn.className = 'pvz-btn dialogue-choice-btn';
                let text = choice.text;
                // 显示费用
                if (choice.cost) {
                    if (choice.cost.coins) {
                        text += ` (需要${choice.cost.coins}金币)`;
                        if (game.coins < choice.cost.coins) {
                            btn.disabled = true;
                            btn.classList.add('disabled');
                        }
                    }
                    if (choice.cost.hp) {
                        text += ` (需要${choice.cost.hp}HP)`;
                        if (game.baseHP < choice.cost.hp) {
                            btn.disabled = true;
                            btn.classList.add('disabled');
                        }
                    }
                    if (choice.cost.plants) {
                        text += ` (消耗${choice.cost.plants}株植物)`;
                    }
                }
                btn.textContent = text;
                btn.addEventListener('click', () => {
                    if (!btn.disabled) {
                        game.handleDialogueChoice(idx);
                        // 对话选择后重新构建UI（如果还在对话状态）
                        if (game.state === STATES.DIALOGUE || game.state === STATES.INTRO_DIALOGUE) {
                            buildDialogueUI(game);
                        }
                    }
                });
                choicesEl.appendChild(btn);
            });
        }
    } else {
        // 还有下一段对话，显示继续按钮
        if (continueBtn) {
            continueBtn.classList.remove('hidden');
            continueBtn.onclick = () => {
                game.advanceDialogue();
                buildDialogueUI(game);
            };
        }
    }
}

// ── Build achievements UI ───────────────────────────────────────
function buildAchievementsUI(game) {
    const container = $('#achievements-list');
    if (!container || !game.achievements) return;

    const achievements = game.achievements.getAllAchievements();
    const unlockedCount = game.achievements.getUnlockedCount();
    const totalCount = game.achievements.getTotalCount();

    // 更新标题统计
    const statsEl = $('#achievements-stats');
    if (statsEl) {
        statsEl.textContent = `${unlockedCount} / ${totalCount}`;
    }

    // 按分类分组
    const categories = {};
    for (const ach of achievements) {
        if (!categories[ach.category]) categories[ach.category] = [];
        categories[ach.category].push(ach);
    }

    const categoryNames = {
        battle: '⚔️ 战斗',
        collection: '📦 收集',
        progress: '🪜 进度',
        economy: '💰 经济',
        special: '⭐ 特殊'
    };

    container.innerHTML = '';
    for (const [cat, achs] of Object.entries(categories)) {
        const section = document.createElement('div');
        section.className = 'achievement-category';
        section.innerHTML = `<h3 class="achievement-category-title">${categoryNames[cat] || cat}</h3>`;

        const grid = document.createElement('div');
        grid.className = 'achievement-grid';

        for (const ach of achs) {
            const item = document.createElement('div');
            item.className = `achievement-item ${ach.unlocked ? 'unlocked' : 'locked'}`;
            const progressPct = Math.min(100, (ach.progress / ach.target) * 100);
            item.innerHTML = `
                <div class="achievement-icon">${ach.unlocked ? ach.icon : '🔒'}</div>
                <div class="achievement-info">
                    <div class="achievement-name">${ach.name_cn}</div>
                    <div class="achievement-desc">${ach.description}</div>
                    <div class="achievement-progress">
                        <div class="achievement-progress-bar" style="width: ${progressPct}%"></div>
                        <span class="achievement-progress-text">${ach.progress} / ${ach.target}</span>
                    </div>
                </div>
            `;
            grid.appendChild(item);
        }
        section.appendChild(grid);
        container.appendChild(section);
    }
}

// ── Build rest UI ───────────────────────────────────────────────
function buildRestUI(game) {
    const healAmount = Math.floor(game.maxBaseHP * 0.3);
    const healEl = $('#rest-heal-amount');
    if (healEl) healEl.textContent = healAmount;

    const forgeBtn = $('#btn-rest-forge');
    const labBtn = $('#btn-rest-lab');
    const continueBtn = $('#btn-rest-continue');
    const repairMowerBtn = $('#btn-repair-mower');

    // 修复小推车按钮：根据丢失行数和金币决定禁用状态
    if (repairMowerBtn) {
        const lostCount = (game.lostMowerRows && game.lostMowerRows.size) || 0;
        const canRepair = lostCount > 0 && (game.coins || 0) >= 50;
        repairMowerBtn.disabled = !canRepair;
        if (!canRepair) {
            repairMowerBtn.classList.add('disabled');
        } else {
            repairMowerBtn.classList.remove('disabled');
        }
        repairMowerBtn.onclick = () => {
            if ((game.coins || 0) < 50) {
                alert('金币不足，需要 50 金币');
                return;
            }
            if (!game.lostMowerRows || game.lostMowerRows.size === 0) {
                alert('没有需要修复的小推车');
                return;
            }
            game.coins = (game.coins || 0) - 50;
            game.lostMowerRows.clear();  // 清除所有丢失记录，下一关 startGame 会重新生成小推车
            alert('小推车已修复！');
            // 更新按钮状态
            buildRestUI(game);
            // 持久化修复结果
            if (game.saveManager && game.currentSaveSlot) {
                game.saveManager.save(game.currentSaveSlot, game.saveSlotName);
            }
        };
    }

    if (forgeBtn) {
        forgeBtn.onclick = () => {
            // 锻造功能：清洗杂交植物词条
            // 检查是否有杂交植物可清洗
            if (!game.hybridPlants || game.hybridPlants.length === 0) {
                alert('没有杂交植物可清洗。请先在杂交实验室中培育杂交植物。');
                return;
            }
            // 初始化实验室（用于锻造功能）
            if (!game.lab) {
                game.lab = new Lab(game);
                game.lab.initInventory();
            }
            // 列出可清洗的杂交植物
            const hybridList = game.hybridPlants.map((h, i) => `${i + 1}. ${h.name_cn}`).join('\n');
            const choice = prompt(`选择要清洗词条的杂交植物（输入序号）：\n${hybridList}\n\n清洗费用：5000金币\n当前金币：${game.coins || 0}`);
            if (choice === null) return;
            const idx = parseInt(choice, 10) - 1;
            if (isNaN(idx) || idx < 0 || idx >= game.hybridPlants.length) {
                alert('无效的选择');
                return;
            }
            const result = game.lab.cleanseHybrid(game.hybridPlants[idx]);
            if (result.error) {
                alert(result.error);
            } else {
                alert(result.message);
            }
        };
    }

    if (labBtn) {
        labBtn.onclick = () => {
            // 打开杂交实验室
            game.setState(STATES.LAB);
        };
    }

    if (continueBtn) {
        continueBtn.onclick = () => {
            // 节点完成已在 enterRest 中处理
            // 检查当前层是否所有节点都已完成或不可达，若是则进入下一层
            const beforeFloor = game.currentFloor;
            const floorData = game.towerMap[game.currentFloor - 1];
            if (floorData) {
                const hasAccessible = floorData.nodes.some(n => !n.completed && n.accessible);
                console.log('[REST-continue] currentFloor=', beforeFloor, 'hasAccessible=', hasAccessible,
                    'nodes=', floorData.nodes.map(n => ({ id: n.id, type: n.type, completed: n.completed, accessible: n.accessible, nextNodes: n.nextNodes })));
                if (!hasAccessible) {
                    // 当前层无可达节点，进入下一层
                    if (game.nextFloor()) {
                        console.log('[REST-continue] nextFloor 推进: ', beforeFloor, '->', game.currentFloor);
                        // 新层已有节点 accessible=true（由 completeNode 解锁）
                    } else {
                        // 已是最后一层，通关
                        game.setState(STATES.VICTORY);
                        return;
                    }
                }
            }
            game.setState(STATES.TOWER_MAP);
        };
    }
}

// ── Render victory screen (杀戮尖塔式关卡奖励) ───────────────────
function renderVictoryScreen(game) {
    const rewards = game._lastVictoryRewards || {};
    const plantDataMap = game.plantData || {};

    // 1. 金币显示
    const coinsEl = $('#victory-coins');
    if (coinsEl) coinsEl.textContent = rewards.coins || 0;
    const breakdownEl = $('#victory-coin-breakdown');
    if (breakdownEl && rewards.baseCoins !== undefined) {
        breakdownEl.textContent = `（基础 ${rewards.baseCoins} + 击杀 ${rewards.killCoins || 0}）`;
    }

    // 2. 遗物行（仅当有遗物时显示）
    const relicRow = $('#victory-relic-row');
    const relicNameEl = $('#victory-relic-name');
    const claimBtn = $('#btn-claim-relic');
    if (relicRow && relicNameEl) {
        if (rewards.relic) {
            relicRow.classList.remove('hidden');
            relicNameEl.textContent = rewards.relic.name_cn || rewards.relic.name_en || rewards.relic.id;
            // 重置按钮
            if (claimBtn) {
                claimBtn.textContent = '领取';
                claimBtn.disabled = false;
                claimBtn.onclick = () => {
                    if (game.claimVictoryRelic && game.claimVictoryRelic()) {
                        claimBtn.textContent = '已领取 ✓';
                        claimBtn.disabled = true;
                        relicNameEl.textContent += ' ✓';
                    }
                };
            }
        } else {
            relicRow.classList.add('hidden');
        }
    }

    // 3. 植物卡片 3 选 1
    const choicesContainer = $('#victory-card-choices');
    const hintEl = $('#victory-card-hint');
    if (choicesContainer) {
        choicesContainer.innerHTML = '';
        const choices = rewards.cardChoices || [];
        if (choices.length === 0) {
            // 没有可选卡片（已选择）
            if (hintEl) {
                hintEl.classList.remove('hidden');
                if (rewards.selectedPlant) {
                    const pd = plantDataMap[rewards.selectedPlant];
                    hintEl.textContent = `已选择：${pd ? pd.name_cn : rewards.selectedPlant}`;
                }
            }
        } else {
            if (hintEl) hintEl.classList.add('hidden');
            for (const plantId of choices) {
                const pd = plantDataMap[plantId] || {};
                const card = document.createElement('div');
                card.className = 'victory-card';
                card.dataset.plantId = plantId;
                card.innerHTML = `
                    <div class="card-icon">${pd.icon || '🌱'}</div>
                    <div class="card-name">${pd.name_cn || plantId}</div>
                    <div class="card-cost">${pd.cost || 0} 阳光</div>
                    <div class="card-desc">${pd.special || ''}</div>
                `;
                card.addEventListener('click', () => {
                    if (card.classList.contains('disabled') || card.classList.contains('selected')) return;
                    if (game.selectVictoryPlant && game.selectVictoryPlant(plantId)) {
                        // 标记选中并禁用其他卡片
                        choicesContainer.querySelectorAll('.victory-card').forEach(c => {
                            if (c === card) {
                                c.classList.add('selected');
                            } else {
                                c.classList.add('disabled');
                            }
                        });
                        if (hintEl) {
                            hintEl.classList.remove('hidden');
                            hintEl.textContent = `已选择：${pd.name_cn || plantId}`;
                        }
                    }
                });
                choicesContainer.appendChild(card);
            }
        }
    }
}

// ── Build tower map UI (杀戮之塔模式) ─────────────────────────────
function buildTowerMapUI(game) {
    const container = $('#tower-map-container');
    if (!container) return;

    container.innerHTML = '';
    container.classList.remove('hidden');

    // 保障：确保当前层至少有一个 accessible 节点（防止用户卡住）
    // 场景：旧存档节点 accessible 字段缺失、或 completeNode 后下一层未正确解锁
    // 注意：使用块级作用域，避免与下方 const currentFloorData 冲突
    {
        let floorDataSafe = game.towerMap[game.currentFloor - 1];
        if (floorDataSafe) {
            const hasUncompleted = floorDataSafe.nodes.some(n => !n.completed);
            // 如果当前层所有节点都已完成，自动进入下一层
            if (!hasUncompleted) {
                const before = game.currentFloor;
                if (game.nextFloor()) {
                    console.warn('[buildTowerMapUI] 当前层所有节点已完成，自动进入下一层: ', before, '->', game.currentFloor);
                    floorDataSafe = game.towerMap[game.currentFloor - 1];
                } else {
                    // 已是最后一层，显示通关
                    console.warn('[buildTowerMapUI] 已是最后一层且全部完成');
                }
            }
            // 检查新层是否有 accessible 节点
            if (floorDataSafe) {
                const hasAccessible = floorDataSafe.nodes.some(n => !n.completed && n.accessible);
                const hasUncompletedNow = floorDataSafe.nodes.some(n => !n.completed);
                if (!hasAccessible && hasUncompletedNow) {
                    console.warn('[buildTowerMapUI] 当前层无 accessible 节点但有未完成节点，自动解锁以防止卡住。floor=', game.currentFloor,
                        'nodes=', floorDataSafe.nodes.map(n => ({ id: n.id, type: n.type, completed: n.completed, accessible: n.accessible, nextNodes: n.nextNodes })));
                    // 解锁所有未完成节点
                    floorDataSafe.nodes.forEach(n => {
                        if (!n.completed) n.accessible = true;
                    });
                }
            }
        }
    }

    const currentFloor = game.currentFloor;
    const totalFloors = game.maxFloors;

    // 创建地图画布
    const mapCanvas = document.createElement('div');
    mapCanvas.className = 'tower-map-canvas';
    container.appendChild(mapCanvas);

    // 标题和状态
    const header = document.createElement('div');
    header.className = 'tower-map-header';
    header.innerHTML = `
        <div class="tower-title">🗼 杀戮之塔</div>
        <div class="tower-floor-info">第 ${currentFloor} / ${totalFloors} 层</div>
        <div class="tower-hp-display">
            <span class="hp-icon">❤️</span>
            <span class="hp-value">${game.baseHP} / ${game.maxBaseHP}</span>
        </div>
    `;
    mapCanvas.appendChild(header);

    // oracle_eye 遗物：预览下一层节点（仅当玩家持有该遗物时显示）
    const preview = game.getNextFloorPreview ? game.getNextFloorPreview() : null;
    if (preview && preview.nodes && preview.nodes.length > 0) {
        const previewPanel = document.createElement('div');
        previewPanel.className = 'oracle-preview-panel';
        const nodeList = preview.nodes.map(n => {
            const info = NODE_INFO[n.type] || { icon: '❓', name: '未知' };
            return `<span class="oracle-node-chip"><span class="oracle-node-icon">${info.icon}</span><span class="oracle-node-name">${info.name}</span></span>`;
        }).join('');
        previewPanel.innerHTML = `
            <div class="oracle-preview-title">
                <span class="oracle-eye-icon">👁️</span>
                <span>神谕之眼 · 第 ${preview.floor} 层预览</span>
            </div>
            <div class="oracle-node-list">${nodeList}</div>
        `;
        mapCanvas.appendChild(previewPanel);
    }

    // 绘制地图节点 - 从高到低显示（F10在顶部，F1在底部）
    const mapBody = document.createElement('div');
    mapBody.className = 'tower-map-body';
    mapCanvas.appendChild(mapBody);

    // 显示所有楼层，从高到低
    const maxDisplayFloor = Math.min(currentFloor + 2, totalFloors);
    for (let floorIdx = maxDisplayFloor - 1; floorIdx >= 0; floorIdx--) {
        const floorData = game.towerMap[floorIdx];
        if (!floorData) continue;

        const floorRow = document.createElement('div');
        floorRow.className = 'tower-floor-row';
        if (floorIdx === currentFloor - 1) {
            floorRow.classList.add('current-floor');
        } else if (floorIdx < currentFloor - 1) {
            floorRow.classList.add('completed-floor');
        } else {
            floorRow.classList.add('future-floor');
        }

        // 楼层标签
        const floorLabel = document.createElement('div');
        floorLabel.className = 'floor-label';
        floorLabel.textContent = `F${floorIdx + 1}`;
        floorRow.appendChild(floorLabel);

        // 楼层特殊僵尸提示（特性标签，仅对当前及未来楼层显示）
        if (floorIdx >= currentFloor - 1) {
          const hints = waveData.getFloorZombieHints(floorIdx + 1);
          if (hints && hints.length > 0) {
            const hintsEl = document.createElement('div');
            hintsEl.className = 'floor-zombie-hints';
            // 只显示前 4 个标签，避免过多
            const displayHints = hints.slice(0, 4);
            hintsEl.innerHTML = displayHints.map(h => `<span class="zombie-hint-tag">${h}</span>`).join('');
            floorRow.appendChild(hintsEl);
          }
        }

        // 节点容器
        const nodesContainer = document.createElement('div');
        nodesContainer.className = 'floor-nodes';

        floorData.nodes.forEach((node, nodeIdx) => {
            // 节点
            const nodeEl = document.createElement('div');
            const isCurrentFloor = floorIdx === currentFloor - 1;

            // 判断节点是否与上一层已完成节点相连（用于显示路径可达性）
            const isReachableFromPrev = floorIdx === 0 ? true : (() => {
                const prevFloor = game.towerMap[floorIdx - 1];
                if (!prevFloor) return false;
                return prevFloor.nodes.some(prevNode =>
                    prevNode.completed && prevNode.nextNodes.includes(node.id)
                );
            })();

            nodeEl.className = 'tower-node';
            nodeEl.dataset.nodeId = node.id;
            nodeEl.dataset.floorIdx = floorIdx;
            nodeEl.dataset.nodeIdx = nodeIdx;

            // 使用 accessible 字段判断节点状态（杀戮之塔风格）
            let nodeClass = 'locked';
            if (node.completed) {
                nodeClass = 'completed';
                nodeEl.classList.add('completed');
            } else if (node.accessible && isCurrentFloor) {
                nodeClass = 'available';
                nodeEl.classList.add('available');
            } else if (isReachableFromPrev && floorIdx === currentFloor) {
                // 下一层中与当前已完成节点连接的节点，标记为"即将可达"
                nodeClass = 'next-reachable';
                nodeEl.classList.add('next-reachable');
            } else if (node.accessible && floorIdx >= currentFloor - 1) {
                // 已解锁但非当前层（未来层），标记为 available 但不可点击
                nodeClass = 'available';
                nodeEl.classList.add('available');
            } else {
                nodeEl.classList.add('locked');
            }
            // 调试日志：仅当前层和下一层打印
            if (floorIdx === currentFloor - 1 || floorIdx === currentFloor) {
                console.log(`[node] F${floorIdx + 1} #${nodeIdx} ${node.id} type=${node.type} completed=${node.completed} accessible=${node.accessible} isCurrentFloor=${isCurrentFloor} isReachableFromPrev=${isReachableFromPrev} → ${nodeClass}`);
            }

            const nodeInfo = NODE_INFO[node.type];
            const icon = nodeInfo ? nodeInfo.icon : '❓';
            const name = nodeInfo ? nodeInfo.name : '未知';
            const color = nodeInfo ? nodeInfo.color : '#757575';

            nodeEl.innerHTML = `
                <div class="node-circle" style="background: ${color}">
                    <span class="node-icon">${icon}</span>
                </div>
                <div class="node-label">${name}</div>
                ${node.completed ? '<div class="node-check">✓</div>' : ''}
                ${!node.completed && !(node.accessible && isCurrentFloor) && !isReachableFromPrev ? '<div class="node-lock">🔒</div>' : ''}
            `;

            // 只有当前层的可访问节点可以点击
            if (!node.completed && node.accessible && isCurrentFloor) {
                nodeEl.classList.add('clickable');
                nodeEl.addEventListener('click', () => {
                    game.enterNode(node.id);
                });
            }

            nodesContainer.appendChild(nodeEl);
        });

        floorRow.appendChild(nodesContainer);
        mapBody.appendChild(floorRow);

        // 楼层间连接线（SVG 精确绘制，高亮已完成节点的可达路径）
        // 注意：连线容器必须与 .floor-nodes 完全对齐，否则百分比坐标会错位
        if (floorIdx > 0) {
            const floorConnector = document.createElement('div');
            floorConnector.className = 'floor-connector';
            const prevFloor = game.towerMap[floorIdx - 1];
            if (prevFloor) {
                const prevNodeCount = prevFloor.nodes.length;
                const nextNodeCount = floorData.nodes.length;
                // 节点中心百分比：节点在 floor-nodes 中均匀分布
                // floor-nodes 用 justify-content: center，节点间用 gap: 0
                // 当节点数为 n 时，第 i 个节点中心位于 (i + 0.5) / n
                const prevX = (i, n) => ((i + 0.5) / n) * 100;
                const nextX = (i, n) => ((i + 0.5) / n) * 100;

                const lines = [];
                floorData.nodes.forEach((node, nextIdx) => {
                    prevFloor.nodes.forEach((prevNode, prevIdx) => {
                        if (prevNode.nextNodes && prevNode.nextNodes.includes(node.id)) {
                            // 已完成节点的连线高亮，否则暗色
                            const highlight = prevNode.completed && (node.accessible || node.completed);
                            const stroke = highlight ? 'rgba(120, 220, 120, 0.85)' : 'rgba(160, 140, 200, 0.35)';
                            const sw = highlight ? 3 : 2;
                            const x1 = prevX(prevIdx, prevNodeCount);
                            const x2 = nextX(nextIdx, nextNodeCount);
                            lines.push(`<line x1="${x1}" y1="2" x2="${x2}" y2="98" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" ${highlight ? 'class="path-line-active"' : ''} />`);
                        }
                    });
                });
                const svg = `<svg class="connector-svg" viewBox="0 0 100 100" preserveAspectRatio="none"><g>${lines.join('')}</g></svg>`;
                floorConnector.innerHTML = svg;
            }
            mapBody.appendChild(floorConnector);
        }
    }

    // 杀戮之塔风格：无需"下一层"按钮，完成节点后自动进入下一层
    // 检查是否通关（Boss层完成）
    const currentFloorData = game.towerMap[currentFloor - 1];
    if (currentFloorData && currentFloorData.isBossFloor) {
        const bossNode = currentFloorData.nodes.find(n => n.type === 'boss');
        if (bossNode && bossNode.completed) {
            const victoryMsg = document.createElement('div');
            victoryMsg.className = 'tower-victory-msg';
            victoryMsg.textContent = '🎉 恭喜通关！';
            mapCanvas.appendChild(victoryMsg);
        }
    }

    // 返回按钮
    const backBtn = document.createElement('button');
    backBtn.className = 'tower-back-btn pvz-btn pvz-btn-secondary';
    backBtn.textContent = '↩ 返回主菜单';
    backBtn.addEventListener('click', () => {
        // 返回主菜单前自动保存
        if (game.currentSaveSlot) {
            game.saveManager.save(game.currentSaveSlot, game.saveSlotName || `存档 ${game.currentSaveSlot}`);
        }
        game.setState(STATES.MENU);
    });
    mapCanvas.appendChild(backBtn);
}

// ── Build plant selection grid ──────────────────────────────────
function buildPlantSelectGrid(game) {
    const grid = $('#plant-select-grid');
    if (!grid) return;
    grid.innerHTML = '';

    // 更新最大槽位显示
    const maxSlotsEl = $('#max-slots');
    if (maxSlotsEl) {
        maxSlotsEl.textContent = game.maxLoadoutSize || 10;
    }

    // 判断是否为初始植物选择（开局选10株）
    const isInitialSelect = !game.introCompleted;
    // 初始选择使用 maxLoadoutSize（10株），战斗选择使用 cardSlots（6槽，可升级到10）
    const maxSlots = isInitialSelect ? (game.maxLoadoutSize || 10) : (game.cardSlots || 6);

    // 更新提示文字
    const promptEl = $('#plant-select-prompt');
    const countEl = $('#plant-select-count');
    if (isInitialSelect) {
        if (maxSlotsEl) {
            maxSlotsEl.textContent = maxSlots;
        }
        if (promptEl) {
            promptEl.textContent = `从所有基础植物中选择 ${maxSlots} 株作为初始阵容`;
        }
        if (countEl) {
            countEl.textContent = `已选: 0 / ${maxSlots}`;
            countEl.style.display = '';
        }
    } else {
        if (maxSlotsEl) {
            maxSlotsEl.textContent = maxSlots;
        }
        if (promptEl) {
            promptEl.textContent = `选择最多 ${maxSlots} 株植物出战（卡槽数量）`;
        }
        if (countEl) {
            countEl.textContent = `已选: 0 / ${maxSlots}`;
            countEl.style.display = '';
        }
    }

    // 获取要显示的植物列表
    let plantsToShow;
    if (isInitialSelect) {
        // 初始选择：只显示基础植物（unlock_cost=0，排除特殊植物和杂交植物）
        plantsToShow = Object.keys(plantData).filter(id => {
            const data = plantData[id];
            return data && !data.is_special && !data.is_hybrid && (data.unlock_cost || 0) === 0;
        });
    } else {
        // 正常战斗选植物：显示已拥有的植物（过滤掉杂交消耗后库存为0的基础植物）
        const lab = game.lab;
        const plantInventory = lab ? lab.plantInventory : {};
        plantsToShow = (game.unlockedPlants || []).filter(plantId => {
            const data = (game.plantData && game.plantData[plantId]) || plantData[plantId];
            if (!data) return false;
            // 基础植物需要检查库存
            if (!data.is_hybrid && !data.is_special && data.can_hybridize !== false) {
                const count = plantInventory[plantId];
                if (count !== undefined && count <= 0) return false;
            }
            return true;
        });
    }

    // 更新选中计数的函数
    function updateSelectedCount() {
        const selected = $$('.plant-grid-item.selected');
        if (countEl) {
            countEl.textContent = `已选: ${selected.length} / ${maxSlots}`;
            // 更新样式
            if (isInitialSelect) {
                if (selected.length >= maxSlots) {
                    countEl.classList.remove('incomplete');
                    countEl.classList.add('complete');
                } else {
                    countEl.classList.remove('complete');
                    countEl.classList.add('incomplete');
                }
            } else {
                // 战斗选择：超过卡槽数量时标红
                if (selected.length > maxSlots) {
                    countEl.classList.remove('complete');
                    countEl.classList.add('incomplete');
                } else if (selected.length >= maxSlots) {
                    countEl.classList.remove('incomplete');
                    countEl.classList.add('complete');
                } else {
                    countEl.classList.remove('complete', 'incomplete');
                }
            }
        }
        // 初始选择时，未选满禁用确认按钮
        if (isInitialSelect) {
            const btnConfirm = $('#btn-confirm-plants');
            if (btnConfirm) {
                if (selected.length < maxSlots) {
                    btnConfirm.disabled = true;
                    btnConfirm.classList.add('disabled');
                    btnConfirm.textContent = `还需选择 ${maxSlots - selected.length} 株`;
                } else {
                    btnConfirm.disabled = false;
                    btnConfirm.classList.remove('disabled');
                    btnConfirm.textContent = '✅ 确认出战';
                }
            }
        } else {
            // 战斗选择：超过卡槽数量时禁用确认按钮
            const btnConfirm = $('#btn-confirm-plants');
            if (btnConfirm) {
                if (selected.length > maxSlots || selected.length === 0) {
                    btnConfirm.disabled = true;
                    btnConfirm.classList.add('disabled');
                    btnConfirm.textContent = selected.length > maxSlots ? `超出卡槽数量 ${maxSlots}` : '请选择植物';
                } else {
                    btnConfirm.disabled = false;
                    btnConfirm.classList.remove('disabled');
                    btnConfirm.textContent = '✅ 确认出战';
                }
            }
        }
    }

    // 显示植物
    plantsToShow.forEach((plantId) => {
        // 使用 game.plantData 而非导入的 plantData，以支持动态注册的杂交植物
        const data = (game.plantData && game.plantData[plantId]) || plantData[plantId];
        if (!data) return;  // 跳过没有数据的植物（如旧版本残留）

        const item = document.createElement('div');
        item.className = 'plant-grid-item';
        item.dataset.plantId = plantId;

        // 杂交植物添加特殊样式
        if (data.is_hybrid) {
            item.classList.add('hybrid-plant');
            if (data.isRare) {
                item.classList.add('rare-hybrid');
            }
        }

        // 特殊植物添加标记
        if (data.is_special) {
            item.classList.add('special-plant');
        }

        const nameEl = document.createElement('div');
        nameEl.className = 'plant-name';
        nameEl.textContent = data.name_cn || plantId;
        item.appendChild(nameEl);

        const costEl = document.createElement('div');
        costEl.className = 'plant-cost';
        costEl.textContent = `☀${data.cost || 0}`;
        item.appendChild(costEl);

        // 杂交植物显示父本信息
        if (data.is_hybrid && data.parents) {
            const parentEl = document.createElement('div');
            parentEl.className = 'plant-parents';
            const parentNames = data.parents.map(pid => {
                const pd = (game.plantData && game.plantData[pid]) || plantData[pid];
                return pd ? pd.name_cn : pid;
            });
            parentEl.textContent = `杂交: ${parentNames.join(' + ')}`;
            item.appendChild(parentEl);
        }

        // 特殊植物显示来源
        if (data.is_special && data.source) {
            const sourceEl = document.createElement('div');
            sourceEl.className = 'plant-source';
            sourceEl.textContent = `[${data.source}]`;
            item.appendChild(sourceEl);
        }

        // Pre-select if in loadout
        if (game.loadout.includes(plantId)) {
            item.classList.add('selected');
        }

        item.addEventListener('click', () => {
            const selected = $$('.plant-grid-item.selected');
            if (item.classList.contains('selected')) {
                item.classList.remove('selected');
                // 移除选中序号
                const badge = item.querySelector('.select-badge');
                if (badge) badge.remove();
            } else if (selected.length < maxSlots) {
                item.classList.add('selected');
                // 添加选中序号
                const badge = document.createElement('div');
                badge.className = 'select-badge';
                badge.textContent = selected.length + 1;
                item.appendChild(badge);
            } else {
                // 已选满，不允许多选（初始和战斗选择都限制）
                return;
            }
            // 重新编号所有选中项
            const allSelected = $$('.plant-grid-item.selected');
            allSelected.forEach((el, idx) => {
                let badge = el.querySelector('.select-badge');
                if (!badge) {
                    badge = document.createElement('div');
                    badge.className = 'select-badge';
                    el.appendChild(badge);
                }
                badge.textContent = idx + 1;
            });
            updateSelectedCount();
        });

        grid.appendChild(item);
    });

    // 初始更新计数
    updateSelectedCount();

    // 填充僵尸类型预览（不显示数量，仅展示可能遭遇的类型与特性标签）
    if (!isInitialSelect) {
        buildZombiePreview(game);
        const previewSection = $('#zombie-preview-section');
        if (previewSection) previewSection.classList.remove('hidden');
    } else {
        // 初始选择时隐藏僵尸预览
        const previewSection = $('#zombie-preview-section');
        if (previewSection) previewSection.classList.add('hidden');
    }
}

// 构建选植物界面的僵尸类型预览
function buildZombiePreview(game) {
    const listEl = $('#zombie-preview-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    const floor = game.currentFloor || 1;
    const previewTypes = waveData.getFloorZombiePreview(floor);
    if (!previewTypes || previewTypes.length === 0) {
        listEl.innerHTML = '<div class="zombie-preview-empty">暂无情报</div>';
        return;
    }

    // Boss 楼层额外提示
    const bossId = waveData.getBossForFloor(floor);
    if (bossId && zombieData.bosses && zombieData.bosses[bossId]) {
        previewTypes.unshift(bossId);
    }

    const seen = new Set();
    for (const type of previewTypes) {
        if (seen.has(type)) continue;
        seen.add(type);
        // 查找 torsos 或 bosses
        const data = zombieData.torsos[type] || (zombieData.bosses && zombieData.bosses[type]);
        if (!data) continue;

        const item = document.createElement('div');
        item.className = 'zombie-preview-item';
        // 按分类着色边框
        const cat = data.category || 'basic';
        item.dataset.category = cat;

        const nameEl = document.createElement('div');
        nameEl.className = 'zpv-name';
        nameEl.textContent = data.name_cn || type;
        item.appendChild(nameEl);

        // 特性标签（counterTags）
        const tags = data.counterTags || [];
        if (tags.length > 0) {
            const tagsEl = document.createElement('div');
            tagsEl.className = 'zpv-tags';
            tags.forEach(t => {
                const tag = document.createElement('span');
                tag.className = 'zpv-tag';
                tag.textContent = t;
                tagsEl.appendChild(tag);
            });
            item.appendChild(tagsEl);
        }

        // 弱点提示（简化为图标）
        const weaknesses = data.weaknesses || [];
        if (weaknesses.length > 0) {
            const weakEl = document.createElement('div');
            weakEl.className = 'zpv-weak';
            const weakIcons = weaknesses.map(w => {
                const info = ZOMBIE_WEAKNESS_INFO[w];
                return info ? info.icon : '⚠';
            });
            weakEl.textContent = '克:' + weakIcons.join(' ');
            item.appendChild(weakEl);
        }

        listEl.appendChild(item);
    }
}

// ── Encyclopedia helpers ────────────────────────────────────────
const ENCYCLOPEDIA_CATEGORY_COLORS = {
    attack_ranged:  '#E53935',
    attack_melee:   '#E53935',
    defense:        '#1E88E5',
    production:     '#FFD600',
    explosive:      '#FF9800',
    support:        '#4CAF50',
    control:        '#7B1FA2',
    special:        '#7B1FA2'
};

function getPlantCategoryColor(category) {
    return ENCYCLOPEDIA_CATEGORY_COLORS[category] || '#BDBDBD';
}

function buildEncyclopediaUI(tabName) {
    const list = $('#encyclopedia-list');
    const detail = $('#encyclopedia-detail');
    if (!list) return;
    list.innerHTML = '';
    if (detail) detail.textContent = '点击条目查看详情';

    if (tabName === 'plants') {
        buildEncyclopediaPlants(list, detail);
    } else if (tabName === 'zombies') {
        buildEncyclopediaZombies(list, detail);
    } else if (tabName === 'hybrids') {
        buildEncyclopediaHybrids(list, detail);
    }
}

function buildEncyclopediaPlants(list, detail) {
    // 使用 window.pvzGame.plantData 以包含杂交植物，回退到静态 plantData
    const game = window.pvzGame;
    const dataSource = (game && game.plantData) ? game.plantData : plantData;
    const entries = Object.values(dataSource);
    entries.forEach((plant) => {
        const entry = document.createElement('div');
        entry.className = 'encyclopedia-entry';
        const color = getPlantCategoryColor(plant.category);
        entry.style.borderLeftColor = color;
        entry.style.borderLeftWidth = '3px';

        const nameEl = document.createElement('div');
        nameEl.className = 'ency-entry-name';
        nameEl.textContent = plant.name_cn;
        entry.appendChild(nameEl);

        const costEl = document.createElement('div');
        costEl.className = 'ency-entry-cost';
        costEl.textContent = `☀${plant.cost}`;
        entry.appendChild(costEl);

        entry.addEventListener('click', () => {
            $$('.encyclopedia-entry.selected').forEach((el) => el.classList.remove('selected'));
            entry.classList.add('selected');
            if (detail) {
                detail.innerHTML = `
                    <div class="ency-detail-title" style="color:${color}">${plant.name_cn} (${plant.name_en})</div>
                    <div class="ency-detail-row"><span class="ency-label">类别:</span> ${formatCategoryName(plant.category)}</div>
                    <div class="ency-detail-row"><span class="ency-label">阳光:</span> ☀${plant.cost}</div>
                    <div class="ency-detail-row"><span class="ency-label">生命:</span> ${plant.hp}</div>
                    <div class="ency-detail-row"><span class="ency-label">伤害:</span> ${plant.damage || '无'}</div>
                    <div class="ency-detail-row"><span class="ency-label">攻速:</span> ${plant.attack_speed ? plant.attack_speed + 's' : '无'}</div>
                    <div class="ency-detail-row"><span class="ency-label">射程:</span> ${plant.range || '无'}</div>
                    <div class="ency-detail-row"><span class="ency-label">冷却:</span> ${plant.cooldown}s</div>
                    <div class="ency-detail-row"><span class="ency-label">特性:</span> ${plant.special || '无'}</div>
                    <div class="ency-detail-row"><span class="ency-label">基因池:</span> ${plant.gene_pool}</div>
                    ${plant.is_night ? '<div class="ency-detail-row"><span class="ency-label">环境:</span> 🌙 夜间植物</div>' : ''}
                    ${plant.is_aquatic ? '<div class="ency-detail-row"><span class="ency-label">环境:</span> 🌊 水生植物</div>' : ''}
                `;
            }
        });

        list.appendChild(entry);
    });
}

function formatCategoryName(category) {
    const map = {
        attack_ranged: '🏹 远程攻击',
        attack_melee: '⚔️ 近战攻击',
        defense: '🛡️ 防御',
        production: '☀️ 产能',
        explosive: '💥 爆炸',
        support: '🔧 辅助',
        control: '🎯 控制',
        special: '⭐ 特殊'
    };
    return map[category] || category;
}

function buildEncyclopediaZombies(list, detail) {
    // Torsos section
    const torsos = zombieData.torsos || {};
    Object.values(torsos).forEach((torso) => {
        const entry = document.createElement('div');
        entry.className = 'encyclopedia-entry enc-zombie-torso';
        entry.style.borderLeftColor = '#E53935';
        entry.style.borderLeftWidth = '3px';

        const nameEl = document.createElement('div');
        nameEl.className = 'ency-entry-name';
        nameEl.textContent = torso.name_cn;
        entry.appendChild(nameEl);

        const typeEl = document.createElement('div');
        typeEl.className = 'ency-entry-type';
        typeEl.textContent = '躯体';
        entry.appendChild(typeEl);

        entry.addEventListener('click', () => {
            $$('.encyclopedia-entry.selected').forEach((el) => el.classList.remove('selected'));
            entry.classList.add('selected');
            if (detail) {
                detail.innerHTML = `
                    <div class="ency-detail-title" style="color:#E53935">${torso.name_cn} (${torso.name_en})</div>
                    <div class="ency-detail-row"><span class="ency-label">类型:</span> 僵尸躯体</div>
                    <div class="ency-detail-row"><span class="ency-label">生命:</span> ${torso.hp}</div>
                    <div class="ency-detail-row"><span class="ency-label">速度:</span> ${torso.speed}x</div>
                    ${torso.bonusHp ? `<div class="ency-detail-row"><span class="ency-label">额外生命:</span> +${torso.bonusHp}</div>` : ''}
                `;
            }
        });

        list.appendChild(entry);
    });

    // Heads section
    const heads = zombieData.heads || {};
    Object.values(heads).forEach((head) => {
        const entry = document.createElement('div');
        entry.className = 'encyclopedia-entry enc-zombie-head';
        entry.style.borderLeftColor = '#FF9800';
        entry.style.borderLeftWidth = '3px';

        const nameEl = document.createElement('div');
        nameEl.className = 'ency-entry-name';
        nameEl.textContent = head.name_cn;
        entry.appendChild(nameEl);

        const typeEl = document.createElement('div');
        typeEl.className = 'ency-entry-type';
        typeEl.textContent = '头部';
        entry.appendChild(typeEl);

        entry.addEventListener('click', () => {
            $$('.encyclopedia-entry.selected').forEach((el) => el.classList.remove('selected'));
            entry.classList.add('selected');
            if (detail) {
                detail.innerHTML = `
                    <div class="ency-detail-title" style="color:#FF9800">${head.name_cn} (${head.name_en})</div>
                    <div class="ency-detail-row"><span class="ency-label">类型:</span> 僵尸头部</div>
                    <div class="ency-detail-row"><span class="ency-label">能力:</span> ${head.ability}</div>
                    <div class="ency-detail-row"><span class="ency-label">描述:</span> ${head.description}</div>
                `;
            }
        });

        list.appendChild(entry);
    });

    // Effects section
    const effects = zombieData.effects || {};
    Object.values(effects).forEach((effect) => {
        const entry = document.createElement('div');
        entry.className = 'encyclopedia-entry enc-zombie-effect';
        entry.style.borderLeftColor = '#7B1FA2';
        entry.style.borderLeftWidth = '3px';

        const nameEl = document.createElement('div');
        nameEl.className = 'ency-entry-name';
        nameEl.textContent = effect.name_cn;
        entry.appendChild(nameEl);

        const typeEl = document.createElement('div');
        typeEl.className = 'ency-entry-type';
        typeEl.textContent = '效果';
        entry.appendChild(typeEl);

        entry.addEventListener('click', () => {
            $$('.encyclopedia-entry.selected').forEach((el) => el.classList.remove('selected'));
            entry.classList.add('selected');
            if (detail) {
                detail.innerHTML = `
                    <div class="ency-detail-title" style="color:#7B1FA2">${effect.name_cn} (${effect.name_en})</div>
                    <div class="ency-detail-row"><span class="ency-label">类型:</span> 僵尸效果</div>
                    <div class="ency-detail-row"><span class="ency-label">触发:</span> ${effect.trigger}</div>
                    <div class="ency-detail-row"><span class="ency-label">描述:</span> ${effect.description}</div>
                `;
            }
        });

        list.appendChild(entry);
    });

    // Bosses section
    const bosses = zombieData.bosses || {};
    Object.values(bosses).forEach((boss) => {
        const entry = document.createElement('div');
        entry.className = 'encyclopedia-entry enc-zombie-boss';
        entry.style.borderLeftColor = '#B71C1C';
        entry.style.borderLeftWidth = '3px';

        const nameEl = document.createElement('div');
        nameEl.className = 'ency-entry-name';
        nameEl.textContent = boss.name_cn;
        entry.appendChild(nameEl);

        const typeEl = document.createElement('div');
        typeEl.className = 'ency-entry-type';
        typeEl.textContent = 'BOSS';
        entry.appendChild(typeEl);

        entry.addEventListener('click', () => {
            $$('.encyclopedia-entry.selected').forEach((el) => el.classList.remove('selected'));
            entry.classList.add('selected');
            if (detail) {
                const phasesHtml = (boss.phases || []).map((p) =>
                    `<div class="ency-detail-row ency-phase"><span class="ency-label">[${(p.threshold * 100).toFixed(0)}%]</span> ${p.name_cn} — ${p.description}</div>`
                ).join('');
                detail.innerHTML = `
                    <div class="ency-detail-title" style="color:#B71C1C">${boss.name_cn} (${boss.name_en})</div>
                    <div class="ency-detail-row"><span class="ency-label">类型:</span> BOSS</div>
                    <div class="ency-detail-row"><span class="ency-label">生命:</span> ${boss.hp}</div>
                    <div class="ency-detail-row"><span class="ency-label">阶段数:</span> ${boss.phases ? boss.phases.length : 0}</div>
                    <div class="ency-phases-label">阶段详情:</div>
                    ${phasesHtml}
                `;
            }
        });

        list.appendChild(entry);
    });
}

function buildEncyclopediaHybrids(list, detail) {
    // Gene Pools section
    const genePools = hybridData.genePools || {};
    Object.values(genePools).forEach((gene) => {
        const entry = document.createElement('div');
        entry.className = 'encyclopedia-entry enc-hybrid-gene';
        entry.style.borderLeftColor = '#4CAF50';
        entry.style.borderLeftWidth = '3px';

        const nameEl = document.createElement('div');
        nameEl.className = 'ency-entry-name';
        nameEl.textContent = gene.name_cn;
        entry.appendChild(nameEl);

        const typeEl = document.createElement('div');
        typeEl.className = 'ency-entry-type';
        typeEl.textContent = '基因';
        entry.appendChild(typeEl);

        entry.addEventListener('click', () => {
            $$('.encyclopedia-entry.selected').forEach((el) => el.classList.remove('selected'));
            entry.classList.add('selected');
            if (detail) {
                detail.innerHTML = `
                    <div class="ency-detail-title" style="color:#4CAF50">${gene.name_cn} (${gene.name_en})</div>
                    <div class="ency-detail-row"><span class="ency-label">类型:</span> 基因池</div>
                    <div class="ency-detail-row"><span class="ency-label">描述:</span> ${gene.description}</div>
                    <div class="ency-detail-row"><span class="ency-label">核心属性:</span> ${gene.coreAttribute}</div>
                    <div class="ency-detail-row"><span class="ency-label">隐性属性:</span> ${gene.recessiveAttribute}</div>
                `;
            }
        });

        list.appendChild(entry);
    });

    // Energy Grades section
    const energyGrades = hybridData.energyGrades || {};
    const gradeColors = { blue: '#1E88E5', purple: '#7B1FA2', gold: '#FFD600', red: '#E53935' };
    Object.values(energyGrades).forEach((grade) => {
        const color = gradeColors[grade.id] || '#BDBDBD';
        const entry = document.createElement('div');
        entry.className = 'encyclopedia-entry enc-hybrid-grade';
        entry.style.borderLeftColor = color;
        entry.style.borderLeftWidth = '3px';

        const nameEl = document.createElement('div');
        nameEl.className = 'ency-entry-name';
        nameEl.style.color = color;
        nameEl.textContent = grade.name_cn + '品质';
        entry.appendChild(nameEl);

        const typeEl = document.createElement('div');
        typeEl.className = 'ency-entry-type';
        typeEl.textContent = '品质';
        entry.appendChild(typeEl);

        entry.addEventListener('click', () => {
            $$('.encyclopedia-entry.selected').forEach((el) => el.classList.remove('selected'));
            entry.classList.add('selected');
            if (detail) {
                detail.innerHTML = `
                    <div class="ency-detail-title" style="color:${color}">${grade.name_cn}品质 (${grade.name_en})</div>
                    <div class="ency-detail-row"><span class="ency-label">类型:</span> 能量品质</div>
                    <div class="ency-detail-row"><span class="ency-label">融合数:</span> ${grade.fusionCount}</div>
                    <div class="ency-detail-row"><span class="ency-label">变异概率:</span> ${(grade.mutationProb * 100).toFixed(0)}%</div>
                    <div class="ency-detail-row"><span class="ency-label">多属性概率:</span> ${(grade.multiAttributeProb * 100).toFixed(0)}%</div>
                    <div class="ency-detail-row"><span class="ency-label">数值波动:</span> ±${(grade.valueFluctuation * 100).toFixed(0)}%</div>
                    <div class="ency-detail-row"><span class="ency-label">跨基因概率:</span> ${(grade.crossGeneProb * 100).toFixed(0)}%</div>
                `;
            }
        });

        list.appendChild(entry);
    });

    // Mutation Types section
    const mutationTypes = hybridData.mutationTypes || {};
    Object.values(mutationTypes).forEach((mutation) => {
        const entry = document.createElement('div');
        entry.className = 'encyclopedia-entry enc-hybrid-mutation';
        entry.style.borderLeftColor = '#FF9800';
        entry.style.borderLeftWidth = '3px';

        const nameEl = document.createElement('div');
        nameEl.className = 'ency-entry-name';
        nameEl.textContent = mutation.name_cn;
        entry.appendChild(nameEl);

        const typeEl = document.createElement('div');
        typeEl.className = 'ency-entry-type';
        typeEl.textContent = '变异';
        entry.appendChild(typeEl);

        entry.addEventListener('click', () => {
            $$('.encyclopedia-entry.selected').forEach((el) => el.classList.remove('selected'));
            entry.classList.add('selected');
            if (detail) {
                const minGradeData = hybridData.energyGrades[mutation.minGrade];
                const minGradeName = minGradeData ? minGradeData.name_cn : mutation.minGrade;
                detail.innerHTML = `
                    <div class="ency-detail-title" style="color:#FF9800">${mutation.name_cn} (${mutation.name_en})</div>
                    <div class="ency-detail-row"><span class="ency-label">类型:</span> 变异类型</div>
                    <div class="ency-detail-row"><span class="ency-label">描述:</span> ${mutation.description}</div>
                    <div class="ency-detail-row"><span class="ency-label">最低品质:</span> ${minGradeName}</div>
                    <div class="ency-detail-row"><span class="ency-label">权重:</span> ${mutation.weight}</div>
                `;
            }
        });

        list.appendChild(entry);
    });

    // Hybrid Formulas info entry
    const formulas = hybridData.hybridFormulas;
    if (formulas) {
        const entry = document.createElement('div');
        entry.className = 'encyclopedia-entry enc-hybrid-formula';
        entry.style.borderLeftColor = '#00BCD4';
        entry.style.borderLeftWidth = '3px';

        const nameEl = document.createElement('div');
        nameEl.className = 'ency-entry-name';
        nameEl.textContent = '杂交公式';
        entry.appendChild(nameEl);

        const typeEl = document.createElement('div');
        typeEl.className = 'ency-entry-type';
        typeEl.textContent = '规则';
        entry.appendChild(typeEl);

        entry.addEventListener('click', () => {
            $$('.encyclopedia-entry.selected').forEach((el) => el.classList.remove('selected'));
            entry.classList.add('selected');
            if (detail) {
                detail.innerHTML = `
                    <div class="ency-detail-title" style="color:#00BCD4">杂交公式规则</div>
                    <div class="ency-detail-row"><span class="ency-label">显性遗传概率:</span> ${(formulas.dominantProb * 100).toFixed(0)}%</div>
                    <div class="ency-detail-row"><span class="ency-label">隐性遗传概率:</span> ${(formulas.recessiveProb * 100).toFixed(0)}%</div>
                    <div class="ency-detail-row"><span class="ency-label">保底核心属性:</span> ${formulas.guaranteeOneCore ? '是' : '否'}</div>
                `;
            }
        });

        list.appendChild(entry);
    }
}

function setupEncyclopediaTabs() {
    const tabs = $$('.encyclopedia-tab');
    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            tabs.forEach((t) => t.classList.remove('active'));
            tab.classList.add('active');
            buildEncyclopediaUI(tab.dataset.tab);
        });
    });
}

// ── Lab UI ──────────────────────────────────────────────────────
function buildLabUI(game) {
    // 初始化实验室
    if (!game.lab) {
        game.lab = new Lab(game);
    }
    // 同步库存与玩家拥有的植物（确保新获得的植物在库存中）
    game.lab.syncInventory();

    const slot1 = $('#lab-slot-1');
    const slot2 = $('#lab-slot-2');
    const slot3 = $('#lab-slot-3');
    const slot4 = $('#lab-slot-4');
    const slot5 = $('#lab-slot-5');
    const plus3 = $('#lab-plus-3');
    const plus4 = $('#lab-plus-4');
    const plus5 = $('#lab-plus-5');
    const result = $('#lab-result');
    const btnHybrid = $('#btn-lab-hybrid');
    const energyBtnsContainer = $('#lab-energy-buttons');

    if (!slot1 || !slot2 || !result || !btnHybrid) return;

    const levelNames = {
        blue: '蓝色',
        purple: '紫色',
        gold: '金色',
        red: '红色'
    };

    // 当前选择的能源等级（默认蓝色）
    if (!game._labSelectedEnergy) {
        game._labSelectedEnergy = 'blue';
    }
    let energyGrade = game._labSelectedEnergy;

    // 构建能源选择按钮
    if (energyBtnsContainer) {
        energyBtnsContainer.innerHTML = '';
        for (const grade of ['blue', 'purple', 'gold', 'red']) {
            const btn = document.createElement('button');
            btn.className = `lab-energy-btn lab-energy-${grade}`;
            btn.textContent = `${levelNames[grade]}能源`;
            btn.dataset.grade = grade;
            const count = (game.energy && game.energy[grade]) || 0;
            btn.textContent += ` (${count})`;
            if (grade === energyGrade) {
                btn.classList.add('selected');
            }
            btn.addEventListener('click', () => {
                game._labSelectedEnergy = grade;
                energyGrade = grade;
                // 更新按钮选中状态
                energyBtnsContainer.querySelectorAll('.lab-energy-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                // 根据能源等级显示/隐藏第三、第四个槽位
                updateFusionSlotVisibility();
                updatePreview();
            });
            energyBtnsContainer.appendChild(btn);
        }
    }

    // 获取可用植物（库存>0且非杂交植物）
    const availablePlants = game.lab.getAvailablePlants();

    // 创建植物下拉选项HTML
    const buildOptions = (excludeIds) => {
        const excludeSet = new Set(excludeIds.filter(Boolean));
        let html = '<option value="">选择植物</option>';
        for (const p of availablePlants) {
            if (!excludeSet.has(p.id)) {
                html += `<option value="${p.id}">${p.name} (×${p.count})</option>`;
            }
        }
        return html;
    };

    // 创建下拉框A
    slot1.innerHTML = '';
    const select1 = document.createElement('select');
    select1.className = 'lab-slot-select';
    select1.id = 'lab-select-1';
    slot1.appendChild(select1);
    slot1.classList.add('lab-slot-dropdown');

    // 创建下拉框B
    slot2.innerHTML = '';
    const select2 = document.createElement('select');
    select2.className = 'lab-slot-select';
    select2.id = 'lab-select-2';
    slot2.appendChild(select2);
    slot2.classList.add('lab-slot-dropdown');

    // 创建下拉框C（三元杂交）
    let select3 = null;
    if (slot3) {
        slot3.innerHTML = '';
        select3 = document.createElement('select');
        select3.className = 'lab-slot-select';
        select3.id = 'lab-select-3';
        slot3.appendChild(select3);
        slot3.classList.add('lab-slot-dropdown');
    }

    // 创建下拉框D（四元杂交）
    let select4 = null;
    if (slot4) {
        slot4.innerHTML = '';
        select4 = document.createElement('select');
        select4.className = 'lab-slot-select';
        select4.id = 'lab-select-4';
        slot4.appendChild(select4);
        slot4.classList.add('lab-slot-dropdown');
    }

    // 创建下拉框E（五元杂交）
    let select5 = null;
    if (slot5) {
        slot5.innerHTML = '';
        select5 = document.createElement('select');
        select5.className = 'lab-slot-select';
        select5.id = 'lab-select-5';
        slot5.appendChild(select5);
        slot5.classList.add('lab-slot-dropdown');
    }

    // 根据能源等级显示/隐藏第三、第四、第五个槽位
    function updateFusionSlotVisibility() {
        const canTriple = game.lab.hybridEngine.canTripleFuse(energyGrade);
        const canQuad = game.lab.hybridEngine.canQuadFuse(energyGrade);
        const canPenta = game.lab.hybridEngine.canPentaFuse(energyGrade);
        // 第三个槽位：紫色及以上显示
        if (slot3 && plus3) {
            if (canTriple) {
                slot3.style.display = '';
                plus3.style.display = '';
            } else {
                slot3.style.display = 'none';
                plus3.style.display = 'none';
                if (select3) select3.value = '';
            }
        }
        // 第四个槽位：金色及以上显示
        if (slot4 && plus4) {
            if (canQuad) {
                slot4.style.display = '';
                plus4.style.display = '';
            } else {
                slot4.style.display = 'none';
                plus4.style.display = 'none';
                if (select4) select4.value = '';
            }
        }
        // 第五个槽位：红色显示
        if (slot5 && plus5) {
            if (canPenta) {
                slot5.style.display = '';
                plus5.style.display = '';
            } else {
                slot5.style.display = 'none';
                plus5.style.display = 'none';
                if (select5) select5.value = '';
            }
        }
    }
    updateFusionSlotVisibility();

    // 初始化选项
    const refreshOptions = () => {
        const val1 = select1.dataset.selected || '';
        const val2 = select2.dataset.selected || '';
        const val3 = select3 ? (select3.dataset.selected || '') : '';
        const val4 = select4 ? (select4.dataset.selected || '') : '';
        const val5 = select5 ? (select5.dataset.selected || '') : '';
        select1.innerHTML = buildOptions([val2, val3, val4, val5]);
        select1.value = val1;
        select2.innerHTML = buildOptions([val1, val3, val4, val5]);
        select2.value = val2;
        if (select3) {
            select3.innerHTML = buildOptions([val1, val2, val4, val5]);
            select3.value = val3;
        }
        if (select4) {
            select4.innerHTML = buildOptions([val1, val2, val3, val5]);
            select4.value = val4;
        }
        if (select5) {
            select5.innerHTML = buildOptions([val1, val2, val3, val4]);
            select5.value = val5;
        }
    };
    refreshOptions();

    // 清空结果
    result.innerHTML = '<span>?</span>';
    result.className = 'lab-result';
    btnHybrid.disabled = true;

    // 预览杂交结果
    const updatePreview = () => {
        select1.dataset.selected = select1.value;
        select2.dataset.selected = select2.value;
        if (select3) select3.dataset.selected = select3.value;
        if (select4) select4.dataset.selected = select4.value;
        if (select5) select5.dataset.selected = select5.value;
        const plantAId = select1.value;
        const plantBId = select2.value;
        const plantCId = select3 ? select3.value : '';
        const plantDId = select4 ? select4.value : '';
        const plantEId = select5 ? select5.value : '';

        if (plantAId && plantBId) {
            // 检查库存
            const countA = game.lab.getPlantCount(plantAId);
            const countB = game.lab.getPlantCount(plantBId);

            if (countA <= 0 || countB <= 0) {
                result.innerHTML = '<span class="lab-error">植物库存不足</span>';
                result.className = 'lab-result';
                btnHybrid.disabled = true;
                return;
            }

            // 五元杂交预览
            if (plantCId && plantDId && plantEId) {
                const countC = game.lab.getPlantCount(plantCId);
                const countD = game.lab.getPlantCount(plantDId);
                const countE = game.lab.getPlantCount(plantEId);
                if (countC <= 0) {
                    result.innerHTML = '<span class="lab-error">植物C库存不足</span>';
                    result.className = 'lab-result';
                    btnHybrid.disabled = true;
                    return;
                }
                if (countD <= 0) {
                    result.innerHTML = '<span class="lab-error">植物D库存不足</span>';
                    result.className = 'lab-result';
                    btnHybrid.disabled = true;
                    return;
                }
                if (countE <= 0) {
                    result.innerHTML = '<span class="lab-error">植物E库存不足</span>';
                    result.className = 'lab-result';
                    btnHybrid.disabled = true;
                    return;
                }
                // 检查能源是否足够支付五元杂交四倍消耗
                const energyCheck = game.lab.canFuse(energyGrade);
                if (energyCheck.canFuse) {
                    const pentaCost = energyCheck.cost * 4;
                    const currentEnergy = (game.energy && game.energy[energyGrade]) || 0;
                    if (currentEnergy < pentaCost) {
                        result.innerHTML = `<span class="lab-error">能源不足（五元杂交需要${pentaCost}个${levelNames[energyGrade]}能源，当前${currentEnergy}）</span>`;
                        result.className = 'lab-result';
                        btnHybrid.disabled = true;
                        return;
                    }
                } else {
                    // 连单倍能源都不够，直接禁用按钮
                    result.innerHTML = `<span class="lab-error">能源不足（${energyCheck.reason || '无法进行五元杂交'}）</span>`;
                    result.className = 'lab-result';
                    btnHybrid.disabled = true;
                    return;
                }
                const preview = game.lab.previewPentaFusion(plantAId, plantBId, plantCId, plantDId, plantEId, energyGrade);
                if (preview.error) {
                    result.innerHTML = `<span class="lab-error">${preview.error}</span>`;
                    result.className = 'lab-result';
                    btnHybrid.disabled = true;
                } else {
                    const normal = preview.normal;
                    const rare = preview.rare;
                    let html = `
                        <div class="lab-result-name">🌟 五元杂交</div>
                        <div class="lab-result-name">${normal.name_cn}</div>
                        <div class="lab-result-stats">
                            <div>阳光: ${normal.cost}</div>
                            <div>HP: ${normal.hp}</div>
                            <div>攻击: ${normal.damage}</div>
                            <div>攻速: ${normal.attack_speed}</div>
                        </div>
                        <div class="lab-result-special">${normal.special}</div>
                    `;
                    if (rare) {
                        html += `
                            <div class="lab-result-rare-hint">
                                🏆 传说亚种: ${rare.name_cn} (${Math.round(rare.probability * 100)}%)
                            </div>
                        `;
                    }
                    result.innerHTML = html;
                    result.className = 'lab-result ready lab-grade-penta';
                    btnHybrid.disabled = false;
                }
                return;
            }

            // 四元杂交预览
            if (plantCId && plantDId) {
                const countC = game.lab.getPlantCount(plantCId);
                const countD = game.lab.getPlantCount(plantDId);
                if (countC <= 0) {
                    result.innerHTML = '<span class="lab-error">植物C库存不足</span>';
                    result.className = 'lab-result';
                    btnHybrid.disabled = true;
                    return;
                }
                if (countD <= 0) {
                    result.innerHTML = '<span class="lab-error">植物D库存不足</span>';
                    result.className = 'lab-result';
                    btnHybrid.disabled = true;
                    return;
                }
                // 检查能源是否足够支付四元杂交三倍消耗
                const energyCheck = game.lab.canFuse(energyGrade);
                if (energyCheck.canFuse) {
                    const quadCost = energyCheck.cost * 3;
                    const currentEnergy = (game.energy && game.energy[energyGrade]) || 0;
                    if (currentEnergy < quadCost) {
                        result.innerHTML = `<span class="lab-error">能源不足（四元杂交需要${quadCost}个${levelNames[energyGrade]}能源，当前${currentEnergy}）</span>`;
                        result.className = 'lab-result';
                        btnHybrid.disabled = true;
                        return;
                    }
                } else {
                    // 连单倍能源都不够，直接禁用按钮
                    result.innerHTML = `<span class="lab-error">能源不足（${energyCheck.reason || '无法进行四元杂交'}）</span>`;
                    result.className = 'lab-result';
                    btnHybrid.disabled = true;
                    return;
                }
                const preview = game.lab.previewQuadFusion(plantAId, plantBId, plantCId, plantDId, energyGrade);
                if (preview.error) {
                    result.innerHTML = `<span class="lab-error">${preview.error}</span>`;
                    result.className = 'lab-result';
                    btnHybrid.disabled = true;
                } else {
                    const normal = preview.normal;
                    const rare = preview.rare;
                    let html = `
                        <div class="lab-result-name">🔮 四元杂交</div>
                        <div class="lab-result-name">${normal.name_cn}</div>
                        <div class="lab-result-stats">
                            <div>阳光: ${normal.cost}</div>
                            <div>HP: ${normal.hp}</div>
                            <div>攻击: ${normal.damage}</div>
                            <div>攻速: ${normal.attack_speed}</div>
                        </div>
                        <div class="lab-result-special">${normal.special}</div>
                    `;
                    if (rare) {
                        html += `
                            <div class="lab-result-rare-hint">
                                ⭐ 神圣亚种: ${rare.name_cn} (${Math.round(rare.probability * 100)}%)
                            </div>
                        `;
                    }
                    result.innerHTML = html;
                    result.className = 'lab-result ready lab-grade-quad';
                    btnHybrid.disabled = false;
                }
                return;
            }

            // 三元杂交预览
            if (plantCId) {
                const countC = game.lab.getPlantCount(plantCId);
                if (countC <= 0) {
                    result.innerHTML = '<span class="lab-error">植物C库存不足</span>';
                    result.className = 'lab-result';
                    btnHybrid.disabled = true;
                    return;
                }
                // 检查能源是否足够支付三元杂交双倍消耗
                const energyCheck = game.lab.canFuse(energyGrade);
                if (energyCheck.canFuse) {
                    const tripleCost = energyCheck.cost * 2;
                    const currentEnergy = (game.energy && game.energy[energyGrade]) || 0;
                    if (currentEnergy < tripleCost) {
                        result.innerHTML = `<span class="lab-error">能源不足（三元杂交需要${tripleCost}个${levelNames[energyGrade]}能源，当前${currentEnergy}）</span>`;
                        result.className = 'lab-result';
                        btnHybrid.disabled = true;
                        return;
                    }
                } else {
                    // 连单倍能源都不够，直接禁用按钮
                    result.innerHTML = `<span class="lab-error">能源不足（${energyCheck.reason || '无法进行三元杂交'}）</span>`;
                    result.className = 'lab-result';
                    btnHybrid.disabled = true;
                    return;
                }
                const preview = game.lab.previewTripleFusion(plantAId, plantBId, plantCId, energyGrade);
                if (preview.error) {
                    result.innerHTML = `<span class="lab-error">${preview.error}</span>`;
                    result.className = 'lab-result';
                    btnHybrid.disabled = true;
                } else {
                    const normal = preview.normal;
                    const rare = preview.rare;
                    let html = `
                        <div class="lab-result-name">🔬 三元杂交</div>
                        <div class="lab-result-name">${normal.name_cn}</div>
                        <div class="lab-result-stats">
                            <div>阳光: ${normal.cost}</div>
                            <div>HP: ${normal.hp}</div>
                            <div>攻击: ${normal.damage}</div>
                            <div>攻速: ${normal.attack_speed}</div>
                        </div>
                        <div class="lab-result-special">${normal.special}</div>
                    `;
                    if (rare) {
                        html += `
                            <div class="lab-result-rare-hint">
                                ✨ 至尊亚种: ${rare.name_cn} (${Math.round(rare.probability * 100)}%)
                            </div>
                        `;
                    }
                    result.innerHTML = html;
                    result.className = 'lab-result ready lab-grade-triple';
                    btnHybrid.disabled = false;
                }
                return;
            }

            // 二元杂交预览
            const preview = game.lab.previewFusion(plantAId, plantBId);
            if (preview.error) {
                if (preview.isFailure) {
                    // 已发现的失败组合，显示原因
                    result.innerHTML = `<span class="lab-error">杂交失败：${preview.error}</span>`;
                } else {
                    result.innerHTML = `<span class="lab-error">${preview.error}</span>`;
                }
                result.className = 'lab-result';
                btnHybrid.disabled = true;
            } else {
                // 显示预览结果
                const normal = preview.normal;
                const rare = preview.rare;
                let html = `
                    <div class="lab-result-name">${normal.name_cn}</div>
                    <div class="lab-result-stats">
                        <div>阳光: ${normal.cost}</div>
                        <div>HP: ${normal.hp}</div>
                        <div>攻击: ${normal.damage}</div>
                        <div>攻速: ${normal.attack_speed}</div>
                    </div>
                    <div class="lab-result-special">${normal.special}</div>
                `;
                if (rare) {
                    html += `
                        <div class="lab-result-rare-hint">
                            ✨ 可能产出更强亚种: ${rare.name_cn} (${Math.round(rare.probability * 100)}%)
                        </div>
                    `;
                }
                result.innerHTML = html;
                result.className = `lab-result ready lab-grade-${energyGrade}`;
                btnHybrid.disabled = false;
            }
        } else {
            result.innerHTML = '<span>?</span>';
            result.className = 'lab-result';
            btnHybrid.disabled = true;
        }
    };

    select1.addEventListener('change', () => {
        select1.dataset.selected = select1.value;
        refreshOptions();
        updatePreview();
    });
    select2.addEventListener('change', () => {
        select2.dataset.selected = select2.value;
        refreshOptions();
        updatePreview();
    });
    if (select3) {
        select3.addEventListener('change', () => {
            select3.dataset.selected = select3.value;
            refreshOptions();
            updatePreview();
        });
    }
    if (select4) {
        select4.addEventListener('change', () => {
            select4.dataset.selected = select4.value;
            refreshOptions();
            updatePreview();
        });
    }
    if (select5) {
        select5.addEventListener('change', () => {
            select5.dataset.selected = select5.value;
            refreshOptions();
            updatePreview();
        });
    }

    // 杂交按钮点击
    btnHybrid.onclick = () => {
        const plantAId = select1.value;
        const plantBId = select2.value;
        const plantCId = select3 ? select3.value : '';
        const plantDId = select4 ? select4.value : '';
        const plantEId = select5 ? select5.value : '';

        if (!plantAId || !plantBId) return;

        // 执行杂交（支持二元/三元/四元/五元）
        const fusionResult = game.lab.fuse(
            plantAId, plantBId, energyGrade,
            plantCId || undefined,
            plantDId || undefined,
            plantEId || undefined
        );

        if (fusionResult.error) {
            if (fusionResult.isFailure) {
                alert(`杂交失败！\n\n${fusionResult.error}`);
            } else {
                alert(fusionResult.error);
            }
            return;
        }

        // 显示最终结果
        let mutationsHtml = '';
        if (fusionResult.mutations && fusionResult.mutations.length > 0) {
            mutationsHtml = '<div class="lab-mutations">' +
                fusionResult.mutations.map(m =>
                    `<span class="mutation-badge mutation-${m.id}">${m.name_cn}</span>`
                ).join('') +
                '</div>';
        }

        let rareBadge = '';
        if (fusionResult.isRare) {
            if (fusionResult.fusionType === 'penta') {
                rareBadge = '<span class="rare-badge">🏆 传说</span>';
            } else if (fusionResult.fusionType === 'quad') {
                rareBadge = '<span class="rare-badge">⭐ 神圣</span>';
            } else if (fusionResult.fusionType === 'triple') {
                rareBadge = '<span class="rare-badge">👑 至尊</span>';
            } else {
                rareBadge = '<span class="rare-badge">✨ 更强</span>';
            }
        }
        let fusionTypeLabel = '';
        if (fusionResult.fusionType === 'penta') {
            fusionTypeLabel = '🌟 五元杂交';
        } else if (fusionResult.fusionType === 'quad') {
            fusionTypeLabel = '🔮 四元杂交';
        } else if (fusionResult.fusionType === 'triple') {
            fusionTypeLabel = '🔬 三元杂交';
        }

        result.innerHTML = `
            <div class="lab-result-name">${fusionResult.name_cn} ${rareBadge}</div>
            ${fusionTypeLabel ? `<div class="lab-fusion-type">${fusionTypeLabel}</div>` : ''}
            <div class="lab-result-stats">
                <div>阳光: ${fusionResult.cost}</div>
                <div>HP: ${fusionResult.hp}</div>
                <div>攻击: ${fusionResult.damage}</div>
                <div>攻速: ${fusionResult.attack_speed}</div>
                <div>射程: ${fusionResult.range}</div>
            </div>
            <div class="lab-result-special">${fusionResult.special}</div>
            ${mutationsHtml}
            <div class="lab-result-grade">品质: ${levelNames[fusionResult.grade]}</div>
        `;
        result.className = `lab-result ready lab-grade-${fusionResult.grade}`;

        // 重置选择
        select1.dataset.selected = '';
        select2.dataset.selected = '';
        if (select3) select3.dataset.selected = '';
        if (select4) select4.dataset.selected = '';
        if (select5) select5.dataset.selected = '';
        refreshOptions();

        // 延迟刷新可用植物列表（库存已消耗），让用户看到结果
        setTimeout(() => {
            // 保存结果HTML，重建后恢复
            const resultHtml = result.innerHTML;
            const resultClass = result.className;
            buildLabUI(game);
            const newResult = $('#lab-result');
            if (newResult) {
                newResult.innerHTML = resultHtml;
                newResult.className = resultClass;
            }
        }, 2000);
    };
}

// ── Shop UI ─────────────────────────────────────────────────────
const CARD_SLOT_COST = 300;
const MAX_CARD_SLOTS = 10;
const TIER_LABELS = {
    basic: '基础',
    elite: '精英',
    leader: '首领',
    special: '特殊'
};

let _shopActiveTab = 'plants';

function buildShopUI(game) {
    // Update coins display
    const coinsEl = $('#shop-coins-count');
    if (coinsEl) coinsEl.textContent = game.coins;

    // Setup tab switching
    const tabs = $$('.shop-tab');
    tabs.forEach((tab) => {
        tab.onclick = () => {
            tabs.forEach((t) => t.classList.remove('active'));
            tab.classList.add('active');
            _shopActiveTab = tab.dataset.tab;
            renderShopTab(game, _shopActiveTab);
        };
    });

    // Render current tab
    renderShopTab(game, _shopActiveTab);
}

function renderShopTab(game, tabName) {
    const container = $('#shop-items');
    if (!container) return;
    container.innerHTML = '';

    // Update coins display
    const coinsEl = $('#shop-coins-count');
    if (coinsEl) coinsEl.textContent = game.coins;

    if (tabName === 'relics') {
        renderShopRelics(game, container);
    } else if (tabName === 'upgrades') {
        renderShopUpgrades(game, container);
    } else if (tabName === 'plants') {
        renderShopPlants(game, container);
    }
}

function renderShopRelics(game, container) {
    const ownedRelics = game.relics || [];
    // 高级区：使用 tower_shop 的 generateShopRelics 按楼层品阶筛选
    const floor = game.currentFloor || 1;

    // 生成或复用当前高级区遗物列表（_shopRelicCache 仅在刷新时重置）
    if (!game._shopRelicCache || game._shopRelicCacheFloor !== floor) {
        game._shopRelicCache = generateTowerShopRelics(floor, game);
        game._shopRelicCacheFloor = floor;
    }
    const available = game._shopRelicCache.filter(r => !ownedRelics.includes(r.id));

    // 高级区刷新按钮
    const refreshCost = TOWER_SHOP_CONFIG.premiumRefreshCost;
    const refreshBtn = document.createElement('button');
    refreshBtn.className = 'shop-refresh-btn';
    refreshBtn.innerHTML = `🔄 刷新高级区 (-${refreshCost}金币)`;
    refreshBtn.disabled = game.coins < refreshCost;
    refreshBtn.onclick = () => {
        if (game.coins >= refreshCost) {
            game.coins -= refreshCost;
            game._shopRelicCache = generateTowerShopRelics(floor, game);
            renderShopTab(game, _shopActiveTab);
            updateHUD(game);
        }
    };
    container.appendChild(refreshBtn);

    if (available.length === 0) {
        const msg = document.createElement('div');
        msg.className = 'shop-empty-msg';
        msg.textContent = '当前品阶已无可购买遗物，可刷新或前往更高楼层';
        container.appendChild(msg);
        return;
    }

    available.forEach((relicItem) => {
        // 应用 shop_discount 遗物加成
        const discount = (game._getShopDiscount && game._getShopDiscount()) || 0;
        const effectiveCost = Math.max(0, Math.round(relicItem.cost * (1 - discount)));
        const item = createShopItem({
            name: relicItem.name,
            description: `${relicItem.description} [${TIER_LABELS[relicItem.tier] || relicItem.tier}]`,
            cost: effectiveCost,
            tier: relicItem.tier,
            canAfford: game.coins >= effectiveCost,
            onBuy: () => {
                if (game.coins >= effectiveCost) {
                    game.coins -= effectiveCost;
                    if (!game.relics) game.relics = [];
                    game.relics.push(relicItem.id);
                    // 从缓存中移除已购买项
                    game._shopRelicCache = game._shopRelicCache.filter(r => r.id !== relicItem.id);
                    renderShopTab(game, _shopActiveTab);
                    updateHUD(game);
                }
            }
        });
        container.appendChild(item);
    });
}

function renderShopUpgrades(game, container) {
    // Card slot upgrade
    const currentSlots = game.cardSlots || 6;
    // 价格公式：以6槽为基准，每扩展1槽增加 CARD_SLOT_COST
    const slotCost = CARD_SLOT_COST + (currentSlots - 6) * 200;
    const maxed = currentSlots >= MAX_CARD_SLOTS;

    const slotItem = createShopItem({
        name: '卡槽扩展',
        description: maxed ? `已达上限 (${currentSlots}/${MAX_CARD_SLOTS})` : `卡槽 ${currentSlots} → ${currentSlots + 1}`,
        cost: maxed ? 0 : slotCost,
        canAfford: !maxed && game.coins >= slotCost,
        maxed: maxed,
        onBuy: () => {
            if (!maxed && game.coins >= slotCost) {
                game.coins -= slotCost;
                game.cardSlots++;
                renderShopTab(game, _shopActiveTab);
                updateHUD(game);
            }
        }
    });
    container.appendChild(slotItem);

    // Lab upgrade
    const labLevel = game.labLevel || 1;
    const labCost = labLevel * 500;
    const labMaxed = labLevel >= 10;

    const labItem = createShopItem({
        name: '实验室升级',
        description: labMaxed ? `已达最高等级 (${labLevel})` : `实验室等级 ${labLevel} → ${labLevel + 1}`,
        cost: labMaxed ? 0 : labCost,
        canAfford: !labMaxed && game.coins >= labCost,
        maxed: labMaxed,
        onBuy: () => {
            if (!labMaxed && game.coins >= labCost) {
                game.coins -= labCost;
                game.labLevel++;
                renderShopTab(game, _shopActiveTab);
                updateHUD(game);
            }
        }
    });
    container.appendChild(labItem);

    // 自动收集已默认开启，无需购买
}

function renderShopPlants(game, container) {
    const unlocked = game.unlockedPlants || [];
    // 使用 game.plantData 以保持一致性（虽然杂交植物不应在商店出售）
    const dataSource = (game.plantData) ? game.plantData : plantData;
    const locked = Object.values(dataSource).filter(
        (p) => p.unlock_cost > 0 && !unlocked.includes(p.id) && !p.is_hybrid
    );

    if (locked.length === 0) {
        const msg = document.createElement('div');
        msg.className = 'shop-empty-msg';
        msg.textContent = '已解锁全部植物';
        container.appendChild(msg);
        return;
    }

    locked.forEach((plant) => {
        const item = createShopItem({
            name: plant.name_cn,
            description: plant.special || '',
            cost: plant.unlock_cost,
            canAfford: game.coins >= plant.unlock_cost,
            onBuy: () => {
                if (game.coins >= plant.unlock_cost) {
                    game.coins -= plant.unlock_cost;
                    if (!game.unlockedPlants) game.unlockedPlants = [];
                    game.unlockedPlants.push(plant.id);
                    renderShopTab(game, _shopActiveTab);
                    updateHUD(game);
                }
            }
        });
        container.appendChild(item);
    });
}

function createShopItem({ name, description, cost, tier, canAfford, maxed, onBuy }) {
    const item = document.createElement('div');
    item.className = 'shop-item';
    if (maxed) item.classList.add('owned');
    else if (!canAfford) item.classList.add('cannot-afford');

    // Name
    const nameEl = document.createElement('div');
    nameEl.className = 'shop-item-name';
    nameEl.textContent = name;
    item.appendChild(nameEl);

    // Tier badge
    if (tier) {
        const badge = document.createElement('span');
        badge.className = `shop-tier-badge tier-${tier}`;
        badge.textContent = TIER_LABELS[tier] || tier;
        item.appendChild(badge);
    }

    // Description
    if (description) {
        const descEl = document.createElement('div');
        descEl.className = 'shop-item-desc';
        descEl.textContent = description;
        item.appendChild(descEl);
    }

    // Price
    if (!maxed) {
        const priceEl = document.createElement('div');
        priceEl.className = `shop-item-price ${canAfford ? 'affordable' : 'expensive'}`;
        priceEl.textContent = `🪙 ${cost}`;
        item.appendChild(priceEl);
    } else {
        const maxedEl = document.createElement('div');
        maxedEl.className = 'shop-item-price';
        maxedEl.textContent = '✅ 已满级';
        item.appendChild(maxedEl);
    }

    // Buy button
    const buyBtn = document.createElement('button');
    buyBtn.className = 'shop-buy-btn';
    if (maxed || !canAfford) buyBtn.classList.add('disabled');
    buyBtn.textContent = maxed ? '已拥有' : '购买';
    if (!maxed && canAfford) {
        buyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            onBuy();
        });
    }
    item.appendChild(buyBtn);

    return item;
}

// ── Save Manager UI ───────────────────────────────────────────
const SAVE_SLOTS = ['slot1', 'slot2', 'slot3'];

// 查找最近的存档槽位
function findLatestSaveSlot() {
    let latestSlot = null;
    let latestTime = 0;
    for (const slot of SAVE_SLOTS) {
        try {
            const raw = localStorage.getItem('pvz_save_' + slot);
            if (raw) {
                const data = JSON.parse(raw);
                if (data && data.timestamp > latestTime) {
                    latestTime = data.timestamp;
                    latestSlot = slot;
                }
            }
        } catch (e) { /* ignore */ }
    }
    return latestSlot;
}

// 加载存档并进入塔地图
function loadSaveAndEnterTowerMap(game, slot) {
    try {
        const raw = localStorage.getItem('pvz_save_' + slot);
        if (!raw) {
            alert('存档不存在');
            return;
        }
        const saveData = JSON.parse(raw);
        game.saveManager.loadSaveData(saveData);
        game.currentSaveSlot = slot;
        game.saveSlotName = saveData.name || `存档 ${slot}`;

        // 确保 lab 已初始化（用于恢复实验室状态）
        if (!game.lab) {
            game.lab = new Lab(game);
        }
        // 恢复实验室状态（植物库存、刷新次数、已发现失败组合）
        if (saveData.lab) {
            game.lab.deserialize(saveData.lab);
        } else if (game._pendingLabData) {
            // loadSaveData 时 lab 还未初始化，使用缓存数据
            game.lab.deserialize(game._pendingLabData);
            delete game._pendingLabData;
        } else {
            // 没有实验室存档数据，基于 unlockedPlants 初始化
            game.lab.initInventory();
        }
        // 同步库存与玩家拥有的植物（确保新获得的植物在库存中）
        game.lab.syncInventory();

        // 重新注册杂交植物到plantData和unlockedPlants
        if (game.hybridPlants && game.hybridPlants.length > 0) {
            for (const hybrid of game.hybridPlants) {
                if (hybrid.instanceId) {
                    // 注册到plantData
                    game.plantData[hybrid.instanceId] = {
                        id: hybrid.instanceId,
                        name_cn: hybrid.name_cn,
                        name_en: hybrid.name_en || 'Hybrid',
                        gene_pool: hybrid.gene_pool,
                        category: hybrid.category,
                        cost: hybrid.cost,
                        hp: hybrid.hp,
                        cooldown: hybrid.cooldown || 7.5,
                        damage: hybrid.damage,
                        attack_speed: hybrid.attack_speed,
                        range: hybrid.range,
                        special: hybrid.special,
                        is_hybrid: true,
                        parents: hybrid.parents,
                        isRare: hybrid.isRare,
                        fusionType: hybrid.fusionType || 'dual',
                        grade: hybrid.grade,
                        parentCategories: hybrid.parentCategories,
                        mutations: hybrid.mutations,
                        visual: hybrid.visual
                    };
                    // 添加到unlockedPlants
                    if (!game.unlockedPlants.includes(hybrid.instanceId)) {
                        game.unlockedPlants.push(hybrid.instanceId);
                    }
                }
            }
        }

        // 进入塔地图（而非直接战斗）
        if (saveData.progress && saveData.progress.mode === 'tower') {
            // 恢复塔模式状态
            game.mode = 'tower';
            game.currentFloor = saveData.progress.floor || 1;
            // 使用存档中保存的塔地图状态（已由 loadSaveData 恢复）
            // 如果没有存档塔地图数据，才生成新地图
            if (!game.towerMap || game.towerMap.length === 0) {
                game.towerMap = generateFullTowerMap(1);
                game.completedNodes = [];
            }
            game.baseHP = game.maxBaseHP;
            game.setState(STATES.TOWER_MAP);
            buildTowerMapUI(game);
        } else {
            // 非塔模式存档，启动新的塔模式
            game.startTowerMode(game.loadout);
            buildTowerMapUI(game);
        }

        // 确保游戏循环运行
        if (!game.running) {
            game.running = true;
            game.lastTime = performance.now();
            game.animFrameId = requestAnimationFrame(game._loop);
        }
    } catch (e) {
        console.error('加载存档失败:', e);
        alert('加载存档失败: ' + e.message);
    }
}

// 构建存档选择界面（用于新游戏/继续游戏）
function buildSaveSelectUI(game) {
    const container = $('#save-select-container');
    if (!container) return;
    container.innerHTML = '';

    const title = $('#save-select-title');
    const info = $('#save-select-info');
    const mode = game._saveSelectMode || 'new';

    if (title) {
        title.textContent = mode === 'new' ? '🌱 新游戏 - 选择存档槽' : '📂 继续游戏 - 选择存档';
    }
    if (info) {
        info.textContent = mode === 'new' ? '选择一个存档槽位开始新游戏（已有存档将被覆盖）' : '选择要加载的存档';
    }

    SAVE_SLOTS.forEach((slotId, index) => {
        let saveData = null;
        try {
            const raw = localStorage.getItem('pvz_save_' + slotId);
            if (raw) saveData = JSON.parse(raw);
        } catch (e) { /* ignore */ }

        const card = document.createElement('div');
        card.className = 'save-slot-card' + (saveData ? '' : ' empty');

        // Icon
        const icon = document.createElement('div');
        icon.className = 'save-slot-icon';
        icon.textContent = saveData ? '💾' : '📁';
        card.appendChild(icon);

        // Info
        const infoEl = document.createElement('div');
        infoEl.className = 'save-slot-info';

        const name = document.createElement('div');
        name.className = 'save-slot-name';
        name.textContent = saveData ? (saveData.name || `存档 ${index + 1}`) : `空存档槽 ${index + 1}`;
        infoEl.appendChild(name);

        if (saveData) {
            const details = document.createElement('div');
            details.className = 'save-slot-details';
            const p = saveData.progress || {};
            const r = saveData.resources || {};
            details.innerHTML = `
                <span class="save-slot-detail-item">🏔 楼层 ${p.floor || 1}</span>
                <span class="save-slot-detail-item">🌊 波次 ${(p.wave || 0) + 1}</span>
                <span class="save-slot-detail-item">☀ ${r.sun || 0}</span>
                <span class="save-slot-detail-item">🪙 ${r.coins || 0}</span>
            `;
            infoEl.appendChild(details);

            const time = document.createElement('div');
            time.className = 'save-slot-time';
            const date = new Date(saveData.timestamp || 0);
            time.textContent = date.toLocaleString('zh-CN');
            infoEl.appendChild(time);
        } else {
            const empty = document.createElement('div');
            empty.className = 'save-slot-time';
            empty.textContent = mode === 'new' ? '点击此处开始新游戏' : '无存档';
            infoEl.appendChild(empty);
        }
        card.appendChild(infoEl);

        // Action button
        const actions = document.createElement('div');
        actions.className = 'save-slot-actions';

        const actionBtn = document.createElement('button');
        actionBtn.className = 'save-slot-btn';

        if (mode === 'new') {
            // 新游戏模式：所有槽位都可以选择
            actionBtn.textContent = saveData ? '覆盖并开始' : '开始新游戏';
            actionBtn.addEventListener('click', () => {
                // 如果有旧存档，确认覆盖
                if (saveData && !confirm(`确认覆盖存档 ${index + 1}？`)) return;
                // 创建新存档
                game.currentSaveSlot = slotId;
                game.saveSlotName = `存档 ${index + 1}`;
                // 重置游戏状态 - 玩家开局无植物
                game.floor = 1;
                game.currentFloor = 1;
                game.coins = 0;
                game.hybridPlants = [];
                game.specialPlants = [];
                game.loadout = [];
                game.unlockedPlants = [];  // 玩家开局无植物
                game.introCompleted = false;
                game.energy = { blue: 0, purple: 0, gold: 0, red: 0 };
                // 重置小推车丢失记录（防止跨存档污染）
                if (game.lostMowerRows) game.lostMowerRows.clear();
                // 重置实验室库存（清除上个存档残留的植物）
                if (game.lab) {
                    game.lab.plantInventory = {};
                    game.lab.mutationRefreshes = {};
                    // 清空已发现失败组合（防止跨存档污染）
                    if (game.lab.hybridEngine && game.lab.hybridEngine.discoveredFailures) {
                        game.lab.hybridEngine.discoveredFailures.clear();
                    }
                }
                // 清除 plantData 中残留的杂交/特殊植物（防止跨存档污染）
                if (game.plantData) {
                    for (const key of Object.keys(game.plantData)) {
                        const pd = game.plantData[key];
                        if (pd && (pd.is_hybrid || pd.is_special || key.startsWith('hybrid_'))) {
                            delete game.plantData[key];
                        }
                    }
                }
                // 保存初始状态
                game.saveManager.save(slotId, `存档 ${index + 1}`);
                // 启动塔模式（会自动触发初始对话）
                game.startTowerMode([]);
            });
        } else {
            // 继续游戏模式：只有有存档的槽位可以加载
            if (saveData) {
                actionBtn.textContent = '加载存档';
                actionBtn.addEventListener('click', () => {
                    loadSaveAndEnterTowerMap(game, slotId);
                });
            } else {
                actionBtn.textContent = '无存档';
                actionBtn.disabled = true;
                actionBtn.classList.add('disabled');
            }
        }
        actions.appendChild(actionBtn);
        card.appendChild(actions);

        container.appendChild(card);
    });
}

function buildSaveManagerUI(game) {
    const container = $('#save-slots-container');
    if (!container) return;
    container.innerHTML = '';

    SAVE_SLOTS.forEach((slotId, index) => {
        let saveData = null;
        try {
            const raw = localStorage.getItem('pvz_save_' + slotId);
            if (raw) saveData = JSON.parse(raw);
        } catch (e) { /* ignore */ }

        const card = document.createElement('div');
        card.className = 'save-slot-card' + (saveData ? '' : ' empty');

        // Icon
        const icon = document.createElement('div');
        icon.className = 'save-slot-icon';
        icon.textContent = saveData ? '💾' : '📁';
        card.appendChild(icon);

        // Info
        const info = document.createElement('div');
        info.className = 'save-slot-info';

        const name = document.createElement('div');
        name.className = 'save-slot-name';
        name.textContent = saveData ? (saveData.name || `存档 ${index + 1}`) : `空存档槽 ${index + 1}`;
        info.appendChild(name);

        if (saveData) {
            const details = document.createElement('div');
            details.className = 'save-slot-details';
            const p = saveData.progress || {};
            const r = saveData.resources || {};
            details.innerHTML = `
                <span class="save-slot-detail-item">🏔 楼层 ${p.floor || 1}</span>
                <span class="save-slot-detail-item">🌊 波次 ${(p.wave || 0) + 1}</span>
                <span class="save-slot-detail-item">☀ ${r.sun || 0}</span>
                <span class="save-slot-detail-item">🪙 ${r.coins || 0}</span>
            `;
            info.appendChild(details);

            const time = document.createElement('div');
            time.className = 'save-slot-time';
            const date = new Date(saveData.timestamp || 0);
            time.textContent = date.toLocaleString('zh-CN');
            info.appendChild(time);
        } else {
            const empty = document.createElement('div');
            empty.className = 'save-slot-time';
            empty.textContent = '点击"保存"来创建新存档';
            info.appendChild(empty);
        }
        card.appendChild(info);

        // Actions
        const actions = document.createElement('div');
        actions.className = 'save-slot-actions';

        // Save button
        const saveBtn = document.createElement('button');
        saveBtn.className = 'save-slot-btn';
        saveBtn.textContent = saveData ? '覆盖保存' : '保存';
        saveBtn.addEventListener('click', () => {
            game.saveManager.save(slotId, `存档 ${index + 1}`);
            buildSaveManagerUI(game);
        });
        actions.appendChild(saveBtn);

        // Load button
        if (saveData) {
            const loadBtn = document.createElement('button');
            loadBtn.className = 'save-slot-btn';
            loadBtn.textContent = '读取';
            loadBtn.addEventListener('click', () => {
                // 使用统一的加载流程（进入塔地图，而非直接战斗）
                loadSaveAndEnterTowerMap(game, slotId);
            });
            actions.appendChild(loadBtn);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'save-slot-btn danger';
            deleteBtn.textContent = '删除';
            deleteBtn.addEventListener('click', () => {
                if (confirm(`确认删除存档 ${index + 1}？`)) {
                    game.saveManager.deleteSave(slotId);
                    buildSaveManagerUI(game);
                }
            });
            actions.appendChild(deleteBtn);
        }

        card.appendChild(actions);
        container.appendChild(card);
    });
}

// ── Game state observer ─────────────────────────────────────────

// 构建背包面板内容（从游戏状态读取数据并渲染）
function buildInventoryUI(game) {
    // 资源栏
    const resourcesEl = $('#inventory-resources');
    if (resourcesEl) {
        const energy = game.energy || { blue: 0, purple: 0, gold: 0, red: 0 };
        resourcesEl.innerHTML = `
            <div class="resource-item">☀️ 阳光: ${game.sun || 0}</div>
            <div class="resource-item">🪙 金币: ${game.coins || 0}</div>
            <div class="resource-item">🔵 蓝能源: ${energy.blue || 0}</div>
            <div class="resource-item">🟣 紫能源: ${energy.purple || 0}</div>
            <div class="resource-item">🟡 金能源: ${energy.gold || 0}</div>
            <div class="resource-item">🔴 红能源: ${energy.red || 0}</div>
        `;
    }

    // 基础植物（从 lab.plantInventory 读取）
    const basePlantsEl = $('#inventory-base-plants');
    if (basePlantsEl) {
        const inventory = (game.lab && game.lab.plantInventory) || {};
        const html = Object.entries(inventory)
            .filter(([, count]) => count > 0)
            .map(([id, count]) => {
                const data = (game.plantData && game.plantData[id]) || plantData[id];
                const name = data ? data.name_cn : id;
                const cost = data ? data.cost : 0;
                return `<div class="inventory-plant-card">
                    <div class="plant-name">${name}</div>
                    <div class="plant-cost">☀${cost}</div>
                    <div class="plant-count">×${count}</div>
                </div>`;
            }).join('');
        basePlantsEl.innerHTML = html || '<p class="empty-hint">暂无植物</p>';
    }

    // 杂交植物（从 game.hybridPlants 读取）
    const hybridPlantsEl = $('#inventory-hybrid-plants');
    if (hybridPlantsEl) {
        const hybrids = game.hybridPlants || [];
        const html = hybrids.map(h => {
            const name = h.name_cn || h.name || h.instanceId || '杂交植物';
            return `<div class="inventory-plant-card hybrid">
                <div class="plant-name">${name}</div>
                <div class="plant-count">×1</div>
            </div>`;
        }).join('');
        hybridPlantsEl.innerHTML = html || '<p class="empty-hint">暂无杂交植物</p>';
    }

    // 特殊植物（从 game.specialPlants 读取）
    const specialPlantsEl = $('#inventory-special-plants');
    if (specialPlantsEl) {
        const specials = game.specialPlants || [];
        const html = specials.map(sp => {
            const name = (sp && sp.name_cn) || (sp && sp.id) || '特殊植物';
            return `<div class="inventory-plant-card special">
                <div class="plant-name">${name}</div>
                <div class="plant-count">×1</div>
            </div>`;
        }).join('');
        specialPlantsEl.innerHTML = html || '<p class="empty-hint">暂无特殊植物</p>';
    }

    // 遗物
    const relicsEl = $('#inventory-relics');
    if (relicsEl) {
        const relics = game.relics || [];
        const html = relics.map(r => {
            const name = (r && r.name_cn) || (r && r.name) || (r && r.id) || '遗物';
            const desc = (r && r.description) || '';
            return `<div class="relic-item">
                <div class="relic-name">${name}</div>
                <div class="relic-desc">${desc}</div>
            </div>`;
        }).join('');
        relicsEl.innerHTML = html || '<p class="empty-hint">暂无遗物</p>';
    }
}
window.buildInventoryUI = buildInventoryUI;

// 隐藏所有战斗 UI（卡槽栏、HUD、铲子按钮、遗物栏）
function hideBattleUI() {
    const cardSlotBar = $('#card-slot-bar');
    const hud = $('#hud');
    const shovelBtn = $('#btn-shovel');
    const relicBar = $('#active-relic-bar');
    if (cardSlotBar) cardSlotBar.classList.add('hidden');
    if (hud) hud.classList.add('hidden');
    if (relicBar) relicBar.classList.add('hidden');
    if (shovelBtn) {
        shovelBtn.classList.add('hidden');
        shovelBtn.classList.remove('active');
    }
}

// 显示战斗 UI（卡槽栏、HUD、遗物栏；铲子按钮由 updateHUD 根据状态控制）
function showBattleUI() {
    const cardSlotBar = $('#card-slot-bar');
    const hud = $('#hud');
    const relicBar = $('#active-relic-bar');
    if (cardSlotBar) cardSlotBar.classList.remove('hidden');
    if (hud) hud.classList.remove('hidden');
    // 遗物栏仅在有主动激活遗物时显示
    renderActiveRelicBar(window.pvzGame);
    if (relicBar && relicBar.children.length > 0) {
        relicBar.classList.remove('hidden');
    }
}

// 渲染主动激活遗物栏（gene_scrambler / time_rewind 等）
function renderActiveRelicBar(game) {
    const bar = $('#active-relic-bar');
    if (!bar || !game) return;
    bar.innerHTML = '';

    const activeRelics = (typeof game.getActiveRelics === 'function')
        ? game.getActiveRelics()
        : [];

    if (activeRelics.length === 0) {
        bar.classList.add('hidden');
        return;
    }

    // 标题
    const title = document.createElement('div');
    title.className = 'active-relic-bar-title';
    title.textContent = '🔮 主动遗物';
    bar.appendChild(title);

    // 各遗物按钮
  const relicMeta = {
    gene_scrambler: { icon: '🎲', name: '基因搅拌器', desc: '重投上次杂交变异' },
    time_rewind: { icon: '⏪', name: '时间回溯', desc: '撤销当前波次' },
    time_freeze: { icon: '❄️', name: '时间冰封', desc: '冻结所有僵尸3秒' },
    swap_doll: { icon: '🔄', name: '换位娃娃', desc: '点击两个植物交换位置' },
  };

  for (const relicId of activeRelics) {
    const meta = relicMeta[relicId] || { icon: '✨', name: relicId, desc: '' };
    const btn = document.createElement('button');
    btn.className = 'active-relic-btn';
    btn.dataset.relicId = relicId;
    btn.innerHTML = `
      <span class="relic-icon">${meta.icon}</span>
      <span class="relic-name">${meta.name}</span>
      <span class="relic-tooltip">${meta.desc}</span>
    `;
    btn.addEventListener('click', () => useActiveRelic(game, relicId));
    bar.appendChild(btn);
  }

  bar.classList.remove('hidden');
}

// 使用主动激活遗物
function useActiveRelic(game, relicId) {
    if (!game) return;
    let result;
    if (relicId === 'gene_scrambler') {
        result = game.useRerollHybrid();
    } else if (relicId === 'time_rewind') {
        result = game.useUndoWave();
    } else if (relicId === 'time_freeze') {
        result = game.useTimeFreeze();
    } else if (relicId === 'swap_doll') {
        // 进入植物选择模式：玩家点击两个植物完成交换
        if (game.state !== 'playing') {
            result = { ok: false, reason: '仅战斗中可用' };
        } else {
            game._swapDollMode = true;
            game._swapDollFirstPlant = null;
            showFloatingMessage('🔄 请点击两个植物完成交换', 'success');
            renderActiveRelicBar(game);
            return;
        }
    } else {
        result = { ok: false, reason: '未知遗物' };
    }

    if (result && result.ok) {
        // 成功：重新渲染遗物栏（遗物可能已被消耗）
        renderActiveRelicBar(game);
        const bar = $('#active-relic-bar');
        if (bar && bar.children.length === 0) bar.classList.add('hidden');
        // 显示提示
        showFloatingMessage('✨ 遗物已使用', 'success');
    } else {
        showFloatingMessage('❌ ' + (result.reason || '无法使用'), 'error');
    }
}

// 简单的浮动提示
function showFloatingMessage(text, type) {
    const msg = document.createElement('div');
    msg.textContent = text;
    msg.style.cssText = `
        position: fixed; top: 80px; left: 50%; transform: translateX(-50%);
        padding: 10px 20px; border-radius: 6px; font-size: 16px; font-weight: bold;
        z-index: 9999; pointer-events: none; opacity: 0; transition: opacity 0.3s ease;
        background: ${type === 'success' ? 'rgba(76, 175, 80, 0.9)' : type === 'info' ? 'rgba(33, 150, 243, 0.9)' : 'rgba(229, 57, 53, 0.9)'};
        color: white; border: 1px solid rgba(255, 255, 255, 0.3);
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.6);
    `;
    document.body.appendChild(msg);
    requestAnimationFrame(() => { msg.style.opacity = '1'; });
    setTimeout(() => {
        msg.style.opacity = '0';
        setTimeout(() => msg.remove(), 300);
    }, 2000);
}

function observeGameState(game) {
    // 挂载浮动提示方法到 game 对象，供其他模块（input.js）调用
    game.showFloatingMessage = showFloatingMessage;

    const originalSetState = game.setState.bind(game);

    game.setState = function (newState) {
        originalSetState(newState);

        // 状态切换时统一隐藏战斗 UI，防止战斗 UI 残留到非战斗界面
        hideBattleUI();
        // 背包按钮仅在塔地图显示，其他状态隐藏
        const btnInventoryEl = $('#btn-inventory');
        if (btnInventoryEl) btnInventoryEl.classList.add('hidden');

        switch (newState) {
            case STATES.MENU:
                showScreen('menu-screen');
                // Update continue button visibility based on save existence
                const hasSave = findLatestSaveSlot() !== null;
                const continueBtn = $('#btn-continue-game');
                if (continueBtn) {
                    continueBtn.style.display = hasSave ? '' : 'none';
                }
                break;
            case STATES.SAVE_SELECT:
                buildSaveSelectUI(game);
                showScreen('save-select-screen');
                break;
            case STATES.SETTINGS:
                // 更新设置界面状态
                const autoCollectStatus = $('#setting-auto-collect-status');
                if (autoCollectStatus) {
                    autoCollectStatus.textContent = game.autoCollectSun ? '✅ 已启用' : '❌ 未购买';
                }
                showScreen('settings-screen');
                break;
            case STATES.PLAYING:
                hideAllScreens();
                // Show HUD and card slot bar during gameplay
                showBattleUI();
                break;
            case STATES.PAUSED:
                showScreen('pause-screen');
                break;
            case STATES.GAME_OVER:
                showScreen('gameover-screen');
                break;
            case STATES.VICTORY:
                // 渲染杀戮尖塔式胜利奖励屏
                renderVictoryScreen(game);
                showScreen('victory-screen');
                break;
            case STATES.TOWER_MAP:
                buildTowerMapUI(game);
                showScreen('tower-map-screen');
                // 显示背包按钮
                const btnInv = $('#btn-inventory');
                if (btnInv) btnInv.classList.remove('hidden');
                break;
            case STATES.PLANT_SELECT:
                buildPlantSelectGrid(game);
                showScreen('plant-select-screen');
                break;
            case STATES.SHOP:
                showScreen('shop-screen');
                buildShopUI(game);
                break;
            case STATES.LAB:
                showScreen('lab-screen');
                buildLabUI(game);
                break;
            case STATES.ENCYCLOPEDIA:
                buildEncyclopediaUI('plants');
                showScreen('encyclopedia-screen');
                break;
            case STATES.REST:
                showScreen('rest-screen');
                buildRestUI(game);
                break;
            case STATES.EVENT:
                showScreen('event-screen');
                buildEventUI(game);
                break;
            case STATES.INTRO_DIALOGUE:
                // 只有当存在对话内容时才显示对话屏幕
                if (game.currentDialogue) {
                    showScreen('dialogue-screen');
                    buildDialogueUI(game);
                } else {
                    // 没有对话内容，直接进入塔地图
                    game.introCompleted = true;
                    game.setState(STATES.TOWER_MAP);
                }
                break;
            case STATES.DIALOGUE:
                // 只有当存在对话内容时才显示对话屏幕
                if (game.currentDialogue) {
                    showScreen('dialogue-screen');
                    buildDialogueUI(game);
                } else {
                    // 没有对话内容，返回塔地图
                    game.setState(STATES.TOWER_MAP);
                }
                break;
            case STATES.ACHIEVEMENTS:
                showScreen('achievements-screen');
                buildAchievementsUI(game);
                break;
            case STATES.SAVE_MANAGER:
                buildSaveManagerUI(game);
                showScreen('save-manager-screen');
                break;
        }
    };
}

// ── Main entry ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    showLoading();

    // Check WebGL support
    if (!isWebGLSupported()) {
        showError('您的浏览器不支持 WebGL 或 WebGL 上下文不可用，请使用最新版 Chrome、Firefox 或 Edge 浏览器，并确保已启用硬件加速。');
        return;
    }

    const canvas = $('#game-canvas');
    if (!canvas) {
        console.error('PVZ: canvas#game-canvas not found');
        showError('画布元素 #game-canvas 未找到，页面可能加载不完整，请刷新重试。');
        return;
    }

    // 显式设置 canvas 的渲染缓冲区尺寸（必须与 renderer 的 setSize 一致）
    // 否则浏览器会使用默认 300x150，导致第5行被截断、坐标错位
    canvas.width = 1000;
    canvas.height = 720;

    // Prevent mobile touch scrolling on canvas
    preventTouchDefaults();

    // Create game instance
    const game = new Game();

    try {
        game.init(canvas);
    } catch (err) {
        console.error('PVZ: Game initialization failed', err);
        showError(`游戏初始化失败：${err && err.name ? err.name : 'Error'} - ${err && err.message ? err.message : String(err)}`);
        return;
    }

    // Expose for debugging
    window.pvzGame = game;

    // Setup keyboard shortcuts
    setupKeyboardShortcuts(game);

    // Setup UI buttons
    setupUIButtons(game);

    // Setup encyclopedia tabs
    setupEncyclopediaTabs();

    // Observe state changes for screen transitions
    observeGameState(game);

    // Window resize handler
    window.addEventListener('resize', () => {
        if (game.renderer) {
            game.renderer.resize(window.innerWidth, window.innerHeight);
        }
    });

    // Hide loading screen after a short delay to allow initial render
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            hideLoading();
            // 通过 setState 触发 observer，确保继续按钮可见性等逻辑正确执行
            game.setState(STATES.MENU);
        });
    });

    // Start the game loop (renders even in menu state)
    game.run();
});
