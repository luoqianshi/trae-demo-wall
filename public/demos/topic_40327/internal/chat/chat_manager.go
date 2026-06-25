package chat

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"slices"
	"strings"
	"sync"
	"time"

	"YaraFlow/internal/llm"
	"YaraFlow/internal/logger"
	"YaraFlow/internal/platform"
)

type SessionContext struct {
	RecentMessages []*platform.ProcessedMessage
	TemplateName   string
	CustomData     map[string]any
}

type ChatSession struct {
	SessionID         string
	UserID            string
	GroupID           string
	Context           SessionContext
	ContextSummary    string
	AcceptFormats     []string
	LastActiveTime    time.Time
	TotalMessageCount int
	LastReplyTime     int64 // 上次回复时的时间戳(毫秒)，用于标记"已读/未读"边界
	llmProvider       llm.LLMProvider
	compressing       bool
	mu                sync.Mutex
}

func NewChatSession(sessionID, userID, groupID string) *ChatSession {
	return &ChatSession{
		SessionID: sessionID,
		UserID:    userID,
		GroupID:   groupID,
		Context: SessionContext{
			RecentMessages: make([]*platform.ProcessedMessage, 0),
			CustomData:     make(map[string]any),
		},
		AcceptFormats:  []string{"text", "image"},
		LastActiveTime: time.Now(),
	}
}

func (s *ChatSession) UpdateActiveTime() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.LastActiveTime = time.Now()
}

// MarkReplySnapshot 标记回复快照，记录触发消息的时间戳作为"已读"边界
// 之后 GetContextSummaryWithUnread 中，时间戳在此之后的消息即为"未读"
// 使用触发消息的原始时间戳而非服务时间，避免处理期间到达的新消息
// 因其 QQ 时间戳早于服务时间而被误判为"已读"
func (s *ChatSession) MarkReplySnapshot(triggerMsgTimestamp int64) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.LastReplyTime = triggerMsgTimestamp
}

// coldChatThreshold 冷场阈值：当距离上一条消息超过此时间，视为"新对话开始"
// 此时会重新注入完整人设，而非简化的非首次对话提示
const coldChatThreshold = 30 * time.Minute

// IsColdChat 判断当前对话是否已冷却（长时间无人发言后重新开始）
// 检查逻辑：如果会话中只有当前这一条消息，或者当前消息与上一条消息的间隔超过阈值
// 则认为对话已冷却，应视为"首次对话"处理
func (s *ChatSession) IsColdChat(currentTimestamp int64) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	msgs := s.Context.RecentMessages
	if len(msgs) <= 1 {
		// 只有一条消息（就是当前这条），一定是冷启动
		return true
	}

	// 倒数第二条消息是"当前消息之前的上一条"
	prevMsg := msgs[len(msgs)-2]
	gap := time.Duration(currentTimestamp-prevMsg.Timestamp) * time.Millisecond
	return gap > coldChatThreshold
}

const compressThreshold = 40
const keepRecentCount = 15

func (s *ChatSession) SetContext(message *platform.ProcessedMessage) {
	s.mu.Lock()
	s.Context.RecentMessages = append(s.Context.RecentMessages, message)
	s.TotalMessageCount++
	messageCount := len(s.Context.RecentMessages)
	needCompress := messageCount > compressThreshold && s.llmProvider != nil && !s.compressing
	if needCompress {
		s.compressing = true
	}
	s.mu.Unlock()

	if needCompress {
		logger.Sugar.Infow("开始压缩聊天历史", "messageCount", messageCount, "threshold", compressThreshold, "keepRecent", keepRecentCount)
		s.compressHistory()
		s.mu.Lock()
		s.compressing = false
		s.mu.Unlock()
	}
}

func (s *ChatSession) SetLLMProvider(p llm.LLMProvider) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.llmProvider = p
}

func (s *ChatSession) CompressHistory() {
	s.mu.Lock()
	if s.llmProvider == nil || len(s.Context.RecentMessages) <= compressThreshold || s.compressing {
		s.mu.Unlock()
		return
	}
	s.compressing = true
	s.mu.Unlock()

	s.compressHistory()
	s.mu.Lock()
	s.compressing = false
	s.mu.Unlock()
}

func (s *ChatSession) compressHistory() {
	s.mu.Lock()
	if s.llmProvider == nil || len(s.Context.RecentMessages) <= compressThreshold {
		s.mu.Unlock()
		return
	}

	compressCount := len(s.Context.RecentMessages) - keepRecentCount
	messagesToSummarize := make([]*platform.ProcessedMessage, compressCount)
	copy(messagesToSummarize, s.Context.RecentMessages[:compressCount])
	existingSummary := s.ContextSummary
	s.mu.Unlock()

	logger.Sugar.Infow("正在生成聊天摘要", "compressCount", compressCount)
	summary, err := s.llmProvider.Chat([]llm.ChatMessage{
		{Role: "system", Content: "你是一个对话摘要助手。请将群聊历史压缩为结构化摘要，包含时间范围、参与人物、关键话题和重要事件。"},
		{Role: "user", Content: buildCompressionPrompt(messagesToSummarize, existingSummary)},
	})

	s.mu.Lock()
	defer s.mu.Unlock()

	if err != nil {
		logger.Sugar.Warnw("聊天摘要生成失败", "error", err)
	} else if summary != "" {
		logger.Sugar.Infow("聊天摘要生成成功", "length", len(summary))
		s.ContextSummary = summary
	}
	s.Context.RecentMessages = s.Context.RecentMessages[compressCount:]
	logger.Sugar.Infow("聊天历史压缩完成", "remaining", len(s.Context.RecentMessages))
}

func buildCompressionPrompt(messages []*platform.ProcessedMessage, existingSummary string) string {
	var parts []string

	timeStart := time.UnixMilli(messages[0].OriginalMessage.Timestamp).Format("15:04")
	timeEnd := time.UnixMilli(messages[len(messages)-1].OriginalMessage.Timestamp).Format("15:04")

	participantSet := make(map[string]bool)
	for _, msg := range messages {
		name := msg.OriginalMessage.SenderName
		if name == "" {
			name = msg.OriginalMessage.SenderID
		}
		if name != "" {
			participantSet[name] = true
		}
	}
	participants := make([]string, 0, len(participantSet))
	for p := range participantSet {
		participants = append(participants, p)
	}

	if existingSummary != "" {
		parts = append(parts, "已有的对话摘要：")
		parts = append(parts, existingSummary)
		parts = append(parts, "")
		parts = append(parts, "以下是新的对话内容，请将其与已有摘要合并，生成一个更新后的摘要：")
	} else {
		parts = append(parts, "请将以下对话历史压缩为简短摘要，保留：时间范围、参与人物、关键话题、重要决定或事件。")
	}

	parts = append(parts, fmt.Sprintf("时间范围: %s ~ %s", timeStart, timeEnd))
	parts = append(parts, fmt.Sprintf("参与人物: %s", strings.Join(participants, "、")))
	parts = append(parts, "")

	for _, msg := range messages {
		senderName := msg.OriginalMessage.SenderName
		if senderName == "" {
			senderName = msg.OriginalMessage.SenderID
		}
		t := time.UnixMilli(msg.OriginalMessage.Timestamp).Format("15:04")
		parts = append(parts, fmt.Sprintf("[%s] %s: %s", t, senderName, msg.Content))
	}

	return strings.Join(parts, "\n")
}

func (s *ChatSession) GetMessageCount() int {
	s.mu.Lock()
	defer s.mu.Unlock()
	return len(s.Context.RecentMessages)
}

func (s *ChatSession) GetTotalMessageCount() int {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.TotalMessageCount
}

// CompactHistory 智能压缩对话历史
// 策略：
//  1. 消息数 ≤ softThreshold：不做任何处理
//  2. softThreshold < 消息数 ≤ hardThreshold：不做处理（保留原对话结构）
//  3. 消息数 > hardThreshold：生成摘要 + 裁剪
func (s *ChatSession) CompactHistory(botQQ string) {
	const (
		softThreshold = 30 // 超过此值开始折叠
		hardThreshold = 50 // 超过此值生成摘要
	)

	s.mu.Lock()
	msgCount := len(s.Context.RecentMessages)
	s.mu.Unlock()

	if msgCount <= softThreshold {
		return
	}

	if msgCount <= hardThreshold {
		return
	}

	// 超过硬阈值：生成摘要
	s.CompressHistory()
}

func (s *ChatSession) GetContextSummary(botQQ string, botName string) string {
	return s.GetContextSummaryWithUnread(botQQ, botName, 0)
}

// GetContextSummaryWithUnread 获取上下文摘要，用时间戳区分已读/未读消息
// 上次回复时间戳之后的消息视为"未读"
// 对旧消息应用渐进式截断：越旧的消息保留越短，减少 token 消耗
func (s *ChatSession) GetContextSummaryWithUnread(botQQ string, botName string, _ int) string {
	s.mu.Lock()
	defer s.mu.Unlock()

	var parts []string

	if s.ContextSummary != "" {
		parts = append(parts, "[对话历史摘要]")
		parts = append(parts, s.ContextSummary)
		parts = append(parts, "")
	}

	msgs := s.Context.RecentMessages
	readMark := s.LastReplyTime
	unreadMarkAdded := false

	// 统计有效消息数（排除 system），用于百分位截断计算
	validCount := 0
	for _, msg := range msgs {
		if msg.OriginalMessage.SenderID != "system" && msg.OriginalMessage.SenderName != "系统" {
			validCount++
		}
	}
	validIdx := 0

	for _, msg := range msgs {
		// 跳过旧版本残留的 system 折叠消息
		if msg.OriginalMessage.SenderID == "system" || msg.OriginalMessage.SenderName == "系统" {
			continue
		}

		t := time.UnixMilli(msg.OriginalMessage.Timestamp)
		timeStr := t.Format("15:04:05")
		senderName := msg.OriginalMessage.SenderName
		if senderName == "" {
			senderName = msg.OriginalMessage.SenderID
		}
		if botQQ != "" && msg.OriginalMessage.SenderID == botQQ {
			senderName = senderName + "(你)"
		}

		content := msg.Content
		if msg.OriginalMessage.SenderName != "" {
			senderPrefix := msg.OriginalMessage.SenderName + " : "
			content, _ = strings.CutPrefix(content, senderPrefix)
		}

		if botName != "" {
			content = strings.ReplaceAll(content, "@"+botName, "@"+botName+"（你）")
		}

		// 渐进式截断：旧消息短，新消息长
		// bot 自己的消息不截断，保留完整上下文
		isBotMsg := botQQ != "" && msg.OriginalMessage.SenderID == botQQ
		if !isBotMsg && validCount > 0 {
			percentile := float64(validIdx) / float64(validCount)
			content = truncateByPercentile(content, percentile)
		}

		// 时间戳在 readMark 之后的是"未读"消息
		// 跳过 bot 自己的回复消息，避免 bot 回复被当作分隔线的触发点
		if readMark > 0 && !unreadMarkAdded && msg.OriginalMessage.Timestamp > readMark && !isBotMsg {
			parts = append(parts, "")
			parts = append(parts, "下面是未读消息，请重点关注")
			unreadMarkAdded = true
		}

		line := fmt.Sprintf("%s, %s: %s", timeStr, senderName, content)
		parts = append(parts, line)
		validIdx++
	}

	return strings.Join(parts, "\n")
}

// truncateByPercentile 按消息在上下文中的位置百分位做渐进式截断
// percentile 0.0 = 最早的消息，1.0 = 最新的消息
// 越旧截得越狠，模拟人类记忆的自然衰减
func truncateByPercentile(content string, percentile float64) string {
	runes := []rune(content)

	var limit int
	var suffix string
	switch {
	case percentile < 0.2:
		limit = 50
		suffix = "……（记不清了）"
	case percentile < 0.5:
		limit = 100
		suffix = "……（有点记不清了）"
	case percentile < 0.7:
		limit = 200
		suffix = "……（内容太长啦）"
	default:
		limit = 400
		suffix = "……（内容太长啦）"
	}

	if len(runes) <= limit {
		return content
	}
	return string(runes[:limit]) + suffix
}

// GetContextMessages 返回结构化的聊天消息列表，用于构建 LLM 请求的 messages 数组。
// 和 MaiBot 的做法一致：群友的消息 → role=user，bot 自己的消息 → role=assistant。
// 这样 LLM 能正确区分"谁说了什么"，而不是把所有内容当作文本块塞进 system prompt。
// [对话历史摘要] 不在此方法中返回，调用方自行从 ContextSummary 字段获取并注入 system prompt。
// 当 LastReplyTime > 0 时，在第一条未读消息前插入 system 消息分隔线。
func (s *ChatSession) GetContextMessages(botQQ string) []llm.ChatMessage {
	s.mu.Lock()
	defer s.mu.Unlock()

	var msgs []llm.ChatMessage
	readMark := s.LastReplyTime
	unreadMarkAdded := false

	for _, msg := range s.Context.RecentMessages {
		// 跳过旧版本残留的 system 折叠消息
		if msg.OriginalMessage.SenderID == "system" || msg.OriginalMessage.SenderName == "系统" {
			continue
		}

		content := msg.Content
		if content == "" {
			continue
		}

		senderName := msg.OriginalMessage.SenderName
		if senderName == "" {
			senderName = msg.OriginalMessage.SenderID
		}

		t := time.UnixMilli(msg.OriginalMessage.Timestamp)
		timeStr := t.Format("15:04:05")

		// 格式化：时间 发送者: 内容
		formatted := fmt.Sprintf("%s, %s: %s", timeStr, senderName, content)

		// 在第一条非 bot 的未读消息前插入分隔线
		// 跳过 bot 自己的消息，避免 bot 回复触发分隔线
		isBotMsg := botQQ != "" && msg.OriginalMessage.SenderID == botQQ
		if readMark > 0 && !unreadMarkAdded && msg.OriginalMessage.Timestamp > readMark && !isBotMsg {
			msgs = append(msgs, llm.ChatMessage{
				Role:    "system",
				Content: "下面是未读消息，请重点关注",
			})
			unreadMarkAdded = true
		}

		if botQQ != "" && msg.OriginalMessage.SenderID == botQQ {
			msgs = append(msgs, llm.ChatMessage{
				Role:    "assistant",
				Content: formatted,
			})
		} else {
			msgs = append(msgs, llm.ChatMessage{
				Role:    "user",
				Content: formatted,
			})
		}
	}
	return msgs
}

func (s *ChatSession) CheckTypes(types []string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	for _, t := range types {
		if slices.Contains(s.AcceptFormats, t) {
			return true
		}
	}
	return false
}

type ChatManager struct {
	sessions      map[string]*ChatSession
	lastMessages  map[string]*platform.Message
	mu            sync.RWMutex
	cleanupTicker *time.Ticker
	savePath      string
	saveTicker    *time.Ticker
	stopSave      chan struct{}
}

type sessionSnapshot struct {
	SessionID         string            `json:"session_id"`
	UserID            string            `json:"user_id"`
	GroupID           string            `json:"group_id"`
	ContextSummary    string            `json:"context_summary"`
	RecentMessages    []messageSnapshot `json:"recent_messages"`
	LastActiveTime    time.Time         `json:"last_active_time"`
	TotalMessageCount int               `json:"total_message_count"`
	LastReplyTime     int64             `json:"last_reply_time"`
}

type messageSnapshot struct {
	SenderID       string `json:"sender_id"`
	SenderName     string `json:"sender_name"`
	Content        string `json:"content"`
	Timestamp      int64  `json:"timestamp"`
	ReplySenderID  string `json:"reply_sender_id,omitempty"`
	ReplyMessageID string `json:"reply_message_id,omitempty"`
}

type sessionsFile struct {
	SavedAt  time.Time         `json:"saved_at"`
	Version  int               `json:"version"`
	Sessions []sessionSnapshot `json:"sessions"`
}

var DefaultChatManager = &ChatManager{
	sessions:     make(map[string]*ChatSession),
	lastMessages: make(map[string]*platform.Message),
}

func (cm *ChatManager) GetOrCreateSession(sessionID, userID, groupID string) *ChatSession {
	cm.mu.Lock()
	defer cm.mu.Unlock()

	if session, ok := cm.sessions[sessionID]; ok {
		session.UpdateActiveTime()
		return session
	}

	session := NewChatSession(sessionID, userID, groupID)
	cm.sessions[sessionID] = session
	return session
}

func (cm *ChatManager) GetSession(sessionID string) (*ChatSession, bool) {
	cm.mu.RLock()
	defer cm.mu.RUnlock()

	session, ok := cm.sessions[sessionID]
	if ok {
		session.UpdateActiveTime()
	}
	return session, ok
}

func (cm *ChatManager) RemoveSession(sessionID string) {
	cm.mu.Lock()
	defer cm.mu.Unlock()

	delete(cm.sessions, sessionID)
	delete(cm.lastMessages, sessionID)
}

func (cm *ChatManager) UpdateLastMessage(sessionID string, message *platform.Message) {
	cm.mu.Lock()
	defer cm.mu.Unlock()

	cm.lastMessages[sessionID] = message
}

func (cm *ChatManager) GetLastMessage(sessionID string) (*platform.Message, bool) {
	cm.mu.RLock()
	defer cm.mu.RUnlock()

	msg, ok := cm.lastMessages[sessionID]
	return msg, ok
}

func (cm *ChatManager) StartCleanupTask(timeout time.Duration) {
	cm.cleanupTicker = time.NewTicker(timeout)
	go func() {
		for range cm.cleanupTicker.C {
			cm.cleanupInactiveSessions(timeout)
		}
	}()
}

func (cm *ChatManager) cleanupInactiveSessions(timeout time.Duration) {
	cm.mu.Lock()
	defer cm.mu.Unlock()

	now := time.Now()
	for sessionID, session := range cm.sessions {
		if now.Sub(session.LastActiveTime) > timeout {
			// 清理超时会话：PeriodicMemoryWriter 已通过 LLM 压缩写回记忆，
			// 此处不再存储原始聊天记录，避免把带时间戳的原始消息当成记忆注入上下文
			delete(cm.sessions, sessionID)
			delete(cm.lastMessages, sessionID)
		}
	}
}

func (cm *ChatManager) StopCleanupTask() {
	if cm.cleanupTicker != nil {
		cm.cleanupTicker.Stop()
	}
}

func (cm *ChatManager) GetSessionCount() int {
	cm.mu.RLock()
	defer cm.mu.RUnlock()
	return len(cm.sessions)
}

func (cm *ChatManager) SetSavePath(path string) {
	cm.savePath = path
}

func (cm *ChatManager) snapshotSession(session *ChatSession) sessionSnapshot {
	session.mu.Lock()
	defer session.mu.Unlock()

	snapshot := sessionSnapshot{
		SessionID:         session.SessionID,
		UserID:            session.UserID,
		GroupID:           session.GroupID,
		ContextSummary:    session.ContextSummary,
		LastActiveTime:    session.LastActiveTime,
		TotalMessageCount: session.TotalMessageCount,
		LastReplyTime:     session.LastReplyTime,
	}

	for _, msg := range session.Context.RecentMessages {
		snapshot.RecentMessages = append(snapshot.RecentMessages, messageSnapshot{
			SenderID:       msg.OriginalMessage.SenderID,
			SenderName:     msg.OriginalMessage.SenderName,
			Content:        msg.Content,
			Timestamp:      msg.OriginalMessage.Timestamp,
			ReplySenderID:  msg.ReplySenderID,
			ReplyMessageID: msg.ReplyMessageID,
		})
	}

	return snapshot
}

func (cm *ChatManager) SaveSessions() error {
	if cm.savePath == "" {
		return nil
	}

	cm.mu.RLock()
	var snapshots []sessionSnapshot
	for _, session := range cm.sessions {
		snapshots = append(snapshots, cm.snapshotSession(session))
	}
	cm.mu.RUnlock()

	file := sessionsFile{
		SavedAt:  time.Now(),
		Version:  1,
		Sessions: snapshots,
	}

	data, err := json.MarshalIndent(file, "", "  ")
	if err != nil {
		return fmt.Errorf("序列化会话失败: %w", err)
	}

	dir := filepath.Dir(cm.savePath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("创建会话目录失败: %w", err)
	}

	tmpPath := cm.savePath + ".tmp"
	if err := os.WriteFile(tmpPath, data, 0644); err != nil {
		return fmt.Errorf("写入临时文件失败: %w", err)
	}
	if err := os.Rename(tmpPath, cm.savePath); err != nil {
		return fmt.Errorf("替换会话文件失败: %w", err)
	}

	logger.Sugar.Infow("会话已保存", "count", len(snapshots), "path", cm.savePath)
	return nil
}

func (cm *ChatManager) LoadSessions() error {
	if cm.savePath == "" {
		return nil
	}

	data, err := os.ReadFile(cm.savePath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return fmt.Errorf("读取会话文件失败: %w", err)
	}

	var file sessionsFile
	if err := json.Unmarshal(data, &file); err != nil {
		return fmt.Errorf("解析会话文件失败: %w", err)
	}

	cm.mu.Lock()
	defer cm.mu.Unlock()

	loaded := 0
	for _, snap := range file.Sessions {
		session := &ChatSession{
			SessionID:         snap.SessionID,
			UserID:            snap.UserID,
			GroupID:           snap.GroupID,
			ContextSummary:    snap.ContextSummary,
			LastActiveTime:    snap.LastActiveTime,
			TotalMessageCount: snap.TotalMessageCount,
			LastReplyTime:     snap.LastReplyTime,
			AcceptFormats:     []string{"text", "image"},
		}

		for _, msgSnap := range snap.RecentMessages {
			// 清理旧版本遗留下来的折叠/系统摘要消息
			if msgSnap.SenderID == "system" || msgSnap.SenderName == "系统" {
				continue
			}
			session.Context.RecentMessages = append(session.Context.RecentMessages, &platform.ProcessedMessage{
				OriginalMessage: platform.Message{
					SenderID:   msgSnap.SenderID,
					SenderName: msgSnap.SenderName,
					Timestamp:  msgSnap.Timestamp,
				},
				Content:        msgSnap.Content,
				ReplySenderID:  msgSnap.ReplySenderID,
				ReplyMessageID: msgSnap.ReplyMessageID,
			})
		}

		session.Context.CustomData = make(map[string]any)
		cm.sessions[snap.SessionID] = session
		loaded++
	}

	if loaded > 0 {
		logger.Sugar.Infow("从磁盘恢复会话", "count", loaded, "savedAt", file.SavedAt.Format("01-02 15:04:05"))
	}
	return nil
}

func (cm *ChatManager) StartAutoSave(interval time.Duration) {
	if cm.stopSave != nil {
		return
	}
	cm.stopSave = make(chan struct{})
	cm.saveTicker = time.NewTicker(interval)

	go func() {
		for {
			select {
			case <-cm.saveTicker.C:
				if err := cm.SaveSessions(); err != nil {
					logger.Sugar.Warnw("自动保存会话失败", "error", err)
				}
			case <-cm.stopSave:
				return
			}
		}
	}()

	logger.Sugar.Infow("会话自动保存已启动", "interval", interval)
}

func (cm *ChatManager) StopAutoSave() {
	if cm.stopSave != nil {
		close(cm.stopSave)
		cm.stopSave = nil
	}
	if cm.saveTicker != nil {
		cm.saveTicker.Stop()
		cm.saveTicker = nil
	}
}
