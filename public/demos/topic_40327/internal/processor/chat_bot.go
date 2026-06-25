package processor

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"os"
	"strings"
	"sync"
	"time"

	"YaraFlow/internal/bus"
	"YaraFlow/internal/chat"
	"YaraFlow/internal/config"
	"YaraFlow/internal/dedupe"
	"YaraFlow/internal/download"
	"YaraFlow/internal/emoji"
	"YaraFlow/internal/hook"
	"YaraFlow/internal/jargon"
	"YaraFlow/internal/knowledge"
	"YaraFlow/internal/llm"
	"YaraFlow/internal/logger"
	"YaraFlow/internal/memory"
	"YaraFlow/internal/metrics"
	"YaraFlow/internal/monitor"
	"YaraFlow/internal/personality"
	"YaraFlow/internal/platform"
	"YaraFlow/internal/plugin"
	"YaraFlow/internal/processor/decision"
	"YaraFlow/internal/processor/pipeline"
	"YaraFlow/internal/processor/reply"
	"YaraFlow/internal/processor/tool"
	"YaraFlow/internal/processor/types"
	"YaraFlow/internal/rule"
	"YaraFlow/internal/storage"
	"YaraFlow/internal/voice"
	"YaraFlow/internal/webui"
)

type ProcessResponse struct {
	Content      string
	DisableSplit bool
}

// gateOutput 门控阶段的输出，传递给回复阶段
// 避免使用 ChatBot 实例字段在不同群并发时互相覆盖
type gateOutput struct {
	decisionResult      *types.DecisionResult
	toolAccumulatedCtx  string
	memorySummary       string
	ruleOverrideStyle   string
	ruleOverridePersona string
	memoContext         string // 备忘录参考内容，注入到 replyContextSummary
	lightMemory         string // 轻量记忆检索结果，始终主动检索，注入到 Planner 和 Replyer 上下文
	replacedQuery       string // web_search 替换链接后的消息，用于覆盖原始消息中的 URL
	infoBlock           string // 图片+链接统一描述块，放在聊天记录上面
}

type ChatBot struct {
	config               *config.Config
	llmProvider          llm.LLMProvider
	visionProvider       llm.VisionProvider
	toolLLMProvider      llm.LLMProvider
	messageProcessor     *MessageProcessor
	triggerController    *TriggerController
	timingGate           *TimingGate
	decisionMaker        *decision.DecisionMaker
	toolExecutor         *tool.ToolExecutor
	replyGenerator       *reply.ReplyGenerator
	commandProcessor     *CommandProcessor
	memoryManager        *memory.MemoryManager
	personFactWriter     *memory.PersonFactWriter
	periodicMemoryWriter *memory.PeriodicMemoryWriter
	messageCounter       int64
	graphExtractor       *memory.GraphExtractor
	profileSyncer        *memory.PersonProfileSyncer
	profileStore         *memory.PersonProfileStore
	emotionalState       *personality.EmotionalState
	ruleEngine           *rule.RuleEngine
	knowledgeManager     *knowledge.Manager
	voiceService         *voice.Service
	deduplicator         *dedupe.Deduplicator
	jargonManager        *jargon.JargonManager
	qualityTracker       *reply.ReplyQualityTracker   // 回复质量自评跟踪器，形成闭环反馈
	pausedLoops          map[string]*types.LoopResult // 暂停的推理循环，key=sessionID
	pausedLoopsMu        sync.Mutex
}

func NewChatBot(cfg *config.Config, llmProvider llm.LLMProvider, visionProvider llm.VisionProvider) *ChatBot {
	plannerProvider := llm.NewRandomModelProvider("planner")
	toolProvider := llm.NewRandomModelProvider("tool_use")
	replyProvider := llm.NewRandomModelProvider("replyer")
	dm := decision.NewDecisionMaker(cfg, plannerProvider)
	te := tool.NewToolExecutor(cfg, visionProvider)
	te.SetToolLLMProvider(toolProvider)

	// Timing Gate LLM 可配置：关闭时使用纯规则判断，避免额外的 LLM 调用
	var gateProvider llm.LLMProvider
	if cfg.TimingGate.Enabled {
		gateProvider = llm.NewRandomModelProvider("planner")
	}

	if plugin.DefaultPluginManager != nil {
		te.SetPluginExecutor(plugin.DefaultPluginManager)
	}

	// 从文件加载用户规则，并启动热加载监听
	rulesPath := "./configs/rules.json"
	if err := rule.DefaultRuleEngine.LoadRulesFromFile(rulesPath); err != nil {
		logger.Sugar.Warnw("[规则引擎] 加载用户规则文件失败（将仅使用内置规则）", "error", err)
	} else {
		if err := rule.DefaultRuleEngine.StartWatching(rulesPath); err != nil {
			logger.Sugar.Warnw("[规则引擎] 启动规则热加载监听失败", "error", err)
		}
	}

	voice.InitService()

	// 初始化消息去重器
	dedupeWindow := 5 * time.Minute
	dedupeMaxSize := 10000
	if cfg.Dedupe.WindowMs > 0 {
		dedupeWindow = time.Duration(cfg.Dedupe.WindowMs) * time.Millisecond
	}
	if cfg.Dedupe.MaxSize > 0 {
		dedupeMaxSize = cfg.Dedupe.MaxSize
	}
	deduplicator := dedupe.New(dedupeWindow, dedupeMaxSize)
	dedupe.DefaultDeduplicator = deduplicator

	bot := &ChatBot{
		config:            cfg,
		llmProvider:       llmProvider,
		visionProvider:    visionProvider,
		toolLLMProvider:   toolProvider,
		messageProcessor:  NewMessageProcessor(cfg, visionProvider),
		triggerController: NewTriggerController(cfg),
		timingGate:        NewTimingGate(cfg, gateProvider),
		decisionMaker:     dm,
		toolExecutor:      te,
		replyGenerator:    reply.NewReplyGenerator(cfg, replyProvider),
		commandProcessor:  NewCommandProcessor(cfg),
		emotionalState:    personality.NewEmotionalState(),
		ruleEngine:        rule.DefaultRuleEngine,
		voiceService:      voice.DefaultService,
		deduplicator:      deduplicator,
		jargonManager:     jargon.NewJargonManager(llmProvider),
		qualityTracker:    reply.NewReplyQualityTracker(10, 0.6),
		pausedLoops:       make(map[string]*types.LoopResult),
	}

	// 设置备忘录命令处理
	bot.commandProcessor.SetOnBuiltinCommand(bot.executeBuiltinCommand)

	bot.startPausedLoopCleanup()

	return bot
}

func (bot *ChatBot) ProcessMessage(message platform.Message) (*ProcessResponse, error) {
	timeout := 120 * time.Second
	if bot.config.Decision.MaxRounds > 1 {
		timeout = 300 * time.Second
	}
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	pl := pipeline.NewPipeline(ctx, message.ID)
	traceID := pl.TraceID
	pl.GroupID = message.GroupID
	traceLog := logger.WithTrace(traceID)
	metrics.RecordMessageReceived()

	traceLog.Infow("========== 消息处理开始 ==========",
		"group_id", message.GroupID,
		"sender_id", message.SenderID,
		"content_len", len([]rune(message.Content)),
	)

	webui.PushMessageStatus(webui.MessageStatusEvent{
		Type:     "pipeline_start",
		TraceID:  traceID,
		MsgID:    message.ID,
		Content:  types.Truncate(message.Content, 50),
		GroupID:  message.GroupID,
		SenderID: message.SenderID,
	})

	defer func() {
		// panic 恢复：防止单条消息处理崩溃影响整个群处理流程
		if r := recover(); r != nil {
			logger.Sugar.Errorw("[PANIC] 消息处理崩溃，已恢复",
				"trace_id", traceID, "group_id", message.GroupID, "panic", r)
		}
		// 如果没有走到 Reply 阶段（gate 拦截等），pl.ShouldReply 保持 false
		pl.Done()
		pl.LogSummary()

		// 移除阶段状态
		sessID := message.GroupID
		if sessID == "" {
			sessID = message.SenderID
		}
		monitor.RemoveStage(sessID)
	}()

	// Stage 1: Dedupe — 滑动窗口去重
	skip, err := pl.RunStage(pipeline.StageDedupe, func(ctx context.Context) (bool, error) {
		if bot.deduplicator != nil && bot.config.Dedupe.Enabled {
			if bot.deduplicator.IsDuplicate(message.ID) {
				logger.WithTrace(traceID).Infow("[去重] 消息重复，跳过处理", "msg_id", message.ID)
				metrics.RecordMessageDeduped()
				return true, nil
			}
		}
		return false, nil
	})
	if skip || err != nil {
		return &ProcessResponse{}, err
	}

	bot.toolExecutor.ResetVisionCache()

	// 转发消息图片数量检查：超过阈值时跳过处理，避免大量图片消耗资源
	if message.IsForward && message.ForwardImageCount > bot.config.MessageReceive.ForwardMaxImages {
		logger.WithTrace(traceID).Infow("转发消息图片过多，跳过处理",
			"forward_image_count", message.ForwardImageCount,
			"max_allowed", bot.config.MessageReceive.ForwardMaxImages,
		)
		return &ProcessResponse{}, nil
	}

	// Stage 2: PreProcess — 消息预处理（图片下载/视觉分析/语音ASR/表情标签）
	var session *chat.ChatSession
	var processedMsg *platform.ProcessedMessage
	skip, err = pl.RunStage(pipeline.StagePreProcess, func(ctx context.Context) (bool, error) {
		var preErr error
		session, processedMsg, preErr = bot.preProcessMessage(traceID, &message)
		if preErr != nil {
			return true, preErr
		}
		if processedMsg == nil {
			return true, nil
		}
		return false, nil
	})
	if err != nil {
		return nil, err
	}
	if skip {
		return &ProcessResponse{}, nil
	}

	// Stage 3: Gate — 门控（过滤→命令→触发→TimingGate→记忆→决策）
	var gateResp *ProcessResponse
	var gateResult *gateOutput
	skip, err = pl.RunStage(pipeline.StageGate, func(ctx context.Context) (bool, error) {
		gateResp, gateResult = bot.gateMessage(traceID, processedMsg, &message, session)
		if gateResp != nil {
			return true, nil
		}
		return false, nil
	})
	if err != nil {
		return nil, err
	}
	if skip {
		return gateResp, nil
	}

	// Stage 4: Reply — 回复生成（插件动作→回复生成→记忆摄入）
	var replyResp *ProcessResponse
	_, err = pl.RunStage(pipeline.StageReply, func(ctx context.Context) (bool, error) {
		var repErr error
		replyResp, repErr = bot.replyMessage(traceID, processedMsg, &message, session, gateResult)
		if repErr == nil && replyResp != nil && replyResp.Content != "" {
			pl.ShouldReply = true
			pl.ReplyContent = types.Truncate(replyResp.Content, 50)
		}
		return false, repErr
	})
	if err != nil {
		return nil, err
	}

	return replyResp, nil
}

func (bot *ChatBot) preProcessMessage(traceID string, message *platform.Message) (*chat.ChatSession, *platform.ProcessedMessage, error) {
	sessionID := chat.CalculateSessionID(message)
	session := chat.DefaultChatManager.GetOrCreateSession(sessionID, message.SenderID, message.GroupID)
	session.SetLLMProvider(bot.toolLLMProvider)

	bus.DefaultBus.Publish("message.received", message)

	imageTags := bot.handleMessageImages(message)

	if hookResult, err := hook.DefaultHookManager.Trigger(hook.HookChatReceiveBeforeProcess, message, nil); err != nil {
		logger.WithTrace(traceID).Errorw("Hook chat.receive.before_process 触发失败", "error", err)
	} else if !hookResult.AllowContinue {
		logger.WithTrace(traceID).Infow("消息在预处理前被 Hook 中止", "msg_id", message.ID)
		return session, nil, nil
	}

	processedMsg, err := bot.messageProcessor.Process(*message)
	if err != nil {
		logger.WithTrace(traceID).Errorw("消息预处理失败", "error", err)
		return nil, nil, err
	}

	// 在有会话上下文后，处理回复格式：从会话历史中查找 ReplySenderID 对应的真实发送者名字
	// 输入: "[回复: 我现在正准备出门买蛋糕呀～] ..."
	// 输出: "[回复 语瞳（你）：我现在正准备出门买蛋糕呀～]，说：..."
	if processedMsg.ReplySenderID != "" {
		targetName := bot.lookupReplyTargetName(session, bot.config.Bot.QQ, bot.config.Bot.Nickname, processedMsg.ReplySenderID)
		if targetName != "" && bot.config.Bot.QQ != "" && processedMsg.ReplySenderID == bot.config.Bot.QQ {
			targetName = targetName + "（你）"
		}
		processedMsg.Content = platform.ReformatReplyContent(processedMsg.Content, targetName)

		// 兜底：适配器有时不发送回复原文（[回复: ] 内容为空），从会话历史中查找被回复消息的原文
		processedMsg.Content = bot.fillMissingReplyContent(traceID, processedMsg.Content, session, processedMsg.ReplySenderID, targetName)
	}

	if len(imageTags) > 0 {
		processedMsg.Content = bot.buildContentWithEmojiTags(processedMsg, imageTags)
	}

	if processedMsg.HasImage {
		visionResults, err := bot.toolExecutor.ExecuteVisionTools(processedMsg)
		if err != nil {
			logger.WithTrace(traceID).Warnw("视觉分析失败", "error", err)
		} else if len(visionResults) > 0 {
			processedMsg.Content, processedMsg.ImageDescriptions = bot.replaceImagePlaceholders(processedMsg.Content, visionResults)
		}

		// 瞳影：自画像识别
		tongShadowNote := bot.runTongShadowRecognition(visionResults)
		if tongShadowNote != "" {
			processedMsg.ImageDescriptions = append(processedMsg.ImageDescriptions, strings.TrimSpace(tongShadowNote))
		}
	}

	// 语音处理：如果启用了语音转文字，调用ASR获取文字内容
	// 语音消息是纯语音，content 为"[语音]"，直接整体替换
	if processedMsg.HasVoice && bot.config.Voice.Enabled {
		processedMsg.Content = bot.processVoiceMessage(processedMsg)
	}

	// 系统事件不持久化到数据库（如异步下载失败通知）
	if !message.IsSystemEvent {
		storage.SaveMessage(storage.MessageRecord{
			MessageID:    message.ID,
			Platform:     message.Platform,
			SenderID:     message.SenderID,
			SenderName:   message.SenderName,
			GroupID:      message.GroupID,
			GroupName:    message.GroupName,
			Content:      processedMsg.Content,
			Direction:    "in",
			IsAtMe:       message.IsAtMe,
			HasImage:     message.HasImage,
			ReplyToMsgID: message.ReplyMessageID,
			Timestamp:    message.Timestamp,
		})
	}

	session.SetContext(processedMsg)
	bot.messageCounter++

	// 智能压缩：消息过多时自动折叠旧消息或生成摘要
	// 防止上下文无限膨胀导致 Token 溢出
	session.CompactHistory(bot.config.Bot.QQ)

	logger.WithTrace(traceID).Infow("消息预处理完成",
		"content", processedMsg.Content,
		"is_at_me", processedMsg.IsAtMe,
		"has_sticker", processedMsg.HasSticker,
	)

	metrics.RecordMessageProcessed()

	bus.DefaultBus.Publish("message.processed", processedMsg)

	if hookResult, err := hook.DefaultHookManager.Trigger(hook.HookChatReceiveAfterProcess, message, nil); err != nil {
		logger.WithTrace(traceID).Errorw("Hook chat.receive.after_process 触发失败", "error", err)
	} else if !hookResult.AllowContinue {
		logger.WithTrace(traceID).Infow("消息在预处理后被 Hook 中止", "msg_id", message.ID)
		return session, nil, nil
	}

	bot.evaluateRules(message, processedMsg, session)

	return session, processedMsg, nil
}

// evaluateRules 评估规则引擎，只应用心情等即时副作用
// 规则覆盖的风格/人设在 gateMessage 中通过 gateOutput 传递给 replyMessage
func (bot *ChatBot) evaluateRules(message *platform.Message, processedMsg *platform.ProcessedMessage, _ *chat.ChatSession) {
	if bot.ruleEngine == nil {
		return
	}

	actions := bot.ruleEngine.Evaluate(message, processedMsg)
	if len(actions) == 0 {
		return
	}

	for _, action := range actions {
		if action.SetMood != "" {
			bot.emotionalState.SetMoodLabel(action.SetMood)
			logger.Sugar.Infow("[规则引擎] 设置心情", "mood", action.SetMood)
		}
		if action.SetReplyStyle != "" {
			logger.Sugar.Infow("[规则引擎] 检测到回复风格覆盖（将在回复阶段应用）", "style", action.SetReplyStyle)
		}
		if action.SetPersona != "" {
			logger.Sugar.Infow("[规则引擎] 检测到人设视角覆盖（将在回复阶段应用）", "persona", action.SetPersona)
		}
		if action.SendReply != "" {
			logger.Sugar.Infow("[规则引擎] 已触发预设回复（当前由replyMessage处理）")
		}
		if action.TriggerPlugin != "" {
			logger.Sugar.Infow("[规则引擎] 已触发插件动作", "plugin", action.TriggerPlugin)
		}
	}
}

func (bot *ChatBot) gateMessage(traceID string, processedMsg *platform.ProcessedMessage, message *platform.Message, session *chat.ChatSession) (*ProcessResponse, *gateOutput) {
	filterResult := chat.DefaultMessageFilter.Filter(processedMsg.Content)
	if !filterResult.Allowed {
		logger.WithTrace(traceID).Infow("消息被过滤", "reason", filterResult.Reason)
		return &ProcessResponse{}, nil
	}

	isCommand, cmdResult, continueProcess := bot.processCommands(processedMsg, message)
	if isCommand {
		if cmdResult != "" {
			logger.WithTrace(traceID).Infow("========== 消息处理结束 ==========")
			return &ProcessResponse{Content: cmdResult, DisableSplit: true}, nil
		}
		if !continueProcess {
			logger.WithTrace(traceID).Infow("命令处理完成，跳过后续消息处理")
			return &ProcessResponse{}, nil
		}
	}

	triggerResult := bot.triggerController.CheckTrigger(processedMsg)
	logger.WithTrace(traceID).Infow("触发检查结果",
		"should_reply", triggerResult.ShouldReply,
		"reason", triggerResult.Reason,
		"force_reply", triggerResult.ForceReply,
	)

	if !triggerResult.ShouldReply && !triggerResult.ForceReply {
		logger.WithTrace(traceID).Infow("触发检查未通过，不进行回复")
		return &ProcessResponse{}, nil
	}

	context := session.GetContextSummaryWithUnread(bot.config.Bot.QQ, bot.config.Bot.Nickname, message.UnreadCount)
	chatMessages := session.GetContextMessages(bot.config.Bot.QQ)
	contextSummary := session.ContextSummary

	timingResult, err := bot.timingGate.Evaluate(processedMsg, context)
	if err != nil {
		logger.WithTrace(traceID).Warnw("Timing Gate 评估失败", "error", err)
	}
	if timingResult == nil || !timingResult.ShouldRespond {
		logger.WithTrace(traceID).Infow("Timing Gate 决定不回复",
			"reason", func() string {
				if timingResult != nil {
					return timingResult.Reason
				}
				return "评估失败"
			}(),
		)
		return &ProcessResponse{}, nil
	}

	// 记忆不再由 TimingGate 自动查询，改为由规划器通过 query_memory 工具按需调用。
	// 工具执行结果通过 toolAccumulatedContext → DecisionResult.Thought 传递给回复模型。
	var memorySummary string

	// 按需注入备忘录（每次回复时都自动搜索，确保知识库内容被充分利用）
	var knowledgeCtx string
	if bot.knowledgeManager != nil {
		entries, searchErr := bot.knowledgeManager.SearchSemantic(processedMsg.Content, 5)
		if searchErr != nil {
			logger.WithTrace(traceID).Warnw("[备忘录] 语义检索失败，回退到关键词搜索", "error", searchErr)
			entries, searchErr = bot.knowledgeManager.SearchByKeyword(processedMsg.Content, 5)
			if searchErr != nil {
				logger.WithTrace(traceID).Warnw("[备忘录] 关键词检索也失败", "error", searchErr)
			}
		}
		if len(entries) > 0 {
			knowledgeContext := knowledge.FormatForLLM(entries)
			if knowledgeContext != "" {
				knowledgeCtx = knowledgeContext // 保存供 replyMessage 使用，不再注入规划器上下文
				logger.WithTrace(traceID).Infow("[备忘录] 检索到相关知识条目（仅回复阶段使用）", "count", len(entries))
			}
		} else {
			logger.WithTrace(traceID).Debugw("[备忘录] 未找到相关知识条目")
		}
	}

	bot.setupDecisionTools(message)

	// 统一记忆上下文：人物画像 + 轻量记忆检索
	// 在决策阶段一次构建，Planner 和 Replyer 共用，避免各自独立检索导致不一致
	memCtx := bot.buildMemoryContext(message, processedMsg)
	if memCtx.ProfileContext != "" {
		context = memCtx.ProfileContext + "\n\n" + context
		if contextSummary != "" {
			contextSummary = memCtx.ProfileContext + "\n\n" + contextSummary
		} else {
			contextSummary = memCtx.ProfileContext
		}
	}
	if memCtx.LightMemory != "" {
		context = context + "\n\n" + memCtx.LightMemory
		if contextSummary != "" {
			contextSummary = contextSummary + "\n\n" + memCtx.LightMemory
		} else {
			contextSummary = memCtx.LightMemory
		}
	}

	// 图片+链接描述注入规划器上下文（让规划器决定是否需要搜索/回复）
	mediaInfoBlock := bot.buildMediaInfoBlock(processedMsg)
	if mediaInfoBlock != "" {
		context = mediaInfoBlock + "\n\n" + context
		if contextSummary != "" {
			contextSummary = mediaInfoBlock + "\n\n" + contextSummary
		} else {
			contextSummary = mediaInfoBlock
		}
	}

	var decisionResult *types.DecisionResult
	var toolAccumulatedContext string

	// 恢复暂停的推理循环
	sessionID := chat.CalculateSessionID(message)
	bot.pausedLoopsMu.Lock()
	pausedLoop, hasPaused := bot.pausedLoops[sessionID]
	if hasPaused {
		delete(bot.pausedLoops, sessionID)
	}
	bot.pausedLoopsMu.Unlock()

	if hasPaused {
		if time.Since(pausedLoop.PausedAt) > 5*time.Minute {
			logger.WithTrace(traceID).Debugw("暂停推理循环过期，丢弃")
			hasPaused = false
		} else if pausedLoop.ToolResultsOnly != "" {
			context = context + "\n\n---\n之前推理获取的信息：\n" + pausedLoop.ToolResultsOnly
			logger.WithTrace(traceID).Infow("恢复暂停推理循环",
				"prev_rounds", len(pausedLoop.Trace))
		}
	}

	// 根据消息复杂度选择推理模式
	// 复杂度 >= 2（多问句/长文本/含图片+问句等）→ 多轮 PlanLoop，支持工具调用
	// 复杂度 < 2（简单闲聊/打招呼）→ 单轮 Plan，不显示多轮推理提示词
	complexity := bot.estimateComplexity(processedMsg)
	if complexity >= 2 {
		logger.WithTrace(traceID).Infow("使用多轮推理模式", "complexity", complexity)
		loopResult, loopErr := bot.decisionMaker.PlanLoop(processedMsg, context, chatMessages, contextSummary, bot.toolExecutor)
		if loopErr != nil {
			logger.WithTrace(traceID).Errorw("多轮推理失败，降级单轮", "error", loopErr)
			decisionResult, toolAccumulatedContext, err = bot.decisionMaker.Plan(processedMsg, context, chatMessages, contextSummary, bot.toolExecutor)
			if err != nil {
				logger.WithTrace(traceID).Errorw("降级单轮也失败，使用默认回复", "error", err)
			}
		} else {
			decisionResult = loopResult.Decision
			toolAccumulatedContext = loopResult.AccumulatedContext

			if loopResult.Signal == types.SignalWait {
				loopResult.PausedAt = time.Now()
				bot.pausedLoopsMu.Lock()
				bot.pausedLoops[sessionID] = loopResult
				bot.pausedLoopsMu.Unlock()
				logger.WithTrace(traceID).Infow("推理暂停等新消息",
					"rounds", len(loopResult.Trace))
				return &ProcessResponse{}, nil
			}
		}
	} else {
		logger.WithTrace(traceID).Infow("使用单轮推理模式", "complexity", complexity)
		decisionResult, toolAccumulatedContext, err = bot.decisionMaker.Plan(processedMsg, context, chatMessages, contextSummary, bot.toolExecutor)
		if err != nil {
			logger.WithTrace(traceID).Warnw("单轮推理调用失败，降级默认回复", "error", err)
		}
	}

	// 最终防御：如果所有决策路径都失败，使用默认回复
	if decisionResult == nil {
		decisionResult = &types.DecisionResult{
			Thought:     "（决策失败，使用默认回复）",
			Actions:     []string{"reply"},
			ThinkLevel:  0,
			ReplyNeeded: true,
			Confidence:  0.3,
		}
	}

	bot.saveDecisionContext(message, decisionResult, toolAccumulatedContext, memorySummary)

	logger.WithTrace(traceID).Infow("决策结果",
		"actions", decisionResult.Actions,
		"thought", decisionResult.Thought,
	)

	bus.DefaultBus.Publish("decision.made", decisionResult)

	// 黑话/新词学习：自动提取决策器标记的未知词汇
	if len(decisionResult.UnknownWords) > 0 && bot.jargonManager != nil {
		source := message.GroupID
		if source == "" {
			source = message.SenderID
		}
		bot.jargonManager.AddUnknownWords(decisionResult.UnknownWords, source, processedMsg.Content)
	}

	var ruleOverrideStyle, ruleOverridePersona string
	if bot.ruleEngine != nil {
		actions := bot.ruleEngine.Evaluate(message, processedMsg)
		for _, action := range actions {
			if action.SetReplyStyle != "" {
				ruleOverrideStyle = action.SetReplyStyle
			}
			if action.SetPersona != "" {
				ruleOverridePersona = action.SetPersona
			}
		}
	}

	return nil, &gateOutput{
		decisionResult:      decisionResult,
		toolAccumulatedCtx:  toolAccumulatedContext,
		memorySummary:       memorySummary,
		ruleOverrideStyle:   ruleOverrideStyle,
		ruleOverridePersona: ruleOverridePersona,
		memoContext:         knowledgeCtx,
		lightMemory:         memCtx.LightMemory,
		replacedQuery:       bot.getReplacedQuery(),
		infoBlock:           bot.getInfoBlock(processedMsg),
	}
}

// getReplacedQuery 从工具上下文获取链接替换后的消息
func (bot *ChatBot) getReplacedQuery() string {
	if bot.toolExecutor == nil {
		return ""
	}
	ctx := bot.toolExecutor.GetBuiltinToolContext()
	if ctx == nil || ctx.ReplacedQuery == "" {
		return ""
	}
	return ctx.ReplacedQuery
}

// getLinkDescriptions 从工具上下文获取链接描述列表
func (bot *ChatBot) getLinkDescriptions() []string {
	if bot.toolExecutor == nil {
		return nil
	}
	ctx := bot.toolExecutor.GetBuiltinToolContext()
	if ctx == nil {
		return nil
	}
	return ctx.LinkDescriptions
}

// getInfoBlock 构建图片+链接统一描述块，放在聊天记录上面
func (bot *ChatBot) getInfoBlock(processedMsg *platform.ProcessedMessage) string {
	imageDescs := processedMsg.ImageDescriptions
	linkDescs := bot.getLinkDescriptions()

	if len(imageDescs) == 0 && len(linkDescs) == 0 {
		return ""
	}

	var sb strings.Builder
	sb.WriteString("**聊天内容**\n")
	for _, desc := range imageDescs {
		sb.WriteString(desc)
		sb.WriteString("\n")
	}
	for _, desc := range linkDescs {
		sb.WriteString(desc)
		sb.WriteString("\n")
	}
	return strings.TrimSuffix(sb.String(), "\n")
}

// buildMediaInfoBlock 构建图片+链接统一描述块，注入到规划器上下文
// 图片描述在预处理阶段已获取，链接描述通过 fetch_url 工具执行后写入 ctx
func (bot *ChatBot) buildMediaInfoBlock(processedMsg *platform.ProcessedMessage) string {
	imageDescs := processedMsg.ImageDescriptions
	linkDescs := bot.getLinkDescriptions()

	if len(imageDescs) == 0 && len(linkDescs) == 0 {
		return ""
	}
	var sb strings.Builder
	sb.WriteString("**聊天内容**\n")
	for _, desc := range imageDescs {
		sb.WriteString(desc)
		sb.WriteString("\n")
	}
	for _, desc := range linkDescs {
		sb.WriteString(desc)
		sb.WriteString("\n")
	}
	return strings.TrimSuffix(sb.String(), "\n")
}

func (bot *ChatBot) replyMessage(traceID string, processedMsg *platform.ProcessedMessage, message *platform.Message, session *chat.ChatSession, gate *gateOutput) (*ProcessResponse, error) {
	chatHistory := session.GetContextSummary(bot.config.Bot.QQ, bot.config.Bot.Nickname)
	chatMessages := session.GetContextMessages(bot.config.Bot.QQ)

	var decisionResult *types.DecisionResult
	var toolAccumulatedContext string
	var memorySummary string
	var memoContext string
	var lightMemory string

	if gate != nil {
		decisionResult = gate.decisionResult
		toolAccumulatedContext = gate.toolAccumulatedCtx
		memorySummary = gate.memorySummary
		memoContext = gate.memoContext
		lightMemory = gate.lightMemory
	}

	// 用链接替换后的消息覆盖原始消息中的 URL（如 [url：摘要]）
	// 注意：只修改 processedMsg.Content 和 chatHistory，不修改 OriginalMessage.Content
	// 避免替换后的占位符被持久化到会话存档中
	if gate != nil && gate.replacedQuery != "" {
		originalContent := processedMsg.OriginalMessage.Content
		processedMsg.Content = gate.replacedQuery
		// 同步更新 chatHistory 和 chatMessages 中的原始消息
		chatHistory = strings.Replace(chatHistory, originalContent, gate.replacedQuery, 1)
		for i := range chatMessages {
			if chatMessages[i].Role == "user" && chatMessages[i].Content == originalContent {
				chatMessages[i].Content = gate.replacedQuery
				break
			}
		}
		logger.Sugar.Infow("已替换原始消息中的链接",
			"original", originalContent,
			"replaced", gate.replacedQuery)
	}

	// 重启后恢复上一轮工具上下文
	if decisionResult == nil {
		decisionResult, toolAccumulatedContext = bot.loadDecisionContext(message)
	}

	// 如果没有实际执行工具，清除 accumulatedContext（它包含完整聊天记录+
	// 备忘录等决策上下文，不应作为工具上下文传给回复生成器，否则会导致
	// 聊天记录在提示词中出现两次）
	if decisionResult != nil && !decisionResult.ToolCallNeeded {
		toolAccumulatedContext = ""
	}

	bot.executePluginActions(decisionResult, &chatHistory)
	bot.executeBuiltinActions(decisionResult, message)

	if !decisionResult.ReplyNeeded {
		logger.WithTrace(traceID).Infow("决策结果不需要回复")
		return &ProcessResponse{}, nil
	}

	replyContextSummary := session.ContextSummary

	// 记忆和知识库参考内容注入到 replyContextSummary（回复器的 user content），
	// 而不是系统提示词——让回复模型把它们当参考材料，而非指令。
	// 注意：不要拼入 toolAccumulatedContext，因为 reply_generator 的 extractToolResultsOnly
	// 会从 toolAccumulatedContext 中只提取工具执行结果，导致记忆/知识库内容丢失。
	if memorySummary != "" {
		replyContextSummary = memorySummary + "\n\n" + replyContextSummary
	}
	if memoContext != "" {
		replyContextSummary = memoContext + "\n\n" + replyContextSummary
	}
	if lightMemory != "" {
		replyContextSummary = lightMemory + "\n\n" + replyContextSummary
	}

	// 图片+链接统一描述块，放在聊天记录前面（不在备忘录里）
	if gate != nil && gate.infoBlock != "" {
		chatHistory = gate.infoBlock + "\n\n" + chatHistory
	}

	var ruleOverrideStyle, ruleOverridePersona string
	if gate != nil {
		ruleOverrideStyle = gate.ruleOverrideStyle
		ruleOverridePersona = gate.ruleOverridePersona
	}
	// 将规则引擎的风格覆盖传递给 decisionResult，由回复器合并到配置风格后
	if decisionResult != nil && ruleOverrideStyle != "" {
		decisionResult.RuleStyleOverride = ruleOverrideStyle
	}
	// 规则人设视角仍然作为独立块传给回复器
	if ruleOverridePersona != "" {
		overrideContext := "【规则覆盖-当前视角】\n你" + ruleOverridePersona
		if replyContextSummary != "" {
			replyContextSummary = overrideContext + "\n\n" + replyContextSummary
		} else {
			replyContextSummary = overrideContext
		}
	}

	replyContextSummary = bot.appendGlobalMemory(processedMsg, decisionResult, replyContextSummary)

	// 注入发送者的人物画像，让回复时能"了解"对方
	profileContext := bot.buildProfileContext(message)
	if profileContext != "" {
		if replyContextSummary != "" {
			replyContextSummary = profileContext + "\n\n" + replyContextSummary
		} else {
			replyContextSummary = profileContext
		}
	}

	// 注入黑话词义，让回复模型理解未知词汇
	jargonContext := bot.buildJargonContext(decisionResult)
	if jargonContext != "" {
		if replyContextSummary != "" {
			replyContextSummary = jargonContext + "\n\n" + replyContextSummary
		} else {
			replyContextSummary = jargonContext
		}
	}

	// 自评闭环：当近期回复质量持续偏低时，注入自然度提醒
	if qualityHint := bot.qualityTracker.GetHint(); qualityHint != "" {
		if replyContextSummary != "" {
			replyContextSummary = replyContextSummary + "\n\n" + qualityHint
		} else {
			replyContextSummary = qualityHint
		}
		logger.WithTrace(traceID).Infow("[质量跟踪] 注入自然度提醒", "hint", qualityHint)
	}

	// 检测是否首次聊天：
	// 1. LastReplyTime == 0：bot 还没在这个群里说过话
	// 2. 会话冷却：距离上一条消息超过 5 分钟，视为新对话开始，重新注入完整人设
	isFirstChat := session.LastReplyTime == 0 || session.IsColdChat(processedMsg.Timestamp)

	// 不想说话：情绪低落时，有一定概率直接发表情包跳过文字回复
	// 像真人一样——累的时候不想打字，发个表情包敷衍一下
	if bot.shouldSkipTextReply() {
		bot.sendSilenceEmoji(message)
		return &ProcessResponse{}, nil
	}

	replyResult := bot.replyGenerator.GenerateReply(processedMsg, chatHistory, chatMessages, decisionResult, replyContextSummary, bot.emotionalState, toolAccumulatedContext, isFirstChat)
	if !replyResult.Success {
		logger.WithTrace(traceID).Errorw("回复生成失败", "error", replyResult.Error)
		return nil, replyResult.Error
	}

	// 出站消息过滤：检查生成的回复是否包含敏感词
	if outboundFilter := chat.DefaultMessageFilter.FilterOutbound(replyResult.Content); !outboundFilter.Allowed {
		logger.WithTrace(traceID).Warnw("出站回复被过滤", "reason", outboundFilter.Reason)
		return &ProcessResponse{}, nil
	}

	replyScore := reply.EvalReplyQuality(replyResult.Content)
	bot.qualityTracker.Record(replyScore)

	sentences := platform.SplitSentences(replyResult.Content)
	splitContent := strings.Join(sentences, "\n")
	if splitContent == "" {
		splitContent = replyResult.Content
	}

	bus.DefaultBus.Publish("reply.generated", replyResult)

	replyMsgID := platform.GenerateMessageID()

	replyProcessedMsg := &platform.ProcessedMessage{
		OriginalMessage: platform.Message{
			ID:         replyMsgID,
			Platform:   message.Platform,
			SenderID:   bot.config.Bot.QQ,
			SenderName: bot.config.Bot.Nickname,
			GroupID:    message.GroupID,
			Content:    splitContent,
			Timestamp:  platform.NowMilliseconds(),
		},
		Content:   splitContent,
		Timestamp: platform.NowMilliseconds(),
	}
	// MarkReplySnapshot 在把机器人自己的回复写入上下文之前打快照
	// 使用触发消息的原始时间戳（而非服务时间），确保处理期间到达的新消息
	// 在后续 GetContextSummaryWithUnread 中被正确标记为"未读"
	session.MarkReplySnapshot(message.Timestamp)
	session.SetContext(replyProcessedMsg)

	metrics.RecordMessageReplied()

	logger.WithTrace(traceID).Infow("========== 消息处理结束 ==========",
		"reply_len", len([]rune(splitContent)),
	)

	storage.SaveMessage(storage.MessageRecord{
		MessageID:    replyMsgID,
		Platform:     message.Platform,
		SenderID:     bot.config.Bot.QQ,
		SenderName:   bot.config.Bot.Nickname,
		GroupID:      message.GroupID,
		GroupName:    message.GroupName,
		Content:      splitContent,
		Direction:    "out",
		IsAtMe:       false,
		HasImage:     false,
		ReplyToMsgID: message.ID, // 关联触发本次回复的入站消息，前端据此匹配预览详情
		Timestamp:    platform.NowMilliseconds(),
	})

	sessionID := chat.CalculateSessionID(message)
	bot.ingestMemory(sessionID, session, message, processedMsg, &reply.ReplyResult{
		Success: true,
		Content: splitContent,
	})

	return &ProcessResponse{Content: splitContent}, nil
}

func (bot *ChatBot) setupDecisionTools(message *platform.Message) {
	// 所有action统一注册：内置action + 插件action → 合并后注入决策提示词
	allActions := config.RegisterBuiltinActions()
	if plugin.DefaultPluginManager != nil {
		allActions = append(allActions, plugin.DefaultPluginManager.GetAllActionDefinitions()...)
	}
	bot.decisionMaker.SetActionDefinitions(allActions)

	var decisionTools []config.ToolDefData
	var allTools []config.ToolDefData
	if plugin.DefaultPluginManager != nil {
		allTools = plugin.DefaultPluginManager.GetAllToolDefinitions()
		bot.toolExecutor.SetToolDefinitions(allTools)
		decisionTools = plugin.DefaultPluginManager.GetVisibleToolDefinitions()
	}
	bt := bot.toolExecutor.GetBuiltinTools()
	if bt != nil {
		decisionTools = append(decisionTools, bt.GetVisibleToolDefinitions()...)
		allTools = append(allTools, bt.GetToolDefinitions()...)
		bot.decisionMaker.SetBuiltinTools(bt)
	}
	bot.decisionMaker.SetToolDefinitions(decisionTools)
	bot.decisionMaker.SetAllToolDefinitions(allTools)

	sessionID := chat.CalculateSessionID(message)
	bot.toolExecutor.SetBuiltinToolContext(&tool.BuiltinToolContext{
		SessionID:   sessionID,
		Platform:    message.Platform,
		GroupID:     message.GroupID,
		UserID:      message.SenderID,
		SenderName:  message.SenderName,
		IsGroupChat: message.GroupID != "",
	})
}

func (bot *ChatBot) GetCommandProcessor() *CommandProcessor {
	return bot.commandProcessor
}

// GetJargonManager 返回黑话管理器，供 WebUI 仪表盘查询黑话列表
func (bot *ChatBot) GetJargonManager() *jargon.JargonManager {
	return bot.jargonManager
}

func (bot *ChatBot) SetMemoryManager(mm *memory.MemoryManager) {
	bot.memoryManager = mm

	// 启动时清理被污染的 chat_summary 记忆（旧版 storeCompressedSummary 的残留）
	if bot.config.Memory.Enabled {
		logger.Info("[记忆清理] 开始扫描被污染的 chat_summary...")
		deleted, err := mm.CleanupContaminatedSummaries()
		if err != nil {
			logger.Sugar.Warnw("[记忆清理] 清理被污染摘要失败", "error", err)
		} else if deleted > 0 {
			logger.Sugar.Infow("[记忆清理] 启动时清理完成", "deleted", deleted)
		} else {
			logger.Info("[记忆清理] 扫描完成，未发现被污染的摘要")
		}
	}

	if bot.config.Memory.Enabled && bot.config.Memory.Writeback.PersonFactEnabled {
		factProvider := llm.NewRandomModelProvider("memory")
		bot.personFactWriter = memory.NewPersonFactWriter(factProvider, mm)
	}
	if bot.config.Memory.Enabled && bot.config.Memory.Writeback.Enabled {
		summaryProvider := llm.NewRandomModelProvider("memory")
		bot.periodicMemoryWriter = memory.NewPeriodicMemoryWriter(
			summaryProvider, mm,
			bot.config.Memory.Writeback.MessageThreshold,
			0,
		)
	}
	registry := tool.NewBuiltinToolRegistry(mm)
	bot.toolExecutor.SetBuiltinTools(registry)
	registry.SetSearchLLMProvider(bot.toolLLMProvider)
	registry.SetVisionProvider(bot.visionProvider)
	registry.StartDownloadCleanup(context.Background())
}

func (bot *ChatBot) SetGraphComponents(ge *memory.GraphExtractor, ps *memory.PersonProfileSyncer) {
	bot.graphExtractor = ge
	bot.profileSyncer = ps
}

func (bot *ChatBot) SetGraphStores(gs *memory.GraphStore, pps *memory.PersonProfileStore) {
	bot.profileStore = pps
	if bot.toolExecutor != nil {
		bot.toolExecutor.SetBuiltinToolStores(gs, pps)
	}
}

func (bot *ChatBot) isPluginAction(action string) bool {
	switch action {
	case "reply", "no_reply", "no_action", "send_emoji", "msg_react", "silence", "tool_use", "wait", "finish":
		return false
	}
	if bot.decisionMaker == nil {
		return false
	}
	return bot.decisionMaker.IsPluginAction(action)
}

func (bot *ChatBot) ReloadConfig() {
	bot.config = &config.AppConfig
	bot.triggerController.ReloadConfig()
}

// PreProcessOnly 对消息只做去重+预处理（写入会话历史），不触发门控和回复
// 用于 GroupProcessor 中非最后一条消息的处理
// 消息缓存机制：前面的消息只注入历史，最后一条才触发完整的规划+回复流程
func (bot *ChatBot) PreProcessOnly(message platform.Message) {
	traceID := logger.GenerateTraceID()

	if bot.deduplicator != nil && bot.config.Dedupe.Enabled {
		if bot.deduplicator.IsDuplicate(message.ID) {
			return
		}
	}

	_, processedMsg, err := bot.preProcessMessage(traceID, &message)
	if err != nil || processedMsg == nil {
		return
	}

	// 规则引擎已在 preProcessMessage 内部调用，不重复评估

	logger.Sugar.Debugw("[预处理] 消息已写入会话历史（不触发回复）",
		"group_id", message.GroupID,
		"content_len", len([]rune(processedMsg.Content)),
	)
}

// lookupReplyTargetName 在会话历史中查找 ReplySenderID 对应的发送者名字
func (bot *ChatBot) lookupReplyTargetName(session *chat.ChatSession, botQQ, botName, replySenderID string) string {
	if replySenderID == "" {
		return ""
	}

	// 如果 replySenderID 就是 bot 自己的 QQ，直接返回 bot 名字
	// 这处理了 session 为空（重启后）或 bot 消息不在 session 中的情况
	if botQQ != "" && replySenderID == botQQ {
		return botName
	}

	for _, m := range session.Context.RecentMessages {
		if m.OriginalMessage.SenderID == replySenderID {
			name := m.OriginalMessage.SenderName
			if name == "" {
				name = m.OriginalMessage.SenderID
			}
			return name
		}
	}

	return ""
}

// fillMissingReplyContent 兜底填充回复消息中被回复的原文
// 当适配器发送的 [回复: ] 内容为空时，从会话历史中查找被回复消息的原文
// 输入: "[回复 月白清风：]，说：瞳瞳，这是你吗" (空回复内容)
// 输出: "[回复 月白清风：[图片]，说：瞳瞳，这是你吗" (填充后)
func (bot *ChatBot) fillMissingReplyContent(traceID string, content string, session *chat.ChatSession, replySenderID, targetName string) string {
	// 匹配 [回复 XXXX：] 或 [回复 XXXX：] 后跟 "，说："
	// 当回复内容为空时，格式为 "[回复 月白清风：]" 或 "[回复 月白清风：]，说：..."
	emptyPattern := "[回复 " + targetName + "：]"
	if targetName == "" || !strings.Contains(content, emptyPattern) {
		return content
	}

	// 从会话历史中查找最近一条来自 replySenderID 的消息
	var originalContent string
	msgs := session.Context.RecentMessages
	for i := len(msgs) - 1; i >= 0; i-- {
		m := msgs[i]
		if m.OriginalMessage.SenderID == replySenderID {
			originalContent = m.OriginalMessage.Content
			break
		}
	}

	if originalContent == "" {
		return content
	}

	// 截断过长的原文（最多 30 个字符，避免上下文过长）
	shortContent := originalContent
	if len([]rune(shortContent)) > 30 {
		shortContent = string([]rune(shortContent)[:30]) + "..."
	}

	// 替换 "[回复 XXXX：]" 为 "[回复 XXXX：原文]"
	replacement := "[回复 " + targetName + "：" + shortContent + "]"
	result := strings.Replace(content, emptyPattern, replacement, 1)

	logger.WithTrace(traceID).Debugw("[回复] 填充被回复消息原文",
		"target", targetName,
		"original", shortContent,
	)

	return result
}

func (bot *ChatBot) SetKnowledgeManager(km *knowledge.Manager) {
	bot.knowledgeManager = km
}

// SetDownloadErrorCallback 设置异步下载失败回调，将回调传播到下载管理器
func (bot *ChatBot) SetDownloadErrorCallback(cb download.DownloadErrorCallback) {
	if bot.toolExecutor != nil && bot.toolExecutor.GetBuiltinTools() != nil {
		bot.toolExecutor.GetBuiltinTools().SetDownloadErrorCallback(cb)
	}
}

// SetDownloadSuccessCallback 设置异步下载成功回调，将回调传播到下载管理器
func (bot *ChatBot) SetDownloadSuccessCallback(cb download.DownloadSuccessCallback) {
	if bot.toolExecutor != nil && bot.toolExecutor.GetBuiltinTools() != nil {
		bot.toolExecutor.GetBuiltinTools().SetDownloadSuccessCallback(cb)
	}
}

// saveDecisionContext 持久化决策上下文，用于重启后恢复
func (bot *ChatBot) saveDecisionContext(message *platform.Message, decisionResult *types.DecisionResult, toolContext, memorySummary string) {
	if decisionResult == nil {
		return
	}

	db := storage.GetDB()
	if db == nil {
		return
	}

	sessionID := chat.CalculateSessionID(message)
	actionsJSON := ""
	if len(decisionResult.Actions) > 0 {
		data, err := json.Marshal(decisionResult.Actions)
		if err != nil {
			logger.Sugar.Warnw("[决策上下文] 序列化动作失败", "error", err)
		} else {
			actionsJSON = string(data)
		}
	}
	thinkLevel := decisionResult.ThinkLevel

	_, err := db.Exec(`
		INSERT INTO decision_context (session_id, decision_action, think_level, tool_context, memory_summary, updated_at)
		VALUES (?, ?, ?, ?, ?, ?)
		ON CONFLICT(session_id) DO UPDATE SET
			decision_action = excluded.decision_action,
			think_level = excluded.think_level,
			tool_context = excluded.tool_context,
			memory_summary = excluded.memory_summary,
			updated_at = excluded.updated_at`,
		sessionID,
		actionsJSON,
		thinkLevel,
		toolContext,
		memorySummary,
		time.Now().UTC().Format("2006-01-02 15:04:05"),
	)
	if err != nil {
		logger.Sugar.Warnw("[决策上下文] 保存失败", "error", err)
	}
}

// loadDecisionContext 从数据库恢复决策上下文
func (bot *ChatBot) loadDecisionContext(message *platform.Message) (*types.DecisionResult, string) {
	db := storage.GetDB()
	if db == nil {
		return nil, ""
	}

	sessionID := chat.CalculateSessionID(message)

	var (
		actionJSON    string
		thinkLevel    int
		toolContext   string
		memorySummary string
		updatedAt     string
	)

	err := db.QueryRow(`
		SELECT decision_action, think_level, tool_context, memory_summary, updated_at
		FROM decision_context WHERE session_id = ?`, sessionID,
	).Scan(&actionJSON, &thinkLevel, &toolContext, &memorySummary, &updatedAt)
	if err != nil {
		return nil, ""
	}

	// 只恢复 10 分钟内的上下文
	t, parseErr := time.Parse("2006-01-02 15:04:05", updatedAt)
	if parseErr != nil || time.Since(t) > 10*time.Minute {
		return nil, ""
	}

	var actions []string
	if actionJSON != "" {
		if err := json.Unmarshal([]byte(actionJSON), &actions); err != nil {
			logger.Sugar.Warnw("[决策上下文] 反序列化动作失败", "error", err, "json", actionJSON)
		}
	}

	result := &types.DecisionResult{
		Actions:    actions,
		ThinkLevel: thinkLevel,
	}
	for _, a := range actions {
		if a == "reply" {
			result.ReplyNeeded = true
			break
		}
	}
	// think_level>=1 → 需要重新触发工具调用
	if thinkLevel >= 1 {
		result.ToolCallNeeded = true
	}

	logger.Sugar.Infow("[决策上下文] 已恢复",
		"actions", actions, "think_level", thinkLevel,
		"elapsed", time.Since(t).Round(time.Second).String(),
	)

	return result, toolContext
}

// estimateComplexity 评估消息复杂度（0-3），决定使用 Plan 还是 PlanLoop。
// 0-1 → 简单，单轮 Plan；2-3 → 复杂，多轮 PlanLoop。
func (bot *ChatBot) estimateComplexity(processedMsg *platform.ProcessedMessage) int {
	content := processedMsg.Content
	contentLen := len([]rune(content))
	questionCount := strings.Count(content, "?") + strings.Count(content, "？")

	score := 0

	// 多个问句 → 复杂度+2
	if questionCount >= 2 {
		score += 2
	} else if questionCount == 1 {
		score += 1
	}

	// 长文本 → 复杂度+1
	if contentLen > 100 {
		score += 1
	}

	// 有图片且有问句 → 复杂度+1
	if processedMsg.HasImage && questionCount >= 1 {
		score += 1
	}

	// 有@且有问句 → 复杂度+1
	if processedMsg.IsAtMe && questionCount >= 1 {
		score += 1
	}

	if score > 3 {
		score = 3
	}
	return score
}

// startPausedLoopCleanup 启动后台清理协程，定期移除过期的暂停推理循环。
func (bot *ChatBot) startPausedLoopCleanup() {
	go func() {
		defer func() {
			if r := recover(); r != nil {
				logger.Sugar.Errorw("[PANIC] startPausedLoopCleanup 崩溃，已恢复", "panic", r)
			}
		}()
		ticker := time.NewTicker(1 * time.Minute)
		defer ticker.Stop()
		for range ticker.C {
			bot.pausedLoopsMu.Lock()
			for sessionID, loop := range bot.pausedLoops {
				if time.Since(loop.PausedAt) > 5*time.Minute {
					delete(bot.pausedLoops, sessionID)
					logger.Sugar.Debugw("清理过期暂停推理循环",
						"session_id", sessionID,
						"paused_at", loop.PausedAt.Format("15:04:05"),
					)
				}
			}
			bot.pausedLoopsMu.Unlock()
		}
	}()
}

// shouldSkipTextReply 判断是否应该跳过文字回复，直接发表情包。
// 触发条件：无聊/疲惫程度较高，且随机概率命中。
// 概率：boredom > 0.75 时 35%，energy < 0.2 时 40%，两者都满足时 50%。
func (bot *ChatBot) shouldSkipTextReply() bool {
	if bot.emotionalState == nil {
		return false
	}
	happiness, energy, _, _, boredom, _ := bot.emotionalState.GetDimensions()

	prob := 0.0
	if boredom > 0.75 {
		prob = 0.35
	}
	if energy < 0.2 {
		if prob < 0.4 {
			prob = 0.4
		}
	}
	if boredom > 0.75 && energy < 0.2 {
		prob = 0.5
	}
	// 难过时也增加概率
	if happiness < 0.3 {
		if prob < 0.35 {
			prob = 0.35
		}
	}

	if prob <= 0 {
		return false
	}
	return config.RngFloat() < prob
}

// sendSilenceEmoji 发送一个随机表情包，代替文字回复。
// 只在累了/无聊时调用，模拟"不想打字"的真人行为。
func (bot *ChatBot) sendSilenceEmoji(message *platform.Message) {
	if emoji.DefaultEmojiManager == nil || platform.DefaultPlatformDriver == nil {
		return
	}
	emojiInfo := emoji.DefaultEmojiManager.GetRandomEmoji()
	if emojiInfo == nil {
		return
	}
	data, err := os.ReadFile(emojiInfo.FullPath)
	if err != nil {
		logger.Sugar.Warnw("[沉默表情包] 读取失败", "error", err)
		return
	}
	base64Data := base64.StdEncoding.EncodeToString(data)
	if err := platform.DefaultPlatformDriver.SendImageMessage([]string{base64Data}, message.GroupID, 1); err != nil {
		logger.Sugar.Warnw("[沉默表情包] 发送失败", "error", err)
		return
	}
	logger.Sugar.Infow("[沉默表情包] 不想说话，发了表情包", "hash", emojiInfo.Hash[:8])
}
