package webui

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestAuthMiddleware_NoToken(t *testing.T) {
	SetAuthToken("test-token-123")

	handler := authMiddleware(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	req := httptest.NewRequest("GET", "/api/test", nil)
	rec := httptest.NewRecorder()
	handler(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("无 token 应返回 401，实际 %d", rec.Code)
	}

	var body map[string]interface{}
	json.NewDecoder(rec.Body).Decode(&body)
	if body["error"] != true {
		t.Error("错误响应应包含 error: true")
	}
}

func TestAuthMiddleware_ValidToken(t *testing.T) {
	SetAuthToken("test-token-123")

	handler := authMiddleware(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})

	req := httptest.NewRequest("GET", "/api/test", nil)
	req.Header.Set("Authorization", "Bearer test-token-123")
	rec := httptest.NewRecorder()
	handler(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("有效 token 应返回 200，实际 %d", rec.Code)
	}
}

func TestAuthMiddleware_InvalidToken(t *testing.T) {
	SetAuthToken("test-token-123")

	handler := authMiddleware(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	req := httptest.NewRequest("GET", "/api/test", nil)
	req.Header.Set("Authorization", "Bearer wrong-token")
	rec := httptest.NewRecorder()
	handler(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("无效 token 应返回 401，实际 %d", rec.Code)
	}
}

func TestAuthMiddleware_QueryToken(t *testing.T) {
	SetAuthToken("test-token-123")

	handler := authMiddleware(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	req := httptest.NewRequest("GET", "/api/test?token=test-token-123", nil)
	rec := httptest.NewRecorder()
	handler(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("query 参数 token 应返回 200，实际 %d", rec.Code)
	}
}

func TestAuthMiddleware_NoTokenSet(t *testing.T) {
	SetAuthToken("") // 未设置 token 时允许所有请求

	handler := authMiddleware(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	req := httptest.NewRequest("GET", "/api/test", nil)
	rec := httptest.NewRecorder()
	handler(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("未设置 token 时应允许访问，实际 %d", rec.Code)
	}
}

func TestHandleLogin_ValidToken(t *testing.T) {
	SetAuthToken("login-token")
	s := &Server{}

	body := `{"token":"login-token"}`
	req := httptest.NewRequest("POST", "/api/auth/login", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	s.handleLogin(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("正确 token 登录应返回 200，实际 %d", rec.Code)
	}
}

func TestHandleLogin_InvalidToken(t *testing.T) {
	SetAuthToken("login-token")
	s := &Server{}

	body := `{"token":"wrong"}`
	req := httptest.NewRequest("POST", "/api/auth/login", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	s.handleLogin(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("错误 token 登录应返回 401，实际 %d", rec.Code)
	}
}

func TestHandleLogin_WrongMethod(t *testing.T) {
	s := &Server{}
	req := httptest.NewRequest("GET", "/api/auth/login", nil)
	rec := httptest.NewRecorder()
	s.handleLogin(rec, req)

	if rec.Code != http.StatusMethodNotAllowed {
		t.Errorf("GET 方法应返回 405，实际 %d", rec.Code)
	}
}

func TestHandleAuthStatus(t *testing.T) {
	SetAuthToken("some-token")
	s := &Server{}

	req := httptest.NewRequest("GET", "/api/auth/status", nil)
	rec := httptest.NewRecorder()
	s.handleAuthStatus(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("应返回 200，实际 %d", rec.Code)
	}

	var body map[string]interface{}
	json.NewDecoder(rec.Body).Decode(&body)
	if body["auth_required"] != true {
		t.Error("设置 token 后 auth_required 应为 true")
	}
}

func TestGenerateToken(t *testing.T) {
	token1 := GenerateToken()
	token2 := GenerateToken()

	if len(token1) != 64 {
		t.Errorf("token 长度应为 64（32字节十六进制），实际 %d", len(token1))
	}
	if token1 == token2 {
		t.Error("两次生成的 token 不应相同")
	}
}

func TestSetAndGetAuthToken(t *testing.T) {
	SetAuthToken("hello-world")
	if GetAuthToken() != "hello-world" {
		t.Error("获取的 token 与设置的不一致")
	}

	SetAuthToken("new-token")
	if GetAuthToken() != "new-token" {
		t.Error("更新后的 token 与设置的不一致")
	}
}
