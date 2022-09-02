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
            IO.socket.on('betChangedREQ', App.Host.betChangeREQ ); //A player is attempting to change their bet
            IO.socket.on('hitChangedREQ', App.Host.hitChangeREQ ); //A player is attempting to hit or stay
            
            //Player Events
            IO.socket.on('playerJoinACK', App.Player.myselfhasJoined ); //The Host has ACK my request to join
            IO.socket.on('aPlayerHasJoined', App.Player.aPlayerHasJoined ); //A player has joined our lobby
            IO.socket.on('userLeavingOurLobby', App.Player.playerLeavingOurLobby ); //A player is attempting to join my lobby
            IO.socket.on('hostLeavingOurLobby', App.Player.hostLeavingOurLobby ); //A player is attempting to join my lobby
            IO.socket.on('seatChangedACK', App.Player.seatChangeACK ); //A player seat has changed
            IO.socket.on('readyChangedACK', App.Player.readyChangeACK ); //A player's status has changed
            IO.socket.on('timeChangedACK', App.Player.timeChangeACK ); //Time Counter has changed
            IO.socket.on('gameStageChangedACK', App.Player.gameStageChangeACK ); //Game Stage has changed
            IO.socket.on('betChangedACK', App.Player.betChangeACK ); //A player seat has changed
            IO.socket.on('dealChangedACK', App.Player.dealChangeACK ); //A player hand has changed
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
            App.$doc.on('click', '#btnStartCreateGame', App.Host.onClickedCreateStart);
            // Player
            App.$doc.on('click', '#btnJoinGame', App.Player.onClickedJoin);
            App.$doc.on('click', '#btnStartJoinGame', App.Player.onClickedJoinStart);
            App.$doc.on('click', '#btnReturn', () => {App.$gameArea.html(App.$blackMainMenu);});
        },
        Player : {
            //User has clicked the join button, display new html options
            onClickedJoin : function() {
                //App.$gameArea.html(App.$templateJoinGame);
            },
            //The user has inputted information and tried to join game, send information and request to server
            onClickedJoinStart : function() {
            },
            myselfhasJoined : function(data) {
            },
            aPlayerHasJoined: function (data) {
            },
            playerLeavingOurLobby: function (data) {
            },
            hostLeavingOurLobby: function () {
            }
        },
        Host : {
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
            playerJoiningAttempt: function(data) {
            },
            playerLeavingMyLobby: function (data) {
            },
            seatChangeREQ: function (data) {
            },
            readyChangeREQ: function (data) {
            },
            betChangeREQ: function (data) {
            },
            hitChangeREQ: function (data) {
            }
        }
    };
    IO.init();
    App.init();
 }($));