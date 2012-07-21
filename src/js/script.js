function replaceWithText(){
	var text = $('#captionedit').val();
	$('#captionedit').remove();
	$('#caption').text(text);
	$('#caption').on("click", replaceWithTextbox);
}

function replaceWithTextbox(){	
	$(this).off("click");
	var text = $(this).text().trim();
	$(this).text('');
	$(this).html('<input id="captionedit" size="60" type="text" value="' + text + '"></input>');
	$('#captionedit').focus();
	$('#captionedit').on("blur", replaceWithText); 
}

$(document).ready(function(){
		console.log("Hello there");
		$('#caption').on("click", replaceWithTextbox);
	}
);