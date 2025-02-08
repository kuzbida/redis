const { createClient } = require('redis');

class RedisClient {
    #redisReady = false;

    constructor() {
        this.redisClient = createClient();
        
        this.#redisReady = this.redisClient.isOpen;

        this.redisClient.on('error', (err) => {
            console.error('Redis Client Error:', err);
        });

        this.redisClient.on('ready', function() {
            this.redisReady = true;
            console.log('redis is running');
        });
    }

    async connect() {
        return this.checkConnection();
    }

    async checkConnection() {
        return new Promise(async (resolve, reject) => {
            if (this.#redisReady || this.redisClient.isReady) {
                resolve(true);
            }
    
            try {
                await this.redisClient.connect();
                resolve(true);
            } catch (err) {
                reject(err);
            }
        })
        
    }
}

module.exports = { RedisClient };
