package node

import "traecoin/store"

func (cli *CLI) printchain(nodeID string) {
	blockchain := store.BlockchainObject(nodeID)
	defer blockchain.DB.Close()
	blockchain.Printchain()
}
