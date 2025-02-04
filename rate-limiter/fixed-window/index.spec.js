const { FixedWindowRateLimiter } = require('./index');

describe('Fixed Windon Rate Limiter', () => {
    let rateLimiter;
    const clientId = 'client1';

    beforeAll(() => {
        rateLimiter = new FixedWindowRateLimiter(5, 3);
    });

    afterAll(async () => {
        await rateLimiter.redisClient.quit();
    })

    it('should allow 3 consequitive requests', async () => {
        let isAllowed;
        for (let i of [1,2,3]) {
            isAllowed = await rateLimiter.isAllowed(clientId);
        }
        expect(isAllowed).toBe(true);
    });


    it('should dissalow 4 consequitive requests', async () => {
        let isAllowed;
        for (let i of [1,2,3,4]) {
            isAllowed = await rateLimiter.isAllowed(clientId);
        }
        expect(isAllowed).toBe(false);
    });

    it('should expire the key after 3 seconds', async () => {
        const clientId = 'client2';
    
        // Make some requests
        for (let i of [1,2,3]) {
            await rateLimiter.isAllowed(clientId);
        }
    
        // Wait for 3 seconds to let the key expire
        await new Promise(resolve => setTimeout(resolve, 3000));
    
        // Check if the key has expired
        const isAllowedAfterExpiry = await rateLimiter.isAllowed(clientId);
        expect(isAllowedAfterExpiry).toBe(true); // Should be allowed after expiry
    }, 5000); // Increase Jest timeout to 10s to ensure test runs completely
    
})