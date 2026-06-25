package config

import (
	"fmt"

	"github.com/fsnotify/fsnotify"
	"github.com/spf13/viper"
	"go.uber.org/zap"
)

func WatchConfig(onReload func()) {
	if configFilePath == "" {
		return
	}

	viper.OnConfigChange(func(e fsnotify.Event) {
		var newConfig Config
		if err := viper.Unmarshal(&newConfig); err != nil {
			fmt.Printf("  ⚠ 配置重载失败: %v\n", err)
			return
		}

		if newConfig.ContentFilter.BanWords == nil {
			newConfig.ContentFilter.BanWords = make([]string, 0)
		}
		if newConfig.ContentFilter.BanRegex == nil {
			newConfig.ContentFilter.BanRegex = make([]string, 0)
		}

		AppConfig = newConfig

		if onReload != nil {
			onReload()
		}
	})

	viper.WatchConfig()
}

func GetLoggerLevel() zap.AtomicLevel {
	var level zap.AtomicLevel
	switch AppConfig.Logger.ConsoleLevel {
	case "debug":
		level = zap.NewAtomicLevelAt(zap.DebugLevel)
	case "info":
		level = zap.NewAtomicLevelAt(zap.InfoLevel)
	case "warn":
		level = zap.NewAtomicLevelAt(zap.WarnLevel)
	case "error":
		level = zap.NewAtomicLevelAt(zap.ErrorLevel)
	default:
		level = zap.NewAtomicLevelAt(zap.InfoLevel)
	}
	return level
}

func GetFileLoggerLevel() zap.AtomicLevel {
	var level zap.AtomicLevel
	switch AppConfig.Logger.FileLevel {
	case "debug":
		level = zap.NewAtomicLevelAt(zap.DebugLevel)
	case "info":
		level = zap.NewAtomicLevelAt(zap.InfoLevel)
	case "warn":
		level = zap.NewAtomicLevelAt(zap.WarnLevel)
	case "error":
		level = zap.NewAtomicLevelAt(zap.ErrorLevel)
	default:
		level = zap.NewAtomicLevelAt(zap.DebugLevel)
	}
	return level
}

var validLogLevels = map[string]bool{
	"debug": true, "info": true, "warn": true, "error": true,
}

// Validate 校验配置完整性，返回首个错误
func (c *Config) Validate() error {
	if !validLogLevels[c.Logger.ConsoleLevel] {
		return fmt.Errorf("logger.console_level 无效值: %q (有效值: debug, info, warn, error)", c.Logger.ConsoleLevel)
	}
	if !validLogLevels[c.Logger.FileLevel] {
		return fmt.Errorf("logger.file_level 无效值: %q (有效值: debug, info, warn, error)", c.Logger.FileLevel)
	}

	if c.Bot.Nickname == "" {
		return fmt.Errorf("bot.nickname 不能为空，请设置机器人昵称")
	}
	if c.Bot.MaxReplyLen <= 0 {
		return fmt.Errorf("bot.max_reply_len 必须大于 0，当前值: %d", c.Bot.MaxReplyLen)
	}
	if c.Bot.MaxConcurrentMessages <= 0 {
		return fmt.Errorf("bot.max_concurrent_messages 必须大于 0，当前值: %d", c.Bot.MaxConcurrentMessages)
	}

	if c.Trigger.BaseFrequency < 0 || c.Trigger.BaseFrequency > 1 {
		return fmt.Errorf("trigger.base_frequency 必须在 0-1 之间，当前值: %f", c.Trigger.BaseFrequency)
	}

	if c.Decision.MaxRounds <= 0 {
		return fmt.Errorf("decision.max_rounds 必须大于 0，当前值: %d", c.Decision.MaxRounds)
	}

	if c.Bus.BufferSize <= 0 {
		return fmt.Errorf("bus.buffer_size 必须大于 0，当前值: %d", c.Bus.BufferSize)
	}

	if c.Memory.Enabled {
		if c.Memory.TopK <= 0 {
			return fmt.Errorf("memory.top_k 必须大于 0，当前值: %d", c.Memory.TopK)
		}
		if c.Memory.EmbeddingDim <= 0 {
			return fmt.Errorf("memory.embedding_dim 必须大于 0，当前值: %d", c.Memory.EmbeddingDim)
		}
		if c.Memory.MaxFragments <= 0 {
			return fmt.Errorf("memory.max_fragments 必须大于 0，当前值: %d", c.Memory.MaxFragments)
		}
		if c.Memory.SearchMode != "" && c.Memory.SearchMode != "hybrid" && c.Memory.SearchMode != "vector" && c.Memory.SearchMode != "keyword" {
			return fmt.Errorf("memory.search_mode 无效值: %q (有效值: hybrid, vector, keyword)", c.Memory.SearchMode)
		}
	}

	if c.Personality.BaseIdentity == "" {
		return fmt.Errorf("personality.base_identity 不能为空，请设置机器人核心身份")
	}
	if c.Personality.DefaultStyle == "" {
		return fmt.Errorf("personality.default_style 不能为空，请设置默认回复风格")
	}

	if c.Dedupe.Enabled {
		if c.Dedupe.WindowMs <= 0 {
			return fmt.Errorf("dedupe.window_ms 必须大于 0，当前值: %d", c.Dedupe.WindowMs)
		}
		if c.Dedupe.MaxSize <= 0 {
			return fmt.Errorf("dedupe.max_size 必须大于 0，当前值: %d", c.Dedupe.MaxSize)
		}
	}

	return nil
}
