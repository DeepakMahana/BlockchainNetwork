const bodyParser = require('body-parser');
const express = require('express');
const request = require('request');
const path = require('path');
const Blockchain = require('./blockchain');
const TransactionPool = require('./wallet/transaction-pool');
const Wallet = require('./wallet');
const PubSub = require('./app/pubsub');
const TransactionMiner = require('./app/transaction-miner');

/** Set Env Configs */

const isDevelopment = process.env.ENV === 'development';
const REDIS_URL = isDevelopment ?
  'redis://127.0.0.1:6379' :
  'redis://h:p05f9a274bd0e2414e52cb9516f8cbcead154d7d61502d32d9750180836a7cc05@ec2-34-225-229-4.compute-1.amazonaws.com:19289'
const DEFAULT_PORT = 3000;
const ROOT_NODE_ADDRESS = `http:localhost:${DEFAULT_PORT}`;

/** Initialize Classes */

const app = express();
const blockchain = new Blockchain();
const transactionPool = new TransactionPool();
const wallet = new Wallet();
const pubsub = new PubSub({blockchain, transactionPool, redisUrl: REDIS_URL});
const transactionMiner = new TransactionMiner({blockchain, transactionPool, wallet, pubsub});

// BodyParser for JSON data
app.use(bodyParser.json())

// Include Static Frontend Files
app.use(express.static(path.join(__dirname, 'client/dist')));

/** Routes */

app.get('/api/blocks', (req, res)=> {
    res.json(blockchain.chain);
})

app.get('/api/blocks/length', (req, res) => {
    res.json(blockchain.chain.length);
})

app.get('/api/blocks/:id', (req, res) => {
    const { id } = req.params;
    const { length } = blockchain.chain;
    const blocksReversed = blockchain.chain.slice().reverse();
    let startIndex = (id-1) * 5;
    let endIndex = id * 5;
    startIndex = startIndex < length ? startIndex : length;
    endIndex = endIndex < length ? endIndex : length;
    res.json(blocksReversed.slice(startIndex, endIndex));
})

app.post('/api/mine', (req, res) => {
    const {data} = req.body;
    blockchain.addBlock({data});
    pubsub.broadcastChain();
    res.redirect('/api/blocks');
})

app.post('/api/transact', (req, res) => {
    const {amount, recipient} = req.body;
    let transaction = transactionPool.existingTransaction({inputAddress: wallet.publicKey});

    try{
        if(transaction){
            transaction.update({senderWallet: wallet, recipient, amount});
        }else{
            transaction = wallet.createTransaction({recipient, amount, chain: blockchain.chain});
        }
        
    }catch(error){
        return res.status(400).json({type: 'error', message: error.message});
    }
    
    transactionPool.setTransaction(transaction);
    pubsub.broadcastTransaction(transaction);
    res.json({type: 'sucess', transaction});
})

app.get('/api/transaction-pool-map', (req, res) => {
    res.json(transactionPool.transactionMap);
})

app.get('/api/mine-transactions', (req, res)=> {
    transactionMiner.mineTransaction();
    res.redirect('/api/blocks');
})

app.get('/api/wallet-info', (req, res) => {
    const address = wallet.publicKey;
    res.json({
        address,
        balance: Wallet.calculateBalance({chain: blockchain.chain, address})
    })
})

app.get('/api/known-address', (req, res) => {

    const addressMap = {};
    for(let block of blockchain.chain){
        for(let transaction of block.data){
            const recipient = Object.keys(transaction.outputMap);
            recipient.forEach(recipient => addressMap[recipient] = recipient);
        }
    }
    res.json(Object.keys(addressMap));
})

// Serve Frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/dist/index.html'));
})


/** Sync Data with Peers */

const syncWithRootState = () => {
    request({
        url: `${ROOT_NODE_ADDRESS}/api/blocks`
    }, (error, response, body) => {
        if(!error && response.statusCode === 200){
            const rootChain = JSON.parse(body);
            console.log(`Replace chain on a sync with`, rootChain);
            blockhain.replaceChain(rootChain);
        }
    })

    request({
        url: `${ROOT_NODE_ADDRESS}/api/transaction-pool-map` 
    }, (err, res, body) => {
        if(!error && response.statusCode === 200){
            const rootTransactionPoolMap = JSON.parse(body);
            console.log('Replace Transaction Pool Map on a SYNC with', rootTransactionPoolMap);
            transactionPool.setMap(rootTransactionPoolMap);
        }
    })
}


/** Generate Some SEED Data  */

if(isDevelopment){

    const walletFoo = new Wallet();
    const walletBar = new Wallet();

    const generateWalletTransaction = ({ wallet, recipient, amount }) => {
        const transaction = wallet.createTransaction({
            recipient, amount, chain: blockchain.chain
        });
        transactionPool.setTransaction(transaction);
    }

    const walletAction = () => generateWalletTransaction ({
        wallet, recipient: walletFoo.publicKey, amount: 5
    });

    const walletFooAction = () => generateWalletTransaction({
        wallet: walletFoo, recipient: walletBar.publicKey, amount: 10
    });

    const walletBarAction = () => generateWalletTransaction({
        wallet: walletBar, recipient: wallet.publicKey, amount: 15
    })

    for(let i=0; i<20; i++){
        if(i%3==0){
            walletAction();
            walletFooAction();
        }else if(i%3 === 1){
            walletAction();
            walletBarAction();
        }else{
            walletFooAction();
            walletBarAction();
        }
        transactionMiner.mineTransaction();
    }
}


/** Generate a PEER PORT */

let PEER_PORT;

if(process.env.GENERATE_PEER_PORT === 'true'){
    PEER_PORT = DEFAULT_PORT + Math.ceil(Math.random() * 1000);
}

/** Start Server */

const PORT = process.env.PORT || PEER_PORT || DEFAULT_PORT;
app.listen(PORT, () => {
    console.log(`Listening at Localhost:${PORT}`);
    if(PORT != DEFAULT_PORT){
        syncWithRootState();
    }
});