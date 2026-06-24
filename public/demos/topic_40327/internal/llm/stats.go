package llm

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
	"time"
)

// CallRecord 单次 LLM 调用记录
type CallRecord struct {
	Time            time.Time `json:"time"`
	Model           string    `json:"model"`
	Provider        string    `json:"provider"`
	TaskType        string    `json:"task_type"`
	PromptTokens    int       `json:"prompt_tokens"`
	CompTokens      int       `json:"completion_tokens"`
	LatencyMs       int64     `json:"latency_ms"`
	TokensPerSecond float64   `json:"tokens_per_second"` // 词元生成速度
	Success         bool      `json:"success"`
}

// StatsCollector LLM 调用统计收集器
type StatsCollector struct {
	mu        sync.RWMutex
	records   []CallRecord
	maxSize   int
	statsPath string
	dirty     bool
}

var GlobalStats = &StatsCollector{
	records:   make([]CallRecord, 0, 1000),
	maxSize:   10000,
	statsPath: filepath.Join("log", "stats.json"),
}

// Init 初始化统计收集器，从磁盘加载历史数据
func (s *StatsCollector) Init() {
	s.load()
	// 定期自动保存（每30秒）
	go func() {
		ticker := time.NewTicker(30 * time.Second)
		defer ticker.Stop()
		for range ticker.C {
			s.saveIfDirty()
		}
	}()
}

// load 从磁盘加载历史记录
func (s *StatsCollector) load() {
	data, err := os.ReadFile(s.statsPath)
	if err != nil {
		return // 文件不存在或读取失败，从空开始
	}

	var records []CallRecord
	if err := json.Unmarshal(data, &records); err != nil {
		return
	}

	// 清理超过30天的旧记录
	cutoff := time.Now().Add(-30 * 24 * time.Hour)
	filtered := make([]CallRecord, 0, len(records))
	for _, r := range records {
		if r.Time.After(cutoff) {
			filtered = append(filtered, r)
		}
	}

	s.records = filtered
}

// save 保存记录到磁盘
func (s *StatsCollector) save() {
	// 确保目录存在
	dir := filepath.Dir(s.statsPath)
	os.MkdirAll(dir, 0755)

	data, err := json.Marshal(s.records)
	if err != nil {
		return
	}
	os.WriteFile(s.statsPath, data, 0644)
	s.dirty = false
}

// Save 导出方法：供外部在关闭时主动保存
func (s *StatsCollector) Save() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.save()
}

// saveIfDirty 仅在数据有变化时保存
func (s *StatsCollector) saveIfDirty() {
	s.mu.Lock()
	if s.dirty {
		s.save()
	}
	s.mu.Unlock()
}

// Record 记录一次 LLM 调用
func (s *StatsCollector) Record(model, provider, taskType string, promptTokens, compTokens int, latencyMs int64, tokensPerSecond float64, success bool) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.records = append(s.records, CallRecord{
		Time:            time.Now(),
		Model:           model,
		Provider:        provider,
		TaskType:        taskType,
		PromptTokens:    promptTokens,
		CompTokens:      compTokens,
		LatencyMs:       latencyMs,
		TokensPerSecond: tokensPerSecond,
		Success:         success,
	})

	// 限制最大记录数，超过则删除最旧的
	if len(s.records) > s.maxSize {
		s.records = s.records[len(s.records)-s.maxSize:]
	}

	s.dirty = true
	// 立即保存（异步，避免阻塞调用方）
	go s.saveIfDirty()
}

// GetCallTrend 获取24小时调用趋势（每小时一个数据点）
func (s *StatsCollector) GetCallTrend() []map[string]interface{} {
	s.mu.RLock()
	defer s.mu.RUnlock()

	now := time.Now()
	hours := make([]map[string]interface{}, 24)

	for i := 0; i < 24; i++ {
		hourStart := now.Add(-time.Duration(23-i) * time.Hour)
		hourEnd := hourStart.Add(time.Hour)
		count := 0

		for _, r := range s.records {
			if (r.Time.Equal(hourStart) || r.Time.After(hourStart)) && r.Time.Before(hourEnd) {
				count++
			}
		}

		hours[i] = map[string]interface{}{
			"time":  hourStart.Format("15:04"),
			"calls": count,
		}
	}

	return hours
}

// GetTokenUsage 获取最近7天 Token 消耗统计（按天聚合）
func (s *StatsCollector) GetTokenUsage() []map[string]interface{} {
	s.mu.RLock()
	defer s.mu.RUnlock()

	now := time.Now()
	days := 7

	// 初始化每天的数据
	type dayUsage struct {
		prompt int
		comp   int
	}
	dailyMap := make(map[string]*dayUsage)

	// 预填最近 N 天，确保没有记录的日期也出现在结果中（值为 0）
	for i := days - 1; i >= 0; i-- {
		dateKey := now.Add(-time.Duration(i) * 24 * time.Hour).Format("01-02")
		dailyMap[dateKey] = &dayUsage{}
	}

	cutoff := now.Add(-time.Duration(days) * 24 * time.Hour)
	for _, r := range s.records {
		if r.Time.Before(cutoff) {
			continue
		}
		dateKey := r.Time.Format("01-02")
		u, ok := dailyMap[dateKey]
		if !ok {
			u = &dayUsage{}
			dailyMap[dateKey] = u
		}
		u.prompt += r.PromptTokens
		u.comp += r.CompTokens
	}

	// 按日期顺序输出
	result := make([]map[string]interface{}, 0, days)
	for i := days - 1; i >= 0; i-- {
		dateKey := now.Add(-time.Duration(i) * 24 * time.Hour).Format("01-02")
		u := dailyMap[dateKey]
		result = append(result, map[string]interface{}{
			"date":              dateKey,
			"prompt_tokens":     u.prompt,
			"completion_tokens": u.comp,
			"total_tokens":      u.prompt + u.comp,
		})
	}

	return result
}

// GetTotalCalls 获取24小时内总调用次数
func (s *StatsCollector) GetTotalCalls() int {
	s.mu.RLock()
	defer s.mu.RUnlock()

	now := time.Now()
	cutoff := now.Add(-24 * time.Hour)
	count := 0
	for _, r := range s.records {
		if r.Time.After(cutoff) {
			count++
		}
	}
	return count
}

// GetCostTrend 获取24小时花费趋势（每小时一个数据点，单位：元）
func (s *StatsCollector) GetCostTrend() []map[string]interface{} {
	s.mu.RLock()
	defer s.mu.RUnlock()

	now := time.Now()
	hours := make([]map[string]interface{}, 24)

	// 构建模型价格映射
	modelPrices := make(map[string]struct{ priceIn, priceOut float64 })
	for name, entry := range GlobalLLMConfig.YaraFlow.Models {
		if m, ok := entry.(map[string]interface{}); ok {
			pi, _ := toFloat64(m["price_in"])
			po, _ := toFloat64(m["price_out"])
			modelPrices[name] = struct{ priceIn, priceOut float64 }{pi, po}
		}
	}

	for i := 0; i < 24; i++ {
		hourStart := now.Add(-time.Duration(23-i) * time.Hour)
		hourEnd := hourStart.Add(time.Hour)
		var cost float64

		for _, r := range s.records {
			if (r.Time.Equal(hourStart) || r.Time.After(hourStart)) && r.Time.Before(hourEnd) {
				// 计算花费：按每百万 token 价格
				prices := modelPrices[r.Model]
				cost += (float64(r.PromptTokens)/1000000)*prices.priceIn +
					(float64(r.CompTokens)/1000000)*prices.priceOut
			}
		}

		hours[i] = map[string]interface{}{
			"time": hourStart.Format("15:04"),
			"cost": cost,
		}
	}

	return hours
}

// GetTotalCost 获取24小时内总花费（单位：元）
func (s *StatsCollector) GetTotalCost() float64 {
	s.mu.RLock()
	defer s.mu.RUnlock()

	now := time.Now()
	cutoff := now.Add(-24 * time.Hour)

	modelPrices := make(map[string]struct{ priceIn, priceOut float64 })
	for name, entry := range GlobalLLMConfig.YaraFlow.Models {
		if m, ok := entry.(map[string]interface{}); ok {
			pi, _ := toFloat64(m["price_in"])
			po, _ := toFloat64(m["price_out"])
			modelPrices[name] = struct{ priceIn, priceOut float64 }{pi, po}
		}
	}

	var total float64
	for _, r := range s.records {
		if r.Time.After(cutoff) {
			prices := modelPrices[r.Model]
			total += (float64(r.PromptTokens)/1000000)*prices.priceIn +
				(float64(r.CompTokens)/1000000)*prices.priceOut
		}
	}
	return total
}

// GetRecentRecords 获取最近 N 条调用记录
func (s *StatsCollector) GetRecentRecords(n int) []CallRecord {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if n > len(s.records) {
		n = len(s.records)
	}
	result := make([]CallRecord, n)
	copy(result, s.records[len(s.records)-n:])
	return result
}
