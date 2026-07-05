import { useStore } from '../state/store';
import { TARGETS } from '../data/targets';
import type { PigType } from '../types/domain';

const PIG_TYPES: { value: PigType; label: string }[] = [
  { value: 'lean', label: '瘦肉型' },
  { value: 'meatFat', label: '肉脂型' },
  { value: 'fat', label: '脂肪型' },
];

export function PigTypePhase() {
  const pigType = useStore((s) => s.pigType);
  const phaseId = useStore((s) => s.phaseId);
  const showHeavy = useStore((s) => s.showHeavyPhases);
  const setPigType = useStore((s) => s.setPigType);
  const setPhase = useStore((s) => s.setPhase);
  const toggleHeavy = useStore((s) => s.toggleShowHeavy);

  const all = TARGETS.filter((t) => t.pigType === pigType);
  const normal = all.filter((t) => t.weightRangeKg[1] <= 120);
  const heavy = all.filter((t) => t.weightRangeKg[0] >= 120);

  return (
    <section className="bg-[color:var(--color-bg-2)] border border-[color:var(--color-rule)] rounded-lg p-4 sm:p-5">
      <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-3">
        <div className="flex items-center justify-between sm:justify-start gap-3">
          <span className="text-sm text-[color:var(--color-muted)] shrink-0">猪种</span>
          <div className="inline-flex border border-[color:var(--color-rule)] rounded overflow-hidden flex-1 sm:flex-none">
            {PIG_TYPES.map((p) => {
              const active = p.value === pigType;
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPigType(p.value)}
                  className={`flex-1 sm:flex-none px-4 py-2.5 text-base font-medium transition-colors duration-150 ${
                    active
                      ? 'bg-[color:var(--color-accent)] text-white'
                      : 'bg-white text-[color:var(--color-ink)] hover:bg-[color:var(--color-bg)]'
                  }`}
                  aria-pressed={active}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-start gap-2 flex-wrap">
          <span className="text-sm text-[color:var(--color-muted)] shrink-0 pt-2">阶段</span>
          <div className="flex flex-wrap gap-2 flex-1">
            {normal.map((t) => {
              const active = t.id === phaseId;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setPhase(t.id)}
                  className={`flex-1 sm:flex-none min-w-[80px] h-11 sm:h-10 px-3 sm:px-4 rounded text-base border transition-colors duration-150 ${
                    active
                      ? 'bg-[color:var(--color-accent)] border-[color:var(--color-accent)] text-white'
                      : 'bg-white border-[color:var(--color-rule)] text-[color:var(--color-ink)] hover:border-[color:var(--color-accent)]'
                  }`}
                  aria-pressed={active}
                >
                  {t.phase}
                </button>
              );
            })}
            <button
              type="button"
              onClick={toggleHeavy}
              className="h-11 sm:h-10 px-3 sm:px-4 rounded text-base border border-dashed border-[color:var(--color-accent-2)] text-[color:var(--color-accent-2)] hover:bg-[color:var(--color-accent-2)]/5 whitespace-nowrap"
              aria-pressed={showHeavy}
            >
              {showHeavy ? '收起 >120kg' : '展开 >120kg'}
            </button>
            {showHeavy &&
              heavy.map((t) => {
                const active = t.id === phaseId;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setPhase(t.id)}
                    className={`relative flex-1 sm:flex-none min-w-[80px] h-11 sm:h-10 px-3 sm:px-4 rounded text-base border transition-colors duration-150 ${
                      active
                        ? 'bg-[color:var(--color-accent-2)] border-[color:var(--color-accent-2)] text-white'
                        : 'bg-white border-[color:var(--color-accent-2)] text-[color:var(--color-accent-2)] hover:bg-[color:var(--color-accent-2)]/5'
                    }`}
                    aria-pressed={active}
                  >
                    {t.phase}
                    <span className="absolute -top-1.5 -right-1.5 px-1 text-[10px] leading-tight rounded bg-[color:var(--color-warn)] text-white font-semibold">
                      参考
                    </span>
                  </button>
                );
              })}
          </div>
        </div>
      </div>
    </section>
  );
}
