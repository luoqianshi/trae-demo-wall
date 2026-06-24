package plugin

import (
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/dop251/goja"
)

// ─── HTTPInjector ───

// maxResponseBodySize HTTP 响应体最大大小（10MB），防止插件下载超大文件导致 OOM
const maxResponseBodySize = 10 * 1024 * 1024

// httpClient 插件 HTTP 请求专用客户端，设置超时防止请求永久挂起
// CheckRedirect 校验重定向目标，防止通过 302 绕过 SSRF 防护
var httpClient = &http.Client{
	Timeout: 30 * time.Second,
	CheckRedirect: func(req *http.Request, via []*http.Request) error {
		if len(via) >= 10 {
			return fmt.Errorf("stopped after 10 redirects")
		}
		if isSSRFDangerous(req.URL.String()) {
			return fmt.Errorf("redirect to blocked address: %s", req.URL.String())
		}
		return nil
	},
}

type HTTPInjector struct {
	ctx *InjectorContext
}

func NewHTTPInjector(ctx *InjectorContext) *HTTPInjector {
	return &HTTPInjector{ctx: ctx}
}

func (hi *HTTPInjector) APIName() string { return "http" }

func (hi *HTTPInjector) Inject() error {
	if !hi.ctx.manifest.HasPermission("http.request") {
		return nil
	}

	httpAPI := map[string]interface{}{
		"get":      hi.createGet(),
		"post":     hi.createPost(),
		"download": hi.createDownload(),
	}

	hi.ctx.mergeIntoYara("http", httpAPI)
	return nil
}

// isSSRFDangerous 检查 URL 是否指向内网或危险地址（SSRF 防护）
// 禁止访问：本地回环、私有网络、链路本地（含云元数据 169.254.169.254）、未指定地址
func isSSRFDangerous(rawURL string) bool {
	u, err := url.Parse(rawURL)
	if err != nil {
		return true
	}

	// 只允许 http/https 协议
	if u.Scheme != "http" && u.Scheme != "https" {
		return true
	}

	hostname := u.Hostname()
	if hostname == "" {
		return true
	}

	// 尝试解析为主机名 IP
	ip := net.ParseIP(hostname)
	if ip == nil {
		// 不是 IP 字面量，解析 DNS
		addrs, err := net.LookupIP(hostname)
		if err != nil || len(addrs) == 0 {
			return true
		}
		ip = addrs[0]
	}

	// 检查是否为内网/危险地址
	if ip.IsLoopback() || ip.IsPrivate() || ip.IsLinkLocalUnicast() || ip.IsUnspecified() {
		return true
	}

	return false
}

// checkSSRF 校验 URL 安全性，不安全时返回错误信息
func checkSSRF(rawURL string) error {
	if isSSRFDangerous(rawURL) {
		return fmt.Errorf("URL blocked by SSRF protection: %s", rawURL)
	}
	return nil
}

func (hi *HTTPInjector) createGet() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		if len(call.Arguments) < 1 {
			panic(hi.ctx.sandbox.Runtime().NewTypeError("http.get(url, options?) requires at least 1 argument"))
		}
		url := call.Arguments[0].String()

		// SSRF 防护：校验目标地址
		if err := checkSSRF(url); err != nil {
			return hi.ctx.sandbox.Runtime().ToValue(map[string]interface{}{
				"error": err.Error(),
			})
		}

		headers := make(map[string]string)
		if len(call.Arguments) >= 2 {
			if h, ok := call.Arguments[1].Export().(map[string]interface{}); ok {
				for k, v := range h {
					headers[k] = fmt.Sprintf("%v", v)
				}
			}
		}

		req, err := http.NewRequest("GET", url, nil)
		if err != nil {
			return hi.ctx.sandbox.Runtime().ToValue(map[string]interface{}{
				"error": fmt.Sprintf("create request failed: %v", err),
			})
		}
		for k, v := range headers {
			req.Header.Set(k, v)
		}

		resp, err := httpClient.Do(req)
		if err != nil {
			return hi.ctx.sandbox.Runtime().ToValue(map[string]interface{}{
				"error": fmt.Sprintf("http request failed: %v", err),
			})
		}
		defer resp.Body.Close()

		// 限制响应体大小，防止 OOM
		body, err := io.ReadAll(io.LimitReader(resp.Body, maxResponseBodySize+1))
		if err != nil {
			return hi.ctx.sandbox.Runtime().ToValue(map[string]interface{}{
				"error": fmt.Sprintf("read body failed: %v", err),
			})
		}
		if len(body) > maxResponseBodySize {
			return hi.ctx.sandbox.Runtime().ToValue(map[string]interface{}{
				"error": fmt.Sprintf("response body exceeds size limit (%d bytes)", maxResponseBodySize),
			})
		}

		return hi.ctx.sandbox.Runtime().ToValue(map[string]interface{}{
			"status":     resp.StatusCode,
			"statusText": resp.Status,
			"body":       string(body),
			"headers":    resp.Header,
		})
	}
}

func (hi *HTTPInjector) createPost() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		if len(call.Arguments) < 2 {
			panic(hi.ctx.sandbox.Runtime().NewTypeError("http.post(url, body, options?) requires at least 2 arguments"))
		}
		url := call.Arguments[0].String()

		// SSRF 防护：校验目标地址
		if err := checkSSRF(url); err != nil {
			return hi.ctx.sandbox.Runtime().ToValue(map[string]interface{}{
				"error": err.Error(),
			})
		}

		var bodyStr string

		if bodyVal := call.Arguments[1]; bodyVal != nil {
			switch v := bodyVal.Export().(type) {
			case string:
				bodyStr = v
			default:
				bodyStr = fmt.Sprintf("%v", v)
			}
		}

		headers := make(map[string]string)
		headers["Content-Type"] = "application/json"
		if len(call.Arguments) >= 3 {
			if h, ok := call.Arguments[2].Export().(map[string]interface{}); ok {
				for k, v := range h {
					headers[k] = fmt.Sprintf("%v", v)
				}
			}
		}

		req, err := http.NewRequest("POST", url, strings.NewReader(bodyStr))
		if err != nil {
			return hi.ctx.sandbox.Runtime().ToValue(map[string]interface{}{
				"error": fmt.Sprintf("create request failed: %v", err),
			})
		}
		for k, v := range headers {
			req.Header.Set(k, v)
		}

		resp, err := httpClient.Do(req)
		if err != nil {
			return hi.ctx.sandbox.Runtime().ToValue(map[string]interface{}{
				"error": fmt.Sprintf("http request failed: %v", err),
			})
		}
		defer resp.Body.Close()

		// 限制响应体大小，防止 OOM
		respBody, err := io.ReadAll(io.LimitReader(resp.Body, maxResponseBodySize+1))
		if err != nil {
			return hi.ctx.sandbox.Runtime().ToValue(map[string]interface{}{
				"error": fmt.Sprintf("read body failed: %v", err),
			})
		}
		if len(respBody) > maxResponseBodySize {
			return hi.ctx.sandbox.Runtime().ToValue(map[string]interface{}{
				"error": fmt.Sprintf("response body exceeds size limit (%d bytes)", maxResponseBodySize),
			})
		}

		return hi.ctx.sandbox.Runtime().ToValue(map[string]interface{}{
			"status":     resp.StatusCode,
			"statusText": resp.Status,
			"body":       string(respBody),
			"headers":    resp.Header,
		})
	}
}

func (hi *HTTPInjector) createDownload() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		if len(call.Arguments) < 1 {
			panic(hi.ctx.sandbox.Runtime().NewTypeError("http.download(url, savePath?) requires at least 1 argument"))
		}
		url := call.Arguments[0].String()

		// SSRF 防护：校验目标地址
		if err := checkSSRF(url); err != nil {
			return hi.ctx.sandbox.Runtime().ToValue(map[string]interface{}{
				"error": err.Error(),
			})
		}

		resp, err := httpClient.Get(url)
		if err != nil {
			return hi.ctx.sandbox.Runtime().ToValue(map[string]interface{}{
				"error": fmt.Sprintf("download failed: %v", err),
			})
		}
		defer resp.Body.Close()

		// 限制下载大小，防止 OOM
		data, err := io.ReadAll(io.LimitReader(resp.Body, maxResponseBodySize+1))
		if err != nil {
			return hi.ctx.sandbox.Runtime().ToValue(map[string]interface{}{
				"error": fmt.Sprintf("read download body failed: %v", err),
			})
		}
		if len(data) > maxResponseBodySize {
			return hi.ctx.sandbox.Runtime().ToValue(map[string]interface{}{
				"error": fmt.Sprintf("download exceeds size limit (%d bytes)", maxResponseBodySize),
			})
		}

		var savedPath string
		if len(call.Arguments) >= 2 {
			relativePath := call.Arguments[1].String()
			savedPath = filepath.Join(hi.ctx.pluginDir, "data", relativePath)
		} else {
			fileName := filepath.Base(url)
			if idx := strings.Index(fileName, "?"); idx != -1 {
				fileName = fileName[:idx]
			}
			if fileName == "" || fileName == "." {
				fileName = fmt.Sprintf("download_%d", time.Now().UnixNano())
			}
			savedPath = filepath.Join(hi.ctx.pluginDir, "data", fileName)
		}

		cleaned := filepath.Clean(savedPath)
		dataDir := filepath.Join(hi.ctx.pluginDir, "data")
		dataDirClean := filepath.Clean(dataDir)
		if !strings.HasPrefix(cleaned, dataDirClean) {
			return hi.ctx.sandbox.Runtime().ToValue(map[string]interface{}{
				"error": "download: path traversal detected",
			})
		}

		if err := os.MkdirAll(filepath.Dir(cleaned), 0755); err != nil {
			return hi.ctx.sandbox.Runtime().ToValue(map[string]interface{}{
				"error": fmt.Sprintf("mkdir failed: %v", err),
			})
		}
		if err := os.WriteFile(cleaned, data, 0644); err != nil {
			return hi.ctx.sandbox.Runtime().ToValue(map[string]interface{}{
				"error": fmt.Sprintf("write file failed: %v", err),
			})
		}

		return hi.ctx.sandbox.Runtime().ToValue(map[string]interface{}{
			"success":  true,
			"path":     cleaned,
			"size":     len(data),
			"fileSize": len(data),
		})
	}
}
