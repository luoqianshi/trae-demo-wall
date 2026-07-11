/* ==================== 机瞄视角渲染（高质量贴图 + 武器系统） ==================== */
const IronSight = {
    // ===== 贴图资源 =====
    bgImage: null,           // 射击场背景
    targetImage: null,       // 靶纸贴图
    imagesLoaded: false,

    // ===== 枪物理 =====
    gunAngleX: 0,
    gunAngleY: 0,
    gunAngleVelX: 0,
    gunAngleVelY: 0,
    gunDamping: 0.88,
    recoilKick: 0,
    recoilKickTarget: 0,
    recoilSide: 0,
    recoilBlur: 0,
    muzzleFlash: 0,

    // ===== 呼吸/心跳 =====
    breathPhase: 0,
    breathSpeed: 0.35,
    breathAmplitude: 6,
    heartbeatPhase: 0,
    heartbeatSpeed: 3.5,
    heartbeatAmplitude: 1.2,
    fatigue: 0,
    aimTime: 0,

    // ===== 准星位置 =====
    sightX: 0,
    sightY: 0,

    // ===== 背景偏移（视差） =====
    bgOffsetX: 0,
    bgOffsetY: 0,

    // ===== 环境效果 =====
    dustParticles: [],
    shellCasings: [],
    smokeParticles: [],
    _gunOffscreenCache: null, // 枪械离屏canvas缓存
    _gunCacheId: null,         // 缓存对应的武器ID

    // 加载贴图
    loadImages() {
        if (this.imagesLoaded) return Promise.resolve();
        return new Promise((resolve) => {
            let loaded = 0;
            const total = 2;
            const onLoad = () => {
                loaded++;
                if (loaded >= total) {
                    this.imagesLoaded = true;
                    resolve();
                }
            };

            this.bgImage = new Image();
            this.bgImage.onload = onLoad;
            this.bgImage.onerror = onLoad;
            this.bgImage.src = 'assets/range-empty.jpg';

            this.targetImage = new Image();
            this.targetImage.onload = onLoad;
            this.targetImage.onerror = onLoad;
            this.targetImage.src = 'assets/target-paper.jpg';
        });
    },

    update(dt, time, mouseNormX, mouseNormY) {
        const weapon = Weapons.current;

        // 呼吸
        this.breathPhase += dt * this.breathSpeed * Math.PI * 2;
        const breathY = Math.sin(this.breathPhase) * (weapon.breathAmp || 6);

        // 心跳
        this.heartbeatPhase += dt * this.heartbeatSpeed * Math.PI * 2;
        const heartX = Math.sin(this.heartbeatPhase) * this.heartbeatAmplitude;
        const heartY = Math.cos(this.heartbeatPhase * 1.3) * this.heartbeatAmplitude * 0.7;

        // 疲劳
        this.aimTime += dt;
        this.fatigue = Math.min(1, this.aimTime / 12);
        const fatigueShake = this.fatigue * 2.5;

        // 枪惯性
        const targetAngleX = (mouseNormX - 0.5) * 2;
        const targetAngleY = (mouseNormY - 0.5) * 2;
        const springK = weapon.swaySpeed || 2.5;

        this.gunAngleVelX += (targetAngleX - this.gunAngleX) * springK * dt;
        this.gunAngleVelY += (targetAngleY - this.gunAngleY) * springK * dt;
        this.gunAngleVelX *= Math.pow(this.gunDamping, dt * 60);
        this.gunAngleVelY *= Math.pow(this.gunDamping, dt * 60);
        this.gunAngleX += this.gunAngleVelX * dt;
        this.gunAngleY += this.gunAngleVelY * dt;

        // 准星位置
        const range = 50;
        this.sightX = this.gunAngleX * range + heartX + (Math.random() - 0.5) * fatigueShake;
        this.sightY = this.gunAngleY * range + breathY + heartY + (Math.random() - 0.5) * fatigueShake;

        // 背景视差（比准星移动慢，产生深度感）
        this.bgOffsetX = this.gunAngleX * range * 0.15;
        this.bgOffsetY = this.gunAngleY * range * 0.15;

        // 后坐力衰减
        this.recoilKick = Utils.lerp(this.recoilKick, this.recoilKickTarget, dt * 5);
        if (this.recoilKickTarget > 0) {
            this.recoilKickTarget = Utils.lerp(this.recoilKickTarget, 0, dt * 2.5);
        }
        this.recoilSide *= Math.pow(0.93, dt * 60);
        this.recoilBlur *= Math.pow(0.88, dt * 60);

        // 枪口闪光
        if (this.muzzleFlash > 0) {
            this.muzzleFlash -= dt * 5;
            if (this.muzzleFlash < 0) this.muzzleFlash = 0;
        }

        // 更新武器切换
        Weapons.update(dt);

        // 更新弹壳
        this.updateShellCasings(dt);
        // 更新烟雾
        this.updateSmoke(dt);
        // 更新灰尘
        this.updateDust(dt, time);
    },

    fire() {
        const weapon = Weapons.current;
        this.recoilKickTarget = weapon.recoil || 30;
        this.recoilSide = (Math.random() - 0.5) * (weapon.recoilSide || 10);
        this.recoilBlur = 1;
        this.muzzleFlash = 1;
        this.aimTime = 0;
        this.fatigue = 0;

        // 添加弹壳
        this.addShellCasing();
        // 添加烟雾
        this.addSmoke();
    },

    // 添加弹壳
    addShellCasing() {
        this.shellCasings.push({
            x: window.innerWidth / 2 + 100,
            y: window.innerHeight - 50,
            vx: (Math.random() - 0.3) * 8,
            vy: -Math.random() * 6 - 3,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.3,
            life: 1,
            gravity: 0.25
        });
    },

    updateShellCasings(dt) {
        for (let i = this.shellCasings.length - 1; i >= 0; i--) {
            const s = this.shellCasings[i];
            s.x += s.vx;
            s.y += s.vy;
            s.vy += s.gravity;
            s.rotation += s.rotSpeed;
            s.life -= dt * 0.5;
            if (s.life <= 0) this.shellCasings.splice(i, 1);
        }
    },

    addSmoke() {
        for (let i = 0; i < 5; i++) {
            this.smokeParticles.push({
                x: window.innerWidth / 2 + 140,
                y: window.innerHeight - 120,
                vx: (Math.random() - 0.5) * 3,
                vy: -Math.random() * 2 - 1,
                size: Math.random() * 10 + 5,
                life: 1,
                decay: Math.random() * 0.3 + 0.2
            });
        }
    },

    updateSmoke(dt) {
        for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
            const p = this.smokeParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.size += dt * 15;
            p.life -= dt * p.decay;
            if (p.life <= 0) this.smokeParticles.splice(i, 1);
        }
    },

    updateDust(dt, time) {
        while (this.dustParticles.length < 30) {
            this.dustParticles.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.3,
                size: Math.random() * 2 + 0.5,
                alpha: Math.random() * 0.3 + 0.1
            });
        }
        for (const p of this.dustParticles) {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0) p.x = window.innerWidth;
            if (p.x > window.innerWidth) p.x = 0;
            if (p.y < 0) p.y = window.innerHeight;
            if (p.y > window.innerHeight) p.y = 0;
        }
    },

    draw(ctx, w, h, time) {
        ctx.save();

        // 1. 绘制背景环境（贴图）
        this.drawBackgroundImage(ctx, w, h);

        // 2. 绘制灰尘粒子
        this.drawDust(ctx);

        // 3. 绘制背景中的三个距离靶纸（10m / 15m / 25m）
        this.drawRangeTargets(ctx, w, h);

        // 4. 绘制弹着点（仅在靶纸范围内显示）
        for (const imp of Shooting.impacts) {
            if (!App.targetRadius) continue;
            // 弹着点相对于靶纸中心的偏移
            const relX = imp.x - App.targetCX;
            const relY = imp.y - App.targetCY;
            const dist = Math.sqrt(relX * relX + relY * relY);
            // 超出靶纸半径不显示
            if (dist > App.targetRadius * 1.05) continue;
            // 映射到靶纸显示区域
            const positionY = DistanceSystem.getPositionY();
            const targetCenterX = w * 0.50 + this.bgOffsetX * 0.2 + this.recoilSide * 0.1;
            const targetCenterY = h * positionY + this.bgOffsetY * 0.2 - this.recoilKick * 0.1;
            const type = TargetTypes.current;
            const baseSize = Math.min(w, h) * 0.14 * DistanceSystem.getSizeFactor();
            const drawW = (type.id === 'ipsc' || type.id === 'idpa' || type.id === 'human') ? baseSize * 0.82 : baseSize;
            const drawH = (type.id === 'ipsc' || type.id === 'idpa' || type.id === 'human') ? baseSize * 1.25 : baseSize;
            const scaleX = (drawW / 2) / App.targetRadius;
            const scaleY = (drawH / 2) / App.targetRadius;
            const impX = targetCenterX + relX * scaleX;
            const impY = targetCenterY + relY * scaleY;
            this.drawRealImpact(ctx, impX, impY, imp.score);
        }

        // 4.5 绘制靶纸识别结果（四角标记）
        this.drawDetectionResult(ctx, w, h);

        // 5. 绘制全息准星（在靶纸和枪身之间）
        this.drawHoloSight(ctx, w, h);

        // 6. 绘制枪械（FPS贴图，枪口朝前/朝上）
        this.drawGunImage(ctx, w, h);

        // 7. 绘制枪口闪光
        if (this.muzzleFlash > 0) {
            this.drawMuzzleFlash(ctx, w, h);
        }

        // 8. 绘制烟雾
        this.drawSmoke(ctx);

        // 9. 绘制弹壳
        this.drawShellCasings(ctx);

        // 10. 绘制暗角效果
        this.drawVignette(ctx, w, h);

        // 11. HUD
        this.drawHUD(ctx, w, h);

        // 12. 武器信息
        this.drawWeaponInfo(ctx, w, h);

        ctx.filter = 'none';
        ctx.restore();
    },

    // 绘制背景环境
    drawBackgroundImage(ctx, w, h) {
        const bx = this.bgOffsetX * 0.3 + this.recoilSide * 0.2;
        const by = this.bgOffsetY * 0.3 - this.recoilKick * 0.15;

        ctx.save();

        if (this.bgImage && this.bgImage.complete) {
            // cover 模式填满画面
            const scale = Math.max(w / this.bgImage.width, h / this.bgImage.height);
            const drawW = this.bgImage.width * scale;
            const drawH = this.bgImage.height * scale;
            const drawX = (w - drawW) / 2 + bx;
            const drawY = (h - drawH) / 2 + by;
            ctx.drawImage(this.bgImage, drawX, drawY, drawW, drawH);

            // 轻微暗化，让前景更突出
            ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            ctx.fillRect(0, 0, w, h);
        } else {
            ctx.fillStyle = '#0a0e1a';
            ctx.fillRect(0, 0, w, h);
        }

        ctx.restore();
    },

    // 绘制射击场中间靶纸（覆盖背景图自带靶纸）
    drawRangeTargets(ctx, w, h) {
        const targetImg = TargetTypes.getImage();
        if (!targetImg || !targetImg.complete) return;

        const type = TargetTypes.current;
        const bx = this.bgOffsetX * 0.2 + this.recoilSide * 0.1;
        const by = this.bgOffsetY * 0.2 - this.recoilKick * 0.1;

        // 根据距离系统调整靶纸大小和位置
        const sizeFactor = DistanceSystem.getSizeFactor();
        const positionY = DistanceSystem.getPositionY();

        // 只保留中间一个靶纸，精确对齐背景图中的靶架
        const tx = w * 0.50 + bx;
        const ty = h * positionY + by;
        const size = Math.min(w, h) * 0.14 * sizeFactor;

        ctx.save();

        // 根据靶纸类型调整绘制比例
        let drawW = size;
        let drawH = size;
        if (type.id === 'ipsc' || type.id === 'idpa' || type.id === 'human') {
            drawH = size * 1.25;
            drawW = size * 0.82;
        }

        // 绘制靶纸支架（金属杆）
        ctx.strokeStyle = 'rgba(50, 50, 50, 0.7)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(tx, ty + drawH * 0.5);
        ctx.lineTo(tx, h * 0.68);
        ctx.stroke();

        // 支架底座
        ctx.fillStyle = 'rgba(35, 35, 35, 0.8)';
        ctx.fillRect(tx - 20, h * 0.66, 40, 10);

        // 绘制靶纸贴图
        ctx.save();
        ctx.translate(tx, ty);
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 3;
        ctx.drawImage(targetImg, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();

        ctx.restore();
    },

    // 绘制真实弹着点
    drawRealImpact(ctx, x, y, score) {
        ctx.save();
        const size = score > 9 ? 4 : 5;

        // 弹孔外围烧焦
        ctx.beginPath();
        ctx.arc(x, y, size + 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(30, 20, 10, 0.6)';
        ctx.fill();

        // 弹孔本体
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = '#1a1a1a';
        ctx.fill();

        // 边缘高光
        ctx.beginPath();
        ctx.arc(x - 1, y - 1, size * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(100, 80, 60, 0.4)';
        ctx.fill();

        // 撕裂效果
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 / 6) * i + Math.random() * 0.5;
            const tearLen = size * 0.8 + Math.random() * 3;
            ctx.beginPath();
            ctx.moveTo(x + Math.cos(angle) * size, y + Math.sin(angle) * size);
            ctx.lineTo(x + Math.cos(angle) * tearLen, y + Math.sin(angle) * tearLen);
            ctx.strokeStyle = 'rgba(40, 30, 20, 0.5)';
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }

        ctx.restore();
    },

    // 绘制枪械（FPS贴图）
    // 使用离屏Canvas去除白色背景（缓存处理结果）
    drawGunImage(ctx, w, h) {
        const weapon = Weapons.current;
        const recoilY = this.recoilKick;
        const swayX = this.gunAngleX * 15;
        const switchOffset = Weapons.getSwitchOffset();

        ctx.save();

        const gunImg = Weapons.getImage(Weapons.switching ? Weapons.list[Weapons.switchTarget].id : null);
        if (gunImg && gunImg.complete) {
            const gunW = w * (weapon.gunScale || 0.85);
            const scale = gunW / gunImg.width;
            const gunH = gunImg.height * scale;

            const drawX = (w - gunW) / 2 + swayX;
            const drawY = h - gunH * 0.85 + (h * (weapon.gunOffsetY || -0.05)) + recoilY * 0.3 + switchOffset;

            // 使用缓存：仅当武器切换时重新处理
            const cacheId = weapon.id;
            if (!this._gunOffscreenCache || this._gunCacheId !== cacheId) {
                const offCanvas = document.createElement('canvas');
                offCanvas.width = gunImg.width;
                offCanvas.height = gunImg.height;
                const offCtx = offCanvas.getContext('2d');
                offCtx.drawImage(gunImg, 0, 0);

                const imageData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
                const data = imageData.data;
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    if (r > 220 && g > 220 && b > 220) {
                        data[i + 3] = 0;
                    }
                    else if (r > 200 && g > 200 && b > 200 && Math.abs(r - g) < 15 && Math.abs(g - b) < 15) {
                        data[i + 3] = Math.max(0, data[i + 3] - 200);
                    }
                }
                offCtx.putImageData(imageData, 0, 0);
                this._gunOffscreenCache = offCanvas;
                this._gunCacheId = cacheId;
            }

            ctx.drawImage(this._gunOffscreenCache, drawX, drawY, gunW, gunH);
        }

        ctx.restore();
    },

    // 绘制全息准星
    drawHoloSight(ctx, w, h) {
        // 已禁用全息准星，仅使用激光点指示位置
    },

    // 绘制枪口闪光
    drawMuzzleFlash(ctx, w, h) {
        const weapon = Weapons.current;
        const swayX = this.gunAngleX * 15;
        const recoilY = this.recoilKick;
        const switchOffset = Weapons.getSwitchOffset();

        // 枪口位置基于武器参数
        const muzzleX = w / 2 + (weapon.muzzleOffsetX || 0) * w + swayX;
        const muzzleY = h + (weapon.muzzleOffsetY || -0.35) * h + recoilY * 0.3 + switchOffset;
        const alpha = this.muzzleFlash;

        ctx.save();

        // 主闪光
        ctx.beginPath();
        ctx.arc(muzzleX, muzzleY, 30 * alpha, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 200, 80, ' + (alpha * 0.9) + ')';
        ctx.shadowColor = '#ffcc00';
        ctx.shadowBlur = 60 * alpha;
        ctx.fill();

        // 核心白光
        ctx.beginPath();
        ctx.arc(muzzleX, muzzleY, 12 * alpha, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, ' + alpha + ')';
        ctx.shadowBlur = 50 * alpha;
        ctx.fill();

        // 射线
        ctx.strokeStyle = 'rgba(255, 200, 100, ' + (alpha * 0.6) + ')';
        ctx.lineWidth = 2 * alpha;
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
            const len = 35 + Math.random() * 30;
            ctx.beginPath();
            ctx.moveTo(muzzleX, muzzleY);
            ctx.lineTo(
                muzzleX + Math.cos(angle) * len,
                muzzleY + Math.sin(angle) * len
            );
            ctx.stroke();
        }

        // 屏幕闪光
        ctx.fillStyle = 'rgba(255, 200, 100, ' + (alpha * 0.15) + ')';
        ctx.fillRect(0, 0, w, h);

        ctx.restore();
    },

    // 绘制烟雾
    drawSmoke(ctx) {
        for (const p of this.smokeParticles) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(150, 150, 150, ' + (p.life * 0.2) + ')';
            ctx.fill();
            ctx.restore();
        }
    },

    // 绘制弹壳
    drawShellCasings(ctx) {
        for (const s of this.shellCasings) {
            ctx.save();
            ctx.translate(s.x, s.y);
            ctx.rotate(s.rotation);
            ctx.fillStyle = 'rgba(200, 180, 100, ' + s.life + ')';
            ctx.fillRect(-3, -6, 6, 12);
            ctx.fillStyle = 'rgba(180, 160, 80, ' + s.life + ')';
            ctx.fillRect(-3.5, -7, 7, 2);
            ctx.restore();
        }
    },

    // 绘制灰尘
    drawDust(ctx) {
        for (const p of this.dustParticles) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(200, 200, 180, ' + p.alpha + ')';
            ctx.fill();
            ctx.restore();
        }
    },

    // 绘制暗角效果
    drawVignette(ctx, w, h) {
        const gradient = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.8);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
    },

    // 绘制 HUD
    drawHUD(ctx, w, h) {
        ctx.save();

        ctx.font = 'bold 14px Consolas, monospace';
        ctx.fillStyle = 'rgba(5, 255, 161, 0.6)';
        ctx.textAlign = 'left';
        ctx.fillText('AMMO: ' + Shooting.ammo + '/' + Shooting.maxAmmo, 16, h - 16);

        ctx.font = '11px Consolas, monospace';
        ctx.fillStyle = 'rgba(5, 255, 161, 0.4)';
        ctx.textAlign = 'right';
        ctx.fillText('DIST: ' + DistanceSystem.getDistanceLabel(), w - 16, h - 16);
        ctx.fillText('WIND: 2.3m/s E', w - 16, h - 32);

        if (this.fatigue > 0.3) {
            ctx.font = '11px Consolas, monospace';
            ctx.fillStyle = 'rgba(255, 42, 109, ' + this.fatigue + ')';
            ctx.textAlign = 'center';
            ctx.fillText('FATIGUE', w / 2, h - 50);
        }

        ctx.restore();
    },

    // 绘制武器信息
    drawWeaponInfo(ctx, w, h) {
        const weapon = Weapons.current;
        ctx.save();

        // 武器名称（左上角）
        ctx.font = 'bold 12px Consolas, monospace';
        ctx.fillStyle = 'rgba(0, 240, 255, 0.5)';
        ctx.textAlign = 'left';
        ctx.fillText(weapon.nameEn, 16, 24);

        // 武器类型
        ctx.font = '10px Consolas, monospace';
        ctx.fillStyle = 'rgba(0, 240, 255, 0.3)';
        ctx.fillText(weapon.type, 16, 38);

        // 武器切换指示器（底部中央）
        const totalWeapons = Weapons.list.length;
        const indicatorY = h - 60;
        const indicatorSpacing = 60;
        const startX = w / 2 - (totalWeapons - 1) * indicatorSpacing / 2;

        for (let i = 0; i < totalWeapons; i++) {
            const ix = startX + i * indicatorSpacing;
            const isActive = (i === Weapons.currentIndex);
            const isSwitchTarget = (Weapons.switching && i === Weapons.switchTarget);

            ctx.font = '10px Consolas, monospace';
            ctx.textAlign = 'center';

            if (isActive || isSwitchTarget) {
                ctx.fillStyle = 'rgba(0, 240, 255, 0.7)';
                ctx.fillText('[' + (i + 1) + ']', ix, indicatorY);
                ctx.font = '9px Consolas, monospace';
                ctx.fillStyle = 'rgba(0, 240, 255, 0.5)';
                ctx.fillText(Weapons.list[i].type, ix, indicatorY + 14);
            } else {
                ctx.fillStyle = 'rgba(100, 100, 120, 0.4)';
                ctx.fillText('' + (i + 1), ix, indicatorY);
                ctx.font = '9px Consolas, monospace';
                ctx.fillStyle = 'rgba(100, 100, 120, 0.3)';
                ctx.fillText(Weapons.list[i].type, ix, indicatorY + 14);
            }
        }

        ctx.restore();

        // 后坐力暗角效果（轻量，替代昂贵的 ctx.filter blur）
        if (this.recoilBlur > 0.01) {
            ctx.globalAlpha = this.recoilBlur * 0.12;
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, w, h);
            ctx.globalAlpha = 1;
        }
    },

    // 获取瞄准位置
    getAimPosition(w, h) {
        return {
            x: w / 2 + this.sightX + this.recoilSide,
            y: h / 2 + this.sightY - this.recoilKick * 0.5
        };
    },

    // 获取枪口位置（用于弹道飞行动画）
    getMuzzlePosition(w, h) {
        const weapon = Weapons.current;
        const swayX = this.gunAngleX * 15;
        const recoilY = this.recoilKick;
        const switchOffset = Weapons.getSwitchOffset();
        return {
            x: w / 2 + (weapon.muzzleOffsetX || 0) * w + swayX,
            y: h + (weapon.muzzleOffsetY || -0.35) * h + recoilY * 0.3 + switchOffset
        };
    },

    reset() {
        this.gunAngleX = 0;
        this.gunAngleY = 0;
        this.gunAngleVelX = 0;
        this.gunAngleVelY = 0;
        this.recoilKick = 0;
        this.recoilKickTarget = 0;
        this.recoilSide = 0;
        this.recoilBlur = 0;
        this.muzzleFlash = 0;
        this.sightX = 0;
        this.sightY = 0;
        this.bgOffsetX = 0;
        this.bgOffsetY = 0;
        this.fatigue = 0;
        this.aimTime = 0;
        this.breathPhase = 0;
        this.heartbeatPhase = 0;
        this.shellCasings = [];
        this.smokeParticles = [];
        this.dustParticles = [];
    },

    // 绘制靶纸识别结果（四角标记）
    drawDetectionResult(ctx, w, h) {
        // 绘制手动标定中的点和线
        if (TargetDetector.manualPoints && TargetDetector.manualPoints.length > 0) {
            ctx.save();
            const points = TargetDetector.manualPoints;
            const labels = TargetDetector.manualLabels;

            // 绘制已收集的点
            for (let i = 0; i < points.length; i++) {
                const p = points[i];
                // 外圈
                ctx.beginPath();
                ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(255, 42, 109, 0.8)';
                ctx.lineWidth = 2;
                ctx.stroke();
                // 内点
                ctx.beginPath();
                ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 42, 109, 0.9)';
                ctx.fill();
                // 序号
                ctx.font = 'bold 10px Consolas';
                ctx.fillStyle = 'rgba(255, 42, 109, 0.9)';
                ctx.textAlign = 'center';
                ctx.fillText(labels[i], p.x, p.y - 12);
            }

            // 绘制已收集点之间的连线
            if (points.length > 1) {
                ctx.beginPath();
                ctx.moveTo(points[0].x, points[0].y);
                for (let i = 1; i < points.length; i++) {
                    ctx.lineTo(points[i].x, points[i].y);
                }
                ctx.strokeStyle = 'rgba(255, 42, 109, 0.4)';
                ctx.lineWidth = 1;
                ctx.setLineDash([3, 3]);
                ctx.stroke();
            }

            ctx.restore();
        }

        // 绘制已识别的靶纸四角
        if (!TargetDetector.detectedCorners || TargetDetector.detectionConfidence < 0.3) return;

        const corners = TargetDetector.getNormalizedCorners(w, h);
        if (!corners || corners.length < 4) return;

        ctx.save();
        ctx.strokeStyle = 'rgba(5, 255, 161, 0.8)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);

        // 绘制四边形边框
        ctx.beginPath();
        ctx.moveTo(corners[0].x, corners[0].y);
        for (let i = 1; i < corners.length; i++) {
            ctx.lineTo(corners[i].x, corners[i].y);
        }
        ctx.closePath();
        ctx.stroke();

        // 绘制四角标记
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(5, 255, 161, 0.9)';
        for (let i = 0; i < corners.length; i++) {
            const c = corners[i];
            ctx.beginPath();
            ctx.arc(c.x, c.y, 4, 0, Math.PI * 2);
            ctx.fill();
            // 角标文字
            ctx.font = 'bold 9px Consolas';
            ctx.fillStyle = 'rgba(5, 255, 161, 0.7)';
            const labels = ['左上', '右上', '右下', '左下'];
            ctx.fillText(labels[i], c.x + 6, c.y - 6);
            ctx.fillStyle = 'rgba(5, 255, 161, 0.9)';
        }

        // 绘制置信度
        const centerX = (corners[0].x + corners[2].x) / 2;
        const centerY = (corners[0].y + corners[2].y) / 2;
        ctx.font = '10px Consolas';
        ctx.fillStyle = 'rgba(5, 255, 161, 0.6)';
        ctx.textAlign = 'center';
        ctx.fillText(`识别置信度: ${Math.round(TargetDetector.detectionConfidence * 100)}%`, centerX, centerY);

        ctx.restore();
    }
};
