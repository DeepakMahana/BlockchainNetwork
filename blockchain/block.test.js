const hexToBinary = require('hex-to-binary');
const Block = require('./block');
const { GENESIS_DATA, MINE_RATE } = require('../config');
const { cryptoHash } = require('../util');

describe('Block', ()=> {
    const timestamp = 2000;
    const lastHash = 'foo-last';
    const hash = 'last-hash';
    const data = 'foo-data';
    const nonce = 1;
    const difficulty = 1;
    const block = new Block({timestamp, lastHash, hash, data, nonce, difficulty});
    
    it('Has all the block elements', ()=> {
        expect(block.timestamp).toEqual(timestamp);
        expect(block.lastHash).toEqual(lastHash);
        expect(block.data).toEqual(data);
        expect(block.hash).toEqual(hash);
        expect(block.nonce).toEqual(nonce);
        expect(block.difficulty).toEqual(difficulty);
    });

    describe('genesis', () => {
        const genesisBlock = Block.genesis();

        it('returns a block instance', ()=> {
            expect(genesisBlock instanceof Block).toBe(true);
        });

        it('returns the genesis data', ()=> {
            expect(genesisBlock).toEqual(GENESIS_DATA);
        });
    })

    describe('mineBlock()', ()=> {
        const lastBlock = Block.genesis();
        const data = 'mined data';
        const minedBlock = Block.mineBlock({lastBlock, data});

        it('returns a block instance', ()=> {
            expect(minedBlock instanceof Block).toBe(true);
        });

        it('sets the `lastHash` to be the `hash` of the lastBlock', ()=>{
            expect(minedBlock.lastHash).toEqual(lastBlock.hash);
        })

        it('sets the data', ()=>{
            expect(minedBlock.data).toEqual(data);
        })

        it('sets a `timestamp`', ()=>{
            expect(minedBlock.timestamp).not.toEqual(undefined);
        })

        it('creates a SHA-256 `hash` beased on the proper inputs', ()=>{
            expect(minedBlock.hash)
            .toEqual(
                cryptoHash(
                    minedBlock.timestamp,
                    minedBlock.nonce,
                    minedBlock.difficulty, 
                    lastBlock.hash, 
                    data
                )
            );
        })

        it('Sets a `hash` that matches difficulty criteria', ()=>{
            expect(hexToBinary(minedBlock.hash).substring(0, minedBlock.difficulty))
                .toEqual('0'.repeat(minedBlock.difficulty));
        })

        it('Adjusts the difficulty', ()=>{
           const possibleResults = [lastBlock.difficulty+1, lastBlock.difficulty-1]
           expect(possibleResults.includes(minedBlock.difficulty)).toBe(true)
        })
    })

    describe('adjustDifficulty', () => {
       it('Raises the difficulty for a quickly mined block', ()=> {
            expect(Block.adjustDifficulty({
                originalBlock: block,
                timestamp: block.timestamp + MINE_RATE - 100
            })).toEqual(block.difficulty+1);
       }) 
       it('Lowers the difficulty for a quickly mined block', ()=> {
            expect(Block.adjustDifficulty({
                originalBlock: block,
                timestamp: block.timestamp + MINE_RATE + 100
            })).toEqual(block.difficulty-1);
       })
       it('Has a lower limit of 1', ()=> {
        block.difficulty = -1;
        expect(Block.adjustDifficulty({
            originalBlock: block
        })).toEqual(1);
   })
    })
    
    
})