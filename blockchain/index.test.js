const cryptoHash = require('../util/crypto-hash');
const Blockchain = require('.');
const Block =  require('./block');

describe('Blockchain', () => {
    let blockchain, newChain;

    beforeEach(()=> {
        blockchain = new Blockchain();
        newChain = new Blockchain();
        originalChain = blockchain.chain;
    })

    it('contains a `chain` Array instance', ()=> {
        expect(blockchain.chain instanceof Array).toBe(true);
    })

    it('starts with the genesis block', ()=> {
        expect(blockchain.chain[0]).toEqual(Block.genesis());
    })

    it('adds a new block to the chain', ()=> {
        const newData = 'foo bar';
        blockchain.addBlock({data: newData});
        expect(blockchain.chain[blockchain.chain.length-1].data).toEqual(newData);
    })

    
    describe('isValidChain', () => {

        describe('Check whether the chain starts with the genesis block', () => {
            it('returns false', ()=>{
                blockchain.chain[0] = {data: 'fake-genesis'};
                expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
            })
        })

        describe('When the chain starts with the genesis block and has multiple blocks', () => {

            beforeEach(()=> {
                blockchain.addBlock({data: 'Bears'});
                blockchain.addBlock({data: 'Bulls'});
                blockchain.addBlock({data: 'Doji'});
            })

            describe('And a lastHash reference has changed', () => {
                it('returns false', ()=> {  
                    blockchain.chain[2].lastHash = 'broken-lastHash';
                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
                })
            })

            describe('And the chain contains a block with an invalid field', () => {
                it('returns false', ()=> {
                    blockchain.chain[2].data = 'bad-data';
                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
                })
            })

            describe('And the chain contains a block with jumped difficulty', () => {
                it('returns false', ()=> {
                    const lastBlock = blockchain.chain[blockchain.chain.length - 1];
                    const lastHash = lastBlock.hash;
                    const timestamp = Date.now();
                    const nonce = 0;
                    const data = [];
                    const difficulty = lastBlock.difficulty - 3;
                    const hash = cryptoHash(timestamp, lastHash, difficulty, nonce, data);
                    const badBlock = new Block({timestamp, lastHash, hash, nonce, difficulty, data});
                    blockchain.chain.push(badBlock);
                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(false);
                })
            })

            describe('And the chain does not contain any invalid blocks', () => {
                it('returns true', ()=> {
                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(true);
                })
            })
              
        })
        
    })

    describe('replaceChain', () => {

        let errorMock, logMock;

        beforeEach(() => {
            errorMock = jest.fn();
            logMock = jest.fn();
            global.console.error = errorMock;
            global.console.log = logMock;
        })

        describe('When the new chain is no longer', () => {

            beforeEach(()=> {
                newChain.chain[0] = { new: 'chain'};
                blockchain.replaceChain(newChain.chain);
            })

            it('Does not replace the chain', ()=> {
                expect(blockchain.chain).toEqual(originalChain);
            })
            it('Logs an error', ()=> {
                expect(errorMock).toHaveBeenCalled();
            })
        })
        
    })

    describe('When the chain is longer', () => {

        beforeEach(()=> {
            blockchain.addBlock({data: 'Bears'});
            blockchain.addBlock({data: 'Bulls'});
            blockchain.addBlock({data: 'Doji'});
        })

        describe('And the chain is invalid', () => {
            it('Does not Replace the chain', () => {
                newChain.chain[0].hash = 'some-fake-hash';
                blockchain.replaceChain(newChain.chain);
                expect(blockchain.chain).toEqual(originalChain);
            })
        })

        describe('And the chain is valid', () => {
            it('Replaces the chain', () => {
                blockchain.replaceChain(newChain.chain);
                expect(blockchain.chain).toEqual(originalChain);
            });
        })
        
        
    })

    
})
