const { RedisClient } = require('./redis-client.class');

class Subscriber extends RedisClient {
    channels = [];

    constructor() {
        super();
    }

    async subscribe(channel, callback) {
        await this.checkConnection();

        await this.redisClient.subscribe(channel, (message) => {
            this.channels.push(channel);

            console.log(`Received message: ${message}`);
            callback(message);
        });
    
        console.log('Subscribed to channel: my_channel');
    }

    async unsubscribeAll() {
        for (let ch of this.channels) {
            await this.redisClient.unsubscribe(ch);
        }
    }
}

module.exports = { Subscriber };
