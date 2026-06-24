package rule

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/fsnotify/fsnotify"

	"YaraFlow/internal/logger"
	"YaraFlow/internal/platform"
)

// Condition 规则触发条件
type Condition struct {
	// Keywords 关键词匹配（包含任一即触发）
	Keywords []string `json:"keywords,omitempty"`
	// SenderIDs 发送者匹配（ID包含任一即触发）
	SenderIDs []string `json:"sender_ids,omitempty"`
	// TimeRange 时间范围（格式 "HH:MM-HH:MM"）
	TimeRange string `json:"time_range,omitempty"`
	// IsAtMe 是否被@
	IsAtMe *bool `json:"is_at_me,omitempty"`
	// HasImage 是否包含图片
	HasImage *bool `json:"has_image,omitempty"`
	// Regex 正则匹配（内容匹配正则即触发）
	Regex string `json:"regex,omitempty"`
}

// Action 规则触发后的动作
type Action struct {
	// SetMood 设置心情
	SetMood string `json:"set_mood,omitempty"`
	// SetReplyStyle 设置回复风格
	SetReplyStyle string `json:"set_reply_style,omitempty"`
	// SetPersona 设置人设视角
	SetPersona string `json:"set_persona,omitempty"`
	// TriggerPlugin 触发插件动作
	TriggerPlugin string `json:"trigger_plugin,omitempty"`
	// SendReply 发送预设回复
	SendReply string `json:"send_reply,omitempty"`
}

// Rule 单条规则定义
type Rule struct {
	Name        string    `json:"name"`
	Description string    `json:"description,omitempty"`
	Enabled     bool      `json:"enabled"`
	Priority    int       `json:"priority"`
	Condition   Condition `json:"condition"`
	Action      Action    `json:"action"`
}

// MatchResult 规则匹配结果（用于测试/调试）
type MatchResult struct {
	RuleName    string `json:"rule_name"`
	Matched     bool   `json:"matched"`
	Description string `json:"description"`
	Priority    int    `json:"priority"`
	Enabled     bool   `json:"enabled"`
	Builtin     bool   `json:"builtin"`
	Action      Action `json:"action"`
	// MatchReason 记录匹配原因
	MatchReason string `json:"match_reason,omitempty"`
	// FailReason 记录未匹配原因
	FailReason string `json:"fail_reason,omitempty"`
}

// RuleEngine 规则引擎，管理所有规则并评估触发
type RuleEngine struct {
	mu           sync.RWMutex
	rules        []Rule
	rulesPath    string
	watcher      *fsnotify.Watcher
	watchStop    chan struct{}
	builtinRules []Rule // 内置规则，文件规则加载后合并
}

// NewRuleEngine 创建规则引擎（包含内置规则）
func NewRuleEngine() *RuleEngine {
	br := builtinRules()
	rules := make([]Rule, len(br))
	copy(rules, br)
	return &RuleEngine{
		rules:        rules,
		builtinRules: br,
	}
}

// NewRuleEngineForTest 创建不带内置规则的引擎，供测试使用
func NewRuleEngineForTest() *RuleEngine {
	return &RuleEngine{
		rules:        make([]Rule, 0),
		builtinRules: nil,
	}
}

// builtinRules 返回内置默认规则
func builtinRules() []Rule {
	atMe := true
	return []Rule{
		{
			Name:        "深夜安静模式",
			Description: "深夜时段自动降低回复频率，语气更温柔",
			Enabled:     true,
			Priority:    10,
			Condition: Condition{
				TimeRange: "23:00-06:00",
			},
			Action: Action{
				SetMood:       "安静温柔",
				SetReplyStyle: "语气平缓温柔，回复简短自然，不催促对方休息",
			},
		},
		{
			Name:        "清晨问候模式",
			Description: "清晨时段语气清新活力",
			Enabled:     true,
			Priority:    10,
			Condition: Condition{
				TimeRange: "06:00-08:00",
			},
			Action: Action{
				SetMood:       "清新活力",
				SetReplyStyle: "语气轻快有朝气，像刚起床洗漱完的感觉",
			},
		},
		{
			Name:        "午休放松模式",
			Description: "午休时段语气放松，不打扰休息",
			Enabled:     true,
			Priority:    10,
			Condition: Condition{
				TimeRange: "12:00-14:00",
			},
			Action: Action{
				SetMood:       "轻松慵懒",
				SetReplyStyle: "语气轻松随和，适当提醒对方午休放松",
			},
		},
		{
			Name:        "被@时优先回应",
			Description: "被@时切换到更专注的回复模式",
			Enabled:     true,
			Priority:    20,
			Condition: Condition{
				IsAtMe: &atMe,
			},
			Action: Action{
				SetMood:       "被点名了",
				SetReplyStyle: "被艾特时要更认真专注地回应，优先处理对方的问题",
			},
		},
		{
			Name:        "负面情绪安抚",
			Description: "检测到负面情绪关键词时自动切换温柔模式",
			Enabled:     true,
			Priority:    15,
			Condition: Condition{
				Keywords: []string{"难过", "伤心", "不开心", "郁闷", "烦躁", "压力大", "好累", "崩溃", "想哭", "委屈"},
			},
			Action: Action{
				SetMood:       "温柔关心",
				SetReplyStyle: "语气温柔体贴，先共情安慰再给建议，多用温暖的话语",
			},
		},
		{
			Name:        "开心情绪共鸣",
			Description: "检测到开心关键词时一起开心",
			Enabled:     true,
			Priority:    15,
			Condition: Condition{
				Keywords: []string{"开心", "好耶", "太棒了", "哈哈", "笑死", "快乐", "高兴", "nice", "恭喜"},
			},
			Action: Action{
				SetMood:       "开心兴奋",
				SetReplyStyle: "语气活泼兴奋，一起分享快乐，多用感叹号和颜文字",
			},
		},
	}
}

// AddRule 添加规则（线程安全）
func (e *RuleEngine) AddRule(rule Rule) {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.rules = append(e.rules, rule)
}

// AddRules 批量添加规则（线程安全）
func (e *RuleEngine) AddRules(rules []Rule) {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.rules = append(e.rules, rules...)
}

// LoadRulesFromFile 从JSON文件加载用户规则，与内置规则合并
func (e *RuleEngine) LoadRulesFromFile(filePath string) error {
	e.mu.Lock()
	defer e.mu.Unlock()

	data, err := os.ReadFile(filePath)
	if err != nil {
		return fmt.Errorf("读取规则文件失败: %w", err)
	}

	var fileRules []Rule
	if err := json.Unmarshal(data, &fileRules); err != nil {
		return fmt.Errorf("解析规则文件失败: %w", err)
	}

	// 只保留内置规则，替换文件规则
	e.rules = make([]Rule, len(e.builtinRules))
	copy(e.rules, e.builtinRules)
	e.rules = append(e.rules, fileRules...)

	// 按优先级排序（高优先级先执行）
	sort.Slice(e.rules, func(i, j int) bool {
		return e.rules[i].Priority > e.rules[j].Priority
	})

	e.rulesPath = filePath
	logger.Sugar.Infow("[规则引擎] 已加载规则", "builtin", len(e.builtinRules), "user", len(fileRules))
	return nil
}

// SaveRulesToFile 保存用户规则到JSON文件（不包含内置规则）
func (e *RuleEngine) SaveRulesToFile(filePath string) error {
	e.mu.RLock()
	defer e.mu.RUnlock()

	// 过滤出用户规则（非内置）
	var userRules []Rule
	builtinNames := make(map[string]bool)
	for _, r := range e.builtinRules {
		builtinNames[r.Name] = true
	}
	for _, r := range e.rules {
		if !builtinNames[r.Name] {
			userRules = append(userRules, r)
		}
	}

	data, err := json.MarshalIndent(userRules, "", "  ")
	if err != nil {
		return fmt.Errorf("序列化规则失败: %w", err)
	}

	if err := os.WriteFile(filePath, data, 0644); err != nil {
		return fmt.Errorf("写入规则文件失败: %w", err)
	}

	return nil
}

// StartWatching 启动规则文件热加载监听
func (e *RuleEngine) StartWatching(filePath string) error {
	if e.watcher != nil {
		return fmt.Errorf("规则文件监听已启动")
	}

	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		return fmt.Errorf("创建文件监听器失败: %w", err)
	}

	// 监听规则文件所在目录（目录监听比单文件更可靠）
	watchTarget := filePath
	if fi, err := os.Stat(filePath); err == nil && !fi.IsDir() {
		watchTarget = filepath.Dir(filePath)
	}

	if err := watcher.Add(watchTarget); err != nil {
		watcher.Close()
		return fmt.Errorf("监听规则文件失败: %w", err)
	}

	e.watcher = watcher
	e.watchStop = make(chan struct{})
	e.rulesPath = filePath

	go e.watchLoop()

	logger.Sugar.Infow("[规则引擎] 已启动规则文件热加载监听", "path", filePath)
	return nil
}

// StopWatching 停止文件监听
func (e *RuleEngine) StopWatching() {
	if e.watchStop != nil {
		close(e.watchStop)
		e.watchStop = nil
	}
	if e.watcher != nil {
		e.watcher.Close()
		e.watcher = nil
	}
}

// watchLoop 文件变化监听循环，带防抖
func (e *RuleEngine) watchLoop() {
	var debounceTimer *time.Timer
	const debounceDelay = 500 * time.Millisecond

	for {
		select {
		case <-e.watchStop:
			return
		case event, ok := <-e.watcher.Events:
			if !ok {
				return
			}
			if event.Has(fsnotify.Write) || event.Has(fsnotify.Create) {
				if debounceTimer != nil {
					debounceTimer.Stop()
				}
				debounceTimer = time.AfterFunc(debounceDelay, func() {
					if e.rulesPath != "" {
						if err := e.LoadRulesFromFile(e.rulesPath); err != nil {
							logger.Sugar.Warnw("[规则引擎] 热加载规则失败", "error", err)
						}
					}
				})
			}
		case err, ok := <-e.watcher.Errors:
			if !ok {
				return
			}
			logger.Sugar.Warnw("[规则引擎] 文件监听错误", "error", err)
		}
	}
}

// GetRules 获取当前所有规则（只读副本）
func (e *RuleEngine) GetRules() []Rule {
	e.mu.RLock()
	defer e.mu.RUnlock()
	rules := make([]Rule, len(e.rules))
	copy(rules, e.rules)
	return rules
}

// IsBuiltin 判断规则是否为内置规则
func (e *RuleEngine) IsBuiltin(name string) bool {
	for _, r := range e.builtinRules {
		if r.Name == name {
			return true
		}
	}
	return false
}

// UpdateRule 更新指定名称的规则（只更新用户规则，内置规则不可修改）
func (e *RuleEngine) UpdateRule(name string, updated Rule) error {
	e.mu.Lock()
	defer e.mu.Unlock()

	if e.IsBuiltin(name) {
		return fmt.Errorf("内置规则不可修改: %s", name)
	}

	for i, r := range e.rules {
		if r.Name == name {
			updated.Name = name // 保持名称不变
			e.rules[i] = updated
			return nil
		}
	}
	return fmt.Errorf("规则不存在: %s", name)
}

// DeleteRule 删除指定名称的规则（只删除用户规则，内置规则不可删除）
func (e *RuleEngine) DeleteRule(name string) error {
	e.mu.Lock()
	defer e.mu.Unlock()

	if e.IsBuiltin(name) {
		return fmt.Errorf("内置规则不可删除: %s", name)
	}

	for i, r := range e.rules {
		if r.Name == name {
			e.rules = append(e.rules[:i], e.rules[i+1:]...)
			return nil
		}
	}
	return fmt.Errorf("规则不存在: %s", name)
}

// ToggleRule 切换指定规则的启用/禁用状态
func (e *RuleEngine) ToggleRule(name string) (bool, error) {
	e.mu.Lock()
	defer e.mu.Unlock()

	for i, r := range e.rules {
		if r.Name == name {
			e.rules[i].Enabled = !e.rules[i].Enabled
			return e.rules[i].Enabled, nil
		}
	}
	return false, fmt.Errorf("规则不存在: %s", name)
}

// GetRulesPath 获取规则文件路径
func (e *RuleEngine) GetRulesPath() string {
	return e.rulesPath
}

// Evaluate 评估所有规则，返回触发动作列表（按优先级排序）
func (e *RuleEngine) Evaluate(msg *platform.Message, processedMsg *platform.ProcessedMessage) []Action {
	e.mu.RLock()
	defer e.mu.RUnlock()

	var actions []Action
	now := time.Now()

	for _, rule := range e.rules {
		if !rule.Enabled {
			continue
		}
		if e.matchCondition(&rule.Condition, msg, processedMsg, now) {
			actions = append(actions, rule.Action)
		}
	}

	return actions
}

// matchCondition 检查消息是否满足条件
func (e *RuleEngine) matchCondition(cond *Condition, msg *platform.Message, processedMsg *platform.ProcessedMessage, now time.Time) bool {
	// 正则匹配
	if cond.Regex != "" {
		content := msg.Content
		if processedMsg != nil {
			content = processedMsg.Content
		}
		re, err := regexp.Compile(cond.Regex)
		if err != nil {
			logger.Sugar.Warnw("[规则引擎] 正则编译失败", "regex", cond.Regex, "error", err)
			return false
		}
		if !re.MatchString(content) {
			return false
		}
	}

	// 关键词匹配
	if len(cond.Keywords) > 0 {
		content := msg.Content
		if processedMsg != nil {
			content = processedMsg.Content
		}
		matched := false
		for _, kw := range cond.Keywords {
			if strings.Contains(content, kw) {
				matched = true
				break
			}
		}
		if !matched {
			return false
		}
	}

	// 发送者匹配
	if len(cond.SenderIDs) > 0 {
		matched := false
		for _, id := range cond.SenderIDs {
			if msg.SenderID == id {
				matched = true
				break
			}
		}
		if !matched {
			return false
		}
	}

	// 时间范围匹配
	if cond.TimeRange != "" {
		if !e.matchTimeRange(cond.TimeRange, now) {
			return false
		}
	}

	// @我匹配
	if cond.IsAtMe != nil {
		isAtMe := msg.IsAtMe
		if processedMsg != nil {
			isAtMe = processedMsg.IsAtMe
		}
		if *cond.IsAtMe != isAtMe {
			return false
		}
	}

	// 图片匹配
	if cond.HasImage != nil {
		hasImage := msg.HasImage
		if processedMsg != nil {
			hasImage = processedMsg.HasImage
		}
		if *cond.HasImage != hasImage {
			return false
		}
	}

	return true
}

// TestMatch 测试消息匹配，返回所有规则的匹配详情（用于调试/测试）
func (e *RuleEngine) TestMatch(testMsg *platform.Message) []MatchResult {
	e.mu.RLock()
	defer e.mu.RUnlock()

	now := time.Now()
	var results []MatchResult

	for _, rule := range e.rules {
		result := MatchResult{
			RuleName:    rule.Name,
			Description: rule.Description,
			Priority:    rule.Priority,
			Enabled:     rule.Enabled,
			Builtin:     e.IsBuiltin(rule.Name),
			Action:      rule.Action,
		}

		if !rule.Enabled {
			result.Matched = false
			result.FailReason = "规则已禁用"
			results = append(results, result)
			continue
		}

		matched, reason := e.matchConditionWithReason(&rule.Condition, testMsg, nil, now)
		result.Matched = matched
		if matched {
			result.MatchReason = reason
		} else {
			result.FailReason = reason
		}
		results = append(results, result)
	}

	return results
}

// matchConditionWithReason 检查匹配并返回原因（所有条件必须同时满足，AND 逻辑）
func (e *RuleEngine) matchConditionWithReason(cond *Condition, msg *platform.Message, processedMsg *platform.ProcessedMessage, now time.Time) (bool, string) {
	content := msg.Content
	if processedMsg != nil {
		content = processedMsg.Content
	}

	// 正则匹配
	if cond.Regex != "" {
		re, err := regexp.Compile(cond.Regex)
		if err != nil {
			return false, fmt.Sprintf("正则编译失败: %v", err)
		}
		if !re.MatchString(content) {
			return false, fmt.Sprintf("内容不匹配正则: %s", cond.Regex)
		}
	}

	// 关键词匹配
	if len(cond.Keywords) > 0 {
		matched := false
		for _, kw := range cond.Keywords {
			if strings.Contains(content, kw) {
				matched = true
				break
			}
		}
		if !matched {
			return false, fmt.Sprintf("内容不包含关键词: %v", cond.Keywords)
		}
	}

	// 发送者匹配
	if len(cond.SenderIDs) > 0 {
		matched := false
		for _, id := range cond.SenderIDs {
			if msg.SenderID == id {
				matched = true
				break
			}
		}
		if !matched {
			return false, fmt.Sprintf("发送者不匹配: %v", cond.SenderIDs)
		}
	}

	// 时间范围匹配
	if cond.TimeRange != "" {
		if !e.matchTimeRange(cond.TimeRange, now) {
			return false, fmt.Sprintf("不在时间范围内: %s", cond.TimeRange)
		}
	}

	// @我匹配
	if cond.IsAtMe != nil {
		isAtMe := msg.IsAtMe
		if processedMsg != nil {
			isAtMe = processedMsg.IsAtMe
		}
		if *cond.IsAtMe != isAtMe {
			if *cond.IsAtMe {
				return false, "需要@我，但消息未@"
			}
			return false, "要求未被@，但消息@了"
		}
	}

	// 图片匹配
	if cond.HasImage != nil {
		hasImage := msg.HasImage
		if processedMsg != nil {
			hasImage = processedMsg.HasImage
		}
		if *cond.HasImage != hasImage {
			if *cond.HasImage {
				return false, "需要包含图片，但消息不含图片"
			}
			return false, "要求不含图片，但消息包含图片"
		}
	}

	// 所有条件都满足（或没有条件）→ 默认匹配
	return true, "所有条件匹配"
}

// matchTimeRange 检查当前时间是否在指定范围内
func (e *RuleEngine) matchTimeRange(timeRange string, now time.Time) bool {
	parts := strings.Split(timeRange, "-")
	if len(parts) != 2 {
		return false
	}

	start, err := time.Parse("15:04", strings.TrimSpace(parts[0]))
	if err != nil {
		return false
	}
	end, err := time.Parse("15:04", strings.TrimSpace(parts[1]))
	if err != nil {
		return false
	}

	currentTime := time.Date(0, 1, 1, now.Hour(), now.Minute(), 0, 0, time.UTC)
	startTime := time.Date(0, 1, 1, start.Hour(), start.Minute(), 0, 0, time.UTC)
	endTime := time.Date(0, 1, 1, end.Hour(), end.Minute(), 0, 0, time.UTC)

	if startTime.Before(endTime) || startTime.Equal(endTime) {
		return !currentTime.Before(startTime) && !currentTime.After(endTime)
	}
	// 跨天范围（如 22:00-06:00）
	return !currentTime.Before(startTime) || !currentTime.After(endTime)
}

// DefaultRuleEngine 全局默认规则引擎
var DefaultRuleEngine = NewRuleEngine()
