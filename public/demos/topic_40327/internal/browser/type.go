//go:build windows

package browser

import (
	"sync"

	webview "github.com/webview/webview_go"
)

var (
	webviewMutex    sync.Mutex
	webviewInstance webview.WebView
	webviewRunning  bool
	webviewClosedCh = make(chan struct{}, 1)
)

// WebViewClosed 返回一个 channel，当 webview 关闭时收到信号
func WebViewClosed() <-chan struct{} {
	return webviewClosedCh
}
