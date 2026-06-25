package plugin

import (
	"fmt"
	"sync"
	"time"

	"github.com/dop251/goja"

	"YaraFlow/internal/logger"
)

// ─── AsyncTaskInjector ───

var (
	asyncTasks   = make(map[string]*asyncTaskContext)
	asyncTasksMu sync.RWMutex
)

type asyncTaskContext struct {
	taskID      string
	pluginID    string
	progressFn  goja.Callable
	completeFn  goja.Callable
	errorFn     goja.Callable
	hasProgress bool
	hasComplete bool
	hasError    bool
	sandbox     *Sandbox
}

type AsyncTaskInjector struct {
	ctx *InjectorContext
}

func NewAsyncTaskInjector(ctx *InjectorContext) *AsyncTaskInjector {
	return &AsyncTaskInjector{ctx: ctx}
}

func (ati *AsyncTaskInjector) APIName() string { return "async" }

func (ati *AsyncTaskInjector) Inject() error {
	if !ati.ctx.manifest.HasPermission("async_task.execute") {
		return nil
	}

	asyncAPI := map[string]interface{}{
		"run":            ati.createRun(),
		"reportProgress": ati.createReportProgress(),
	}

	ati.ctx.mergeIntoYara("async", asyncAPI)
	return nil
}

func (ati *AsyncTaskInjector) createRun() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		if len(call.Arguments) < 1 {
			panic(ati.ctx.sandbox.Runtime().NewTypeError("async.run(taskFn, options?) requires at least 1 argument"))
		}
		taskFn, ok := goja.AssertFunction(call.Arguments[0])
		if !ok {
			panic(ati.ctx.sandbox.Runtime().NewTypeError("async.run: first argument must be a function"))
		}

		timeoutMs := 300000
		var onProgressFn, onCompleteFn, onErrorFn goja.Callable
		hasProgress := false
		hasComplete := false
		hasError := false

		if len(call.Arguments) >= 2 {
			if opts, ok := call.Arguments[1].Export().(map[string]interface{}); ok {
				if t, exists := opts["timeout"]; exists {
					switch v := t.(type) {
					case int64:
						timeoutMs = int(v)
					case float64:
						timeoutMs = int(v)
					case int:
						timeoutMs = v
					}
				}
				if progressFn, exists := opts["onProgress"]; exists {
					if fn, ok := goja.AssertFunction(ati.ctx.sandbox.Runtime().ToValue(progressFn)); ok {
						onProgressFn = fn
						hasProgress = true
					}
				}
				if completeFn, exists := opts["onComplete"]; exists {
					if fn, ok := goja.AssertFunction(ati.ctx.sandbox.Runtime().ToValue(completeFn)); ok {
						onCompleteFn = fn
						hasComplete = true
					}
				}
				if errorFn, exists := opts["onError"]; exists {
					if fn, ok := goja.AssertFunction(ati.ctx.sandbox.Runtime().ToValue(errorFn)); ok {
						onErrorFn = fn
						hasError = true
					}
				}
			}
		}

		taskID := fmt.Sprintf("%s_async_%d", ati.ctx.pluginID, time.Now().UnixNano())

		taskCtx := &asyncTaskContext{
			taskID:      taskID,
			pluginID:    ati.ctx.pluginID,
			progressFn:  onProgressFn,
			completeFn:  onCompleteFn,
			errorFn:     onErrorFn,
			hasProgress: hasProgress,
			hasComplete: hasComplete,
			hasError:    hasError,
			sandbox:     ati.ctx.sandbox,
		}

		logger.Sugar.Infow("[Plugin] async task started", "id", ati.ctx.pluginID, "task_id", taskID, "timeout_ms", timeoutMs)

		registerAsyncTask(taskID, taskCtx)

		go func() {
			defer func() {
				if r := recover(); r != nil {
					logger.Sugar.Warnw("[Plugin] async task panic", "id", ati.ctx.pluginID, "task_id", taskID, "panic", r)
					taskCtx.notifyError(fmt.Sprintf("task panic: %v", r))
				}
				unregisterAsyncTask(taskID)
			}()

			done := make(chan struct{}, 1)
			go func() {
				defer func() {
					if r := recover(); r != nil {
						logger.Sugar.Warnw("[Plugin] async task inner panic", "id", ati.ctx.pluginID, "task_id", taskID, "panic", r)
					}
					done <- struct{}{}
				}()
				vm := ati.ctx.sandbox.Runtime()
				if vm == nil {
					taskCtx.notifyError("runtime is nil")
					return
				}
				result, err := taskFn(goja.Undefined())
				if err != nil {
					taskCtx.notifyError(fmt.Sprintf("task error: %v", err))
					return
				}
				taskCtx.notifyComplete(result)
			}()

			select {
			case <-done:
			case <-time.After(time.Duration(timeoutMs) * time.Millisecond):
				taskCtx.notifyError(fmt.Sprintf("task timeout after %dms", timeoutMs))
				logger.Sugar.Warnw("[Plugin] async task timeout", "id", ati.ctx.pluginID, "task_id", taskID, "timeout_ms", timeoutMs)
			}
		}()

		return ati.ctx.sandbox.Runtime().ToValue(map[string]interface{}{
			"taskId":  taskID,
			"status":  "started",
			"timeout": timeoutMs,
		})
	}
}

func (ati *AsyncTaskInjector) createReportProgress() func(goja.FunctionCall) goja.Value {
	return func(call goja.FunctionCall) goja.Value {
		if len(call.Arguments) < 2 {
			panic(ati.ctx.sandbox.Runtime().NewTypeError("async.reportProgress(taskId, data) requires 2 arguments"))
		}
		taskID := call.Arguments[0].String()
		progressData := call.Arguments[1].Export()
		if taskID != "" {
			if task := getAsyncTask(taskID); task != nil {
				task.notifyProgress(progressData)
			}
		}
		return goja.Undefined()
	}
}

// ─── asyncTaskContext 方法 ───

func (ctx *asyncTaskContext) notifyProgress(data interface{}) {
	if !ctx.hasProgress || ctx.sandbox == nil {
		return
	}
	vm := ctx.sandbox.Runtime()
	if vm == nil {
		return
	}
	defer func() {
		if r := recover(); r != nil {
			logger.Sugar.Warnw("[Plugin] progress callback panic", "id", ctx.pluginID, "panic", r)
		}
	}()
	ctx.progressFn(goja.Undefined(), vm.ToValue(data))
}

func (ctx *asyncTaskContext) notifyComplete(result goja.Value) {
	if ctx.sandbox == nil {
		return
	}
	vm := ctx.sandbox.Runtime()
	if vm == nil {
		return
	}
	defer func() {
		if r := recover(); r != nil {
			logger.Sugar.Warnw("[Plugin] complete callback panic", "id", ctx.pluginID, "panic", r)
		}
	}()
	if ctx.hasComplete {
		ctx.completeFn(goja.Undefined(), result)
	}
	exported := result.Export()
	logger.Sugar.Infow("[Plugin] async task completed", "id", ctx.pluginID, "task_id", ctx.taskID, "result", exported)

	if api, ok := exported.(map[string]interface{}); ok {
		if msg, exists := api["message"]; exists {
			logger.Sugar.Infow("[Plugin] async task result message", "id", ctx.pluginID, "task_id", ctx.taskID, "message", msg)
		}
	}
}

func (ctx *asyncTaskContext) notifyError(errMsg string) {
	if ctx.sandbox == nil {
		return
	}
	vm := ctx.sandbox.Runtime()
	if vm == nil {
		return
	}
	defer func() {
		if r := recover(); r != nil {
			logger.Sugar.Warnw("[Plugin] error callback panic", "id", ctx.pluginID, "panic", r)
		}
	}()
	if ctx.hasError {
		ctx.errorFn(goja.Undefined(), vm.ToValue(errMsg))
	}
	logger.Sugar.Warnw("[Plugin] async task error", "id", ctx.pluginID, "task_id", ctx.taskID, "error", errMsg)
}

func registerAsyncTask(taskID string, ctx *asyncTaskContext) {
	asyncTasksMu.Lock()
	defer asyncTasksMu.Unlock()
	asyncTasks[taskID] = ctx
}

func unregisterAsyncTask(taskID string) {
	asyncTasksMu.Lock()
	defer asyncTasksMu.Unlock()
	delete(asyncTasks, taskID)
}

func getAsyncTask(taskID string) *asyncTaskContext {
	asyncTasksMu.RLock()
	defer asyncTasksMu.RUnlock()
	return asyncTasks[taskID]
}
