package plugin

import (
	"os"
	"path/filepath"
	"strings"

	"github.com/dop251/goja"

	"YaraFlow/internal/logger"
)

// ─── FileInjector ───

type FileInjector struct {
	ctx *InjectorContext
}

func NewFileInjector(ctx *InjectorContext) *FileInjector {
	return &FileInjector{ctx: ctx}
}

func (fi *FileInjector) APIName() string { return "file" }

func (fi *FileInjector) Inject() error {
	fileAPI := map[string]interface{}{
		"read":        fi.createRead(),
		"write":       fi.createWrite(),
		"readData":    fi.createReadData(),
		"writeData":   fi.createWriteData(),
		"listData":    fi.createListData(),
		"getDataPath": fi.createGetDataPath(),
	}

	fi.ctx.mergeIntoYara("file", fileAPI)
	return nil
}

func (fi *FileInjector) createRead() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		if len(call.Arguments) < 1 {
			panic(fi.ctx.sandbox.Runtime().NewTypeError("file.read(path) requires 1 argument"))
		}
		relativePath := call.Arguments[0].String()
		fullPath := filepath.Join(fi.ctx.pluginDir, relativePath)

		cleaned := filepath.Clean(fullPath)
		pluginDirClean := filepath.Clean(fi.ctx.pluginDir)
		rel, err := filepath.Rel(pluginDirClean, cleaned)
		if err != nil || strings.HasPrefix(rel, "..") {
			panic(fi.ctx.sandbox.Runtime().NewTypeError("file.read: path traversal detected"))
		}

		data, err := os.ReadFile(cleaned)
		if err != nil {
			logger.Sugar.Warnw("[Plugin] file.read failed", "id", fi.ctx.pluginID, "path", relativePath, "error", err)
			return fi.ctx.sandbox.Runtime().ToValue(nil)
		}
		return fi.ctx.sandbox.Runtime().ToValue(string(data))
	}
}

func (fi *FileInjector) createWrite() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		if len(call.Arguments) < 2 {
			panic(fi.ctx.sandbox.Runtime().NewTypeError("file.write(path, data) requires 2 arguments"))
		}
		relativePath := call.Arguments[0].String()
		data := call.Arguments[1].String()
		fullPath := filepath.Join(fi.ctx.pluginDir, relativePath)

		cleaned := filepath.Clean(fullPath)
		pluginDirClean := filepath.Clean(fi.ctx.pluginDir)
		rel, err := filepath.Rel(pluginDirClean, cleaned)
		if err != nil || strings.HasPrefix(rel, "..") {
			panic(fi.ctx.sandbox.Runtime().NewTypeError("file.write: path traversal detected"))
		}

		if err := os.MkdirAll(filepath.Dir(cleaned), 0755); err != nil {
			logger.Sugar.Warnw("[Plugin] file.write mkdir failed", "id", fi.ctx.pluginID, "error", err)
			return fi.ctx.sandbox.Runtime().ToValue(false)
		}
		if err := os.WriteFile(cleaned, []byte(data), 0644); err != nil {
			logger.Sugar.Warnw("[Plugin] file.write failed", "id", fi.ctx.pluginID, "error", err)
			return fi.ctx.sandbox.Runtime().ToValue(false)
		}
		return fi.ctx.sandbox.Runtime().ToValue(true)
	}
}

func (fi *FileInjector) createReadData() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		if len(call.Arguments) < 1 {
			panic(fi.ctx.sandbox.Runtime().NewTypeError("file.readData(path) requires 1 argument"))
		}
		relativePath := call.Arguments[0].String()
		dataDir := filepath.Join(fi.ctx.pluginDir, "data")
		fullPath := filepath.Join(dataDir, relativePath)

		cleaned := filepath.Clean(fullPath)
		dataDirClean := filepath.Clean(dataDir)
		rel, err := filepath.Rel(dataDirClean, cleaned)
		if err != nil || strings.HasPrefix(rel, "..") {
			panic(fi.ctx.sandbox.Runtime().NewTypeError("file.readData: path traversal detected"))
		}

		data, err := os.ReadFile(cleaned)
		if err != nil {
			logger.Sugar.Warnw("[Plugin] file.readData failed", "id", fi.ctx.pluginID, "path", relativePath, "error", err)
			return fi.ctx.sandbox.Runtime().ToValue(nil)
		}
		return fi.ctx.sandbox.Runtime().ToValue(string(data))
	}
}

func (fi *FileInjector) createWriteData() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		if len(call.Arguments) < 2 {
			panic(fi.ctx.sandbox.Runtime().NewTypeError("file.writeData(path, data) requires 2 arguments"))
		}
		relativePath := call.Arguments[0].String()
		dataStr := call.Arguments[1].String()
		dataDir := filepath.Join(fi.ctx.pluginDir, "data")
		fullPath := filepath.Join(dataDir, relativePath)

		cleaned := filepath.Clean(fullPath)
		dataDirClean := filepath.Clean(dataDir)
		rel, err := filepath.Rel(dataDirClean, cleaned)
		if err != nil || strings.HasPrefix(rel, "..") {
			panic(fi.ctx.sandbox.Runtime().NewTypeError("file.writeData: path traversal detected"))
		}

		if err := os.MkdirAll(filepath.Dir(cleaned), 0755); err != nil {
			logger.Sugar.Warnw("[Plugin] file.writeData mkdir failed", "id", fi.ctx.pluginID, "error", err)
			return fi.ctx.sandbox.Runtime().ToValue(false)
		}
		if err := os.WriteFile(cleaned, []byte(dataStr), 0644); err != nil {
			logger.Sugar.Warnw("[Plugin] file.writeData failed", "id", fi.ctx.pluginID, "error", err)
			return fi.ctx.sandbox.Runtime().ToValue(false)
		}
		return fi.ctx.sandbox.Runtime().ToValue(true)
	}
}

func (fi *FileInjector) createListData() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		subDir := ""
		if len(call.Arguments) >= 1 {
			subDir = call.Arguments[0].String()
		}
		dataDir := filepath.Join(fi.ctx.pluginDir, "data", subDir)
		cleaned := filepath.Clean(dataDir)
		dataDirRoot := filepath.Clean(filepath.Join(fi.ctx.pluginDir, "data"))
		rel, err := filepath.Rel(dataDirRoot, cleaned)
		if err != nil || strings.HasPrefix(rel, "..") {
			panic(fi.ctx.sandbox.Runtime().NewTypeError("file.listData: path traversal detected"))
		}

		entries, err := os.ReadDir(cleaned)
		if err != nil {
			if os.IsNotExist(err) {
				return fi.ctx.sandbox.Runtime().ToValue([]interface{}{})
			}
			logger.Sugar.Warnw("[Plugin] file.listData failed", "id", fi.ctx.pluginID, "error", err)
			return fi.ctx.sandbox.Runtime().ToValue([]interface{}{})
		}

		var files []map[string]interface{}
		for _, entry := range entries {
			info, err := entry.Info()
			if err != nil {
				continue
			}
			files = append(files, map[string]interface{}{
				"name":  entry.Name(),
				"isDir": entry.IsDir(),
				"size":  info.Size(),
				"time":  info.ModTime().UnixMilli(),
			})
		}
		return fi.ctx.sandbox.Runtime().ToValue(files)
	}
}

func (fi *FileInjector) createGetDataPath() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		dataDir := filepath.Join(fi.ctx.pluginDir, "data")
		os.MkdirAll(dataDir, 0755)
		return fi.ctx.sandbox.Runtime().ToValue(dataDir)
	}
}
