// app.js - 应用入口,负责:
// 1. 模块装载与初始化
// 2. 登基弹窗
// 3. 路由(hash)
// 4. 起居录
// 5. 设置面板
// 6. 番茄钟
// 7. 导出起居录

const App = (() => {
  let currentRoute = '#/';

  function init() {
    // 1. 数据已内联,无需 await
    Cities.load();
    Events.load();
    Knowledge.load();
    Script.warmup();

    // 2. 应用主题
    Theme.init();

    // 3. 应用音效设置
    const settings = Storage.get(Storage.KEYS.SETTINGS, { sound: true });
    Audio.setEnabled(settings.sound !== false);

    // 4. 启动时钟与时间轴
    Clock.start();
    Timeline.start();
    Timeline.onStageChange(onStageChange);

    // 5. 渲染奏折与统计
    Tribute.render();
    Stats.renderPanel();
    Stats.renderMedals();

    // 6. 检查登基状态
    const profile = Stats.getProfile();
    if (!profile.createdAt) {
      setTimeout(() => openCoronation(), 300);
    } else {
      // 已登基,生成今日起居录
      ensureTodayDiary();
    }

    // 7. 绑定全局事件
    bindGlobalEvents();

    // 8. v1.4: 启动画轴进场动画 + Q版皇帝 + ScriptModal
    startIntroAnimation();
    initQEmperor();
    ScriptModal.bind();
    bindTributeBadge();

    // 9. 首次启动:按当前时段类型决定是否提示
    if (profile.createdAt) {
      setTimeout(() => tryTriggerEventForStage(Timeline.getCurrentStage(new Date())), 8000);
    }

    // 10. 监听路由
    window.addEventListener('hashchange', onHashChange);
    onHashChange();
  }

  // ========== v1.4: 画轴进场动画 ==========
  function startIntroAnimation() {
    const veil = document.getElementById('scroll-veil');
    const app = document.getElementById('app');
    if (!veil || !app) return;
    // 标记 app 为入场前(隐藏)
    app.classList.add('scroll-stage');
    // 1.2s 后清除 veil(动画结束)
    setTimeout(() => {
      veil.classList.add('gone');
      veil.style.opacity = '0';
      veil.style.transition = 'opacity 0.4s';
      setTimeout(() => { veil.style.display = 'none'; }, 500);
    }, 1200);
    // 兜底:如果动画未触发,3s 后强制显示
    setTimeout(() => {
      app.classList.remove('scroll-stage');
    }, 2200);
  }

  // ========== v1.4: Q版皇帝互动 ==========
  const Q_EMPEROR_MOODS = [
    { mood: '朕躬安', icon: '☺' },
    { mood: '甚好甚好', icon: '😊' },
    { mood: '甚念之', icon: '😌' },
    { mood: '朕心甚慰', icon: '😄' },
    { mood: '略有倦意', icon: '😪' },
    { mood: '甚饿', icon: '🍚' },
    { mood: '想出去走走', icon: '🚶' },
    { mood: '传膳', icon: '🥢' },
    { mood: '批奏章', icon: '📜' },
    { mood: '夜深了', icon: '🌙' }
  ];

  function initQEmperor() {
    const wrap = document.getElementById('q-emperor');
    if (!wrap) return;
    const profile = Stats.getProfile();
    const gender = (profile && profile.gender) || 'male';
    // 加载对应 SVG
    const svgFile = gender === 'female' ? 'emperor-female.svg' : 'emperor-male.svg';
    const img = new Image();
    img.src = 'assets/images/' + svgFile;
    img.className = 'q-emperor-svg';
    img.alt = 'Q版' + (gender === 'female' ? '女帝' : '皇帝');
    wrap.appendChild(img);

    const bubble = wrap.querySelector('.mood-bubble');
    let _moodIndex = 0;
    const showMood = () => {
      const m = Q_EMPEROR_MOODS[_moodIndex % Q_EMPEROR_MOODS.length];
      if (bubble) bubble.textContent = m.mood;
      wrap.classList.add('show-mood');
      // 弹出小表情
      const float = document.createElement('span');
      float.className = 'mood-floating';
      float.textContent = m.icon;
      float.style.left = '50%';
      float.style.top = '20%';
      float.style.setProperty('--dx', (Math.random() * 80 - 40) + 'px');
      wrap.appendChild(float);
      setTimeout(() => float.remove(), 1500);
      // 3 秒后隐藏
      setTimeout(() => wrap.classList.remove('show-mood'), 3000);
    };
    wrap.addEventListener('click', () => {
      _moodIndex++;
      showMood();
      Audio.click();
    });
  }

  // ========== v1.4: 奏折匣徽章联动 ==========
  function bindTributeBadge() {
    const badge = document.getElementById('tribute-badge');
    if (!badge) return;
    // 启动时同步一次
    updateTributeBadge();
    // 每 0.5 秒检查一次
    setInterval(updateTributeBadge, 500);
  }

  function updateTributeBadge() {
    const badge = document.getElementById('tribute-badge');
    if (!badge) return;
    const todos = Tribute.list();
    const pending = todos.filter(t => !t.done).length;
    badge.textContent = String(pending);
    badge.classList.toggle('pending-pulse', pending > 0);
    badge.classList.toggle('zero', pending === 0);
  }

  // 根据当前时段类型决定事件弹窗概率
  // PRD P3: 事件弹窗改为按当前时段和任务状态触发,减少随机打断感
  // - 休息/睡眠段(rest): 静默
  // - 准备段(prepare): 静默
  // - 工作/学习段(work/study/review/todo): 低概率 15%
  // - 生活/休闲段(life/leisure): 中概率 30%
  function tryTriggerEventForStage(stage) {
    if (!stage) return;
    const t = stage.type;
    let prob = 0;
    if (t === 'work' || t === 'study' || t === 'review' || t === 'todo') prob = 0.15;
    else if (t === 'life' || t === 'leisure') prob = 0.30;
    else prob = 0; // rest / prepare
    if (Math.random() < prob) {
      Events.tryShowForNow();
    }
  }

  function onStageChange(newStage, oldStage) {
    // 时辰切换:弹窗提示
    Audio.chuanzhi();
    showStageAnnouncement(newStage);
    // 2 秒后,根据新时段类型决定是否触发宫廷事件
    setTimeout(() => tryTriggerEventForStage(newStage), 2000);
  }

  function showStageAnnouncement(stage) {
    const modal = document.getElementById('announcement-modal');
    if (!modal) return;
    const hour = String(stage.range[0]).padStart(2, '0');
    modal.querySelector('.ann-shichen').textContent = stage.shichen;
    modal.querySelector('.ann-label').textContent = stage.label;
    modal.querySelector('.ann-time').textContent = `${hour}:00`;
    modal.querySelector('.ann-icon').textContent = stage.icon;
    // 注入今日剧本:用户自填 > 默认
    const scriptText = Script.getStageText(stage.id);
    const baseMsg = `陛下,已到${stage.shichen}时(${stage.label}),恭请圣安。`;
    modal.querySelector('.ann-message').textContent = scriptText
      ? `${baseMsg} — ${scriptText}`
      : baseMsg;
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.add('hidden'), 4000);
  }

  // ========== 登基弹窗 ==========
  let currentGender = 'male';

  function openCoronation() {
    const modal = document.getElementById('coronation-modal');
    if (!modal) return;
    populateCitySelector();
    bindGenderButtons();
    updateTitlePreview();
    modal.classList.remove('hidden');
  }

  function populateCitySelector() {
    const sel = document.getElementById('cor-city');
    if (!sel) return;
    const all = Cities.all();
    if (all.length === 0) {
      console.error('城市数据为空');
      return;
    }
    // 同步填充(数据已内联,无需等待 fetch)
    sel.innerHTML = all.map(c =>
      '<option value="' + c.key + '">' + c.city + ' (' + c.country + ') ' + c.offset + '</option>'
    ).join('');
    const profile = Stats.getProfile();
    if (profile.cityKey && Cities.findByKey(profile.cityKey)) {
      sel.value = profile.cityKey;
    } else {
      // 默认选中浏览器时区,否则选北京
      const browserTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (Cities.findByKey(browserTZ)) sel.value = browserTZ;
      else sel.value = 'Asia/Shanghai';
    }
    // 解绑旧监听,避免重复
    sel.onchange = updateTitlePreview;
    sel.oninput = updateTitlePreview;
    const wake = document.getElementById('cor-wake');
    if (wake) {
      wake.onchange = updateTitlePreview;
      wake.oninput = updateTitlePreview;
    }
  }

  function bindGenderButtons() {
    const container = document.getElementById('cor-gender');
    if (!container) return;
    container.querySelectorAll('.gender-btn').forEach(btn => {
      btn.onclick = () => {
        const g = btn.dataset.gender;
        currentGender = g;
        container.querySelectorAll('.gender-btn').forEach(b => {
          const isActive = b.dataset.gender === g;
          b.classList.toggle('active', isActive);
          b.classList.toggle('border-amber-300', isActive);
          b.classList.toggle('bg-amber-50/20', isActive);
          b.classList.toggle('border-amber-700/40', !isActive);
          b.classList.toggle('bg-amber-900/20', !isActive);
        });
        document.querySelectorAll('.emperor-svg').forEach(svg => {
          svg.classList.toggle('opacity-0', svg.dataset.gender !== g);
        });
        Audio.click();
        updateTitlePreview();
      };
    });
  }

  function updateTitlePreview() {
    const sel = document.getElementById('cor-city');
    const wake = document.getElementById('cor-wake');
    const preview = document.getElementById('cor-title-preview');
    if (!sel || !preview) return;
    let city = Cities.findByKey(sel.value);
    if (!city && sel.selectedIndex >= 0) {
      // 用 selectedIndex 取 fallback
      const opt = sel.options[sel.selectedIndex];
      if (opt) city = Cities.findByKey(opt.value);
    }
    const cityName = city ? (city.alias || city.city) : '未知';
    const timePreview = document.getElementById('cor-time-preview');
    const offsetPreview = document.getElementById('cor-offset-preview');
    const commentPreview = document.getElementById('cor-comment-preview');
    const anchorPreview = document.getElementById('cor-anchor-preview');
    if (city) {
      try {
        const now = new Date();
        const t = Clock.getNow(now, city.key);
        if (timePreview) timePreview.textContent = '当前 ' + (city.alias || city.city) + ' 时间: ' + t.time + ' · ' + t.shichen.name + '时(' + t.shichen.alias + ')';
        // 紫禁城 04:00 在用户城市的对应时间
        const mapped = TimeService.mapImperialAnchorToTZ(now, city.key);
        if (anchorPreview) {
          const mappedTime = String(mapped.hour).padStart(2, '0') + ':' + String(mapped.minute).padStart(2, '0');
          anchorPreview.textContent = '紫禁城 04:00 对应 ' + (city.alias || city.city) + ' ' + mappedTime + ' · ' + mapped.shichen + '时';
        }
        // 偏差与作息评语
        const wakeEl = document.getElementById('cor-wake');
        const wakeTime = wakeEl ? wakeEl.value : '07:00';
        const offset = TimeService.diffWakeToAnchor(wakeTime, city.key, now);
        const comment = TimeService.commentByOffset(offset);
        if (offsetPreview) {
          const sign = offset > 0 ? '+' : (offset < 0 ? '-' : '');
          const abs = Math.abs(offset);
          const hh = Math.floor(abs / 60);
          const mm = abs % 60;
          const disp = hh > 0 ? (sign + hh + 'h' + (mm > 0 ? String(mm).padStart(2, '0') + 'm' : '')) : (sign + mm + 'm');
          offsetPreview.textContent = '与御制锚点偏差: ' + (offset === 0 ? '0 (勤政相近)' : disp);
        }
        if (commentPreview) {
          commentPreview.textContent = '评语: ' + comment.label;
        }
      } catch (e) {
        if (timePreview) timePreview.textContent = '时区: ' + city.offset;
      }
    } else {
      if (timePreview) timePreview.textContent = '';
      if (anchorPreview) anchorPreview.textContent = '';
      if (offsetPreview) offsetPreview.textContent = '';
      if (commentPreview) commentPreview.textContent = '';
    }
    const titleSuffix = currentGender === 'female' ? '女帝' : '皇帝';
    preview.textContent = cityName + titleSuffix;
  }

  function bindGlobalEvents() {
    // 登基确认
    const corConfirm = document.getElementById('cor-confirm');
    if (corConfirm) corConfirm.addEventListener('click', confirmCoronation);
    // 奏折添加
    const tributeAdd = document.getElementById('tribute-add');
    const tributeInput = document.getElementById('tribute-input');
    if (tributeAdd && tributeInput) {
      tributeAdd.addEventListener('click', () => {
        const type = document.getElementById('tribute-type')?.value || 'politics';
        Tribute.add({ title: tributeInput.value, type });
        tributeInput.value = '';
      });
      tributeInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') tributeAdd.click();
      });
    }
    const tributeClear = document.getElementById('tribute-clear');
    if (tributeClear) tributeClear.addEventListener('click', Tribute.clearDone);
    // 时辰换算工具
    const convertBtn = document.getElementById('convert-btn');
    if (convertBtn) convertBtn.addEventListener('click', convertShichen);
    const convertReverseBtn = document.getElementById('convert-reverse-btn');
    if (convertReverseBtn) convertReverseBtn.addEventListener('click', convertReverse);
    // 设置项
    bindSettings();
    // 番茄钟
    bindPomodoro();
    // 导航
    document.querySelectorAll('[data-route]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const newHash = el.dataset.route;
        if (location.hash === newHash) {
          // hash 未变:浏览器不会触发 hashchange,手动调用一次
          const target = _hashToTarget(newHash);
          _showPage(target);
          _highlightNav(newHash);
        } else {
          location.hash = newHash;
        }
      });
    });
    // 起居录导出
    const exportBtn = document.getElementById('export-diary');
    if (exportBtn) exportBtn.addEventListener('click', exportDiary);
  }

  // ========== 设置页事件绑定 ==========
  // 主题点击事件已由 _buildThemeGrid 内部绑定,这里只需绑定其他控件
  function bindSettings() {
    // 声音
    const soundToggle = document.getElementById('sound-toggle');
    if (soundToggle) {
      soundToggle.addEventListener('change', (e) => {
        const s = Storage.get(Storage.KEYS.SETTINGS, {});
        s.sound = e.target.checked;
        Storage.set(Storage.KEYS.SETTINGS, s);
        Audio.setEnabled(e.target.checked);
      });
    }
    // 城市搜索
    const addCityBtn = document.getElementById('add-city-btn');
    const citySearch = document.getElementById('city-search');
    if (citySearch) {
      citySearch.addEventListener('input', () => {
        const q = citySearch.value;
        const list = document.getElementById('city-search-results');
        if (!list) return;
        list.innerHTML = '';
        if (!q.trim()) return;
        const results = Cities.search(q).slice(0, 10);
        if (results.length === 0) {
          const empty = document.createElement('div');
          empty.className = 'text-xs text-amber-200/50 italic p-2 text-center';
          empty.textContent = '未匹配到城市,请尝试英文/时区名/国家名';
          list.appendChild(empty);
          return;
        }
        results.forEach(c => {
          const btn = document.createElement('button');
          btn.className = 'w-full text-left p-2 hover:bg-amber-50/20 rounded text-sm font-kai text-amber-50 border-b border-amber-700/20';
          const main = document.createElement('span');
          main.textContent = c.city + ' (' + c.country + ') ';
          const sub = document.createElement('span');
          sub.className = 'text-amber-200/50 text-xs';
          sub.textContent = c.key;
          btn.appendChild(main);
          btn.appendChild(sub);
          btn.addEventListener('click', () => {
            const added = Clock.addCity(c.key);
            citySearch.value = '';
            list.innerHTML = '';
            _refreshSettingsDynamic();
            Audio.click();
            if (added === false) {
              Tribute.showToast('⚠️ 城市已存在或添加失败');
            } else {
              Tribute.showToast('✓ 已添加 ' + (c.alias || c.city));
            }
          });
          list.appendChild(btn);
        });
      });
    }
    if (addCityBtn) {
      addCityBtn.addEventListener('click', () => {
        if (citySearch && citySearch.value.trim()) {
          citySearch.dispatchEvent(new Event('input'));
        }
      });
    }
    // 从列表选(大洲分组下拉)
    const cityPickBtn = document.getElementById('city-pick-btn');
    const cityPickPanel = document.getElementById('city-pick-panel');
    if (cityPickBtn && cityPickPanel) {
      cityPickBtn.addEventListener('click', () => {
        if (!cityPickPanel.classList.contains('hidden')) {
          cityPickPanel.classList.add('hidden');
          return;
        }
        cityPickPanel.innerHTML = '';
        const groups = Cities.groupedByRegion();
        Cities.REGION_ORDER.forEach(region => {
          const list = groups[region] || [];
          if (list.length === 0) return;
          const h = document.createElement('div');
          h.className = 'text-xs text-amber-200/60 font-kai mt-2 mb-1 px-1 sticky top-0 bg-amber-900/60 backdrop-blur-sm rounded';
          h.textContent = region + ' (' + list.length + ')';
          cityPickPanel.appendChild(h);
          list.forEach(c => {
            const row = document.createElement('button');
            row.type = 'button';
            row.className = 'city-pick-row w-full text-left px-2 py-1 hover:bg-amber-50/20 rounded text-sm font-kai text-amber-50 flex justify-between items-center';
            const main = document.createElement('span');
            main.textContent = c.city;
            const sub = document.createElement('span');
            sub.className = 'text-amber-200/40 text-[10px] font-mono';
            sub.textContent = c.offset;
            row.appendChild(main);
            row.appendChild(sub);
            row.addEventListener('click', () => {
              const added = Clock.addCity(c.key);
              if (added === false) {
                Tribute.showToast('⚠️ 城市已存在或添加失败');
              } else {
                Tribute.showToast('✓ 已添加 ' + (c.alias || c.city));
                Audio.click();
                cityPickPanel.classList.add('hidden');
                _refreshSettingsDynamic();
              }
            });
            cityPickPanel.appendChild(row);
          });
        });
        cityPickPanel.classList.remove('hidden');
        Audio.click();
      });
      // 点击面板外部关闭
      document.addEventListener('click', (e) => {
        if (cityPickPanel.classList.contains('hidden')) return;
        if (cityPickPanel.contains(e.target) || cityPickBtn.contains(e.target)) return;
        cityPickPanel.classList.add('hidden');
      });
    }
    // 导出存档
    const exportData = document.getElementById('export-data');
    if (exportData) exportData.addEventListener('click', exportAllData);
    // 导入存档
    const importData = document.getElementById('import-data');
    const importFile = document.getElementById('import-file');
    if (importData && importFile) {
      importData.addEventListener('click', () => importFile.click());
      importFile.addEventListener('change', (e) => {
        const f = e.target.files[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (Storage.importAll(ev.target.result)) {
            Tribute.showToast('✅ 数据导入成功');
            setTimeout(() => location.reload(), 800);
          } else {
            Tribute.showToast('❌ 数据格式错误');
          }
        };
        reader.readAsText(f);
      });
    }
    // 清空数据
    const clearData = document.getElementById('clear-data');
    if (clearData) clearData.addEventListener('click', () => {
      if (confirm('确定要清空所有数据吗?此操作不可恢复。')) {
        Storage.clearAll();
        Tribute.showToast('已清空所有数据');
        setTimeout(() => location.reload(), 800);
      }
    });
    // 重新登基
    const recrown = document.getElementById('recrown');
    if (recrown) {
      recrown.addEventListener('click', () => {
        // 重置 currentGender,确保重新进入弹窗显示默认男帝
        currentGender = 'male';
        document.querySelectorAll('.gender-btn').forEach(b => {
          const isActive = b.dataset.gender === 'male';
          b.classList.toggle('active', isActive);
          b.classList.toggle('border-amber-300', isActive);
          b.classList.toggle('bg-amber-50/20', isActive);
          b.classList.toggle('border-amber-700/40', !isActive);
          b.classList.toggle('bg-amber-900/20', !isActive);
        });
        document.querySelectorAll('.emperor-svg').forEach(svg => {
          svg.classList.toggle('opacity-0', svg.dataset.gender !== 'male');
        });
        openCoronation();
      });
    }
  }

  function confirmCoronation() {
    const sel = document.getElementById('cor-city');
    const wake = document.getElementById('cor-wake');
    if (!sel || !wake) return;
    const cityKey = sel.value;
    const city = Cities.findByKey(cityKey);
    const wakeTime = wake.value;
    if (!city || !wakeTime) return;
    const cityName = city.alias || city.city;
    const titleSuffix = currentGender === 'female' ? '女帝' : '皇帝';
    const title = cityName + titleSuffix;
    // 用 TimeService 计算御制锚点偏差
    const now = new Date();
    const wakeOffsetMinutes = TimeService.diffWakeToAnchor(wakeTime, cityKey, now);
    const profile = {
      version: 2,
      title,
      cityKey,
      cityName,
      wakeTime,
      gender: currentGender,
      imperialAnchor: {
        timezone: TimeService.IMPERIAL_ANCHOR.timezone,
        time: TimeService.IMPERIAL_ANCHOR.time,
        label: TimeService.IMPERIAL_ANCHOR.label
      },
      wakeOffsetMinutes,
      stats: { diligence: 0, benevolence: 0, indulgence: 0 },
      medals: [],
      completedTodos: 0,
      daysActive: 1,
      pomodoro: { focus: 25, shortBreak: 5, longBreak: 15, longEvery: 4 },
      createdAt: new Date().toISOString()
    };
    Stats.saveProfile(profile);
    document.getElementById('coronation-modal').classList.add('hidden');
    Audio.zhongming();
    Tribute.showToast('👑 登基大典礼成!恭请 ' + title + ' 圣安');
    setTimeout(() => {
      Clock.tick();
      Tribute.render();
      Stats.renderPanel();
      Stats.renderMedals();
      ensureTodayDiary();
    }, 500);
  }

  // ========== 路由 ==========
  // 缓存元素引用,避免每次 hashchange 都 querySelectorAll
  let _pageEls = null;
  let _navEls = null;
  function _getPageEls() {
    if (!_pageEls) {
      _pageEls = {
        home: document.getElementById('page-home'),
        diaries: document.getElementById('page-diaries'),
        knowledge: document.getElementById('page-knowledge'),
        settings: document.getElementById('page-settings'),
        help: document.getElementById('page-help')
      };
    }
    return _pageEls;
  }
  function _getNavEls() {
    if (!_navEls) {
      _navEls = {};
      document.querySelectorAll('.nav-item').forEach(n => { _navEls[n.dataset.route] = n; });
    }
    return _navEls;
  }
  // 切页时只隐藏/显示,不再做全文档 querySelectorAll
  // 优化:仅在需要时才对每页进行 hidden 切换;目标页若已可见则零开销
  function _showPage(target) {
    const pages = _getPageEls();
    const targetPage = pages[target];
    if (!targetPage) return;
    // 目标页若已可见,直接 return
    if (!targetPage.classList.contains('hidden')) {
      // 但仍要确保已 prebuilt
      if (!targetPage.dataset.prebuilt) {
        _prebuildPage(target, targetPage);
        targetPage.dataset.prebuilt = '1';
      }
      return;
    }
    // 隐藏其他页(已 hidden 的跳过)
    Object.values(pages).forEach(p => {
      if (p && !p.classList.contains('hidden')) p.classList.add('hidden');
    });
    if (!targetPage.dataset.prebuilt) {
      _prebuildPage(target, targetPage);
      targetPage.dataset.prebuilt = '1';
    }
    // 显示目标页
    targetPage.classList.remove('hidden');
  }
  // 预建静态/半静态内容,首次切到该页时执行
  function _prebuildPage(target, pageEl) {
    if (target === 'knowledge') {
      Knowledge.render('knowledge-content');
    } else if (target === 'settings') {
      // 主题网格和城市列表(动态)分两次构建
      _buildThemeGrid();
      renderSettings(/*themeOnly*/ false);
    } else if (target === 'diaries') {
      // 起居录数据动态,首次进入时渲染一次
      _renderDiariesInternal();
    }
  }

  // 当前 hash 切换时,根据目标路由调用对应渲染
  let _lastRoute = null;
  function _hashToTarget(hash) {
    if (hash === '#/diaries') return 'diaries';
    if (hash === '#/knowledge') return 'knowledge';
    if (hash === '#/settings') return 'settings';
    if (hash === '#/help') return 'help';
    return 'home';
  }
  function _highlightNav(hash) {
    const navs = _getNavEls();
    Object.values(navs).forEach(n => n.classList.remove('text-amber-300'));
    const nav = navs[hash];
    if (nav) nav.classList.add('text-amber-300');
  }
  function onHashChange() {
    const hash = location.hash || '#/';
    if (hash === _lastRoute) return; // 同路由不重复渲染
    _lastRoute = hash;
    currentRoute = hash;
    // 高亮 nav
    _highlightNav(hash);
    // 切页
    _showPage(_hashToTarget(hash));
  }

  // ========== 设置 ==========
  // 主题网格只构建一次;城市列表和档案每次进入设置页时刷新
  let _themeGridBuilt = false;
  function _buildThemeGrid() {
    if (_themeGridBuilt) return;
    const themeGrid = document.getElementById('theme-grid');
    if (!themeGrid) return;
    themeGrid.innerHTML = '';
    const currentTheme = Theme.getCurrent();
    Theme.list().forEach(t => {
      const btn = document.createElement('button');
      btn.dataset.themeId = t.id;
      btn.className = 'p-3 rounded-lg border-2 hover:border-amber-200 transition-all text-left bg-gradient-to-br from-amber-900/30 to-amber-700/20';
      btn.dataset.active = t.id === currentTheme ? '1' : '0';
      // 内层放 icon/name/desc,外层只切 border 即可
      const icon = document.createElement('div');
      icon.className = 'text-2xl mb-1';
      icon.textContent = t.icon;
      const name = document.createElement('div');
      name.className = 'font-kai text-amber-100 text-sm';
      name.textContent = t.name;
      const desc = document.createElement('div');
      desc.className = 'text-xs text-amber-200/60';
      desc.textContent = t.label + ' · ' + t.desc;
      btn.appendChild(icon);
      btn.appendChild(name);
      btn.appendChild(desc);
      btn.addEventListener('click', () => {
        Theme.set(t.id);
        Audio.click();
        _updateThemeActive(t.id);
      });
      themeGrid.appendChild(btn);
    });
    _themeGridBuilt = true;
    _updateThemeActive(currentTheme);
  }
  // 切主题时只更新按钮的 active 边框,不再重建网格
  function _updateThemeActive(activeId) {
    const themeGrid = document.getElementById('theme-grid');
    if (!themeGrid) return;
    themeGrid.querySelectorAll('[data-theme-id]').forEach(btn => {
      const isActive = btn.dataset.themeId === activeId;
      btn.dataset.active = isActive ? '1' : '0';
      btn.className = 'p-3 rounded-lg border-2 ' +
        (isActive ? 'border-amber-300' : 'border-amber-700/30') +
        ' hover:border-amber-200 transition-all text-left bg-gradient-to-br from-amber-900/30 to-amber-700/20';
    });
  }

  // 城市列表和档案(数据变化时才需刷新)
  let _settingsDataRendered = false;
  function _refreshSettingsDynamic() {
    const profile = Stats.getProfile();
    // 声音
    const soundToggle = document.getElementById('sound-toggle');
    if (soundToggle) soundToggle.checked = Audio.isEnabled();
    // 已添加城市
    const added = Storage.get(Storage.KEYS.ADDED_CITIES, ['Asia/Shanghai']);
    const cityList = document.getElementById('added-cities-list');
    if (cityList) {
      cityList.innerHTML = '';
      if (added.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'text-xs text-amber-200/40 italic';
        empty.textContent = '未添加';
        cityList.appendChild(empty);
      } else {
        added.forEach(tz => {
          const c = Cities.findByKey(tz);
          const row = document.createElement('div');
          row.className = 'flex items-center justify-between p-2 bg-amber-50/10 rounded mb-1';
          const nameSpan = document.createElement('span');
          nameSpan.className = 'text-amber-100 font-kai text-sm';
          nameSpan.textContent = (c ? c.city : tz) + ' (' + (c ? c.country : '') + ')';
          row.appendChild(nameSpan);
          if (tz !== 'Asia/Shanghai') {
            const btn = document.createElement('button');
            btn.className = 'text-red-300 text-xs';
            btn.textContent = '移除';
            btn.addEventListener('click', () => {
              Clock.removeCity(tz);
              _refreshSettingsDynamic();
            });
            row.appendChild(btn);
          } else {
            const tag = document.createElement('span');
            tag.className = 'text-amber-300/40 text-xs';
            tag.textContent = '紫禁城';
            row.appendChild(tag);
          }
          cityList.appendChild(row);
        });
      }
    }
    // 当前档案
    const prof = document.getElementById('settings-profile');
    if (prof && profile.createdAt) {
      prof.innerHTML = '';
      const t1 = document.createElement('div');
      t1.className = 'font-kai text-amber-100 text-lg';
      t1.textContent = profile.title || '未登基';
      const t2 = document.createElement('div');
      t2.className = 'text-xs text-amber-200/60';
      t2.textContent = (profile.cityName || '') + ' · 起床 ' + (profile.wakeTime || '');
      const t3 = document.createElement('div');
      t3.className = 'text-xs text-amber-200/40 mt-1';
      try { t3.textContent = new Date(profile.createdAt).toLocaleString('zh-CN'); } catch (e) { t3.textContent = ''; }
      prof.appendChild(t1);
      prof.appendChild(t2);
      prof.appendChild(t3);
    }
    _settingsDataRendered = true;
  }

  // 旧 renderSettings 保留为兼容(供外部使用),内部委托给新的两段式
  function renderSettings() {
    _buildThemeGrid();
    _refreshSettingsDynamic();
  }

  // ========== 起居录 ==========
  // dirty flag:仅在日记数据变化时重渲染
  let _diariesDirty = true;
  function markDiariesDirty() { _diariesDirty = true; }

  function _renderDiariesInternal() {
    const list = document.getElementById('diary-list');
    if (!list) return;
    const log = Storage.get(Storage.KEYS.DIARY, { entries: [] });
    const entries = (log.entries || []).slice().reverse();
    list.innerHTML = '';
    if (entries.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'text-amber-200/40 italic text-center py-8';
      empty.textContent = '尚无起居录,陛下请完成今日任务';
      list.appendChild(empty);
      _diariesDirty = false;
      return;
    }
    // DocumentFragment 减少 reflow
    const frag = document.createDocumentFragment();
    entries.forEach(d => {
      const card = document.createElement('div');
      card.className = 'bg-amber-50/5 border border-amber-300/30 rounded-lg p-4 mb-3';
      const head = document.createElement('div');
      head.className = 'flex items-center justify-between mb-2';
      const dateDiv = document.createElement('div');
      dateDiv.className = 'font-kai text-amber-200 text-lg';
      dateDiv.textContent = d.date || '';
      const cnt = document.createElement('div');
      cnt.className = 'text-xs text-amber-200/60';
      cnt.textContent = ((d.events || []).length) + ' 件宫廷事务';
      head.appendChild(dateDiv);
      head.appendChild(cnt);
      card.appendChild(head);
      const body = document.createElement('div');
      body.className = 'space-y-1';
      const events = d.events || [];
      if (events.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'text-xs text-amber-200/30 italic';
        empty.textContent = '无事件记录';
        body.appendChild(empty);
      } else {
        events.forEach(ev => {
          const row = document.createElement('div');
          row.className = 'text-xs pl-3 border-l-2 border-amber-600/50 mb-1';
          const cat = document.createElement('span');
          cat.className = 'text-amber-300';
          cat.textContent = '[' + (ev.category || '') + ']';
          const title = document.createElement('span');
          title.textContent = ' ' + (ev.title || '') + ' → ';
          const choice = document.createElement('span');
          choice.className = 'text-amber-100/80';
          choice.textContent = ev.choice || '';
          const ts = document.createElement('span');
          ts.className = 'text-amber-200/50';
          try { ts.textContent = ' ' + new Date(ev.timestamp).toLocaleTimeString('zh-CN', { hour12: false }); } catch (e) { ts.textContent = ''; }
          row.appendChild(cat);
          row.appendChild(title);
          row.appendChild(choice);
          row.appendChild(ts);
          body.appendChild(row);
        });
      }
      card.appendChild(body);
      // 今日剧本段(仅当天日记显示)
      const today = Script.getDateKey();
      if (d.date === today) {
        const scripts = Script.getToday();
        const stats = Script.getStats();
        const sBlock = document.createElement('div');
        sBlock.className = 'mt-3 pt-3 border-t border-amber-700/30';
        const sHead = document.createElement('div');
        sHead.className = 'flex items-center justify-between mb-2';
        const sTitle = document.createElement('div');
        sTitle.className = 'text-xs text-amber-200/70 font-kai';
        sTitle.textContent = '📜 今日剧本 (自定义 ' + stats.userCount + '/' + stats.total + ' 段)';
        const sReset = document.createElement('button');
        sReset.className = 'text-[10px] text-amber-200/40 hover:text-amber-100 font-kai';
        sReset.textContent = '恢复默认';
        sReset.addEventListener('click', () => {
          if (confirm('清空今日所有自定义剧本,恢复康雍乾默认?')) {
            Script.restoreDefaults();
            Timeline.refreshScripts();
            _renderDiariesInternal();
            Tribute.showToast('已恢复今日剧本默认');
          }
        });
        sHead.appendChild(sTitle);
        sHead.appendChild(sReset);
        sBlock.appendChild(sHead);
        const sGrid = document.createElement('div');
        sGrid.className = 'grid grid-cols-2 md:grid-cols-4 gap-1 text-[10px]';
        scripts.forEach(sc => {
          const cell = document.createElement('div');
          cell.className = 'flex gap-1 px-1 py-0.5 rounded ' + (sc.source === 'user' ? 'bg-amber-50/10' : '');
          const k = document.createElement('span');
          k.className = 'font-kai text-amber-300/70 w-8 shrink-0';
          k.textContent = sc.id.split('-')[0] + (sc.id.split('-')[1] === 'zheng' ? '正' : '初');
          const v = document.createElement('span');
          v.className = 'font-kai truncate ' + (sc.source === 'user' ? 'text-amber-200' : 'text-amber-200/50');
          v.textContent = sc.text;
          v.title = sc.text;
          cell.appendChild(k);
          cell.appendChild(v);
          sGrid.appendChild(cell);
        });
        sBlock.appendChild(sGrid);
        card.appendChild(sBlock);
      }
      frag.appendChild(card);
    });
    list.appendChild(frag);
    // 起居录页还包含勋章,顺手刷新(已用缓存节点,只更新样式)
    Stats.renderMedals();
    _diariesDirty = false;
  }

  function exportDiary() {
    const profile = Stats.getProfile();
    const log = Storage.get(Storage.KEYS.DIARY, { entries: [] });
    const today = new Date().toISOString().slice(0, 10);
    const todayEntry = (log.entries || []).find(e => e.date === today);
    const stats = profile.stats || { diligence: 0, benevolence: 0, indulgence: 0 };
    const shichens = Timeline.STAGES;
    const currentStage = Timeline.getCurrentStage(new Date());
    const lines = [
      '═══════════════════════════════════════',
      '     《' + (profile.title || '帝王') + '一日起居录》',
      '═══════════════════════════════════════',
      '',
      `📅 日期:${today}`,
      `🏯 属地:${profile.cityName || '紫禁城'}`,
      `🕐 当前时辰:${currentStage?.shichen || '-'}时 ${currentStage?.label || ''}`,
      '',
      '── 一日三轴属性 ──',
      `📜 勤政值:${stats.diligence}`,
      `🪷 仁德值:${stats.benevolence}`,
      `🎭 享乐值:${stats.indulgence}`,
      '',
      '── 今日宫廷事务 ──'
    ];
    if (todayEntry && todayEntry.events) {
      todayEntry.events.forEach((ev, i) => {
        lines.push(`  ${i + 1}. [${ev.category}] ${ev.title}`);
        lines.push(`     → 处置:${ev.choice}`);
        lines.push(`     → 时间:${new Date(ev.timestamp).toLocaleTimeString('zh-CN', { hour12: false })}`);
      });
    } else {
      lines.push('  (今日无事件记录)');
    }
    lines.push('');
    lines.push('── 已解锁勋章 ──');
    const earned = (profile.medals || []).length;
    lines.push(`  共 ${earned} 枚`);
    // 今日剧本段
    lines.push('');
    lines.push('── 今日剧本 ──');
    const scripts = Script.getToday();
    const sStats = Script.getStats();
    lines.push(`  自定义 ${sStats.userCount}/${sStats.total} 段,默认=史料,自填=「陛下亲定」`);
    scripts.forEach(sc => {
      const mark = sc.source === 'user' ? '★' : '·';
      lines.push(`  ${mark} ${sc.id.padEnd(12)} ${sc.text}`);
    });
    lines.push('');
    lines.push('═══════════════════════════════════════');
    lines.push('     御笔朱批 钦此');
    lines.push('═══════════════════════════════════════');
    downloadTxt('帝王起居录_' + today + '.txt', lines.join('\n'));
    Tribute.showToast('✅ 《起居录》已下载');
  }

  function exportAllData() {
    const dump = Storage.exportAll();
    downloadTxt('我是皇帝_存档_' + new Date().toISOString().slice(0, 10) + '.json', dump);
    Tribute.showToast('✅ 存档已下载');
  }

  function downloadTxt(filename, content) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ========== 时辰换算工具 ==========
  function convertShichen() {
    const input = document.getElementById('convert-input');
    const result = document.getElementById('convert-result');
    if (!input || !result) return;
    const v = input.value.trim();
    if (!v) { result.textContent = '请输入时间'; return; }
    const m = v.match(/^(\d{1,2}):?(\d{2})$/);
    if (!m) { result.textContent = '格式错误,请输入 HH:MM 或 HHMM'; return; }
    const h = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    if (h < 0 || h > 23 || mm < 0 || mm > 59) { result.textContent = '时间超出范围'; return; }
    const name = Shichen.shichenByHour(h);
    const info = Shichen.shichenInfo(name);
    // DOM 创建,避免 escape 负担
    result.innerHTML = '';
    const main = document.createElement('div');
    main.className = 'text-amber-200 font-kai text-lg';
    const hh = String(h).padStart(2, '0');
    const mms = String(mm).padStart(2, '0');
    main.textContent = hh + ':' + mms + ' → ' + info.label + ' (' + info.alias + ')';
    const sub = document.createElement('div');
    sub.className = 'text-xs text-amber-100/60 mt-1';
    sub.textContent = info.range + ' · 生肖:' + info.zodiac;
    result.appendChild(main);
    result.appendChild(sub);
  }

  function convertReverse() {
    const input = document.getElementById('convert-input');
    const result = document.getElementById('convert-result');
    if (!input || !result) return;
    const v = input.value.trim();
    if (!v) { result.textContent = '请输入时辰(如:寅)'; return; }
    if (!['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'].includes(v)) {
      result.textContent = '请输入地支: 子丑寅卯辰巳午未申酉戌亥';
      return;
    }
    const info = Shichen.shichenInfo(v);
    result.innerHTML = '';
    const main = document.createElement('div');
    main.className = 'text-amber-200 font-kai text-lg';
    main.textContent = v + '时 (' + info.alias + ') → ' + info.range;
    const sub = document.createElement('div');
    sub.className = 'text-xs text-amber-100/60 mt-1';
    sub.textContent = '生肖:' + info.zodiac;
    result.appendChild(main);
    result.appendChild(sub);
  }

  // ========== 番茄钟 ==========
  function bindPomodoro() {
    let timer = null;
    let seconds = 25 * 60;
    let running = false;
    const display = document.getElementById('pomodoro-display');
    const start = document.getElementById('pomodoro-start');
    const reset = document.getElementById('pomodoro-reset');
    const focusInput = document.getElementById('pomo-focus');
    if (!display || !start || !reset) return;

    // 加载 profile 中的专注时长
    const prof = Stats.getProfile();
    const pomo = (prof && prof.pomodoro) || { focus: 25 };
    let focusMinutes = clampInt(pomo.focus, 1, 180, 25);
    seconds = focusMinutes * 60;
    if (focusInput) focusInput.value = focusMinutes;

    function clampInt(v, min, max, def) {
      const n = parseInt(v, 10);
      if (isNaN(n)) return def;
      return Math.max(min, Math.min(max, n));
    }

    function update() {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      display.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    }
    function tick() {
      if (seconds > 0) {
        seconds--;
        update();
      } else {
        clearInterval(timer);
        running = false;
        start.textContent = '开始';
        Audio.zhongming();
        Tribute.showToast('🎉 御批奏章时辰到,恭请圣休');
        Stats.addStat({ diligence: 2 });
      }
    }
    function persistFocus(m) {
      const p = Stats.getProfile();
      if (!p.pomodoro) p.pomodoro = { focus: 25, shortBreak: 5, longBreak: 15, longEvery: 4 };
      p.pomodoro.focus = m;
      Stats.saveProfile(p);
    }
    function applyFocusMinutes(m, opts) {
      const next = clampInt(m, 1, 180, 25);
      const wasRunning = running;
      if (wasRunning) {
        // 运行中修改需要二次确认
        const ok = window.confirm('当前轮正在进行,修改时长:\n点击"确定"立即应用到当前轮(进度重新计算)\n点击"取消"则不修改');
        if (!ok) {
          if (focusInput) focusInput.value = focusMinutes;
          return;
        }
        clearInterval(timer);
        running = false;
        start.textContent = '继续';
      }
      focusMinutes = next;
      seconds = focusMinutes * 60;
      update();
      if (focusInput) focusInput.value = focusMinutes;
      persistFocus(focusMinutes);
      if (opts && opts.restart) {
        timer = setInterval(tick, 1000);
        running = true;
        start.textContent = '暂停';
      }
    }
    start.addEventListener('click', () => {
      if (running) {
        clearInterval(timer);
        running = false;
        start.textContent = '继续';
      } else {
        timer = setInterval(tick, 1000);
        running = true;
        start.textContent = '暂停';
      }
      Audio.click();
    });
    reset.addEventListener('click', () => {
      clearInterval(timer);
      seconds = focusMinutes * 60;
      running = false;
      start.textContent = '开始';
      update();
      Audio.click();
    });
    // 输入框
    if (focusInput) {
      focusInput.addEventListener('change', () => {
        applyFocusMinutes(focusInput.value);
      });
    }
    // 加减按钮
    document.querySelectorAll('.pomo-step').forEach(btn => {
      btn.addEventListener('click', () => {
        const delta = parseInt(btn.dataset.pomoDelta, 10) || 0;
        applyFocusMinutes(focusMinutes + delta);
      });
    });
    // 预设按钮
    document.querySelectorAll('.pomo-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        const v = parseInt(btn.dataset.pomoPreset, 10);
        if (!isNaN(v)) applyFocusMinutes(v);
      });
    });
    update();
  }

  // ========== 起居录辅助 ==========
  function ensureTodayDiary() {
    const log = Storage.get(Storage.KEYS.DIARY, { entries: [] });
    if (!log.entries) log.entries = [];
    const today = new Date().toISOString().slice(0, 10);
    if (!log.entries.find(e => e.date === today)) {
      log.entries.push({ date: today, events: [], shichenRecords: [] });
      Storage.set(Storage.KEYS.DIARY, log);
    }
    // 累计 daysActive
    const profile = Stats.getProfile();
    const dates = new Set(log.entries.map(e => e.date));
    profile.daysActive = dates.size;
    Stats.saveProfile(profile);
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', App.init);
