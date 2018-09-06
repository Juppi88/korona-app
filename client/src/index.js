import React from 'react';
import ReactDOM from 'react-dom';
import PlayerSelector from './player-selector.js';
import PlayerList from './player-list.js';
import StatsScreen from './stats-screen.js';
import './index.css';

// --------------------------------------------------------------------------------

const STATE_PLAYERS = 0; // Selecting players
const STATE_GAME = 1; // Game started, displaying the player list
const STATE_STATS = 2; // Viewing stats

const COLOUR_NONE = -1;
const COLOUR_RED = 0;
const COLOUR_YELLOW = 1;
const COLOUR_GREEN = 2;
const COLOUR_BLUE = 3;

// --------------------------------------------------------------------------------

class Game extends React.Component
{
	constructor(props)
	{
		super(props);

		// Set a title for the page.
		document.title = props.title;

		this.state = {
			state: STATE_PLAYERS,
			players: null,
			gameStarted: 0,
		};
	}

	shuffleArray(array)
	{
		var currentIndex = array.length, temporaryValue, randomIndex;

		while (currentIndex !== 0) {

			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex -= 1;

			temporaryValue = array[currentIndex];
			array[currentIndex] = array[randomIndex];
			array[randomIndex] = temporaryValue;
		}

		return array;
	}

	randomizeColours(players)
	{
		// Shuffle the colours.
		const colours = [ COLOUR_RED, COLOUR_YELLOW, COLOUR_GREEN, COLOUR_BLUE ];
		this.shuffleArray(colours);

		// Assign each player a colour.
		for (var i = 0, c = players.length; i < c; i++) {
			players[i].colour = colours[i];
		}
	}

	randomizeStarter(players)
	{
		// Pick a random player from the list and flag them as the starter.
		var randomIndex = Math.floor(Math.random() * players.length);
		players[randomIndex].isStarter = true;

		// Sort the array alphabetically, but put the starter first.
		players.sort(
			function(a, b) {
				if (a.isStarter) return -1;
				if (b.isStarter) return 1;
				if (a.name < b.name) return -1;
				if (a.name > b.name) return 1;
				return 0;
			}
		);
	}

	onGameStarted(names)
	{
		// Fill in and store player info.
		const players = Array(names.length);

		for (var i = 0, c = names.length; i < c; i++) {
			players[i] = {
				index: i,
				name: names[i],
				colour: COLOUR_NONE,
				isStarter: false,
				isWinner: false,
			};
		}

		// Randomize colours for each player.
		this.randomizeColours(players);

		// Ask the user whether the first player of the game should be randomized.
		if (window.confirm("Arvotaanko pelin aloittaja?")) {
			this.randomizeStarter(players);
		}

		// Save the list of players in the game and time for the game start.
		var timestamp = Math.floor(new Date() / 1000);

		this.setState({
			state: STATE_GAME,
			players: players,
			gameStarted: timestamp
		});
	}

	onShowStats()
	{
		this.setState({
			state: STATE_STATS,
		});
	}

	onShowPlayerSelector()
	{
		this.setState({
			state: STATE_PLAYERS,
		});
	}

	onGameFinished(players)
	{
		// Compile a list of winners for the game.
		var winners = [];

		for (var i = 0, c = players.length; i < c; i++) {

			if (players[i].isWinner && players[i].colour !== COLOUR_NONE) {
				winners.push(players[i].colour);
			}
		}

		// Save game info into the log when the winners have been selected.
		if (winners.length > 0) {
			this.saveGameResultsToLog(players, winners);
		}

		// Reset the state and go back to player selection.
		this.setState({
			state: STATE_PLAYERS,
			players: []
		});
	}

	saveGameResultsToLog(playerInfo, winners)
	{
		var timestamp = Math.floor(new Date() / 1000);

		// Copy the players to colour-sorted array.
		var players = Array(4);
		var starter = -1;

		for (var i = 0, c = playerInfo.length; i < c; i++) {

			const player = playerInfo[i];

			// Copy the name of the player to the colour sorted array.
			if (player.colour >= 0 && player.colour < players.length) {

				players[player.colour] = player.name;

				// Store the colour of the first player.
				if (player.isStarter) {
					starter = player.colour;
				}
			}
		}

		// Save the game info to the log using the PUT method for games.
		fetch('/api/game', {
				method: "PUT",
				body: JSON.stringify({
					players: players,
					starter: starter,
					startTime: this.state.gameStarted,
					endTime: timestamp,
					winners: winners
				}),
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				}
			}
		);
	}

	render()
	{
		switch (this.state.state) {

		case STATE_GAME: // Render the player list.
			
			const players = this.state.players;

			return (
				<div className="game-container">
					<PlayerList players={players} onFinished={ this.onGameFinished.bind(this) }/>
				</div>
			);

		case STATE_STATS: // Render the stats screen
			
			return (
				<div className="game-container">
					<StatsScreen onGoBack={ this.onShowPlayerSelector.bind(this) }/>
				</div>
			);

		default: // Render the player selector.
			return (
				<div className="game-container">
					<PlayerSelector onReady={ this.onGameStarted.bind(this) } onShowStats={ this.onShowStats.bind(this) }/>
				</div>
			);
		}
	}
}

// --------------------------------------------------------------------------------

ReactDOM.render(
	<Game title="Korona"/>,
	document.getElementById('root')
);
