package core

import (
	"bytes"
	"traecoin/crypto"
)

// TXOutput 表示交易输出。
// 普通交易：MarketID 为空，Outcome 为 -1。
// 市场创建：Outcome 为 -2，MarketID 指向新建市场。
// 份额持有：Outcome 为 0(YES) 或 1(NO)，MarketID 指向所属市场。
// 市场结算：Outcome >= 10（10=YES 胜，11=NO 胜），MarketID 指向已结算市场。
type TXOutput struct {
	Value         int64
	Ripemd160Hash []byte // 用户名
	MarketID      []byte // 所属市场ID，普通交易为空
	Outcome       int    // 结果索引，普通交易为-1，YES=0，NO=1，市场创建=-2，结算>=10
}

func (txOutput *TXOutput) Lock(address string) {
	publicKeyHash := crypto.Base58Decode([]byte(address))
	txOutput.Ripemd160Hash = publicKeyHash[1 : len(publicKeyHash)-4]

}

func NewTXOutput(value int64, address string) *TXOutput {
	txOutput := &TXOutput{Value: value, Outcome: -1}
	txOutput.Lock(address)
	return txOutput
}

// NewMarketShareOutput 创建一份预测市场份额输出。
func NewMarketShareOutput(value int64, address string, marketID []byte, outcome int) *TXOutput {
	txOutput := &TXOutput{Value: value, MarketID: marketID, Outcome: outcome}
	txOutput.Lock(address)
	return txOutput
}

// NewMarketCreationOutput 创建市场登记输出（零值，仅作链上锚点）。
func NewMarketCreationOutput(creator string, marketID []byte) *TXOutput {
	txOutput := &TXOutput{Value: 0, MarketID: marketID, Outcome: -2}
	txOutput.Lock(creator)
	return txOutput
}

// NewMarketResolutionOutput 创建市场结算输出（零值，记录结算结果）。
func NewMarketResolutionOutput(creator string, marketID []byte, result int) *TXOutput {
	txOutput := &TXOutput{Value: 0, MarketID: marketID, Outcome: 10 + result}
	txOutput.Lock(creator)
	return txOutput
}

func (txOutput *TXOutput) UnLockScriptPubKeyWithAddress(address string) bool {

	publicKeyHash := crypto.Base58Decode([]byte(address))
	hash160 := publicKeyHash[1 : len(publicKeyHash)-4]

	return bytes.Equal(txOutput.Ripemd160Hash, hash160)
}

// IsMarketShare 是否为市场份额输出（YES=0 / NO=1）。
func (txOutput *TXOutput) IsMarketShare() bool {
	return len(txOutput.MarketID) > 0 && (txOutput.Outcome == 0 || txOutput.Outcome == 1)
}

// IsMarketCreation 是否为市场创建锚点输出。
func (txOutput *TXOutput) IsMarketCreation() bool {
	return len(txOutput.MarketID) > 0 && txOutput.Outcome == -2
}

// IsMarketResolution 是否为市场结算输出。
func (txOutput *TXOutput) IsMarketResolution() bool {
	return len(txOutput.MarketID) > 0 && txOutput.Outcome >= 10
}
