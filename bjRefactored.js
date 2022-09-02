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
    // Player emits
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
    //Add Room to RoomsData
    if(RoomsData.has(gameId.toString()) != true) {
        let serverPacket = {hostSocketId: 'EMPTY', hostName: hostName, color: '0,0,0'}
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
    let roomData = RoomsData.get(gameId.toString());

    let R = Math.floor(Math.random() * 255);
    let G = Math.floor(Math.random() * 255);
    let B = Math.floor(Math.random() * 255);
    let randColor = R + ',' + G + ',' + B;
    
    roomData.color = randColor;
    roomData.hostSocketId = mySocket;

    RoomsData.set(gameId.toString(), roomData);}

//Join lobby
exports.joinGame = function(gameId, mySocket) {
    //Add Player to Game Room
    try {
        mySocket.join(gameId.toString());
        return true;
    } catch (error) {
        console.log(error);
        return false;}}


function hostCreateNewGame(data) {}
