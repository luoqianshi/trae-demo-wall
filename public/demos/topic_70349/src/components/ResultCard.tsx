import { useStore } from '../state/store';
import { downloadFile, exportResultCSV } from '../lib/io';
import { formatKg, formatMoney } from '../lib/solver';
import { findTarget } from '../data/targets';

export function ResultCard() {
  const result = useStore((s) => s.result);
  const target = useStore((s) => findTarget(s.phaseId));

  if (!result) {
    return (
      <section className="bg-[color:var(--color-bg-2)] border border-[color:var(--color-rule)] rounded-lg p-5 h-full">
        <h2 className="text-xl font-semibold">调整结果</h2>
        <p className="text-base text-[color:var(--color-muted)] mt-3">
          录入当前用量后，点击"分析并调整当前配方"按钮。
        </p>
        <ul className="mt-4 space-y-2 text-sm text-[color:var(--color-muted)]">
          <li>· 系统先分析当前配方的营养缺口</li>
          <li>· 优先保留当前喂法，只在不达标时微调</li>
          <li>· 输出每种原料的增加/减少 kg/吨</li>
          <li>· 风险与提示会在结果下方列出</li>
        </ul>
      </section>
    );
  }

  if (result.status !== 'ok') return null;

  const sorted = [...result.items].sort((a, b) => b.recommendedKg - a.recommendedKg);
  const changes = sorted.filter((it) => Math.abs(it.deltaKg) > 0.5);

  const onExport = () => {
    downloadFile('adjustment-result.csv', exportResultCSV(sorted), 'text/csv;charset=utf-8');
  };

  return (
    <section className="bg-[color:var(--color-bg-2)] border border-[color:var(--color-rule)] rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">调整结果</h2>
        <button type="button" onClick={onExport}
          className="h-9 px-3 rounded text-sm border border-[color:var(--color-rule)] hover:border-[color:var(--color-accent)]">导出 CSV</button>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-[color:var(--color-muted)] mb-2">当前配方分析</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <AnalysisMetric label="当前 粗蛋白" value={result.currentAnalysis.cpPct.toFixed(1) + '%'}
            gap={result.currentAnalysis.gaps.cp} unit="%" target={target?.cpMinPct} />
          <AnalysisMetric label="当前 消化能" value={result.currentAnalysis.deMjKg.toFixed(2) + ' MJ/kg'}
            gap={result.currentAnalysis.gaps.de} unit="MJ/kg" target={target?.deMinMjKg} />
          <AnalysisMetric label="当前 水分" value={result.currentAnalysis.moisturePct.toFixed(1) + '%'}
            gap={result.currentAnalysis.gaps.moisture} unit="%" target={target?.moistureMaxPct} invert />
          <div className="border border-[color:var(--color-rule)] rounded p-3">
            <div className="text-sm text-[color:var(--color-muted)]">当前成本</div>
            <div className="num text-xl font-semibold text-[color:var(--color-ink)]">{formatMoney(result.currentAnalysis.costCnyPerTon)}</div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Metric label="推荐 CP" value={result.cpPct.toFixed(1) + '%'} sub={`目标 ≥ ${target?.cpMinPct.toFixed(1)}%`} tone={result.constraintStatus.cp === 'ok' ? 'ok' : 'warn'} />
          <Metric label="推荐 DE" value={result.deMjKg.toFixed(2) + ' MJ/kg'} sub={`目标 ≥ ${target?.deMinMjKg.toFixed(2)}`} tone={result.constraintStatus.de === 'ok' ? 'ok' : 'warn'} />
          <Metric label="推荐成本" value={formatMoney(result.costCnyPerTon)} tone="accent" />
          <Metric label="总量" value={`${formatKg(result.totalKg)} kg`} />
        </div>
      </div>

      {changes.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[color:var(--color-muted)] mb-2">调整动作</h3>
          <div className="border border-[color:var(--color-rule)] rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[color:var(--color-bg)]">
                <tr className="text-[color:var(--color-muted)]">
                  <th className="text-left px-3 py-2.5 font-semibold">原料</th>
                  <th className="text-right px-3 py-2.5 font-semibold">当前 kg</th>
                  <th className="text-right px-3 py-2.5 font-semibold">推荐 kg</th>
                  <th className="text-right px-3 py-2.5 font-semibold">调整</th>
                </tr>
              </thead>
              <tbody>
                {changes.map((it) => (
                  <tr key={it.id} className="border-t border-[color:var(--color-rule)]">
                    <td className="px-3 py-2.5 text-base">{it.name}</td>
                    <td className="px-3 py-2.5 num text-right text-base">{formatKg(it.currentKg)}</td>
                    <td className="px-3 py-2.5 num text-right text-base font-semibold">{formatKg(it.recommendedKg)}</td>
                    <td className="px-3 py-2.5 num text-right text-base">
                      <span className={`font-semibold ${it.deltaKg > 0 ? 'text-[color:var(--color-accent)]' : it.deltaKg < 0 ? 'text-[color:var(--color-danger)]' : 'text-[color:var(--color-muted)]'}`}>
                        {it.deltaKg > 0 ? '↑' : it.deltaKg < 0 ? '↓' : '='} {formatKg(Math.abs(it.deltaKg))}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-[color:var(--color-muted)] mb-2">风险与提示</h3>
        <ul className="space-y-2">
          {result.warnings.map((w, i) => (
            <li key={i} className="text-sm leading-relaxed px-3 py-2 rounded border-l-4 border-[color:var(--color-warn)] bg-[color:var(--color-warn-bg)] text-[color:var(--color-ink)]">{w}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Metric({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'ok' | 'warn' | 'accent' }) {
  const color = tone === 'ok' ? 'text-[color:var(--color-accent)]' : tone === 'warn' ? 'text-[color:var(--color-warn)]' : 'text-[color:var(--color-ink)]';
  return (
    <div className="border border-[color:var(--color-rule)] rounded p-3">
      <div className="text-sm text-[color:var(--color-muted)] mb-0.5">{label}</div>
      <div className={`num text-lg leading-tight font-semibold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-[color:var(--color-muted)] mt-0.5 num">{sub}</div>}
    </div>
  );
}

function AnalysisMetric({ label, value, gap, unit, target, invert }: {
  label: string; value: string; gap: number | undefined; unit: string; target?: number; invert?: boolean;
}) {
  if (gap === undefined) gap = 0;
  const isBad = invert ? gap > 0.1 : gap < -0.1;
  return (
    <div className="border border-[color:var(--color-rule)] rounded p-3">
      <div className="text-sm text-[color:var(--color-muted)]">{label}</div>
      <div className={`num text-lg font-semibold ${isBad ? 'text-[color:var(--color-warn)]' : 'text-[color:var(--color-ink)]'}`}>{value}</div>
      <div className={`text-xs mt-0.5 num ${isBad ? 'text-[color:var(--color-warn)]' : 'text-[color:var(--color-muted)]'}`}>
        {gap > 0 ? '+' : ''}{gap.toFixed(1)} {unit}
        {target !== undefined && ` (目标 ${invert ? '≤' : '≥'} ${target.toFixed(1)})`}
      </div>
    </div>
  );
}
