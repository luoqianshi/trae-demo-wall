package webui

import (
	"net/http"
	"os"
	"os/exec"
	"time"

	"YaraFlow/internal/logger"
)

// handleRestart 重启 YaraFlow 进程
func (s *Server) handleRestart(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		jsonError(w, 405, "Method not allowed")
		return
	}

	jsonResponse(w, map[string]interface{}{
		"success": true,
		"message": "正在重启 YaraFlow...",
	})

	s.restartServer()
}

// restartServer 执行进程重启（不关闭 WebUI 和浏览器窗口）
func (s *Server) restartServer() {
	logger.Sugar.Infow("[WebUI] 收到重启请求，正在准备重启...")

	go func() {
		time.Sleep(500 * time.Millisecond)

		// 不调用 s.Stop()，避免关闭 WebUI HTTP 服务
		// 新进程启动后会重新绑定 WebUI 端口，旧进程退出后前端自动重连
		// 浏览器窗口保持打开，用户无需手动刷新

		executable, err := os.Executable()
		if err != nil {
			logger.Sugar.Errorw("[WebUI] 重启失败: 无法获取可执行文件路径", "error", err)
			return
		}

		cmd := exec.Command(executable, os.Args[1:]...)
		cmd.Env = os.Environ()
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		cmd.Stdin = os.Stdin

		if err := cmd.Start(); err != nil {
			logger.Sugar.Errorw("[WebUI] 重启失败: 启动新进程出错", "error", err)
			return
		}

		logger.Sugar.Infow("[WebUI] 新进程已启动，准备退出当前进程", "new_pid", cmd.Process.Pid)
		os.Exit(0)
	}()
}
