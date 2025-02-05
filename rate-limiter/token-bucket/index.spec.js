const { afterEach } = require('node:test');
const { TokenBucketRateLimiter } = require('./index');

describe('Token Bucket Rate Limiter', () => {
    let rateLimiter;
    const clientId = 'client1';

    beforeAll(() => {
        rateLimiter = new TokenBucketRateLimiter(5, 1);
    });

    afterEach(async () => {
        await rateLimiter.redisClient.del(['rate_limit:client1:count', 'rate_limit:client1:refill']);
    });

    afterAll(async () => {
        await rateLimiter.redisClient.quit();
    })

    it('should allow 5 consequitive requests', async () => {
        for (let i of [1,2,3,4,5]) {
            expect(await rateLimiter.isAllowed(clientId)).toBe(true);
        }
    });


    it('should dissalow 6th consequitive request', async () => {
        let isAllowed;
        for (let i of [1,2,3,4,5,6]) {
            isAllowed = await rateLimiter.isAllowed(clientId);
        }
        expect(isAllowed).toBe(false);
    });

    it('should expire the key after 3 seconds', async () => {
        const clientId = 'client2';
    
        // Make some requests
        for (let i of [1,2,3,4,5]) {
            expect(await rateLimiter.isAllowed(clientId)).toBe(true);
        }
    
        // Wait for 3 seconds to let the key expire
        await new Promise(resolve => setTimeout(resolve, 3000));
    
        // Check if the key has expired
        const isAllowedAfterExpiry = await rateLimiter.isAllowed(clientId);
        expect(isAllowedAfterExpiry).toBe(true); // Should be allowed after expiry
    }, 5000); // Increase Jest timeout to 10s to ensure test runs completely
    
})