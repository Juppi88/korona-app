'use strict';

const sqlite3 = require('sqlite3').verbose();
const DatabaseName = "stats.db";

// --------------------------------------------------------------------------------

var names = [];
var nameIndices = [];

var previousLogIndex = 0;

const COLOUR_NONE = -1;
const COLOUR_RED = 0;
const COLOUR_YELLOW = 1;
const COLOUR_GREEN = 2;
const COLOUR_BLUE = 3;

var stats = {};

// --------------------------------------------------------------------------------

module.exports.setupDatabase = function()
{
	let db = new sqlite3.Database(DatabaseName);
	if (db == null) {
		return;
	}

	// Ensure the database has the necessary tables.
	var statement = db.prepare("CREATE TABLE IF NOT EXISTS names (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT);");

	if (statement != null) {
		statement.run()
		statement.finalize();
	}

	statement = db.prepare(
		`CREATE TABLE IF NOT EXISTS game_log (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			plr_red INTEGER DEFAULT 0,
			plr_yellow INTEGER DEFAULT 0,
			plr_green INTEGER DEFAULT 0,
			plr_blue INTEGER DEFAULT 0,
			first_player INTEGER DEFAULT -1,
			winners INTEGER DEFAULT 0,
			time_started INTEGER DEFAULT 0,
			time_ended INTEGER DEFAULT 0
		);`
	);

	if (statement != null) {
		statement.run()
		statement.finalize();
	}

	// Retrieve and store the biggest index in the game log.
	db.get("SELECT MAX(id) FROM game_log;", [], (err, row) => {
		if (row) {
			previousLogIndex = getAtIndex(row, 0);
		}
	});

	db.close();

	cacheStats();
};


module.exports.getNames = function()
{
	// Return the cached name list.
	if (names && names.length > 0) {
		return names;
	}

	// Clear the old list.
	names = [];
	nameIndices = [];

	let db = new sqlite3.Database(DatabaseName);
	if (db == null) {
		return names;
	}

	db.each("SELECT id, name FROM names",

		(err, row) => {
			if (row && row.name) {

				names.push(row.name);
				names.sort();

				// Store a tuple containing the name and a matching index from the name table.
				nameIndices.push({ id: row.id, name: row.name });
			}
		}
	);

	db.close();

	return names;
};

module.exports.getStats = function()
{
	return stats;
}

module.exports.addName = function(name)
{
	// Make sure the name isn't already on the list.
	if (names.indexOf(name) >= 0) {
		return names;
	}

	// Add the new name to the list.
	names.push(name);

	// Sort the names alphabetically.
	names.sort();

	// Add the new name to the database.
	let db = new sqlite3.Database(DatabaseName);
	if (db != null) {
		
		var statement = db.prepare("INSERT INTO names (name) VALUES (?);");

		statement.run(name, function(err) {

			if (!err) {
				// Update name indices list.
				nameIndices.push({ id: this.lastID, name: name });
			}
			else console.log(err);
		});

		statement.finalize();

		db.close();
	}

	return names;
};

function getNameIndex(name)
{
	if (!name) {
		return 0;
	}

	for (var i = 0, c = nameIndices.length; i < c; i++) {
		if (nameIndices[i].name == name) {
			return nameIndices[i].id;
		}
	}

	return 0;
}

module.exports.saveGameToLog = function(game)
{
	var logIndex = previousLogIndex + 1;

	var plrRed = getNameIndex(game.players[COLOUR_RED]);
	var plrYellow = getNameIndex(game.players[COLOUR_YELLOW]);
	var plrGreen = getNameIndex(game.players[COLOUR_GREEN]);
	var plrBlue = getNameIndex(game.players[COLOUR_BLUE]);

	if (game.starter < 0 || game.starter > COLOUR_BLUE) {
		game.starter = -1;
	}

	// Save the winners as flags to save space.
	var winnerFlags = 0;

	for (var i = 0, c = game.winners.length; i < c; i++) {

		if (game.winners[i] >= 0 && game.winners[i] < 4) {
			winnerFlags |= (1 << game.winners[i]);
		}
	}

	// Add the new name to the database.
	let db = new sqlite3.Database(DatabaseName);
	if (db != null) {

		var statement = db.prepare("INSERT INTO game_log (plr_red, plr_yellow, plr_green, plr_blue, first_player, winners, time_started, time_ended) VALUES (?, ?, ?, ?, ?, ?, ?, ?);");

		statement.run(plrRed, plrYellow, plrGreen, plrBlue, game.starter, winnerFlags, game.startTime, game.endTime, function(err) {
			
			if (err) {
				console.error("Could not save game stats: " + err);
			}
		});

		statement.finalize();

		db.close();
	}

	// Update the stats cache.
	updateStats(game, winnerFlags);

	// Return the log index of the game that was just inserted.
	return logIndex;
};

function updateStats(game, winnerFlags)
{
	// Increase the number of total games played.
	stats.totalGames++;

	// Increase the number of wins per colour.
	for (var i = 0, c = game.winners.length; i < c; i++) {

		if (game.winners[i] == COLOUR_RED) stats.winsRed++;
		else if (game.winners[i] == COLOUR_YELLOW) stats.winsYellow++;
		else if (game.winners[i] == COLOUR_GREEN) stats.winsGreen++;
		else if (game.winners[i] == COLOUR_BLUE) stats.winsBlue++;
	}

	// Increase the number of games and wins for players.
	for (var i = 0, c = game.players.length; i < c; i++) {

		if (game.players[i]) {

			// Find the player's data container.
			var id = getNameIndex(game.players[i]);
			var player = stats.players.find((x) => { return x.id == id; });

			if (player != null) {
				player.totalGames++;

				if (i == COLOUR_RED && winnerFlags & 1) player.wins++;
				else if (i == COLOUR_YELLOW && winnerFlags & 2) player.wins++;
				else if (i == COLOUR_GREEN && winnerFlags & 4) player.wins++;
				else if (i == COLOUR_BLUE && winnerFlags & 8) player.wins++;
			}
		}
	}
}

function cacheStats()
{
	let db = new sqlite3.Database(DatabaseName);
	if (db == null) {
		return;
	}

	stats = {};

	// Get number of games overall with wins per colour.
	db.get(
		`SELECT
			SUM(CASE WHEN winners & 1 THEN 1 ELSE 0 END),
			SUM(CASE WHEN winners & 2 THEN 1 ELSE 0 END),
			SUM(CASE WHEN winners & 4 THEN 1 ELSE 0 END),
			SUM(CASE WHEN winners & 8 THEN 1 ELSE 0 END),
			COUNT(*)
			FROM game_log;`,
		(err, row) => {

			if (row) {
				stats.totalGames = getAtIndex(row, 4);
				stats.winsRed = getAtIndex(row, 0);
				stats.winsYellow = getAtIndex(row, 1);
				stats.winsGreen = getAtIndex(row, 2);
				stats.winsBlue = getAtIndex(row, 3);
			}
		}
	);

	// Get a list of player names with their name indices.
	db.all(
		`SELECT * FROM names;`,
		(err, rows) => {

			if (rows) {
				stats.players = rows;

				// Now get per-player stats.
				cachePlayerStats(db);
			}
		}
	);

	db.close();
}

function cachePlayerStats(db)
{
	// Count the number of games and wins for each player name.
	for (var i = 0, c = stats.players.length; i < c; i++) {

		var player = stats.players[i];
		var id = player.id;

		db.get(
			`SELECT ?, COUNT(*) FROM game_log WHERE plr_red = ? OR plr_yellow = ? OR plr_green = ? OR plr_blue = ?;`,
			id, id, id, id, id,
			(err, row) => {

				if (row) {
					var id = getAtIndex(row, 0);
					var player = stats.players.find((x) => { return x.id == id; });

					if (player != null) {
						player.totalGames = getAtIndex(row, 1);
					}
				}
			}
		);

		// Get the number of wins for each player.
		db.get(
			`SELECT ?, COUNT(*) FROM game_log WHERE
				(plr_red = ? AND winners & 1) OR
				(plr_yellow = ? AND winners & 2) OR
				(plr_green = ? AND winners & 4) OR
				(plr_blue = ? AND winners & 8);`,
				id, id, id, id, id,

			(err, row) => {

				if (row) {
					var id = getAtIndex(row, 0);
					var player = stats.players.find((x) => { return x.id == id; });

					if (player != null) {
						player.wins = getAtIndex(row, 1);
					}
				}
			}
		);
	}
}

function getAtIndex(obj, idx)
{
	return obj[Object.keys(obj)[idx]];
}
