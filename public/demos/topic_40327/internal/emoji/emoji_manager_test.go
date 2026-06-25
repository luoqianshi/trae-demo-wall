package emoji

import (
	"testing"
)

func TestCalculateHashDeterministic(t *testing.T) {
	data := []byte("hello world")
	h1 := CalculateHash(data)
	h2 := CalculateHash(data)
	if h1 != h2 {
		t.Errorf("hash 应该确定一致: %s != %s", h1, h2)
	}
}

func TestCalculateHashDifferent(t *testing.T) {
	h1 := CalculateHash([]byte("hello"))
	h2 := CalculateHash([]byte("world"))
	if h1 == h2 {
		t.Error("不同数据的 hash 应该不同")
	}
}

func TestCalculateHashLength(t *testing.T) {
	h := CalculateHash([]byte("test"))
	if len(h) != 64 {
		t.Errorf("SHA256 hash 长度应为64, 实际 %d", len(h))
	}
}

func TestParseEmotionsEmpty(t *testing.T) {
	result := parseEmotions("")
	if len(result) != 0 {
		t.Errorf("空描述应返回空切片, 实际 %v", result)
	}
}

func TestParseEmotionsComma(t *testing.T) {
	result := parseEmotions("开心,生气,无语")
	if len(result) != 3 {
		t.Fatalf("预期3个标签, 实际 %d: %v", len(result), result)
	}
	if result[0] != "开心" || result[1] != "生气" || result[2] != "无语" {
		t.Errorf("标签顺序/内容不对: %v", result)
	}
}

func TestParseEmotionsChineseComma(t *testing.T) {
	result := parseEmotions("开心，生气，无语")
	if len(result) != 3 {
		t.Fatalf("预期3个标签, 实际 %d: %v", len(result), result)
	}
}

func TestParseEmotionsSemicolon(t *testing.T) {
	result := parseEmotions("开心;生气;无语")
	if len(result) != 3 {
		t.Fatalf("预期3个标签, 实际 %d: %v", len(result), result)
	}
}

func TestParseEmotionsDedup(t *testing.T) {
	result := parseEmotions("开心,开心,生气,开心")
	if len(result) != 2 {
		t.Fatalf("预期2个去重标签, 实际 %d: %v", len(result), result)
	}
}

func TestParseEmotionsDedupCaseInsensitive(t *testing.T) {
	result := parseEmotions("HeLLo,hello,HELLO")
	if len(result) != 1 {
		t.Fatalf("预期1个大小写去重标签, 实际 %d: %v", len(result), result)
	}
	if result[0] != "HeLLo" {
		t.Errorf("应保留首次出现的标签, 实际 %s", result[0])
	}
}

func TestParseEmotionsWhitespace(t *testing.T) {
	result := parseEmotions(" 开心 , 生气 , 无语 ")
	if len(result) != 3 {
		t.Fatalf("预期3个标签, 实际 %d: %v", len(result), result)
	}
}

func TestParseEmotionsSingle(t *testing.T) {
	result := parseEmotions("开心")
	if len(result) != 1 || result[0] != "开心" {
		t.Errorf("预期 [开心], 实际 %v", result)
	}
}

func TestCalculateSimilarityExact(t *testing.T) {
	score := calculateSimilarity("开心", []string{"开心", "生气"})
	if score < 5 {
		t.Errorf("精确匹配得分应 >= 5, 实际 %d", score)
	}
}

func TestCalculateSimilarityPartial(t *testing.T) {
	score := calculateSimilarity("开心", []string{"很开心", "生气了"})
	if score <= 0 {
		t.Errorf("部分匹配得分应 > 0, 实际 %d", score)
	}
}

func TestCalculateSimilarityNoMatch(t *testing.T) {
	score := calculateSimilarity("开心", []string{"生气", "无语"})
	if score != 0 {
		t.Errorf("无匹配得分应为0, 实际 %d", score)
	}
}

func TestCalculateSimilarityMultiple(t *testing.T) {
	score := calculateSimilarity("开心", []string{"开心", "快乐", "兴奋"})
	if score < 5 {
		t.Errorf("有精确匹配时得分应 >= 5, 实际 %d", score)
	}
}

func TestCalculateSimilarityEmpty(t *testing.T) {
	score := calculateSimilarity("开心", []string{})
	if score != 0 {
		t.Errorf("空标签列表得分应为0, 实际 %d", score)
	}
}