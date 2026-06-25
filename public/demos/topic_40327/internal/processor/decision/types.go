package decision

import (
	"strings"

	"YaraFlow/internal/platform"
)

// calcAdaptiveMaxRounds 根据消息复杂度自适应计算最大推理轮次
// 简单消息（招呼、表情）只需1轮，复杂消息（多问句、长文本、搜索请求）用满配置轮次
func (dm *DecisionMaker) calcAdaptiveMaxRounds(processedMsg *platform.ProcessedMessage) int {
	cfgMax := dm.config.Decision.MaxRounds
	if cfgMax <= 1 {
		return 1
	}

	content := processedMsg.Content
	contentLen := len([]rune(content))
	questionCount := strings.Count(content, "?") + strings.Count(content, "？")

	// 检测是否为搜索类请求：包含"查""搜""检索""资讯""新闻""资料"等词
	isSearchRequest := strings.Contains(content, "查") ||
		strings.Contains(content, "搜") ||
		strings.Contains(content, "检索") ||
		strings.Contains(content, "资讯") ||
		strings.Contains(content, "新闻") ||
		strings.Contains(content, "资料")

	// 复杂场景优先判断：多个问号、长文本、有图片且有问句、搜索请求 → 用满配置轮次
	if questionCount >= 2 || contentLen > 100 || (processedMsg.HasImage && questionCount >= 1) || isSearchRequest {
		return cfgMax
	}

	// 简单场景：很短的消息、纯表情 → 1轮
	if contentLen <= 5 || processedMsg.IsPureEmoji {
		return 1
	}
	// 中等长度无问句：最多2轮
	if contentLen <= 10 && questionCount == 0 && !processedMsg.HasImage {
		if cfgMax > 2 {
			return 2
		}
		return cfgMax
	}

	// 默认：配置轮次的中间值（至少1轮）
	mid := (cfgMax + 1) / 2
	if mid < 1 {
		return 1
	}
	return mid
}