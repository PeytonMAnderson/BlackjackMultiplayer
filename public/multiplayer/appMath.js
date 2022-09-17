//Get Size of different texts and shapes
function getSize(typeFor) {
    let size = 0;
    if(typeFor == 'FONT') {if(width >= height) {size = height/16;} else {size = height/16;}
    } else if(typeFor == 'PAD') {size = height/64;
    } else if(typeFor == 'SEATBUTTON') {size = height/16;
    } else if(typeFor == 'TABLEX') {if(width > height/2) {size = height/2;} else if(width < height/2) {size = width;} else {size = width;}
    } else if(typeFor == 'TABLEY') {if(width > height/2) {size = height} else if(width < width*2) {size = width;} else {size = height;}
    } else if(typeFor == 'CARDSIZE') {if(width < height/2) {size = width/(100/18);} else {size = height/(200/18);}
    }
    return size;}

//Get location of different text and shapes
function getLocation(typeFor, data) {
    let loc = {x: 0, y: 0}
    if(typeFor == 'SEATBUTTON') {
        if(data.i < GameRoomData.playerLimit/2) {
            let xLoc = width/2+(getSize('TABLEX')/2);
            xLoc = xLoc>width-getSize('SEATBUTTON') ? width-getSize('SEATBUTTON') : xLoc;
            let yLoc = height/2-getSize('SEATBUTTON')*GameRoomData.playerLimit/2;
            yLoc = yLoc + getSize('SEATBUTTON')*2*data.i;
            loc = {x: xLoc, y: yLoc}
        } else {
            let xLoc = width/2-getSize('TABLEX')/2-getSize('SEATBUTTON')
            xLoc = xLoc<0 ? 0 : xLoc;
            let yLoc = height/2+getSize('SEATBUTTON')*GameRoomData.playerLimit/2;
            yLoc = yLoc - getSize('SEATBUTTON')*2*(data.i-GameRoomData.playerLimit/2+1);
            loc = {x: xLoc, y: yLoc}
        }
    } else if (typeFor == 'SEATTEXT') {
        let buttonLoc = getLocation('SEATBUTTON', data);
        loc = {x: buttonLoc.x+getSize('SEATBUTTON')/2, y: buttonLoc.y+getSize('SEATBUTTON')-fontSize/8} 
    } else if (typeFor == 'SEATNAME') {
        let buttonLoc = getLocation('SEATBUTTON', data);
        let extraX = data.i >= GameRoomData.playerLimit/2 ? 0 : getSize('SEATBUTTON');
        loc = {x: buttonLoc.x + extraX, y: buttonLoc.y} 
    } else if (typeFor == 'SEATBANK') {
        let buttonLoc = getLocation('SEATBUTTON', data);
        let extraX = data.i >= GameRoomData.playerLimit/2 ? 0 : getSize('SEATBUTTON');
        loc = {x: buttonLoc.x + extraX, y: buttonLoc.y+getSize('SEATBUTTON')+fontSize/4} 
    } else if (typeFor == 'SEATBET') {
        let buttonLoc = getLocation('SEATBUTTON', data);
        let extraX = data.i >= GameRoomData.playerLimit/2 ? getSize('SEATBUTTON') : 0;
        loc = {x: buttonLoc.x + extraX, y: buttonLoc.y + getSize('SEATBUTTON')/2+fontSize/8} 
    } else if (typeFor == 'CARDORIGIN') {
        if(width > height/2)      {loc = {x: width/2-height/4+height*(4/200), y: height*(4/200)}}
        else if(width < height/2) {loc = {x: width*(4/100), y: height/2-width+width*(4/100)}}
        else                      {loc = {x: height*(4/200), y: height*(4/200)}}
    } else if (typeFor == 'DEALERCARDS') {
        loc = {x:  width/2 - pad - cardSize, y: cardOrigin.y + cardSize*(1/4)*(data.i-1)}
        if(data.i % 2 == 0) { loc = {x:  width/2 + pad, y: cardOrigin.y + cardSize*(1/4)*(data.i)}}
    } else if (typeFor == 'BIGCARDS') {
        loc = {x:  width/2 - pad - cardSize, y: height*(7/8) - cardSize*1.5 - cardSize*(1/4)*(data.i-1)}
        if(data.i % 2 == 0) { loc = {x:  width/2 + pad, y: height*(7/8) - cardSize*1.5 - cardSize*(1/4)*(data.i)}}
    } else if (typeFor == 'SMALLCARDS') {
        let seatLoc = getLocation('SEATBET', data);
        if(data.i >= GameRoomData.playerLimit/2) {
            loc = {x: seatLoc.x + cardSize + (cardSize/8)*(data.cardI-1), y: seatLoc.y - fontSize/4 - cardSize/2, rad: 90}
            if(data.cardI % 2 == 0) {loc.x = seatLoc.x + cardSize + (cardSize/8)*(data.cardI); loc.y = seatLoc.y + fontSize/16}
        } else {
            loc = {x: seatLoc.x - cardSize - (cardSize/8)*(data.cardI), y: seatLoc.y - fontSize/4, rad: 270}
            if(data.cardI % 2 == 1) {loc.x = seatLoc.x - cardSize - (cardSize/8)*(data.cardI-1); loc.y = seatLoc.y + cardSize/2 + fontSize/16}            
        }
    }
    return loc;
}

//Update canvas offsets and canvas scale
function updateOffset() {
    var rect = canvas.getBoundingClientRect();
    offsetX = rect.left;
    offsetY = rect.top;
    ratioX = (rect.right-rect.left)/width;
    ratioY = (rect.bottom-rect.top)/height;
}

//Find myself in Seats
function findMe(){
    let ind = 0;
    while(ind < GameRoomData.playerLimit && GameRoomData.Seats[ind].myName != myName) {ind++;}
    if(GameRoomData.Seats[ind].myName == myName) {return GameRoomData.Seats[ind];} else {return undefined;}
}

//Start coundown
function startCountdown(seconds) {
    if(GameRoomData.timeLeft == 'NULL') {
        GameRoomData.timeLeft = seconds;
        if(sockets.id == GameRoomData.hostSocketId) sendGameUpdate();
        timeSinceUpdate = 0;
        updateCountdown();
    }
}

//Stop countdown
function stopCountdown() {
    GameRoomData.timeLeft = 'NULL';
    clearInterval(intervalID);
    intervalID = undefined;
    sendGameUpdate();
}

//Update Countdown
async function updateCountdown() {
    if(intervalID == undefined) {
        intervalID = setInterval(() => {
            if(GameRoomData.timeLeft == 'NULL') {
                clearInterval(intervalID); 
                return;}
            if(GameRoomData.timeLeft <= 0) {
                GameRoomData.timeLeft = 0;
                clearInterval(intervalID); 
                return;}
            GameRoomData.timeLeft = GameRoomData.timeLeft - 1;
            timeSinceUpdate = 0;
            sendGameUpdate();
        }, 1000);
    }
}

//Get current countdown bar color
function getBarColor(smoothTime) {
    let color = {r: 0, g: 0, b: 0}
    let G = (smoothTime/width)*255;
    let R = 255 - (smoothTime/width)*255;
    color.g = G > 255 ? 255 : G;
    color.r = R < 0 ? 0 : R;
    return color;
}

//Unready everyone in lobby
function unreadyEveryone() {
    if(sockets.id != GameRoomData.hostSocketId) {return;}
    for(let i = 0; i < GameRoomData.playerLimit; i++) {
        if(GameRoomData.Seats[i] != 'EMPTY') {
            if(GameRoomData.Seats[i].fold == false) {
                GameRoomData.Seats[i].ready = false;}}}}
function unfoldEveryone() {
    if(sockets.id != GameRoomData.hostSocketId) {return;}
    for(let i = 0; i < GameRoomData.playerLimit; i++) {
        if(GameRoomData.Seats[i] != 'EMPTY') {
            GameRoomData.Seats[i].fold = false;}}}

//Fold everyone that has not bet
function autoFold() {
    if(sockets.id != GameRoomData.hostSocketId) {return;}
    for(let i = 0; i < GameRoomData.playerLimit; i++) {
        if(GameRoomData.Seats[i] != 'EMPTY') {
            if(GameRoomData.Seats[i].bet == 0) {GameRoomData.Seats[i].fold = true;}}}}

//Calculate the blackjack value of the hand
function calcBJValue(handArray) {
    let totalValue = 0;
    let aces = 0;
    for(let k = 0; k < handArray.length; k++) {
        if(handArray[k] != 'HIDDEN') {
            let currentCard = handArray[k] % 13;
            if(currentCard > 0 && currentCard < 10) {
                //If new card bust but can still use ace
                if(totalValue + currentCard + 1 > 21 && aces >= 1) {
                    totalValue = totalValue - 10 + currentCard + 1;
                    aces--;
                } else {totalValue = totalValue + currentCard + 1;}
            }
            //If card is a Face card, just add 10
            if(currentCard > 9 && currentCard < 13) {
                //If new card bust but can still use ace
                if(totalValue + 10 > 21 && aces > 0) {aces--;} else {
                    totalValue = totalValue + 10;
                }
            }
            //If new card is Ace, add 11 or 1
            if(currentCard == 0) {
                //If adding 11 busts, add 1
                if(totalValue + 11 > 21) {totalValue++;} else {
                    totalValue = totalValue + 11;
                    aces++;
                }
            }
            //If value is over 21, bust
            if(totalValue > 21) {return 'BUST';}
        }
    }
    return totalValue;
}

//Check Delt Blackjack
function checkDeltBJ() {
    for(let i = 0; i < GameRoomData.playerLimit; i++) {
        if(GameRoomData.Seats[i] != 'EMPTY') {
            if(!GameRoomData.Seats[i].fold) {
                if(calcBJValue(GameRoomData.Seats[i].myHand) == 21) {
                    GameRoomData.Seats[i].bank = GameRoomData.Seats[i].bank + (GameRoomData.Seats[i].bet * winMult.toFixed(1) * 1.5);
                    GameRoomData.Seats[i].bet = 0;
                    GameRoomData.Seats[i].ready = true;
                    GameRoomData.Seats[i].win = 'W';
                }
            }
        }
    }
}

//Find next player to give card too
function findNextPlayer() {
    let i = 0;
    for(i = GameRoomData.turn; i < GameRoomData.playerLimit; i++) {
        if(GameRoomData.Seats[i] != 'EMPTY' && !GameRoomData.Seats[i].fold && !GameRoomData.Seats[i].ready) return;
        GameRoomData.turn++;
    }
    GameRoomData.turn++;
}

//Get card amount
function getCardAmount() {
    let count = 0;
    for(let i = 0; i < cardArray.length; i++) {
        if(cardArray[i].type == 'SMALL' || cardArray[i].type == 'DEALER') count++;
    }
    return count;
}

//Sink card down to its location
function sinkDownCard(replaceIndex, replaceType) {
    if(cardArray.length > 1) {
        let j = replaceIndex;
        while(j > 0 && cardArray[j-1].type == 'BIG') {
            const temp = cardArray[j];
            cardArray[j] = cardArray[j-1];
            cardArray[j-1] = temp;
            j--;
        }
        if(replaceType == 'SMALL') {
            while(j > 0 && cardArray[j-1].type == 'DEALER') {
                const temp = cardArray[j];
                cardArray[j] = cardArray[j-1];
                cardArray[j-1] = temp;
                j--;
            }
        }
    }
}

//Rebuild cards in array is empty or corrupted
function rebuildCards() {
    cardArray = [];
    //Little Cards
    for(let i = 0; i < GameRoomData.playerLimit; i++) {
        if(GameRoomData.Seats[i] != 'EMPTY') {
            for(let k = 0; k < GameRoomData.Seats[i].myHand.length; k++) {
                // {type: card:}
                cardArray[cardArray.length] = {type: 'SMALL', card: {}}
                let loc = getLocation('SMALLCARDS', {i: i, cardI: k});
                cardArray[cardArray.length-1].card = new Card(loc.x, loc.y, GameRoomData.Seats[i].myHand[k], 'FRONT', false, loc.x, loc.y, loc.rad);
            }
        }
    }
    //Dealer Cards
    for(let i = 0; i < GameRoomData.DealerHand.length; i++) {
        cardArray[cardArray.length] = {type: 'DEALER', card: {}}
        let loc = getLocation('DEALERCARDS', {i:i});
        let face = (GameRoomData.DealerHand[i] == 'HIDDEN') ? 'BACK' : 'FRONT';
        cardArray[cardArray.length-1].card = new Card(loc.x, loc.y, GameRoomData.DealerHand[i], face, true, loc.x, loc.y, 0);
    }
    //My Cards
    let myself = findMe();
    for(let i = 0; i < myself.myHand.length; i++) {
        cardArray[cardArray.length] = {type: 'BIG', card: {}}
        let loc = getLocation('BIGCARDS', {i:i});
        cardArray[cardArray.length-1].card = new Card(loc.x, loc.y, myself.myHand[i], 'FRONT', true, loc.x, loc.y, 0);
    }
}

//Add new card to cardArray
function addNewCard(data) {
    //holderType, cardHolder
    let replaceI = cardArray.length;
    if(data.holderType == 'DEALER') {
        // SMALL -> DEALER -> BIG
        cardArray[replaceI] = {type: 'DEALER', card: {}}
        let loc = getLocation('DEALERCARDS', {i:data.cardHolder.length-1});
        let face = (data.cardHolder[data.cardHolder.length-1] == 'HIDDEN') ? 'BACK' : 'FRONT';
        cardArray[replaceI].card = new Card(loc.x, loc.y, data.cardHolder[data.cardHolder.length-1], face, true, cardOrigin.x, cardOrigin.y, 0);
        latestCard = cardArray[replaceI].card;
        sinkDownCard(replaceI, 'DEALER');
    } else if (data.holderType == 'PLAYER') {
        let myself = findMe();
        if(myself == data.cardHolder) {
            cardArray[replaceI] = {type: 'BIG', card: {}}
            let loc = getLocation('BIGCARDS', {i:data.cardHolder.myHand.length-1});
            cardArray[replaceI].card = new Card(loc.x, loc.y, data.cardHolder.myHand[data.cardHolder.myHand.length-1], 'FRONT', true, loc.x, loc.y, 0);
            replaceI++;
        }
        cardArray[replaceI] = {type: 'SMALL', card: {}}
        let loc = getLocation('SMALLCARDS', {i: data.cardHolder.seat, cardI: data.cardHolder.myHand.length-1});
        let X = (data.cardHolder.seat >= GameRoomData.playerLimit/2) ? cardOrigin.x - cardSize/2 : cardOrigin.x + cardSize/2;
        cardArray[replaceI].card = new Card(loc.x, loc.y, data.cardHolder.myHand[data.cardHolder.myHand.length-1], 'FRONT', false, X, cardOrigin.y+cardSize/2, loc.rad);
        latestCard = cardArray[replaceI].card;
        sinkDownCard(replaceI, 'SMALL');
    }
}

//Create array of seats
function createSeats() {
    seatButtons = [];
    let bS = getSize('SEATBUTTON');
    for(let i = 0; i < GameRoomData.playerLimit; i++) {
        let gL = getLocation('SEATTEXT', {i:i});
        let seatText = new ScreenText(i+1, '255,255,255', 'bold', fontSize, 'Ariel', gL.x, gL.y, bS, 'center');
        gL = getLocation('SEATBUTTON', {i:i});
        seatButtons[i] = new ScreenButton(seatText, '50, 50, 255', gL.x, gL.y, bS, bS);
    }
}

//Make betting buttons
function createBettingButtons() {
    bettingButtons = [];
    let bLoc = {x: 0, y: height*(7/8), xs: width/4, ys: height/8}
    let bText = new ScreenText('Bet','255,255,255', 'bold', fontSize, 'Ariel', bLoc.x+(bLoc.xs/2), bLoc.y+(bLoc.ys/2)+fontSize/2, bLoc.xs, 'center');
    bettingButtons[0] = new ScreenButton(bText, '50,255,50', bLoc.x, bLoc.y, bLoc.xs, bLoc.ys);
    bLoc = {x: width/4, y: height*(7/8), xs: width/2, ys: height/8}
    bText = new ScreenText('Clear','255,255,255', 'bold', fontSize, 'Ariel', bLoc.x+(bLoc.xs/2), bLoc.y+(bLoc.ys/2)+fontSize/2, bLoc.xs, 'center');
    bettingButtons[1] = new ScreenButton(bText, '255,50,50', bLoc.x, bLoc.y, bLoc.xs, bLoc.ys);
    bLoc = {x: width*(3/4), y: height*(7/8), xs: width/4, ys: height/8}
    bText = new ScreenText('Fold','255,255,255', 'bold', fontSize, 'Ariel', bLoc.x+(bLoc.xs/2), bLoc.y+(bLoc.ys/2)+fontSize/2, bLoc.xs, 'center');
    bettingButtons[2] = new ScreenButton(bText, '255,255,50', bLoc.x, bLoc.y, bLoc.xs, bLoc.ys);
    let xM = mobileMode ? width*(1/4): width*(3/4);
    for(let i = 3; i < 7; i++) {
        bLoc = {x: xM, y: height-(height/8)*(i-1)-pad*(i-2), xs: width/(mobileMode?2:4), ys: height/8}
        bText = new ScreenText('$' + Math.pow(10,(i-3)),'255,255,255', 'bold', fontSize, 'Ariel', bLoc.x+(bLoc.xs/2), bLoc.y+(bLoc.ys/2)+fontSize/2, bLoc.xs, 'center');
        bettingButtons[i] = new ScreenButton(bText, '255,125,50', bLoc.x, bLoc.y, bLoc.xs, bLoc.ys);
    }
}

//Make Playing Buttons
function createPlayingButtons() {
    playingButtons = [];
    let pL = {x: 0, y: 0}
    for(let i = 0; i < 2; i++) {
        if(i % 2 == 0) {
            pL = {x: 0, y: height*(7/8) - (height/8) * i}
            let pT = new ScreenText('Hit', '255,255,255', 'bold', fontSize, 'Ariel', pL.x+width/8, pL.y+height/8-fontSize/4, width/4, 'center');
            let pB = new ScreenButton(pT, '50,255,50', pL.x, pL.y, width/4, height/8);
            playingButtons[playingButtons.length] = pB;
        } else {
            pL = {x: width*(3/4), y: height*(7/8) - (height/8) * (i-1)}
            let pT = new ScreenText('Stay', '255,255,255', 'bold', fontSize, 'Ariel', pL.x+width/8, pL.y+height/8-fontSize/4, width/4, 'center');
            let pB = new ScreenButton(pT, '255,50,50', pL.x, pL.y, width/4, height/8);
            playingButtons[playingButtons.length] = pB;
        }
    }
}

//Reset Win Status
function resetWin() {
    for(let i = 0; i < GameRoomData.playerLimit; i++) {
        if(GameRoomData.Seats[i] != 'EMPTY') {
            GameRoomData.Seats[i].win = 'NULL';
        }
    }
}

//Reset Game Data for next round
function resetRound(gameStage) {     
    GameRoomData.gameStage = gameStage;
    GameRoomData.turn = 0;
    GameRoomData.timeLeft = 'NULL';
    GameRoomData.DealerHand = [];
    for(let i = 0; i < GameRoomData.playerLimit; i++) {
        if(GameRoomData.Seats[i] != 'EMPTY') {
            GameRoomData.Seats[i].myHand = [];
            GameRoomData.Seats[i].win = 'NULL';
            GameRoomData.Seats[i].ready = false;
            GameRoomData.Seats[i].fold = false;
            if(gameStage == 0) {
                GameRoomData.Seats[i].bank = startingBank;
                GameRoomData.Seats[i].bet = 0;
            }
        }
    }
    sockets.emit('resetDeck', {gameId: GameRoomData.gameId, hostSocketId: GameRoomData.hostSocketId});
    unfoldEveryone();
    unreadyEveryone();
    resetLocals();
}

//Reset Local Variables back to beginning
function resetLocals() {
    timeElapsed = 0;
    beginTime = 0;
    startTimer = true;
    cardArray = [];
    recLatestCard = false;
    latestCard = undefined;
    cardTime = 0;
    timeSinceUpdate = 0;
    for(let i = 0; i < bettingButtons.length; i++) bettingButtons[i].isClicked = false;
    for(let i = 0; i < playingButtons.length; i++) playingButtons[i].isClicked = false;
}

//Calcuate the win state of my game
function calcWinState() {
    let myself = findMe();
    switch(myself.win){
        case 'NULL':
            winStateTxt.color = '255,255,255';
            winStateTxt.text = 'NULL';
            break;
        case 'W':
            winStateTxt.color = '50,255,50';
            winStateTxt.text = 'W';
            break;
        case 'T':
            winStateTxt.color = '50,50,255';
            winStateTxt.text = 'T';
            break;
        case 'L':
            winStateTxt.color = '255,50,50';
            winStateTxt.text = 'L';
            break;
    }
}