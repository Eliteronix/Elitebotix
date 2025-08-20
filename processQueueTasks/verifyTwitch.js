const { DBDiscordUsers, DBElitebotixBanchoProcessQueue } = require('../dbObjects');

module.exports = {
	async execute(client, processQueueEntry) {
		let args = processQueueEntry.additions.split(';');

		let discordName = args[1];
		let discordDiscriminator = args[2];

		let discordUser = await findUserGlobal(client, discordName, discordDiscriminator);

		if (!discordUser) {
			processQueueEntry.destroy();
			return;
		}

		let dbDiscordUser = await DBDiscordUsers.findOne({
			attributes: ['id', 'twitchVerified', 'twitchName'],
			where: {
				userId: discordUser.id,
				twitchName: args[0].toLowercase(),
			}
		});

		if (!dbDiscordUser) {
			processQueueEntry.destroy();
			return;
		}

		dbDiscordUser.twitchVerified = true;
		await dbDiscordUser.save();

		await DBElitebotixBanchoProcessQueue.create({
			task: 'twitchVerification',
			additions: args[0],
			date: new Date(),
		});

		try {
			await discordUser.send(`Your connection to the twitch account ${dbDiscordUser.twitchName} has been verified!`);
		} catch (e) {
			console.error(e);
		}

		processQueueEntry.destroy();
	},
};

// Search across all shards for a user by username#discriminator
async function findUserGlobal(client, username, discriminator) {
	const results = await client.shard.broadcastEval(
		async (c, { username, discriminator }) => {
			const member = c.users.cache.find(m =>
				m.user.username === username && m.user.discriminator === discriminator
			);

			if (member) return { id: member.id };
		},
		{ context: { username, discriminator } }
	);

	return results.find(r => r !== null) || null;
}