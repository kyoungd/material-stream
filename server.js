const express = require("express");
const http = require("http");
// const socketio = require("socket.io")(server, { origins: '*:*' });
const path = require("path");
const timer = require('timers');
const RedisHash = require('./redisHash');
const app = express();
const server = http.createServer(app);
// const io = socketio(server);
const io = require("socket.io")(server, {
  cors: { origins: '*:*' }
});
const moment = require('moment');
const { KEYWORD } = require('./constants');

const formatMessage = require("./utils/messages");
const _ = require('underscore');
require('dotenv').config();

const { ProcessIntervalData } = require('./utils/process');

const redis = require('redis');
const { env } = require("process");
const client = redis.createClient({
  host: KEYWORD.REDIS_HOST,
  port: KEYWORD.REDIS_PORT,
  password: KEYWORD.REDIS_PASSWORD,
});

const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
  getAllUniqueRooms,
} = require("./utils/users");

// set static folder
app.use(express.static(path.join(__dirname, "public")));

const botName = "ChatCord Bot";
const HOST = KEYWORD.HOST;
const PORT = KEYWORD.PORT;
const INTERVAL_MS = KEYWORD.INTERVAL_MS || 5000

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


const interval = setInterval(() => {
  const hash = new RedisHash(KEYWORD.NEWS_SEARCH);
  const allRooms = getAllUniqueRooms();
  // console.log('all rooms: ', allRooms);
  allRooms.forEach((room) => {
    const key = room.replace('SCORE', 'STACK');
    client.hgetall(key, async function (err, stack) {
      client.hgetall(room, async function (err, data) {
        const results = ProcessIntervalData(data);
        const symbolList = results.map(item => item.symbol);
        const news = await hash.getAll();
        const newsList = newsLayout(news, symbolList);
        msg = JSON.stringify({ 'threebar': results, news: newsList });
        console.log(room);
        // console.log(new Date().toLocaleString());
        io.to(room).emit("message", formatMessage(botName, msg));
      });
    });
  });
}, INTERVAL_MS);

app.get('/live/ping', function (req, res) {
  res.send("pong");
})

const newsLayout = (news, symbolList) => {
  const keys = Object.keys(news);
  const symbols = news[keys[0]].map(item => item.symbol);
  const newsList = [];
  for (const symbol of symbols) {
    // item in array
    if (symbolList.indexOf(symbol) >= 0) {
      const newsItems = [];
      for (const key of keys) {
        const newsItem = news[key].find(item => item.symbol === symbol);
        newsItems.push({ 'timeframe': key, ...newsItem });
      }
      newsList.push({ symbol, "news": newsItems });
    }
  }
  return newsList;
}

app.get('/data', async function (req, res) {
  room = 'STUDYTHREEBARSCORE';
  const hash = new RedisHash(KEYWORD.NEWS_SEARCH);
  // results = [];
  client.hgetall(room, async function (err, data) {
    const results = ProcessIntervalData(data);
    const symbolList = results.map(item => item.symbol);
    const news = await hash.getAll();
    const newsList = newsLayout(news, symbolList);
    const jsondata = { 'threebar': results, 'news': newsList }
    res.send(jsondata);
  });
})

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, HOST, () => console.log(`Server running on port: ${PORT}`));
}

module.exports = { app }

// kill server port
// kill -9 $(lsof -t -i:3001)
