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
		// Ensure the winner(s) have been selected.
		const players = this.state.players;
		var winnersSelected = false;

		for (var i = 0, c = players.length; i < c; i++) {
			if (players[i].isWinner) {
				winnersSelected = true;
				break;
			}
		}

		// Ask the user whether they really meant to start a new game if winners for the previous game have not been selected yet.
		if (!winnersSelected && !window.confirm("Voittajia ei ole vielä valittu. Haluatko varmasti aloittaa uuden pelin?")) {
			return;
		}

		// Call the game finished method of the Game class.
		this.props.onFinished(players);
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
		var isWinnerMarked = false;

		for (var i = 0; i < this.state.players.length; i++) {

			// Remember that a winner (or winners) has been chosen.
			if (this.state.players[i].isWinner) {
				isWinnerMarked = true;
			}

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
					<button onClick={() => this.startNewGame()} className="start-button">{isWinnerMarked ? "Tallenna & Uusi Peli" : "Uusi Peli"}</button>
				</div>
			</div>
		);
	}
}

export default PlayerList;
