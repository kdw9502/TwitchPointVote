;(function () {
	const alertHTML = '<div class="modal"><div class="alert modal-inner"><div class="header"></div><div class="content"></div><div class="button-container"><div class="close-button" tabindex="-1"></div></div></div></div>';
	const confirmHTML = '<div class="modal"><div class="confirm modal-inner"><div class="header"></div><div class="content"></div><div class="button-container"><div class="cancel-button" tabindex="-1"></div><div class="ok-button"></div></div></div></div>';
	const promptHTML  = '<div class="modal"><div class="prompt modal-inner"><div class="header"></div><div class="content"></div><div class="input-container"><input type="text" spellcheck="false" /></div><div class="button-container"><div class="cancel-button"></div><div class="ok-button"></div></div></div></div>';

	function alertAsync(options) {	// title, text
		return new Promise(r => {
			var resolve = function() {
				r(); a.remove();
			};
			var m = $('<div>').text(options.text||'').html().split('\n').map(e=>'<p>'+e+'</p>').join('');
			var a = $(alertHTML)
			.on('click', '.close-button', e => resolve())
			.on('keyup', e => e.key === 'Escape' && resolve())
			.appendTo('.modal-container')
				.find('.header').text(options.title || '').end()
				.find('.content').html(m).end()
				.find('.close-button').focus().end();
			setTimeout(() => a.addClass('active'), 0);
		});
	};

	function confirmAsync(options) {	// title, text
		return new Promise(r => {
			var resolve = function(b) {
				r(!!b); a.remove();
			};
			var m = $('<div>').text(options.text||'').html().split('\n').map(e=>'<p>'+e+'</p>').join('');
			var a = $(confirmHTML)
			.on('click', '.ok-button', e => resolve(true))
			.on('click', '.cancel-button', e => resolve(false))
			.on('keyup', e => e.key === 'Escape' && resolve(false))
			.appendTo('.modal-container')
				.find('.header').text(options.title || '').end()
				.find('.content').html(m).end()
				.find('.cancel-button').focus().end();
			setTimeout(() => a.addClass('active'), 0);
		});
	};

	function promptAsync(options) {		// title, text, placeholder?, defaultValue?
		return new Promise(r => {
			var resolve = function(m) {
				r(m); a.remove();
			};
			var m = $('<div>').text(options.text||'').html().split('\n').map(e=>'<p>'+e+'</p>').join('');
			var a = $(promptHTML)
			.on('click', '.ok-button', e => resolve(a.find('input').val()))
			.on('click', '.cancel-button', e => resolve())
			.on('keyup', 'input', e => {
				if (e.key === 'Escape') {
					resolve();
					return false;
				} else if (e.key === 'Enter') {
					resolve(e.currentTarget.value);
					return false;
				}
			})
			.appendTo('.modal-container')
				.find('.header').text(options.title || '').end()
				.find('.content').html(m).end()
				.find('input').focus().each((i, e) => {
					if (options.placeholder) {
						$(e).attr('placeholder', options.placeholder);
					}
					if (options.defaultValue) {
						e.value = options.defaultValue;
					}
				}).end();
			setTimeout(() => a.addClass('active'), 0);
		});
	};

	window.alertAsync = alertAsync;
	window.confirmAsync = confirmAsync;
	window.promptAsync = promptAsync;

	var toast = function(text, duration) {
		duration = duration || 3000;
		var t = $('<div class="toast"><div class="text">' + text + '</div></div>').prependTo('#toast-container');
		setTimeout(() => {
			t.addClass('fadeout');
			setTimeout(() => t.remove(), 300);
		}, duration);
		return t;
	};

	window.toast = toast;

})();