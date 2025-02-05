const { createClient } = require('redis');

class TokenBucketRateLimiter {
    #redisReady = false;

    constructor(bucketCapacity, refillRate) {
        this.redisClient = createClient();
        this.bucketCapacity = bucketCapacity;
        this.refillRate = refillRate;
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

        const keyCount = `rate_limit:${clientId}:count`;
        const keyLastRefill = `rate_limit:${clientId}:refill`;
        const currTime = (new Date()).getTime();
        
        const transaction = this.redisClient.multi();
        transaction.get(keyCount);
        transaction.get(keyLastRefill);
        const result = await transaction.exec();

        let [takenCount, latestRefillTs] = result;
        takenCount = takenCount && !isNaN(takenCount) ? parseInt(takenCount, 10) : this.bucketCapacity;
        latestRefillTs = latestRefillTs && !isNaN(latestRefillTs) ? parseInt(latestRefillTs, 10) : currTime;

        const elappsedTimeSeconds = Math.floor((currTime - latestRefillTs) / 1000);
        const tokensToAdd = elappsedTimeSeconds * this.refillRate;

        let tokenCountUpdated = Math.min(this.bucketCapacity, takenCount + tokensToAdd);
        const isAllowed = tokenCountUpdated > 0;
        if (isAllowed) {
            tokenCountUpdated--;
        }
        const updateTrx = this.redisClient.multi();
        updateTrx.set(keyCount, tokenCountUpdated);
        updateTrx.set(keyLastRefill, currTime);
        await updateTrx.exec();

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

module.exports = { TokenBucketRateLimiter };
