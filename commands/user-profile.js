//Import Tables
const { DBDiscordUsers } = require('../dbObjects');
const { populateMsgFromInteraction, logDatabaseQueries } = require('../utils');
const { Permissions } = require('discord.js');

//Require discord.js module
const Discord = require('discord.js');

//Require node-osu module
const osu = require('node-osu');

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
		if (interaction) {
			msg = await populateMsgFromInteraction(interaction);

			await interaction.reply('User profiles will be displayed');
		}

		if (!msg.mentions.users.first()) {
			sendUserEmbed(msg, interaction, msg.author);
		} else {
			const users = [];
			msg.mentions.users.each(user => users.push(user));
			for (let i = 0; i < users.length; i++) {
				sendUserEmbed(msg, interaction, users[i]);
			}
		}

	},
};

async function sendUserEmbed(msg, interaction, user) {
	const discordUser = await DBDiscordUsers.findOne({
		where: { userId: user.id },
	});

	let patreonEmoji = '';
	if (discordUser && discordUser.patreon) {
		patreonEmoji = '<:patreon:959660462222503937> ';
	}

	//Send embed
	const userInfoEmbed = new Discord.MessageEmbed()
		.setColor('#7289DA')
		.setTitle(`${patreonEmoji}${user.username.endsWith('s') || user.username.endsWith('x') ? `${user.username}'` : `${user.username}'s`} profile info card`)
		.setThumbnail(`${user.displayAvatarURL({ format: 'png', dynamic: true })}`)
		.addFields(
			{ name: 'Discord Name', value: `<@${user.id}>` }
		)
		.setTimestamp();

	if (msg.channel.type !== 'DM') {
		const member = await msg.guild.members.fetch(user.id);

		//Get the member roles and push the IDs into an array
		const memberRoles = [];
		member.roles.cache.filter(role => role.name !== '@everyone').each(role => memberRoles.push(`<@&${role.id}>`));

		//18 characters role ID + <@& + > -> 22 characters per role
		//Divide into as many fields as needed
		const roleFieldValues = [];
		let roleFieldValue = '';

		//Fill up roleFieldValue with each role and push it to the array when character limit is reached
		for (let i = 0; i < memberRoles.length; i++) {
			//Character limit will be reached; push to array and reset the helper variable
			if (roleFieldValue.length + 2 + memberRoles[i].length > 1024) {
				roleFieldValues.push(roleFieldValue);
				roleFieldValue = '';
			}

			//Differentiate between empty string and already filled string with some roles
			if (roleFieldValue) {
				roleFieldValue = `${roleFieldValue}, ${memberRoles[i]}`;
			} else {
				roleFieldValue = memberRoles[i];
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
		).setFooter(`Created by ${msg.client.user.username}`, `${msg.client.user.displayAvatarURL({ format: 'png', dynamic: true })}`);
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
				{ name: 'osu! Account', value: `☑️ ${osuUser.name}` },
			);
		} else {
			userInfoEmbed.addFields(
				{ name: 'osu! Account', value: `❌ ${osuUser.name}` },
			);
		}
	}

	if (msg.id) {
		return msg.reply({ embeds: [userInfoEmbed] });
	}
	return interaction.followUp({ embeds: [userInfoEmbed] });
}