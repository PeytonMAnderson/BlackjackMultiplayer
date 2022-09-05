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

    FPSText = new ScreenText('0','255,255,255','bold', fontSize, 'Ariel', width, fontSize, width/8, 'right');
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
        FPS = 1000/(timeStamp - previousTimeStamp);
        FPS = parseInt(FPS);
        FPSText.text = FPS;
        //ANIMATION FRAMES
        //Add player list in desktop mode
        drawBackground(GameRoomData.color);
        drawLeaderBoard();
        switch(GameRoomData.gameStage) {
            case 0:
                break;
            case 1:
                drawBettingScreen();
                break;
            case 2:
                drawDealingScreen();
                break;
            case 3:
                drawPlayingRound();
                break;
        }
    }
    FPSText.draw(ctx);
    previousTimeStamp = timeStamp;
    reqAnim = window.requestAnimationFrame(animateFrame);
}

//Draw the Background Image and Screen
function drawBackground(RGBCOLOR) {
    ctx.fillStyle = 'rgb(' + RGBCOLOR + ')';
    ctx.fillRect(0,0,width,height);
}

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

//Get Size of different texts and shapes
function getSize(typeFor) {
    let size = 0;
    if(typeFor == 'FONT') {if(width >= height) {size = height/16;} else {size = height/16;}}
    if(typeFor == 'PAD') {size = height/64;}
    return size;
}

