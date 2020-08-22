const clientId = 'jmln4edwwuw6mvyrrdbypt16g3lklr';

const nonce = 'TYhNaOvRVj9SvOC1gha48ur8GkzmGnYCv2wy4meRm4ymQLpNqM77HcvdU96wEyu7WZzdiFDhat2rpkQpyka2Y0pcm21shfE9UH7k';

chrome.storage.local.get('force_verify', data => {
	let redirect_uri = encodeURIComponent(chrome.runtime.getURL('access_token.html?n=' + nonce));
	let force_verify = data.force_verify === true;
	location.href = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirect_uri}&response_type=token&force_verify=${force_verify}`;
})

