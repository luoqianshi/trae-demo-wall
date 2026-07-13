import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, AlertTriangle, CheckCircle, Clock, Shield } from 'lucide-react';
import { cn } from '../utils/cn';
import { calculateRisk } from '../utils/riskEngine';
import { CITIES, IDENTITY_OPTIONS, AGE_OPTIONS, OUTDOOR_OPTIONS, DISEASE_OPTIONS, TIME_OPTIONS } from '../data/mockData';
import { getCityWeather } from '../utils/riskEngine';
import type { RiskProfile, IdentityType, AgeGroup, OutdoorHours, ChronicDisease, TimeSlot } from '../types';
import Card from '../components/Card';
import RiskBadge from '../components/RiskBadge';

export default function AssessmentPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'form' | 'result'>('form');

  const [form, setForm] = useState<RiskProfile>({
    identity: '普通居民',
    ageGroup: '中年',
    outdoorHours: '1-3小时',
    chronicDisease: '无',
    mainTimeSlot: '下午',
    city: '重庆',
    isAlone: false,
    hasAC: true,
  });

  const weather = useMemo(() => getCityWeather(form.city).current, [form.city]);
  const result = useMemo(() => calculateRisk(weather, form), [weather, form]);

  const updateForm = <K extends keyof RiskProfile>(key: K, value: RiskProfile[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const SelectField = ({
    label, value, options, onChange
  }: {
    label: string;
    value: string;
    options: readonly string[];
    onChange: (v: string) => void;
  }) => (
    <div className="mb-4">
      <label className="text-sm font-medium text-gray-300 mb-2.5 block">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={cn(
              'px-4 py-3 rounded-2xl text-sm border transition-all active:scale-95',
              value === opt
                ? 'bg-warm/15 border-warm/30 text-warm'
                : 'bg-card-bg-light border-rule/60 text-gray-400 hover:border-warm/20'
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );

  if (step === 'result') {
    return (
      <div className="min-h-full px-5 pt-4 pb-8 animate-fade-in">
        <button onClick={() => setStep('form')} className="flex items-center gap-1 text-gray-400 mb-5 active:opacity-60 transition-opacity">
          <ChevronLeft className="w-5 h-5" />
          重新评估
        </button>

        {/* 风险分数 */}
        <div className="text-center mb-6">
          <div className="text-xs text-ink-muted mb-3 tracking-wide">今日风险指数</div>
          <div className={cn(
            'inline-flex items-center justify-center w-40 h-40 rounded-full border-4 mb-4',
            result.level === '极高' ? 'border-heat-extreme bg-heat-extreme/10' :
            result.level === '高' ? 'border-heat-high bg-heat-high/10' :
            result.level === '中' ? 'border-heat-low bg-heat-low/10' :
            'border-safe bg-safe/10'
          )}>
            <div>
              <div className={cn(
                'text-6xl font-bold leading-none',
                result.level === '极高' ? 'text-heat-extreme' :
                result.level === '高' ? 'text-heat-high' :
                result.level === '中' ? 'text-heat-low' :
                'text-safe'
              )}>{result.score}</div>
              <div className="text-xs text-ink-muted mt-1.5">分</div>
            </div>
          </div>
          <div className="flex justify-center">
            <RiskBadge level={result.level} mode={result.mode} size="lg" pulse={result.level === '极高'} />
          </div>
        </div>

        {/* 风险原因 */}
        <Card className="mb-4">
          <h3 className="font-bold text-base mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-warm rounded-full" />
            <AlertTriangle className="w-5 h-5 text-heat-high" />
            风险原因
          </h3>
          <div className="space-y-3">
            {result.reasons.map((reason, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-card-bg-light flex items-center justify-center text-xs text-gray-300 font-semibold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-sm leading-relaxed">{reason}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* 行动建议 */}
        <Card className="mb-4">
          <h3 className="font-bold text-base mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-warm rounded-full" />
            <CheckCircle className="w-5 h-5 text-warm" />
            今日行动建议
          </h3>
          <div className="space-y-3">
            {result.actions.map((action, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-warm/15 flex items-center justify-center shrink-0 mt-0.5">
                  <Shield className="w-3.5 h-3.5 text-warm" />
                </div>
                <span className="text-sm leading-relaxed">{action}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* 危险时段 */}
        <Card className="mb-4">
          <h3 className="font-bold text-base mb-3 flex items-center gap-2">
            <span className="w-1 h-5 bg-warm rounded-full" />
            <Clock className="w-5 h-5 text-heat-low" />
            最危险时段
          </h3>
          <p className="text-sm">{result.dangerousTimeSlot}</p>
        </Card>

        {/* 立即行动按钮 */}
        <div className="space-y-3 mt-6">
          <button
            onClick={() => navigate('/cared')}
            className="w-full bg-gradient-to-r from-warm to-warm-dark text-white rounded-2xl py-4 font-bold text-base active:scale-[0.98] transition-transform shadow-warm"
          >
            添加关心的人
          </button>
          <button
            onClick={() => navigate('/nearby')}
            className="w-full bg-card-bg border border-rule/60 text-white rounded-2xl py-4 font-bold text-base active:scale-[0.98] transition-transform"
          >
            查找附近安全点
          </button>
          <button
            onClick={() => navigate('/emergency')}
            className="w-full bg-card-bg border border-heat-extreme/30 text-heat-extreme rounded-2xl py-4 font-bold text-base active:scale-[0.98] transition-transform"
          >
            出现不适怎么办
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full px-5 pt-4 pb-8 animate-fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-400 mb-5 active:opacity-60 transition-opacity">
        <ChevronLeft className="w-5 h-5" />
        返回
      </button>

      <h1 className="text-2xl font-bold mb-1">风险评估</h1>
      <p className="text-sm text-ink-muted mb-6">填写档案，AI测算今日冷热风险</p>

      <Card className="mb-4">
        <SelectField
          label="所在城市"
          value={form.city}
          options={CITIES}
          onChange={(v) => updateForm('city', v)}
        />

        <SelectField
          label="身份"
          value={form.identity}
          options={IDENTITY_OPTIONS as unknown as string[]}
          onChange={(v) => updateForm('identity', v as IdentityType)}
        />

        <SelectField
          label="年龄段"
          value={form.ageGroup}
          options={AGE_OPTIONS as unknown as string[]}
          onChange={(v) => updateForm('ageGroup', v as AgeGroup)}
        />

        <SelectField
          label="今日户外时长"
          value={form.outdoorHours}
          options={OUTDOOR_OPTIONS as unknown as string[]}
          onChange={(v) => updateForm('outdoorHours', v as OutdoorHours)}
        />

        <SelectField
          label="是否有慢病"
          value={form.chronicDisease}
          options={DISEASE_OPTIONS as unknown as string[]}
          onChange={(v) => updateForm('chronicDisease', v as ChronicDisease)}
        />

        <SelectField
          label="今日主要时段"
          value={form.mainTimeSlot}
          options={TIME_OPTIONS as unknown as string[]}
          onChange={(v) => updateForm('mainTimeSlot', v as TimeSlot)}
        />

        <div className="mb-0">
          <label className="text-sm font-medium text-gray-300 mb-2.5 block">生活状态</label>
          <div className="flex gap-3">
            <button
              onClick={() => updateForm('isAlone', !form.isAlone)}
              className={cn(
                'flex-1 py-4 rounded-2xl text-sm border transition-all active:scale-[0.98] font-medium',
                form.isAlone
                  ? 'bg-warm/15 border-warm/30 text-warm'
                  : 'bg-card-bg-light border-rule/60 text-gray-400'
              )}
            >
              {form.isAlone ? '独居 ✓' : '独居'}
            </button>
            <button
              onClick={() => updateForm('hasAC', !form.hasAC)}
              className={cn(
                'flex-1 py-4 rounded-2xl text-sm border transition-all active:scale-[0.98] font-medium',
                form.hasAC
                  ? 'bg-warm/15 border-warm/30 text-warm'
                  : 'bg-card-bg-light border-rule/60 text-gray-400'
              )}
            >
              {form.hasAC ? '有空调/供暖 ✓' : '有空调/供暖'}
            </button>
          </div>
        </div>
      </Card>

      <button
        onClick={() => setStep('result')}
        className="w-full bg-gradient-to-r from-warm to-warm-dark text-white rounded-2xl py-4 font-bold text-lg active:scale-[0.98] transition-transform shadow-warm"
      >
        开始评估
      </button>
    </div>
  );
}
