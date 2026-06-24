package metrics

import (
	"runtime"
	"testing"
)

// ── latencyWindow 测试 ──

func TestLatencyWindow_Add(t *testing.T) {
	w := latencyWindow{}
	w.add(100.0)
	w.add(200.0)
	w.add(50.0)

	if w.count != 3 {
		t.Errorf("count 应为 3, 实际 %d", w.count)
	}
}

func TestLatencyWindow_Percentiles_Empty(t *testing.T) {
	w := latencyWindow{}
	p50, p95, p99 := w.percentiles()
	if p50 != 0 || p95 != 0 || p99 != 0 {
		t.Errorf("空窗口应返回全零, 实际 p50=%.1f p95=%.1f p99=%.1f", p50, p95, p99)
	}
}

func TestLatencyWindow_Percentiles_Single(t *testing.T) {
	w := latencyWindow{}
	w.add(42.0)
	p50, p95, p99 := w.percentiles()
	if p50 != 42.0 || p95 != 42.0 || p99 != 42.0 {
		t.Errorf("单样本应全部为 42.0, 实际 p50=%.1f p95=%.1f p99=%.1f", p50, p95, p99)
	}
}

func TestLatencyWindow_Percentiles_Multiple(t *testing.T) {
	w := latencyWindow{}
	// 添加 100 个排序样本
	for i := 0; i < 100; i++ {
		w.add(float64(i + 1))
	}

	p50, p95, p99 := w.percentiles()

	// P50: 第 50 个 (索引 49, 因为 0.50 * 99 = 49.5 -> int = 49, 值 = 50)
	if p50 < 49 || p50 > 51 {
		t.Errorf("P50 应在 50 附近, 实际 %.1f", p50)
	}
	// P95: 第 95 个 (索引 94, 值 = 95)
	if p95 < 94 || p95 > 96 {
		t.Errorf("P95 应在 95 附近, 实际 %.1f", p95)
	}
	// P99: 第 99 个 (索引 98, 值 = 99)
	if p99 < 98 || p99 > 100 {
		t.Errorf("P99 应在 99 附近, 实际 %.1f", p99)
	}
}

func TestLatencyWindow_WrapAround(t *testing.T) {
	w := latencyWindow{}
	// 填充超过 256 个样本，测试环形覆盖
	for i := 0; i < 300; i++ {
		w.add(float64(i + 1))
	}

	if w.count != 256 {
		t.Errorf("环形覆盖后 count 应为 256, 实际 %d", w.count)
	}

	// 最后 256 个样本是 45-300
	p50, _, _ := w.percentiles()
	// P50 应该在 170 附近
	if p50 < 160 || p50 > 180 {
		t.Errorf("环形覆盖后 P50 应在 170 附近, 实际 %.1f", p50)
	}
}

// ── percentile 测试 ──

func TestPercentile_Empty(t *testing.T) {
	if percentile([]float64{}, 0.5) != 0 {
		t.Error("空切片应返回 0")
	}
}

func TestPercentile_Single(t *testing.T) {
	if percentile([]float64{42.0}, 0.5) != 42.0 {
		t.Error("单元素切片应返回该元素")
	}
}

func TestPercentile_Boundaries(t *testing.T) {
	sorted := []float64{1.0, 2.0, 3.0, 4.0, 5.0}

	// P0 应返回第一个
	if percentile(sorted, 0.0) != 1.0 {
		t.Errorf("P0 应为 1.0, 实际 %f", percentile(sorted, 0.0))
	}
	// P100 应返回最后一个
	if percentile(sorted, 1.0) != 5.0 {
		t.Errorf("P100 应为 5.0, 实际 %f", percentile(sorted, 1.0))
	}
}

// ── sortFloat64 测试 ──

func TestSortFloat64(t *testing.T) {
	data := []float64{5.0, 3.0, 1.0, 4.0, 2.0}
	sortFloat64(data)
	for i := 1; i < len(data); i++ {
		if data[i] < data[i-1] {
			t.Errorf("排序后元素应递增: data[%d]=%.1f < data[%d]=%.1f", i, data[i], i-1, data[i-1])
		}
	}
}

func TestSortFloat64_Empty(t *testing.T) {
	data := []float64{}
	sortFloat64(data) // 不应 panic
}

func TestSortFloat64_Single(t *testing.T) {
	data := []float64{42.0}
	sortFloat64(data)
	if data[0] != 42.0 {
		t.Errorf("单元素排序后应为 42.0, 实际 %.1f", data[0])
	}
}

// ── Counter 测试 ──
// 注：Counter 类型未在 metrics.go 中定义，相关测试已移除

// ── Init 测试 ──

func TestInit(t *testing.T) {
	// Init 不应 panic
	Init()
	if StartTime.Value() == "" {
		t.Error("Init 后 StartTime 不应为空")
	}
}

// ── RecordLLMCall 测试 ──

func TestRecordLLMCall_Success(t *testing.T) {
	before := LLMCallsSuccess.Value()
	beforeTotal := LLMCallsTotal.Value()

	RecordLLMCall(true, 100, 50, 500.0)

	if LLMCallsSuccess.Value() != before+1 {
		t.Errorf("成功后 LLMCallsSuccess 应 +1, 期望 %d, 实际 %d", before+1, LLMCallsSuccess.Value())
	}
	if LLMCallsTotal.Value() != beforeTotal+1 {
		t.Errorf("LLMCallsTotal 应 +1, 期望 %d, 实际 %d", beforeTotal+1, LLMCallsTotal.Value())
	}
	if LLMTokensIn.Value() < 100 {
		t.Errorf("LLMTokensIn 应 >= 100")
	}
}

func TestRecordLLMCall_Error(t *testing.T) {
	before := LLMCallsError.Value()

	RecordLLMCall(false, 100, 0, 500.0)

	if LLMCallsError.Value() != before+1 {
		t.Errorf("失败后 LLMCallsError 应 +1, 期望 %d, 实际 %d", before+1, LLMCallsError.Value())
	}
}

func TestRecordLLMCall_Latency(t *testing.T) {
	// 记录多次调用，验证延迟百分位被更新
	RecordLLMCall(true, 10, 5, 100.0)
	RecordLLMCall(true, 10, 5, 200.0)
	RecordLLMCall(true, 10, 5, 300.0)

	if LLMLatencyP50.Value() == 0 {
		t.Error("记录 LLM 调用后 LLMLatencyP50 不应为 0")
	}
}

func TestSetQueueDepth(t *testing.T) {
	SetQueueDepth(42)
	if QueueDepth.Value() != 42 {
		t.Errorf("QueueDepth 应为 42, 实际 %d", QueueDepth.Value())
	}
}

// ── 消息指标测试 ──

func TestRecordMessageReceived(t *testing.T) {
	before := MessagesReceived.Value()
	RecordMessageReceived()
	if MessagesReceived.Value() != before+1 {
		t.Errorf("MessagesReceived 应 +1")
	}
}

func TestRecordMessageProcessed(t *testing.T) {
	before := MessagesProcessed.Value()
	RecordMessageProcessed()
	if MessagesProcessed.Value() != before+1 {
		t.Errorf("MessagesProcessed 应 +1")
	}
}

func TestRecordMessageDeduped(t *testing.T) {
	before := MessagesDeduped.Value()
	RecordMessageDeduped()
	if MessagesDeduped.Value() != before+1 {
		t.Errorf("MessagesDeduped 应 +1")
	}
}

func TestRecordMessageReplied(t *testing.T) {
	before := MessagesReplied.Value()
	RecordMessageReplied()
	if MessagesReplied.Value() != before+1 {
		t.Errorf("MessagesReplied 应 +1")
	}
}

// ── 记忆指标测试 ──

func TestRecordMemoryQuery(t *testing.T) {
	beforeQueries := MemoryQueries.Value()
	beforeDeduped := MemoryQueryDeduped.Value()

	RecordMemoryQuery(true, 3)

	if MemoryQueries.Value() != beforeQueries+1 {
		t.Errorf("MemoryQueries 应 +1")
	}
	if MemoryQueryDeduped.Value() != beforeDeduped+1 {
		t.Errorf("MemoryQueryDeduped 应 +1")
	}
}

func TestRecordMemoryQuery_NoDedup(t *testing.T) {
	beforeDeduped := MemoryQueryDeduped.Value()

	RecordMemoryQuery(false, 5)

	if MemoryQueryDeduped.Value() != beforeDeduped {
		t.Errorf("非重复查询时 MemoryQueryDeduped 不应增加")
	}
}

// ── RecordPipelineLatency 测试 ──

func TestRecordPipelineLatency(t *testing.T) {
	RecordPipelineLatency(100.0)
	RecordPipelineLatency(200.0)
	RecordPipelineLatency(300.0)

	// 验证百分位被更新
	if PipelineLatencyP50.Value() == 0 {
		t.Error("RecordPipelineLatency 后 P50 不应为 0")
	}
}

// ── UpdateGoroutineCount 测试 ──

func TestUpdateGoroutineCount(t *testing.T) {
	UpdateGoroutineCount()
	if Goroutines.Value() <= 0 {
		t.Error("UpdateGoroutineCount 后 Goroutines 应 > 0")
	}
}

// ── SetCircuitBreakerState 测试 ──

func TestSetCircuitBreakerState(t *testing.T) {
	SetCircuitBreakerState("open")
	if CircuitBreakerState.Value() != "open" {
		t.Errorf("CircuitBreakerState 应为 open, 实际 %q", CircuitBreakerState.Value())
	}

	SetCircuitBreakerState("closed")
	if CircuitBreakerState.Value() != "closed" {
		t.Errorf("CircuitBreakerState 应为 closed, 实际 %q", CircuitBreakerState.Value())
	}
}

// ── PrintSummary 测试 ──
// 注：PrintSummary 函数未在 metrics.go 中定义，相关测试已移除

// ── 运行时指标初始化测试 ──

func TestRuntimeMetricsInit(t *testing.T) {
	if GoVersion.Value() == "" {
		t.Error("GoVersion 不应为空（应在 init 中设置）")
	}
	if GoVersion.Value() != runtime.Version() {
		t.Errorf("GoVersion = %q, 期望 %q", GoVersion.Value(), runtime.Version())
	}
	if NumCPU.Value() != int64(runtime.NumCPU()) {
		t.Errorf("NumCPU = %d, 期望 %d", NumCPU.Value(), runtime.NumCPU())
	}
	if CircuitBreakerState.Value() != "closed" {
		t.Errorf("初始 CircuitBreakerState 应为 closed, 实际 %q", CircuitBreakerState.Value())
	}
}