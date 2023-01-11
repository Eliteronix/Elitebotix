//Import Tables
const { DBDiscordUsers } = require('../dbObjects');
const { logDatabaseQueries } = require('../utils');
const { Permissions } = require('discord.js');
const { developers } = require('../config.json');

//Require discord.js module
const Discord = require('discord.js');

//Require node-osu module
const osu = require('node-osu');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'user-profile',
	aliases: ['discord-profile', 'u-p'],
	description: 'Sends an info card about the specified user',
	usage: '[@user]',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: [Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.EMBED_LINKS],
	botPermissionsTranslated: 'Send Messages and Embed Links',
	//guildOnly: true,
	//args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'general',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		try {
			await interaction.deferReply();
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			return;
		}

		let users = [];

		if (interaction.options.getUser('user')) {
			users.push(interaction.options.getUser('user'));
		}

		if (interaction.options.getUser('user2')) {
			users.push(interaction.options.getUser('user2'));
		}

		if (interaction.options.getUser('user3')) {
			users.push(interaction.options.getUser('user3'));
		}

		if (interaction.options.getUser('user4')) {
			users.push(interaction.options.getUser('user4'));
		}

		if (interaction.options.getUser('user5')) {
			users.push(interaction.options.getUser('user5'));
		}

		if (!users.length) {
			users.push(interaction.user);
		}

		for (let i = 0; i < users.length; i++) {
			sendUserEmbed(interaction, users[i]);
		}
	},
};

async function sendUserEmbed(interaction, user) {
	const discordUser = await DBDiscordUsers.findOne({
		where: { userId: user.id },
	});

	let customEmoji = '';
	if (discordUser && discordUser.patreon) {
		customEmoji = '<:patreon:959660462222503937> ';
	}

	if (developers.includes(user.id)) {
		customEmoji = '<:devLogo:960689809419010090> ';
	}

	let username = `${user.username}'s`;
	if (user.username.endsWith('s') || user.username.endsWith('x')) {
		username = `${user.username}'`;
	}

	//Send embed
	const userInfoEmbed = new Discord.MessageEmbed()
		.setColor('#7289DA')
		.setTitle(`${customEmoji}${username} profile info card`)
		.setThumbnail(`${user.displayAvatarURL({ format: 'png', dynamic: true })}`)
		.addFields(
			{ name: 'Discord Name', value: `<@${user.id}>` }
		)
		.setTimestamp();

	if (interaction.guildId) {
		const member = await interaction.member.guild.members.cache.get(user.id);

		//Get the member roles and push the IDs and rawPosition related to the id into an array
		const memberRoles = [];
		member.roles.cache.filter(role => role.name !== '@everyone').forEach(role => {
			memberRoles.push({
				id: `<@&${role.id}>`,
				rawPosition: role.rawPosition,
			});
		});
		quicksort(memberRoles);
		//18 characters role ID + <@& + > -> 22 characters per role
		//Divide into as many fields as needed
		const roleFieldValues = [];
		let roleFieldValue = '';

		//Fill up roleFieldValue with each role and push it to the array when character limit is reached
		for (let i = 0; i < memberRoles.length; i++) {
			//Character limit will be reached; push to array and reset the helper variable
			if (roleFieldValue.length + 2 + memberRoles[i].id.length > 1024) {
				roleFieldValues.push(roleFieldValue);
				roleFieldValue = '';
			}

			//Differentiate between empty string and already filled string with some roles
			if (roleFieldValue) {
				roleFieldValue = `${roleFieldValue}, ${memberRoles[i].id}`;
			} else {
				roleFieldValue = memberRoles[i].id;
			}
		}

		//Add the rest of the roles that didn't fill up to 1024 anymore
		if (roleFieldValue) {
			roleFieldValues.push(roleFieldValue);
		}


		//add as many fields as needed to the embed
		if (roleFieldValues[0]) {
			for (let i = 0; i < roleFieldValues.length; i++) {
				let header = '\u200B';
				if (i === 0) {
					header = 'Roles';
				}

				userInfoEmbed.addFields(
					{ name: header, value: roleFieldValues[i] }
				);
			}
		}
		userInfoEmbed.addFields(
			{
				name: 'Created at: ', value: `${user.createdAt.toLocaleString('en-UK', { // en-UK if 24hour format
					day: 'numeric',
					year: 'numeric',
					month: 'long',
					hour: 'numeric',
					minute: 'numeric',
				})}`
			}
		).setFooter({ text: `Created by ${interaction.client.user.username}`, iconURL: `${interaction.client.user.displayAvatarURL({ format: 'png', dynamic: true })}` });
		// add field which shows when the user joined the server
		if (member.joinedAt) {
			userInfoEmbed.addFields(
				{
					name: 'Joined at: ', value: `${member.joinedAt.toLocaleString('en-UK', { // en-UK if 24hour format
						day: 'numeric',
						year: 'numeric',
						month: 'long',
						hour: 'numeric',
						minute: 'numeric',
					})}`
				}
			);
		}
	}
	logDatabaseQueries(4, 'commands/user-profile.js DBDiscordUsers');
	//get discordUser from db

	if (discordUser && discordUser.osuUserId) {
		// eslint-disable-next-line no-undef
		const osuApi = new osu.Api(process.env.OSUTOKENV1, {
			// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
			notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
			completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
			parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
		});

		const osuUser = await osuApi.getUser({ u: discordUser.osuUserId });
		if (discordUser.osuVerified) {
			userInfoEmbed.addFields(
				// link to osu profile page
				{ name: 'osu! Account', value: `☑️ [${osuUser.name}](https://osu.ppy.sh/users/${discordUser.osuUserId})` }
			);
		} else {
			userInfoEmbed.addFields(
				{ name: 'osu! Account', value: `❌ [${osuUser.name}](https://osu.ppy.sh/users/${discordUser.osuUserId})` },
			);
		}
	}

	return interaction.followUp({ embeds: [userInfoEmbed] });
}

function partition(list, start, end) {
	const pivot = list[end];
	let i = start;
	for (let j = start; j < end; j += 1) {
		if (parseFloat(list[j].rawPosition) >= parseFloat(pivot.rawPosition)) {
			[list[j], list[i]] = [list[i], list[j]];
			i++;
		}
	}
	[list[i], list[end]] = [list[end], list[i]];
	return i;
}

function quicksort(list, start = 0, end = undefined) {
	if (end === undefined) {
		end = list.length - 1;
	}
	if (start < end) {
		const p = partition(list, start, end);
		quicksort(list, start, p - 1);
		quicksort(list, p + 1, end);
	}
	return list;
}