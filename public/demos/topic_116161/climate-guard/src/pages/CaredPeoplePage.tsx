import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Plus, Phone, MessageCircle, CheckCircle,
  AlertTriangle, MapPin, ShieldAlert, Clock
} from 'lucide-react';
import { cn } from '../utils/cn';
import { defaultCaredPersons, CITIES, AGE_OPTIONS, RELATION_OPTIONS } from '../data/mockData';
import { getCityWeather } from '../utils/riskEngine';
import { calculateRisk, generateCareMessage } from '../utils/riskEngine';
import type { CaredPerson, AgeGroup, RelationType } from '../types';
import Card from '../components/Card';
import RiskBadge from '../components/RiskBadge';

export default function CaredPeoplePage() {
  const navigate = useNavigate();
  const [people, setPeople] = useState<CaredPerson[]>(defaultCaredPersons);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCareMessage, setShowCareMessage] = useState<string | null>(null);

  const [newPerson, setNewPerson] = useState<Partial<CaredPerson>>({
    relation: '父母',
    ageGroup: '老人',
    city: '重庆',
    healthTags: [],
    isAlone: false,
    hasAC: true,
  });

  // 为每个人计算风险
  const peopleWithRisk = useMemo(() => {
    return people.map(person => {
      const weather = getCityWeather(person.city).current;
      const profile = {
        identity: person.ageGroup === '老人' ? '独居老人' as const : '普通居民' as const,
        ageGroup: person.ageGroup,
        outdoorHours: '0-1小时' as const,
        chronicDisease: person.healthTags.length > 0 ? '其他' as const : '无' as const,
        mainTimeSlot: '下午' as const,
        city: person.city,
        isAlone: person.isAlone,
        hasAC: person.hasAC,
      };
      const riskResult = calculateRisk(weather, profile);
      const careMessage = generateCareMessage(person, weather);
      return { ...person, riskResult, careMessage };
    }).sort((a, b) => {
      // 未确认安全的置顶，极高风险置顶
      const aUrgent = !a.lastSafeCheck?.includes('今天') || a.riskResult?.level === '极高';
      const bUrgent = !b.lastSafeCheck?.includes('今天') || b.riskResult?.level === '极高';
      if (aUrgent && !bUrgent) return -1;
      if (!aUrgent && bUrgent) return 1;
      return (b.riskResult?.score || 0) - (a.riskResult?.score || 0);
    });
  }, [people]);

  const handleCheckSafe = (id: string) => {
    const now = new Date();
    const timeStr = `今天 ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    setPeople(prev => prev.map(p => p.id === id ? { ...p, lastSafeCheck: timeStr } : p));
  };

  const handleAddPerson = () => {
    if (!newPerson.nickname) return;
    const person: CaredPerson = {
      id: Date.now().toString(),
      nickname: newPerson.nickname,
      relation: newPerson.relation as RelationType,
      city: newPerson.city || '重庆',
      ageGroup: newPerson.ageGroup as AgeGroup,
      healthTags: newPerson.healthTags || [],
      isAlone: newPerson.isAlone || false,
      hasAC: newPerson.hasAC || false,
      phone: newPerson.phone,
    };
    setPeople(prev => [...prev, person]);
    setShowAddForm(false);
    setNewPerson({ relation: '父母', ageGroup: '老人', city: '重庆', healthTags: [], isAlone: false, hasAC: true });
  };

  if (showAddForm) {
    return (
      <div className="min-h-full px-5 pt-4 pb-8 animate-fade-in">
        <button onClick={() => setShowAddForm(false)} className="flex items-center gap-1 text-ink-muted mb-5 active:opacity-60 transition-opacity">
          <ChevronLeft className="w-5 h-5" />
          返回
        </button>

        <h1 className="text-2xl font-bold mb-1">添加关心的人</h1>
        <p className="text-sm text-ink-muted mb-6">填写信息，持续关注家人冷热风险</p>

        <Card className="mb-4">
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-300 mb-2.5 block">昵称</label>
            <input
              type="text"
              value={newPerson.nickname || ''}
              onChange={e => setNewPerson(p => ({ ...p, nickname: e.target.value }))}
              placeholder="如：妈妈、小宝"
              className="w-full bg-card-bg-light border border-rule/60 rounded-2xl px-4 py-3.5 text-ink placeholder-gray-500 focus:outline-none focus:border-warm/40 transition-colors"
            />
          </div>

          <div className="mb-4">
            <label className="text-sm font-medium text-gray-300 mb-2.5 block">关系</label>
            <div className="flex flex-wrap gap-2">
              {RELATION_OPTIONS.map(r => (
                <button
                  key={r}
                  onClick={() => setNewPerson(p => ({ ...p, relation: r }))}
                  className={cn(
                    'px-4 py-3 rounded-2xl text-sm border transition-all active:scale-95',
                    newPerson.relation === r
                      ? 'bg-warm/15 border-warm/30 text-warm'
                      : 'bg-card-bg-light border-rule/60 text-ink-muted hover:border-warm/20'
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="text-sm font-medium text-gray-300 mb-2.5 block">城市</label>
            <div className="flex flex-wrap gap-2">
              {CITIES.map(c => (
                <button
                  key={c}
                  onClick={() => setNewPerson(p => ({ ...p, city: c }))}
                  className={cn(
                    'px-4 py-3 rounded-2xl text-sm border transition-all active:scale-95',
                    newPerson.city === c
                      ? 'bg-warm/15 border-warm/30 text-warm'
                      : 'bg-card-bg-light border-rule/60 text-ink-muted hover:border-warm/20'
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="text-sm font-medium text-gray-300 mb-2.5 block">年龄段</label>
            <div className="flex flex-wrap gap-2">
              {AGE_OPTIONS.map(a => (
                <button
                  key={a}
                  onClick={() => setNewPerson(p => ({ ...p, ageGroup: a }))}
                  className={cn(
                    'px-4 py-3 rounded-2xl text-sm border transition-all active:scale-95',
                    newPerson.ageGroup === a
                      ? 'bg-warm/15 border-warm/30 text-warm'
                      : 'bg-card-bg-light border-rule/60 text-ink-muted hover:border-warm/20'
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="text-sm font-medium text-gray-300 mb-2.5 block">电话（选填）</label>
            <input
              type="tel"
              value={newPerson.phone || ''}
              onChange={e => setNewPerson(p => ({ ...p, phone: e.target.value }))}
              placeholder="138****1234"
              className="w-full bg-card-bg-light border border-rule/60 rounded-2xl px-4 py-3.5 text-ink placeholder-gray-500 focus:outline-none focus:border-warm/40 transition-colors"
            />
          </div>

          <div className="mb-0">
            <label className="text-sm font-medium text-gray-300 mb-2.5 block">生活状态</label>
            <div className="flex gap-3">
              <button
                onClick={() => setNewPerson(p => ({ ...p, isAlone: !p.isAlone }))}
                className={cn(
                  'flex-1 py-4 rounded-2xl text-sm border transition-all active:scale-[0.98] font-medium',
                  newPerson.isAlone
                    ? 'bg-warm/15 border-warm/30 text-warm'
                    : 'bg-card-bg-light border-rule/60 text-ink-muted'
                )}
              >
                {newPerson.isAlone ? '独居 ✓' : '独居'}
              </button>
              <button
                onClick={() => setNewPerson(p => ({ ...p, hasAC: !p.hasAC }))}
                className={cn(
                  'flex-1 py-4 rounded-2xl text-sm border transition-all active:scale-[0.98] font-medium',
                  newPerson.hasAC
                    ? 'bg-warm/15 border-warm/30 text-warm'
                    : 'bg-card-bg-light border-rule/60 text-ink-muted'
                )}
              >
                {newPerson.hasAC ? '有空调/供暖 ✓' : '有空调/供暖'}
              </button>
            </div>
          </div>
        </Card>

        <button
          onClick={handleAddPerson}
          disabled={!newPerson.nickname}
          className="w-full bg-gradient-to-r from-warm to-warm-dark text-white rounded-2xl py-4 font-bold text-lg active:scale-[0.98] transition-transform shadow-warm disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
        >
          添加
        </button>
      </div>
    );
  }

  if (showCareMessage) {
    const person = peopleWithRisk.find(p => p.id === showCareMessage);
    if (!person) return null;

    return (
      <div className="min-h-full px-5 pt-4 pb-8 animate-fade-in">
        <button onClick={() => setShowCareMessage(null)} className="flex items-center gap-1 text-ink-muted mb-5 active:opacity-60 transition-opacity">
          <ChevronLeft className="w-5 h-5" />
          返回
        </button>

        <h1 className="text-2xl font-bold mb-1">关怀提醒文案</h1>
        <p className="text-sm text-ink-muted mb-6">复制以下内容，发送给 {person.nickname}</p>

        <Card className="mb-4">
          <h3 className="font-bold text-base mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-warm rounded-full" />
            发送给 {person.nickname}
          </h3>
          <div className="text-sm leading-relaxed whitespace-pre-wrap text-gray-200 bg-card-bg-light/50 rounded-2xl p-4">
            {person.careMessage}
          </div>
        </Card>

        <button
          onClick={() => {
            if (person.phone) {
              window.location.href = `tel:${person.phone}`;
            }
          }}
          className={cn(
            'w-full rounded-2xl py-4 font-bold text-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2',
            person.phone
              ? 'bg-gradient-to-r from-warm to-warm-dark text-white shadow-warm'
              : 'bg-card-bg border border-rule/60 text-ink-muted cursor-not-allowed'
          )}
        >
          <Phone className="w-5 h-5" />
          {person.phone ? '拨打电话' : '未填写电话'}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-full px-5 pt-4 pb-8 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">关心的人</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="w-11 h-11 rounded-2xl bg-warm/15 flex items-center justify-center active:scale-90 transition-transform"
        >
          <Plus className="w-5 h-5 text-warm" />
        </button>
      </div>

      <p className="text-sm text-ink-muted mb-5">
        已添加 {people.length} 人 · {peopleWithRisk.filter(p => p.riskResult?.level === '极高' || p.riskResult?.level === '高').length} 人今日有风险
      </p>

      <div className="space-y-4">
        {peopleWithRisk.map(person => (
          <Card key={person.id} noPadding>
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold',
                    person.riskResult?.level === '极高' ? 'bg-heat-extreme/15 text-heat-extreme' :
                    person.riskResult?.level === '高' ? 'bg-heat-high/15 text-heat-high' :
                    'bg-warm/15 text-warm'
                  )}>
                    {person.nickname[0]}
                  </div>
                  <div>
                    <div className="font-bold text-base flex items-center gap-2">
                      {person.nickname}
                      <span className="text-xs text-ink-muted font-normal">{person.relation}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-ink-muted mt-1">
                      <MapPin className="w-3 h-3" />
                      {person.city}
                    </div>
                  </div>
                </div>
                {person.riskResult && (
                  <RiskBadge level={person.riskResult.level} size="sm" pulse={person.riskResult.level === '极高'} />
                )}
              </div>

              {/* 风险信息 - 柔和背景 */}
              {person.riskResult && (
                <div className="bg-card-bg-light/60 rounded-2xl p-3.5 mb-3.5">
                  <div className="text-sm flex items-start gap-2 leading-relaxed">
                    <ShieldAlert className="w-4 h-4 text-warm shrink-0 mt-0.5" />
                    <span className="text-gray-200">{person.careMessage}</span>
                  </div>
                </div>
              )}

              {/* 状态标签 */}
              <div className="flex items-center flex-wrap gap-2 mb-3.5">
                {person.isAlone && <span className="bg-card-bg-light text-gray-300 px-2.5 py-1 rounded-lg text-xs">独居</span>}
                {!person.hasAC && <span className="bg-heat-high/10 text-heat-high px-2.5 py-1 rounded-lg text-xs">无空调</span>}
                {person.healthTags.map(tag => (
                  <span key={tag} className="bg-card-bg-light text-gray-300 px-2.5 py-1 rounded-lg text-xs">{tag}</span>
                ))}
              </div>

              {/* 上次确认 */}
              <div className={cn(
                'text-xs mb-4 flex items-center gap-1.5',
                person.lastSafeCheck?.includes('今天') ? 'text-safe' : 'text-heat-high'
              )}>
                <Clock className="w-3.5 h-3.5" />
                {person.lastSafeCheck ? `上次确认: ${person.lastSafeCheck}` : '尚未确认今日安全'}
              </div>

              {/* 操作按钮 - 更大更易点击 */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleCheckSafe(person.id)}
                  className="flex items-center justify-center gap-1.5 py-3.5 rounded-2xl bg-safe/10 text-safe text-sm font-medium active:scale-95 transition-transform"
                >
                  <CheckCircle className="w-4 h-4" />
                  确认安全
                </button>
                <button
                  onClick={() => setShowCareMessage(person.id)}
                  className="flex items-center justify-center gap-1.5 py-3.5 rounded-2xl bg-warm/10 text-warm text-sm font-medium active:scale-95 transition-transform"
                >
                  <MessageCircle className="w-4 h-4" />
                  关怀提醒
                </button>
                <button
                  onClick={() => person.phone && (window.location.href = `tel:${person.phone}`)}
                  className={cn(
                    'flex items-center justify-center gap-1.5 py-3.5 rounded-2xl text-sm font-medium active:scale-95 transition-transform',
                    person.phone
                      ? 'bg-card-bg-light text-ink'
                      : 'bg-card-bg-light text-ink-muted cursor-not-allowed'
                  )}
                >
                  <Phone className="w-4 h-4" />
                  打电话
                </button>
              </div>
            </div>

            {/* 极高风险警示条 - 更醒目但不恐慌 */}
            {person.riskResult?.level === '极高' && (
              <div className="bg-heat-extreme/12 border-t-2 border-heat-extreme/30 px-5 py-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-heat-extreme" />
                <span className="text-xs text-heat-extreme font-medium">极高风险，建议立即联系确认安全</span>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
