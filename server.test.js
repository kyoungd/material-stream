const request = require('supertest');
const redis = require('redis');
const { app } = require('./server');
const RedisHash = require('./redisHash');
const symbol = "TEST1"
require('dotenv').config();
const { isConditionValidData } = require('./utils/process');

describe('to build', () => {
    let client;
    let key;

    beforeAll(async () => {
        // ...
        try {
            client = redis.createClient();
            key = process.env.KEYWORD_SENTIMENT || 'STUDYSENTIMENTS';
        }
        catch (err) {
            console.log(err);
        }
    })

    it('read write to redis hash', async () => {
        try {
            const hash = new RedisHash(key);
            const data = {
                "google": { "sentiment": 10, "count": 6 },
                "twitter": { "sentiment": 11, "count": 32 },
                "yahoo": { "sentiment": 12, "count": 5 },
            }
            await hash.set("IBM", data);
            const result = await hash.get("IBM");
            expect(result).toEqual(data);
        }
        catch (err) {
            console.log(err);
        }
    })

    it('readall from redis hash', async () => {
        try {
            const hash = new RedisHash(key);
            const data = {
                "google": { "sentiment": 10, "count": 6 },
                "twitter": { "sentiment": 11, "count": 32 },
                "yahoo": { "sentiment": 12, "count": 5 },
            }
            await hash.set("IBM", data);
            await hash.set("ABC", data);
            const result = await hash.getAll();
            expect(result.length).toBe(2);
        }
        catch (err) {
            console.log(err);
        }
    })

})

describe('Todo', () => {
    let client;
    let STUDYTHREEBARSCORE;
    let data;

    const setscore = (client, key, symbol, data) => {
        return new Promise((resolve, reject) => {
            client.hset(key, symbol, data, (err, reply) => {
                if (err) {
                    reject(err);
                }
                resolve(reply);
            });
        });
    }

    const flushall = (client, key, symbol, data) => {
        return new Promise((resolve, reject) => {
            client.flushall((err, res) => {
                if (err) {
                    reject(err);
                } else {
                    setscore(client, key, symbol, data).then(() => {
                        resolve(res);
                    })
                        .catch((err) => {
                            reject(err);
                        });
                }
            });
        });
    };

    beforeAll(async () => {
        // ...
        try {
            client = redis.createClient();
            STUDYTHREEBARSCORE = process.env.SCOREKEY || 'STUDYTHREEBARSCORE';
            ts = Math.floor((new Date().getTime()) / 1000);
            data = [{
                "type": "threebars", "symbol": "FANG", "period": "2Min", "indicator": "price", "timestamp": ts, "point": 4,
                "data": [
                    { "t": ts, "c": 10.399999999999999, "o": 10.6, "h": 10.8, "l": 10.25, "v": 3000.0 },
                    { "t": ts - 120, "c": 10.7, "o": 10.6, "h": 10.8, "l": 10.55, "v": 3000.0 },
                    { "t": ts - 240, "c": 10.7, "o": 10.1, "h": 10.8, "l": 10.05, "v": 3000.0 },
                    { "t": ts - 360, "c": 10.2, "o": 10.299999999999999, "h": 10.5, "l": 10.05, "v": 3000.0 },
                    { "t": ts - 480, "c": 10.399999999999999, "o": 10.6, "h": 10.8, "l": 10.25, "v": 3000.0 },
                    { "t": ts - 600, "c": 10.7, "o": 10.6, "h": 10.8, "l": 10.55, "v": 3000.0 },
                    { "t": ts - 720, "c": 10.7, "o": 10.1, "h": 10.8, "l": 10.05, "v": 3000.0 },
                    { "t": ts - 840, "c": 10.2, "o": 10.1, "h": 10.3, "l": 10.05, "v": 2000.0 }
                ],
                "trade": { "symbol": "FANG", "close": 10.45, "volume": 100 }
            }];
            const jsonstring = JSON.stringify(data);
            await flushall(client, STUDYTHREEBARSCORE, symbol, jsonstring)
        }
        catch (err) {
            console.log(err);
        }
    })

    it('should app /data get', async () => {
        const response = await request(app).get('/data')
            .expect('Content-Type', /json/)
            .expect(200);
        const result = response.body;
        expect(result[0].symbol).toEqual(data[0].symbol);
        expect(result[0].data.length).toEqual(data[0].data.length);
        expect(result.length).toEqual(data.length);
    })

    it('should test isConditionValidData', () => {
        const result = isConditionValidData(data, 10, 100000000, 1)
        expect(result.length).toBeGreaterThan(0);
        expect(result[0].data.length).toEqual(data[0].data.length);
        expect(result.length).toEqual(data.length);
        expect(result[0].symbol).toEqual(data[0].symbol);
    })

})
