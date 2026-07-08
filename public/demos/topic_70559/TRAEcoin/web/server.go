package web

import (
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"traecoin/core"
	"traecoin/crypto"
	"traecoin/store"
)

// Server 预测市场 Web 服务器。
type Server struct {
	nodeID string
}

// NewServer 创建 Web 服务器实例。
func NewServer(nodeID string) *Server {
	return &Server{nodeID: nodeID}
}

// Start 启动 HTTP 服务。
func (s *Server) Start(port string) {
	http.HandleFunc("/", s.serveHome)
	http.HandleFunc("/api/wallet/create", s.handleCreateWallet)
	http.HandleFunc("/api/wallet/list", s.handleListWallets)
	http.HandleFunc("/api/balance", s.handleBalance)
	http.HandleFunc("/api/markets", s.handleMarkets)
	http.HandleFunc("/api/market/create", s.handleCreateMarket)
	http.HandleFunc("/api/market/buy", s.handleBuyShares)
	http.HandleFunc("/api/market/resolve", s.handleResolveMarket)

	fmt.Printf("TRAEcoin 预测市场 Web 服务器启动在 http://localhost:%s\n", port)
	fmt.Printf("节点ID: %s\n", s.nodeID)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		panic(err)
	}
}

func (s *Server) serveHome(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Write([]byte(indexHTML))
}

func (s *Server) handleCreateWallet(w http.ResponseWriter, r *http.Request) {
	wallets, _ := crypto.NewWallets(s.nodeID)
	wallet := crypto.NewWallet()
	address := string(wallet.GetAddress())
	wallets.WalletsMap[address] = wallet
	wallets.SaveWallets(s.nodeID)

	s.jsonResponse(w, map[string]string{"address": address})
}

func (s *Server) handleListWallets(w http.ResponseWriter, r *http.Request) {
	wallets, _ := crypto.NewWallets(s.nodeID)
	addresses := make([]string, 0, len(wallets.WalletsMap))
	for addr := range wallets.WalletsMap {
		addresses = append(addresses, addr)
	}
	s.jsonResponse(w, map[string]interface{}{"addresses": addresses})
}

func (s *Server) handleBalance(w http.ResponseWriter, r *http.Request) {
	address := r.URL.Query().Get("address")
	if address == "" {
		s.jsonError(w, "缺少 address 参数", http.StatusBadRequest)
		return
	}

	if !store.DBExists(s.nodeID) {
		s.jsonError(w, "区块链未初始化", http.StatusBadRequest)
		return
	}

	blockchain := store.BlockchainObject(s.nodeID)
	defer blockchain.DB.Close()
	utxoSet := &store.UTXOSet{Blockchain: blockchain}
	balance := utxoSet.GetBalance(address)

	s.jsonResponse(w, map[string]interface{}{"address": address, "balance": balance})
}

func (s *Server) handleMarkets(w http.ResponseWriter, r *http.Request) {
	markets := core.AllMarkets()
	list := make([]map[string]interface{}, 0, len(markets))
	for _, m := range markets {
		item := map[string]interface{}{
			"id":       m.IDHex(),
			"question": m.Question,
			"outcomes": m.Outcomes,
			"deadline": m.Deadline,
			"resolved": m.Resolved,
			"result":   m.Result,
			"creator":  m.Creator,
		}
		if m.Resolved {
			item["resultLabel"] = m.OutcomeLabel(m.Result)
		}
		list = append(list, item)
	}
	s.jsonResponse(w, map[string]interface{}{"markets": list})
}

type createMarketReq struct {
	Question string `json:"question"`
	Deadline int64  `json:"deadline"`
	Creator  string `json:"creator"`
}

func (s *Server) handleCreateMarket(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		s.jsonError(w, "仅支持 POST", http.StatusMethodNotAllowed)
		return
	}
	var req createMarketReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.jsonError(w, "请求体解析失败: "+err.Error(), http.StatusBadRequest)
		return
	}
	if req.Question == "" || req.Deadline == 0 || req.Creator == "" {
		s.jsonError(w, "question/deadline/creator 不能为空", http.StatusBadRequest)
		return
	}
	if !store.DBExists(s.nodeID) {
		s.jsonError(w, "区块链未初始化", http.StatusBadRequest)
		return
	}

	tx, market := core.CreateMarketTransaction(req.Question, req.Deadline, req.Creator, s.nodeID)

	blockchain := store.BlockchainObject(s.nodeID)
	defer blockchain.DB.Close()
	blockchain.AddBlocktoBlockchain([]*core.Transaction{tx})
	utxoSet := &store.UTXOSet{Blockchain: blockchain}
	utxoSet.ResetUTXOSet()

	s.jsonResponse(w, map[string]interface{}{
		"marketID": market.IDHex(),
		"question": market.Question,
		"outcomes": market.Outcomes,
		"deadline": market.Deadline,
		"creator":  market.Creator,
	})
}

type buySharesReq struct {
	From     string `json:"from"`
	MarketID string `json:"marketID"`
	Outcome  int    `json:"outcome"`
	Amount   int64  `json:"amount"`
}

func (s *Server) handleBuyShares(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		s.jsonError(w, "仅支持 POST", http.StatusMethodNotAllowed)
		return
	}
	var req buySharesReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.jsonError(w, "请求体解析失败: "+err.Error(), http.StatusBadRequest)
		return
	}
	if req.From == "" || req.MarketID == "" || req.Amount <= 0 {
		s.jsonError(w, "from/marketID/amount 参数无效", http.StatusBadRequest)
		return
	}
	if req.Outcome != 0 && req.Outcome != 1 {
		s.jsonError(w, "outcome 必须是 0(YES) 或 1(NO)", http.StatusBadRequest)
		return
	}
	if !store.DBExists(s.nodeID) {
		s.jsonError(w, "区块链未初始化", http.StatusBadRequest)
		return
	}

	marketID, err := hex.DecodeString(req.MarketID)
	if err != nil {
		s.jsonError(w, "marketID 格式错误", http.StatusBadRequest)
		return
	}
	if _, ok := core.GetMarket(marketID); !ok {
		s.jsonError(w, "市场不存在", http.StatusBadRequest)
		return
	}

	blockchain := store.BlockchainObject(s.nodeID)
	defer blockchain.DB.Close()
	utxoSet := &store.UTXOSet{Blockchain: blockchain}

	tx := core.BuySharesTransaction(req.From, marketID, req.Outcome, req.Amount, utxoSet, []*core.Transaction{}, s.nodeID)

	blockchain.AddBlocktoBlockchain([]*core.Transaction{tx})
	utxoSet.ResetUTXOSet()

	label := "YES"
	if req.Outcome == 1 {
		label = "NO"
	}
	s.jsonResponse(w, map[string]interface{}{
		"from":     req.From,
		"marketID": req.MarketID,
		"outcome":  label,
		"amount":   req.Amount,
	})
}

type resolveMarketReq struct {
	Creator  string `json:"creator"`
	MarketID string `json:"marketID"`
	Result   int    `json:"result"`
}

func (s *Server) handleResolveMarket(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		s.jsonError(w, "仅支持 POST", http.StatusMethodNotAllowed)
		return
	}
	var req resolveMarketReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.jsonError(w, "请求体解析失败: "+err.Error(), http.StatusBadRequest)
		return
	}
	if req.Creator == "" || req.MarketID == "" {
		s.jsonError(w, "creator/marketID 不能为空", http.StatusBadRequest)
		return
	}
	if req.Result != 0 && req.Result != 1 {
		s.jsonError(w, "result 必须是 0(YES) 或 1(NO)", http.StatusBadRequest)
		return
	}
	if !store.DBExists(s.nodeID) {
		s.jsonError(w, "区块链未初始化", http.StatusBadRequest)
		return
	}

	marketID, err := hex.DecodeString(req.MarketID)
	if err != nil {
		s.jsonError(w, "marketID 格式错误", http.StatusBadRequest)
		return
	}

	tx := core.ResolveMarketTransaction(req.Creator, marketID, req.Result, s.nodeID)

	blockchain := store.BlockchainObject(s.nodeID)
	defer blockchain.DB.Close()
	blockchain.AddBlocktoBlockchain([]*core.Transaction{tx})
	utxoSet := &store.UTXOSet{Blockchain: blockchain}
	utxoSet.ResetUTXOSet()

	label := "YES"
	if req.Result == 1 {
		label = "NO"
	}
	s.jsonResponse(w, map[string]interface{}{
		"marketID":    req.MarketID,
		"winnerLabel": label,
	})
}

func (s *Server) jsonResponse(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	json.NewEncoder(w).Encode(data)
}

func (s *Server) jsonError(w http.ResponseWriter, msg string, code int) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(map[string]string{"error": msg})
}
