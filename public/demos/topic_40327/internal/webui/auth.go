package webui

import (
	"YaraFlow/internal/logger"
	"crypto/rand"
	"crypto/subtle"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

// authManager 认证管理器
type authManager struct {
	mu               sync.RWMutex
	token            string
	tokenGeneratedAt time.Time
}

var auth = &authManager{}

// tokenFilePath 令牌持久化文件路径，与 ./data/ 下其他数据文件保持一致
const tokenFilePath = "./data/auth_token"

// PersistToken 将令牌持久化到文件，确保重启后仍可使用同一令牌
func PersistToken(token string) error {
	dir := filepath.Dir(tokenFilePath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}
	return os.WriteFile(tokenFilePath, []byte(token), 0600)
}

// LoadPersistedToken 从文件加载持久化的令牌，文件不存在时返回空字符串
func LoadPersistedToken() string {
	data, err := os.ReadFile(tokenFilePath)
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(data))
}

// SetAuthToken 设置认证令牌
func SetAuthToken(token string) {
	auth.mu.Lock()
	defer auth.mu.Unlock()
	auth.token = token
	auth.tokenGeneratedAt = time.Now()
}

// GetAuthToken 获取当前认证令牌
func GetAuthToken() string {
	auth.mu.RLock()
	defer auth.mu.RUnlock()
	return auth.token
}

// GetTokenGeneratedAt 获取令牌生成时间
func GetTokenGeneratedAt() time.Time {
	auth.mu.RLock()
	defer auth.mu.RUnlock()
	return auth.tokenGeneratedAt
}

// StartTokenRotation 启动令牌定期轮换（每 24 小时生成新令牌）
// 仅在未手动配置令牌时启用（自动生成的令牌才轮换）
func StartTokenRotation() {
	go func() {
		ticker := time.NewTicker(1 * time.Minute)
		defer ticker.Stop()
		for range ticker.C {
			auth.mu.RLock()
			generatedAt := auth.tokenGeneratedAt
			currentToken := auth.token
			auth.mu.RUnlock()

			if currentToken == "" {
				continue
			}

			if time.Since(generatedAt) >= 24*time.Hour {
				newToken := GenerateToken()
				auth.mu.Lock()
				auth.token = newToken
				auth.tokenGeneratedAt = time.Now()
				auth.mu.Unlock()
				// 持久化新令牌，确保重启后仍然有效
				PersistToken(newToken)
				// 仅记录轮换事件，不输出 token 值到日志文件（避免通过日志流泄露）
				logger.Info("[WebUI] 令牌已自动轮换（24小时到期）")
			}
		}
	}()
}

// GenerateToken 生成随机令牌（32 字节十六进制）
func GenerateToken() string {
	bytes := make([]byte, 32)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

// authMiddleware 认证中间件，检查请求中的 token
// 图片端点（<img> 标签和 CSS background-image 请求不带 token）跳过认证：
//   - /icon/ : 插件图标
//   - /api/backgrounds/file/ : 背景图片
//   - /api/emoji/file : 表情包图片
//   - /api/tong-shadow/.../image : 瞳影图片
func authMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// 图片端点跳过认证：<img> 标签和 CSS url() 无法携带 Authorization header
		path := r.URL.Path
		if strings.Contains(path, "/icon/") || strings.HasSuffix(path, "/icon") ||
			strings.Contains(path, "/api/backgrounds/file/") ||
			strings.Contains(path, "/api/emoji/file") ||
			(strings.Contains(path, "/api/tong-shadow/") && strings.HasSuffix(path, "/image")) {
			next(w, r)
			return
		}

		// 从 Authorization header 或 query 参数获取 token
		token := ""
		if authHeader := r.Header.Get("Authorization"); authHeader != "" {
			// Bearer <token>
			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) == 2 && strings.EqualFold(parts[0], "Bearer") {
				token = parts[1]
			}
		}
		if token == "" {
			token = r.URL.Query().Get("token")
		}

		auth.mu.RLock()
		validToken := auth.token
		auth.mu.RUnlock()

		if validToken != "" && subtle.ConstantTimeCompare([]byte(token), []byte(validToken)) != 1 {
			w.Header().Set("Content-Type", "application/json; charset=utf-8")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"error":   true,
				"message": "未授权访问，请提供有效的访问令牌",
			})
			return
		}
		next(w, r)
	}
}

// handleLogin 登录接口：验证 token 并返回认证状态
func (s *Server) handleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}
	if r.Method != http.MethodPost {
		jsonError(w, http.StatusMethodNotAllowed, "仅支持 POST")
		return
	}

	var body struct {
		Token string `json:"token"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		jsonError(w, http.StatusBadRequest, "请求格式错误")
		return
	}

	auth.mu.RLock()
	validToken := auth.token
	auth.mu.RUnlock()

	if body.Token == "" || subtle.ConstantTimeCompare([]byte(body.Token), []byte(validToken)) != 1 {
		jsonError(w, http.StatusUnauthorized, "令牌无效")
		return
	}

	jsonResponse(w, map[string]interface{}{
		"success": true,
		"message": "认证成功",
	})
}

// handleAuthStatus 检查当前认证状态，同时验证传入的 token 是否有效
func (s *Server) handleAuthStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		jsonError(w, http.StatusMethodNotAllowed, "仅支持 GET")
		return
	}

	// 从 Authorization header 或 query 参数获取 token
	reqToken := ""
	if authHeader := r.Header.Get("Authorization"); authHeader != "" {
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) == 2 && strings.EqualFold(parts[0], "Bearer") {
			reqToken = parts[1]
		}
	}
	if reqToken == "" {
		reqToken = r.URL.Query().Get("token")
	}

	auth.mu.RLock()
	hasToken := auth.token != ""
	tokenValid := hasToken && reqToken != "" && subtle.ConstantTimeCompare([]byte(reqToken), []byte(auth.token)) == 1
	genAt := auth.tokenGeneratedAt
	auth.mu.RUnlock()

	jsonResponse(w, map[string]interface{}{
		"auth_required":      hasToken,
		"token_valid":        tokenValid,
		"token_generated_at": genAt.Format(time.RFC3339),
	})
}
