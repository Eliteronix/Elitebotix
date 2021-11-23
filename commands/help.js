const { DBElitiriCupSignUp } = require('../dbObjects');
const { getGuildPrefix, populateMsgFromInteraction, logDatabaseQueries } = require('../utils');
const { developers } = require('../config.json');

module.exports = {
	name: 'help',
	aliases: ['commands'],
	description: 'List all commands or get info about a specific command.',
	usage: '[command name]',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	//guildOnly: true,
	//args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'general',
	prefixCommand: true,
	async execute(msg, args, interaction) {
		if (interaction) {
			if (interaction.options._subcommand !== 'list') {
				args.push(interaction.options._hoistedOptions[0].value);
			}

			msg = await populateMsgFromInteraction(interaction);
		}
		//define variables
		const categories = ['general', 'server-admin', 'misc', 'osu'];

		//Developer
		if (developers.includes(msg.author.id)) {
			categories.push('debug');
		}

		//ecs2021 player
		logDatabaseQueries(4, 'commands/help.js DBElitiriCupSignUp');
		const elitiriSignUp = await DBElitiriCupSignUp.findOne({
			where: { tournamentName: 'Elitiri Cup Summer 2021', userId: msg.author.id }
		});

		if (elitiriSignUp) {
			categories.push('ecs2021');
		}

		const data = [];
		const { commands } = msg.client;

		let guildPrefix = await getGuildPrefix(msg);

		//Check if all the general commands should be returned
		if (!args.length) {
			data.push('Here\'s a list of all my `general` commands:');
			//filter commands collection for noCooldownMessage and push the result
			data.push('`' + commands.filter(commands => commands.tags === 'general').map(command => command.name).join('`, `'));
			data.push(`\`\nYou can send \`${guildPrefix}help [command name]\` to get info on a specific command!`);
			data.push(`\nAll the command categories: \`${categories.join('`, `')}\`\nYou can send \`${guildPrefix}help [category name]\` to get a list of commands for a specific category!`);
			data.push('\nTo stay informed about changes go to <https://discord.com/invite/Asz5Gfe> and follow <#804658828883787784>');

			//Send all the commands (Split the message into multiple pieces if necessary)
			return msg.author.send(data.join('\n'), { split: true })
				.then(async () => {
					if (msg.id) {
						if (msg.channel.type === 'DM') return;
						msg.reply('I\'ve sent you a DM with all my commands!');
					} else if (interaction) {
						if (!interaction.channel.type === 'DM') {
							return interaction.reply({ content: 'Help info will be sent', ephemeral: true });
						}
						await interaction.reply({ content: 'I\'ve sent you a DM with all my commands!', ephemeral: true });
					}
				})
				.catch(() => {
					if (msg.id) {
						return msg.reply('it seems like I can\'t DM you! Do you have DMs disabled?');
					}
					return interaction.reply({ content: 'It seems like I can\'t DM you! Do you have DMs disabled?', ephemeral: true });
				});
		} else if (categories.includes(args[0])) {
			data.push(`Here's a list of all my \`${args[0]}\` commands:`);
			//filter commands collection for noCooldownMessage and push the result
			data.push('`' + commands.filter(commands => commands.tags === args[0]).map(command => command.name).join('`, `'));
			data.push(`\`\nYou can send \`${guildPrefix}help [command name]\` to get info on a specific command!`);
			data.push(`\nAll the command categories: \`${categories.join('`, `')}\`\nYou can send \`${guildPrefix}help [category name]\` to get a list of commands for a specific category!`);
			data.push('\nTo stay informed about changes go to <https://discord.com/invite/Asz5Gfe> and follow <#804658828883787784>');

			//Send all the commands (Split the message into multiple pieces if necessary)
			return msg.author.send(data.join('\n'), { split: true })
				.then(async () => {
					if (msg.id) {
						if (msg.channel.type === 'DM') return;
						msg.reply('I\'ve sent you a DM with all my commands!');
					} else if (interaction) {
						if (!interaction.channel.type === 'DM') {
							return interaction.reply({ content: 'Help info will be sent', ephemeral: true });
						}
						await interaction.reply({ content: 'I\'ve sent you a DM with all my commands!', ephemeral: true });
					}
				})
				.catch(() => {
					if (msg.id) {
						return msg.reply('it seems like I can\'t DM you! Do you have DMs disabled?');
					}
					return interaction.reply({ content: 'It seems like I can\'t DM you! Do you have DMs disabled?', ephemeral: true });
				});
		}

		//Get given command name written or when aliases used
		const name = args[0].toLowerCase();
		const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));

		//Send message if no valid command
		if (!command) {
			return msg.reply('that\'s not a valid command!');
		}

		//Push information about the command + extra information if necessary
		data.push(`**Name:** ${command.name}`);
		if (command.aliases) data.push(`**Aliases:** \`${command.aliases.join('`, `')}\``);
		if (command.description) data.push(`**Description:** ${command.description}`);
		if (command.usage) data.push(`**Usage:** \`${guildPrefix}${command.name} ${command.usage}\``);
		data.push(`**Cooldown:** ${command.cooldown || 3} second(s)`);

		//Send the information
		if (interaction) {
			return interaction.reply({ content: data.join('\n'), ephemeral: true });
		}
		return msg.reply(data.join('\n'), { split: true });
	},
};