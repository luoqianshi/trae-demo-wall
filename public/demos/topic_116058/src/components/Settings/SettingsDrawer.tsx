import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, X, RotateCcw, Volume2, VolumeX, Sparkles, Clock, Zap, Flame, Plane, Sun, Snowflake, GraduationCap } from 'lucide-react';
import { useSettingsStore, VACATION_MODES } from '@/store/settingsStore';
import { useScheduleStore } from '@/store/scheduleStore';
import { useUserStore } from '@/store/userStore';
import { cn } from '@/lib/utils';
import type { VacationMode } from '@/types';

export default function SettingsDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { pomodoroDuration, breakDuration, buffTime, examSprintMode, vacationMode, soundEnabled, animationEnabled, update, reset } = useSettingsStore();
  const { applyVacationMode } = useScheduleStore();
  const { profile, setProfile } = useUserStore();

  // 假期日期编辑用的本地状态（未设置或已跳过时显示占位）
  const isSummerSet = profile.summerVacationStart && profile.summerVacationStart !== 'skipped';
  const isWinterSet = profile.winterVacationStart && profile.winterVacationStart !== 'skipped';

  const handleReset = () => {
    reset();
  };

  const handleVacationMode = (mode: VacationMode) => {
    update({ vacationMode: mode });
    applyVacationMode(mode);
  };

  // 重新观看新手引导：手动触发，仅点击后才会重新启动引导
  // 将 onboardingCompleted 置为 false 后导航到固定作息页，引导覆盖层会自动启动
  const handleReplayOnboarding = () => {
    setProfile({ onboardingCompleted: false });
    setIsOpen(false);
    navigate('/routine');
  };

  return (
    <>
      {/* 悬浮设置按钮 */}
      <button
        onClick={() => setIsOpen(true)}
        className="btn-press fixed bottom-20 left-4 z-30 w-12 h-12 rounded-full bg-warm-light shadow-puffy border-2 border-corgi-yellow/30 flex items-center justify-center text-corgi-dark hover:bg-corgi-yellow/20 transition-colors"
      >
        <SettingsIcon size={22} />
      </button>

      {/* 抽屉 */}
      {isOpen && (
        <>
          {/* 遮罩 */}
          <div
            className="fixed inset-0 z-40 bg-black/20 animate-pop-in"
            onClick={() => setIsOpen(false)}
          />

          {/* 抽屉内容 */}
          <div className="fixed bottom-0 left-0 right-0 z-50 animate-fade-up">
            <div className="bg-warm-light rounded-t-puffy shadow-puffy border-t-4 border-corgi-yellow/40 max-h-[75vh] overflow-y-auto">
              {/* 拖拽指示器 */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-12 h-1.5 bg-corgi-yellow/40 rounded-full" />
              </div>

              {/* 标题栏 */}
              <div className="flex items-center gap-2 px-6 py-3 border-b-2 border-corgi-yellow/15 sticky top-0 bg-warm-light z-10">
                <SettingsIcon size={22} className="text-corgi-orange" />
                <h2 className="font-display text-lg text-text-primary">设置</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="ml-auto w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* 设置内容 */}
              <div className="px-6 py-4 pb-8 space-y-5">
                {/* 长假模式 */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Plane size={18} className="text-corgi-orange" />
                    <h3 className="font-bold text-text-primary">假期模式</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(VACATION_MODES) as VacationMode[]).map((mode) => {
                      const config = VACATION_MODES[mode];
                      const isActive = vacationMode === mode;
                      return (
                        <button
                          key={mode}
                          onClick={() => handleVacationMode(mode)}
                          className={cn(
                            'btn-press flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all',
                            isActive
                              ? 'border-corgi-orange bg-corgi-orange/10 shadow-soft'
                              : 'border-corgi-yellow/20 bg-warm-cream/50 hover:border-corgi-yellow/40'
                          )}
                        >
                          <span className="text-2xl">{config.icon}</span>
                          <span className={cn('text-xs font-bold', isActive ? 'text-corgi-dark' : 'text-text-secondary')}>
                            {config.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {vacationMode !== 'normal' && (
                    <p className="text-xs text-text-secondary mt-2 px-1">
                      {VACATION_MODES[vacationMode].desc}
                    </p>
                  )}
                </div>

                {/* 假期日期范围设置（可重新配置，跳过推荐后也可在此恢复） */}
                <div className="space-y-3">
                  {/* 暑假日期 */}
                  <div className="bg-warm-cream/60 rounded-2xl p-3 border-2 border-corgi-yellow/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Sun size={16} className="text-corgi-orange" />
                      <span className="text-sm font-bold text-text-primary">暑假日期范围</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-text-secondary font-bold block mb-1">开始</label>
                        <input
                          type="date"
                          value={isSummerSet ? profile.summerVacationStart : ''}
                          onChange={(e) => setProfile({ summerVacationStart: e.target.value || undefined, summerVacationEnd: e.target.value ? (profile.summerVacationEnd && profile.summerVacationEnd !== 'skipped' ? profile.summerVacationEnd : e.target.value) : undefined })}
                          className="w-full px-2 py-1.5 rounded-lg border-2 border-corgi-yellow/30 bg-warm-light text-xs font-bold focus:outline-none focus:border-corgi-orange"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-text-secondary font-bold block mb-1">结束</label>
                        <input
                          type="date"
                          value={isSummerSet ? profile.summerVacationEnd : ''}
                          onChange={(e) => setProfile({ summerVacationEnd: e.target.value || undefined })}
                          className="w-full px-2 py-1.5 rounded-lg border-2 border-corgi-yellow/30 bg-warm-light text-xs font-bold focus:outline-none focus:border-corgi-orange"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 寒假日期 */}
                  <div className="bg-warm-cream/60 rounded-2xl p-3 border-2 border-corgi-yellow/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Snowflake size={16} className="text-mint-deep" />
                      <span className="text-sm font-bold text-text-primary">寒假日期范围</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-text-secondary font-bold block mb-1">开始</label>
                        <input
                          type="date"
                          value={isWinterSet ? profile.winterVacationStart : ''}
                          onChange={(e) => setProfile({ winterVacationStart: e.target.value || undefined, winterVacationEnd: e.target.value ? (profile.winterVacationEnd && profile.winterVacationEnd !== 'skipped' ? profile.winterVacationEnd : e.target.value) : undefined })}
                          className="w-full px-2 py-1.5 rounded-lg border-2 border-corgi-yellow/30 bg-warm-light text-xs font-bold focus:outline-none focus:border-corgi-orange"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-text-secondary font-bold block mb-1">结束</label>
                        <input
                          type="date"
                          value={isWinterSet ? profile.winterVacationEnd : ''}
                          onChange={(e) => setProfile({ winterVacationEnd: e.target.value || undefined })}
                          className="w-full px-2 py-1.5 rounded-lg border-2 border-corgi-yellow/30 bg-warm-light text-xs font-bold focus:outline-none focus:border-corgi-orange"
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-text-light px-1">设置日期范围后，假期内将自动切换到轻松模式；清空日期可重新触发推荐。</p>
                </div>

                {/* 时长设置 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <SliderSetting
                    icon={Clock}
                    label="专注时长"
                    value={pomodoroDuration}
                    min={5}
                    max={60}
                    unit="分钟"
                    onChange={(v) => update({ pomodoroDuration: v })}
                  />
                  <SliderSetting
                    icon={Zap}
                    label="休息时长"
                    value={breakDuration}
                    min={3}
                    max={30}
                    unit="分钟"
                    onChange={(v) => update({ breakDuration: v })}
                  />
                  <SliderSetting
                    icon={Sparkles}
                    label="缓冲时间"
                    value={buffTime}
                    min={0}
                    max={30}
                    unit="分钟"
                    onChange={(v) => update({ buffTime: v })}
                  />
                </div>

                {/* 开关设置 */}
                <div className="flex flex-wrap items-center gap-3 pt-2 border-t-2 border-corgi-yellow/15">
                  <ToggleSetting
                    label="考前突击"
                    icon={Flame}
                    checked={examSprintMode}
                    onChange={(v) => update({ examSprintMode: v })}
                  />
                  <ToggleSetting
                    label="音效"
                    icon={soundEnabled ? Volume2 : VolumeX}
                    checked={soundEnabled}
                    onChange={(v) => update({ soundEnabled: v })}
                  />
                  <ToggleSetting
                    label="动画效果"
                    icon={Sparkles}
                    checked={animationEnabled}
                    onChange={(v) => update({ animationEnabled: v })}
                  />

                  <button
                    onClick={handleReset}
                    className="btn-press flex items-center gap-2 px-4 py-2 rounded-xl bg-berry-pink/15 text-berry-rose font-bold text-sm hover:bg-berry-pink/25 transition-colors"
                  >
                    <RotateCcw size={16} />
                    恢复默认
                  </button>
                </div>

                {/* 重新观看新手引导：手动触发，点击后才会重新启动引导流程 */}
                <div className="pt-3 border-t-2 border-corgi-yellow/15">
                  <button
                    onClick={handleReplayOnboarding}
                    className="btn-press w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-corgi-orange/10 text-corgi-dark font-bold text-sm hover:bg-corgi-orange/20 transition-colors border-2 border-corgi-orange/30"
                  >
                    <GraduationCap size={16} />
                    重新观看新手引导
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function SliderSetting({
  icon: Icon,
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  icon: typeof Clock;
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="bg-warm-cream/60 rounded-2xl p-4 border-2 border-corgi-yellow/20">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={18} className="text-corgi-orange" />
        <span className="text-sm font-bold text-text-primary">{label}</span>
        <span className="ml-auto text-sm font-bold text-corgi-orange">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-corgi-yellow/30 rounded-full appearance-none cursor-pointer accent-corgi-orange"
      />
    </div>
  );
}

function ToggleSetting({
  label,
  icon: Icon,
  checked,
  onChange,
}: {
  label: string;
  icon: typeof Clock;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        'btn-press flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-colors',
        checked
          ? 'bg-corgi-orange/20 text-corgi-dark'
          : 'bg-gray-200/60 text-gray-400'
      )}
    >
      <Icon size={16} />
      {label}
      <div className={cn('w-9 h-5 rounded-full relative transition-colors', checked ? 'bg-corgi-orange' : 'bg-gray-300')}>
        <div className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all', checked ? 'left-4' : 'left-0.5')} />
      </div>
    </button>
  );
}
