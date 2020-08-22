// function getChannel(url) {
// 	return (url.match(/(?:twitch\.tv\/)([^\/]+)/)||[]).pop();
// }

chrome.browserAction.onClicked.addListener(function(tab) {
	// var channel = null;
	// if (tab.url) {
	// 	channel = getChannel(tab.url);
	// }
	// chrome.tabs.create({ url: chrome.runtime.getURL('app.html#' + (channel||'')) });
	chrome.tabs.create({ url: chrome.runtime.getURL('app.html') });
});


// (function() {
// 	if (!chrome.tts) {
// 		return;
// 	}

// 	var voiceName;
// 	var default_tts_options = {
// 		rate  : 0.9,
// 		pitch : 1
// 	};
	
// 	chrome.tts.getVoices(function(voices) {
// 		var voiceName;
// 		voices.some(v => {
// 			if (v.lang === 'ko-KR' && v.voiceName.includes('Google')) {
// 				default_tts_options.voiceName = voiceName = v.voiceName;
// 				return true;
// 			}
// 		});
// 	});

// 	chrome.runtime.onMessage.addListener(function(msg) {
// 		if (msg && msg.msgType === 'tts') {
// 			if (typeof msg.text === 'string') {
// 				if (msg && msg.options) {
// 					msg.options.voiceName = default_tts_options.voiceName;
// 				}
// 				chrome.tts.speak(msg.text, msg.options || default_tts_options);
// 			} else if (msg.stop) {
// 				chrome.tts.stop();
// 			}
// 		}
// 	});
// })();