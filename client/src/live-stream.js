import React from 'react';

// --------------------------------------------------------------------------------

const Colours = [
	"#F00", // Red
	"#BB0", // Yellow
	"#0C0", // Green
	"#00F", // Blue
];

// --------------------------------------------------------------------------------

//const StreamSource = "http://192.168.99.10/stream";
const StreamSource = "http://192.168.99.10/testvideo";

var dataTimer = 0; // Timeout ID for fetching game data regularly

class LiveStream extends React.Component
{
	constructor(props)
	{
		super(props);
		
		/*
		// Start rendering the video when the page has loaded.
		var instance = this;

		document.addEventListener('DOMContentLoaded', function()
		{
			var video = document.getElementById('stream-video');
			var canvas = document.getElementById('stream-canvas');
			var context = canvas.getContext('2d');

			var canvasWidth = Math.floor(canvas.clientWidth);
			var canvasHeight = Math.floor(canvas.clientHeight);
			canvas.width = canvasWidth;
			canvas.height = canvasHeight;

			video.addEventListener('play', function() {
				console.log("Play");
				instance.drawVideo(this, context, canvasWidth, canvasHeight);
			}, false);

		}, false);
		*/

		// Create a state for the stream page.
		this.state = {
			isLive: false,
			players: []
		};

		// Start data fetch timer.
		this.fetchGameInfo();
	}

	drawVideo(video, context, width, height)
	{
		if (video.paused || video.ended) {

			// Stop processing when the stream has ended.
			return false;
		}

		// Draw the video to the background.
		context.drawImage(video, 0, 0, width, height);

		//context.fillColor = "#F00";
		//context.fillText("Big smile!", 10, 90);

		// Re-draw regularly.
		setTimeout(() => this.drawVideo(video, context, width, height), 20);
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
			// <canvas className="stream-canvas" id="stream-canvas"></canvas>

			return (
				<div className="stream-container">
					<h1>KoronaLive</h1>
					
					<div className="video-container">
						<video id="stream-video"
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
