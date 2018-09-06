import React from 'react';

// --------------------------------------------------------------------------------

const Colours = [
	"#F00", // Red
	"#BB0", // Yellow
	"#0C0", // Green
	"#00F", // Blue
];

// --------------------------------------------------------------------------------

class LogScreen extends React.Component
{
	constructor(props)
	{
		super(props);

		this.state = {
			logs: null
		};

		this.fetchStatsFromDatabase();
	}

	fetchStatsFromDatabase()
	{
		var instance = this;

		// Get complete stats from the backend.
		fetch('/api/logs')
			.then(function(response) {
				return response.json();
			})
			.then(function(json) {
			
				// Save logs to state and re-render page.
				instance.setState({ logs: json })
			})
			.catch(function(ex) {
			}
		);
	}

	renderGame(i)
	{
		const game = this.state.logs[i];
		const days = [ "Su", "Ma", "Ti", "Ke", "To", "Pe", "La" ];

		var date = new Date(game.timeStarted * 1000);
		var winners = [];
		var others = [];

		for (var n = 0; n < game.players.length; n++) {

			const player = game.players[n];

			// Skip empty slots
			if (!player.name) {
				continue;
			}

			if (player.isWinner) {

				winners.push((
					<span key={n}>
						<span>{winners.length > 0 ? ", " : ""}</span>
						<span style={{color: Colours[n], fontStyle: player.isStarter ? "italic" : "normal"}}>
							{player.name}
						</span>
					</span>
				));
			}
			else {
				others.push((
					<span key={n}>
						<span>{others.length > 0 ? ", " : ""}</span>
						<span style={{color: Colours[n], fontStyle: player.isStarter ? "italic" : "normal"}}>
							{player.name}
						</span>
					</span>
				));
			}
		}

		return (
			<tr key={i} className={i % 2 ? "second-row" : "first-row"}>
				<td>{days[date.getDay()]} {date.getHours().toString().padStart(2, '0')}:{date.getMinutes().toString().padStart(2, '0')}</td>
				<td>{winners}</td>
				<td>{others}</td>
			</tr>
		);
	}

	render()
	{
		if (!this.state.logs) {
			return (
				<div></div>
			);
		}

		const games = [];

		for (var i = 0, c = this.state.logs.length; i < c; i++) {
			games.push(this.renderGame(i));
		}

		return (
			<div className="stats-container">

				<h1>Viimeisimmät pelit</h1>
				<table className="logs">
				<tbody>
					<tr>
						<th width="100">Aika</th>
						<th width="175">Voittaja</th>
						<th width="225">Muut pelaajat</th>
					</tr>
					{games}
				</tbody>
				</table>

			</div>
		);
	}
}

export default LogScreen;
