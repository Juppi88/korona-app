import React from 'react';
import ReactDOM from 'react-dom';
import PlayerSelector from './player-selector.js';
import PlayerList from './player-list.js';
import './index.css';

// --------------------------------------------------------------------------------

const STATE_PLAYERS = 0; // Selecting players
const STATE_ORDER = 1; // Determining the order of players
const STATE_STARTED = 2; // Game has started

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
			};
		}

		this.randomizeColours(players);

		// Ask the user whether the first player of the game should be randomized.
		if (window.confirm("Arvotaanko pelin aloittaja?")) {
			this.randomizeStarter(players);
		}

		// Store the list of players and determine the order of players.
		this.setState({
			state: STATE_ORDER,
			players: players,
		});
	}

	render()
	{
		switch (this.state.state) {

		case STATE_ORDER: // Render the player list.
		case STATE_STARTED:
			
			const players = this.state.players;

			return (
				<div className="game-container">
					<PlayerList players={players}/>
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
