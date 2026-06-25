package config

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/mitchellh/mapstructure"
	"github.com/spf13/viper"
	"gopkg.in/yaml.v3"
)

// mergeMissingConfig 用模板配置补全用户配置文件中缺失的顶层 section 和段内字段
// 向后兼容：不修改用户已有配置，只追加模板中存在但配置文件中缺失的内容
func mergeMissingConfig(configPath, templatePath string) error {
	templateData, err := os.ReadFile(templatePath)
	if err != nil {
		return fmt.Errorf("读取模板文件失败: %w", err)
	}

	var templateMap map[string]interface{}
	if err := yaml.Unmarshal(templateData, &templateMap); err != nil {
		return fmt.Errorf("解析模板文件失败: %w", err)
	}

	// 1) 找出完全缺失的顶层 section
	var missingSections []string
	for key := range templateMap {
		if !viper.IsSet(key) {
			missingSections = append(missingSections, key)
		}
	}

	// 2) 找出已有 section 中缺失的字段
	//    missingFields[sectionName] = list of missing field entries as YAML strings
	missingFields := make(map[string][]string)
	for key, tmplVal := range templateMap {
		if viper.IsSet(key) {
			// 段已存在，检查其子字段
			tmplSub, ok := tmplVal.(map[string]interface{})
			if !ok {
				continue // 非 map 类型（如 behavior_rules 字符串），跳过
			}
			for subKey := range tmplSub {
				fullPath := key + "." + subKey
				if !viper.IsSet(fullPath) {
					// 构建 YAML 格式的字段条目
					entry := map[string]interface{}{subKey: tmplSub[subKey]}
					entryYAML, err := yaml.Marshal(entry)
					if err != nil {
						fmt.Printf("  ⚠ 序列化缺失字段 %s 失败: %v\n", fullPath, err)
						continue
					}
					// 每行缩进2空格（适配段内字段）
					lines := strings.Split(strings.TrimRight(string(entryYAML), "\n"), "\n")
					for _, l := range lines {
						missingFields[key] = append(missingFields[key], "  "+l)
					}
				}
			}
		}
	}

	// 如果都没有缺失，直接返回
	if len(missingSections) == 0 && len(missingFields) == 0 {
		return nil
	}

	// 3) 写入缺失内容
	// 先追加缺失的顶层 section（直接追加到文件末尾）
	configFile, err := os.OpenFile(configPath, os.O_APPEND|os.O_WRONLY, 0644)
	if err != nil {
		return fmt.Errorf("打开配置文件追加: %w", err)
	}
	defer configFile.Close()

	for _, key := range missingSections {
		section := map[string]interface{}{key: templateMap[key]}
		sectionYAML, err := yaml.Marshal(section)
		if err != nil {
			fmt.Printf("  ⚠ 序列化缺失配置段 %s 失败: %v\n", key, err)
			continue
		}
		configFile.WriteString("\n")
		configFile.Write(sectionYAML)
		fmt.Printf("  ✓ 已自动补充缺失配置段: %s\n", key)
	}

	// 段内缺失字段：不自动插入配置文件（避免 YAML 格式损坏）
	// 缺失的字段由 Viper 默认零值 + cleanSlice 处理，不影响程序运行
	if len(missingFields) > 0 {
		for sectionName := range missingFields {
			fmt.Printf("  ✓ 已检测到 [%s] 有缺失字段（使用默认值）\n", sectionName)
		}
	}

	return nil
}

// GetConfigPath 返回当前配置文件的绝对路径
func GetConfigPath() string {
	return configFilePath
}

func Init(configPath string) error {
	if configPath == "" {
		configPath = "./configs/config.yaml"
	}

	if !filepath.IsAbs(configPath) {
		workDir, err := os.Getwd()
		if err == nil {
			configPath = filepath.Join(workDir, configPath)
		}
	}

	templatePath := "./configs/config_template.yaml"
	if !filepath.IsAbs(templatePath) {
		workDir, err := os.Getwd()
		if err == nil {
			templatePath = filepath.Join(workDir, templatePath)
		}
	}

	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		fmt.Printf("  ⚠ 配置文件不存在，正在生成...\n")

		if err := copyTemplateConfig(configPath, templatePath); err != nil {
			if err := createDefaultConfig(configPath); err != nil {
				return fmt.Errorf("failed to create default config: %w", err)
			}
		}
	}

	viper.SetConfigFile(configPath)
	viper.SetConfigType("yaml")

	if err := viper.ReadInConfig(); err != nil {
		return fmt.Errorf("failed to read config: %w", err)
	}

	configFilePath = configPath

	if raw := viper.Get("personality"); raw != nil {
		if _, isString := raw.(string); isString {
			viper.Set("personality", map[string]interface{}{
				"base_identity": raw.(string),
				"default_style": "语气自然、像朋友聊天",
			})
		}
	}

	// 自动补全用户配置中缺失的顶层 section（用模板默认值填充）
	// 向后兼容：不修改已有配置，只追加缺失段；每次启动自动运行
	merged := false
	if err := mergeMissingConfig(configPath, templatePath); err != nil {
		fmt.Printf("  ⚠ 配置补全失败: %v\n", err)
	} else {
		// 如果有新段被补全，重新读取配置以加载新增内容
		if err := viper.ReadInConfig(); err != nil {
			return fmt.Errorf("重新读取配置文件失败: %w", err)
		}
		merged = true
	}

	unmarshalHook := func(c *mapstructure.DecoderConfig) {
		c.DecodeHook = mapstructure.ComposeDecodeHookFunc(
			c.DecodeHook,
			mapstructure.StringToSliceHookFunc(","),
		)
	}

	if err := viper.Unmarshal(&AppConfig, unmarshalHook); err != nil {
		return fmt.Errorf("failed to unmarshal config: %w", err)
	}

	// 清理逗号分隔解码后产生的空字符串元素
	cleanSlice := func(s *[]string) {
		var cleaned []string
		for _, item := range *s {
			item = strings.TrimSpace(item)
			if item != "" {
				cleaned = append(cleaned, item)
			}
		}
		*s = cleaned
	}
	cleanSlice(&AppConfig.Bot.Aliases)
	cleanSlice(&AppConfig.Personality.ExtraStyles)
	cleanSlice(&AppConfig.Personality.PersonaAngles)
	cleanSlice(&AppConfig.ContentFilter.BanWords)
	cleanSlice(&AppConfig.ContentFilter.BanRegex)
	cleanSlice(&AppConfig.Hook.List)

	if merged {
		// 补全了内容，再 check 一次 personality 兼容性
		if raw := viper.Get("personality"); raw != nil {
			if _, isString := raw.(string); isString {
				viper.Set("personality", map[string]interface{}{
					"base_identity": raw.(string),
					"default_style": "语气自然、像朋友聊天",
				})
				viper.Unmarshal(&AppConfig, unmarshalHook)
				cleanSlice(&AppConfig.Personality.ExtraStyles)
				cleanSlice(&AppConfig.Personality.PersonaAngles)
			}
		}
	}

	// 设置默认值（避免 Validate 时报错）
	if AppConfig.Bot.MaxReplyLen <= 0 {
		AppConfig.Bot.MaxReplyLen = 500
	}
	if AppConfig.Bot.MaxConcurrentMessages <= 0 {
		AppConfig.Bot.MaxConcurrentMessages = 10
	}
	if AppConfig.Decision.MaxRounds <= 0 {
		AppConfig.Decision.MaxRounds = 2
	}
	if AppConfig.MessageReceive.ForwardMaxImages <= 0 {
		AppConfig.MessageReceive.ForwardMaxImages = 3
	}
	if AppConfig.TimingGate.MaxObserveMessages <= 0 {
		AppConfig.TimingGate.MaxObserveMessages = 3
	}
	if AppConfig.TimingGate.RespondCooldownSec <= 0 {
		AppConfig.TimingGate.RespondCooldownSec = 8
	}
	if AppConfig.TimingGate.RecentWindowSize <= 0 {
		AppConfig.TimingGate.RecentWindowSize = 5
	}
	if AppConfig.TimingGate.MaxRecentResponds <= 0 {
		AppConfig.TimingGate.MaxRecentResponds = 3
	}
	if AppConfig.TimingGate.MaxConsecutiveSkips <= 0 {
		AppConfig.TimingGate.MaxConsecutiveSkips = 10
	}
	if AppConfig.TimingGate.UrgencyThreshold <= 0 {
		AppConfig.TimingGate.UrgencyThreshold = 0.6
	}
	if AppConfig.TongShadow.SimilarityThreshold <= 0 {
		AppConfig.TongShadow.SimilarityThreshold = 0.70
	}
	if AppConfig.TongShadow.MaxPortraits <= 0 {
		AppConfig.TongShadow.MaxPortraits = 5
	}
	if AppConfig.TongShadow.DescribePrompt == "" {
		AppConfig.TongShadow.DescribePrompt = "请详细描述图中人物的外貌特征：发型、发色、瞳色、脸型、服装风格、配饰、体型、气质。忽略背景和环境。用中文简短回答。"
	}

	// 下载配置默认值
	if AppConfig.Download.ThunderMinFileSize <= 0 {
		AppConfig.Download.ThunderMinFileSize = 10
	}
	if AppConfig.Download.DownloadDir == "" {
		AppConfig.Download.DownloadDir = "./data/downloads"
	}

	if err := AppConfig.Validate(); err != nil {
		return fmt.Errorf("配置校验失败: %w", err)
	}

	if !AppConfig.Memory.Enabled {
		AppConfig.Memory.GlobalMemory.Enabled = false
	}
	// LightMemorySearch 默认开启：旧配置文件中没有此字段时，默认为 true
	if !viper.IsSet("memory.light_memory_search") {
		AppConfig.Memory.LightMemorySearch = true
	}

	if AppConfig.Personality.DefaultStyle == "" {
		AppConfig.Personality.DefaultStyle = "语气自然、像朋友聊天"
	}

	if AppConfig.ContentFilter.BanWords == nil {
		AppConfig.ContentFilter.BanWords = make([]string, 0)
	}
	if AppConfig.ContentFilter.BanRegex == nil {
		AppConfig.ContentFilter.BanRegex = make([]string, 0)
	}

	baseDir := filepath.Dir(filepath.Dir(configFilePath))
	if err := LoadPrompts(baseDir); err != nil {
		fmt.Printf("  ⚠ Prompt 模板加载失败: %v\n", err)
	}

	return nil
}

func copyTemplateConfig(targetPath, templatePath string) error {
	dir := filepath.Dir(targetPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	templateData, err := os.ReadFile(templatePath)
	if err != nil {
		return err
	}

	return os.WriteFile(targetPath, templateData, 0644)
}

func createDefaultConfig(configPath string) error {
	dir := filepath.Dir(configPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	defaultConfig := `# YaraFlow 配置文件
# 配置文件版本: v1.0.0

# ============================================================
# 日志配置
# ============================================================
logger:
  console_level: info
  file_level: debug
  file_path: ./log/app.log

# ============================================================
# 机器人配置
# ============================================================
bot:
  qq: ""
  nickname: "Yara"
  aliases: "小Y,小雅"
  max_reply_len: 500
  max_concurrent_messages: 10

# ============================================================
# 触发器配置
# ============================================================
trigger:
  auto_reply: true
  require_mention: false
  base_frequency: 0.3
  at_reply: true
  mention_reply: true

# ============================================================
# 表情包配置
# ============================================================
emoji:
  steal_emoji: true
  auto_tag: true
  max_reg_num: 100
  check_interval: 1800
  do_replace: false
  content_filtration: false

# ============================================================
# 消息内容过滤配置
# ============================================================
content_filter:
  ban_words: "广告,垃圾"
  ban_regex: "\\d{11},http[s]?://"

# ============================================================
# Hook 系统配置
# ============================================================
hook:
  mode: "blacklist"
  list: ""
  rate_limit:
    enabled: false
    max_per_min: 0
    max_per_hour: 0

# ============================================================
# 事件总线配置
# ============================================================
bus:
  buffer_size: 100

# ============================================================
# 脚本配置（预留）
# ============================================================
goja:
  script_path: ./plugins/

# ============================================================
# 记忆系统配置
# ============================================================
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

# ============================================================
# 联网搜索配置
# ============================================================
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
  # allow_file_download: 是否允许规划器使用下载文件工具（默认关闭，关闭后规划器看不到 download_file 工具）
  allow_file_download: false

# ============================================================
# 视觉分析配置
# ============================================================
vision:
  enabled: true

# ============================================================
# 语音处理配置（语音转文字）
# ============================================================
voice:
  enabled: true

# ============================================================
# 角色设定
# ============================================================
personality:
  # 核心身份：bot 是谁（名字、年龄、性格、爱好等基本信息统统写在这里）
  base_identity: |
    你是一个活泼可爱的普通人类，不是AI也不是机器人。
    性格开朗善良，说话风格轻松友好，像一个大学生在群聊里聊天一样自然。
    回复简洁生动，善用表情符号，语气像朋友交流。
  # 默认回复风格（怎么说话）
  default_style: |
    语气自然温软，回复简短不啰嗦。
    不做作不加戏，符合正常人聊天思维。
  # 备选风格列表（有概率随机切换）
  extra_styles: "用1-2个字极简回复,带点吐槽感，像微博评论区"
  # 使用备选风格的概率（0.0-1.0）
  style_probability: 0.3
  # 人物视角：bot 偶尔换一个角度说话，让回复更多样
  # 比如「冲浪达人」视角和「技术宅」视角，同一条消息用不同视角回复感觉不一样
  persona_angles: "是刷B站的冲浪达人，爱用网络梗聊天,是技术宅少女，聊代码时自信满满"
  # 使用人物视角的概率（0.0-1.0）
  angle_probability: 0.3

# ============================================================
# 决策模型规则
# ============================================================
behavior_rules: |
  决策模型核心规则：
  1. 自动回复：始终开启，积极响应对话
  2. @提及回复：收到@时立即强制回复
  3. 昵称/别名触发：检测到自己名字时强制回复
  4. 概率触发：按配置基础频率随机回复
  5. 图片处理：仅处理普通图片，表情包则直接保存
  6. 回复长度：控制在合理范围内，避免过长
  7. 敏感话题：温和处理，避免冲突

# ============================================================
# 视觉分析规则
# ============================================================
vision_rules: |
  图片分析要求：
  - 简明扼要描述内容（50字内）
  - 提取关键文字信息
  - 输出纯文本，不解释

# ============================================================
# 消息接收配置
# ============================================================
message_receive:
  # 转发消息中图片超过此数量时跳过处理，避免大量图片消耗资源
  forward_max_images: 3

# ============================================================
# 消息去重配置
# ============================================================
dedupe:
  enabled: true
  window_ms: 300000     # 去重窗口时长（毫秒），默认 5 分钟
  max_size: 10000       # 最大记录数，超出时清理一半

# ============================================================
# LLM 定时网关 (TimingGate) 配置
# ============================================================
timing_gate:
  enabled: false                 # 启用 LLM 定时网关（关闭时用内置规则判断回复时机）
  max_observe_messages: 3        # 最多观望消息数
  respond_cooldown_sec: 8        # 回应冷却时间（秒），避免刷屏
  recent_window_size: 5          # 近期回应窗口大小（条）
  max_recent_responds: 3         # 窗口内最多回应次数
  max_consecutive_skips: 10      # 连续跳过超过此次数后降低回应门槛
  urgency_threshold: 0.6         # 紧急度阈值：低于此值且无强制触发时选择观望

# ============================================================
# Web 仪表盘配置
# ============================================================
webui:
  # 访问令牌：为空则首次启动时自动生成随机令牌，控制台会打印
  auth_token: ""

# ============================================================
# 内嵌浏览器配置
# ============================================================
browser:
  # developer: 是否启用 F12 开发者工具（默认关闭）
  developer: false
`

	return os.WriteFile(configPath, []byte(defaultConfig), 0644)
}
