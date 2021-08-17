const Discord = require('discord.js');
const fs = require('fs');
const cooldowns = new Discord.Collection();

module.exports = async function (client, bancho, interaction) {
	if (!interaction.isCommand()) return;
	//For the development version
	//if the message is not in the Dev-Servers then return
	// eslint-disable-next-line no-undef
	if (process.env.SERVER === 'Dev') {
		if (interaction.guildId != '800641468321759242' && interaction.guildId != '800641735658176553') {
			return;
		}
		//For the QA version
		//if the message is in the QA-Servers then return
		// eslint-disable-next-line no-undef
	} else if (process.env.SERVER === 'QA') {
		if (interaction.guildId != '800641367083974667' && interaction.guildId != '800641819086946344') {
			return;
		}
		//For the Live version
		//if the message is in the Dev/QA-Servers then return
		// eslint-disable-next-line no-undef
	} else if (process.env.SERVER === 'Live') {
		if (interaction.guildId === '800641468321759242' || interaction.guildId === '800641735658176553' || interaction.guildId === '800641367083974667' || interaction.guildId === '800641819086946344') {
			return;
		}
	}

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

	//Set the command and check for possible uses of aliases
	let command = client.commands.get(interaction.commandName)
		|| client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(interaction.commandName));

	//Check if the command can't be used outside of DMs
	if (command.guildOnly && !interaction.guildId) {
		return interaction.reply({ content: 'I can\'t execute that command inside DMs!', ephemeral: true });
	}

	//Check permissions of the user
	if (command.permissions) {
		const authorPerms = interaction.channel.permissionsFor(interaction.member);
		if (!authorPerms || !authorPerms.has(command.permissions)) {
			return interaction.reply({ content: `You need the ${command.permissionsTranslated} permission to do this!`, ephemeral: true });
		}
	}

	//Check permissions of the bot
	if (interaction.guild_id) {
		if (command.botPermissions) {
			const botPermissions = interaction.channel.permissionsFor(await interaction.guild.members.fetch('784836063058329680'));
			if (!botPermissions.has(command.botPermissions)) {
				return interaction.reply({ content: `I need the ${command.botPermissionsTranslated} permission to do this!`, ephemeral: true });
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

	//get expiration times for the cooldowns for the authorID
	if (timestamps.has(interaction.user.id)) {
		const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

		//If cooldown didn't expire yet send cooldown message
		if (command.noCooldownMessage) {
			return;
		} else if (now < expirationTime) {
			const timeLeft = (expirationTime - now) / 1000;
			return interaction.reply({ content: `Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`, ephemeral: true });
		}
	}

	//Set timestamp for the used command
	if (interaction.user.id !== '138273136285057025') {
		timestamps.set(interaction.user.id, now);
	}
	//Automatically delete the timestamp after the cooldown
	setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

	try {
		let additionalObjects = [client, bancho];
		command.execute(null, [], interaction, additionalObjects);
	} catch (error) {
		console.error(error);
		const eliteronixUser = await client.users.cache.find(user => user.id === '138273136285057025');
		interaction.reply('There was an error trying to execute that command. The developer has been alerted.');
		eliteronixUser.send(`There was an error trying to execute a command.\n\nMessage by ${interaction.user.username}#${interaction.user.discriminator}: \`${interaction.commandName}\`\n\n${error}`);
	}
};