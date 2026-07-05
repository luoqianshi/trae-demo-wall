import { describe, expect, it } from 'vitest';
import { solveFormula, analyzeCurrentFormula } from './solver';
import { DEFAULT_INGREDIENTS } from '../data/defaults';
import { findTarget } from '../data/targets';

describe('analyzeCurrentFormula', () => {
  it('计算当前配方合计为 1000', () => {
    const target = findTarget('lean-60-120')!;
    const r = analyzeCurrentFormula(DEFAULT_INGREDIENTS, target);
    expect(Math.abs(r.totalKg - 1000)).toBeLessThan(0.5);
  });

  it('默认配方 CP 约为 12.0%', () => {
    const target = findTarget('lean-60-120')!;
    const r = analyzeCurrentFormula(DEFAULT_INGREDIENTS, target);
    expect(r.cpPct).toBeGreaterThan(10);
    expect(r.cpPct).toBeLessThan(15);
  });
});

describe('solver', () => {
  it('推荐总量精确为 1000kg', () => {
    const target = findTarget('lean-60-120')!;
    const result = solveFormula({ ingredients: DEFAULT_INGREDIENTS, target });
    expect(result.status).toBe('ok');
    if (result.status === 'ok') {
      const sum = result.items.reduce((a, b) => a + b.recommendedKg, 0);
      expect(Math.abs(sum - 1000)).toBeLessThan(0.5);
    }
  });

  it('deltaKg = recommendedKg - currentKg', () => {
    const target = findTarget('lean-60-120')!;
    const result = solveFormula({ ingredients: DEFAULT_INGREDIENTS, target });
    if (result.status !== 'ok') throw new Error('expected ok');
    for (const item of result.items) {
      expect(Math.abs(item.recommendedKg - item.currentKg - item.deltaKg)).toBeLessThan(0.01);
    }
  });

  it('推荐 CP 达标', () => {
    const target = findTarget('lean-60-120')!;
    const result = solveFormula({ ingredients: DEFAULT_INGREDIENTS, target });
    if (result.status !== 'ok') throw new Error('expected ok');
    expect(result.cpPct).toBeGreaterThanOrEqual(target.cpMinPct - 1e-3);
  });

  it('推荐 DE 达标', () => {
    const target = findTarget('lean-60-120')!;
    const result = solveFormula({ ingredients: DEFAULT_INGREDIENTS, target });
    if (result.status !== 'ok') throw new Error('expected ok');
    expect(result.deMjKg).toBeGreaterThanOrEqual(target.deMinMjKg - 1e-3);
  });

  it('优先少改：调整方向合理（稻壳减少、玉米增加）', () => {
    const target = findTarget('lean-60-120')!;
    const result = solveFormula({ ingredients: DEFAULT_INGREDIENTS, target });
    if (result.status !== 'ok') throw new Error('expected ok');
    const corn = result.items.find((it) => it.id === 'corn');
    const rice = result.items.find((it) => it.id === 'rice-husk');
    expect(rice!.deltaKg).toBeLessThan(0);
    expect(corn!.deltaKg).toBeGreaterThan(0);
  });

  it('设置最大用量后推荐不超过上限', () => {
    const target = findTarget('lean-60-120')!;
    const ings = DEFAULT_INGREDIENTS.map((i) =>
      i.id === 'rice-husk' ? { ...i, maxKgPerTon: 50 } : i,
    );
    const result = solveFormula({ ingredients: ings, target });
    if (result.status !== 'ok') throw new Error('expected ok');
    const rice = result.items.find((it) => it.id === 'rice-husk');
    expect(rice!.recommendedKg).toBeLessThanOrEqual(50);
  });

  it('包含营养师复核提示', () => {
    const target = findTarget('lean-60-120')!;
    const result = solveFormula({ ingredients: DEFAULT_INGREDIENTS, target });
    if (result.status !== 'ok') throw new Error('expected ok');
    expect(result.warnings.some((w) => w.includes('不能替代营养师'))).toBe(true);
  });

  it('高纤维原料减少时给出提示', () => {
    const target = findTarget('lean-60-120')!;
    const result = solveFormula({ ingredients: DEFAULT_INGREDIENTS, target });
    if (result.status !== 'ok') throw new Error('expected ok');
    const riceItem = result.items.find((it) => it.id === 'rice-husk');
    if (riceItem && riceItem.deltaKg < -1) {
      expect(result.warnings.some((w) => w.includes('稻壳'))).toBe(true);
    }
  });
});
