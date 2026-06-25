
// 全球国家数据 - 按大洲分类
window.COUNTRY_DATA = {
  // ============ 亚洲 ============
  vietnam: {
    name: '越南', nameEn: 'Vietnam', flag: '🇻🇳', continent: '亚洲', region: '东南亚',
    mapPos: { x: 76, y: 56 }, opportunityScore: 78, currency: 'VND', exchangeRate: 25400,
    summary: '制造业快速崛起，年轻消费群体主导，保温杯等日用品进口需求旺盛',
    dimensions: [
      { icon: 'users', title: '人文与商务文化', desc: '越南商务文化重视关系建立，谈判节奏较慢，需要耐心维护长期合作。', tags: ['关系导向', '慢热型谈判', '重视面子'] },
      { icon: 'factory', title: '产业与供需结构', desc: '制造业快速发展但中高端消费品依赖进口，保温杯等日用品进口需求旺盛。', tags: ['制造业崛起', '进口依赖', '消费品缺口'] },
      { icon: 'bar-chart-3', title: '人口与消费画像', desc: '9800万人口，平均年龄32岁，年轻消费群体崛起，中产阶级快速壮大。', tags: ['人口红利', '年轻市场', '中产崛起'] },
      { icon: 'shopping-cart', title: '渠道与零售格局', desc: '传统市场仍占主导，电商增速快（Shopee/Lazada），便利店快速扩张。', tags: ['传统渠道', '电商爆发', '便利店扩张'] },
      { icon: 'sparkles', title: '选品与趋势洞察', desc: '高颜值、设计感产品受欢迎，日本韩国品牌认可度高，价格敏感但愿意为品质付费。', tags: ['颜值经济', '韩流影响', '品质升级'] },
      { icon: 'truck', title: '贸易与进口数据', desc: '年均进口保温杯约2.3亿美元，近3年复合增长率18.5%，主要来自中国。', tags: ['高增长', '中国为主', '需求旺盛'] },
      { icon: 'file-text', title: '政策与准入门槛', desc: '东盟自贸区零关税，质检要求逐步提高，CR认证非强制但建议办理。', tags: ['零关税', '门槛适中', '认证建议'] },
      { icon: 'dollar-sign', title: '定价与利润空间', desc: '终端零售价约为出厂价的2.5-3倍，中高端产品溢价空间大。', tags: ['利润可观', '中高端溢价', '价格分层'] },
      { icon: 'ship', title: '物流与时效成本', desc: '海防/胡志明港基本港，海运约5-7天，陆运经广西凭祥约3天。', tags: ['近洋优势', '多式联运', '时效快'] },
      { icon: 'target', title: '机会评分与建议', desc: '综合机会评分78分，建议以高颜值+定制化切入年轻消费群体和企业礼品市场。', tags: ['高机会', '差异化', '年轻群体'] }
    ],
    insight: { importValue: '$2.3亿', growthRate: '18.5%', topSource: '中国 68%', avgPrice: '$3.2', competition: '中等偏上', recommendation: '以高颜值设计+定制化服务切入，重点开发胡志明市和河内两大城市的进口商与礼品公司' },
    risk: { fxRate: 55, policy: 30, logistics: 25, payment: 45, ip: 50, competition: 60 },
    riskNote: '越南整体风险较低，但中越贸易需关注反倾销案例与品牌仿冒问题'
  },
  thailand: {
    name: '泰国', nameEn: 'Thailand', flag: '🇹🇭', continent: '亚洲', region: '东南亚',
    mapPos: { x: 73, y: 58 }, opportunityScore: 72, currency: 'THB', exchangeRate: 35.2,
    summary: '东南亚第二大经济体，旅游业繁荣，文创与日用消费品需求稳定',
    dimensions: [
      { icon: 'users', title: '人文与商务文化', desc: '泰国人友善温和，重视微笑礼仪，商务谈判节奏慢，需要建立信任关系。', tags: ['微笑之国', '慢节奏', '信任优先'] },
      { icon: 'factory', title: '产业与供需结构', desc: '汽车和电子制造业发达，日用品有一定本地生产能力，中高端产品依赖进口。', tags: ['工业基础好', '本地竞争', '中高端缺口'] },
      { icon: 'bar-chart-3', title: '人口与消费画像', desc: '7000万人口，平均年龄40岁，旅游业发达，消费力较强，品牌意识高。', tags: ['旅游消费', '品牌意识', '中产阶级'] },
      { icon: 'shopping-cart', title: '渠道与零售格局', desc: '7-11等便利店密度全球第二，商超发达，电商Lazada/Shopee增长快。', tags: ['便利店王国', '商超成熟', '电商成长'] },
      { icon: 'sparkles', title: '选品与趋势洞察', desc: '崇尚日系简约风格，环保概念受欢迎，文创设计产品有市场。', tags: ['日系审美', '环保趋势', '文创热'] },
      { icon: 'truck', title: '贸易与进口数据', desc: '保温杯类目年进口约1.8亿美元，主要来自中国和日韩。', tags: ['进口大', '中国主导', '稳定增长'] },
      { icon: 'file-text', title: '政策与准入门槛', desc: 'TISI认证对部分产品强制，外资100%控股可行，知识产权保护较好。', tags: ['TISI认证', '外资友好', 'IP保护'] },
      { icon: 'dollar-sign', title: '定价与利润空间', desc: '中端产品主流，零售价约为出厂价2-2.5倍。', tags: ['中端为主', '利润稳定', '品牌溢价'] },
      { icon: 'ship', title: '物流与时效成本', desc: '林查班港为东南亚主要枢纽，海运7-10天。', tags: ['枢纽港', '中距离', '成熟路线'] },
      { icon: 'target', title: '机会评分与建议', desc: '综合机会评分72分，建议以中端日用+文创礼品切入曼谷和清迈市场。', tags: ['稳定机会', '中端定位', '文创礼品'] }
    ],
    insight: { importValue: '$1.8亿', growthRate: '8.2%', topSource: '中国 72%', avgPrice: '$2.8', competition: '中等', recommendation: '以中端日用+文创礼品切入曼谷和清迈市场，关注环保材质' },
    risk: { fxRate: 40, policy: 45, logistics: 30, payment: 50, ip: 35, competition: 55 },
    riskNote: '泰铢汇率波动较大，TISI认证流程较长需提前6个月准备'
  },
  malaysia: {
    name: '马来西亚', nameEn: 'Malaysia', flag: '🇲🇾', continent: '亚洲', region: '东南亚',
    mapPos: { x: 76, y: 60 }, opportunityScore: 68, currency: 'MYR', exchangeRate: 4.7,
    summary: '多元文化市场，华人占比高，对中国品牌接受度强',
    dimensions: [
      { icon: 'users', title: '人文与商务文化', desc: '多元种族社会，伊斯兰教为国教，商业礼仪规范，英语普及度高。', tags: ['多元文化', '英语普及', '规范商务'] },
      { icon: 'factory', title: '产业与供需结构', desc: '电子和石油产业为主，日用品有本地制造能力但成本较高。', tags: ['电子强国', '本地生产', '成本偏高'] },
      { icon: 'bar-chart-3', title: '人口与消费画像', desc: '3300万人口，平均年龄29岁，华人占比23%，消费力中等偏上。', tags: ['年轻人口', '华人市场', '中等消费力'] },
      { icon: 'shopping-cart', title: '渠道与零售格局', desc: '现代零售业发达，AEON、Tesco等商超覆盖广，电商增速高。', tags: ['商超发达', '电商增长', '华人渠道'] },
      { icon: 'sparkles', title: '选品与趋势洞察', desc: '清真产品有特殊市场（占人口60%+穆斯林），环保和设计感产品受欢迎。', tags: ['清真认证', '设计感', '华人偏好'] },
      { icon: 'truck', title: '贸易与进口数据', desc: '保温杯类目年进口约1.2亿美元，主要来自中国。', tags: ['中等规模', '中国主导', '稳定'] },
      { icon: 'file-text', title: '政策与准入门槛', desc: '清真认证（HALAL）对食品接触产品有特殊要求，SIRIM认证部分品类必需。', tags: ['HALAL', 'SIRIM', '清真市场'] },
      { icon: 'dollar-sign', title: '定价与利润空间', desc: '中高端定位合适，零售价约为出厂价2.5-3倍。', tags: ['中高端', '合理利润', '品牌价值'] },
      { icon: 'ship', title: '物流与时效成本', desc: '巴生港为东南亚第二大港，海运6-8天。', tags: ['巴生港', '成熟物流', '快船'] },
      { icon: 'target', title: '机会评分与建议', desc: '综合机会评分68分，建议以清真认证产品切入穆斯林市场。', tags: ['细分机会', '清真定位', '华人切入'] }
    ],
    insight: { importValue: '$1.2亿', growthRate: '6.5%', topSource: '中国 75%', avgPrice: '$3.5', competition: '中等', recommendation: '以清真认证产品切入穆斯林市场，华人圈推广中国品牌' },
    risk: { fxRate: 35, policy: 50, logistics: 30, payment: 40, ip: 30, competition: 45 },
    riskNote: '清真认证成本约3-5万人民币，外资公司需本地代理才能直接进口'
  },
  indonesia: {
    name: '印度尼西亚', nameEn: 'Indonesia', flag: '🇮🇩', continent: '亚洲', region: '东南亚',
    mapPos: { x: 79, y: 62 }, opportunityScore: 82, currency: 'IDR', exchangeRate: 15800,
    summary: '东南亚最大经济体，2.7亿人口红利，电商高速增长',
    dimensions: [
      { icon: 'users', title: '人文与商务文化', desc: '穆斯林占87%，商业重视关系和宗教，决策层级较多。', tags: ['穆斯林主导', '层级决策', '关系优先'] },
      { icon: 'factory', title: '产业与供需结构', desc: '资源型经济，制造业基础薄弱，绝大部分消费品依赖进口。', tags: ['进口依赖', '工业薄弱', '资源型'] },
      { icon: 'bar-chart-3', title: '人口与消费画像', desc: '2.7亿人口全球第4，平均年龄30岁，庞大年轻消费市场。', tags: ['人口大国', '极度年轻', '市场潜力大'] },
      { icon: 'shopping-cart', title: '渠道与零售格局', desc: '传统Warung小店为主，Tokopedia/Shopee电商爆发。', tags: ['传统小店', '电商爆发', 'Tokopedia'] },
      { icon: 'sparkles', title: '选品与趋势洞察', desc: '高性价比产品受欢迎，颜值经济兴起，对中国品牌接受度高。', tags: ['性价比', '颜值经济', '接受中国品牌'] },
      { icon: 'truck', title: '贸易与进口数据', desc: '保温杯类目年进口约2.8亿美元，近3年增长22%。', tags: ['高增长', '需求强', '进口为主'] },
      { icon: 'file-text', title: '政策与准入门槛', desc: 'SNI认证对部分产品强制，外资公司需本地注册或代理。', tags: ['SNI认证', '本地化要求', '外资可100%'] },
      { icon: 'dollar-sign', title: '定价与利润空间', desc: '中低端主流，价格敏感，零售价约为出厂价2-2.5倍。', tags: ['中低端', '价格敏感', '走量为主'] },
      { icon: 'ship', title: '物流与时效成本', desc: '雅加达/泗水港为主，海运8-12天。', tags: ['远距离', '中长航线', '散货拼柜'] },
      { icon: 'target', title: '机会评分与建议', desc: '综合机会评分82分，建议以性价比产品+电商渠道快速起量。', tags: ['极高机会', '电商优先', '高性价比'] }
    ],
    insight: { importValue: '$2.8亿', growthRate: '22%', topSource: '中国 80%', avgPrice: '$2.2', competition: '高', recommendation: '以性价比产品+电商渠道快速起量，布局Shopee和Tokopedia' },
    risk: { fxRate: 60, policy: 55, logistics: 50, payment: 55, ip: 65, competition: 75 },
    riskNote: '印尼盾波动剧烈，建议美元结算；SNI认证需通过当地代理'
  },
  philippines: {
    name: '菲律宾', nameEn: 'Philippines', flag: '🇵🇭', continent: '亚洲', region: '东南亚',
    mapPos: { x: 80, y: 58 }, opportunityScore: 74, currency: 'PHP', exchangeRate: 56,
    summary: '英语普及，年轻人口占比高，电商增速领跑东南亚',
    dimensions: [
      { icon: 'users', title: '人文与商务文化', desc: '天主教国家，英语为官方语言，商务直接高效。', tags: ['英语流利', '直接沟通', '天主教文化'] },
      { icon: 'factory', title: '产业与供需结构', desc: 'BPO产业强，制造业薄弱，日用品几乎完全依赖进口。', tags: ['BPO产业', '制造业弱', '进口为主'] },
      { icon: 'bar-chart-3', title: '人口与消费画像', desc: '1.1亿人口，平均年龄25岁，海外侨汇支撑消费力。', tags: ['最年轻', '侨汇经济', '消费力稳定'] },
      { icon: 'shopping-cart', title: '渠道与零售格局', desc: 'SM等大型商超密集，Shopee/Lazada/本地电商多极发展。', tags: ['SM商超', '多平台电商', '直播带货'] },
      { icon: 'sparkles', title: '选品与趋势洞察', desc: '高颜值+性价比产品热销，韩流影响大，色彩鲜艳产品受欢迎。', tags: ['颜值党', '韩流影响', '多彩设计'] },
      { icon: 'truck', title: '贸易与进口数据', desc: '保温杯类目年进口约1.5亿美元，增长12%。', tags: ['稳定增长', '进口需求', '中国主导'] },
      { icon: 'file-text', title: '政策与准入门槛', desc: 'BPS认证对部分品类强制，菲海关清关效率有待提高。', tags: ['BPS认证', '清关较慢', '需本地代理'] },
      { icon: 'dollar-sign', title: '定价与利润空间', desc: '中端为主，零售价约为出厂价2.3-2.8倍。', tags: ['中端市场', '合理利润', '快周转'] },
      { icon: 'ship', title: '物流与时效成本', desc: '马尼拉/宿务港，海运7-10天，电商小包物流发达。', tags: ['海运便捷', '小包物流', '电商友好'] },
      { icon: 'target', title: '机会评分与建议', desc: '综合机会评分74分，建议以高颜值+直播电商切入年轻市场。', tags: ['高机会', '直播优先', '年轻市场'] }
    ],
    insight: { importValue: '$1.5亿', growthRate: '12%', topSource: '中国 78%', avgPrice: '$2.6', competition: '中等', recommendation: '以高颜值+直播电商切入年轻市场，借助英语优势直接沟通' },
    risk: { fxRate: 50, policy: 50, logistics: 40, payment: 50, ip: 55, competition: 50 },
    riskNote: '菲律宾清关效率不稳定，建议提前30天准备单证'
  },
  japan: {
    name: '日本', nameEn: 'Japan', flag: '🇯🇵', continent: '亚洲', region: '东亚',
    mapPos: { x: 84, y: 42 }, opportunityScore: 70, currency: 'JPY', exchangeRate: 149,
    summary: '成熟高端市场，注重品质和工艺，进入门槛高但溢价能力强',
    dimensions: [
      { icon: 'users', title: '人文与商务文化', desc: '极度重视品质和细节，商务礼仪复杂，决策周期长但忠诚度高。', tags: ['品质至上', '长决策周期', '高忠诚度'] },
      { icon: 'factory', title: '产业与供需结构', desc: '制造业强国，本地品牌如虎牌/膳魔师强势，新品牌进入门槛高。', tags: ['制造强国', '本地强势', '高门槛'] },
      { icon: 'bar-chart-3', title: '人口与消费画像', desc: '1.25亿人口，老龄化严重，平均年龄48岁，但消费力极强。', tags: ['老龄化', '高消费力', '成熟市场'] },
      { icon: 'shopping-cart', title: '渠道与零售格局', desc: '便利店/超市/药妆店密集，电商乐天/亚马逊日本双雄。', tags: ['便利店密集', '乐天/亚马逊', '药妆店'] },
      { icon: 'sparkles', title: '选品与趋势洞察', desc: '极简设计+功能性产品受欢迎，muji风盛行，健康概念产品热销。', tags: ['极简设计', 'muji风', '健康概念'] },
      { icon: 'truck', title: '贸易与进口数据', desc: '保温杯类目年进口约5.6亿美元，主要来自中国和泰国。', tags: ['成熟市场', '进口量大', '中国份额提升'] },
      { icon: 'file-text', title: '政策与准入门槛', desc: 'PSE认证对电器类强制，食品接触需符合日本食品卫生法。', tags: ['PSE认证', '严苛标准', '高门槛'] },
      { icon: 'dollar-sign', title: '定价与利润空间', desc: '高端定位，零售价约为出厂价3-5倍。', tags: ['高溢价', '高端定位', '品牌价值'] },
      { icon: 'ship', title: '物流与时效成本', desc: '横滨/大阪/东京港，海运4-6天。', tags: ['快船直达', '物流成熟', '短航线'] },
      { icon: 'target', title: '机会评分与建议', desc: '综合机会评分70分，建议以差异化设计+品牌故事切入高端礼品市场。', tags: ['差异化', '品牌故事', '高端礼品'] }
    ],
    insight: { importValue: '$5.6亿', growthRate: '3.5%', topSource: '中国 35% / 泰国 28%', avgPrice: '$8.5', competition: '极高', recommendation: '以差异化设计+品牌故事切入高端礼品和细分功能市场（如儿童/户外）' },
    risk: { fxRate: 30, policy: 70, logistics: 25, payment: 25, ip: 25, competition: 85 },
    riskNote: '日本市场对品质要求严苛，PSE认证周期6-12个月，建议与本地贸易商合作'
  },
  south_korea: {
    name: '韩国', nameEn: 'South Korea', flag: '🇰🇷', continent: '亚洲', region: '东亚',
    mapPos: { x: 82, y: 42 }, opportunityScore: 65, currency: 'KRW', exchangeRate: 1320,
    summary: 'K-beauty潮流引领，IP联名经济发达，年轻人消费力强',
    dimensions: [
      { icon: 'users', title: '人文与商务文化', desc: '重视效率，决策快，对K-pop/K-beauty IP有强烈认同。', tags: ['效率优先', '快决策', 'IP文化'] },
      { icon: 'factory', title: '产业与供需结构', desc: '电子和化妆品强，本土日用品品牌成熟，新进入难度大。', tags: ['强制造业', '本地品牌', '竞争激烈'] },
      { icon: 'bar-chart-3', title: '人口与消费画像', desc: '5200万人口，平均年龄43岁，老龄化但消费力极强。', tags: ['老龄化', '高消费力', 'K文化'] },
      { icon: 'shopping-cart', title: '渠道与零售格局', desc: 'Coupang电商强势，Olive Young等美妆集合店爆发，直播带货发达。', tags: ['Coupang', 'Olive Young', '直播强'] },
      { icon: 'sparkles', title: '选品与趋势洞察', desc: '高颜值+联名IP产品热销，色彩鲜艳设计受欢迎，环保材质加分。', tags: ['IP联名', '色彩鲜艳', '环保加分'] },
      { icon: 'truck', title: '贸易与进口数据', desc: '保温杯类目年进口约1.5亿美元，主要来自中国。', tags: ['中等规模', '稳定', '中国份额提升'] },
      { icon: 'file-text', title: '政策与准入门槛', desc: 'KC认证对部分产品强制，韩国食药处对食品接触材料监管严格。', tags: ['KC认证', '食药处', '高门槛'] },
      { icon: 'dollar-sign', title: '定价与利润空间', desc: '中高端定位，零售价约为出厂价2.5-3.5倍。', tags: ['中高端', '合理溢价', 'IP溢价'] },
      { icon: 'ship', title: '物流与时效成本', desc: '釜山/仁川港，海运3-5天，物流效率极高。', tags: ['近洋优势', '物流快', '高效清关'] },
      { icon: 'target', title: '机会评分与建议', desc: '综合机会评分65分，建议以联名IP+高颜值设计切入年轻女性市场。', tags: ['IP联名', '年轻女性', '颜值经济'] }
    ],
    insight: { importValue: '$1.5亿', growthRate: '5.8%', topSource: '中国 60%', avgPrice: '$4.5', competition: '高', recommendation: '以联名IP+高颜值设计切入年轻女性市场，借助Coupang快速铺货' },
    risk: { fxRate: 35, policy: 60, logistics: 25, payment: 30, ip: 35, competition: 70 },
    riskNote: '韩元波动较小，KC认证需通过本地代理，注意保护IP不被仿冒'
  },
  india: {
    name: '印度', nameEn: 'India', flag: '🇮🇳', continent: '亚洲', region: '南亚',
    mapPos: { x: 70, y: 52 }, opportunityScore: 75, currency: 'INR', exchangeRate: 83,
    summary: '14亿人口大国，年轻消费市场潜力巨大，价格敏感',
    dimensions: [
      { icon: 'users', title: '人文与商务文化', desc: '英语普及但商业节奏快，关系网络复杂，价格谈判激烈。', tags: ['英语可用', '快节奏', '价格谈判'] },
      { icon: 'factory', title: '产业与供需结构', desc: '本土制造业强（塔塔等），但中高端消费品仍依赖进口。', tags: ['本土制造', '中高端进口', '竞争激烈'] },
      { icon: 'bar-chart-3', title: '人口与消费画像', desc: '14亿人口全球第一，平均年龄28岁，巨大年轻消费市场。', tags: ['人口最多', '极年轻', '潜力巨大'] },
      { icon: 'shopping-cart', title: '渠道与零售格局', desc: 'Flipkart/Amazon India双雄，传统小商店密布。', tags: ['Flipkart', '传统小商店', '电商崛起'] },
      { icon: 'sparkles', title: '选品与趋势洞察', desc: '高性价比+耐用产品受欢迎，节庆礼品市场（Diwali）规模大。', tags: ['性价比', '耐用', '节庆礼品'] },
      { icon: 'truck', title: '贸易与进口数据', desc: '保温杯类目年进口约1.8亿美元，主要来自中国。', tags: ['高速增长', '中国主导', '潜力大'] },
      { icon: 'file-text', title: '政策与准入门槛', desc: 'BIS认证对部分产品强制，外资可100%控股但有本地化要求。', tags: ['BIS认证', '外资可100%', '本地化要求'] },
      { icon: 'dollar-sign', title: '定价与利润空间', desc: '中低端主流，价格敏感，零售价约为出厂价1.8-2.5倍。', tags: ['中低端', '价格敏感', '走量'] },
      { icon: 'ship', title: '物流与时效成本', desc: '海运15-20天，远距离但运费低，清关效率待提升。', tags: ['远距离', '运费低', '清关慢'] },
      { icon: 'target', title: '机会评分与建议', desc: '综合机会评分75分，建议以高性价比+节庆礼品切入。', tags: ['高潜力', '性价比', '节庆礼品'] }
    ],
    insight: { importValue: '$1.8亿', growthRate: '15%', topSource: '中国 70%', avgPrice: '$2.0', competition: '中等', recommendation: '以高性价比+节庆礼品切入，借助Flipkart/Amazon India铺货' },
    risk: { fxRate: 60, policy: 65, logistics: 60, payment: 60, ip: 70, competition: 65 },
    riskNote: '印度对中国产品有反倾销和海关查验风险，建议申请BIS认证提升信任'
  },
  russia: {
    name: '俄罗斯', nameEn: 'Russia', flag: '🇷🇺', continent: '亚洲', region: '欧亚',
    mapPos: { x: 60, y: 32 }, opportunityScore: 60, currency: 'RUB', exchangeRate: 92,
    summary: '受制裁后中国商品机会增大，物流主要走远东路线',
    dimensions: [
      { icon: 'users', title: '人文与商务文化', desc: '商务层级分明，关系重要，谈判风格直接。', tags: ['层级分明', '关系重要', '直接谈判'] },
      { icon: 'factory', title: '产业与供需结构', desc: '重工业强，轻工业薄弱，日用消费品大量进口。', tags: ['重工业强', '轻工薄弱', '进口需求大'] },
      { icon: 'bar-chart-3', title: '人口与消费画像', desc: '1.44亿人口，平均年龄40岁，中产阶级稳定。', tags: ['1.4亿人口', '中产稳定', '消费谨慎'] },
      { icon: 'shopping-cart', title: '渠道与零售格局', desc: 'Wildberries/Ozon电商强势，线下连锁覆盖广。', tags: ['Wildberries', 'Ozon', '连锁商超'] },
      { icon: 'sparkles', title: '选品与趋势洞察', desc: '性价比+耐用产品受欢迎，国潮和极简风都有市场。', tags: ['性价比', '耐用', '国潮'] },
      { icon: 'truck', title: '贸易与进口数据', desc: '受制裁影响，中国份额大幅提升，年进口增长25%+。', tags: ['中国份额暴涨', '高增长', '替代欧美'] },
      { icon: 'file-text', title: '政策与准入门槛', desc: '欧亚经济联盟EAC认证对部分品类强制，卢布汇率波动大。', tags: ['EAC认证', '卢布波动', '结算风险'] },
      { icon: 'dollar-sign', title: '定价与利润空间', desc: '中端定位，零售价约为出厂价2-2.8倍。', tags: ['中端定位', '合理利润', '汇率敏感'] },
      { icon: 'ship', title: '物流与时效成本', desc: '海参崴/圣彼得堡港，海运20-30天，铁路运输15-20天。', tags: ['中欧班列', '远距离', '铁路优势'] },
      { icon: 'target', title: '机会评分与建议', desc: '综合机会评分60分，建议通过中欧班列物流切入Wildberries。', tags: ['物流优势', 'Wildberries', '中端定位'] }
    ],
    insight: { importValue: '$2.5亿', growthRate: '25%', topSource: '中国 70%', avgPrice: '$3.0', competition: '中等', recommendation: '通过中欧班列物流切入Wildberries/Ozon，关注卢布结算风险' },
    risk: { fxRate: 85, policy: 75, logistics: 65, payment: 80, ip: 50, competition: 40 },
    riskNote: '卢布汇率波动剧烈，建议100%预付或美元结算规避风险'
  },

  // ============ 欧洲 ============
  germany: {
    name: '德国', nameEn: 'Germany', flag: '🇩🇪', continent: '欧洲', region: '西欧',
    mapPos: { x: 50, y: 34 }, opportunityScore: 73, currency: 'EUR', exchangeRate: 0.92,
    summary: '欧洲最大经济体，注重品质和环保，购买力强',
    dimensions: [
      { icon: 'users', title: '人文与商务文化', desc: '极度理性，决策依据数据，商务节奏规范准时。', tags: ['理性决策', '规范准时', '数据驱动'] },
      { icon: 'factory', title: '产业与供需结构', desc: '工业强国，本地制造业强，但日用消费品大量进口。', tags: ['工业强国', '消费品进口', '品质要求高'] },
      { icon: 'bar-chart-3', title: '人口与消费画像', desc: '8300万人口，平均年龄46岁，老龄化但购买力极强。', tags: ['老龄化', '高购买力', '理性消费'] },
      { icon: 'shopping-cart', title: '渠道与零售格局', desc: 'Aldi/Lidl等折扣超市发达，Amazon.de电商领先。', tags: ['折扣超市', 'Amazon.de', '品质零售'] },
      { icon: 'sparkles', title: '选品与趋势洞察', desc: '环保+可持续产品受欢迎，极简设计+功能性强产品热销。', tags: ['环保可持续', '极简设计', '功能性强'] },
      { icon: 'truck', title: '贸易与进口数据', desc: '保温杯类目年进口约3.2亿美元，主要来自中国和波兰。', tags: ['欧洲最大', '中国份额高', '稳定增长'] },
      { icon: 'file-text', title: '政策与准入门槛', desc: 'CE认证对电器类强制，LFGB食品接触认证非常严苛。', tags: ['CE认证', 'LFGB严苛', '环保法规'] },
      { icon: 'dollar-sign', title: '定价与利润空间', desc: '中高端定位，零售价约为出厂价3-4倍。', tags: ['中高端', '高溢价', '品牌价值'] },
      { icon: 'ship', title: '物流与时效成本', desc: '汉堡/不来梅港，海运28-35天，铁路15-18天。', tags: ['远距离', '中欧班列', '成熟物流'] },
      { icon: 'target', title: '机会评分与建议', desc: '综合机会评分73分，建议以环保材料+LFGB认证切入。', tags: ['环保定位', '认证先行', '中高端'] }
    ],
    insight: { importValue: '$3.2亿', growthRate: '6%', topSource: '中国 60%', avgPrice: '$12', competition: '高', recommendation: '以环保材料+LFGB认证切入，主打可持续品牌故事' },
    risk: { fxRate: 25, policy: 50, logistics: 35, payment: 20, ip: 30, competition: 75 },
    riskNote: '德国LFGB认证严苛且费用高（约5-8万），需提前6个月准备'
  },
  uk: {
    name: '英国', nameEn: 'United Kingdom', flag: '🇬🇧', continent: '欧洲', region: '西欧',
    mapPos: { x: 47, y: 32 }, opportunityScore: 68, currency: 'GBP', exchangeRate: 0.79,
    summary: '英联邦纽带，英语环境，进出口枢纽',
    dimensions: [
      { icon: 'users', title: '人文与商务文化', desc: '英式礼仪保守，重视契约精神，决策流程规范。', tags: ['英式礼仪', '重视契约', '规范流程'] },
      { icon: 'factory', title: '产业与供需结构', desc: '制造业占比小，服务业为主，消费品大量进口。', tags: ['服务业主导', '进口为主', '中高端'] },
      { icon: 'bar-chart-3', title: '人口与消费画像', desc: '6700万人口，平均年龄40岁，成熟消费市场。', tags: ['成熟市场', '理性消费', '中产为主'] },
      { icon: 'shopping-cart', title: '渠道与零售格局', desc: 'Tesco/Sainsbury等连锁超市密集，Amazon UK电商领先。', tags: ['Tesco', 'Amazon UK', '连锁商超'] },
      { icon: 'sparkles', title: '选品与趋势洞察', desc: '环保+英伦风设计受欢迎，IP联名产品有市场。', tags: ['环保', '英伦风', 'IP联名'] },
      { icon: 'truck', title: '贸易与进口数据', desc: '保温杯类目年进口约2亿美元，主要来自中国。', tags: ['中等规模', '中国主导', '稳定'] },
      { icon: 'file-text', title: '政策与准入门槛', desc: 'UKCA认证替代CE（脱欧后），食品接触需符合UK法规。', tags: ['UKCA', '脱欧后', '英标'] },
      { icon: 'dollar-sign', title: '定价与利润空间', desc: '中高端，零售价约为出厂价2.5-3.5倍。', tags: ['中高端', '合理利润', '品牌价值'] },
      { icon: 'ship', title: '物流与时效成本', desc: '费利克斯托港，海运28-35天，铁路15-18天。', tags: ['中欧班列', '海运便捷', '成熟'] },
      { icon: 'target', title: '机会评分与建议', desc: '综合机会评分68分，建议以英伦风设计+环保材料切入。', tags: ['英伦风', '环保', '中高端'] }
    ],
    insight: { importValue: '$2亿', growthRate: '4.5%', topSource: '中国 65%', avgPrice: '$9', competition: '中等', recommendation: '以英伦风设计+环保材料切入伦敦和曼彻斯特' },
    risk: { fxRate: 30, policy: 45, logistics: 35, payment: 25, ip: 30, competition: 60 },
    riskNote: '脱欧后UKCA认证增加流程，建议与英国本地贸易商合作'
  },
  france: {
    name: '法国', nameEn: 'France', flag: '🇫🇷', continent: '欧洲', region: '西欧',
    mapPos: { x: 48, y: 36 }, opportunityScore: 67, currency: 'EUR', exchangeRate: 0.92,
    summary: '时尚之都，注重设计感和品牌故事',
    dimensions: [
      { icon: 'users', title: '人文与商务文化', desc: '法式优雅，重视品牌和设计，决策感性。', tags: ['法式优雅', '品牌导向', '感性决策'] },
      { icon: 'factory', title: '产业与供需结构', desc: '奢侈品强国，但中端日用消费品大量进口。', tags: ['奢侈品强', '中端进口', '设计要求高'] },
      { icon: 'bar-chart-3', title: '人口与消费画像', desc: '6700万人口，平均年龄42岁，注重生活品质。', tags: ['生活品质', '中高端', '成熟'] },
      { icon: 'shopping-cart', title: '渠道与零售格局', desc: '家乐福/Auchan等商超密集，电商Cdiscount领先。', tags: ['家乐福', 'Cdiscount', '精品店'] },
      { icon: 'sparkles', title: '选品与趋势洞察', desc: '设计感+法式美学产品受欢迎，环保概念加分。', tags: ['法式美学', '设计感', '环保'] },
      { icon: 'truck', title: '贸易与进口数据', desc: '保温杯类目年进口约1.8亿美元，主要来自中国。', tags: ['中等规模', '中国份额高', '稳定'] },
      { icon: 'file-text', title: '政策与准入门槛', desc: 'CE认证强制，LFGB对食品接触有要求。', tags: ['CE', 'LFGB', '法标'] },
      { icon: 'dollar-sign', title: '定价与利润空间', desc: '中高端定位，零售价约为出厂价3-4倍。', tags: ['中高端', '高溢价', '设计溢价'] },
      { icon: 'ship', title: '物流与时效成本', desc: '勒阿弗尔/马赛港，海运30天左右。', tags: ['远距离', '成熟航线', '中欧班列'] },
      { icon: 'target', title: '机会评分与建议', desc: '综合机会评分67分，建议以法式设计+环保材料切入巴黎市场。', tags: ['法式设计', '环保', '巴黎'] }
    ],
    insight: { importValue: '$1.8亿', growthRate: '4%', topSource: '中国 55%', avgPrice: '$10', competition: '中等', recommendation: '以法式设计+环保材料切入巴黎市场，强调品牌故事' },
    risk: { fxRate: 25, policy: 50, logistics: 35, payment: 25, ip: 30, competition: 65 },
    riskNote: '法国消费者重视品牌故事，建议聘请本地设计师提升溢价'
  },
  netherlands: {
    name: '荷兰', nameEn: 'Netherlands', flag: '🇳🇱', continent: '欧洲', region: '西欧',
    mapPos: { x: 49, y: 33 }, opportunityScore: 71, currency: 'EUR', exchangeRate: 0.92,
    summary: '欧洲门户港口，转口贸易枢纽，物流便利',
    dimensions: [
      { icon: 'users', title: '人文与商务文化', desc: '开放务实，重视商业效率，决策快。', tags: ['务实', '效率优先', '开放'] },
      { icon: 'factory', title: '产业与供需结构', desc: '本土制造业弱，但转口贸易强，鹿特丹是欧洲门户。', tags: ['转口枢纽', '工业弱', '门户'] },
      { icon: 'bar-chart-3', title: '人口与消费画像', desc: '1700万人口，平均年龄42岁，购买力强，注重品质。', tags: ['高购买力', '品质', '国际化'] },
      { icon: 'shopping-cart', title: '渠道与零售格局', desc: 'Albert Heijn等连锁密集，Bol.com电商领先。', tags: ['Albert Heijn', 'Bol.com', '渠道多元'] },
      { icon: 'sparkles', title: '选品与趋势洞察', desc: '环保+极简设计受欢迎，自行车配件类周边热销。', tags: ['环保', '极简', '自行车文化'] },
      { icon: 'truck', title: '贸易与进口数据', desc: '保温杯类目年进口约0.8亿美元，中国份额约70%。', tags: ['中等规模', '中国主导', '转口贸易'] },
      { icon: 'file-text', title: '政策与准入门槛', desc: 'CE认证，鹿特丹清关效率高，欧盟标准统一。', tags: ['CE', '欧盟', '清关快'] },
      { icon: 'dollar-sign', title: '定价与利润空间', desc: '中端为主，零售价约为出厂价2.5-3倍。', tags: ['中端', '合理利润', '转口优势'] },
      { icon: 'ship', title: '物流与时效成本', desc: '鹿特丹港欧洲第一，海运28-32天，铁路15天。', tags: ['鹿特丹', '中欧班列', '欧洲门户'] },
      { icon: 'target', title: '机会评分与建议', desc: '综合机会评分71分，建议利用转口优势辐射欧洲全境。', tags: ['转口优势', '欧洲门户', '环保'] }
    ],
    insight: { importValue: '$0.8亿', growthRate: '5%', topSource: '中国 70%', avgPrice: '$7', competition: '中等', recommendation: '利用鹿特丹转口优势辐射德法英，利用Bol.com拓展本地' },
    risk: { fxRate: 25, policy: 45, logistics: 25, payment: 20, ip: 30, competition: 55 },
    riskNote: '荷兰清关效率欧洲最高，但需注意欧盟整体环保法规'
  },

  // ============ 北美洲 ============
  usa: {
    name: '美国', nameEn: 'USA', flag: '🇺🇸', continent: '北美洲', region: '北美',
    mapPos: { x: 23, y: 42 }, opportunityScore: 80, currency: 'USD', exchangeRate: 1,
    summary: '全球最大消费市场，购买力强，电商高度发达',
    dimensions: [
      { icon: 'users', title: '人文与商务文化', desc: '直接高效，决策快，重视创新和品牌故事。', tags: ['直接高效', '快决策', '创新导向'] },
      { icon: 'factory', title: '产业与供需结构', desc: '制造业回流中，但消费品仍大量进口，中国是最大供应国。', tags: ['制造业回流', '消费品进口', '中国主导'] },
      { icon: 'bar-chart-3', title: '人口与消费画像', desc: '3.3亿人口，平均年龄38岁，多元化市场，购买力强。', tags: ['3.3亿人口', '多元化', '强购买力'] },
      { icon: 'shopping-cart', title: '渠道与零售格局', desc: 'Walmart/Costco/Target等商超覆盖广，Amazon电商绝对领先。', tags: ['Walmart', 'Amazon', 'Target'] },
      { icon: 'sparkles', title: '选品与趋势洞察', desc: '个性化+IP联名+健康概念产品热销，户外和健身周边规模大。', tags: ['IP联名', '健康概念', '户外健身'] },
      { icon: 'truck', title: '贸易与进口数据', desc: '保温杯类目年进口约12亿美元，主要来自中国。', tags: ['全球最大', '中国份额高', '关税敏感'] },
      { icon: 'file-text', title: '政策与准入门槛', desc: 'FDA对食品接触强制，FCC对电子类强制，关税壁垒高。', tags: ['FDA', 'FCC', '关税壁垒'] },
      { icon: 'dollar-sign', title: '定价与利润空间', desc: '中端为主，零售价约为出厂价2.5-3.5倍。', tags: ['中端主流', '合理利润', '品牌溢价'] },
      { icon: 'ship', title: '物流与时效成本', desc: '洛杉矶/长滩/纽约港，海运15-20天。', tags: ['远洋航线', '成熟港口', '海运快'] },
      { icon: 'target', title: '机会评分与建议', desc: '综合机会评分80分，建议以IP联名+独立站+DTC模式切入。', tags: ['DTC首选', 'IP联名', '独立站'] }
    ],
    insight: { importValue: '$12亿', growthRate: '8%', topSource: '中国 70%', avgPrice: '$15', competition: '极高', recommendation: '以IP联名+独立站+DTC模式切入，避免低价竞争' },
    risk: { fxRate: 15, policy: 65, logistics: 30, payment: 20, ip: 35, competition: 85 },
    riskNote: '美国关税政策多变，301关税持续，建议考虑墨西哥/越南转口或DDP条款'
  },
  canada: {
    name: '加拿大', nameEn: 'Canada', flag: '🇨🇦', continent: '北美洲', region: '北美',
    mapPos: { x: 24, y: 30 }, opportunityScore: 70, currency: 'CAD', exchangeRate: 1.36,
    summary: '北美第二大市场，移民多元，环保意识强',
    dimensions: [
      { icon: 'users', title: '人文与商务文化', desc: '英法双语，注重多元文化，决策理性。', tags: ['多元文化', '英法双语', '理性'] },
      { icon: 'factory', title: '产业与供需结构', desc: '资源型经济，制造业弱，消费品大量进口。', tags: ['资源型', '消费品进口', '依赖美国'] },
      { icon: 'bar-chart-3', title: '人口与消费画像', desc: '3800万人口，平均年龄41岁，环保意识强。', tags: ['环保意识', '中等规模', '高生活品质'] },
      { icon: 'shopping-cart', title: '渠道与零售格局', desc: '与美市场相似，加拿大沃尔玛/Canadian Tire覆盖广。', tags: ['Canadian Tire', '沃尔玛', 'Amazon.ca'] },
      { icon: 'sparkles', title: '选品与趋势洞察', desc: '环保+极简产品受欢迎，户外/冰雪运动周边有市场。', tags: ['环保', '极简', '户外运动'] },
      { icon: 'truck', title: '贸易与进口数据', desc: '保温杯类目年进口约1亿美元，主要来自中国。', tags: ['中等规模', '中国主导', '稳定'] },
      { icon: 'file-text', title: '政策与准入门槛', desc: 'CSA认证对电器类强制，与美国标准相近。', tags: ['CSA', '与美国相近', '进口友好'] },
      { icon: 'dollar-sign', title: '定价与利润空间', desc: '中高端为主，零售价约为出厂价2.5-3.5倍。', tags: ['中高端', '合理利润', '环保溢价'] },
      { icon: 'ship', title: '物流与时效成本', desc: '温哥华/蒙特利尔港，海运15-20天。', tags: ['太平洋航线', '成熟物流', '海运快'] },
      { icon: 'target', title: '机会评分与建议', desc: '综合机会评分70分，建议以环保+户外产品切入多伦多和温哥华。', tags: ['环保', '户外', '大城市'] }
    ],
    insight: { importValue: '$1亿', growthRate: '5%', topSource: '中国 75%', avgPrice: '$13', competition: '中等', recommendation: '以环保+户外产品切入多伦多和温哥华' },
    risk: { fxRate: 25, policy: 40, logistics: 30, payment: 20, ip: 30, competition: 50 },
    riskNote: '加拿大市场稳定但规模有限，建议作为美国市场的补充'
  },

  // ============ 拉美 ============
  mexico: {
    name: '墨西哥', nameEn: 'Mexico', flag: '🇲🇽', continent: '北美洲', region: '拉美',
    mapPos: { x: 18, y: 50 }, opportunityScore: 76, currency: 'MXN', exchangeRate: 17.5,
    summary: '近美生产基地，USMCA红利，制造业潜力大',
    dimensions: [
      { icon: 'users', title: '人文与商务文化', desc: '重视关系和信任，商务节奏中等，决策受个人关系影响大。', tags: ['关系导向', '中等节奏', '信任重要'] },
      { icon: 'factory', title: '产业与供需结构', desc: '近美生产基地，制造业快速发展，进口需求增长。', tags: ['近美生产', '制造业发展', '进口需求'] },
      { icon: 'bar-chart-3', title: '人口与消费画像', desc: '1.3亿人口，平均年龄29岁，年轻消费市场快速增长。', tags: ['1.3亿人口', '年轻', '潜力大'] },
      { icon: 'shopping-cart', title: '渠道与零售格局', desc: 'Walmart墨西哥/本土超市Soriana等覆盖广，Mercado Libre领先。', tags: ['Walmart', 'Mercado Libre', '本土商超'] },
      { icon: 'sparkles', title: '选品与趋势洞察', desc: '性价比+时尚设计产品受欢迎，节庆市场（圣诞/亡灵节）规模大。', tags: ['性价比', '时尚', '节庆市场'] },
      { icon: 'truck', title: '贸易与进口数据', desc: '保温杯类目年进口约1.2亿美元，主要来自中国。', tags: ['快速增长', '中国份额高', '潜力大'] },
      { icon: 'file-text', title: '政策与准入门槛', desc: 'NOM认证对部分品类强制，COFEPRIS管理食品接触。', tags: ['NOM', 'COFEPRIS', '本地化'] },
      { icon: 'dollar-sign', title: '定价与利润空间', desc: '中低端到中端，零售价约为出厂价2-3倍。', tags: ['中低端', '价格敏感', '走量'] },
      { icon: 'ship', title: '物流与时效成本', desc: '曼萨尼约港/韦拉克鲁斯港，海运20-25天。', tags: ['远距离', '港口成熟', '运费偏高'] },
      { icon: 'target', title: '机会评分与建议', desc: '综合机会评分76分，建议以性价比+节庆礼品切入墨西哥城。', tags: ['高潜力', '性价比', '节庆'] }
    ],
    insight: { importValue: '$1.2亿', growthRate: '14%', topSource: '中国 60%', avgPrice: '$3.5', competition: '中等', recommendation: '以性价比+节庆礼品切入墨西哥城，USMCA优势可作为北美跳板' },
    risk: { fxRate: 60, policy: 60, logistics: 50, payment: 55, ip: 60, competition: 50 },
    riskNote: '墨西哥比索波动较大，建议美元结算；本地化运营需谨慎'
  },
  brazil: {
    name: '巴西', nameEn: 'Brazil', flag: '🇧🇷', continent: '南美洲', region: '拉美',
    mapPos: { x: 32, y: 65 }, opportunityScore: 70, currency: 'BRL', exchangeRate: 5.2,
    summary: '拉美最大经济体，2.1亿人口，市场潜力大',
    dimensions: [
      { icon: 'users', title: '人文与商务文化', desc: '商务热情，重视个人关系，决策周期长。', tags: ['热情', '关系重要', '长决策'] },
      { icon: 'factory', title: '产业与供需结构', desc: '工业门类较全，但中高端消费品仍依赖进口。', tags: ['工业基础', '中高端进口', '保护主义'] },
      { icon: 'bar-chart-3', title: '人口与消费画像', desc: '2.1亿人口拉美第一，平均年龄33岁，潜力大。', tags: ['2.1亿人口', '年轻', '潜力大'] },
      { icon: 'shopping-cart', title: '渠道与零售格局', desc: '本土零售发达（Renner等），Mercado Libre电商领先。', tags: ['本土商超', 'Mercado Libre', '渠道多元'] },
      { icon: 'sparkles', title: '选品与趋势洞察', desc: '时尚+色彩鲜艳产品受欢迎，IP联名和节庆市场有潜力。', tags: ['时尚', '色彩', 'IP联名'] },
      { icon: 'truck', title: '贸易与进口数据', desc: '保温杯类目年进口约1.5亿美元，主要来自中国。', tags: ['中等规模', '中国份额高', '潜力大'] },
      { icon: 'file-text', title: '政策与准入门槛', desc: 'INMETRO认证对部分品类强制，关税壁垒较高。', tags: ['INMETRO', '高关税', '进口许可'] },
      { icon: 'dollar-sign', title: '定价与利润空间', desc: '中端到中高端，零售价约为出厂价2.5-3.5倍。', tags: ['中端', '合理利润', '关税影响'] },
      { icon: 'ship', title: '物流与时效成本', desc: '桑托斯港/里约港，海运30-40天。', tags: ['远距离', '运费高', '港口成熟'] },
      { icon: 'target', title: '机会评分与建议', desc: '综合机会评分70分，建议以时尚设计切入圣保罗和里约。', tags: ['时尚', '大城市', '中端'] }
    ],
    insight: { importValue: '$1.5亿', growthRate: '10%', topSource: '中国 55%', avgPrice: '$4.5', competition: '中等', recommendation: '以时尚设计切入圣保罗和里约，INMETRO认证必办' },
    risk: { fxRate: 70, policy: 70, logistics: 60, payment: 65, ip: 55, competition: 50 },
    riskNote: '巴西雷亚尔波动大且有外汇管制，建议通过美元账户结算'
  },
  chile: {
    name: '智利', nameEn: 'Chile', flag: '🇨🇱', continent: '南美洲', region: '拉美',
    mapPos: { x: 28, y: 75 }, opportunityScore: 68, currency: 'CLP', exchangeRate: 950,
    summary: '拉美最稳定经济体，开放度高，对外贸易便利',
    dimensions: [
      { icon: 'users', title: '人文与商务文化', desc: '商务规范，英语普及度高，决策理性。', tags: ['商务规范', '英语普及', '理性决策'] },
      { icon: 'factory', title: '产业与供需结构', desc: '资源型经济，工业薄弱，消费品大量进口。', tags: ['资源型', '工业薄弱', '进口为主'] },
      { icon: 'bar-chart-3', title: '人口与消费画像', desc: '1900万人口，平均年龄35岁，中产阶级稳定。', tags: ['小而精', '中产稳定', '南美瑞士'] },
      { icon: 'shopping-cart', title: '渠道与零售格局', desc: 'Falabella/Ripley等本土零售强，Mercado Libre覆盖。', tags: ['Falabella', 'Ripley', 'Mercado Libre'] },
      { icon: 'sparkles', title: '选品与趋势洞察', desc: '中高端+品牌产品受欢迎，户外运动文化浓厚。', tags: ['中高端', '品牌导向', '户外运动'] },
      { icon: 'truck', title: '贸易与进口数据', desc: '保温杯类目年进口约0.5亿美元，主要来自中国。', tags: ['小规模', '中国份额高', '稳定'] },
      { icon: 'file-text', title: '政策与准入门槛', desc: '与中国有自贸协定（关税低），SEC认证对电器类要求。', tags: ['中智自贸', 'SEC', '低关税'] },
      { icon: 'dollar-sign', title: '定价与利润空间', desc: '中高端，零售价约为出厂价2.5-3.5倍。', tags: ['中高端', '合理利润', '品牌溢价'] },
      { icon: 'ship', title: '物流与时效成本', desc: '瓦尔帕莱索港，海运35-40天。', tags: ['远距离', '低关税', '运费高'] },
      { icon: 'target', title: '机会评分与建议', desc: '综合机会评分68分，建议以户外品牌切入圣地亚哥。', tags: ['户外', '中高端', '自贸红利'] }
    ],
    insight: { importValue: '$0.5亿', growthRate: '7%', topSource: '中国 60%', avgPrice: '$7', competition: '低', recommendation: '以户外品牌切入圣地亚哥，利用中智自贸协定零关税' },
    risk: { fxRate: 45, policy: 35, logistics: 55, payment: 35, ip: 30, competition: 30 },
    riskNote: '智利是拉美最稳定市场，中智自贸协定是重要优势'
  },

  // ============ 中东 ============
  saudi: {
    name: '沙特阿拉伯', nameEn: 'Saudi Arabia', flag: '🇸🇦', continent: '亚洲', region: '中东',
    mapPos: { x: 58, y: 50 }, opportunityScore: 75, currency: 'SAR', exchangeRate: 3.75,
    summary: '中东最大经济体，石油美元支撑强消费力',
    dimensions: [
      { icon: 'users', title: '人文与商务文化', desc: '穆斯林社会，重视关系和宗教，商务礼仪严格。', tags: ['穆斯林', '关系导向', '严格礼仪'] },
      { icon: 'factory', title: '产业与供需结构', desc: '石油经济，工业基础弱，几乎所有消费品依赖进口。', tags: ['石油经济', '工业弱', '全进口'] },
      { icon: 'bar-chart-3', title: '人口与消费画像', desc: '3500万人口（含大量外籍），平均年龄28岁，购买力极强。', tags: ['强购买力', '外籍人口', '年轻'] },
      { icon: 'shopping-cart', title: '渠道与零售格局', desc: '现代商超和mall密集，电商Noon/SOUQ发展快。', tags: ['Noon', 'SOUQ', '大型mall'] },
      { icon: 'sparkles', title: '选品与趋势洞察', desc: '高端+奢华品牌受欢迎，IP联名产品有市场。', tags: ['高端奢华', 'IP联名', '品牌价值'] },
      { icon: 'truck', title: '贸易与进口数据', desc: '保温杯类目年进口约0.8亿美元，主要来自中国。', tags: ['中等规模', '中国份额高', '稳定'] },
      { icon: 'file-text', title: '政策与准入门槛', desc: 'SABER/SASO认证强制，清真认证加分，外资100%允许。', tags: ['SABER', 'SASO', '清真'] },
      { icon: 'dollar-sign', title: '定价与利润空间', desc: '中高端到高端，零售价约为出厂价3-4倍。', tags: ['高溢价', '高端定位', '品牌价值'] },
      { icon: 'ship', title: '物流与时效成本', desc: '吉达港/达曼港，海运20-25天。', tags: ['中距离', '成熟航线', '运费中等'] },
      { icon: 'target', title: '机会评分与建议', desc: '综合机会评分75分，建议以高端IP联名切入利雅得。', tags: ['高端', 'IP联名', '利雅得'] }
    ],
    insight: { importValue: '$0.8亿', growthRate: '8%', topSource: '中国 70%', avgPrice: '$8', competition: '中等', recommendation: '以高端IP联名切入利雅得/吉达，SABER认证必办' },
    risk: { fxRate: 20, policy: 45, logistics: 35, payment: 30, ip: 30, competition: 50 },
    riskNote: 'SABER认证每批次都需重新申请，注意宗教文化禁忌'
  },
  uae: {
    name: '阿联酋', nameEn: 'UAE', flag: '🇦🇪', continent: '亚洲', region: '中东',
    mapPos: { x: 60, y: 52 }, opportunityScore: 80, currency: 'AED', exchangeRate: 3.67,
    summary: '中东商业枢纽，转口贸易发达，迪拜辐射中东非洲',
    dimensions: [
      { icon: 'users', title: '人文与商务文化', desc: '国际化程度高，外籍人口占比88%，多元文化。', tags: ['国际化', '外籍为主', '多元文化'] },
      { icon: 'factory', title: '产业与供需结构', desc: '石油富国，转口贸易发达，迪拜是中东贸易枢纽。', tags: ['转口枢纽', '贸易中心', '石油富国'] },
      { icon: 'bar-chart-3', title: '人口与消费画像', desc: '1000万人口（88%外籍），平均年龄33岁，超高消费力。', tags: ['超高消费力', '外籍人口', '年轻'] },
      { icon: 'shopping-cart', title: '渠道与零售格局', desc: '迪拜mall全球顶级，Amazon.ae/Noon电商发达。', tags: ['顶级mall', 'Amazon.ae', 'Noon'] },
      { icon: 'sparkles', title: '选品与趋势洞察', desc: '奢华+IP联名+高端产品极受欢迎，礼品市场（斋月）规模大。', tags: ['奢华', 'IP联名', '礼品'] },
      { icon: 'truck', title: '贸易与进口数据', desc: '保温杯类目年进口约0.6亿美元，中国份额约75%。', tags: ['中等规模', '中国份额高', '转口'] },
      { icon: 'file-text', title: '政策与准入门槛', desc: 'ESMA认证对电器类强制，自贸区100%外资免税。', tags: ['ESMA', '自贸区', '免税'] },
      { icon: 'dollar-sign', title: '定价与利润空间', desc: '中高端到高端，零售价约为出厂价3-5倍。', tags: ['高溢价', '奢华定位', '高利润'] },
      { icon: 'ship', title: '物流与时效成本', desc: '杰贝阿里港全球前十，海运18-22天。', tags: ['顶级港口', '航线密集', '运费合理'] },
      { icon: 'target', title: '机会评分与建议', desc: '综合机会评分80分，建议以高端品牌+转口辐射中东非洲。', tags: ['高端品牌', '转口枢纽', '辐射中东'] }
    ],
    insight: { importValue: '$0.6亿', growthRate: '12%', topSource: '中国 75%', avgPrice: '$10', competition: '中等', recommendation: '以高端品牌切入迪拜，同时辐射中东非洲市场' },
    risk: { fxRate: 20, policy: 35, logistics: 30, payment: 25, ip: 25, competition: 45 },
    riskNote: '迪拜转口优势明显，杰贝阿里港效率全球顶级'
  },
  turkey: {
    name: '土耳其', nameEn: 'Turkey', flag: '🇹🇷', continent: '亚洲', region: '中东',
    mapPos: { x: 54, y: 42 }, opportunityScore: 65, currency: 'TRY', exchangeRate: 32,
    summary: '欧亚桥梁，制造业较强，里拉波动大',
    dimensions: [
      { icon: 'users', title: '人文与商务文化', desc: '欧亚混合文化，商务节奏快，重视谈判。', tags: ['欧亚融合', '快节奏', '谈判文化'] },
      { icon: 'factory', title: '产业与供需结构', desc: '制造业较强（纺织/家电），中高端消费品仍需进口。', tags: ['制造业强', '中高端进口', '本地竞争'] },
      { icon: 'bar-chart-3', title: '人口与消费画像', desc: '8500万人口，平均年龄33岁，年轻消费市场。', tags: ['8500万', '年轻', '潜力大'] },
      { icon: 'shopping-cart', title: '渠道与零售格局', desc: 'BIM/A101等本土折扣超市强，Trendyol电商领先。', tags: ['BIM', 'Trendyol', '本土商超'] },
      { icon: 'sparkles', title: '选品与趋势洞察', desc: '性价比+时尚产品受欢迎，里拉贬值推动跨境消费。', tags: ['性价比', '时尚', '跨境购物'] },
      { icon: 'truck', title: '贸易与进口数据', desc: '保温杯类目年进口约0.8亿美元，主要来自中国。', tags: ['中等规模', '中国份额高', '稳定'] },
      { icon: 'file-text', title: '政策与准入门槛', desc: 'TSE认证对部分产品强制，外资可100%控股。', tags: ['TSE', '外资友好', '关税适中'] },
      { icon: 'dollar-sign', title: '定价与利润空间', desc: '中端为主，零售价约为出厂价2-2.8倍。', tags: ['中端', '价格敏感', '汇率敏感'] },
      { icon: 'ship', title: '物流与时效成本', desc: '伊斯坦布尔港，海运28-35天。', tags: ['中距离', '运费合理', '成熟'] },
      { icon: 'target', title: '机会评分与建议', desc: '综合机会评分65分，建议以性价比+时尚设计切入伊斯坦布尔。', tags: ['性价比', '时尚', '伊斯坦布尔'] }
    ],
    insight: { importValue: '$0.8亿', growthRate: '6%', topSource: '中国 60%', avgPrice: '$4', competition: '中等', recommendation: '以性价比+时尚设计切入伊斯坦布尔，关注里拉汇率' },
    risk: { fxRate: 85, policy: 50, logistics: 35, payment: 70, ip: 40, competition: 50 },
    riskNote: '里拉持续贬值，建议100%预付或美元结算，TSE认证需本地代理'
  },

  // ============ 非洲 ============
  south_africa: {
    name: '南非', nameEn: 'South Africa', flag: '🇿🇦', continent: '非洲', region: '南部非洲',
    mapPos: { x: 53, y: 75 }, opportunityScore: 65, currency: 'ZAR', exchangeRate: 18.5,
    summary: '非洲最发达经济体之一，进入撒哈拉以南非洲的跳板',
    dimensions: [
      { icon: 'users', title: '人文与商务文化', desc: '多元种族（黑白有色），英语+南非语，商务规范。', tags: ['多元种族', '英语', '规范'] },
      { icon: 'factory', title: '产业与供需结构', desc: '工业基础好（矿产/汽车），但消费品大量进口。', tags: ['工业基础', '消费品进口', '本地竞争'] },
      { icon: 'bar-chart-3', title: '人口与消费画像', desc: '6000万人口，平均年龄28岁，购买力分化。', tags: ['6000万', '年轻', '分化'] },
      { icon: 'shopping-cart', title: '渠道与零售格局', desc: 'Shoprite/Pick n Pay等本土商超强，Takealot电商领先。', tags: ['Shoprite', 'Takealot', '本土商超'] },
      { icon: 'sparkles', title: '选品与趋势洞察', desc: '性价比+耐用产品受欢迎，户外文化浓厚。', tags: ['性价比', '耐用', '户外'] },
      { icon: 'truck', title: '贸易与进口数据', desc: '保温杯类目年进口约0.5亿美元，主要来自中国。', tags: ['中等规模', '中国份额高', '稳定'] },
      { icon: 'file-text', title: '政策与准入门槛', desc: 'SABS认证对部分品类强制，NRCS管理电子产品。', tags: ['SABS', 'NRCS', '中门槛'] },
      { icon: 'dollar-sign', title: '定价与利润空间', desc: '中端为主，零售价约为出厂价2-2.5倍。', tags: ['中端', '价格敏感', '汇率敏感'] },
      { icon: 'ship', title: '物流与时效成本', desc: '德班港，海运25-30天。', tags: ['远距离', '运费高', '港口成熟'] },
      { icon: 'target', title: '机会评分与建议', desc: '综合机会评分65分，建议以性价比切入约翰内斯堡和开普敦。', tags: ['性价比', '大城市', '非洲跳板'] }
    ],
    insight: { importValue: '$0.5亿', growthRate: '8%', topSource: '中国 75%', avgPrice: '$3.5', competition: '中等', recommendation: '以性价比切入约翰内斯堡和开普敦，作为非洲跳板' },
    risk: { fxRate: 65, policy: 55, logistics: 55, payment: 55, ip: 50, competition: 45 },
    riskNote: '兰特汇率波动大，建议美元结算，注意治安风险'
  },
  nigeria: {
    name: '尼日利亚', nameEn: 'Nigeria', flag: '🇳🇬', continent: '非洲', region: '西部非洲',
    mapPos: { x: 49, y: 60 }, opportunityScore: 55, currency: 'NGN', exchangeRate: 1500,
    summary: '非洲第一人口大国，市场潜力大但风险高',
    dimensions: [
      { icon: 'users', title: '人文与商务文化', desc: '商务依赖关系网络，决策周期长，外汇管制严。', tags: ['关系网络', '长决策', '外汇管制'] },
      { icon: 'factory', title: '产业与供需结构', desc: '资源型经济，制造业弱，消费品几乎全进口。', tags: ['资源型', '制造业弱', '全进口'] },
      { icon: 'bar-chart-3', title: '人口与消费画像', desc: '2.2亿非洲第一，平均年龄18岁，年轻市场。', tags: ['2.2亿人口', '极年轻', '潜力大'] },
      { icon: 'shopping-cart', title: '渠道与零售格局', desc: '传统市场为主，Jumia电商平台领先。', tags: ['传统市场', 'Jumia', '渠道分散'] },
      { icon: 'sparkles', title: '选品与趋势洞察', desc: '高性价比+耐用产品受欢迎，IP和品牌价值弱。', tags: ['性价比', '耐用', 'IP弱'] },
      { icon: 'truck', title: '贸易与进口数据', desc: '保温杯类目年进口约0.3亿美元，中国份额高。', tags: ['小规模', '中国份额高', '波动大'] },
      { icon: 'file-text', title: '政策与准入门槛', desc: 'SON认证对部分品类强制，外汇管制影响结算。', tags: ['SON', '外汇管制', '结算风险'] },
      { icon: 'dollar-sign', title: '定价与利润空间', desc: '中低端，价格极敏感，零售价约为出厂价1.8-2.3倍。', tags: ['中低端', '价格极敏感', '薄利多销'] },
      { icon: 'ship', title: '物流与时效成本', desc: '拉各斯港，海运30-40天，清关效率待提升。', tags: ['远距离', '清关慢', '运费高'] },
      { icon: 'target', title: '机会评分与建议', desc: '综合机会评分55分（高风险），建议谨慎进入，100%预付。', tags: ['高风险', '谨慎', '100%预付'] }
    ],
    insight: { importValue: '$0.3亿', growthRate: '5%', topSource: '中国 80%', avgPrice: '$1.8', competition: '低', recommendation: '建议谨慎进入，100%预付结算，重点开发拉各斯' },
    risk: { fxRate: 90, policy: 75, logistics: 75, payment: 90, ip: 70, competition: 30 },
    riskNote: '高风险市场！尼日利亚外汇管制严且诈骗高发，必须100%预付'
  },

  // ============ 大洋洲 ============
  australia: {
    name: '澳大利亚', nameEn: 'Australia', flag: '🇦🇺', continent: '大洋洲', region: '大洋洲',
    mapPos: { x: 85, y: 75 }, opportunityScore: 72, currency: 'AUD', exchangeRate: 1.52,
    summary: '成熟消费市场，户外文化浓厚，对中国品牌接受度高',
    dimensions: [
      { icon: 'users', title: '人文与商务文化', desc: '英语国家，商务直率，重视效率和环保。', tags: ['英语', '直率', '环保'] },
      { icon: 'factory', title: '产业与供需结构', desc: '资源型经济，制造业弱，消费品大量进口。', tags: ['资源型', '工业弱', '进口为主'] },
      { icon: 'bar-chart-3', title: '人口与消费画像', desc: '2600万人口，平均年龄38岁，购买力强。', tags: ['高购买力', '2600万', '成熟'] },
      { icon: 'shopping-cart', title: '渠道与零售格局', desc: 'Woolworths/Coles双雄，电商Amazon.au/EBay领先。', tags: ['Woolworths', 'Coles', 'Amazon.au'] },
      { icon: 'sparkles', title: '选品与趋势洞察', desc: '户外+环保产品极受欢迎，IP联名有市场。', tags: ['户外', '环保', 'IP联名'] },
      { icon: 'truck', title: '贸易与进口数据', desc: '保温杯类目年进口约0.8亿美元，主要来自中国。', tags: ['中等规模', '中国份额高', '稳定'] },
      { icon: 'file-text', title: '政策与准入门槛', desc: 'RCM认证对电器类强制，澳洲标准严。', tags: ['RCM', '严标准', '进口友好'] },
      { icon: 'dollar-sign', title: '定价与利润空间', desc: '中高端，零售价约为出厂价2.5-3.5倍。', tags: ['中高端', '合理利润', '品牌价值'] },
      { icon: 'ship', title: '物流与时效成本', desc: '悉尼/墨尔本港，海运15-20天。', tags: ['快船直达', '物流成熟', '运费合理'] },
      { icon: 'target', title: '机会评分与建议', desc: '综合机会评分72分，建议以户外品牌+环保材料切入悉尼。', tags: ['户外', '环保', '悉尼'] }
    ],
    insight: { importValue: '$0.8亿', growthRate: '6%', topSource: '中国 75%', avgPrice: '$11', competition: '中等', recommendation: '以户外品牌+环保材料切入悉尼/墨尔本' },
    risk: { fxRate: 30, policy: 40, logistics: 30, payment: 20, ip: 25, competition: 50 },
    riskNote: '澳洲市场规范，对中国品牌接受度较高，RCM认证必办'
  }
};

// 工具函数
window.getCountryList = function() {
  return Object.keys(window.COUNTRY_DATA).map(function(key) {
    var c = window.COUNTRY_DATA[key];
    return {
      key: key, name: c.name, nameEn: c.nameEn, flag: c.flag,
      continent: c.continent, region: c.region, mapPos: c.mapPos,
      opportunityScore: c.opportunityScore, currency: c.currency,
      exchangeRate: c.exchangeRate, summary: c.summary
    };
  });
};

window.getCountryByKey = function(key) {
  return window.COUNTRY_DATA[key] || null;
};

window.getCountriesByContinent = function(continent) {
  if (continent === 'all') return window.getCountryList();
  return window.getCountryList().filter(function(c) { return c.continent === continent; });
};

window.getContinents = function() {
  return [
    { key: 'all', label: '全部', color: '#007aff' },
    { key: '亚洲', label: '亚洲', color: '#007aff' },
    { key: '欧洲', label: '欧洲', color: '#34c759' },
    { key: '北美洲', label: '北美洲', color: '#ff9500' },
    { key: '南美洲', label: '南美洲', color: '#ff9500' },
    { key: '非洲', label: '非洲', color: '#ff3b30' },
    { key: '大洋洲', label: '大洋洲', color: '#af52de' }
  ];
};

// ============ 通用国家列表（全球主要贸易国）============
// 这些国家仅在「目标市场选择下拉」中展示，
// 不参与首页地图小船渲染（mapPos 仍提供以便可点击）
// 1 CNY = x 本币（汇率单位为 "每 1 元人民币 可兑换的本币数量"）
window.LIGHT_COUNTRY_DATA = {
  // 亚洲（除已详细调研的国家外）
  afghanistan: { name: '阿富汗', flag: '🇦🇫', continent: '亚洲', currency: 'AFN', exchangeRate: 12.8, mapPos: { x: 60, y: 18 } },
  armenia: { name: '亚美尼亚', flag: '🇦🇲', continent: '亚洲', currency: 'AMD', exchangeRate: 53.5, mapPos: { x: 53, y: 16 } },
  azerbaijan: { name: '阿塞拜疆', flag: '🇦🇿', continent: '亚洲', currency: 'AZN', exchangeRate: 0.24, mapPos: { x: 53, y: 17 } },
  bahrain: { name: '巴林', flag: '🇧🇭', continent: '亚洲', currency: 'BHD', exchangeRate: 0.053, mapPos: { x: 57, y: 21 } },
  bangladesh: { name: '孟加拉国', flag: '🇧🇩', continent: '亚洲', currency: 'BDT', exchangeRate: 16.5, mapPos: { x: 68, y: 22 } },
  bhutan: { name: '不丹', flag: '🇧🇹', continent: '亚洲', currency: 'BTN', exchangeRate: 12.0, mapPos: { x: 67, y: 21 } },
  brunei: { name: '文莱', flag: '🇧🇳', continent: '亚洲', currency: 'BND', exchangeRate: 0.19, mapPos: { x: 78, y: 26 } },
  cambodia: { name: '柬埔寨', flag: '🇰🇭', continent: '亚洲', currency: 'KHR', exchangeRate: 580, mapPos: { x: 76, y: 24 } },
  china_hk: { name: '中国香港', flag: '🇭🇰', continent: '亚洲', currency: 'HKD', exchangeRate: 1.08, mapPos: { x: 73, y: 21 } },
  china_tw: { name: '中国台湾', flag: '🇨🇳', continent: '亚洲', currency: 'TWD', exchangeRate: 4.5, mapPos: { x: 76, y: 21 } },
  cyprus: { name: '塞浦路斯', flag: '🇨🇾', continent: '亚洲', currency: 'EUR', exchangeRate: 0.13, mapPos: { x: 51, y: 17 } },
  georgia: { name: '格鲁吉亚', flag: '🇬🇪', continent: '亚洲', currency: 'GEL', exchangeRate: 0.38, mapPos: { x: 52, y: 16 } },
  iraq: { name: '伊拉克', flag: '🇮🇶', continent: '亚洲', currency: 'IQD', exchangeRate: 175, mapPos: { x: 55, y: 18 } },
  israel: { name: '以色列', flag: '🇮🇱', continent: '亚洲', currency: 'ILS', exchangeRate: 0.49, mapPos: { x: 52, y: 18 } },
  jordan: { name: '约旦', flag: '🇯🇴', continent: '亚洲', currency: 'JOD', exchangeRate: 0.10, mapPos: { x: 53, y: 19 } },
  kazakhstan: { name: '哈萨克斯坦', flag: '🇰🇿', continent: '亚洲', currency: 'KZT', exchangeRate: 63, mapPos: { x: 60, y: 12 } },
  kuwait: { name: '科威特', flag: '🇰🇼', continent: '亚洲', currency: 'KWD', exchangeRate: 0.041, mapPos: { x: 56, y: 20 } },
  kyrgyzstan: { name: '吉尔吉斯斯坦', flag: '🇰🇬', continent: '亚洲', currency: 'KGS', exchangeRate: 12.2, mapPos: { x: 62, y: 14 } },
  laos: { name: '老挝', flag: '🇱🇦', continent: '亚洲', currency: 'LAK', exchangeRate: 3050, mapPos: { x: 74, y: 23 } },
  lebanon: { name: '黎巴嫩', flag: '🇱🇧', continent: '亚洲', currency: 'LBP', exchangeRate: 15500, mapPos: { x: 52, y: 18 } },
  maldives: { name: '马尔代夫', flag: '🇲🇻', continent: '亚洲', currency: 'MVR', exchangeRate: 2.25, mapPos: { x: 65, y: 27 } },
  mongolia: { name: '蒙古', flag: '🇲🇳', continent: '亚洲', currency: 'MNT', exchangeRate: 480, mapPos: { x: 70, y: 12 } },
  myanmar: { name: '缅甸', flag: '🇲🇲', continent: '亚洲', currency: 'MMK', exchangeRate: 460, mapPos: { x: 71, y: 22 } },
  nepal: { name: '尼泊尔', flag: '🇳🇵', continent: '亚洲', currency: 'NPR', exchangeRate: 17.6, mapPos: { x: 66, y: 21 } },
  north_korea: { name: '朝鲜', flag: '🇰🇵', continent: '亚洲', currency: 'KPW', exchangeRate: 135, mapPos: { x: 75, y: 15 } },
  oman: { name: '阿曼', flag: '🇴🇲', continent: '亚洲', currency: 'OMR', exchangeRate: 0.046, mapPos: { x: 59, y: 22 } },
  pakistan: { name: '巴基斯坦', flag: '🇵🇰', continent: '亚洲', currency: 'PKR', exchangeRate: 39.5, mapPos: { x: 63, y: 20 } },
  palestine: { name: '巴勒斯坦', flag: '🇵🇸', continent: '亚洲', currency: 'ILS', exchangeRate: 0.49, mapPos: { x: 52, y: 18 } },
  qatar: { name: '卡塔尔', flag: '🇶🇦', continent: '亚洲', currency: 'QAR', exchangeRate: 0.51, mapPos: { x: 57, y: 21 } },
  singapore: { name: '新加坡', flag: '🇸🇬', continent: '亚洲', currency: 'SGD', exchangeRate: 0.19, mapPos: { x: 77, y: 26 } },
  sri_lanka: { name: '斯里兰卡', flag: '🇱🇰', continent: '亚洲', currency: 'LKR', exchangeRate: 39.5, mapPos: { x: 66, y: 25 } },
  syria: { name: '叙利亚', flag: '🇸🇾', continent: '亚洲', currency: 'SYP', exchangeRate: 3670, mapPos: { x: 53, y: 18 } },
  tajikistan: { name: '塔吉克斯坦', flag: '🇹🇯', continent: '亚洲', currency: 'TJS', exchangeRate: 1.55, mapPos: { x: 61, y: 16 } },
  timor_leste: { name: '东帝汶', flag: '🇹🇱', continent: '亚洲', currency: 'USD', exchangeRate: 0.14, mapPos: { x: 80, y: 28 } },
  turkmenistan: { name: '土库曼斯坦', flag: '🇹🇲', continent: '亚洲', currency: 'TMT', exchangeRate: 0.49, mapPos: { x: 58, y: 15 } },
  uzbekistan: { name: '乌兹别克斯坦', flag: '🇺🇿', continent: '亚洲', currency: 'UZS', exchangeRate: 1780, mapPos: { x: 59, y: 14 } },
  yemen: { name: '也门', flag: '🇾🇪', continent: '亚洲', currency: 'YER', exchangeRate: 33.4, mapPos: { x: 56, y: 23 } },

  // 欧洲（除已详细调研的国家外）
  albania: { name: '阿尔巴尼亚', flag: '🇦🇱', continent: '欧洲', currency: 'ALL', exchangeRate: 15.2, mapPos: { x: 49, y: 17 } },
  andorra: { name: '安道尔', flag: '🇦🇩', continent: '欧洲', currency: 'EUR', exchangeRate: 0.13, mapPos: { x: 44, y: 16 } },
  austria: { name: '奥地利', flag: '🇦🇹', continent: '欧洲', currency: 'EUR', exchangeRate: 0.13, mapPos: { x: 47, y: 14 } },
  belarus: { name: '白俄罗斯', flag: '🇧🇾', continent: '欧洲', currency: 'BYN', exchangeRate: 0.45, mapPos: { x: 50, y: 11 } },
  belgium: { name: '比利时', flag: '🇧🇪', continent: '欧洲', currency: 'EUR', exchangeRate: 0.13, mapPos: { x: 45, y: 13 } },
  bosnia: { name: '波黑', flag: '🇧🇦', continent: '欧洲', currency: 'BAM', exchangeRate: 0.25, mapPos: { x: 48, y: 16 } },
  bulgaria: { name: '保加利亚', flag: '🇧🇬', continent: '欧洲', currency: 'BGN', exchangeRate: 0.25, mapPos: { x: 50, y: 15 } },
  croatia: { name: '克罗地亚', flag: '🇭🇷', continent: '欧洲', currency: 'EUR', exchangeRate: 0.13, mapPos: { x: 47, y: 15 } },
  czech: { name: '捷克', flag: '🇨🇿', continent: '欧洲', currency: 'CZK', exchangeRate: 3.1, mapPos: { x: 48, y: 13 } },
  denmark: { name: '丹麦', flag: '🇩🇰', continent: '欧洲', currency: 'DKK', exchangeRate: 0.97, mapPos: { x: 47, y: 11 } },
  estonia: { name: '爱沙尼亚', flag: '🇪🇪', continent: '欧洲', currency: 'EUR', exchangeRate: 0.13, mapPos: { x: 49, y: 10 } },
  finland: { name: '芬兰', flag: '🇫🇮', continent: '欧洲', currency: 'EUR', exchangeRate: 0.13, mapPos: { x: 49, y: 8 } },
  greece: { name: '希腊', flag: '🇬🇷', continent: '欧洲', currency: 'EUR', exchangeRate: 0.13, mapPos: { x: 50, y: 17 } },
  hungary: { name: '匈牙利', flag: '🇭🇺', continent: '欧洲', currency: 'HUF', exchangeRate: 51, mapPos: { x: 49, y: 14 } },
  iceland: { name: '冰岛', flag: '🇮🇸', continent: '欧洲', currency: 'ISK', exchangeRate: 18.7, mapPos: { x: 41, y: 8 } },
  ireland: { name: '爱尔兰', flag: '🇮🇪', continent: '欧洲', currency: 'EUR', exchangeRate: 0.13, mapPos: { x: 42, y: 12 } },
  italy: { name: '意大利', flag: '🇮🇹', continent: '欧洲', currency: 'EUR', exchangeRate: 0.13, mapPos: { x: 47, y: 16 } },
  kosovo: { name: '科索沃', flag: '🇽🇰', continent: '欧洲', currency: 'EUR', exchangeRate: 0.13, mapPos: { x: 49, y: 16 } },
  latvia: { name: '拉脱维亚', flag: '🇱🇻', continent: '欧洲', currency: 'EUR', exchangeRate: 0.13, mapPos: { x: 49, y: 11 } },
  liechtenstein: { name: '列支敦士登', flag: '🇱🇮', continent: '欧洲', currency: 'CHF', exchangeRate: 0.12, mapPos: { x: 46, y: 14 } },
  lithuania: { name: '立陶宛', flag: '🇱🇹', continent: '欧洲', currency: 'EUR', exchangeRate: 0.13, mapPos: { x: 50, y: 11 } },
  luxembourg: { name: '卢森堡', flag: '🇱🇺', continent: '欧洲', currency: 'EUR', exchangeRate: 0.13, mapPos: { x: 45, y: 13 } },
  malta: { name: '马耳他', flag: '🇲🇹', continent: '欧洲', currency: 'EUR', exchangeRate: 0.13, mapPos: { x: 48, y: 18 } },
  moldova: { name: '摩尔多瓦', flag: '🇲🇩', continent: '欧洲', currency: 'MDL', exchangeRate: 2.5, mapPos: { x: 51, y: 14 } },
  monaco: { name: '摩纳哥', flag: '🇲🇨', continent: '欧洲', currency: 'EUR', exchangeRate: 0.13, mapPos: { x: 46, y: 16 } },
  montenegro: { name: '黑山', flag: '🇲🇪', continent: '欧洲', currency: 'EUR', exchangeRate: 0.13, mapPos: { x: 48, y: 16 } },
  north_macedonia: { name: '北马其顿', flag: '🇲🇰', continent: '欧洲', currency: 'MKD', exchangeRate: 7.6, mapPos: { x: 49, y: 16 } },
  norway: { name: '挪威', flag: '🇳🇴', continent: '欧洲', currency: 'NOK', exchangeRate: 1.5, mapPos: { x: 46, y: 9 } },
  poland: { name: '波兰', flag: '🇵🇱', continent: '欧洲', currency: 'PLN', exchangeRate: 0.56, mapPos: { x: 49, y: 12 } },
  portugal: { name: '葡萄牙', flag: '🇵🇹', continent: '欧洲', currency: 'EUR', exchangeRate: 0.13, mapPos: { x: 42, y: 16 } },
  romania: { name: '罗马尼亚', flag: '🇷🇴', continent: '欧洲', currency: 'RON', exchangeRate: 0.63, mapPos: { x: 50, y: 14 } },
  san_marino: { name: '圣马力诺', flag: '🇸🇲', continent: '欧洲', currency: 'EUR', exchangeRate: 0.13, mapPos: { x: 47, y: 15 } },
  serbia: { name: '塞尔维亚', flag: '🇷🇸', continent: '欧洲', currency: 'RSD', exchangeRate: 15.2, mapPos: { x: 49, y: 15 } },
  slovakia: { name: '斯洛伐克', flag: '🇸🇰', continent: '欧洲', currency: 'EUR', exchangeRate: 0.13, mapPos: { x: 49, y: 13 } },
  slovenia: { name: '斯洛文尼亚', flag: '🇸🇮', continent: '欧洲', currency: 'EUR', exchangeRate: 0.13, mapPos: { x: 47, y: 15 } },
  spain: { name: '西班牙', flag: '🇪🇸', continent: '欧洲', currency: 'EUR', exchangeRate: 0.13, mapPos: { x: 43, y: 16 } },
  sweden: { name: '瑞典', flag: '🇸🇪', continent: '欧洲', currency: 'SEK', exchangeRate: 1.5, mapPos: { x: 47, y: 10 } },
  switzerland: { name: '瑞士', flag: '🇨🇭', continent: '欧洲', currency: 'CHF', exchangeRate: 0.12, mapPos: { x: 46, y: 14 } },
  ukraine: { name: '乌克兰', flag: '🇺🇦', continent: '欧洲', currency: 'UAH', exchangeRate: 5.6, mapPos: { x: 51, y: 12 } },
  vatican: { name: '梵蒂冈', flag: '🇻🇦', continent: '欧洲', currency: 'EUR', exchangeRate: 0.13, mapPos: { x: 47, y: 16 } },

  // 北美洲（除已详细调研的国家外）
  antigua: { name: '安提瓜和巴布达', flag: '🇦🇬', continent: '北美洲', currency: 'XCD', exchangeRate: 0.36, mapPos: { x: 25, y: 26 } },
  bahamas: { name: '巴哈马', flag: '🇧🇸', continent: '北美洲', currency: 'BSD', exchangeRate: 0.14, mapPos: { x: 22, y: 24 } },
  barbados: { name: '巴巴多斯', flag: '🇧🇧', continent: '北美洲', currency: 'BBD', exchangeRate: 0.28, mapPos: { x: 25, y: 27 } },
  belize: { name: '伯利兹', flag: '🇧🇿', continent: '北美洲', currency: 'BZD', exchangeRate: 0.28, mapPos: { x: 19, y: 25 } },
  bermuda: { name: '百慕大', flag: '🇧🇲', continent: '北美洲', currency: 'BMD', exchangeRate: 0.14, mapPos: { x: 24, y: 21 } },
  costa_rica: { name: '哥斯达黎加', flag: '🇨🇷', continent: '北美洲', currency: 'CRC', exchangeRate: 72, mapPos: { x: 19, y: 28 } },
  cuba: { name: '古巴', flag: '🇨🇺', continent: '北美洲', currency: 'CUP', exchangeRate: 3.6, mapPos: { x: 21, y: 25 } },
  dominica: { name: '多米尼克', flag: '🇩🇲', continent: '北美洲', currency: 'XCD', exchangeRate: 0.36, mapPos: { x: 25, y: 27 } },
  dominican: { name: '多米尼加共和国', flag: '🇩🇴', continent: '北美洲', currency: 'DOP', exchangeRate: 8.0, mapPos: { x: 23, y: 26 } },
  el_salvador: { name: '萨尔瓦多', flag: '🇸🇻', continent: '北美洲', currency: 'USD', exchangeRate: 0.14, mapPos: { x: 18, y: 27 } },
  grenada: { name: '格林纳达', flag: '🇬🇩', continent: '北美洲', currency: 'XCD', exchangeRate: 0.36, mapPos: { x: 25, y: 28 } },
  guatemala: { name: '危地马拉', flag: '🇬🇹', continent: '北美洲', currency: 'GTQ', exchangeRate: 1.08, mapPos: { x: 18, y: 27 } },
  haiti: { name: '海地', flag: '🇭🇹', continent: '北美洲', currency: 'HTG', exchangeRate: 18.3, mapPos: { x: 23, y: 26 } },
  honduras: { name: '洪都拉斯', flag: '🇭🇳', continent: '北美洲', currency: 'HNL', exchangeRate: 3.45, mapPos: { x: 19, y: 27 } },
  jamaica: { name: '牙买加', flag: '🇯🇲', continent: '北美洲', currency: 'JMD', exchangeRate: 21.5, mapPos: { x: 22, y: 26 } },
  nicaragua: { name: '尼加拉瓜', flag: '🇳🇮', continent: '北美洲', currency: 'NIO', exchangeRate: 5.1, mapPos: { x: 19, y: 27 } },
  panama: { name: '巴拿马', flag: '🇵🇦', continent: '北美洲', currency: 'PAB', exchangeRate: 0.14, mapPos: { x: 20, y: 28 } },
  st_kitts: { name: '圣基茨和尼维斯', flag: '🇰🇳', continent: '北美洲', currency: 'XCD', exchangeRate: 0.36, mapPos: { x: 25, y: 26 } },
  st_lucia: { name: '圣卢西亚', flag: '🇱🇨', continent: '北美洲', currency: 'XCD', exchangeRate: 0.36, mapPos: { x: 25, y: 28 } },
  st_vincent: { name: '圣文森特和格林纳丁斯', flag: '🇻🇨', continent: '北美洲', currency: 'XCD', exchangeRate: 0.36, mapPos: { x: 25, y: 28 } },
  trinidad: { name: '特立尼达和多巴哥', flag: '🇹🇹', continent: '北美洲', currency: 'TTD', exchangeRate: 0.94, mapPos: { x: 25, y: 28 } },

  // 南美洲（除已详细调研的国家外）
  argentina: { name: '阿根廷', flag: '🇦🇷', continent: '南美洲', currency: 'ARS', exchangeRate: 125, mapPos: { x: 25, y: 42 } },
  bolivia: { name: '玻利维亚', flag: '🇧🇴', continent: '南美洲', currency: 'BOB', exchangeRate: 0.96, mapPos: { x: 23, y: 38 } },
  colombia: { name: '哥伦比亚', flag: '🇨🇴', continent: '南美洲', currency: 'COP', exchangeRate: 580, mapPos: { x: 22, y: 35 } },
  ecuador: { name: '厄瓜多尔', flag: '🇪🇨', continent: '南美洲', currency: 'USD', exchangeRate: 0.14, mapPos: { x: 20, y: 36 } },
  guyana: { name: '圭亚那', flag: '🇬🇾', continent: '南美洲', currency: 'GYD', exchangeRate: 29.0, mapPos: { x: 25, y: 33 } },
  paraguay: { name: '巴拉圭', flag: '🇵🇾', continent: '南美洲', currency: 'PYG', exchangeRate: 1050, mapPos: { x: 25, y: 40 } },
  peru: { name: '秘鲁', flag: '🇵🇪', continent: '南美洲', currency: 'PEN', exchangeRate: 0.52, mapPos: { x: 21, y: 38 } },
  suriname: { name: '苏里南', flag: '🇸🇷', continent: '南美洲', currency: 'SRD', exchangeRate: 4.2, mapPos: { x: 26, y: 33 } },
  uruguay: { name: '乌拉圭', flag: '🇺🇾', continent: '南美洲', currency: 'UYU', exchangeRate: 5.7, mapPos: { x: 26, y: 43 } },
  venezuela: { name: '委内瑞拉', flag: '🇻🇪', continent: '南美洲', currency: 'VES', exchangeRate: 5.0, mapPos: { x: 23, y: 33 } },

  // 非洲（除已详细调研的国家外）
  algeria: { name: '阿尔及利亚', flag: '🇩🇿', continent: '非洲', currency: 'DZD', exchangeRate: 18.5, mapPos: { x: 46, y: 22 } },
  angola: { name: '安哥拉', flag: '🇦🇴', continent: '非洲', currency: 'AOA', exchangeRate: 125, mapPos: { x: 50, y: 32 } },
  benin: { name: '贝宁', flag: '🇧🇯', continent: '非洲', currency: 'XOF', exchangeRate: 84, mapPos: { x: 47, y: 27 } },
  botswana: { name: '博茨瓦纳', flag: '🇧🇼', continent: '非洲', currency: 'BWP', exchangeRate: 1.9, mapPos: { x: 52, y: 35 } },
  burkina_faso: { name: '布基纳法索', flag: '🇧🇫', continent: '非洲', currency: 'XOF', exchangeRate: 84, mapPos: { x: 46, y: 26 } },
  burundi: { name: '布隆迪', flag: '🇧🇮', continent: '非洲', currency: 'BIF', exchangeRate: 395, mapPos: { x: 52, y: 30 } },
  cameroon: { name: '喀麦隆', flag: '🇨🇲', continent: '非洲', currency: 'XAF', exchangeRate: 84, mapPos: { x: 49, y: 28 } },
  cape_verde: { name: '佛得角', flag: '🇨🇻', continent: '非洲', currency: 'CVE', exchangeRate: 14.0, mapPos: { x: 42, y: 26 } },
  chad: { name: '乍得', flag: '🇹🇩', continent: '非洲', currency: 'XAF', exchangeRate: 84, mapPos: { x: 49, y: 25 } },
  comoros: { name: '科摩罗', flag: '🇰🇲', continent: '非洲', currency: 'KMF', exchangeRate: 57, mapPos: { x: 55, y: 31 } },
  congo_brazzaville: { name: '刚果（布）', flag: '🇨🇬', continent: '非洲', currency: 'XAF', exchangeRate: 84, mapPos: { x: 50, y: 30 } },
  congo_kinshasa: { name: '刚果（金）', flag: '🇨🇩', continent: '非洲', currency: 'CDF', exchangeRate: 285, mapPos: { x: 51, y: 30 } },
  ivory_coast: { name: '科特迪瓦', flag: '🇨🇮', continent: '非洲', currency: 'XOF', exchangeRate: 84, mapPos: { x: 46, y: 28 } },
  djibouti: { name: '吉布提', flag: '🇩🇯', continent: '非洲', currency: 'DJF', exchangeRate: 24.5, mapPos: { x: 56, y: 26 } },
  egypt: { name: '埃及', flag: '🇪🇬', continent: '非洲', currency: 'EGP', exchangeRate: 6.7, mapPos: { x: 52, y: 22 } },
  equatorial_guinea: { name: '赤道几内亚', flag: '🇬🇶', continent: '非洲', currency: 'XAF', exchangeRate: 84, mapPos: { x: 49, y: 29 } },
  eritrea: { name: '厄立特里亚', flag: '🇪🇷', continent: '非洲', currency: 'ERN', exchangeRate: 2.1, mapPos: { x: 55, y: 25 } },
  eswatini: { name: '斯威士兰', flag: '🇸🇿', continent: '非洲', currency: 'SZL', exchangeRate: 2.55, mapPos: { x: 54, y: 36 } },
  ethiopia: { name: '埃塞俄比亚', flag: '🇪🇹', continent: '非洲', currency: 'ETB', exchangeRate: 14.0, mapPos: { x: 55, y: 27 } },
  gabon: { name: '加蓬', flag: '🇬🇦', continent: '非洲', currency: 'XAF', exchangeRate: 84, mapPos: { x: 49, y: 29 } },
  gambia: { name: '冈比亚', flag: '🇬🇲', continent: '非洲', currency: 'GMD', exchangeRate: 8.0, mapPos: { x: 44, y: 26 } },
  ghana: { name: '加纳', flag: '🇬🇭', continent: '非洲', currency: 'GHS', exchangeRate: 1.7, mapPos: { x: 47, y: 28 } },
  guinea: { name: '几内亚', flag: '🇬🇳', continent: '非洲', currency: 'GNF', exchangeRate: 1200, mapPos: { x: 45, y: 27 } },
  guinea_bissau: { name: '几内亚比绍', flag: '🇬🇼', continent: '非洲', currency: 'XOF', exchangeRate: 84, mapPos: { x: 44, y: 27 } },
  kenya: { name: '肯尼亚', flag: '🇰🇪', continent: '非洲', currency: 'KES', exchangeRate: 18.0, mapPos: { x: 55, y: 29 } },
  lesotho: { name: '莱索托', flag: '🇱🇸', continent: '非洲', currency: 'LSL', exchangeRate: 2.55, mapPos: { x: 54, y: 36 } },
  liberia: { name: '利比里亚', flag: '🇱🇷', continent: '非洲', currency: 'LRD', exchangeRate: 26.0, mapPos: { x: 45, y: 28 } },
  libya: { name: '利比亚', flag: '🇱🇾', continent: '非洲', currency: 'LYD', exchangeRate: 0.69, mapPos: { x: 49, y: 22 } },
  madagascar: { name: '马达加斯加', flag: '🇲🇬', continent: '非洲', currency: 'MGA', exchangeRate: 645, mapPos: { x: 56, y: 34 } },
  malawi: { name: '马拉维', flag: '🇲🇼', continent: '非洲', currency: 'MWK', exchangeRate: 290, mapPos: { x: 54, y: 33 } },
  mali: { name: '马里', flag: '🇲🇱', continent: '非洲', currency: 'XOF', exchangeRate: 84, mapPos: { x: 46, y: 25 } },
  mauritania: { name: '毛里塔尼亚', flag: '🇲🇷', continent: '非洲', currency: 'MRU', exchangeRate: 5.5, mapPos: { x: 44, y: 25 } },
  mauritius: { name: '毛里求斯', flag: '🇲🇺', continent: '非洲', currency: 'MUR', exchangeRate: 6.3, mapPos: { x: 57, y: 34 } },
  morocco: { name: '摩洛哥', flag: '🇲🇦', continent: '非洲', currency: 'MAD', exchangeRate: 1.4, mapPos: { x: 44, y: 22 } },
  mozambique: { name: '莫桑比克', flag: '🇲🇿', continent: '非洲', currency: 'MZN', exchangeRate: 8.9, mapPos: { x: 55, y: 35 } },
  namibia: { name: '纳米比亚', flag: '🇳🇦', continent: '非洲', currency: 'NAD', exchangeRate: 2.55, mapPos: { x: 52, y: 36 } },
  niger: { name: '尼日尔', flag: '🇳🇪', continent: '非洲', currency: 'XOF', exchangeRate: 84, mapPos: { x: 48, y: 25 } },
  rwanda: { name: '卢旺达', flag: '🇷🇼', continent: '非洲', currency: 'RWF', exchangeRate: 190, mapPos: { x: 53, y: 30 } },
  sao_tome: { name: '圣多美和普林西比', flag: '🇸🇹', continent: '非洲', currency: 'STN', exchangeRate: 3.2, mapPos: { x: 48, y: 29 } },
  senegal: { name: '塞内加尔', flag: '🇸🇳', continent: '非洲', currency: 'XOF', exchangeRate: 84, mapPos: { x: 45, y: 26 } },
  seychelles: { name: '塞舌尔', flag: '🇸🇨', continent: '非洲', currency: 'SCR', exchangeRate: 1.94, mapPos: { x: 58, y: 30 } },
  sierra_leone: { name: '塞拉利昂', flag: '🇸🇱', continent: '非洲', currency: 'SLE', exchangeRate: 2.6, mapPos: { x: 45, y: 28 } },
  somalia: { name: '索马里', flag: '🇸🇴', continent: '非洲', currency: 'SOS', exchangeRate: 80, mapPos: { x: 57, y: 28 } },
  south_sudan: { name: '南苏丹', flag: '🇸🇸', continent: '非洲', currency: 'SSP', exchangeRate: 187, mapPos: { x: 53, y: 27 } },
  sudan: { name: '苏丹', flag: '🇸🇩', continent: '非洲', currency: 'SDG', exchangeRate: 84, mapPos: { x: 53, y: 24 } },
  tanzania: { name: '坦桑尼亚', flag: '🇹🇿', continent: '非洲', currency: 'TZS', exchangeRate: 365, mapPos: { x: 54, y: 31 } },
  togo: { name: '多哥', flag: '🇹🇬', continent: '非洲', currency: 'XOF', exchangeRate: 84, mapPos: { x: 47, y: 27 } },
  tunisia: { name: '突尼斯', flag: '🇹🇳', continent: '非洲', currency: 'TND', exchangeRate: 0.43, mapPos: { x: 47, y: 21 } },
  uganda: { name: '乌干达', flag: '🇺🇬', continent: '非洲', currency: 'UGX', exchangeRate: 520, mapPos: { x: 54, y: 29 } },
  zambia: { name: '赞比亚', flag: '🇿🇲', continent: '非洲', currency: 'ZMW', exchangeRate: 3.7, mapPos: { x: 53, y: 34 } },
  zimbabwe: { name: '津巴布韦', flag: '🇿🇼', continent: '非洲', currency: 'ZWL', exchangeRate: 322, mapPos: { x: 53, y: 35 } },

  // 大洋洲（除已详细调研的国家外）
  fiji: { name: '斐济', flag: '🇫🇯', continent: '大洋洲', currency: 'FJD', exchangeRate: 0.31, mapPos: { x: 92, y: 36 } },
  kiribati: { name: '基里巴斯', flag: '🇰🇮', continent: '大洋洲', currency: 'AUD', exchangeRate: 0.22, mapPos: { x: 94, y: 31 } },
  marshall: { name: '马绍尔群岛', flag: '🇲🇭', continent: '大洋洲', currency: 'USD', exchangeRate: 0.14, mapPos: { x: 93, y: 30 } },
  micronesia: { name: '密克罗尼西亚', flag: '🇫🇲', continent: '大洋洲', currency: 'USD', exchangeRate: 0.14, mapPos: { x: 92, y: 30 } },
  nauru: { name: '瑙鲁', flag: '🇳🇷', continent: '大洋洲', currency: 'AUD', exchangeRate: 0.22, mapPos: { x: 93, y: 32 } },
  palau: { name: '帕劳', flag: '🇵🇼', continent: '大洋洲', currency: 'USD', exchangeRate: 0.14, mapPos: { x: 90, y: 30 } },
  png: { name: '巴布亚新几内亚', flag: '🇵🇬', continent: '大洋洲', currency: 'PGK', exchangeRate: 0.55, mapPos: { x: 89, y: 32 } },
  samoa: { name: '萨摩亚', flag: '🇼🇸', continent: '大洋洲', currency: 'WST', exchangeRate: 0.38, mapPos: { x: 94, y: 36 } },
  solomon: { name: '所罗门群岛', flag: '🇸🇧', continent: '大洋洲', currency: 'SBD', exchangeRate: 1.16, mapPos: { x: 91, y: 33 } },
  tonga: { name: '汤加', flag: '🇹🇴', continent: '大洋洲', currency: 'TOP', exchangeRate: 0.32, mapPos: { x: 94, y: 35 } },
  tuvalu: { name: '图瓦卢', flag: '🇹🇻', continent: '大洋洲', currency: 'AUD', exchangeRate: 0.22, mapPos: { x: 94, y: 33 } },
  vanuatu: { name: '瓦努阿图', flag: '🇻🇺', continent: '大洋洲', currency: 'VUV', exchangeRate: 16.5, mapPos: { x: 92, y: 34 } }
};

// 合并 COUNTRY_DATA 和 LIGHT_COUNTRY_DATA
window.getAllCountries = function() {
  var list = window.getCountryList();
  Object.keys(window.LIGHT_COUNTRY_DATA).forEach(function(key) {
    if (list.find(function(c) { return c.key === key; })) return;
    var c = window.LIGHT_COUNTRY_DATA[key];
    list.push({
      key: key, name: c.name, flag: c.flag,
      continent: c.continent, currency: c.currency,
      exchangeRate: c.exchangeRate, mapPos: c.mapPos,
      opportunityScore: 60, summary: '基础国家信息（10 维深度调研数据即将上线）'
    });
  });
  return list;
};

window.getAllCountriesByContinent = function(continent) {
  var all = window.getAllCountries();
  if (continent === 'all') return all;
  return all.filter(function(c) { return c.continent === continent; });
};
