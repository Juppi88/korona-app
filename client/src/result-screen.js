import React from 'react';
import ArrowUpward from '@material-ui/icons/ArrowUpward';
import ArrowDownward from '@material-ui/icons/ArrowDownward';

// --------------------------------------------------------------------------------

class ResultScreen extends React.Component
{
	constructor(props)
	{
		super(props);

		this.state = {
			results: props.results,
		};
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

	xpRequiredToLevel(level)
	{
		return (Math.pow(level, 2) + level) / 2;
	}

	renderXpBar(player, width, height)
	{
		var xpToNextLevel = this.xpRequiredToLevel(player.level + 1);

		// Start the XP bar animation.
		var startTime = (new Date()).getTime();
		var startWidth = width * (player.xp / xpToNextLevel);

		// Animate the bar after a second.
		const FreezeTime = 1000;

		setTimeout(
			() => this.animateXpBar(player, width, startTime + FreezeTime, 1500, false),
			FreezeTime);

		return (
			<div key={player.name} className="xp" width={width} id={"xp-bar-" + player.name}>

				<div className="xp-bar-texts" width={width}>
					<div className="level-text">{player.name} (Taso {player.level})</div>
					<div className="xp-text">{Math.floor(player.xp)} / {xpToNextLevel}</div>
				</div>

				<svg width={width} height={height}>
					<rect className="xp-background" width={width} height={height} />
					<rect className={"xp-bar " + (player.xpGained > 0 ? "run-xp-up-animation" : "")} width={startWidth} height={height} />
				</svg>

				<div className="arrow-container">
					<ArrowUpward className="level-up-arrow"/>
					<ArrowDownward className="level-down-arrow"/>
				</div>

			</div>
		);
	}

	animateXpBar(player, width, startTime, animationTime, levelChanged)
	{
		var now = (new Date()).getTime();
		var elapsedTime = now - startTime;
		var t = (elapsedTime / animationTime);
		var finished = false;

		if (t >= 1) {
			t = 1;
			finished = true;
		}

		var container = document.getElementById("xp-bar-" + player.name);
		var bar = container.getElementsByClassName("xp-bar")[0];
		var xpLabel = container.getElementsByClassName("xp-text")[0];
		var levelLabel = container.getElementsByClassName("level-text")[0];
		var levelUpArrow = container.getElementsByClassName("level-up-arrow")[0];
		var levelDownArrow = container.getElementsByClassName("level-down-arrow")[0];

		var lvl = player.level;
		var currentXp = (player.xp + t * player.xpGained);
		var requiredXp, barWidth;

		// Player gained XP (and possibly levels)
		if (player.xpGained >= 0) {

			requiredXp = this.xpRequiredToLevel(lvl + 1);

			while (requiredXp <= currentXp) {

				currentXp -= requiredXp;
				requiredXp = this.xpRequiredToLevel(++lvl + 1);

				// Display and animate the level up arrow.
				if (!levelChanged) {

					levelChanged = true;
					
					levelUpArrow.style.animationPlayState = "running";
					levelDownArrow.parentNode.removeChild(levelDownArrow);

					bar.classList.add("run-xp-bar-animation");
				}
			}

			barWidth = (currentXp / requiredXp) * width;
			bar.setAttribute("width", barWidth + "px");

			xpLabel.innerHTML = Math.floor(currentXp) + " / " + requiredXp;
			levelLabel.innerHTML = player.name + " (Taso " + lvl + ")";
		}

		// Player lost XP (and possibly levels)
		else {
			
			requiredXp = this.xpRequiredToLevel(lvl);
			
			while (currentXp < 0) {

				currentXp += requiredXp;
				requiredXp = this.xpRequiredToLevel(--lvl);

				// Display and animate the level down arrow.
				if (!levelChanged) {

					levelChanged = true;

					levelDownArrow.style.animationPlayState = "running";
					levelUpArrow.parentNode.removeChild(levelUpArrow);
				}
			}

			requiredXp = this.xpRequiredToLevel(lvl + 1);

			barWidth = (currentXp / requiredXp) * width;
			bar.setAttribute("width", barWidth + "px");

			xpLabel.innerHTML = Math.floor(currentXp) + " / " + requiredXp;
			levelLabel.innerHTML = player.name + " (Taso " + lvl + ")";
		}

		// Re-run the animation until all the XP is added/removed.
		if (!finished) {
			setTimeout(() => this.animateXpBar(player, width, startTime, animationTime, levelChanged), 50);
		}
	}

	render()
	{
		if (!this.state.results) {
			return (
				<div></div>
			);
		}

		var winners = [], others = [];

		// Collect a list of winners and other participants.
		for (var i = 0; i < this.state.results.length; i++) {

			if (this.state.results[i].isWinner) {
				winners.push(this.renderXpBar(this.state.results[i], 520, 8));
			}
			else {
				others.push(this.renderXpBar(this.state.results[i], 520, 8));
			}
		}

		return (
			<div className="results-container">
				<h2>Voittajat</h2>
				{winners}
				<h2>Muut pelaajat</h2>
				{others}

				<br/>
				<div className="bottom-menu">
					<button onClick={() => this.props.onExit()} className="start-button">Uusi Peli</button>
				</div>
			</div>
		);
	}
}

export default ResultScreen;
