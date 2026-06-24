// Package jargon 提供黑话/新词自动学习功能：
//   - 从消息中自动提取未知词汇
//   - 使用 LLM 推断词义
//   - 持久化存储到 SQLite
//   - 支持频率统计和查询
package jargon

import (
	"database/sql"
	"fmt"
	"strings"
	"time"

	"YaraFlow/internal/llm"
	"YaraFlow/internal/logger"
	"YaraFlow/internal/storage"
)

// JargonEntry 单条黑话/新词条目
type JargonEntry struct {
	ID        int       `json:"id"`
	Word      string    `json:"word"`
	Meaning   string    `json:"meaning"`
	Frequency int       `json:"frequency"`
	Source    string    `json:"source"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// JargonManager 黑话/新词管理器
type JargonManager struct {
	db          *sql.DB
	llmProvider llm.LLMProvider
}

// NewJargonManager 创建黑话管理器
func NewJargonManager(llmProvider llm.LLMProvider) *JargonManager {
	return &JargonManager{
		db:          storage.GetDB(),
		llmProvider: llmProvider,
	}
}

// AddUnknownWords 批量添加未知词，自动推断词义
// 返回成功学习的词条列表
func (jm *JargonManager) AddUnknownWords(words []string, source string, context string) []*JargonEntry {
	var learned []*JargonEntry
	for _, word := range words {
		word = strings.TrimSpace(word)
		if word == "" {
			continue
		}
		entry, err := jm.LearnWord(word, source, context)
		if err != nil {
			logger.Sugar.Warnw("黑话学习失败", "word", word, "error", err)
			continue
		}
		if entry != nil {
			learned = append(learned, entry)
		}
	}
	return learned
}

// LearnWord 学习单个词：如果已存在则增加频率，否则用 LLM 推断词义
func (jm *JargonManager) LearnWord(word, source, context string) (*JargonEntry, error) {
	if jm.db == nil {
		return nil, fmt.Errorf("数据库未初始化")
	}

	// 检查是否已存在
	existing, err := jm.Lookup(word)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	if existing != nil {
		// 已存在，增加频率
		if err := jm.incrementFrequency(word); err != nil {
			return nil, err
		}
		existing.Frequency++
		return existing, nil
	}

	// 新词：用 LLM 推断词义
	meaning, err := jm.inferMeaning(word, context)
	if err != nil {
		// LLM 推断失败，使用默认释义
		logger.Sugar.Warnw("黑话词义推断失败，使用默认释义", "word", word, "error", err)
		meaning = "群内用语，具体含义待确认"
	}

	entry, err := jm.insertWord(word, meaning, source)
	if err != nil {
		return nil, err
	}

	logger.Sugar.Infow("黑话学习成功", "word", word, "meaning", meaning, "source", source)
	return entry, nil
}

// Lookup 查询一个词的含义
func (jm *JargonManager) Lookup(word string) (*JargonEntry, error) {
	if jm.db == nil {
		return nil, fmt.Errorf("数据库未初始化")
	}

	row := jm.db.QueryRow(
		`SELECT id, word, meaning, frequency, source, created_at, updated_at 
		 FROM jargon_dict WHERE word = ?`,
		word,
	)

	var entry JargonEntry
	var createdAt, updatedAt string
	err := row.Scan(&entry.ID, &entry.Word, &entry.Meaning, &entry.Frequency,
		&entry.Source, &createdAt, &updatedAt)
	if err != nil {
		return nil, err
	}

	entry.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAt)
	entry.UpdatedAt, _ = time.Parse("2006-01-02 15:04:05", updatedAt)
	return &entry, nil
}

// List 列出所有黑话条目（按频率降序）
func (jm *JargonManager) List(limit int) ([]*JargonEntry, error) {
	if jm.db == nil {
		return nil, fmt.Errorf("数据库未初始化")
	}

	rows, err := jm.db.Query(
		`SELECT id, word, meaning, frequency, source, created_at, updated_at 
		 FROM jargon_dict ORDER BY frequency DESC LIMIT ?`,
		limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []*JargonEntry
	for rows.Next() {
		var entry JargonEntry
		var createdAt, updatedAt string
		if err := rows.Scan(&entry.ID, &entry.Word, &entry.Meaning, &entry.Frequency,
			&entry.Source, &createdAt, &updatedAt); err != nil {
			continue
		}
		entry.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", createdAt)
		entry.UpdatedAt, _ = time.Parse("2006-01-02 15:04:05", updatedAt)
		entries = append(entries, &entry)
	}
	return entries, nil
}

// GetStats 获取统计信息
func (jm *JargonManager) GetStats() map[string]interface{} {
	stats := map[string]interface{}{
		"total": 0,
	}
	if jm.db == nil {
		return stats
	}

	var total int
	jm.db.QueryRow("SELECT COUNT(*) FROM jargon_dict").Scan(&total)
	stats["total"] = total

	var recent int
	jm.db.QueryRow("SELECT COUNT(*) FROM jargon_dict WHERE updated_at > datetime('now', '-7 days')").Scan(&recent)
	stats["recent_7d"] = recent

	return stats
}

// injectMeaning 用 LLM 推断词义
func (jm *JargonManager) inferMeaning(word, context string) (string, error) {
	if jm.llmProvider == nil {
		return "", fmt.Errorf("LLM provider 未初始化")
	}

	prompt := fmt.Sprintf(`请解释以下群聊中出现的词汇或黑话的含义：

词汇：%s
上下文：%s

请用简短的中文解释这个词的含义（20字以内），如果无法确定也请给出最可能的猜测。只返回释义本身，不要加引号或其他修饰。`, word, context)

	messages := []llm.ChatMessage{
		{Role: "system", Content: "你是一个中文网络用语和黑话解释助手。请用简短的中文解释词汇含义，只返回释义本身。"},
		{Role: "user", Content: prompt},
	}

	response, err := jm.llmProvider.Chat(messages)
	if err != nil {
		return "", err
	}

	meaning := strings.TrimSpace(response)
	// 清理可能的引号
	meaning = strings.Trim(meaning, `"'`)
	if len(meaning) > 100 {
		meaning = meaning[:100]
	}
	return meaning, nil
}

func (jm *JargonManager) insertWord(word, meaning, source string) (*JargonEntry, error) {
	now := time.Now().Format("2006-01-02 15:04:05")
	result, err := jm.db.Exec(
		`INSERT INTO jargon_dict (word, meaning, frequency, source, created_at, updated_at) 
		 VALUES (?, ?, 1, ?, ?, ?)`,
		word, meaning, source, now, now,
	)
	if err != nil {
		return nil, err
	}

	id, _ := result.LastInsertId()
	return &JargonEntry{
		ID:        int(id),
		Word:      word,
		Meaning:   meaning,
		Frequency: 1,
		Source:    source,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}, nil
}

func (jm *JargonManager) incrementFrequency(word string) error {
	_, err := jm.db.Exec(
		`UPDATE jargon_dict SET frequency = frequency + 1, updated_at = ? WHERE word = ?`,
		time.Now().Format("2006-01-02 15:04:05"), word,
	)
	return err
}

// Delete 根据 ID 删除一个黑话条目
func (jm *JargonManager) Delete(id int) error {
	if jm.db == nil {
		return fmt.Errorf("数据库未初始化")
	}

	result, err := jm.db.Exec("DELETE FROM jargon_dict WHERE id = ?", id)
	if err != nil {
		return err
	}

	affected, _ := result.RowsAffected()
	if affected == 0 {
		return fmt.Errorf("黑话条目 #%d 不存在", id)
	}

	return nil
}
