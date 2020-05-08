const TransactionPool = require('./transaction-pool');
const Transaction = require('./transaction');
const Wallet = require('./index');
const Blockchain = require('../blockchain');

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

    describe('Valid Transactions', () => {
        let validTransactions, errorMock;

        beforeEach(()=> {
            validTransactions = [];
            errorMock = jest.fn();
            global.console.error = errorMock;

            // Generate Dummy Transactions and tamper them
            for(let i=0; i<10; i++){
                transaction = new Transaction({
                    senderWallet,
                    recipient: 'any-recipient',
                    amount: 30
                });

                if(i%3===0){
                    transaction.input.amount = 999999;
                } else if(i%3===1){
                    transaction.input.signature = new Wallet().sign('foo');
                } else{
                    validTransactions.push(transaction)
                }

                transactionPool.setTransaction(transaction);
            }

        })

        it('Returns Valid Transaction', ()=> {
            expect(transactionPool.validTransactions()).toEqual(validTransactions);
        })

        it('It Logs Errors for the Invalid Transactions', ()=> {
            transactionPool.validTransactions();
            expect(errorMock).toHaveBeenCalled();
        })
    })
    
    describe('Clear Transactions', () => {

        it('Clears the Transactions', ()=> {
            transactionPool.clear();
            expect(transactionPool.transactionMap).toEqual({});
        })
        
    })

    describe('Clear Blockchain Transactions', () => {
        it('Clears the pool of any exisiting blockchain transactions', ()=> {
            const blockchain = new Blockchain();
            const expectedTransactionMap = {};

            for(let i=0; i<6; i++){
                const transaction = new Wallet().createTransaction({
                    recipient: 'foo',
                    amount: 20
                });
                transactionPool.setTransaction(transaction);
                if(i%2===0){
                    blockchain.addBlock({data: [transaction]})
                }else{
                    expectedTransactionMap[transaction.id] = transaction;
                }
            }

            transactionPool.clearBlockchainTransactions({ chain: blockchain.chain });
            expect(transactionPool.transactionMap).toEqual(expectedTransactionMap);
        })
    })
    
    
    
})
