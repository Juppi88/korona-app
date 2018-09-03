const express = require('express');

const app = express();
const port = process.env.PORT || 5000;

app.get('/api/names', (req, res) => {
	res.send({ names: [] });
});

app.listen(port, () => console.log("API server listening on port " + port));
