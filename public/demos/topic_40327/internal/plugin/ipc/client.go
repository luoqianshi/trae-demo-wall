// Package ipc IPC 客户端：主进程通过 stdin/stdout 与插件宿主子进程通信
package ipc

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"os/exec"
	"sync"
	"sync/atomic"
	"time"
)

// Client 管理一个插件宿主子进程
type Client struct {
	mu        sync.Mutex
	cmd       *exec.Cmd
	stdin     io.WriteCloser
	stdout    io.ReadCloser
	reader    *bufio.Reader
	nextID    atomic.Uint64
	responses map[uint64]chan *Response
	events    chan *Event
	done      chan struct{}
}

// NewClient 创建新的 IPC 客户端，启动插件宿主子进程
func NewClient(hostBinary string, pluginDir string) (*Client, error) {
	cmd := exec.Command(hostBinary)

	stdin, err := cmd.StdinPipe()
	if err != nil {
		return nil, fmt.Errorf("创建 stdin pipe 失败: %w", err)
	}

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return nil, fmt.Errorf("创建 stdout pipe 失败: %w", err)
	}

	// stderr 继承主进程的 stderr，用于宿主日志
	cmd.Stderr = nil // 使用默认

	if err := cmd.Start(); err != nil {
		return nil, fmt.Errorf("启动插件宿主失败: %w", err)
	}

	c := &Client{
		cmd:       cmd,
		stdin:     stdin,
		stdout:    stdout,
		reader:    bufio.NewReader(stdout),
		responses: make(map[uint64]chan *Response),
		events:    make(chan *Event, 32),
		done:      make(chan struct{}),
	}

	// 启动响应读取协程
	go c.readLoop()

	// 等待宿主就绪事件
	select {
	case evt := <-c.events:
		if evt.Type != EventReady {
			return nil, fmt.Errorf("宿主未就绪，收到事件: %s", evt.Type)
		}
	case <-time.After(5 * time.Second):
		c.Close()
		return nil, fmt.Errorf("等待宿主就绪超时")
	}

	// 发送加载请求
	loadParams, _ := json.Marshal(LoadParams{PluginDir: pluginDir})
	_, err = c.Call(MethodLoad, loadParams, 10*time.Second)
	if err != nil {
		c.Close()
		return nil, fmt.Errorf("加载插件失败: %w", err)
	}

	return c, nil
}

// Call 发送请求并等待响应
func (c *Client) Call(method string, params json.RawMessage, timeout time.Duration) (*Response, error) {
	id := c.nextID.Add(1)

	req := Request{
		ID:     id,
		Method: method,
		Params: params,
	}

	data, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("序列化请求失败: %w", err)
	}

	ch := make(chan *Response, 1)

	c.mu.Lock()
	c.responses[id] = ch
	c.mu.Unlock()

	defer func() {
		c.mu.Lock()
		delete(c.responses, id)
		c.mu.Unlock()
	}()

	// 发送请求
	c.mu.Lock()
	_, err = fmt.Fprintf(c.stdin, "%s\n", data)
	c.mu.Unlock()
	if err != nil {
		return nil, fmt.Errorf("发送请求失败: %w", err)
	}

	// 等待响应
	select {
	case resp := <-ch:
		return resp, nil
	case <-time.After(timeout):
		return nil, fmt.Errorf("请求超时: %s (id=%d)", method, id)
	case <-c.done:
		return nil, fmt.Errorf("宿主进程已退出")
	}
}

// readLoop 持续读取 stdout 中的响应和事件
func (c *Client) readLoop() {
	defer close(c.done)

	for {
		line, err := c.reader.ReadBytes('\n')
		if err != nil {
			return
		}

		// 先尝试解析为 Response
		var resp Response
		if err := json.Unmarshal(line, &resp); err == nil && resp.ID != 0 {
			c.mu.Lock()
			ch, ok := c.responses[resp.ID]
			c.mu.Unlock()
			if ok {
				ch <- &resp
			}
			continue
		}

		// 尝试解析为 Event
		var evt Event
		if err := json.Unmarshal(line, &evt); err == nil && evt.Type != "" {
			select {
			case c.events <- &evt:
			default:
			}
		}
	}
}

// Events 返回事件通道（用于接收宿主主动推送的事件）
func (c *Client) Events() <-chan *Event {
	return c.events
}

// IsAlive 检查宿主进程是否仍在运行
func (c *Client) IsAlive() bool {
	select {
	case <-c.done:
		return false
	default:
		return true
	}
}

// Close 关闭客户端，终止宿主进程
func (c *Client) Close() error {
	// 尝试优雅关闭
	c.Call(MethodShutdown, json.RawMessage("null"), 3*time.Second)

	c.stdin.Close()
	c.stdout.Close()

	if c.cmd.Process != nil {
		c.cmd.Process.Kill()
	}

	return c.cmd.Wait()
}

// ExecuteCommand 在隔离进程中执行插件命令
func (c *Client) ExecuteCommand(cmdName string, match map[string]string, platform string, groupID string) (string, error) {
	params, _ := json.Marshal(ExecuteCmdParams{CmdName: cmdName, Match: match, Platform: platform, GroupID: groupID})
	resp, err := c.Call(MethodExecuteCmd, params, 30*time.Second)
	if err != nil {
		return "", err
	}
	if resp.Error != "" {
		return "", fmt.Errorf("%s", resp.Error)
	}

	var result ExecuteCmdResult
	json.Unmarshal(resp.Result, &result)
	return result.Output, nil
}

// ExecuteTool 在隔离进程中执行工具
func (c *Client) ExecuteTool(toolName string, params map[string]interface{}) (interface{}, error) {
	raw, _ := json.Marshal(ExecuteToolParams{ToolName: toolName, Params: params})
	resp, err := c.Call(MethodExecuteTool, raw, 30*time.Second)
	if err != nil {
		return nil, err
	}
	if resp.Error != "" {
		return nil, fmt.Errorf("%s", resp.Error)
	}

	var result ExecuteToolResult
	json.Unmarshal(resp.Result, &result)
	var data interface{}
	json.Unmarshal(result.Data, &data)
	return data, nil
}

// ExecuteAction 在隔离进程中执行动作
func (c *Client) ExecuteAction(actionName string, params map[string]interface{}) (interface{}, error) {
	raw, _ := json.Marshal(ExecuteActionParams{ActionName: actionName, Params: params})
	resp, err := c.Call(MethodExecuteAction, raw, 30*time.Second)
	if err != nil {
		return nil, err
	}
	if resp.Error != "" {
		return nil, fmt.Errorf("%s", resp.Error)
	}

	var result ExecuteActionResult
	json.Unmarshal(resp.Result, &result)
	var data interface{}
	json.Unmarshal(result.Data, &data)
	return data, nil
}
