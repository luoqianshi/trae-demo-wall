package backup

import (
	"archive/zip"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// ── 备份元数据 ──

type BackupMeta struct {
	Version   string `json:"version"`
	CreatedAt string `json:"created_at"`
	DBFile    string `json:"db_file"`
	FileCount int    `json:"file_count"`
	TotalSize int64  `json:"total_size"`
}

// ── 文件清单 ──

// backupFile 定义备份中需要包含的文件
type backupFile struct {
	Label    string // 人类可读标签
	Path     string // 源文件路径（相对或绝对）
	Required bool   // 是否必须存在，false 会跳过不存在的文件
	IsDir    bool   // 是否为目录
}

// defaultBackupFiles 返回默认备份文件清单
func defaultBackupFiles() []backupFile {
	return []backupFile{
		{Label: "数据库", Path: "./data/yaraflow.db", Required: true},
		{Label: "YAML 配置", Path: "./configs/config.yaml", Required: false},
		{Label: "规则文件", Path: "./configs/rules.json", Required: false},
		{Label: "会话数据", Path: "./data/sessions/sessions.json", Required: false},
		{Label: "向量数据", Path: "./data/vectors/vectors.json", Required: false},
		{Label: "背景图片", Path: "./data/backgrounds", Required: false, IsDir: true},
		{Label: "Prompt 模板", Path: "./configs/prompts", Required: false, IsDir: true},
		{Label: "LLM 配置", Path: "./local_data/lunar_config.json", Required: false},
		{Label: "插件数据", Path: "./plugins", Required: false, IsDir: true},
	}
}

// ── 创建备份 ──

// CreateBackup 创建备份 zip 文件，返回文件路径
func CreateBackup(outputPath string) (*BackupMeta, error) {
	files := defaultBackupFiles()

	// 收集存在的文件
	var validFiles []backupFile
	for _, bf := range files {
		if _, err := os.Stat(bf.Path); err != nil {
			if bf.Required {
				return nil, fmt.Errorf("必需文件不存在: %s (%s)", bf.Label, bf.Path)
			}
			continue
		}
		validFiles = append(validFiles, bf)
	}

	// 确保输出目录存在
	dir := filepath.Dir(outputPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, fmt.Errorf("创建备份目录失败: %w", err)
	}

	// 创建 zip 文件
	zipFile, err := os.Create(outputPath)
	if err != nil {
		return nil, fmt.Errorf("创建备份文件失败: %w", err)
	}
	defer zipFile.Close()

	zw := zip.NewWriter(zipFile)
	defer zw.Close()

	var totalSize int64
	fileCount := 0

	for _, bf := range validFiles {
		if bf.IsDir {
			count, size, err := addDirToZip(zw, bf.Path, bf.Path)
			if err != nil {
				return nil, fmt.Errorf("打包目录 %s 失败: %w", bf.Label, err)
			}
			fileCount += count
			totalSize += size
		} else {
			size, err := addFileToZip(zw, bf.Path)
			if err != nil {
				return nil, fmt.Errorf("打包文件 %s 失败: %w", bf.Label, err)
			}
			fileCount++
			totalSize += size
		}
	}

	// 写入元数据
	meta := BackupMeta{
		Version:   "1.0",
		CreatedAt: time.Now().Format(time.RFC3339),
		DBFile:    "data/yaraflow.db",
		FileCount: fileCount,
		TotalSize: totalSize,
	}

	metaData, err := json.MarshalIndent(meta, "", "  ")
	if err != nil {
		return nil, fmt.Errorf("序列化元数据失败: %w", err)
	}

	w, err := zw.Create("metadata.json")
	if err != nil {
		return nil, fmt.Errorf("创建元数据条目失败: %w", err)
	}
	if _, err := w.Write(metaData); err != nil {
		return nil, fmt.Errorf("写入元数据失败: %w", err)
	}

	return &meta, nil
}

// ── 解析备份 ──

// ReadBackupMeta 从备份文件中读取元数据
func ReadBackupMeta(zipPath string) (*BackupMeta, error) {
	r, err := zip.OpenReader(zipPath)
	if err != nil {
		return nil, fmt.Errorf("打开备份文件失败: %w", err)
	}
	defer r.Close()

	for _, f := range r.File {
		if f.Name == "metadata.json" {
			rc, err := f.Open()
			if err != nil {
				return nil, fmt.Errorf("读取元数据失败: %w", err)
			}
			defer rc.Close()

			var meta BackupMeta
			if err := json.NewDecoder(rc).Decode(&meta); err != nil {
				return nil, fmt.Errorf("解析元数据失败: %w", err)
			}
			return &meta, nil
		}
	}

	return nil, fmt.Errorf("备份文件中未找到 metadata.json")
}

// ListBackupContents 列出备份文件中的所有内容
func ListBackupContents(zipPath string) ([]string, error) {
	r, err := zip.OpenReader(zipPath)
	if err != nil {
		return nil, fmt.Errorf("打开备份文件失败: %w", err)
	}
	defer r.Close()

	var files []string
	for _, f := range r.File {
		files = append(files, f.Name)
	}
	return files, nil
}

// ── 恢复备份 ──

// RestoreResult 恢复结果
type RestoreResult struct {
	Success       bool     `json:"success"`
	RestoredFiles []string `json:"restored_files"`
	Errors        []string `json:"errors,omitempty"`
	Message       string   `json:"message"`
}

// RestoreBackup 从备份文件恢复数据
func RestoreBackup(zipPath string) (*RestoreResult, error) {
	result := &RestoreResult{Success: true}

	// 先验证备份文件
	meta, err := ReadBackupMeta(zipPath)
	if err != nil {
		return nil, fmt.Errorf("备份文件无效: %w", err)
	}

	_ = meta // 元数据用于后续验证

	r, err := zip.OpenReader(zipPath)
	if err != nil {
		return nil, fmt.Errorf("打开备份文件失败: %w", err)
	}
	defer r.Close()

	for _, f := range r.File {
		// 跳过目录和元数据
		if f.FileInfo().IsDir() || f.Name == "metadata.json" {
			continue
		}

		// 安全检查：防止路径遍历攻击
		targetPath := filepath.Clean(f.Name)
		if strings.Contains(targetPath, "..") {
			result.Errors = append(result.Errors, fmt.Sprintf("跳过不安全路径: %s", f.Name))
			continue
		}

		// 确保目标目录存在
		dir := filepath.Dir(targetPath)
		if err := os.MkdirAll(dir, 0755); err != nil {
			result.Errors = append(result.Errors, fmt.Sprintf("创建目录 %s 失败: %v", dir, err))
			continue
		}

		// 提取文件
		rc, err := f.Open()
		if err != nil {
			result.Errors = append(result.Errors, fmt.Sprintf("打开备份条目 %s 失败: %v", f.Name, err))
			continue
		}

		dst, err := os.Create(targetPath)
		if err != nil {
			rc.Close()
			result.Errors = append(result.Errors, fmt.Sprintf("创建目标文件 %s 失败: %v", targetPath, err))
			continue
		}

		_, copyErr := io.Copy(dst, rc)
		rc.Close()
		dst.Close()

		if copyErr != nil {
			result.Errors = append(result.Errors, fmt.Sprintf("写入 %s 失败: %v", targetPath, copyErr))
			continue
		}

		result.RestoredFiles = append(result.RestoredFiles, targetPath)
	}

	if len(result.Errors) > 0 {
		result.Success = false
		result.Message = fmt.Sprintf("恢复完成，但有 %d 个错误", len(result.Errors))
	} else {
		result.Message = "备份恢复成功，请重启服务使更改生效"
	}

	return result, nil
}

// ── 辅助函数 ──

// addFileToZip 将单个文件添加到 zip，返回文件大小
func addFileToZip(zw *zip.Writer, filePath string) (int64, error) {
	info, err := os.Stat(filePath)
	if err != nil {
		return 0, err
	}

	header, err := zip.FileInfoHeader(info)
	if err != nil {
		return 0, err
	}
	header.Name = filepath.ToSlash(filePath)
	header.Method = zip.Deflate

	w, err := zw.CreateHeader(header)
	if err != nil {
		return 0, err
	}

	f, err := os.Open(filePath)
	if err != nil {
		return 0, err
	}
	defer f.Close()

	written, err := io.Copy(w, f)
	if err != nil {
		return 0, err
	}

	return written, nil
}

// addDirToZip 递归将目录添加到 zip，返回文件数量和总大小
func addDirToZip(zw *zip.Writer, dirPath string, basePath string) (int, int64, error) {
	var count int
	var totalSize int64

	err := filepath.Walk(dirPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			return nil
		}

		relPath, err := filepath.Rel(basePath, path)
		if err != nil {
			return err
		}

		// 构建 zip 内的路径
		zipPath := filepath.ToSlash(filepath.Join(basePath, relPath))

		header, err := zip.FileInfoHeader(info)
		if err != nil {
			return err
		}
		header.Name = zipPath
		header.Method = zip.Deflate

		w, err := zw.CreateHeader(header)
		if err != nil {
			return err
		}

		f, err := os.Open(path)
		if err != nil {
			return err
		}
		defer f.Close()

		written, err := io.Copy(w, f)
		if err != nil {
			return err
		}

		count++
		totalSize += written
		return nil
	})

	return count, totalSize, err
}
