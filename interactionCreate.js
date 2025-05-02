const Discord = require('discord.js');
const fs = require('fs');
const cooldowns = new Discord.Collection();
const { PermissionsBitField, MessageFlags } = require('discord.js');
const { developers, salesmen } = require('./config.json');

module.exports = async function (client, interaction) {
	process.send(`discorduser ${interaction.user.id}}`);

	//Create a collection for the commands
	client.commands = new Discord.Collection();

	//get all command files
	const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

	//Add the commands from the command files to the client.commands collection
	for (const file of commandFiles) {
		const command = require(`./commands/${file}`);

		// set a new item in the Collection
		// with the key as the command name and the value as the exported module
		client.commands.set(command.name, command);
	}

	if (interaction.isCommand()) {
		//Set the command and check for possible uses of aliases
		let command = client.commands.get(interaction.commandName)
			|| client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(interaction.commandName));

		//Check permissions of the bot
		if (interaction.guildId) {
			let member = interaction.guild.members.cache.get(client.user.id);

			while (!member) {
				try {
					member = await interaction.guild.members.fetch({ user: [client.user.id], time: 300000 })
						.catch((err) => {
							throw new Error(err);
						});

					member = member.first();
				} catch (e) {
					if (e.message !== 'Members didn\'t arrive in time.') {
						console.error('interactionCreate.js | Check bot permissions', e);
						return;
					}
				}
			}

			const botPermissions = interaction.channel.permissionsFor(member);
			if (!botPermissions || !botPermissions.has(PermissionsBitField.Flags.ViewChannel)) {
				//The bot can't possibly answer the message
				return await interaction.reply({ content: 'I can\'t view this channel.', flags: MessageFlags.Ephemeral });
			}

			//Check the command permissions
			if (command.botPermissions) {
				if (!botPermissions.has(command.botPermissions)) {
					return await interaction.reply({ content: `I need the ${command.botPermissionsTranslated} permission to do this!`, flags: MessageFlags.Ephemeral });
				}
			}
		}

		//Check if the cooldown collection has the command already; if not write it in
		if (!cooldowns.has(command.name)) {
			cooldowns.set(command.name, new Discord.Collection());
		}

		//Set current time
		const now = Date.now();
		//gets the collections for the current command used
		const timestamps = cooldowns.get(command.name);
		//set necessary cooldown amount; if non stated in command default to 5; calculate ms afterwards
		const cooldownAmount = (command.cooldown || 5) * 1000;

		//get expiration times for the cooldowns for the authorId
		if (timestamps.has(interaction.user.id)) {
			const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

			//If cooldown didn't expire yet send cooldown message
			if (command.noCooldownMessage) {
				return;
			} else if (now < expirationTime) {
				const timeLeft = (expirationTime - now) / 1000;
				try {
					await interaction.reply({ content: `Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`, flags: MessageFlags.Ephemeral });
				} catch (error) {
					if (error.message !== 'Unknown interaction') {
						console.error('interactionCreate.js | Cooldown message', error);
					}
				}
				return;
			}
		}

		//Set timestamp for the used command
		if (!developers.includes(interaction.user.id) && !salesmen.includes(interaction.user.id)) {
			timestamps.set(interaction.user.id, now);
		}
		//Automatically delete the timestamp after the cooldown
		setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

		interaction.client.cooldowns = cooldowns;

		process.send(`command ${command.name}`);
		// console.log(`${client.shardId} command ${command.name} ${interaction.options._subcommand}`);

		command.execute(null, [], interaction);
	} else if (interaction.isAutocomplete()) {
		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`interactionCreate.js | No command matching ${interaction.commandName} was found.`);
			return;
		}

		try {
			await command.autocomplete(interaction);
		} catch (error) {
			console.error('interactionCreate.js | autocomplete' + error);
		}
	}
};