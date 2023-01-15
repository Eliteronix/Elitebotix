const { getOsuBeatmap } = require('../utils');
const { Permissions } = require('discord.js');

module.exports = {
	name: 'osu-compare',
	description: 'Sends an info card about the score of the specified player on the last map sent into the channel by the bot',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: [Permissions.FLAGS.ATTACH_FILES, Permissions.FLAGS.SEND_MESSAGES],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	cooldown: 15,
	tags: 'osu',
	async execute(msg, args, interaction, additionalObjects) {
		//TODO: Remove message code and replace with interaction code
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

				command.execute(msg, newArgs, null, additionalObjects);
			});
	},
};