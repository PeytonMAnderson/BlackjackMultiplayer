//Canvas variables
var canvas;
var menu;
var ctx;
var width;
var height;
var fontSize;
var pad;

//Timing Variables
var reqAnim;
var previousTimeStamp;
var startTimer = false;
var beginTime = 0;
var timeElapsed = 0;
var FPS = 0;
var FPSText;

//Set up cursor variables
var curX;
var curY;
var ratioX;
var offsetX;
var ratioY;
var offsetY;

//Local visual Variables
var seatButtons = new Array();
var readyButtonText;
var readyButton;

//Load Image Resources
var tableImage = new Image();
tableImage.src = window.location.protocol+'//'+window.location.host+'/textures/table.png';
var cardBack = new Image();
cardBack.src = window.location.protocol+'//'+window.location.host+'/textures/cardBack.png';
var cardFront = new Image();
cardFront.src = window.location.protocol+'//'+window.location.host+'/textures/cardFront.png';
var clubImage = new Image();
clubImage.src = window.location.protocol+'//'+window.location.host+'/textures/club.png';
var spadeImage = new Image();
spadeImage.src = window.location.protocol+'//'+window.location.host+'/textures/spade.png';
var heartImage = new Image();
heartImage.src = window.location.protocol+'//'+window.location.host+'/textures/heart.png';
var diamondImage = new Image();
diamondImage.src = window.location.protocol+'//'+window.location.host+'/textures/diamond.png';

//Controls elements of text on screen
class ScreenText {
    constructor(Text, color, format, fontS, font, posX, posY, maxWidth, Alignment) {
        this.text = Text;
        this.color = color;
        this.format = format;
        this.size = fontS;
        this.font = font;
        this.x = posX;
        this.y = posY;
        this.maxWidth = maxWidth;
        this.align = Alignment;}
    //Methods
    draw(ctx) {
        //ctx.fillStyle = 'rgb(' + this.color + ')';
        ctx.font = this.format + ' ' + this.size + 'px' + ' ' + this.font;
        ctx.textAlign = this.align;
        ctx.fillStyle = 'rgb(' + 255 + ',' + 255 + ',' + 255 + ')';
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

function runJavaScriptApp() {
    //-----------------------------------------------------------------------------------------------------------
    //INITIALIZE DEPENDANCIES
    //-----------------------------------------------------------------------------------------------------------
    canvas = document.querySelector('.myCanvas');
    menu = document.querySelector('.gridtitle');
    ctx = canvas.getContext('2d');
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight-menu.offsetHeight;
    fontSize = getSize('FONT');
    pad = getSize('PAD');
    updateOffset();

    FPSText = new ScreenText('0','255,255,255','bold', fontSize, 'Ariel', width, fontSize, width/8, 'right');
    readyButtonText =  new ScreenText('Not Ready', '255,255,255', 'bold', height/16, 'Ariel', width/2, height-height/32, width, 'center');
    readyButton =  new ScreenButton(readyButtonText, '200,50,50', 0, height-height/8, width, height/8);
    createSeats();

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
                if(findMe().ready != true) {checkSeatButtons(true);}
                checkReadyButton(true);
                break;
        }
    });
    canvas.addEventListener('mouseup', function(evt){
        //GameStages
        switch(GameRoomData.gameStage) {
            case 0:
                if(findMe().ready != true) {checkSeatButtons(false);}
                checkReadyButton(false);
                break;
        }
    });
    //Start Game
    window.requestAnimationFrame(animateFrame);
}

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
        let newFPS = 1000/(timeStamp - previousTimeStamp);
        newFPS = parseInt(newFPS);
        FPS = FPS > newFPS ? FPS : newFPS;
        FPSText.text = FPS;
        //ANIMATION FRAMES
        //Add player list in desktop mode
        drawBackground(GameRoomData.color);
        drawLeaderBoard();
        switch(GameRoomData.gameStage) {
            case 0:
                drawWaitingScreen();
                break;
            case 1:
                drawBettingScreen();
                break;
            case 2:
                drawDealingScreen();
                break;
            case 3:
                drawPlayingScreen();
                break;
            case 4:
                drawEndScreen();
                break;
        }
    }
    ctx.fillStyle = 'rgb(' + 255 + ',' + 0 + ',' + 0 + ')';
    ctx.fillRect(curX, curY, 10, 10);
    FPSText.draw(ctx);

    previousTimeStamp = timeStamp;
    reqAnim = window.requestAnimationFrame(animateFrame);}
//-----------------------------------------------------------------------------------------------
//
//  MAIN DRAW FUNCTIONS
//
//-----------------------------------------------------------------------------------------------
//Draw the Waiting Room Screen
function drawWaitingScreen() {
    drawSeats(false);
    drawReadyButton();
    let ready = true;
    for(let i = 0; i < GameRoomData.playerLimit; i++) {
        if(GameRoomData.Seats[i] != 'EMPTY') {
            if(GameRoomData.Seats[i].ready == false) ready = false;}}
    if(ready == true) {
        if(sockets.id == GameRoomData.hostSocketId) {
            startCountdown(10);
        }
    } else {
        if(sockets.id == GameRoomData.hostSocketId) {
            stopCountdown();
        }
    }
    drawCountdown(10);
    if(GameRoomData.timeLeft <= 0) {
        GameRoomData.timeLeft = 'NULL';
        GameRoomData.gameStage = 1;
        sendGameUpdate();
    }
}

//Draw the Betting phase of the game
function drawBettingScreen() {

}

//Draw the Dealing phase of the game
function drawDealingScreen() {

}

//Draw the playing phase of the game
function drawPlayingScreen() {

}

//Draw the ending phase of the game
function drawEndScreen() {

}

//-----------------------------------------------------------------------------------------------
//
//  MISC DRAW FUNCTIONS
//
//-----------------------------------------------------------------------------------------------
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

//Display Player LeaderBoard
function drawLeaderBoard() {
    if(GameRoomData.hostSocketId == sockets.id) {
        if(width >= height) {
            let playerNumber = 0;
            for (let i = 0; i < GameRoomData.playerLimit; i++) {
                if(GameRoomData.Seats[i] != 'EMPTY' && GameRoomData.Seats[i] != null) {
                    ctx.fillStyle = 'rgb(50,150,50)';
                    ctx.fillRect(0, playerNumber*(fontSize+(pad/2))+height/64, width/4, fontSize);
                    let text = new ScreenText(GameRoomData.Seats[i].myName,'255,255,255','bold', fontSize, 'Ariel', 0, playerNumber*(fontSize+(pad/2))+fontSize-fontSize/6+height/64, width/8, 'start');
                    let text2 = new ScreenText('$'+GameRoomData.Seats[i].bank,'255,255,255','bold', fontSize, 'Ariel', width/4, playerNumber*(fontSize+(pad/2))+fontSize-fontSize/6+height/64, width/8, 'right');
                    text.draw(ctx);
                    text2.draw(ctx);
                    playerNumber++;}}}}}
//Draw Countdown bar at top
function drawCountdown(beginTime) {
    if(timeSinceUpdate <= FPS) timeSinceUpdate++;
    if(GameRoomData.timeLeft == 'NULL') return;
    ctx.fillStyle = 'rgb(75,75,75)';
    ctx.fillRect(0, 0, width, height/64);
    let G = GameRoomData.timeLeft*(205/beginTime) + 50;
    let R = 255 - GameRoomData.timeLeft*(205/beginTime);
    ctx.fillStyle = 'rgb('+ R + ',' + G + ',50)';
    let secondSize = width/beginTime;
    let barSize = (GameRoomData.timeLeft)*secondSize;
    let extraSize = (timeSinceUpdate/FPS)*secondSize;
    ctx.fillRect(0, 0, barSize-extraSize, height/64);
}       
//Draw Each Seat
function drawSeats(started) {
    for(let i = 0; i < GameRoomData.playerLimit; i++) {
        if(GameRoomData.Seats[i] == 'EMPTY') {
            seatButtons[i].buttonColor = (started) ? '100,100,100' : '50,50,255';
        } else {
            if(GameRoomData.Seats[i].fold == true) {seatButtons[i].buttonColor = '255,255,50';} else {
                if(GameRoomData.Seats[i].ready == true) {seatButtons[i].buttonColor = '50,255,50';} else {seatButtons[i].buttonColor = '255,50,50';}
            }
        }
        seatButtons[i].draw(ctx);
    }
}

//Create array of seats
function createSeats() {
    seatButtons = [];
    let bS = getSize('SEATBUTTON');
    for(let i = 0; i < GameRoomData.playerLimit; i++) {
        let gL = getLocation('SEATTEXT', i);
        let seatText = new ScreenText(i+1, '255,255,255', 'bold', fontSize, 'Ariel', gL.x, gL.y, bS, 'center');
        gL = getLocation('SEATBUTTON', i);
        seatButtons[i] = new ScreenButton(seatText, '50, 50, 255', gL.x, gL.y, bS, bS);
    }
}

//Check each seat to see if cursor is over button
function checkSeatButtons(isClicked) {
    for(let i = 0; i < GameRoomData.playerLimit; i++) {
        if(seatButtons[i].clicked(curX, curY)) {
                seatButtons[i].isClicked = isClicked;
                if(GameRoomData.Seats[i] == 'EMPTY') {
                    let player = findMe();
                    let data = {gameId:GameRoomData.gameId, player : player, seat: i}
                    sockets.emit('seatChangeREQ', data);
                }
        } else {seatButtons[i].isClicked = false;}
    }
}

//Cheack Ready button for Waiting Room
function checkReadyButton(isClicked) {
    if(isClicked == true) {
        if(readyButton.clicked(curX,curY)) {
            readyButton.isClicked = isClicked;
            let player = findMe();
            let data = {gameId:GameRoomData.gameId, player : player}
            sockets.emit('readyChangeREQ', data);
        }
    } else {readyButton.isClicked = false;}
}

//Draw Ready button
function drawReadyButton() {
    let myself = findMe();
    if(myself.ready == true) {
        readyButton.buttonColor = '50,255,50';
        readyButtonText.text = 'Ready';        
    } else {
        readyButton.buttonColor = '255,50,50';
        readyButtonText.text = 'Not Ready';
    }
    readyButton.draw(ctx);
}

//Create Pixelated Image
function make_image(base_image, xwidth, yheight, xSize, ySize, ctx) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(base_image, xwidth, yheight, xSize, ySize);}