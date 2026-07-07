const THREE = window.THREE;

const PARTICLE_TYPES = {
    pea_hit: { count: 5, life: 0.3, colors: ['#4cc64c', '#6ae66a', '#2d8a2d'], sizeRange: [2, 5], speedRange: [30, 80] },
    ice_hit: { count: 5, life: 0.3, colors: ['#6ac6ea', '#aaeeff', '#4aa6ca'], sizeRange: [2, 5], speedRange: [30, 80] },
    fire_hit: { count: 5, life: 0.3, colors: ['#ff6600', '#ffaa00', '#ff4400'], sizeRange: [2, 5], speedRange: [30, 80] },
    explosion: { count: 20, life: 0.5, colors: ['#ff4400', '#ff8800', '#ffcc00', '#ff0000'], sizeRange: [3, 8], speedRange: [40, 120] },
    sun_collect: { count: 8, life: 0.4, colors: ['#ffee44', '#ffdd00', '#ffaa00'], sizeRange: [2, 5], speedRange: [20, 60] },
    hybrid_dna: { count: 30, life: 1.0, colors: ['#4488ff', '#44aaff', '#88ccff', '#2266dd'], sizeRange: [2, 4], speedRange: [10, 40] },
    mutation_flash: { count: 15, life: 0.6, colors: ['#ffffff', '#ffdd00', '#ffaa00'], sizeRange: [3, 7], speedRange: [30, 90] },
    boss_smash: { count: 10, life: 0.5, colors: ['#8a8a8a', '#6a6a6a', '#aaaaaa'], sizeRange: [4, 8], speedRange: [40, 100] },
    freeze_wave: { count: 20, life: 0.8, colors: ['#6ac6ea', '#aaeeff', '#88ddff', '#ffffff'], sizeRange: [3, 6], speedRange: [20, 60] },
    coin_drop: { count: 5, life: 0.3, colors: ['#ffdd00', '#ffaa00', '#ffee44'], sizeRange: [2, 4], speedRange: [20, 50] },
    zombie_die: { count: 8, life: 0.4, colors: ['#7a8a5a', '#5a6a3a', '#8a9a6a', '#4a5a2a'], sizeRange: [3, 7], speedRange: [20, 60] }
};

export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particlePool = [];
        this.activeParticles = [];
        this._initPool(200);
        this._spriteMaterialCache = new Map();
    }

    _initPool(size) {
        for (let i = 0; i < size; i++) {
            this.particlePool.push({
                x: 0, y: 0, vx: 0, vy: 0,
                life: 0, maxLife: 1,
                size: 4, color: '#ffffff',
                alpha: 1, active: false,
                sprite: null
            });
        }
    }

    _getSpriteMaterial(color) {
        if (this._spriteMaterialCache.has(color)) {
            return this._spriteMaterialCache.get(color);
        }
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.6, color);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(8, 8, 8, 0, Math.PI * 2);
        ctx.fill();
        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        this._spriteMaterialCache.set(color, material);
        return material;
    }

    _getParticle() {
        for (const p of this.particlePool) {
            if (!p.active) return p;
        }
        return null;
    }

    emit(type, x, y, count) {
        const config = PARTICLE_TYPES[type];
        if (!config) {
            console.warn(`Unknown particle type: ${type}`);
            return;
        }

        const emitCount = count || config.count;

        for (let i = 0; i < emitCount; i++) {
            const p = this._getParticle();
            if (!p) break;

            const angle = Math.random() * Math.PI * 2;
            const speed = config.speedRange[0] + Math.random() * (config.speedRange[1] - config.speedRange[0]);
            const color = config.colors[Math.floor(Math.random() * config.colors.length)];
            const size = config.sizeRange[0] + Math.random() * (config.sizeRange[1] - config.sizeRange[0]);

            p.x = x;
            p.y = y;
            p.vx = Math.cos(angle) * speed;
            p.vy = Math.sin(angle) * speed;
            p.life = config.life;
            p.maxLife = config.life;
            p.size = size;
            p.color = color;
            p.alpha = 1;
            p.active = true;

            if (type === 'hybrid_dna') {
                this._configureDNA(p, i, emitCount, x, y);
            } else if (type === 'freeze_wave') {
                this._configureFreezeWave(p, i, emitCount, x, y);
            }

            if (!p.sprite) {
                p.sprite = new THREE.Sprite(this._getSpriteMaterial(color));
                this.scene.add(p.sprite);
            } else {
                p.sprite.material = this._getSpriteMaterial(color);
            }

            p.sprite.position.set(p.x, p.y, 10);
            p.sprite.scale.set(p.size, p.size, 1);
            p.sprite.visible = true;

            this.activeParticles.push(p);
        }
    }

    _configureDNA(p, index, total, cx, cy) {
        const t = (index / total) * Math.PI * 4;
        const radius = 15;
        p.x = cx + Math.cos(t) * radius;
        p.y = cy + Math.sin(t) * radius;
        p.vx = Math.cos(t + Math.PI / 2) * 20;
        p.vy = Math.sin(t + Math.PI / 2) * 20 + 10;
    }

    _configureFreezeWave(p, index, total, cx, cy) {
        const angle = (index / total) * Math.PI * 2;
        const speed = 40 + Math.random() * 30;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
        p.size = 4 + Math.random() * 3;
    }

    update(deltaTime) {
        for (let i = this.activeParticles.length - 1; i >= 0; i--) {
            const p = this.activeParticles[i];

            p.life -= deltaTime;
            if (p.life <= 0) {
                p.active = false;
                p.sprite.visible = false;
                this.activeParticles.splice(i, 1);
                continue;
            }

            const lifeRatio = p.life / p.maxLife;

            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;

            // Gravity for some types
            p.vy += 50 * deltaTime;

            // Damping
            p.vx *= 0.98;
            p.vy *= 0.98;

            p.alpha = lifeRatio;
            const currentSize = p.size * (0.5 + lifeRatio * 0.5);

            p.sprite.position.set(p.x, p.y, 10);
            p.sprite.scale.set(currentSize, currentSize, 1);
            p.sprite.material.opacity = p.alpha;
        }
    }

    clear() {
        for (const p of this.activeParticles) {
            p.active = false;
            p.sprite.visible = false;
        }
        this.activeParticles.length = 0;
    }

    dispose() {
        for (const p of this.particlePool) {
            if (p.sprite) {
                this.scene.remove(p.sprite);
                p.sprite.material.dispose();
                p.sprite = null;
            }
        }
        for (const [, material] of this._spriteMaterialCache) {
            material.map.dispose();
            material.dispose();
        }
        this._spriteMaterialCache.clear();
        this.particlePool.length = 0;
        this.activeParticles.length = 0;
    }
}
