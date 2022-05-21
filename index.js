const express = require('express');
const bj = require('./blackjackgame');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
  });

io.on('connection', (socket) => {
    //Begin Handshake to new opened socket
    bj.connectedToServer(io, socket);
  });

server.listen(5500, () => {
    console.log('listening on *:5500');
});


