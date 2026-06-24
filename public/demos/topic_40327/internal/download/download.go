package download

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"YaraFlow/internal/logger"
)

// 下载限制
const (
	maxDownloadSize       = 500 * 1024 * 1024   // 500MB
	downloadThreads       = 8                   // 多线程下载线程数（迅雷默认 5-16）
	maxChunkRetries       = 3                   // 单个分段下载失败重试次数
	minMultiThreadSize    = 1 * 1024 * 1024     // 小于 1MB 的文件不启用多线程
	responseHeaderTimeout = 30 * time.Second    // 连接+响应头超时
	cleanupInterval       = 10 * time.Minute    // 清理间隔
	maxFileAge            = 1 * time.Hour       // 文件最大保留时间
	downloadedRecordFile  = "downloaded.json"   // 已下载URL持久化文件
	downloadedRecordTTL   = 30 * 24 * time.Hour // 已下载记录保留30天
)

// 共享 HTTP 客户端，仅限制连接建立阶段
var httpClient = &http.Client{
	Transport: &http.Transport{
		ResponseHeaderTimeout: responseHeaderTimeout,
		MaxIdleConnsPerHost:   100, // 启用连接复用，避免重复 TCP 握手
	},
}

// Manager 文件下载管理器
type Manager struct {
	downloadDir        string
	downloadRecord     string                  // 已下载记录的持久化文件路径
	sendFileFn         SendFileFunc            // 文件发送回调（由调用方注入）
	errorCallback      DownloadErrorCallback   // 异步下载失败回调
	successCallback    DownloadSuccessCallback // 异步下载成功回调
	downloadedURLs     map[string]time.Time    // 已下载URL缓存，防止短时间内重复下载
	useThunder         bool                    // 是否启用迅雷优先下载
	thunderMinFileSize int64                   // 小于此大小的文件跳过迅雷（字节）
	mu                 sync.Mutex
}

// SendFileFunc 文件发送回调函数类型
// filePath: 文件绝对路径, fileName: 显示文件名, groupID: 目标群组
type SendFileFunc func(filePath string, fileName string, groupID string) error

// DownloadErrorCallback 异步下载失败回调
// groupID: 目标群组, url: 下载链接, errMsg: 错误描述
type DownloadErrorCallback func(groupID string, url string, errMsg string)

// DownloadSuccessCallback 异步下载成功回调
// groupID: 目标群组, url: 下载链接, fileName: 文件名
type DownloadSuccessCallback func(groupID string, url string, fileName string)

// NewManager 创建下载管理器
func NewManager(downloadDir string) *Manager {
	// 确保下载目录存在
	if err := os.MkdirAll(downloadDir, 0755); err != nil {
		logger.Sugar.Warnw("[下载] 创建下载目录失败", "dir", downloadDir, "error", err)
	}

	recordPath := filepath.Join(downloadDir, downloadedRecordFile)
	m := &Manager{
		downloadDir:    downloadDir,
		downloadRecord: recordPath,
		downloadedURLs: make(map[string]time.Time),
	}

	// 从磁盘加载已下载记录，避免重启后重复下载
	m.loadDownloadedURLs()

	return m
}

// SetSendFileFunc 注入文件发送回调（通用接口，插件模块也可调用）
func (m *Manager) SetSendFileFunc(fn SendFileFunc) {
	m.sendFileFn = fn
}

// SetDownloadErrorCallback 注入异步下载失败回调
func (m *Manager) SetDownloadErrorCallback(cb DownloadErrorCallback) {
	m.errorCallback = cb
}

// SetDownloadSuccessCallback 注入异步下载成功回调
func (m *Manager) SetDownloadSuccessCallback(cb DownloadSuccessCallback) {
	m.successCallback = cb
}

// SetThunderConfig 设置迅雷下载配置
func (m *Manager) SetThunderConfig(useThunder bool, minFileSizeMB int) {
	m.useThunder = useThunder
	m.thunderMinFileSize = int64(minFileSizeMB) * 1024 * 1024
}

// Download 下载文件到本地，返回文件路径
// tracker 为可选的进度追踪器，传 nil 则不追踪进度
// 优先尝试多线程分段下载（类似迅雷），不支持 Range 的服务器回退到单线程
func (m *Manager) Download(url string, tracker *Tracker) (filePath string, err error) {
	// 下载成功后记录URL，防止短时间内重复下载
	defer func() {
		if err == nil {
			m.mu.Lock()
			m.downloadedURLs[url] = time.Now()
			m.mu.Unlock()
			// 持久化到磁盘，重启后也能记住
			m.saveDownloadedURLs()
		}
	}()

	// 检查是否最近已下载过同一URL（防止规划器重复触发下载）
	m.mu.Lock()
	if lastTime, exists := m.downloadedURLs[url]; exists {
		if time.Since(lastTime) < 30*time.Minute {
			m.mu.Unlock()
			logger.Sugar.Infow("[下载] URL已下载过，跳过重复下载", "url", url, "last_download", lastTime.Format("15:04:05"))
			return "", fmt.Errorf("该文件已下载过，请勿重复下载")
		}
	}
	m.mu.Unlock()

	// 生成安全的文件名
	fileName := generateFileName(url)
	filePath = filepath.Join(m.downloadDir, fileName)

	// 如果文件已存在，直接返回
	if _, err := os.Stat(filePath); err == nil {
		logger.Sugar.Infow("[下载] 文件已存在，跳过下载", "url", url, "path", filePath)
		return filePath, nil
	}

	logger.Sugar.Infow("[下载] 开始下载文件", "url", url)

	// 先探测服务端是否支持 Range
	fileSize, supportsRange := probeRangeSupport(url)
	if supportsRange && fileSize > minMultiThreadSize {
		logger.Sugar.Infow("[下载] 启用多线程分段下载", "url", url, "size", fileSize, "threads", downloadThreads)
		written, err := downloadWithRange(url, filePath, fileSize, tracker)
		if err != nil {
			os.Remove(filePath)
			return "", err
		}
		logger.Sugar.Infow("[下载] 多线程下载完成", "url", url, "path", filePath, "size", written)
		return filePath, nil
	}

	// 回退：单线程下载
	if supportsRange {
		logger.Sugar.Infow("[下载] 文件太小，回退单线程", "url", url, "size", fileSize)
	} else {
		logger.Sugar.Infow("[下载] 服务端不支持 Range，回退单线程", "url", url)
	}
	return m.downloadSingleThread(url, filePath, tracker)
}

// probeRangeSupport 发送 HEAD 请求探测服务端是否支持 Range 请求
// 返回文件大小和是否支持 Range
func probeRangeSupport(url string) (int64, bool) {
	req, err := http.NewRequest("HEAD", url, nil)
	if err != nil {
		return 0, false
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")

	resp, err := httpClient.Do(req)
	if err != nil {
		return 0, false
	}
	resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return 0, false
	}

	return resp.ContentLength, resp.Header.Get("Accept-Ranges") == "bytes"
}

// downloadSingleThread 单线程下载（回退方案）
func (m *Manager) downloadSingleThread(url string, filePath string, tracker *Tracker) (string, error) {
	// 竞速下载：同时尝试原始 URL 和镜像
	resp, usedURL, err := RaceGet(context.Background(), url)
	if err != nil {
		return "", fmt.Errorf("下载失败: %w", err)
	}
	defer resp.Body.Close()

	if usedURL != url {
		logger.Sugar.Infow("[下载] 镜像竞速胜出", "original", url, "used", usedURL)
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("下载失败，HTTP状态码: %d", resp.StatusCode)
	}

	limitedReader := io.LimitReader(resp.Body, maxDownloadSize)

	file, err := os.Create(filePath)
	if err != nil {
		return "", fmt.Errorf("创建文件失败: %w", err)
	}
	defer file.Close()

	written, err := io.Copy(file, limitedReader)
	if err != nil {
		os.Remove(filePath)
		return "", fmt.Errorf("写入文件失败: %w", err)
	}

	if tracker != nil {
		tracker.Add(written)
	}

	if written >= maxDownloadSize {
		os.Remove(filePath)
		return "", fmt.Errorf("文件超过大小限制(%dMB)", maxDownloadSize/(1024*1024))
	}

	logger.Sugar.Infow("[下载] 单线程下载完成",
		"url", url, "path", filePath, "size", written,
	)

	return filePath, nil
}

// downloadWithRange 多线程分段下载，每段用 Range 头并行拉取
func downloadWithRange(url string, filePath string, fileSize int64, tracker *Tracker) (int64, error) {
	if fileSize > maxDownloadSize {
		return 0, fmt.Errorf("文件超过大小限制(%dMB)，实际大小: %dMB", maxDownloadSize/(1024*1024), fileSize/(1024*1024))
	}

	// 竞速选出最佳 URL，然后所有分段统一使用该 URL
	bestURL := url
	candidates := findMirrors(url)
	if len(candidates) > 1 {
		// 用 HEAD 竞速选出最快的镜像
		bestURL = raceHead(candidates)
		if bestURL != url {
			logger.Sugar.Infow("[下载] 镜像竞速胜出，所有分段使用", "original", url, "used", bestURL)
		}
	}

	file, err := os.Create(filePath)
	if err != nil {
		return 0, fmt.Errorf("创建文件失败: %w", err)
	}
	defer file.Close()

	// 预分配文件空间
	if err := file.Truncate(fileSize); err != nil {
		os.Remove(filePath)
		return 0, fmt.Errorf("预分配文件空间失败: %w", err)
	}

	chunkSize := fileSize / int64(downloadThreads)
	if chunkSize < 1 {
		chunkSize = 1
	}

	var wg sync.WaitGroup
	errCh := make(chan error, downloadThreads)

	startTime := time.Now()

	actualThreads := 0
	for i := 0; i < downloadThreads; i++ {
		start := int64(i) * chunkSize
		end := start + chunkSize - 1
		if i == downloadThreads-1 {
			end = fileSize - 1 // 最后一段取剩余全部
		}
		if start >= fileSize {
			break
		}
		actualThreads++

		wg.Add(1)
		go func(threadID int, rangeStart, rangeEnd int64) {
			defer wg.Done()
			// 分段失败自动重试，避免临时网络波动导致整段报废
			var lastErr error
			for retry := 0; retry <= maxChunkRetries; retry++ {
				if retry > 0 {
					logger.Sugar.Warnw("[下载] 分段重试",
						"thread", threadID+1,
						"retry", retry,
						"range", fmt.Sprintf("%d-%d", rangeStart, rangeEnd),
						"error", lastErr,
					)
					time.Sleep(time.Duration(retry) * time.Second) // 退避等待
				}
				lastErr = downloadChunk(bestURL, file, rangeStart, rangeEnd, tracker, startTime)
				if lastErr == nil {
					return
				}
			}
			errCh <- fmt.Errorf("线程%d 下载失败(重试%d次): %w", threadID+1, maxChunkRetries, lastErr)
		}(i, start, end)
	}

	wg.Wait()
	close(errCh)

	// 收集错误
	if err := <-errCh; err != nil {
		os.Remove(filePath)
		return 0, err
	}

	return fileSize, nil
}

// downloadChunk 下载一个分段，直接写入文件指定偏移位置
// tracker 为可选的进度追踪器，传 nil 则不追踪
func downloadChunk(url string, file *os.File, rangeStart, rangeEnd int64, tracker *Tracker, _ time.Time) error {
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
	req.Header.Set("Range", fmt.Sprintf("bytes=%d-%d", rangeStart, rangeEnd))

	resp, err := httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusPartialContent && resp.StatusCode != http.StatusOK {
		return fmt.Errorf("HTTP状态码: %d", resp.StatusCode)
	}

	chunkSize := rangeEnd - rangeStart + 1
	limitedReader := io.LimitReader(resp.Body, chunkSize)

	// 使用 WriteAt 直接写入文件偏移位置，多线程安全
	buf := make([]byte, 256*1024) // 256KB buffer，减少系统调用次数
	offset := rangeStart
	for {
		n, readErr := limitedReader.Read(buf)
		if n > 0 {
			if _, writeErr := file.WriteAt(buf[:n], offset); writeErr != nil {
				return writeErr
			}
			offset += int64(n)
			// 更新进度追踪器
			if tracker != nil {
				tracker.Add(int64(n))
			}
		}
		if readErr == io.EOF {
			break
		}
		if readErr != nil {
			return readErr
		}
	}

	return nil
}

// StartCleanupLoop 启动定期清理循环
func (m *Manager) StartCleanupLoop(ctx context.Context) {
	go func() {
		ticker := time.NewTicker(cleanupInterval)
		defer ticker.Stop()

		// 启动时先清理一次
		m.cleanup()

		for {
			select {
			case <-ctx.Done():
				logger.Sugar.Info("[下载] 清理循环已停止")
				return
			case <-ticker.C:
				m.cleanup()
			}
		}
	}()
}

// cleanup 清理过期文件
func (m *Manager) cleanup() {
	m.mu.Lock()
	defer m.mu.Unlock()

	entries, err := os.ReadDir(m.downloadDir)
	if err != nil {
		logger.Sugar.Warnw("[下载] 读取下载目录失败", "dir", m.downloadDir, "error", err)
		return
	}

	now := time.Now()
	cleaned := 0

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		filePath := filepath.Join(m.downloadDir, entry.Name())
		info, err := entry.Info()
		if err != nil {
			continue
		}

		if now.Sub(info.ModTime()) > maxFileAge {
			if err := os.Remove(filePath); err != nil {
				logger.Sugar.Warnw("[下载] 清理文件失败", "path", filePath, "error", err)
			} else {
				cleaned++
			}
		}
	}

	if cleaned > 0 {
		logger.Sugar.Infow("[下载] 清理完成", "cleaned", cleaned, "dir", m.downloadDir)
	}
}

// generateFileName 根据 URL 生成安全的文件名
func generateFileName(url string) string {
	// 时间戳前缀，避免文件名冲突
	timestamp := time.Now().UnixNano()

	// 取 URL 路径的最后一部分作为文件名
	// 去掉查询参数
	path := url
	if idx := strings.Index(path, "?"); idx >= 0 {
		path = path[:idx]
	}
	if idx := strings.Index(path, "#"); idx >= 0 {
		path = path[:idx]
	}

	baseName := filepath.Base(path)
	if baseName == "" || baseName == "." || baseName == "/" {
		baseName = "download"
	}

	// 清理文件名中的不安全字符
	baseName = strings.Map(func(r rune) rune {
		if r == '/' || r == '\\' || r == ':' || r == '*' || r == '?' || r == '"' || r == '<' || r == '>' || r == '|' {
			return '_'
		}
		return r
	}, baseName)

	// 确保文件名有扩展名
	if !strings.Contains(baseName, ".") {
		baseName = baseName + ".file"
	}

	return fmt.Sprintf("%d_%s", timestamp, baseName)
}

// GetDir 返回下载目录路径
func (m *Manager) GetDir() string {
	return m.downloadDir
}

// loadDownloadedURLs 从磁盘加载已下载URL记录
func (m *Manager) loadDownloadedURLs() {
	data, err := os.ReadFile(m.downloadRecord)
	if err != nil {
		if !os.IsNotExist(err) {
			logger.Sugar.Warnw("[下载] 读取已下载记录失败", "path", m.downloadRecord, "error", err)
		}
		return
	}

	var records map[string]time.Time
	if err := json.Unmarshal(data, &records); err != nil {
		logger.Sugar.Warnw("[下载] 解析已下载记录失败", "path", m.downloadRecord, "error", err)
		return
	}

	now := time.Now()
	loaded := 0
	for url, t := range records {
		// 过滤掉过期记录（超过30天）
		if now.Sub(t) > downloadedRecordTTL {
			continue
		}
		m.downloadedURLs[url] = t
		loaded++
	}

	if loaded > 0 {
		logger.Sugar.Infow("[下载] 已加载历史下载记录", "count", loaded)
	}
}

// saveDownloadedURLs 将已下载URL记录持久化到磁盘
func (m *Manager) saveDownloadedURLs() {
	// 清理过期记录后再保存
	m.mu.Lock()
	now := time.Now()
	records := make(map[string]time.Time, len(m.downloadedURLs))
	for url, t := range m.downloadedURLs {
		if now.Sub(t) < downloadedRecordTTL {
			records[url] = t
		}
	}
	m.mu.Unlock()

	data, err := json.Marshal(records)
	if err != nil {
		logger.Sugar.Warnw("[下载] 序列化下载记录失败", "error", err)
		return
	}

	if err := os.WriteFile(m.downloadRecord, data, 0644); err != nil {
		logger.Sugar.Warnw("[下载] 保存下载记录失败", "path", m.downloadRecord, "error", err)
	}
}

// DownloadAndSend 下载文件并发送到群组（通用接口，插件模块也可调用）
// 下载成功后会通过注入的 SendFileFunc 将文件发送到目标群组
// 返回文件路径和可能的错误
func (m *Manager) DownloadAndSend(url string, groupID string) (string, error) {
	filePath, err := m.Download(url, nil)
	if err != nil {
		return "", err
	}

	if m.sendFileFn != nil {
		fileName := filepath.Base(filePath)
		absPath, absErr := filepath.Abs(filePath)
		if absErr != nil {
			absPath = filePath
		}
		if err := m.sendFileFn(absPath, fileName, groupID); err != nil {
			logger.Sugar.Warnw("[下载] 发送文件失败", "path", filePath, "groupID", groupID, "error", err)
			return filePath, fmt.Errorf("发送文件失败: %w", err)
		}
		logger.Sugar.Infow("[下载] 文件已发送到群组", "file", fileName, "groupID", groupID)
	}

	return filePath, nil
}

// DownloadAndSendAsync 异步下载文件并发送到群组
// 立即返回，下载和发送在后台 goroutine 中执行
// 成功：直接发送文件到群聊
// 失败：通过 errorCallback 通知调用方（如注入合成事件触发规划器）
func (m *Manager) DownloadAndSendAsync(url string, groupID string) {
	downloadID := fmt.Sprintf("dl_%d", time.Now().UnixNano())

	go func() {
		defer func() {
			if r := recover(); r != nil {
				logger.Sugar.Errorw("[下载] 异步下载 panic，已恢复", "url", url, "panic", r)
				if m.errorCallback != nil {
					m.errorCallback(groupID, url, fmt.Sprintf("下载异常：%v", r))
				}
			}
		}()

		// 创建进度追踪器，前端可通过 SSE 订阅进度
		fileName := generateFileName(url)
		fileSize, _ := probeRangeSupport(url)
		tracker := NewTracker(downloadID, url, fileName, groupID, fileSize)
		defer tracker.Remove()

		// 尝试迅雷优先下载
		if m.useThunder && IsThunderAvailable() && fileSize >= m.thunderMinFileSize {
			logger.Sugar.Infow("[下载] 尝试迅雷优先下载", "url", url, "file", fileName, "size", fileSize)
			filePath, err := m.tryThunderDownload(url, fileName, groupID, tracker)
			if err == nil {
				// 迅雷下载成功，发送文件
				m.sendDownloadedFile(filePath, fileName, groupID, tracker)
				return
			}
			logger.Sugar.Warnw("[下载] 迅雷下载失败，回退到内置下载", "url", url, "error", err)

			// 如果是文件找不到，标记迅雷不可用
			if isThunderFatalError(err) {
				thunderMu.Lock()
				thunderAvailable = false
				thunderMu.Unlock()
				logger.Sugar.Warn("[下载] 迅雷标记为不可用，后续将使用内置下载")
			}
		}

		// 内置下载
		filePath, err := m.Download(url, tracker)
		if err != nil {
			logger.Sugar.Warnw("[下载] 异步下载失败", "url", url, "error", err)
			tracker.MarkFailed(err.Error())
			if m.errorCallback != nil {
				m.errorCallback(groupID, url, err.Error())
			}
			return
		}

		m.sendDownloadedFile(filePath, filepath.Base(filePath), groupID, tracker)
	}()
}

// tryThunderDownload 尝试通过迅雷下载文件
// 返回文件路径和错误
func (m *Manager) tryThunderDownload(url, fileName, groupID string, tracker *Tracker) (string, error) {
	filePath := filepath.Join(m.downloadDir, fileName)

	// 懒启动 ThunderWorker
	worker := GetThunderWorker()
	worker.Start()

	resultCh := make(chan ThunderJobResult, 1)
	job := ThunderDownloadJob{
		URL:      url,
		FileName: fileName,
		SavePath: filePath,
		GroupID:  groupID,
		ResultCh: resultCh,
	}

	worker.Submit(job)

	// 等待结果（带超时）
	select {
	case result := <-resultCh:
		if result.Err != nil {
			return "", result.Err
		}
		return result.FilePath, nil
	case <-time.After(thunderTaskTimeout + 5*time.Minute):
		return "", fmt.Errorf("迅雷下载超时")
	}
}

// isThunderFatalError 判断是否为"迅雷不可用"类型的致命错误
func isThunderFatalError(err error) bool {
	if err == nil {
		return false
	}
	msg := err.Error()
	return strings.Contains(msg, "找不到文件") ||
		strings.Contains(msg, "未找到匹配的文件")
}

// sendDownloadedFile 发送下载完成的文件到群聊
func (m *Manager) sendDownloadedFile(filePath, displayName, groupID string, tracker *Tracker) {
	if m.sendFileFn != nil {
		absPath, absErr := filepath.Abs(filePath)
		if absErr != nil {
			absPath = filePath
		}
		if sendErr := m.sendFileFn(absPath, displayName, groupID); sendErr != nil {
			logger.Sugar.Warnw("[下载] 异步发送文件失败", "path", filePath, "groupID", groupID, "error", sendErr)
			tracker.MarkFailed(fmt.Sprintf("文件已下载但发送失败：%v", sendErr))
			if m.errorCallback != nil {
				m.errorCallback(groupID, filePath, fmt.Sprintf("文件已下载但发送失败：%v", sendErr))
			}
			return
		}
		logger.Sugar.Infow("[下载] 异步下载完成，文件已发送", "file", displayName, "groupID", groupID)
	}

	tracker.MarkCompleted()
	// 通知调用方下载成功，触发规划器回复用户
	if m.successCallback != nil {
		m.successCallback(groupID, filePath, displayName)
	}
}
