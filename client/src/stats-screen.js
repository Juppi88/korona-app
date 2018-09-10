import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, LabelList } from "recharts";

// --------------------------------------------------------------------------------

const Colours = [
	"#F00", // Red
	"#DD0", // Yellow
	"#0D0", // Green
	"#00F", // Blue
];

// --------------------------------------------------------------------------------

class CustomizedLabel extends React.Component
{
	render()
	{
		const {x, y, fill, value} = this.props;
		return (
			<text className="bar-label"
				x={x - 10}
				y={y} 
				fill={fill}
				color="#fff"
				textAnchor="start">{value}%
			</text>
		);
	}
}

class StatsScreen extends React.Component
{
	constructor(props)
	{
		super(props);

		this.state = {
			stats: null
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
			
				// Save to state and re-render page.
				instance.setState({ stats: json })
			})
			.catch(function(ex) {
			}
		);
	}

	renderColourWins()
	{
		const stats = this.state.stats;
		var totalWins = stats.winsRed + stats.winsYellow + stats.winsGreen + stats.winsBlue;
		
		const data = [
			{name: "Punainen", value: Math.round(100 * stats.winsRed / totalWins)},
			{name: "Keltainen", value: Math.round(100 * stats.winsYellow / totalWins)},
			{name: "Vihreä", value: Math.round(100 * stats.winsGreen / totalWins)},
			{name: "Sininen", value: Math.round(100 * stats.winsBlue / totalWins)}
		];

		console.log(data[0].value);
		console.log(data[1].value);
		console.log(data[2].value);
		console.log(data[3].value);

		return (
			<div className="chart-container">
				<h2>Voitot väreittäin</h2>
				<PieChart width={360} height={180}>
					<Pie
						data={data}
						cx={180}
						cy={82}
						labelLine={false}
						label={<CustomizedLabel/>}
						outerRadius={70}
						fill="#8884d8"
						dataKey="value">
						{data.map((entry, index) => <Cell key={index} fill={Colours[index % Colours.length]}/>)}
					</Pie>
				</PieChart>
			</div>
		);
	}

	renderBarChart(width, height, colour, title, data, dataKey)
	{
		return (
			<div className="chart-container">
				<h2>{title}</h2>
				<BarChart width={width} height={height} layout="vertical" barCategoryGap={1} data={data}>
					<XAxis type="number" allowDecimals={false}/>
					<YAxis type="category" dataKey="name"/>
					<Tooltip/>
					<Bar dataKey={dataKey} fill={colour}>
						<LabelList dataKey={dataKey} position="right" />
					</Bar>
				</BarChart>
			</div>
		);
	}

	renderWinsPerPlayer()
	{
		const players = this.state.stats.players;
		var data = [];

		// Sort the players by wins.
		players.sort((a, b) => {
			return b.wins - a.wins;
		});

		// Collect the data of at most 5 players.
		for (var i = 0, c = Math.min(5, players.length); i < c; i++) {

			const player = players[i];
			data.push({name: player.name, wins: player.wins});
		}

		return this.renderBarChart(350, 180, "#756b91", "Eniten voittoja", data, "wins");
	}

	renderGamesPerPlayer()
	{
		const players = this.state.stats.players;
		var data = [];

		// Sort the players by wins.
		players.sort((a, b) => {
			return b.totalGames - a.totalGames;
		});

		// Collect the data of at most 5 players.
		for (var i = 0, c = Math.min(5, players.length); i < c; i++) {

			const player = players[i];
			data.push({name: player.name, games: player.totalGames});
		}

		return this.renderBarChart(350, 180, "#756b91", "Eniten pelejä", data, "games");
	}

	renderGameStats()
	{
		const stats = this.state.stats;

		return (
			<div className="chart-container">
				<h2>Pelitilastot</h2>
				<ul>
					<li>Pelejä yhteensä: <span>{stats.totalGames}</span></li>
					<li>Pelin pituus (keskim.): <span>{((stats.totalDuration / 60) / stats.totalGames).toFixed(0)} min</span></li>
				</ul>
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
		return (
			<div className="stats-container">
				<table>
				<tbody>

					<tr>
						<td>{this.renderWinsPerPlayer()}</td>
						<td>{this.renderGamesPerPlayer()}</td>
					</tr>
					<tr>
						<td>{this.renderColourWins()}</td>
						<td>{this.renderGameStats()}</td>
					</tr>
				</tbody>
				</table>
			</div>
		);
	}
}

export default StatsScreen;
