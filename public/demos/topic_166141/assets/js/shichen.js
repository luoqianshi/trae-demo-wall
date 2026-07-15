// shichen.js - 十二时辰换算
// 核心:现代时分 <-> 十二时辰互转,基于本地 Date 与时区字符串

const Shichen = (() => {
  const SHICHEN_NAMES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const SHICHEN_ALIAS = {
    '子': '夜半', '丑': '鸡鸣', '寅': '平旦', '卯': '日出',
    '辰': '食时', '巳': '隅中', '午': '日中', '未': '日昳',
    '申': '哺时', '酉': '日入', '戌': '黄昏', '亥': '人定'
  };
  const SHICHEN_ZODIAC = {
    '子': '鼠', '丑': '牛', '寅': '虎', '卯': '兔',
    '辰': '龙', '巳': '蛇', '午': '马', '未': '羊',
    '申': '猴', '酉': '鸡', '戌': '狗', '亥': '猪'
  };

  // 给定一个 Date 与时区,返回该时区下的整点小时
  function hourInTZ(date, tz) {
    const fmt = new Intl.DateTimeFormat('zh-CN', {
      hour: '2-digit', hour12: false, timeZone: tz
    });
    const str = fmt.format(date);
    return parseInt(str, 10);
  }

  // 给定一个 Date 与时区,返回时分
  function timePartsInTZ(date, tz) {
    const fmt = new Intl.DateTimeFormat('zh-CN', {
      hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz
    });
    const parts = fmt.formatToParts(date);
    let h = 0, m = 0;
    parts.forEach(p => {
      if (p.type === 'hour') h = parseInt(p.value, 10);
      if (p.type === 'minute') m = parseInt(p.value, 10);
    });
    return { h, m };
  }

  // 根据小时数获取时辰名
  // 子时跨日: 23-24 → 子, 0-1 → 子
  function shichenByHour(h) {
    if (h === 23 || h === 0) return '子';
    if (h === 1 || h === 2) return '丑';
    if (h === 3 || h === 4) return '寅';
    if (h === 5 || h === 6) return '卯';
    if (h === 7 || h === 8) return '辰';
    if (h === 9 || h === 10) return '巳';
    if (h === 11 || h === 12) return '午';
    if (h === 13 || h === 14) return '未';
    if (h === 15 || h === 16) return '申';
    if (h === 17 || h === 18) return '酉';
    if (h === 19 || h === 20) return '戌';
    if (h === 21 || h === 22) return '亥';
    return '子';
  }

  function getShichen(date, tz) {
    const { h, m } = timePartsInTZ(date, tz);
    const name = shichenByHour(h);
    const idx = SHICHEN_NAMES.indexOf(name);
    return { name, idx, hour: h, minute: m, alias: SHICHEN_ALIAS[name] };
  }

  // 获取时辰在十二时辰中的索引(0-11)
  function shichenIndex(name) {
    return SHICHEN_NAMES.indexOf(name);
  }

  // 时辰名转中文时段,如 "寅" -> "寅时(03:00-05:00)"
  function shichenInfo(name) {
    const ranges = {
      '子': '23:00-01:00', '丑': '01:00-03:00', '寅': '03:00-05:00',
      '卯': '05:00-07:00', '辰': '07:00-09:00', '巳': '09:00-11:00',
      '午': '11:00-13:00', '未': '13:00-15:00', '申': '15:00-17:00',
      '酉': '17:00-19:00', '戌': '19:00-21:00', '亥': '21:00-23:00'
    };
    return {
      name,
      label: name + '时',
      alias: SHICHEN_ALIAS[name],
      zodiac: SHICHEN_ZODIAC[name],
      range: ranges[name]
    };
  }

  // 判断两个时辰名是否相同
  function eq(a, b) {
    return a === b;
  }

  return {
    SHICHEN_NAMES, SHICHEN_ALIAS, SHICHEN_ZODIAC,
    hourInTZ, timePartsInTZ, shichenByHour,
    getShichen, shichenIndex, shichenInfo, eq
  };
})();
