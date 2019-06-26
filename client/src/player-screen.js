import React from 'react';
import { LineChart, XAxis, YAxis, Tooltip, Legend, Line, CartesianGrid } from "recharts";

// --------------------------------------------------------------------------------

const COLOUR_RED = 0;
const COLOUR_YELLOW = 1;
const COLOUR_GREEN = 2;
const COLOUR_BLUE = 3;

const Colours = [
	"#F00", // Red
	"#CB0", // Yellow
	"#0B0", // Green
	"#00F", // Blue
];

// --------------------------------------------------------------------------------

class PlayerStatsScreen extends React.Component
{
	constructor(props)
	{
		super(props);

		this.state = {
			stats: null,
			player: -1
		};

		this.fetchStatsFromDatabase();
	}

	fetchStatsFromDatabase()
	{
		var instance = this;

		// Get complete stats from the backend.
		fetch('/api/stats')
			.then(function(response) {
				return response.json();
			})
			.then(function(json) {
				// Save logs to state and re-render page.
				instance.setState({ stats: json, player: json.players.length > 0 ? 0 : -1 })
			})
			.catch(function(ex) {
			}
		);
	}
	
	getPlayerIndex(name)
	{
		var players = this.state.stats.players;

		for (var i = 0, c = players.length; i < c; i++) {

			if (players[i].name === name) {
				return i;
			}
		}

		return -1;
	}

	xpRequiredToLevel(level)
	{
		return (Math.pow(level, 2) + level) / 2;
	}

	renderXpBar(player, width, height)
	{
		var currentXp = Math.floor(player.xp);
		var xpToNextLevel = this.xpRequiredToLevel(player.level + 1);

		// Start the XP bar animation.
		var startTime = (new Date()).getTime();

		this.animateXpBar(width * (currentXp / xpToNextLevel), startTime, 500);

		return (
			<div className="xp" width={width}>

				<div className="xp-bar-texts" width={width}>
					<div className="level-text">Taso {player.level}</div>
					<div className="xp-text">{currentXp} / {xpToNextLevel}</div>
				</div>

				<svg width={width} height={height}>
					<rect className="xp-background" width={width} height={height} />
					<rect className="xp-bar" width={0} height={height} id="xp-bar" />
				</svg>

			</div>
		);
	}

	animateXpBar(targetWidth, startTime, animationTime)
	{
		var finished = false;

		var bar = document.getElementById("xp-bar");
		if (bar) {

			var now = (new Date()).getTime();
			var elapsedTime = now - startTime;
			var t = (elapsedTime / animationTime);

			if (t >= 1) {
				t = 1;
				finished = true;
			}

			bar.setAttribute("width", (t * targetWidth) + "px");
		}

		if (!finished) {
			setTimeout(() => this.animateXpBar(targetWidth, startTime, animationTime), 5);
		}
	}

	renderPlayerStats()
	{
		// No player selected.
		if (this.state.player < 0) {
			return (<div></div>);
		}

		const player = this.state.stats.players[this.state.player];
		var history = [];

		// Compile player history with XP/level gains from most recent games.
		for (var i = 0, c = player.history.length; i < c; i++) {

			var date = new Date(1000 * player.history[i].gameStarted);
			var xp = 1.0 * player.history[i].xp.toFixed(1);

			history.push({
				date: date.getDate() + "." + (date.getMonth() + 1) + ".",
				level: player.history[i].level,
				xp: xp
			});
		}

		// Add a second fake game for players with just one played game to avoid having a vertical
		// level and XP bar.
		if (history.length === 1) {

			history.unshift({
				date: "",
				level: history[0].level,
				xp: history[0].xp
			});
		}

		var colours = [
			{ colour: COLOUR_RED, wins: player.winsRed, games: player.gamesRed },
			{ colour: COLOUR_YELLOW, wins: player.winsYellow, games: player.gamesYellow },
			{ colour: COLOUR_GREEN, wins: player.winsGreen, games: player.gamesGreen },
			{ colour: COLOUR_BLUE, wins: player.winsBlue, games: player.gamesBlue }
		];

		// Order the colour stats by win ratio, or by win count if they're equal.
		colours.sort((a, b) => {

			var ratioA = a.wins / a.games;
			var ratioB = b.wins / b.games;

			if (ratioA > ratioB) return -1;
			if (ratioA < ratioB) return 1;
			if (a.wins > b.wins) return -1;
			if (a.wins < b.wins) return 1;
			if (a.games > b.games) return -1;
			if (a.games < b.games) return 1;

			return 0;
		});

		const colourNames = [ "Punainen", "Keltainen", "Vihreä", "Sininen" ];

		// Only show 10 most recent games in the graph.
		if (history.length > 10) {
			history = history.slice(-10);
		}

		// Store min and max XP values in history so the graph can be scaled between these.
		var maxXP = 0, minXP = 10000000;

		for (var idx = 0, cnt = history.length; idx < cnt; idx++) {

			var histXp = history[idx].xp;

			if (histXp > maxXP) maxXP = histXp;
			if (histXp < minXP) minXP = histXp;
		}

		// Don't show any specific stats if the player hasn't played their first game yet.
		if (player.totalGames === 0) {

			return (
				<div className="player-stats">
					{this.renderXpBar(player, 520, 8)}
					<p>Pelaaja ei ole pelannut yhtään peliä.</p>
				</div>
			);
		}

		return (
			<div className="player-stats">

				{this.renderXpBar(player, 520, 8)}

				<div className="player-stat-list">
					<div className="list-left">
						<div>Voittoja: <span>{player.wins} ({(100 * player.wins / player.totalGames).toFixed(0)}%)</span></div>
						<div>Kuukausi: <span>{player.recentWins} ({(player.recentGames !== 0 ? (100 * player.recentWins / player.recentGames).toFixed(0) : 0)}%)</span></div>
					</div>
					<div className="list-right">
						<div>Vahvin: <span><span style={{ color: Colours[colours[0].colour]}}>{colourNames[colours[0].colour]}</span> ({(colours[0].games ? 100 * colours[0].wins / colours[0].games : 0).toFixed(0)}%)</span></div>
						<div>Heikoin: <span><span style={{ color: Colours[colours[3].colour]}}>{colourNames[colours[3].colour]}</span> ({(colours[3].games ? 100 * colours[3].wins / colours[3].games : 0).toFixed(0)}%)</span></div>
						<div>Aloittajana: <span>{(player.wins !== 0 ? (100 * player.winsAsStarter / player.wins).toFixed(0) : 0)}%</span></div>
					</div>
				</div>

				<LineChart width={650} height={300} data={history}>
					<CartesianGrid strokeDasharray="3 3"/>
					<XAxis dataKey="date"/>
					<YAxis yAxisId="left" allowDecimals={false} domain={[0, 'auto']} />
					<YAxis yAxisId="right" orientation="right" allowDecimals={false} domain={[Math.max(0, Math.floor(minXP) - 1), Math.ceil(maxXP) + 1]} />
					<Tooltip/>
					<Legend wrapperStyle={{ bottom: -18 }}/>
					<Line yAxisId="left" type="linear" dataKey="level" stroke="#8884d8" activeDot={{r: 8}}/>
					<Line yAxisId="right" type="linear" dataKey="xp" stroke="#82ca9d" />
				</LineChart>

			</div>
		);
	}

	render()
	{
		if (!this.state.stats) {
			return (
				<div></div>
			);
		}

		// Compile a list of players in alphabetical order.
		var players = this.state.stats.players;
		
		players.sort((a, b) => {
			if (a.name < b.name) return -1;
			if (a.name > b.name) return 1;
			return 0;
		});

		var options = [];

		for (var i = 0, c = players.length; i < c; i++) {
			options.push(<option key={i}>{players[i].name}</option>);
		}

		return (
			<div className="stats-container">

				<select onChange={(e) => { this.setState({ player: this.getPlayerIndex(e.target.value) })} }>
					<optgroup label="Valitse pelaaja:">
						{options}
					</optgroup>
				</select>

				{this.renderPlayerStats()}

			</div>
		);
	}
}

export default PlayerStatsScreen;
