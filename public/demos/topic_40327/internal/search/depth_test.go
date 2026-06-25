package websearch

import (
	"testing"
)

// ── isProperNounQuery ──

func TestIsProperNounQuery_SpecialSeparator(t *testing.T) {
	cases := []string{
		"钛宇·星光阁",
		"C++-tutorial",
		"a/b",
		"x|y",
		"a•b",
		"a—b",
		"a～b",
		"a~b",
		"a、b",
	}
	for _, c := range cases {
		if !isProperNounQuery(c) {
			t.Errorf("含特殊分隔符应判定为专有名词，input=%q", c)
		}
	}
}

func TestIsProperNounQuery_ShortQuery(t *testing.T) {
	// ≤8 个 rune
	cases := []string{
		"hello",       // 5
		"你好世界",     // 4
		"你好世界你好", // 6
		"12345678",    // 8
	}
	for _, c := range cases {
		if !isProperNounQuery(c) {
			t.Errorf("短查询(≤8 rune)应判定为专有名词，input=%q", c)
		}
	}
}

func TestIsProperNounQuery_QuestionWord(t *testing.T) {
	// >8 rune 且含疑问词 → false
	cases := []string{
		"什么是人工智能技术", // 9 rune, 含"什么"
		"怎么学习编程语言呢", // 9 rune, 含"怎么"
		"如何提高编程能力呢", // 9 rune, 含"如何"
	}
	for _, c := range cases {
		if isProperNounQuery(c) {
			t.Errorf("含疑问词的长查询不应判定为专有名词，input=%q", c)
		}
	}
}

func TestIsProperNounQuery_PureChineseMedium(t *testing.T) {
	// >8 rune, 无空格, 纯中文, ≤10 rune → true
	c := "你好世界你好世界你" // 9 rune
	if !isProperNounQuery(c) {
		t.Errorf("纯中文9字符应判定为专有名词，input=%q", c)
	}
}

func TestIsProperNounQuery_PureChineseLong(t *testing.T) {
	// >8 rune, 无空格, 纯中文, >10 rune → false
	c := "你好世界你好世界你好世" // 11 rune
	if isProperNounQuery(c) {
		t.Errorf("纯中文11字符不应判定为专有名词，input=%q", c)
	}
}

func TestIsProperNounQuery_HasSpace(t *testing.T) {
	// >8 rune, 有空格 → false
	c := "hello world test data"
	if isProperNounQuery(c) {
		t.Errorf("有空格的长查询不应判定为专有名词，input=%q", c)
	}
}

func TestIsProperNounQuery_QuestionWordShort(t *testing.T) {
	// ≤8 rune 的疑问词查询 → true（短查询优先）
	c := "什么是AI" // 5 rune
	if !isProperNounQuery(c) {
		t.Errorf("短查询(≤8)即使含疑问词也应判定为专有名词，input=%q", c)
	}
}
