/**
 * Returns a function that when called will draw 'this' Image on ctx at x=i*100.
 * Explanation: This function captures ctx and i in a closure. So if i changes later
 *  it is not a problem, because this i is now local.
 * @param ctx
 * @param i
 * @returns {Function}
 */
function drawAt(ctx,i){
	return function(){
		ctx.drawImage(this, i*100, 0, 100, 100);
	}
};

/**
 * Add all the board's pin to the canvas object;
 * @param theBoard
 */
function drawBoard(theBoard){
	$('#boardTitle').text(theBoard.title);
	var canvas = document.getElementById('board');
	var ctx = canvas.getContext('2d');
	for (var i=0; i < theBoard.pins.length; i++){
		var pin = theBoard.pins[i];
		var img = new Image();
		img.onload = drawAt(ctx,i); 
		img.src = pin.imgUrl;
		//add pin to canvas
	}
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
			drawBoard(data);
		},
		error: function(e){
			console.log("Could not get board data from server...");
		}
		
	});
}

$(document).ready(function(){
	console.log("Ready to rock...");
	getBoard();
});
