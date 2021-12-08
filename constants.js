require('dotenv').config();

const moment = require('moment');

const KEYWORD = {
    URL_TWEETS: process.env.URL_TWEETS || "http://localhost:8101/tweets",
    URL_SENTIMENT_ANALSYS: process.env.URL_SENTIMENT_ANALSYS || 'http://localhost:8102/sentiment',
    HOST: process.env.HOST || 'localhost',
    PORT: parseInt(process.env.PORT || '3003'),
    READ_NEWS_INTERVAL_MS: parseInt(process.env.READ_NEWS_INTERVAL_MS || 300000),
    SITE_YAHOO: process.env.SITE_YAHOO || "site_yahoo",
    SITE_GOOGLE: process.env.SITE_GOOGLE || "site_google",
    SITE_TWITTER: process.env.SITE_TWITTER || "site_twitter",
    NEWS_SYMBOL: process.env.NEWS_SYMBOLS || "news_symbol",
    REDIS_NEWS_AGO_KEYWORD: process.env.REDIS_NEWS_AGO_KEYWORD || "NEWS_AGO",
    NEWS_SEARCH: process.env.REDIS_KEYWORD || "NEWS_SEARCH",
    READ_NEWS_INTERVAL_MS: parseInt(process.env.READ_NEWS_INTERVAL_MS || '300000'),
    REDIS_HOST: process.env.REDIS_HOST || "localhost",
    REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379'),
    REDIS_PASSWORD: process.env.REDIS_PASSWORD || "password",
    THREEBAR_LIMIT_SCORE: parseInt(process.env.THREEBAR_LIMIT_SCORE || '1'),
    THREEBAR_LIMIT_VOLUME: parseInt(process.env.THREEBAR_LIMIT_VOLUME || '100'),
    THREEBAR_LIMIT_BAR_SCAN_VALID: parseInt(process.env.THREEBAR_LIMIT_BAR_SCAN_VALID || '1000000000'),
}

const NewsTable = {
    YAHOO: KEYWORD.SITE_YAHOO,
    GOOGLE: KEYWORD.SITE_GOOGLE,
    TWITTER: KEYWORD.SITE_TWITTER
}

module.exports = { NewsTable, KEYWORD }
