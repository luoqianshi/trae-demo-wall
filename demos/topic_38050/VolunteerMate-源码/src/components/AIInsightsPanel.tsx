import { Sparkles, TrendingUp, Target, Award } from 'lucide-react';
import { useStore } from '../store/useStore';
import { generateInsights, getUserPersona } from '../ai/insights';

export function AIInsightsPanel() {
  const { stats, checkIns } = useStore();
  const insights = generateInsights(stats, checkIns);
  const persona = getUserPersona(stats);

  const typeIcon = {
    stats: TrendingUp,
    pattern: Sparkles,
    recommendation: Target,
    milestone: Award,
  };

  const typeColor: Record<string, string> = {
    stats: 'text-emerald-600',
    pattern: 'text-indigo-600',
    recommendation: 'text-amber-600',
    milestone: 'text-rose-600',
  };

  return (
    <div className="space-y-4">
      {/* Persona card */}
      <div className={`bg-gradient-to-br ${persona.color} rounded-2xl p-5 text-white shadow-lg shadow-purple-500/10`}>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4" />
          <span className="text-xs font-medium uppercase tracking-wide opacity-90">你的公益画像</span>
        </div>
        <h3 className="text-2xl font-bold mb-2">{persona.persona}</h3>
        <p className="text-sm text-white/90 leading-relaxed mb-3">{persona.description}</p>
        <div className="flex flex-wrap gap-1.5">
          {persona.traits.map((trait, i) => (
            <span key={i} className="text-xs px-2.5 py-1 bg-white/20 backdrop-blur rounded-full">
              {trait}
            </span>
          ))}
        </div>
      </div>

      {/* Insights */}
      <div className="grid gap-3">
        {insights.slice(0, 5).map((insight, idx) => {
          const Icon = typeIcon[insight.type];
          return (
            <div key={insight.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0">
                  <Icon className={`w-4 h-4 ${typeColor[insight.type]}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-800 text-sm mb-1">{insight.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{insight.description}</p>
                  {insight.value && (
                    <div className="mt-2 inline-block text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                      {insight.value}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
