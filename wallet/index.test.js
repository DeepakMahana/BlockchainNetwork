const Wallet = require('./index');
const {verifySignature} = require('../util');
const Transaction = require('./transaction');

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
        
    })
    
})
