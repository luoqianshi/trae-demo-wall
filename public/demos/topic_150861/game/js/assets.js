(function() {
    const FRAME_W = 96;
    const FRAME_H = 96;
    const ANCHOR_X = 48;
    const ANCHOR_Y = 92;

    const ANIMATIONS = {
        huying: {
            idle: { frame_count: 8, fps: 6, loop: true },
            walk: { frame_count: 8, fps: 5, loop: true },
            attack: { frame_count: 10, fps: 10, loop: false, hit_frame: 5 }
        },
        zilong: {
            idle: { frame_count: 8, fps: 6, loop: true },
            walk: { frame_count: 8, fps: 5, loop: true },
            attack: { frame_count: 10, fps: 10, loop: false, hit_frame: 5 }
        },
        zengbo: {
            idle: { frame_count: 8, fps: 6, loop: true },
            walk: { frame_count: 8, fps: 5, loop: true },
            attack: { frame_count: 10, fps: 10, loop: false, hit_frame: 5 }
        },
        shuangyang: {
            idle: { frame_count: 8, fps: 6, loop: true },
            walk: { frame_count: 8, fps: 5, loop: true },
            attack: { frame_count: 10, fps: 10, loop: false, hit_frame: 5 }
        },
        enemy_knife: {
            idle: { frame_count: 8, fps: 6, loop: true },
            attack: { frame_count: 10, fps: 10, loop: false, hit_frame: 5, flipAttack: true }
        },
        enemy_gun: {
            idle: { frame_count: 8, fps: 6, loop: true },
            attack: { frame_count: 10, fps: 10, loop: false, hit_frame: 5, flipAttack: true }
        }
    };

    const ASSET_PATHS = {
        background: 'assets/plaza_bg_1280x720.jpg',
        relics: {
            huying: 'assets/relics/huying.png',
            zilong: 'assets/relics/zilongding.png',
            zengbo: 'assets/relics/zengbokefu.png',
            shuangyang: 'assets/relics/shuangyangzun.png'
        },
        spirits: {
            huying: {
                basePath: 'assets/spirits/huying_xiaoshan/',
                sheetPrefix: 'huying',
                animations: ['idle', 'walk', 'attack'],
                stats: {
                    name: '虎鎣·啸山',
                    cost: 2,
                    type: 'burst',
                    hp: 14,
                    attack: 10,
                    defense: 3,
                    speed: 55,
                    attack_type: 'melee',
                    flipX: true
                }
            },
            zilong: {
                basePath: 'assets/spirits/zilong_qingtian/',
                sheetPrefix: 'sprite',
                animations: ['idle', 'walk', 'attack'],
                stats: {
                    name: '子龙·擎天',
                    cost: 2,
                    type: 'tank',
                    hp: 22,
                    attack: 3,
                    defense: 12,
                    speed: 20,
                    attack_type: 'melee',
                    flipX: false
                }
            },
            zengbo: {
                basePath: 'assets/spirits/zengbo_mingxin/',
                sheetPrefix: 'sprite',
                animations: ['idle', 'walk', 'attack'],
                stats: {
                    name: '曾伯·铭心',
                    cost: 1,
                    type: 'support',
                    hp: 15,
                    attack: 2,
                    defense: 1,
                    speed: 16,
                    attack_type: 'melee',
                    flipX: true
                }
            },
            shuangyang: {
                basePath: 'assets/spirits/shuangyang_dijiao/',
                sheetPrefix: 'sprite',
                animations: ['idle', 'walk', 'attack'],
                stats: {
                    name: '双羊·抵角',
                    cost: 2,
                    type: 'warrior',
                    hp: 16,
                    attack: 7,
                    defense: 6,
                    speed: 35,
                    attack_type: 'melee',
                    flipX: true
                }
            }
        },
        enemies: {
            enemy_knife: {
                basePath: 'assets/enemies/enemy_knife/',
                sheetPrefix: 'sprite',
                animations: ['idle', 'attack'],
                stats: {
                    name: '巡兵·刀卒',
                    type: 'tank',
                    hp: 40,
                    attack: 14,
                    defense: 5,
                    attack_type: 'melee',
                    range: 120,
                    speed: 0,
                    flipX: true
                }
            },
            enemy_gun: {
                basePath: 'assets/enemies/enemy_gun/',
                sheetPrefix: 'sprite',
                animations: ['idle', 'attack'],
                stats: {
                    name: '巡兵·火铳',
                    type: 'ranged',
                    hp: 22,
                    attack: 12,
                    defense: 2,
                    attack_type: 'ranged',
                    range: 400,
                    speed: 0,
                    flipX: true
                }
            }
        }
    };

    function buildConfig(animDef) {
        const cfg = {
            frame_width: FRAME_W,
            frame_height: FRAME_H,
            anchor_x: ANCHOR_X,
            anchor_y: ANCHOR_Y,
            frame_count: animDef.frame_count,
            fps: animDef.fps,
            loop: animDef.loop
        };
        if (animDef.hit_frame !== undefined) {
            cfg.hit_frame = animDef.hit_frame;
        }
        if (animDef.flipAttack === true) {
            cfg.flipAttack = true;
        }
        return cfg;
    }

    const AssetManager = {
        loaded: false,
        assets: null,
        totalAssets: 0,
        loadedAssets: 0,
        loadingElement: null,

        loadImage: function(src) {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    this.loadedAssets++;
                    this.updateProgress();
                    resolve(img);
                };
                img.onerror = () => {
                    console.warn('Failed to load image:', src);
                    this.loadedAssets++;
                    this.updateProgress();
                    resolve(null);
                };
                img.src = src;
            });
        },

        updateProgress: function() {
            if (this.loadingElement) {
                const percent = Math.floor((this.loadedAssets / this.totalAssets) * 100);
                this.loadingElement.textContent = `Loading... ${percent}%`;
            }
        },

        countImages: function() {
            let count = 1;
            count += Object.keys(ASSET_PATHS.relics).length;
            for (const key in ASSET_PATHS.spirits) {
                count += ASSET_PATHS.spirits[key].animations.length;
            }
            for (const key in ASSET_PATHS.enemies) {
                count += ASSET_PATHS.enemies[key].animations.length;
            }
            return count;
        },

        loadAll: async function() {
            if (this.loaded) {
                return this.assets;
            }

            this.loadingElement = document.getElementById('loading-overlay');
            this.totalAssets = this.countImages();
            this.loadedAssets = 0;
            this.updateProgress();

            const assets = {
                background: null,
                relics: {},
                spirits: {},
                enemies: {}
            };

            const loadTasks = [];
            const imageMap = {};

            loadTasks.push(
                this.loadImage(ASSET_PATHS.background).then(img => {
                    assets.background = img;
                })
            );

            for (const relicKey in ASSET_PATHS.relics) {
                loadTasks.push(
                    this.loadImage(ASSET_PATHS.relics[relicKey]).then(img => {
                        assets.relics[relicKey] = img;
                    })
                );
            }

            for (const spiritKey in ASSET_PATHS.spirits) {
                const def = ASSET_PATHS.spirits[spiritKey];
                assets.spirits[spiritKey] = { stats: { ...def.stats } };

                for (const animName of def.animations) {
                    const sheetFile = `${def.sheetPrefix}_${animName}_sheet.png`;
                    const sheetPath = def.basePath + sheetFile;
                    const taskKey = `${spiritKey}_${animName}`;
                    loadTasks.push(
                        this.loadImage(sheetPath).then(img => {
                            imageMap[taskKey] = img;
                        })
                    );
                }
            }

            for (const enemyKey in ASSET_PATHS.enemies) {
                const def = ASSET_PATHS.enemies[enemyKey];
                assets.enemies[enemyKey] = { stats: { ...def.stats } };

                for (const animName of def.animations) {
                    const sheetFile = `${def.sheetPrefix}_${animName}_sheet.png`;
                    const sheetPath = def.basePath + sheetFile;
                    const taskKey = `${enemyKey}_${animName}`;
                    loadTasks.push(
                        this.loadImage(sheetPath).then(img => {
                            imageMap[taskKey] = img;
                        })
                    );
                }
            }

            await Promise.all(loadTasks);

            for (const spiritKey in ASSET_PATHS.spirits) {
                const def = ASSET_PATHS.spirits[spiritKey];
                const animDefs = ANIMATIONS[spiritKey];
                for (const animName of def.animations) {
                    const config = buildConfig(animDefs[animName]);
                    const img = imageMap[`${spiritKey}_${animName}`];
                    assets.spirits[spiritKey][animName] = { img, config };
                }
            }

            for (const enemyKey in ASSET_PATHS.enemies) {
                const def = ASSET_PATHS.enemies[enemyKey];
                const animDefs = ANIMATIONS[enemyKey];
                for (const animName of def.animations) {
                    const config = buildConfig(animDefs[animName]);
                    const img = imageMap[`${enemyKey}_${animName}`];
                    assets.enemies[enemyKey][animName] = { img, config };
                }
            }

            this.assets = assets;
            this.loaded = true;
            
            if (this.loadingElement) {
                this.loadingElement.textContent = 'Loading... 100%';
            }

            return assets;
        }
    };

    window.Assets = AssetManager;
})();
