import { useRef, useState } from 'react';
import { useStore } from '../state/store';
import {
  exportIngredientsCSV,
  exportJSON,
  parseIngredientsCSV,
  parseJSON,
  downloadFile,
} from '../lib/io';
import type { Ingredient, IngredientCategory } from '../types/domain';

const CATEGORY_LABEL: Record<IngredientCategory, string> = {
  energy: '碳水',
  protein: '蛋白',
  fiber: '碳水',
  mineral: '微量元素',
  amino: '氨基酸',
  premix: '预混',
  other: '其他',
};

const MAIN_CATEGORIES: IngredientCategory[] = ['energy', 'protein', 'fiber'];
const TRACE_CATEGORIES: IngredientCategory[] = ['mineral', 'amino', 'premix', 'other'];

export function IngredientsTable() {
  const ingredients = useStore((s) => s.ingredients);
  const setIngredients = useStore((s) => s.setIngredients);
  const updateIngredient = useStore((s) => s.updateIngredient);
  const addIngredient = useStore((s) => s.addIngredient);
  const removeIngredient = useStore((s) => s.removeIngredient);
  const loadDefaults = useStore((s) => s.loadDefaults);
  const normalizeToOneTon = useStore((s) => s.normalizeToOneTon);
  const compute = useStore((s) => s.compute);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvOpen, setCsvOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [traceOpen, setTraceOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);

  const enabled = ingredients.filter((i) => i.enabled);
  const curTotal = enabled.reduce((a, b) => a + b.currentKgPerTon, 0);
  const totalOff = Math.abs(curTotal - 1000) > 0.5;
  const noneCur = enabled.every((i) => i.currentKgPerTon === 0);

  const proteinSum = enabled
    .filter((i) => i.category === 'protein')
    .reduce((a, b) => a + b.currentKgPerTon, 0);
  const carbSum = enabled
    .filter((i) => i.category === 'energy' || i.category === 'fiber')
    .reduce((a, b) => a + b.currentKgPerTon, 0);

  const mainRows = ingredients.filter((i) => MAIN_CATEGORIES.includes(i.category));
  const traceRows = ingredients.filter((i) => TRACE_CATEGORIES.includes(i.category));

  const onExportJSON = () => {
    const state = useStore.getState();
    downloadFile('feed-formula.json', exportJSON(state), 'application/json;charset=utf-8');
    setActionsOpen(false);
  };

  const onExportCSV = () => {
    downloadFile('ingredients.csv', exportIngredientsCSV(ingredients), 'text/csv;charset=utf-8');
    setActionsOpen(false);
  };

  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      if (file.name.endsWith('.json')) {
        const state = parseJSON(text);
        setIngredients(state.ingredients);
      } else {
        const rows = parseIngredientsCSV(text);
        const merged: Ingredient[] = rows.map((r, i) => ({
          id: r.id ?? 'imp-' + i + '-' + Date.now().toString(36),
          name: r.name ?? '未命名',
          category: (r.category ?? 'other') as IngredientCategory,
          currentKgPerTon: r.currentKgPerTon ?? 0,
          moisturePct: r.moisturePct ?? 0,
          crudeProteinPct: r.crudeProteinPct ?? 0,
          digestibleEnergyMjKg: r.digestibleEnergyMjKg ?? 0,
          priceCnyPerTon: r.priceCnyPerTon ?? 0,
          minKgPerTon: r.minKgPerTon,
          maxKgPerTon: r.maxKgPerTon,
          enabled: r.enabled ?? true,
        }));
        setIngredients(merged);
      }
    } catch (err) {
      alert('导入失败：' + (err as Error).message);
    }
    e.target.value = '';
    setActionsOpen(false);
  };

  const onPasteSubmit = () => {
    try {
      const rows = parseIngredientsCSV(csvText);
      if (rows.length === 0) { alert('未识别到有效行'); return; }
      const merged = rows.map((r, i) => ({
        id: r.id ?? 'paste-' + i + '-' + Date.now().toString(36),
        name: r.name ?? '未命名',
        category: (r.category ?? 'other') as IngredientCategory,
        currentKgPerTon: r.currentKgPerTon ?? 0,
        moisturePct: r.moisturePct ?? 0,
        crudeProteinPct: r.crudeProteinPct ?? 0,
        digestibleEnergyMjKg: r.digestibleEnergyMjKg ?? 0,
        priceCnyPerTon: r.priceCnyPerTon ?? 0,
        minKgPerTon: r.minKgPerTon,
        maxKgPerTon: r.maxKgPerTon,
        enabled: r.enabled ?? true,
      }));
      setIngredients([...ingredients, ...merged]);
      setCsvText('');
      setCsvOpen(false);
    } catch (err) {
      alert('解析失败：' + (err as Error).message);
    }
  };

  const onUpdate = (id: string) => (p: Partial<Ingredient>) => updateIngredient(id, p);
  const onRemove = (id: string) => () => removeIngredient(id);

  return (
    <section className="bg-[color:var(--color-bg-2)] border border-[color:var(--color-rule)] rounded-lg p-4 sm:p-5">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold">原料表</h2>
          <button type="button" onClick={addIngredient}
            className="h-9 px-3 rounded text-sm font-medium bg-[color:var(--color-accent)] text-white hover:opacity-90">+ 新增原料</button>
        </div>
        <p className="text-sm text-[color:var(--color-muted)] w-full sm:w-auto">
          录入你手上的原料 · 调整蛋白和碳水比例
        </p>
      </div>

      <div className="mb-4">
        <button
          type="button"
          onClick={compute}
          disabled={noneCur}
          className="h-12 sm:h-11 px-5 rounded text-base font-medium bg-[color:var(--color-accent)] text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto"
        >
          分析并调整当前配方
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
        <div className="border border-[color:var(--color-accent)]/40 rounded p-2 bg-[color:var(--color-accent)]/5">
          <div className="text-xs text-[color:var(--color-muted)]">蛋白合计</div>
          <div className="num text-lg font-semibold text-[color:var(--color-accent)]">{proteinSum.toFixed(0)} kg</div>
        </div>
        <div className="border border-[color:var(--color-accent-2)]/40 rounded p-2 bg-[color:var(--color-accent-2)]/5">
          <div className="text-xs text-[color:var(--color-muted)]">碳水合计</div>
          <div className="num text-lg font-semibold text-[color:var(--color-accent-2)]">{carbSum.toFixed(0)} kg</div>
        </div>
        <div className={`border rounded p-2 ${totalOff ? 'border-[color:var(--color-danger)] bg-[color:var(--color-danger-bg)]' : 'border-[color:var(--color-rule)] bg-[color:var(--color-bg)]'}`}>
          <div className="text-xs text-[color:var(--color-muted)]">当前合计</div>
          <div className={`num text-lg font-semibold ${totalOff ? 'text-[color:var(--color-danger)]' : 'text-[color:var(--color-ink)]'}`}>{curTotal.toFixed(0)} kg</div>
        </div>
      </div>

      {totalOff && (
        <div className="mb-3 flex items-center justify-between gap-3 px-3 py-2 rounded border-l-4 border-[color:var(--color-danger)] bg-[color:var(--color-danger-bg)] text-sm">
          <span className="text-[color:var(--color-muted)]">合计 ≠ 1000 kg</span>
          <button type="button" onClick={normalizeToOneTon}
            className="h-9 px-3 rounded text-sm bg-[color:var(--color-accent)] text-white hover:opacity-90">折算到 1000 kg</button>
        </div>
      )}

      {/* 移动端卡片视图 */}
      <div className="md:hidden space-y-3">
        {mainRows.map((ing) => (
          <MobileCard key={ing.id} ing={ing} onUpdate={onUpdate(ing.id)} onRemove={onRemove(ing.id)} />
        ))}
      </div>

      {/* 桌面端表格视图 */}
      <div className="hidden md:block border border-[color:var(--color-rule)] rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[color:var(--color-bg)]">
            <tr className="text-[color:var(--color-muted)]">
              <th className="text-left px-3 py-2.5 font-semibold">原料</th>
              <th className="text-left px-2 py-2.5 font-semibold">类别</th>
              <th className="text-right px-2 py-2.5 font-semibold">当前 kg</th>
              <th className="text-right px-2 py-2.5 font-semibold">粗蛋白%</th>
              <th className="text-right px-2 py-2.5 font-semibold">消化能</th>
              <th className="text-right px-2 py-2.5 font-semibold">元/吨</th>
              <th className="text-center px-2 py-2.5 font-semibold">启用</th>
              <th className="text-center px-2 py-2.5 font-semibold">操作</th>
            </tr>
          </thead>
          <tbody>
            {mainRows.map((ing) => (
              <DesktopRow key={ing.id} ing={ing} onUpdate={onUpdate(ing.id)} onRemove={onRemove(ing.id)} />
            ))}
          </tbody>
        </table>
      </div>

      {/* 操作按钮 */}
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <button type="button" onClick={() => setActionsOpen((v) => !v)}
          className="h-10 px-4 rounded text-sm border border-[color:var(--color-rule)] text-[color:var(--color-muted)] hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]">
          更多 ▾
        </button>
        {actionsOpen && (
          <div className="w-full flex flex-wrap gap-2 pt-2">
            <button type="button" onClick={() => { setCsvOpen((v) => !v); setActionsOpen(false); }}
              className="h-10 px-4 rounded text-sm border border-[color:var(--color-rule)] hover:border-[color:var(--color-accent)]">粘贴 CSV</button>
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="h-10 px-4 rounded text-sm border border-[color:var(--color-rule)] hover:border-[color:var(--color-accent)]">导入文件</button>
            <button type="button" onClick={onExportCSV}
              className="h-10 px-4 rounded text-sm border border-[color:var(--color-rule)] hover:border-[color:var(--color-accent)]">导出 CSV</button>
            <button type="button" onClick={onExportJSON}
              className="h-10 px-4 rounded text-sm border border-[color:var(--color-rule)] hover:border-[color:var(--color-accent)]">导出 JSON</button>
            <button type="button" onClick={() => { loadDefaults(); setActionsOpen(false); }}
              className="h-10 px-4 rounded text-sm border border-dashed border-[color:var(--color-muted)] text-[color:var(--color-muted)] hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]">载入默认</button>
          </div>
        )}
        <input ref={fileInputRef} type="file" accept=".csv,.json" className="hidden" onChange={onImportFile} />
      </div>

      {csvOpen && (
        <div className="mt-3 p-3 border border-dashed border-[color:var(--color-rule)] rounded">
          <textarea value={csvText} onChange={(e) => setCsvText(e.target.value)}
            placeholder="id,name,category,currentKgPerTon,moisturePct,crudeProteinPct,digestibleEnergyMjKg,priceCnyPerTon"
            className="w-full h-28 text-sm font-mono border border-[color:var(--color-rule)] rounded p-2" />
          <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={() => setCsvOpen(false)} className="h-8 px-3 rounded text-sm border border-[color:var(--color-rule)]">取消</button>
            <button type="button" onClick={onPasteSubmit} className="h-8 px-3 rounded text-sm bg-[color:var(--color-accent)] text-white">追加到原料表</button>
          </div>
        </div>
      )}

      {/* 微量元素折叠 */}
      <div className="mt-4">
        <button
          type="button"
          onClick={() => setTraceOpen((v) => !v)}
          className="h-9 px-3 rounded text-sm border border-[color:var(--color-rule)] text-[color:var(--color-muted)] hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]"
        >
          {traceOpen ? '▼' : '▶'} 微量元素 / 矿物 / 预混（{traceRows.length} 项）
        </button>
        {traceOpen && (
          <div className="mt-2">
            {/* 移动端卡片 */}
            <div className="md:hidden space-y-3">
              {traceRows.map((ing) => (
                <MobileCard key={ing.id} ing={ing} hidePrice onUpdate={onUpdate(ing.id)} onRemove={onRemove(ing.id)} />
              ))}
            </div>
            {/* 桌面端表格 */}
            <div className="hidden md:block border border-[color:var(--color-rule)] rounded overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[color:var(--color-bg)]">
                  <tr className="text-[color:var(--color-muted)]">
                    <th className="text-left px-3 py-2 font-semibold">原料</th>
                    <th className="text-left px-2 py-2 font-semibold">类别</th>
                    <th className="text-right px-2 py-2 font-semibold">当前 kg</th>
                    <th className="text-right px-2 py-2 font-semibold">粗蛋白%</th>
                    <th className="text-right px-2 py-2 font-semibold">消化能</th>
                    <th className="text-center px-2 py-2 font-semibold">启用</th>
                    <th className="text-center px-2 py-2 font-semibold">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {traceRows.map((ing) => (
                    <DesktopRow key={ing.id} ing={ing} hidePrice onUpdate={onUpdate(ing.id)} onRemove={onRemove(ing.id)} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// 移动端卡片
function MobileCard({ ing, hidePrice, onUpdate, onRemove }: {
  ing: Ingredient;
  hidePrice?: boolean;
  onUpdate: (p: Partial<Ingredient>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="border border-[color:var(--color-rule)] rounded-lg p-3 bg-[color:var(--color-bg-2)]">
      <div className="flex items-center gap-2 mb-2">
        <input type="checkbox" checked={ing.enabled} onChange={(e) => onUpdate({ enabled: e.target.checked })} className="w-5 h-5 accent-[color:var(--color-accent)] shrink-0" />
        <input type="text" value={ing.name} onChange={(e) => onUpdate({ name: e.target.value })}
          className="flex-1 min-w-0 h-9 px-2 text-base bg-transparent border border-[color:var(--color-rule)] rounded outline-none focus:border-[color:var(--color-accent)]" />
        <button type="button" onClick={onRemove} className="text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-danger)] px-1 shrink-0">删除</button>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-[color:var(--color-muted)]">类别</span>
          <select value={ing.category} onChange={(e) => onUpdate({ category: e.target.value as IngredientCategory })}
            className="h-9 px-2 text-sm bg-transparent border border-[color:var(--color-rule)] rounded outline-none">
            {Object.entries(CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-[color:var(--color-muted)]">当前 kg/吨</span>
          <NumberInput value={ing.currentKgPerTon} onChange={(v) => onUpdate({ currentKgPerTon: v })} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-[color:var(--color-muted)]">粗蛋白 %</span>
          <NumberInput value={ing.crudeProteinPct} onChange={(v) => onUpdate({ crudeProteinPct: v })} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-[color:var(--color-muted)]">消化能 MJ/kg</span>
          <NumberInput value={ing.digestibleEnergyMjKg} onChange={(v) => onUpdate({ digestibleEnergyMjKg: v })} />
        </label>
        {!hidePrice && (
          <label className="flex flex-col gap-1 col-span-2">
            <span className="text-xs text-[color:var(--color-muted)]">价格 元/吨</span>
            <NumberInput value={ing.priceCnyPerTon} onChange={(v) => onUpdate({ priceCnyPerTon: v })} />
          </label>
        )}
      </div>
    </div>
  );
}

// 桌面端行
function DesktopRow({ ing, hidePrice, onUpdate, onRemove }: {
  ing: Ingredient;
  hidePrice?: boolean;
  onUpdate: (p: Partial<Ingredient>) => void;
  onRemove: () => void;
}) {
  return (
    <tr className="border-t border-[color:var(--color-rule)] hover:bg-[color:var(--color-bg)]/60">
      <td className="px-3 py-2">
        <input type="text" value={ing.name} onChange={(e) => onUpdate({ name: e.target.value })}
          className="w-32 h-9 px-2 text-sm bg-transparent border border-transparent hover:border-[color:var(--color-rule)] focus:border-[color:var(--color-accent)] rounded outline-none" />
      </td>
      <td className="px-2 py-2">
        <select value={ing.category} onChange={(e) => onUpdate({ category: e.target.value as IngredientCategory })}
          className="h-9 px-1.5 text-sm bg-transparent border border-[color:var(--color-rule)] rounded outline-none">
          {Object.entries(CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </td>
      <td className="px-2 py-2"><NumberCell value={ing.currentKgPerTon} onChange={(v) => onUpdate({ currentKgPerTon: v })} /></td>
      <td className="px-2 py-2"><NumberCell value={ing.crudeProteinPct} onChange={(v) => onUpdate({ crudeProteinPct: v })} /></td>
      <td className="px-2 py-2"><NumberCell value={ing.digestibleEnergyMjKg} onChange={(v) => onUpdate({ digestibleEnergyMjKg: v })} /></td>
      {!hidePrice && <td className="px-2 py-2"><NumberCell value={ing.priceCnyPerTon} onChange={(v) => onUpdate({ priceCnyPerTon: v })} /></td>}
      {hidePrice && <td className="px-2 py-2 text-center text-[color:var(--color-muted)]">—</td>}
      <td className="px-2 py-2 text-center">
        <input type="checkbox" checked={ing.enabled} onChange={(e) => onUpdate({ enabled: e.target.checked })} className="w-5 h-5 accent-[color:var(--color-accent)]" />
      </td>
      <td className="px-2 py-2 text-center">
        <button type="button" onClick={onRemove} className="text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-danger)] px-2 py-1">删除</button>
      </td>
    </tr>
  );
}

function NumberCell({ value, onChange, allowEmpty }: { value: number | undefined; onChange: (v: number | undefined) => void; allowEmpty?: boolean }) {
  return (
    <input type="number" inputMode="decimal" step="any" value={value === undefined ? '' : value}
      onChange={(e) => { const t = e.target.value; if (t === '') { if (allowEmpty) onChange(undefined); return; } const n = Number(t); if (Number.isFinite(n)) onChange(n); }}
      className="num w-20 h-9 px-2 text-sm text-right bg-transparent border border-transparent hover:border-[color:var(--color-rule)] focus:border-[color:var(--color-accent)] rounded outline-none" />
  );
}

function NumberInput({ value, onChange }: { value: number | undefined; onChange: (v: number | undefined) => void }) {
  return (
    <input type="number" inputMode="decimal" step="any" value={value === undefined ? '' : value}
      onChange={(e) => { const t = e.target.value; if (t === '') return; const n = Number(t); if (Number.isFinite(n)) onChange(n); }}
      className="num w-full h-9 px-2 text-sm text-right bg-transparent border border-[color:var(--color-rule)] rounded outline-none focus:border-[color:var(--color-accent)]" />
  );
}
