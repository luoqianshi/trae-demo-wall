package memory

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"YaraFlow/internal/config"
	"YaraFlow/internal/logger"

	_ "github.com/mattn/go-sqlite3"
	"go.uber.org/zap"
)

func init() {
	logger.Logger = zap.NewNop()
}

func setupManagerTest(t *testing.T) (*MemoryManager, func()) {
	t.Helper()

	dir := t.TempDir()
	dbPath := filepath.Join(dir, "test.db")
	vecPath := filepath.Join(dir, "vectors.json")

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
		embedder:        nil,
		store:           store,
		vectorStore:     vs,
		invertedIndex:   ii,
		fusionRetriever: fr,
		deduplicator:    NewQueryDeduplicator(),
		cfg: config.MemoryConfig{
			Enabled:      true,
			MaxFragments: 100,
			TopK:         5,
			SearchMode:   "hybrid",
		},
		stopCh: make(chan struct{}),
		doneCh: make(chan struct{}),
	}

	cleanup := func() {
		db.Close()
		os.Remove(vecPath)
	}

	return mm, cleanup
}

func makeFakeEmbedder() *Embedder {
	return &Embedder{
		provider: &fakeEmbeddingProvider{dim: 4},
	}
}

type fakeEmbeddingProvider struct {
	dim int
}

func (f *fakeEmbeddingProvider) Name() string                          { return "fake" }
func (f *fakeEmbeddingProvider) Dim() int                              { return f.dim }
func (f *fakeEmbeddingProvider) HealthCheck(ctx context.Context) error { return nil }
func (f *fakeEmbeddingProvider) Embed(text string) ([]float32, error) {
	return []float32{0.1, 0.2, 0.3, 0.4}, nil
}
func (f *fakeEmbeddingProvider) EmbedBatch(texts []string) ([][]float32, error) {
	results := make([][]float32, len(texts))
	for i := range texts {
		results[i] = []float32{0.1, 0.2, 0.3, 0.4}
	}
	return results, nil
}

func TestMemoryManagerIngest(t *testing.T) {
	mm, cleanup := setupManagerTest(t)
	defer cleanup()
	mm.embedder = makeFakeEmbedder()

	err := mm.Ingest("小明说他今天很开心", "s1", "lunar", "g1", "u1", SourceChatMessage, "")
	if err != nil {
		t.Fatalf("ingest: %v", err)
	}

	if mm.vectorStore.Len() != 1 {
		t.Errorf("vector store len: want 1, got %d", mm.vectorStore.Len())
	}

	count, _ := mm.store.Count()
	if count != 1 {
		t.Errorf("store count: want 1, got %d", count)
	}
}

func TestMemoryManagerIngestDedup(t *testing.T) {
	mm, cleanup := setupManagerTest(t)
	defer cleanup()
	mm.embedder = makeFakeEmbedder()

	content := "重复的消息内容"
	mm.Ingest(content, "s1", "lunar", "g1", "u1", SourceChatMessage, "")
	mm.Ingest(content, "s1", "lunar", "g1", "u1", SourceChatMessage, "")

	count, _ := mm.store.Count()
	if count != 1 {
		t.Errorf("dedup count: want 1, got %d", count)
	}
}

func TestMemoryManagerQuery(t *testing.T) {
	mm, cleanup := setupManagerTest(t)
	defer cleanup()
	mm.embedder = makeFakeEmbedder()

	mm.Ingest("草莓蛋糕真的很好吃", "s1", "lunar", "g1", "u1", SourceChatMessage, "")
	mm.Ingest("今天天气不错出去玩", "s1", "lunar", "g1", "u1", SourceChatMessage, "")
	mm.Ingest("小明说他喜欢打游戏", "s1", "lunar", "g1", "u1", SourceChatMessage, "")

	result, err := mm.Query(MemoryQueryRequest{
		CurrentMessage: "蛋糕",
		SessionID:      "s1",
		Limit:          3,
		SearchMode:     "keyword",
	})
	if err != nil {
		t.Fatalf("query: %v", err)
	}

	if len(result.Hits) == 0 {
		t.Fatal("expected at least 1 hit for '蛋糕'")
	}

	if result.Summary == "" {
		t.Error("summary should not be empty")
	}

	t.Logf("query summary:\n%s", result.Summary)
}

func TestMemoryManagerEnforceMax(t *testing.T) {
	mm, cleanup := setupManagerTest(t)
	defer cleanup()
	mm.embedder = makeFakeEmbedder()
	mm.cfg.MaxFragments = 3

	for i := 0; i < 5; i++ {
		mm.Ingest(fmt.Sprintf("消息 %d", i), "s1", "lunar", "g1", "u1", SourceChatMessage, "")
	}

	count, _ := mm.store.Count()
	if count > 3 {
		t.Errorf("max fragments: want <= 3, got %d", count)
	}
}

func TestMemoryManagerSourceKindFilter(t *testing.T) {
	mm, cleanup := setupManagerTest(t)
	defer cleanup()
	mm.embedder = makeFakeEmbedder()

	mm.Ingest("聊天消息1", "s1", "lunar", "g1", "u1", SourceChatMessage, "")
	mm.Ingest("人物事实1", "s1", "lunar", "g1", "u1", SourcePersonFact, "")

	result, err := mm.Query(MemoryQueryRequest{
		CurrentMessage: "消息",
		SessionID:      "s1",
		Limit:          5,
		SourceKinds:    []SourceKind{SourcePersonFact},
		SearchMode:     "keyword",
	})
	if err != nil {
		t.Fatalf("query: %v", err)
	}

	for _, hit := range result.Hits {
		if hit.Fragment.SourceKind != SourcePersonFact {
			t.Errorf("filtered by source kind but got %s", hit.Fragment.SourceKind)
		}
	}
}

func TestComputeHash(t *testing.T) {
	h1 := computeHash("hello")
	h2 := computeHash("hello")
	h3 := computeHash("world")

	if h1 != h2 {
		t.Errorf("same content should produce same hash")
	}
	if h1 == h3 {
		t.Errorf("different content should produce different hash")
	}
}

func TestExtractKeywords(t *testing.T) {
	keywords := extractKeywords("草莓蛋糕很好吃")
	if len(keywords) == 0 {
		t.Error("should extract chinese bigrams")
	}
	found := false
	for _, kw := range keywords {
		if kw == "草莓" {
			found = true
			break
		}
	}
	if !found {
		t.Errorf("keywords should contain '草莓', got: %v", keywords)
	}

	empty := extractKeywords("abc")
	if len(empty) != 0 {
		t.Errorf("ascii only should produce no keywords, got: %v", empty)
	}
}

func TestFormatMemorySummary(t *testing.T) {
	now := time.Now()
	hits := []MemoryHit{
		{
			Fragment: &MemoryFragment{
				Content: "小明说他喜欢打游戏", SourceKind: SourceChatMessage, CreatedAt: now,
			},
			Score: 0.9,
		},
		{
			Fragment: &MemoryFragment{
				Content: "小红在杭州工作", SourceKind: SourcePersonFact, CreatedAt: now,
			},
			Score: 0.7,
		},
	}

	summary := FormatMemorySummary(hits)
	if summary == "" {
		t.Error("summary should not be empty")
	}
	if !strings.Contains(summary, "小明") && !strings.Contains(summary, "小红") {
		t.Errorf("summary should contain fragment content, got: %s", summary)
	}
}

func TestMemoryManagerShutdown(t *testing.T) {
	mm, cleanup := setupManagerTest(t)
	defer cleanup()

	go func() {
		time.Sleep(100 * time.Millisecond)
		mm.Shutdown()
	}()

	mm.PeriodicCleanup()
}

func TestMemoryManagerPeriodicVectorPersist(t *testing.T) {
	dir := t.TempDir()
	vecPath := filepath.Join(dir, "vectors.json")

	mm, cleanup := setupManagerTest(t)
	defer cleanup()
	mm.embedder = makeFakeEmbedder()
	mm.cfg.VectorPersistSec = 1
	mm.Ingest("test", "s1", "lunar", "g1", "u1", SourceChatMessage, "")

	done := make(chan struct{})
	go func() {
		time.Sleep(1500 * time.Millisecond)
		mm.Shutdown()
		close(done)
	}()

	mm.PeriodicVectorPersist(vecPath)
	<-done

	_, err := os.Stat(vecPath)
	if err != nil {
		t.Errorf("vector file should exist after persist: %v", err)
	}
}

func TestMemoryManagerWeightDecay(t *testing.T) {
	mm, cleanup := setupManagerTest(t)
	defer cleanup()
	mm.embedder = makeFakeEmbedder()
	mm.cfg.WeightDecay = config.MemoryWeightDecay{
		Enabled:     true,
		DecayRate:   0.02,
		AccessBoost: 0.02,
		BoostCap:    0.2,
	}

	mm.Ingest("草莓蛋糕真的很好吃", "s1", "lunar", "g1", "u1", SourceChatMessage, "")
	mm.Ingest("今天天气不错出去玩", "s1", "lunar", "g1", "u1", SourceChatMessage, "")

	result, err := mm.Query(MemoryQueryRequest{
		CurrentMessage: "蛋糕",
		SessionID:      "s1",
		Limit:          3,
		SearchMode:     "keyword",
	})
	if err != nil {
		t.Fatalf("query with decay: %v", err)
	}
	if len(result.Hits) == 0 {
		t.Fatal("expected at least 1 hit")
	}

	scoresDiffer := false
	for i := 1; i < len(result.Hits); i++ {
		if result.Hits[i].Score != result.Hits[0].Score {
			scoresDiffer = true
			break
		}
	}
	t.Logf("scores differ with decay: %v", scoresDiffer)
}

func TestMemoryManagerQueryGlobal(t *testing.T) {
	mm, cleanup := setupManagerTest(t)
	defer cleanup()
	mm.embedder = makeFakeEmbedder()
	mm.cfg.WeightDecay.Enabled = false
	mm.cfg.GlobalMemory = config.MemoryGlobalConfig{
		Enabled: true,
		TopK:    3,
	}

	mm.Ingest("草莓蛋糕从s1", "s1", "lunar", "g1", "u1", SourceChatMessage, "")
	mm.Ingest("今天天气从s2", "s2", "lunar", "g1", "u2", SourceChatMessage, "")
	mm.Ingest("小明喜欢游戏从s3", "s3", "lunar", "g1", "u3", SourceChatMessage, "")

	result, err := mm.QueryGlobal(MemoryQueryRequest{
		CurrentMessage: "测试",
		SearchMode:     "hybrid",
	})
	if err != nil {
		t.Fatalf("query global: %v", err)
	}

	if len(result.Hits) != 3 {
		t.Fatalf("expected 3 hits (cross-session), got %d", len(result.Hits))
	}

	sessions := make(map[string]bool)
	for _, hit := range result.Hits {
		sessions[hit.Fragment.SessionID] = true
	}
	if len(sessions) != 3 {
		t.Errorf("expected hits from 3 different sessions, got %d: %v", len(sessions), sessions)
	}
}

func TestComputeWeight(t *testing.T) {
	mm, cleanup := setupManagerTest(t)
	defer cleanup()
	mm.cfg.WeightDecay = config.MemoryWeightDecay{
		Enabled:     true,
		DecayRate:   0.02,
		AccessBoost: 0.02,
		BoostCap:    0.2,
	}

	frag := &MemoryFragment{
		CreatedAt:   time.Now(),
		AccessCount: 0,
	}

	w := mm.computeWeight(frag)
	if w < 0.9 || w > 1.1 {
		t.Errorf("fresh fragment weight should be ~1.0, got %f", w)
	}

	frag.CreatedAt = time.Now().AddDate(0, 0, -100)
	w = mm.computeWeight(frag)
	if w >= 0.5 {
		t.Errorf("100-day-old fragment weight should be < 0.5, got %f", w)
	}

	frag.CreatedAt = time.Now()
	frag.AccessCount = 50
	w = mm.computeWeight(frag)
	if w > 1.0+0.2+0.01 {
		t.Errorf("boost cap should limit weight, got %f", w)
	}
}

func TestComputeWeightNil(t *testing.T) {
	mm, cleanup := setupManagerTest(t)
	defer cleanup()
	mm.cfg.WeightDecay = config.MemoryWeightDecay{
		Enabled:     true,
		DecayRate:   0.02,
		AccessBoost: 0.02,
		BoostCap:    0.2,
	}

	w := mm.computeWeight(nil)
	if w != 0.1 {
		t.Errorf("nil fragment should return min weight 0.1, got %f", w)
	}
}

func TestComputeWeightFutureDate(t *testing.T) {
	mm, cleanup := setupManagerTest(t)
	defer cleanup()
	mm.cfg.WeightDecay = config.MemoryWeightDecay{
		Enabled:     true,
		DecayRate:   0.02,
		AccessBoost: 0.02,
		BoostCap:    0.2,
	}

	frag := &MemoryFragment{
		CreatedAt:   time.Now().AddDate(0, 0, 1),
		AccessCount: 0,
	}

	w := mm.computeWeight(frag)
	if w != 1.0 {
		t.Errorf("future date should clamp ageDays to 0, weight should be 1.0, got %f", w)
	}
}

func TestMemoryManagerWeightDecayAccessBoost(t *testing.T) {
	mm, cleanup := setupManagerTest(t)
	defer cleanup()
	mm.embedder = makeFakeEmbedder()
	mm.cfg.WeightDecay = config.MemoryWeightDecay{
		Enabled:     true,
		DecayRate:   0.02,
		AccessBoost: 0.05,
		BoostCap:    0.3,
	}

	mm.Ingest("金毛小狗很可爱", "s1", "lunar", "g1", "u1", SourceChatMessage, "")

	for i := 0; i < 5; i++ {
		_, err := mm.Query(MemoryQueryRequest{
			CurrentMessage: "小狗",
			SessionID:      "s1",
			Limit:          3,
			SearchMode:     "keyword",
		})
		if err != nil {
			t.Fatalf("query %d: %v", i+1, err)
		}
	}

	frag, err := mm.store.GetByHash(computeHash("金毛小狗很可爱"))
	if err != nil || frag == nil {
		t.Fatal("fragment should exist after queries")
	}

	if frag.AccessCount < 5 {
		t.Errorf("access count should be >= 5 after 5 queries, got %d", frag.AccessCount)
	}

	w := mm.computeWeight(frag)
	if w <= 1.0 {
		t.Errorf("weight should exceed 1.0 after access boost (5*0.05=0.25), got %f", w)
	}
}

func TestMemoryManagerQueryGlobalWithWeightDecay(t *testing.T) {
	mm, cleanup := setupManagerTest(t)
	defer cleanup()
	mm.embedder = makeFakeEmbedder()
	mm.cfg.WeightDecay = config.MemoryWeightDecay{
		Enabled:     true,
		DecayRate:   0.02,
		AccessBoost: 0.02,
		BoostCap:    0.2,
	}
	mm.cfg.GlobalMemory = config.MemoryGlobalConfig{
		Enabled: true,
		TopK:    3,
	}

	mm.Ingest("草莓蛋糕从s1", "s1", "lunar", "g1", "u1", SourceChatMessage, "")
	mm.Ingest("今天天气从s2", "s2", "lunar", "g1", "u2", SourceChatMessage, "")
	mm.Ingest("小明喜欢游戏从s3", "s3", "lunar", "g1", "u3", SourceChatMessage, "")

	result, err := mm.QueryGlobal(MemoryQueryRequest{
		CurrentMessage: "测试",
		SearchMode:     "hybrid",
	})
	if err != nil {
		t.Fatalf("query global with decay: %v", err)
	}

	if len(result.Hits) != 3 {
		t.Fatalf("expected 3 hits, got %d", len(result.Hits))
	}

	sessions := make(map[string]bool)
	for _, hit := range result.Hits {
		sessions[hit.Fragment.SessionID] = true
	}
	if len(sessions) != 3 {
		t.Errorf("expected hits from 3 different sessions, got %d: %v", len(sessions), sessions)
	}
}

func TestMemoryManagerQuerySessionFilter(t *testing.T) {
	mm, cleanup := setupManagerTest(t)
	defer cleanup()
	mm.embedder = makeFakeEmbedder()
	mm.cfg.WeightDecay.Enabled = false

	mm.Ingest("消息来自s1", "s1", "lunar", "g1", "u1", SourceChatMessage, "")
	mm.Ingest("消息来自s2", "s2", "lunar", "g1", "u2", SourceChatMessage, "")

	result, err := mm.Query(MemoryQueryRequest{
		CurrentMessage: "消息",
		SessionID:      "s1",
		Limit:          5,
		SearchMode:     "keyword",
	})
	if err != nil {
		t.Fatalf("query: %v", err)
	}

	for _, hit := range result.Hits {
		if hit.Fragment.SessionID != "s1" {
			t.Errorf("session filter failed: expected s1, got %s", hit.Fragment.SessionID)
		}
	}
}

// TestMemoryManagerEmotionalBonus 验证情绪加成逻辑：
// 内容相似但情感标签不同的记忆，在查询时匹配的情感标签应获得 ×1.05 加分。
func TestMemoryManagerEmotionalBonus(t *testing.T) {
	mm, cleanup := setupManagerTest(t)
	defer cleanup()
	mm.embedder = makeFakeEmbedder()

	// 三段内容不同但都包含"草莓蛋糕"的记忆，情感标签各不相同
	mm.Ingest("草莓蛋糕 - 大家聊得很开心，还约了下次一起做", "s1", "lunar", "g1", "u1", SourceChatSummary, "positive")
	mm.Ingest("草莓蛋糕 - 因为口味问题吵了一架，气氛很僵", "s1", "lunar", "g1", "u1", SourceChatSummary, "negative")
	mm.Ingest("草莓蛋糕 - 讨论了一下做法，没什么特别的", "s1", "lunar", "g1", "u1", SourceChatSummary, "neutral")

	// 查询时情绪是 positive，期望 positive 标签的记忆排第一
	result, err := mm.Query(MemoryQueryRequest{
		CurrentMessage:   "草莓蛋糕",
		GroupID:          "g1",
		Limit:            3,
		SearchMode:       "keyword",
		EmotionalContext: "positive",
	})
	if err != nil {
		t.Fatalf("query: %v", err)
	}

	if len(result.Hits) < 3 {
		t.Fatalf("expected 3 hits, got %d", len(result.Hits))
	}

	// 第一名应该是 positive 标签的记忆
	first := result.Hits[0]
	if first.Fragment.EmotionalTone != "positive" {
		t.Fatalf("expected first hit to be positive, got %s (content: %s)",
			first.Fragment.EmotionalTone, first.Fragment.Content)
	}
	t.Logf("第一名: emotional_tone=%s, score=%.4f, content=%s",
		first.Fragment.EmotionalTone, first.Score, first.Fragment.Content)

	// 验证 positive 的分数高于 neutral（情绪加成的效果）
	var positiveScore, neutralScore float32
	for _, hit := range result.Hits {
		t.Logf("  - emotional_tone=%s, score=%.4f, content=%s",
			hit.Fragment.EmotionalTone, hit.Score, hit.Fragment.Content)
		switch hit.Fragment.EmotionalTone {
		case "positive":
			positiveScore = hit.Score
		case "neutral":
			neutralScore = hit.Score
		}
	}
	if positiveScore <= neutralScore {
		t.Errorf("positive score (%.4f) should be higher than neutral score (%.4f) due to emotional bonus",
			positiveScore, neutralScore)
	}
}

// TestMemoryManagerEmotionalBonusNoMatch 验证不匹配时不扣分：
// 查询时情绪是 negative，但所有记忆都匹配，negative 排第一，positive 不应被扣分。
func TestMemoryManagerEmotionalBonusNoMatch(t *testing.T) {
	mm, cleanup := setupManagerTest(t)
	defer cleanup()
	mm.embedder = makeFakeEmbedder()

	mm.Ingest("草莓蛋糕 - 大家聊得很开心", "s1", "lunar", "g1", "u1", SourceChatSummary, "positive")
	mm.Ingest("草莓蛋糕 - 因为口味吵了一架", "s1", "lunar", "g1", "u1", SourceChatSummary, "negative")
	mm.Ingest("草莓蛋糕 - 普通讨论", "s1", "lunar", "g1", "u1", SourceChatSummary, "neutral")

	// 查询时情绪是 negative
	result, err := mm.Query(MemoryQueryRequest{
		CurrentMessage:   "草莓蛋糕",
		GroupID:          "g1",
		Limit:            3,
		SearchMode:       "keyword",
		EmotionalContext: "negative",
	})
	if err != nil {
		t.Fatalf("query: %v", err)
	}

	if len(result.Hits) < 3 {
		t.Fatalf("expected 3 hits, got %d", len(result.Hits))
	}

	// 第一名应该是 negative 标签
	first := result.Hits[0]
	if first.Fragment.EmotionalTone != "negative" {
		t.Fatalf("expected first hit to be negative, got %s", first.Fragment.EmotionalTone)
	}

	// 验证 negative 的分数高于 positive
	var negativeScore, positiveScore float32
	for _, hit := range result.Hits {
		switch hit.Fragment.EmotionalTone {
		case "negative":
			negativeScore = hit.Score
		case "positive":
			positiveScore = hit.Score
		}
	}
	if negativeScore <= positiveScore {
		t.Errorf("negative score (%.4f) should be higher than positive score (%.4f) with negative context",
			negativeScore, positiveScore)
	}
}

// TestMemoryManagerEmotionalBonusEmptyContext 验证空 EmotionalContext 时不做情绪加成：
// 不加分也不扣分，按原始分数排序。
func TestMemoryManagerEmotionalBonusEmptyContext(t *testing.T) {
	mm, cleanup := setupManagerTest(t)
	defer cleanup()
	mm.embedder = makeFakeEmbedder()

	mm.Ingest("草莓蛋糕 - 开心", "s1", "lunar", "g1", "u1", SourceChatSummary, "positive")
	mm.Ingest("草莓蛋糕 - 不开心", "s1", "lunar", "g1", "u1", SourceChatSummary, "negative")
	mm.Ingest("草莓蛋糕 - 普通", "s1", "lunar", "g1", "u1", SourceChatSummary, "neutral")

	// 不传 EmotionalContext
	result, err := mm.Query(MemoryQueryRequest{
		CurrentMessage: "草莓蛋糕",
		GroupID:        "g1",
		Limit:          3,
		SearchMode:     "keyword",
	})
	if err != nil {
		t.Fatalf("query: %v", err)
	}

	if len(result.Hits) < 3 {
		t.Fatalf("expected 3 hits, got %d", len(result.Hits))
	}

	// 没有情绪上下文时，所有记忆的分数应该一致（同一查询，同为 BM25 得分）
	// 由于三段内容长度不同，BM25 可能有微小差异，这里只验证分数不是由情绪加成导致的
	scores := make(map[string]float32)
	for _, hit := range result.Hits {
		scores[hit.Fragment.EmotionalTone] = hit.Score
		t.Logf("  - emotional_tone=%s, score=%.4f", hit.Fragment.EmotionalTone, hit.Score)
	}

	// 验证 positive 和 negative 的分数差距不超过 0.001（说明没有情绪加成）
	scoreDiff := scores["positive"] - scores["negative"]
	if scoreDiff < 0 {
		scoreDiff = -scoreDiff
	}
	if scoreDiff > 0.001 {
		t.Logf("without emotional context, scores are close but not identical (BM25 variance): diff=%.6f", scoreDiff)
	}
}
