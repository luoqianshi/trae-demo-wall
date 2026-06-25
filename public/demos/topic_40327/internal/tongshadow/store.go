package tongshadow

import (
	"database/sql"
	"encoding/binary"
	"fmt"
	"math"
	"time"

	"YaraFlow/internal/storage"
)

// Portrait 瞳影自画像条目
type Portrait struct {
	ID          string
	ImageData   []byte
	ImageHash   string
	MimeType    string
	Description string
	Embedding   []float32
	CreatedAt   time.Time
}

// PortraitListItem 列表项（不含 image_data 和 embedding，节省带宽）
type PortraitListItem struct {
	ID          string    `json:"id"`
	ImageHash   string    `json:"image_hash"`
	MimeType    string    `json:"mime_type"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
}

// Store 瞳影存储层
type Store struct {
	db *sql.DB
}

// NewStore 创建瞳影存储
func NewStore() *Store {
	return &Store{db: storage.GetDB()}
}

// Add 添加自画像
func (s *Store) Add(portrait *Portrait) error {
	if s.db == nil {
		return fmt.Errorf("数据库未初始化")
	}

	_, err := s.db.Exec(
		`INSERT INTO tong_shadow_portraits (id, image_data, image_hash, mime_type, description, embedding, created_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?)`,
		portrait.ID, portrait.ImageData, portrait.ImageHash, portrait.MimeType,
		portrait.Description, floatsToBytes(portrait.Embedding), portrait.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("添加自画像失败: %w", err)
	}

	return nil
}

// Delete 删除自画像
func (s *Store) Delete(id string) error {
	if s.db == nil {
		return fmt.Errorf("数据库未初始化")
	}

	result, err := s.db.Exec(`DELETE FROM tong_shadow_portraits WHERE id = ?`, id)
	if err != nil {
		return fmt.Errorf("删除自画像失败: %w", err)
	}

	affected, _ := result.RowsAffected()
	if affected == 0 {
		return fmt.Errorf("自画像不存在: id=%s", id)
	}

	return nil
}

// GetByID 根据ID获取自画像
func (s *Store) GetByID(id string) (*Portrait, error) {
	if s.db == nil {
		return nil, fmt.Errorf("数据库未初始化")
	}

	row := s.db.QueryRow(
		`SELECT id, image_data, image_hash, mime_type, description, embedding, created_at
		 FROM tong_shadow_portraits WHERE id = ?`, id,
	)

	return s.scanPortrait(row)
}

// GetByHash 根据哈希获取自画像（用于去重）
func (s *Store) GetByHash(hash string) (*Portrait, error) {
	if s.db == nil {
		return nil, fmt.Errorf("数据库未初始化")
	}

	row := s.db.QueryRow(
		`SELECT id, image_data, image_hash, mime_type, description, embedding, created_at
		 FROM tong_shadow_portraits WHERE image_hash = ?`, hash,
	)

	portrait, err := s.scanPortrait(row)
	if err != nil {
		return nil, err
	}
	if portrait == nil {
		return nil, nil
	}
	return portrait, nil
}

// GetImageData 获取图片二进制数据
func (s *Store) GetImageData(id string) ([]byte, string, error) {
	if s.db == nil {
		return nil, "", fmt.Errorf("数据库未初始化")
	}

	row := s.db.QueryRow(
		`SELECT image_data, mime_type FROM tong_shadow_portraits WHERE id = ?`, id,
	)

	var imageData []byte
	var mimeType string
	err := row.Scan(&imageData, &mimeType)
	if err == sql.ErrNoRows {
		return nil, "", fmt.Errorf("自画像不存在: id=%s", id)
	}
	if err != nil {
		return nil, "", fmt.Errorf("获取图片数据失败: %w", err)
	}

	return imageData, mimeType, nil
}

// List 列出所有自画像（不含 image_data 和 embedding）
func (s *Store) List() ([]*PortraitListItem, error) {
	if s.db == nil {
		return nil, fmt.Errorf("数据库未初始化")
	}

	rows, err := s.db.Query(
		`SELECT id, image_hash, mime_type, description, created_at
		 FROM tong_shadow_portraits ORDER BY created_at DESC`,
	)
	if err != nil {
		return nil, fmt.Errorf("查询自画像列表失败: %w", err)
	}
	defer rows.Close()

	var items []*PortraitListItem
	for rows.Next() {
		var item PortraitListItem
		var createdAt string
		if err := rows.Scan(&item.ID, &item.ImageHash, &item.MimeType, &item.Description, &createdAt); err != nil {
			return nil, err
		}
		item.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAt)
		items = append(items, &item)
	}

	return items, nil
}

// Count 统计自画像数量
func (s *Store) Count() (int, error) {
	if s.db == nil {
		return 0, fmt.Errorf("数据库未初始化")
	}

	var count int
	err := s.db.QueryRow(`SELECT COUNT(*) FROM tong_shadow_portraits`).Scan(&count)
	if err != nil {
		return 0, err
	}
	return count, nil
}

// GetAll 获取所有自画像（含完整数据，用于启动时加载向量）
func (s *Store) GetAll() ([]*Portrait, error) {
	if s.db == nil {
		return nil, fmt.Errorf("数据库未初始化")
	}

	rows, err := s.db.Query(
		`SELECT id, image_data, image_hash, mime_type, description, embedding, created_at
		 FROM tong_shadow_portraits ORDER BY created_at`,
	)
	if err != nil {
		return nil, fmt.Errorf("查询所有自画像失败: %w", err)
	}
	defer rows.Close()

	var portraits []*Portrait
	for rows.Next() {
		var p Portrait
		var embeddingBytes []byte
		var createdAt string
		if err := rows.Scan(&p.ID, &p.ImageData, &p.ImageHash, &p.MimeType, &p.Description, &embeddingBytes, &createdAt); err != nil {
			return nil, err
		}
		p.Embedding = bytesToFloats(embeddingBytes)
		p.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAt)
		portraits = append(portraits, &p)
	}

	return portraits, nil
}

// scanPortrait 扫描一行数据为 Portrait
func (s *Store) scanPortrait(row *sql.Row) (*Portrait, error) {
	var p Portrait
	var embeddingBytes []byte
	var createdAt string

	err := row.Scan(&p.ID, &p.ImageData, &p.ImageHash, &p.MimeType, &p.Description, &embeddingBytes, &createdAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("查询自画像失败: %w", err)
	}

	p.Embedding = bytesToFloats(embeddingBytes)
	p.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAt)

	return &p, nil
}

// floatsToBytes 将 []float32 序列化为二进制（LittleEndian）
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

// bytesToFloats 将二进制反序列化为 []float32
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
