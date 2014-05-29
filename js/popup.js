window.onload = function(){
	var config = {
		"name": "browser_action"
	}
	var messagemanager = function(){
		var that = {};
		that.sendmessage = function(receiver, content, callback){
			var messageContent = {
				"sender"  : config.name,
				"content" : content,
				"receiver": "background"
			};
			chrome.runtime.sendMessage(messageContent);
		};
		return that;
	};
	var mm = messagemanager();
	var li = document.getElementsByTagName("li");
	for(var i = 0; i < li.length; i++){
		(function(index){
			li[index].onclick = function(){
				mm.sendmessage("background", li[index].getAttribute("message"));
			};
		})(i);
	}
};
