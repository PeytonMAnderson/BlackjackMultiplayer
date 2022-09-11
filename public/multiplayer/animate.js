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
//COUNTDOWN
var intervalID = undefined;

//Set up cursor variables
var curX;
var curY;
var ratioX;
var offsetX;
var ratioY;
var offsetY;

//Local visual Variables
//--------------------------------------------------------------------
var mobileMode;
//Waiting Buttons
var seatButtons = new Array();
var seatInfo = new Array(); // {myName, bank, bet}
var readyButtonText;
var readyButton;

//Betting Screen Buttons
// 0 = Bet, 1 = Clear, 2 = Fold, 3 = $1, 4 = $10, 5 = $100, 6 = $1000
var bettingButtons = new Array();
var bankText;
var betText;

//Playing Screen Buttons
var playingButtons = new Array();
var dealerBJTxt;
var playerBJTxt;

//Win State Text
var winStateTxt;

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

//Local Cards
var cardArray = new Array();
var recLatestCard = false;
var latestCard;
var cardOrigin;
var cardSize = 0;
var cardTime = 0;

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
        ctx.fillStyle = 'rgb(' + this.color + ')';
        ctx.font = this.format + ' ' + this.size + 'px' + ' ' + this.font;
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

class Card {
    constructor(X, Y, cardValue, face, isBig, OrgX, OrgY, rotation) {
        this.cardValue = cardValue;
        this.xf = X;
        this.yf = Y;
        this.x = OrgX;
        this.y = OrgY;
        this.size = isBig ? cardSize : cardSize/2;
        this.face = face;
        this.animating = (this.x != this.xf || this.y != this.yf);
        this.rotate = rotation;
    }
    calcSuite() {
        if(this.cardValue >= 0 && this.cardValue <= 12)   return "club";
        if(this.cardValue >= 13 && this.cardValue <= 25)  return "spade";
        if(this.cardValue >= 26 && this.cardValue <= 38)  return "heart";
        if(this.cardValue >= 39 && this.cardValue <= 51)  return "diamond";
    }
    calcValue() {return this.cardValue % 13;}
    calcFaceValue() {
        let crudeValue = this.calcValue();
        if(crudeValue >= 1 && crudeValue <= 9) {crudeValue++;   return crudeValue;}
        if(crudeValue == 10)    return "J";
        if(crudeValue == 11)    return "Q";
        if(crudeValue == 12)    return "K";
        if(crudeValue == 0)    return "A";}
    draw(ctx) {
        let thisX = this.x;
        let thisY = this.y;
        if(this.rotate != 0) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate((this.rotate)*Math.PI/180);
            thisX = 0;  thisY = 0;
        }
        if(this.face == 'FRONT') {
            make_image(cardFront, thisX, thisY, this.size, this.size*1.5, ctx);
            let suite = this.calcSuite();
            let value = this.calcFaceValue();
            let cardIcon;
            if(suite == 'diamond' || suite == 'heart') {
                ctx.fillStyle = 'rgb(255,0,0)';
                if(suite == 'diamond') {cardIcon = diamondImage;} else {cardIcon = heartImage;}} else {
                ctx.fillStyle = 'rgb(0,0,0)';
                if(suite == 'spade') {cardIcon = spadeImage;} else {cardIcon = clubImage;}}
            ctx.font = "italic bold " + this.size*0.5 + "pt Ariel";
            ctx.textAlign = 'center';
            ctx.fillText(value, thisX+this.size/2, thisY+this.size/2, this.size);
            make_image(cardIcon, thisX, thisY+(this.size*0.5), this.size, this.size, ctx);
        } else if(this.face == 'BACK') {make_image(cardBack, thisX, thisY, this.size, this.size*1.5, ctx); }
        if(this.rotate != 0) {ctx.restore();}
    }
    animate(ctx, time) {
        if(this.animating == true) {
            const vx = (this.xf - this.x) / ((time/1000)*FPS/4);
            const vy = (this.yf - this.y) / ((time/1000)*FPS/4);
            //If animation passed stop point
            if(this.xf == this.x && this.yf == this.y || Math.abs(vx) < 0.001 && Math.abs(vy) < 0.001) {
                this.x = this.xf;
                this.y = this.yf;
                this.animating = false;
            } else {
                this.x = this.x+vx;
                this.y = this.y+vy;
            }
        }
        this.draw(ctx);
    }
}

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
    if(height > width) mobileMode = true;
    cardOrigin = getLocation('CARDORIGIN');
    cardSize = getSize('CARDSIZE');
    updateOffset();

    FPSText = new ScreenText('0','255,255,255','bold', fontSize, 'Ariel', width, fontSize, width/8, 'right');
    readyButtonText =  new ScreenText('Not Ready', '255,255,255', 'bold', height/16, 'Ariel', width/2, height-height/32, width, 'center');
    readyButton =  new ScreenButton(readyButtonText, '200,50,50', 0, height-height/8, width, height/8);
    bankText = new ScreenText('Bank: $0', '255,255,255', 'bold', fontSize/3, 'Ariel', width/8, height*(7/8)-fontSize/4, width/2, 'center');
    betText = new ScreenText('Bet: $0', '255,255,255', 'bold', fontSize/4, 'Ariel', width/8, height*(7/8)-fontSize/2-pad, width/2, 'center');
    dealerBJTxt = new ScreenText('0', '255, 255, 255', 'bold', fontSize, 'Ariel', width/2 + cardSize*1.5 + pad*2, cardOrigin.y+cardSize*(3/4)+fontSize/4, width/4, 'center');
    playerBJTxt = new ScreenText('0', '255, 255, 255', 'bold', fontSize, 'Ariel', width/2, height*(15/16), cardSize, 'center');
    winStateTxt = new ScreenText('NULL', '0, 0, 0', 'bold', fontSize*2, 'Ariel', width/2, height/2+fontSize, width/4, 'center');
    createBettingButtons();
    createPlayingButtons();
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
            case 1:
                checkBetButtons(true);
                break;
            case 3:
                checkPlayingButtons(true);
                break;
            case 4:
                sendUserData('readyUpREQ');
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
            case 1:
                checkBetButtons(false);
                break;
            case 3: 
                checkPlayingButtons(false);
                break;
        }
    });
    //Start Game
    startTimer = true;
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
        make_image(cardBack, cardOrigin.x, cardOrigin.y, cardSize, cardSize*1.5, ctx);
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
        if(sockets.id == GameRoomData.hostSocketId) {startCountdown(5);}
    } else {
        if(sockets.id == GameRoomData.hostSocketId) {stopCountdown();}
    }
    drawCountdown(5);
    if(sockets.id == GameRoomData.hostSocketId) {
        if(GameRoomData.timeLeft <= 0) {
            GameRoomData.timeLeft = 'NULL';
            GameRoomData.gameStage = 1;
            stopCountdown();
            unreadyEveryone();
            sendGameUpdate();}}}

//Draw the Betting phase of the game
function drawBettingScreen() {
    drawSeats(true);
    drawBettingButtons();
    drawBankText();
    drawCountdown(30);
    if(sockets.id == GameRoomData.hostSocketId) {
        if(GameRoomData.timeLeft == 'NULL') {startCountdown(30);}
        let lobbyReady = true;
        for(let i = 0; i < GameRoomData.playerLimit; i++) {
            if(GameRoomData.Seats[i].ready == false && GameRoomData.Seats[i].fold == false) {lobbyReady = false; break;}
        }
        if(lobbyReady || GameRoomData.timeLeft <= 0) {
            GameRoomData.timeLeft = 'NULL';
            GameRoomData.gameStage = 2;
            GameRoomData.turn = 0;
            GameRoomData.DealerHand = [];
            autoFold();
            unreadyEveryone();
            stopCountdown();
            sendGameUpdate();}}}

//Draw the Dealing phase of the game
function drawDealingScreen() {
    drawSeats(true);
    drawCards();
    drawBJText();
    if(GameRoomData.hostSocketId == sockets.id) {
        if(GameRoomData.DealerHand.length == 2 && latestCard.animating == false) {goToNext();   return;}
        if(cardArray.length == 0 && GameRoomData.turn == 0) {
            findNextPlayer();
            if(GameRoomData.turn >= GameRoomData.playerLimit) {goToNext();    return;}
            let data = {gameId: GameRoomData.gameId, holderType:'PLAYER', cardHolder: GameRoomData.Seats[GameRoomData.turn]}
            sockets.emit('getNewCardACK', data);
            GameRoomData.turn++;
        } else {
            if(latestCard != undefined && latestCard.animating == false && recLatestCard == true) {
                findNextPlayer();
                if(GameRoomData.turn < GameRoomData.playerLimit) {
                    let data = {gameId: GameRoomData.gameId, holderType:'PLAYER', cardHolder: GameRoomData.Seats[GameRoomData.turn]}
                    sockets.emit('getNewCardACK', data);
                    GameRoomData.turn++;
                } else {
                    let data = {gameId: GameRoomData.gameId, holderType:'DEALER', cardHolder: GameRoomData.DealerHand}
                    sockets.emit('getNewCardACK', data);
                    GameRoomData.turn = 0;
                }
                recLatestCard = false;
            }
        }
    }
    function goToNext() {
        unreadyEveryone();
        resetWin();
        checkDeltBJ();
        GameRoomData.timeLeft = 'NULL';
        GameRoomData.gameStage = 3;
        GameRoomData.turn = 0;
        sendGameUpdate();
    }
}

//Draw the playing phase of the game
function drawPlayingScreen() {
    drawSeats(true);
    drawCards();
    drawPlayingButtons();
    drawBJText();
    if(GameRoomData.hostSocketId == sockets.id) {
        //After all player's turn
        if(GameRoomData.turn >= GameRoomData.playerLimit) {
            sockets.emit('getDealersHidden', GameRoomData.gameId);
            GameRoomData.timeLeft = 'NULL';
            unreadyEveryone();
            GameRoomData.gameStage = 4;
            GameRoomData.turn = 0;
            sendGameUpdate();
        //If the current seat is not playable
        } else if (GameRoomData.Seats[GameRoomData.turn] == 'EMPTY' || GameRoomData.Seats[GameRoomData.turn].fold || GameRoomData.Seats[GameRoomData.turn].ready) {
            if (GameRoomData.turn == 0) {findNextPlayer();  sendGameUpdate();}
        //If current player busted, move to next
        } else if (calcBJValue(GameRoomData.Seats[GameRoomData.turn].myHand) == 'BUST') {
            GameRoomData.Seats[GameRoomData.turn].win = 'L';
            GameRoomData.Seats[GameRoomData.turn].bet = 0;
            GameRoomData.turn++;
            findNextPlayer();
            sendGameUpdate();
        }
    }
}

//Draw the ending phase of the game
function drawEndScreen() {
    drawSeats(true);
    drawCards();
    drawBJText();
    calcWinState();
    if(winStateTxt.text != 'NULL')  winStateTxt.draw(ctx);
    //If no one played this round
    if(cardArray.length < 3) {resetRound();    sendGameUpdate();}
    if(GameRoomData.hostSocketId == sockets.id) {
        //If Dealer has less than 17, add more cards
        let dealerV = calcBJValue(GameRoomData.DealerHand);
        if(latestCard != undefined && !latestCard.animating && recLatestCard && dealerV != 'BUST' && dealerV < 17) {
            let data = {gameId: GameRoomData.gameId, holderType:'DEALER', cardHolder: GameRoomData.DealerHand}
            sockets.emit('getNewCardACK', data);
            recLatestCard = false;
        }
        //Dealer busts, win everyone still in
        if(dealerV == 'BUST' && !latestCard.animating) {
            let ready = true;
            for(let i = 0; i < GameRoomData.playerLimit; i++) {
                if(GameRoomData.Seats[i] != 'EMPTY') {
                    if(!GameRoomData.Seats[i].fold) {
                        if(GameRoomData.Seats[i].win == 'NULL') {
                            GameRoomData.Seats[i].win = 'W';
                            GameRoomData.Seats[i].bank = GameRoomData.Seats[i].bank + (GameRoomData.Seats[i].bet * 2);
                            GameRoomData.Seats[i].bet = 0; 
                            sendGameUpdate();
                        }
                        if(!GameRoomData.Seats[i].ready) ready = false;
                    }
                }
            }
            if(ready) {resetRound();    sendGameUpdate();}
        //Dealer reached 17, compare everyone still in
        } else if(dealerV >= 17 && !latestCard.animating) {
            let ready = true;
            for(let i = 0; i < GameRoomData.playerLimit; i++) {
                if(GameRoomData.Seats[i] != 'EMPTY') {
                    if(!GameRoomData.Seats[i].fold) {
                        if(GameRoomData.Seats[i].win == 'NULL') {
                            let playerV = calcBJValue(GameRoomData.Seats[i].myHand);
                            if(playerV > dealerV) {
                                GameRoomData.Seats[i].win = 'W';
                                GameRoomData.Seats[i].bank = GameRoomData.Seats[i].bank + (GameRoomData.Seats[i].bet * 2);                        
                            } else if(playerV == dealerV) {
                                GameRoomData.Seats[i].win = 'T';
                                GameRoomData.Seats[i].bank = GameRoomData.Seats[i].bank + (GameRoomData.Seats[i].bet * 1);            
                            } else {
                                GameRoomData.Seats[i].win = 'L';
                            }
                            GameRoomData.Seats[i].bet = 0; 
                            sendGameUpdate();
                        }
                        if(!GameRoomData.Seats[i].ready) ready = false;
                    }
                }
            }
            if(ready) {resetRound();    sendGameUpdate();}
        }
    }
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
                    let score = GameRoomData.Seats[i].bank + GameRoomData.Seats[i].bet;
                    let text2 = new ScreenText('$'+score,'255,255,255','bold', fontSize, 'Ariel', width/4, playerNumber*(fontSize+(pad/2))+fontSize-fontSize/6+height/64, width/8, 'right');
                    text.draw(ctx);
                    text2.draw(ctx);
                    playerNumber++;}}}}}
//Draw Countdown bar at top
function drawCountdown(beginTime) {
    if(timeSinceUpdate <= FPS) timeSinceUpdate++;
    if(GameRoomData.timeLeft == 'NULL') return;
    ctx.fillStyle = 'rgb(75,75,75)';
    ctx.fillRect(0, 0, width, height/64);
    let secondSize = width/beginTime;
    let barSize = (GameRoomData.timeLeft)*secondSize;
    let extraSize = (timeSinceUpdate/FPS)*secondSize;
    let c = getBarColor(barSize-extraSize);
    ctx.fillStyle = 'rgb('+ c.r + ',' + c.g + ',50)';
    ctx.fillRect(0, 0, barSize-extraSize, height/64);
}

//Draw Each Seat
function drawSeats(started) {
    for(let i = 0; i < GameRoomData.playerLimit; i++) {
        if(GameRoomData.Seats[i] == 'EMPTY') {
            seatButtons[i].buttonColor = (started) ? '100,100,100' : '50,50,255';
        } else {
            if(GameRoomData.Seats[i].fold == true) {seatButtons[i].buttonColor = '255,255,50';} else {
                if(calcBJValue(GameRoomData.Seats[i].myHand) == 'BUST') {seatButtons[i].buttonColor = '5,5,5';} else {
                    if(GameRoomData.Seats[i].ready == true) {seatButtons[i].buttonColor = '50,255,50';} else {
                        if(GameRoomData.turn == i && GameRoomData.gameStage == 3) {seatButtons[i].buttonColor = '50,255,255';} else {seatButtons[i].buttonColor = '255,50,50';}
                    }
                }
            }
        }
        seatButtons[i].draw(ctx);
    }
    drawSeatInfo();
}

//Check each seat to see if cursor is over button
function checkSeatButtons(isClicked) {
    for(let i = 0; i < GameRoomData.playerLimit; i++) {
        if(seatButtons[i].clicked(curX, curY)) {
                seatButtons[i].isClicked = isClicked;
                if(GameRoomData.Seats[i] == 'EMPTY' && isClicked) {
                    sendUserData('seatChangeREQ', i);
                }
        } else {seatButtons[i].isClicked = false;}
    }
}

//Cheack Ready button for Waiting Room
function checkReadyButton(isClicked) {
    if(isClicked == true) {
        if(readyButton.clicked(curX,curY)) {
            readyButton.isClicked = isClicked;
            sendUserData('readyChangeREQ');
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

//Draw Betting Buttons
function drawBettingButtons() {
    let myself = findMe();
    if(myself.ready == false && myself.fold == false) {
        for(let i = 0; i < bettingButtons.length; i++) {
            bettingButtons[i].draw(ctx);
    }
}}

//Draw Playing Buttons
function drawPlayingButtons() {
    let myself = findMe();
    for(let i = 0; i < playingButtons.length; i++) {
        if(GameRoomData.turn == myself.seat)    playingButtons[i].draw(ctx);
    }
}

//Draw Bet and Bank Text
function drawBankText() {
    let myself = findMe();
    if(myself.ready == false && myself.fold == false) {
        betText.text = "Bet: $" + myself.bet;
        bankText.text = "Bank: $" + myself.bank;
        betText.draw(ctx);
        bankText.draw(ctx);
    }
}

//Check Bet Buttons
function checkBetButtons(isClicked) {
    let myself = findMe();
    if(myself.ready == false && myself.fold == false) {
        for(let i = 0; i < bettingButtons.length; i++) {
            if(bettingButtons[i].clicked(curX, curY)) {
                bettingButtons[i].isClicked = isClicked;
                if(isClicked) sendUserData('betChangeREQ', bettingButtons[i].screenText.text);}
            if(!isClicked) bettingButtons[i].isClicked = false;
}}}

//Check Playing Buttons
function checkPlayingButtons(isClicked) {
    let myself = findMe();
    if(myself.seat != GameRoomData.turn) return;
    for(let i = 0; i < playingButtons.length; i++) {
        if(playingButtons[i].clicked(curX, curY)) {
            playingButtons[i].isClicked = isClicked;
            if(isClicked) sendUserData('playChangeREQ', playingButtons[i].screenText.text);
        }
        if(!isClicked) playingButtons[i].isClicked = false;
    }
}

//Player info on each seat
function drawSeatInfo() {
    for(let i = 0; i < GameRoomData.playerLimit; i++) {
        if(GameRoomData.Seats[i] != 'EMPTY') {
            let gL = getLocation('SEATNAME', {i:i});
            let alignT = i >= GameRoomData.playerLimit/2 ? 'left' : 'right'
            let seatName = new ScreenText(GameRoomData.Seats[i].myName,'255,255,255', 'bold', fontSize/4, 'Ariel', gL.x, gL.y, getSize('SEATBUTTON')*1.5, alignT);
            gL = getLocation('SEATBANK', {i:i});
            let seatBank = new ScreenText('Bank: $' + GameRoomData.Seats[i].bank,'255,255,255', 'bold', fontSize/4, 'Ariel', gL.x, gL.y, getSize('SEATBUTTON')*1.5, alignT);
            gL = getLocation('SEATBET', {i:i});
            let seatBet = new ScreenText('Bet: $' + GameRoomData.Seats[i].bet,'255,255,255', 'bold', fontSize/4, 'Ariel', gL.x, gL.y, getSize('SEATBUTTON')*1.5, alignT);
            seatName.draw(ctx);
            seatBank.draw(ctx);
            seatBet.draw(ctx);
        }
    }
}

//Draw Cards in game
function drawCards() {
    for(let i = 0; i < cardArray.length; i++) {
        cardArray[i].card.animate(ctx, 250);
    }
}

//Draw Blackjack value for player and dealer
function drawBJText() {
    let myself = findMe();
    playerBJTxt.text = calcBJValue(myself.myHand);
    dealerBJTxt.text = calcBJValue(GameRoomData.DealerHand);
    playerBJTxt.draw(ctx);
    dealerBJTxt.draw(ctx);
}

//Create Pixelated Image
function make_image(base_image, xwidth, yheight, xSize, ySize, ctx) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(base_image, xwidth, yheight, xSize, ySize);}

