function getCheckedValue(){
	if ($('#privatecheckbox').attr('checked')  == undefined)
		return "off";
	return "on";
}

/** Returns a pin JSON object that reflects the currently displayed pin. 
 * We are keeping the client-side model in the HTML and extracting it to json using 
 *  this method. Another way is to keep the model in json and update the view (HTML) with
 *  a method like updateView()*/
function getPin(){
	var pin = {
		id: $('#pinimg').attr('pinid'),
		caption: $('#caption').text().trim(),
		imgUrl: $('#pinimg').attr('src'),
	    private: getCheckedValue()
	};
	return pin;
}

/** Updates the view (HTML) to match the current thePin values. */ 
function updateView(){
	$('#caption').text(thePin.caption);
	$('#pinimg').attr('src',thePin.imgUrl);
	if (thePin.private == "on") {
		$('#privatecheckbox').attr('checked',"");
	} else {
		$('#privatecheckbox').removeAttr('checked');
	}
}
/** Show error message, put pin values back to thePin values */
function displayErrorMessage(){
	$('.message').text("Error updating Pin");
	$('.message').show();
	updateView();
	setTimeout(function(){
		$('.message').hide();
	}, 2000);
}

/** Does an XHR POST back to the server to update thePin's information. */
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

/** thePin holds the json for the pin as it was before the user changed it. 
 * We revert back to thePin if the server returns an error.
 */
var thePin;

$(document).ready(function(){
		console.log("Hello there");
		$('#caption').on("click", replaceWithTextbox);
		$('#privatecheckbox').on('change', sendToServer);
		thePin = getPin();
	}
);