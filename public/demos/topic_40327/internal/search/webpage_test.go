package websearch

import (
	"testing"
)

// ── extractQueryKeywords ──

func TestExtractQueryKeywords_WithSpaces(t *testing.T) {
	kw := extractQueryKeywords("hello world")
	// 完整查询 + 各独立词
	if len(kw) < 3 {
		t.Fatalf("应至少返回3个关键词（完整+2个独立词），got=%d", len(kw))
	}
	if kw[0] != "hello world" {
		t.Errorf("第一个关键词应为完整查询，got=%q", kw[0])
	}
	// 不应生成2-gram（因为有空格分词）
	hasBigram := false
	for _, k := range kw {
		if len([]rune(k)) == 2 && k != "hello" && k != "world" {
			hasBigram = true
		}
	}
	if hasBigram {
		t.Errorf("有空格分词时不应生成2-gram，got=%v", kw)
	}
}

func TestExtractQueryKeywords_NoSpaces_Chinese(t *testing.T) {
	kw := extractQueryKeywords("你好世界")
	if len(kw) == 0 {
		t.Fatal("应返回非空关键词列表")
	}
	if kw[0] != "你好世界" {
		t.Errorf("第一个关键词应为完整查询，got=%q", kw[0])
	}
	// 无空格时应生成2-gram
	hasBigram := false
	for _, k := range kw {
		if k == "你好" || k == "好世" || k == "世界" {
			hasBigram = true
		}
	}
	if !hasBigram {
		t.Errorf("无空格中文应生成2-gram，got=%v", kw)
	}
}

func TestExtractQueryKeywords_ShortQuery(t *testing.T) {
	// 2个rune的查询
	kw := extractQueryKeywords("你好")
	if len(kw) == 0 {
		t.Fatal("应返回非空关键词列表")
	}
	if kw[0] != "你好" {
		t.Errorf("第一个关键词应为完整查询，got=%q", kw[0])
	}
}

func TestExtractQueryKeywords_Lowercase(t *testing.T) {
	kw := extractQueryKeywords("Hello World")
	for _, k := range kw {
		if k != "hello world" && k != "hello" && k != "world" {
			t.Errorf("关键词应转为小写，got=%q", k)
		}
	}
}

// ── checkContentRelevance ──

func TestCheckContentRelevance_EmptyKeywords(t *testing.T) {
	if got := checkContentRelevance(nil, "content", "title", "snippet"); got != 2 {
		t.Errorf("空关键词应返回2（默认保留），got=%d", got)
	}
	if got := checkContentRelevance([]string{}, "content", "title", "snippet"); got != 2 {
		t.Errorf("空关键词切片应返回2，got=%d", got)
	}
}

func TestCheckContentRelevance_FullQueryMatch(t *testing.T) {
	kw := []string{"hello world", "hello", "world"}
	// 完整查询词在标题中 → 返回2
	got := checkContentRelevance(kw, "content", "hello world title", "")
	if got != 2 {
		t.Errorf("完整查询词匹配应返回2，got=%d", got)
	}
	// 完整查询词在摘要中
	got = checkContentRelevance(kw, "content", "", "hello world snippet")
	if got != 2 {
		t.Errorf("完整查询词在摘要中匹配应返回2，got=%d", got)
	}
}

func TestCheckContentRelevance_PartialMatch(t *testing.T) {
	kw := []string{"hello world", "hello", "world"}
	// "hello" 在摘要中匹配，但完整查询词不匹配
	got := checkContentRelevance(kw, "content", "title", "hello snippet")
	if got < 1 {
		t.Errorf("部分关键词匹配应>=1，got=%d", got)
	}
}

func TestCheckContentRelevance_NoMetaMatch_ContentMatch(t *testing.T) {
	kw := []string{"hello world", "hello", "world"}
	// 标题/摘要无匹配，但内容有匹配
	got := checkContentRelevance(kw, "hello content", "title", "snippet")
	if got < 1 {
		t.Errorf("内容匹配应>=1，got=%d", got)
	}
}

func TestCheckContentRelevance_NoMatch(t *testing.T) {
	kw := []string{"hello world", "hello", "world"}
	got := checkContentRelevance(kw, "no match content", "title", "snippet")
	if got != 0 {
		t.Errorf("无任何匹配应返回0，got=%d", got)
	}
}
