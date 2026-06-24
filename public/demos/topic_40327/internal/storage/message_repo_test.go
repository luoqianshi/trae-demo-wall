package storage

import (
	"database/sql"
	"os"
	"testing"
	"time"

	_ "github.com/mattn/go-sqlite3"

	"YaraFlow/internal/storage/migrate"
)

// setupTestDB 创建内存数据库并运行迁移，返回清理函数
func setupTestDB(t *testing.T) (*sql.DB, func()) {
	t.Helper()

	testDB, err := sql.Open("sqlite3", ":memory:?_busy_timeout=10000")
	if err != nil {
		t.Fatalf("创建测试数据库失败: %v", err)
	}

	testDB.SetMaxOpenConns(1)

	if err := migrate.Migrate(testDB); err != nil {
		testDB.Close()
		t.Fatalf("数据库迁移失败: %v", err)
	}

	// 替换包级 db
	oldDB := db
	db = testDB

	cleanup := func() {
		db = oldDB
		testDB.Close()
	}
	return testDB, cleanup
}

func makeMsg(id string, content string) MessageRecord {
	return MessageRecord{
		MessageID:  id,
		Platform:   "qq",
		SenderID:   "12345",
		SenderName: "测试用户",
		GroupID:    "group_001",
		Content:    content,
		Direction:  "in",
		IsAtMe:     false,
		HasImage:   false,
		Timestamp:  time.Now().UnixMilli(),
	}
}

// ── SaveMessage 测试 ──

func TestSaveMessage_Success(t *testing.T) {
	_, cleanup := setupTestDB(t)
	defer cleanup()

	now := time.Now().UnixMilli()
	record := MessageRecord{
		MessageID:  "msg_001",
		Platform:   "qq",
		SenderID:   "user_001",
		SenderName: "瞳瞳",
		GroupID:    "group_001",
		Content:    "今天吃了草莓蛋糕~",
		Direction:  "in",
		IsAtMe:     true,
		HasImage:   false,
		Timestamp:  now,
	}

	err := SaveMessage(record)
	if err != nil {
		t.Fatalf("SaveMessage 失败: %v", err)
	}

	// 验证数据确实被保存
	var content string
	err = db.QueryRow("SELECT content FROM messages WHERE message_id = ?", "msg_001").Scan(&content)
	if err != nil {
		t.Fatalf("查询已保存消息失败: %v", err)
	}
	if content != "今天吃了草莓蛋糕~" {
		t.Errorf("content = %q, 期望 %q", content, "今天吃了草莓蛋糕~")
	}
}

func TestSaveMessage_DuplicateID(t *testing.T) {
	_, cleanup := setupTestDB(t)
	defer cleanup()

	record := makeMsg("msg_dup", "第一遍")
	if err := SaveMessage(record); err != nil {
		t.Fatalf("首次SaveMessage失败: %v", err)
	}

	// 相同 message_id 再存一次应该报错
	err := SaveMessage(record)
	if err == nil {
		t.Error("重复message_id应该报错，但没有")
	}
}

func TestSaveMessage_NilDB(t *testing.T) {
	oldDB := db
	db = nil
	defer func() { db = oldDB }()

	err := SaveMessage(makeMsg("msg_nodb", "无数据库"))
	if err == nil {
		t.Error("数据库未初始化时应该报错")
	}
}

func TestSaveMessage_OutDirection(t *testing.T) {
	_, cleanup := setupTestDB(t)
	defer cleanup()

	record := MessageRecord{
		MessageID:  "msg_out",
		Platform:   "qq",
		SenderID:   "bot",
		SenderName: "瞳瞳",
		GroupID:    "group_001",
		Content:    "来了来了~",
		Direction:  "out",
		Timestamp:  time.Now().UnixMilli(),
	}

	if err := SaveMessage(record); err != nil {
		t.Fatalf("SaveMessage(out) 失败: %v", err)
	}

	var direction string
	db.QueryRow("SELECT direction FROM messages WHERE message_id = ?", "msg_out").Scan(&direction)
	if direction != "out" {
		t.Errorf("direction = %q, 期望 out", direction)
	}
}

// ── GetRecentMessages 测试 ──

func TestGetRecentMessages_Success(t *testing.T) {
	_, cleanup := setupTestDB(t)
	defer cleanup()

	baseTime := time.Now().UnixMilli()
	for i := 0; i < 5; i++ {
		r := MessageRecord{
			MessageID:  "msg_recent_" + string(rune('0'+i)),
			Platform:   "qq",
			SenderID:   "user_001",
			SenderName: "测试用户",
			GroupID:    "group_recent",
			Content:    "消息 #" + string(rune('0'+i)),
			Direction:  "in",
			Timestamp:  baseTime + int64(i)*1000,
		}
		if err := SaveMessage(r); err != nil {
			t.Fatalf("SaveMessage失败: %v", err)
		}
	}

	records, err := GetRecentMessages("qq", "group_recent", 3)
	if err != nil {
		t.Fatalf("GetRecentMessages 失败: %v", err)
	}

	if len(records) != 3 {
		t.Errorf("records count = %d, 期望 3", len(records))
	}

	// 验证倒序（最新的在前）
	if records[0].Timestamp < records[1].Timestamp {
		t.Error("消息应该按timestamp倒序排列")
	}
}

func TestGetRecentMessages_EmptyResult(t *testing.T) {
	_, cleanup := setupTestDB(t)
	defer cleanup()

	records, err := GetRecentMessages("qq", "nonexistent_group", 10)
	if err != nil {
		t.Fatalf("GetRecentMessages 失败: %v", err)
	}

	if len(records) != 0 {
		t.Errorf("空结果应返回0条，实际 %d 条", len(records))
	}
}

func TestGetRecentMessages_NilDB(t *testing.T) {
	oldDB := db
	db = nil
	defer func() { db = oldDB }()

	_, err := GetRecentMessages("qq", "group", 10)
	if err == nil {
		t.Error("数据库未初始化时应该报错")
	}
}

func TestGetRecentMessages_ZeroLimit(t *testing.T) {
	_, cleanup := setupTestDB(t)
	defer cleanup()

	r := makeMsg("msg_limit", "测试limit")
	SaveMessage(r)

	// limit <= 0 应该默认为 50
	records, err := GetRecentMessages("qq", "group_001", 0)
	if err != nil {
		t.Fatalf("GetRecentMessages(limit=0) 失败: %v", err)
	}
	if len(records) < 1 {
		t.Error("limit=0时应返回结果")
	}
}

func TestGetRecentMessages_DifferentPlatform(t *testing.T) {
	_, cleanup := setupTestDB(t)
	defer cleanup()

	r := makeMsg("msg_platform", "QQ消息")
	SaveMessage(r)

	records, err := GetRecentMessages("telegram", "group_001", 10)
	if err != nil {
		t.Fatalf("GetRecentMessages 失败: %v", err)
	}
	if len(records) != 0 {
		t.Errorf("不同平台查询应返回空，实际 %d 条", len(records))
	}
}

// ── SearchMessages 测试 ──

func TestSearchMessages_Success(t *testing.T) {
	_, cleanup := setupTestDB(t)
	defer cleanup()

	msgs := []MessageRecord{
		{MessageID: "s1", Platform: "qq", SenderID: "u1", SenderName: "小明", GroupID: "g1",
			Content: "今天吃草莓蛋糕真开心", Direction: "in", Timestamp: time.Now().UnixMilli()},
		{MessageID: "s2", Platform: "qq", SenderID: "u2", SenderName: "小红", GroupID: "g1",
			Content: "我也想吃蛋糕", Direction: "in", Timestamp: time.Now().UnixMilli()},
		{MessageID: "s3", Platform: "qq", SenderID: "u1", SenderName: "小明", GroupID: "g1",
			Content: "草莓味的最好吃", Direction: "in", Timestamp: time.Now().UnixMilli()},
		{MessageID: "s4", Platform: "qq", SenderID: "u3", SenderName: "小刚", GroupID: "g1",
			Content: "今天天气不错适合出去玩", Direction: "in", Timestamp: time.Now().UnixMilli()},
	}

	for _, m := range msgs {
		if err := SaveMessage(m); err != nil {
			t.Fatalf("SaveMessage失败: %v", err)
		}
	}

	// 搜索"蛋糕"
	results, total, err := SearchMessages("qq", "g1", "蛋糕", 10, 0)
	if err != nil {
		t.Fatalf("SearchMessages 失败: %v", err)
	}

	if total < 2 {
		t.Errorf("搜索'蛋糕'应至少有2条结果，实际 total=%d", total)
	}
	if len(results) < 2 {
		t.Errorf("搜索'蛋糕'应至少有2条结果，实际 len=%d", len(results))
	}
}

func TestSearchMessages_PlatformFilter(t *testing.T) {
	_, cleanup := setupTestDB(t)
	defer cleanup()

	r := makeMsg("sf1", "草莓蛋糕")
	r.Platform = "qq"
	SaveMessage(r)

	// 用不同平台过滤
	results, _, err := SearchMessages("discord", "group_001", "草莓", 10, 0)
	if err != nil {
		t.Fatalf("SearchMessages 失败: %v", err)
	}
	if len(results) != 0 {
		t.Errorf("不同平台过滤应返回空，实际 %d 条", len(results))
	}
}

func TestSearchMessages_EmptyQuery(t *testing.T) {
	_, cleanup := setupTestDB(t)
	defer cleanup()

	_, _, err := SearchMessages("qq", "g1", "", 10, 0)
	if err == nil {
		t.Error("空搜索关键词应该报错")
	}
}

func TestSearchMessages_NilDB(t *testing.T) {
	oldDB := db
	db = nil
	defer func() { db = oldDB }()

	_, _, err := SearchMessages("qq", "g1", "测试", 10, 0)
	if err == nil {
		t.Error("数据库未初始化时应该报错")
	}
}

func TestSearchMessages_NoMatch(t *testing.T) {
	_, cleanup := setupTestDB(t)
	defer cleanup()

	r := makeMsg("sn1", "草莓蛋糕")
	SaveMessage(r)

	results, total, err := SearchMessages("qq", "group_001", "不存在的关键词", 10, 0)
	if err != nil {
		t.Fatalf("SearchMessages 失败: %v", err)
	}
	if total != 0 || len(results) != 0 {
		t.Errorf("不匹配时应返回空，total=%d, len=%d", total, len(results))
	}
}

func TestSearchMessages_LimitOffset(t *testing.T) {
	_, cleanup := setupTestDB(t)
	defer cleanup()

	for i := 0; i < 10; i++ {
		r := MessageRecord{
			MessageID:  "sl" + string(rune('0'+i)),
			Platform:   "qq",
			SenderID:   "u1",
			SenderName: "测试",
			GroupID:    "g_limit",
			Content:    "草莓蛋糕" + string(rune('0'+i)),
			Direction:  "in",
			Timestamp:  time.Now().UnixMilli(),
		}
		SaveMessage(r)
	}

	results, _, err := SearchMessages("qq", "g_limit", "草莓", 5, 0)
	if err != nil {
		t.Fatalf("SearchMessages 失败: %v", err)
	}
	if len(results) != 5 {
		t.Errorf("limit=5 应返回5条，实际 %d 条", len(results))
	}

	results2, _, err := SearchMessages("qq", "g_limit", "草莓", 5, 5)
	if err != nil {
		t.Fatalf("SearchMessages(offset=5) 失败: %v", err)
	}
	if len(results2) != 5 {
		t.Errorf("offset=5,limit=5 应返回5条，实际 %d 条", len(results2))
	}
}

func TestSearchMessages_SnippetNotOverrideContent(t *testing.T) {
	_, cleanup := setupTestDB(t)
	defer cleanup()

	r := makeMsg("ss1", "今天吃了草莓蛋糕真的超级好吃")
	SaveMessage(r)

	results, _, err := SearchMessages("qq", "group_001", "草莓蛋糕", 10, 0)
	if err != nil {
		t.Fatalf("SearchMessages 失败: %v", err)
	}
	if len(results) == 0 {
		t.Fatal("搜索无结果")
	}

	// Content 应该保持原始内容不变
	if results[0].Content != "今天吃了草莓蛋糕真的超级好吃" {
		t.Errorf("Content 被覆盖: %q", results[0].Content)
	}
}

// ── formatSearchResults 测试 ──

func TestFormatSearchResults_Empty(t *testing.T) {
	result := formatSearchResults(nil, 0, "测试")
	if result == "" {
		t.Error("空结果应有提示信息")
	}
}

func TestFormatSearchResults_WithResults(t *testing.T) {
	records := []MessageRecord{
		{Timestamp: time.Now().UnixMilli(), SenderName: "小明", Content: "草莓蛋糕好吃", Snippet: "草莓<mark>蛋糕</mark>好吃"},
		{Timestamp: time.Now().UnixMilli(), SenderName: "小红", Content: "我也爱蛋糕"},
	}
	result := formatSearchResults(records, 2, "蛋糕")
	if result == "" {
		t.Error("有结果时不应为空")
	}
}

// ── 集成测试：SaveMessage + GetRecentMessages + SearchMessages 联动 ──

func TestSaveGetSearch_Integration(t *testing.T) {
	_, cleanup := setupTestDB(t)
	defer cleanup()

	msgs := []MessageRecord{
		{MessageID: "int_1", Platform: "qq", SenderID: "u1", SenderName: "小红", GroupID: "g_int",
			Content: "今天晚饭吃什么呀", Direction: "in", Timestamp: time.Now().UnixMilli() - 3000},
		{MessageID: "int_2", Platform: "qq", SenderID: "u2", SenderName: "小蓝", GroupID: "g_int",
			Content: "我想吃火锅", Direction: "in", Timestamp: time.Now().UnixMilli() - 2000},
		{MessageID: "int_3", Platform: "qq", SenderID: "u1", SenderName: "小红", GroupID: "g_int",
			Content: "火锅太辣了，吃清淡点吧", Direction: "in", Timestamp: time.Now().UnixMilli() - 1000},
	}

	for _, m := range msgs {
		if err := SaveMessage(m); err != nil {
			t.Fatalf("SaveMessage %s 失败: %v", m.MessageID, err)
		}
	}

	// GetRecentMessages 验证全部保存
	recent, err := GetRecentMessages("qq", "g_int", 10)
	if err != nil {
		t.Fatalf("GetRecentMessages 失败: %v", err)
	}
	if len(recent) != 3 {
		t.Fatalf("应有3条消息，实际 %d 条", len(recent))
	}
	// 最新的在前
	if recent[0].MessageID != "int_3" {
		t.Errorf("最新消息应该是int_3，实际 %s", recent[0].MessageID)
	}

	// SearchMessages 验证搜索
	_, total, err := SearchMessages("qq", "g_int", "火锅", 10, 0)
	if err != nil {
		t.Fatalf("SearchMessages 失败: %v", err)
	}
	if total != 2 {
		t.Errorf("搜索'火锅'应有2条结果，实际 total=%d", total)
	}
}

// ── 使用临时文件数据库的测试 ──

func TestSaveMessage_FileDB(t *testing.T) {
	tmpDir := t.TempDir()
	dbPath := tmpDir + "/test.db"

	oldDB := db
	defer func() {
		db = oldDB
	}()

	var err error
	db, err = sql.Open("sqlite3", dbPath+"?_busy_timeout=10000")
	if err != nil {
		t.Fatalf("打开文件数据库失败: %v", err)
	}
	db.SetMaxOpenConns(1)

	if err := migrate.Migrate(db); err != nil {
		t.Fatalf("迁移失败: %v", err)
	}

	record := makeMsg("file_msg", "文件数据库测试")
	if err := SaveMessage(record); err != nil {
		t.Fatalf("SaveMessage 失败: %v", err)
	}

	// 验证文件确实存在
	if _, err := os.Stat(dbPath); os.IsNotExist(err) {
		t.Error("数据库文件未创建")
	}

	// 关闭并重新打开，验证持久化
	db.Close()
	db = nil
	db, err = sql.Open("sqlite3", dbPath+"?_busy_timeout=10000")
	if err != nil {
		t.Fatalf("重新打开数据库失败: %v", err)
	}
	db.SetMaxOpenConns(1)

	records, err := GetRecentMessages("qq", "group_001", 10)
	if err != nil {
		t.Fatalf("重新打开后查询失败: %v", err)
	}
	if len(records) != 1 {
		t.Errorf("持久化后应有1条消息，实际 %d 条", len(records))
	}
	if records[0].Content != "文件数据库测试" {
		t.Errorf("content = %q, 期望 %q", records[0].Content, "文件数据库测试")
	}

	// 确保关闭数据库，让 TempDir 能正常清理
	db.Close()
	db = nil
}
