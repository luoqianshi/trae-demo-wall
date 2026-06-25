package platform

// PlatformDriver 抽象平台驱动接口，统一不同平台（QQ、Telegram、Discord等）的消息收发
type PlatformDriver interface {
	// Name 返回平台名称标识，如 "qq"、"telegram"
	Name() string

	// Start 启动平台驱动，开始接收消息
	Start() error

	// Stop 停止平台驱动
	Stop() error

	// Events 返回事件通道，统一接收平台消息
	Events() <-chan Event

	// IsRunning 返回平台驱动是否正在运行
	IsRunning() bool

	// SendMessage 发送文本消息到平台
	SendMessage(message Message) error

	// SendImageMessage 发送图片消息（平台特定实现）
	SendImageMessage(imageData []string, groupID string, subType int) error

	// SendEmojiMessage 发送表情包消息（平台特定实现）
	SendEmojiMessage(emojiID string, groupID string) error

	// SendFileMessage 发送文件到平台（平台特定实现）
	// filePath: 文件绝对路径, fileName: 显示文件名, groupID: 目标群组ID
	SendFileMessage(filePath string, fileName string, groupID string) error

	// SendTypingStatus 发送"正在输入"状态指示（平台特定实现）
	// 让用户感知到机器人正在处理消息，模拟真人"正在打字"的体验
	SendTypingStatus(groupID string, userID string) error
}

// DefaultPlatformDriver 全局默认平台驱动实例
var DefaultPlatformDriver PlatformDriver

// SetDefaultDriver 设置全局默认平台驱动
func SetDefaultDriver(driver PlatformDriver) {
	DefaultPlatformDriver = driver
}
