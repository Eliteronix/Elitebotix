const { Permissions } = require('discord.js');
const { DBDiscordUsers, DBBirthdayGuilds } = require('../dbObjects');
const { Op } = require('sequelize');

module.exports = {
	name: 'birthday',
	// aliases: ['dice', 'ouo'],
	description: 'Set your birthday',
	usage: '<set> <month> <date> | <enable> | <disable>',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: [Permissions.FLAGS.SEND_MESSAGES],
	botPermissionsTranslated: 'Send Messages',
	guildOnly: true,
	// args: true,
	cooldown: 10,
	// noCooldownMessage: true,
	tags: 'misc',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		if (msg) {
			return msg.reply('please use `/birthday` instead');
		}

		if (interaction.options._subcommand === 'set') {
			let date = new Date();
			date.setUTCSeconds(0);
			date.setUTCHours(0);
			date.setUTCMinutes(0);
			date.setUTCMilliseconds(0);
			date.setUTCFullYear(0);

			for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
				if (interaction.options._hoistedOptions[i].name === 'date') {
					date.setUTCDate(interaction.options._hoistedOptions[i].value);
				} else if (interaction.options._hoistedOptions[i].name === 'month') {
					date.setUTCMonth(interaction.options._hoistedOptions[i].value - 1);
				}
			}

			let user = await DBDiscordUsers.findOne({
				where: {
					userId: interaction.member.user.id,
				},
			});

			if (!user) {
				user = await DBDiscordUsers.create({
					userId: interaction.member.user.id,
				});
			}

			user.birthday = date;
			user.save();

			let guilds = await DBBirthdayGuilds.findAll({
				where: {
					userId: interaction.member.user.id,
				}
			});

			let now = new Date();

			while (date < now) {
				date.setUTCFullYear(date.getUTCFullYear() + 1);
			}

			for (let i = 0; i < guilds.length; i++) {
				guilds[i].birthdayTime = date;
				await guilds[i].save();
			}

			// date string in the following format "Full Month Name, Day"
			let dateString = date.toLocaleDateString('en-US', {
				month: 'long',
				day: 'numeric',
			});
			return interaction.reply({ content: `Your birthday has been set for \`${dateString}\``, ephemeral: true });
		} else if (interaction.options._subcommand === 'enable') {

			let currentGuild = await DBBirthdayGuilds.findOne({
				where: {
					guildId: interaction.guild.id,
					userId: interaction.member.user.id,
				},
			});

			if (currentGuild) {
				return interaction.reply({ content: `You are already sharing your birthday on ${interaction.guild.name}`, ephemeral: true });
			}

			let dbDiscordUser = await DBDiscordUsers.findOne({
				where: {
					userId: interaction.member.user.id,
					birthday: {
						[Op.ne]: null,
					}
				},
			});

			if (!dbDiscordUser || dbDiscordUser && !dbDiscordUser.birthday) {
				return interaction.reply({ content: 'You currently don\'t have your birthday set. Please set your birthday first by using `/birthday set`', ephemeral: true });
			}

			let now = new Date();
			let nextBirthday = dbDiscordUser.birthday;

			while (nextBirthday < now) {
				nextBirthday.setUTCFullYear(nextBirthday.getUTCFullYear() + 1);
			}

			await DBBirthdayGuilds.create({
				guildId: interaction.guild.id,
				userId: interaction.member.user.id,
				birthdayTime: nextBirthday,
			});

			return interaction.reply({ content: `Your birthday will now be shared on ${interaction.guild.name}`, ephemeral: true });
		} else if (interaction.options._subcommand === 'disable') {
			let currentGuild = await DBBirthdayGuilds.findOne({
				where: {
					guildId: interaction.guild.id,
					userId: interaction.member.user.id,
				},
			});

			//No guild found
			if (!currentGuild) {
				return interaction.reply({ content: 'You were not sharing your birthday on this server.', ephemeral: true });
			}

			//Delete guild
			await currentGuild.destroy();
			return interaction.reply({ content: `Your birthday will no longer be shared on ${interaction.guild.name}`, ephemeral: true });
		}
	}
};