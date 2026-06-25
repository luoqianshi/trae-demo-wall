//go:build !windows

package browser

import (
	"fmt"
	"os/exec"
	"runtime"
)

// IsWebViewSupported 检查平台是否支持 WebView（非 Windows 平台不支持）
func IsWebViewSupported() bool {
	return false
}

// OpenBrowser 使用系统默认浏览器打开 URL
func OpenBrowser(url string) {
	var cmd string
	var args []string

	switch runtime.GOOS {
	case "darwin":
		cmd = "open"
		args = []string{url}
	default:
		cmd = "xdg-open"
		args = []string{url}
	}

	_ = exec.Command(cmd, args...).Start()
}

// GetLocalURL 返回本地 URL
func GetLocalURL(port int) string {
	return fmt.Sprintf("http://localhost:%d", port)
}

// WebViewClosed 返回一个已关闭的 channel（无 WebView 时直接返回）
func WebViewClosed() <-chan struct{} {
	ch := make(chan struct{})
	close(ch)
	return ch
}

// CloseWebView 关闭 WebView（非 Windows 平台无操作）
func CloseWebView() {}