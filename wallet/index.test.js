const Wallet = require('./index');
const {verifySignature} = require('../util');
const Transaction = require('./transaction');
const Blockchain = require('../blockchain');
const { STARTING_BALANCE } = require('../config');

describe('Wallet', () => {
    
    let wallet;

    beforeEach(()=> {
        wallet = new Wallet();
    });

    it('Has a Balance', ()=> {
        expect(wallet).toHaveProperty('balance');
    });

    it('Has a PublicKey', ()=> {
        expect(wallet).toHaveProperty('publicKey');
    })

    describe('Signing Data', () => {
        const data = 'foobar';

        it('Verifies a signature', () => {
            expect(
                verifySignature({
                    publicKey: wallet.publicKey,
                    data,
                    signature: wallet.sign(data)
                })
            ).toBe(true);
        });

        it('Does not verify an invalid signature', ()=> {
            expect(
                verifySignature({
                    publicKey: wallet.publicKey,
                    data,
                    signature: new Wallet().sign(data)
                })
            ).toBe(false);
        })

    })
    
    describe('Create Transaction', () => {

        describe('And the Amount exceeds the balance', () => {
            it('Throws an error', ()=> {
                expect(()=> wallet.createTransaction({amount: 99999, recipient: 'foo-recipient'})).toThrow(`Amount exceeds balance`);
            })
        })
        
        describe('And the Amount is valid', () => {

            let transaction, amount, recipient;

            beforeEach(()=> {
                amount = 50;
                recipient = 'foo-recipient';
                transaction = wallet.createTransaction({amount, recipient});
            })
            
            it('Creates an Instance of Transaction', ()=> {
                expect(transaction instanceof Transaction).toBe(true);
            })

            it('Matches the transaction input with wallet', ()=> {
                expect(transaction.input.address).toEqual(wallet.publicKey);
            })

            it('Outputs the amount the recipient', ()=> {
                expect(transaction.outputMap[recipient]).toEqual(amount);
            })

        })

        describe('And the Chain is passed', () => {

            it('Calls Wallet CalculateBalance', ()=> {
                const calculateBalanceMock = jest.fn();
                const originalCalculateBalance = Wallet.calculateBalance;
                Wallet.calculateBalance = calculateBalanceMock;
                wallet.createTransaction({
                    recipient: 'foo',
                    amount: 10,
                    chain: new Blockchain().chain
                })
                expect(calculateBalanceMock).toHaveBeenCalled();
                Wallet.calculateBalance = originalCalculateBalance;
            })
        })
        
    })
    
    describe('Calculate Balance', () => {
        let blockchain;
        
        beforeEach(()=> {
            blockchain = new Blockchain();
        });

        describe('There are no outputs for the wallet', () => {
            it('Returns the Starting Balance', ()=> {
                expect(
                    Wallet.calculateBalance({
                        chain: blockchain.chain,
                        address: wallet.publicKey
                    })
                ).toEqual(STARTING_BALANCE);
            })
        })

        describe('There are outputs for the wallet', () => {
            let transactionOne, transactionTwo;

            beforeEach(()=> {
                transactionOne = new Wallet().createTransaction({
                    recipient: wallet.publicKey,
                    amount: 50
                })
                transactionTwo = new Wallet().createTransaction({
                    recipient: wallet.publicKey,
                    amount: 60
                })
                blockchain.addBlock({data: [transactionOne, transactionTwo]});
            })

            it('Adds the sum of all outputs to the wallet balance', ()=> {
                expect(
                    Wallet.calculateBalance({
                        chain: blockchain.chain,
                        address: wallet.publicKey
                    })
                ).toEqual(
                    STARTING_BALANCE + transactionOne.outputMap[wallet.publicKey] + transactionTwo.outputMap[wallet.publicKey]
                )
            })

            describe('Wallet has made a transaction', () => {
                
                let recentTransaction;

                beforeEach(()=> {
                    recentTransaction = wallet.createTransaction({
                        recipient: 'foo-address',
                        amount: 30
                    });

                    blockchain.addBlock({data: [recentTransaction]});
                })

                it('Returns the output amount of the recent transaction', ()=> {
                    expect(
                        Wallet.calculateBalance({
                            chain: blockchain.chain,
                            address: wallet.publicKey
                        })
                    ).toEqual(recentTransaction.outputMap[wallet.publicKey]);
                })

                describe('Outputs next to and after the recent transaction', () => {
                    let sameBlockTransaction, nextBlockTransaction;

                    beforeEach(()=> {
                        recentTransaction = wallet.createTransaction({
                            recipient: 'later-foo-address',
                            amount: 60
                        })
                        sameBlockTransaction = Transaction.rewardTransaction({minerWallet: wallet});
                        blockchain.addBlock({data: [recentTransaction, sameBlockTransaction]});
                        nextBlockTransaction = new Wallet().createTransaction({
                            recipient: wallet.publicKey, amount: 75
                        })
                        blockchain.addBlock({data: [nextBlockTransaction]})
                    })

                    it('Includes the output amounts in the returned balance', ()=>{
                        expect(
                            Wallet.calculateBalance({
                                chain: blockchain.chain,
                                address: wallet.publicKey
                            })
                        ).toEqual(
                            recentTransaction.outputMap[wallet.publicKey] +
                            sameBlockTransaction.outputMap[wallet.publicKey] + 
                            nextBlockTransaction.outputMap[wallet.publicKey]
                        )
                    })
                })
                

            })
            
        })
        
    })
    
})
