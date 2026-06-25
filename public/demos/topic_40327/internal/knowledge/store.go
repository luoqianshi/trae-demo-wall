package knowledge

import (
	"database/sql"
	"encoding/binary"
	"fmt"
	"math"
	"strings"
	"time"
)

// Entry 备忘录条目
type Entry struct {
	ID        int64
	Content   string
	Tags      []string
	Source    string
	Embedding []float32
	CreatedAt time.Time
	UpdatedAt time.Time
}

// Store 备忘录存储层
type Store struct {
	db *sql.DB
}

// NewStore 创建备忘录存储
func NewStore(db *sql.DB) *Store {
	return &Store{db: db}
}

// Add 添加备忘录条目
func (s *Store) Add(content string, tags []string, source string) (*Entry, error) {
	if s.db == nil {
		return nil, fmt.Errorf("数据库未初始化")
	}

	content = strings.TrimSpace(content)
	if content == "" {
		return nil, fmt.Errorf("备忘录内容不能为空")
	}

	if source == "" {
		source = "manual"
	}

	tagsStr := strings.Join(tags, ",")
	now := time.Now()

	result, err := s.db.Exec(
		`INSERT INTO knowledge_entries (content, tags, source, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?)`,
		content, tagsStr, source, now, now,
	)
	if err != nil {
		return nil, fmt.Errorf("添加备忘录条目失败: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}

	return &Entry{
		ID:        id,
		Content:   content,
		Tags:      tags,
		Source:    source,
		CreatedAt: now,
		UpdatedAt: now,
	}, nil
}

// Update 更新备忘录条目
func (s *Store) Update(id int64, content string, tags []string) (*Entry, error) {
	if s.db == nil {
		return nil, fmt.Errorf("数据库未初始化")
	}

	content = strings.TrimSpace(content)
	if content == "" {
		return nil, fmt.Errorf("备忘录内容不能为空")
	}

	tagsStr := strings.Join(tags, ",")
	now := time.Now()

	_, err := s.db.Exec(
		`UPDATE knowledge_entries SET content = ?, tags = ?, updated_at = ? WHERE id = ?`,
		content, tagsStr, now, id,
	)
	if err != nil {
		return nil, fmt.Errorf("更新备忘录条目失败: %w", err)
	}

	return &Entry{
		ID:        id,
		Content:   content,
		Tags:      tags,
		UpdatedAt: now,
	}, nil
}

// Delete 删除备忘录条目
func (s *Store) Delete(id int64) error {
	if s.db == nil {
		return fmt.Errorf("数据库未初始化")
	}

	result, err := s.db.Exec(`DELETE FROM knowledge_entries WHERE id = ?`, id)
	if err != nil {
		return fmt.Errorf("删除备忘录条目失败: %w", err)
	}

	affected, _ := result.RowsAffected()
	if affected == 0 {
		return fmt.Errorf("备忘录条目不存在: id=%d", id)
	}

	return nil
}

// GetByID 根据ID获取备忘录条目
func (s *Store) GetByID(id int64) (*Entry, error) {
	if s.db == nil {
		return nil, fmt.Errorf("数据库未初始化")
	}

	row := s.db.QueryRow(
		`SELECT id, content, tags, source, created_at, updated_at
		 FROM knowledge_entries WHERE id = ?`, id,
	)

	var entry Entry
	var tagsStr string
	var createdAt, updatedAt string
	err := row.Scan(&entry.ID, &entry.Content, &tagsStr, &entry.Source, &createdAt, &updatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("查询备忘录条目失败: %w", err)
	}

	entry.Tags = parseTags(tagsStr)
	entry.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAt)
	entry.UpdatedAt, _ = time.Parse("2006-01-02 15:04:05", updatedAt)

	return &entry, nil
}

// List 列出备忘录条目（分页）
func (s *Store) List(offset, limit int) ([]*Entry, int, error) {
	if s.db == nil {
		return nil, 0, fmt.Errorf("数据库未初始化")
	}

	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}

	var total int
	err := s.db.QueryRow(`SELECT COUNT(*) FROM knowledge_entries`).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	rows, err := s.db.Query(
		`SELECT id, content, tags, source, created_at, updated_at
		 FROM knowledge_entries ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
		limit, offset,
	)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var entries []*Entry
	for rows.Next() {
		var entry Entry
		var tagsStr string
		var createdAt, updatedAt string
		if err := rows.Scan(&entry.ID, &entry.Content, &tagsStr, &entry.Source, &createdAt, &updatedAt); err != nil {
			return nil, 0, err
		}
		entry.Tags = parseTags(tagsStr)
		entry.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAt)
		entry.UpdatedAt, _ = time.Parse("2006-01-02 15:04:05", updatedAt)
		entries = append(entries, &entry)
	}

	return entries, total, nil
}

// SearchByKeyword 按关键词搜索备忘录条目
func (s *Store) SearchByKeyword(keyword string, limit int) ([]*Entry, error) {
	if s.db == nil {
		return nil, fmt.Errorf("数据库未初始化")
	}

	if limit <= 0 {
		limit = 20
	}

	likePattern := "%" + keyword + "%"
	rows, err := s.db.Query(
		`SELECT id, content, tags, source, created_at, updated_at
		 FROM knowledge_entries
		 WHERE content LIKE ? OR tags LIKE ?
		 ORDER BY updated_at DESC LIMIT ?`,
		likePattern, likePattern, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []*Entry
	for rows.Next() {
		var entry Entry
		var tagsStr string
		var createdAt, updatedAt string
		if err := rows.Scan(&entry.ID, &entry.Content, &tagsStr, &entry.Source, &createdAt, &updatedAt); err != nil {
			return nil, err
		}
		entry.Tags = parseTags(tagsStr)
		entry.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAt)
		entry.UpdatedAt, _ = time.Parse("2006-01-02 15:04:05", updatedAt)
		entries = append(entries, &entry)
	}

	return entries, nil
}

// GetAll 获取所有条目（用于批量处理，包含embedding）
func (s *Store) GetAll() ([]*Entry, error) {
	if s.db == nil {
		return nil, fmt.Errorf("数据库未初始化")
	}

	rows, err := s.db.Query(
		`SELECT id, content, tags, source, embedding, created_at, updated_at
		 FROM knowledge_entries ORDER BY id`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []*Entry
	for rows.Next() {
		var entry Entry
		var tagsStr string
		var embeddingBytes []byte
		var createdAt, updatedAt string
		if err := rows.Scan(&entry.ID, &entry.Content, &tagsStr, &entry.Source, &embeddingBytes, &createdAt, &updatedAt); err != nil {
			return nil, err
		}
		entry.Tags = parseTags(tagsStr)
		entry.Embedding = bytesToFloats(embeddingBytes)
		entry.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAt)
		entry.UpdatedAt, _ = time.Parse("2006-01-02 15:04:05", updatedAt)
		entries = append(entries, &entry)
	}

	return entries, nil
}

// UpdateEmbedding 更新条目的向量嵌入
func (s *Store) UpdateEmbedding(id int64, embedding []float32) error {
	if s.db == nil {
		return fmt.Errorf("数据库未初始化")
	}

	// 将 []float32 序列化为二进制
	data := floatsToBytes(embedding)
	_, err := s.db.Exec(`UPDATE knowledge_entries SET embedding = ? WHERE id = ?`, data, id)
	return err
}

func parseTags(tagsStr string) []string {
	if tagsStr == "" {
		return nil
	}
	parts := strings.Split(tagsStr, ",")
	var result []string
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			result = append(result, p)
		}
	}
	return result
}

func floatsToBytes(floats []float32) []byte {
	if len(floats) == 0 {
		return nil
	}
	buf := make([]byte, len(floats)*4)
	for i, f := range floats {
		binary.LittleEndian.PutUint32(buf[i*4:], math.Float32bits(f))
	}
	return buf
}

func bytesToFloats(data []byte) []float32 {
	if len(data) == 0 {
		return nil
	}
	count := len(data) / 4
	floats := make([]float32, count)
	for i := 0; i < count; i++ {
		floats[i] = math.Float32frombits(binary.LittleEndian.Uint32(data[i*4:]))
	}
	return floats
}
