var pinboardHostname = 'localhost:8080';

function generateNewPage(){
	//Get all the images from the current page
	var imgUrls = $('img').map(function(){return this.src});
	document.write('<html><head></head><body><h1>Pinboard</h2>');
	document.write('<p>Pick from one of these images:</p><p>')
	for (var i = 0; i < imgUrls.length; i++){
		document.write('<div><img style="width:200px" src="' +imgUrls[i] + '"/><br/><form method="post" action="http://' 
				+ pinboardHostname +'/pin/">' 
				+ '<input type="hidden" name="imgUrl" value="' + imgUrls[i]
		        +  '"/><input type="submit" value="This One"/></form></div>&nbsp;')
	}
	document.write('</p></html>')
	
}