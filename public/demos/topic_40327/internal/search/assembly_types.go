package websearch

// ============================================================
// 大会辩论类型定义
// ============================================================

// DelegateRole 辩论角色
type DelegateRole string

const (
	// RoleReformist 维新派（搜索派）：主张相信网络搜索结果
	RoleReformist DelegateRole = "reformist"
	// RoleConservative 守旧派（记忆派）：主张相信已有记忆/知识
	RoleConservative DelegateRole = "conservative"
	// RoleSupporter 赞同者：寻找双方论点的共同点
	RoleSupporter DelegateRole = "supporter"
	// RoleOpponent 反对者：挑双方论点的漏洞
	RoleOpponent DelegateRole = "opponent"
	// RoleSynthesizer 整合者：主持辩论，综合各方论点
	RoleSynthesizer DelegateRole = "synthesizer"
)

// DebateRound 一轮辩论记录
type DebateRound struct {
	Round         int
	ReformistA    string // 维新派A发言
	ConservativeA string // 守旧派A发言
	Supporter     string // 赞同者评论
	Opponent      string // 反对者挑刺
	ReformistB    string // 维新派B反驳/补充
	ConservativeB string // 守旧派B反驳/补充
	Verdict       string // 整合者本轮判断
	Converged     bool   // 本轮是否收敛
}

// AssemblyState 大会状态
type AssemblyState struct {
	OriginalQuery string
	Topics        []string // 拆解出的议题
	Rounds        []DebateRound
	CurrentRound  int
	Converged     bool
	SearchResults map[string][]SearchResult // 维新派搜索结果, key=议题
	MemoryResults map[string]string         // 守旧派记忆检索结果, key=议题
}

// Assembly 大会辩论系统
type Assembly struct {
	simple      *SimpleSearcher
	llmProvider Provider
	memProvider MemoryProvider
	cfg         DepthConfig
}
