import React from 'react';

// --------------------------------------------------------------------------------

const Colours = [
	"#F00", // Red
	"#FF0", // Yellow
	"#0F0", // Green
	"#00F", // Blue
];

// --------------------------------------------------------------------------------

class PlayerList extends React.Component
{
	constructor(props)
	{
		super(props);

		this.state = {
			players: props.players,
		};
	}

	startNewGame()
	{
		// Call the game finished method of the Game class.
		this.props.onFinished();
	}

	renderDisc(size, colour)
	{
		var strokeWidth = 1;
		var center = size / 2;
		var radius = size / 2 - strokeWidth;
		var radiusSmall = 0.2 * radius;

		return (
			<svg width={size} height={size}>
  				<circle cx={center} cy={center} r={radius} stroke="#000" strokeWidth={strokeWidth} fill={colour} />
  				<circle cx={center} cy={center} r={radiusSmall} stroke="#000" strokeWidth={strokeWidth} fill="white" />
			</svg>
		);
	}

	renderPlayer(index)
	{
		const player = this.state.players[index];

		return (
			<div className="player">
				{this.renderDisc(50, Colours[player.colour])}
				<span>{player.name} {player.isStarter ? "(Aloittaja)" : ""}</span>
			</div>
		);
	}

	render()
	{
		// Compile a list of players in the game.
		var playerList = [];

		for (var i = 0; i < this.state.players.length; i++) {
			playerList.push( (
				<li key={i}>
					{this.renderPlayer(i)}
				</li>
			));
		}

		return (
			<div className="player-list-container">
				<div className="player-list">
					<h1>Pelaajat</h1>
					<ul>{playerList}</ul>
				</div>
				<div className="bottom-menu">
					<button onClick={() => this.startNewGame()} className="start-button">Uusi peli</button>
				</div>
			</div>
		);
	}
}

export default PlayerList;
