/**
 * 艾宾浩斯抗遗忘曲线核心算法
 *
 * 复习节点(天数):学新当日为第 0 天,之后按以下天数推送复习
 * 1, 2, 3, 4, 5, 6, 7, 9, 11, 13, 15, 17, 19, 21
 * 共 14 次复习,覆盖 21 天
 * 每次复习:跟着读 3 遍即可
 */

// 复习间隔天数表(索引从 1 开始,表示第几次复习)
const REVIEW_INTERVALS = [1, 2, 3, 4, 5, 6, 7, 9, 11, 13, 15, 17, 19, 21];

/**
 * 根据学新日期计算所有复习日期
 * @param {string|Date} learnDate 学新日期(第 0 天)
 * @returns {Array<{round:number, day:number, date:string}>} 复习计划
 */
function buildReviewPlan(learnDate) {
  const base = new Date(learnDate);
  base.setHours(0, 0, 0, 0);
  return REVIEW_INTERVALS.map((day, idx) => {
    const d = new Date(base);
    d.setDate(d.getDate() + day);
    return {
      round: idx + 1,            // 第几轮复习
      day,                        // 第几天复习
      date: toDateStr(d),         // 复习日期 YYYY-MM-DD
    };
  });
}

/**
 * 获取今天日期字符串(当地时区,只精确到日)
 */
function todayStr() {
  return toDateStr(new Date());
}

function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * 计算某条已学内容今天是否需要复习
 * @param {string|Date} learnDate 学新日期
 * @param {Array<number>} completedRounds 已完成的复习轮次列表
 * @returns {{needReview:boolean, round:number|null, totalRounds:number}}
 */
function getTodayReview(learnDate, completedRounds = []) {
  const plan = buildReviewPlan(learnDate);
  const today = todayStr();
  const total = plan.length;

  // 找到今天日期对应的复习轮次
  const todayPlan = plan.find(p => p.date === today);

  if (!todayPlan) {
    // 今天不在复习计划内
    return { needReview: false, round: null, totalRounds: total };
  }

  // 该轮次是否已完成
  if (completedRounds.includes(todayPlan.round)) {
    return { needReview: false, round: todayPlan.round, totalRounds: total };
  }

  return { needReview: true, round: todayPlan.round, totalRounds: total };
}

/**
 * 根据学新频率(每周 2 次或 4 次)生成接下来 N 周的学新日期
 * 每周 2 次:周二、周五
 * 每周 4 次:周一、周二、周四、周五
 * @param {number} timesPerWeek 2 或 4
 * @param {number} weeks 前几周
 * @returns {Array<string>} 日期字符串列表
 */
function generateLearnDates(timesPerWeek, weeks = 12) {
  const weekDays = timesPerWeek === 4 ? [1, 2, 4, 5] : [2, 5];
  const dates = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 从本周开始
  const start = new Date(today);
  // 回到本周周日
  start.setDate(start.getDate() - start.getDay());

  for (let w = 0; w < weeks; w++) {
    for (const wd of weekDays) {
      const d = new Date(start);
      d.setDate(d.getDate() + w * 7 + wd);
      // 只保留今天及以后
      if (d >= today) {
        dates.push(toDateStr(d));
      }
    }
  }
  return dates;
}

/**
 * 检查今天是否是学新日
 */
function isLearnDay(timesPerWeek) {
  const wd = new Date().getDay(); // 0 周日 - 6 周六
  const weekDays = timesPerWeek === 4 ? [1, 2, 4, 5] : [2, 5];
  return weekDays.includes(wd);
}

module.exports = {
  REVIEW_INTERVALS,
  buildReviewPlan,
  todayStr,
  toDateStr,
  getTodayReview,
  generateLearnDates,
  isLearnDay,
};
