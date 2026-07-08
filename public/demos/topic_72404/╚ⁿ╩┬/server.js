const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

app.use(cors());
app.use(bodyParser.json({ limit: '20mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// ==================== 地址API代理 ====================
app.get('/api/district', function(req, res) {
  const adcode = req.query.adcode;
  if (!adcode) return res.json({ ok: false, reason: '缺少adcode参数' });
  
  const url = 'https://uapis.cn/api/v1/misc/district?adcode=' + adcode;
  
  https.get(url, function(apiRes) {
    let data = '';
    apiRes.on('data', function(chunk) { data += chunk; });
    apiRes.on('end', function() {
      try {
        const json = JSON.parse(data);
        res.json(json);
      } catch (e) {
        res.json({ ok: false, reason: 'API响应解析失败' });
      }
    });
  }).on('error', function(err) {
    console.error('地址API请求失败:', err);
    res.json({ ok: false, reason: '地址服务暂时不可用' });
  });
});

// ==================== 工具函数 ====================
function readData(file, fallback) {
  try {
    const p = path.join(DATA_DIR, file);
    if (!fs.existsSync(p)) return fallback;
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) { return fallback; }
}
function writeData(file, data) {
  fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2), 'utf8');
}
function uid(prefix) {
  return (prefix || 'id_') + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}
function now() { return Date.now(); }
function isValidPhone(phone) {
  return /^1[3-9]\d{9}$/.test(String(phone).trim());
}

// ==================== 数据加载 ====================
let USERS = readData('users.json', null);
let CODES = readData('codes.json', {});
let COMMUNITIES = readData('communities.json', []);
let ANNOUNCEMENTS = readData('announcements.json', []);
let FACILITIES = readData('facilities.json', []);
let PRODUCTS = readData('products.json', []);
let ORDERS = readData('orders.json', []);
let PAY_CONFIG = readData('pay_config.json', {
  admin: {
    wechat: { enabled: false, appId: '', mchId: '', key: '', notifyUrl: '', qrCode: '' },
    alipay: { enabled: false, appId: '', merchantId: '', privateKey: '', notifyUrl: '', qrCode: '' }
  }
});
let MERCHANTS = readData('merchants.json', {});
let SESSIONS = readData('sessions.json', {});

// ==================== 初始化种子数据 ====================
function ensureSeedUsers() {
  if (!USERS || !Array.isArray(USERS) || USERS.length === 0) {
    USERS = [{
      id: uid('u_'),
      phone: 'admin',
      role: 'admin',
      status: 'active',
      communityId: '',
      createdAt: now()
    }];
    saveUsers();
  }
}
ensureSeedUsers();

function saveUsers() { writeData('users.json', USERS); }
function saveCodes() { writeData('codes.json', CODES); }
function saveCommunities() { writeData('communities.json', COMMUNITIES); }
function saveAnnouncements() { writeData('announcements.json', ANNOUNCEMENTS); }
function saveFacilities() { writeData('facilities.json', FACILITIES); }
function saveProducts() { writeData('products.json', PRODUCTS); }
function saveOrders() { writeData('orders.json', ORDERS); }
function savePayConfig() { writeData('pay_config.json', PAY_CONFIG); }
function saveMerchants() { writeData('merchants.json', MERCHANTS); }
function saveSessions() { writeData('sessions.json', SESSIONS); }

// ==================== 辅助函数 ====================
function findUserByPhone(phone) {
  return USERS.find(u => u.phone === phone) || null;
}
function findUserById(id) {
  return USERS.find(u => u.id === id) || null;
}
function findCommunityById(id) {
  return COMMUNITIES.find(c => c.id === id) || null;
}
function findCommunityByInviteCode(code) {
  return COMMUNITIES.find(c => c.inviteCode === String(code).trim()) || null;
}

// ==================== 健康检查 ====================
app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: now(), userCount: USERS.length });
});

// ==================== 验证码 ====================
app.post('/api/codes/generate', (req, res) => {
  const { phone } = req.body;
  if (!isValidPhone(phone)) {
    return res.json({ ok: false, reason: '请输入有效的手机号' });
  }
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  CODES[phone] = { code, expiresAt: now() + 5 * 60 * 1000 };
  saveCodes();
  console.log(`[验证码] ${phone} -> ${code}`);
  res.json({ ok: true, code: code });
});

app.post('/api/codes/verify', (req, res) => {
  const { phone, code } = req.body;
  const s = String(code || '').trim();
  if (!/^\d{6}$/.test(s)) {
    return res.json({ ok: false, reason: '请输入6位数字验证码' });
  }
  const record = CODES[phone];
  if (!record) return res.json({ ok: false, reason: '验证码不存在' });
  if (record.expiresAt < now()) {
    delete CODES[phone];
    saveCodes();
    return res.json({ ok: false, reason: '验证码已过期' });
  }
  if (record.code !== s) return res.json({ ok: false, reason: '验证码错误' });
  delete CODES[phone];
  saveCodes();
  res.json({ ok: true });
});

// ==================== 用户注册/登录 ====================
app.post('/api/users/register', (req, res) => {
  const { phone, role } = req.body;
  if (!isValidPhone(phone)) {
    return res.json({ ok: false, reason: '请输入有效的手机号' });
  }
  if (findUserByPhone(phone)) {
    return res.json({ ok: false, reason: '该手机号已注册' });
  }
  const needsCert = (role === 'property' || role === 'restaurant');
  const user = {
    id: uid('u_'),
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
  USERS.push(user);
  saveUsers();
  res.json({ ok: true, user });
});

app.post('/api/auth/login', (req, res) => {
  const { phone, code } = req.body;
  if (phone !== 'admin') {
    if (!isValidPhone(phone)) return res.json({ ok: false, reason: '请输入有效的手机号' });
    if (!code) return res.json({ ok: false, reason: '请输入验证码' });
    const s = String(code).trim();
    if (!/^\d{6}$/.test(s)) return res.json({ ok: false, reason: '验证码格式错误' });
    const record = CODES[phone];
    if (!record) return res.json({ ok: false, reason: '验证码不存在' });
    if (record.expiresAt < now()) return res.json({ ok: false, reason: '验证码已过期' });
    if (record.code !== s) return res.json({ ok: false, reason: '验证码错误' });
    delete CODES[phone];
    saveCodes();
  }

  let user = findUserByPhone(phone);
  if (!user && phone !== 'admin') {
    const addResult = USERS.push({
      id: uid('u_'),
      phone: phone,
      role: 'user',
      status: 'active',
      communityId: '',
      createdAt: now()
    });
    saveUsers();
    user = findUserByPhone(phone);
  }

  if (!user) return res.json({ ok: false, reason: '用户不存在' });

  const token = 'tk_' + now().toString(36) + Math.random().toString(36).slice(2, 10);
  SESSIONS[token] = {
    userId: user.id,
    phone: user.phone,
    role: user.role,
    loginAt: now(),
    expiresAt: now() + 7 * 24 * 60 * 60 * 1000
  };
  saveSessions();

  res.json({
    ok: true,
    user: user,
    token: token,
    session: {
      userId: user.id,
      phone: user.phone,
      role: user.role,
      loginAt: now()
    }
  });
});

app.post('/api/auth/admin-login', (req, res) => {
  const { password } = req.body;
  if (String(password || '').trim() !== 'admin888') {
    return res.json({ ok: false, reason: '管理密码不正确' });
  }
  let user = findUserByPhone('admin');
  if (!user) {
    ensureSeedUsers();
    user = findUserByPhone('admin');
  }
  const token = 'tk_' + now().toString(36) + Math.random().toString(36).slice(2, 10);
  SESSIONS[token] = {
    userId: user.id,
    phone: user.phone,
    role: user.role,
    loginAt: now(),
    expiresAt: now() + 7 * 24 * 60 * 60 * 1000
  };
  saveSessions();
  res.json({
    ok: true,
    user: user,
    token: token,
    session: { userId: user.id, phone: user.phone, role: user.role, loginAt: now() }
  });
});

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token || req.body.token;
  if (!token) return res.json({ ok: false, reason: '请先登录' });
  const session = SESSIONS[token];
  if (!session) return res.json({ ok: false, reason: '登录已过期' });
  if (session.expiresAt < now()) {
    delete SESSIONS[token];
    saveSessions();
    return res.json({ ok: false, reason: '登录已过期' });
  }
  req.userId = session.userId;
  req.userRole = session.role;
  req.userPhone = session.phone;
  next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (req.userRole !== role && req.userRole !== 'admin') {
      return res.json({ ok: false, reason: '权限不足' });
    }
    next();
  };
}

// ==================== 用户管理 ====================
app.get('/api/users', authMiddleware, requireRole('admin'), (req, res) => {
  const { role, status } = req.query;
  let list = USERS.slice();
  if (role) list = list.filter(u => u.role === role);
  if (status) list = list.filter(u => u.status === status);
  list.sort((a, b) => b.createdAt - a.createdAt);
  res.json({ ok: true, list, total: list.length });
});

app.get('/api/users/:id', authMiddleware, (req, res) => {
  const user = findUserById(req.params.id);
  if (!user) return res.json({ ok: false, reason: '用户不存在' });
  if (req.userRole !== 'admin' && req.userId !== user.id) {
    return res.json({ ok: false, reason: '权限不足' });
  }
  res.json({ ok: true, user });
});

app.get('/api/me', authMiddleware, (req, res) => {
  const user = findUserById(req.userId);
  if (!user) return res.json({ ok: false, reason: '用户不存在' });
  res.json({ ok: true, user });
});

app.put('/api/users/:id', authMiddleware, (req, res) => {
  const idx = USERS.findIndex(u => u.id === req.params.id);
  if (idx < 0) return res.json({ ok: false, reason: '用户不存在' });
  if (req.userRole !== 'admin' && req.userId !== USERS[idx].id) {
    return res.json({ ok: false, reason: '权限不足' });
  }
  const protectedFields = ['id', 'phone', 'role', 'createdAt'];
  for (const key of Object.keys(req.body)) {
    if (!protectedFields.includes(key)) {
      USERS[idx][key] = req.body[key];
    }
  }
  saveUsers();
  res.json({ ok: true, user: USERS[idx] });
});

app.delete('/api/users/:id', authMiddleware, requireRole('admin'), (req, res) => {
  const idx = USERS.findIndex(u => u.id === req.params.id);
  if (idx < 0) return res.json({ ok: false, reason: '用户不存在' });
  if (USERS[idx].role === 'admin') return res.json({ ok: false, reason: '不能删除管理员' });
  USERS.splice(idx, 1);
  saveUsers();
  res.json({ ok: true });
});

app.post('/api/users/change-phone', authMiddleware, (req, res) => {
  const { newPhone } = req.body;
  if (!isValidPhone(newPhone)) return res.json({ ok: false, reason: '请输入有效的手机号' });
  const existing = USERS.find(u => u.phone === newPhone && u.id !== req.userId);
  if (existing) return res.json({ ok: false, reason: '该手机号已被其他账号使用' });
  const idx = USERS.findIndex(u => u.id === req.userId);
  if (idx < 0) return res.json({ ok: false, reason: '用户不存在' });
  USERS[idx].phone = newPhone;
  saveUsers();
  res.json({ ok: true, user: USERS[idx] });
});

// ==================== 社区管理 ====================
app.get('/api/communities', (req, res) => {
  let list = COMMUNITIES.slice().sort((a, b) => b.createdAt - a.createdAt);
  res.json({ ok: true, list, total: list.length });
});

app.post('/api/communities', authMiddleware, requireRole('admin'), (req, res) => {
  const { name, inviteCode } = req.body;
  const code = String(inviteCode || '').trim();
  if (!code) return res.json({ ok: false, reason: '邀请码不能为空' });
  if (findCommunityByInviteCode(code)) return res.json({ ok: false, reason: '该邀请码已存在' });
  const community = {
    id: uid('c_'),
    name: String(name || code).trim() || code,
    inviteCode: code,
    createdAt: now()
  };
  COMMUNITIES.push(community);
  saveCommunities();
  res.json({ ok: true, community });
});

app.put('/api/communities/:id', authMiddleware, requireRole('admin'), (req, res) => {
  const idx = COMMUNITIES.findIndex(c => c.id === req.params.id);
  if (idx < 0) return res.json({ ok: false, reason: '社区不存在' });
  COMMUNITIES[idx] = { ...COMMUNITIES[idx], ...req.body, id: COMMUNITIES[idx].id };
  saveCommunities();
  res.json({ ok: true, community: COMMUNITIES[idx] });
});

app.delete('/api/communities/:id', authMiddleware, requireRole('admin'), (req, res) => {
  const idx = COMMUNITIES.findIndex(c => c.id === req.params.id);
  if (idx < 0) return res.json({ ok: false, reason: '社区不存在' });
  COMMUNITIES.splice(idx, 1);
  saveCommunities();
  res.json({ ok: true });
});

app.post('/api/communities/bind', authMiddleware, (req, res) => {
  const { inviteCode } = req.body;
  const community = findCommunityByInviteCode(inviteCode);
  if (!community) return res.json({ ok: false, reason: '邀请码不存在，请核对后重试' });
  const idx = USERS.findIndex(u => u.id === req.userId);
  if (idx < 0) return res.json({ ok: false, reason: '用户不存在' });
  if (USERS[idx].role === 'property') return res.json({ ok: false, reason: '物业账号不能修改邀请码' });
  USERS[idx].communityId = community.id;
  saveUsers();
  res.json({ ok: true, community });
});

// ==================== 认证管理 ====================
app.post('/api/certification/submit', authMiddleware, (req, res) => {
  const idx = USERS.findIndex(u => u.id === req.userId);
  if (idx < 0) return res.json({ ok: false, reason: '账号不存在' });
  const user = USERS[idx];
  if (user.role !== 'property' && user.role !== 'restaurant') {
    return res.json({ ok: false, reason: '该类型账号无需认证' });
  }
  const cert = user.certification || {};
  cert.companyName = req.body.companyName || '';
  cert.contactName = req.body.contactName || '';
  cert.documents = req.body.documents || [];

  if (user.role === 'property') {
    const inviteCode = String(req.body.inviteCode || '').trim();
    if (!inviteCode) return res.json({ ok: false, reason: '请填写社区邀请码' });
    const other = USERS.find(u => u.id !== user.id && u.role === 'property' &&
      (u.certification || {}).inviteCode === inviteCode);
    if (other) return res.json({ ok: false, reason: '该邀请码已被其他物业使用，请更换' });
    if (!findCommunityByInviteCode(inviteCode)) {
      COMMUNITIES.push({
        id: uid('c_'),
        name: cert.companyName || inviteCode,
        inviteCode: inviteCode,
        createdAt: now()
      });
      saveCommunities();
    }
    cert.inviteCode = inviteCode;
  }

  if (user.role === 'restaurant' && req.body.restaurantData) {
    cert.restaurantData = req.body.restaurantData;
  }
  cert.status = 'pending';
  cert.submittedAt = now();
  cert.reviewNote = '';
  cert.reviewedAt = 0;
  USERS[idx].certification = cert;
  USERS[idx].status = 'pending_cert';
  saveUsers();
  res.json({ ok: true });
});

app.get('/api/certifications', authMiddleware, requireRole('admin'), (req, res) => {
  const { role, status } = req.query;
  let list = USERS.filter(u => u.role === 'property' || u.role === 'restaurant');
  if (role) list = list.filter(u => u.role === role);
  if (status) list = list.filter(u => (u.certification || {}).status === status);
  list.sort((a, b) => ((b.certification || {}).submittedAt || 0) - ((a.certification || {}).submittedAt || 0));
  res.json({ ok: true, list, total: list.length });
});

app.post('/api/certifications/:userId/review', authMiddleware, requireRole('admin'), (req, res) => {
  const { approve, reviewNote } = req.body;
  const idx = USERS.findIndex(u => u.id === req.params.userId);
  if (idx < 0) return res.json({ ok: false, reason: '用户不存在' });
  const user = USERS[idx];
  if (user.role !== 'property' && user.role !== 'restaurant') {
    return res.json({ ok: false, reason: '该账号类型无需审核' });
  }
  const cert = user.certification || {};
  cert.status = approve ? 'approved' : 'rejected';
  cert.reviewNote = reviewNote || '';
  cert.reviewedAt = now();
  USERS[idx].certification = cert;
  USERS[idx].status = approve ? 'active' : 'pending_cert';

  if (user.role === 'property' && approve && cert.inviteCode) {
    const community = findCommunityByInviteCode(cert.inviteCode);
    if (community) USERS[idx].communityId = community.id;
  }
  saveUsers();
  res.json({ ok: true });
});

// ==================== 公告管理 ====================
app.get('/api/announcements', (req, res) => {
  const { communityId } = req.query;
  let list = ANNOUNCEMENTS.slice().sort((a, b) => b.createdAt - a.createdAt);
  if (communityId) list = list.filter(a => a.communityId === communityId);
  res.json({ ok: true, list, total: list.length });
});

app.post('/api/announcements', authMiddleware, (req, res) => {
  const { title, content, communityId } = req.body;
  if (!title || !content) return res.json({ ok: false, reason: '请填写标题和正文' });
  const user = findUserById(req.userId);
  const ann = {
    id: uid('ann_'),
    title: String(title).trim(),
    content: String(content).trim(),
    authorId: req.userId,
    authorPhone: user ? user.phone : '',
    communityId: communityId || '',
    createdAt: now()
  };
  ANNOUNCEMENTS.unshift(ann);
  saveAnnouncements();
  res.json({ ok: true, announcement: ann });
});

app.delete('/api/announcements/:id', authMiddleware, (req, res) => {
  const idx = ANNOUNCEMENTS.findIndex(a => a.id === req.params.id);
  if (idx < 0) return res.json({ ok: false, reason: '公告不存在' });
  if (req.userRole !== 'admin' && ANNOUNCEMENTS[idx].authorId !== req.userId) {
    return res.json({ ok: false, reason: '权限不足' });
  }
  ANNOUNCEMENTS.splice(idx, 1);
  saveAnnouncements();
  res.json({ ok: true });
});

// ==================== 设施管理 ====================
app.get('/api/facilities', (req, res) => {
  const { category, district, street } = req.query;
  let list = FACILITIES.slice().sort((a, b) => b.createdAt - a.createdAt);
  if (category) list = list.filter(f => f.category === category);
  if (district) list = list.filter(f => f.district === district);
  if (street) list = list.filter(f => f.street === street);
  res.json({ ok: true, list, total: list.length });
});

app.post('/api/facilities', authMiddleware, requireRole('admin'), (req, res) => {
  const { name, category, address, district, street, distance } = req.body;
  if (!name || !category || !district) {
    return res.json({ ok: false, reason: '请填写设施名称、分类和所属区/县' });
  }
  const facility = {
    id: uid('f_'),
    category: String(category).trim(),
    name: String(name).trim(),
    address: String(address || '').trim(),
    district: String(district).trim(),
    street: String(street || '').trim(),
    distance: parseInt(distance, 10) || 0,
    createdAt: now()
  };
  FACILITIES.push(facility);
  saveFacilities();
  res.json({ ok: true, facility });
});

app.delete('/api/facilities/:id', authMiddleware, requireRole('admin'), (req, res) => {
  const idx = FACILITIES.findIndex(f => f.id === req.params.id);
  if (idx < 0) return res.json({ ok: false, reason: '设施不存在' });
  FACILITIES.splice(idx, 1);
  saveFacilities();
  res.json({ ok: true });
});

// ==================== 商品管理 ====================
app.get('/api/products', (req, res) => {
  const { cat, city, district, street, keyword, merchantId, status } = req.query;
  let list = PRODUCTS.filter(p => p.status === 'active');
  if (status) list = PRODUCTS.filter(p => p.status === status);
  if (cat && cat !== 'all') list = list.filter(p => p.cat === cat);
  if (keyword) {
    const kw = String(keyword).toLowerCase();
    list = list.filter(p =>
      p.title.toLowerCase().includes(kw) ||
      p.desc.toLowerCase().includes(kw)
    );
  }
  if (merchantId) list = list.filter(p => p.merchantId === merchantId);
  list = list.sort((a, b) => b.createdAt - a.createdAt);
  res.json({ ok: true, list, total: list.length });
});

app.get('/api/products/:id', (req, res) => {
  const p = PRODUCTS.find(x => x.id === req.params.id);
  if (!p) return res.json({ ok: false, reason: '商品不存在' });
  res.json({ ok: true, product: p });
});

app.post('/api/products', authMiddleware, (req, res) => {
  const { title, desc, price, cat, photo, merchantId, merchantName, city, district, street, address } = req.body;
  if (!title || !cat) return res.json({ ok: false, reason: '请填写标题和分类' });
  const user = findUserById(req.userId);
  const priceNum = parseFloat(price) || 0;
  const product = {
    id: uid('p_'),
    title: String(title).trim(),
    desc: String(desc || '').trim(),
    price: priceNum,
    cat: cat,
    photo: photo || '',
    merchantId: merchantId || req.userId,
    merchantName: merchantName || (user ? user.phone : ''),
    city: city || '',
    district: district || '',
    street: street || '',
    address: address || '',
    status: 'active',
    createdAt: now(),
    updatedAt: now()
  };
  PRODUCTS.unshift(product);
  saveProducts();
  res.json({ ok: true, product });
});

app.put('/api/products/:id', authMiddleware, (req, res) => {
  const idx = PRODUCTS.findIndex(x => x.id === req.params.id);
  if (idx < 0) return res.json({ ok: false, reason: '商品不存在' });
  if (req.userRole !== 'admin' && PRODUCTS[idx].merchantId !== req.userId) {
    return res.json({ ok: false, reason: '权限不足' });
  }
  PRODUCTS[idx] = { ...PRODUCTS[idx], ...req.body, id: PRODUCTS[idx].id, updatedAt: now() };
  saveProducts();
  res.json({ ok: true, product: PRODUCTS[idx] });
});

app.delete('/api/products/:id', authMiddleware, (req, res) => {
  const idx = PRODUCTS.findIndex(x => x.id === req.params.id);
  if (idx < 0) return res.json({ ok: false, reason: '商品不存在' });
  if (req.userRole !== 'admin' && PRODUCTS[idx].merchantId !== req.userId) {
    return res.json({ ok: false, reason: '权限不足' });
  }
  PRODUCTS.splice(idx, 1);
  saveProducts();
  res.json({ ok: true });
});

// ==================== 订单管理 ====================
app.get('/api/orders', authMiddleware, (req, res) => {
  const { merchantId, buyerPhone, status } = req.query;
  let list = ORDERS;
  if (req.userRole !== 'admin') {
    list = list.filter(o => o.merchantId === req.userId || o.buyerId === req.userId);
  }
  if (merchantId && req.userRole === 'admin') list = list.filter(o => o.merchantId === merchantId);
  if (buyerPhone) list = list.filter(o => o.buyerPhone === buyerPhone);
  if (status) list = list.filter(o => o.status === status);
  list = list.sort((a, b) => b.createdAt - a.createdAt);
  res.json({ ok: true, list, total: list.length });
});

app.get('/api/orders/:id', authMiddleware, (req, res) => {
  const o = ORDERS.find(x => x.id === req.params.id);
  if (!o) return res.json({ ok: false, reason: '订单不存在' });
  if (req.userRole !== 'admin' && o.merchantId !== req.userId && o.buyerId !== req.userId) {
    return res.json({ ok: false, reason: '权限不足' });
  }
  res.json({ ok: true, order: o });
});

app.post('/api/orders', (req, res) => {
  const { productId, buyerName, buyerPhone, buyerAddress, payMethod, buyerId } = req.body;
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return res.json({ ok: false, reason: '商品不存在' });
  if (product.status !== 'active') return res.json({ ok: false, reason: '商品已下架' });

  const order = {
    id: uid('o_'),
    orderNo: 'ORD' + Date.now() + Math.floor(Math.random() * 10000),
    productId: product.id,
    productTitle: product.title,
    productPhoto: product.photo,
    price: product.price,
    payMethod: payMethod || 'wechat',
    status: 'pending',
    buyerId: buyerId || '',
    buyerName: buyerName || '',
    buyerPhone: buyerPhone || '',
    buyerAddress: buyerAddress || '',
    merchantId: product.merchantId || '',
    merchantName: product.merchantName || '',
    createdAt: now(),
    paidAt: 0,
    tradeNo: ''
  };
  ORDERS.unshift(order);
  saveOrders();
  res.json({ ok: true, order });
});

// ==================== 支付相关 ====================
app.post('/api/pay/create', (req, res) => {
  const { orderId, payMethod } = req.body;
  const order = ORDERS.find(o => o.id === orderId);
  if (!order) return res.json({ ok: false, reason: '订单不存在' });
  if (order.status === 'paid') return res.json({ ok: false, reason: '订单已支付' });

  let qrCode = '';
  let payUrl = '';

  if (order.merchantId && MERCHANTS[order.merchantId]) {
    const mc = MERCHANTS[order.merchantId];
    if (payMethod === 'wechat' && mc.wechat && mc.wechat.enabled) {
      qrCode = mc.wechat.qrCode || '';
    } else if (payMethod === 'alipay' && mc.alipay && mc.alipay.enabled) {
      qrCode = mc.alipay.qrCode || '';
    }
  }

  if (!qrCode && PAY_CONFIG.admin) {
    if (payMethod === 'wechat' && PAY_CONFIG.admin.wechat && PAY_CONFIG.admin.wechat.enabled) {
      qrCode = PAY_CONFIG.admin.wechat.qrCode || '';
      payUrl = PAY_CONFIG.admin.wechat.payUrl || '';
    } else if (payMethod === 'alipay' && PAY_CONFIG.admin.alipay && PAY_CONFIG.admin.alipay.enabled) {
      qrCode = PAY_CONFIG.admin.alipay.qrCode || '';
      payUrl = PAY_CONFIG.admin.alipay.payUrl || '';
    }
  }

  res.json({
    ok: true,
    orderId: order.id,
    orderNo: order.orderNo,
    payMethod: payMethod || 'wechat',
    amount: order.price,
    qrCode: qrCode,
    payUrl: payUrl
  });
});

app.post('/api/pay/notify', (req, res) => {
  const { orderNo, payMethod, tradeNo } = req.body;
  const order = ORDERS.find(o => o.orderNo === orderNo);
  if (!order) return res.json({ ok: false, reason: '订单不存在' });
  if (order.status === 'paid') return res.json({ ok: true, order });
  order.status = 'paid';
  order.paidAt = now();
  order.tradeNo = tradeNo || '';
  order.payMethod = payMethod || order.payMethod;
  saveOrders();
  res.json({ ok: true, order });
});

app.post('/api/pay/simulate', (req, res) => {
  const { orderId } = req.body;
  const order = ORDERS.find(o => o.id === orderId);
  if (!order) return res.json({ ok: false, reason: '订单不存在' });
  if (order.status === 'paid') return res.json({ ok: true, order });
  order.status = 'paid';
  order.paidAt = now();
  order.tradeNo = 'SIM' + Date.now();
  saveOrders();
  res.json({ ok: true, order });
});

app.get('/api/pay/config', (req, res) => {
  const { merchantId } = req.query;
  let config = null;
  if (merchantId && MERCHANTS[merchantId]) {
    config = MERCHANTS[merchantId];
  } else {
    config = PAY_CONFIG.admin || {};
  }
  res.json({ ok: true, config });
});

app.post('/api/admin/pay/config', authMiddleware, requireRole('admin'), (req, res) => {
  const { wechat, alipay } = req.body;
  if (wechat) PAY_CONFIG.admin.wechat = { ...PAY_CONFIG.admin.wechat, ...wechat };
  if (alipay) PAY_CONFIG.admin.alipay = { ...PAY_CONFIG.admin.alipay, ...alipay };
  savePayConfig();
  res.json({ ok: true, config: PAY_CONFIG.admin });
});

app.get('/api/merchants/:id/pay', (req, res) => {
  const m = MERCHANTS[req.params.id] || null;
  res.json({ ok: true, config: m });
});

app.post('/api/merchants/:id/pay', authMiddleware, (req, res) => {
  const { wechat, alipay } = req.body;
  const mid = req.params.id;
  if (!MERCHANTS[mid]) {
    MERCHANTS[mid] = { wechat: { enabled: false, qrCode: '' }, alipay: { enabled: false, qrCode: '' } };
  }
  if (wechat) MERCHANTS[mid].wechat = { ...MERCHANTS[mid].wechat, ...wechat };
  if (alipay) MERCHANTS[mid].alipay = { ...MERCHANTS[mid].alipay, ...alipay };
  saveMerchants();
  res.json({ ok: true, config: MERCHANTS[mid] });
});

// ==================== 管理员统计 ====================
app.get('/api/admin/stats', authMiddleware, requireRole('admin'), (req, res) => {
  const userCount = USERS.filter(u => u.role === 'user').length;
  const propertyCount = USERS.filter(u => u.role === 'property').length;
  const restaurantCount = USERS.filter(u => u.role === 'restaurant').length;
  const certPending = USERS.filter(u =>
    (u.role === 'property' || u.role === 'restaurant') &&
    (u.certification || {}).status === 'pending'
  ).length;
  const productCount = PRODUCTS.filter(p => p.status === 'active').length;
  const orderCount = ORDERS.length;
  const paidCount = ORDERS.filter(o => o.status === 'paid').length;
  const totalAmount = ORDERS.filter(o => o.status === 'paid').reduce((s, o) => s + (o.price || 0), 0);
  const announcementCount = ANNOUNCEMENTS.length;
  const communityCount = COMMUNITIES.length;
  const merchantCount = Object.keys(MERCHANTS).length;

  res.json({
    ok: true,
    stats: {
      userCount,
      propertyCount,
      restaurantCount,
      certPending,
      productCount,
      orderCount,
      paidCount,
      totalAmount,
      announcementCount,
      communityCount,
      merchantCount
    }
  });
});

// ==================== 启动服务 ====================
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀  社区智慧服务系统已启动');
  console.log('='.repeat(60));
  console.log(`📍 本地访问: http://localhost:${PORT}`);
  console.log(`📁 静态文件: ${__dirname}`);
  console.log(`💾 数据目录: ${DATA_DIR}`);
  console.log('\n📋 页面列表:');
  console.log(`   - 首页:       http://localhost:${PORT}/experience.html`);
  console.log(`   - 附近资源:   http://localhost:${PORT}/nearby.html`);
  console.log(`   - 商家中心:   http://localhost:${PORT}/merchant.html`);
  console.log(`   - 管理后台:   http://localhost:${PORT}/admin.html`);
  console.log(`   - 支付配置:   http://localhost:${PORT}/pay-admin.html`);
  console.log(`   - 个人中心:   http://localhost:${PORT}/my.html`);
  console.log(`   - 公告页面:   http://localhost:${PORT}/announcements.html`);
  console.log(`   - 设施页面:   http://localhost:${PORT}/facilities.html`);
  console.log('\n🔑 管理员登录:');
  console.log(`   - 账号: admin`);
  console.log(`   - 密码: admin888`);
  console.log('\n📡 API列表:');
  console.log(`   - 健康检查: GET  /api/health`);
  console.log(`   - 用户登录: POST /api/auth/login`);
  console.log(`   - 管理员登录: POST /api/auth/admin-login`);
  console.log(`   - 商品列表: GET  /api/products`);
  console.log(`   - 订单列表: GET  /api/orders`);
  console.log('='.repeat(60) + '\n');
});
