const Transaction = require('./transaction');
const Wallet = require('./index');
const {verifySignature} = require('../util');

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
    
})
