const { DBGuilds } = require('../dbObjects');
const { getGuildPrefix } = require('../utils');

module.exports = {
	name: 'ticket',
	//aliases: ['developer'],
	description: 'Ticket manager',
	//usage: '<bug/feature/request> <description>',
	permissions: 'MANAGE_GUILD',
	permissionsTranslated: 'Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	guildOnly: true,
	args: true,
	cooldown: 30,
	//noCooldownMessage: true,
	tags: 'general',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args) {
		//get guild from db
		const guild = await DBGuilds.findOne({
			where: { guildId: msg.guild.id, ticketsEnabled: true },
		});

		if (guild) {
			if (args[0].toLowerCase() === 'close') {
				const ticket = await DBTickets.findOne({
					where: { guildId: msg.guild.id, channelId: msg.channel.id }
				});
			}
		} else {
			const guildPrefix = await getGuildPrefix(msg);
			return msg.channel.send(`Tickets aren't enabled on this server.\nStaff can enable tickets by using \`${guildPrefix}toggletickets\`.`);
		}
	},
};