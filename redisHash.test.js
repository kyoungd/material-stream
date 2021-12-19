const request = require('supertest');
const newsData = require('./sample-news-search.json');
const RedisHash = require('./redisHash');
const { KEYWORD } = require('./constants');

describe('to build', () => {
    let hash;

    beforeEach(async () => {
        const hash = new RedisHash(KEYWORD.NEWS_SEARCH);
        await hash.client.flushall();
        Object.keys(newsData).forEach(async (field) => {
            const value = newsData[field];
            await hash.set(field, JSON.stringify(value));
        });
    })

    it('read redis news sentiment data', async () => {
        const hash = new RedisHash(KEYWORD.NEWS_SEARCH);
        const data = await hash.getAll();
        expect(data).toBeDefined();
        expect(data.NEWS_SEARCH_30_minute_ago).toBeDefined();
        expect(data.NEWS_SEARCH_2_hour_ago).toBeDefined();
        expect(data.NEWS_SEARCH_4_hour_ago).toBeDefined();
    })

})
