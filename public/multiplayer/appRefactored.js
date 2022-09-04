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
var myName = '';

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
            //Player Events
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
                updatePlayer(myName, [], 0, 0, false, false, 'NULL', 0);
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
        },
        Player : {
            //#7 Send joining player's name for host to check
            sendName : function() {
                let joinName = $('#inputPlayerName').val() || 'anon';
                console.log(joinName);
                let data = {name: joinName, socketId: App.mySocketId, gameId: GameRoomData.gameId}
                IO.socket.emit('playerJoinREQ', data);
            },
        },
        Host : {
            //Player is trying to join lobby with name
            playerJoinREQ : function(data) {
                console.log("Player " + data.name + " is trying to join my lobby " + data.gameId);
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

 function updatePlayer(myName, myHand, bank, bet, ready, fold, win, seatIndex) {
    let player = {
        myName: myName,
        myHand: myHand,
        bank: bank,
        bet: bet,
        ready: ready,
        fold: fold,
        win: win
    }
    GameRoomData.Seats[seatIndex] = player;
 }