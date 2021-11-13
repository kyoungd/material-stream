const express = require("express");
const http = require("http");
// const socketio = require("socket.io")(server, { origins: '*:*' });
const path = require("path");
const timer = require('timers');
const app = express();
const server = http.createServer(app);
// const io = socketio(server);
const io = require("socket.io")(server, {
  cors: { origins: '*:*' }
});
const moment = require('moment');

const formatMessage = require("./utils/messages");
const _ = require('underscore');
require('dotenv').config();

const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
  getAllUniqueRooms,
} = require("./utils/users");

const redis = require('redis');
const client = redis.createClient();

// set static folder
app.use(express.static(path.join(__dirname, "public")));

const botName = "ChatCord Bot";
const SCOREKEY = process.env.SCOREKEY || 'STUDYTHREEBARSCORE';
const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || 3003;
const INTERVAL_MS = process.env.INTERVAL_MS || 5000
const LIMIT_VOLUME = process.env.THREEBAR_LIMIT_VOLUME || 100
const LIMIT_BAR_SCAN = process.env.THREEBAR_LIMIT_BAR_SCAN_VALID || 10
const LIMIT_SCORE = process.env.THREEBAR_LIMIT_SCORE || 1

// run when a client connects
io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
    console.log("logging user: ", user);
    socket.join(user.room);

    // welcome current user
    socket.emit("message", formatMessage(botName, "Welcome to ChatCord!"));

    // broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} has joined the chat`)
      );

    // send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  // listen for chat message
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });

  // runs when client disconnects
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left the chat.`)
      );

      // send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});


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

const interval = setInterval(() => {
  const allRooms = getAllUniqueRooms();
  // console.log('all rooms: ', allRooms);
  allRooms.forEach((room) => {
    const key = room.replace('SCORE', 'STACK');
    client.hgetall(key, function (err, stack) {
      client.hgetall(room, function (err, data) {
        // convert data to array
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
        console.log(room);
        // console.log(new Date().toLocaleString());
        io.to(room).emit("message", formatMessage(botName, msg));
      });
    });
  });
}, INTERVAL_MS);


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

app.get('/live/ping', function (req, res) {
  res.send("pong");
})

app.get('/data', function (req, res) {
  room = 'STUDYTHREEBARSCORE';
  results = [];
  client.hgetall(room, function (err, data) {
    scores = getScores(data);
    for (let ix = 0; ix < scores.length; ++ix) {
      score = scores[ix]
      // load timestamp into moment object
      // eventdate = moment.unix(score.timestamp)
      // score['date'] = eventdate.format('MMMM Do YYYY, h:mm:ss a')
      // score['seconds'] = moment().diff(eventdate, 'seconds')
      score['data'] = cleanDatetime(score.data)
      results.push(score);
    }
    results = results.filter(item => item.point > 0)
    results = _.sortBy(results, 'timestamp').reverse();
    results = isConditionValidData(results, LIMIT_VOLUME, LIMIT_BAR_SCAN, LIMIT_SCORE);
    res.send(results);
  });
})

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, HOST, () => console.log(`Server running on port: ${PORT}`));
}

module.exports = { app, isConditionValidData }

// kill server port
// kill -9 $(lsof -t -i:3001)
