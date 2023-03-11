const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');
const { getMods, getModBits } = require('../utils.js');

module.exports = {
	name: 'osu-mappool',
	description: 'Allows you to manage and view mappools',
	botPermissions: PermissionsBitField.Flags.SendMessages,
	botPermissionsTranslated: 'Send Messages',
	cooldown: 5,
	tags: 'osu',
	data: new SlashCommandBuilder()
		.setName('osu-mappool')
		.setNameLocalizations({
			'de': 'osu-mappool',
			'en-GB': 'osu-mappool',
			'en-US': 'osu-mappool',
		})
		.setDescription('Allows you to manage and view mappools')
		.setDescriptionLocalizations({
			'de': 'Ermöglicht es dir, Mappools zu verwalten und anzuzeigen',
			'en-GB': 'Allows you to manage and view mappools',
			'en-US': 'Allows you to manage and view mappools',
		})
		.setDMPermission(true)
		.addSubcommand(subcommand =>
			subcommand.setName('create')
				.setNameLocalizations({
					'de': 'erstellen',
					'en-GB': 'create',
					'en-US': 'create',
				})
				.setDescription('Creates a new mappool')
				.setDescriptionLocalizations({
					'de': 'Erstellt einen neuen Mappool',
					'en-GB': 'Creates a new mappool',
					'en-US': 'Creates a new mappool',
				})
				.addStringOption(option =>
					option.setName('name')
						.setNameLocalizations({
							'de': 'name',
							'en-GB': 'name',
							'en-US': 'name',
						})
						.setDescription('The name of the mappool')
						.setDescriptionLocalizations({
							'de': 'Der Name des Mappools',
							'en-GB': 'The name of the mappool',
							'en-US': 'The name of the mappool',
						})
						.setRequired(true)
				)
				.addStringOption(option =>
					option.setName('modpool1')
						.setNameLocalizations({
							'de': 'modpool1',
							'en-GB': 'modpool1',
							'en-US': 'modpool1',
						})
						.setDescription('The first modpool')
						.setDescriptionLocalizations({
							'de': 'Der erste Modpool',
							'en-GB': 'The first modpool',
							'en-US': 'The first modpool',
						})
						.setRequired(true)
				)
				.addStringOption(option =>
					option.setName('modpool1maps')
						.setNameLocalizations({
							'de': 'modpool1maps',
							'en-GB': 'modpool1maps',
							'en-US': 'modpool1maps',
						})
						.setDescription('The maps for the first modpool')
						.setDescriptionLocalizations({
							'de': 'Die Maps für den ersten Modpool',
							'en-GB': 'The maps for the first modpool',
							'en-US': 'The maps for the first modpool',
						})
						.setRequired(true)
				)
				.addStringOption(option =>
					option.setName('modpool2')
						.setNameLocalizations({
							'de': 'modpool2',
							'en-GB': 'modpool2',
							'en-US': 'modpool2',
						})
						.setDescription('The second modpool')
						.setDescriptionLocalizations({
							'de': 'Der zweite Modpool',
							'en-GB': 'The second modpool',
							'en-US': 'The second modpool',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option.setName('modpool2maps')
						.setNameLocalizations({
							'de': 'modpool2maps',
							'en-GB': 'modpool2maps',
							'en-US': 'modpool2maps',
						})
						.setDescription('The maps for the second modpool')
						.setDescriptionLocalizations({
							'de': 'Die Maps für den zweiten Modpool',
							'en-GB': 'The maps for the second modpool',
							'en-US': 'The maps for the second modpool',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option.setName('modpool3')
						.setNameLocalizations({
							'de': 'modpool3',
							'en-GB': 'modpool3',
							'en-US': 'modpool3',
						})
						.setDescription('The third modpool')
						.setDescriptionLocalizations({
							'de': 'Der dritte Modpool',
							'en-GB': 'The third modpool',
							'en-US': 'The third modpool',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option.setName('modpool3maps')
						.setNameLocalizations({
							'de': 'modpool3maps',
							'en-GB': 'modpool3maps',
							'en-US': 'modpool3maps',
						})
						.setDescription('The maps for the third modpool')
						.setDescriptionLocalizations({
							'de': 'Die Maps für den dritten Modpool',
							'en-GB': 'The maps for the third modpool',
							'en-US': 'The maps for the third modpool',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option.setName('modpool4')
						.setNameLocalizations({
							'de': 'modpool4',
							'en-GB': 'modpool4',
							'en-US': 'modpool4',
						})
						.setDescription('The fourth modpool')
						.setDescriptionLocalizations({
							'de': 'Der vierte Modpool',
							'en-GB': 'The fourth modpool',
							'en-US': 'The fourth modpool',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option.setName('modpool4maps')
						.setNameLocalizations({
							'de': 'modpool4maps',
							'en-GB': 'modpool4maps',
							'en-US': 'modpool4maps',
						})
						.setDescription('The maps for the fourth modpool')
						.setDescriptionLocalizations({
							'de': 'Die Maps für den vierten Modpool',
							'en-GB': 'The maps for the fourth modpool',
							'en-US': 'The maps for the fourth modpool',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option.setName('modpool5')
						.setNameLocalizations({
							'de': 'modpool5',
							'en-GB': 'modpool5',
							'en-US': 'modpool5',
						})
						.setDescription('The fifth modpool')
						.setDescriptionLocalizations({
							'de': 'Der fünfte Modpool',
							'en-GB': 'The fifth modpool',
							'en-US': 'The fifth modpool',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option.setName('modpool5maps')
						.setNameLocalizations({
							'de': 'modpool5maps',
							'en-GB': 'modpool5maps',
							'en-US': 'modpool5maps',
						})
						.setDescription('The maps for the fifth modpool')
						.setDescriptionLocalizations({
							'de': 'Die Maps für den fünften Modpool',
							'en-GB': 'The maps for the fifth modpool',
							'en-US': 'The maps for the fifth modpool',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option.setName('modpool6')
						.setNameLocalizations({
							'de': 'modpool6',
							'en-GB': 'modpool6',
							'en-US': 'modpool6',
						})
						.setDescription('The sixth modpool')
						.setDescriptionLocalizations({
							'de': 'Der sechste Modpool',
							'en-GB': 'The sixth modpool',
							'en-US': 'The sixth modpool',
						})
						.setRequired(false)
				)
				.addStringOption(option =>
					option.setName('modpool6maps')
						.setNameLocalizations({
							'de': 'modpool6maps',
							'en-GB': 'modpool6maps',
							'en-US': 'modpool6maps',
						})
						.setDescription('The maps for the sixth modpool')
						.setDescriptionLocalizations({
							'de': 'Die Maps für den sechsten Modpool',
							'en-GB': 'The maps for the sixth modpool',
							'en-US': 'The maps for the sixth modpool',
						})
						.setRequired(false)
				)
		),
	async execute(msg, args, interaction) {
		try {
			await interaction.deferReply();
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			const timestamps = interaction.client.cooldowns.get(this.name);
			timestamps.delete(interaction.user.id);
			return;
		}

		let modPools = [];

		for (let i = 0; i < 6; i++) {
			modPools.push({
				mod: interaction.options.getString(`modpool${i + 1}`),
				maps: interaction.options.getString(`modpool${i + 1}maps`),
			});
		}

		modPools = modPools.filter(modPool => modPool.mod !== null || modPool.maps !== null);

		let uniqueModPools = [...new Set(modPools.map(modPool => modPool.mod))];

		if (uniqueModPools.length !== modPools.length) {
			return interaction.editReply({ content: 'You can\'t have the same modpool twice!' });
		}

		for (let i = 0; i < modPools.length; i++) {
			if (checkViableModpool(modPools[i].mod) === false) {
				return await interaction.editReply({ content: `\`${modPools.mod.replace(/`/g, '')}\` is not a valid modpool.` });
			}

			if (modPools[i].maps === null) {
				return await interaction.editReply({ content: `You need to specify the maps for \`${modPools[i].mod.replace(/`/g, '')}\`` });
			}

			if (modPools[i].mod === null) {
				return await interaction.editReply({ content: `You need to specify the modpool for \`${modPools[i].maps.replace(/`/g, '')}\`` });
			}
		}


	},
};

function checkViableModpool(modPool) {
	if (modPool === null) {
		return null;
	}

	modPool = modPool.toUpperCase();

	if (getMods(getModBits(modPool)).join(' ') !== modPool) {
		return false;
	}

	return modPool;
}