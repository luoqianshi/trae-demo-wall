/* =============================================
   Code Archaeology · Main JavaScript v3
   - 3 个 mode 的真正交互
   - AI 思考过程动画
   - 案卷输出动态生成
   ============================================= */

(function() {
    'use strict';

    // ============================================
    // Page Loader
    // ============================================
    window.addEventListener('load', () => {
        const loader = document.getElementById('pageLoader');
        if (loader) {
            setTimeout(() => {
                loader.classList.add('hidden');
                setTimeout(() => loader.remove(), 600);
            }, 700);
        }
    });

    // ============================================
    // Navbar scroll
    // ============================================
    const navbar = document.getElementById('navbar');
    let ticking = false;
    function updateNavbar() {
        if (window.scrollY > 50) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
        ticking = false;
    }
    window.addEventListener('scroll', () => {
        if (!ticking) { requestAnimationFrame(updateNavbar); ticking = true; }
    }, { passive: true });

    // ============================================
    // Number counter
    // ============================================
    function animateNumber(el, target, duration = 1500) {
        const start = 0;
        const startTime = performance.now();
        const isFloat = target % 1 !== 0;
        const prefix = el.dataset.prefix || '';
        const suffix = el.dataset.suffix || '';

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = start + (target - start) * eased;
            const numStr = isFloat ? current.toFixed(1) : Math.floor(current).toLocaleString();
            el.textContent = `${prefix}${numStr}${suffix}`;
            if (progress < 1) requestAnimationFrame(update);
            else {
                const finalStr = isFloat ? target.toFixed(1) : target.toLocaleString();
                el.textContent = `${prefix}${finalStr}${suffix}`;
            }
        }
        requestAnimationFrame(update);
    }

    // ============================================
    // Scroll reveals
    // ============================================
    const animatedNumbers = new WeakSet();
    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                entry.target.querySelectorAll('[data-target]').forEach(num => {
                    if (!animatedNumbers.has(num)) {
                        animatedNumbers.add(num);
                        const target = parseFloat(num.dataset.target);
                        setTimeout(() => animateNumber(num, target, 1800), 200);
                    }
                });
                fadeObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.section, .story-event, .finding-card, .bm-stage, .why-item, .case-detail, .cb-section, .acf-block, .cr-block, .co-stat, .atc-row').forEach(el => {
        el.classList.add('fade-in-up');
        fadeObserver.observe(el);
    });

    // ============================================
    // Smooth scroll
    // ============================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const targetId = anchor.getAttribute('href');
            if (!targetId || targetId === '#' || targetId.length < 2) return;
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                const offset = 80;
                window.scrollTo({ top: target.getBoundingClientRect().top + window.pageYOffset - offset, behavior: 'smooth' });
            }
        });
    });

    // ============================================
    // Initial hero numbers
    // ============================================
    setTimeout(() => {
        document.querySelectorAll('.hero-stats [data-target]').forEach((num, i) => {
            setTimeout(() => animateNumber(num, parseFloat(num.dataset.target), 1500), i * 200);
        });
    }, 600);

    // ============================================
    // Case Studies - Industry tab switching
    // ============================================
    const caseTabs = document.querySelectorAll('.case-tab');
    const caseDetails = document.querySelectorAll('.case-detail');
    caseTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetCase = tab.dataset.case;
            caseTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            caseDetails.forEach(d => {
                d.classList.toggle('active', d.dataset.caseDetail === targetCase);
            });
        });
    });

    // ============================================
    // Demo Mode switching
    // ============================================
    const modeBtns = document.querySelectorAll('.mode-btn');
    const modePanels = document.querySelectorAll('.mode-panel');
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.mode;
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            modePanels.forEach(p => {
                p.classList.toggle('active', p.dataset.panel === mode);
            });
        });
    });

    // ============================================
    // Archaeologist Mode
    // ============================================
    
    // Code examples
    const CODE_EXAMPLES = {
        refund: `function processRefund(orderId) {
  for (let i = 0; i < 3; i++) {
    try { await callBankAPI(orderId); return 'success'; }
    catch(e) { await sleep(2 ** i * 1000); }
  }
  sendToDeadLetter(orderId);
}`,
        inventory: `func ReserveStock(itemID int, qty int) error {
    mu.Lock()
    defer mu.Unlock()
    stock := getStock(itemID)
    if stock < qty {
        return ErrInsufficient
    }
    setStock(itemID, stock - qty)
    return nil
}`,
        coupon: `function deductCoupon(userId, couponId) {
  const coupon = await db.get(couponId)
  if (coupon.remaining > 0) {
    coupon.remaining -= 1
    await db.save(coupon)
    return true
  }
  return false
}`
    };

    // Code editor - sync gutter
    const codeInput = document.getElementById('archaeologistCode');
    const gutter = document.getElementById('gutter1');
    
    function updateGutter() {
        if (!codeInput || !gutter) return;
        const lines = codeInput.value.split('\n').length;
        gutter.innerHTML = Array.from({ length: lines }, (_, i) => i + 1).join('<br>');
    }
    if (codeInput) {
        codeInput.addEventListener('input', updateGutter);
        codeInput.addEventListener('scroll', () => { gutter.scrollTop = codeInput.scrollTop; });
        updateGutter();
    }

    // Example buttons
    document.querySelectorAll('.example-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const ex = btn.dataset.example;
            if (CODE_EXAMPLES[ex] && codeInput) {
                codeInput.value = CODE_EXAMPLES[ex];
                updateGutter();
            }
        });
    });

    // Question buttons
    const questionBtns = document.querySelectorAll('.question-btn');
    questionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            questionBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // AI 思考数据
    const THINKING_DATA = {
        why: [
            { time: '0.0s', icon: '🔍', title: '识别代码上下文', detail: '检测到 JavaScript 代码，包含 <code>await callBankAPI</code>、<code>sendToDeadLetter</code> 等关键词 → 推断属于 <code>payment-service</code> 的退款模块', type: 'normal' },
            { time: '0.8s', icon: '📂', title: '检索 commit 历史', detail: '在 git log 中匹配该函数，找到 <strong>12 个相关 commit</strong>。最早引入：<code>commit a3f2d1e (2019.03)</code>，作者张三', type: 'normal' },
            { time: '1.6s', icon: '📋', title: '匹配 Jira 工单', detail: '关联 3 个工单：<code>PAY-892</code>（重试优化）· <code>PAY-1138</code>（微服务拆分）· <code>INC-2134</code>（事故修复）', type: 'normal' },
            { time: '2.5s', icon: '⚠️', title: '关联历史事故', detail: '<strong>等等，我注意到一个问题：</strong>这段代码被多人修改过 —— 2021.07 王五把 3 次改成 2 次，但 2022.03 李四在不同分支改回 3 次，<em>merge 时未发现冲突</em>', type: 'danger' },
            { time: '3.2s', icon: '💡', title: '形成决策建议', detail: '基于 5 年演化 + 1 次事故 + 2 次补丁修改，给你 3 个选项及评估', type: 'success' }
        ],
        risk: [
            { time: '0.0s', icon: '🔍', title: '识别风险维度', detail: '分析代码结构：循环重试 + 错误吞咽 + 无上限检查 → 检查 4 个维度的潜在风险', type: 'normal' },
            { time: '0.7s', icon: '⚠️', title: '历史事故关联', detail: '<strong>2022.07 春节红包事故 #INC-2134</strong> 根因就是 "重试 3 次" 放大了 3 倍流量。直接损失 <em>¥ 380 万 + 41 分钟停服</em>', type: 'danger' },
            { time: '1.5s', icon: '📊', title: '量级风险评估', detail: '当前重试在峰值场景下：<code>QPS 5000 × 3 = 15000</code> 请求冲击银行通道。银行通道容量上限 <em>8000 QPS</em>，<strong>会击穿</strong>', type: 'danger' },
            { time: '2.4s', icon: '🎯', title: '风险等级判定', detail: '综合事故历史 + 当前架构 + 流量预测：<strong>风险等级 HIGH</strong>。预计下次大促发生同类事故概率 <em>78%</em>', type: 'warning' },
            { time: '3.1s', icon: '✅', title: '风险缓解建议', detail: '立即可做（1 天）+ 中期方案（1-2 周）+ 长期方案（1 月）共 3 套', type: 'success' }
        ],
        incident: [
            { time: '0.0s', icon: '🔍', title: '扫描所有相关事故', detail: '在事故库中匹配 payment-service、refund、retry、callBankAPI 等关键词 → 找到 <strong>17 次 P0/P1 事故</strong>', type: 'normal' },
            { time: '0.9s', icon: '🎯', title: '精确匹配根因', detail: '根据 "重试逻辑" 这个特征，进一步筛出 <strong>4 次直接相关</strong> 事故', type: 'normal' },
            { time: '1.8s', icon: '💥', title: '核心事故链分析', detail: '发现<strong>反常识的链路</strong>：4 次事故 100% 命中同一模块，但分散在不同时期。<strong>最严重的是 2022.07 春节</strong>，详见案卷', type: 'danger' },
            { time: '2.7s', icon: '📈', title: '事故演化趋势', detail: '从 2019 → 2024，该模块事故频率<strong>不降反升</strong>，且每次修复都只是打补丁，从未根治', type: 'warning' },
            { time: '3.4s', icon: '💡', title: '形成预警建议', detail: '该模块被标记为 <strong>"高复发风险"</strong>，建议在大促前进行预防性重构', type: 'success' }
        ],
        modify: [
            { time: '0.0s', icon: '🔍', title: '分析变更请求', detail: '用户问 "改成 5 次重试"。先分析 <code>i < 3</code> 改成 <code>i < 5</code> 的所有可能影响', type: 'normal' },
            { time: '0.8s', icon: '📊', title: '量级影响计算', detail: '重试从 3 → 5：理论最大请求数 <em>5000 × 5 = 25000 QPS</em>。但实际场景：退避算法 1+2+4+8+16=31s，<strong>大概率走完全部重试</strong>', type: 'warning' },
            { time: '1.6s', icon: '🔍', title: '查类似变更历史', detail: '<strong>2021.07 王五曾尝试过</strong>类似的修改（commit <code>f3a2b1c</code>），但<em>在 code review 时被驳回</em>，因为关联到 #INC-2134 的根因', type: 'danger' },
            { time: '2.4s', icon: '⚠️', title: '变更影响评估', detail: '如果坚持改成 5 次：<strong>高概率触发 2022.07 同类事故</strong>。预估损失：<em>¥ 300-500 万 + 30+ 分钟停服</em>', type: 'danger' },
            { time: '3.2s', icon: '💡', title: '替代方案', detail: 'AI 不建议直接改 5 次。但可以：<strong>改重试上限 + 加重试预算（token bucket）</strong>，让总请求数可控', type: 'success' }
        ]
    };

    // 案卷输出数据
    const OUTPUT_DATA = {
        why: {
            title: '📜 案卷 #CA-2024-1115-001',
            meta: '退款重试逻辑 · 5 年演化',
            tag: '代码考古',
            tagClass: 'out-tag-info',
            headline: '退款重试逻辑：5 年演化揭示的真相',
            sub: '你问的是"为什么这么写"，但我发现了更重要的东西',
            timeline: [
                { time: '2019.03', text: '<strong>张三</strong> 首次实现（<code>commit a3f2d1e</code>）：<em>"对接银行通道偶发超时，需要重试兜底"</em>', type: '' },
                { time: '2021.07', text: '<strong>李四</strong> 加指数退避（<code>commit 5d2e8f1</code>），因 #INC-2134 春节事故：<em>"重试放大了 3 倍流量"</em>', type: 'tl-warn' },
                { time: '2022.03', text: '<strong>王五</strong> 在另一个分支把 3 次改回 3 次（<code>commit f3a2b1c</code>）—— 实际是<strong>恢复</strong>，但 PR 描述写"优化"<em>（埋雷）</em>', type: 'tl-danger' },
                { time: '2023.02', text: '<strong>王五</strong> 引入熔断器（<code>commit 8a4b6c2</code>，jira <code>PAY-892</code>）：<em>"防止重试雪崩"</em>', type: 'tl-key' },
                { time: '2024.11', text: '<strong>当前</strong>：3 次重试 + 指数退避 + 熔断器。三层防御。', type: 'tl-key' }
            ],
            finding: '<strong>反常识发现：</strong>你问的是"为什么 3 次"，但实际上<strong>这段代码 5 年里被改过 4 次</strong>。2022 年的"3 次"是 bug 修复而非有意设计。PR 描述缺失导致历史决策丢失，<em>如果当时 merge 时有 AI 提示，这个 bug 不会进入生产</em>',
            findingClass: '',
            options: [
                { letter: 'A', name: '保持现状（3 次 + 退避 + 熔断）', tag: '推荐', tagClass: 'tag-rec', meta: '⏱️ 0 周 · 📉 风险可控 · 💰 0 元' },
                { letter: 'B', name: '改成动态重试（按响应时间自适应）', tag: '更优', tagClass: 'tag-warn', meta: '⏱️ 1 周 · 👥 1 人 · 💰 ¥ 15 万 · 📉 风险下降 50%' },
                { letter: 'C', name: '改成 5 次重试（按你最初的设想）', tag: '危险', tagClass: 'tag-danger', meta: '⏱️ 0.5 天 · 📉 风险 +300% <strong>不建议</strong>' }
            ],
            citations: ['commits(4)', '事故(1)', 'Jira(2)', '复盘(1)', 'PR reviews(8)']
        },
        risk: {
            title: '📜 风险评估 #RISK-2024-1115-001',
            meta: '退款重试逻辑 · 4 维度风险',
            tag: 'HIGH',
            tagClass: 'out-tag',
            headline: '当前重试配置存在 HIGH 级别风险',
            sub: '与 2022.07 春节事故根因 100% 吻合',
            timeline: [
                { time: '历史', text: '<strong>2022.07 春节</strong> 事故 #INC-2134：3 次重试放大 3 倍流量 · <em>¥ 380 万损失</em>', type: 'tl-danger' },
                { time: '当前', text: '代码仍然是 3 次重试 · 没加请求预算控制', type: 'tl-warn' },
                { time: '预测', text: '下次大促（<em>3.15 / 618 / 双 11</em>）触发同类事故概率 <strong>78%</strong>', type: 'tl-danger' }
            ],
            finding: '<strong>量化风险：</strong>当前重试 3 次 + 无预算控制。峰值流量下 <em>QPS 5000 × 3 = 15000</em> 冲击银行通道（容量上限 8000 QPS），<strong>必然击穿</strong>。事故损失预估 <em>¥ 300-500 万</em>',
            findingClass: 'out-finding-critical',
            options: [
                { letter: '立即', name: '加临时重试预算（token bucket，1 小时内）', tag: '必做', tagClass: 'tag-rec', meta: '⏱️ 1 小时 · 💰 ¥ 0 · 📉 风险下降 60%' },
                { letter: '1-2 周', name: '引入自适应重试 + SLO 熔断', tag: '推荐', tagClass: 'tag-rec', meta: '⏱️ 1-2 周 · 👥 2 人 · 💰 ¥ 30 万 · 📉 风险下降 90%' },
                { letter: '1 月', name: '完整重试治理（异步 + 隔离 + 监控）', tag: '长期', tagClass: 'tag-warn', meta: '⏱️ 1 月 · 👥 3 人 · 💰 ¥ 80 万 · 📉 风险下降 99%' }
            ],
            citations: ['事故(1)', 'RFC(2)', '压测数据(3)', '银行通道SLA(1)']
        },
        incident: {
            title: '📜 事故关联报告 #INC-MAP-001',
            meta: '退款模块 · 5 年 4 次事故',
            tag: '4 次直接相关',
            tagClass: 'out-tag',
            headline: '你的问题不是孤例 —— 4 次事故指向同一根因',
            sub: '从 2019 → 2024，同一模块从未被根治',
            timeline: [
                { time: '2020.04', text: '<strong>#INC-0921</strong>：银行通道超时 · 临时加缓存', type: '' },
                { time: '2021.07', text: '<strong>#INC-1453</strong>：春节红包 · 重试雪崩 · <em>¥ 380 万</em>', type: 'tl-danger' },
                { time: '2022.12', text: '<strong>#INC-1829</strong>：黑五大促 · 缓存击穿 · <em>¥ 180 万</em>', type: 'tl-danger' },
                { time: '2024.06', text: '<strong>#INC-2024-0617</strong>：618 · 熔断器误触发 · <em>¥ 95 万</em>', type: 'tl-warn' }
            ],
            finding: '<strong>反常识：</strong>5 年 4 次同类事故，<em>每次都只打补丁，从未根治</em>。补丁叠加导致代码复杂度指数增长，<strong>新人接手难度极高</strong>。该模块被标记为"<strong>高复发风险</strong>"，建议大促前预防性重构',
            findingClass: 'out-finding-critical',
            options: [
                { letter: '紧急', name: '大促前 1 周：高可用体检 + 临时开关', tag: '必做', tagClass: 'tag-rec', meta: '⏱️ 3 天 · 💰 ¥ 5 万' },
                { letter: '本月', name: '灰度引入 "重试预算"（token bucket）', tag: '推荐', tagClass: 'tag-rec', meta: '⏱️ 2 周 · 💰 ¥ 30 万' },
                { letter: '下季度', name: '退款模块彻底重构（异步 + 隔离 + 监控）', tag: '长期', tagClass: 'tag-warn', meta: '⏱️ 6 周 · 💰 ¥ 150 万 · 📉 风险下降 95%' }
            ],
            citations: ['事故(4)', '复盘(4)', 'SLO 报告(2)', '架构 RFC(3)']
        },
        modify: {
            title: '📜 变更评估 #CHG-2024-1115-001',
            meta: '重试次数 3 → 5 的影响分析',
            tag: '不推荐',
            tagClass: 'out-tag',
            headline: '改成 5 次重试？强烈不建议',
            sub: '但我有一个更好的方案',
            timeline: [
                { time: '2021.07', text: '<strong>王五</strong> 尝试过类似修改（<code>commit f3a2b1c</code>），被 code review 驳回', type: 'tl-warn' },
                { time: '驳回原因', text: 'reviewer @李四 指出：关联 #INC-2134 · 重试次数增加会放大流量', type: '' },
                { time: '预测', text: '如果改成 5 次：<em>下次大促 78% 概率触发同类事故</em>', type: 'tl-danger' }
            ],
            finding: '<strong>关键发现：</strong>这段代码 5 年前已经有人提过类似方案，<em>但被驳回了</em>。驳回原因文档化在 PR 评论里（<code>PR #234</code>），<strong>这就是为什么 Code Archaeology 有价值</strong>——不会让你重复踩坑',
            findingClass: '',
            options: [
                { letter: '不要', name: '直接改成 5 次（你最初的想法）', tag: '危险', tagClass: 'tag-danger', meta: '⏱️ 0.5 天 · 📉 风险 +300% <strong>不推荐</strong>' },
                { letter: '推荐', name: '改成 "5 次上限 + token bucket 预算"', tag: '推荐', tagClass: 'tag-rec', meta: '⏱️ 3 天 · 💰 ¥ 5 万 · 📉 风险下降 50%' },
                { letter: '更好', name: '完整动态重试（按错误率自适应）', tag: '更优', tagClass: 'tag-warn', meta: '⏱️ 1 周 · 💰 ¥ 15 万 · 📉 风险下降 70%' }
            ],
            citations: ['PR(1)', '事故(1)', 'code review(3)', '压测报告(1)']
        }
    };

    // Render thinking step
    function createStepEl(step, index) {
        const stepEl = document.createElement('div');
        stepEl.className = `thinking-step ${step.type !== 'normal' ? 'step-' + step.type : ''}`;
        stepEl.style.animationDelay = `${index * 0.1}s`;
        
        const extraContent = {
            why: { text: '<strong>完整 git blame 链：</strong>共 12 个 commit 涉及该函数。其中 3 个是 author 不同、PR 描述缺失的"幽灵修改"，AI 通过 commit message 相似度匹配识别出来。' },
            risk: { text: '<strong>压测数据：</strong>2024.06 压测报告 #PT-118 显示当前重试在 6000 QPS 时已触发熔断器。如果在 5000 QPS 时重试 5 次，理论上需要 <em>25000 QPS</em> 的银行通道容量，<strong>当前容量 8000</strong>。' },
            incident: { text: '<strong>事故聚类算法：</strong>用 TF-IDF + 关键词 embedding，对 17 次事故的标题/描述/影响做相似度计算，识别出 4 次是同一根因的衍生事故。' },
            modify: { text: '<strong>AI 推理路径：</strong>1) 检测到 "改成 5 次" 这个变更 → 2) 检索历史相似变更 → 3) 找到 2021.07 王五的 PR → 4) 看到驳回评论 → 5) 形成反常识建议' }
        };

        stepEl.innerHTML = `
            <div class="step-head">
                <span class="step-time">${step.time}</span>
                <div class="step-icon">${step.icon}</div>
                <span class="step-title">${step.title}</span>
            </div>
            <div class="step-detail">${step.detail}</div>
            <div class="step-expand" data-expand="${index}">
                <span>📖 看 AI 完整推理过程</span>
            </div>
            <div class="step-extra" data-extra="${index}">
                ${extraContent[getCurrentQ()]?.text || 'AI 综合分析了多源数据，结合历史模式给出当前判断。'}
            </div>
        `;
        return stepEl;
    }

    // Render output case file
    function createOutputEl(data) {
        const wrap = document.createElement('div');
        wrap.className = 'out-file';
        
        let timelineHtml = data.timeline.map(t => `
            <div class="out-tl-row ${t.type}">
                <span class="out-tl-time">${t.time}</span>
                ${t.text}
            </div>
        `).join('');

        let optionsHtml = data.options.map(o => `
            <div class="out-option ${o.tagClass === 'tag-rec' ? 'opt-best' : ''}">
                <div class="out-opt-head">
                    <div class="out-opt-letter">${o.letter}</div>
                    <div class="out-opt-name">${o.name}</div>
                    <div class="out-opt-tag ${o.tagClass}">${o.tag}</div>
                </div>
                <div class="out-opt-meta">${o.meta}</div>
            </div>
        `).join('');

        let citationsHtml = data.citations.map(c => `<span class="out-cite">${c}</span>`).join('');

        wrap.innerHTML = `
            <div class="out-header">
                <div class="out-title">${data.title}</div>
                <div class="out-meta">
                    <span>${data.meta}</span>
                    <span class="${data.tagClass}">${data.tag}</span>
                </div>
            </div>
            <div class="out-body">
                <div class="out-headline">${data.headline}</div>
                <div class="out-sub">${data.sub}</div>
                
                <div class="out-section">
                    <div class="out-section-title"><span class="t-emoji">📅</span> 5 年演化时间线</div>
                    <div class="out-timeline">${timelineHtml}</div>
                </div>
                
                <div class="out-section">
                    <div class="out-section-title"><span class="t-emoji">💡</span> AI 关键发现</div>
                    <div class="out-finding ${data.findingClass}">${data.finding}</div>
                </div>
                
                <div class="out-section">
                    <div class="out-section-title"><span class="t-emoji">🎯</span> 3 个选项</div>
                    <div class="out-options">${optionsHtml}</div>
                </div>
                
                <div class="out-section">
                    <div class="out-section-title"><span class="t-emoji">📎</span> 引用</div>
                    <div class="out-citations">${citationsHtml}</div>
                </div>
            </div>
        `;
        return wrap;
    }

    // Get current question
    function getCurrentQ() {
        const active = document.querySelector('.question-btn.active');
        return active ? active.dataset.q : 'why';
    }

    // Animate thinking steps
    async function animateThinking(stepsContainer, steps, statusEl, onComplete) {
        stepsContainer.innerHTML = '';
        statusEl.textContent = '🔄 分析中';
        statusEl.removeAttribute('data-state');

        for (let i = 0; i < steps.length; i++) {
            const stepEl = createStepEl(steps[i], i);
            stepEl.classList.add('step-active');
            stepsContainer.appendChild(stepEl);
            
            // Auto-expand 2nd-to-last step
            if (i === steps.length - 2) {
                setTimeout(() => {
                    const expand = stepEl.querySelector('.step-expand');
                    const extra = stepEl.querySelector('.step-extra');
                    if (expand && extra) {
                        extra.classList.add('visible');
                        expand.querySelector('span').textContent = '📕 收起推理';
                    }
                }, 600);
            }
            
            // Update time after delay
            await new Promise(r => setTimeout(r, i === 0 ? 300 : 800));
        }

        statusEl.textContent = '✅ 完成';
        statusEl.setAttribute('data-state', 'done');

        // Add expand handlers
        stepsContainer.querySelectorAll('.step-expand').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = btn.dataset.expand;
                const extra = stepsContainer.querySelector(`[data-extra="${idx}"]`);
                if (extra) {
                    extra.classList.toggle('visible');
                    btn.querySelector('span').textContent = extra.classList.contains('visible') 
                        ? '📕 收起推理' 
                        : '📖 看 AI 完整推理过程';
                }
            });
        });

        if (onComplete) onComplete();
    }

    // Archaeologist analyze
    const archBtn = document.getElementById('archaeologistBtn');
    if (archBtn) {
        archBtn.addEventListener('click', () => {
            if (archBtn.disabled) return;
            
            const q = getCurrentQ();
            const steps = THINKING_DATA[q];
            const output = OUTPUT_DATA[q];
            
            const stepsContainer = document.getElementById('archaeologistSteps');
            const outputContainer = document.getElementById('archaeologistOutput');
            const statusEl = document.getElementById('archaeologistStatus');
            
            // Disable button
            archBtn.disabled = true;
            archBtn.querySelector('.btn-text').textContent = '🔄 AI 分析中...';
            
            // Clear output
            outputContainer.innerHTML = '<div class="output-placeholder"><div class="placeholder-icon">⏳</div><p>等待 AI 推理完成...</p></div>';

            animateThinking(stepsContainer, steps, statusEl, () => {
                // Re-enable button
                archBtn.disabled = false;
                archBtn.querySelector('.btn-text').textContent = '🤖 让 AI 分析';
                
                // Render output
                setTimeout(() => {
                    outputContainer.innerHTML = '';
                    outputContainer.appendChild(createOutputEl(output));
                }, 300);
            });
        });
    }

    // ============================================
    // Detective Mode
    // ============================================
    const DETECTIVE_DATA = {
        steps: [
            { time: '0.0s', icon: '📋', title: '解析事故描述', detail: '提取关键特征：<strong>支付超时</strong> + <strong>库存预占</strong> + <strong>连锁反应</strong> + <strong>800 单卡支付中</strong>', type: 'normal' },
            { time: '0.7s', icon: '🔍', title: '扫描历史事故库', detail: '匹配团队过去 5 年所有 P0/P1 事故 · 共 <strong>17 次</strong> · 关键词命中：<code>支付</code>/<code>库存</code>/<code>超时</code>/<code>预占</code>', type: 'normal' },
            { time: '1.5s', icon: '🎯', title: '相似度计算', detail: '用 TF-IDF + embedding 计算描述相似度，筛出 <strong>4 次高度相似</strong> + <strong>3 次中度相似</strong>', type: 'normal' },
            { time: '2.4s', icon: '💥', title: '识别根本原因', detail: '<strong>反常识发现：</strong>4 次高度相似事故 100% 指向同一根因 —— <em>inventory-core 模块的预占锁设计缺陷</em>，分散在 5 年 4 个不同时期', type: 'danger' },
            { time: '3.2s', icon: '✅', title: '形成修复建议', detail: '基于 4 次事故的修复经验，AI 推荐参考 2023.05 那次的渐进式重构方案', type: 'success' }
        ],
        output: {
            title: '📋 事故匹配报告 #INC-MATCH-2024-1115',
            meta: '8 次历史事故匹配 · 4 次高度相关',
            tag: '同根因',
            tagClass: 'out-tag',
            headline: '这不是第一次发生 —— 4 次同类事故指向同一根因',
            sub: '建议参考 2023.05 的渐进式重构方案',
            timeline: [
                { time: '2021.04', text: '<strong>#INC-0871</strong>：库存预占并发问题 · <em>修复：本地锁</em> · 损失 ¥ 120 万', type: '' },
                { time: '2022.08', text: '<strong>#INC-1453</strong>：同一根因，跨机房问题 · <em>修复：分布式锁</em> · 损失 ¥ 180 万', type: 'tl-warn' },
                { time: '2023.05', text: '<strong>#INC-1829</strong>：同一根因，异步任务场景 · <em>渐进式重构</em> · 损失 ¥ 95 万', type: 'tl-warn' },
                { time: '2024.07', text: '<strong>#INC-2024-0708</strong>：同一根因，缓存击穿 · <em>临时方案</em> · 损失 ¥ 65 万', type: 'tl-danger' }
            ],
            finding: '<strong>关键模式：</strong>4 次事故分散在 5 年不同时期，<em>每次修复都只解决表面问题</em>。<strong>inventory-core</strong> 模块的预占锁设计是根本原因。<br><br><em>2023.05 尝试过渐进式重构（jira #INV-342），但只完成 60% 就被业务压力打断</em>',
            findingClass: 'out-finding-critical',
            options: [
                { letter: '立即', name: '紧急回滚 + 临时加库存校验', tag: '必做', tagClass: 'tag-rec', meta: '⏱️ 2 小时 · 💰 ¥ 0 · 📉 立即止血' },
                { letter: '本周', name: '完成 2023.05 未完成的重构（jira #INV-342）', tag: '推荐', tagClass: 'tag-rec', meta: '⏱️ 1 周 · 💰 ¥ 30 万 · 📉 根除问题' },
                { letter: '长期', name: '库存模块彻底重写（异步预占 + 状态机）', tag: '长期', tagClass: 'tag-warn', meta: '⏱️ 6 周 · 💰 ¥ 200 万 · 📉 同类事故归零' }
            ],
            citations: ['事故(8)', '复盘(8)', 'Jira(12)', 'Postmortem(4)']
        }
    };

    const detectiveBtn = document.getElementById('detectiveBtn');
    if (detectiveBtn) {
        detectiveBtn.addEventListener('click', () => {
            if (detectiveBtn.disabled) return;
            
            const stepsContainer = document.getElementById('detectiveSteps');
            const outputContainer = document.getElementById('detectiveOutput');
            const statusEl = document.getElementById('detectiveStatus');
            
            detectiveBtn.disabled = true;
            detectiveBtn.querySelector('.btn-text').textContent = '🔄 AI 排查中...';
            outputContainer.innerHTML = '<div class="output-placeholder"><div class="placeholder-icon">⏳</div><p>扫描历史事故中...</p></div>';

            animateThinking(stepsContainer, DETECTIVE_DATA.steps, statusEl, () => {
                detectiveBtn.disabled = false;
                detectiveBtn.querySelector('.btn-text').textContent = '🔍 AI 找历史根源';
                setTimeout(() => {
                    outputContainer.innerHTML = '';
                    outputContainer.appendChild(createOutputEl(DETECTIVE_DATA.output));
                }, 300);
            });
        });
    }

    // Time pills
    document.querySelectorAll('.time-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.time-pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // ============================================
    // Advisor Mode
    // ============================================
    const ADVISOR_DATA = {
        steps: [
            { time: '0.0s', icon: '🧭', title: '理解决策问题', detail: '识别核心问题：<strong>支付服务</strong>从 <code>MySQL</code> 迁移到 <code>TiDB</code>，单表 2 亿行，查询变慢。约束：业务不能停。', type: 'normal' },
            { time: '0.8s', icon: '📂', title: '查这个团队过去 3 年的技术选型', detail: '找到 <strong>5 次相关决策</strong>：3 次数据库相关 + 2 次分库分表相关。<em>其中 2 次和 TiDB 强相关</em>', type: 'normal' },
            { time: '1.6s', icon: '📋', title: '分析 2019 年类似决策', detail: '2019.06 张三曾评估过 TiDB（jira <code>DB-018</code>），<strong>当时放弃了</strong>。原因：<em>"团队不熟悉，运维成本高"</em>。<br>但当时数据量是 <strong>5,000 万行</strong>，现在是 <strong>2 亿行</strong>', type: 'warning' },
            { time: '2.5s', icon: '⚠️', title: '识别隐藏风险', detail: '1) 团队仍然不熟悉 TiDB · 2) 支付场景不允许回滚延迟 · 3) 双写一致性需要额外设计 · <em>2021 年有过一次分库失败的教训（#INC-1453）</em>', type: 'danger' },
            { time: '3.3s', icon: '✅', title: '形成建议', detail: '基于历史决策 + 当前约束 + 团队能力，给 3 个选项及 ROI 评估', type: 'success' }
        ],
        output: {
            title: '🗺️ 决策树 #DECISION-2024-1115-001',
            meta: 'MySQL → TiDB · 基于 5 年历史决策',
            tag: '需谨慎',
            tagClass: 'out-tag-warn',
            headline: '"不迁移" 不是选项，但"立即迁移"也不是',
            sub: '基于团队 2019 年放弃 TiDB 的历史 + 2021 年分库失败教训',
            timeline: [
                { time: '2019.06', text: '张三评估 TiDB · <em>放弃 · 团队不熟</em> · 当时数据量 5,000 万行', type: '' },
                { time: '2021.09', text: '李四尝试分库分表（#DB-118）· <em>部分失败</em> · 回滚耗时 6 小时', type: 'tl-warn' },
                { time: '2023.04', text: '王五引入 TiDB <strong>用于分析场景</strong>（非交易）· 稳定运行 18 个月', type: 'tl-key' },
                { time: '现在', text: '交易表 2 亿行 · 查询变慢 · <em>你面前</em>', type: 'tl-danger' }
            ],
            finding: '<strong>AI 关键洞察：</strong>你们团队 2019 年放弃过 TiDB（原因：团队不熟），但 <em>2023 年已经在分析场景用 TiDB 18 个月了</em>。这意味着<strong>技术债务已经还清</strong>。现在迁移的障碍不是"团队不熟"，是"支付场景一致性的工程复杂度"',
            findingClass: '',
            options: [
                { letter: 'A', name: '立即全量迁移到 TiDB', tag: '激进', tagClass: 'tag-danger', meta: '⏱️ 6 周 · 💰 ¥ 200 万 · 📉 风险高（一致性 + 回滚）' },
                { letter: 'B', name: '分阶段迁移（双写 + 灰度）', tag: '推荐', tagClass: 'tag-rec', meta: '⏱️ 3 月 · 💰 ¥ 300 万 · 📉 风险可控（参考 2021 教训）' },
                { letter: 'C', name: '只迁移读路径（HTAP）', tag: '保守', tagClass: 'tag-warn', meta: '⏱️ 1 月 · 💰 ¥ 80 万 · 📉 解决 80% 问题' }
            ],
            citations: ['Jira(8)', 'RFC(3)', '分库复盘(1)', 'TiDB 实践(1)']
        }
    };

    const advisorBtn = document.getElementById('advisorBtn');
    if (advisorBtn) {
        advisorBtn.addEventListener('click', () => {
            if (advisorBtn.disabled) return;
            
            const stepsContainer = document.getElementById('advisorSteps');
            const outputContainer = document.getElementById('advisorOutput');
            const statusEl = document.getElementById('advisorStatus');
            
            advisorBtn.disabled = true;
            advisorBtn.querySelector('.btn-text').textContent = '🔄 AI 推理中...';
            outputContainer.innerHTML = '<div class="output-placeholder"><div class="placeholder-icon">⏳</div><p>分析历史决策中...</p></div>';

            animateThinking(stepsContainer, ADVISOR_DATA.steps, statusEl, () => {
                advisorBtn.disabled = false;
                advisorBtn.querySelector('.btn-text').textContent = '🎯 AI 给我建议';
                setTimeout(() => {
                    outputContainer.innerHTML = '';
                    outputContainer.appendChild(createOutputEl(ADVISOR_DATA.output));
                }, 300);
            });
        });
    }

    // Context pills
    document.querySelectorAll('.context-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.context-pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // ============================================
    // Value Calculator
    // ============================================
    const sliders = {
        headcount: document.getElementById('headcountSlider'),
        hire: document.getElementById('hireSlider'),
        cost: document.getElementById('costSlider'),
        incident: document.getElementById('incidentSlider')
    };
    const outputs = {
        headcount: document.getElementById('headcountVal'),
        hire: document.getElementById('hireVal'),
        cost: document.getElementById('costVal'),
        incident: document.getElementById('incidentVal'),
        total: document.getElementById('totalWaste'),
        breakdown: document.getElementById('calcBreakdown'),
        invest: document.getElementById('roiInvest'),
        save: document.getElementById('roiSave'),
        ratio: document.getElementById('roiRatio')
    };

    function calculate() {
        const headcount = parseInt(sliders.headcount.value);
        const hire = parseInt(sliders.hire.value);
        const cost = parseInt(sliders.cost.value);
        const incident = parseInt(sliders.incident.value);

        outputs.headcount.textContent = `${headcount.toLocaleString()} 人`;
        outputs.hire.textContent = `${hire} 人/年`;
        outputs.cost.textContent = `¥ ${cost} 万`;
        outputs.incident.textContent = `${incident} 次`;

        const onboardingWaste = hire * 3.5 * (cost / 12) * 0.5;
        const collabWaste = headcount * 0.3 * 0.1;
        const turnoverWaste = headcount * 0.05 * cost * 0.2;
        const incidentWaste = incident * 30;
        const techDebtWaste = headcount * 0.2;
        const totalWaste = onboardingWaste + collabWaste + turnoverWaste + incidentWaste + techDebtWaste;
        const invest = 50 + headcount * 0.1;
        const save = totalWaste * 0.7;
        const ratio = save / invest;

        outputs.total.textContent = Math.round(totalWaste).toLocaleString();
        
        const items = [
            { label: '新人 Onboarding 延长损失', value: onboardingWaste, color: 'bd-fill-blue' },
            { label: '跨团队协作返工', value: collabWaste, color: 'bd-fill-purple' },
            { label: '关键员工离职 context 损失', value: turnoverWaste, color: 'bd-fill-amber' },
            { label: '同类事故重复发生', value: incidentWaste, color: 'bd-fill-rose' },
            { label: '技术债治理凭经验', value: techDebtWaste, color: 'bd-fill-green' }
        ];
        items.sort((a, b) => b.value - a.value);
        const maxValue = items[0].value || 1;
        let bdHTML = '';
        items.forEach(item => {
            const percent = (item.value / maxValue) * 100;
            bdHTML += `
                <div class="bd-item">
                    <div class="bd-label">${item.label}</div>
                    <div class="bd-bar"><div class="bd-fill ${item.color}" style="width: ${percent}%"></div></div>
                    <div class="bd-value">¥ ${Math.round(item.value)} 万</div>
                </div>`;
        });
        outputs.breakdown.innerHTML = bdHTML;
        outputs.invest.textContent = `¥ ${Math.round(invest)} 万/年`;
        outputs.save.textContent = `¥ ${Math.round(save).toLocaleString()} 万/年`;
        outputs.ratio.textContent = `${ratio.toFixed(1)} x`;
    }

    Object.values(sliders).forEach(slider => {
        if (slider) slider.addEventListener('input', calculate);
    });
    if (sliders.headcount) calculate();

    // ============================================
    // Console easter egg
    // ============================================
    console.log('%c⛏️ Code Archaeology v3', 'font-size: 20px; font-weight: bold; background: linear-gradient(135deg, #00d4ff, #7c3aed); -webkit-background-clip: text; color: transparent;');
    console.log('%c3 种 Demo 模式 · AI 思考过程可视化 · 真的能玩', 'font-size: 13px; color: #a8b0c0;');

})();
