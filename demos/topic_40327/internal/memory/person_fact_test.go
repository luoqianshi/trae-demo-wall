package memory

import (
	"strings"
	"testing"
)

func TestExtractPersonFactsName(t *testing.T) {
	facts := ExtractPersonFacts("大家好，我叫小明，请多关照", "小明", "u1")
	if len(facts) != 1 {
		t.Fatalf("expected 1 fact, got %d: %v", len(facts), facts)
	}
	if !strings.Contains(facts[0], "小明说他叫小明") {
		t.Errorf("unexpected fact: %s", facts[0])
	}
}

func TestExtractPersonFactsHobby(t *testing.T) {
	facts := ExtractPersonFacts("我喜欢打游戏和看电影", "小红", "u2")
	found := false
	for _, f := range facts {
		if strings.Contains(f, "小红喜欢") && strings.Contains(f, "打游戏") && strings.Contains(f, "看电影") {
			found = true
		}
	}
	if !found {
		t.Errorf("should extract hobby, got: %v", facts)
	}
}

func TestExtractPersonFactsAge(t *testing.T) {
	facts := ExtractPersonFacts("我今年18岁了", "小刚", "u3")
	if len(facts) == 0 {
		t.Fatal("expected at least 1 fact")
	}
}

func TestExtractPersonFactsEmpty(t *testing.T) {
	facts := ExtractPersonFacts("今天天气真好", "小明", "u1")
	if len(facts) != 0 {
		t.Errorf("expected 0 facts, got: %v", facts)
	}
}

func TestExtractPersonFactsDedup(t *testing.T) {
	facts := ExtractPersonFacts("我妈觉得很健康", "小明", "u1")
	if len(facts) > 0 {
		for _, f := range facts {
			t.Logf("fact: %s", f)
		}
	}
}
