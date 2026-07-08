/**
 * 产品价值展示页模块（大赛专用首页）
 */
window.ShowcaseModule = {
  render() {
    const stats = (window.AppData && window.AppData.stats) || {};
    const container = document.createElement('div');
    container.className = 'space-y-0';

    // ========== Hero区 ==========
    const hero = document.createElement('section');
    hero.className = 'relative overflow-hidden bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white py-20 px-6';
    hero.innerHTML = `
      <div class="absolute inset-0 opacity-20">
        <div class="absolute top-20 left-10 w-72 h-72 bg-indigo-500 rounded-full blur-3xl"></div>
        <div class="absolute bottom-20 right-10 w-96 h-96 bg-violet-500 rounded-full blur-3xl"></div>
      </div>
      <div class="relative max-w-5xl mx-auto text-center">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-xs font-medium mb-6">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          声纹智转 v2.0 大赛版本
        </div>
        <h1 class="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
          让每一次声音<br>
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">都精准可溯</span>
        </h1>
        <p class="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10">
          基于深度学习的声纹识别与语音转写技术，实现多人场景下的精准区分与实时转写，让信息记录从未如此高效。
        </p>

        <!-- 动态计数器 -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          ${[
            { key: 'totalRecords', label: '转写记录', suffix: '条' },
            { key: 'totalDuration', label: '服务时长', suffix: '小时' },
            { key: 'accuracy', label: '识别准确率', suffix: '%' },
            { key: 'languages', label: '支持语言', suffix: '种' }
          ].map(item => `
            <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <p class="text-3xl md:text-4xl font-bold text-white counter" data-target="${stats[item.key] || 0}" data-suffix="${item.suffix}">0</p>
              <p class="text-xs text-slate-400 mt-1">${item.label}</p>
            </div>
          `).join('')}
        </div>

        <div class="mt-10 flex items-center justify-center gap-4">
          <button id="btn-start-demo" class="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2">
            <i data-lucide="play" class="w-5 h-5"></i>
            立即体验
          </button>
          <button id="btn-learn-more" class="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold rounded-xl transition-all border border-white/20 flex items-center gap-2">
            <i data-lucide="chevron-down" class="w-5 h-5"></i>
            了解更多
          </button>
        </div>
      </div>
    `;
    container.appendChild(hero);

    // ========== 痛点对比区 ==========
    const painPoint = document.createElement('section');
    painPoint.className = 'py-16 px-6 bg-slate-50 dark:bg-slate-900';
    painPoint.innerHTML = `
      <div class="max-w-5xl mx-auto">
        <div class="text-center mb-12">
          <h2 class="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3">传统方式 vs 声纹智转</h2>
          <p class="text-slate-500 dark:text-slate-400">告别低效记录，拥抱智能转写</p>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead>
              <tr class="border-b border-slate-200 dark:border-slate-700">
                <th class="py-4 pr-4 text-slate-500 dark:text-slate-400 font-medium w-1/4">对比维度</th>
                <th class="py-4 px-4 text-slate-500 dark:text-slate-400 font-medium w-1/3">
                  <span class="inline-flex items-center gap-1"><i data-lucide="x-circle" class="w-4 h-4 text-red-500"></i> 传统方式</span>
                </th>
                <th class="py-4 pl-4 text-indigo-600 dark:text-indigo-400 font-medium w-1/3">
                  <span class="inline-flex items-center gap-1"><i data-lucide="check-circle" class="w-4 h-4 text-emerald-500"></i> 声纹智转</span>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
              ${[
                ['多人区分', '无法区分说话人，内容混杂', '精准声纹识别，自动标注发言人'],
                ['转写速度', '会后整理，耗时数小时', '实时转写，边说边出文字'],
                ['准确率', '人工记录易遗漏、出错', 'AI识别准确率超98%'],
                ['多语言', '需专业翻译人员', '支持50+语言实时转写'],
                ['成本', '人力成本高，难以规模化', '一次部署，无限复用'],
                ['可追溯性', '纸质/文档难以检索', '结构化数据，秒级检索']
              ].map(([dim, trad, smart]) => `
                <tr class="hover:bg-white dark:hover:bg-slate-800/50 transition-colors">
                  <td class="py-4 pr-4 font-medium text-slate-900 dark:text-white">${dim}</td>
                  <td class="py-4 px-4 text-slate-500 dark:text-slate-400">${trad}</td>
                  <td class="py-4 pl-4 text-slate-800 dark:text-slate-200 font-medium">${smart}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    container.appendChild(painPoint);

    // ========== 技术架构图 ==========
    const arch = document.createElement('section');
    arch.className = 'py-16 px-6 bg-white dark:bg-slate-950';
    arch.innerHTML = `
      <div class="max-w-5xl mx-auto">
        <div class="text-center mb-12">
          <h2 class="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3">核心技术架构</h2>
          <p class="text-slate-500 dark:text-slate-400">端到端的全流程智能化处理</p>
        </div>
        <div class="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-2">
          ${[
            { name: '音频输入', icon: 'mic', color: 'sky', desc: '多通道采集' },
            { name: '预处理', icon: 'sliders-horizontal', color: 'indigo', desc: '降噪/归一化' },
            { name: '声纹识别', icon: 'fingerprint', color: 'violet', desc: '说话人分离' },
            { name: '语音识别', icon: 'audio-waveform', color: 'purple', desc: 'ASR引擎' },
            { name: 'NLP理解', icon: 'brain', color: 'fuchsia', desc: '语义分析' },
            { name: '智能输出', icon: 'file-output', color: 'emerald', desc: '结构化文档' }
          ].map((node, i, arr) => `
            <div class="flex items-center gap-2 md:gap-0">
              <div class="arch-node group relative bg-${node.color}-50 dark:bg-${node.color}-900/20 border-2 border-${node.color}-200 dark:border-${node.color}-800/50 rounded-xl p-4 w-36 text-center hover:shadow-lg hover:border-${node.color}-400 dark:hover:border-${node.color}-600 transition-all cursor-default">
                <div class="w-10 h-10 mx-auto rounded-lg bg-${node.color}-100 dark:bg-${node.color}-900/40 flex items-center justify-center text-${node.color}-600 dark:text-${node.color}-400 mb-2 group-hover:scale-110 transition-transform">
                  <i data-lucide="${node.icon}" class="w-5 h-5"></i>
                </div>
                <p class="text-sm font-semibold text-slate-900 dark:text-white">${node.name}</p>
                <p class="text-xs text-slate-500 dark:text-slate-400">${node.desc}</p>
              </div>
              ${i < arr.length - 1 ? `
                <div class="hidden md:flex items-center justify-center w-8">
                  <i data-lucide="chevron-right" class="w-5 h-5 text-slate-300 dark:text-slate-600"></i>
                </div>
                <div class="md:hidden flex items-center justify-center h-6">
                  <i data-lucide="chevron-down" class="w-5 h-5 text-slate-300 dark:text-slate-600"></i>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
    container.appendChild(arch);

    // ========== 应用场景卡片网格 ==========
    const scenes = document.createElement('section');
    scenes.className = 'py-16 px-6 bg-slate-50 dark:bg-slate-900';
    scenes.innerHTML = `
      <div class="max-w-5xl mx-auto">
        <div class="text-center mb-12">
          <h2 class="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3">全场景覆盖</h2>
          <p class="text-slate-500 dark:text-slate-400">从会议室到法庭，无处不在的精准记录</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          ${[
            { name: '会议记录', icon: 'users', color: 'sky', desc: '多人会议实时转写，自动区分发言人，生成结构化会议纪要。' },
            { name: '课堂笔记', icon: 'graduation-cap', color: 'indigo', desc: '教师授课实时转文字，学生专注听讲，课后复习更高效。' },
            { name: '媒体访谈', icon: 'mic-2', color: 'violet', desc: '记者采访录音精准转写，支持多人对话标注与快速剪辑。' },
            { name: '医疗问诊', icon: 'stethoscope', color: 'emerald', desc: '医患对话结构化记录，辅助生成电子病历，提升诊疗效率。' },
            { name: '法庭庭审', icon: 'scale', color: 'amber', desc: '庭审过程实时记录，发言者精准区分，确保司法记录严谨完整。' },
            { name: '跨国交流', icon: 'globe-2', color: 'rose', desc: '多语言实时转写与翻译，打破语言壁垒，促进全球协作。' }
          ].map(scene => `
            <div class="scene-card bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg hover:-translate-y-1 transition-all cursor-default group">
              <div class="w-12 h-12 rounded-xl bg-${scene.color}-100 dark:bg-${scene.color}-900/30 flex items-center justify-center text-${scene.color}-600 dark:text-${scene.color}-400 mb-4 group-hover:scale-110 transition-transform">
                <i data-lucide="${scene.icon}" class="w-6 h-6"></i>
              </div>
              <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">${scene.name}</h3>
              <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">${scene.desc}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    container.appendChild(scenes);

    // ========== 社会价值区 ==========
    const social = document.createElement('section');
    social.className = 'py-16 px-6 bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900';
    social.innerHTML = `
      <div class="max-w-5xl mx-auto">
        <div class="text-center mb-12">
          <h2 class="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3">社会价值</h2>
          <p class="text-slate-500 dark:text-slate-400">技术向善，让声音服务于每一个人</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          ${[
            { name: '听障辅助', icon: 'ear', color: 'emerald', desc: '实时语音转文字，帮助听障人士平等参与对话，消除信息鸿沟。' },
            { name: '跨语言沟通', icon: 'languages', color: 'sky', desc: '打破语言壁垒，让不同母语的人们能够无缝交流与协作。' },
            { name: '信息平权', icon: 'heart-handshake', color: 'violet', desc: '让每个人都能便捷地记录、检索和分享语音信息，促进知识普惠。' }
          ].map(item => `
            <div class="text-center p-6">
              <div class="w-16 h-16 mx-auto rounded-2xl bg-${item.color}-100 dark:bg-${item.color}-900/30 flex items-center justify-center text-${item.color}-600 dark:text-${item.color}-400 mb-4">
                <i data-lucide="${item.icon}" class="w-8 h-8"></i>
              </div>
              <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-2">${item.name}</h3>
              <p class="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">${item.desc}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    container.appendChild(social);

    // ========== 底部 CTA ==========
    const cta = document.createElement('section');
    cta.className = 'py-12 px-6 bg-slate-900 text-white text-center';
    cta.innerHTML = `
      <div class="max-w-3xl mx-auto">
        <h2 class="text-2xl md:text-3xl font-bold mb-4">准备好体验声纹智转了吗？</h2>
        <p class="text-slate-400 mb-8">立即开始，让每一次声音都精准可溯</p>
        <button id="btn-start-demo-2" class="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/30 inline-flex items-center gap-2">
          <i data-lucide="rocket" class="w-5 h-5"></i>
          开始使用
        </button>
      </div>
    `;
    container.appendChild(cta);

    return container;
  },

  init() {
    // 计数器动画
    this.animateCounters();

    // 平滑滚动到了解更多
    document.getElementById('btn-learn-more')?.addEventListener('click', () => {
      const nextSection = document.querySelector('section:nth-of-type(2)');
      nextSection?.scrollIntoView({ behavior: 'smooth' });
    });

    // 立即体验按钮
    document.getElementById('btn-start-demo')?.addEventListener('click', () => {
      App.showToast('欢迎体验声纹智转', 'success');
    });

    document.getElementById('btn-start-demo-2')?.addEventListener('click', () => {
      App.showToast('欢迎体验声纹智转', 'success');
    });

    // 架构节点悬停效果增强
    document.querySelectorAll('.arch-node').forEach(node => {
      node.addEventListener('mouseenter', () => {
        node.style.transform = 'scale(1.05)';
      });
      node.addEventListener('mouseleave', () => {
        node.style.transform = 'scale(1)';
      });
    });
  },

  animateCounters() {
    const counters = document.querySelectorAll('.counter');
    counters.forEach(counter => {
      const target = parseInt(counter.dataset.target) || 0;
      const suffix = counter.dataset.suffix || '';
      const duration = 2000;
      const startTime = performance.now();

      const update = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(easeOut * target);
        counter.textContent = current + suffix;

        if (progress < 1) {
          requestAnimationFrame(update);
        }
      };

      requestAnimationFrame(update);
    });
  }
};
