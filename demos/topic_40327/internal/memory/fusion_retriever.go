package memory

import (
	"sort"
)

type FusionRetriever struct {
	vectorStore   *VectorStore
	invertedIndex *InvertedIndex
	graphStore    *GraphStore
	weights       FusionWeights
	rrfK          int
}

type FusionWeights struct {
	Vector  float32
	Keyword float32
	Graph   float32
}

type FusionResult struct {
	DocID   string
	Score   float32
	Sources []string
}

func NewFusionRetriever(vs *VectorStore, ii *InvertedIndex, gs *GraphStore) *FusionRetriever {
	return &FusionRetriever{
		vectorStore:   vs,
		invertedIndex: ii,
		graphStore:    gs,
		weights: FusionWeights{
			Vector:  0.5,
			Keyword: 0.35,
			Graph:   0.15,
		},
		rrfK: 60,
	}
}

func (fr *FusionRetriever) SetWeights(weights FusionWeights) {
	fr.weights = weights
}

func (fr *FusionRetriever) SetRRFK(k int) {
	if k > 0 {
		fr.rrfK = k
	}
}

func (fr *FusionRetriever) Search(query string, queryEmbedding []float32, topK int) ([]FusionResult, error) {
	var vectorResults, keywordResults []SearchResult
	var graphBoostedResults []SearchResult

	if fr.vectorStore != nil && len(queryEmbedding) > 0 {
		vectorResults = fr.vectorStore.Search(queryEmbedding, topK*3)
	}

	if fr.invertedIndex != nil && query != "" {
		var err error
		keywordResults, err = fr.invertedIndex.Search(query, topK*3)
		if err != nil {
			return nil, err
		}
	}

	if fr.graphStore != nil && query != "" && fr.invertedIndex != nil {
		entities, err := fr.graphStore.SearchEntities(query, 10)
		if err == nil && len(entities) > 0 {
			// 一跳：直接匹配的实体 → 关键词检索
			for _, entity := range entities {
				entityResults, err := fr.invertedIndex.Search(entity.Name, topK)
				if err == nil {
					graphBoostedResults = append(graphBoostedResults, entityResults...)
				}
			}

			// 二跳：关联实体扩展（跨记忆类型联想）
			// 每个匹配实体的关联实体也做关键词检索，权重减半
			seenConnected := make(map[string]bool)
			const maxHop2 = 3 // 最多扩展 3 个一跳实体
			hop2Count := 0
			for _, entity := range entities {
				if hop2Count >= maxHop2 {
					break
				}
				connected, err := fr.graphStore.GetConnectedEntities(entity.Name, 5)
				if err != nil || len(connected) == 0 {
					continue
				}
				hop2Count++
				for _, connName := range connected {
					if seenConnected[connName] {
						continue
					}
					seenConnected[connName] = true
					// topK=1 时 topK/2=0，确保至少返回 1 条结果
					searchLimit := topK / 2
					if searchLimit <= 0 {
						searchLimit = 1
					}
					connResults, err := fr.invertedIndex.Search(connName, searchLimit)
					if err == nil {
						graphBoostedResults = append(graphBoostedResults, connResults...)
					}
				}
			}
		}
	}

	return fr.fuseResults(vectorResults, keywordResults, graphBoostedResults, topK)
}

func (fr *FusionRetriever) fuseResults(vectorResults, keywordResults, graphBoostedResults []SearchResult, topK int) ([]FusionResult, error) {
	resultMap := make(map[string]*FusionResult)

	if len(vectorResults) > 0 {
		for rank, result := range vectorResults {
			score := float32(fr.rrfK) / float32(rank+1+fr.rrfK)
			if existing, ok := resultMap[result.ID]; ok {
				existing.Score += score * fr.weights.Vector
				existing.Sources = append(existing.Sources, "vector")
			} else {
				resultMap[result.ID] = &FusionResult{
					DocID:   result.ID,
					Score:   score * fr.weights.Vector,
					Sources: []string{"vector"},
				}
			}
		}
	}

	if len(keywordResults) > 0 {
		for rank, result := range keywordResults {
			score := float32(fr.rrfK) / float32(rank+1+fr.rrfK)
			if existing, ok := resultMap[result.ID]; ok {
				existing.Score += score * fr.weights.Keyword
				existing.Sources = append(existing.Sources, "keyword")
			} else {
				resultMap[result.ID] = &FusionResult{
					DocID:   result.ID,
					Score:   score * fr.weights.Keyword,
					Sources: []string{"keyword"},
				}
			}
		}
	}

	if len(graphBoostedResults) > 0 {
		for rank, result := range graphBoostedResults {
			score := float32(fr.rrfK) / float32(rank+1+fr.rrfK)
			if existing, ok := resultMap[result.ID]; ok {
				existing.Score += score * fr.weights.Graph
				existing.Sources = append(existing.Sources, "graph")
			} else {
				resultMap[result.ID] = &FusionResult{
					DocID:   result.ID,
					Score:   score * fr.weights.Graph,
					Sources: []string{"graph"},
				}
			}
		}
	}

	results := make([]FusionResult, 0, len(resultMap))
	for _, result := range resultMap {
		results = append(results, *result)
	}

	sort.Slice(results, func(i, j int) bool {
		return results[i].Score > results[j].Score
	})

	if len(results) > topK {
		results = results[:topK]
	}

	return results, nil
}

func (fr *FusionRetriever) SearchWithMode(query string, queryEmbedding []float32, mode string, topK int) ([]FusionResult, error) {
	originalWeights := fr.weights
	defer func() { fr.weights = originalWeights }()

	switch mode {
	case "semantic":
		fr.weights = FusionWeights{Vector: 1.0, Keyword: 0, Graph: 0}
	case "keyword":
		fr.weights = FusionWeights{Vector: 0, Keyword: 1.0, Graph: 0}
	case "graph":
		fr.weights = FusionWeights{Vector: 0, Keyword: 0, Graph: 1.0}
	case "hybrid":
		fr.weights = FusionWeights{Vector: 0.5, Keyword: 0.35, Graph: 0.15}
	}
	return fr.Search(query, queryEmbedding, topK)
}
