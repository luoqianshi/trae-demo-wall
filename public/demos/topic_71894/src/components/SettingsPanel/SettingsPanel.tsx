import { useState } from 'react';
import { X, Heart, Footprints, Scale, Timer, Map, Sliders, Plus, Trash2, Check, Globe, Info } from 'lucide-react';
import { useRouteStore, TILE_LAYER_PRESETS } from '../../store/useRouteStore';
import { SliderControl, ToggleSwitch } from '../ui/SliderControl';

export function SettingsPanel() {
  const {
    settings,
    isSettingsPanelOpen,
    toggleSettingsPanel,
    updateSettings,
    addOsrmEndpoint,
    removeOsrmEndpoint,
  } = useRouteStore();

  const [newEndpoint, setNewEndpoint] = useState('');
  const [customTileUrl, setCustomTileUrl] = useState(settings.customTileUrl);

  const handleAddEndpoint = () => {
    if (newEndpoint.trim()) {
      addOsrmEndpoint(newEndpoint);
      setNewEndpoint('');
    }
  };

  const handleCustomTileSave = () => {
    updateSettings({ customTileUrl: customTileUrl.trim() });
  };

  const tileOptions = [
    ...TILE_LAYER_PRESETS,
    { id: 'custom', name: '自定义瓦片', url: '', attribution: '', maxZoom: 19, dark: false },
  ];

  return (
    <div
      className={`fixed top-0 right-0 h-full w-80 z-[1001] transform transition-transform duration-300 ease-out ${
        isSettingsPanelOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="h-full glass-panel border-l-0 shadow-2xl overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/40 sticky top-0 bg-slate-900/95 backdrop-blur-xl z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center">
              <Sliders size={16} className="text-sky-400" />
            </div>
            <span className="text-lg font-semibold text-white">设置</span>
          </div>
          <button
            onClick={toggleSettingsPanel}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/70 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-6">
          <div className="space-y-4">
            <SectionHeader icon={<Globe size={16} className="text-cyan-400" />} title="地图瓦片" />

            <div className="space-y-2">
              {tileOptions.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => updateSettings({ tileLayerId: preset.id })}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm transition-all ${
                    settings.tileLayerId === preset.id
                      ? 'bg-sky-500/15 border border-sky-500/40 text-white'
                      : 'bg-slate-800/40 border border-transparent text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    {preset.dark && (
                      <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-lg shadow-indigo-400/50" title="暗色主题" />
                    )}
                    {preset.name}
                  </span>
                  {settings.tileLayerId === preset.id && (
                    <Check size={16} className="text-sky-400" />
                  )}
                </button>
              ))}
            </div>

            {settings.tileLayerId === 'custom' && (
              <div className="space-y-2 p-3 bg-slate-800/30 rounded-xl border border-slate-700/30">
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Info size={12} />
                  支持 {'{z}'}/{'{x}'}/{'{y}'} 占位符
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customTileUrl}
                    onChange={(e) => setCustomTileUrl(e.target.value)}
                    placeholder="https://tile.example.com/{z}/{x}/{y}.png"
                    className="flex-1 bg-slate-800 border border-slate-700/50 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/50 font-mono transition-colors"
                  />
                  <button
                    onClick={handleCustomTileSave}
                    className="px-3 py-2 bg-sky-500 text-white rounded-lg text-xs font-medium hover:bg-sky-400 transition-colors"
                  >
                    应用
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-700/40 pt-6 space-y-4">
            <SectionHeader icon={<Heart size={16} className="text-red-400" />} title="心率设置" />
            <SliderControl
              label="基础心率"
              value={settings.baseHeartRate}
              min={40}
              max={90}
              unit=" bpm"
              color="#ef4444"
              onChange={(v) => updateSettings({ baseHeartRate: v })}
            />
            <SliderControl
              label="最高心率"
              value={settings.maxHeartRate}
              min={150}
              max={220}
              unit=" bpm"
              color="#ef4444"
              onChange={(v) => updateSettings({ maxHeartRate: v })}
            />
          </div>

          <div className="border-t border-slate-700/40 pt-6 space-y-4">
            <SectionHeader icon={<Footprints size={16} className="text-violet-400" />} title="步频设置" />
            <SliderControl
              label="目标步频"
              value={settings.targetCadence}
              min={150}
              max={200}
              unit=" spm"
              color="#a855f7"
              onChange={(v) => updateSettings({ targetCadence: v })}
            />
          </div>

          <div className="border-t border-slate-700/40 pt-6 space-y-4">
            <SectionHeader icon={<Timer size={16} className="text-orange-400" />} title="配速设置" />
            <SliderControl
              label="基础配速"
              value={settings.basePace}
              min={4}
              max={12}
              step={0.5}
              unit=" min/km"
              color="#f97316"
              onChange={(v) => updateSettings({ basePace: v })}
            />
          </div>

          <div className="border-t border-slate-700/40 pt-6 space-y-4">
            <SectionHeader icon={<Scale size={16} className="text-emerald-400" />} title="体重设置" />
            <SliderControl
              label="体重"
              value={settings.weight}
              min={40}
              max={120}
              unit=" kg"
              color="#10b981"
              onChange={(v) => updateSettings({ weight: v })}
            />
          </div>

          <div className="border-t border-slate-700/40 pt-6 space-y-4">
            <SectionHeader icon={<Map size={16} className="text-sky-400" />} title="路线与吸附" />
            
            <ToggleSwitch
              label="自动闭合路线"
              checked={settings.autoClose}
              onChange={(v) => updateSettings({ autoClose: v })}
            />

            <SliderControl
              label="自动闭合阈值"
              value={settings.autoCloseThreshold}
              min={10}
              max={200}
              unit="m"
              color="#0ea5e9"
              onChange={(v) => updateSettings({ autoCloseThreshold: v })}
            />

            <div className="space-y-2">
              <div className="text-xs text-slate-400">海拔数据来源</div>
              <div className="flex gap-2 p-1 bg-slate-800/40 rounded-xl">
                <button
                  onClick={() => updateSettings({ elevationProvider: 'simulated' })}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                    settings.elevationProvider === 'simulated'
                      ? 'bg-slate-700 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  模拟生成
                </button>
                <button
                  onClick={() => updateSettings({ elevationProvider: 'api' })}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                    settings.elevationProvider === 'api'
                      ? 'bg-slate-700 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  API 获取
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-700/40 pt-6 space-y-3">
            <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <Globe size={14} />
              OSRM 服务端点
            </div>
            <div className="space-y-2">
              {settings.osrmEndpoints.map((endpoint, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-slate-800/40 rounded-xl px-3 py-2.5 group hover:bg-slate-800/60 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="flex-1 text-xs text-slate-300 font-mono truncate">
                    {endpoint}
                  </span>
                  <button
                    onClick={() => removeOsrmEndpoint(idx)}
                    className="p-1 rounded-lg opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    title="删除端点"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newEndpoint}
                onChange={(e) => setNewEndpoint(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddEndpoint()}
                placeholder="https://your-osrm-server.com"
                className="flex-1 bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/50 font-mono transition-colors"
              />
              <button
                onClick={handleAddEndpoint}
                className="px-3 py-2.5 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 hover:text-white transition-colors"
                title="添加端点"
              >
                <Plus size={16} />
              </button>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              道路吸附服务按顺序尝试，失败自动切换到下一个端点。你可以添加自己搭建的 OSRM 服务提高稳定性。
            </p>
          </div>

          <div className="h-4" />
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
      {icon}
      {title}
    </div>
  );
}
