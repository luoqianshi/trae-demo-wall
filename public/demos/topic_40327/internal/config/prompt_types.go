package config

type ReplyUserData struct {
	Nickname         string
	Identity         string // 人设信息，放在user消息里
	ChatHistory      string
	SenderName       string
	Content          string
	DecisionThought  string
	SceneDescription string // 场景描述（原在system提示词，现移到user消息顶部）
	MemoContext      string // 备忘录/参考信息（知识库、记忆摘要等）
	ToolResults      string // 工具调用结果（与备忘录分开，放在聊天记录之后）
	IsFirstChat      bool   // 是否首次聊天（决定是否使用完整人设）
	Style            string // 回复风格（配置中写的风格）
	PersonaAngle     string // 人物视角
	AliasHint        string // 别名提示（如"，别人也管你叫瞳瞳"），模板用
}

type DecisionUserData struct {
	BuiltinActions    string             // 内置动作（通过FormatActionsForPrompt(RegisterBuiltinActions())格式化）
	AvailableActions  string             // 插件注册的额外动作（通过FormatActionsForPrompt格式化）
	AvailableTools    string             // 直接可见的工具列表（通过FormatToolsForPrompt格式化），初始只有 tool_search
	DeferredToolsHint string             // 延迟加载的工具名称提示（仅列出名称，不暴露完整定义以减少 token 浪费）
	BehaviorRules     string             // 配置中的行为规则
	MultiRoundContext *MultiRoundContext // nil = 单轮模式；非nil = 多轮推理模式
}

// MultiRoundContext 多轮推理的轮次信息，注入到决策提示词中
type MultiRoundContext struct {
	RoundNum  int // 当前第几轮（从1开始）
	MaxRounds int // 最大轮次
}

type PersonalityRenderData struct {
	Nickname  string
	Identity  string
	AliasHint string // "别人也管你叫XX、YY"，由 RenderBaseIdentity 根据别名列表自动生成
}

type DecisionSystemData struct {
	Nickname           string
	Alias              string
	SceneDescription   string
	GroupChatAttention string
}

type ActionDefData struct {
	Name                  string
	Description           string
	BriefDescription      string
	DetailedDescription   string
	ActionParameters      map[string]string
	ActionRequirements    []string
	ActivationType        string
	ActivationKeywords    []string
	ActivationProbability float64
	ParallelAction        bool
	Parameters            []ActionParamData
}

type ActionParamData struct {
	Name        string
	Type        string
	Description string
	Required    bool
}

type ToolDefData struct {
	Name        string
	Description string
	Parameters  []ToolParamData
	Visibility  string
	ToolType    string
	TimeoutSec  int
}

type ToolParamData struct {
	Name        string
	Type        string
	Description string
	Required    bool
}
