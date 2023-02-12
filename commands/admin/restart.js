module.exports = {
	name: 'restart',
	usage: '<all|free|shardId|update>',
	async execute(interaction) {
		let guildSizes = await interaction.client.shard.fetchClientValues('guilds.cache.size');
		let startDates = await interaction.client.shard.fetchClientValues('startDate');
		let duels = await interaction.client.shard.fetchClientValues('duels');
		let other = await interaction.client.shard.fetchClientValues('otherMatches');
		let matchtracks = await interaction.client.shard.fetchClientValues('matchTracks');
		let bingoMatches = await interaction.client.shard.fetchClientValues('bingoMatches');
		let update = await interaction.client.shard.fetchClientValues('update');

		// eslint-disable-next-line no-console
		console.log('duels', duels);
		// eslint-disable-next-line no-console
		console.log('other', other);
		// eslint-disable-next-line no-console
		console.log('matchtracks', matchtracks);

		let output = `\`\`\`Cur.: ${interaction.client.shardId} | Started          | Guilds | Duels | Other | Matchtrack | Bingo | Update\n`;
		for (let i = 0; i < guildSizes.length; i++) {
			output = output + '--------|------------------|--------|-------|-------|------------|-------|--------\n';
			let startDate = new Date(startDates[i]);
			let startedString = `${startDate.getUTCHours().toString().padStart(2, '0')}:${startDate.getUTCMinutes().toString().padStart(2, '0')} ${startDate.getUTCDate().toString().padStart(2, '0')}.${(startDate.getUTCMonth() + 1).toString().padStart(2, '0')}.${startDate.getUTCFullYear()}`;
			let guildSize = guildSizes[i].toString().padStart(6, ' ');
			let duelSize = duels[i].length.toString().padStart(5, ' ');
			let otherSize = other[i].length.toString().padStart(5, ' ');
			let matchtrackSize = matchtracks[i].length.toString().padStart(10, ' ');
			let bingoMatchSize = bingoMatches[i].toString().padStart(5, ' ');
			let updateString = update[i].toString().padStart(6, ' ');
			output = output + `Shard ${i} | ${startedString} | ${guildSize} | ${duelSize} | ${otherSize} | ${matchtrackSize} | ${bingoMatchSize} | ${updateString}\n`;
		}
		output = output + '```';
		await interaction.editReply(output);

		// Restart relevant ones
		await interaction.client.shard.broadcastEval(async (c, { condition }) => {
			if (condition === 'all' ||
				condition === 'free' && c.duels.length === 0 && c.otherMatches.length === 0 && c.matchTracks === 0 && c.bingoMatches === 0 ||
				!isNaN(condition) && c.shardId === parseInt(condition) ||
				condition === 'update' && c.duels.length === 0 && c.otherMatches.length === 0 && c.matchTracks.length === 0 && c.bingoMatches === 0) {

				// eslint-disable-next-line no-undef
				process.exit();
			} else if (condition === 'update') {
				c.update = 1;
			}
		}, { context: { condition: interaction.options.getString('argument') } });
		return;
	},
};