const Wallet = require('./index');
const {verifySignature} = require('../util');

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
    
})
