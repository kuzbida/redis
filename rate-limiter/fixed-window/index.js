const { resolve } = require('path');
const { createClient } = require('redis');

class FixedWindowRateLimiter {
    #redisReady = false;

    constructor(windowSize, limit) {
        this.redisClient = createClient();
        this.windowSize = windowSize;
        this.limit = limit;
        this.#redisReady = this.redisClient.isOpen;

        this.redisClient.on('error', (err) => {
            console.error('Redis Client Error:', err);
        });

        this.redisClient.on('ready', function() {
            this.redisReady = true;
            console.log('redis is running');
        });
    }

    async isAllowed(clientId) {
        await this.#checkConnection();

        const key = `rate_limit:${clientId}`;
        const currentCounterStr = await this.redisClient.get(key);
        const currentCounter = currentCounterStr && !isNaN(currentCounterStr) ? parseInt(currentCounterStr, 10) : 0;

        const isAllowed = currentCounter <= this.limit;

        if (isAllowed) {
            const multi = this.redisClient.multi();
            multi.incr(key);
            multi.expire(key, this.windowSize, 'NX');
            await multi.exec();
        }
        return isAllowed;
    }

    async #checkConnection() {
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

module.exports = { FixedWindowRateLimiter };
