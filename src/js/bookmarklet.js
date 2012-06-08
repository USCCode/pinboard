var pinboardHostname = 'localhost:8080';

function generateNewPage(){
	//Get all the images from the current page
	var imgs = document.getElementsByTagName('img');
	var imgUrls = {}; //make the urls into this object's properties, thus eliminating duplicates 
	for (var i = 0; i < imgs.length; i ++){
		imgUrls[imgs[i].src] = 1; 
	};
	var html = document.getElementsByTagName('html')[0];
	var body = document.getElementsByTagName('body')[0];
	html.removeChild(body); //erase the current body
	body = document.createElement('BODY'); //create new one
	var newHtml = '<html><head></head><body><h1>Pinboard</h2>' +
				 '<p>Pick from one of these images:</p><p>';
	console.log(imgs.length);
	for (var url in imgUrls){
		console.log(i);
		newHtml = newHtml + '<div><img style="width:200px" src="' 
			    + url + '"/><br/><form method="post" action="http://' 
				+ pinboardHostname +'/pin/">' 
				+ '<input type="hidden" name="imgUrl" value="' + url
		        +  '"/><input type="submit" value="This One"/></form></div>&nbsp;';
	};
	newHtml = newHtml + '</p>';
	body.innerHTML = newHtml;
	html.appendChild(body);
}

generateNewPage();
