const fs = require('fs');

// 维度数据定义
const salespersons = [
  { id: 'SP001', name: '张伟', region: '华东' },
  { id: 'SP002', name: '李娜', region: '华东' },
  { id: 'SP003', name: '王强', region: '华北' },
  { id: 'SP004', name: '刘洋', region: '华北' },
  { id: 'SP005', name: '陈静', region: '华南' },
  { id: 'SP006', name: '赵磊', region: '华南' },
  { id: 'SP007', name: '孙芳', region: '西南' },
  { id: 'SP008', name: '周明', region: '西南' },
  { id: 'SP009', name: '吴刚', region: '东北' },
  { id: 'SP010', name: '郑秀', region: '东北' },
  { id: 'SP011', name: '王建国', region: '华中' },
  { id: 'SP012', name: '李雪', region: '华中' },
  { id: 'SP013', name: '张敏', region: '西北' },
  { id: 'SP014', name: '刘强', region: '西北' },
  { id: 'SP015', name: '陈丽', region: '华东' },
  { id: 'SP016', name: '杨帆', region: '华北' },
  { id: 'SP017', name: '赵军', region: '华南' },
  { id: 'SP018', name: '黄蕾', region: '西南' },
  { id: 'SP019', name: '周涛', region: '东北' },
  { id: 'SP020', name: '吴婷', region: '华中' }
];

const customers = [
  { id: 'C001', name: '华为技术有限公司', industry: '科技', province: '广东' },
  { id: 'C002', name: '腾讯科技', industry: '科技', province: '广东' },
  { id: 'C003', name: '阿里巴巴集团', industry: '科技', province: '浙江' },
  { id: 'C004', name: '百度在线', industry: '科技', province: '北京' },
  { id: 'C005', name: '小米科技', industry: '科技', province: '北京' },
  { id: 'C006', name: '京东集团', industry: '电商', province: '北京' },
  { id: 'C007', name: '拼多多', industry: '电商', province: '上海' },
  { id: 'C008', name: '美团点评', industry: '电商', province: '北京' },
  { id: 'C009', name: '字节跳动', industry: '科技', province: '北京' },
  { id: 'C010', name: '网易公司', industry: '科技', province: '浙江' },
  { id: 'C011', name: '中国银行', industry: '金融', province: '北京' },
  { id: 'C012', name: '工商银行', industry: '金融', province: '北京' },
  { id: 'C013', name: '建设银行', industry: '金融', province: '北京' },
  { id: 'C014', name: '农业银行', industry: '金融', province: '北京' },
  { id: 'C015', name: '招商银行', industry: '金融', province: '广东' },
  { id: 'C016', name: '平安保险', industry: '金融', province: '广东' },
  { id: 'C017', name: '上汽集团', industry: '制造', province: '上海' },
  { id: 'C018', name: '一汽集团', industry: '制造', province: '吉林' },
  { id: 'C019', name: '东风汽车', industry: '制造', province: '湖北' },
  { id: 'C020', name: '海尔集团', industry: '制造', province: '山东' },
  { id: 'C021', name: '格力电器', industry: '制造', province: '广东' },
  { id: 'C022', name: '美的集团', industry: '制造', province: '广东' },
  { id: 'C023', name: '中国建筑', industry: '建筑', province: '北京' },
  { id: 'C024', name: '中国中铁', industry: '建筑', province: '北京' },
  { id: 'C025', name: '万科企业', industry: '房地产', province: '广东' },
  { id: 'C026', name: '碧桂园', industry: '房地产', province: '广东' },
  { id: 'C027', name: '恒大集团', industry: '房地产', province: '广东' },
  { id: 'C028', name: '保利发展', industry: '房地产', province: '广东' },
  { id: 'C029', name: '中国石油', industry: '能源', province: '北京' },
  { id: 'C030', name: '中国石化', industry: '能源', province: '北京' },
  { id: 'C031', name: '国家电网', industry: '能源', province: '北京' },
  { id: 'C032', name: '华能集团', industry: '能源', province: '北京' },
  { id: 'C033', name: '中国移动', industry: '通信', province: '北京' },
  { id: 'C034', name: '中国联通', industry: '通信', province: '北京' },
  { id: 'C035', name: '中国电信', industry: '通信', province: '北京' },
  { id: 'C036', name: '中兴通讯', industry: '通信', province: '广东' },
  { id: 'C037', name: '顺丰控股', industry: '物流', province: '广东' },
  { id: 'C038', name: '圆通速递', industry: '物流', province: '上海' },
  { id: 'C039', name: '韵达股份', industry: '物流', province: '上海' },
  { id: 'C040', name: '申通快递', industry: '物流', province: '上海' },
  { id: 'C041', name: '科大讯飞', industry: '科技', province: '安徽' },
  { id: 'C042', name: '大疆创新', industry: '科技', province: '广东' },
  { id: 'C043', name: '商汤科技', industry: '科技', province: '北京' },
  { id: 'C044', name: '旷视科技', industry: '科技', province: '北京' },
  { id: 'C045', name: '用友网络', industry: '科技', province: '北京' },
  { id: 'C046', name: '金蝶国际', industry: '科技', province: '广东' },
  { id: 'C047', name: '浪潮集团', industry: '科技', province: '山东' },
  { id: 'C048', name: '新华三', industry: '科技', province: '浙江' },
  { id: 'C049', name: '紫光股份', industry: '科技', province: '北京' },
  { id: 'C050', name: '联想集团', industry: '科技', province: '北京' }
];

const regions = {
  '北京': { cities: ['北京'], region: '华北' },
  '天津': { cities: ['天津'], region: '华北' },
  '河北': { cities: ['石家庄', '唐山', '秦皇岛'], region: '华北' },
  '山西': { cities: ['太原', '大同', '临汾'], region: '华北' },
  '内蒙古': { cities: ['呼和浩特', '包头', '鄂尔多斯'], region: '华北' },
  '辽宁': { cities: ['沈阳', '大连', '鞍山'], region: '东北' },
  '吉林': { cities: ['长春', '吉林', '四平'], region: '东北' },
  '黑龙江': { cities: ['哈尔滨', '齐齐哈尔', '大庆'], region: '东北' },
  '上海': { cities: ['上海'], region: '华东' },
  '江苏': { cities: ['南京', '苏州', '无锡', '常州'], region: '华东' },
  '浙江': { cities: ['杭州', '宁波', '温州', '嘉兴'], region: '华东' },
  '安徽': { cities: ['合肥', '芜湖', '蚌埠'], region: '华东' },
  '福建': { cities: ['福州', '厦门', '泉州'], region: '华东' },
  '江西': { cities: ['南昌', '九江', '赣州'], region: '华东' },
  '山东': { cities: ['济南', '青岛', '烟台', '潍坊'], region: '华东' },
  '河南': { cities: ['郑州', '洛阳', '开封'], region: '华中' },
  '湖北': { cities: ['武汉', '宜昌', '襄阳'], region: '华中' },
  '湖南': { cities: ['长沙', '株洲', '湘潭'], region: '华中' },
  '广东': { cities: ['广州', '深圳', '东莞', '佛山', '珠海'], region: '华南' },
  '广西': { cities: ['南宁', '柳州', '桂林'], region: '华南' },
  '海南': { cities: ['海口', '三亚'], region: '华南' },
  '重庆': { cities: ['重庆'], region: '西南' },
  '四川': { cities: ['成都', '绵阳', '德阳'], region: '西南' },
  '贵州': { cities: ['贵阳', '遵义', '六盘水'], region: '西南' },
  '云南': { cities: ['昆明', '大理', '丽江'], region: '西南' },
  '西藏': { cities: ['拉萨'], region: '西南' },
  '陕西': { cities: ['西安', '宝鸡', '咸阳'], region: '西北' },
  '甘肃': { cities: ['兰州', '天水', '酒泉'], region: '西北' },
  '青海': { cities: ['西宁'], region: '西北' },
  '宁夏': { cities: ['银川'], region: '西北' },
  '新疆': { cities: ['乌鲁木齐', '喀什', '伊犁'], region: '西北' }
};

const products = [
  { id: 'P001', name: '智能终端 X1', category: '电子设备', price: 2500 },
  { id: 'P002', name: '智能终端 X2 Pro', category: '电子设备', price: 4500 },
  { id: 'P003', name: '笔记本电脑 Air', category: '电子设备', price: 6800 },
  { id: 'P004', name: '笔记本电脑 Pro', category: '电子设备', price: 9800 },
  { id: 'P005', name: '平板电脑 Lite', category: '电子设备', price: 2200 },
  { id: 'P006', name: '智能手表 S1', category: '智能穿戴', price: 1200 },
  { id: 'P007', name: '智能手环 M2', category: '智能穿戴', price: 399 },
  { id: 'P008', name: '无线耳机 Pro', category: '智能穿戴', price: 899 },
  { id: 'P009', name: '云服务器 标准版', category: '云服务', price: 15000 },
  { id: 'P010', name: '云服务器 高级版', category: '云服务', price: 28000 },
  { id: 'P011', name: '云存储 1TB', category: '云服务', price: 500 },
  { id: 'P012', name: '企业邮箱 50用户', category: '软件服务', price: 8000 },
  { id: 'P013', name: '办公套件 专业版', category: '软件服务', price: 12000 },
  { id: 'P014', name: '数据分析平台', category: '软件服务', price: 35000 },
  { id: 'P015', name: '网络安全套件', category: '软件服务', price: 22000 },
  { id: 'P016', name: '智能路由器 R1', category: '网络设备', price: 1500 },
  { id: 'P017', name: '企业交换机 S2', category: '网络设备', price: 4500 },
  { id: 'P018', name: '无线AP套装', category: '网络设备', price: 2800 },
  { id: 'P019', name: '防火墙设备', category: '网络设备', price: 18000 },
  { id: 'P020', name: '智能摄像头 C1', category: '安防设备', price: 680 },
  { id: 'P021', name: '门禁系统套装', category: '安防设备', price: 3500 },
  { id: 'P022', name: '监控硬盘 4TB', category: '安防设备', price: 1200 },
  { id: 'P023', name: 'LED显示屏 P2', category: '显示设备', price: 8500 },
  { id: 'P024', name: '投影仪商务版', category: '显示设备', price: 5600 },
  { id: 'P025', name: '会议平板 65寸', category: '显示设备', price: 15000 },
  { id: 'P026', name: '打印机激光版', category: '办公设备', price: 3200 },
  { id: 'P027', name: '复印机彩色版', category: '办公设备', price: 12000 },
  { id: 'P028', name: '扫描仪高速版', category: '办公设备', price: 2800 },
  { id: 'P029', name: '碎纸机办公版', category: '办公设备', price: 1500 },
  { id: 'P030', name: '考勤机人脸识别', category: '办公设备', price: 2200 }
];

// 工具函数
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(year) {
  const month = randomInt(1, 12);
  const day = randomInt(1, 28);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getQuarter(month) {
  if (month <= 3) return 'Q1';
  if (month <= 6) return 'Q2';
  if (month <= 9) return 'Q3';
  return 'Q4';
}

// 生成销售记录
const sales = [];
let id = 1;

// 2024年数据
for (let i = 0; i < 1000; i++) {
  const salesperson = salespersons[randomInt(0, salespersons.length - 1)];
  const customer = customers[randomInt(0, customers.length - 1)];
  const product = products[randomInt(0, products.length - 1)];
  const province = customer.province;
  const regionData = regions[province];
  const city = regionData ? regionData.cities[randomInt(0, regionData.cities.length - 1)] : province;
  const date = randomDate(2024);
  const month = parseInt(date.split('-')[1]);
  const quantity = randomInt(5, 100);
  const amount = product.price * quantity;

  sales.push({
    id: id++,
    date,
    year: 2024,
    quarter: getQuarter(month),
    month,
    salesperson_id: salesperson.id,
    salesperson_name: salesperson.name,
    salesperson_region: salesperson.region,
    customer_id: customer.id,
    customer_name: customer.name,
    customer_industry: customer.industry,
    region_province: province,
    region_city: city,
    region: regionData ? regionData.region : '其他',
    product_id: product.id,
    product_name: product.name,
    product_category: product.category,
    amount,
    quantity
  });
}

// 2025年数据（增长10-20%）
for (let i = 0; i < 1000; i++) {
  const salesperson = salespersons[randomInt(0, salespersons.length - 1)];
  const customer = customers[randomInt(0, customers.length - 1)];
  const product = products[randomInt(0, products.length - 1)];
  const province = customer.province;
  const regionData = regions[province];
  const city = regionData ? regionData.cities[randomInt(0, regionData.cities.length - 1)] : province;
  const date = randomDate(2025);
  const month = parseInt(date.split('-')[1]);
  const quantity = randomInt(5, 120); // 2025年销量略高
  const amount = product.price * quantity;

  sales.push({
    id: id++,
    date,
    year: 2025,
    quarter: getQuarter(month),
    month,
    salesperson_id: salesperson.id,
    salesperson_name: salesperson.name,
    salesperson_region: salesperson.region,
    customer_id: customer.id,
    customer_name: customer.name,
    customer_industry: customer.industry,
    region_province: province,
    region_city: city,
    region: regionData ? regionData.region : '其他',
    product_id: product.id,
    product_name: product.name,
    product_category: product.category,
    amount,
    quantity
  });
}

// 构建维度数据
const dimensions = {
  salespersons: salespersons.map(sp => ({
    id: sp.id,
    name: sp.name,
    region: sp.region
  })),
  customers: customers.map(c => ({
    id: c.id,
    name: c.name,
    industry: c.industry,
    province: c.province
  })),
  regions: Object.entries(regions).map(([province, data]) => ({
    province,
    cities: data.cities,
    region: data.region
  })),
  products: products.map(p => ({
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.price
  }))
};

// 输出JSON
const output = { sales, dimensions };

fs.writeFileSync('data/sales_data.json', JSON.stringify(output, null, 2), 'utf-8');

console.log(`生成完成：${sales.length} 条销售记录`);
console.log(`数据已保存到 data/sales_data.json`);
