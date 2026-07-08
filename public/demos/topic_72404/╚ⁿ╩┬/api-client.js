/**
 * ============================================================
 *  社区智慧服务系统 —— 统一 API 客户端
 *  职责：优先调用后端 API；后端不可用时自动降级到本地 Store
 *  使用方式：在页面中先引入 store.js，再引入 api-client.js
 * ============================================================
 */

var ApiClient = (function () {
  var API_BASE = (function () {
    if (typeof location !== 'undefined' && location.protocol === 'file:') return '';
    if (typeof location === 'undefined') return '';
    // 自动适配根目录或子目录部署
    var basePath = location.pathname.substring(0, location.pathname.lastIndexOf('/') + 1);
    return location.origin + basePath.replace(/\/$/, '');
  })();

  var backendAvailable = null;

  function isFileProtocol() {
    return typeof location !== 'undefined' && location.protocol === 'file:';
  }

  function getToken() {
    try {
      var raw = localStorage.getItem('app_session_v1');
      if (!raw) return '';
      var s = JSON.parse(raw);
      return s.token || '';
    } catch (e) { return ''; }
  }

  function saveSessionFromApi(session) {
    if (!session) return;
    localStorage.setItem('app_session_v1', JSON.stringify(session));
  }

  function clearSession() {
    localStorage.removeItem('app_session_v1');
  }

  function request(method, url, data) {
    return new Promise(function (resolve) {
      var opts = {
        method: method,
        headers: { 'Content-Type': 'application/json' }
      };
      var token = getToken();
      if (token) opts.headers['Authorization'] = 'Bearer ' + token;
      if (data) opts.body = JSON.stringify(data);

      fetch(API_BASE + url, opts)
        .then(function (r) { return r.json(); })
        .then(function (json) { resolve(json); })
        .catch(function (err) {
          backendAvailable = false;
          resolve({ ok: false, reason: '网络或服务异常：' + (err.message || err) });
        });
    });
  }

  function checkBackend() {
    return new Promise(function (resolve) {
      if (isFileProtocol()) { backendAvailable = false; resolve(false); return; }
      if (backendAvailable !== null) { resolve(backendAvailable); return; }
      fetch(API_BASE + '/api/health', { cache: 'no-store' })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          backendAvailable = !!(data && data.ok);
          resolve(backendAvailable);
        })
        .catch(function () {
          backendAvailable = false;
          resolve(false);
        });
    });
  }

  // ---------------- 通用返回包装 ----------------
  function okResult(data) { return { ok: true, data: data }; }
  function failResult(reason) { return { ok: false, reason: reason || '操作失败' }; }

  // ---------------- 认证相关 ----------------
  async function login(phone, code) {
    await checkBackend();
    if (!backendAvailable) {
      var r = Store.login(phone, code);
      return r.ok ? okResult({ user: r.user, session: r.session }) : failResult(r.reason);
    }
    var res = await request('POST', '/api/auth/login', { phone: phone, code: code });
    if (res.ok && res.token) {
      saveSessionFromApi({ token: res.token, userId: res.user.id, phone: res.user.phone, role: res.user.role });
    }
    return res.ok ? okResult({ user: res.user }) : failResult(res.reason);
  }

  async function adminLogin(password) {
    await checkBackend();
    if (!backendAvailable) {
      var r = Store.adminLogin(password);
      return r.ok ? okResult({ user: r.user, session: r.session }) : failResult(r.reason);
    }
    var res = await request('POST', '/api/auth/admin-login', { password: password });
    if (res.ok && res.token) {
      saveSessionFromApi({ token: res.token, userId: res.user.id, phone: res.user.phone, role: res.user.role });
    }
    return res.ok ? okResult({ user: res.user }) : failResult(res.reason);
  }

  async function logout() {
    await checkBackend();
    if (!backendAvailable) {
      Store.logout();
      return okResult(null);
    }
    clearSession();
    return okResult(null);
  }

  async function currentUser() {
    await checkBackend();
    if (!backendAvailable) return Store.currentUser();
    var res = await request('GET', '/api/me');
    return res.ok ? res.user : null;
  }

  async function getSession() {
    await checkBackend();
    if (!backendAvailable) return Store.getSession();
    var token = getToken();
    if (!token) return null;
    try {
      var payload = JSON.parse(atob(token.split('.')[1]));
      return { token: token, userId: payload.userId, phone: payload.phone, role: payload.role };
    } catch (e) {
      return { token: token };
    }
  }

  // ---------------- 验证码 ----------------
  async function generateCode(phone) {
    await checkBackend();
    if (!backendAvailable) {
      var code = Store.generateCode(phone);
      console.log('[本地验证码] ' + phone + ' -> ' + code);
      return okResult({ code: code });
    }
    var res = await request('POST', '/api/codes/generate', { phone: phone });
    if (res.ok && res.code) console.log('[后端验证码] ' + phone + ' -> ' + res.code);
    return res.ok ? okResult({ code: res.code }) : failResult(res.reason);
  }

  async function verifyCode(phone, code) {
    await checkBackend();
    if (!backendAvailable) {
      var r = Store.verifyCode(phone, code);
      return r.ok ? okResult(null) : failResult(r.reason);
    }
    var res = await request('POST', '/api/codes/verify', { phone: phone, code: code });
    return res.ok ? okResult(null) : failResult(res.reason);
  }

  // ---------------- 用户管理 ----------------
  async function getUsers(query) {
    await checkBackend();
    if (!backendAvailable) {
      var list = Store.getUsers() || [];
      if (query && query.role) list = list.filter(function (u) { return u.role === query.role; });
      if (query && query.status) list = list.filter(function (u) { return u.status === query.status; });
      list.sort(function (a, b) { return b.createdAt - a.createdAt; });
      return okResult({ list: list, total: list.length });
    }
    var qs = query ? '?' + new URLSearchParams(query).toString() : '';
    var res = await request('GET', '/api/users' + qs);
    return res.ok ? okResult({ list: res.list, total: res.total }) : failResult(res.reason);
  }

  async function addUser(phone, role) {
    await checkBackend();
    if (!backendAvailable) {
      var r = Store.addUser(phone, role);
      return r.ok ? okResult(r.user) : failResult(r.reason);
    }
    var res = await request('POST', '/api/users/register', { phone: phone, role: role });
    return res.ok ? okResult(res.user) : failResult(res.reason);
  }

  async function updateUser(id, patch) {
    await checkBackend();
    if (!backendAvailable) {
      var u = Store.updateUser(id, patch);
      return u ? okResult(u) : failResult('用户不存在');
    }
    var res = await request('PUT', '/api/users/' + id, patch);
    return res.ok ? okResult(res.user) : failResult(res.reason);
  }

  async function deleteUser(id) {
    await checkBackend();
    if (!backendAvailable) {
      return Store.removeUser(id) ? okResult(null) : failResult('用户不存在');
    }
    var res = await request('DELETE', '/api/users/' + id);
    return res.ok ? okResult(null) : failResult(res.reason);
  }

  async function changePhone(newPhone) {
    await checkBackend();
    var user = await currentUser();
    if (!user) return failResult('请先登录');
    if (!backendAvailable) {
      var r = Store.changePhone(user.id, newPhone);
      return r.ok ? okResult(r.user) : failResult(r.reason);
    }
    var res = await request('POST', '/api/users/change-phone', { newPhone: newPhone });
    return res.ok ? okResult(res.user) : failResult(res.reason);
  }

  // ---------------- 社区管理 ----------------
  async function getCommunities() {
    await checkBackend();
    if (!backendAvailable) {
      var list = Store.getCommunities() || [];
      list.sort(function (a, b) { return b.createdAt - a.createdAt; });
      return okResult({ list: list, total: list.length });
    }
    var res = await request('GET', '/api/communities');
    return res.ok ? okResult({ list: res.list, total: res.total }) : failResult(res.reason);
  }

  async function addCommunity(name, inviteCode) {
    await checkBackend();
    if (!backendAvailable) {
      var r = Store.addCommunity(name, inviteCode);
      return r.ok ? okResult(r.community) : failResult(r.reason);
    }
    var res = await request('POST', '/api/communities', { name: name, inviteCode: inviteCode });
    return res.ok ? okResult(res.community) : failResult(res.reason);
  }

  async function updateCommunity(id, patch) {
    await checkBackend();
    if (!backendAvailable) {
      var c = Store.updateCommunity(id, patch);
      return c ? okResult(c) : failResult('社区不存在');
    }
    var res = await request('PUT', '/api/communities/' + id, patch);
    return res.ok ? okResult(res.community) : failResult(res.reason);
  }

  async function deleteCommunity(id) {
    await checkBackend();
    if (!backendAvailable) {
      return Store.removeCommunity(id) ? okResult(null) : failResult('社区不存在');
    }
    var res = await request('DELETE', '/api/communities/' + id);
    return res.ok ? okResult(null) : failResult(res.reason);
  }

  async function bindCommunity(inviteCode) {
    await checkBackend();
    var user = await currentUser();
    if (!user) return failResult('请先登录');
    if (!backendAvailable) {
      var r = Store.bindCommunity(user.id, inviteCode);
      return r.ok ? okResult(r.community) : failResult(r.reason);
    }
    var res = await request('POST', '/api/communities/bind', { inviteCode: inviteCode });
    return res.ok ? okResult(res.community) : failResult(res.reason);
  }

  async function findCommunityById(id) {
    await checkBackend();
    if (!backendAvailable) return Store.findCommunityById(id);
    var res = await getCommunities();
    if (!res.ok) return null;
    for (var i = 0; i < res.data.list.length; i++) {
      if (res.data.list[i].id === id) return res.data.list[i];
    }
    return null;
  }

  async function findCommunityByInviteCode(code) {
    await checkBackend();
    if (!backendAvailable) return Store.findCommunityByInviteCode(code);
    var res = await getCommunities();
    if (!res.ok) return null;
    for (var i = 0; i < res.data.list.length; i++) {
      if (res.data.list[i].inviteCode === code) return res.data.list[i];
    }
    return null;
  }

  // ---------------- 公告管理 ----------------
  async function getAnnouncements(communityId) {
    await checkBackend();
    if (!backendAvailable) {
      var list = Store.getAnnouncements(communityId);
      return okResult({ list: list, total: list.length });
    }
    var qs = communityId ? '?communityId=' + encodeURIComponent(communityId) : '';
    var res = await request('GET', '/api/announcements' + qs);
    return res.ok ? okResult({ list: res.list, total: res.total }) : failResult(res.reason);
  }

  async function addAnnouncement(title, content, communityId) {
    await checkBackend();
    var user = await currentUser();
    if (!user) return failResult('请先登录');
    if (!backendAvailable) {
      var r = Store.addAnnouncement(user.phone, title, content, communityId);
      return r.ok ? okResult(r.announcement) : failResult(r.reason);
    }
    var res = await request('POST', '/api/announcements', { title: title, content: content, communityId: communityId });
    return res.ok ? okResult(res.announcement) : failResult(res.reason);
  }

  async function deleteAnnouncement(id) {
    await checkBackend();
    if (!backendAvailable) {
      return Store.removeAnnouncement(id) ? okResult(null) : failResult('公告不存在');
    }
    var res = await request('DELETE', '/api/announcements/' + id);
    return res.ok ? okResult(null) : failResult(res.reason);
  }

  // ---------------- 设施管理 ----------------
  async function getFacilities(query) {
    await checkBackend();
    if (!backendAvailable) {
      var list = Store.getFacilities() || [];
      if (query) {
        if (query.category) list = list.filter(function (f) { return f.category === query.category; });
        if (query.district) list = list.filter(function (f) { return f.district === query.district; });
        if (query.street) list = list.filter(function (f) { return f.street === query.street; });
      }
      return okResult({ list: list, total: list.length });
    }
    var qs = query ? '?' + new URLSearchParams(query).toString() : '';
    var res = await request('GET', '/api/facilities' + qs);
    return res.ok ? okResult({ list: res.list, total: res.total }) : failResult(res.reason);
  }

  async function addFacility(payload) {
    await checkBackend();
    if (!backendAvailable) {
      var r = Store.addFacility(payload);
      return r.ok ? okResult(null) : failResult(r.reason);
    }
    var res = await request('POST', '/api/facilities', payload);
    return res.ok ? okResult(res.facility) : failResult(res.reason);
  }

  async function deleteFacility(id) {
    await checkBackend();
    if (!backendAvailable) {
      return Store.removeFacility(id) ? okResult(null) : failResult('设施不存在');
    }
    var res = await request('DELETE', '/api/facilities/' + id);
    return res.ok ? okResult(null) : failResult(res.reason);
  }

  // ---------------- 认证管理 ----------------
  async function getCertifications(query) {
    await checkBackend();
    if (!backendAvailable) {
      var list = (Store.getUsers() || []).filter(function (u) {
        return u.role === 'property' || u.role === 'restaurant';
      });
      if (query && query.status) {
        list = list.filter(function (u) { return (u.certification || {}).status === query.status; });
      }
      if (query && query.role) {
        list = list.filter(function (u) { return u.role === query.role; });
      }
      return okResult({ list: list, total: list.length });
    }
    var qs = query ? '?' + new URLSearchParams(query).toString() : '';
    var res = await request('GET', '/api/certifications' + qs);
    return res.ok ? okResult({ list: res.list, total: res.total }) : failResult(res.reason);
  }

  async function submitCertification(payload) {
    await checkBackend();
    var user = await currentUser();
    if (!user) return failResult('请先登录');
    if (!backendAvailable) {
      var r = Store.submitCertification(user.phone, payload);
      return r.ok ? okResult(null) : failResult(r.reason);
    }
    var res = await request('POST', '/api/certification/submit', payload);
    return res.ok ? okResult(null) : failResult(res.reason);
  }

  async function reviewCertification(userId, approve, note) {
    await checkBackend();
    if (!backendAvailable) {
      var r = Store.reviewCertification(userId, approve, note);
      return r.ok ? okResult(null) : failResult(r.reason);
    }
    var res = await request('POST', '/api/certifications/' + userId + '/review', { approve: approve, reviewNote: note || '' });
    return res.ok ? okResult(null) : failResult(res.reason);
  }

  // ---------------- 商品管理 ----------------
  async function getProducts(query) {
    await checkBackend();
    if (!backendAvailable) {
      var list = Store.getProducts() || [];
      return okResult({ list: list, total: list.length });
    }
    var qs = query ? '?' + new URLSearchParams(query).toString() : '';
    var res = await request('GET', '/api/products' + qs);
    return res.ok ? okResult({ list: res.list, total: res.total }) : failResult(res.reason);
  }

  async function getProduct(id) {
    await checkBackend();
    if (!backendAvailable) return failResult('本地模式暂不支持');
    var res = await request('GET', '/api/products/' + id);
    return res.ok ? okResult(res.product) : failResult(res.reason);
  }

  async function createProduct(payload) {
    await checkBackend();
    if (!backendAvailable) return failResult('本地模式不支持发布商品，请启动后端服务');
    var res = await request('POST', '/api/products', payload);
    return res.ok ? okResult(res.product) : failResult(res.reason);
  }

  async function updateProduct(id, payload) {
    await checkBackend();
    if (!backendAvailable) return failResult('本地模式不支持修改商品');
    var res = await request('PUT', '/api/products/' + id, payload);
    return res.ok ? okResult(res.product) : failResult(res.reason);
  }

  async function deleteProduct(id) {
    await checkBackend();
    if (!backendAvailable) return failResult('本地模式不支持删除商品');
    var res = await request('DELETE', '/api/products/' + id);
    return res.ok ? okResult(null) : failResult(res.reason);
  }

  // ---------------- 订单管理 ----------------
  async function getOrders(query) {
    await checkBackend();
    if (!backendAvailable) return okResult({ list: [], total: 0 });
    var qs = query ? '?' + new URLSearchParams(query).toString() : '';
    var res = await request('GET', '/api/orders' + qs);
    return res.ok ? okResult({ list: res.list, total: res.total }) : failResult(res.reason);
  }

  async function createOrder(payload) {
    await checkBackend();
    if (!backendAvailable) return failResult('本地模式不支持下单');
    var res = await request('POST', '/api/orders', payload);
    return res.ok ? okResult(res.order) : failResult(res.reason);
  }

  async function payCreate(orderId, payMethod) {
    await checkBackend();
    if (!backendAvailable) return failResult('本地模式不支持支付');
    var res = await request('POST', '/api/pay/create', { orderId: orderId, payMethod: payMethod });
    return res.ok ? okResult(res) : failResult(res.reason);
  }

  async function paySimulate(orderId) {
    await checkBackend();
    if (!backendAvailable) return failResult('本地模式不支持支付');
    var res = await request('POST', '/api/pay/simulate', { orderId: orderId });
    return res.ok ? okResult(res.order) : failResult(res.reason);
  }

  // ---------------- 支付配置 ----------------
  async function getPayConfig(merchantId) {
    await checkBackend();
    if (!backendAvailable) return okResult({ admin: { wechat: {}, alipay: {} } });
    var qs = merchantId ? '?merchantId=' + encodeURIComponent(merchantId) : '';
    var res = await request('GET', '/api/pay/config' + qs);
    return res.ok ? okResult(res.config) : failResult(res.reason);
  }

  async function setAdminPayConfig(wechat, alipay) {
    await checkBackend();
    if (!backendAvailable) return failResult('本地模式不支持支付配置');
    var res = await request('POST', '/api/admin/pay/config', { wechat: wechat, alipay: alipay });
    return res.ok ? okResult(res.config) : failResult(res.reason);
  }

  async function setMerchantPay(merchantId, wechat, alipay) {
    await checkBackend();
    if (!backendAvailable) return failResult('本地模式不支持支付配置');
    var res = await request('POST', '/api/merchants/' + merchantId + '/pay', { wechat: wechat, alipay: alipay });
    return res.ok ? okResult(res.config) : failResult(res.reason);
  }

  // ---------------- 统计 ----------------
  async function getAdminStats() {
    await checkBackend();
    if (!backendAvailable) {
      var users = Store.getUsers() || [];
      return okResult({
        userCount: users.filter(function (u) { return u.role === 'user'; }).length,
        propertyCount: users.filter(function (u) { return u.role === 'property'; }).length,
        restaurantCount: users.filter(function (u) { return u.role === 'restaurant'; }).length,
        certPending: users.filter(function (u) {
          return (u.role === 'property' || u.role === 'restaurant') && (u.certification || {}).status === 'pending';
        }).length,
        productCount: 0,
        orderCount: 0,
        paidCount: 0,
        totalAmount: 0,
        announcementCount: (Store.getAnnouncements() || []).length,
        communityCount: (Store.getCommunities() || []).length,
        merchantCount: 0
      });
    }
    var res = await request('GET', '/api/admin/stats');
    return res.ok ? okResult(res.stats) : failResult(res.reason);
  }

  return {
    // 工具
    checkBackend: checkBackend,
    isFileProtocol: isFileProtocol,

    // 认证
    login: login,
    adminLogin: adminLogin,
    logout: logout,
    currentUser: currentUser,
    getSession: getSession,

    // 验证码
    generateCode: generateCode,
    verifyCode: verifyCode,

    // 用户
    getUsers: getUsers,
    addUser: addUser,
    updateUser: updateUser,
    deleteUser: deleteUser,
    changePhone: changePhone,

    // 社区
    getCommunities: getCommunities,
    addCommunity: addCommunity,
    updateCommunity: updateCommunity,
    deleteCommunity: deleteCommunity,
    bindCommunity: bindCommunity,
    findCommunityById: findCommunityById,
    findCommunityByInviteCode: findCommunityByInviteCode,

    // 公告
    getAnnouncements: getAnnouncements,
    addAnnouncement: addAnnouncement,
    deleteAnnouncement: deleteAnnouncement,

    // 设施
    getFacilities: getFacilities,
    addFacility: addFacility,
    deleteFacility: deleteFacility,

    // 认证
    getCertifications: getCertifications,
    submitCertification: submitCertification,
    reviewCertification: reviewCertification,

    // 商品/订单/支付
    getProducts: getProducts,
    getProduct: getProduct,
    createProduct: createProduct,
    updateProduct: updateProduct,
    deleteProduct: deleteProduct,
    getOrders: getOrders,
    createOrder: createOrder,
    payCreate: payCreate,
    paySimulate: paySimulate,

    // 支付配置
    getPayConfig: getPayConfig,
    setAdminPayConfig: setAdminPayConfig,
    setMerchantPay: setMerchantPay,

    // 统计
    getAdminStats: getAdminStats
  };
})();
