const Transaction = require('../wallet/transaction');

class TransactionMiner {

    constructor({ blockchain, transactionPool, wallet, pubsub }){
        this.blockchain = blockchain;
        this.transactionPool = transactionPool;
        this.wallet = wallet;
        this.pubsub = pubsub;
    }

    mineTransaction(){

        // Generate The Transaction Pool's Valid Transactions
        const validTransactions = this.transactionPool.validTransactions();

        // Generate The Miner's Reward
        validTransactions.push(
            Transaction.rewardTransaction({minerWallet: this.wallet})
        );

        // Add a block consisting of these Transactions To the Blockchain
        this.blockchain.addBlock({data: validTransactions});

        // Broadcast the Updated Blockchain
        this.pubsub.broadcastChain();

        // Clear the Transaction Pool
        this.transactionPool.clear();
    }
}

module.exports = TransactionMiner;