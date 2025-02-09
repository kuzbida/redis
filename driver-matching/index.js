const { RedisClient } = require('../redis-client.class');

class DriverMathcing extends RedisClient {
    geo_key = `cars_location`;
    ttl_key = `cars_location:expire`;
    ttl;

    constructor(ttl = 1000) {
        super();

        this.ttl = ttl;
    }

    async init() {

    }

    async upsertDriverLocation(driver, long, lat) {
        await this.checkConnection();

        const now = (new Date()).getTime();
        
        //  GEOADD cars -115.17087 36.12306 my-car 
        const transaction = this.redisClient.multi();
        transaction.geoAdd(this.geo_key, {
            member: driver,
            longitude: long,
            latitude: lat,
        }, {
            CH: true
        });
        transaction.zAdd(this.ttl_key, {
            value: driver,
            score: now + this.ttl
        })
        const result = await transaction.exec();

        console.log('result', result);
    }

    async searchDrivers(long, lat, radius = 1000) {
        await this.checkConnection();
        await this.removeExpiredLocationsLUA();

        const searchLocation = {
            latitude: lat,
            longitude: long,
        };
        const primaryResult = await this.redisClient.geoSearch(this.geo_key, searchLocation, { radius, unit: 'm' });

        if (primaryResult.length > 0) {
            return primaryResult;
        }

        // search in 2x radius
        return this.redisClient.geoSearch(this.geo_key, searchLocation, { radius: radius * 2, unit: 'm' });

    }

    async removeExpiredLocations() {
        const currentTime = Date.now();
        const expired = await this.redisClient.zRangeByScore(this.ttl_key, 0, currentTime);
        if (expired.length > 0) {
            const transaction = this.redisClient.multi();
            transaction.zRem(this.geo_key, expired);
            transaction.zRem(this.ttl_key, expired);
            const result = await transaction.exec();
            console.log(result);
        }
    }

    async removeExpiredLocationsLUA() {
        const currentTime = Date.now();
        const luaScript = `
            local expired = redis.call('ZRANGEBYSCORE', KEYS[2], 0, ARGV[1]) 
            if #expired > 0 then 
                redis.call('ZREM', KEYS[2], unpack(expired))
                redis.call('ZREM', KEYS[1], unpack(expired))
            end
            return #expired
        `;
        const removedCount = await this.redisClient.eval(luaScript, {
            keys: [this.geo_key, this.ttl_key], // geo:index, geo:expiry
            arguments: [currentTime.toString()],
        });
    
        console.log(`Removed ${removedCount} expired locations`);
    }
}

module.exports = { DriverMathcing };
