package knowledge

import (
	"database/sql"
	"fmt"
	"math"
	"sort"
	"strings"
)

// Logger knowledge 模块所需日志接口
type Logger interface {
	Infow(msg string, keysAndValues ...any)
	Warnw(msg string, keysAndValues ...any)
}

// noopLogger 空日志实现，用于未初始化时的默认值
type noopLogger struct{}

func (noopLogger) Infow(msg string, keysAndValues ...any) {}
func (noopLogger) Warnw(msg string, keysAndValues ...any) {}

var log Logger = noopLogger{}

// Embedder 向量嵌入器接口
type Embedder interface {
	Embed(text string) ([]float32, error)
}

// Init 初始化 knowledge 模块
func Init(l Logger) {
	log = l
}

// Manager 备忘录管理器，统一管理手动导入和文档导入的条目
type Manager struct {
	store    *Store
	embedder Embedder
}

// DefaultManager 全局默认备忘录管理器
var DefaultManager *Manager

// InitManager 初始化备忘录管理器
func InitManager(db *sql.DB, embedder Embedder) *Manager {
	mgr := &Manager{
		store:    NewStore(db),
		embedder: embedder,
	}
	DefaultManager = mgr
	return mgr
}

// AddEntry 手动添加条目（单句导入）
func (m *Manager) AddEntry(content string, tags []string) (*Entry, error) {
	entry, err := m.store.Add(content, tags, "manual")
	if err != nil {
		return nil, err
	}

	// 异步生成向量嵌入
	if m.embedder != nil {
		go m.generateEmbedding(entry.ID, content)
	}

	log.Infow("[备忘录] 添加", "id", entry.ID, "content", truncate(content, 50))
	return entry, nil
}

// UpdateEntry 更新条目
func (m *Manager) UpdateEntry(id int64, content string, tags []string) (*Entry, error) {
	entry, err := m.store.Update(id, content, tags)
	if err != nil {
		return nil, err
	}

	// 重新生成向量嵌入
	if m.embedder != nil {
		go m.generateEmbedding(id, content)
	}

	log.Infow("[备忘录] 更新", "id", id, "content", truncate(content, 50))
	return entry, nil
}

// DeleteEntry 删除条目
func (m *Manager) DeleteEntry(id int64) error {
	if err := m.store.Delete(id); err != nil {
		return err
	}
	log.Infow("[备忘录] 删除", "id", id)
	return nil
}

// GetEntry 获取单个条目
func (m *Manager) GetEntry(id int64) (*Entry, error) {
	return m.store.GetByID(id)
}

// ListEntries 列出条目
func (m *Manager) ListEntries(offset, limit int) ([]*Entry, int, error) {
	return m.store.List(offset, limit)
}

// SearchByKeyword 按关键词搜索
func (m *Manager) SearchByKeyword(keyword string, limit int) ([]*Entry, error) {
	return m.store.SearchByKeyword(keyword, limit)
}

const minSimilarityThreshold float32 = 0.3

// SearchSemantic 语义搜索（使用向量相似度）
// 先用关键词搜索缩小候选集，再计算向量相似度，避免全量遍历
func (m *Manager) SearchSemantic(query string, topK int) ([]*Entry, error) {
	if m.embedder == nil {
		return m.SearchByKeyword(query, topK)
	}

	// 生成查询向量
	queryVec, err := m.embedder.Embed(query)
	if err != nil {
		log.Warnw("[备忘录] 生成查询向量失败，回退到关键词搜索", "error", err)
		return m.SearchByKeyword(query, topK)
	}

	// 先用关键词搜索预过滤候选集（取3倍topK作为候选池，减少向量计算量）
	candidates, err := m.store.SearchByKeyword(query, topK*3)
	if err != nil {
		log.Warnw("[备忘录] 关键词预过滤失败，回退到全量搜索", "error", err)
		candidates = nil
	}

	type scoredEntry struct {
		entry *Entry
		score float32
	}
	var scored []scoredEntry
	seen := make(map[int64]bool)

	// 优先对关键词候选集计算相似度
	for _, entry := range candidates {
		if len(entry.Embedding) == 0 {
			continue
		}
		score := cosineSimilarity(queryVec, entry.Embedding)
		if score >= minSimilarityThreshold {
			scored = append(scored, scoredEntry{entry: entry, score: score})
			seen[entry.ID] = true
		}
	}

	// 如果关键词候选不够 topK，补全全量扫描
	if len(scored) < topK {
		allEntries, err := m.store.GetAll()
		if err == nil {
			for _, entry := range allEntries {
				if seen[entry.ID] || len(entry.Embedding) == 0 {
					continue
				}
				score := cosineSimilarity(queryVec, entry.Embedding)
				if score >= minSimilarityThreshold {
					scored = append(scored, scoredEntry{entry: entry, score: score})
				}
			}
		}
	}

	// 按分数降序排序
	sort.Slice(scored, func(i, j int) bool {
		return scored[i].score > scored[j].score
	})

	// 取 topK
	if topK > len(scored) {
		topK = len(scored)
	}
	result := make([]*Entry, topK)
	for i := 0; i < topK; i++ {
		result[i] = scored[i].entry
	}

	return result, nil
}

// generateEmbedding 为条目生成向量嵌入
func (m *Manager) generateEmbedding(id int64, content string) {
	if m.embedder == nil {
		return
	}
	vec, err := m.embedder.Embed(content)
	if err != nil {
		log.Warnw("[备忘录] 生成嵌入失败", "id", id, "error", err)
		return
	}
	if err := m.store.UpdateEmbedding(id, vec); err != nil {
		log.Warnw("[备忘录] 存储嵌入失败", "id", id, "error", err)
		return
	}
	log.Infow("[备忘录] 嵌入生成完成", "id", id, "dimensions", len(vec))
}

// FormatForLLM 格式化条目为 LLM 上下文
func FormatForLLM(entries []*Entry) string {
	if len(entries) == 0 {
		return ""
	}
	var sb strings.Builder
	for i, entry := range entries {
		sb.WriteString(fmt.Sprintf("%d. %s", i+1, entry.Content))
		if len(entry.Tags) > 0 {
			sb.WriteString(fmt.Sprintf(" [标签: %s]", strings.Join(entry.Tags, ", ")))
		}
		sb.WriteString("\n")
	}
	return sb.String()
}

func truncate(s string, maxLen int) string {
	runes := []rune(s)
	if len(runes) <= maxLen {
		return s
	}
	return string(runes[:maxLen]) + "..."
}

func cosineSimilarity(a, b []float32) float32 {
	if len(a) != len(b) || len(a) == 0 {
		return 0
	}
	var dot, normA, normB float64
	for i := range a {
		dot += float64(a[i]) * float64(b[i])
		normA += float64(a[i]) * float64(a[i])
		normB += float64(b[i]) * float64(b[i])
	}
	if normA == 0 || normB == 0 {
		return 0
	}
	return float32(dot / (math.Sqrt(normA) * math.Sqrt(normB)))
}
