/**
 * 项目初始化脚本 - 生成测试账号和示例数据
 * 运行: node init-data.js
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function uid(prefix) {
  return (prefix || 'id_') + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}
function now() { return Date.now(); }

// 随机手机号生成
function randomPhone() {
  const prefixes = ['138', '139', '158', '159', '188', '189', '136', '137', '150', '151'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  let suffix = '';
  for (let i = 0; i < 8; i++) suffix += Math.floor(Math.random() * 10);
  return prefix + suffix;
}

// 生成测试账号
const accounts = [];

// 1. 超级管理员
const admin = {
  id: uid('u_'),
  phone: 'admin',
  role: 'admin',
  status: 'active',
  communityId: '',
  createdAt: now()
};
accounts.push({ role: '超级管理员', phone: 'admin', password: 'admin888', note: '管理员专用登录，密码固定' });

// 2. 普通用户 (3个)
const normalUsers = [];
for (let i = 0; i < 3; i++) {
  const phone = randomPhone();
  normalUsers.push({
    id: uid('u_'),
    phone: phone,
    role: 'user',
    status: 'active',
    communityId: '',
    createdAt: now()
  });
  accounts.push({ role: '普通用户', phone: phone, password: '验证码登录', note: '登录时点击获取验证码，控制台会显示验证码' });
}

// 3. 物业账号 (1个已认证, 1个待审核)
const propertyApproved = {
  id: uid('u_'),
  phone: randomPhone(),
  role: 'property',
  status: 'active',
  communityId: '',
  createdAt: now() - 86400000 * 30,
  certification: {
    companyName: '阳光社区物业管理有限公司',
    contactName: '王经理',
    documents: [],
    inviteCode: 'SUNSHINE2024',
    restaurantData: null,
    status: 'approved',
    reviewNote: '资料齐全，审核通过',
    submittedAt: now() - 86400000 * 30,
    reviewedAt: now() - 86400000 * 29
  }
};
accounts.push({ role: '物业账号(已认证)', phone: propertyApproved.phone, password: '验证码登录', note: '社区：阳光社区，邀请码：SUNSHINE2024' });

const propertyPending = {
  id: uid('u_'),
  phone: randomPhone(),
  role: 'property',
  status: 'pending_cert',
  communityId: '',
  createdAt: now() - 86400000 * 2,
  certification: {
    companyName: '绿城物业服务有限公司',
    contactName: '李主管',
    documents: [],
    inviteCode: 'GREENCITY2024',
    restaurantData: null,
    status: 'pending',
    reviewNote: '',
    submittedAt: now() - 86400000 * 2,
    reviewedAt: 0
  }
};
accounts.push({ role: '物业账号(待审核)', phone: propertyPending.phone, password: '验证码登录', note: '待管理员审核' });

// 4. 餐饮商家账号 (1个已认证, 1个待审核)
const restaurantApproved = {
  id: uid('u_'),
  phone: randomPhone(),
  role: 'restaurant',
  status: 'active',
  communityId: '',
  createdAt: now() - 86400000 * 20,
  certification: {
    companyName: '味多美烘焙坊',
    contactName: '陈店长',
    documents: [],
    inviteCode: '',
    restaurantData: {
      shopName: '味多美烘焙坊(社区店)',
      kitchenPhotos: [],
      shopPhotos: [],
      licensePhoto: null
    },
    status: 'approved',
    reviewNote: '资质齐全，卫生条件良好',
    submittedAt: now() - 86400000 * 20,
    reviewedAt: now() - 86400000 * 19
  }
};
accounts.push({ role: '餐饮商家(已认证)', phone: restaurantApproved.phone, password: '验证码登录', note: '店铺：味多美烘焙坊' });

const restaurantPending = {
  id: uid('u_'),
  phone: randomPhone(),
  role: 'restaurant',
  status: 'pending_cert',
  communityId: '',
  createdAt: now() - 86400000 * 1,
  certification: {
    companyName: '川香小馆',
    contactName: '张老板',
    documents: [],
    inviteCode: '',
    restaurantData: {
      shopName: '川香小馆',
      kitchenPhotos: [],
      shopPhotos: [],
      licensePhoto: null
    },
    status: 'pending',
    reviewNote: '',
    submittedAt: now() - 86400000 * 1,
    reviewedAt: 0
  }
};
accounts.push({ role: '餐饮商家(待审核)', phone: restaurantPending.phone, password: '验证码登录', note: '待管理员审核' });

// 社区数据
const communities = [
  {
    id: uid('c_'),
    name: '阳光社区',
    inviteCode: 'SUNSHINE2024',
    createdAt: now() - 86400000 * 60
  },
  {
    id: uid('c_'),
    name: '绿城花园',
    inviteCode: 'GREENCITY2024',
    createdAt: now() - 86400000 * 30
  }
];

// 绑定社区ID
propertyApproved.communityId = communities[0].id;
normalUsers[0].communityId = communities[0].id;
normalUsers[1].communityId = communities[0].id;

// 公告数据
const announcements = [
  {
    id: uid('ann_'),
    title: '关于社区垃圾分类的通知',
    content: '各位居民：\n\n为推进社区垃圾分类工作，自本月起，社区将在各单元楼门口设置分类垃圾桶，请大家按照指引正确投放垃圾。\n\n感谢配合！',
    authorId: propertyApproved.id,
    authorPhone: propertyApproved.phone,
    communityId: communities[0].id,
    createdAt: now() - 86400000 * 5
  },
  {
    id: uid('ann_'),
    title: '社区端午活动通知',
    content: '各位居民朋友：\n\n端午节即将到来，社区将于6月10日下午2点在社区广场举办端午包粽子活动，欢迎大家踊跃参加！\n\n报名方式：到社区物业办公室登记',
    authorId: propertyApproved.id,
    authorPhone: propertyApproved.phone,
    communityId: communities[0].id,
    createdAt: now() - 86400000 * 3
  },
  {
    id: uid('ann_'),
    title: '电梯维保通知',
    content: '尊敬的业主：\n\n为保障电梯安全运行，小区电梯将于本周六进行例行维保，期间电梯暂停使用。\n\n时间：周六 9:00-12:00\n给您带来不便，敬请谅解。',
    authorId: propertyApproved.id,
    authorPhone: propertyApproved.phone,
    communityId: communities[0].id,
    createdAt: now() - 86400000 * 1
  }
];

// 商品数据
const products = [
  {
    id: uid('p_'),
    title: '当日面包组合套餐',
    desc: '当日未售出面包组合，包含吐司、牛角包、餐包各一份，原价48元，现价12元。新鲜保证，当天生产。',
    price: 12,
    cat: 'food',
    photo: '🥐',
    merchantId: restaurantApproved.id,
    merchantName: '味多美烘焙坊',
    city: '北京市',
    district: '朝阳区',
    street: '望京街道',
    address: '阳光社区东门底商',
    status: 'active',
    createdAt: now() - 3600000 * 2,
    updatedAt: now() - 3600000 * 2
  },
  {
    id: uid('p_'),
    title: '寿司便当半价',
    desc: '今日剩余寿司便当，三文鱼、金枪鱼、鳗鱼各2贯，原价68元，现价30元。仅3份，先到先得。',
    price: 30,
    cat: 'food',
    photo: '🍣',
    merchantId: restaurantApproved.id,
    merchantName: '味多美烘焙坊',
    city: '北京市',
    district: '朝阳区',
    street: '望京街道',
    address: '阳光社区东门底商',
    status: 'active',
    createdAt: now() - 3600000 * 4,
    updatedAt: now() - 3600000 * 4
  },
  {
    id: uid('p_'),
    title: '九成新儿童自行车',
    desc: '孩子长大了用不上，8成新，16寸儿童自行车，带辅助轮。原价399元，免费赠送，自提。',
    price: 0,
    cat: 'item',
    photo: '🚲',
    merchantId: normalUsers[0].id,
    merchantName: '王女士',
    city: '北京市',
    district: '朝阳区',
    street: '望京街道',
    address: '阳光社区3号楼2单元',
    status: 'active',
    createdAt: now() - 3600000 * 8,
    updatedAt: now() - 3600000 * 8
  },
  {
    id: uid('p_'),
    title: '闲置书籍一批',
    desc: '文学历史类书籍约20本，包括《百年孤独》《三体》《人类简史》等，免费赠送，打包优先。',
    price: 0,
    cat: 'item',
    photo: '📚',
    merchantId: normalUsers[1].id,
    merchantName: '李先生',
    city: '北京市',
    district: '朝阳区',
    street: '望京街道',
    address: '阳光社区5号楼1单元',
    status: 'active',
    createdAt: now() - 86400000,
    updatedAt: now() - 86400000
  },
  {
    id: uid('p_'),
    title: '电饭煲转让',
    desc: '美的电饭煲，5L容量，使用半年，功能完好，搬家转让。原价299元，现价80元。',
    price: 80,
    cat: 'item',
    photo: '🍚',
    merchantId: normalUsers[2].id,
    merchantName: '张先生',
    city: '北京市',
    district: '朝阳区',
    street: '望京街道',
    address: '阳光社区8号楼3单元',
    status: 'active',
    createdAt: now() - 86400000 * 2,
    updatedAt: now() - 86400000 * 2
  }
];

// 写入数据
const allUsers = [admin, ...normalUsers, propertyApproved, propertyPending, restaurantApproved, restaurantPending];

fs.writeFileSync(path.join(DATA_DIR, 'users.json'), JSON.stringify(allUsers, null, 2), 'utf8');
fs.writeFileSync(path.join(DATA_DIR, 'communities.json'), JSON.stringify(communities, null, 2), 'utf8');
fs.writeFileSync(path.join(DATA_DIR, 'announcements.json'), JSON.stringify(announcements, null, 2), 'utf8');
fs.writeFileSync(path.join(DATA_DIR, 'products.json'), JSON.stringify(products, null, 2), 'utf8');
fs.writeFileSync(path.join(DATA_DIR, 'orders.json'), JSON.stringify([], null, 2), 'utf8');
fs.writeFileSync(path.join(DATA_DIR, 'codes.json'), JSON.stringify({}, null, 2), 'utf8');
fs.writeFileSync(path.join(DATA_DIR, 'facilities.json'), JSON.stringify([], null, 2), 'utf8');
fs.writeFileSync(path.join(DATA_DIR, 'sessions.json'), JSON.stringify({}, null, 2), 'utf8');
fs.writeFileSync(path.join(DATA_DIR, 'merchants.json'), JSON.stringify({}, null, 2), 'utf8');
fs.writeFileSync(path.join(DATA_DIR, 'pay_config.json'), JSON.stringify({
  admin: {
    wechat: { enabled: false, appId: '', mchId: '', key: '', notifyUrl: '', qrCode: '' },
    alipay: { enabled: false, appId: '', merchantId: '', privateKey: '', notifyUrl: '', qrCode: '' }
  }
}, null, 2), 'utf8');

// 输出账号清单
console.log('\n' + '='.repeat(60));
console.log('✅ 初始化数据生成完成！');
console.log('='.repeat(60));
console.log('\n📋 测试账号清单：\n');

let idx = 1;
for (const acc of accounts) {
  console.log(`${idx}. [${acc.role}]`);
  console.log(`   手机号: ${acc.phone}`);
  console.log(`   密码:   ${acc.password}`);
  if (acc.note) console.log(`   备注:   ${acc.note}`);
  console.log();
  idx++;
}

console.log('='.repeat(60));
console.log('\n🚀 启动命令:');
console.log('   npm install  (首次运行)');
console.log('   npm start');
console.log('\n🌐 访问地址: http://localhost:3000');
console.log('\n📁 数据目录: data/');
console.log('='.repeat(60) + '\n');
