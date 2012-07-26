function viewPin(pin){
	return'<div class="thumbbox"><a href="/pin/'+ pin.pinid +'">' +
		'<img class="thumbPin" title="Pin '+ pin.pinid +'" alt="'+ pin.caption +'" src="'+
		pin.imgUrl + '"/></a>' +
        'Pin '+ pin.pinid + '<br/>' +
        '<span class="displayCaption" id="caption">' +
        pin.caption + 
        '</span><p style="clear:both"></p></div>';
}


function drawBoard(data){
	$('#boardTitle').text(data.title);
	for (var i=0; i < data.pins.length; i++){
		var pin = data.pins[i];
		var pinHtml = viewPin(pin);
		$('#pins').append(pinHtml);
	}
}

function getBoard(){
	var boardid = location.pathname.split('/')[2];
	$.ajax('/board/' + boardid + '.json', {
		type: 'GET',
		success: function(data){
			drawBoard(data);
		}
	});
}


$(document).ready(function(){
	getBoard();
});
