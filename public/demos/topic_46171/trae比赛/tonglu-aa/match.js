// ============================================================
// match.js — 找搭子社交匹配引擎
// 兼容浏览器（暴露 window.MatchEngine）与 Node 测试（module.exports）
// ============================================================

const MatchEngine = (() => {
  const STORAGE_KEY = 'tonglu_match_plans';

  function daysBetween(d1, d2) {
    const a = new Date(d1);
    const b = new Date(d2);
    const ms = Math.abs(a.getTime() - b.getTime());
    return Math.floor(ms / (1000 * 60 * 60 * 24));
  }

  function normalizeDest(dest) {
    return String(dest || '').trim().toLowerCase();
  }

  function destScore(a, b) {
    const da = normalizeDest(a.dest);
    const db = normalizeDest(b.dest);
    if (!da || !db) return 0;
    if (da === db) return 30;
    if (da.includes(db) || db.includes(da)) return 20;
    return 0;
  }

  function dateScore(a, b) {
    if (!a.date || !b.date) return 0;
    const diff = daysBetween(a.date, b.date);
    if (diff === 0) return 30;
    if (diff <= 3) return 20;
    if (diff <= 7) return 10;
    return 0;
  }

  function budgetScore(a, b) {
    const ba = Number(a.budget) || 0;
    const bb = Number(b.budget) || 0;
    const diff = Math.abs(ba - bb);
    if (diff <= 50) return 20;
    if (diff <= 100) return 10;
    return 0;
  }

  function tagsScore(a, b) {
    const ta = Array.isArray(a.tags) ? a.tags : [];
    const tb = Array.isArray(b.tags) ? b.tags : [];
    const common = ta.filter(t => tb.includes(t));
    return Math.min(common.length * 5, 20);
  }

  function peopleScore(a, b) {
    const total = (Number(a.currentPeople) || 0) + (Number(b.currentPeople) || 0);
    if (total <= 7) return 10;
    if (total <= 9) return 5;
    return 0;
  }

  function calculateScore(a, b) {
    let score = 0;
    score += destScore(a, b);
    score += dateScore(a, b);
    score += budgetScore(a, b);
    score += tagsScore(a, b);
    score += peopleScore(a, b);
    return Math.min(100, Math.max(0, score));
  }

  function loadPlans() {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn('[MatchEngine] loadPlans failed:', e.message);
      return [];
    }
  }

  function savePlans(plans) {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
    } catch (e) {
      console.warn('[MatchEngine] savePlans failed:', e.message);
    }
  }

  function publishPlan(plan) {
    const plans = loadPlans();
    const newPlan = {
      ...plan,
      id: plan.id || 'plan_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      createdAt: Date.now(),
    };
    plans.unshift(newPlan);
    savePlans(plans);
    return newPlan;
  }

  function removePlan(id) {
    const plans = loadPlans().filter(p => p.id !== id);
    savePlans(plans);
  }

  function findMatches(myPlan, plans) {
    return plans
      .filter(p => p.id !== myPlan.id)
      .map(p => ({ plan: p, score: calculateScore(myPlan, p) }))
      .sort((a, b) => b.score - a.score);
  }

  function seedPlans() {
    const defaults = [
      {
        id: 'seed_1',
        publisher: '李同学',
        dest: '吐鲁沟国家森林公园',
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        currentPeople: 2,
        budget: 180,
        tags: ['徒步', '摄影'],
        note: '已有两人，想找两位摄影爱好者同行，费用 AA。',
        createdAt: Date.now() - 86400000,
      },
      {
        id: 'seed_2',
        publisher: '王同学',
        dest: '青海湖',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        currentPeople: 3,
        budget: 350,
        tags: ['自驾', '美食'],
        note: '自驾环湖，还差一位会开车的同学。',
        createdAt: Date.now() - 172800000,
      },
      {
        id: 'seed_3',
        publisher: '赵同学',
        dest: '吐鲁沟国家森林公园',
        date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        currentPeople: 1,
        budget: 220,
        tags: ['穷游', '徒步'],
        note: '计划一日游，想找人一起拼车省路费。',
        createdAt: Date.now() - 43200000,
      },
    ];
    savePlans(defaults);
    return defaults;
  }

  return {
    STORAGE_KEY,
    loadPlans,
    savePlans,
    publishPlan,
    removePlan,
    calculateScore,
    findMatches,
    seedPlans,
  };
})();

if (typeof window !== 'undefined') {
  window.MatchEngine = MatchEngine;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MatchEngine;
}
