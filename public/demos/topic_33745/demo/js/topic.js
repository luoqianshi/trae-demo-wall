// ========== Toast 提示 ==========
function showToast(message, type = 'success') {
    const container = document.querySelector('.toast-container')
        || (() => {
            const c = document.createElement('div');
            c.className = 'toast-container';
            document.body.appendChild(c);
            return c;
        })();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    toast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-message">${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// ========== 复制到剪贴板 ==========
async function copyToClipboard(text, successMsg = '复制成功') {
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
        } else {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        }
        showToast(successMsg, 'success');
    } catch (e) {
        showToast('复制失败，请手动选择', 'error');
    }
}

// ========== 主题切换 ==========
(function initTheme() {
    const btn = document.getElementById('btn-theme');
    const saved = localStorage.getItem('topic-theme') || 'light';
    if (saved === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        btn.textContent = '☀️';
    }
    btn.addEventListener('click', () => {
        const cur = document.documentElement.getAttribute('data-theme');
        if (cur === 'dark') {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('topic-theme', 'light');
            btn.textContent = '🌙';
            showToast('已切换为亮色模式', 'info');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('topic-theme', 'dark');
            btn.textContent = '☀️';
            showToast('已切换为暗色模式 🌙', 'info');
        }
    });
})();

// ========== 复制全文 ==========
(function initCopyAll() {
    const btn = document.getElementById('btn-copy-all');
    btn.addEventListener('click', () => {
        const lines = [];
        lines.push('【标签】学习工作');
        lines.push('【标题】【学习工作赛道】+ LinguaWorld 多语种在线学习平台');
        lines.push('');
        lines.push('0. 先和大家打个招呼吧 👋');
        lines.push('· 你是谁：一名编程爱好者 / 独立开发者，喜欢用代码解决日常学习中的小问题，也是 TRAE 的忠实用户。');
        lines.push('· 你是怎么用 TRAE 把 Demo 做出来的：把模糊的想法拆成一句句指令，让 TRAE 生成前端骨架、后端 API、本地 JSON 存储、游戏化交互，半天就能跑通前后端流程。');
        lines.push('');
        lines.push('1. Demo 简介');
        lines.push('· 是什么：一个基于 Web 的多语种在线学习平台，前端原生 HTML/CSS/JS，后端 Node.js + Express。');
        lines.push('· 面向谁：自学者、学生、职场人士。');
        lines.push('· 主要功能：用户系统 / 课程中心 / 互动学习 / 学习进度 / 社区交流 / 成就中心。');
        lines.push('');
        lines.push('2. Demo 创作思路');
        lines.push('· 灵感来源：希望做一个轻量、免费、可自行扩展的多语种学习平台。');
        lines.push('· 想解决的问题：开箱即用的学习入口、持续记录的进度激励、便于开发者扩展。');
        lines.push('· 为什么做这个方向：技术门槛适中、前后端都能覆盖，适合作为 TRAE 实战 Demo。');
        lines.push('');
        lines.push('3. Demo 体验地址');
        lines.push('· 打包：ZIP 整个 demo 目录上传附件。');
        lines.push('· 本地：cd demo && npm install && node api/server.js，浏览器打开 index.html。');
        lines.push('');
        lines.push('4. TRAE 实践过程');
        lines.push('· 完整开发流程：需求梳理 → 前端骨架 → 后端 API → 数据存储 → 联调测试。');
        lines.push('· Session ID：TRAE-LINGUA-001 / TRAE-LINGUA-002 / TRAE-LINGUA-003 / TRAE-LINGUA-004 / TRAE-LINGUA-005。');
        lines.push('');
        lines.push('心得：不需要等到"准备好"才开始。把模糊想法拆成对话指令，TRAE 会带你走完前后端全程。');
        copyToClipboard(lines.join('\n'), '话题全文已复制到剪贴板 📋');
    });
})();

// ========== 复制路径 / 代码 / Session ID ==========
(function initCopyButtons() {
    document.querySelectorAll('[data-action="copy-location"]').forEach(btn => {
        btn.addEventListener('click', () => {
            copyToClipboard(btn.dataset.target, `路径已复制: ${btn.dataset.target}`);
        });
    });
    document.querySelectorAll('[data-action="copy-code"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const pre = btn.closest('.code-block').querySelector('code');
            copyToClipboard(pre.innerText.trim(), '命令已复制到剪贴板 💻');
        });
    });
    document.querySelectorAll('[data-action="copy-session"]').forEach(btn => {
        btn.addEventListener('click', () => {
            copyToClipboard(btn.dataset.target, `Session ID ${btn.dataset.target} 已复制 🔗`);
        });
    });
})();

// ========== 平滑滚动 + 目录/导航高亮 ==========
(function initSmoothScroll() {
    document.querySelectorAll('a[href^="#sec-"], a.toc-item').forEach(link => {
        link.addEventListener('click', e => {
            const target = document.querySelector(link.getAttribute('href'));
            if (target) {
                e.preventDefault();
                const top = target.getBoundingClientRect().top + window.pageYOffset - 80;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });
})();

// ========== 阅读进度条 + 章节高亮 + 回到顶部 ==========
(function initScroll() {
    const progress = document.getElementById('read-progress');
    const backTop = document.getElementById('btn-back-top');
    const navLinks = document.querySelectorAll('.nav-link');
    const secs = document.querySelectorAll('.sec');

    window.addEventListener('scroll', () => {
        const h = document.documentElement;
        const total = h.scrollHeight - h.clientHeight;
        const percent = total > 0 ? (window.pageYOffset / total * 100) : 0;
        progress.style.width = percent + '%';
        backTop.classList.toggle('visible', window.pageYOffset > 400);

        // 找到当前可视的第一个 section
        let activeId = null;
        for (const s of secs) {
            const rect = s.getBoundingClientRect();
            if (rect.top <= 160) activeId = s.id;
            else break;
        }
        navLinks.forEach(a => {
            a.style.color = '';
            a.style.fontWeight = '';
            if (a.getAttribute('href') === '#' + activeId) {
                a.style.color = 'var(--primary-color)';
                a.style.fontWeight = '700';
            }
        });
    });

    backTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
})();

// ========== 数字动画（hero 统计卡片） ==========
(function initStatAnim() {
    const nums = document.querySelectorAll('.stat-num');
    const targets = Array.from(nums).map(n => parseInt(n.textContent, 10));
    nums.forEach(n => n.textContent = '0');

    let raf = null;
    const animate = () => {
        const rect = document.querySelector('.hero').getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            cancelAnimationFrame(raf);
            nums.forEach((n, i) => {
                let cur = 0;
                const end = targets[i];
                const step = Math.max(1, Math.ceil(end / 40));
                const iv = setInterval(() => {
                    cur += step;
                    if (cur >= end) { cur = end; clearInterval(iv); }
                    n.textContent = cur;
                }, 25);
            });
            window.removeEventListener('scroll', animate);
        }
    };
    window.addEventListener('scroll', animate);
    animate();
})();

// ========== 功能卡片 / 文件行 悬停点击 ==========
(function initFeatureClick() {
    document.querySelectorAll('.feature').forEach(card => {
        card.addEventListener('click', () => {
            const name = card.querySelector('.feature-name').textContent;
            showToast(`✨ ${name}：已了解该模块`, 'info');
            card.animate(
                [{ transform: 'scale(1)' }, { transform: 'scale(1.05)' }, { transform: 'scale(1)' }],
                { duration: 300, easing: 'ease-out' }
            );
        });
    });
    document.querySelectorAll('.file-row').forEach(row => {
        row.addEventListener('click', e => {
            if (e.target.closest('button')) return;
            const name = row.querySelector('.file-name').textContent;
            showToast(`📄 ${name} 已选中`, 'info');
        });
    });
})();

// ========== 随机鼓励语 ==========
(function initCheer() {
    const btn = document.getElementById('btn-cheer');
    const cheers = [
        '✨ 你已经比昨天的自己更棒了！',
        '🚀 开始就是完成的一半，继续冲！',
        '💡 把想法说出来，代码自然就有了。',
        '🎯 慢没关系，方向对就不怕路远。',
        '🌟 今天的你，已经超越昨天的你。',
        '💬 对话是最好的开发工具，TRAE 是最好的搭子。',
        '🔥 一次一行代码，成就从这里开始。'
    ];
    btn.addEventListener('click', () => {
        const msg = cheers[Math.floor(Math.random() * cheers.length)];
        btn.animate(
            [{ transform: 'scale(1)' }, { transform: 'scale(1.1) rotate(-2deg)' }, { transform: 'scale(1)' }],
            { duration: 400, easing: 'ease-out' }
        );
        showToast(msg, 'success');
    });
})();

// ========== 章节入场动画（IntersectionObserver） ==========
(function initSectionAnim() {
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(entries => {
        entries.forEach(en => {
            if (en.isIntersecting) {
                en.target.animate(
                    [{ opacity: 0, transform: 'translateY(20px)' },
                     { opacity: 1, transform: 'translateY(0)' }],
                    { duration: 600, easing: 'ease-out', fill: 'forwards' }
                );
                io.unobserve(en.target);
            }
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.sec').forEach(s => io.observe(s));
})();

// 页面加载完成
window.addEventListener('load', () => {
    console.log('%c🌍 LinguaWorld Topic Page Ready！', 'color:#6366f1;font-size:16px;font-weight:bold;');
});
