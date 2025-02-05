const { createClient } = require('redis');

class LeakyBucketRateLimiter {
    #redisReady = false;

    constructor(bucketCapacity, leakRate) {
        this.redisClient = createClient();
        this.bucketCapacity = bucketCapacity;
        this.leakRate = leakRate;
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

        const keyCount = `leak_rate_limit:${clientId}:count`;
        const keyLastLeak = `leak_rate_limit:${clientId}:lastLeak`;
        const currTime = (new Date()).getTime();
        
        const transaction = this.redisClient.multi();
        transaction.get(keyCount);
        transaction.get(keyLastLeak);
        const result = await transaction.exec();

        let [requestCount, latestLeakTs] = result;
        requestCount = requestCount && !isNaN(requestCount) ? parseInt(requestCount, 10) : 0;
        latestLeakTs = latestLeakTs && !isNaN(latestLeakTs) ? parseInt(latestLeakTs, 10) : currTime;

        const elappsedTimeSeconds = Math.floor((currTime - latestLeakTs) / 1000);
        const requestsToLeak = elappsedTimeSeconds * this.leakRate;

        let tokenCountUpdated = Math.max(0, requestCount - requestsToLeak);
        const isAllowed = tokenCountUpdated < this.bucketCapacity;
        if (isAllowed) {
            tokenCountUpdated++;
        }
        const updateTrx = this.redisClient.multi();
        updateTrx.set(keyCount, tokenCountUpdated);
        updateTrx.set(keyLastLeak, currTime);
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

module.exports = { LeakyBucketRateLimiter };
