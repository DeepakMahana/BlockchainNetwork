const TransactionPool = require('./transaction-pool');
const Transaction = require('./transaction');
const Wallet = require('./index');

describe('TransactionPool', () => {
    let transactionPool, transaction, senderWallet;

    beforeEach(()=> {
        transactionPool = new TransactionPool();
        senderWallet = new Wallet();
        transaction = new Transaction({
            senderWallet,
            recipient: 'fake-recipient',
            amount: 50
        })
    })

    describe('Set Transaction', () => {
        it('Adds a Transaction', ()=> {
            transactionPool.setTransaction(transaction);
            expect(transactionPool.transactionMap[transaction.id]).toBe(transaction);
        })
    })

    describe('Existing Transaction', () => {
        it('Returns an Existing Transaction Given an Input Address', ()=>{
            transactionPool.setTransaction(transaction);
            expect(transactionPool.existingTransaction({inputAddress: senderWallet.publicKey})).toBe(transaction);
        })
    })
    
    
})
