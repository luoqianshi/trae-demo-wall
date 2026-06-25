package processor

import (
	"context"
	"testing"
	"time"

	"go.uber.org/zap"

	"YaraFlow/internal/config"
	"YaraFlow/internal/logger"
	"YaraFlow/internal/platform"
	"YaraFlow/internal/processor/pipeline"
)

func init() {
	// 初始化 no-op logger 避免测试中 nil pointer
	logger.Logger = zap.NewNop()
	logger.Sugar = logger.Logger.Sugar()
}

// ── Pipeline 集成测试 ──

func TestPipeline_FullFlow(t *testing.T) {
	ctx := context.Background()
	pl := pipeline.NewPipeline(ctx, "msg-123")

	if pl.TraceID == "" {
		t.Error("Pipeline TraceID 不应为空")
	}
	if pl.Metrics().MsgID != "msg-123" {
		t.Errorf("MsgID = %q, 期望 msg-123", pl.Metrics().MsgID)
	}

	// Stage 1: 模拟去重
	skip, err := pl.RunStage(pipeline.StageDedupe, func(ctx context.Context) (bool, error) {
		time.Sleep(5 * time.Millisecond)
		return false, nil
	})
	if skip || err != nil {
		t.Fatalf("StageDedupe 不应 skip: skip=%v, err=%v", skip, err)
	}

	// Stage 2: 模拟预处理
	skip, err = pl.RunStage(pipeline.StagePreProcess, func(ctx context.Context) (bool, error) {
		time.Sleep(10 * time.Millisecond)
		return false, nil
	})
	if skip || err != nil {
		t.Fatalf("StagePreProcess 不应 skip: skip=%v, err=%v", skip, err)
	}

	// Stage 3: 模拟门控（跳过）
	skip, err = pl.RunStage(pipeline.StageGate, func(ctx context.Context) (bool, error) {
		return true, nil // 门控返回 skip，表示不需要回复
	})
	if !skip || err != nil {
		t.Fatalf("StageGate 应 skip: skip=%v, err=%v", skip, err)
	}

	// Stage 4: 不应执行（因为 Stage 3 已 skip）
	// 注意：RunStage 不会自动跳过，需要调用方检查 skip

	pl.Done()
	pl.LogSummary()

	metrics := pl.Metrics()
	if !metrics.Complete {
		t.Error("Pipeline 应标记为完成")
	}
	if metrics.Total <= 0 {
		t.Error("Pipeline 总耗时不应为 0")
	}
	if len(metrics.Stages) != 3 {
		t.Errorf("应有 3 个阶段, 实际 %d", len(metrics.Stages))
	}

	// 验证阶段顺序
	expectedStages := []pipeline.StageName{pipeline.StageDedupe, pipeline.StagePreProcess, pipeline.StageGate}
	for i, expected := range expectedStages {
		if metrics.Stages[i].Name != expected {
			t.Errorf("阶段 %d 应为 %s, 实际 %s", i+1, expected, metrics.Stages[i].Name)
		}
	}

	// 验证 DurationMap
	dMap := metrics.DurationMap()
	if _, ok := dMap[pipeline.StageDedupe]; !ok {
		t.Error("DurationMap 应包含 StageDedupe")
	}
	if _, ok := dMap[pipeline.StageGate]; !ok {
		t.Error("DurationMap 应包含 StageGate")
	}

	// 验证 SlowestStage
	slowest, slowDur := metrics.SlowestStage()
	if slowest == "" {
		t.Error("SlowestStage 不应为空")
	}
	if slowDur <= 0 {
		t.Error("最慢阶段耗时应 > 0")
	}
}

func TestPipeline_ContextCancellation(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())

	pl := pipeline.NewPipeline(ctx, "msg-cancel")

	// 先成功跑一个阶段
	skip, err := pl.RunStage(pipeline.StageDedupe, func(ctx context.Context) (bool, error) {
		return false, nil
	})
	if skip || err != nil {
		t.Fatalf("第一阶段应成功: skip=%v, err=%v", skip, err)
	}

	// 取消 context
	cancel()

	// 后续阶段应被取消
	skip, err = pl.RunStage(pipeline.StagePreProcess, func(ctx context.Context) (bool, error) {
		return false, nil
	})
	if !skip {
		t.Error("context 取消后应 skip")
	}
	if err != context.Canceled {
		t.Errorf("context 取消后应返回 Canceled, 实际 %v", err)
	}
}

func TestPipeline_NewPipeline_NilContext(t *testing.T) {
	pl := pipeline.NewPipeline(context.TODO(), "msg-nil")
	if pl == nil {
		t.Fatal("NewPipeline 不应返回 nil")
	}
	if pl.TraceID == "" {
		t.Error("TraceID 不应为空")
	}
}

func TestPipelineMetrics_SlowestStage(t *testing.T) {
	pm := pipeline.PipelineMetrics{
		Stages: []pipeline.StageMetrics{
			{Name: pipeline.StageDedupe, Duration: 10 * time.Millisecond},
			{Name: pipeline.StagePreProcess, Duration: 50 * time.Millisecond},
			{Name: pipeline.StageGate, Duration: 30 * time.Millisecond},
		},
	}

	slowest, dur := pm.SlowestStage()
	if slowest != pipeline.StagePreProcess {
		t.Errorf("最慢阶段应为 PreProcess, 实际 %s", slowest)
	}
	if dur != 50*time.Millisecond {
		t.Errorf("最慢阶段耗时应为 50ms, 实际 %v", dur)
	}
}

func TestPipelineMetrics_Empty(t *testing.T) {
	pm := pipeline.PipelineMetrics{}
	slowest, dur := pm.SlowestStage()
	if slowest != "" {
		t.Errorf("空 PipelineMetrics 最慢阶段应为空, 实际 %q", slowest)
	}
	if dur != 0 {
		t.Errorf("空 PipelineMetrics 耗时应为 0, 实际 %v", dur)
	}
}

// ── MessageProcessor 集成测试 ──

func TestMessageProcessor_Process_Basic(t *testing.T) {
	cfg := &config.Config{
		Bot: config.BotConfig{
			QQ:       "123456",
			Nickname: "瞳瞳",
			Aliases:  []string{"小瞳", "瞳酱"},
		},
	}

	mp := NewMessageProcessor(cfg, nil)
	if mp == nil {
		t.Fatal("MessageProcessor 不应为 nil")
	}

	msg := platform.Message{
		ID:         "msg-001",
		SenderID:   "user-001",
		SenderName: "测试用户",
		Content:    "你好瞳瞳",
		GroupID:    "group-001",
		Timestamp:  time.Now().UnixMilli(),
	}

	processed, err := mp.Process(msg)
	if err != nil {
		t.Fatalf("Process 失败: %v", err)
	}
	if processed == nil {
		t.Fatal("processed 不应为 nil")
	}
	if processed.Content != "你好瞳瞳" {
		t.Errorf("Content = %q, 期望 你好瞳瞳", processed.Content)
	}
}