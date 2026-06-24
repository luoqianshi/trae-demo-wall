package memory

import (
	"context"
	"database/sql"
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"YaraFlow/internal/config"
	"YaraFlow/internal/llm"
	"YaraFlow/internal/logger"

	_ "github.com/mattn/go-sqlite3"
	"go.uber.org/zap"
)

func init() {
	logger.Logger = zap.NewNop()
}

type fakeLLMProvider struct {
	response string
	err      error
}

func (f *fakeLLMProvider) Chat(messages []llm.ChatMessage) (string, error) {
	if f.err != nil {
		return "", f.err
	}
	return f.response, nil
}

func (f *fakeLLMProvider) ChatEx(messages []llm.ChatMessage) (*llm.ChatResponse, error) {
	if f.err != nil {
		return nil, f.err
	}
	return &llm.ChatResponse{Content: f.response}, nil
}

func (f *fakeLLMProvider) Name() string { return "fake" }

func (f *fakeLLMProvider) HealthCheck(ctx context.Context) error { return nil }

func setupWritebackTest(t *testing.T) (*MemoryManager, func()) {
	t.Helper()

	dir := t.TempDir()
	dbPath := filepath.Join(dir, "test.db")

	db, err := sql.Open("sqlite3", dbPath+"?_busy_timeout=5000")
	if err != nil {
		t.Fatalf("open db: %v", err)
	}

	_, err = db.Exec(`
		CREATE TABLE memory_fragments (
			id TEXT PRIMARY KEY,
			session_id TEXT NOT NULL,
			platform TEXT NOT NULL DEFAULT '',
			group_id TEXT DEFAULT '',
			user_id TEXT DEFAULT '',
			content TEXT NOT NULL,
			source_kind TEXT NOT NULL DEFAULT 'chat_message',
			hash_value TEXT NOT NULL,
			keywords TEXT DEFAULT '',
			metadata TEXT DEFAULT '{}',
			emotional_tone TEXT DEFAULT '',
			access_count INTEGER DEFAULT 0,
			last_access_at DATETIME,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			expires_at DATETIME
		)
	`)
	if err != nil {
		t.Fatalf("create table: %v", err)
	}

	store := NewMemoryStore(db)
	vs := NewVectorStore(4)
	ii := NewInvertedIndex()
	fr := NewFusionRetriever(vs, ii, nil)

	mm := &MemoryManager{
		embedder:        makeFakeEmbedder(),
		store:           store,
		vectorStore:     vs,
		invertedIndex:   ii,
		fusionRetriever: fr,
		cfg: config.MemoryConfig{
			Enabled:      true,
			MaxFragments: 100,
			TopK:         5,
			SearchMode:   "hybrid",
			Writeback: config.MemoryWritebackConfig{
				Enabled:           true,
				PersonFactEnabled: true,
			},
		},
		stopCh: make(chan struct{}),
		doneCh: make(chan struct{}),
	}

	cleanup := func() {
		db.Close()
		os.Remove(filepath.Join(dir, "vectors.json"))
	}

	return mm, cleanup
}

func TestParseFactListValidJSON(t *testing.T) {
	w := &PersonFactWriter{}
	facts := w.parseFactList(`["他喜欢打游戏", "他养了一只猫"]`)
	if len(facts) != 2 {
		t.Fatalf("expected 2 facts, got %d: %v", len(facts), facts)
	}
	if facts[0] != "他喜欢打游戏" {
		t.Errorf("unexpected fact[0]: %s", facts[0])
	}
	if facts[1] != "他养了一只猫" {
		t.Errorf("unexpected fact[1]: %s", facts[1])
	}
}

func TestParseFactListWithExtraText(t *testing.T) {
	w := &PersonFactWriter{}
	facts := w.parseFactList(`好的，以下是提取到的事实：
["他喜欢打游戏", "他养了一只猫"]
以上是全部事实。`)
	if len(facts) != 2 {
		t.Fatalf("expected 2 facts, got %d: %v", len(facts), facts)
	}
}

func TestParseFactListEmptyArray(t *testing.T) {
	w := &PersonFactWriter{}
	facts := w.parseFactList(`[]`)
	if len(facts) != 0 {
		t.Errorf("expected 0 facts, got %d: %v", len(facts), facts)
	}
}

func TestParseFactListInvalidJSON(t *testing.T) {
	w := &PersonFactWriter{}
	facts := w.parseFactList(`这不是JSON`)
	if len(facts) != 0 {
		t.Errorf("expected 0 facts for invalid JSON, got %d: %v", len(facts), facts)
	}
}

func TestParseFactListEmptyString(t *testing.T) {
	w := &PersonFactWriter{}
	facts := w.parseFactList("")
	if len(facts) != 0 {
		t.Errorf("expected 0 facts for empty string, got %d: %v", len(facts), facts)
	}
}

func TestParseFactListWithWhitespace(t *testing.T) {
	mm, cleanup := setupWritebackTest(t)
	defer cleanup()

	w := &PersonFactWriter{
		llmProvider: &fakeLLMProvider{
			response: `["  他喜欢打游戏  ", " 他养了一只猫 "]`,
		},
		memoryManager: mm,
	}

	w.ExtractAndStore("content", "小明", "u1", "bot reply", "bot", "s1", "lunar", "g1")

	frags, _ := mm.store.QueryBySession("s1", string(SourcePersonFact), 10)
	if len(frags) != 2 {
		t.Fatalf("expected 2 facts, got %d", len(frags))
	}
	for _, frag := range frags {
		if strings.Contains(frag.Content, "  ") {
			t.Errorf("fact should be trimmed, got: %q", frag.Content)
		}
	}
}

func TestParseFactListSingleElement(t *testing.T) {
	w := &PersonFactWriter{}
	facts := w.parseFactList(`["他叫小明"]`)
	if len(facts) != 1 {
		t.Fatalf("expected 1 fact, got %d", len(facts))
	}
	if facts[0] != "他叫小明" {
		t.Errorf("unexpected fact: %s", facts[0])
	}
}

func TestPersonFactWriterNilProvider(t *testing.T) {
	mm, cleanup := setupWritebackTest(t)
	defer cleanup()

	w := &PersonFactWriter{
		llmProvider:   nil,
		memoryManager: mm,
	}

	w.ExtractAndStore("test content", "小明", "u1", "bot reply", "bot", "s1", "lunar", "g1")

	count, _ := mm.store.Count()
	if count != 0 {
		t.Errorf("nil provider should not store, got %d fragments", count)
	}
}

func TestPersonFactWriterNilManager(t *testing.T) {
	w := &PersonFactWriter{
		llmProvider:   &fakeLLMProvider{response: `["fact"]`},
		memoryManager: nil,
	}

	w.ExtractAndStore("test content", "小明", "u1", "bot reply", "bot", "s1", "lunar", "g1")
}

func TestPersonFactWriterEmptyContent(t *testing.T) {
	mm, cleanup := setupWritebackTest(t)
	defer cleanup()

	w := &PersonFactWriter{
		llmProvider:   &fakeLLMProvider{},
		memoryManager: mm,
	}

	w.ExtractAndStore("", "小明", "u1", "bot reply", "bot", "s1", "lunar", "g1")
	w.ExtractAndStore("   ", "小明", "u1", "bot reply", "bot", "s1", "lunar", "g1")

	count, _ := mm.store.Count()
	if count != 0 {
		t.Errorf("empty content should not store, got %d fragments", count)
	}
}

func TestPersonFactWriterEphemeralContent(t *testing.T) {
	mm, cleanup := setupWritebackTest(t)
	defer cleanup()

	w := &PersonFactWriter{
		llmProvider:   &fakeLLMProvider{response: `["他叫小明"]`},
		memoryManager: mm,
	}

	w.ExtractAndStore("哈哈", "小明", "u1", "bot reply", "bot", "s1", "lunar", "g1")
	w.ExtractAndStore("好的", "小明", "u1", "bot reply", "bot", "s1", "lunar", "g1")
	w.ExtractAndStore("嗯嗯", "小明", "u1", "bot reply", "bot", "s1", "lunar", "g1")

	count, _ := mm.store.Count()
	if count != 0 {
		t.Errorf("ephemeral content should not store, got %d fragments", count)
	}
}

func TestPersonFactWriterExtractAndStore(t *testing.T) {
	mm, cleanup := setupWritebackTest(t)
	defer cleanup()

	w := &PersonFactWriter{
		llmProvider: &fakeLLMProvider{
			response: `["他喜欢打游戏", "他养了一只叫团团的猫"]`,
		},
		memoryManager: mm,
	}

	w.ExtractAndStore("我喜欢打游戏，我家猫叫团团", "小明", "u1", "好的知道了", "bot", "s1", "lunar", "g1")

	count, _ := mm.store.Count()
	if count != 2 {
		t.Fatalf("expected 2 facts stored, got %d", count)
	}

	frags, _ := mm.store.QueryBySession("s1", string(SourcePersonFact), 10)
	if len(frags) != 2 {
		t.Fatalf("expected 2 fragments, got %d", len(frags))
	}

	for _, frag := range frags {
		if frag.SourceKind != SourcePersonFact {
			t.Errorf("expected SourcePersonFact, got %s", frag.SourceKind)
		}
		if frag.UserID != "u1" {
			t.Errorf("expected userID u1, got %s", frag.UserID)
		}
	}
}

func TestPersonFactWriterExtractEmptyResult(t *testing.T) {
	mm, cleanup := setupWritebackTest(t)
	defer cleanup()

	w := &PersonFactWriter{
		llmProvider: &fakeLLMProvider{
			response: `[]`,
		},
		memoryManager: mm,
	}

	w.ExtractAndStore("今天天气真好", "小明", "u1", "是的呢", "bot", "s1", "lunar", "g1")

	count, _ := mm.store.Count()
	if count != 0 {
		t.Errorf("empty facts should not store, got %d fragments", count)
	}
}

func TestPersonFactWriterInvalidJSONResponse(t *testing.T) {
	mm, cleanup := setupWritebackTest(t)
	defer cleanup()

	w := &PersonFactWriter{
		llmProvider: &fakeLLMProvider{
			response: `这不是合法的JSON`,
		},
		memoryManager: mm,
	}

	w.ExtractAndStore("测试内容", "小明", "u1", "好的", "bot", "s1", "lunar", "g1")

	count, _ := mm.store.Count()
	if count != 0 {
		t.Errorf("invalid JSON should not store, got %d fragments", count)
	}
}

func TestPersonFactWriterEmptySenderName(t *testing.T) {
	mm, cleanup := setupWritebackTest(t)
	defer cleanup()

	w := &PersonFactWriter{
		llmProvider: &fakeLLMProvider{
			response: `["fact"]`,
		},
		memoryManager: mm,
	}

	w.ExtractAndStore("some content", "", "", "bot reply", "bot", "s1", "lunar", "g1")

	count, _ := mm.store.Count()
	if count != 0 {
		t.Errorf("empty sender name and id should not store, got %d fragments", count)
	}
}

func TestNewPersonFactWriter(t *testing.T) {
	mm, cleanup := setupWritebackTest(t)
	defer cleanup()

	provider := &fakeLLMProvider{}
	w := NewPersonFactWriter(provider, mm)

	if w.llmProvider != provider {
		t.Error("llmProvider should match")
	}
	if w.memoryManager != mm {
		t.Error("memoryManager should match")
	}
}

func TestPersonFactWriterDedup(t *testing.T) {
	mm, cleanup := setupWritebackTest(t)
	defer cleanup()

	w := &PersonFactWriter{
		llmProvider: &fakeLLMProvider{
			response: `["他喜欢打游戏"]`,
		},
		memoryManager: mm,
	}

	w.ExtractAndStore("我喜欢打游戏", "小明", "u1", "好的", "bot", "s1", "lunar", "g1")
	w.ExtractAndStore("我喜欢打游戏", "小明", "u1", "好的", "bot", "s1", "lunar", "g1")

	count, _ := mm.store.Count()
	if count != 1 {
		t.Errorf("duplicate facts should be deduplicated, got %d", count)
	}
}

func TestPersonFactWriterLLMError(t *testing.T) {
	mm, cleanup := setupWritebackTest(t)
	defer cleanup()

	w := &PersonFactWriter{
		llmProvider: &fakeLLMProvider{
			err: json.Unmarshal([]byte(`{`), &struct{}{}),
		},
		memoryManager: mm,
	}

	w.ExtractAndStore("test content", "小明", "u1", "bot reply", "bot", "s1", "lunar", "g1")

	count, _ := mm.store.Count()
	if count != 0 {
		t.Errorf("LLM error should not store, got %d fragments", count)
	}
}

func TestParseFactListResponseWithNewlines(t *testing.T) {
	w := &PersonFactWriter{}
	facts := w.parseFactList("```json\n[\"他叫小明\", \"他18岁\"]\n```")
	if len(facts) != 2 {
		t.Fatalf("expected 2 facts, got %d: %v", len(facts), facts)
	}
}

func TestParseFactListResponseWithSpaces(t *testing.T) {
	w := &PersonFactWriter{}
	response := `  ["他喜欢打游戏"]  `
	facts := w.parseFactList(response)
	if len(facts) != 1 {
		t.Fatalf("expected 1 fact, got %d: %v", len(facts), facts)
	}
}

func TestPersonFactWriterTrimmedFacts(t *testing.T) {
	mm, cleanup := setupWritebackTest(t)
	defer cleanup()

	w := &PersonFactWriter{
		llmProvider: &fakeLLMProvider{
			response: `["  他喜欢打游戏  ", "", "  他养了猫  "]`,
		},
		memoryManager: mm,
	}

	w.ExtractAndStore("content", "小明", "u1", "bot reply", "bot", "s1", "lunar", "g1")

	count, _ := mm.store.Count()
	if count != 2 {
		t.Fatalf("expected 2 facts (empty string skipped), got %d", count)
	}
}

func TestParseFactListNestedBrackets(t *testing.T) {
	w := &PersonFactWriter{}
	response := `["他说[某某]很好看"]`
	facts := w.parseFactList(response)
	if len(facts) != 1 {
		t.Fatalf("expected 1 fact, got %d: %v", len(facts), facts)
	}
	if !strings.Contains(facts[0], "[某某]") {
		t.Errorf("fact should contain nested brackets, got: %s", facts[0])
	}
}

func TestLooksEphemeral(t *testing.T) {
	tests := []struct {
		text     string
		expected bool
	}{
		{"哈哈", true},
		{"好的", true},
		{"收到", true},
		{"嗯嗯", true},
		{"晚安", true},
		{"早安", true},
		{"拜拜", true},
		{"谢谢", true},
		{"在吗", true},
		{"？", true},
		{"", true},
		{"   ", true},
		{"今天天气真好", false},
		{"我喜欢打游戏", false},
		{"我是程序员，住在北京", false},
	}
	for _, tc := range tests {
		result := looksEphemeral(tc.text)
		if result != tc.expected {
			t.Errorf("looksEphemeral(%q) = %v, want %v", tc.text, result, tc.expected)
		}
	}
}

type countingFakeLLMProvider struct {
	response string
	err      error
	calls    atomic.Int32
}

func (f *countingFakeLLMProvider) Chat(messages []llm.ChatMessage) (string, error) {
	f.calls.Add(1)
	if f.err != nil {
		return "", f.err
	}
	return f.response, nil
}

func (f *countingFakeLLMProvider) ChatEx(messages []llm.ChatMessage) (*llm.ChatResponse, error) {
	f.calls.Add(1)
	if f.err != nil {
		return nil, f.err
	}
	return &llm.ChatResponse{Content: f.response}, nil
}

func (f *countingFakeLLMProvider) Name() string { return "counting_fake" }

func (f *countingFakeLLMProvider) HealthCheck(ctx context.Context) error { return nil }

func setupPeriodicWriterTest(t *testing.T) (*MemoryManager, *countingFakeLLMProvider, func()) {
	t.Helper()

	dir := t.TempDir()
	dbPath := filepath.Join(dir, "test.db")

	db, err := sql.Open("sqlite3", dbPath+"?_busy_timeout=5000")
	if err != nil {
		t.Fatalf("open db: %v", err)
	}

	_, err = db.Exec(`
		CREATE TABLE memory_fragments (
			id TEXT PRIMARY KEY,
			session_id TEXT NOT NULL,
			platform TEXT NOT NULL DEFAULT '',
			group_id TEXT DEFAULT '',
			user_id TEXT DEFAULT '',
			content TEXT NOT NULL,
			source_kind TEXT NOT NULL DEFAULT 'chat_message',
			hash_value TEXT NOT NULL,
			keywords TEXT DEFAULT '',
			metadata TEXT DEFAULT '{}',
			emotional_tone TEXT DEFAULT '',
			access_count INTEGER DEFAULT 0,
			last_access_at DATETIME,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			expires_at DATETIME
		)
	`)
	if err != nil {
		t.Fatalf("create table: %v", err)
	}

	store := NewMemoryStore(db)
	vs := NewVectorStore(4)
	ii := NewInvertedIndex()
	fr := NewFusionRetriever(vs, ii, nil)

	mm := &MemoryManager{
		embedder:        makeFakeEmbedder(),
		store:           store,
		vectorStore:     vs,
		invertedIndex:   ii,
		fusionRetriever: fr,
		cfg: config.MemoryConfig{
			Enabled:      true,
			MaxFragments: 100,
			TopK:         5,
			SearchMode:   "hybrid",
			Writeback: config.MemoryWritebackConfig{
				Enabled:            true,
				ChatSummaryEnabled: true,
			},
		},
		stopCh: make(chan struct{}),
		doneCh: make(chan struct{}),
	}

	provider := &countingFakeLLMProvider{
		response: `{"long_summary":"群友们讨论了天气和周末计划。","brief":"天气与周末计划","keywords":["天气","周末"]}`,
	}

	cleanup := func() {
		db.Close()
		os.Remove(filepath.Join(dir, "vectors.json"))
	}

	return mm, provider, cleanup
}

func TestNewPeriodicMemoryWriter(t *testing.T) {
	mm, provider, cleanup := setupPeriodicWriterTest(t)
	defer cleanup()

	w := NewPeriodicMemoryWriter(provider, mm, 50, 10000)
	if w.triggerCount != 50 {
		t.Errorf("triggerCount: want 50, got %d", w.triggerCount)
	}
	if w.llmProvider != provider {
		t.Error("llmProvider should match")
	}
}

func TestNewPeriodicMemoryWriterDefaults(t *testing.T) {
	mm, provider, cleanup := setupPeriodicWriterTest(t)
	defer cleanup()

	w := NewPeriodicMemoryWriter(provider, mm, 0, 0)
	if w.triggerCount != 50 {
		t.Errorf("default triggerCount: want 50, got %d", w.triggerCount)
	}
	if w.maxInputChars != MaxSummaryInputChars {
		t.Errorf("default maxInputChars: want %d, got %d", MaxSummaryInputChars, w.maxInputChars)
	}
}

func TestPeriodicMemoryWriterNilProvider(t *testing.T) {
	mm, _, cleanup := setupPeriodicWriterTest(t)
	defer cleanup()

	w := NewPeriodicMemoryWriter(nil, mm, 1, 1000)
	w.OnMessage("s1", "lunar", "g1", 10, "测试对话内容")

	time.Sleep(50 * time.Millisecond)

	count, _ := mm.store.Count()
	if count != 0 {
		t.Errorf("nil provider should not store, got %d fragments", count)
	}
}

func TestPeriodicMemoryWriterNilManager(t *testing.T) {
	provider := &countingFakeLLMProvider{response: `{"long_summary":"摘要"}`}
	w := NewPeriodicMemoryWriter(provider, nil, 1, 1000)
	w.OnMessage("s1", "lunar", "g1", 10, "测试对话内容")

	time.Sleep(50 * time.Millisecond)

	if provider.calls.Load() != 0 {
		t.Error("nil manager should not call LLM")
	}
}

func TestPeriodicMemoryWriterEmptyContext(t *testing.T) {
	mm, provider, cleanup := setupPeriodicWriterTest(t)
	defer cleanup()

	w := NewPeriodicMemoryWriter(provider, mm, 1, 1000)
	w.OnMessage("s1", "lunar", "g1", 10, "")
	w.OnMessage("s1", "lunar", "g1", 10, "  ")

	time.Sleep(50 * time.Millisecond)

	count, _ := mm.store.Count()
	if count != 0 {
		t.Errorf("empty context should not store, got %d fragments", count)
	}
}

func TestPeriodicMemoryWriterBelowThreshold(t *testing.T) {
	mm, provider, cleanup := setupPeriodicWriterTest(t)
	defer cleanup()

	w := NewPeriodicMemoryWriter(provider, mm, 5, 1000)

	w.OnMessage("s1", "lunar", "g1", 4, "4条消息的上下文")
	time.Sleep(100 * time.Millisecond)

	if provider.calls.Load() != 0 {
		t.Errorf("below threshold should not call LLM, got %d calls", provider.calls.Load())
	}
}

func TestPeriodicMemoryWriterThresholdHit(t *testing.T) {
	mm, provider, cleanup := setupPeriodicWriterTest(t)
	defer cleanup()

	w := NewPeriodicMemoryWriter(provider, mm, 3, 1000)

	w.OnMessage("s1", "lunar", "g1", 3, "3条消息的上下文")

	time.Sleep(100 * time.Millisecond)

	if provider.calls.Load() != 1 {
		t.Fatalf("expected 1 LLM call at threshold, got %d", provider.calls.Load())
	}

	count, _ := mm.store.Count()
	if count != 1 {
		t.Fatalf("expected 1 summary stored, got %d", count)
	}

	frags, _ := mm.store.QueryBySession("s1", string(SourceChatSummary), 10)
	if len(frags) != 1 {
		t.Fatalf("expected 1 chat summary fragment, got %d", len(frags))
	}
}

func TestPeriodicMemoryWriterNoDuplicateSummary(t *testing.T) {
	mm, provider, cleanup := setupPeriodicWriterTest(t)
	defer cleanup()

	w := NewPeriodicMemoryWriter(provider, mm, 3, 1000)

	w.OnMessage("s1", "lunar", "g1", 3, "上下文1")
	time.Sleep(80 * time.Millisecond)

	w.OnMessage("s1", "lunar", "g1", 3, "上下文2")
	time.Sleep(80 * time.Millisecond)

	if provider.calls.Load() != 1 {
		t.Fatalf("should not trigger again for same count, got %d calls", provider.calls.Load())
	}
}

func TestPeriodicMemoryWriterMultipleCycles(t *testing.T) {
	mm, provider, cleanup := setupPeriodicWriterTest(t)
	defer cleanup()

	w := NewPeriodicMemoryWriter(provider, mm, 2, 1000)

	w.OnMessage("s1", "lunar", "g1", 2, "第1批")
	time.Sleep(80 * time.Millisecond)

	w.OnMessage("s1", "lunar", "g1", 4, "第2批")
	time.Sleep(80 * time.Millisecond)

	w.OnMessage("s1", "lunar", "g1", 6, "第3批")
	time.Sleep(80 * time.Millisecond)

	if provider.calls.Load() != 3 {
		t.Fatalf("expected 3 LLM calls, got %d", provider.calls.Load())
	}
}

func TestPeriodicMemoryWriterSeparateSessions(t *testing.T) {
	mm, provider, cleanup := setupPeriodicWriterTest(t)
	defer cleanup()

	w := NewPeriodicMemoryWriter(provider, mm, 2, 1000)

	w.OnMessage("s1", "lunar", "g1", 2, "s1上下文")
	time.Sleep(80 * time.Millisecond)

	provider.response = `{"long_summary":"另一段摘要：讨论了学习计划","brief":"学习计划","keywords":["学习"]}`
	w.OnMessage("s2", "lunar", "g1", 2, "s2上下文")
	time.Sleep(100 * time.Millisecond)

	if provider.calls.Load() != 2 {
		t.Fatalf("expected 2 LLM calls (1 per session), got %d", provider.calls.Load())
	}

	frags, _ := mm.store.QueryBySession("s1", string(SourceChatSummary), 10)
	if len(frags) != 1 {
		t.Errorf("session s1 should have 1 summary, got %d", len(frags))
	}
	frags, _ = mm.store.QueryBySession("s2", string(SourceChatSummary), 10)
	if len(frags) != 1 {
		t.Errorf("session s2 should have 1 summary, got %d", len(frags))
	}
}

func TestPeriodicMemoryWriterLLMError(t *testing.T) {
	mm, _, cleanup := setupPeriodicWriterTest(t)
	defer cleanup()

	errProvider := &countingFakeLLMProvider{
		err: json.Unmarshal([]byte(`{`), &struct{}{}),
	}
	w := NewPeriodicMemoryWriter(errProvider, mm, 1, 1000)
	w.OnMessage("s1", "lunar", "g1", 1, "测试内容")

	time.Sleep(50 * time.Millisecond)

	count, _ := mm.store.Count()
	if count != 0 {
		t.Errorf("LLM error should not store, got %d fragments", count)
	}
}

func TestPeriodicMemoryWriterContextTruncation(t *testing.T) {
	mm, provider, cleanup := setupPeriodicWriterTest(t)
	defer cleanup()

	w := NewPeriodicMemoryWriter(provider, mm, 1, 2)

	longContent := strings.Repeat("这是一条很长的消息内容", 100)

	w.OnMessage("s1", "lunar", "g1", 1, longContent)

	time.Sleep(50 * time.Millisecond)

	count, _ := mm.store.Count()
	if count != 1 {
		t.Fatalf("expected 1 summary stored after truncation, got %d", count)
	}
}

func TestPeriodicMemoryWriterConcurrent(t *testing.T) {
	mm, provider, cleanup := setupPeriodicWriterTest(t)
	defer cleanup()

	w := NewPeriodicMemoryWriter(provider, mm, 10, 1000)

	var wg sync.WaitGroup
	for g := 0; g < 5; g++ {
		wg.Add(1)
		go func(gid int) {
			defer wg.Done()
			for i := 0; i < 20; i++ {
				w.OnMessage("s1", "lunar", "g1", 100, "并发消息")
			}
		}(g)
	}
	wg.Wait()

	time.Sleep(200 * time.Millisecond)

	count, _ := mm.store.Count()
	t.Logf("concurrent test: %d summaries stored, %d LLM calls", count, provider.calls.Load())
	if count == 0 {
		t.Error("expected at least some summaries from concurrent writes")
	}
}

func TestPeriodicMemoryWriterParseSummary(t *testing.T) {
	mm, provider, cleanup := setupPeriodicWriterTest(t)
	defer cleanup()

	w := NewPeriodicMemoryWriter(provider, mm, 1, 1000)

	summary, _ := w.parseSummary(`{"long_summary":"用户讨论了草莓蛋糕的做法","brief":"草莓蛋糕讨论","keywords":["蛋糕","草莓"]}`)
	if summary == "" {
		t.Fatal("valid summary should not be empty")
	}
	if !strings.Contains(summary, "草莓蛋糕") {
		t.Errorf("summary should contain content: %s", summary)
	}
}

func TestPeriodicMemoryWriterParseSummaryInvalid(t *testing.T) {
	mm, provider, cleanup := setupPeriodicWriterTest(t)
	defer cleanup()

	w := NewPeriodicMemoryWriter(provider, mm, 1, 1000)

	summary, _ := w.parseSummary(`not json at all`)
	if summary != "" {
		t.Errorf("invalid JSON should return empty, got: %s", summary)
	}
}
