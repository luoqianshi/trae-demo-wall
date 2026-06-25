// ==================== 多门店数据（星巴克风格）====================

// 产品配方（所有门店共享）
const RECIPES = [
  {
    product_id: 'P001',
    name: '拿铁',
    name_en: 'Caffè Latte',
    category: '手工调制咖啡',
    category_en: 'Handcrafted Coffee',
    price: 32,
    emoji: '☕',
    color: '#C4A77D',
    image_url: 'assets/images/CaffeLatte.png',
    ingredients: [
      { material_id: 'M001', amount: 18 },
      { material_id: 'M002', amount: 240 },
      { material_id: 'M007', amount: 60 }
    ]
  },
  {
    product_id: 'P002',
    name: '美式',
    name_en: 'Caffè Americano',
    category: '手工调制咖啡',
    category_en: 'Handcrafted Coffee',
    price: 28,
    emoji: '🥤',
    color: '#6B4F3A',
    image_url: 'assets/images/CaffeAmericano.png',
    ingredients: [
      { material_id: 'M001', amount: 18 },
      { material_id: 'M008', amount: 350 }
    ]
  },
  {
    product_id: 'P003',
    name: '卡布奇诺',
    name_en: 'Cappuccino',
    category: '手工调制咖啡',
    category_en: 'Handcrafted Coffee',
    price: 30,
    emoji: '🥛',
    color: '#D4B896',
    image_url: 'assets/images/Cappuccino.png',
    ingredients: [
      { material_id: 'M001', amount: 18 },
      { material_id: 'M002', amount: 180 },
      { material_id: 'M007', amount: 120 }
    ]
  },
  {
    product_id: 'P004',
    name: '焦糖玛奇朵',
    name_en: 'Caramel Macchiato',
    category: '手工调制咖啡',
    category_en: 'Handcrafted Coffee',
    price: 35,
    emoji: '🍮',
    color: '#D4A574',
    image_url: 'assets/images/SBX20211029_CaramelMacchiato.png',
    ingredients: [
      { material_id: 'M001', amount: 18 },
      { material_id: 'M002', amount: 240 },
      { material_id: 'M003', amount: 15 },
      { material_id: 'M004', amount: 10 },
      { material_id: 'M007', amount: 60 }
    ]
  },
  {
    product_id: 'P005',
    name: '摩卡',
    name_en: 'Caffè Mocha',
    category: '手工调制咖啡',
    category_en: 'Handcrafted Coffee',
    price: 33,
    emoji: '🍫',
    color: '#8B6914',
    image_url: 'assets/images/SBX20220607_CaffeMocha.png',
    ingredients: [
      { material_id: 'M001', amount: 18 },
      { material_id: 'M002', amount: 220 },
      { material_id: 'M006', amount: 20 },
      { material_id: 'M007', amount: 60 }
    ]
  },
  {
    product_id: 'P006',
    name: '抹茶拿铁',
    name_en: 'Matcha Latte',
    category: '茶拿铁',
    category_en: 'Tea Latte',
    price: 34,
    emoji: '🍵',
    color: '#90B77D',
    image_url: 'assets/images/IcedMatchaTeaLatte.png',
    ingredients: [
      { material_id: 'M002', amount: 240 },
      { material_id: 'M005', amount: 5 },
      { material_id: 'M003', amount: 10 },
      { material_id: 'M007', amount: 60 }
    ]
  },
  {
    product_id: 'P007',
    name: '星冰乐',
    name_en: 'Frappuccino',
    category: '星冰乐',
    category_en: 'Frappuccino',
    price: 36,
    emoji: '🧊',
    color: '#A8D8EA',
    image_url: 'assets/images/CoffeeFrappuccino.png',
    ingredients: [
      { material_id: 'M001', amount: 18 },
      { material_id: 'M002', amount: 200 },
      { material_id: 'M003', amount: 20 },
      { material_id: 'M007', amount: 80 }
    ]
  },
  {
    product_id: 'P008',
    name: '冷萃冰咖啡',
    name_en: 'Cold Brew',
    category: '手工调制咖啡',
    category_en: 'Handcrafted Coffee',
    price: 30,
    emoji: '🧊',
    color: '#4A3728',
    image_url: 'assets/images/ColdBrew.png',
    ingredients: [
      { material_id: 'M001', amount: 22 },
      { material_id: 'M008', amount: 300 }
    ]
  }
];

// 材料成本（所有门店共享）
const MATERIALS = [
  { material_id: 'M001', name: '咖啡豆', unit: 'g', unit_cost: 0.15, supplier: '星巴克烘焙工坊' },
  { material_id: 'M002', name: '牛奶', unit: 'ml', unit_cost: 0.012, supplier: '蒙牛乳业' },
  { material_id: 'M003', name: '糖浆', unit: 'ml', unit_cost: 0.05, supplier: '莫林糖浆' },
  { material_id: 'M004', name: '焦糖酱', unit: 'ml', unit_cost: 0.08, supplier: '好时' },
  { material_id: 'M005', name: '抹茶粉', unit: 'g', unit_cost: 0.2, supplier: '宇治抹茶' },
  { material_id: 'M006', name: '巧克力酱', unit: 'ml', unit_cost: 0.06, supplier: '好时' },
  { material_id: 'M007', name: '奶泡', unit: 'ml', unit_cost: 0.01, supplier: '蒙牛乳业' },
  { material_id: 'M008', name: '水', unit: 'ml', unit_cost: 0.001, supplier: '本地供水' }
];

// 折扣活动数据
const PROMOTIONS = [
  {
    id: 'PROMO001',
    name: '夏日冰饮节',
    name_en: 'Summer Iced Drinks',
    type: 'discount',
    discount_rate: 0.85,
    products: ['P002', 'P006', 'P008'],
    start_date: '2026-05-01',
    end_date: '2026-05-31',
    description: '冰美式、抹茶拿铁、冷萃限时85折',
    badge: '8.5折',
    badge_color: '#FF6B6B'
  },
  {
    id: 'PROMO002',
    name: '下午茶套餐',
    name_en: 'Afternoon Tea Set',
    type: 'bundle',
    bundle_price: 55,
    products: ['P001', 'P003'],
    start_date: '2026-05-01',
    end_date: '2026-05-31',
    description: '拿铁+卡布奇诺套餐价55元',
    badge: '套餐',
    badge_color: '#4ECDC4'
  },
  {
    id: 'PROMO003',
    name: '星冰乐买一送一',
    name_en: 'Frappuccino BOGO',
    type: 'bogo',
    products: ['P007'],
    start_date: '2026-05-15',
    end_date: '2026-05-31',
    description: '星冰乐限时买一送一',
    badge: '买1送1',
    badge_color: '#45B7D1'
  }
];

// 渠道定义
const ONLINE_CHANNELS = ['美团外卖', '淘宝闪购', '微信小程序'];
const OFFLINE_CHANNELS = ['到店取餐'];
const ALL_CHANNELS = [...ONLINE_CHANNELS, ...OFFLINE_CHANNELS];

// 渠道图标和颜色
const CHANNEL_META = {
  '美团外卖': { icon: '🛵', color: '#FFD100', bg: '#FFF8E1' },
  '淘宝闪购': { icon: '📱', color: '#FF5000', bg: '#FFF0E8' },
  '微信小程序': { icon: '💚', color: '#07C160', bg: '#E8F5E9' },
  '到店取餐': { icon: '🏪', color: '#00704A', bg: '#E8F5E9' }
};

// 生成门店销售数据（含多渠道）
function generateStoreSales(storeType) {
  const sales = [];
  const productIds = RECIPES.map(r => r.product_id);

  // 不同门店的基础销量特征
  const baseQuantities = {
    'business': {
      // 国贸店 - 商务区：工作日高，咖啡需求大
      'P001': { weekday: 55, weekend: 35 },
      'P002': { weekday: 48, weekend: 25 },
      'P003': { weekday: 32, weekend: 18 },
      'P004': { weekday: 25, weekend: 15 },
      'P005': { weekday: 22, weekend: 12 },
      'P006': { weekday: 18, weekend: 20 },
      'P007': { weekday: 12, weekend: 35 },
      'P008': { weekday: 20, weekend: 15 }
    },
    'entertainment': {
      // 三里屯店 - 娱乐区：周末高，茶饮/星冰乐需求大
      'P001': { weekday: 35, weekend: 55 },
      'P002': { weekday: 25, weekend: 40 },
      'P003': { weekday: 20, weekend: 32 },
      'P004': { weekday: 15, weekend: 28 },
      'P005': { weekday: 12, weekend: 25 },
      'P006': { weekday: 22, weekend: 38 },
      'P007': { weekday: 18, weekend: 55 },
      'P008': { weekday: 15, weekend: 30 }
    },
    'residential': {
      // 景湖时代城店 - 住宅区：周末/晚间高，家庭消费
      'P001': { weekday: 30, weekend: 50 },
      'P002': { weekday: 22, weekend: 35 },
      'P003': { weekday: 18, weekend: 30 },
      'P004': { weekday: 20, weekend: 32 },
      'P005': { weekday: 15, weekend: 28 },
      'P006': { weekday: 25, weekend: 40 },
      'P007': { weekday: 20, weekend: 48 },
      'P008': { weekday: 12, weekend: 25 }
    },
    'community': {
      // 中熙弥珍道店 - 社区店：平稳，日常消费
      'P001': { weekday: 38, weekend: 42 },
      'P002': { weekday: 30, weekend: 32 },
      'P003': { weekday: 22, weekend: 25 },
      'P004': { weekday: 18, weekend: 20 },
      'P005': { weekday: 16, weekend: 18 },
      'P006': { weekday: 20, weekend: 24 },
      'P007': { weekday: 15, weekend: 28 },
      'P008': { weekday: 14, weekend: 18 }
    }
  };

  const base = baseQuantities[storeType];

  for (let day = 1; day <= 31; day++) {
    const date = `2026-05-${String(day).padStart(2, '0')}`;
    const dateObj = new Date(date);
    const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

    productIds.forEach(pid => {
      const recipe = RECIPES.find(r => r.product_id === pid);
      const dayBase = base[pid][isWeekend ? 'weekend' : 'weekday'];

      // 添加随机波动 (-15% ~ +25%)
      const variation = 0.85 + Math.random() * 0.4;
      const totalQuantity = Math.round(dayBase * variation);

      // 线上 vs 线下分配 (45% 线上, 55% 线下)
      const onlineQty = Math.round(totalQuantity * 0.45);
      const offlineQty = totalQuantity - onlineQty;

      // 线上渠道分配：美团50%, 淘宝25%, 小程序25%
      const meituanQty = Math.round(onlineQty * 0.50);
      const taobaoQty = Math.round(onlineQty * 0.25);
      const wechatQty = onlineQty - meituanQty - taobaoQty;

      // 美团外卖
      if (meituanQty > 0) {
        sales.push({
          date: date,
          product_id: pid,
          quantity: meituanQty,
          revenue: Math.round(meituanQty * recipe.price * 0.88 * 100) / 100, // 美团抽成12%
          channel: '美团外卖'
        });
      }

      // 淘宝闪购
      if (taobaoQty > 0) {
        sales.push({
          date: date,
          product_id: pid,
          quantity: taobaoQty,
          revenue: Math.round(taobaoQty * recipe.price * 0.90 * 100) / 100, // 淘宝抽成10%
          channel: '淘宝闪购'
        });
      }

      // 微信小程序
      if (wechatQty > 0) {
        sales.push({
          date: date,
          product_id: pid,
          quantity: wechatQty,
          revenue: Math.round(wechatQty * recipe.price * 0.95 * 100) / 100, // 小程序抽成5%
          channel: '微信小程序'
        });
      }

      // 到店取餐（原价）
      if (offlineQty > 0) {
        sales.push({
          date: date,
          product_id: pid,
          quantity: offlineQty,
          revenue: Math.round(offlineQty * recipe.price * 100) / 100,
          channel: '到店取餐'
        });
      }
    });
  }

  return sales;
}

// 门店数据
const STORES = [
  {
    store_id: 'S001',
    name: '星巴克 · 国贸店',
    name_en: 'Starbucks · Guomao',
    address: '北京市朝阳区国贸商城 B1层',
    phone: '010-6505-8888',
    type: 'business',
    materials: MATERIALS,
    recipes: RECIPES,
    sales: generateStoreSales('business')
  },
  {
    store_id: 'S002',
    name: '星巴克 · 三里屯店',
    name_en: 'Starbucks · Sanlitun',
    address: '北京市朝阳区三里屯太古里南区',
    phone: '010-6417-6666',
    type: 'entertainment',
    materials: MATERIALS,
    recipes: RECIPES,
    sales: generateStoreSales('entertainment')
  },
  {
    store_id: 'S003',
    name: '星巴克 · 景湖时代城店',
    name_en: 'Starbucks · Jinghu Times City',
    address: '广东省东莞市宏伟路1号1047号',
    phone: '0769-2699-5704',
    type: 'residential',
    materials: MATERIALS,
    recipes: RECIPES,
    sales: generateStoreSales('residential')
  },
  {
    store_id: 'S004',
    name: '星巴克 · 中熙弥珍道店',
    name_en: 'Starbucks · Zhongxi Mizhen Road',
    address: '广东省东莞市东骏路南城段16号1036号',
    phone: '0769-2282-8386',
    type: 'community',
    materials: MATERIALS,
    recipes: RECIPES,
    sales: generateStoreSales('community')
  }
];

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { STORES, RECIPES, MATERIALS, PROMOTIONS, ONLINE_CHANNELS, OFFLINE_CHANNELS, ALL_CHANNELS, CHANNEL_META };
}
