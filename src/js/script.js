function getCheckedValue(){
	if ($('#privatecheckbox').attr('checked')  == undefined)
		return "off";
	return "on";
}

/** Returns a pin JSON object that reflects the currently displayed pin. */
function getPin(){
	thePin = {
		id: $('#pinimg').attr('pinid'),
		caption: $('#caption').text().trim(),
		imgUrl: $('#pinimg').attr('src'),
	    private: getCheckedValue()
	};
	return thePin;
}

/** Does an XHR POST back to the server to update thePin's information.
  * */
function updateOnServer(){
	console.log("Sending.");
	var thePin = getPin();
	$.post('/pin/' + thePin.id, thePin, function(data){
		console.log("Done.");
		}
	);
}

function replaceWithText(){
	var text = $('#captionedit').val();
	$('#captionedit').remove();
	$('#caption').text(text);
	updateOnServer();
	$('#caption').on("click", replaceWithTextbox);
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
	$(this).html('<input id="captionedit" size="60" type="text" value="' + text + '"></input>');
	$('#captionedit').focus();
	$('#captionedit').on("blur", replaceWithText);
	$('#captionedit').on("keypress", keypressHandler);
	}

$(document).ready(function(){
		console.log("Hello there");
		$('#caption').on("click", replaceWithTextbox);
		$('#privatecheckbox').on('change', updateOnServer);
	}
);