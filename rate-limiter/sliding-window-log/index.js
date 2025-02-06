const { createClient } = require('redis');

class SlidingWindowLogRateLimiter {
    #redisReady = false;

    constructor(window, size) {
        this.redisClient = createClient();
        this.window = window;
        this.size = size;
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

        const key = `sliding_window_rate_limit:${clientId}`;
        const fieldKey = Math.floor(Math.random() * (10**5)).toString();
        // get size of hash set
        const requestCount = await this.redisClient.hLen(key);

        const isAllowed = requestCount < this.size;
        if (isAllowed) {
            const updateTrx = this.redisClient.multi();
            // add new field to hash set
            updateTrx.hSet(key, fieldKey, "");
            // set expiration time
            updateTrx.hExpire(key, fieldKey, this.window);
            await updateTrx.exec();
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

module.exports = { SlidingWindowLogRateLimiter };
