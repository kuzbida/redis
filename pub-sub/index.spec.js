const { Publisher } = require('./publisher');
const { Subscriber } = require('./subscriber');

describe('Redis Pub/Sub', () => {
    let publisher;
    let subscriber;

    beforeAll(async () => {
        publisher = new Publisher();
        subscriber = new Subscriber();

        await publisher.connect();
        await subscriber.connect();
    });

    afterAll(async () => {
        await publisher.redisClient.quit();
    });

    it('should consume message', async () => {
        const channel = 'channel1';
        const message = 'test_message';
        await subscriber.subscribe(channel, (msg) => {
            expect(msg).toBe(message);
        });

        await publisher.publish(channel, message);

        setTimeout(async () => {
            await subscriber.unsubscribeAll();
        }, 500)
    });

    it('should consume multiple messages', async () => {
        const channel = 'channel2';
        const cb = jest.fn();
        await subscriber.subscribe(channel, cb);

        for (let i of [1,2,3,4,5]) {
            await publisher.publish(channel, i.toString(10));
        }

        setTimeout(() => {
            expect(cb).toHaveBeenCalledTimes(5);
            subscriber.unsubscribeAll();
        }, 500)

    });
});