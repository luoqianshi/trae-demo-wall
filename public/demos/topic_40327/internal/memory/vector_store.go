package memory

import (
	"encoding/json"
	"fmt"
	"math"
	"os"
	"path/filepath"
	"sort"
	"sync"
)

type VectorEntry struct {
	ID        string    `json:"id"`
	Embedding []float32 `json:"embedding"`
}

type SearchResult struct {
	ID    string
	Score float32
}

type vectorPersistData struct {
	Dim     int           `json:"dim"`
	Entries []VectorEntry `json:"entries"`
}

type VectorStore struct {
	mu      sync.RWMutex
	dim     int
	entries []VectorEntry
	index   map[string]int
}

func NewVectorStore(dim int) *VectorStore {
	return &VectorStore{
		dim:   dim,
		index: make(map[string]int),
	}
}

func (vs *VectorStore) Dim() int {
	return vs.dim
}

func (vs *VectorStore) Len() int {
	vs.mu.RLock()
	defer vs.mu.RUnlock()
	return len(vs.entries)
}

func (vs *VectorStore) Add(id string, embedding []float32) error {
	normEmbed := normalizeL2(embedding)

	vs.mu.Lock()
	defer vs.mu.Unlock()

	if vs.dim > 0 && len(embedding) != vs.dim {
		return fmt.Errorf("向量维度不匹配: 期望 %d, 实际 %d", vs.dim, len(embedding))
	}
	if vs.dim == 0 && len(embedding) > 0 {
		vs.dim = len(embedding)
	}

	if pos, exists := vs.index[id]; exists {
		vs.entries[pos].Embedding = normEmbed
		return nil
	}

	vs.entries = append(vs.entries, VectorEntry{ID: id, Embedding: normEmbed})
	vs.index[id] = len(vs.entries) - 1

	return nil
}

func (vs *VectorStore) Remove(id string) {
	vs.mu.Lock()
	defer vs.mu.Unlock()

	pos, exists := vs.index[id]
	if !exists {
		return
	}

	lastIdx := len(vs.entries) - 1
	if pos != lastIdx {
		vs.entries[pos] = vs.entries[lastIdx]
		vs.index[vs.entries[pos].ID] = pos
	}

	vs.entries = vs.entries[:lastIdx]
	delete(vs.index, id)
}

func (vs *VectorStore) Search(query []float32, topK int) []SearchResult {
	if topK <= 0 {
		topK = 5
	}

	normQuery := normalizeL2(query)

	vs.mu.RLock()
	defer vs.mu.RUnlock()

	if len(vs.entries) == 0 {
		return nil
	}

	results := make([]SearchResult, 0, topK)

	for _, entry := range vs.entries {
		score := dotProduct(normQuery, entry.Embedding)

		if len(results) < topK {
			results = append(results, SearchResult{ID: entry.ID, Score: score})
			sortSearchResults(results)
			continue
		}

		if score > results[0].Score {
			results[0] = SearchResult{ID: entry.ID, Score: score}
			sortSearchResults(results)
		}
	}

	sort.Slice(results, func(i, j int) bool {
		return results[i].Score > results[j].Score
	})

	return results
}

func (vs *VectorStore) Save(path string) error {
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("vector_store save mkdir: %w", err)
	}

	vs.mu.RLock()
	data := vectorPersistData{
		Dim:     vs.dim,
		Entries: make([]VectorEntry, len(vs.entries)),
	}
	copy(data.Entries, vs.entries)
	vs.mu.RUnlock()

	file, err := os.Create(path)
	if err != nil {
		return fmt.Errorf("vector_store save: %w", err)
	}
	defer file.Close()

	encoder := json.NewEncoder(file)
	if err := encoder.Encode(data); err != nil {
		return fmt.Errorf("vector_store encode: %w", err)
	}

	return nil
}

func (vs *VectorStore) Load(path string) error {
	file, err := os.Open(path)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return fmt.Errorf("vector_store load open: %w", err)
	}
	defer file.Close()

	var data vectorPersistData
	decoder := json.NewDecoder(file)
	if err := decoder.Decode(&data); err != nil {
		return fmt.Errorf("vector_store decode: %w", err)
	}

	vs.mu.Lock()
	defer vs.mu.Unlock()

	vs.dim = data.Dim
	vs.entries = data.Entries
	vs.index = make(map[string]int, len(vs.entries))
	for i, entry := range vs.entries {
		vs.index[entry.ID] = i
	}

	return nil
}

func normalizeL2(vec []float32) []float32 {
	result := make([]float32, len(vec))

	var sum float64
	for _, v := range vec {
		sum += float64(v) * float64(v)
	}

	norm := math.Sqrt(sum)
	if norm < 1e-10 {
		copy(result, vec)
		return result
	}

	for i, v := range vec {
		result[i] = float32(float64(v) / norm)
	}

	return result
}

func dotProduct(a, b []float32) float32 {
	var sum float64
	for i := 0; i < len(a) && i < len(b); i++ {
		sum += float64(a[i]) * float64(b[i])
	}
	return float32(sum)
}

func sortSearchResults(results []SearchResult) {
	minIdx := 0
	for i := 1; i < len(results); i++ {
		if results[i].Score < results[minIdx].Score {
			minIdx = i
		}
	}
	if minIdx != 0 {
		results[0], results[minIdx] = results[minIdx], results[0]
	}
}
