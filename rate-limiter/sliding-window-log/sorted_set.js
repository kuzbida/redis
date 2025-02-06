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

        this.redisClient.on('ready', function () {
            this.redisReady = true;
            console.log('redis is running');
        });
    }

    async isAllowed(clientId) {
        await this.#checkConnection();

        const key = `sliding_window_rate_limit2:${clientId}`;
        const currentTimestamp = Date.now();
        const windowStart = currentTimestamp - this.window * 1000;

        // Remove outdated requests
        await this.redisClient.zRemRangeByScore(key, 0, windowStart);

        // Get the count of requests in the window
        const requestCount = await this.redisClient.zCard(key);

        const isAllowed = requestCount < this.size;

        if (isAllowed) {
            const updateTrx = this.redisClient.multi();
            updateTrx.zAdd(key, { score: currentTimestamp, value: currentTimestamp.toString() }); // Store timestamp as score
            updateTrx.expire(key, this.window); // Set expiration for the key
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
