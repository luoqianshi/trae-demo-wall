import { useState, useEffect } from 'react';
import { X, Key, ExternalLink, CheckCircle2, AlertCircle, Sparkles, ChevronRight, Globe } from 'lucide-react';
import { PROVIDERS, APIProviderConfig, APIProvider, sendToAI, saveConfig, ChatMessage } from '../ai/apiService';
import { useStore } from '../store/useStore';

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const [selectedProvider, setSelectedProvider] = useState<APIProvider>(
    (localStorage.getItem('ai_provider') as APIProvider) || 'siliconflow'
  );
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [savedProvider, setSavedProvider] = useState<APIProvider | null>(null);
  const [savedKey, setSavedKey] = useState('');

  // Load saved key for current provider
  useEffect(() => {
    const saved = localStorage.getItem(`api_key_${selectedProvider}`) || '';
    const savedMd = localStorage.getItem(`ai_model_${selectedProvider}`) || '';
    const provider = PROVIDERS.find(p => p.id === selectedProvider);
    const defaultMd = savedMd || provider?.defaultModel || '';
    setApiKey(saved);
    setSavedKey(saved);
    setModel(defaultMd);
    if (localStorage.getItem(`api_key_${selectedProvider}`)) {
      setSavedProvider(selectedProvider);
    }
  }, [selectedProvider]);

  const currentProvider = PROVIDERS.find(p => p.id === selectedProvider) || PROVIDERS[0];
  const hasActiveConfig = savedProvider !== null && savedKey !== '';

  const handleSave = () => {
    if (apiKey.trim() && model.trim()) {
      saveConfig(selectedProvider, apiKey.trim(), model.trim());
      setSavedProvider(selectedProvider);
      setSavedKey(apiKey.trim());
      setTestResult({ ok: true, message: '✅ 配置已保存！' });
    }
  };

  const handleTest = async () => {
    if (!apiKey.trim()) {
      setTestResult({ ok: false, message: '请先输入 API Key' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const messages: ChatMessage[] = [
        { role: 'user', content: '你好！请用一句话介绍你自己。' },
      ];
      const response = await sendToAI(messages, currentProvider, apiKey.trim(), model.trim());
      setTestResult({
        ok: true,
        message: `✅ 连接成功！AI 已就绪。（消耗 token: ${response.usage?.total_tokens || '?'}）`,
      });
      saveConfig(selectedProvider, apiKey.trim(), model.trim());
      setSavedProvider(selectedProvider);
      setSavedKey(apiKey.trim());
    } catch (err: any) {
      setTestResult({
        ok: false,
        message: `❌ ${err.message || '网络错误，请检查网络连接'}`,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-slideUp shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 px-5 pt-6 pb-5 text-white relative sticky top-0 z-10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <Key className="w-6 h-6" />
            <span className="text-lg font-bold">AI 设置</span>
          </div>
          <p className="text-sm text-white/90">选择 API 提供商，配置 API Key 即可启用真实 AI 对话</p>
          {hasActiveConfig && (
            <div className="mt-3 bg-white/20 backdrop-blur rounded-xl px-3 py-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span className="text-xs">已配置 {PROVIDERS.find(p => p.id === savedProvider)?.name}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              选择 API 提供商
            </label>
            <div className="space-y-2">
              {PROVIDERS.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => setSelectedProvider(provider.id)}
                  className={`w-full text-left rounded-xl p-3 transition-all border-2 ${
                    selectedProvider === provider.id
                      ? 'border-indigo-400 bg-gradient-to-br from-indigo-50 to-purple-50'
                      : 'border-slate-100 bg-white hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{provider.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm text-slate-800">{provider.name}</h4>
                        {selectedProvider === provider.id && (
                          <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{provider.description}</p>
                      <div className="mt-1.5 text-xs text-emerald-600">🎁 {provider.freeAvailable}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Selected Provider Info */}
          <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-2xl p-4 border border-slate-100">
            <div className="flex items-center gap-3 mb-3">
              <Globe className="w-5 h-5 text-indigo-500" />
              <div>
                <h4 className="font-semibold text-sm text-slate-800">
                  {currentProvider.icon} {currentProvider.name}
                </h4>
                <a
                  href={currentProvider.apiKeyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  获取 API Key
                </a>
              </div>
            </div>
            <div className="text-xs text-slate-500">
              <p className="mb-1">💡 {currentProvider.priceHint}</p>
            </div>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              选择模型
            </label>
            <div className="grid grid-cols-2 gap-2">
              {currentProvider.models.map((md) => (
                <button
                  key={md}
                  onClick={() => setModel(md)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-all text-left border ${
                    model === md
                      ? 'bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-500/20'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-200'
                  }`}
                >
                  {md}
                </button>
              ))}
            </div>
          </div>

          {/* API Key Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setTestResult(null);
              }}
              placeholder={`请输入 ${currentProvider.name} 的 API Key`}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all"
            />
            {savedKey && savedProvider === selectedProvider && (
              <p className="mt-1.5 text-xs text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                已保存 {savedKey.slice(0, 8)}...{savedKey.slice(-4)}
              </p>
            )}
          </div>

          {/* Test result */}
          {testResult && (
            <div
              className={`rounded-xl p-3 flex items-start gap-2 ${
                testResult.ok
                  ? 'bg-emerald-50 border border-emerald-200'
                  : 'bg-rose-50 border border-rose-200'
              }`}
            >
              {testResult.ok ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              )}
              <p
                className={`text-xs leading-relaxed ${
                  testResult.ok ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {testResult.message}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-200 transition-all"
            >
              保存
            </button>
            <button
              onClick={handleTest}
              disabled={testing || !apiKey.trim()}
              className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium text-sm hover:opacity-95 transition-all disabled:opacity-40 shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2"
            >
              {testing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  测试中...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  测试并启用
                </>
              )}
            </button>
          </div>

          {/* Usage hint */}
          <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
            <p className="text-xs text-amber-700 leading-relaxed">
              💡 <strong>推荐方案：</strong>
              <br />
              1. 首次使用可选择「硅基流动」，模型最全且每天有免费额度
              <br />
              2. 智谱的 <code>glm-4-flash</code> 完全免费，适合长期使用
              <br />
              3. DeepSeek 充值后可用最强模型，适合展示演示
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-slideUp { animation: slideUp 0.35s cubic-bezier(0.15, 1.15, 0.5, 1); }
      `}</style>
    </div>
  );
}
