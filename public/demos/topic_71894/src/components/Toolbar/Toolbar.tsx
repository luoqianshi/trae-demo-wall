import { useState, useRef, useEffect } from 'react';
import {
  Hand,
  MousePointer2,
  Pencil,
  Shapes,
  Undo2,
  Trash2,
  Download,
  Upload,
  Settings,
  MapPin,
  Heart,
  Circle,
  Star,
  Triangle,
  Square,
  Search,
  Zap,
  Locate,
  RotateCcw,
  Move,
  HelpCircle,
} from 'lucide-react';
import { useRouteStore } from '../../store/useRouteStore';
import type { DrawMode, ShapeType } from '../../types';
import { searchPlace, type SearchResult } from '../../utils/geocoding';
import { downloadGPX, generateGPX, readGPXFile } from '../../utils/gpx';
import { getEndpointStatuses } from '../../utils/osrm';

export function Toolbar() {
  const {
    drawMode,
    currentShape,
    snapStatus,
    rawPoints,
    stats,
    displayPoints,
    isSnapping,
    isProcessing,
    setDrawMode,
    setCurrentShape,
    setShapeSize,
    undoPoint,
    clearRoute,
    toggleSettingsPanel,
    toggleOnboarding,
    importRoute,
    shapeSize,
    snapRoute,
    generateSportsData,
  } = useRouteStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showShapes, setShowShapes] = useState(false);
  const [endpointStatus, setEndpointStatus] = useState<'ok' | 'degraded' | 'off' | 'unknown'>('unknown');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<number>();
  const shapesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateStatus = () => {
      const statuses = getEndpointStatuses();
      const now = Date.now();
      const available = statuses.filter((s) => s.cooldownUntil < now);
      
      if (snapStatus === 'success') {
        setEndpointStatus('ok');
      } else if (snapStatus === 'degraded') {
        setEndpointStatus('degraded');
      } else if (available.length > 0) {
        setEndpointStatus('ok');
      } else if (statuses.length > 0) {
        setEndpointStatus('off');
      }
    };

    updateStatus();
    const interval = setInterval(updateStatus, 3000);
    return () => clearInterval(interval);
  }, [snapStatus]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (shapesRef.current && !shapesRef.current.contains(e.target as Node)) {
        setShowShapes(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = window.setTimeout(async () => {
      const results = await searchPlace(query);
      setSearchResults(results);
    }, 300);
  };

  const handleSelectPlace = (result: SearchResult) => {
    setSearchQuery(result.display_name);
    setSearchResults([]);
    setShowSearch(false);
    
    const map = (window as any)._mapInstance;
    if (map) {
      map.setView([result.lat, result.lng], 15);
    }
  };

  const handleLocate = () => {
    const map = (window as any)._mapInstance;
    if (map && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          map.setView([pos.coords.latitude, pos.coords.longitude], 15);
        },
        () => {
          alert('无法获取您的位置');
        }
      );
    }
  };

  const handleExport = () => {
    if (displayPoints.length < 2) return;
    const gpx = generateGPX(displayPoints, stats, 'RouteForge Route');
    downloadGPX(gpx, `routeforge_${Date.now()}.gpx`);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const { points } = await readGPXFile(file);
      importRoute(points);
      
      if (points.length > 0) {
        const map = (window as any)._mapInstance;
        if (map) {
          const lats = points.map((p) => p.lat);
          const lngs = points.map((p) => p.lng);
          map.fitBounds([
            [Math.min(...lats), Math.min(...lngs)],
            [Math.max(...lats), Math.max(...lngs)],
          ], { padding: [50, 50] });
        }
      }
    } catch (err) {
      alert('导入 GPX 文件失败：' + (err as Error).message);
    }
    
    e.target.value = '';
  };

  const handleSnap = async () => {
    if (rawPoints.length < 2) return;
    await snapRoute();
    await generateSportsData();
  };

  const tools: { mode: DrawMode; icon: React.ReactNode; label: string; tooltip: string }[] = [
    { mode: 'pan', icon: <Hand size={18} />, label: '移动', tooltip: '移动浏览地图' },
    { mode: 'click', icon: <MousePointer2 size={18} />, label: '点选', tooltip: '逐点点击绘制路线' },
    { mode: 'free', icon: <Pencil size={18} />, label: '手绘', tooltip: '按住鼠标自由绘制' },
    { mode: 'edit', icon: <Move size={18} />, label: '编辑', tooltip: '编辑路线：拖拽/插入/删除点' },
  ];

  const shapes: { type: ShapeType; icon: React.ReactNode; label: string }[] = [
    { type: 'heart', icon: <Heart size={18} />, label: '爱心' },
    { type: 'circle', icon: <Circle size={18} />, label: '圆形' },
    { type: 'star', icon: <Star size={18} />, label: '星形' },
    { type: 'triangle', icon: <Triangle size={18} />, label: '三角形' },
    { type: 'square', icon: <Square size={18} />, label: '方形' },
  ];

  const statusColors = {
    ok: 'bg-emerald-500',
    degraded: 'bg-amber-500',
    off: 'bg-red-500',
    unknown: 'bg-slate-500',
  };

  const statusLabels = {
    ok: '服务正常',
    degraded: '降级模式',
    off: '服务不可用',
    unknown: '检测中',
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[1000] px-4 pt-4">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-4 rounded-2xl glass-panel px-4 py-2.5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 pr-3 border-r border-slate-700/50">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/30 animate-float">
                <MapPin size={18} className="text-white" />
              </div>
              <div>
                <span className="text-base font-bold text-white tracking-tight block leading-tight">RouteForge</span>
                <span className="text-[10px] text-slate-500 font-medium">跑步路线生成器</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 bg-slate-800/40 rounded-xl p-1">
              {tools.map((tool) => (
                <button
                  key={tool.mode}
                  onClick={() => setDrawMode(tool.mode)}
                  className={`tooltip-container p-2 rounded-lg transition-all duration-200 ${
                    drawMode === tool.mode && !currentShape
                      ? 'bg-white text-slate-900 shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                  data-tooltip={tool.tooltip}
                >
                  {tool.icon}
                </button>
              ))}
              
              <div className="w-px h-5 bg-slate-700/60 mx-1" />
              
              <div className="relative" ref={shapesRef}>
                <button
                  onClick={() => setShowShapes(!showShapes)}
                  className={`tooltip-container p-2 rounded-lg transition-all duration-200 ${
                    drawMode === 'shape' && currentShape
                      ? 'bg-gradient-to-br from-orange-500 to-pink-500 text-white shadow-md shadow-orange-500/25'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                  data-tooltip="形状模板：选择预设形状生成路线"
                >
                  <Shapes size={18} />
                </button>

                {showShapes && (
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 glass-panel rounded-xl p-2 min-w-[180px] z-50 animate-scale-in">
                    <div className="text-[11px] text-slate-500 px-2 py-1.5 font-medium flex items-center gap-1.5">
                      <Shapes size={12} />
                      选择形状
                    </div>
                    <div className="space-y-0.5">
                      {shapes.map((shape) => (
                        <button
                          key={shape.type}
                          onClick={() => {
                            setCurrentShape(shape.type);
                            setDrawMode('shape');
                            setShowShapes(false);
                          }}
                          className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all ${
                            currentShape === shape.type && drawMode === 'shape'
                              ? 'bg-orange-500/20 text-orange-400'
                              : 'text-slate-300 hover:bg-slate-800/70'
                          }`}
                        >
                          {shape.icon}
                          <span className="font-medium">{shape.label}</span>
                        </button>
                      ))}
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-700/40 px-2">
                      <div className="flex justify-between text-[11px] text-slate-500 mb-1.5">
                        <span>形状大小</span>
                        <span className="text-slate-300 font-medium">{shapeSize}m</span>
                      </div>
                      <input
                        type="range"
                        min="100"
                        max="3000"
                        step="50"
                        value={shapeSize}
                        onChange={(e) => setShapeSize(parseInt(e.target.value))}
                        className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                        style={{ accentColor: '#f97316' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="w-px h-8 bg-slate-700/50 mx-1" />

            <div className="relative">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className={`tooltip-container p-2 rounded-lg transition-all duration-200 ${
                  showSearch
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
                data-tooltip="搜索地点"
              >
                <Search size={18} />
              </button>
              
              {showSearch && (
                <div className="absolute top-full mt-2 right-0 w-80 glass-panel rounded-xl overflow-hidden z-50 animate-scale-in">
                  <div className="p-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder="搜索城市、地址、地标..."
                      className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700/40 rounded-lg text-sm text-white placeholder-slate-500 outline-none focus:border-sky-500/50 transition-colors"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  {searchResults.length > 0 && (
                    <div className="max-h-72 overflow-y-auto border-t border-slate-700/30">
                      {searchResults.map((result) => (
                        <button
                          key={result.place_id}
                          onClick={() => handleSelectPlace(result)}
                          className="w-full px-3 py-2.5 text-left text-xs text-slate-300 hover:bg-slate-800/70 transition-colors border-b border-slate-800/40 last:border-0"
                        >
                          {result.display_name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handleLocate}
              className="tooltip-container p-2 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all duration-200"
              data-tooltip="定位到当前位置"
            >
              <Locate size={18} />
            </button>

            <div className="w-px h-8 bg-slate-700/50 mx-1" />

            <button
              onClick={undoPoint}
              disabled={rawPoints.length === 0}
              className="tooltip-container p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-slate-400 disabled:hover:bg-transparent"
              data-tooltip="撤销上一步 (绘制时右键也可撤销)"
            >
              <Undo2 size={18} />
            </button>

            <button
              onClick={clearRoute}
              disabled={rawPoints.length === 0 && displayPoints.length === 0}
              className="tooltip-container p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-slate-400 disabled:hover:bg-transparent"
              data-tooltip="清除路线"
            >
              <Trash2 size={18} />
            </button>

            <div className="w-px h-8 bg-slate-700/50 mx-1" />

            <button
              onClick={handleSnap}
              disabled={rawPoints.length < 2 || isSnapping}
              className={`tooltip-container flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                rawPoints.length < 2 || isSnapping
                  ? 'bg-slate-800/40 text-slate-500 cursor-not-allowed'
                  : 'btn-primary'
              }`}
              data-tooltip="吸附到步行道路：将绘制轨迹匹配到真实道路"
            >
              {isSnapping ? (
                <RotateCcw size={16} className="animate-spin" />
              ) : (
                <Zap size={16} />
              )}
              <span>吸附道路</span>
            </button>

            <div className="w-px h-8 bg-slate-700/50 mx-1" />

            <input
              ref={fileInputRef}
              type="file"
              accept=".gpx"
              onChange={handleImport}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="tooltip-container p-2 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all duration-200"
              data-tooltip="导入 GPX 文件"
            >
              <Upload size={18} />
            </button>

            <button
              onClick={handleExport}
              disabled={displayPoints.length < 2 || isProcessing}
              className={`tooltip-container flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
                displayPoints.length >= 2 && !isProcessing ? 'btn-success' : 'bg-slate-800/40 text-slate-500'
              }`}
              data-tooltip="导出 GPX 文件，可导入手表/Strava等"
            >
              <Download size={16} />
              <span>导出</span>
            </button>

            <div className="w-px h-8 bg-slate-700/50 mx-1" />

            <button
              onClick={toggleOnboarding}
              className="tooltip-container p-2 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-all duration-200"
              data-tooltip="使用帮助"
            >
              <HelpCircle size={18} />
            </button>

            <button
              onClick={toggleSettingsPanel}
              className="tooltip-container p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200"
              data-tooltip="设置"
            >
              <Settings size={18} />
            </button>

            <div className="flex items-center gap-2 ml-2 pl-3 border-l border-slate-700/50">
              <div className={`tooltip-container w-2 h-2 rounded-full ${statusColors[endpointStatus]} ${endpointStatus === 'ok' ? 'animate-pulse-soft' : ''}`} data-tooltip={statusLabels[endpointStatus]} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
