var config = {
	"name": "content",
	"urlTemplate": "<div class='url_wrapper'><ul class='url_list'><%for(var i=0;i<this.urls.length;i++){%><li class='info-block'><span class='link-block' title=<%=this.urls[i].link%>><%=this.urls[i].title%></span><span class='del-url-btn'>删除</span></li><%}%></ul><div class='btn'><span class='save'>保存</span><span class='cancel'>取消</span></div></div>",
	"restoreListTemplate": "<div class='restore_wrapper'><ul class='restore-list'><%for(var i=0;i<this.restore.length;i++){%><li class='restore-item'><div class='item-time' data-status=0><%=i+1%>.创建时间：<%=this.restore[i].time%></div><ul class='item-urls'><%for(var j=0;j<this.restore[i].urls.length;j++){%><li class='item-url' title=<%=this.restore[i].urls[j].link%>><%=this.restore[i].urls[j].title%></li><%}%></ul></li><%}%></ul><div class='btn'><span class='cancel'>取消</span></div>",
	"urlListId": "kwj-url-list",
	"restoreListId": "kwj-restore-list"
};

var Director = function(){
	var that = {};
	var director_members = {}
	that.setMembers = function(members){
		for(var m in members)
			director_members[m] = members[m];
	};
	that.takeTransaction = function(m, stuff, para){
		director_members[m][stuff](para);
	};
	return that;
};

var Transaction = function(director){
	this.director = director;
	this.HandInTransaction = function(m, stuff, para){
		this.director.takeTransaction(m, stuff, para);
	};
};

var ViewTransaction = function(){
	var that = {};
	var templateEngine = function(html, options){
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
	};
	that.printUrls = function(urlsInfo){
		var tplData, newDiv, cancelBtn, saveBtn, list, urlItems;

		tplData = templateEngine(config.urlTemplate, {urls: urlsInfo}); 
		list = document.getElementById(config.urlListId);
		if(list){
			list.parentNode.removeChild(list);	
		}

		newDiv = document.createElement("div");
		newDiv.id = config.urlListId;
		document.body.appendChild(newDiv);
		newDiv.innerHTML = tplData;
		cancelBtn = newDiv.querySelector(".cancel");
		saveBtn = newDiv.querySelector(".save");
		urlItems = newDiv.getElementsByClassName("info-block");

		cancelBtn.onclick = function(){
			var block = document.getElementById(config.urlListId);
			block.parentNode.removeChild(block);
		};
		saveBtn.onclick = function(){
			var linkDoms = newDiv.getElementsByClassName("link-block");
			var links = [];
			for(var i = 0; i < linkDoms.length; i++){
				links.push({
					"title": linkDoms[i].innerHTML, 	
					"link" : linkDoms[i].getAttribute("title")
				})	
			}
			ViewTransaction.prototype.HandInTransaction("message", "sendmessage", {
				"receiver" : "background",	
				"event"    : "save",
				"content"  : links 
			});
			cancelBtn.onclick();
		};
		for(var i = 0; i < urlItems.length; i++){
			urlItems[i].onmouseover = function(e){
				var delBtn = this.querySelector(".del-url-btn");
				delBtn.style.display = "inline";
			};
			urlItems[i].onmouseout = function(e){
				var delBtn = this.querySelector(".del-url-btn");
				delBtn.style.display = "none";
			};
		}
		var delBtns = newDiv.querySelectorAll(".del-url-btn");
		var itemCount = delBtns.length;
		for(var i = 0; i < delBtns.length; i++){
			delBtns[i].onclick = function(e){
				var li = this.parentNode;
				li.parentNode.removeChild(li);
				itemCount--;
				if(itemCount == 0){
					list = document.getElementById(config.urlListId);
					list.parentNode.removeChild(list);	
				}
			}	
		}
	};
	that.printRestoreUrls = function(urllist){
		//mark: remember to cache data;
		var newDiv, tempDiv, tplData,
			openBtn, cancelBtn, tabsSet, lists; 	
		var classNames = ["blue", "green", "purple", "red", "yellow"];
		newDiv = document.createElement("div");
		newDiv.id = config.restoreListId;
		tempDiv = document.getElementById(config.restoreListId);
		if(tempDiv){
			tempDiv.parentNode.removeChild(tempDiv);
		}
		document.body.appendChild(newDiv);

		tplData = templateEngine(config.restoreListTemplate, {restore:urllist});
		newDiv.innerHTML = tplData;

		openBtn = newDiv.querySelector(".open");
		cancelBtn = newDiv.querySelector(".cancel");
		tabsSet = newDiv.querySelectorAll(".item-time");
		lists = newDiv.querySelectorAll(".restore-item");
		for(var i = 0; i < tabsSet.length; i++){
			tabsSet[i].className = tabsSet[i].className + " restore-list-" + classNames[i%6];
			lists[i].onmouseover = function(){
				this.querySelector(".item-urls").style.display = "block";
			}
			lists[i].onmouseout = function(){
				this.querySelector(".item-urls").style.display = "none"; 
			}
			tabsSet[i].onclick = function(){
				var urls = [];	
				var data = this.parentNode.querySelectorAll("li");
				for(var d = 0; d < data.length; d++){
					urls.push(data[d].getAttribute("title"));
				}
				ViewTransaction.prototype.HandInTransaction("message", "sendmessage", {
					"receiver" : "background",	
					"event"    : "openRestore",
					"content"  : urls 
				}); 
				cancelBtn.onclick(); 
			}
		}
		cancelBtn.onclick = function(){
			newDiv.parentNode.removeChild(newDiv);
		};
	};
	return that;
};

var MessageTransaction = function(){
	var that = {};
	that.sendmessage = function(para){
		var messageContent = {
			"receiver": para.receiver,
			"event": para.event,
			"content": para.content
		};
		chrome.runtime.sendMessage(messageContent, para.callback);
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
	  						MessageTransaction.prototype.HandInTransaction("view", "printUrls", messageContent);
	  						break;
	  					case "showrestorelist":
	  						MessageTransaction.prototype.HandInTransaction("view", "printRestoreUrls", messageContent);
	  						break;
	  				}			
	  			}
		});
	};
	receivemessage();
	return that;
};

(function(){
	/*Init Environment*/
	var _director = Director();
	var _transaction = new Transaction(_director);
	ViewTransaction.prototype = _transaction;
	MessageTransaction.prototype = _transaction;
	var _view = ViewTransaction();
	var _message = MessageTransaction();
	_director.setMembers({
		"view": _view,
		"message": _message
	});
})();
