//Attempt to open a new Socket IO port
var sockets = io();
//Map containing information for all users in lobby
var PlayersMap = new Map();
// Player = {myName: mySeat: bank: bet: ready: }
//Map containing information for all users that have left the lobby 
var LostPlayersMap = new Map();
//Array containing information for each seat, including if and who is sitting there
var SeatArray = new Array();
//Array containing clientSide x,y location for each seat
var SeatCoordsArray = new Array();
//Map to keep track of all the of the dealer and myself
var dealerHand = new Array();
var myHand = new Array();
var littleCards = new Array();
var cardSize = 0;
var pad;
//Object containing information the entire lobby
var GameRoomData = {gameId: '0', hostSocketId: '0', color: '0,0,0,',playerCount: 0,playerLimit: 0, gameStage: 0, round: 0, timeLeft: 'NULL', turn: 0, DealerHand: [], Players: PlayersMap, LostPlayers: LostPlayersMap, Seats: SeatArray}

//Globally Declare Canvas context
var canvas;
var menu;
var ctx;
var width;
var height;

//Keeps track if new card is in motion
var isDealing = false;
// [0] = {Card}
//Animation Variables
var reqAnim;
var previousTimeStamp;
var startTimer = false;
var beginTime = 0;
var timeElapsed = 0;
var FPS = 0;

//Load Image Resources
var tableImage = new Image();
tableImage.src = 'https://cdn.glitch.global/49c43ddd-2b58-4c85-a71b-d68711b76a74/table.png?v=1649799164714';
var cardBack = new Image();
cardBack.src = 'https://cdn.glitch.global/49c43ddd-2b58-4c85-a71b-d68711b76a74/cardBack.png?v=1649800278736';
var cardFront = new Image();
cardFront.src = 'https://cdn.glitch.global/49c43ddd-2b58-4c85-a71b-d68711b76a74/cardFront.png?v=1649800535280';
var clubImage = new Image();
clubImage.src = 'https://cdn.glitch.global/49c43ddd-2b58-4c85-a71b-d68711b76a74/club.png?v=1649389703140';
var spadeImage = new Image();
spadeImage.src = 'https://cdn.glitch.global/49c43ddd-2b58-4c85-a71b-d68711b76a74/spade.png?v=1649389711914';
var heartImage = new Image();
heartImage.src = 'https://cdn.glitch.global/49c43ddd-2b58-4c85-a71b-d68711b76a74/heart.png?v=1649389709696';
var diamondImage = new Image();
diamondImage.src ='https://cdn.glitch.global/49c43ddd-2b58-4c85-a71b-d68711b76a74/diamond.png?v=1649389707365';

//Other Globally required variables
var deckLoc;
//-------------------------------------------------

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

            //Host Events
            IO.socket.on('newGameCreated', App.Host.onServerMadeRoom ); //The server as made a new Room for me
            IO.socket.on('playerJoiningAttempt', App.Host.playerJoiningAttempt ); //A player is attempting to join my lobby
            IO.socket.on('userLeavingMyLobby', App.Host.playerLeavingMyLobby ); //A player is attempting to join my lobby
            IO.socket.on('seatChangedREQ', App.Host.seatChangeREQ ); //A player is attempting to change their seat
            IO.socket.on('readyChangedREQ', App.Host.readyChangeREQ ); //A player is attempting to change their seat
            IO.socket.on('betChangedREQ', App.Host.betChangeREQ ); //A player is attempting to change their seat
            
            //Player Events
            IO.socket.on('playerJoinACK', App.Player.myselfhasJoined ); //The Host has ACK my request to join
            IO.socket.on('aPlayerHasJoined', App.Player.aPlayerHasJoined ); //A player has joined our lobby
            IO.socket.on('userLeavingOurLobby', App.Player.playerLeavingOurLobby ); //A player is attempting to join my lobby
            IO.socket.on('hostLeavingOurLobby', App.Player.hostLeavingOurLobby ); //A player is attempting to join my lobby
            IO.socket.on('seatChangedACK', App.Player.seatChangeACK ); //A player seat has changed
            IO.socket.on('readyChangedACK', App.Player.readyChangeACK ); //A player seat has changed
            IO.socket.on('timeChangedACK', App.Player.timeChangeACK ); //A player seat has changed
            IO.socket.on('gameStageChangedACK', App.Player.gameStageChangeACK ); //A player seat has changed
            IO.socket.on('betChangedACK', App.Player.betChangeACK ); //A player seat has changed
            IO.socket.on('dealChangedACK', App.Player.dealChangeACK ); //A player seat has changed
        },
        //I have made a new socket with the sever (main menu screen)
        onConnected : function(socID) {
            App.mySessionId = IO.socket.io.engine.id;
            App.mySocketId = socID;
            console.log('Connected! Session ID: ' + App.mySessionId);
            console.log('Connected! Socket ID: ' + App.mySocketId);
            App.$gameArea.html(App.$blackMainMenu);
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
            App.$blackMainMenu = $('#black-main-menu').html();
            App.$templateJoinGame = $('#black-main-join').html();
            App.$templateCreateGame = $('#black-main-create').html();
            App.$templateHostLobby = $('#black-canvas-host').html();
            App.$templatePlayerLobby = $('#black-canvas-player').html();
            App.$templateReturn = $('#black-main-left').html();
        },
        //Wait for hmtl events
        bindEvents : function () {
            // Host
            App.$doc.on('click', '#btnCreateGame', App.Host.onClickedCreate);
            App.$doc.on('click', '#btnStartCreateGame', App.Host.onClickedCreateStart);
            // Player
            App.$doc.on('click', '#btnJoinGame', App.Player.onClickedJoin);
            App.$doc.on('click', '#btnStartJoinGame', App.Player.onClickedJoinStart);
            App.$doc.on('click', '#btnReturn', () => {App.$gameArea.html(App.$blackMainMenu);});
        },
        Player : {
            //User has clicked the join button, display new html options
            onClickedJoin : function() {
                App.$gameArea.html(App.$templateJoinGame);
            },
            //The user has inputted information and tried to join game, send information and request to server
            onClickedJoinStart : function() {
                console.log('Joining Lobby...');
                //Create data packet to send to server with game ID request and player name!
                let data = {
                    gameId : +($('#inputGameId').val()),
                    myName : $('#inputPlayerName').val() || 'anon',
                    mySocketId: sockets.id
                };
                console.log('GameID: ' + data.gameId + ' PlayerName: ' + data.myName);
                
                //Send Packet
                if(data.myName != 'anon' && data.myName != undefined) {
                    try {IO.socket.emit('playerJoinAttempt', data);} catch (error) {console.log(error);}
                } else {console.log('INPUT A NAME!');}
            },
            //I have successfully connected the the lobby, begin Application
            //  gameId: '0', 
            //  hostSocketId: '0', 
            //  color: '0,0,0,',
            //  playerCount: 0,
            //  playerLimit: 0, 
            //  gameStage: 0,
            //  timeLeft: 0,
            //  Players: PlayersMapJSON,
            //  LostPlayers: LostPlayersMapJSON
            //}
            myselfhasJoined : function(data) {
                console.log('Lobby Joined!');
                //Update GameRoomData
                GameRoomData.gameId = data.gameId;
                GameRoomData.hostSocketId = data.hostSocketId;
                GameRoomData.color = data.color;
                GameRoomData.playerCount = data.playerCount;
                GameRoomData.playerLimit = data.playerLimit;
                GameRoomData.gameStage = data.gameStage;
                GameRoomData.timeLeft = data.timeLeft;
                GameRoomData.turn = data.turn;
                GameRoomData.Seats = data.Seats;
                GameRoomData.DealerHand = data.dealerHand;
                let newPlayerMap = new Map(JSON.parse(data.Players));
                GameRoomData.Players = newPlayerMap;
                let newLostPlayerMap = new Map(JSON.parse(data.LostPlayers));
                GameRoomData.LostPlayers = newLostPlayerMap;
                //Update HTML
                App.$gameArea.html(App.$templatePlayerLobby);
                let meThePlayer = GameRoomData.Players.get(sockets.id.toString());  //Get myself from the Map of Players
                document.getElementById("t3").innerHTML = meThePlayer.myName;   //Add name to top bar
                document.getElementById("t2").innerHTML = GameRoomData.gameId;  //Add gameId to top bar
                document.getElementById("t1").innerHTML = GameRoomData.playerCount + '/' + GameRoomData.playerLimit;    //Add playercount to top bar
                updateSeatArray();
                runJavaScriptApp();
                resetLocalArrays();
                restoreLocalArrays();
            },
            // data = {
            //  Players: JSON
            //  LostPlayers: JSON
            //}
            aPlayerHasJoined: function (data) {
                GameRoomData.Players = new Map(JSON.parse(data.Players));
                GameRoomData.LostPlayers = new Map(JSON.parse(data.LostPlayers));
                let playerCounter = 0;
                GameRoomData.Players.forEach(cout);
                function cout() {playerCounter++;}
                GameRoomData.playerCount = playerCounter;
                document.getElementById("t1").innerHTML = GameRoomData.playerCount + '/' + GameRoomData.playerLimit;
                updateSeatArray();
                resetLocalArrays();
                restoreLocalArrays();
            },
            playerLeavingOurLobby: function (data) {
                GameRoomData.Players = new Map(JSON.parse(data.Players));
                GameRoomData.LostPlayers = new Map(JSON.parse(data.LostPlayers));
                let playerCounter = 0;
                GameRoomData.Players.forEach(cout);
                function cout() {playerCounter++;}
                GameRoomData.playerCount = playerCounter;
                updateSeatArray();
                resetLocalArrays();
                restoreLocalArrays();
                document.getElementById("t1").innerHTML = GameRoomData.playerCount + '/' + GameRoomData.playerLimit;
            },
            hostLeavingOurLobby: function () {
                console.log('THE HOST HAS DISBANDED THE LOBBY');
                GameRoomData = {gameId: '0', hostSocketId: '0', color: '0,0,0,',playerCount: 0,playerLimit: 0, turn: 0, gameStage: 0, round: 0, timeLeft: 'NULL', Players: PlayersMap, LostPlayers: LostPlayersMap, Seats: SeatArray} //Reset game settings
                window.cancelAnimationFrame(reqAnim);   //Stop the Game
                resetLocalArrays();
                App.$gameArea.html(App.$templateReturn);    //Bring Return to main menu screen
            },
            //-------------------------------------------------------------------------------------------------
            //APP CODE
            //-------------------------------------------------------------------------------------------------
            seatChangeACK: function (data) {GameRoomData.Players = new Map(JSON.parse(data.Players)); updateSeatArray();},
            readyChangeACK: function (data) {GameRoomData.Players = new Map(JSON.parse(data.Players));},
            timeChangeACK: function (data) {GameRoomData.timeLeft = data;},
            gameStageChangeACK: function (data) {GameRoomData.gameId = data.gameId; GameRoomData.hostSocketId = data.hostSocketId;
                GameRoomData.playerCount = data.playerCount; GameRoomData.playerLimit = data.playerLimit; 
                GameRoomData.gameStage = data.gameStage; GameRoomData.timeLeft = data.timeLeft;
                GameRoomData.Players = new Map(JSON.parse(data.Players)); GameRoomData.color = data.color;
            },
            betChangeACK: function (data) {GameRoomData.Players.set(data.mySocketId.toString(), data.updatePlayer);},
            dealChangeACK: function (data) {
                if(sockets.id.toString() != GameRoomData.hostSocketId && sockets.id != GameRoomData.hostSocketId) {
                    GameRoomData.Players = new Map(JSON.parse(data.Players));
                    GameRoomData.DealerHand = data.dealerHand;
                    GameRoomData.turn = data.turn;
                    if(data.updatePlayerId == 'DEALER') {   //New card coming in is for the dealer
                        if(dealerHand.length == 0) {dealerHand[dealerHand.length] = new Card(deckLoc.x, deckLoc.y, data.updateCard, 'BACK', true);} else {
                            dealerHand[dealerHand.length] = new Card(deckLoc.x, deckLoc.y, data.updateCard, 'FRONT', true, 0);}
                        dealerHand[dealerHand.length-1].animateCardTo(deckLoc.x+height/8, deckLoc.y, 500, ctx);
                    } else {    //New card coming in is for a Player
                        let updatePlayer = GameRoomData.Players.get(data.updatePlayerId.toString());
                        if(data.updatePlayerId.toString() == sockets.id.toString()) {   //If card coming in is mine
                            let cardLoc = findCoordsForCard('BIG', updatePlayer, myHand.length);
                            myHand[myHand.length] = new Card(cardLoc.x, cardLoc.y, data.updateCard, 'FRONT', true, 0);}
                        updatePlayer.Hand[updatePlayer.Hand.length] = data.updateCard;
                        littleCards[littleCards.length] = {Card: {}, Player: {}}
                        littleCards[littleCards.length-1].Player = updatePlayer;
                        let cardLoc = findCoordsForCard('LITTLE', updatePlayer, littleCards.length-1);
                        littleCards[littleCards.length-1].Card = new Card(deckLoc.x, deckLoc.y, data.updateCard, 'FRONT', false, cardLoc.rad);
                        littleCards[littleCards.length-1].Card.animateCardTo(cardLoc.x, cardLoc.y, 500, ctx);
                        GameRoomData.Players.set(data.updatePlayerId.toString(), updatePlayer);}
                    updateSeatArray();}}
        },
        Host : {
            //Once the Create button is pressed, change html to display new options
            onClickedCreate : function() {
                App.$gameArea.html(App.$templateCreateGame);
            },
            //Once the Create new lobby button is pressed, send create lobby request to server
            onClickedCreateStart : function() {
                console.log('Creating Lobby...');
                //Create Packet with name entered
                let data = {
                    gameId: 0,
                    myName : $('#inputPlayerName').val() || 'anon',
                    mySocketId: sockets.id
                };
                console.log(' PlayerName: ' + data.myName + ' Id: ' + data.mySocketId + ' gameId: ' + data.gameId);
                //Send Packet
                if(data.myName != 'anon' && data.myName != undefined) {
                    try {IO.socket.emit('hostCreateNewGame', data);} catch (error) {console.log(error);}
                } else {console.log('INPUT A NAME!');}
            },

            //The Server has created a new room, getting information from server and display new custom lobby
            // data = {
            //    gameId:
            //    hostSocketId:
            //}
            onServerMadeRoom : function(data) {
                console.log('Lobby Created!');
                //Create GameRoomData information
                GameRoomData.hostSocketId = data.hostSocketId;
                GameRoomData.gameId = data.gameId;
                GameRoomData.playerCount = 1;
                GameRoomData.playerLimit = 8;
                GameRoomData.timeLeft = 'NULL';
                GameRoomData.gameStage = 0;
                GameRoomData.round = 0;
                let R = Math.floor(Math.random() * 255);
                let G = Math.floor(Math.random() * 255);
                let B = Math.floor(Math.random() * 255);
                let randColor = R + ',' + G + ',' + B;
                GameRoomData.color = randColor;
                let playerData = {myName: data.myName,  mySeat: 0, mySocketId: sockets.id,  bank: 2000, bet: 0, ready: false, fold: false, Hand: []}
                GameRoomData.Players.set(sockets.id.toString(), playerData);    //Add Player to the GameRoomData
                for(let i = 1; i <= GameRoomData.playerLimit; i++) {GameRoomData.Seats[i] = {occupied: false};}      //Create an array for each seat whether they are occupied or not
                //Update HTML
                App.$gameArea.html(App.$templateHostLobby);
                document.getElementById("t2").innerHTML = GameRoomData.gameId;
                document.getElementById("t1").innerHTML = GameRoomData.playerCount + '/' + GameRoomData.playerLimit;
                runJavaScriptApp();
            },
            //data = {
            //    gameId:
            //    myName: 
            //    mySocketId:
            //}
            playerJoiningAttempt: function(data) {
                //If room is not full
                if(GameRoomData.playerCount < GameRoomData.playerLimit) {
                    //Check if player with same name is currently in the lobby then block
                    let playerAlreadyExists = false;
                    GameRoomData.Players.forEach(cout);
                    function cout(value, key, map){if(value.myName == data.myName) playerAlreadyExists = true;}
                    if(playerAlreadyExists == false) {
                        //If Player is a lost Player or New Player
                        let isLost = false;
                        let isLostId = '';
                        GameRoomData.LostPlayers.forEach(cout2);
                        function cout2(value, key, map) {if(data.myName == value.myName) {isLost = true; isLostId = key;}}   //Check if player is in Lost Player Map
                        let broadcast = true;
                        try {
                            if(isLost == true) {
                                //Player is an Old player
                                let lostData = GameRoomData.LostPlayers.get(isLostId.toString());      //Retrieve Lost Player data from memory
                                if(GameRoomData.gameStage == 0 || GameRoomData.gameStage == '0') {      //Update Lost Player's Seat if needed
                                    lostData.mySeat = findOpenSeat(true, false, lostData);} else {
                                    lostData.mySeat = findOpenSeat(true, true, lostData);}
                                GameRoomData.Players.set(data.mySocketId.toString(), lostData);        //Add Lost Player Data back into Player Data
                                GameRoomData.LostPlayers.delete(data.mySocketId.toString());        //Remove Player in Lost Player List
                            } else {
                                //Player is a New Player
                                    let newPlayerData = {myName: data.myName,  mySeat: 0, mySocketId: data.mySocketId, bank: 2000, bet: 0, ready: false, fold: false, Hand: []}  //Create new Player Object
                                    if(GameRoomData.gameStage == 0 || GameRoomData.gameStage == '0') {      //Update New Player's Seat if needed
                                        newPlayerData.mySeat = findOpenSeat(false, false, newPlayerData);} else {
                                        newPlayerData.mySeat = findOpenSeat(false, true, newPlayerData);}
                                    GameRoomData.Players.set(data.mySocketId.toString(), newPlayerData);    //Add new Player Object to Player List
                            }
                            let playerCounter = 0;  //Create Counter
                            GameRoomData.Players.forEach(cout);
                            function cout() {playerCounter++;}  //Count how many players in lobby
                            GameRoomData.playerCount = playerCounter;
                            document.getElementById("t1").innerHTML = GameRoomData.playerCount + '/' + GameRoomData.playerLimit;    //Update playerCounter on HTML
                            updateSeatArray();
                            resetLocalArrays();
                            restoreLocalArrays();
                            console.log('Player Joining');
                            let PlayersJSON = JSON.stringify(Array.from(GameRoomData.Players)); //Create Data Packet to be sent over the internet
                            let LostPlayersJSON = JSON.stringify(Array.from(GameRoomData.LostPlayers));
                            let transmitData = {gameId: GameRoomData.gameId,hostSocketId: GameRoomData.hostSocketId,color: GameRoomData.color,playerCount: GameRoomData.playerCount,playerLimit: GameRoomData.playerLimit, 
                                gameStage: GameRoomData.gameStage, round: GameRoomData.round, timeLeft: GameRoomData.timeLeft, turn: GameRoomData.turn, Players: PlayersJSON,LostPlayers: LostPlayersJSON, Seats: GameRoomData.Seats, dealerHand: GameRoomData.DealerHand}
                            let dataPacket = {errorHappened: false, requesterId: data.mySocketId, gameId: data.gameId, data: transmitData}  //Transmit new PLayer to all if success
                            if(broadcast == true) {IO.socket.emit('playerJoinACK', dataPacket);}    //Broadcast New Player Listings
                        } catch (error) {
                                console.log('FAILED TO ADD PLAYER...');
                                console.log(error);
                                let dataPacket = {errorHappened: true, requesterId: data.mySocketId, gameId: data.gameId, data: error}  //Transmit error to new Player if fail
                                IO.socket.emit('playerJoinACK', dataPacket);
                        }
                    } else {
                        console.log('PLAYER ALREADY IS IN GAME');
                        let dataPacket = {errorHappened: true, requesterId: data.mySocketId, gameId: data.gameId, data: 'PLAYER ALREADY EXISTS'} //Trasmit error to new Player if room full
                        IO.socket.emit('playerJoinACK', dataPacket);
                    }
                } else {
                    console.log('ROOM IS FULL');
                    let dataPacket = {errorHappened: true, requesterId: data.mySocketId, gameId: data.gameId, data: 'ROOM IS FULL'} //Trasmit error to new Player if room full
                    IO.socket.emit('playerJoinACK', dataPacket);
                }
            },
            //data = {
            //    mySocketId:
            //}
            playerLeavingMyLobby: function (data) {
                let leavingPlayer = GameRoomData.Players.get(data.mySocketId.toString());   //Retrieve the leaving player from the Player list
                GameRoomData.LostPlayers.set(data.mySocketId.toString(), leavingPlayer);    //Add leaving player to Lost Player List
                GameRoomData.Players.delete(data.mySocketId.toString());    //Remove Player from Players List
                updateSeatArray();
                let PlayersJSON = JSON.stringify(Array.from(GameRoomData.Players));
                let LostPlayersJSON = JSON.stringify(Array.from(GameRoomData.LostPlayers));
                let transmitData = {gameId: GameRoomData.gameId, Players: PlayersJSON, LostPlayers: LostPlayersJSON, Seats: SeatArray}
                IO.socket.emit('userLeftOurLobby', transmitData);  //Send new Player information to the Game Room
                let playerCounter = 0;
                GameRoomData.Players.forEach(cout);
                function cout() {playerCounter++;}
                GameRoomData.playerCount = playerCounter;
                document.getElementById("t1").innerHTML = GameRoomData.playerCount + '/' + GameRoomData.playerLimit;
            },
            //-------------------------------------------------------------------------------------------------
            //APP CODE
            //-------------------------------------------------------------------------------------------------
            //data = {
            //    gameId:
            //    mySocketId:
            //    mySeat:
            //}
            seatChangeREQ: function (data) {
                let collide = false;
                GameRoomData.Players.forEach(cout);
                function cout (value, key, map) {if(value.mySeat == data.mySeat) collide = true;}
                if(collide == false) {
                    let changePlayer = GameRoomData.Players.get(data.mySocketId.toString());
                    changePlayer.mySeat = data.seatREQ;
                    GameRoomData.Players.set(data.mySocketId.toString(), changePlayer);
                    updateSeatArray();
                    let PlayersJSON = JSON.stringify(Array.from(GameRoomData.Players));
                    let transmitData = {gameId: GameRoomData.gameId, mySocketId: data.mySocketId, Players: PlayersJSON}
                    IO.socket.emit('seatChangedACK', transmitData);
                }
            },
            //data = {
            //    gameId:
            //    mySocketId:
            //    ready:
            //}
            readyChangeREQ: function (data) {
                let tempPlayer = GameRoomData.Players.get(data.mySocketId.toString());
                tempPlayer.ready = data.ready;
                GameRoomData.Players.set(data.mySocketId.toString(), tempPlayer);
                let PlayersJSON = JSON.stringify(Array.from(GameRoomData.Players));
                let transmitData = {gameId: data.gameId, mySocketId: data.mySocketId, Players: PlayersJSON}
                IO.socket.emit('readyChangedACK', transmitData);
            },
            //data = {
            //    gameId:
            //    updatePlayer:
            //    betREQ:
            //    mySocketId:
            //}
            betChangeREQ: function (data) {
                let tempPlayer = GameRoomData.Players.get(data.mySocketId.toString());
                if(data.betREQ == 'Bet') {tempPlayer.ready = true; tempPlayer.fold = false;}
                else if(data.betREQ == 'Fold') {tempPlayer.fold = true; tempPlayer.ready = false; tempPlayer.bank = tempPlayer.bank + tempPlayer.bet; tempPlayer.bet = 0;}
                else if(data.betREQ == 'Clear') {tempPlayer.bank = tempPlayer.bank + tempPlayer.bet; tempPlayer.bet = 0;}
                else if(data.betREQ == 'd1') {if(tempPlayer.bank >= 1) {tempPlayer.bank = tempPlayer.bank - 1; tempPlayer.bet = tempPlayer.bet + 1;}}
                else if(data.betREQ == 'd10') {if(tempPlayer.bank >= 10) {tempPlayer.bank = tempPlayer.bank - 10; tempPlayer.bet = tempPlayer.bet + 10;}}
                else if(data.betREQ == 'd100') {if(tempPlayer.bank >= 100) {tempPlayer.bank = tempPlayer.bank - 100; tempPlayer.bet = tempPlayer.bet + 100;}}
                else if(data.betREQ == 'd1000') {if(tempPlayer.bank >= 1000) {tempPlayer.bank = tempPlayer.bank - 1000; tempPlayer.bet = tempPlayer.bet + 1000;}}
                GameRoomData.Players.set(data.mySocketId.toString(), tempPlayer);
                let transmitData = {gameId: data.gameId, mySocketId: data.mySocketId, updatePlayer: tempPlayer}
                IO.socket.emit('betChangedACK', transmitData);
            }
        }
    };
    IO.init();
    App.init();
 }($));

//-----------------------------------------------------------------------------------------------------------
//
//  END OF NETWORKING CODE
//
//-----------------------------------------------------------------------------------------------------------
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//-----------------------------------------------------------------------------------------------------------
//
//  BEGINNING OF APP CODE
//
//-----------------------------------------------------------------------------------------------------------


//-----------------------------------------------------------------------------------------------------------
//  CLASSES
//-----------------------------------------------------------------------------------------------------------
//All Properties and functions to draw and calculate values
class Card {
    constructor(posX, posY, cardIndexValue, face, isBig, rotate) {
        this.cardIndexValue = cardIndexValue;
        this.face = face;
        this.x = posX;
        this.y = posY;
        this.rad = rotate;
        this.big = isBig;
        this.animating = false;
        this.animStart = 0;
        this.animEnd = 0;}
    //Methods
    flip() {if(this.face == 'FRONT') {this.face = 'BACK';} else {this.face = 'FRONT';}}
    calcSuite() {
        if(this.cardIndexValue >= 1 && this.cardIndexValue <= 13)   return "Clubs";
        if(this.cardIndexValue >= 14 && this.cardIndexValue <= 26)  return "Spades";
        if(this.cardIndexValue >= 27 && this.cardIndexValue <= 39)  return "Hearts";
        if(this.cardIndexValue >= 40 && this.cardIndexValue <= 52)  return "Diamonds";}
    calcValue() {
        if(this.cardIndexValue >= 1 && this.cardIndexValue <= 13)   return this.cardIndexValue;
        if(this.cardIndexValue >= 14 && this.cardIndexValue <= 26)  return this.cardIndexValue-13;
        if(this.cardIndexValue >= 27 && this.cardIndexValue <= 39)  return this.cardIndexValue-26;
        if(this.cardIndexValue >= 40 && this.cardIndexValue <= 52)  return this.cardIndexValue-39;}
    calcFaceValue() {
        let crudeValue = this.calcValue(this.cardIndexValue);
        if(crudeValue >= 1 && crudeValue <= 9) {crudeValue++;   return crudeValue;}
        if(crudeValue == 10)    return "J";
        if(crudeValue == 11)    return "Q";
        if(crudeValue == 12)    return "K";
        if(crudeValue == 13)    return "A";}
    buildCard(ctx, rotate) {
        if(rotate == true) {rotateCardAndDraw(this.x, this.y, this.rad, this);} else {
            let thisCardSize = cardSize;
            if(this.big == false) {thisCardSize = cardSize/2;}
            if(this.face == 'BACK') {make_image(cardBack, this.x, this.y, thisCardSize, thisCardSize*1.5, ctx);}
            if(this.face == 'FRONT') {
                make_image(cardFront, this.x, this.y, thisCardSize, thisCardSize*1.5, ctx);
                let cardSuite = this.calcSuite(this.cardIndexValue);
                let cardValue = this.calcFaceValue(this.cardIndexValue);
                if(cardValue != undefined) {
                    if (cardSuite == "Hearts" || cardSuite == "Diamonds") {
                    ctx.fillStyle = 'rgb(255,0,0)';
                    ctx.font = "italic bold " + thisCardSize*0.5 + "pt Tahoma";
                    ctx.textAlign = 'center';
                    ctx.fillText(cardValue, this.x+thisCardSize/2, this.y+thisCardSize/2, thisCardSize);
                    if(cardSuite == "Hearts") {make_image(heartImage, this.x, this.y+(thisCardSize*0.5), thisCardSize, thisCardSize, ctx);}
                    if(cardSuite == "Diamonds") {make_image(diamondImage, this.x, this.y+(thisCardSize*0.5), thisCardSize, thisCardSize, ctx);}
                    } else {
                    ctx.fillStyle = 'rgb(0,0,0)';
                    ctx.font = "italic bold " + thisCardSize*0.5 + "pt Tahoma";
                    ctx.textAlign = 'center';
                    ctx.fillText(cardValue, this.x+thisCardSize/2, this.y+thisCardSize/2, thisCardSize);
                    if(cardSuite == "Spades") {make_image(spadeImage, this.x, this.y+(thisCardSize*0.5), thisCardSize, thisCardSize, ctx);}
                    if(cardSuite == "Clubs") {make_image(clubImage, this.x, this.y+(thisCardSize*0.5), thisCardSize, thisCardSize, ctx);}
                    }} else {ctx.fillStyle = 'rgb(0,0,0)';  ctx.fillRect(this.x-1, this.y-1, thisCardSize+2, thisCardSize*1.5+2);}}}}
    animateCardTo(desX, desY, time, ctx) {
        if(this.animStart == 0) {
            this.animating = true;
            this.animStart = timeElapsed;
            this.animEnd = this.animStart + time;}
        if(timeElapsed < this.animEnd) {
            //Continue Animations
            this.animating = true;
            let vx = 2 * (desX - this.x) / ((time*(FPS/1000))/4);
            let vy = 2 * (desY - this.y) / ((time*(FPS/1000))/4);
            this.x = this.x+vx;
            this.y = this.y+vy;
            if(this.rad == 0) {this.buildCard(ctx, false);} else {this.buildCard(ctx, true);}
        } else if (timeElapsed > this.animEnd) {
            if(this.x != desX || this.y != desY) {this.x = desX;    this.y = desY;}
            this.animating = false;
            this.animStart = 0;
            this.animEnd = 0;}}}

//Controls elements of text on screen
class ScreenText {
    constructor(String, colorString, formatString, size, fontString, posX, posY, maxWidth, Alignment) {
        this.text = String;
        this.color = colorString;
        this.format = formatString;
        this.size = size;
        this.font = fontString;
        this.x = posX;
        this.y = posY;
        this.maxWidth = maxWidth;
        this.align = Alignment;}
    //Methods
    draw(ctx) {
        let sizeString = this.size + 'px'
        ctx.fillStyle = 'rgb(' + this.color + ')';
        ctx.font = this.format + ' ' + sizeString + ' ' + this.font;
        ctx.textAlign = this.align;
        ctx.fillText(this.text, this.x, this.y, this.maxWidth);}}
//Controls Elements of a Button
class ScreenButton extends ScreenText {
    constructor(screenText, colorString, posX, posY, xSize, ySize) {
        super();
        this.screenText = screenText;
        this.buttonColor = colorString;
        this.x = posX;
        this.y = posY;
        this.width = xSize;
        this.height = ySize;
        this.x2 = this.x + this.width;
        this.y2 = this.y + this.height;
        this.isClicked = false;}
    draw(ctx) {
        let colorArray = this.buttonColor.split(',');
        let R = colorArray[0];
        let G = colorArray[1];
        let B = colorArray[2];
        if(this.isClicked == true) {
            if(R > 100) {R = R - 100;} else {R = 0;}
            if(G > 100) {G = G - 100;} else {G = 0;}
            if(B > 100) {B = B - 100;} else {B = 0;}}
        ctx.fillStyle = 'rgb(' + R + ',' + G + ',' + B + ')';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        if(this.screenText != '' && this.screenText != undefined) {this.screenText.draw(ctx);}}
    clicked(cursorX, cursorY){
        if(cursorX >= this.x && cursorX <= this.x2) {
            if(cursorY >= this.y && cursorY <= this.y2) {return true;}} return false;}}

//All properties of a Deck of Cards
class Deck {
    constructor() {
        this.deckArray = new Array();
        for(let i = 1; i < 53; i++) {this.deckArray[i-1] = i;}}
    //Methods
    getCard(index) {return this.deckArray[index];}
    shuffle() {
        let currentIndex = this.deckArray.length,  randomIndex;
        // While there remain elements to shuffle...
        while (currentIndex != 0) {
          // Pick a remaining element...
          randomIndex = Math.floor(Math.random() * currentIndex);
          currentIndex--;
          // And swap it with the current element.
          [this.deckArray[currentIndex], this.deckArray[randomIndex]] = [
            this.deckArray[randomIndex], this.deckArray[currentIndex]];}}}

//----------------------------------------------------------------------------------------------------------------
//The JavaScript Canvas Application istelf (Blackjack) 
//----------------------------------------------------------------------------------------------------------------
 function runJavaScriptApp() {
    //-----------------------------------------------------------------------------------------------------------
    //INITIALIZE DEPENDANCIES
    //-----------------------------------------------------------------------------------------------------------
    canvas = document.querySelector('.myCanvas');
    menu = document.querySelector('.gridtitle');
    ctx = canvas.getContext('2d');
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight-menu.offsetHeight;
    ctx.fillStyle = 'rgb(' + GameRoomData.color + ')';
    ctx.fillRect(0,0,width,height);

    //-----------------------------------------------------------------------------------------------------------
    //  GLOBAL VARIABLES
    //-----------------------------------------------------------------------------------------------------------
    //Set up aspect ratio variables
    if(width >= height) {
        //Desktop Mode
        var fontSize = height/16;
        pad = height/64;
        var mobileMode = false;
    } else {
        //Mobile Mode
        var fontSize = height/16;
        pad = height/64;
        var mobileMode = true;
    }
    //Set up cursor variables
    var curX;
    var curY;
    var ratioX = 1;
    var offsetX = 0;
    var ratioY = 1;
    var offsetY = -height/16;

    //Set up timing variables
    var FPSText = new ScreenText('0','255,255,255','bold', fontSize, 'Ariel', width, fontSize, width/8, 'right');

    //Cards and Decks of Cards
    if(width > height/2) {  //Add Location of Deck for cards to animate too
        deckLoc = {x: width/2-height/4+height*(4/200), y: height*(4/200)}; cardSize = height/(200/18);} else if(width < height/2) {
        deckLoc = {x: width*(4/100), y: height/2-width+width*(4/100)}; cardSize = width/(100/18);} else {
        deckLoc = {x: height*(4/200), y: height*(4/200)}; cardSize = height/(200/18);}
    if(GameRoomData.hostSocketId == sockets.id.toString()) {var deck = new Deck();  deck.shuffle();}    //If client is the host, create a deck of cards
    var cardCounter = 0;

    //Set up Buttons
    var ButtonMap = new Map();
    SeatCoordsArray[0] = {x:0, y:0}
    for(let i = 1; i <= GameRoomData.playerLimit; i++) {
        if(i <= GameRoomData.playerLimit/2) {
            //Go Right
            let butWidth = width/2+height/4;
            if(butWidth+height/16 > width) {butWidth = width-height/16;}
            let butHeight = height/4+(height/8)*(i);
            let newButtonText = new ScreenText(i, '255,255,255', 'bold', fontSize, 'Ariel', butWidth+height/32, butHeight+height*(3/64), height/16, 'center');
            let newButton = new ScreenButton(newButtonText, '0,125,255', butWidth, butHeight, height/16, height/16);
            SeatCoordsArray[i] = {x: butWidth, y: butHeight}
            ButtonMap.set(i.toString(), newButton);
        } else {
            //Go Left
            let butWidth = width/2-height/4-height/16;
            if(butWidth < 0) {butWidth = 0;}
            let butHeight = height*(7/8)-(height/8)*(i-GameRoomData.playerLimit/2);
            let newButtonText = new ScreenText(i, '255,255,255', 'bold', fontSize, 'Ariel', butWidth+height/32, butHeight+height*(3/64), height/16, 'center');
            let newButton = new ScreenButton(newButtonText, '0,125,255', butWidth, butHeight, height/16, height/16);
            SeatCoordsArray[i] = {x: butWidth, y: butHeight}
            ButtonMap.set(i.toString(), newButton);
        }    
    }
    var readyButtonText =  new ScreenText('Not Ready', '255,255,255', 'bold', height/16, 'Ariel', width/2, height-height/32, width, 'center');
    var readyButton =  new ScreenButton(readyButtonText, '200,50,50', 0, height-height/8, width, height/8);
    var timeLeftText =  new ScreenText('NULL', '255,255,255', 'bold', height/8, 'Ariel', width/2, height/2+height/16, width, 'center');

    //Betting Screen Buttons
    let bettingWidth = width-width/4;
    let bettingWidthText = width-width/8;
    let bettingWidth2 = width/4;
    if(mobileMode == true) {bettingWidth = width/2-width/4; bettingWidthText = width/2; bettingWidth2 = width/2;}
    let ClearButtonText = new ScreenText('Clear','255,255,255','bold', fontSize, 'Ariel', width-width/8, height-height/16+fontSize/2, width/4, 'center');
    var ClearButton = new ScreenButton(ClearButtonText,'255,0,0', width-width/4, height-height/8, width/4, height/8);
    let FoldButtonText = new ScreenText('Fold','255,255,255','bold', fontSize, 'Ariel', width/2, height-height/16+fontSize/2, width/4, 'center');
    var FoldButton = new ScreenButton(FoldButtonText,'200,175,0', width/4, height-height/8, width/2, height/8);
    let BetButtonText = new ScreenText('Bet','255,255,255','bold', fontSize, 'Ariel', width/8, height-height/16+fontSize/2, width/4, 'center');
    var BetButton = new ScreenButton(BetButtonText,'0,255,0', 0, height-height/8, width/4, height/8);
    let d1ButtonText = new ScreenText('$1','255,255,255','bold', fontSize, 'Ariel', bettingWidthText, height-height/8-height/16+fontSize/2-pad, width/4, 'center');
    var d1Button = new ScreenButton(d1ButtonText,'255,125,0', bettingWidth, height-height/4-pad, bettingWidth2, height/8);
    let d10ButtonText = new ScreenText('$10','255,255,255','bold', fontSize, 'Ariel', bettingWidthText, height-height/4-height/16+fontSize/2-pad*2, width/4, 'center');
    var d10Button = new ScreenButton(d10ButtonText,'255,125,0', bettingWidth, height-height/8-height/4-pad*2, bettingWidth2, height/8);
    let d100ButtonText = new ScreenText('$100','255,255,255','bold', fontSize, 'Ariel', bettingWidthText, height-height/8-height/4-height/16+fontSize/2-pad*3, width/4, 'center');
    var d100Button = new ScreenButton(d100ButtonText,'255,125,0', bettingWidth, height-height/2-pad*3, bettingWidth2, height/8);
    let d1000ButtonText = new ScreenText('$1,000','255,255,255','bold', fontSize, 'Ariel', bettingWidthText, height-height/2-height/16+fontSize/2-pad*4, width/4, 'center');
    var d1000Button = new ScreenButton(d1000ButtonText,'255,125,0', bettingWidth, height-height/8-height/2-pad*4, bettingWidth2, height/8);
    let myselfButtons = GameRoomData.Players.get(sockets.id.toString());
    var BetText = new ScreenText('Bet: $'+myselfButtons.bet,'255,255,255','bold', fontSize, 'Ariel', bettingWidthText, height-height/8-height/2-pad*5, bettingWidth2, 'center');
    var BankText = new ScreenText('Bank: $'+myselfButtons.bank,'255,255,255','bold', fontSize/2, 'Ariel', bettingWidthText, height-height/8-height/2-fontSize-pad*6, bettingWidth2, 'center');

    //Playing Screen Buttons
    let HitButtonText = new ScreenText('Hit','255,255,255','bold', fontSize, 'Ariel', width/8, height-height/16+fontSize/2, width/4, 'center');
    var HitButton = new ScreenButton(HitButtonText,'0,255,0', 0, height-height/8, width/4, height/8);
    let StayButtonText = new ScreenText('Stay','255,255,255','bold', fontSize, 'Ariel', width-width/8, height-height/16+fontSize/2, width/4, 'center');
    var StayButton = new ScreenButton(StayButtonText,'255,0,0', width-width/4, height-height/8, width/4, height/8);
    //-----------------------------------------------------------------------------------------------------------
    //  EVENT HANDLERS
    //-----------------------------------------------------------------------------------------------------------
    //Listen for player to click screen
    canvas.addEventListener('click', function(evt) {
        updateOffset();
    }, false);

    //If window changes, update canvas offsets
    window.onscroll=function(e){ updateOffset(); }
    window.onresize=function(e){ updateOffset(); }  

    // update mouse pointer coordinates on canvas
    document.addEventListener('mousemove', e => {
        curX = e.clientX/ratioX-offsetX/ratioX;
        curY = e.clientY/ratioY-offsetY/ratioY;
    });
    canvas.addEventListener('mousedown', function(evt){
        //GameStages
        switch(GameRoomData.gameStage) {
            case 0:
                let myself = GameRoomData.Players.get(sockets.id.toString());
                if(myself.ready == false) {checkSeatButtons();}
                checkReadyButton(myself);   //Check ready or not
                break;
            case '1':
                if(BetButton.clicked(curX, curY) == true) {checkBettingButtons(true, BetButton, 'Bet')}
                else if(FoldButton.clicked(curX, curY) == true) {checkBettingButtons(true, FoldButton, 'Fold')}
                else if(ClearButton.clicked(curX, curY) == true) {checkBettingButtons(true, ClearButton, 'Clear')}
                else if(d1Button.clicked(curX, curY) == true) {checkBettingButtons(true, d1Button, 'd1')}
                else if(d10Button.clicked(curX, curY) == true) {checkBettingButtons(true, d10Button, 'd10')}
                else if(d100Button.clicked(curX, curY) == true) {checkBettingButtons(true, d100Button, 'd100')}
                else if(d1000Button.clicked(curX, curY) == true) {checkBettingButtons(true, d1000Button, 'd1000')}
                break;
            case '3':
                if(HitButton.clicked(curX, curY) == true) {checkBettingButtons(true, HitButton, 'Hit')}
                else if(StayButton.clicked(curX, curY) == true) {checkBettingButtons(true, StayButton, 'Stay')}
                break;
        }
    });
    canvas.addEventListener('mouseup', function(evt){
        //GameStages
        switch(GameRoomData.gameStage) {
            case 0:
                ButtonMap.forEach(cout);
                function cout(value, key, map) {value.isClicked = false;}
                break;
            case '1':
                checkBettingButtons(false, BetButton);
                checkBettingButtons(false, FoldButton);
                checkBettingButtons(false, ClearButton);
                checkBettingButtons(false, d1Button);
                checkBettingButtons(false, d10Button);
                checkBettingButtons(false, d100Button);
                checkBettingButtons(false, d1000Button);
                break;
            case '3':
                checkBettingButtons(false, HitButton);
                checkBettingButtons(false, StayButton);
                break;
        }
    });
    //-----------------------------------------------------------------------------------------------------------
    //  FUNCTIONS
    //-----------------------------------------------------------------------------------------------------------
    
    //Checks and Updates
    //-----------------------------------------------------
    //Check BettingButtons
    function checkBettingButtons(betBool, button, string) {
        if(betBool == true) {
            button.isClicked = true;
            let myself = GameRoomData.Players.get(sockets.id.toString());
            let dataPacket = {gameId: GameRoomData.gameId, updatePlayer: myself, betREQ: 'NULL', mySocketId: sockets.id}
            if(string == 'Bet' && (myself.ready == false && myself.fold == false)) {
                if(sockets.id.toString() == GameRoomData.hostSocketId.toString()) {
                    myself.ready = true;
                    GameRoomData.Players.set(sockets.id.toString(), myself);
                    sockets.emit('betChangedACK', dataPacket);} else {dataPacket.betREQ = 'Bet'; sockets.emit('betChangedREQ', dataPacket);}}
            else if(string == 'Fold' && (myself.ready == false && myself.fold == false)) {
                if(sockets.id.toString() == GameRoomData.hostSocketId.toString()) {
                    myself.ready = false; myself.fold = true;
                    myself.bank = myself.bank + myself.bet; myself.bet = 0;
                    GameRoomData.Players.set(sockets.id.toString(), myself);
                    sockets.emit('betChangedACK', dataPacket);} else {dataPacket.betREQ = 'Fold'; sockets.emit('betChangedREQ', dataPacket);}}
            else if(string == 'Hit' && (myself.ready == false && myself.fold == false)) {
                if(sockets.id.toString() == GameRoomData.hostSocketId.toString()) {

                    sockets.emit('hitChangedACK', dataPacket);} else {dataPacket.hitREQ = 'Hit'; sockets.emit('hitChangedREQ', dataPacket);}}
            else if(string == 'Stay' && (myself.ready == false && myself.fold == false)) {
                if(sockets.id.toString() == GameRoomData.hostSocketId.toString()) {
                    myself.ready = true;
                    sockets.emit('hitChangedACK', dataPacket);} else {dataPacket.hitREQ = 'Stay'; sockets.emit('hitChangedREQ', dataPacket);}}
            else if(string == 'Clear' && (myself.ready == false && myself.fold == false)) {
                if(sockets.id.toString() == GameRoomData.hostSocketId.toString()) {
                    myself.bank = myself.bank +  myself.bet; myself.bet = 0;
                    dataPacket.updatePlayer = myself;
                    GameRoomData.Players.set(sockets.id.toString(), myself);
                    sockets.emit('betChangedACK', dataPacket);} else {dataPacket.betREQ = 'Clear'; sockets.emit('betChangedREQ', dataPacket);}}
            else if(string == 'd1' && (myself.ready == false && myself.fold == false)) {
                if(sockets.id.toString() == GameRoomData.hostSocketId.toString()) {
                    if(myself.bank >= 1) {myself.bank = myself.bank - 1; myself.bet = myself.bet + 1;
                    dataPacket.updatePlayer = myself;
                    GameRoomData.Players.set(sockets.id.toString(), myself);
                    sockets.emit('betChangedACK', dataPacket);}} else {dataPacket.betREQ = 'd1'; sockets.emit('betChangedREQ', dataPacket);}}
            else if(string == 'd10' && (myself.ready == false && myself.fold == false)) {
                if(sockets.id.toString() == GameRoomData.hostSocketId.toString()) {
                    if(myself.bank >= 10) {myself.bank = myself.bank - 10; myself.bet = myself.bet + 10;
                    dataPacket.updatePlayer = myself;
                    GameRoomData.Players.set(sockets.id.toString(), myself);
                    sockets.emit('betChangedACK', dataPacket);}} else {dataPacket.betREQ = 'd10'; sockets.emit('betChangedREQ', dataPacket);}}
            else if(string == 'd100' && (myself.ready == false && myself.fold == false)) {
                if(sockets.id.toString() == GameRoomData.hostSocketId.toString()) {
                    if(myself.bank >= 100) {myself.bank = myself.bank - 100; myself.bet = myself.bet + 100;
                    dataPacket.updatePlayer = myself;
                    GameRoomData.Players.set(sockets.id.toString(), myself);
                    sockets.emit('betChangedACK', dataPacket);}} else {dataPacket.betREQ = 'd100'; sockets.emit('betChangedREQ', dataPacket);}}
            else if(string == 'd1000' && (myself.ready == false && myself.fold == false)) {
                if(sockets.id.toString() == GameRoomData.hostSocketId.toString()) {
                    if(myself.bank >= 1000) {myself.bank = myself.bank - 1000; myself.bet = myself.bet + 1000;
                    dataPacket.updatePlayer = myself;
                    GameRoomData.Players.set(sockets.id.toString(), myself);
                    sockets.emit('betChangedACK', dataPacket);}} else {dataPacket.betREQ = 'd1000'; sockets.emit('betChangedREQ', dataPacket);}}
        } else {button.isClicked = false}
    }
    //Check Ready Button
    function checkReadyButton(myself) {
        if(readyButton.clicked(curX, curY) == true) {
            //If currently in seat
            if(myself.mySeat != '0' && myself.mySeat != undefined) {
                if(myself.ready == true) {myself.ready = false;} else {myself.ready = true;}
            } else {myself.ready = false;}
            //Send Data to lobby or Host
            let dataPacket = {gameId: GameRoomData.gameId, ready: myself.ready, mySocketId: sockets.id, Players: {}}
            if(GameRoomData.hostSocketId.toString() != sockets.id.toString()) {sockets.emit('readyChangedREQ', dataPacket)} else {
                GameRoomData.Players.set(sockets.id.toString(), myself);
                dataPacket.Players = JSON.stringify(Array.from(GameRoomData.Players));
                sockets.emit('readyChangedACK', dataPacket);}}
    }
    //Check the buttons for the seats
    function checkSeatButtons() {
        ButtonMap.forEach(cout);
        function cout(value, key, map) {
            let buttonKey = key;
            let buttonValue = value;
            //If button is clicked
            if(buttonValue.clicked(curX, curY) == true) {
                let collide = false;
                GameRoomData.Players.forEach(cout2) 
                function cout2(value, key, map) {if(value.mySeat.toString() == buttonKey.toString()) collide = true;}
                //Seat Unocuppied
                if(collide == false) {
                    let dataPacket = {gameId: GameRoomData.gameId, mySocketId: sockets.id, seatREQ: buttonKey, Players: {}}
                    if(GameRoomData.hostSocketId.toString() == sockets.id.toString()) {
                        //Host
                        let myself = GameRoomData.Players.get(sockets.id.toString());
                        myself.mySeat = buttonKey;
                        GameRoomData.Players.set(sockets.id.toString(), myself);
                        updateSeatArray();
                        dataPacket.Players = JSON.stringify(Array.from(GameRoomData.Players));
                        sockets.emit('seatChangedACK', dataPacket);
                    } else {
                        //If Player
                        sockets.emit('seatChangedREQ', dataPacket);}}}}
    }
    //Update canvas offsets and canvas scale
    function updateOffset() {
        var rect = canvas.getBoundingClientRect();
        offsetX = rect.left;
        offsetY = rect.top;
        ratioX = (rect.right-rect.left)/width;
        ratioY = (rect.bottom-rect.top)/height;
    }
    //Update the countdown
    async function updateCountDown(time) {
        GameRoomData.timeLeft = time.toString();
        let dataPacket = {gameId: GameRoomData.gameId, timeLeft: GameRoomData.timeLeft}
        sockets.emit('timeChangedACK', dataPacket);
        let timeCount = time;
        let intervalID = setInterval( () => {
            if(GameRoomData.timeLeft == 'NULL' || GameRoomData.timeLeft > timeCount) {clearInterval(intervalID);} else {  //If Players are no longer ready, reset interval
                if(timeCount > 0) {
                    timeCount = timeCount - 1;
                    GameRoomData.timeLeft = timeCount.toString();
                } else {
                    timeCount = 0;
                    GameRoomData.timeLeft = timeCount.toString();
                    clearInterval(intervalID);
                }
                let dataPacket = {gameId: GameRoomData.gameId, timeLeft: GameRoomData.timeLeft}
                sockets.emit('timeChangedACK', dataPacket);
            }
        }, 1000);
    }
    //Animation and Animation Frame draws
    //-----------------------------------------------------
    function animateFrame(timeStamp) {
        if(startTimer == true && beginTime == 0) {
            beginTime = timeStamp;
            startTimer = false;
        }
        if(beginTime != 0) {
            timeElapsed = timeStamp - beginTime;
        }
        FPS = 0;
        if(previousTimeStamp != timeStamp) {
            FPS = 1000/(timeStamp - previousTimeStamp);
            FPS = parseInt(FPS);
            FPSText.text = FPS;
            //ANIMATION FRAMES
            //Add player list in desktop mode
            drawBackground(GameRoomData.color);
            drawLeaderBoard();
            switch(GameRoomData.gameStage) {
                case 0:
                    drawWaitingRoom();
                    break;
                case '1':
                    drawBettingScreen();
                    break;
                case '2':
                    drawDealingScreen();
                    break;
                case '3':
                    drawPlayingRound();
                    break;
            }
        }
        FPSText.draw(ctx);
        previousTimeStamp = timeStamp;
        reqAnim = window.requestAnimationFrame(animateFrame);
    }

    //Display Waiting Room Graphics
    function drawWaitingRoom() {
        drawSeats(true);
        //Draw Read or Not Button
        let myself = GameRoomData.Players.get(sockets.id.toString());
        //Change Button Color if ready or not
        if(myself.ready == true) {readyButton.buttonColor = '50,200,50';    readyButtonText.text = 'Ready';} else {readyButton.buttonColor = '200,50,50';   readyButtonText.text = 'Not Ready';}
        readyButton.draw(ctx);
        readyButtonText.draw(ctx);
        //TimeLeft
        if(sockets.id.toString() == GameRoomData.hostSocketId) {    //Execute as the host
            let allReady = true;
            GameRoomData.Players.forEach(cout);
            function cout(value, key, map) {if(value.ready == false)  {allReady = false;}}  //Is there a player unready?
            if(allReady == true) {if(GameRoomData.timeLeft == 'NULL') {let time = 5;  updateCountDown(time);} 
            } else {
                GameRoomData.timeLeft = 'NULL';
                let dataPacket = {gameId: GameRoomData.gameId, timeLeft: GameRoomData.timeLeft}
                sockets.emit('timeChangedACK', dataPacket);}    //Begin count down if everyone is ready
            if(GameRoomData.timeLeft == '0') {
                GameRoomData.gameStage = '1';
                GameRoomData.timeLeft = 'NULL';
                GameRoomData.Players.forEach(cout2);
                function cout2 (value, key, map) {value.ready = false;}
                sendUpdateGameStage();}}
        //Draw CountDown
        if(GameRoomData.timeLeft != 'NULL' && GameRoomData.timeLeft != undefined) {
            timeLeftText.text = GameRoomData.timeLeft;
            timeLeftText.draw(ctx);}}
    //Display Betting Screen Graphics
    function drawBettingScreen() {
        drawSeats(true);
        let myself = GameRoomData.Players.get(sockets.id.toString());
        if(myself.ready == false && myself.fold == false) {BetButton.draw(ctx); ClearButton.draw(ctx);
        FoldButton.draw(ctx);   d1Button.draw(ctx);
        d10Button.draw(ctx);    d100Button.draw(ctx);   d1000Button.draw(ctx);
        BetText.text = 'Bet: $' + myself.bet;   BankText.text = 'Bank: $' + myself.bank;
        BetText.draw(ctx);  BankText.draw(ctx);}

        if(sockets.id.toString() == GameRoomData.hostSocketId) {
            let allReady = true;
            GameRoomData.Players.forEach(cout);
            function cout(value, key, map) {if(value.ready == false && value.fold == false)  {allReady = false;}}  //Is there a player unready?
            if(allReady == true) {
                GameRoomData.gameStage = '2';
                GameRoomData.timeLeft = 'NULL';
                GameRoomData.round = GameRoomData.round + 1;
                timeElapsed = 0;    startTimer = true;
                sendUpdateGameStage();}
            if(GameRoomData.timeLeft == 'NULL') {let time = 30; updateCountDown(time);}
            if(GameRoomData.timeLeft == '0') {
                GameRoomData.Players.forEach(cout2);
                function cout2(value, key, map) {
                    if(value.ready == false && value.fold == false) {value.fold = true; value.bank = value.bank + value.bet; value.bet = 0;}}
                GameRoomData.gameStage = '2';
                GameRoomData.timeLeft = 'NULL';
                GameRoomData.round = GameRoomData.round + 1;
                timeElapsed = 0;    startTimer = true;
                sendUpdateGameStage();}
        }  
        drawCountDownBar('30');
    }
    //Draw Dealing Screen
    function drawDealingScreen() {
        drawSeats(false);
        make_image(cardBack, deckLoc.x, deckLoc.y, cardSize, cardSize*1.5, ctx);
        isDealing = false;
        //Update smallest Hand and Largest Hand
        let largestHandSize = 0;
        let smallestHandSize = 100;
        GameRoomData.Players.forEach(cout);
        function cout(value, key, map) {
            if(largestHandSize < value.Hand.length && value.ready == true && value.fold == false) {largestHandSize = value.Hand.length;}   //Get largest hand size to know who do deal card to
            if(smallestHandSize > value.Hand.length && value.ready == true && value.fold == false) {smallestHandSize = value.Hand.length;}}   //Get smallest hand size to know who do deal card to
        //Draw All little Cards on Screen
        for (let i = 0; i < littleCards.length; i++) {
            if(littleCards[i].Card.animating == false) {littleCards[i].Card.buildCard(ctx, true);} else {
                let cardLoc = findCoordsForCard('LITTLE', littleCards[i].Player, i);
                littleCards[i].Card.rad = cardLoc.rad;
                littleCards[i].Card.animateCardTo(cardLoc.x, cardLoc.y, 500, ctx);
                if(littleCards[i].Card.animating == true) {isDealing = true;}}}
        //Draw big cards for my Hand
        for (let i = 0; i < myHand.length; i++) {myHand[i].buildCard(ctx, false);}
        //Draw big cards for dealer Hand
        for (let i = 0; i < dealerHand.length; i++) {if(dealerHand[i].animating == false) {dealerHand[i].buildCard(ctx, false);} else {
            let cardLoc = findCoordsForCard('DEALER', dealerHand, i);
            dealerHand[i].animateCardTo(cardLoc.x, cardLoc.y, 1000, ctx);
            if(dealerHand[i].animating == true) {isDealing = true;}}}
        //Add new card to screen as dealer
        if(isDealing == false && dealerHand.length < 2 && (sockets.id.toString() == GameRoomData.hostSocketId || sockets.id == GameRoomData.hostSocketId)) {  
            //Add Dealer Card
            let updatePlayerId;
            if(smallestHandSize == largestHandSize && smallestHandSize > dealerHand.length) {
                updatePlayerId = 'DEALER';
                if(dealerHand.length == 0) {dealerHand[dealerHand.length] = new Card(deckLoc.x, deckLoc.y, deck.getCard(cardCounter), 'BACK', true, 0);} else {
                    dealerHand[dealerHand.length] = new Card(deckLoc.x, deckLoc.y, deck.getCard(cardCounter), 'FRONT', true, 0);}
                GameRoomData.DealerHand[GameRoomData.DealerHand.length] = deck.getCard(cardCounter);    //Add card to dealer's hand for game lobby
                let cardLoc = findCoordsForCard('DEALER', dealerHand, dealerHand.length);    
                dealerHand[dealerHand.length-1].animateCardTo(cardLoc.x, cardLoc.y, 500, ctx);
            } else {
                //Add Player Card
                for (let i = 1; i <= GameRoomData.playerLimit; i++) {   //Check All Seats in order
                    if(GameRoomData.Seats[i].occupied == true) {        //Check All seats with players
                        if(GameRoomData.Seats[i].Player.Hand.length <= smallestHandSize && isDealing == false) {  //If player is in need of card, set turn and add card
                            let updatePlayer = GameRoomData.Players.get(GameRoomData.Seats[i].Player.mySocketId.toString());
                            if(updatePlayer.ready == true && updatePlayer.fold == false) {  //If Player is currently playing
                                isDealing = true;
                                GameRoomData.turn = i;
                                if(GameRoomData.Seats[i].Player.mySocketId.toString() == sockets.id.toString()) { //If current card added belongs to host, make big cards too
                                    let cardLoc = findCoordsForCard('BIG', GameRoomData.Seats[i].Player, myHand.length);
                                    myHand[myHand.length] = new Card(cardLoc.x, cardLoc.y, deck.getCard(cardCounter), 'FRONT', true, 0);} 
                                updatePlayer.Hand[updatePlayer.Hand.length] = deck.getCard(cardCounter);
                                littleCards[littleCards.length] = {Card: {}, Player: {}}
                                littleCards[littleCards.length-1].Player = updatePlayer;
                                let cardLoc = findCoordsForCard('LITTLE', updatePlayer, littleCards.length-1);
                                littleCards[littleCards.length-1].Card = new Card(deckLoc.x, deckLoc.y, deck.getCard(cardCounter), 'FRONT', false, cardLoc.rad);    //Add new little card for clients
                                littleCards[littleCards.length-1].Card.animateCardTo(deckLoc.x+height/8, deckLoc.y+height/4, 500, ctx);             //Begin little card animation
                                updatePlayerId = updatePlayer.mySocketId;   //Update id to be sent to clients
                                    //update player information for new card holder
                                GameRoomData.Players.set(GameRoomData.Seats[i].Player.mySocketId.toString(), updatePlayer); //update player information for new card holder
                                updateSeatArray();}}}}}
                            //Send New Dealt card to all users
            let dataPacket = {gameId: GameRoomData.gameId, turn: GameRoomData.turn, updatePlayerId: updatePlayerId, updateCard: deck.getCard(cardCounter), Players: {}, Seats: GameRoomData.Seats, dealerHand: GameRoomData.DealerHand}
            dataPacket.Players = JSON.stringify(Array.from(GameRoomData.Players));
            sockets.emit('dealChangedACK', dataPacket);
            cardCounter++;
            }
        //Everyone has been dealt a card, move to next phase
        if(dealerHand.length == 2 && isDealing == false && (sockets.id.toString() == GameRoomData.hostSocketId || sockets.id == GameRoomData.hostSocketId)) {   
            GameRoomData.Players.forEach(cout);
            function cout(value, key, map) {
                if(value.ready != true && value.fold != true) {
                    value.ready = false;
                    value.fold = true;} else {
                    value.fold = false;
                    value.ready = false;}}
            GameRoomData.gameStage = '3';
            GameRoomData.turn = 0;
            sendUpdateGameStage();
        }}

    //Draw screen graphics for playing round...
    function drawPlayingRound() {
        drawSeats(false);
        make_image(cardBack, deckLoc.x, deckLoc.y, cardSize, cardSize*1.5, ctx);
        let myself = GameRoomData.Players.get(sockets.id.toString());
        //Draw All little Cards on Screen
        for (let i = 0; i < littleCards.length; i++) {
            if(littleCards[i].Card.animating == false) {
                littleCards[i].Card.buildCard(ctx, true);} else {
                let cardLoc = findCoordsForCard('LITTLE', littleCards[i].Player, i);
                littleCards[i].Card.rad = cardLoc.rad;
                littleCards[i].Card.animateCardTo(cardLoc.x, cardLoc.y, 500, ctx);
                if(littleCards[i].Card.animating == true) {isDealing = true;}}}
        //Draw big cards for my Hand
        for (let i = 0; i < myHand.length; i++) {if(myHand[i].animating == false) {myHand[i].buildCard(ctx, false);}}
        //Draw big cards for dealer Hand
        for (let i = 0; i < dealerHand.length; i++) {if(dealerHand[i].animating == false) {dealerHand[i].buildCard(ctx, false);} else {
            let cardLoc = findCoordsForCard('DEALER', dealerHand, i);
            dealerHand[i].animateCardTo(cardLoc.x, cardLoc.y, 1000, ctx);
            if(dealerHand[i].animating == true) {isDealing = true;}}}
        //Draw Buttons when needed
        if(myself.fold == false && myself.ready == false && myself.mySeat == GameRoomData.turn) {
            HitButton.draw(ctx);
            StayButton.draw(ctx);
        }
        //Draw Green dot for active turn player
        console.log(GameRoomData.turn);
        let thisSeat = GameRoomData.Seats[GameRoomData.turn];
        if(thisSeat.Player != undefined) {
            let xDot = 0;
            let yDot = SeatCoordsArray[GameRoomData.turn].y+height/32;
            if(GameRoomData.turn <= GameRoomData.playerLimit/2) {
                xDot = SeatCoordsArray[GameRoomData.turn].x  - (thisSeat.Player.Hand.length/2)*(cardSize);} else {
                xDot = SeatCoordsArray[GameRoomData.turn].x  + (thisSeat.Player.Hand.length/2)*(cardSize) + height/16;}
                ctx.fillStyle = 'rgb(50,200,50)';
                ctx.fillRect(xDot-cardSize/16,yDot-cardSize/16,cardSize/8,cardSize/8);}

        //Run has Host
        if(sockets.id.toString() == GameRoomData.hostSocketId || sockets.id == GameRoomData.hostSocketId) {
            if(GameRoomData.turn <= GameRoomData.playerLimit) { //Make sure the turn is within the number of seats
                if(GameRoomData.turn <= 0 || GameRoomData.turn == undefined) {GameRoomData.turn = 1;}   //If turn is still zero
                if(GameRoomData.Seats[GameRoomData.turn].Player == undefined) {GameRoomData.turn = GameRoomData.turn + 1;}    //Go to next seat until there is a player there
                if(GameRoomData.Seats[GameRoomData.turn].Player != undefined) {
                    if(GameRoomData.Seats[GameRoomData.turn].Player.ready == true) {GameRoomData.turn = GameRoomData.turn + 1;}}}}   //Go to next player once player is finished with their turn
        //Once everyone has played
        if(GameRoomData.turn > GameRoomData.playerLimit) {
            GameRoomData.gameStage = '4';
            sendUpdateGameStage();
        }
    }
    //Draw count down bar
    function drawCountDownBar(MAXTIME) {
        ctx.fillStyle = 'rgb(75,75,75)';
        ctx.fillRect(0, 0, width, height/64);
        let G = GameRoomData.timeLeft*(205/MAXTIME) + 50;
        let R = 255 - GameRoomData.timeLeft*(205/MAXTIME);
        ctx.fillStyle = 'rgb('+ R + ',' + G + ',50)';
        ctx.fillRect(0, 0, GameRoomData.timeLeft*(width/MAXTIME), height/64);
    }
    //Display Player LeaderBoard
    function drawLeaderBoard() {
        if(GameRoomData.hostSocketId.toString() == sockets.id.toString()) {
            if(width >= height) {
                let playerNumber = 0;
                GameRoomData.Players.forEach(cout);
                function cout (value, key, map) {
                    ctx.fillStyle = 'rgb(50,150,50)';
                    ctx.fillRect(0, playerNumber*(fontSize+(pad/2))+height/64, width/4, fontSize);
                    
                    let text = new ScreenText(value.myName,'255,255,255','bold', fontSize, 'Ariel', 0, playerNumber*(fontSize+(pad/2))+fontSize-fontSize/6+height/64, width/8, 'start');
                    let text2 = new ScreenText('$'+value.bank,'255,255,255','bold', fontSize, 'Ariel', width/4, playerNumber*(fontSize+(pad/2))+fontSize-fontSize/6+height/64, width/8, 'right');
                    text.draw(ctx);
                    text2.draw(ctx);
                    playerNumber++;}}}}
    //Draw the Seats for all Players
    function drawSeats(isWait) {
        //Draw Seat Icons
        ButtonMap.forEach(cout);
        function cout (value, key, map) {if(isWait == true) {value.buttonColor = '50,50,200';} else {value.buttonColor = '100,100,100';} value.draw(ctx);}
        GameRoomData.Players.forEach(cout2);
        function cout2(value, key, map) {
            if(value.mySeat >= 1 && value.mySeat <= GameRoomData.playerLimit) {
                let button = ButtonMap.get(value.mySeat.toString());
                if(value.ready == true) {button.buttonColor = '50,200,50';} else {if(value.fold == true) {button.buttonColor = '200,175,0';} else {button.buttonColor = '200,50,50';}}
                ctx.fillStyle = 'rgb(255,255,255)';
                ctx.font = 'bold ' + height/64 + 'pt Ariel';
                ctx.textAlign = 'start';
                ctx.fillText(value.myName, button.x, button.y, height/16);
                ctx.fillText('$'+value.bank, button.x, button.y+height/16+height/64, height/16);
                ctx.textAlign = 'right';
                if(value.mySeat <= GameRoomData.playerLimit/2) {//Right Side
                    ctx.textAlign = 'right';
                    ctx.fillText('$'+value.bet, button.x, button.y+height*(5/128), height/16);} else {    //Left Side
                    ctx.textAlign = 'start';
                    ctx.fillText('$'+value.bet, button.x+height/16, button.y+height*(5/128), height/16);}
                button.draw(ctx);}}}
    //Draw the Background Image and Screen
    function drawBackground(RGBCOLOR) {
        ctx.fillStyle = 'rgb(' + RGBCOLOR + ')';
        ctx.fillRect(0,0,width,height);
        if(width > height/2) {
            make_image(tableImage, width/2-height/4,0,height/2,height, ctx);
        } else if(width < height/2) {
            make_image(tableImage, 0,height/2-width, width, width*2, ctx);
        } else {
            make_image(0,0,width,height, ctx);}}
    //MISC
    //-----------------------------------------------------
    //Send Update GameStage Packet
    function sendUpdateGameStage() {
        let updatePlayers = JSON.stringify(Array.from(GameRoomData.Players));
        let dataPacket = {gameId: GameRoomData.gameId, hostSocketId: GameRoomData.hostSocketId, 
            playerCount: GameRoomData.playerCount, playerLimit: GameRoomData.playerLimit, 
            gameStage: GameRoomData.gameStage, round: GameRoomData.round, timeLeft:  GameRoomData.timeLeft, 
            Players: updatePlayers, color: GameRoomData.color}
        sockets.emit('gameStageChangedACK', dataPacket);}


    
    async function delay(time) {return new Promise(resolve => setTimeout(resolve, time));}
    //Delay function

    //-----------------------------------------------------------------------------------------------------------
    //  EXECUTED CODE
    //-----------------------------------------------------------------------------------------------------------
    //Start Game
    window.requestAnimationFrame(animateFrame);
 }

//function rotate
function rotateCardAndDraw(x,y, degrees, CARD) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((degrees)*Math.PI/180);
    CARD.x = 0;
    CARD.y = 0;
    CARD.buildCard(ctx, false);
    CARD.x = x;
    CARD.y = y;
    ctx.restore();}

//Update Seat Array
function updateSeatArray() {
    for(let i = 0; i <= GameRoomData.playerLimit; i++) {GameRoomData.Seats[i] = {occupied: false}}
        GameRoomData.Players.forEach(cout);
        function cout(value, key, map) {GameRoomData.Seats[parseInt(value.mySeat)] = {occupied: true, Player: value}}}

//Find and detect seat collide upon player joining
function findOpenSeat(rejoiningPlayer, gameStarted, Player) {
    let myself = Player;
    if(rejoiningPlayer == true) {   //If player is returning or not
        if(gameStarted == true && (myself.mySeat == '0' || myself.mySeat == 0)) {myself.mySeat = 1;}    //Returning player has no seat and game started, assign seat
        if(GameRoomData.Seats[parseInt(myself.mySeat)].occupied == true) {      //If returning player's seat is already taken, adjust it
            for(let i = 1; i <= GameRoomData.playerLimit; i++) {
                if(GameRoomData.Seats[i].occupied == true && (myself.mySeat == i || myself.mySeat == i.toString())) {   //If returning player's seat is already occupied, adjust returning player's seat
                    myself.mySeat = i + 1;
                    if(myself.mySeat > GameRoomData.playerLimit) {return 0;}}}}    //If went through all players and could not find seat, return null
        return myself.mySeat;   //Return the seat key for first open 
    } else {
        if(gameStarted == true) {
            for(let i = 1; i <= GameRoomData.playerLimit; i++) {    //If new Player and game as started, force chose a seat
                if(GameRoomData.Seats[i].occupied == false) {
                    return i;}}} else {return 0;}
        return 0;}}

//Reset Local Arrays back to empty
function resetLocalArrays() {
    littleCards = new Array();
    myHand = new Array();
    dealerHand = new Array();
}

//Restor local Arrays to Host's gamestate
function restoreLocalArrays() {
    let cardValue;
    //Create Little Cards
    for (let i = 1; i <= GameRoomData.playerLimit; i++) {//For each Seat
        //For each occupied seat
        if(GameRoomData.Seats[i].occupied == true) {
            let currentPlayer = GameRoomData.Seats[i].Player;
            //For each Card in Player's Hand
            for (let j = 0; j < currentPlayer.Hand.length; j++) {
                cardValue = parseInt(currentPlayer.Hand[j]);
                littleCards[littleCards.length] = {Card: {}, Player: {}}
                littleCards[littleCards.length-1].Player = currentPlayer; //Add player to current little Card
                let cardLoc = findCoordsForCard('LITTLE', currentPlayer, littleCards.length-1);   //Calculate coords for little card for player
                littleCards[littleCards.length-1].Card = new Card(cardLoc.x, cardLoc.y, cardValue, 'FRONT', false, cardLoc.rad);
            }}}  //Add Card to current little Card
    //Create myHand Big Cards
    let myself = GameRoomData.Players.get(sockets.id.toString());
    for(let i = 0; i < myself.Hand.length; i++) {
        let cardLoc = findCoordsForCard('BIG', myself, i);   //Calculate coords for little card for player
        cardValue = parseInt(myself.Hand[i]);
        myHand[myHand.length] = new Card(cardLoc.x, cardLoc.y, cardValue, 'FRONT', true, 0);  //Add Card to current little Card
    }
    //Create dealerHand Big Cards
    for(let i = 0; i < GameRoomData.DealerHand.length; i++) {
        let cardLoc = findCoordsForCard('DEALER', dealerHand, i);
        cardValue = parseInt(GameRoomData.DealerHand[i]);
        if(i <= 0) {dealerHand[i] = new Card(cardLoc.x, cardLoc.y, cardValue, 'BACK', true, 0);} else {
            dealerHand[i] = new Card(cardLoc.x, cardLoc.y, cardValue, 'FRONT', true, 0);  //Add Card to current little Card
        }
    }
}

//Finds where to put the card for each client based off their seat position
function findCoordsForCard(forWhom, Player, index) {
    let cardX;
    let cardY;
    if(forWhom == 'DEALER') {
        if(index % 2 == 0) {
            cardX = width/2+pad;    cardY = deckLoc.y; } else {
            cardX = width/2-pad-cardSize;    cardY = deckLoc.y;}
    } else if (forWhom == 'BIG') {
        if(index % 2 == 0) {
            cardX = width/2+pad;    cardY = height-height/8-cardSize; } else {
            cardX = width/2-pad-cardSize;    cardY = height-height/8-cardSize;}
    } else if (forWhom == 'LITTLE') {
        let seatNum = parseInt(Player.mySeat);
        let rad = 0;
        let cardNum = 0;
        for(let j = 0; j < Player.Hand.length; j++) {
            for(let k = 0; k < littleCards.length; k++) {
                if(Player.Hand[j] == littleCards[k].Card.cardIndexValue) {
                    cardNum++;}}}
        if(seatNum <= GameRoomData.playerLimit/2) {
            rad = 270;
            cardX = SeatCoordsArray[seatNum].x-cardSize*1.5/2;
            if(cardNum % 2 == 0) {cardY = SeatCoordsArray[seatNum].y+height/32-pad/2;} else {cardY = SeatCoordsArray[seatNum].y+height/32+cardSize/2+pad/2;}
        } else {
            cardX = SeatCoordsArray[seatNum].x+height/16+cardSize*1.5/2;
            rad = 90;
            if(cardNum % 2 == 0) {cardY = SeatCoordsArray[seatNum].y+height/32+pad/2;} else {cardY = SeatCoordsArray[seatNum].y+height/32-cardSize/2-pad/2;}
        }
        return {x: cardX, y: cardY, rad: rad}
    }
    return {x: cardX, y: cardY}}

//Create Pixelated Image
function make_image(base_image, xwidth, yheight, xSize, ySize, ctx) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(base_image, xwidth, yheight, xSize, ySize);}
