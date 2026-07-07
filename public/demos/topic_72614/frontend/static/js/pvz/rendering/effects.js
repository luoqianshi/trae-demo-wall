const THREE = window.THREE;

const GRID_OFFSET_X = 80;
const GRID_OFFSET_Y = 100;
const CELL_SIZE = 80;

export class EffectsManager {
    constructor(renderer) {
        this.renderer = renderer;
        this.activeEffects = [];
        this.shakeOffset = { x: 0, y: 0 };
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.shakeElapsed = 0;
        this.flashOverlay = null;
        this.flashDuration = 0;
        this.flashElapsed = 0;
        this._initFlashOverlay();
    }

    _initFlashOverlay() {
        const geo = new THREE.PlaneGeometry(720, 500);
        const mat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0,
            depthWrite: false
        });
        this.flashOverlay = new THREE.Mesh(geo, mat);
        this.flashOverlay.position.set(360, 250, 20);
        this.flashOverlay.visible = false;
        this.renderer.scene.add(this.flashOverlay);
    }

    _createDOMElement(className, style) {
        const el = document.createElement('div');
        el.className = className;
        Object.assign(el.style, style);
        const container = this.renderer.domElement?.parentElement || document.body;
        container.appendChild(el);
        return el;
    }

    _removeDOMElement(el) {
        if (el && el.parentElement) {
            el.parentElement.removeChild(el);
        }
    }

    _getScreenPosition(worldX, worldY) {
        const vector = new THREE.Vector3(worldX, worldY, 0);
        vector.project(this.renderer.camera);
        const rect = this.renderer.domElement?.getBoundingClientRect();
        if (!rect) return { x: worldX, y: worldY };
        return {
            x: (vector.x * 0.5 + 0.5) * rect.width + rect.left,
            y: (-vector.y * 0.5 + 0.5) * rect.height + rect.top
        };
    }

    screenShake(intensity, duration) {
        this.shakeIntensity = intensity;
        this.shakeDuration = duration;
        this.shakeElapsed = 0;
    }

    flashScreen(color, duration) {
        this.flashOverlay.material.color.set(color || 0xffffff);
        this.flashOverlay.material.opacity = 0.6;
        this.flashOverlay.visible = true;
        this.flashDuration = duration || 0.3;
        this.flashElapsed = 0;
    }

    showDamageNumber(x, y, amount) {
        const screenPos = this._getScreenPosition(x, y);
        const el = this._createDOMElement('damage-number', {
            position: 'absolute',
            left: `${screenPos.x}px`,
            top: `${screenPos.y}px`,
            color: '#ff4444',
            fontSize: '16px',
            fontWeight: 'bold',
            fontFamily: 'Arial, sans-serif',
            textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
            pointerEvents: 'none',
            zIndex: '1000',
            transform: 'translate(-50%, -50%)',
            transition: 'none'
        });
        el.textContent = `-${amount}`;

        const effect = {
            type: 'damage_number',
            el,
            x: screenPos.x,
            y: screenPos.y,
            life: 1.0,
            maxLife: 1.0,
            vy: -40
        };
        this.activeEffects.push(effect);
    }

    showHealNumber(x, y, amount) {
        const screenPos = this._getScreenPosition(x, y);
        const el = this._createDOMElement('heal-number', {
            position: 'absolute',
            left: `${screenPos.x}px`,
            top: `${screenPos.y}px`,
            color: '#44ff44',
            fontSize: '16px',
            fontWeight: 'bold',
            fontFamily: 'Arial, sans-serif',
            textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
            pointerEvents: 'none',
            zIndex: '1000',
            transform: 'translate(-50%, -50%)',
            transition: 'none'
        });
        el.textContent = `+${amount}`;

        const effect = {
            type: 'heal_number',
            el,
            x: screenPos.x,
            y: screenPos.y,
            life: 1.0,
            maxLife: 1.0,
            vy: -40
        };
        this.activeEffects.push(effect);
    }

    showStatusIcon(x, y, status) {
        const statusConfig = {
            frozen: { icon: '❄', color: '#88ccff' },
            slowed: { icon: '🐌', color: '#aa88ff' },
            burning: { icon: '🔥', color: '#ff6600' },
            poisoned: { icon: '☠', color: '#aa44aa' },
            stunned: { icon: '💫', color: '#ffdd00' },
            shielded: { icon: '🛡', color: '#4488ff' }
        };

        const config = statusConfig[status];
        if (!config) return;

        const screenPos = this._getScreenPosition(x, y);
        const el = this._createDOMElement('status-icon', {
            position: 'absolute',
            left: `${screenPos.x}px`,
            top: `${screenPos.y - 30}px`,
            fontSize: '14px',
            pointerEvents: 'none',
            zIndex: '999',
            transform: 'translate(-50%, -50%)',
            transition: 'none'
        });
        el.textContent = config.icon;

        const effect = {
            type: 'status_icon',
            el,
            x: screenPos.x,
            y: screenPos.y - 30,
            life: 1.5,
            maxLife: 1.5,
            vy: -10
        };
        this.activeEffects.push(effect);
    }

    showBossWarning(bossName) {
        const el = this._createDOMElement('boss-warning', {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) scale(0)',
            color: '#ff4444',
            fontSize: '36px',
            fontWeight: 'bold',
            fontFamily: 'Arial, sans-serif',
            textShadow: '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 0 20px #ff0000',
            pointerEvents: 'none',
            zIndex: '2000',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            transition: 'none'
        });
        el.textContent = `⚠ ${bossName} ⚠`;

        const effect = {
            type: 'boss_warning',
            el,
            life: 2.5,
            maxLife: 2.5,
            phase: 'expand'
        };
        this.activeEffects.push(effect);
    }

    showWaveAnnouncement(waveNum) {
        const el = this._createDOMElement('wave-announcement', {
            position: 'fixed',
            top: '30%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#ffffff',
            fontSize: '28px',
            fontWeight: 'bold',
            fontFamily: 'Arial, sans-serif',
            textShadow: '-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000',
            pointerEvents: 'none',
            zIndex: '2000',
            textAlign: 'center',
            opacity: '0',
            transition: 'none'
        });
        el.textContent = `Wave ${waveNum}`;

        const effect = {
            type: 'wave_announcement',
            el,
            life: 2.0,
            maxLife: 2.0,
            phase: 'fadein'
        };
        this.activeEffects.push(effect);
    }

    showSunFlyToCounter(x, y) {
        const screenPos = this._getScreenPosition(x, y);
        const el = this._createDOMElement('sun-fly', {
            position: 'absolute',
            left: `${screenPos.x}px`,
            top: `${screenPos.y}px`,
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: '#ffee44',
            boxShadow: '0 0 8px #ffdd00',
            pointerEvents: 'none',
            zIndex: '1000',
            transform: 'translate(-50%, -50%)',
            transition: 'none'
        });

        // Target: top-left sun counter area
        const targetX = 40;
        const targetY = 20;

        const effect = {
            type: 'sun_fly',
            el,
            startX: screenPos.x,
            startY: screenPos.y,
            targetX,
            targetY,
            life: 0.6,
            maxLife: 0.6
        };
        this.activeEffects.push(effect);
    }

    showCoinFlyToCounter(x, y) {
        const screenPos = this._getScreenPosition(x, y);
        const el = this._createDOMElement('coin-fly', {
            position: 'absolute',
            left: `${screenPos.x}px`,
            top: `${screenPos.y}px`,
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            backgroundColor: '#ffaa00',
            boxShadow: '0 0 6px #ff8800',
            pointerEvents: 'none',
            zIndex: '1000',
            transform: 'translate(-50%, -50%)',
            transition: 'none'
        });

        const targetX = 80;
        const targetY = 20;

        const effect = {
            type: 'coin_fly',
            el,
            startX: screenPos.x,
            startY: screenPos.y,
            targetX,
            targetY,
            life: 0.6,
            maxLife: 0.6
        };
        this.activeEffects.push(effect);
    }

    update(deltaTime) {
        // Update screen shake
        if (this.shakeDuration > 0) {
            this.shakeElapsed += deltaTime;
            if (this.shakeElapsed >= this.shakeDuration) {
                this.shakeDuration = 0;
                this.shakeOffset.x = 0;
                this.shakeOffset.y = 0;
            } else {
                const progress = 1 - (this.shakeElapsed / this.shakeDuration);
                const intensity = this.shakeIntensity * progress;
                this.shakeOffset.x = (Math.random() - 0.5) * 2 * intensity;
                this.shakeOffset.y = (Math.random() - 0.5) * 2 * intensity;
            }
            this._applyCameraShake();
        }

        // Update flash
        if (this.flashDuration > 0) {
            this.flashElapsed += deltaTime;
            if (this.flashElapsed >= this.flashDuration) {
                this.flashDuration = 0;
                this.flashOverlay.visible = false;
                this.flashOverlay.material.opacity = 0;
            } else {
                const progress = 1 - (this.flashElapsed / this.flashDuration);
                this.flashOverlay.material.opacity = 0.6 * progress;
            }
        }

        // Update active effects
        for (let i = this.activeEffects.length - 1; i >= 0; i--) {
            const effect = this.activeEffects[i];
            effect.life -= deltaTime;

            if (effect.life <= 0) {
                this._removeDOMElement(effect.el);
                this.activeEffects.splice(i, 1);
                continue;
            }

            const lifeRatio = effect.life / effect.maxLife;

            switch (effect.type) {
                case 'damage_number':
                case 'heal_number':
                    effect.y += effect.vy * deltaTime;
                    effect.el.style.left = `${effect.x}px`;
                    effect.el.style.top = `${effect.y}px`;
                    effect.el.style.opacity = lifeRatio;
                    break;

                case 'status_icon':
                    effect.y += effect.vy * deltaTime;
                    effect.el.style.left = `${effect.x}px`;
                    effect.el.style.top = `${effect.y}px`;
                    effect.el.style.opacity = lifeRatio;
                    break;

                case 'boss_warning':
                    this._updateBossWarning(effect, lifeRatio);
                    break;

                case 'wave_announcement':
                    this._updateWaveAnnouncement(effect, lifeRatio);
                    break;

                case 'sun_fly':
                case 'coin_fly':
                    this._updateFlyEffect(effect, 1 - lifeRatio);
                    break;
            }
        }
    }

    _applyCameraShake() {
        if (this.renderer.camera) {
            this.renderer.camera.position.x = 360 + this.shakeOffset.x;
            this.renderer.camera.position.y = 250 + this.shakeOffset.y;
        }
    }

    _updateBossWarning(effect, lifeRatio) {
        const elapsed = effect.maxLife - effect.life;
        if (elapsed < 0.3) {
            // Expand phase
            const scale = elapsed / 0.3;
            effect.el.style.transform = `translate(-50%, -50%) scale(${scale})`;
            effect.el.style.opacity = '1';
        } else if (lifeRatio > 0.3) {
            // Hold phase with pulse
            const pulse = 1 + Math.sin(elapsed * 10) * 0.05;
            effect.el.style.transform = `translate(-50%, -50%) scale(${pulse})`;
            effect.el.style.opacity = '1';
        } else {
            // Fade out
            effect.el.style.opacity = lifeRatio / 0.3;
        }
    }

    _updateWaveAnnouncement(effect, lifeRatio) {
        const elapsed = effect.maxLife - effect.life;
        if (elapsed < 0.3) {
            // Fade in
            effect.el.style.opacity = elapsed / 0.3;
        } else if (lifeRatio > 0.3) {
            // Hold
            effect.el.style.opacity = '1';
        } else {
            // Fade out
            effect.el.style.opacity = lifeRatio / 0.3;
        }
    }

    _updateFlyEffect(effect, progress) {
        // Ease-in curve
        const t = 1 - Math.pow(1 - progress, 3);
        const currentX = effect.startX + (effect.targetX - effect.startX) * t;
        const currentY = effect.startY + (effect.targetY - effect.startY) * t;
        // Arc upward
        const arcHeight = -60;
        const arc = arcHeight * Math.sin(progress * Math.PI);
        effect.el.style.left = `${currentX}px`;
        effect.el.style.top = `${currentY + arc}px`;
        effect.el.style.opacity = progress > 0.8 ? (1 - progress) / 0.2 : 1;
        const scale = 1 - progress * 0.5;
        effect.el.style.transform = `translate(-50%, -50%) scale(${scale})`;
    }

    clear() {
        for (const effect of this.activeEffects) {
            this._removeDOMElement(effect.el);
        }
        this.activeEffects.length = 0;
        this.shakeDuration = 0;
        this.shakeOffset.x = 0;
        this.shakeOffset.y = 0;
        this._applyCameraShake();
        this.flashDuration = 0;
        this.flashOverlay.visible = false;
        this.flashOverlay.material.opacity = 0;
    }

    dispose() {
        this.clear();
        if (this.flashOverlay) {
            this.renderer.scene.remove(this.flashOverlay);
            this.flashOverlay.geometry.dispose();
            this.flashOverlay.material.dispose();
            this.flashOverlay = null;
        }
    }
}
