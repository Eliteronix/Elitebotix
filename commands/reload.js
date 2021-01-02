module.exports = {
	name: 'reload',
	//aliases: ['developer'],
	description: 'Reloads a command',
	usage: '<command>',
	//permissions: 'MANAGE_MESSAGES',
	//permissionsTranslated: 'Manage Server',
	//guildOnly: true,
	args: true,
	cooldown: 5,
	noCooldownMessage: true,
	execute(msg, args, prefixCommand) {
		if (prefixCommand) {
			//get command to refresh
			const commandName = args[0].toLowerCase();
			const command = msg.client.commands.get(commandName)
                || msg.client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

			//Send message if no command with that name was found
			if (!command) return msg.channel.send(`There is no command with name or alias \`${commandName}\`, ${msg.author}!`);

			//Delete the old command file from the cache
			delete require.cache[require.resolve(`./${command.name}.js`)];
        
			//try to grab the new command file and add it to the commands collection
			try {
				const newCommand = require(`./${command.name}.js`);
				msg.client.commands.set(newCommand.name, newCommand);
			} catch (error) {
				console.error(error);
				msg.channel.send(`There was an error while reloading a command \`${command.name}\`:\n\`${error.msg}\``);
			}

			//Send that the command was reloaded
			msg.channel.send(`Command \`${command.name}\` was reloaded!`);
		}
	},
};