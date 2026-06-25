package tool

import (
	"fmt"
	"sync"

	"YaraFlow/internal/config"
	"YaraFlow/internal/logger"
	"YaraFlow/internal/platform"
	"YaraFlow/internal/processor/types"
)

func (te *ToolExecutor) ExecuteVisionTools(processedMsg *platform.ProcessedMessage) ([]types.ToolResult, error) {
	if !processedMsg.HasImage {
		return nil, nil
	}

	if !config.AppConfig.Vision.Enabled {
		logger.Info("视觉分析功能已关闭，跳过图片分析")
		return nil, nil
	}

	if te.visionDone {
		logger.Info("视觉分析已完成，返回缓存结果")
		results := make([]types.ToolResult, len(te.lastVisionDescriptions))
		for i, desc := range te.lastVisionDescriptions {
			results[i] = types.ToolResult{
				Success:  true,
				ToolName: "vision",
				Result:   desc,
			}
		}
		return results, nil
	}

	logger.Sugar.Infow("执行视觉分析工具", "image_count", len(processedMsg.Images))

	// 并行分析多张图片，避免串行等待导致延迟叠加
	results := make([]types.ToolResult, len(processedMsg.Images))
	var wg sync.WaitGroup

	for i, imageURL := range processedMsg.Images {
		wg.Add(1)
		go func(idx int, url string) {
			defer wg.Done()
			defer func() {
				if r := recover(); r != nil {
					logger.Sugar.Errorw("[PANIC] 工具图片分析崩溃，已恢复",
						"index", idx+1, "panic", r)
					results[idx] = types.ToolResult{
						Success:  false,
						ToolName: "vision",
						Result:   fmt.Sprintf("图片 %d 分析崩溃: %v", idx+1, r),
					}
				}
			}()
			logger.Sugar.Infow("分析图片", "index", idx+1, "url", url)

			description, err := te.visionProvider.AnalyzeImage(url, te.config.VisionRules)
			if err != nil {
				logger.Sugar.Errorw("图片分析失败", "index", idx+1, "error", err)
				description = fmt.Sprintf("图片 %d 分析失败: %v", idx+1, err)
			} else {
				logger.Sugar.Debugw("[视觉模型提示词]", "prompt", te.config.VisionRules)
				logger.Sugar.Infow("图片分析成功", "index", idx+1, "desc_length", len(description))
			}

			results[idx] = types.ToolResult{
				Success:  true,
				ToolName: "vision",
				Result:   description,
			}
		}(i, imageURL)
	}
	wg.Wait()

	te.lastVisionDescriptions = make([]string, len(results))
	for i, r := range results {
		te.lastVisionDescriptions[i] = r.Result
	}
	te.visionDone = true

	return results, nil
}

func (te *ToolExecutor) ResetVisionCache() {
	te.lastVisionDescriptions = nil
	te.visionDone = false
}