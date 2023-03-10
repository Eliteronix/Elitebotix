const { DBDiscordUsers } = require('../../dbObjects');

module.exports = {
	name: 'updateTwitchSettings',
	usage: '<discordId> <toggleosumapsync/togglemp>',
	async execute(interaction) {
		let args = interaction.options.getString('argument').split(/ +/);

		let discordId = args[0];

		let discordUser = await DBDiscordUsers.findOne({
			where: {
				userId: discordId,
				twitchVerified: true
			}
		});

		if (!discordUser) {
			await interaction.followUp(`No verified twitch account found for discord user <@${discordId}>`);
		}

		let enabledSomething = false;

		if (args[1] === 'togglemapsync') {
			discordUser.twitchOsuMapSync = !discordUser.twitchOsuMapSync;
			await discordUser.save();
			await interaction.followUp(`Twitch map sync is now ${discordUser.twitchOsuMapSync ? 'enabled' : 'disabled'} for discord user <@${discordId}>`);

			if (discordUser.twitchMapSync) {
				enabledSomething = true;
			}
		} else if (args[1] === 'togglemp') {
			discordUser.twitchOsuMatchCommand = !discordUser.twitchOsuMatchCommand;
			await discordUser.save();
			await interaction.followUp(`Twitch mp is now ${discordUser.twitchOsuMatchCommand ? 'enabled' : 'disabled'} for discord user <@${discordId}>`);

			if (discordUser.twitchMP) {
				enabledSomething = true;
			}
		}

		if (enabledSomething) {
			await interaction.client.shard.broadcastEval(async (c, { channelName }) => {
				if (c.shardId === 0) {
					c.twitchClient.join(channelName);
				}
			}, { context: { channelName: discordUser.twitchName } });
		}
	},
};