package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"strings"
	"sync/atomic"
	"syscall"
	"time"

	"YaraFlow/internal/browser"
	"YaraFlow/internal/bus"
	"YaraFlow/internal/chat"
	"YaraFlow/internal/config"
	"YaraFlow/internal/knowledge"
	"YaraFlow/internal/llm"
	"YaraFlow/internal/logger"
	"YaraFlow/internal/memory"
	"YaraFlow/internal/metrics"
	"YaraFlow/internal/processor"
	"YaraFlow/internal/storage"
	"YaraFlow/internal/tracing"
	"YaraFlow/internal/webui"
)

var llmProvider llm.LLMProvider
var visionProvider llm.VisionProvider
var chatBot *processor.ChatBot
var memoryManager *memory.MemoryManager

type MessageCounter struct {
	count atomic.Int64
}

func (mc *MessageCounter) HandleEvent(event bus.Event) {
	mc.count.Add(1)
}

type busEventLogger struct{}

func (l *busEventLogger) HandleEvent(event bus.Event) {
	logger.Sugar.Debugw("[事件总线] 事件到达", "topic", event.Topic)
}

type ConfigReloader struct{}

func (cr *ConfigReloader) HandleEvent(event bus.Event) {
	logger.Info("收到配置重载事件，正在重载各模块配置...")
	if chatBot != nil {
		chatBot.ReloadConfig()
	}
	if err := chat.DefaultMessageFilter.LoadConfig(&config.AppConfig); err != nil {
		logger.Sugar.Warnw("消息过滤器配置重载失败", "error", err)
	}
}

const (
	cReset   = "\033[0m"
	cBold    = "\033[1m"
	cDim     = "\033[2m"
	cItalic  = "\033[3m"
	cRed     = "\033[31m"
	cGreen   = "\033[32m"
	cYellow  = "\033[33m"
	cBlue    = "\033[34m"
	cMagenta = "\033[35m"
	cCyan    = "\033[36m"

	c256Orange = "\033[38;5;208m"
	c256Sky    = "\033[38;5;117m"
	c256Teal   = "\033[38;5;37m"
	c256Lime   = "\033[38;5;118m"
	c256Gold   = "\033[38;5;220m"
)

func padRight(s string, width int) string {
	displayLen := 0
	for _, r := range s {
		if r > 0x2E80 {
			displayLen += 2
		} else {
			displayLen++
		}
	}
	if displayLen >= width {
		return s
	}
	return s + strings.Repeat(" ", width-displayLen)
}

func printKV(key, value string, valueColor string) {
	fmt.Printf("  %s│%s  %s%s%s  %s%s%s\n", cDim, cReset, c256Teal, padRight(key, 8), cReset, valueColor, value, cReset)
}

func main() {
	fmt.Println("")
	fmt.Printf("  %s", cBold+cCyan)
	fmt.Println("  ┌─────────────────────────────────────────────┐")
	fmt.Println("  │  ╦ ╦┌─┐┬─┐┌─┐╔═╗┬  ┌─┐┬ ┬               │")
	fmt.Println("  │  ╚╦╝├─┤├┬┘├─┤╠╣ │  │ ││││               │")
	fmt.Println("  │   ╩ ┴ ┴┴└─┴ ┴╚  ┴─┘└─┘└┴┘               │")
	fmt.Println("  │  语瞳 Demo · TRAE 创造力大赛             │")
	fmt.Printf("  └─────────────────────────────────────────────┘%s\n", cReset)
	fmt.Println("")

	// ── 阶段 1: 配置与基础设施 ──
	fmt.Printf("  %s┄%s %s1/4%s %s配置与基础设施%s ", cDim, cReset, cCyan, cReset, cReset, cReset)
	if err := config.Init(""); err != nil {
		fmt.Printf("%s✗%s\n", cRed+cBold, cReset)
		fmt.Printf("  %s│%s  %s✗ %v%s\n", cDim, cReset, cRed, err, cReset)
		panic(err)
	}
	browser.DeveloperEnabled = config.AppConfig.Browser.Developer
	if err := logger.Init(logger.Config{
		ConsoleLevel: config.AppConfig.Logger.ConsoleLevel,
		FileLevel:    config.AppConfig.Logger.FileLevel,
		FilePath:     config.AppConfig.Logger.FilePath,
		MaxLogDays:   config.AppConfig.Logger.MaxLogDays,
	}); err != nil {
		fmt.Printf("%s✗%s\n", cRed+cBold, cReset)
		panic(err)
	}
	metrics.Init()
	tracing.Init(tracing.Config{
		Logger:    logger.Sugar,
		TraceIDFn: logger.GenerateTraceID,
	})
	if err := storage.Init(""); err != nil {
		fmt.Printf("%s✗%s\n", cRed+cBold, cReset)
		panic(err)
	}
	if err := llm.LoadConfig(); err != nil {
		fmt.Printf("%s!%s\n", cYellow+cBold, cReset)
		fmt.Printf("  %s│%s  %s⚠ LLM配置加载失败，请先配置模型%s\n", cDim, cReset, cYellow, cReset)
	}
	llm.GlobalStats.Init()
	initProviders()
	fmt.Printf("%s✓%s\n", cGreen+cBold, cReset)

	// ── 阶段 2: 记忆系统 ──
	fmt.Printf("  %s┄%s %s2/4%s %s记忆系统%s ", cDim, cReset, cCyan, cReset, cReset, cReset)
	memoryManager = initMemoryManager()
	fmt.Printf("%s✓%s\n", cGreen+cBold, cReset)

	// ── 阶段 3: 机器人核心 ──
	fmt.Printf("  %s┄%s %s3/4%s %s机器人核心%s ", cDim, cReset, cCyan, cReset, cReset, cReset)
	chat.DefaultChatManager.SetSavePath("./data/sessions/sessions.json")
	if err := chat.DefaultChatManager.LoadSessions(); err != nil {
		logger.Sugar.Warnw("会话恢复失败", "error", err)
	}
	chat.DefaultChatManager.StartCleanupTask(30 * time.Minute)
	chat.DefaultChatManager.StartAutoSave(5 * time.Minute)
	if err := chat.DefaultMessageFilter.LoadConfig(&config.AppConfig); err != nil {
		logger.Sugar.Warnw("Failed to load message filter config", "error", err)
	}

	chatBot = processor.NewChatBot(&config.AppConfig, llmProvider, visionProvider)
	if memoryManager != nil {
		chatBot.SetMemoryManager(memoryManager)
	}
	knowledge.Init(logger.Sugar)
	if memoryManager != nil {
		km := knowledge.InitManager(storage.GetDB(), memoryManager.GetEmbedder())
		chatBot.SetKnowledgeManager(km)
		_, total, _ := km.ListEntries(0, 1)
		logger.Sugar.Infow("[备忘录] 管理器初始化完成", "total", total)
	} else {
		km := knowledge.InitManager(storage.GetDB(), nil)
		chatBot.SetKnowledgeManager(km)
		_, total, _ := km.ListEntries(0, 1)
		logger.Sugar.Infow("[备忘录] 管理器初始化完成（无嵌入器）", "total", total)
	}
	fmt.Printf("%s✓%s\n", cGreen+cBold, cReset)

	// ── 阶段 4: 启动服务 ──
	fmt.Printf("  %s┄%s %s4/4%s %s启动服务%s ", cDim, cReset, cCyan, cReset, cReset, cReset)
	bus.Init()
	messageCounter := &MessageCounter{}
	bus.DefaultBus.Subscribe("message.received", messageCounter)
	busEventLog := &busEventLogger{}
	bus.DefaultBus.Subscribe("reply.generated", busEventLog)
	configReloader := &ConfigReloader{}
	bus.DefaultBus.Subscribe("config.reloaded", configReloader)
	config.WatchConfig(func() {
		bus.DefaultBus.Publish("config.reloaded", nil)
	})

	webuiServer := webui.NewServer(8089)
	webuiServer.SetJargonManager(chatBot.GetJargonManager())
	webuiServer.SetLocalChatProvider(chatBot)

	authToken := config.AppConfig.WebUI.AuthToken
	if authToken == "" {
		authToken = webui.LoadPersistedToken()
	}
	if authToken == "" {
		authToken = webui.GenerateToken()
		webui.PersistToken(authToken)
		fmt.Printf("  %s│%s  %s🔑 WebUI 访问令牌: %s%s\n", cDim, cReset, cCyan, authToken, cReset)
	} else {
		logger.Info("[WebUI] 使用已有访问令牌")
	}
	webui.SetAuthToken(authToken)
	webui.StartTokenRotation()

	if err := webuiServer.Start(); err != nil {
		fmt.Printf("%s!%s\n", cYellow+cBold, cReset)
		fmt.Printf("  %s│%s  %s⚠ WebUI 启动失败: %v%s\n", cDim, cReset, cYellow, err, cReset)
	} else {
		fmt.Printf("%s✓%s\n", cGreen+cBold, cReset)
	}

	fmt.Println("")
	fmt.Printf("  %s┌─────────────────────────────────────────────┐%s\n", cCyan, cReset)
	fmt.Printf("  %s│%s  %s%s 语瞳 Demo 启动完成！%s                   %s│%s\n", cCyan, cReset, cBold, c256Lime, cReset, cCyan, cReset)
	fmt.Printf("  %s├─────────────────────────────────────────────┤%s\n", cCyan, cReset)
	printKV("WebUI", "http://localhost:8089", c256Sky)
	printKV("聊天", "打开页面即可与语瞳对话", c256Gold)
	fmt.Printf("  %s└─────────────────────────────────────────────┘%s\n", cCyan, cReset)
	fmt.Println("")

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	sig := <-sigChan
	_ = sig
	fmt.Printf("\n  %s⏳ 正在关闭服务...%s\n", cYellow, cReset)

	shutdownTimeout := 30 * time.Second
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), shutdownTimeout)
	defer shutdownCancel()

	done := make(chan struct{})
	go func() {
		defer close(done)
		if webuiServer != nil {
			webuiServer.Stop()
		}
		bus.DefaultBus.Close()
		chat.DefaultChatManager.StopAutoSave()
		chat.DefaultChatManager.StopCleanupTask()
		if err := chat.DefaultChatManager.SaveSessions(); err != nil {
			logger.Sugar.Warnw("Failed to save sessions", "error", err)
		}
		if memoryManager != nil {
			memoryManager.Shutdown()
		}
		storage.Close()
		llm.GlobalStats.Save()
	}()

	select {
	case <-done:
		fmt.Printf("  %s✓ 再见～%s\n\n", cGreen, cReset)
	case <-shutdownCtx.Done():
		fmt.Printf("  %s⚠ 清理超时，强制退出%s\n\n", cYellow, cReset)
	}

	logger.Close()
}

func initProviders() {
	llmProvider = llm.NewRandomModelProvider("replyer")
	visionProvider = llm.NewRandomVisionProvider("vlm")
}

func initMemoryManager() *memory.MemoryManager {
	if !config.AppConfig.Memory.Enabled {
		return nil
	}

	modelCfg, provider, err := llm.GetModelConfig("embedding")
	if err != nil || modelCfg == nil || provider == nil {
		return nil
	}

	dim := config.AppConfig.Memory.EmbeddingDim
	if dim <= 0 {
		dim = 1024
	}

	embedderCfg := memory.EmbedderConfig{
		Primary: memory.ProviderEmbedConfig{
			Type:    "openai",
			BaseURL: provider.BaseURL,
			Model:   modelCfg.ModelIdentifier,
			APIKey:  provider.APIKey,
			Dim:     dim,
		},
	}

	embedder, err := memory.NewEmbedder(embedderCfg)
	if err != nil {
		fmt.Printf("  %s│%s  %s⚠ 向量模型连接失败: %v%s\n", cDim, cReset, cYellow, err, cReset)
		return nil
	}

	store := memory.NewMemoryStore(storage.GetDB())
	vs := memory.NewVectorStore(dim)

	os.MkdirAll("./data/vectors", 0755)
	vs.Load("./data/vectors/vectors.json")

	mm := memory.NewMemoryManager(embedder, store, vs, config.AppConfig.Memory)
	memory.DefaultManager = mm

	go mm.PeriodicCleanup()
	go mm.PeriodicVectorPersist("./data/vectors/vectors.json")
	go mm.PeriodicStats()

	return mm
}
