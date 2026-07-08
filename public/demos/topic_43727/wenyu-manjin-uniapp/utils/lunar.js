/**
 * 农历和节气转换工具
 * 支持 1900-2100 年的农历日期转换与二十四节气查询
 */

// 1900-2100 年农历数据
// 每个元素编码了该年的农历信息：闰月月份、大小月、闰月大小
// 格式：高4位为闰月月份(0表示无闰月)，中间12位为各月大小(1=大月30天,0=小月29天)，最低位为闰月大小
const lunarInfo = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
  0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0,
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6,
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x05ac0, 0x0ab60, 0x096d5, 0x092e0,
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
  0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
  0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0,
  0x092e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4,
  0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0,
  0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160,
  0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a4d0, 0x0d150, 0x0f252,
  0x0d520
]

// 二十四节气名称
const solarTerms = [
  '小寒', '大寒', '立春', '雨水', '惊蛰', '春分',
  '清明', '谷雨', '立夏', '小满', '芒种', '夏至',
  '小暑', '大暑', '立秋', '处暑', '白露', '秋分',
  '寒露', '霜降', '立冬', '小雪', '大雪', '冬至'
]

// 每月节气日期信息（20世纪和21世纪）
// 每个元素编码了对应年份两个节气的日期
const solarTermsInfo = [
  // 1900-2100 每月两个节气的日期编码
  0, 21208, 42467, 63836, 85337, 107014, 128867, 150921, 173149, 195551,
  218072, 240693, 263343, 285989, 308563, 331033, 353350, 375494, 397447, 419210,
  440795, 462224, 483532, 504758, 525888, 546915, 567838, 588657, 609367, 629966,
  650450, 670819, 691067, 711192, 731191, 751061, 770800, 790407, 809879, 829214,
  848412, 867473, 886389, 905161, 923787, 942266, 960598, 978783, 996819, 1014706,
  1032444, 1050043, 1067501, 1084820, 1101999, 1119039, 1135940, 1152702, 1169326, 1185812,
  1202161, 1218373, 1234449, 1250389, 1266193, 1281862, 1297396, 1312795, 1328060, 1343191,
  1358190, 1373057, 1387793, 1402400, 1416879, 1431231, 1445457, 1459558, 1473535, 1487388,
  1501118, 1514727, 1528216, 1541586, 1554838, 1567973, 1580992, 1593895, 1606683, 1619357,
  1631918, 1644367, 1656706, 1668935, 1681055, 1693067, 1704971, 1716768, 1728459, 1740045,
  1751527, 1762906, 1774183, 1785360, 1796437, 1807416, 1818298, 1829084, 1839775, 1850373,
  1860879, 1871295, 1881621, 1891859, 1902010, 1912075, 1922055, 1931951, 1941764, 1951495,
  1961145, 1970715, 1980206, 1989619, 1998955, 2008215, 2017399, 2026508, 2035533, 2044474,
  2053332, 2062108, 2070802, 2079415, 2087947, 2096398, 2104769, 2113061, 2121273, 2129406,
  2137461, 2145438, 2153337, 2161159, 2168904, 2176573, 2184165, 2191681, 2199121, 2206485,
  2213774, 2220988, 2228127, 2235191, 2242180, 2249095, 2255935, 2262701, 2269393, 2276011,
  2282555, 2289026, 2295424, 2301749, 2308001, 2314181, 2320289, 2326326, 2332292, 2338187,
  2344012, 2349767, 2355452, 2361068, 2366615, 2372093, 2377503, 2382845, 2388119, 2393325,
  2398464, 2403535, 2408539, 2413476, 2418347, 2423151, 2427889, 2432561, 2437167, 2441708,
  2446183, 2450593, 2454938, 2459218, 2463434, 2467585, 2471672, 2475694, 2479652, 2483546,
  2487376
]

// 中文农历月名
const lunarMonths = [
  '正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'
]

// 中文农历日名
const lunarDays = [
  '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'
]

/**
 * 获取农历年的总天数
 * @param {number} year 农历年
 * @returns {number} 该年总天数
 */
export function lYearDays(year) {
  let sum = 348
  for (let i = 0x8000; i > 0x8; i >>= 1) {
    sum += (lunarInfo[year - 1900] & i) ? 1 : 0
  }
  return sum + leapDays(year)
}

/**
 * 获取农历年闰月的天数
 * @param {number} year 农历年
 * @returns {number} 闰月天数，无闰月返回0
 */
export function leapDays(year) {
  if (leapMonth(year)) {
    return (lunarInfo[year - 1900] & 0x10000) ? 30 : 29
  }
  return 0
}

/**
 * 获取农历年闰月月份
 * @param {number} year 农历年
 * @returns {number} 闰月月份，无闰月返回0
 */
export function leapMonth(year) {
  return lunarInfo[year - 1900] & 0xf
}

/**
 * 获取农历年某月的天数
 * @param {number} year 农历年
 * @param {number} month 农历月（1-12）
 * @returns {number} 该月天数
 */
export function monthDays(year, month) {
  return (lunarInfo[year - 1900] & (0x10000 >> month)) ? 30 : 29
}

/**
 * 获取节气名称
 * @param {number} year 公历年
 * @param {number} month 公历月（1-12）
 * @param {number} day 公历日
 * @returns {string|null} 节气名称，无节气返回null
 */
export function getSolarTerm(year, month, day) {
  const solarTermBase = new Date(1900, 0, 6, 2, 5, 0).getTime()
  const targetDate = new Date(year, month - 1, day).getTime()
  const index = Math.floor((targetDate - solarTermBase) / 86400000)

  // 遍历所有节气信息，查找匹配的节气
  for (let i = 0; i < solarTermsInfo.length; i++) {
    if (index === solarTermsInfo[i]) {
      return solarTerms[i]
    }
  }
  return null
}

/**
 * 将公历日期转换为农历日期对象
 * @param {Date} date 公历日期
 * @returns {object} 农历日期对象 { year, month, day, monthStr, dayStr, isLeap }
 */
export function toLunar(date) {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  // 以 1900年1月31日（农历正月初一）为基准
  const baseDate = new Date(1900, 0, 31)
  let offset = Math.floor((date.getTime() - baseDate.getTime()) / 86400000)

  // 确定农历年
  let lunarYear = 1900
  let daysInYear = 0
  let temp = 0
  for (lunarYear = 1900; lunarYear < 2101 && offset > 0; lunarYear++) {
    temp = lYearDays(lunarYear)
    offset -= temp
  }
  if (offset < 0) {
    offset += temp
    lunarYear--
  }

  // 确定农历月
  const leap = leapMonth(lunarYear)
  let isLeap = false
  let lunarMonth = 1

  for (lunarMonth = 1; lunarMonth < 13 && offset > 0; lunarMonth++) {
    // 闰月
    if (leap > 0 && lunarMonth === (leap + 1) && !isLeap) {
      --lunarMonth
      isLeap = true
      temp = leapDays(lunarYear)
    } else {
      temp = monthDays(lunarYear, lunarMonth)
    }

    // 解除闰月标记
    if (isLeap && lunarMonth === (leap + 1)) {
      isLeap = false
    }

    offset -= temp
  }

  if (offset === 0 && leap > 0 && lunarMonth === leap + 1) {
    if (isLeap) {
      isLeap = false
    } else {
      isLeap = true
      --lunarMonth
    }
  }

  if (offset < 0) {
    offset += temp
    --lunarMonth
  }

  // 确定农历日
  const lunarDay = offset + 1

  return {
    year: lunarYear,
    month: lunarMonth,
    day: lunarDay,
    monthStr: (isLeap ? '闰' : '') + lunarMonths[lunarMonth - 1] + '月',
    dayStr: lunarDays[lunarDay - 1],
    isLeap: isLeap
  }
}
