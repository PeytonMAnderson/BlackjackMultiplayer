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
        if(data < GameRoomData.playerLimit/2) {
            let xLoc = width/2+(getSize('TABLEX')/2);
            xLoc = xLoc>width-getSize('SEATBUTTON') ? width-getSize('SEATBUTTON') : xLoc;
            let yLoc = height/2-getSize('SEATBUTTON')*GameRoomData.playerLimit/2;
            yLoc = yLoc + getSize('SEATBUTTON')*2*data;
            loc = {x: xLoc, y: yLoc}
        } else {
            let xLoc = width/2-getSize('TABLEX')/2-getSize('SEATBUTTON')
            xLoc = xLoc<0 ? 0 : xLoc;
            let yLoc = height/2+getSize('SEATBUTTON')*GameRoomData.playerLimit/2;
            yLoc = yLoc - getSize('SEATBUTTON')*2*(data-GameRoomData.playerLimit/2+1);
            loc = {x: xLoc, y: yLoc}
        }
    } else if (typeFor == 'SEATTEXT') {
        let buttonLoc = getLocation('SEATBUTTON', data);
        loc = {x: buttonLoc.x+getSize('SEATBUTTON')/2, y: buttonLoc.y+getSize('SEATBUTTON')-fontSize/8} 
    } else if (typeFor == 'SEATNAME') {
        let buttonLoc = getLocation('SEATBUTTON', data);
        let extraX = data >= GameRoomData.playerLimit/2 ? 0 : getSize('SEATBUTTON');
        loc = {x: buttonLoc.x + extraX, y: buttonLoc.y} 
    } else if (typeFor == 'SEATBANK') {
        let buttonLoc = getLocation('SEATBUTTON', data);
        let extraX = data >= GameRoomData.playerLimit/2 ? 0 : getSize('SEATBUTTON');
        loc = {x: buttonLoc.x + extraX, y: buttonLoc.y+getSize('SEATBUTTON')+fontSize/4} 
    } else if (typeFor == 'SEATBET') {
        let buttonLoc = getLocation('SEATBUTTON', data);
        let extraX = data >= GameRoomData.playerLimit/2 ? getSize('SEATBUTTON') : 0;
        loc = {x: buttonLoc.x + extraX, y: buttonLoc.y + getSize('SEATBUTTON')/2+fontSize/8} 
    } else if (typeFor == 'CARDORIGIN') {
        if(width > height/2)      {loc = {x: width/2-height/4+height*(4/200), y: height*(4/200)}}
        else if(width < height/2) {loc = {x: width*(4/100), y: height/2-width+width*(4/100)}}
        else                      {loc = {x: height*(4/200), y: height*(4/200)}}
    } else if (typeFor == 'DEALERCARDS') {
        {loc = {x: 0, y: height/16 * data}}
    } else if (typeFor == 'BIGCARDS') {
        {loc = {x: width/4, y: height/16 * data}}
    } else if (typeFor == 'SMALLCARDS') {
        {loc = {x: width/2, y: height/16 * data}}
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

//COUNTDOWN
let intervalID = undefined;
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
    if(GameRoomData.timeLeft != 'NULL') {
        GameRoomData.timeLeft = 'NULL';
        clearInterval(intervalID);
        intervalID = undefined;
        sendGameUpdate();
    }
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

//Fold everyone that has not bet
function autoFold() {
    if(sockets.id != GameRoomData.hostSocketId) {return;}
    for(let i = 0; i < GameRoomData.playerLimit; i++) {
        if(GameRoomData.Seats[i] != 'EMPTY') {
            if(GameRoomData.Seats[i].bet = 0) {GameRoomData.Seats[i].fold = true;}}}}