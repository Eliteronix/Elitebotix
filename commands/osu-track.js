const { DBProcessQueue } = require('../dbObjects');
const osu = require('node-osu');
const { getIDFromPotentialOsuLink } = require('../utils');
const { Permissions } = require('discord.js');

module.exports = {
	name: 'osu-track',
	// aliases: ['developer', 'donate', 'support'],
	description: 'Sends info about the scores achieved by the user',
	usage: '<add/list/remove> <username>',
	permissions: Permissions.FLAGS.MANAGE_GUILD,
	permissionsTranslated: 'Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	guildOnly: true,
	args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'osu',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args) {
		if (args[0].toLowerCase() === 'list') {
			const trackingList = await DBProcessQueue.findAll({
				where: { task: 'osu-track' }
			});

			let trackingListString = '';

			for (let i = 0; i < trackingList.length; i++) {
				if (!trackingList[i].additions.startsWith(msg.channel.id)) {
					trackingList.splice(i, 1);
					i--;
				} else {
					const args = trackingList[i].additions.split(';');
					trackingListString += `\n\`${args[2]}\``;
				}
			}

			return msg.reply(trackingListString || 'No osu! tracking tasks found in this channel.', { split: true });
		} else if (args[0].toLowerCase() === 'remove') {
			args.shift();
			if (args[1]) {
				return msg.reply('Please specify which user shouldn\'t be tracked anymore.');
			}

			const trackingList = await DBProcessQueue.findAll({
				where: { task: 'osu-track' }
			});

			for (let i = 0; i < trackingList.length; i++) {
				if (trackingList[i].additions.startsWith(msg.channel.id) && trackingList[i].additions.toLowerCase().replace(/ /g, '_').includes(`;${args.join('_').toLowerCase()}`)) {
					trackingList[i].destroy();
					return msg.reply('The specified tracker has been removed.');
				}
			}

			return msg.reply('Couldn\'t find an osu! tracker to remove.');
		} else if (args[0].toLowerCase() === 'add') {
			args.shift();
		}

		// eslint-disable-next-line no-undef
		const osuApi = new osu.Api(process.env.OSUTOKENV1, {
			// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
			notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
			completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
			parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
		});

		osuApi.getUser({ u: getIDFromPotentialOsuLink(args.join('_')) })
			.then(async (user) => {
				//Check for duplicates
				const duplicates = await DBProcessQueue.findAll({
					where: { task: 'osu-track' }
				});

				for (let i = 0; i < duplicates.length; i++) {
					if (!duplicates[i].additions.startsWith(`${msg.channel.id};${user.id}`)) {
						duplicates.splice(i, 1);
						i--;
					}
				}

				if (duplicates.length === 0) {
					let date = new Date();

					date.setUTCMinutes(date.getUTCMinutes() + 15);

					DBProcessQueue.create({ guildId: 'None', task: 'osu-track', priority: 8, additions: `${msg.channel.id};${user.id};${user.name}`, date: date });

					msg.reply(`The user ${user.name} will be tracked in this channel.`);
				} else {
					msg.reply(`The user ${user.name} is already being tracked in this channel.`);
				}
			})
			.catch(err => {
				if (err.message === 'Not found') {
					msg.reply(`Could not find user \`${args.join('_').replace(/`/g, '')}\`. (Use "_" instead of spaces)`);
				} else {
					console.log(err);
				}
			});
	},
};