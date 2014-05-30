var config = {
	"name": "background"
};

var urlStore = function(){
	var that = {};
	var db;
	var readyHandler;
	var openDatabase = function(){
		var request = indexedDB.open("URLStore", "1");
		request.onsuccess = function(event){
			db = request.result;
			readyHandler();
		}
		request.onupgradeneeded = function(event){
			db = request.result;
			var urlSetStore = db.createObjectStore("urlSet", {keyPath: "key"});
			readyHandler();
		};
	};
	that.ready = function(callback){
		readyHandler = callback;
	};
	that.addSet = function(urls){
		var transaction = db.transaction(["urlSet"], "readwrite");
		var objectStore = transaction.objectStore("urlSet");	
		var request = objectStore.add({"key": new Date().getTime(), "urls": urls});
		request.oncomplete = function(){

		};
	};
	that.getSet = function(callback, callbackpara){
		var result = [];
		var transaction = db.transaction(["urlSet"]);
		var objectStore = transaction.objectStore("urlSet");
		objectStore.openCursor(null, "prev").onsuccess = function(event) {
			var cursor = event.target.result;
			if(cursor){
				result.push(cursor.value);
				cursor.continue();
			}
			else{
				callbackpara.push(result);
				callback.apply(this, callbackpara);
			}
		};
	};
	openDatabase();
	return that;
};

var us = urlStore();
us.ready(function(){
	var messagemanager = function(){
		var sendmessagetocurrenttabs = function(content){

		};
		var that = {};
		var sendmessage = function(receiver, event, content, callback){
			var messageContent = {
				"sender"  : config.name,
				"event"   : event,
				"content" : content,
				"receiver": receiver 
			};
			chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  				chrome.tabs.sendMessage(tabs[0].id, messageContent, null);
			});
		};
		var receivemessage = function(){
			chrome.runtime.onMessage.addListener(
	  			function(request, sender, sendResponse){
	  				var messageContent = request;
	  				var receiver = request.receiver;
	  				if(receiver == "background"){
	  					var messageEvent = request.event;
	  					var content = request.content;
	  					switch (messageEvent){
	  						case "getSave":
	  							chrome.tabs.query({currentWindow: true}, function(tabs){
	  								var showedUrls = [];	
	  								tabs.forEach(function(item){
	  									showedUrls.push({
	  										"title": item.title,
	  										"link" : item.url	
	  									});
	  								});
	  								sendmessage("content", "showurl", showedUrls);
	  							});
	  							break;	
	  						case "getRestore":
	  							us.getSet(sendmessage, ["content", "showrestorelist"]);
	  							break;
	  						case "save":
	  							us.addSet(content);	
		  						break;
	  					}			
	  				}
			});
		};
		receivemessage();
		return that;
	};
	var mm = messagemanager();
});