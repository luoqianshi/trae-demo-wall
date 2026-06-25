package memory

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"YaraFlow/internal/logger"
)

var timestampFormats = []string{
	"2006-01-02 15:04:05.999999999-07:00",
	"2006-01-02T15:04:05.999999999-07:00",
	"2006-01-02 15:04:05.999999999",
	"2006-01-02T15:04:05.999999999",
	"2006-01-02 15:04:05",
	"2006-01-02T15:04:05",
	"2006-01-02 15:04",
	"2006-01-02T15:04",
	time.RFC3339Nano,
	time.RFC3339,
}

func parseTimestamp(value string) time.Time {
	if value == "" {
		return time.Time{}
	}
	for _, layout := range timestampFormats {
		if t, err := time.Parse(layout, value); err == nil {
			return t
		}
	}
	return time.Time{}
}

type SourceKind string

const (
	SourceChatMessage SourceKind = "chat_message"
	SourcePersonFact  SourceKind = "person_fact"
	SourceChatSummary SourceKind = "chat_summary"
)

type MemoryFragment struct {
	ID            string
	SessionID     string
	Platform      string
	GroupID       string
	UserID        string
	Content       string
	SourceKind    SourceKind
	HashValue     string
	Keywords      []string
	Metadata      map[string]interface{}
	EmotionalTone string
	AccessCount   int
	LastAccess    *time.Time
	CreatedAt     time.Time
	ExpiresAt     *time.Time
}

type MemoryStore struct {
	db *sql.DB
}

func NewMemoryStore(db *sql.DB) *MemoryStore {
	return &MemoryStore{db: db}
}

func (s *MemoryStore) Insert(frag *MemoryFragment) error {
	keywordsJSON, err := json.Marshal(frag.Keywords)
	if err != nil {
		keywordsJSON = []byte("[]")
	}

	metadataJSON, err := json.Marshal(frag.Metadata)
	if err != nil {
		metadataJSON = []byte("{}")
	}

	var expiresAt interface{}
	if frag.ExpiresAt != nil {
		expiresAt = frag.ExpiresAt.UTC().Format("2006-01-02 15:04:05")
	}

	var lastAccess interface{}
	if frag.LastAccess != nil {
		lastAccess = frag.LastAccess.UTC().Format("2006-01-02 15:04:05")
	}

	_, err = s.db.Exec(
		`INSERT OR REPLACE INTO memory_fragments
		 (id, session_id, platform, group_id, user_id, content, source_kind, hash_value, keywords, metadata, emotional_tone, access_count, last_access_at, created_at, expires_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		frag.ID, frag.SessionID, frag.Platform, frag.GroupID, frag.UserID,
		frag.Content, string(frag.SourceKind), frag.HashValue,
		string(keywordsJSON), string(metadataJSON), frag.EmotionalTone,
		frag.AccessCount, lastAccess, frag.CreatedAt.UTC().Format("2006-01-02 15:04:05"),
		expiresAt,
	)
	if err != nil {
		return fmt.Errorf("memory_store insert: %w", err)
	}

	return nil
}

func (s *MemoryStore) GetByHash(hash string) (*MemoryFragment, error) {
	row := s.db.QueryRow(
		`SELECT id, session_id, platform, group_id, user_id, content, source_kind, hash_value, keywords, metadata, emotional_tone, access_count, last_access_at, created_at, expires_at
		 FROM memory_fragments WHERE hash_value = ?`, hash,
	)
	return s.scanFragment(row)
}

func (s *MemoryStore) GetByID(id string) (*MemoryFragment, error) {
	row := s.db.QueryRow(
		`SELECT id, session_id, platform, group_id, user_id, content, source_kind, hash_value, keywords, metadata, emotional_tone, access_count, last_access_at, created_at, expires_at
		 FROM memory_fragments WHERE id = ?`, id,
	)
	return s.scanFragment(row)
}

func (s *MemoryStore) GetByIDs(ids []string) (map[string]*MemoryFragment, error) {
	if len(ids) == 0 {
		return map[string]*MemoryFragment{}, nil
	}

	placeholders := make([]string, len(ids))
	args := make([]interface{}, len(ids))
	for i, id := range ids {
		placeholders[i] = "?"
		args[i] = id
	}

	query := fmt.Sprintf(
		`SELECT id, session_id, platform, group_id, user_id, content, source_kind, hash_value, keywords, metadata, emotional_tone, access_count, last_access_at, created_at, expires_at
		 FROM memory_fragments WHERE id IN (%s)`, strings.Join(placeholders, ","),
	)

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("memory_store get by ids: %w", err)
	}
	defer rows.Close()

	result := make(map[string]*MemoryFragment, len(ids))
	for rows.Next() {
		frag, err := s.scanFragmentFromRows(rows)
		if err != nil {
			logger.Sugar.Warnw("[MemoryStore] scan fragment error", "error", err)
			continue
		}
		result[frag.ID] = frag
	}

	return result, nil
}

func (s *MemoryStore) QueryBySession(sessionID string, sourceKind string, limit int) ([]*MemoryFragment, error) {
	if limit <= 0 {
		limit = 50
	}

	var rows *sql.Rows
	var err error

	if sourceKind != "" {
		rows, err = s.db.Query(
			`SELECT id, session_id, platform, group_id, user_id, content, source_kind, hash_value, keywords, metadata, emotional_tone, access_count, last_access_at, created_at, expires_at
			 FROM memory_fragments WHERE session_id = ? AND source_kind = ? ORDER BY created_at DESC LIMIT ?`,
			sessionID, sourceKind, limit,
		)
	} else {
		rows, err = s.db.Query(
			`SELECT id, session_id, platform, group_id, user_id, content, source_kind, hash_value, keywords, metadata, emotional_tone, access_count, last_access_at, created_at, expires_at
			 FROM memory_fragments WHERE session_id = ? ORDER BY created_at DESC LIMIT ?`,
			sessionID, limit,
		)
	}
	if err != nil {
		return nil, fmt.Errorf("memory_store query by session: %w", err)
	}
	defer rows.Close()

	var fragments []*MemoryFragment
	for rows.Next() {
		frag, err := s.scanFragmentFromRows(rows)
		if err != nil {
			logger.Sugar.Warnw("[MemoryStore] scan fragment error", "error", err)
			continue
		}
		fragments = append(fragments, frag)
	}

	return fragments, nil
}

// QueryBySourceKind 按来源类型查询所有记忆片段
func (s *MemoryStore) QueryBySourceKind(sourceKind string, limit int) ([]*MemoryFragment, error) {
	if limit <= 0 {
		limit = 1000
	}

	rows, err := s.db.Query(
		`SELECT id, session_id, platform, group_id, user_id, content, source_kind, hash_value, keywords, metadata, emotional_tone, access_count, last_access_at, created_at, expires_at
		 FROM memory_fragments WHERE source_kind = ? ORDER BY created_at DESC LIMIT ?`,
		sourceKind, limit,
	)
	if err != nil {
		return nil, fmt.Errorf("memory_store query by source_kind: %w", err)
	}
	defer rows.Close()

	var fragments []*MemoryFragment
	for rows.Next() {
		frag, err := s.scanFragmentFromRows(rows)
		if err != nil {
			return nil, fmt.Errorf("memory_store scan fragment: %w", err)
		}
		fragments = append(fragments, frag)
	}

	return fragments, nil
}

func (s *MemoryStore) SearchByKeywords(keywords []string, limit int) ([]*MemoryFragment, error) {
	if limit <= 0 {
		limit = 20
	}

	var conditions []string
	var args []interface{}

	for _, kw := range keywords {
		kw = strings.TrimSpace(kw)
		if kw == "" {
			continue
		}
		conditions = append(conditions, "keywords LIKE ?")
		args = append(args, "%"+kw+"%")
	}

	if len(conditions) == 0 {
		return nil, nil
	}

	whereClause := strings.Join(conditions, " OR ")
	query := fmt.Sprintf(
		`SELECT id, session_id, platform, group_id, user_id, content, source_kind, hash_value, keywords, metadata, emotional_tone, access_count, last_access_at, created_at, expires_at
		 FROM memory_fragments WHERE %s ORDER BY created_at DESC LIMIT ?`, whereClause,
	)
	args = append(args, limit)

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("memory_store keyword search: %w", err)
	}
	defer rows.Close()

	var fragments []*MemoryFragment
	for rows.Next() {
		frag, err := s.scanFragmentFromRows(rows)
		if err != nil {
			logger.Sugar.Warnw("[MemoryStore] scan fragment error", "error", err)
			continue
		}
		fragments = append(fragments, frag)
	}

	return fragments, nil
}

func (s *MemoryStore) UpdateAccess(id string) error {
	_, err := s.db.Exec(
		`UPDATE memory_fragments SET access_count = access_count + 1, last_access_at = ? WHERE id = ?`,
		time.Now().UTC().Format("2006-01-02 15:04:05"), id,
	)
	return err
}

// BatchUpdateAccess 批量更新访问计数
func (s *MemoryStore) BatchUpdateAccess(ids []string) error {
	if len(ids) == 0 {
		return nil
	}

	placeholders := make([]string, len(ids))
	args := make([]interface{}, 0, len(ids)+1)
	args = append(args, time.Now().UTC().Format("2006-01-02 15:04:05"))

	for i, id := range ids {
		placeholders[i] = "?"
		args = append(args, id)
	}

	query := fmt.Sprintf(
		`UPDATE memory_fragments SET access_count = access_count + 1, last_access_at = ? WHERE id IN (%s)`,
		strings.Join(placeholders, ","),
	)

	_, err := s.db.Exec(query, args...)
	return err
}

func (s *MemoryStore) DeleteExpired() (int64, error) {
	result, err := s.db.Exec(
		`DELETE FROM memory_fragments WHERE expires_at IS NOT NULL AND expires_at < ?`,
		time.Now().UTC().Format("2006-01-02 15:04:05"),
	)
	if err != nil {
		return 0, fmt.Errorf("memory_store delete expired: %w", err)
	}
	affected, _ := result.RowsAffected()
	return affected, nil
}

func (s *MemoryStore) DeleteByID(id string) error {
	_, err := s.db.Exec(`DELETE FROM memory_fragments WHERE id = ?`, id)
	return err
}

func (s *MemoryStore) Count() (int, error) {
	var count int
	err := s.db.QueryRow(`SELECT COUNT(*) FROM memory_fragments`).Scan(&count)
	return count, err
}

func (s *MemoryStore) GetOldestIDs(limit int) ([]string, error) {
	rows, err := s.db.Query(
		`SELECT id FROM memory_fragments ORDER BY created_at ASC LIMIT ?`, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ids []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			continue
		}
		ids = append(ids, id)
	}
	return ids, nil
}

func (s *MemoryStore) GetAllIDs() ([]string, error) {
	rows, err := s.db.Query(`SELECT id FROM memory_fragments ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ids []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			continue
		}
		ids = append(ids, id)
	}
	return ids, nil
}

func (s *MemoryStore) GetOlderThan(cutoff time.Time, excludeKinds []SourceKind, limit int) ([]*MemoryFragment, error) {
	if limit <= 0 {
		limit = 200
	}

	query := `SELECT id, session_id, platform, group_id, user_id, content, source_kind, hash_value, keywords, metadata, emotional_tone, access_count, last_access_at, created_at, expires_at
		FROM memory_fragments WHERE created_at < ?`

	var args []interface{}
	args = append(args, cutoff.UTC().Format("2006-01-02 15:04:05"))

	if len(excludeKinds) > 0 {
		placeholders := make([]string, len(excludeKinds))
		for i, k := range excludeKinds {
			placeholders[i] = "?"
			args = append(args, string(k))
		}
		query += " AND source_kind NOT IN (" + strings.Join(placeholders, ",") + ")"
	}

	query += " ORDER BY created_at ASC LIMIT ?"
	args = append(args, limit)

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("memory_store get older than: %w", err)
	}
	defer rows.Close()

	var fragments []*MemoryFragment
	for rows.Next() {
		frag, err := s.scanFragmentFromRows(rows)
		if err != nil {
			logger.Sugar.Warnw("[MemoryStore] scan fragment error", "error", err)
			continue
		}
		fragments = append(fragments, frag)
	}

	return fragments, nil
}

func (s *MemoryStore) scanFragment(row *sql.Row) (*MemoryFragment, error) {
	var (
		id            string
		sessionID     string
		platform      string
		groupID       string
		userID        string
		content       string
		sourceKind    string
		hashValue     string
		keywordsStr   string
		metadataStr   string
		emotionalTone string
		accessCount   int
		lastAccessRaw sql.NullString
		createdAtStr  string
		expiresAtRaw  sql.NullString
	)

	err := row.Scan(
		&id, &sessionID, &platform, &groupID, &userID,
		&content, &sourceKind, &hashValue,
		&keywordsStr, &metadataStr, &emotionalTone,
		&accessCount, &lastAccessRaw,
		&createdAtStr, &expiresAtRaw,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return s.buildFragment(id, sessionID, platform, groupID, userID, content, sourceKind, hashValue,
		keywordsStr, metadataStr, emotionalTone, accessCount, lastAccessRaw, createdAtStr, expiresAtRaw)
}

func (s *MemoryStore) scanFragmentFromRows(rows *sql.Rows) (*MemoryFragment, error) {
	var (
		id            string
		sessionID     string
		platform      string
		groupID       string
		userID        string
		content       string
		sourceKind    string
		hashValue     string
		keywordsStr   string
		metadataStr   string
		emotionalTone string
		accessCount   int
		lastAccessRaw sql.NullString
		createdAtStr  string
		expiresAtRaw  sql.NullString
	)

	err := rows.Scan(
		&id, &sessionID, &platform, &groupID, &userID,
		&content, &sourceKind, &hashValue,
		&keywordsStr, &metadataStr, &emotionalTone,
		&accessCount, &lastAccessRaw,
		&createdAtStr, &expiresAtRaw,
	)
	if err != nil {
		return nil, err
	}

	return s.buildFragment(id, sessionID, platform, groupID, userID, content, sourceKind, hashValue,
		keywordsStr, metadataStr, emotionalTone, accessCount, lastAccessRaw, createdAtStr, expiresAtRaw)
}

func (s *MemoryStore) buildFragment(
	id, sessionID, platform, groupID, userID, content, sourceKind, hashValue,
	keywordsStr, metadataStr, emotionalTone string,
	accessCount int,
	lastAccessRaw sql.NullString,
	createdAtStr string,
	expiresAtRaw sql.NullString,
) (*MemoryFragment, error) {
	var keywords []string
	if keywordsStr != "" {
		if err := json.Unmarshal([]byte(keywordsStr), &keywords); err != nil {
			logger.Sugar.Warnw("[记忆存储] 关键词反序列化失败", "error", err, "json", keywordsStr)
		}
	}
	if keywords == nil {
		keywords = []string{}
	}

	var metadata map[string]interface{}
	if metadataStr != "" && metadataStr != "{}" {
		if err := json.Unmarshal([]byte(metadataStr), &metadata); err != nil {
			logger.Sugar.Warnw("[记忆存储] 元数据反序列化失败", "error", err, "json", metadataStr)
		}
	}
	if metadata == nil {
		metadata = make(map[string]interface{})
	}

	createdAt := parseTimestamp(createdAtStr)

	var lastAccess *time.Time
	if lastAccessRaw.Valid {
		t := parseTimestamp(lastAccessRaw.String)
		lastAccess = &t
	}

	var expiresAt *time.Time
	if expiresAtRaw.Valid {
		t := parseTimestamp(expiresAtRaw.String)
		expiresAt = &t
	}

	return &MemoryFragment{
		ID:            id,
		SessionID:     sessionID,
		Platform:      platform,
		GroupID:       groupID,
		UserID:        userID,
		Content:       content,
		SourceKind:    SourceKind(sourceKind),
		HashValue:     hashValue,
		Keywords:      keywords,
		Metadata:      metadata,
		EmotionalTone: emotionalTone,
		AccessCount:   accessCount,
		LastAccess:    lastAccess,
		CreatedAt:     createdAt,
		ExpiresAt:     expiresAt,
	}, nil
}
