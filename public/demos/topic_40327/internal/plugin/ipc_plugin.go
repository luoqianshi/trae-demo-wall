package plugin

import (
	"encoding/json"
	"fmt"
	"math"
	"os"
	"sync"
	"sync/atomic"
	"time"

	"YaraFlow/internal/logger"
	"YaraFlow/internal/plugin/ipc"
)

// IPCPluginHealth 插件健康状态指标
type IPCPluginHealth struct {
	PluginID     string    `json:"plugin_id"`
	Alive        bool      `json:"alive"`
	StartTime    time.Time `json:"start_time"`
	CrashCount   int64     `json:"crash_count"`
	RestartCount int64     `json:"restart_count"`
	LastPingTime time.Time `json:"last_ping_time"`
	LastPingOK   bool      `json:"last_ping_ok"`
}

// IPCPluginWrapper 封装一个 IPC 客户端，对外提供与 GojaRuntime 一致的接口
// 内置后台健康监控，通过 stdin/stdout JSON 协议与独立子进程通信
type IPCPluginWrapper struct {
	client    *ipc.Client
	manifest  *PluginManifest
	pluginDir string
	hostBin   string
	mu        sync.Mutex

	// 崩溃退避
	crashCount   atomic.Int64
	restartCount atomic.Int64
	maxCrashBack int // 连续崩溃上限，超过后停止重启

	// 健康监控
	startTime    time.Time
	lastPingTime time.Time
	lastPingOK   bool
	monitorStop  chan struct{}
	monitorDone  chan struct{}
}

const (
	ipcHealthCheckInterval = 15 * time.Second // 健康检查间隔
	ipcMaxCrashCount       = 5                // 连续崩溃上限
	ipcBackoffBase         = 1 * time.Second  // 退避基础时间
	ipcBackoffMax          = 30 * time.Second // 退避最大时间
)

// NewIPCPluginWrapper 创建 IPC 插件包装器，启动宿主子进程并加载插件
func NewIPCPluginWrapper(hostBinary, pluginDir string, manifest *PluginManifest) (*IPCPluginWrapper, error) {
	if _, err := os.Stat(hostBinary); os.IsNotExist(err) {
		return nil, fmt.Errorf("插件宿主二进制不存在: %s", hostBinary)
	}

	w := &IPCPluginWrapper{
		manifest:     manifest,
		pluginDir:    pluginDir,
		hostBin:      hostBinary,
		maxCrashBack: ipcMaxCrashCount,
		monitorStop:  make(chan struct{}),
		monitorDone:  make(chan struct{}),
	}

	if err := w.start(); err != nil {
		return nil, fmt.Errorf("启动 IPC 插件失败: %w", err)
	}

	// 启动后台健康监控
	go w.healthMonitor()

	return w, nil
}

func (w *IPCPluginWrapper) start() error {
	client, err := ipc.NewClient(w.hostBin, w.pluginDir)
	if err != nil {
		return err
	}
	w.client = client
	w.startTime = time.Now()

	logger.Sugar.Infow("[Plugin] 已在隔离进程中启动", "id", w.manifest.ID)
	return nil
}

// ── 健康监控 ──

// healthMonitor 后台周期性检查宿主进程健康状态
// 如果宿主挂了，自动重启（带退避策略）
func (w *IPCPluginWrapper) healthMonitor() {
	defer close(w.monitorDone)

	ticker := time.NewTicker(ipcHealthCheckInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			w.doHealthCheck()
		case <-w.monitorStop:
			return
		}
	}
}

func (w *IPCPluginWrapper) doHealthCheck() {
	w.mu.Lock()
	defer w.mu.Unlock()

	w.lastPingTime = time.Now()

	if w.client == nil || !w.client.IsAlive() {
		w.lastPingOK = false
		w.tryRestartLocked()
		return
	}

	// 发送心跳Ping确认连通性
	_, err := w.client.Call(ipc.MethodPing, json.RawMessage("null"), 3*time.Second)
	w.lastPingOK = (err == nil)

	if !w.lastPingOK {
		logger.Sugar.Warnw("[Plugin] 心跳超时，宿主可能卡死，触发重启",
			"id", w.manifest.ID, "error", err)
		w.tryRestartLocked()
	}
}

// tryRestartLocked 尝试重启崩溃的宿主（调用者已持有 mu 锁）
func (w *IPCPluginWrapper) tryRestartLocked() {
	crash := w.crashCount.Add(1)

	if crash > int64(w.maxCrashBack) {
		logger.Sugar.Errorw("[Plugin] 连续崩溃次数过多，停止重启",
			"id", w.manifest.ID, "crash_count", crash, "max", w.maxCrashBack)
		return
	}

	// 指数退避：1s, 2s, 4s, 8s, max 30s
	backoff := time.Duration(math.Min(
		float64(ipcBackoffBase)*math.Pow(2, float64(crash-1)),
		float64(ipcBackoffMax),
	))

	logger.Sugar.Warnw("[Plugin] 宿主进程崩溃，等待退避后重启",
		"id", w.manifest.ID, "crash_count", crash, "backoff", backoff.String())

	if w.client != nil {
		w.client.Close()
		w.client = nil
	}

	// 在 mu 锁外等待退避时间
	w.mu.Unlock()
	time.Sleep(backoff)
	w.mu.Lock()

	if err := w.start(); err != nil {
		logger.Sugar.Errorw("[Plugin] 重启失败", "id", w.manifest.ID, "error", err)
		return
	}

	w.crashCount.Store(0) // 重启成功，重置崩溃计数
	w.restartCount.Add(1)

	logger.Sugar.Infow("[Plugin] 重启成功", "id", w.manifest.ID,
		"restart_count", w.restartCount.Load())
}

// ── 查询 ──

// IsAlive 检查插件宿主进程是否存活
func (w *IPCPluginWrapper) IsAlive() bool {
	w.mu.Lock()
	defer w.mu.Unlock()
	return w.client != nil && w.client.IsAlive()
}

// Health 返回插件健康状态指标
func (w *IPCPluginWrapper) Health() IPCPluginHealth {
	w.mu.Lock()
	defer w.mu.Unlock()

	return IPCPluginHealth{
		PluginID:     w.manifest.ID,
		Alive:        w.client != nil && w.client.IsAlive(),
		StartTime:    w.startTime,
		CrashCount:   w.crashCount.Load(),
		RestartCount: w.restartCount.Load(),
		LastPingTime: w.lastPingTime,
		LastPingOK:   w.lastPingOK,
	}
}

// Manifest 返回插件清单
func (w *IPCPluginWrapper) Manifest() *PluginManifest {
	return w.manifest
}

// ── 执行（含自动恢复） ──

// ExecuteCommand 通过 IPC 执行命令
func (w *IPCPluginWrapper) ExecuteCommand(cmdName string, match map[string]string, platform string, groupID string) (string, error) {
	client, err := w.acquireClient()
	if err != nil {
		return "", fmt.Errorf("插件不可用: %w", err)
	}
	return client.ExecuteCommand(cmdName, match, platform, groupID)
}

// ExecuteTool 通过 IPC 执行工具
func (w *IPCPluginWrapper) ExecuteTool(toolName string, params map[string]interface{}) (interface{}, error) {
	client, err := w.acquireClient()
	if err != nil {
		return nil, fmt.Errorf("插件不可用: %w", err)
	}
	return client.ExecuteTool(toolName, params)
}

// ExecuteAction 通过 IPC 执行动作
func (w *IPCPluginWrapper) ExecuteAction(actionName string, params map[string]interface{}) (interface{}, error) {
	client, err := w.acquireClient()
	if err != nil {
		return nil, fmt.Errorf("插件不可用: %w", err)
	}
	return client.ExecuteAction(actionName, params)
}

// acquireClient 获取可用客户端，如果宿主挂了则尝试即时恢复
func (w *IPCPluginWrapper) acquireClient() (*ipc.Client, error) {
	w.mu.Lock()
	defer w.mu.Unlock()

	if w.client != nil && w.client.IsAlive() {
		return w.client, nil
	}

	// 宿主已挂，尝试即时重启
	crash := w.crashCount.Add(1)
	if crash > int64(w.maxCrashBack) {
		return nil, fmt.Errorf("插件 %s 连续崩溃 %d 次，已停止自动恢复",
			w.manifest.ID, crash)
	}

	if w.client != nil {
		w.client.Close()
		w.client = nil
	}

	if err := w.start(); err != nil {
		return nil, fmt.Errorf("即时恢复失败: %w", err)
	}

	w.crashCount.Store(0)
	w.restartCount.Add(1)
	return w.client, nil
}

// Close 关闭 IPC 连接，停止健康监控，终止宿主进程
func (w *IPCPluginWrapper) Close() error {
	// 停止健康监控
	close(w.monitorStop)
	<-w.monitorDone

	w.mu.Lock()
	defer w.mu.Unlock()

	if w.client != nil {
		err := w.client.Close()
		w.client = nil
		return err
	}
	return nil
}

// GetIPCPlugin 获取 IPC 插件包装器
func (pm *PluginManager) GetIPCPlugin(pluginID string) *IPCPluginWrapper {
	pm.mu.RLock()
	defer pm.mu.RUnlock()
	return pm.ipcPlugins[pluginID]
}

// ShutdownIPC 关闭所有 IPC 插件
func (pm *PluginManager) ShutdownIPC() {
	pm.mu.Lock()
	defer pm.mu.Unlock()

	for id, wrapper := range pm.ipcPlugins {
		wrapper.Close()
		delete(pm.ipcPlugins, id)
		logger.Sugar.Infow("[Plugin] IPC 插件已关闭", "id", id)
	}
}
