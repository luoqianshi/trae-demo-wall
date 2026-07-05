import type { TargetProfile } from '../types/domain';

const SOURCE_TAG: Record<TargetProfile['sourceStatus'], { label: string; className: string }> = {
  current: { label: '现行国标', className: 'text-[color:var(--color-accent)] border-[color:var(--color-accent)]' },
  derived: { label: '派生均值', className: 'text-[color:var(--color-warn)] border-[color:var(--color-warn)]' },
  reference: { label: '参考', className: 'text-[color:var(--color-accent-2)] border-[color:var(--color-accent-2)]' },
  deprecated: { label: '已废止，仅参考', className: 'text-[color:var(--color-warn)] border-[color:var(--color-warn)]' },
};

const CONFIDENCE_LABEL: Record<TargetProfile['confidence'], string> = {
  high: '高',
  medium: '中',
  low: '低',
};

export function TargetCard({ target }: { target: TargetProfile }) {
  const tag = SOURCE_TAG[target.sourceStatus];
  return (
    <section className="bg-[color:var(--color-bg-2)] border border-[color:var(--color-rule)] rounded-lg p-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-semibold">{target.phase}</h2>
            <span
              className={`text-xs px-2 py-0.5 border rounded font-medium ${tag.className}`}
            >
              {tag.label}
            </span>
            <span className="text-xs text-[color:var(--color-muted)] font-mono">
              置信度：{CONFIDENCE_LABEL[target.confidence]}
            </span>
          </div>
          <p className="mt-1 text-sm text-[color:var(--color-muted)]">{target.source}</p>
        </div>
        <div className="flex gap-6">
          <Metric label="粗蛋白下限" value={target.cpMinPct.toFixed(1)} unit="%" />
          <Metric label="消化能下限" value={target.deMinMjKg.toFixed(2)} unit="MJ/kg" />
          {target.moistureMaxPct !== undefined && (
            <Metric label="水分上限" value={target.moistureMaxPct.toFixed(1)} unit="%" />
          )}
        </div>
      </div>
      {target.warnings.length > 0 && (
        <ul className="mt-3 pt-3 border-t border-[color:var(--color-rule)] space-y-1">
          {target.warnings.map((w, i) => (
            <li key={i} className="text-sm text-[color:var(--color-muted)] before:content-['·'] before:mr-2 before:text-[color:var(--color-accent-2)]">
              {w}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Metric({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div>
      <div className="text-sm text-[color:var(--color-muted)] mb-1">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="num text-3xl text-[color:var(--color-ink)] leading-none">{value}</span>
        <span className="text-sm text-[color:var(--color-muted)] num">{unit}</span>
      </div>
    </div>
  );
}
