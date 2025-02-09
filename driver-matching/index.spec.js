const { DriverMathcing } = require(".");

describe('Driver Matching', () => {
    let engine;

    beforeAll(async () => {
        engine = new DriverMathcing(1000);
        await engine.connect();
    });

    afterAll(async () => {
        await engine.disconnect();
    })

    it('should return driver in radius', async () => {
        const driver= 'test';
        const lat = 25.9548422;
        const long =  -80.1415625;
        await engine.upsertDriverLocation(driver, long, lat);
        expect(await engine.searchDrivers(long, lat, 500)).toStrictEqual([driver]);
    });

    it('should remove expired driver', async () => {
        const driver= 'test';
        const lat = 25.9548422;
        const long =  -80.1415625;
        await engine.upsertDriverLocation(driver, long, lat);
        await (new Promise((resolve) => setTimeout(() => resolve(), 2000)));

        expect(await engine.searchDrivers(long, lat, 500)).toStrictEqual([]);
    });

})