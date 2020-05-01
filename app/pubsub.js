const redis = require('redis');

const CHANNELS = { 
    TEST: 'TEST',
    BLOCKCHAIN: 'BLOCKCHAIN' 
};

class PubSub{

    constructor({ blockhain }){

        this.blockhain = blockhain;

        this.publisher = redis.createClient();
        this.subscriber = redis.createClient();

        this.subscribeToChannels();

        this.subscriber.on('message', (channel, message) => {
            this.handleMessage(channel, message)
        })
    }

    subscribeToChannels(){
        Object.values(CHANNELS).forEach( channel =>{
            this.subscriber.subscribe(channel);
        })
    }

    handleMessage(channel, message){
        console.log(`Message Received. Channel: ${channel}, Message: ${message}.`);
        const parsedMessage = JSON.parse(message);
        if(channel == CHANNELS.BLOCKCHAIN){
            this.blockhain.replaceChain(parsedMessage);
        }
    }

    publish({channel, message}){
        this.subscriber.unsubscribe(channel, () => {
            this.publisher.publish(channel, message), () => {
                this.subscriber.subscribe(channel);
            };
        })
        
    }

    broadcastChain(){
        this.publish({
            channel: CHANNELS.BLOCKCHAIN,
            message: JSON.stringify(this.blockchain.chain)
        })
    }
    
}

module.exports = PubSub;