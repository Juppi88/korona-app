import React from 'react';

// --------------------------------------------------------------------------------

class ChangelogScreen extends React.Component
{
	constructor(props)
	{
		super(props);

		this.state = {
			changelog: ''
		};

		this.fetchChangelog();
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
}

export default ChangelogScreen;
