//Get Size of different texts and shapes
function getSize(typeFor) {
    let size = 0;
    if(typeFor == 'FONT') {if(width >= height) {size = height/16;} else {size = height/16;}
    } else if(typeFor == 'PAD') {size = height/64;
    } else if(typeFor == 'SEATBUTTON') {size = height/16;
    } else if(typeFor == 'TABLEX') {if(width > height/2) {size = height/2;} else if(width < height/2) {size = width;} else {size = width;}
    } else if(typeFor == 'TABLEY') {if(width > height/2) {size = height} else if(width < width*2) {size = width;} else {size = height;}
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