package chat

import (
	"regexp"
	"testing"
	"time"

	"YaraFlow/internal/platform"
)

func TestNewChatSession(t *testing.T) {
	s := NewChatSession("s1", "u1", "g1")
	if s.SessionID != "s1" {
		t.Errorf("SessionID = %s, want s1", s.SessionID)
	}
	if s.UserID != "u1" {
		t.Errorf("UserID = %s, want u1", s.UserID)
	}
	if s.GroupID != "g1" {
		t.Errorf("GroupID = %s, want g1", s.GroupID)
	}
	if s.Context.RecentMessages == nil {
		t.Error("RecentMessages should not be nil")
	}
	if s.AcceptFormats == nil {
		t.Error("AcceptFormats should not be nil")
	}
	if s.LastActiveTime.IsZero() {
		t.Error("LastActiveTime should not be zero")
	}
}

func TestChatSessionUpdateActiveTime(t *testing.T) {
	s := NewChatSession("s1", "u1", "g1")
	oldTime := s.LastActiveTime
	time.Sleep(10 * time.Millisecond)
	s.UpdateActiveTime()
	if !s.LastActiveTime.After(oldTime) {
		t.Error("LastActiveTime should be updated")
	}
}

func TestChatSessionCheckTypes(t *testing.T) {
	s := NewChatSession("s1", "u1", "g1")
	if !s.CheckTypes([]string{"text"}) {
		t.Error("should accept text")
	}
	if !s.CheckTypes([]string{"image"}) {
		t.Error("should accept image")
	}
	if s.CheckTypes([]string{"voice"}) {
		t.Error("should not accept voice by default")
	}
	if !s.CheckTypes([]string{"text", "voice"}) {
		t.Error("should accept text even if voice is also present")
	}
}

func TestChatSessionSetContext(t *testing.T) {
	s := NewChatSession("s1", "u1", "g1")
	msg := &platform.ProcessedMessage{
		Content: "hello",
		OriginalMessage: platform.Message{
			SenderID:   "u1",
			SenderName: "test",
			Timestamp:  time.Now().UnixMilli(),
		},
	}
	s.SetContext(msg)
	if len(s.Context.RecentMessages) != 1 {
		t.Fatalf("expected 1 message, got %d", len(s.Context.RecentMessages))
	}
	if s.Context.RecentMessages[0].Content != "hello" {
		t.Errorf("expected 'hello', got '%s'", s.Context.RecentMessages[0].Content)
	}
}

func TestChatSessionGetContextSummary(t *testing.T) {
	s := NewChatSession("s1", "u1", "g1")
	msg := &platform.ProcessedMessage{
		Content: "hello",
		OriginalMessage: platform.Message{
			SenderID:   "u1",
			SenderName: "test",
			Timestamp:  time.Now().UnixMilli(),
		},
	}
	s.SetContext(msg)
	summary := s.GetContextSummary("", "")
	if summary == "" {
		t.Error("context summary should not be empty")
	}
}

func TestChatSessionGetContextSummaryWithBot(t *testing.T) {
	s := NewChatSession("s1", "u1", "g1")
	msg := &platform.ProcessedMessage{
		Content: "hello",
		OriginalMessage: platform.Message{
			SenderID:   "bot123",
			SenderName: "bot",
			Timestamp:  time.Now().UnixMilli(),
		},
	}
	s.SetContext(msg)
	summary := s.GetContextSummary("bot123", "bot")
	if summary == "" {
		t.Error("context summary should not be empty")
	}
}

func TestChatManagerGetOrCreateSession(t *testing.T) {
	cm := &ChatManager{
		sessions:     make(map[string]*ChatSession),
		lastMessages: make(map[string]*platform.Message),
	}
	s := cm.GetOrCreateSession("s1", "u1", "g1")
	if s == nil {
		t.Fatal("session should not be nil")
	}
	if s.SessionID != "s1" {
		t.Errorf("SessionID = %s, want s1", s.SessionID)
	}
	s2 := cm.GetOrCreateSession("s1", "u1", "g1")
	if s != s2 {
		t.Error("should return the same session")
	}
}

func TestChatManagerGetSession(t *testing.T) {
	cm := &ChatManager{
		sessions:     make(map[string]*ChatSession),
		lastMessages: make(map[string]*platform.Message),
	}
	cm.GetOrCreateSession("s1", "u1", "g1")
	s, ok := cm.GetSession("s1")
	if !ok {
		t.Fatal("session should exist")
	}
	if s.SessionID != "s1" {
		t.Errorf("SessionID = %s, want s1", s.SessionID)
	}
	_, ok = cm.GetSession("nonexistent")
	if ok {
		t.Error("nonexistent session should not be found")
	}
}

func TestChatManagerRemoveSession(t *testing.T) {
	cm := &ChatManager{
		sessions:     make(map[string]*ChatSession),
		lastMessages: make(map[string]*platform.Message),
	}
	cm.GetOrCreateSession("s1", "u1", "g1")
	cm.RemoveSession("s1")
	_, ok := cm.GetSession("s1")
	if ok {
		t.Error("session should be removed")
	}
}

func TestChatManagerGetSessionCount(t *testing.T) {
	cm := &ChatManager{
		sessions:     make(map[string]*ChatSession),
		lastMessages: make(map[string]*platform.Message),
	}
	if cm.GetSessionCount() != 0 {
		t.Errorf("expected 0, got %d", cm.GetSessionCount())
	}
	cm.GetOrCreateSession("s1", "u1", "g1")
	cm.GetOrCreateSession("s2", "u2", "g2")
	if cm.GetSessionCount() != 2 {
		t.Errorf("expected 2, got %d", cm.GetSessionCount())
	}
}

func TestChatManagerLastMessage(t *testing.T) {
	cm := &ChatManager{
		sessions:     make(map[string]*ChatSession),
		lastMessages: make(map[string]*platform.Message),
	}
	msg := &platform.Message{
		ID:       "m1",
		SenderID: "u1",
		Content:  "hello",
	}
	cm.UpdateLastMessage("s1", msg)
	got, ok := cm.GetLastMessage("s1")
	if !ok {
		t.Fatal("last message should exist")
	}
	if got.Content != "hello" {
		t.Errorf("expected 'hello', got '%s'", got.Content)
	}
	_, ok = cm.GetLastMessage("nonexistent")
	if ok {
		t.Error("nonexistent last message should not be found")
	}
}

func TestChatManagerCleanupInactiveSessions(t *testing.T) {
	cm := &ChatManager{
		sessions:     make(map[string]*ChatSession),
		lastMessages: make(map[string]*platform.Message),
	}
	s := cm.GetOrCreateSession("s1", "u1", "g1")
	s.LastActiveTime = time.Now().Add(-2 * time.Hour)
	cm.cleanupInactiveSessions(1 * time.Hour)
	_, ok := cm.GetSession("s1")
	if ok {
		t.Error("inactive session should be cleaned up")
	}
}

func TestMessageFilterCheckBanWords(t *testing.T) {
	mf := &MessageFilter{
		banWords: []string{"bad", "evil"},
		banRegex: make([]*regexp.Regexp, 0),
	}
	result := mf.CheckBanWords("hello world")
	if !result.Allowed {
		t.Error("clean content should be allowed")
	}
	result = mf.CheckBanWords("this is bad content")
	if result.Allowed {
		t.Error("content with ban word should be blocked")
	}
	if result.FilteredBy != "ban_words" {
		t.Errorf("FilteredBy = %s, want ban_words", result.FilteredBy)
	}
}

func TestMessageFilterAddRemoveBanWord(t *testing.T) {
	mf := &MessageFilter{
		banWords: make([]string, 0),
		banRegex: make([]*regexp.Regexp, 0),
	}
	mf.AddBanWord("test")
	words := mf.GetBanWords()
	if len(words) != 1 || words[0] != "test" {
		t.Errorf("expected ['test'], got %v", words)
	}
	mf.AddBanWord("test")
	if len(mf.GetBanWords()) != 1 {
		t.Error("duplicate ban word should not be added")
	}
	mf.RemoveBanWord("test")
	if len(mf.GetBanWords()) != 0 {
		t.Error("ban word should be removed")
	}
}

func TestMessageFilterAddRemoveBanRegex(t *testing.T) {
	mf := &MessageFilter{
		banWords: make([]string, 0),
		banRegex: make([]*regexp.Regexp, 0),
	}
	err := mf.AddBanRegex(`\d{3}-\d{4}`)
	if err != nil {
		t.Fatalf("adding valid regex should not error: %v", err)
	}
	patterns := mf.GetBanRegexPatterns()
	if len(patterns) != 1 {
		t.Fatalf("expected 1 pattern, got %d", len(patterns))
	}
	err = mf.AddBanRegex(`\d{3}-\d{4}`)
	if err != nil {
		t.Fatalf("adding duplicate regex should not error: %v", err)
	}
	if len(mf.GetBanRegexPatterns()) != 1 {
		t.Error("duplicate regex pattern should not be added")
	}
	mf.RemoveBanRegex(`\d{3}-\d{4}`)
	if len(mf.GetBanRegexPatterns()) != 0 {
		t.Error("regex pattern should be removed")
	}
}

func TestMessageFilterInvalidRegex(t *testing.T) {
	mf := &MessageFilter{
		banWords: make([]string, 0),
		banRegex: make([]*regexp.Regexp, 0),
	}
	err := mf.AddBanRegex(`[invalid`)
	if err == nil {
		t.Error("invalid regex should return error")
	}
}

func TestMessageFilterCheckBanRegex(t *testing.T) {
	mf := &MessageFilter{
		banWords: make([]string, 0),
		banRegex: make([]*regexp.Regexp, 0),
	}
	_ = mf.AddBanRegex(`\d{3}-\d{4}`)
	result := mf.CheckBanRegex("hello")
	if !result.Allowed {
		t.Error("clean content should be allowed")
	}
	result = mf.CheckBanRegex("call 123-4567")
	if result.Allowed {
		t.Error("matching content should be blocked")
	}
}

func TestCalculateSessionIDDeterministic(t *testing.T) {
	msg1 := &platform.Message{
		SenderID: "u1",
		GroupID:  "g1",
	}
	msg2 := &platform.Message{
		SenderID: "u1",
		GroupID:  "g1",
	}
	id1 := CalculateSessionID(msg1)
	id2 := CalculateSessionID(msg2)
	if id1 != id2 {
		t.Errorf("same input should produce same ID: %s vs %s", id1, id2)
	}
}

func TestCalculateSessionIDDifferent(t *testing.T) {
	msg1 := &platform.Message{SenderID: "u1", GroupID: "g1"}
	msg2 := &platform.Message{SenderID: "u2", GroupID: "g1"}
	if CalculateSessionID(msg1) != CalculateSessionID(msg2) {
		t.Error("same group should produce same session ID regardless of user")
	}
	msg3 := &platform.Message{SenderID: "u1", GroupID: "g2"}
	if CalculateSessionID(msg1) == CalculateSessionID(msg3) {
		t.Error("different groups should produce different IDs")
	}
}

func TestCalculateSessionIDWithInfo(t *testing.T) {
	info1 := &SessionInfo{Platform: "qq", UserID: "u1", GroupID: "g1"}
	info2 := &SessionInfo{Platform: "qq", UserID: "u1", GroupID: "g1"}
	id1 := CalculateSessionIDWithInfo(info1)
	id2 := CalculateSessionIDWithInfo(info2)
	if id1 != id2 {
		t.Errorf("same info should produce same ID: %s vs %s", id1, id2)
	}
	if id1 == "" {
		t.Error("session ID should not be empty")
	}
}

func TestIsGroupChat(t *testing.T) {
	if !IsGroupChat("g1") {
		t.Error("non-empty groupID should be group chat")
	}
	if IsGroupChat("") {
		t.Error("empty groupID should be private chat")
	}
}

func TestGetUserIdentifier(t *testing.T) {
	id := GetUserIdentifier("u1", "g1")
	if id != "u1@g1" {
		t.Errorf("expected 'u1@g1', got '%s'", id)
	}
	id = GetUserIdentifier("u1", "")
	if id != "u1" {
		t.Errorf("expected 'u1', got '%s'", id)
	}
}

func TestGenerateMessageID(t *testing.T) {
	id1 := GenerateMessageID(1000, "u1")
	id2 := GenerateMessageID(1000, "u1")
	if id1 != id2 {
		t.Errorf("same input should produce same ID: %s vs %s", id1, id2)
	}
	if len(id1) != 16 {
		t.Errorf("message ID should be 16 hex chars, got %d", len(id1))
	}
	id3 := GenerateMessageID(1001, "u1")
	if id1 == id3 {
		t.Error("different timestamps should produce different IDs")
	}
}