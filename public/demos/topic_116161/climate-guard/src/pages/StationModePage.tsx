import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Users, Clock, ShieldAlert, CheckCircle, 
  AlertTriangle, ThermometerSun, Wind, Phone, Send
} from 'lucide-react';
import { cn } from '../utils/cn';
import { defaultTeam } from '../data/mockData';
import { getCityWeather } from '../utils/riskEngine';
import { generateWorkScheduleAdvice } from '../utils/riskEngine';
import Card from '../components/Card';
import RiskBadge from '../components/RiskBadge';

export default function StationModePage() {
  const navigate = useNavigate();
  const [team, setTeam] = useState(defaultTeam);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);

  const weather = useMemo(() => getCityWeather(team.city).current, [team.city]);
  const schedule = useMemo(() => generateWorkScheduleAdvice(team, weather), [team, weather]);

  const checkInMember = (id: string) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    setTeam(prev => ({
      ...prev,
      members: prev.members.map(m => 
        m.id === id ? { ...m, lastCheckIn: timeStr, status: '正常' as const } : m
      )
    }));
  };

  const riskCount = team.members.filter(m => m.riskResult.level === '极高' || m.riskResult.level === '高').length;
  const abnormalCount = team.members.filter(m => m.status === '异常').length;

  // 通用返回 + warm 标题
  const renderSubHeader = (title: string, onBack: () => void) => (
    <>
      <button onClick={onBack} className="flex items-center gap-1 text-ink-muted mb-5 active:opacity-60">
        <ChevronLeft className="w-5 h-5" />
        返回
      </button>
      <h1 className="text-xl font-bold mb-6 flex items-center gap-2">
        <span className="w-1 h-5 bg-warm rounded-full" />
        {title}
      </h1>
    </>
  );

  if (showSchedule) {
    return (
      <div className="min-h-full px-5 pt-4 pb-8 animate-fade-in">
        {renderSubHeader('排班建议', () => setShowSchedule(false))}
        
        <div className="space-y-4">
          <Card>
            <h3 className="font-bold text-base mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-warm" />
              高风险时段
            </h3>
            <div className="space-y-2">
              {schedule.highRiskHours.map((h, i) => (
                <div key={i} className="text-heat-high font-medium">{h}</div>
              ))}
              {schedule.highRiskHours.length === 0 && <div className="text-ink-muted">无明显高风险时段</div>}
            </div>
          </Card>

          <Card>
            <h3 className="font-bold text-base mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-warm" />
              休息频率
            </h3>
            <p className="text-lg font-bold text-warm">{schedule.restFrequency || '暂无建议'}</p>
          </Card>

          <Card>
            <h3 className="font-bold text-base mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-warm" />
              最长班次
            </h3>
            <p className="text-lg font-bold">{schedule.maxShiftLength || '暂无限制'}</p>
          </Card>

          <Card>
            <h3 className="font-bold text-base mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warm" />
              特别提示
            </h3>
            <p className="text-sm leading-relaxed text-gray-300">{schedule.specialNotes || '暂无特别提示'}</p>
          </Card>
        </div>
      </div>
    );
  }

  if (showChecklist) {
    return (
      <div className="min-h-full px-5 pt-4 pb-8 animate-fade-in">
        {renderSubHeader('装备检查清单', () => setShowChecklist(false))}
        
        <Card>
          <div className="space-y-3">
            {schedule.gearChecklist.length > 0 ? schedule.gearChecklist.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3.5 bg-card-bg-light rounded-2xl">
                <div className="w-7 h-7 rounded-xl bg-warm/15 flex items-center justify-center text-xs font-bold text-warm">
                  {i + 1}
                </div>
                <span className="text-sm">{item}</span>
              </div>
            )) : (
              <p className="text-ink-muted text-sm">当前天气无需特殊装备</p>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-full px-5 pt-4 pb-8 animate-fade-in">
      <button onClick={() => navigate('/profile')} className="flex items-center gap-1 text-ink-muted mb-5 active:opacity-60">
        <ChevronLeft className="w-5 h-5" />
        返回
      </button>

      {/* 站点头部 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="w-1 h-5 bg-warm rounded-full" />
            {team.name}
          </h1>
          <p className="text-sm text-ink-muted mt-1 ml-3">{team.type} · {team.city}</p>
        </div>
        <button 
          onClick={() => setShowSchedule(true)}
          className="px-4 py-2.5 rounded-2xl bg-warm/10 border border-warm/20 text-warm text-xs font-medium active:scale-95 transition-transform"
        >
          排班建议
        </button>
      </div>

      {/* 今日概况 — 更大气 */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-card-bg rounded-3xl p-4 text-center border border-rule/40 card-shadow">
          <div className="text-3xl font-bold text-warm">{team.members.length}</div>
          <div className="text-xs text-ink-muted mt-1">班组成员</div>
        </div>
        <div className="bg-card-bg rounded-3xl p-4 text-center border border-rule/40 card-shadow">
          <div className="text-3xl font-bold text-heat-high">{riskCount}</div>
          <div className="text-xs text-ink-muted mt-1">高风险</div>
        </div>
        <div className="bg-card-bg rounded-3xl p-4 text-center border border-rule/40 card-shadow">
          <div className="text-3xl font-bold text-heat-medium">{abnormalCount}</div>
          <div className="text-xs text-ink-muted mt-1">需关注</div>
        </div>
      </div>

      {/* 天气概要 */}
      <Card className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ThermometerSun className={cn(
              'w-8 h-8',
              weather.temperature >= 30 ? 'text-heat-high' : 
              weather.temperature <= 5 ? 'text-cold-high' : 'text-safe'
            )} />
            <div>
              <div className="text-2xl font-bold">{weather.temperature}°C</div>
              <div className="text-xs text-ink-muted">体感 {weather.feelsLike}°C</div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-xs text-ink-muted mb-1.5">
              <Wind className="w-3 h-3" />
              {weather.windSpeed}km/h
            </div>
            <RiskBadge level={getCityWeather(team.city).riskLevel} mode={getCityWeather(team.city).riskMode} size="sm" />
          </div>
        </div>
      </Card>

      {/* 快捷操作 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button 
          onClick={() => setShowSchedule(true)}
          className="bg-card-bg rounded-3xl p-4 text-left border border-rule/40 card-shadow active:scale-[0.98] transition-transform"
        >
          <Clock className="w-5 h-5 text-warm mb-2" />
          <div className="text-sm font-bold">排班建议</div>
        </button>
        <button 
          onClick={() => setShowChecklist(true)}
          className="bg-card-bg rounded-3xl p-4 text-left border border-rule/40 card-shadow active:scale-[0.98] transition-transform"
        >
          <ShieldAlert className="w-5 h-5 text-warm mb-2" />
          <div className="text-sm font-bold">装备清单</div>
        </button>
      </div>

      {/* 成员列表 */}
      <h3 className="font-bold text-base flex items-center gap-2 mb-3 px-1">
        <span className="w-1 h-5 bg-warm rounded-full" />
        班组成员
      </h3>
      <div className="space-y-3">
        {team.members.map(member => (
          <Card key={member.id} noPadding>
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-12 h-12 rounded-2xl flex items-center justify-center text-base font-bold',
                    member.status === '异常' ? 'bg-heat-extreme/20 text-heat-extreme' :
                    member.status === '需关注' ? 'bg-heat-medium/20 text-heat-medium' :
                    'bg-gradient-to-br from-warm to-warm-dark text-white'
                  )}>
                    {member.name[0]}
                  </div>
                  <div>
                    <div className="font-bold text-sm flex items-center gap-2">
                      {member.name}
                      <span className="text-xs text-ink-muted font-normal">{member.role}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn(
                        'flex items-center gap-1 text-xs',
                        member.status === '异常' ? 'text-heat-extreme' :
                        member.status === '需关注' ? 'text-heat-medium' :
                        'text-safe'
                      )}>
                        <span className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          member.status === '异常' ? 'bg-heat-extreme' :
                          member.status === '需关注' ? 'bg-heat-medium' :
                          'bg-safe'
                        )} />
                        {member.status}
                      </span>
                      <span className="text-xs text-gray-600">·</span>
                      <span className="text-xs text-ink-muted">
                        签到 {member.lastCheckIn || '未签到'}
                      </span>
                    </div>
                  </div>
                </div>
                <RiskBadge level={member.riskResult.level} size="sm" pulse={member.riskResult.level === '极高'} />
              </div>

              {/* 风险原因 — 更清晰 */}
              {member.riskResult.reasons.length > 0 && (
                <div className="bg-card-bg-light rounded-2xl p-3 mb-3">
                  <div className="text-xs text-ink-muted space-y-1">
                    {member.riskResult.reasons.slice(0, 2).map((r, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-warm" />
                        {r}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 操作 */}
              <div className="flex gap-2">
                <button 
                  onClick={() => checkInMember(member.id)}
                  className="flex-1 py-3 rounded-2xl bg-safe/10 text-safe text-sm font-medium active:scale-95 transition-transform"
                >
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  确认签到
                </button>
                {member.phone && (
                  <button 
                    onClick={() => window.location.href = `tel:${member.phone}`}
                    className="px-4 py-3 rounded-2xl bg-card-bg-light text-warm text-sm font-medium active:scale-95 transition-transform"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {member.status === '异常' && (
              <div className="bg-heat-extreme/10 border-t border-heat-extreme/20 px-5 py-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-heat-extreme" />
                <span className="text-xs text-heat-extreme">建议立即联系确认</span>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* 一键生成班组提醒 — warm 渐变 */}
      <button 
        onClick={() => alert(`班组冷热风险提醒已生成：\n\n${team.name}今日${getCityWeather(team.city).riskMode}${getCityWeather(team.city).riskLevel}风险。\n\n${schedule.specialNotes}\n\n请各成员注意休息频率：${schedule.restFrequency}\n\n(实际应用将发送至企业微信/短信)`)}
        className="w-full mt-4 bg-gradient-to-r from-warm to-warm-dark text-white rounded-3xl py-4 font-bold text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-glow"
      >
        <Send className="w-5 h-5" />
        一键生成班组提醒
      </button>

      <div className="text-center text-xs text-gray-600 py-6">
        站点负责人模式 · 数据仅存本地
      </div>
    </div>
  );
}
