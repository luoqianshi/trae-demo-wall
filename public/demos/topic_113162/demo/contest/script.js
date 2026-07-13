const navItems = document.querySelectorAll('.dg2-nav-item');
const views = document.querySelectorAll('.dg2-view');
const titleEl = document.getElementById('dg2-title');
const copyBtn = document.getElementById('dg2-copy-btn');
const toastEl = document.getElementById('dg2-toast');

const viewTitles = {
  overview: '系统总览',
  newspaper: '晨报',
  work: '并行看板',
  timeline: '三重记忆系统',
  daily: 'VK日报周报',
  distill: '文档蒸馏',
  docs: 'Wiki知识库',
  templates: '指令模板',
  outputs: '最近产出',
  fleet: 'Agent舰队',
  skillmarket: 'Skill技能市场',
  okr: '战略地图',
  finance: '财务看板',
  health: '健康三维度',
  pref: '我的偏好'
};

const viewPrompts = {
  overview: '打开Workboard，回顾我最近一周的关键决策',
  newspaper: '查看今日晨报解读',
  work: '帮我把这个需求拆解成子任务并派发',
  timeline: '回顾我最近一周的关键决策和产出',
  daily: '生成本周的VK日报和周报',
  distill: '蒸馏这份文档，提炼关键认知和行动项',
  docs: '从知识库中检索关于AI落地的内容',
  templates: '使用指令模板生成周报',
  outputs: '查看我最近的产出',
  fleet: '派发一个代码开发任务给Trae',
  skillmarket: '打开Skill技能市场，安装大赛专属技能包',
  okr: '查看我的战略地图',
  finance: '查看我的AI成本报告',
  health: '记录今天的健康数据',
  pref: '设置我的工作偏好'
};

function updateView(viewName) {
  navItems.forEach(item => item.classList.remove('active'));
  const activeItem = document.querySelector(`[data-view="${viewName}"]`);
  if (activeItem) activeItem.classList.add('active');

  views.forEach(view => view.classList.remove('active'));
  const targetView = document.getElementById(`view-${viewName}`);
  if (targetView) targetView.classList.add('active');

  // 只显示当前页面对应的浮层和灯泡
  document.querySelectorAll('.dg2-highlight-tip').forEach(tip => {
    const isCurrent = tip.dataset.module === viewName;
    tip.style.display = isCurrent ? '' : 'none';
  });
  document.querySelectorAll('.dg2-tip-bulb').forEach(bulb => {
    const isCurrent = bulb.dataset.module === viewName;
    if (isCurrent && bulb.classList.contains('show')) {
      bulb.style.display = '';
    } else {
      bulb.style.display = 'none';
    }
  });

  titleEl.textContent = viewTitles[viewName] || '系统总览';
}

navItems.forEach(item => {
  item.addEventListener('click', () => {
    const viewName = item.dataset.view;
    updateView(viewName);
  });
});

copyBtn.addEventListener('click', () => {
  const currentView = document.querySelector('.dg2-nav-item.active').dataset.view;
  const promptText = viewPrompts[currentView] || viewPrompts.overview;
  
  navigator.clipboard.writeText(promptText).then(() => {
    toastEl.classList.add('show');
    setTimeout(() => {
      toastEl.classList.remove('show');
    }, 2000);
  });
});

document.addEventListener('DOMContentLoaded', () => {
  updateView('overview');
});

// 浮层关闭逻辑（关闭后显示灯泡，点击灯泡重新打开）
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('dg2-tip-close')) {
    const tip = e.target.closest('.dg2-highlight-tip');
    if (tip) {
      tip.classList.add('closed');
      sessionStorage.setItem(`tip-closed-${tip.dataset.module}`, '1');
      const module = tip.dataset.module;
      const container = document.querySelector('.dg2-tip-container');
      if (container) {
        let bulb = container.querySelector(`.dg2-tip-bulb[data-module="${module}"]`);
        if (!bulb) {
          bulb = document.createElement('div');
          bulb.className = 'dg2-tip-bulb';
          bulb.textContent = '💡';
          bulb.title = '点击查看亮点说明';
          bulb.dataset.module = module;
          container.appendChild(bulb);
          bulb.addEventListener('click', () => {
            tip.classList.remove('closed');
            sessionStorage.removeItem(`tip-closed-${module}`);
            bulb.classList.remove('show');
          });
        }
        bulb.classList.add('show');
      }
    }
  }
});

// 页面加载时检查哪些浮层已关闭
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.dg2-highlight-tip').forEach(tip => {
    const module = tip.dataset.module;
    if (sessionStorage.getItem(`tip-closed-${module}`) === '1') {
      tip.classList.add('closed');
      const container = document.querySelector('.dg2-tip-container');
      if (container) {
        let bulb = container.querySelector(`.dg2-tip-bulb[data-module="${module}"]`);
        if (!bulb) {
          bulb = document.createElement('div');
          bulb.className = 'dg2-tip-bulb';
          bulb.textContent = '💡';
          bulb.title = '点击查看亮点说明';
          bulb.dataset.module = module;
          container.appendChild(bulb);
          bulb.addEventListener('click', () => {
            tip.classList.remove('closed');
            sessionStorage.removeItem(`tip-closed-${module}`);
            bulb.classList.remove('show');
          });
        }
        bulb.classList.add('show');
      }
    }
  });
});

// ============ Tab 切换逻辑 ============
// 为每个模块内部的 tabs 添加切换功能
document.querySelectorAll('.dg2-tabs').forEach(tabBar => {
  const tabs = tabBar.querySelectorAll('.dg2-tab[data-tab]');
  if (tabs.length === 0) return; // 跳过没有 data-tab 属性的 tab 组（如 docs/templates/outputs 的筛选 tabs）
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      const container = tabBar.closest('.dg2-ui') || tabBar.closest('.dg2-view');
      if (!container) return;
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      container.querySelectorAll('.dg2-tab-panel').forEach(p => p.classList.remove('active'));
      const targetPanel = container.querySelector(`.dg2-tab-panel[data-tab="${target}"]`);
      if (targetPanel) targetPanel.classList.add('active');
    });
  });
});

// ============ Skill技能市场交互逻辑 ============
const skillMarketData = {
  'skill-competition-demo': { icon:'🏆', name:'TRAE Demo生成套件', version:'v1.0.7', category:'大赛专项', desc:'一键生成大赛Demo页面、模拟界面、配套虚拟数据，自动对齐Workboard页面规范', highlight:'本次参赛核心扩展技能，自动生成完整演示素材', bindAgent:'代码助手、分析助手', tags:'免费 · 官方推荐', usageCount:12, case:'当前Demo页面全部由【TRAE Demo生成套件】一键产出，自动对齐Workboard页面规范，生成完整演示素材。' },
  'skill-video-script': { icon:'🎬', name:'演示视频脚本生成器', version:'v1.0.2', category:'大赛专项', desc:'根据系统任务、记忆数据自动生成Demo演示分镜、旁白、时长规划', highlight:'自动读取三重记忆历史对话，定制专属讲解脚本', bindAgent:'文档助手', tags:'免费', usageCount:8 },
  'skill-batch-distill': { icon:'📑', name:'批量文档蒸馏', version:'v2.1.0', category:'文档处理', desc:'批量读取本地文件夹内PDF/MD，统一提炼认知、结论、行动项入库Wiki', highlight:'大幅减少大赛材料整理时间，效率提升70%', bindAgent:'文档助手', tags:'免费 · 高频工具', usageCount:27 },
  'skill-agent-scheduler': { icon:'🤖', name:'Agent多任务调度器', version:'v1.3.1', category:'Agent增强', desc:'自动分配多Agent并行处理看板任务，自动规避API成本峰值', highlight:'联动财务看板做成本智能管控', bindAgent:'全部Agent', tags:'免费', usageCount:15 },
  'skill-okr-calc': { icon:'📊', name:'OKR进度自动核算', version:'v1.0.0', category:'数据报表', desc:'读取并行看板、日报数据实时更新战略地图进度百分比，自动生成进度提醒', highlight:'大赛冲刺进度实时更新，无需手动修改', bindAgent:'分析助手', tags:'免费', usageCount:9 },
  'skill-local-file-scan': { icon:'🗂️', name:'本地文件深度检索', version:'v1.2.4', category:'本地文件', desc:'基于File System Access API扫描本地工作目录，全文检索文件并同步至Wiki知识库', highlight:'完全本地读取，不上传原始文件，保障隐私', bindAgent:'分析助手、文档助手', tags:'免费 · 底层核心', usageCount:21 },
  'skill-self-custom': { icon:'✏️', name:'自定义技能导入', version:'v1.0.0', category:'自定义', desc:'支持上传本地Markdown技能文件，自定义Agent执行逻辑，私有工作流永久留存本地', highlight:'可沉淀个人专属工作方法，长期复用', bindAgent:'自由绑定任意Agent', tags:'免费 · 自定义扩展', usageCount:4 }
};

// 安装按钮交互
document.addEventListener('click', (e) => {
  const installBtn = e.target.closest('[data-skill-install]');
  if (installBtn) {
    const skillId = installBtn.dataset.skillInstall;
    const card = installBtn.closest('.dg2-tpl-card');
    if (card) {
      // 大赛专项卡片添加金色高亮
      if (skillMarketData[skillId] && skillMarketData[skillId].category === '大赛专项') {
        card.classList.add('dg2-tpl-star');
      }
      // 按钮变为详情
      installBtn.textContent = '详情';
      installBtn.removeAttribute('data-skill-install');
      installBtn.setAttribute('data-skill-detail', skillId);
      // 添加已安装标记
      if (!card.querySelector('.dg2-skill-installed-tag')) {
        const tag = document.createElement('div');
        tag.className = 'dg2-skill-installed-tag';
        tag.style.cssText = 'font-size:11px;color:var(--green);margin-top:6px;font-weight:600';
        tag.textContent = '✓ 已安装';
        card.appendChild(tag);
      }
    }
  }
});

// 详情弹窗交互
document.addEventListener('click', (e) => {
  const detailBtn = e.target.closest('[data-skill-detail]');
  if (detailBtn) {
    const skillId = detailBtn.dataset.skillDetail;
    const skill = skillMarketData[skillId];
    if (!skill) return;
    showSkillDetailModal(skill);
  }
});

function showSkillDetailModal(skill) {
  // 移除已有弹窗
  const existing = document.getElementById('dg2-skill-modal-bg');
  if (existing) existing.remove();

  const bg = document.createElement('div');
  bg.id = 'dg2-skill-modal-bg';
  bg.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px';

  const modal = document.createElement('div');
  modal.style.cssText = 'max-width:520px;width:100%;background:var(--surface);border-radius:var(--radius);border:1px solid var(--border);box-shadow:0 8px 32px rgba(0,0,0,0.12);overflow:hidden';

  let html = '<div style="padding:20px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px">';
  html += `<span style="font-size:32px">${skill.icon}</span>`;
  html += `<div style="flex:1"><div style="font-size:16px;font-weight:700;color:var(--text)">${skill.name}</div>`;
  html += `<div style="font-size:12px;color:var(--text-3)">${skill.version} · ${skill.category}</div></div>`;
  html += '<button id="dg2-skill-modal-close" style="background:none;border:none;font-size:22px;color:var(--text-3);cursor:pointer;padding:4px 8px">×</button></div>';

  html += '<div style="padding:20px;max-height:60vh;overflow-y:auto">';
  html += `<div style="font-size:14px;color:var(--text-2);line-height:1.7;margin-bottom:12px">${skill.desc}</div>`;
  html += `<div style="font-size:13px;color:var(--green);background:var(--green-soft);padding:8px 12px;border-radius:8px;margin-bottom:16px;font-weight:600">✨ ${skill.highlight}</div>`;

  html += '<div style="display:flex;flex-direction:column;gap:10px">';
  html += `<div><div style="font-size:12px;color:var(--text-3);margin-bottom:4px">绑定Agent</div><div style="font-size:13px;color:var(--text)">${skill.bindAgent}</div></div>`;
  html += `<div><div style="font-size:12px;color:var(--text-3);margin-bottom:4px">标签</div><div style="font-size:13px;color:var(--text)">${skill.tags}</div></div>`;
  html += `<div><div style="font-size:12px;color:var(--text-3);margin-bottom:4px">使用次数</div><div style="font-size:13px;color:var(--text)">${skill.usageCount} 次</div></div>`;
  if (skill.case) {
    html += `<div><div style="font-size:12px;color:var(--text-3);margin-bottom:4px">🏆 大赛使用案例</div><div style="font-size:13px;color:var(--text);background:var(--surface-2);padding:10px;border-radius:8px">${skill.case}</div></div>`;
  }
  html += '</div>';
  html += '</div>';

  modal.innerHTML = html;
  bg.appendChild(modal);
  document.body.appendChild(bg);

  // 关闭逻辑
  modal.querySelector('#dg2-skill-modal-close').addEventListener('click', () => bg.remove());
  bg.addEventListener('click', (ev) => { if (ev.target === bg) bg.remove(); });
}
