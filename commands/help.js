const { getGuildPrefix } = require('../utils');

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
	async execute(msg, args) {
		//define variables
		const categories = ['general', 'server-admin', 'misc', 'osu'];

		//Developer
		if (msg.author.id === '138273136285057025') {
			categories.push('debug');
		}

		//ecw2021 player

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
				.then(() => {
					if (msg.channel.type === 'dm') return;
					msg.reply('I\'ve sent you a DM with all my commands!');
				})
				.catch(() => {
					msg.reply('it seems like I can\'t DM you! Do you have DMs disabled?');
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
				.then(() => {
					if (msg.channel.type === 'dm') return;
					msg.reply('I\'ve sent you a DM with all my commands!');
				})
				.catch(() => {
					msg.reply('it seems like I can\'t DM you! Do you have DMs disabled?');
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
		msg.channel.send(data, { split: true });
	},
};