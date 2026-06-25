package websearch

import (
	"strings"
	"testing"
)

// ── filterByKeywords ──

func TestFilterByKeywords_Basic(t *testing.T) {
	results := []SearchResult{
		{Title: "hello world", Snippet: "test"},
		{Title: "foo", Snippet: "bar"},
	}
	kw := []string{"hello world", "hello", "world"}
	got := filterByKeywords(results, kw, 10)
	if len(got) != 1 {
		t.Fatalf("应只保留1条匹配结果，got=%d", len(got))
	}
	if got[0].Title != "hello world" {
		t.Errorf("保留的应是匹配项，got=%q", got[0].Title)
	}
}

func TestFilterByKeywords_EmptyKeywords(t *testing.T) {
	// 空关键词 → checkContentRelevance 返回 2 >= 1 → 全部保留
	results := []SearchResult{
		{Title: "a", Snippet: "b"},
		{Title: "c", Snippet: "d"},
	}
	got := filterByKeywords(results, nil, 10)
	if len(got) != 2 {
		t.Errorf("空关键词应全部保留，got=%d", len(got))
	}
}

func TestFilterByKeywords_MaxResults(t *testing.T) {
	results := []SearchResult{
		{Title: "hello", Snippet: ""},
		{Title: "hello", Snippet: ""},
		{Title: "hello", Snippet: ""},
	}
	kw := []string{"hello"}
	got := filterByKeywords(results, kw, 2)
	if len(got) != 2 {
		t.Errorf("应受 maxResults 限制，got=%d want=2", len(got))
	}
}

func TestFilterByKeywords_EmptyResults(t *testing.T) {
	got := filterByKeywords(nil, []string{"hello"}, 10)
	if len(got) != 0 {
		t.Errorf("空结果应返回空，got=%d", len(got))
	}
}

// ── buildAltQueries ──

func TestBuildAltQueries_NoSpecial(t *testing.T) {
	got := buildAltQueries("hello world")
	if got != nil {
		t.Errorf("无特殊分隔符应返回nil，got=%v", got)
	}
}

func TestBuildAltQueries_MiddleDot(t *testing.T) {
	got := buildAltQueries("钛宇·星光阁")
	if len(got) != 2 {
		t.Fatalf("应返回2个替代查询，got=%d", len(got))
	}
	// withSpace: "钛宇 星光阁"
	if got[0] != "钛宇 星光阁" {
		t.Errorf("第一个替代查询应为空格替换，got=%q", got[0])
	}
	// noSep: "钛宇星光阁"
	if got[1] != "钛宇星光阁" {
		t.Errorf("第二个替代查询应为移除分隔符，got=%q", got[1])
	}
}

func TestBuildAltQueries_Dash(t *testing.T) {
	got := buildAltQueries("hello-world")
	if len(got) != 2 {
		t.Fatalf("应返回2个替代查询，got=%d", len(got))
	}
	if got[0] != "hello world" {
		t.Errorf("第一个替代查询应为空格替换，got=%q", got[0])
	}
	if got[1] != "helloworld" {
		t.Errorf("第二个替代查询应为移除分隔符，got=%q", got[1])
	}
}

// ── buildDecomposePrompt ──

func TestBuildDecomposePrompt(t *testing.T) {
	got := buildDecomposePrompt("测试问题")
	if !strings.Contains(got, "测试问题") {
		t.Errorf("prompt 应包含查询词，got=%q", got)
	}
	if !strings.Contains(got, "JSON") {
		t.Errorf("prompt 应包含 JSON 格式要求，got=%q", got)
	}
}

// ── buildDebateRoundPrompt ──

func TestBuildDebateRoundPrompt_Reformist(t *testing.T) {
	got := buildDebateRoundPrompt(RoleReformist, "维新派A", "history", "search results", "memory results")
	if !strings.Contains(got, "维新派") {
		t.Errorf("RoleReformist prompt 应包含角色提示，got=%q", got)
	}
	if !strings.Contains(got, "search results") {
		t.Errorf("RoleReformist prompt 应包含搜索结果，got=%q", got)
	}
}

func TestBuildDebateRoundPrompt_Conservative(t *testing.T) {
	got := buildDebateRoundPrompt(RoleConservative, "守旧派A", "history", "search results", "memory results")
	if !strings.Contains(got, "守旧派") {
		t.Errorf("RoleConservative prompt 应包含角色提示，got=%q", got)
	}
	if !strings.Contains(got, "memory results") {
		t.Errorf("RoleConservative prompt 应包含记忆结果，got=%q", got)
	}
}

func TestBuildDebateRoundPrompt_Supporter(t *testing.T) {
	got := buildDebateRoundPrompt(RoleSupporter, "赞同者", "history", "", "")
	if !strings.Contains(got, "赞同者") {
		t.Errorf("RoleSupporter prompt 应包含角色提示，got=%q", got)
	}
}

func TestBuildDebateRoundPrompt_Opponent(t *testing.T) {
	got := buildDebateRoundPrompt(RoleOpponent, "反对者", "history", "", "")
	if !strings.Contains(got, "反对者") {
		t.Errorf("RoleOpponent prompt 应包含角色提示，got=%q", got)
	}
}

func TestBuildDebateRoundPrompt_Synthesizer(t *testing.T) {
	got := buildDebateRoundPrompt(RoleSynthesizer, "整合者", "history", "", "")
	if !strings.Contains(got, "整合者") {
		t.Errorf("RoleSynthesizer prompt 应包含角色提示，got=%q", got)
	}
	if !strings.Contains(got, "CONVERGED") {
		t.Errorf("RoleSynthesizer prompt 应包含收敛判定提示，got=%q", got)
	}
}

// ── System Prompt 函数 ──

func TestSystemPrompts_NonEmpty(t *testing.T) {
	prompts := []struct {
		name string
		fn   func() string
	}{
		{"reformistA", reformistASystemPrompt},
		{"reformistB", reformistBSystemPrompt},
		{"conservativeA", conservativeASystemPrompt},
		{"conservativeB", conservativeBSystemPrompt},
		{"supporter", supporterSystemPrompt},
		{"opponent", opponentSystemPrompt},
		{"synthesizer", synthesizerSystemPrompt},
	}
	for _, p := range prompts {
		got := p.fn()
		if strings.TrimSpace(got) == "" {
			t.Errorf("%s system prompt 不应为空", p.name)
		}
	}
}

func TestSystemPrompts_ContainRoleName(t *testing.T) {
	if !strings.Contains(reformistASystemPrompt(), "维新派A") {
		t.Error("reformistASystemPrompt 应包含 '维新派A'")
	}
	if !strings.Contains(conservativeASystemPrompt(), "守旧派A") {
		t.Error("conservativeASystemPrompt 应包含 '守旧派A'")
	}
	if !strings.Contains(supporterSystemPrompt(), "赞同者") {
		t.Error("supporterSystemPrompt 应包含 '赞同者'")
	}
	if !strings.Contains(opponentSystemPrompt(), "反对者") {
		t.Error("opponentSystemPrompt 应包含 '反对者'")
	}
	if !strings.Contains(synthesizerSystemPrompt(), "整合者") {
		t.Error("synthesizerSystemPrompt 应包含 '整合者'")
	}
}

// ── buildFinalReportPrompt ──

func TestBuildFinalReportPrompt(t *testing.T) {
	got := buildFinalReportPrompt("原始问题", "辩论历史")
	if !strings.Contains(got, "原始问题") {
		t.Errorf("应包含原始问题，got=%q", got)
	}
	if !strings.Contains(got, "辩论历史") {
		t.Errorf("应包含辩论历史，got=%q", got)
	}
	if !strings.Contains(got, "深度研究报告") {
		t.Errorf("应包含报告格式要求，got=%q", got)
	}
}
