(function() {
    class Sprite {
        constructor(animations) {
            this.animations = animations;
            this.currentAnimation = 'idle';
            this.currentFrame = 0;
            this.frameTimer = 0;
            this.onHitFrame = null;
            this._hitFrameTriggered = false;
        }

        getCurrentAnim() {
            return this.animations[this.currentAnimation];
        }

        play(animName) {
            if (this.currentAnimation !== animName) {
                this.currentAnimation = animName;
                this.currentFrame = 0;
                this.frameTimer = 0;
                this._hitFrameTriggered = false;
            }
        }

        isPlaying(animName) {
            return this.currentAnimation === animName;
        }

        update(dt) {
            const anim = this.getCurrentAnim();
            if (!anim || !anim.config) return;

            const config = anim.config;
            const frameDuration = 1000 / config.fps;

            this.frameTimer += dt;

            if (config.hit_frame !== undefined && this.currentFrame === config.hit_frame && !this._hitFrameTriggered) {
                this._hitFrameTriggered = true;
                if (typeof this.onHitFrame === 'function') {
                    this.onHitFrame();
                }
            }

            while (this.frameTimer >= frameDuration) {
                this.frameTimer -= frameDuration;
                this.currentFrame++;

                if (this.currentFrame >= config.frame_count) {
                    if (config.loop) {
                        this.currentFrame = 0;
                    } else {
                        this.currentFrame = config.frame_count - 1;
                        this.play('idle');
                        return;
                    }
                }

                if (config.hit_frame !== undefined && this.currentFrame === config.hit_frame && !this._hitFrameTriggered) {
                    this._hitFrameTriggered = true;
                    if (typeof this.onHitFrame === 'function') {
                        this.onHitFrame();
                    }
                }
            }
        }

        draw(ctx, x, y, flipX, alpha, scale) {
            flipX = flipX || false;
            alpha = alpha !== undefined ? alpha : 1;
            scale = scale !== undefined ? scale : 1;

            const anim = this.getCurrentAnim();
            if (!anim || !anim.img || !anim.config) return;

            const config = anim.config;
            const fw = config.frame_width || 96;
            const fh = config.frame_height || 96;

            const sx = this.currentFrame * fw;
            const sy = 0;
            const sw = fw;
            const sh = fh;

            ctx.save();
            ctx.imageSmoothingEnabled = false;
            ctx.globalAlpha = alpha;

            ctx.translate(x, y);
            if (flipX) {
                ctx.scale(-1, 1);
            }
            if (config.flipAttack) {
                ctx.scale(-1, 1);
            }
            ctx.scale(scale, scale);

            ctx.drawImage(anim.img, sx, sy, sw, sh, -config.anchor_x, -config.anchor_y, fw, fh);

            ctx.restore();
        }

        isAttacking() {
            return this.currentAnimation === 'attack';
        }

        getAnimation() {
            return this.currentAnimation;
        }
    }

    window.Sprite = Sprite;
})();
