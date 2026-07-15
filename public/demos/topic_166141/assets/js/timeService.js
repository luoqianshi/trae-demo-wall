// timeService.js - 统一时间服务
// 提供跨模块的同一套时间判断基准,避免各模块因时区或日期切片不同导致互相矛盾
// 依赖 Shichen.js (十二时辰换算)

const TimeService = (() => {
  // 紫禁城标准锚点
  const IMPERIAL_ANCHOR = {
    timezone: 'Asia/Shanghai',
    time: '04:00',
    hour: 4,
    minute: 0,
    label: '寅正初刻',
    shichen: '寅'
  };

  // 锚点常量
  const ANCHOR_TZ = IMPERIAL_ANCHOR.timezone;
  const ANCHOR_H = IMPERIAL_ANCHOR.hour;
  const ANCHOR_M = IMPERIAL_ANCHOR.minute;

  /**
   * 当前真实瞬间
   */
  function now() {
    return new Date();
  }

  /**
   * 在指定时区获取一个 Date 的本地时间分量
   * @returns { year, month, day, hour, minute, second, weekday }
   */
  function partsInTZ(date, tz) {
    const fmt = new Intl.DateTimeFormat('en-US', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false, weekday: 'short', timeZone: tz || undefined
    });
    const parts = fmt.formatToParts(date);
    const out = { year: 0, month: 0, day: 0, hour: 0, minute: 0, second: 0, weekday: '' };
    parts.forEach(p => {
      if (p.type === 'year') out.year = parseInt(p.value, 10);
      else if (p.type === 'month') out.month = parseInt(p.value, 10);
      else if (p.type === 'day') out.day = parseInt(p.value, 10);
      else if (p.type === 'hour') out.hour = parseInt(p.value === '24' ? '0' : p.value, 10);
      else if (p.type === 'minute') out.minute = parseInt(p.value, 10);
      else if (p.type === 'second') out.second = parseInt(p.value, 10);
      else if (p.type === 'weekday') out.weekday = p.value;
    });
    return out;
  }

  /**
   * 在指定时区获取时分
   */
  function timeInTZ(date, tz) {
    const p = partsInTZ(date, tz);
    return { hour: p.hour, minute: p.minute };
  }

  /**
   * 在指定时区获取日期 YYYY-MM-DD
   */
  function dateKeyInTZ(date, tz) {
    const p = partsInTZ(date, tz);
    return p.year + '-' + String(p.month).padStart(2, '0') + '-' + String(p.day).padStart(2, '0');
  }

  /**
   * 在指定时区获取十二时辰
   */
  function shichenInTZ(date, tz) {
    return Shichen.getShichen(date, tz);
  }

  /**
   * 给定一个 Date,获取对应的紫禁城锚点信息
   */
  function getImperialAnchorForDate(date) {
    return Object.assign({}, IMPERIAL_ANCHOR, {
      refDate: date
    });
  }

  /**
   * 把紫禁城锚点(04:00 Asia/Shanghai)映射到目标时区的本地时间
   * 算法:取"date 在 Asia/Shanghai 时区下"那一天的 04:00 对应的 UTC 瞬间,
   *      再用目标时区格式化该 UTC 瞬间,得到目标时区的本地时间
   * 关键:Asia/Shanghai 是固定 UTC+8(无夏令时),所以上海 04:00 = UTC 20:00 (前一天)
   * @param {Date} date - 真实日期(用作"今天"参考)
   * @param {string} targetTZ - 目标时区
   * @returns { hour, minute, weekday, shichen, dateKey }
   */
  function mapImperialAnchorToTZ(date, targetTZ) {
    if (!targetTZ) targetTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // date 在上海时区下的"那一天"
    const shP = partsInTZ(date, 'Asia/Shanghai');
    // 上海那一日 04:00 对应的 UTC 时刻(Asia/Shanghai 固定 UTC+8,无夏令时)
    const shanghaiUTC = Date.UTC(shP.year, shP.month - 1, shP.day, ANCHOR_H, ANCHOR_M, 0) - 8 * 60 * 60 * 1000;
    // 用目标时区格式化该 UTC 瞬间
    const mapped = partsInTZ(new Date(shanghaiUTC), targetTZ);
    return {
      hour: mapped.hour,
      minute: mapped.minute,
      weekday: mapped.weekday,
      shichen: Shichen.shichenByHour(mapped.hour),
      dateKey: mapped.year + '-' + String(mapped.month).padStart(2, '0') + '-' + String(mapped.day).padStart(2, '0')
    };
  }

  /**
   * 计算用户起床时间与御制锚点的偏差(分钟)
   * 正值表示用户比锚点晚,负值表示比锚点早
   * 关键:锚点可能跨日落在用户城市(纽约 04:00 上海 = 纽约昨天 16:00),
   *      所以必须根据日期差调整,避免把跨日误判为早 9h
   * @param {string} wakeTime - "HH:mm"
   * @param {string} targetTZ - 用户所在时区
   * @param {Date} date - 基准日期
   * @returns { number } 偏差分钟数
   */
  function diffWakeToAnchor(wakeTime, targetTZ, date) {
    if (!date) date = new Date();
    if (!targetTZ) targetTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const [hStr, mStr] = (wakeTime || '07:00').split(':');
    const wakeMin = (parseInt(hStr, 10) || 7) * 60 + (parseInt(mStr, 10) || 0);
    // 锚点在目标时区下的对应时间(包含 dateKey)
    const anchorMapped = mapImperialAnchorToTZ(date, targetTZ);
    const anchorMin = anchorMapped.hour * 60 + anchorMapped.minute;
    // 比较"用户今日"和"锚点日期"
    const tP = partsInTZ(date, targetTZ);
    const todayKey = tP.year + '-' + String(tP.month).padStart(2, '0') + '-' + String(tP.day).padStart(2, '0');
    let dayDiff = 0;
    if (anchorMapped.dateKey < todayKey) dayDiff = 1;  // 锚点是昨天,用户晚一天
    else if (anchorMapped.dateKey > todayKey) dayDiff = -1;  // 锚点是明天,用户早一天
    return (wakeMin + dayDiff * 1440) - anchorMin;
  }

  /**
   * 在指定时区下的 dayKey(YYYY-MM-DD)
   */
  function getDayKey(date, tz) {
    return dateKeyInTZ(date, tz);
  }

  /**
   * 根据起床时间偏差给作息评语
   * @param {number} offsetMinutes
   * @returns { label, tone }
   */
  function commentByOffset(offsetMinutes) {
    const abs = Math.abs(offsetMinutes);
    const late = offsetMinutes > 0;
    // 偏差 < 30min 视为勤政相近
    if (abs <= 30) {
      return { label: '勤政相近', tone: 'good' };
    }
    if (abs <= 90) {
      return late
        ? { label: '稍晚起身,仍可御门听政', tone: 'ok' }
        : { label: '提早起身,勤勉过人', tone: 'good' };
    }
    if (abs <= 240) {
      return late
        ? { label: '午起听政,政务稍迟', tone: 'mid' }
        : { label: '过早起身,龙体为重', tone: 'mid' };
    }
    return late
      ? { label: '夜阑批折,昼夜颠倒', tone: 'bad' }
      : { label: '天未明即起,劳形苦思', tone: 'mid' };
  }

  return {
    IMPERIAL_ANCHOR,
    now,
    partsInTZ,
    timeInTZ,
    dateKeyInTZ,
    shichenInTZ,
    getImperialAnchorForDate,
    mapImperialAnchorToTZ,
    diffWakeToAnchor,
    getDayKey,
    commentByOffset
  };
})();
