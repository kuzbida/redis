const { createClient } = require('redis');
const moment = require('moment'); // Install via npm: `npm install moment`

class LeaderBoard {
    #redisReady = false;

    constructor(boardName) {
        this.redisClient = createClient();
        this.#redisReady = this.redisClient.isOpen;
        this.boardName = boardName || 'RedisLeaderBoard';

        this.redisClient.on('error', (err) => {
            console.error('Redis Client Error:', err);
        });

        this.redisClient.on('ready', () => {
            this.#redisReady = true;
            console.log('redis is running');
        });
    }

    /**
     * Generates a leaderboard key based on the time interval.
     * @param {string} interval - "daily", "weekly", or "monthly"
     * @returns {string} - Redis sorted set key
     */
    #getLeaderboardKey(interval) {
        const now = moment();
        switch (interval) {
            case 'daily': return `leaderboard:daily:${now.format('YYYY-MM-DD')}`;
            case 'weekly': return `leaderboard:weekly:${now.format('YYYY-[W]WW')}`;
            case 'monthly': return `leaderboard:monthly:${now.format('YYYY-MM')}`;
            default: return this.boardName;
        }
    }

    /**
     * Set user score for a given time interval.
     */
    async setUserScore(user, score, interval = 'daily') {
        await this.#checkConnection();
        const key = this.#getLeaderboardKey(interval);

        return this.redisClient.zAdd(key, { score: score, value: user });
    }

    /**
     * Get user's rank from a specific leaderboard.
     */
    async getUserRank(user, interval = 'daily') {
        await this.#checkConnection();
        const key = this.#getLeaderboardKey(interval);

        return this.redisClient.zRevRank(key, user);
    }

    /**
     * Remove user from a specific leaderboard.
     */
    async removeUser(user, interval = 'daily') {
        await this.#checkConnection();
        const key = this.#getLeaderboardKey(interval);

        return this.redisClient.zRem(key, user);
    }

    /**
     * Get top K users from a specific leaderboard.
     */
    async topK(num, interval = 'daily') {
        await this.#checkConnection();
        const key = this.#getLeaderboardKey(interval);

        return this.redisClient.zRange(key, 0, num - 1, { REV: true });
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
        });
    }
}

module.exports.LeaderBoard = LeaderBoard;
