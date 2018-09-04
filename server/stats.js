'use strict';

const sqlite3 = require('sqlite3').verbose();
const DatabaseName = "stats.db";

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

	statement = db.prepare("CREATE TABLE IF NOT EXISTS game_log (id INTEGER PRIMARY KEY AUTOINCREMENT, plr_red INTEGER, plr_yellow INTEGER, plr_green INTEGER, plr_blue INTEGER, starter INTEGER, winner INTEGER, time_started INTEGER, time_ended INTEGER);");

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

	var timestamp = Math.floor(new Date() / 1000);

	// Add the new name to the database.
	let db = new sqlite3.Database(DatabaseName);
	if (db != null) {

		var statement = db.prepare("INSERT INTO game_log (plr_red, plr_yellow, plr_green, plr_blue, starter, time_started) VALUES (?, ?, ?, ?, ?, ?);");

		statement.run(plrRed, plrYellow, plrGreen, plrBlue, game.starter, timestamp, function(err) {
			
			if (!err) {
				previousLogIndex = this.lastID;
			}
		});

		statement.finalize();

		db.close();
	}

	return previousLogIndex + 1;
};