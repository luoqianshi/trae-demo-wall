import { describe, expect, it } from 'vitest';
import {
  exportIngredientsCSV,
  exportResultCSV,
  parseIngredientsCSV,
  parseJSON,
  exportJSON,
} from './io';
import type { AppState, Ingredient } from '../types/domain';

const sample: Ingredient[] = [
  {
    id: 'corn', name: '玉米', category: 'energy',
    currentKgPerTon: 620, moisturePct: 14, crudeProteinPct: 8.7,
    digestibleEnergyMjKg: 14.3, priceCnyPerTon: 2400, enabled: true,
  },
  {
    id: 'soybean-meal', name: '豆粕', category: 'protein',
    currentKgPerTon: 200, moisturePct: 13, crudeProteinPct: 43,
    digestibleEnergyMjKg: 13.8, priceCnyPerTon: 3800, maxKgPerTon: 280, enabled: true,
  },
];

describe('io', () => {
  it('CSV 导出含 currentKgPerTon 并可解析回原对象', () => {
    const csv = exportIngredientsCSV(sample);
    expect(csv).toContain('currentKgPerTon');
    const parsed = parseIngredientsCSV(csv);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].currentKgPerTon).toBe(620);
    expect(parsed[1].currentKgPerTon).toBe(200);
  });

  it('JSON 往返保留 currentKgPerTon', () => {
    const state: AppState = {
      pigType: 'lean', phaseId: 'lean-60-120', showHeavyPhases: false, ingredients: sample,
    };
    const text = exportJSON(state);
    expect(text).toContain('currentKgPerTon');
    const restored = parseJSON(text);
    expect(restored.ingredients[0].currentKgPerTon).toBe(620);
  });

  it('结果 CSV 含 currentKg/recommendedKg/deltaKg', () => {
    const csv = exportResultCSV([
      { id: 'a', name: '玉米', currentKg: 620, recommendedKg: 650, deltaKg: 30, ratio: 65, costCny: 1560, cpContribution: 5.66, deContribution: 9.30 },
    ]);
    expect(csv.split('\n')[0]).toBe('id,name,currentKg,recommendedKg,deltaKg,ratioPct,costCny');
    const bodyLine = csv.split('\n')[1];
    expect(bodyLine).toContain('620');
    expect(bodyLine).toContain('650');
    expect(bodyLine).toContain('30');
  });
});
