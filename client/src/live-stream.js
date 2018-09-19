import React from 'react';
import shaka from 'shaka-player';

// --------------------------------------------------------------------------------

const Colours = [
	"#F00", // Red
	"#FF0", // Yellow
	"#0F0", // Green
	"#00F", // Blue
];

// --------------------------------------------------------------------------------

const StreamSource = "http://192.168.99.10:8090/camera.webm";

class LiveStream extends React.Component
{
	componentDidMount()
	{
		shaka.polyfill.installAll();

		if (shaka.Player.isBrowserSupported()) {
			this.initPlayer();
		} else {
			console.error('Browser not supported!');
		}
	}

	initPlayer()
	{
		var player = new shaka.Player(this.refs.video);

		player.addEventListener('error', this.onErrorEvent);

		player.load(StreamSource)
			.then(function() {
				console.log('The video has now been loaded!');
			})
			.catch(this.onError);
	}
	
	onErrorEvent(event)
	{
		this.onError(event.detail);
	}
	
	onError(error)
	{
		console.error('Error code', error.code, 'object', error);
	}

	componentWillUnmount()
	{
	}

	render()
	{
		return (
			<div className="stream-container">
				<h1>Live Stream: WORK IN PROGRESS</h1>
				
				<video
					ref="video"
					width="640"
					controls autoPlay>
				</video>
			</div>
		);
	}
}

export default LiveStream;
