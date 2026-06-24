/* ============================================================
   城市守护者 · 苹果简约风格单页应用
   ============================================================ */

(function () {
  "use strict";

  const STATE = {
    tickets: JSON.parse(JSON.stringify(window.MOCK.seedTickets)),
    highlightedId: null,
    route: "home",
    params: {}
  };

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }

  function now() {
    const d = new Date();
    const pad = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  function randomOf(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function genTicketId() {
    const d = new Date();
    const pad = n => String(n).padStart(2, "0");
    const seq = String(Math.floor(Math.random() * 900) + 100);
    return `T-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${seq}`;
  }
  function categoryMeta(key) {
    return window.MOCK.categories.find(c => c.key === key) || window.MOCK.categories[0];
  }

  /* ============================================================
     路由 & 渲染
     ============================================================ */
  function navigate(route, params) {
    STATE.route = route;
    STATE.params = params || {};
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function render() {
    const root = $("#app");
    root.innerHTML = "";
    root.appendChild(buildTopBar());

    const wrap = document.createElement("div");
    wrap.className = "min-h-screen bg-slate-50 page-enter";
    root.appendChild(wrap);

    switch (STATE.route) {
      case "home":    wrap.appendChild(buildHomePage()); break;
      case "report":  wrap.appendChild(buildReportPage()); break;
      case "console": wrap.appendChild(buildConsolePage()); break;
      case "track":   wrap.appendChild(buildTrackPage()); break;
      case "ticket-detail": wrap.appendChild(buildTicketDetailPage(STATE.params.id)); break;
      default: wrap.appendChild(buildHomePage());
    }
    wrap.appendChild(buildFooter());
  }

  /* ============================================================
     顶部导航 & 底部
     ============================================================ */
  function buildTopBar() {
    const el = document.createElement("header");
    el.className = "sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200/50";
    el.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-apple-teal-500 to-apple-blue-500 flex items-center justify-center text-white text-xl shadow-sm">🏙️</div>
          <div>
            <div class="text-lg font-semibold text-slate-900 leading-tight">城市守护者</div>
            <div class="text-[10px] text-slate-500 leading-tight">市容管理 · 一键上报</div>
          </div>
        </div>
        <nav class="hidden md:flex items-center gap-1 text-sm">
          <button data-nav="home" class="px-4 py-2 rounded-xl ${STATE.route==='home'?'text-apple-blue-500 font-semibold bg-apple-blue-50':'text-slate-600 hover:bg-slate-100'} transition">市民首页</button>
          <button data-nav="report" class="px-4 py-2 rounded-xl ${STATE.route==='report'?'text-apple-blue-500 font-semibold bg-apple-blue-50':'text-slate-600 hover:bg-slate-100'} transition">随手上报</button>
          <button data-nav="track" class="px-4 py-2 rounded-xl ${(STATE.route==='track'||STATE.route==='ticket-detail')?'text-apple-blue-500 font-semibold bg-apple-blue-50':'text-slate-600 hover:bg-slate-100'} transition">我的工单</button>
          <span class="mx-2 text-slate-200">|</span>
          <button data-nav="console" class="px-4 py-2 rounded-xl inline-flex items-center gap-1.5 ${STATE.route==='console'?'text-apple-blue-500 font-semibold bg-apple-blue-50':'text-slate-600 hover:bg-slate-100'} transition">
            <span class="w-1.5 h-1.5 rounded-full bg-apple-teal-500 animate-pulse"></span>政务工作台
          </button>
        </nav>
        <div class="md:hidden">
          <select class="border border-slate-200 rounded-xl px-2 py-1.5 text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue-200" id="mobile-nav">
            <option value="home" ${STATE.route==='home'?'selected':''}>市民首页</option>
            <option value="report" ${STATE.route==='report'?'selected':''}>随手上报</option>
            <option value="track" ${STATE.route==='track'||STATE.route==='ticket-detail'?'selected':''}>我的工单</option>
            <option value="console" ${STATE.route==='console'?'selected':''}>政务工作台</option>
          </select>
        </div>
      </div>
    `;
    $all("[data-nav]", el).forEach(btn => btn.addEventListener("click", () => navigate(btn.dataset.nav)));
    const sel = $("#mobile-nav", el);
    if (sel) sel.addEventListener("change", (e) => navigate(e.target.value));
    return el;
  }

  function buildFooter() {
    const el = document.createElement("footer");
    el.className = "border-t border-slate-200/50 bg-white/80 mt-16";
    el.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-slate-500">
        <div class="mb-2"><span class="inline-block align-middle mr-1.5">🏙️</span><span class="font-semibold text-slate-800">城市守护者</span><span class="mx-2 text-slate-300">·</span><span>智慧城市 · 市容管理平台</span></div>
        <div class="text-xs">本页面为概念演示，数据均为模拟</div>
      </div>
    `;
    return el;
  }

  /* ============================================================
     页面 1：首页（苹果便餐盒风格）
     ============================================================ */
  function buildHomePage() {
    const el = document.createElement("main");
    el.className = "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8";

    el.innerHTML = `
      <!-- 顶部卡片 -->
      <div class="bg-gradient-to-br from-apple-teal-500 to-apple-blue-500 rounded-3xl p-6 sm:p-8 shadow-soft text-white mb-6">
        <div class="flex items-start justify-between mb-4">
          <div>
            <div class="text-sm font-medium text-white/80 mb-2">城市守护者</div>
            <h1 class="text-2xl sm:text-3xl font-bold">一键反馈市容问题</h1>
            <p class="text-white/80 text-sm mt-2">拍下身边问题，AI 智能识别派单</p>
          </div>
          <div class="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl">📸</div>
        </div>
        <button id="btn-start-report" class="w-full bg-white text-slate-900 font-semibold py-3.5 rounded-xl shadow-lg hover:shadow-xl transition flex items-center justify-center gap-2">
          <span>立即上报</span><span>→</span>
        </button>
        <div class="mt-6 grid grid-cols-3 gap-4">
          <div class="bg-white/15 backdrop-blur rounded-xl p-3 text-center">
            <div class="text-xl font-bold">${STATE.tickets.length}</div>
            <div class="text-xs text-white/70 mt-1">历史工单</div>
          </div>
          <div class="bg-white/15 backdrop-blur rounded-xl p-3 text-center">
            <div class="text-xl font-bold">${STATE.tickets.filter(t=>t.status==='closed').length}</div>
            <div class="text-xs text-white/70 mt-1">已办结</div>
          </div>
          <div class="bg-white/15 backdrop-blur rounded-xl p-3 text-center">
            <div class="text-xl font-bold">3min</div>
            <div class="text-xs text-white/70 mt-1">平均响应</div>
          </div>
        </div>
      </div>

      <!-- 四大分类卡片 -->
      <div class="mb-6">
        <h2 class="text-lg font-semibold text-slate-900 mb-4">问题分类</h2>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          ${window.MOCK.categories.map(c => `
            <button data-cat="${c.key}" class="bg-white rounded-2xl p-4 shadow-card hover:shadow-cardHover card-hover border border-slate-100">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-apple-teal-50 to-apple-blue-50 flex items-center justify-center text-2xl mb-3">${c.icon}</div>
              <div class="font-semibold text-slate-800 text-sm">${c.label}</div>
              <div class="text-xs text-slate-500 mt-1">派单至 ${c.targetDept}</div>
            </button>`).join("")}
        </div>
      </div>

      <!-- 我的工单快捷入口 -->
      <div class="bg-white rounded-2xl p-5 shadow-card border border-slate-100 mb-6 card-hover">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-semibold text-slate-900">我的工单</h3>
            <p class="text-sm text-slate-500 mt-1">查看上报记录与处理进度</p>
          </div>
          <button id="btn-goto-track" class="text-apple-blue-500 font-semibold flex items-center gap-1">
            <span>查看</span><span>→</span>
          </button>
        </div>
        ${STATE.tickets.slice(0, 2).map(t => {
          const meta = categoryMeta(t.category);
          return `<div class="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-apple-teal-50 to-apple-blue-50 flex items-center justify-center text-lg">${meta.icon}</div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-slate-800 text-sm truncate">${t.title}</div>
              <div class="text-xs text-slate-500 mt-0.5">${t.createdAt}</div>
            </div>
            <span class="${t.status==='closed'?'bg-apple-teal-100 text-apple-teal-600':'bg-amber-100 text-amber-600'} text-xs font-medium px-2.5 py-1 rounded-full">${t.status==='closed'?'已办结':'处理中'}</span>
          </div>`;
        }).join("")}
      </div>

      <!-- 流程说明 -->
      <div class="bg-white rounded-2xl p-5 shadow-card border border-slate-100 mb-6">
        <h3 class="font-semibold text-slate-900 mb-4 text-center">闭环流程</h3>
        <div class="grid grid-cols-4 gap-4">
          ${[{n:1,t:"拍照上报",d:"一键定位上传"},{n:2,t:"AI识别",d:"智能分析内容"},{n:3,t:"自动派单",d:"直达职能部门"},{n:4,t:"反馈结果",d:"前后对比展示"}].map(s=>`
            <div class="text-center">
              <div class="w-10 h-10 rounded-full bg-gradient-to-br from-apple-teal-500 to-apple-blue-500 text-white text-sm font-bold flex items-center justify-center mx-auto mb-2">${s.n}</div>
              <div class="font-medium text-slate-800 text-sm">${s.t}</div>
              <div class="text-xs text-slate-500 mt-1">${s.d}</div>
            </div>`).join("")}
        </div>
      </div>

      <!-- 政务工作台入口 -->
      <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
        <div class="flex items-start justify-between">
          <div>
            <div class="text-sm text-white/60 mb-1">G 端演示</div>
            <h3 class="text-xl font-bold">AI 智能分流工作台</h3>
            <p class="text-white/70 text-sm mt-2">实时接收市民上报，自动派单至对应部门</p>
          </div>
          <button id="btn-goto-console" class="bg-white text-slate-900 font-semibold px-4 py-2 rounded-xl hover:bg-slate-100 transition flex items-center gap-2">
            <span>进入</span><span>→</span>
          </button>
        </div>
      </div>
    `;

    $("#btn-start-report", el).addEventListener("click", () => navigate("report"));
    $("#btn-goto-track", el).addEventListener("click", () => navigate("track"));
    $("#btn-goto-console", el).addEventListener("click", () => navigate("console"));
    $all("[data-cat]", el).forEach(card => card.addEventListener("click", () => navigate("report", { category: card.dataset.cat }));
    return el;
  }

  /* ============================================================
     页面 2：上报表单页
     ============================================================ */
  function buildReportPage() {
    const el = document.createElement("main");
    el.className = "max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8";
    const initCat = (STATE.params && STATE.params.category) || "parking";

    el.innerHTML = `
      <div class="mb-6">
        <button id="btn-back" class="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition">← 返回</button>
        <h1 class="text-2xl font-bold text-slate-900 mt-4">随手上报</h1>
        <p class="text-sm text-slate-500 mt-1">填写信息后提交，系统将进行 AI 审核</p>
      </div>

      <div class="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden">
        <!-- 分类选择 -->
        <div class="p-4 border-b border-slate-100">
          <div class="text-sm font-medium text-slate-700 mb-3">问题分类</div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            ${window.MOCK.categories.map(c => `
              <button data-cat="${c.key}" class="py-3 rounded-xl border text-sm font-medium transition ${c.key===initCat?'border-apple-blue-300 bg-apple-blue-50 text-apple-blue-600':'border-slate-200 text-slate-600 hover:border-slate-300'}">
                <span class="text-lg">${c.icon}</span>
                <div class="mt-1">${c.label}</div>
              </button>`).join("")}
          </div>
        </div>

        <!-- 拍照区域 -->
        <div class="p-4 border-b border-slate-100">
          <div class="text-sm font-medium text-slate-700 mb-3">拍照 / 上传</div>
          <div id="photo-zone" class="border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 p-8 text-center cursor-pointer hover:border-apple-blue-300 transition">
            <div id="photo-empty">
              <div class="text-5xl mb-3">📷</div>
              <div class="font-medium text-slate-700">点击拍照</div>
              <div class="text-xs text-slate-500 mt-1">系统将加载示例照片</div>
            </div>
            <div id="photo-filled" class="hidden">
              <img id="photo-img" src="" class="w-full h-64 object-cover rounded-lg" />
              <div class="flex justify-between items-center mt-3">
                <span class="text-xs text-slate-500">📍 <span id="photo-address">定位中...</span></span>
                <button id="photo-retake" class="text-sm text-apple-blue-500 font-medium">重新拍照</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 位置与时间 -->
        <div class="p-4 border-b border-slate-100 grid grid-cols-2 gap-3">
          <div>
            <div class="text-xs text-slate-500 mb-1">当前位置</div>
            <div id="fld-address" class="text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2">获取定位中...</div>
          </div>
          <div>
            <div class="text-xs text-slate-500 mb-1">上报时间</div>
            <div id="fld-time" class="text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2">—</div>
          </div>
        </div>

        <!-- 描述输入 -->
        <div class="p-4 border-b border-slate-100">
          <div class="text-sm font-medium text-slate-700 mb-2">问题描述 <span class="text-xs font-normal text-slate-400">至少 8 字</span></div>
          <textarea id="fld-desc" rows="3" maxlength="300" placeholder="请描述问题详情..." class="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue-200 focus:border-apple-blue-400 resize-none"></textarea>
          <div class="flex items-center justify-between mt-2 text-xs">
            <span id="fld-desc-hint" class="text-slate-500">请输入描述</span>
            <span class="text-slate-400"><span id="fld-desc-n">0</span>/300</span>
          </div>
        </div>

        <!-- 提交按钮 -->
        <div class="p-4">
          <button id="btn-submit" disabled class="w-full bg-slate-200 text-slate-400 font-semibold py-3 rounded-xl cursor-not-allowed">请完善信息</button>
        </div>
      </div>

      <!-- 侧边提示 -->
      <div class="mt-4 bg-apple-teal-50 rounded-xl p-4">
        <div class="flex items-center gap-2 text-apple-teal-700 font-medium text-sm">
          <span>💡</span><span>演示小贴士</span>
        </div>
        <ul class="mt-2 text-xs text-slate-600 space-y-1">
          <li>① 选择分类后点击拍照，系统自动加载示例图</li>
          <li>② 位置与时间会自动填入</li>
          <li>③ 描述需 ≥ 8 字才能提交</li>
          <li>④ 提交后展示 AI 审核动画</li>
        </ul>
      </div>
    `;

    let currentCategory = initCat;
    let photoLoaded = false;
    const photoEmpty = $("#photo-empty", el), photoFilled = $("#photo-filled", el), photoImg = $("#photo-img", el);
    const fldAddress = $("#fld-address", el), fldTime = $("#fld-time", el);
    const fldDesc = $("#fld-desc", el), fldDescN = $("#fld-desc-n", el), fldDescHint = $("#fld-desc-hint", el);
    const btnSubmit = $("#btn-submit", el);

    function photoForCat(catKey) {
      const imgs = window.MOCK.images;
      if (catKey === "parking") return imgs.parkingBefore;
      if (catKey === "trash") return imgs.trashBefore;
      return Math.random() > 0.5 ? imgs.parkingBefore : imgs.trashBefore;
    }

    function loadPhoto() {
      photoEmpty.classList.add("hidden"); photoFilled.classList.remove("hidden");
      photoImg.src = photoForCat(currentCategory);
      photoLoaded = true;
      fldAddress.textContent = "获取定位中...";
      setTimeout(() => {
        const addr = randomOf(window.MOCK.addresses);
        fldAddress.textContent = addr;
        $("#photo-address", el).textContent = addr;
      }, 500);
      fldTime.textContent = now();
      validateForm();
    }

    function validateForm() {
      const n = fldDesc.value.trim().length;
      fldDescN.textContent = n;
      const ok = photoLoaded && n >= 8;
      
      if (n === 0) {
        fldDescHint.className = "text-slate-500";
        fldDescHint.textContent = "请输入描述";
      } else if (n < 8) {
        fldDescHint.className = "text-rose-500 font-medium";
        fldDescHint.textContent = "请输入 8 字以上描述";
      } else {
        fldDescHint.className = "text-apple-teal-600 font-medium";
        fldDescHint.textContent = "✓ 描述完整";
      }

      if (ok) {
        btnSubmit.disabled = false;
        btnSubmit.className = "w-full shimmer-btn text-white font-semibold py-3 rounded-xl hover:shadow-lg transition";
        btnSubmit.textContent = "提交上报 · AI 审核";
      } else {
        btnSubmit.disabled = true;
        btnSubmit.className = "w-full bg-slate-200 text-slate-400 font-semibold py-3 rounded-xl cursor-not-allowed";
        btnSubmit.textContent = photoLoaded ? "请输入 8 字以上描述" : "请先拍照";
      }
    }

    $("#photo-zone", el).addEventListener("click", (e) => { if (e.target.id === "photo-retake") return; loadPhoto(); });
    $("#photo-retake", el).addEventListener("click", (e) => { e.stopPropagation(); loadPhoto(); });
    fldDesc.addEventListener("input", validateForm);
    $all("[data-cat]", el).forEach(pill => {
      pill.addEventListener("click", () => {
        currentCategory = pill.dataset.cat;
        $all("[data-cat]", el).forEach(p => p.className = "py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:border-slate-300 transition");
        pill.className = "py-3 rounded-xl border border-apple-blue-300 bg-apple-blue-50 text-sm font-medium text-apple-blue-600 transition";
        if (photoLoaded) loadPhoto();
      });
    });
    validateForm();

    $("#btn-back", el).addEventListener("click", () => navigate("home"));
    btnSubmit.addEventListener("click", () => {
      if (btnSubmit.disabled) return;
      const meta = categoryMeta(currentCategory);
      const newTicket = {
        id: genTicketId(), category: currentCategory,
        title: (fldDesc.value.trim().slice(0, 18) || "市民上报市容问题"),
        description: fldDesc.value.trim(),
        imgBefore: photoImg.src || null, imgAfter: null,
        address: fldAddress.textContent, submitter: "市民 我**",
        createdAt: now(), aiRecognizedAt: null, dispatchedAt: null,
        processedAt: null, closedAt: null, status: "ai-pending",
        plate: currentCategory === "parking" ? randomOf(window.MOCK.plates) : null,
        targetDept: meta.targetDept, aiResult: null, processingNote: null
      };
      STATE.tickets.unshift(newTicket);
      STATE.highlightedId = newTicket.id;
      showAiReviewOverlay(newTicket, () => navigate("ticket-detail", { id: newTicket.id, justSubmitted: true }));
    });
    return el;
  }

  /* ============================================================
     AI 审核浮层
     ============================================================ */
  function showAiReviewOverlay(ticket, onDone) {
    const existing = $("#ai-overlay");
    if (existing) existing.remove();
    const meta = categoryMeta(ticket.category);

    const overlay = document.createElement("div");
    overlay.id = "ai-overlay";
    overlay.className = "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4";
    overlay.innerHTML = `
      <div class="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div class="bg-gradient-to-r from-apple-teal-500 to-apple-blue-500 px-6 py-4 text-white">
          <div class="flex items-center gap-3">
            <span class="text-2xl">🤖</span>
            <div>
              <div class="font-semibold">AI 审核中...</div>
              <div class="text-xs text-white/80">工单编号：${ticket.id}</div>
            </div>
          </div>
        </div>
        <div class="p-5">
          <div class="mb-4">
            <div class="text-xs text-slate-500 mb-2">上报照片</div>
            <div class="scanline-box rounded-xl overflow-hidden bg-slate-100 h-48">
              <img src="${ticket.imgBefore}" class="w-full h-full object-cover" />
            </div>
          </div>
          <div class="space-y-2 mb-4">
            ${[{k:"vision", label:"视觉识别", detail:"分析图像..."},{k:"plate", label:"车牌识别", detail:"扫描中...", show: ticket.category==="parking"},{k:"nlp", label:"语义分析", detail:"分析描述..."},{k:"dispatch", label:"智能派单", detail:"匹配部门..."}].filter(s=>s.show!==false).map(s=>`
              <div data-step="${s.k}" class="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2">
                <div class="w-6 h-6 rounded-full border-2 border-slate-300 flex items-center justify-center text-xs text-slate-400">·</div>
                <div class="flex-1">
                  <div class="text-sm font-medium text-slate-700">${s.label}</div>
                  <div class="text-xs text-slate-500">${s.detail}</div>
                </div>
                <div class="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div class="h-full bg-apple-teal-500 rounded-full" style="width:0%;transition:width .5s ease;"></div>
                </div>
              </div>`).join("")}
          </div>
          <div id="ai-result" class="hidden">
            <div class="bg-apple-teal-50 border border-apple-teal-200 rounded-xl p-4">
              <div class="flex items-center gap-2 text-apple-teal-700 font-semibold">
                <span>✅</span><span>审核通过</span>
              </div>
              <div class="mt-3 grid grid-cols-2 gap-3 text-sm">
                ${ticket.plate ? `<div><div class="text-xs text-slate-500">识别车牌</div><div class="font-mono font-semibold">${ticket.plate}</div></div>` : ""}
                <div><div class="text-xs text-slate-500">派单部门</div><div class="font-semibold text-apple-blue-600">${meta.targetDept}</div></div>
              </div>
              <div class="mt-4 flex gap-3">
                <button id="ai-goto-detail" class="flex-1 bg-apple-teal-500 text-white font-semibold py-2.5 rounded-xl">查看进度</button>
                <button id="ai-goto-console" class="flex-1 bg-slate-800 text-white font-semibold py-2.5 rounded-xl">政务工作台</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const steps = $all("[data-step]", overlay);
    steps.forEach((step, idx) => {
      setTimeout(() => {
        const dot = step.querySelector("div:first-child");
        const bar = step.querySelector("div:last-child div");
        dot.classList.remove("border-slate-300","text-slate-400");
        dot.classList.add("border-apple-teal-500","bg-apple-teal-500","text-white");
        dot.textContent = idx + 1;
        if (bar) bar.style.width = "100%";
      }, 600 + idx * 500);
    });

    setTimeout(() => {
      ticket.status = "dispatched"; ticket.aiRecognizedAt = now(); ticket.dispatchedAt = now();
      ticket.aiResult = meta.label + " · 信息完整";
      $("#ai-result", overlay).style.display = "block";
      $("#ai-goto-detail", overlay).addEventListener("click", () => { overlay.remove(); onDone && onDone(); });
      $("#ai-goto-console", overlay).addEventListener("click", () => { overlay.remove(); navigate("console", { newTicketId: ticket.id }); });
    }, 600 + steps.length * 500 + 300);
  }

  /* ============================================================
     页面 3：G 端工作台
     ============================================================ */
  function buildConsolePage() {
    const el = document.createElement("main");
    el.className = "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8";
    const focusId = (STATE.params && STATE.params.newTicketId) || STATE.highlightedId || STATE.tickets[0].id;
    const focusTicket = STATE.tickets.find(t => t.id === focusId) || STATE.tickets[0];

    el.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <div class="inline-flex items-center gap-2 text-xs font-medium text-apple-blue-500 bg-apple-blue-50 px-3 py-1 rounded-full">
            <span class="w-1.5 h-1.5 rounded-full bg-apple-teal-500 animate-pulse"></span>G 端 · 实时
          </div>
          <h1 class="text-2xl font-bold text-slate-900 mt-3">AI 智能分流工作台</h1>
        </div>
        <div class="flex items-center gap-2">
          <button id="btn-simulate" class="bg-apple-teal-500 text-white font-semibold px-4 py-2 rounded-xl hover:bg-apple-teal-600 transition">模拟上报</button>
          <button id="btn-back-home" class="border border-slate-200 text-slate-700 font-medium px-4 py-2 rounded-xl hover:bg-slate-50 transition">返回市民端</button>
        </div>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        ${[{l:"今日上报",v: STATE.tickets.length + 215},{l:"AI 派单",v: Math.floor((STATE.tickets.length + 215)*0.9)},{l:"处理中",v: STATE.tickets.filter(t=>t.status!=="closed").length + 42},{l:"已办结",v: STATE.tickets.filter(t=>t.status==="closed").length + 173}].map(s=>`
          <div class="bg-white rounded-xl p-4 shadow-card border border-slate-100">
            <div class="text-xs text-slate-500 mb-1">${s.l}</div>
            <div class="text-2xl font-bold text-slate-900">${s.v}</div>
          </div>`).join("")}
      </div>

      <div class="grid lg:grid-cols-3 gap-4">
        <div class="bg-white rounded-2xl shadow-card border border-slate-100 p-4 lg:col-span-1">
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-semibold text-slate-900">实时工单流</h2>
            <span class="text-xs text-slate-500">${STATE.tickets.length} 条</span>
          </div>
          <div class="space-y-2 max-h-[560px] overflow-y-auto scroll-thin">
            ${STATE.tickets.map(t => renderConsoleCard(t, t.id === focusTicket.id)).join("")}
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow-card border border-slate-100 p-5 lg:col-span-2">
          ${renderConsoleDetail(focusTicket)}
        </div>
      </div>
    `;

    $("#btn-back-home", el).addEventListener("click", () => navigate("home"));
    $("#btn-simulate", el).addEventListener("click", () => simulateNewTicket());

    $all("[data-ticket-id]", el).forEach(card => {
      card.addEventListener("click", () => {
        const id = card.dataset.ticketId;
        const t = STATE.tickets.find(x => x.id === id); if (!t) return;
        $all("[data-ticket-id]", el).forEach(c => c.classList.remove("ring-2","ring-apple-blue-300"));
        card.classList.add("ring-2","ring-apple-blue-300");
        const detail = el.querySelector(".lg\\:col-span-2");
        detail.innerHTML = renderConsoleDetail(t);
      });
    });

    return el;
  }

  function renderConsoleCard(t, highlight) {
    const meta = categoryMeta(t.category);
    const map = { "ai-pending":"bg-amber-50 text-amber-600", "dispatched":"bg-apple-blue-50 text-apple-blue-600", "queued":"bg-slate-100 text-slate-600", "closed":"bg-apple-teal-50 text-apple-teal-600" };
    const s = map[t.status] || map.queued;
    const statusLabel = { "ai-pending":"AI识别中", "dispatched":"已派单", "queued":"待受理", "closed":"已办结" };
    return `
      <div data-ticket-id="${t.id}" class="p-3 rounded-xl cursor-pointer transition ${highlight?"bg-apple-blue-50 ring-2 ring-apple-blue-300":"bg-white hover:bg-slate-50"} border border-slate-100">
        <div class="flex items-start gap-2">
          <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-apple-teal-50 to-apple-blue-50 flex items-center justify-center text-lg">${meta.icon}</div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2">
              <span class="text-sm font-medium text-slate-800 truncate">${t.title}</span>
              <span class="text-[10px] font-medium ${s} px-2 py-0.5 rounded-full">${statusLabel[t.status]}</span>
            </div>
            <div class="text-xs text-slate-500 mt-0.5">📍 ${t.address}</div>
            <div class="text-[10px] text-slate-400 mt-0.5">${t.createdAt}</div>
          </div>
        </div>
      </div>`;
  }

  function renderConsoleDetail(t) {
    const meta = categoryMeta(t.category);
    const closed = t.status === "closed";
    return `
      <div class="flex items-start justify-between mb-4">
        <div>
          <div class="text-xs text-slate-500 font-mono">${t.id}</div>
          <h3 class="text-lg font-bold text-slate-900 mt-1">${meta.icon} ${t.title}</h3>
          <div class="text-sm text-slate-500 mt-1">📍 ${t.address} · ${t.createdAt}</div>
        </div>
        <div>
          <div class="text-xs text-slate-500">派单部门</div>
          <div class="text-apple-blue-600 font-semibold">${meta.targetDept}</div>
        </div>
      </div>

      <div class="grid md:grid-cols-2 gap-4">
        <div>
          <div class="text-xs text-slate-500 mb-2">上报照片</div>
          <div class="relative rounded-xl overflow-hidden bg-slate-100 h-52">
            ${t.imgBefore ? `<img src="${t.imgBefore}" class="w-full h-full object-cover" />` : `<div class="w-full h-full flex items-center justify-center text-slate-400">无图片</div>`}
            ${!closed ? `<div class="absolute top-2 left-2 bg-apple-teal-500/90 text-white text-xs px-2 py-1 rounded-lg">AI 识别中</div>` : ""}
          </div>
          ${closed && t.imgAfter ? `
            <div class="mt-3 rounded-xl border border-apple-teal-200 overflow-hidden">
              <div class="px-3 py-2 bg-apple-teal-50 text-xs font-medium text-apple-teal-700">处理对比</div>
              <div class="grid grid-cols-2">
                <div><img src="${t.imgBefore}" class="w-full h-28 object-cover" /><div class="text-[10px] text-center text-slate-500 mt-1">处理前</div></div>
                <div><img src="${t.imgAfter}" class="w-full h-28 object-cover" /><div class="text-[10px] text-center text-slate-500 mt-1">处理后</div></div>
              </div>
            </div>` : ""}
        </div>

        <div>
          <div class="bg-slate-50 rounded-xl p-3 mb-3">
            <div class="text-xs text-slate-500">市民描述</div>
            <div class="text-sm text-slate-700 mt-1">${t.description}</div>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div class="bg-slate-50 rounded-lg p-2">
              <div class="text-xs text-slate-500">分类</div>
              <div class="text-sm font-medium">${meta.icon} ${meta.label}</div>
            </div>
            <div class="bg-slate-50 rounded-lg p-2">
              <div class="text-xs text-slate-500">上报人</div>
              <div class="text-sm font-medium">${t.submitter}</div>
            </div>
            ${t.plate ? `<div class="bg-slate-50 rounded-lg p-2 col-span-2">
              <div class="text-xs text-slate-500">识别车牌</div>
              <div class="font-mono font-bold">${t.plate}</div>
            </div>` : ""}
          </div>

          <div class="mt-3 bg-white border border-slate-200 rounded-xl p-3">
            <div class="text-xs text-slate-500 mb-2">处理时间线</div>
            <ol class="space-y-2 text-xs">
              ${[{ok:!0,title:"市民上报",time:t.createdAt},{ok:!!t.aiRecognizedAt,title:"AI 识别",time:t.aiRecognizedAt},{ok:!!t.dispatchedAt,title:`派单至${meta.targetDept}`,time:t.dispatchedAt},{ok:!!t.processedAt,title:"现场处置",time:t.processedAt},{ok:closed,title:"工单办结",time:t.closedAt}].map(s=>`
                <li class="flex items-start gap-2">
                  <span class="w-2.5 h-2.5 rounded-full mt-0.5 ${s.ok?"bg-apple-teal-500":"bg-slate-300"}"></span>
                  <div>
                    <div class="${s.ok?"text-slate-700 font-medium":"text-slate-400"}">${s.ok?s.title:s.title+" · 待触发"}</div>
                    <div class="text-slate-400">${s.time||"—"}</div>
                  </div>
                </li>`).join("")}
            </ol>
          </div>
        </div>
      </div>

      <div class="mt-4 bg-gradient-to-r from-apple-teal-50 to-apple-blue-50 rounded-xl p-4 text-center">
        <div class="text-sm font-semibold text-slate-800">已自动匹配派单至：<span class="text-apple-blue-600">${meta.targetDept}</span></div>
        <div class="text-xs text-slate-500 mt-1">工单将进入对应部门处理队列</div>
      </div>
    `;
  }

  function simulateNewTicket() {
    const catKey = randomOf(window.MOCK.categories).key;
    const meta = categoryMeta(catKey);
    const sampleTitles = { parking:"路口车辆违章占道", trash:"生活垃圾堆放", damage:"设施损坏", green:"绿化破坏" };
    const newTicket = {
      id: genTicketId(), category: catKey,
      title: sampleTitles[catKey] || "市民上报市容问题",
      description: "发现市容问题，已拍照上报，请相关部门处理。",
      imgBefore: catKey === "parking" ? window.MOCK.images.parkingBefore : window.MOCK.images.trashBefore,
      imgAfter: null, address: randomOf(window.MOCK.addresses), submitter: "市民 模**",
      createdAt: now(), aiRecognizedAt: null, dispatchedAt: null,
      processedAt: null, closedAt: null, status: "ai-pending",
      plate: catKey === "parking" ? randomOf(window.MOCK.plates) : null,
      targetDept: meta.targetDept, aiResult: null, processingNote: null
    };
    STATE.tickets.unshift(newTicket);
    STATE.highlightedId = newTicket.id;
    navigate("console", { newTicketId: newTicket.id });
  }

  /* ============================================================
     页面 4：工单追踪
     ============================================================ */
  function buildTrackPage() {
    const el = document.createElement("main");
    el.className = "max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8";
    const total = STATE.tickets.length, done = STATE.tickets.filter(t => t.status === "closed").length, doing = total - done;

    el.innerHTML = `
      <div class="mb-6">
        <button id="btn-back" class="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition">← 返回</button>
        <h1 class="text-2xl font-bold text-slate-900 mt-4">我的工单</h1>
      </div>

      <div class="grid grid-cols-3 gap-3 mb-6">
        <div class="bg-white rounded-xl p-4 shadow-card border border-slate-100 text-center">
          <div class="text-2xl font-bold text-slate-900">${total}</div>
          <div class="text-xs text-slate-500 mt-1">全部工单</div>
        </div>
        <div class="bg-white rounded-xl p-4 shadow-card border border-slate-100 text-center">
          <div class="text-2xl font-bold text-apple-blue-500">${doing}</div>
          <div class="text-xs text-slate-500 mt-1">处理中</div>
        </div>
        <div class="bg-white rounded-xl p-4 shadow-card border border-slate-100 text-center">
          <div class="text-2xl font-bold text-apple-teal-500">${done}</div>
          <div class="text-xs text-slate-500 mt-1">已办结</div>
        </div>
      </div>

      <div class="space-y-3">
        ${STATE.tickets.length === 0 ? `
          <div class="bg-white rounded-xl p-8 text-center shadow-card border border-slate-100">
            <div class="text-4xl mb-3">📭</div>
            <div class="font-medium text-slate-700">暂无工单</div>
            <button id="btn-new-report" class="mt-4 bg-apple-teal-500 text-white font-medium px-4 py-2 rounded-xl">立即上报</button>
          </div>` :
          STATE.tickets.map(t => renderTrackCard(t)).join("")}
      </div>
    `;

    $("#btn-back", el).addEventListener("click", () => navigate("home"));
    const newBtn = $("#btn-new-report", el); if (newBtn) newBtn.addEventListener("click", () => navigate("report"));
    $all(".track-card", el).forEach(card => card.addEventListener("click", () => navigate("ticket-detail", { id: card.dataset.ticketId })));
    return el;
  }

  function renderTrackCard(t) {
    const meta = categoryMeta(t.category);
    const map = { "ai-pending":"bg-amber-50 text-amber-600", "dispatched":"bg-apple-blue-50 text-apple-blue-600", "queued":"bg-slate-100 text-slate-600", "closed":"bg-apple-teal-50 text-apple-teal-600" };
    const statusLabel = { "ai-pending":"AI识别中", "dispatched":"已派单", "queued":"待受理", "closed":"已办结" };
    const s = map[t.status] || map.queued;

    return `
      <div data-ticket-id="${t.id}" class="track-card bg-white rounded-xl p-4 shadow-card border border-slate-100 card-hover cursor-pointer">
        <div class="flex items-start gap-3">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-apple-teal-50 to-apple-blue-50 flex items-center justify-center text-xl">${meta.icon}</div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2">
              <span class="font-medium text-slate-800">${t.title}</span>
              <span class="text-xs font-medium ${s} px-2.5 py-1 rounded-full">${statusLabel[t.status]}</span>
            </div>
            <div class="text-xs text-slate-500 mt-1">📍 ${t.address}</div>
            <div class="text-xs text-slate-400 mt-0.5">${t.id} · ${t.createdAt}</div>
            ${t.status === "closed" ? `
              <div class="mt-2 rounded-lg border border-apple-teal-200 overflow-hidden flex">
                <img src="${t.imgBefore}" class="w-16 h-16 object-cover" />
                <div class="w-16 h-16 bg-apple-teal-100 flex items-center justify-center text-xs font-medium text-apple-teal-600">处理后</div>
              </div>` : ""}
          </div>
          <div class="text-slate-300">›</div>
        </div>
      </div>`;
  }

  /* ============================================================
     页面 5：工单详情
     ============================================================ */
  function buildTicketDetailPage(id) {
    const t = STATE.tickets.find(x => x.id === id) || STATE.tickets[0];
    const el = document.createElement("main");
    el.className = "max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8";
    const meta = categoryMeta(t.category);

    el.innerHTML = `
      <div class="mb-6">
        <button id="btn-back" class="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition">← 返回工单列表</button>
        <div class="text-xs text-slate-500 font-mono mt-4">工单编号：${t.id}</div>
        <h1 class="text-2xl font-bold text-slate-900 mt-1">${meta.icon} ${t.title}</h1>
        <p class="text-sm text-slate-500 mt-1">📍 ${t.address} · ${t.createdAt}</p>
      </div>

      <div class="grid lg:grid-cols-3 gap-4">
        <!-- 左侧时间线 -->
        <div class="bg-white rounded-xl shadow-card border border-slate-100 p-4">
          <h2 class="font-semibold text-slate-900 mb-4">处理进度</h2>
          <ol class="space-y-4">
            ${[{ok:!0,title:"您提交了上报",time:t.createdAt,desc:t.description},{ok:!!t.aiRecognizedAt,title:"AI 完成初审",time:t.aiRecognizedAt,desc:t.aiResult||"识别中..."},{ok:!!t.dispatchedAt,title:`自动派单至 ${meta.targetDept}`,time:t.dispatchedAt,desc:"工单已进入处理队列"},{ok:!!t.processedAt,title:"现场处置完成",time:t.processedAt,desc:t.processingNote||"工作人员已到达现场"},{ok:t.status==="closed",title:"工单办结",time:t.closedAt,desc:"感谢您的反馈"}].map(s=>`
              <li class="relative pl-6 border-l-2 ${s.ok?"border-apple-teal-300":"border-slate-200"}">
                <span class="absolute -left-2.5 top-0 w-5 h-5 rounded-full ${s.ok?"bg-apple-teal-500 ring-4 ring-apple-teal-100":"bg-slate-300"}"></span>
                <div class="${s.ok?"font-medium text-slate-800":"text-slate-400"}">${s.title}</div>
                <div class="text-xs text-slate-500 mt-0.5">${s.time||"待触发"}</div>
                <div class="text-xs text-slate-600 mt-1">${s.desc}</div>
              </li>`).join("")}
          </ol>
        </div>

        <!-- 右侧详情 -->
        <div class="lg:col-span-2 space-y-4">
          <div class="bg-white rounded-xl shadow-card border border-slate-100 p-4">
            <h2 class="font-semibold text-slate-900 mb-3">问题详情</h2>
            <div class="bg-slate-50 rounded-lg p-3 text-sm text-slate-700">${t.description}</div>
            <div class="mt-3 grid grid-cols-2 gap-2">
              <div class="bg-slate-50 rounded-lg p-2">
                <div class="text-xs text-slate-500">分类</div>
                <div class="text-sm font-medium">${meta.icon} ${meta.label}</div>
              </div>
              <div class="bg-slate-50 rounded-lg p-2">
                <div class="text-xs text-slate-500">派单部门</div>
                <div class="text-sm font-medium text-apple-blue-600">${meta.targetDept}</div>
              </div>
              ${t.plate ? `<div class="bg-slate-50 rounded-lg p-2 col-span-2">
                <div class="text-xs text-slate-500">识别车牌</div>
                <div class="font-mono font-bold">${t.plate}</div>
              </div>` : ""}
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-card border border-slate-100 overflow-hidden">
            <div class="px-4 py-3 border-b border-slate-100">
              <h2 class="font-semibold text-slate-900">处理前后对比</h2>
            </div>
            ${t.status === "closed" && t.imgAfter ? `
              <div class="grid md:grid-cols-2">
                <div class="relative">
                  <img src="${t.imgBefore}" class="w-full h-64 object-cover" />
                  <div class="absolute top-3 left-3 bg-rose-500/90 text-white text-xs px-2.5 py-1 rounded-lg">处理前</div>
                </div>
                <div class="relative">
                  <img src="${t.imgAfter}" class="w-full h-64 object-cover" />
                  <div class="absolute top-3 left-3 bg-apple-teal-500/90 text-white text-xs px-2.5 py-1 rounded-lg">处理后</div>
                </div>
              </div>
              <div class="px-4 py-3 bg-slate-50 border-t border-slate-100">
                <div class="text-sm text-slate-600"><span class="font-medium text-slate-800">处置说明：</span>${t.processingNote || "相关部门已完成处置"}</div>
              </div>` : `
              <div class="p-6 text-center">
                <div class="grid md:grid-cols-2 gap-4">
                  <div><img src="${t.imgBefore}" class="w-full h-48 object-cover rounded-lg" /><div class="text-xs text-slate-500 mt-2">您提交的照片</div></div>
                  <div class="bg-slate-50 rounded-lg h-48 flex items-center justify-center">
                    <div class="text-center">
                      <div class="text-3xl mb-2">⏳</div>
                      <div class="text-sm text-slate-500">等待处理完成</div>
                    </div>
                  </div>
                </div>
              </div>`}
          </div>

          <div class="grid grid-cols-2 gap-3">
            <button id="btn-goto-console" class="bg-slate-800 text-white font-medium py-3 rounded-xl hover:bg-slate-900 transition">政务工作台</button>
            <button id="btn-goto-report" class="bg-apple-teal-500 text-white font-medium py-3 rounded-xl hover:bg-apple-teal-600 transition">继续上报</button>
          </div>
        </div>
      </div>
    `;

    $("#btn-back", el).addEventListener("click", () => navigate("track"));
    $("#btn-goto-console", el).addEventListener("click", () => navigate("console", { newTicketId: t.id }));
    $("#btn-goto-report", el).addEventListener("click", () => navigate("report"));
    return el;
  }

  /* ============================================================
     初次渲染
     ============================================================ */
  render();
}());
