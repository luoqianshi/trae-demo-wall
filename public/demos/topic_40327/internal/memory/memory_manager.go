package memory

import (
	"crypto/sha1"
	"encoding/hex"
	"fmt"
	"math"
	"regexp"
	"sort"
	"strings"
	"time"
	"unicode/utf8"

	"YaraFlow/internal/config"
	"YaraFlow/internal/logger"
)

type MemoryQueryRequest struct {
	CurrentMessage   string
	SessionID        string
	GroupID          string
	SenderID         string
	KeywordsText     string
	Limit            int
	SourceKinds      []SourceKind
	SearchMode       string
	EmotionalContext string
}

type MemoryHit struct {
	Fragment *MemoryFragment
	Score    float32
}

type MemoryQueryResult struct {
	Hits    []MemoryHit
	Summary string
}

type MemoryManager struct {
	embedder        *Embedder
	store           *MemoryStore
	vectorStore     *VectorStore
	invertedIndex   *InvertedIndex
	fusionRetriever *FusionRetriever
	cfg             config.MemoryConfig

	deduplicator *QueryDeduplicator

	stopCh chan struct{}
	doneCh chan struct{}
}

var DefaultManager *MemoryManager

func NewMemoryManager(embedder *Embedder, store *MemoryStore, vectorStore *VectorStore, cfg config.MemoryConfig) *MemoryManager {
	if cfg.WeightDecay.DecayRate <= 0 {
		cfg.WeightDecay.DecayRate = 0.02
	}
	if cfg.WeightDecay.AccessBoost <= 0 {
		cfg.WeightDecay.AccessBoost = 0.02
	}
	if cfg.WeightDecay.BoostCap <= 0 {
		cfg.WeightDecay.BoostCap = 0.2
	}
	if cfg.GlobalMemory.TopK <= 0 {
		cfg.GlobalMemory.TopK = 3
	}

	invertedIndex := NewInvertedIndex()
	graphStore := NewGraphStore()
	fusionRetriever := NewFusionRetriever(vectorStore, invertedIndex, graphStore)

	return &MemoryManager{
		embedder:        embedder,
		store:           store,
		vectorStore:     vectorStore,
		invertedIndex:   invertedIndex,
		fusionRetriever: fusionRetriever,
		cfg:             cfg,
		deduplicator:    NewQueryDeduplicator(),
		stopCh:          make(chan struct{}),
		doneCh:          make(chan struct{}),
	}
}

// GetEmbedder 获取嵌入器（供备忘录等模块复用）
func (mm *MemoryManager) GetEmbedder() *Embedder {
	return mm.embedder
}

// GetStats 获取内存统计信息
func (mm *MemoryManager) GetStats() (int, int, int, error) {
	count, err := mm.store.Count()
	if err != nil {
		return 0, 0, 0, err
	}
	vecLen := mm.vectorStore.Len()
	idxLen := mm.invertedIndex.Len()
	return count, vecLen, idxLen, nil
}

// DeleteByID 删除指定ID的记忆片段
func (mm *MemoryManager) DeleteByID(id string) error {
	if err := mm.store.DeleteByID(id); err != nil {
		return err
	}
	mm.vectorStore.Remove(id)
	mm.invertedIndex.Remove(id)
	return nil
}

// GetAllIDs 获取所有记忆片段ID
func (mm *MemoryManager) GetAllIDs() ([]string, error) {
	return mm.store.GetAllIDs()
}

// GetByIDs 批量获取记忆片段
func (mm *MemoryManager) GetByIDs(ids []string) (map[string]*MemoryFragment, error) {
	return mm.store.GetByIDs(ids)
}

func (mm *MemoryManager) Ingest(content, sessionID, platform, groupID, userID string, sourceKind SourceKind, emotionalTone string) error {
	hash := computeHash(content)

	existing, err := mm.store.GetByHash(hash)
	if err != nil {
		return fmt.Errorf("ingest check hash: %w", err)
	}
	if existing != nil {
		return nil
	}

	embedding, err := mm.embedder.Embed(content)
	if err != nil {
		return fmt.Errorf("ingest embed: %w", err)
	}

	id := hash
	now := time.Now()

	keywords := extractKeywords(content)

	var expiresAt *time.Time
	if mm.cfg.FragmentTTLDays > 0 {
		t := now.AddDate(0, 0, mm.cfg.FragmentTTLDays)
		expiresAt = &t
	}

	frag := &MemoryFragment{
		ID:            id,
		SessionID:     sessionID,
		Platform:      platform,
		GroupID:       groupID,
		UserID:        userID,
		Content:       content,
		SourceKind:    sourceKind,
		HashValue:     hash,
		Keywords:      keywords,
		Metadata:      map[string]interface{}{},
		EmotionalTone: emotionalTone,
		CreatedAt:     now,
		ExpiresAt:     expiresAt,
	}

	if err := mm.store.Insert(frag); err != nil {
		return fmt.Errorf("ingest store: %w", err)
	}

	if err := mm.vectorStore.Add(id, embedding); err != nil {
		return fmt.Errorf("ingest vector: %w", err)
	}

	mm.invertedIndex.Add(id, content)

	mm.enforceMaxFragments()

	return nil
}

func (mm *MemoryManager) Query(req MemoryQueryRequest) (*MemoryQueryResult, error) {
	if req.Limit <= 0 {
		req.Limit = mm.cfg.TopK
	}
	if req.Limit <= 0 {
		req.Limit = 5
	}

	mode := req.SearchMode
	if mode == "" {
		mode = mm.cfg.SearchMode
	}
	if mode == "" {
		mode = "hybrid"
	}

	if mm.deduplicator != nil {
		key := QueryKey(req.CurrentMessage, req.SessionID, req.GroupID, mode)
		return mm.deduplicator.Do(key, func() (*MemoryQueryResult, error) {
			return mm.doQuery(req, mode)
		})
	}
	return mm.doQuery(req, mode)
}

func (mm *MemoryManager) doQuery(req MemoryQueryRequest, mode string) (*MemoryQueryResult, error) {
	var queryEmbedding []float32
	if mode == "hybrid" || mode == "semantic" {
		var err error
		queryEmbedding, err = mm.embedder.Embed(req.CurrentMessage)
		if err != nil {
			logger.Sugar.Warnw("[MemoryManager] embed query failed", "error", err)
		}
	}

	queryText := req.KeywordsText
	if queryText == "" {
		queryText = req.CurrentMessage
	}

	fusionResults, err := mm.fusionRetriever.SearchWithMode(queryText, queryEmbedding, mode, req.Limit*3)
	if err != nil {
		logger.Sugar.Warnw("[MemoryManager] fusion search failed", "error", err)
		return &MemoryQueryResult{}, nil
	}

	hitMap := make(map[string]MemoryHit)
	for _, result := range fusionResults {
		hitMap[result.DocID] = MemoryHit{
			Fragment: nil,
			Score:    result.Score,
		}
	}

	var missingIDs []string
	for id, hit := range hitMap {
		if hit.Fragment == nil {
			missingIDs = append(missingIDs, id)
		}
	}

	if len(missingIDs) > 0 {
		batchFrags, err := mm.store.GetByIDs(missingIDs)
		if err != nil {
			logger.Sugar.Warnw("[MemoryManager] batch load fragments failed", "error", err)
		} else {
			for id, frag := range batchFrags {
				if hit, ok := hitMap[id]; ok {
					hit.Fragment = frag
					hitMap[id] = hit
				}
			}
		}
	}

	if mode == "hybrid" || mode == "keyword" {
		kw := req.KeywordsText
		if kw == "" {
			kw = req.CurrentMessage
		}
		keywords := extractKeywords(kw)
		if len(keywords) > 0 {
			keywordFrags, err := mm.store.SearchByKeywords(keywords, req.Limit*2)
			if err != nil {
				logger.Sugar.Warnw("[MemoryManager] keyword search failed", "error", err)
			} else {
				for _, frag := range keywordFrags {
					if hit, exists := hitMap[frag.ID]; exists {
						hit.Score += 0.1
						if hit.Fragment == nil {
							hit.Fragment = frag
						}
						hitMap[frag.ID] = hit
					} else {
						hitMap[frag.ID] = MemoryHit{
							Fragment: frag,
							Score:    0.1,
						}
					}
				}
			}
		}
	}

	var hits []MemoryHit
	for _, hit := range hitMap {
		if hit.Fragment == nil {
			continue
		}

		if len(req.SourceKinds) > 0 {
			found := false
			for _, sk := range req.SourceKinds {
				if hit.Fragment.SourceKind == sk {
					found = true
					break
				}
			}
			if !found {
				continue
			}
		}

		if req.SessionID != "" && hit.Fragment.SessionID != req.SessionID {
			continue
		}

		groupMatch := req.GroupID == "" || hit.Fragment.GroupID == req.GroupID
		senderMatch := req.SenderID != "" && hit.Fragment.UserID == req.SenderID
		if !groupMatch && !senderMatch {
			continue
		}

		hits = append(hits, hit)
	}

	for i := range hits {
		if mm.cfg.WeightDecay.Enabled {
			hits[i].Score = hits[i].Score * float32(mm.computeWeight(hits[i].Fragment))
		}
	}

	// 情绪加成：当前对话情绪与记忆片段情绪标签匹配时，小幅加分（×1.05）
	// 语义优先，情绪只做锦上添花，不匹配不扣分
	if req.EmotionalContext != "" {
		for i := range hits {
			if hits[i].Fragment != nil && hits[i].Fragment.EmotionalTone == req.EmotionalContext {
				hits[i].Score = hits[i].Score * 1.05
			}
		}
	}

	sort.Slice(hits, func(i, j int) bool {
		return hits[i].Score > hits[j].Score
	})

	if len(hits) > req.Limit {
		hits = hits[:req.Limit]
	}

	var accessIDs []string
	for i := range hits {
		accessIDs = append(accessIDs, hits[i].Fragment.ID)
	}
	if len(accessIDs) > 0 {
		mm.store.BatchUpdateAccess(accessIDs)
	}

	summary := FormatMemorySummary(hits)

	return &MemoryQueryResult{
		Hits:    hits,
		Summary: summary,
	}, nil
}

func (mm *MemoryManager) QueryGlobal(req MemoryQueryRequest) (*MemoryQueryResult, error) {
	req.SessionID = ""
	req.GroupID = ""
	if req.Limit <= 0 && mm.cfg.GlobalMemory.TopK > 0 {
		req.Limit = mm.cfg.GlobalMemory.TopK
	}
	return mm.Query(req)
}

func computeHash(content string) string {
	h := sha1.New()
	h.Write([]byte(content))
	return hex.EncodeToString(h.Sum(nil))
}

func (mm *MemoryManager) computeWeight(frag *MemoryFragment) float64 {
	if frag == nil {
		return 0.1
	}

	cfg := mm.cfg.WeightDecay

	ageDays := time.Since(frag.CreatedAt).Hours() / 24
	if ageDays < 0 {
		ageDays = 0
	}
	decay := 1.0 / (1.0 + cfg.DecayRate*ageDays)

	accessBoost := float64(frag.AccessCount) * cfg.AccessBoost
	if accessBoost > cfg.BoostCap {
		accessBoost = cfg.BoostCap
	}

	return math.Max(decay+accessBoost, 0.1)
}

func extractKeywords(text string) []string {
	var keywords []string
	seen := make(map[string]bool)

	runes := []rune(text)

	noiseChars := map[rune]bool{
		'，': true, '。': true, '！': true, '？': true, '、': true,
		'；': true, '：': true, '“': true, '”': true, '（': true,
		'）': true, '【': true, '】': true, '《': true, '》': true,
		'…': true, '—': true, '～': true, ' ': true, '\n': true,
		'\t': true, '的': true, '了': true, '是': true, '在': true,
		'我': true, '你': true, '他': true, '她': true, '它': true,
		'们': true, '这': true, '那': true, '有': true, '不': true,
		'就': true, '都': true, '也': true, '还': true, '要': true,
		'会': true, '能': true, '吗': true, '呢': true, '吧': true,
		'啊': true, '哦': true, '嗯': true, '呀': true, '哈': true,
	}

	addKeyword := func(kw string) {
		if !seen[kw] {
			seen[kw] = true
			keywords = append(keywords, kw)
		}
	}

	// 生成 bigrams
	for i := 0; i < len(runes)-1; i++ {
		r1 := runes[i]
		r2 := runes[i+1]

		if utf8.RuneLen(r1) > 1 && utf8.RuneLen(r2) > 1 {
			if noiseChars[r1] || noiseChars[r2] {
				continue
			}
			bigram := string([]rune{r1, r2})
			addKeyword(bigram)
		}
	}

	// 尝试提取 trigram
	for i := 0; i < len(runes)-2; i++ {
		r1, r2, r3 := runes[i], runes[i+1], runes[i+2]
		if noiseChars[r1] || noiseChars[r2] || noiseChars[r3] {
			continue
		}
		if utf8.RuneLen(r1) <= 1 || utf8.RuneLen(r2) <= 1 || utf8.RuneLen(r3) <= 1 {
			continue
		}
		trigram := string([]rune{r1, r2, r3})
		addKeyword(trigram)
	}

	if len(keywords) > 20 {
		keywords = keywords[:20]
	}

	return keywords
}

func FormatMemorySummary(hits []MemoryHit) string {
	if len(hits) == 0 {
		return ""
	}

	sortedHits := make([]MemoryHit, len(hits))
	copy(sortedHits, hits)
	sort.SliceStable(sortedHits, func(i, j int) bool {
		orderI := sourceKindOrder(sortedHits[i].Fragment.SourceKind)
		orderJ := sourceKindOrder(sortedHits[j].Fragment.SourceKind)
		if orderI != orderJ {
			return orderI < orderJ
		}
		return sortedHits[i].Score > sortedHits[j].Score
	})

	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

	var facts, chats, summaries []string

	for _, hit := range sortedHits {
		frag := hit.Fragment
		content := cleanMemoryContent(frag)

		fragDay := time.Date(frag.CreatedAt.Year(), frag.CreatedAt.Month(), frag.CreatedAt.Day(), 0, 0, 0, 0, now.Location())
		daysDiff := int(today.Sub(fragDay).Hours() / 24)
		timeHint := ""
		switch {
		case daysDiff == 0:
			timeHint = "今天"
		case daysDiff == 1:
			timeHint = "昨天"
		case daysDiff == 2:
			timeHint = "前天"
		case daysDiff <= 7:
			timeHint = "几天前"
		case daysDiff <= 30:
			timeHint = "之前"
		default:
			timeHint = "很久前"
		}

		switch frag.SourceKind {
		case SourcePersonFact:
			facts = append(facts, content)
		case SourceChatMessage:
			chats = append(chats, fmt.Sprintf("%s聊到：%s", timeHint, content))
		case SourceChatSummary:
			summaries = append(summaries, fmt.Sprintf("（%s）%s", timeHint, content))
		default:
			chats = append(chats, content)
		}
	}

	var parts []string
	if len(facts) > 0 {
		parts = append(parts, "你了解关于对方的事："+strings.Join(facts, "；"))
	}
	if len(summaries) > 0 {
		parts = append(parts, "之前聊过的："+strings.Join(summaries, "；"))
	}
	if len(chats) > 0 {
		parts = append(parts, strings.Join(chats, "；"))
	}

	if len(parts) == 0 {
		return ""
	}

	return strings.Join(parts, "\n")
}

// cleanMemoryContent 清理记忆内容，剥离结构化元数据（简述、关键词等），
// 只保留正文内容，让 LLM 看到的记忆更干净。
func cleanMemoryContent(frag *MemoryFragment) string {
	content := frag.Content

	// 只对 SourceChatSummary 做清理：剥离 "简述：" 和 "关键词：" 行
	if frag.SourceKind == SourceChatSummary {
		lines := strings.Split(content, "\n")
		var cleaned []string
		for _, line := range lines {
			trimmed := strings.TrimSpace(line)
			if strings.HasPrefix(trimmed, "简述：") || strings.HasPrefix(trimmed, "关键词：") {
				continue
			}
			cleaned = append(cleaned, line)
		}
		if len(cleaned) > 0 {
			content = strings.Join(cleaned, "\n")
		}
	}

	return content
}

func sourceKindOrder(kind SourceKind) int {
	switch kind {
	case SourceChatSummary:
		return 0
	case SourceChatMessage:
		return 1
	case SourcePersonFact:
		return 2
	default:
		return 3
	}
}

// CleanupContaminatedSummaries 清理被污染的 chat_summary 记忆。
// 污染来源：旧版 storeCompressedSummary 将原始聊天记录（含时间戳格式）
// 错误地存为 SourceChatSummary，导致记忆检索返回原始消息而非 LLM 摘要。
// 正常 LLM 摘要是自然语言叙述，被污染的条目包含 "HH:MM:SS, 用户名:" 格式的时间戳。
func (mm *MemoryManager) CleanupContaminatedSummaries() (int, error) {
	fragments, err := mm.store.QueryBySourceKind(string(SourceChatSummary), 0)
	if err != nil {
		return 0, fmt.Errorf("cleanup contaminated: query failed: %w", err)
	}

	deleted := 0
	for _, frag := range fragments {
		if isRawChatMessage(frag.Content) {
			if err := mm.store.DeleteByID(frag.ID); err != nil {
				logger.Sugar.Warnw("[记忆清理] 删除失败", "id", frag.ID, "error", err)
				continue
			}
			mm.vectorStore.Remove(frag.ID)
			mm.invertedIndex.Remove(frag.ID)
			deleted++
		}
	}

	if deleted > 0 {
		logger.Sugar.Infow("[记忆清理] 已清理被污染的摘要", "deleted", deleted, "total", len(fragments))
	}

	return deleted, nil
}

// isRawChatMessage 判断内容是否为原始聊天消息（包含时间戳格式）
// 正常 LLM 摘要：自然语言叙述，如 "双方讨论了周末爬山的计划，张三提议去黄山"
// 被污染的原始消息：包含 "HH:MM:SS, 用户名: 消息内容" 格式
func isRawChatMessage(content string) bool {
	// 检查是否包含原始消息的时间戳格式
	matched, _ := regexp.MatchString(`\d{2}:\d{2}:\d{2},\s*\S+:\s*`, content)
	return matched
}
