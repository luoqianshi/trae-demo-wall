package memory

import (
	"math"
	"sort"
	"strings"
	"sync"
	"unicode/utf8"
)

type Posting struct {
	DocID string
	TF    int
}

type PostingList []Posting

type InvertedIndex struct {
	mu           sync.RWMutex
	index        map[string]PostingList
	docLengths   map[string]int
	totalDocs    int
	avgDocLength float64
}

func NewInvertedIndex() *InvertedIndex {
	return &InvertedIndex{
		index:      make(map[string]PostingList),
		docLengths: make(map[string]int),
	}
}

func (ii *InvertedIndex) Len() int {
	ii.mu.RLock()
	defer ii.mu.RUnlock()
	return ii.totalDocs
}

func extractNGrams(text string) []string {
	var ngrams []string
	seen := make(map[string]bool)
	
	runes := []rune(strings.TrimSpace(text))
	if len(runes) == 0 {
		return ngrams
	}
	
	for n := 2; n <= 3 && n <= len(runes); n++ {
		for i := 0; i <= len(runes)-n; i++ {
			valid := true
			for j := i; j < i+n; j++ {
				if !isValidChar(runes[j]) {
					valid = false
					break
				}
			}
			if valid {
				ngram := string(runes[i:i+n])
				if !seen[ngram] {
					seen[ngram] = true
					ngrams = append(ngrams, ngram)
				}
			}
		}
	}
	
	if len(ngrams) == 0 && len(runes) > 0 {
		ngrams = append(ngrams, string(runes[0]))
	}
	
	return ngrams
}

func isValidChar(r rune) bool {
	if utf8.RuneLen(r) > 1 {
		return true
	}
	if r >= 'a' && r <= 'z' {
		return true
	}
	if r >= 'A' && r <= 'Z' {
		return true
	}
	if r >= '0' && r <= '9' {
		return true
	}
	return false
}

func (ii *InvertedIndex) Add(docID string, content string) {
	ii.mu.Lock()
	defer ii.mu.Unlock()

	if _, exists := ii.docLengths[docID]; exists {
		ii.Remove(docID)
	}

	ngrams := extractNGrams(content)
	termCounts := make(map[string]int)
	for _, term := range ngrams {
		termCounts[term]++
	}

	for term, count := range termCounts {
		ii.index[term] = append(ii.index[term], Posting{
			DocID: docID,
			TF:    count,
		})
	}

	ii.docLengths[docID] = len(ngrams)
	ii.totalDocs++
	ii.updateAvgDocLength()
}

func (ii *InvertedIndex) Remove(docID string) {
	ii.mu.Lock()
	defer ii.mu.Unlock()

	if _, exists := ii.docLengths[docID]; !exists {
		return
	}

	for term, postings := range ii.index {
		newPostings := PostingList{}
		for _, p := range postings {
			if p.DocID != docID {
				newPostings = append(newPostings, p)
			}
		}
		if len(newPostings) == 0 {
			delete(ii.index, term)
		} else {
			ii.index[term] = newPostings
		}
	}

	delete(ii.docLengths, docID)
	ii.totalDocs--
	ii.updateAvgDocLength()
}

func (ii *InvertedIndex) updateAvgDocLength() {
	if ii.totalDocs == 0 {
		ii.avgDocLength = 0
		return
	}
	total := 0
	for _, length := range ii.docLengths {
		total += length
	}
	ii.avgDocLength = float64(total) / float64(ii.totalDocs)
}

func (ii *InvertedIndex) Search(query string, topK int) ([]SearchResult, error) {
	if topK <= 0 {
		topK = 10
	}

	ii.mu.RLock()
	defer ii.mu.RUnlock()

	if ii.totalDocs == 0 {
		return nil, nil
	}

	queryTerms := extractNGrams(query)
	if len(queryTerms) == 0 {
		return nil, nil
	}

	docScores := make(map[string]float32)
	k1 := 1.5
	b := 0.75

	for _, term := range queryTerms {
		postings, exists := ii.index[term]
		if !exists {
			continue
		}

		idf := math.Log(float64(ii.totalDocs) / float64(len(postings)))

		for _, posting := range postings {
			docLen := float64(ii.docLengths[posting.DocID])
			tf := float64(posting.TF)

			numerator := tf * (k1 + 1)
			denominator := tf + k1*(1-b+b*(docLen/ii.avgDocLength))
			tfidf := float32(idf * numerator / denominator)

			docScores[posting.DocID] += tfidf
		}
	}

	if len(docScores) == 0 {
		return nil, nil
	}

	var results []SearchResult
	for docID, score := range docScores {
		results = append(results, SearchResult{
			ID:    docID,
			Score: score,
		})
	}

	sort.Slice(results, func(i, j int) bool {
		return results[i].Score > results[j].Score
	})

	if len(results) > topK {
		results = results[:topK]
	}

	return results, nil
}
