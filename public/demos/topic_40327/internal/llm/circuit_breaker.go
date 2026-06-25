package llm

import (
	"errors"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"YaraFlow/internal/logger"
	"YaraFlow/internal/metrics"
)

// ErrCircuitOpen 熔断器已打开，请求被拒绝
var ErrCircuitOpen = errors.New("circuit breaker is open, request rejected")

// CircuitState 熔断器状态
type CircuitState int32

const (
	CircuitClosed   CircuitState = iota // 正常通行
	CircuitOpen                         // 熔断拒绝
	CircuitHalfOpen                     // 半开试探
)

func (s CircuitState) String() string {
	switch s {
	case CircuitClosed:
		return "closed"
	case CircuitOpen:
		return "open"
	case CircuitHalfOpen:
		return "half-open"
	default:
		return "unknown"
	}
}

// CircuitBreakerConfig 熔断器配置
type CircuitBreakerConfig struct {
	FailureThreshold int           // 失败次数阈值（滑动窗口内）
	SuccessThreshold int           // 半开状态下连续成功次数阈值
	WindowDuration   time.Duration // 滑动窗口时间长度
	OpenDuration     time.Duration // 熔断打开后等待时间
	HalfOpenMaxReqs  int           // 半开状态下最大允许请求数
}

// DefaultCircuitBreakerConfig 默认熔断器配置
func DefaultCircuitBreakerConfig() CircuitBreakerConfig {
	return CircuitBreakerConfig{
		FailureThreshold: 5,                // 5次失败触发熔断
		SuccessThreshold: 2,                // 2次连续成功恢复
		WindowDuration:   60 * time.Second, // 60秒滑动窗口
		OpenDuration:     30 * time.Second, // 30秒后尝试半开
		HalfOpenMaxReqs:  1,                // 半开时只允许1个请求
	}
}

// CircuitBreaker LLM API 调用熔断器
type CircuitBreaker struct {
	name   string // 熔断器名称，用于日志和注册表标识
	config CircuitBreakerConfig

	mu       sync.Mutex
	state    CircuitState
	failures []time.Time // 失败时间戳滑动窗口

	halfOpenReqs   int32 // 半开状态下已发送请求数
	halfOpenPassed int32 // 半开状态下成功请求数
	lastFailTime   time.Time
	stateChangedAt time.Time
}

// NewCircuitBreaker 创建熔断器
func NewCircuitBreaker(cfg CircuitBreakerConfig) *CircuitBreaker {
	if cfg.FailureThreshold <= 0 {
		cfg.FailureThreshold = 5
	}
	if cfg.SuccessThreshold <= 0 {
		cfg.SuccessThreshold = 2
	}
	if cfg.WindowDuration <= 0 {
		cfg.WindowDuration = 60 * time.Second
	}
	if cfg.OpenDuration <= 0 {
		cfg.OpenDuration = 30 * time.Second
	}
	if cfg.HalfOpenMaxReqs <= 0 {
		cfg.HalfOpenMaxReqs = 1
	}

	return &CircuitBreaker{
		config:         cfg,
		state:          CircuitClosed,
		stateChangedAt: time.Now(),
	}
}

// NewNamedCircuitBreaker 创建带名称的熔断器，名称用于日志标识和注册表 key
func NewNamedCircuitBreaker(name string, cfg CircuitBreakerConfig) *CircuitBreaker {
	cb := NewCircuitBreaker(cfg)
	cb.name = name
	return cb
}

// State 返回当前状态
func (cb *CircuitBreaker) State() CircuitState {
	return CircuitState(atomic.LoadInt32((*int32)(&cb.state)))
}

// setState 设置状态（需持有锁）
func (cb *CircuitBreaker) setState(s CircuitState) {
	old := cb.State()
	atomic.StoreInt32((*int32)(&cb.state), int32(s))
	cb.stateChangedAt = time.Now()

	if old != s {
		if cb.name != "" {
			logger.Sugar.Infow("[熔断器] 状态变更", "name", cb.name, "old", old, "new", s)
		} else {
			logger.Sugar.Infow("[熔断器] 状态变更", "old", old, "new", s)
		}
	}

	// 更新聚合熔断器指标（取所有已注册熔断器中最严重的状态）
	updateAggregateCircuitBreakerMetric()
}

// Allow 检查是否允许请求通过
// 返回 true 表示允许，false 表示被熔断拒绝
func (cb *CircuitBreaker) Allow() error {
	cb.mu.Lock()
	defer cb.mu.Unlock()

	state := cb.State()

	switch state {
	case CircuitClosed:
		cb.pruneFailures()
		if len(cb.failures) >= cb.config.FailureThreshold {
			cb.setState(CircuitOpen)
			return ErrCircuitOpen
		}
		return nil

	case CircuitOpen:
		if time.Since(cb.lastFailTime) >= cb.config.OpenDuration {
			cb.setState(CircuitHalfOpen)
			cb.halfOpenReqs = 0
			cb.halfOpenPassed = 0
			// 半开状态允许试探
			if cb.halfOpenReqs < int32(cb.config.HalfOpenMaxReqs) {
				atomic.AddInt32(&cb.halfOpenReqs, 1)
				return nil
			}
			return ErrCircuitOpen
		}
		return ErrCircuitOpen

	case CircuitHalfOpen:
		if cb.halfOpenReqs >= int32(cb.config.HalfOpenMaxReqs) {
			return ErrCircuitOpen
		}
		atomic.AddInt32(&cb.halfOpenReqs, 1)
		return nil

	default:
		return ErrCircuitOpen
	}
}

// RecordSuccess 记录一次成功调用
func (cb *CircuitBreaker) RecordSuccess() {
	cb.mu.Lock()
	defer cb.mu.Unlock()

	state := cb.State()

	switch state {
	case CircuitClosed:
		// 成功时清空失败记录（表示服务恢复）
		cb.failures = nil

	case CircuitHalfOpen:
		passed := atomic.AddInt32(&cb.halfOpenPassed, 1)
		if passed >= int32(cb.config.SuccessThreshold) {
			cb.failures = nil
			cb.setState(CircuitClosed)
			logger.Info("[熔断器] 半开探测成功，熔断器已恢复关闭")
		}

	case CircuitOpen:
		// 不应该在 Open 状态下收到成功
		// 但作为安全措施，记录并尝试恢复
		cb.failures = nil
		cb.setState(CircuitClosed)
	}
}

// RecordFailure 记录一次失败调用（计入熔断阈值）
func (cb *CircuitBreaker) RecordFailure() {
	cb.recordFailure(false)
}

// RecordFailureRetryable 记录一次可重试的失败（如 429 限流，不计入熔断阈值）
// 这类错误是短暂的、可自动恢复的，不应触发熔断器
func (cb *CircuitBreaker) RecordFailureRetryable() {
	cb.recordFailure(true)
}

// recordFailure 记录一次失败调用
// retryable: true 表示可重试错误（不计入熔断计数），false 表示真正的故障
func (cb *CircuitBreaker) recordFailure(retryable bool) {
	cb.mu.Lock()
	defer cb.mu.Unlock()

	cb.lastFailTime = time.Now()

	if retryable {
		// 可重试错误（如 429），只更新最后失败时间，不计入失败计数
		return
	}

	cb.pruneFailures()

	state := cb.State()

	switch state {
	case CircuitClosed:
		cb.failures = append(cb.failures, time.Now())
		if len(cb.failures) >= cb.config.FailureThreshold {
			cb.setState(CircuitOpen)
			logger.Sugar.Warnw("[熔断器] 滑动窗口内失败次数达标，熔断器已打开", "failures", len(cb.failures), "threshold", cb.config.FailureThreshold)
		}

	case CircuitHalfOpen:
		// 半开状态下失败，立即重新打开
		cb.failures = append(cb.failures, time.Now())
		cb.setState(CircuitOpen)
		logger.Warn("[熔断器] 半开探测失败，熔断器重新打开")

	case CircuitOpen:
		cb.failures = append(cb.failures, time.Now())
	}
}

// pruneFailures 清理滑动窗口外的失败记录（需持有锁）
func (cb *CircuitBreaker) pruneFailures() {
	cutoff := time.Now().Add(-cb.config.WindowDuration)
	valid := cb.failures[:0]
	for _, t := range cb.failures {
		if t.After(cutoff) {
			valid = append(valid, t)
		}
	}
	cb.failures = valid
}

// FailureCount 返回当前滑动窗口内的失败次数
func (cb *CircuitBreaker) FailureCount() int {
	cb.mu.Lock()
	defer cb.mu.Unlock()
	cb.pruneFailures()
	return len(cb.failures)
}

// Reset 手动重置熔断器
func (cb *CircuitBreaker) Reset() {
	cb.mu.Lock()
	defer cb.mu.Unlock()
	cb.failures = nil
	cb.halfOpenReqs = 0
	cb.halfOpenPassed = 0
	cb.setState(CircuitClosed)
}

// Status 返回熔断器状态摘要
func (cb *CircuitBreaker) Status() map[string]interface{} {
	cb.mu.Lock()
	defer cb.mu.Unlock()

	cb.pruneFailures()
	return map[string]interface{}{
		"name":              cb.name,
		"state":             cb.State().String(),
		"failure_count":     len(cb.failures),
		"failure_threshold": cb.config.FailureThreshold,
		"state_changed_at":  cb.stateChangedAt.Format(time.RFC3339),
		"last_fail_time":    cb.lastFailTime.Format(time.RFC3339),
		"open_duration":     cb.config.OpenDuration.String(),
		"window_duration":   cb.config.WindowDuration.String(),
	}
}

// ── 熔断器注册表（per-provider 隔离） ──
//
// 旧设计使用 GlobalCircuitBreaker 单例，所有 provider 共享一个熔断器，
// 导致一个 provider 故障会熔断所有 provider。
// 现改为每个 provider 实例持有独立的 *CircuitBreaker，并注册到全局注册表，
// 供 WebUI 聚合查询和批量重置使用。

var cbRegistry sync.Map // key: string, value: *CircuitBreaker

// RegisterCircuitBreaker 注册熔断器到全局注册表
func RegisterCircuitBreaker(name string, cb *CircuitBreaker) {
	cbRegistry.Store(name, cb)
}

// GetAllCircuitBreakers 返回所有已注册熔断器的快照
func GetAllCircuitBreakers() map[string]*CircuitBreaker {
	result := make(map[string]*CircuitBreaker)
	cbRegistry.Range(func(key, value interface{}) bool {
		result[key.(string)] = value.(*CircuitBreaker)
		return true
	})
	return result
}

// circuitStatePriority 状态严重程度优先级，值越大越严重
var circuitStatePriority = map[CircuitState]int{
	CircuitClosed:   0,
	CircuitHalfOpen: 1,
	CircuitOpen:     2,
}

// updateAggregateCircuitBreakerMetric 计算所有已注册熔断器的聚合状态并更新指标
// 聚合规则：任一 open → open；否则任一 half-open → half-open；否则 closed
// 注意：State() 使用 atomic 读取，无需获取 cb.mu，可安全在 setState（持有 cb.mu）中调用
func updateAggregateCircuitBreakerMetric() {
	aggregateState := CircuitClosed
	cbRegistry.Range(func(_, value interface{}) bool {
		cb := value.(*CircuitBreaker)
		if circuitStatePriority[cb.State()] > circuitStatePriority[aggregateState] {
			aggregateState = cb.State()
		}
		return true
	})
	metrics.SetCircuitBreakerState(aggregateState.String())
}

// GetAggregateCircuitBreakerStatus 返回所有熔断器的聚合状态和明细列表
func GetAggregateCircuitBreakerStatus() map[string]interface{} {
	all := GetAllCircuitBreakers()
	breakers := make([]map[string]interface{}, 0, len(all))
	aggregateState := CircuitClosed

	for name, cb := range all {
		status := cb.Status()
		status["name"] = name
		breakers = append(breakers, status)
		if circuitStatePriority[cb.State()] > circuitStatePriority[aggregateState] {
			aggregateState = cb.State()
		}
	}

	return map[string]interface{}{
		"aggregate_state": aggregateState.String(),
		"breaker_count":   len(breakers),
		"breakers":        breakers,
	}
}

// ResetAllCircuitBreakers 重置所有已注册的熔断器
func ResetAllCircuitBreakers() {
	cbRegistry.Range(func(_, value interface{}) bool {
		value.(*CircuitBreaker).Reset()
		return true
	})
}

// IsRetryableError 检查是否为可重试的错误（如 HTTP 429 限流、网络抖动）
// 这类错误是短暂的，不应计入熔断器失败计数
func IsRetryableError(err error) bool {
	if err == nil {
		return false
	}
	msg := err.Error()
	return strings.Contains(msg, "429") ||
		strings.Contains(msg, "rate limit") ||
		strings.Contains(msg, "throttl") ||
		strings.Contains(msg, "too many requests")
}
