package processor

import (
	"fmt"
	"math/rand"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"YaraFlow/internal/bus"
	"YaraFlow/internal/config"
	"YaraFlow/internal/hook"
	"YaraFlow/internal/logger"
	"YaraFlow/internal/platform"
)

// GroupProcessor 群级消息处理控制器
// 核心设计：每个 groupID 拥有独立的串行处理 goroutine，不同群完全并行
//   - 每个 groupID 拥有独立的串行处理 goroutine，不同群完全并行
//   - 消息先缓存，等消息安静期（1秒无新消息）后取快照批量处理
//   - 前面的消息只做预处理（写入会话历史），最后一条走完整 Pipeline
//   - 处理流程进行中不会再次触发回复，新消息等下次处理
//   - 处理完成后如果期间有新消息，自动再次触发
type GroupProcessor struct {
	mu      sync.Mutex
	groups  map[string]*groupRuntime // groupID -> 运行时
	chatBot *ChatBot
	driver  platform.PlatformDriver
}

// groupRuntime 单个群的处理运行时
// processing 使用 atomic.Bool 保护，供 runGroupLoop 写入、cleanupLoop/Stats 读取
type groupRuntime struct {
	groupID    string
	msgCh      chan platform.Message // 入站消息通道（带缓冲）
	processing atomic.Bool           // 是否正在处理回复流程（原子操作，多 goroutine 安全访问）
	pending    []platform.Message    // 待处理消息缓存
	lastActive time.Time             // 最后活跃时间（用于淘汰）
	done       chan struct{}         // 通知 goroutine 退出
}

const (
	msgChSize       = 256              // 每个群的消息通道缓冲
	maxPending      = 200              // 每个群最大待处理消息数
	cleanupInterval = 30 * time.Minute // 淘汰检查间隔
	groupTTL        = 2 * time.Hour    // 群运行时无消息超时
	quietPeriod     = 2 * time.Second  // 消息安静期，等群友说完再回复
)

// NewGroupProcessor 创建群级消息处理控制器
func NewGroupProcessor(chatBot *ChatBot, driver platform.PlatformDriver) *GroupProcessor {
	gp := &GroupProcessor{
		groups:  make(map[string]*groupRuntime),
		chatBot: chatBot,
		driver:  driver,
	}
	// 设置异步下载失败回调：下载失败时注入合成事件触发规划器
	chatBot.SetDownloadErrorCallback(func(groupID string, url string, errMsg string) {
		gp.InjectSystemEvent(groupID, fmt.Sprintf(
			"[系统] 文件下载失败\n链接：%s\n原因：%s", url, errMsg))
	})
	// 设置异步下载成功回调：下载成功时注入合成事件，确保规划器能回复用户
	chatBot.SetDownloadSuccessCallback(func(groupID string, url string, fileName string) {
		gp.InjectSystemEvent(groupID, fmt.Sprintf(
			"[系统] 文件下载完成并已发送\n文件：%s\n链接：%s", fileName, url))
	})
	go gp.cleanupLoop()
	return gp
}

// Submit 提交消息到对应群的处理队列
func (gp *GroupProcessor) Submit(msg platform.Message) {
	groupID := msg.GroupID
	if groupID == "" {
		groupID = "private_" + msg.SenderID
	}

	rt := gp.getOrCreateRuntime(groupID)

	select {
	case rt.msgCh <- msg:
	default:
		logger.Sugar.Warnw("[GroupProcessor] 群消息通道已满，丢弃消息",
			"group_id", groupID, "content_len", len(msg.Content))
	}
}

// InjectSystemEvent 注入系统内部合成事件到群消息队列
// 用于异步操作（如下载失败）的结果通知，触发规划器处理但不持久化到数据库
func (gp *GroupProcessor) InjectSystemEvent(groupID string, content string) {
	msg := platform.Message{
		ID:            fmt.Sprintf("sys_%d", time.Now().UnixNano()),
		Platform:      "system",
		GroupID:       groupID,
		Content:       content,
		Timestamp:     platform.NowMilliseconds(),
		IsSystemEvent: true,
	}
	gp.Submit(msg)
	logger.Sugar.Infow("[GroupProcessor] 注入系统事件",
		"group_id", groupID, "content", content)
}

// getOrCreateRuntime 获取或创建群运行时
func (gp *GroupProcessor) getOrCreateRuntime(groupID string) *groupRuntime {
	gp.mu.Lock()
	defer gp.mu.Unlock()

	if rt, ok := gp.groups[groupID]; ok {
		rt.lastActive = time.Now()
		return rt
	}

	rt := &groupRuntime{
		groupID:    groupID,
		msgCh:      make(chan platform.Message, msgChSize),
		pending:    make([]platform.Message, 0, 16),
		lastActive: time.Now(),
		done:       make(chan struct{}),
	}
	gp.groups[groupID] = rt

	go gp.runGroupLoop(rt)

	logger.Sugar.Debugw("[群处理] 创建群运行时", "group_id", groupID)
	return rt
}

// runGroupLoop 群级消息处理主循环
// 这是每个群唯一的处理 goroutine，所有状态访问都在这里串行进行
func (gp *GroupProcessor) runGroupLoop(rt *groupRuntime) {
	defer func() {
		if r := recover(); r != nil {
			logger.Sugar.Errorw("[PANIC] 群处理主循环崩溃，已恢复",
				"group_id", rt.groupID, "panic", r)
			// 重置处理状态，避免该群永久停摆
			rt.processing.Store(false)
		}
	}()

	for {
		select {
		case msg, ok := <-rt.msgCh:
			if !ok {
				return
			}
			// 缓存消息
			if len(rt.pending) >= maxPending {
				rt.pending = rt.pending[1:]
			}
			rt.pending = append(rt.pending, msg)

			if rt.processing.Load() {
				// 正在处理中，消息已缓存，等处理完成后统一处理
				logger.Sugar.Debugw("[群处理] 群正在处理中，消息已缓存",
					"group_id", rt.groupID, "pending_count", len(rt.pending))
				continue
			}

			// 等待消息安静期：继续读取 channel 中的消息，直到 quietPeriod 内没有新消息
			gp.waitForQuietPeriod(rt)

			// 安静期结束，取快照：截取到触发这一刻的所有消息
			messages := rt.pending
			rt.pending = make([]platform.Message, 0, 16)
			rt.processing.Store(true)

			logger.Sugar.Debugw("[群处理] 触发回复处理",
				"group_id", rt.groupID, "message_count", len(messages))

			// 串行处理快照中的所有消息（不新开 goroutine，保持串行性）
			gp.processMessages(rt, messages)

		case <-rt.done:
			return
		}
	}
}

// waitForQuietPeriod 等待消息安静期
// 持续读取 channel 中的消息，直到 quietPeriod 时间内没有新消息到达，确保攒够一批消息再处理
func (gp *GroupProcessor) waitForQuietPeriod(rt *groupRuntime) {
	timer := time.NewTimer(quietPeriod)
	defer timer.Stop()

	for {
		select {
		case msg, ok := <-rt.msgCh:
			if !ok {
				return
			}
			// 继续缓存消息
			if len(rt.pending) >= maxPending {
				rt.pending = rt.pending[1:]
			}
			rt.pending = append(rt.pending, msg)
			// 重置计时器，等待新的安静期
			timer.Reset(quietPeriod)

		case <-timer.C:
			// 安静期结束，没有新消息了
			return

		case <-rt.done:
			return
		}
	}
}

// processMessages 处理一批消息快照
// 前面的消息只做预处理（写入会话历史），最后一条走完整 Pipeline
func (gp *GroupProcessor) processMessages(rt *groupRuntime, messages []platform.Message) {
	defer func() {
		if r := recover(); r != nil {
			logger.Sugar.Errorw("[PANIC] 群消息处理崩溃",
				"group_id", rt.groupID, "panic", r)
		}
		rt.processing.Store(false)
	}()

	for i, msg := range messages {
		isLast := i == len(messages)-1

		if isLast {
			// 在处理最后一条消息前，检查整批消息是否有触发词
			// 前面的消息如果@了机器人或包含昵称/别名，触发信息需传递给最后一条
			if !msg.IsAtMe || !msg.BatchMentioned {
				hasAt, hasMention := gp.batchCheckTriggers(messages)
				if !msg.IsAtMe {
					msg.IsAtMe = hasAt
				}
				if !msg.BatchMentioned {
					msg.BatchMentioned = hasMention
				}
			}

			// 标记本批次未读消息数量，供规划器上下文添加「以下为未读消息」分隔线
			msg.UnreadCount = len(messages)

			// 最后一条消息：走完整 Pipeline（去重+预处理+门控+回复）
			resp, err := gp.chatBot.ProcessMessage(msg)
			if err != nil {
				logger.Sugar.Errorw("[GroupProcessor] 消息处理失败",
					"group_id", rt.groupID, "error", err)
				continue
			}
			if resp != nil && resp.Content != "" {
				gp.sendReply(msg, resp)
			}
		} else {
			// 前面的消息：只做预处理（去重+写入会话历史），不触发门控和回复
			gp.chatBot.PreProcessOnly(msg)
		}
	}

	// 处理完成后，如果期间有新消息缓存，循环会在下次 msgCh 收到消息时自动触发
}

// sendReply 发送回复消息（含 Hook 和事件总线通知）
func (gp *GroupProcessor) sendReply(originalMsg platform.Message, resp *ProcessResponse) {
	if gp.driver == nil {
		return
	}

	// 发送"正在输入"状态，让用户感知到机器人正在处理
	if err := gp.driver.SendTypingStatus(originalMsg.GroupID, originalMsg.SenderID); err != nil {
		logger.Sugar.Debugw("[GroupProcessor] 发送打字状态失败", "error", err)
	}

	if resp.DisableSplit {
		replyMsg := platform.Message{
			ID:        fmt.Sprintf("%d", originalMsg.Timestamp),
			SenderID:  "lunar",
			GroupID:   originalMsg.GroupID,
			Content:   resp.Content,
			Timestamp: originalMsg.Timestamp,
		}

		if hookResult, _ := hook.DefaultHookManager.Trigger(hook.HookSendServiceAfterBuildMsg, &replyMsg, nil); !hookResult.AllowContinue {
			logger.Info("回复消息在构建后被Hook拦截")
			return
		}
		if hookResult, _ := hook.DefaultHookManager.Trigger(hook.HookSendServiceBeforeSend, &replyMsg, nil); !hookResult.AllowContinue {
			logger.Info("回复消息在发送前被Hook拦截")
			return
		}

		if err := gp.driver.SendMessage(replyMsg); err != nil {
			logger.Sugar.Errorw("发送回复失败", "error", err)
		} else {
			bus.DefaultBus.Publish("reply.sent", &replyMsg)
			hook.DefaultHookManager.Trigger(hook.HookSendServiceAfterSend, &replyMsg, nil)
		}
	} else {
		sentences := platform.SplitSentences(resp.Content)
		if len(sentences) == 0 {
			sentences = []string{resp.Content}
		}

		for i, sentence := range sentences {
			if sentence == "" {
				continue
			}

			replyMsg := platform.Message{
				ID:        fmt.Sprintf("%d", originalMsg.Timestamp),
				SenderID:  "lunar",
				GroupID:   originalMsg.GroupID,
				Content:   sentence,
				Timestamp: originalMsg.Timestamp,
			}

			if hookResult, _ := hook.DefaultHookManager.Trigger(hook.HookSendServiceAfterBuildMsg, &replyMsg, nil); !hookResult.AllowContinue {
				return
			}
			if hookResult, _ := hook.DefaultHookManager.Trigger(hook.HookSendServiceBeforeSend, &replyMsg, nil); !hookResult.AllowContinue {
				return
			}

			if err := gp.driver.SendMessage(replyMsg); err != nil {
				logger.Sugar.Errorw("发送回复失败", "error", err)
			} else {
				bus.DefaultBus.Publish("reply.sent", &replyMsg)
				hook.DefaultHookManager.Trigger(hook.HookSendServiceAfterSend, &replyMsg, nil)
			}

			if i < len(sentences)-1 {
				// 偶尔加入长停顿（约15%概率），模拟真人说到一半思考或被打断
				if rand.Intn(100) < 15 {
					time.Sleep(platform.SplitDelay(3000, 6000))
				} else {
					time.Sleep(platform.SplitDelay(800, 3500))
				}
			}
		}
	}
}

func (gp *GroupProcessor) cleanupLoop() {
	defer func() {
		if r := recover(); r != nil {
			logger.Sugar.Errorw("[PANIC] cleanupLoop 崩溃，已恢复", "panic", r)
		}
	}()
	ticker := time.NewTicker(cleanupInterval)
	defer ticker.Stop()

	for range ticker.C {
		gp.mu.Lock()
		now := time.Now()
		for groupID, rt := range gp.groups {
			if now.Sub(rt.lastActive) > groupTTL && !rt.processing.Load() {
				close(rt.done)
				delete(gp.groups, groupID)
				logger.Sugar.Debugw("[群处理] 淘汰不活跃群运行时", "group_id", groupID)
			}
		}
		gp.mu.Unlock()
	}
}

// Stats 返回当前活跃群数量与队列深度
func (gp *GroupProcessor) Stats() map[string]interface{} {
	gp.mu.Lock()
	defer gp.mu.Unlock()

	activeCount := 0
	processingCount := 0
	totalPending := 0
	for _, rt := range gp.groups {
		activeCount++
		if rt.processing.Load() {
			processingCount++
		}
		totalPending += len(rt.pending)
		totalPending += len(rt.msgCh) // 通道中未读取的消息
	}

	return map[string]interface{}{
		"total_groups":  len(gp.groups),
		"processing":    processingCount,
		"active_groups": activeCount,
		"queue_depth":   totalPending,
	}
}

// QueueDepth 返回所有群待处理消息总数（含通道与 pending 缓存）
func (gp *GroupProcessor) QueueDepth() int {
	gp.mu.Lock()
	defer gp.mu.Unlock()

	total := 0
	for _, rt := range gp.groups {
		total += len(rt.pending)
		total += len(rt.msgCh)
	}
	return total
}

// batchCheckTriggers 检查一批消息中是否有@机器人或包含昵称/别名
// 用于批处理场景：前面的消息可能包含触发信息，但只有最后一条走完整处理流程
// 返回 (hasAt, hasMention) 分别表示是否有@和提及
func (gp *GroupProcessor) batchCheckTriggers(messages []platform.Message) (bool, bool) {
	nickname := config.AppConfig.Bot.Nickname
	aliases := config.AppConfig.Bot.Aliases
	var hasAt, hasMention bool

	for _, msg := range messages {
		if msg.IsAtMe {
			hasAt = true
		}
		if msg.BatchMentioned {
			hasMention = true
		}
		lowerContent := strings.ToLower(msg.Content)
		if nickname != "" && strings.Contains(lowerContent, strings.ToLower(nickname)) {
			hasMention = true
		}
		for _, alias := range aliases {
			if alias != "" && strings.Contains(lowerContent, strings.ToLower(alias)) {
				hasMention = true
			}
		}
	}
	return hasAt, hasMention
}
