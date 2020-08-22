var result = {};

var match = /#(.+)/.exec(location.hash);
if (match) {
	match[1].split('&').forEach(e => {
		e = e.split('=');
		result[e[0]] = decodeURIComponent(e[1]);
	});
}

if (result.access_token) {
	if (result.token_type != 'bearer') {
		console.log(result.token_type);
	}

	chrome.storage.local.set({
		'access_token' : result.access_token,
		'force_verify' : false,
		'expires_at' : +new Date() + 15 * 1000
	}, () => {
		location.href = chrome.runtime.getURL('app.html');
	});
}
else {
	location.href = chrome.runtime.getURL('auth_fail.html');
}