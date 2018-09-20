import React from 'react';

// --------------------------------------------------------------------------------

const Colours = [
	"#F00", // Red
	"#FF0", // Yellow
	"#0F0", // Green
	"#00F", // Blue
];

// --------------------------------------------------------------------------------

const StreamSource = "http://192.168.99.10/stream";

class LiveStream extends React.Component
{
	constructor(props)
	{
		super(props);

		this.state = {
			isLive: false,
			players: []
		};

		this.fetchGameInfo();
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
				instance.setState({ isLive: json.isLive, players: json.players })
			})
			.catch(function(ex) {
			}
		);
	}

	render()
	{
		if (this.state.isLive) {

			// A game is currently running, show the live stream.
			return (
				<div className="stream-container">
					<h1>Live Stream</h1>
					
					<video
						src={StreamSource}
						crossOrigin="anonymous"
						controls
						autoPlay>
					</video>
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
