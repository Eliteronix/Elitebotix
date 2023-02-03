const { getOsuBeatmap } = require('../utils');
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');

module.exports = {
	name: 'osu-compare',
	description: 'Sends an info card about the score of the specified player on the last map sent into the channel by the bot',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: [PermissionsBitField.Flags.AttachFiles, PermissionsBitField.Flags.SendMessages],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	cooldown: 15,
	tags: 'debug',
	data: new SlashCommandBuilder()
		.setName('osu-compare')
		.setNameLocalizations({
			'de': 'osu-vergleichen',
			'en-GB': 'osu-compare',
			'en-US': 'osu-compare',
		})
		.setDescription('Sends an info card about the score of the specified player on the last map sent into the channel')
		.setDescriptionLocalizations({
			'de': 'Vergleicht den angegebenen Spieler mit der letzten map, die in den Kanal gesendet wurde',
			'en-GB': 'Sends an info card about the score of the specified player on the last map sent into the channel',
			'en-US': 'Sends an info card about the score of the specified player on the last map sent into the channel',
		})
		.setDMPermission(true)
		.addStringOption(option =>
			option.setName('username')
				.setNameLocalizations({
					'de': 'nutzername',
					'en-GB': 'username',
					'en-US': 'username',
				})
				.setDescription('The username, id or link of the player to compare')
				.setDescriptionLocalizations({
					'de': 'Der Nutzername, die ID oder der Link des Spielers zum Vergleichen',
					'en-GB': 'The username, id or link of the player to compare',
					'en-US': 'The username, id or link of the player to compare',
				})
				.setRequired(false)
		)
		.addStringOption(option =>
			option.setName('username2')
				.setNameLocalizations({
					'de': 'nutzername2',
					'en-GB': 'username2',
					'en-US': 'username2',
				})
				.setDescription('The username, id or link of the player to compare')
				.setDescriptionLocalizations({
					'de': 'Der Nutzername, die ID oder der Link des Spielers zum Vergleichen',
					'en-GB': 'The username, id or link of the player to compare',
					'en-US': 'The username, id or link of the player to compare',
				})
				.setRequired(false)
		)
		.addStringOption(option =>
			option.setName('username3')
				.setNameLocalizations({
					'de': 'nutzername3',
					'en-GB': 'username3',
					'en-US': 'username3',
				})
				.setDescription('The username, id or link of the player to compare')
				.setDescriptionLocalizations({
					'de': 'Der Nutzername, die ID oder der Link des Spielers zum Vergleichen',
					'en-GB': 'The username, id or link of the player to compare',
					'en-US': 'The username, id or link of the player to compare',
				})
				.setRequired(false)
		)
		.addStringOption(option =>
			option.setName('username4')
				.setNameLocalizations({
					'de': 'nutzername4',
					'en-GB': 'username4',
					'en-US': 'username4',
				})
				.setDescription('The username, id or link of the player to compare')
				.setDescriptionLocalizations({
					'de': 'Der Nutzername, die ID oder der Link des Spielers zum Vergleichen',
					'en-GB': 'The username, id or link of the player to compare',
					'en-US': 'The username, id or link of the player to compare',
				})
				.setRequired(false)
		)
		.addStringOption(option =>
			option.setName('username5')
				.setNameLocalizations({
					'de': 'nutzername5',
					'en-GB': 'username5',
					'en-US': 'username5',
				})
				.setDescription('The username, id or link of the player to compare')
				.setDescriptionLocalizations({
					'de': 'Der Nutzername, die ID oder der Link des Spielers zum Vergleichen',
					'en-GB': 'The username, id or link of the player to compare',
					'en-US': 'The username, id or link of the player to compare',
				})
				.setRequired(false)
		),
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