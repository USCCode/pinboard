//This should be set to your deployed host. Set to localhost:8080 for testing.
var pinboardHostname = 'localhost:8080';

function generateNewPage(){
	//Get all the images from the current page
	var imgs = document.getElementsByTagName('img');
	var imgUrls = {}; //make the urls into this object's properties, thus eliminating duplicates 
	for (var i = 0; i < imgs.length; i ++){
		imgUrls[imgs[i].src] = [imgs[i].width, imgs[i].height]; 
	};
	var html = document.getElementsByTagName('html')[0];
	var body = document.getElementsByTagName('body')[0];
	var head = document.getElementsByTagName('head')[0];
	html.removeChild(head); //erase the current head
	html.removeChild(body); //erase the current body
	body = document.createElement('BODY'); //create new body
	var newHtml = '<html><head><style>.pic {border: solid 5px black; margin: 10px} .pic:hover{background-color:#fee;}</style></head>' 
		          +'<body><h1>Pinboard</h2><p>Pick which one of these images you want to add:</p><p>';
	for (var url in imgUrls){
		console.log(i);
		newHtml += '<div class="pic" style="width:200px;float:left"><img style="width:100%" src="'+ url 
		        +'"/><p style="width:100%;text-align:center;font-style:italic">'+ imgUrls[url][0] + ' x ' + imgUrls[url][1] 
		        + '</p><form style="width:100%" method="post" action="http://' 
				+ pinboardHostname +'/pin/">'
				+ '<input type="hidden" name="imgUrl" value="' + url
		        +  '"/><label for="caption">Caption: <input type="text" name="caption"></label></input><br/>'
		        + '<div style="width:100%;margin:10px auto 0 auto;text-align:center"><input type="submit" value="This One"/></div></form><br/></div>&nbsp;';
	};
	newHtml += '</p>';
	body.innerHTML = newHtml;
	html.appendChild(body);
}

generateNewPage();
