import { solve, equalTo, greaterEq, lessEq } from 'yalps';
import type {
  ConstraintStatus,
  CurrentAnalysis,
  FormulaResult,
  FormulaResultItem,
  InfeasibleReason,
  Ingredient,
  SolveInput,
  SolveResult,
  TargetProfile,
} from '../types/domain';

const TOTAL_KG = 1000;
const ADJ_WEIGHT = 100;
const COST_WEIGHT = 1;

export function analyzeCurrentFormula(
  ingredients: Ingredient[],
  target: TargetProfile,
): CurrentAnalysis {
  const enabled = ingredients.filter((i) => i.enabled);
  let totalKg = 0;
  let totalCp = 0;
  let totalDe = 0;
  let totalMoisture = 0;
  let totalCost = 0;

  for (const ing of enabled) {
    const kg = ing.currentKgPerTon;
    totalKg += kg;
    totalCp += (kg * ing.crudeProteinPct) / TOTAL_KG;
    totalDe += (kg * ing.digestibleEnergyMjKg) / TOTAL_KG;
    totalMoisture += (kg * ing.moisturePct) / TOTAL_KG;
    totalCost += (kg / TOTAL_KG) * ing.priceCnyPerTon;
  }

  return {
    totalKg,
    cpPct: totalCp,
    deMjKg: totalDe,
    moisturePct: totalMoisture,
    costCnyPerTon: totalCost,
    gaps: {
      cp: totalCp - target.cpMinPct,
      de: totalDe - target.deMinMjKg,
      moisture:
        target.moistureMaxPct !== undefined
          ? totalMoisture - target.moistureMaxPct
          : undefined,
    },
  };
}

function precheck(input: SolveInput): InfeasibleReason[] {
  const reasons: InfeasibleReason[] = [];
  const enabled = input.ingredients.filter((i) => i.enabled);
  const { target } = input;

  if (enabled.length < 2) {
    reasons.push({
      code: 'insufficientIngredients',
      message: '启用的原料不足 2 种，至少需要 2 种原料才能求解',
    });
  }

  const missing: string[] = [];
  const offendingIds: string[] = [];
  for (const ing of enabled) {
    if (!Number.isFinite(ing.priceCnyPerTon) || ing.priceCnyPerTon <= 0) {
      missing.push(`${ing.name}：价格无效`);
      offendingIds.push(ing.id);
    }
    if (!Number.isFinite(ing.crudeProteinPct) || ing.crudeProteinPct < 0) {
      missing.push(`${ing.name}：粗蛋白无效`);
      offendingIds.push(ing.id);
    }
    if (!Number.isFinite(ing.digestibleEnergyMjKg) || ing.digestibleEnergyMjKg < 0) {
      missing.push(`${ing.name}：DE 无效`);
      offendingIds.push(ing.id);
    }
  }
  if (missing.length > 0) {
    reasons.push({
      code: 'missingData',
      message: '以下原料数据缺失或无效：' + missing.join('；'),
      offendingIds: Array.from(new Set(offendingIds)),
    });
  }

  const maxCp = Math.max(0, ...enabled.map((i) => i.crudeProteinPct));
  const maxDe = Math.max(0, ...enabled.map((i) => i.digestibleEnergyMjKg));
  if (enabled.length > 0 && maxCp < target.cpMinPct) {
    reasons.push({
      code: 'protein',
      message: `所有原料的最高 CP 为 ${maxCp.toFixed(1)}%，低于目标 ${target.cpMinPct.toFixed(1)}%`,
    });
  }
  if (enabled.length > 0 && maxDe < target.deMinMjKg) {
    reasons.push({
      code: 'energy',
      message: `所有原料的最高 DE 为 ${maxDe.toFixed(2)} MJ/kg，低于目标 ${target.deMinMjKg.toFixed(2)} MJ/kg`,
    });
  }

  for (const ing of enabled) {
    if (
      ing.minKgPerTon !== undefined &&
      ing.maxKgPerTon !== undefined &&
      ing.minKgPerTon > ing.maxKgPerTon
    ) {
      reasons.push({
        code: 'bounds',
        message: `${ing.name} 的推荐最小用量 (${ing.minKgPerTon}) 大于推荐最大用量 (${ing.maxKgPerTon})`,
        offendingIds: [ing.id],
      });
    }
  }

  const minSum = enabled.reduce(
    (a, b) => a + (b.minKgPerTon ?? 0),
    0,
  );
  const maxSum = enabled.reduce(
    (a, b) => a + (b.maxKgPerTon ?? TOTAL_KG),
    0,
  );
  if (minSum > TOTAL_KG + 0.5) {
    reasons.push({
      code: 'bounds',
      message: `所有原料推荐最小用量之和 ${minSum.toFixed(1)} kg 超过 1000 kg`,
    });
  }
  if (maxSum < TOTAL_KG - 0.5 && enabled.length > 0) {
    reasons.push({
      code: 'bounds',
      message: `所有原料推荐最大用量之和 ${maxSum.toFixed(1)} kg 不足 1000 kg`,
    });
  }

  return reasons;
}

interface Model {
  enabled: Ingredient[];
  constraints: Map<string, ReturnType<typeof equalTo>>;
  variables: Map<string, Map<string, number>>;
}

function buildModel(input: SolveInput): Model {
  const enabled = input.ingredients.filter((i) => i.enabled);
  const target = input.target;

  const constraints = new Map<string, ReturnType<typeof equalTo>>();
  const variables = new Map<string, Map<string, number>>();

  constraints.set('sum', equalTo(TOTAL_KG));
  constraints.set('cp', greaterEq(target.cpMinPct * TOTAL_KG));
  constraints.set('de', greaterEq(target.deMinMjKg * TOTAL_KG));
  if (target.moistureMaxPct !== undefined) {
    constraints.set('moisture', lessEq(target.moistureMaxPct * TOTAL_KG));
  }
  constraints.set('objective', greaterEq(0));

  for (const ing of enabled) {
    if (ing.minKgPerTon !== undefined && ing.minKgPerTon > 0) {
      constraints.set('min_' + ing.id, greaterEq(ing.minKgPerTon));
    }
    if (ing.maxKgPerTon !== undefined && ing.maxKgPerTon < TOTAL_KG) {
      constraints.set('max_' + ing.id, lessEq(ing.maxKgPerTon));
    }
    constraints.set('bal_' + ing.id, equalTo(ing.currentKgPerTon));
  }

  for (const ing of enabled) {
    const coeffs = new Map<string, number>();
    coeffs.set('sum', 1);
    coeffs.set('cp', ing.crudeProteinPct);
    coeffs.set('de', ing.digestibleEnergyMjKg);
    if (target.moistureMaxPct !== undefined) {
      coeffs.set('moisture', ing.moisturePct);
    }
    coeffs.set('bal_' + ing.id, 1);
    coeffs.set('objective', (ing.priceCnyPerTon / TOTAL_KG) * COST_WEIGHT);
    if (ing.minKgPerTon !== undefined && ing.minKgPerTon > 0) {
      coeffs.set('min_' + ing.id, 1);
    }
    if (ing.maxKgPerTon !== undefined && ing.maxKgPerTon < TOTAL_KG) {
      coeffs.set('max_' + ing.id, 1);
    }
    variables.set('rec_' + ing.id, coeffs);
  }

  for (const ing of enabled) {
    const coeffs = new Map<string, number>();
    coeffs.set('bal_' + ing.id, -1);
    coeffs.set('objective', ADJ_WEIGHT);
    variables.set('inc_' + ing.id, coeffs);
  }

  for (const ing of enabled) {
    const coeffs = new Map<string, number>();
    coeffs.set('bal_' + ing.id, 1);
    coeffs.set('objective', ADJ_WEIGHT);
    variables.set('dec_' + ing.id, coeffs);
  }

  return { enabled, constraints, variables };
}

function buildWarnings(input: SolveInput, result: FormulaResult): string[] {
  const warnings: string[] = [];
  const { target } = input;

  if (target.cpMaxPct !== undefined && result.cpPct > target.cpMaxPct + 1.5) {
    warnings.push(
      `粗蛋白 (${result.cpPct.toFixed(1)}%) 超出目标上限 (${target.cpMaxPct.toFixed(1)}%) 较多，建议下调蛋白源。`,
    );
  }

  const hasProtein = input.ingredients.some(
    (i) => i.enabled && (i.category === 'protein' || i.category === 'amino'),
  );
  if (!hasProtein) {
    warnings.push('未启用任何蛋白源或氨基酸，氨基酸平衡未校，请人工复核。');
  }

  const hasMineral = input.ingredients.some((i) => i.enabled && i.category === 'mineral');
  if (!hasMineral) {
    warnings.push('未启用任何矿物质原料，钙磷钠未校，请人工复核。');
  }

  const hasPremix = input.ingredients.some((i) => i.enabled && i.category === 'premix');
  if (!hasPremix) {
    warnings.push('未启用预混料，维生素与微量元素未校，请人工复核。');
  }

  if (target.weightRangeKg[0] >= 120) {
    warnings.push('>120kg 阶段料肉比风险显著，建议结合本场实测调整。');
  }

  if (target.sourceStatus === 'deprecated') {
    warnings.push(`当前阶段数据源已废止（${target.source}），建议参考 GB/T 39235-2020 复核。`);
  } else if (target.sourceStatus === 'derived' || target.sourceStatus === 'reference') {
    warnings.push(`当前阶段无现行国标，源为 ${target.source}，仅作参考。`);
  }

  const highFiber = input.ingredients.filter(
    (i) => i.enabled && i.category === 'fiber' && i.currentKgPerTon > 0,
  );
  for (const f of highFiber) {
    const item = result.items.find((it) => it.id === f.id);
    if (item && item.deltaKg < -1) {
      warnings.push(
        `当前 ${f.name} 用量 ${f.currentKgPerTon.toFixed(0)} kg/吨，推荐减少 ${Math.abs(item.deltaKg).toFixed(0)} kg/吨。低能/高纤维原料占比可能过高。`,
      );
    }
  }

  warnings.push('本结果为反推调整估算，不能替代营养师复核。');

  return warnings;
}

function finalize(input: SolveInput, recKgById: Record<string, number>): FormulaResult {
  const enabled = input.ingredients.filter((i) => i.enabled);
  const { target } = input;

  let totalCost = 0;
  let totalCp = 0;
  let totalDe = 0;
  let totalMoisture = 0;

  const items: FormulaResultItem[] = enabled.map((i) => {
    const recKg = recKgById['rec_' + i.id] ?? 0;
    const curKg = i.currentKgPerTon;
    const costCny = (recKg / TOTAL_KG) * i.priceCnyPerTon;
    const cpContribution = (recKg * i.crudeProteinPct) / TOTAL_KG;
    const deContribution = (recKg * i.digestibleEnergyMjKg) / TOTAL_KG;
    totalCost += costCny;
    totalCp += cpContribution;
    totalDe += deContribution;
    totalMoisture += (recKg * i.moisturePct) / TOTAL_KG;
    return {
      id: i.id,
      name: i.name,
      currentKg: curKg,
      recommendedKg: recKg,
      deltaKg: recKg - curKg,
      ratio: (recKg / TOTAL_KG) * 100,
      costCny,
      cpContribution,
      deContribution,
    };
  });

  const currentAnalysis = analyzeCurrentFormula(input.ingredients, target);

  const cpStatus: ConstraintStatus = totalCp + 1e-6 >= target.cpMinPct ? 'ok' : 'low';
  const deStatus: ConstraintStatus = totalDe + 1e-6 >= target.deMinMjKg ? 'ok' : 'low';
  const moistureStatus: ConstraintStatus =
    target.moistureMaxPct === undefined
      ? 'ok'
      : totalMoisture - 1e-6 <= target.moistureMaxPct
        ? 'ok'
        : 'high';

  const result: FormulaResult = {
    status: 'ok',
    items,
    totalKg: TOTAL_KG,
    costCnyPerTon: totalCost,
    cpPct: totalCp,
    deMjKg: totalDe,
    moisturePct: totalMoisture,
    constraintStatus: { cp: cpStatus, de: deStatus, moisture: moistureStatus },
    currentAnalysis,
    warnings: [],
  };
  result.warnings = buildWarnings(input, result);
  return result;
}

export function solveFormula(input: SolveInput): SolveResult {
  const reasons = precheck(input);
  if (reasons.length > 0) {
    return { status: 'infeasible', reasons };
  }

  const { enabled, constraints, variables } = buildModel(input);

  const solution = solve(
    {
      direction: 'minimize',
      objective: 'objective',
      constraints,
      variables,
    },
    { includeZeroVariables: true },
  );

  if (solution.status !== 'optimal') {
    return {
      status: 'infeasible',
      reasons: [
        {
          code: 'solver',
          message: `求解器返回 ${solution.status}，请检查当前用量与推荐范围是否冲突`,
        },
      ],
    };
  }

  const recKgById: Record<string, number> = {};
  for (const ing of enabled) recKgById['rec_' + ing.id] = 0;
  for (const [name, value] of solution.variables) {
    if (name.startsWith('rec_')) recKgById[name] = value;
  }

  return finalize(input, recKgById);
}

export function formatKg(kg: number): string {
  return kg.toFixed(1);
}

export function formatPct(pct: number): string {
  return pct.toFixed(1) + '%';
}

export function formatMoney(cny: number): string {
  return '¥' + cny.toFixed(2);
}

export function formatMj(mj: number): string {
  return mj.toFixed(2) + ' MJ/kg';
}
