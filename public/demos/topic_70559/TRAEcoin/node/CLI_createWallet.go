package node

import (
	"fmt"
	"traecoin/crypto"
)

func (cli *CLI) CreateWallet(nodeID string) {
	wallets, _ := crypto.NewWallets(nodeID)
	wallets.CreateNewWallet(nodeID)
	fmt.Println(len(wallets.WalletsMap))
}
