function getCheckedValue(){
	if ($('#privatecheckbox').attr('checked')  == undefined)
		return "off";
	return "on";
}

/** Returns a pin JSON object that reflects the currently displayed pin. */
function getPin(){
	var pin = {
		id: $('#pinimg').attr('pinid'),
		caption: $('#caption').text().trim(),
		imgUrl: $('#pinimg').attr('src'),
	    private: getCheckedValue()
	};
	return pin;
}

/** Updates the view with thePin values. */ 
function updateView(){
	$('#caption').text(thePin.caption);
	$('#pinimg').attr('src',thePin.imgUrl);
	if (thePin.private == "on") {
		$('#privatecheckbox').attr('checked',"");
	} else {
		$('#privatecheckbox').removeAttr('checked');
	}
}

function displayErrorMessage(){
	$('.message').text("Error updating Pin");
	$('.message').show();
	updateView();
	setTimeout(function(){
		$('.message').hide();
	}, 2000);
}

/** Does an XHR POST back to the server to update thePin's information.
  * */
function sendToServer(){
	console.log("Sending.");
	var newPin = getPin();
	newPin.xhr = true;
	$.ajax('/pin/' + newPin.id,
			{
		data: newPin,
		type: "POST",
		success: function(data){
			thePin = newPin;
			console.log("Done.");
		},
		error: function(jqxhr, status){
			console.log("error:" + status);
			displayErrorMessage();
		}
	});
}

function replaceWithText(){
	var text = $('#captionedit').val();
	$('#captionedit').remove();
	$('#caption').text(text);
	sendToServer();
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

var thePin;

$(document).ready(function(){
		console.log("Hello there");
		$('#caption').on("click", replaceWithTextbox);
		$('#privatecheckbox').on('change', sendToServer);
		thePin = getPin();
	}
);