package memory

import (
	"crypto/sha1"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"YaraFlow/internal/logger"
	"YaraFlow/internal/storage"
)

type GraphEntity struct {
	ID        string
	Name      string
	Type      string
	Metadata  map[string]interface{}
	CreatedAt time.Time
	UpdatedAt time.Time
}

type GraphRelation struct {
	ID        string
	Subject   string
	Predicate string
	Object    string
	Metadata  map[string]interface{}
	CreatedAt time.Time
}

type GraphStore struct {
	db *sql.DB
}

func NewGraphStore() *GraphStore {
	return &GraphStore{
		db: storage.GetDB(),
	}
}

func computeEntityID(name string, entityType string) string {
	h := sha1.New()
	h.Write([]byte(strings.ToLower(name) + "|" + entityType))
	return hex.EncodeToString(h.Sum(nil))
}

func computeRelationID(subject, predicate, object string) string {
	h := sha1.New()
	h.Write([]byte(strings.ToLower(subject) + "|" + predicate + "|" + strings.ToLower(object)))
	return hex.EncodeToString(h.Sum(nil))
}

func (gs *GraphStore) UpsertEntity(name, entityType string, metadata map[string]interface{}) (*GraphEntity, error) {
	if gs.db == nil {
		return nil, fmt.Errorf("数据库未初始化")
	}

	name = strings.TrimSpace(name)
	if name == "" {
		return nil, fmt.Errorf("实体名称不能为空")
	}
	if entityType == "" {
		entityType = "unknown"
	}

	id := computeEntityID(name, entityType)
	now := time.Now()

	metaJSON := "{}"
	if len(metadata) > 0 {
		data, err := json.Marshal(metadata)
		if err == nil {
			metaJSON = string(data)
		}
	}

	_, err := gs.db.Exec(
		`INSERT INTO graph_entities (id, name, type, metadata, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?)
		 ON CONFLICT(id) DO UPDATE SET metadata = excluded.metadata, updated_at = excluded.updated_at`,
		id, name, entityType, metaJSON, now.Format("2006-01-02 15:04:05"), now.Format("2006-01-02 15:04:05"),
	)
	if err != nil {
		return nil, fmt.Errorf("插入实体失败: %w", err)
	}

	return &GraphEntity{
		ID:        id,
		Name:      name,
		Type:      entityType,
		Metadata:  metadata,
		CreatedAt: now,
		UpdatedAt: now,
	}, nil
}

func (gs *GraphStore) GetEntity(name string) (*GraphEntity, error) {
	if gs.db == nil {
		return nil, fmt.Errorf("数据库未初始化")
	}

	row := gs.db.QueryRow(
		`SELECT id, name, type, metadata, created_at, updated_at
		 FROM graph_entities WHERE name = ? COLLATE NOCASE LIMIT 1`, strings.TrimSpace(name),
	)

	var (
		id         string
		ename      string
		entityType string
		metaJSON   string
		createdStr string
		updatedStr string
	)

	err := row.Scan(&id, &ename, &entityType, &metaJSON, &createdStr, &updatedStr)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	var metadata map[string]interface{}
	if metaJSON != "" {
		json.Unmarshal([]byte(metaJSON), &metadata)
	}
	if metadata == nil {
		metadata = make(map[string]interface{})
	}

	return &GraphEntity{
		ID:        id,
		Name:      ename,
		Type:      entityType,
		Metadata:  metadata,
		CreatedAt: parseTimestamp(createdStr),
		UpdatedAt: parseTimestamp(updatedStr),
	}, nil
}

func (gs *GraphStore) SearchEntities(namePrefix string, limit int) ([]*GraphEntity, error) {
	if gs.db == nil {
		return nil, fmt.Errorf("数据库未初始化")
	}

	if limit <= 0 {
		limit = 10
	}

	rows, err := gs.db.Query(
		`SELECT id, name, type, metadata, created_at, updated_at
		 FROM graph_entities WHERE name LIKE ? COLLATE NOCASE LIMIT ?`,
		"%"+strings.TrimSpace(namePrefix)+"%", limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entities []*GraphEntity
	for rows.Next() {
		var (
			id         string
			ename      string
			entityType string
			metaJSON   string
			createdStr string
			updatedStr string
		)
		if err := rows.Scan(&id, &ename, &entityType, &metaJSON, &createdStr, &updatedStr); err != nil {
			logger.Sugar.Warnw("[GraphStore] 扫描实体行失败", "error", err)
			continue
		}

		var metadata map[string]interface{}
		if metaJSON != "" {
			json.Unmarshal([]byte(metaJSON), &metadata)
		}
		if metadata == nil {
			metadata = make(map[string]interface{})
		}

		entities = append(entities, &GraphEntity{
			ID:        id,
			Name:      ename,
			Type:      entityType,
			Metadata:  metadata,
			CreatedAt: parseTimestamp(createdStr),
			UpdatedAt: parseTimestamp(updatedStr),
		})
	}

	return entities, nil
}

func (gs *GraphStore) AddRelation(subject, predicate, object string, metadata map[string]interface{}) (*GraphRelation, error) {
	if gs.db == nil {
		return nil, fmt.Errorf("数据库未初始化")
	}

	subject = strings.TrimSpace(subject)
	predicate = strings.TrimSpace(predicate)
	object = strings.TrimSpace(object)

	if subject == "" || predicate == "" || object == "" {
		return nil, fmt.Errorf("关系三元组不能为空")
	}

	id := computeRelationID(subject, predicate, object)
	now := time.Now()

	metaJSON := "{}"
	if len(metadata) > 0 {
		data, err := json.Marshal(metadata)
		if err == nil {
			metaJSON = string(data)
		}
	}

	_, err := gs.db.Exec(
		`INSERT OR IGNORE INTO graph_relations (id, subject, predicate, object, metadata, created_at)
		 VALUES (?, ?, ?, ?, ?, ?)`,
		id, subject, predicate, object, metaJSON, now.Format("2006-01-02 15:04:05"),
	)
	if err != nil {
		return nil, fmt.Errorf("插入关系失败: %w", err)
	}

	return &GraphRelation{
		ID:        id,
		Subject:   subject,
		Predicate: predicate,
		Object:    object,
		Metadata:  metadata,
		CreatedAt: now,
	}, nil
}

func (gs *GraphStore) GetRelationsForEntity(entityName string, limit int) ([]*GraphRelation, error) {
	if gs.db == nil {
		return nil, fmt.Errorf("数据库未初始化")
	}

	if limit <= 0 {
		limit = 50
	}

	rows, err := gs.db.Query(
		`SELECT id, subject, predicate, object, metadata, created_at
		 FROM graph_relations
		 WHERE subject = ? COLLATE NOCASE OR object = ? COLLATE NOCASE
		 ORDER BY created_at DESC LIMIT ?`,
		strings.TrimSpace(entityName), strings.TrimSpace(entityName), limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var relations []*GraphRelation
	for rows.Next() {
		var (
			id         string
			subject    string
			predicate  string
			object     string
			metaJSON   string
			createdStr string
		)
		if err := rows.Scan(&id, &subject, &predicate, &object, &metaJSON, &createdStr); err != nil {
			logger.Sugar.Warnw("[GraphStore] 扫描关系行失败", "error", err)
			continue
		}

		var metadata map[string]interface{}
		if metaJSON != "" {
			json.Unmarshal([]byte(metaJSON), &metadata)
		}
		if metadata == nil {
			metadata = make(map[string]interface{})
		}

		relations = append(relations, &GraphRelation{
			ID:        id,
			Subject:   subject,
			Predicate: predicate,
			Object:    object,
			Metadata:  metadata,
			CreatedAt: parseTimestamp(createdStr),
		})
	}

	return relations, nil
}

func (gs *GraphStore) GetConnectedEntities(entityName string, limit int) ([]string, error) {
	relations, err := gs.GetRelationsForEntity(entityName, limit)
	if err != nil {
		return nil, err
	}

	seen := make(map[string]bool)
	var entities []string

	for _, rel := range relations {
		if !strings.EqualFold(rel.Subject, entityName) && !seen[rel.Subject] {
			seen[rel.Subject] = true
			entities = append(entities, rel.Subject)
		}
		if !strings.EqualFold(rel.Object, entityName) && !seen[rel.Object] {
			seen[rel.Object] = true
			entities = append(entities, rel.Object)
		}
	}

	return entities, nil
}

func (gs *GraphStore) FormatEntityCard(entityName string) string {
	entity, err := gs.GetEntity(entityName)
	if err != nil || entity == nil {
		return ""
	}

	relations, _ := gs.GetRelationsForEntity(entityName, 20)

	var builder strings.Builder
	typeLabel := entity.Type
	switch typeLabel {
	case "person":
		typeLabel = "人物"
	case "place":
		typeLabel = "地点"
	case "concept":
		typeLabel = "概念"
	case "thing":
		typeLabel = "物品"
	case "organization":
		typeLabel = "组织"
	}

	builder.WriteString(fmt.Sprintf("[%s · %s]\n", entityName, typeLabel))

	if len(relations) > 0 {
		for _, rel := range relations {
			if strings.EqualFold(rel.Subject, entityName) {
				builder.WriteString(fmt.Sprintf("- %s %s %s\n", entityName, rel.Predicate, rel.Object))
			} else {
				builder.WriteString(fmt.Sprintf("- %s %s %s\n", rel.Subject, rel.Predicate, entityName))
			}
		}
	}

	return builder.String()
}

func (gs *GraphStore) EntityCount() (int, error) {
	if gs.db == nil {
		return 0, fmt.Errorf("数据库未初始化")
	}

	var count int
	err := gs.db.QueryRow(`SELECT COUNT(*) FROM graph_entities`).Scan(&count)
	return count, err
}

func (gs *GraphStore) RelationCount() (int, error) {
	if gs.db == nil {
		return 0, fmt.Errorf("数据库未初始化")
	}

	var count int
	err := gs.db.QueryRow(`SELECT COUNT(*) FROM graph_relations`).Scan(&count)
	return count, err
}
