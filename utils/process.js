const moment = require('moment');
const SCOREKEY = process.env.SCOREKEY || 'STUDYTHREEBARSCORE';
const LIMIT_VOLUME = process.env.THREEBAR_LIMIT_VOLUME || 100
const LIMIT_BAR_SCAN = process.env.THREEBAR_LIMIT_BAR_SCAN_VALID || 10
const LIMIT_SCORE = process.env.THREEBAR_LIMIT_SCORE || 1
const _ = require('lodash');

require('dotenv').config();

const barSize = (period) => {
    switch (period) {
        case "1Sec": return 1;
        case "10Sec": return 10;
        case "1Min": return 60;
        case "2Min": return 120;
        case "5Min": return 300;
        case "30Min": return 1800;
        default:
            return 1;
    }
}

const volumeSize = (period) => {
    switch (period) {
        case "1Sec": return 1 / 60.0;
        case "10Sec": return 1 / 6.0;
        case "1Min": return 1;
        case "2Min": return 2;
        case "5Min": return 5;
        case "30Min": return 30;
        default:
            return 1;
    }
}

const barCount = (period, tsBefore, tsNow) => {
    const seconds = tsNow - tsBefore;
    const bars = Math.ceil(seconds / barSize(period));
    return bars;
}

const isConditionValidData = (data, volumeLimit, barCountLimit, scoreLimit) => {
    const tsSecondsNow = Math.floor(new Date().getTime() / 1000);
    const result = [];
    for (let idx = 0; idx < data.length; ++idx) {
        const item = data[idx];
        const volume = item.data[0].v / volumeSize(item.period);
        const bCount = barCount(item.period, item.timestamp, tsSecondsNow);
        const score = item.point;
        if (volume >= volumeLimit && bCount <= barCountLimit && score >= scoreLimit) {
            result.push(item);
        }
    }
    return result;
}

const getScores = (data) => {
    let scores = [];
    for (let item in data) {
        try {
            const block = JSON.parse(data[item]);
            for (let ix = 0; ix < block.length; ++ix) {
                const dataItem = { ...block[ix], Score: block[ix].point };
                scores.push(dataItem);
            }
            // studyIndicators = (item in stack) ? stack[item] : {};
            // const block = JSON.parse(data[item]);
            // const dataItem = { ...block, StudyMark: JSON.parse(studyIndicators).value };
            // scores.push(dataItem);
        }
        catch (e) {
            console.log('error: ', e);
        }
    }
    // sort scores by Score in descending order
    scores = _.sortBy(scores, 'Score').reverse();
    msg = JSON.stringify(scores);
    // console.log(room);
    return scores;
}

const cleanDatetime = (data) => {
    const datablock = []
    for (let ix = 0; ix < data.length; ++ix) {
        block = data[ix]
        eventdate = moment.unix(block.t)
        block['date'] = eventdate.format('h:mm:ss a')
        block['seconds'] = moment().diff(eventdate, 'seconds')
        datablock.push(block)
    }
    return datablock
}

const ProcessIntervalData = (data) => {
    const scores = getScores(data);
    const datalist = [];
    for (let ix = 0; ix < scores.length; ++ix) {
        score = scores[ix]
        // load timestamp into moment object
        // eventdate = moment.unix(score.timestamp)
        // score['date'] = eventdate.format('MMMM Do YYYY, h:mm:ss a')
        // score['seconds'] = moment().diff(eventdate, 'seconds')
        score['data'] = cleanDatetime(score.data)
        datalist.push(score);
    }
    let results = datalist.filter(item => item.point > 0)
    results = _.sortBy(results, 'timestamp').reverse();
    results = isConditionValidData(results, LIMIT_VOLUME, LIMIT_BAR_SCAN, LIMIT_SCORE);
    return results;
}

module.exports = { ProcessIntervalData, isConditionValidData }
