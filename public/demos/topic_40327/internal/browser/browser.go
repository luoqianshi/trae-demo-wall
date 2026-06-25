//go:build windows

package browser

import (
	"flag"
	"fmt"
	"net"
	"os/exec"
	"runtime"
	"sort"
	"strings"
)

var (
	WebViewTitle     = flag.String("webview-title", "YaraFlow", "webview 窗口标题")
	WebViewWidth     = flag.Int("webview-width", 1024, "webview 窗口宽度")
	WebViewHeight    = flag.Int("webview-height", 768, "webview 窗口高度")
	WebViewMinWidth  = flag.Int("webview-min-width", 400, "webview 窗口最小宽度")
	WebViewMinHeight = flag.Int("webview-min-height", 400, "webview 窗口最小高度")
	WebViewResizable = flag.Bool("webview-resizable", true, "webview 窗口是否可调整大小")
	Developer        = flag.Bool("developer", false, "启用调试模式, 显示详细日志和 F12 开发者工具")
)

// DeveloperEnabled 是否启用 F12 开发者工具（由 config 驱动，默认 false）
var DeveloperEnabled = false

// shouldSkipInterface 判断是否应该跳过该网络接口
func shouldSkipInterface(iface net.Interface) bool {
	name := strings.ToLower(iface.Name)
	virtualKeywords := []string{
		"vEthernet", "hyper-v", "default switch",
		"docker", "br-", "veth",
		"vmnet", "virtualbox", "vboxnet",
		"tap-", "tun-", "ppp",
		"npcap", "npcapi", "ndis",
	}
	for _, keyword := range virtualKeywords {
		if strings.Contains(name, strings.ToLower(keyword)) {
			return true
		}
	}
	if iface.Flags&net.FlagUp == 0 {
		return true
	}
	if iface.Flags&net.FlagLoopback != 0 {
		return true
	}
	return false
}

// calculatePriority 计算IP地址的优先级
func calculatePriority(ip string, preferredNetworks []string) int {
	for i, network := range preferredNetworks {
		if strings.HasPrefix(ip, network) {
			return i
		}
	}
	if strings.HasPrefix(ip, "192.168.") {
		return 100
	} else if strings.HasPrefix(ip, "10.") {
		return 200
	} else if len(ip) >= 7 && strings.HasPrefix(ip, "172.") {
		parts := strings.Split(ip, ".")
		if len(parts) >= 2 {
			second := parts[1]
			if second >= "16" && second <= "31" {
				return 300
			}
		}
	}
	if strings.HasPrefix(ip, "169.254.") {
		return 400
	}
	return 500
}

type ipCandidate struct {
	IP        string
	Priority  int
	Interface string
}

// getLocalIP 获取本地 IP 地址
func getLocalIP(preferredNetworks []string) (string, error) {
	interfaces, err := net.Interfaces()
	if err != nil {
		return "", fmt.Errorf("获取网络接口失败: %v", err)
	}

	var candidates []ipCandidate

	for _, iface := range interfaces {
		if shouldSkipInterface(iface) {
			continue
		}
		addrs, err := iface.Addrs()
		if err != nil {
			continue
		}
		for _, addr := range addrs {
			ipNet, ok := addr.(*net.IPNet)
			if !ok || ipNet.IP.IsLoopback() || ipNet.IP.To4() == nil {
				continue
			}
			ip := ipNet.IP.String()
			priority := calculatePriority(ip, preferredNetworks)
			if priority == 0 {
				return ip, nil
			}
			candidates = append(candidates, ipCandidate{
				IP:        ip,
				Priority:  priority,
				Interface: iface.Name,
			})
		}
	}

	if len(candidates) > 0 {
		sort.Slice(candidates, func(i, j int) bool {
			return candidates[i].Priority < candidates[j].Priority
		})
		return candidates[0].IP, nil
	}

	return "", fmt.Errorf("未找到可用的IP地址")
}

// openSystemBrowser 在系统默认浏览器中打开指定 URL
func openSystemBrowser(url string) {
	var cmd string
	var args []string

	switch runtime.GOOS {
	case "windows":
		cmd = "cmd"
		args = []string{"/c", "start", url}
	case "darwin":
		cmd = "open"
		args = []string{url}
	default:
		cmd = "xdg-open"
		args = []string{url}
	}

	if err := exec.Command(cmd, args...).Start(); err != nil {
	}
}

// OpenBrowser 使用系统默认浏览器打开指定 URL
func OpenBrowser(url string) {
	openSystemBrowser(url)
}

// IsWebViewSupported 检查平台是否支持 WebView
func IsWebViewSupported() bool {
	switch runtime.GOOS {
	case "windows", "darwin", "linux":
		return true
	default:
		return false
	}
}
