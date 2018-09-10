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
var logs = [];

// --------------------------------------------------------------------------------

module.exports.getStats = function()
{
	return stats;
}

module.exports.getLogs = function()
{
	return logs;
}

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

	// Cache stats and logs to speed up backend requests.
	module.exports.getNames();

	setTimeout(() => {

		// Wait for the names list to be resolved.
		// This is a crappy way to do things, but oh well.
		cacheStats();
		cacheLogs();

	}, 2000);
};

module.exports.getNames = function()
{
	// Return the cached name list.
	if (names && names.length > 0) {
		return names;
	}

	let db = new sqlite3.Database(DatabaseName);
	if (db == null) {
		return names;
	}

	db.all("SELECT id, name FROM names", [],

		(err, rows) => {

			if (rows) {

				// Clear the old list.
				names = [];
				nameIndices = [];

				for (var i = 0, c = rows.length; i < c; i++) {

					if (rows[i].name) {
						names.push(rows[i].name);
						names.sort();

						// Store a tuple containing the name and a matching index from the name table.
						nameIndices.push({ id: rows[i].id, name: rows[i].name });
					}
				}
			}
		}
	);

	db.close();

	return names;
};

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
		});

		statement.finalize();

		db.close();
	}

	return names;
};

// --------------------------------------------------------------------------------

function getName(index)
{
	var nameInfo = nameIndices.find((x) => x.id == index);
	return (nameInfo ? nameInfo.name : "");
}

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

function updateStats(game, winnerFlags)
{
	// Increase the number of total games played and time played.
	var gameDuration = (game.endTime - game.startTime);

	stats.totalGames++;
	stats.totalDuration += gameDuration;

	// Update min and max game durations if necessary.
	if (gameDuration < stats.minDuration) minDuration = gameDuration;
	if (gameDuration > stats.maxDuration) maxDuration = gameDuration;

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

	// Update the game log.
	var log = {};

	log.timeStarted = game.startTime;
	log.timeEnded = game.endTime;
	log.players = Array(4);

	log.players[COLOUR_RED] = { name: game.players[COLOUR_RED], isStarter: (game.starter == COLOUR_RED), isWinner: game.winners.indexOf(COLOUR_RED) != -1 };
	log.players[COLOUR_YELLOW] = { name: game.players[COLOUR_YELLOW], isStarter: (game.starter == COLOUR_YELLOW), isWinner: game.winners.indexOf(COLOUR_YELLOW) != -1 };
	log.players[COLOUR_GREEN] = { name: game.players[COLOUR_GREEN], isStarter: (game.starter == COLOUR_GREEN), isWinner: game.winners.indexOf(COLOUR_GREEN) != -1 };
	log.players[COLOUR_BLUE] = { name: game.players[COLOUR_BLUE], isStarter: (game.starter == COLOUR_BLUE), isWinner: game.winners.indexOf(COLOUR_BLUE) != -1 };

	logs.splice(0, 0, log);

	// Remove old entries from the log so there are only 10 visible.
	while (logs.length > 10) {
		logs.splice(logs.length - 1, 1);
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
			COUNT(*),
			SUM(time_ended - time_started),
			MIN(time_ended - time_started),
			MAX(time_ended - time_started)
			FROM game_log;`,
		(err, row) => {

			if (row) {
				stats.totalGames = getAtIndex(row, 4);
				stats.totalDuration = getAtIndex(row, 5);
				stats.minDuration = getAtIndex(row, 6);
				stats.maxDuration = getAtIndex(row, 7);
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

				for (var i = 0, c = stats.players.length; i < c; i++) {

					stats.players[i].level = 1;
					stats.players[i].xp = 0;
					stats.players[i].xpToNextLevel = expRequiredToLevel(2);
				}

				// Now get per-player stats.
				cachePlayerStats(db);
			}
		}
	);

	db.close();

	setTimeout(() => {

		// TESTING
		simulateGames();

	}, 2000);
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

					if (player) {
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

					if (player) {
						player.wins = getAtIndex(row, 1);
					}
				}
			}
		);
	}
}

function cacheLogs()
{
	let db = new sqlite3.Database(DatabaseName);
	if (db == null) {
		return;
	}

	logs = [];

	db.all(`SELECT * FROM game_log ORDER BY id DESC LIMIT 10;`, [],

			(err, rows) => {

			if (rows) {

				for (var i = 0, c = rows.length; i < c; i++) {

					var game = {};

					game.timeStarted = rows[i].time_started;
					game.timeEnded = rows[i].time_ended;
					game.players = Array(4);

					game.players[COLOUR_RED] = { name: getName(rows[i].plr_red), isStarter: (rows[i].first_player == COLOUR_RED), isWinner: (rows[i].winners & 1) != 0 };
					game.players[COLOUR_YELLOW] = { name: getName(rows[i].plr_yellow), isStarter: (rows[i].first_player == COLOUR_YELLOW), isWinner: (rows[i].winners & 2) != 0 };
					game.players[COLOUR_GREEN] = { name: getName(rows[i].plr_green), isStarter: (rows[i].first_player == COLOUR_GREEN), isWinner: (rows[i].winners & 4) != 0 };
					game.players[COLOUR_BLUE] = { name: getName(rows[i].plr_blue), isStarter: (rows[i].first_player == COLOUR_BLUE), isWinner: (rows[i].winners & 8) != 0 };

					logs.push(game);
				}
			}
		}
	);
}

function getAtIndex(obj, idx)
{
	return obj[Object.keys(obj)[idx]];
}

function expRequiredToLevel(level)
{
	return (Math.pow(level, 2) + level) / 2;
}

function simulateGame(players)
{
	for (var i = 0, c = players.length; i < c; i++) {

		if (players[i].name && players[i].statsIndex >= 0 && players[i].isWinner) {

			const player = stats.players[players[i].statsIndex];

			// Player is a winner, reward them with some xp.
			var xp = 0;

			for (var j = 0; j < c; j++) {
				if (i == j) continue; // Skip the player themself
				if (players[j].statsIndex >= 0) {
					xp += player.level;
				}
			}

			player.xp += xp;
			//console.log(player.xp + "," + stats.players[players[i].statsIndex].xp);

			for (var lvl = player.level + 1;;) {

				if (player.xp >= player.xpToNextLevel) {

					player.level++;
					player.xp -= player.xpToNextLevel;
					player.xpToNextLevel = expRequiredToLevel(player.level);
					
					console.log(player.name + " leveled to " + player.level);
				}
				else {
					break;
				}
			}
		}
	}
}

function simulateGames()
{
	let db = new sqlite3.Database(DatabaseName);
	if (db == null) {
		return names;
	}

	db.all(`SELECT * FROM game_log ORDER BY id ASC;`, [],

		(err, rows) => {

			if (!rows) {
				return;
			}

			for (var i = 0, c = rows.length; i < c; i++) {
				
				// Generate a list of players in the game.
				var players = Array(4);

				players[COLOUR_RED] = {
					name: getName(rows[i].plr_red),
					isStarter: (rows[i].first_player == COLOUR_RED),
					isWinner: (rows[i].winners & 1) != 0,
					statsIndex: stats.players.findIndex((x) => { return x.id == rows[i].plr_red; })
				};

				players[COLOUR_YELLOW] = {
					name: getName(rows[i].plr_yellow),
					isStarter: (rows[i].first_player == COLOUR_YELLOW),
					isWinner: (rows[i].winners & 2) != 0,
					statsIndex: stats.players.findIndex((x) => { return x.id == rows[i].plr_yellow; })
				};

				players[COLOUR_GREEN] = {
					name: getName(rows[i].plr_green),
					isStarter: (rows[i].first_player == COLOUR_GREEN),
					isWinner: (rows[i].winners & 4) != 0,
					statsIndex: stats.players.findIndex((x) => { return x.id == rows[i].plr_green; })
				};

				players[COLOUR_BLUE] = {
					name: getName(rows[i].plr_blue),
					isStarter: (rows[i].first_player == COLOUR_BLUE),
					isWinner: (rows[i].winners & 8) != 0,
					statsIndex: stats.players.findIndex((x) => { return x.id == rows[i].plr_blue; })
				};

				// Simulate the game with these players.
				simulateGame(players);
			}

			for (var j = 0, c2 = stats.players.length; j < c2; j++) {
				console.log(stats.players[j].name + ", XP: " + stats.players[j].xp + ", Level: " + stats.players[j].level);
			}
		}
	);
}
