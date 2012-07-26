function viewPin(pin){
	return'<div class="thumbbox"><a href="/pin/'+ pin.pinid +'">' +
		'<img class="thumbPin" title="Pin '+ pin.pinid +'" alt="'+ pin.caption +'" src="'+
		pin.imgUrl + '"/></a>' +
        'Pin '+ pin.pinid + '<br/>' +
        '<span class="displayCaption" id="caption">' +
        pin.caption + 
        '</span><br/><input onclick="removePin('+ pin.pinid+')" type="button" value="Remove"></input></div>';
}


function viewPinToAdd(pin){
		return'<div id="addpin'+ pin.pinid + '" class="addbox"><a href="/pin/'+ pin.pinid +'">' +
		'<img class="thumbPin" title="Pin '+ pin.pinid +'" alt="'+ pin.caption +'" src="'+
		pin.imgUrl + '"/></a>' +
        'Pin '+ pin.pinid + '<br/>' +
        '<span class="displayCaption" id="caption">' +
        pin.caption + 
        '</span><br/><input onclick="addPin('+ pin.pinid+')" type="button" value="Add"></input></div>';
}

function removePin(pinNumber){
	removePinFromBoard(pinNumber);
	drawBoard();
	drawExtrapins();
}

function addPin(pinNumber){
	movePinToBoard(pinNumber);
	drawBoard();
	drawExtrapins();
}

function movePinToBoard(pinNumber){
	console.log('add' + pinNumber);
	var pin;
	for (var i=0; i < allPins.length; i++){
		if (allPins[i].pinid == pinNumber){
			pin = allPins[i];
			board.pins.push(pin);
		}
	}
}

function removePinFromBoard(pinNumber){
	console.log('remove' + pinNumber);
	var pin;
	for (var i=0; i < board.pins.length; i++){
		if (board.pins[i].pinid == pinNumber){
			board.pins.splice(i,1);
		}
	}
}


function drawBoard(){
	$('#boardTitle').text(board.title);
	$('#pins').html('');
	for (var i=0; i < board.pins.length; i++){
		var pin = board.pins[i];
		var pinHtml = viewPin(pin);
		$('#pins').append(pinHtml);
	}
}

/**
 * Determine if pinid is in board, 
 * @param pinid
 * @returns the pin, or undefined if not in.
 */
function getBoardPin(pinid){
	for (var i=0; i < board.pins.length; i++){
		var pin = board.pins[i];
		if (pin.pinid == pinid) { return pin};
	}
	return undefined;
}

/**
 * Draw 'allPins' in the pins-to-add section
 * @returns
 */
function drawExtrapins(){
	console.log('viewextra');
	$('#pinstoadd').html('');
	for (var i=0; i < allPins.length; i++){
		if (getBoardPin(allPins[i].pinid) == undefined ){
			console.log('pin=' + i);
			var pinhtml = viewPinToAdd(allPins[i]);
			$('#pinstoadd').append(pinhtml);
		};
	}
}

var allPins;
var board;

function getBoard(){
	var boardid = location.pathname.split('/')[2];
	$.ajax('/board/' + boardid + '.json', {
		type: 'GET',
		success: function(data){
			board = data;
			drawBoard(data);
		}
	});
	$.ajax('/pin/?json', {
		type: 'GET',
		success: function(data){
			allPins = data;
			drawExtrapins();
		}
	});
}


$(document).ready(function(){
	getBoard();
});
