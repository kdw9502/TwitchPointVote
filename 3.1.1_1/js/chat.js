// v1.0.0

var guestAccount = {
	name: 'justinfan' + ('000000' + Math.floor(Math.random() * 1e6)).substr(-6),
	pass: 'blah'
};

//// new API
// justinfan: function() {
// 	return "justinfan" + Math.floor(8e4 * Math.random() + 1e3)
// },
// password: function(e) {
// 	return "SCHMOOPIIE" === e ? "SCHMOOPIIE" : "oauth:" + e.toLowerCase().replace("oauth:", "")
// },

const serverAddress = 'wss://irc-ws.chat.twitch.tv:443';

var ChatClient = function ChatClient(account, channel) {
	this.name = account.name;
	this.pass = account.pass;

	this.readyFn = [];
	this.isReady = false;

	this.listeners = {};
	this.stopAutoReconnect = false;
	this.reconnectDelay = 1000;

	this.open();
};

ChatClient.prototype.ready = function(fn) {
	if (typeof fn === 'function') {
		if (!this.isReady) {
			this.readyFn.push(fn);
		} else {
			fn.call(this);
		}
	}
};

ChatClient.prototype.onReady = function() {
	if (!this.isReady) {
		this.isReady = true;
		this.reconnectDelay = 1000;

		if (this.channel) {
			this.join(this.channel);
		}

		var r = this.readyFn;
		while (r.length > 0) {
			var fn = r.shift();
			if (typeof fn === 'function') {
				fn.call(this);
			}
		}
	}
};

ChatClient.prototype.open = function() {
	this.close();

	//var ws = new WebSocket(serverAddress, 'irc');
	var ws = new WebSocket(serverAddress);

	ws.onmessage = this.onmessage.bind(this);
	ws.onerror = this.onerror.bind(this);
	ws.onclose = this.onclose.bind(this);
	ws.onopen = this.onopen.bind(this);

	this.ws = ws;
};

ChatClient.prototype.reconnect = function() {
	console.log('Reconnecting...');
	this.isReady = false;
	this.open();
};

ChatClient.prototype.close = function() {
	if (this.ws) {
		this.ws.close();
		this.ws = null;
	}
};

ChatClient.prototype.onmessage = function(evt) {
	var data = evt.data;
	if (!data) {
		return;
	}

	if (!this.isReady) {
		if (data.indexOf(':tmi.twitch.tv 001') >= 0) {	// welcome message
			this.onReady();
			this.invoke('reconnected');
		}
	}

	if (data.indexOf('PING') >= 0) {
		this.pong();
	} else if (data.indexOf('PONG') >= 0) {
		// recv pong
	} else {
		var parsed = ChatClient.parseMessage(data);
		if (parsed) {
			this.invoke('parsed', [parsed]);
		}
	}
};

ChatClient.prototype.onerror = function(evt) {
	console.log('Error: ', evt);
	this.invoke('error', [evt]);
};

ChatClient.prototype.onclose = function() {
	console.log('Disconnected');
	this.invoke('close');
	if (!this.stopAutoReconnect) {
		var self = this;
		setTimeout(() => self.reconnect(), this.reconnectDelay);
		this.reconnectDelay = Math.min(30000, 2 * this.reconnectDelay);
	}
};

ChatClient.prototype.onopen = function() {
	var ws = this.ws;

	if (ws && ws.readyState === 1) {
		console.log('Connected');
		console.log('Authenticating...');

		var CAP_TAGS = 'twitch.tv/tags',
			CAP_CMDS = 'twitch.tv/commands',
			CAP_MEMS = 'twitch.tv/membership';

		// ws.send('CAP REQ :twitch.tv/tags twitch.tv/commands twitch.tv/membership');
		ws.send('CAP REQ :' + CAP_TAGS);
		ws.send('PASS ' + this.pass);
		ws.send('NICK ' + this.name);
	}
};

ChatClient.parseBadges = function(str) {
	var badges = {};
	if (!str) {
		return badges;
	}

	str.split(',').forEach(e => {
		e = e.split('/');
		badges[e[0]] = e[1];
	});

	return badges;
};

ChatClient.parseEmotes = function(str) {
	var list = [];
	if (!str) {
		return list;
	}
	str.split('/').forEach(e => {
		var o = e.split(':');
		var key = o[0];
		var arr = o[1].split(',').map(i => {
			return { id: key, index: i.split('-').map(n => parseInt(n)) };
		});
		while (arr.length) {
			list.push(arr.shift());
		}
	});
	list.sort((a,b) => a.index[0] - b.index[0]);
	return list;
}

ChatClient.applyEmotes = function(message, emotesArray) {
	var result = '';
	var left = 0;
	const length = emotesArray.length;
	for (let i = 0; i < length; i++) {
		let item = emotesArray[i];
		result += message.slice(left, item.index[0]);

		var alt = message.slice(item.index[0], item.index[1] + 1);
		var src = 'http://static-cdn.jtvnw.net/emoticons/v1/' + item.id;
		result += '<img src="' + src + '/1.0" alt="' + alt + '" srcset="' + src + '/2.0 2x" class="emoticon" />';

		left = item.index[1] + 1;
	}
	result += message.slice(left, message.length);
	return result;
}

ChatClient.removeEmoticonsFromMessage = function(message, emotesArray) {
	var result = '';
	var left = 0;
	const length = emotesArray.length;
	for (let i = 0; i < length; i++) {
		let item = emotesArray[i];
		result += message.slice(left, item.index[0]);
		left = item.index[1] + 1;
	}
	result += message.slice(left, message.length);
	return result;
}

ChatClient.parseTags = function(tagStr) {
	var tags = {};
	if (!tagStr) {
		return tags;
	}

	tagStr.split(';').forEach(e => {
		e = e.split('=');
		var key = e[0];
		var val = e[1];
		switch (key) {
			case 'badges':
				tags[key] = ChatClient.parseBadges(val);
				break;
			case 'emotes':
				tags[key] = ChatClient.parseEmotes(val);
				break;
			default:
				tags[key] = val;
				break;
		}
	});

	return tags;
};

ChatClient.parseMessage = function(rawMessage) {
	var parsed = {
		tags: null,
		name: null,
		command: null,
		channel: null,
		message: null,
		get messageWithEmoticon() {
			if (!this.tags || !this.tags.emotes)
				return this.message;
			if (!this._messageWithEmoticon) {
				this._messageWithEmoticon = ChatClient.applyEmotes(this.message, this.tags.emotes);
			}
			return this._messageWithEmoticon;
		}
	};

	if (rawMessage[0] === '@') {
		var tagIndex = rawMessage.indexOf(' '),
			userIndex = rawMessage.indexOf(' ', tagIndex + 1),
			commandIndex = rawMessage.indexOf(' ', userIndex + 1),
			channelIndex = rawMessage.indexOf(' ', commandIndex + 1),
			messageIndex = rawMessage.indexOf(':', channelIndex + 1);

		var rawTags = rawMessage.slice(1, tagIndex);
		parsed.name = rawMessage.slice(tagIndex + 2, rawMessage.indexOf('!'));
		parsed.command = rawMessage.slice(userIndex + 1, commandIndex);
		parsed.channel = rawMessage.slice(commandIndex + 1, channelIndex);
		parsed.message = rawMessage.slice(messageIndex + 1).trim();
	}

	if (parsed.command !== 'PRIVMSG') {
		parsed = null;
	} else {
		parsed.tags = ChatClient.parseTags(rawTags);
	}

	return parsed;
};

ChatClient.prototype.sendRawMessage = function(rawMessage) {
	var ws = this.ws;

	if (ws && ws.readyState === 1) {
		ws.send(rawMessage);
		return true;
	}
	return false;
};

ChatClient.prototype.join = function(channel) {
	var prev = this.channel;
	if (prev) {
		this.part(prev);
	}
	this.channel = channel;
	return this.sendRawMessage('JOIN #' + channel);
};

ChatClient.prototype.part = function(channel) {
	return this.sendRawMessage('PART #' + channel);
};

ChatClient.prototype.pong = function() {
	return this.sendRawMessage('PONG :tmi.twitch.tv');
};

ChatClient.prototype.invoke = function(name, args) {
	var l = this.listeners[name];
	if (l instanceof Array) {
		l.forEach(fn => fn.apply(this, args));
	}
};

ChatClient.prototype.on = function(name, fn) {
	if (typeof name === 'string' && typeof fn === 'function') {
		if (!(this.listeners[name] instanceof Array)) {
			this.listeners[name] = [];
		}
		this.listeners[name].push(fn);
	}
	return this;
};

ChatClient.prototype.off = function(name, fn) {
	if (this.listeners[name] instanceof Array) {
		if (!fn) {
			this.listeners[name] = [];
		} else {
			this.listeners[name] = this.listeners[name].filter(e => e != fn);
		}
	}
	return this;
};