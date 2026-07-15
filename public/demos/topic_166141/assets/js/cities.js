// cities.js - 城市时区数据(内联版)
// 不依赖 fetch,file:// 协议下也能工作
// 41 城市覆盖五大洲

const Cities = (() => {
  const data = [
    { key: 'Asia/Shanghai', city: '北京', country: '中国', alias: '紫禁城', offset: '+08:00' },
    { key: 'Asia/Shanghai', city: '上海', country: '中国', offset: '+08:00' },
    { key: 'Asia/Hong_Kong', city: '香港', country: '中国', offset: '+08:00' },
    { key: 'Asia/Taipei', city: '台北', country: '中国', offset: '+08:00' },
    { key: 'Asia/Urumqi', city: '乌鲁木齐', country: '中国', offset: '+06:00' },
    { key: 'Asia/Tokyo', city: '东京', country: '日本', offset: '+09:00' },
    { key: 'Asia/Seoul', city: '首尔', country: '韩国', offset: '+09:00' },
    { key: 'Asia/Singapore', city: '新加坡', country: '新加坡', offset: '+08:00' },
    { key: 'Asia/Bangkok', city: '曼谷', country: '泰国', offset: '+07:00' },
    { key: 'Asia/Jakarta', city: '雅加达', country: '印度尼西亚', offset: '+07:00' },
    { key: 'Asia/Manila', city: '马尼拉', country: '菲律宾', offset: '+08:00' },
    { key: 'Asia/Kolkata', city: '孟买', country: '印度', offset: '+05:30' },
    { key: 'Asia/Karachi', city: '卡拉奇', country: '巴基斯坦', offset: '+05:00' },
    { key: 'Asia/Dubai', city: '迪拜', country: '阿联酋', offset: '+04:00' },
    { key: 'Asia/Tehran', city: '德黑兰', country: '伊朗', offset: '+03:30' },
    { key: 'Europe/London', city: '伦敦', country: '英国', offset: '+00:00' },
    { key: 'Europe/Paris', city: '巴黎', country: '法国', offset: '+01:00' },
    { key: 'Europe/Berlin', city: '柏林', country: '德国', offset: '+01:00' },
    { key: 'Europe/Madrid', city: '马德里', country: '西班牙', offset: '+01:00' },
    { key: 'Europe/Rome', city: '罗马', country: '意大利', offset: '+01:00' },
    { key: 'Europe/Amsterdam', city: '阿姆斯特丹', country: '荷兰', offset: '+01:00' },
    { key: 'Europe/Stockholm', city: '斯德哥尔摩', country: '瑞典', offset: '+01:00' },
    { key: 'Europe/Vienna', city: '维也纳', country: '奥地利', offset: '+01:00' },
    { key: 'Europe/Athens', city: '雅典', country: '希腊', offset: '+02:00' },
    { key: 'Europe/Istanbul', city: '伊斯坦布尔', country: '土耳其', offset: '+03:00' },
    { key: 'Europe/Moscow', city: '莫斯科', country: '俄罗斯', offset: '+03:00' },
    { key: 'Africa/Cairo', city: '开罗', country: '埃及', offset: '+02:00' },
    { key: 'Africa/Lagos', city: '拉各斯', country: '尼日利亚', offset: '+01:00' },
    { key: 'Africa/Johannesburg', city: '约翰内斯堡', country: '南非', offset: '+02:00' },
    { key: 'America/New_York', city: '纽约', country: '美国', offset: '-05:00' },
    { key: 'America/Chicago', city: '芝加哥', country: '美国', offset: '-06:00' },
    { key: 'America/Denver', city: '丹佛', country: '美国', offset: '-07:00' },
    { key: 'America/Los_Angeles', city: '洛杉矶', country: '美国', offset: '-08:00' },
    { key: 'America/Toronto', city: '多伦多', country: '加拿大', offset: '-05:00' },
    { key: 'America/Vancouver', city: '温哥华', country: '加拿大', offset: '-08:00' },
    { key: 'America/Mexico_City', city: '墨西哥城', country: '墨西哥', offset: '-06:00' },
    { key: 'America/Sao_Paulo', city: '圣保罗', country: '巴西', offset: '-03:00' },
    { key: 'America/Argentina/Buenos_Aires', city: '布宜诺斯艾利斯', country: '阿根廷', offset: '-03:00' },
    { key: 'Australia/Sydney', city: '悉尼', country: '澳大利亚', offset: '+11:00' },
    { key: 'Australia/Melbourne', city: '墨尔本', country: '澳大利亚', offset: '+11:00' },
    { key: 'Australia/Perth', city: '珀斯', country: '澳大利亚', offset: '+08:00' },
    { key: 'Pacific/Auckland', city: '奥克兰', country: '新西兰', offset: '+13:00' },
    { key: 'Pacific/Honolulu', city: '檀香山', country: '美国', offset: '-10:00' }
  ];

  // 用 Map 去重,key 作为唯一键
  const byKey = new Map();
  data.forEach(c => { if (!byKey.has(c.key)) byKey.set(c.key, c); });

  function load() { return Promise.resolve(data); }
  function findByKey(key) { return byKey.get(key); }
  function all() { return data; }

  function search(query) {
    if (!query) return data;
    const q = query.toLowerCase().trim();
    return data.filter(c =>
      c.city.toLowerCase().includes(q) ||
      c.country.toLowerCase().includes(q) ||
      c.key.toLowerCase().includes(q) ||
      (c.alias && c.alias.toLowerCase().includes(q))
    );
  }

  function getByOffset(offset) {
    return data.filter(c => c.offset === offset);
  }

  // IANA 前缀 → 大洲
  const REGION_OF = {
    'Asia': '亚洲',
    'Europe': '欧洲',
    'America': '美洲',
    'Africa': '非洲',
    'Australia': '大洋洲',
    'Pacific': '大洋洲',
    'Antarctica': '其他'
  };
  // 区域显示顺序
  const REGION_ORDER = ['亚洲', '欧洲', '美洲', '非洲', '大洋洲', '其他'];

  function regionOf(key) {
    if (!key) return '其他';
    const prefix = key.split('/')[0];
    return REGION_OF[prefix] || '其他';
  }

  // 返回按大洲分组、按城市名排序的城市列表
  function groupedByRegion() {
    const groups = {};
    REGION_ORDER.forEach(r => { groups[r] = []; });
    data.forEach(c => {
      const r = regionOf(c.key);
      groups[r].push(c);
    });
    // 每个分组成员按 city 排序
    Object.keys(groups).forEach(r => {
      groups[r].sort((a, b) => a.city.localeCompare(b.city, 'zh-Hans-CN'));
    });
    return groups;
  }

  return { load, findByKey, search, getByOffset, all, regionOf, groupedByRegion, REGION_ORDER };
})();
