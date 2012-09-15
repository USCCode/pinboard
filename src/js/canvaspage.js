var imageWidth = 200;
var imageHeight = 200;

/**
 * Returns a function that when called will draw 'this' Image on context at x=i*100.
 * Explanation: This function captures i in a closure. So if i changes later
 *  it is not a problem, because this i is now local.
 * @param i
 * @returns {Function}
 */
function drawAt(x,y){
	return function(){
		context.drawImage(this, x, y, imageWidth, imageHeight);
	}
};

/**
 * Board model, in JSON format.
 */
var boardModel = {};

/**
 * Update the pins by re-setting their location.
 * @param theBoard
 */
function drawBoard(theBoard){
	context.clearRect(0,0,canvas.width,canvas.height);
	for (var i=0; i < theBoard.pins.length; i++){
		var pin = theBoard.pins[i];
		pin.img.onload = drawAt(Math.floor(pin.x), Math.floor(pin.y)); 
		pin.img.src = pin.imgUrl; //we need to re-set this otherwise it will not redraw.		
	}
}

/**
 * Create all the Image objects, put them on theBoard, and draw them. Draw the Board title.
 * @param theBoard
 */
function createImages(theBoard){
	$('#boardTitle').text(theBoard.title);
	for (var i=0; i < theBoard.pins.length; i++){
		var pin = theBoard.pins[i];
		var img = new Image(); 
		img.onload = drawAt(Math.floor(pin.x), Math.floor(pin.y)); 
		img.src = pin.imgUrl;
		pin.img = img;
	}
}

function getPosInCanvas(evt) {
	var rect = canvas.getBoundingClientRect();
    var doc = document.documentElement;
    // return relative mouse position
    var mouseX = evt.clientX - rect.left - doc.scrollLeft;
    var mouseY = evt.clientY - rect.top - doc.scrollTop;
    return {
      x: mouseX,
      y: mouseY
    };
}


/***
 * Global var to hold the 2D context.
 */
var context;
var canvas;
var chosenPin = null;

/**
 * Get all the board data, and all the user's pins, from the server.
 * Update the model and the view.
 */
function getBoard(){
	var boardid = location.pathname.split('/')[2];
	$.ajax('/board/' + boardid + '.json', {
		type: 'GET',
		success: function(data){
			boardModel = data;
			for (var i=0; i < boardModel.pins.length; i++){
				boardModel.pins[i].x = Math.random()*(canvas.width-imageWidth);
				boardModel.pins[i].y = Math.random()*(canvas.height-imageHeight);
			}
			createImages(boardModel);
		},
		error: function(e){
			console.log("Could not get board data from server...");
		}
	});
}


function movePin(chosenPin,x,y){
	boardModel.pins[chosenPin].x = x;
	boardModel.pins[chosenPin].y = y;
	drawBoard(boardModel);		
}

function mouseMoveHandler(evt){
	if (chosenPin == null) return;
	var xy = getPosInCanvas(evt);	
	movePin(chosenPin,xy.x,xy.y);
}

/**
 * Returns the pin index number of the pin that overlaps x,y (canvas coordinates)
 * or null if none.
 * @param x
 * @param y
 */
function getChosenPin(x,y){
	for (var i=0; i < boardModel.pins.length; i++){
		var thePin = boardModel.pins[i];
		if ( thePin.x < x && x < thePin.x + imageWidth &&
				thePin.y < y && y < thePin.y + imageHeight){
			return i;
		} 
	}
	return null;
}

function mouseClickHandler(evt){
	var xy = getPosInCanvas(evt);
	if (chosenPin) {
		chosenPin = null;
		
	} else {
		chosenPin = getChosenPin(xy.x, xy.y);
		if (chosenPin != null)
			movePin(chosenPin,xy.x,xy.y);
	};
}

$(document).ready(function(){
	$('#board').on('mousemove',mouseMoveHandler);
	$('#board').on('click',mouseClickHandler);
	canvas = document.getElementById('board');
	context = canvas.getContext('2d');	
	getBoard();
});
