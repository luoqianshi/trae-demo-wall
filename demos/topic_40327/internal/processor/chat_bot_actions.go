package processor

import (
	"fmt"

	"YaraFlow/internal/logger"
	"YaraFlow/internal/platform"
	"YaraFlow/internal/processor/types"
)

func (bot *ChatBot) executePluginActions(decisionResult *types.DecisionResult, chatHistory *string) {
	if decisionResult == nil || len(decisionResult.ActionObjects) == 0 {
		return
	}
	for _, ao := range decisionResult.ActionObjects {
		if !bot.isPluginAction(ao.Action) {
			continue
		}
		// 用插件action执行，传入action对象参数
		params := map[string]interface{}{
			"action":            ao.Action,
			"think_level":       int(ao.ThinkLevel),
			"target_message_id": ao.TargetMessageID,
			"unknown_words":     ao.UnknownWords,
			"question":          ao.Question,
			"quote":             ao.Quote,
			"name":              ao.Name,
		}
		actionResults, err := bot.toolExecutor.ExecuteActionByName(ao.Action, params)
		if err != nil {
			logger.Sugar.Errorw("插件action执行失败",
				"action", ao.Action, "error", err)
		} else if len(actionResults) > 0 {
			for _, ar := range actionResults {
				if ar.Success && ar.Result != "" {
					*chatHistory += fmt.Sprintf("\n[动作 %s 执行结果]\n%s\n", ao.Action, ar.Result)
				}
			}
		}
	}
}

// executeBuiltinActions 执行内置action（非插件、非tool的原生action）。
// 当前支持的action: send_emoji
func (bot *ChatBot) executeBuiltinActions(decisionResult *types.DecisionResult, message *platform.Message) {
	if decisionResult == nil || len(decisionResult.ActionObjects) == 0 {
		return
	}
	for _, ao := range decisionResult.ActionObjects {
		switch ao.Action {
		case "send_emoji":
			bot.executeSendEmoji(ao, message)
		}
	}
}
