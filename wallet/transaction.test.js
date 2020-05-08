const Transaction = require('./transaction');
const Wallet = require('./index');
const {verifySignature} = require('../util');
const { REWARD_INPUT, MINING_REWARD } = require('../config');

describe('Transaction', () => {
    let transaction, senderWallet, recipient, amount;

    beforeEach(()=> {
        senderWallet = new Wallet();
        recipient = 'recipient-public-key';
        amount = 50;
        transaction = new Transaction({senderWallet, recipient, amount});
    });

    it('Has an ID', ()=> {
        expect(transaction).toHaveProperty('id');
    })

    describe('OutPutMap', () => {

        it('Has an OutPutMap', ()=> {
            expect(transaction).toHaveProperty('outputMap');
        })

        it('Outputs the amount to the recipient', ()=> {
            expect(transaction.outputMap[recipient]).toEqual(amount);
        })

        it('Outputs the remaining balance for the senderwallet', ()=> {
            expect(transaction.outputMap[senderWallet.publicKey]).toEqual(senderWallet.balance - amount);
        })
    })

    describe('Input', () => {
        
        it('Has an Input', ()=> {
            expect(transaction).toHaveProperty('input');
        })

        it('Has a Timestamp in the input', ()=> {
            expect(transaction.input).toHaveProperty('timestamp');
        })

        it('Sets the amount to the SenderWallet Balance', ()=> {
            expect(transaction.input.amount).toEqual(senderWallet.balance);
        })

        it('Sets the address to the SenderWallet publickey', ()=> {
            expect(transaction.input.address).toEqual(senderWallet.publicKey);
        })

        it('Signs the input', ()=> {
            expect(
                verifySignature({
                    publicKey: senderWallet.publicKey,
                    data: transaction.outputMap,
                    signature: transaction.input.signature
                })
            ).toBe(true);
        })
    })

    describe('Valid Transaction', () => {

        let errorMock;

        beforeEach(()=> {
            errorMock = jest.fn();
            global.console.error = errorMock;
        })
        
        describe('When the transaction is valid', () => {
            it('Returns True', () => {
                expect(Transaction.validTransaction(transaction)).toBe(true);
            })
        });

        describe('When the transaction is invalid', () => {
            
            describe('And a transaction outputMap value is invalid', () => {
                it('Returns False and Logs an Error', ()=> {
                    transaction.outputMap[senderWallet.publicKey] = 999999;
                    expect(Transaction.validTransaction(transaction)).toBe(false);
                    expect(errorMock).toHaveBeenCalled();
                })
            })

            describe('And the transaction input signature is invalid', () => {
                it('Returns False and Logs an Error', ()=> {
                    transaction.input.signature = new Wallet().sign('data');
                    expect(Transaction.validTransaction(transaction)).toBe(false);
                    expect(errorMock).toHaveBeenCalled();
                })
            })
            
            
        })
        
        
    })
    
    describe('Update Transaction', ()=> {

        let originalSignature, originalSenderOutput, nextRecipient, nextAmount;

        describe('Amount is invalid', () => {
            
            it('Throws an Error', ()=> {
                expect(()=> {
                    transaction.update({
                        senderWallet,
                        recipient: 'foo',
                        amount: 999999
                    })
                }).toThrow('Amount Exceeds Balance');
            })
        })
        

        describe('Amount is valid', () => {

            beforeEach(()=> {
                originalSignature = transaction.input.signature;
                originalSenderOutput = transaction.outputMap[senderWallet.publicKey];
                nextRecipient = 'next-recipient';
                nextAmount = 50;
    
                transaction.update({
                    senderWallet,
                    recipient: nextRecipient,
                    amount: nextAmount
                })
            })
            

            it('Outputs the amount to the next recipient', ()=> {
                expect(transaction.outputMap[nextRecipient]).toEqual(nextAmount);
            })
    
            it('Subtracts the amount from the original sender output amount', ()=> {
                expect(transaction.outputMap[senderWallet.publicKey]).toEqual(originalSenderOutput - nextAmount);
            })
    
            it('Maintains a total output that matches the input amount', ()=>{
                expect(Object.values(transaction.outputMap).reduce((total, outputMap) => total + outputMap)).toEqual(transaction.input.amount);
            })
    
            it('Re-signs the Transaction', ()=>{
                expect(transaction.input.signature).not.toEqual(originalSignature);
            })

            describe('Another Update for the Same Recipient', () => {
                let addedAmount;

                beforeEach(()=> {
                    addedAmount = 80;
                    transaction.update({
                        senderWallet,
                        recipient: nextRecipient,
                        amount: addedAmount
                    })
                })

                it('Adds to the Recipient Amount', ()=> {
                    expect(transaction.outputMap[nextRecipient]).toEqual(nextAmount + addedAmount);
                })

                it('Subtracts the amount from the original sender output amount', ()=> {
                    expect(transaction.outputMap[senderWallet.publicKey]).toEqual(originalSenderOutput - nextAmount - addedAmount);
                })

            });
            
        })
       
    })
    
    describe('Reward Transaction', () => {
        
        let rewardTransaction, minerWallet;

        beforeEach(()=> {
            minerWallet = new Wallet();
            rewardTransaction = Transaction.rewardTransaction({minerWallet});
        })

        it('Creates a Transaction with the Reward Input', ()=> {
            expect(rewardTransaction.input).toEqual(REWARD_INPUT);
        })

        it('Creates ones transaction for the miner with the MINING_REWARD', ()=> {
            expect(rewardTransaction.outputMap[minerWallet.publicKey]).toEqual(MINING_REWARD);
        })

    })
    
})
