/**
 * battle.js — 3D末日求生：公路行者
 * 战斗场景控制：摇杆 + 玩家移动
 * 不启动独立循环，由 index.html 的 gameLoop 统一驱动
 */
(function () {
    'use strict';

    // ==================== 3D玩家状态 ====================
    var player3D = {
        x: 0,
        z: -30,
        speed: 8,
        rotation: 0
    };

    // ==================== 怪物刷新 ====================
    var monsterSpawnTimer = 0;
    var MONSTER_SPAWN_INTERVAL = 8.0; // 每8秒刷新一小群
    var MAX_MONSTERS = 30;
    var MIN_GROUP = 3; // 每群最少3只
    var MAX_GROUP = 4; // 每群最多4只

    // ==================== 摇杆 ====================
    var joystickActive = false;
    var joystickDirX = 0;
    var joystickDirY = 0;
    var joystickBase = null;
    var joystickThumb = null;
    var joystickZone = null;
    var joystickCenterX = 0;
    var joystickCenterY = 0;
    var JOYSTICK_MAX_RADIUS = 40;
    var joystickInitialized = false;

    // ==================== 键盘 WASD ====================
    var keys = { w: false, a: false, s: false, d: false };
    var keyboardActive = false;

    function initKeyboard() {
        window.addEventListener('keydown', function (e) {
            var key = e.key.toLowerCase();
            if (key === 'w' || key === 'a' || key === 's' || key === 'd') {
                e.preventDefault();
                keys[key] = true;
                keyboardActive = true;
            }
        });
        window.addEventListener('keyup', function (e) {
            var key = e.key.toLowerCase();
            if (key === 'w' || key === 'a' || key === 's' || key === 'd') {
                e.preventDefault();
                keys[key] = false;
                // 检查是否所有键都松开
                if (!keys.w && !keys.a && !keys.s && !keys.d) {
                    keyboardActive = false;
                }
            }
        });
    }

    function getKeyboardDir() {
        var dx = 0, dy = 0;
        // 屏幕方向映射：W=前(屏幕下方/-Z), S=后(屏幕上方/+Z), A=左(-X), D=右(+X)
        if (keys.w) dy -= 1;
        if (keys.s) dy += 1;
        if (keys.a) dx -= 1;
        if (keys.d) dx += 1;
        // 归一化
        var len = Math.sqrt(dx * dx + dy * dy);
        if (len > 0) {
            dx /= len;
            dy /= len;
        }
        return { x: dx, y: dy };
    }

    function initJoystick() {
        if (joystickInitialized) return;
        joystickInitialized = true;
        joystickZone = document.getElementById('joystickZone');
        joystickBase = document.getElementById('joystickBase');
        joystickThumb = document.getElementById('joystickThumb');

        if (!joystickZone || !joystickBase || !joystickThumb) return;

        joystickZone.addEventListener('touchstart', handleJoystickStart, { passive: false });
        joystickZone.addEventListener('touchmove', handleJoystickMove, { passive: false });
        joystickZone.addEventListener('touchend', handleJoystickEnd);
        joystickZone.addEventListener('touchcancel', handleJoystickEnd);

        joystickZone.addEventListener('mousedown', handleJoystickStart);
        document.addEventListener('mousemove', function (e) {
            if (joystickActive) handleJoystickMove(e);
        });
        document.addEventListener('mouseup', handleJoystickEnd);
    }

    function handleJoystickStart(e) {
        e.preventDefault();
        joystickActive = true;
        var rect = joystickZone.getBoundingClientRect();
        joystickCenterX = rect.left + rect.width / 2;
        joystickCenterY = rect.top + rect.height / 2;
        updateJoystickPosition(e);
    }

    function handleJoystickMove(e) {
        if (!joystickActive) return;
        e.preventDefault();
        updateJoystickPosition(e);
    }

    function handleJoystickEnd() {
        joystickActive = false;
        joystickDirX = 0;
        joystickDirY = 0;
        // 归位
        if (joystickThumb) {
            joystickThumb.style.transform = 'translate(-50%, -50%)';
        }
        if (window.R3D) window.R3D.setWalking(false);
    }

    function updateJoystickPosition(e) {
        var clientX, clientY;
        if (e.touches) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        var dx = clientX - joystickCenterX;
        var dy = clientY - joystickCenterY;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > JOYSTICK_MAX_RADIUS) {
            dx = (dx / dist) * JOYSTICK_MAX_RADIUS;
            dy = (dy / dist) * JOYSTICK_MAX_RADIUS;
        }
        if (joystickThumb) {
            joystickThumb.style.transform = 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px))';
        }
        joystickDirX = dx / JOYSTICK_MAX_RADIUS;
        joystickDirY = dy / JOYSTICK_MAX_RADIUS;
    }

    // ==================== 玩家移动（由 gameLoop 调用） ====================
    function updatePlayerMovement(dt) {
        var moveDirX = joystickDirX;
        var moveDirY = joystickDirY;
        var isMoving = joystickActive || (joystickDirX !== 0 || joystickDirY !== 0);

        // ⭐ 键盘优先于摇杆
        if (keyboardActive) {
            var kbd = getKeyboardDir();
            moveDirX = kbd.x;
            moveDirY = kbd.y;
            isMoving = true;
            // 摇杆归位（避免方向冲突）
            joystickActive = false;
            joystickDirX = 0;
            joystickDirY = 0;
            if (joystickThumb) {
                joystickThumb.style.transform = 'translate(-50%, -50%)';
            }
        }

        if (!isMoving) {
            if (window.R3D) window.R3D.setWalking(false);
            return;
        }
        var speed = player3D.speed * dt;
        var newX = player3D.x + moveDirX * speed;
        var newZ = player3D.z + moveDirY * speed;

        // 地图边界限制
        var bounds = window.R3D ? window.R3D.getRoadBounds() : { minX: -9, maxX: 9, minZ: -99, maxZ: 99 };
        newX = Math.max(bounds.minX, Math.min(bounds.maxX, newX));
        newZ = Math.max(bounds.minZ, Math.min(bounds.maxZ, newZ));

        // ⭐ 树木碰撞检测
        var PLAYER_RADIUS = 1.0;
        var treeCollisions = window.R3D ? window.R3D.getTreeCollisions() : [];
        for (var i = 0; i < treeCollisions.length; i++) {
            var t = treeCollisions[i];
            var dx = newX - t.x;
            var dz = newZ - t.z;
            var dist = Math.sqrt(dx * dx + dz * dz);
            var minDist = PLAYER_RADIUS + t.radius;
            if (dist < minDist && dist > 0.01) {
                var nx = dx / dist;
                var nz = dz / dist;
                newX = t.x + nx * minDist;
                newZ = t.z + nz * minDist;
            }
        }

        // ⭐ 怪物碰撞检测（推开玩家）
        if (window.R3D) {
            var monsters = window.R3D.getMonsters();
            for (var i = 0; i < monsters.length; i++) {
                var m = monsters[i];
                var dx = newX - m.x;
                var dz = newZ - m.z;
                var dist = Math.sqrt(dx * dx + dz * dz);
                var minDist = PLAYER_RADIUS + 1.25; // 怪物半径 ~1.25
                if (dist < minDist && dist > 0.01) {
                    var nx = dx / dist;
                    var nz = dz / dist;
                    newX = m.x + nx * minDist;
                    newZ = m.z + nz * minDist;
                }
            }
        }

        player3D.x = newX;
        player3D.z = newZ;

        if (window.R3D) {
            window.R3D.setPlayerPosition(player3D.x, player3D.z);
            window.R3D.setWalking(true);
        }
    }

    // ==================== 公共API ====================
    var Battle = {
        /**
         * 初始化战斗（由 startGame 调用一次）
         */
        start: function () {
            if (window.R3D && !window.R3D._initialized) {
                window.R3D._initialized = window.R3D.init();
            }
            // ⭐ 清空所有怪物（确保新关卡开始时没有残留）
            if (window.R3D) {
                window.R3D.clearMonsters();
            }
            // ⭐ 重置计时器（从头开始刷新怪物）
            monsterSpawnTimer = 0;
            initJoystick();
            initKeyboard();
            // 显示小地图
            document.getElementById('minimapCanvas').style.display = 'block';
            player3D.x = 0;
            player3D.z = -30;
            if (window.R3D) {
                window.R3D.setPlayerPosition(player3D.x, player3D.z);
                window.R3D.setPlayerRotation(0);
            }
            // ⭐ 启动射击系统
            if (window.Shooter) Shooter.start();
        },

        /**
         * 每帧更新（由 gameLoop 调用）
         * @param {number} dt - 秒
         */
        update: function (dt) {
            updatePlayerMovement(dt);

            // ⭐ 玩家朝向（每帧更新，即使静止时也面朝目标）
            var target = (window.Shooter && window.Shooter.getCurrentTarget) ? window.Shooter.getCurrentTarget() : null;
            if (target) {
                var dx = target.x - player3D.x;
                var dz = target.z - player3D.z;
                player3D.rotation = Math.atan2(dx, dz);
            } else if (joystickDirX !== 0 || joystickDirY !== 0) {
                player3D.rotation = Math.atan2(joystickDirX, joystickDirY);
            } else if (keyboardActive) {
                var kbd = getKeyboardDir();
                player3D.rotation = Math.atan2(kbd.x, kbd.y);
            }
            if (window.R3D) {
                window.R3D.setPlayerRotation(player3D.rotation);
            }

            // ⭐ 3D怪物刷新（小群生成）
            if (window.R3D) {
                monsterSpawnTimer += dt;
                var monsters = window.R3D.getMonsters();
                if (monsterSpawnTimer >= MONSTER_SPAWN_INTERVAL && monsters.length < MAX_MONSTERS) {
                    // 随机群大小和位置
                    var groupSize = MIN_GROUP + Math.floor(Math.random() * (MAX_GROUP - MIN_GROUP + 1));
                    // 从道路两端刷新，避开玩家位置
                    var bounds = window.R3D.getRoadBounds();
                    var roadHalfL = Math.abs(bounds.maxZ) * 0.85; // 使用实际道路85%长度
                    var centerZ = (Math.random() > 0.5 ? 1 : -1) * roadHalfL;
                    window.R3D.spawnMonsterGroup(groupSize, centerZ);
                    monsterSpawnTimer = 0;
                }
                // 怪物移动更新
                window.R3D.updateMonsters(dt);
            }

            // ⭐ 射击系统
            if (window.Shooter) {
                window.Shooter.update(dt);
            }

            // ⭐ 子弹更新 + 碰撞 + 灼烧
            if (window.R3D) {
                window.R3D.updateBullets(dt);
                window.R3D.checkBulletCollisions();
                window.R3D.updateBurnEffects(dt);
            }
        },

        /**
         * 每帧渲染3D（由 render 调用）
         */
        render: function () {
            renderMinimap();
            if (window.R3D) window.R3D.render();
        },

        stop: function () {
            joystickActive = false;
            joystickDirX = 0;
            joystickDirY = 0;
            keyboardActive = false;
            keys = { w: false, a: false, s: false, d: false };
            document.getElementById('minimapCanvas').style.display = 'none';
            if (window.R3D) window.R3D.setWalking(false);
            // ⭐ 停止射击系统
            if (window.Shooter) Shooter.stop();
        },

        getPlayer: function () {
            return player3D;
        }
    };

    window.Battle = Battle;

    // ==================== 小地图渲染 ====================
    function renderMinimap() {
        var canvas = document.getElementById('minimapCanvas');
        if (!canvas || canvas.style.display === 'none') return;
        var ctx = canvas.getContext('2d');
        var w = canvas.width;
        var h = canvas.height;
        var cx = w / 2;
        var cy = h / 2;

        // 获取道路边界
        var bounds = window.R3D ? window.R3D.getRoadBounds() : { minX: -25, maxX: 25, minZ: -100, maxZ: 100 };
        var mapW = Math.max(Math.abs(bounds.maxX), Math.abs(bounds.minX)) * 2 * 1.1;
        var mapH = Math.max(Math.abs(bounds.maxZ), Math.abs(bounds.minZ)) * 2 * 1.1;
        var scale = Math.min(w / mapW, h / mapH);

        // 清空
        ctx.clearRect(0, 0, w, h);

        // 背景
        ctx.fillStyle = 'rgba(10, 5, 2, 0.85)';
        ctx.fillRect(0, 0, w, h);

        // 道路范围
        var roadW = bounds.maxX * 2 * scale;
        var roadH = (bounds.maxZ - bounds.minZ) * scale;
        ctx.fillStyle = 'rgba(40, 30, 20, 0.6)';
        ctx.fillRect(cx - roadW / 2, cy - roadH / 2, roadW, roadH);
        ctx.strokeStyle = 'rgba(255, 160, 40, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(cx - roadW / 2, cy - roadH / 2, roadW, roadH);

        // 玩家位置
        var px = player3D.x * scale + cx;
        var pz = player3D.z * scale + cy;
        // 玩家方向三角形
        ctx.save();
        ctx.translate(px, pz);
        ctx.rotate(player3D.rotation + Math.PI);  // +π修正：三角形顶点=世界-Z，rotation基准=世界+Z
        ctx.fillStyle = '#00ff88';
        ctx.beginPath();
        ctx.moveTo(0, -5);
        ctx.lineTo(-3, 3);
        ctx.lineTo(3, 3);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();

        // 怪物位置（统一红色圆点）
        if (window.R3D) {
            var monsters = window.R3D.getMonsters();
            for (var i = 0; i < monsters.length; i++) {
                var m = monsters[i];
                var mx = m.x * scale + cx;
                var mz = m.z * scale + cy;
                // 裁剪到地图内
                if (mx < 0 || mx > w || mz < 0 || mz > h) continue;
                // 红色圆点，未触发追击的淡色显示
                var mc = m.aggroed ? '#ff3300' : 'rgba(255, 51, 0, 0.5)';
                ctx.fillStyle = mc;
                ctx.beginPath();
                ctx.arc(mx, mz, m.quality === 2 ? 2.5 : 1.8, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // 边框
        ctx.strokeStyle = 'rgba(255, 160, 40, 0.4)';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, w, h);
    }
})();
