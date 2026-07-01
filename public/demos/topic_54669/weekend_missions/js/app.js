'use strict';

// ==========================================
// 外围流程驱动：boot → ai-chat → ai-generating → dialog → 引擎 → result → share
// 与引擎通过全局 WM 通信：WM.startMission(themeId) / WM.onAllCleared()
// ==========================================
WM.app = {
    currentThemeId: null,
    shareTemplate: 'pixel',
    chipSelection: { scene: null, budget: 200, people: 2 },
    themeDefaults: {
        'shenzhen-couple': { budget: 200, people: 2 },
        'hangzhou-solo': { budget: 150, people: 1 },
        'shanghai-friends': { budget: 500, people: 4 },
    },

    pages: ['boot', 'ai-chat', 'ai-generating', 'dialog', 'result', 'share'],

    init: function () {
        this.bindEvents();
        this.renderAiChat();
        this.showDomPage('boot');
        var self = this;
        setTimeout(function () { self.showAiChat(); }, 1200);
    },

    // ---- 层 / 页面切换 ----
    showDomPage: function (name) {
        document.getElementById('dom-layer').classList.remove('hidden');
        document.getElementById('game-layer').classList.add('hidden');
        this.pages.forEach(function (p) {
            var el = document.getElementById('page-' + p);
            if (el) el.classList.toggle('active', p === name);
        });
        this.currentPage = name;
    },

    // 引擎调用：切到 Canvas 层
    showGameLayer: function () {
        document.getElementById('dom-layer').classList.add('hidden');
        document.getElementById('game-layer').classList.remove('hidden');
        if (WM.map && typeof WM.map.resize === 'function') WM.map.resize();
        if (typeof WM.fitGameCanvas === 'function') WM.fitGameCanvas();
    },

    // ---- ai-chat：AI 对话输入 ----
    showAiChat: function () {
        this.showDomPage('ai-chat');
        this.typeGreeting();
    },

    typeGreeting: function () {
        var el = document.getElementById('ai-greeting');
        var text = '特工，密令系统已激活。告诉我你的周末计划。';
        el.textContent = '';
        var i = 0;
        var self = this;
        clearInterval(this._greetTimer);
        this._greetTimer = setInterval(function () {
            if (i >= text.length) { clearInterval(self._greetTimer); return; }
            el.textContent += text[i++];
        }, 40);
    },

    applyThemeDefaults: function (themeId) {
        var defaults = this.themeDefaults[themeId];
        if (!defaults) return;
        this.chipSelection.budget = defaults.budget;
        this.chipSelection.people = defaults.people;
        document.querySelectorAll('#chips-budget .chip').forEach(function (chip) {
            chip.classList.toggle('selected', Number(chip.getAttribute('data-value')) === defaults.budget);
        });
        document.querySelectorAll('#chips-people .chip').forEach(function (chip) {
            chip.classList.toggle('selected', Number(chip.getAttribute('data-value')) === defaults.people);
        });
    },

    getPlanMode: function () {
        var budget = this.chipSelection.budget;
        if (budget <= 150) return { label: '省钱模式', desc: '优先选择免费点位、轻消费任务和步行友好路线。' };
        if (budget >= 500) return { label: '豪华小队模式', desc: '加入餐饮、伴手礼、夜景打卡和更强聚会感。' };
        return { label: '均衡探索模式', desc: '在预算、体力和体验密度之间保持平衡。' };
    },

    getPeopleMode: function () {
        var people = this.chipSelection.people;
        if (people === 1) return { label: '独行节奏', desc: '文案更偏松弛、独处、慢慢发现城市。' };
        if (people >= 4) return { label: '小队协作模式', desc: '任务更强调合影、分工、聚会和集体通关。' };
        return { label: '双人默契模式', desc: '任务更强调陪伴、互动和共同完成。' };
    },

    renderThinkingSteps: function (theme) {
        var sceneLabel = theme.scene ? theme.scene.label : '探索';
        var city = theme.scene ? theme.scene.city : theme.city;
        var planMode = this.getPlanMode();
        var peopleMode = this.getPeopleMode();
        var steps = document.querySelectorAll('.think-step');
        var labels = [
            '▸ 读取出行偏好：' + sceneLabel + ' / ' + this.chipSelection.people + '人 / ¥' + this.chipSelection.budget,
            '▸ 匹配' + city + '任务池：筛选 4 个城市坐标',
            '▸ 计算预算与体力消耗：' + planMode.label,
            '▸ 调整任务口吻：' + peopleMode.label,
            '▸ 生成像素密令：路线、关底和通关卡已就绪'
        ];
        steps.forEach(function (step, i) {
            step.textContent = labels[i] || step.textContent;
            step.classList.remove('active', 'done');
        });
        return { planMode: planMode, peopleMode: peopleMode };
    },

    renderAiChat: function () {
        var self = this;
        // 场景 chip
        var sceneChips = [
            { label: '情侣约会', value: 'shenzhen-couple', locked: false },
            { label: '独行漫游', value: 'hangzhou-solo', locked: false },
            { label: '好友聚会', value: 'shanghai-friends', locked: false },
        ];
        var sceneBox = document.getElementById('chips-scene');
        sceneBox.innerHTML = '';
        sceneChips.forEach(function (c) {
            var chip = document.createElement('button');
            chip.className = 'chip' + (c.locked ? ' locked' : '');
            chip.textContent = c.label + (c.locked ? ' 🔒' : '');
            if (!c.locked) {
                chip.addEventListener('click', function () {
                    self.chipSelection.scene = c.value;
                    sceneBox.querySelectorAll('.chip').forEach(function (n) { n.classList.remove('selected'); });
                    chip.classList.add('selected');
                    self.applyThemeDefaults(c.value);
                    document.getElementById('generate-btn').disabled = false;
                });
            }
            sceneBox.appendChild(chip);
        });
        // 预算 chip
        var budgetChips = [
            { label: '¥100', value: 100 },
            { label: '¥150', value: 150 },
            { label: '¥200', value: 200 },
            { label: '¥300', value: 300 },
            { label: '¥500', value: 500 },
        ];
        var budgetBox = document.getElementById('chips-budget');
        budgetBox.innerHTML = '';
        budgetChips.forEach(function (c) {
            var chip = document.createElement('button');
            chip.className = 'chip' + (c.value === self.chipSelection.budget ? ' selected' : '');
            chip.textContent = c.label;
            chip.setAttribute('data-value', String(c.value));
            chip.addEventListener('click', function () {
                self.chipSelection.budget = c.value;
                budgetBox.querySelectorAll('.chip').forEach(function (n) { n.classList.remove('selected'); });
                chip.classList.add('selected');
            });
            budgetBox.appendChild(chip);
        });
        // 人数 chip
        var peopleChips = [{ label: '1人', value: 1 }, { label: '2人', value: 2 }, { label: '4人', value: 4 }];
        var peopleBox = document.getElementById('chips-people');
        peopleBox.innerHTML = '';
        peopleChips.forEach(function (c) {
            var chip = document.createElement('button');
            chip.className = 'chip' + (c.value === self.chipSelection.people ? ' selected' : '');
            chip.textContent = c.label;
            chip.setAttribute('data-value', String(c.value));
            chip.addEventListener('click', function () {
                self.chipSelection.people = c.value;
                peopleBox.querySelectorAll('.chip').forEach(function (n) { n.classList.remove('selected'); });
                chip.classList.add('selected');
            });
            peopleBox.appendChild(chip);
        });
    },

    startAiGenerating: function () {
        if (!this.chipSelection.scene) return;
        this.currentThemeId = this.chipSelection.scene;
        this.showDomPage('ai-generating');

        // 动态拼接 AI 回应
        var theme = WM.THEMES[this.currentThemeId];
        var sceneLabel = theme.scene ? theme.scene.label : '探索';
        var city = theme.scene ? theme.scene.city : theme.city;
        var budget = this.chipSelection.budget;
        var people = this.chipSelection.people;
        var modes = this.renderThinkingSteps(theme);
        var responseText = '收到。' + sceneLabel + '，预算¥' + budget + '，' + people + '人出行。已启用' + modes.planMode.label + '与' + modes.peopleMode.label + '。' + modes.planMode.desc + modes.peopleMode.desc + '正在为你规划' + city + '专属路线...';
        this.typeText('ai-response', responseText, 28, function () {});

        var steps = document.querySelectorAll('.think-step');
        var self = this;
        var stepIdx = 0;
        var enterBtn = document.getElementById('enter-mission-btn');
        enterBtn.style.visibility = 'hidden';
        clearInterval(this._thinkTimer);
        this._thinkTimer = setInterval(function () {
            if (stepIdx >= steps.length) {
                clearInterval(self._thinkTimer);
                enterBtn.style.visibility = 'visible';
                // 自动进入 dialog
                setTimeout(function () { self.startDialog(self.currentThemeId); }, 600);
                return;
            }
            if (stepIdx > 0) { steps[stepIdx - 1].classList.remove('active'); steps[stepIdx - 1].classList.add('done'); }
            steps[stepIdx].classList.add('active');
            stepIdx++;
        }, 600);
    },

    typeText: function (elId, text, speed, onDone) {
        var el = document.getElementById(elId);
        el.textContent = '';
        var i = 0;
        clearInterval(this._typeTimer);
        this._typeTimer = setInterval(function () {
            if (i >= text.length) { clearInterval(WM.app._typeTimer); if (onDone) onDone(); return; }
            el.textContent += text[i++];
        }, speed);
    },

    // ---- dialog：AI 打字简报 ----
    startDialog: function (themeId) {
        var theme = WM.THEMES[themeId];
        this.showDomPage('dialog');
        document.getElementById('dialog-theme-title').textContent = theme.title;
        var textEl = document.getElementById('dialog-text');
        var loadingEl = document.getElementById('loading-text');
        textEl.innerHTML = '';
        loadingEl.textContent = '';

        var lines = theme.briefing.slice();
        var self = this;
        var lineIdx = 0, charIdx = 0, html = '';
        this._dialogDone = false;

        function tick() {
            if (self._dialogDone) return;
            if (lineIdx >= lines.length) {
                self.finishDialog();
                return;
            }
            var line = lines[lineIdx];
            if (charIdx <= line.length) {
                var shown = html + line.substring(0, charIdx);
                textEl.innerHTML = shown;
                charIdx++;
                self._dialogTimer = setTimeout(tick, 35);
            } else {
                html += line + '<br>';
                lineIdx++;
                charIdx = 0;
                self._dialogTimer = setTimeout(tick, 350);
            }
        }
        tick();
    },

    finishDialog: function () {
        if (this._dialogDone) return;
        this._dialogDone = true;
        clearTimeout(this._dialogTimer);
        var loadingEl = document.getElementById('loading-text');
        var self = this;
        var dots = 0;
        loadingEl.textContent = '正在生成作战路线';
        this._loadTimer = setInterval(function () {
            dots = (dots + 1) % 4;
            loadingEl.textContent = '正在生成作战路线' + '.'.repeat(dots);
        }, 300);
        setTimeout(function () {
            clearInterval(self._loadTimer);
            WM.startMission(self.currentThemeId);
        }, 1400);
    },

    skipDialog: function () {
        clearTimeout(this._dialogTimer);
        // 直接显示全文后进入加载
        var theme = WM.THEMES[this.currentThemeId];
        document.getElementById('dialog-text').innerHTML = theme.briefing.join('<br>');
        this.finishDialog();
    },

    // ---- result：结算 ----
    onAllCleared: function () {
        clearInterval(this._loadTimer);
        clearTimeout(this._dialogTimer);
        this.showDomPage('result');
        this.renderResultCard();
    },

    getRating: function (hp) {
        if (hp >= 40) return 'S';
        if (hp >= 20) return 'A';
        if (hp >= 1) return 'B';
        return 'C';
    },

    getClearTitle: function (themeId, rank) {
        var titles = {
            'shenzhen-couple': { S: '甜蜜满格特工', A: '南山约会达人', B: '城市陪伴者', C: '补给不足特工' },
            'hangzhou-solo': { S: '西湖独行特工', A: '杭城慢游者', B: '湖畔观察员', C: '体力透支旅人' },
            'shanghai-friends': { S: '外滩小队队长', A: '沪上聚会王牌', B: '霓虹打卡员', C: '小队后勤专员' },
        };
        var group = titles[themeId] || titles['shenzhen-couple'];
        return group[rank] || group.B;
    },

    getShareLine: function (theme, rankTitle) {
        if (!theme) return '我完成了一次周末密令。';
        if (theme.id === 'hangzhou-solo') return '我完成了杭州独行漫游任务，在西湖日落前通关，获得「' + rankTitle + '」。';
        if (theme.id === 'shanghai-friends') return '我们完成了上海兄弟聚会闯关，在外滩夜色里获得「' + rankTitle + '」。';
        return '我们完成了深圳情侣甜蜜大作战，获得「' + rankTitle + '」。';
    },

    renderResultCard: function () {
        var hp = Math.max(0, WM.state.hp);
        var theme = WM.THEMES[this.currentThemeId];
        var rank = this.getRating(hp);
        var rankTitle = this.getClearTitle(this.currentThemeId, rank);
        var planMode = this.getPlanMode();
        var peopleMode = this.getPeopleMode();
        document.getElementById('result-title-line').textContent = rankTitle + ' · ' + theme.city;
        document.getElementById('result-stats').innerHTML =
            '<p>城市：' + theme.city + ' · ' + (theme.scene ? theme.scene.label : theme.title) + '</p>' +
            '<p>路线：' + theme.title + '</p>' +
            '<p>通关：' + WM.STAGES.length + '/' + WM.STAGES.length + ' 个坐标</p>' +
            '<p>总花费：¥' + WM.state.totalCost + ' / ¥' + this.chipSelection.budget + ' · ' + planMode.label + '</p>' +
            '<p>总时长：' + WM.state.totalDuration.toFixed(1) + 'h · ' + peopleMode.label + '</p>' +
            '<p>剩余体力：' + hp + ' HP</p>';
        document.getElementById('result-share-line').textContent = this.getShareLine(theme, rankTitle);
        document.getElementById('result-rank').innerHTML =
            '<div class="rank-letter">RANK ' + rank + '</div>';
    },

    // ---- share：分享卡片 ----
    openShare: function () {
        this.showDomPage('share');
        this.drawShareCard(this.shareTemplate);
    },

    drawShareCard: function (template) {
        this.shareTemplate = template;
        var canvas = document.getElementById('share-canvas');
        var ctx = canvas.getContext('2d');
        var W = canvas.width, H = canvas.height;
        var theme = WM.THEMES[this.currentThemeId];
        var hp = Math.max(0, WM.state.hp);
        var rank = this.getRating(hp);
        var rankTitle = this.getClearTitle(this.currentThemeId, rank);
        var data = {
            title: theme.title,
            city: theme.city,
            stages: WM.STAGES.length,
            hp: hp,
            cost: WM.state.totalCost,
            budget: this.chipSelection.budget,
            rank: rank,
            rankTitle: rankTitle,
            shareLine: this.getShareLine(theme, rankTitle),
            color: theme.themeColor,
        };
        ctx.clearRect(0, 0, W, H);
        if (template === 'pixel') this.drawPixelCard(ctx, W, H, data);
        else if (template === 'modern') this.drawModernCard(ctx, W, H, data);
        else this.drawLiteraryCard(ctx, W, H, data);
    },

    drawPixelCard: function (ctx, W, H, d) {
        ctx.fillStyle = '#0D0D0D';
        ctx.fillRect(0, 0, W, H);
        // 像素边框
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(20, 20, W - 40, 12);
        ctx.fillRect(20, H - 32, W - 40, 12);
        ctx.fillRect(20, 20, 12, H - 40);
        ctx.fillRect(W - 32, 20, 12, H - 40);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 30px "Courier New",monospace';
        ctx.fillText('WEEKEND MISSIONS', W / 2, 110);
        ctx.fillStyle = '#00D2D3';
        ctx.font = '22px "Courier New",monospace';
        ctx.fillText('周 末 密 令', W / 2, 150);

        ctx.fillStyle = d.color;
        ctx.font = 'bold 26px "Microsoft YaHei",sans-serif';
        this.wrapText(ctx, d.title, W / 2, 250, W - 100, 36);

        // RANK 大字
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 130px "Courier New",monospace';
        ctx.fillText(d.rank, W / 2, 520);
        ctx.fillStyle = '#F8F8F8';
        ctx.font = '20px "Courier New",monospace';
        ctx.fillText('RANK', W / 2, 400);

        ctx.fillStyle = '#F8F8F8';
        ctx.font = '24px "Microsoft YaHei",sans-serif';
        ctx.fillText('通关 ' + d.stages + '/' + d.stages + ' 关', W / 2, 640);
        ctx.fillText('体力剩余 ' + d.hp + ' HP', W / 2, 690);
        ctx.fillText('花费 ¥' + d.cost + ' / ¥' + d.budget, W / 2, 740);
        ctx.fillStyle = d.color;
        ctx.font = '20px "Microsoft YaHei",sans-serif';
        this.wrapText(ctx, d.rankTitle, W / 2, 795, W - 120, 28);

        ctx.fillStyle = '#4A4A6A';
        ctx.font = '16px "Microsoft YaHei",sans-serif';
        ctx.fillText('TRAE AI 创造力大赛参赛作品', W / 2, H - 70);
    },

    drawModernCard: function (ctx, W, H, d) {
        var grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, d.color);
        grad.addColorStop(1, '#1A1A2E');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        this.roundRect(ctx, 50, 120, W - 100, H - 240, 24);
        ctx.fill();

        ctx.textAlign = 'center';
        ctx.fillStyle = d.color;
        ctx.font = 'bold 30px "Microsoft YaHei",sans-serif';
        this.wrapText(ctx, d.title, W / 2, 230, W - 160, 42);

        ctx.fillStyle = '#1A1A2E';
        ctx.font = 'bold 96px "Arial",sans-serif';
        ctx.fillText(d.rank, W / 2, 480);
        ctx.fillStyle = '#888';
        ctx.font = '20px "Microsoft YaHei",sans-serif';
        ctx.fillText('MISSION RANK', W / 2, 380);

        ctx.fillStyle = '#333';
        ctx.font = '26px "Microsoft YaHei",sans-serif';
        ctx.fillText(d.stages + ' 关全通关', W / 2, 600);
        ctx.fillText('体力 ' + d.hp + ' · 花费 ¥' + d.cost, W / 2, 650);
        ctx.fillStyle = d.color;
        ctx.font = '22px "Microsoft YaHei",sans-serif';
        ctx.fillText(d.rankTitle, W / 2, 710);

        ctx.fillStyle = d.color;
        ctx.font = '18px "Microsoft YaHei",sans-serif';
        ctx.fillText('Weekend Missions · ' + d.city, W / 2, H - 90);
    },

    drawLiteraryCard: function (ctx, W, H, d) {
        ctx.fillStyle = '#F5F1E8';
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = d.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(40, 40, W - 80, H - 80);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#5a5a5a';
        ctx.font = '22px "KaiTi","Microsoft YaHei",serif';
        ctx.fillText('— 周末密令 · 通关纪念 —', W / 2, 130);

        ctx.fillStyle = '#2a2a2a';
        ctx.font = 'bold 32px "KaiTi","Microsoft YaHei",serif';
        this.wrapText(ctx, d.title, W / 2, 250, W - 120, 46);

        ctx.fillStyle = d.color;
        ctx.font = 'bold 80px "KaiTi",serif';
        ctx.fillText(d.rank + ' 级', W / 2, 480);

        ctx.fillStyle = '#5a5a5a';
        ctx.font = '24px "KaiTi","Microsoft YaHei",serif';
        ctx.fillText('走过 ' + d.stages + ' 个坐标', W / 2, 600);
        ctx.fillText('余力 ' + d.hp + ' · 花销 ¥' + d.cost, W / 2, 650);
        ctx.fillStyle = d.color;
        ctx.font = '24px "KaiTi","Microsoft YaHei",serif';
        ctx.fillText(d.rankTitle, W / 2, 710);

        ctx.fillStyle = '#999';
        ctx.font = '16px "KaiTi","Microsoft YaHei",serif';
        ctx.fillText('愿每个周末都不被辜负', W / 2, H - 90);
    },

    wrapText: function (ctx, text, x, y, maxWidth, lineHeight) {
        var chars = text.split('');
        var line = '';
        var lines = [];
        for (var i = 0; i < chars.length; i++) {
            var test = line + chars[i];
            if (ctx.measureText(test).width > maxWidth && line) {
                lines.push(line);
                line = chars[i];
            } else {
                line = test;
            }
        }
        if (line) lines.push(line);
        var startY = y - (lines.length - 1) * lineHeight / 2;
        lines.forEach(function (l, i) { ctx.fillText(l, x, startY + i * lineHeight); });
    },

    roundRect: function (ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    },

    downloadCard: function () {
        var canvas = document.getElementById('share-canvas');
        var link = document.createElement('a');
        link.download = 'weekend-mission-' + (this.currentThemeId || 'card') + '.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    },

    restart: function () {
        WM.state.hp = 100;
        WM.state.totalCost = 0;
        WM.state.totalDuration = 0;
        WM.state.stageIndex = 0;
        this.chipSelection.scene = null;
        this.currentThemeId = null;
        document.getElementById('generate-btn').disabled = true;
        document.querySelectorAll('#chips-scene .chip').forEach(function (n) { n.classList.remove('selected'); });
        this.showAiChat();
    },

    goHome: function () {
        this.restart();
    },

    regenerateCurrentMission: function () {
        if (!this.currentThemeId) {
            this.showAiChat();
            return;
        }
        this.chipSelection.scene = this.currentThemeId;
        WM.state.hp = 100;
        WM.state.totalCost = 0;
        WM.state.totalDuration = 0;
        WM.state.stageIndex = 0;
        this.startAiGenerating();
    },

    // ---- 事件绑定 ----
    bindEvents: function () {
        var self = this;
        document.getElementById('generate-btn').addEventListener('click', function () { self.startAiGenerating(); });
        document.getElementById('enter-mission-btn').addEventListener('click', function () { self.startDialog(self.currentThemeId); });
        document.getElementById('skip-dialog-btn').addEventListener('click', function () { self.skipDialog(); });
        document.getElementById('share-btn').addEventListener('click', function () { self.openShare(); });
        document.getElementById('restart-btn').addEventListener('click', function () { self.restart(); });
        document.getElementById('regenerate-btn').addEventListener('click', function () { self.regenerateCurrentMission(); });
        document.getElementById('home-btn').addEventListener('click', function () { self.goHome(); });
        document.getElementById('download-btn').addEventListener('click', function () { self.downloadCard(); });
        document.getElementById('back-result-btn').addEventListener('click', function () { self.showDomPage('result'); });
        document.querySelectorAll('.template-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                document.querySelectorAll('.template-btn').forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                self.drawShareCard(btn.getAttribute('data-template'));
            });
        });
    },
};

// 把引擎所需钩子挂到 WM
WM.showGameLayer = function () { WM.app.showGameLayer(); };
WM.onAllCleared = function () { WM.app.onAllCleared(); };

window.addEventListener('DOMContentLoaded', function () {
    WM.app.init();
});
