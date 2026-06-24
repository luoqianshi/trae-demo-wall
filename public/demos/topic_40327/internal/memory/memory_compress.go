package memory

import (
	"fmt"
	"time"

	"YaraFlow/internal/logger"
)

func (mm *MemoryManager) enforceMaxFragments() {
	max := mm.cfg.MaxFragments
	if max <= 0 {
		return
	}

	count, err := mm.store.Count()
	if err != nil {
		logger.Sugar.Warnw("[MemoryManager] count fragments", "error", err)
		return
	}

	if count <= max {
		return
	}

	toDelete := count - max
	oldIDs, err := mm.store.GetOldestIDs(toDelete)
	if err != nil {
		logger.Sugar.Warnw("[MemoryManager] get oldest IDs", "error", err)
		return
	}

	for _, id := range oldIDs {
		mm.store.DeleteByID(id)
		mm.vectorStore.Remove(id)
		mm.invertedIndex.Remove(id)
	}

	logger.Sugar.Infow("[MemoryManager] FIFO 淘汰旧记忆", "count", len(oldIDs), "current", count-toDelete, "max", max)
}

func (mm *MemoryManager) CompressFragments(maxAgeDays int, minGroupSize int, summarizer func(fragments []*MemoryFragment) (string, error)) (int, error) {
	cutoff := time.Now().AddDate(0, 0, -maxAgeDays)

	excludeKinds := []SourceKind{SourceChatSummary, SourcePersonFact}
	fragments, err := mm.store.GetOlderThan(cutoff, excludeKinds, 500)
	if err != nil {
		return 0, fmt.Errorf("compress get fragments: %w", err)
	}
	if len(fragments) == 0 {
		return 0, nil
	}

	groups := make(map[string][]*MemoryFragment)
	for _, f := range fragments {
		key := f.SessionID
		if key == "" {
			key = f.GroupID
		}
		if key == "" {
			continue
		}
		groups[key] = append(groups[key], f)
	}

	compressed := 0
	for key, group := range groups {
		if len(group) < minGroupSize {
			continue
		}

		summary, err := summarizer(group)
		if err != nil {
			logger.Sugar.Warnw("[MemoryManager] compress summarize failed", "key", key, "error", err)
			continue
		}
		if summary == "" {
			continue
		}

		summaryHash := computeHash(summary + key)
		summaryFrag := &MemoryFragment{
			ID:         summaryHash,
			SessionID:  group[0].SessionID,
			Platform:   group[0].Platform,
			GroupID:    group[0].GroupID,
			Content:    summary,
			SourceKind: SourceChatSummary,
			HashValue:  computeHash(summary),
			Keywords:   extractKeywords(summary),
			Metadata:   map[string]interface{}{"compressed_count": len(group)},
			CreatedAt:  time.Now(),
		}

		embedding, err := mm.embedder.Embed(summary)
		if err != nil {
			logger.Sugar.Warnw("[MemoryManager] compress embed summary failed", "error", err)
			continue
		}

		if err := mm.store.Insert(summaryFrag); err != nil {
			logger.Sugar.Warnw("[MemoryManager] compress store summary failed", "error", err)
			continue
		}

		if err := mm.vectorStore.Add(summaryFrag.ID, embedding); err != nil {
			logger.Sugar.Warnw("[MemoryManager] compress add vector failed", "error", err)
		}

		mm.invertedIndex.Add(summaryFrag.ID, summary)

		for _, f := range group {
			mm.store.DeleteByID(f.ID)
			mm.vectorStore.Remove(f.ID)
			mm.invertedIndex.Remove(f.ID)
		}

		compressed++
		logger.Sugar.Infow("[MemoryManager] 压缩旧记忆为摘要", "count", len(group), "key", key)
	}

	return compressed, nil
}

func (mm *MemoryManager) PeriodicCleanup() {
	ticker := time.NewTicker(time.Hour)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			affected, err := mm.store.DeleteExpired()
			if err != nil {
				logger.Sugar.Warnw("[MemoryManager] cleanup expired", "error", err)
			} else if affected > 0 {
				logger.Sugar.Infow("[MemoryManager] 清理过期记忆", "count", affected)
			}
		case <-mm.stopCh:
			return
		}
	}
}

func (mm *MemoryManager) PeriodicVectorPersist(path string) {
	interval := mm.cfg.VectorPersistSec
	if interval <= 0 {
		interval = 300
	}

	ticker := time.NewTicker(time.Duration(interval) * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			if err := mm.vectorStore.Save(path); err != nil {
				logger.Sugar.Warnw("[MemoryManager] persist vectors", "error", err)
			}
		case <-mm.stopCh:
			if err := mm.vectorStore.Save(path); err != nil {
				logger.Sugar.Warnw("[MemoryManager] final persist vectors", "error", err)
			}
			close(mm.doneCh)
			return
		}
	}
}

func (mm *MemoryManager) Shutdown() {
	close(mm.stopCh)
	<-mm.doneCh
}

func (mm *MemoryManager) PeriodicStats() {
	ticker := time.NewTicker(30 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			count, err := mm.store.Count()
			if err != nil {
				continue
			}
			vecLen := mm.vectorStore.Len()
			idxLen := mm.invertedIndex.Len()
			logger.Sugar.Infow("[MemoryManager] 统计", "fragment_count", count, "vector_count", vecLen, "index_count", idxLen, "max", mm.cfg.MaxFragments)
		case <-mm.stopCh:
			return
		}
	}
}
