import { useState, useEffect } from "react";
import { useProjectStore } from "@/store/useProjectStore";
import { cn } from "@/lib/utils";
import {
  Check, KeyRound, Server, Cpu, Shield, ChevronDown, RefreshCw, Trash2, Search,
  Eye, EyeOff, AlertCircle, Loader2, ExternalLink, Plus, Copy, X, ScrollText,
} from "lucide-react";
import {
  fetchAvailableModels, testProviderConnection, testTavilyConnection,
  type TestResult,
} from "@/lib/llm";
import { clearPersonaCache, PROVIDER_DEFAULTS } from "@/lib/storage";
import { getLogs, clearLogs, formatLogsForExport, type LogEntry } from "@/lib/logger";
import type { ProviderId, ProviderConfig, UserConfig } from "@/lib/types";

// ========== 服务商元信息 ==========
// Base URL 默认值取自 storage.ts 的 PROVIDER_DEFAULTS，这里只补展示信息和精选模型
const PROVIDER_INFO: Record<ProviderId, { name: string; consoleUrl?: string; models: string[] }> = {
  deepseek: { name: "DeepSeek", consoleUrl: "https://platform.deepseek.com", models: ["deepseek-chat", "deepseek-reasoner"] },
  openai:   { name: "OpenAI",   consoleUrl: "https://platform.openai.com",  models: ["gpt-4o", "gpt-4o-mini", "gpt-5"] },
  kimi:     { name: "Kimi",     consoleUrl: "https://platform.moonshot.cn", models: ["moonshot-v1-8k", "moonshot-v1-32k", "moonshot-v1-128k"] },
  custom:   { name: "自定义",   models: [] },
};

const PROVIDER_ORDER: ProviderId[] = ["deepseek", "openai", "kimi", "custom"];

// ========== 单个服务商表单（独立组件，切换服务商时 key 变 → 整体重挂载 → 本地 state 重置为 store 值） ==========
function ProviderForm({
  providerId,
  providerConfig,
  userConfig,
  updateProviderConfig,
}: {
  providerId: ProviderId;
  providerConfig: ProviderConfig;
  userConfig: UserConfig;
  updateProviderConfig: (id: ProviderId, patch: Partial<ProviderConfig>) => void;
}) {
  const info = PROVIDER_INFO[providerId];

  // 本地缓存输入中内容，失焦时写 store。初始值来自 store
  const [apiKey, setApiKey] = useState(providerConfig.apiKey);
  const [baseUrl, setBaseUrl] = useState(providerConfig.apiBaseUrl);
  const [modelName, setModelName] = useState(providerConfig.modelName);
  const [manualModel, setManualModel] = useState("");

  const [showKey, setShowKey] = useState(false);
  const [fetchedModels, setFetchedModels] = useState<string[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const isCustom = providerId === "custom";

  // 用当前表单值构造一份临时 UserConfig，让 test/fetch 走当前正在编辑的内容（不依赖是否已失焦保存）
  function buildTempConfig(): UserConfig {
    return {
      ...userConfig,
      activeProvider: providerId,
      providers: {
        ...userConfig.providers,
        [providerId]: {
          apiKey: apiKey.trim(),
          apiBaseUrl: baseUrl.trim() || PROVIDER_DEFAULTS[providerId].apiBaseUrl,
          modelName: modelName.trim(),
        },
      },
    };
  }

  const handleFetchModels = async () => {
    if (!apiKey.trim() || !baseUrl.trim()) {
      setFetchError("先填 API Key 和 Base URL");
      return;
    }
    setFetchingModels(true);
    setFetchError("");
    try {
      const models = await fetchAvailableModels(buildTempConfig());
      if (models.length === 0) {
        setFetchError("该 Key 没有返回可用模型");
      } else {
        setFetchedModels(models);
        // 当前模型不在拉取列表里，自动切到第一个
        if (!models.includes(modelName) && !PROVIDER_INFO[providerId].models.includes(modelName)) {
          setModelName(models[0]);
          updateProviderConfig(providerId, { modelName: models[0] });
        }
      }
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "拉取失败");
    } finally {
      setFetchingModels(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testProviderConnection(buildTempConfig());
      setTestResult(result);
    } catch (err) {
      // explainApiError 内部已兜底，这里防御性兜底
      setTestResult({
        ok: false,
        error: { raw: err instanceof Error ? err.message : String(err), human: "调用失败，看上面的原始错误" },
      });
    } finally {
      setTesting(false);
    }
  };

  // 精选 + 拉取，去重
  const modelOptions = Array.from(new Set([...info.models, ...fetchedModels]));

  const commitManualModel = () => {
    const trimmed = manualModel.trim();
    if (!trimmed) return;
    setModelName(trimmed);
    updateProviderConfig(providerId, { modelName: trimmed });
    setManualModel("");
  };

  return (
    <div className="space-y-6">
      {/* 1. API Key */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-2">
          <KeyRound className="w-4 h-4 text-zinc-500" />
          API Key
        </label>
        <div className="relative">
          <input
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            onBlur={() => updateProviderConfig(providerId, { apiKey: apiKey.trim() })}
            placeholder="sk-..."
            className="w-full px-4 py-3 pr-11 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-100 placeholder-zinc-600 text-sm focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
            tabIndex={-1}
          >
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {info.consoleUrl && (
          <p className="mt-2 text-xs text-zinc-600">
            获取密钥：
            <a
              href={info.consoleUrl}
              target="_blank"
              rel="noreferrer"
              className="text-amber-400 hover:text-amber-300 underline inline-flex items-center gap-1 ml-1"
            >
              {info.consoleUrl.replace(/^https?:\/\//, "")}
              <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        )}
      </div>

      {/* 2. Base URL */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-2">
          <Server className="w-4 h-4 text-zinc-500" />
          API Base URL
        </label>
        <input
          type="text"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          onBlur={() => updateProviderConfig(providerId, { apiBaseUrl: baseUrl.trim() })}
          placeholder={PROVIDER_DEFAULTS[providerId].apiBaseUrl || "https://api.example.com/v1"}
          className="w-full px-4 py-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-100 placeholder-zinc-600 text-sm focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all"
        />
        {isCustom && (
          <p className="mt-2 text-xs text-zinc-600">
            填到 /v1 为止，系统自动拼 /chat/completions。支持 OpenAI 兼容的 API 地址（中转代理或其他服务商）。
          </p>
        )}
      </div>

      {/* 3. 模型 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
            <Cpu className="w-4 h-4 text-zinc-500" />
            模型
          </label>
          <button
            onClick={handleFetchModels}
            disabled={fetchingModels || !apiKey.trim() || !baseUrl.trim()}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={cn("w-3 h-3", fetchingModels && "animate-spin")} />
            {fetchingModels ? "拉取中…" : "拉取模型列表"}
          </button>
        </div>

        <div className="relative">
          <select
            value={modelName}
            onChange={(e) => {
              setModelName(e.target.value);
              updateProviderConfig(providerId, { modelName: e.target.value });
            }}
            className="w-full px-4 py-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-100 text-sm focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all appearance-none cursor-pointer pr-10"
          >
            {modelName && !modelOptions.includes(modelName) && (
              <option value={modelName}>{modelName}（当前）</option>
            )}
            {modelOptions.length === 0 && !modelName && (
              <option value="">— 选择或输入模型 —</option>
            )}
            {modelOptions.map((m) => (
              <option key={m} value={m} className="bg-zinc-900 text-zinc-100">
                {m}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-zinc-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* 手动输入模型名 */}
        <div className="relative mt-2">
          <input
            type="text"
            value={manualModel}
            onChange={(e) => setManualModel(e.target.value)}
            onBlur={commitManualModel}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.currentTarget.blur();
              }
            }}
            placeholder="或手动输入模型名，回车确认"
            className="w-full px-4 py-2 pl-9 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-100 placeholder-zinc-600 text-sm focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all"
          />
          <Plus className="w-4 h-4 text-zinc-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {fetchError && (
          <p className="mt-2 text-xs text-red-400">{fetchError}</p>
        )}
        {fetchedModels.length > 0 && (
          <p className="mt-2 text-xs text-zinc-600">
            已从 API 拉取 {fetchedModels.length} 个可用模型，与精选列表合并去重
          </p>
        )}
        {fetchedModels.length === 0 && !isCustom && (
          <p className="mt-2 text-xs text-zinc-600">
            预设是常见值，不一定和你 Key 的权限匹配。填好 Key 和 Base URL 后点右上角"拉取模型列表"拿真实列表。
          </p>
        )}
      </div>

      {/* 4. 检测按钮 */}
      <div>
        <button
          onClick={handleTest}
          disabled={testing || !apiKey.trim() || !baseUrl.trim()}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all",
            testResult?.ok
              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
              : testResult && !testResult.ok
                ? "border-red-500/50 bg-red-500/10 text-red-400"
                : "border-zinc-700 text-zinc-300 hover:border-amber-500/50 hover:text-amber-400",
            (testing || !apiKey.trim() || !baseUrl.trim()) && "opacity-60 cursor-not-allowed hover:border-zinc-700 hover:text-zinc-300"
          )}
        >
          {testing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              检测中…
            </>
          ) : testResult?.ok ? (
            <>
              <Check className="w-4 h-4" />
              检测通过 · {testResult.latencyMs}ms
            </>
          ) : testResult && !testResult.ok ? (
            <>
              <AlertCircle className="w-4 h-4" />
              检测失败
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              检测连通性
            </>
          )}
        </button>

        {/* 失败时显示原始错误 + 人话映射 */}
        {testResult && !testResult.ok && testResult.error && (
          <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/5 p-3 space-y-1.5">
            <p className="text-xs text-red-400 break-all">{testResult.error.raw}</p>
            <p className="text-xs text-amber-400 leading-relaxed">{testResult.error.human}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ========== 设置页主组件 ==========
export default function SettingsPage() {
  const {
    config, configLoaded, loadConfigFromStorage,
    switchProvider, updateProviderConfig, updateTavilyKey,
  } = useProjectStore();

  // Tavily 本地缓存
  const [tavilyKey, setTavilyKey] = useState(config.tavilyApiKey || "");
  const [showTavilyKey, setShowTavilyKey] = useState(false);
  const [tavilyTesting, setTavilyTesting] = useState(false);
  const [tavilyResult, setTavilyResult] = useState<TestResult | null>(null);

  // 人物卡缓存清除反馈
  const [cacheCleared, setCacheCleared] = useState(false);

  // 运行日志弹层
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    if (!configLoaded) loadConfigFromStorage();
  }, [configLoaded, loadConfigFromStorage]);

  // config 从 store 异步加载完后，同步 Tavily 输入框
  useEffect(() => {
    if (configLoaded) {
      setTavilyKey(config.tavilyApiKey || "");
    }
  }, [configLoaded, config.tavilyApiKey]);

  const activeProvider = config.activeProvider;
  const activeProviderConfig = config.providers[activeProvider];

  const handleClearCache = () => {
    clearPersonaCache();
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 2000);
  };

  const handleTavilyTest = async () => {
    setTavilyTesting(true);
    setTavilyResult(null);
    try {
      const result = await testTavilyConnection(tavilyKey.trim());
      setTavilyResult(result);
    } catch (err) {
      setTavilyResult({
        ok: false,
        error: { raw: err instanceof Error ? err.message : String(err), human: "调用失败，看上面的原始错误" },
      });
    } finally {
      setTavilyTesting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-8 py-12">
      {/* 头部 */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold">设置</h1>
        <p className="text-zinc-500 text-sm mt-1">
          配置 LLM 和搜索 API Key，驱动团队干活
        </p>
        <p className="text-xs text-zinc-600 mt-2">改动自动保存，无需点保存按钮</p>
      </div>

      {/* 服务商标签组（点标签 = 设为当前使用 + 切换视图） */}
      <div className="mb-6">
        <p className="text-xs text-zinc-500 mb-3">API 服务商 · 当前使用</p>
        <div className="flex gap-2 flex-wrap">
          {PROVIDER_ORDER.map((pid) => {
            const isActive = pid === activeProvider;
            return (
              <button
                key={pid}
                onClick={() => switchProvider(pid)}
                className={cn(
                  "px-4 py-2 rounded-lg border text-sm transition-colors flex items-center gap-2",
                  isActive
                    ? "border-amber-500/50 bg-amber-500/10 text-amber-400"
                    : "border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                )}
              >
                {PROVIDER_INFO[pid].name}
                {isActive && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 leading-none">
                    当前使用
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 当前服务商表单（key 随 activeProvider 变 → 切换时整体重挂载，本地 state 自动重置） */}
      <div className="mb-10">
        <ProviderForm
          key={activeProvider}
          providerId={activeProvider}
          providerConfig={activeProviderConfig}
          userConfig={config}
          updateProviderConfig={updateProviderConfig}
        />
      </div>

      {/* 分隔线 */}
      <div className="border-t border-zinc-800 my-8" />

      {/* Tavily 搜索 */}
      <div className="mb-8">
        <h2 className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-4">
          <Search className="w-4 h-4 text-zinc-500" />
          Tavily 搜索（可选）
        </h2>

        <div className="space-y-4">
          {/* Tavily API Key */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-2">
              <KeyRound className="w-4 h-4 text-zinc-500" />
              API Key
            </label>
            <div className="relative">
              <input
                type={showTavilyKey ? "text" : "password"}
                value={tavilyKey}
                onChange={(e) => setTavilyKey(e.target.value)}
                onBlur={() => updateTavilyKey(tavilyKey.trim())}
                placeholder="tvly-..."
                className="w-full px-4 py-3 pr-11 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-100 placeholder-zinc-600 text-sm focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowTavilyKey(!showTavilyKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                tabIndex={-1}
              >
                {showTavilyKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="mt-2 text-xs text-zinc-600 leading-relaxed">
              用于调研任务的实时搜索。没配 Key 或调用失败时，自动降级用模型知识生成调研发现，并在卡片上明确标注。
              免费档每月 1000 次够用，去
              <a
                href="https://tavily.com"
                target="_blank"
                rel="noreferrer"
                className="text-amber-400 hover:text-amber-300 underline inline-flex items-center gap-1 mx-1"
              >
                tavily.com
                <ExternalLink className="w-3 h-3" />
              </a>
              注册后在 Dashboard 拿 Key。
            </p>
          </div>

          {/* Tavily 检测 */}
          <div>
            <button
              onClick={handleTavilyTest}
              disabled={tavilyTesting || !tavilyKey.trim()}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all",
                tavilyResult?.ok
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                  : tavilyResult && !tavilyResult.ok
                    ? "border-red-500/50 bg-red-500/10 text-red-400"
                    : "border-zinc-700 text-zinc-300 hover:border-amber-500/50 hover:text-amber-400",
                (tavilyTesting || !tavilyKey.trim()) && "opacity-60 cursor-not-allowed hover:border-zinc-700 hover:text-zinc-300"
              )}
            >
              {tavilyTesting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  检测中…
                </>
              ) : tavilyResult?.ok ? (
                <>
                  <Check className="w-4 h-4" />
                  检测通过 · {tavilyResult.latencyMs}ms
                </>
              ) : tavilyResult && !tavilyResult.ok ? (
                <>
                  <AlertCircle className="w-4 h-4" />
                  检测失败
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  检测连通性
                </>
              )}
            </button>

            {tavilyResult && !tavilyResult.ok && tavilyResult.error && (
              <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/5 p-3 space-y-1.5">
                <p className="text-xs text-red-400 break-all">{tavilyResult.error.raw}</p>
                <p className="text-xs text-amber-400 leading-relaxed">{tavilyResult.error.human}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 人物卡缓存 */}
      <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-300">人物卡缓存</p>
            <p className="text-xs text-zinc-500 mt-1">
              换服务商或模型时自动清除。也可手动清除。
            </p>
          </div>
          <button
            onClick={handleClearCache}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs transition-colors shrink-0",
              cacheCleared
                ? "border-emerald-500/50 text-emerald-400"
                : "border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
            )}
          >
            {cacheCleared ? <Check className="w-3 h-3" /> : <Trash2 className="w-3 h-3" />}
            {cacheCleared ? "已清除" : "清除缓存"}
          </button>
        </div>
      </div>

      {/* 运行日志 */}
      <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-300">运行日志</p>
            <p className="text-xs text-zinc-500 mt-1">
              查看 LLM 调用、阶段流转、插话等运行时日志，便于排查问题。
            </p>
          </div>
          <button
            onClick={() => setShowLogs(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:border-amber-500/50 hover:text-amber-400 text-xs transition-colors shrink-0"
          >
            <ScrollText className="w-3 h-3" />
            查看日志
          </button>
        </div>
      </div>

      {/* 安全说明 */}
      <div className="mt-10 rounded-xl border border-zinc-800 bg-zinc-900/30 p-5">
        <div className="flex items-center gap-2 text-zinc-300 mb-3">
          <Shield className="w-4 h-4 text-zinc-500" />
          <span className="text-sm font-medium">安全说明</span>
        </div>
        <ul className="space-y-2 text-xs text-zinc-500 leading-relaxed">
          <li>• API Key 仅存储在你的浏览器 Local Storage 中，不会上传到任何服务器</li>
          <li>• 所有 LLM 调用直接从你的浏览器发送到对应的 API 服务商</li>
          <li>• 支持 OpenAI 兼容的 API 格式（OpenAI、DeepSeek、Kimi 等）</li>
          <li>• 清除浏览器数据会同时清除你的配置和历史记录</li>
        </ul>
      </div>

      {/* 运行日志弹层 */}
      {showLogs && <LogViewer onClose={() => setShowLogs(false)} />}
    </div>
  );
}

// ========== 运行日志弹层 ==========

function LogViewer({ onClose }: { onClose: () => void }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [copied, setCopied] = useState(false);

  // 打开时拉一次最新日志
  useEffect(() => {
    setLogs(getLogs());
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(formatLogsForExport());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    clearLogs();
    setLogs([]);
  };

  // category 配色：llm=blue / stage=emerald / interrupt=amber / error=red / question=purple / schedule=cyan
  const categoryColor: Record<LogEntry['category'], string> = {
    llm: 'text-blue-400',
    stage: 'text-emerald-400',
    interrupt: 'text-amber-400',
    error: 'text-red-400',
    question: 'text-purple-400',
    schedule: 'text-cyan-400',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[800px] max-h-[600px] rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部 */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2 text-amber-500">
            <ScrollText className="w-4 h-4" />
            <span className="text-sm font-medium">运行日志</span>
            <span className="text-xs text-zinc-600">（{logs.length}条）</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              disabled={logs.length === 0}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs transition-colors",
                copied
                  ? "border-emerald-500/50 text-emerald-400"
                  : "border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200",
                logs.length === 0 && "opacity-40 cursor-not-allowed"
              )}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? '已复制' : '复制全部'}
            </button>
            <button
              onClick={handleClear}
              disabled={logs.length === 0}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-lg border border-zinc-700 text-xs text-zinc-400 hover:border-red-500/50 hover:text-red-400 transition-colors",
                logs.length === 0 && "opacity-40 cursor-not-allowed"
              )}
            >
              <Trash2 className="w-3 h-3" />
              清空
            </button>
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
              title="关闭"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 日志列表 */}
        <div className="flex-1 overflow-y-auto px-5 py-3 font-mono text-xs">
          {logs.length === 0 ? (
            <div className="text-center py-12 text-zinc-600">暂无日志</div>
          ) : (
            <div className="space-y-0.5">
              {logs.map((log) => (
                <div key={log.id} className="flex gap-2 leading-relaxed">
                  <span className={cn("shrink-0 font-medium", categoryColor[log.category])}>
                    [{log.category}]
                  </span>
                  <span className="shrink-0 text-zinc-600">
                    {log.timestamp.toLocaleTimeString('zh-CN', { hour12: false })}
                  </span>
                  <span className="text-zinc-300 break-all">{log.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部 */}
        <div className="px-5 py-3 border-t border-zinc-800 shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-zinc-700 text-zinc-300 text-xs hover:bg-zinc-800 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
