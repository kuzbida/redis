const { RedisClient } = require('../redis-client.class');

class LeaderBoard extends RedisClient {
    constructor(boardName) {
        super();
        this.boardName = boardName || 'RedisLeaderBoard';
    }

    async setUserScore(user, score) {
        await this.checkConnection();

        const result = await this.redisClient.zAdd(this.boardName, { score: score, value: user });
        return result;
    }

    async getUserRank(user) {
        await this.checkConnection();

        return this.redisClient.zRevRank(this.boardName, user);
    }

    async removeUser(user) {
        await this.checkConnection();

        return this.redisClient.zRem(this.boardName, user);
    }

    async topK(num) {
        await this.checkConnection();

        return this.redisClient.zRange(this.boardName, 0, num - 1, { REV: true });
    }
}

module.exports.LeaderBoard = LeaderBoard;