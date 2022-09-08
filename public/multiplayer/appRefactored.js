//#3 Attempt to open a new Socket IO port
var sockets = io();
// Array containing seats of people
var Seats = new Array();
//Map containting data of disconnecting players
var LostPlayersMap = new Map();
//Array containing the hand of the dealer
var dealerHand = new Array();
//Object containing public information for the entire lobby
var GameRoomData = {
    gameId: '0',               
    hostSocketId: '0',               
    color: '0,0,0',              
    playerCount: 1,              
    playerLimit: 8,               
    gameStage: 0,                
    round: 0,                
    turn: 0,               
    timeLeft: 'NULL',              
    DealerHand: dealerHand,               
    Seats: Seats,               
    LostPlayers: LostPlayersMap,            
}

//The name I have chosen for myself
var myName = '';
var timeSinceUpdate = 0;

jQuery(function($){    
    'use strict';

    /**
     * All the code relevant to Socket.IO is collected in the IO namespace.
     *
     * @type {{init: Function}}
     */

    //All information for IO 
    var IO = {
        //Initiate new socket with server upon loading of this file
        init : function() {
            IO.socket = sockets;
            IO.bindEvents();
        },

        //Wait for events from server
        bindEvents : function() {
            //Service Events
            IO.socket.on('connected', IO.onConnected ); //Server has sent handshake ACK
            IO.socket.on('error', IO.errorHandle ); //Server throws an error, display it
            IO.socket.on('getNameACK', IO.resolveName); //Determine if name is on the server for the host
            IO.socket.on('joinSocketACK', IO.joinSocketACK); //Determine if name is on the server for the host
            //Host Events
            IO.socket.on('playerJoinREQ', App.Host.playerJoinREQ); //Host determines if player can join
            IO.socket.on('playerLeft', App.Host.playerLeft); //A player has left the lobby
            IO.socket.on('seatChangeREQ', App.Host.seatChangeREQ); //A player is trying to change seats
            IO.socket.on('readyChangeREQ', App.Host.readyChangeREQ); //A player is trying to ready or unready
            IO.socket.on('betChangeREQ', App.Host.betChangeREQ); //A player is trying to ready or unready
            //Player Events
            IO.socket.on('gameUpdateACK', App.Player.gameUpdateACK); //Used for any game update during the game
            IO.socket.on('newCardACK', App.Player.newCardACK);
            IO.socket.on('hostLeft', App.Player.hostLeft);  //The host left, remove everyone
        },
        //#5 Socket Connected, attempt to join or create new room using game code
        onConnected : function(socID) {
            App.mySessionId = IO.socket.io.engine.id;
            App.mySocketId = socID;
            console.log('Connected! Session ID: ' + App.mySessionId);
            console.log('Connected! Socket ID: ' + App.mySocketId);

            //Get Room code from URL
            let path = window.location.pathname;
            let pathAry = path.split('/');
            let currentGameId = pathAry[pathAry.length-1];

            //POST to server to see if room is set up already
            let data = {gameId: currentGameId, mySocketId: App.mySocketId}
            var formBody = [];
            for (var property in data) {
                var encodedKey = encodeURIComponent(property);
                var encodedValue = encodeURIComponent(data[property]);
                formBody.push(encodedKey + "=" + encodedValue);
            }
            formBody = formBody.join("&");
            fetch(window.location.href, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
                },
                body: formBody
            });

            //See if name exists on server
            let newData = {gameId: currentGameId, socketId: App.mySocketId}
            GameRoomData.gameId = currentGameId;
            try {IO.socket.emit("getName", newData);} catch (error) {console.log(error);}
        },
        //If name, if not get name from user
        resolveName : function(name) {
            if(name != 'NULL') {
                try {IO.socket.emit("joinSocket", GameRoomData.gameId); myName = name;} catch (error) {console.log(error);}
            } else {
                App.$gameArea.html(App.$templateJoinGame);
            }
        },
        joinSocketACK : function(data) {
            if(data.joined) {
                App.$gameArea.html(App.$templatePlayerLobby);
                GameRoomData.color = data.color;
                document.getElementById("t3").innerHTML = myName;   //Add name to top bar
                document.getElementById("t2").innerHTML = GameRoomData.gameId;  //Add gameId to top bar
                document.getElementById("t1").innerHTML = GameRoomData.playerCount + '/' + GameRoomData.playerLimit;    //Add playercount to top bar
                initSeats();
                updatePlayer(myName, [], sockets.id, 2000, 0, false, false, 'NULL', 0);
                GameRoomData.hostSocketId = sockets.id;
                runJavaScriptApp();
            } else {console.log("Failed to join game");}
        },
        //Display Error from server
        errorHandle : function(error) {
            console.log('ERROR');
            console.log(error.message);
        }
    };
    //All information for App
    var App = {
        //Upon load of this file, cache elements and start waiting for events
        init: function () {
            App.cacheElements();
            App.bindEvents();
        },
        //Elements of the hmtl file
        cacheElements : function () {
            App.$doc = $(document);
            // Templates
            App.$gameArea = $('#gameArea');
            App.$templateJoinGame = $('#black-main-join').html();
            App.$templatePlayerLobby = $('#black-canvas-player').html();
            App.$templateReturn = $('#black-main-left').html();
        },
        //Wait for hmtl events
        bindEvents : function () {
            // Host
            // Player
            App.$doc.on('click', '#btnSendName', App.Player.sendName);
            App.$doc.on('click', '#btnReturn', App.Player.returnBack);
        },
        Player : {
            //#7 Send joining player's name for host to check
            sendName : function() {
                let joinName = $('#inputPlayerName').val() || 'anon';
                myName = joinName;
                let data = {name: joinName, socketId: App.mySocketId, gameId: GameRoomData.gameId}
                IO.socket.emit('playerJoinREQ', data);
            },
            gameUpdateACK : function (data) {
                if(GameRoomData.timeLeft !=  data.timeLeft) timeSinceUpdate = 0;
                LostPlayersMap = new Map(JSON.parse(data.LostPlayers));
                //Player is new to this game
                if(GameRoomData.hostSocketId != data.hostSocketId) {
                    App.$gameArea.html(App.$templatePlayerLobby);
                    runJavaScriptApp();
                }
                //Update everything for everyone
                GameRoomData = {
                    gameId: data.gameId,               
                    hostSocketId: data.hostSocketId,               
                    color: data.color,              
                    playerCount: data.playerCount,              
                    playerLimit: data.playerLimit,               
                    gameStage: data.gameStage,                
                    round: data.round,                
                    turn: data.turn,               
                    timeLeft: data.timeLeft,              
                    DealerHand: data.DealerHand,               
                    Seats: data.Seats,               
                    LostPlayers: LostPlayersMap,            
                }
                document.getElementById("t3").innerHTML = myName;   //Add name to top bar
                document.getElementById("t2").innerHTML = GameRoomData.gameId;  //Add gameId to top bar
                document.getElementById("t1").innerHTML = GameRoomData.playerCount + '/' + GameRoomData.playerLimit;    //Add playercount to top bar
            },
            newCardACK : function (data) {
                if(data.dealersFirst) {
                } else {
                    GameRoomData.Seats[data.player.seat] = data.player;
                }
            },
            hostLeft : function () {
                App.$gameArea.html(App.$templateReturn);
                clearEverything();},
            returnBack : function () {location.href = location.protocol + '//' + location.host + '/multiplayer';}
        },
        Host : {
            //Player is trying to join lobby with name
            playerJoinREQ : function(data) {
                console.log("Player " + data.name + " is trying to join my lobby " + data.gameId);
                for(let i = 0; i < GameRoomData.playerLimit; i++) {
                    //Check if player is already in the lobby
                    if(GameRoomData.Seats[i] != 'EMPTY' && GameRoomData.Seats[i] != null) {
                        if(GameRoomData.Seats[i].myName == data.name) {console.log("Player already in game!"); return;}
                    }
                }
                //If lobby is already full
                if(GameRoomData.playerCount >= GameRoomData.playerLimit) {console.log("Lobby is already full!"); return;}
                //If player exists in Lost Players
                let ind = 0;
                if(GameRoomData.LostPlayers.has(data.name)) {
                    //Player is a previous player
                    let returningPlayer = GameRoomData.LostPlayers.get(data.name);
                    if(GameRoomData.Seats[returningPlayer.seat] == 'EMPTY') {
                        //If seat is still open, just copy data to seat
                        ind = returningPlayer.seat;
                    } else {
                        //If seat is not open, but still room in lobby, find new seat
                        while(GameRoomData.Seats[ind] != 'EMPTY' && ind < GameRoomData.playerLimit) {ind++;}
                        if(GameRoomData.Seats[ind] != 'EMPTY') {console.log('Unable to find empty seat!'); return;}
                    }
                    updatePlayer(returningPlayer.myName, 
                        returningPlayer.myHand, 
                        data.socketId,
                        returningPlayer.bank, 
                        returningPlayer.bet, 
                        returningPlayer.ready, 
                        returningPlayer.fold, 
                        returningPlayer.win, 
                        ind);
                    GameRoomData.LostPlayers.delete(returningPlayer.myName);
                } else {
                    //Completely new player
                    if(GameRoomData.gameStage != 0) {console.log("Cannot add new player in middle of game!"); return;}
                    while(GameRoomData.Seats[ind] != 'EMPTY' && ind < GameRoomData.playerLimit) {ind++;}
                    if(GameRoomData.Seats[ind] != 'EMPTY') {console.log('Unable to find empty seat!'); return;}
                    //Empty seat is available
                    updatePlayer(data.name, [], data.socketId, 2000, 0, false, false, 'NULL', ind);
                }
                GameRoomData.playerCount++;
                requestPlayerToJoin(ind);
                sendGameUpdate();
            },
            playerLeft : function (data) {
                for (let i = 0; i < GameRoomData.playerLimit; i++) {
                    if(GameRoomData.Seats[i].mySocket == data.mySocket) {
                        LostPlayersMap.set(GameRoomData.Seats[i].myName, GameRoomData.Seats[i]);
                        GameRoomData.Seats[i] = 'EMPTY';
                        GameRoomData.playerCount--;
                        sendGameUpdate();
                    }
                }
            },
            seatChangeREQ : function (data) {
                if(GameRoomData.Seats[data.updateData] == 'EMPTY') {
                    GameRoomData.Seats[data.updateData] = GameRoomData.Seats[data.player.seat];
                    GameRoomData.Seats[data.player.seat] = 'EMPTY';
                    GameRoomData.Seats[data.updateData].seat = data.updateData;
                    sendGameUpdate();
                }
            },
            readyChangeREQ : function (data) {
                if(GameRoomData.Seats[data.player.seat].ready == true) {
                    GameRoomData.Seats[data.player.seat].ready = false;
                } else {
                    GameRoomData.Seats[data.player.seat].ready = true;
                }
                sendGameUpdate();
            },
            betChangeREQ : function (data) {
                let thePlayer = GameRoomData.Seats[data.player.seat];
                switch(data.updateData) {
                    case 'Bet':
                        thePlayer.ready = true; thePlayer.fold = false; sendGameUpdate();
                        break;
                    case 'Clear':
                        thePlayer.bank = thePlayer.bank + thePlayer.bet; thePlayer.bet = 0; sendGameUpdate();
                        break;
                    case 'Fold':
                        thePlayer.bank = thePlayer.bank + thePlayer.bet; thePlayer.bet = 0;
                        thePlayer.ready = false; thePlayer.fold = true; sendGameUpdate();
                        break;
                    case '$1':
                        if(thePlayer.bank >= 1) {thePlayer.bank = thePlayer.bank - 1; thePlayer.bet = thePlayer.bet + 1; sendGameUpdate();}
                        break;
                    case '$10':
                        if(thePlayer.bank >= 10) {thePlayer.bank = thePlayer.bank - 10; thePlayer.bet = thePlayer.bet + 10; sendGameUpdate();}
                        break;
                    case '$100':
                        if(thePlayer.bank >= 100) {thePlayer.bank = thePlayer.bank - 100; thePlayer.bet = thePlayer.bet + 100; sendGameUpdate();}
                        break;
                    case '$1000':
                        if(thePlayer.bank >= 1000) {thePlayer.bank = thePlayer.bank - 1000; thePlayer.bet = thePlayer.bet + 1000; sendGameUpdate();}
                        break;
                }
            }
        }
    };
    IO.init();
    App.init();
 }($));
 function initSeats() {
    for(let i = 0; i < GameRoomData.playerLimit; i++) {
        GameRoomData.Seats[i] = 'EMPTY';
    }
 }
 function updatePlayer(myName, myHand, mySocket, bank, bet, ready, fold, win, seatIndex) {
    let player = {
        myName: myName,
        myHand: myHand,
        mySocket: mySocket,
        bank: bank,
        bet: bet,
        ready: ready,
        fold: fold,
        win: win,
        seat: seatIndex
    }
    GameRoomData.Seats[seatIndex] = player;
 }
 function sendGameUpdate() {
    let LostPlayersJSON = JSON.stringify(Array.from(GameRoomData.LostPlayers));
    let transmitData = {
        gameId: GameRoomData.gameId,
        hostSocketId: GameRoomData.hostSocketId,
        gameStage: GameRoomData.gameStage,
        playerCount: GameRoomData.playerCount,
        playerLimit: GameRoomData.playerLimit,
        color: GameRoomData.color,              
        round: GameRoomData.round,                
        turn: GameRoomData.turn,               
        timeLeft: GameRoomData.timeLeft,              
        DealerHand: GameRoomData.DealerHand,               
        Seats: GameRoomData.Seats,               
        LostPlayers: LostPlayersJSON,    
    }
    document.getElementById("t3").innerHTML = myName;   //Add name to top bar
    document.getElementById("t2").innerHTML = GameRoomData.gameId;  //Add gameId to top bar
    document.getElementById("t1").innerHTML = GameRoomData.playerCount + '/' + GameRoomData.playerLimit;    //Add playercount to top bar
    sockets.emit('gameUpdate', transmitData);
 }
 function requestPlayerToJoin(seatIndex) {
    let data = {Player: GameRoomData.Seats[seatIndex], gameId: GameRoomData.gameId}
    sockets.emit('requestPlayerToJoin', data);
 }
 function clearEverything() {
    dealerHand = [];
    Seats = [];
    LostPlayersMap = {};
    myName = '';
    GameRoomData = {
        gameId: '0',               
        hostSocketId: '0',               
        color: '0,0,0',              
        playerCount: 1,              
        playerLimit: 8,               
        gameStage: 0,                
        round: 0,                
        turn: 0,               
        timeLeft: 'NULL',              
        DealerHand: dealerHand,               
        Seats: Seats,               
        LostPlayers: LostPlayersMap,            
    }
    cancelAnimationFrame(reqAnim);
    startTimer = false;
    beginTime = 0;
    timeElapsed = 0;
    FPS = 0;
 }

 //Send Data Packet
function sendUserData(requestName, updateData) {
    let player = findMe();
    let data = {gameId: GameRoomData.gameId, player: player, updateData: updateData}
    let transmitData = {req: requestName, pack: data}
    sockets.emit('gameChangeREQ', transmitData);
}