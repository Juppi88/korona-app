'use strict';

const sqlite3 = require('sqlite3').verbose();
const DatabaseName = "stats.db";

var names;

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

	let db = new sqlite3.Database(DatabaseName);
	if (db == null) {
		return names;
	}

	db.each("SELECT id, name FROM names",
		(err, row) => {
			names.push(row.name);
		}
	);

	db.close();

	return names;
};

