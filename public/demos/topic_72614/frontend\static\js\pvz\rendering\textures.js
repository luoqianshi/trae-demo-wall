const THREE = window.THREE;

export class TextureGenerator {
    constructor() {
        this.textureCache = new Map();
    }

    getTexture(name, params = {}) {
        const key = params ? `${name}_${JSON.stringify(params)}` : name;
        if (this.textureCache.has(key)) {
            return this.textureCache.get(key);
        }
        const texture = this._createTexture(name, params);
        if (texture) {
            this.textureCache.set(key, texture);
        }
        return texture;
    }

    _createCanvas(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        return canvas;
    }

    _makeTexture(canvas) {
        const tex = new THREE.CanvasTexture(canvas);
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.needsUpdate = true;
        return tex;
    }

    _createTexture(name, params) {
        const plantTextures = {
            peashooter: () => this._drawPeashooter(),
            sunflower: () => this._drawSunflower(),
            snow_pea: () => this._drawSnowPea(),
            wall_nut: () => this._drawWallNut(),
            cherry_bomb: () => this._drawCherryBomb(),
            potato_mine: () => this._drawPotatoMine(),
            chomper: () => this._drawChomper(),
            repeater: () => this._drawRepeater(),
            puff_shroom: () => this._drawPuffShroom(),
            sun_shroom: () => this._drawSunShroom(),
            fume_shroom: () => this._drawFumeShroom(),
            grave_buster: () => this._drawGraveBuster(),
            hypno_shroom: () => this._drawHypnoShroom(),
            scaredy_shroom: () => this._drawScaredyShroom(),
            ice_shroom: () => this._drawIceShroom(),
            doom_shroom: () => this._drawDoomShroom(),
            lilypad: () => this._drawLilypad(),
            squash: () => this._drawSquash(),
            threepeater: () => this._drawThreepeater(),
            tangle_kelp: () => this._drawTangleKelp(),
            jalapeno: () => this._drawJalapeno(),
            spikeweed: () => this._drawSpikeweed(),
            torchwood: () => this._drawTorchwood(),
            tall_nut: () => this._drawTallNut(),
            sea_shroom: () => this._drawSeaShroom(),
            plantern: () => this._drawPlantern(),
            cactus: () => this._drawCactus(),
            blover: () => this._drawBlover(),
            split_pea: () => this._drawSplitPea(),
            starfruit: () => this._drawStarfruit(),
            pumpkin: () => this._drawPumpkin(),
            magnet_shroom: () => this._drawMagnetShroom(),
            cabbage_pult: () => this._drawCabbagePult(),
            flower_pot: () => this._drawFlowerPot(),
            kernel_pult: () => this._drawKernelPult(),
            coffee_bean: () => this._drawCoffeeBean(),
            garlic: () => this._drawGarlic(),
            umbrella_leaf: () => this._drawUmbrellaLeaf(),
            marigold: () => this._drawMarigold(),
            melon_pult: () => this._drawMelonPult(),
            gatling_pea: () => this._drawGatlingPea(),
            twin_sunflower: () => this._drawTwinSunflower(),
            gloom_shroom: () => this._drawGloomShroom(),
            cattail: () => this._drawCattail(),
            winter_melon: () => this._drawWinterMelon(),
            gold_magnet: () => this._drawGoldMagnet(),
            spikerock: () => this._drawSpikerock(),
            cob_cannon: () => this._drawCobCannon(),
            imitater: () => this._drawImitater()
        };

        const zombieTextures = {
            normal_zombie: () => this._drawNormalZombie(),
            cone_zombie: () => this._drawConeZombie(),
            bucket_zombie: () => this._drawBucketZombie(),
            miner_zombie: () => this._drawMinerZombie(),
            football_zombie: () => this._drawFootballZombie(),
            diving_zombie: () => this._drawDivingZombie(),
            balloon_zombie: () => this._drawBalloonZombie(),
            pole_zombie: () => this._drawPoleZombie(),
            newspaper_zombie: () => this._drawNewspaperZombie(),
            giftbox_zombie: () => this._drawGiftboxZombie(),
            zamboni_zombie: () => this._drawZamboniZombie(),
            diamond_zombie: () => this._drawDiamondZombie(),
            gargantuar: () => this._drawGargantuar(),
            frost_giant: () => this._drawFrostGiant(),
            edgar_ii: () => this._drawEdgarII()
        };

        const projectileTextures = {
            pea: () => this._drawPea(),
            ice_pea: () => this._drawIcePea(),
            fire_pea: () => this._drawFirePea(),
            cabbage: () => this._drawCabbage(),
            corn: () => this._drawCorn(),
            melon: () => this._drawMelonProjectile(),
            ice_melon: () => this._drawIceMelon(),
            spore: () => this._drawSpore(),
            star: () => this._drawStarProjectile(),
            metal_pea: () => this._drawMetalPea(),
            butter: () => this._drawButter(),
            cob: () => this._drawCobProjectile()
        };

        const sunlightTextures = {
            sun: () => this._drawSun()
        };

        const allTextures = { ...plantTextures, ...zombieTextures, ...projectileTextures, ...sunlightTextures };

        if (allTextures[name]) {
            return allTextures[name]();
        }
        console.warn(`Unknown texture: ${name}`);
        return this._drawPlaceholder();
    }

    // === Helper drawing methods ===

    _drawCircle(ctx, x, y, r, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawRect(ctx, x, y, w, h, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
    }

    _drawEllipse(ctx, x, y, rx, ry, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawEye(ctx, x, y, size) {
        this._drawCircle(ctx, x, y, size, '#ffffff');
        this._drawCircle(ctx, x + size * 0.3, y, size * 0.5, '#000000');
    }

    _drawMouth(ctx, x, y, w, h, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    _drawZombieBase(ctx, size) {
        // Head
        this._drawCircle(ctx, 32, 20, 14, '#7a8a5a');
        // Eyes
        this._drawEye(ctx, 27, 18, 3);
        this._drawEye(ctx, 37, 18, 3);
        // Mouth
        this._drawMouth(ctx, 32, 27, 5, 3, '#3a3a2a');
        // Body
        this._drawRect(ctx, 22, 34, 20, 18, '#8b6914');
        // Arms
        this._drawRect(ctx, 14, 36, 8, 4, '#7a8a5a');
        this._drawRect(ctx, 42, 36, 8, 4, '#7a8a5a');
        // Legs
        this._drawRect(ctx, 24, 52, 6, 10, '#4a4a3a');
        this._drawRect(ctx, 34, 52, 6, 10, '#4a4a3a');
    }

    _drawMushroomBase(ctx, capColor, stemColor, capSize) {
        // Stem
        this._drawRect(ctx, 28, 36, 8, 22, stemColor);
        // Cap
        ctx.fillStyle = capColor;
        ctx.beginPath();
        ctx.arc(32, 32, capSize, Math.PI, 0);
        ctx.fill();
        // Spots
        this._drawCircle(ctx, 24, 28, 2, '#ffffff');
        this._drawCircle(ctx, 36, 26, 2, '#ffffff');
        this._drawCircle(ctx, 30, 24, 1.5, '#ffffff');
        // Eyes
        this._drawEye(ctx, 28, 34, 2);
        this._drawEye(ctx, 36, 34, 2);
    }

    _drawCatapultBase(ctx, projectileColor) {
        // Base
        this._drawRect(ctx, 12, 44, 40, 8, '#8b6914');
        // Wheels
        this._drawCircle(ctx, 20, 54, 5, '#5a5a5a');
        this._drawCircle(ctx, 44, 54, 5, '#5a5a5a');
        // Arm
        ctx.strokeStyle = '#6b4914';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(32, 44);
        ctx.lineTo(32, 28);
        ctx.lineTo(44, 24);
        ctx.stroke();
        // Projectile
        this._drawCircle(ctx, 44, 22, 5, projectileColor);
    }

    // === Plant Textures (64x64) ===

    _drawPeashooter() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        // Stem
        this._drawRect(ctx, 28, 36, 8, 24, '#2d8a2d');
        // Leaves
        this._drawEllipse(ctx, 22, 48, 8, 4, '#3aaa3a');
        this._drawEllipse(ctx, 42, 46, 8, 4, '#3aaa3a');
        // Body
        this._drawCircle(ctx, 32, 28, 16, '#4cc64c');
        // Mouth tube
        this._drawRect(ctx, 42, 24, 16, 8, '#2d8a2d');
        this._drawCircle(ctx, 56, 28, 5, '#2d8a2d');
        // Eye
        this._drawEye(ctx, 28, 24, 4);
        return this._makeTexture(c);
    }

    _drawSunflower() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        // Stem
        this._drawRect(ctx, 30, 40, 4, 20, '#2d8a2d');
        // Leaves
        this._drawEllipse(ctx, 24, 50, 8, 4, '#3aaa3a');
        this._drawEllipse(ctx, 40, 48, 8, 4, '#3aaa3a');
        // Petals
        const petalColors = ['#ffdd00', '#ffcc00', '#ffbb00'];
        for (let i = 0; i < 10; i++) {
            const angle = (i / 10) * Math.PI * 2;
            const px = 32 + Math.cos(angle) * 14;
            const py = 26 + Math.sin(angle) * 14;
            this._drawEllipse(ctx, px, py, 7, 4, petalColors[i % 3]);
            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(angle);
            ctx.restore();
        }
        // Center
        this._drawCircle(ctx, 32, 26, 9, '#8b6914');
        // Face
        this._drawEye(ctx, 28, 24, 2);
        this._drawEye(ctx, 36, 24, 2);
        this._drawMouth(ctx, 32, 29, 3, 2, '#5a3a00');
        return this._makeTexture(c);
    }

    _drawSnowPea() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        // Stem
        this._drawRect(ctx, 28, 36, 8, 24, '#2a6a8a');
        // Leaves
        this._drawEllipse(ctx, 22, 48, 8, 4, '#3a8aaa');
        this._drawEllipse(ctx, 42, 46, 8, 4, '#3a8aaa');
        // Body
        this._drawCircle(ctx, 32, 28, 16, '#6ac6ea');
        // Mouth tube
        this._drawRect(ctx, 42, 24, 16, 8, '#2a6a8a');
        this._drawCircle(ctx, 56, 28, 5, '#2a6a8a');
        // Ice crystals
        this._drawCircle(ctx, 22, 20, 3, '#aaeeff');
        this._drawCircle(ctx, 40, 16, 2, '#aaeeff');
        // Eye
        this._drawEye(ctx, 28, 24, 4);
        return this._makeTexture(c);
    }

    _drawWallNut() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        // Body
        this._drawEllipse(ctx, 32, 32, 20, 26, '#c68642');
        // Crack lines
        ctx.strokeStyle = '#8b5a2b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(24, 20);
        ctx.lineTo(28, 30);
        ctx.lineTo(22, 40);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(38, 22);
        ctx.lineTo(40, 32);
        ctx.stroke();
        // Eyes
        this._drawEye(ctx, 26, 28, 3);
        this._drawEye(ctx, 38, 28, 3);
        // Mouth
        this._drawMouth(ctx, 32, 38, 4, 3, '#6b3a1a');
        return this._makeTexture(c);
    }

    _drawCherryBomb() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        // Stems
        ctx.strokeStyle = '#2d8a2d';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(22, 24);
        ctx.quadraticCurveTo(32, 8, 42, 24);
        ctx.stroke();
        // Leaf
        this._drawEllipse(ctx, 32, 10, 6, 3, '#3aaa3a');
        // Left cherry
        this._drawCircle(ctx, 22, 36, 14, '#cc2222');
        this._drawEye(ctx, 18, 33, 3);
        this._drawEye(ctx, 26, 33, 3);
        this._drawMouth(ctx, 22, 40, 4, 3, '#880000');
        // Right cherry
        this._drawCircle(ctx, 42, 36, 14, '#cc2222');
        this._drawEye(ctx, 38, 33, 3);
        this._drawEye(ctx, 46, 33, 3);
        this._drawMouth(ctx, 42, 40, 4, 3, '#880000');
        return this._makeTexture(c);
    }

    _drawPotatoMine() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        // Body
        this._drawEllipse(ctx, 32, 40, 18, 16, '#8b6914');
        // Dirt spots
        this._drawCircle(ctx, 24, 36, 3, '#6b4914');
        this._drawCircle(ctx, 40, 44, 4, '#6b4914');
        // Fuse
        ctx.strokeStyle = '#4a4a3a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(32, 24);
        ctx.quadraticCurveTo(38, 18, 36, 12);
        ctx.stroke();
        // Spark
        this._drawCircle(ctx, 36, 10, 3, '#ffaa00');
        this._drawCircle(ctx, 36, 10, 2, '#ff4400');
        // Eyes
        this._drawEye(ctx, 26, 36, 3);
        this._drawEye(ctx, 38, 36, 3);
        return this._makeTexture(c);
    }

    _drawChomper() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        // Stem
        this._drawRect(ctx, 28, 40, 8, 20, '#5a2a6a');
        // Leaves
        this._drawEllipse(ctx, 20, 50, 10, 4, '#7a3a8a');
        this._drawEllipse(ctx, 44, 48, 10, 4, '#7a3a8a');
        // Head
        this._drawCircle(ctx, 32, 26, 18, '#8a3aaa');
        // Upper jaw
        ctx.fillStyle = '#6a2a8a';
        ctx.beginPath();
        ctx.arc(32, 26, 18, Math.PI, 0);
        ctx.fill();
        // Teeth
        for (let i = 0; i < 5; i++) {
            this._drawRect(ctx, 16 + i * 7, 26, 4, 6, '#ffffff');
        }
        // Eye
        this._drawEye(ctx, 26, 20, 4);
        this._drawEye(ctx, 38, 20, 4);
        return this._makeTexture(c);
    }

    _drawRepeater() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        // Stem
        this._drawRect(ctx, 28, 36, 8, 24, '#2d8a2d');
        // Leaves
        this._drawEllipse(ctx, 22, 48, 8, 4, '#3aaa3a');
        this._drawEllipse(ctx, 42, 46, 8, 4, '#3aaa3a');
        // Body
        this._drawCircle(ctx, 32, 28, 16, '#4cc64c');
        // Double tubes
        this._drawRect(ctx, 42, 20, 16, 6, '#2d8a2d');
        this._drawRect(ctx, 42, 30, 16, 6, '#2d8a2d');
        this._drawCircle(ctx, 56, 23, 4, '#2d8a2d');
        this._drawCircle(ctx, 56, 33, 4, '#2d8a2d');
        // Eye
        this._drawEye(ctx, 28, 24, 4);
        return this._makeTexture(c);
    }

    _drawPuffShroom() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        this._drawMushroomBase(ctx, '#e8e8e8', '#cccccc', 14);
        return this._makeTexture(c);
    }

    _drawSunShroom() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        this._drawMushroomBase(ctx, '#ffdd00', '#ccaa00', 14);
        return this._makeTexture(c);
    }

    _drawFumeShroom() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        // Stem
        this._drawRect(ctx, 26, 38, 12, 22, '#9a7aaa');
        // Cap
        this._drawCircle(ctx, 32, 30, 18, '#8a5aaa');
        // Fume cloud
        this._drawCircle(ctx, 48, 22, 8, 'rgba(160,100,200,0.5)');
        this._drawCircle(ctx, 52, 30, 6, 'rgba(160,100,200,0.4)');
        // Eyes
        this._drawEye(ctx, 26, 30, 3);
        this._drawEye(ctx, 38, 30, 3);
        return this._makeTexture(c);
    }

    _drawGraveBuster() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        // Stem
        this._drawRect(ctx, 28, 30, 8, 30, '#3a3a2a');
        // Head
        this._drawCircle(ctx, 32, 24, 14, '#4a4a3a');
        // Teeth
        for (let i = 0; i < 4; i++) {
            this._drawRect(ctx, 22 + i * 6, 30, 4, 5, '#ffffff');
        }
        // Eyes
        this._drawCircle(ctx, 26, 22, 3, '#ff0000');
        this._drawCircle(ctx, 38, 22, 3, '#ff0000');
        return this._makeTexture(c);
    }

    _drawHypnoShroom() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        // Stem
        this._drawRect(ctx, 28, 38, 8, 22, '#9a7aaa');
        // Cap
        this._drawCircle(ctx, 32, 30, 16, '#8a4aaa');
        // Swirl
        ctx.strokeStyle = '#cc88ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 4; a += 0.1) {
            const r = a * 2;
            const px = 32 + Math.cos(a) * r;
            const py = 28 + Math.sin(a) * r;
            if (a === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.stroke();
        // Eyes
        this._drawEye(ctx, 27, 34, 2);
        this._drawEye(ctx, 37, 34, 2);
        return this._makeTexture(c);
    }

    _drawScaredyShroom() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        // Stem
        this._drawRect(ctx, 28, 38, 8, 22, '#5aaa5a');
        // Cap (hiding)
        this._drawEllipse(ctx, 32, 32, 16, 14, '#4aaa4a');
        // Eyes (scared, wide)
        this._drawCircle(ctx, 26, 30, 4, '#ffffff');
        this._drawCircle(ctx, 38, 30, 4, '#ffffff');
        this._drawCircle(ctx, 27, 30, 2, '#000000');
        this._drawCircle(ctx, 39, 30, 2, '#000000');
        // Mouth (O shape)
        this._drawCircle(ctx, 32, 38, 3, '#2a6a2a');
        return this._makeTexture(c);
    }

    _drawIceShroom() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        this._drawMushroomBase(ctx, '#6ac6ea', '#4aa6ca', 14);
        // Ice crystals
        this._drawCircle(ctx, 20, 18, 3, '#aaeeff');
        this._drawCircle(ctx, 44, 20, 2, '#aaeeff');
        return this._makeTexture(c);
    }

    _drawDoomShroom() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        // Stem
        this._drawRect(ctx, 26, 38, 12, 22, '#5a2a2a');
        // Cap
        this._drawCircle(ctx, 32, 28, 18, '#8a2a2a');
        // Skull
        this._drawCircle(ctx, 32, 24, 6, '#cccccc');
        this._drawCircle(ctx, 29, 22, 2, '#000000');
        this._drawCircle(ctx, 35, 22, 2, '#000000');
        this._drawRect(ctx, 29, 27, 6, 2, '#000000');
        // Dark clouds
        this._drawCircle(ctx, 18, 16, 6, '#3a1a1a');
        this._drawCircle(ctx, 46, 14, 6, '#3a1a1a');
        return this._makeTexture(c);
    }

    _drawLilypad() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        // Water
        this._drawCircle(ctx, 32, 32, 28, '#4488cc');
        // Pad
        this._drawCircle(ctx, 32, 32, 22, '#3aaa3a');
        // Notch
        ctx.fillStyle = '#4488cc';
        ctx.beginPath();
        ctx.moveTo(32, 32);
        ctx.lineTo(32, 10);
        ctx.lineTo(40, 16);
        ctx.closePath();
        ctx.fill();
        // Veins
        ctx.strokeStyle = '#2d8a2d';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(32, 32);
        ctx.lineTo(16, 20);
        ctx.moveTo(32, 32);
        ctx.lineTo(48, 20);
        ctx.moveTo(32, 32);
        ctx.lineTo(20, 44);
        ctx.stroke();
        return this._makeTexture(c);
    }

    _drawSquash() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        // Body
        this._drawEllipse(ctx, 32, 36, 18, 22, '#e87820');
        // Ridges
        ctx.strokeStyle = '#c06010';
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.ellipse(32, 36, 18 - i * 3, 22 - i * 3, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
        // Stem
        this._drawRect(ctx, 30, 12, 4, 8, '#2d8a2d');
        // Eyes (angry)
        this._drawEye(ctx, 26, 32, 3);
        this._drawEye(ctx, 38, 32, 3);
        // Angry brows
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(22, 28);
        ctx.lineTo(28, 30);
        ctx.moveTo(42, 28);
        ctx.lineTo(36, 30);
        ctx.stroke();
        return this._makeTexture(c);
    }

    _drawThreepeater() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        // Stem
        this._drawRect(ctx, 28, 36, 8, 24, '#2d8a2d');
        // Body
        this._drawCircle(ctx, 32, 28, 14, '#4cc64c');
        // Three tubes
        this._drawRect(ctx, 42, 12, 14, 5, '#2d8a2d');
        this._drawRect(ctx, 42, 26, 14, 5, '#2d8a2d');
        this._drawRect(ctx, 42, 40, 14, 5, '#2d8a2d');
        this._drawCircle(ctx, 54, 14, 3, '#2d8a2d');
        this._drawCircle(ctx, 54, 28, 3, '#2d8a2d');
        this._drawCircle(ctx, 54, 42, 3, '#2d8a2d');
        // Eye
        this._drawEye(ctx, 28, 24, 3);
        return this._makeTexture(c);
    }

    _drawTangleKelp() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        // Water
        this._drawRect(ctx, 0, 40, 64, 24, '#4488cc');
        // Kelp strands
        ctx.strokeStyle = '#2d8a2d';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(20, 60);
        ctx.quadraticCurveTo(16, 40, 22, 20);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(32, 60);
        ctx.quadraticCurveTo(36, 36, 30, 16);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(44, 60);
        ctx.quadraticCurveTo(48, 42, 42, 22);
        ctx.stroke();
        // Leaves
        this._drawEllipse(ctx, 22, 18, 6, 3, '#3aaa3a');
        this._drawEllipse(ctx, 30, 14, 6, 3, '#3aaa3a');
        this._drawEllipse(ctx, 42, 20, 6, 3, '#3aaa3a');
        return this._makeTexture(c);
    }

    _drawJalapeno() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        // Pepper body
        ctx.fillStyle = '#cc2200';
        ctx.beginPath();
        ctx.moveTo(28, 56);
        ctx.quadraticCurveTo(16, 36, 24, 16);
        ctx.quadraticCurveTo(32, 8, 40, 16);
        ctx.quadraticCurveTo(48, 36, 36, 56);
        ctx.closePath();
        ctx.fill();
        // Stem
        this._drawRect(ctx, 30, 8, 4, 8, '#2d8a2d');
        // Flames
        this._drawCircle(ctx, 24, 14, 4, '#ff6600');
        this._drawCircle(ctx, 38, 12, 3, '#ffaa00');
        this._drawCircle(ctx, 30, 10, 3, '#ff4400');
        // Eyes (angry)
        this._drawEye(ctx, 28, 30, 3);
        this._drawEye(ctx, 36, 30, 3);
        return this._makeTexture(c);
    }

    _drawSpikeweed() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        // Base
        this._drawEllipse(ctx, 32, 44, 24, 8, '#8a8a8a');
        // Spikes
        ctx.fillStyle = '#6a6a6a';
        for (let i = 0; i < 7; i++) {
            const x = 12 + i * 7;
            ctx.beginPath();
            ctx.moveTo(x, 44);
            ctx.lineTo(x + 3, 28);
            ctx.lineTo(x + 6, 44);
            ctx.closePath();
            ctx.fill();
        }
        return this._makeTexture(c);
    }

    _drawTorchwood() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        // Stump
        this._drawRect(ctx, 20, 32, 24, 28, '#8b6914');
        this._drawRect(ctx, 18, 32, 28, 4, '#6b4914');
        // Fire
        this._drawCircle(ctx, 32, 22, 10, '#ff6600');
        this._drawCircle(ctx, 28, 18, 6, '#ffaa00');
        this._drawCircle(ctx, 36, 16, 5, '#ffdd00');
        this._drawCircle(ctx, 32, 14, 4, '#ffffff');
        return this._makeTexture(c);
    }

    _drawTallNut() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        // Body (tall)
        this._drawEllipse(ctx, 32, 32, 16, 28, '#c68642');
        // Crack lines
        ctx.strokeStyle = '#8b5a2b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(24, 12);
        ctx.lineTo(28, 24);
        ctx.lineTo(22, 36);
        ctx.lineTo(26, 48);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(40, 16);
        ctx.lineTo(38, 28);
        ctx.stroke();
        // Eyes
        this._drawEye(ctx, 26, 26, 3);
        this._drawEye(ctx, 38, 26, 3);
        // Mouth
        this._drawMouth(ctx, 32, 36, 4, 3, '#6b3a1a');
        return this._makeTexture(c);
    }

    _drawSeaShroom() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        // Water
        this._drawRect(ctx, 0, 44, 64, 20, '#4488cc');
        // Stem
        this._drawRect(ctx, 28, 38, 8, 14, '#6a9aba');
        // Cap
        ctx.fillStyle = '#5aaaca';
        ctx.beginPath();
        ctx.arc(32, 34, 14, Math.PI, 0);
        ctx.fill();
        // Eyes
        this._drawEye(ctx, 28, 36, 2);
        this._drawEye(ctx, 36, 36, 2);
        return this._makeTexture(c);
    }

    _drawPlantern() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        // Post
        this._drawRect(ctx, 30, 20, 4, 40, '#6b4914');
        // Base
        this._drawRect(ctx, 24, 56, 16, 4, '#6b4914');
        // Lamp
        this._drawRect(ctx, 22, 14, 20, 12, '#ffdd00');
        this._drawRect(ctx, 20, 12, 24, 4, '#8b6914');
        // Light glow
        this._drawCircle(ctx, 32, 20, 6, 'rgba(255,255,200,0.6)');
        return this._makeTexture(c);
    }

    _drawCactus() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        // Main body
        this._drawRect(ctx, 24, 16, 16, 40, '#3aaa3a');
        // Arms
        this._drawRect(ctx, 12, 24, 12, 8, '#3aaa3a');
        this._drawRect(ctx, 12, 20, 4, 12, '#3aaa3a');
        this._drawRect(ctx, 40, 30, 12, 8, '#3aaa3a');
        this._drawRect(ctx, 48, 26, 4, 12, '#3aaa3a');
        // Spikes
        ctx.fillStyle = '#ffdd00';
        for (let i = 0; i < 6; i++) {
            this._drawRect(ctx, 24, 18 + i * 6, 2, 3, '#ffdd00');
            this._drawRect(ctx, 38, 20 + i * 6, 2, 3, '#ffdd00');
        }
        // Eyes
        this._drawEye(ctx, 28, 28, 3);
        this._drawEye(ctx, 36, 28, 3);
        return this._makeTexture(c);
    }

    _drawBlover() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        // Stem
        this._drawRect(ctx, 30, 40, 4, 20, '#2d8a2d');
        // Fan blades
        ctx.fillStyle = '#4cc64c';
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            ctx.save();
            ctx.translate(32, 28);
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.ellipse(0, -12, 5, 12, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        // Center
        this._drawCircle(ctx, 32, 28, 6, '#2d8a2d');
        // Eyes
        this._drawEye(ctx, 29, 28, 2);
        this._drawEye(ctx, 35, 28, 2);
        return this._makeTexture(c);
    }

    _drawSplitPea() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        // Stem
        this._drawRect(ctx, 28, 36, 8, 24, '#2d8a2d');
        // Body
        this._drawCircle(ctx, 32, 28, 14, '#4cc64c');
        // Front tube (right)
        this._drawRect(ctx, 42, 24, 14, 6, '#2d8a2d');
        this._drawCircle(ctx, 54, 27, 4, '#2d8a2d');
        // Back tube (left)
        this._drawRect(ctx, 8, 24, 14, 6, '#2d8a2d');
        this._drawCircle(ctx, 10, 27, 4, '#2d8a2d');
        // Front eye
        this._drawEye(ctx, 34, 24, 3);
        // Back eye
        this._drawEye(ctx, 28, 24, 3);
        return this._makeTexture(c);
    }

    _drawStarfruit() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        // Star shape
        ctx.fillStyle = '#ffdd00';
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const outerAngle = (i * 2 * Math.PI / 5) - Math.PI / 2;
            const innerAngle = outerAngle + Math.PI / 5;
            const ox = 32 + Math.cos(outerAngle) * 22;
            const oy = 32 + Math.sin(outerAngle) * 22;
            const ix = 32 + Math.cos(innerAngle) * 10;
            const iy = 32 + Math.sin(innerAngle) * 10;
            if (i === 0) ctx.moveTo(ox, oy);
            else ctx.lineTo(ox, oy);
            ctx.lineTo(ix, iy);
        }
        ctx.closePath();
        ctx.fill();
        // Eyes
        this._drawEye(ctx, 28, 30, 3);
        this._drawEye(ctx, 36, 30, 3);
        return this._makeTexture(c);
    }

    _drawPumpkin() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        // Shell
        this._drawEllipse(ctx, 32, 32, 22, 24, '#e87820');
        // Ridges
        ctx.strokeStyle = '#c06010';
        ctx.lineWidth = 1;
        for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.ellipse(32 + i * 4, 32, 2, 24, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
        // Face
        this._drawEye(ctx, 26, 28, 4);
        this._drawEye(ctx, 38, 28, 4);
        this._drawMouth(ctx, 32, 38, 5, 3, '#6b3a1a');
        return this._makeTexture(c);
    }

    _drawMagnetShroom() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        // Stem
        this._drawRect(ctx, 28, 38, 8, 22, '#9a7aaa');
        // Cap
        ctx.fillStyle = '#8a5aaa';
        ctx.beginPath();
        ctx.arc(32, 34, 14, Math.PI, 0);
        ctx.fill();
        // U-magnet
        ctx.strokeStyle = '#cc2222';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(32, 18, 10, 0, Math.PI);
        ctx.stroke();
        // Magnet tips
        this._drawRect(ctx, 20, 14, 4, 6, '#cc2222');
        this._drawRect(ctx, 40, 14, 4, 6, '#4444cc');
        // Eyes
        this._drawEye(ctx, 28, 36, 2);
        this._drawEye(ctx, 36, 36, 2);
        return this._makeTexture(c);
    }

    _drawCabbagePult() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        // Cabbage on catapult
        this._drawCatapultBase(ctx, '#4cc64c');
        // Cabbage head
        this._drawCircle(ctx, 44, 18, 6, '#4cc64c');
        this._drawCircle(ctx, 44, 16, 3, '#3aaa3a');
        return this._makeTexture(c);
    }

    _drawFlowerPot() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        // Pot body
        ctx.fillStyle = '#c67a42';
        ctx.beginPath();
        ctx.moveTo(16, 24);
        ctx.lineTo(20, 56);
        ctx.lineTo(44, 56);
        ctx.lineTo(48, 24);
        ctx.closePath();
        ctx.fill();
        // Rim
        this._drawRect(ctx, 14, 20, 36, 6, '#d48a52');
        // Soil
        this._drawRect(ctx, 20, 24, 24, 4, '#5a3a1a');
        return this._makeTexture(c);
    }

    _drawKernelPult() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        this._drawCatapultBase(ctx, '#ffdd00');
        // Corn kernel
        this._drawEllipse(ctx, 44, 18, 5, 6, '#ffdd00');
        return this._makeTexture(c);
    }

    _drawCoffeeBean() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        // Bean
        this._drawEllipse(ctx, 32, 32, 16, 20, '#8b5a2b');
        // Line
        ctx.strokeStyle = '#5a3a1a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(32, 14);
        ctx.quadraticCurveTo(28, 32, 32, 50);
        ctx.stroke();
        // Eyes (awake)
        this._drawEye(ctx, 26, 28, 3);
        this._drawEye(ctx, 38, 28, 3);
        return this._makeTexture(c);
    }

    _drawGarlic() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        // Bulb
        this._drawEllipse(ctx, 32, 36, 16, 20, '#e8e0d0');
        // Cloves
        ctx.strokeStyle = '#c8c0b0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(32, 18);
        ctx.lineTo(32, 54);
        ctx.moveTo(22, 24);
        ctx.quadraticCurveTo(22, 40, 26, 52);
        ctx.moveTo(42, 24);
        ctx.quadraticCurveTo(42, 40, 38, 52);
        ctx.stroke();
        // Top
        this._drawRect(ctx, 28, 12, 8, 8, '#c8b060');
        // Eyes
        this._drawEye(ctx, 26, 32, 3);
        this._drawEye(ctx, 38, 32, 3);
        return this._makeTexture(c);
    }

    _drawUmbrellaLeaf() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        // Stem
        this._drawRect(ctx, 30, 36, 4, 24, '#2d8a2d');
        // Umbrella top
        ctx.fillStyle = '#4cc64c';
        ctx.beginPath();
        ctx.arc(32, 28, 22, Math.PI, 0);
        ctx.fill();
        // Ribs
        ctx.strokeStyle = '#2d8a2d';
        ctx.lineWidth = 1;
        for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(32, 28);
            ctx.lineTo(32 + i * 8, 6);
            ctx.stroke();
        }
        // Handle curve
        ctx.strokeStyle = '#6b4914';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(32, 28, 4, 0, Math.PI);
        ctx.stroke();
        return this._makeTexture(c);
    }

    _drawMarigold() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        // Stem
        this._drawRect(ctx, 30, 40, 4, 20, '#2d8a2d');
        // Petals (orange/yellow)
        for (let i = 0; i < 10; i++) {
            const angle = (i / 10) * Math.PI * 2;
            const px = 32 + Math.cos(angle) * 14;
            const py = 28 + Math.sin(angle) * 14;
            this._drawEllipse(ctx, px, py, 7, 4, i % 2 === 0 ? '#ff8800' : '#ffaa00');
        }
        // Center
        this._drawCircle(ctx, 32, 28, 8, '#cc6600');
        // Face
        this._drawEye(ctx, 28, 26, 2);
        this._drawEye(ctx, 36, 26, 2);
        return this._makeTexture(c);
    }

    _drawMelonPult() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        this._drawCatapultBase(ctx, '#3aaa3a');
        // Melon
        this._drawCircle(ctx, 44, 18, 7, '#3aaa3a');
        // Stripes
        ctx.strokeStyle = '#2d8a2d';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(44, 18, 5, 0, Math.PI * 2);
        ctx.stroke();
        return this._makeTexture(c);
    }

    _drawGatlingPea() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        // Stem
        this._drawRect(ctx, 28, 36, 8, 24, '#2d8a2d');
        // Body
        this._drawCircle(ctx, 32, 28, 16, '#4cc64c');
        // Four tubes
        this._drawRect(ctx, 42, 14, 16, 4, '#2d8a2d');
        this._drawRect(ctx, 42, 22, 16, 4, '#2d8a2d');
        this._drawRect(ctx, 42, 30, 16, 4, '#2d8a2d');
        this._drawRect(ctx, 42, 38, 16, 4, '#2d8a2d');
        this._drawCircle(ctx, 56, 16, 3, '#2d8a2d');
        this._drawCircle(ctx, 56, 24, 3, '#2d8a2d');
        this._drawCircle(ctx, 56, 32, 3, '#2d8a2d');
        this._drawCircle(ctx, 56, 40, 3, '#2d8a2d');
        // Eye
        this._drawEye(ctx, 28, 24, 4);
        return this._makeTexture(c);
    }

    _drawTwinSunflower() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        // Stems
        this._drawRect(ctx, 18, 40, 4, 20, '#2d8a2d');
        this._drawRect(ctx, 42, 40, 4, 20, '#2d8a2d');
        // Left sunflower
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const px = 20 + Math.cos(angle) * 10;
            const py = 24 + Math.sin(angle) * 10;
            this._drawEllipse(ctx, px, py, 5, 3, '#ffdd00');
        }
        this._drawCircle(ctx, 20, 24, 7, '#8b6914');
        this._drawEye(ctx, 17, 22, 2);
        this._drawEye(ctx, 23, 22, 2);
        // Right sunflower
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const px = 44 + Math.cos(angle) * 10;
            const py = 24 + Math.sin(angle) * 10;
            this._drawEllipse(ctx, px, py, 5, 3, '#ffdd00');
        }
        this._drawCircle(ctx, 44, 24, 7, '#8b6914');
        this._drawEye(ctx, 41, 22, 2);
        this._drawEye(ctx, 47, 22, 2);
        return this._makeTexture(c);
    }

    _drawGloomShroom() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        // Stem
        this._drawRect(ctx, 24, 38, 16, 22, '#6a4a7a');
        // Cap
        this._drawCircle(ctx, 32, 28, 20, '#7a3a9a');
        // Dark clouds
        this._drawCircle(ctx, 14, 16, 8, '#4a2a5a');
        this._drawCircle(ctx, 50, 14, 8, '#4a2a5a');
        this._drawCircle(ctx, 32, 10, 6, '#4a2a5a');
        // Fume
        this._drawCircle(ctx, 10, 22, 5, 'rgba(120,60,160,0.5)');
        this._drawCircle(ctx, 54, 20, 5, 'rgba(120,60,160,0.5)');
        // Eyes
        this._drawEye(ctx, 26, 30, 3);
        this._drawEye(ctx, 38, 30, 3);
        return this._makeTexture(c);
    }

    _drawCattail() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        // Lilypad
        this._drawCircle(ctx, 32, 48, 18, '#3aaa3a');
        // Stem
        this._drawRect(ctx, 30, 20, 4, 30, '#2d8a2d');
        // Cattail top
        this._drawEllipse(ctx, 32, 16, 6, 10, '#8b5a2b');
        // Fluff
        this._drawCircle(ctx, 32, 8, 4, '#c8a060');
        return this._makeTexture(c);
    }

    _drawWinterMelon() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        this._drawCatapultBase(ctx, '#6ac6ea');
        // Blue melon
        this._drawCircle(ctx, 44, 18, 7, '#6ac6ea');
        ctx.strokeStyle = '#4aa6ca';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(44, 18, 5, 0, Math.PI * 2);
        ctx.stroke();
        return this._makeTexture(c);
    }

    _drawGoldMagnet() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        // Stem
        this._drawRect(ctx, 28, 38, 8, 22, '#9a7aaa');
        // Cap
        ctx.fillStyle = '#8a5aaa';
        ctx.beginPath();
        ctx.arc(32, 34, 14, Math.PI, 0);
        ctx.fill();
        // Gold magnet
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(32, 18, 10, 0, Math.PI);
        ctx.stroke();
        this._drawRect(ctx, 20, 14, 4, 6, '#ffaa00');
        this._drawRect(ctx, 40, 14, 4, 6, '#ffaa00');
        // Sparkle
        this._drawCircle(ctx, 32, 22, 2, '#ffdd00');
        // Eyes
        this._drawEye(ctx, 28, 36, 2);
        this._drawEye(ctx, 36, 36, 2);
        return this._makeTexture(c);
    }

    _drawSpikerock() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        // Rock base
        this._drawEllipse(ctx, 32, 44, 24, 10, '#6a6a6a');
        // Rock texture
        this._drawCircle(ctx, 24, 42, 4, '#5a5a5a');
        this._drawCircle(ctx, 40, 40, 3, '#5a5a5a');
        // Spikes (larger)
        ctx.fillStyle = '#8a8a8a';
        for (let i = 0; i < 5; i++) {
            const x = 14 + i * 9;
            ctx.beginPath();
            ctx.moveTo(x, 44);
            ctx.lineTo(x + 4, 24);
            ctx.lineTo(x + 8, 44);
            ctx.closePath();
            ctx.fill();
        }
        return this._makeTexture(c);
    }

    _drawCobCannon() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        // Base
        this._drawRect(ctx, 8, 40, 48, 16, '#8b6914');
        // Cannon barrel
        this._drawRect(ctx, 16, 20, 32, 20, '#6b4914');
        // Corn cob inside
        this._drawEllipse(ctx, 32, 28, 10, 12, '#ffdd00');
        // Corn kernels
        for (let r = 0; r < 3; r++) {
            for (let col = 0; col < 3; col++) {
                this._drawRect(ctx, 24 + col * 6, 22 + r * 5, 4, 3, '#ffaa00');
            }
        }
        // Wheels
        this._drawCircle(ctx, 18, 56, 5, '#5a5a5a');
        this._drawCircle(ctx, 46, 56, 5, '#5a5a5a');
        return this._makeTexture(c);
    }

    _drawImitater() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        // Gray outline of a generic plant
        ctx.strokeStyle = '#aaaaaa';
        ctx.lineWidth = 2;
        // Stem
        ctx.strokeRect(28, 36, 8, 24);
        // Body
        ctx.beginPath();
        ctx.arc(32, 28, 16, 0, Math.PI * 2);
        ctx.stroke();
        // Tube
        ctx.strokeRect(42, 24, 16, 8);
        // Eye
        ctx.beginPath();
        ctx.arc(28, 24, 4, 0, Math.PI * 2);
        ctx.stroke();
        // Label
        ctx.fillStyle = '#888888';
        ctx.font = '8px sans-serif';
        ctx.fillText('?', 30, 30);
        return this._makeTexture(c);
    }

    // === Zombie Textures (64x64) ===

    _drawNormalZombie() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        this._drawZombieBase(ctx, 64);
        return this._makeTexture(c);
    }

    _drawConeZombie() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        this._drawZombieBase(ctx, 64);
        // Orange cone
        ctx.fillStyle = '#ff8800';
        ctx.beginPath();
        ctx.moveTo(20, 18);
        ctx.lineTo(32, 2);
        ctx.lineTo(44, 18);
        ctx.closePath();
        ctx.fill();
        // Cone stripes
        ctx.strokeStyle = '#cc6600';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(24, 14);
        ctx.lineTo(40, 14);
        ctx.moveTo(27, 10);
        ctx.lineTo(37, 10);
        ctx.stroke();
        return this._makeTexture(c);
    }

    _drawBucketZombie() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        this._drawZombieBase(ctx, 64);
        // Silver bucket
        ctx.fillStyle = '#c0c0c0';
        ctx.beginPath();
        ctx.moveTo(18, 18);
        ctx.lineTo(20, 4);
        ctx.lineTo(44, 4);
        ctx.lineTo(46, 18);
        ctx.closePath();
        ctx.fill();
        // Bucket rim
        this._drawRect(ctx, 16, 16, 32, 4, '#a0a0a0');
        // Handle
        ctx.strokeStyle = '#909090';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(32, 4, 10, Math.PI, 0);
        ctx.stroke();
        return this._makeTexture(c);
    }

    _drawMinerZombie() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        this._drawZombieBase(ctx, 64);
        // Hard hat
        this._drawEllipse(ctx, 32, 8, 14, 6, '#ffcc00');
        this._drawRect(ctx, 18, 8, 28, 4, '#ffcc00');
        // Lamp
        this._drawCircle(ctx, 32, 4, 3, '#ffffff');
        // Dirt
        this._drawCircle(ctx, 20, 58, 4, '#8b6914');
        this._drawCircle(ctx, 44, 56, 3, '#8b6914');
        return this._makeTexture(c);
    }

    _drawFootballZombie() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        // Helmet
        this._drawEllipse(ctx, 32, 14, 16, 14, '#4a2a2a');
        // Face guard
        ctx.strokeStyle = '#8a8a8a';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(20 + i * 6, 20);
            ctx.lineTo(20 + i * 6, 28);
            ctx.stroke();
        }
        // Body with pads
        this._drawRect(ctx, 18, 34, 28, 18, '#4a2a2a');
        // Shoulder pads
        this._drawEllipse(ctx, 14, 36, 8, 6, '#6a3a3a');
        this._drawEllipse(ctx, 50, 36, 8, 6, '#6a3a3a');
        // Eyes
        this._drawEye(ctx, 27, 18, 3);
        this._drawEye(ctx, 37, 18, 3);
        // Legs
        this._drawRect(ctx, 24, 52, 6, 10, '#4a4a3a');
        this._drawRect(ctx, 34, 52, 6, 10, '#4a4a3a');
        return this._makeTexture(c);
    }

    _drawDivingZombie() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        this._drawZombieBase(ctx, 64);
        // Snorkel mask
        this._drawRect(ctx, 20, 14, 24, 10, 'rgba(100,200,255,0.6)');
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(20, 14, 24, 10);
        // Snorkel tube
        this._drawRect(ctx, 44, 8, 4, 16, '#ffaa00');
        this._drawCircle(ctx, 46, 6, 3, '#ffaa00');
        return this._makeTexture(c);
    }

    _drawBalloonZombie() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        this._drawZombieBase(ctx, 64);
        // Balloon string
        ctx.strokeStyle = '#8a8a8a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(32, 6);
        ctx.lineTo(32, 20);
        ctx.stroke();
        // Balloon
        this._drawEllipse(ctx, 32, -2, 10, 12, '#ff4444');
        // Highlight
        this._drawCircle(ctx, 28, -6, 3, 'rgba(255,255,255,0.4)');
        return this._makeTexture(c);
    }

    _drawPoleZombie() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        this._drawZombieBase(ctx, 64);
        // Pole
        ctx.strokeStyle = '#8b6914';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(50, 0);
        ctx.lineTo(50, 60);
        ctx.stroke();
        // Pole tip
        this._drawCircle(ctx, 50, 0, 2, '#c0c0c0');
        return this._makeTexture(c);
    }

    _drawNewspaperZombie() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        this._drawZombieBase(ctx, 64);
        // Newspaper
        this._drawRect(ctx, 8, 30, 20, 28, '#e8e0d0');
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(10, 34 + i * 5);
            ctx.lineTo(26, 34 + i * 5);
            ctx.stroke();
        }
        // Glasses
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(22, 16, 8, 6);
        ctx.strokeRect(34, 16, 8, 6);
        ctx.beginPath();
        ctx.moveTo(30, 19);
        ctx.lineTo(34, 19);
        ctx.stroke();
        return this._makeTexture(c);
    }

    _drawGiftboxZombie() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        this._drawZombieBase(ctx, 64);
        // Gift box
        this._drawRect(ctx, 16, 4, 32, 20, '#ff4444');
        // Ribbon
        this._drawRect(ctx, 30, 4, 4, 20, '#ffdd00');
        this._drawRect(ctx, 16, 12, 32, 4, '#ffdd00');
        // Bow
        this._drawCircle(ctx, 28, 4, 4, '#ffdd00');
        this._drawCircle(ctx, 36, 4, 4, '#ffdd00');
        return this._makeTexture(c);
    }

    _drawZamboniZombie() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        // Zamboni body
        this._drawRect(ctx, 4, 24, 56, 24, '#4a4a8a');
        // Cab
        this._drawRect(ctx, 36, 16, 20, 12, '#5a5a9a');
        // Window
        this._drawRect(ctx, 40, 18, 12, 6, '#88ccff');
        // Wheels
        this._drawCircle(ctx, 14, 50, 6, '#3a3a3a');
        this._drawCircle(ctx, 50, 50, 6, '#3a3a3a');
        // Ice trail
        this._drawRect(ctx, 0, 50, 64, 4, 'rgba(150,200,255,0.5)');
        // Blade
        this._drawRect(ctx, 8, 48, 48, 2, '#c0c0c0');
        return this._makeTexture(c);
    }

    _drawDiamondZombie() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        this._drawZombieBase(ctx, 64);
        // Diamond shield
        ctx.fillStyle = '#44aaff';
        ctx.beginPath();
        ctx.moveTo(10, 30);
        ctx.lineTo(18, 20);
        ctx.lineTo(26, 30);
        ctx.lineTo(18, 50);
        ctx.closePath();
        ctx.fill();
        // Diamond shine
        this._drawCircle(ctx, 16, 28, 2, 'rgba(255,255,255,0.6)');
        return this._makeTexture(c);
    }

    _drawGargantuar() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        // Large head
        this._drawCircle(ctx, 32, 14, 12, '#6a7a4a');
        // Eyes
        this._drawCircle(ctx, 27, 12, 3, '#ff0000');
        this._drawCircle(ctx, 37, 12, 3, '#ff0000');
        // Mouth
        this._drawMouth(ctx, 32, 20, 6, 3, '#3a3a2a');
        // Large body
        this._drawRect(ctx, 18, 26, 28, 24, '#5a6a3a');
        // Arms
        this._drawRect(ctx, 6, 28, 12, 6, '#6a7a4a');
        this._drawRect(ctx, 46, 28, 12, 6, '#6a7a4a');
        // Club
        this._drawRect(ctx, 52, 8, 6, 24, '#8b6914');
        this._drawEllipse(ctx, 55, 6, 5, 6, '#6b4914');
        // Legs
        this._drawRect(ctx, 22, 50, 8, 12, '#4a4a3a');
        this._drawRect(ctx, 34, 50, 8, 12, '#4a4a3a');
        return this._makeTexture(c);
    }

    _drawFrostGiant() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        // Large head
        this._drawCircle(ctx, 32, 14, 12, '#4a6a8a');
        // Eyes
        this._drawCircle(ctx, 27, 12, 3, '#88ccff');
        this._drawCircle(ctx, 37, 12, 3, '#88ccff');
        // Mouth
        this._drawMouth(ctx, 32, 20, 6, 3, '#2a3a5a');
        // Large body
        this._drawRect(ctx, 18, 26, 28, 24, '#3a5a7a');
        // Arms
        this._drawRect(ctx, 6, 28, 12, 6, '#4a6a8a');
        this._drawRect(ctx, 46, 28, 12, 6, '#4a6a8a');
        // Ice club
        this._drawRect(ctx, 52, 8, 6, 24, '#6ac6ea');
        this._drawEllipse(ctx, 55, 6, 5, 6, '#88ddff');
        // Legs
        this._drawRect(ctx, 22, 50, 8, 12, '#3a4a5a');
        this._drawRect(ctx, 34, 50, 8, 12, '#3a4a5a');
        // Ice crystals
        this._drawCircle(ctx, 14, 20, 3, '#aaeeff');
        this._drawCircle(ctx, 50, 18, 2, '#aaeeff');
        return this._makeTexture(c);
    }

    _drawEdgarII() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        // Large head
        this._drawCircle(ctx, 32, 14, 12, '#6a7a4a');
        // Tech visor
        this._drawRect(ctx, 20, 10, 24, 6, '#ff0000');
        this._drawCircle(ctx, 26, 13, 2, '#ff4444');
        this._drawCircle(ctx, 38, 13, 2, '#ff4444');
        // Mouth
        this._drawMouth(ctx, 32, 20, 6, 3, '#3a3a2a');
        // Armored body
        this._drawRect(ctx, 16, 26, 32, 24, '#5a5a5a');
        // Tech gear
        this._drawRect(ctx, 4, 30, 12, 8, '#8a8a8a');
        this._drawCircle(ctx, 10, 34, 3, '#ff0000');
        this._drawRect(ctx, 48, 30, 12, 8, '#8a8a8a');
        this._drawCircle(ctx, 54, 34, 3, '#ff0000');
        // Legs
        this._drawRect(ctx, 22, 50, 8, 12, '#4a4a3a');
        this._drawRect(ctx, 34, 50, 8, 12, '#4a4a3a');
        return this._makeTexture(c);
    }

    // === Projectile Textures (16x16) ===

    _drawPea() {
        const c = this._createCanvas(16, 16);
        const ctx = c.getContext('2d');
        this._drawCircle(ctx, 8, 8, 6, '#4cc64c');
        this._drawCircle(ctx, 6, 6, 2, '#6ae66a');
        return this._makeTexture(c);
    }

    _drawIcePea() {
        const c = this._createCanvas(16, 16);
        const ctx = c.getContext('2d');
        this._drawCircle(ctx, 8, 8, 6, '#6ac6ea');
        this._drawCircle(ctx, 6, 6, 2, '#aaeeff');
        return this._makeTexture(c);
    }

    _drawFirePea() {
        const c = this._createCanvas(16, 16);
        const ctx = c.getContext('2d');
        this._drawCircle(ctx, 8, 8, 6, '#ff6600');
        this._drawCircle(ctx, 6, 6, 2, '#ffaa00');
        return this._makeTexture(c);
    }

    _drawCabbage() {
        const c = this._createCanvas(16, 16);
        const ctx = c.getContext('2d');
        this._drawEllipse(ctx, 8, 8, 6, 5, '#4cc64c');
        this._drawEllipse(ctx, 7, 7, 3, 2, '#3aaa3a');
        return this._makeTexture(c);
    }

    _drawCorn() {
        const c = this._createCanvas(16, 16);
        const ctx = c.getContext('2d');
        this._drawEllipse(ctx, 8, 8, 4, 5, '#ffdd00');
        this._drawRect(ctx, 6, 4, 4, 2, '#ffaa00');
        return this._makeTexture(c);
    }

    _drawMelonProjectile() {
        const c = this._createCanvas(16, 16);
        const ctx = c.getContext('2d');
        this._drawCircle(ctx, 8, 8, 6, '#3aaa3a');
        ctx.strokeStyle = '#2d8a2d';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(8, 8, 4, 0, Math.PI * 2);
        ctx.stroke();
        return this._makeTexture(c);
    }

    _drawIceMelon() {
        const c = this._createCanvas(16, 16);
        const ctx = c.getContext('2d');
        this._drawCircle(ctx, 8, 8, 6, '#6ac6ea');
        ctx.strokeStyle = '#4aa6ca';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(8, 8, 4, 0, Math.PI * 2);
        ctx.stroke();
        return this._makeTexture(c);
    }

    _drawSpore() {
        const c = this._createCanvas(16, 16);
        const ctx = c.getContext('2d');
        this._drawCircle(ctx, 8, 8, 4, '#8a5aaa');
        this._drawCircle(ctx, 7, 7, 1.5, '#aa7acc');
        return this._makeTexture(c);
    }

    _drawStarProjectile() {
        const c = this._createCanvas(16, 16);
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#ffdd00';
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const outerAngle = (i * 2 * Math.PI / 5) - Math.PI / 2;
            const innerAngle = outerAngle + Math.PI / 5;
            const ox = 8 + Math.cos(outerAngle) * 6;
            const oy = 8 + Math.sin(outerAngle) * 6;
            const ix = 8 + Math.cos(innerAngle) * 3;
            const iy = 8 + Math.sin(innerAngle) * 3;
            if (i === 0) ctx.moveTo(ox, oy);
            else ctx.lineTo(ox, oy);
            ctx.lineTo(ix, iy);
        }
        ctx.closePath();
        ctx.fill();
        return this._makeTexture(c);
    }

    _drawMetalPea() {
        const c = this._createCanvas(16, 16);
        const ctx = c.getContext('2d');
        this._drawCircle(ctx, 8, 8, 6, '#8a8a8a');
        this._drawCircle(ctx, 6, 6, 2, '#b0b0b0');
        return this._makeTexture(c);
    }

    _drawButter() {
        const c = this._createCanvas(16, 16);
        const ctx = c.getContext('2d');
        this._drawEllipse(ctx, 8, 8, 5, 4, '#ffee88');
        this._drawEllipse(ctx, 7, 7, 2, 2, '#ffdd44');
        return this._makeTexture(c);
    }

    _drawCobProjectile() {
        const c = this._createCanvas(32, 16);
        const ctx = c.getContext('2d');
        // Large corn cob
        this._drawEllipse(ctx, 16, 8, 14, 6, '#ffdd00');
        // Kernels
        for (let i = 0; i < 4; i++) {
            this._drawRect(ctx, 6 + i * 6, 4, 4, 3, '#ffaa00');
            this._drawRect(ctx, 8 + i * 6, 9, 4, 3, '#ffaa00');
        }
        return this._makeTexture(c);
    }

    // === Sunlight Texture (32x32) ===

    _drawSun() {
        const c = this._createCanvas(32, 32);
        const ctx = c.getContext('2d');
        // Rays
        ctx.fillStyle = '#ffdd00';
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            ctx.save();
            ctx.translate(16, 16);
            ctx.rotate(angle);
            ctx.fillRect(-2, 6, 4, 8);
            ctx.restore();
        }
        // Body
        this._drawCircle(ctx, 16, 16, 10, '#ffee44');
        // Face
        this._drawCircle(ctx, 13, 14, 2, '#000000');
        this._drawCircle(ctx, 19, 14, 2, '#000000');
        // Smile
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(16, 16, 5, 0.2, Math.PI - 0.2);
        ctx.stroke();
        return this._makeTexture(c);
    }

    // === Placeholder ===

    _drawPlaceholder() {
        const c = this._createCanvas(64, 64);
        const ctx = c.getContext('2d');
        this._drawRect(ctx, 0, 0, 64, 64, '#ff00ff');
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px sans-serif';
        ctx.fillText('?', 28, 36);
        return this._makeTexture(c);
    }
}
