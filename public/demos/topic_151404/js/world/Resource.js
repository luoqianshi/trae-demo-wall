/**
 * Resource - 资源类
 * 继承 PIXI.Container，负责显示地图上的可采集资源
 */

(function() {

const RESOURCE_CONFIG = {
    branch: {
        name: '树枝',
        color: 0x8d6e63,
        highlight: 0xa1887f,
        shadow: 0x6d4c41,
        shape: 'stick',
        width: 20,
        height: 6
    },
    wood: {
        name: '木块',
        color: 0x6d4c41,
        highlight: 0x8d6e63,
        shadow: 0x4e342e,
        shape: 'rect',
        width: 18,
        height: 14
    },
    stone: {
        name: '石头',
        color: 0x757575,
        highlight: 0x9e9e9e,
        shadow: 0x424242,
        shape: 'rock',
        width: 18,
        height: 14
    },
    fruit: {
        name: '野果',
        color: 0xe53935,
        highlight: 0xef5350,
        shadow: 0xb71c1c,
        shape: 'circle',
        width: 12,
        height: 12
    },
    coconut: {
        name: '椰子',
        color: 0x5d4037,
        highlight: 0x8d6e63,
        shadow: 0x3e2723,
        shape: 'circle',
        width: 16,
        height: 16
    },
    shell: {
        name: '贝壳',
        color: 0xfff8dc,
        highlight: 0xfffff0,
        shadow: 0xd7ccc8,
        shape: 'shell',
        width: 14,
        height: 10
    },
    plastic_bottle: {
        name: '塑料瓶',
        color: 0x81d4fa,
        highlight: 0xb3e5fc,
        shadow: 0x4fc3f7,
        shape: 'bottle',
        width: 10,
        height: 18,
        isDrift: true
    },
    rope: {
        name: '绳子',
        color: 0xffcc80,
        highlight: 0xffe0b2,
        shadow: 0xffb74d,
        shape: 'rope',
        width: 16,
        height: 10,
        isDrift: true
    },
    tire: {
        name: '轮胎',
        color: 0x424242,
        highlight: 0x616161,
        shadow: 0x212121,
        shape: 'tire',
        width: 20,
        height: 20,
        isDrift: true
    },
    cloth: {
        name: '布料',
        color: 0x90caf9,
        highlight: 0xbbdefb,
        shadow: 0x64b5f6,
        shape: 'cloth',
        width: 18,
        height: 14,
        isDrift: true
    }
};

class Resource extends PIXI.Container {
    constructor(type, tileX, tileY, isDrift = false) {
        super();

        this.type = type;
        this.tileX = tileX;
        this.tileY = tileY;
        this.isDrift = isDrift;

        this.config = RESOURCE_CONFIG[type] || RESOURCE_CONFIG.stone;

        this._time = 0;
        this._baseY = 0;
        this._glowSprite = null;
        this._mainSprite = null;
        this._isHovered = false;

        this.x = this.tileX * 32;
        this.y = this.tileY * 32;
        this._baseY = this.y;

        this._initGraphics();
        this._initInteraction();
    }

    _initGraphics() {
        if (this.isDrift) {
            this._glowSprite = new PIXI.Graphics();
            this.addChild(this._glowSprite);
            this._updateGlow(0);
        }

        this._mainSprite = new PIXI.Graphics();
        this._drawResourceShape(this._mainSprite);
        this.addChild(this._mainSprite);
    }

    _drawResourceShape(g) {
        const cfg = this.config;
        const w = cfg.width;
        const h = cfg.height;

        const halfW = w / 2;
        const halfH = h / 2;

        g.clear();

        switch (cfg.shape) {
            case 'stick':
                g.beginFill(cfg.shadow);
                g.drawRect(-halfW + 2, -halfH + 2, w, h);
                g.endFill();
                g.beginFill(cfg.color);
                g.drawRect(-halfW, -halfH, w, h);
                g.endFill();
                g.beginFill(cfg.highlight);
                g.drawRect(-halfW + 2, -halfH + 1, w - 6, 2);
                g.endFill();
                break;

            case 'rect':
                g.beginFill(cfg.shadow);
                g.drawRect(-halfW + 2, -halfH + 2, w, h);
                g.endFill();
                g.beginFill(cfg.color);
                g.drawRect(-halfW, -halfH, w, h);
                g.endFill();
                g.beginFill(cfg.highlight);
                g.drawRect(-halfW + 2, -halfH + 2, 4, 4);
                g.drawRect(-halfW + 8, -halfH + 2, 4, 2);
                g.endFill();
                g.beginFill(cfg.shadow, 0.5);
                g.drawRect(-halfW + 2, -halfH + 6, w - 4, 1);
                g.drawRect(-halfW + 2, -halfH + 10, w - 4, 1);
                g.endFill();
                break;

            case 'rock':
                g.beginFill(cfg.shadow);
                g.drawRect(-halfW + 2, -halfH + 3, w - 2, h - 2);
                g.endFill();
                g.beginFill(cfg.color);
                g.drawRect(-halfW, -halfH + 2, w, h - 2);
                g.drawRect(-halfW + 2, -halfH, w - 4, 4);
                g.endFill();
                g.beginFill(cfg.highlight);
                g.drawRect(-halfW + 2, -halfH + 2, 6, 4);
                g.endFill();
                break;

            case 'circle':
                g.beginFill(cfg.shadow);
                g.drawRect(-halfW + 2, -halfH + 2, w, h);
                g.endFill();
                g.beginFill(cfg.color);
                g.drawRect(-halfW, -halfH, w, h);
                g.endFill();
                g.beginFill(cfg.highlight);
                g.drawRect(-halfW + 3, -halfH + 3, 4, 4);
                g.endFill();
                if (this.type === 'fruit' || this.type === 'coconut') {
                    g.beginFill(0x4caf50);
                    g.drawRect(-1, -halfH - 4, 2, 4);
                    g.endFill();
                }
                break;

            case 'shell':
                g.beginFill(cfg.shadow);
                g.drawRect(-halfW + 2, -halfH + 2, w, h);
                g.endFill();
                g.beginFill(cfg.color);
                g.drawRect(-halfW, -halfH + 2, w, h - 2);
                g.drawRect(-halfW + 2, -halfH, w - 4, 4);
                g.endFill();
                g.beginFill(cfg.highlight);
                g.drawRect(-halfW + 4, -halfH + 2, 2, 2);
                g.endFill();
                g.beginFill(cfg.shadow, 0.4);
                g.drawRect(-2, -halfH + 2, 1, h - 4);
                g.drawRect(-6, -halfH + 3, 1, h - 5);
                g.drawRect(4, -halfH + 3, 1, h - 5);
                g.endFill();
                break;

            case 'bottle':
                g.beginFill(cfg.shadow);
                g.drawRect(-halfW + 2, -halfH + 2, w, h);
                g.endFill();
                g.beginFill(cfg.color, 0.7);
                g.drawRect(-halfW, -halfH + 4, w, h - 4);
                g.endFill();
                g.beginFill(0x795548);
                g.drawRect(-3, -halfH, 6, 4);
                g.endFill();
                g.beginFill(cfg.highlight, 0.8);
                g.drawRect(-halfW + 2, -halfH + 6, 2, h - 8);
                g.endFill();
                break;

            case 'rope':
                g.beginFill(cfg.shadow);
                g.drawRect(-halfW + 2, -halfH + 2, w, h);
                g.endFill();
                g.beginFill(cfg.color);
                g.drawRect(-halfW, -halfH, w, h);
                g.endFill();
                g.beginFill(cfg.shadow, 0.5);
                for (let i = 0; i < 3; i++) {
                    g.drawRect(-halfW + 2, -halfH + 2 + i * 3, w - 4, 1);
                }
                g.endFill();
                g.beginFill(cfg.highlight);
                g.drawRect(-halfW + 2, -halfH + 1, 4, 2);
                g.endFill();
                break;

            case 'tire':
                g.beginFill(cfg.shadow);
                g.drawRect(-halfW + 2, -halfH + 2, w, h);
                g.endFill();
                g.beginFill(cfg.color);
                g.drawRect(-halfW, -halfH, w, h);
                g.endFill();
                g.beginFill(0x558b2f);
                g.drawRect(-halfW + 5, -halfH + 5, w - 10, h - 10);
                g.endFill();
                g.beginFill(cfg.shadow);
                for (let i = 0; i < 4; i++) {
                    g.drawRect(-halfW + 2 + i * 5, -halfH, 2, 3);
                    g.drawRect(-halfW + 2 + i * 5, halfH - 3, 2, 3);
                }
                g.endFill();
                break;

            case 'cloth':
                g.beginFill(cfg.shadow);
                g.drawRect(-halfW + 2, -halfH + 2, w, h);
                g.endFill();
                g.beginFill(cfg.color);
                g.drawRect(-halfW, -halfH, w, h);
                g.endFill();
                g.beginFill(cfg.highlight, 0.6);
                g.drawRect(-halfW + 4, -halfH + 2, 2, h - 4);
                g.drawRect(-halfW + 10, -halfH + 2, 1, h - 4);
                g.endFill();
                g.beginFill(cfg.shadow, 0.3);
                g.drawRect(-halfW + 7, -halfH + 2, 1, h - 4);
                g.endFill();
                break;

            default:
                g.beginFill(cfg.color);
                g.drawRect(-halfW, -halfH, w, h);
                g.endFill();
                break;
        }
    }

    _updateGlow(phase) {
        if (!this._glowSprite) return;

        const g = this._glowSprite;
        const cfg = this.config;
        const w = cfg.width + 12;
        const h = cfg.height + 12;
        const halfW = w / 2;
        const halfH = h / 2;

        const alpha = 0.3 + Math.sin(phase * Math.PI * 2) * 0.3;

        g.clear();
        g.beginFill(cfg.highlight, alpha);
        g.drawRect(-halfW, -halfH, w, h);
        g.endFill();

        g.beginFill(cfg.color, alpha * 0.5);
        g.drawRect(-halfW - 4, -halfH - 4, w + 8, h + 8);
        g.endFill();
    }

    _initInteraction() {
        this.interactive = true;
        this.buttonMode = true;

        this.on('pointerover', () => {
            this._isHovered = true;
            if (this._mainSprite) {
                this._mainSprite.scale.set(1.2);
            }
        });

        this.on('pointerout', () => {
            this._isHovered = false;
            if (this._mainSprite) {
                this._mainSprite.scale.set(1);
            }
        });
    }

    update(delta) {
        this._time += delta;

        if (this.isDrift) {
            const floatY = Math.sin(this._time * 2) * 2;
            this.y = this._baseY + floatY;

            const phase = (this._time * 1.5) % 1;
            this._updateGlow(phase);
        }

        if (this._isHovered) {
            this._mainSprite.rotation = Math.sin(this._time * 5) * 0.05;
        } else {
            this._mainSprite.rotation = 0;
        }
    }

    getName() {
        return this.config.name;
    }

    async collectAnimation() {
        return new Promise((resolve) => {
            const startTime = this._time;
            const duration = 0.3;
            const startScale = this.scale.x;
            const startAlpha = this.alpha;

            const animate = () => {
                const elapsed = this._time - startTime;
                const t = Math.min(elapsed / duration, 1);
                const ease = 1 - Math.pow(1 - t, 3);

                this.scale.set(startScale * (1 - ease * 0.5));
                this.alpha = startAlpha * (1 - ease);
                this.y = this._baseY - ease * 20;

                if (t < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };

            animate();
        });
    }

    destroy() {
        if (this._glowSprite) {
            this._glowSprite.destroy();
            this._glowSprite = null;
        }
        if (this._mainSprite) {
            this._mainSprite.destroy();
            this._mainSprite = null;
        }
        super.destroy({ children: true });
    }
}

window.Resource = Resource;
window.RESOURCE_CONFIG = RESOURCE_CONFIG;

})();
