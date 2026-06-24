package config

import (
	"os"
	"path/filepath"
	"testing"
)

const testConfigYAML = `logger:
  console_level: info
  file_level: debug
  file_path: ./log/app.log

bot:
  qq: "123456"
  nickname: "瞳瞳"
  aliases:
    - "小瞳"
    - "瞳酱"
  max_reply_len: 500
  max_concurrent_messages: 10

trigger:
  auto_reply: true
  require_mention: false
  base_frequency: 0.3
  at_reply: true
  mention_reply: true

decision:
  max_rounds: 3

emoji:
  steal_emoji: true
  auto_tag: true
  max_reg_num: 100
  check_interval: 1800
  do_replace: false
  content_filtration: false

content_filter:
  ban_words:
    - "广告"
    - "垃圾"
  ban_regex:
    - "\\d{11}"

hook:
  mode: "blacklist"
  list: []
  rate_limit:
    enabled: false
    max_per_min: 0
    max_per_hour: 0

bus:
  buffer_size: 100

goja:
  script_path: ./plugins/

memory:
  enabled: true
  max_fragments: 10000
  fragment_ttl_days: 90
  top_k: 5
  search_mode: "hybrid"
  embedding_dim: 1024
  vector_persist_sec: 300
  writeback:
    enabled: true
    message_threshold: 50
    context_length: 30
    person_fact_enabled: true
    chat_summary_enabled: true
  weight_decay:
    enabled: true
    decay_rate: 0.02
    access_boost: 0.02
    boost_cap: 0.2
  global_memory:
    enabled: true
    top_k: 3
  graph_memory:
    enabled: true

web_search:
  enabled: true
  default_depth: webpage
  shallow:
    max_results: 10
  deep:
    max_results: 30
    fetch_content: true
    fetch_timeout: 8
  research:
    enabled: false
    max_rounds: 3
    max_results: 70
    max_sub_queries: 6

vision:
  enabled: true

voice:
  enabled: true

personality:
  base_identity: |
    你是瞳瞳，一个活泼可爱的18岁女大学生。
  default_style: |
    语气自然、像朋友聊天
  extra_styles:
    - "用1-2个字极简回复"
    - "带点吐槽感"
  style_probability: 0.3
  persona_angles:
    - "是刷B站的冲浪达人"
    - "是技术宅少女"
  angle_probability: 0.3

behavior_rules: |
  决策模型核心规则测试

vision_rules: |
  视觉分析规则测试
`

// resetConfig 重置全局配置状态
func resetConfig() {
	AppConfig = Config{}
	configFilePath = ""
}

// ── Init 测试 ──

func TestInit_ValidConfig(t *testing.T) {
	resetConfig()
	defer resetConfig()

	tmpDir := t.TempDir()
	configPath := filepath.Join(tmpDir, "config.yaml")
	if err := os.WriteFile(configPath, []byte(testConfigYAML), 0644); err != nil {
		t.Fatalf("写入测试配置文件失败: %v", err)
	}

	// 切换到临时目录，因为 Init 会尝试加载 prompts 相对路径
	origWd, _ := os.Getwd()
	os.Chdir(tmpDir)
	defer os.Chdir(origWd)

	err := Init(configPath)
	if err != nil {
		t.Fatalf("Init 失败: %v", err)
	}

	// 验证关键字段
	if AppConfig.Bot.Nickname != "瞳瞳" {
		t.Errorf("Nickname = %q, 期望 瞳瞳", AppConfig.Bot.Nickname)
	}
	if AppConfig.Bot.QQ != "123456" {
		t.Errorf("QQ = %q, 期望 123456", AppConfig.Bot.QQ)
	}
	if len(AppConfig.Bot.Aliases) != 2 {
		t.Errorf("Aliases 应有 2 个，实际 %d 个", len(AppConfig.Bot.Aliases))
	}
	if AppConfig.Bus.BufferSize != 100 {
		t.Errorf("BufferSize = %d, 期望 100", AppConfig.Bus.BufferSize)
	}
	if AppConfig.Trigger.AutoReply != true {
		t.Error("AutoReply 应为 true")
	}
	if AppConfig.Memory.Enabled != true {
		t.Error("Memory.Enabled 应为 true")
	}
	if len(AppConfig.ContentFilter.BanWords) != 2 {
		t.Errorf("BanWords 应有 2 个，实际 %d 个", len(AppConfig.ContentFilter.BanWords))
	}
}

func TestInit_AutoCreateDefaultConfig(t *testing.T) {
	resetConfig()
	defer resetConfig()

	tmpDir := t.TempDir()
	configPath := filepath.Join(tmpDir, "configs", "config.yaml")

	// 切换到临时目录
	origWd, _ := os.Getwd()
	os.Chdir(tmpDir)
	defer os.Chdir(origWd)

	// 配置文件不存在，应该自动创建
	err := Init(configPath)
	if err != nil {
		t.Fatalf("Init (自动创建) 失败: %v", err)
	}

	// 验证文件已创建
	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		t.Error("配置文件应该被自动创建")
	}

	// 验证默认值
	if AppConfig.Bot.Nickname != "Yara" {
		t.Errorf("默认 Nickname = %q, 期望 Yara", AppConfig.Bot.Nickname)
	}
}

func TestInit_EmptyPath(t *testing.T) {
	resetConfig()
	defer resetConfig()

	tmpDir := t.TempDir()
	// 需要先创建 configs/config_template.yaml 避免 Init 里的模板复制逻辑尝试读取不存在的文件
	configsDir := filepath.Join(tmpDir, "configs")
	os.MkdirAll(configsDir, 0755)

	// 创建 config-template.yaml 做模板（实际上 Init 会检查 config_template.yaml）
	templatePath := filepath.Join(configsDir, "config_template.yaml")
	os.WriteFile(templatePath, []byte(testConfigYAML), 0644)

	origWd, _ := os.Getwd()
	os.Chdir(tmpDir)
	defer os.Chdir(origWd)

	// 空路径应该使用默认值 ./configs/config.yaml
	err := Init("")
	if err != nil {
		t.Fatalf("Init(空路径) 失败: %v", err)
	}
}

func TestInit_OldPersonalityMigration(t *testing.T) {
	resetConfig()
	defer resetConfig()

	oldStyleConfig := `logger:
  console_level: info
  file_level: debug
  file_path: ./log/app.log
bot:
  qq: "123456"
  nickname: "瞳瞳"
  max_reply_len: 500
  max_concurrent_messages: 10
trigger:
  auto_reply: true
  require_mention: false
  at_reply: true
  mention_reply: true
decision:
  max_rounds: 3
emoji:
  steal_emoji: false
  auto_tag: false
  max_reg_num: 0
  check_interval: 0
  do_replace: false
  content_filtration: false
content_filter:
  ban_words: []
  ban_regex: []
hook:
  mode: "blacklist"
  list: []
  rate_limit:
    enabled: false
    max_per_min: 0
    max_per_hour: 0
bus:
  buffer_size: 100
goja:
  script_path: ./plugins/
memory:
  enabled: false
  max_fragments: 0
  fragment_ttl_days: 0
web_search:
  enabled: false
  default_depth: webpage
vision:
  enabled: false
voice:
  enabled: false
personality: "旧版纯文本人格描述"
`

	tmpDir := t.TempDir()
	configPath := filepath.Join(tmpDir, "config.yaml")
	os.WriteFile(configPath, []byte(oldStyleConfig), 0644)

	origWd, _ := os.Getwd()
	os.Chdir(tmpDir)
	defer os.Chdir(origWd)

	err := Init(configPath)
	if err != nil {
		t.Fatalf("Init (旧版人格迁移) 失败: %v", err)
	}

	// 旧版纯文本人格应该被迁移为结构化配置
	if AppConfig.Personality.BaseIdentity != "旧版纯文本人格描述" {
		t.Errorf("BaseIdentity = %q, 期望旧版纯文本人格描述", AppConfig.Personality.BaseIdentity)
	}
	if AppConfig.Personality.DefaultStyle != "语气自然、像朋友聊天" {
		t.Errorf("DefaultStyle = %q, 期望默认风格", AppConfig.Personality.DefaultStyle)
	}
}

// ── SelectReplyStyle 测试 ──

func TestSelectReplyStyle_DefaultOnly(t *testing.T) {
	resetConfig()
	defer resetConfig()

	AppConfig.Personality.DefaultStyle = "默认风格"
	AppConfig.Personality.ExtraStyles = []string{}
	AppConfig.Personality.StyleProb = 0.5

	// 没有备选风格时，始终返回默认
	for i := 0; i < 10; i++ {
		style := SelectReplyStyle()
		if style != "默认风格" {
			t.Errorf("没有备选风格时应返回默认，实际 %q", style)
		}
	}
}

func TestSelectReplyStyle_ZeroProbability(t *testing.T) {
	resetConfig()
	defer resetConfig()

	AppConfig.Personality.DefaultStyle = "默认风格"
	AppConfig.Personality.ExtraStyles = []string{"备选风格"}
	AppConfig.Personality.StyleProb = 0.0

	// 概率为 0 时，始终返回默认
	for i := 0; i < 10; i++ {
		style := SelectReplyStyle()
		if style != "默认风格" {
			t.Errorf("概率为0时应返回默认，实际 %q", style)
		}
	}
}

// ── SelectPersonaAngle 测试 ──

func TestSelectPersonaAngle_Empty(t *testing.T) {
	resetConfig()
	defer resetConfig()

	AppConfig.Personality.PersonaAngles = []string{}
	AppConfig.Personality.AngleProb = 0.5

	angle := SelectPersonaAngle()
	if angle != "" {
		t.Errorf("没有视角时应返回空字符串，实际 %q", angle)
	}
}

func TestSelectPersonaAngle_ZeroProbability(t *testing.T) {
	resetConfig()
	defer resetConfig()

	AppConfig.Personality.PersonaAngles = []string{"冲浪达人", "技术宅"}
	AppConfig.Personality.AngleProb = 0.0

	for i := 0; i < 10; i++ {
		angle := SelectPersonaAngle()
		if angle != "" {
			t.Errorf("概率为0时应返回空字符串，实际 %q", angle)
		}
	}
}

// ── GetLoggerLevel 测试 ──

func TestGetLoggerLevel(t *testing.T) {
	tests := []struct {
		level    string
		expected string
	}{
		{"debug", "debug"},
		{"info", "info"},
		{"warn", "warn"},
		{"error", "error"},
		{"invalid", "info"}, // 默认 info
	}

	for _, tt := range tests {
		resetConfig()
		AppConfig.Logger.ConsoleLevel = tt.level
		lvl := GetLoggerLevel()
		if lvl.String() != tt.expected {
			t.Errorf("GetLoggerLevel(%q) = %q, 期望 %q", tt.level, lvl.String(), tt.expected)
		}
	}
}

func TestGetFileLoggerLevel(t *testing.T) {
	tests := []struct {
		level    string
		expected string
	}{
		{"debug", "debug"},
		{"info", "info"},
		{"warn", "warn"},
		{"error", "error"},
		{"invalid", "debug"}, // 默认 debug
	}

	for _, tt := range tests {
		resetConfig()
		AppConfig.Logger.FileLevel = tt.level
		lvl := GetFileLoggerLevel()
		if lvl.String() != tt.expected {
			t.Errorf("GetFileLoggerLevel(%q) = %q, 期望 %q", tt.level, lvl.String(), tt.expected)
		}
	}
}

// ── RenderBaseIdentity 测试 ──

func TestRenderBaseIdentity(t *testing.T) {
	resetConfig()
	defer resetConfig()

	AppConfig.Bot.Nickname = "瞳瞳"
	AppConfig.Bot.QQ = "123456"
	AppConfig.Bot.Aliases = []string{"小瞳", "瞳宝"}
	AppConfig.Personality.BaseIdentity = "你是瞳瞳，一个18岁女大学生"

	result := RenderBaseIdentity()
	if result == "" {
		t.Error("RenderBaseIdentity 不应返回空字符串")
	}
	if !contains(result, "瞳瞳") {
		t.Error("结果应包含昵称")
	}
	if !contains(result, "18岁女大学生") {
		t.Error("结果应包含身份描述")
	}
	// 基础身份不应包含风格指令
	if contains(result, "语气自然") {
		t.Error("RenderBaseIdentity 不应包含回复风格")
	}
	if contains(result, "日常准则") {
		t.Error("RenderBaseIdentity 不应包含行为准则")
	}
}

// ── WatchConfig 测试 ──

func TestWatchConfig_NoConfigPath(t *testing.T) {
	resetConfig()
	defer resetConfig()

	// configFilePath 为空时，应该跳过
	WatchConfig(nil)
	// 不应 panic，这里只验证基本行为
}

// ── 辅助函数 ──

func contains(s, substr string) bool {
	return len(s) > 0 && len(substr) > 0 && len(s) >= len(substr) &&
		(s == substr || hasSubstr(s, substr))
}

func hasSubstr(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
