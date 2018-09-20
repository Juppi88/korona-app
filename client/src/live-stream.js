import React from 'react';

// --------------------------------------------------------------------------------

const Colours = [
	"#F00", // Red
	"#BB0", // Yellow
	"#0C0", // Green
	"#00F", // Blue
];

// --------------------------------------------------------------------------------

const StreamSource = "http://192.168.99.10/stream";

var dataTimer = 0; // Timeout ID for fetching game data regularly

class LiveStream extends React.Component
{
	constructor(props)
	{
		super(props);

		this.state = {
			isLive: false,
			players: []
		};

		// Start data fetch timer.
		this.fetchGameInfo();
	}

	componentWillUnmount()
	{
		// Stop regular data updates.
		if (dataTimer > 0) {

			clearTimeout(dataTimer);
			dataTimer = 0;
		}
	}

	fetchGameInfo()
	{
		var instance = this;

		// Get info about the currently running game.
		fetch('/api/live')

			.then(function(response) {
				return response.json();
			})

			.then(function(json) {

				// Run update again in a moment.
				dataTimer = setTimeout(() => instance.fetchGameInfo(), 5000);

				// Update game info and refresh the page.
				instance.setState({
					isLive: json.isLive,
					players: json.players
				});
			})

			.catch(function(ex) {
			}
		);
	}

	render()
	{
		if (this.state.isLive) {

			const players = this.state.players;
			var playerList = [];

			for (var i = 0, c = players.length; i < c; i++) {

				const player = players[i];

				playerList.push((
					<span key={i}>
						<span>{i > 0 ? ", " : ""}</span>
						<span style={{color: Colours[player.colour], fontStyle: player.isStarter ? "italic" : "normal"}}>
							{player.name}
						</span>
					</span>
				));
			}

			// A game is currently running, show the live stream.
			return (
				<div className="stream-container">
					<h1>KoronaLive</h1>
					
					<div className="video-container">
						<video
							src={StreamSource}
							crossOrigin="anonymous"
							controls
							autoPlay>
						</video>
					</div>
					<div className="stream-players">
						Pelaajat: {playerList}
					</div>
				</div>
			);

		}
		else {

			// No one is currently playing.
			return (
				<div className="stream-container">
					<h1>Peli on päättynyt</h1>
				</div>
			);

		}
	}
}

export default LiveStream;
