/**
 * shooter.js — 3D末日求生：公路行者
 * 射手技能系统：5段连击 + 燃烧弹AOE
 * 参考王者荣耀鲁班，自动瞄准最近怪物
 */
(function () {
    'use strict';

    // ==================== 段位配置 ====================
    const COMBO_STEPS = [
        { interval: 1.5, damageMul: 1.5, bulletColor: 0xffff00, bulletSize: 0.3, name: '蓄力射击', textColor: '#ffff00', icon: '1' },
        { interval: 1.5, damageMul: 0.7, bulletColor: 0xffffff, bulletSize: 0.2, name: '连射', textColor: '#ffffff', icon: '2' },
        { interval: 0.5, damageMul: 0.7, bulletColor: 0xffffff, bulletSize: 0.2, name: '连射', textColor: '#ffffff', icon: '3' },
        { interval: 0.5, damageMul: 0.7, bulletColor: 0xffffff, bulletSize: 0.2, name: '连射', textColor: '#ff2200', icon: '🔥' },
        { interval: 1.5, damageMul: 2.0, bulletColor: 0xff2200, bulletSize: 0.5, name: '燃烧弹', isAOE: true, aoeRadius: 5, burnDPS: 0.5, burnDuration: 2, textColor: '#ff2200', icon: '🔥' },
    ];
    const BULLET_SPEED = 30;
    const ATTACK_RANGE = 15;       // 攻击距离（世界单位）
    const MONSTER_DEFENSE = 2;     // 怪物防御

    // ==================== 状态 ====================
    var comboStep = 0;          // 0-4
    var cooldownTimer = 0;      // 当前段剩余冷却（秒）
    var baseDamage = 3;         // 玩家基础攻击力（测试值）
    var isActive = false;
    var currentTarget = null;   // 当前攻击目标（用于朝向）
    var waitingPeak = false;    // 是否在等待动画峰值（发射点）
    var currentStep = null;     // 当前发射步骤
    var firstShot = true;       // 是否为新一轮combo的首发射击（首次0.01s，循环1.5s）

    // ==================== 瞄准 ====================
    function findTarget() {
        var monsters = window.R3D ? window.R3D.getMonsters() : [];
        var playerPos = window.R3D ? window.R3D.getPlayerPosition() : { x: 0, z: 0 };
        var nearest = null;
        var nearestDist = Infinity;
        var rangeSq = ATTACK_RANGE * ATTACK_RANGE;
        for (var i = 0; i < monsters.length; i++) {
            var m = monsters[i];
            if (m.health !== undefined && m.health <= 0) continue;
            var dx = m.x - playerPos.x;
            var dz = m.z - playerPos.z;
            var dist = dx * dx + dz * dz;
            // ⭐ 只攻击范围内的目标
            if (dist < nearestDist && dist <= rangeSq) {
                nearestDist = dist;
                nearest = m;
            }
        }
        currentTarget = nearest;
        return nearest;
    }

    /**
     * 获取当前攻击目标（用于玩家朝向）
     */
    function getCurrentTarget() {
        return currentTarget;
    }

    // ==================== 射击 ====================
    function calcDamage(mul) {
        return Math.max(1, Math.floor(baseDamage * mul - MONSTER_DEFENSE));
    }

    function fireBullet(target) {
        var step = COMBO_STEPS[comboStep];
        var playerPos = window.R3D ? window.R3D.getPlayerPosition() : { x: 0, z: 0 };
        var damage = calcDamage(step.damageMul);

        if (window.R3D) {
            window.R3D.createBullet(
                playerPos.x, playerPos.z,
                target.x, target.z,
                BULLET_SPEED,
                step.bulletColor,
                step.bulletSize,
                damage
            );
        }
    }

    function fireBomb(target) {
        var step = COMBO_STEPS[comboStep];
        var playerPos = window.R3D ? window.R3D.getPlayerPosition() : { x: 0, z: 0 };
        var damage = calcDamage(step.damageMul);

        if (window.R3D) {
            // 燃烧弹：朝目标位置发射，命中后AOE
            window.R3D.createBullet(
                playerPos.x, playerPos.z,
                target.x, target.z,
                BULLET_SPEED * 0.8,  // 稍慢
                step.bulletColor,
                step.bulletSize,
                damage,
                true  // isBomb
            );
        }
    }

    function updateComboUI() {
        if (!window.R3D) return;
        var step = COMBO_STEPS[comboStep];
        window.R3D.updateComboUI(comboStep + 1, step.textColor, step.icon);
    }

    function clearComboUI() {
        if (!window.R3D) return;
        window.R3D.updateComboUI(0, '#ffffff', '');
    }

    // ==================== 公共API ====================
    var Shooter = {
        update: function (dt) {
            if (!isActive) return;

            // 寻找目标
            var target = findTarget();
            if (!target) {
                // 无目标时暂停计时器 + 清除红圈
                cooldownTimer = 0;
                if (window.R3D) window.R3D.setTargetMonster(null);
                return;
            }

            // ⭐ 每帧更新目标红圈（与朝向同步）
            if (window.R3D) {
                window.R3D.setTargetMonster(target);
            }

            // 冷却计时
            cooldownTimer += dt;
            var step = COMBO_STEPS[comboStep];

            // ⭐ 阶段一：冷却结束 → 触发瞄准动画，设置等待峰值标记
            // 首次射击（comboStep=0且firstShot=true）立即发射，不对等待1.5s
            var effectiveInterval = (comboStep === 0 && firstShot) ? 0.01 : step.interval;
            if (!waitingPeak && cooldownTimer >= effectiveInterval) {
                cooldownTimer -= effectiveInterval; // 保留溢出时间，动画耗时计入下一段冷却
                if (comboStep === 0 && firstShot) firstShot = false;
                if (window.R3D) {
                    if (step.isAOE) {
                        window.R3D.triggerShootAnimation(2);
                    } else {
                        window.R3D.triggerShootAnimation(comboStep % 2);
                    }
                }
                waitingPeak = true;
                currentStep = step;
            }

            // ⭐ 阶段二：动画到达最高点 → 发射子弹
            if (waitingPeak && window.R3D && window.R3D.isShootAnimAtPeak()) {
                waitingPeak = false;
                var stepToFire = currentStep;
                currentStep = null;

                if (stepToFire.isAOE) {
                    fireBomb(target);
                    clearComboUI();
                } else {
                    fireBullet(target);
                    updateComboUI();
                }

                // 切换到下一段（冷却计时器保留溢出，动画耗时已计入）
                comboStep = (comboStep + 1) % COMBO_STEPS.length;
            }
        },

        start: function () {
            isActive = true;
            comboStep = 0;
            cooldownTimer = 0;
            firstShot = true;
            clearComboUI();  // 初始不显示段位数字
        },

        stop: function () {
            isActive = false;
            comboStep = 0;
            cooldownTimer = 0;
            clearComboUI();
        },

        getState: function () {
            return {
                comboStep: comboStep,
                cooldownTimer: cooldownTimer,
                active: isActive,
                baseDamage: baseDamage
            };
        },

        /**
         * 获取当前攻击目标（用于玩家朝向）
         * @returns {Object|null} {x, z}
         */
        getCurrentTarget: function () {
            return getCurrentTarget();
        }
    };

    window.Shooter = Shooter;
})();