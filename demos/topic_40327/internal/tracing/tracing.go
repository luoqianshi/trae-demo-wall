// Package tracing 提供分布式追踪能力
// 基于 OpenTelemetry 标准，为消息处理流水线、LLM 调用等关键路径提供端到端追踪
// 与 logger 包中的 trace_id 机制无缝集成，确保日志与追踪关联
package tracing

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"time"
)

// Logger 追踪所需的日志接口
type Logger interface {
	Infow(msg string, keysAndValues ...any)
	Errorw(msg string, keysAndValues ...any)
}

// Config 追踪配置
type Config struct {
	Logger    Logger
	TraceIDFn func() string
}

var cfg Config

// Init 初始化追踪系统
func Init(c Config) {
	cfg = c
	if cfg.Logger != nil {
		cfg.Logger.Infow("[追踪] 分布式追踪系统已初始化（基于 OpenTelemetry 语义）")
	}
}

// GenerateTraceID 生成一个16字符的十六进制 trace ID
func GenerateTraceID() string {
	if cfg.TraceIDFn != nil {
		return cfg.TraceIDFn()
	}
	b := make([]byte, 8)
	rand.Read(b)
	return hex.EncodeToString(b)
}

// SpanKind 表示 Span 类型
type SpanKind string

const (
	SpanKindInternal SpanKind = "internal"
	SpanKindServer   SpanKind = "server"
	SpanKindClient   SpanKind = "client"
)

// Span 表示一个追踪 Span
type Span struct {
	Name      string
	TraceID   string
	SpanID    string
	Kind      SpanKind
	StartTime time.Time
	EndTime   time.Time
	attrs     map[string]string
	events    []SpanEvent
	parent    *Span
}

// SpanEvent Span 内的事件
type SpanEvent struct {
	Name      string
	Timestamp time.Time
	Attrs     map[string]string
}

// StartSpan 从 context 中创建新的 Span
// 如果 context 中已有 Span，则作为父 Span
func StartSpan(ctx context.Context, name string, kind SpanKind) (context.Context, *Span) {
	traceID := GenerateTraceID()
	spanID := GenerateTraceID()

	// 尝试从 context 获取父 Span
	parent, _ := ctx.Value(spanContextKey{}).(*Span)
	if parent != nil {
		traceID = parent.TraceID
	}

	span := &Span{
		Name:      name,
		TraceID:   traceID,
		SpanID:    spanID,
		Kind:      kind,
		StartTime: time.Now(),
		attrs:     make(map[string]string),
	}

	ctx = context.WithValue(ctx, spanContextKey{}, span)
	return ctx, span
}

// End 结束 Span
func (s *Span) End() {
	if s == nil {
		return
	}
	s.EndTime = time.Now()
	duration := s.EndTime.Sub(s.StartTime)

	var fields []any
	fields = append(fields, "trace_id", s.TraceID)
	fields = append(fields, "span", s.Name)
	fields = append(fields, "duration_ms", duration.Milliseconds())
	fields = append(fields, "kind", string(s.Kind))

	for k, v := range s.attrs {
		fields = append(fields, k, v)
	}

	if len(s.events) > 0 {
		eventNames := make([]string, len(s.events))
		for i, e := range s.events {
			eventNames[i] = e.Name
		}
		fields = append(fields, "events", eventNames)
	}

	if cfg.Logger != nil {
		cfg.Logger.Infow("[追踪] Span 结束", fields...)
	}
}

// SetAttr 设置属性
func (s *Span) SetAttr(key, value string) {
	if s == nil {
		return
	}
	s.attrs[key] = value
}

// AddEvent 添加事件
func (s *Span) AddEvent(name string, attrs map[string]string) {
	if s == nil {
		return
	}
	s.events = append(s.events, SpanEvent{
		Name:      name,
		Timestamp: time.Now(),
		Attrs:     attrs,
	})
}

// RecordError 记录错误
func (s *Span) RecordError(err error) {
	if s == nil || err == nil {
		return
	}
	s.AddEvent("error", map[string]string{
		"error": err.Error(),
	})
	if cfg.Logger != nil {
		cfg.Logger.Errorw("[追踪] Span 错误", "span", s.Name, "error", err)
	}
}

// Context 返回 context 值，用于跨 API 传递
type spanContextKey struct{}

// SpanFromContext 从 context 中提取 Span
func SpanFromContext(ctx context.Context) *Span {
	span, _ := ctx.Value(spanContextKey{}).(*Span)
	return span
}
