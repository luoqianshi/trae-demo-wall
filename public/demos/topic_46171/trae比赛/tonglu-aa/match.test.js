// match.test.js — 找搭子匹配引擎 TDD 测试
// 运行：node match.test.js
const assert = require('assert');
const MatchEngine = require('./match.js');

function plan(overrides = {}) {
  return {
    id: overrides.id || 'p1',
    publisher: overrides.publisher || '张同学',
    dest: overrides.dest !== undefined ? overrides.dest : '吐鲁沟国家森林公园',
    date: overrides.date !== undefined ? overrides.date : '2026-06-25',
    currentPeople: overrides.currentPeople !== undefined ? overrides.currentPeople : 2,
    budget: overrides.budget !== undefined ? overrides.budget : 200,
    tags: overrides.tags !== undefined ? overrides.tags : ['徒步', '摄影'],
    note: overrides.note || '',
    createdAt: overrides.createdAt || Date.now(),
  };
}

// 1. identical plans should score 100
(function () {
  const a = plan({ id: 'a' });
  const b = plan({ id: 'b' });
  const score = MatchEngine.calculateScore(a, b);
  assert.strictEqual(score, 100, `identical plans should score 100, got ${score}`);
})();

// 2. different destination should remove destination points
(function () {
  const a = plan({ id: 'a', dest: '吐鲁沟国家森林公园' });
  const b = plan({ id: 'b', dest: '青海湖' });
  const score = MatchEngine.calculateScore(a, b);
  assert.ok(score <= 70, `different dest should score <= 70, got ${score}`);
})();

// 3. date within 3 days should give partial date score
(function () {
  const a = plan({ id: 'a', date: '2026-06-25' });
  const b = plan({ id: 'b', date: '2026-06-27' });
  const score = MatchEngine.calculateScore(a, b);
  assert.ok(score >= 80 && score < 100, `date within 3 days should score 80-99, got ${score}`);
})();

// 4. date more than 7 days apart should give no date points
(function () {
  const a = plan({ id: 'a', date: '2026-06-25' });
  const b = plan({ id: 'b', date: '2026-07-10' });
  const score = MatchEngine.calculateScore(a, b);
  assert.ok(score <= 70, `date >7 days apart should score <= 70, got ${score}`);
})();

// 5. budget difference <= 50 should give full budget points
(function () {
  const a = plan({ id: 'a', budget: 200 });
  const b = plan({ id: 'b', budget: 240 });
  const score = MatchEngine.calculateScore(a, b);
  assert.ok(score >= 90, `budget diff <= 50 should score >= 90, got ${score}`);
})();

// 6. common tags should increase score by 5 points each
(function () {
  // set large groups so peopleScore is 0, isolating tag contribution
  const a = plan({ id: 'a', tags: ['摄影'], currentPeople: 6 });
  const b = plan({ id: 'b', tags: ['摄影', '美食'], currentPeople: 6 });
  const score = MatchEngine.calculateScore(a, b);
  assert.ok(score >= 85 && score <= 90, `one common tag should add ~5 points, got ${score}`);
})();

// 7. findMatches should sort by descending score
(function () {
  const my = plan({ id: 'me', dest: '吐鲁沟国家森林公园', date: '2026-06-25', budget: 200, tags: ['徒步'] });
  const p1 = plan({ id: 'p1', dest: '吐鲁沟国家森林公园', date: '2026-06-25', budget: 200, tags: ['徒步'] });
  const p2 = plan({ id: 'p2', dest: '青海湖', date: '2026-07-10', budget: 500, tags: ['自驾'] });
  const matches = MatchEngine.findMatches(my, [p1, p2]);
  assert.strictEqual(matches.length, 2, 'should return two matches');
  assert.strictEqual(matches[0].plan.id, 'p1', 'best match should be p1');
  assert.ok(matches[0].score > matches[1].score, 'scores should be sorted descending');
})();

console.log('All MatchEngine tests passed.');
