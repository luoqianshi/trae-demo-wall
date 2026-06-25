package webui

import (
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"
	"time"
)

func TestRateLimiter_Allow(t *testing.T) {
	rl := NewRateLimiter(3, 10)

	// 前 3 次应该通过
	for i := 0; i < 3; i++ {
		if !rl.Allow("127.0.0.1") {
			t.Errorf("第 %d 次请求应该被允许", i+1)
		}
	}

	// 第 4 次应该被拒绝
	if rl.Allow("127.0.0.1") {
		t.Error("超过每分钟限制后应该被拒绝")
	}

	// 不同 IP 不受影响
	if !rl.Allow("192.168.1.1") {
		t.Error("不同 IP 的请求应该被允许")
	}
}

func TestRateLimiter_HourlyLimit(t *testing.T) {
	rl := NewRateLimiter(60, 2)

	// 前 2 次通过
	if !rl.Allow("10.0.0.1") {
		t.Error("第 1 次应该通过")
	}
	if !rl.Allow("10.0.0.1") {
		t.Error("第 2 次应该通过")
	}

	// 第 3 次被拒绝（小时限制）
	if rl.Allow("10.0.0.1") {
		t.Error("超过每小时限制后应该被拒绝")
	}
}

func TestRateLimiter_Reset(t *testing.T) {
	rl := NewRateLimiter(2, 100)

	// 用完配额
	if !rl.Allow("10.0.0.2") {
		t.Error("第 1 次应该通过")
	}
	if !rl.Allow("10.0.0.2") {
		t.Error("第 2 次应该通过")
	}
	if rl.Allow("10.0.0.2") {
		t.Error("第 3 次应该被拒绝")
	}

	// 手动重置分钟计数器（模拟时间流逝）
	rl.mu.Lock()
	entry := rl.entries["10.0.0.2"]
	entry.minuteReset = time.Now().Add(-time.Second) // 已过期
	rl.mu.Unlock()

	if !rl.Allow("10.0.0.2") {
		t.Error("分钟窗口重置后应该被允许")
	}
}

func TestRateLimiter_Concurrent(t *testing.T) {
	rl := NewRateLimiter(100, 1000)
	var wg sync.WaitGroup

	// 并发 50 个请求，全部应该通过
	for i := 0; i < 50; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			if !rl.Allow("10.0.0.3") {
				t.Error("并发请求应该被允许")
			}
		}()
	}
	wg.Wait()
}

func TestRateLimiter_Cleanup(t *testing.T) {
	rl := NewRateLimiter(10, 100)

	rl.Allow("10.0.0.4")
	rl.Allow("10.0.0.5")

	// 所有条目在有效期内，不应该被清理
	rl.Cleanup()
	rl.mu.Lock()
	if len(rl.entries) != 2 {
		t.Errorf("活跃条目不应该被清理，当前 %d 条", len(rl.entries))
	}
	rl.mu.Unlock()

	// 手动让条目过期
	rl.mu.Lock()
	for _, e := range rl.entries {
		e.hourlyReset = time.Now().Add(-time.Second)
	}
	rl.mu.Unlock()

	rl.Cleanup()
	rl.mu.Lock()
	if len(rl.entries) != 0 {
		t.Errorf("过期条目应该被清理，当前 %d 条", len(rl.entries))
	}
	rl.mu.Unlock()
}

func TestRateLimitMiddleware(t *testing.T) {
	rl := NewRateLimiter(1, 10)

	handler := rateLimitMiddleware(rl, func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})

	// 第 1 次通过
	req1 := httptest.NewRequest("GET", "/api/test", nil)
	req1.RemoteAddr = "10.0.0.6:12345"
	rec1 := httptest.NewRecorder()
	handler(rec1, req1)
	if rec1.Code != http.StatusOK {
		t.Errorf("第 1 次应该返回 200，实际 %d", rec1.Code)
	}

	// 第 2 次被限流
	req2 := httptest.NewRequest("GET", "/api/test", nil)
	req2.RemoteAddr = "10.0.0.6:12345"
	rec2 := httptest.NewRecorder()
	handler(rec2, req2)
	if rec2.Code != http.StatusTooManyRequests {
		t.Errorf("第 2 次应该返回 429，实际 %d", rec2.Code)
	}
}

func TestExtractClientIP(t *testing.T) {
	tests := []struct {
		name     string
		headers  map[string]string
		addr     string
		expected string
	}{
		{
			name:     "X-Forwarded-For（仅本机反向代理时信任）",
			headers:  map[string]string{"X-Forwarded-For": "1.2.3.4, 5.6.7.8"},
			addr:     "127.0.0.1:12345",
			expected: "1.2.3.4",
		},
		{
			name:     "X-Real-IP（仅本机反向代理时信任）",
			headers:  map[string]string{"X-Real-IP": "2.3.4.5"},
			addr:     "127.0.0.1:12345",
			expected: "2.3.4.5",
		},
		{
			name:     "X-Forwarded-For（非本机请求，拒绝伪造）",
			headers:  map[string]string{"X-Forwarded-For": "1.2.3.4, 5.6.7.8"},
			addr:     "10.0.0.1:12345",
			expected: "10.0.0.1",
		},
		{
			name:     "X-Real-IP（非本机请求，拒绝伪造）",
			headers:  map[string]string{"X-Real-IP": "2.3.4.5"},
			addr:     "10.0.0.1:12345",
			expected: "10.0.0.1",
		},
		{
			name:     "RemoteAddr",
			headers:  map[string]string{},
			addr:     "10.0.0.1:12345",
			expected: "10.0.0.1",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest("GET", "/", nil)
			for k, v := range tt.headers {
				req.Header.Set(k, v)
			}
			req.RemoteAddr = tt.addr
			got := extractClientIP(req)
			if got != tt.expected {
				t.Errorf("extractClientIP() = %q, want %q", got, tt.expected)
			}
		})
	}
}
