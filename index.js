const express = require('express');
const bj = require('./bjRefactored');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: true }));

//Main Menu
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

//Singleplayer
app.get('/singleplayer', (req, res) => {
  res.sendFile(__dirname + '/public/singleplayer/singleplayer.html');
});

//Multiplayer Main Menu
app.get('/multiplayer', (req, res) => {
  res.sendFile(__dirname + '/public/multiplayer/multiplayer.html');
});

//Multiplayer Create Menu
app.get('/multiplayer/create', (req, res) => {
  res.sendFile(__dirname + '/public/multiplayer/create.html');
});

//Multiplayer Join Menu
app.get('/multiplayer/join', (req, res) => {
  res.sendFile(__dirname + '/public/multiplayer/join.html');
});

//#1  User wants to join or create new lobby
app.post('/multiplayer/lobby', (req, res) => {
  //Invalid JSON
  if(req.body == null && req.body == '') {return;}

  //Player submitted create game data
  if(req.body.createPlayerName != null) {
    let name = req.body.createPlayerName;
    let game = bj.getGameId();  //Generate lobby code
    bj.setGame(game, name); //Create entry on server for this id
    res.redirect(req.url + '/' + game);
    return;

  //Player submitted join game data
  } else {
    let game = req.body.joinGame;
    res.redirect(req.url + '/' + game);
    return;
  }
});

//Multiplayer in lobby
app.get('/multiplayer/lobby/:id', (req, res) => {
    //#2 See if lobby in URL exists already or not, if it does, update html
    if(bj.getGame(req.params.id) == 'NULL' || bj.getGame(req.params.id) == null) {res.status(404).send("Game Room Not Found");} else {
      res.sendFile(__dirname + '/public/multiplayer/game.html');
    }
});
app.post('/multiplayer/lobby/:id', (req, res) => {
  if(bj.getGame(req.body.gameId).hostSocketId == 'EMPTY' || bj.getGame(req.body.gameId).hostSocketId == null) {
    bj.createGame(req.body.gameId, req.body.mySocketId);
    console.log('Host id for game room: ' + req.body.gameId + ' is: ' + bj.getGame(req.body.gameId).hostSocketId);
  }
});

io.on('connection', (socket) => {
    //Begin Handshake to new opened socket
    bj.connectedToServer(io, socket);
  });

server.listen(5500, () => {
    console.log('listening on *:5500');
});


