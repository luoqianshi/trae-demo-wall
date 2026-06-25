package memory

import (
	"math"
	"os"
	"path/filepath"
	"testing"
)

func TestVectorStoreAddSearch(t *testing.T) {
	vs := NewVectorStore(4)

	vs.Add("id-1", []float32{1.0, 0.0, 0.0, 0.0})
	vs.Add("id-2", []float32{0.0, 1.0, 0.0, 0.0})
	vs.Add("id-3", []float32{0.0, 0.0, 1.0, 0.0})

	if vs.Len() != 3 {
		t.Errorf("len: want 3, got %d", vs.Len())
	}

	results := vs.Search([]float32{1.0, 0.0, 0.0, 0.0}, 2)
	if len(results) != 2 {
		t.Fatalf("search results: want 2, got %d", len(results))
	}

	if results[0].ID != "id-1" {
		t.Errorf("top result: want id-1, got %s", results[0].ID)
	}
	if math.Abs(float64(results[0].Score-1.0)) > 0.001 {
		t.Errorf("top score: want ~1.0, got %f", results[0].Score)
	}
}

func TestVectorStoreRemove(t *testing.T) {
	vs := NewVectorStore(4)

	vs.Add("a", []float32{1, 0, 0, 0})
	vs.Add("b", []float32{0, 1, 0, 0})
	vs.Add("c", []float32{0, 0, 1, 0})

	vs.Remove("b")

	if vs.Len() != 2 {
		t.Errorf("len after remove: want 2, got %d", vs.Len())
	}

	results := vs.Search([]float32{0, 1, 0, 0}, 1)
	if len(results) == 0 {
		t.Fatal("expected at least 1 result")
	}
	if results[0].ID == "b" {
		t.Error("removed entry should not appear in search")
	}
}

func TestVectorStoreRemoveNonexistent(t *testing.T) {
	vs := NewVectorStore(4)
	vs.Add("a", []float32{1, 0, 0, 0})
	vs.Remove("nonexistent")
	if vs.Len() != 1 {
		t.Errorf("len should be 1 after removing nonexistent, got %d", vs.Len())
	}
}

func TestVectorStoreUpdateExisting(t *testing.T) {
	vs := NewVectorStore(4)

	vs.Add("x", []float32{1, 0, 0, 0})
	vs.Add("x", []float32{0, 1, 0, 0})

	if vs.Len() != 1 {
		t.Errorf("update should not increase count: want 1, got %d", vs.Len())
	}

	results := vs.Search([]float32{0, 1, 0, 0}, 1)
	if results[0].Score <= 0.99 {
		t.Errorf("updated vector should match new embedding, got score %f", results[0].Score)
	}
}

func TestVectorStoreEmptySearch(t *testing.T) {
	vs := NewVectorStore(4)
	results := vs.Search([]float32{1, 0, 0, 0}, 5)
	if results != nil {
		t.Errorf("empty store search should return nil, got %v", results)
	}
}

func TestVectorStoreTopK(t *testing.T) {
	vs := NewVectorStore(3)

	vs.Add("1", []float32{1, 0, 0})
	vs.Add("2", []float32{0.9, 0.1, 0})
	vs.Add("3", []float32{0.5, 0.5, 0})
	vs.Add("4", []float32{0, 1, 0})
	vs.Add("5", []float32{0, 0, 1})

	results := vs.Search([]float32{1, 0, 0}, 3)
	if len(results) != 3 {
		t.Fatalf("topk: want 3, got %d", len(results))
	}

	if results[0].Score < results[1].Score {
		t.Error("results should be sorted descending by score")
	}
	if results[1].Score < results[2].Score {
		t.Error("results should be sorted descending by score")
	}
}

func TestVectorStoreSaveLoad(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "vectors.json")

	vs := NewVectorStore(4)
	vs.Add("s1", []float32{1, 0, 0, 0})
	vs.Add("s2", []float32{0, 1, 0, 0})

	err := vs.Save(path)
	if err != nil {
		t.Fatalf("save: %v", err)
	}

	vs2 := NewVectorStore(0)
	err = vs2.Load(path)
	if err != nil {
		t.Fatalf("load: %v", err)
	}

	if vs2.Len() != 2 {
		t.Errorf("loaded len: want 2, got %d", vs2.Len())
	}
	if vs2.Dim() != 4 {
		t.Errorf("loaded dim: want 4, got %d", vs2.Dim())
	}

	results := vs2.Search([]float32{1, 0, 0, 0}, 2)
	if len(results) != 2 {
		t.Fatalf("loaded search: want 2 results, got %d", len(results))
	}
	if results[0].ID != "s1" {
		t.Errorf("loaded top result: want s1, got %s", results[0].ID)
	}
}

func TestVectorStoreLoadNonexistent(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "nonexistent.json")

	vs := NewVectorStore(4)
	err := vs.Load(path)
	if err != nil {
		t.Fatalf("loading nonexistent file should not error: %v", err)
	}
	if vs.Len() != 0 {
		t.Errorf("loaded from nonexistent should be empty")
	}
}

func TestNormalizeL2(t *testing.T) {
	vec := []float32{3, 4}
	norm := normalizeL2(vec)

	if len(norm) != 2 {
		t.Fatalf("len: want 2, got %d", len(norm))
	}

	mag := math.Sqrt(float64(norm[0]*norm[0] + norm[1]*norm[1]))
	if math.Abs(mag-1.0) > 0.0001 {
		t.Errorf("norm magnitude: want 1.0, got %f", mag)
	}

	if math.Abs(float64(norm[0]-0.6)) > 0.0001 || math.Abs(float64(norm[1]-0.8)) > 0.0001 {
		t.Errorf("values: want [0.6, 0.8], got [%f, %f]", norm[0], norm[1])
	}
}

func TestNormalizeL2Zero(t *testing.T) {
	vec := []float32{0, 0, 0}
	norm := normalizeL2(vec)

	if len(norm) != 3 {
		t.Fatalf("len: want 3, got %d", len(norm))
	}
	for i, v := range norm {
		if v != 0 {
			t.Errorf("zero vector should remain zero at idx %d, got %f", i, v)
		}
	}
}

func TestVectorStoreAddWrongDim(t *testing.T) {
	vs := NewVectorStore(4)
	err := vs.Add("x", []float32{1, 2, 3})
	if err == nil {
		t.Error("expected error for wrong dimension")
	}
}

func TestVectorSaveTempCleanup(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "vectors.json")

	vs := NewVectorStore(4)
	vs.Save(path)

	_, err := os.Stat(path)
	if err != nil {
		t.Errorf("save file should exist: %v", err)
	}
}
