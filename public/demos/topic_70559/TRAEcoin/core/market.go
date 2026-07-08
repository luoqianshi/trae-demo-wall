package core

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"
)

// Market 表示一个二元预测市场（YES / NO）。
type Market struct {
	MarketID []byte   // 市场唯一标识
	Question string   // 问题描述
	Outcomes []string // 结果选项，二元市场固定为 ["YES","NO"]
	Deadline int64    // 截止时间戳（秒）
	Resolved bool     // 是否已结算
	Result   int      // 最终结果索引：-1 未结算，0=YES，1=NO
	Creator  string   // 创建者地址
}

// NewMarket 创建一个新市场并计算其 MarketID。
func NewMarket(question string, outcomes []string, deadline int64, creator string) *Market {
	market := &Market{
		Question: question,
		Outcomes: outcomes,
		Deadline: deadline,
		Resolved: false,
		Result:   -1,
		Creator:  creator,
	}
	market.MarketID = market.computeID()
	return market
}

// computeID 由问题、创建者、截止时间生成市场ID。
func (m *Market) computeID() []byte {
	seed := fmt.Sprintf("%s|%s|%d|%d", m.Question, m.Creator, m.Deadline, time.Now().UnixNano())
	hash := sha256.Sum256([]byte(seed))
	return hash[:]
}

// IsExpired 市场是否已过期。
func (m *Market) IsExpired() bool {
	return time.Now().Unix() > m.Deadline
}

// Resolve 结算市场，仅允许在创建后调用，结果只能是 0 或 1。
func (m *Market) Resolve(result int) error {
	if m.Resolved {
		return fmt.Errorf("市场 %s 已结算", hex.EncodeToString(m.MarketID))
	}
	if result != 0 && result != 1 {
		return fmt.Errorf("结果索引必须是 0(YES) 或 1(NO)，当前为 %d", result)
	}
	m.Resolved = true
	m.Result = result
	return nil
}

// IsYES YES 是否获胜。
func (m *Market) IsYES() bool {
	return m.Resolved && m.Result == 0
}

// IsNO NO 是否获胜。
func (m *Market) IsNO() bool {
	return m.Resolved && m.Result == 1
}

// OutcomeLabel 根据索引返回结果文本。
func (m *Market) OutcomeLabel(idx int) string {
	if idx < 0 || idx >= len(m.Outcomes) {
		return "未知"
	}
	return m.Outcomes[idx]
}

// IDHex 返回十六进制市场ID，便于日志与前端展示。
func (m *Market) IDHex() string {
	return hex.EncodeToString(m.MarketID)
}
