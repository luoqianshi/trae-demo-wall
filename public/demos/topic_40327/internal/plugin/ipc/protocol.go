// Package ipc 定义插件进程隔离的 IPC 协议
// 主进程与插件宿主进程通过 stdin/stdout 交换 JSON 行消息
package ipc

import "encoding/json"

// MessageType 消息类型
type MessageType string

const (
	TypeRequest  MessageType = "request"
	TypeResponse MessageType = "response"
	TypeEvent    MessageType = "event"
)

// Request 主进程 → 宿主进程的请求
type Request struct {
	ID     uint64          `json:"id"`
	Method string          `json:"method"`
	Params json.RawMessage `json:"params,omitempty"`
}

// Response 宿主进程 → 主进程的响应
type Response struct {
	ID     uint64          `json:"id"`
	Result json.RawMessage `json:"result,omitempty"`
	Error  string          `json:"error,omitempty"`
}

// Event 宿主进程 → 主进程的主动事件通知
type Event struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload,omitempty"`
}

// ── 预定义方法 ──

const (
	MethodLoad          = "load"            // 加载插件
	MethodUnload        = "unload"          // 卸载插件
	MethodExecuteCmd    = "execute_command" // 执行命令
	MethodExecuteTool   = "execute_tool"    // 执行工具
	MethodExecuteAction = "execute_action"  // 执行动作
	MethodPing          = "ping"            // 心跳检测
	MethodShutdown      = "shutdown"        // 关闭宿主
)

// ── Load 参数 ──

type LoadParams struct {
	PluginDir string `json:"plugin_dir"`
}

type LoadResult struct {
	PluginID   string `json:"plugin_id"`
	PluginName string `json:"plugin_name"`
	Version    string `json:"version"`
}

// ── ExecuteCommand 参数 ──

type ExecuteCmdParams struct {
	CmdName  string            `json:"cmd_name"`
	Match    map[string]string `json:"match,omitempty"`
	Platform string            `json:"platform,omitempty"`
	GroupID  string            `json:"group_id,omitempty"`
}

type ExecuteCmdResult struct {
	Output string `json:"output"`
}

// ── ExecuteTool 参数 ──

type ExecuteToolParams struct {
	ToolName string                 `json:"tool_name"`
	Params   map[string]interface{} `json:"params"`
}

type ExecuteToolResult struct {
	Data json.RawMessage `json:"data"`
}

// ── ExecuteAction 参数 ──

type ExecuteActionParams struct {
	ActionName string                 `json:"action_name"`
	Params     map[string]interface{} `json:"params"`
}

type ExecuteActionResult struct {
	Data json.RawMessage `json:"data"`
}

// ── Event 类型 ──

const (
	EventLog   = "log"
	EventError = "error"
	EventReady = "ready"
)

// ── 错误码 ──

const (
	ErrHostCrashed    = "host_crashed"
	ErrTimeout        = "timeout"
	ErrNotLoaded      = "not_loaded"
	ErrInvalidParams  = "invalid_params"
	ErrPluginNotFound = "plugin_not_found"
)
