package plugin

import (
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/dop251/goja"

	"YaraFlow/internal/logger"
)

type GojaRuntime struct {
	sandbox        *Sandbox
	manifest       *PluginManifest
	pluginDir      string
	api            *APIRegistry
	program        *goja.Program
	loaded         bool
	configReloadFn goja.Callable
}

func NewGojaRuntime(manifest *PluginManifest, pluginDir string, api *APIRegistry) *GojaRuntime {
	timeout := 30 * time.Second
	sandbox := NewSandbox(timeout)

	api.SetSandbox(sandbox)

	return &GojaRuntime{
		sandbox:   sandbox,
		manifest:  manifest,
		pluginDir: pluginDir,
		api:       api,
	}
}

func (r *GojaRuntime) Load() error {
	if r.loaded {
		return fmt.Errorf("plugin %s is already loaded", r.manifest.ID)
	}

	src, err := r.loadMainScript()
	if err != nil {
		return fmt.Errorf("failed to load main script: %w", err)
	}

	program, err := r.sandbox.Compile(r.manifest.Main, src)
	if err != nil {
		return fmt.Errorf("failed to compile script: %w", err)
	}
	r.program = program

	r.sandbox.Set("__pluginId", r.manifest.ID)
	r.sandbox.Set("__pluginDir", r.pluginDir)

	if err := r.executeBootstrap(); err != nil {
		return fmt.Errorf("failed to bootstrap plugin: %w", err)
	}

	r.loaded = true
	logger.Sugar.Infow("[Plugin] loaded successfully", "id", r.manifest.ID)
	return nil
}

func (r *GojaRuntime) loadMainScript() (string, error) {
	mainPath := filepath.Join(r.pluginDir, r.manifest.Main)
	data, err := os.ReadFile(mainPath)
	if err != nil {
		return "", fmt.Errorf("failed to read %s: %w", mainPath, err)
	}
	return string(data), nil
}

func (r *GojaRuntime) executeBootstrap() error {
	if _, err := r.sandbox.RunProgram(r.program); err != nil {
		return err
	}

	r.captureLifecycleFns()

	r.injectPluginLogger()

	initFn := r.sandbox.Get("onLoad")
	if initFn != nil && !goja.IsUndefined(initFn) {
		if callable, ok := goja.AssertFunction(initFn); ok {
			_, err := callable(goja.Undefined())
			if err != nil {
				logger.Sugar.Warnw("[Plugin] onLoad failed", "id", r.manifest.ID, "error", err)
			}
		}
	}

	return nil
}

func (r *GojaRuntime) captureLifecycleFns() {
	if fn := r.sandbox.Get("onConfigUpdate"); fn != nil && !goja.IsUndefined(fn) {
		if callable, ok := goja.AssertFunction(fn); ok {
			r.configReloadFn = callable
		}
	}
}

func (r *GojaRuntime) injectPluginLogger() {
	pluginLogger := map[string]interface{}{
		"info": func(call goja.FunctionCall) goja.Value {
			args := make([]interface{}, len(call.Arguments))
			for i, arg := range call.Arguments {
				args[i] = arg.Export()
			}
			logger.Sugar.Infow("[Plugin] log", "id", r.manifest.ID, "args", args)
			return goja.Undefined()
		},
		"warn": func(call goja.FunctionCall) goja.Value {
			args := make([]interface{}, len(call.Arguments))
			for i, arg := range call.Arguments {
				args[i] = arg.Export()
			}
			logger.Sugar.Warnw("[Plugin] log", "id", r.manifest.ID, "args", args)
			return goja.Undefined()
		},
		"error": func(call goja.FunctionCall) goja.Value {
			args := make([]interface{}, len(call.Arguments))
			for i, arg := range call.Arguments {
				args[i] = arg.Export()
			}
			logger.Sugar.Warnw("[Plugin] ERROR", "id", r.manifest.ID, "args", args)
			return goja.Undefined()
		},
		"debug": func(call goja.FunctionCall) goja.Value {
			args := make([]interface{}, len(call.Arguments))
			for i, arg := range call.Arguments {
				args[i] = arg.Export()
			}
			logger.Sugar.Infow("[Plugin] DEBUG", "id", r.manifest.ID, "args", args)
			return goja.Undefined()
		},
	}
	r.sandbox.Set("__logger", pluginLogger)
}

func (r *GojaRuntime) NotifyConfigReload(scope string, configData map[string]interface{}, version string) {
	if r.configReloadFn == nil {
		return
	}

	vm := r.sandbox.Runtime()
	if vm == nil {
		return
	}

	jsScope := vm.ToValue(scope)
	jsConfig := vm.ToValue(configData)
	jsVersion := vm.ToValue(version)

	_, err := r.configReloadFn(goja.Undefined(), jsScope, jsConfig, jsVersion)
	if err != nil {
		logger.Sugar.Warnw("[Plugin] onConfigUpdate failed", "id", r.manifest.ID, "error", err)
	}
}

func (r *GojaRuntime) Unload() error {
	if !r.loaded {
		return nil
	}

	unloadFn := r.sandbox.Get("onUnload")
	if unloadFn != nil && !goja.IsUndefined(unloadFn) {
		if callable, ok := goja.AssertFunction(unloadFn); ok {
			_, err := callable(goja.Undefined())
			if err != nil {
				logger.Sugar.Warnw("[Plugin] onUnload failed", "id", r.manifest.ID, "error", err)
			}
		}
	}

	r.api.Cleanup()

	r.sandbox.Interrupt()
	r.loaded = false
	r.program = nil

	logger.Sugar.Infow("[Plugin] unloaded", "id", r.manifest.ID)
	return nil
}

func (r *GojaRuntime) Reload() error {
	if err := r.Unload(); err != nil {
		return err
	}
	return r.Load()
}

func (r *GojaRuntime) CallFunction(name string, args ...interface{}) (interface{}, error) {
	if !r.loaded {
		return nil, fmt.Errorf("plugin %s is not loaded", r.manifest.ID)
	}

	fn := r.sandbox.Get(name)
	if fn == nil || goja.IsUndefined(fn) {
		return nil, fmt.Errorf("function %s not found in plugin %s", name, r.manifest.ID)
	}

	callable, ok := goja.AssertFunction(fn)
	if !ok {
		return nil, fmt.Errorf("%s is not a function in plugin %s", name, r.manifest.ID)
	}

	jsArgs := make([]goja.Value, len(args))
	for i, arg := range args {
		jsArgs[i] = r.sandbox.Runtime().ToValue(arg)
	}

	result, err := callable(goja.Undefined(), jsArgs...)
	if err != nil {
		return nil, fmt.Errorf("plugin %s function %s error: %w", r.manifest.ID, name, err)
	}

	return result.Export(), nil
}

func (r *GojaRuntime) IsLoaded() bool {
	return r.loaded
}

func (r *GojaRuntime) Manifest() *PluginManifest {
	return r.manifest
}

func (r *GojaRuntime) ID() string {
	return r.manifest.ID
}

func (r *GojaRuntime) API() *APIRegistry {
	return r.api
}

func (r *GojaRuntime) Sandbox() *Sandbox {
	return r.sandbox
}

func (r *GojaRuntime) ExecuteTool(toolName string, params map[string]interface{}) (result interface{}, err error) {
	defer func() {
		if rec := recover(); rec != nil {
			logger.Sugar.Warnw("[Plugin] tool panic", "id", r.manifest.ID, "tool", toolName, "panic", rec)
			result = nil
			err = fmt.Errorf("tool %s panic: %v", toolName, rec)
		}
	}()

	if !r.loaded {
		return nil, fmt.Errorf("plugin %s is not loaded", r.manifest.ID)
	}

	handler, ok := r.api.GetToolHandler(toolName)
	if !ok {
		return nil, fmt.Errorf("tool handler not found: %s", toolName)
	}

	if r.sandbox == nil {
		return nil, fmt.Errorf("sandbox is nil for plugin %s", r.manifest.ID)
	}

	vm := r.sandbox.Runtime()
	if vm == nil {
		return nil, fmt.Errorf("runtime is nil for plugin %s", r.manifest.ID)
	}

	jsParams := vm.ToValue(params)
	execResult, execErr := handler(goja.Undefined(), jsParams)
	if execErr != nil {
		return nil, fmt.Errorf("plugin %s tool %s error: %w", r.manifest.ID, toolName, execErr)
	}

	return execResult.Export(), nil
}

func (r *GojaRuntime) ExecuteAction(actionName string, params map[string]interface{}) (result interface{}, err error) {
	defer func() {
		if rec := recover(); rec != nil {
			logger.Sugar.Warnw("[Plugin] action panic", "id", r.manifest.ID, "action", actionName, "panic", rec)
			result = nil
			err = fmt.Errorf("action %s panic: %v", actionName, rec)
		}
	}()

	if !r.loaded {
		return nil, fmt.Errorf("plugin %s is not loaded", r.manifest.ID)
	}

	handler, ok := r.api.GetActionHandler(actionName)
	if !ok {
		return nil, fmt.Errorf("action handler not found: %s", actionName)
	}

	if r.sandbox == nil {
		return nil, fmt.Errorf("sandbox is nil for plugin %s", r.manifest.ID)
	}

	vm := r.sandbox.Runtime()
	if vm == nil {
		return nil, fmt.Errorf("runtime is nil for plugin %s", r.manifest.ID)
	}

	jsParams := vm.ToValue(params)
	execResult, execErr := handler(goja.Undefined(), jsParams)
	if execErr != nil {
		return nil, fmt.Errorf("plugin %s action %s error: %w", r.manifest.ID, actionName, execErr)
	}

	return execResult.Export(), nil
}

func (r *GojaRuntime) ExecuteCommand(cmdName string, match map[string]string, platform string, groupID string) (cmdResult string, err error) {
	defer func() {
		if rec := recover(); rec != nil {
			logger.Sugar.Warnw("[Plugin] command panic", "id", r.manifest.ID, "cmd", cmdName, "panic", rec)
			cmdResult = ""
			err = fmt.Errorf("command %s panic: %v", cmdName, rec)
		}
	}()

	if !r.loaded {
		return "", fmt.Errorf("plugin %s is not loaded", r.manifest.ID)
	}

	id := r.manifest.ID + "." + cmdName
	handler, ok := r.api.GetCommandHandler(id)
	if !ok {
		return "", fmt.Errorf("command handler not found: %s", cmdName)
	}

	if r.sandbox == nil {
		return "", fmt.Errorf("sandbox is nil for plugin %s", r.manifest.ID)
	}

	vm := r.sandbox.Runtime()
	if vm == nil {
		return "", fmt.Errorf("runtime is nil for plugin %s", r.manifest.ID)
	}

	jsMatch := vm.ToValue(match)
	jsContext := vm.ToValue(map[string]interface{}{
		"platform": platform,
		"groupId":  groupID,
	})
	execResult, execErr := handler(goja.Undefined(), jsMatch, jsContext)
	if execErr != nil {
		return "", fmt.Errorf("plugin %s command %s error: %w", r.manifest.ID, cmdName, execErr)
	}

	return execResult.String(), nil
}
