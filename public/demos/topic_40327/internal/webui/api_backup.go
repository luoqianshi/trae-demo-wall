package webui

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"YaraFlow/internal/backup"
	"YaraFlow/internal/logger"
)

// ── 备份 API ──

// handleBackup 处理 /api/backup
// GET: 列出已有备份文件
// POST: 创建新备份
func (s *Server) handleBackup(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		s.listBackups(w, r)
	case "POST":
		s.createBackup(w, r)
	default:
		jsonError(w, 405, "Method not allowed")
	}
}

// handleBackupAction 处理 /api/backup/{action}/{filename}
func (s *Server) handleBackupAction(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/backup/")
	parts := strings.SplitN(path, "/", 2)
	if len(parts) == 0 {
		jsonError(w, 400, "无效的备份操作")
		return
	}

	action := parts[0]
	switch action {
	case "download":
		if len(parts) < 2 {
			jsonError(w, 400, "请指定备份文件名")
			return
		}
		s.downloadBackup(w, r, parts[1])
	case "info":
		if len(parts) < 2 {
			jsonError(w, 400, "请指定备份文件名")
			return
		}
		s.getBackupInfo(w, r, parts[1])
	case "restore":
		s.restoreBackup(w, r)
	default:
		jsonError(w, 404, "未找到该备份操作")
	}
}

// ── 创建备份 ──

func (s *Server) createBackup(w http.ResponseWriter, _ *http.Request) {
	backupDir := "./data/backups"
	if err := os.MkdirAll(backupDir, 0755); err != nil {
		jsonError(w, 500, "创建备份目录失败: "+err.Error())
		return
	}

	timestamp := time.Now().Format("20060102_150405")
	filename := fmt.Sprintf("yaraflow_backup_%s.zip", timestamp)
	outputPath := filepath.Join(backupDir, filename)

	meta, err := backup.CreateBackup(outputPath)
	if err != nil {
		logger.Sugar.Errorw("[备份] 创建失败", "error", err)
		jsonError(w, 500, "备份失败: "+err.Error())
		return
	}

	// 获取文件大小
	info, _ := os.Stat(outputPath)
	var fileSize int64
	if info != nil {
		fileSize = info.Size()
	}

	logger.Sugar.Infow("[备份] 创建成功", "file", filename, "files", meta.FileCount, "size", fileSize)

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	json.NewEncoder(w).Encode(map[string]any{
		"success":   true,
		"file":      filename,
		"file_size": fileSize,
		"meta":      meta,
	})
}

// ── 列出备份 ──

func (s *Server) listBackups(w http.ResponseWriter, _ *http.Request) {
	backupDir := "./data/backups"

	entries, err := os.ReadDir(backupDir)
	if err != nil {
		if os.IsNotExist(err) {
			w.Header().Set("Content-Type", "application/json; charset=utf-8")
			json.NewEncoder(w).Encode(map[string]any{
				"backups": []any{},
			})
			return
		}
		jsonError(w, 500, "读取备份目录失败: "+err.Error())
		return
	}

	type backupInfo struct {
		Filename string `json:"filename"`
		Size     int64  `json:"size"`
		ModTime  string `json:"mod_time"`
	}

	var backups []backupInfo
	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".zip") {
			continue
		}
		info, err := entry.Info()
		if err != nil {
			continue
		}
		backups = append(backups, backupInfo{
			Filename: entry.Name(),
			Size:     info.Size(),
			ModTime:  info.ModTime().Format(time.RFC3339),
		})
	}

	// 按修改时间倒序排列
	for i := 0; i < len(backups); i++ {
		for j := i + 1; j < len(backups); j++ {
			if backups[j].ModTime > backups[i].ModTime {
				backups[i], backups[j] = backups[j], backups[i]
			}
		}
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	json.NewEncoder(w).Encode(map[string]any{
		"backups": backups,
	})
}

// ── 下载备份 ──

func (s *Server) downloadBackup(w http.ResponseWriter, r *http.Request, filename string) {
	// 安全检查：防止路径遍历
	if strings.Contains(filename, "..") || strings.Contains(filename, "/") || strings.Contains(filename, "\\") {
		jsonError(w, 400, "无效的文件名")
		return
	}

	filePath := filepath.Join("./data/backups", filename)

	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		jsonError(w, 404, "备份文件不存在")
		return
	}

	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))
	w.Header().Set("Content-Type", "application/zip")
	http.ServeFile(w, r, filePath)
}

// ── 获取备份信息 ──

func (s *Server) getBackupInfo(w http.ResponseWriter, _ *http.Request, filename string) {
	if strings.Contains(filename, "..") || strings.Contains(filename, "/") || strings.Contains(filename, "\\") {
		jsonError(w, 400, "无效的文件名")
		return
	}

	filePath := filepath.Join("./data/backups", filename)

	meta, err := backup.ReadBackupMeta(filePath)
	if err != nil {
		jsonError(w, 500, "读取备份信息失败: "+err.Error())
		return
	}

	contents, err := backup.ListBackupContents(filePath)
	if err != nil {
		jsonError(w, 500, "列出备份内容失败: "+err.Error())
		return
	}

	info, _ := os.Stat(filePath)
	var fileSize int64
	if info != nil {
		fileSize = info.Size()
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	json.NewEncoder(w).Encode(map[string]any{
		"filename":  filename,
		"file_size": fileSize,
		"meta":      meta,
		"contents":  contents,
	})
}

// ── 恢复备份 ──

func (s *Server) restoreBackup(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		jsonError(w, 405, "Method not allowed")
		return
	}

	// 支持上传文件或指定已有备份文件名
	contentType := r.Header.Get("Content-Type")

	var zipPath string
	var cleanup func()

	if strings.Contains(contentType, "multipart/form-data") {
		// 上传文件方式
		if err := r.ParseMultipartForm(100 << 20); err != nil { // 100MB
			jsonError(w, 400, "解析上传文件失败: "+err.Error())
			return
		}

		file, header, err := r.FormFile("file")
		if err != nil {
			jsonError(w, 400, "未找到上传文件: "+err.Error())
			return
		}
		defer file.Close()

		if !strings.HasSuffix(header.Filename, ".zip") {
			jsonError(w, 400, "请上传 .zip 格式的备份文件")
			return
		}

		// 保存到临时文件
		tmpDir := "./data/backups"
		os.MkdirAll(tmpDir, 0755)
		tmpPath := filepath.Join(tmpDir, "_restore_"+header.Filename)
		dst, err := os.Create(tmpPath)
		if err != nil {
			jsonError(w, 500, "保存临时文件失败: "+err.Error())
			return
		}
		defer dst.Close()

		buf := make([]byte, 32*1024)
		for {
			n, err := file.Read(buf)
			if n > 0 {
				dst.Write(buf[:n])
			}
			if err != nil {
				break
			}
		}

		zipPath = tmpPath
		cleanup = func() { os.Remove(tmpPath) }
	} else {
		// JSON 指定已有备份文件名
		var req struct {
			Filename string `json:"filename"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			jsonError(w, 400, "解析请求失败: "+err.Error())
			return
		}

		if strings.Contains(req.Filename, "..") || strings.Contains(req.Filename, "/") || strings.Contains(req.Filename, "\\") {
			jsonError(w, 400, "无效的文件名")
			return
		}

		zipPath = filepath.Join("./data/backups", req.Filename)
	}

	if cleanup != nil {
		defer cleanup()
	}

	result, err := backup.RestoreBackup(zipPath)
	if err != nil {
		logger.Sugar.Errorw("[备份] 恢复失败", "error", err)
		jsonError(w, 500, "恢复失败: "+err.Error())
		return
	}

	logger.Sugar.Infow("[备份] 恢复完成", "files", len(result.RestoredFiles), "errors", len(result.Errors))

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	json.NewEncoder(w).Encode(result)
}
