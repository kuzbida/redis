import { createClient } from 'redis';

(async function() {
    const client = createClient();

    client.on('error', err => console.log('Redis Client Error', err));
    client.on('connection', (data) => console.log('Redis Client Connected', data));

    await client.connect();

    await client.set('key', 'value');
    const value = await client.get('key');

    console.log('value', value);
})();