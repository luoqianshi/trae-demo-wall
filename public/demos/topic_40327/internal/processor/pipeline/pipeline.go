package pipeline

import (
	"context"
	"time"

	"YaraFlow/internal/logger"
	"YaraFlow/internal/metrics"
	"YaraFlow/internal/webui"
)

// StageName 管线阶段名称
type StageName string

const (
	StageDedupe     StageName = "dedupe"
	StagePreProcess StageName = "preprocess"
	StageGate       StageName = "gate"
	StageDecide     StageName = "decide"
	StageReply      StageName = "reply"
)

// StageMetrics 单个阶段的耗时统计
type StageMetrics struct {
	Name     StageName
	Start    time.Time
	Duration time.Duration
	Skipped  bool
	Err      error
}

// PipelineMetrics 管线各阶段耗时汇总
type PipelineMetrics struct {
	Stages   []StageMetrics
	Total    time.Duration
	MsgID    string
	Complete bool
}

// DurationMap 返回阶段名→耗时的 map，方便外部消费
func (pm *PipelineMetrics) DurationMap() map[StageName]time.Duration {
	m := make(map[StageName]time.Duration, len(pm.Stages))
	for _, s := range pm.Stages {
		m[s.Name] = s.Duration
	}
	return m
}

// SlowestStage 返回耗时最长的阶段
func (pm *PipelineMetrics) SlowestStage() (StageName, time.Duration) {
	var slowest StageName
	var max time.Duration
	for _, s := range pm.Stages {
		if s.Duration > max {
			max = s.Duration
			slowest = s.Name
		}
	}
	return slowest, max
}

// Pipeline 消息处理管线，串联各阶段并收集指标
type Pipeline struct {
	ctx          context.Context
	metrics      PipelineMetrics
	TraceID      string
	ShouldReply  bool   // 是否触发了回复
	ReplyContent string // 回复内容摘要
	GroupID      string // 群组ID
}

// NewPipeline 创建消息处理管线
// ctx 携带超时/取消信号，贯穿所有阶段
func NewPipeline(ctx context.Context, msgID string) *Pipeline {
	if ctx == nil {
		ctx = context.Background()
	}
	return &Pipeline{
		ctx: ctx,
		metrics: PipelineMetrics{
			MsgID: msgID,
		},
		TraceID: logger.GenerateTraceID(),
	}
}

// Metrics 返回管线指标（处理完成后调用）
func (p *Pipeline) Metrics() PipelineMetrics {
	return p.metrics
}

// RunStage 执行一个管线阶段，自动记录耗时
// fn 返回 (是否跳过后续阶段, error)
// 如果 ctx 已取消，直接返回 context.Canceled
func (p *Pipeline) RunStage(name StageName, fn func(ctx context.Context) (skip bool, err error)) (bool, error) {
	select {
	case <-p.ctx.Done():
		return true, p.ctx.Err()
	default:
	}

	start := time.Now()
	skip, err := fn(p.ctx)
	dur := time.Since(start)

	sm := StageMetrics{
		Name:     name,
		Start:    start,
		Duration: dur,
		Skipped:  skip,
		Err:      err,
	}

	traceLog := logger.WithTrace(p.TraceID)
	if err != nil {
		traceLog.Warnw("管线阶段出错",
			"stage", string(name),
			"duration_ms", dur.Milliseconds(),
			"error", err.Error(),
		)
	} else if skip {
		traceLog.Infow("管线阶段提前终止",
			"stage", string(name),
			"duration_ms", dur.Milliseconds(),
		)
	} else {
		traceLog.Debugw("管线阶段完成",
			"stage", string(name),
			"duration_ms", dur.Milliseconds(),
		)
	}

	p.metrics.Stages = append(p.metrics.Stages, sm)

	webui.PushMessageStatus(webui.MessageStatusEvent{
		Type:       "stage_complete",
		TraceID:    p.TraceID,
		MsgID:      p.metrics.MsgID,
		Stage:      string(name),
		DurationMs: dur.Milliseconds(),
		GroupID:    p.GroupID,
	})

	return skip, err
}

// Done 标记管线完成，记录总耗时
func (p *Pipeline) Done() {
	p.metrics.Complete = true
	if len(p.metrics.Stages) > 0 {
		p.metrics.Total = time.Since(p.metrics.Stages[0].Start)
		metrics.RecordPipelineLatency(float64(p.metrics.Total.Milliseconds()))
	}

	webui.PushMessageStatus(webui.MessageStatusEvent{
		Type:         "pipeline_end",
		TraceID:      p.TraceID,
		MsgID:        p.metrics.MsgID,
		TotalMs:      float64(p.metrics.Total.Milliseconds()),
		StageCount:   len(p.metrics.Stages),
		ShouldReply:  p.ShouldReply,
		ReplyContent: p.ReplyContent,
		GroupID:      p.GroupID,
	})
}

// LogSummary 输出管线耗时摘要
func (p *Pipeline) LogSummary() {
	if !p.metrics.Complete {
		return
	}
	slowest, slowDur := p.metrics.SlowestStage()
	traceLog := logger.WithTrace(p.TraceID)
	traceLog.Infow("消息处理完成",
		"msg_id", p.metrics.MsgID,
		"total", p.metrics.Total.Round(time.Microsecond).String(),
		"slowest_stage", string(slowest),
		"slowest_dur", slowDur.Round(time.Microsecond).String(),
		"stage_count", len(p.metrics.Stages),
	)
}