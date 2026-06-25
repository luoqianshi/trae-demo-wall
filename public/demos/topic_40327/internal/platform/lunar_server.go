package platform

import (
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// Config 平台配置
type Config struct {
	BufferSize int
	BotQQ      string
	Platform   string // 平台标识，如 "qq"，默认 "qq"
}

// Logger 平台所需日志接口
type Logger interface {
	Info(args ...any)
	Infow(msg string, keysAndValues ...any)
	Warn(args ...any)
	Warnw(msg string, keysAndValues ...any)
	Errorw(msg string, keysAndValues ...any)
	Debugw(msg string, keysAndValues ...any)
}

var (
	cfg Config
	log Logger
)

// Init 初始化平台模块
func Init(c Config, l Logger) {
	cfg = c
	log = l
}

type LunarServer struct {
	wsConn     *websocket.Conn
	wsMutex    sync.Mutex
	httpServer *http.Server
	upgrader   websocket.Upgrader
	isRunning  bool
	eventChan  chan Event
	closeChan  chan struct{}
}

var DefaultLunarServer *LunarServer

func NewLunarServer() *LunarServer {
	bufSize := cfg.BufferSize
	if bufSize <= 0 {
		bufSize = 256
	}
	return &LunarServer{
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return true
			},
		},
		eventChan: make(chan Event, bufSize),
		closeChan: make(chan struct{}),
	}
}

func (s *LunarServer) Start() error {
	s.wsMutex.Lock()
	if s.isRunning {
		s.wsMutex.Unlock()
		return fmt.Errorf("Lunar server is already running")
	}
	s.isRunning = true
	s.wsMutex.Unlock()

	mux := http.NewServeMux()
	mux.HandleFunc("/write/message", s.handleWriteMessage)
	mux.HandleFunc("/ws", s.handleWebSocket)

	listener, err := net.Listen("tcp", ":36789")
	if err != nil {
		s.wsMutex.Lock()
		s.isRunning = false
		s.wsMutex.Unlock()
		return fmt.Errorf("端口 36789 已被占用，可能有另一个实例正在运行: %w", err)
	}

	s.httpServer = &http.Server{
		Handler: mux,
	}

	go func() {
		log.Info("Lunar server starting on :36789")
		if err := s.httpServer.Serve(listener); err != nil && err != http.ErrServerClosed {
			log.Errorw("HTTP server error", "error", err)
		}
	}()

	return nil
}

// Reset 重置服务器状态，用于端口冲突后重试
func (s *LunarServer) Reset() {
	s.wsMutex.Lock()
	defer s.wsMutex.Unlock()
	s.isRunning = false
	s.httpServer = nil
}

func (s *LunarServer) handleWriteMessage(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	bodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		log.Errorw("Failed to read request body", "error", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	log.Debugw("Received raw request", "body", string(bodyBytes))

	var req BatchMessageRequest
	if err := json.Unmarshal(bodyBytes, &req); err != nil {
		log.Errorw("Failed to decode request", "error", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	for _, msg := range req.Messages {
		log.Debugw("Received message from adapter", "msg", msg)

		switch v := msg.Content.(type) {
		case string:
			log.Debugw("Content type: string", "value", v)
		case []any:
			log.Debugw("Content type: []any", "length", len(v))
			for i, item := range v {
				itemJson, err := json.MarshalIndent(item, "", "  ")
				if err != nil {
					log.Debugw("Item content (marshal failed)", "index", i, "error", err, "item", fmt.Sprintf("%v", item))
				} else {
					log.Debugw("Item content", "index", i, "item", string(itemJson))
				}
			}
		default:
			log.Debugw("Content type (unknown)", "type", fmt.Sprintf("%T", v), "value", v)
		}

		segments := ExtractSegments(msg.Content)

		processedMsg, err := ProcessMessageSegments(segments)
		if err != nil {
			log.Errorw("Failed to process message segments", "error", err)
			continue
		}

		processedMsg.ID = fmt.Sprintf("%d", time.Now().UnixMilli())
		processedMsg.SenderID = fmt.Sprintf("%d", msg.SenderID)
		processedMsg.SenderName = msg.SenderName
		processedMsg.Platform = msg.Platform
		processedMsg.GroupID = msg.GroupID
		processedMsg.GroupName = msg.GroupName

		// Lunar适配器将 sender_name : 作为content前缀发送，这里需要去掉
		// 否则显示时会出现 "月白清风: 月白清风 : 你好" 这种重复名字
		senderPrefix := msg.SenderName + " : "
		processedMsg.Content, _ = strings.CutPrefix(processedMsg.Content, senderPrefix)
		// [回复: ...] 格式的改写延迟到 chat_bot.preProcessMessage 中进行
		// 因为那里有会话上下文，可以查到 ReplySenderID 对应的真实发送者名字
		if msg.Timestamp > 0 {
			processedMsg.Timestamp = msg.Timestamp
		} else {
			processedMsg.Timestamp = time.Now().UnixMilli()
		}
		processedMsg.RawContent = ExtractRawContent(msg.Content)

		log.Infow("Processed message",
			"user_id", processedMsg.SenderID,
			"content", processedMsg.Content,
			"is_at_me", processedMsg.IsAtMe,
			"has_image", processedMsg.HasImage,
			"at_users", processedMsg.AtUsers,
		)

		if processedMsg.Content == "" && !processedMsg.HasImage && !processedMsg.HasVoice {
			log.Info("Message is empty, skipping")
			continue
		}

		event := Event{
			Type:    "message.received",
			Message: *processedMsg,
			Data:    []byte(processedMsg.Content),
		}

		select {
		case s.eventChan <- event:
			log.Infow("消息已发送到事件通道", "id", processedMsg.ID)
		default:
			log.Warn("Event channel is full, message dropped")
		}
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("OK"))
}

func (s *LunarServer) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	s.wsMutex.Lock()
	if s.wsConn != nil {
		s.wsMutex.Unlock()
		log.Warn("已存在适配器连接，拒绝重复连接请求")
		http.Error(w, "adapter already connected", http.StatusConflict)
		return
	}
	s.wsMutex.Unlock()

	conn, err := s.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Errorw("WebSocket upgrade failed", "error", err)
		return
	}

	s.wsMutex.Lock()
	s.wsConn = conn
	s.wsMutex.Unlock()

	log.Info("Bridge adapter connected via WebSocket")

	go func() {
		for {
			select {
			case <-s.closeChan:
				return
			default:
				_, _, err := conn.ReadMessage()
				if err != nil {
					s.wsMutex.Lock()
					if s.wsConn == conn {
						s.wsConn = nil
					}
					s.wsMutex.Unlock()
					return
				}
			}
		}
	}()
}

func (s *LunarServer) SendMessage(msg Message) error {
	s.wsMutex.Lock()
	if s.wsConn == nil {
		s.wsMutex.Unlock()
		return fmt.Errorf("no WebSocket connection")
	}

	lunarMsg := LunarMessage{
		Type:    "response",
		GroupID: msg.GroupID,
	}

	data := LunarContextData{
		Content: msg.Content,
		GroupID: msg.GroupID,
	}

	dataBytes, err := json.Marshal(data)
	if err != nil {
		s.wsMutex.Unlock()
		return err
	}
	lunarMsg.Data = dataBytes

	msgBytes, err := json.Marshal(lunarMsg)
	if err != nil {
		s.wsMutex.Unlock()
		return err
	}

	err = s.wsConn.WriteMessage(websocket.TextMessage, msgBytes)
	s.wsMutex.Unlock()

	if err != nil {
		return err
	}

	log.Info("Message sent to adapter")
	return nil
}

func (s *LunarServer) SendImageMessage(imagesBase64 []string, groupID string, subType int) error {
	s.wsMutex.Lock()
	if s.wsConn == nil {
		s.wsMutex.Unlock()
		return fmt.Errorf("no WebSocket connection")
	}

	lunarMsg := LunarMessage{
		Type:    "image",
		GroupID: groupID,
	}

	imageData := LunarImageData{
		Type:    "image",
		Images:  imagesBase64,
		GroupID: groupID,
		SubType: subType,
	}

	dataBytes, err := json.Marshal(imageData)
	if err != nil {
		s.wsMutex.Unlock()
		return err
	}
	lunarMsg.Data = dataBytes

	msgBytes, err := json.Marshal(lunarMsg)
	if err != nil {
		s.wsMutex.Unlock()
		return err
	}

	err = s.wsConn.WriteMessage(websocket.TextMessage, msgBytes)
	s.wsMutex.Unlock()

	if err != nil {
		return err
	}

	log.Infow("Image sent to adapter", "image_count", len(imagesBase64))
	return nil
}

func (s *LunarServer) Events() <-chan Event {
	return s.eventChan
}

func (s *LunarServer) Name() string {
	if cfg.Platform != "" {
		return cfg.Platform
	}
	return "qq"
}

func (s *LunarServer) IsRunning() bool {
	s.wsMutex.Lock()
	defer s.wsMutex.Unlock()
	return s.isRunning
}

func (s *LunarServer) SendEmojiMessage(emojiID string, groupID string) error {
	return s.SendImageMessage([]string{emojiID}, groupID, 1)
}

// SendTypingStatus 发送"正在输入"状态，模拟真人打字体验
// 当前平台暂不支持该状态指示，返回 nil 不阻塞流程
func (s *LunarServer) SendTypingStatus(groupID string, userID string) error {
	// TODO: 待平台支持 typing indicator API 后实现
	return nil
}

// SendFileMessage 发送文件消息到平台（通过 WebSocket 发送给桥接适配器）
func (s *LunarServer) SendFileMessage(filePath string, fileName string, groupID string) error {
	s.wsMutex.Lock()
	defer s.wsMutex.Unlock()

	if s.wsConn == nil {
		return fmt.Errorf("WebSocket 连接不存在")
	}

	fileData := LunarFileData{
		Type:     "file",
		FilePath: filePath,
		FileName: fileName,
		GroupID:  groupID,
	}

	dataBytes, err := json.Marshal(fileData)
	if err != nil {
		return fmt.Errorf("序列化文件消息失败: %w", err)
	}

	msg := LunarMessage{
		Type:    "file",
		GroupID: groupID,
		Data:    dataBytes,
	}

	msgBytes, err := json.Marshal(msg)
	if err != nil {
		return fmt.Errorf("序列化消息失败: %w", err)
	}

	return s.wsConn.WriteMessage(websocket.TextMessage, msgBytes)
}

func (s *LunarServer) Stop() error {
	s.wsMutex.Lock()
	defer s.wsMutex.Unlock()

	close(s.closeChan)

	if s.wsConn != nil {
		s.wsConn.Close()
		s.wsConn = nil
	}

	if s.httpServer != nil {
		s.httpServer.Close()
	}

	s.isRunning = false
	close(s.eventChan)

	log.Info("Lunar server stopped")
	return nil
}

// ReformatReplyContent 将 Lunar 适配器的回复格式改写为更自然的显示格式
// targetName 来自 ReplySenderID 匹配，是真正发送被回复消息的人
// 输入: "[回复: 真的啊，我刷了半天B站全是美食视频，没看到什么新闻] 真的吗" + targetName="钛宇·星光阁"
// 输出: "[回复 钛宇·星光阁：真的啊，我刷了半天B站全是美食视频，没看到什么新闻]，说：真的吗"
func ReformatReplyContent(content string, targetName string) string {
	content = strings.TrimSpace(content)

	// 先去掉可能存在的 senderName 前缀（如 "月白清风⁧～喵⁧ : "）
	// 如果 senderPrefix 没有被 handleWriteMessage 中剥离，这里再兜底一次
	if idx := strings.Index(content, " : "); idx != -1 {
		beforeColon := content[:idx]
		if !strings.Contains(beforeColon, "[") {
			content = strings.TrimSpace(content[idx+3:])
		}
	}

	// 匹配 [回复: ...] 或 [回复：...] 格式
	if !strings.HasPrefix(content, "[回复:") && !strings.HasPrefix(content, "[回复：") {
		return content
	}

	// 去掉 "[回复:" 或 "[回复：" 前缀
	var rest string
	if after, ok := strings.CutPrefix(content, "[回复:"); ok {
		rest = after
	} else {
		rest, _ = strings.CutPrefix(content, "[回复：")
	}
	rest = strings.TrimSpace(rest)

	// 找到 ] 的位置，分割回复内容和实际消息
	replySection, afterBracketRaw, found := strings.Cut(rest, "]")
	if !found {
		return content
	}
	afterBracket := strings.TrimSpace(afterBracketRaw) // "真的吗"

	// 尝试从回复内容中提取目标名（以中文逗号" ，"分隔）
	// 优先使用传入的 targetName（来自 ReplySenderID），否则从文本中提取
	var formattedReply string
	if targetName != "" {
		// 有明确的目标名，直接使用
		formattedReply = fmt.Sprintf("[回复 %s：%s]", targetName, replySection)
	} else {
		// 没有目标名，保留原始格式 [回复: ...]
		formattedReply = fmt.Sprintf("[回复: %s]", replySection)
	}

	if afterBracket != "" {
		return fmt.Sprintf("%s，说：%s", formattedReply, afterBracket)
	}
	return formattedReply
}
