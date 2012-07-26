function viewPin(pin){
	return'<div class="thumbbox">' + 
	    '<a href="/pin/'+ pin.pinid +'">' +
		'<img class="thumbPin" title="Pin '+ pin.pinid +'" alt="'+ pin.caption +'" src="'+
		pin.imgUrl + '"/></a>' +
        '<span>' +
        pin.caption + 
        '</span><br/><input style="text-align:center" onclick="removePin('+ pin.pinid+')" type="button" value="Remove"></input><br stle="clear:both"/></div>';
}


function viewPinToAdd(pin){
		return'<div id="addpin'+ pin.pinid + '" class="addbox"><a href="/pin/'+ pin.pinid +'">' +
		'<img class="thumbPin" title="Pin '+ pin.pinid +'" alt="'+ pin.caption +'" src="'+
		pin.imgUrl + '"/></a>' +
        '<span class="displayCaption" id="caption">' +
        pin.caption + 
        '</span><br/><input onclick="addPin('+ pin.pinid+')" type="button" value="Add"></input></div>';
}

function removePin(pinNumber){
	removePinFromBoard(pinNumber);
	$.ajax('/board/' + board.boardid, {
		type: "POST",
		data: {
			title: board.title,
			addPin: 'none',
			deletePin: pinNumber},
		success: function(data){
			console.log('removed pin');
		}
	});

	drawBoard();
	drawExtrapins();
}

function addPin(pinNumber){
	movePinToBoard(pinNumber);
	$.ajax('/board/' + board.boardid, {
		type: "POST",
		data: {
			title: board.title,
			addPin: pinNumber,
			deletePin: 'none'},
		success: function(data){
			console.log('added pin');
		}
	});
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
	if (board.private){
		$('#privatecheckbox').attr('checked','');
	} else {
		$('#privatecheckbox').removeAttr('checked');
	}
	for (var i=0; i < board.pins.length; i++){
		var pin = board.pins[i];
		var pinHtml = viewPin(pin);
		$('#pins').append(pinHtml);
	}
	if (board.pins.length == 0){
		$('#pins').html('<div class="thumbbox">Board is empty.</div>');
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
	$.ajax('/pin/?fmt=json', {
		type: 'GET',
		success: function(data){
			allPins = data;
			drawExtrapins();
		}
	});
}

function getCheckedValue(){
	if ($('#privatecheckbox').attr('checked')  == undefined)
		return false;
	return true;
}

function sendToServer(){
	board.private =  getCheckedValue();
	$.ajax('/board/' + board.boardid, {
		type: "POST",
		data: {
			title: board.title,
			addPin: 'none',
			deletePin: 'none',
			private: board.private },
		success: function(data){
			console.log('updated server');
		}
	});
}

$(document).ready(function(){
	getBoard();
	$('#privatecheckbox').on('change', sendToServer);
});
