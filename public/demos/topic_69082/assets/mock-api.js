/**
 * 伴芽平台 - 纯静态演示 Mock API
 * 拦截所有 /api/* 请求，用 localStorage 持久化数据
 * 双击 index.html 即可运行完整演示，无需后端服务
 */
(function () {
  "use strict";

  // ============ 种子数据 ============
  var SEED = {
    users: [
      { id: "u_parent_demo", name: "试用家长", phone: "13800000000", passwordHash: "plaintext:123456", role: "parent", area: "绿芽小区", createdAt: "2025-06-10T08:00:00Z" },
      { id: "u_provider_demo", name: "林老师", phone: "13900000000", passwordHash: "plaintext:123456", role: "provider", area: "阳光花园", createdAt: "2025-06-08T08:00:00Z" }
    ],
    providers: [
      { id: "provider_demo", userId: "u_provider_demo", name: "林老师", type: "师范生", distance: "1.2km", price: 80, rating: 4.8, orders: 12, skills: ["阅读陪伴", "游戏陪伴", "情绪疏导"], bio: "学前教育专业，3年儿童陪伴经验，擅长阅读启蒙和情绪疏导。", verified: true, verificationStatus: "approved", createdAt: "2025-06-08T08:00:00Z" },
      { id: "provider_002", userId: "u_provider_002", name: "小雨姐姐", type: "幼教老师", distance: "2.5km", price: 90, rating: 4.9, orders: 25, skills: ["艺术启蒙", "创意手工", "户外运动"], bio: "幼儿园在职教师，擅长艺术启蒙和创意手工，有耐心有爱心。", verified: true, createdAt: "2025-06-09T08:00:00Z" },
      { id: "provider_003", userId: "u_provider_003", name: "大树哥哥", type: "体育特长生", distance: "3.0km", price: 70, rating: 4.6, orders: 8, skills: ["户外运动", "儿童社交", "临时紧急"], bio: "体育教育专业，擅长户外运动和团队游戏，精力充沛。", verified: true, createdAt: "2025-06-07T08:00:00Z" }
    ],
    requests: [
      { id: "request_001", parentId: "u_parent_demo", parentName: "试用家长", childName: "小芽", age: 6, area: "绿芽小区", date: "2025-07-01", time: "15:40-18:30", service: "放学接送 + 阅读陪伴", budget: 80, note: "孩子刚上一年级，需要放学接送并辅导阅读，性格偏内向。", status: "open", createdAt: "2025-06-15T10:00:00Z" },
      { id: "request_002", parentId: "u_parent_demo", parentName: "试用家长", childName: "小芽", age: 6, area: "绿芽小区", date: "2025-07-06", time: "09:00-12:00", service: "周末兴趣陪伴", budget: 90, note: "周末上午需要陪伴者带孩子做手工和户外活动。", status: "open", createdAt: "2025-06-16T10:00:00Z" }
    ],
    children: [
      { id: "child_001", parentId: "u_parent_demo", name: "小芽", age: 6, gender: "女", interests: ["阅读", "画画", "积木"], notes: "性格偏内向，喜欢安静活动，正在学习拼音。", createdAt: "2025-06-10T08:00:00Z" }
    ],
    orders: [
      { id: "order_001", requestId: "request_001", parentId: "u_parent_demo", providerId: "provider_demo", parentName: "试用家长", providerName: "林老师", childName: "小芽", status: "done", service: "放学接送 + 阅读陪伴", area: "绿芽小区", date: "2025-06-20", time: "15:40-18:30", price: 80, feedback: "本次陪伴已完成，孩子阅读了两个绘本，状态稳定。", report: { activities: "接送放学后，一起阅读了《好饿的毛毛虫》和《猜猜我有多爱你》，孩子很投入。", mood: "开心、专注", homework: "完成了当天的拼音练习", suggestion: "可以多鼓励孩子在阅读后复述故事内容，锻炼表达能力。", createdAt: "2025-06-20T18:30:00Z" }, acceptedAt: "2025-06-20T15:40:00Z", arrivedAt: "2025-06-20T15:45:00Z", doneAt: "2025-06-20T18:30:00Z", reviewAt: "2025-06-20T19:00:00Z", review: { id: "review_001", orderId: "order_001", providerId: "provider_demo", parentId: "u_parent_demo", rating: 5, tags: "有耐心,按时完成,孩子喜欢", text: "林老师非常有耐心，孩子很喜欢她，下次还会约。", createdAt: "2025-06-20T19:00:00Z" }, createdAt: "2025-06-18T10:00:00Z", updatedAt: "2025-06-20T19:00:00Z" },
      { id: "order_002", requestId: null, parentId: "u_parent_demo", providerId: "provider_demo", parentName: "试用家长", providerName: "林老师", childName: "小芽", status: "accepted", service: "放学接送 + 阅读陪伴", area: "绿芽小区", date: "2025-06-25", time: "15:40-18:30", price: 80, feedback: "", acceptedAt: "2025-06-22T10:00:00Z", createdAt: "2025-06-22T09:00:00Z", updatedAt: "2025-06-22T10:00:00Z" }
    ],
    messages: [
      { id: "msg_001", orderId: "order_001", senderId: "system", senderRole: "system", text: "订单状态更新为：已接单。", createdAt: "2025-06-20T15:40:00Z" },
      { id: "msg_002", orderId: "order_001", senderId: "system", senderRole: "system", text: "订单状态更新为：陪伴中。", createdAt: "2025-06-20T15:45:00Z" },
      { id: "msg_003", orderId: "order_001", senderId: "system", senderRole: "system", text: "订单状态更新为：已完成。", createdAt: "2025-06-20T18:30:00Z" },
      { id: "msg_004", orderId: "order_001", senderId: "u_provider_demo", senderRole: "provider", text: "林老师 已提交本次陪伴记录。", createdAt: "2025-06-20T18:30:00Z" },
      { id: "msg_005", orderId: "order_002", senderId: "u_parent_demo", senderRole: "parent", text: "您好，我想了解一下您的陪伴服务。", createdAt: "2025-06-22T09:00:00Z" },
      { id: "msg_006", orderId: "order_002", senderId: "system", senderRole: "system", text: "订单状态更新为：已接单。", createdAt: "2025-06-22T10:00:00Z" }
    ],
    reviews: [
      { id: "review_001", orderId: "order_001", providerId: "provider_demo", parentId: "u_parent_demo", rating: 5, tags: "有耐心,按时完成,孩子喜欢", text: "林老师非常有耐心，孩子很喜欢她，下次还会约。", createdAt: "2025-06-20T19:00:00Z" }
    ],
    sessions: []
  };

  // ============ 工具函数 ============
  function loadDb() {
    var stored = localStorage.getItem("banya-demo-db");
    if (stored) {
      try { return JSON.parse(stored); } catch (e) { }
    }
    var fresh = JSON.parse(JSON.stringify(SEED));
    localStorage.setItem("banya-demo-db", JSON.stringify(fresh));
    return fresh;
  }

  function saveDb(db) {
    localStorage.setItem("banya-demo-db", JSON.stringify(db));
  }

  function getToken() {
    return localStorage.getItem("banya-auth-token") || "";
  }

  function getCurrentUser(db) {
    var token = getToken();
    if (!token) return null;
    var session = db.sessions.find(function (s) { return s.token === token; });
    if (!session) return null;
    return db.users.find(function (u) { return u.id === session.userId; }) || null;
  }

  function publicUser(user) {
    if (!user) return null;
    var copy = Object.assign({}, user);
    delete copy.passwordHash;
    return copy;
  }

  function providerForUser(db, userId) {
    return db.providers.find(function (p) { return p.userId === userId; }) || null;
  }

  function genId(prefix) {
    return prefix + "_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
  }

  function now() {
    return new Date().toISOString();
  }

  function createOrder(db, request, provider) {
    var order = {
      id: genId("order"),
      requestId: request.id,
      parentId: request.parentId,
      providerId: provider.id,
      parentName: request.parentName,
      providerName: provider.name,
      childName: request.childName,
      status: "accepted",
      service: request.service,
      area: request.area,
      date: request.date,
      time: request.time,
      price: request.budget || provider.price || 0,
      feedback: "",
      acceptedAt: now(),
      createdAt: now(),
      updatedAt: now()
    };
    db.orders.unshift(order);
    request.status = "accepted";
    db.messages.unshift({
      id: genId("msg"),
      orderId: order.id,
      senderId: "system",
      senderRole: "system",
      text: "订单状态更新为：已接单。",
      createdAt: now()
    });
    return order;
  }

  // ============ 拦截 fetch ============
  var originalFetch = window.fetch;

  window.fetch = function (url, options) {
    options = options || {};
    var path = String(url);
    var method = (options.method || "GET").toUpperCase();

    // 只拦截 /api/ 开头的请求
    if (path.indexOf("/api/") !== 0 && path.indexOf("/api/") !== 0) {
      // 非API请求：用原始 fetch（静态资源）
      return originalFetch.apply(this, arguments);
    }

    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        try {
          var db = loadDb();
          var user = getCurrentUser(db);
          var body = {};
          if (options.body) {
            try { body = JSON.parse(options.body); } catch (e) { }
          }

          var result = null;
          var status = 200;

          // ---------- 认证 ----------
          if (method === "POST" && path === "/api/auth/register") {
            var name = String(body.name || "").trim();
            var phone = String(body.phone || "").trim();
            var password = String(body.password || "");
            var role = body.role === "provider" ? "provider" : "parent";
            if (!name || !phone || password.length < 6) throw new Error("请填写姓名、手机号和至少6位密码");
            if (db.users.some(function (u) { return u.phone === phone; })) throw new Error("这个手机号已经注册");
            var newUser = { id: genId("user"), name: name, phone: phone, passwordHash: "plaintext:" + password, role: role, area: String(body.area || ""), createdAt: now() };
            db.users.push(newUser);
            if (role === "provider") {
              db.providers.push({
                id: genId("provider"), userId: newUser.id, name: name, type: "陪伴者", distance: "1.0km",
                price: 78, rating: 0, orders: 0, skills: ["阅读陪伴", "游戏陪伴"], bio: "还没有填写简介。", verified: false, createdAt: now()
              });
            }
            var token = genId("token");
            db.sessions.push({ token: token, userId: newUser.id, createdAt: now() });
            saveDb(db);
            status = 201;
            result = { token: token, user: publicUser(newUser) };
          }

          else if (method === "POST" && path === "/api/auth/login") {
            var foundUser = db.users.find(function (u) { return u.phone === String(body.phone || "").trim(); });
            if (!foundUser || foundUser.passwordHash !== "plaintext:" + body.password) throw new Error("手机号或密码不正确");
            var loginToken = genId("token");
            db.sessions.push({ token: loginToken, userId: foundUser.id, createdAt: now() });
            saveDb(db);
            result = { token: loginToken, user: publicUser(foundUser) };
          }

          else if (method === "POST" && path === "/api/auth/logout") {
            var t = getToken();
            db.sessions = db.sessions.filter(function (s) { return s.token !== t; });
            saveDb(db);
            result = { ok: true };
          }

          else if (method === "PUT" && path === "/api/auth/profile") {
            if (!user) { status = 401; throw new Error("请先登录"); }
            if (body.name) user.name = String(body.name).trim();
            if (body.phone) {
              var newPhone = String(body.phone).trim();
              if (!/^1\d{10}$/.test(newPhone)) throw new Error("手机号格式不正确");
              var dup = db.users.find(function (u) { return u.phone === newPhone && u.id !== user.id; });
              if (dup) throw new Error("该手机号已被其他账号使用");
              user.phone = newPhone;
            }
            if (body.area) user.area = String(body.area).trim();
            saveDb(db);
            result = { user: publicUser(user) };
          }

          else if (method === "GET" && path === "/api/me") {
            if (!user) { status = 401; throw new Error("请先登录"); }
            result = { user: publicUser(user), provider: providerForUser(db, user.id) || null };
          }

          else if (method === "GET" && path === "/api/bootstrap") {
            var provider = user ? providerForUser(db, user.id) : null;
            var myOrderIds = user ? new Set(db.orders.filter(function (o) {
              return user.role === "parent" ? o.parentId === user.id : provider && provider.id === o.providerId;
            }).map(function (o) { return o.id; })) : new Set();

            var safeProviders = db.providers.map(function (p) {
              var c = Object.assign({}, p);
              delete c.verification;
              delete c.userId;
              return c;
            });

            var safeReviews = db.reviews.map(function (r) {
              if (user && r.parentId === user.id) return r;
              var c = Object.assign({}, r);
              delete c.parentId;
              return c;
            });

            result = {
              user: publicUser(user),
              provider: provider || null,
              providers: safeProviders,
              requests: user ? db.requests : [],
              children: user && user.role === "parent" ? db.children.filter(function (c) { return c.parentId === user.id; }) : [],
              orders: user ? db.orders.filter(function (o) {
                return user.role === "parent" ? o.parentId === user.id : provider && provider.id === o.providerId;
              }) : [],
              messages: user ? db.messages.filter(function (m) { return myOrderIds.has(m.orderId); }) : [],
              reviews: safeReviews
            };
          }

          // ---------- 孩子 ----------
          else if (method === "GET" && path === "/api/children") {
            if (!user || user.role !== "parent") { status = 403; throw new Error("仅家长可访问"); }
            result = { children: db.children.filter(function (c) { return c.parentId === user.id; }) };
          }

          else if (method === "POST" && path === "/api/children") {
            if (!user || user.role !== "parent") { status = 403; throw new Error("仅家长可添加孩子"); }
            var child = {
              id: genId("child"), parentId: user.id, name: String(body.name || "").trim(),
              age: Number(body.age || 0), gender: String(body.gender || "").trim(),
              interests: Array.isArray(body.interests) ? body.interests : String(body.interests || "").split(/[，,]/).map(function (i) { return i.trim(); }).filter(Boolean),
              notes: String(body.notes || "").trim(), createdAt: now()
            };
            if (!child.name || !child.age) throw new Error("请填写孩子姓名和年龄");
            db.children.unshift(child);
            saveDb(db);
            status = 201;
            result = { child: child };
          }

          // ---------- 陪伴者 ----------
          else if (method === "GET" && path === "/api/providers") {
            if (!user) { status = 401; throw new Error("请先登录"); }
            result = {
              providers: db.providers.map(function (p) {
                var c = Object.assign({}, p);
                delete c.verification;
                delete c.userId;
                return c;
              })
            };
          }

          else if (method === "PUT" && path === "/api/providers/me") {
            if (!user || user.role !== "provider") { status = 403; throw new Error("仅陪伴者可编辑"); }
            var prov = providerForUser(db, user.id);
            if (!prov) {
              prov = { id: genId("provider"), userId: user.id, rating: 0, orders: 0, verified: false, createdAt: now() };
              db.providers.push(prov);
            }
            Object.assign(prov, {
              name: String(body.name || user.name), type: String(body.type || "陪伴者"),
              distance: String(body.distance || "1.0km"), price: Number(body.price || 0),
              skills: Array.isArray(body.skills) ? body.skills : String(body.skills || "").split(/[，,]/).map(function (i) { return i.trim(); }).filter(Boolean),
              bio: String(body.bio || "")
            });
            saveDb(db);
            result = { provider: prov };
          }

          else if (method === "POST" && path === "/api/providers/me/verify") {
            if (!user || user.role !== "provider") { status = 403; throw new Error("仅陪伴者可认证"); }
            var vp = providerForUser(db, user.id);
            if (!vp) throw new Error("请先完善陪伴者主页");
            vp.verified = true;
            vp.verificationStatus = "approved";
            saveDb(db);
            result = { provider: vp };
          }

          else if (method === "POST" && path === "/api/providers/me/verification") {
            if (!user || user.role !== "provider") { status = 403; throw new Error("仅陪伴者可提交认证"); }
            var vprov = providerForUser(db, user.id);
            if (!vprov) throw new Error("请先完善陪伴者主页");
            vprov.verificationStatus = "pending";
            vprov.verification = {
              realName: String(body.realName || vprov.name).trim(),
              credentialType: String(body.credentialType || "").trim(),
              credentialNoMasked: String(body.credentialNo || "").replace(/^(.{2}).*(.{2})$/, "$1****$2"),
              experience: String(body.experience || "").trim(),
              submittedAt: now()
            };
            saveDb(db);
            result = { provider: vprov };
          }

          // ---------- 需求 ----------
          else if (method === "GET" && path === "/api/requests") {
            if (!user) { status = 401; throw new Error("请先登录"); }
            result = { requests: db.requests };
          }

          else if (method === "POST" && path === "/api/requests") {
            if (!user || user.role !== "parent") { status = 403; throw new Error("仅家长可发布需求"); }
            var req = {
              id: genId("request"), parentId: user.id, parentName: user.name,
              childName: String(body.childName || "").trim(), age: Number(body.age || 0),
              area: String(body.area || user.area || "").trim(), date: String(body.date || "").trim(),
              time: String(body.time || "").trim(), service: String(body.service || "").trim(),
              budget: Number(body.budget || 0), note: String(body.note || "").trim(),
              status: "open", createdAt: now()
            };
            if (!req.childName || !req.age || !req.area || !req.date || !req.time || !req.service) throw new Error("请补全陪伴需求信息");
            db.requests.unshift(req);
            saveDb(db);
            status = 201;
            result = { request: req };
          }

          else {
            // 动态路由匹配
            var bookMatch = path.match(/^\/api\/requests\/([^/]+)\/book$/);
            var acceptMatch = path.match(/^\/api\/requests\/([^/]+)\/accept$/);
            var orderStatusMatch = path.match(/^\/api\/orders\/([^/]+)\/status$/);
            var orderReportMatch = path.match(/^\/api\/orders\/([^/]+)\/report$/);
            var orderReviewMatch = path.match(/^\/api\/orders\/([^/]+)\/review$/);

            if (method === "POST" && bookMatch) {
              if (!user || user.role !== "parent") { status = 403; throw new Error("仅家长可下单"); }
              var bkReq = db.requests.find(function (r) { return r.id === bookMatch[1]; });
              var bkProv = db.providers.find(function (p) { return p.id === body.providerId; });
              if (!bkReq || !bkProv) throw new Error("需求或陪伴者不存在");
              if (bkReq.parentId !== user.id) throw new Error("不能为别人的需求下单");
              if (bkReq.status !== "open") throw new Error("这个需求已经被接单");
              var bkOrder = createOrder(db, bkReq, bkProv);
              saveDb(db);
              status = 201;
              result = { order: bkOrder };
            }

            else if (method === "POST" && acceptMatch) {
              if (!user || user.role !== "provider") { status = 403; throw new Error("仅陪伴者可接单"); }
              var acProv = providerForUser(db, user.id);
              var acReq = db.requests.find(function (r) { return r.id === acceptMatch[1]; });
              if (!acProv) throw new Error("请先完善陪伴者主页");
              if (!acReq) throw new Error("需求不存在");
              if (acReq.status !== "open") throw new Error("这个需求已经被接单");
              var acOrder = createOrder(db, acReq, acProv);
              saveDb(db);
              status = 201;
              result = { order: acOrder };
            }

            else if (method === "GET" && path === "/api/orders") {
              if (!user) { status = 401; throw new Error("请先登录"); }
              var ordProv = providerForUser(db, user.id);
              result = {
                orders: db.orders.filter(function (o) {
                  return user.role === "parent" ? o.parentId === user.id : ordProv && ordProv.id === o.providerId;
                })
              };
            }

            else if (method === "PATCH" && orderStatusMatch) {
              if (!user) { status = 401; throw new Error("请先登录"); }
              var stOrder = db.orders.find(function (o) { return o.id === orderStatusMatch[1]; });
              var stProv = providerForUser(db, user.id);
              if (!stOrder) throw new Error("订单不存在");
              var canEdit = user.role === "parent" ? stOrder.parentId === user.id : stProv && stProv.id === stOrder.providerId;
              if (!canEdit) throw new Error("不能操作这个订单");
              if (["accepted", "arrived", "done"].indexOf(body.status) === -1) throw new Error("订单状态不正确");
              var roleAllowed = { accepted: ["parent", "provider"], arrived: ["provider"], done: ["provider"] };
              if (!roleAllowed[body.status] || roleAllowed[body.status].indexOf(user.role) === -1) throw new Error("只有陪伴者可以执行此操作");
              var transitions = { chatting: ["accepted"], accepted: ["arrived"], arrived: ["done"], done: [], reviewed: [] };
              if (!transitions[stOrder.status] || transitions[stOrder.status].indexOf(body.status) === -1) throw new Error("订单状态流转不正确");
              stOrder.status = body.status;
              stOrder.updatedAt = now();
              if (body.status === "accepted") stOrder.acceptedAt = now();
              if (body.status === "arrived") stOrder.arrivedAt = now();
              if (body.status === "done") {
                stOrder.doneAt = now();
                stOrder.feedback = body.feedback || "本次陪伴已完成，孩子状态稳定。";
              }
              db.messages.unshift({
                id: genId("msg"), orderId: stOrder.id, senderId: "system", senderRole: "system",
                text: "订单状态更新为：" + (body.status === "arrived" ? "陪伴中" : body.status === "done" ? "已完成" : "已接单") + "。",
                createdAt: now()
              });
              saveDb(db);
              result = { order: stOrder };
            }

            else if (method === "POST" && orderReportMatch) {
              if (!user || user.role !== "provider") { status = 403; throw new Error("仅陪伴者可填写记录"); }
              var rpProv = providerForUser(db, user.id);
              var rpOrder = db.orders.find(function (o) { return o.id === orderReportMatch[1]; });
              if (!rpOrder) throw new Error("订单不存在");
              if (!rpProv || rpProv.id !== rpOrder.providerId) throw new Error("不能填写这个订单的陪伴记录");
              if (["arrived", "done", "reviewed"].indexOf(rpOrder.status) === -1) throw new Error("订单进行中或完成后才能填写陪伴记录");
              if (rpOrder.report) throw new Error("已经提交过陪伴记录");
              var activities = String(body.activities || "").trim();
              if (!activities) throw new Error("请填写陪伴活动记录");
              rpOrder.report = {
                activities: activities, mood: String(body.mood || "").trim(),
                homework: String(body.homework || "").trim(), suggestion: String(body.suggestion || "").trim(),
                createdAt: now()
              };
              rpOrder.reportAt = now();
              rpOrder.updatedAt = now();
              db.messages.unshift({
                id: genId("msg"), orderId: rpOrder.id, senderId: "system", senderRole: "system",
                text: rpProv.name + " 已提交本次陪伴记录。", createdAt: now()
              });
              saveDb(db);
              result = { order: rpOrder };
            }

            else if (method === "POST" && orderReviewMatch) {
              if (!user || user.role !== "parent") { status = 403; throw new Error("仅家长可评价"); }
              var rvOrder = db.orders.find(function (o) { return o.id === orderReviewMatch[1]; });
              if (!rvOrder) throw new Error("订单不存在");
              if (rvOrder.parentId !== user.id) throw new Error("不能评价这个订单");
              if (rvOrder.status !== "done") throw new Error("订单完成后才能评价");
              if (db.reviews.find(function (r) { return r.orderId === rvOrder.id; })) throw new Error("这个订单已经评价过");
              var rawRating = Number(body.rating);
              var rating = Number.isFinite(rawRating) ? Math.max(1, Math.min(5, Math.round(rawRating))) : 5;
              var review = {
                id: genId("review"), orderId: rvOrder.id, providerId: rvOrder.providerId,
                parentId: user.id, rating: rating, tags: String(body.tags || "").trim(),
                text: String(body.text || "").trim(), createdAt: now()
              };
              db.reviews.unshift(review);
              rvOrder.review = review;
              rvOrder.status = "reviewed";
              rvOrder.reviewAt = now();
              rvOrder.updatedAt = now();
              var rvProv = db.providers.find(function (p) { return p.id === rvOrder.providerId; });
              if (rvProv) {
                var provReviews = db.reviews.filter(function (r) { return r.providerId === rvProv.id; });
                rvProv.rating = Number((provReviews.reduce(function (s, r) { return s + Number(r.rating || 0); }, 0) / provReviews.length).toFixed(1));
              }
              saveDb(db);
              status = 201;
              result = { review: review, order: rvOrder, provider: rvProv };
            }

            // ---------- 聊天订单 ----------
            else if (method === "POST" && path === "/api/orders/chat") {
              if (!user) { status = 401; throw new Error("请先登录"); }
              var chatProviderId = body.providerId;
              var chatRequestId = body.requestId || null;
              var chatProvider = db.providers.find(function (p) { return p.id === chatProviderId; });
              if (!chatProvider) throw new Error("陪伴者不存在");

              var chatParentId, chatParentName, chatActualProviderId;
              if (user.role === "provider") {
                if (!chatRequestId) throw new Error("陪伴者发起沟通需要指定需求");
                var chatReq = db.requests.find(function (r) { return r.id === chatRequestId; });
                if (!chatReq) throw new Error("需求不存在");
                var chatParent = db.users.find(function (u) { return u.id === chatReq.parentId; });
                if (!chatParent) throw new Error("家长不存在");
                chatParentId = chatParent.id;
                chatParentName = chatParent.name;
                chatActualProviderId = chatProvider.id;
              } else {
                chatParentId = user.id;
                chatParentName = user.name;
                chatActualProviderId = chatProviderId;
              }

              var existingOrder = db.orders.find(function (o) {
                return o.status === "chatting" && o.parentId === chatParentId && o.providerId === chatActualProviderId;
              });

              if (!existingOrder) {
                var chatReqData = chatRequestId ? db.requests.find(function (r) { return r.id === chatRequestId; }) : null;
                existingOrder = {
                  id: genId("order_chat"), requestId: chatRequestId, parentId: chatParentId,
                  providerId: chatActualProviderId, parentName: chatParentName, providerName: chatProvider.name,
                  childName: chatReqData ? chatReqData.childName : (db.children.find(function (c) { return c.parentId === chatParentId; }) || {}).name || "孩子",
                  status: "chatting", service: chatReqData ? chatReqData.service : "自由沟通",
                  area: chatReqData ? chatReqData.area : "", date: chatReqData ? chatReqData.date : "",
                  time: chatReqData ? chatReqData.time : "", price: chatReqData ? chatReqData.budget : (chatProvider.price || 0),
                  feedback: "", createdAt: now(), updatedAt: now()
                };
                db.orders.unshift(existingOrder);
                var greeting = user.role === "provider"
                  ? "您好，我对「" + (chatReqData ? chatReqData.service : "陪伴服务") + "」很感兴趣，想和您沟通一下细节。"
                  : "您好，我想了解一下您的陪伴服务。";
                db.messages.unshift({
                  id: genId("msg"), orderId: existingOrder.id, senderId: user.id, senderRole: user.role,
                  text: greeting, createdAt: now()
                });
                saveDb(db);
              }
              status = 201;
              result = { order: existingOrder };
            }

            // ---------- 消息 ----------
            else if (method === "GET" && path === "/api/messages") {
              if (!user) { status = 401; throw new Error("请先登录"); }
              var msgProv = providerForUser(db, user.id);
              var msgOrderIds = new Set(db.orders.filter(function (o) {
                return user.role === "parent" ? o.parentId === user.id : msgProv && msgProv.id === o.providerId;
              }).map(function (o) { return o.id; }));
              result = { messages: db.messages.filter(function (m) { return msgOrderIds.has(m.orderId); }) };
            }

            else if (method === "POST" && path === "/api/messages") {
              if (!user) { status = 401; throw new Error("请先登录"); }
              var msgOrder = db.orders.find(function (o) { return o.id === body.orderId; });
              if (!msgOrder) throw new Error("订单不存在");
              var msgProv2 = providerForUser(db, user.id);
              var msgIsParent = msgOrder.parentId === user.id;
              var msgIsProvider = msgProv2 && msgProv2.id === msgOrder.providerId;
              if (!msgIsParent && !msgIsProvider) throw new Error("不能在此订单中发消息");
              var message = {
                id: genId("msg"), orderId: msgOrder.id, senderId: user.id, senderRole: user.role,
                text: String(body.text || "").trim(), createdAt: now()
              };
              if (!message.text) throw new Error("消息不能为空");
              db.messages.unshift(message);
              saveDb(db);
              status = 201;
              result = { message: message };
            }

            else {
              status = 404;
              result = { error: "接口不存在" };
            }
          }

          resolve(new Response(JSON.stringify(result), {
            status: status,
            headers: { "Content-Type": "application/json" }
          }));
        } catch (e) {
          resolve(new Response(JSON.stringify({ error: e.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          }));
        }
      }, 100); // 100ms 延迟模拟网络请求
    });
  };

  // 暴露重置方法到全局，方便用户清除演示数据重来
  window.__banyaDemoReset = function () {
    localStorage.removeItem("banya-demo-db");
    localStorage.removeItem("banya-auth-token");
    location.reload();
  };

  console.log("伴芽演示模式已启动 - 数据存储在浏览器 localStorage 中，可调用 __banyaDemoReset() 重置");
})();
