const clientId = 'jmln4edwwuw6mvyrrdbypt16g3lklr';
var auth_token = '';

const Twitch = Object.freeze({
	getAsync: (url, data) => {
		return new Promise((resolve, reject) => {
			var retry = 5;

			var headers = { 'client-id': clientId };
			if (auth_token) {
				headers['Authorization'] = 'Bearer ' + auth_token;
			}

			var options = {
				method: 'GET',
				url: url,
				headers: headers,
				data: data,
				dataType: 'json'
			};

			var success = d => resolve(d);
			var error = (jqXHR, textStatus, errorThrown) => {
				if (retry-- > 0) {
					console.log('retry remains ' + retry);
					setTimeout(() => request(), 2000);
				} else {
					reject(jqXHR, textStatus, errorThrown);
				}
			};
			var request = () => {
				$.ajax(options).then(success, error);
			};
			request();
		});
	},
	URL: Object.freeze({
		USERS: 'https://api.twitch.tv/helix/users',				// GET: id, login
		FOLLOWS: 'https://api.twitch.tv/helix/users/follows'	// GET: from_id, to_id
	})
});


String.prototype.zeroPadding = function (n) {
	return ('0'.repeat(n) + this).substr(-n);
};
Number.prototype.zeroPadding = function (n) {
	return ('0'.repeat(n) + this.toString()).substr(-n);
};


function copyText(text) {
	if (typeof text === 'string') {
		$('<input>').val(text).appendTo('body').select().each(e => document.execCommand('copy')).remove();
		window.toast(`"${text}" 복사되었습니다`);
	}
};




Array.prototype.shuffle = function shuffle() {
	// https://bost.ocks.org/mike/shuffle/
	var array = this;
	var m = array.length, t, i;
	while (m) {
		i = Math.floor(Math.random() * m--);
		t = array[m];
		array[m] = array[i];
		array[i] = t;
	}
	return array;
}




$(document).on('keydown', 'a, button', e => {
	e.preventDefault();
});





class CubicBezier {
	constructor(arr) {	// 'arr = [p0,p1,p2,p3]'
		if (typeof arr === 'string') {
			arr = arr.split(',').map(e => parseFloat(e));
		}
		const resolution = 100;
		var x = [];
		for (let i = 0; i <= resolution; i++) {
			x[i] = CubicBezier.calcBezier(i / resolution, arr[0], arr[2]);
		}
		this._x = x;
		this._p1 = arr[1];
		this._p3 = arr[3];
	}

	eval(x) {
		var t;
		if (x <= 0) {
			t = 0;
		} else if (x >= 1) {
			t = 1;
		} else {
			var _x = this._x, i;
			for (i = 0; i < _x.length; i++) {
				if (x < _x[i]) break;
			}
			t = ((x - _x[i - 1]) / (_x[i] - _x[i - 1]) + i - 1) / (_x.length - 1);
		}
		return CubicBezier.calcBezier(t, this._p1, this._p3);
	}

	static calcBezier(t, p0, p1) {
		var i = 1 - t;
		return 3*i*i*t*p0 + 3*i*t*t*p1 + t*t*t;
	}
};
var bezier = new CubicBezier([.08,.61,.59,.38]);





const Mode = Object.freeze({ None: 0, Simple: 1, Number: 2, Highlight: 3 });

var Colors = new class {
	constructor() {
		this.swatches = ["#FF0000","#0000FF","#008000","#B22222","#FF7F50","#9ACD32","#FF4500","#2E8B57","#DAA520","#D2691E","#5F9EA0","#1E90FF","#FF69B4","#8A2BE2","#00FF7F"];
		this.seed = parseInt(Math.random() * this.swatches.length);
	}
	rand(name) {
		var i = this.seed + name.split('').map(e => e.charCodeAt(0)).reduce((p,e) => p + e);
		return this.swatches[i % this.swatches.length];
	}
};



class UserElement extends HTMLElement {
	constructor() {
		super();
		this.className = 'user';
	}
};
class NormalUserElement extends UserElement {};
class SubscriberElement extends UserElement {};
customElements.define('x-normal-user', NormalUserElement);
customElements.define('x-subscriber', SubscriberElement);



(function() {
	const MaxVisible = 500;

	;(function() {
		var style = document.createElement('style');
		style.type = 'text/css';
		style.innerHTML = 'body:not(.subscriber-only).limit-users ul.user-list .user:nth-child(n+' + (MaxVisible + 1) + ') { display: none; } body.subscriber-only.limit-users ul.user-list x-subscriber:nth-of-type(n+' + (MaxVisible + 1) + ') { display: none; }';
		document.body.appendChild(style);
	})();

	var overflow = false;
	var showButton = document.querySelector('.show-all-users-button');

	var panel = document.querySelector('#user-panel');
	var ul = document.querySelector('ul.user-list');

	$(document).on('click', '.show-all-users-button', e => {
		confirmAsync({ title: '경고', text: '너무 많은 요소가 출력되면 버벅임이 발생할 수 있습니다.\n정말로 모든 시청자를 표시합니까?' }).then(b => {
			if (b) {
				document.body.classList.remove('limit-users');
			}
		});
	});

	var UserList = new class {
		constructor() {
			this.updateCounter();
			this.children = {};
		}
		clear() {
			while (ul.firstChild) {
				ul.removeChild(ul.firstChild);
			}
			this.children = {};
			this.updateCounter();
		}
		resetLimitSystem() {
			document.body.classList.add('limit-users');
			showButton.classList.remove('active');
			panel.scrollTop = 0;
			overflow = false;
		}
		set(users) {
			if (!(users instanceof Array)) return;

			this.resetLimitSystem();

			var newChildren = {};
			var oldChildren = this.children;

			for (let i = 0; i < users.length; i++) {
				let user = users[i];
				newChildren[user.name] = user;
				if (oldChildren.hasOwnProperty(user.name)) {
					delete oldChildren[user.name];
				} else {
					ul.appendChild(user.element);
				}
			}

			var keys = Object.keys(oldChildren);
			for (let i = 0; i < keys.length; i++) {
				oldChildren[keys[i]].element.remove();
			}

			this.children = newChildren;

			this.updateCounter();
		}
		add(user, dontUpdate) {
			if (this.children.hasOwnProperty(user.name))
				return;

			ul.appendChild(user.element);
			this.children[user.name] = user;
			if (!dontUpdate) {
				this.updateCounter();
			}
		}
		remove(user, dontUpdate) {
			user.element.remove();
			delete this.children[user.name];

			if (!dontUpdate) {
				this.updateCounter();
			}
		}
		subscriberOnly(b) {
			this.resetLimitSystem();
			if (b) {
				document.body.classList.add('subscriber-only');
			} else {
				document.body.classList.remove('subscriber-only');
			}
			this.updateCounter();
		}
		ignore(user, b) {
			user.ignore = b;
			this.updateCounter();
		}
		toggleIgnore(user) {
			return this.ignore(user, !user.ignore);
		}
		updateCounter() {
			var subscriber = ul.querySelectorAll('ul.user-list x-subscriber').length
			var total = ul.querySelectorAll('ul.user-list .user').length;
			var ignore = ul.querySelectorAll('ul.user-list .user.ignore').length;

			Object.assign(document.querySelector('#counter-content').dataset, {
				counterSubscriber : subscriber,
				counterTotal  : total,
				counterIgnore : ignore
			});

			var current;
			if (document.body.classList.contains('subscriber-only')) {
				current = subscriber;
			} else {
				current = total;
			}
			if (current > MaxVisible) {
				if (!overflow) {
					showButton.classList.add('active');
					overflow = true;
				}
			} else {
				if (overflow) {
					showButton.classList.remove('active');
					overflow = false;
				}
			}
		}
		get candidates() {
			if (document.body.classList.contains('subscriber-only')) {
				return $(ul).find('x-subscriber:not(.ignore)').toArray();
			} else {
				return $(ul).find('.user:not(.ignore)').toArray();
			}
		}
	};
	window.UserList = UserList;
})();


class User {
	constructor() {
		this.name = '';
		this.color = '';
		this.displayName = '';
		this.badges = {};
		this.id = '';
		this._ignore = false;

		this.count = 1;
	}
	setFromChat(m) {
		this.name = m.name;
		this.color = m.tags['color'] || Colors.rand(m.name);
		this.displayName = m.tags['display-name'] || m.name;
		this.badges = Object.assign({}, m.tags.badges);
		this.id = m.tags['user-id'];
		return this;
	}
	get ignore() { return this._ignore; }
	set ignore(v) {
		if (v) {
			this.element.classList.add('ignore');
			this._ignore = true;
		} else {
			this.element.classList.remove('ignore');
			this._ignore = false;
		}
	}

	buildElement() {
		var isSubscriber = this.badges.hasOwnProperty('subscriber');

		var element;
		if (isSubscriber) {
			element = new SubscriberElement();
		} else {
			element = new NormalUserElement();
		}
		
		var classList = element.classList;
		// classList.add('user');

		if (isSubscriber)
			classList.add('subscriber-' + this.badges.subscriber);
		// else
		// 	classList.add('non-subscriber');

		if (this._ignore)
			classList.add('ignore');

		Object.assign(element.dataset, {
			username: this.name, usernick: this.displayName
		});

		if (this.color)
			element.style.color = this.color;



		if (this.count >=2){
			element.textContent = this.displayName + "\t" + this.count;
		} else{
			element.textContent = this.displayName;
		}

		this.element = element;
		return element;
	}
	unselect() {
		UserList.remove(this);
		var parent = this.parentPool;
		if (parent) {
			delete parent.pool[this.name];
		}
		
		this.parentPool = null;
	}
	select(votePool) {
		this.unselect();
		votePool.pool[this.name] = this;
		this.parentPool = votePool;
	}
	multiSelect(votePool){
		if (votePool != this.parentPool)
			this.select(votePool);
		else{
		    this.count += 1;
		}
	}
};

class VotePool {
	constructor(name) {
		this.name = name;
		this.pool = {};
	}
};

class ChatProcessor {
	constructor(chatClient) {
		this.chatClient = chatClient;
		this.users = {};
		this.options = [];
		this.selectedOption = [];
		this.clear();
		this.onFirstPage();
		this.voting = false;

		this.onParsedCallback = this.onParsed.bind(this);
		this.chatClient.on('parsed', this.onParsedCallback);
	}
	onParsed(m) {
		var ban = app.settings.ban;
		if (ban && ban.length && ban.some(e => e == m.name)) {
			return;
		}
		var user = this.users[m.name];
		if (!user && this.voting) {
			user = this.users[m.name] = new User().setFromChat(m);
			user.buildElement();
		}
		if (user) {
			// user.lastChat = m.message;
			user.lastChat = m.messageWithEmoticon;
			user.lastTime = +new Date();
			if (this.voting) {
				this.process(user, m.message);
			}
		}
	}
	process(user, message) {
		//
	}
	onFirstPage() {	// 첫 화면
		$('.start-vote').removeClass('disabled');
		$(document.body).removeClass('voting closed');
	}
	start() {
		this.voting = true;
		$('.start-vote').addClass('disabled');
		$('.stop-vote').removeClass('disabled');
		$(document.body).addClass('voting').removeClass('closed');
		return this;
	}
	pause() {
		this.voting = false;
		$('.stop-vote').addClass('disabled');
		$(document.body).removeClass('voting').addClass('closed');
		return this;
	}
	clear() {
		UserList.clear();
		this.users = {};
		return this;
	}
	close() {
		if (this.onParsedCallback) {
			this.chatClient.off('parsed', this.onParsedCallback);
			this.onParsedCallback = null;
		}
		this.pause();
		this.clear();
		this.chatClient = null;
	}
	createVoteOptions(arr) {
		this.options = arr.map(name => new VotePool(name));
		return this;
	}
	select(arr) {
		var options = this.options;
		var len = options.length;
		if (!len || !arr) {
			this.selectedOption = [];
		} else {
			this.selectedOption = arr.map(e => parseInt(e)).filter(e => 0 <= e && e < len);
		}

		var users = [];
		this.selectedOption.forEach(e => {
			var pool = options[e].pool;
			var keys = Object.keys(pool);
			for (let i = 0; i < keys.length; i++) {
				var user = pool[keys[i]];				
				users.push(user);
			}
		});
		UserList.set(users);

		return this;
	}
	initTab(){

	}
};

class NullCP extends ChatProcessor {
	constructor(c) {
		super(c);
		$(document.body).removeClass('simple-mode number-mode highlight-mode');
		$('.tab-content').removeClass('active')
		.filter('#select-mode').addClass('active');
	}
	onParsed() {}
	start() {}
	initTab(){
		
	}
};

class SimpleModeCP extends ChatProcessor {
	constructor(c) {
		super(c);
		this.createVoteOptions(['simple']);
		this.select([0]);
		$(document.body).removeClass('number-mode').removeClass('highlight-mode').addClass('simple-mode');
		$('.tab-content').removeClass('active')
		.filter('#simple-mode').addClass('active');
	}
	process(user, message) {
		if (!user.hasOwnProperty('vote')) {
			user.select(this.options[0]);
			user.vote = true;

			UserList.add(user);
		}
	}
};

class NumberModeCP extends ChatProcessor {
	constructor(c) {
		super(c);
		this.flagAllowChange = true;

		$(document.body).removeClass('simple-mode').removeClass('highlight-mode').addClass('number-mode');
		$('.tab-content').removeClass('active')
		.filter('#number-mode').addClass('active');

		this.setCallbacks();
	}
	setCallbacks(){		
		var self = this;
		$('ul.vote-setting').on('click.numbermode', 'li.vote-item', e => {
			if (!$(e.delegateTarget).hasClass('result')) {
				return;
			}
			if (!e.ctrlKey) {
				var b = $(e.currentTarget).is('.selected');
				$('ul.result>li.vote-item.selected').removeClass('selected');
				if (!b) {
					$(e.currentTarget).addClass('selected');
				}
			} else {
				$(e.currentTarget).toggleClass('selected');
			}

			var selected = $(e.delegateTarget).find('li.selected').toArray().map(e => $(e).index());
			self.select(selected);
		});
		$(document).on('change.numbermode', '#show-result-numbers', e => {
			if (e.currentTarget.checked) {
				$('ul.vote-setting').removeClass('hide-numbers');
			} else {
				$('ul.vote-setting').addClass('hide-numbers');
				$('.vote-item').removeClass('selected');
				self.select(null);
			}
		});


		$(document).on('keydown.numbermode', 'li.vote-item>input', e => {
			if (e.key === 'Enter' || e.key === 'Tab') {
				e.preventDefault();
			}
		}).on('keyup.numbermode', 'li.vote-item>input', e => {
			if ((!e.shiftKey && e.key === 'Tab') || e.key === 'Enter') {
				var $li = $(e.currentTarget).closest('li');
				if ($li.is(':last-child') && !$(e.currentTarget).val()) {
					return false;
				}
				var next = $li.next('li');
				if (next.length == 0) {
					next = $(NumberModeCP.getVoteItemHtml(1)).appendTo('ul.vote-setting');
				}
				next.find('input').focus();
				return false;
			}
			else if (e.shiftKey && e.key === 'Tab') {
				$(e.currentTarget).closest('li').prev('li').find('input').focus();
				return false;
			}
		}).on('blur.numbermode', 'ul:not(.result)>li.vote-item', e => {
			if ($('li.vote-item:last-child input').val()) {
				$(NumberModeCP.getVoteItemHtml(1)).appendTo('ul.vote-setting');
			}
		}).on('click.numbermode', 'li.vote-item', e => {
			$(e.currentTarget).find('input').focus();
		}).on('click.numbermode', 'li.vote-item .delete', e => {
			$(e.currentTarget).closest('li').remove();
		}).on('focus.numbermode', 'li.vote-item input', e => {
			if (!$(e.currentTarget).closest('ul').hasClass('result')) {
				e.currentTarget.select();
			} else {
				e.currentTarget.setSelectionRange(0, 0);
			}
		}).on('paste.numbermode', 'li.vote-item input', e => {
			try {
				var cur = $(e.currentTarget);
				var t = e.originalEvent.clipboardData.getData('text');
				var a = t.split('\n').map(e => e.trim()).filter(e => e.length);
				if (a.length > 1) {
					cur.val(a.shift());
					var li = cur.closest('li');
					while (a.length > 0) {
						t = a.shift();
						var n = $(NumberModeCP.getVoteItemHtml(1)).appendTo('ul.vote-setting').find('input').val(t).end();
						li.after(n);
						li = n;
					}
					li.find('input').focus();
					e.preventDefault();	
				}
			} catch(ex) {
				console.log(ex);
			}
		}).on('click.numbermode', 'button.restore-vote', e => {
			if (!document.body.classList.contains('voting') && !document.body.classList.contains('closed')) {
				self.setVotesFromLatest();
			}
		}).on('click.numbermode', 'button.save-vote', e => {
			self.downloadVotes();
		}).on('click.numbermode', 'button.load-vote', e => {
			if (!document.body.classList.contains('voting') && !document.body.classList.contains('closed')) {
				self.setVotesFromFile();
			}
		}).on('click.numbermode', 'button.clear-vote', e => {
			if (!document.body.classList.contains('voting') && !document.body.classList.contains('closed')) {
				self.resetVotes();
			}
		});

		// drag drop
		$(document)
		.on('dragstart.numbermode', 'li.vote-item input', e => {
			return false;
		})
		.on('dragover.numbermode', 'li.vote-item', e => {
			e.originalEvent.dataTransfer.dropEffect = 'move';
			e.preventDefault();
		})
		.on('dragstart.numbermode', 'li.vote-item', e => {
			if (e.offsetX >= 32) {
				return false;
			}
			var val = $(e.currentTarget).find('input').val();
			if ($(e.currentTarget).is(':last-child') && !val) {
				return false;
			}

			e.originalEvent.dataTransfer.setDragImage(e.currentTarget, 0, 16);
			e.originalEvent.dataTransfer.effectAllowed = 'move';

			$('li.vote-item').not(':last-child').addClass('dragging');
			$(e.currentTarget).removeClass('dragging').addClass('dragging-placeholder');
		})
		.on('dragenter.numbermode', 'li.dragging', e => {
			var src = $('li.dragging-placeholder');
			var dst = $(e.currentTarget);
			if (dst.index() < src.index()) {
				dst.before(src);
			} else {
				dst.after(src);
			}
		})
		.on('dragend.numbermode dragexit.numbermode drop.numbermode', e => {
			$('li.vote-item').removeClass('dragging dragging-placeholder');
			return false;
		});
	}
	get allowChange() {
		return !!this.flagAllowChange;
	}
	set allowChange(value) {
		this.flagAllowChange = !!value;
	}
	static getVoteItemHtml(n) {
		const html = '<li class="vote-item" draggable="true"><input type="text" placeholder="새 항목 추가" spellcheck="false" /><div class="graph-wrap"><div class="graph"></div></div><div class="percent"></div><div class="votes"></div><button class="delete"><i class="icon-cancel"></i></button></li>';
		return html.repeat(n);
	}
	setVotesFromArray(arr) {
		if (arr instanceof Array) {
			arr = arr.map(e => e.toString().trim()).filter(e => e.length);
			if (arr.length) {
				$('ul.vote-setting').removeClass('result').html(NumberModeCP.getVoteItemHtml(arr.length + 1))
					.find('input').each((i, e) => { e.value = arr[i] || ''; }).last().focus();
			}
		}
	}
	setVotesFromLatest() {
		if (app.settings.votes && app.settings.votes.length) {
			this.setVotesFromArray(app.settings.votes);
		} else {
			alertAsync({ title: '오류', text: '현재 저장되어 있는 양식이 없습니다' });
		}
	}
	setVotesFromFile() {
		var self = this;
		$('#import-vote').remove();
		$('<input id="import-vote" type="file" style="display:none" accept=".txt">')
		.appendTo('ul.vote-setting')
		.on('change', e => {
			var input = e.currentTarget;
			var reader = new FileReader();
			reader.onload = evt => {
				var str = evt.target.result;
				var arr = str.split('\n').map(e => e.trim()).filter(e => e.length).slice(0, 1000);
				self.setVotesFromArray(arr);
				input.remove();
			};
			reader.readAsText(e.currentTarget.files[0])
			return false;
		}).click();
		console.log('hi');
	}
	downloadVotes() {
		var txt = $('ul.vote-setting input').toArray().map(e => e.value).filter(e => e).join('\r\n');
		if (!txt.trim().length) {
			toast('저장할 내용이 없습니다', 1000);
			return;
		}
		var now = new Date();
		var dateString = now.getYear().zeroPadding(2) + (now.getMonth() + 1).zeroPadding(2) + now.getDate().zeroPadding(2) + '_' + now.getHours().zeroPadding(2) + now.getMinutes().zeroPadding(2) + now.getSeconds(2);

		promptAsync({
			title: '저장',
			text: '투표 양식을 txt 파일로 저장합니다\n참여한 시청자 정보는 저장하지 않습니다',
			defaultValue: `투표_${dateString}.txt`,
			placeholder: '파일 이름'
		}).then(filename => {
			if (filename) {
				if (!/\.txt$/.test(filename)) {
					filename = filename + '.txt';
				}
				var file = new Blob([txt], { type:'text/plain' });
				var url = URL.createObjectURL(file);
				var a = $('<a>').attr({ href: url, download: filename }).css('display', 'none').appendTo('body')[0];
				a.click();
				setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 0);
			}
		});
	}
	resetVotes() {
		$('ul.vote-setting').removeClass('result').html(NumberModeCP.getVoteItemHtml(1))
			.find('input').focus();
	}
	process(user, message) {
		var match = /^!(?:투표|vote) *(\d+) *.*$/.exec(message);
		if (!match) {
			return;
		}
		var curVote = parseInt(match[1]);
		var len = this.options.length;
		if (len > 0 && 0 < curVote && curVote <= len) {
			if (!this.allowChange && user.hasOwnProperty('vote')) {
				return;
			}
			if (user.vote == curVote) {
				return;
			}
			var pool = this.options[curVote - 1];
			user.select(pool);
			user.vote = curVote;

			if (this.selectedOption.some(e => e == curVote - 1)) {
				UserList.add(user);
			}
		}
		this.updateResult();
	}
	onFirstPage() {		//
		super.onFirstPage();

		$('ul.vote-setting').removeClass('result').html(NumberModeCP.getVoteItemHtml(1));
		$('.vote-total').removeAttr('data-total');
		$('button.restore-vote').removeClass('disabled');
		$('button.save-vote').removeClass('disabled');
		$('button.load-vote').removeClass('disabled');
		$('button.clear-vote').removeClass('disabled');
	}
	onBeforeStart() {		// 투표 시작 버튼을 누른 직후
		var list = $('li.vote-item input').toArray().map(e => e.value).filter(e => e);
		if (list.length) {
			$(document.body).addClass('voting');
			$('ul.vote-setting').addClass('result').html(NumberModeCP.getVoteItemHtml(list.length))
				.find('li.vote-item').removeAttr('draggable')
				.find('input').prop('readonly', true).each((i, e) => { e.value = list[i]; });
			if ($('#show-result-numbers').is(':checked')) {
				$('ul.vote-setting').removeClass('hide-numbers');
			} else {
				$('ul.vote-setting').addClass('hide-numbers');
			}
			$('button.restore-vote').addClass('disabled');
			$('button.load-vote').addClass('disabled');
			$('button.clear-vote').addClass('disabled');
			this.createVoteOptions(list);

			app.settings.votes = list;
			app.saveSettings();

			return true;
		} else {
			alertAsync({ title: '오류', text: '투표 항목을 설정해주세요'});
			// toast('투표 항목을 설정해주세요');
			return false;
		}
	}
	start() {
		if (this.onBeforeStart()) {
			super.start();
			this.updateResult();
		}
		return this;
	}
	updateResult() {
		var lists = $('ul.vote-setting.result li');
		var counts = this.options.map(e => Object.keys(e.pool).length);
		var sum = 0;
		if (counts.length) {
			sum = counts.reduce((p, e) => e + p);
		}
		counts.forEach((e, i) => {
			var width = sum ? (bezier.eval(e / sum) * 100.0).toFixed(1) : '0';
			var percent = sum ? (e / sum * 100.0).toFixed(1) : '0';
			lists.eq(i)
				.find('.graph').css('width', width + '%' ).end()
				.find('.percent').attr('data-percent', percent).end()
				.find('.votes').attr('data-votes', e).end()
		});
		if (sum) {
			$('.vote-total').attr('data-total', sum);
		} else {
			$('.vote-total').removeAttr('data-total');
		}
	}
	pause() {
		super.pause();
		$('ul.vote-setting').removeClass('hide-numbers');
	}
	close() {
		$('ul.vote-setting').off('click.numbermode');
		$(document).off('change.numbermode keydown.numbermode keyup.numbermode click.numbermode focus.numbermode blur.numbermode paste.numbermode');
		$(document).off('dragstart.numbermode dragend.numbermode dragover.numbermode dragenter.numbermode dragleave.numbermode dragexit.numbermode drag.numbermode drop.numbermode');
		super.close();
	}
};

class HighlightModeCP extends NumberModeCP
{
	constructor(c)
	{
		super(c);
		$('span.on-number-mode').text("강조 메세지 투표");
	}

	onParsed(m) {
		if(m.tags["msg-id"] != "highlighted-message"){
			return;
		}
		var ban = app.settings.ban;
		if (ban && ban.length && ban.some(e => e == m.name)) {
			return;
		}
		var user = this.users[m.name];
		if (!user && this.voting) {
			user = this.users[m.name] = new User().setFromChat(m);
			user.buildElement();
		}
		if (user) {
			// user.lastChat = m.message;
			user.lastChat = m.messageWithEmoticon;
			user.lastTime = +new Date();
			if (this.voting) {
				this.process(user, m.message);
			}
		}
	}

	process(user, message) {
		var match = /^!(?:투표|vote) *(\d+) *.*$/.exec(message);
		if (!match) {
			return;
		}
		var curVote = parseInt(match[1]);
		var len = this.options.length;

		if (len <= 0 || 0 >= curVote || curVote > len) {
			 return;
		}

		var pool = this.options[curVote - 1];
		user.multiSelect(pool);
		
		if (this.selectedOption.some(e => e == curVote - 1)) {
			UserList.add(user);
		}

		user.buildElement();
		this.updateResult();
	}

	updateResult() {
		var lists = $('ul.vote-setting.result li');


		var counts = this.options.map(e => Object.values(e.pool).reduce((a,b) => a + b.count,0));
		var sum = 0;
		if (counts.length) {
			sum = counts.reduce((p, e) => e + p);
		}
		counts.forEach((e, i) => {
			var width = sum ? (bezier.eval(e / sum) * 100.0).toFixed(1) : '0';
			var percent = sum ? (e / sum * 100.0).toFixed(1) : '0';
			lists.eq(i)
				.find('.graph').css('width', width + '%' ).end()
				.find('.percent').attr('data-percent', percent).end()
				.find('.votes').attr('data-votes', e).end()
		});
		if (sum) {
			$('.vote-total').attr('data-total', sum);
		} else {
			$('.vote-total').removeAttr('data-total');
		}
	}

	close(){
		$('span.on-number-mode').text("숫자 투표");
		super.close();
	}
}

;(function() {

	// Roulette.run([{id:'',nick:'',subscriber:true}]);

	var _currentID = 0;
	var Roulette = new class {
		constructor() {
			this.startTime = 0;
			this.timerID = null;
			this.reset();
			this.winnerName = null;

			var self = this;
			$(document).on('click.roulette', '#roll-result .close-button', e => {
				// $('#roll-result').removeClass('active').hide();
				self.close();
			});
		}
		reset() {
			if (this.timerID) {
				clearInterval()
			}
			this.startTime = +new Date();
			this.winnerName = null;
			$('#roll-result').addClass('standby');
			$('.winner-nick, .winner-id').text('');
			$('.winner-clock').attr({ 'data-minutes': '0', 'data-seconds': '00' });
			$('.winner-subscribe').removeClass('is-subscriber');
			$('.winner-follow').removeClass('is-follower question-mark').removeAttr('title');
			$('.winner-chat').addClass('empty').html('');
			$('.winner-send-message a').attr('href', '');
			$('#roll-result style').html('');
			return this;
		}
		createChat(message, timestamp) {
			var chat = `<li class="conversation"><div class="profile"></div><div class="text">${message}</div><span class="timestamp">${timestamp}</span></li>`;
			return $(chat);
		}
		onchat(m) {
			if (m.name === this.winnerName) {
				var clock = $('.winner-clock');
				var time = clock.attr('data-minutes') + ':' + clock.attr('data-seconds');
				var chat = this.createChat(m.messageWithEmoticon, time);	// m.message
				$('.winner-chat')
				.removeClass('empty')
				.append(chat)
				.scrollTop($('.winner-chat')[0].scrollHeight);

				if (app.settings.tts) {
					ttsSpeak(m.message);
					// ttsSpeak(ChatClient.removeEmoticonsFromMessage(m.message, m.tags.emotes));
				}
			}
		}
		tick() {
			var d = document.querySelector('#roll-result');
			if (!d || !d.classList.contains('active')) {
				return false;
			}
			var now = +new Date();
			var dt = parseInt((now - this.startTime) / 1000);
			var ss = dt % 60;
			var mm = parseInt((dt - ss) / 60);
			var clock = d.querySelector('.winner-clock');
			if (clock) {
				clock.dataset.minutes = mm;
				clock.dataset.seconds = ss.zeroPadding(2);
			}
			return true;
		}
		openDialog() {
			var d = document.querySelector('#roll-result');
			d.classList.add('active');
			d.style.display = 'block';
		}
		prize(w) {	// {id: 'id', nick: 'nick'}
			this.startTime = +new Date();
			this.winnerName = w.id;

			// winner's last chat
			var user = app.cpEngine.users[w.id];
			if (user && user.lastTime && user.lastChat) {
				let dt = parseInt((this.startTime - user.lastTime) / 1000);
				let ss = dt % 60;
				let mm = parseInt((dt - ss) / 60);
				var time = '-' + mm + ':' + ss.zeroPadding(2);
				var chat = this.createChat(user.lastChat, time);
				$('.winner-chat').prepend(chat.addClass('last-chat'));
			}

			// ignore
			if (user) {
				UserList.ignore(user, true);
			}

			// speak
			// if (app.settings.tts) {
				ttsSpeak(w.nick || w.id);
			// }

			// timer
			var self = this;
			var tickID = ++_currentID;
			!function _tick() {
				if (tickID === _currentID) {
					if (self.tick()) {
						setTimeout(_tick, 100);
					}
				} else {
					// console.log('tick out');
				}
			}();
		}
		async run(candidates) {	// [ {id: 'id', nick: 'nick', subscriber: true, cls: classtext }, {...}, ... ]
			this.reset();

			var winner;
			var csAnimElem;
			if (candidates instanceof Array) {
				candidates = candidates.shuffle().slice(0, 12);

				winner = candidates[0];

				// 후보 애니메이션 재생
				$('.candidate-wrap').remove();
				var cs = '';
				for (let i = 0; i < 120; i++) {
					let e = candidates[i % candidates.length];
					cs = `<div class="candidate ${e.cls || ''}">${e.nick || e.id}</div>` + cs;
				}
				csAnimElem = $(`<div class="candidate-wrap"><div class="candidate-inner">${cs}</div></div>`);

			} else if (candidates && candidates.id && candidates.nick) {
				winner = candidates;
			} else {
				return;
			}

			this.openDialog();

			var p1 = new Promise(resolve => {
				// 보험
				setTimeout(() => resolve(), 10000);
				
				if (!csAnimElem || !csAnimElem.length)
					return resolve();

				csAnimElem
				.appendTo('.roll-result-inner')
				.on('animationend', e => {
					if (e.target === e.currentTarget) {
						resolve();
					}
				});
			});

			// var profile_image_url = '', followed_at;
			;(function() {
				// get winner info

				Twitch.getAsync(Twitch.URL.USERS, {
					login: winner.id
				}).then(res => {
					if (res && res.data && res.data[0] && res.data[0].login === winner.id) {
						var profile_image_url = res.data[0].profile_image_url;
						if (profile_image_url) {
							var style = `.conversation .profile { background-image: url(${profile_image_url}) !important; }`;
							$('#roll-result style').html(style);
						}
					}
				});

				$('.winner-follow').addClass('question-mark').attr('title', '일시적인 트위치 서버 오류로 정보 갱신에 실패했습니다');

				var user = app.cpEngine.users[winner.id];
				if (user) {
					var nid = user.id;
					Twitch.getAsync(Twitch.URL.FOLLOWS, {
						from_id: nid,
						to_id: app.channelInfo.id
					}).then(res => {
						if (res && res.data && res.data[0] && res.data[0].from_id) {
							var followed_at = new Date(res.data[0].followed_at);
							if (followed_at) {
								var dateString = (followed_at.getYear() + 1900) + '.'
												+ (followed_at.getMonth() + 1).zeroPadding(2) + '.'
												+ followed_at.getDate().zeroPadding(2);
								$('.winner-follow').attr('title', dateString + '~').addClass('is-follower').removeClass('question-mark');
								return;
							}
						}
						$('.winner-follow').removeAttr('title').removeClass('is-follower question-mark');
					}, (onerror) => {
						$('.winner-follow').addClass('question-mark').attr('title', '일시적인 트위치 서버 오류로 정보 갱신에 실패했습니다');
						toast('일시적인 서버 오류로 시청자 정보 갱신에 실패했습니다', 5000);
					});
				}

			})();

			// set winner info, in sync context
			$('.winner-nick').text(winner.nick).removeAttr('class').addClass('winner-nick ' + (winner.cls || ''));
			$('.winner-id').text(winner.id);
			// $('.winner-send-message a').attr('href', 'https://www.twitch.tv/message/compose?to=' + winner.id);
			// $('a.send-message-button').attr('href', 'https://www.twitch.tv/message/compose?to=' + winner.id);
			$('#roll-result .copy-nick-button').attr('data-copy', winner.nick);
			$('#roll-result .copy-id-button').attr('data-copy', winner.id);
			$('#roll-result .copy-nick-id-button').attr('data-copy', `${winner.nick} (${winner.id})`);
			$('.winner-clock').attr({ 'data-minutes': '0', 'data-seconds': '00' });
			if (winner.subscriber) {
				$('.winner-subscribe').addClass('is-subscriber');
			} else {
				$('.winner-subscribe').removeClass('is-subscriber');
			}
			$('.winner-chat').addClass('empty').html('');
			if (app.settings.tts) {
				$('.tts-button').addClass('active');
			} else {
				$('.tts-button').removeClass('active');
			}

			// wait for async
			// await Promise.all([ p1, p2 ]);
			await Promise.all([ p1 ]);
			$('#roll-result').removeClass('standby');
			$('.candidate-wrap').remove();

			// prize
			this.prize(winner);
		}
		close() {
			$('#roll-result').removeClass('active').hide();
			this.winnerName = null;
			ttsStop();
		}
	};
	window.Roulette = Roulette;
})();

class App {
	constructor() {
		this.currentMode = Mode.None;
		this.channelInfo = {};

		var chatClient = new ChatClient(guestAccount);
		chatClient.on('close', () => {
			$('.toast-reconnecting').addClass('show');
		}).on('reconnected', () => {
			setTimeout(() => $('.toast-reconnecting').removeClass('show'), 1000);
		});

		this.chatClient = chatClient;

		this.cpEngine = new NullCP(chatClient);

		this.settings = {
			tts: true,
			ban: [ 'Nightbot', 'ssakdook', 'Twipkr' ],
			channel: ''
		};

		var self = this;

		var p3 = new Promise(resolve => {
			getAccessToken().finally(resolve);
		});

		// wait for chat client
		var p1 = new Promise(resolve => {
			self.chatClient.ready(() => {
				setTimeout(() => resolve(), 100);
			});
			setTimeout(() => $('#app-loading').addClass('delayed'), 5000);
		});

		// load settings
		var p2 = new Promise(async resolve => {
			await self.loadSettings();
			resolve();
		});

		Promise.all([ p1, p2, p3 ]).then(() => self.init());
	}
	async loadSettings() {
		var settings = await loadChromeDataAsync();
		this.updateSettings(settings);
	}
	async saveSettings() {
		return await saveChromeDataAsync(this.settings);
	}
	updateSettings(data) {
		this.settings = Object.assign(this.settings, data);
		if (this.settings.tts) {
			$('.tts-button').addClass('active');
		} else {
			$('.tts-button').removeClass('active');
		}
	}
	init() {
		var self = this;


		if (this.settings.channel && location.hash) {
			if (this.settings.channel != location.hash.substr(1)) {
				self.openChannelPrompt();
			} else {
				self.onhashchange();
			}
		} else if (this.settings.channel && !location.hash) {
			location.hash = this.settings.channel;
		} else if (!this.settings.channel && location.hash) {
			self.onhashchange();
		} else {
			self.openChannelPrompt();
		}

		$(window)
		.on('hashchange.app', e => self.onhashchange());

		$('#current-channel').on('animationend', e => $(e.currentTarget).removeClass('in'))

		$(document)
		.on('click.app', '#current-channel', e => self.openChannelPrompt())
		.on('click.app', '#goto-home', e => self.changeMode(Mode.None))
		.on('click.app', '#goto-simple-mode', e => self.changeMode(Mode.Simple))
		.on('click.app', '#goto-number-mode', e => self.changeMode(Mode.Number))
		.on('click.app', '#goto-highlight-mode', e => self.changeMode(Mode.Highlight))
		.on('click.app', '.start-vote:not(.disabled)', e => self.startVote())
		.on('click.app', '.stop-vote:not(.disabled)', e => self.pauseVote())
		.on('click.app', 'ul.user-list .user[data-username]', e => {
			var cur = $(e.currentTarget);

			var users = self.cpEngine.users;
			var user = users[cur.attr('data-username')];
			if (user) {
				UserList.toggleIgnore(user);
			}
		})
		.on('change.app', '#subscriber-only', e => {
			UserList.subscriberOnly(e.currentTarget.checked);
		})
		.on('click.app', '.click-to-copy', e => {
			var text = $(e.currentTarget).attr('data-copy');
			if (text) {
				copyText(text);
				return false;
			}
		})
		.on('click.app', 'ul.user-list', e => {
			$('#contextmenu').hide();
		})
		.on('contextmenu.app', 'ul.user-list', e => {
			return false;
		})
		.on('contextmenu.app', 'ul.user-list .user[data-username]', e => {
			var cur = $(e.currentTarget);
			var id = cur.attr('data-username');
			var nick = cur.attr('data-usernick');
			var c = $('#contextmenu').show()
				.find('#copy-nick').attr('data-nick', nick).show().end()
				.find('#copy-id').attr('data-id', id).show().end()
				.find('#give').attr('data-id', id).show().end()
			.css({ top: e.clientY, left: e.clientX });
			if (window.innerHeight && e.clientY + 200 > window.innerHeight) {
				c.addClass('upward');
			} else {
				c.removeClass('upward');
			}
			if (id === nick) {
				c.find('#copy-nick').hide();
			}
			return false;
		})
		.on('mouseleave.app', '#contextmenu', e => {
			$('#contextmenu').hide();
		})
		.on('mouseenter.app', '#right-panel', e => {
			$('#contextmenu').hide();
		})
		.on('click.app', '#copy-id', e => {
			copyText($(e.currentTarget).attr('data-id'));
			$('#contextmenu').hide();
			return false;
		})
		.on('click.app', '#copy-nick', e => {
			copyText($(e.currentTarget).attr('data-nick'));
			$('#contextmenu').hide();
			return false;
		})
		.on('click.app', '#give', e => {
			self.give($(e.currentTarget).attr('data-id'));
			$('#contextmenu').hide();
			return false;
		})
		.on('click.app', '#roll', e => self.roll())
		.on('click.app', '.tts-button', e => {
			if ($(e.currentTarget).hasClass('active')) {
				$(e.currentTarget).removeClass('active');
				self.settings.tts = false;
			} else {
				$(e.currentTarget).addClass('active');
				self.settings.tts = true;
			}
			self.saveSettings();
			ttsStop();
		})
		.on('click.app', 'a.send-message-button', e => {
			alertAsync({title: '안내', text: '2018년 4월 부로 트위치 내의 메시지 기능이 사라졌습니다'});
			return false;
		})
		
		this.chatClient.on('parsed', m => Roulette.onchat(m));

		$('#app-loading').remove();
	}
	destroy() {
		$(window).off('hashchange.app');
		$(document).off('click.app mouseenter.app mouseleave.app contextmenu.app');
		$('#current-channel').off('animationend.app');
	}

	onhashchange() {
		var self = this;
		var hash = location.hash;
		if (hash) {
			var channel = hash.replace('#', '');
			self.validateChannel(channel).then(success => {
				self.changeChannel(success);
				$('#current-channel').addClass('in');
			}, fail => {
				location.hash = '';
				alertAsync({ title: '오류', text: '채널 정보를 불러올 수 없습니다 - ' + channel })
					.then(a => location.reload());
			});
		}
	}

	async startVote() {
		if (Object.keys(this.cpEngine.users).length) {
			var b = await confirmAsync({ title: '경고!', text: '참여자 목록이 초기화됩니다' });
			if (!b) return;
			this.cpEngine.clear();
		}

		this.cpEngine.start();
	}

	pauseVote() {
		this.cpEngine.pause();
	}

	async roll() {
		var candidates = UserList.candidates;
		if (!candidates.length) {
			return await alertAsync({ title: '오류', text: '대상이 없습니다' });
		}

		Roulette.run([].map.call(candidates, e => {
			var isSubscriber = e.tagName.toLowerCase() === 'x-subscriber';
			return {
				id   : e.getAttribute('data-username'),
				nick : e.getAttribute('data-usernick'),
				cls  : isSubscriber ? e.getAttribute('class') : 'non-subscriber',
				subscriber: isSubscriber,
			};
		}));
	}

	async give(username) {
		var user = app.cpEngine.users[username];
		if (user) {
			var subscriber = user.badges.subscriber;
			Roulette.run({
				id   : user.name,
				nick : user.displayName,
				cls  : subscriber !== undefined ? ('subscriber-' + subscriber) : 'non-subscriber',
				subscriber: subscriber !== undefined,
			});
		}
	}

	async changeMode(m) {
		if (!this.channelInfo.name) {
			this.openChannelPrompt();
			return;
		}

		if (Object.keys(this.cpEngine.users).length) {
			var b = await confirmAsync({ title: '경고!', text: '참여자 목록이 초기화됩니다' });
			if (!b) return;
		}

		this.cpEngine.close();
		this.cpEngine = null;

		switch (m) {
			case Mode.Simple:
				this.cpEngine = new SimpleModeCP(this.chatClient);
				break;
			case Mode.Number:
				this.cpEngine = new NumberModeCP(this.chatClient);
				break;
			case Mode.Highlight:
				this.cpEngine = new HighlightModeCP(this.chatClient);
				break;
			case Mode.None:
			default:
				this.cpEngine = new NullCP(this.chatClient);
				break;
		}
		this.mode = m;
	}

	changeChannel(c) {
		var self = this;
		if (typeof c === 'string') {
			self.validateChannel(c).then(s => self.changeChannel(s));
			return;
		}

		this.channelInfo = {
			id: c.id,
			name: c.login,
			displayName: c.display_name,
			profile: c.profile_image_url,
			subsBadges: {}
		};

		var channel = c.login;

		$.getJSON('https://badges.twitch.tv/v1/badges/channels/' + c.id + '/display?language=ko')
		.then(d => {
			try {
				var badges = self.channelInfo.subsBadges = d.badge_sets.subscriber.versions;
				var style = '';
				for (var v in badges) {
					style += `.subscriber-${v}::before { background-image: url(${badges[v].image_url_1x}); background-image: -webkit-image-set(url(${badges[v].image_url_1x}) 1x, url(${badges[v].image_url_2x}) 2x); }`;
				}
				$('style#subscriber-icon-style').html(style);
			} catch(e) { }
		});

		$('#current-channel')
			.find('img.profile').attr('src', c.profile_image_url)
		.end()
			.find('.twitch-name').text(c.display_name + ' (' + channel + ')')
		.end();

		this.settings.channel = channel;
		this.saveSettings();

		this.chatClient.join(channel);
		this.changeMode(Mode.None);
		this.refreshChat();
	}

	openChannelPrompt() {
		var self = this;

		promptAsync({
			title: '채널 입력',
			text: '스트리머의 영문 채널명을 입력하세요\n예시) hanryang1125 (o) / 풍월량 (x)',
			placeholder: 'Channel',
			defaultValue: location.hash.replace(/\W/g, '') || this.settings.channel
		}).then(c => {
			if (c) {
				c = c.replace(/\W/g, '');
				this.cpEngine.pause();
				this.cpEngine.clear();
				if (location.hash.substr(1) != c) {
					chrome.storage.local.set({ 'access_token' : '', 'force_verify' : true }, () => {
						location.hash = c;
					});
				} else {
					self.onhashchange();
				}
			}
		});
	}

	refreshChat() {
		var prevChannel = $('#chat').attr('data-channel');
		if (prevChannel != this.channelInfo.name) {
			$('#chat')
			.html('<iframe src="https://www.twitch.tv/embed/' + this.channelInfo.name + '/chat?parent=www.twitch.tv"></iframe>')
			// .html('<iframe src="https://www.twitch.tv/embed/' + this.channelInfo.name + '/chat?parent=ocnplnjcbicbpbnlmpljfgicnpibidgj"></iframe>')
			.attr('data-channel', this.channelInfo.name);
		}
	}

	validateChannel(channel) {
		return new Promise((resolve, reject) => {
			if (!channel || typeof channel !== 'string') {
				return reject('Invalid channel name');
			}
			channel = channel.replace(/\W/g, '');

			$('#ajax-loading').addClass('active');

			Twitch.getAsync(Twitch.URL.USERS, { login: channel }).then(d => {
				try {
					(d.data[0].login == channel) && resolve(d.data[0]);
				} catch (e) {
					reject(e);
				}
			}, (x, t, e) => {
				reject(e);
			}).finally(a => {
				setTimeout(() => {
					$('#ajax-loading').removeClass('active');
				}, 100);
			});
		});
	}
};
var app = new App();

function loadChromeDataAsync() {
	return new Promise(resolve => {
		chrome.storage.local.get('v3', data => {
			resolve(data['v3']);
		});
	});
}

function saveChromeDataAsync(data) {
	return new Promise(resolve => {
		chrome.storage.local.set({ v3: data }, () => resolve(chrome.runtime.lastError));
	});
}

chrome.storage.onChanged.addListener(function(changes, area) {
	if (area === 'local' && changes.newValue && changes.newValue['v3']) {
		app.updateSettings(changes.newValue['v3']);
	}
})

;(function () {
	var voices = {};
	chrome.tts.getVoices(vs => {
		vs.forEach(e => (e.voiceName.indexOf('Google') >= 0) && (voices[e.lang] = e.voiceName));
	});

	function ttsSpeak(text) {
		if (typeof text !== 'string') return;

		var options = {};

		if (/^[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff]+$/.test(text)) {
			// ja-JP
			if (voices['ja-JP']) {
				options.voiceName = voices['ja-JP'];
			}
		} else {
			// ko-KR
			if (voices['ko-KR']) {
				options.voiceName = voices['ko-KR'];
			}
			// const map = {
			// 	'1': '일', '2': '이', '3': '삼', '4': '사', '5': '오',
			// 	'6': '육', '7': '칠', '8': '팔', '9': '구', '0': '공',
			// 	'ㅋ': '크'
			// };
			// const regExp = new RegExp(Object.keys(map).join('|'), 'gi');
			// text = text.replace(regExp, matched => map[matched]);
		}

		chrome.tts.speak(text, options);
	}

	function ttsStop() {
		chrome.tts.stop();
	}

	window.ttsSpeak = ttsSpeak;
	window.ttsStop = ttsStop;

})();

function getAccessToken() {
	return new Promise(r1 => {
		new Promise((resolve, reject) => {
			chrome.storage.local.get(['access_token', 'expires_at'], data => {
				if (!data.expires_at || data.expires_at < +new Date()) {
					return reject();
				}
				if (data.access_token) {
					$.ajax({
						method: 'GET',
						url: 'https://id.twitch.tv/oauth2/validate',
						headers: { 'Authorization' : 'OAuth ' + data.access_token },
						dataType: 'json'
					}).then(success => {
						resolve([data.access_token, success]);
					}, reject);
				}
				else {
					reject();
				}
			});
		})
		.then(async access_token => {
			// console.log(access_token);
			window.auth_token = access_token[0];
			let login = access_token[1].login;
			app.updateSettings({ channel : login });
			await app.saveSettings();
			location.hash = login;
		})
		.catch(() => {
			location.href = chrome.runtime.getURL('auth.html');
		})
		.finally(() => {
			r1();
		});
	});
}

// getAccessToken();