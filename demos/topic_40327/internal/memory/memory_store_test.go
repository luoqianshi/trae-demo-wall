package memory

import (
	"database/sql"
	"testing"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

func setupTestDB(t *testing.T) *sql.DB {
	t.Helper()

	db, err := sql.Open("sqlite3", ":memory:?_busy_timeout=5000&_journal_mode=WAL")
	if err != nil {
		t.Fatalf("open sqlite: %v", err)
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

	t.Cleanup(func() { db.Close() })
	return db
}

func TestMemoryStoreInsertAndGet(t *testing.T) {
	db := setupTestDB(t)
	store := NewMemoryStore(db)

	now := time.Now()
	frag := &MemoryFragment{
		ID:         "test-001",
		SessionID:  "session-1",
		Platform:   "lunar",
		GroupID:    "group-1",
		UserID:     "user-1",
		Content:    "小明说他想吃草莓蛋糕",
		SourceKind: SourceChatMessage,
		HashValue:  "abc123",
		Keywords:   []string{"小明", "草莓", "蛋糕"},
		Metadata:   map[string]interface{}{"sender": "小明"},
		CreatedAt:  now,
	}

	err := store.Insert(frag)
	if err != nil {
		t.Fatalf("insert: %v", err)
	}

	got, err := store.GetByHash("abc123")
	if err != nil {
		t.Fatalf("get by hash: %v", err)
	}
	if got == nil {
		t.Fatal("expected fragment, got nil")
	}
	if got.Content != "小明说他想吃草莓蛋糕" {
		t.Errorf("content mismatch: %s", got.Content)
	}
	if got.SourceKind != SourceChatMessage {
		t.Errorf("source kind mismatch: %s", got.SourceKind)
	}
	if len(got.Keywords) != 3 {
		t.Errorf("keywords length: want 3, got %d", len(got.Keywords))
	}
}

func TestMemoryStoreGetByID(t *testing.T) {
	db := setupTestDB(t)
	store := NewMemoryStore(db)

	frag := &MemoryFragment{
		ID: "test-002", SessionID: "s1", Content: "hello",
		SourceKind: SourceChatMessage, HashValue: "h2", CreatedAt: time.Now(),
	}
	store.Insert(frag)

	got, err := store.GetByID("test-002")
	if err != nil {
		t.Fatalf("get by id: %v", err)
	}
	if got == nil {
		t.Fatal("expected fragment")
	}
	if got.ID != "test-002" {
		t.Errorf("id mismatch: %s", got.ID)
	}

	got, err = store.GetByID("nonexistent")
	if err != nil {
		t.Fatalf("get by id nonexistent: %v", err)
	}
	if got != nil {
		t.Errorf("expected nil for nonexistent")
	}
}

func TestMemoryStoreQueryBySession(t *testing.T) {
	db := setupTestDB(t)
	store := NewMemoryStore(db)

	now := time.Now()
	frag1 := &MemoryFragment{
		ID: "q-1", SessionID: "s1", Content: "msg1",
		SourceKind: SourceChatMessage, HashValue: "h1", CreatedAt: now,
	}
	frag2 := &MemoryFragment{
		ID: "q-2", SessionID: "s1", Content: "msg2",
		SourceKind: SourceChatMessage, HashValue: "h2", CreatedAt: now.Add(time.Second),
	}
	frag3 := &MemoryFragment{
		ID: "q-3", SessionID: "s2", Content: "msg3",
		SourceKind: SourceChatMessage, HashValue: "h3", CreatedAt: now,
	}

	store.Insert(frag1)
	store.Insert(frag2)
	store.Insert(frag3)

	results, err := store.QueryBySession("s1", "", 10)
	if err != nil {
		t.Fatalf("query: %v", err)
	}
	if len(results) != 2 {
		t.Errorf("expected 2 results for s1, got %d", len(results))
	}

	results, err = store.QueryBySession("s2", "", 10)
	if err != nil {
		t.Fatalf("query: %v", err)
	}
	if len(results) != 1 {
		t.Errorf("expected 1 result for s2, got %d", len(results))
	}
}

func TestMemoryStoreSearchByKeywords(t *testing.T) {
	db := setupTestDB(t)
	store := NewMemoryStore(db)

	now := time.Now()
	frag1 := &MemoryFragment{
		ID: "k-1", SessionID: "s1", Content: "草莓蛋糕好吃",
		Keywords: []string{"草莓", "蛋糕"}, SourceKind: SourceChatMessage,
		HashValue: "h1", CreatedAt: now,
	}
	frag2 := &MemoryFragment{
		ID: "k-2", SessionID: "s1", Content: "今天天气不错",
		Keywords: []string{"天气"}, SourceKind: SourceChatMessage,
		HashValue: "h2", CreatedAt: now,
	}
	frag3 := &MemoryFragment{
		ID: "k-3", SessionID: "s1", Content: "天气好的时候吃蛋糕",
		Keywords: []string{"天气", "蛋糕"}, SourceKind: SourceChatMessage,
		HashValue: "h3", CreatedAt: now,
	}

	store.Insert(frag1)
	store.Insert(frag2)
	store.Insert(frag3)

	results, err := store.SearchByKeywords([]string{"蛋糕"}, 10)
	if err != nil {
		t.Fatalf("search: %v", err)
	}
	if len(results) != 2 {
		t.Errorf("expected 2 results for '蛋糕', got %d", len(results))
	}

	results, err = store.SearchByKeywords([]string{"天气"}, 10)
	if err != nil {
		t.Fatalf("search: %v", err)
	}
	if len(results) != 2 {
		t.Errorf("expected 2 results for '天气', got %d", len(results))
	}

	results, err = store.SearchByKeywords([]string{"不存在"}, 10)
	if err != nil {
		t.Fatalf("search: %v", err)
	}
	if len(results) != 0 {
		t.Errorf("expected 0 results, got %d", len(results))
	}
}

func TestMemoryStoreUpdateAccess(t *testing.T) {
	db := setupTestDB(t)
	store := NewMemoryStore(db)

	frag := &MemoryFragment{
		ID: "a-1", SessionID: "s1", Content: "test",
		SourceKind: SourceChatMessage, HashValue: "h1", CreatedAt: time.Now(),
	}
	store.Insert(frag)

	err := store.UpdateAccess("a-1")
	if err != nil {
		t.Fatalf("update access: %v", err)
	}

	got, _ := store.GetByID("a-1")
	if got.AccessCount != 1 {
		t.Errorf("access count: want 1, got %d", got.AccessCount)
	}
}

func TestMemoryStoreCount(t *testing.T) {
	db := setupTestDB(t)
	store := NewMemoryStore(db)

	count, _ := store.Count()
	if count != 0 {
		t.Errorf("initial count: want 0, got %d", count)
	}

	store.Insert(&MemoryFragment{
		ID: "c-1", SessionID: "s1", Content: "test",
		SourceKind: SourceChatMessage, HashValue: "h1", CreatedAt: time.Now(),
	})

	count, _ = store.Count()
	if count != 1 {
		t.Errorf("count after insert: want 1, got %d", count)
	}
}

func TestMemoryStoreDeleteByID(t *testing.T) {
	db := setupTestDB(t)
	store := NewMemoryStore(db)

	store.Insert(&MemoryFragment{
		ID: "d-1", SessionID: "s1", Content: "test",
		SourceKind: SourceChatMessage, HashValue: "h1", CreatedAt: time.Now(),
	})

	err := store.DeleteByID("d-1")
	if err != nil {
		t.Fatalf("delete: %v", err)
	}

	count, _ := store.Count()
	if count != 0 {
		t.Errorf("count after delete: want 0, got %d", count)
	}
}

func TestMemoryStoreDeleteExpired(t *testing.T) {
	db := setupTestDB(t)
	store := NewMemoryStore(db)

	past := time.Now().Add(-time.Hour)
	future := time.Now().Add(time.Hour)

	store.Insert(&MemoryFragment{
		ID: "e-1", SessionID: "s1", Content: "expired",
		SourceKind: SourceChatMessage, HashValue: "h1",
		CreatedAt: time.Now(), ExpiresAt: &past,
	})
	store.Insert(&MemoryFragment{
		ID: "e-2", SessionID: "s1", Content: "valid",
		SourceKind: SourceChatMessage, HashValue: "h2",
		CreatedAt: time.Now(), ExpiresAt: &future,
	})

	affected, err := store.DeleteExpired()
	if err != nil {
		t.Fatalf("delete expired: %v", err)
	}
	if affected != 1 {
		t.Errorf("expected 1 deleted, got %d", affected)
	}

	count, _ := store.Count()
	if count != 1 {
		t.Errorf("expected 1 remaining, got %d", count)
	}
}
