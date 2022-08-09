var io;
var socket;

var RoomsData = new Map();

exports.connectedToServer = function(sio, soc){
    io = sio;
    socket = soc;
    //Send Handshake ACK
    socket.emit('connected', socket.id);
    console.log('User Connected: ' + socket.id);
    //A player is disonnecting...
    socket.on('disconnecting', () => {
        let sock = soc;
        if(sock.rooms != undefined) {
            let lobbies = Array.from(sock.rooms); //Get Array of rooms the disconnecting user is in [0] = personal SocketId, [1] = Game Room Id (if any)
            if(lobbies.length > 1) {
                //Player is in a lobby
                let hostOfLobby = RoomsData.get(lobbies[1].toString()); //Get the host Socket Id of the lobby the player is in
                //If player is host, kick everyone
                if(lobbies[0] == hostOfLobby.hostSocketId) {
                    //Player is a host, destroy lobby
                    console.log('Host is leaving the lobby!');
                    sock.broadcast.to(lobbies[1].toString()).emit('hostLeavingOurLobby');   //Broadcast Host Left event
                    RoomsData.delete(lobbies[1].toString());    //Delete Game Room in Server List
                    io.in(lobbies[1].toString()).socketsLeave(lobbies[1].toString());   //Force everyone to leave the Game Room
                } else {
                    //Player is just a player
                    let myRoomData = RoomsData.get(lobbies[1].toString());
                    let data = {mySocketId: lobbies[0]}
                    sock.broadcast.to(myRoomData.hostSocketId.toString()).emit('userLeavingMyLobby', data);   //Send User who left to the Host
                }
            }
        }
    });
    // Host emits
    socket.on('hostCreateNewGame', hostCreateNewGame);
    socket.on('playerJoinACK', playerJoinACK);
    socket.on('userLeftOurLobby', userLeftOurLobby);
    socket.on('seatChangedACK', seatChangedACK);
    socket.on('readyChangedACK', readyChangedACK);
    socket.on('timeChangedACK', timeChangedACK);
    socket.on('gameStageChangedACK', gameStageChangedACK);
    socket.on('betChangedACK', betChangedACK);
    socket.on('dealChangedACK', dealChangedACK);
    socket.on('hitChangedACK', hitChangedACK);
    
    // Player emits
    socket.on('playerJoinAttempt', playerJoinAttempt);
    socket.on('seatChangedREQ', seatChangedREQ);
    socket.on('readyChangedREQ', readyChangedREQ);
    socket.on('betChangedREQ', betChangedREQ);
    socket.on('hitChangedREQ', hitChangedREQ);
}
//An error has occured, throw error to user that caused it
// data = {
//  cause: this
//  message: error
//}
function errorHandler(data) {
    let dataSend = {
        errorHappened: true,
        errorMessage: data.message
    }
    try{data.cause.emit('error', dataSend);} catch (error) {console.log(error);}
}
//A Person is trying to create a new lobby
// data = {
//  gameId:
//  myName:
//  mySocketId: 
//}
function hostCreateNewGame(data) {
    //Get a room id that doesnt exist yet
    let collide = true;
    let newGameId = 0;
    while(collide == true) {
        newGameId = ( Math.random() * 100000 ) | 0;
        newGameId = newGameId + 100000;
        if(RoomsData.has(newGameId.toString()) != true) {collide = false;} 
    }
    //Add Room to RoomsData
    let serverPacket = {hostSocketId: data.mySocketId}
    RoomsData.set(newGameId.toString(), serverPacket);
    //Add Host to Game Room
    try {
        this.join(newGameId.toString());
        //Send ACK back to Host
        let transmitData = {gameId: newGameId, hostSocketId: data.mySocketId, myName: data.myName}
        this.emit('newGameCreated', transmitData);
    } catch (error) {
        console.log(error);
        let errorPacket = {cause: this, message: error} 
        errorHandler(errorPacket);
    }
}
//A person is trying to join an existing lobby
// data = {
//  gameId:
//  myName:
//  mySocketId: 
//}
function playerJoinAttempt(data) {
    console.log('Player Attempting To Join lobby... ' + data.gameId);
    try {
        let roomAttempt = RoomsData.get(data.gameId.toString());
        let dataPacket = {gameId: data.gameId, myName: data.myName, mySocketId: data.mySocketId}
        this.broadcast.to(roomAttempt.hostSocketId.toString()).emit('playerJoiningAttempt', dataPacket);
    } catch (error) {
        console.log(error); 
        let errorPacket = {cause: this, message: error} 
        errorHandler(errorPacket);
    }
}
//The host has returned with an ACK whether or not a player can join
//data = {
//   errorHappened: T/F
//   requesterId:
//   gameId:
//   data:
//}
function playerJoinACK(data) {
    console.log('Player Joining lobby... ' + data.gameId);
    if(data.errorHappened == true) {
        //An error happened
        this.broadcast.to(data.requesterId.toString()).emit('error', data.data);
    } else {
        //Host Accepted New Player
        try {
            io.sockets.sockets.get(data.requesterId).join(data.gameId.toString());  //Join Game Room
            this.broadcast.to(data.requesterId.toString()).emit('playerJoinACK', data.data);    //Broadcast to requesting player 
            let transmitData = {Players: data.data.Players, LostPlayers: data.data.LostPlayers}
            this.broadcast.to(data.gameId.toString()).emit('aPlayerHasJoined', transmitData);   //Broadcast to rest of players
        } catch (error) {
            console.log(error); 
            let errorPacket = {cause: this, message: error} 
            errorHandler(errorPacket);
        }
    }
}
//A person is trying to leave our lobby
//data = {
//   gameId:
//   Players:
//   LostPlayers:
//}
function userLeftOurLobby(data) {
    this.broadcast.to(data.gameId.toString()).emit('aPlayerHasJoined', data);   //Broadcast to rest of players
}
//-----------------------------------------------------------------------
//Game Events
//-----------------------------------------------------------------------

//data = {
//    gameId:
//    mySocketId:
//    mySeat:
//    Players:
//}
function seatChangedREQ (data) {
    let gameRoom = RoomsData.get(data.gameId.toString());
    this.broadcast.to(gameRoom.hostSocketId.toString()).emit('seatChangedREQ', data);
}
function seatChangedACK (data) {this.broadcast.to(data.gameId.toString()).emit('seatChangedACK', data);}

//data = {
//    gameId:
//    mySocketId:
//    mySeat:
//    Players:
//}
function readyChangedREQ (data) {
    let gameRoom = RoomsData.get(data.gameId.toString());
    this.broadcast.to(gameRoom.hostSocketId.toString()).emit('readyChangedREQ', data);
}
function readyChangedACK (data) {this.broadcast.to(data.gameId.toString()).emit('readyChangedACK', data);}

//data = {
//    gameId:
//    [data]:
//}
function timeChangedACK (data) {this.broadcast.to(data.gameId.toString()).emit('timeChangedACK', data.timeLeft);}
function gameStageChangedACK (data) {this.broadcast.to(data.gameId.toString()).emit('gameStageChangedACK', data);}

//data = {
//    gameId:
//    updatePlayer:
//    betREQ:
//    mySocketId:
//}
function betChangedREQ (data) {
    let gameRoom = RoomsData.get(data.gameId.toString());
    this.broadcast.to(gameRoom.hostSocketId.toString()).emit('betChangedREQ', data);
}
function betChangedACK (data) {this.broadcast.to(data.gameId.toString()).emit('betChangedACK', data);}

function dealChangedACK (data) {this.broadcast.to(data.gameId.toString()).emit('dealChangedACK', data);}

//data = {
//    gameId:
//    updatePlayer:
//    hitREQ:
//    mySocketId:
//}
function hitChangedREQ (data) {
    let gameRoom = RoomsData.get(data.gameId.toString());
    this.broadcast.to(gameRoom.hostSocketId.toString()).emit('hitChangedREQ', data);
}
function hitChangedACK (data) {this.broadcast.to(data.gameId.toString()).emit('hitChangedACK', data);}