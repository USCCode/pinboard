/*
 * VIEW functions
 * 
 */

function viewPin(pin){
	var result = '<div class="thumbbox">' + 
	    '<a href="/pin/'+ pin.pinid +'">' +
		'<img class="thumbPin" title="Pin '+ pin.pinid +'" alt="'+ pin.caption +'" src="'+
		pin.imgUrl + '"/></a>' +
        '<span>' +
        pin.caption + 
        '</span><br/>'; 
	if (isEditor)
		result += '<input style="text-align:center" onclick="removePin('+ pin.pinid+')" type="button" value="Remove"></input>';
	result += '<br stle="clear:both"/></div>';
	return result;
}

function viewPinToAdd(pin){
		return'<div id="addpin'+ pin.pinid + '" class="addbox"><a href="/pin/'+ pin.pinid +'">' +
		'<img class="thumbPin" title="Pin '+ pin.pinid +'" alt="'+ pin.caption +'" src="'+
		pin.imgUrl + '"/></a>' +
        '<span class="displayCaption" id="caption">' +
        pin.caption + 
        '</span><br/><input onclick="addPin('+ pin.pinid+')" type="button" value="Add"></input></div>';
}

function drawBoard(theBoard){
	$('#boardTitle').text(theBoard.title);
	$('#pins').html('');
	if (theBoard.private){
		$('#privatecheckbox').attr('checked','');
	} else {
		$('#privatecheckbox').removeAttr('checked');
	}
	for (var i=0; i < theBoard.pins.length; i++){
		var pin = theBoard.pins[i];
		var pinHtml = viewPin(pin);
		$('#pins').append(pinHtml);
	}
	if (theBoard.pins.length == 0){
		$('#pins').html('<div class="thumbbox">Board is empty.</div>');
	}
}

/**
 * Draw 'allPins' in the pins-to-add section
 */
function drawExtrapins(allThePins){
	$('#pinstoadd').html('');
	for (var i=0; i < allThePins.length; i++){
		if (getBoardPin(allThePins[i].pinid) == undefined ){
			var pinhtml = viewPinToAdd(allThePins[i]);
			$('#pinstoadd').append(pinhtml);
		};
	}
}

/**
 * Update the whole view of the board and the pins-to-add.
 * @param theBoard
 * @param allThePins
 */
function updateView(theBoard, allThePins){
	drawBoard(theBoard);
	drawExtrapins(allThePins);
}

/* 
 * CONTROLLER functions
 */

/**
 * Removes pinNumber from the model and update the view.
 */
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
		},
		error: handleServerError
	});
	updateView(board,allPins);
}

/**
 * Add pinNumber to the model and update the view.
 * @param pinNumber
 */
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
		},
		error: handleServerError
	});
	updateView(board,allPins);	
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
			oldBoard = jQuery.extend(true,{},board); //make a copy
			drawBoard(data);
		},
		error: function(e){
			console.log("Could not get board data from server...");
		}
		
	});
	$.ajax('/pin/?fmt=json', {
		type: 'GET',
		success: function(data){
			allPins = data;
			oldAllPins = allPins.slice(0);
			drawExtrapins(data);
		},
		error: function(e){
			console.log("Could not get pins data from server...");
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


function replaceWithText(){
	var text = $('#titleedit').val();
	board.title = text;
	$('#titleedit').remove();
	$('#boardTitle').text(text);
	sendToServer();
	$('#boardTitle').on("click", replaceWithTextbox);
}

function keypressHandler(e){
	if (e.which == 13) { //enter key
		replaceWithText();
		e.preventDefault();
	}
}

function replaceWithTextbox(){	
	$(this).off("click");
	var text = $(this).text().trim();
	$(this).text('');
	$(this).html('<input id="titleedit" size="60" type="text" value="' + text + '"></input>');
	$('#titleedit').focus();
	$('#titleedit').on("blur", replaceWithText);
	$('#titleedit').on("keypress", keypressHandler);
}

/** Show error message */
function displayErrorMessage(){
	$('.message').text("Error updating Board");
	$('.message').show();
	setTimeout(function(){
		$('.message').hide();
	}, 2000);
}

/**
 * If there is a server error we revert the model to the old one and update view.
 * NOTE: This is NOT A complete solution. If the user makes 2 or more quick changes
 * and there is a server error on one of them then we can end up in an inconsistent
 * state (client and server state do not match).
 * Solving this for the general case seems hard.
 */
function handleServerError(){
	board = jQuery.extend(true,{},oldBoard);
	allPins = oldAllPins.slice(0);
	updateView(board,allPins);
	displayErrorMessage();
}

/*
 * MODEL functions 
 */

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
 * Add pinNumber to the board model. 
 * @param pinNumber
 */
function movePinToBoard(pinNumber){
	var pin;
	for (var i=0; i < allPins.length; i++){
		if (allPins[i].pinid == pinNumber){
			pin = allPins[i];
			board.pins.push(pin);
		}
	}
}

/**
 * Remove pinNumber from the board model.
 * @param pinNumber
 */
function removePinFromBoard(pinNumber){
	var pin;
	for (var i=0; i < board.pins.length; i++){
		if (board.pins[i].pinid == pinNumber){
			board.pins.splice(i,1);
		}
	}
}

var board;
var oldBoard;
var allPins;
var oldAllPins;


$(document).ready(function(){
	getBoard();
	if (isEditor) {
		$('#privatecheckbox').on('change', sendToServer);
		$('#boardTitle').on('click', replaceWithTextbox);
	};
});
