// redis hash key node js

const redis = require('redis');
const { KEYWORD } = require('./constants');

require('dotenv').config();

const client = (function () {
    try {
        const redisHost = process.env.REDIS_HOST;
        const redisPort = process.env.REDIS_PORT;
        const redisPassword = process.env.REDIS_PASSWORD;
        return redis.createClient({
            host: redisHost,
            port: redisPort,
            password: redisPassword
        });
    }
    catch (err) {
        console.log(err);
        return null;
    }
})();

class RedisHash {
    constructor(key) {
        this.client = client;
        this.key = key;
    }

    async get(field) {
        return new Promise((resolve, reject) => {
            this.client.hget(this.key, field, (err, res) => {
                if (err) {
                    reject(err);

                } else {
                    resolve(JSON.parse(res));
                }
            });
        });
    }

    async set(field, value) {
        return new Promise((resolve, reject) => {
            this.client.hset(this.key, field, JSON.stringify(value), (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });

        });
    }

    async del(field) {
        return new Promise((resolve, reject) => {
            this.client.hdel(this.key, field, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });
        });
    }

    async getAll() {
        return new Promise((resolve, reject) => {
            try {
                this.client.hgetall(this.key, (err, res) => {
                    if (err) {
                        reject(err);
                    } else {
                        let hashValues = {}
                        if (res === null)
                            resolve({ 'yahoos': [], 'twitters': [], 'googles': [] });
                        else {
                            Object.keys(res).forEach(key => {
                                hashValues[key] = JSON.parse(res[key]);
                            });
                            resolve(hashValues);
                        }
                    }
                });
            }
            catch (err) {
                console.log(err);
                reject([]);
            }
        });
    }

    async getKeys() {
        return new Promise((resolve, reject) => {
            this.client.hkeys(this.key, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });
        });
    }

    async getValues() {
        return new Promise((resolve, reject) => {
            this.client.hvals(this.key, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });
        });
    }

    async getLength() {
        return new Promise((resolve, reject) => {
            try {
                this.client.hlen(this.key, (err, res) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(res);
                    }
                });
            }
            catch (err) {
                console.log(err);
                reject(0);
            }
        });
    }

    async getKeysAndValues() {
        return new Promise((resolve, reject) => {
            this.client.hgetall(this.key, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(res);
                }
            });
        });
    }

}


module.exports = RedisHash;
