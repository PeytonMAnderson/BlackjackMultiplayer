var io;
var socket;
var RoomsData = new Map();

exports.connectedToServer = function(sio, soc){
    io = sio;
    socket = soc;
    socket.emit('connected', socket.id);    //#4 Socket Connected, send handshake
    console.log('User Connected: ' + socket.id);
    //A player is disonnecting...
    socket.on('disconnecting', () => {
        try {
            let sock = soc;
            if(sock.rooms != undefined) {
                let lobbies = Array.from(sock.rooms); //Get Array of rooms the disconnecting user is in [0] = personal SocketId, [1] = Game Room Id (if any)
                console.log("User Disconnected: " + lobbies[0]);
                if(lobbies.length > 1) {
                    //Player is in a lobby
                    let hostOfLobby = RoomsData.get(lobbies[1]); //Get the host Socket Id of the lobby the player is in
                    //If player is host, kick everyone
                    if(lobbies[0] == hostOfLobby.hostSocketId) {
                        //Player is a host, destroy lobby
                        console.log('Host is leaving the lobby!');
                        sock.broadcast.to(lobbies[1]).emit('hostLeft');   //Broadcast Host Left event
                        RoomsData.delete(lobbies[1]);    //Delete Game Room in Server List
                        io.in(lobbies[1]).socketsLeave(lobbies[1]);   //Force everyone to leave the Game Room
                    } else {
                        //Player is just a player
                        console.log("Player is leaving lobby!");
                        let data = {mySocket: lobbies[0]}
                        sock.broadcast.to(hostOfLobby.hostSocketId).emit('playerLeft', data);   //Send User who left to the Host
                    }
                }
            }
        } catch (error) {console.log(error);}
    });
    // Host emits
    socket.on('joinSocket', joinSocket);
    socket.on('getName', getName);
    socket.on('gameUpdate', gameUpdate);    //Used for every game update during the game
    socket.on('requestPlayerToJoin', requestPlayerToJoin);
    socket.on('getNewCardACK', getNewCardACK);
    socket.on('resetDeck', resetDeck);
    socket.on('getDealersHidden', getDealersHidden);
    // Player emits
    socket.on('playerJoinREQ', playerJoinREQ);
    socket.on('gameChangeREQ', gameChangeREQ);  //Used for every game update during the game
}
//Generate new lobby code for player creating new lobby
exports.getGameId = function() {
    //Get a room id that doesnt exist yet
    let collide = true;
    let newGameId = 0;
    while(collide == true) {
        newGameId = ( Math.random() * 100000 ) | 0;
        newGameId = newGameId + 100000;
        if(RoomsData.has(newGameId.toString()) != true) {collide = false; return newGameId;} }}
//Creates new empty game lobby on the server
exports.setGame = function(gameId, hostName) {
    //Clean up other half-made lobbies
    cleanUpLobbies();
    //Add Room to RoomsData
    if(RoomsData.has(gameId.toString()) != true) {
        let serverPacket = {
            hostSocketId: 'EMPTY', 
            hostName: hostName, 
            color: '0,0,0',
            deck: [],
            deckI: 0,
            dealerI: 0
        }
        RoomsData.set(gameId.toString(), serverPacket);}}
//Remove game from list on server
exports.removeGame = function(gameId) {
    if(RoomsData.has(gameId.toString()) == true) {
        RoomsData.delete(gameId.toString());}}

//gets information for game from list on server
exports.getGame = function(gameId) {
    if(RoomsData.has(gameId.toString()) == true) {return RoomsData.get(gameId.toString());} else {return 'NULL';}}
//Create lobby enviroment
exports.createGame = function(gameId, mySocket) {
    try {
        let roomData = RoomsData.get(gameId.toString());
        let R = Math.floor(Math.random() * 50);
        let G = Math.floor(Math.random() * 50);
        let B = Math.floor(Math.random() * 50);
        let randColor = R + ',' + G + ',' + B;
        roomData.color = randColor;
        roomData.hostSocketId = mySocket;
        RoomsData.set(gameId.toString(), roomData);} catch (error) {console.log(error);}}
//Join Socket lobby
function joinSocket(gameId) {
    //Add Player to Game Room
    let data = {joined: false}
    try {
        this.join(gameId.toString());
        let thisId;
        this.client.sockets.forEach(cout);
        function cout(value, key, map) {thisId = key;}
        console.log(thisId + " joined " + gameId);
        let room  = RoomsData.get(gameId.toString());
        data = {hostSocketId: room.hostSocketId, color: room.color, hostName: room.hostName, joined: true}
        this.emit('joinSocketACK', data);
    } catch (error) {console.log(error); this.emit('joinSocketACK', data);}}
//#6 Get Host name if there is one
function getName(data) {
    try {
        let name = 'NULL';
        let roomData = RoomsData.get(data.gameId.toString());
        if(roomData.hostSocketId == data.socketId) {name = roomData.hostName;}
        this.emit('getNameACK', name);
    } catch (error) {console.log(error);}}
//#7 Send joining player's name for host to check
function playerJoinREQ(data) {
    try {
        let room = RoomsData.get(data.gameId.toString());
        console.log(data.socketId + " is trying to connect to " + data.gameId);
        this.broadcast.to(room.hostSocketId.toString()).emit('playerJoinREQ', data);
    } catch (error) {console.log(error);}
}

//Join incoming player to socket game
function requestPlayerToJoin(data) {
    //Add Player to Game Room
    try {
        io.sockets.sockets.get(data.Player.mySocket).join(data.gameId.toString());  //Join Game Room
    } catch (error) {console.log(error);}}

//-----------------------------------------------
//IN GAME REQUESTS
//-----------------------------------------------
function gameChangeREQ(data) {
    try {
        let room = RoomsData.get(data.pack.gameId);
        io.to(room.hostSocketId.toString()).emit(data.req, data.pack);
    } catch (error) {console.log(error);}
}

//Used for every game update in the game
function gameUpdate(data) {this.broadcast.to(data.gameId).emit('gameUpdateACK', data);}

//Host Requested new card for player
function getNewCardACK(data) {
    try {
        //If card is dealersFirst, hide card
        let thisRoom = RoomsData.get(data.gameId);
        if(thisRoom.deckI >= thisRoom.deck.length) expandDeck(thisRoom);
        if(data.holderType == 'DEALER') {
            if(data.cardHolder.length == 1) {
                thisRoom.dealerI = thisRoom.deckI;
                data.cardHolder[data.cardHolder.length] = 'HIDDEN';
            } else {
                data.cardHolder[data.cardHolder.length] = thisRoom.deck[thisRoom.deckI];
            }
        } else if (data.holderType == 'PLAYER') {
            data.cardHolder.myHand[data.cardHolder.myHand.length] = thisRoom.deck[thisRoom.deckI];
        } else {return;}
        let transmitData = {holderType: data.holderType, cardHolder: data.cardHolder, deckI: thisRoom.deckI}
        io.to(data.gameId).emit('newCardACK', transmitData);
        thisRoom.deckI++;
    } catch (error) {console.log(error);}
}

//Expand the deck automatically
function expandDeck(thisRoom) {
    //Generate Deck
    for(let i = thisRoom.deckI; i < thisRoom.deckI + 52; i++) {
        thisRoom.deck[i] = i - thisRoom.deckI;
    }
    //Shuffle Deck
    let currentIndex = thisRoom.deck.length,  randomIndex;
    while (currentIndex != 0) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        // And swap it with the current element.
        [thisRoom.deck[currentIndex], thisRoom.deck[randomIndex]] = [thisRoom.deck[randomIndex], thisRoom.deck[currentIndex]];
    }
}

//Reset Deck
function resetDeck(data) {
    let thisRoom = RoomsData.get(data.gameId);
    if(data.hostSocketId == thisRoom.hostSocketId) {
        thisRoom.deck = [];
        thisRoom.dealerI = 0;
        thisRoom.deckI = 0;
    }    
}

//Host request the hidden host card
function getDealersHidden(gameId) {
    let thisRoom = RoomsData.get(gameId);
    io.to(gameId).emit('getDealersHiddenACK', thisRoom.deck[thisRoom.dealerI]);
}

//Clean up half made lobbies
function cleanUpLobbies() {
    RoomsData.forEach((value, key, map) => {
        if(value.hostSocketId == 'EMPTY') RoomsData.delete(key);
    });
}