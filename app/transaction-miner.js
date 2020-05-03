class TransactionMiner {

    constructor({ blockchain, transactionPool, wallet, pubsub }){
        this.blockchain = blockchain;
        this.transactionPool = transactionPool;
        this.wallet = wallet;
        this.pubsub = pubsub;
    }

    mineTransaction(){

        // Generate The Transaction Pool's Valid Transactions

        // Generate The Miner's Reward

        // Add a block consisting of these Transactions To the Blockchain

        // Broadcast the Updated Blockchain

        // Clear the Transaction Pool
    }
}