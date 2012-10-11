/**
 * The width and height that we will set all the images on the canvas.
 * TODO: We should store a width and height for each image on the server and use those.
 */
var imageWidth = 200;
var imageHeight = 200;

/**
 * Board model, in JSON format.
 */
var board = {};

/***
 * Global vars that hold the canvas, 2D context, and the currently chosen pin.
 */
var context;
var canvas;
/**
 * If chosenPin is not null then it is the index (within board.pins) of the pin the 
 * user is currently moving.
 */
var chosenPin = null;


function scaleImage(w,h){
	var nw,nh;
	if (Math.max(w,h) == w) {
		nw = imageWidth;
		nh = Math.floor((nw * h) / w);
	}
	else {
		nh = imageHeight;
		nw = Math.floor((nh * w) / h);		
	}
	return [nw,nh];
}

/**
 * Update the pins by re-setting their location.
 * @param theBoard
 */
function drawBoard(theBoard){
	context.clearRect(0,0,canvas.width,canvas.height);
	for (var i=0; i < theBoard.pins.length; i++){
		var pin = theBoard.pins[i];
		var w = pin.width ? pin.width : imageWidth;
		var h = pin.height ? pin.height : imageHeight;
		var d = scaleImage(w,h);
		pin.width = d[0];
		pin.height = d[1];
		context.drawImage(pin.img,pin.x,pin.y,pin.width,pin.height);
	}
}

/**
 * Counts how many images have been loaded from the server.
 */
var numImagesLoaded = 0;

/**
 * Create all the Image objects, put them on theBoard, and draw them. Draw the Board title.
 * Should only get called once, when we load the page.
 * @param theBoard
 */
function createImages(theBoard){
	$('#boardTitle').text(theBoard.title);
	for (var i=0; i < theBoard.pins.length; i++){
		var pin = theBoard.pins[i];
		var img = new Image(); 
		img.onload = function(){ 
			if (++numImagesLoaded >= theBoard.pins.length){
				console.log("Drawing...");
				drawBoard(board)};
		};
		img.src = pin.imgUrl;
		pin.img = img;
	}
}

/**
 * Given a mouse event evt, return the x,y coordinates of the mouse relative to the canvas object. 
 * @param evt
 * @returns {x: xcor, y: ycor}
 */
function getPosInCanvas(evt) {
    return {
      x: evt.offsetX,
      y: evt.offsetY
    };
}


/**
 * Get all the board data, and all the user's pins, from the server.
 * Update the model and the view.
 */
function getBoard(){
	var boardid = location.pathname.split('/')[2];
	$.ajax('/board/' + boardid + '.json', {
		type: 'GET',
		success: function(data){
			board = data;
			createImages(board);
		},
		error: function(e){
			console.log("Could not get board data from server...");
		}
	});
}

/**
 * Change the chosenPin's x,y in the model, then redraw the board.
 * @param chosenPin
 * @param x
 * @param y
 */
function movePin(chosenPin,x,y){
	board.pins[chosenPin].x = Math.floor(x);
	board.pins[chosenPin].y = Math.floor(y);
	drawBoard(board);		
}

/**
 * Returns the pin index number of the pin that overlaps x,y (canvas coordinates)
 * or null if none.
 * @param x
 * @param y
 */
function getChosenPin(x,y){
	for (var i=0; i < board.pins.length; i++){
		var thePin = board.pins[i];
		if ( thePin.x < x && x < thePin.x + thePin.width &&
				thePin.y < y && y < thePin.y + thePin.height){
			return i;
		} 
	}
	return null;
}

/**
 * Send the current board to the server in an 'editPin' action, with value of chosenPin.
 * Thus, only the chosenPin's x,y are updated.
 * TODO: handle error.
 */
function sendToServer(){
	$.ajax('/board/' + board.boardid, {
		type: "POST",
		data: {
			title: board.title,
			editPin: board.pins[chosenPin].pinid,
			x: board.pins[chosenPin].x,
			y: board.pins[chosenPin].y,
			private: board.private },
		success: function(data){
			console.log('updated server');
		},
		error: function(data){
			console.leg('ERROR sending position to server');
		}
	});
}

/**
 * Handler for when the mouse moves inside the canvas.
 * @param evt
 */
function mouseMoveHandler(evt){
	if (chosenPin == null) return;
	var xy = getPosInCanvas(evt);	
	movePin(chosenPin,xy.x,xy.y);
}

/**
 * Handler for when the mouse is clicked on inside the canvas.
 * @param evt
 */
function mouseClickHandler(evt){
	var xy = getPosInCanvas(evt);
	if (chosenPin!= null) {
		sendToServer();
		chosenPin = null;
	} else {
		chosenPin = getChosenPin(xy.x, xy.y);
		if (chosenPin != null){
			movePin(chosenPin,xy.x,xy.y);
		}
	};
}

/**
 * Draw a circle at x,y
 * @param x
 * @param y
 */
function drawMarker(x,y){
	context.beginPath();
	context.fillStyle = '#888888';
	context.arc(x, y, 10, 0, Math.PI * 2);
	context.fill();
}

/**
 * Highlight pin p in canvas by drawing 4 circles on its corners.
 * @param p the # of the pin
 */
function highlightPin(p){
	var pin = board.pins[p];
	drawMarker(pin.x,pin.y);
	drawMarker(pin.x+pin.width,pin.y);
	drawMarker(pin.x+pin.width,pin.y+pin.height);
	drawMarker(pin.x,pin.y+pin.height);
}

$(document).ready(function(){
	if (isEditor) {
		$('#board').on('mousemove',mouseMoveHandler);
		$('#board').on('click',mouseClickHandler);
	};
	canvas = document.getElementById('board');
	context = canvas.getContext('2d');	
	getBoard();
});
