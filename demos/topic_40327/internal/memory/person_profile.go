package memory

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"sync"
	"time"

	"YaraFlow/internal/llm"
	"YaraFlow/internal/logger"
	"YaraFlow/internal/storage"
)

type PersonProfileSections struct {
	IdentitySettings       []string `json:"identity_settings"`
	RelationshipSettings   []string `json:"relationship_settings"`
	StableFacts            []string `json:"stable_facts"`
	InteractionPreferences []string `json:"interaction_preferences"`
	RecentInteractions     []string `json:"recent_interactions"`
	UncertainNotes         []string `json:"uncertain_notes"`
}

type PersonProfile struct {
	PersonID    string
	PrimaryName string
	Aliases     []string
	Sections    PersonProfileSections
	Version     int
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

type PersonProfileStore struct {
	db *sql.DB
}

func NewPersonProfileStore() *PersonProfileStore {
	return &PersonProfileStore{
		db: storage.GetDB(),
	}
}

func deserializeAliases(jsonStr string) []string {
	var aliases []string
	if jsonStr != "" {
		if err := json.Unmarshal([]byte(jsonStr), &aliases); err != nil {
			logger.Sugar.Warnw("[人物画像] 别名反序列化失败", "error", err, "json", jsonStr)
		}
	}
	if aliases == nil {
		aliases = []string{}
	}
	return aliases
}

func deserializeSections(jsonStr string) PersonProfileSections {
	var sections PersonProfileSections
	if jsonStr != "" && jsonStr != "{}" {
		if err := json.Unmarshal([]byte(jsonStr), &sections); err != nil {
			logger.Sugar.Warnw("[人物画像] 分节反序列化失败", "error", err, "json", jsonStr)
		}
	}
	return sections
}

func buildProfile(pid, primaryName, aliasesJSON, sectionsJSON string, version int, createdStr, updatedStr string) *PersonProfile {
	return &PersonProfile{
		PersonID:    pid,
		PrimaryName: primaryName,
		Aliases:     deserializeAliases(aliasesJSON),
		Sections:    deserializeSections(sectionsJSON),
		Version:     version,
		CreatedAt:   parseTimestamp(createdStr),
		UpdatedAt:   parseTimestamp(updatedStr),
	}
}

func (pps *PersonProfileStore) GetProfile(personID string) (*PersonProfile, error) {
	if pps.db == nil {
		return nil, fmt.Errorf("数据库未初始化")
	}

	row := pps.db.QueryRow(
		`SELECT person_id, primary_name, aliases, sections, version, created_at, updated_at
		 FROM person_profiles WHERE person_id = ?`, personID,
	)

	var (
		pid          string
		primaryName  string
		aliasesJSON  string
		sectionsJSON string
		version      int
		createdStr   string
		updatedStr   string
	)

	err := row.Scan(&pid, &primaryName, &aliasesJSON, &sectionsJSON, &version, &createdStr, &updatedStr)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return buildProfile(pid, primaryName, aliasesJSON, sectionsJSON, version, createdStr, updatedStr), nil
}

func (pps *PersonProfileStore) UpsertProfile(profile *PersonProfile) error {
	if pps.db == nil {
		return fmt.Errorf("数据库未初始化")
	}

	aliasesJSON, err := json.Marshal(profile.Aliases)
	if err != nil {
		return fmt.Errorf("序列化别名失败: %w", err)
	}
	sectionsJSON, err := json.Marshal(profile.Sections)
	if err != nil {
		return fmt.Errorf("序列化分节数据失败: %w", err)
	}
	now := time.Now()

	_, err = pps.db.Exec(
		`INSERT INTO person_profiles (person_id, primary_name, aliases, sections, version, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?)
		 ON CONFLICT(person_id) DO UPDATE SET
		 primary_name = excluded.primary_name,
		 aliases = excluded.aliases,
		 sections = excluded.sections,
		 version = excluded.version,
		 updated_at = excluded.updated_at`,
		profile.PersonID, profile.PrimaryName,
		string(aliasesJSON), string(sectionsJSON),
		profile.Version, now.Format("2006-01-02 15:04:05"), now.Format("2006-01-02 15:04:05"),
	)
	if err != nil {
		return fmt.Errorf("保存人物画像失败: %w", err)
	}

	profile.UpdatedAt = now
	return nil
}

func (pps *PersonProfileStore) DeleteProfile(personID string) error {
	if pps.db == nil {
		return fmt.Errorf("数据库未初始化")
	}

	_, err := pps.db.Exec(`DELETE FROM person_profiles WHERE person_id = ?`, personID)
	return err
}

func (pps *PersonProfileStore) ListProfiles(limit int) ([]*PersonProfile, error) {
	if pps.db == nil {
		return nil, fmt.Errorf("数据库未初始化")
	}

	if limit <= 0 {
		limit = 100
	}

	rows, err := pps.db.Query(
		`SELECT person_id, primary_name, aliases, sections, version, created_at, updated_at
		 FROM person_profiles ORDER BY updated_at DESC LIMIT ?`, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var profiles []*PersonProfile
	for rows.Next() {
		var (
			pid          string
			primaryName  string
			aliasesJSON  string
			sectionsJSON string
			version      int
			createdStr   string
			updatedStr   string
		)
		if err := rows.Scan(&pid, &primaryName, &aliasesJSON, &sectionsJSON, &version, &createdStr, &updatedStr); err != nil {
			logger.Sugar.Warnw("[PersonProfileStore] 扫描行失败", "error", err)
			continue
		}

		profiles = append(profiles, buildProfile(pid, primaryName, aliasesJSON, sectionsJSON, version, createdStr, updatedStr))
	}

	return profiles, nil
}

func (pps *PersonProfileStore) FindProfileByName(name string) (*PersonProfile, error) {
	if pps.db == nil {
		return nil, fmt.Errorf("数据库未初始化")
	}

	row := pps.db.QueryRow(
		`SELECT person_id, primary_name, aliases, sections, version, created_at, updated_at
		 FROM person_profiles
		 WHERE primary_name = ? COLLATE NOCASE
		 OR aliases LIKE ? COLLATE NOCASE
		 LIMIT 1`,
		strings.TrimSpace(name), "%"+strings.TrimSpace(name)+"%",
	)

	var (
		pid          string
		primaryName  string
		aliasesJSON  string
		sectionsJSON string
		version      int
		createdStr   string
		updatedStr   string
	)

	err := row.Scan(&pid, &primaryName, &aliasesJSON, &sectionsJSON, &version, &createdStr, &updatedStr)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return buildProfile(pid, primaryName, aliasesJSON, sectionsJSON, version, createdStr, updatedStr), nil
}

func (pps *PersonProfileStore) FormatProfileText(profile *PersonProfile) string {
	if profile == nil {
		return ""
	}

	var builder strings.Builder
	builder.WriteString("# 人物画像\n")
	fmt.Fprintf(&builder, "人物ID: %s\n", profile.PersonID)
	fmt.Fprintf(&builder, "主称呼: %s\n", profile.PrimaryName)

	aliasText := strings.Join(profile.Aliases, "、")
	if aliasText != "" {
		fmt.Fprintf(&builder, "别名: %s\n", aliasText)
	}

	sectionDefs := []struct {
		title string
		items []string
	}{
		{"身份设定", profile.Sections.IdentitySettings},
		{"关系设定", profile.Sections.RelationshipSettings},
		{"稳定了解", profile.Sections.StableFacts},
		{"相处偏好", profile.Sections.InteractionPreferences},
		{"近期互动", profile.Sections.RecentInteractions},
		{"不确定信息", profile.Sections.UncertainNotes},
	}

	for _, sec := range sectionDefs {
		fmt.Fprintf(&builder, "\n## %s\n", sec.title)
		if len(sec.items) == 0 {
			builder.WriteString("- 暂无\n")
		} else {
			for _, item := range sec.items {
				fmt.Fprintf(&builder, "- %s\n", item)
			}
		}
	}

	builder.WriteString("\n- 自动画像仅供内部参考；若与当前对话冲突，以当前对话为准。\n")

	return builder.String()
}

// FormatProfileForReply 生成用于回复提示词的自然语言画像描述
func (pps *PersonProfileStore) FormatProfileForReply(profile *PersonProfile) string {
	if profile == nil {
		return ""
	}

	var parts []string

	name := profile.PrimaryName
	if name == "" {
		name = profile.PersonID
	}

	if len(profile.Sections.IdentitySettings) > 0 {
		parts = append(parts, "你对"+name+"的了解："+strings.Join(profile.Sections.IdentitySettings, "；"))
	}

	if len(profile.Sections.RelationshipSettings) > 0 {
		parts = append(parts, "你们的关系："+strings.Join(profile.Sections.RelationshipSettings, "；"))
	}

	if len(profile.Sections.StableFacts) > 0 {
		parts = append(parts, "你知道关于"+name+"的事："+strings.Join(profile.Sections.StableFacts, "；"))
	}

	if len(profile.Sections.InteractionPreferences) > 0 {
		parts = append(parts, "和"+name+"相处的注意："+strings.Join(profile.Sections.InteractionPreferences, "；"))
	}

	if len(profile.Sections.RecentInteractions) > 0 {
		parts = append(parts, "最近："+strings.Join(profile.Sections.RecentInteractions, "；"))
	}

	if len(parts) == 0 {
		return ""
	}

	return strings.Join(parts, "\n")
}

func (pps *PersonProfileStore) ProfileCount() (int, error) {
	if pps.db == nil {
		return 0, fmt.Errorf("数据库未初始化")
	}

	var count int
	err := pps.db.QueryRow(`SELECT COUNT(*) FROM person_profiles`).Scan(&count)
	return count, err
}

type PersonProfileSyncer struct {
	llmProvider   llm.LLMProvider
	profileStore  *PersonProfileStore
	memoryManager *MemoryManager
	mu            sync.Mutex
}

func NewPersonProfileSyncer(llmProvider llm.LLMProvider, profileStore *PersonProfileStore, memoryManager *MemoryManager) *PersonProfileSyncer {
	return &PersonProfileSyncer{
		llmProvider:   llmProvider,
		profileStore:  profileStore,
		memoryManager: memoryManager,
	}
}

type profileSyncResult struct {
	IdentitySettings       []string `json:"identity_settings"`
	RelationshipSettings   []string `json:"relationship_settings"`
	StableFacts            []string `json:"stable_facts"`
	InteractionPreferences []string `json:"interaction_preferences"`
	RecentInteractions     []string `json:"recent_interactions"`
	UncertainNotes         []string `json:"uncertain_notes"`
}

func (ps *PersonProfileSyncer) SyncProfile(personID, primaryName string, aliases []string) error {
	if ps.llmProvider == nil || ps.profileStore == nil {
		return nil
	}

	existing, _ := ps.profileStore.GetProfile(personID)

	existingText := ""
	if existing != nil && existing.Version > 0 {
		existingText = ps.profileStore.FormatProfileText(existing)
		if len([]rune(existingText)) > 3000 {
			runes := []rune(existingText)
			existingText = string(runes[:3000])
		}
	}

	facts, err := ps.gatherFacts(personID, primaryName, aliases)
	if err != nil {
		logger.Sugar.Warnw("[PersonProfileSyncer] 收集事实失败", "error", err)
	}

	factsText := strings.Join(facts, "\n")
	if len([]rune(factsText)) > 4000 {
		runes := []rune(factsText)
		factsText = string(runes[:4000])
	}

	prompt := fmt.Sprintf(`请根据提供的人物事实，更新或创建人物画像。

人物ID: %s
主称呼: %s
别名: %s

=== 现有画像 ===
%s

=== 新增事实证据 ===
%s

请按以下分类整理画像，每个分类最多保留指定数量的条目：

- identity_settings（身份设定，最多4条）：角色、身份、职业等稳定身份信息
- relationship_settings（关系设定，最多4条）：与机器人的关系、对机器人的称呼等
- stable_facts（稳定了解，最多6条）：长期稳定的个人事实和信息
- interaction_preferences（相处偏好，最多5条）：用户表达过的互动偏好
- recent_interactions（近期互动，最多3条）：最近发生的值得记录的互动
- uncertain_notes（不确定信息，最多3条）：不确定或需要进一步确认的信息

规则：
1. 每条以简洁中文陈述句表达，用第三人称
2. 必须基于事实证据，不推测
3. 优先保留最新信息，旧信息可能已过时
4. 如果现有画像中某条信息与新事实矛盾，以新事实为准，旧信息移入 uncertain_notes
5. 不确定的信息放入 uncertain_notes
6. 【重要】含时间敏感词的事实（如"明天""下周""准备""正在""计划""即将""最近"）视为时效性信息，放入 recent_interactions 而非 stable_facts
7. 【重要】如果旧画像中的 stable_facts 条目包含时间敏感词且已超过一周未更新，应移入 uncertain_notes 或删除

严格输出 JSON：
{
  "identity_settings": ["..."],
  "relationship_settings": ["..."],
  "stable_facts": ["..."],
  "interaction_preferences": ["..."],
  "recent_interactions": ["..."],
  "uncertain_notes": ["..."]
}`, personID, primaryName, strings.Join(aliases, "、"), existingText, factsText)

	messages := []llm.ChatMessage{
		{Role: "user", Content: prompt},
	}

	response, err := ps.llmProvider.Chat(messages)
	if err != nil {
		return fmt.Errorf("LLM画像合成失败: %w", err)
	}

	result := ps.parseProfileResult(response)
	if result == nil {
		return fmt.Errorf("画像合成结果解析失败")
	}

	ps.mu.Lock()
	defer ps.mu.Unlock()

	profile := &PersonProfile{
		PersonID:    personID,
		PrimaryName: primaryName,
		Aliases:     aliases,
		Sections: PersonProfileSections{
			IdentitySettings:       result.IdentitySettings,
			RelationshipSettings:   result.RelationshipSettings,
			StableFacts:            result.StableFacts,
			InteractionPreferences: result.InteractionPreferences,
			RecentInteractions:     result.RecentInteractions,
			UncertainNotes:         result.UncertainNotes,
		},
		Version: 1,
	}
	if existing != nil {
		profile.Version = existing.Version + 1
	}

	if err := ps.profileStore.UpsertProfile(profile); err != nil {
		return fmt.Errorf("保存画像失败: %w", err)
	}

	logger.Sugar.Infow("[PersonProfileSyncer] 画像已更新", "name", primaryName, "version", profile.Version)
	return nil
}

func (ps *PersonProfileSyncer) gatherFacts(_, primaryName string, aliases []string) ([]string, error) {
	if ps.memoryManager == nil {
		return nil, nil
	}

	allNames := []string{primaryName}
	allNames = append(allNames, aliases...)

	var allFacts []string
	seen := make(map[string]bool)

	for _, name := range allNames {
		if name == "" {
			continue
		}

		result, err := ps.memoryManager.Query(MemoryQueryRequest{
			CurrentMessage: name,
			Limit:          20,
			SourceKinds:    []SourceKind{SourcePersonFact},
			SearchMode:     "keyword",
		})
		if err != nil {
			continue
		}

		for _, hit := range result.Hits {
			if hit.Fragment != nil && !seen[hit.Fragment.Content] {
				seen[hit.Fragment.Content] = true
				allFacts = append(allFacts, hit.Fragment.Content)
			}
		}
	}

	return allFacts, nil
}

func (ps *PersonProfileSyncer) parseProfileResult(response string) *profileSyncResult {
	response = strings.TrimSpace(response)

	start := strings.Index(response, "{")
	end := strings.LastIndex(response, "}")
	if start >= 0 && end > start {
		response = response[start : end+1]
	}

	var result profileSyncResult
	if err := json.Unmarshal([]byte(response), &result); err != nil {
		logger.Sugar.Warnw("[PersonProfileSyncer] JSON解析失败", "error", err, "response", response)
		return nil
	}

	return &result
}
