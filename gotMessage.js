const { getGuildPrefix, updateServerUserActivity, logDatabaseQueries } = require('./utils');
const fs = require('fs');
const Discord = require('discord.js');
const { PermissionsBitField } = require('discord.js');
const { DBTickets } = require('./dbObjects');
const { developers } = require('./config.json');

module.exports = async function (msg, bancho) {
	//check if the message wasn't sent by the bot itself or another bot
	if (msg.author.bot) {
		return;
	}

	//Update user activity
	updateServerUserActivity(msg);

	//Handle Ticket
	handleTicketStatus(msg);

	if (!developers.includes(msg.author.id)) {
		return;
	}

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

	const guildPrefix = await getGuildPrefix(msg);

	//Define if it is a command with prefix
	//Split the message into an args array
	if (!msg.content.startsWith(guildPrefix)) {
		return;
	}

	let args = msg.content.slice(guildPrefix.length).trim().split(/ +/);

	//Delete the first item from the args array and use it for the command variable
	let commandName = args.shift().toLowerCase();

	//Set the command and check for possible uses of aliases
	let command = msg.client.commands.get(commandName)
		|| msg.client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

	if (!command) {
		return;
	}

	//Check permissions of the bot
	if (msg.channel.type !== Discord.ChannelType.DM) {
		let member = msg.guild.members.cache.get(msg.author.id);

		while (!member) {
			try {
				member = await msg.guild.members.fetch({ user: [msg.author.id], time: 300000 })
					.catch((err) => {
						throw new Error(err);
					});

				member = member.first();
			} catch (e) {
				if (e.message !== 'Members didn\'t arrive in time.') {
					console.error('gotMessage.js | Check bot permissions', e);
					return;
				}
			}
		}

		const botPermissions = msg.channel.permissionsFor(member);
		if (!botPermissions || !botPermissions.has(PermissionsBitField.Flags.SendMessages) || !botPermissions.has(PermissionsBitField.Flags.ReadMessageHistory)) {
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

	process.send(`command ${command.name}`);

	command.execute(msg, args, null, [msg.client, bancho]);
};

async function handleTicketStatus(msg) {
	logDatabaseQueries(3, 'gotMessage.js DBTickets');
	const ticket = await DBTickets.findOne({
		attributes: ['id', 'statusId', 'statusName', 'creatorId', 'additionalParties'],
		where: {
			channelId: msg.channel.id,
			creatorId: msg.author.id
		}
	});

	if (ticket && ticket.statusId !== 0 && ticket.statusId !== 75 && ticket.statusId !== 100) {
		ticket.statusId = 75;
		ticket.statusName = 'Awaiting Response';
		ticket.save();

		//Move the channel to the correct category
		let awaitingResponseCategory = msg.guild.channels.cache.find(c => c.type === Discord.ChannelType.GuildCategory && c.name === 'Tickets - Awaiting Response');
		if (!awaitingResponseCategory) {
			awaitingResponseCategory = await msg.guild.channels.create('Tickets - Awaiting Response', { type: Discord.ChannelType.GuildCategory });
			await awaitingResponseCategory.permissionOverwrites.set([
				{
					id: msg.guild.roles.everyone.id,
					deny: ['VIEW_CHANNEL', 'MANAGE_CHANNELS', 'MANAGE_ROLES', 'CREATE_INSTANT_INVITE', 'MANAGE_WEBHOOKS', 'MANAGE_MESSAGES', 'SEND_TTS_MESSAGES'],
				},
			]);
			let openCategory = msg.guild.channels.cache.find(c => c.type === Discord.ChannelType.GuildCategory && c.name === 'Tickets - Open');
			let position = 0;
			if (openCategory) {
				position++;
			}
			let respondedCategory = msg.guild.channels.cache.find(c => c.type === Discord.ChannelType.GuildCategory && c.name === 'Tickets - Responded');
			if (respondedCategory) {
				position++;
			}
			let inActionCategory = msg.guild.channels.cache.find(c => c.type === Discord.ChannelType.GuildCategory && c.name === 'Tickets - In Action');
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

		let openCategory = msg.guild.channels.cache.find(c => c.type === Discord.ChannelType.GuildCategory && c.name === 'Tickets - Open');
		if (openCategory && !openCategory.children.first()) {
			await openCategory.delete();
		}
		let respondedCategory = msg.guild.channels.cache.find(c => c.type === Discord.ChannelType.GuildCategory && c.name === 'Tickets - Responded');
		if (respondedCategory && !respondedCategory.children.first()) {
			await respondedCategory.delete();
		}
		let inActionCategory = msg.guild.channels.cache.find(c => c.type === Discord.ChannelType.GuildCategory && c.name === 'Tickets - In Action');
		if (inActionCategory && !inActionCategory.children.first()) {
			await inActionCategory.delete();
		}
		let closedCategory = msg.guild.channels.cache.find(c => c.type === Discord.ChannelType.GuildCategory && c.name === 'Tickets - Closed');
		if (closedCategory && !closedCategory.children.first()) {
			await closedCategory.delete();
		}
	}
}