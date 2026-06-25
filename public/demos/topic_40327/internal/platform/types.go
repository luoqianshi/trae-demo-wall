package platform

import (
	"encoding/json"
)

type ImageType int

const (
	ImageTypeNormal ImageType = iota
	ImageTypeEmoji
	ImageTypeSticker
)

func (it ImageType) String() string {
	switch it {
	case ImageTypeNormal:
		return "normal"
	case ImageTypeEmoji:
		return "emoji"
	case ImageTypeSticker:
		return "sticker"
	default:
		return "unknown"
	}
}

type ImageInfo struct {
	URL       string    // 图片URL或base64数据
	Type      ImageType // 图片类型
	Width     int       // 宽度（可选）
	Height    int       // 高度（可选）
	Size      int       // 大小（字节，可选）
	IsSticker bool      // 是否为表情包
}

type Message struct {
	ID                string      // 消息唯一标识
	SenderID          string      // 发送者唯一标识
	SenderName        string      // 发送者的显示昵称
	Platform          string      // 平台标识，如"qq"
	GroupID           string      // 可选字段，群组唯一标识，私聊时为空
	GroupName         string      // 群组名称，由适配器提供
	Content           string      // 消息文本内容
	RawContent        string      // 未经处理的原始完整消息内容
	IsAtMe            bool        // 标识消息是否@了机器人自身
	IsAtAll           bool        // 标识消息是否@了全体成员
	IsPureEmoji       bool        // 标识消息是否为纯表情内容
	HasImage          bool        // 标识消息是否包含图片资源
	HasSticker        bool        // 标识消息是否包含表情包
	HasEmoji          bool        // 标识消息是否包含表情符号
	HasVoice          bool        // 标识消息是否包含语音资源
	VoiceURL          string      // 语音文件URL
	Images            []ImageInfo // 存储图片信息列表
	AtUsers           []string    // 存储被@用户的ID列表
	Timestamp         int64       // 消息发送时间戳，精确到毫秒
	ReplyMessageID    string      // 被回复的消息ID
	ReplySenderID     string      // 被回复消息的发送者ID
	IsForward         bool        // 标识消息是否为转发消息
	ForwardImageCount int         // 转发消息中包含的图片数量
	BatchMentioned    bool        // 批处理中前面的消息包含触发词时标记，用于触发检查
	UnreadCount       int         // 本次批处理中未读消息数量，用于规划器上下文添加分隔线
	IsSystemEvent     bool        // 系统内部合成事件（如异步下载失败通知），不持久化到数据库
}

type Event struct {
	Type    string  // 事件类型
	Message Message // 关联消息
	Data    []byte  // 原始数据
}

type OpenAIMessage struct {
	Role       string      `json:"role"`
	Content    interface{} `json:"content"`
	SenderID   int64       `json:"sender_id,omitempty"`
	SenderName string      `json:"sender_name,omitempty"`
	Platform   string      `json:"platform,omitempty"`
	GroupID    string      `json:"group_id,omitempty"`
	GroupName  string      `json:"group_name,omitempty"`
	Timestamp  int64       `json:"timestamp,omitempty"`
}

type BatchMessageRequest struct {
	Messages []OpenAIMessage `json:"messages"`
}

type LunarMessage struct {
	Type    string          `json:"type"`
	GroupID string          `json:"group_id,omitempty"`
	Data    json.RawMessage `json:"data"`
}

type LunarContextData struct {
	Type    string `json:"type,omitempty"`
	Content string `json:"content"`
	GroupID string `json:"group_id,omitempty"`
}

type LunarImageData struct {
	Type    string   `json:"type"`
	Images  []string `json:"images"`
	GroupID string   `json:"group_id"`
	SubType int      `json:"sub_type"`
}

// LunarFileData 通过 WebSocket 发送给适配器的文件消息
type LunarFileData struct {
	Type     string `json:"type"`
	FilePath string `json:"file_path"` // 文件绝对路径
	FileName string `json:"file_name"` // 文件名
	GroupID  string `json:"group_id"`
}

type ProcessedMessage struct {
	OriginalMessage Message
	Content         string
	IsAtMe          bool
	IsMentioned     bool
	HasImage        bool
	Images          []string
	HasVoice        bool
	VoiceURL        string
	IsPureEmoji     bool
	HasSticker      bool
	MentionedUsers  []string
	Timestamp       int64
	ReplyToMessage  string
	ReplyMessageID  string
	ReplySenderID   string
	// UserTone 用户消息的情绪/语气标签，用于让回复模型"察言观色"
	// 典型值: "开心" "愤怒" "伤心" "焦虑" "中性" "好奇" "冷淡"
	UserTone string
	// ImageDescriptions Vision 分析后的图片描述，格式为 "[图片N] 的内容：描述"
	ImageDescriptions []string
}
