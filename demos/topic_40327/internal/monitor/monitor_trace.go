package monitor

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"
)

// ── 处理追踪 ──

// ProcessingTrace 记录一轮消息处理的完整阶段时间线
type ProcessingTrace struct {
	MsgID      string       `json:"msg_id"`
	Category   string       `json:"category"`
	Time       string       `json:"time"`
	SessID     string       `json:"sess_id"`
	StageState string       `json:"stage_state"` // "processing" / "done"
	Stages     []StageEntry `json:"stages"`
}

// StageEntry 单个阶段记录
type StageEntry struct {
	Stage      string `json:"stage"`
	Detail     string `json:"detail"`
	AgentState string `json:"agent_state"`
	Timestamp  int64  `json:"timestamp"`
}

// ProcessingTraceInfo 用于 API 返回的轻量版追踪信息
type ProcessingTraceInfo struct {
	MsgID      string       `json:"msg_id"`
	Category   string       `json:"category"`
	Time       string       `json:"time"`
	SessID     string       `json:"sess_id"`
	StageState string       `json:"stage_state"`
	Stages     []StageEntry `json:"stages"`
}

// SaveProcessingTrace 保存一轮处理的阶段时间线，用于持久化查看历史处理详情
func SaveProcessingTrace(trace ProcessingTrace) error {
	chatDir := filepath.Join(previewBaseDir, previewSubDir, safeName(trace.Category), safeName(trace.SessID))
	if err := os.MkdirAll(chatDir, 0755); err != nil {
		return fmt.Errorf("创建追踪目录失败: %w", err)
	}
	stem := fmt.Sprintf("trace_%d", time.Now().UnixMilli())
	path := filepath.Join(chatDir, stem+".json")
	data, err := json.MarshalIndent(trace, "", "  ")
	if err != nil {
		return fmt.Errorf("序列化追踪数据失败: %w", err)
	}
	if err := os.WriteFile(path, data, 0644); err != nil {
		return fmt.Errorf("写入追踪文件失败: %w", err)
	}
	return nil
}
