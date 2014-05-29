var config = {
	"name": "content",
	"urlTemplate": "<div class='url_wrapper'><ul class='url_list'><%for(var i=0;i<this.urls.length;i++){%><li><span data-url=<%=this.urls[i].link%>><%=this.urls[i].title%></span><span class='del-url-btn'></span></li><%}%></ul><div class='btn'><span class='save'>保存</span><span class='cancel'>取消</span></div></div>",
	"urlListId": "kwj-url-list"
};

var urlsPrinter = {
	"messageHandler": undefined,
	"templateEngine": function(template, data){
		function TemplateEngine(html, options) {
			var re = /<%([^%>]+)?%>/g, code = 'var r=[];\n', cursor = 0;
			var add = function(line, js) {
				if(js){
					if(line[0] != "="){
						code += line + '\n';
					}
					else{
						code += 'r.push(' + line.slice(1) + ');\n'
					}
				}
				else{
					(code += line != '' ? 'r.push("' + line.replace(/"/g, '\\"') + '");\n' : '');
				}
				return add;
			}
			while(match = re.exec(html)) {
				add(html.slice(cursor, match.index))(match[1], true);
				cursor = match.index + match[0].length;
			}
			add(html.substr(cursor, html.length - cursor));
			code += 'return r.join("");';
			return new Function(code.replace(/[\r\t\n]/g, '')).apply(options);
		}
		var result = TemplateEngine(config.urlTemplate, data);
		return result;
	},
	"printUrls": function(urlsInfo){
		var tplData = this.templateEngine(config.urlTemplate, {urls: urlsInfo}); 
		var list = document.getElementById(config.urlListId);
		if(list){
			list.parentNode.removeChild(list);	
		}
		var newDiv = document.createElement("div");
		newDiv.id = config.urlListId;
		document.body.appendChild(newDiv);
		newDiv.innerHTML = tplData;
		var cancelBtn = newDiv.querySelector(".cancel");
		var saveBtn = newDiv.querySelector(".save"); 
		cancelBtn.onclick = function(){
			var block = document.getElementById(config.urlListId);
			block.parentNode.removeChild(block);
		};
		saveBtn.onclick = function(){
			urlsPrinter.messageHandler.sendmessage("background", "save", urlsInfo, function(){
				alert("Save A Set Of Webpages");	
			});
		};
	}
};

var messagemanager = function(){
	var that = {};
	that.sendmessage = function(receiver, event, content, callback){
		var messageContent = {
			"receiver": receiver,
			"event": event,
			"content": content
		};
		chrome.runtime.sendMessage(messageContent);
	};
	var receivemessage = function(){
		chrome.runtime.onMessage.addListener(
	  		function(request, sender, sendResponse){
	  			var messageContent = request;
	  			var receiver = request.receiver;
	  			if(receiver == "content"){
	  				var messageEvent = request.event;
	  				var messageContent = request.content;
	  				switch (messageEvent){
	  					case "showurl":
	  						urlsPrinter.printUrls(messageContent);
	  						break;
	  				}			
	  			}
		});
	};
	receivemessage();
	return that;
};

(function(){
	var mm = messagemanager();
	urlsPrinter.messageHandler = mm;	
})();