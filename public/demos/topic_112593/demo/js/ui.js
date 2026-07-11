/* ==================== UI 控制 ==================== */
const UI = {
    elements: {},

    init() {
        // 缓存 DOM 元素
        this.elements = {
            loadingScreen: document.getElementById('loading-screen'),
            mainApp: document.getElementById('main-app'),
            dataRain: document.getElementById('data-rain'),
            loadingBar: document.querySelector('.loading-bar-fill'),
            loadingStatus: document.querySelector('.loading-status'),
            ammoCount: document.getElementById('ammo-count'),
            ammoBar: document.getElementById('ammo-bar'),
            totalScore: document.getElementById('total-score'),
            aimX: document.getElementById('aim-x'),
            aimY: document.getElementById('aim-y'),
            hintText: document.getElementById('hint-text'),
            stabilityBadge: document.getElementById('stability-badge'),
            trajectoryBadge: document.getElementById('trajectory-badge'),
            barWobble: document.getElementById('bar-wobble'),
            barTiming: document.getElementById('bar-timing'),
            barDeviation: document.getElementById('bar-deviation'),
            barConsistency: document.getElementById('bar-consistency'),
            valWobble: document.getElementById('val-wobble'),
            valTiming: document.getElementById('val-timing'),
            valDeviation: document.getElementById('val-deviation'),
            valConsistency: document.getElementById('val-consistency'),
            shotList: document.getElementById('phone-shot-list'),
            btnRestart: document.getElementById('btn-restart'),
            btnShare: document.getElementById('btn-share'),
            resultOverlay: document.getElementById('result-overlay'),
            resultStats: document.getElementById('result-stats'),
            btnResultRestart: document.getElementById('btn-result-restart'),
            btnResultShare: document.getElementById('btn-result-share'),
            leftPanel: document.getElementById('left-panel'),
            crosshairInfo: document.getElementById('crosshair-info'),
            timer: document.getElementById('timer-display'),
            // 手机界面元素
            phoneAmmo: document.getElementById('phone-ammo'),
            phoneStability: document.getElementById('phone-stability'),
            phoneDistance: document.getElementById('phone-distance'),
            phoneRing: document.getElementById('phone-ring'),
            phoneScore: document.getElementById('phone-score'),
            phoneRingVal: document.getElementById('phone-ring-val'),
            phoneShotCount: document.getElementById('phone-shot-count'),
            phoneStabilityBadge: document.getElementById('phone-stability-badge'),
        };

        // 初始化弹药显示
        this.renderAmmoBar();
    },

    // 加载动画
    onLoadingComplete: null,

    showLoading() {
        this.elements.loadingScreen.classList.remove('hidden');
        this.elements.mainApp.classList.add('hidden');
        this.createDataRain();
        this.animateLoading();
    },

    animateLoading() {
        const bar = this.elements.loadingBar;
        const status = this.elements.loadingStatus;
        const steps = [
            { pct: 20, text: '初始化视觉引擎...' },
            { pct: 45, text: '加载靶场数据...' },
            { pct: 70, text: '校准准星系统...' },
            { pct: 90, text: '启动分析模块...' },
            { pct: 100, text: '系统就绪' }
        ];
        let i = 0;
        const interval = setInterval(() => {
            if (i < steps.length) {
                bar.style.width = steps[i].pct + '%';
                status.textContent = steps[i].text;
                i++;
            } else {
                clearInterval(interval);
                setTimeout(() => {
                    this.elements.loadingScreen.classList.add('hidden');
                    this.elements.mainApp.classList.remove('hidden');
                    // 通知 App 加载完成
                    if (this.onLoadingComplete) {
                        // 使用 requestAnimationFrame 确保 DOM 渲染完成
                        requestAnimationFrame(() => {
                            requestAnimationFrame(() => {
                                this.onLoadingComplete();
                            });
                        });
                    }
                }, 300);
            }
        }, 400);
    },

    createDataRain() {
        const container = this.elements.dataRain;
        const chars = 'MINGCHEN01';
        for (let i = 0; i < 20; i++) {
            const col = document.createElement('div');
            col.className = 'col';
            col.style.left = (Math.random() * 100) + '%';
            col.style.animationDuration = (3 + Math.random() * 5) + 's';
            col.style.animationDelay = (Math.random() * 3) + 's';
            let text = '';
            for (let j = 0; j < 20; j++) {
                text += chars[Math.floor(Math.random() * chars.length)];
            }
            col.textContent = text;
            container.appendChild(col);
        }
    },

    // 更新弹药显示
    updateAmmo(count) {
        if (Shooting.maxAmmo >= 999) {
            this.elements.ammoCount.textContent = '∞';
            if (this.elements.phoneAmmo) this.elements.phoneAmmo.textContent = '∞';
        } else {
            this.elements.ammoCount.textContent = count;
            if (this.elements.phoneAmmo) this.elements.phoneAmmo.textContent = count;
        }
        this.renderAmmoBar();
    },

    _ammoBarMax: 0,

    renderAmmoBar() {
        const bar = this.elements.ammoBar;
        if (Shooting.maxAmmo >= 999) {
            bar.innerHTML = '';
            this._ammoBarMax = 0;
            return;
        }
        // 仅当最大弹药数变化时才重建 DOM
        if (this._ammoBarMax !== Shooting.maxAmmo) {
            bar.innerHTML = '';
            for (let i = 0; i < Shooting.maxAmmo; i++) {
                const bullet = document.createElement('div');
                bullet.className = 'bullet';
                bar.appendChild(bullet);
            }
            this._ammoBarMax = Shooting.maxAmmo;
        }
        // 只更新 class，不重建 DOM
        const bullets = bar.children;
        for (let i = 0; i < bullets.length; i++) {
            bullets[i].classList.toggle('spent', i >= Shooting.ammo);
        }
    },

    // 更新总分
    updateTotalScore(score) {
        this.elements.totalScore.textContent = score;
        if (this.elements.phoneScore) this.elements.phoneScore.textContent = '总分 ' + score;
    },

    // 更新准星坐标
    updateAimInfo(x, y) {
        this.elements.aimX.textContent = 'X: ' + Utils.formatNum(x, 0);
        this.elements.aimY.textContent = 'Y: ' + Utils.formatNum(y, 0);
    },

    // 更新计时器显示
    updateTimer(seconds) {
        if (!this.elements.timer) return;
        if (seconds > 0) {
            this.elements.timer.textContent = seconds + 's';
            this.elements.timer.style.color = seconds <= 10 ? 'var(--pink)' : 'var(--cyan)';
        } else {
            this.elements.timer.textContent = '';
        }
    },

    // 更新稳定性标签
    updateStabilityBadge(val) {
        const grade = Utils.getGrade(val);
        if (this.elements.stabilityBadge) {
            this.elements.stabilityBadge.textContent = grade.text;
            this.elements.stabilityBadge.style.color = grade.color;
            this.elements.stabilityBadge.style.borderColor = grade.color;
        }
        const s = Math.round(val);
        if (this.elements.phoneStability) this.elements.phoneStability.textContent = s + '%';
        if (this.elements.phoneStabilityBadge) this.elements.phoneStabilityBadge.textContent = s + '%';
    },

    // 更新弹道标签
    updateTrajectoryBadge(num) {
        if (this.elements.trajectoryBadge) {
            this.elements.trajectoryBadge.textContent = '第 ' + num + ' 发';
        }
    },

    // 更新评分面板
    updateScorePanel(scores) {
        const items = [
            { bar: this.elements.barWobble, val: this.elements.valWobble, score: scores.wobble },
            { bar: this.elements.barTiming, val: this.elements.valTiming, score: scores.timing },
            { bar: this.elements.barDeviation, val: this.elements.valDeviation, score: scores.deviation },
            { bar: this.elements.barConsistency, val: this.elements.valConsistency, score: scores.consistency }
        ];
        for (const item of items) {
            if (!item.bar || !item.val) continue;
            item.bar.style.width = item.score + '%';
            item.bar.className = 'score-bar ' + Utils.getBarClass(item.score);
            item.val.textContent = item.score;
        }
    },

    // 添加射击记录
    addShotRecord(shot, index) {
        const list = this.elements.shotList;
        if (index === 1) list.innerHTML = '';

        const item = document.createElement('div');
        item.className = 'phone-shot-item';

        const ringText = typeof shot.ring === 'number' ? shot.ring + '环' : shot.ring;
        // 简化时间格式化，避免 toLocaleTimeString 开销
        const d = new Date(shot.time);
        const timeStr = String(d.getHours()).padStart(2, '0') + ':' +
                        String(d.getMinutes()).padStart(2, '0') + ':' +
                        String(d.getSeconds()).padStart(2, '0');

        item.innerHTML = `
            <span class="phone-shot-index">#${index}</span>
            <span class="phone-shot-ring">${ringText}</span>
            <span class="phone-shot-score">${shot.score.toFixed(1)}</span>
            <span class="phone-shot-time">${timeStr}</span>
        `;
        item.addEventListener('click', () => App.openReplay(index - 1));
        item.style.cursor = 'pointer';
        list.insertBefore(item, list.firstChild);

        // 更新环数显示
        if (this.elements.phoneRing) {
            this.elements.phoneRing.textContent = ringText;
        }
        if (this.elements.phoneRingVal) {
            this.elements.phoneRingVal.textContent = ringText;
        }
        if (this.elements.phoneShotCount) {
            this.elements.phoneShotCount.textContent = index + '发';
        }
    },

    // 显示击发闪光
    showFlash() {
        const flash = document.createElement('div');
        flash.className = 'flash-overlay';
        this.elements.leftPanel.appendChild(flash);
        setTimeout(() => flash.remove(), 200);
    },

    // 显示最佳窗口提示
    showOptimalHint() {
        if (document.querySelector('.optimal-hint')) return;
        const hint = document.createElement('div');
        hint.className = 'optimal-hint';
        hint.textContent = 'OPTIMAL WINDOW';
        this.elements.leftPanel.appendChild(hint);
        setTimeout(() => hint.remove(), 2000);
    },

    // 更新提示文字
    setHint(text) {
        this.elements.hintText.textContent = text;
    },

    // 显示结算弹窗
    showResult(summary) {
        this._lastSummary = summary; // 保存用于高分辨率导出
        const overlay = this.elements.resultOverlay;
        const stats = this.elements.resultStats;

        stats.innerHTML =
            '<div class="result-stat"><div class="stat-val" style="color:' + summary.gradeColor + '">' + summary.grade + '</div><div class="stat-label">等级</div></div>' +
            '<div class="result-stat"><div class="stat-val">' + summary.totalScore + '</div><div class="stat-label">总分</div></div>' +
            '<div class="result-stat"><div class="stat-val">' + summary.avgRing + '</div><div class="stat-label">平均环数</div></div>' +
            '<div class="result-stat"><div class="stat-val">' + summary.bestShot + '</div><div class="stat-label">最佳单发</div></div>' +
            '<div class="result-stat"><div class="stat-val">' + summary.spread + '</div><div class="stat-label">散布半径</div></div>' +
            '<div class="result-stat"><div class="stat-val">' + summary.shotCount + '</div><div class="stat-label">射击次数</div></div>';

        if (this.elements.btnShare) this.elements.btnShare.disabled = false;
        overlay.classList.remove('hidden');

        // 绘制战绩卡 Canvas
        this.renderResultCard(summary);

        // 绘制弹着点热力图
        this.renderResultHeatmap();

        // 绘制训练分析
        this.renderRhythm();
        this.renderDeviation();
        this.renderTrajectory();
    },

    // 渲染弹着点热力图
    renderResultHeatmap() {
        const canvas = document.getElementById('result-heatmap');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        const cx = w / 2;
        const cy = h / 2;

        // 清空画布
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, w, h);

        const impacts = Shooting.impacts;
        if (impacts.length === 0) return;

        // 获取靶心坐标（从全局 App 对象）
        const targetCX = App.targetCX || 0;
        const targetCY = App.targetCY || 0;
        const targetRadius = App.targetRadius || 100;

        // 缩放比例：让靶纸占画布约 70% 宽度
        const scale = (w * 0.7) / (targetRadius * 2);

        // 绘制靶纸参考圈
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, targetRadius * scale, 0, Math.PI * 2);
        ctx.stroke();

        // 绘制靶心十字
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.1)';
        ctx.beginPath();
        ctx.moveTo(cx - 6, cy); ctx.lineTo(cx + 6, cy);
        ctx.moveTo(cx, cy - 6); ctx.lineTo(cx, cy + 6);
        ctx.stroke();

        // 网格密度计算
        const cellSize = 8;
        const cols = Math.ceil(w / cellSize);
        const rows = Math.ceil(h / cellSize);
        const grid = [];
        for (let r = 0; r < rows; r++) {
            grid[r] = new Float32Array(cols);
        }

        let maxDensity = 1;
        for (const imp of impacts) {
            const hx = cx + (imp.x - targetCX) * scale;
            const hy = cy + (imp.y - targetCY) * scale;
            const gx = Math.floor(hx / cellSize);
            const gy = Math.floor(hy / cellSize);
            // 影响周围 3x3 格子，形成平滑过渡
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const nx = gx + dx;
                    const ny = gy + dy;
                    if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        const weight = dist === 0 ? 1 : 0.5 / dist;
                        grid[ny][nx] += weight;
                        if (grid[ny][nx] > maxDensity) maxDensity = grid[ny][nx];
                    }
                }
            }
        }

        // 绘制热力密度
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const val = grid[r][c];
                if (val <= 0) continue;
                const ratio = val / maxDensity;
                const px = c * cellSize;
                const py = r * cellSize;

                // 颜色：低密→青色，中密→紫色，高密→粉红→金黄
                let rCol, gCol, bCol;
                if (ratio < 0.33) {
                    rCol = 0; gCol = 240; bCol = 255;
                } else if (ratio < 0.66) {
                    rCol = 188; gCol = 19; bCol = 254;
                } else {
                    rCol = 255; gCol = 42 + (1 - ratio) * 100; bCol = 109 + (1 - ratio) * 50;
                }

                ctx.fillStyle = 'rgba(' + rCol + ',' + gCol + ',' + bCol + ',' + (ratio * 0.7) + ')';
                ctx.fillRect(px, py, cellSize, cellSize);
            }
        }

        // 在最上层绘制弹着点（小圆点）
        for (const imp of impacts) {
            const hx = cx + (imp.x - targetCX) * scale;
            const hy = cy + (imp.y - targetCY) * scale;
            ctx.beginPath();
            ctx.arc(hx, hy, 2, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.fill();
        }
    },

    // 渲染击发节奏分析
    renderRhythm() {
        const container = document.getElementById('result-rhythm-bars');
        const statsEl = document.getElementById('result-rhythm-stats');
        if (!container) return;

        const shots = Shooting.shots;
        if (shots.length < 2) {
            container.innerHTML = '<div style="font-size:11px;color:var(--text-dim);">至少需要2发数据</div>';
            if (statsEl) statsEl.textContent = '';
            return;
        }

        // 计算相邻发的时间间隔
        const intervals = [];
        for (let i = 1; i < shots.length; i++) {
            intervals.push(shots[i].time - shots[i - 1].time);
        }

        const maxInterval = Math.max(...intervals);
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const minInterval = Math.min(...intervals);

        // 计算节奏均匀度（变异系数）
        const stdDev = Math.sqrt(intervals.reduce((s, v) => s + (v - avgInterval) ** 2, 0) / intervals.length);
        const cv = avgInterval > 0 ? (stdDev / avgInterval * 100) : 0;

        // 渲染柱状图
        container.innerHTML = '';
        intervals.forEach((interval, i) => {
            const height = Math.max(3, (interval / maxInterval) * 36);
            const bar = document.createElement('div');
            bar.className = 'result-rhythm-bar';
            bar.style.height = height + 'px';

            // 偏差超过平均的30%标记颜色
            if (interval > avgInterval * 1.3) bar.classList.add('rhythm-slow');
            else if (interval < avgInterval * 0.7) bar.classList.add('rhythm-fast');

            bar.title = '第' + (i + 1) + '-' + (i + 2) + '发: ' + (interval / 1000).toFixed(2) + 's';
            container.appendChild(bar);
        });

        if (statsEl) {
            const uniformity = cv < 15 ? '均匀' : cv < 30 ? '一般' : '不均匀';
            statsEl.textContent = '平均 ' + (avgInterval / 1000).toFixed(2) + 's | 节奏: ' + uniformity + ' (CV ' + cv.toFixed(0) + '%)';
        }
    },

    // 渲染偏差分解
    renderDeviation() {
        const targetCX = App.targetCX || 0;
        const targetCY = App.targetCY || 0;
        const shots = Shooting.shots;
        const hValEl = document.getElementById('dev-h-val');
        const vValEl = document.getElementById('dev-v-val');
        const hBarEl = document.getElementById('dev-h-bar');
        const vBarEl = document.getElementById('dev-v-bar');

        if (shots.length === 0) return;

        // 计算平均横向/纵向偏差
        let sumH = 0, sumV = 0;
        for (const s of shots) {
            sumH += s.impactX - targetCX;
            sumV += s.impactY - targetCY;
        }
        const avgH = sumH / shots.length;
        const avgV = sumV / shots.length;

        // 偏差最大值（用于归一化条形图）
        const maxDev = Math.max(Math.abs(avgH), Math.abs(avgV), 20);

        if (hValEl) hValEl.textContent = avgH.toFixed(1);
        if (vValEl) vValEl.textContent = avgV.toFixed(1);

        if (hBarEl) {
            const pct = Math.min(Math.abs(avgH) / maxDev * 45, 45);
            if (avgH >= 0) {
                hBarEl.style.left = '50%';
                hBarEl.style.width = pct + '%';
                hBarEl.style.background = avgH > 5 ? '#ff2a6d' : 'var(--cyan)';
            } else {
                hBarEl.style.left = (50 - pct) + '%';
                hBarEl.style.width = pct + '%';
                hBarEl.style.background = avgH < -5 ? '#ff2a6d' : 'var(--cyan)';
            }
        }

        if (vBarEl) {
            const pct = Math.min(Math.abs(avgV) / maxDev * 45, 45);
            if (avgV >= 0) {
                vBarEl.style.left = '50%';
                vBarEl.style.width = pct + '%';
                vBarEl.style.background = avgV > 5 ? '#ff2a6d' : 'var(--cyan)';
            } else {
                vBarEl.style.left = (50 - pct) + '%';
                vBarEl.style.width = pct + '%';
                vBarEl.style.background = avgV < -5 ? '#ff2a6d' : 'var(--cyan)';
            }
        }
    },

    // 渲染轨迹对比
    renderTrajectory() {
        const selA = document.getElementById('traj-sel-a');
        const selB = document.getElementById('traj-sel-b');
        const canvas = document.getElementById('result-trajectory');
        if (!selA || !selB || !canvas) return;

        const shots = Shooting.shots;
        selA.innerHTML = '';
        selB.innerHTML = '';

        for (let i = 0; i < shots.length; i++) {
            const ring = typeof shots[i].ring === 'number' ? shots[i].ring.toFixed(1) : shots[i].ring;
            const optA = document.createElement('option');
            optA.value = i;
            optA.textContent = '第' + (i + 1) + '发 (' + ring + '环)';
            selA.appendChild(optA);

            const optB = document.createElement('option');
            optB.value = i;
            optB.textContent = '第' + (i + 1) + '发 (' + ring + '环)';
            selB.appendChild(optB);
        }

        if (shots.length >= 2) selB.value = 1;

        const draw = () => {
            const ctx = canvas.getContext('2d');
            const w = canvas.width;
            const h = canvas.height;
            ctx.fillStyle = '#0a0a0f';
            ctx.fillRect(0, 0, w, h);

            // 中心线
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(0, h / 2);
            ctx.lineTo(w, h / 2);
            ctx.stroke();
            ctx.setLineDash([]);

            const aIdx = parseInt(selA.value);
            const bIdx = parseInt(selB.value);

            // 用稳定性模拟轨迹曲线
            const drawTrajectory = (shot, color, label) => {
                const stability = shot.stability || 70;
                const points = 60;
                ctx.strokeStyle = color;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                for (let i = 0; i <= points; i++) {
                    const t = i / points;
                    const x = t * w;
                    const wobble = Math.sin(t * Math.PI * 3) * (100 - stability) * 0.15;
                    const drift = (t - 0.5) * (shot.impactX - shot.aimX) * 0.5;
                    const y = h / 2 + wobble + drift;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();

                // 标签
                ctx.fillStyle = color;
                ctx.font = '9px sans-serif';
                ctx.fillText(label, 4, color === '#00f0ff' ? 12 : h - 4);
            };

            if (shots[aIdx]) drawTrajectory(shots[aIdx], '#00f0ff', 'A: 第' + (aIdx + 1) + '发');
            if (shots[bIdx] && bIdx !== aIdx) drawTrajectory(shots[bIdx], '#ff6b9d', 'B: 第' + (bIdx + 1) + '发');
        };

        selA.onchange = draw;
        selB.onchange = draw;
        draw();
    },

    // 渲染战绩卡（支持任意尺寸，默认使用 result-canvas）
    renderResultCard(summary, targetCanvas) {
        const canvas = targetCanvas || document.getElementById('result-canvas');
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        const s = w / 400; // 以 400px 为基准缩放
        const theme = Settings.cardThemes[Settings.data.cardTheme || 'cyan'];

        // 背景
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, w, h);

        // 渐变边框
        const grad = ctx.createLinearGradient(0, 0, w, h);
        const bc = theme.borderColors;
        grad.addColorStop(0, bc[0]);
        grad.addColorStop(0.5, bc[1]);
        grad.addColorStop(1, bc[2]);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2 * s;
        ctx.strokeRect(4 * s, 4 * s, w - 8 * s, h - 8 * s);

        // 扫描线效果
        ctx.globalAlpha = 0.03;
        for (let y = 0; y < h; y += 3 * s) {
            ctx.fillStyle = theme.scanline;
            ctx.fillRect(0, y, w, 1 * s);
        }
        ctx.globalAlpha = 1;

        // 品牌名
        ctx.font = `bold ${22 * s}px Consolas, monospace`;
        ctx.fillStyle = theme.primary;
        ctx.textAlign = 'center';
        ctx.shadowColor = theme.brandShadow;
        ctx.shadowBlur = 8 * s;
        ctx.fillText('MINGCHEN', w / 2, 32 * s);
        ctx.shadowBlur = 0;

        ctx.font = `${10 * s}px sans-serif`;
        ctx.fillStyle = theme.subTitleColor;
        ctx.fillText('激光射击分析系统 - 训练报告', w / 2, 48 * s);

        // 等级（大字）— 使用主题主色调，保持风格统一
        ctx.font = `bold ${42 * s}px Consolas, monospace`;
        ctx.fillStyle = theme.primary;
        ctx.shadowColor = theme.brandShadow;
        ctx.shadowBlur = 14 * s;
        ctx.fillText(summary.grade, w / 2, 88 * s);
        ctx.shadowBlur = 0;

        // 数据行（两列紧凑布局）
        const data = [
            ['总分', summary.totalScore],
            ['平均环数', summary.avgRing],
            ['最佳单发', summary.bestShot],
            ['散布半径', summary.spread],
            ['射击次数', summary.shotCount]
        ];

        ctx.font = `${10 * s}px sans-serif`;
        const startY = 108 * s;
        const lineH = 14 * s;
        data.forEach((row, i) => {
            const y = startY + i * lineH;
            ctx.fillStyle = theme.labelColor;
            ctx.textAlign = 'left';
            ctx.fillText(row[0], 30 * s, y);
            ctx.fillStyle = theme.valueColor;
            ctx.textAlign = 'right';
            ctx.font = `bold ${11 * s}px Consolas, monospace`;
            ctx.fillText(String(row[1]), w - 30 * s, y);
            ctx.font = `${10 * s}px sans-serif`;
        });

        // 底部时间戳
        ctx.font = `${9 * s}px Consolas, monospace`;
        ctx.fillStyle = theme.labelColor;
        ctx.textAlign = 'center';
        const now = new Date();
        ctx.fillText(now.toLocaleString('zh-CN'), w / 2, h - 6 * s);

        return canvas;
    },

    // 隐藏结算弹窗
    hideResult() {
        this.elements.resultOverlay.classList.add('hidden');
    },

    // 重置所有 UI
    resetUI() {
        this.updateAmmo(Shooting.maxAmmo);
        this.updateTotalScore(0);
        this.updateStabilityBadge(0);
        this.updateTrajectoryBadge(0);
        if (this.elements.barWobble) this.elements.barWobble.style.width = '0%';
        if (this.elements.barTiming) this.elements.barTiming.style.width = '0%';
        if (this.elements.barDeviation) this.elements.barDeviation.style.width = '0%';
        if (this.elements.barConsistency) this.elements.barConsistency.style.width = '0%';
        if (this.elements.valWobble) this.elements.valWobble.textContent = '--';
        if (this.elements.valTiming) this.elements.valTiming.textContent = '--';
        if (this.elements.valDeviation) this.elements.valDeviation.textContent = '--';
        if (this.elements.valConsistency) this.elements.valConsistency.textContent = '--';
        if (this.elements.shotList) this.elements.shotList.innerHTML = '<div class="phone-empty-hint">等待射击...</div>';
        if (this.elements.btnShare) this.elements.btnShare.disabled = true;
        this.setHint('移动鼠标瞄准，点击左键射击');
        this.updateTimer(0);
        this.hideResult();
        if (this.elements.phoneRing) this.elements.phoneRing.textContent = '--';
        if (this.elements.phoneRingVal) this.elements.phoneRingVal.textContent = '--';
        if (this.elements.phoneScore) this.elements.phoneScore.textContent = '总分 0';
        if (this.elements.phoneShotCount) this.elements.phoneShotCount.textContent = '0发';
        if (this.elements.phoneDistance) this.elements.phoneDistance.textContent = DistanceSystem.getDistanceLabel();
        if (this.elements.phoneStabilityBadge) this.elements.phoneStabilityBadge.textContent = '--';
    }
};
