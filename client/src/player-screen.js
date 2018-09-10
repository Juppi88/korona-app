import React from 'react';
import { LineChart, XAxis, YAxis, Tooltip, Legend, Line, CartesianGrid } from "recharts";

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

			history.push({
				date: date.getDate() + "." + (date.getMonth() + 1) + ".",
				level: player.history[i].level,
				xp: player.history[i].xp
			});
		}

		// Only show 10 most recent games in the graph.
		if (history.length > 10) {
			history = history.slice(-10);
		}

		return (
			<div className="player-stats">
				<ul className="list-left">
					<li>Pelejä: <span>{player.totalGames}</span></li>
					<li>Voittoja: <span>{player.wins} ({(100 * player.wins / player.totalGames).toFixed(0)} %)</span></li>
				</ul>
				<LineChart width={650} height={300} data={history}>
					<CartesianGrid strokeDasharray="3 3"/>
					<XAxis dataKey="date"/>
					<YAxis yAxisId="left" allowDecimals={false} domain={[0, 'auto']} />
					<YAxis yAxisId="right" orientation="right" allowDecimals={false} domain={[0, 'auto']} />
					<Tooltip/>
					<Legend />
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
			return b.name < a.name;
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