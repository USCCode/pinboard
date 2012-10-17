/**
 * Vector/Point class. 
 * @param x
 * @param y
 * @returns
 */
function Vector(x,y){
	this.x = x;
	this.y = y;
};

Vector.prototype.plus = function(o,y){
	if (y != null) {
		return new Vector(this.x + o, this.y + y);
	};
	return new Vector(this.x + o.x, this.y + o.y);
};

Vector.prototype.minus = function(o,y){
	if (y != null) {
		return new Vector(this.x - o, this.y - y);
	};
	return new Vector(this.x - o.x, this.y - o.y);
};

Vector.prototype.distance = function(o,y){
	if (y != null) {
		return Math.sqrt(Math.pow(this.x - o, 2) + Math.pow(this.y - y, 2));
	};
	return Math.sqrt(Math.pow(this.x - o.x, 2) + Math.pow(this.y - o.y, 2));
}

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

/**
 * Global vars that hold the canvas, 2D context, and the currently chosen pin.
 */
var context;
var canvas;
/**
 * If chosenPin is not null then it is the index (within board.pins) of the pin the 
 * user is currently moving.
 */
var chosenPin = null;

/**
 * Change the size and location of markedPin, given that
 *  chosenMarker is now at newMarker, and all 4 markers are stored in markers,
 * @param newMarker
 */
function resizePin(newMarker){
	console.log('newMarker x=' + newMarker.x + ' y=' + newMarker.y);
	var pin = board.pins[markedPin];

	if (chosenMarker == null){
		console.log('ERROR');
		return;
	}
	var next = (chosenMarker + 1) % 4;
	var previous = (chosenMarker == 0) ? 3 : (chosenMarker - 1);
	var move = newMarker.minus(markers[chosenMarker]);

	//Change this marker's position, and its two neighbors.
	
	markers[chosenMarker].x = newMarker.x;
	markers[chosenMarker].y = newMarker.y;
	if ((chosenMarker % 2) == 0){ //top-left or bottom-right
		markers[next].y += move.y;
		markers[previous].x += move.x;
	} 
	else { //top-right or bottom-left
		markers[next].x += move.x;
		markers[previous].y += move.y;
	}

	//Change the markedPin's attributes to match the new markers
	pin.x = Math.min(markers[0].x, markers[1].x);
	pin.y = Math.min(markers[0].y, markers[3].y);
	pin.width = Math.abs(markers[1].x - markers[0].x);
	pin.height = Math.abs(markers[3].y - markers[0].y);
	
	//Redraw the board, including the markers aroud this markedPin
	chosenPin = markedPin;
	drawBoard();
	chosenPin = null;
}

/**
 * Update the pins by re-setting their location.
 */
function drawBoard(){
	context.clearRect(0,0,canvas.width,canvas.height);
	for (var i=0; i < board.pins.length; i++){
		var pin = board.pins[i];
		var w = pin.width ? pin.width : imageWidth;
		var h = pin.height ? pin.height : imageHeight;
		context.drawImage(pin.img,pin.x,pin.y,pin.width,pin.height);
		if (i == chosenPin){
			highlightPin(i);
		}
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
				drawBoard()};
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
	return new Vector(evt.offsetX, evt.offsetY);
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
 * @param p point
 */
function movePin(chosenPin,p){
	board.pins[chosenPin].x = Math.floor(p.x);
	board.pins[chosenPin].y = Math.floor(p.y);
	drawBoard();
	markers=null;
	highlightPin(chosenPin);
}

/**
 * Returns the pin index number of the pin that overlaps p.x,p.y (canvas coordinates)
 * or null if none.
 * @param p the point
 */
function getChosenPin(p){
	for (var i=0; i < board.pins.length; i++){
		var thePin = board.pins[i];
		if ( thePin.x < p.x && p.x < thePin.x + thePin.width &&
				thePin.y < p.y && p.y < thePin.y + thePin.height){
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
	var p = board.pins[chosenPin];
	$.ajax('/board/' + board.boardid, {
		type: "POST",
		data: {
			title: board.title,
			editPin: p.pinid,
			x: p.x,
			y: p.y,
			w: p.width,
			h: p.height,
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
function handleMousemove(e){
	var p = getPosInCanvas(e);	
	if (chosenPin != null) {
		movePin(chosenPin,p.plus(delta));
		return;
	}
	if (chosenMarker != null){
		console.log('resize image');
//		resizePin(p.plus(delta));
		resizePin(p);
	}
}

function getPinPosition(n){
	var thePin = board.pins[n];
	return new Vector(thePin.x,thePin.y);
}

/** Vector with the difference between the mouse and the top-left
 *  of the pin.
 */
var delta;

/** Index of chosen marker in markers */
var chosenMarker = null;

function handleMousedown(e){
	console.log('mousedown');
	var p = getPosInCanvas(e);
	for (var m in markers){
		if (markers[m].distance(p) < markerRadius){
			console.log("In marker ");
			console.log(markers[m]);
			chosenMarker = parseInt(m);
			delta = markers[chosenMarker].minus(p);
			return;
		}
	}
	chosenPin = getChosenPin(p);
	console.log('chosenPin=');
	console.log(chosenPin);
	if (chosenPin != null) {
		var pinPos = getPinPosition(chosenPin);
		delta = pinPos.minus(p);
		console.log(delta);
		highlightPin(chosenPin);
	}
	else {
		markers = null; //user clicks down on background, erase markers
	}
	drawBoard();
}

function handleMouseup(e){
	console.log('mouseup');
	console.log('chosenPin=');
	console.log(chosenPin);
	if (chosenPin == null){
		if (markedPin != null) {
			chosenPin = markedPin;
			sendToServer();
			chosenPin = null;
		};
	}
	else {
		sendToServer();
	}
	chosenPin = null;
	chosenMarker = null;
}


var markerRadius = 10;

/**
 * Draw a circle at p
 * @param p
 */
function drawMarker(p){
	context.beginPath();
	context.fillStyle = '#888888';
	context.arc(p.x, p.y, markerRadius, 0, Math.PI * 2);
	context.fill();
}

function drawMarkers(){
	for (var m in markers){
		drawMarker(markers[m]);
	};
}

/**
 * An array containing the 4 circles center points (Vectors), when they are visible.
 * Or null if not there.
 */
var markers = null;
var markedPin = null;

/**
 * Highlight pin p in canvas by drawing 4 circles on its corners.
 * @param p the # of the pin
 */
function highlightPin(p){
	var pin = board.pins[p];
	markedPin = p;
	if (markers == null){
		markers = [new Vector(pin.x,pin.y), //clockwise order, from top-left.
		           new Vector(pin.x+pin.width,pin.y),
		           new Vector(pin.x+pin.width,pin.y+pin.height),
		           new Vector(pin.x,pin.y+pin.height)];
	}
	drawMarkers();
}



$(document).ready(function(){
	if (isEditor) {
		$('#board').on('mousemove', handleMousemove);
		$('#board').on('mousedown', handleMousedown);
		$('#board').on('mouseup', handleMouseup );
	};
	canvas = document.getElementById('board');
	context = canvas.getContext('2d');	
	getBoard();
});


