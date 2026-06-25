package config

type PersonalityConfig struct {
	BaseIdentity  string   `mapstructure:"base_identity"`
	DefaultStyle  string   `mapstructure:"default_style"`
	ExtraStyles   []string `mapstructure:"extra_styles"`
	StyleProb     float64  `mapstructure:"style_probability"`
	PersonaAngles []string `mapstructure:"persona_angles"`
	AngleProb     float64  `mapstructure:"angle_probability"`
}

type Config struct {
	Logger         LoggerConfig         `mapstructure:"logger"`
	Bot            BotConfig            `mapstructure:"bot"`
	Trigger        TriggerConfig        `mapstructure:"trigger"`
	Decision       DecisionConfig       `mapstructure:"decision"`
	Bus            BusConfig            `mapstructure:"bus"`
	Goja           GojaConfig           `mapstructure:"goja"`
	Emoji          EmojiConfig          `mapstructure:"emoji"`
	ContentFilter  ContentFilterConfig  `mapstructure:"content_filter"`
	Hook           HookConfig           `mapstructure:"hook"`
	Memory         MemoryConfig         `mapstructure:"memory"`
	Personality    PersonalityConfig    `mapstructure:"personality"`
	BehaviorRules  string               `mapstructure:"behavior_rules"`
	VisionRules    string               `mapstructure:"vision_rules"`
	WebSearch      WebSearchConfig      `mapstructure:"web_search"`
	Download       DownloadConfig       `mapstructure:"download"`
	Vision         VisionConfig         `mapstructure:"vision"`
	Voice          VoiceConfig          `mapstructure:"voice"`
	Dedupe         DedupeConfig         `mapstructure:"dedupe"`
	MessageReceive MessageReceiveConfig `mapstructure:"message_receive"`
	TimingGate     TimingGateConfig     `mapstructure:"timing_gate"`
	TongShadow     TongShadowConfig     `mapstructure:"tong_shadow"`
	WebUI          WebUIConfig          `mapstructure:"webui"`
	Browser        BrowserConfig        `mapstructure:"browser"`
}

type WebUIConfig struct {
	AuthToken string `mapstructure:"auth_token"` // 仪表盘访问令牌，为空则自动生成
}

type LoggerConfig struct {
	ConsoleLevel string `mapstructure:"console_level"`
	FileLevel    string `mapstructure:"file_level"`
	FilePath     string `mapstructure:"file_path"`
	MaxLogDays   int    `mapstructure:"max_log_days"`
}

type BotConfig struct {
	QQ                    string   `mapstructure:"qq"`
	Nickname              string   `mapstructure:"nickname"`
	Aliases               []string `mapstructure:"aliases"`
	MaxReplyLen           int      `mapstructure:"max_reply_len"`
	MaxConcurrentMessages int      `mapstructure:"max_concurrent_messages"`
	EnableSelfEvaluation  bool     `mapstructure:"enable_self_evaluation"`
}

type TriggerConfig struct {
	AutoReply      bool    `mapstructure:"auto_reply"`
	RequireMention bool    `mapstructure:"require_mention"`
	BaseFrequency  float64 `mapstructure:"base_frequency"`
	AtReply        bool    `mapstructure:"at_reply"`
	MentionReply   bool    `mapstructure:"mention_reply"`
}

type DecisionConfig struct {
	MaxRounds int `mapstructure:"max_rounds"`
}

type BusConfig struct {
	BufferSize int `mapstructure:"buffer_size"`
}

type GojaConfig struct {
	ScriptPath string `mapstructure:"script_path"`
}

type EmojiConfig struct {
	StealEmoji        bool `mapstructure:"steal_emoji"`
	AutoTag           bool `mapstructure:"auto_tag"`
	MaxRegNum         int  `mapstructure:"max_reg_num"`
	CheckInterval     int  `mapstructure:"check_interval"`
	DoReplace         bool `mapstructure:"do_replace"`
	ContentFiltration bool `mapstructure:"content_filtration"`
}

type ContentFilterConfig struct {
	BanWords []string `mapstructure:"ban_words"`
	BanRegex []string `mapstructure:"ban_regex"`
}

type HookConfig struct {
	Mode      string   `mapstructure:"mode"`
	List      []string `mapstructure:"list"`
	RateLimit struct {
		Enabled    bool `mapstructure:"enabled"`
		MaxPerMin  int  `mapstructure:"max_per_min"`
		MaxPerHour int  `mapstructure:"max_per_hour"`
	} `mapstructure:"rate_limit"`
}

type MemoryWritebackConfig struct {
	Enabled            bool `mapstructure:"enabled"`
	MessageThreshold   int  `mapstructure:"message_threshold"`
	ContextLength      int  `mapstructure:"context_length"`
	PersonFactEnabled  bool `mapstructure:"person_fact_enabled"`
	ChatSummaryEnabled bool `mapstructure:"chat_summary_enabled"`
}

type MemoryConfig struct {
	Enabled           bool                  `mapstructure:"enabled"`
	MaxFragments      int                   `mapstructure:"max_fragments"`
	FragmentTTLDays   int                   `mapstructure:"fragment_ttl_days"`
	TopK              int                   `mapstructure:"top_k"`
	SearchMode        string                `mapstructure:"search_mode"`
	EmbeddingDim      int                   `mapstructure:"embedding_dim"`
	Writeback         MemoryWritebackConfig `mapstructure:"writeback"`
	VectorPersistSec  int                   `mapstructure:"vector_persist_sec"`
	WeightDecay       MemoryWeightDecay     `mapstructure:"weight_decay"`
	GlobalMemory      MemoryGlobalConfig    `mapstructure:"global_memory"`
	GraphMemory       MemoryGraphConfig     `mapstructure:"graph_memory"`
	LightMemorySearch bool                  `mapstructure:"light_memory_search"`
}

type MemoryWeightDecay struct {
	Enabled     bool    `mapstructure:"enabled"`
	DecayRate   float64 `mapstructure:"decay_rate"`
	AccessBoost float64 `mapstructure:"access_boost"`
	BoostCap    float64 `mapstructure:"boost_cap"`
}

type MemoryGlobalConfig struct {
	Enabled bool `mapstructure:"enabled"`
	TopK    int  `mapstructure:"top_k"`
}

type MemoryGraphConfig struct {
	Enabled bool `mapstructure:"enabled"`
}

type WebSearchConfig struct {
	Enabled           bool                 `mapstructure:"enabled"`
	DefaultDepth      string               `mapstructure:"default_depth"`       // simple/webpage/depth
	Shallow           ShallowSearchConfig  `mapstructure:"shallow"`             // 简易搜索配置（YAML key 保持兼容）
	Deep              DeepSearchConfig     `mapstructure:"deep"`                // 常规搜索配置（YAML key 保持兼容）
	Research          ResearchSearchConfig `mapstructure:"research"`            // 深度搜索配置（YAML key 保持兼容）
	AllowFileDownload bool                 `mapstructure:"allow_file_download"` // 是否允许规划器使用下载文件工具（默认关闭）
	DownloadDir       string               `mapstructure:"download_dir"`        // 下载文件存放目录（默认 ./data/downloads）
}

type ShallowSearchConfig struct {
	MaxResults int `mapstructure:"max_results"` // 简易搜索最大结果数
}

type DeepSearchConfig struct {
	MaxResults   int  `mapstructure:"max_results"`   // 常规搜索最大抓取结果
	FetchContent bool `mapstructure:"fetch_content"` // 是否抓取网页全文
	FetchTimeout int  `mapstructure:"fetch_timeout"` // 抓取超时(秒)
}

type ResearchSearchConfig struct {
	Enabled       bool `mapstructure:"enabled"`         // 是否启用深度搜索（大会辩论模式）
	MaxRounds     int  `mapstructure:"max_rounds"`      // 最大辩论轮次
	MaxResults    int  `mapstructure:"max_results"`     // 深度搜索每个子问题最大结果
	MaxSubQueries int  `mapstructure:"max_sub_queries"` // 深度搜索最大子问题数
}

type VisionConfig struct {
	Enabled bool `mapstructure:"enabled"`
}

type VoiceConfig struct {
	Enabled bool `mapstructure:"enabled"`
}

type DedupeConfig struct {
	Enabled  bool `mapstructure:"enabled"`
	WindowMs int  `mapstructure:"window_ms"`
	MaxSize  int  `mapstructure:"max_size"`
}

type MessageReceiveConfig struct {
	ForwardMaxImages int `mapstructure:"forward_max_images"`
}

type TimingGateConfig struct {
	Enabled             bool    `mapstructure:"enabled"`
	MaxObserveMessages  int     `mapstructure:"max_observe_messages"`
	RespondCooldownSec  int     `mapstructure:"respond_cooldown_sec"`
	RecentWindowSize    int     `mapstructure:"recent_window_size"`
	MaxRecentResponds   int     `mapstructure:"max_recent_responds"`
	MaxConsecutiveSkips int     `mapstructure:"max_consecutive_skips"`
	UrgencyThreshold    float64 `mapstructure:"urgency_threshold"`
}

type TongShadowConfig struct {
	Enabled               bool    `mapstructure:"enabled"`
	SimilarityThreshold   float64 `mapstructure:"similarity_threshold"`
	MaxPortraits          int     `mapstructure:"max_portraits"`
	DescribePrompt        string  `mapstructure:"describe_prompt"`
	InjectSelfDescription bool    `mapstructure:"inject_self_description"`
}

// BrowserConfig 内嵌浏览器配置
type BrowserConfig struct {
	Developer bool `mapstructure:"developer"` // 是否启用 F12 开发者工具
}

// DownloadConfig 下载相关配置
type DownloadConfig struct {
	UseThunder         bool   `mapstructure:"use_thunder"`           // 是否优先使用迅雷下载
	ThunderMinFileSize int    `mapstructure:"thunder_min_file_size"` // 小于此大小的文件跳过迅雷（MB）
	AllowFileDownload  bool   `mapstructure:"allow_file_download"`   // 是否允许规划器使用下载文件工具
	DownloadDir        string `mapstructure:"download_dir"`          // 下载文件存放目录
}

var AppConfig Config
var configFilePath string
