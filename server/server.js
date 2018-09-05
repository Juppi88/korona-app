const express = require('express');
const bodyParser = require('body-parser');
const stats = require("./stats");

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());

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

app.put("/api/game", (req, res) => {

	var gameIndex = 0;

	// Validate the data. If it has the required fields, save the game data to the log and return the log index.
	if (req.body.hasOwnProperty("players") &&
		req.body.hasOwnProperty("starter")) {

		gameIndex = stats.saveGameToLog(req.body);
	}

	res.send({ gameIndex: gameIndex });
});

app.post("/api/game", (req, res) => {

	var succeeded = false;

	// Validate the data. If it has the required fields, update the game entry in the log table.
	if (req.body.hasOwnProperty("gameIndex") &&
		req.body.hasOwnProperty("winners")) {
		
		succeeded = stats.saveGameResultsToLog(req.body.gameIndex, req.body.winners);
	}

	res.send({ succeeded: succeeded });
});

// Create an SQLite database for stats and other information.
stats.setupDatabase();

// Cache the list of names.
stats.getNames();

app.listen(port, () => console.log("API server listening on port " + port));
