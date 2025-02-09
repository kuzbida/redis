const { RedisClient } = require('../redis-client.class');

class Publisher extends RedisClient {
    constructor() {
        super();
    }

    async publish(channel, message) {
        await this.checkConnection();

        return this.redisClient.publish(channel, message);;
    }
}

module.exports = { Publisher };
