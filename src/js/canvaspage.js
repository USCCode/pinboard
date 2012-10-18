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
};

/**
 * The width and height that we will set all the images on the canvas.
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

/** Vector with the difference between the mouse and the top-left of the pin, or the center
 *    of the marker.
 */
var delta;

/** Index of chosen marker in markers. The chosenMarker is the one the user just did a mousedown on and
 *   is moving around. */
var chosenMarker = null;

/**
 * An array containing the 4 circles center points (Vectors), when they are visible.
 * Or null if not there.
 */
var markers = null;

/**
 * The index of the pin that has markers around it.
 */
var markedPin = null;


/**
 * The radius of the markers (the circles around the image, used for re-sizing it).
 */
var markerRadius = 10;



/**
 * Change the size and location of markedPin, given that
 *  chosenMarker is now at newMarker, and all 4 markers are stored in markers,
 * @param newMarker
 */
function resizePin(newMarker){
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
				drawBoard();
			};
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
 * Change the chosenPin's x,y in the model, then redraw the board and the pin's markers.
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
 * @param pin the index of the pin to send
 * TODO: handle error.
 */
function sendToServer(pin){
	var p = board.pins[pin];
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
		resizePin(p);
	}
}

function getPinPosition(n){
	var thePin = board.pins[n];
	return new Vector(thePin.x,thePin.y);
}


/**
 * On mouse down we either start resizing or moving.
 * @param e
 */
function handleMousedown(e){
	var p = getPosInCanvas(e);
	//First, check to see if click was inside a marker
	for (var m in markers){
		if (markers[m].distance(p) < markerRadius){ //it was so remember the marker, and its delta.
			chosenMarker = parseInt(m);
			delta = markers[chosenMarker].minus(p);
			e.stopPropagation();
			return;
		}
	}
	//Check to see if click is inside a pin
	chosenPin = getChosenPin(p);
	if (chosenPin != null) { //click was inside a pin
		var pinPos = getPinPosition(chosenPin);
		delta = pinPos.minus(p);
		markers = null;
		highlightPin(chosenPin);
	}
	else {
		markers = null; //user clicks down on background, erase markers
	}
	drawBoard();
	e.stopPropagation();
}

/**
 * When the mouse goes up we send data about the pin back to the server.
 * @param e
 */
function handleMouseup(e){
	if (chosenPin != null) { //If a pin was chosen, send its values to the server.
		sendToServer(chosenPin);
		chosenPin = null;
	} 
	else if (markedPin != null){ //If a pin was marked, send its value to the server, and unchoose its marker. 
		sendToServer(markedPin);
		chosenMarker = null;
	}
	e.stopPropagation();
}

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

function clearAll(){
	markers=null;
	markedPin=null;
	chosenPin=null;
	drawBoard();
}

$(document).ready(function(){
	if (isEditor) {
		$('#board').on('mousemove', handleMousemove);
		$('#board').on('mousedown', handleMousedown);
		$('#board').on('mouseup', handleMouseup );
		$('body').on('mousedown', clearAll);
	};
	canvas = document.getElementById('board');
	context = canvas.getContext('2d');	
	getBoard();
});


