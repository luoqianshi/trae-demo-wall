package knowledge

import (
	"math"
	"strings"
	"testing"
)

// ============ cosineSimilarity 测试 ============

func TestCosineSimilarityIdentical(t *testing.T) {
	a := []float32{1, 2, 3}
	b := []float32{1, 2, 3}
	result := cosineSimilarity(a, b)
	if result < 0.999 || result > 1.001 {
		t.Errorf("identical vectors should have similarity ~1.0, got %f", result)
	}
}

func TestCosineSimilarityOrthogonal(t *testing.T) {
	a := []float32{1, 0}
	b := []float32{0, 1}
	result := cosineSimilarity(a, b)
	if math.Abs(float64(result)) > 0.001 {
		t.Errorf("orthogonal vectors should have similarity 0, got %f", result)
	}
}

func TestCosineSimilarityOpposite(t *testing.T) {
	a := []float32{1, 2, 3}
	b := []float32{-1, -2, -3}
	result := cosineSimilarity(a, b)
	if result > -0.999 || result < -1.001 {
		t.Errorf("opposite vectors should have similarity ~-1.0, got %f", result)
	}
}

func TestCosineSimilarityZeroVector(t *testing.T) {
	a := []float32{0, 0, 0}
	b := []float32{1, 2, 3}
	result := cosineSimilarity(a, b)
	if result != 0 {
		t.Errorf("zero vector should give similarity 0, got %f", result)
	}
}

func TestCosineSimilarityEmpty(t *testing.T) {
	result := cosineSimilarity(nil, nil)
	if result != 0 {
		t.Errorf("empty vectors should give similarity 0, got %f", result)
	}
}

func TestCosineSimilarityMismatchedLengths(t *testing.T) {
	result := cosineSimilarity([]float32{1, 2}, []float32{1, 2, 3})
	if result != 0 {
		t.Errorf("mismatched lengths should give similarity 0, got %f", result)
	}
}

// ============ truncate 测试 ============

func TestTruncateShort(t *testing.T) {
	result := truncate("hello", 50)
	if result != "hello" {
		t.Errorf("short string should not be truncated, got %q", result)
	}
}

func TestTruncateLong(t *testing.T) {
	long := strings.Repeat("a", 100)
	result := truncate(long, 50)
	if len([]rune(result)) != 53 { // 50 runes + "..."
		t.Errorf("expected 53 runes (50 + '...'), got %d: %q", len([]rune(result)), result)
	}
	if !strings.HasSuffix(result, "...") {
		t.Errorf("truncated string should end with '...', got %q", result)
	}
}

func TestTruncateExactLength(t *testing.T) {
	s := strings.Repeat("a", 50)
	result := truncate(s, 50)
	if result != s {
		t.Errorf("exact length string should not be truncated, got %q", result)
	}
}

func TestTruncateChinese(t *testing.T) {
	long := "这是一个很长的中文字符串用于测试截断功能是否正常工作"
	result := truncate(long, 5)
	if len([]rune(result)) != 8 {
		t.Errorf("expected 8 runes (5 + '...'), got %d: %q", len([]rune(result)), result)
	}
	if !strings.HasSuffix(result, "...") {
		t.Errorf("truncated string should end with '...', got %q", result)
	}
}

// ============ FormatForLLM 测试 ============

func TestFormatForLLMEmpty(t *testing.T) {
	result := FormatForLLM(nil)
	if result != "" {
		t.Errorf("expected empty string, got %q", result)
	}
	result = FormatForLLM([]*Entry{})
	if result != "" {
		t.Errorf("expected empty string, got %q", result)
	}
}

func TestFormatForLLMSingleEntry(t *testing.T) {
	entries := []*Entry{
		{Content: "今天是周五"},
	}
	result := FormatForLLM(entries)
	if !strings.Contains(result, "1. 今天是周五") {
		t.Error("missing entry content")
	}
}

func TestFormatForLLMWithTags(t *testing.T) {
	entries := []*Entry{
		{Content: "重要事项", Tags: []string{"工作", "紧急"}},
	}
	result := FormatForLLM(entries)
	if !strings.Contains(result, "[标签: 工作, 紧急]") {
		t.Errorf("expected tags, got %q", result)
	}
}

func TestFormatForLLMMultipleEntries(t *testing.T) {
	entries := []*Entry{
		{Content: "第一条"},
		{Content: "第二条"},
		{Content: "第三条"},
	}
	result := FormatForLLM(entries)
	if strings.Count(result, "\n") < 3 { // 3 entry lines
		t.Errorf("expected at least 3 lines, got:\n%s", result)
	}
}

// ============ parseTags 测试 ============

func TestParseTagsNormal(t *testing.T) {
	result := parseTags("tag1,tag2,tag3")
	if len(result) != 3 {
		t.Fatalf("expected 3 tags, got %d", len(result))
	}
	if result[0] != "tag1" || result[1] != "tag2" || result[2] != "tag3" {
		t.Errorf("unexpected tags: %v", result)
	}
}

func TestParseTagsEmpty(t *testing.T) {
	result := parseTags("")
	if result != nil {
		t.Errorf("expected nil for empty string, got %v", result)
	}
}

func TestParseTagsWithSpaces(t *testing.T) {
	result := parseTags("tag1 , tag2 , tag3")
	if len(result) != 3 {
		t.Fatalf("expected 3 tags, got %d", len(result))
	}
	if result[0] != "tag1" || result[1] != "tag2" || result[2] != "tag3" {
		t.Errorf("unexpected tags: %v", result)
	}
}

func TestParseTagsEmptyParts(t *testing.T) {
	result := parseTags("tag1,,tag2,,")
	if len(result) != 2 {
		t.Fatalf("expected 2 tags, got %d: %v", len(result), result)
	}
}

func TestParseTagsSingle(t *testing.T) {
	result := parseTags("only")
	if len(result) != 1 || result[0] != "only" {
		t.Errorf("expected ['only'], got %v", result)
	}
}

// ============ floating point serialization 测试 ============

func TestFloatsToBytesRoundtrip(t *testing.T) {
	original := []float32{1.5, -2.3, 3.14159, 0.0, -0.0, 999.999}
	data := floatsToBytes(original)
	if len(data) != len(original)*4 {
		t.Errorf("expected %d bytes, got %d", len(original)*4, len(data))
	}

	restored := bytesToFloats(data)
	if len(restored) != len(original) {
		t.Fatalf("length mismatch: %d vs %d", len(restored), len(original))
	}
	for i := range original {
		if restored[i] != original[i] {
			t.Errorf("index %d: %f != %f", i, restored[i], original[i])
		}
	}
}

func TestFloatsToBytesEmpty(t *testing.T) {
	result := floatsToBytes(nil)
	if result != nil {
		t.Errorf("expected nil for empty input, got %v", result)
	}
	result = floatsToBytes([]float32{})
	if result != nil {
		t.Errorf("expected nil for empty slice, got %v", result)
	}
}

func TestBytesToFloatsEmpty(t *testing.T) {
	result := bytesToFloats(nil)
	if result != nil {
		t.Errorf("expected nil for nil input, got %v", result)
	}
	result = bytesToFloats([]byte{})
	if result != nil {
		t.Errorf("expected nil for empty input, got %v", result)
	}
}

// ============ Entry 结构体测试 ============

func TestEntryFields(t *testing.T) {
	entry := &Entry{
		ID:      1,
		Content: "测试内容",
		Tags:    []string{"test", "demo"},
		Source:  "manual",
	}
	if entry.ID != 1 {
		t.Errorf("ID = %d", entry.ID)
	}
	if entry.Content != "测试内容" {
		t.Errorf("Content = %s", entry.Content)
	}
	if len(entry.Tags) != 2 {
		t.Errorf("Tags length = %d", len(entry.Tags))
	}
	if entry.Source != "manual" {
		t.Errorf("Source = %s", entry.Source)
	}
}

// ============ cosineSimilarity 边界情况 ============

func TestCosineSimilaritySingleElement(t *testing.T) {
	result := cosineSimilarity([]float32{3}, []float32{4})
	// Both pointing same direction, similarity should be 1.0
	if result < 0.999 || result > 1.001 {
		t.Errorf("same-direction scalars should be 1.0, got %f", result)
	}
}

func TestCosineSimilarityVeryClose(t *testing.T) {
	a := []float32{1.0, 0.001}
	b := []float32{1.0, 0.001}
	result := cosineSimilarity(a, b)
	if result < 0.999 || result > 1.001 {
		t.Errorf("very close vectors should be ~1.0, got %f", result)
	}
}
