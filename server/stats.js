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
			previousLogIndex = row[Object.keys(row)[0]];
		}
	});

	db.close();
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
		
		var statement = db.prepare("INSERT INTO names (name) VALUES ('" + name + "');");

		statement.run([], function(err) {

			if (!err) {
				// Update name indices list.
				nameIndices.push({ id: this.lastID, name: name });
			}
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

	return previousLogIndex + 1;
};
