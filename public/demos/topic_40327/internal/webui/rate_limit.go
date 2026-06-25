package webui

import (
	"net/http"
	"sync"
	"time"
)

// rateLimitEntry 单个 IP 的限流记录
type rateLimitEntry struct {
	minuteCount int
	minuteReset time.Time
	hourlyCount int
	hourlyReset time.Time
}

// RateLimiter IP 级别滑动窗口限流器
type RateLimiter struct {
	mu         sync.Mutex
	entries    map[string]*rateLimitEntry
	maxPerMin  int
	maxPerHour int
}

// NewRateLimiter 创建限流器
func NewRateLimiter(maxPerMin, maxPerHour int) *RateLimiter {
	if maxPerMin <= 0 {
		maxPerMin = 60
	}
	if maxPerHour <= 0 {
		maxPerHour = 1000
	}
	return &RateLimiter{
		entries:    make(map[string]*rateLimitEntry),
		maxPerMin:  maxPerMin,
		maxPerHour: maxPerHour,
	}
}

// Allow 检查请求是否允许通过
func (rl *RateLimiter) Allow(ip string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	entry, exists := rl.entries[ip]
	if !exists || now.After(entry.hourlyReset) {
		entry = &rateLimitEntry{
			minuteReset: now.Truncate(time.Minute).Add(time.Minute),
			hourlyReset: now.Truncate(time.Hour).Add(time.Hour),
		}
		rl.entries[ip] = entry
	}

	// 重置过期计数器
	if now.After(entry.minuteReset) {
		entry.minuteCount = 0
		entry.minuteReset = now.Truncate(time.Minute).Add(time.Minute)
	}
	if now.After(entry.hourlyReset) {
		entry.hourlyCount = 0
		entry.hourlyReset = now.Truncate(time.Hour).Add(time.Hour)
	}

	if entry.minuteCount >= rl.maxPerMin || entry.hourlyCount >= rl.maxPerHour {
		return false
	}

	entry.minuteCount++
	entry.hourlyCount++
	return true
}

// Cleanup 定期清理过期条目（建议每 10 分钟调用一次）
func (rl *RateLimiter) Cleanup() {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	for ip, entry := range rl.entries {
		if now.After(entry.hourlyReset) {
			delete(rl.entries, ip)
		}
	}
}

// rateLimitMiddleware 返回限流中间件
func rateLimitMiddleware(limiter *RateLimiter, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ip := extractClientIP(r)
		if !limiter.Allow(ip) {
			w.Header().Set("Content-Type", "application/json; charset=utf-8")
			w.Header().Set("Retry-After", "60")
			w.WriteHeader(http.StatusTooManyRequests)
			w.Write([]byte(`{"error":true,"message":"请求过于频繁，请稍后再试"}`))
			return
		}
		next(w, r)
	}
}

// extractClientIP 提取客户端真实 IP
// 优先使用 RemoteAddr（直连 IP），仅在请求来自本机（反向代理场景）时信任 X-Forwarded-For
func extractClientIP(r *http.Request) string {
	// 先从 RemoteAddr 获取直连 IP
	remoteIP := stripPort(r.RemoteAddr)

	// 只有来自本机的请求才信任代理头（防止伪造 X-Forwarded-For 绕过限流）
	isLocalhost := remoteIP == "127.0.0.1" || remoteIP == "::1"

	if isLocalhost {
		// 反向代理场景：优先从 X-Forwarded-For 获取真实客户端 IP
		if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
			// 取第一个 IP（最原始客户端）
			for i := 0; i < len(xff); i++ {
				if xff[i] == ',' {
					return xff[:i]
				}
			}
			return xff
		}
		// 其次从 X-Real-IP 获取
		if xri := r.Header.Get("X-Real-IP"); xri != "" {
			return xri
		}
	}

	return remoteIP
}

// stripPort 去掉 IP 地址中的端口号
func stripPort(addr string) string {
	for i := len(addr) - 1; i >= 0; i-- {
		if addr[i] == ':' {
			return addr[:i]
		}
	}
	return addr
}
