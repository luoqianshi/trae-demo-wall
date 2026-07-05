import type { Ingredient, AppState, FormulaResultItem } from '../types/domain';
import { DEFAULT_INGREDIENTS } from '../data/defaults';

export function exportJSON(state: AppState): string {
  return JSON.stringify(
    {
      version: 1,
      pigType: state.pigType,
      phaseId: state.phaseId,
      showHeavyPhases: state.showHeavyPhases,
      ingredients: state.ingredients,
    },
    null,
    2,
  );
}

export function parseJSON(text: string): AppState {
  const obj = JSON.parse(text) as Partial<AppState>;
  if (!obj.pigType || !obj.phaseId || !Array.isArray(obj.ingredients)) {
    throw new Error('JSON 格式不正确：缺少 pigType / phaseId / ingredients');
  }
  return {
    pigType: obj.pigType,
    phaseId: obj.phaseId,
    showHeavyPhases: obj.showHeavyPhases ?? false,
    ingredients: obj.ingredients as Ingredient[],
  };
}

const CSV_HEADER = [
  'id',
  'name',
  'category',
  'currentKgPerTon',
  'moisturePct',
  'crudeProteinPct',
  'digestibleEnergyMjKg',
  'priceCnyPerTon',
  'minKgPerTon',
  'maxKgPerTon',
  'enabled',
];

function escapeCsv(v: string): string {
  if (/[",\n]/.test(v)) {
    return '"' + v.replace(/"/g, '""') + '"';
  }
  return v;
}

export function exportIngredientsCSV(ings: Ingredient[]): string {
  const rows: string[] = [CSV_HEADER.join(',')];
  for (const i of ings) {
    rows.push(
      [
        i.id,
        i.name,
        i.category,
        i.currentKgPerTon,
        i.moisturePct,
        i.crudeProteinPct,
        i.digestibleEnergyMjKg,
        i.priceCnyPerTon,
        i.minKgPerTon ?? '',
        i.maxKgPerTon ?? '',
        i.enabled ? 'true' : 'false',
      ]
        .map((v) => escapeCsv(String(v)))
        .join(','),
    );
  }
  return rows.join('\n');
}

export function exportResultCSV(items: FormulaResultItem[]): string {
  const header = ['id', 'name', 'currentKg', 'recommendedKg', 'deltaKg', 'ratioPct', 'costCny'];
  const rows = [header.join(',')];
  for (const it of items) {
    rows.push(
      [it.id, it.name, it.currentKg.toFixed(2), it.recommendedKg.toFixed(2), it.deltaKg.toFixed(2), it.ratio.toFixed(2), it.costCny.toFixed(2)]
        .map((v) => escapeCsv(String(v)))
        .join(','),
    );
  }
  return rows.join('\n');
}

export function parseIngredientsCSV(text: string): Partial<Ingredient>[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) return [];

  const firstCols = splitCsvLine(lines[0]);
  const hasHeader = firstCols[0] === 'id' || firstCols[0] === 'name';
  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines.map((line) => {
    const cols = splitCsvLine(line);
    const get = (idx: number) => cols[idx] ?? '';
    return {
      id: get(0).trim() || undefined,
      name: get(1).trim() || undefined,
      category: (get(2).trim() || 'other') as Ingredient['category'],
      currentKgPerTon: toNum(get(3)),
      moisturePct: toNum(get(4)),
      crudeProteinPct: toNum(get(5)),
      digestibleEnergyMjKg: toNum(get(6)),
      priceCnyPerTon: toNum(get(7)),
      minKgPerTon: toOptionalNum(get(8)),
      maxKgPerTon: toOptionalNum(get(9)),
      enabled: get(10).trim() !== 'false',
    } as Partial<Ingredient>;
  });
}

function toNum(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function toOptionalNum(v: string): number | undefined {
  const trimmed = v.trim();
  if (trimmed === '') return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : undefined;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuote) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuote = false;
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') inQuote = true;
      else if (ch === ',') {
        out.push(cur);
        cur = '';
      } else cur += ch;
    }
  }
  out.push(cur);
  return out;
}

export function downloadFile(filename: string, content: string, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function loadDefaultIngredients(): Ingredient[] {
  return DEFAULT_INGREDIENTS.map((i) => ({ ...i }));
}
