// 方法切换数据
const methodData = [
  {
    title: '拍照识别，一拍即得',
    desc: '只需对准餐桌上的菜品拍一张照片，AI 引擎在 1-2 秒内即可识别出菜名、估算分量并计算营养成分。操作零门槛，长辈也能轻松上手。',
    steps: [
      { num: '1', title: '点击"拍今天的菜"', success: false },
      { num: '2', title: '对准菜品拍照', success: false },
      { num: '3', title: 'AI 1秒识别结果', success: false },
      { num: '✓', title: '自动记录 + 禁忌预警', success: true },
    ],
    features: [
      { icon: '⚡', title: '1秒识别', desc: '深度学习算法，毫秒级响应' },
      { icon: '🎯', title: '98%准确率', desc: '百万级中餐菜品训练样本' },
      { icon: '🔊', title: '语音播报', desc: '识别结果语音读给您听' },
    ]
  },
  {
    title: '相册选择，方便快捷',
    desc: '如果已经拍了照片，直接从相册选择即可识别。支持批量识别，一餐多道菜也能一次搞定。',
    steps: [
      { num: '1', title: '点击"从相册选择"', success: false },
      { num: '2', title: '选择菜品照片', success: false },
      { num: '3', title: 'AI 自动识别', success: false },
      { num: '✓', title: '批量记录完成', success: true },
    ],
    features: [
      { icon: '🖼️', title: '批量识别', desc: '一次选择多张照片' },
      { icon: '📱', title: '系统相册', desc: '直接访问手机相册' },
      { icon: '⚡', title: '快速处理', desc: '多图并行识别加速' },
    ]
  },
  {
    title: '手动补录，精准可靠',
    desc: '拍照识别不准？没关系，支持手动输入菜名补录。内置数千种菜品数据库，搜索即可选择。',
    steps: [
      { num: '1', title: '点击"手动补录"', success: false },
      { num: '2', title: '输入或搜索菜名', success: false },
      { num: '3', title: '选择餐次', success: false },
      { num: '✓', title: '保存记录成功', success: true },
    ],
    features: [
      { icon: '🔍', title: '智能搜索', desc: '拼音/首字母快速查找' },
      { icon: '📝', title: '自定义分量', desc: '手动调整食用量' },
      { icon: '🏷️', title: '分类选择', desc: '按菜系/类别浏览' },
    ]
  }
];

let currentMethod = 0;

function switchMethod(index) {
  currentMethod = index;
  const data = methodData[index];

  document.querySelectorAll('.method-tab').forEach((tab, i) => {
    tab.classList.toggle('active', i === index);
  });

  document.getElementById('methodTitle').textContent = data.title;
  document.getElementById('methodDesc').textContent = data.desc;

  const stepsHtml = data.steps.map((step, i) => {
    const isLast = i === data.steps.length - 1;
    return `
      <div class="method-step ${step.success ? 'success' : ''}">
        <div class="step-num">${step.num}</div>
        <div class="step-title">${step.title}</div>
      </div>
      ${!isLast ? '<div class="method-arrow">↓</div>' : ''}
    `;
  }).join('');
  document.getElementById('methodDemoContent').innerHTML = stepsHtml;

  const featuresHtml = data.features.map(f => `
    <div class="method-feature">
      <span class="mf-icon">${f.icon}</span>
      <div>
        <div class="mf-title">${f.title}</div>
        <div class="mf-desc">${f.desc}</div>
      </div>
    </div>
  `).join('');

  const featuresContainer = document.querySelector('.method-features');
  if (featuresContainer) {
    featuresContainer.innerHTML = featuresHtml;
  }
}

// 老人端界面切换
function showUiScreen(screenId) {
  const map = {
    'elder-home': 'screen-elder-home',
    'elder-result': 'screen-elder-result',
    'elder-diet': 'screen-elder-diet',
    'elder-mine': 'screen-elder-mine',
  };

  const targetId = map[screenId];
  if (!targetId) return;

  document.querySelectorAll('.ui-screen').forEach(screen => {
    screen.style.display = 'none';
  });

  const target = document.getElementById(targetId);
  if (target) {
    target.style.display = 'block';
  }

  document.querySelectorAll('.ui-desc-item').forEach((item, i) => {
    const ids = ['elder-home', 'elder-result', 'elder-diet', 'elder-mine'];
    item.classList.toggle('active', ids[i] === screenId);
  });
}

// 滚动到 Demo
function scrollToDemo() {
  document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  if (window.switchMethod) {
    switchMethod(0);
  }

  // 导航栏滚动效果
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
      navbar.style.background = 'rgba(26, 26, 46, 0.98)';
      navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.2)';
    } else {
      navbar.style.background = 'rgba(26, 26, 46, 0.95)';
      navbar.style.boxShadow = 'none';
    }
    lastScroll = window.scrollY;
  });

  // 渐入动画
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.feature-block, .testimonial-card, .help-card, .family-screen-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
});
