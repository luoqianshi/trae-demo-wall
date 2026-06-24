package config

import (
	"bytes"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"text/template"
)

var promptTemplates struct {
	personality    *template.Template
	decisionSystem *template.Template
	decisionUser   *template.Template
	replyUser      *template.Template
}

func LoadPrompts(baseDir string) error {
	promptsDir := filepath.Join(baseDir, "configs", "prompts")
	if _, err := os.Stat(promptsDir); os.IsNotExist(err) {
		fmt.Printf("[模板加载] 模板目录不存在: %s，将使用默认内联模板\n", promptsDir)
		return nil
	}

	load := func(name string) (*template.Template, error) {
		path := filepath.Join(promptsDir, name)
		tmpl, err := template.ParseFiles(path)
		if err != nil {
			return nil, fmt.Errorf("解析模板 %s 失败: %w", name, err)
		}
		return tmpl, nil
	}

	tmpl, err := load("personality.tmpl")
	if err != nil {
		fmt.Printf("[模板加载] %v\n", err)
	} else {
		promptTemplates.personality = tmpl
	}

	tmpl, err = load("decision_system.tmpl")
	if err != nil {
		fmt.Printf("[模板加载] %v\n", err)
	} else {
		promptTemplates.decisionSystem = tmpl
	}

	tmpl, err = load("decision_user.tmpl")
	if err != nil {
		fmt.Printf("[模板加载] %v\n", err)
	} else {
		promptTemplates.decisionUser = tmpl
	}

	tmpl, err = load("reply_user.tmpl")
	if err != nil {
		fmt.Printf("[模板加载] %v\n", err)
	} else {
		promptTemplates.replyUser = tmpl
	}

	fmt.Printf("[模板加载] Prompt 模板加载完成\n")
	return nil
}

func renderTemplate(tmpl *template.Template, fallback string, data interface{}) string {
	if tmpl == nil {
		return fallback
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		fmt.Printf("[模板渲染] 渲染失败: %v, 使用回退\n", err)
		return fallback
	}
	return buf.String()
}

// RenderBaseIdentity 只输出 bot 是谁，精简到最核心的身份信息。
// 这是静态内容，在所有阶段（决策器+回复器）共用，避免每次调用都重复注入一大段。
func RenderBaseIdentity() string {
	p := AppConfig.Personality
	aliasNames := AppConfig.Bot.Aliases
	aliasHint := ""
	if len(aliasNames) > 0 {
		aliasHint = fmt.Sprintf("，别人也管你叫%s", strings.Join(aliasNames, "、"))
	}

	data := PersonalityRenderData{
		Nickname:  AppConfig.Bot.Nickname,
		Identity:  p.BaseIdentity,
		AliasHint: aliasHint,
	}

	fallback := fmt.Sprintf("你的名字是%s%s。\n%s", data.Nickname, aliasHint, data.Identity)

	return renderTemplate(promptTemplates.personality, fallback, data)
}

func RenderDecisionSystem(data DecisionSystemData) string {
	fallback := buildDecisionSystemFallback(data)
	return renderTemplate(promptTemplates.decisionSystem, fallback, data)
}

// BuildDecisionSystemBase 根据bot设置构建 DecisionSystemData 的基础部分（昵称/别名/场景描述）
// 调用方需要自行填充聊天记录相关字段（ChatHistory, Content, SenderName 等）
func BuildDecisionSystemBase(isGroupChat bool, senderName string) DecisionSystemData {
	alias := ""
	if len(AppConfig.Bot.Aliases) > 0 {
		alias = AppConfig.Bot.Aliases[0]
	}
	sceneDesc := buildSceneDescription(isGroupChat, senderName, AppConfig.Bot.Nickname)
	return DecisionSystemData{
		Nickname:         AppConfig.Bot.Nickname,
		Alias:            alias,
		SceneDescription: sceneDesc,
	}
}

func buildSceneDescription(isGroupChat bool, senderName, nickname string) string {
	if isGroupChat {
		return fmt.Sprintf("%s正在QQ群里聊天，下面是聊天记录。\n其中标注\"%s(你)\"的发言是%s自己之前说的，请注意区分。", nickname, nickname, nickname)
	}
	if senderName != "" {
		return fmt.Sprintf("%s正在和%s私聊，下面是聊天记录。", nickname, senderName)
	}
	return fmt.Sprintf("%s正在聊天，下面是聊天记录。", nickname)
}

// BuildSceneDescription 公开版本，供 reply_generator 等外部调用
func BuildSceneDescription(isGroupChat bool, senderName, nickname string) string {
	return buildSceneDescription(isGroupChat, senderName, nickname)
}

func buildDecisionSystemFallback(data DecisionSystemData) string {
	groupSection := ""
	if data.GroupChatAttention != "" {
		groupSection = fmt.Sprintf(`
# 群聊注意
%s`, data.GroupChatAttention)
	}

	aliasPart := ""
	if data.Alias != "" {
		aliasPart = fmt.Sprintf("也有人叫你%s", data.Alias)
	}

	scene := data.SceneDescription
	if scene == "" {
		scene = fmt.Sprintf("%s正在聊天。", data.Nickname)
	}

	return fmt.Sprintf(`%s

你是%s%s。%s`, scene, data.Nickname, aliasPart, groupSection)
}

func RenderDecisionUser(data DecisionUserData) string {
	return renderTemplate(promptTemplates.decisionUser, "", data)
}

func RenderReplyUser(data ReplyUserData) string {
	// 构建 fallback：时间由调用方在前面拼入，这里只构建模板内容
	var parts []string

	// 场景描述（原在 system prompt，现移到 user 消息顶部）
	if data.SceneDescription != "" {
		parts = append(parts, data.SceneDescription)
	}

	// 工具调用结果（放在聊天记录之前，备忘录不算）
	if data.ToolResults != "" {
		parts = append(parts, data.ToolResults)
	}

	// 聊天记录
	if data.ChatHistory != "" {
		parts = append(parts, "聊天记录：\n"+data.ChatHistory)
	}

	// 备忘录（只有当有内容时才显示，否则整个"备忘录："也不出现）
	if data.MemoContext != "" {
		parts = append(parts, "备忘录：\n"+data.MemoContext)
	}

	// 首次聊天：完整人设（包含身份、基本信息、性格与行为规则等）
	if data.IsFirstChat && data.Identity != "" {
		parts = append(parts, data.Identity)
	}

	// 决策想法
	if data.DecisionThought != "" {
		parts = append(parts, "现在你想的是：\n"+data.DecisionThought)
	}

	// 非首次聊天：简化人设（只注入名字和人物视角）
	if !data.IsFirstChat {
		aliasHint := fmt.Sprintf("你的名字是%s", data.Nickname)
		if len(AppConfig.Bot.Aliases) > 0 {
			aliasHint += fmt.Sprintf("，别人也管你叫%s", strings.Join(AppConfig.Bot.Aliases, "、"))
		}
		if data.PersonaAngle != "" {
			aliasHint += "。" + data.PersonaAngle
		}
		parts = append(parts, aliasHint)
	}

	// 底部回复引导
	parts = append(parts, `现在请你读读聊天记录，把握话题，给出日常口语化的回复。
尽量简短自然，一次对一个话题回复，不要太啰嗦，也不要太有条理。`)

	// 配置中写的风格
	if data.Style != "" {
		parts = append(parts, data.Style)
	}

	// 输出指令
	parts = append(parts, `只输出你要说的话，不要加任何前缀、后缀、引号或括号。
现在，你说：`)

	fallback := strings.Join(parts, "\n\n")
	return renderTemplate(promptTemplates.replyUser, fallback, data)
}
