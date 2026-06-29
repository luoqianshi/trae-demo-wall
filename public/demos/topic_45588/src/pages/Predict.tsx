import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { predictData, timeRangeOptions } from '@/data/predict';
import type { TimeRangeKey } from '@/types';

export default function Predict() {
  const navigate = useNavigate();
  const [selectedKey, setSelectedKey] = useState<TimeRangeKey | null>(null);
  const [customInput, setCustomInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<typeof predictData[keyof typeof predictData] | null>(null);

  const handleSelect = (key: TimeRangeKey) => {
    setSelectedKey(key);
    setCustomInput(timeRangeOptions.find(o => o.key === key)?.label || '');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomInput(val);
    const matched = timeRangeOptions.find(o => {
      const lbl = o.label.toLowerCase();
      const v = val.toLowerCase().trim();
      return lbl.includes(v) || v.includes(lbl.replace('小时', '')) || v === o.key;
    });
    setSelectedKey(matched ? matched.key : null);
  };

  const handlePredict = () => {
    if (!selectedKey || loading) return;
    setLoading(true);
    setResult(null);
    setTimeout(() => {
      setResult(predictData[selectedKey]);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="page overflow-hidden">
      {/* 顶部装饰 */}
      <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-[#D0F5E4] opacity-50 pointer-events-none" />

      {/* 导航栏 */}
      <div className="flex items-center gap-3 mb-6 relative">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center bg-white rounded-2xl shadow-sm hover:shadow-md active:scale-95 transition-all duration-200"
        >
          <span className="text-gray-500 text-lg">←</span>
        </button>
        <h1 className="text-lg font-bold text-gray-800">智能搜寻推荐</h1>
      </div>

      {/* 说明卡片 */}
      <div className="card text-center mb-6 relative overflow-hidden">
        <div className="flex justify-center mb-4">
          <img
            src="/images/predict-cat.jpg"
            alt="受惊的猫咪"
            className="w-28 h-28 rounded-3xl object-cover"
            style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
          />
        </div>
        <p className="text-gray-700 font-medium mb-1">小猫咪在外面一定很害怕...</p>
        <p className="text-sm text-gray-400">快告诉我们走失多久了，帮你找到它可能躲藏的地方</p>
      </div>

      {/* 输入区 */}
      <div className="card mb-5">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
          <span>🕐</span> 走失时长（小时）
        </label>
        <input
          type="text"
          className="input-box mb-4"
          placeholder="例如：24 或 1-3"
          value={customInput}
          onChange={handleInputChange}
        />
        <div className="flex flex-wrap gap-2">
          {timeRangeOptions.map(opt => (
            <button
              key={opt.key}
              onClick={() => handleSelect(opt.key)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95"
              style={selectedKey === opt.key
                ? { background: 'linear-gradient(135deg, #3DD598, #2ECB7A)', color: 'white', boxShadow: '0 2px 8px rgba(61,213,152,0.3)' }
                : { background: '#F5F5F5', color: '#666' }
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 推算按钮 */}
      <button
        onClick={handlePredict}
        disabled={!selectedKey || loading}
        className="btn-green mb-6"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            正在分析数据...
          </span>
        ) : '开始推算'}
      </button>

      {/* 结果展示 */}
      {result && (
        <div className="space-y-4 animate-fade-in">
          {/* 置信度卡片 */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-700">数据分析置信度</span>
              <span className="text-lg font-bold" style={{ color: '#E85A4F' }}>{result.confidence}%</span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${result.confidence}%`,
                  background: 'linear-gradient(90deg, #3DD598, #2ECB7A)'
                }}
              />
            </div>
          </div>

          {/* 可能藏匿的位置 */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">📍</span>
              <h3 className="text-base font-bold text-gray-800">可能藏匿的地方</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {result.possibleLocations.map((loc, i) => (
                <span key={i} className="px-4 py-2 rounded-xl text-sm font-medium"
                  style={{ background: '#FFF5F0', color: '#E85A4F' }}>
                  {loc}
                </span>
              ))}
            </div>
          </div>

          {/* 搜寻建议 */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">💡</span>
              <h3 className="text-base font-bold text-gray-800">搜寻建议</h3>
            </div>
            <div className="space-y-2.5">
              {result.tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: 'linear-gradient(135deg, #FFC078, #FFA94D)', color: 'white', fontSize: '0.75rem', fontWeight: 700 }}>
                    {i + 1}
                  </div>
                  <span className="text-sm text-gray-700 leading-relaxed">{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="h-8" />
    </div>
  );
}