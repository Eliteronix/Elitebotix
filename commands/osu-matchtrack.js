const osu = require('node-osu');
const { getGuildPrefix, getIDFromPotentialOsuLink, populateMsgFromInteraction } = require('../utils');
const { Permissions } = require('discord.js');

module.exports = {
	name: 'osu-matchtrack',
	aliases: ['osu-matchfollow'],
	description: 'Sends an evaluation of how valuable all the players in the match were',
	usage: '<match ID or URL> [# of warmups] [avg]',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: [Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.ATTACH_FILES],
	botPermissionsTranslated: 'Send Messages and Attach Files',
	//guildOnly: true,
	args: true,
	cooldown: 15,
	//noCooldownMessage: true,
	tags: 'osu',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		if (interaction) {
			await interaction.deferReply();

			msg = await populateMsgFromInteraction(interaction);

			args = [];

			args.push(interaction.options._hoistedOptions[0].value);
		}

		// eslint-disable-next-line no-undef
		const osuApi = new osu.Api(process.env.OSUTOKENV1, {
			// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
			notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
			completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
			parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
		});

		let matchID = args[0];

		if (isNaN(matchID)) {
			if (args[0].startsWith('https://osu.ppy.sh/community/matches/') || args[0].startsWith('https://osu.ppy.sh/mp/')) {
				matchID = getIDFromPotentialOsuLink(args[0]);
			} else {
				const guildPrefix = await getGuildPrefix(msg);
				if (msg.id) {
					return msg.reply(`You didn't provide a valid match ID or URL.\nUsage: \`${guildPrefix}${this.name} ${this.usage}\``);
				} else {
					return interaction.editReply(`You didn't provide a valid match ID or URL.\nUsage: \`/${this.name} ${this.usage}\``);
				}
			}
		}

		osuApi.getMatch({ mp: matchID })
			.then(async (match) => {
				if (match.raw_end) {
					if (msg.id) {
						return msg.reply(`Match \`${match.name.replace(/`/g, '')}\` has already ended.`);
					} else {
						return interaction.editReply(`Match \`${match.name.replace(/`/g, '')}\` has already ended.`);
					}
				}

				let initialMessage = null;

				if (msg.id) {
					initialMessage = msg.reply(`Tracking match \`${match.name.replace(/`/g, '')}\`\nReact to this message with :octagonal_sign: to stop tracking`);
				} else {
					initialMessage = await interaction.editReply(`Tracking match \`${match.name.replace(/`/g, '')}\`\nReact to this message with :octagonal_sign: to stop tracking`);
				}

				const reactionCollector = initialMessage.createReactionCollector();

				reactionCollector.on('collect', (reaction, user) => {
					console.log(reaction.emoji.name, user.id, msg.author.id);
					if (reaction.emoji.name === '🛑' && user.id === msg.author.id) {
						initialMessage.reactions.removeAll().catch(() => { });
						reactionCollector.stop();
					}
				});

				reactionCollector.on('end', () => {
					if (msg.id) {
						msg.reply(`Stopped tracking match \`${match.name.replace(/`/g, '')}\``);
					} else {
						interaction.editReply(`Stopped tracking match \`${match.name.replace(/`/g, '')}\``);
					}
				});

				reactionCollector.on('error', (error) => {
					console.log(error);
				});

				initialMessage.react('🛑');
				console.log(match);
			})
			.catch(err => {
				if (err.message === 'Not found') {
					if (msg.id) {
						return msg.reply(`Could not find match \`${args[0].replace(/`/g, '')}\`.`);
					} else {
						return interaction.editReply(`Could not find match \`${args[0].replace(/`/g, '')}\`.`);
					}
				} else {
					console.log(err);
				}
			});
	},
};