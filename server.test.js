const request = require('supertest');
const redis = require('redis');
const { app } = require('./server');
const symbol = "TEST1"
require('dotenv').config();

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
            data = [{ "type": "threebars", "symbol": "FANG", "period": "2Min", "indicator": "price", "timestamp": 1636510080, "point": 4, "data": [{ "t": 1636510080, "c": 10.399999999999999, "o": 10.6, "h": 10.8, "l": 10.25, "v": 3000.0 }, { "t": 1636509960, "c": 10.7, "o": 10.6, "h": 10.8, "l": 10.55, "v": 3000.0 }, { "t": 1636509840, "c": 10.7, "o": 10.1, "h": 10.8, "l": 10.05, "v": 3000.0 }, { "t": 1636509720, "c": 10.2, "o": 10.299999999999999, "h": 10.5, "l": 10.05, "v": 3000.0 }, { "t": 1636509600, "c": 10.399999999999999, "o": 10.6, "h": 10.8, "l": 10.25, "v": 3000.0 }, { "t": 1636509480, "c": 10.7, "o": 10.6, "h": 10.8, "l": 10.55, "v": 3000.0 }, { "t": 1636509360, "c": 10.7, "o": 10.1, "h": 10.8, "l": 10.05, "v": 3000.0 }, { "t": 1636509240, "c": 10.2, "o": 10.1, "h": 10.3, "l": 10.05, "v": 2000.0 }], "trade": { "symbol": "FANG", "close": 10.45, "volume": 100 } }];
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
        console.log('here');
    })

    it('should test isConditionValidData', () => {
        const result = isConditionValidData(data, 10, 100000000, 1)
        expect(result.length).toBeGreaterThan(0);
        expect(result[0].data.length).toEqual(data[0].data.length);
        expect(result.length).toEqual(data.length);
        expect(result[0].symbol).toEqual(data[0].symbol);
    })

})
