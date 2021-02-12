//Import Tables
const { DBDiscordUsers } = require('../dbObjects');

//Require discord.js module
const Discord = require('discord.js');

//Require node-osu module
const osu = require('node-osu');

module.exports = {
	name: 'user-profile',
	aliases: ['discord-profile'],
	description: 'Sends an info card about the specified user',
	usage: '[@user]',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	//guildOnly: true,
	//args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'general',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args) {
		if (!msg.mentions.users.first()) {
			sendUserEmbed(msg, msg.author);
		} else {
			const users = msg.mentions.users.array();
			for (let i = 0; i < users.length; i++) {
				sendUserEmbed(msg, users[i]);
			}
		}

	},
};

async function sendUserEmbed(msg, user) {
	//Send embed
	const userInfoEmbed = new Discord.MessageEmbed()
		.setColor('#7289DA')
		.setTitle(`${user.username}'s profile info card`)
		.setThumbnail(`${user.displayAvatarURL({ format: 'png', dynamic: true })}`)
		.addFields(
			{ name: 'Discord Name', value: `${user.username}#${user.discriminator}` }
		)
		.setTimestamp();

	if (msg.channel.type !== 'dm') {
		const member = await msg.guild.members.fetch(user.id);

		let userDisplayName = user.username;

		if (member.nickname) {
			userDisplayName = member.nickname;
		}

		userInfoEmbed.addFields(
			{ name: 'Nickname', value: `${userDisplayName}` }
		);

		const memberRoles = '<@&' + member.roles.cache.filter(role => role.name !== '@everyone').map(role => role.id).join('>, <@&') + '>';

		if(memberRoles !== '<@&>'){
			userInfoEmbed.addFields(
				{ name: 'Roles', value: `${memberRoles}` }
			);
		}
	}

	//get discordUser from db
	const discordUser = await DBDiscordUsers.findOne({
		where: { userId: user.id },
	});

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
	msg.channel.send(userInfoEmbed);
}