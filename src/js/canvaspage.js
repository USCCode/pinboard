/**
 * Returns a function that when called will draw 'this' Image on context at x=i*100.
 * Explanation: This function captures i in a closure. So if i changes later
 *  it is not a problem, because this i is now local.
 * @param i
 * @returns {Function}
 */
function drawAt(x,y){
	return function(){
		context.drawImage(this, x, y, 100, 100);
	}
};

/**
 * Board model, in JSON format.
 */
var boardModel = {};

function drawPin(theBoard,pinNumber){
	var pin = theBoard.pins[pinNumber];
	var img = new Image();
	img.onload = drawAt(Math.floor(pin.x), Math.floor(pin.y)); 
	img.src = pin.imgUrl;
}

/**
 * Add all the board's pin to the canvas object;
 * @param theBoard
 */
function drawBoard(theBoard){
	console.log("drawBoard");
	$('#boardTitle').text(theBoard.title);
	context.clearRect(0,0,canvas.width,canvas.height);
	for (var i=0; i < theBoard.pins.length; i++){
		drawPin(theBoard,i);
//		var pin = theBoard.pins[i];
//		var img = new Image();
//		img.onload = drawAt(pin.x, pin.y); 
//		img.src = pin.imgUrl;
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
var chosenPin = 0;

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
				boardModel.pins[i].x = Math.random()*(canvas.width-100);
				boardModel.pins[i].y = Math.random()*(canvas.height-100);
			}
			drawBoard(boardModel);
		},
		error: function(e){
			console.log("Could not get board data from server...");
		}
	});
}



function mouseMoveHandler(evt){
	var xy = getPosInCanvas(evt);
	console.log("Mouse moved" + xy.y);
	context.clearRect(0,0,canvas.width,canvas.height);
	boardModel.pins[chosenPin].x = xy.x;
	boardModel.pins[chosenPin].y = xy.y;
	drawBoard(boardModel);	
}

function mouseClickHandler(evt){
	console.log("Click");
}

$(document).ready(function(){
	console.log("Ready to rock...");
	$('#board').on('mousemove',mouseMoveHandler);
	$('#board').on('click',mouseClickHandler);
	canvas = document.getElementById('board');
	context = canvas.getContext('2d');	
	getBoard();
});
