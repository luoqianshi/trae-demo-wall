package tongshadow

import (
	crand "crypto/rand"
	"crypto/sha256"
	"fmt"
	"math/rand"
	"strings"
	"time"

	"YaraFlow/internal/config"
	"YaraFlow/internal/llm"
	"YaraFlow/internal/logger"
	"YaraFlow/internal/memory"
)

// RecognizeResult 识别结果
type RecognizeResult struct {
	Matched            bool    `json:"matched"`
	Score              float32 `json:"score"`
	MatchedDescription string  `json:"matched_description"`
}

// Manager 瞳影管理器
type Manager struct {
	store    *Store
	vision   llm.VisionProvider
	embedder *memory.Embedder
	vecStore *memory.VectorStore
	cfg      config.TongShadowConfig
}

// DefaultManager 全局默认瞳影管理器
var DefaultManager *Manager

// InitManager 初始化瞳影管理器
func InitManager(vision llm.VisionProvider, embedder *memory.Embedder, cfg config.TongShadowConfig) (*Manager, error) {
	if !cfg.Enabled {
		logger.Sugar.Info("[瞳影] 模块未启用，跳过初始化")
		return nil, nil
	}

	var dim int
	if embedder != nil {
		dim = embedder.Dim()
	}

	mgr := &Manager{
		store:    NewStore(),
		vision:   vision,
		embedder: embedder,
		vecStore: memory.NewVectorStore(dim),
		cfg:      cfg,
	}

	DefaultManager = mgr
	logger.Sugar.Infow("[瞳影] 管理器初始化完成", "dim", dim)
	return mgr, nil
}

// LoadAll 从数据库加载所有自画像向量到内存 VectorStore
func (m *Manager) LoadAll() error {
	portraits, err := m.store.GetAll()
	if err != nil {
		return fmt.Errorf("[瞳影] 加载自画像失败: %w", err)
	}

	for _, p := range portraits {
		if len(p.Embedding) > 0 {
			if err := m.vecStore.Add(p.ID, p.Embedding); err != nil {
				logger.Sugar.Warnw("[瞳影] 加载向量失败", "id", p.ID, "error", err)
				continue
			}
		}
	}

	logger.Sugar.Infow("[瞳影] 自画像向量已加载", "count", len(portraits))
	return nil
}

// AddPortrait 添加自画像（完整摄入流程）
func (m *Manager) AddPortrait(imageData []byte, mimeType string) (*PortraitListItem, error) {
	// 1. 计算 SHA256 去重
	hash := fmt.Sprintf("%x", sha256.Sum256(imageData))

	existing, err := m.store.GetByHash(hash)
	if err != nil {
		return nil, fmt.Errorf("[瞳影] 检查重复失败: %w", err)
	}
	if existing != nil {
		return nil, fmt.Errorf("该图片已存在")
	}

	// 2. 数量上限检查
	count, err := m.store.Count()
	if err != nil {
		return nil, fmt.Errorf("[瞳影] 查询数量失败: %w", err)
	}
	if count >= m.cfg.MaxPortraits {
		return nil, fmt.Errorf("自画像数量已达上限（%d张）", m.cfg.MaxPortraits)
	}

	// 3. VLM 生成外貌描述
	describePrompt := m.cfg.DescribePrompt
	if describePrompt == "" {
		describePrompt = "请详细描述图中人物的外貌特征：发型、发色、瞳色、脸型、服装风格、配饰、体型、气质。忽略背景和环境。用中文简短回答。"
	}

	description, err := m.vision.DescribeImage(imageData, describePrompt)
	if err != nil {
		return nil, fmt.Errorf("外貌描述生成失败，请稍后重试: %w", err)
	}

	description = strings.TrimSpace(description)
	if description == "" {
		return nil, fmt.Errorf("外貌描述生成失败，VLM 返回空结果")
	}

	// 4. Embedding
	var embedding []float32
	if m.embedder != nil {
		embedding, err = m.embedder.Embed(description)
		if err != nil {
			logger.Sugar.Warnw("[瞳影] 生成嵌入失败，将存储不含向量的记录", "error", err)
			embedding = nil
		}
	}

	// 5. 写入数据库
	id := newID()
	now := time.Now()

	portrait := &Portrait{
		ID:          id,
		ImageData:   imageData,
		ImageHash:   hash,
		MimeType:    mimeType,
		Description: description,
		Embedding:   embedding,
		CreatedAt:   now,
	}

	if err := m.store.Add(portrait); err != nil {
		return nil, fmt.Errorf("[瞳影] 存储自画像失败: %w", err)
	}

	// 6. 加载向量到内存
	if len(embedding) > 0 {
		if err := m.vecStore.Add(id, embedding); err != nil {
			logger.Sugar.Warnw("[瞳影] 向量添加失败", "id", id, "error", err)
		}
	}

	logger.Sugar.Infow("[瞳影] 自画像已添加",
		"id", id,
		"hash", hash[:16],
		"description", truncate(description, 50),
	)

	return &PortraitListItem{
		ID:          id,
		ImageHash:   hash,
		MimeType:    mimeType,
		Description: description,
		CreatedAt:   now,
	}, nil
}

// DeletePortrait 删除自画像
func (m *Manager) DeletePortrait(id string) error {
	if err := m.store.Delete(id); err != nil {
		return err
	}

	m.vecStore.Remove(id)
	logger.Sugar.Infow("[瞳影] 自画像已删除", "id", id)
	return nil
}

// ListPortraits 列出所有自画像（不含原始图片和向量）
func (m *Manager) ListPortraits() ([]*PortraitListItem, error) {
	return m.store.List()
}

// GetImageData 获取图片数据
func (m *Manager) GetImageData(id string) ([]byte, string, error) {
	return m.store.GetImageData(id)
}

// Recognize 识别图片是否为瞳瞳自己（通过图片原始数据）
// 返回 nil 表示无自画像记录或识别失败，调用方应跳过
func (m *Manager) Recognize(imageData []byte) *RecognizeResult {
	if m.vecStore.Len() == 0 {
		return nil
	}

	// 1. VLM 描述
	describePrompt := m.cfg.DescribePrompt
	if describePrompt == "" {
		describePrompt = "请详细描述图中人物的外貌特征。用中文简短回答。"
	}

	description, err := m.vision.DescribeImage(imageData, describePrompt)
	if err != nil {
		logger.Sugar.Warnw("[瞳影] 识别失败：VLM 描述出错", "error", err)
		return nil
	}

	return m.recognizeByDescription(description)
}

// RecognizeByDescription 通过已有的外貌描述文本识别（避免重复 VLM 调用）
// 当管线中已有 Vision 分析结果时，直接使用描述文本进行匹配
func (m *Manager) RecognizeByDescription(description string) *RecognizeResult {
	if m.vecStore.Len() == 0 {
		return nil
	}

	description = strings.TrimSpace(description)
	if description == "" {
		return nil
	}

	return m.recognizeByDescription(description)
}

// recognizeByDescription 核心识别逻辑：描述 → 嵌入 → 向量搜索
func (m *Manager) recognizeByDescription(description string) *RecognizeResult {

	description = strings.TrimSpace(description)
	if description == "" {
		return nil
	}

	// 2. Embedding
	if m.embedder == nil {
		return nil
	}

	queryVec, err := m.embedder.Embed(description)
	if err != nil {
		logger.Sugar.Warnw("[瞳影] 识别失败：嵌入出错", "error", err)
		return nil
	}

	// 3. 向量搜索
	results := m.vecStore.Search(queryVec, 1)
	if len(results) == 0 {
		return nil
	}

	top := results[0]
	matched := top.Score >= float32(m.cfg.SimilarityThreshold)

	result := &RecognizeResult{
		Matched: matched,
		Score:   top.Score,
	}

	// 4. 获取匹配的描述
	if matched {
		portrait, err := m.store.GetByID(top.ID)
		if err == nil && portrait != nil {
			result.MatchedDescription = portrait.Description
		}
	}

	logger.Sugar.Infow("[瞳影] 识别完成",
		"matched", matched,
		"score", top.Score,
		"threshold", m.cfg.SimilarityThreshold,
	)

	return result
}

// GetSelfDescription 获取自我认知描述（随机选择一条自画像描述）
// 用于注入 LLM 系统提示，让瞳瞳能回答关于自己外貌的问题
func (m *Manager) GetSelfDescription() string {
	if !m.cfg.InjectSelfDescription {
		return ""
	}

	portraits, err := m.store.GetAll()
	if err != nil || len(portraits) == 0 {
		return ""
	}

	// 随机选择一条描述
	idx := rand.Intn(len(portraits))
	return "你的外貌特征：" + portraits[idx].Description
}

func truncate(s string, maxLen int) string {
	runes := []rune(s)
	if len(runes) <= maxLen {
		return s
	}
	return string(runes[:maxLen]) + "..."
}

func newID() string {
	b := make([]byte, 16)
	crand.Read(b)
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:16])
}
