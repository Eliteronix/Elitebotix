const { DBDiscordUsers, DBElitebotixBanchoProcessQueue } = require('../../dbObjects');
const { logBroadcastEval } = require('../../config.json');
const { logDatabaseQueries } = require('../../utils');

module.exports = {
	name: 'updateTwitchSettings',
	usage: '<discordId> <togglemapsync/togglemp>',
	async execute(interaction) {
		let args = interaction.options.getString('argument').split(/ +/);

		let discordId = args[0];

		logDatabaseQueries(4, 'commands/admin/updateTwitchSettings.js DBDiscordUsers');
		let discordUser = await DBDiscordUsers.findOne({
			attributes: ['id', 'twitchOsuMapSync', 'twitchOsuMatchCommand', 'twitchName'],
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

			if (discordUser.twitchOsuMatchCommand) {
				enabledSomething = true;
			}
		}

		if (enabledSomething) {
			if (logBroadcastEval) {
				// eslint-disable-next-line no-console
				console.log('Broadcasting commands/admin/updateTwitchSettings.js to shards...');
			}

			await DBElitebotixBanchoProcessQueue.create({
				task: 'joinTwitchChannel',
				additions: discordUser.twitchName,
				date: new Date(),
			});
		}
	},
};