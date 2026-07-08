/**
 * ============================================================
 *  社区管理系统 —— 数据存储模块（所有页面共享）
 *  使用 localStorage 作为存储引擎
 *  数据：用户 / 验证码 / 公告
 * ============================================================
 */

var Store = (function () {

  // ---------------- Keys ----------------
  var KEY_USERS = 'app_users_v1';
  var KEY_CODES = 'app_verification_codes_v1';
  var KEY_ANNOUNCEMENTS = 'app_announcements_v1';
  var KEY_COMMUNITIES = 'app_communities_v1';
  var KEY_FACILITIES = 'app_facilities_v1';
  var KEY_SESSION = 'app_session_v1';

  // ---------------- Utils ----------------
  function now() { return Date.now(); }

  function uid() {
    return 'u_' + now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  function isValidPhone(phone) {
    return /^1[3-9]\d{9}$/.test(String(phone).trim());
  }

  function readJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  // ---------------- Users ----------------
  /**
   * 用户结构：
   * {
   *   id: 'u_xxx',
   *   phone: '13800138000',
   *   role: 'user' | 'property' | 'restaurant' | 'admin',
   *   status: 'active' | 'pending_cert',
   *   communityId: 'c_xxx' | '',         // 绑定社区的 id（普通用户可修改，物业认证后固定）
   *   createdAt: timestamp,
   *   certification: {                    // 仅 property / restaurant 账号有
   *     companyName: '...',              // 通用：公司名称 / 小区名称
   *     contactName: '...',               // 通用：联系人
   *     documents: [ dataUrl1, dataUrl2... ], // 通用：已上传文件
   *     inviteCode: '...',                // 物业账号专用：注册时填写的邀请码
   *     // ---- 餐饮商家账号专用 ----
   *     restaurantData: {                // 仅 restaurant 账号有
   *       shopName: '...',               // 店铺名称
   *       kitchenPhotos: [...],          // 后厨照片
   *       shopPhotos: [...],             // 店铺照片
   *       licensePhoto: null,            // 营业执照照片
   *     },
   *     status: 'pending' | 'approved' | 'rejected',
   *     reviewNote: '...',
   *     submittedAt: timestamp,
   *     reviewedAt: timestamp
   *   }
   * }
   */

  function getUsers() {
    return readJSON(KEY_USERS, null);
  }

  function ensureSeedUsers() {
    var users = readJSON(KEY_USERS, null);
    if (!users || !Array.isArray(users) || users.length === 0) {
      // 初始种子用户 —— 超级管理员
      users = [{
        id: uid(),
        phone: 'admin',
        role: 'admin',
        status: 'active',
        createdAt: now()
      }];
      writeJSON(KEY_USERS, users);
    }
    return users;
  }

  function saveUsers(users) {
    writeJSON(KEY_USERS, users);
  }

  function findUserByPhone(phone) {
    var users = getUsers() || [];
    for (var i = 0; i < users.length; i++) {
      if (users[i].phone === phone) return users[i];
    }
    return null;
  }

  function findUserById(id) {
    var users = getUsers() || [];
    for (var i = 0; i < users.length; i++) {
      if (users[i].id === id) return users[i];
    }
    return null;
  }

  function addUser(phone, role) {
    var users = getUsers() || [];
    if (findUserByPhone(phone)) return { ok: false, reason: '该手机号已注册' };
    var needsCert = (role === 'property' || role === 'restaurant');
    var user = {
      id: uid(),
      phone: phone,
      role: role || 'user',
      status: needsCert ? 'pending_cert' : 'active',
      communityId: '',
      createdAt: now()
    };
    if (needsCert) {
      user.certification = {
        companyName: '',
        contactName: '',
        documents: [],
        inviteCode: '',
        restaurantData: role === 'restaurant' ? {
          shopName: '',
          kitchenPhotos: [],
          shopPhotos: [],
          licensePhoto: null
        } : null,
        status: 'pending',
        reviewNote: '',
        submittedAt: 0,
        reviewedAt: 0
      };
    }
    users.push(user);
    saveUsers(users);
    return { ok: true, user: user };
  }

  function updateUser(id, patch) {
    var users = getUsers() || [];
    for (var i = 0; i < users.length; i++) {
      if (users[i].id === id) {
        for (var k in patch) {
          if (patch.hasOwnProperty(k)) users[i][k] = patch[k];
        }
        saveUsers(users);
        return users[i];
      }
    }
    return null;
  }

  function removeUser(id) {
    var users = getUsers() || [];
    var idx = -1;
    for (var i = 0; i < users.length; i++) {
      if (users[i].id === id) { idx = i; break; }
    }
    if (idx >= 0) {
      users.splice(idx, 1);
      saveUsers(users);
      return true;
    }
    return false;
  }

  function changePhone(id, newPhone) {
    if (!isValidPhone(newPhone) && newPhone !== 'admin') {
      return { ok: false, reason: '请输入有效的 11 位手机号' };
    }
    var users = getUsers() || [];
    for (var i = 0; i < users.length; i++) {
      if (users[i].phone === newPhone && users[i].id !== id) {
        return { ok: false, reason: '该手机号已被其他账号使用' };
      }
    }
    for (var j = 0; j < users.length; j++) {
      if (users[j].id === id) {
        users[j].phone = newPhone;
        saveUsers(users);
        // 如果当前登录的是这个用户，同步 session
        var session = getSession();
        if (session && session.userId === id) {
          session.phone = newPhone;
          setSession(session);
        }
        return { ok: true, user: users[j] };
      }
    }
    return { ok: false, reason: '用户不存在' };
  }

  // ---------------- Communities ----------------
  /**
   * 社区结构：
   * {
   *   id: 'c_xxx',
   *   name: '社区名称',
   *   inviteCode: '邀请码',
   *   createdAt: timestamp
   * }
   */
  function getCommunities() {
    return readJSON(KEY_COMMUNITIES, []);
  }

  function cid() {
    return 'c_' + now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
  }

  function findCommunityById(id) {
    var list = getCommunities();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function findCommunityByInviteCode(code) {
    var list = getCommunities();
    var c = String(code).trim();
    for (var i = 0; i < list.length; i++) {
      if (list[i].inviteCode === c) return list[i];
    }
    return null;
  }

  function isInviteCodeUsedByOtherProperty(code, excludeUserId) {
    var users = getUsers() || [];
    var c = String(code).trim();
    for (var i = 0; i < users.length; i++) {
      var u = users[i];
      if (u.id === excludeUserId) continue;
      if (u.role !== 'property') continue;
      var cert = u.certification || {};
      if (cert.inviteCode === c) return true;
    }
    return false;
  }

  function addCommunity(name, inviteCode) {
    var list = getCommunities();
    var code = String(inviteCode).trim();
    if (!code) return { ok: false, reason: '邀请码不能为空' };
    if (findCommunityByInviteCode(code)) return { ok: false, reason: '该邀请码已存在' };
    var community = {
      id: cid(),
      name: String(name || code).trim() || code,
      inviteCode: code,
      createdAt: now()
    };
    list.push(community);
    writeJSON(KEY_COMMUNITIES, list);
    return { ok: true, community: community };
  }

  function updateCommunity(id, patch) {
    var list = getCommunities();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        for (var k in patch) {
          if (patch.hasOwnProperty(k)) list[i][k] = patch[k];
        }
        writeJSON(KEY_COMMUNITIES, list);
        return list[i];
      }
    }
    return null;
  }

  function removeCommunity(id) {
    var list = getCommunities();
    var idx = -1;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) { idx = i; break; }
    }
    if (idx >= 0) {
      list.splice(idx, 1);
      writeJSON(KEY_COMMUNITIES, list);
      return true;
    }
    return false;
  }

  // 绑定/修改普通用户所属社区
  function bindCommunity(userId, inviteCode) {
    var community = findCommunityByInviteCode(inviteCode);
    if (!community) return { ok: false, reason: '邀请码不存在，请核对后重试' };
    var user = findUserById(userId);
    if (!user) return { ok: false, reason: '用户不存在' };
    if (user.role === 'property') return { ok: false, reason: '物业账号不能修改邀请码' };
    updateUser(userId, { communityId: community.id });
    return { ok: true, community: community };
  }

  // ---------------- Facilities ----------------
  function getFacilities() {
    return readJSON(KEY_FACILITIES, []);
  }

  function fid() {
    return 'f_' + now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
  }

  function addFacility(payload) {
    var name = String(payload.name || '').trim();
    var category = String(payload.category || '').trim();
    var address = String(payload.address || '').trim();
    var district = String(payload.district || '').trim();
    var street = String(payload.street || '').trim();
    var distance = parseInt(payload.distance, 10) || 0;

    if (!name) return { ok: false, reason: '请填写设施名称' };
    if (!category) return { ok: false, reason: '请选择设施分类' };
    if (!district) return { ok: false, reason: '请填写所属区/县' };

    var list = getFacilities();
    list.push({
      id: fid(),
      category: category,
      name: name,
      address: address,
      district: district,
      street: street,
      distance: distance,
      createdAt: now()
    });
    writeJSON(KEY_FACILITIES, list);
    return { ok: true };
  }

  function removeFacility(id) {
    var list = getFacilities();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        list.splice(i, 1);
        writeJSON(KEY_FACILITIES, list);
        return true;
      }
    }
    return false;
  }

  // ---------------- Verification codes ----------------
  /**
   * { '13800138000': { code: '123456', expiresAt: timestamp }, ... }
   */
  function getCodes() {
    return readJSON(KEY_CODES, {});
  }

  function generateCode(phone) {
    var codes = getCodes();
    var code = Math.floor(100000 + Math.random() * 900000).toString();
    codes[phone] = {
      code: code,
      expiresAt: now() + 5 * 60 * 1000  // 5 分钟有效
    };
    writeJSON(KEY_CODES, codes);
    return code;
  }

  function verifyCode(phone, input) {
    // 测试阶段：只要输入是6位数字即视为通过
    var s = String(input).trim();
    if (!/^\d{6}$/.test(s)) {
      return { ok: false, reason: '请输入6位数字验证码' };
    }
    // 通过后清理记录（保持一次性使用的语义）
    var codes = getCodes();
    if (codes[phone]) {
      delete codes[phone];
      writeJSON(KEY_CODES, codes);
    }
    return { ok: true };
  }

  // ---------------- Session (current logged-in user) ----------------
  function getSession() {
    return readJSON(KEY_SESSION, null);
  }

  function setSession(sess) {
    if (!sess) {
      localStorage.removeItem(KEY_SESSION);
      return;
    }
    writeJSON(KEY_SESSION, sess);
  }

  function login(phone, code) {
    // 1) 验证验证码
    if (phone !== 'admin') {
      var vr = verifyCode(phone, code);
      if (!vr.ok) return vr;
    }

    // 2) 查找用户
    var user = findUserByPhone(phone);
    if (!user) {
      // 普通用户首次登录 = 自动注册
      var result = addUser(phone, 'user');
      if (!result.ok) return result;
      user = result.user;
    }

    // 3) 创建 session
    var session = {
      userId: user.id,
      phone: user.phone,
      role: user.role,
      loginAt: now()
    };
    setSession(session);
    return { ok: true, user: user, session: session };
  }

  function adminLogin(code) {
    // admin 直接登录，使用固定密码: admin888
    if (String(code).trim() !== 'admin888') {
      return { ok: false, reason: '管理密码不正确' };
    }
    var user = findUserByPhone('admin');
    if (!user) {
      ensureSeedUsers();
      user = findUserByPhone('admin');
    }
    var session = {
      userId: user.id,
      phone: user.phone,
      role: user.role,
      loginAt: now()
    };
    setSession(session);
    return { ok: true, user: user, session: session };
  }

  function logout() {
    localStorage.removeItem(KEY_SESSION);
  }

  function currentUser() {
    var session = getSession();
    if (!session || !session.userId) return null;
    return findUserById(session.userId);
  }

  function requireRole(role) {
    var user = currentUser();
    if (!user) return { ok: false, reason: '请先登录' };
    if (user.role !== role) {
      return { ok: false, reason: '权限不足：需要 ' + role + ' 权限' };
    }
    return { ok: true, user: user };
  }

  // ---------------- Announcements ----------------
  /**
   * 公告结构：
   * {
   *   id: 'ann_xxx',
   *   title: '标题',
   *   content: '正文',
   *   authorPhone: '13800138000',
   *   communityId: 'c_xxx',            // 所属社区 id
   *   createdAt: timestamp
   * }
   */
  function getAnnouncements(communityId) {
    var list = readJSON(KEY_ANNOUNCEMENTS, null);
    if (!list || !Array.isArray(list)) return [];
    // 按创建时间倒序
    list = list.slice().sort(function (a, b) {
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
    // 如果指定了社区 id，只返回该社区的公告
    if (communityId) {
      list = list.filter(function (a) { return a.communityId === communityId; });
    }
    return list;
  }

  function addAnnouncement(phone, title, content, communityId) {
    var titleT = (title || '').trim();
    var contentT = (content || '').trim();
    if (!titleT || !contentT) {
      return { ok: false, reason: '请填写标题和正文' };
    }
    var list = readJSON(KEY_ANNOUNCEMENTS, []);
    if (!Array.isArray(list)) list = [];

    var ann = {
      id: 'ann_' + now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
      title: titleT,
      content: contentT,
      authorPhone: phone,
      communityId: communityId || '',
      createdAt: now()
    };
    list.unshift(ann);
    writeJSON(KEY_ANNOUNCEMENTS, list);
    return { ok: true, announcement: ann };
  }

  function removeAnnouncement(id) {
    var list = readJSON(KEY_ANNOUNCEMENTS, []);
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        list.splice(i, 1);
        writeJSON(KEY_ANNOUNCEMENTS, list);
        return true;
      }
    }
    return false;
  }

  // ---------------- 认证提交（物业 & 餐饮商家共用）----------------
  function submitCertification(phone, payload) {
    var user = findUserByPhone(phone);
    if (!user) return { ok: false, reason: '账号不存在' };
    if (user.role !== 'property' && user.role !== 'restaurant') {
      return { ok: false, reason: '该类型账号无需认证' };
    }
    var cert = user.certification || {};
    cert.companyName = payload.companyName || '';
    cert.contactName = payload.contactName || '';
    cert.documents = payload.documents || [];

    // 物业账号：处理社区邀请码
    if (user.role === 'property') {
      var inviteCode = String(payload.inviteCode || '').trim();
      if (!inviteCode) return { ok: false, reason: '请填写社区邀请码' };
      // 检查是否被其他物业占用
      if (isInviteCodeUsedByOtherProperty(inviteCode, user.id)) {
        return { ok: false, reason: '该邀请码已被其他物业使用，请更换' };
      }
      // 如果该邀请码的社区不存在，自动创建
      if (!findCommunityByInviteCode(inviteCode)) {
        var addRes = addCommunity(cert.companyName || inviteCode, inviteCode);
        if (!addRes.ok) return addRes;
      }
      cert.inviteCode = inviteCode;
    }

    if (user.role === 'restaurant' && payload.restaurantData) {
      cert.restaurantData = payload.restaurantData;
    }
    cert.status = 'pending';
    cert.submittedAt = now();
    cert.reviewNote = '';
    cert.reviewedAt = 0;

    updateUser(user.id, { certification: cert, status: 'pending_cert' });
    return { ok: true };
  }

  function reviewCertification(userId, approve, reviewNote) {
    var user = findUserById(userId);
    if (!user) return { ok: false, reason: '用户不存在' };
    if (user.role !== 'property' && user.role !== 'restaurant') return { ok: false, reason: '该账号类型无需审核' };
    var cert = user.certification || {};
    cert.status = approve ? 'approved' : 'rejected';
    cert.reviewNote = reviewNote || '';
    cert.reviewedAt = now();

    var patch = {
      certification: cert,
      status: approve ? 'active' : 'pending_cert'
    };

    // 物业审核通过时，将其绑定到对应社区
    if (user.role === 'property' && approve && cert.inviteCode) {
      var community = findCommunityByInviteCode(cert.inviteCode);
      if (community) {
        patch.communityId = community.id;
      }
    }

    updateUser(user.id, patch);
    return { ok: true };
  }

  // ---------------- Products (本地降级用) ----------------
  var KEY_PRODUCTS = 'app_products_v1';
  function getProducts() {
    return readJSON(KEY_PRODUCTS, []);
  }
  function saveProducts(list) {
    writeJSON(KEY_PRODUCTS, list);
  }
  function pid() {
    return 'p_' + now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
  }
  function addProduct(payload) {
    var list = getProducts();
    var product = {
      id: payload.id || pid(),
      title: String(payload.title || '').trim(),
      desc: String(payload.desc || '').trim(),
      price: parseFloat(payload.price) || 0,
      cat: payload.cat || 'item',
      photo: payload.photo || '',
      merchantId: payload.merchantId || '',
      merchantName: payload.merchantName || '',
      city: payload.city || '',
      district: payload.district || '',
      street: payload.street || '',
      address: payload.address || '',
      status: payload.status || 'active',
      createdAt: payload.createdAt || now(),
      updatedAt: payload.updatedAt || now()
    };
    list.unshift(product);
    saveProducts(list);
    return { ok: true, product: product };
  }
  function updateProduct(id, patch) {
    var list = getProducts();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        for (var k in patch) {
          if (patch.hasOwnProperty(k)) list[i][k] = patch[k];
        }
        list[i].updatedAt = now();
        saveProducts(list);
        return list[i];
      }
    }
    return null;
  }
  function removeProduct(id) {
    var list = getProducts();
    var idx = -1;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) { idx = i; break; }
    }
    if (idx >= 0) {
      list.splice(idx, 1);
      saveProducts(list);
      return true;
    }
    return false;
  }

  // ---------------- Orders (本地降级用) ----------------
  var KEY_ORDERS = 'app_orders_v1';
  function getOrders() {
    return readJSON(KEY_ORDERS, []);
  }
  function saveOrders(list) {
    writeJSON(KEY_ORDERS, list);
  }
  function oid() {
    return 'o_' + now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
  }
  function createOrder(payload) {
    var list = getOrders();
    var order = {
      id: payload.id || oid(),
      orderNo: payload.orderNo || ('ORD' + now() + Math.floor(Math.random() * 10000)),
      productId: payload.productId || '',
      productTitle: payload.productTitle || '',
      productPhoto: payload.productPhoto || '',
      price: parseFloat(payload.price) || 0,
      payMethod: payload.payMethod || 'wechat',
      status: payload.status || 'pending',
      buyerId: payload.buyerId || '',
      buyerName: payload.buyerName || '',
      buyerPhone: payload.buyerPhone || '',
      buyerAddress: payload.buyerAddress || '',
      merchantId: payload.merchantId || '',
      merchantName: payload.merchantName || '',
      createdAt: payload.createdAt || now(),
      paidAt: payload.paidAt || 0,
      tradeNo: payload.tradeNo || ''
    };
    list.unshift(order);
    saveOrders(list);
    return { ok: true, order: order };
  }
  function updateOrder(id, patch) {
    var list = getOrders();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        for (var k in patch) {
          if (patch.hasOwnProperty(k)) list[i][k] = patch[k];
        }
        saveOrders(list);
        return list[i];
      }
    }
    return null;
  }

  // ---------------- Initialize ----------------
  ensureSeedUsers();

  // ---------------- Public API ----------------
  return {
    // 用户
    getUsers: getUsers,
    findUserByPhone: findUserByPhone,
    findUserById: findUserById,
    addUser: addUser,
    updateUser: updateUser,
    removeUser: removeUser,
    changePhone: changePhone,
    isValidPhone: isValidPhone,

    // 验证码
    generateCode: generateCode,
    verifyCode: verifyCode,

    // session
    login: login,
    adminLogin: adminLogin,
    logout: logout,
    currentUser: currentUser,
    getSession: getSession,
    requireRole: requireRole,

    // 社区
    getCommunities: getCommunities,
    findCommunityById: findCommunityById,
    findCommunityByInviteCode: findCommunityByInviteCode,
    addCommunity: addCommunity,
    updateCommunity: updateCommunity,
    removeCommunity: removeCommunity,
    bindCommunity: bindCommunity,

    // 公告
    getAnnouncements: getAnnouncements,
    addAnnouncement: addAnnouncement,
    removeAnnouncement: removeAnnouncement,

    // 设施
    getFacilities: getFacilities,
    addFacility: addFacility,
    removeFacility: removeFacility,

    // 物业认证
    submitCertification: submitCertification,
    reviewCertification: reviewCertification,

    // 商品（本地降级用）
    getProducts: getProducts,
    addProduct: addProduct,
    updateProduct: updateProduct,
    removeProduct: removeProduct,

    // 订单（本地降级用）
    getOrders: getOrders,
    createOrder: createOrder,
    updateOrder: updateOrder
  };
})();

/**
 * 简单的时间格式化
 */
function fmtTime(t) {
  if (!t) return '—';
  var d = new Date(t);
  var pad = function (n) { return n < 10 ? '0' + n : String(n); };
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
    + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

/**
 * 简短的相对时间
 */
function fmtRelative(t) {
  if (!t) return '';
  var diff = Date.now() - t;
  if (diff < 60 * 1000) return '刚刚';
  if (diff < 60 * 60 * 1000) return Math.floor(diff / 60000) + ' 分钟前';
  if (diff < 24 * 60 * 60 * 1000) return Math.floor(diff / 3600000) + ' 小时前';
  if (diff < 30 * 24 * 60 * 60 * 1000) return Math.floor(diff / 86400000) + ' 天前';
  return fmtTime(t).slice(0, 10);
}
