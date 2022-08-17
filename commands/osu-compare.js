const { populateMsgFromInteraction, getOsuBeatmap } = require('../utils');
const { Permissions } = require('discord.js');

module.exports = {
	name: 'osu-compare',
	aliases: ['osu-comp', 'o-c', 'oc'],
	description: 'Sends an info card about the score of the specified player on the last map sent into the channel by the bot',
	usage: '[username] [username] ...',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: [Permissions.FLAGS.ATTACH_FILES, Permissions.FLAGS.SEND_MESSAGES],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	guildOnly: true,
	// args: true,
	cooldown: 15,
	//noCooldownMessage: true,
	tags: 'osu',
	prefixCommand: true,
	async execute(msg, args, interaction, additionalObjects) {
		if (interaction) {
			msg = await populateMsgFromInteraction(interaction);

			await interaction.reply('Score will be compared');

			args = [];

			if (interaction.options._hoistedOptions) {
				for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
					args.push(interaction.options._hoistedOptions[i].value);
				}
			}
		}
		msg.channel.messages.fetch({ limit: 100 })
			.then(async (messages) => {
				const allRegex = /.+\nSpectate: .+\nBeatmap: .+\nosu! direct: .+/gm;

				const firstMessage = messages.filter(m => m.author.id === msg.client.user.id && m.content.match(allRegex)).first();

				const beginningRegex = /.+\nSpectate: .+\nBeatmap: <https:\/\/osu.ppy.sh\/b\//gm;
				const endingRegex = />\nosu! direct:.+/gm;
				if (!firstMessage) {
					if (msg.id) {
						return msg.reply('Could not find any scores sent by Elitebotix in this channel in the last 100 messages.');
					}
					return interaction.followUp('Could not find any scores sent by Elitebotix in this channel in the last 100 messages.');
				}

				const beatmapId = firstMessage.content.replace(beginningRegex, '').replace(endingRegex, '');

				const beatmap = await getOsuBeatmap({ beatmapId: beatmapId });

				let newArgs = [beatmapId, `--${beatmap.mode}`];

				for (let i = 0; i < args.length; i++) {
					newArgs.push(args[i]);
				}

				const command = require('./osu-score.js');

				try {
					command.execute(msg, newArgs, null, additionalObjects);
				} catch (error) {
					console.error(error);
					const eliteronixUser = await msg.client.users.cache.find(user => user.id === '138273136285057025');
					msg.reply('There was an error trying to execute that command. The developers have been alerted.');
					eliteronixUser.send(`There was an error trying to execute a command.\n\nMessage by ${msg.author.username}#${msg.author.discriminator}: \`${msg.content}\`\n\n${error}`);
				}
			});
	},
};