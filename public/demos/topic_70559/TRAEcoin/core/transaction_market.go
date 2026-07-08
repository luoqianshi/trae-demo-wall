package core

import (
	"encoding/hex"
	"fmt"
	"sync"
	"traecoin/crypto"
)

// MarketMeta 缓存链上无法存储的市场元数据（问题描述、结果选项等）。
// 同一进程内有效；重启后需要从链上交易重建（demo 简化为内存缓存）。
var (
	marketMetaCache = make(map[string]*Market)
	marketMetaMu    sync.RWMutex
)

// RegisterMarket 将市场登记到内存缓存。
func RegisterMarket(market *Market) {
	marketMetaMu.Lock()
	defer marketMetaMu.Unlock()
	marketMetaCache[market.IDHex()] = market
}

// GetMarket 从缓存读取市场元数据。
func GetMarket(marketID []byte) (*Market, bool) {
	marketMetaMu.RLock()
	defer marketMetaMu.RUnlock()
	m, ok := marketMetaCache[hex.EncodeToString(marketID)]
	return m, ok
}

// AllMarkets 返回缓存中所有市场。
func AllMarkets() []*Market {
	marketMetaMu.RLock()
	defer marketMetaMu.RUnlock()
	list := make([]*Market, 0, len(marketMetaCache))
	for _, m := range marketMetaCache {
		list = append(list, m)
	}
	return list
}

// CreateMarketTransaction 创建市场登记交易。
// 交易结构：coinbase-like 输入（无需签名）+ 市场创建锚点输出（Value=0, Outcome=-2）。
func CreateMarketTransaction(question string, deadline int64, creator string, nodeID string) (*Transaction, *Market) {
	wallets, _ := crypto.NewWallets(nodeID)
	if _, ok := wallets.WalletsMap[creator]; !ok {
		panic(fmt.Sprintf("钱包不存在: %s", creator))
	}

	outcomes := []string{"YES", "NO"}
	market := NewMarket(question, outcomes, deadline, creator)

	txOutput := NewMarketCreationOutput(creator, market.MarketID)

	tx := &Transaction{
		TxHash: []byte{},
		Vins:   []*TXInput{{TxHash: []byte{}, Vout: -1, Signature: nil, PublicKey: []byte{}}},
		Vouts:  []*TXOutput{txOutput},
	}
	tx.HashTransaction()

	RegisterMarket(market)
	return tx, market
}

// BuySharesTransaction 创建买入份额交易。
// 买家消耗自身 UTXO，生成一份带 MarketID+Outcome 的份额输出 + 找零输出。
func BuySharesTransaction(from string, marketID []byte, outcome int, amount int64, utxoSet UTXOProvider, txs []*Transaction, nodeID string) *Transaction {
	if outcome != 0 && outcome != 1 {
		panic(fmt.Sprintf("outcome 必须是 0(YES) 或 1(NO)，当前为 %d", outcome))
	}
	if amount <= 0 {
		panic("买入数量必须大于 0")
	}

	wallets, _ := crypto.NewWallets(nodeID)
	wallet, ok := wallets.WalletsMap[from]
	if !ok {
		panic(fmt.Sprintf("钱包不存在: %s", from))
	}

	money, spendableUTXODic := utxoSet.FindSpendableUTXOs(from, amount, txs)

	var txInputs []*TXInput
	var txOutputs []*TXOutput

	for txHash, indexArray := range spendableUTXODic {
		txHashBytes, _ := hex.DecodeString(string(txHash))
		for _, index := range indexArray {
			txInput := &TXInput{txHashBytes, index, nil, wallet.PublicKey}
			txInputs = append(txInputs, txInput)
		}
	}

	// 份额输出（带 MarketID 和 Outcome）
	txOutputs = append(txOutputs, NewMarketShareOutput(amount, from, marketID, outcome))

	// 找零
	if money > amount {
		txOutputs = append(txOutputs, NewTXOutput(money-amount, from))
	}

	tx := &Transaction{[]byte{}, txInputs, txOutputs}
	utxoSet.SignTransaction(tx, wallet.PrivateKey, txs)
	tx.TxHash = tx.Hash()

	return tx
}

// ResolveMarketTransaction 创建市场结算交易。
// 仅市场创建者可发起；交易结构：coinbase-like 输入 + 结算锚点输出（Outcome=10+result）。
func ResolveMarketTransaction(creator string, marketID []byte, result int, nodeID string) *Transaction {
	market, ok := GetMarket(marketID)
	if !ok {
		panic(fmt.Sprintf("市场不存在: %s", hex.EncodeToString(marketID)))
	}
	if market.Creator != creator {
		panic("只有市场创建者可以结算市场")
	}
	if err := market.Resolve(result); err != nil {
		panic(err)
	}

	wallets, _ := crypto.NewWallets(nodeID)
	if _, ok := wallets.WalletsMap[creator]; !ok {
		panic(fmt.Sprintf("钱包不存在: %s", creator))
	}

	txOutput := NewMarketResolutionOutput(creator, market.MarketID, result)

	tx := &Transaction{
		TxHash: []byte{},
		Vins:   []*TXInput{{TxHash: []byte{}, Vout: -1, Signature: nil, PublicKey: []byte{}}},
		Vouts:  []*TXOutput{txOutput},
	}
	tx.HashTransaction()

	return tx
}
