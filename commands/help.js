const { DBElitiriCupSignUp } = require('../dbObjects');
const { getGuildPrefix, populateMsgFromInteraction } = require('../utils');

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
	async execute(msg, args, interaction, additionalObjects) {
		if (interaction) {
			if (interaction.data.options[0].name !== 'list') {
				args.push(interaction.data.options[0].options[0].value);
			}

			msg = await populateMsgFromInteraction(additionalObjects[0], interaction);
		}
		//define variables
		const categories = ['general', 'server-admin', 'misc', 'osu'];

		//Developer
		if (msg.author.id === '138273136285057025') {
			categories.push('debug');
		}

		//ecs2021 player
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
			return msg.author.send(data, { split: true })
				.then(async () => {
					if (msg.id) {
						if (msg.channel.type === 'dm') return;
						msg.reply('I\'ve sent you a DM with all my commands!');
					} else if (interaction) {
						if (!interaction.guild_id) {
							return await additionalObjects[0].api.interactions(interaction.id, interaction.token).callback.post({
								data: {
									type: 4,
									data: {
										content: 'Help info will be sent'
									}
								}
							});
						}
						await additionalObjects[0].api.interactions(interaction.id, interaction.token).callback.post({
							data: {
								type: 4,
								data: {
									content: 'I\'ve sent you a DM with all my commands!'
								}
							}
						});
					}
				})
				.catch(() => {
					if (msg.id) {
						return msg.reply('it seems like I can\'t DM you! Do you have DMs disabled?');
					}
					return additionalObjects[0].api.interactions(interaction.id, interaction.token).callback.post({
						data: {
							type: 4,
							data: {
								content: 'It seems like I can\'t DM you! Do you have DMs disabled?'
							}
						}
					});
				});
		} else if (categories.includes(args[0])) {
			data.push(`Here's a list of all my \`${args[0]}\` commands:`);
			//filter commands collection for noCooldownMessage and push the result
			data.push('`' + commands.filter(commands => commands.tags === args[0]).map(command => command.name).join('`, `'));
			data.push(`\`\nYou can send \`${guildPrefix}help [command name]\` to get info on a specific command!`);
			data.push(`\nAll the command categories: \`${categories.join('`, `')}\`\nYou can send \`${guildPrefix}help [category name]\` to get a list of commands for a specific category!`);
			data.push('\nTo stay informed about changes go to <https://discord.com/invite/Asz5Gfe> and follow <#804658828883787784>');

			//Send all the commands (Split the message into multiple pieces if necessary)
			return msg.author.send(data, { split: true })
				.then(async () => {
					if (msg.id) {
						if (msg.channel.type === 'dm') return;
						msg.reply('I\'ve sent you a DM with all my commands!');
					} else if (interaction) {
						if (!interaction.guild_id) {
							return await additionalObjects[0].api.interactions(interaction.id, interaction.token).callback.post({
								data: {
									type: 4,
									data: {
										content: 'Help info will be sent'
									}
								}
							});
						}
						await additionalObjects[0].api.interactions(interaction.id, interaction.token).callback.post({
							data: {
								type: 4,
								data: {
									content: 'I\'ve sent you a DM with all my commands!'
								}
							}
						});
					}
				})
				.catch(() => {
					if (msg.id) {
						return msg.reply('it seems like I can\'t DM you! Do you have DMs disabled?');
					}
					return additionalObjects[0].api.interactions(interaction.id, interaction.token).callback.post({
						data: {
							type: 4,
							data: {
								content: 'It seems like I can\'t DM you! Do you have DMs disabled?'
							}
						}
					});
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
			return additionalObjects[0].api.interactions(interaction.id, interaction.token).callback.post({
				data: {
					type: 4,
					data: {
						content: `${args[0]} info will be sent`
					}
				}
			});
		}
		return msg.channel.send(data, { split: true });
	},
};