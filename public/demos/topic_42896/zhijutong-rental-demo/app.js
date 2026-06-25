/* ===== 智居通租房 Demo — app.js ===== */

(function () {
  "use strict";

  var DEMO_VERSION = "appointment-rules-v3";

  /* ---------- seed data ---------- */
  var seedListings = [
    { id:"home-001",title:"近地铁精装一居室",area:"海淀 · 西二旗",price:4800,size:42,tags:["近地铁","采光好","支持 VR","自助看房"],description:"步行 6 分钟到地铁站，适合通勤人群。房源已通过平台认证，支持线上 VR 初筛和预约自助看房。",status:"已认证",hasVr:true,hasSelfViewing:true,cameraOnline:true,lockOnline:true,appointments:[] },
    { id:"home-002",title:"安静小区两居室",area:"滨江 · 星光大道",price:6200,size:76,tags:["安静小区","拎包入住","平台摄像头","自助看房"],description:"小区环境安静，家具家电齐全。适合情侣或小家庭，支持身份认证后预约实地看房。",status:"已认证",hasVr:false,hasSelfViewing:true,cameraOnline:true,lockOnline:true,appointments:[] },
    { id:"home-003",title:"采光通透单间",area:"天河 · 体育西",price:2800,size:22,tags:["采光好","短租友好","支持 VR"],description:"适合刚到城市的年轻租客，线上信息完整，可先通过 demo 视频和 VR 了解房间情况。",status:"已认证",hasVr:true,hasSelfViewing:false,cameraOnline:false,lockOnline:false,appointments:[] }
  ];

  var state = {
    version:DEMO_VERSION,
    role:"rent",           // "rent" | "landlord"
    tab:"rent-search",     // active tab id
    tenantVerified:true,
    landlordVerified:true,
    videoAttached:false,
    vrAttached:false,
    logs:[],
    listings:[]
  };

  var els = {};

  function cacheEls() {
    els = {
      roleBadge:document.getElementById("roleBadge"),
      mainContent:document.getElementById("mainContent"),
      tabBar:document.getElementById("tabBar"),
      tabBtns:document.querySelectorAll(".tab-btn"),
      tabPages:document.querySelectorAll(".tab-page"),
      verifyTenantBtn:document.getElementById("verifyTenantBtn"),
      tenantStatus:document.getElementById("tenantStatus"),
      tenantStatusProfile:document.getElementById("tenantStatusProfile"),
      tenantAuthBar:document.getElementById("tenantAuthBar"),
      verifyLandlordBtn:document.getElementById("verifyLandlordBtn"),
      landlordStatus:document.getElementById("landlordStatus"),
      landlordStatusProfile:document.getElementById("landlordStatusProfile"),
      landlordAuthBar:document.getElementById("landlordAuthBar"),
      listingGrid:document.getElementById("listingGrid"),
      tenantApptList:document.getElementById("tenantApptList"),
      landlordApptList:document.getElementById("landlordApptList"),
      searchInput:document.getElementById("searchInput"),
      priceFilter:document.getElementById("priceFilter"),
      vrFilter:document.getElementById("vrFilter"),
      listingForm:document.getElementById("listingForm"),
      attachVideoBtn:document.getElementById("attachVideoBtn"),
      attachVrBtn:document.getElementById("attachVrBtn"),
      mediaAuditStatus:document.getElementById("mediaAuditStatus"),
      resetDemoBtn:document.getElementById("resetDemoBtn"),
      landlordList:document.getElementById("landlordList"),
      switchToLandlordBtn:document.getElementById("switchToLandlordBtn"),
      switchToTenantBtn:document.getElementById("switchToTenantBtn"),
      listingDialog:document.getElementById("listingDialog"),
      closeDialogBtn:document.getElementById("closeDialogBtn"),
      dialogTitle:document.getElementById("dialogTitle"),
      dialogBody:document.getElementById("dialogBody"),
      chatDialog:document.getElementById("chatDialog"),
      closeChatBtn:document.getElementById("closeChatBtn"),
      listingTemplate:document.getElementById("listingCardTemplate"),
      apptTemplate:document.getElementById("apptItemTemplate")
    };
  }

  /* ---------- init ---------- */
  function init() {
    cacheEls();
    var saved = localStorage.getItem("zhijutong-demo-state");
    if (saved && JSON.parse(saved).version === DEMO_VERSION) {
      var parsed = JSON.parse(saved);
      // Merge while preserving incoming appointment objects
      state.role = "rent";
      state.tab = "rent-search";
      state.tenantVerified = true;
      state.landlordVerified = true;
      state.videoAttached = false; // reset per session
      state.vrAttached = false;
      state.logs = parsed.logs || [];
      state.listings = parsed.listings && parsed.listings.length ? parsed.listings : structuredClone(seedListings);
    } else {
      state.version = DEMO_VERSION;
      state.tab = "rent-search";
      state.listings = structuredClone(seedListings);
      console.log("[智居通] 系统初始化：已载入 3 套平台认证 demo 房源。");
    }
    normalizeAppointments();
    ensureDemoAppointments();
    bindEvents();
    render();
  }

  /* ---------- events ---------- */
  function bindEvents() {
    // Tab clicks
    els.tabBtns.forEach(function(btn) {
      btn.addEventListener("click", function() {
        var tab = btn.dataset.tab;
        var role = btn.dataset.role;
        state.role = role;
        state.tab = tab;
        console.log("[智居通] 切换到「"+(role==="rent"?"租客":"房主")+"」-「"+btn.querySelector("span").textContent+"」");
        render();
      });
    });

    // Tenant auth
    els.verifyTenantBtn.addEventListener("click", function() {
      state.tenantVerified = true;
      console.log("[智居通] 租客身份认证完成。");
      render();
    });

    // Landlord auth
    els.verifyLandlordBtn.addEventListener("click", function() {
      state.landlordVerified = true;
      console.log("[智居通] 房主身份认证完成。");
      render();
    });

    // Filters
    els.searchInput.addEventListener("input", renderListings);
    els.priceFilter.addEventListener("change", renderListings);
    els.vrFilter.addEventListener("change", renderListings);

    // Landlord form
    els.attachVideoBtn.addEventListener("click", function() {
      state.videoAttached = true;
      console.log("[智居通] 房主已添加 demo 视频。");
      render();
    });
    els.attachVrBtn.addEventListener("click", function() {
      state.vrAttached = true;
      console.log("[智居通] 房主已添加 demo VR。");
      render();
    });
    els.listingForm.addEventListener("submit", function(e) {
      e.preventDefault();
      if (!state.landlordVerified) {
        alert("请先完成房主身份认证再提交房源。");
        return;
      }
      createListing(new FormData(els.listingForm));
    });

    // Reset
    els.resetDemoBtn.addEventListener("click", function() {
      localStorage.removeItem("zhijutong-demo-state");
      state.role = "rent";
      state.version = DEMO_VERSION;
      state.tab = "rent-search";
      state.tenantVerified = true;
      state.landlordVerified = true;
      state.videoAttached = false;
      state.vrAttached = false;
      state.logs = [];
      state.listings = structuredClone(seedListings);
      ensureDemoAppointments();
      console.log("[智居通] demo 数据已重置。");
      render();
    });

    // Identity switch from profile
    els.switchToLandlordBtn.addEventListener("click", function() {
      state.role = "landlord";
      state.tab = "landlord-publish";
      console.log("[智居通] 切换到房主身份。");
      render();
    });
    els.switchToTenantBtn.addEventListener("click", function() {
      state.role = "rent";
      state.tab = "rent-search";
      console.log("[智居通] 切换到租客身份。");
      render();
    });

    // Dialogs
    els.closeDialogBtn.addEventListener("click", function() { els.listingDialog.close(); });
    els.closeChatBtn.addEventListener("click", function() { els.chatDialog.close(); });

    // Close dialogs on backdrop click
    els.listingDialog.addEventListener("click", function(e) {
      if (e.target === els.listingDialog) els.listingDialog.close();
    });
    els.dialogBody.addEventListener("click", function(e) {
      var target = e.target.closest("[data-action]");
      if (!target) return;
      if (target.dataset.action === "book-slot") {
        confirmAppointment(target.dataset.id, Number(target.dataset.start));
      }
    });
    els.chatDialog.addEventListener("click", function(e) {
      if (e.target === els.chatDialog) els.chatDialog.close();
    });

    // Click delegation for listing cards + appointment items
    els.mainContent.addEventListener("click", function(e) {
      var target = e.target.closest("[data-action]");
      if (!target) return;
      var action = target.dataset.action;
      if (action === "detail") showDetails(target.dataset.id);
      if (action === "appoint") makeAppointment(target.dataset.id);
      if (action === "chat") showChat(target.dataset.id);
    });
  }

  /* ---------- create listing ---------- */
  function createListing(fd) {
    var tags = splitTags(fd.get("tags"));
    var listing = {
      id:"home-"+Date.now(),
      title:fd.get("title"),
      area:fd.get("area"),
      price:Number(fd.get("price")),
      size:Number(fd.get("size")),
      tags:[].concat(tags, state.vrAttached?"支持 VR":"待补充 VR", fd.get("lock")?"自助看房":"暂不自助看房"),
      description:fd.get("description")||"房主暂未补充描述。",
      status:"待审核",
      hasVr:state.vrAttached,
      hasSelfViewing:!!fd.get("lock"),
      cameraOnline:!!fd.get("camera"),
      lockOnline:!!fd.get("lock"),
      appointments:[]
    };
    state.listings.unshift(listing);
    console.log("[智居通] 房主提交房源「"+listing.title+"」，进入平台审核。");
    render();
    window.setTimeout(function() {
      listing.status = "已认证";
      console.log("[智居通] 平台审核通过：房源「"+listing.title+"」已上线。");
      save();
      render();
    }, 900);
    els.listingForm.reset();
    state.videoAttached = false;
    state.vrAttached = false;
  }

  /* ---------- make appointment ---------- */
  function makeAppointment(id) {
    var listing = findListing(id);
    if (!listing) return;
    if (!state.tenantVerified) {
      alert("请先完成租客身份认证。");
      return;
    }
    if (!listing.hasSelfViewing || !listing.lockOnline) {
      alert("该房源暂不支持自助看房。");
      return;
    }
    showTimePicker(listing);
  }

  function showTimePicker(listing) {
    var slots = generateTimeSlots(listing.id);
    els.dialogTitle.textContent = "选择看房时间";
    els.dialogBody.innerHTML = '<div class="detail-section"><h3>'+escapeHtml(listing.title)+'</h3><p>每次预约固定 30 分钟；同一房源同一时间段只能有一位租客看房。</p><div class="slot-list">'+slots.map(function(slot) {
      return '<button class="slot-btn" '+(slot.disabled?'disabled':'')+' data-action="book-slot" data-id="'+listing.id+'" data-start="'+slot.start+'"><span>'+slot.label+'</span><em>'+(slot.disabled?'已被预约':'可预约')+'</em></button>';
    }).join("")+'</div></div>';
    els.listingDialog.showModal();
  }

  function confirmAppointment(id, start) {
    var listing = findListing(id);
    if (!listing) return;
    var end = start + 30 * 60 * 1000;
    if (isSlotTaken(listing.id, start, end)) {
      alert("该时间段已被预约，请选择其他时间。");
      showTimePicker(listing);
      return;
    }
    var password = String(Math.floor(100000 + Math.random() * 900000));
    var appt = {
      id:"apt-"+Date.now(),
      listingId:listing.id,
      title:listing.title,
      area:listing.area,
      start:start,
      end:end,
      time:formatRange(start, end),
      password:password,
      status:"已预约"
    };
    listing.appointments.push(appt);
    console.log("[智居通] 预约成功："+listing.title+"，时间 "+appt.time+"。一次性密码仅在预约时间内显示。");
    save();

    els.dialogTitle.textContent = "预约成功";
    els.dialogBody.innerHTML = '<div class="detail-section"><h3>'+escapeHtml(listing.title)+'</h3><p>预约时间：'+appt.time+'</p><p>该预约固定 30 分钟。未到时间前不会显示一次性门锁密码。</p></div>';
    els.listingDialog.showModal();
    render();
  }

  /* ---------- show details ---------- */
  function showDetails(id) {
    var listing = findListing(id);
    if (!listing) return;
    els.dialogTitle.textContent = listing.title;
    els.dialogBody.innerHTML = '<div class="detail-section"><h3>固定 demo 视频</h3><div class="media-placeholder"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg> Room Walkthrough</div></div><div class="detail-section"><h3>VR 全景占位</h3><div class="media-placeholder">'+(listing.hasVr?"VR Panorama":"暂未提供 VR")+'</div></div><div class="detail-section"><p>'+escapeHtml(listing.description)+'</p><p><strong>位置：</strong>'+escapeHtml(listing.area)+'</p><p><strong>价格：</strong>¥'+listing.price+'/月</p><p><strong>面积：</strong>'+listing.size+'㎡</p><p><strong>平台认证：</strong>'+listing.status+'</p><p><strong>自助看房：</strong>'+(listing.hasSelfViewing?"支持":"暂不支持")+'</p></div>';
    els.listingDialog.showModal();
  }

  /* ---------- show chat ---------- */
  function showChat(apptId) {
    // Find the appointment to show context
    var ctx = "";
    state.listings.forEach(function(l) {
      l.appointments.forEach(function(a) {
        if (a.id === apptId) ctx = a.title;
      });
    });
    if (ctx) els.chatDialog.querySelector("h2").textContent = "聊天 · " + ctx;
    else els.chatDialog.querySelector("h2").textContent = "聊天";
    els.chatDialog.showModal();
  }

  /* ---------- render ---------- */
  function render() {
    // Role badge
    els.roleBadge.textContent = state.role === "rent" ? "租客" : "房主";

    // Show/hide tab buttons & pages
    els.tabBtns.forEach(function(btn) {
      var show = btn.dataset.role === state.role;
      btn.style.display = show ? "" : "none";
    });
    els.tabPages.forEach(function(page) {
      page.classList.toggle("active", page.id === "tab-"+state.tab);
    });

    // Highlight active tab
    els.tabBtns.forEach(function(btn) {
      btn.classList.toggle("active", btn.dataset.tab === state.tab);
    });

    // Auth bars
    els.tenantStatus.textContent = state.tenantVerified ? "已认证" : "未认证";
    els.tenantStatus.className = "pill " + (state.tenantVerified ? "ok" : "warn");
    els.tenantStatusProfile.textContent = state.tenantVerified ? "已认证" : "未认证";
    els.tenantStatusProfile.className = "pill " + (state.tenantVerified ? "ok" : "warn");
    els.verifyTenantBtn.textContent = state.tenantVerified ? "已认证" : "完成认证";
    els.verifyTenantBtn.disabled = state.tenantVerified;

    els.landlordStatus.textContent = state.landlordVerified ? "已认证" : "未认证";
    els.landlordStatus.className = "pill " + (state.landlordVerified ? "ok" : "warn");
    els.landlordStatusProfile.textContent = state.landlordVerified ? "已认证" : "未认证";
    els.landlordStatusProfile.className = "pill " + (state.landlordVerified ? "ok" : "warn");
    els.verifyLandlordBtn.textContent = state.landlordVerified ? "已认证" : "完成认证";
    els.verifyLandlordBtn.disabled = state.landlordVerified;

    // Media buttons
    els.attachVideoBtn.textContent = state.videoAttached ? "已添加视频" : "+ 添加 demo 视频";
    els.attachVrBtn.textContent = state.vrAttached ? "已添加 VR" : "+ 添加 demo VR";
    els.mediaAuditStatus.textContent = state.videoAttached||state.vrAttached ? "材料已添加" : "等待上传";

    // Content
    renderListings();
    renderLandlordList();
    renderAppointments();
    save();
  }

  /* ---------- listing cards ---------- */
  function renderListings() {
    var list = getFilteredListings();
    els.listingGrid.innerHTML = "";
    if (!list.length) {
      els.listingGrid.innerHTML = '<div class="empty">没有找到符合条件的房源。</div>';
      return;
    }
    list.forEach(function(l) {
      var node = els.listingTemplate.content.cloneNode(true);
      node.querySelector("h3").textContent = l.title;
      node.querySelector(".price").textContent = "¥"+l.price+"/月";
      node.querySelector(".listing-meta").textContent = l.area+" · "+l.size+"㎡ · "+l.status;
      node.querySelector(".listing-desc").textContent = l.description;
      var tagRow = node.querySelector(".tag-row");
      l.tags.forEach(function(t) {
        var el = document.createElement("span");
        el.className = "tag";
        el.textContent = t;
        tagRow.appendChild(el);
      });
      node.querySelector(".detail-btn").dataset.action = "detail";
      node.querySelector(".detail-btn").dataset.id = l.id;
      node.querySelector(".appoint-btn").dataset.action = "appoint";
      node.querySelector(".appoint-btn").dataset.id = l.id;
      els.listingGrid.appendChild(node);
    });
  }

  function getFilteredListings() {
    var keyword = els.searchInput.value.trim().toLowerCase();
    var price = els.priceFilter.value;
    var vr = els.vrFilter.value;
    return state.listings.filter(function(l) {
      if (l.status !== "已认证") return false;
      var text = (l.title+" "+l.area+" "+l.tags.join(" ")).toLowerCase();
      if (keyword && !text.includes(keyword)) return false;
      if (price==="low" && l.price>=3000) return false;
      if (price==="mid" && (l.price<3000||l.price>6000)) return false;
      if (price==="high" && l.price<=6000) return false;
      if (vr==="vr" && !l.hasVr) return false;
      if (vr==="self" && !l.hasSelfViewing) return false;
      return true;
    });
  }

  /* ---------- landlord list ---------- */
  function renderLandlordList() {
    els.landlordList.innerHTML = "";
    state.listings.forEach(function(l) {
      var item = document.createElement("div");
      item.className = "mgmt-item";
      item.innerHTML = '<div><strong>'+escapeHtml(l.title)+'</strong><span>'+escapeHtml(l.area)+' · ¥'+l.price+'/月 · '+l.size+'㎡</span><span class="dev-status">摄像头 '+(l.cameraOnline?"在线":"未接入")+' · 门锁 '+(l.lockOnline?"可用":"未接入")+'</span></div><span class="pill '+(l.status==="已认证"?"ok":"pending")+'">'+l.status+'</span>';
      els.landlordList.appendChild(item);
    });
  }

  /* ---------- appointments ---------- */
  function renderAppointments() {
    // Tenant appointments
    els.tenantApptList.innerHTML = "";
    var tenantAppts = [];
    state.listings.forEach(function(l) {
      l.appointments.forEach(function(a) {
        tenantAppts.push(a);
      });
    });
    tenantAppts.sort(sortAppts);
    if (!tenantAppts.length) {
      els.tenantApptList.innerHTML = '<div class="empty">暂无预约记录，先去搜索房源预约看房吧。</div>';
    } else {
      tenantAppts.forEach(function(a) {
        els.tenantApptList.appendChild(buildApptItem(a));
      });
    }

    // Landlord appointments (all appointments across all listings)
    els.landlordApptList.innerHTML = "";
    var landlordAppts = [];
    state.listings.forEach(function(l) {
      l.appointments.forEach(function(a) {
        landlordAppts.push(a);
      });
    });
    landlordAppts.sort(sortAppts);
    if (!landlordAppts.length) {
      els.landlordApptList.innerHTML = '<div class="empty">暂无租客预约。</div>';
    } else {
      landlordAppts.forEach(function(a) {
        els.landlordApptList.appendChild(buildApptItem(a));
      });
    }
  }

  function buildApptItem(a) {
    var node = els.apptTemplate.content.cloneNode(true);
    node.querySelector(".appt-title").textContent = a.title || a.listingTitle;
    node.querySelector(".appt-time").textContent = a.time || formatRange(a.start, a.end);
    node.querySelector(".appt-addr").textContent = a.area || "";
    var status = getApptStatus(a);
    var statusEl = node.querySelector(".appt-status");
    statusEl.textContent = status.label;
    statusEl.className = "pill appt-status " + status.className;
    var passwordEl = node.querySelector(".appt-password");
    if (status.state === "active") {
      passwordEl.innerHTML = '一次性门锁密码：<strong>'+escapeHtml(a.password)+'</strong>';
    } else if (status.state === "future") {
      passwordEl.textContent = "未到预约时间，开始后发放一次性密码";
    } else {
      passwordEl.textContent = "预约已结束，门锁密码已失效";
    }
    node.querySelector(".chat-btn").dataset.action = "chat";
    node.querySelector(".chat-btn").dataset.id = a.id;
    return node;
  }

  /* ---------- helpers ---------- */
  function findListing(id) {
    return state.listings.find(function(l) { return l.id === id; });
  }

  function splitTags(v) {
    return String(v||"").split(/[,，\s]+/).map(function(t){return t.trim();}).filter(Boolean).slice(0,5);
  }

  function normalizeAppointments() {
    state.listings.forEach(function(listing) {
      listing.appointments = listing.appointments || [];
      listing.appointments.forEach(function(appt, index) {
        if (!appt.start || !appt.end) {
          var start = Date.now() + (index + 1) * 60 * 60 * 1000;
          appt.start = start;
          appt.end = start + 30 * 60 * 1000;
        }
        appt.time = formatRange(appt.start, appt.end);
        appt.title = appt.title || listing.title;
        appt.area = appt.area || listing.area;
        appt.password = appt.password || String(Math.floor(100000 + Math.random() * 900000));
      });
    });
  }

  function ensureDemoAppointments() {
    state.listings.forEach(function(listing) {
      listing.appointments = (listing.appointments || []).filter(function(appt) {
        return appt.id !== "demo-current" && appt.id !== "demo-future";
      });
    });

    var now = Date.now();
    var currentStart = floorToHalfHour(now);
    var currentEnd = currentStart + 30 * 60 * 1000;
    var futureStart = roundToNextHalfHour(now + 60 * 60 * 1000);
    var futureEnd = futureStart + 30 * 60 * 1000;

    if (state.listings[0]) {
      state.listings[0].appointments.push({
        id:"demo-current",
        listingId:state.listings[0].id,
        title:state.listings[0].title,
        area:state.listings[0].area,
        start:currentStart,
        end:currentEnd,
        time:formatRange(currentStart, currentEnd),
        password:"135790",
        status:"已预约"
      });
    }
    if (state.listings[1]) {
      state.listings[1].appointments.push({
        id:"demo-future",
        listingId:state.listings[1].id,
        title:state.listings[1].title,
        area:state.listings[1].area,
        start:futureStart,
        end:futureEnd,
        time:formatRange(futureStart, futureEnd),
        password:"246802",
        status:"已预约"
      });
    }
  }

  function generateTimeSlots(listingId) {
    var base = roundToNextHalfHour(Date.now() + 30 * 60 * 1000);
    var slots = [];
    for (var i = 0; i < 8; i++) {
      var start = base + i * 30 * 60 * 1000;
      var end = start + 30 * 60 * 1000;
      slots.push({
        start:start,
        end:end,
        label:formatRange(start, end),
        disabled:isSlotTaken(listingId, start, end)
      });
    }
    return slots;
  }

  function isSlotTaken(listingId, start, end) {
    var listing = findListing(listingId);
    if (!listing) return false;
    return (listing.appointments || []).some(function(appt) {
      return start < appt.end && end > appt.start;
    });
  }

  function getApptStatus(a) {
    var now = Date.now();
    if (now >= a.start && now < a.end) return { state:"active", label:"看房中", className:"ok" };
    if (now < a.start) return { state:"future", label:"未到时间", className:"pending" };
    return { state:"expired", label:"已结束", className:"warn" };
  }

  function sortAppts(a, b) {
    return a.start - b.start;
  }

  function roundToNextHalfHour(timestamp) {
    var d = new Date(timestamp);
    d.setSeconds(0, 0);
    var minutes = d.getMinutes();
    if (minutes === 0 || minutes === 30) return d.getTime();
    d.setMinutes(minutes < 30 ? 30 : 60);
    return d.getTime();
  }

  function floorToHalfHour(timestamp) {
    var d = new Date(timestamp);
    d.setSeconds(0, 0);
    var minutes = d.getMinutes();
    d.setMinutes(minutes < 30 ? 0 : 30);
    return d.getTime();
  }

  function formatRange(start, end) {
    return "今天 " + formatTime(start) + " — " + formatTime(end);
  }

  function formatTime(timestamp) {
    var d = new Date(timestamp);
    return String(d.getHours()).padStart(2,"0") + ":" + String(d.getMinutes()).padStart(2,"0");
  }

  function save() {
    localStorage.setItem("zhijutong-demo-state", JSON.stringify(state));
  }

  function escapeHtml(v) {
    return String(v).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
  }

  init();
})();
