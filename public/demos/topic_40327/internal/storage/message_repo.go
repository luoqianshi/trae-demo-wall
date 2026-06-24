package storage

import (
	"database/sql"
	"fmt"
	"strings"
	"time"

	"YaraFlow/internal/logger"
	"YaraFlow/internal/storage/migrate"
)

type MessageRecord struct {
	ID           int64
	MessageID    string
	Platform     string
	SenderID     string
	SenderName   string
	GroupID      string
	GroupName    string
	Content      string
	Snippet      string // FTS5搜索高亮片段，仅在SearchMessages时填充
	Direction    string
	IsAtMe       bool
	HasImage     bool
	ReplyToMsgID string
	Timestamp    int64
}

func SaveMessage(record MessageRecord) error {
	if db == nil {
		return fmt.Errorf("数据库未初始化")
	}

	_, err := db.Exec(
		`INSERT INTO messages (message_id, platform, sender_id, sender_name, group_id, group_name, content, direction, is_at_me, has_image, reply_to_msg_id, timestamp)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		record.MessageID, record.Platform, record.SenderID, record.SenderName,
		record.GroupID, record.GroupName, record.Content, record.Direction, record.IsAtMe,
		record.HasImage, record.ReplyToMsgID, record.Timestamp,
	)
	if err != nil {
		logger.Sugar.Errorw("保存消息失败", "error", err, "message_id", record.MessageID)
		return err
	}

	logger.Sugar.Debugw("消息已入库", "direction", record.Direction, "message_id", record.MessageID)
	return nil
}

func GetRecentMessages(platform, groupID string, limit int) ([]MessageRecord, error) {
	if db == nil {
		return nil, fmt.Errorf("数据库未初始化")
	}

	if limit <= 0 {
		limit = 50
	}

	// 当 platform 和 groupID 都为空时，返回所有平台的消息
	if platform == "" && groupID == "" {
		rows, err := db.Query(
			`SELECT id, message_id, platform, sender_id, sender_name, group_id, COALESCE(group_name,'') as group_name, content, direction, is_at_me, has_image, reply_to_msg_id, timestamp
			 FROM messages ORDER BY timestamp DESC LIMIT ?`,
			limit,
		)
		if err != nil {
			return nil, err
		}
		defer rows.Close()
		return scanMessages(rows)
	}

	// 构建动态查询条件
	var conditions []string
	var args []interface{}

	if platform != "" {
		conditions = append(conditions, "platform = ?")
		args = append(args, platform)
	}
	if groupID != "" {
		conditions = append(conditions, "group_id = ?")
		args = append(args, groupID)
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "WHERE " + strings.Join(conditions, " AND ")
	}
	args = append(args, limit)

	rows, err := db.Query(
		fmt.Sprintf(`SELECT id, message_id, platform, sender_id, sender_name, group_id, COALESCE(group_name,'') as group_name, content, direction, is_at_me, has_image, reply_to_msg_id, timestamp
		 FROM messages %s ORDER BY timestamp DESC LIMIT ?`, whereClause),
		args...,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return scanMessages(rows)
}

// scanMessages 扫描消息记录行
func scanMessages(rows *sql.Rows) ([]MessageRecord, error) {
	var records []MessageRecord
	for rows.Next() {
		var r MessageRecord
		err := rows.Scan(&r.ID, &r.MessageID, &r.Platform, &r.SenderID, &r.SenderName,
			&r.GroupID, &r.GroupName, &r.Content, &r.Direction, &r.IsAtMe, &r.HasImage, &r.ReplyToMsgID, &r.Timestamp)
		if err != nil {
			return nil, err
		}
		records = append(records, r)
	}
	return records, nil
}

// SearchMessages 使用FTS5全文搜索消息
// query: 搜索关键词（支持FTS5语法，如 "hello world" 精确匹配，hello OR world 或匹配）
// platform: 平台过滤（空字符串表示不过滤）
// groupID: 群组过滤（空字符串表示不过滤）
// limit: 返回条数上限
// offset: 分页偏移
// 返回: 消息列表、总匹配数、错误
func SearchMessages(platform, groupID, query string, limit, offset int) ([]MessageRecord, int, error) {
	if db == nil {
		return nil, 0, fmt.Errorf("数据库未初始化")
	}

	if query == "" {
		return nil, 0, fmt.Errorf("搜索关键词不能为空")
	}
	if limit <= 0 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}

	// FTS5 不可用时降级为 LIKE 模糊搜索
	if !migrate.FTS5Available {
		return searchMessagesLike(platform, groupID, query, limit, offset)
	}

	// 构建FTS5查询，转义特殊字符
	ftsQuery := buildFTSQuery(query)

	// 构建过滤条件
	var conditions []string
	var args []interface{}

	if platform != "" {
		conditions = append(conditions, "m.platform = ?")
		args = append(args, platform)
	}
	if groupID != "" {
		conditions = append(conditions, "m.group_id = ?")
		args = append(args, groupID)
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = " AND " + strings.Join(conditions, " AND ")
	}

	// 查询总数
	countSQL := fmt.Sprintf(
		`SELECT COUNT(*) FROM messages_fts f
		 JOIN messages m ON f.rowid = m.id
		 WHERE messages_fts MATCH ?%s`, whereClause)

	countArgs := append([]interface{}{ftsQuery}, args...)
	var totalCount int
	err := db.QueryRow(countSQL, countArgs...).Scan(&totalCount)
	if err != nil {
		return nil, 0, fmt.Errorf("FTS搜索计数失败: %w", err)
	}

	if totalCount == 0 {
		return nil, 0, nil
	}

	// 查询结果
	querySQL := fmt.Sprintf(
		`SELECT m.id, m.message_id, m.platform, m.sender_id, m.sender_name,
		        m.group_id, COALESCE(m.group_name,'') as group_name, m.content, m.direction, m.is_at_me, m.has_image,
		        m.reply_to_msg_id, m.timestamp,
		        snippet(messages_fts, 1, '<mark>', '</mark>', '...', 32) as snippet
		 FROM messages_fts f
		 JOIN messages m ON f.rowid = m.id
		 WHERE messages_fts MATCH ?%s
		 ORDER BY rank
		 LIMIT ? OFFSET ?`, whereClause)

	queryArgs := append([]interface{}{ftsQuery}, args...)
	queryArgs = append(queryArgs, limit, offset)

	rows, err := db.Query(querySQL, queryArgs...)
	if err != nil {
		return nil, 0, fmt.Errorf("FTS搜索失败: %w", err)
	}
	defer rows.Close()

	var records []MessageRecord
	for rows.Next() {
		var r MessageRecord
		var snippet string
		err := rows.Scan(&r.ID, &r.MessageID, &r.Platform, &r.SenderID, &r.SenderName,
			&r.GroupID, &r.GroupName, &r.Content, &r.Direction, &r.IsAtMe, &r.HasImage,
			&r.ReplyToMsgID, &r.Timestamp, &snippet)
		if err != nil {
			return nil, 0, err
		}
		// 将snippet存入Snippet字段，Content保留原始完整内容
		if snippet != "" {
			r.Snippet = snippet
		}
		records = append(records, r)
	}

	return records, totalCount, nil
}

// buildFTSQuery 构建FTS5安全的查询字符串
// 转义FTS5特殊字符，对中文关键词做合理的分词处理
func buildFTSQuery(query string) string {
	// FTS5特殊字符需要转义或用引号包裹
	// 简单处理：用双引号包裹每个词以进行精确匹配
	query = strings.TrimSpace(query)

	// 如果已经是带引号的短语，直接返回
	if strings.HasPrefix(query, "\"") && strings.HasSuffix(query, "\"") {
		return query
	}

	// 对中文不加引号，让FTS5使用内置分词器
	// 对英文/混合内容，用引号包裹整个查询
	hasCJK := false
	for _, r := range query {
		if r >= 0x4E00 && r <= 0x9FFF {
			hasCJK = true
			break
		}
	}

	if hasCJK {
		// 中文搜索：直接使用原始查询，FTS5的unicode61分词器会处理
		return query
	}

	// 纯英文/数字：用引号包裹做精确短语匹配，也支持 OR 语法
	if strings.Contains(strings.ToUpper(query), " OR ") {
		return query
	}
	return "\"" + query + "\""
}

// searchMessagesLike 在 FTS5 不可用时的 LIKE 降级搜索
func searchMessagesLike(platform, groupID, query string, limit, offset int) ([]MessageRecord, int, error) {
	// 将多个关键词用 % 连接做模糊匹配
	likePattern := "%" + strings.ReplaceAll(query, " ", "%") + "%"

	var conditions []string
	var args []interface{}

	conditions = append(conditions, "content LIKE ?")
	args = append(args, likePattern)

	if platform != "" {
		conditions = append(conditions, "platform = ?")
		args = append(args, platform)
	}
	if groupID != "" {
		conditions = append(conditions, "group_id = ?")
		args = append(args, groupID)
	}

	whereClause := strings.Join(conditions, " AND ")

	// 查询总数
	countSQL := fmt.Sprintf("SELECT COUNT(*) FROM messages WHERE %s", whereClause)
	var totalCount int
	if err := db.QueryRow(countSQL, args...).Scan(&totalCount); err != nil {
		return nil, 0, fmt.Errorf("LIKE搜索计数失败: %w", err)
	}

	if totalCount == 0 {
		return nil, 0, nil
	}

	// 查询结果
	querySQL := fmt.Sprintf(
		`SELECT id, message_id, platform, sender_id, sender_name,
		        group_id, COALESCE(group_name,'') as group_name, content, direction, is_at_me, has_image,
		        reply_to_msg_id, timestamp
		 FROM messages WHERE %s
		 ORDER BY timestamp DESC
		 LIMIT ? OFFSET ?`, whereClause)

	queryArgs := append(args, limit, offset)

	rows, err := db.Query(querySQL, queryArgs...)
	if err != nil {
		return nil, 0, fmt.Errorf("LIKE搜索失败: %w", err)
	}
	defer rows.Close()

	var records []MessageRecord
	for rows.Next() {
		var r MessageRecord
		err := rows.Scan(&r.ID, &r.MessageID, &r.Platform, &r.SenderID, &r.SenderName,
			&r.GroupID, &r.GroupName, &r.Content, &r.Direction, &r.IsAtMe, &r.HasImage,
			&r.ReplyToMsgID, &r.Timestamp)
		if err != nil {
			return nil, 0, err
		}
		records = append(records, r)
	}

	return records, totalCount, nil
}

func GetUserMessages(platform, userID string, limit int) ([]MessageRecord, error) {
	if db == nil {
		return nil, fmt.Errorf("数据库未初始化")
	}

	if limit <= 0 {
		limit = 50
	}

	rows, err := db.Query(
		`SELECT id, message_id, platform, sender_id, sender_name, group_id, COALESCE(group_name,'') as group_name, content, direction, is_at_me, has_image, reply_to_msg_id, timestamp
		 FROM messages WHERE platform = ? AND sender_id = ? ORDER BY timestamp DESC LIMIT ?`,
		platform, userID, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var records []MessageRecord
	for rows.Next() {
		var r MessageRecord
		err := rows.Scan(&r.ID, &r.MessageID, &r.Platform, &r.SenderID, &r.SenderName,
			&r.GroupID, &r.GroupName, &r.Content, &r.Direction, &r.IsAtMe, &r.HasImage, &r.ReplyToMsgID, &r.Timestamp)
		if err != nil {
			return nil, err
		}
		records = append(records, r)
	}

	return records, nil
}

// SearchMessagesByNL 用自然语言搜索消息，内部使用 LLM 将自然语言转为 FTS5 关键词
// 返回格式化后的搜索结果字符串，供工具使用
func SearchMessagesByNL(platform, groupID, nlQuery string, limit int, extractKeywords func(string) (string, error)) (string, error) {
	if extractKeywords == nil {
		// 无 LLM 时直接用原始查询
		records, total, err := SearchMessages(platform, groupID, nlQuery, limit, 0)
		if err != nil {
			return "", err
		}
		return formatSearchResults(records, total, nlQuery), nil
	}

	// 用 LLM 提取关键词
	keywords, err := extractKeywords(nlQuery)
	if err != nil {
		logger.Sugar.Warnw("[消息搜索] LLM关键词提取失败，降级为原始查询", "error", err)
		keywords = nlQuery
	}

	logger.Sugar.Infow("[消息搜索] NL查询", "nl_query", nlQuery, "fts5_keywords", keywords)

	records, total, err := SearchMessages(platform, groupID, keywords, limit, 0)
	if err != nil {
		return "", err
	}

	return formatSearchResults(records, total, nlQuery), nil
}

func formatSearchResults(records []MessageRecord, total int, query string) string {
	if len(records) == 0 {
		return fmt.Sprintf("没有找到与 \"%s\" 相关的消息。", query)
	}

	var builder strings.Builder
	builder.WriteString(fmt.Sprintf("找到 %d 条与 \"%s\" 相关的消息:\n\n", total, query))

	for i, r := range records {
		if i >= 10 {
			builder.WriteString(fmt.Sprintf("\n... 还有 %d 条结果未显示", total-10))
			break
		}
		t := time.UnixMilli(r.Timestamp)
		displayContent := r.Content
		if r.Snippet != "" {
			displayContent = r.Snippet
		}
		builder.WriteString(fmt.Sprintf("%d. [%s] %s: %s\n",
			i+1, t.Format("01-02 15:04"), r.SenderName, truncateContent(displayContent, 100)))
	}

	return builder.String()
}

func truncateContent(content string, maxLen int) string {
	runes := []rune(content)
	if len(runes) <= maxLen {
		return content
	}
	return string(runes[:maxLen]) + "..."
}
