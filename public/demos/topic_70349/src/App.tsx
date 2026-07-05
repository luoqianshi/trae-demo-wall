import { useStore } from './state/store';
import { Header } from './components/Header';
import { PigTypePhase } from './components/PigTypePhase';
import { TargetCard } from './components/TargetCard';
import { IngredientsTable } from './components/IngredientsTable';
import { ResultCard } from './components/ResultCard';
import { InfeasiblePanel } from './components/InfeasiblePanel';
import { findTarget } from './data/targets';

export default function App() {
  const phaseId = useStore((s) => s.phaseId);
  const result = useStore((s) => s.result);
  const target = findTarget(phaseId);

  return (
    <div className="min-h-screen">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="fade-in-1"><Header /></div>
        <div className="mt-6 fade-in-2"><PigTypePhase /></div>
        {target && (
          <div className="mt-6 fade-in-3"><TargetCard target={target} /></div>
        )}
        <div className="mt-6 grid gap-6 grid-cols-1 lg:grid-cols-12 fade-in-4">
          <div className="lg:col-span-7 fade-in-4"><IngredientsTable /></div>
          <div className="lg:col-span-5 fade-in-5">
            {result?.status === 'infeasible' ? <InfeasiblePanel reasons={result.reasons} /> : <ResultCard />}
          </div>
        </div>
        <footer className="mt-10 pb-6 text-xs text-[color:var(--color-muted)] text-center">
          v0.2 · 现有配方反推调整 · 不能替代营养师复核
        </footer>
      </div>
    </div>
  );
}
