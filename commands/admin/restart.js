const { showUnknownInteractionError, logBroadcastEval } = require('../../config.json');
const { DBProcessQueue } = require('../../dbObjects');
const { logDatabaseQueries } = require('../../utils');

module.exports = {
	name: 'restart',
	usage: '<all|free|shardId|update>',
	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused(true);

		const options = [{ name: 'all', value: 'all' }, { name: 'free', value: 'free' }, { name: 'update', value: 'update' }];

		for (let i = 0; i < interaction.client.totalShards; i++) {
			options.push({ name: `Shard: ${i}`, value: i.toString() });
		}

		let filtered = options.filter(choice => choice.name.toLowerCase().includes(focusedValue.value.toLowerCase()));

		filtered = filtered.slice(0, 25);

		try {
			await interaction.respond(
				filtered.map(choice => ({ name: choice.name, value: choice.value })),
			);
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
		}
	},
	async execute(interaction) {
		let guildSizes = await interaction.client.shard.fetchClientValues('guilds.cache.size');
		let startDates = await interaction.client.shard.fetchClientValues('startDate');
		let matchtracks = await interaction.client.shard.fetchClientValues('matchTracks');
		let bingoMatches = await interaction.client.shard.fetchClientValues('bingoMatches');
		let hostCommands = await interaction.client.shard.fetchClientValues('hostCommands');
		let update = await interaction.client.shard.fetchClientValues('update');

		// eslint-disable-next-line no-console
		console.log('matchtracks', matchtracks);

		const dividingLine = '---------|------------------|--------|------------|-------|---------|--------\n';

		let output = `\`\`\`Cur.: ${interaction.client.shardId.toString().padStart(2, '0')} | Started          | Guilds | Matchtrack | Bingo | HostCmd | Update\n`;
		for (let i = 0; i < guildSizes.length; i++) {
			try {
				if ((output + dividingLine).length > 1997) {
					output = output + '```';
					await interaction.followUp(output);
					output = '```';
				}

				output = output + dividingLine;
				let startDate = new Date(startDates[i]);
				let startedString = `${startDate.getUTCHours().toString().padStart(2, '0')}:${startDate.getUTCMinutes().toString().padStart(2, '0')} ${startDate.getUTCDate().toString().padStart(2, '0')}.${(startDate.getUTCMonth() + 1).toString().padStart(2, '0')}.${startDate.getUTCFullYear()}`;
				let guildSize = guildSizes[i].toString().padStart(6, ' ');
				let matchtrackSize = matchtracks[i].length.toString().padStart(10, ' ');
				let bingoMatchSize = bingoMatches[i].length.toString().padStart(5, ' ');
				let hostCommandSize = hostCommands[i].length.toString().padStart(7, ' ');
				let updateString = update[i].toString().padStart(6, ' ');

				const shardLine = `Shard ${i.toString().padStart(2, '0')} | ${startedString} | ${guildSize} | ${matchtrackSize} | ${bingoMatchSize} | ${hostCommandSize} | ${updateString}\n`;

				if ((output + shardLine).length > 1997) {
					output = output + '```';
					await interaction.followUp(output);
					output = '```';
				}

				output = output + shardLine;
			} catch (error) {
				const errorLine = `Shard ${i} | Error: ${error.message}\n`;

				if ((output + errorLine).length > 1997) {
					output = output + '```';
					await interaction.followUp(output);
					output = '```';
				}

				output = output + `Shard ${i} | Error: ${error.message}\n`;
			}
		}
		output = output + '```';
		await interaction.followUp(output);

		if (logBroadcastEval) {
			// eslint-disable-next-line no-console
			console.log('Broadcasting commands/admin/restart.js to shards...');
		}

		// Restart relevant ones
		await interaction.client.shard.broadcastEval(async (c, { condition }) => {
			if (condition === 'all' ||
				condition === 'free' && c.matchTracks === 0 && c.bingoMatches.length === 0 && c.hostCommands.length === 0 ||
				!isNaN(condition) && c.shardId === parseInt(condition) ||
				condition === 'update' && c.matchTracks.length === 0 && c.bingoMatches.length === 0 && c.hostCommands.length === 0) {

				setTimeout(() => {
					process.exit();
				}, c.shardId * 3000);
			} else if (condition === 'update') {
				c.update = 1;
			}
		}, { context: { condition: interaction.options.getString('argument') } });
		return;
	},
};