//Require discord.js module
const Discord = require('discord.js');

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

		if(member.nickname){
			userDisplayName = member.nickname;
		}

		const memberRoles = '<@&' + msg.member.roles.cache.filter(role => role.name !== '@everyone').map(role => role.id).join('>, <@&') + '>';

		userInfoEmbed.addFields(
			{ name: 'Nickname', value: `${userDisplayName}` },
			{ name: 'Roles', value: `${memberRoles}` }
		);
	}

	msg.channel.send(userInfoEmbed);
}