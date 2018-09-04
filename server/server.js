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

// Create an SQLite database for stats and other information.
stats.setupDatabase();

// Cache the list of names.
stats.getNames();

app.listen(port, () => console.log("API server listening on port " + port));



