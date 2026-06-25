package chat

import (
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"strings"
	"time"

	"YaraFlow/internal/platform"
)

type SessionInfo struct {
	Platform  string
	UserID    string
	GroupID   string
	AccountID string
	Scope     string
}

// CalculateSessionID 基于消息计算会话ID，自动加入当前日期维度
// 同一天同一群/同一私聊会话共享一个ID，跨天后自动分片为新会话
func CalculateSessionID(message *platform.Message) string {
	return CalculateSessionIDWithInfo(&SessionInfo{
		Platform:  "lunar",
		UserID:    message.SenderID,
		GroupID:   message.GroupID,
		AccountID: "",
		Scope:     "",
	})
}

func CalculateSessionIDWithInfo(info *SessionInfo) string {
	var builder strings.Builder

	builder.WriteString(info.Platform)
	builder.WriteString("|")

	if info.GroupID != "" {
		builder.WriteString(info.GroupID)
	} else {
		builder.WriteString(info.UserID)
	}

	if info.AccountID != "" {
		builder.WriteString("|")
		builder.WriteString(info.AccountID)
	}

	if info.Scope != "" {
		builder.WriteString("|")
		builder.WriteString(info.Scope)
	}

	// 加入日期维度，使不同天的对话成为独立会话
	// 格式: YYYYMMDD，例如 20260608
	dayLabel := time.Now().Format("20060102")
	builder.WriteString("|")
	builder.WriteString(dayLabel)

	hash := md5.Sum([]byte(builder.String()))
	return hex.EncodeToString(hash[:])
}

func IsGroupChat(groupID string) bool {
	return groupID != ""
}

func GetUserIdentifier(senderID, groupID string) string {
	if groupID != "" {
		return fmt.Sprintf("%s@%s", senderID, groupID)
	}
	return senderID
}

func GenerateMessageID(timestamp int64, senderID string) string {
	hash := md5.Sum([]byte(fmt.Sprintf("%d_%s", timestamp, senderID)))
	return hex.EncodeToString(hash[:8])
}
