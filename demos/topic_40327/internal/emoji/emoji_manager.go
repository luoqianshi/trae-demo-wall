package emoji

import (
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"fmt"
	"math/rand"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"sync"
	"time"

	"YaraFlow/internal/config"
	"YaraFlow/internal/llm"
	"YaraFlow/internal/logger"
	"YaraFlow/internal/storage"
)

type EmojiInfo struct {
	Hash         string
	FileName     string
	FullPath     string
	Description  string
	Emotions     []string
	QueryCount   int
	LastUsedAt   time.Time
	CreatedAt    time.Time
	RegisterTime time.Time
	IsRegistered bool
	IsBanned     bool
}

type EmojiManager struct {
	config        *config.Config
	db            *sql.DB
	emojis        []*EmojiInfo
	vlmProvider   llm.VisionProvider
	inboxDir      string
	registeredDir string
	mu            sync.RWMutex
}

var DefaultEmojiManager *EmojiManager

const (
	maxKeepDays  = 30
	minKeepCount = 20
)

func NewEmojiManager(cfg *config.Config, vlmProvider llm.VisionProvider) (*EmojiManager, error) {
	inboxDir := filepath.Join(".", "data", "emoji")
	registeredDir := filepath.Join(inboxDir, "registered")

	if err := os.MkdirAll(inboxDir, 0755); err != nil {
		return nil, fmt.Errorf("创建表情包目录失败: %w", err)
	}
	if err := os.MkdirAll(registeredDir, 0755); err != nil {
		return nil, fmt.Errorf("创建已注册表情包目录失败: %w", err)
	}

	db := storage.GetDB()
	if db == nil {
		return nil, fmt.Errorf("数据库未初始化")
	}

	if err := initDatabase(db); err != nil {
		return nil, fmt.Errorf("初始化表情包数据库失败: %w", err)
	}

	manager := &EmojiManager{
		config:        cfg,
		db:            db,
		inboxDir:      inboxDir,
		registeredDir: registeredDir,
		vlmProvider:   vlmProvider,
	}

	manager.loadAndCheckIntegrity()

	DefaultEmojiManager = manager
	return manager, nil
}

func initDatabase(db *sql.DB) error {
	createTableSQL := `
	CREATE TABLE IF NOT EXISTS emojis (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		hash TEXT UNIQUE NOT NULL,
		file_name TEXT NOT NULL,
		full_path TEXT NOT NULL,
		description TEXT,
		query_count INTEGER DEFAULT 0,
		last_used_at DATETIME,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		is_registered BOOLEAN DEFAULT FALSE,
		is_banned BOOLEAN DEFAULT FALSE,
		register_time DATETIME
	);
	`
	_, err := db.Exec(createTableSQL)
	if err != nil {
		return err
	}

	if err := migrateEmojiTable(db); err != nil {
		return err
	}

	db.Exec(`CREATE INDEX IF NOT EXISTS idx_hash ON emojis(hash)`)
	db.Exec(`CREATE INDEX IF NOT EXISTS idx_registered ON emojis(is_registered)`)
	db.Exec(`CREATE INDEX IF NOT EXISTS idx_created ON emojis(created_at)`)

	return nil
}

func migrateEmojiTable(db *sql.DB) error {
	rows, err := db.Query(`PRAGMA table_info(emojis)`)
	if err != nil {
		return err
	}
	defer rows.Close()

	columnNames := map[string]bool{}
	for rows.Next() {
		var cid int
		var name, colType string
		var notNull, pk int
		var dfltValue any
		if scanErr := rows.Scan(&cid, &name, &colType, &notNull, &dfltValue, &pk); scanErr != nil {
			continue
		}
		columnNames[name] = true
	}

	needsSourceURLMigrate := columnNames["source_url"]
	needsRegisterTime := !columnNames["register_time"]

	if !needsSourceURLMigrate && !needsRegisterTime {
		return nil
	}

	if needsSourceURLMigrate {
		logger.Info("检测到旧版数据库格式，正在迁移移除 source_url 列...")
		_, err = db.Exec(`
			CREATE TABLE emojis_new (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				hash TEXT UNIQUE NOT NULL,
				file_name TEXT NOT NULL,
				full_path TEXT NOT NULL,
				description TEXT,
				query_count INTEGER DEFAULT 0,
				last_used_at DATETIME,
				created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
				is_registered BOOLEAN DEFAULT FALSE,
				is_banned BOOLEAN DEFAULT FALSE,
				register_time DATETIME
			);
			INSERT INTO emojis_new (id, hash, file_name, full_path, description, query_count, last_used_at, created_at, is_registered, is_banned)
				SELECT id, hash, file_name, full_path, description, query_count, last_used_at, created_at, is_registered, is_banned FROM emojis;
			DROP TABLE emojis;
			ALTER TABLE emojis_new RENAME TO emojis;
		`)
		if err != nil {
			return fmt.Errorf("迁移表情包表失败: %w", err)
		}
	}

	if needsRegisterTime && !needsSourceURLMigrate {
		logger.Info("正在添加 register_time 列...")
		_, err = db.Exec(`ALTER TABLE emojis ADD COLUMN register_time DATETIME`)
		if err != nil {
			return fmt.Errorf("添加 register_time 列失败: %w", err)
		}
		logger.Info("register_time 列已添加")
	}

	return nil
}

func (m *EmojiManager) loadAndCheckIntegrity() {
	rows, err := m.db.Query(`
		SELECT hash, file_name, full_path, description, query_count,
			COALESCE(last_used_at, '') as last_used_at,
			COALESCE(created_at, '') as created_at,
			is_registered, is_banned,
			COALESCE(register_time, '') as register_time
		FROM emojis 
		WHERE is_banned = 0
		ORDER BY register_time DESC
	`)
	if err != nil {
		logger.Sugar.Warnw("[完整性检查] 查询数据库失败", "error", err)
		return
	}
	defer rows.Close()

	newEmojis := make([]*EmojiInfo, 0)
	var staleHashes []string
	type pathUpdate struct {
		hash, newPath, newFileName string
	}
	var pathUpdates []pathUpdate

	for rows.Next() {
		var emoji EmojiInfo
		var lastUsedAt, createdAt, registerTime string
		err := rows.Scan(
			&emoji.Hash, &emoji.FileName, &emoji.FullPath, &emoji.Description,
			&emoji.QueryCount, &lastUsedAt, &createdAt,
			&emoji.IsRegistered, &emoji.IsBanned, &registerTime,
		)
		if err != nil {
			logger.Sugar.Warnw("扫描表情包记录失败", "error", err)
			continue
		}

		emoji.LastUsedAt, _ = time.Parse(time.RFC3339, lastUsedAt)
		emoji.CreatedAt, _ = time.Parse(time.RFC3339, createdAt)
		emoji.RegisterTime, _ = time.Parse(time.RFC3339, registerTime)
		emoji.Emotions = parseEmotions(emoji.Description)

		if _, err := os.Stat(emoji.FullPath); err == nil {
			if emoji.IsRegistered {
				newEmojis = append(newEmojis, &emoji)
			}
		} else {
			registeredPath := filepath.Join(m.registeredDir, emoji.FileName)
			inboxPath := filepath.Join(m.inboxDir, emoji.FileName)
			found := false

			if _, err := os.Stat(registeredPath); err == nil {
				emoji.FullPath = registeredPath
				pathUpdates = append(pathUpdates, pathUpdate{hash: emoji.Hash, newPath: registeredPath, newFileName: emoji.FileName})
				found = true
			} else if _, err := os.Stat(inboxPath); err == nil {
				emoji.FullPath = inboxPath
				pathUpdates = append(pathUpdates, pathUpdate{hash: emoji.Hash, newPath: inboxPath, newFileName: emoji.FileName})
				found = true
			}

			if found && emoji.IsRegistered {
				newEmojis = append(newEmojis, &emoji)
			} else if !found {
				staleHashes = append(staleHashes, emoji.Hash)
				logger.Sugar.Warnw("已注册表情包文件缺失，删除数据库记录", "hash", emoji.Hash[:8])
			}
		}
	}

	for _, u := range pathUpdates {
		m.db.Exec(`UPDATE emojis SET full_path = ?, file_name = ? WHERE hash = ?`,
			u.newPath, u.newFileName, u.hash)
	}
	if len(pathUpdates) > 0 {
		logger.Sugar.Infow("[完整性检查] 更新了记录的文件路径", "count", len(pathUpdates))
	}

	for _, hash := range staleHashes {
		m.db.Exec(`DELETE FROM emojis WHERE hash = ?`, hash)
	}
	if len(staleHashes) > 0 {
		logger.Sugar.Infow("[完整性检查] 清理了文件缺失的记录", "count", len(staleHashes))
	}

	m.mu.Lock()
	m.emojis = newEmojis
	m.mu.Unlock()

	logger.Sugar.Infow("[完整性检查] 完成", "count", len(newEmojis))
}

func parseEmotions(description string) []string {
	if description == "" {
		return []string{}
	}

	pattern := regexp.MustCompile(`[,，、;；\s]+`)
	parts := pattern.Split(description, -1)

	var emotions []string
	seen := make(map[string]bool)
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part != "" && !seen[strings.ToLower(part)] {
			emotions = append(emotions, part)
			seen[strings.ToLower(part)] = true
		}
	}
	return emotions
}

func CalculateHash(data []byte) string {
	hash := sha256.Sum256(data)
	return hex.EncodeToString(hash[:])
}

func (m *EmojiManager) SaveReceivedEmoji(imageData []byte) error {
	if !m.config.Emoji.StealEmoji {
		return nil
	}

	hash := CalculateHash(imageData)

	if m.isEmojiKnown(hash) {
		return nil
	}

	fileName := fmt.Sprintf("%s.png", hash)
	fullPath := filepath.Join(m.inboxDir, fileName)

	if err := os.WriteFile(fullPath, imageData, 0644); err != nil {
		return fmt.Errorf("写入收件箱失败: %w", err)
	}

	now := time.Now().Format(time.RFC3339)
	_, err := m.db.Exec(`
		INSERT OR IGNORE INTO emojis (hash, file_name, full_path, description, created_at, is_registered, is_banned, register_time)
		VALUES (?, ?, ?, ?, ?, 0, 0, NULL)
	`, hash, fileName, fullPath, "", now)

	if err != nil {
		os.Remove(fullPath)
		return fmt.Errorf("写入数据库记录失败: %w", err)
	}

	logger.Sugar.Infow("表情包已收入收件箱", "hash", hash[:8], "bytes", len(imageData))
	return nil
}

func (m *EmojiManager) findEmojiInDB(hash string) *EmojiInfo {
	m.mu.RLock()
	for _, emoji := range m.emojis {
		if emoji.Hash == hash {
			m.mu.RUnlock()
			return emoji
		}
	}
	m.mu.RUnlock()

	row := m.db.QueryRow(`
		SELECT hash, file_name, full_path, description, query_count,
			COALESCE(last_used_at, '') as last_used_at,
			COALESCE(created_at, '') as created_at,
			is_registered, is_banned,
			COALESCE(register_time, '') as register_time
		FROM emojis WHERE hash = ?
	`, hash)

	var emoji EmojiInfo
	var lastUsedAt, createdAt, registerTime string
	err := row.Scan(
		&emoji.Hash, &emoji.FileName, &emoji.FullPath, &emoji.Description,
		&emoji.QueryCount, &lastUsedAt, &createdAt,
		&emoji.IsRegistered, &emoji.IsBanned, &registerTime,
	)
	if err != nil {
		return nil
	}

	emoji.LastUsedAt, _ = time.Parse(time.RFC3339, lastUsedAt)
	emoji.CreatedAt, _ = time.Parse(time.RFC3339, createdAt)
	emoji.RegisterTime, _ = time.Parse(time.RFC3339, registerTime)
	emoji.Emotions = parseEmotions(emoji.Description)

	return &emoji
}

func (m *EmojiManager) isEmojiKnown(hash string) bool {
	m.mu.RLock()
	for _, emoji := range m.emojis {
		if emoji.Hash == hash {
			m.mu.RUnlock()
			return true
		}
	}
	m.mu.RUnlock()

	var count int
	row := m.db.QueryRow(`SELECT COUNT(*) FROM emojis WHERE hash = ?`, hash)
	if err := row.Scan(&count); err != nil {
		return false
	}
	return count > 0
}

func (m *EmojiManager) GetEmojiByEmotion(emotion string) *EmojiInfo {
	return m.GetEmojiByEmotionAndContext(emotion, "")
}

// GetEmojiByEmotionAndContext 根据情绪和语境联合匹配表情包
// 同时匹配情绪标签和语境标签（如"回应""安慰""撒娇"等）的表情包得分更高
func (m *EmojiManager) GetEmojiByEmotionAndContext(emotion, context string) *EmojiInfo {
	m.mu.RLock()
	defer m.mu.RUnlock()

	if len(m.emojis) == 0 {
		return nil
	}

	var candidates []*EmojiInfo
	emotionLower := strings.ToLower(emotion)
	contextLower := strings.ToLower(context)

	for _, emoji := range m.emojis {
		for _, e := range emoji.Emotions {
			lowerE := strings.ToLower(e)
			if strings.Contains(lowerE, emotionLower) ||
				strings.Contains(emotionLower, lowerE) {
				candidates = append(candidates, emoji)
				break
			}
		}
	}

	if len(candidates) == 0 {
		return nil
	}

	if len(candidates) == 1 {
		m.updateEmojiUsageUnsafe(candidates[0].Hash)
		return candidates[0]
	}

	// 根据情绪+语境标签综合评分，语境匹配的表情包获得额外加分
	type scoredEmoji struct {
		emoji *EmojiInfo
		score int
	}
	var scoredCandidates []scoredEmoji
	for _, emoji := range candidates {
		score := calculateSimilarity(emotionLower, emoji.Emotions)
		// 语境标签匹配加分（力度略低于情绪匹配）
		if contextLower != "" {
			ctxScore := calculateSimilarity(contextLower, emoji.Emotions)
			score += ctxScore * 2 // 语境得分权重为情绪得分的2倍
		}
		scoredCandidates = append(scoredCandidates, scoredEmoji{emoji: emoji, score: score})
	}

	// 取最高分，相同分数随机选
	sort.Slice(scoredCandidates, func(i, j int) bool {
		return scoredCandidates[i].score > scoredCandidates[j].score
	})

	maxScore := scoredCandidates[0].score
	var bestCandidates []*EmojiInfo
	for _, sc := range scoredCandidates {
		if sc.score == maxScore {
			bestCandidates = append(bestCandidates, sc.emoji)
		} else {
			break
		}
	}

	selected := bestCandidates[rand.Intn(len(bestCandidates))]
	m.updateEmojiUsageUnsafe(selected.Hash)
	return selected
}

func calculateSimilarity(target string, emotions []string) int {
	score := 0
	for _, e := range emotions {
		lowerE := strings.ToLower(e)
		if lowerE == target {
			score += 5
		} else if strings.Contains(lowerE, target) || strings.Contains(target, lowerE) {
			score += 3
		} else {
			commonChars := 0
			for _, c := range target {
				if strings.ContainsRune(lowerE, c) {
					commonChars++
				}
			}
			if commonChars > 0 {
				score += commonChars
			}
		}
	}
	return score
}

func (m *EmojiManager) updateEmojiUsageUnsafe(hash string) {
	m.db.Exec(`
		UPDATE emojis SET query_count = query_count + 1, last_used_at = ? WHERE hash = ?
	`, time.Now().Format(time.RFC3339), hash)

	for _, emoji := range m.emojis {
		if emoji.Hash == hash {
			emoji.QueryCount++
			emoji.LastUsedAt = time.Now()
			break
		}
	}
}

func (m *EmojiManager) GetEmojiCount() int {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return len(m.emojis)
}

// GetEmojiByHash 根据 hash 查找表情包（返回完整信息含文件路径）
func (m *EmojiManager) GetEmojiByHash(hash string) *EmojiInfo {
	m.mu.RLock()
	defer m.mu.RUnlock()
	for _, e := range m.emojis {
		if e.Hash == hash {
			return e
		}
	}
	return nil
}

func (m *EmojiManager) QueryEmojiByHash(hash string) (string, bool) {
	if emoji := m.findEmojiInDB(hash); emoji != nil && emoji.IsRegistered && emoji.Description != "" && emoji.Description != "未标记" {
		return emoji.Description, true
	}
	return "", false
}

func (m *EmojiManager) EmojiExists(hash string) bool {
	return m.findEmojiInDB(hash) != nil
}

func (m *EmojiManager) GetAllEmojis() []*EmojiInfo {
	m.mu.RLock()
	defer m.mu.RUnlock()
	result := make([]*EmojiInfo, len(m.emojis))
	copy(result, m.emojis)
	return result
}

func (m *EmojiManager) GetRandomEmoji() *EmojiInfo {
	m.mu.RLock()
	defer m.mu.RUnlock()
	if len(m.emojis) == 0 {
		return nil
	}
	idx := rand.Intn(len(m.emojis))
	emoji := m.emojis[idx]
	m.db.Exec(`
		UPDATE emojis SET query_count = query_count + 1, last_used_at = ? WHERE hash = ?
	`, time.Now().Format(time.RFC3339), emoji.Hash)
	emoji.QueryCount++
	emoji.LastUsedAt = time.Now()
	return emoji
}

// DeleteEmoji 删除指定 hash 的表情包（清理文件 + 数据库 + 内存缓存）
func (m *EmojiManager) DeleteEmoji(hash string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	// 1. 删除数据库记录
	_, err := m.db.Exec(`DELETE FROM emojis WHERE hash = ?`, hash)
	if err != nil {
		return fmt.Errorf("删除数据库记录失败: %w", err)
	}

	// 2. 删除文件（inbox 和 registered 两个目录都尝试）
	inboxPath := filepath.Join(m.inboxDir, hash+".*")
	regPath := filepath.Join(m.registeredDir, hash+".*")

	for _, pattern := range []string{inboxPath, regPath} {
		matches, _ := filepath.Glob(pattern)
		for _, match := range matches {
			os.Remove(match)
		}
	}

	// 3. 从内存缓存移除
	newEmojis := make([]*EmojiInfo, 0, len(m.emojis))
	for _, e := range m.emojis {
		if e.Hash != hash {
			newEmojis = append(newEmojis, e)
		}
	}
	m.emojis = newEmojis

	logger.Sugar.Infow("[表情包删除] 已清理", "hash", hash[:8])
	return nil
}

// CleanupAll 运行完整清理：完整性检查 + 孤儿文件清理 + 旧表情淘汰
func (m *EmojiManager) CleanupAll() {
	m.loadAndCheckIntegrity()
	m.cleanupOrphanedInbox()
	m.cleanupOldEmojis()
}

func (m *EmojiManager) Close() error {
	return nil
}

func (m *EmojiManager) PeriodicEmojiMaintenance() {
	if !m.config.Emoji.StealEmoji {
		logger.Debug("[偷表情包] 偷表情包功能已关闭，跳过维护")
		return
	}

	logger.Info("[偷表情包] 开始定期维护...")

	m.loadAndCheckIntegrity()

	m.cleanupOrphanedInbox()

	m.stealEmojisFromInbox(1)

	m.cleanupOldEmojis()

	m.loadAndCheckIntegrity()

	logger.Info("[偷表情包] 定期维护完成")
}

func (m *EmojiManager) cleanupOrphanedInbox() {
	entries, err := os.ReadDir(m.inboxDir)
	if err != nil {
		logger.Sugar.Warnw("[偷表情包] 读取收件箱失败", "error", err)
		return
	}

	safeThreshold := time.Now().Add(-5 * time.Minute)

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		name := entry.Name()
		fullPath := filepath.Join(m.inboxDir, name)

		info, err := entry.Info()
		if err != nil {
			continue
		}

		if info.ModTime().After(safeThreshold) {
			continue
		}

		hashFromName := strings.TrimSuffix(name, filepath.Ext(name))
		if hashFromName == "" {
			continue
		}

		var isRegistered int
		row := m.db.QueryRow(`SELECT is_registered FROM emojis WHERE hash = ? LIMIT 1`, hashFromName)
		if err := row.Scan(&isRegistered); err == nil && isRegistered == 1 {
			logger.Sugar.Infow("[偷表情包] 清理已注册残留文件", "hash", hashFromName[:8])
			os.Remove(fullPath)
		}
	}
}

func (m *EmojiManager) cleanupOldEmojis() {
	m.mu.RLock()
	registeredCount := len(m.emojis)
	m.mu.RUnlock()

	if registeredCount <= minKeepCount {
		return
	}

	cutoff := time.Now().AddDate(0, 0, -maxKeepDays)

	type agedEmoji struct {
		hash       string
		filePath   string
		lastUsed   time.Time
		queryCount int
	}

	var toRemove []agedEmoji

	m.mu.RLock()
	for _, e := range m.emojis {
		if e.QueryCount > 0 {
			continue
		}

		lastActive := e.LastUsedAt
		if lastActive.IsZero() {
			lastActive = e.RegisterTime
		}
		if lastActive.IsZero() {
			lastActive = e.CreatedAt
		}

		if lastActive.Before(cutoff) {
			toRemove = append(toRemove, agedEmoji{
				hash:       e.Hash,
				filePath:   e.FullPath,
				lastUsed:   lastActive,
				queryCount: e.QueryCount,
			})
		}
	}
	m.mu.RUnlock()

	sort.Slice(toRemove, func(i, j int) bool {
		return toRemove[i].lastUsed.Before(toRemove[j].lastUsed)
	})

	canRemove := registeredCount - minKeepCount
	if canRemove <= 0 {
		return
	}
	if len(toRemove) > canRemove {
		toRemove = toRemove[:canRemove]
	}

	removed := 0
	for _, item := range toRemove {
		m.db.Exec(`UPDATE emojis SET is_registered = 0, register_time = NULL WHERE hash = ?`, item.hash)

		if item.filePath != "" {
			if absPath, err := filepath.Abs(item.filePath); err == nil {
				if strings.HasPrefix(absPath, m.registeredDir) {
					os.Remove(item.filePath)
				}
			}
		}

		m.mu.Lock()
		for i, e := range m.emojis {
			if e.Hash == item.hash {
				m.emojis = append(m.emojis[:i], m.emojis[i+1:]...)
				break
			}
		}
		m.mu.Unlock()

		removed++
	}

	if removed > 0 {
		logger.Sugar.Infow("[清理] 淘汰了超过天数未使用的表情包", "removed", removed, "maxKeepDays", maxKeepDays, "remaining", len(m.emojis))
	}
}

func (m *EmojiManager) stealEmojisFromInbox(_ int) {
	if !m.config.Emoji.StealEmoji {
		return
	}

	m.mu.RLock()
	currentCount := len(m.emojis)
	m.mu.RUnlock()

	maxRegNum := m.config.Emoji.MaxRegNum
	if maxRegNum <= 0 {
		maxRegNum = 100
	}

	if currentCount >= maxRegNum && !m.config.Emoji.DoReplace {
		return
	}

	fileEntries, err := os.ReadDir(m.inboxDir)
	if err != nil {
		logger.Sugar.Warnw("[偷表情包] 读取收件箱失败", "error", err)
		return
	}

	type imageFile struct {
		path     string
		fileName string
	}

	var images []imageFile
	for _, entry := range fileEntries {
		if entry.IsDir() {
			continue
		}
		name := entry.Name()
		ext := strings.ToLower(filepath.Ext(name))
		if ext != ".png" && ext != ".jpg" && ext != ".jpeg" && ext != ".gif" {
			continue
		}
		images = append(images, imageFile{
			path:     filepath.Join(m.inboxDir, name),
			fileName: name,
		})
	}

	if len(images) == 0 {
		logger.Info("[偷表情包] 收件箱中没有图片文件")
		return
	}

	picked := images[rand.Intn(len(images))]
	logger.Sugar.Infow("[偷表情包] 随机选中", "fileName", picked.fileName)

	data, err := os.ReadFile(picked.path)
	if err != nil {
		logger.Sugar.Warnw("[偷表情包] 读取文件失败，本次不偷取", "error", err)
		return
	}

	hash := CalculateHash(data)

	var isRegistered int
	row := m.db.QueryRow(`SELECT is_registered FROM emojis WHERE hash = ? LIMIT 1`, hash)
	err = row.Scan(&isRegistered)
	if err == nil && isRegistered == 1 {
		logger.Sugar.Infow("[偷表情包] 已注册，清理残留文件", "hash", hash[:8])
		os.Remove(picked.path)
		return
	}

	fileNameHash := strings.TrimSuffix(picked.fileName, filepath.Ext(picked.fileName))
	if fileNameHash != "" && fileNameHash != hash {
		row := m.db.QueryRow(`SELECT is_registered FROM emojis WHERE hash = ? LIMIT 1`, fileNameHash)
		if err := row.Scan(&isRegistered); err == nil && isRegistered == 1 {
			logger.Sugar.Infow("[偷表情包] 已注册(文件名匹配)，清理残留文件", "hash", fileNameHash[:8])
			os.Remove(picked.path)
			return
		}
	}

	m.mu.RLock()
	currentCount = len(m.emojis)
	m.mu.RUnlock()

	if currentCount >= maxRegNum {
		if !m.config.Emoji.DoReplace {
			logger.Sugar.Infow("[偷表情包] 库已满且未开启替换，本次不偷取", "current", currentCount, "max", maxRegNum)
			return
		}
		m.replaceEmojiByLeastUsed(hash, picked.fileName, picked.path)
		return
	}

	if err := m.registerEmoji(hash, picked.fileName, picked.path); err != nil {
		logger.Sugar.Warnw("[偷表情包] 注册失败，本次不偷取", "hash", hash[:8], "error", err)
		return
	}

	logger.Sugar.Infow("[偷表情包] 本轮完成，成功偷取 1 个")
}

func (m *EmojiManager) registerEmoji(hash, fileName, inboxPath string) error {
	if _, err := os.Stat(inboxPath); os.IsNotExist(err) {
		return fmt.Errorf("表情包文件不存在")
	}

	var existingDesc string
	var existingRegistered int
	row := m.db.QueryRow(`SELECT COALESCE(description, ''), is_registered FROM emojis WHERE hash = ?`, hash)
	if err := row.Scan(&existingDesc, &existingRegistered); err == nil {
		if existingRegistered == 1 && existingDesc != "" && existingDesc != "未标记" {
			logger.Sugar.Infow("[偷表情包] 已注册，跳过", "hash", hash[:8], "description", existingDesc)
			os.Remove(inboxPath)
			return nil
		}
	}

	hasVLM := m.vlmProvider != nil
	needsVLM := m.config.Emoji.AutoTag && hasVLM
	needsFilter := m.config.Emoji.ContentFiltration && hasVLM

	var description string

	if needsVLM || needsFilter {
		data, err := os.ReadFile(inboxPath)
		if err != nil {
			logger.Sugar.Warnw("读取文件失败，使用默认描述", "error", err)
		} else {
			if needsVLM {
				desc, err := m.vlmProvider.DescribeImage(data,
					"这是一个表情包图片。请提取标签，最多8个，用逗号分隔。\n"+
						"情绪标签（如开心、无奈、生气、尴尬、得意、委屈、惊讶）：\n"+
						"语境标签（如回应、敷衍、阴阳怪气、撒娇、嘲讽、鼓励、安慰、庆祝、反问、卖萌）：\n"+
						"返回纯文本标签列表，不要解释，不要输出其他内容。")
				if err != nil {
					logger.Sugar.Warnw("VLM标签生成失败，使用默认描述", "error", err)
				} else {
					description = strings.TrimSpace(desc)
				}
			}

			if needsFilter {
				ok, err := m.vlmProvider.DescribeImage(data,
					"请判断这个表情包是否包含不良内容（色情、暴力、政治敏感等），只回答\"是\"或\"否\"。")
				if err != nil {
					logger.Sugar.Warnw("内容审核调用失败，继续注册", "error", err)
				} else if strings.Contains(strings.TrimSpace(ok), "是") {
					m.db.Exec(`UPDATE emojis SET is_banned = 1 WHERE hash = ?`, hash)
					os.Remove(inboxPath)
					return fmt.Errorf("内容审核不通过，已封禁")
				}
			}
		}
	}

	if description == "" {
		description = "未标记"
	}

	now := time.Now().Format(time.RFC3339)
	registeredPath := filepath.Join(m.registeredDir, fileName)

	if err := os.Rename(inboxPath, registeredPath); err != nil {
		copyData, readErr := os.ReadFile(inboxPath)
		if readErr != nil {
			return fmt.Errorf("无法移动文件到已注册目录: %w", err)
		}
		if writeErr := os.WriteFile(registeredPath, copyData, 0644); writeErr != nil {
			return fmt.Errorf("无法写入已注册目录: %w", writeErr)
		}
		os.Remove(inboxPath)
	}

	_, err := m.db.Exec(`
		INSERT INTO emojis (hash, file_name, full_path, description, created_at, is_registered, is_banned, register_time)
		VALUES (?, ?, ?, ?, ?, 1, 0, ?)
		ON CONFLICT(hash) DO UPDATE SET
			file_name = excluded.file_name,
			full_path = excluded.full_path,
			description = excluded.description,
			is_registered = 1,
			is_banned = 0,
			register_time = excluded.register_time
		WHERE emojis.is_registered = 0 OR emojis.description IS NULL OR emojis.description = '' OR emojis.description = '未标记'
	`, hash, fileName, registeredPath, description, now, now)

	if err != nil {
		return fmt.Errorf("写入数据库失败: %w", err)
	}

	logger.Sugar.Infow("[偷表情包] 成功注册", "hash", hash[:8], "description", description)
	return nil
}

func (m *EmojiManager) replaceEmojiByLeastUsed(hash, fileName, inboxPath string) {
	m.mu.RLock()
	if len(m.emojis) == 0 {
		m.mu.RUnlock()
		return
	}

	type candidate struct {
		info  *EmojiInfo
		score float64
	}
	var candidates []candidate
	now := time.Now()

	for _, e := range m.emojis {
		ageScore := 0.0
		if !e.LastUsedAt.IsZero() {
			ageScore = now.Sub(e.LastUsedAt).Hours() / 24.0
		} else if !e.RegisterTime.IsZero() {
			ageScore = now.Sub(e.RegisterTime).Hours() / 24.0
		} else {
			ageScore = 365.0
		}

		useScore := 1.0 / (float64(e.QueryCount) + 1.0)

		score := ageScore*0.7 + useScore*10.0
		candidates = append(candidates, candidate{info: e, score: score})
	}
	m.mu.RUnlock()

	sort.Slice(candidates, func(i, j int) bool {
		return candidates[i].score > candidates[j].score
	})

	leastUsed := candidates[0].info
	leastUsedHash := leastUsed.Hash
	leastUsedInfo := fmt.Sprintf("%s (使用%d次, 最后使用:%s)", leastUsedHash[:8], leastUsed.QueryCount, leastUsed.LastUsedAt.Format("01-02 15:04"))

	logger.Sugar.Infow("[偷表情包] 库已满，尝试替换最少使用的表情包", "info", leastUsedInfo)

	if err := m.registerEmoji(hash, fileName, inboxPath); err != nil {
		logger.Sugar.Warnw("[偷表情包] 注册新表情包失败，取消替换", "error", err)
		return
	}

	oldPath := leastUsed.FullPath
	m.db.Exec(`UPDATE emojis SET is_registered = 0, register_time = NULL WHERE hash = ?`, leastUsedHash)

	if oldPath != "" {
		if absPath, err := filepath.Abs(oldPath); err == nil {
			if strings.HasPrefix(absPath, m.registeredDir) {
				os.Remove(oldPath)
			}
		}
	}

	m.mu.Lock()
	for i, e := range m.emojis {
		if e.Hash == leastUsedHash {
			m.emojis = append(m.emojis[:i], m.emojis[i+1:]...)
			break
		}
	}
	m.mu.Unlock()

	logger.Sugar.Infow("[偷表情包] 已替换", "oldHash", leastUsedHash[:8])
}
