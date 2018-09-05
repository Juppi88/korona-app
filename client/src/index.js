import React from 'react';
import ReactDOM from 'react-dom';
import PlayerSelector from './player-selector.js';
import PlayerList from './player-list.js';
import './index.css';

// --------------------------------------------------------------------------------

const STATE_PLAYERS = 0; // Selecting players
const STATE_GAME = 1; // Game started, displaying the player list

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
			gameIndex: 0
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

	onPlayerListReady(names)
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

		this.randomizeColours(players);

		// Ask the user whether the first player of the game should be randomized.
		if (window.confirm("Arvotaanko pelin aloittaja?")) {
			this.randomizeStarter(players);
		}

		// Store the list of players and determine the order of players.
		this.setState({
			state: STATE_GAME,
			players: players,
		});

		this.saveGameInfoToLog(players);
	}

	onGameFinished(winners)
	{
		this.saveGameResultsToLog(winners);

		this.setState({
			state: STATE_PLAYERS,
			players: []
		});
	}

	saveGameInfoToLog(playerInfo)
	{
		var instance = this;

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
					starter: starter
				}),
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				}
			})
			.then(function(response) {
				return response.json();
			})
			.then(function(json) {
				// The backend responds with the log index of the started game.
				// The index is used to store additional info about the game, such as the winner.
				instance.setState({ gameIndex: json.gameIndex });
			})
			.catch(function(ex) {
				console.log(ex)
			}
		);
	}

	saveGameResultsToLog(winners)
	{
		// Save the game info to the log using the PUT method for games.
		fetch('/api/game', {
				method: "POST",
				body: JSON.stringify({
					gameIndex: this.state.gameIndex,
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

		default: // Render the player selector.
			return (
				<div className="game-container">
					<PlayerSelector onReady={ this.onPlayerListReady.bind(this) }/>
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
