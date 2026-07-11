/* ==================== FPS 第一人称视角渲染（真实射击模拟） ==================== */
const FPSView = {
    // ===== 枪物理属性 =====
    gunAngleX: 0,         // 枪的水平角度（-1 ~ 1，对应左右）
    gunAngleY: 0,         // 枪的垂直角度（-1 ~ 1，对应上下）
    gunAngleVelX: 0,      // 枪角速度
    gunAngleVelY: 0,
    gunInertia: 0.15,     // 惯性系数（越大越迟钝）
    gunDamping: 0.92,     // 阻尼系数

    // ===== 后坐力 =====
    recoilKick: 0,        // 后坐力上跳
    recoilKickTarget: 0,
    recoilSide: 0,        // 后坐力侧偏
    recoilBlur: 0,        // 后坐力模糊

    // ===== 呼吸 =====
    breathPhase: 0,       // 呼吸相位
    breathSpeed: 0.4,     // 呼吸速度
    breathAmplitude: 8,   // 呼吸幅度（像素）

    // ===== 心跳 =====
    heartbeatPhase: 0,
    heartbeatSpeed: 4.0,  // 心跳速度（约 60bpm）
    heartbeatAmplitude: 1.5,

    // ===== 枪口闪光 =====
    muzzleFlash: 0,
    muzzleFlashIntensity: 0,

    // ===== 扳机状态 =====
    triggerPull: 0,       // 0 ~ 1，扳机扣动程度
    isTriggerPulled: false,
    triggerThreshold: 0.85, // 击发阈值

    // ===== 瞄准镜视野 =====
    scopeOffsetX: 0,
    scopeOffsetY: 0,

    // ===== 疲劳 =====
    fatigue: 0,           // 0 ~ 1，疲劳度
    aimTime: 0,           // 瞄准持续时间

    // 更新枪身状态
    update(dt, time, mouseNormX, mouseNormY, isTriggerDown) {
        // ---- 呼吸 ----
        this.breathPhase += dt * this.breathSpeed * Math.PI * 2;
        const breathOffset = Math.sin(this.breathPhase) * this.breathAmplitude;

        // ---- 心跳 ----
        this.heartbeatPhase += dt * this.heartbeatSpeed * Math.PI * 2;
        const heartbeatOffset = Math.sin(this.heartbeatPhase) * this.heartbeatAmplitude;

        // ---- 疲劳累积 ----
        this.aimTime += dt;
        this.fatigue = Math.min(1, this.aimTime / 15); // 15秒后达到最大疲劳
        const fatigueShake = this.fatigue * 3; // 疲劳导致的额外抖动

        // ---- 枪物理：鼠标控制枪的指向（有惯性和延迟）----
        // 鼠标位置映射到目标角度
        const targetAngleX = (mouseNormX - 0.5) * 2; // -1 ~ 1
        const targetAngleY = (mouseNormY - 0.5) * 2;

        // 弹簧-阻尼系统模拟枪的惯性
        const springK = 3.0;
        const forceX = (targetAngleX - this.gunAngleX) * springK;
        const forceY = (targetAngleY - this.gunAngleY) * springK;

        this.gunAngleVelX += forceX * dt;
        this.gunAngleVelY += forceY * dt;
        this.gunAngleVelX *= this.gunDamping;
        this.gunAngleVelY *= this.gunDamping;

        this.gunAngleX += this.gunAngleVelX * dt;
        this.gunAngleY += this.gunAngleVelY * dt;

        // ---- 瞄准镜视野偏移（枪角度 + 呼吸 + 心跳 + 疲劳）----
        const scopeRange = 40;
        this.scopeOffsetX = this.gunAngleX * scopeRange + heartbeatOffset * 0.5 + (Math.random() - 0.5) * fatigueShake;
        this.scopeOffsetY = this.gunAngleY * scopeRange + breathOffset + heartbeatOffset + (Math.random() - 0.5) * fatigueShake;

        // ---- 后坐力衰减 ----
        this.recoilKick = Utils.lerp(this.recoilKick, this.recoilKickTarget, dt * 6);
        if (this.recoilKickTarget > 0) {
            this.recoilKickTarget = Utils.lerp(this.recoilKickTarget, 0, dt * 3);
        }
        this.recoilSide *= 0.95;
        this.recoilBlur *= 0.9;

        // ---- 枪口闪光衰减 ----
        if (this.muzzleFlash > 0) {
            this.muzzleFlash -= dt * 5;
            if (this.muzzleFlash < 0) this.muzzleFlash = 0;
        }

        // ---- 扳机处理 ----
        if (isTriggerDown && !this.isTriggerPulled) {
            // 开始扣扳机
            this.isTriggerPulled = true;
        }
        if (!isTriggerDown && this.isTriggerPulled) {
            // 释放扳机
            this.isTriggerPulled = false;
            this.triggerPull = 0;
        }
        if (this.isTriggerPulled) {
            this.triggerPull = Math.min(1, this.triggerPull + dt * 2); // 0.5秒扣到底
        }
    },

    // 触发击发效果
    fire() {
        this.recoilKickTarget = 25;
        this.recoilSide = (Math.random() - 0.5) * 10;
        this.recoilBlur = 1;
        this.muzzleFlash = 1;
        this.muzzleFlashIntensity = 1;
        this.aimTime = 0; // 重置疲劳
        this.fatigue = 0;
    },

    // 检查是否应该击发（扳机扣到底）
    shouldFire() {
        return this.triggerPull >= this.triggerThreshold;
    },

    // 绘制 FPS 视角
    draw(ctx, w, h, time) {
        ctx.save();

        // 1. 绘制瞄准镜视野内的靶纸
        this.drawScopeView(ctx, w, h);

        // 2. 绘制瞄准镜边框
        this.drawScopeBorder(ctx, w, h);

        // 3. 绘制枪身
        this.drawGun(ctx, w, h);

        // 4. 绘制枪口闪光
        if (this.muzzleFlash > 0) {
            this.drawMuzzleFlash(ctx, w, h);
        }

        // 5. 绘制激光点
        this.drawLaserDot(ctx, w, h);

        // 6. 绘制 HUD
        this.drawHUD(ctx, w, h);

        // 7. 绘制扳机状态
        this.drawTriggerStatus(ctx, w, h);

        ctx.filter = 'none';
        ctx.restore();
    },

    // 绘制瞄准镜视野内的靶纸
    drawScopeView(ctx, w, h) {
        const scopeCX = w / 2 + this.scopeOffsetX + this.recoilSide;
        const scopeCY = h / 2 + this.scopeOffsetY - this.recoilKick;
        const scopeRadius = Math.min(w, h) * 0.32;

        ctx.save();
        ctx.beginPath();
        ctx.arc(scopeCX, scopeCY, scopeRadius, 0, Math.PI * 2);
        ctx.clip();

        // 视野内背景（深色）
        ctx.fillStyle = '#08080f';
        ctx.fillRect(0, 0, w, h);

        // 绘制靶纸（在视野中心固定位置，枪的晃动让靶纸看起来在动）
        const targetX = scopeCX;
        const targetY = scopeCY;
        const r = scopeRadius * 0.7;
        Target.draw(ctx, targetX, targetY, r);

        // 绘制弹着点（相对于视野）
        for (const imp of Shooting.impacts) {
            // 将全局坐标转换为视野内坐标
            const impX = scopeCX + (imp.x - w / 2) * 0.4;
            const impY = scopeCY + (imp.y - h / 2) * 0.4;
            Target.drawImpact(ctx, impX, impY, imp.score);
        }

        // 十字准线（瞄准镜刻度）
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(scopeCX - scopeRadius + 10, scopeCY);
        ctx.lineTo(scopeCX - 20, scopeCY);
        ctx.moveTo(scopeCX + 20, scopeCY);
        ctx.lineTo(scopeCX + scopeRadius - 10, scopeCY);
        ctx.moveTo(scopeCX, scopeCY - scopeRadius + 10);
        ctx.lineTo(scopeCX, scopeCY - 20);
        ctx.moveTo(scopeCX, scopeCY + 20);
        ctx.lineTo(scopeCX, scopeCY + scopeRadius - 10);
        ctx.stroke();

        // 中心红点
        ctx.beginPath();
        ctx.arc(scopeCX, scopeCY, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ff2a6d';
        ctx.shadowColor = '#ff2a6d';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;

        // 距离刻度
        ctx.font = '8px Consolas, monospace';
        ctx.fillStyle = 'rgba(0, 240, 255, 0.3)';
        ctx.textAlign = 'center';
        ctx.fillText('10m', scopeCX, scopeCY + scopeRadius - 6);

        ctx.restore();
    },

    // 绘制瞄准镜边框
    drawScopeBorder(ctx, w, h) {
        const scopeCX = w / 2 + this.scopeOffsetX + this.recoilSide;
        const scopeCY = h / 2 + this.scopeOffsetY - this.recoilKick;
        const scopeRadius = Math.min(w, h) * 0.32;

        // 外圈发光
        ctx.beginPath();
        ctx.arc(scopeCX, scopeCY, scopeRadius + 2, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // 外圈
        ctx.beginPath();
        ctx.arc(scopeCX, scopeCY, scopeRadius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 四角刻度线
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
        ctx.lineWidth = 1;
        const tickLen = 12;
        const offset = scopeRadius - 2;
        const corners = [
            [-1, -1], [1, -1], [-1, 1], [1, 1]
        ];
        for (const [sx, sy] of corners) {
            ctx.beginPath();
            ctx.moveTo(scopeCX + sx * offset, scopeCY + sy * (offset - tickLen));
            ctx.lineTo(scopeCX + sx * offset, scopeCY + sy * offset);
            ctx.lineTo(scopeCX + sx * (offset - tickLen), scopeCY + sy * offset);
            ctx.stroke();
        }

        // 视野外的暗角
        ctx.fillStyle = 'rgba(5, 5, 10, 0.85)';
        ctx.beginPath();
        ctx.rect(0, 0, w, h);
        ctx.arc(scopeCX, scopeCY, scopeRadius, 0, Math.PI * 2, true);
        ctx.fill();

        // 后坐力时的屏幕震动暗角
        if (this.recoilBlur > 0.1) {
            ctx.fillStyle = 'rgba(255, 200, 100, ' + (this.recoilBlur * 0.1) + ')';
            ctx.fillRect(0, 0, w, h);
        }
    },

    // 绘制枪身
    drawGun(ctx, w, h) {
        const recoilY = this.recoilKick;
        const swayX = this.gunAngleX * 15;
        const baseY = h + recoilY;
        const gunCX = w / 2;

        ctx.save();

        // 枪托
        ctx.fillStyle = '#1a1a24';
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(gunCX - 65 + swayX, baseY);
        ctx.lineTo(gunCX - 80 + swayX, baseY - 100);
        ctx.lineTo(gunCX - 40 + swayX, baseY - 110);
        ctx.lineTo(gunCX - 20 + swayX, baseY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 枪管
        ctx.fillStyle = '#22222e';
        ctx.beginPath();
        ctx.moveTo(gunCX - 40 + swayX, baseY - 100);
        ctx.lineTo(gunCX + 10 + swayX, baseY - 160);
        ctx.lineTo(gunCX + 50 + swayX, baseY - 160);
        ctx.lineTo(gunCX + 20 + swayX, baseY - 95);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 瞄准镜底座
        ctx.fillStyle = '#2a2a36';
        ctx.beginPath();
        ctx.moveTo(gunCX - 10 + swayX, baseY - 130);
        ctx.lineTo(gunCX + 10 + swayX, baseY - 175);
        ctx.lineTo(gunCX + 70 + swayX, baseY - 175);
        ctx.lineTo(gunCX + 50 + swayX, baseY - 130);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 瞄准镜筒
        ctx.fillStyle = '#15151e';
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
        ctx.beginPath();
        ctx.moveTo(gunCX + 5 + swayX, baseY - 175);
        ctx.lineTo(gunCX - 15 + swayX, baseY - 210);
        ctx.lineTo(gunCX + 75 + swayX, baseY - 210);
        ctx.lineTo(gunCX + 55 + swayX, baseY - 175);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 瞄准镜镜片反光
        ctx.fillStyle = 'rgba(0, 240, 255, 0.1)';
        ctx.beginPath();
        ctx.moveTo(gunCX + 15 + swayX, baseY - 200);
        ctx.lineTo(gunCX + 10 + swayX, baseY - 207);
        ctx.lineTo(gunCX + 40 + swayX, baseY - 207);
        ctx.closePath();
        ctx.fill();

        // 握把
        ctx.fillStyle = '#1e1e28';
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
        ctx.beginPath();
        ctx.moveTo(gunCX - 30 + swayX, baseY - 70);
        ctx.lineTo(gunCX - 20 + swayX, baseY - 30);
        ctx.lineTo(gunCX + 10 + swayX, baseY - 35);
        ctx.lineTo(gunCX + 5 + swayX, baseY - 75);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 扳机护圈
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(gunCX - 5 + swayX, baseY - 60, 10, 0, Math.PI, false);
        ctx.stroke();

        // 扳机（显示扣动状态）
        const triggerAngle = this.triggerPull * 0.5; // 扣动角度
        ctx.strokeStyle = 'rgba(255, 42, 109, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(gunCX - 5 + swayX, baseY - 60, 6, Math.PI * 0.3 + triggerAngle, Math.PI * 0.7 + triggerAngle);
        ctx.stroke();

        ctx.restore();
    },

    // 绘制枪口闪光
    drawMuzzleFlash(ctx, w, h) {
        const swayX = this.gunAngleX * 15;
        const recoilY = this.recoilKick;
        const baseY = h + recoilY;
        const muzzleX = w / 2 + 30 + swayX;
        const muzzleY = baseY - 160;
        const alpha = this.muzzleFlash;

        ctx.save();

        // 主闪光
        ctx.beginPath();
        ctx.arc(muzzleX, muzzleY, 20 * alpha, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 200, 80, ' + (alpha * 0.9) + ')';
        ctx.shadowColor = '#ffcc00';
        ctx.shadowBlur = 40 * alpha;
        ctx.fill();

        // 核心白光
        ctx.beginPath();
        ctx.arc(muzzleX, muzzleY, 8 * alpha, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, ' + alpha + ')';
        ctx.shadowBlur = 30 * alpha;
        ctx.fill();

        // 闪光射线
        ctx.strokeStyle = 'rgba(255, 200, 100, ' + (alpha * 0.6) + ')';
        ctx.lineWidth = 2 * alpha;
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
            const len = 25 + Math.random() * 20;
            ctx.beginPath();
            ctx.moveTo(muzzleX, muzzleY);
            ctx.lineTo(
                muzzleX + Math.cos(angle) * len,
                muzzleY + Math.sin(angle) * len
            );
            ctx.stroke();
        }

        ctx.restore();
    },

    // 绘制激光点
    drawLaserDot(ctx, w, h) {
        const scopeCX = w / 2 + this.scopeOffsetX + this.recoilSide;
        const scopeCY = h / 2 + this.scopeOffsetY - this.recoilKick;

        ctx.save();
        ctx.beginPath();
        ctx.arc(scopeCX, scopeCY, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ff2a6d';
        ctx.shadowColor = '#ff2a6d';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        // 外圈
        ctx.beginPath();
        ctx.arc(scopeCX, scopeCY, 6, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 42, 109, 0.3)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        ctx.restore();
    },

    // 绘制 HUD
    drawHUD(ctx, w, h) {
        ctx.save();

        // 弹药计数
        ctx.font = 'bold 14px Consolas, monospace';
        ctx.fillStyle = 'rgba(0, 240, 255, 0.6)';
        ctx.textAlign = 'left';
        ctx.fillText('AMMO: ' + Shooting.ammo + '/' + Shooting.maxAmmo, 16, h - 16);

        // 距离
        ctx.font = '11px Consolas, monospace';
        ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
        ctx.textAlign = 'right';
        ctx.fillText('DIST: 10m', w - 16, h - 16);

        // 风速
        ctx.fillText('WIND: 2.3m/s E', w - 16, h - 32);

        // 疲劳指示
        if (this.fatigue > 0.3) {
            ctx.font = '11px Consolas, monospace';
            ctx.fillStyle = 'rgba(255, 42, 109, ' + this.fatigue + ')';
            ctx.textAlign = 'center';
            ctx.fillText('FATIGUE', w / 2, h - 50);
        }

        ctx.restore();
    },

    // 绘制扳机状态指示
    drawTriggerStatus(ctx, w, h) {
        if (this.triggerPull <= 0) return;

        const barW = 100;
        const barH = 4;
        const x = w / 2 - barW / 2;
        const y = h - 70;

        ctx.save();

        // 背景
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(x, y, barW, barH);

        // 进度
        const progress = this.triggerPull;
        const color = progress >= this.triggerThreshold ? '#05ffa1' : '#00f0ff';
        ctx.fillStyle = color;
        ctx.fillRect(x, y, barW * progress, barH);

        // 阈值线
        ctx.strokeStyle = '#ff2a6d';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + barW * this.triggerThreshold, y - 2);
        ctx.lineTo(x + barW * this.triggerThreshold, y + barH + 2);
        ctx.stroke();

        // 文字
        ctx.font = '9px Consolas, monospace';
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.fillText('TRIGGER', w / 2, y - 5);

        ctx.restore();

        // 后坐力暗角效果（轻量，替代昂贵的 ctx.filter blur）
        if (this.recoilBlur > 0.01) {
            ctx.globalAlpha = this.recoilBlur * 0.1;
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, w, h);
            ctx.globalAlpha = 1;
        }
    },

    // 获取当前瞄准位置（用于计算弹着点）
    getAimPosition(w, h) {
        return {
            x: w / 2 + this.scopeOffsetX + this.recoilSide,
            y: h / 2 + this.scopeOffsetY - this.recoilKick
        };
    },

    // 重置
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
        this.muzzleFlashIntensity = 0;
        this.triggerPull = 0;
        this.isTriggerPulled = false;
        this.scopeOffsetX = 0;
        this.scopeOffsetY = 0;
        this.fatigue = 0;
        this.aimTime = 0;
        this.breathPhase = 0;
        this.heartbeatPhase = 0;
    }
};
