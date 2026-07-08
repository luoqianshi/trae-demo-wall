package node

import (
	"encoding/hex"
	"fmt"
	"traecoin/core"
	"traecoin/store"
	"traecoin/web"
)

// createMarket 创建预测市场并写入区块。
func (cli *CLI) createMarket(question string, deadline int64, creator string, nodeID string) {
	if !store.DBExists(nodeID) {
		fmt.Println("区块链数据库不存在，请先 createblockchain")
		return
	}

	tx, market := core.CreateMarketTransaction(question, deadline, creator, nodeID)

	blockchain := store.BlockchainObject(nodeID)
	defer blockchain.DB.Close()

	blockchain.AddBlocktoBlockchain([]*core.Transaction{tx})

	utxoSet := &store.UTXOSet{Blockchain: blockchain}
	utxoSet.ResetUTXOSet()

	fmt.Printf("市场创建成功！\n")
	fmt.Printf("  MarketID : %s\n", market.IDHex())
	fmt.Printf("  问题     : %s\n", market.Question)
	fmt.Printf("  选项     : %v\n", market.Outcomes)
	fmt.Printf("  截止时间 : %d\n", market.Deadline)
	fmt.Printf("  创建者   : %s\n", market.Creator)
}

// buyShares 买入市场份额。
func (cli *CLI) buyShares(from string, marketIDHex string, outcome int, amount int64, nodeID string) {
	if !store.DBExists(nodeID) {
		fmt.Println("区块链数据库不存在，请先 createblockchain")
		return
	}

	marketID, err := hex.DecodeString(marketIDHex)
	if err != nil {
		fmt.Println("市场ID格式错误（需要十六进制字符串）")
		return
	}

	if _, ok := core.GetMarket(marketID); !ok {
		fmt.Println("市场不存在（可能节点重启导致内存缓存丢失）")
		return
	}

	blockchain := store.BlockchainObject(nodeID)
	defer blockchain.DB.Close()
	utxoSet := &store.UTXOSet{Blockchain: blockchain}

	tx := core.BuySharesTransaction(from, marketID, outcome, amount, utxoSet, []*core.Transaction{}, nodeID)

	blockchain.AddBlocktoBlockchain([]*core.Transaction{tx})
	utxoSet.ResetUTXOSet()

	label := "YES"
	if outcome == 1 {
		label = "NO"
	}
	fmt.Printf("买入成功！\n")
	fmt.Printf("  买入者   : %s\n", from)
	fmt.Printf("  市场ID   : %s\n", marketIDHex)
	fmt.Printf("  选项     : %s\n", label)
	fmt.Printf("  数量     : %d\n", amount)
}

// resolveMarket 结算市场。
func (cli *CLI) resolveMarket(creator string, marketIDHex string, result int, nodeID string) {
	if !store.DBExists(nodeID) {
		fmt.Println("区块链数据库不存在，请先 createblockchain")
		return
	}

	marketID, err := hex.DecodeString(marketIDHex)
	if err != nil {
		fmt.Println("市场ID格式错误（需要十六进制字符串）")
		return
	}

	tx := core.ResolveMarketTransaction(creator, marketID, result, nodeID)

	blockchain := store.BlockchainObject(nodeID)
	defer blockchain.DB.Close()

	blockchain.AddBlocktoBlockchain([]*core.Transaction{tx})

	utxoSet := &store.UTXOSet{Blockchain: blockchain}
	utxoSet.ResetUTXOSet()

	label := "YES"
	if result == 1 {
		label = "NO"
	}
	fmt.Printf("市场结算成功！\n")
	fmt.Printf("  市场ID   : %s\n", marketIDHex)
	fmt.Printf("  获胜方   : %s\n", label)
}

// listMarkets 列出所有预测市场。
func (cli *CLI) listMarkets(nodeID string) {
	markets := core.AllMarkets()
	if len(markets) == 0 {
		fmt.Println("暂无预测市场")
		return
	}
	fmt.Printf("共 %d 个预测市场：\n", len(markets))
	for i, m := range markets {
		status := "进行中"
		if m.Resolved {
			status = "已结算(" + m.OutcomeLabel(m.Result) + ")"
		}
		fmt.Printf("[%d] ID=%s\n", i+1, m.IDHex())
		fmt.Printf("    问题    : %s\n", m.Question)
		fmt.Printf("    选项    : %v\n", m.Outcomes)
		fmt.Printf("    状态    : %s\n", status)
		fmt.Printf("    创建者  : %s\n", m.Creator)
		fmt.Println()
	}
}

// StartWebServer 启动 Web 服务器。
func (cli *CLI) StartWebServer(nodeID string, port string) {
	if !store.DBExists(nodeID) {
		fmt.Println("区块链数据库不存在，请先 createblockchain")
		return
	}
	server := web.NewServer(nodeID)
	server.Start(port)
}
