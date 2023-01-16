const { getGuildPrefix, updateServerUserActivity, saveOsuMultiScores, isWrongSystem, logDatabaseQueries } = require('./utils');
const fs = require('fs');
const Discord = require('discord.js');
const osu = require('node-osu');
const cooldowns = new Discord.Collection();
const { closest } = require('fastest-levenshtein');
const { Permissions } = require('discord.js');
const { DBElitiriCupSignUp, DBTickets } = require('./dbObjects');
const { developers, currentElitiriCup } = require('./config.json');

module.exports = async function (msg, bancho) {
	//check if the message wasn't sent by the bot itself or another bot
	if (!(msg.author.bot) || msg.channel.id === '892873577479692358') {
		//Create a collection for the commands
		msg.client.commands = new Discord.Collection();

		//get all command files
		const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

		//Add the commands from the command files to the client.commands collection
		for (const file of commandFiles) {
			const command = require(`./commands/${file}`);

			// set a new item in the Collection
			// with the key as the command name and the value as the exported module
			msg.client.commands.set(command.name, command);
		}

		if (isWrongSystem(msg.guildId, msg.channel.type === 'DM')) {
			return;
		}

		//Update user activity
		updateServerUserActivity(msg);

		//Handle Ticket
		handleTicketStatus(msg);

		const guildPrefix = await getGuildPrefix(msg);

		//Define if it is a command with prefix
		//Split the message into an args array
		let prefixCommand = false;
		let args;
		if (msg.content.startsWith(guildPrefix)) {
			prefixCommand = true;
			args = msg.content.slice(guildPrefix.length).trim().split(/ +/);
		} else {
			args = msg.content.trim().split(/ +/);
		}

		//Save all osu! matches when found
		saveSentOsuMatches(msg, args);

		//Delete the first item from the args array and use it for the command variable
		let commandName = args.shift().toLowerCase();

		//Set the command and check for possible uses of aliases
		let command = msg.client.commands.get(commandName)
			|| msg.client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

		if (!command) {
			return;
		}

		//Check if prefix has to be used or not
		if (!prefixCommand) return;

		//Check if the command can't be used outside of DMs
		if (command.guildOnly && msg.channel.type === 'DM') {
			return msg.reply('I can\'t execute that command inside DMs!');
		}

		//Check permissions of the user
		if (command.permissions) {
			const authorPerms = msg.channel.permissionsFor(msg.member);
			if (!authorPerms || !authorPerms.has(command.permissions)) {
				return msg.reply(`You need the ${command.permissionsTranslated} permission to do this!`);
			}
		}

		//Check permissions of the bot
		if (msg.channel.type !== 'DM') {
			const botPermissions = msg.channel.permissionsFor(await msg.guild.members.fetch(msg.client.user.id));
			if (!botPermissions || !botPermissions.has(Permissions.FLAGS.SEND_MESSAGES) || !botPermissions.has(Permissions.FLAGS.READ_MESSAGE_HISTORY)) {
				//The bot can't possibly answer the message
				return;
			}

			//Check the command permissions
			if (command.botPermissions) {
				if (!botPermissions.has(command.botPermissions)) {
					return msg.reply(`I need the ${command.botPermissionsTranslated} permission to do this!`);
				}
			}
		}

		//Check if arguments are provided if needed
		if (command.args && !args.length) {
			//Set standard reply
			let reply = 'You didn\'t provide any arguments.';

			//Set reply with usage if needed.
			if (command.usage) {
				reply += `\nThe proper usage would be: \`${guildPrefix}${command.name} ${command.usage}\``;
			}

			//Send message
			return msg.reply(reply);
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
		if (timestamps.has(msg.author.id)) {
			const expirationTime = timestamps.get(msg.author.id) + cooldownAmount;

			//If cooldown didn't expire yet send cooldown message
			if (command.noCooldownMessage) {
				return;
			} else if (now < expirationTime) {
				const timeLeft = (expirationTime - now) / 1000;
				return msg.reply(`Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
			}
		}

		//Set timestamp for the used command
		if (!developers.includes(msg.author.id)) {
			timestamps.set(msg.author.id, now);
		}
		//Automatically delete the timestamp after the cooldown
		setTimeout(() => timestamps.delete(msg.author.id), cooldownAmount);

		try {
			let additionalObjects = [msg.client, bancho];
			command.execute(msg, args, null, additionalObjects);
		} catch (error) {
			console.error(error);
			const eliteronixUser = await msg.client.users.cache.find(user => user.id === '138273136285057025');
			msg.reply('There was an error trying to execute that command. The developers have been alerted.');
			eliteronixUser.send(`There was an error trying to execute a command.\n\nMessage by ${msg.author.username}#${msg.author.discriminator}: \`${msg.content}\`\n\n${error}`);
		}
	}
};

async function handleTicketStatus(msg) {
	logDatabaseQueries(3, 'gotMessage.js DBTickets');
	const ticket = await DBTickets.findOne({
		where: { channelId: msg.channel.id, creatorId: msg.author.id }
	});

	if (ticket && ticket.statusId !== 0 && ticket.statusId !== 75 && ticket.statusId !== 100) {
		ticket.statusId = 75;
		ticket.statusName = 'Awaiting Response';
		ticket.save();

		//Move the channel to the correct category
		let awaitingResponseCategory = msg.guild.channels.cache.find(c => c.type === 'GUILD_CATEGORY' && c.name === 'Tickets - Awaiting Response');
		if (!awaitingResponseCategory) {
			awaitingResponseCategory = await msg.guild.channels.create('Tickets - Awaiting Response', { type: 'GUILD_CATEGORY' });
			await awaitingResponseCategory.permissionOverwrites.set([
				{
					id: msg.guild.roles.everyone.id,
					deny: ['VIEW_CHANNEL', 'MANAGE_CHANNELS', 'MANAGE_ROLES', 'CREATE_INSTANT_INVITE', 'MANAGE_WEBHOOKS', 'MANAGE_MESSAGES', 'SEND_TTS_MESSAGES'],
				},
			]);
			let openCategory = msg.guild.channels.cache.find(c => c.type === 'GUILD_CATEGORY' && c.name === 'Tickets - Open');
			let position = 0;
			if (openCategory) {
				position++;
			}
			let respondedCategory = msg.guild.channels.cache.find(c => c.type === 'GUILD_CATEGORY' && c.name === 'Tickets - Responded');
			if (respondedCategory) {
				position++;
			}
			let inActionCategory = msg.guild.channels.cache.find(c => c.type === 'GUILD_CATEGORY' && c.name === 'Tickets - In Action');
			if (inActionCategory) {
				position++;
			}
			await awaitingResponseCategory.setPosition(position);
		}
		await msg.channel.setParent(awaitingResponseCategory);


		let permissions = [
			{
				id: ticket.creatorId,
				allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES', 'ADD_REACTIONS', 'USE_EXTERNAL_EMOJIS', 'MENTION_EVERYONE', 'READ_MESSAGE_HISTORY'],
			},
			{
				id: msg.channel.guild.roles.everyone.id,
				deny: ['VIEW_CHANNEL', 'MANAGE_CHANNELS', 'MANAGE_ROLES', 'CREATE_INSTANT_INVITE', 'MANAGE_WEBHOOKS', 'MANAGE_MESSAGES', 'SEND_TTS_MESSAGES'],
			},
		];

		if (ticket.additionalParties) {
			let parties = ticket.additionalParties.split(';');

			parties.forEach(async (party) => {
				if (!isNaN(party)) {
					permissions.push(
						{
							id: party,
							allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES', 'ADD_REACTIONS', 'USE_EXTERNAL_EMOJIS', 'MENTION_EVERYONE', 'READ_MESSAGE_HISTORY'],
						}
					);
				}
			});
		}

		await msg.channel.permissionOverwrites.set(permissions);

		let openCategory = msg.guild.channels.cache.find(c => c.type === 'GUILD_CATEGORY' && c.name === 'Tickets - Open');
		if (openCategory && !openCategory.children.first()) {
			openCategory.delete();
		}
		let respondedCategory = msg.guild.channels.cache.find(c => c.type === 'GUILD_CATEGORY' && c.name === 'Tickets - Responded');
		if (respondedCategory && !respondedCategory.children.first()) {
			respondedCategory.delete();
		}
		let inActionCategory = msg.guild.channels.cache.find(c => c.type === 'GUILD_CATEGORY' && c.name === 'Tickets - In Action');
		if (inActionCategory && !inActionCategory.children.first()) {
			inActionCategory.delete();
		}
		let closedCategory = msg.guild.channels.cache.find(c => c.type === 'GUILD_CATEGORY' && c.name === 'Tickets - Closed');
		if (closedCategory && !closedCategory.children.first()) {
			closedCategory.delete();
		}
	}
}

async function saveSentOsuMatches(msg, oldArgs) {
	let args = [];
	for (let i = 0; i < oldArgs.length; i++) {
		args.push(oldArgs[i]);
	}

	// eslint-disable-next-line no-undef
	const osuApi = new osu.Api(process.env.OSUTOKENV1, {
		// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
		notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
		completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
		parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
	});

	let containsLink = false;
	for (let i = 0; i < args.length; i++) {
		if (args[i].includes('http')) {
			containsLink = true;
		}
		if (args[i].includes('\n')) {
			const split = args[i].split('\n');
			for (let j = 0; j < split.length; j++) {
				args.push(split[j]);
			}
			args.splice(i, 1);
			i--;
		}
	}

	if (!containsLink) {
		return;
	}

	args.forEach(arg => {
		if (arg.replace(/\D/g, '')) {
			osuApi.getMatch({ mp: arg.replace(/\D/g, '') })
				.then(async (match) => {
					await saveOsuMultiScores(match);
				})
				.catch(() => {
					//Nothing
				});
		}
	});
}