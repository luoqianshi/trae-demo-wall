//go:build windows

package download

import (
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"sync"
	"time"

	"YaraFlow/internal/logger"

	"github.com/go-ole/go-ole"
	"github.com/go-ole/go-ole/oleutil"
	"golang.org/x/sys/windows/registry"
)

// COM 错误码
const (
	comSFalse          = 0x00000001 // S_FALSE
	comRPCChangedMode  = 0x80010106 // RPC_E_CHANGED_MODE
)

// Thunder 下载任务超时
const (
	thunderTaskTimeout  = 30 * time.Minute // 单个任务最大等待时间
	thunderPollInterval = 1 * time.Second  // 进度轮询间隔
)

// ThunderDownloadJob 迅雷下载任务
type ThunderDownloadJob struct {
	URL      string
	FileName string
	SavePath string
	GroupID  string
	ResultCh chan ThunderJobResult
}

// ThunderJobResult 迅雷下载任务结果
type ThunderJobResult struct {
	FilePath string
	FileSize int64
	Err      error
}

// ThunderWorker 迅雷 COM 管家，单 goroutine + LockOSThread
type ThunderWorker struct {
	jobQueue chan ThunderDownloadJob
	stopCh   chan struct{}
	once     sync.Once
}

var (
	thunderWorker     *ThunderWorker
	thunderWorkerOnce sync.Once
	thunderAvailable  bool
	thunderMu         sync.Mutex
)

// CheckThunderAvailable 检测迅雷是否可用（注册表 + COM 双重验证）
// 结果缓存在内存中，可通过此函数重新检测
func CheckThunderAvailable() bool {
	thunderMu.Lock()
	defer thunderMu.Unlock()

	thunderAvailable = detectThunder()
	return thunderAvailable
}

// IsThunderAvailable 返回缓存的迅雷可用状态
func IsThunderAvailable() bool {
	thunderMu.Lock()
	defer thunderMu.Unlock()
	return thunderAvailable
}

// detectThunder 执行实际检测（注册表 + COM）
func detectThunder() bool {
	// 1. 检查注册表
	installed := checkThunderRegistry()
	if !installed {
		logger.Sugar.Info("[迅雷] 注册表中未检测到迅雷安装信息")
		return false
	}

	// 2. 尝试创建 COM 对象
	if err := ole.CoInitializeEx(0, ole.COINIT_APARTMENTTHREADED); err != nil {
		// COINIT_APARTMENTTHREADED 已被其他线程初始化，尝试 COINIT_MULTITHREADED
		if err.(*ole.OleError).Code() != comSFalse && err.(*ole.OleError).Code() != comRPCChangedMode {
			logger.Sugar.Warnw("[迅雷] COM 初始化失败", "error", err)
			return false
		}
	}
	defer ole.CoUninitialize()

	unknown, err := oleutil.CreateObject("ThunderAgent.Agent64.1")
	if err != nil {
		// 尝试 32 位
		unknown, err = oleutil.CreateObject("ThunderAgent.Agent.1")
		if err != nil {
			logger.Sugar.Warnw("[迅雷] 无法创建迅雷 COM 对象", "error", err)
			return false
		}
	}
	defer unknown.Release()

	agent, err := unknown.QueryInterface(ole.IID_IDispatch)
	if err != nil {
		logger.Sugar.Warnw("[迅雷] 无法获取迅雷 IDispatch 接口", "error", err)
		return false
	}
	defer agent.Release()

	// 3. 调用 GetInfo 确认迅雷存在
	result, err := oleutil.CallMethod(agent, "GetInfo", "ThunderExists")
	if err != nil {
		logger.Sugar.Warnw("[迅雷] GetInfo 调用失败", "error", err)
		return false
	}

	exists := result.Value().(string) == "true"
	if exists {
		// 获取迅雷版本号
		version := ""
		verResult, verErr := oleutil.CallMethod(agent, "GetInfo", "ThunderVersion")
		if verErr == nil {
			version = verResult.Value().(string)
		}
		logger.Sugar.Infow("[迅雷] 迅雷检测成功", "version", version)
	}

	return exists
}

// checkThunderRegistry 检查注册表中是否有迅雷安装信息
func checkThunderRegistry() bool {
	// 尝试多个可能的注册表路径
	paths := []string{
		`SOFTWARE\Thunder Network\Thunder`,
		`SOFTWARE\WOW6432Node\Thunder Network\Thunder`,
	}

	for _, path := range paths {
		key, err := registry.OpenKey(registry.LOCAL_MACHINE, path, registry.QUERY_VALUE)
		if err != nil {
			continue
		}
		defer key.Close()

		// 尝试读取安装路径
		if _, _, err := key.GetStringValue("Path"); err == nil {
			return true
		}
		if _, _, err := key.GetStringValue("InstallDir"); err == nil {
			return true
		}
	}

	return false
}

// GetThunderWorker 获取迅雷管家单例（懒加载）
func GetThunderWorker() *ThunderWorker {
	thunderWorkerOnce.Do(func() {
		thunderWorker = &ThunderWorker{
			jobQueue: make(chan ThunderDownloadJob, 10),
			stopCh:   make(chan struct{}),
		}
	})
	return thunderWorker
}

// Start 启动迅雷管家 goroutine（懒加载，第一次下载时调用）
func (w *ThunderWorker) Start() {
	w.once.Do(func() {
		go w.run()
		logger.Sugar.Info("[迅雷] ThunderWorker 管家已启动")
	})
}

// Stop 停止迅雷管家
func (w *ThunderWorker) Stop() {
	close(w.stopCh)
}

// Submit 提交下载任务到管家队列
func (w *ThunderWorker) Submit(job ThunderDownloadJob) {
	w.jobQueue <- job
}

// run 管家主循环，绑定到固定 OS 线程
func (w *ThunderWorker) run() {
	runtime.LockOSThread()
	defer runtime.UnlockOSThread()

	// 初始化 COM（STA 模式）
	if err := ole.CoInitializeEx(0, ole.COINIT_APARTMENTTHREADED); err != nil {
		code := uintptr(0)
		if oleErr, ok := err.(*ole.OleError); ok {
			code = oleErr.Code()
		}
		if code != comSFalse && code != comRPCChangedMode {
			logger.Sugar.Errorw("[迅雷] ThunderWorker COM 初始化失败", "error", err)
			return
		}
	}
	defer ole.CoUninitialize()

	for {
		select {
		case <-w.stopCh:
			logger.Sugar.Info("[迅雷] ThunderWorker 管家已停止")
			return
		case job := <-w.jobQueue:
			w.processJob(job)
		}
	}
}

// processJob 处理单个下载任务
func (w *ThunderWorker) processJob(job ThunderDownloadJob) {
	defer func() {
		if r := recover(); r != nil {
			logger.Sugar.Errorw("[迅雷] ThunderWorker 处理任务 panic", "url", job.URL, "panic", r)
			job.ResultCh <- ThunderJobResult{Err: fmt.Errorf("迅雷管家异常: %v", r)}
		}
	}()

	logger.Sugar.Infow("[迅雷] 开始迅雷下载", "url", job.URL, "file", job.FileName)

	// 创建 COM 对象
	unknown, err := oleutil.CreateObject("ThunderAgent.Agent64.1")
	if err != nil {
		unknown, err = oleutil.CreateObject("ThunderAgent.Agent.1")
		if err != nil {
			job.ResultCh <- ThunderJobResult{Err: fmt.Errorf("创建迅雷 COM 对象失败: %w", err)}
			return
		}
	}
	defer unknown.Release()

	agent, err := unknown.QueryInterface(ole.IID_IDispatch)
	if err != nil {
		job.ResultCh <- ThunderJobResult{Err: fmt.Errorf("获取迅雷接口失败: %w", err)}
		return
	}
	defer agent.Release()

	// 添加任务：AddTask(url, filename, savePath, comments, referURL, startMode, onlyFromOrigin, threadCount)
	// startMode: 1=立即开始, onlyFromOrigin: 0=多资源下载
	saveDir := filepath.Dir(job.SavePath)
	_, err = oleutil.CallMethod(agent, "AddTask", job.URL, job.FileName, saveDir, "", "", 1, 0, 5)
	if err != nil {
		job.ResultCh <- ThunderJobResult{Err: fmt.Errorf("添加迅雷任务失败: %w", err)}
		return
	}

	// 提交任务（立即开始下载）
	_, err = oleutil.CallMethod(agent, "CommitTasks2", 1)
	if err != nil {
		job.ResultCh <- ThunderJobResult{Err: fmt.Errorf("提交迅雷任务失败: %w", err)}
		return
	}

	// 轮询等待下载完成
	deadline := time.Now().Add(thunderTaskTimeout)
	var lastPercent int
	for time.Now().Before(deadline) {
		time.Sleep(thunderPollInterval)

		// 查询任务状态
		stateResult, err := oleutil.CallMethod(agent, "GetTaskInfo", job.URL, "TaskState")
		if err != nil {
			// COM 调用失败，可能迅雷进程崩了
			job.ResultCh <- ThunderJobResult{Err: fmt.Errorf("查询迅雷任务状态失败: %w", err)}
			return
		}

		state := stateResult.Value().(string)

		// 查询进度百分比
		percentResult, err := oleutil.CallMethod(agent, "GetTaskInfo", job.URL, "Percent")
		if err == nil {
			if pctStr, ok := percentResult.Value().(string); ok {
				fmt.Sscanf(pctStr, "%d", &lastPercent)
			}
		}

		switch state {
		case "1": // 成功
			logger.Sugar.Infow("[迅雷] 迅雷下载完成", "url", job.URL, "file", job.FileName)

			// 获取文件大小
			fileSize := int64(0)
			sizeResult, err := oleutil.CallMethod(agent, "GetTaskInfo", job.URL, "FileSize")
			if err == nil {
				if sizeStr, ok := sizeResult.Value().(string); ok {
					fmt.Sscanf(sizeStr, "%d", &fileSize)
				}
			}

			// 在保存目录中查找匹配的文件
			matchedPath, matchErr := findDownloadedFile(saveDir, job.FileName, fileSize)
			if matchErr != nil {
				job.ResultCh <- ThunderJobResult{Err: fmt.Errorf("迅雷下载完成但找不到文件: %w", matchErr)}
				return
			}

			job.ResultCh <- ThunderJobResult{FilePath: matchedPath, FileSize: fileSize}
			return

		case "2": // 失败
			job.ResultCh <- ThunderJobResult{Err: fmt.Errorf("迅雷下载失败（任务状态: 失败）")}
			return

		case "3": // 暂停
			logger.Sugar.Warnw("[迅雷] 迅雷任务被暂停", "url", job.URL)
			job.ResultCh <- ThunderJobResult{Err: fmt.Errorf("迅雷任务被暂停")}
			return
		}
	}

	// 超时
	job.ResultCh <- ThunderJobResult{Err: fmt.Errorf("迅雷下载超时（超过 %v）", thunderTaskTimeout)}
}

// findDownloadedFile 在保存目录中查找与预期大小匹配的文件
func findDownloadedFile(dir, expectedName string, expectedSize int64) (string, error) {
	// 先尝试直接找预期文件名
	directPath := filepath.Join(dir, expectedName)
	if info, err := os.Stat(directPath); err == nil {
		if expectedSize <= 0 || info.Size() == expectedSize {
			return directPath, nil
		}
	}

	// 遍历目录，找最近修改且大小匹配的文件
	entries, err := os.ReadDir(dir)
	if err != nil {
		return "", fmt.Errorf("读取下载目录失败: %w", err)
	}

	var bestMatch string
	var bestTime time.Time

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		info, err := entry.Info()
		if err != nil {
			continue
		}

		// 排除 downloaded.json
		if entry.Name() == downloadedRecordFile {
			continue
		}

		// 如果知道文件大小，精确匹配
		if expectedSize > 0 && info.Size() != expectedSize {
			continue
		}

		// 找最近修改的文件
		if info.ModTime().After(bestTime) {
			bestTime = info.ModTime()
			bestMatch = filepath.Join(dir, entry.Name())
		}
	}

	if bestMatch != "" {
		logger.Sugar.Infow("[迅雷] 文件大小匹配成功", "expected", expectedName, "found", filepath.Base(bestMatch))
		return bestMatch, nil
	}

	return "", fmt.Errorf("在 %s 中未找到匹配的文件", dir)
}

// ThunderProgressQuery 查询迅雷下载进度
// 返回：百分比(0-100), 已下载字节数, 总大小, 状态, 错误
func ThunderProgressQuery(agent *ole.IDispatch, url string) (percent int, downloaded int64, total int64, status string, err error) {
	// 查询状态
	stateResult, err := oleutil.CallMethod(agent, "GetTaskInfo", url, "TaskState")
	if err != nil {
		return 0, 0, 0, "", err
	}
	status = stateResult.Value().(string)

	// 查询进度
	percentResult, err := oleutil.CallMethod(agent, "GetTaskInfo", url, "Percent")
	if err == nil {
		if pctStr, ok := percentResult.Value().(string); ok {
			fmt.Sscanf(pctStr, "%d", &percent)
		}
	}

	// 查询文件大小
	sizeResult, err := oleutil.CallMethod(agent, "GetTaskInfo", url, "FileSize")
	if err == nil {
		if sizeStr, ok := sizeResult.Value().(string); ok {
			fmt.Sscanf(sizeStr, "%d", &total)
		}
	}

	// 计算已下载字节数
	downloaded = int64(float64(total) * float64(percent) / 100.0)

	return percent, downloaded, total, status, nil
}