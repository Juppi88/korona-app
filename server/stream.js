const {google} = require('googleapis');
const privateKey = require("./auth.json");
const oauthLogin = require("./secret.json");
const token = require("./token.json");

const scopes = ['https://www.googleapis.com/auth/youtube'];

const oauthClient = new google.auth.OAuth2(
	oauthLogin.installed.client_id,
	oauthLogin.installed.client_secret,
	oauthLogin.installed.redirect_uris[1]
);

var streamChannel = null;
var streamChatId = null;
var streamTitle =  null;

// --------------------------------------------------------------------------------

module.exports.fetchStreamInfo = function(onStreamInfoReceived)
{
	oauthClient.setCredentials(token);

	const youtube = google.youtube({
		auth: oauthClient,
		version: 'v3'
	});

	// List active broadcasts.
	youtube.liveBroadcasts.list({
		auth: oauthClient,
		part: "id,snippet",
		broadcastStatus: "active",
		broadcastType: "all"
	})
	.then(function(response) {
		
		if (response.data.items.length != 0) {

			const stream = response.data.items[0].snippet;

			streamId = response.data.items[0].id;
			streamChatId = stream.liveChatId;
			streamTitle = stream.title;

			// Invoke the callback to let the backend know the stream info was fetched successfully.
			if (onStreamInfoReceived) {
				onStreamInfoReceived();
			}
		}
	})
	.catch(function(err) {
		console.error("Error getting YouTube broadcast status:");
		console.error(err);
	});
}

module.exports.getStreamUrl = function()
{
	return "https://gaming.youtube.com/watch?v=" + streamId;
}

module.exports.getStreamTitle = function()
{
	return streamTitle;
}

module.exports.sendChatMessage = function(message)
{
	oauthClient.setCredentials(token);

	const youtube = google.youtube({
		auth: oauthClient,
		version: 'v3'
	});

	youtube.liveChatMessages.insert({
		auth: oauthClient,
		part: "snippet",
		resource: {
			"snippet": {
				"liveChatId": streamChatId,
				"type": "textMessageEvent",
				"textMessageDetails": {
					"messageText": message
				}
			}
		}
	})
	.catch(function(err) {
		console.error(err);
	});
}

// Auth URL generation
/*const url = oauthClient.generateAuthUrl({
	access_type: 'offline',
	scope: scopes
});

console.log(url);

// Token geneeration
oauthClient.getToken(code,
	function(err, token) {
		if (err) {
			console.log('Error while trying to retrieve access token', err);
			return;
		}
		oauthClient.credentials = token;
		console.log("Token received! ");
		console.log(token);
	}
);
*/
