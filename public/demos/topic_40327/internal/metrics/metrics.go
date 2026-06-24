// Package metrics 提供运行时可观测性指标导出
// 使用 expvar 标准库导出 JSON 格式指标到 /debug/vars 端点
// 可供 Prometheus、Grafana 等外部监控系统抓取
package metrics

import (
	"expvar"
	"runtime"
	"time"
)

// 自定义指标计数器
var (
	// LLM 调用指标
	LLMCallsTotal   = new(expvar.Int) // LLM 调用总次数
	LLMCallsSuccess = new(expvar.Int) // LLM 调用成功次数
	LLMCallsError   = new(expvar.Int) // LLM 调用失败次数
	LLMTokensIn     = new(expvar.Int) // 输入 Token 总数
	LLMTokensOut    = new(expvar.Int) // 输出 Token 总数

	// 消息处理指标
	MessagesReceived  = new(expvar.Int) // 收到消息总数
	MessagesProcessed = new(expvar.Int) // 处理消息总数
	MessagesDeduped   = new(expvar.Int) // 去重拦截消息数
	MessagesReplied   = new(expvar.Int) // 回复消息总数

	// 记忆检索指标
	MemoryQueries      = new(expvar.Int) // 记忆检索总次数
	MemoryQueryDeduped = new(expvar.Int) // 记忆检索合并次数（singleflight 命中）
	MemoryHitsTotal    = new(expvar.Int) // 记忆命中总数

	// 插件指标
	PluginsLoaded  = new(expvar.Int) // 已加载插件数
	PluginsTotal   = new(expvar.Int) // 插件总数
	PluginCommands = new(expvar.Int) // 插件命令执行次数

	// 流水线延迟统计（毫秒）
	PipelineLatencyP50 = new(expvar.Float)
	PipelineLatencyP95 = new(expvar.Float)
	PipelineLatencyP99 = new(expvar.Float)

	// LLM 调用延迟统计（毫秒）
	LLMLatencyP50 = new(expvar.Float)
	LLMLatencyP95 = new(expvar.Float)
	LLMLatencyP99 = new(expvar.Float)

	// 消息队列深度（GroupProcessor 待处理消息数）
	QueueDepth = new(expvar.Int)

	// 运行时信息
	StartTime  = new(expvar.String)
	GoVersion  = new(expvar.String)
	NumCPU     = new(expvar.Int)
	Goroutines = new(expvar.Int)

	// 熔断器状态
	CircuitBreakerState = new(expvar.String) // "closed" | "open" | "half-open"
)

// 延迟滑动窗口（用于计算 P50/P95/P99）
type latencyWindow struct {
	samples [256]float64
	idx     int
	count   int
}

var (
	pipelineLatency latencyWindow
	llmLatency      latencyWindow
)

func init() {
	// 注册自定义指标
	expvar.Publish("llm_calls_total", LLMCallsTotal)
	expvar.Publish("llm_calls_success", LLMCallsSuccess)
	expvar.Publish("llm_calls_error", LLMCallsError)
	expvar.Publish("llm_tokens_in", LLMTokensIn)
	expvar.Publish("llm_tokens_out", LLMTokensOut)

	expvar.Publish("messages_received", MessagesReceived)
	expvar.Publish("messages_processed", MessagesProcessed)
	expvar.Publish("messages_deduped", MessagesDeduped)
	expvar.Publish("messages_replied", MessagesReplied)

	expvar.Publish("memory_queries", MemoryQueries)
	expvar.Publish("memory_query_deduped", MemoryQueryDeduped)
	expvar.Publish("memory_hits_total", MemoryHitsTotal)

	expvar.Publish("plugins_loaded", PluginsLoaded)
	expvar.Publish("plugins_total", PluginsTotal)
	expvar.Publish("plugin_commands", PluginCommands)

	expvar.Publish("pipeline_latency_p50", PipelineLatencyP50)
	expvar.Publish("pipeline_latency_p95", PipelineLatencyP95)
	expvar.Publish("pipeline_latency_p99", PipelineLatencyP99)

	expvar.Publish("llm_latency_p50", LLMLatencyP50)
	expvar.Publish("llm_latency_p95", LLMLatencyP95)
	expvar.Publish("llm_latency_p99", LLMLatencyP99)

	expvar.Publish("queue_depth", QueueDepth)

	expvar.Publish("start_time", StartTime)
	expvar.Publish("go_version", GoVersion)
	expvar.Publish("num_cpu", NumCPU)
	expvar.Publish("goroutines", Goroutines)

	expvar.Publish("circuit_breaker_state", CircuitBreakerState)

	// 初始化运行时指标
	GoVersion.Set(runtime.Version())
	NumCPU.Set(int64(runtime.NumCPU()))
	CircuitBreakerState.Set("closed")
}

// Init 初始化指标，记录启动时间
func Init() {
	StartTime.Set(time.Now().Format(time.RFC3339))
}

// RecordLLMCall 记录一次 LLM 调用，包含延迟统计
func RecordLLMCall(success bool, tokensIn, tokensOut int64, latencyMs float64) {
	LLMCallsTotal.Add(1)
	if success {
		LLMCallsSuccess.Add(1)
	} else {
		LLMCallsError.Add(1)
	}
	LLMTokensIn.Add(tokensIn)
	LLMTokensOut.Add(tokensOut)
	// 记录 LLM 调用延迟到滑动窗口
	llmLatency.add(latencyMs)
	UpdateLLMLatencyPercentiles()
}

// UpdateLLMLatencyPercentiles 更新 LLM 延迟百分位（定期调用）
func UpdateLLMLatencyPercentiles() {
	p50, p95, p99 := llmLatency.percentiles()
	LLMLatencyP50.Set(p50)
	LLMLatencyP95.Set(p95)
	LLMLatencyP99.Set(p99)
}

// SetQueueDepth 设置当前消息队列深度（待处理消息总数）
func SetQueueDepth(depth int64) {
	QueueDepth.Set(depth)
}

// RecordMessageReceived 记录收到消息
func RecordMessageReceived() {
	MessagesReceived.Add(1)
}

// RecordMessageProcessed 记录处理消息
func RecordMessageProcessed() {
	MessagesProcessed.Add(1)
}

// RecordMessageDeduped 记录去重拦截
func RecordMessageDeduped() {
	MessagesDeduped.Add(1)
}

// RecordMessageReplied 记录回复消息
func RecordMessageReplied() {
	MessagesReplied.Add(1)
}

// RecordMemoryQuery 记录记忆检索
func RecordMemoryQuery(deduped bool, hits int) {
	MemoryQueries.Add(1)
	if deduped {
		MemoryQueryDeduped.Add(1)
	}
	MemoryHitsTotal.Add(int64(hits))
}

// RecordPipelineLatency 记录流水线延迟
func RecordPipelineLatency(latencyMs float64) {
	pipelineLatency.add(latencyMs)
	UpdatePipelinePercentiles()
}

// UpdateGoroutineCount 更新 goroutine 计数（定期调用）
func UpdateGoroutineCount() {
	Goroutines.Set(int64(runtime.NumGoroutine()))
}

// UpdatePipelinePercentiles 更新流水线延迟百分位（定期调用）
func UpdatePipelinePercentiles() {
	p50, p95, p99 := pipelineLatency.percentiles()
	PipelineLatencyP50.Set(p50)
	PipelineLatencyP95.Set(p95)
	PipelineLatencyP99.Set(p99)
}

// SetCircuitBreakerState 设置熔断器状态
func SetCircuitBreakerState(state string) {
	CircuitBreakerState.Set(state)
}

// --- 滑动窗口百分位计算 ---

func (w *latencyWindow) add(v float64) {
	w.samples[w.idx] = v
	w.idx = (w.idx + 1) % len(w.samples)
	if w.count < len(w.samples) {
		w.count++
	}
}

func (w *latencyWindow) percentiles() (p50, p95, p99 float64) {
	if w.count == 0 {
		return 0, 0, 0
	}

	// 复制并排序
	vals := make([]float64, w.count)
	copy(vals, w.samples[:w.count])
	sortFloat64(vals)

	p50 = percentile(vals, 0.50)
	p95 = percentile(vals, 0.95)
	p99 = percentile(vals, 0.99)
	return
}

func percentile(sorted []float64, p float64) float64 {
	if len(sorted) == 0 {
		return 0
	}
	idx := int(p * float64(len(sorted)-1))
	if idx < 0 {
		idx = 0
	}
	if idx >= len(sorted) {
		idx = len(sorted) - 1
	}
	return sorted[idx]
}

func sortFloat64(a []float64) {
	// 简单插入排序（数据量小，256 以内）
	for i := 1; i < len(a); i++ {
		key := a[i]
		j := i - 1
		for j >= 0 && a[j] > key {
			a[j+1] = a[j]
			j--
		}
		a[j+1] = key
	}
}

// percentile 计算百分位
