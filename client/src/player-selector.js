import React from 'react';

// --------------------------------------------------------------------------------

function PlayerButton(props)
{
	return (
		<button className="player-button" onClick={ props.onClick }>
			{ props.name }
		</button>
	);
}

// --------------------------------------------------------------------------------

class PlayerSelector extends React.Component
{
	constructor(props)
	{
		super(props);

		this.state = {
			players: Array(0),
			available: Array(0),
		};

		var instance = this;

		// Fetch the list of active names from the Node.js server.
		fetch('/api/names')
			.then(function(response) {
				return response.json();
			}).then(function(json) {
				instance.setState( { available: json.names } );
			}).catch(function(ex) {
			}
		);
	}

	renderButton(name, index)
	{
		return (
			<PlayerButton
				key = {index}
				name = {name}
				onClick = {() => this.addPlayer(name)}
			/>
		);
	}

	renderAddButton(name)
	{
		return (
			<PlayerButton
				name = {"Lisää joku muu..."}
				onClick = {() => this.addCustomPlayer()}
			/>
		);
	}

	addCustomPlayer()
	{
		var name = prompt("Anna pelaajan nimi", "");

		if (name) {
			this.addPlayer(name);
		}
	}

	addPlayer(name)
	{
		const players = this.state.players;

		// Make sure there are 4 players at most.
		if (players.length >= 4) {
			alert("Pelaajia voi olla korkeintaan neljä.");
			return;
		}

		// Add the player to the list.
		players.push(name);
		this.setState( { players: players } );
	}

	removePlayer(index)
	{
		const players = this.state.players;

		// Remove the player at the given index and update the state of the player selector.
		if (index < players.length) {
			players.splice(index, 1);
			this.setState( { players: players } );
		}
	}

	startGame()
	{
		const players = this.state.players;

		// Make sure the game has at least two players before starting.
		if (players.length < 2) {
			alert("Pelaajia täytyy olla vähintään kaksi.");
			return;
		}

		// Pass the list of selected players to the Game class.
		this.props.onReady(players);
	}

	render()
	{
		// Pre-defined list of names for regular players.
		var names = this.state.available;

		// Compile a list of selected players.
		const players = this.state.players;

		const selectedPlayers = players.map((name, index) => {

			// Remove from the list of available names if already selected.
			var nameIndex = names.indexOf(name);
			if (nameIndex >= 0) {
				names.splice(nameIndex, 1);
			}

			// Render a button for the added player which removes the player when clicked.
			return (
				<button key={index} onClick={() => this.removePlayer(index)}>{name}</button>
			);
		});

		// Compile a list of available players.
		const availablePlayers = [];

		for (var i = 0, c = names.length; i < c; i++)
		{
			availablePlayers.push(this.renderButton(names[i], i));
		}

		// Render the list of players to add and list of players selected.
		return (
			<div className="player-selector">

				<div className="player-list-available">
					<h1>Lisää pelaajia</h1>

					{availablePlayers}

					{this.renderAddButton()}
				</div>

				{ players.length > 0 ?
					<div className="player-list-selected">
						<h2>Valitut pelaajat</h2>
						{selectedPlayers}
					</div> :
					<div></div>
				}

				{ players.length >= 2 ?
					<button onClick={() => this.startGame()} className="start-button">Aloita peli</button> :
					<div></div>
				}
			</div>
		);
	}
}

// --------------------------------------------------------------------------------

export default PlayerSelector;
