package webui

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

// ── HealthResponse / HealthCheck 结构体测试 ──

func TestHealthResponse_JSON(t *testing.T) {
	resp := HealthResponse{
		Status:  "ok",
		Version: "1.0.0",
		Uptime:  "1h30m",
		Components: map[string]HealthCheck{
			"database": {Status: "ok", Message: "connected"},
		},
		Timestamp: 1700000000000,
	}

	data, err := json.Marshal(resp)
	if err != nil {
		t.Fatalf("JSON 序列化失败: %v", err)
	}

	var result map[string]interface{}
	if err := json.Unmarshal(data, &result); err != nil {
		t.Fatalf("JSON 反序列化失败: %v", err)
	}

	if result["status"] != "ok" {
		t.Errorf("status = %v, 期望 ok", result["status"])
	}
	if result["version"] != "1.0.0" {
		t.Errorf("version = %v, 期望 1.0.0", result["version"])
	}
}

func TestHealthCheck_JSON(t *testing.T) {
	hc := HealthCheck{
		Status:  "ok",
		Message: "all good",
		Latency: "5ms",
	}

	data, err := json.Marshal(hc)
	if err != nil {
		t.Fatalf("JSON 序列化失败: %v", err)
	}

	var result map[string]interface{}
	if err := json.Unmarshal(data, &result); err != nil {
		t.Fatalf("JSON 反序列化失败: %v", err)
	}

	if result["status"] != "ok" {
		t.Errorf("status = %v, 期望 ok", result["status"])
	}
	if result["message"] != "all good" {
		t.Errorf("message = %v, 期望 all good", result["message"])
	}
}

// ── handleHealth 测试 ──

func TestHandleHealth_GET(t *testing.T) {
	s := &Server{
		startTime: time.Now(),
	}

	req := httptest.NewRequest("GET", "/health", nil)
	w := httptest.NewRecorder()

	s.handleHealth(w, req)

	if w.Code != 200 {
		t.Errorf("GET /health 应返回 200, 实际 %d", w.Code)
	}

	var resp HealthResponse
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("JSON 解析失败: %v", err)
	}

	if resp.Version != "1.0.0" {
		t.Errorf("Version = %q, 期望 1.0.0", resp.Version)
	}
	if resp.Status == "" {
		t.Error("Status 不应为空")
	}
	if resp.Timestamp == 0 {
		t.Error("Timestamp 不应为 0")
	}

	// 验证组件检查
	if _, ok := resp.Components["database"]; !ok {
		t.Error("应包含 database 组件检查")
	}
	if _, ok := resp.Components["llm"]; !ok {
		t.Error("应包含 llm 组件检查")
	}
	if _, ok := resp.Components["runtime"]; !ok {
		t.Error("应包含 runtime 组件检查")
	}
	if _, ok := resp.Components["circuit_breaker"]; !ok {
		t.Error("应包含 circuit_breaker 组件检查")
	}
}

func TestHandleHealth_MethodNotAllowed(t *testing.T) {
	s := &Server{
		startTime: time.Now(),
	}

	req := httptest.NewRequest("POST", "/health", nil)
	w := httptest.NewRecorder()

	s.handleHealth(w, req)

	if w.Code != 405 {
		t.Errorf("POST /health 应返回 405, 实际 %d", w.Code)
	}
}

// ── getHeapMB 测试 ──

func TestGetHeapMB(t *testing.T) {
	heap := getHeapMB()
	if heap < 0 {
		t.Errorf("堆内存不应为负数: %d MB", heap)
	}
	// 堆内存应该在合理范围内（测试中通常 < 100MB）
	if heap > 1000 {
		t.Errorf("堆内存异常大: %d MB", heap)
	}
}

// ── jsonResponse / jsonError 测试 ──

func TestJSONResponse(t *testing.T) {
	w := httptest.NewRecorder()
	jsonResponse(w, map[string]string{"key": "value"})

	if w.Code != 200 {
		t.Errorf("jsonResponse 应返回 200, 实际 %d", w.Code)
	}
	var result map[string]string
	if err := json.Unmarshal(w.Body.Bytes(), &result); err != nil {
		t.Fatalf("JSON 解析失败: %v", err)
	}
	if result["key"] != "value" {
		t.Errorf("key = %q, 期望 value", result["key"])
	}
}

func TestJSONError(t *testing.T) {
	w := httptest.NewRecorder()
	jsonError(w, 400, "bad request")

	if w.Code != 400 {
		t.Errorf("jsonError 应返回 400, 实际 %d", w.Code)
	}

	var result map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &result); err != nil {
		t.Fatalf("JSON 解析失败: %v", err)
	}
	if result["message"] != "bad request" {
		t.Errorf("message = %v, 期望 bad request", result["message"])
	}
}

// ── corsMiddleware 测试 ──

func TestCORSMiddleware_GET(t *testing.T) {
	handler := corsMiddleware(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
	})

	req := httptest.NewRequest("GET", "http://localhost:8088/test", nil)
	req.Header.Set("Origin", "http://localhost:8088")
	w := httptest.NewRecorder()
	handler(w, req)

	if w.Header().Get("Access-Control-Allow-Origin") != "http://localhost:8088" {
		t.Errorf("CORS Allow-Origin 应为 http://localhost:8088, 实际 %q", w.Header().Get("Access-Control-Allow-Origin"))
	}
	if w.Header().Get("Access-Control-Allow-Methods") != "GET,POST,PUT,DELETE,OPTIONS" {
		t.Errorf("CORS Allow-Methods = %q, 期望 GET,POST,PUT,DELETE,OPTIONS", w.Header().Get("Access-Control-Allow-Methods"))
	}
}

func TestCORSMiddleware_OPTIONS(t *testing.T) {
	handler := corsMiddleware(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
	})

	req := httptest.NewRequest("OPTIONS", "/test", nil)
	w := httptest.NewRecorder()
	handler(w, req)

	if w.Code != 200 {
		t.Errorf("OPTIONS 请求应返回 200, 实际 %d", w.Code)
	}
}

// ── Server 基础测试 ──

func TestServer_StartTime(t *testing.T) {
	now := time.Now()
	s := &Server{
		startTime: now,
	}
	if !s.startTime.Equal(now) {
		t.Error("startTime 应被正确设置")
	}
}

// ── registerHealthCheck 测试 ──

func TestRegisterHealthCheck(t *testing.T) {
	s := &Server{
		startTime: time.Now(),
	}
	mux := http.NewServeMux()
	s.registerHealthCheck(mux)

	// 验证 /health 路由存在
	req := httptest.NewRequest("GET", "/health", nil)
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)

	if w.Code != 200 {
		t.Errorf("注册后 /health 应返回 200, 实际 %d", w.Code)
	}
}