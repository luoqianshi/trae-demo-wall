/**
 * 政策通应用主入口 - 纯 HTML 版本
 *
 * 渲染输出完全复刻 Next.js 版政策通的界面结构（Tailwind CSS 类名一致）。
 * 通过 window.PolicyMateApp 暴露 API，不使用 ES modules。
 *
 * 依赖：
 *   - js/store.js         -> window.PolicyMateStore
 *   - js/matcher.js       -> window.PolicyMateMatcher
 *   - js/accessibility.js -> window.PolicyMateA11y
 *   - js/router.js        -> window.PolicyMateRouter
 *   - data/policies.json  -> 125 条政策数据
 *   - data/scenes.json    -> 6 个场景配置
 */
(function (global) {
  'use strict';

  // ============ 常量定义 ============
  const MATCHING_DURATION_MS = 600;  // 匹配动画时长
  const STATUS_PENDING = 'pending';
  const STATUS_APPLIED = 'applied';
  const STATUS_APPROVED = 'approved';
  const STATUS_NOT_APPLICABLE = 'not_applicable';

  // 4 状态 tab 中文标签（与 Next.js 一致）
  const TAB_LABELS = ['待申报', '已申报', '已获批', '不适用'];
  // 状态中文名 -> 内部 status 常量
  const TAB_TO_STATUS = {
    '待申报': STATUS_PENDING,
    '已申报': STATUS_APPLIED,
    '已获批': STATUS_APPROVED,
    '不适用': STATUS_NOT_APPLICABLE
  };
  // 内部 status -> 中文名（store 用 pending/applied/approved/not_applicable）
  const STATUS_TO_LABEL = {};
  Object.keys(TAB_TO_STATUS).forEach(function (k) { STATUS_TO_LABEL[TAB_TO_STATUS[k]] = k; });

  // ============ 全局状态：政策数据和场景数据 ============
  let policiesData = [];
  let scenesData = [];
  let dataLoaded = false;

  // ============ 数据加载 ============
  /**
   * 异步加载 policies.json 与 scenes.json
   * 优先使用内联数据（POLICYMATE_DATA），回退到 fetch。
   */
  function loadData() {
    if (dataLoaded) return Promise.resolve();
    if (window.POLICYMATE_DATA) {
      policiesData = window.POLICYMATE_DATA.policies;
      scenesData = window.POLICYMATE_DATA.scenes;
      dataLoaded = true;
      return Promise.resolve();
    }
    return Promise.all([
      fetch('data/policies.json').then(function (r) { if (!r.ok) throw new Error('policies.json ' + r.status); return r.json(); }),
      fetch('data/scenes.json').then(function (r) { if (!r.ok) throw new Error('scenes.json ' + r.status); return r.json(); })
    ]).then(function (results) {
      policiesData = results[0];
      scenesData = results[1];
      dataLoaded = true;
    }).catch(function (err) {
      console.error('Data load error:', err);
      const main = document.getElementById('app-content');
      if (main) {
        main.innerHTML = '<div class="max-w-3xl mx-auto px-4 py-16 text-center"><h2 class="text-xl font-bold text-gray-800 mb-2">政策数据加载失败</h2><p class="text-sm text-gray-500 mb-4">请检查网络连接后重试</p><button class="px-6 py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition" onclick="location.reload()">重新加载</button></div>';
      }
    });
  }

  function getPolicies() { return policiesData; }
  function getScenes() { return scenesData; }
  function getPolicyById(id) {
    return policiesData.find(function (p) { return p.id === id; });
  }

  // ============ 工具函数 ============

  /**
   * 创建 DOM 元素
   * @param {string} tag 标签名
   * @param {Object} attrs 属性对象（class/text/html/data-* 等）
   * @param {Array|Node|null} children 子元素
   */
  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        const v = attrs[k];
        if (k === 'class') node.className = v;
        else if (k === 'text') node.textContent = v;
        else if (k === 'html') node.innerHTML = v;
        else if (k.indexOf('data-') === 0) node.setAttribute(k, v);
        else if (k === 'style' && typeof v === 'object') {
          Object.assign(node.style, v);
        } else if (k.indexOf('on') === 0 && typeof v === 'function') {
          node.addEventListener(k.slice(2).toLowerCase(), v);
        } else node.setAttribute(k, v);
      });
    }
    if (children) {
      if (!Array.isArray(children)) children = [children];
      children.forEach(function (c) {
        if (c == null) return;
        if (typeof c === 'string' || typeof c === 'number') {
          node.appendChild(document.createTextNode(String(c)));
        } else {
          node.appendChild(c);
        }
      });
    }
    return node;
  }

  /**
   * 校验 URL 是否为 gov.cn 域名 + 安全协议
   */
  function validateGovUrl(url) {
    if (!url || typeof url !== 'string') return false;
    if (!/^https?:\/\//i.test(url)) return false;
    if (!/^https?:\/\/[^/]*\.gov\.cn(\/|$)/i.test(url)) return false;
    return true;
  }

  // 类别图标映射（与 Next.js utils.ts CATEGORY_ICONS 一致）
  const CATEGORY_ICONS = {
    '人才补贴': '🏆',
    '创业扶持': '🚀',
    '住房保障': '🏠',
    '就业援助': '💼',
    '税收优惠': '💰',
    '教育资助': '📚',
    '医疗救助': '🏥',
    '养老福利': '🧓',
    '社保公积金': '🛡️',
    '生育育儿': '👶',
    '文旅消费': '🎭',
    '数字便民': '📱'
  };

  function getCategoryIcon(cat) {
    return CATEGORY_ICONS[cat] || '📋';
  }

  /** 计算距截止日期剩余天数 */
  function daysUntil(dateStr) {
    if (!dateStr) return 999;
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 86400000));
  }

  /** 格式化日期为「YYYY年M月D日」 */
  function formatDate(d) {
    if (!d) return '';
    const p = String(d).split('-');
    if (p.length < 3) return d;
    return p[0] + '年' + parseInt(p[1], 10) + '月' + parseInt(p[2], 10) + '日';
  }

  /** 简易金额数字提取（用于同类政策对比条形图） */
  function extractAmount(str) {
    if (!str) return 0;
    const m = String(str).match(/(\d+(?:\.\d+)?)/);
    return m ? parseFloat(m[1]) : 0;
  }

  // ============ 选项常量（与 Next.js / PRD 一致） ============
  const CITY_OPTIONS = ['济南', '青岛', '上海', '北京', '广州', '深圳', '全国'];
  const AGE_OPTIONS = ['18以下', '18-25', '26-35', '36-45', '46-55', '56-65', '65以上'];
  const OCCUPATION_OPTIONS = ['在职', '自由职业', '学生', '退休', '失业', '创业'];
  const INCOME_OPTIONS = ['5万以下', '5-10万', '10-20万', '20-50万', '50万以上'];
  const IDENTITY_OPTIONS = [
    '高校毕业生', '退役军人', '残疾人', '低收入家庭',
    '创业者', '科技人才', '农民工', '单亲家庭'
  ];
  const NEED_TYPE_OPTIONS = [
    '住房', '就业', '创业', '教育', '医疗', '养老',
    '税收', '生育育儿', '社保公积金', '文旅消费', '数字便民', '其他'
  ];

  // ============ PolicyCard 共享组件 ============
  /**
   * 构建政策卡片 DOM（结构 1:1 复刻 Next.js components/PolicyCard.tsx）
   * @param {Object} policy 政策对象
   * @param {Object} opts { matchScore, matchReason, showLevel, onClick }
   */
  function buildPolicyCard(policy, opts) {
    opts = opts || {};
    const score = typeof opts.matchScore === 'number' ? opts.matchScore : 0;
    const reason = opts.matchReason || '';
    const showLevel = !!opts.showLevel;
    const onClick = opts.onClick || function () {};
    const onFavToggle = opts.onFavToggle;

    const fav = PolicyMateStore.isFavorite(policy.id);
    const days = daysUntil(policy.deadline || '');
    const urgent = days <= 30;

    // 截止日颜色：<=7天红色 / <=30天橙色 / >30天灰色
    const deadlineColor = days <= 7 ? 'text-red-600' : days <= 30 ? 'text-orange-500' : 'text-gray-600';
    const deadlineText = days === 0 ? '今日截止' : '⏰ 剩 ' + days + ' 天 截止 ' + (policy.deadline || '');

    // 匹配度等级
    const scoreLevel = score >= 80 ? '高' : score >= 50 ? '中' : '低';
    const scoreColor = score >= 80 ? 'text-green-600' : score >= 50 ? 'text-orange-500' : 'text-gray-600';
    const scoreClassName = 'text-sm font-bold ' + scoreColor;

    // 级别标签
    const levelTag = policy.level === '中央' ? '🏛️ 中央' : policy.level === '地方' ? '📍 地方' : null;

    // 收藏按钮
    const favBtn = el('button', {
      type: 'button',
      class: 'text-xl ml-2 hover:scale-110 transition',
      'aria-label': fav ? '取消收藏' : '收藏政策',
      text: fav ? '⭐' : '☆'
    });
    favBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      e.preventDefault();
      const nowFav = PolicyMateStore.toggleFavorite(policy.id);
      favBtn.textContent = nowFav ? '⭐' : '☆';
      if (typeof onFavToggle === 'function') onFavToggle(nowFav);
    });

    const article = el('article', {
      class: 'bg-white rounded-xl p-4 shadow-sm border border-orange-50 card-hover cursor-pointer',
      tabindex: '0',
      role: 'article',
      'aria-label': '政策：' + policy.name
    }, [
      el('div', { class: 'flex items-start justify-between mb-2' }, [
        el('div', { class: 'flex-1 min-w-0' }, [
          el('div', { class: 'flex items-center gap-2 mb-1' }, [
            el('span', { class: 'text-lg', text: getCategoryIcon(policy.category) }),
            el('span', { class: 'font-medium text-gray-800 text-sm', text: policy.name })
          ]),
          el('div', { class: 'flex items-center gap-2 flex-wrap' }, function () {
            const arr = [];
            if (showLevel && levelTag) {
              arr.push(el('span', { class: 'text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600', text: levelTag }));
            }
            arr.push(el('span', { class: 'text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700', text: policy.category }));
            arr.push(el('span', { class: 'text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600', text: policy.city }));
            if (urgent) {
              arr.push(el('span', { class: 'text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 pulse-dot', text: '即将截止' }));
            }
            return arr;
          }())
        ]),
        favBtn
      ]),
      el('div', { class: 'flex items-end justify-between mt-3' }, [
        el('div', { class: 'flex flex-col min-w-0' }, function () {
          const arr = [];
          if (policy.amount) {
            arr.push(el('span', { class: 'text-xl font-bold text-orange-600 truncate', text: policy.amount }));
          } else {
            arr.push(el('span', { class: 'text-xs text-gray-600', text: '金额待定（咨询当地）' }));
          }
          arr.push(el('span', { class: 'text-xs mt-0.5 ' + deadlineColor, text: deadlineText }));
          return arr;
        }()),
        score > 0 ? el('div', { class: 'flex flex-col items-end shrink-0' }, [
          el('span', { class: 'text-xs text-gray-500', text: '匹配度' }),
          el('div', { class: 'flex items-baseline gap-1' }, [
            el('span', { class: scoreClassName, text: scoreLevel }),
            el('span', { class: scoreClassName, text: score + '%' })
          ])
        ]) : null
      ]),
      // 一句话理由
      reason
        ? el('div', { class: 'text-xs text-gray-500 mt-2 truncate', text: '💡 ' + reason })
        : (policy.updatedAt
            ? el('div', { class: 'text-xs text-gray-600 mt-1', text: '更新于' + String(policy.updatedAt).slice(5).replace('-', '-') })
            : null)
    ]);

    article.addEventListener('click', function (e) {
      if (e.target === favBtn || favBtn.contains(e.target)) return;
      onClick();
    });
    article.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    });

    return article;
  }

  // ============ 首页渲染 ============
  function renderHome(parsed) {
    const container = document.getElementById('app-content');
    container.innerHTML = '';

    const wrap = el('div', { class: 'fade-in' });

    // ----- Hero -----
    wrap.appendChild(el('div', { class: 'hero-bg py-12 px-4' }, [
      el('div', { class: 'max-w-3xl mx-auto text-center' }, [
        el('h1', { class: 'text-3xl md:text-4xl font-bold text-gray-800 mb-3', text: '政策通 PolicyMate' }),
        el('p', { class: 'text-gray-600 text-lg mb-8', text: '一键匹配你能享受的惠民政策，让政策红利不再被闲置' }),
        el('p', { class: 'text-sm text-gray-500 mb-1', text: '选择你的人生事件，快速找到相关政策' })
      ])
    ]));

    // ----- 场景卡片 -----
    wrap.appendChild(el('div', { class: 'max-w-3xl mx-auto px-4 py-6' }, [
      el('h2', { class: 'text-xl font-bold text-gray-800 mb-4 text-center', text: '🎯 你遇到了什么人生事件？' }),
      el('div', { class: 'grid grid-cols-2 md:grid-cols-3 gap-3' },
        scenesData.map(function (scene) {
          const card = el('button', {
            type: 'button',
            class: 'bg-white border-2 border-orange-200 rounded-xl p-4 text-center hover:border-orange-400 hover:shadow-lg transition card-hover'
          }, [
            el('div', { class: 'text-3xl mb-2', text: scene.icon }),
            el('div', { class: 'font-bold text-gray-800 mb-1', text: scene.name }),
            el('div', { class: 'text-xs text-gray-500 leading-snug', text: scene.description })
          ]);
          card.addEventListener('click', function () {
            location.hash = '#/match?scene=' + encodeURIComponent(scene.id);
          });
          return card;
        })
      ),
      // 直接匹配次入口
      el('div', { class: 'text-center mt-4' }, function () {
        const btn = el('button', {
          type: 'button',
          class: 'text-orange-600 hover:text-orange-700 text-sm font-medium underline-offset-2 hover:underline',
          text: '不确定选哪个？直接开始完整匹配 →'
        });
        btn.addEventListener('click', function () { location.hash = '#/match'; });
        return btn;
      }())
    ]));

    // ----- 3 步引导 -----
    const steps = [
      { icon: '📝', title: '填写基本信息', desc: '选择城市、年龄等，让我们了解你' },
      { icon: '🔍', title: '智能匹配政策', desc: '自动筛选你能享受的政策' },
      { icon: '⭐', title: '收藏并申报', desc: '一键收藏，跟踪申报进度' }
    ];
    wrap.appendChild(el('div', { class: 'max-w-3xl mx-auto px-4 py-4' }, [
      el('h2', { class: 'text-xl font-bold text-gray-800 mb-6 text-center', text: '3步找到你的政策' }),
      el('div', { class: 'flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8' },
        steps.map(function (s, i) {
          return el('div', { class: 'flex flex-col md:flex-row items-center' }, [
            el('div', { class: 'flex flex-col items-center text-center flex-1' }, [
              el('div', { class: 'w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-2xl mb-2', text: s.icon }),
              el('p', { class: 'font-medium text-gray-800', text: s.title }),
              el('p', { class: 'text-sm text-gray-500', text: s.desc })
            ]),
            i < 2 ? (function () {
              const frag = el('div', {}, []);
              frag.appendChild(el('div', { class: 'hidden md:block text-orange-500 text-2xl mx-4', text: '→' }));
              frag.appendChild(el('div', { class: 'md:hidden text-orange-500 text-2xl my-2', text: '↓' }));
              return frag;
            })() : null
          ]);
        })
      )
    ]));

    // ----- 热门政策 -----
    const hot = policiesData.slice().sort(function (a, b) {
      return (b.updatedAt || '').localeCompare(a.updatedAt || '');
    }).slice(0, 6);
    wrap.appendChild(el('div', { class: 'max-w-3xl mx-auto px-4 py-4' }, [
      el('h2', { class: 'text-xl font-bold text-gray-800 mb-4', text: '📋 热门政策' }),
      hot.length > 0
        ? el('div', { class: 'grid gap-3' },
            hot.map(function (p) {
              return buildPolicyCard(p, {
                showLevel: true,
                onClick: function () { location.hash = '#/policy/' + encodeURIComponent(p.id); }
              });
            })
          )
        : el('p', { class: 'text-center text-gray-600 py-8', text: '暂无热门政策' })
    ]));

    // ----- 热线 + 免责声明 -----
    wrap.appendChild(el('div', { class: 'max-w-3xl mx-auto px-4 py-6 text-center' }, [
      el('div', { class: 'bg-orange-50 rounded-xl p-4 mb-4' }, [
        el('p', { class: 'text-sm text-gray-600' }, [
          document.createTextNode('📞 政策咨询热线：'),
          (function () {
            const a = el('a', { class: 'text-orange-700 font-medium hover:underline', href: 'tel:12333', text: '12333' });
            return a;
          })(),
          document.createTextNode('（全国人力资源和社会保障服务热线）')
        ])
      ]),
      el('p', { class: 'text-xs text-gray-600 mb-2', text: '📅 政策数据最近更新于2026年06月20日，我们会持续更新' }),
      el('p', { class: 'text-xs text-gray-600', text: '⚠️ 免责声明：本应用提供的政策信息仅供参考，基于公开政府信息整理，不保证信息的完整性和时效性。具体政策以政府部门官方发布为准，申报前请务必核实最新政策要求。本应用不承担因使用本信息导致的任何损失。' })
    ]));

    container.appendChild(wrap);
  }

  // ============ 表单页渲染（4 步渐进式） ============
  function renderForm(parsed) {
    const container = document.getElementById('app-content');
    container.innerHTML = '';

    // 解析场景预填
    const sceneId = parsed.query.scene;
    const scene = sceneId ? scenesData.find(function (s) { return s.id === sceneId; }) : null;
    const prefill = scene ? scene.prefill : {};

    // 当前画像（可作为默认值）
    const cur = PolicyMateStore.getCurrentProfile();

    // 表单状态
    const state = {
      step: 0,
      totalSteps: 4,
      formData: {
        city: prefill.city || (cur && cur.city) || '',
        ageRange: prefill.ageRange || (cur && cur.ageRange) || '',
        occupation: (cur && cur.occupation) || '',
        incomeRange: prefill.incomeRange || (cur && cur.incomeRange) || '',
        identity: (prefill.identity || (cur && cur.identity) || []).slice(),
        needTypes: (prefill.needType || (cur && cur.needTypes) || []).slice()
      }
    };

    const wrap = el('div', { class: 'max-w-lg mx-auto px-4 py-8 fade-in' });

    // 返回首页
    const backBtn = el('button', {
      type: 'button',
      class: 'text-sm text-gray-500 hover:text-orange-700 mb-4 inline-flex items-center gap-1',
      text: '← 返回首页'
    });
    backBtn.addEventListener('click', function () { location.hash = '#/'; });
    wrap.appendChild(backBtn);

    // 游客模式提示条
    wrap.appendChild(el('div', { class: 'mb-3 px-3 py-2 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-between gap-2' }, [
      el('span', { class: 'text-xs text-orange-700 flex items-center gap-1', text: '👤 游客模式：画像仅保存在本机，登录后可同步至云端' }),
      (function () {
        const a = el('a', { class: 'text-xs text-orange-700 font-medium hover:underline whitespace-nowrap', href: '#/match', text: '去登录 →' });
        return a;
      })()
    ]));

    // 主表单卡片
    const card = el('div', { class: 'bg-white rounded-2xl shadow-sm border border-orange-50 p-6' });
    wrap.appendChild(card);

    // 标题区
    card.appendChild(el('div', { class: 'text-center mb-2' }, [
      el('h2', { class: 'font-bold text-xl text-gray-800', text: '🔍 开始匹配' }),
      el('p', { class: 'text-sm text-gray-500 mt-1', text: '4步完善画像，匹配更精准' })
    ]));

    // 进度条
    const progressTrack = el('div', { class: 'h-2 bg-orange-100 rounded-full overflow-hidden' });
    const progressFill = el('div', { class: 'h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full step-bar-fill' });
    progressTrack.appendChild(progressFill);
    const progressText = el('span', { class: 'text-xs text-orange-500 font-medium', text: '0%' });
    const stepLabel = el('span', { class: 'text-xs text-gray-600', text: '步骤 1/4' });
    card.appendChild(el('div', { class: 'mb-6' }, [
      el('div', { class: 'flex items-center justify-between mb-1' }, [stepLabel, progressText]),
      progressTrack
    ]));

    // 步骤内容容器
    const stepBox = el('div', {});
    card.appendChild(stepBox);

    // 底部按钮区
    const navBox = el('div', { class: 'flex justify-between mt-6' });
    card.appendChild(navBox);

    // 错误提示
    const errBox = el('div', {
      class: 'mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700',
      style: { display: 'none' }
    });
    card.appendChild(errBox);

    function showError(msg) {
      errBox.textContent = msg;
      errBox.style.display = msg ? 'block' : 'none';
    }

    function updateProgress() {
      const progress = Math.round((state.step / state.totalSteps) * 100);
      stepLabel.textContent = '步骤 ' + (state.step + 1) + '/' + state.totalSteps;
      progressText.textContent = progress + '%';
      progressFill.style.width = progress + '%';
    }

    // ----- 标签按钮工厂 -----
    function tagBtn(label, isActive, onClick) {
      const cls = 'tag-btn px-4 py-3 rounded-xl border-2 font-medium transition ' +
        (isActive ? 'active border-orange-500' : 'border-gray-200');
      const b = el('button', { type: 'button', class: cls, text: label });
      b.addEventListener('click', onClick);
      return b;
    }
    function tagBtnSm(label, isActive, onClick) {
      const cls = 'tag-btn px-3 py-2 rounded-lg border-2 text-sm font-medium transition ' +
        (isActive ? 'active border-orange-500' : 'border-gray-200');
      const b = el('button', { type: 'button', class: cls, text: label });
      b.addEventListener('click', onClick);
      return b;
    }

    // ----- 渲染步骤内容 -----
    function renderStep() {
      stepBox.innerHTML = '';
      const fd = state.formData;
      let content;
      if (state.step === 0) {
        // 基本信息：城市 + 年龄段
        content = el('div', {}, [
          el('h3', { class: 'font-bold text-lg text-gray-800 mb-1', text: '基本信息' }),
          el('p', { class: 'text-sm text-gray-500 mb-4', text: '选择你所在的城市和年龄段' }),
          el('div', { class: 'mb-4' }, [
            el('div', { class: 'flex items-center justify-between mb-2' }, [
              el('span', { class: 'text-sm font-medium text-gray-700', text: '所在城市' })
            ]),
            el('div', { class: 'grid grid-cols-3 gap-3' },
              CITY_OPTIONS.map(function (c) {
                return tagBtn(c, fd.city === c, function () { state.formData.city = c; renderStep(); });
              })
            )
          ]),
          el('div', {}, [
            el('div', { class: 'flex items-center justify-between mb-2' }, [
              el('span', { class: 'text-sm font-medium text-gray-700', text: '年龄段' })
            ]),
            el('div', { class: 'grid grid-cols-2 gap-2' },
              AGE_OPTIONS.map(function (a) {
                return tagBtnSm(a, fd.ageRange === a, function () { state.formData.ageRange = a; renderStep(); });
              })
            )
          ])
        ]);
      } else if (state.step === 1) {
        // 职业与收入
        content = el('div', {}, [
          el('h3', { class: 'font-bold text-lg text-gray-800 mb-1', text: '职业与收入' }),
          el('p', { class: 'text-sm text-gray-500 mb-4', text: '不同职业和收入水平可享受的政策不同' }),
          el('div', { class: 'mb-4' }, [
            el('div', { class: 'flex items-center justify-between mb-2' }, [
              el('span', { class: 'text-sm font-medium text-gray-700', text: '职业类型' })
            ]),
            el('div', { class: 'grid grid-cols-3 gap-2' },
              OCCUPATION_OPTIONS.map(function (o) {
                return tagBtnSm(o, fd.occupation === o, function () { state.formData.occupation = o; renderStep(); });
              })
            )
          ]),
          el('div', {}, [
            el('div', { class: 'flex items-center justify-between mb-2' }, [
              el('span', { class: 'text-sm font-medium text-gray-700' }, [
                document.createTextNode('收入区间 '),
                (function () {
                  const tip = el('span', { class: 'tip-trigger text-gray-600' }, [
                    document.createTextNode('ℹ️'),
                    el('span', { class: 'tip-content', text: '含税前年薪，不同收入可享受的政策不同' })
                  ]);
                  return tip;
                })()
              ])
            ]),
            el('div', { class: 'grid grid-cols-2 gap-2' },
              INCOME_OPTIONS.map(function (i) {
                return tagBtnSm(i, fd.incomeRange === i, function () { state.formData.incomeRange = i; renderStep(); });
              })
            )
          ])
        ]);
      } else if (state.step === 2) {
        // 特殊身份
        content = el('div', {}, [
          el('h3', { class: 'font-bold text-lg text-gray-800 mb-1', text: '特殊身份' }),
          el('p', { class: 'text-sm text-gray-500 mb-4', text: '可多选，部分政策面向特定身份人群' }),
          el('div', { class: 'flex flex-wrap gap-2' },
            IDENTITY_OPTIONS.map(function (i) {
              const isActive = fd.identity.indexOf(i) !== -1;
              return tagBtnSm(i, isActive, function () {
                const idx = state.formData.identity.indexOf(i);
                if (idx >= 0) state.formData.identity.splice(idx, 1);
                else state.formData.identity.push(i);
                renderStep();
              });
            })
          )
        ]);
      } else {
        // 家庭与需求
        content = el('div', {}, [
          el('h3', { class: 'font-bold text-lg text-gray-800 mb-1', text: '家庭与需求' }),
          el('p', { class: 'text-sm text-gray-500 mb-4', text: '告诉我们你的家庭情况和当前需求' }),
          el('div', { class: 'mb-4' }, [
            el('div', { class: 'flex items-center justify-between mb-2' }, [
              el('span', { class: 'text-sm font-medium text-gray-700', text: '当前需求（可多选）' })
            ]),
            el('div', { class: 'flex flex-wrap gap-2' },
              NEED_TYPE_OPTIONS.map(function (n) {
                const isActive = fd.needTypes.indexOf(n) !== -1;
                return tagBtnSm(n, isActive, function () {
                  const idx = state.formData.needTypes.indexOf(n);
                  if (idx >= 0) state.formData.needTypes.splice(idx, 1);
                  else state.formData.needTypes.push(n);
                  renderStep();
                });
              })
            )
          ]),
          (function () {
            const btn = el('button', {
              type: 'button',
              class: 'mt-4 w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold text-lg hover:shadow-lg transition',
              text: '🔍 匹配政策'
            });
            btn.addEventListener('click', handleSubmit);
            return btn;
          })()
        ]);
      }
      stepBox.appendChild(content);

      // 底部按钮
      navBox.innerHTML = '';
      if (state.step > 0) {
        const prev = el('button', {
          type: 'button',
          class: 'px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition',
          text: '← 上一步'
        });
        prev.addEventListener('click', function () { state.step--; updateProgress(); renderStep(); });
        navBox.appendChild(prev);
      } else {
        navBox.appendChild(el('div', {}));
      }
      if (state.step < state.totalSteps - 1) {
        const next = el('button', {
          type: 'button',
          class: 'px-6 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition',
          text: '下一步 →'
        });
        next.addEventListener('click', function () { state.step++; updateProgress(); renderStep(); });
        navBox.appendChild(next);
      }

      updateProgress();
    }

    // ----- 提交匹配 -----
    function handleSubmit() {
      const fd = state.formData;
      const profile = {
        city: fd.city || '',
        ageRange: fd.ageRange || '',
        occupation: fd.occupation || '',
        incomeRange: fd.incomeRange || '',
        identity: (fd.identity || []).slice(),
        needTypes: (fd.needTypes || []).slice()
      };
      const filled = PolicyMateMatcher.countFilledFields(profile);
      if (filled < 1) {
        showError('请至少填写 1 个字段再进行匹配');
        return;
      }
      showError('');
      PolicyMateStore.saveProfile(profile);
      const results = PolicyMateMatcher.matchPolicies(profile, policiesData);
      PolicyMateStore.saveMatchResults(
        results.results,
        results.recommendations,
        profile,
        results.confidence
      );
      location.hash = '#/matching';
    }

    renderStep();
    container.appendChild(wrap);
  }

  // ============ 匹配加载页渲染 ============
  function renderMatching(parsed) {
    const container = document.getElementById('app-content');
    container.innerHTML = '';

    const wrap = el('div', { class: 'max-w-lg mx-auto px-4 py-8 fade-in' }, [
      el('div', { class: 'match-loading' }, [
        el('h1', { class: 'sr-only', text: '完善你的画像' }),
        el('div', { class: 'match-loading-icon', text: '📋' }),
        el('p', { class: 'mt-4 text-lg font-medium text-gray-700', text: '正在为你匹配政策...' }),
        el('div', { class: 'match-loading-dots mt-2' }, [
          el('span', {}),
          el('span', {}),
          el('span', {})
        ])
      ])
    ]);
    container.appendChild(wrap);

    // 匹配动画结束后跳转结果页
    setTimeout(function () {
      location.hash = '#/results';
    }, MATCHING_DURATION_MS);
  }

  // ============ 结果页渲染 ============
  function renderResults(parsed) {
    const container = document.getElementById('app-content');
    container.innerHTML = '';

    const data = PolicyMateStore.getMatchResults();

    // ----- 空状态 -----
    if (!data || !data.results || data.results.length === 0) {
      container.appendChild(el('div', { class: 'max-w-3xl mx-auto px-4 py-8 text-center fade-in' }, [
        el('h1', { class: 'sr-only', text: '匹配结果' }),
        el('div', { class: 'text-6xl mb-4', text: '🔍' }),
        el('h2', { class: 'text-xl font-bold text-gray-800 mb-2', text: '未找到匹配的政策' }),
        el('p', { class: 'text-gray-500 mb-6', text: '试试放宽条件，可能会有更多结果' }),
        el('div', { class: 'flex flex-col sm:flex-row gap-3 justify-center' }, [
          (function () {
            const b = el('button', {
              type: 'button',
              class: 'px-6 py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition',
              text: '试试放宽条件'
            });
            b.addEventListener('click', function () { location.hash = '#/match'; });
            return b;
          })(),
          el('a', { class: 'px-6 py-2 text-orange-700 font-medium hover:underline inline-flex items-center justify-center', href: '#/match', text: '重新填写画像 →' })
        ])
      ]));
      return;
    }

    const results = data.results;
    const recommendations = data.recommendations || [];
    const urgentPolicy = results.find(function (r) { return daysUntil(r.policy.deadline || '') <= 30; });
    const categories = [];
    results.forEach(function (r) {
      if (categories.indexOf(r.policy.category) === -1) categories.push(r.policy.category);
    });

    // 当前筛选与排序状态
    const state = { selectedCategory: '', sortBy: 'score' };

    const wrap = el('div', { class: 'max-w-3xl mx-auto px-4 py-8 fade-in' });
    wrap.appendChild(el('h1', { class: 'sr-only', text: '匹配结果' }));

    // 返回按钮
    const backBtn = el('button', {
      type: 'button',
      class: 'text-sm text-gray-500 hover:text-orange-700 mb-4 inline-flex items-center gap-1',
      text: '← 返回首页'
    });
    backBtn.addEventListener('click', function () { location.hash = '#/'; });
    wrap.appendChild(backBtn);

    // 摘要卡片
    const summaryParts = [
      document.createTextNode('为你找到 '),
      el('span', { class: 'text-orange-700 font-bold', text: String(results.length) }),
      document.createTextNode(' 条政策，其中 '),
      el('span', { class: 'text-green-600 font-bold', text: String(results.filter(function (r) { return r.score >= 80; }).length) }),
      document.createTextNode(' 条高度匹配')
    ];
    if (urgentPolicy) {
      summaryParts.push(document.createTextNode('，最快 '));
      summaryParts.push(el('span', { class: 'text-red-500 font-bold', text: String(daysUntil(urgentPolicy.policy.deadline || '')) + '天' }));
      summaryParts.push(document.createTextNode(' 后截止的是「' + urgentPolicy.policy.name + '」'));
    }
    wrap.appendChild(el('div', { class: 'bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4 mb-6' }, [
      el('h2', { class: 'font-bold text-lg text-gray-800 mb-1', text: '为你解读' }),
      el('p', { class: 'text-sm text-gray-600' }, summaryParts)
    ]));

    // 类别筛选
    const filterBox = el('div', { class: 'flex flex-wrap gap-2 mb-4' });
    filterBox.appendChild((function () {
      const b = el('button', {
        type: 'button',
        class: 'tag-btn px-3 py-1.5 rounded-full border text-xs font-medium active border-orange-500',
        text: '全部'
      });
      b.addEventListener('click', function () { state.selectedCategory = ''; rerenderList(); refreshCategoryBtns(); });
      return b;
    })());
    const categoryBtns = categories.map(function (c) {
      const b = el('button', {
        type: 'button',
        class: 'tag-btn px-3 py-1.5 rounded-full border text-xs font-medium border-gray-200 text-gray-600 hover:border-orange-400',
        text: getCategoryIcon(c) + ' ' + c
      });
      b.addEventListener('click', function () { state.selectedCategory = c; rerenderList(); refreshCategoryBtns(); });
      return b;
    });
    categoryBtns.forEach(function (b) { filterBox.appendChild(b); });
    wrap.appendChild(filterBox);

    function refreshCategoryBtns() {
      const allBtns = filterBox.querySelectorAll('button');
      allBtns.forEach(function (b, i) {
        if (i === 0) {
          // 全部
          b.className = state.selectedCategory === ''
            ? 'tag-btn px-3 py-1.5 rounded-full border text-xs font-medium active border-orange-500'
            : 'tag-btn px-3 py-1.5 rounded-full border text-xs font-medium border-gray-200 text-gray-600 hover:border-orange-400';
        } else {
          const c = categories[i - 1];
          b.className = state.selectedCategory === c
            ? 'tag-btn px-3 py-1.5 rounded-full border text-xs font-medium active border-orange-500'
            : 'tag-btn px-3 py-1.5 rounded-full border text-xs font-medium border-gray-200 text-gray-600 hover:border-orange-400';
        }
      });
    }

    // 排序切换
    const sortBox = el('div', { class: 'flex items-center gap-2 mb-4' }, [
      el('span', { class: 'text-xs text-gray-500', text: '排序：' }),
      (function () {
        const b = el('button', {
          type: 'button',
          class: 'px-3 py-1.5 rounded-full text-xs font-medium border transition bg-orange-500 text-white border-orange-500',
          text: '按匹配度'
        });
        b.addEventListener('click', function () { state.sortBy = 'score'; refreshSortBtns(); rerenderList(); });
        return b;
      })(),
      (function () {
        const b = el('button', {
          type: 'button',
          class: 'px-3 py-1.5 rounded-full text-xs font-medium border transition border-gray-200 text-gray-600 hover:border-red-400',
          text: '按紧迫度'
        });
        b.addEventListener('click', function () { state.sortBy = 'urgent'; refreshSortBtns(); rerenderList(); });
        return b;
      })()
    ]);
    const sortHint = el('span', { class: 'text-xs text-red-500', text: '', style: { display: 'none' } });
    sortBox.appendChild(sortHint);
    wrap.appendChild(sortBox);

    function refreshSortBtns() {
      const btns = sortBox.querySelectorAll('button');
      const scoreBtn = btns[0];
      const urgentBtn = btns[1];
      if (state.sortBy === 'score') {
        scoreBtn.className = 'px-3 py-1.5 rounded-full text-xs font-medium border transition bg-orange-500 text-white border-orange-500';
        urgentBtn.className = 'px-3 py-1.5 rounded-full text-xs font-medium border transition border-gray-200 text-gray-600 hover:border-red-400';
        sortHint.style.display = 'none';
      } else {
        scoreBtn.className = 'px-3 py-1.5 rounded-full text-xs font-medium border transition border-gray-200 text-gray-600 hover:border-orange-400';
        urgentBtn.className = 'px-3 py-1.5 rounded-full text-xs font-medium border transition bg-red-500 text-white border-red-500';
        sortHint.textContent = '即将截止排前';
        sortHint.style.display = 'inline';
      }
    }

    // 结果列表容器
    const listBox = el('div', { class: 'grid gap-3' });
    wrap.appendChild(listBox);

    function rerenderList() {
      listBox.innerHTML = '';
      const filtered = state.selectedCategory
        ? results.filter(function (r) { return r.policy.category === state.selectedCategory; })
        : results;
      if (filtered.length === 0) {
        listBox.appendChild(el('div', { class: 'text-center py-12' }, [
          el('div', { class: 'text-5xl mb-3', text: '🗂️' }),
          el('h3', { class: 'text-lg font-bold text-gray-800 mb-2', text: '当前筛选条件下无政策' }),
          el('p', { class: 'text-sm text-gray-500 mb-4', text: '试试清除筛选，查看全部匹配结果' }),
          (function () {
            const b = el('button', {
              type: 'button',
              class: 'px-5 py-2 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 transition',
              text: '清除筛选'
            });
            b.addEventListener('click', function () { state.selectedCategory = ''; rerenderList(); refreshCategoryBtns(); });
            return b;
          })()
        ]));
        return;
      }
      const sorted = filtered.slice().sort(function (a, b) {
        if (state.sortBy === 'urgent') {
          return daysUntil(a.policy.deadline || '') - daysUntil(b.policy.deadline || '');
        }
        return b.score - a.score;
      });
      sorted.forEach(function (r) {
        listBox.appendChild(buildPolicyCard(r.policy, {
          matchScore: r.score,
          matchReason: r.reason,
          showLevel: true,
          onClick: function () { location.hash = '#/policy/' + encodeURIComponent(r.policy.id); }
        }));
      });
    }
    rerenderList();

    // 推荐区
    if (recommendations.length > 0) {
      wrap.appendChild(el('div', { class: 'mt-8' }, [
        el('h2', { class: 'text-xl font-bold text-gray-800 mb-4', text: '💡 你可能还关心' }),
        el('div', { class: 'grid gap-3' },
          recommendations.map(function (r) {
            return buildPolicyCard(r.policy, {
              matchReason: r.reason,
              showLevel: true,
              onClick: function () { location.hash = '#/policy/' + encodeURIComponent(r.policy.id); }
            });
          })
        )
      ]));
    }

    container.appendChild(wrap);
  }

  // ============ 详情页渲染 ============
  function renderDetail(parsed) {
    // 清理旧的 JSON-LD
    document.querySelectorAll('script[type="application/ld+json"]').forEach(function (s) { s.remove(); });

    const container = document.getElementById('app-content');
    container.innerHTML = '';

    const policyId = parsed.param;
    const policy = getPolicyById(policyId);
    if (!policy) {
      container.appendChild(el('div', { class: 'max-w-3xl mx-auto px-4 py-16 text-center fade-in' }, [
        el('h2', { class: 'text-xl font-bold text-gray-800 mb-2', text: '政策不存在' }),
        el('p', { class: 'text-sm text-gray-500 mb-4', text: '该政策可能已下线或链接错误' }),
        (function () {
          const b = el('button', {
            type: 'button',
            class: 'px-6 py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition',
            text: '返回首页'
          });
          b.addEventListener('click', function () { location.hash = '#/'; });
          return b;
        })()
      ]));
      return;
    }

    const hasResults = PolicyMateStore.getMatchResults();
    const cur = PolicyMateStore.getCurrentProfile();
    const days = daysUntil(policy.deadline);
    const fav = PolicyMateStore.isFavorite(policy.id);
    const listSt = PolicyMateStore.getListStatus(policy.id);
    const listStLabel = listSt ? STATUS_TO_LABEL[listSt] : null;

    // 匹配度（如果结果中包含该政策）
    let matchScore = 0;
    let matchReason = '';
    if (hasResults && hasResults.results) {
      for (let i = 0; i < hasResults.results.length; i++) {
        if (hasResults.results[i].policy && hasResults.results[i].policy.id === policy.id) {
          matchScore = hasResults.results[i].score;
          matchReason = hasResults.results[i].reason || '';
          break;
        }
      }
    }

    const wrap = el('div', { class: 'max-w-3xl mx-auto px-4 py-8 fade-in' });

    // 返回按钮
    const backBtn = el('button', {
      type: 'button',
      class: 'text-sm text-gray-500 hover:text-orange-700 mb-4 inline-flex items-center gap-1',
      text: '← 返回'
    });
    backBtn.addEventListener('click', function () {
      location.hash = hasResults ? '#/results' : '#/';
    });
    wrap.appendChild(backBtn);

    // ----- 头部卡片 -----
    const levelTag = policy.level === '中央' ? '🏛️ 中央' : policy.level === '地方' ? '📍 地方' : null;
    const headerCard = el('div', { class: 'bg-white rounded-2xl shadow-sm border border-orange-50 p-6 mb-4' });

    // 收藏按钮
    const favBtn = el('button', {
      type: 'button',
      class: 'text-2xl hover:scale-110 transition',
      text: fav ? '⭐' : '☆',
      'aria-label': fav ? '取消收藏' : '收藏政策'
    });
    favBtn.addEventListener('click', function () {
      const nowFav = PolicyMateStore.toggleFavorite(policy.id);
      favBtn.textContent = nowFav ? '⭐' : '☆';
    });

    headerCard.appendChild(el('div', { class: 'flex items-start justify-between mb-3' }, [
      el('div', {}, [
        el('div', { class: 'flex items-center gap-2 mb-1' }, [
          el('span', { class: 'text-2xl', text: getCategoryIcon(policy.category) }),
          el('h1', { class: 'text-xl font-bold text-gray-800', text: policy.name })
        ]),
        el('div', { class: 'flex items-center gap-2 flex-wrap mt-1' }, function () {
          const arr = [];
          if (levelTag) arr.push(el('span', { class: 'text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600', text: levelTag }));
          arr.push(el('span', { class: 'text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700', text: policy.category }));
          arr.push(el('span', { class: 'text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600', text: policy.city }));
          if (matchScore > 0) {
            const cls = matchScore >= 80 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700';
            arr.push(el('span', { class: 'text-xs px-2 py-0.5 rounded-full ' + cls, text: '匹配度 ' + matchScore + '%' }));
          }
          return arr;
        }())
      ]),
      favBtn
    ]));

    // 金额高亮区
    headerCard.appendChild(el('div', { class: 'bg-orange-50 rounded-xl p-4 mt-3' }, [
      el('p', { class: 'text-orange-700 font-bold text-lg mb-1', text: policy.amount || '金额待定（咨询当地）' }),
      el('p', { class: 'text-sm text-gray-600', text: policy.summary || '' })
    ]));

    // 来源信息
    headerCard.appendChild(el('div', { class: 'flex items-center gap-2 mt-3 flex-wrap' }, [
      el('span', { class: 'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium', text: '🏛 政府官方来源' }),
      el('span', { class: 'text-xs text-gray-500', text: '来源：' + (policy.source || '-') + ' | 数据更新于' + formatDate(policy.updatedAt) }),
      el('span', { class: 'inline-flex items-center gap-1 text-xs text-gray-600', text: '👁 暂无查看' })
    ]));
    // 截止日期
    headerCard.appendChild(el('div', { class: 'flex items-center justify-between mt-2 text-sm text-gray-500' }, [
      el('span', {}),
      el('span', { class: days <= 30 ? 'text-red-500 font-medium' : '', text: '截止：' + (policy.deadline || '长期有效') + (days <= 30 ? ' (剩余' + days + '天)' : '') })
    ]));
    wrap.appendChild(headerCard);

    // ----- 大白话解读卡片 -----
    const ps = policy.plainSummary || {};
    const summarySegments = [
      { key: 'whoCanApply', icon: '👤', title: '谁能申请', text: ps.whoCanApply || '', color: 'text-blue-500' },
      { key: 'whatYouGet', icon: '💰', title: '能拿多少', text: ps.whatYouGet || ps.youCanGet || '', color: 'text-green-500' },
      { key: 'howToApply', icon: '📋', title: '怎么申请', text: ps.howToApply || '', color: 'text-orange-500' },
      { key: 'whenDeadline', icon: '⏰', title: '啥时候截止', text: ps.whenDeadline || (policy.deadline ? '' + policy.deadline + (days <= 30 ? '（剩余' + days + '天）' : '') : ''), color: 'text-red-500' },
      { key: 'whoToContact', icon: '📞', title: '联系谁', text: ps.whoToContact || (policy.source ? '咨询电话：12333；办理点：' + policy.source : ''), color: 'text-purple-500' }
    ].filter(function (s) { return s.text; });

    if (summarySegments.length > 0) {
      const plainCard = el('div', { class: 'bg-white rounded-2xl shadow-sm border border-orange-50 p-6 mb-4' }, [
        el('div', { class: 'flex items-center justify-between mb-3' }, [
          el('h2', { class: 'font-bold text-lg text-gray-800', text: '💬 大白话解读' }),
          (function () {
            // 朗读按钮
            const b = el('button', {
              type: 'button',
              class: 'px-3 py-1.5 text-sm text-orange-700 bg-orange-50 rounded-lg hover:bg-orange-100 transition',
              text: '🔊 朗读'
            });
            b.addEventListener('click', function () {
              if (global.PolicyMateA11y && typeof global.PolicyMateA11y.speakPolicySummary === 'function') {
                global.PolicyMateA11y.speakPolicySummary(ps);
              } else if ('speechSynthesis' in window) {
                const text = summarySegments.map(function (s) { return s.title + '：' + s.text; }).join('。');
                try { global.speechSynthesis.cancel(); global.speechSynthesis.speak(new SpeechSynthesisUtterance(text)); } catch (e) {}
              }
            });
            return b;
          })()
        ])
      ]);
      const segBox = el('div', { class: 'grid grid-cols-1 gap-2' });
      summarySegments.forEach(function (seg) {
        const canExpand = seg.text.length > 50;
        const item = el('div', { class: 'border border-gray-100 rounded-xl p-3 hover:bg-orange-50/30 transition' });
        const btn = el('button', {
          type: 'button',
          class: 'flex items-start gap-2 w-full text-left ' + (canExpand ? 'cursor-pointer' : 'cursor-default')
        }, [
          el('span', { class: 'mt-0.5 ' + seg.color, text: seg.icon }),
          el('div', { class: 'flex-1 min-w-0' }, [
            el('div', { class: 'flex items-center gap-2' }, [
              el('span', { class: 'font-medium text-gray-700 text-sm', text: seg.title }),
              canExpand ? el('span', { class: 'text-xs text-gray-600', text: '▼' }) : null
            ]),
            el('p', { class: 'text-sm text-gray-600 mt-0.5 ' + (canExpand ? 'line-clamp-1' : ''), text: seg.text })
          ])
        ]);
        const detailBox = el('div', { class: 'mt-2 ml-7', style: { display: 'none' } });
        if (canExpand) {
          btn.addEventListener('click', function () {
            const isOpen = detailBox.style.display === 'block';
            detailBox.style.display = isOpen ? 'none' : 'block';
            const arrow = btn.querySelector('.text-xs.text-gray-600');
            if (arrow) arrow.textContent = isOpen ? '▼' : '▲';
            const p = btn.querySelector('p');
            if (p) p.className = 'text-sm text-gray-600 mt-0.5 ' + (isOpen ? 'line-clamp-1' : '');
          });
          // 政策原文链接（whoToContact 段附加）
          if (seg.key === 'whoToContact' && policy.docUrl) {
            if (validateGovUrl(policy.docUrl)) {
              detailBox.appendChild(el('a', {
                href: policy.docUrl,
                target: '_blank',
                rel: 'noopener noreferrer',
                class: 'text-xs text-blue-500 hover:underline',
                text: '查看办理点详情 ↗'
              }));
            } else {
              detailBox.appendChild(el('span', {
                class: 'text-xs text-gray-600',
                title: '该链接非政府官方网站，已禁用跳转',
                text: '⚠️ 非官方来源，已禁用跳转'
              }));
            }
          }
        }
        item.appendChild(btn);
        item.appendChild(detailBox);
        segBox.appendChild(item);
      });
      plainCard.appendChild(segBox);
      wrap.appendChild(plainCard);
    }

    // ----- 政策原文卡片 -----
    if ((policy.keyClauses && policy.keyClauses.length > 0) || policy.docUrl) {
      const docCard = el('div', { class: 'bg-white rounded-2xl shadow-sm border border-orange-50 p-6 mb-4' }, [
        el('h2', { class: 'font-bold text-lg text-gray-800 mb-3', text: '📄 政策原文' })
      ]);
      if (policy.keyClauses && policy.keyClauses.length > 0) {
        docCard.appendChild(el('ul', { class: 'space-y-2 mb-3' },
          policy.keyClauses.map(function (clause) {
            return el('li', { class: 'text-sm text-gray-600 flex items-start gap-2' }, [
              el('span', { class: 'text-orange-400 mt-0.5', text: '•' }),
              el('span', { text: clause })
            ]);
          })
        ));
      }
      if (policy.docUrl && validateGovUrl(policy.docUrl)) {
        docCard.appendChild(el('a', {
          href: policy.docUrl,
          target: '_blank',
          rel: 'noopener noreferrer',
          class: 'inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition text-sm shadow-sm',
          text: '查看政策原文 ↗'
        }));
      } else if (policy.docUrl) {
        docCard.appendChild(el('span', {
          class: 'inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-medium text-sm cursor-not-allowed',
          title: '该链接非政府官方网站，已禁用跳转',
          text: '⚠️ 非官方来源，已禁用跳转'
        }));
      }
      wrap.appendChild(docCard);
    }

    // ----- 申报条件卡片（三态可视化）-----
    const condCard = el('div', { class: 'bg-white rounded-2xl shadow-sm border border-orange-50 p-6 mb-4' }, [
      el('h2', { class: 'font-bold text-lg text-gray-800 mb-3', text: '📋 申报条件' })
    ]);
    const condBox = el('div', { class: 'space-y-2' });
    const conds = policy.conditions || {};
    const notApplicableKeys = Array.isArray(conds.notApplicable) ? conds.notApplicable : [];

    function renderCondRow(key, label, values, satisfied, notApplicable) {
      const stateStr = notApplicable ? 'notApplicable' : satisfied ? 'satisfied' : 'missing';
      const icon = stateStr === 'satisfied' ? '✅' : stateStr === 'missing' ? '❌' : '⚪';
      const iconColor = stateStr === 'satisfied' ? 'text-green-500' : stateStr === 'missing' ? 'text-red-400' : 'text-gray-600';
      const rowClass = stateStr === 'notApplicable' ? 'text-sm text-gray-600 line-through' : 'text-sm text-gray-700';
      const row = el('div', { class: 'flex flex-col gap-1' }, [
        el('div', { class: 'flex items-center gap-2' }, [
          el('span', { class: iconColor, text: icon }),
          el('span', { class: rowClass }, function () {
            const arr = [document.createTextNode(label + '：' + values.join(' / '))];
            if (stateStr === 'notApplicable') {
              arr.push(el('span', { class: 'ml-1 text-xs text-gray-600', text: '（不适用）' }));
            }
            return arr;
          }())
        ])
      ]);
      return row;
    }

    if (conds.ageRange && conds.ageRange.length > 0) {
      condBox.appendChild(renderCondRow('ageRange', '年龄段', conds.ageRange,
        !!(cur && cur.ageRange && conds.ageRange.indexOf(cur.ageRange) !== -1),
        notApplicableKeys.indexOf('ageRange') !== -1));
    }
    if (conds.identity && conds.identity.length > 0) {
      condBox.appendChild(renderCondRow('identity', '身份要求', conds.identity,
        !!(cur && cur.identity && cur.identity.some(function (i) { return conds.identity.indexOf(i) !== -1; })),
        notApplicableKeys.indexOf('identity') !== -1));
    }
    if (conds.incomeRange && conds.incomeRange.length > 0) {
      condBox.appendChild(renderCondRow('incomeRange', '收入区间', conds.incomeRange,
        !!(cur && cur.incomeRange && conds.incomeRange.indexOf(cur.incomeRange) !== -1),
        notApplicableKeys.indexOf('incomeRange') !== -1));
    }
    if (conds.needType && conds.needType.length > 0) {
      condBox.appendChild(renderCondRow('needType', '需求类型', conds.needType,
        !!(cur && cur.needTypes && cur.needTypes.some(function (n) { return conds.needType.indexOf(n) !== -1; })),
        notApplicableKeys.indexOf('needType') !== -1));
    }
    condCard.appendChild(condBox);

    // 缺失条件提示
    if (cur && matchReason && matchReason.indexOf('该政策') === 0) {
      // 简易缺失提示
    }
    wrap.appendChild(condCard);

    // ----- 申报流程卡片 -----
    if (policy.steps && policy.steps.length) {
      const stepsCard = el('div', { class: 'bg-white rounded-2xl shadow-sm border border-orange-50 p-6 mb-4' }, [
        el('h2', { class: 'font-bold text-lg text-gray-800 mb-3', text: '📝 申报流程' })
      ]);
      const stepsBox = el('div', {});
      policy.steps.forEach(function (s, i) {
        const time = (policy.stepTimes && policy.stepTimes[i]) ? policy.stepTimes[i] : '';
        const node = el('div', { class: 'timeline-node' }, [
          el('div', { class: 'node-dot', text: String(i + 1) }),
          el('div', {}, [
            el('p', { class: 'font-medium text-gray-800 text-sm', text: s }),
            el('p', { class: 'text-xs text-gray-600', text: time })
          ])
        ]);
        stepsBox.appendChild(node);
      });
      stepsCard.appendChild(stepsBox);
      wrap.appendChild(stepsCard);
    }

    // ----- 申报材料卡片（勾选列表）-----
    if (policy.materials && policy.materials.length) {
      const matCard = el('div', { class: 'bg-white rounded-2xl shadow-sm border border-orange-50 p-6 mb-4' }, [
        el('h2', { class: 'font-bold text-lg text-gray-800 mb-3', text: '📎 申报材料' })
      ]);
      const matList = el('ul', { class: 'space-y-2' });
      policy.materials.forEach(function (m) {
        const text = typeof m === 'string' ? m : (m.name || m.text || JSON.stringify(m));
        matList.appendChild(el('li', { class: 'flex items-start gap-2 text-sm text-gray-600' }, [
          el('span', { class: 'text-orange-400 mt-0.5 select-none', text: '☐' }),
          el('span', { class: 'flex-1', text: text })
        ]));
      });
      matCard.appendChild(matList);
      wrap.appendChild(matCard);
    }

    // ----- 申报入口卡片（gov.cn 校验）-----
    const applyCard = el('div', { class: 'bg-white rounded-2xl shadow-sm border border-orange-50 p-6 mb-4' }, [
      el('h2', { class: 'font-bold text-lg text-gray-800 mb-3', text: '🚀 申报入口' })
    ]);
    const applyBtns = el('div', { class: 'flex flex-wrap gap-3' });
    // 查看原文按钮（gov.cn 校验）
    if (policy.docUrl) {
      if (validateGovUrl(policy.docUrl)) {
        applyBtns.appendChild(el('a', {
          href: policy.docUrl,
          target: '_blank',
          rel: 'noopener noreferrer',
          class: 'inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition text-sm shadow-sm',
          text: '📄 查看原文 ↗'
        }));
      } else {
        applyBtns.appendChild(el('span', {
          class: 'inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-500 rounded-lg font-medium text-sm cursor-not-allowed',
          title: '该链接非政府官方网站，已禁用跳转',
          text: '⚠️ 原文链接不可用'
        }));
      }
    }
    // 立即申办按钮（优先 applyUrl，回退 docUrl）
    const applyUrl = policy.applyUrl || (policy.docUrl && validateGovUrl(policy.docUrl) ? policy.docUrl : '');
    if (applyUrl && validateGovUrl(applyUrl)) {
      applyBtns.appendChild(el('a', {
        href: applyUrl,
        target: '_blank',
        rel: 'noopener noreferrer',
        class: 'inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition text-sm shadow-sm',
        text: '🚀 立即申办 ↗'
      }));
    }
    if (!policy.docUrl && !policy.applyUrl) {
      applyBtns.appendChild(el('p', { class: 'text-sm text-gray-500', text: '暂无在线申报入口，请咨询当地主管部门或拨打 12333' }));
    }
    applyCard.appendChild(applyBtns);
    wrap.appendChild(applyCard);

    // ----- 常见问答卡片（可展开列表）-----
    if (policy.faq && policy.faq.length) {
      const faqCard = el('div', { class: 'bg-white rounded-2xl shadow-sm border border-orange-50 p-6 mb-4' }, [
        el('h2', { class: 'font-bold text-lg text-gray-800 mb-3', text: '❓ 常见问答' })
      ]);
      const faqList = el('div', { class: 'space-y-2' });
      policy.faq.forEach(function (item, i) {
        const q = typeof item === 'string' ? item : (item.question || item.q || '');
        const a = typeof item === 'string' ? '' : (item.answer || item.a || '');
        const faqItem = el('div', { class: 'border border-gray-100 rounded-xl overflow-hidden' });
        const qBtn = el('button', {
          type: 'button',
          class: 'flex items-center justify-between w-full p-3 text-left hover:bg-orange-50/30 transition'
        }, [
          el('span', { class: 'text-sm font-medium text-gray-700 flex-1', text: 'Q' + (i + 1) + '：' + q }),
          el('span', { class: 'text-xs text-gray-600 ml-2 shrink-0', text: '▼' })
        ]);
        const aBox = el('div', { class: 'px-3 pb-3 text-sm text-gray-600', style: { display: 'none' } }, [
          el('p', { class: 'leading-relaxed', text: a || '暂无解答' })
        ]);
        qBtn.addEventListener('click', function () {
          const isOpen = aBox.style.display === 'block';
          aBox.style.display = isOpen ? 'none' : 'block';
          const arrow = qBtn.querySelector('.text-xs.text-gray-600');
          if (arrow) arrow.textContent = isOpen ? '▼' : '▲';
        });
        faqItem.appendChild(qBtn);
        faqItem.appendChild(aBox);
        faqList.appendChild(faqItem);
      });
      faqCard.appendChild(faqList);
      wrap.appendChild(faqCard);
    }

    // ----- 加入清单卡片（4 状态按钮）-----
    const listCard = el('div', { class: 'bg-white rounded-2xl shadow-sm border border-orange-50 p-6 mb-4' }, [
      el('h2', { class: 'font-bold text-lg text-gray-800 mb-3', text: '📋 加入我的清单' }),
      el('p', { class: 'text-xs text-gray-500 mb-3', text: '选择申报状态，方便跟踪进度' })
    ]);
    const statusConfigs = [
      { status: STATUS_PENDING, label: '待申报', activeCls: 'bg-orange-500 hover:bg-orange-600 text-white', inactiveCls: 'bg-orange-50 text-orange-600 hover:bg-orange-100' },
      { status: STATUS_APPLIED, label: '已申报', activeCls: 'bg-blue-500 hover:bg-blue-600 text-white', inactiveCls: 'bg-blue-50 text-blue-600 hover:bg-blue-100' },
      { status: STATUS_APPROVED, label: '已获批', activeCls: 'bg-green-500 hover:bg-green-600 text-white', inactiveCls: 'bg-green-50 text-green-600 hover:bg-green-100' },
      { status: STATUS_NOT_APPLICABLE, label: '不适用', activeCls: 'bg-gray-500 hover:bg-gray-600 text-white', inactiveCls: 'bg-gray-50 text-gray-600 hover:bg-gray-100' }
    ];
    const statusBtns = el('div', { class: 'grid grid-cols-2 gap-2' });
    statusConfigs.forEach(function (cfg) {
      const isActive = listSt === cfg.status;
      const btn = el('button', {
        type: 'button',
        class: 'px-4 py-2 rounded-lg font-medium text-sm transition ' + (isActive ? cfg.activeCls + ' ring-2 ring-offset-1' : cfg.inactiveCls),
        'aria-pressed': isActive ? 'true' : 'false'
      }, [ el('span', { text: (isActive ? '✓ ' : '') + cfg.label }) ]);
      btn.addEventListener('click', function () {
        const newStatus = isActive ? null : cfg.status;
        PolicyMateStore.setListStatus(policy.id, newStatus);
        renderDetail(parsed);
      });
      statusBtns.appendChild(btn);
    });
    listCard.appendChild(statusBtns);
    // 移除按钮（如果已有状态）
    if (listSt) {
      const removeBtn = el('button', {
        type: 'button',
        class: 'mt-3 text-xs text-gray-500 hover:text-red-500 transition w-full text-center',
        text: '✕ 从清单中移除'
      });
      removeBtn.addEventListener('click', function () {
        PolicyMateStore.setListStatus(policy.id, null);
        renderDetail(parsed);
      });
      listCard.appendChild(removeBtn);
    }
    wrap.appendChild(listCard);

    // ----- 免责声明 -----
    wrap.appendChild(el('div', { class: 'bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-6' }, [
      el('p', { class: 'text-xs text-yellow-800 leading-relaxed', text: '⚠️ 免责声明：本平台提供的政策信息仅供参考，具体申报条件、材料和流程以当地政府部门最新公告为准。如有疑问，请拨打政策咨询热线 12333。' })
    ]));

    // ----- JSON-LD 结构化数据注入（SEO）-----
    try {
      const ld = document.createElement('script');
      ld.type = 'application/ld+json';
      ld.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'GovernmentService',
        name: policy.name,
        description: policy.summary || '',
        category: policy.category,
        provider: { '@type': 'GovernmentOrganization', name: policy.source || '政府部门' },
        areaServed: policy.city || '中国',
        url: validateGovUrl(policy.docUrl) ? policy.docUrl : undefined
      });
      document.head.appendChild(ld);
    } catch (e) { /* JSON-LD 注入失败不影响渲染 */ }

    container.appendChild(wrap);
  }

  // ============ 我的清单页渲染 ============
  function renderList(parsed) {
    const container = document.getElementById('app-content');
    container.innerHTML = '';

    const allStatus = PolicyMateStore.getAllListStatus();
    const activeTab = (parsed && parsed.query && parsed.query.status) || TAB_LABELS[0];
    const activeStatus = TAB_TO_STATUS[activeTab] || STATUS_PENDING;

    // 按状态分组
    const grouped = {};
    Object.keys(allStatus).forEach(function (pid) {
      const st = allStatus[pid];
      if (!grouped[st]) grouped[st] = [];
      const p = getPolicyById(pid);
      if (p) grouped[st].push(p);
    });

    // 各 tab 计数
    const counts = {};
    counts[STATUS_PENDING] = (grouped[STATUS_PENDING] || []).length;
    counts[STATUS_APPLIED] = (grouped[STATUS_APPLIED] || []).length;
    counts[STATUS_APPROVED] = (grouped[STATUS_APPROVED] || []).length;
    counts[STATUS_NOT_APPLICABLE] = (grouped[STATUS_NOT_APPLICABLE] || []).length;

    const wrap = el('div', { class: 'max-w-3xl mx-auto px-4 py-8 fade-in' });
    wrap.appendChild(el('h1', { class: 'text-2xl font-bold text-gray-800 mb-6', text: '📋 我的清单' }));

    // 4 状态 Tabs
    const tabBar = el('div', { class: 'flex gap-2 mb-6 overflow-x-auto pb-2' });
    TAB_LABELS.forEach(function (label) {
      const st = TAB_TO_STATUS[label];
      const isActive = activeStatus === st;
      const tab = el('button', {
        type: 'button',
        class: 'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ' +
          (isActive ? 'bg-orange-500 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:border-orange-300 hover:text-orange-600'),
        text: label + ' (' + (counts[st] || 0) + ')'
      });
      tab.addEventListener('click', function () {
        location.hash = '#/list?status=' + encodeURIComponent(label);
      });
      tabBar.appendChild(tab);
    });
    wrap.appendChild(tabBar);

    // 列表内容
    const list = grouped[activeStatus] || [];
    if (list.length === 0) {
      wrap.appendChild(el('div', { class: 'text-center py-12' }, [
        el('div', { class: 'text-4xl mb-3', text: '📭' }),
        el('p', { class: 'text-gray-500', text: '暂无' + activeTab + '政策' }),
        el('p', { class: 'text-xs text-gray-400 mt-2', text: '在政策详情页点击「加入清单」即可跟踪申报进度' }),
        (function () {
          const b = el('button', {
            type: 'button',
            class: 'mt-4 px-6 py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition text-sm',
            text: '去匹配政策 →'
          });
          b.addEventListener('click', function () { location.hash = '#/match'; });
          return b;
        }())
      ]));
    } else {
      const listBox = el('div', { class: 'grid gap-3' });
      const results = PolicyMateStore.getMatchResults();
      list.forEach(function (policy) {
        let score = 0;
        let reason = '';
        if (results && results.results) {
          for (let i = 0; i < results.results.length; i++) {
            if (results.results[i].policy && results.results[i].policy.id === policy.id) {
              score = results.results[i].score;
              reason = results.results[i].reason || '';
              break;
            }
          }
        }
        const card = buildPolicyCard(policy, {
          matchScore: score,
          matchReason: reason,
          showLevel: true,
          onClick: function () { location.hash = '#/policy/' + encodeURIComponent(policy.id); }
        });
        listBox.appendChild(card);
      });
      wrap.appendChild(listBox);
    }

    container.appendChild(wrap);
  }

  // ============ 渲染分发 ============
  function render(page, parsed) {
    // 支持 #/list 和 #/match 路由（兼容 router 未明确映射的情况）
    if (parsed && parsed.routeName === 'list') {
      renderList(parsed);
      return;
    }
    if (parsed && parsed.routeName === 'match') {
      renderForm(parsed);
      return;
    }
    switch (page) {
      case 'home':     renderHome(parsed); break;
      case 'form':     renderForm(parsed); break;
      case 'matching': renderMatching(parsed); break;
      case 'results':  renderResults(parsed); break;
      case 'detail':   renderDetail(parsed); break;
      case 'list':     renderList(parsed); break;
      default:         renderHome(parsed);
    }
  }

  // ============ 初始化 ============
  function init() {
    return loadData().then(function () {
      if (window.PolicyMateRouter && typeof window.PolicyMateRouter.init === 'function') {
        window.PolicyMateRouter.init();
      } else {
        // 路由模块尚未加载，监听 hashchange 并手动触发首次渲染
        window.addEventListener('hashchange', function () {
          if (window.PolicyMateRouter && typeof window.PolicyMateRouter.handleRoute === 'function') {
            window.PolicyMateRouter.handleRoute();
          } else {
            // 简易路由回退：解析 hash 并渲染
            const hash = location.hash.replace(/^#\/?/, '');
            const parts = hash.split('?');
            const segments = parts[0].split('/').filter(Boolean);
            const routeName = segments[0] || '';
            const param = segments[1] || null;
            const query = {};
            if (parts[1]) {
              parts[1].split('&').forEach(function (pair) {
                const kv = pair.split('=');
                if (kv.length === 2) query[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1]);
              });
            }
            const parsed = { routeName: routeName, param: param, query: query };
            const pageMap = { '': 'home', form: 'form', match: 'form', matching: 'matching', results: 'results', policy: 'detail', list: 'list' };
            render(pageMap[routeName] || 'home', parsed);
          }
        });
        // 触发首次渲染
        if (window.dispatchEvent) {
          window.dispatchEvent(new Event('hashchange'));
        }
      }
    });
  }

  // ============ 对外暴露 API ============
  global.PolicyMateApp = {
    render: render,
    loadData: loadData,
    getPolicies: getPolicies,
    getScenes: getScenes,
    getPolicyById: getPolicyById,
    init: init,
    // 渲染函数（便于外部调用/测试）
    renderHome: renderHome,
    renderForm: renderForm,
    renderMatching: renderMatching,
    renderResults: renderResults,
    renderDetail: renderDetail,
    renderList: renderList,
    // 工具
    el: el,
    validateGovUrl: validateGovUrl,
    buildPolicyCard: buildPolicyCard
  };

  // ============ 自动启动 ============
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init(); });
  } else {
    // DOM 已就绪（脚本异步加载时），直接初始化
    init();
  }

})(typeof window !== 'undefined' ? window : globalThis);