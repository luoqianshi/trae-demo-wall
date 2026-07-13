import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, ThermometerSun, ThermometerSnowflake, Phone, 
  AlertTriangle, Navigation, MessageCircle
} from 'lucide-react';
import { cn } from '../utils/cn';
import { generateEmergencyAdvice } from '../utils/riskEngine';
import type { EmergencySymptom } from '../types';
import Card from '../components/Card';

const heatSymptoms: EmergencySymptom[] = [
  { id: 'h1', name: '头晕', severity: '轻度' },
  { id: 'h2', name: '恶心', severity: '中度' },
  { id: 'h3', name: '大量出汗', severity: '中度' },
  { id: 'h4', name: '肌肉抽筋', severity: '中度' },
  { id: 'h5', name: '意识模糊', severity: '重度' },
  { id: 'h6', name: '昏倒', severity: '重度' },
];

const coldSymptoms: EmergencySymptom[] = [
  { id: 'c1', name: '寒战', severity: '轻度' },
  { id: 'c2', name: '手脚麻木', severity: '中度' },
  { id: 'c3', name: '皮肤苍白', severity: '中度' },
  { id: 'c4', name: '反应迟缓', severity: '重度' },
  { id: 'c5', name: '意识不清', severity: '重度' },
];

export default function EmergencyPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'select' | 'heat' | 'cold' | 'advice'>('select');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  
  const toggleSymptom = (id: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };
  
  const advice = useMemo(() => {
    const symptoms = mode === 'heat' 
      ? heatSymptoms.filter(s => selectedSymptoms.includes(s.id))
      : coldSymptoms.filter(s => selectedSymptoms.includes(s.id));
    return generateEmergencyAdvice(symptoms, mode === 'heat' ? 'heat' : 'cold');
  }, [selectedSymptoms, mode]);
  
  if (mode === 'advice') {
    return (
      <div className="min-h-full px-5 pt-4 pb-8 animate-fade-in">
        <button onClick={() => { setMode('select'); setSelectedSymptoms([]); }} className="flex items-center gap-1 text-ink-muted mb-4">
          <ChevronLeft className="w-5 h-5" />
          重新选择
        </button>
        
        <h1 className="text-2xl font-bold mb-5">应急处理</h1>
        
        {/* 风险提示 */}
        <div className={cn(
          'rounded-3xl p-5 mb-4 border',
          advice.call120 
            ? 'bg-heat-extreme/10 border-heat-extreme/30' 
            : 'bg-heat-high/10 border-heat-high/20'
        )}>
          <div className="flex items-start gap-3">
            <div className={cn(
              'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0',
              advice.call120 ? 'bg-heat-extreme/20' : 'bg-heat-high/20'
            )}>
              <AlertTriangle className={cn(
                'w-5 h-5',
                advice.call120 ? 'text-heat-extreme' : 'text-heat-high'
              )} />
            </div>
            <div>
              <div className={cn(
                'font-bold text-base mb-1',
                advice.call120 ? 'text-heat-extreme' : 'text-heat-high'
              )}>
                {advice.call120 ? '请立即采取行动' : '请尽快采取行动'}
              </div>
              <p className="text-sm leading-relaxed text-gray-300">{advice.riskStatement}</p>
            </div>
          </div>
        </div>
        
        {/* 立即行动 */}
        <Card className="mb-4">
          <h3 className="font-bold text-base mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-warm rounded-full" />
            立即行动步骤
          </h3>
          <div className="space-y-3">
            {advice.immediateActions.map((action, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-warm/15 text-warm flex items-center justify-center text-sm font-bold shrink-0">
                  {i + 1}
                </div>
                <span className="text-sm leading-relaxed pt-0.5">{action}</span>
              </div>
            ))}
          </div>
        </Card>
        
        {/* 危险信号 */}
        <Card className="mb-4">
          <h3 className="font-bold text-base mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-warm rounded-full" />
            如出现以下情况，请立即拨打120
          </h3>
          <div className="space-y-2.5">
            {advice.warningSigns.map((sign, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-heat-high">
                <span className="w-1.5 h-1.5 rounded-full bg-heat-high shrink-0" />
                {sign}
              </div>
            ))}
          </div>
        </Card>
        
        {/* 附近安全点 */}
        <Card className="mb-4">
          <h3 className="font-bold text-base mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-warm rounded-full" />
            附近安全点
          </h3>
          <div className="space-y-1">
            {advice.nearbySafePoints.map(point => (
              <div key={point.id} className="flex items-center justify-between py-2.5 border-b border-rule/40 last:border-0">
                <div>
                  <div className="text-sm font-medium">{point.name}</div>
                  <div className="text-xs text-ink-muted mt-0.5">{point.distance} · {point.openTime}</div>
                </div>
                <button 
                  onClick={() => alert(`导航至: ${point.name}`)}
                  className="px-3 py-1.5 rounded-xl bg-warm/15 text-warm text-xs font-medium active:scale-95 transition-transform"
                >
                  导航
                </button>
              </div>
            ))}
          </div>
        </Card>
        
        {/* 联系按钮 */}
        <div className="space-y-3 mt-6">
          {advice.call120 && (
            <a 
              href="tel:120"
              className="w-full bg-gradient-to-r from-heat-extreme to-red-600 text-white rounded-2xl py-5 font-bold text-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-[0_8px_30px_rgba(220,38,38,0.35)]"
            >
              <Phone className="w-5 h-5" />
              拨打 120
            </a>
          )}
          
          {advice.contactFamily && (
            <button 
              onClick={() => navigate('/cared')}
              className="w-full bg-gradient-to-r from-safe to-safe-light text-white rounded-2xl py-4 font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              <MessageCircle className="w-5 h-5" />
              联系家人
            </button>
          )}
          
          <button 
            onClick={() => navigate('/nearby')}
            className="w-full bg-card-bg border border-rule/40 rounded-2xl py-4 font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <Navigation className="w-5 h-5 text-warm" />
            查找附近安全点
          </button>
        </div>
        
        {/* 免责声明 */}
        <div className="mt-6 p-4 rounded-2xl bg-card-bg-light/40">
          <p className="text-xs text-ink-muted leading-relaxed flex items-start gap-1.5">
            <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
            <span>本功能仅作风险提示和初步处置建议，不替代专业医疗诊断。如症状严重或持续，请立即拨打120或前往医院。</span>
          </p>
        </div>
      </div>
    );
  }
  
  if (mode === 'heat' || mode === 'cold') {
    const symptoms = mode === 'heat' ? heatSymptoms : coldSymptoms;
    const title = mode === 'heat' ? '太热不舒服' : '太冷不舒服';
    const Icon = mode === 'heat' ? ThermometerSun : ThermometerSnowflake;
    const colorClass = mode === 'heat' ? 'text-heat-high' : 'text-cold-high';
    
    return (
      <div className="min-h-full px-5 pt-4 pb-8 animate-fade-in">
        <button onClick={() => { setMode('select'); setSelectedSymptoms([]); }} className="flex items-center gap-1 text-ink-muted mb-4">
          <ChevronLeft className="w-5 h-5" />
          返回
        </button>
        
        <div className="flex items-center gap-3 mb-6">
          <div className={cn(
            'w-12 h-12 rounded-2xl flex items-center justify-center',
            mode === 'heat' ? 'bg-heat-high/15' : 'bg-cold-high/15'
          )}>
            <Icon className={cn('w-6 h-6', colorClass)} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-sm text-ink-muted mt-0.5">选择您出现的症状</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-6">
          {symptoms.map(symptom => (
            <button
              key={symptom.id}
              onClick={() => toggleSymptom(symptom.id)}
              className={cn(
                'p-5 rounded-2xl border text-left transition-all active:scale-95',
                selectedSymptoms.includes(symptom.id)
                  ? mode === 'heat'
                    ? 'bg-heat-high/20 border-heat-high text-white'
                    : 'bg-cold-high/20 border-cold-high text-white'
                  : 'bg-card-bg border-rule/40 text-gray-300'
              )}
            >
              <div className="font-medium text-base mb-1.5">{symptom.name}</div>
              <div className={cn(
                'text-xs',
                symptom.severity === '重度' ? 'text-heat-extreme' :
                symptom.severity === '中度' ? 'text-heat-high' :
                'text-ink-muted'
              )}>
                {symptom.severity}
              </div>
            </button>
          ))}
        </div>
        
        <button 
          onClick={() => setMode('advice')}
          disabled={selectedSymptoms.length === 0}
          className="w-full bg-warm text-app-bg rounded-2xl py-4 font-bold text-lg active:scale-[0.98] transition-transform disabled:opacity-40 disabled:cursor-not-allowed shadow-warm"
        >
          查看应急建议
        </button>
      </div>
    );
  }
  
  return (
    <div className="min-h-full px-5 pt-4 pb-8 animate-fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-ink-muted mb-4">
        <ChevronLeft className="w-5 h-5" />
        返回
      </button>
      
      <h1 className="text-2xl font-bold mb-1">应急</h1>
      <p className="text-sm text-ink-muted mb-6">快速选择，获得应急处理建议</p>
      
      <div className="space-y-4">
        <button 
          onClick={() => setMode('heat')}
          className="w-full bg-gradient-to-br from-heat-high/20 to-heat-medium/10 border border-heat-high/20 rounded-3xl p-8 text-left active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-heat-high/20 flex items-center justify-center shrink-0">
              <ThermometerSun className="w-7 h-7 text-heat-high" />
            </div>
            <div>
              <div className="font-bold text-lg">太热不舒服</div>
              <div className="text-sm text-ink-muted mt-1">头晕、恶心、大量出汗、肌肉抽筋等</div>
            </div>
          </div>
        </button>
        
        <button 
          onClick={() => setMode('cold')}
          className="w-full bg-gradient-to-br from-cold-high/20 to-cold-medium/10 border border-cold-high/20 rounded-3xl p-8 text-left active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-cold-high/20 flex items-center justify-center shrink-0">
              <ThermometerSnowflake className="w-7 h-7 text-cold-high" />
            </div>
            <div>
              <div className="font-bold text-lg">太冷不舒服</div>
              <div className="text-sm text-ink-muted mt-1">寒战、手脚麻木、皮肤苍白、反应迟缓等</div>
            </div>
          </div>
        </button>
      </div>
      
      {/* 免责声明 */}
      <div className="mt-8 p-4 rounded-2xl bg-card-bg-light/40">
        <p className="text-xs text-ink-muted leading-relaxed flex items-start gap-1.5">
          <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
          <span>如出现意识模糊、昏倒、抽搐等严重症状，请立即拨打120，无需等待App建议。</span>
        </p>
      </div>
    </div>
  );
}
