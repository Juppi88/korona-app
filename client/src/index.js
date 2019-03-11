import React from 'react';
import ReactDOM from 'react-dom';
import PlayerSelector from './player-selector.js';
import PlayerList from './game-screen.js';
import StatsScreen from './stats-screen.js';
import PlayerStatsScreen from './player-screen.js';
import ResultScreen from './result-screen.js';
import LogScreen from './log-screen.js';
import LiveStream from './live-stream.js';
import PieChart from '@material-ui/icons/PieChart';
import Person from '@material-ui/icons/Person';
import Videocam from '@material-ui/icons/Videocam';
import FormatListBulleted from '@material-ui/icons/FormatListBulleted';
import KeyboardBackspace from '@material-ui/icons/KeyboardBackspace';
import './index.css';

// --------------------------------------------------------------------------------

const STATE_PLAYERS = 0; // Selecting players
const STATE_GAME = 1; // Game started, displaying the player list
const STATE_RESULTS = 2; // Viewing game results

const VIEW_DEFAULT = 0; // Default screen, no stats
const VIEW_STATS = 1; // Generic game stats (top players, wins etc.)
const VIEW_LOGS = 2; // Game log (10 most recent games)
const VIEW_PLAYER = 3; // Per-player stats
const VIEW_STREAM = 4; // Game live stream
const VIEW_CHANGELOG = 5; // Display a feature changelog

const COLOUR_NONE = -1;
const COLOUR_RED = 0;
const COLOUR_YELLOW = 1;
const COLOUR_GREEN = 2;
const COLOUR_BLUE = 3;


const POS_TOP = 0;
const POS_RIGHT = 1;
const POS_LEFT = 2;
const POS_BOTTOM = 3;

//    R
//   ___
// Y |_| B
//    G

const Positions = [
	POS_TOP, // Red
	POS_LEFT, // Yellow
	POS_BOTTOM, // Green
	POS_RIGHT, // Blue
];

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
			view: VIEW_DEFAULT,
			results: [],
			previousGame: 0,
			previousPlayers: [],
			changelog: '',
		};

		this.fetchChangelog();
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

	getOppositeColour(colour)
	{
		var position = Positions[colour];
		var opposite = POS_TOP;

		// Get the opposite position.
		switch (position) {
			case POS_TOP: opposite = POS_BOTTOM; break;
			case POS_BOTTOM: opposite = POS_TOP; break;
			case POS_LEFT: opposite = POS_RIGHT; break;
			default: opposite = POS_LEFT; break;
		}

		// Find the colour occupying the opposite position.
		for (var i = 0; i < 4; i++) {

			if (Positions[i] === opposite) {
				return i;
			}
		}

		console.error("Could not find opposite colour!");
		return 0;
	}

	randomizeColours(players)
	{
		// Shuffle the colours.
		const colours = [ COLOUR_RED, COLOUR_YELLOW, COLOUR_GREEN, COLOUR_BLUE ];
		this.shuffleArray(colours);

		if (players.length === 2) {

			// Ensure the players are opposite to each other in a two-player game.
			players[0].colour = colours[0];
			players[1].colour = this.getOppositeColour(colours[0]);
		}
		else {

			// Assign each player a random colour.
			for (var i = 0, c = players.length; i < c; i++) {
				players[i].colour = colours[i];
			}
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

	randomizePlayers(names)
	{
		const previous = this.state.previousPlayers;
		var winners = [], others = [];
		var i, c;
		
		// Filter players who played in the previous game.
		for (i = 0; i < previous.length; i++) {
			
			const player = previous[i];
			if (player.isWinner) {
				winners.push(player.name);
			}
			else {
				others.push(player.name);
			}
		}

		// Randomize the order of the players.
		this.shuffleArray(names);

		var selected = [];
		
		// Prefer players who weren't in the last game.
		for (i = 0, c = names.length; i < c; i++) {

			if (winners.indexOf(names[i]) < 0 &&
				others.indexOf(names[i]) < 0) {

				selected.push(names[i]);
			}
		}

		// Then select players who won in the previous game.
		for (i = 0, c = names.length; i < c; i++) {

			if (winners.indexOf(names[i]) >= 0) {
				selected.push(names[i]);
			}
		}

		// Finally add players who were in the last game but didn't win.
		for (i = 0, c = names.length; i < c; i++) {

			if (others.indexOf(names[i]) >= 0) {
				selected.push(names[i]);
			}
		}

		// Remove excessive players.
		names = selected.slice(0, 4);

		return names;
	}

	onGameStarted(names)
	{
		// Randomize which players are playing if more than 4 are selected.
		if (names.length > 4) {
			names = this.randomizePlayers(names);
		}

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

		// Always randomize the starter of the game.
		this.randomizeStarter(players);

		// Ask the user whether the first player of the game should be randomized.
		//if (window.confirm("Arvotaanko pelin aloittaja?")) {
		//	this.randomizeStarter(players);
		//}

		// Save the list of players in the game and time for the game start.
		var timestamp = Math.floor(new Date() / 1000);

		// Send game information to the live stream system.
		var liveGame = {
			players: players,
			gameStarted: timestamp
		};

		fetch('/api/live', {
				method: "PUT",
				body: JSON.stringify(liveGame),
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				}
			}
		);

		// Update the page.
		this.setState({
			state: STATE_GAME,
			players: players,
			gameStarted: timestamp
		});
	}

	onResultsViewed()
	{
		this.setState({
			state: STATE_PLAYERS
		});
	}

	onGameFinished(players, highlights)
	{
		// Compile a list of winners for the game.
		var winners = [];

		for (var i = 0, c = players.length; i < c; i++) {

			if (players[i].isWinner && players[i].colour !== COLOUR_NONE) {
				winners.push(players[i].colour);
			}
		}

		// Inform the live stream system that the game has ended.
		fetch('/api/live', {
				method: "DELETE",
				body: JSON.stringify({}),
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				}
			}
		);

		// Save game info into the log when the winners have been selected.
		if (winners.length > 0) {

			this.saveGameResultsToLog(players, winners, highlights);

			// Save a list of players and winners, which can be used to randomize
			// the players of the next game when more than 4 players want to play.
			var timestamp = Math.floor(new Date() / 1000);

			this.setState({
				players: [],
				previousGame: timestamp,
				previousPlayers: players,
			});
		}
		else {
			this.setState({
				players: [],
				state: STATE_PLAYERS,
			});
		}
	}

	saveGameResultsToLog(playerInfo, winners, highlights)
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
		var instance = this;

		fetch('/api/game', {
				method: "PUT",
				body: JSON.stringify({
					players: players,
					starter: starter,
					startTime: this.state.gameStarted,
					endTime: timestamp,
					winners: winners,
					highlights: highlights
				}),
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				}
			}
		)
		.then(function(response) {
			return response.json();
		})
		.then(function(json) {

			// Display the results screen.
			instance.setState({
				state: STATE_RESULTS,
				results: json.results,
			});
		});
	}

	renderFullMode()
	{
		if (this.state.view === VIEW_STATS)
		{
			// Render the stats screen
			return (
				<div className="game-container">
					<StatsScreen/>
					<KeyboardBackspace onClick={() => this.setState({view: VIEW_DEFAULT})} className="stats-icon first"/>
				</div>
			);
		}
		else if (this.state.view === VIEW_LOGS)
		{
			// Render the log screen.
			return (
				<div className="game-container">
					<LogScreen/>
					<KeyboardBackspace onClick={() => this.setState({view: VIEW_DEFAULT})} className="stats-icon first"/>
				</div>
			);
		}
		else if (this.state.view === VIEW_PLAYER)
		{
			// Render the per-player stats screen.
			return (
				<div className="game-container">
					<PlayerStatsScreen/>
					<KeyboardBackspace onClick={() => this.setState({view: VIEW_DEFAULT})} className="stats-icon first"/>
				</div>
			);
		}
		else if (this.state.view === VIEW_CHANGELOG)
		{
			// Render the changelog.
			return (
				<div className="game-container">
					{this.renderChangeLog()}
					<KeyboardBackspace onClick={() => this.setState({view: VIEW_DEFAULT})} className="stats-icon first"/>
				</div>
			);
		}
		else if (this.state.state === STATE_GAME)
		{
			// Render the player list when the game is on.
			const players = this.state.players;

			return (
				<div className="game-container">
					<PlayerList players={players} gameStarted={this.state.gameStarted} onFinished={ this.onGameFinished.bind(this) }/>

					<PieChart onClick={() => this.setState({view: VIEW_STATS})} className="stats-icon first"/>
					<FormatListBulleted onClick={() => this.setState({view: VIEW_LOGS})} className="stats-icon second"/>
					<Person onClick={() => this.setState({view: VIEW_PLAYER})} className="stats-icon third"/>
				</div>
			);
		}
		else if (this.state.state === STATE_RESULTS)
		{
			return (
				<div className="game-container">
					<ResultScreen results={this.state.results} onExit={ this.onResultsViewed.bind(this) }/>
				</div>
			);
		}
		else
		{
			// // Render the player selector.
			return (
				<div className="game-container">

					<PlayerSelector onReady={ this.onGameStarted.bind(this) }/>

					<PieChart onClick={() => this.setState({view: VIEW_STATS})} className="stats-icon first"/>
					<FormatListBulleted onClick={() => this.setState({view: VIEW_LOGS})} className="stats-icon second"/>
					<Person onClick={() => this.setState({view: VIEW_PLAYER})} className="stats-icon third"/>
					<a onClick={() => this.setState({view: VIEW_CHANGELOG})} className="changelog-link">Changelog</a>

				</div>
			);
		}
	}

	renderReadOnlyMode()
	{
		if (this.state.view === VIEW_STATS)
		{
			// Render the stats screen
			return (
				<div className="game-container">

					<StatsScreen/>

					<Videocam onClick={() => this.setState({view: VIEW_STREAM})} className="stats-icon first"/>
					<FormatListBulleted onClick={() => this.setState({view: VIEW_LOGS})} className="stats-icon second"/>
					<Person onClick={() => this.setState({view: VIEW_PLAYER})} className="stats-icon third"/>

				</div>
			);
		}
		else if (this.state.view === VIEW_LOGS)
		{
			// Render the log screen.
			return (
				<div className="game-container">

					<LogScreen/>

					<Videocam onClick={() => this.setState({view: VIEW_STREAM})} className="stats-icon first"/>
					<PieChart onClick={() => this.setState({view: VIEW_STATS})} className="stats-icon second"/>
					<Person onClick={() => this.setState({view: VIEW_PLAYER})} className="stats-icon third"/>

				</div>
			);
		}
		else if (this.state.view === VIEW_PLAYER)
		{
			// Render the per-player stats screen.
			return (
				<div className="game-container">

					<PlayerStatsScreen/>

					<Videocam onClick={() => this.setState({view: VIEW_STREAM})} className="stats-icon first"/>
					<PieChart onClick={() => this.setState({view: VIEW_STATS})} className="stats-icon second"/>
					<FormatListBulleted onClick={() => this.setState({view: VIEW_LOGS})} className="stats-icon third"/>
				</div>
			);
		}
		else 
		{
			return (
				<div className="game-container">

					<LiveStream/>

					<PieChart onClick={() => this.setState({view: VIEW_STATS})} className="stats-icon first"/>
					<FormatListBulleted onClick={() => this.setState({view: VIEW_LOGS})} className="stats-icon second"/>
					<Person onClick={() => this.setState({view: VIEW_PLAYER})} className="stats-icon third"/>

				</div>
			);
		}
	}

	renderChangeLog()
	{
		return (
			<div>
				<h1>Changelog</h1>
				<div className="changelog">
					<code>
						{this.state.changelog}
					</code>
				</div>
			</div>
		);
	}

	fetchChangelog()
	{
		var instance = this;

		fetch('/api/changelog')
			.then(function(response) {
				return response.json();
			})
			.then(function(json) {
				instance.setState({ changelog: json.changelog });
			})
			.catch(function(ex) {
			}
		);
	}

	render()
	{
		var isLocalHost = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

		if (isLocalHost) {

			// Render the full-featured page on the Raspberry Pi (stats and game input).
			return (
				<div className="container">
					{this.renderFullMode()}
				</div>
			);
		}
		else {

			// Guest is visiting the page from elsewhere in the network, show a read-only version of the page with stats only.
			return (
				<div className="container">
					{this.renderReadOnlyMode()}
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
