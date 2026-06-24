package chat

import (
	"regexp"
	"strings"
	"sync"

	"YaraFlow/internal/config"
	"YaraFlow/internal/logger"
)

type FilterResult struct {
	Allowed    bool
	Reason     string
	FilteredBy string
}

type MessageFilter struct {
	banWords []string
	banRegex []*regexp.Regexp
	mu       sync.RWMutex
}

var DefaultMessageFilter = &MessageFilter{
	banWords: make([]string, 0),
	banRegex: make([]*regexp.Regexp, 0),
}

func (mf *MessageFilter) LoadConfig(cfg *config.Config) error {
	mf.mu.Lock()
	defer mf.mu.Unlock()

	mf.banWords = make([]string, 0)
	mf.banRegex = make([]*regexp.Regexp, 0)

	for _, word := range cfg.ContentFilter.BanWords {
		word = strings.TrimSpace(word)
		if word != "" {
			mf.banWords = append(mf.banWords, word)
		}
	}

	for _, pattern := range cfg.ContentFilter.BanRegex {
		pattern = strings.TrimSpace(pattern)
		if pattern == "" {
			continue
		}
		re, err := regexp.Compile(pattern)
		if err != nil {
			continue
		}
		mf.banRegex = append(mf.banRegex, re)
	}

	logger.Sugar.Infow("消息过滤器已加载", "banWords", len(mf.banWords), "banRegex", len(mf.banRegex))

	return nil
}

func (mf *MessageFilter) CheckBanWords(content string) *FilterResult {
	mf.mu.RLock()
	defer mf.mu.RUnlock()

	for _, word := range mf.banWords {
		if strings.Contains(content, word) {
			return &FilterResult{
				Allowed:    false,
				Reason:     "包含屏蔽词: " + word,
				FilteredBy: "ban_words",
			}
		}
	}

	return &FilterResult{Allowed: true}
}

func (mf *MessageFilter) CheckBanRegex(content string) *FilterResult {
	mf.mu.RLock()
	defer mf.mu.RUnlock()

	for _, re := range mf.banRegex {
		if re.MatchString(content) {
			return &FilterResult{
				Allowed:    false,
				Reason:     "匹配正则过滤模式: " + re.String(),
				FilteredBy: "ban_regex",
			}
		}
	}

	return &FilterResult{Allowed: true}
}

func (mf *MessageFilter) Filter(content string) *FilterResult {
	logger.Sugar.Infow("开始内容过滤检查", "content", content)
	logger.Sugar.Infow("当前屏蔽词", "banWords", mf.banWords)
	if result := mf.CheckBanWords(content); !result.Allowed {
		logger.Sugar.Infow("触发屏蔽词过滤", "reason", result.Reason)
		return result
	}

	if result := mf.CheckBanRegex(content); !result.Allowed {
		logger.Sugar.Infow("触发正则过滤", "reason", result.Reason)
		return result
	}

	logger.Info("内容过滤检查通过")
	return &FilterResult{Allowed: true}
}

// FilterOutbound 过滤出站（机器人回复）消息
// 防止模型生成的回复中包含敏感词或违规内容
func (mf *MessageFilter) FilterOutbound(content string) *FilterResult {
	mf.mu.RLock()
	defer mf.mu.RUnlock()

	for _, word := range mf.banWords {
		if strings.Contains(content, word) {
			logger.Sugar.Warnw("出站消息触发屏蔽词过滤", "word", word)
			return &FilterResult{
				Allowed:    false,
				Reason:     "出站回复包含屏蔽词: " + word,
				FilteredBy: "ban_words_outbound",
			}
		}
	}

	for _, re := range mf.banRegex {
		if re.MatchString(content) {
			logger.Sugar.Warnw("出站消息触发正则过滤", "pattern", re.String())
			return &FilterResult{
				Allowed:    false,
				Reason:     "出站回复匹配过滤模式: " + re.String(),
				FilteredBy: "ban_regex_outbound",
			}
		}
	}

	return &FilterResult{Allowed: true}
}

func (mf *MessageFilter) AddBanWord(word string) {
	mf.mu.Lock()
	defer mf.mu.Unlock()

	for _, w := range mf.banWords {
		if w == word {
			return
		}
	}
	mf.banWords = append(mf.banWords, word)
}

func (mf *MessageFilter) RemoveBanWord(word string) {
	mf.mu.Lock()
	defer mf.mu.Unlock()

	for i, w := range mf.banWords {
		if w == word {
			mf.banWords = append(mf.banWords[:i], mf.banWords[i+1:]...)
			return
		}
	}
}

func (mf *MessageFilter) AddBanRegex(pattern string) error {
	re, err := regexp.Compile(pattern)
	if err != nil {
		return err
	}

	mf.mu.Lock()
	defer mf.mu.Unlock()

	for _, r := range mf.banRegex {
		if r.String() == pattern {
			return nil
		}
	}
	mf.banRegex = append(mf.banRegex, re)
	return nil
}

func (mf *MessageFilter) RemoveBanRegex(pattern string) {
	mf.mu.Lock()
	defer mf.mu.Unlock()

	for i, r := range mf.banRegex {
		if r.String() == pattern {
			mf.banRegex = append(mf.banRegex[:i], mf.banRegex[i+1:]...)
			return
		}
	}
}

func (mf *MessageFilter) GetBanWords() []string {
	mf.mu.RLock()
	defer mf.mu.RUnlock()
	return append([]string{}, mf.banWords...)
}

func (mf *MessageFilter) GetBanRegexPatterns() []string {
	mf.mu.RLock()
	defer mf.mu.RUnlock()

	var patterns []string
	for _, re := range mf.banRegex {
		patterns = append(patterns, re.String())
	}
	return patterns
}
