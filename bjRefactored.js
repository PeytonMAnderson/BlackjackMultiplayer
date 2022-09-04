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
        let sock = soc;
        if(sock.rooms != undefined) {
            let lobbies = Array.from(sock.rooms); //Get Array of rooms the disconnecting user is in [0] = personal SocketId, [1] = Game Room Id (if any)
            console.log("User Disconnected: " + lobbies[0]);
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
    socket.on('joinSocket', joinSocket);
    socket.on('getName', getName);
    // Player emits
    socket.on('playerJoinREQ', playerJoinREQ);
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
    let room = RoomsData.get(data.gameId.toString());
    console.log(data.socketId + " is trying to connect to " + data.gameId);
    this.broadcast.to(room.hostSocketId.toString()).emit('playerJoinREQ', data);
}
