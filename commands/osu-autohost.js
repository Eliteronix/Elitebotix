const { populateMsgFromInteraction, getOsuUserServerMode } = require('../utils');
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { DBElitebotixBanchoProcessQueue, } = require('../dbObjects');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'osu-autohost',
	description: 'Hosts an automated lobby ingame',
	botPermissions: [PermissionsBitField.Flags.SendMessages],
	botPermissionsTranslated: 'Send Messages',
	cooldown: 60,
	tags: 'osu',
	data: new SlashCommandBuilder()
		.setName('osu-autohost')
		.setNameLocalizations({
			'de': 'osu-autohost',
			'en-GB': 'osu-autohost',
			'en-US': 'osu-autohost',
		})
		.setDescription('Hosts an automated lobby ingame')
		.setDescriptionLocalizations({
			'de': 'Hostet eine automatisierte Lobby ingame',
			'en-GB': 'Hosts an automated lobby ingame',
			'en-US': 'Hosts an automated lobby ingame',
		})
		.setDMPermission(true)
		.addStringOption(option =>
			option.setName('password')
				.setNameLocalizations({
					'de': 'passwort',
					'en-GB': 'password',
					'en-US': 'password',
				})
				.setDescription('Leave empty for a public room')
				.setDescriptionLocalizations({
					'de': 'Leer lassen für eine öffentliche Lobby',
					'en-GB': 'Leave empty for a public room',
					'en-US': 'Leave empty for a public room',
				})
				.setRequired(false)
		)
		.addStringOption(option =>
			option.setName('condition')
				.setNameLocalizations({
					'de': 'bedingung',
					'en-GB': 'condition',
					'en-US': 'condition',
				})
				.setDescription('What is the winning condition of the match?')
				.setDescriptionLocalizations({
					'de': 'Was ist die Gewinnbedingung des Matches?',
					'en-GB': 'What is the winning condition of the match?',
					'en-US': 'What is the winning condition of the match?',
				})
				.setRequired(false)
				.addChoices(
					{ name: 'Score v1', value: '0' },
					{ name: 'Score v2', value: '3' },
					{ name: 'Accuracy', value: '1' },
				)
		)
		.addStringOption(option =>
			option.setName('mods')
				.setNameLocalizations({
					'de': 'mods',
					'en-GB': 'mods',
					'en-US': 'mods',
				})
				.setDescription('The active modpools to be chosen from (Ex: "NM,HR,DT")')
				.setDescriptionLocalizations({
					'de': 'Die aktiven Modpools aus denen ausgewählt werden kann (z.B.: "NM,HR,DT")',
					'en-GB': 'The active modpools to be chosen from (Ex: "NM,HR,DT")',
					'en-US': 'The active modpools to be chosen from (Ex: "NM,HR,DT")',
				})
				.setRequired(false)
		)
		.addNumberOption(option =>
			option.setName('nmstarrating')
				.setNameLocalizations({
					'de': 'nmschwierigkeit',
					'en-GB': 'nmstarrating',
					'en-US': 'nmstarrating',
				})
				.setDescription('A custom difficulty for NM maps')
				.setDescriptionLocalizations({
					'de': 'Eine benutzerdefinierte Schwierigkeit für NM Maps',
					'en-GB': 'A custom difficulty for NM maps',
					'en-US': 'A custom difficulty for NM maps',
				})
				.setRequired(false)
		)
		.addNumberOption(option =>
			option.setName('hdstarrating')
				.setNameLocalizations({
					'de': 'hdschwierigkeit',
					'en-GB': 'hdstarrating',
					'en-US': 'hdstarrating',
				})
				.setDescription('A custom difficulty for HD maps')
				.setDescriptionLocalizations({
					'de': 'Eine benutzerdefinierte Schwierigkeit für HD Maps',
					'en-GB': 'A custom difficulty for HD maps',
					'en-US': 'A custom difficulty for HD maps',
				})
				.setRequired(false)
		)
		.addNumberOption(option =>
			option.setName('hrstarrating')
				.setNameLocalizations({
					'de': 'hrschwierigkeit',
					'en-GB': 'hrstarrating',
					'en-US': 'hrstarrating',
				})
				.setDescription('A custom difficulty for HR maps')
				.setDescriptionLocalizations({
					'de': 'Eine benutzerdefinierte Schwierigkeit für HR Maps',
					'en-GB': 'A custom difficulty for HR maps',
					'en-US': 'A custom difficulty for HR maps',
				})
				.setRequired(false)
		)
		.addNumberOption(option =>
			option.setName('dtstarrating')
				.setNameLocalizations({
					'de': 'dtschwierigkeit',
					'en-GB': 'dtstarrating',
					'en-US': 'dtstarrating',
				})
				.setDescription('A custom difficulty for DT maps')
				.setDescriptionLocalizations({
					'de': 'Eine benutzerdefinierte Schwierigkeit für DT Maps',
					'en-GB': 'A custom difficulty for DT maps',
					'en-US': 'A custom difficulty for DT maps',
				})
				.setRequired(false)
		)
		.addNumberOption(option =>
			option.setName('fmstarrating')
				.setNameLocalizations({
					'de': 'fmschwierigkeit',
					'en-GB': 'fmstarrating',
					'en-US': 'fmstarrating',
				})
				.setDescription('A custom difficulty for FM maps')
				.setDescriptionLocalizations({
					'de': 'Eine benutzerdefinierte Schwierigkeit für FM Maps',
					'en-GB': 'A custom difficulty for FM maps',
					'en-US': 'A custom difficulty for FM maps',
				})
				.setRequired(false)
		),
	async execute(msg, args, interaction, additionalObjects) {
		let settings = {};

		settings.interaction = interaction.token;
		settings.messageId = interaction.id;

		try {
			await interaction.deferReply({ ephemeral: true });
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			const timestamps = interaction.client.cooldowns.get(this.name);
			timestamps.delete(interaction.user.id);
			return;
		}

		msg = await populateMsgFromInteraction(interaction);

		args = [];

		for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
			if (interaction.options._hoistedOptions[i].name === 'password') {
				settings.password = interaction.options._hoistedOptions[i].value;
			} else if (interaction.options._hoistedOptions[i].name === 'condition') {
				settings.winCondition = interaction.options._hoistedOptions[i].value;
			} else if (interaction.options._hoistedOptions[i].name === 'mods') {
				settings.modsInput = interaction.options._hoistedOptions[i].value;
			} else if (interaction.options._hoistedOptions[i].name === 'nmstarrating') {
				settings.nmStarRating = interaction.options._hoistedOptions[i].value;
			} else if (interaction.options._hoistedOptions[i].name === 'hdstarrating') {
				settings.hdStarRating = interaction.options._hoistedOptions[i].value;
			} else if (interaction.options._hoistedOptions[i].name === 'hrstarrating') {
				settings.hrStarRating = interaction.options._hoistedOptions[i].value;
			} else if (interaction.options._hoistedOptions[i].name === 'dtstarrating') {
				settings.dtStarRating = interaction.options._hoistedOptions[i].value;
			} else if (interaction.options._hoistedOptions[i].name === 'fmstarrating') {
				settings.fmStarRating = interaction.options._hoistedOptions[i].value;
			}
		}


		//get the commandUser
		const commandConfig = await getOsuUserServerMode(msg, []);
		let commandUser = commandConfig[0];

		if (!commandUser || commandUser && !commandUser.osuUserId || commandUser && commandUser.osuVerified !== true) {
			return await interaction.editReply(`Please connect and verify your account with the bot on discord as a backup by using: </osu-link connect:${interaction.client.slashCommandData.find(command => command.name === 'osu-link').id}> [https://discord.gg/Asz5Gfe Discord]`);
		}

		return await DBElitebotixBanchoProcessQueue.create({
			task: 'autohost',
			additions: `${commandUser.osuUserId};${JSON.stringify(settings)}`,
			date: new Date(),
		});
	},
};