package monitor

import (
	"encoding/json"
	"fmt"
	"html"
	"math"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"time"
	"unicode/utf8"
)

// ── Prompt 预览常量 ──

const (
	previewBaseDir   = "logs"
	previewSubDir    = "prompt_previews"
	maxPreviewGroups = 256
	trimBatchSize    = 100
)

var htmlNavPattern = regexp.MustCompile(
	`\s*<!-- yaraflow-nav:start -->.*?<!-- yaraflow-nav:end -->\s*`,
)
var htmlBodyOpenPattern = regexp.MustCompile(`(?i)(<body\b[^>]*>)`)

// ── 预览类型 ──

// PreviewCategory 预览类别
type PreviewCategory string

const (
	CategoryPlanner PreviewCategory = "planner"
	CategoryReplyer PreviewCategory = "replyer"
)

// PreviewFiles 一份预览的多个文件
type PreviewFiles struct {
	HTMLPath string
	TXTPath  string
	JSONPath string
	Category PreviewCategory
	Time     time.Time
}

// PromptMessage 单条 Prompt 消息
type PromptMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// PromptDetail 完整 Prompt 结构（JSON 序列化用）
type PromptDetail struct {
	SessionID     string            `json:"session_id"`
	Category      string            `json:"category"`
	Time          string            `json:"time"`
	Messages      []PromptMessage   `json:"messages"`
	Response      string            `json:"response"`
	Metadata      map[string]string `json:"metadata,omitempty"`
	TokenEstimate *TokenEstimate    `json:"token_estimate,omitempty"`
}

// TokenEstimate Token 用量估算
type TokenEstimate struct {
	PromptChars     int `json:"prompt_chars"`
	CompletionChars int `json:"completion_chars"`
	TotalChars      int `json:"total_chars"`
	EstimatedTokens int `json:"estimated_tokens"` // 中文约 1.5 字符/token, 英文约 4 字符/token
}

// EstimateTokens 估算 Token 用量
func EstimateTokens(promptChars, completionChars int) *TokenEstimate {
	totalChars := promptChars + completionChars
	estimated := int(math.Ceil(float64(totalChars) / 2.5))
	return &TokenEstimate{
		PromptChars:     promptChars,
		CompletionChars: completionChars,
		TotalChars:      totalChars,
		EstimatedTokens: estimated,
	}
}

// SaveDetailedPreview 保存一份完整结构的 Prompt 预览（HTML + TXT + JSON）
func SaveDetailedPreview(sessionID string, category PreviewCategory, messages []PromptMessage, response string, metadata map[string]string) (*PreviewFiles, error) {
	chatDir := previewChatDir(sessionID, category)
	if err := os.MkdirAll(chatDir, 0755); err != nil {
		return nil, fmt.Errorf("创建预览目录失败: %w", err)
	}

	stem := buildFileStem(chatDir)
	htmlPath := filepath.Join(chatDir, stem+".html")
	txtPath := filepath.Join(chatDir, stem+".txt")
	jsonPath := filepath.Join(chatDir, stem+".json")

	htmlContent := buildDetailedPreviewHTML(sessionID, category, messages, response, metadata)
	txtContent := buildDetailedPreviewText(sessionID, category, messages, response, metadata)

	promptChars := 0
	for _, m := range messages {
		promptChars += utf8.RuneCountInString(m.Content)
	}
	completionChars := utf8.RuneCountInString(response)
	tokenEst := EstimateTokens(promptChars, completionChars)

	detail := PromptDetail{
		SessionID:     sessionID,
		Category:      string(category),
		Time:          time.Now().Format("2006-01-02 15:04:05"),
		Messages:      messages,
		Response:      response,
		Metadata:      metadata,
		TokenEstimate: tokenEst,
	}
	jsonData, err := json.MarshalIndent(detail, "", "  ")
	if err != nil {
		return nil, fmt.Errorf("序列化 JSON 预览失败: %w", err)
	}

	if err := os.WriteFile(htmlPath, []byte(htmlContent), 0644); err != nil {
		return nil, fmt.Errorf("写入 HTML 预览失败: %w", err)
	}
	if err := os.WriteFile(txtPath, []byte(txtContent), 0644); err != nil {
		return nil, fmt.Errorf("写入 TXT 预览失败: %w", err)
	}
	if err := os.WriteFile(jsonPath, jsonData, 0644); err != nil {
		return nil, fmt.Errorf("写入 JSON 预览失败: %w", err)
	}

	trimOverflow(chatDir)
	refreshHTMLNavigation(chatDir)

	relPath := filepath.Join(string(category), safeName(sessionID), stem+".html")
	relPath = strings.ReplaceAll(relPath, "\\", "/")
	relTxtPath := strings.ReplaceAll(filepath.Join(string(category), safeName(sessionID), stem+".txt"), "\\", "/")
	relJSONPath := strings.ReplaceAll(filepath.Join(string(category), safeName(sessionID), stem+".json"), "\\", "/")
	previewTime := time.Now().Format("2006-01-02 15:04:05")

	summary := response
	if len(summary) > 300 {
		summary = summary[:300] + "..."
	}

	htmlURI := "/api/monitor/preview?path=" + url.QueryEscape(relPath)
	txtURI := "/api/monitor/preview?path=" + url.QueryEscape(relTxtPath)
	jsonURI := "/api/monitor/preview?path=" + url.QueryEscape(relJSONPath)

	ev := StageEvent{
		Stage:           "preview_saved",
		PreviewURI:      htmlURI,
		PreviewCategory: string(category),
		PreviewTime:     previewTime,
		ResponseSummary: summary,
		PreviewHTMLURI:  htmlURI,
		PreviewTXTURI:   txtURI,
		PreviewJSONURI:  jsonURI,
		TokenEstimate:   tokenEst,
		Timestamp:       time.Now().UnixMilli(),
	}

	if v, ok := metadata["msg_id"]; ok {
		ev.MsgID = v
	}
	if v, ok := metadata["eval_relevance"]; ok {
		ev.EvalRelevance = atoi(v)
	}
	if v, ok := metadata["eval_coherence"]; ok {
		ev.EvalCoherence = atoi(v)
	}
	if v, ok := metadata["eval_engagement"]; ok {
		ev.EvalEngagement = atoi(v)
	}
	if v, ok := metadata["eval_safety"]; ok {
		ev.EvalSafety = atoi(v)
	}
	if v, ok := metadata["eval_persona"]; ok {
		ev.EvalPersona = atoi(v)
	}
	if v, ok := metadata["eval_overall"]; ok {
		ev.EvalOverall = atof(v)
	}
	if v, ok := metadata["eval_comment"]; ok {
		ev.EvalComment = v
	}
	if v, ok := metadata["planner_thought"]; ok {
		ev.PlannerThought = v
	}
	stageSubscribersMu.Lock()
	for _, ch := range stageSubscribers {
		select {
		case ch <- ev:
		default:
		}
	}
	stageSubscribersMu.Unlock()

	return &PreviewFiles{
		HTMLPath: htmlPath,
		TXTPath:  txtPath,
		JSONPath: jsonPath,
		Category: category,
		Time:     time.Now(),
	}, nil
}

// ListPreviews 列出所有预览文件
func ListPreviews() []PreviewFiles {
	var result []PreviewFiles
	baseDir := filepath.Join(previewBaseDir, previewSubDir)
	entries, err := os.ReadDir(baseDir)
	if err != nil {
		return result
	}

	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		categoryDir := filepath.Join(baseDir, entry.Name())
		chatEntries, err := os.ReadDir(categoryDir)
		if err != nil {
			continue
		}
		for _, chatEntry := range chatEntries {
			if !chatEntry.IsDir() {
				continue
			}
			chatDir := filepath.Join(categoryDir, chatEntry.Name())
			htmlFiles, _ := filepath.Glob(filepath.Join(chatDir, "*.html"))
			for _, hf := range htmlFiles {
				stem := strings.TrimSuffix(filepath.Base(hf), ".html")
				txtPath := filepath.Join(chatDir, stem+".txt")
				jsonPath := filepath.Join(chatDir, stem+".json")
				info, err := os.Stat(hf)
				if err != nil {
					continue
				}
				result = append(result, PreviewFiles{
					HTMLPath: hf,
					TXTPath:  txtPath,
					JSONPath: jsonPath,
					Category: PreviewCategory(entry.Name()),
					Time:     info.ModTime(),
				})
			}
		}
	}

	sort.Slice(result, func(i, j int) bool {
		return result[i].Time.After(result[j].Time)
	})

	const maxPreviewResults = 500
	if len(result) > maxPreviewResults {
		result = result[:maxPreviewResults]
	}
	return result
}

// ── HTML/TXT 构建 ──

func buildPreviewHTML(sessionID string, category PreviewCategory, systemPrompt, userContent, response string, metadata map[string]string) string {
	var b strings.Builder
	b.WriteString(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
`)
	b.WriteString(`<title>Prompt Preview - `)
	b.WriteString(html.EscapeString(string(category)))
	b.WriteString(`</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", monospace; background: #0f172a; color: #e2e8f0; padding: 16px; }
  .header { border-bottom: 1px solid #334155; padding-bottom: 12px; margin-bottom: 16px; }
  .header h1 { font-size: 18px; color: #38bdf8; }
  .header .meta { font-size: 12px; color: #94a3b8; margin-top: 4px; }
  .panel { border: 1px solid #334155; border-radius: 8px; margin-bottom: 12px; overflow: hidden; }
  .panel-header { padding: 8px 12px; font-size: 12px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
  .panel-header.system { background: #1e3a5f; color: #60a5fa; }
  .panel-header.user { background: #1a3a1a; color: #4ade80; }
  .panel-header.assistant { background: #3d3a00; color: #facc15; }
  .panel-body { padding: 12px; font-size: 13px; line-height: 1.6; white-space: pre-wrap; word-break: break-all; background: #1e293b; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; }
  .badge.system { background: #2563eb; color: #fff; }
  .badge.user { background: #16a34a; color: #fff; }
  .badge.assistant { background: #ca8a04; color: #fff; }
  code { background: #334155; padding: 2px 6px; border-radius: 3px; font-size: 12px; }
  .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  .meta-table td { padding: 4px 8px; font-size: 12px; border-bottom: 1px solid #334155; }
  .meta-table td:first-child { color: #94a3b8; width: 120px; }
</style>
</head>
<body>
`)

	b.WriteString(`<div class="header">
`)
	b.WriteString(`<h1>`)
	b.WriteString(html.EscapeString(titleForCategory(category)))
	b.WriteString(`</h1>
`)
	b.WriteString(`<div class="meta">`)
	b.WriteString(html.EscapeString(sessionID))
	b.WriteString(` &middot; `)
	b.WriteString(time.Now().Format("2006-01-02 15:04:05"))
	b.WriteString(`</div>
</div>
`)

	if len(metadata) > 0 {
		b.WriteString(`<table class="meta-table">`)
		keys := make([]string, 0, len(metadata))
		for k := range metadata {
			keys = append(keys, k)
		}
		sort.Strings(keys)
		for _, k := range keys {
			b.WriteString(`<tr><td>`)
			b.WriteString(html.EscapeString(k))
			b.WriteString(`</td><td>`)
			b.WriteString(html.EscapeString(metadata[k]))
			b.WriteString(`</td></tr>`)
		}
		b.WriteString(`</table>`)
	}

	b.WriteString(`<div class="panel">
<div class="panel-header system"><span class="badge system">FULL</span> 完整提示词</div>
<div class="panel-body">`)
	if systemPrompt != "" {
		b.WriteString(html.EscapeString(systemPrompt))
	}
	if userContent != "" {
		if systemPrompt != "" {
			b.WriteString("\n\n")
		}
		b.WriteString(html.EscapeString(userContent))
	}
	if response != "" {
		if systemPrompt != "" || userContent != "" {
			b.WriteString("\n\n")
		}
		b.WriteString(html.EscapeString(response))
	}
	b.WriteString(`</div>
</div>`)

	b.WriteString(`
</body>
</html>`)
	return b.String()
}

func buildPreviewText(sessionID string, category PreviewCategory, systemPrompt, userContent, response string, metadata map[string]string) string {
	var b strings.Builder
	b.WriteString(fmt.Sprintf("=== %s ===\n", titleForCategory(category)))
	b.WriteString(fmt.Sprintf("会话: %s\n", sessionID))
	b.WriteString(fmt.Sprintf("时间: %s\n", time.Now().Format("2006-01-02 15:04:05")))
	b.WriteString(fmt.Sprintf("类别: %s\n\n", category))

	if len(metadata) > 0 {
		b.WriteString("--- 元数据 ---\n")
		for k, v := range metadata {
			b.WriteString(fmt.Sprintf("%s: %s\n", k, v))
		}
		b.WriteString("\n")
	}

	if systemPrompt != "" {
		b.WriteString("--- SYSTEM ---\n")
		b.WriteString(systemPrompt)
		b.WriteString("\n\n")
	}
	if userContent != "" {
		b.WriteString("--- USER ---\n")
		b.WriteString(userContent)
		b.WriteString("\n\n")
	}
	if response != "" {
		b.WriteString("--- ASSISTANT ---\n")
		b.WriteString(response)
		b.WriteString("\n\n")
	}
	return b.String()
}

// ── 详细预览（展示完整消息数组）──

func buildDetailedPreviewHTML(sessionID string, category PreviewCategory, messages []PromptMessage, response string, metadata map[string]string) string {
	var b strings.Builder
	b.WriteString(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
`)
	b.WriteString(`<title>Prompt Detail - `)
	b.WriteString(html.EscapeString(string(category)))
	b.WriteString(`</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", monospace; background: #0f172a; color: #e2e8f0; padding: 16px; }
  .header { border-bottom: 1px solid #334155; padding-bottom: 12px; margin-bottom: 16px; }
  .header h1 { font-size: 18px; color: #38bdf8; }
  .header .meta { font-size: 12px; color: #94a3b8; margin-top: 4px; }
  .token-bar { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
  .token-item { padding: 6px 12px; border-radius: 6px; font-size: 12px; background: #1e293b; border: 1px solid #334155; }
  .token-item strong { color: #38bdf8; }
  .panel { border: 1px solid #334155; border-radius: 8px; margin-bottom: 12px; overflow: hidden; }
  .panel-header { padding: 8px 12px; font-size: 12px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
  .panel-header.system { background: #1e3a5f; color: #60a5fa; }
  .panel-header.reply { background: #3d3a00; color: #facc15; }
  .panel-body { padding: 12px; font-size: 13px; line-height: 1.6; white-space: pre-wrap; word-break: break-all; background: #1e293b; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; }
  .badge.system { background: #2563eb; color: #fff; }
  .badge.reply { background: #ca8a04; color: #fff; }
  .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  .meta-table td { padding: 4px 8px; font-size: 12px; border-bottom: 1px solid #334155; }
  .meta-table td:first-child { color: #94a3b8; width: 120px; }
</style>
</head>
<body>
`)

	b.WriteString(`<div class="header">
`)
	b.WriteString(`<h1>`)
	b.WriteString(html.EscapeString(titleForCategory(category)))
	b.WriteString(`</h1>
`)
	b.WriteString(`<div class="meta">`)
	b.WriteString(html.EscapeString(sessionID))
	b.WriteString(` &middot; `)
	b.WriteString(time.Now().Format("2006-01-02 15:04:05"))
	b.WriteString(`</div>
</div>
`)

	promptChars := 0
	for _, m := range messages {
		promptChars += utf8.RuneCountInString(m.Content)
	}
	completionChars := utf8.RuneCountInString(response)
	tokenEst := EstimateTokens(promptChars, completionChars)

	b.WriteString(`<div class="token-bar">
`)
	b.WriteString(`<div class="token-item">Prompt 字符: <strong>`)
	b.WriteString(fmt.Sprintf("%d", tokenEst.PromptChars))
	b.WriteString(`</strong></div>
`)
	b.WriteString(`<div class="token-item">回复字符: <strong>`)
	b.WriteString(fmt.Sprintf("%d", tokenEst.CompletionChars))
	b.WriteString(`</strong></div>
`)
	b.WriteString(`<div class="token-item">总字符: <strong>`)
	b.WriteString(fmt.Sprintf("%d", tokenEst.TotalChars))
	b.WriteString(`</strong></div>
`)
	b.WriteString(`<div class="token-item">估算 Token: <strong>`)
	b.WriteString(fmt.Sprintf("~%d", tokenEst.EstimatedTokens))
	b.WriteString(`</strong></div>
`)
	b.WriteString(`<div class="token-item">消息数: <strong>`)
	b.WriteString(fmt.Sprintf("%d", len(messages)))
	b.WriteString(`</strong></div>
</div>
`)

	if len(metadata) > 0 {
		b.WriteString(`<table class="meta-table">`)
		keys := make([]string, 0, len(metadata))
		for k := range metadata {
			keys = append(keys, k)
		}
		sort.Strings(keys)
		for _, k := range keys {
			b.WriteString(`<tr><td>`)
			b.WriteString(html.EscapeString(k))
			b.WriteString(`</td><td>`)
			b.WriteString(html.EscapeString(metadata[k]))
			b.WriteString(`</td></tr>`)
		}
		b.WriteString(`</table>`)
	}

	b.WriteString(`<div class="panel">
<div class="panel-header system"><span class="badge system">PROMPT</span> 完整提示词</div>
<div class="panel-body">`)
	for i, msg := range messages {
		if i > 0 {
			b.WriteString("\n\n")
		}
		b.WriteString(html.EscapeString(msg.Content))
	}
	b.WriteString(`</div>
</div>`)

	if response != "" {
		b.WriteString(`<div class="panel">
<div class="panel-header reply"><span class="badge reply">REPLY</span> LLM 回复</div>
`)
		b.WriteString(`<div class="panel-body">`)
		b.WriteString(html.EscapeString(response))
		b.WriteString(`</div>
</div>`)
	}

	b.WriteString(`
</body>
</html>`)
	return b.String()
}

func buildDetailedPreviewText(sessionID string, category PreviewCategory, messages []PromptMessage, response string, metadata map[string]string) string {
	var b strings.Builder
	b.WriteString(fmt.Sprintf("=== %s ===\n", titleForCategory(category)))
	b.WriteString(fmt.Sprintf("会话: %s\n", sessionID))
	b.WriteString(fmt.Sprintf("时间: %s\n", time.Now().Format("2006-01-02 15:04:05")))
	b.WriteString(fmt.Sprintf("类别: %s\n", category))

	promptChars := 0
	for _, m := range messages {
		promptChars += utf8.RuneCountInString(m.Content)
	}
	completionChars := utf8.RuneCountInString(response)
	tokenEst := EstimateTokens(promptChars, completionChars)
	b.WriteString(fmt.Sprintf("Prompt字符: %d | 回复字符: %d | 估算Token: ~%d\n\n", tokenEst.PromptChars, tokenEst.CompletionChars, tokenEst.EstimatedTokens))

	if len(metadata) > 0 {
		b.WriteString("--- 元数据 ---\n")
		for k, v := range metadata {
			b.WriteString(fmt.Sprintf("%s: %s\n", k, v))
		}
		b.WriteString("\n")
	}

	b.WriteString("--- 完整提示词 ---\n")
	for i, msg := range messages {
		if i > 0 {
			b.WriteString("\n\n")
		}
		b.WriteString(msg.Content)
	}

	if response != "" {
		b.WriteString("\n\n── LLM 回复 ──\n")
		b.WriteString(response)
		b.WriteString("\n\n")
	}
	return b.String()
}

// ── 内部工具函数 ──

func previewChatDir(sessionID string, category PreviewCategory) string {
	safeCategory := safeName(string(category))
	safeSession := safeName(sessionID)
	return filepath.Join(previewBaseDir, previewSubDir, safeCategory, safeSession)
}

func safeName(s string) string {
	re := regexp.MustCompile(`[^A-Za-z0-9._-]+`)
	result := re.ReplaceAllString(strings.TrimSpace(s), "_")
	result = strings.Trim(result, "._")
	if result == "" {
		return "unknown"
	}
	return result
}

func buildFileStem(chatDir string) string {
	baseStem := fmt.Sprintf("%d", time.Now().UnixMilli())
	candidate := baseStem
	suffix := 1
	for {
		htmlPath := filepath.Join(chatDir, candidate+".html")
		txtPath := filepath.Join(chatDir, candidate+".txt")
		_, errHTML := os.Stat(htmlPath)
		_, errTXT := os.Stat(txtPath)
		if os.IsNotExist(errHTML) && os.IsNotExist(errTXT) {
			return candidate
		}
		candidate = fmt.Sprintf("%s_%d", baseStem, suffix)
		suffix++
	}
}

func titleForCategory(category PreviewCategory) string {
	switch category {
	case CategoryPlanner:
		return "YaraFlow 规划器 Prompt 预览"
	case CategoryReplyer:
		return "YaraFlow 回复器 Prompt 预览"
	default:
		return "YaraFlow Prompt 预览"
	}
}

func trimOverflow(chatDir string) {
	grouped := map[string][]string{}
	entries, err := os.ReadDir(chatDir)
	if err != nil {
		return
	}
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		stem := strings.TrimSuffix(entry.Name(), filepath.Ext(entry.Name()))
		grouped[stem] = append(grouped[stem], filepath.Join(chatDir, entry.Name()))
	}

	if len(grouped) <= maxPreviewGroups {
		return
	}

	type group struct {
		stem  string
		files []string
		mtime time.Time
	}
	var groups []group
	for stem, files := range grouped {
		oldest := time.Now()
		for _, f := range files {
			info, err := os.Stat(f)
			if err == nil && info.ModTime().Before(oldest) {
				oldest = info.ModTime()
			}
		}
		groups = append(groups, group{stem, files, oldest})
	}
	sort.Slice(groups, func(i, j int) bool {
		return groups[i].mtime.Before(groups[j].mtime)
	})

	overflow := len(groups) - maxPreviewGroups
	trimCount := overflow
	if trimCount < trimBatchSize {
		trimCount = trimBatchSize
	}
	if trimCount > len(groups) {
		trimCount = len(groups)
	}

	for _, g := range groups[:trimCount] {
		for _, f := range g.files {
			os.Remove(f)
		}
	}
}

func refreshHTMLNavigation(chatDir string) {
	htmlFiles, _ := filepath.Glob(filepath.Join(chatDir, "*.html"))
	if len(htmlFiles) <= 1 {
		return
	}

	sort.Slice(htmlFiles, func(i, j int) bool {
		infoI, _ := os.Stat(htmlFiles[i])
		infoJ, _ := os.Stat(htmlFiles[j])
		if infoI == nil || infoJ == nil {
			return false
		}
		return infoI.ModTime().Before(infoJ.ModTime())
	})

	for i, fp := range htmlFiles {
		var prev, next string
		if i > 0 {
			prev = filepath.Base(htmlFiles[i-1])
		}
		if i+1 < len(htmlFiles) {
			next = filepath.Base(htmlFiles[i+1])
		}
		injectNav(fp, prev, next)
	}
}

func injectNav(filePath, prev, next string) {
	content, err := os.ReadFile(filePath)
	if err != nil {
		return
	}
	clean := htmlNavPattern.ReplaceAllString(string(content), "\n")

	prevLink := buildNavLink(prev, "\u2190 \u4E0A\u4E00\u4EFD")
	nextLink := buildNavLink(next, "\u4E0B\u4E00\u4EFD \u2192")
	currentLabel := html.EscapeString(strings.TrimSuffix(filepath.Base(filePath), ".html"))

	nav := fmt.Sprintf(`<!-- yaraflow-nav:start -->
<style>
.yf-nav { position:fixed; top:12px; right:12px; z-index:2147483647; display:flex; align-items:center; gap:8px; max-width:calc(100vw-24px); padding:8px; border:1px solid rgba(148,163,184,0.36); border-radius:8px; background:rgba(15,23,42,0.92); box-shadow:0 12px 28px rgba(15,23,42,0.16); color:#e2e8f0; font-family:"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif; backdrop-filter:blur(8px); }
.yf-nav-current { min-width:0; max-width:220px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#94a3b8; font-size:12px; font-weight:700; }
.yf-nav-button { display:inline-flex; align-items:center; justify-content:center; min-height:30px; padding:0 10px; border:1px solid rgba(148,163,184,0.24); border-radius:6px; background:#38bdf8; color:#0f172a; font-size:13px; font-weight:700; line-height:1; text-decoration:none; white-space:nowrap; }
.yf-nav-button:hover { background:#7dd3fc; }
.yf-nav-button-disabled { background:#334155; color:#64748b; cursor:not-allowed; }
.yf-nav-spacer { height:54px; }
@media (max-width:640px) { .yf-nav { left:8px; right:8px; top:8px; } .yf-nav-current { flex:1; max-width:none; } }
</style>
<nav class="yf-nav" aria-label="Prompt 预览导航">
%s
<span class="yf-nav-current" title="%s">%s</span>
%s
</nav>
<div class="yf-nav-spacer" aria-hidden="true"></div>
<!-- yaraflow-nav:end -->
`, prevLink, currentLabel, currentLabel, nextLink)

	var result string
	if htmlBodyOpenPattern.MatchString(clean) {
		result = htmlBodyOpenPattern.ReplaceAllString(clean, "${1}\n"+nav)
	} else {
		result = nav + clean
	}

	os.WriteFile(filePath, []byte(result), 0644)
}

// ── 工具函数 ──

func atoi(s string) int {
	var n int
	fmt.Sscanf(s, "%d", &n)
	return n
}

func atof(s string) float64 {
	var f float64
	fmt.Sscanf(s, "%f", &f)
	return f
}

func buildNavLink(filename, label string) string {
	if filename == "" {
		return fmt.Sprintf(`<span class="yf-nav-button yf-nav-button-disabled" aria-disabled="true">%s</span>`, html.EscapeString(label))
	}
	return fmt.Sprintf(`<a class="yf-nav-button" href="%s">%s</a>`, html.EscapeString(filename), html.EscapeString(label))
}
