package llm

import (
	"crypto/tls"
	"net"
	"net/http"
	"time"
)

// DefaultTransport 全局共享的 HTTP Transport
// 所有 LLM Provider 共用同一个连接池，减少 TCP 握手开销，实现连接复用
var DefaultTransport *http.Transport

func init() {
	DefaultTransport = &http.Transport{
		Proxy: http.ProxyFromEnvironment,
		DialContext: (&net.Dialer{
			Timeout:   30 * time.Second, // 连接超时
			KeepAlive: 30 * time.Second, // TCP Keep-Alive
		}).DialContext,
		MaxIdleConns:          100,              // 全局最大空闲连接数
		MaxIdleConnsPerHost:   10,               // 每个 Host 最大空闲连接数
		MaxConnsPerHost:       20,               // 每个 Host 最大连接数（含活跃+空闲）
		IdleConnTimeout:       90 * time.Second, // 空闲连接超时回收
		TLSHandshakeTimeout:   10 * time.Second, // TLS 握手超时
		ExpectContinueTimeout: 1 * time.Second,  // 100-continue 等待超时
		ResponseHeaderTimeout: 0,                // 不限制等待响应头时间，由 http.Client.Timeout 统一控制
		// 本地大模型（如 35B gguf）处理 prompt 可能需要 30 秒以上才开始吐第一个 token，
		// 设置 ResponseHeaderTimeout 会先于 http.Client.Timeout 触发，导致本地模型永远超时

		TLSClientConfig: &tls.Config{
			MinVersion: tls.VersionTLS12,
		},
	}
}

// NewPooledClient 创建一个使用全局连接池的 http.Client
// timeout 为请求总超时时间（含连接、读取、响应等）
func NewPooledClient(timeout time.Duration) *http.Client {
	return &http.Client{
		Timeout:   timeout,
		Transport: DefaultTransport,
	}
}
