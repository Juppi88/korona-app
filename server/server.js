const express = require('express');
const bodyParser = require('body-parser');
const shell = require('shelljs');
const os = require('os');
const stats = require("./stats");

const app = express();
const port = process.env.PORT || 5000;

const COLOUR_NONE = -1;
const COLOUR_RED = 0;
const COLOUR_YELLOW = 1;
const COLOUR_GREEN = 2;
const COLOUR_BLUE = 3;

app.use(bodyParser.json());

// --------------------------------------------------------------------------------

app.get("/api/names", (req, res) => {

	var names = stats.getNames();
	res.send({ names: names });
});

app.put("/api/names", (req, res) => {

	// Add the name to the database.
	stats.addName(req.body.name);

	// Return the updated list of names.
	var names = stats.getNames();
	res.send({ names: names });
});

// --------------------------------------------------------------------------------

app.put("/api/game", (req, res) => {

	var gameIndex = 0;

	// Validate the data. If it has the required fields, save the game data to the log and return the log index.
	if (req.body.hasOwnProperty("players") &&
		req.body.hasOwnProperty("starter")) {

		results = stats.saveGameToLog(req.body);
	}

	res.send({ results: results });
});

// --------------------------------------------------------------------------------

app.get("/api/stats", (req, res) => {

	var gameStats = stats.getStats();
	res.send(gameStats);
});

// --------------------------------------------------------------------------------

app.get("/api/logs", (req, res) => {

	var gameLogs = stats.getLogs();
	res.send(gameLogs);
});

// --------------------------------------------------------------------------------

var liveGameInfo = {
	isLive: false,
	players: []
};

// Get info of the currently running game.
app.get("/api/live", (req, res) => {

	res.send(liveGameInfo);
});

// Save game info. This means a new game has started.
app.put("/api/live", (req, res) => {

	if (!req.body.players || req.body.players.length == 0) {
		return;
	}

	// Save game info.
	liveGameInfo.isLive = true;
	liveGameInfo.players = req.body.players;

	// Start the live stream if running on the Raspberry Pi.
	if (os.platform() == "linux") {
		var plrRed = "", plrYellow = "", plrGreen = "", plrBlue = "";

		for (var i = 0, c = req.body.players.length; i < c; i++) {
			const player = req.body.players[i];

			if (player.colour === COLOUR_RED) plrRed = player.name;
			else if (player.colour === COLOUR_YELLOW) plrYellow = player.name;
			else if (player.colour === COLOUR_GREEN) plrGreen = player.name;
			else if (player.colour === COLOUR_BLUE) plrBlue = player.name;
		}

		shell.exec('./scripts/start-stream.sh "' + plrRed + '" "' + plrYellow + '" "' + plrGreen + '" "' + plrBlue + '"', { silent: true, async: true });
	}

	// Return the game info.
	res.send(liveGameInfo);
});


// Delete game info. This means the game has ended.
app.delete("/api/live", (req, res) => {

	// Save game info.
	liveGameInfo.isLive = false;
	liveGameInfo.players = [];

	// End the live stream if running on the Raspberry Pi.
	if (os.platform() == "linux") {
		shell.exec('./scripts/stop-stream.sh', { silent: true, async: true });
	}

	// Return the game info.
	res.send(liveGameInfo);
});

// --------------------------------------------------------------------------------

// Create an SQLite database for stats and other information.
stats.setupDatabase();

// Cache the list of names.
stats.getNames();

app.listen(port, () => console.log("API server listening on port " + port));
