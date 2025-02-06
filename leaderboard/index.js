const { createClient } = require('redis');

class LeaderBoard {
    #redisReady = false;

    constructor(boardName) {
        this.redisClient = createClient();
        this.#redisReady = this.redisClient.isOpen;
        this.boardName = boardName || 'RedisLeaderBoard';

        this.redisClient.on('error', (err) => {
            console.error('Redis Client Error:', err);
        });

        this.redisClient.on('ready', function () {
            this.#redisReady = true;
            console.log('redis is running');
        });
    }

    async setUserScore(user, score) {
        await this.#checkConnection();

        const result = await this.redisClient.zAdd(this.boardName, { score: score, value: user });
        return result;
    }

    async getUserRank(user) {
        await this.#checkConnection();

        return this.redisClient.zRevRank(this.boardName, user);
    }

    async removeUser(user) {
        await this.#checkConnection();

        return this.redisClient.zRem(this.boardName, user);
    }

    async topK(num) {
        await this.#checkConnection();

        return this.redisClient.zRange(this.boardName, 0, num - 1, { REV: true });
    }

    async connect() {
        return this.#checkConnection();
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

module.exports.LeaderBoard = LeaderBoard;