
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let players = {};
let currentRound = null;

io.on('connection', (socket) => {

  socket.on('join', (name) => {
    players[socket.id] = { name, score: 0, choice: null };
    io.emit('leaderboard', Object.values(players));
  });

  socket.on('startRound', (round) => {
    currentRound = round;
    Object.values(players).forEach(p => p.choice = null);
    io.emit('roundStarted', round);
  });

  socket.on('choice', (choice) => {
    if (players[socket.id]) players[socket.id].choice = choice;
  });

  socket.on('reveal', () => {
    if (!currentRound) return;

    Object.values(players).forEach(p => {
      if (p.choice === null) return;

      const opt = currentRound.options[p.choice];
      const win = Math.random()*100 < opt.chance;

      if (win) p.score += opt.reward;
    });

    io.emit('leaderboard', Object.values(players));
    io.emit('revealed', Object.values(players));
  });

  socket.on('disconnect', () => {
    delete players[socket.id];
    io.emit('leaderboard', Object.values(players));
  });
});

server.listen(process.env.PORT || 3000, () =>
  console.log('Server running')
);
