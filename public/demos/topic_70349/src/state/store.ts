import { create } from 'zustand';
import type { AppState, Ingredient, PigType, SolveResult } from '../types/domain';
import { DEFAULT_INGREDIENTS } from '../data/defaults';
import { findTarget } from '../data/targets';
import { solveFormula } from '../lib/solver';

interface Store extends AppState {
  result: SolveResult | null;
  setPigType: (t: PigType) => void;
  setPhase: (id: string) => void;
  toggleShowHeavy: () => void;
  setIngredients: (ings: Ingredient[]) => void;
  updateIngredient: (id: string, patch: Partial<Ingredient>) => void;
  addIngredient: () => void;
  removeIngredient: (id: string) => void;
  loadDefaults: () => void;
  normalizeToOneTon: () => void;
  compute: () => void;
}

const initialPigType: PigType = 'lean';

function defaultPhase(pigType: PigType): string {
  if (pigType === 'fat') return 'fat-30-60';
  if (pigType === 'meatFat') return 'meatFat-30-60';
  return 'lean-30-60';
}

export const useStore = create<Store>((set, get) => ({
  pigType: initialPigType,
  phaseId: defaultPhase(initialPigType),
  showHeavyPhases: false,
  ingredients: DEFAULT_INGREDIENTS.map((i) => ({ ...i })),
  result: null,

  setPigType: (t) => set({ pigType: t, phaseId: defaultPhase(t), result: null }),
  setPhase: (id) => set({ phaseId: id, result: null }),
  toggleShowHeavy: () => set((s) => ({ showHeavyPhases: !s.showHeavyPhases })),

  setIngredients: (ings) => set({ ingredients: ings, result: null }),

  updateIngredient: (id, patch) =>
    set((s) => ({
      ingredients: s.ingredients.map((i) => (i.id === id ? { ...i, ...patch } : i)),
      result: null,
    })),

  addIngredient: () =>
    set((s) => ({
      ingredients: [
        {
          id: 'new-' + Date.now().toString(36),
          name: '新原料',
          category: 'energy',
          currentKgPerTon: 0,
          moisturePct: 0,
          crudeProteinPct: 0,
          digestibleEnergyMjKg: 0,
          priceCnyPerTon: 0,
          enabled: true,
        },
        ...s.ingredients,
      ],
      result: null,
    })),

  removeIngredient: (id) =>
    set((s) => ({
      ingredients: s.ingredients.filter((i) => i.id !== id),
      result: null,
    })),

  loadDefaults: () =>
    set({
      ingredients: DEFAULT_INGREDIENTS.map((i) => ({ ...i })),
      result: null,
    }),

  normalizeToOneTon: () =>
    set((s) => {
      const enabled = s.ingredients.filter((i) => i.enabled);
      const total = enabled.reduce((a, b) => a + b.currentKgPerTon, 0);
      if (total <= 0 || Math.abs(total - 1000) < 0.5) return s;

      const factor = 1000 / total;
      const updated = s.ingredients.map((i) => {
        if (!i.enabled) return i;
        const newCur = i.currentKgPerTon * factor;
        return { ...i, currentKgPerTon: newCur };
      });
      return { ingredients: updated, result: null };
    }),

  compute: () => {
    const s = get();
    const target = findTarget(s.phaseId);
    if (!target) {
      set({
        result: {
          status: 'infeasible',
          reasons: [{ code: 'solver', message: '找不到阶段定义' }],
        },
      });
      return;
    }

    const enabled = s.ingredients.filter((i) => i.enabled);
    const curTotal = enabled.reduce((a, b) => a + b.currentKgPerTon, 0);
    if (Math.abs(curTotal - 1000) > 0.5) {
      set({
        result: {
          status: 'infeasible',
          reasons: [
            {
              code: 'sum',
              message: `当前配方合计 ${curTotal.toFixed(1)} kg/吨，不等于 1000 kg/吨。请调整当前用量或点击"折算到 1000 kg"。`,
            },
          ],
        },
      });
      return;
    }

    const result = solveFormula({ ingredients: s.ingredients, target });
    set({ result });
  },
}));
