//go:build windows

package browser

import (
	"fmt"
	"net"
	"net/url"
	"runtime"
	"time"

	webview "github.com/webview/webview_go"
)

func waitForServer(rawURL string) {
	u, err := url.Parse(rawURL)
	if err != nil {
		return
	}
	addr := u.Host
	if _, _, e := net.SplitHostPort(addr); e != nil {
		if u.Scheme == "https" {
			addr += ":443"
		} else {
			addr += ":80"
		}
	}

	timeout := time.After(10 * time.Second)
	ticker := time.NewTicker(300 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-timeout:
			return
		case <-ticker.C:
			conn, err := net.DialTimeout("tcp", addr, 500*time.Millisecond)
			if err == nil {
				conn.Close()
				return
			}
		}
	}
}

// StartWebViewBrowser 在主线程启动 webview（需在已锁定的 OS 线程中调用）
func StartWebViewBrowser(targetURL string) {
	runtime.LockOSThread()
	defer runtime.UnlockOSThread()

	webviewMutex.Lock()
	if webviewRunning {
		webviewMutex.Unlock()
		return
	}
	webviewRunning = true
	webviewMutex.Unlock()

	defer func() {
		webviewMutex.Lock()
		webviewRunning = false
		w := webviewInstance
		webviewInstance = nil
		webviewMutex.Unlock()

		if w != nil {
			w.Terminate()
		}
		select {
		case webviewClosedCh <- struct{}{}:
		default:
		}
	}()

	waitForServer(targetURL)

	w := createWebView()
	if w == nil {
		return
	}

	navigateWebView(targetURL)

	w.Run()
}

func createWebView() webview.WebView {
	webviewMutex.Lock()
	defer webviewMutex.Unlock()

	if webviewInstance != nil {
		return webviewInstance
	}

	w := webview.New(DeveloperEnabled)
	if w == nil {
		return nil
	}

	w.SetTitle(*WebViewTitle)
	w.SetSize(*WebViewWidth, *WebViewHeight, webview.HintNone)

	if *WebViewMinWidth > 0 && *WebViewMinHeight > 0 {
		w.SetSize(*WebViewMinWidth, *WebViewMinHeight, webview.HintMin)
	}

	if !*WebViewResizable {
		w.SetSize(*WebViewWidth, *WebViewHeight, webview.HintFixed)
	}

	webviewInstance = w

	setWindowIcon(w.Window())

	return w
}

func navigateWebView(targetURL string) {
	webviewMutex.Lock()
	defer webviewMutex.Unlock()

	if webviewInstance == nil {
		return
	}
	webviewInstance.Navigate(targetURL)
}

// CloseWebView 安全关闭 webview（从任意 goroutine 调用）
func CloseWebView() {
	webviewMutex.Lock()
	w := webviewInstance
	webviewInstance = nil
	webviewRunning = false
	webviewMutex.Unlock()

	if w != nil {
		// 无法跨线程直接调用 Terminate，标记为 nil 后主循环会退出
		_ = w
	}
}

// GetLocalURL 构建包含本机 IP 的 URL
func GetLocalURL(port int) string {
	ip, err := getLocalIP([]string{})
	if err != nil {
		return fmt.Sprintf("http://localhost:%d", port)
	}
	return fmt.Sprintf("http://%s:%d", ip, port)
}
