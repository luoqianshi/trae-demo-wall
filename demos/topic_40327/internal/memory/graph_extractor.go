package memory

import (
	"encoding/json"
	"fmt"
	"strings"
	"sync"

	"YaraFlow/internal/llm"
	"YaraFlow/internal/logger"
)

type GraphExtractor struct {
	llmProvider llm.LLMProvider
	graphStore  *GraphStore
	mu          sync.Mutex
}

func NewGraphExtractor(llmProvider llm.LLMProvider, graphStore *GraphStore) *GraphExtractor {
	return &GraphExtractor{
		llmProvider: llmProvider,
		graphStore:  graphStore,
	}
}

type extractionResult struct {
	Entities  []extractedEntity   `json:"entities"`
	Relations []extractedRelation `json:"relations"`
}

type extractedEntity struct {
	Name string `json:"name"`
	Type string `json:"type"`
}

type extractedRelation struct {
	Subject   string `json:"subject"`
	Predicate string `json:"predicate"`
	Object    string `json:"object"`
}

func (ge *GraphExtractor) ExtractFromMessage(content string, senderName string) error {
	if ge.llmProvider == nil || ge.graphStore == nil {
		return nil
	}

	content = strings.TrimSpace(content)
	if content == "" {
		return nil
	}

	if len([]rune(content)) > 2000 {
		runes := []rune(content)
		content = string(runes[:2000])
	}

	prompt := fmt.Sprintf(`从以下对话内容中提取实体和关系，构建知识图谱。

对话内容：
%s

规则：
1. 实体类型：person(人物), place(地点), thing(物品), concept(概念), organization(组织)
2. 关系以 (主语, 谓语, 宾语) 三元组表达
3. 谓语使用简洁的中文动词短语，如"喜欢""住在""在...工作""拥有""属于"
4. 只提取明确有依据的信息，不推测
5. 忽略打招呼、客套话、情绪表达

严格输出 JSON：
{
  "entities": [{"name": "实体名", "type": "person/place/thing/concept/organization"}],
  "relations": [{"subject": "主语", "predicate": "谓语", "object": "宾语"}]
}`, content)

	messages := []llm.ChatMessage{
		{Role: "user", Content: prompt},
	}

	response, err := ge.llmProvider.Chat(messages)
	if err != nil {
		logger.Sugar.Warnw("[GraphExtractor] LLM提取失败", "error", err)
		return err
	}

	result := ge.parseExtractionResult(response)
	if result == nil {
		return nil
	}

	ge.mu.Lock()
	defer ge.mu.Unlock()

	for _, entity := range result.Entities {
		if _, err := ge.graphStore.UpsertEntity(entity.Name, entity.Type, nil); err != nil {
			logger.Sugar.Warnw("[GraphExtractor] 插入实体失败", "error", err)
		}
	}

	for _, rel := range result.Relations {
		subj := strings.TrimSpace(rel.Subject)
		pred := strings.TrimSpace(rel.Predicate)
		obj := strings.TrimSpace(rel.Object)
		if subj == "" || pred == "" || obj == "" {
			continue
		}
		if _, err := ge.graphStore.AddRelation(subj, pred, obj, nil); err != nil {
			logger.Sugar.Warnw("[GraphExtractor] 插入关系失败", "error", err)
		}
	}

	if len(result.Entities) > 0 || len(result.Relations) > 0 {
		logger.Sugar.Infow("[GraphExtractor] 提取完成", "entities", len(result.Entities), "relations", len(result.Relations))
	}

	return nil
}

func (ge *GraphExtractor) parseExtractionResult(response string) *extractionResult {
	response = strings.TrimSpace(response)

	start := strings.Index(response, "{")
	end := strings.LastIndex(response, "}")
	if start >= 0 && end > start {
		response = response[start : end+1]
	}

	var result extractionResult
	if err := json.Unmarshal([]byte(response), &result); err != nil {
		logger.Sugar.Warnw("[GraphExtractor] JSON解析失败", "error", err, "raw_response", response)
		return nil
	}

	if len(result.Entities) == 0 && len(result.Relations) == 0 {
		return nil
	}

	return &result
}
