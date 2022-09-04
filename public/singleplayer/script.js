//Create Canvas
const canvas = document.querySelector('.myCanvas');
const width = canvas.width = window.innerWidth;
const height = canvas.height = window.innerHeight;
const ctx = canvas.getContext('2d');
ctx.fillStyle = 'rgb(0,125,125)';
ctx.fillRect(0,0,width,height);

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

//-----------------------------------------
//CLASSES
//-----------------------------------------

//All Properties and functions to draw and calculate values
class Card {
    constructor(posX, posY, cardIndexValue, face) {
        this.cardIndexValue = cardIndexValue;
        this.face = face;
        this.x = posX;
        this.y = posY;
        this.animating = false;
        this.animStart = 0;
        this.animEnd = 0;
    }
    //Methods
    flip() {
        if(this.face == 'FRONT') {
            this.face = 'BACK';
        } else {
            this.face = 'FRONT';
        }
    }
    calcSuite() {
        if(this.cardIndexValue >= 1 && this.cardIndexValue <= 13)
            return "Clubs";
        if(this.cardIndexValue >= 14 && this.cardIndexValue <= 26)
            return "Spades";
        if(this.cardIndexValue >= 27 && this.cardIndexValue <= 39)
            return "Hearts";
        if(this.cardIndexValue >= 40 && this.cardIndexValue <= 52)
            return "Diamonds";
    }
    calcValue() {
        if(this.cardIndexValue >= 1 && this.cardIndexValue <= 13)
            return this.cardIndexValue;
        if(this.cardIndexValue >= 14 && this.cardIndexValue <= 26)
            return this.cardIndexValue-13;
        if(this.cardIndexValue >= 27 && this.cardIndexValue <= 39)
            return this.cardIndexValue-26;
        if(this.cardIndexValue >= 40 && this.cardIndexValue <= 52)
            return this.cardIndexValue-39;
    }
    calcFaceValue() {
        let crudeValue = this.calcValue(this.cardIndexValue);
        if(crudeValue >= 1 && crudeValue <= 9) {
          crudeValue++;
          return crudeValue;
        }
        if(crudeValue == 10)
          return "J";
        if(crudeValue == 11)
          return "Q";
        if(crudeValue == 12)
          return "K";
        if(crudeValue == 13)
          return "A";
    }
    buildCard() {
        if(this.face == 'BACK') {
            make_image(cardBack, this.x, this.y, cardSize, cardSize*1.5);
        }
        if(this.face == 'FRONT') {
            make_image(cardFront, this.x, this.y, cardSize, cardSize*1.5);
            let cardSuite = this.calcSuite(this.cardIndexValue);
            let cardValue = this.calcFaceValue(this.cardIndexValue);
            if(cardValue != undefined) {
                if (cardSuite == "Hearts" || cardSuite == "Diamonds") {
                  ctx.fillStyle = 'rgb(255,0,0)';
                  ctx.font = "italic bold " + cardSize*0.5 + "pt Tahoma";
                  ctx.textAlign = 'center';
                  ctx.fillText(cardValue, this.x+cardSize/2, this.y+cardSize/2, cardSize);
                  if(cardSuite == "Hearts") {
                    make_image(heartImage, this.x, this.y+(cardSize*0.5), cardSize, cardSize);
                  }
                  if(cardSuite == "Diamonds") {
                    make_image(diamondImage, this.x, this.y+(cardSize*0.5), cardSize, cardSize);
                  }
                } else {
                  ctx.fillStyle = 'rgb(0,0,0)';
                  ctx.font = "italic bold " + cardSize*0.5 + "pt Tahoma";
                  ctx.textAlign = 'center';
                  ctx.fillText(cardValue, this.x+cardSize/2, this.y+cardSize/2, cardSize);
                  if(cardSuite == "Spades") {
                    make_image(spadeImage, this.x, this.y+(cardSize*0.5), cardSize, cardSize);
                  }
                  if(cardSuite == "Clubs") {
                    make_image(clubImage, this.x, this.y+(cardSize*0.5), cardSize, cardSize);
                  }
                }
            } else {
                ctx.fillStyle = 'rgb(0,0,0)';
                ctx.fillRect(this.x-1, this.y-1, cardSize+2, cardSize*1.5+2);
            }
        }
    }
    animateCardTo(desX, desY, time) {
        if(this.animStart == 0) {
            this.animating = true;
            this.animStart = timeElapsed;
            this.animEnd = this.animStart + time;
        }
        if(timeElapsed < this.animEnd) {
            //Continue Animations
            this.animating = true;
            let vx = 2 * (desX - this.x) / ((time*(FPS/1000))/4);
            let vy = 2 * (desY - this.y) / ((time*(FPS/1000))/4);
            this.x = this.x+vx;
            this.y = this.y+vy;
            this.buildCard();
        } else if (timeElapsed > this.animEnd) {
            if(this.x != desX || this.y != desY) {
                this.x = desX;
                this.y = desY;
            }
            this.buildCard();
            this.animating = false;
            this.animStart = 0;
            this.animEnd = 0;
        }
    }
}

//All properties of a Hand of Cards
class Hand extends Card {
    constructor() {
        super();
        this.handArray = new Array(); //Array of Card Objects
    }
    //Methods
    calcBlackjackValue() {
        let totalValue = 0;
        let aces = 0;
        for(let k = 0; k < this.handArray.length; k++) {
            let currentCard = this.handArray[k].calcValue();
            if (currentCard >= 0 && currentCard <= 9) {
            //If new card busts but hand has ace, use ace
                if(totalValue + currentCard + 1 > 21 && aces >= 1) {
                    totalValue = totalValue - 10 + currentCard + 1;
                    aces--;
                } else {
                    totalValue = totalValue + currentCard + 1;  
                }
            }
            //If new card is Face card, add 10
            if (currentCard >= 10 && currentCard <= 12) {
                //If new card busts but hand has ace, use ace
                if(totalValue + 10 > 21 && aces >= 1) {
                    totalValue = totalValue;
                    aces--;
                } else {
                    totalValue = totalValue + 10;  
                }  
            }
            //If new card is Ace, add 11
            if(currentCard == 13) {
                if(totalValue + 11 <= 21) {
                    totalValue = totalValue + 11;
                    aces++;
                } else if(totalValue + 11 > 21) {
                    totalValue = totalValue + 1;
                }
            }
            if(totalValue > 21) {
                return 'BUST';
            }
        }
        return totalValue;
    }
}

//All properties of a Deck of Cards
class Deck {
    constructor(posX, posY) {
        this.deckArray = new Array();
        for(let i = 1; i < 53; i++) {
            this.deckArray[i-1] = i;
        }
        this.x = posX;
        this.y = posY;
    }
    //Methods
    getCard(index) {
        return this.deckArray[index];
    }
    shuffle() {
        let currentIndex = this.deckArray.length,  randomIndex;
        // While there remain elements to shuffle...
        while (currentIndex != 0) {
          // Pick a remaining element...
          randomIndex = Math.floor(Math.random() * currentIndex);
          currentIndex--;
          // And swap it with the current element.
          [this.deckArray[currentIndex], this.deckArray[randomIndex]] = [
            this.deckArray[randomIndex], this.deckArray[currentIndex]];
        }
    }
}

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
        this.align = Alignment;
    }
    //Methods
    draw() {
        let sizeString = this.size + 'px'
        ctx.fillStyle = 'rgb(' + this.color + ')';
        ctx.font = this.format + ' ' + sizeString + ' ' + this.font;
        ctx.textAlign = this.align;
        ctx.fillText(this.text, this.x, this.y, this.maxWidth);
    }
}

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
        this.isClicked = false;
    }
    draw() {
        let colorArray = this.buttonColor.split(',');
        let R = colorArray[0];
        let G = colorArray[1];
        let B = colorArray[2];
        if(this.isClicked == true) {
            if(R > 100) {R = R - 100;} else {R = 0;}
            if(G > 100) {G = G - 100;} else {G = 0;}
            if(B > 100) {B = B - 100;} else {B = 0;}
        }
        ctx.fillStyle = 'rgb(' + R + ',' + G + ',' + B + ')';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        this.screenText.draw();
    }
    clicked(cursorX, cursorY){
        if(cursorX >= this.x && cursorX <= this.x2) {
            if(cursorY >= this.y && cursorY <= this.y2) {
                return true;
            }
        }
        return false;
    }
}

//Controls variables for the player(s)
class Player extends Hand {
    constructor() {
        super();
        this.bank = 2000;
        this.bet = 0;
        this.hand = new Hand();
    }
}

//-----------------------------------------
//GLOBAL VARIABLES
//-----------------------------------------
var curX;
var curY;
var offsetX;
var offsetY;
var ratioX;
var ratioY;
var pressed = false;
var pad;
var payoutRatio = 2;
var dealingNewCard = false;

var cardsArray = new Array(); //All cards on screen
var cardCount = 0; //The card id currently on top of deck
var dealerHand = new Hand(); //All cards in dealer possession
//Create Deck of Cards
if(width >= height/2) {
    var tableX = width/2-height/4;
    var tableY = 0;
    var cardSize = height/(200/18);
    var pad = height/(200/3);
    var deck = new Deck(tableX+height/(200/4), height/(200/4));
} else if(width < height/2) {
    var tableX = 0;
    var tableY = height/2-width;
    var cardSize = width/(100/18);
    var pad = width/(100/3);
    var deck = new Deck(tableX+width/(100/4), tableY+width/(100/4));
}

if(width > height) {
    var fontSize = height/16;
  } else if (height > width) {
    var fontSize = width/20;
  } else {
    var fontSize = height/16;
  }
//Value of gamestate 0 = unset, 1 = betting, 2 = dealing, 3 = playing, 4 = round over
var gameState = 1;

//Player Values
var thePlayer = new Player();

//Deal Buttons
let FoldButtonText = new ScreenText('Clear','255,255,255','bold', fontSize, 'Ariel', width-width/8, height-height/16+fontSize/2, width/8, 'center');
var FoldButton = new ScreenButton(FoldButtonText,'255,0,0', width-width/4, height-height/8, width/4, height/8);
let BetButtonText = new ScreenText('Bet','255,255,255','bold', fontSize, 'Ariel', width/8, height-height/16+fontSize/2, width/8, 'center');
var BetButton = new ScreenButton(BetButtonText,'0,255,0', 0, height-height/8, width/4, height/8);
let d1ButtonText = new ScreenText('$1','255,255,255','bold', fontSize, 'Ariel', width-width/8, height-height/8-height/16+fontSize/2-pad, width/8, 'center');
var d1Button = new ScreenButton(d1ButtonText,'255,125,0', width-width/4, height-height/4-pad, width/4, height/8);
let d10ButtonText = new ScreenText('$10','255,255,255','bold', fontSize, 'Ariel', width-width/8, height-height/4-height/16+fontSize/2-pad*2, width/8, 'center');
var d10Button = new ScreenButton(d10ButtonText,'255,125,0', width-width/4, height-height/8-height/4-pad*2, width/4, height/8);
let d100ButtonText = new ScreenText('$100','255,255,255','bold', fontSize, 'Ariel', width-width/8, height-height/8-height/4-height/16+fontSize/2-pad*3, width/8, 'center');
var d100Button = new ScreenButton(d100ButtonText,'255,125,0', width-width/4, height-height/2-pad*3, width/4, height/8);
let d1000ButtonText = new ScreenText('$1,000','255,255,255','bold', fontSize, 'Ariel', width-width/8, height-height/2-height/16+fontSize/2-pad*4, width/8, 'center');
var d1000Button = new ScreenButton(d1000ButtonText,'255,125,0', width-width/4, height-height/8-height/2-pad*4, width/4, height/8);
//Play Buttons
let HitButtonText = new ScreenText('Hit','255,255,255','bold', fontSize, 'Ariel', width/8, height-height/16+fontSize/2, width/8, 'center');
var HitButton = new ScreenButton(HitButtonText,'0,255,0', 0, height-height/8, width/4, height/8);
let StayButtonText = new ScreenText('Stay','255,255,255','bold', fontSize, 'Ariel', width-width/8, height-height/16+fontSize/2, width/8, 'center');
var StayButton = new ScreenButton(StayButtonText,'255,0,0', width-width/4, height-height/8, width/4, height/8);
//Texts
var BetText = new ScreenText('Bet: $0','255,255,255','bold', fontSize/2, 'Ariel', width-width/8, height-height/8-height/2-pad*5, width/8, 'center');
var BankText = new ScreenText('Bank: $'+thePlayer.bank,'255,255,255','bold', fontSize,'Ariel', width/2, height-pad, width/2-2, 'center');
var payoutText = new ScreenText('Payout: $0','255,255,255','bold', fontSize/2, 'Ariel', width-width/8, height-height/8-height/2-pad*6-fontSize/2, width/8, 'center');
var currentHandText = new ScreenText('Current Hand: ','255,255,255','bold', fontSize/2, 'Ariel', width/8, height-height/8-pad, width/8, 'center');
var dealerHandText = new ScreenText('Dealer Hand: ','255,255,255','bold', fontSize/2, 'Ariel', width/8, height-height/8-pad-fontSize/2, width/8, 'center');
var GameOutcome = new ScreenText('NULL', '255,255,255', 'bold', fontSize*8, 'Ariel', width/2, height/2+fontSize*2, width/2, 'center');
//-----------------------------------------
//EVENT HANDLERS
//-----------------------------------------
canvas.addEventListener('mousedown', function(evt){
    pressed = true;
    ctx.fillStyle = 'rgb(255, 0 ,0)';
    ctx.fillRect(curX, curY, 5, 5);
    switch(gameState) {
        case 0:
            break;
        case 1:
            if(FoldButton.clicked(curX, curY) == true) {
                FoldButton.isClicked = true;
                thePlayer.bank = thePlayer.bank + thePlayer.bet;
                BankText.text = 'Bank: $' + thePlayer.bank;
                thePlayer.bet = 0;
                payoutText.text = 'Payout: $0';
                BetText.text = 'Bet: $' + thePlayer.bet;
            }
            if(BetButton.clicked(curX, curY) == true) {
                BetButton.isClicked = true;
            }
            if(d1Button.clicked(curX, curY) == true) {
                d1Button.isClicked = true;
                if(thePlayer.bank >= 1) {
                    thePlayer.bet = thePlayer.bet + 1;
                    BetText.text = 'Bet: $' + thePlayer.bet;
                    thePlayer.bank = thePlayer.bank - 1;
                    payoutText.text = 'Payout: $' + thePlayer.bet*payoutRatio;
                    BankText.text = 'Bank: $' + thePlayer.bank;
                }
            }
            if(d10Button.clicked(curX, curY) == true) {
                d10Button.isClicked = true;
                if(thePlayer.bank >= 10) {
                    thePlayer.bet = thePlayer.bet + 10;
                    BetText.text = 'Bet: $' + thePlayer.bet;
                    thePlayer.bank = thePlayer.bank - 10;
                    payoutText.text = 'Payout: $' + thePlayer.bet*payoutRatio;
                    BankText.text = 'Bank: $' + thePlayer.bank;
                }
            }
            if(d100Button.clicked(curX, curY) == true) {
                d100Button.isClicked = true;
                if(thePlayer.bank >= 100) {
                    thePlayer.bet = thePlayer.bet + 100;
                    BetText.text = 'Bet: $' + thePlayer.bet;
                    thePlayer.bank = thePlayer.bank - 100;
                    payoutText.text = 'Payout: $' + thePlayer.bet*payoutRatio;
                    BankText.text = 'Bank: $' + thePlayer.bank;
                }
            }
            if(d1000Button.clicked(curX, curY) == true) {
                d1000Button.isClicked = true;
                if(thePlayer.bank >= 1000) {
                    thePlayer.bet = thePlayer.bet + 1000;
                    BetText.text = 'Bet: $' + thePlayer.bet;
                    thePlayer.bank = thePlayer.bank - 1000;
                    payoutText.text = 'Payout: $' + thePlayer.bet*payoutRatio;
                    BankText.text = 'Bank: $' + thePlayer.bank;
                }
            }
            break;
        case 2:
            break;
        case 3:
            if(HitButton.clicked(curX, curY) == true && dealingNewCard == false && thePlayer.hand.calcBlackjackValue() != 'BUST') {
                HitButton.isClicked = true;
                cardsArray[cardCount] = new Card(deck.x,deck.y, deck.getCard(cardCount), 'FRONT');
                thePlayer.hand.handArray[thePlayer.hand.handArray.length] = cardsArray[cardCount];
                dealingNewCard = true;
                cardCount++;
            }
            if(StayButton.clicked(curX, curY) == true) {
                StayButton.isClicked = true;
            }
            break;
        case 4:
            if(dealingNewCard == false) {
                thePlayer.hand.handArray.length = 0;
                dealerHand.handArray.length = 0;
                cardsArray.length = 0;
                thePlayer.bet = 0;
                cardCount = 0;
                deck.shuffle();
                dealingNewCard = false;
                previousTimeStamp = 0;
                startTimer = false;
                beginTime = 0;
                timeElapsed = 0;
                payoutText.y = height-height/8-height/2-pad*6-fontSize/2;
                payoutText.text = 'Payout: $' + thePlayer.bet*payoutRatio;
                BetText.y = height-height/8-height/2-pad*5;
                BetText.text = 'Bet: $' + thePlayer.bet;
                gameState = 1;
            }
            break;
        default:
    }
});
canvas.addEventListener('mouseup', function(evt){
    pressed = false;
    ctx.fillStyle = 'rgb(255, 0 ,0)';
    ctx.fillRect(curX, curY, 5, 5);
    switch(gameState) {
        case 0:
            break;
        case 1:
            FoldButton.isClicked = false;
            d1Button.isClicked = false;
            d10Button.isClicked = false;
            d100Button.isClicked = false;
            d1000Button.isClicked = false;
            if(BetButton.isClicked == true) {
                BetButton.isClicked = false;
                gameState = 2;
                beginTime = 0;
                startTimer = true;
            }
            
            break;
        case 2:
            break;
        case 3:
            HitButton.isClicked = false;
            if(StayButton.isClicked == true) {
                StayButton.isClicked = false;
                gameState = 4;
                beginTime = 0;
                startTimer = true;
            }
            break;
        case 4:

            break;
        default:
    }
});

// update mouse pointer coordinates on canvas
document.addEventListener('mousemove', e => {
    curX = e.clientX/ratioX-offsetX/ratioX;
    curY = e.clientY/ratioY-offsetY/ratioY;
});

//If window changes, update canvas offsets
window.onscroll=function(e){ updateOffset(); }
window.onresize=function(e){ updateOffset(); }

//Listen for player to click screen
canvas.addEventListener('click', function(evt) {
    updateOffset();
}, false);

//-----------------------------------------
//FUNCTIONS
//-----------------------------------------

//Draw Image on Canvas
function make_image(base_image, xwidth, yheight, xSize, ySize) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(base_image, xwidth, yheight, xSize, ySize);
}

//Update canvas offsets and canvas scale
function updateOffset() {
    var rect = canvas.getBoundingClientRect();
    offsetX = rect.left;
    offsetY = rect.top;
    ratioX = (rect.right-rect.left)/width;
    ratioY = (rect.bottom-rect.top)/height;
}

//Convert degrees to radians
function degToRad(degrees) {
    return degrees * Math.PI / 180;
};

//Delay Time
function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

//Screen Graphics for Betting Screen
function drawBetScreen() {
    FoldButton.draw();
    BetButton.draw();
    d1Button.draw();
    d10Button.draw();
    d100Button.draw();
    d1000Button.draw();
    BetText.draw();
    BankText.draw();
    payoutText.draw();
    make_image(cardBack, deck.x,deck.y,cardSize,cardSize*1.5);
}

//Screen Animations for Dealing Screen
function drawDealScreen() {
    make_image(cardBack, deck.x,deck.y,cardSize,cardSize*1.5);
    //Deal First Card to Player
    if(cardsArray.length == 0 || cardsArray.length == 1) {
        if(cardsArray[0] == undefined && dealingNewCard == false) {
            cardsArray[0] = new Card(deck.x, deck.y, deck.getCard(cardCount), 'FRONT');
            thePlayer.hand.handArray[0] = cardsArray[0];
            dealingNewCard = true;
            cardCount++;
        } else if(cardsArray.length == 1 && dealingNewCard == true) {
            thePlayer.hand.handArray[0].animateCardTo(width/2+pad, height-fontSize*1.5-cardSize*1.5, 500);
            cardsArray[0].x = thePlayer.hand.handArray[0].x;
            cardsArray[0].y = thePlayer.hand.handArray[0].y;
            if(thePlayer.hand.handArray[0].animating == false) {dealingNewCard = false;}
        }
    }
    //Deal Second Card to Dealer
    if(cardsArray.length == 1 || cardsArray.length == 2) {
        thePlayer.hand.handArray[0].buildCard();        
        if(cardsArray[1] == undefined && dealingNewCard == false) {
            cardsArray[1] = new Card(deck.x, deck.y, deck.getCard(cardCount), 'BACK');
            dealerHand.handArray[0] = cardsArray[1];
            dealingNewCard = true;
            cardCount++;
        } else if (cardsArray.length == 2 && dealingNewCard == true) {
            dealerHand.handArray[0].animateCardTo(width/2+pad, deck.y, 500);
            cardsArray[1].x = dealerHand.handArray[0].x;
            cardsArray[1].y = dealerHand.handArray[0].y;
            if(dealerHand.handArray[0].animating == false) {dealingNewCard = false;}
        }
    }

    //Deal Third Card to Player
    if(cardsArray.length == 2 || cardsArray.length == 3) {
        dealerHand.handArray[0].buildCard();
        if(cardsArray[2] ==  undefined && dealingNewCard == false) {
            thePlayer.hand.handArray[0].buildCard();
            cardsArray[2] = new Card(deck.x, deck.y, deck.getCard(cardCount), 'FRONT');
            thePlayer.hand.handArray[1] = cardsArray[2];
            dealingNewCard = true;
            cardCount++;
        } else if(cardsArray.length == 3 && dealingNewCard == true) {
            thePlayer.hand.handArray[0].buildCard();
            thePlayer.hand.handArray[1].animateCardTo(width/2-cardSize-pad, height-fontSize*1.5-cardSize*1.5, 500);
            cardsArray[2].x = thePlayer.hand.handArray[1].x;
            cardsArray[2].y = thePlayer.hand.handArray[1].y;
            if(thePlayer.hand.handArray[1].animating == false) {dealingNewCard = false;}
        }
    }

    //Deal Fourth Card to Dealer
    if(cardsArray.length == 3 || cardsArray.length == 4) {
        thePlayer.hand.handArray[1].buildCard();
        if(cardsArray[3] == undefined && dealingNewCard == false) {
            thePlayer.hand.handArray[0].buildCard();
            dealerHand.handArray[0].buildCard();
            cardsArray[3] = new Card(deck.x, deck.y, deck.getCard(cardCount), 'FRONT');
            dealerHand.handArray[1] = cardsArray[3];
            dealingNewCard = true;
            cardCount++;
        } else if (cardsArray.length == 4 && dealingNewCard == true) {
            thePlayer.hand.handArray[0].buildCard();
            dealerHand.handArray[0].buildCard();
            dealerHand.handArray[1].animateCardTo(width/2-cardSize-pad, deck.y, 500);
            cardsArray[3].x = dealerHand.handArray[1].x;
            cardsArray[3].y = dealerHand.handArray[1].y;
            if(dealerHand.handArray[1].animating == false) {dealingNewCard = false;}
        }
    }
    if(cardsArray.length == 4) {
        dealerHand.handArray[1].buildCard();
        thePlayer.hand.handArray[0].buildCard();
        dealerHand.handArray[0].buildCard();
    }
    if(timeElapsed > 3000 && dealingNewCard == false) {
        gameState = 3;
        timeElapsed = 0;
        beginTime = 0;
        startTimer = true;
    }
}

function drawPlayScreen() {
    make_image(cardBack, deck.x,deck.y,cardSize,cardSize*1.5);
    StayButton.draw();
    HitButton.draw();
    if(dealingNewCard == false) {
        for(let i = 0; i < cardCount; i++) {
            cardsArray[i].buildCard();
        }
    }
    if(dealingNewCard == true) {
        for(let i = 0; i < cardCount-1; i++) {
            cardsArray[i].buildCard();
        }
        //If Card should go to the right
        let cardIndex = thePlayer.hand.handArray.length;
        if((cardIndex-1) % 2 == 0) {
            thePlayer.hand.handArray[cardIndex-1].animateCardTo(width/2+pad, height-fontSize*1.5-cardSize*1.5-((cardIndex)*cardSize*1.5)/8, 500);
        //If Card should go to the left
        } else {
            thePlayer.hand.handArray[cardIndex-1].animateCardTo(width/2-cardSize-pad, height-fontSize*1.5-cardSize*1.5-((cardIndex-1)*cardSize*1.5)/8, 500);
        }
        if(thePlayer.hand.handArray[cardIndex-1].animating == false) {dealingNewCard = false;}
    }
    currentHandText.text = 'Current Hand: ' + thePlayer.hand.calcBlackjackValue();
    currentHandText.draw();
    BankText.text = 'Bank: $' + thePlayer.bank;
    BankText.draw();
    BetText.text = 'Bet: $' + thePlayer.bet;
    BetText.y = height-height/8-pad;
    BetText.draw();
    payoutText.text = 'Payout: $' + thePlayer.bet*payoutRatio;
    payoutText.y = height-height/8-pad-fontSize/2;
    payoutText.draw();
    let blackjackVal = thePlayer.hand.calcBlackjackValue();
    if((blackjackVal >= 21 || blackjackVal == 'BUST') && dealingNewCard == false) {
        gameState = 4;
        timeElapsed = 0;
        beginTime = 0;
        startTimer = true;
    }
}

function drawEndScreen() {
    make_image(cardBack, deck.x,deck.y,cardSize,cardSize*1.5);
    dealerHand.handArray[0].face = 'FRONT';
    let dealerBJ = dealerHand.calcBlackjackValue();
    let playerBJ = thePlayer.hand.calcBlackjackValue();
    if(dealerBJ < 17 && dealingNewCard == false) {
        dealingNewCard = true;
        cardsArray[cardCount] = new Card(deck.x, deck.y, deck.getCard(cardCount), 'FRONT');
        dealerHand.handArray[dealerHand.handArray.length] = cardsArray[cardCount];
        cardCount++;
        for(let i = 0; i < cardCount-1; i++) {
            cardsArray[i].buildCard();
        }
    } else if (dealingNewCard == true) {
        for(let i = 0; i < cardCount-1; i++) {
            cardsArray[i].buildCard();
        }
        let cardIndex = dealerHand.handArray.length;
        if((cardIndex-1) % 2 == 0) {
            dealerHand.handArray[cardIndex-1].animateCardTo(width/2+pad, height/64+((cardIndex)*cardSize*1.5)/8, 500);
        //If Card should go to the left
        } else {
            dealerHand.handArray[cardIndex-1].animateCardTo(width/2-cardSize-pad, height/64+((cardIndex-1)*cardSize*1.5)/8, 500);
        }
        if(dealerHand.handArray[cardIndex-1].animating == false) {dealingNewCard = false;}
    } else if ((dealerBJ >= 17 || dealerBJ >= 'BUST') && dealingNewCard == false) {
        for(let i = 0; i < cardCount; i++) {
            cardsArray[i].buildCard();
        }
        //Game Over, Calculate Game Outcome
        //If Player Natural Blackjack
        if(playerBJ == 21 && thePlayer.hand.handArray.length == 2) {
            //If Dealer Natural Blackjack too!
            if(dealerBJ == 21 && dealerHand.handArray.length == 2) {
                GameOutcome.text = 'T';
                GameOutcome.color = '255, 125, 0';
                GameOutcome.draw();
                thePlayer.bank = thePlayer.bank + thePlayer.bet;
                thePlayer.bet = 0;
            } else {
                GameOutcome.text = 'W';
                GameOutcome.color = '0, 255, 0';
                GameOutcome.draw();
                thePlayer.bank = thePlayer.bank + thePlayer.bet*payoutRatio*1.5;
                thePlayer.bet = 0;
            }
        } else if(playerBJ == 'BUST') {//If Player Busts
            GameOutcome.text = 'L';
            GameOutcome.color = '255, 0, 0';
            GameOutcome.draw();
            thePlayer.bank = thePlayer.bank;
            thePlayer.bet = 0;
        } else if(dealerBJ == 'BUST') {
            GameOutcome.text = 'W';
            GameOutcome.color = '0, 255, 0';
            GameOutcome.draw();
            thePlayer.bank = thePlayer.bank + thePlayer.bet*payoutRatio;
            thePlayer.bet = 0;
        } else if(playerBJ > dealerBJ) {//Compare Player vs Dealer
            GameOutcome.text = 'W';
            GameOutcome.color = '0, 255, 0';
            GameOutcome.draw();
            thePlayer.bank = thePlayer.bank + thePlayer.bet*payoutRatio;
            thePlayer.bet = 0;
        } else if(playerBJ < dealerBJ) {
            GameOutcome.text = 'L';
            GameOutcome.color = '255, 0, 0';
            GameOutcome.draw();
            thePlayer.bank = thePlayer.bank;
            thePlayer.bet = 0;
        } else {
            GameOutcome.text = 'T';
            GameOutcome.color = '255, 125, 0';
            GameOutcome.draw();
            thePlayer.bank = thePlayer.bank + thePlayer.bet;
            thePlayer.bet = 0;
        }
    }
    for ( let i = 0;  i < cardCount; i++) {
        cardsArray[i].buildCard();
    }
    currentHandText.text = 'Current Hand: ' + thePlayer.hand.calcBlackjackValue();
    dealerHandText.text = 'Dealer Hand: ' + dealerHand.calcBlackjackValue();
    BankText.text = 'Bank: $' + thePlayer.bank;
    currentHandText.draw();
    dealerHandText.draw();
    BankText.draw();
}

//Animation 
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
        ctx.fillStyle = 'rgb(0,125,125)';
        ctx.fillRect(0,0,width,height);
        FPSText.text = FPS;
        
        //ANIMATE
        switch(gameState) {
            case 0:
                ctx.fillStyle = 'rgb(0,125,125)';
                ctx.fillRect(0,0,width,height);
                break;
            case 1:
                drawBackground('0,0,0');
                drawBetScreen();
                break;
            case 2:
                drawBackground('0,0,0');
                drawDealScreen();
                break;
            case 3:
                drawBackground('0,0,0');
                drawPlayScreen();
                break;
            case 4:
                drawBackground('0,0,0');
                drawEndScreen();
                break;
            default:
                ctx.fillStyle = 'rgb(0,125,125)';
                ctx.fillRect(0,0,width,height);
        }
        //-------
    }
    FPSText.draw();
    previousTimeStamp = timeStamp;
    window.requestAnimationFrame(animateFrame);
}

function drawBackground(RGBCOLOR) {
    ctx.fillStyle = 'rgb(' + RGBCOLOR + ')';
    ctx.fillRect(0,0,width,height);
    if(width > height/2) {
        make_image(tableImage, width/2-height/4,0,height/2,height);
    } else if(width < height/2) {
        make_image(tableImage, 0,height/2-width, width, width*2);
    } else {
        make_image(0,0,width,height);
    }
}

//-----------------------------------------
//EXECUTED CODE
//-----------------------------------------

//Start Game
updateOffset();
deck.shuffle();
var previousTimeStamp;
var startTimer = false;
var beginTime = 0;
var timeElapsed = 0;
var FPS = 0;
var FPSText = new ScreenText('0','255,255,255','bold', fontSize, 'Ariel', width, fontSize, width/8, 'right');
window.requestAnimationFrame(animateFrame);