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
		// Compile a list of winners.
		const players = this.state.players;
		var winners = [];

		for (var i = 0, c = players.length; i < c; i++) {
			if (players[i].isWinner && players[i].colour >= 0) {
				winners.push(players[i].colour);
			}
		}

		// Call the game finished method of the Game class.
		this.props.onFinished(winners);
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

	renderStar()
	{
		return (
			<svg height="25" width="25">
				<polygon points="12.5,0 15,10 25,10 17.5,15 20,25 12.5,20 5,25 7.5,15 0,10 10,10" fill="yellow" stroke="orange" strokeWidth="2" fillRule="nonzero"/>
			</svg>
		);
	}

	renderPlayer(index)
	{
		const player = this.state.players[index];

		return (
			<div className="player" onClick={() => this.setPlayerWinner(index)}>

				{this.renderDisc(50, Colours[player.colour])}
				<span className={player.isWinner ? "winner" : "loser"}>
					{player.name}
					{player.isStarter && !player.isWinner ? " (Aloittaja)" : ""}
					{player.isWinner ? this.renderStar() : ""}
				</span>

			</div>
		);
	}

	setPlayerWinner(index)
	{
		const players = this.state.players;

		if (index < 0 || index >= players.length) {
			return;
		}
		
		// Toggle the winner flag.
		players[index].isWinner = !players[index].isWinner;

		// Update the state of the player list.
		this.setState({ players: players });
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
