package node

import "traecoin/store"

func (cli *CLI) createGenesisBlockchain(address string, nodeID string) {
	blockchain := store.CreateBlockchainWithGenesisBlock(address, nodeID)
	defer blockchain.DB.Close()

	utxoSet := &store.UTXOSet{Blockchain: blockchain}
	utxoSet.ResetUTXOSet()
}
