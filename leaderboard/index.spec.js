const { LeaderBoard } = require('./index');

describe('LeaderBoard', () => {
    let leaderBoard;
    const boardName = 'TestBoard';

    beforeAll(async () => {
        leaderBoard = new LeaderBoard(boardName);
        await leaderBoard.connect();
    });

    afterEach(async () => {
        await leaderBoard.redisClient.del(boardName);
    })

    afterAll(async () => {
        await leaderBoard.redisClient.quit();
    })

    it('should add new Player', async () => {
        expect(await leaderBoard.setUserScore('player1', 10)).toEqual(1);
        expect(await leaderBoard.getUserRank('player1')).toEqual(0);
    });

    it('should add multiple Players', async () => {
        for (let i of [1,2,3,4,5]) {
            expect(await leaderBoard.setUserScore('player' + i, 10*i)).toEqual(1);
            expect(await leaderBoard.getUserRank('player' + i)).toEqual(0);
        }
    });

    it('should return correct rank of player1', async () => {
        for (let i of [1,2,3,4,5]) {
            expect(await leaderBoard.setUserScore('player' + i, 10*i)).toEqual(1);
        }

        expect(await leaderBoard.getUserRank('player' + 1)).toEqual(4);
    });

    it('should TOP 3 players', async () => {
        for (let i of [1,2,3,4,5]) {
            expect(await leaderBoard.setUserScore('player' + i, 10*i)).toEqual(1);
        }

        expect(await leaderBoard.topK(3)).toEqual(["player5", "player4", "player3"]);
    });

    it('should TOP 3 players after removal', async () => {
        for (let i of [1,2,3,4,5]) {
            expect(await leaderBoard.setUserScore('player' + i, 10*i)).toEqual(1);
        }

        await leaderBoard.removeUser('player' + 5);
        expect(await leaderBoard.topK(3)).toEqual(["player4", "player3", "player2"]);
    });


    
})