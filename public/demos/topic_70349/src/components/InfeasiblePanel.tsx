import type { InfeasibleReason } from '../types/domain';

const CODE_LABEL: Record<InfeasibleReason['code'], string> = {
  insufficientIngredients: '原料不足',
  missingData: '数据缺失',
  protein: '蛋白不足',
  energy: '能量不足',
  sum: '总量异常',
  bounds: '用量限制',
  solver: '求解器',
};

export function InfeasiblePanel({ reasons }: { reasons: InfeasibleReason[] }) {
  return (
    <section className="bg-[color:var(--color-bg-2)] border border-[color:var(--color-danger)] rounded-lg p-5">
      <h2 className="text-base font-semibold text-[color:var(--color-danger)] mb-2">
        不可行 · {reasons.length} 条原因
      </h2>
      <p className="text-xs text-[color:var(--color-muted)] mb-3">
        当前原料与用量约束无法满足营养目标，请按下列原因调整后重试：
      </p>
      <ul className="space-y-2">
        {reasons.map((r, i) => (
          <li
            key={i}
            className="text-sm px-3 py-2 rounded border-l-4 border-[color:var(--color-danger)] bg-[color:var(--color-danger-bg)] text-[color:var(--color-ink)]"
          >
            <span className="inline-block mr-2 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-[color:var(--color-danger)] text-[color:var(--color-danger)] align-middle">
              {CODE_LABEL[r.code]}
            </span>
            {r.message}
          </li>
        ))}
      </ul>
    </section>
  );
}
